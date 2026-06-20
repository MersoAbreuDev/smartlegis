import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CouncilMembersController } from './council-members.controller';
import { CouncilMembersService } from './council-members.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [CouncilMembersController],
  providers: [CouncilMembersService]
})
export class CouncilMembersModule {}
