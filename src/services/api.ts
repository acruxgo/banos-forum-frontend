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

// Servicios de categorías
export const categoriesService = {
  getAll: (params?: Record<string, any>) => api.get('/categories', { params }),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (categoryData: { name: string; description?: string }) =>
    api.post('/categories', categoryData),
  update: (id: string, categoryData: { name: string; description?: string }) =>
    api.put(`/categories/${id}`, categoryData),
  toggleActive: (id: string) => api.patch(`/categories/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Servicios de productos
export const productsService = {
  getAll: (params?: Record<string, any>) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (productData: { name: string; price: number; type: string; category_id: string }) =>
    api.post('/products', productData),
  update: (id: string, productData: { name: string; price: number; type: string; category_id: string }) =>
    api.put(`/products/${id}`, productData),
  toggleActive: (id: string) => api.patch(`/products/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/products/${id}`),
  restore: (id: string) => api.patch(`/products/${id}/restore`),
};

// Servicios de empresas (solo super admin)
export const businessesService = {
  getAll: (params?: Record<string, any>) => api.get('/businesses', { params }),
  getById: (id: string) => api.get(`/businesses/${id}`),
  getGlobalStats: () => api.get('/businesses/stats/global'),
  create: (businessData: {
    name: string;
    slug: string;
    email: string;
    phone?: string;
    address?: string;
    plan?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => api.post('/businesses', businessData),
  update: (id: string, businessData: any) => api.put(`/businesses/${id}`, businessData),
  toggleActive: (id: string) => api.patch(`/businesses/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/businesses/${id}`),
};

// Servicios de usuarios
export const usersService = {
  getAll: (params?: Record<string, any>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (userData: { email: string; name: string; role: string; password: string }) =>
    api.post('/users', userData),
  update: (id: string, userData: { email: string; name: string; role: string; password?: string }) =>
    api.put(`/users/${id}`, userData),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/users/${id}`),
  restore: (id: string) => api.patch(`/users/${id}/restore`),
};

// Servicios de turnos
export const shiftsService = {
  getAll: () => api.get('/shifts'),
  getActive: () => api.get('/shifts/active'),
  start: (userId: string, initialCash: number = 0) => 
    api.post('/shifts/start', { user_id: userId, initial_cash: initialCash }),
  close: (shiftId: string, finalCash: number) => 
    api.put(`/shifts/${shiftId}/close`, { final_cash: finalCash }),
};

// Servicios de transacciones
export const transactionsService = {
  getAll: (params?: Record<string, any>) => api.get('/transactions', { params }),
  getByShift: (shiftId: string) => api.get(`/transactions/shift/${shiftId}`),
  create: (transaction: any) => api.post('/transactions', transaction),
  getStatsToday: () => api.get('/transactions/stats/today'),
};

// Servicios de tickets
export const ticketsService = {
  getAll: (params?: Record<string, any>) => api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (ticketData: {
    transaction_id?: string;
    customer_name?: string;
    customer_phone?: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    subtotal: number;
    discount?: number;
    total: number;
    payment_method: string;
    notes?: string;
  }) => api.post('/tickets', ticketData),
  markPrinted: (id: string) => api.patch(`/tickets/${id}/mark-printed`),
  markSent: (id: string) => api.patch(`/tickets/${id}/mark-sent`),
};

// Servicios de reportes
export const reportsService = {
  getDailyReport: (date?: string) => api.get('/reports/daily', { params: { date } }),
  getCashClosingReport: (shift_id: string) => api.post('/reports/cash-closing', { shift_id })
};