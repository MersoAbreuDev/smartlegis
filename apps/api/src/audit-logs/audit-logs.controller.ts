import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuditLogsService } from './audit-logs.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Get()
  @Roles(UserRole.MASTER, UserRole.ADMIN_CAMARA)
  list(
    @CurrentUser() user: { tenantId: string | null; role: UserRole },
    @Query('actorUserId') actorUserId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string
  ) {
    return this.service.list(user.tenantId, user.role === UserRole.MASTER, { actorUserId, action, entity, startDate, endDate, limit });
  }

  @Get(':id')
  @Roles(UserRole.MASTER, UserRole.ADMIN_CAMARA)
  detail(@Param('id') id: string, @CurrentUser() user: { tenantId: string | null; role: UserRole }) {
    return this.service.detail(id, user.tenantId, user.role === UserRole.MASTER);
  }
}
