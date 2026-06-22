import { Controller, Get, Param } from '@nestjs/common';
import { PublicPortalService } from './public-portal.service';

@Controller('public/:document')
export class PublicPortalController {
  constructor(private readonly service: PublicPortalService) {}

  @Get()
  home(@Param('document') document: string) {
    return this.service.home(document);
  }

  @Get('matters')
  matters(@Param('document') document: string) {
    return this.service.matters(document);
  }

  @Get('sessions')
  sessions(@Param('document') document: string) {
    return this.service.sessions(document);
  }

  @Get('council-members')
  councilMembers(@Param('document') document: string) {
    return this.service.councilMembers(document);
  }

  @Get('branding')
  branding(@Param('document') document: string) {
    return this.service.branding(document);
  }

  @Get('content')
  content(@Param('document') document: string) {
    return this.service.content(document);
  }

  @Get('minutes')
  minutes(@Param('document') document: string) {
    return this.service.minutes(document);
  }

  @Get('protocols')
  protocols(@Param('document') document: string) {
    return this.service.protocols(document);
  }

  @Get('sessions/:sessionId/matters/:matterId/result')
  votingResult(@Param('document') document: string, @Param('sessionId') sessionId: string, @Param('matterId') matterId: string) {
    return this.service.votingResult(document, sessionId, matterId);
  }

  @Get('sessions/:sessionId/matters/:matterId/nominal')
  votingNominal(@Param('document') document: string, @Param('sessionId') sessionId: string, @Param('matterId') matterId: string) {
    return this.service.votingNominal(document, sessionId, matterId);
  }
}

@Controller('public-host/:host')
export class PublicPortalHostController {
  constructor(private readonly service: PublicPortalService) {}

  @Get()
  home(@Param('host') host: string) {
    return this.service.home(host, 'host');
  }

  @Get('matters')
  matters(@Param('host') host: string) {
    return this.service.matters(host, 'host');
  }

  @Get('sessions')
  sessions(@Param('host') host: string) {
    return this.service.sessions(host, 'host');
  }

  @Get('council-members')
  councilMembers(@Param('host') host: string) {
    return this.service.councilMembers(host, 'host');
  }

  @Get('branding')
  branding(@Param('host') host: string) {
    return this.service.branding(host, 'host');
  }

  @Get('content')
  content(@Param('host') host: string) {
    return this.service.content(host, 'host');
  }

  @Get('minutes')
  minutes(@Param('host') host: string) {
    return this.service.minutes(host, 'host');
  }

  @Get('protocols')
  protocols(@Param('host') host: string) {
    return this.service.protocols(host, 'host');
  }

  @Get('sessions/:sessionId/matters/:matterId/result')
  votingResult(@Param('host') host: string, @Param('sessionId') sessionId: string, @Param('matterId') matterId: string) {
    return this.service.votingResult(host, sessionId, matterId, 'host');
  }

  @Get('sessions/:sessionId/matters/:matterId/nominal')
  votingNominal(@Param('host') host: string, @Param('sessionId') sessionId: string, @Param('matterId') matterId: string) {
    return this.service.votingNominal(host, sessionId, matterId, 'host');
  }
}
