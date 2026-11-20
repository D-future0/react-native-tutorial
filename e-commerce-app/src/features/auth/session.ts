import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'ecommerce-access-token';

export function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export function saveSessionToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export function removeSessionToken(): Promise<void> {
  return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
