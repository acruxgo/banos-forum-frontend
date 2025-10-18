import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

export const useSessionTimeout = (timeoutMinutes: number = 30) => {
  const logout = useAuthStore((state) => state.logout);
  const timeoutId = useRef<number | null>(null);

  const resetTimeout = useCallback(() => {
    // Limpiar timeout anterior
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    // Crear nuevo timeout
    timeoutId.current = window.setTimeout(() => {
      console.log('⏰ Sesión expirada por inactividad');
      logout();
    }, timeoutMinutes * 60 * 1000);
  }, [logout, timeoutMinutes]);

  useEffect(() => {
    // Eventos que resetean el timeout
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    // Resetear timeout en cada evento
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout);
    });

    // Iniciar timeout al montar
    resetTimeout();

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [resetTimeout]);
};