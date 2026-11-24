import * as SecureStore from 'expo-secure-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { secureStorage } from './secure-storage.service';

vi.mock('expo-secure-store', () => ({
  deleteItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

const getItem = vi.mocked(SecureStore.getItemAsync);
const setItem = vi.mocked(SecureStore.setItemAsync);
const deleteItem = vi.mocked(SecureStore.deleteItemAsync);

describe('secure token storage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getItem.mockResolvedValue(null);
    setItem.mockResolvedValue();
    deleteItem.mockResolvedValue();
  });

  it('stores the access and refresh tokens in one atomic record', async () => {
    await secureStorage.saveTokens('access-token', 'refresh-token');

    expect(setItem).toHaveBeenCalledOnce();
    expect(setItem).toHaveBeenCalledWith(
      'shoppi_session_tokens',
      JSON.stringify({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    );
  });

  it('does not report a session saved when SecureStore rejects the single write', async () => {
    setItem.mockRejectedValue(new Error('Keychain unavailable'));

    await expect(
      secureStorage.saveTokens('access-token', 'refresh-token'),
    ).rejects.toThrow('Keychain unavailable');
    expect(setItem).toHaveBeenCalledOnce();
  });

  it('rejects and clears malformed token records', async () => {
    getItem.mockResolvedValueOnce('{"accessToken":"only-one-token"}');

    await expect(secureStorage.getTokens()).resolves.toEqual({
      accessToken: null,
      refreshToken: null,
    });
    expect(deleteItem).toHaveBeenCalledWith('shoppi_session_tokens');
  });
});
