import { useEffect, useState } from 'react'
import { Plus, Package, MapPin, Loader2, AlertCircle, ChevronRight, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { warehouseApi, type Warehouse, type StorageLocation } from '@/api/inventory'

const ZONE_TYPES = ['general', 'cold', 'hazmat', 'high_value', 'returns'] as const

export default function WarehousePage() {
  const [warehouses, setWarehouses]     = useState<Warehouse[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [expandedId, setExpandedId]     = useState<string | null>(null)
  const [locations, setLocations]       = useState<Record<string, StorageLocation[]>>({})
  const [locLoading, setLocLoading]     = useState<string | null>(null)

  // Create warehouse dialog
  const [showWh, setShowWh]             = useState(false)
  const [whName, setWhName]             = useState('')
  const [whCode, setWhCode]             = useState('')
  const [whArea, setWhArea]             = useState('')
  const [whSaving, setWhSaving]         = useState(false)
  const [whError, setWhError]           = useState('')

  // Create location dialog
  const [showLoc, setShowLoc]           = useState(false)
  const [locWarehouseId, setLocWarehouseId] = useState('')
  const [locCode, setLocCode]           = useState('')
  const [locZone, setLocZone]           = useState<string>('general')
  const [locWeight, setLocWeight]       = useState('')
  const [locSaving, setLocSaving]       = useState(false)
  const [locError, setLocError]         = useState('')

  useEffect(() => {
    warehouseApi.list()
      .then(setWarehouses)
      .catch(() => setError('Failed to load warehouses.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleWarehouse(wh: Warehouse) {
    if (expandedId === wh.id) { setExpandedId(null); return }
    setExpandedId(wh.id)
    if (!locations[wh.id]) {
      setLocLoading(wh.id)
      try {
        const locs = await warehouseApi.getLocations(wh.id)
        setLocations(prev => ({ ...prev, [wh.id]: locs }))
      } catch { /* ignore */ }
      finally { setLocLoading(null) }
    }
  }

  async function handleCreateWarehouse() {
    setWhError('')
    if (!whName.trim() || !whCode.trim()) { setWhError('Name and code are required.'); return }
    setWhSaving(true)
    try {
      const wh = await warehouseApi.create({
        name: whName.trim(),
        code: whCode.trim(),
        total_area_sqm: whArea ? parseFloat(whArea) : undefined,
      })
      setWarehouses(prev => [...prev, wh])
      setShowWh(false); setWhName(''); setWhCode(''); setWhArea('')
    } catch (err: unknown) {
      setWhError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create warehouse.')
    } finally { setWhSaving(false) }
  }

  async function handleCreateLocation() {
    setLocError('')
    if (!locCode.trim()) { setLocError('Location code is required.'); return }
    setLocSaving(true)
    try {
      const loc = await warehouseApi.createLocation(locWarehouseId, {
        location_code: locCode.trim(),
        zone_type: locZone,
        max_weight_kg: locWeight ? parseFloat(locWeight) : undefined,
      })
      setLocations(prev => ({ ...prev, [locWarehouseId]: [...(prev[locWarehouseId] ?? []), loc] }))
      setWarehouses(prev => prev.map(w =>
        w.id === locWarehouseId ? { ...w, location_count: w.location_count + 1 } : w
      ))
      setShowLoc(false); setLocCode(''); setLocZone('general'); setLocWeight('')
    } catch (err: unknown) {
      setLocError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create location.')
    } finally { setLocSaving(false) }
  }

  const zoneColor: Record<string, string> = {
    general:    'bg-zinc-500/15 text-zinc-600',
    cold:       'bg-blue-500/15 text-blue-600',
    hazmat:     'bg-red-500/15 text-red-600',
    high_value: 'bg-amber-500/15 text-amber-600',
    returns:    'bg-purple-500/15 text-purple-600',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Warehouses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowWh(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> New Warehouse
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Package className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">No warehouses yet</p>
            <p className="text-xs text-muted-foreground">Create your first warehouse to start managing inventory.</p>
            <Button size="sm" onClick={() => setShowWh(true)} className="bg-orange-500 hover:bg-orange-600 text-white mt-1">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Warehouse
            </Button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {warehouses.map(wh => (
              <div key={wh.id} className="rounded-xl border bg-card overflow-hidden">
                {/* Warehouse row */}
                <button
                  onClick={() => toggleWarehouse(wh)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{wh.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {wh.code} · {wh.location_count} location{wh.location_count !== 1 ? 's' : ''}
                      {wh.total_area_sqm && ` · ${wh.total_area_sqm} m²`}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`text-xs border-0 ${wh.is_active ? 'bg-emerald-500/15 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                    {wh.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {expandedId === wh.id
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </button>

                {/* Locations panel */}
                {expandedId === wh.id && (
                  <div className="border-t border-border">
                    <div className="flex items-center justify-between px-5 py-3 bg-muted/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Storage Locations</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => { setLocWarehouseId(wh.id); setShowLoc(true) }}
                      >
                        <Plus className="w-3 h-3" /> Add Location
                      </Button>
                    </div>

                    {locLoading === wh.id ? (
                      <div className="px-5 py-6 flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading locations…
                      </div>
                    ) : (locations[wh.id] ?? []).length === 0 ? (
                      <div className="px-5 py-6 text-sm text-muted-foreground">
                        No storage locations yet. Add one to start tracking inventory here.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {(locations[wh.id] ?? []).map(loc => (
                          <div key={loc.id} className="flex items-center gap-3 px-5 py-3">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="font-mono text-sm font-medium">{loc.location_code}</span>
                            <Badge variant="secondary" className={`text-[10px] border-0 capitalize ${zoneColor[loc.zone_type] ?? 'bg-muted text-muted-foreground'}`}>
                              {loc.zone_type.replace('_', ' ')}
                            </Badge>
                            {loc.max_weight_kg && (
                              <span className="text-xs text-muted-foreground ml-auto">max {loc.max_weight_kg} kg</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Warehouse Dialog */}
      <Dialog open={showWh} onOpenChange={setShowWh}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Warehouse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {whError && <p className="text-sm text-destructive">{whError}</p>}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="Main Distribution Center" value={whName} onChange={e => setWhName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Code <span className="text-muted-foreground font-normal text-xs">(unique identifier)</span></Label>
              <Input placeholder="WH-NYC-01" value={whCode} onChange={e => setWhCode(e.target.value.toUpperCase())} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Total Area <span className="text-muted-foreground font-normal text-xs">(m², optional)</span></Label>
              <Input type="number" placeholder="5000" value={whArea} onChange={e => setWhArea(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWh(false)}>Cancel</Button>
            <Button disabled={whSaving} onClick={handleCreateWarehouse} className="bg-orange-500 hover:bg-orange-600 text-white">
              {whSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : 'Create Warehouse'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Location Dialog */}
      <Dialog open={showLoc} onOpenChange={setShowLoc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Storage Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {locError && <p className="text-sm text-destructive">{locError}</p>}
            <div className="space-y-1.5">
              <Label>Location Code</Label>
              <Input placeholder="A-01-01" value={locCode} onChange={e => setLocCode(e.target.value)} className="font-mono" />
              <p className="text-xs text-muted-foreground">Format: Aisle-Rack-Bin (e.g. A-01-01)</p>
            </div>
            <div className="space-y-1.5">
              <Label>Zone Type</Label>
              <div className="flex flex-wrap gap-2">
                {ZONE_TYPES.map(zt => (
                  <button
                    key={zt}
                    onClick={() => setLocZone(zt)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                      locZone === zt ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {zt.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Max Weight <span className="text-muted-foreground font-normal text-xs">(kg, optional)</span></Label>
              <Input type="number" placeholder="500" value={locWeight} onChange={e => setLocWeight(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoc(false)}>Cancel</Button>
            <Button disabled={locSaving} onClick={handleCreateLocation} className="bg-orange-500 hover:bg-orange-600 text-white">
              {locSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : 'Add Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}