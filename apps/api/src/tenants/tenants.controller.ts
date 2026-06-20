import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TenantStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTenantDto, UpdateTenantDto } from './dto';
import { TenantsService } from './tenants.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get()
  @Roles(UserRole.MASTER)
  list() {
    return this.service.list();
  }

  @Post()
  @Roles(UserRole.MASTER)
  create(@Body() dto: CreateTenantDto, @CurrentUser() user: { sub: string }) {
    return this.service.create(dto, user.sub);
  }

  @Patch(':id/status')
  @Roles(UserRole.MASTER)
  setStatus(@Param('id') id: string, @Body() dto: UpdateTenantDto, @CurrentUser() user: { sub: string }) {
    return this.service.setStatus(id, dto.status as TenantStatus, user.sub);
  }
}
