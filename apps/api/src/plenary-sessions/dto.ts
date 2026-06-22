import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlenarySessionDto {
  @IsString()
  type!: string;
  @IsInt()
  @Min(1)
  number!: number;
  @IsDateString()
  date!: string;
  @IsString()
  presidentId!: string;
  @IsString()
  secretaryId!: string;
}

export class UpdatePlenarySessionDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  number?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  presidentId?: string;

  @IsOptional()
  @IsString()
  secretaryId?: string;
}
