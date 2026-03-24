import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'
import DashboardPage from '@/pages/DashboardPage'
import CustomerLogin from '@/pages/customer/CustomerLogin'
import CustomerRegister from '@/pages/customer/CustomerRegister'
import CustomerDashboard from '@/pages/customer/CustomerDashboard'

/**
 * Handles the root path ("/"):
 * - Staff token present  → /dashboard
 * - Customer token present (but no staff token) → /customer/dashboard
 * - No token → / (LandingPage, portal selector)
 */
function RootRedirect() {
  const staffToken    = localStorage.getItem('access_token')
  const customerToken = localStorage.getItem('customer_access_token')

  if (staffToken)    return <Navigate to="/dashboard"          replace />
  if (customerToken) return <Navigate to="/customer/dashboard" replace />
  return <LandingPage />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root: smart redirect based on token presence */}
          <Route path="/"                   element={<RootRedirect />} />

          {/* Staff auth */}
          <Route path="/login"              element={<LoginPage />} />
          <Route path="/register"           element={<RegisterPage />} />
          <Route path="/verify-email"       element={<VerifyEmailPage />} />

          {/* Customer auth */}
          <Route path="/customer/login"     element={<CustomerLogin />} />
          <Route path="/customer/register"  element={<CustomerRegister />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />

          {/* Protected staff routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}