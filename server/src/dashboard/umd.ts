import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { DataSource } from 'typeorm';
import { FilesService, type UploadedFile } from '../files/files.service.js';

import { type Row } from './schema.js';

export class DashboardUmd {
  constructor(
    private readonly db: DataSource,
    private readonly files: FilesService,
  ) {}

  private parseJsonObject(value: unknown, label: string): Row {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error();
      return parsed as Row;
    } catch {
      throw new BadRequestException(`${label} 必须是 JSON 对象`);
    }
  }

  private parseUmdComponents(value: unknown, manifest: Row): Row[] {
    let parsed: unknown = value;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch {
        throw new BadRequestException('components 必须是 JSON 数组');
      }
    }
    if (!Array.isArray(parsed))
      parsed = manifest.componentsDetailed ?? manifest.components;
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 100) {
      throw new BadRequestException('UMD 组件数量必须在 1 到 100 之间');
    }
    const map =
      manifest.componentsMap && typeof manifest.componentsMap === 'object'
        ? (manifest.componentsMap as Row)
        : {};
    return parsed.map((item) => {
      const source = typeof item === 'string' ? { name: item } : (item as Row);
      const name = String(source?.name ?? '').trim();
      if (!/^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(name))
        throw new BadRequestException(`组件名称不合法: ${name || '(空)'}`);
      return {
        name,
        title: String(source.zhName ?? source.title ?? name)
          .trim()
          .slice(0, 255),
        description: String(source.description ?? map[name] ?? '')
          .trim()
          .slice(0, 2000),
        icon: String(source.icon ?? 'fas fa-cube')
          .trim()
          .slice(0, 255),
      };
    });
  }

  private umdAssetUrl(versionId: string, fileName: string): string {
    return `/api/dashboard-assets/${versionId}/${encodeURIComponent(fileName)}`;
  }

  async importUmd(
    userId: string,
    upload: UploadedFile | undefined,
    input: Row,
  ) {
    if (!upload?.buffer?.length)
      throw new BadRequestException('请选择 UMD JavaScript 文件');
    if (!basename(upload.originalname).toLowerCase().endsWith('.js'))
      throw new BadRequestException('只允许导入 .js 文件');
    const manifest = this.parseJsonObject(input.manifest, 'manifest');
    const rawModuleKey = String(
      input.moduleKey ??
        manifest.libName ??
        manifest.name ??
        basename(upload.originalname, '.js'),
    ).trim();
    const moduleKey = rawModuleKey
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
    if (!moduleKey) throw new BadRequestException('moduleKey 不能为空');
    const version = String(input.version ?? manifest.version ?? '')
      .trim()
      .slice(0, 64);
    if (!/^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$/.test(version))
      throw new BadRequestException('版本号不合法');
    const name = String(
      input.name ?? manifest.zhName ?? manifest.name ?? moduleKey,
    )
      .trim()
      .slice(0, 255);
    const components = this.parseUmdComponents(input.components, manifest);

    const duplicate: Row[] = await this.db.query(
      `SELECT v.id FROM dashboard_umd_versions v JOIN dashboard_umd_packages p ON p.id = v.package_id WHERE p.module_key = ? AND v.version = ?`,
      [moduleKey, version],
    );
    if (duplicate.length)
      throw new ConflictException(`模块 ${moduleKey} 的版本 ${version} 已存在`);

    const stored = await this.files.store(userId, upload);
    const packageId = randomUUID();
    const versionId = randomUUID();
    const assetUrl = this.umdAssetUrl(versionId, stored.originalName);
    try {
      const result = await this.db.transaction(async (manager) => {
        await manager.query(
          `INSERT INTO dashboard_umd_packages (id, module_key, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [packageId, moduleKey, name],
        );
        const packages: Row[] = await manager.query(
          'SELECT id FROM dashboard_umd_packages WHERE module_key = ?',
          [moduleKey],
        );
        const actualPackageId = packages[0].id;
        await manager.query(
          'UPDATE dashboard_umd_versions SET is_current = false WHERE package_id = ?',
          [actualPackageId],
        );
        await manager.query(
          `INSERT INTO dashboard_umd_versions (id, package_id, version, file_id, manifest, created_by, is_current) VALUES (?, ?, ?, ?, ?, ?, true)`,
          [
            versionId,
            actualPackageId,
            version,
            stored.id,
            JSON.stringify(manifest),
            userId,
          ],
        );
        for (const [index, component] of components.entries()) {
          const kvid = `umd-${createHash('sha256').update(`${moduleKey}:${component.name}`).digest('hex').slice(0, 28)}`;
          await manager.query(
            `INSERT INTO dashboard_functions
              (kvid, title, handler, remark, parameters, render_type, source_type, source_module, source_url, source_component, icon, sort_order, is_active)
              VALUES (?, ?, ?, ?, '{}', 'umd', 'umd', ?, ?, ?, ?, ?, true)
              ON DUPLICATE KEY UPDATE title = VALUES(title), handler = VALUES(handler), remark = VALUES(remark), render_type = 'umd', source_type = 'umd', source_module = VALUES(source_module), source_url = VALUES(source_url), source_component = VALUES(source_component), icon = VALUES(icon), is_active = true`,
            [
              kvid,
              component.title,
              `<${component.name} />`,
              component.description || null,
              moduleKey,
              assetUrl,
              component.name,
              component.icon,
              index,
            ],
          );
        }
        return {
          moduleKey,
          name,
          version,
          versionId,
          file: stored,
          sourceUrl: assetUrl,
          imported: components.length,
        };
      });
      return result;
    } catch (error) {
      await this.files.removeStored(stored.id);
      if ((error as { code?: string })?.code === 'ER_DUP_ENTRY')
        throw new ConflictException(
          `模块 ${moduleKey} 的版本 ${version} 已存在`,
        );
      throw error;
    }
  }

  async umdVersions(moduleKey?: string) {
    const values: unknown[] = [];
    const where = moduleKey ? 'WHERE p.module_key = ?' : '';
    if (moduleKey) values.push(moduleKey);
    const rows: Row[] = await this.db.query(
      `SELECT v.id, p.module_key, p.name, v.version, v.file_id, f.original_name, f.stored_name, f.size, f.sha256, v.manifest, v.is_current, v.created_by, v.created_at FROM dashboard_umd_versions v JOIN dashboard_umd_packages p ON p.id = v.package_id JOIN stored_files f ON f.id = v.file_id ${where} ORDER BY p.name, v.created_at DESC`,
      values,
    );
    return Promise.all(
      rows.map(async ({ stored_name, ...row }) => ({
        ...row,
        manifest:
          typeof row.manifest === 'string'
            ? JSON.parse(row.manifest)
            : (row.manifest ?? {}),
        is_current: Boolean(row.is_current),
        file_available: await this.files.isStoredFileAvailable(
          stored_name,
          Number(row.size),
        ),
        sourceUrl: this.umdAssetUrl(row.id, row.original_name),
      })),
    );
  }

  async activateUmdVersion(versionId: string) {
    const rows: Row[] = await this.db.query(
      `SELECT v.id, v.package_id, v.version, p.module_key, f.original_name, f.stored_name, f.size FROM dashboard_umd_versions v JOIN dashboard_umd_packages p ON p.id = v.package_id JOIN stored_files f ON f.id = v.file_id WHERE v.id = ?`,
      [versionId],
    );
    if (!rows.length) throw new NotFoundException('UMD 版本不存在');
    const version = rows[0];
    if (
      !(await this.files.isStoredFileAvailable(
        version.stored_name,
        Number(version.size),
      ))
    ) {
      throw new NotFoundException(
        '本地 UMD 文件缺失或大小不匹配，无法启用此版本',
      );
    }
    const assetUrl = this.umdAssetUrl(version.id, version.original_name);
    await this.db.transaction(async (manager) => {
      await manager.query(
        'UPDATE dashboard_umd_versions SET is_current = false WHERE package_id = ?',
        [version.package_id],
      );
      await manager.query(
        'UPDATE dashboard_umd_versions SET is_current = true WHERE id = ?',
        [version.id],
      );
      await manager.query(
        `UPDATE dashboard_functions SET source_url = ? WHERE render_type = 'umd' AND source_module = ?`,
        [assetUrl, version.module_key],
      );
    });
    return {
      versionId,
      moduleKey: version.module_key,
      version: version.version,
      sourceUrl: assetUrl,
    };
  }

  async openUmdAsset(versionId: string) {
    const rows: Row[] = await this.db.query(
      'SELECT file_id FROM dashboard_umd_versions WHERE id = ?',
      [versionId],
    );
    if (!rows.length) throw new NotFoundException('UMD 版本不存在');
    return this.files.openStored(rows[0].file_id);
  }
}
