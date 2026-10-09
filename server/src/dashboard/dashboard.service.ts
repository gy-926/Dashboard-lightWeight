import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FilesService } from '../files/files.service.js';
import { DashboardRecords } from './records.js';
import { DashboardUmd } from './umd.js';
import { DashboardRuntime } from './runtime.js';
import { DashboardOrganization } from './organization.js';
import { DashboardAccess } from './access.js';

/** 保持控制器的调用契约；各领域的实现独立维护。 */
@Injectable()
export class DashboardService {
  private readonly records: DashboardRecords;
  private readonly umd: DashboardUmd;
  private readonly runtimeService: DashboardRuntime;
  private readonly organization: DashboardOrganization;
  private readonly access: DashboardAccess;

  constructor(db: DataSource, files: FilesService) {
    this.records = new DashboardRecords(db);
    this.umd = new DashboardUmd(db, files);
    this.runtimeService = new DashboardRuntime(db);
    this.organization = new DashboardOrganization(db);
    this.access = new DashboardAccess(db, this.records, this.organization);
  }

  list(...args: Parameters<DashboardRecords['list']>) {
    return this.records.list(...args);
  }

  one(...args: Parameters<DashboardRecords['one']>) {
    return this.records.one(...args);
  }

  upsert(...args: Parameters<DashboardRecords['upsert']>) {
    return this.records.upsert(...args);
  }

  patchFunction(...args: Parameters<DashboardRecords['patchFunction']>) {
    return this.records.patchFunction(...args);
  }

  remove(...args: Parameters<DashboardRecords['remove']>) {
    return this.records.remove(...args);
  }

  bulkMenus(...args: Parameters<DashboardRecords['bulkMenus']>) {
    return this.records.bulkMenus(...args);
  }

  importFunctions(...args: Parameters<DashboardRecords['importFunctions']>) {
    return this.records.importFunctions(...args);
  }

  importUmd(...args: Parameters<DashboardUmd['importUmd']>) {
    return this.umd.importUmd(...args);
  }

  umdVersions(...args: Parameters<DashboardUmd['umdVersions']>) {
    return this.umd.umdVersions(...args);
  }

  activateUmdVersion(...args: Parameters<DashboardUmd['activateUmdVersion']>) {
    return this.umd.activateUmdVersion(...args);
  }

  openUmdAsset(...args: Parameters<DashboardUmd['openUmdAsset']>) {
    return this.umd.openUmdAsset(...args);
  }

  userRoles(...args: Parameters<DashboardRuntime['userRoles']>) {
    return this.runtimeService.userRoles(...args);
  }

  runtime(...args: Parameters<DashboardRuntime['runtime']>) {
    return this.runtimeService.runtime(...args);
  }

  autostart(...args: Parameters<DashboardRuntime['autostart']>) {
    return this.runtimeService.autostart(...args);
  }

  menuConfig(...args: Parameters<DashboardRecords['menuConfig']>) {
    return this.records.menuConfig(...args);
  }

  permissions(...args: Parameters<DashboardAccess['permissions']>) {
    return this.access.permissions(...args);
  }

  departments(...args: Parameters<DashboardOrganization['departments']>) {
    return this.organization.departments(...args);
  }

  saveDepartment(...args: Parameters<DashboardOrganization['saveDepartment']>) {
    return this.organization.saveDepartment(...args);
  }

  deleteDepartment(
    ...args: Parameters<DashboardOrganization['deleteDepartment']>
  ) {
    return this.organization.deleteDepartment(...args);
  }

  assignUserDepartment(
    ...args: Parameters<DashboardOrganization['assignUserDepartment']>
  ) {
    return this.organization.assignUserDepartment(...args);
  }

  setUserAppRole(...args: Parameters<DashboardAccess['setUserAppRole']>) {
    return this.access.setUserAppRole(...args);
  }

  addDepartmentUsers(
    ...args: Parameters<DashboardOrganization['addDepartmentUsers']>
  ) {
    return this.organization.addDepartmentUsers(...args);
  }

  replaceBindings(...args: Parameters<DashboardAccess['replaceBindings']>) {
    return this.access.replaceBindings(...args);
  }

  replaceFunctionRoles(
    ...args: Parameters<DashboardAccess['replaceFunctionRoles']>
  ) {
    return this.access.replaceFunctionRoles(...args);
  }

  replaceFunctionDepartments(
    ...args: Parameters<DashboardAccess['replaceFunctionDepartments']>
  ) {
    return this.access.replaceFunctionDepartments(...args);
  }

  replaceFunctionAccess(
    ...args: Parameters<DashboardAccess['replaceFunctionAccess']>
  ) {
    return this.access.replaceFunctionAccess(...args);
  }
}
