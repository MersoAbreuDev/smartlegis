import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateAdminProfileDto, UpdateAdminProfileDto } from './dto';
import { RolesService } from './roles.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @Roles(UserRole.MASTER, UserRole.ADMIN_CAMARA)
  list() {
    return this.service.listSystemRoles();
  }

  @Get('modules')
  @Roles(UserRole.ADMIN_CAMARA)
  modules() {
    return this.service.listAvailableModules();
  }

  @Get('profiles')
  @Roles(UserRole.ADMIN_CAMARA)
  profiles(@CurrentUser() user: { tenantId: string | null }) {
    return this.service.listProfiles(user);
  }

  @Post('profiles')
  @Roles(UserRole.ADMIN_CAMARA)
  createProfile(@Body() dto: CreateAdminProfileDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.createProfile(dto, user);
  }

  @Patch('profiles/:id')
  @Roles(UserRole.ADMIN_CAMARA)
  updateProfile(@Param('id') id: string, @Body() dto: UpdateAdminProfileDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.updateProfile(id, dto, user);
  }
}
