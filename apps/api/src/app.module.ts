import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AddressModule } from './address/address.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { CouncilMembersModule } from './council-members/council-members.module';
import { LegislativeMattersModule } from './legislative-matters/legislative-matters.module';
import { BrandingAssetsModule } from './branding-assets/branding-assets.module';
import { MasterModule } from './master/master.module';
import { PlenarySessionsModule } from './plenary-sessions/plenary-sessions.module';
import { PortalContentModule } from './portal-content/portal-content.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicPortalModule } from './public-portal/public-portal.module';
import { RolesModule } from './roles/roles.module';
import { SessionAgendaModule } from './session-agenda/session-agenda.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    AddressModule,
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    RolesModule,
    CouncilMembersModule,
    LegislativeMattersModule,
    PlenarySessionsModule,
    PortalContentModule,
    SessionAgendaModule,
    VotesModule,
    AuditLogsModule,
    BrandingAssetsModule,
    MasterModule,
    PublicPortalModule
  ]
})
export class AppModule {}
