'use client';
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  attempts: number;
  authenticate: (code: string) => boolean;
  logout: () => void;
}

const PASSWORD = 'PISK';

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  attempts: 0,
  authenticate: (code: string) => {
    if (code.toUpperCase().trim() === PASSWORD) {
      set({ isAuthenticated: true, attempts: 0 });
      return true;
    }
    set({ attempts: get().attempts + 1 });
    return false;
  },
  logout: () => set({ isAuthenticated: false }),
}));
