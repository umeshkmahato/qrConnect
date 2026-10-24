/**
 * Central typed access to environment configuration.
 * Secrets are read here only; never logged.
 */
const required = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
};

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

const int = (key: string, fallback: number): number => {
  const v = process.env[key];
  return v ? parseInt(v, 10) : fallback;
};

const bool = (key: string, fallback: boolean): boolean => {
  const v = process.env[key];
  return v ? v === 'true' || v === '1' : fallback;
};

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  get isProduction() {
    return this.nodeEnv === 'production';
  },
  port: int('API_PORT', 3000),

  databaseUrl: () => required('DATABASE_URL'),
  redisUrl: optional('REDIS_URL', 'redis://localhost:6379'),

  jwtAccessSecret: () => required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: () => required('JWT_REFRESH_SECRET'),
  accessTokenTtlSeconds: int('ACCESS_TOKEN_TTL_SECONDS', 900),
  refreshTokenTtlSeconds: int('REFRESH_TOKEN_TTL_SECONDS', 30 * 24 * 3600),

  otpPepper: () => required('OTP_PEPPER'),
  otpTtlSeconds: int('OTP_TTL_SECONDS', 300),
  otpMaxAttempts: int('OTP_MAX_ATTEMPTS', 5),
  otpResendCooldownSeconds: int('OTP_RESEND_COOLDOWN_SECONDS', 60),
  otpRequestLimitPerPhone: int('OTP_REQUEST_LIMIT_PER_PHONE', 5),
  otpRequestLimitPerIp: int('OTP_REQUEST_LIMIT_PER_IP', 20),
  /** Dev-only: returns the OTP in the request response. Forced off in production. */
  get otpDevEcho() {
    return !this.isProduction && bool('OTP_DEV_ECHO', false);
  },

  s3: {
    endpoint: optional('S3_ENDPOINT', ''),
    region: optional('S3_REGION', 'ap-south-1'),
    bucket: optional('S3_BUCKET', 'nathconnect-documents'),
    accessKey: optional('S3_ACCESS_KEY', ''),
    secretKey: optional('S3_SECRET_KEY', ''),
    forcePathStyle: bool('S3_FORCE_PATH_STYLE', false),
  },
  documentUploadMaxBytes: int('DOCUMENT_UPLOAD_MAX_BYTES', 5 * 1024 * 1024),

  webBaseUrl: optional('WEB_BASE_URL', 'http://localhost:3001'),
  corsOrigins: optional('CORS_ORIGINS', 'http://localhost:3001').split(','),
};
