import apiClient from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockLevel {
  inventory_id: string
  product_id: string
  sku: string
  product_name: string
  category: string | null
  warehouse_id: string
  warehouse_name: string
  warehouse_code: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  reorder_point: number
  location_id: string
  location_code: string
}

export interface InventoryTransaction {
  id: string
  product_id: string
  product_name: string
  sku: string
  transaction_type: 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'return'
  quantity: number
  notes: string | null
  performed_by_name: string | null
  created_at: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  total_area_sqm: number | null
  is_active: boolean
  created_at: string
  location_count: number
}

export interface StorageLocation {
  id: string
  zone_id: string
  zone_name: string
  zone_type: string
  location_code: string
  max_weight_kg: number | null
  max_volume_l: number | null
  is_occupied: boolean
}

// ─── Warehouse API ────────────────────────────────────────────────────────────

export const warehouseApi = {
  list: async (): Promise<Warehouse[]> => {
    const { data } = await apiClient.get('/warehouses')
    return data
  },

  create: async (payload: {
    name: string
    code: string
    total_area_sqm?: number
  }): Promise<Warehouse> => {
    const { data } = await apiClient.post('/warehouses', payload)
    return data
  },

  getLocations: async (warehouseId: string): Promise<StorageLocation[]> => {
    const { data } = await apiClient.get(`/warehouses/${warehouseId}/locations`)
    return data
  },

  createLocation: async (
    warehouseId: string,
    payload: {
      location_code: string
      max_weight_kg?: number
      max_volume_l?: number
      zone_type?: string
    }
  ): Promise<StorageLocation> => {
    const { data } = await apiClient.post(`/warehouses/${warehouseId}/locations`, payload)
    return data
  },
}

// ─── Inventory API ────────────────────────────────────────────────────────────

export const inventoryApi = {
  getStock: async (params?: {
    warehouse_id?: string
    product_id?: string
    search?: string
    low_stock_only?: boolean
  }): Promise<StockLevel[]> => {
    const { data } = await apiClient.get('/inventory', { params })
    return data
  },

  addStock: async (payload: {
    product_id: string
    location_id: string
    warehouse_id: string
    quantity: number
    notes?: string
  }): Promise<StockLevel> => {
    const { data } = await apiClient.post('/inventory/inbound', payload)
    return data
  },

  adjustStock: async (payload: {
    inventory_id: string
    adjustment: number
    notes: string
  }): Promise<StockLevel> => {
    const { data } = await apiClient.post('/inventory/adjust', payload)
    return data
  },

  getTransactions: async (params?: {
    product_id?: string
    warehouse_id?: string
    type?: string
    page?: number
    limit?: number
  }): Promise<{ data: InventoryTransaction[]; meta: { page: number; limit: number; total: number; pages: number } }> => {
    const { data } = await apiClient.get('/inventory/transactions', { params })
    return data
  },
}