import apiClient from './client'

export interface UserListItem {
  id: string
  email: string
  full_name: string | null
  status: 'active' | 'suspended' | 'pending_verification' | 'deleted'
  created_at: string
  last_login_at: string | null
  roles: string[]
}

export interface Role {
  id: string
  name: string
  description: string | null
}

export interface UsersMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export const usersApi = {
  list: async (params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ data: UserListItem[]; meta: UsersMeta }> => {
    const { data } = await apiClient.get('/users', { params })
    return data
  },

  get: async (id: string): Promise<UserListItem> => {
    const { data } = await apiClient.get(`/users/${id}`)
    return data
  },

  getRoles: async (): Promise<Role[]> => {
    const { data } = await apiClient.get('/users/roles')
    return data
  },

  assignRoles: async (userId: string, roles: string[]): Promise<{ message: string; user: UserListItem }> => {
    const { data } = await apiClient.put(`/users/${userId}/roles`, { roles })
    return data
  },

  changeStatus: async (userId: string, status: 'active' | 'suspended'): Promise<{ message: string }> => {
    const { data } = await apiClient.patch(`/users/${userId}/status`, { status })
    return data
  },
}