import { useState, useEffect } from 'react'
import { ArrowLeft, Trash2, Loader2, ShoppingCart, AlertCircle, MapPin, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { customerApi, addressApi, type CartItem, type CustomerOrderDetail, type CustomerAddress } from '@/api/customer'
import { cn } from '@/lib/utils'

interface CartPageProps {
  cart: CartItem[]
  onCartChange: (cart: CartItem[]) => void
  onBack: () => void
  onOrderPlaced: (order: CustomerOrderDetail) => void
  onOpenProfile: () => void
}

const PRIORITY_OPTIONS = [
  { value: 'standard',  label: 'Standard',  desc: '3–5 business days' },
  { value: 'express',   label: 'Express',   desc: '1–2 business days' },
  { value: 'overnight', label: 'Overnight', desc: 'Next business day'  },
] as const

export default function CartPage({ cart, onCartChange, onBack, onOrderPlaced, onOpenProfile }: CartPageProps) {
  const [notes,    setNotes]    = useState('')
  const [priority, setPriority] = useState<'standard' | 'express' | 'overnight'>('standard')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Address state
  const [addresses,          setAddresses]          = useState<CustomerAddress[]>([])
  const [addrLoading,        setAddrLoading]        = useState(true)
  const [selectedAddressId,  setSelectedAddressId]  = useState<string>('')
  const [addrDropdownOpen,   setAddrDropdownOpen]   = useState(false)

  // Load addresses on mount
  useEffect(() => {
    addressApi.list()
      .then(list => {
        setAddresses(list)
        // Pre-select default
        const def = list.find(a => a.is_default) ?? list[0]
        if (def) setSelectedAddressId(def.customer_address_id)
      })
      .catch(() => {/* non-fatal */})
      .finally(() => setAddrLoading(false))
  }, [])

  function removeItem(productId: string) {
    onCartChange(cart.filter(i => i.product.id !== productId))
  }

  function adjustQty(productId: string, qty: number) {
    if (qty < 1) { removeItem(productId); return }
    onCartChange(cart.map(i => i.product.id === productId ? { ...i, quantity: qty } : i))
  }

  const subtotal    = cart.reduce((sum, i) => sum + (i.product.unit_price ?? 0) * i.quantity, 0)
  const taxAmount   = Math.round(subtotal * 0.1 * 100) / 100
  const totalAmount = subtotal + taxAmount

  const selectedAddress = addresses.find(a => a.customer_address_id === selectedAddressId)

  async function handlePlaceOrder() {
    setError('')

    if (!selectedAddressId) {
      setError('Please select a delivery address before placing your order.')
      return
    }

    setLoading(true)
    try {
      const order = await customerApi.placeOrder({
        items:               cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        notes:               notes.trim() || undefined,
        priority,
        delivery_address_id: selectedAddressId,
      })
      onOrderPlaced(order)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to place order. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-5 border-b border-border bg-card flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Your Cart</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">Your cart is empty</p>
          <Button variant="outline" size="sm" onClick={onBack}>Browse Products</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">Your Cart</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Items ── */}
          <div className="rounded-xl border bg-card overflow-hidden">
            {cart.map((item, idx) => (
              <div
                key={item.product.id}
                className={`flex items-center gap-4 p-4 ${idx !== 0 ? 'border-t border-border' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.product.sku}</p>
                  {item.product.unit_price != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ${item.product.unit_price.toFixed(2)} each
                    </p>
                  )}
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => adjustQty(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted text-sm font-medium"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => adjustQty(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.quantity_available}
                    className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted text-sm font-medium disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                {item.product.unit_price != null && (
                  <p className="w-20 text-right font-semibold text-sm shrink-0">
                    ${(item.product.unit_price * item.quantity).toFixed(2)}
                  </p>
                )}

                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* ── Delivery Address ── */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                Delivery Address
                <span className="text-destructive text-xs font-normal">required</span>
              </p>
              <button
                onClick={onOpenProfile}
                className="text-xs text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Manage
              </button>
            </div>

            {addrLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading addresses…
              </div>
            ) : addresses.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  You haven't saved any delivery addresses yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenProfile}
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Address in Profile
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* Dropdown trigger */}
                <button
                  type="button"
                  onClick={() => setAddrDropdownOpen(v => !v)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    addrDropdownOpen
                      ? 'border-orange-500/50 bg-orange-500/5'
                      : 'border-border hover:border-orange-500/30 hover:bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    selectedAddress ? 'bg-orange-500/15' : 'bg-gray-100'
                  )}>
                    <MapPin className={cn(
                      'w-3.5 h-3.5',
                      selectedAddress ? 'text-orange-500' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {selectedAddress ? (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {selectedAddress.label ?? selectedAddress.line1}
                          </p>
                          {selectedAddress.is_default && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] border-0 bg-orange-500/15 text-orange-600 dark:text-orange-400 py-0 shrink-0"
                            >
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {selectedAddress.line1}, {selectedAddress.city}
                          {selectedAddress.state ? `, ${selectedAddress.state}` : ''}
                          {' · '}{selectedAddress.country}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a delivery address</p>
                    )}
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-muted-foreground shrink-0 transition-transform',
                    addrDropdownOpen ? 'rotate-180' : ''
                  )} />
                </button>

                {/* Dropdown list */}
                {addrDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                    {addresses.map(addr => (
                      <button
                        key={addr.customer_address_id}
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(addr.customer_address_id)
                          setAddrDropdownOpen(false)
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-0',
                          addr.customer_address_id === selectedAddressId
                            ? 'bg-orange-50'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <div className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center shrink-0',
                          addr.customer_address_id === selectedAddressId
                            ? 'bg-orange-500/20'
                            : 'bg-gray-100'
                        )}>
                          <MapPin className={cn(
                            'w-3 h-3',
                            addr.customer_address_id === selectedAddressId
                              ? 'text-orange-500'
                              : 'text-muted-foreground'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {addr.label ?? addr.line1}
                            </p>
                            {addr.is_default && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] border-0 bg-orange-500/15 text-orange-600 dark:text-orange-400 py-0 shrink-0"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {addr.line1}, {addr.city}
                            {addr.state ? `, ${addr.state}` : ''}
                            {' · '}{addr.country}
                          </p>
                        </div>
                        {addr.customer_address_id === selectedAddressId && (
                          <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setAddrDropdownOpen(false); onOpenProfile() }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-orange-500 hover:bg-orange-50 transition-colors border-t border-gray-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add a new address
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Priority ── */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold">Delivery Priority</p>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPriority(opt.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    priority === opt.value
                      ? 'border-orange-500 bg-orange-500/5'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <p className={`text-sm font-medium ${priority === opt.value ? 'text-orange-600' : 'text-foreground'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <label className="text-sm font-semibold">
              Order Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special instructions for this order..."
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* ── Summary ── */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="text-sm font-semibold mb-3">Order Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            {selectedAddress && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivering to</span>
                <span className="text-right max-w-[60%] truncate text-xs text-muted-foreground">
                  {selectedAddress.label
                    ? `${selectedAddress.label} — ${selectedAddress.city}`
                    : `${selectedAddress.line1}, ${selectedAddress.city}`
                  }
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-border pt-2 mt-2">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Order placed as <Badge variant="secondary" className="text-[10px] py-0">draft</Badge> — your team will confirm it shortly.
            </p>
          </div>

          <Button
            onClick={handlePlaceOrder}
            disabled={loading || !selectedAddressId || addresses.length === 0}
            className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base disabled:bg-orange-500/50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Placing Order…</>
              : !selectedAddressId
                ? 'Select a delivery address to continue'
                : 'Place Order'
            }
          </Button>
        </div>
      </div>
    </div>
  )
}