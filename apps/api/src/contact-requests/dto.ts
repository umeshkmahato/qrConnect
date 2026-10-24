import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactCategory } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateContactRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  vehicleId!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  qrToken?: string;

  @ApiProperty({ enum: ContactCategory }) @IsEnum(ContactCategory)
  category!: ContactCategory;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 500)
  message?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(8, 80)
  idempotencyKey?: string;
}

export class RespondContactRequestDto {
  @ApiProperty({ enum: ['ACCEPTED', 'DECLINED', 'RESPONDED', 'CLOSED', 'REPORTED'] })
  @IsEnum(['ACCEPTED', 'DECLINED', 'RESPONDED', 'CLOSED', 'REPORTED'] as const)
  action!: 'ACCEPTED' | 'DECLINED' | 'RESPONDED' | 'CLOSED' | 'REPORTED';

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 500)
  responseMessage?: string;
}
