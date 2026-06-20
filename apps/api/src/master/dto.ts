import { BackupStatus, DomainStatus, LicensePlan, TenantStatus, UserStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsObject, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';

const requiredString = { message: 'Campo obrigatorio.' };

export class CreateTenantMasterDto {
  @IsString(requiredString)
  @Length(2, 160)
  name!: string;

  @IsString(requiredString)
  @Length(2, 160)
  legalName!: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsString(requiredString)
  @Length(11, 18)
  document!: string;

  @IsOptional()
  @IsString()
  stateRegistration?: string;

  @IsOptional()
  @IsString()
  municipalRegistration?: string;

  @IsString(requiredString)
  @Length(2, 120)
  responsibleName!: string;

  @IsEmail()
  responsibleEmail!: string;

  @IsString(requiredString)
  @Length(8, 30)
  responsiblePhone!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString(requiredString)
  @Length(8, 30)
  contactPhone!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;

  @IsString(requiredString)
  @Length(8, 10)
  zipCode!: string;

  @IsString(requiredString)
  @Length(2, 160)
  street!: string;

  @IsString(requiredString)
  @Length(1, 20)
  number!: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString(requiredString)
  @Length(2, 120)
  neighborhood!: string;

  @IsString(requiredString)
  @Length(2, 120)
  city!: string;

  @IsString(requiredString)
  @Length(2, 2)
  state!: string;

  @IsString(requiredString)
  @Length(8, 10)
  billingZipCode!: string;

  @IsString(requiredString)
  @Length(2, 160)
  billingStreet!: string;

  @IsString(requiredString)
  @Length(1, 20)
  billingNumber!: string;

  @IsOptional()
  @IsString()
  billingComplement?: string;

  @IsString(requiredString)
  @Length(2, 120)
  billingNeighborhood!: string;

  @IsString(requiredString)
  @Length(2, 120)
  billingCity!: string;

  @IsString(requiredString)
  @Length(2, 2)
  billingState!: string;

  @IsOptional()
  @IsEnum(LicensePlan)
  plan?: LicensePlan;
}

export class UpdateTenantMasterDto {
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 160)
  legalName?: string;

  @IsOptional()
  @IsString()
  tradeName?: string;

  @IsOptional()
  @IsString()
  @Length(11, 18)
  document?: string;

  @IsOptional()
  @IsString()
  stateRegistration?: string;

  @IsOptional()
  @IsString()
  municipalRegistration?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  responsibleName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  responsibleEmail?: string;

  @IsOptional()
  @IsString()
  @Length(8, 30)
  responsiblePhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail valido.' })
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @Length(8, 30)
  contactPhone?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'Informe uma URL valida.' })
  website?: string;

  @IsOptional()
  @IsString()
  @Length(8, 10)
  zipCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 160)
  street?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  number?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @IsOptional()
  @IsString()
  @Length(8, 10)
  billingZipCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 160)
  billingStreet?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  billingNumber?: string;

  @IsOptional()
  @IsString()
  billingComplement?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  billingNeighborhood?: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  billingCity?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  billingState?: string;
}

export class CreateBrandingLogoUploadDto {
  @IsIn(['login', 'sidenav', 'portal'], { message: 'Slot de logo invalido.' })
  slot!: 'login' | 'sidenav' | 'portal';

  @IsString(requiredString)
  fileName!: string;

  @IsString(requiredString)
  contentType!: string;

  @IsString(requiredString)
  contentBase64!: string;
}

export class UpdateTenantStatusDto {
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status!: TenantStatus;
}

export class UpsertLicenseDto {
  @IsEnum(LicensePlan)
  plan!: LicensePlan;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCouncilMembers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  storageGb?: number;

  @IsOptional()
  @IsString()
  features?: string;

  @IsOptional()
  @IsString()
  securityPolicy?: string;
}

export class CreateAdminDto {
  @IsString()
  tenantId!: string;

  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(6)
  password!: string;
}

export class UpdateAdminDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsBoolean()
  mfaRequired?: boolean;

  @IsOptional()
  @IsString()
  @Length(6)
  password?: string;
}

export class CreateDomainDto {
  @IsString()
  tenantId!: string;

  @IsString()
  hostname!: string;
}

export class UpdateDomainStatusDto {
  @IsEnum(DomainStatus)
  status!: DomainStatus;
}

export class UpsertBrandingDto {
  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  logoLoginUrl?: string;

  @IsOptional()
  @IsString()
  logoSidenavUrl?: string;

  @IsOptional()
  @IsString()
  logoPortalUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  footerText?: string;
}

export class UpsertSettingsDto {
  @IsObject()
  settings!: Record<string, string>;
}

export class SecurityActionDto {
  @IsIn(['FORCE_PASSWORD_RESET', 'REVOKE_SESSIONS', 'BLOCK_USER', 'REQUIRE_MFA'])
  action!: 'FORCE_PASSWORD_RESET' | 'REVOKE_SESSIONS' | 'BLOCK_USER' | 'REQUIRE_MFA';

  @IsOptional()
  @IsString()
  userId?: string;
}

export class CreateBackupDto {
  @IsOptional()
  @IsString()
  source?: string;
}

export class RestoreBackupDto {
  @IsString()
  backupId!: string;
}

export class ImpersonateTenantDto {
  @IsString(requiredString)
  userId!: string;
}

export class ListAuditLogsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  actorUserId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 30, 50, 100], { message: 'Itens por pagina invalido.' })
  pageSize?: number = 10;
}
