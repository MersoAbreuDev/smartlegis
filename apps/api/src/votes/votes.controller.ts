import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ConfirmVoteDto, RequestVoteMfaDto, StartVotingDto } from './dto';
import { VotesService } from './votes.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('votes')
export class VotesController {
  constructor(private readonly service: VotesService) {}

  @Post('start')
  @Roles(UserRole.PRESIDENTE)
  start(@Body() dto: StartVotingDto, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.startVoting(dto.sessionId, dto.matterId, user);
  }

  @Post('mfa')
  @Roles(UserRole.VEREADOR)
  requestMfa(@Body() dto: RequestVoteMfaDto, @CurrentUser() user: { sub: string; tenantId: string | null; role: UserRole }) {
    return this.service.requestVoteMfa(user, dto.sessionId, dto.matterId, dto.vote);
  }

  @Post('confirm')
  @Roles(UserRole.VEREADOR)
  confirm(
    @Body() dto: ConfirmVoteDto,
    @CurrentUser() user: { sub: string; tenantId: string | null; role: UserRole },
    @Req() request: Request
  ) {
    return this.service.confirmVote(user, dto.sessionId, dto.matterId, dto.vote, dto.challengeId, dto.code, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    });
  }

  @Patch(':sessionId/:matterId/close')
  @Roles(UserRole.PRESIDENTE)
  close(@Param('sessionId') sessionId: string, @Param('matterId') matterId: string, @CurrentUser() user: { sub: string; tenantId: string }) {
    return this.service.closeVoting(sessionId, matterId, user);
  }

  @Get(':sessionId/:matterId/result')
  @Roles(UserRole.SECRETARIO, UserRole.PRESIDENTE, UserRole.VEREADOR)
  result(@Param('sessionId') sessionId: string, @Param('matterId') matterId: string, @CurrentUser() user: { tenantId: string }) {
    return this.service.result(sessionId, matterId, user.tenantId);
  }
}
