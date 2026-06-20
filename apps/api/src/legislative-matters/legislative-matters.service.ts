import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LegislativeMatterStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLegislativeMatterDto } from './dto';

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
        status: LegislativeMatterStatus.PROTOCOLLED,
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

  async setStatus(id: string, status: LegislativeMatterStatus, actor: { sub: string; tenantId: string }) {
    const before = await this.prisma.legislativeMatter.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!before) throw new NotFoundException('Materia nao encontrada.');
    const matter = await this.prisma.legislativeMatter.update({ where: { id }, data: { status } });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'MATTER_STATUS_CHANGED',
      entity: 'LegislativeMatter',
      entityId: matter.id,
      beforeJson: before,
      afterJson: matter
    });
    return matter;
  }
}
