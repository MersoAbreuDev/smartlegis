'use client';

import { ProtectedView } from '@/features/auth/protected-view';
import { MasterShell } from '@/features/master/master-shell';

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedView allowedRoles={['MASTER']}>
      <MasterShell>{children}</MasterShell>
    </ProtectedView>
  );
}
