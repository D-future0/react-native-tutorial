import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthResponse } from '../types';
import {
  getSessionTokens,
  removeSessionTokens,
  saveSessionTokens,
} from './session';
import {
  refreshSession,
  revokeSession,
} from './api';
import { useAuthStore } from './store';

vi.stubEnv('EXPO_PUBLIC_API_URL', 'http://store.test:3000');

const { ApiError, apiRequest, setAccessTokenRefresher } = await import(
  '../lib/api-client'
);
const { refreshAccessToken } = await import('./session-manager');

vi.mock('./api', () => ({
  fetchCurrentUser: vi.fn(),
  refreshSession: vi.fn(),
  revokeSession: vi.fn(),
}));

vi.mock('./session', () => ({
  getSessionTokens: vi.fn(),
  removeSessionTokens: vi.fn(),
  saveSessionTokens: vi.fn(),
}));

const authResponse: AuthResponse = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user: {
    id: 'user-1',
    email: 'customer@example.com',
    createdAt: '2026-11-24T00:00:00.000Z',
  },
};

const getTokensMock = vi.mocked(getSessionTokens);
const removeTokensMock = vi.mocked(removeSessionTokens);
const saveTokensMock = vi.mocked(saveSessionTokens);
const refreshMock = vi.mocked(refreshSession);
const revokeMock = vi.mocked(revokeSession);

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createFetchMock(alwaysUnauthorized = false): ReturnType<typeof vi.fn> {
  return vi.fn<typeof fetch>((_input, init) => {
    const authorization = new Headers(init?.headers).get('Authorization');
    if (!alwaysUnauthorized && authorization === 'Bearer new-access-token') {
      return Promise.resolve(jsonResponse(200, { ok: true }));
    }
    return Promise.resolve(jsonResponse(401, { message: 'Expired' }));
  });
}

describe('concurrent API requests during session refresh', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
    useAuthStore.getState().setAccessToken(null);
    getTokensMock.mockResolvedValue({
      accessToken: 'expired-access-token',
      refreshToken: 'old-refresh-token',
    });
    removeTokensMock.mockResolvedValue();
    saveTokensMock.mockResolvedValue();
    refreshMock.mockResolvedValue(authResponse);
    revokeMock.mockResolvedValue();
    setAccessTokenRefresher(refreshAccessToken);
  });

  it('shares one refresh and retries all three requests with the new token', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      Promise.all([
        apiRequest('/orders', { token: 'expired-access-token' }),
        apiRequest('/profile', { token: 'expired-access-token' }),
        apiRequest('/cart', { token: 'expired-access-token' }),
      ]),
    ).resolves.toEqual([{ ok: true }, { ok: true }, { ok: true }]);

    expect(refreshMock).toHaveBeenCalledOnce();
    expect(getTokensMock).toHaveBeenCalledOnce();
    expect(saveTokensMock).toHaveBeenCalledWith(
      'new-access-token',
      'new-refresh-token',
    );
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(
      fetchMock.mock.calls
        .filter(([, init]) =>
          new Headers(init?.headers).get('Authorization') ===
          'Bearer new-access-token',
        )
        .map(([, init]) => new Headers(init?.headers).get('Authorization')),
    ).toEqual([
      'Bearer new-access-token',
      'Bearer new-access-token',
      'Bearer new-access-token',
    ]);
  });

  it('rejects every waiting request without retry when refresh fails', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    refreshMock.mockRejectedValue(new ApiError('Refresh rejected', 401));

    const results = await Promise.allSettled([
      apiRequest('/orders', { token: 'expired-access-token' }),
      apiRequest('/profile', { token: 'expired-access-token' }),
      apiRequest('/cart', { token: 'expired-access-token' }),
    ]);

    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(removeTokensMock).toHaveBeenCalledOnce();
  });

  it('rejects every request and revokes the family if token persistence fails', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    saveTokensMock.mockRejectedValue(new Error('Secure storage unavailable'));

    const results = await Promise.allSettled([
      apiRequest('/orders', { token: 'expired-access-token' }),
      apiRequest('/profile', { token: 'expired-access-token' }),
      apiRequest('/cart', { token: 'expired-access-token' }),
    ]);

    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(revokeMock).toHaveBeenCalledWith('new-refresh-token');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('does not retry a request more than once after a 401 response', async () => {
    const fetchMock = createFetchMock(true);
    vi.stubGlobal('fetch', fetchMock);

    const results = await Promise.allSettled([
      apiRequest('/orders', { token: 'expired-access-token' }),
      apiRequest('/profile', { token: 'expired-access-token' }),
      apiRequest('/cart', { token: 'expired-access-token' }),
    ]);

    expect(results.every((result) => result.status === 'rejected')).toBe(true);
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
