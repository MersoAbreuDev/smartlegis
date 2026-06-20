import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MfaPurpose } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Credenciais invalidas.');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais invalidas.');

    const challenge = await this.createMfaChallenge(user.id, user.tenantId, MfaPurpose.LOGIN);
    return {
      requiresMfa: true,
      challengeId: challenge.id,
      demoCode: this.config.get('MFA_DEMO_CODE') ?? '123456'
    };
  }

  async confirmLoginMfa(challengeId: string, code: string) {
    const challenge = await this.consumeMfaChallenge(challengeId, code, MfaPurpose.LOGIN);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: challenge.userId } });
    return this.createSession(user.id);
  }

  async createSession(userId: string, extraPayload: Record<string, string> = {}) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      ...extraPayload
    });

    return {
      accessToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }

  async createMfaChallenge(userId: string, tenantId: string | null, purpose: MfaPurpose) {
    const code = this.config.get('MFA_DEMO_CODE') ?? '123456';
    return this.prisma.mfaChallenge.create({
      data: {
        userId,
        tenantId,
        purpose,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
  }

  async consumeMfaChallenge(challengeId: string, code: string, purpose: MfaPurpose) {
    const challenge = await this.prisma.mfaChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge || challenge.purpose !== purpose || challenge.consumedAt) {
      throw new UnauthorizedException('MFA invalido.');
    }
    if (challenge.expiresAt < new Date()) throw new UnauthorizedException('MFA expirado.');
    if (challenge.attempts >= 3) throw new UnauthorizedException('MFA bloqueado.');

    const valid = await bcrypt.compare(code, challenge.codeHash);
    if (!valid) {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } }
      });
      throw new UnauthorizedException('Codigo MFA incorreto.');
    }

    return this.prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() }
    });
  }

  deviceHash(input: string) {
    return createHash('sha256').update(input).digest('hex');
  }
}
