import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ProtocolsController } from './protocols.controller';
import { ProtocolsService } from './protocols.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [ProtocolsController],
  providers: [ProtocolsService]
})
export class ProtocolsModule {}
