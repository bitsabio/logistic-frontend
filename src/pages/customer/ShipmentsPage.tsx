import { useState, useEffect } from 'react'
import { customerApi, type CustomerShipment, type CustomerShipmentDetail } from '@/api/customer'
import { Loader2, Truck, PackageCheck, AlertTriangle, Search, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

function StatusBadge({ status }: { status: CustomerShipment['status'] }) {
  const map: Record<CustomerShipment['status'], string> = {
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

function TrackingModal({
  shipment,
  onClose,
}: {
  shipment: CustomerShipment | null
  onClose: () => void
}) {
  const [detail, setDetail] = useState<CustomerShipmentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!shipment) return
    let active = true
    setLoading(true)
    customerApi.getShipmentDetail(shipment.id).then(res => {
      if (active) setDetail(res)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [shipment])

  return (
    <Dialog open={!!shipment} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md bg-white border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            Tracking Details
          </DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            {shipment?.tracking_number}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> Fetching timeline...
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-3">
                <span className="text-muted-foreground">Current Status</span>
                <StatusBadge status={detail.shipment.status} />
              </div>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {detail.events.map((event, i) => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border bg-slate-50 shadow-sm ml-4 md:ml-0 md:mr-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-xs text-slate-900">{event.event_type.toUpperCase()}</div>
                        <time className="font-mono text-[10px] text-slate-500">{new Date(event.occurred_at).toLocaleDateString()}</time>
                      </div>
                      <div className="text-xs text-slate-600">
                        {event.location_name && <span className="block font-medium">{event.location_name}</span>}
                        {event.notes && <span className="italic block mt-1">{event.notes}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="text-sm text-muted-foreground text-center py-8">No tracking timeline available.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<CustomerShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CustomerShipment | null>(null)

  useEffect(() => {
    customerApi.getShipments().then(res => {
      setShipments(res)
    }).catch(e => {
      setError(e?.response?.data?.message ?? 'Failed to load shipments')
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const filtered = shipments.filter(s => 
    s.tracking_number.toLowerCase().includes(search.toLowerCase()) || 
    s.order_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipments</h1>
        <p className="text-sm text-muted-foreground">Track and manage your incoming packages.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search tracking or order number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center py-24">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          Loading shipments...
        </div>
      )}

      {!loading && error && (
        <div className="py-24 flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-destructive font-semibold">Error Occurred</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="py-32 flex flex-col items-center gap-4 text-center bg-accent/20 rounded-xl border border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary mb-2">
            <PackageCheck className="w-8 h-8 opacity-75" />
          </div>
          <p className="font-semibold text-lg text-foreground">No Shipments Found</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            {search ? 'No shipments match your search.' : 'You have no active or past shipments.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-2 h-full bg-orange-500/0 group-hover:bg-orange-500/10 transition-colors" />
              <div className="flex items-start justify-between mb-3">
                <StatusBadge status={s.status} />
                <Truck className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mb-4">
                <p className="text-xs text-muted-foreground font-mono mb-1">Tracking ID</p>
                <p className="font-semibold text-foreground truncate">{s.tracking_number}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
                <span>Order: <span className="font-medium text-foreground">{s.order_number}</span></span>
                <span className="flex items-center text-orange-600 font-medium group-hover:underline">
                  Track <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <TrackingModal shipment={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
