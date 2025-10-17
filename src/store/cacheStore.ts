import { create } from 'zustand';

interface CacheState {
  users: any[];
  products: any[];
  usersTimestamp: number | null;
  productsTimestamp: number | null;
  CACHE_DURATION: number;
  
  // Getters
  getUsers: () => any[] | null;
  getProducts: () => any[] | null;
  
  // Setters
  setUsers: (users: any[]) => void;
  setProducts: (products: any[]) => void;
  
  // Invalidators
  invalidateUsers: () => void;
  invalidateProducts: () => void;
  invalidateAll: () => void;
}

export const useCacheStore = create<CacheState>((set, get) => ({
  users: [],
  products: [],
  usersTimestamp: null,
  productsTimestamp: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  
  // Obtener usuarios del caché (si no están vencidos)
  getUsers: () => {
    const { users, usersTimestamp, CACHE_DURATION } = get();
    
    if (!usersTimestamp) return null;
    
    const now = Date.now();
    const isExpired = now - usersTimestamp > CACHE_DURATION;
    
    if (isExpired) {
      set({ users: [], usersTimestamp: null });
      return null;
    }
    
    return users;
  },
  
  // Obtener productos del caché (si no están vencidos)
  getProducts: () => {
    const { products, productsTimestamp, CACHE_DURATION } = get();
    
    if (!productsTimestamp) return null;
    
    const now = Date.now();
    const isExpired = now - productsTimestamp > CACHE_DURATION;
    
    if (isExpired) {
      set({ products: [], productsTimestamp: null });
      return null;
    }
    
    return products;
  },
  
  // Guardar usuarios en caché
  setUsers: (users) => {
    set({ users, usersTimestamp: Date.now() });
  },
  
  // Guardar productos en caché
  setProducts: (products) => {
    set({ products, productsTimestamp: Date.now() });
  },
  
  // Invalidar caché de usuarios (cuando se crea/edita/elimina)
  invalidateUsers: () => {
    set({ users: [], usersTimestamp: null });
  },
  
  // Invalidar caché de productos
  invalidateProducts: () => {
    set({ products: [], productsTimestamp: null });
  },
  
  // Invalidar todo el caché
  invalidateAll: () => {
    set({ 
      users: [], 
      products: [], 
      usersTimestamp: null, 
      productsTimestamp: null 
    });
  },
}));