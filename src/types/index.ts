export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'supervisor' | 'cajero';
  active: boolean;
  created_at: string;
  deleted_at?: string | null;
}

export interface ServiceType {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  icon?: string;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  service_type_id: string;
  service_types?: {
    id: string;
    name: string;
    icon?: string;
  };
  category_id: string;
  categories?: {
    id: string;
    name: string;
  };
  active: boolean;
  created_at: string;
  business_id: string;
  deleted_at?: string | null;
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