import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreatePortalBannerDto,
  CreatePortalMenuItemDto,
  CreatePortalPageDto,
  UpdatePortalBannerDto,
  UpdatePortalMenuItemDto,
  UpdatePortalPageDto
} from './dto';
import { PortalContentService } from './portal-content.service';

type Actor = { sub: string; tenantId: string | null };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_CAMARA)
@Controller('portal-content')
export class PortalContentController {
  constructor(private readonly service: PortalContentService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() actor: Actor) {
    return this.service.dashboard(actor);
  }

  @Get('pages')
  listPages(@CurrentUser() actor: Actor) {
    return this.service.listPages(actor);
  }

  @Post('pages')
  createPage(@Body() dto: CreatePortalPageDto, @CurrentUser() actor: Actor) {
    return this.service.createPage(dto, actor);
  }

  @Patch('pages/:id')
  updatePage(@Param('id') id: string, @Body() dto: UpdatePortalPageDto, @CurrentUser() actor: Actor) {
    return this.service.updatePage(id, dto, actor);
  }

  @Get('pages/:id/preview')
  previewPage(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.service.previewPage(id, actor);
  }

  @Post('pages/:id/publish')
  publishPage(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.service.publishPage(id, actor);
  }

  @Post('pages/:id/unpublish')
  unpublishPage(@Param('id') id: string, @CurrentUser() actor: Actor) {
    return this.service.unpublishPage(id, actor);
  }

  @Get('banners')
  listBanners(@CurrentUser() actor: Actor) {
    return this.service.listBanners(actor);
  }

  @Post('banners')
  createBanner(@Body() dto: CreatePortalBannerDto, @CurrentUser() actor: Actor) {
    return this.service.createBanner(dto, actor);
  }

  @Patch('banners/:id')
  updateBanner(@Param('id') id: string, @Body() dto: UpdatePortalBannerDto, @CurrentUser() actor: Actor) {
    return this.service.updateBanner(id, dto, actor);
  }

  @Get('menu')
  listMenu(@CurrentUser() actor: Actor) {
    return this.service.listMenu(actor);
  }

  @Post('menu')
  createMenuItem(@Body() dto: CreatePortalMenuItemDto, @CurrentUser() actor: Actor) {
    return this.service.createMenuItem(dto, actor);
  }

  @Patch('menu/:id')
  updateMenuItem(@Param('id') id: string, @Body() dto: UpdatePortalMenuItemDto, @CurrentUser() actor: Actor) {
    return this.service.updateMenuItem(id, dto, actor);
  }

  @Get('preview')
  previewPortal(@CurrentUser() actor: Actor) {
    return this.service.previewPortal(actor);
  }
}
