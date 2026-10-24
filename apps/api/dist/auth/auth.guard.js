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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const decorators_1 = require("../common/decorators");
const prisma_service_1 = require("../prisma/prisma.service");
const env_1 = require("../config/env");
let AuthGuard = class AuthGuard {
    jwt;
    prisma;
    reflector;
    constructor(jwt, prisma, reflector) {
        this.jwt = jwt;
        this.prisma = prisma;
        this.reflector = reflector;
    }
    async canActivate(ctx) {
        const isPublic = this.reflector.getAllAndOverride(decorators_1.IS_PUBLIC_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        const req = ctx.switchToHttp().getRequest();
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            if (isPublic)
                return true;
            throw new common_1.UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Missing access token' });
        }
        try {
            const payload = await this.jwt.verifyAsync(header.slice(7), {
                secret: env_1.env.jwtAccessSecret(),
            });
            if (payload.type !== 'access')
                throw new Error('bad token type');
            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user || user.status !== client_1.UserStatus.ACTIVE) {
                throw new common_1.UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'Account is not active' });
            }
            const authUser = {
                id: user.id,
                phone: user.phone,
                status: user.status,
                platformRole: user.platformRole,
            };
            req.user = authUser;
            return true;
        }
        catch (e) {
            if (e instanceof common_1.UnauthorizedException)
                throw e;
            if (isPublic)
                return true;
            throw new common_1.UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Invalid or expired token' });
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        core_1.Reflector])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map