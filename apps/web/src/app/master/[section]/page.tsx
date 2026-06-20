import { notFound } from 'next/navigation';
import { MasterSectionContent } from '@/features/master/master-sections';
import { MasterSectionId, masterMenu } from '@/features/master/master-menu';

export default async function MasterSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const allowed = masterMenu.map((item) => item.id);
  if (!section || !allowed.includes(section as MasterSectionId)) notFound();
  return <MasterSectionContent section={section as MasterSectionId} />;
}
