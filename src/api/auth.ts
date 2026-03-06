import apiClient from './client'
import type { LoginRequest, LoginResponse } from '@/types/auth'

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<any>('/auth/login', credentials)

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: {
        id: data.user.id,
        name: data.user.full_name,
        email: data.user.email,
        roles: data.user.roles.map((r: { name: string }) => r.name),
      },
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    const { data } = await apiClient.post<{ access_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return data
  },
}