import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [VotesController],
  providers: [VotesService]
})
export class VotesModule {}
