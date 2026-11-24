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
import type { AuthResponse } from '../types';

let refreshInFlight: {
  generation: number;
  id: symbol;
  promise: Promise<string>;
} | null = null;
let sessionGeneration = 0;
let logoutOperations = 0;
let tokenStorageQueue: Promise<void> = Promise.resolve();

class SessionOperationCancelledError extends Error {
  constructor() {
    super('The session operation was cancelled.');
    this.name = 'SessionOperationCancelledError';
  }
}

function isSessionCurrent(generation: number): boolean {
  return generation === sessionGeneration && logoutOperations === 0;
}

function withTokenStorage<T>(operation: () => Promise<T>): Promise<T> {
  const result = tokenStorageQueue.then(operation);
  tokenStorageQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function clearTokensForGeneration(generation: number): Promise<void> {
  await withTokenStorage(async () => {
    if (isSessionCurrent(generation)) {
      await removeSessionTokens();
    }
  });
}

export async function establishSession(
  authRequest: Promise<AuthResponse>,
): Promise<void> {
  const startedDuringLogout = logoutOperations > 0;
  const generation = ++sessionGeneration;
  useAuthStore.getState().setAccessToken(null);

  const authResponse = await authRequest;
  await withTokenStorage(async () => {
    if (startedDuringLogout || !isSessionCurrent(generation)) {
      await revokeSession(authResponse.refreshToken);
      throw new SessionOperationCancelledError();
    }

    try {
      await saveSessionTokens(
        authResponse.accessToken,
        authResponse.refreshToken,
      );
    } catch (error) {
      await clearFailedSession(authResponse.refreshToken, error, generation);
    }

    if (!isSessionCurrent(generation)) {
      await clearFailedSession(
        authResponse.refreshToken,
        new SessionOperationCancelledError(),
        generation,
      );
    }
    useAuthStore.getState().setAccessToken(authResponse.accessToken);
  });
}

export async function restoreSession(): Promise<string | null> {
  const generation = sessionGeneration;
  const { accessToken, refreshToken } = await getSessionTokens();
  if (!isSessionCurrent(generation)) return null;
  if (!accessToken && !refreshToken) return null;
  if (!accessToken || !refreshToken) {
    await clearTokensForGeneration(generation);
    return null;
  }

  try {
    await fetchCurrentUser(accessToken, undefined, false);
    return isSessionCurrent(generation) ? accessToken : null;
  } catch (error) {
    if (!isSessionCurrent(generation)) return null;
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }
  if (!isSessionCurrent(generation)) return null;

  let refreshedAccessToken: string;
  try {
    refreshedAccessToken = await rotateTokens(
      refreshToken,
      false,
      generation,
    );
  } catch (error) {
    if (error instanceof SessionOperationCancelledError) return null;
    if (error instanceof ApiError && error.status === 401) {
      await clearTokensForGeneration(generation);
      return null;
    }
    throw error;
  }

  try {
    await fetchCurrentUser(refreshedAccessToken, undefined, false);
  } catch (error) {
    if (error instanceof SessionOperationCancelledError) return null;
    if (error instanceof ApiError && error.status === 401) {
      await clearTokensForGeneration(generation);
      return null;
    }
    if (!isSessionCurrent(generation)) return null;
    throw error;
  }
  return isSessionCurrent(generation) ? refreshedAccessToken : null;
}

export function refreshAccessToken(expiredAccessToken: string): Promise<string> {
  if (logoutOperations > 0) {
    return Promise.reject(new SessionOperationCancelledError());
  }
  const currentToken = useAuthStore.getState().accessToken;
  if (currentToken && currentToken !== expiredAccessToken) {
    return Promise.resolve(currentToken);
  }
  const generation = sessionGeneration;
  if (refreshInFlight?.generation === generation) {
    return refreshInFlight.promise;
  }

  const operationId = Symbol();
  const refreshPromise = getSessionTokens()
    .catch((error: unknown) => {
      if (isSessionCurrent(generation)) {
        useAuthStore.getState().setAccessToken(null);
      }
      throw error;
    })
    .then(({ refreshToken }) => {
      if (!isSessionCurrent(generation)) {
        throw new SessionOperationCancelledError();
      }
      if (!refreshToken) {
        if (isSessionCurrent(generation)) {
          useAuthStore.getState().setAccessToken(null);
        }
        return clearTokensForGeneration(generation).then(() => {
          throw new ApiError(
            'Your session expired. Please sign in again.',
            401,
          );
        });
      }
      return rotateTokens(refreshToken, true, generation);
    })
    .catch(async (error: unknown) => {
      if (
        error instanceof ApiError &&
        error.status === 401 &&
        isSessionCurrent(generation)
      ) {
        try {
          await clearTokensForGeneration(generation);
        } finally {
          if (isSessionCurrent(generation)) {
            useAuthStore.getState().setAccessToken(null);
          }
        }
      }
      throw error;
    })
    .finally(() => {
      if (refreshInFlight?.id === operationId) {
        refreshInFlight = null;
      }
    });
  refreshInFlight = {
    generation,
    id: operationId,
    promise: refreshPromise,
  };

  return refreshPromise;
}

async function rotateTokens(
  refreshToken: string,
  updateStore: boolean,
  generation: number,
): Promise<string> {
  const authResponse = await refreshSession(refreshToken);
  await withTokenStorage(async () => {
    if (!isSessionCurrent(generation)) {
      await revokeSession(authResponse.refreshToken);
      throw new SessionOperationCancelledError();
    }

    try {
      await saveSessionTokens(
        authResponse.accessToken,
        authResponse.refreshToken,
      );
    } catch (error) {
      await clearFailedSession(authResponse.refreshToken, error, generation);
    }

    if (!isSessionCurrent(generation)) {
      await clearFailedSession(
        authResponse.refreshToken,
        new SessionOperationCancelledError(),
        generation,
      );
    }
    if (updateStore) {
      useAuthStore.getState().setAccessToken(authResponse.accessToken);
    }
  });
  return authResponse.accessToken;
}

async function clearFailedSession(
  refreshToken: string,
  originalError: unknown,
  generation: number,
): Promise<never> {
  if (generation === sessionGeneration) {
    useAuthStore.getState().setAccessToken(null);
  }
  const cleanupErrors: unknown[] = [];
  try {
    await removeSessionTokens();
  } catch (cleanupError) {
    cleanupErrors.push(cleanupError);
  }
  try {
    await revokeSession(refreshToken);
  } catch (cleanupError) {
    cleanupErrors.push(cleanupError);
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      [originalError, ...cleanupErrors],
      'Could not persist the session or complete credential cleanup.',
    );
  }
  throw originalError;
}

export async function logoutSession(): Promise<void> {
  sessionGeneration += 1;
  logoutOperations += 1;
  useAuthStore.getState().setAccessToken(null);

  let tokens: Awaited<ReturnType<typeof getSessionTokens>> | null = null;
  let storageError: unknown;
  let revocationError: unknown;

  try {
    await withTokenStorage(async () => {
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
    });
  } finally {
    logoutOperations -= 1;
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
