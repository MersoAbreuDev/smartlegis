import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

type AuditInput = {
  tenantId: string | null;
  actorUserId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  beforeJson?: Prisma.InputJsonValue;
  afterJson?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput) {
    const previous = await this.prisma.auditLog.findFirst({
      where: { tenantId: input.tenantId },
      orderBy: { createdAt: 'desc' }
    });

    const payload = JSON.stringify({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      beforeJson: input.beforeJson ?? null,
      afterJson: input.afterJson ?? null,
      previousHash: previous?.hash ?? null,
      at: new Date().toISOString()
    });

    return this.prisma.auditLog.create({
      data: {
        ...input,
        previousHash: previous?.hash,
        hash: createHash('sha256').update(payload).digest('hex')
      }
    });
  }

  list(
    tenantId: string | null,
    isMaster: boolean,
    filters: { actorUserId?: string; action?: string; entity?: string; startDate?: string; endDate?: string; limit?: string } = {}
  ) {
    const where: Prisma.AuditLogWhereInput = isMaster ? {} : { tenantId };
    const take = Math.min(Math.max(Number(filters.limit) || 100, 1), 100);
    if (filters.actorUserId) where.actorUserId = filters.actorUserId;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.entity) where.entity = { contains: filters.entity, mode: 'insensitive' };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        gte: filters.startDate ? new Date(filters.startDate) : undefined,
        lte: filters.endDate ? new Date(filters.endDate) : undefined
      };
    }
    return this.prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, name: true, email: true } }, tenant: { select: { id: true, name: true, city: true, state: true } } },
      orderBy: { createdAt: 'desc' },
      take
    });
  }

  async detail(id: string, tenantId: string | null, isMaster: boolean) {
    const log = await this.prisma.auditLog.findFirst({
      where: isMaster ? { id } : { id, tenantId },
      include: { actor: { select: { id: true, name: true, email: true } }, tenant: { select: { id: true, name: true, city: true, state: true } } }
    });
    if (!log) throw new NotFoundException('Log nao encontrado.');
    return log;
  }
}
