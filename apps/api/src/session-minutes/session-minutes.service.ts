import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SessionMinuteStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionMinutesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  list(actor: { tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    return this.prisma.sessionMinute.findMany({
      where: { tenantId: actor.tenantId },
      include: { session: true, generator: { select: { name: true } }, approver: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async detail(sessionId: string, actor: { tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const minute = await this.prisma.sessionMinute.findFirst({
      where: { tenantId: actor.tenantId, sessionId },
      include: { session: { include: { agendaItems: { include: { matter: true }, orderBy: { order: 'asc' } } } } }
    });
    if (!minute) throw new NotFoundException('Ata nao encontrada.');
    return minute;
  }

  async generate(sessionId: string, observations: string | undefined, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const session = await this.prisma.plenarySession.findFirst({
      where: { id: sessionId, tenantId: actor.tenantId },
      include: {
        tenant: true,
        agendaItems: { include: { matter: { include: { author: true } } }, orderBy: { order: 'asc' } },
        attendances: { include: { councilMember: true }, orderBy: { councilMember: { name: 'asc' } } },
        votes: { include: { councilMember: true, matter: true }, orderBy: { confirmedAt: 'asc' } }
      }
    });
    if (!session) throw new NotFoundException('Sessao nao encontrada.');
    const content = this.buildContent(session, observations);
    const minute = await this.prisma.sessionMinute.upsert({
      where: { tenantId_sessionId: { tenantId: actor.tenantId, sessionId } },
      update: { content, status: SessionMinuteStatus.GENERATED, generatedAt: new Date(), generatedBy: actor.sub },
      create: { tenantId: actor.tenantId, sessionId, content, status: SessionMinuteStatus.GENERATED, generatedAt: new Date(), generatedBy: actor.sub }
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'SESSION_MINUTE_GENERATED',
      entity: 'SessionMinute',
      entityId: minute.id,
      afterJson: minute as unknown as Prisma.InputJsonValue
    });
    return minute;
  }

  async update(sessionId: string, content: string, actor: { sub: string; tenantId: string | null }) {
    const before = await this.detail(sessionId, actor);
    if (before.status === SessionMinuteStatus.PUBLISHED) throw new BadRequestException('Ata publicada nao pode ser editada.');
    const minute = await this.prisma.sessionMinute.update({ where: { id: before.id }, data: { content } });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'SESSION_MINUTE_UPDATED',
      entity: 'SessionMinute',
      entityId: minute.id,
      beforeJson: before as unknown as Prisma.InputJsonValue,
      afterJson: minute as unknown as Prisma.InputJsonValue
    });
    return minute;
  }

  sendReview(sessionId: string, actor: { sub: string; tenantId: string | null }) {
    return this.changeStatus(sessionId, SessionMinuteStatus.IN_REVIEW, 'SESSION_MINUTE_SENT_TO_REVIEW', actor);
  }

  approve(sessionId: string, actor: { sub: string; tenantId: string | null }) {
    return this.changeStatus(sessionId, SessionMinuteStatus.APPROVED, 'SESSION_MINUTE_APPROVED', actor, { approvedAt: new Date(), approvedBy: actor.sub });
  }

  async publish(sessionId: string, actor: { sub: string; tenantId: string | null }) {
    const before = await this.detail(sessionId, actor);
    if (before.status !== SessionMinuteStatus.APPROVED) throw new BadRequestException('Ata precisa estar aprovada para publicar.');
    return this.changeStatus(sessionId, SessionMinuteStatus.PUBLISHED, 'SESSION_MINUTE_PUBLISHED', actor, { publishedAt: new Date(), publishedBy: actor.sub });
  }

  preview(sessionId: string, actor: { tenantId: string | null }) {
    return this.detail(sessionId, actor);
  }

  private async changeStatus(sessionId: string, status: SessionMinuteStatus, action: string, actor: { sub: string; tenantId: string | null }, data: Record<string, unknown> = {}) {
    const before = await this.detail(sessionId, actor);
    if (before.status === SessionMinuteStatus.PUBLISHED && status !== SessionMinuteStatus.PUBLISHED) throw new BadRequestException('Ata publicada nao pode ser alterada.');
    const minute = await this.prisma.sessionMinute.update({ where: { id: before.id }, data: { status, ...data } });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action,
      entity: 'SessionMinute',
      entityId: minute.id,
      beforeJson: before as unknown as Prisma.InputJsonValue,
      afterJson: minute as unknown as Prisma.InputJsonValue
    });
    return minute;
  }

  private buildContent(session: any, observations?: string) {
    const present = session.attendances.filter((item: any) => item.status === 'PRESENT' || item.status === 'LATE');
    const absent = session.attendances.filter((item: any) => item.status === 'ABSENT' || item.status === 'JUSTIFIED');
    const matters = session.agendaItems.map((item: any) => `- ${item.matter.type} ${item.matter.number}/${item.matter.year}: ${item.matter.title} (${item.status})`).join('\n') || '- Nao houve materias em pauta.';
    const votes = session.votes.map((vote: any) => `- ${vote.councilMember.name}: ${vote.vote} em ${vote.matter.type} ${vote.matter.number}/${vote.matter.year}`).join('\n') || '- Nao houve votacoes registradas.';
    return [
      `Ata da ${session.number}a Sessao ${session.type} da Camara Municipal de ${session.tenant.city}/${session.tenant.state}, realizada em ${new Date(session.date).toLocaleDateString('pt-BR')}.`,
      '',
      `Abertura: sob a presidencia indicada no cadastro da sessao, foram iniciados os trabalhos legislativos.`,
      '',
      `Presencas: ${present.map((item: any) => item.councilMember.name).join(', ') || 'sem presencas registradas'}.`,
      `Ausencias/justificativas: ${absent.map((item: any) => `${item.councilMember.name} (${item.status})`).join(', ') || 'nenhuma'}.`,
      '',
      'Materias discutidas:',
      matters,
      '',
      'Votacoes realizadas:',
      votes,
      '',
      observations ? `Observacoes: ${observations}` : 'Observacoes: sem observacoes adicionais.',
      '',
      'Encerramento: nada mais havendo, foi encerrada a sessao e lavrada a presente ata.'
    ].join('\n');
  }
}
