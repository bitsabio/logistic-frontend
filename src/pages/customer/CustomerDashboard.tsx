// src/pages/customer/CustomerDashboard.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, ShoppingCart, ClipboardList, LogOut,
  ChevronLeft, ChevronRight, CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductsPage from './ProductsPage'
import CartPage from './CartPage'
import OrdersPage from './OrdersPage'
import OrderDetailPage from './OrderDetailPage'
import CustomerProfileModal from './CustomerProfileModal'
import ShipmentsPage from './ShipmentsPage'
import { Truck } from 'lucide-react'
import type { CartItem, CustomerOrderDetail } from '@/api/customer'

type View =
  | { page: 'products' }
  | { page: 'cart' }
  | { page: 'orders' }
  | { page: 'order-detail'; orderId: string }
  | { page: 'order-success'; order: CustomerOrderDetail }
  | { page: 'shipments' }

interface CustomerProfile {
  id: string
  full_name: string
  email: string
  company: string | null
  type: string
}

// ── Read customer profile from the CUSTOMER-specific localStorage key ─────────
function getCustomer(): CustomerProfile | null {
  try {
    const raw = localStorage.getItem('customer_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function CustomerDashboard() {
  const navigate = useNavigate()

  const [customer,     setCustomer]     = useState<CustomerProfile | null>(getCustomer)
  const [view,         setView]         = useState<View>({ page: 'products' })
  const [cart,         setCart]         = useState<CartItem[]>([])
  const [collapsed,    setCollapsed]    = useState(false)
  const [ordersKey,    setOrdersKey]    = useState(0)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [authChecked,  setAuthChecked]  = useState(false)

  // ── Auth guard ─────────────────────────────────────────────────────────────
  // Runs once after mount (not during render) to avoid the flash-then-redirect
  // pattern. Checks the CUSTOMER-specific token, not the shared staff token.
  useEffect(() => {
    const token = localStorage.getItem('customer_access_token')
    if (!token) {
      navigate('/customer/login', { replace: true })
    } else {
      setAuthChecked(true)
    }
  }, [navigate])

  if (!authChecked) return null

  // ── Handlers ───────────────────────────────────────────────────────────────

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  function handleLogout() {
    // Clear CUSTOMER-specific keys only — staff session is untouched
    localStorage.removeItem('customer_access_token')
    localStorage.removeItem('customer_refresh_token')
    localStorage.removeItem('customer_user')
    navigate('/customer/login')
  }

  function handleOrderPlaced(order: CustomerOrderDetail) {
    setCart([])
    setView({ page: 'order-success', order })
  }

  function handleViewOrder(orderId: string) {
    setView({ page: 'order-detail', orderId })
  }

  /** Called by the profile modal after a successful save */
  function handleProfileUpdated(updated: { full_name: string; company_name: string | null }) {
    const next: CustomerProfile = {
      ...(customer ?? { id: '', email: '', type: 'individual' }),
      full_name: updated.full_name,
      company:   updated.company_name,
    }
    setCustomer(next)
    // Persist to the CUSTOMER-specific key
    localStorage.setItem('customer_user', JSON.stringify(next))
  }

  const initials = (customer?.full_name ?? 'C')[0].toUpperCase()

  const activePage =
    view.page === 'cart'
      ? 'products'
      : view.page === 'order-detail' || view.page === 'order-success'
      ? 'orders'
      : view.page

  const NAV = [
    { key: 'products'  as const, label: 'Browse Products', icon: Package },
    { key: 'orders'    as const, label: 'My Orders',       icon: ClipboardList },
    { key: 'shipments' as const, label: 'Track Shipments', icon: Truck },
  ]

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col border-r border-border bg-muted/40 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-[60px]' : 'w-[220px]'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-border min-h-[60px]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">
                Logi<span className="text-orange-500">X</span>
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 ml-auto"
            onClick={() => setCollapsed(v => !v)}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />
            }
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1 p-2 pt-3">
          {NAV.map(item => {
            const isActive = activePage === item.key
            const Icon = item.icon
            return (
              <button
                key={item.key}
                onClick={() => setView({ page: item.key })}
                title={collapsed ? item.label : undefined}
                style={isActive ? { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' } : {}}
                className={[
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
                  collapsed ? 'justify-center' : '',
                  isActive ? '' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                ].join(' ')}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}

          {/* Cart */}
          <button
            onClick={() => setView({ page: 'cart' })}
            title={collapsed ? 'Cart' : undefined}
            style={view.page === 'cart' ? { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' } : {}}
            className={[
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
              collapsed ? 'justify-center' : '',
              view.page === 'cart' ? '' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            ].join(' ')}
          >
            <div className="relative shrink-0">
              <ShoppingCart className={`w-4 h-4 ${view.page === 'cart' ? 'text-primary' : ''}`} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            {!collapsed && (
              <span className="flex-1">
                Cart{cartCount > 0 && <span className="text-orange-500 font-bold ml-1">({cartCount})</span>}
              </span>
            )}
          </button>
        </nav>

        {/* Footer — profile + logout */}
        <div className="border-t border-border p-2 space-y-1">
          {!collapsed ? (
            <button
              onClick={() => setProfileOpen(true)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md bg-accent/50 hover:bg-accent transition-colors group mb-1"
            >
              <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden min-w-0 flex-1 text-left">
                <span className="text-xs font-semibold truncate">{customer?.full_name ?? 'Client'}</span>
                {customer?.company && (
                  <span className="text-[10px] text-muted-foreground truncate">{customer.company}</span>
                )}
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => setProfileOpen(true)}
              title="Profile"
              className="w-full flex items-center justify-center py-2 rounded-md hover:bg-accent transition-colors mb-1"
            >
              <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            </button>
          )}

          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            className={`w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
              collapsed ? 'h-9' : 'justify-start gap-2'
            }`}
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {view.page === 'products' && (
          <ProductsPage
            cart={cart}
            onCartChange={setCart}
            onGoToCart={() => setView({ page: 'cart' })}
          />
        )}

        {view.page === 'cart' && (
          <CartPage
            cart={cart}
            onCartChange={setCart}
            onBack={() => setView({ page: 'products' })}
            onOrderPlaced={handleOrderPlaced}
            onOpenProfile={() => setProfileOpen(true)}
          />
        )}

        {view.page === 'orders' && (
          <OrdersPage
            key={ordersKey}
            onViewOrder={handleViewOrder}
          />
        )}

        {view.page === 'shipments' && (
          <ShipmentsPage />
        )}

        {view.page === 'order-detail' && (
          <OrderDetailPage
            orderId={view.orderId}
            onBack={() => setView({ page: 'orders' })}
            onOrderUpdated={() => setOrdersKey(k => k + 1)}
          />
        )}

        {view.page === 'order-success' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <p className="text-xl font-semibold">Order Placed!</p>
              <p className="font-mono text-orange-500 font-medium">{view.order.order_number}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Your order has been submitted as a draft. Our team will review and confirm it shortly.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setOrdersKey(k => k + 1)
                  setView({ page: 'order-detail', orderId: view.order.id })
                }}
              >
                View Order
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setView({ page: 'products' })}
              >
                <Package className="w-4 h-4 mr-1.5" />
                Keep Shopping
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ── Profile Modal ── */}
      <CustomerProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  )
}