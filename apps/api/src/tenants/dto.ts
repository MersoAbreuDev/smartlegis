import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  name!: string;
  @IsString()
  city!: string;
  @IsString()
  state!: string;
  @IsString()
  document!: string;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
