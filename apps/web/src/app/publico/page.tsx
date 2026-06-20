import type { Metadata } from 'next';
import { PublicSite } from '@/features/public/public-site';

export const metadata: Metadata = {
  title: 'Portal Publico | SmartLegis',
  description: 'Portal oficial de transparencia legislativa municipal'
};

export default function PublicPage() {
  return <PublicSite />;
}
