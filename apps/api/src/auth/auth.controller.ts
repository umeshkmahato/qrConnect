import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser, Public, RequestIp } from '../common/decorators';
import { AuthService } from './auth.service';
import { RefreshDto, RequestOtpDto, VerifyOtpDto } from './dto';
import { AuthUser } from './auth.types';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(200)
  requestOtp(@Body() dto: RequestOtpDto, @RequestIp() ip?: string) {
    return this.auth.requestOtp(dto.phone, ip);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request, @RequestIp() ip?: string) {
    return this.auth.verifyOtp(dto.phone, dto.code, req.headers['user-agent'], ip);
  }

  @Public()
  @Post('session/refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto, @Req() req: Request, @RequestIp() ip?: string) {
    return this.auth.refresh(dto.refreshToken, req.headers['user-agent'], ip);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@CurrentUser() user: AuthUser, @Body() body?: { refreshToken?: string }) {
    return this.auth.logout(user.id, body?.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
