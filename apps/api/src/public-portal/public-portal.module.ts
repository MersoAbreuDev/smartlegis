import { Module } from '@nestjs/common';
import { PublicPortalController, PublicPortalHostController } from './public-portal.controller';
import { PublicPortalService } from './public-portal.service';

@Module({
  controllers: [PublicPortalController, PublicPortalHostController],
  providers: [PublicPortalService]
})
export class PublicPortalModule {}
