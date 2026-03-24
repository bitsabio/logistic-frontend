// src/api/customer.ts
import customerClient from './customerClient'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  sku: string
  name: string
  category: string | null
  weight_kg: number | null
  dimensions_cm: { l?: number; w?: number; h?: number } | null
  unit_price: number | null
  in_stock: boolean
  quantity_available: number
}

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  weight_kg: number | null
  dimensions_cm: Record<string, unknown> | null
  status: string
}

export interface CustomerOrder {
  id: string
  order_number: string
  status: 'draft' | 'confirmed' | 'picking' | 'shipped' | 'delivered' | 'cancelled'
  priority: 'standard' | 'express' | 'overnight'
  subtotal: number
  tax_amount: number
  total_amount: number
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
  item_count: number
}

export interface CustomerOrderDetail extends CustomerOrder {
  items: OrderItem[]
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface CustomerProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
  company_name: string | null
  customer_type: 'individual' | 'business'
  status: 'active' | 'suspended' | 'churned'
  created_at: string
  last_login_at: string | null
  mfa_enabled: boolean
}

export interface CustomerAddress {
  customer_address_id: string
  is_default: boolean
  added_at: string
  address_id: string
  label: string | null
  line1: string
  line2: string | null
  city: string
  state: string | null
  postal_code: string | null
  country: string
  is_verified: boolean
}

export interface CreateAddressPayload {
  label?: string
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code?: string
  country: string
  is_default?: boolean
}

export interface UpdateAddressPayload {
  label?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  get: async (): Promise<CustomerProfile> => {
    const { data } = await customerClient.get<CustomerProfile>('/customer/profile')
    return data
  },

  update: async (payload: {
    full_name?: string
    phone?: string
    company_name?: string
  }): Promise<CustomerProfile> => {
    const { data } = await customerClient.patch<CustomerProfile>('/customer/profile', payload)
    return data
  },
}

// ─── Address API ──────────────────────────────────────────────────────────────

export const addressApi = {
  list: async (): Promise<CustomerAddress[]> => {
    const { data } = await customerClient.get<CustomerAddress[]>('/customer/addresses')
    return data
  },

  add: async (payload: CreateAddressPayload): Promise<CustomerAddress> => {
    const { data } = await customerClient.post<CustomerAddress>('/customer/addresses', payload)
    return data
  },

  update: async (id: string, payload: UpdateAddressPayload): Promise<CustomerAddress> => {
    const { data } = await customerClient.patch<CustomerAddress>(`/customer/addresses/${id}`, payload)
    return data
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await customerClient.delete<{ message: string }>(`/customer/addresses/${id}`)
    return data
  },

  setDefault: async (id: string): Promise<CustomerAddress> => {
    const { data } = await customerClient.patch<CustomerAddress>(`/customer/addresses/${id}/default`)
    return data
  },
}

// ─── Orders + Products API ────────────────────────────────────────────────────

export const customerApi = {
  // Products
  getProducts: async (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }): Promise<{ data: Product[]; meta: PageMeta }> => {
    const { data } = await customerClient.get('/customer/products', { params })
    return data
  },

  getCategories: async (): Promise<string[]> => {
    const { data } = await customerClient.get('/customer/products/categories')
    return data
  },

  // Orders
  getOrders: async (params?: {
    page?: number
    limit?: number
  }): Promise<{ data: CustomerOrder[]; meta: PageMeta }> => {
    const { data } = await customerClient.get('/customer/orders', { params })
    return data
  },

  getOrder: async (id: string): Promise<CustomerOrderDetail> => {
    const { data } = await customerClient.get(`/customer/orders/${id}`)
    return data
  },

  placeOrder: async (payload: {
    items: Array<{ product_id: string; quantity: number }>
    notes?: string
    priority?: 'standard' | 'express' | 'overnight'
    delivery_address_id: string
  }): Promise<CustomerOrderDetail> => {
    const { data } = await customerClient.post('/customer/orders', payload)
    return data
  },

  cancelOrder: async (id: string): Promise<{ message: string }> => {
    const { data } = await customerClient.patch(`/customer/orders/${id}/cancel`)
    return data
  },
}

// ADD PRODUCT
;(customerApi as any).createProduct = async (payload: {
  name: string
  sku: string
  unit_cost: number
}) => {
  const res = await apiClient.post('/products', payload)
  return res.data
}

// DELETE PRODUCT
;(customerApi as any).deleteProduct = async (id: string) => {
  const res = await apiClient.delete(`/products/${id}`)
  return res.data
}