import { useState, useEffect } from 'react'
import { rolesApi, type RoleWithPermissions, type Permission } from '@/api/roles'
import { Loader2, ShieldCheck, ShieldOff, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Role colour palette ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  SUPER_ADMIN:   { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500'  },
  ADMIN:         { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500'  },
  OPS_MANAGER:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  DISPATCHER:    { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     dot: 'bg-sky-500'     },
  DRIVER:        { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200',  dot: 'bg-yellow-500'  },
  BILLING_ADMIN: { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',    dot: 'bg-pink-500'    },
  VIEWER:        { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
}

const DEFAULT_COLOR = { bg: 'bg-muted', text: 'text-foreground', border: 'border-border', dot: 'bg-muted-foreground' }

const RESOURCE_ORDER = ['orders', 'shipments', 'inventory', 'fleet', 'billing', 'users', 'drivers', 'vehicles', 'warehouses', 'invoices', 'payments', 'roles', 'audit_logs']

const RESOURCE_LABELS: Record<string, string> = {
  orders:     'Orders',
  shipments:  'Shipments',
  inventory:  'Inventory',
  fleet:      'Fleet',
  billing:    'Billing',
  users:      'Users',
  drivers:    'Drivers',
  vehicles:   'Vehicles',
  warehouses: 'Warehouses',
  invoices:   'Invoices',
  payments:   'Payments',
  roles:      'Roles',
  audit_logs: 'Audit Logs',
}

// ── Toggle switch ──────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full px-0.5',
        'transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        checked
          ? 'bg-emerald-500 focus-visible:ring-emerald-500'
          : 'bg-red-400 focus-visible:ring-red-400'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md',
          'transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-7' : 'translate-x-0'
        )}
      >
        {checked
          ? <span className="text-emerald-500 text-[10px] font-bold leading-none">ON</span>
          : <span className="text-red-400 text-[10px] font-bold leading-none">OFF</span>
        }
      </span>
    </button>
  )
}

// ── Permission row ─────────────────────────────────────────────────────────────

function PermissionRow({
  permission,
  granted,
  pending,
  onToggle,
}: {
  permission: Permission
  granted: boolean
  pending: boolean
  onToggle: (perm: Permission, grant: boolean) => void
}) {
  return (
    <div className={cn(
      'flex items-center px-4 py-3 transition-colors',
      granted ? 'bg-emerald-50/60' : 'hover:bg-muted/40'
    )}>
      {/* Status icon */}
      <div className="w-6 shrink-0">
        {pending
          ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          : granted
            ? <ShieldCheck className="w-4 h-4 text-emerald-600" />
            : <ShieldOff className="w-4 h-4 text-muted-foreground/30" />
        }
      </div>

      {/* Action name */}
      <div className="w-28 shrink-0 mx-3">
        <span className={cn(
          'text-sm font-mono font-semibold',
          granted ? 'text-emerald-700' : 'text-muted-foreground'
        )}>
          {permission.action}
        </span>
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0 mr-6">
        <span className="text-sm text-muted-foreground">
          {permission.description ?? '—'}
        </span>
      </div>

      {/* Toggle — always pinned right */}
      <Toggle
        checked={granted}
        onChange={(val) => onToggle(permission, val)}
        disabled={pending}
      />
    </div>
  )
}

// ── Resource block ─────────────────────────────────────────────────────────────

function ResourceBlock({
  resource,
  permissions,
  grantedIds,
  pendingIds,
  onToggle,
}: {
  resource: string
  permissions: Permission[]
  grantedIds: Set<string>
  pendingIds: Set<string>
  onToggle: (perm: Permission, grant: boolean) => void
}) {
  const grantedCount = permissions.filter(p => grantedIds.has(p.id)).length
  const allGranted   = grantedCount === permissions.length

  return (
    <div className="rounded-lg border border-border">
      {/* Section header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2.5 border-b border-border rounded-t-lg',
        allGranted ? 'bg-primary/5' : 'bg-muted/40'
      )}>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {RESOURCE_LABELS[resource] ?? resource}
        </span>
        <span className={cn(
          'text-xs font-mono font-semibold',
          allGranted ? 'text-primary' : 'text-muted-foreground'
        )}>
          {grantedCount} / {permissions.length}
        </span>
      </div>

      {/* Permission rows */}
      <div className="divide-y divide-border">
        {permissions.map(perm => (
          <PermissionRow
            key={perm.id}
            permission={perm}
            granted={grantedIds.has(perm.id)}
            pending={pendingIds.has(perm.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [roles, setRoles]               = useState<RoleWithPermissions[]>([])
  const [allPerms, setAllPerms]         = useState<Permission[]>([])
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [grantedIds, setGrantedIds]     = useState<Set<string>>(new Set())
  const [pendingIds, setPendingIds]     = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg]         = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    setLoading(true)
    rolesApi.list()
      .then(({ roles, permissions }) => {
        setRoles(roles)
        setAllPerms(permissions)
        if (roles.length > 0) {
          setSelectedRole(roles[0])
          setGrantedIds(new Set(roles[0].permissions.map(p => p.id)))
        }
      })
      .catch(() => setError('Failed to load roles'))
      .finally(() => setLoading(false))
  }, [])

  const selectRole = (role: RoleWithPermissions) => {
    setSelectedRole(role)
    setGrantedIds(new Set(role.permissions.map(p => p.id)))
    setPendingIds(new Set())
    setToastMsg(null)
  }

  const handleToggle = async (perm: Permission, grant: boolean) => {
    if (!selectedRole) return

    setGrantedIds(prev => {
      const next = new Set(prev)
      grant ? next.add(perm.id) : next.delete(perm.id)
      return next
    })
    setPendingIds(prev => new Set(prev).add(perm.id))
    setToastMsg(null)

    try {
      if (grant) {
        await rolesApi.grantPermission(selectedRole.id, perm.id)
      } else {
        await rolesApi.revokePermission(selectedRole.id, perm.id)
      }

      setRoles(prev => prev.map(r => {
        if (r.id !== selectedRole.id) return r
        const perms = grant
          ? [...r.permissions, perm]
          : r.permissions.filter(p => p.id !== perm.id)
        return { ...r, permissions: perms }
      }))

      setToastMsg({
        text: `${perm.resource}:${perm.action} ${grant ? 'granted' : 'revoked'}`,
        ok: true,
      })
    } catch (e: any) {
      setGrantedIds(prev => {
        const next = new Set(prev)
        grant ? next.delete(perm.id) : next.add(perm.id)
        return next
      })
      setToastMsg({
        text: e?.response?.data?.message ?? `Failed to ${grant ? 'grant' : 'revoke'} permission`,
        ok: false,
      })
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(perm.id)
        return next
      })
    }
  }

  const permsByResource = RESOURCE_ORDER.reduce<Record<string, Permission[]>>((acc, res) => {
    acc[res] = allPerms.filter(p => p.resource === res)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 h-64 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading roles…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 animate-fade-in">

      {/* ── Left: role list ──────────────────────────────────────────────────── */}
      <div className="w-60 shrink-0 border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h1 className="text-base font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {roles.length} roles · {allPerms.length} permissions
          </p>
        </div>

        <div className="p-2 space-y-1">
          {roles.map(role => {
            const color    = ROLE_COLORS[role.name] ?? DEFAULT_COLOR
            const isActive = selectedRole?.id === role.id
            const count    = isActive ? grantedIds.size : role.permissions.length

            return (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                className={cn(
                  'w-full text-left rounded-lg border px-3 py-2.5 transition-all',
                  isActive
                    ? cn('border-2', color.border, color.bg)
                    : 'border-transparent hover:border-border hover:bg-muted/60'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', color.dot)} />
                  <span className={cn(
                    'text-[11px] font-bold font-mono',
                    isActive ? color.text : 'text-foreground'
                  )}>
                    {role.name}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight mt-1.5 pl-4 line-clamp-2">
                  {role.description ?? 'No description'}
                </p>
                <p className={cn(
                  'text-[10px] font-mono mt-1 pl-4',
                  isActive ? color.text : 'text-muted-foreground'
                )}>
                  {count} permission{count !== 1 ? 's' : ''}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: permissions panel ──────────────────────────────────────────── */}
      {selectedRole && (() => {
        const color = ROLE_COLORS[selectedRole.name] ?? DEFAULT_COLOR
        return (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

            {/* Sticky header */}
            <div className="shrink-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className={cn('w-5 h-5 shrink-0', color.text)} />
                <div>
                  <h2 className={cn('text-sm font-bold font-mono', color.text)}>
                    {selectedRole.name}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedRole.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {toastMsg && (
                  <div className={cn(
                    'text-xs px-3 py-1.5 rounded-md border font-mono animate-fade-in',
                    toastMsg.ok
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  )}>
                    {toastMsg.ok ? '✓' : '✗'} {toastMsg.text}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {grantedIds.size} / {allPerms.length}
                  </span>
                  <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-300', color.dot)}
                      style={{ width: `${(grantedIds.size / allPerms.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable permission list */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4 max-w-3xl">
                {RESOURCE_ORDER.map(resource => {
                  const perms = permsByResource[resource]
                  if (!perms || perms.length === 0) return null
                  return (
                    <ResourceBlock
                      key={resource}
                      resource={resource}
                      permissions={perms}
                      grantedIds={grantedIds}
                      pendingIds={pendingIds}
                      onToggle={handleToggle}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}