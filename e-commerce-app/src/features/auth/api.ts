import { apiRequest } from '../lib/api-client';
import type { AuthResponse, User } from '../types';

export function register(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { email, password },
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function fetchCurrentUser(
  accessToken: string,
  signal?: AbortSignal,
  refreshOnUnauthorized = true,
): Promise<User> {
  return apiRequest<User>('/auth/me', {
    token: accessToken,
    signal,
    refreshOnUnauthorized,
  });
}

export function refreshSession(refreshToken: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    refreshOnUnauthorized: false,
  });
}

export function revokeSession(refreshToken: string): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
    refreshOnUnauthorized: false,
  });
}
