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
