import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JustifyAttendanceDto, UpdateAttendanceDto, UpsertAttendanceBatchDto } from './dto';
import { SessionAttendanceService } from './session-attendance.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('session-attendance')
export class SessionAttendanceController {
  constructor(private readonly service: SessionAttendanceService) {}

  @Get(':sessionId')
  @Roles(UserRole.SECRETARIO, UserRole.PRESIDENTE, UserRole.VEREADOR)
  list(@Param('sessionId') sessionId: string, @CurrentUser() user: { tenantId: string | null }) {
    return this.service.list(sessionId, user);
  }

  @Post(':sessionId')
  @Roles(UserRole.SECRETARIO)
  upsertBatch(@Param('sessionId') sessionId: string, @Body() dto: UpsertAttendanceBatchDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.upsertBatch(sessionId, dto.items, user);
  }

  @Patch(':sessionId/:councilMemberId')
  @Roles(UserRole.SECRETARIO)
  updateOne(@Param('sessionId') sessionId: string, @Param('councilMemberId') councilMemberId: string, @Body() dto: UpdateAttendanceDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.updateOne(sessionId, councilMemberId, dto.status, dto.justification, user);
  }

  @Post(':sessionId/:councilMemberId/justify')
  @Roles(UserRole.SECRETARIO, UserRole.VEREADOR)
  justify(
    @Param('sessionId') sessionId: string,
    @Param('councilMemberId') councilMemberId: string,
    @Body() dto: JustifyAttendanceDto,
    @CurrentUser() user: { sub: string; tenantId: string | null; role: UserRole }
  ) {
    return this.service.justify(sessionId, councilMemberId, dto.justification, user);
  }
}
