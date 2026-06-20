import { LegislativeMatterStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateLegislativeMatterDto {
  @IsString()
  type!: string;
  @IsInt()
  @Min(1)
  number!: number;
  @IsInt()
  @Min(2000)
  year!: number;
  @IsString()
  title!: string;
  @IsString()
  summary!: string;
  @IsString()
  authorId!: string;
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

export class UpdateMatterStatusDto {
  @IsEnum(LegislativeMatterStatus)
  status!: LegislativeMatterStatus;
}
