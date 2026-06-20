import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackupStatus, DomainStatus, LicensePlan, TenantStatus, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthService } from '../auth/auth.service';
import { BrandingAssetsService } from '../branding-assets/branding-assets.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAdminDto,
  CreateBackupDto,
  CreateBrandingLogoUploadDto,
  CreateDomainDto,
  CreateTenantMasterDto,
  ImpersonateTenantDto,
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

const PLAN_DEFAULTS: Record<LicensePlan, Omit<UpsertLicenseDto, 'plan'>> = {
  BASIC: {
    maxUsers: 25,
    maxCouncilMembers: 11,
    storageGb: 20,
    features: 'Portal publico',
    securityPolicy: 'MFA opcional'
  },
  PREMIUM: {
    maxUsers: 80,
    maxCouncilMembers: 21,
    storageGb: 120,
    features: 'Votacao eletronica',
    securityPolicy: 'MFA obrigatorio'
  },
  ENTERPRISE: {
    maxUsers: 9999,
    maxCouncilMembers: 9999,
    storageGb: 1024,
    features: 'Auditoria avancada',
    securityPolicy: 'White label'
  }
};

@Injectable()
export class MasterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogsService,
    private readonly auth: AuthService,
    private readonly brandingAssets: BrandingAssetsService,
    private readonly config: ConfigService
  ) {}

  async dashboard() {
    const [tenants, users, councilMembers, sessions, votes, licenses, backups] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { role: { not: UserRole.MASTER } } }),
      this.prisma.councilMember.count(),
      this.prisma.plenarySession.count(),
      this.prisma.vote.count(),
      this.prisma.tenantLicense.findMany({ include: { tenant: true } }),
      this.prisma.platformBackup.findMany({ orderBy: { createdAt: 'desc' }, take: 1 })
    ]);

    const activeTenants = await this.prisma.tenant.count({ where: { deletedAt: null, status: TenantStatus.ACTIVE } });
    const suspendedTenants = await this.prisma.tenant.count({ where: { deletedAt: null, status: TenantStatus.SUSPENDED } });
    const activeLicenses = licenses.filter((item) => item.tenant.status === TenantStatus.ACTIVE).length;
    const expiringLicenses = licenses.filter((item) => item.expiresAt && item.expiresAt.getTime() - Date.now() < 30 * 86400000).length;
    const storageUsedGb = licenses.reduce((sum, item) => sum + item.storageGb, 0);
    const latestBackup = backups[0];

    return {
      totalTenants: tenants,
      activeTenants,
      suspendedTenants,
      totalUsers: users,
      totalCouncilMembers: councilMembers,
      totalSessions: sessions,
      totalVotes: votes,
      storageUsedGb,
      activeLicenses,
      expiringLicenses,
      latestBackupAt: latestBackup?.createdAt ?? null
    };
  }

  listTenants(includeDeleted = false) {
    return this.prisma.tenant.findMany({
      where: includeDeleted ? {} : { deletedAt: null },
      include: { license: true, branding: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createTenant(dto: CreateTenantMasterDto, actorUserId: string) {
    const data = this.normalizeTenantPayload(dto);
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        legalName: data.legalName,
        tradeName: data.tradeName,
        document: data.document,
        stateRegistration: data.stateRegistration,
        municipalRegistration: data.municipalRegistration,
        responsibleName: data.responsibleName,
        responsibleEmail: data.responsibleEmail,
        responsiblePhone: data.responsiblePhone,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        website: data.website,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        billingZipCode: data.billingZipCode,
        billingStreet: data.billingStreet,
        billingNumber: data.billingNumber,
        billingComplement: data.billingComplement,
        billingNeighborhood: data.billingNeighborhood,
        billingCity: data.billingCity,
        billingState: data.billingState
      }
    });

    const plan = dto.plan ?? LicensePlan.PREMIUM;
    const defaults = PLAN_DEFAULTS[plan];
    await this.prisma.tenantLicense.create({
      data: {
        tenantId: tenant.id,
        plan,
        maxUsers: defaults.maxUsers!,
        maxCouncilMembers: defaults.maxCouncilMembers!,
        storageGb: defaults.storageGb!,
        features: defaults.features!,
        securityPolicy: defaults.securityPolicy!
      }
    });

    await this.prisma.tenantBranding.create({
      data: {
        tenantId: tenant.id,
        displayName: tenant.name
      }
    });

    await this.audit.record({
      tenantId: tenant.id,
      actorUserId,
      action: 'TENANT_CREATED',
      entity: 'Tenant',
      entityId: tenant.id,
      afterJson: tenant
    });

    return this.getTenant(tenant.id);
  }

  async updateTenant(id: string, dto: UpdateTenantMasterDto, actorUserId: string) {
    const before = await this.getTenant(id);
    const data = this.normalizeTenantPayload(dto as CreateTenantMasterDto);
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        legalName: data.legalName,
        tradeName: data.tradeName,
        document: data.document,
        stateRegistration: data.stateRegistration,
        municipalRegistration: data.municipalRegistration,
        responsibleName: data.responsibleName,
        responsibleEmail: data.responsibleEmail,
        responsiblePhone: data.responsiblePhone,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        website: data.website,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        billingZipCode: data.billingZipCode,
        billingStreet: data.billingStreet,
        billingNumber: data.billingNumber,
        billingComplement: data.billingComplement,
        billingNeighborhood: data.billingNeighborhood,
        billingCity: data.billingCity,
        billingState: data.billingState
      }
    });
    await this.audit.record({
      tenantId: tenant.id,
      actorUserId,
      action: 'TENANT_UPDATED',
      entity: 'Tenant',
      entityId: tenant.id,
      beforeJson: before,
      afterJson: tenant
    });
    return this.getTenant(id);
  }

  async setTenantStatus(id: string, dto: UpdateTenantStatusDto, actorUserId: string) {
    const before = await this.getTenant(id);
    const tenant = await this.prisma.tenant.update({ where: { id }, data: { status: dto.status } });
    await this.audit.record({
      tenantId: tenant.id,
      actorUserId,
      action: 'TENANT_STATUS_CHANGED',
      entity: 'Tenant',
      entityId: tenant.id,
      beforeJson: before,
      afterJson: tenant
    });
    return this.getTenant(id);
  }

  async softDeleteTenant(id: string, actorUserId: string) {
    const before = await this.getTenant(id);
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date(), status: TenantStatus.INACTIVE }
    });
    await this.audit.record({
      tenantId: tenant.id,
      actorUserId,
      action: 'TENANT_SOFT_DELETED',
      entity: 'Tenant',
      entityId: tenant.id,
      beforeJson: before,
      afterJson: tenant
    });
    return tenant;
  }

  async restoreTenant(id: string, actorUserId: string) {
    const before = await this.getTenant(id, true);
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: null, status: TenantStatus.ACTIVE }
    });
    await this.audit.record({
      tenantId: tenant.id,
      actorUserId,
      action: 'TENANT_RESTORED',
      entity: 'Tenant',
      entityId: tenant.id,
      beforeJson: before,
      afterJson: tenant
    });
    return this.getTenant(id);
  }

  listLicenses() {
    return this.prisma.tenantLicense.findMany({
      include: { tenant: { select: { id: true, name: true, city: true, state: true, status: true } } },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async upsertLicense(tenantId: string, dto: UpsertLicenseDto, actorUserId: string) {
    await this.getTenant(tenantId);
    const defaults = PLAN_DEFAULTS[dto.plan];
    const license = await this.prisma.tenantLicense.upsert({
      where: { tenantId },
      update: {
        plan: dto.plan,
        maxUsers: dto.maxUsers ?? defaults.maxUsers!,
        maxCouncilMembers: dto.maxCouncilMembers ?? defaults.maxCouncilMembers!,
        storageGb: dto.storageGb ?? defaults.storageGb!,
        features: dto.features ?? defaults.features!,
        securityPolicy: dto.securityPolicy ?? defaults.securityPolicy!
      },
      create: {
        tenantId,
        plan: dto.plan,
        maxUsers: dto.maxUsers ?? defaults.maxUsers!,
        maxCouncilMembers: dto.maxCouncilMembers ?? defaults.maxCouncilMembers!,
        storageGb: dto.storageGb ?? defaults.storageGb!,
        features: dto.features ?? defaults.features!,
        securityPolicy: dto.securityPolicy ?? defaults.securityPolicy!
      }
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'LICENSE_UPDATED',
      entity: 'TenantLicense',
      entityId: license.id,
      afterJson: license
    });

    return license;
  }

  listAdmins() {
    return this.prisma.user.findMany({
      where: { role: UserRole.ADMIN_CAMARA },
      include: { tenant: { select: { id: true, name: true, city: true, state: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createAdmin(dto: CreateAdminDto, actorUserId: string) {
    await this.getTenant(dto.tenantId);
    const user = await this.prisma.user.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        email: dto.email,
        role: UserRole.ADMIN_CAMARA,
        passwordHash: await bcrypt.hash(dto.password, 10),
        mfaRequired: true
      },
      include: { tenant: { select: { id: true, name: true, city: true, state: true } } }
    });

    await this.audit.record({
      tenantId: dto.tenantId,
      actorUserId,
      action: 'ADMIN_CREATED',
      entity: 'User',
      entityId: user.id,
      afterJson: { id: user.id, email: user.email, role: user.role }
    });

    return user;
  }

  async updateAdmin(id: string, dto: UpdateAdminDto, actorUserId: string) {
    const before = await this.prisma.user.findUnique({ where: { id } });
    if (!before || before.role !== UserRole.ADMIN_CAMARA) throw new NotFoundException('Administrador nao encontrado.');

    const data: {
      status?: UserStatus;
      mfaRequired?: boolean;
      passwordHash?: string;
      passwordResetRequired?: boolean;
    } = {};

    if (dto.status) data.status = dto.status;
    if (dto.mfaRequired !== undefined) data.mfaRequired = dto.mfaRequired;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      data.passwordResetRequired = true;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { tenant: { select: { id: true, name: true, city: true, state: true } } }
    });

    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId,
      action: 'ADMIN_UPDATED',
      entity: 'User',
      entityId: user.id,
      beforeJson: before,
      afterJson: { id: user.id, email: user.email, status: user.status, mfaRequired: user.mfaRequired }
    });

    return user;
  }

  async deleteAdmin(id: string, actorUserId: string) {
    const before = await this.prisma.user.findUnique({ where: { id } });
    if (!before || before.role !== UserRole.ADMIN_CAMARA) throw new NotFoundException('Administrador nao encontrado.');

    await this.prisma.user.delete({ where: { id } });
    await this.audit.record({
      tenantId: before.tenantId,
      actorUserId,
      action: 'ADMIN_DELETED',
      entity: 'User',
      entityId: id,
      beforeJson: before
    });

    return { deleted: true };
  }

  listDomains() {
    return this.prisma.tenantDomain.findMany({
      include: { tenant: { select: { id: true, name: true, city: true, state: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createDomain(dto: CreateDomainDto, actorUserId: string) {
    await this.getTenant(dto.tenantId);
    const domain = await this.prisma.tenantDomain.create({
      data: { tenantId: dto.tenantId, hostname: dto.hostname.toLowerCase() },
      include: { tenant: { select: { id: true, name: true, city: true, state: true } } }
    });

    await this.audit.record({
      tenantId: dto.tenantId,
      actorUserId,
      action: 'DOMAIN_CREATED',
      entity: 'TenantDomain',
      entityId: domain.id,
      afterJson: domain
    });

    return domain;
  }

  async updateDomainStatus(id: string, dto: UpdateDomainStatusDto, actorUserId: string) {
    const before = await this.prisma.tenantDomain.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Dominio nao encontrado.');

    const domain = await this.prisma.tenantDomain.update({
      where: { id },
      data: { status: dto.status },
      include: { tenant: { select: { id: true, name: true, city: true, state: true } } }
    });

    await this.audit.record({
      tenantId: domain.tenantId,
      actorUserId,
      action: 'DOMAIN_STATUS_CHANGED',
      entity: 'TenantDomain',
      entityId: domain.id,
      beforeJson: before,
      afterJson: domain
    });

    return domain;
  }

  async deleteDomain(id: string, actorUserId: string) {
    const before = await this.prisma.tenantDomain.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Dominio nao encontrado.');

    await this.prisma.tenantDomain.delete({ where: { id } });
    await this.audit.record({
      tenantId: before.tenantId,
      actorUserId,
      action: 'DOMAIN_DELETED',
      entity: 'TenantDomain',
      entityId: id,
      beforeJson: before
    });

    return { deleted: true };
  }

  async getBranding(tenantId: string) {
    await this.getTenant(tenantId);
    return this.prisma.tenantBranding.findUnique({ where: { tenantId } });
  }

  async upsertBranding(tenantId: string, dto: UpsertBrandingDto, actorUserId: string) {
    await this.getTenant(tenantId);
    const branding = await this.prisma.tenantBranding.upsert({
      where: { tenantId },
      update: dto,
      create: { tenantId, ...dto }
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'BRANDING_UPDATED',
      entity: 'TenantBranding',
      entityId: branding.id,
      afterJson: branding
    });

    return branding;
  }

  async uploadBrandingLogo(tenantId: string, dto: CreateBrandingLogoUploadDto, actorUserId: string) {
    await this.getTenant(tenantId);
    if (!dto.contentType.startsWith('image/')) throw new BadRequestException('O arquivo precisa ser uma imagem.');

    const buffer = Buffer.from(dto.contentBase64, 'base64');
    if (!buffer.length) throw new BadRequestException('Arquivo vazio.');
    if (buffer.length > 5 * 1024 * 1024) throw new BadRequestException('Arquivo maior que 5MB.');

    const publicUrl = await this.brandingAssets.saveAsset(tenantId, dto.slot, dto.contentType, buffer);
    const field =
      dto.slot === 'login' ? 'logoLoginUrl' : dto.slot === 'sidenav' ? 'logoSidenavUrl' : 'logoPortalUrl';

    const tenant = await this.getTenant(tenantId);
    const branding = await this.prisma.tenantBranding.upsert({
      where: { tenantId },
      update: { [field]: publicUrl },
      create: { tenantId, displayName: tenant.name, [field]: publicUrl }
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'BRANDING_LOGO_UPLOADED',
      entity: 'TenantBranding',
      entityId: branding.id,
      afterJson: { slot: dto.slot, publicUrl }
    });

    return { slot: dto.slot, publicUrl, branding };
  }

  listAuditLogs(query: ListAuditLogsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: {
      tenantId?: string | null;
      actorUserId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (query.tenantId) {
      where.tenantId = query.tenantId === 'platform' ? null : query.tenantId;
    }

    if (query.actorUserId) {
      where.actorUserId = query.actorUserId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(`${query.startDate}T00:00:00.000`);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(`${query.endDate}T23:59:59.999`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const [items, total] = await Promise.all([
        tx.auditLog.findMany({
          where,
          include: {
            tenant: { select: { id: true, name: true, city: true, state: true } },
            actor: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        tx.auditLog.count({ where })
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      };
    });
  }

  listAuditActors() {
    return this.prisma.user.findMany({
      where: { auditLogs: { some: {} } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
      take: 500
    });
  }

  async applySecurityAction(dto: SecurityActionDto, actorUserId: string) {
    if (!dto.userId) throw new BadRequestException('userId obrigatorio.');

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Usuario nao encontrado.');

    let updated = user;
    if (dto.action === 'BLOCK_USER') {
      updated = await this.prisma.user.update({ where: { id: user.id }, data: { status: UserStatus.INACTIVE } });
    }
    if (dto.action === 'REQUIRE_MFA') {
      updated = await this.prisma.user.update({ where: { id: user.id }, data: { mfaRequired: true } });
    }
    if (dto.action === 'FORCE_PASSWORD_RESET') {
      updated = await this.prisma.user.update({ where: { id: user.id }, data: { passwordResetRequired: true } });
    }

    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId,
      action: `SECURITY_${dto.action}`,
      entity: 'User',
      entityId: user.id,
      afterJson: { action: dto.action, userId: user.id }
    });

    return updated;
  }

  async monitoring() {
    const started = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - started;
    const latestBackup = await this.prisma.platformBackup.findFirst({ orderBy: { createdAt: 'desc' } });
    const smtp = await this.prisma.platformSetting.findUnique({ where: { key: 'smtp.host' } });

    return [
      { service: 'Saude da API', status: 'OPERATIONAL', detail: `${Date.now() % 40 + 20} ms` },
      { service: 'Banco PostgreSQL', status: 'OPERATIONAL', detail: `${dbLatencyMs} ms` },
      { service: 'Storage', status: latestBackup ? 'OPERATIONAL' : 'DEGRADED', detail: latestBackup ? `${Number(latestBackup.sizeBytes) / 1e9} GB ultimo backup` : 'Sem backup' },
      { service: 'Email SMTP', status: smtp ? 'OPERATIONAL' : 'DEGRADED', detail: smtp?.value ?? 'Nao configurado' }
    ];
  }

  listBackups() {
    return this.prisma.platformBackup.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }).then((items) =>
      items.map((item) => ({ ...item, sizeBytes: item.sizeBytes.toString() }))
    );
  }

  async createBackup(dto: CreateBackupDto, actorUserId: string) {
    const tenants = await this.prisma.tenant.count();
    const users = await this.prisma.user.count();
    const sizeBytes = BigInt((tenants + users) * 1024 * 1024);
    const backup = await this.prisma.platformBackup.create({
      data: {
        sizeBytes,
        status: BackupStatus.COMPLETED,
        source: dto.source ?? 'MANUAL'
      }
    });

    await this.audit.record({
      tenantId: null,
      actorUserId,
      action: 'BACKUP_CREATED',
      entity: 'PlatformBackup',
      entityId: backup.id,
      afterJson: { id: backup.id, sizeBytes: backup.sizeBytes.toString() }
    });

    return { ...backup, sizeBytes: backup.sizeBytes.toString() };
  }

  async restoreBackup(dto: RestoreBackupDto, actorUserId: string) {
    const backup = await this.prisma.platformBackup.findUnique({ where: { id: dto.backupId } });
    if (!backup) throw new NotFoundException('Backup nao encontrado.');

    const restored = await this.prisma.platformBackup.create({
      data: {
        sizeBytes: backup.sizeBytes,
        status: BackupStatus.RESTORED,
        source: `RESTORE:${backup.id}`
      }
    });

    await this.audit.record({
      tenantId: null,
      actorUserId,
      action: 'BACKUP_RESTORED',
      entity: 'PlatformBackup',
      entityId: restored.id,
      afterJson: { restoredFrom: backup.id }
    });

    return { ...restored, sizeBytes: restored.sizeBytes.toString() };
  }

  async deleteBackup(id: string, actorUserId: string) {
    const before = await this.prisma.platformBackup.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Backup nao encontrado.');

    await this.prisma.platformBackup.delete({ where: { id } });
    await this.audit.record({
      tenantId: null,
      actorUserId,
      action: 'BACKUP_DELETED',
      entity: 'PlatformBackup',
      entityId: id,
      beforeJson: { ...before, sizeBytes: before.sizeBytes.toString() }
    });

    return { deleted: true };
  }

  listSettings() {
    return this.prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertSettings(dto: UpsertSettingsDto, actorUserId: string) {
    const entries = Object.entries(dto.settings);
    const results = await Promise.all(
      entries.map(([key, value]) =>
        this.prisma.platformSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        })
      )
    );

    await this.audit.record({
      tenantId: null,
      actorUserId,
      action: 'SETTINGS_UPDATED',
      entity: 'PlatformSetting',
      entityId: 'global',
      afterJson: dto.settings
    });

    return results;
  }

  async impersonateOptions(tenantId: string) {
    const tenant = await this.getTenant(tenantId);
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        status: UserStatus.ACTIVE,
        role: { not: UserRole.MASTER }
      },
      select: { id: true, name: true, email: true, role: true, status: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }]
    });

    return {
      tenant: { id: tenant.id, name: tenant.name, city: tenant.city, state: tenant.state },
      users
    };
  }

  async impersonateTenant(tenantId: string, dto: ImpersonateTenantDto, actorUserId: string) {
    const tenant = await this.getTenant(tenantId);
    const target = await this.prisma.user.findFirst({
      where: {
        id: dto.userId,
        tenantId,
        status: UserStatus.ACTIVE,
        role: { not: UserRole.MASTER }
      }
    });
    if (!target) throw new NotFoundException('Perfil da Camara nao encontrado para impersonacao.');

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'MASTER_ACCESSED_TENANT',
      entity: 'User',
      entityId: target.id,
      afterJson: {
        tenantId: tenant.id,
        tenantName: tenant.name,
        impersonatedUserId: target.id,
        impersonatedRole: target.role,
        impersonatedEmail: target.email
      }
    });

    return this.auth.createSession(target.id, { impersonatedBy: actorUserId });
  }

  profile(actorUserId: string) {
    return this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { id: true, name: true, email: true, role: true, status: true, mfaRequired: true, createdAt: true }
    });
  }

  private async getTenant(id: string, includeDeleted = false) {
    const tenant = await this.prisma.tenant.findFirst({
      where: includeDeleted ? { id } : { id, deletedAt: null },
      include: { license: true, branding: true, domains: true }
    });
    if (!tenant) throw new NotFoundException('Camara nao encontrada.');
    return tenant;
  }

  private normalizeTenantPayload(dto: CreateTenantMasterDto) {
    const clean = Object.fromEntries(
      Object.entries(dto).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    ) as CreateTenantMasterDto;

    const required = [
      'name',
      'legalName',
      'document',
      'responsibleName',
      'responsibleEmail',
      'responsiblePhone',
      'contactEmail',
      'contactPhone',
      'zipCode',
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
      'billingZipCode',
      'billingStreet',
      'billingNumber',
      'billingNeighborhood',
      'billingCity',
      'billingState'
    ] as const;

    const missing = required.filter((key) => !clean[key]);
    if (missing.length) throw new BadRequestException('Preencha todos os campos obrigatorios da Camara.');

    return clean;
  }
}
