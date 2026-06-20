import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PlenarySessionsController } from './plenary-sessions.controller';
import { PlenarySessionsService } from './plenary-sessions.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [PlenarySessionsController],
  providers: [PlenarySessionsService]
})
export class PlenarySessionsModule {}
