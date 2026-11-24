import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionTokens } from './session';

const SESSION_TOKENS_KEY = 'shoppi_session_tokens';
const LEGACY_ACCESS_TOKEN_KEY = 'shoppi_access_token';
const LEGACY_REFRESH_TOKEN_KEY = 'shoppi_refresh_token';
const LEGACY_SINGLE_TOKEN_KEY = 'ecommerce-access-token';

export async function getSessionTokens(): Promise<SessionTokens> {
  const stored = await AsyncStorage.getItem(SESSION_TOKENS_KEY);
  if (stored) {
    try {
      return parseTokens(stored);
    } catch {
      await removeSessionTokens();
      return { accessToken: null, refreshToken: null };
    }
  }

  const [accessToken, refreshToken, legacySingleToken] = await Promise.all([
    AsyncStorage.getItem(LEGACY_ACCESS_TOKEN_KEY),
    AsyncStorage.getItem(LEGACY_REFRESH_TOKEN_KEY),
    AsyncStorage.getItem(LEGACY_SINGLE_TOKEN_KEY),
  ]);
  if (!accessToken || !refreshToken) {
    if (accessToken || refreshToken || legacySingleToken) {
      await removeSessionTokens();
    }
    return { accessToken: null, refreshToken: null };
  }

  await saveSessionTokens(accessToken, refreshToken);
  await AsyncStorage.multiRemove([
    LEGACY_ACCESS_TOKEN_KEY,
    LEGACY_REFRESH_TOKEN_KEY,
  ]);
  return { accessToken, refreshToken };
}

export async function saveSessionTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await AsyncStorage.setItem(
    SESSION_TOKENS_KEY,
    JSON.stringify({ accessToken, refreshToken }),
  );
}

export async function removeSessionTokens(): Promise<void> {
  await AsyncStorage.multiRemove([
    SESSION_TOKENS_KEY,
    LEGACY_ACCESS_TOKEN_KEY,
    LEGACY_REFRESH_TOKEN_KEY,
    LEGACY_SINGLE_TOKEN_KEY,
  ]);
}

function parseTokens(value: string): SessionTokens {
  const parsed: unknown = JSON.parse(value);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('accessToken' in parsed) ||
    !('refreshToken' in parsed) ||
    typeof parsed.accessToken !== 'string' ||
    typeof parsed.refreshToken !== 'string' ||
    !parsed.accessToken ||
    !parsed.refreshToken
  ) {
    throw new Error('Stored session tokens are invalid');
  }
  return {
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
  };
}
