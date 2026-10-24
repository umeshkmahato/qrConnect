import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrgRole } from '@prisma/client';
import { ORG_MANAGE_ROLES } from '../authorization/policy.service';
import { CurrentUser, Roles } from '../common/decorators';
import { PaginationQuery } from '../common/pagination';
import { AuthUser } from '../auth/auth.types';
import {
  ConfirmDocumentDto,
  CreateInvitationDto,
  CreateOrganizationDto,
  JoinOrganizationDto,
  RequestUploadUrlDto,
} from './dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('api/v1/organizations')
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.orgs.create(user, dto);
  }

  @Get('me')
  mine(@CurrentUser() user: AuthUser) {
    return this.orgs.myOrganizations(user);
  }

  @Post('join')
  join(@CurrentUser() user: AuthUser, @Body() dto: JoinOrganizationDto) {
    return this.orgs.join(user, dto);
  }

  @Get(':orgId')
  @Roles(...Object.values(OrgRole))
  get(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string) {
    return this.orgs.getById(user, orgId);
  }

  @Get(':orgId/memberships')
  @Roles(...ORG_MANAGE_ROLES)
  members(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Query() q: PaginationQuery) {
    return this.orgs.listMembers(user, orgId, q);
  }

  @Post(':orgId/memberships')
  @Roles(...Object.values(OrgRole))
  requestMembership(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string) {
    return { orgId, message: 'Use /api/v1/organizations/join with an invite code' };
  }

  @Post(':orgId/memberships/:membershipId/approve')
  @Roles(...ORG_MANAGE_ROLES)
  approve(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Param('membershipId') id: string) {
    return this.orgs.decideMembership(user, orgId, id, 'APPROVED');
  }

  @Post(':orgId/memberships/:membershipId/reject')
  @Roles(...ORG_MANAGE_ROLES)
  reject(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Param('membershipId') id: string) {
    return this.orgs.decideMembership(user, orgId, id, 'REJECTED');
  }

  @Post(':orgId/memberships/:membershipId/remove')
  @Roles(...ORG_MANAGE_ROLES)
  remove(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Param('membershipId') id: string) {
    return this.orgs.decideMembership(user, orgId, id, 'REMOVED');
  }

  @Post(':orgId/invitations')
  @Roles(...ORG_MANAGE_ROLES)
  invite(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Body() dto: CreateInvitationDto) {
    return this.orgs.createInvitation(user, orgId, dto);
  }

  @Post(':orgId/documents/upload-url')
  @Roles(...ORG_MANAGE_ROLES)
  uploadUrl(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Body() dto: RequestUploadUrlDto) {
    return this.orgs.requestUploadUrl(user, orgId, dto);
  }

  @Post(':orgId/documents/confirm')
  @Roles(...ORG_MANAGE_ROLES)
  confirmDoc(@CurrentUser() user: AuthUser, @Param('orgId') orgId: string, @Body() dto: ConfirmDocumentDto) {
    return this.orgs.confirmDocument(user, orgId, dto);
  }

  @Get('documents/:documentId/download-url')
  downloadUrl(@CurrentUser() user: AuthUser, @Param('documentId') id: string) {
    return this.orgs.documentDownloadUrl(user, id);
  }
}
