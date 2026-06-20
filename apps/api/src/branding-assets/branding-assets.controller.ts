import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';
import { BrandingAssetsService } from './branding-assets.service';

@Controller('branding/assets')
export class BrandingAssetsController {
  constructor(private readonly service: BrandingAssetsService) {}

  @Get(':tenantId/:slot')
  async serve(@Param('tenantId') tenantId: string, @Param('slot') slot: string, @Res() res: Response) {
    const filePath = this.service.resolveAssetPath(tenantId, slot);
    if (!filePath || !existsSync(filePath)) throw new NotFoundException('Logo nao encontrado.');
    return res.sendFile(filePath);
  }
}
