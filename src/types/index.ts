export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'supervisor' | 'cajero';
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  type: 'bano' | 'ducha' | 'locker';
  active: boolean;
  created_at: string;
}

export interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  initial_cash: number;
  status: 'open' | 'closed';
  users?: User;
}

export interface Transaction {
  id: string;
  shift_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: 'card' | 'transfer' | 'cash';
  payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  created_by: string;
  products?: Product;
}