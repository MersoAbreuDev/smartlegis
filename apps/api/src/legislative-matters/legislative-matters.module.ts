import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { LegislativeMattersController } from './legislative-matters.controller';
import { LegislativeMattersService } from './legislative-matters.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [LegislativeMattersController],
  providers: [LegislativeMattersService]
})
export class LegislativeMattersModule {}
