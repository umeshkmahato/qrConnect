import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { TooManyRequestsException } from '../common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { OtpChallengeStatus, UserStatus } from '@prisma/client';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimiterService } from '../common/rate-limit/rate-limiter.service';
import { AuditService } from '../audit/audit.service';
import {
  generateOtpCode,
  generateSessionToken,
  hmacOtp,
  normalizePhone,
  safeEqual,
  sha256,
} from '../common/utils/crypto.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly rateLimiter: RateLimiterService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Creates an OTP challenge. The OTP value itself is never stored or logged —
   * only its HMAC. Delivery goes through the SMS provider interface; in
   * development the code may be echoed in the response (OTP_DEV_ECHO, never in prod).
   */
  async requestOtp(rawPhone: string, ip?: string) {
    const phone = normalizePhone(rawPhone);

    const allowed = await this.rateLimiter.allowed(`otp:req:${phone}`, env.otpRequestLimitPerPhone, 3600);
    const ipAllowed = ip ? await this.rateLimiter.allowed(`otp:req:ip:${ip}`, env.otpRequestLimitPerIp, 3600) : true;
    if (!allowed || !ipAllowed) {
      throw new TooManyRequestsException({ code: 'OTP_RATE_LIMITED', message: 'Too many OTP requests' });
    }

    const existing = await this.prisma.otpChallenge.findFirst({
      where: { phone, status: OtpChallengeStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
    if (existing && existing.resendAvailableAt > new Date()) {
      throw new TooManyRequestsException({
        code: 'OTP_RESEND_COOLDOWN',
        message: 'Please wait before requesting another code',
      });
    }

    const code = generateOtpCode();
    const now = new Date();
    await this.prisma.otpChallenge.updateMany({
      where: { phone, status: OtpChallengeStatus.PENDING },
      data: { status: OtpChallengeStatus.EXPIRED },
    });
    await this.prisma.otpChallenge.create({
      data: {
        phone,
        codeHash: hmacOtp(phone, code),
        expiresAt: new Date(now.getTime() + env.otpTtlSeconds * 1000),
        resendAvailableAt: new Date(now.getTime() + env.otpResendCooldownSeconds * 1000),
      },
    });

    // Delivery boundary: in production this hands off to the SMS provider
    // (see notifications module). The code is never logged.
    this.logger.log(`OTP challenge issued for ${phone.slice(0, 5)}***`);

    const response: Record<string, unknown> = { sent: true, expiresInSeconds: env.otpTtlSeconds };
    if (env.otpDevEcho) response.devOtp = code;
    return response;
  }

  /** Uniform error on every failure path to resist enumeration. */
  private invalidOtp(): never {
    throw new UnauthorizedException({ code: 'INVALID_OTP', message: 'Invalid or expired code' });
  }

  async verifyOtp(rawPhone: string, code: string, userAgent?: string, ip?: string) {
    const phone = normalizePhone(rawPhone);

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone, status: OtpChallengeStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
    if (!challenge || challenge.expiresAt < new Date()) this.invalidOtp();

    if (challenge.attempts >= env.otpMaxAttempts) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { status: OtpChallengeStatus.LOCKED },
      });
      this.invalidOtp();
    }

    if (!safeEqual(challenge.codeHash, hmacOtp(phone, code))) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      this.invalidOtp();
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { status: OtpChallengeStatus.VERIFIED, verifiedAt: new Date() },
    });

    // Upsert user; suspended/deleted accounts cannot log in.
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (user && user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'Account is not active' });
    }
    user ??= await this.prisma.user.create({ data: { phone } });

    await this.audit.record({ actorId: user.id, action: 'auth.login', resourceType: 'user', resourceId: user.id, ip });
    return this.issueSession(user.id, userAgent, ip);
  }

  private async issueSession(userId: string, userAgent?: string, ip?: string) {
    const refreshToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + env.refreshTokenTtlSeconds * 1000);
    await this.prisma.userSession.create({
      data: { userId, refreshTokenHash: sha256(refreshToken), userAgent, ip, expiresAt },
    });
    return {
      accessToken: await this.jwt.signAsync(
        { sub: userId, type: 'access' },
        { secret: env.jwtAccessSecret(), expiresIn: env.accessTokenTtlSeconds },
      ),
      accessTokenExpiresIn: env.accessTokenTtlSeconds,
      refreshToken,
      refreshTokenExpiresAt: expiresAt.toISOString(),
    };
  }

  /** Refresh-token rotation: the presented token is revoked and a new pair issued. */
  async refresh(refreshToken: string, userAgent?: string, ip?: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: sha256(refreshToken) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'INVALID_SESSION', message: 'Session is invalid' });
    }
    if (session.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'Account is not active' });
    }
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(session.userId, userAgent ?? session.userAgent ?? undefined, ip);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.userSession.updateMany({
        where: { userId, refreshTokenHash: sha256(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit.record({ actorId: userId, action: 'auth.logout', resourceType: 'user', resourceId: userId });
    return { loggedOut: true };
  }

  /** Suspends a user and revokes all sessions (admin use). */
  async suspendUser(userId: string, actorId: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPENDED } }),
      this.prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit.record({ actorId, action: 'admin.user.suspend', resourceType: 'user', resourceId: userId });
  }
}
