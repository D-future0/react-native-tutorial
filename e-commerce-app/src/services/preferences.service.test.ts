import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { preferencesService } from './preferences.service';
import { usePreferencesStore } from '../features/preferences/store';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

const getItem = vi.mocked(AsyncStorage.getItem);
const setItem = vi.mocked(AsyncStorage.setItem);

describe('theme preference persistence', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    usePreferencesStore.setState({ theme: 'light' });
  });

  it.each(['light', 'dark'] as const)(
    'saves and restores the %s preference',
    async (theme) => {
      setItem.mockResolvedValue();
      getItem.mockResolvedValue(theme);

      await preferencesService.saveTheme(theme);

      expect(setItem).toHaveBeenCalledWith('shoppi_theme', theme);
      await expect(preferencesService.getTheme()).resolves.toBe(theme);
    },
  );

  it('ignores unknown stored preference values', async () => {
    getItem.mockResolvedValue('unsupported');

    await expect(preferencesService.getTheme()).resolves.toBeNull();
  });

  it('updates the stored theme choice only after AsyncStorage succeeds', async () => {
    setItem.mockResolvedValue();

    await usePreferencesStore.getState().setTheme('dark');

    expect(usePreferencesStore.getState().theme).toBe('dark');
    expect(setItem).toHaveBeenCalledWith('shoppi_theme', 'dark');

    setItem.mockRejectedValue(new Error('AsyncStorage unavailable'));
    await expect(
      usePreferencesStore.getState().setTheme('light'),
    ).rejects.toThrow('AsyncStorage unavailable');
    expect(usePreferencesStore.getState().theme).toBe('dark');
  });

  it('hydrates the preference from AsyncStorage', async () => {
    getItem.mockResolvedValue('dark');

    await usePreferencesStore.getState().loadTheme();

    expect(usePreferencesStore.getState().theme).toBe('dark');
  });
});
