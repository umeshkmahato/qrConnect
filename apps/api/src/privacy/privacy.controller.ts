import { Body, Controller, Get, HttpCode, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { AuthUser } from '../auth/auth.types';
import { ConsentDto, UpdateSharingPreferencesDto } from './dto';
import { PrivacyService } from './privacy.service';

@ApiTags('privacy')
@Controller('api/v1/privacy')
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Get('preferences')
  get(@CurrentUser() user: AuthUser, @Query('vehicleId') vehicleId: string) {
    return this.privacy.getPreferences(user, vehicleId);
  }

  @Patch('preferences')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateSharingPreferencesDto) {
    return this.privacy.updatePreferences(user, dto);
  }

  @Post('consents')
  consent(@CurrentUser() user: AuthUser, @Body() dto: ConsentDto) {
    return this.privacy.recordConsent(user, dto);
  }

  @Get('consents')
  consents(@CurrentUser() user: AuthUser) {
    return this.privacy.myConsents(user);
  }

  @Get('data-export')
  exportData(@CurrentUser() user: AuthUser) {
    return this.privacy.exportMyData(user);
  }

  @Post('account/delete')
  @HttpCode(200)
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.privacy.deleteAccount(user);
  }
}
