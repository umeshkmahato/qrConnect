import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators';
import { AuthUser } from '../auth/auth.types';
import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsOptional() @IsString()
  fullName?: string;
  @IsOptional() @IsString()
  email?: string;
}

class RegisterDeviceDto {
  @IsString() @IsNotEmpty()
  fcmToken!: string;
  @IsString() @IsIn(['android', 'ios', 'web'])
  platform!: string;
}

@ApiTags('users')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.profile(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Post('me/devices')
  registerDevice(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.users.registerDevice(user.id, dto.fcmToken, dto.platform);
  }
}
