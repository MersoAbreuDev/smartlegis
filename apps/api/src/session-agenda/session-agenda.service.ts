import { ForbiddenException, Injectable } from '@nestjs/common';
import { LegislativeMatterStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddAgendaItemDto } from './dto';

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
}
