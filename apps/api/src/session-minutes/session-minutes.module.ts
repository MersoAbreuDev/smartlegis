import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SessionMinutesController } from './session-minutes.controller';
import { SessionMinutesService } from './session-minutes.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [SessionMinutesController],
  providers: [SessionMinutesService]
})
export class SessionMinutesModule {}
