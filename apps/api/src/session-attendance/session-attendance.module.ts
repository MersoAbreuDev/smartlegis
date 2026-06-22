import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { SessionAttendanceController } from './session-attendance.controller';
import { SessionAttendanceService } from './session-attendance.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [SessionAttendanceController],
  providers: [SessionAttendanceService]
})
export class SessionAttendanceModule {}
