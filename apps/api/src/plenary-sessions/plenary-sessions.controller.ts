import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePlenarySessionDto, UpdatePlenarySessionDto } from './dto';
import { PlenarySessionsService } from './plenary-sessions.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plenary-sessions')
export class PlenarySessionsController {
  constructor(private readonly service: PlenarySessionsService) {}

  @Get()
  @Roles(UserRole.ADMIN_CAMARA, UserRole.SECRETARIO, UserRole.PRESIDENTE, UserRole.VEREADOR)
  list(@CurrentUser() user: { tenantId: string }) {
    return this.service.list(user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.SECRETARIO, UserRole.PRESIDENTE, UserRole.VEREADOR)
  detail(@Param('id') id: string, @CurrentUser() user: { tenantId: string }) {
    return this.service.detail(id, user.tenantId);
  }

  @Post()
  @Roles(UserRole.SECRETARIO)
  create(@Body() dto: CreatePlenarySessionDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.create(dto, user);
  }

  @Patch(':id/open')
  @Roles(UserRole.PRESIDENTE)
  open(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.open(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SECRETARIO)
  update(@Param('id') id: string, @Body() dto: UpdatePlenarySessionDto, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.SECRETARIO)
  cancel(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.cancel(id, user);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.PRESIDENTE)
  suspend(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.suspend(id, user);
  }

  @Patch(':id/close')
  @Roles(UserRole.PRESIDENTE)
  close(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.close(id, user);
  }
}
