import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorState from '../src/components/ErrorState';
import LoadingState from '../src/components/LoadingState';
import {
  installSessionRefresh,
  restoreSession as restoreStoredSession,
} from '../src/features/auth/session-manager';
import { useAuthStore } from '../src/features/auth/store';
import CartBackgroundRefresh from '../src/features/cart/background-refresh';
import { queryClient } from '../src/features/lib/query-client';
import { installNetworkManager } from '../src/features/lib/network-manager';
import {
  isPersistableProductQuery,
  PRODUCT_QUERY_CACHE_KEY,
  PRODUCT_QUERY_CACHE_MAX_AGE,
} from '../src/features/lib/product-query-persistence';
import { usePreferencesStore } from '../src/features/preferences/store';
import { theme } from '../src/theme';

const productQueryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PRODUCT_QUERY_CACHE_KEY,
  throttleTime: 1000,
});

export default function RootLayout() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const loadTheme = usePreferencesStore((state) => state.loadTheme);
  const themePreference = usePreferencesStore((state) => state.theme);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const restoreSession = useCallback(async () => {
    setHydrated(false);
    setSessionError(null);
    setAccessToken(null);
    void loadTheme().catch((error: unknown) => {
      console.error('Could not load the saved theme preference.', error);
    });
    try {
      const accessToken = await restoreStoredSession();
      setAccessToken(accessToken);
    } catch (error) {
      setSessionError(
        error instanceof Error ? error.message : 'Could not restore your session.',
      );
    } finally {
      setHydrated(true);
    }
  }, [loadTheme, setAccessToken, setHydrated]);

  useEffect(() => {
    installNetworkManager();
    installSessionRefresh();
    void Promise.resolve().then(restoreSession);
  }, [restoreSession]);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: productQueryPersister,
          maxAge: PRODUCT_QUERY_CACHE_MAX_AGE,
          buster: PRODUCT_QUERY_CACHE_KEY,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) =>
              isPersistableProductQuery(
                query.queryKey,
                query.state.data !== undefined,
              ),
          },
        }}
      >
        <CartBackgroundRefresh />
        <StatusBar barStyle={themePreference === 'dark' ? 'light-content' : 'dark-content'} />
        {!isHydrated ? (
          <View style={styles.loading}>
            <LoadingState label="Getting your store ready…" />
          </View>
        ) : sessionError ? (
          <View style={styles.loading}>
            <ErrorState message={sessionError} onRetry={() => void restoreSession()} />
          </View>
        ) : (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="products/[id]" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="orders/index" />
          </Stack>
        )}
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: theme.colors.background },
});