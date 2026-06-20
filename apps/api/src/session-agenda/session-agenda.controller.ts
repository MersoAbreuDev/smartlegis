import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AddAgendaItemDto } from './dto';
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
}
