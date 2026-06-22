import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GenerateMinuteDto, UpdateMinuteDto } from './dto';
import { SessionMinutesService } from './session-minutes.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('session-minutes')
export class SessionMinutesController {
  constructor(private readonly service: SessionMinutesService) {}

  @Get()
  @Roles(UserRole.SECRETARIO)
  list(@CurrentUser() user: { tenantId: string | null }) {
    return this.service.list(user);
  }

  @Get(':sessionId')
  @Roles(UserRole.SECRETARIO, UserRole.PRESIDENTE)
  detail(@Param('sessionId') sessionId: string, @CurrentUser() user: { tenantId: string | null }) {
    return this.service.detail(sessionId, user);
  }

  @Post(':sessionId/generate')
  @Roles(UserRole.SECRETARIO)
  generate(@Param('sessionId') sessionId: string, @Body() dto: GenerateMinuteDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.generate(sessionId, dto.observations, user);
  }

  @Patch(':sessionId')
  @Roles(UserRole.SECRETARIO)
  update(@Param('sessionId') sessionId: string, @Body() dto: UpdateMinuteDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.update(sessionId, dto.content, user);
  }

  @Patch(':sessionId/send-review')
  @Roles(UserRole.SECRETARIO)
  sendReview(@Param('sessionId') sessionId: string, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.sendReview(sessionId, user);
  }

  @Patch(':sessionId/approve')
  @Roles(UserRole.PRESIDENTE)
  approve(@Param('sessionId') sessionId: string, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.approve(sessionId, user);
  }

  @Patch(':sessionId/publish')
  @Roles(UserRole.SECRETARIO)
  publish(@Param('sessionId') sessionId: string, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.publish(sessionId, user);
  }

  @Get(':sessionId/preview')
  @Roles(UserRole.SECRETARIO, UserRole.PRESIDENTE)
  preview(@Param('sessionId') sessionId: string, @CurrentUser() user: { tenantId: string | null }) {
    return this.service.preview(sessionId, user);
  }
}
