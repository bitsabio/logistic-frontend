// src/pages/customer/CustomerDashboard.tsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Truck, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CustomerProfile {
  id: string
  full_name: string
  email: string
  company: string | null
  type: string
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/customer/login')
      return
    }
    const stored = localStorage.getItem('customer')
    if (stored) setCustomer(JSON.parse(stored))
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('customer')
    navigate('/customer/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">LogiX</span>
          <span className="text-muted-foreground text-sm ml-1">/ Client Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{customer?.full_name ?? 'Client'}</span>
            {customer?.company && (
              <span className="text-xs bg-muted rounded px-1.5 py-0.5">
                {customer.company}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back{customer?.full_name ? `, ${customer.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your client dashboard is being set up. More features coming soon.
          </p>
        </div>

        {/* Placeholder cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <Package className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground">My Orders</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                View and track your active orders
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <Truck className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="font-semibold text-foreground">My Shipments</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track real-time delivery status
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}