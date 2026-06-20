CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED');

ALTER TABLE "council_members" ALTER COLUMN "user_id" DROP NOT NULL;

CREATE TABLE "portal_pages" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "content" TEXT NOT NULL,
  "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "published_at" TIMESTAMP(3),
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "portal_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portal_banners" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "image_url" TEXT,
  "link_url" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "published_at" TIMESTAMP(3),
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "portal_banners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portal_menu_items" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_by" TEXT NOT NULL,
  "updated_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "portal_menu_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "portal_pages_tenant_id_slug_key" ON "portal_pages"("tenant_id", "slug");
CREATE INDEX "portal_pages_tenant_id_status_idx" ON "portal_pages"("tenant_id", "status");
CREATE INDEX "portal_banners_tenant_id_status_active_idx" ON "portal_banners"("tenant_id", "status", "active");
CREATE INDEX "portal_menu_items_tenant_id_active_idx" ON "portal_menu_items"("tenant_id", "active");

ALTER TABLE "portal_pages" ADD CONSTRAINT "portal_pages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "portal_banners" ADD CONSTRAINT "portal_banners_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "portal_menu_items" ADD CONSTRAINT "portal_menu_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
