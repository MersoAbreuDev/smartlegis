import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ProtocolStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateProtocolDto } from './dto/create-protocol.dto';
import { LinkProtocolMatterDto } from './dto/link-protocol-matter.dto';
import { UpdateProtocolStatusDto } from './dto/update-protocol-status.dto';
import { ProtocolsService } from './protocols.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('protocols')
export class ProtocolsController {
  constructor(private readonly service: ProtocolsService) {}

  @Get()
  @Roles(UserRole.SECRETARIO)
  list(
    @CurrentUser() user: { tenantId: string | null },
    @Query('status') status?: ProtocolStatus,
    @Query('year') year?: string,
    @Query('documentType') documentType?: string,
    @Query('search') search?: string
  ) {
    return this.service.list(user, { status, year, documentType, search });
  }

  @Get(':id')
  @Roles(UserRole.SECRETARIO)
  detail(@Param('id') id: string, @CurrentUser() user: { tenantId: string | null }) {
    return this.service.detail(id, user);
  }

  @Post()
  @Roles(UserRole.SECRETARIO)
  create(@Body() dto: CreateProtocolDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.create(dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.SECRETARIO)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateProtocolStatusDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.updateStatus(id, dto.status, user);
  }

  @Patch(':id/link-matter')
  @Roles(UserRole.SECRETARIO)
  linkMatter(@Param('id') id: string, @Body() dto: LinkProtocolMatterDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.linkMatter(id, dto.matterId, user);
  }

  @Get(':id/receipt')
  @Roles(UserRole.SECRETARIO)
  receipt(@Param('id') id: string, @CurrentUser() user: { tenantId: string | null }) {
    return this.service.receipt(id, user);
  }
}
