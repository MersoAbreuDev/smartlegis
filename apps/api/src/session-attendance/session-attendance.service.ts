import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, Prisma, UserRole } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceItemDto } from './dto';

@Injectable()
export class SessionAttendanceService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  async list(sessionId: string, actor: { tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    await this.assertSession(sessionId, actor.tenantId);
    return this.prisma.sessionAttendance.findMany({
      where: { tenantId: actor.tenantId, sessionId },
      include: { councilMember: true, registrar: { select: { id: true, name: true, email: true } } },
      orderBy: { councilMember: { name: 'asc' } }
    });
  }

  async upsertBatch(sessionId: string, items: AttendanceItemDto[], actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    await this.assertSession(sessionId, actor.tenantId);
    const saved = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.sessionAttendance.upsert({
          where: {
            tenantId_sessionId_councilMemberId: {
              tenantId: actor.tenantId!,
              sessionId,
              councilMemberId: item.councilMemberId
            }
          },
          update: {
            status: item.status,
            justification: item.justification,
            registeredBy: actor.sub,
            registeredAt: new Date()
          },
          create: {
            tenantId: actor.tenantId!,
            sessionId,
            councilMemberId: item.councilMemberId,
            status: item.status,
            justification: item.justification,
            registeredBy: actor.sub
          }
        })
      )
    );
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'ATTENDANCE_UPDATED',
      entity: 'PlenarySession',
      entityId: sessionId,
      afterJson: saved as unknown as Prisma.InputJsonValue
    });
    return saved;
  }

  async updateOne(sessionId: string, councilMemberId: string, status: AttendanceStatus, justification: string | undefined, actor: { sub: string; tenantId: string | null }) {
    return this.upsertBatch(sessionId, [{ councilMemberId, status, justification }], actor).then((items) => items[0]);
  }

  async justify(sessionId: string, councilMemberId: string, justification: string, actor: { sub: string; tenantId: string | null; role: UserRole }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    if (actor.role === UserRole.VEREADOR) {
      const ownMember = await this.prisma.councilMember.findFirst({ where: { tenantId: actor.tenantId, userId: actor.sub } });
      if (!ownMember || ownMember.id !== councilMemberId) throw new ForbiddenException('Vereador so justifica a propria presenca.');
    }
    return this.updateOne(sessionId, councilMemberId, AttendanceStatus.JUSTIFIED, justification, actor);
  }

  private async assertSession(sessionId: string, tenantId: string) {
    const session = await this.prisma.plenarySession.findFirst({ where: { id: sessionId, tenantId } });
    if (!session) throw new NotFoundException('Sessao nao encontrada.');
    return session;
  }
}
