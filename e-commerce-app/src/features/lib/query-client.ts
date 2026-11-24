import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import { PRODUCT_QUERY_CACHE_MAX_AGE } from './product-query-persistence';

if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (state) => {
      setFocused(state === 'active');
    });

    return () => subscription.remove();
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: PRODUCT_QUERY_CACHE_MAX_AGE,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});