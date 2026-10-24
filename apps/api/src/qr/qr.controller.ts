import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { AuthUser } from '../auth/auth.types';
import { ResolveQrDto } from './dto';
import { QrService } from './qr.service';

@ApiTags('qr')
@Controller('api/v1')
export class QrController {
  constructor(private readonly qr: QrService) {}

  @Post('qr/resolve')
  resolve(@CurrentUser() user: AuthUser, @Body() dto: ResolveQrDto) {
    return this.qr.resolve(user, dto.token);
  }

  @Post('vehicles/:id/qr/rotate')
  rotate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.qr.rotate(user, id);
  }

  @Post('vehicles/:id/qr/revoke')
  revoke(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.qr.revoke(user, id);
  }
}
