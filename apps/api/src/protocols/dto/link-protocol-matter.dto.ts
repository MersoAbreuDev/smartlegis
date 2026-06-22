import { IsString } from 'class-validator';

export class LinkProtocolMatterDto {
  @IsString()
  matterId!: string;
}
