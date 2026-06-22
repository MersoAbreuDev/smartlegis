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

  for (const hostname of ['legis.santaaurora.mg.gov.br', 'santaaurora.localhost']) {
    await prisma.tenantDomain.upsert({
      where: { hostname },
      update: { tenantId: tenant.id, status: 'VALIDATED' },
      create: {
        tenantId: tenant.id,
        hostname,
        status: 'VALIDATED'
      }
    });
  }

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
          cpf: ['123.456.789-01', '234.567.890-12', '345.678.901-23', '456.789.012-34', '567.890.123-45'][index],
          email: user.email,
          mobile: ['(31) 99999-0001', '(31) 99999-0002', '(31) 99999-0003', '(31) 99999-0004', '(31) 99999-0005'][index],
          zipCode: '30140-071',
          street: 'Rua da Camara',
          number: String(100 + index),
          neighborhood: 'Centro',
          city: 'Santa Aurora',
          state: 'MG',
          businessDocument: ['11.111.111/0001-11', '22.222.222/0001-22', '33.333.333/0001-33', '44.444.444/0001-44', '55.555.555/0001-55'][index],
          businessName: `Gabinete ${user.name}`,
          businessTradeName: `Gabinete ${index + 1}`,
          businessEmail: user.email,
          businessPhone: ['(31) 3333-0001', '(31) 3333-0002', '(31) 3333-0003', '(31) 3333-0004', '(31) 3333-0005'][index],
          businessZipCode: '30140-071',
          businessStreet: 'Rua da Camara',
          businessNumber: String(10 + index),
          businessNeighborhood: 'Centro',
          businessCity: 'Santa Aurora',
          businessState: 'MG',
          party: ['PL', 'PSD', 'MDB', 'PSB', 'UNIÃO'][index],
          photoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
          legislativePeriod: '2025-2028',
          legislativeRole: index === 0 ? 'Presidente' : index === 1 ? 'Secretaria' : 'Vereador',
          isPresident: index === 0,
          isSecretary: index === 1,
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

  for (let i = 0; i < members.length; i++) {
    await prisma.sessionAttendance.upsert({
      where: {
        tenantId_sessionId_councilMemberId: {
          tenantId: tenant.id,
          sessionId: session.id,
          councilMemberId: members[i].id
        }
      },
      update: { status: i === members.length - 1 ? 'JUSTIFIED' : 'PRESENT', registeredBy: secretarioUser.id },
      create: {
        tenantId: tenant.id,
        sessionId: session.id,
        councilMemberId: members[i].id,
        status: i === members.length - 1 ? 'JUSTIFIED' : 'PRESENT',
        registeredBy: secretarioUser.id,
        justification: i === members.length - 1 ? 'Ausencia justificada para demonstracao.' : null
      }
    });
  }

  const protocolPayload = {
    tenantId: tenant.id,
    protocolNumber: 1,
    year: 2026,
    documentType: 'Projeto de Lei',
    subject: 'Energia solar em predios publicos',
    description: 'Protocolo inicial vinculado a materia de demonstracao.',
    authorName: 'Secretaria Legislativa',
    authorDocument: '00.000.000/0001-00',
    authorEmail: 'secretario@santaaurora.leg.br',
    authorPhone: '(31) 3333-0000',
    matterId: matters[0].id,
    receivedBy: secretarioUser.id,
    status: 'ATTACHED_TO_MATTER' as const,
    documentUrl: '/documentos/protocolo-demo.pdf',
    receiptHash: createHash('sha256').update(`${tenant.id}:1:2026:${matters[0].id}`).digest('hex')
  };
  await prisma.protocol.upsert({
    where: { tenantId_protocolNumber_year: { tenantId: tenant.id, protocolNumber: 1, year: 2026 } },
    update: protocolPayload,
    create: protocolPayload
  });

  const minuteContent = [
    `Ata da ${session.type} ${session.number}/2026 da ${tenant.name}.`,
    'Aberta a sessao, foi registrada a presenca dos vereadores e iniciada a ordem do dia.',
    `Materia em destaque: ${matters[0].title}.`,
    'Esta ata foi gerada no seed para demonstrar o fluxo de criacao, revisao e publicacao pela Secretaria.'
  ].join('\n\n');
  await prisma.sessionMinute.upsert({
    where: { tenantId_sessionId: { tenantId: tenant.id, sessionId: session.id } },
    update: {
      content: minuteContent,
      status: 'PUBLISHED',
      generatedAt: new Date(),
      generatedBy: secretarioUser.id,
      approvedAt: new Date(),
      approvedBy: presidenteUser.id,
      publishedAt: new Date(),
      publishedBy: secretarioUser.id
    },
    create: {
      tenantId: tenant.id,
      sessionId: session.id,
      content: minuteContent,
      status: 'PUBLISHED',
      generatedAt: new Date(),
      generatedBy: secretarioUser.id,
      approvedAt: new Date(),
      approvedBy: presidenteUser.id,
      publishedAt: new Date(),
      publishedBy: secretarioUser.id
    }
  });

  await audit(tenant.id, admin.id, 'SEED_COMPLETED', 'Tenant', tenant.id, {
    tenant: tenant.name,
    users: 9,
    matters: matters.length,
    session: `${session.type} ${session.number}`,
    protocols: 1,
    attendances: members.length,
    minutes: 1
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
