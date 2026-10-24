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
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const decorators_1 = require("../common/decorators");
const policy_service_1 = require("./policy.service");
let RolesGuard = class RolesGuard {
    reflector;
    policy;
    constructor(reflector, policy) {
        this.reflector = reflector;
        this.policy = policy;
    }
    async canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        const platformAdmin = this.reflector.getAllAndOverride(decorators_1.PLATFORM_ADMIN_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        const roles = this.reflector.getAllAndOverride(decorators_1.ORG_ROLES_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!platformAdmin && (!roles || roles.length === 0))
            return true;
        if (!user) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        if (this.policy.isPlatformAdmin(user))
            return true;
        if (platformAdmin) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Platform admin required' });
        }
        const orgId = req.resolvedOrgId ?? req.params.orgId ?? req.params.id;
        if (!orgId) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Organization context required' });
        }
        const ok = await this.policy.hasOrgRole(user, orgId, roles ?? []);
        if (!ok) {
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient organization role' });
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        policy_service_1.PolicyService])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map