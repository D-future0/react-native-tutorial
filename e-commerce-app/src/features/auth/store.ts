import { create } from 'zustand';

interface AuthStore {
  accessToken: string | null;
  isHydrated: boolean;
  setAccessToken: (accessToken: string | null) => void;
  setHydrated: (isHydrated: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  isHydrated: false,
  setAccessToken: (accessToken) => set({ accessToken }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}));
