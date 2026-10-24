import { Module } from '@nestjs/common';
import { AbuseReportsModule } from '../abuse-reports/abuse-reports.module';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, AbuseReportsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
