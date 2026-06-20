import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SessionAgendaController } from './session-agenda.controller';
import { SessionAgendaService } from './session-agenda.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [SessionAgendaController],
  providers: [SessionAgendaService]
})
export class SessionAgendaModule {}
