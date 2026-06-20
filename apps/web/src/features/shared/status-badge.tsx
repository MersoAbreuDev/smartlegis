import { Badge } from '@/components/ui/badge';

const labels: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  DRAFT: 'Rascunho',
  PROTOCOLLED: 'Protocolada',
  IN_SESSION: 'Em pauta',
  VOTING: 'Em votacao',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  ARCHIVED: 'Arquivada',
  SCHEDULED: 'Agendada',
  OPENED: 'Aberta',
  CLOSED: 'Encerrada',
  CANCELLED: 'Cancelada',
  SUSPENDED: 'Suspensa',
  BLOCKED: 'Bloqueado',
  VALIDATED: 'Validado',
  OPERATIONAL: 'Operacional',
  DEGRADED: 'Degradado',
  PENDING: 'Pendente',
  VOTED: 'Votada',
  SKIPPED: 'Pulada'
};

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'APPROVED' || status === 'ACTIVE' || status === 'VOTED' || status === 'VALIDATED' || status === 'OPERATIONAL'
      ? 'green'
      : status === 'REJECTED' || status === 'INACTIVE' || status === 'CANCELLED' || status === 'BLOCKED'
        ? 'red'
        : status === 'VOTING' || status === 'PENDING' || status === 'SUSPENDED' || status === 'DEGRADED'
          ? 'yellow'
          : 'blue';

  return <Badge tone={tone}>{labels[status] ?? status}</Badge>;
}
