import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AddAgendaItemDto, ReorderAgendaDto, UpdateAgendaItemDto, UpdateAgendaStatusDto } from './dto';
import { SessionAgendaService } from './session-agenda.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('session-agenda')
export class SessionAgendaController {
  constructor(private readonly service: SessionAgendaService) {}

  @Get(':sessionId')
  @Roles(UserRole.SECRETARIO, UserRole.PRESIDENTE, UserRole.VEREADOR)
  list(@Param('sessionId') sessionId: string, @CurrentUser() user: { tenantId: string }) {
    return this.service.list(sessionId, user.tenantId);
  }

  @Post()
  @Roles(UserRole.SECRETARIO)
  add(@Body() dto: AddAgendaItemDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.add(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.SECRETARIO)
  update(@Param('id') id: string, @Body() dto: UpdateAgendaItemDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/remove')
  @Roles(UserRole.SECRETARIO)
  remove(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.remove(id, user);
  }

  @Patch(':sessionId/reorder')
  @Roles(UserRole.SECRETARIO)
  reorder(@Param('sessionId') sessionId: string, @Body() dto: ReorderAgendaDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.reorder(sessionId, dto.items, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SECRETARIO, UserRole.PRESIDENTE)
  setStatus(@Param('id') id: string, @Body() dto: UpdateAgendaStatusDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.setStatus(id, dto.status, user);
  }
}
