import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CouncilMembersService } from './council-members.service';
import { CreateCouncilMemberDto, LinkCouncilMemberUserDto, UpdateCouncilMemberDto } from './dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('council-members')
export class CouncilMembersController {
  constructor(private readonly service: CouncilMembersService) {}

  @Get()
  @Roles(UserRole.ADMIN_CAMARA, UserRole.SECRETARIO, UserRole.PRESIDENTE)
  list(@CurrentUser() user: { tenantId: string }) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN_CAMARA)
  create(@Body() dto: CreateCouncilMemberDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN_CAMARA)
  update(@Param('id') id: string, @Body() dto: UpdateCouncilMemberDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN_CAMARA)
  activate(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.setStatus(id, 'ACTIVE', user);
  }

  @Patch(':id/inactivate')
  @Roles(UserRole.ADMIN_CAMARA)
  inactivate(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.setStatus(id, 'INACTIVE', user);
  }

  @Patch(':id/link-user')
  @Roles(UserRole.ADMIN_CAMARA)
  linkUser(@Param('id') id: string, @Body() dto: LinkCouncilMemberUserDto, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.linkUser(id, dto.userId, user);
  }

  @Patch(':id/unlink-user')
  @Roles(UserRole.ADMIN_CAMARA)
  unlinkUser(@Param('id') id: string, @CurrentUser() user: { sub: string; tenantId: string | null }) {
    return this.service.linkUser(id, null, user);
  }
}
