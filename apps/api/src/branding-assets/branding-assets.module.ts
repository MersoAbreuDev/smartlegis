import { Module } from '@nestjs/common';
import { BrandingAssetsController } from './branding-assets.controller';
import { BrandingAssetsService } from './branding-assets.service';

@Module({
  controllers: [BrandingAssetsController],
  providers: [BrandingAssetsService],
  exports: [BrandingAssetsService]
})
export class BrandingAssetsModule {}
