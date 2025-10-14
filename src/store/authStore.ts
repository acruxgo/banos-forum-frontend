import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => {
        console.log('🔐 Login - Usuario guardado:', user); // ← DEBUG
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        console.log('🚪 Logout - Limpiando...'); // ← DEBUG
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);