import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ORG_MANAGE_ROLES } from '../authorization/policy.service';
import { CurrentUser, Roles } from '../common/decorators';
import { PaginationQuery } from '../common/pagination';
import { AuthUser } from '../auth/auth.types';
import { AddVehicleMemberDto, CreateVehicleDto, UpdateVehicleDto } from './dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller('api/v1/vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(user, dto);
  }

  /** Vehicles associated with the caller (owner or authorized user). */
  @Get()
  mine(@CurrentUser() user: AuthUser, @Query() q: PaginationQuery) {
    return this.vehicles.listMine(user, q);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vehicles.get(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicles.update(user, id, dto);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vehicles.setStatus(user, id, 'ACTIVE');
  }

  @Post(':id/reject')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vehicles.setStatus(user, id, 'REJECTED');
  }

  @Post(':id/deactivate')
  deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vehicles.setStatus(user, id, 'DEACTIVATED');
  }

  @Post(':id/members')
  addMember(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: AddVehicleMemberDto) {
    return this.vehicles.addMember(user, id, dto);
  }

  @Post(':id/members/:membershipId/accept')
  acceptMember(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('membershipId') mid: string) {
    return this.vehicles.decideVehicleMember(user, id, mid, true);
  }

  @Post(':id/members/:membershipId/remove')
  removeMember(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('membershipId') mid: string) {
    return this.vehicles.decideVehicleMember(user, id, mid, false);
  }
}

@ApiTags('vehicles')
@Controller('api/v1/organizations/:orgId/vehicles')
export class OrgVehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get()
  @Roles(...ORG_MANAGE_ROLES, 'SECURITY_GUARD')
  list(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Query() q: PaginationQuery) {
    return this.vehicles.listForOrg(user, orgId, q);
  }
}
