import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AgendaItemStatus, LegislativeMatterStatus, Prisma } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddAgendaItemDto, ReorderAgendaItemDto, UpdateAgendaItemDto } from './dto';

@Injectable()
export class SessionAgendaService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  list(sessionId: string, tenantId: string) {
    return this.prisma.sessionAgendaItem.findMany({
      where: { sessionId, tenantId },
      include: { matter: { include: { author: true } } },
      orderBy: { order: 'asc' }
    });
  }

  async add(dto: AddAgendaItemDto, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const session = await this.prisma.plenarySession.findFirst({ where: { id: dto.sessionId, tenantId: actor.tenantId } });
    const matter = await this.prisma.legislativeMatter.findFirst({ where: { id: dto.matterId, tenantId: actor.tenantId } });
    if (!session || !matter) throw new ForbiddenException('Sessao ou materia fora do tenant.');

    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sessionAgendaItem.create({
        data: { tenantId: actor.tenantId!, sessionId: dto.sessionId, matterId: dto.matterId, order: dto.order }
      });
      await tx.legislativeMatter.update({
        where: { id: dto.matterId },
        data: { status: LegislativeMatterStatus.IN_SESSION }
      });
      return created;
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'AGENDA_ITEM_ADDED',
      entity: 'SessionAgendaItem',
      entityId: item.id,
      afterJson: item
    });
    return item;
  }

  async update(id: string, dto: UpdateAgendaItemDto, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const before = await this.findInTenant(id, actor.tenantId);
    const item = await this.prisma.sessionAgendaItem.update({
      where: { id },
      data: { order: dto.order, status: dto.status }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'AGENDA_ITEM_UPDATED',
      entity: 'SessionAgendaItem',
      entityId: item.id,
      beforeJson: before as unknown as Prisma.InputJsonValue,
      afterJson: item as unknown as Prisma.InputJsonValue
    });
    return item;
  }

  remove(id: string, actor: { sub: string; tenantId: string | null }) {
    return this.update(id, { status: AgendaItemStatus.SKIPPED }, actor);
  }

  setStatus(id: string, status: AgendaItemStatus, actor: { sub: string; tenantId: string | null }) {
    return this.update(id, { status }, actor);
  }

  async reorder(sessionId: string, items: ReorderAgendaItemDto[], actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const existing = await this.prisma.sessionAgendaItem.findMany({ where: { tenantId: actor.tenantId, sessionId } });
    const ids = new Set(existing.map((item) => item.id));
    if (items.some((item) => !ids.has(item.id))) throw new ForbiddenException('Item de pauta fora do tenant.');
    const updated = await this.prisma.$transaction(async (tx) => {
      await Promise.all(items.map((item, index) => tx.sessionAgendaItem.update({ where: { id: item.id }, data: { order: -1000 - index } })));
      return Promise.all(items.map((item) => tx.sessionAgendaItem.update({ where: { id: item.id }, data: { order: item.order } })));
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'AGENDA_REORDERED',
      entity: 'PlenarySession',
      entityId: sessionId,
      beforeJson: existing as unknown as Prisma.InputJsonValue,
      afterJson: updated as unknown as Prisma.InputJsonValue
    });
    return updated;
  }

  private async findInTenant(id: string, tenantId: string) {
    const item = await this.prisma.sessionAgendaItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Item de pauta nao encontrado.');
    return item;
  }
}
