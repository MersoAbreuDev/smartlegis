import { AttendanceStatus } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AttendanceItemDto {
  @IsString()
  councilMemberId!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  justification?: string;
}

export class UpsertAttendanceBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  items!: AttendanceItemDto[];
}

export class UpdateAttendanceDto {
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional()
  @IsString()
  justification?: string;
}

export class JustifyAttendanceDto {
  @IsString()
  justification!: string;
}
