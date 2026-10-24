import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContactRequestsController } from './contact-requests.controller';
import { ContactRequestsService } from './contact-requests.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ContactRequestsController],
  providers: [ContactRequestsService],
})
export class ContactRequestsModule {}
