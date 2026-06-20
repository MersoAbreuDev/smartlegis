import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PortalContentController } from './portal-content.controller';
import { PortalContentService } from './portal-content.service';

@Module({
  imports: [AuditLogsModule, PrismaModule],
  controllers: [PortalContentController],
  providers: [PortalContentService]
})
export class PortalContentModule {}
