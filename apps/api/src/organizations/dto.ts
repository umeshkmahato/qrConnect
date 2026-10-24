import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, OrgRole, OrgType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty() @IsString() @IsNotEmpty() @Length(2, 120)
  name!: string;

  @ApiProperty({ enum: OrgType }) @IsEnum(OrgType)
  type!: OrgType;

  @ApiPropertyOptional() @IsOptional() @IsString()
  registrationNumber?: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  addressLine1!: string;
  @ApiPropertyOptional() @IsOptional() @IsString()
  addressLine2?: string;
  @ApiProperty() @IsString() @IsNotEmpty()
  city!: string;
  @ApiProperty() @IsString() @IsNotEmpty()
  state!: string;
  @ApiProperty() @IsString() @Matches(/^\d{6}$/)
  pincode!: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  repName!: string;
  @ApiProperty() @IsString() @IsNotEmpty()
  repPhone!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail()
  repEmail?: string;
}

export class RequestUploadUrlDto {
  @ApiProperty({ enum: DocumentType }) @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiProperty() @IsString() @IsNotEmpty()
  fileName!: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  contentType!: string;

  @ApiProperty() @IsInt() @Min(1) @Max(10 * 1024 * 1024)
  sizeBytes!: number;
}

export class ConfirmDocumentDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  s3Key!: string;
}

export class JoinOrganizationDto {
  @ApiProperty({ description: 'Org invite code or invitation code' })
  @IsString() @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({ enum: OrgRole, default: OrgRole.VEHICLE_OWNER })
  @IsOptional() @IsEnum(OrgRole)
  requestedRole?: OrgRole;
}

export class CreateInvitationDto {
  @ApiProperty({ enum: OrgRole }) @IsEnum(OrgRole)
  role!: OrgRole;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(10000)
  maxUses?: number;

  @ApiPropertyOptional() @IsOptional()
  expiresInDays?: number;
}
