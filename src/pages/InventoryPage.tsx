import { useEffect, useState, useCallback } from 'react'
import { Plus, Minus, Search, AlertCircle, Loader2, ArrowDownToLine, SlidersHorizontal, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { inventoryApi, warehouseApi, type StockLevel, type InventoryTransaction, type Warehouse } from '@/api/inventory'

type Tab = 'stock' | 'transactions'

const TXN_TYPE_STYLES: Record<string, string> = {
  inbound:    'bg-emerald-500/15 text-emerald-700',
  outbound:   'bg-destructive/10 text-destructive',
  adjustment: 'bg-blue-500/15 text-blue-700',
  transfer:   'bg-amber-500/15 text-amber-700',
  return:     'bg-purple-500/15 text-purple-700',
}

export default function InventoryPage() {
  const [tab, setTab]               = useState<Tab>('stock')
  const [stock, setStock]           = useState<StockLevel[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [whFilter, setWhFilter]     = useState('')
  const [lowStock, setLowStock]     = useState(false)

  // Transactions
  const [transactions, setTxns]     = useState<InventoryTransaction[]>([])
  const [txnLoading, setTxnLoading] = useState(false)
  const [txnMeta, setTxnMeta]       = useState({ total: 0, pages: 1 })
  const [txnPage, setTxnPage]       = useState(1)

  // Add Stock dialog
  const [showAdd, setShowAdd]       = useState(false)
  const [addProductId, setAddProductId] = useState('')
  const [addLocId, setAddLocId]     = useState('')
  const [addWhId, setAddWhId]       = useState('')
  const [addQty, setAddQty]         = useState('')
  const [addNotes, setAddNotes]     = useState('')
  const [addSaving, setAddSaving]   = useState(false)
  const [addError, setAddError]     = useState('')
  const [locOptions, setLocOptions] = useState<{ id: string; label: string }[]>([])

  // Adjust dialog
  const [showAdj, setShowAdj]       = useState(false)
  const [adjItem, setAdjItem]       = useState<StockLevel | null>(null)
  const [adjDelta, setAdjDelta]     = useState('')
  const [adjNotes, setAdjNotes]     = useState('')
  const [adjSaving, setAdjSaving]   = useState(false)
  const [adjError, setAdjError]     = useState('')

  useEffect(() => {
    warehouseApi.list().then(setWarehouses).catch(() => {})
  }, [])

  const fetchStock = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await inventoryApi.getStock({
        warehouse_id:   whFilter || undefined,
        search:         search   || undefined,
        low_stock_only: lowStock || undefined,
      })
      setStock(data)
    } catch { setError('Failed to load stock levels.') }
    finally { setLoading(false) }
  }, [whFilter, search, lowStock])

  useEffect(() => { fetchStock() }, [fetchStock])

  const fetchTxns = useCallback(async () => {
    setTxnLoading(true)
    try {
      const res = await inventoryApi.getTransactions({ page: txnPage, limit: 25 })
      setTxns(res.data)
      setTxnMeta({ total: res.meta.total, pages: res.meta.pages })
    } catch { /* ignore */ }
    finally { setTxnLoading(false) }
  }, [txnPage])

  useEffect(() => { if (tab === 'transactions') fetchTxns() }, [tab, fetchTxns])

  // When warehouse changes in Add dialog, load its locations
  async function handleAddWhChange(whId: string) {
    setAddWhId(whId); setAddLocId('')
    if (!whId) { setLocOptions([]); return }
    try {
      const locs = await warehouseApi.getLocations(whId)
      setLocOptions(locs.map(l => ({ id: l.id, label: `${l.location_code} (${l.zone_type})` })))
    } catch { setLocOptions([]) }
  }

  async function handleAddStock() {
    setAddError('')
    if (!addProductId.trim()) { setAddError('Product ID is required.'); return }
    if (!addWhId)             { setAddError('Select a warehouse.'); return }
    if (!addLocId)            { setAddError('Select a storage location.'); return }
    const qty = parseInt(addQty)
    if (!qty || qty < 1)      { setAddError('Quantity must be a positive integer.'); return }
    setAddSaving(true)
    try {
      const updated = await inventoryApi.addStock({
        product_id:   addProductId.trim(),
        location_id:  addLocId,
        warehouse_id: addWhId,
        quantity:     qty,
        notes:        addNotes || undefined,
      })
      setStock(prev => {
        const existing = prev.findIndex(s => s.inventory_id === updated.inventory_id)
        if (existing >= 0) {
          const copy = [...prev]; copy[existing] = updated; return copy
        }
        return [...prev, updated]
      })
      setShowAdd(false)
      setAddProductId(''); setAddLocId(''); setAddWhId(''); setAddQty(''); setAddNotes('')
    } catch (err: unknown) {
      setAddError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to add stock.')
    } finally { setAddSaving(false) }
  }

  async function handleAdjust() {
    if (!adjItem) return
    setAdjError('')
    const delta = parseInt(adjDelta)
    if (isNaN(delta) || delta === 0) { setAdjError('Enter a non-zero integer.'); return }
    if (!adjNotes.trim())            { setAdjError('Notes are required.'); return }
    setAdjSaving(true)
    try {
      const updated = await inventoryApi.adjustStock({
        inventory_id: adjItem.inventory_id,
        adjustment:   delta,
        notes:        adjNotes,
      })
      setStock(prev => prev.map(s => s.inventory_id === updated.inventory_id ? updated : s))
      setShowAdj(false); setAdjDelta(''); setAdjNotes(''); setAdjItem(null)
    } catch (err: unknown) {
      setAdjError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to adjust stock.')
    } finally { setAdjSaving(false) }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{stock.length} stock records</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <ArrowDownToLine className="w-4 h-4" /> Add Stock
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b border-border">
        {(['stock', 'transactions'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t ? 'border-b-2 border-orange-500 text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'stock' ? <SlidersHorizontal className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
            {t === 'stock' ? 'Stock Levels' : 'Transactions'}
          </button>
        ))}
      </div>

      {/* Stock Tab */}
      {tab === 'stock' && (
        <div className="flex-1 overflow-auto p-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search product or SKU…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select
              value={whFilter}
              onChange={e => setWhFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
            </select>
            <button
              onClick={() => setLowStock(v => !v)}
              className={`h-10 px-3 rounded-md text-sm font-medium border transition-colors ${
                lowStock ? 'bg-amber-500/10 border-amber-500/30 text-amber-700' : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Low Stock Only
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : stock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <SlidersHorizontal className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">No stock records</p>
              <p className="text-xs text-muted-foreground">Use Add Stock to record your first inbound shipment.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    {['Product', 'SKU', 'Warehouse / Location', 'On Hand', 'Reserved', 'Available', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {stock.map(row => (
                    <tr key={row.inventory_id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{row.product_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.sku}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{row.warehouse_name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{row.location_code}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">{row.quantity_on_hand}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.quantity_reserved}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${row.quantity_available <= row.reorder_point ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {row.quantity_available}
                        </span>
                        {row.quantity_available <= row.reorder_point && (
                          <Badge variant="secondary" className="ml-2 text-[9px] bg-amber-500/15 text-amber-700 border-0">Low</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => { setAdjItem(row); setShowAdj(true) }}
                        >
                          <SlidersHorizontal className="w-3 h-3" /> Adjust
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {tab === 'transactions' && (
        <div className="flex-1 overflow-auto p-6">
          {txnLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <History className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">No transactions yet</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      {['Product', 'SKU', 'Type', 'Qty', 'Notes', 'By', 'Date'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {transactions.map(txn => (
                      <tr key={txn.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium max-w-[160px] truncate">{txn.product_name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{txn.sku}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={`capitalize text-[10px] border-0 ${TXN_TYPE_STYLES[txn.transaction_type] ?? ''}`}>
                            {txn.transaction_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-semibold">{txn.quantity}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[180px] truncate">{txn.notes ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{txn.performed_by_name ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(txn.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {txnMeta.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={txnPage === 1} onClick={() => setTxnPage(p => p - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">{txnPage} / {txnMeta.pages}</span>
                  <Button variant="outline" size="sm" disabled={txnPage === txnMeta.pages} onClick={() => setTxnPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Stock Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stock (Inbound)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            <div className="space-y-1.5">
              <Label>Product ID <span className="text-xs text-muted-foreground font-normal">(UUID from products table)</span></Label>
              <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={addProductId} onChange={e => setAddProductId(e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label>Warehouse</Label>
              <select value={addWhId} onChange={e => handleAddWhChange(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select warehouse…</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Storage Location</Label>
              <select value={addLocId} onChange={e => setAddLocId(e.target.value)} disabled={!addWhId || locOptions.length === 0} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50">
                <option value="">Select location…</option>
                {locOptions.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
              {addWhId && locOptions.length === 0 && (
                <p className="text-xs text-amber-600">No locations in this warehouse yet. Add one from the Warehouses page.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min="1" placeholder="100" value={addQty} onChange={e => setAddQty(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input placeholder="PO-2024-001 receipt" value={addNotes} onChange={e => setAddNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button disabled={addSaving} onClick={handleAddStock} className="bg-orange-500 hover:bg-orange-600 text-white">
              {addSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : 'Add Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdj} onOpenChange={v => { setShowAdj(v); if (!v) { setAdjDelta(''); setAdjNotes(''); setAdjError('') } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stock</DialogTitle></DialogHeader>
          {adjItem && (
            <div className="space-y-4 py-1">
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm space-y-1">
                <p className="font-semibold">{adjItem.product_name}</p>
                <p className="text-muted-foreground font-mono text-xs">{adjItem.sku} · {adjItem.location_code}</p>
                <p className="text-muted-foreground">Current stock: <span className="font-semibold text-foreground">{adjItem.quantity_on_hand}</span></p>
              </div>
              {adjError && <p className="text-sm text-destructive">{adjError}</p>}
              <div className="space-y-1.5">
                <Label>Adjustment</Label>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setAdjDelta(v => v.startsWith('-') ? v.slice(1) : '-' + v)} className="w-9 h-9 rounded-md border border-border flex items-center justify-center hover:bg-muted">
                    {adjDelta.startsWith('-') ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </button>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={adjDelta}
                    onChange={e => setAdjDelta(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Positive = add stock. Negative = remove stock. New total:{' '}
                  <span className="font-semibold text-foreground">
                    {adjDelta && !isNaN(parseInt(adjDelta))
                      ? Math.max(0, adjItem.quantity_on_hand + parseInt(adjDelta))
                      : adjItem.quantity_on_hand}
                  </span>
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Reason / Notes <span className="text-destructive">*</span></Label>
                <Input placeholder="Damaged goods write-off, cycle count correction…" value={adjNotes} onChange={e => setAdjNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdj(false)}>Cancel</Button>
            <Button disabled={adjSaving} onClick={handleAdjust} className="bg-orange-500 hover:bg-orange-600 text-white">
              {adjSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}