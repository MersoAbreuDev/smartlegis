import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PlenarySessionStatus, Prisma } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlenarySessionDto, UpdatePlenarySessionDto } from './dto';

@Injectable()
export class PlenarySessionsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  list(tenantId: string) {
    return this.prisma.plenarySession.findMany({
      where: { tenantId },
      include: { agendaItems: { include: { matter: true }, orderBy: { order: 'asc' } } },
      orderBy: { date: 'desc' }
    });
  }

  async detail(id: string, tenantId: string) {
    const session = await this.prisma.plenarySession.findFirst({
      where: { id, tenantId },
      include: {
        agendaItems: { include: { matter: { include: { author: true } } }, orderBy: { order: 'asc' } },
        attendances: { include: { councilMember: true }, orderBy: { councilMember: { name: 'asc' } } },
        votes: { include: { councilMember: true, matter: true }, orderBy: { confirmedAt: 'asc' } },
        minute: true
      }
    });
    if (!session) throw new NotFoundException('Sessao nao encontrada.');
    return session;
  }

  async create(dto: CreatePlenarySessionDto, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const session = await this.prisma.plenarySession.create({
      data: {
        tenantId: actor.tenantId,
        type: dto.type,
        number: dto.number,
        date: new Date(dto.date),
        presidentId: dto.presidentId,
        secretaryId: dto.secretaryId
      }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'SESSION_CREATED',
      entity: 'PlenarySession',
      entityId: session.id,
      afterJson: session
    });
    return session;
  }

  async open(id: string, actor: { sub: string; tenantId: string }) {
    const before = await this.prisma.plenarySession.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!before) throw new NotFoundException('Sessao nao encontrada.');
    if (before.status !== PlenarySessionStatus.SCHEDULED) throw new BadRequestException('Sessao nao pode ser aberta.');
    const session = await this.prisma.plenarySession.update({
      where: { id },
      data: { status: PlenarySessionStatus.OPENED, openedAt: new Date() }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'SESSION_OPENED',
      entity: 'PlenarySession',
      entityId: session.id,
      beforeJson: before,
      afterJson: session
    });
    return session;
  }

  async update(id: string, dto: UpdatePlenarySessionDto, actor: { sub: string; tenantId: string }) {
    const before = await this.prisma.plenarySession.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!before) throw new NotFoundException('Sessao nao encontrada.');
    if (before.status !== PlenarySessionStatus.SCHEDULED) throw new BadRequestException('Sessao so pode ser editada quando agendada.');
    const session = await this.prisma.plenarySession.update({
      where: { id },
      data: {
        type: dto.type,
        number: dto.number,
        date: dto.date ? new Date(dto.date) : undefined,
        presidentId: dto.presidentId,
        secretaryId: dto.secretaryId
      }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'SESSION_UPDATED',
      entity: 'PlenarySession',
      entityId: session.id,
      beforeJson: before as unknown as Prisma.InputJsonValue,
      afterJson: session as unknown as Prisma.InputJsonValue
    });
    return session;
  }

  async cancel(id: string, actor: { sub: string; tenantId: string }) {
    const before = await this.prisma.plenarySession.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!before) throw new NotFoundException('Sessao nao encontrada.');
    if (before.status === PlenarySessionStatus.CLOSED) throw new BadRequestException('Sessao encerrada nao pode ser cancelada.');
    const session = await this.prisma.plenarySession.update({ where: { id }, data: { status: PlenarySessionStatus.CANCELLED } });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'SESSION_CANCELLED',
      entity: 'PlenarySession',
      entityId: session.id,
      beforeJson: before as unknown as Prisma.InputJsonValue,
      afterJson: session as unknown as Prisma.InputJsonValue
    });
    return session;
  }

  async suspend(id: string, actor: { sub: string; tenantId: string }) {
    const session = await this.prisma.plenarySession.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!session) throw new NotFoundException('Sessao nao encontrada.');
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'SESSION_SUSPENDED',
      entity: 'PlenarySession',
      entityId: session.id,
      afterJson: session as unknown as Prisma.InputJsonValue
    });
    return { ...session, suspended: true };
  }

  async close(id: string, actor: { sub: string; tenantId: string }) {
    const before = await this.prisma.plenarySession.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!before) throw new NotFoundException('Sessao nao encontrada.');
    const session = await this.prisma.plenarySession.update({
      where: { id },
      data: { status: PlenarySessionStatus.CLOSED, closedAt: new Date() }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'SESSION_CLOSED',
      entity: 'PlenarySession',
      entityId: session.id,
      beforeJson: before,
      afterJson: session
    });
    return session;
  }
}
