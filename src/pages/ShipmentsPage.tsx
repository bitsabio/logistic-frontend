import { useState, useEffect, useCallback } from 'react'
import { shipmentsAdminApi, type AdminShipment, type ShipmentStatus, type ShipmentEventType } from '@/api/shipmentsAdmin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Loader2, PackageOpen, Truck, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const map: Record<ShipmentStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    in_transit: 'bg-sky-100 text-sky-700 border-sky-200',
    out_for_delivery: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    returned: 'bg-slate-100 text-slate-700 border-slate-200',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border', map[status])}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

function UpdateModal({
  shipment,
  open,
  onClose,
  onSave,
}: {
  shipment: AdminShipment
  open: boolean
  onClose: () => void
  onSave: (id: string, s: ShipmentStatus, e: ShipmentEventType, loc: string, n: string) => Promise<void>
}) {
  const [status, setStatus] = useState<ShipmentStatus>(shipment.status)
  const [eventType, setEventType] = useState<ShipmentEventType>('in_transit')
  const [locationName, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(shipment.id, status, eventType, locationName, notes)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to update shipment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md backdrop-blur-md bg-white/80 border border-white/40 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            Update Shipment
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-primary">{shipment.tracking_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">New Status</label>
            <select
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={status}
              onChange={e => setStatus(e.target.value as ShipmentStatus)}
            >
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Event Type</label>
            <select
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={eventType}
              onChange={e => setEventType(e.target.value as ShipmentEventType)}
            >
              <option value="pickup">Pickup</option>
              <option value="in_transit">In Transit</option>
              <option value="hub_arrival">Hub Arrival</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Location Name</label>
            <Input value={locationName} onChange={e => setLocation(e.target.value)} placeholder="e.g. Sort Facility NYC" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Scanned at gate" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<AdminShipment[]>([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [modalShipment, setModalShipment] = useState<AdminShipment | null>(null)

  const fetchShipments = useCallback(async (page = 1, q = search) => {
    setLoading(true)
    setError(null)
    try {
      const res = await shipmentsAdminApi.list({ page, limit: 20, search: q || undefined })
      setShipments(res.data)
      setMeta(res.meta)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchShipments(1, '')
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchShipments(1, search), 350)
    return () => clearTimeout(t)
  }, [search])

  const handleUpdateSave = async (id: string, st: ShipmentStatus, ev: ShipmentEventType, loc: string, n: string) => {
    await shipmentsAdminApi.updateStatus(id, st, ev, loc, n)
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status: st } : s))
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-mono">
          {meta.total} tracked shipments
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by tracking / order / customer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading shipments...
          </div>
        )}
        {!loading && error && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            {error}
          </div>
        )}

        {!loading && !error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-16 text-sm">
                    No shipments found
                  </TableCell>
                </TableRow>
              )}
              {shipments.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs font-semibold text-primary">{s.tracking_number}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-sm">
                    {s.customer_name ?? '—'}
                    <div className="text-xs text-muted-foreground">{s.delivery_city}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.order_number}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setModalShipment(s)}>
                      Update Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && !error && meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono">
              Page {meta.page} of {meta.pages}
            </p>
            <div className="flex gap-2">
              <Button disabled={meta.page <= 1} onClick={() => fetchShipments(meta.page - 1)} variant="outline" size="sm">Prev</Button>
              <Button disabled={meta.page >= meta.pages} onClick={() => fetchShipments(meta.page + 1)} variant="outline" size="sm">Next</Button>
            </div>
          </div>
        )}
      </div>

      {modalShipment && (
        <UpdateModal
          shipment={modalShipment}
          open={!!modalShipment}
          onClose={() => setModalShipment(null)}
          onSave={handleUpdateSave}
        />
      )}
    </div>
  )
}
