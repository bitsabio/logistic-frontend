import axios from 'axios'

const apiClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
//  DEBUG LOG (ADD THIS)
apiClient.interceptors.request.use((config) => {
  console.log("API REQUEST:", config.method?.toUpperCase(), config.url)
  console.log("TOKEN:", localStorage.getItem('access_token'))
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
// DEBUG RESPONSE (ADD THIS)
apiClient.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", response.config.url, response.data)
    return response
  },
  (error) => {
    console.error("API ERROR:", error?.response?.data || error.message)
    return Promise.reject(error)
  }
)
export default apiClient