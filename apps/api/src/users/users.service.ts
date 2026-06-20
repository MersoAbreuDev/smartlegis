import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  list(actor: { tenantId: string | null; role: UserRole }) {
    return this.prisma.user.findMany({
      where: actor.role === UserRole.MASTER ? {} : { tenantId: actor.tenantId },
      select: {
        id: true,
        tenantId: true,
        adminProfileId: true,
        adminProfile: { select: { id: true, name: true, modules: true, active: true } },
        name: true,
        email: true,
        role: true,
        status: true,
        mfaRequired: true,
        passwordResetRequired: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(dto: CreateUserDto, actor: { sub: string; tenantId: string | null; role: UserRole }) {
    if (actor.role !== UserRole.MASTER && !actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    if (actor.role !== UserRole.MASTER && dto.role === UserRole.MASTER) {
      throw new ForbiddenException('Apenas MASTER cria outro MASTER.');
    }

    const tenantId =
      dto.role === UserRole.MASTER
        ? null
        : actor.role === UserRole.MASTER
          ? dto.tenantId ?? null
          : actor.tenantId;

    if (dto.role !== UserRole.MASTER && !tenantId) {
      throw new BadRequestException('tenantId obrigatorio para usuarios de Camara.');
    }
    if (dto.adminProfileId && tenantId) await this.assertAdminProfile(dto.adminProfileId, tenantId);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        adminProfileId: dto.adminProfileId,
        name: dto.name,
        email: dto.email,
        role: dto.role,
        passwordHash: await bcrypt.hash(dto.password, 10)
      }
    });

    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: actor.sub,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      afterJson: { id: user.id, email: user.email, role: user.role, status: user.status }
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
  }

  async update(id: string, dto: UpdateUserDto, actor: { sub: string; tenantId: string | null; role: UserRole }) {
    const before = await this.prisma.user.findFirst({
      where: actor.role === UserRole.MASTER ? { id } : { id, tenantId: actor.tenantId ?? undefined }
    });
    if (!before) throw new NotFoundException('Usuario nao encontrado.');
    if (actor.role !== UserRole.MASTER && before.role === UserRole.MASTER) throw new ForbiddenException('ADMIN_CAMARA nao altera MASTER.');
    if (actor.role !== UserRole.MASTER && dto.role === UserRole.MASTER) throw new ForbiddenException('ADMIN_CAMARA nao atribui perfil MASTER.');
    if (actor.role !== UserRole.MASTER && before.tenantId !== actor.tenantId) throw new ForbiddenException('Usuario fora do tenant.');

    const data: {
      name?: string;
      email?: string;
      role?: UserRole;
      adminProfileId?: string | null;
      status?: 'ACTIVE' | 'INACTIVE';
      mfaRequired?: boolean;
      passwordHash?: string;
      passwordResetRequired?: boolean;
    } = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.adminProfileId !== undefined) {
      if (dto.adminProfileId) await this.assertAdminProfile(dto.adminProfileId, before.tenantId!);
      data.adminProfileId = dto.adminProfileId || null;
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.mfaRequired !== undefined) data.mfaRequired = dto.mfaRequired;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
      data.passwordResetRequired = true;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        tenantId: true,
        adminProfileId: true,
        adminProfile: { select: { id: true, name: true, modules: true, active: true } },
        name: true,
        email: true,
        role: true,
        status: true,
        mfaRequired: true,
        passwordResetRequired: true,
        createdAt: true
      }
    });

    await this.audit.record({
      tenantId: updated.tenantId,
      actorUserId: actor.sub,
      action: dto.password ? 'USER_PASSWORD_RESET' : 'USER_UPDATED',
      entity: 'User',
      entityId: updated.id,
      beforeJson: { id: before.id, email: before.email, role: before.role, status: before.status, mfaRequired: before.mfaRequired },
      afterJson: { id: updated.id, email: updated.email, role: updated.role, status: updated.status, mfaRequired: updated.mfaRequired, adminProfileId: updated.adminProfileId }
    });

    return updated;
  }

  private async assertAdminProfile(adminProfileId: string, tenantId: string) {
    const profile = await this.prisma.adminProfile.findFirst({ where: { id: adminProfileId, tenantId, active: true } });
    if (!profile) throw new ForbiddenException('Perfil administrativo invalido para este tenant.');
  }
}
