import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { PrismaService } from '../prisma/prisma.service.js';

const PASSWORD_HASH_ROUNDS = 12;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface PublicUser {
  id: string;
  email: string;
  createdAt: Date;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    input: RegisterInput,
    deviceName?: string,
  ): Promise<AuthResult> {
    let user: PublicUser;

    try {
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          passwordHash: await hash(input.password, PASSWORD_HASH_ROUNDS),
        },
        select: { id: true, email: true, createdAt: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }

    return this.createAuthResult(user, undefined, { deviceName });
  }

  async login(input: LoginInput, deviceName?: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.createAuthResult(user, undefined, { deviceName });
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return user;
  }

  async refresh(rawToken: string): Promise<AuthResult> {
    const tokenHash = this.hashRefreshToken(rawToken);
    const now = new Date();

    const outcome = await this.prisma.$transaction(async (transaction) => {
      const storedToken = await transaction.refreshToken.findUnique({
        where: { tokenHash },
        include: {
          user: {
            select: { id: true, email: true, createdAt: true },
          },
          session: true,
        },
      });

      if (!storedToken) {
        return { kind: 'invalid' as const };
      }

      if (storedToken.revokedAt) {
        await this.revokeSessionFamily(
          transaction,
          storedToken.sessionId,
          now,
        );
        return { kind: 'reuse' as const };
      }

      if (
        storedToken.expiresAt <= now ||
        (storedToken.session &&
          (storedToken.session.revokedAt ||
            storedToken.session.expiresAt <= now))
      ) {
        return { kind: 'invalid' as const };
      }

      const nextTokenExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
      const activeSession = await transaction.session.updateMany({
        where: {
          id: storedToken.sessionId,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { expiresAt: nextTokenExpiresAt },
      });
      if (activeSession.count !== 1) {
        return { kind: 'invalid' as const };
      }

      const revoked = await transaction.refreshToken.updateMany({
        where: {
          id: storedToken.id,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });

      if (revoked.count !== 1) {
        await this.revokeSessionFamily(
          transaction,
          storedToken.sessionId,
          now,
        );
        return { kind: 'reuse' as const };
      }

      return {
        kind: 'success' as const,
        authResult: await this.createAuthResult(
          storedToken.user,
          transaction,
          {
            sessionId: storedToken.sessionId,
            tokenExpiresAt: nextTokenExpiresAt,
          },
        ),
      };
    });

    if (outcome.kind !== 'success') {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return outcome.authResult;
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const storedToken = await transaction.refreshToken.findUnique({
        where: { tokenHash: this.hashRefreshToken(rawToken) },
        select: { sessionId: true },
      });

      if (!storedToken) return;
      await this.revokeSessionFamily(transaction, storedToken.sessionId, now);
    });
  }

  private async createAuthResult(
    user: PublicUser,
    transaction?: Prisma.TransactionClient,
    options: {
      sessionId?: string;
      tokenExpiresAt?: Date;
      deviceName?: string;
    } = {},
  ): Promise<AuthResult> {
    const tokenExpiresAt =
      options.tokenExpiresAt ?? new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    if (!transaction) {
      return this.prisma.$transaction((tx) =>
        this.createAuthResult(user, tx, options),
      );
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    const refreshToken = randomBytes(48).toString('base64url');
    const session = options.sessionId
      ? { id: options.sessionId }
      : await transaction.session.create({
          data: {
            userId: user.id,
            deviceName: options.deviceName ?? null,
            expiresAt: tokenExpiresAt,
          },
          select: { id: true },
        });
    await transaction.refreshToken.create({
      data: {
        tokenHash: this.hashRefreshToken(refreshToken),
        userId: user.id,
        sessionId: session.id,
        expiresAt: tokenExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user,
    };
  }

  private async revokeSessionFamily(
    transaction: Prisma.TransactionClient,
    sessionId: string,
    revokedAt: Date,
  ): Promise<void> {
    await transaction.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt },
    });
    await transaction.refreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt },
    });
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
