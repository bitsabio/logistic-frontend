import apiClient from './client'

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

// ─── API calls ────────────────────────────────────────────────────────────────

export const customerApi = {
  // Products
  getProducts: async (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
  }): Promise<{ data: Product[]; meta: PageMeta }> => {
    const { data } = await apiClient.get('/customer/products', { params })
    return data
  },

  getCategories: async (): Promise<string[]> => {
    const { data } = await apiClient.get('/customer/products/categories')
    return data
  },

  // Orders
  getOrders: async (params?: {
    page?: number
    limit?: number
  }): Promise<{ data: CustomerOrder[]; meta: PageMeta }> => {
    const { data } = await apiClient.get('/customer/orders', { params })
    return data
  },

  getOrder: async (id: string): Promise<CustomerOrderDetail> => {
    const { data } = await apiClient.get(`/customer/orders/${id}`)
    return data
  },

  placeOrder: async (payload: {
    items: Array<{ product_id: string; quantity: number }>
    notes?: string
    priority?: 'standard' | 'express' | 'overnight'
  }): Promise<CustomerOrderDetail> => {
    const { data } = await apiClient.post('/customer/orders', payload)
    return data
  },

  cancelOrder: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.patch(`/customer/orders/${id}/cancel`)
    return data
  },
}