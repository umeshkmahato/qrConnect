import { Module } from '@nestjs/common';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

@Module({ controllers: [PrivacyController], providers: [PrivacyService] })
export class PrivacyModule {}
