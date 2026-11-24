import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthResponse, User } from '../types';
import { ApiError } from '../lib/api-client';
import {
  fetchCurrentUser,
  refreshSession,
  revokeSession,
} from './api';
import {
  getSessionTokens,
  removeSessionTokens,
  saveSessionTokens,
} from './session';
import { useAuthStore } from './store';
import {
  establishSession,
  logoutSession,
  refreshAccessToken,
  restoreSession,
} from './session-manager';

vi.mock('../lib/api-client', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
  setAccessTokenRefresher: vi.fn(),
}));

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

const user: User = {
  id: 'user-1',
  email: 'customer@example.com',
  createdAt: '2026-11-24T00:00:00.000Z',
};

const authResponse: AuthResponse = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 3600,
  user,
};

const fetchUserMock = vi.mocked(fetchCurrentUser);
const refreshMock = vi.mocked(refreshSession);
const revokeMock = vi.mocked(revokeSession);
const getTokensMock = vi.mocked(getSessionTokens);
const removeTokensMock = vi.mocked(removeSessionTokens);
const saveTokensMock = vi.mocked(saveSessionTokens);

describe('auth session lifecycle', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.getState().setAccessToken(null);
    getTokensMock.mockResolvedValue({
      accessToken: 'stored-access-token',
      refreshToken: 'stored-refresh-token',
    });
    fetchUserMock.mockResolvedValue(user);
    refreshMock.mockResolvedValue(authResponse);
    revokeMock.mockResolvedValue();
    removeTokensMock.mockResolvedValue();
    saveTokensMock.mockResolvedValue();
  });

  it('restores a valid stored session', async () => {
    await expect(restoreSession()).resolves.toBe('stored-access-token');
    expect(fetchUserMock).toHaveBeenCalledWith(
      'stored-access-token',
      undefined,
      false,
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('returns signed out when neither token exists', async () => {
    getTokensMock.mockResolvedValue({
      accessToken: null,
      refreshToken: null,
    });

    await expect(restoreSession()).resolves.toBeNull();
    expect(fetchUserMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('clears and rejects an incomplete persisted token pair', async () => {
    getTokensMock.mockResolvedValue({
      accessToken: 'stored-access-token',
      refreshToken: null,
    });

    await expect(restoreSession()).resolves.toBeNull();
    expect(removeTokensMock).toHaveBeenCalledOnce();
    expect(fetchUserMock).not.toHaveBeenCalled();
  });

  it('refreshes an expired access token and persists the rotated token pair', async () => {
    fetchUserMock
      .mockRejectedValueOnce(new ApiError('Access token expired', 401))
      .mockResolvedValueOnce(user);

    await expect(restoreSession()).resolves.toBe('new-access-token');
    expect(refreshMock).toHaveBeenCalledWith('stored-refresh-token');
    expect(saveTokensMock).toHaveBeenCalledWith(
      'new-access-token',
      'new-refresh-token',
    );
  });

  it('clears tokens and restores signed out when refresh is rejected', async () => {
    fetchUserMock.mockRejectedValue(new ApiError('Access token expired', 401));
    refreshMock.mockRejectedValue(new ApiError('Refresh token expired', 401));

    await expect(restoreSession()).resolves.toBeNull();
    expect(removeTokensMock).toHaveBeenCalledOnce();
  });

  it('does not keep an access token in memory when secure storage fails', async () => {
    useAuthStore.getState().setAccessToken('expired-access-token');
    getTokensMock.mockRejectedValue(new Error('Secure storage unavailable'));

    await expect(refreshAccessToken('expired-access-token')).rejects.toThrow(
      'Secure storage unavailable',
    );
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('does not authenticate if saving rotated tokens fails', async () => {
    fetchUserMock
      .mockRejectedValueOnce(new ApiError('Access token expired', 401))
      .mockResolvedValueOnce(user);
    saveTokensMock.mockRejectedValue(new Error('Secure storage unavailable'));

    await expect(restoreSession()).rejects.toThrow(
      'Secure storage unavailable',
    );
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(removeTokensMock).toHaveBeenCalledOnce();
    expect(revokeMock).toHaveBeenCalledWith('new-refresh-token');
  });

  it('clears local credentials and revokes a new session if token persistence fails', async () => {
    saveTokensMock.mockRejectedValue(new Error('Secure storage unavailable'));

    await expect(
      establishSession(Promise.resolve(authResponse)),
    ).rejects.toThrow('Secure storage unavailable');

    expect(removeTokensMock).toHaveBeenCalledOnce();
    expect(revokeMock).toHaveBeenCalledWith('new-refresh-token');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('sets the access token only after storing the new session', async () => {
    saveTokensMock.mockImplementation(async () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    await establishSession(Promise.resolve(authResponse));

    expect(useAuthStore.getState().accessToken).toBe('new-access-token');
  });

  it('does not let a refresh started before logout restore authentication', async () => {
    let resolveRefresh!: (response: AuthResponse) => void;
    refreshMock.mockReturnValue(
      new Promise<AuthResponse>((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    const pendingRefresh = refreshAccessToken('expired-access-token');
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledOnce());

    await logoutSession();
    resolveRefresh(authResponse);

    await expect(pendingRefresh).rejects.toThrow(
      'The session operation was cancelled.',
    );
    expect(saveTokensMock).not.toHaveBeenCalled();
    expect(revokeMock).toHaveBeenCalledWith('new-refresh-token');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('clears and revokes a refresh that was saving when logout began', async () => {
    let resolveSave!: () => void;
    saveTokensMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      }),
    );
    const pendingRefresh = refreshAccessToken('expired-access-token');
    await vi.waitFor(() => expect(saveTokensMock).toHaveBeenCalledOnce());

    const pendingLogout = logoutSession();
    resolveSave();
    await pendingLogout;

    await expect(pendingRefresh).rejects.toThrow(
      'The session operation was cancelled.',
    );
    expect(removeTokensMock).toHaveBeenCalled();
    expect(revokeMock).toHaveBeenCalledWith('new-refresh-token');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('revokes and clears the session on logout', async () => {
    useAuthStore.getState().setAccessToken('stored-access-token');

    await logoutSession();

    expect(removeTokensMock).toHaveBeenCalledOnce();
    expect(revokeMock).toHaveBeenCalledWith('stored-refresh-token');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('clears in-memory authentication even when logout storage fails', async () => {
    useAuthStore.getState().setAccessToken('stored-access-token');
    removeTokensMock.mockRejectedValue(new Error('Secure storage unavailable'));

    await expect(logoutSession()).rejects.toThrow('Secure storage unavailable');
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(revokeMock).toHaveBeenCalledWith('stored-refresh-token');
  });
});
