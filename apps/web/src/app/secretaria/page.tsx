'use client';

import { AppShell } from '@/components/layout/app-shell';
import { ProtectedView } from '@/features/auth/protected-view';
import { SecretaryDashboard } from '@/features/secretaria/secretary-dashboard';

export default function SecretariaPage() {
  return (
    <ProtectedView allowedRoles={['SECRETARIO']}>
      <AppShell active="secretaria">
        <SecretaryDashboard />
      </AppShell>
    </ProtectedView>
  );
}
