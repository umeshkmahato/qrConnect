"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIp = exports.CurrentUser = exports.PlatformAdmin = exports.PLATFORM_ADMIN_KEY = exports.Roles = exports.ORG_ROLES_KEY = exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
exports.ORG_ROLES_KEY = 'orgRoles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ORG_ROLES_KEY, roles);
exports.Roles = Roles;
exports.PLATFORM_ADMIN_KEY = 'platformAdmin';
const PlatformAdmin = () => (0, common_1.SetMetadata)(exports.PLATFORM_ADMIN_KEY, true);
exports.PlatformAdmin = PlatformAdmin;
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
});
exports.RequestIp = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.ip;
});
//# sourceMappingURL=decorators.js.map