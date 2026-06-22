import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLegislativeMatterDto, UpdateLegislativeMatterDto, UpdateMatterStatusDto } from './dto';
import { LegislativeMattersService } from './legislative-matters.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('legislative-matters')
export class LegislativeMattersController {
  constructor(private readonly service: LegislativeMattersService) {}

  @Get()
  @Roles(UserRole.ADMIN_CAMARA, UserRole.SECRETARIO, UserRole.PRESIDENTE, UserRole.VEREADOR)
  list(@CurrentUser() user: { tenantId: string }) {
    return this.service.list(user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_CAMARA, UserRole.SECRETARIO, UserRole.PRESIDENTE, UserRole.VEREADOR)
  detail(@Param('id') id: string, @CurrentUser() user: { tenantId: string }) {
    return this.service.detail(id, user.tenantId);
  }

  @Post()
  @Roles(UserRole.SECRETARIO)
  create(@Body() dto: CreateLegislativeMatterDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.create(dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SECRETARIO, UserRole.PRESIDENTE)
  setStatus(@Param('id') id: string, @Body() dto: UpdateMatterStatusDto, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.setStatus(id, dto.status, user);
  }

  @Patch(':id')
  @Roles(UserRole.SECRETARIO)
  update(@Param('id') id: string, @Body() dto: UpdateLegislativeMatterDto, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/protocol')
  @Roles(UserRole.SECRETARIO)
  protocol(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.protocol(id, user);
  }

  @Post(':id/send-to-agenda')
  @Roles(UserRole.SECRETARIO)
  sendToAgenda(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.sendToAgenda(id, user);
  }
}
