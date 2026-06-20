'use client';

import { AppShell } from '@/components/layout/app-shell';
import { ProtectedView } from '@/features/auth/protected-view';
import { CouncilMemberVoteScreen } from '@/features/plenary/council-member-vote-screen';

export default function CouncilMemberPage() {
  return (
    <ProtectedView allowedRoles={['VEREADOR']}>
      <AppShell active="vereador">
        <CouncilMemberVoteScreen />
      </AppShell>
    </ProtectedView>
  );
}
