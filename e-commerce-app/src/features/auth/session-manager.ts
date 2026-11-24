import { ApiError, setAccessTokenRefresher } from '../lib/api-client';
import { useAuthStore } from './store';
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

let refreshInFlight: Promise<string> | null = null;

export async function restoreSession(): Promise<string | null> {
  const { accessToken, refreshToken } = await getSessionTokens();
  if (!accessToken && !refreshToken) return null;
  if (!accessToken || !refreshToken) {
    await removeSessionTokens();
    return null;
  }

  try {
    await fetchCurrentUser(accessToken, undefined, false);
    return accessToken;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }

  let refreshedAccessToken: string;
  try {
    refreshedAccessToken = await rotateTokens(refreshToken, false);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await removeSessionTokens();
      return null;
    }
    throw error;
  }

  try {
    await fetchCurrentUser(refreshedAccessToken, undefined, false);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await removeSessionTokens();
      return null;
    }
    throw error;
  }
  return refreshedAccessToken;
}

export function refreshAccessToken(expiredAccessToken: string): Promise<string> {
  const currentToken = useAuthStore.getState().accessToken;
  if (currentToken && currentToken !== expiredAccessToken) {
    return Promise.resolve(currentToken);
  }
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = getSessionTokens()
    .catch((error: unknown) => {
      useAuthStore.getState().setAccessToken(null);
      throw error;
    })
    .then(({ refreshToken }) => {
      if (!refreshToken) {
        useAuthStore.getState().setAccessToken(null);
        return removeSessionTokens().then(() => {
          throw new ApiError('Your session expired. Please sign in again.', 401);
        });
      }
      return rotateTokens(refreshToken, true);
    })
    .catch(async (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        try {
          await removeSessionTokens();
        } finally {
          useAuthStore.getState().setAccessToken(null);
        }
      }
      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

async function rotateTokens(
  refreshToken: string,
  updateStore: boolean,
): Promise<string> {
  const authResponse = await refreshSession(refreshToken);
  try {
    await saveSessionTokens(authResponse.accessToken, authResponse.refreshToken);
  } catch (error) {
    useAuthStore.getState().setAccessToken(null);
    try {
      await removeSessionTokens();
    } catch {
      // Preserve the storage failure; an incomplete pair is rejected at restore.
    }
    throw error;
  }
  if (updateStore) {
    useAuthStore.getState().setAccessToken(authResponse.accessToken);
  }
  return authResponse.accessToken;
}

export async function logoutSession(): Promise<void> {
  let tokens: Awaited<ReturnType<typeof getSessionTokens>> | null = null;
  let storageError: unknown;
  let revocationError: unknown;

  try {
    tokens = await getSessionTokens();
  } catch (error) {
    storageError = error;
  }

  try {
    await removeSessionTokens();
  } catch (error) {
    storageError ??= error;
  } finally {
    useAuthStore.getState().setAccessToken(null);
  }

  if (tokens?.refreshToken) {
    try {
      await revokeSession(tokens.refreshToken);
    } catch (error) {
      revocationError = error;
    }
  }

  if (storageError) throw storageError;
  if (revocationError) {
    throw new Error(
      'You were signed out on this device, but the server could not revoke the session.',
      { cause: revocationError },
    );
  }
}

export function installSessionRefresh(): void {
  setAccessTokenRefresher(refreshAccessToken);
}
