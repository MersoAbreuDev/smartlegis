import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

class CouncilMemberFieldsDto {
  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  rg?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  businessDocument?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  businessTradeName?: string;

  @IsOptional()
  @IsString()
  businessEmail?: string;

  @IsOptional()
  @IsString()
  businessPhone?: string;

  @IsOptional()
  @IsString()
  businessZipCode?: string;

  @IsOptional()
  @IsString()
  businessStreet?: string;

  @IsOptional()
  @IsString()
  businessNumber?: string;

  @IsOptional()
  @IsString()
  businessComplement?: string;

  @IsOptional()
  @IsString()
  businessNeighborhood?: string;

  @IsOptional()
  @IsString()
  businessCity?: string;

  @IsOptional()
  @IsString()
  businessState?: string;

  @IsOptional()
  @IsString()
  legislativePeriod?: string;

  @IsOptional()
  @IsString()
  legislativeRole?: string;

  @IsOptional()
  @IsBoolean()
  isPresident?: boolean;

  @IsOptional()
  @IsBoolean()
  isSecretary?: boolean;
}

export class CreateCouncilMemberDto extends CouncilMemberFieldsDto {
  @IsOptional()
  @IsString()
  userId?: string;
  @IsString()
  name!: string;
  @IsString()
  party!: string;
  @IsOptional()
  @IsString()
  photoUrl?: string;
  @IsDateString()
  termStart!: string;
  @IsDateString()
  termEnd!: string;
}

export class UpdateCouncilMemberDto extends CouncilMemberFieldsDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  party?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsDateString()
  termStart?: string;

  @IsOptional()
  @IsDateString()
  termEnd?: string;
}

export class LinkCouncilMemberUserDto {
  @IsString()
  userId!: string;
}
