"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../../config/env");
let RateLimiterService = class RateLimiterService {
    redis = new ioredis_1.default(env_1.env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 });
    async onModuleDestroy() {
        await this.redis.quit();
    }
    async hit(key, windowSeconds) {
        try {
            const k = `rl:${key}`;
            const count = await this.redis.incr(k);
            if (count === 1)
                await this.redis.expire(k, windowSeconds);
            return count;
        }
        catch {
            return -1;
        }
    }
    async allowed(key, limit, windowSeconds) {
        const count = await this.hit(key, windowSeconds);
        if (count === -1)
            return true;
        return count <= limit;
    }
    get client() {
        return this.redis;
    }
};
exports.RateLimiterService = RateLimiterService;
exports.RateLimiterService = RateLimiterService = __decorate([
    (0, common_1.Injectable)()
], RateLimiterService);
//# sourceMappingURL=rate-limiter.service.js.map