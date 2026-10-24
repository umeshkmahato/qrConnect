-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'SECURITY_GUARD', 'VEHICLE_OWNER', 'REGISTERED_USER');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('RESIDENTIAL_SOCIETY', 'OFFICE_COMPANY', 'EDUCATIONAL_INSTITUTION', 'OTHER');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('PENDING_VERIFICATION', 'INFO_REQUESTED', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('REGISTRATION_CERTIFICATE', 'ADDRESS_PROOF', 'REPRESENTATIVE_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "VehicleAssociationType" AS ENUM ('OWNER', 'AUTHORIZED_USER');

-- CreateEnum
CREATE TYPE "VehicleAssociationStatus" AS ENUM ('PENDING', 'APPROVED', 'REMOVED');

-- CreateEnum
CREATE TYPE "QrTokenStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'RESPONDED', 'CLOSED', 'REPORTED');

-- CreateEnum
CREATE TYPE "ContactCategory" AS ENUM ('PARKING', 'BLOCKED_VEHICLE', 'SECURITY', 'DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'EMAIL', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "AbuseReportStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_NOTICE', 'CONTACT_SHARING');

-- CreateEnum
CREATE TYPE "OtpChallengeStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ScanOutcome" AS ENUM ('SUCCESS', 'DENIED_UNAUTHENTICATED', 'DENIED_UNAUTHORIZED', 'TOKEN_INVALID', 'TOKEN_REVOKED', 'VEHICLE_INACTIVE', 'RATE_LIMITED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "platformRole" "PlatformRole",
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'LOGIN',
    "status" "OtpChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resendAvailableAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "status" "OrgStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "registrationNumber" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "repName" TEXT NOT NULL,
    "repPhone" TEXT NOT NULL,
    "repEmail" TEXT,
    "inviteCode" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_documents" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "s3Key" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 50,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "color" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_memberships" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "associationType" "VehicleAssociationType" NOT NULL,
    "status" "VehicleAssociationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_qr_tokens" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "QrTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revokedReason" TEXT,

    CONSTRAINT "vehicle_qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_sharing_preferences" (
    "vehicleId" TEXT NOT NULL,
    "shareRegNumber" BOOLEAN NOT NULL DEFAULT true,
    "shareOwnerName" BOOLEAN NOT NULL DEFAULT false,
    "shareOrgName" BOOLEAN NOT NULL DEFAULT true,
    "shareMembershipStatus" BOOLEAN NOT NULL DEFAULT true,
    "allowContactRequests" BOOLEAN NOT NULL DEFAULT true,
    "allowPublicScan" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "vehicle_sharing_preferences_pkey" PRIMARY KEY ("vehicleId")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "qrTokenId" TEXT,
    "requesterId" TEXT NOT NULL,
    "category" "ContactCategory" NOT NULL,
    "message" TEXT,
    "status" "ContactRequestStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "respondedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "responseMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_events" (
    "id" TEXT NOT NULL,
    "qrTokenId" TEXT,
    "vehicleId" TEXT,
    "orgId" TEXT,
    "scannerUserId" TEXT,
    "outcome" "ScanOutcome" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abuse_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "contactRequestId" TEXT,
    "vehicleId" TEXT,
    "orgId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "AbuseReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,

    CONSTRAINT "abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "orgId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refreshTokenHash_key" ON "user_sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_fcmToken_key" ON "user_devices"("fcmToken");

-- CreateIndex
CREATE INDEX "user_devices_userId_idx" ON "user_devices"("userId");

-- CreateIndex
CREATE INDEX "otp_challenges_phone_status_idx" ON "otp_challenges"("phone", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_inviteCode_key" ON "organizations"("inviteCode");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "organization_memberships_userId_status_idx" ON "organization_memberships"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_orgId_userId_key" ON "organization_memberships"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_documents_s3Key_key" ON "organization_documents"("s3Key");

-- CreateIndex
CREATE INDEX "organization_documents_orgId_idx" ON "organization_documents"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitations_code_key" ON "organization_invitations"("code");

-- CreateIndex
CREATE INDEX "organization_invitations_orgId_idx" ON "organization_invitations"("orgId");

-- CreateIndex
CREATE INDEX "vehicles_orgId_registrationNumber_idx" ON "vehicles"("orgId", "registrationNumber");

-- CreateIndex
CREATE INDEX "vehicle_memberships_userId_idx" ON "vehicle_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_memberships_vehicleId_userId_key" ON "vehicle_memberships"("vehicleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_qr_tokens_tokenHash_key" ON "vehicle_qr_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "vehicle_qr_tokens_vehicleId_status_idx" ON "vehicle_qr_tokens"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "consent_records_userId_type_idx" ON "consent_records"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "contact_requests_idempotencyKey_key" ON "contact_requests"("idempotencyKey");

-- CreateIndex
CREATE INDEX "contact_requests_vehicleId_status_idx" ON "contact_requests"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "contact_requests_requesterId_status_idx" ON "contact_requests"("requesterId", "status");

-- CreateIndex
CREATE INDEX "contact_requests_orgId_status_idx" ON "contact_requests"("orgId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "scan_events_qrTokenId_createdAt_idx" ON "scan_events"("qrTokenId", "createdAt");

-- CreateIndex
CREATE INDEX "scan_events_vehicleId_createdAt_idx" ON "scan_events"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "abuse_reports_status_idx" ON "abuse_reports"("status");

-- CreateIndex
CREATE INDEX "abuse_reports_orgId_idx" ON "abuse_reports"("orgId");

-- CreateIndex
CREATE INDEX "audit_logs_orgId_createdAt_idx" ON "audit_logs"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_documents" ADD CONSTRAINT "organization_documents_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_memberships" ADD CONSTRAINT "vehicle_memberships_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_memberships" ADD CONSTRAINT "vehicle_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_qr_tokens" ADD CONSTRAINT "vehicle_qr_tokens_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_sharing_preferences" ADD CONSTRAINT "vehicle_sharing_preferences_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
