import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token inválido o expirado - limpiar y redirigir al login
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Servicios de productos
export const productsService = {
  getAll: () => api.get('/products'),
};

// Servicios de usuarios
export const usersService = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
};

// Servicios de turnos
export const shiftsService = {
  getAll: () => api.get('/shifts'),
  getActive: () => api.get('/shifts/active'),
  start: (userId: string, initialCash: number = 0) => 
    api.post('/shifts/start', { user_id: userId, initial_cash: initialCash }),
  close: (shiftId: string) => api.put(`/shifts/${shiftId}/close`),
};

// Servicios de transacciones
export const transactionsService = {
  getAll: () => api.get('/transactions'),
  getByShift: (shiftId: string) => api.get(`/transactions/shift/${shiftId}`),
  create: (transaction: any) => api.post('/transactions', transaction),
  getStatsToday: () => api.get('/transactions/stats/today'),
};