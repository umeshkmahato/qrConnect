import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString() @IsNotEmpty()
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString() @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString() @Length(6, 6) @Matches(/^\d{6}$/)
  code!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  refreshToken!: string;
}
