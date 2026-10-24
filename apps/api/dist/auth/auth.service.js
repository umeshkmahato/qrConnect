"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../common/exceptions");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const prisma_service_1 = require("../prisma/prisma.service");
const rate_limiter_service_1 = require("../common/rate-limit/rate-limiter.service");
const audit_service_1 = require("../audit/audit.service");
const crypto_util_1 = require("../common/utils/crypto.util");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    rateLimiter;
    audit;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwt, rateLimiter, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.rateLimiter = rateLimiter;
        this.audit = audit;
    }
    async requestOtp(rawPhone, ip) {
        const phone = (0, crypto_util_1.normalizePhone)(rawPhone);
        const allowed = await this.rateLimiter.allowed(`otp:req:${phone}`, env_1.env.otpRequestLimitPerPhone, 3600);
        const ipAllowed = ip ? await this.rateLimiter.allowed(`otp:req:ip:${ip}`, env_1.env.otpRequestLimitPerIp, 3600) : true;
        if (!allowed || !ipAllowed) {
            throw new exceptions_1.TooManyRequestsException({ code: 'OTP_RATE_LIMITED', message: 'Too many OTP requests' });
        }
        const existing = await this.prisma.otpChallenge.findFirst({
            where: { phone, status: client_1.OtpChallengeStatus.PENDING },
            orderBy: { createdAt: 'desc' },
        });
        if (existing && existing.resendAvailableAt > new Date()) {
            throw new exceptions_1.TooManyRequestsException({
                code: 'OTP_RESEND_COOLDOWN',
                message: 'Please wait before requesting another code',
            });
        }
        const code = (0, crypto_util_1.generateOtpCode)();
        const now = new Date();
        await this.prisma.otpChallenge.updateMany({
            where: { phone, status: client_1.OtpChallengeStatus.PENDING },
            data: { status: client_1.OtpChallengeStatus.EXPIRED },
        });
        await this.prisma.otpChallenge.create({
            data: {
                phone,
                codeHash: (0, crypto_util_1.hmacOtp)(phone, code),
                expiresAt: new Date(now.getTime() + env_1.env.otpTtlSeconds * 1000),
                resendAvailableAt: new Date(now.getTime() + env_1.env.otpResendCooldownSeconds * 1000),
            },
        });
        this.logger.log(`OTP challenge issued for ${phone.slice(0, 5)}***`);
        const response = { sent: true, expiresInSeconds: env_1.env.otpTtlSeconds };
        if (env_1.env.otpDevEcho)
            response.devOtp = code;
        return response;
    }
    invalidOtp() {
        throw new common_1.UnauthorizedException({ code: 'INVALID_OTP', message: 'Invalid or expired code' });
    }
    async verifyOtp(rawPhone, code, userAgent, ip) {
        const phone = (0, crypto_util_1.normalizePhone)(rawPhone);
        const challenge = await this.prisma.otpChallenge.findFirst({
            where: { phone, status: client_1.OtpChallengeStatus.PENDING },
            orderBy: { createdAt: 'desc' },
        });
        if (!challenge || challenge.expiresAt < new Date())
            this.invalidOtp();
        if (challenge.attempts >= env_1.env.otpMaxAttempts) {
            await this.prisma.otpChallenge.update({
                where: { id: challenge.id },
                data: { status: client_1.OtpChallengeStatus.LOCKED },
            });
            this.invalidOtp();
        }
        if (!(0, crypto_util_1.safeEqual)(challenge.codeHash, (0, crypto_util_1.hmacOtp)(phone, code))) {
            await this.prisma.otpChallenge.update({
                where: { id: challenge.id },
                data: { attempts: { increment: 1 } },
            });
            this.invalidOtp();
        }
        await this.prisma.otpChallenge.update({
            where: { id: challenge.id },
            data: { status: client_1.OtpChallengeStatus.VERIFIED, verifiedAt: new Date() },
        });
        let user = await this.prisma.user.findUnique({ where: { phone } });
        if (user && user.status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'Account is not active' });
        }
        user ??= await this.prisma.user.create({ data: { phone } });
        await this.audit.record({ actorId: user.id, action: 'auth.login', resourceType: 'user', resourceId: user.id, ip });
        return this.issueSession(user.id, userAgent, ip);
    }
    async issueSession(userId, userAgent, ip) {
        const refreshToken = (0, crypto_util_1.generateSessionToken)();
        const expiresAt = new Date(Date.now() + env_1.env.refreshTokenTtlSeconds * 1000);
        await this.prisma.userSession.create({
            data: { userId, refreshTokenHash: (0, crypto_util_1.sha256)(refreshToken), userAgent, ip, expiresAt },
        });
        return {
            accessToken: await this.jwt.signAsync({ sub: userId, type: 'access' }, { secret: env_1.env.jwtAccessSecret(), expiresIn: env_1.env.accessTokenTtlSeconds }),
            accessTokenExpiresIn: env_1.env.accessTokenTtlSeconds,
            refreshToken,
            refreshTokenExpiresAt: expiresAt.toISOString(),
        };
    }
    async refresh(refreshToken, userAgent, ip) {
        const session = await this.prisma.userSession.findUnique({
            where: { refreshTokenHash: (0, crypto_util_1.sha256)(refreshToken) },
            include: { user: true },
        });
        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException({ code: 'INVALID_SESSION', message: 'Session is invalid' });
        }
        if (session.user.status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'Account is not active' });
        }
        await this.prisma.userSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date() },
        });
        return this.issueSession(session.userId, userAgent ?? session.userAgent ?? undefined, ip);
    }
    async logout(userId, refreshToken) {
        if (refreshToken) {
            await this.prisma.userSession.updateMany({
                where: { userId, refreshTokenHash: (0, crypto_util_1.sha256)(refreshToken), revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
        else {
            await this.prisma.userSession.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
        await this.audit.record({ actorId: userId, action: 'auth.logout', resourceType: 'user', resourceId: userId });
        return { loggedOut: true };
    }
    async suspendUser(userId, actorId) {
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: userId }, data: { status: client_1.UserStatus.SUSPENDED } }),
            this.prisma.userSession.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);
        await this.audit.record({ actorId, action: 'admin.user.suspend', resourceType: 'user', resourceId: userId });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        rate_limiter_service_1.RateLimiterService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map