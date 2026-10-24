"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const abuse_reports_module_1 = require("./abuse-reports/abuse-reports.module");
const admin_module_1 = require("./admin/admin.module");
const audit_module_1 = require("./audit/audit.module");
const auth_module_1 = require("./auth/auth.module");
const auth_guard_1 = require("./auth/auth.guard");
const authorization_module_1 = require("./authorization/authorization.module");
const roles_guard_1 = require("./authorization/roles.guard");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const rate_limit_module_1 = require("./common/rate-limit/rate-limit.module");
const contact_requests_module_1 = require("./contact-requests/contact-requests.module");
const health_module_1 = require("./health/health.module");
const notifications_module_1 = require("./notifications/notifications.module");
const organizations_module_1 = require("./organizations/organizations.module");
const prisma_module_1 = require("./prisma/prisma.module");
const privacy_module_1 = require("./privacy/privacy.module");
const qr_module_1 = require("./qr/qr.module");
const storage_module_1 = require("./storage/storage.module");
const users_module_1 = require("./users/users.module");
const vehicles_module_1 = require("./vehicles/vehicles.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            audit_module_1.AuditModule,
            rate_limit_module_1.RateLimitModule,
            storage_module_1.StorageModule,
            authorization_module_1.AuthorizationModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            organizations_module_1.OrganizationsModule,
            vehicles_module_1.VehiclesModule,
            qr_module_1.QrModule,
            privacy_module_1.PrivacyModule,
            contact_requests_module_1.ContactRequestsModule,
            notifications_module_1.NotificationsModule,
            abuse_reports_module_1.AbuseReportsModule,
            admin_module_1.AdminModule,
            health_module_1.HealthModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: auth_guard_1.AuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.HttpExceptionFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: logging_interceptor_1.LoggingInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map