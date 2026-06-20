import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CouncilMemberStatus, Prisma, UserRole } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouncilMemberDto, UpdateCouncilMemberDto } from './dto';

const optionalStringFields = [
  'cpf',
  'rg',
  'occupation',
  'email',
  'phone',
  'mobile',
  'zipCode',
  'street',
  'number',
  'complement',
  'neighborhood',
  'city',
  'state',
  'businessDocument',
  'businessName',
  'businessTradeName',
  'businessEmail',
  'businessPhone',
  'businessZipCode',
  'businessStreet',
  'businessNumber',
  'businessComplement',
  'businessNeighborhood',
  'businessCity',
  'businessState',
  'legislativePeriod',
  'legislativeRole'
] as const;

const optionalBooleanFields = ['isPresident', 'isSecretary'] as const;

@Injectable()
export class CouncilMembersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  list(tenantId: string) {
    return this.prisma.councilMember.findMany({
      where: { tenantId },
      include: { user: { select: { email: true, status: true } } },
      orderBy: { name: 'asc' }
    });
  }

  async create(dto: CreateCouncilMemberDto, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    if (dto.userId) await this.assertVereadorUser(dto.userId, actor.tenantId);

    const createData: Prisma.CouncilMemberCreateInput = {
      tenant: { connect: { id: actor.tenantId } },
      ...(dto.userId ? { user: { connect: { id: dto.userId } } } : {}),
      name: dto.name,
      party: dto.party,
      photoUrl: dto.photoUrl,
      ...this.buildOptionalData(dto),
      termStart: new Date(dto.termStart),
      termEnd: new Date(dto.termEnd)
    };

    const member = await this.prisma.councilMember.create({
      data: createData
    });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'COUNCIL_MEMBER_CREATED',
      entity: 'CouncilMember',
      entityId: member.id,
      afterJson: member
    });
    return member;
  }

  async update(id: string, dto: UpdateCouncilMemberDto, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const before = await this.findInTenant(id, actor.tenantId);
    const data: Prisma.CouncilMemberUpdateInput = {};

    if (dto.userId !== undefined) {
      await this.assertVereadorUser(dto.userId, actor.tenantId);
      data.user = { connect: { id: dto.userId } };
    }
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.party !== undefined) data.party = dto.party;
    if (dto.photoUrl !== undefined) data.photoUrl = dto.photoUrl || null;
    Object.assign(data, this.buildOptionalData(dto));
    if (dto.termStart !== undefined) data.termStart = new Date(dto.termStart);
    if (dto.termEnd !== undefined) data.termEnd = new Date(dto.termEnd);

    const member = await this.prisma.councilMember.update({ where: { id }, data, include: { user: { select: { email: true, status: true } } } });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'COUNCIL_MEMBER_UPDATED',
      entity: 'CouncilMember',
      entityId: member.id,
      beforeJson: before,
      afterJson: member
    });
    return member;
  }

  async setStatus(id: string, status: CouncilMemberStatus, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const before = await this.findInTenant(id, actor.tenantId);
    const member = await this.prisma.councilMember.update({ where: { id }, data: { status }, include: { user: { select: { email: true, status: true } } } });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: `COUNCIL_MEMBER_${status}`,
      entity: 'CouncilMember',
      entityId: member.id,
      beforeJson: before,
      afterJson: member
    });
    return member;
  }

  async linkUser(id: string, userId: string | null, actor: { sub: string; tenantId: string | null }) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    const before = await this.findInTenant(id, actor.tenantId);
    if (userId) await this.assertVereadorUser(userId, actor.tenantId);
    const data: Prisma.CouncilMemberUpdateInput = userId
      ? { user: { connect: { id: userId } } }
      : { user: { disconnect: true } };
    const member = await this.prisma.councilMember.update({ where: { id }, data, include: { user: { select: { email: true, status: true } } } });
    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: userId ? 'COUNCIL_MEMBER_USER_LINKED' : 'COUNCIL_MEMBER_USER_UNLINKED',
      entity: 'CouncilMember',
      entityId: member.id,
      beforeJson: before,
      afterJson: member
    });
    return member;
  }

  private async findInTenant(id: string, tenantId: string) {
    const member = await this.prisma.councilMember.findFirst({ where: { id, tenantId }, include: { user: { select: { email: true, status: true } } } });
    if (!member) throw new NotFoundException('Vereador nao encontrado.');
    return member;
  }

  private async assertVereadorUser(userId: string, tenantId: string) {
    const targetUser = await this.prisma.user.findFirst({ where: { id: userId, tenantId, role: UserRole.VEREADOR } });
    if (!targetUser) throw new ForbiddenException('Usuario vereador invalido para este tenant.');
  }

  private buildOptionalData(dto: CreateCouncilMemberDto | UpdateCouncilMemberDto) {
    const data: Record<string, string | boolean | Date | null> = {};
    for (const field of optionalStringFields) {
      if (dto[field] !== undefined) data[field] = dto[field] || null;
    }
    for (const field of optionalBooleanFields) {
      if (dto[field] !== undefined) data[field] = Boolean(dto[field]);
    }
    if (dto.birthDate !== undefined) data.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    return data;
  }
}
