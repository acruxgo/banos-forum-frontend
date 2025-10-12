import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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