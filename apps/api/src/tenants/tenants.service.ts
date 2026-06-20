import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  list() {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateTenantDto, actorUserId: string) {
    const tenant = await this.prisma.tenant.create({ data: dto });
    await this.audit.record({
      tenantId: tenant.id,
      actorUserId,
      action: 'TENANT_CREATED',
      entity: 'Tenant',
      entityId: tenant.id,
      afterJson: tenant
    });
    return tenant;
  }

  async setStatus(id: string, status: TenantStatus, actorUserId: string) {
    const before = await this.prisma.tenant.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Camara nao encontrada.');
    const tenant = await this.prisma.tenant.update({ where: { id }, data: { status } });
    await this.audit.record({
      tenantId: tenant.id,
      actorUserId,
      action: 'TENANT_STATUS_CHANGED',
      entity: 'Tenant',
      entityId: tenant.id,
      beforeJson: before,
      afterJson: tenant
    });
    return tenant;
  }
}
