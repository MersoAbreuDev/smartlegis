CREATE TYPE "ProtocolStatus" AS ENUM ('RECEIVED', 'FORWARDED_TO_SECRETARY', 'ATTACHED_TO_MATTER', 'CANCELLED');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'JUSTIFIED', 'LATE');
CREATE TYPE "SessionMinuteStatus" AS ENUM ('DRAFT', 'GENERATED', 'IN_REVIEW', 'APPROVED', 'PUBLISHED');

CREATE TABLE "protocols" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "protocol_number" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "document_type" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "author_name" TEXT NOT NULL,
  "author_document" TEXT,
  "author_email" TEXT,
  "author_phone" TEXT,
  "matter_id" TEXT,
  "received_by" TEXT NOT NULL,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "ProtocolStatus" NOT NULL DEFAULT 'RECEIVED',
  "receipt_hash" TEXT NOT NULL,
  "document_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "protocols_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session_attendances" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "council_member_id" TEXT NOT NULL,
  "status" "AttendanceStatus" NOT NULL,
  "registered_by" TEXT NOT NULL,
  "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "justification" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "session_attendances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "session_minutes" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "status" "SessionMinuteStatus" NOT NULL DEFAULT 'DRAFT',
  "generated_at" TIMESTAMP(3),
  "generated_by" TEXT,
  "approved_at" TIMESTAMP(3),
  "approved_by" TEXT,
  "published_at" TIMESTAMP(3),
  "published_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "session_minutes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "protocols_tenant_id_protocol_number_year_key" ON "protocols"("tenant_id", "protocol_number", "year");
CREATE INDEX "protocols_tenant_id_status_idx" ON "protocols"("tenant_id", "status");
CREATE INDEX "protocols_tenant_id_received_at_idx" ON "protocols"("tenant_id", "received_at");
CREATE UNIQUE INDEX "session_attendances_tenant_id_session_id_council_member_id_key" ON "session_attendances"("tenant_id", "session_id", "council_member_id");
CREATE INDEX "session_attendances_tenant_id_session_id_status_idx" ON "session_attendances"("tenant_id", "session_id", "status");
CREATE UNIQUE INDEX "session_minutes_session_id_key" ON "session_minutes"("session_id");
CREATE UNIQUE INDEX "session_minutes_tenant_id_session_id_key" ON "session_minutes"("tenant_id", "session_id");
CREATE INDEX "session_minutes_tenant_id_status_idx" ON "session_minutes"("tenant_id", "status");

ALTER TABLE "protocols" ADD CONSTRAINT "protocols_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "legislative_matters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "plenary_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_council_member_id_fkey" FOREIGN KEY ("council_member_id") REFERENCES "council_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_attendances" ADD CONSTRAINT "session_attendances_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_minutes" ADD CONSTRAINT "session_minutes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_minutes" ADD CONSTRAINT "session_minutes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "plenary_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_minutes" ADD CONSTRAINT "session_minutes_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "session_minutes" ADD CONSTRAINT "session_minutes_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "session_minutes" ADD CONSTRAINT "session_minutes_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
