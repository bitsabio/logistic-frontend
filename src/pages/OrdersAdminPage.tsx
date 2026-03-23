import { useEffect, useState, useCallback } from 'react'
import {
  Search, Package, AlertCircle, Loader2, ChevronRight,
  Building, User, X, ArrowLeft, MapPin, Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ordersAdminApi, type AdminOrder, type AdminOrderDetail, type OrderStatus } from '@/api/ordersAdmin'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: OrderStatus[] = ['draft', 'confirmed', 'picking', 'shipped', 'delivered', 'cancelled']
const PRIORITIES = ['standard', 'express', 'overnight'] as const

const STATUS_STYLES: Record<OrderStatus, string> = {
  draft:     'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
  confirmed: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  picking:   'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  shipped:   'bg-purple-500/15 text-purple-700 dark:text-purple-400',
  delivered: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  cancelled: 'bg-destructive/10 text-destructive',
}

const PRIORITY_STYLES: Record<string, string> = {
  standard:  'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
  express:   'bg-orange-500/15 text-orange-600',
  overnight: 'bg-rose-500/15 text-rose-600',
}

// Allowed next statuses for each current status
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  draft:     ['confirmed', 'cancelled'],
  confirmed: ['picking',   'cancelled'],
  picking:   ['shipped',   'cancelled'],
  shipped:   ['delivered'],
  delivered: [],
  cancelled: [],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getErrorMessage(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    'Something went wrong.'
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── Order Detail Dialog ──────────────────────────────────────────────────────

interface OrderDetailDialogProps {
  orderId: string | null
  onClose: () => void
  onStatusChanged: (updated: AdminOrderDetail) => void
}

function OrderDetailDialog({ orderId, onClose, onStatusChanged }: OrderDetailDialogProps) {
  const [order, setOrder]         = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [updating, setUpdating]   = useState(false)
  const [updateError, setUpdateError] = useState('')

  useEffect(() => {
    if (!orderId) { setOrder(null); return }
    setLoading(true)
    setError('')
    ordersAdminApi.get(orderId)
      .then(setOrder)
      .catch(() => setError('Failed to load order details.'))
      .finally(() => setLoading(false))
  }, [orderId])

  async function handleStatusChange(toStatus: OrderStatus) {
    if (!order) return
    setUpdateError('')
    setUpdating(true)
    try {
      const updated = await ordersAdminApi.updateStatus(order.id, toStatus)
      setOrder(updated)
      onStatusChanged(updated)
    } catch (err) {
      setUpdateError(getErrorMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  const nextStatuses = order ? NEXT_STATUSES[order.status] : []

  return (
    <Dialog open={!!orderId} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-base flex items-center gap-2">
            {order?.order_number ?? 'Order Detail'}
            {order && (
              <Badge
                variant="secondary"
                className={`capitalize border-0 font-medium text-xs ml-1 ${STATUS_STYLES[order.status]}`}
              >
                {order.status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        ) : order ? (
          <div className="space-y-4 pb-1">

            {/* Customer + meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</p>
                <div className="flex items-center gap-2">
                  {order.customer_type === 'business'
                    ? <Building className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    : <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  }
                  <span className="text-sm font-medium truncate">{order.customer_name}</span>
                </div>
                {order.company_name && (
                  <p className="text-xs text-muted-foreground">{order.company_name}</p>
                )}
                <p className="text-xs text-muted-foreground">{order.customer_email}</p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery</p>
                {order.delivery_line1 ? (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm">{order.delivery_line1}</p>
                      <p className="text-xs text-muted-foreground">
                        {[order.delivery_city, order.delivery_state, order.delivery_postal_code, order.delivery_country]
                          .filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No address on file</p>
                )}
              </div>
            </div>

            {/* Order meta row */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">Priority</p>
                <Badge variant="secondary" className={`capitalize border-0 text-xs font-medium ${PRIORITY_STYLES[order.priority]}`}>
                  {order.priority}
                </Badge>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">Placed</p>
                <p className="text-sm font-medium">{formatDateTime(order.created_at)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">Currency</p>
                <p className="text-sm font-medium">{order.currency}</p>
              </div>
            </div>

            {order.notes && (
              <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{order.notes}</p>
              </div>
            )}

            {/* Line items */}
            <div className="rounded-lg border overflow-hidden">
              <div className="px-4 py-2.5 border-b bg-muted/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Items ({order.items.length})
                </p>
              </div>
              {order.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 ${idx !== 0 ? 'border-t' : ''}`}
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
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (10%)</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2 mt-1">
                <span>Total</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Status transitions */}
            {nextStatuses.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold">Update Status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Move this order to the next stage.
                  </p>
                </div>
                {updateError && (
                  <p className="text-xs text-destructive">{updateError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      disabled={updating}
                      onClick={() => handleStatusChange(s)}
                      className={`capitalize gap-1.5 text-xs ${
                        s === 'cancelled'
                          ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                          : 'hover:border-orange-500/40 hover:text-orange-600'
                      }`}
                    >
                      {updating
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <ChevronRight className="w-3 h-3" />
                      }
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersAdminPage() {
  const [orders, setOrders]       = useState<AdminOrder[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage]           = useState(1)
  const [meta, setMeta]           = useState({ total: 0, pages: 1 })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await ordersAdminApi.list({
        page,
        limit: 20,
        search:  search  || undefined,
        status:  statusFilter || undefined,
      })
      setOrders(res.data)
      setMeta({ total: res.meta.total, pages: res.meta.pages })
    } catch {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [search, statusFilter])
  useEffect(() => { fetchOrders() }, [fetchOrders])

  function handleStatusChanged(updated: AdminOrderDetail) {
    setOrders(prev =>
      prev.map(o => o.id === updated.id
        ? { ...o, status: updated.status, updated_at: updated.updated_at }
        : o
      )
    )
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950/50">

      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta.total > 0
              ? `${meta.total} order${meta.total !== 1 ? 's' : ''} total`
              : 'All customer orders'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-border bg-card flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Order #, customer, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background hover:bg-accent/50 transition-colors focus-visible:bg-background"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === ''
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border/50 uppercase">
                <tr>
                  <th className="px-5 py-4 font-medium tracking-wider">Order</th>
                  <th className="px-5 py-4 font-medium tracking-wider">Customer</th>
                  <th className="px-5 py-4 font-medium tracking-wider">Status</th>
                  <th className="px-5 py-4 font-medium tracking-wider">Priority</th>
                  <th className="px-5 py-4 font-medium tracking-wider text-right">Items</th>
                  <th className="px-5 py-4 font-medium tracking-wider text-right">Total</th>
                  <th className="px-5 py-4 font-medium tracking-wider">Date</th>
                  <th className="px-5 py-4 font-medium tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading orders…</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="w-8 h-8 opacity-30" />
                        <span className="text-sm">
                          {search || statusFilter ? 'No orders match your filters.' : 'No orders yet.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr
                      key={order.id}
                      className="hover:bg-accent/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedId(order.id)}
                    >
                      {/* Order number */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-orange-500" />
                          </div>
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {order.order_number}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-primary">
                              {order.customer_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate max-w-[140px]">
                                {order.customer_name}
                              </p>
                              {order.customer_type === 'business' && order.company_name && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium shrink-0">
                                  {order.company_name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {order.customer_email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <Badge
                          variant="secondary"
                          className={`capitalize border-0 font-medium text-xs ${STATUS_STYLES[order.status]}`}
                        >
                          {order.status}
                        </Badge>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4">
                        <Badge
                          variant="secondary"
                          className={`capitalize border-0 font-medium text-xs ${PRIORITY_STYLES[order.priority]}`}
                        >
                          {order.priority}
                        </Badge>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4 text-right tabular-nums text-muted-foreground text-sm">
                        {order.item_count}
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-foreground tabular-nums">
                          ${order.total_amount.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">{order.currency}</span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-muted-foreground text-sm whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => { e.stopPropagation(); setSelectedId(order.id) }}
                        >
                          View
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.pages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-xs text-muted-foreground">
                Page {page} of {meta.pages} · {meta.total} orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === meta.pages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <OrderDetailDialog
        orderId={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  )
}