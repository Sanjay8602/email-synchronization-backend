import { IsString, IsEmail, IsNumber, IsBoolean, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { AuthMethod } from '../../../database/schemas/email-account.schema';

export class CreateEmailAccountDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  imapHost: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  imapPort: number;

  @IsBoolean()
  @IsOptional()
  useSSL?: boolean = true;

  @IsEnum(AuthMethod)
  authMethod: AuthMethod;

  @IsString()
  username: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  oauth2Token?: string;
}

export class UpdateEmailAccountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  imapHost?: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  imapPort?: number;

  @IsBoolean()
  @IsOptional()
  useSSL?: boolean;

  @IsEnum(AuthMethod)
  @IsOptional()
  authMethod?: AuthMethod;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  oauth2Token?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
