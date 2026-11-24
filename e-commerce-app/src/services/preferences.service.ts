import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'shoppi_theme';

export const preferencesService = {
  async saveTheme(theme: 'light' | 'dark'): Promise<void> {
    await AsyncStorage.setItem(THEME_KEY, theme);
  },

  async getTheme(): Promise<'light' | 'dark' | null> {
    const theme = await AsyncStorage.getItem(THEME_KEY);

    if (theme === 'light' || theme === 'dark') {
      return theme;
    }

    return null;
  },
};