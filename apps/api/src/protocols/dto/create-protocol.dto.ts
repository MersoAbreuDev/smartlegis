import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateProtocolDto {
  @IsString()
  documentType!: string;

  @IsString()
  subject!: string;

  @IsString()
  description!: string;

  @IsString()
  authorName!: string;

  @IsOptional()
  @IsString()
  authorDocument?: string;

  @IsOptional()
  @IsEmail()
  authorEmail?: string;

  @IsOptional()
  @IsString()
  authorPhone?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;
}
