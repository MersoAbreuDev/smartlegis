-- Rename legacy logo column and add dedicated logo slots
ALTER TABLE "tenant_branding" RENAME COLUMN "logo_url" TO "logo_portal_url";
ALTER TABLE "tenant_branding" ADD COLUMN "logo_login_url" TEXT;
ALTER TABLE "tenant_branding" ADD COLUMN "logo_sidenav_url" TEXT;
