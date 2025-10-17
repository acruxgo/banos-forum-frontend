import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  plan: 'basic' | 'premium' | 'enterprise';
}

interface AuthState {
  user: User | null;
  business: Business | null;
  isAuthenticated: boolean;
  login: (user: User, business?: Business | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      business: null,
      isAuthenticated: false,
      login: (user, business = null) => {
        console.log('🔐 Login - Usuario guardado:', user);
        console.log('🏢 Login - Empresa guardada:', business);
        set({ user, business, isAuthenticated: true });
      },
      logout: () => {
        console.log('🚪 Logout - Limpiando...');
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        set({ user: null, business: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);