import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PublicationStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePortalBannerDto,
  CreatePortalMenuItemDto,
  CreatePortalPageDto,
  UpdatePortalBannerDto,
  UpdatePortalMenuItemDto,
  UpdatePortalPageDto
} from './dto';

type Actor = { sub: string; tenantId: string | null };

@Injectable()
export class PortalContentService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogsService) {}

  dashboard(actor: Actor) {
    const tenantId = this.requireTenant(actor);
    return Promise.all([
      this.prisma.user.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.councilMember.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.portalPage.count({ where: { tenantId, status: PublicationStatus.PUBLISHED } }),
      this.prisma.auditLog.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5 })
    ]).then(([activeUsers, activeCouncilMembers, publishedContents, latestAuditLogs]) => ({
      activeUsers,
      activeCouncilMembers,
      publishedContents,
      latestAuditLogs
    }));
  }

  listPages(actor: Actor) {
    const tenantId = this.requireTenant(actor);
    return this.prisma.portalPage.findMany({ where: { tenantId }, orderBy: { updatedAt: 'desc' } });
  }

  async createPage(dto: CreatePortalPageDto, actor: Actor) {
    const tenantId = this.requireTenant(actor);
    const page = await this.prisma.portalPage.create({
      data: {
        tenantId,
        slug: this.slugify(dto.slug),
        title: dto.title,
        summary: dto.summary,
        content: dto.content,
        status: dto.status ?? PublicationStatus.DRAFT,
        publishedAt: dto.status === PublicationStatus.PUBLISHED ? new Date() : null,
        createdBy: actor.sub
      }
    });
    await this.record(actor, 'PORTAL_PAGE_CREATED', 'PortalPage', page.id, null, page);
    return page;
  }

  async updatePage(id: string, dto: UpdatePortalPageDto, actor: Actor) {
    const before = await this.findPage(id, actor);
    const status = dto.status;
    const page = await this.prisma.portalPage.update({
      where: { id },
      data: {
        slug: dto.slug ? this.slugify(dto.slug) : undefined,
        title: dto.title,
        summary: dto.summary,
        content: dto.content,
        status,
        publishedAt: status === PublicationStatus.PUBLISHED ? new Date() : status ? null : undefined,
        updatedBy: actor.sub
      }
    });
    await this.record(actor, 'PORTAL_PAGE_UPDATED', 'PortalPage', page.id, before, page);
    return page;
  }

  previewPage(id: string, actor: Actor) {
    return this.findPage(id, actor);
  }

  publishPage(id: string, actor: Actor) {
    return this.updatePage(id, { status: PublicationStatus.PUBLISHED }, actor);
  }

  unpublishPage(id: string, actor: Actor) {
    return this.updatePage(id, { status: PublicationStatus.UNPUBLISHED }, actor);
  }

  listBanners(actor: Actor) {
    const tenantId = this.requireTenant(actor);
    return this.prisma.portalBanner.findMany({ where: { tenantId }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] });
  }

  async createBanner(dto: CreatePortalBannerDto, actor: Actor) {
    const tenantId = this.requireTenant(actor);
    const banner = await this.prisma.portalBanner.create({
      data: {
        tenantId,
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? PublicationStatus.DRAFT,
        publishedAt: dto.status === PublicationStatus.PUBLISHED ? new Date() : null,
        createdBy: actor.sub
      }
    });
    await this.record(actor, 'PORTAL_BANNER_CREATED', 'PortalBanner', banner.id, null, banner);
    return banner;
  }

  async updateBanner(id: string, dto: UpdatePortalBannerDto, actor: Actor) {
    const before = await this.findBanner(id, actor);
    const banner = await this.prisma.portalBanner.update({
      where: { id },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        sortOrder: dto.sortOrder,
        active: dto.active,
        status: dto.status,
        publishedAt: dto.status === PublicationStatus.PUBLISHED ? new Date() : dto.status ? null : undefined,
        updatedBy: actor.sub
      }
    });
    await this.record(actor, 'PORTAL_BANNER_UPDATED', 'PortalBanner', banner.id, before, banner);
    return banner;
  }

  listMenu(actor: Actor) {
    const tenantId = this.requireTenant(actor);
    return this.prisma.portalMenuItem.findMany({ where: { tenantId }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] });
  }

  async createMenuItem(dto: CreatePortalMenuItemDto, actor: Actor) {
    const tenantId = this.requireTenant(actor);
    const item = await this.prisma.portalMenuItem.create({
      data: {
        tenantId,
        label: dto.label,
        url: dto.url,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: actor.sub
      }
    });
    await this.record(actor, 'PORTAL_MENU_ITEM_CREATED', 'PortalMenuItem', item.id, null, item);
    return item;
  }

  async updateMenuItem(id: string, dto: UpdatePortalMenuItemDto, actor: Actor) {
    const before = await this.findMenuItem(id, actor);
    const item = await this.prisma.portalMenuItem.update({ where: { id }, data: { ...dto, updatedBy: actor.sub } });
    await this.record(actor, 'PORTAL_MENU_ITEM_UPDATED', 'PortalMenuItem', item.id, before, item);
    return item;
  }

  async previewPortal(actor: Actor) {
    const tenantId = this.requireTenant(actor);
    const [pages, banners, menu] = await Promise.all([
      this.prisma.portalPage.findMany({ where: { tenantId }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.portalBanner.findMany({ where: { tenantId }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] }),
      this.prisma.portalMenuItem.findMany({ where: { tenantId }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] })
    ]);
    return { pages, banners, menu };
  }

  private requireTenant(actor: Actor) {
    if (!actor.tenantId) throw new ForbiddenException('Tenant obrigatorio.');
    return actor.tenantId;
  }

  private async findPage(id: string, actor: Actor) {
    const tenantId = this.requireTenant(actor);
    const page = await this.prisma.portalPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException('Pagina do portal nao encontrada.');
    return page;
  }

  private async findBanner(id: string, actor: Actor) {
    const tenantId = this.requireTenant(actor);
    const banner = await this.prisma.portalBanner.findFirst({ where: { id, tenantId } });
    if (!banner) throw new NotFoundException('Banner do portal nao encontrado.');
    return banner;
  }

  private async findMenuItem(id: string, actor: Actor) {
    const tenantId = this.requireTenant(actor);
    const item = await this.prisma.portalMenuItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Item de menu nao encontrado.');
    return item;
  }

  private slugify(input: string) {
    return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private record(actor: Actor, action: string, entity: string, entityId: string, beforeJson: unknown, afterJson: unknown) {
    return this.audit.record({
      tenantId: this.requireTenant(actor),
      actorUserId: actor.sub,
      action,
      entity,
      entityId,
      beforeJson: beforeJson as never,
      afterJson: afterJson as never
    });
  }
}
