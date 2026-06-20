import { IsInt, IsString, Min } from 'class-validator';

export class AddAgendaItemDto {
  @IsString()
  sessionId!: string;
  @IsString()
  matterId!: string;
  @IsInt()
  @Min(1)
  order!: number;
}
