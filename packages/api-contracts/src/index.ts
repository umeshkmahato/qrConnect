/**
 * Shared API contract types for NathConnect clients.
 * Keep in sync with apps/api DTOs; the OpenAPI spec at /api/docs is authoritative.
 */

export type OrgRole =
  | 'ORGANIZATION_OWNER' | 'ORGANIZATION_ADMIN' | 'SECURITY_GUARD'
  | 'VEHICLE_OWNER' | 'REGISTERED_USER';
export type PlatformRole = 'PLATFORM_SUPER_ADMIN';
export type OrgStatus =
  | 'PENDING_VERIFICATION' | 'INFO_REQUESTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type MembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED' | 'SUSPENDED';
export type VehicleStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'DEACTIVATED';
export type ContactRequestStatus =
  | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'RESPONDED' | 'CLOSED' | 'REPORTED';
export type ContactCategory = 'PARKING' | 'BLOCKED_VEHICLE' | 'SECURITY' | 'DELIVERY' | 'OTHER';
export type ScanOutcome =
  | 'VERIFIED' | 'INVALID' | 'REVOKED' | 'INACTIVE' | 'ERROR';

export interface ErrorEnvelope {
  statusCode: number;
  code: string;
  message: string;
  requestId?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthSession {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface QrResolveResponse {
  outcome: ScanOutcome;
  message?: string;
  scannerLevel?: 'STAFF' | 'PUBLIC';
  contactRequestsEnabled?: boolean;
  vehicle?: {
    id: string;
    verificationStatus: VehicleStatus;
    vehicleType: string;
    registrationNumber?: string;
    ownerName?: string;
    organizationName?: string;
    make?: string;
    model?: string;
    color?: string;
  };
}

export interface VehicleSharingPreference {
  shareRegNumber: boolean;
  shareOwnerName: boolean;
  shareOrgName: boolean;
  shareMembershipStatus: boolean;
  allowContactRequests: boolean;
  allowPublicScan: boolean;
}
