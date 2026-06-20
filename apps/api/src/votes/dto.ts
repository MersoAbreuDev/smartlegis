import { VoteValue } from '@prisma/client';
import { IsEnum, IsString, Length } from 'class-validator';

export class StartVotingDto {
  @IsString()
  sessionId!: string;
  @IsString()
  matterId!: string;
}

export class RequestVoteMfaDto {
  @IsString()
  sessionId!: string;
  @IsString()
  matterId!: string;
  @IsEnum(VoteValue)
  vote!: VoteValue;
}

export class ConfirmVoteDto extends RequestVoteMfaDto {
  @IsString()
  challengeId!: string;
  @IsString()
  @Length(6, 6)
  code!: string;
}
