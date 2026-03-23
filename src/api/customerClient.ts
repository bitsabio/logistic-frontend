// src/api/customerClient.ts
//
// Separate Axios instance for all customer portal API calls.
// Reads from customer_access_token — never touches the staff access_token.
// On 401 it redirects to /customer/login, not the staff /login page.

import axios from 'axios'

const customerClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

customerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

customerClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customer_access_token')
      localStorage.removeItem('customer_refresh_token')
      localStorage.removeItem('customer_user')
      window.location.href = '/customer/login'
    }
    return Promise.reject(error)
  }
)

export default customerClient