'use client';

import { AppShell } from '@/components/layout/app-shell';
import { ProtectedView } from '@/features/auth/protected-view';
import { PlenaryFeature } from '@/features/plenary/president-screen';

export default function PlenaryPage() {
  return (
    <ProtectedView allowedRoles={['PRESIDENTE', 'SECRETARIO']}>
      <AppShell active="plenario">
        <PlenaryFeature />
      </AppShell>
    </ProtectedView>
  );
}
