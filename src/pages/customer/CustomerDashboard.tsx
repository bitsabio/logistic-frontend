import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingCart, ClipboardList, LogOut, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductsPage from './ProductsPage.tsx'
import CartPage from './CartPage.tsx'
import OrdersPage from './OrdersPage.tsx'
import OrderDetailPage from './OrderDetailPage.tsx'
import type { CartItem, CustomerOrderDetail } from '@/api/customer'

type View =
  | { page: 'products' }
  | { page: 'cart' }
  | { page: 'orders' }
  | { page: 'order-detail'; orderId: string }
  | { page: 'order-success'; order: CustomerOrderDetail }

interface CustomerProfile {
  id: string
  full_name: string
  email: string
  company: string | null
  type: string
}

function getCustomer(): CustomerProfile | null {
  try {
    const raw = localStorage.getItem('customer')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function CustomerDashboard() {
  const navigate      = useNavigate()
  const customer      = getCustomer()
  const [view, setView]           = useState<View>({ page: 'products' })
  const [cart, setCart]           = useState<CartItem[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [ordersKey, setOrdersKey] = useState(0)

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  if (!localStorage.getItem('access_token')) {
    navigate('/customer/login')
    return null
  }

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('customer')
    navigate('/customer/login')
  }

  function handleOrderPlaced(order: CustomerOrderDetail) {
    setCart([])
    setView({ page: 'order-success', order })
  }

  // Fix: explicit string type on orderId parameter
  function handleViewOrder(orderId: string) {
    setView({ page: 'order-detail', orderId })
  }

  const initials = (customer?.full_name ?? customer?.email ?? 'C')[0].toUpperCase()

  const NAV = [
    { key: 'products' as const, label: 'Browse Products', icon: Package },
    { key: 'orders'   as const, label: 'My Orders',       icon: ClipboardList },
  ]

  const activePage =
    view.page === 'cart'         ? 'products'
    : view.page === 'order-detail'  ? 'orders'
    : view.page === 'order-success' ? 'orders'
    : view.page

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`flex flex-col border-r border-border bg-muted/40 transition-all duration-200 shrink-0 ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}>

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
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
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
                Cart {cartCount > 0 && <span className="text-orange-500 font-bold">({cartCount})</span>}
              </span>
            )}
          </button>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-accent/50 mb-1">
              <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-xs font-semibold truncate">{customer?.full_name ?? 'Client'}</span>
                {customer?.company && (
                  <span className="text-[10px] text-muted-foreground truncate">{customer.company}</span>
                )}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            className={`w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${collapsed ? 'h-9' : 'justify-start gap-2'}`}
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
          />
        )}

        {view.page === 'orders' && (
          <OrdersPage
            key={ordersKey}
            onViewOrder={handleViewOrder}
          />
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
    </div>
  )
}