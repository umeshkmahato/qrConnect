import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from '../../config/env';

/**
 * Redis fixed-window rate limiter.
 * Returns the number of hits in the current window; caller decides the policy.
 * IP address is never the sole key — callers compose keys from
 * account / vehicle / token / network signals.
 */
@Injectable()
export class RateLimiterService implements OnModuleDestroy {
  private readonly redis = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 });

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * @returns hit count after incrementing, or -1 if Redis is unavailable (fail-open
   *          for non-security-critical limits; callers may choose fail-closed).
   */
  async hit(key: string, windowSeconds: number): Promise<number> {
    try {
      const k = `rl:${key}`;
      const count = await this.redis.incr(k);
      if (count === 1) await this.redis.expire(k, windowSeconds);
      return count;
    } catch {
      return -1;
    }
  }

  async allowed(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const count = await this.hit(key, windowSeconds);
    if (count === -1) return true;
    return count <= limit;
  }

  get client(): Redis {
    return this.redis;
  }
}
