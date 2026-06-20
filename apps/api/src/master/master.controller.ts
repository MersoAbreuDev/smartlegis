import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateAdminDto,
  CreateBackupDto,
  CreateBrandingLogoUploadDto,
  CreateDomainDto,
  ImpersonateTenantDto,
  CreateTenantMasterDto,
  RestoreBackupDto,
  SecurityActionDto,
  UpdateAdminDto,
  UpdateDomainStatusDto,
  UpdateTenantMasterDto,
  UpdateTenantStatusDto,
  UpsertBrandingDto,
  UpsertLicenseDto,
  UpsertSettingsDto,
  ListAuditLogsQueryDto
} from './dto';
import { MasterService } from './master.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MASTER)
@Controller('master')
export class MasterController {
  constructor(private readonly service: MasterService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('profile')
  profile(@CurrentUser() user: { sub: string }) {
    return this.service.profile(user.sub);
  }

  @Get('tenants')
  listTenants(@Query('includeDeleted') includeDeleted?: string) {
    return this.service.listTenants(includeDeleted === 'true');
  }

  @Post('tenants')
  createTenant(@Body() dto: CreateTenantMasterDto, @CurrentUser() user: { sub: string }) {
    return this.service.createTenant(dto, user.sub);
  }

  @Patch('tenants/:id')
  updateTenant(@Param('id') id: string, @Body() dto: UpdateTenantMasterDto, @CurrentUser() user: { sub: string }) {
    return this.service.updateTenant(id, dto, user.sub);
  }

  @Patch('tenants/:id/status')
  setTenantStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto, @CurrentUser() user: { sub: string }) {
    return this.service.setTenantStatus(id, dto, user.sub);
  }

  @Delete('tenants/:id')
  softDeleteTenant(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.softDeleteTenant(id, user.sub);
  }

  @Post('tenants/:id/restore')
  restoreTenant(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.restoreTenant(id, user.sub);
  }

  @Get('licenses')
  listLicenses() {
    return this.service.listLicenses();
  }

  @Put('tenants/:tenantId/license')
  upsertLicense(@Param('tenantId') tenantId: string, @Body() dto: UpsertLicenseDto, @CurrentUser() user: { sub: string }) {
    return this.service.upsertLicense(tenantId, dto, user.sub);
  }

  @Get('admins')
  listAdmins() {
    return this.service.listAdmins();
  }

  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto, @CurrentUser() user: { sub: string }) {
    return this.service.createAdmin(dto, user.sub);
  }

  @Patch('admins/:id')
  updateAdmin(@Param('id') id: string, @Body() dto: UpdateAdminDto, @CurrentUser() user: { sub: string }) {
    return this.service.updateAdmin(id, dto, user.sub);
  }

  @Delete('admins/:id')
  deleteAdmin(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.deleteAdmin(id, user.sub);
  }

  @Get('domains')
  listDomains() {
    return this.service.listDomains();
  }

  @Post('domains')
  createDomain(@Body() dto: CreateDomainDto, @CurrentUser() user: { sub: string }) {
    return this.service.createDomain(dto, user.sub);
  }

  @Patch('domains/:id/status')
  updateDomainStatus(@Param('id') id: string, @Body() dto: UpdateDomainStatusDto, @CurrentUser() user: { sub: string }) {
    return this.service.updateDomainStatus(id, dto, user.sub);
  }

  @Delete('domains/:id')
  deleteDomain(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.deleteDomain(id, user.sub);
  }

  @Get('tenants/:tenantId/branding')
  getBranding(@Param('tenantId') tenantId: string) {
    return this.service.getBranding(tenantId);
  }

  @Put('tenants/:tenantId/branding')
  upsertBranding(@Param('tenantId') tenantId: string, @Body() dto: UpsertBrandingDto, @CurrentUser() user: { sub: string }) {
    return this.service.upsertBranding(tenantId, dto, user.sub);
  }

  @Post('tenants/:tenantId/branding/logos')
  uploadBrandingLogo(@Param('tenantId') tenantId: string, @Body() dto: CreateBrandingLogoUploadDto, @CurrentUser() user: { sub: string }) {
    return this.service.uploadBrandingLogo(tenantId, dto, user.sub);
  }

  @Get('audit-logs')
  listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.service.listAuditLogs(query);
  }

  @Get('audit-logs/actors')
  listAuditActors() {
    return this.service.listAuditActors();
  }

  @Post('security/actions')
  applySecurityAction(@Body() dto: SecurityActionDto, @CurrentUser() user: { sub: string }) {
    return this.service.applySecurityAction(dto, user.sub);
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('backups')
  listBackups() {
    return this.service.listBackups();
  }

  @Post('backups')
  createBackup(@Body() dto: CreateBackupDto, @CurrentUser() user: { sub: string }) {
    return this.service.createBackup(dto, user.sub);
  }

  @Post('backups/restore')
  restoreBackup(@Body() dto: RestoreBackupDto, @CurrentUser() user: { sub: string }) {
    return this.service.restoreBackup(dto, user.sub);
  }

  @Delete('backups/:id')
  deleteBackup(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.service.deleteBackup(id, user.sub);
  }

  @Get('settings')
  listSettings() {
    return this.service.listSettings();
  }

  @Put('settings')
  upsertSettings(@Body() dto: UpsertSettingsDto, @CurrentUser() user: { sub: string }) {
    return this.service.upsertSettings(dto, user.sub);
  }

  @Get('tenants/:tenantId/impersonate-options')
  impersonateOptions(@Param('tenantId') tenantId: string) {
    return this.service.impersonateOptions(tenantId);
  }

  @Post('tenants/:tenantId/impersonate')
  impersonateTenant(@Param('tenantId') tenantId: string, @Body() dto: ImpersonateTenantDto, @CurrentUser() user: { sub: string }) {
    return this.service.impersonateTenant(tenantId, dto, user.sub);
  }
}
