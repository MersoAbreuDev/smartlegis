import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MfaPurpose, PlenarySessionStatus, UserRole, VoteValue } from '@prisma/client';
import { createHash } from 'crypto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditLogsService
  ) {}

  async startVoting(sessionId: string, matterId: string, actor: { sub: string; tenantId: string }) {
    const session = await this.prisma.plenarySession.findFirst({ where: { id: sessionId, tenantId: actor.tenantId } });
    const matter = await this.prisma.legislativeMatter.findFirst({ where: { id: matterId, tenantId: actor.tenantId } });
    if (!session || !matter) throw new NotFoundException('Sessao ou materia nao encontrada.');
    if (session.status !== PlenarySessionStatus.OPENED) throw new BadRequestException('Presidente so inicia votacao em sessao aberta.');

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedSession = await tx.plenarySession.update({
        where: { id: sessionId },
        data: { status: PlenarySessionStatus.VOTING }
      });
      const updatedMatter = await tx.legislativeMatter.update({
        where: { id: matterId },
        data: { status: 'VOTING' }
      });
      await tx.sessionAgendaItem.updateMany({
        where: { tenantId: actor.tenantId, sessionId, matterId },
        data: { status: 'VOTING' }
      });
      return { session: updatedSession, matter: updatedMatter };
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'VOTING_STARTED',
      entity: 'LegislativeMatter',
      entityId: matterId,
      beforeJson: { session, matter },
      afterJson: result
    });
    return result;
  }

  async requestVoteMfa(actor: { sub: string; tenantId: string | null; role: UserRole }, sessionId: string, matterId: string, vote: VoteValue) {
    await this.assertCanVote(actor, sessionId, matterId, vote);
    const challenge = await this.auth.createMfaChallenge(actor.sub, actor.tenantId, MfaPurpose.VOTE);
    return { challengeId: challenge.id, demoCode: '123456', expiresAt: challenge.expiresAt };
  }

  async confirmVote(
    actor: { sub: string; tenantId: string | null; role: UserRole },
    sessionId: string,
    matterId: string,
    vote: VoteValue,
    challengeId: string,
    code: string,
    requestMeta: { ipAddress?: string; userAgent?: string }
  ) {
    const councilMember = await this.assertCanVote(actor, sessionId, matterId, vote);
    await this.auth.consumeMfaChallenge(challengeId, code, MfaPurpose.VOTE);

    const deviceHash = this.auth.deviceHash(`${actor.sub}:${requestMeta.userAgent ?? 'unknown'}`);
    const confirmedAt = new Date();
    const voteHash = createHash('sha256')
      .update(`${actor.tenantId}:${sessionId}:${matterId}:${councilMember.id}:${vote}:${confirmedAt.toISOString()}:${deviceHash}`)
      .digest('hex');

    const created = await this.prisma.vote.create({
      data: {
        tenantId: actor.tenantId!,
        sessionId,
        matterId,
        councilMemberId: councilMember.id,
        vote,
        confirmedAt,
        mfaMethod: 'EMAIL_CODE',
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        deviceHash,
        voteHash
      }
    });

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'VOTE_CONFIRMED',
      entity: 'Vote',
      entityId: created.id,
      afterJson: {
        id: created.id,
        sessionId,
        matterId,
        councilMemberId: councilMember.id,
        vote,
        voteHash
      },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent
    });
    return created;
  }

  async closeVoting(sessionId: string, matterId: string, actor: { sub: string; tenantId: string }) {
    const counts = await this.result(sessionId, matterId, actor.tenantId);
    const status = counts.YES > counts.NO ? 'APPROVED' : 'REJECTED';
    const updated = await this.prisma.$transaction(async (tx) => {
      const matter = await tx.legislativeMatter.update({ where: { id: matterId }, data: { status } });
      const session = await tx.plenarySession.update({ where: { id: sessionId }, data: { status: PlenarySessionStatus.OPENED } });
      await tx.sessionAgendaItem.updateMany({
        where: { tenantId: actor.tenantId, sessionId, matterId },
        data: { status: 'VOTED' }
      });
      return { matter, session, result: counts, outcome: status };
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'VOTING_CLOSED',
      entity: 'LegislativeMatter',
      entityId: matterId,
      afterJson: updated
    });
    return updated;
  }

  async result(sessionId: string, matterId: string, tenantId: string) {
    const votes = await this.prisma.vote.groupBy({
      by: ['vote'],
      where: { tenantId, sessionId, matterId },
      _count: { vote: true }
    });
    const result = { YES: 0, NO: 0, ABSTAIN: 0, ABSENT: 0 };
    for (const item of votes) result[item.vote] = item._count.vote;
    return result;
  }

  private async assertCanVote(actor: { sub: string; tenantId: string | null; role: UserRole }, sessionId: string, matterId: string, vote: VoteValue) {
    if (actor.role !== UserRole.VEREADOR) throw new ForbiddenException('Apenas vereador vota.');
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    if (vote === VoteValue.ABSENT) throw new BadRequestException('Ausencia nao e voto confirmado pelo vereador.');

    const session = await this.prisma.plenarySession.findFirst({ where: { id: sessionId, tenantId: actor.tenantId } });
    const matter = await this.prisma.legislativeMatter.findFirst({ where: { id: matterId, tenantId: actor.tenantId } });
    const councilMember = await this.prisma.councilMember.findFirst({ where: { tenantId: actor.tenantId, userId: actor.sub } });
    if (!session || !matter || !councilMember) throw new ForbiddenException('Dados fora do tenant.');
    if (session.status !== PlenarySessionStatus.OPENED && session.status !== PlenarySessionStatus.VOTING) {
      throw new BadRequestException('Sessao nao esta aberta para votacao.');
    }
    if (matter.status !== 'VOTING') throw new BadRequestException('Materia nao esta em votacao.');

    const existing = await this.prisma.vote.findUnique({
      where: {
        tenantId_sessionId_matterId_councilMemberId: {
          tenantId: actor.tenantId,
          sessionId,
          matterId,
          councilMemberId: councilMember.id
        }
      }
    });
    if (existing) throw new BadRequestException('Voto ja registrado para esta materia.');
    return councilMember;
  }
}
