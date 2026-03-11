import apiClient from './client'

export interface Permission {
  id: string
  resource: string
  action: string
  description: string | null
}

export interface RoleWithPermissions {
  id: string
  name: string
  description: string | null
  is_system: boolean
  permissions: Permission[]
}

export interface RolesResponse {
  roles: RoleWithPermissions[]
  permissions: Permission[]  // full catalogue of all 23 permissions
}

export const rolesApi = {
  list: async (): Promise<RolesResponse> => {
    const { data } = await apiClient.get<RolesResponse>('/roles')
    return data
  },

  grantPermission: async (roleId: string, permissionId: string): Promise<void> => {
    await apiClient.post(`/roles/${roleId}/permissions/${permissionId}`)
  },

  revokePermission: async (roleId: string, permissionId: string): Promise<void> => {
    await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`)
  },
}