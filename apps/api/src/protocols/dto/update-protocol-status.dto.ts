import { ProtocolStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProtocolStatusDto {
  @IsEnum(ProtocolStatus)
  status!: ProtocolStatus;
}
