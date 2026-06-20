import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminProfileDto, UpdateAdminProfileDto } from './dto';

export const ADMIN_PROFILE_MODULES = [
  'DASHBOARD',
  'USERS',
  'COUNCIL_MEMBERS',
  'ROLES',
  'PORTAL_PAGES',
  'PORTAL_BANNERS',
  'PORTAL_MENU',
  'PORTAL_PREVIEW',
  'AUDIT'
];

const systemPermissions: Record<UserRole, string[]> = {
  MASTER: ['PLATFORM_MANAGE', 'TENANTS_MANAGE', 'BRANDING_MANAGE', 'LICENSES_MANAGE', 'GLOBAL_AUDIT_READ'],
  ADMIN_CAMARA: ['USERS_MANAGE', 'COUNCIL_MEMBERS_MANAGE', 'ROLES_MANAGE', 'TENANT_AUDIT_READ', 'PORTAL_CONTENT_MANAGE'],
  SECRETARIO: ['MATTERS_MANAGE', 'SESSIONS_MANAGE', 'AGENDA_MANAGE'],
  PRESIDENTE: ['SESSIONS_OPEN_CLOSE', 'VOTING_START_CLOSE'],
  VEREADOR: ['VOTE_CONFIRM', 'VOTE_MFA']
};

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  listSystemRoles() {
    return Object.values(UserRole).map((role) => ({ role, permissions: systemPermissions[role] }));
  }

  listAvailableModules() {
    return ADMIN_PROFILE_MODULES;
  }

  listProfiles(actor: { tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    return this.prisma.adminProfile.findMany({
      where: { tenantId: actor.tenantId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' }
    });
  }

  async createProfile(dto: CreateAdminProfileDto, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    this.assertModules(dto.modules);
    const profile = await this.prisma.adminProfile.create({
      data: {
        tenantId: actor.tenantId,
        name: dto.name,
        description: dto.description,
        modules: dto.modules
      }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'ADMIN_PROFILE_CREATED',
      entity: 'AdminProfile',
      entityId: profile.id,
      afterJson: profile as unknown as Prisma.InputJsonValue
    });
    return profile;
  }

  async updateProfile(id: string, dto: UpdateAdminProfileDto, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const before = await this.prisma.adminProfile.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!before) throw new NotFoundException('Perfil nao encontrado.');
    if (dto.modules) this.assertModules(dto.modules);

    const profile = await this.prisma.adminProfile.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        modules: dto.modules,
        active: dto.active
      }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'ADMIN_PROFILE_UPDATED',
      entity: 'AdminProfile',
      entityId: profile.id,
      beforeJson: before as unknown as Prisma.InputJsonValue,
      afterJson: profile as unknown as Prisma.InputJsonValue
    });
    return profile;
  }

  private assertModules(modules: string[]) {
    const invalid = modules.filter((module) => !ADMIN_PROFILE_MODULES.includes(module));
    if (invalid.length) throw new BadRequestException(`Modulos invalidos: ${invalid.join(', ')}`);
  }
}
