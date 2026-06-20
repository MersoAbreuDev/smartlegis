import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export type BrandingLogoSlot = 'login' | 'sidenav' | 'portal';

@Injectable()
export class BrandingAssetsService {
  constructor(private readonly config: ConfigService) {}

  uploadsRoot() {
    return join(process.cwd(), 'uploads', 'branding');
  }

  assetFileName(slot: BrandingLogoSlot, contentType: string) {
    const extension = contentType.includes('png')
      ? 'png'
      : contentType.includes('jpeg') || contentType.includes('jpg')
        ? 'jpg'
        : contentType.includes('svg')
          ? 'svg'
          : 'webp';
    return `${slot}.${extension}`;
  }

  resolveAssetPath(tenantId: string, slot: string) {
    if (!['login', 'sidenav', 'portal'].includes(slot)) return null;
    const dir = join(this.uploadsRoot(), tenantId);
    const candidates = ['png', 'jpg', 'jpeg', 'svg', 'webp'].map((ext) => join(dir, `${slot}.${ext}`));
    return candidates.find((path) => existsSync(path)) ?? null;
  }

  publicAssetUrl(tenantId: string, slot: BrandingLogoSlot) {
    const apiBase = this.config.get<string>('API_PUBLIC_URL') ?? `http://localhost:${this.config.get<number>('API_PORT') ?? 3333}`;
    return `${apiBase.replace(/\/$/, '')}/api/branding/assets/${tenantId}/${slot}`;
  }

  async saveAsset(tenantId: string, slot: BrandingLogoSlot, contentType: string, buffer: Buffer) {
    const dir = join(this.uploadsRoot(), tenantId);
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, this.assetFileName(slot, contentType));
    await writeFile(filePath, buffer);
    return this.publicAssetUrl(tenantId, slot);
  }
}
