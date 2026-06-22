import { Injectable, NotFoundException } from '@nestjs/common';
import { LegislativeMatterStatus, PlenarySessionStatus, PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type TenantLookupMode = 'document' | 'host';

@Injectable()
export class PublicPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async home(identifier: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    const [matters, sessions, councilMembers] = await Promise.all([
      this.prisma.legislativeMatter.count({ where: { tenantId: tenant.id, status: { in: ['APPROVED', 'REJECTED', 'ARCHIVED'] } } }),
      this.prisma.plenarySession.count({ where: { tenantId: tenant.id, status: PlenarySessionStatus.CLOSED } }),
      this.prisma.councilMember.count({ where: { tenantId: tenant.id, status: 'ACTIVE' } })
    ]);
    return { tenant, stats: { matters, sessions, councilMembers } };
  }

  async matters(identifier: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    return this.prisma.legislativeMatter.findMany({
      where: { tenantId: tenant.id, status: { in: [LegislativeMatterStatus.APPROVED, LegislativeMatterStatus.REJECTED, LegislativeMatterStatus.ARCHIVED] } },
      include: { author: true },
      orderBy: [{ year: 'desc' }, { number: 'desc' }]
    });
  }

  async sessions(identifier: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    return this.prisma.plenarySession.findMany({
      where: { tenantId: tenant.id, status: PlenarySessionStatus.CLOSED },
      include: {
        agendaItems: {
          include: {
            matter: true
          },
          orderBy: { order: 'asc' }
        },
        attendances: { include: { councilMember: { select: { id: true, name: true, party: true } } } },
        votes: { include: { councilMember: { select: { id: true, name: true, party: true } }, matter: true } },
        minute: true
      },
      orderBy: { date: 'desc' }
    });
  }

  async councilMembers(identifier: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    return this.prisma.councilMember.findMany({ where: { tenantId: tenant.id, status: 'ACTIVE' }, orderBy: { name: 'asc' } });
  }

  async branding(identifier: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    return this.prisma.tenantBranding.findUnique({ where: { tenantId: tenant.id } });
  }

  async content(identifier: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    const [pages, banners, menu] = await Promise.all([
      this.prisma.portalPage.findMany({ where: { tenantId: tenant.id, status: PublicationStatus.PUBLISHED }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.portalBanner.findMany({ where: { tenantId: tenant.id, status: PublicationStatus.PUBLISHED, active: true }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] }),
      this.prisma.portalMenuItem.findMany({ where: { tenantId: tenant.id, active: true }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] })
    ]);
    return { pages, banners, menu };
  }

  async minutes(identifier: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    return this.prisma.sessionMinute.findMany({
      where: { tenantId: tenant.id, status: 'PUBLISHED' },
      include: { session: true },
      orderBy: { publishedAt: 'desc' }
    });
  }

  async protocols(identifier: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    return this.prisma.protocol.findMany({
      where: { tenantId: tenant.id, status: 'ATTACHED_TO_MATTER', matter: { status: { in: [LegislativeMatterStatus.PROTOCOLLED, LegislativeMatterStatus.IN_SESSION, LegislativeMatterStatus.VOTING, LegislativeMatterStatus.APPROVED, LegislativeMatterStatus.REJECTED, LegislativeMatterStatus.ARCHIVED] } } },
      include: { matter: { select: { id: true, type: true, number: true, year: true, title: true, status: true } } },
      orderBy: [{ year: 'desc' }, { protocolNumber: 'desc' }]
    });
  }

  async votingNominal(identifier: string, sessionId: string, matterId: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    const matter = await this.prisma.legislativeMatter.findFirst({ where: { tenantId: tenant.id, id: matterId, status: { in: [LegislativeMatterStatus.APPROVED, LegislativeMatterStatus.REJECTED, LegislativeMatterStatus.ARCHIVED] } } });
    if (!matter) throw new NotFoundException('Votacao publica nao encontrada.');
    return this.prisma.vote.findMany({
      where: { tenantId: tenant.id, sessionId, matterId },
      include: { councilMember: { select: { id: true, name: true, party: true } } },
      orderBy: { confirmedAt: 'asc' }
    }).then((votes) => votes.map((vote) => ({
      councilMember: vote.councilMember,
      vote: vote.vote,
      confirmedAt: vote.confirmedAt,
      hash: `${vote.voteHash.slice(0, 12)}...`
    })));
  }

  async votingResult(identifier: string, sessionId: string, matterId: string, mode: TenantLookupMode = 'document') {
    const tenant = await this.findTenant(identifier, mode);
    const votes = await this.prisma.vote.groupBy({
      by: ['vote'],
      where: { tenantId: tenant.id, sessionId, matterId },
      _count: { vote: true }
    });
    return votes.reduce(
      (acc, item) => ({ ...acc, [item.vote]: item._count.vote }),
      { YES: 0, NO: 0, ABSTAIN: 0, ABSENT: 0 }
    );
  }

  private async findTenant(identifier: string, mode: TenantLookupMode) {
    const tenant = mode === 'host' ? await this.findTenantByHost(identifier) : await this.prisma.tenant.findUnique({ where: { document: identifier } });
    if (!tenant || tenant.status !== 'ACTIVE') throw new NotFoundException('Portal publico nao encontrado.');
    return tenant;
  }

  private async findTenantByHost(host: string) {
    const normalizedHost = this.normalizeHost(host);
    const domain = await this.prisma.tenantDomain.findFirst({
      where: { hostname: normalizedHost },
      include: { tenant: true }
    });
    if (domain?.tenant) return domain.tenant;

    const localSlug = normalizedHost.endsWith('.localhost') ? normalizedHost.replace(/\.localhost$/, '') : normalizedHost.split('.')[0];
    if (!localSlug || localSlug === 'localhost' || localSlug === '127') return null;

    const tenants = await this.prisma.tenant.findMany({ where: { status: 'ACTIVE' }, take: 100 });
    return tenants.find((tenant) => {
      const nameSlug = this.slugify(tenant.name);
      const citySlug = this.slugify(tenant.city);
      return nameSlug === localSlug || citySlug === localSlug || nameSlug.endsWith(`-${localSlug}`) || nameSlug.includes(localSlug);
    }) ?? null;
  }

  private normalizeHost(host: string) {
    const decoded = decodeURIComponent(host).toLowerCase().trim();
    return decoded.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '').replace(/^www\./, '');
  }

  private slugify(value: string | null) {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
