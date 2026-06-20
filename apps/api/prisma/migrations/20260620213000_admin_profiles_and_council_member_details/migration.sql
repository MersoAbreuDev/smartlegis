ALTER TABLE "users" ADD COLUMN "admin_profile_id" TEXT;

CREATE TABLE "admin_profiles" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "modules" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "council_members" ADD COLUMN "cpf" TEXT;
ALTER TABLE "council_members" ADD COLUMN "rg" TEXT;
ALTER TABLE "council_members" ADD COLUMN "birth_date" TIMESTAMP(3);
ALTER TABLE "council_members" ADD COLUMN "occupation" TEXT;
ALTER TABLE "council_members" ADD COLUMN "email" TEXT;
ALTER TABLE "council_members" ADD COLUMN "phone" TEXT;
ALTER TABLE "council_members" ADD COLUMN "mobile" TEXT;
ALTER TABLE "council_members" ADD COLUMN "zip_code" TEXT;
ALTER TABLE "council_members" ADD COLUMN "street" TEXT;
ALTER TABLE "council_members" ADD COLUMN "number" TEXT;
ALTER TABLE "council_members" ADD COLUMN "complement" TEXT;
ALTER TABLE "council_members" ADD COLUMN "neighborhood" TEXT;
ALTER TABLE "council_members" ADD COLUMN "city" TEXT;
ALTER TABLE "council_members" ADD COLUMN "state" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_document" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_name" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_trade_name" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_email" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_phone" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_zip_code" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_street" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_number" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_complement" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_neighborhood" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_city" TEXT;
ALTER TABLE "council_members" ADD COLUMN "business_state" TEXT;
ALTER TABLE "council_members" ADD COLUMN "legislative_period" TEXT;
ALTER TABLE "council_members" ADD COLUMN "legislative_role" TEXT;
ALTER TABLE "council_members" ADD COLUMN "is_president" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "council_members" ADD COLUMN "is_secretary" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "admin_profiles_tenant_id_name_key" ON "admin_profiles"("tenant_id", "name");
CREATE INDEX "admin_profiles_tenant_id_active_idx" ON "admin_profiles"("tenant_id", "active");
CREATE INDEX "users_admin_profile_id_idx" ON "users"("admin_profile_id");

ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_admin_profile_id_fkey" FOREIGN KEY ("admin_profile_id") REFERENCES "admin_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
