import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { BrandingAssetsModule } from '../branding-assets/branding-assets.module';
import { MasterController } from './master.controller';
import { MasterService } from './master.service';

@Module({
  imports: [AuditLogsModule, AuthModule, BrandingAssetsModule],
  controllers: [MasterController],
  providers: [MasterService]
})
export class MasterModule {}
