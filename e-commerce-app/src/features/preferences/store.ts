import { create } from 'zustand';
import { preferencesService } from '../../services/preferences.service';

export type ThemePreference = 'light' | 'dark';

interface PreferencesState {
  theme: ThemePreference;
  loadTheme: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: 'light',
  loadTheme: async () => {
    const savedTheme = await preferencesService.getTheme();
    if (savedTheme) set({ theme: savedTheme });
  },
  setTheme: async (theme) => {
    await preferencesService.saveTheme(theme);
    set({ theme });
  },
}));
