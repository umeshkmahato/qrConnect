import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AbuseReportsModule } from './abuse-reports/abuse-reports.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { AuthorizationModule } from './authorization/authorization.module';
import { RolesGuard } from './authorization/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { ContactRequestsModule } from './contact-requests/contact-requests.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrivacyModule } from './privacy/privacy.module';
import { QrModule } from './qr/qr.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    RateLimitModule,
    StorageModule,
    AuthorizationModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    VehiclesModule,
    QrModule,
    PrivacyModule,
    ContactRequestsModule,
    NotificationsModule,
    AbuseReportsModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
