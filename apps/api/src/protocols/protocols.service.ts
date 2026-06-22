import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProtocolStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProtocolDto } from './dto/create-protocol.dto';

type Actor = { sub: string; tenantId: string | null };
type ProtocolFilters = { status?: ProtocolStatus; year?: string; documentType?: string; search?: string };

@Injectable()
export class ProtocolsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  list(actor: { tenantId: string | null }, filters: ProtocolFilters) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const where: Prisma.ProtocolWhereInput = { tenantId: actor.tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.year) where.year = Number(filters.year);
    if (filters.documentType) where.documentType = { contains: filters.documentType, mode: 'insensitive' };
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { authorName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    return this.prisma.protocol.findMany({
      where,
      include: { matter: { select: { id: true, type: true, number: true, year: true, title: true, status: true } }, receiver: { select: { id: true, name: true, email: true } } },
      orderBy: [{ year: 'desc' }, { protocolNumber: 'desc' }]
    });
  }

  async detail(id: string, actor: { tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const protocol = await this.prisma.protocol.findFirst({
      where: { id, tenantId: actor.tenantId },
      include: { matter: true, receiver: { select: { id: true, name: true, email: true } } }
    });
    if (!protocol) throw new NotFoundException('Protocolo nao encontrado.');
    return protocol;
  }

  async create(dto: CreateProtocolDto, actor: Actor) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const year = new Date().getFullYear();
    const created = await this.prisma.$transaction(async (tx) => {
      const last = await tx.protocol.findFirst({
        where: { tenantId: actor.tenantId!, year },
        orderBy: { protocolNumber: 'desc' },
        select: { protocolNumber: true }
      });
      const protocolNumber = (last?.protocolNumber ?? 0) + 1;
      const receivedAt = new Date();
      const receiptHash = createHash('sha256')
        .update(`${actor.tenantId}:${year}:${protocolNumber}:${dto.subject}:${dto.authorName}:${receivedAt.toISOString()}`)
        .digest('hex');
      return tx.protocol.create({
        data: {
          tenantId: actor.tenantId!,
          protocolNumber,
          year,
          documentType: dto.documentType,
          subject: dto.subject,
          description: dto.description,
          authorName: dto.authorName,
          authorDocument: dto.authorDocument,
          authorEmail: dto.authorEmail,
          authorPhone: dto.authorPhone,
          documentUrl: dto.documentUrl,
          receivedBy: actor.sub,
          receivedAt,
          receiptHash
        }
      });
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'PROTOCOL_CREATED',
      entity: 'Protocol',
      entityId: created.id,
      afterJson: created as unknown as Prisma.InputJsonValue
    });
    return created;
  }

  async updateStatus(id: string, status: ProtocolStatus, actor: Actor) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const before = await this.prisma.protocol.findFirst({ where: { id, tenantId: actor.tenantId } });
    if (!before) throw new NotFoundException('Protocolo nao encontrado.');
    const protocol = await this.prisma.protocol.update({ where: { id }, data: { status } });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'PROTOCOL_STATUS_UPDATED',
      entity: 'Protocol',
      entityId: id,
      beforeJson: before as unknown as Prisma.InputJsonValue,
      afterJson: protocol as unknown as Prisma.InputJsonValue
    });
    return protocol;
  }

  async linkMatter(id: string, matterId: string, actor: Actor) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const before = await this.prisma.protocol.findFirst({ where: { id, tenantId: actor.tenantId } });
    const matter = await this.prisma.legislativeMatter.findFirst({ where: { id: matterId, tenantId: actor.tenantId } });
    if (!before || !matter) throw new NotFoundException('Protocolo ou materia nao encontrado.');
    if (before.status === ProtocolStatus.CANCELLED) throw new BadRequestException('Protocolo cancelado nao pode ser vinculado.');
    const protocol = await this.prisma.protocol.update({
      where: { id },
      data: { matterId, status: ProtocolStatus.ATTACHED_TO_MATTER }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'PROTOCOL_LINKED_TO_MATTER',
      entity: 'Protocol',
      entityId: id,
      beforeJson: before as unknown as Prisma.InputJsonValue,
      afterJson: protocol as unknown as Prisma.InputJsonValue
    });
    return protocol;
  }

  async receipt(id: string, actor: { tenantId: string | null }) {
    const protocol = await this.detail(id, actor);
    return {
      number: protocol.protocolNumber,
      year: protocol.year,
      subject: protocol.subject,
      type: protocol.documentType,
      author: protocol.authorName,
      receivedAt: protocol.receivedAt,
      hash: protocol.receiptHash,
      status: protocol.status
    };
  }
}
