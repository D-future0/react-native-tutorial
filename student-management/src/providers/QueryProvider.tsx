
import { useEffect, type PropsWithChildren } from "react";
import {
  AppState,
  Platform,
} from "react-native";

import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});

export default function QueryProvider({
  children,
}: PropsWithChildren) {
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (status) => {
        if (Platform.OS !== "web") {
          focusManager.setFocused(status === "active");
        }
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}