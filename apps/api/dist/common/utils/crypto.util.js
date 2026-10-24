"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRegNumber = exports.normalizePhone = exports.generateOtpCode = exports.generateInviteCode = exports.generateSessionToken = exports.generateQrToken = exports.safeEqual = exports.hmacOtp = exports.sha256 = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const env_1 = require("../../config/env");
const sha256 = (value) => (0, crypto_1.createHash)('sha256').update(value).digest('hex');
exports.sha256 = sha256;
const hmacOtp = (phone, code) => (0, crypto_1.createHmac)('sha256', env_1.env.otpPepper()).update(`${phone}:${code}`).digest('hex');
exports.hmacOtp = hmacOtp;
const safeEqual = (a, b) => {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && (0, crypto_1.timingSafeEqual)(ba, bb);
};
exports.safeEqual = safeEqual;
const generateQrToken = () => (0, crypto_1.randomBytes)(32).toString('base64url');
exports.generateQrToken = generateQrToken;
const generateSessionToken = () => (0, crypto_1.randomBytes)(48).toString('base64url');
exports.generateSessionToken = generateSessionToken;
const generateInviteCode = () => (0, crypto_1.randomBytes)(6).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 8);
exports.generateInviteCode = generateInviteCode;
const generateOtpCode = () => (0, crypto_1.randomInt)(0, 1_000_000).toString().padStart(6, '0');
exports.generateOtpCode = generateOtpCode;
const normalizePhone = (raw) => {
    const digits = raw.replace(/\D/g, '');
    let normalized;
    if (digits.length === 10)
        normalized = `+91${digits}`;
    else if (digits.length === 12 && digits.startsWith('91'))
        normalized = `+${digits}`;
    else if (raw.startsWith('+') && digits.length >= 11 && digits.length <= 15)
        normalized = `+${digits}`;
    else
        throw new common_1.BadRequestException({ code: 'INVALID_PHONE', message: 'Invalid phone number' });
    return normalized;
};
exports.normalizePhone = normalizePhone;
const normalizeRegNumber = (raw) => {
    const n = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (n.length < 6 || n.length > 13) {
        throw new common_1.BadRequestException({ code: 'INVALID_REG_NUMBER', message: 'Invalid registration number' });
    }
    return n;
};
exports.normalizeRegNumber = normalizeRegNumber;
//# sourceMappingURL=crypto.util.js.map