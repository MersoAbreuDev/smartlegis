import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LegislativeMatterStatus, Prisma } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLegislativeMatterDto, UpdateLegislativeMatterDto } from './dto';

@Injectable()
export class LegislativeMattersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  list(tenantId: string) {
    return this.prisma.legislativeMatter.findMany({
      where: { tenantId },
      include: { author: true },
      orderBy: [{ year: 'desc' }, { number: 'desc' }]
    });
  }

  async detail(id: string, tenantId: string) {
    const matter = await this.prisma.legislativeMatter.findFirst({
      where: { id, tenantId },
      include: {
        author: true,
        agendaItems: { include: { session: true }, orderBy: { order: 'asc' } },
        protocols: true,
        votes: { include: { councilMember: true }, orderBy: { confirmedAt: 'asc' } }
      }
    });
    if (!matter) throw new NotFoundException('Materia nao encontrada.');
    const timeline = await this.prisma.auditLog.findMany({
      where: { tenantId, entity: 'LegislativeMatter', entityId: id },
      orderBy: { createdAt: 'asc' }
    });
    return { ...matter, timeline };
  }

  async create(dto: CreateLegislativeMatterDto, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const author = await this.prisma.councilMember.findFirst({ where: { id: dto.authorId, tenantId: actor.tenantId } });
    if (!author) throw new ForbiddenException('Autor fora do tenant.');

    const matter = await this.prisma.legislativeMatter.create({
      data: {
        tenantId: actor.tenantId,
        type: dto.type,
        number: dto.number,
        year: dto.year,
        title: dto.title,
        summary: dto.summary,
        authorId: dto.authorId,
        documentUrl: dto.documentUrl,
        status: LegislativeMatterStatus.DRAFT,
        createdBy: actor.sub
      }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'MATTER_CREATED',
      entity: 'LegislativeMatter',
      entityId: matter.id,
      afterJson: matter
    });
    return matter;
  }

  async update(id: string, dto: UpdateLegislativeMatterDto, actor: { sub: string; tenantId: string }) {
    const before = await this.prisma.legislativeMatter.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!before) throw new NotFoundException('Materia nao encontrada.');
    const editableStatuses: LegislativeMatterStatus[] = [LegislativeMatterStatus.DRAFT, LegislativeMatterStatus.PROTOCOLLED];
    if (!editableStatuses.includes(before.status)) {
      throw new BadRequestException('Materia so pode ser editada em rascunho ou protocolada.');
    }
    if (dto.authorId) {
      const author = await this.prisma.councilMember.findFirst({ where: { id: dto.authorId, tenantId: actor.tenantId } });
      if (!author) throw new ForbiddenException('Autor fora do tenant.');
    }
    const matter = await this.prisma.legislativeMatter.update({
      where: { id },
      data: {
        type: dto.type,
        number: dto.number,
        year: dto.year,
        title: dto.title,
        summary: dto.summary,
        authorId: dto.authorId,
        documentUrl: dto.documentUrl
      }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'MATTER_UPDATED',
      entity: 'LegislativeMatter',
      entityId: matter.id,
      beforeJson: before as unknown as Prisma.InputJsonValue,
      afterJson: matter as unknown as Prisma.InputJsonValue
    });
    return matter;
  }

  protocol(id: string, actor: { sub: string; tenantId: string }) {
    return this.setStatusWithAction(id, LegislativeMatterStatus.PROTOCOLLED, 'MATTER_PROTOCOLLED', actor);
  }

  sendToAgenda(id: string, actor: { sub: string; tenantId: string }) {
    return this.setStatusWithAction(id, LegislativeMatterStatus.IN_SESSION, 'MATTER_SENT_TO_AGENDA', actor);
  }

  async setStatus(id: string, status: LegislativeMatterStatus, actor: { sub: string; tenantId: string }) {
    return this.setStatusWithAction(id, status, 'MATTER_STATUS_CHANGED', actor);
  }

  private async setStatusWithAction(id: string, status: LegislativeMatterStatus, action: string, actor: { sub: string; tenantId: string }) {
    const before = await this.prisma.legislativeMatter.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!before) throw new NotFoundException('Materia nao encontrada.');
    const matter = await this.prisma.legislativeMatter.update({ where: { id }, data: { status } });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action,
      entity: 'LegislativeMatter',
      entityId: matter.id,
      beforeJson: before,
      afterJson: matter
    });
    return matter;
  }
}
