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
): Promise<User> {
  return apiRequest<User>('/auth/me', { token: accessToken, signal });
}
