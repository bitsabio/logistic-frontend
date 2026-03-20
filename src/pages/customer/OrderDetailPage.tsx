import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, AlertCircle, Package, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { customerApi, type CustomerOrderDetail } from '@/api/customer'

interface OrderDetailPageProps {
  orderId: string
  onBack: () => void
  onOrderUpdated: () => void
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
  confirmed: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  picking:   'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  shipped:   'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  delivered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-destructive/10 text-destructive',
}

export default function OrderDetailPage({ orderId, onBack, onOrderUpdated }: OrderDetailPageProps) {
  const [order, setOrder]         = useState<CustomerOrderDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    customerApi.getOrder(orderId)
      .then(setOrder)
      .catch(() => setError('Failed to load order.'))
      .finally(() => setLoading(false))
  }, [orderId])

  async function handleCancel() {
    if (!order) return
    setCancelError('')
    setCancelling(true)
    try {
      await customerApi.cancelOrder(order.id)
      // Re-fetch the updated order
      const updated = await customerApi.getOrder(order.id)
      setOrder(updated)
      onOrderUpdated()
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to cancel order.'
      setCancelError(message)
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = order?.status === 'draft' || order?.status === 'confirmed'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold font-mono">
            {order?.order_number ?? 'Order Detail'}
          </h1>
          {order && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Placed {new Date(order.created_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}
        </div>
        {order && (
          <Badge
            variant="secondary"
            className={`capitalize border-0 font-medium shrink-0 ${STATUS_STYLES[order.status]}`}
          >
            {order.status}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !order ? null : (
            <>
              {/* Order meta */}
              <div className="rounded-xl border bg-card p-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Priority</p>
                  <p className="font-medium capitalize">{order.priority}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Currency</p>
                  <p className="font-medium">{order.currency}</p>
                </div>
                {order.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs mb-0.5">Notes</p>
                    <p className="font-medium">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Line items */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30">
                  <p className="text-sm font-semibold">
                    Items ({order.items.length})
                  </p>
                </div>
                {order.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 px-4 py-3 ${idx !== 0 ? 'border-t border-border' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span>${order.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-border pt-2 mt-1">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Cancel */}
              {canCancel && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Cancel Order</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This order can still be cancelled since it hasn't been processed yet.
                    </p>
                  </div>
                  {cancelError && (
                    <p className="text-xs text-destructive">{cancelError}</p>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={cancelling}
                    onClick={handleCancel}
                    className="gap-1.5"
                  >
                    {cancelling
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Cancelling…</>
                      : <><XCircle className="w-3.5 h-3.5" />Cancel Order</>
                    }
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}