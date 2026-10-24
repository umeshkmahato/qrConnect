import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResolveQrDto {
  @ApiProperty({ description: 'Opaque token encoded in the QR code' })
  @IsString() @IsNotEmpty()
  token!: string;
}
