import { AgendaItemStatus } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddAgendaItemDto {
  @IsString()
  sessionId!: string;
  @IsString()
  matterId!: string;
  @IsInt()
  @Min(1)
  order!: number;
}

export class UpdateAgendaItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsEnum(AgendaItemStatus)
  status?: AgendaItemStatus;
}

export class UpdateAgendaStatusDto {
  @IsEnum(AgendaItemStatus)
  status!: AgendaItemStatus;
}

export class ReorderAgendaItemDto {
  @IsString()
  id!: string;

  @IsInt()
  @Min(1)
  order!: number;
}

export class ReorderAgendaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderAgendaItemDto)
  items!: ReorderAgendaItemDto[];
}
