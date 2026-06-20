import { notFound } from 'next/navigation';
import { PublicSection, PublicSite } from '@/features/public/public-site';

const sections: PublicSection[] = ['noticias', 'sessoes', 'institucional', 'organograma', 'vereadores', 'leis', 'transparencia'];

export default async function PublicSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as PublicSection)) notFound();
  return <PublicSite section={section as PublicSection} />;
}
