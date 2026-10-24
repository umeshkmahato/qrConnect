import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleAssociationType } from '@prisma/client';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  orgId!: string;

  @ApiProperty({ example: 'MH12AB1234' }) @IsString() @IsNotEmpty()
  registrationNumber!: string;

  @ApiProperty({ example: 'CAR' }) @IsString() @IsIn(['CAR', 'BIKE', 'SCOOTER', 'OTHER'])
  vehicleType!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  make?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()
  model?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Client-supplied idempotency key; retries are safe' })
  @IsOptional() @IsString() @Length(8, 80)
  idempotencyKey?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  make?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()
  model?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()
  color?: string;
}

export class AddVehicleMemberDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  phone!: string;

  @ApiProperty({ enum: VehicleAssociationType }) @IsEnum(VehicleAssociationType)
  associationType!: VehicleAssociationType;
}
