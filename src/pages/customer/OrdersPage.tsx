import { useEffect, useState } from 'react'
import { ChevronRight, Package, AlertCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { customerApi, type CustomerOrder } from '@/api/customer'

interface OrdersPageProps {
  onViewOrder: (orderId: string) => void
}

const STATUS_STYLES: Record<CustomerOrder['status'], string> = {
  draft:     'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
  confirmed: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  picking:   'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  shipped:   'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  delivered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-destructive/10 text-destructive',
}

export default function OrdersPage({ onViewOrder }: OrdersPageProps) {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1 })

  useEffect(() => {
    setLoading(true)
    setError('')
    customerApi.getOrders({ page, limit: 10 })
      .then(res => {
        setOrders(res.data)
        setMeta({ total: res.meta.total, pages: res.meta.pages })
      })
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-border bg-card">
        <h1 className="text-xl font-semibold">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {meta.total > 0 ? `${meta.total} order${meta.total !== 1 ? 's' : ''} total` : 'Your order history'}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Package className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">No orders yet</p>
              <p className="text-xs text-muted-foreground">Orders you place will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => onViewOrder(order.id)}
                  className="w-full rounded-xl border bg-card p-4 text-left hover:shadow-sm hover:border-orange-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground font-mono">
                          {order.order_number}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.item_count} item{order.item_count !== 1 ? 's' : ''} ·{' '}
                          {new Date(order.created_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-sm">${order.total_amount.toFixed(2)}</p>
                        <Badge
                          variant="secondary"
                          className={`capitalize text-[10px] border-0 font-medium mt-0.5 ${STATUS_STYLES[order.status]}`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                    </div>
                  </div>
                </button>
              ))}

              {meta.pages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {page} / {meta.pages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page === meta.pages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}