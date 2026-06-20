CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "UserRole" AS ENUM ('MASTER', 'ADMIN_CAMARA', 'SECRETARIO', 'PRESIDENTE', 'VEREADOR');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "CouncilMemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "LegislativeMatterStatus" AS ENUM ('DRAFT', 'PROTOCOLLED', 'IN_SESSION', 'VOTING', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "PlenarySessionStatus" AS ENUM ('SCHEDULED', 'OPENED', 'VOTING', 'CLOSED', 'CANCELLED');
CREATE TYPE "AgendaItemStatus" AS ENUM ('PENDING', 'IN_DISCUSSION', 'VOTING', 'VOTED', 'SKIPPED');
CREATE TYPE "VoteValue" AS ENUM ('YES', 'NO', 'ABSTAIN', 'ABSENT');
CREATE TYPE "MfaPurpose" AS ENUM ('LOGIN', 'VOTE');

CREATE TABLE "tenants" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "document" TEXT NOT NULL,
  "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "council_members" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "party" TEXT NOT NULL,
  "photo_url" TEXT,
  "term_start" TIMESTAMP(3) NOT NULL,
  "term_end" TIMESTAMP(3) NOT NULL,
  "status" "CouncilMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT "council_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legislative_matters" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "status" "LegislativeMatterStatus" NOT NULL DEFAULT 'DRAFT',
  "document_url" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "legislative_matters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plenary_sessions" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" "PlenarySessionStatus" NOT NULL DEFAULT 'SCHEDULED',
  "opened_at" TIMESTAMP(3),
  "closed_at" TIMESTAMP(3),
  "president_id" TEXT NOT NULL,
  "secretary_id" TEXT NOT NULL,
  CONSTRAINT "plenary_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session_agenda_items" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "matter_id" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "status" "AgendaItemStatus" NOT NULL DEFAULT 'PENDING',
  CONSTRAINT "session_agenda_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "votes" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "matter_id" TEXT NOT NULL,
  "council_member_id" TEXT NOT NULL,
  "vote" "VoteValue" NOT NULL,
  "confirmed_at" TIMESTAMP(3) NOT NULL,
  "mfa_method" TEXT NOT NULL,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "device_hash" TEXT,
  "vote_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mfa_challenges" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT,
  "user_id" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "purpose" "MfaPurpose" NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT,
  "actor_user_id" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "before_json" JSONB,
  "after_json" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "hash" TEXT NOT NULL,
  "previous_hash" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenants_document_key" ON "tenants"("document");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_tenant_id_role_idx" ON "users"("tenant_id", "role");
CREATE UNIQUE INDEX "council_members_user_id_key" ON "council_members"("user_id");
CREATE INDEX "council_members_tenant_id_status_idx" ON "council_members"("tenant_id", "status");
CREATE UNIQUE INDEX "legislative_matters_tenant_id_type_number_year_key" ON "legislative_matters"("tenant_id", "type", "number", "year");
CREATE INDEX "legislative_matters_tenant_id_status_idx" ON "legislative_matters"("tenant_id", "status");
CREATE UNIQUE INDEX "plenary_sessions_tenant_id_type_number_key" ON "plenary_sessions"("tenant_id", "type", "number");
CREATE INDEX "plenary_sessions_tenant_id_status_idx" ON "plenary_sessions"("tenant_id", "status");
CREATE UNIQUE INDEX "session_agenda_items_tenant_id_session_id_matter_id_key" ON "session_agenda_items"("tenant_id", "session_id", "matter_id");
CREATE UNIQUE INDEX "session_agenda_items_tenant_id_session_id_order_key" ON "session_agenda_items"("tenant_id", "session_id", "order");
CREATE UNIQUE INDEX "votes_tenant_id_session_id_matter_id_council_member_id_key" ON "votes"("tenant_id", "session_id", "matter_id", "council_member_id");
CREATE INDEX "votes_tenant_id_session_id_matter_id_idx" ON "votes"("tenant_id", "session_id", "matter_id");
CREATE INDEX "mfa_challenges_tenant_id_user_id_purpose_idx" ON "mfa_challenges"("tenant_id", "user_id", "purpose");
CREATE INDEX "audit_logs_tenant_id_entity_entity_id_idx" ON "audit_logs"("tenant_id", "entity", "entity_id");
CREATE INDEX "audit_logs_hash_idx" ON "audit_logs"("hash");

ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "council_members" ADD CONSTRAINT "council_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "council_members" ADD CONSTRAINT "council_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "legislative_matters" ADD CONSTRAINT "legislative_matters_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "legislative_matters" ADD CONSTRAINT "legislative_matters_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "council_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "legislative_matters" ADD CONSTRAINT "legislative_matters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plenary_sessions" ADD CONSTRAINT "plenary_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_agenda_items" ADD CONSTRAINT "session_agenda_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_agenda_items" ADD CONSTRAINT "session_agenda_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "plenary_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_agenda_items" ADD CONSTRAINT "session_agenda_items_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "legislative_matters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "plenary_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "legislative_matters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "votes" ADD CONSTRAINT "votes_council_member_id_fkey" FOREIGN KEY ("council_member_id") REFERENCES "council_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mfa_challenges" ADD CONSTRAINT "mfa_challenges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mfa_challenges" ADD CONSTRAINT "mfa_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
