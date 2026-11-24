import * as SecureStore from 'expo-secure-store';

const SESSION_TOKENS_KEY = 'shoppi_session_tokens';
const LEGACY_ACCESS_TOKEN_KEY = 'shoppi_access_token';
const LEGACY_REFRESH_TOKEN_KEY = 'shoppi_refresh_token';
const LEGACY_SINGLE_TOKEN_KEY = 'ecommerce-access-token';

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export const secureStorage = {
  async saveTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    await SecureStore.setItemAsync(
      SESSION_TOKENS_KEY,
      JSON.stringify({ accessToken, refreshToken }),
    );
  },

  async getTokens(): Promise<StoredTokens> {
    const stored = await SecureStore.getItemAsync(SESSION_TOKENS_KEY);
    if (stored) {
      try {
        return parseTokens(stored);
      } catch {
        await secureStorage.clearTokens();
        return { accessToken: null, refreshToken: null };
      }
    }

    const [accessToken, refreshToken, legacySingleToken] = await Promise.all([
      SecureStore.getItemAsync(LEGACY_ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(LEGACY_REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(LEGACY_SINGLE_TOKEN_KEY),
    ]);
    if (!accessToken || !refreshToken) {
      if (accessToken || refreshToken || legacySingleToken) {
        await secureStorage.clearTokens();
      }
      return { accessToken: null, refreshToken: null };
    }

    await secureStorage.saveTokens(accessToken, refreshToken);
    await Promise.all([
      SecureStore.deleteItemAsync(LEGACY_ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(LEGACY_REFRESH_TOKEN_KEY),
    ]);
    return { accessToken, refreshToken };
  },

  async clearTokens(): Promise<void> {
    const removals = await Promise.allSettled([
      SecureStore.deleteItemAsync(SESSION_TOKENS_KEY),
      SecureStore.deleteItemAsync(LEGACY_ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(LEGACY_REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(LEGACY_SINGLE_TOKEN_KEY),
    ]);
    const failedRemoval = removals.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (failedRemoval) throw failedRemoval.reason;
  },
};

function parseTokens(value: string): StoredTokens {
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