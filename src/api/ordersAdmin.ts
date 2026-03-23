import apiClient from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus   = 'draft' | 'confirmed' | 'picking' | 'shipped' | 'delivered' | 'cancelled'
export type OrderPriority = 'standard' | 'express' | 'overnight'

export interface AdminOrder {
  id: string
  order_number: string
  status: OrderStatus
  priority: OrderPriority
  subtotal: number
  tax_amount: number
  total_amount: number
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
  item_count: number
  customer_id: string
  customer_name: string
  customer_email: string
  company_name: string | null
  customer_type: 'individual' | 'business'
  delivery_city: string | null
  delivery_country: string | null
}

export interface AdminOrderItem {
  id: string
  product_id: string
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  weight_kg: number | null
  status: string
}

export interface AdminOrderDetail extends AdminOrder {
  items: AdminOrderItem[]
  delivery_line1: string | null
  delivery_state: string | null
  delivery_postal_code: string | null
}

export interface OrdersMeta {
  page: number
  limit: number
  total: number
  pages: number
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const ordersAdminApi = {
  list: async (params?: {
    page?:     number
    limit?:    number
    search?:   string
    status?:   string
    priority?: string
  }): Promise<{ data: AdminOrder[]; meta: OrdersMeta }> => {
    const { data } = await apiClient.get('/orders', { params })
    return data
  },

  get: async (id: string): Promise<AdminOrderDetail> => {
    const { data } = await apiClient.get(`/orders/${id}`)
    return data
  },

  updateStatus: async (
    id: string,
    status: string,
    reason?: string
  ): Promise<AdminOrderDetail> => {
    const { data } = await apiClient.patch(`/orders/${id}/status`, { status, reason })
    return data
  },
}