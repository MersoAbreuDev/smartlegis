-- AlterEnum
ALTER TYPE "TenantStatus" ADD VALUE 'SUSPENDED';

-- CreateEnum
CREATE TYPE "LicensePlan" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VALIDATED', 'BLOCKED');
CREATE TYPE "BackupStatus" AS ENUM ('COMPLETED', 'RESTORED', 'FAILED');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "deleted_at" TIMESTAMP(3);

ALTER TABLE "users" ADD COLUMN "mfa_required" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "password_reset_required" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "tenant_licenses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan" "LicensePlan" NOT NULL DEFAULT 'BASIC',
    "max_users" INTEGER NOT NULL DEFAULT 25,
    "max_council_members" INTEGER NOT NULL DEFAULT 11,
    "storage_gb" INTEGER NOT NULL DEFAULT 20,
    "features" TEXT NOT NULL,
    "security_policy" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_licenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_domains" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_domains_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_branding" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#0B3C6D',
    "accent_color" TEXT NOT NULL DEFAULT '#D4AF37',
    "footer_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_branding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "platform_backups" (
    "id" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'COMPLETED',
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_licenses_tenant_id_key" ON "tenant_licenses"("tenant_id");
CREATE UNIQUE INDEX "tenant_domains_hostname_key" ON "tenant_domains"("hostname");
CREATE INDEX "tenant_domains_tenant_id_idx" ON "tenant_domains"("tenant_id");
CREATE UNIQUE INDEX "tenant_branding_tenant_id_key" ON "tenant_branding"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_licenses" ADD CONSTRAINT "tenant_licenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_branding" ADD CONSTRAINT "tenant_branding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
