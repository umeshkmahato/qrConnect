import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { env } from '../../config/env';

/** sha256 hex — used for QR tokens and refresh tokens (peppered via caller where needed). */
export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

/** HMAC-SHA256 with the server-side OTP pepper. */
export const hmacOtp = (phone: string, code: string): string =>
  createHmac('sha256', env.otpPepper()).update(`${phone}:${code}`).digest('hex');

export const safeEqual = (a: string, b: string): boolean => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

/** 32-byte url-safe opaque token — the only value ever encoded into a QR code. */
export const generateQrToken = (): string => randomBytes(32).toString('base64url');

export const generateSessionToken = (): string => randomBytes(48).toString('base64url');

export const generateInviteCode = (): string =>
  randomBytes(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 8);

/** 6-digit numeric OTP from a CSPRNG. */
export const generateOtpCode = (): string => randomInt(0, 1_000_000).toString().padStart(6, '0');

/** Normalize an Indian phone number to E.164 (+91XXXXXXXXXX). */
export const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  let normalized: string;
  if (digits.length === 10) normalized = `+91${digits}`;
  else if (digits.length === 12 && digits.startsWith('91')) normalized = `+${digits}`;
  else if (raw.startsWith('+') && digits.length >= 11 && digits.length <= 15) normalized = `+${digits}`;
  else throw new BadRequestException({ code: 'INVALID_PHONE', message: 'Invalid phone number' });
  return normalized;
};

/** Normalize vehicle registration: uppercase, strip non-alphanumerics. */
export const normalizeRegNumber = (raw: string): string => {
  const n = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (n.length < 6 || n.length > 13) {
    throw new BadRequestException({ code: 'INVALID_REG_NUMBER', message: 'Invalid registration number' });
  }
  return n;
};
