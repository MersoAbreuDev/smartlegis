'use client';

import { AppShell } from '@/components/layout/app-shell';
import { AdminFeature } from '@/features/admin/admin-dashboard';
import { ProtectedView } from '@/features/auth/protected-view';

export default function AdminPage() {
  return (
    <ProtectedView allowedRoles={['ADMIN_CAMARA']}>
      <AppShell active="admin">
        <AdminFeature />
      </AppShell>
    </ProtectedView>
  );
}
