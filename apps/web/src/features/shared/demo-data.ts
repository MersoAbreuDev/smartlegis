import {
  Activity,
  CalendarDays,
  FileText,
  ShieldCheck,
  Users,
  Vote
} from 'lucide-react';

export type MatterStatus = 'DRAFT' | 'PROTOCOLLED' | 'IN_SESSION' | 'VOTING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type SessionStatus = 'SCHEDULED' | 'OPENED' | 'VOTING' | 'CLOSED' | 'CANCELLED';
export type AgendaStatus = 'PENDING' | 'IN_DISCUSSION' | 'VOTING' | 'VOTED' | 'SKIPPED';
export type VoteValue = 'YES' | 'NO' | 'ABSTAIN' | 'ABSENT';

export const tenant = {
  name: 'Camara Municipal de Santa Aurora',
  city: 'Santa Aurora',
  state: 'MG',
  document: '00.000.000/0001-00',
  status: 'ACTIVE'
};

export const users = [
  { name: 'Master SmartLegis', email: 'master@smartlegis.local', role: 'MASTER', status: 'ACTIVE' },
  { name: 'Ana Administradora', email: 'admin@santaaurora.leg.br', role: 'ADMIN_CAMARA', status: 'ACTIVE' },
  { name: 'Joao Almeida', email: 'presidente@santaaurora.leg.br', role: 'PRESIDENTE', status: 'ACTIVE' },
  { name: 'Marina Costa', email: 'secretario@santaaurora.leg.br', role: 'SECRETARIO', status: 'ACTIVE' },
  { name: 'Carla Mendes', email: 'carla@santaaurora.leg.br', role: 'VEREADOR', status: 'ACTIVE' },
  { name: 'Bruno Rocha', email: 'bruno@santaaurora.leg.br', role: 'VEREADOR', status: 'ACTIVE' },
  { name: 'Patricia Lima', email: 'patricia@santaaurora.leg.br', role: 'VEREADOR', status: 'ACTIVE' },
  { name: 'Rafael Nunes', email: 'rafael@santaaurora.leg.br', role: 'VEREADOR', status: 'ACTIVE' },
  { name: 'Sofia Barros', email: 'sofia@santaaurora.leg.br', role: 'VEREADOR', status: 'ACTIVE' }
];

export const councilMembers = [
  { id: 'cm-1', name: 'Carla Mendes', party: 'PL', email: 'carla@santaaurora.leg.br', status: 'ACTIVE', voteState: 'Voto pendente' },
  { id: 'cm-2', name: 'Bruno Rocha', party: 'PSD', email: 'bruno@santaaurora.leg.br', status: 'ACTIVE', voteState: 'Voto confirmado' },
  { id: 'cm-3', name: 'Patricia Lima', party: 'MDB', email: 'patricia@santaaurora.leg.br', status: 'ACTIVE', voteState: 'Voto confirmado' },
  { id: 'cm-4', name: 'Rafael Nunes', party: 'PSB', email: 'rafael@santaaurora.leg.br', status: 'ACTIVE', voteState: 'Aguardando MFA' },
  { id: 'cm-5', name: 'Sofia Barros', party: 'UNIAO', email: 'sofia@santaaurora.leg.br', status: 'ACTIVE', voteState: 'Voto confirmado' }
];

export const matters = [
  {
    id: 'mat-012',
    type: 'Projeto de Lei',
    number: '012/2026',
    title: 'Programa Municipal de Incentivo a Energia Solar',
    summary: 'Institui diretrizes para incentivar instalacao de energia solar em predios publicos e residenciais.',
    author: 'Carla Mendes',
    status: 'VOTING' as MatterStatus,
    documentUrl: '/documentos/materia-demo.pdf'
  },
  {
    id: 'mat-005',
    type: 'Requerimento',
    number: '005/2026',
    title: 'Pedido de informacoes sobre manutencao de estradas rurais',
    summary: 'Solicita cronograma detalhado de manutencao das vias rurais do municipio.',
    author: 'Bruno Rocha',
    status: 'IN_SESSION' as MatterStatus,
    documentUrl: '/documentos/requerimento-demo.pdf'
  },
  {
    id: 'mat-003',
    type: 'Mocao',
    number: '003/2026',
    title: 'Aplausos aos profissionais da educacao',
    summary: 'Reconhece publicamente a atuacao das equipes escolares municipais.',
    author: 'Patricia Lima',
    status: 'IN_SESSION' as MatterStatus,
    documentUrl: '/documentos/mocao-demo.pdf'
  }
];

export const sessions = [
  {
    id: 'ses-015',
    type: 'Ordinaria',
    number: '015/2026',
    date: '20/06/2026',
    hour: '19:00',
    status: 'VOTING' as SessionStatus,
    president: 'Joao Almeida',
    secretary: 'Marina Costa'
  },
  {
    id: 'ses-014',
    type: 'Ordinaria',
    number: '014/2026',
    date: '13/06/2026',
    hour: '19:00',
    status: 'CLOSED' as SessionStatus,
    president: 'Joao Almeida',
    secretary: 'Marina Costa'
  }
];

export const agenda = [
  { order: 1, sessionId: 'ses-015', matterId: 'mat-012', matter: matters[0], status: 'VOTING' as AgendaStatus },
  { order: 2, sessionId: 'ses-015', matterId: 'mat-005', matter: matters[1], status: 'PENDING' as AgendaStatus },
  { order: 3, sessionId: 'ses-015', matterId: 'mat-003', matter: matters[2], status: 'PENDING' as AgendaStatus }
];

export const auditLogs = [
  { time: '11:42', action: 'VOTING_STARTED', entity: 'LegislativeMatter', actor: 'Joao Almeida', hash: '6f9a...bc21', previousHash: '21ee...f019' },
  { time: '11:45', action: 'MFA_ISSUED', entity: 'MfaChallenge', actor: 'Rafael Nunes', hash: '882c...41ef', previousHash: '6f9a...bc21' },
  { time: '11:46', action: 'VOTE_CONFIRMED', entity: 'Vote', actor: 'Bruno Rocha', hash: 'e12d...90aa', previousHash: '882c...41ef' },
  { time: '11:48', action: 'VOTE_CONFIRMED', entity: 'Vote', actor: 'Sofia Barros', hash: 'a771...311c', previousHash: 'e12d...90aa' }
];

export const voteResult = {
  YES: 3,
  NO: 1,
  ABSTAIN: 1,
  ABSENT: 0,
  outcome: 'APPROVED',
  publicHash: 'e12d...90aa'
};

export const dashboardCards = [
  { title: 'Sessoes hoje', value: '2', footer: '1 em votacao', icon: CalendarDays },
  { title: 'Materias em tramitacao', value: '24', footer: '3 na pauta atual', icon: FileText },
  { title: 'Votacoes realizadas', value: '18', footer: 'Este mes', icon: Vote },
  { title: 'Logs auditados', value: '1.284', footer: 'Hash encadeado', icon: ShieldCheck }
];

export const publicCards = [
  { title: 'Materias publicadas', value: '36', icon: FileText },
  { title: 'Sessoes encerradas', value: '14', icon: CalendarDays },
  { title: 'Votacoes nominais', value: '18', icon: Vote },
  { title: 'Vereadores ativos', value: '5', icon: Users }
];

export const traceabilityItems = [
  { title: 'MFA emitido', description: 'Codigo temporario enviado ao e-mail institucional.', icon: ShieldCheck },
  { title: 'Voto confirmado', description: 'Registro nominal com hash individual e dispositivo.', icon: Vote },
  { title: 'Auditoria encadeada', description: 'Evento sensivel ligado ao hash anterior.', icon: Activity }
];
