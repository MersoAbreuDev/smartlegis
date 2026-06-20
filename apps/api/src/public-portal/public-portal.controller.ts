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

  @Get('sessions/:sessionId/matters/:matterId/result')
  votingResult(@Param('document') document: string, @Param('sessionId') sessionId: string, @Param('matterId') matterId: string) {
    return this.service.votingResult(document, sessionId, matterId);
  }
}
