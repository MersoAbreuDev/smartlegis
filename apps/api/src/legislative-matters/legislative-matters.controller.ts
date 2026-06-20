import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLegislativeMatterDto, UpdateMatterStatusDto } from './dto';
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
}
