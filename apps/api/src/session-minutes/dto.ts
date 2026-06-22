import { IsOptional, IsString } from 'class-validator';

export class GenerateMinuteDto {
  @IsOptional()
  @IsString()
  observations?: string;
}

export class UpdateMinuteDto {
  @IsString()
  content!: string;
}
