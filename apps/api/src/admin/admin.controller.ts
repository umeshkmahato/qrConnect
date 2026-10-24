import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AbuseReportStatus, OrgStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CurrentUser, PlatformAdmin } from '../common/decorators';
import { PaginationQuery } from '../common/pagination';
import { AuthUser } from '../auth/auth.types';
import { AdminService } from './admin.service';

class DecideOrgDto {
  @IsOptional() @IsString()
  notes?: string;
}

class DecideAbuseDto {
  @IsEnum(AbuseReportStatus)
  status!: AbuseReportStatus;
  @IsOptional() @IsString()
  notes?: string;
}

/** Platform-admin endpoints. All require PLATFORM_SUPER_ADMIN. */
@ApiTags('admin')
@Controller('api/v1/admin')
@PlatformAdmin()
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('organizations/pending')
  pendingOrgs(@Query() q: PaginationQuery) {
    return this.admin.listOrgs(q, OrgStatus.PENDING_VERIFICATION);
  }

  @Get('organizations')
  orgs(@Query() q: PaginationQuery, @Query('status') status?: OrgStatus) {
    return this.admin.listOrgs(q, status);
  }

  @Post('organizations/:id/approve')
  approveOrg(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.admin.decideOrg(u, id, OrgStatus.APPROVED);
  }

  @Post('organizations/:id/reject')
  rejectOrg(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: DecideOrgDto) {
    return this.admin.decideOrg(u, id, OrgStatus.REJECTED, dto.notes);
  }

  @Post('organizations/:id/request-info')
  requestInfo(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: DecideOrgDto) {
    return this.admin.decideOrg(u, id, OrgStatus.INFO_REQUESTED, dto.notes);
  }

  @Post('organizations/:id/suspend')
  suspendOrg(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: DecideOrgDto) {
    return this.admin.decideOrg(u, id, OrgStatus.SUSPENDED, dto.notes);
  }

  @Post('organizations/:id/reinstate')
  reinstateOrg(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.admin.decideOrg(u, id, OrgStatus.APPROVED);
  }

  @Get('audit-logs')
  auditLogs(@Query() q: PaginationQuery, @Query('orgId') orgId?: string) {
    return this.admin.auditLogs(q, orgId);
  }

  @Get('abuse-reports')
  abuseReports(@Query() q: PaginationQuery, @Query('status') status?: AbuseReportStatus) {
    return this.admin.listAbuseReports(q, status);
  }

  @Post('abuse-reports/:id/decide')
  decideAbuse(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: DecideAbuseDto) {
    return this.admin.decideAbuse(u, id, dto);
  }

  @Post('users/:id/suspend')
  suspendUser(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.admin.suspendUser(u, id);
  }

  @Post('users/:id/reinstate')
  reinstateUser(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.admin.reinstateUser(u, id);
  }
}
