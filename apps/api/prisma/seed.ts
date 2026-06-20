import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const prisma = new PrismaClient();
const password = 'Smart@123';

async function audit(tenantId: string | null, actorUserId: string | null, action: string, entity: string, entityId: string, afterJson: unknown) {
  const previous = await prisma.auditLog.findFirst({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  const payload = JSON.stringify({ tenantId, actorUserId, action, entity, entityId, afterJson, previousHash: previous?.hash ?? null });
  await prisma.auditLog.create({
    data: {
      tenantId,
      actorUserId,
      action,
      entity,
      entityId,
      afterJson: afterJson as object,
      previousHash: previous?.hash,
      hash: createHash('sha256').update(payload).digest('hex')
    }
  });
}

async function createUser(name: string, email: string, role: UserRole, tenantId: string | null) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      tenantId,
      name,
      email,
      role,
      passwordHash: await bcrypt.hash(password, 10)
    }
  });
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { document: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'Camara Municipal de Santa Aurora',
      city: 'Santa Aurora',
      state: 'MG',
      document: '00.000.000/0001-00'
    }
  });

  await prisma.tenantLicense.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      plan: 'PREMIUM',
      maxUsers: 80,
      maxCouncilMembers: 21,
      storageGb: 120,
      features: 'Votacao eletronica',
      securityPolicy: 'MFA obrigatorio'
    }
  });

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      displayName: 'Camara Municipal de Santa Aurora',
      primaryColor: '#0B3C6D',
      accentColor: '#D4AF37',
      footerText: 'Transparencia e gestao legislativa'
    }
  });

  await prisma.tenantDomain.upsert({
    where: { hostname: 'legis.santaaurora.mg.gov.br' },
    update: {},
    create: {
      tenantId: tenant.id,
      hostname: 'legis.santaaurora.mg.gov.br',
      status: 'VALIDATED'
    }
  });

  for (const [key, value] of [
    ['smtp.host', 'smtp.smartlegis.local'],
    ['whatsapp.provider', 'Provider pendente'],
    ['storage.provider', 'S3 compativel'],
    ['logs.retentionDays', '365'],
    ['security.passwordPolicy', '12 caracteres + MFA'],
    ['security.sessionHours', '8']
  ]) {
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  }

  await prisma.platformBackup.create({
    data: {
      sizeBytes: BigInt(18_400_000_000),
      status: 'COMPLETED',
      source: 'AUTOMATIC'
    }
  });

  const master = await createUser('Master SmartLegis', 'master@smartlegis.local', UserRole.MASTER, null);
  const admin = await createUser('Ana Administradora', 'admin@santaaurora.leg.br', UserRole.ADMIN_CAMARA, tenant.id);
  const presidenteUser = await createUser('Joao Almeida', 'presidente@santaaurora.leg.br', UserRole.PRESIDENTE, tenant.id);
  const secretarioUser = await createUser('Marina Costa', 'secretario@santaaurora.leg.br', UserRole.SECRETARIO, tenant.id);

  const vereadorUsers = await Promise.all([
    createUser('Carla Mendes', 'carla@santaaurora.leg.br', UserRole.VEREADOR, tenant.id),
    createUser('Bruno Rocha', 'bruno@santaaurora.leg.br', UserRole.VEREADOR, tenant.id),
    createUser('Patricia Lima', 'patricia@santaaurora.leg.br', UserRole.VEREADOR, tenant.id),
    createUser('Rafael Nunes', 'rafael@santaaurora.leg.br', UserRole.VEREADOR, tenant.id),
    createUser('Sofia Barros', 'sofia@santaaurora.leg.br', UserRole.VEREADOR, tenant.id)
  ]);

  const termStart = new Date('2025-01-01T00:00:00.000Z');
  const termEnd = new Date('2028-12-31T00:00:00.000Z');
  const members = await Promise.all(
    vereadorUsers.map((user, index) =>
      prisma.councilMember.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          tenantId: tenant.id,
          userId: user.id,
          name: user.name,
          party: ['PL', 'PSD', 'MDB', 'PSB', 'UNIÃO'][index],
          photoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
          termStart,
          termEnd
        }
      })
    )
  );

  const mattersData = [
    {
      type: 'Projeto de Lei',
      number: 12,
      year: 2026,
      title: 'Programa Municipal de Incentivo a Energia Solar',
      summary: 'Institui diretrizes para incentivar instalacao de energia solar em predios publicos e residenciais.'
    },
    {
      type: 'Requerimento',
      number: 5,
      year: 2026,
      title: 'Pedido de informacoes sobre manutencao de estradas rurais',
      summary: 'Solicita cronograma detalhado de manutencao das vias rurais do municipio.'
    },
    {
      type: 'Mocao',
      number: 3,
      year: 2026,
      title: 'Mocao de aplausos aos profissionais da educacao',
      summary: 'Reconhece publicamente a atuacao das equipes escolares municipais.'
    }
  ];

  const matters = [];
  for (let i = 0; i < mattersData.length; i++) {
    const matter = await prisma.legislativeMatter.upsert({
      where: {
        tenantId_type_number_year: {
          tenantId: tenant.id,
          type: mattersData[i].type,
          number: mattersData[i].number,
          year: mattersData[i].year
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...mattersData[i],
        authorId: members[i % members.length].id,
        status: i === 0 ? 'VOTING' : 'IN_SESSION',
        documentUrl: '/documentos/materia-demo.pdf',
        createdBy: secretarioUser.id
      }
    });
    matters.push(matter);
  }

  const session = await prisma.plenarySession.upsert({
    where: { tenantId_type_number: { tenantId: tenant.id, type: 'Ordinaria', number: 15 } },
    update: {},
    create: {
      tenantId: tenant.id,
      type: 'Ordinaria',
      number: 15,
      date: new Date('2026-06-20T19:00:00.000Z'),
      status: 'VOTING',
      openedAt: new Date(),
      presidentId: presidenteUser.id,
      secretaryId: secretarioUser.id
    }
  });

  for (let i = 0; i < matters.length; i++) {
    await prisma.sessionAgendaItem.upsert({
      where: { tenantId_sessionId_matterId: { tenantId: tenant.id, sessionId: session.id, matterId: matters[i].id } },
      update: {},
      create: {
        tenantId: tenant.id,
        sessionId: session.id,
        matterId: matters[i].id,
        order: i + 1,
        status: i === 0 ? 'VOTING' : 'PENDING'
      }
    });
  }

  await audit(tenant.id, admin.id, 'SEED_COMPLETED', 'Tenant', tenant.id, {
    tenant: tenant.name,
    users: 9,
    matters: matters.length,
    session: `${session.type} ${session.number}`
  });

  console.log(`Seed concluido. Senha de todos os usuarios: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
