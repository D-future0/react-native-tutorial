import { UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

const now = new Date();
const user = {
  id: 'user-1',
  email: 'customer@example.com',
  createdAt: now,
};
const activeSession = {
  id: 'session-1',
  userId: user.id,
  deviceName: null,
  createdAt: now,
  expiresAt: new Date(now.getTime() + 60_000),
  revokedAt: null,
};

function createService(revokedAt: Date | null = null) {
  let transactionFinished = false;
  const refreshTokenRecord = {
    id: 'refresh-token-1',
    tokenHash: 'hashed-refresh-token',
    userId: user.id,
    sessionId: activeSession.id,
    expiresAt: new Date(now.getTime() + 60_000),
    revokedAt,
    createdAt: now,
    user,
    session: activeSession,
  };
  const transaction = {
    refreshToken: {
      findUnique: vi.fn().mockResolvedValue(refreshTokenRecord),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue(undefined),
    },
    session: {
      create: vi.fn().mockResolvedValue({ id: activeSession.id }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const userCreate = vi.fn().mockResolvedValue(user);
  const prisma = {
    user: { create: userCreate },
    $transaction: vi.fn(
      async (callback: (tx: typeof transaction) => Promise<unknown>) => {
        const result = await callback(transaction);
        transactionFinished = true;
        return result;
      },
    ),
  } as unknown as PrismaService;
  const jwt = {
    signAsync: vi.fn().mockResolvedValue('new-access-token'),
  };

  return {
    service: new AuthService(prisma, jwt as never),
    prisma,
    transaction,
    get transactionFinished() {
      return transactionFinished;
    },
  };
}

describe('AuthService refresh-token sessions', () => {
  it('stores the device name when creating a session during registration', async () => {
    const { service, transaction } = createService();

    await service.register(
      { email: user.email, password: 'valid-password' },
      'Shoppi Android',
    );

    expect(transaction.session.create).toHaveBeenCalledWith({
      data: {
        userId: user.id,
        deviceName: 'Shoppi Android',
        expiresAt: expect.any(Date),
      },
      select: { id: true },
    });
  });

  it('keeps rotated refresh tokens in the same session family', async () => {
    const { service, transaction } = createService();

    await service.refresh('old-refresh-token');

    expect(transaction.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'refresh-token-1',
        revokedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: { revokedAt: expect.any(Date) },
    });
    expect(transaction.refreshToken.create).toHaveBeenCalledWith({
      data: {
        tokenHash: expect.any(String),
        userId: user.id,
        sessionId: activeSession.id,
        expiresAt: expect.any(Date),
      },
    });
    expect(transaction.session.create).not.toHaveBeenCalled();
  });

  it('commits family revocation before rejecting a reused refresh token', async () => {
    const context = createService(now);
    const { service, transaction } = context;

    await expect(service.refresh('old-refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(context.transactionFinished).toBe(true);
    expect(transaction.session.updateMany).toHaveBeenCalledWith({
      where: { id: activeSession.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(transaction.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { sessionId: activeSession.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(transaction.refreshToken.create).not.toHaveBeenCalled();
  });

  it('revokes a session family when logout presents an old rotated token', async () => {
    const { service, transaction } = createService(now);

    await service.revokeRefreshToken('old-refresh-token');

    expect(transaction.session.updateMany).toHaveBeenCalledWith({
      where: { id: activeSession.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(transaction.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { sessionId: activeSession.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
