import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Roles(UserRole.MASTER, UserRole.ADMIN_CAMARA)
  list(@CurrentUser() user: { tenantId: string | null; role: UserRole }) {
    return this.service.list(user);
  }

  @Post()
  @Roles(UserRole.MASTER, UserRole.ADMIN_CAMARA)
  create(@Body() dto: CreateUserDto, @CurrentUser() user: { sub: string; tenantId: string | null; role: UserRole }) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.MASTER, UserRole.ADMIN_CAMARA)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: { sub: string; tenantId: string | null; role: UserRole }) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/block')
  @Roles(UserRole.MASTER, UserRole.ADMIN_CAMARA)
  block(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string | null; role: UserRole }) {
    return this.service.update(id, { status: 'INACTIVE' }, user);
  }

  @Patch(':id/reactivate')
  @Roles(UserRole.MASTER, UserRole.ADMIN_CAMARA)
  reactivate(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string | null; role: UserRole }) {
    return this.service.update(id, { status: 'ACTIVE' }, user);
  }
}
