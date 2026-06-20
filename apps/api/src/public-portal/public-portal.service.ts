import { Injectable, NotFoundException } from '@nestjs/common';
import { LegislativeMatterStatus, PlenarySessionStatus, PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async home(document: string) {
    const tenant = await this.findTenant(document);
    const [matters, sessions, councilMembers] = await Promise.all([
      this.prisma.legislativeMatter.count({ where: { tenantId: tenant.id, status: { in: ['APPROVED', 'REJECTED', 'ARCHIVED'] } } }),
      this.prisma.plenarySession.count({ where: { tenantId: tenant.id, status: PlenarySessionStatus.CLOSED } }),
      this.prisma.councilMember.count({ where: { tenantId: tenant.id, status: 'ACTIVE' } })
    ]);
    return { tenant, stats: { matters, sessions, councilMembers } };
  }

  async matters(document: string) {
    const tenant = await this.findTenant(document);
    return this.prisma.legislativeMatter.findMany({
      where: { tenantId: tenant.id, status: { in: [LegislativeMatterStatus.APPROVED, LegislativeMatterStatus.REJECTED, LegislativeMatterStatus.ARCHIVED] } },
      include: { author: true },
      orderBy: [{ year: 'desc' }, { number: 'desc' }]
    });
  }

  async sessions(document: string) {
    const tenant = await this.findTenant(document);
    return this.prisma.plenarySession.findMany({
      where: { tenantId: tenant.id, status: PlenarySessionStatus.CLOSED },
      include: {
        agendaItems: {
          include: {
            matter: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async councilMembers(document: string) {
    const tenant = await this.findTenant(document);
    return this.prisma.councilMember.findMany({ where: { tenantId: tenant.id, status: 'ACTIVE' }, orderBy: { name: 'asc' } });
  }

  async branding(document: string) {
    const tenant = await this.findTenant(document);
    return this.prisma.tenantBranding.findUnique({ where: { tenantId: tenant.id } });
  }

  async content(document: string) {
    const tenant = await this.findTenant(document);
    const [pages, banners, menu] = await Promise.all([
      this.prisma.portalPage.findMany({ where: { tenantId: tenant.id, status: PublicationStatus.PUBLISHED }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.portalBanner.findMany({ where: { tenantId: tenant.id, status: PublicationStatus.PUBLISHED, active: true }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] }),
      this.prisma.portalMenuItem.findMany({ where: { tenantId: tenant.id, active: true }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] })
    ]);
    return { pages, banners, menu };
  }

  async votingResult(document: string, sessionId: string, matterId: string) {
    const tenant = await this.findTenant(document);
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

  private async findTenant(document: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { document } });
    if (!tenant || tenant.status !== 'ACTIVE') throw new NotFoundException('Portal publico nao encontrado.');
    return tenant;
  }
}
