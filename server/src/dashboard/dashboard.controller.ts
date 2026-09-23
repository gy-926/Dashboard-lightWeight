import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AccessTokenGuard, type AuthenticatedRequest } from '../auth/access-token.guard.js';
import type { UploadedFile as Upload } from '../files/files.service.js';
import { UserRole } from '../users/entities/user.entity.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard-functions')
@UseGuards(AccessTokenGuard)
export class DashboardFunctionsController {
  constructor(private readonly dashboard: DashboardService) {}
  private admin(request: AuthenticatedRequest) {
    if (request.authRole !== UserRole.SuperAdmin) throw new ForbiddenException('只有超级管理员可以维护功能数据');
  }
  @Get() list(@Req() request: AuthenticatedRequest) { this.admin(request); return this.dashboard.list('functions'); }
  @Post() @HttpCode(200) save(@Req() request: AuthenticatedRequest, @Body() body: unknown) { this.admin(request); return this.dashboard.upsert('functions', body); }
  @Post('import') @HttpCode(200) import(@Req() request: AuthenticatedRequest, @Body() body: { items?: unknown }) { this.admin(request); return this.dashboard.importFunctions(body?.items); }
  @Post('import-umd') @HttpCode(200) @UseInterceptors(FileInterceptor('file'))
  importUmd(@Req() request: AuthenticatedRequest, @UploadedFile() file: Upload | undefined, @Body() body: Record<string, string>) { this.admin(request); return this.dashboard.importUmd(request.authUserId, file, body); }
  @Get('umd-versions') versions(@Req() request: AuthenticatedRequest, @Query('moduleKey') moduleKey?: string) { this.admin(request); return this.dashboard.umdVersions(moduleKey); }
  @Put('umd-versions/:id/activate') activateVersion(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) { this.admin(request); return this.dashboard.activateUmdVersion(id); }
  @Put(':kvid/roles') replaceFunctionRoles(@Req() request: AuthenticatedRequest, @Param('kvid') kvid: string, @Body() body: { roleKvids?: unknown }) { this.admin(request); return this.dashboard.replaceFunctionRoles(kvid, body?.roleKvids); }
  @Put(':kvid/departments') replaceFunctionDepartments(@Req() request: AuthenticatedRequest, @Param('kvid') kvid: string, @Body() body: { departmentIds?: unknown }) { this.admin(request); return this.dashboard.replaceFunctionDepartments(kvid, body?.departmentIds); }
  @Put(':kvid/access') replaceFunctionAccess(@Req() request: AuthenticatedRequest, @Param('kvid') kvid: string, @Body() body: { roleKvids?: unknown; departmentIds?: unknown }) { this.admin(request); return this.dashboard.replaceFunctionAccess(kvid, body?.roleKvids, body?.departmentIds); }
  @Patch(':kvid') patch(@Req() request: AuthenticatedRequest, @Param('kvid') kvid: string, @Body() body: unknown) { this.admin(request); return this.dashboard.patchFunction(kvid, body); }
  @Delete(':kvid') remove(@Req() request: AuthenticatedRequest, @Param('kvid') kvid: string) { this.admin(request); return this.dashboard.remove('functions', kvid); }
}

@Controller('dashboard-assets')
export class DashboardAssetsController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get(':versionId/:fileName')
  async asset(@Param('versionId', ParseUUIDPipe) versionId: string, @Res() response: Response) {
    const { file, stream } = await this.dashboard.openUmdAsset(versionId);
    response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    response.setHeader('Content-Length', String(file.size));
    response.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    stream.on('error', error => response.destroy(error));
    stream.pipe(response);
  }
}

@Controller('dashboard-admin')
@UseGuards(AccessTokenGuard)
export class DashboardAdminController {
  constructor(private readonly dashboard: DashboardService) {}
  private isAdmin(request: AuthenticatedRequest): boolean { return request.authRole === UserRole.SuperAdmin; }
  private admin(request: AuthenticatedRequest) { if (!this.isAdmin(request)) throw new ForbiddenException('只有超级管理员可以执行此操作'); }

  @Get('me/roles') roles(@Req() request: AuthenticatedRequest) { return this.dashboard.userRoles(request.authUserId); }
  @Get('menus/runtime') runtime(@Req() request: AuthenticatedRequest, @Query('internalCode') code: string) { return this.dashboard.runtime(code, request.authUserId, this.isAdmin(request)); }
  @Get('menus/autostart') autostart(@Req() request: AuthenticatedRequest, @Query('menuRootKvid') kvid: string) { return this.dashboard.autostart(kvid, request.authUserId, this.isAdmin(request)); }

  @Get('admin/menu-config') menuConfig(@Req() request: AuthenticatedRequest) { this.admin(request); return this.dashboard.menuConfig(); }
  @Post('admin/menu-roots') @HttpCode(200) saveRoot(@Req() request: AuthenticatedRequest, @Body() body: unknown) { this.admin(request); return this.dashboard.upsert('roots', body); }
  @Delete('admin/menu-roots/:kvid') deleteRoot(@Req() request: AuthenticatedRequest, @Param('kvid') kvid: string) { this.admin(request); return this.dashboard.remove('roots', kvid); }
  @Post('admin/menus/bulk') @HttpCode(200) bulkMenus(@Req() request: AuthenticatedRequest, @Body() body: { items?: unknown }) { this.admin(request); return this.dashboard.bulkMenus(body?.items); }
  @Post('admin/menus') @HttpCode(200) saveMenu(@Req() request: AuthenticatedRequest, @Body() body: unknown) { this.admin(request); return this.dashboard.upsert('menus', body); }
  @Delete('admin/menus/:kvid') deleteMenu(@Req() request: AuthenticatedRequest, @Param('kvid') kvid: string) { this.admin(request); return this.dashboard.remove('menus', kvid); }
  @Get('admin/permissions') permissions(@Req() request: AuthenticatedRequest) { this.admin(request); return this.dashboard.permissions(); }
  @Get('admin/departments') departments(@Req() request: AuthenticatedRequest) { this.admin(request); return this.dashboard.departments(); }
  @Post('admin/departments') @HttpCode(200) saveDepartment(@Req() request: AuthenticatedRequest, @Body() body: unknown) { this.admin(request); return this.dashboard.saveDepartment(body); }
  @Delete('admin/departments/:id') deleteDepartment(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) { this.admin(request); return this.dashboard.deleteDepartment(id); }
  @Put('admin/departments/:id/users') addDepartmentUsers(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() body: { userIds?: unknown }) { this.admin(request); return this.dashboard.addDepartmentUsers(id, body?.userIds); }
  @Post('admin/roles') @HttpCode(200) saveRole(@Req() request: AuthenticatedRequest, @Body() body: unknown) { this.admin(request); return this.dashboard.upsert('roles', body); }
  @Delete('admin/roles/:kvid') deleteRole(@Req() request: AuthenticatedRequest, @Param('kvid') kvid: string) { this.admin(request); return this.dashboard.remove('roles', kvid); }
  @Put('admin/roles/:kvid/functions') replaceRoleFunctions(@Req() request: AuthenticatedRequest, @Param('kvid') kvid: string, @Body() body: {functionKvids?: unknown}) { this.admin(request); return this.dashboard.replaceBindings('role', kvid, body?.functionKvids); }
  @Put('admin/users/:userId/roles') replaceUserRoles(@Req() request: AuthenticatedRequest, @Param('userId') userId: string, @Body() body: {roleKvids?: unknown}) { this.admin(request); return this.dashboard.replaceBindings('user', userId, body?.roleKvids); }
  @Put('admin/users/:userId/app-role') setUserAppRole(@Req() request: AuthenticatedRequest, @Param('userId', ParseUUIDPipe) userId: string, @Body() body: { role?: unknown }) { this.admin(request); return this.dashboard.setUserAppRole(userId, body?.role); }
  @Put('admin/users/:userId/department') assignUserDepartment(@Req() request: AuthenticatedRequest, @Param('userId', ParseUUIDPipe) userId: string, @Body() body: { departmentId?: unknown }) { this.admin(request); return this.dashboard.assignUserDepartment(userId, body?.departmentId); }
}
