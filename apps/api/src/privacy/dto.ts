import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSharingPreferencesDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  vehicleId!: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  shareRegNumber?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  shareOwnerName?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  shareOrgName?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  shareMembershipStatus?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  allowContactRequests?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  allowPublicScan?: boolean;
}

export class ConsentDto {
  @ApiProperty({ enum: ConsentType }) @IsEnum(ConsentType)
  type!: ConsentType;

  @ApiProperty() @IsBoolean()
  granted!: boolean;

  @ApiProperty() @IsString() @IsNotEmpty()
  version!: string;
}
