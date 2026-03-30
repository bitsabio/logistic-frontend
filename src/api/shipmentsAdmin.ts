import apiClient from './client'

export type ShipmentStatus = 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned'
export type ShipmentEventType = 'pickup' | 'in_transit' | 'hub_arrival' | 'out_for_delivery' | 'delivered' | 'failed'

export interface ShipmentEvent {
  id: string
  shipment_id: string
  event_type: ShipmentEventType
  location_name: string | null
  notes: string | null
  recorder_name: string | null
  occurred_at: string
}

export interface AdminShipment {
  id: string
  tracking_number: string
  order_id: string
  driver_id: string | null
  vehicle_id: string | null
  route_id: string | null
  status: ShipmentStatus
  estimated_delivery_at: string | null
  actual_delivery_at: string | null
  created_at: string
  updated_at: string
  order_number?: string
  customer_id?: string
  customer_name?: string
  delivery_city?: string
}

export interface ShipmentsMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export const shipmentsAdminApi = {
  list: async (params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<{ data: AdminShipment[]; meta: ShipmentsMeta }> => {
    const { data } = await apiClient.get('/shipments', { params })
    return data
  },

  get: async (id: string): Promise<AdminShipment> => {
    const { data } = await apiClient.get(`/shipments/${id}`)
    return data
  },

  getEvents: async (id: string): Promise<ShipmentEvent[]> => {
    const { data } = await apiClient.get(`/shipments/${id}/events`)
    return data
  },

  updateStatus: async (
    id: string,
    status: ShipmentStatus,
    eventType: ShipmentEventType,
    locationName?: string,
    notes?: string
  ): Promise<AdminShipment> => {
    const { data } = await apiClient.patch(`/shipments/${id}/status`, {
      status,
      eventType,
      locationName,
      notes
    })
    return data
  }
}
