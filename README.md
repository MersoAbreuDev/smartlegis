# SmartLegis

MVP apresentavel de sistema legislativo multi tenant para Camaras Municipais pequenas, inspirado no SAPL e focado em votacao nominal segura, MFA, auditoria e transparencia publica.

## Stack

- Backend: NestJS, TypeScript, Prisma, PostgreSQL, JWT, RBAC e Docker.
- Frontend: Next.js, React, TypeScript, TailwindCSS, componentes estilo ShadCN/UI, React Query, React Hook Form, Zod e Lucide Icons.
- BFFs: `bff-admin`, `bff-plenary` e `bff-public`, separados por contexto de uso.

## Como Rodar

1. Copie as variaveis:

```bash
cp .env.example .env
```

2. Instale dependencias:

```bash
npm install
```

3. Suba o PostgreSQL:

```bash
docker compose up -d postgres
```

4. Rode migrations e seed:

```bash
npm run db:migrate
npm run db:seed
```

5. Rode API e interface:

```bash
npm run api:dev
npm run web:dev
```

API: `http://localhost:3333/api`  
Web: `http://localhost:3000`

Rotas principais do frontend:

- `/` login integrado ao backend, MFA e redirecionamento por perfil.
- `/master` console de plataforma protegido para MASTER.
- `/admin` painel administrativo da Camara protegido para ADMIN_CAMARA e SECRETARIO.
- `/plenario` telas do presidente, secretario e resultado protegidas para PRESIDENTE e SECRETARIO.
- `/vereador` tela de voto nominal com MFA e comprovante protegida para VEREADOR.
- `/publico` portal publico de transparencia.

## Integracao Frontend x Backend

O frontend chama a Core API NestJS configurada em `NEXT_PUBLIC_API_URL`.

- Login: `POST /api/auth/login`
- Confirmacao MFA: `POST /api/auth/mfa/confirm`
- Usuarios: `GET /api/users`
- Vereadores: `GET /api/council-members`
- Materias: `GET /api/legislative-matters`
- Sessoes: `GET /api/plenary-sessions`
- Auditoria: `GET /api/audit-logs`
- Solicitar MFA de voto: `POST /api/votes/mfa`
- Confirmar voto: `POST /api/votes/confirm`
- Iniciar votacao: `POST /api/votes/start`
- Encerrar votacao: `PATCH /api/votes/:sessionId/:matterId/close`

O JWT fica em `localStorage` durante o MVP. As telas usam RBAC no frontend para esconder areas indevidas, e a API continua sendo a autoridade real com guards JWT/RBAC.

Importante: MASTER nao acessa mais o Admin da Camara. Ele e redirecionado para `/master`, onde administra plataforma, tenants, licencas, dominios, branding, administradores, auditoria global, seguranca, monitoramento, backups e configuracoes. Ele nao vota, nao cria materia, nao abre/encerra sessao e nao interfere no processo legislativo.

## Variaveis de Ambiente

```env
DATABASE_URL="postgresql://smartlegis:smartlegis@localhost:5432/smartlegis?schema=public"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="8h"
MFA_DEMO_CODE="123456"
API_PORT=3333
NEXT_PUBLIC_API_URL="http://localhost:3333"
```

## Usuarios de Teste

Todos usam a senha `Smart@123`.

| Perfil | E-mail |
| --- | --- |
| MASTER | `master@smartlegis.local` |
| ADMIN_CAMARA | `admin@santaaurora.leg.br` |
| PRESIDENTE | `presidente@santaaurora.leg.br` |
| SECRETARIO | `secretario@santaaurora.leg.br` |
| VEREADOR | `carla@santaaurora.leg.br` |
| VEREADOR | `bruno@santaaurora.leg.br` |
| VEREADOR | `patricia@santaaurora.leg.br` |
| VEREADOR | `rafael@santaaurora.leg.br` |
| VEREADOR | `sofia@santaaurora.leg.br` |

Codigo MFA da demo: `123456`.

## Fluxo de Demonstracao

1. Entre como `presidente@santaaurora.leg.br`.
2. Confirme o MFA com `123456`.
3. Acesse o cockpit do plenario.
4. Veja a materia em votacao e a apuracao nominal.
5. Acesse a tela do vereador para simular voto com MFA.
6. Confira o comprovante visual de voto registrado.
7. Abra o portal publico para ver materias, sessoes e resultado publicado.

## Regras Criticas Implementadas

- Dados operacionais carregam `tenant_id`.
- JWT e RBAC protegem endpoints privados.
- Controllers filtram dados pelo tenant do usuario autenticado.
- Voto confirmado e imutavel por modelagem: nao ha endpoint de edicao de voto.
- Um vereador so vota uma vez por materia em uma sessao via constraint unica.
- Registro de voto exige perfil VEREADOR, sessao aberta/em votacao, materia em VOTING e MFA consumido.
- Presidente inicia e encerra votacao.
- Resultado e calculado automaticamente a partir dos votos.
- AuditLog usa `hash` e `previous_hash`.
- Portal publico nao exige login e retorna dados publicados/finalizados.

## Estrutura

```text
apps/
  api/           Core API NestJS + Prisma
  bff-admin/     BFF para painel administrativo
  bff-plenary/   BFF para presidente, secretario e vereadores
  bff-public/    BFF para portal publico
  web/           Interface Next.js
```

Frontend:

```text
apps/web/src/features/
  auth/       Login e MFA integrado ao backend
  master/     Console Master da plataforma
  admin/      Dashboard, usuarios, vereadores, materias, sessoes, pauta e auditoria
  plenary/    Presidente, secretario, vereador e resultado da votacao
  public/     Home publica, materias, sessoes, resultados e vereadores
  shared/     Dados de demo, tabelas, badges, cards e paineis
```

## Observacoes do MVP

- MFA usa codigo fixo em ambiente de demo. Em producao, conectar provedor de e-mail e armazenar politicas de expiracao/retentativa por tenant.
- ICP-Brasil, diario oficial, protocolo externo, app mobile e relatorios avancados ficaram fora do escopo, conforme solicitado.
- A interface e demonstravel de ponta a ponta e a API ja tem a base para persistencia real.
