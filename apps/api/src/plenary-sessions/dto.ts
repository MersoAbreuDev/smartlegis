import { IsDateString, IsInt, IsString, Min } from 'class-validator';

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
