import { useState, useEffect, useCallback } from 'react'
import { usersApi, type UserListItem, type Role } from '@/api/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Search, Loader2, ShieldCheck, UserX, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'OPS_MANAGER',
  'DISPATCHER',
  'DRIVER',
  'BILLING_ADMIN',
  'VIEWER',
] as const

type RoleName = typeof ALL_ROLES[number]

const ROLE_VARIANT: Record<RoleName, string> = {
  SUPER_ADMIN:   'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800',
  ADMIN:         'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800',
  OPS_MANAGER:   'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
  DISPATCHER:    'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800',
  DRIVER:        'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800',
  BILLING_ADMIN: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-400 dark:border-pink-800',
  VIEWER:        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
}

const STATUS_VARIANT: Record<UserListItem['status'], string> = {
  active:               'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  suspended:            'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  pending_verification: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800',
  deleted:              'bg-muted text-muted-foreground border-border',
}

// ── Small components ─────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_VARIANT[role as RoleName] ?? 'bg-muted text-muted-foreground border-border'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono border', cls)}>
      {role}
    </span>
  )
}

function StatusBadge({ status }: { status: UserListItem['status'] }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border', STATUS_VARIANT[status])}>
      {status.replace('_', ' ')}
    </span>
  )
}

function UserAvatar({ name, email }: { name: string | null; email: string }) {
  const letter = (name ?? email)[0].toUpperCase()
  return (
    <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
      {letter}
    </div>
  )
}

// ── Role assignment modal ────────────────────────────────────────────────────

function RoleModal({
  user,
  availableRoles,
  open,
  onClose,
  onSave,
}: {
  user: UserListItem
  availableRoles: Role[]
  open: boolean
  onClose: () => void
  onSave: (userId: string, roles: string[]) => Promise<void>
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(user.roles))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset when user changes
  useEffect(() => { setSelected(new Set(user.roles)); setError(null) }, [user])

  const toggle = (name: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(user.id, Array.from(selected))
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to update roles')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Assign Roles
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">{user.email}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 py-2">
          {ALL_ROLES.map(roleName => {
            const roleObj = availableRoles.find(r => r.name === roleName)
            const isSelected = selected.has(roleName)
            const colorCls = ROLE_VARIANT[roleName]
            return (
              <button
                key={roleName}
                onClick={() => toggle(roleName)}
                className={cn(
                  'flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all',
                  isSelected
                    ? cn('border-2', colorCls)
                    : 'border-border bg-muted/30 hover:bg-accent'
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={cn('text-[11px] font-bold font-mono', isSelected ? '' : 'text-muted-foreground')}>
                    {roleName}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-primary">✓</span>
                  )}
                </div>
                {roleObj?.description && (
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {roleObj.description}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Confirm status modal ─────────────────────────────────────────────────────

function ConfirmStatusModal({
  user,
  action,
  open,
  onClose,
  onConfirm,
}: {
  user: UserListItem
  action: 'active' | 'suspended'
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const isSuspend = action === 'suspended'

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuspend
              ? <UserX className="w-4 h-4 text-destructive" />
              : <UserCheck className="w-4 h-4 text-green-600" />
            }
            {isSuspend ? 'Suspend User' : 'Activate User'}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to{' '}
            <span className="font-semibold text-foreground">
              {isSuspend ? 'suspend' : 'activate'}
            </span>{' '}
            <span className="font-mono text-xs text-primary">{user.email}</span>?
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={isSuspend ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSuspend ? 'Suspend' : 'Activate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers]     = useState<UserListItem[]>([])
  const [meta, setMeta]       = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [roles, setRoles]     = useState<Role[]>([])

  const [roleModalUser,   setRoleModalUser]   = useState<UserListItem | null>(null)
  const [statusModal, setStatusModal] = useState<{ user: UserListItem; action: 'active' | 'suspended' } | null>(null)

  const fetchUsers = useCallback(async (page = 1, q = search) => {
    setLoading(true)
    setError(null)
    try {
      const res = await usersApi.list({ page, limit: 20, search: q || undefined })
      setUsers(res.data)
      setMeta(res.meta)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchUsers(1, '')
    usersApi.getRoles().then(setRoles).catch(() => {})
  }, [])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1, search), 350)
    return () => clearTimeout(t)
  }, [search])

  const handleRoleSave = async (userId: string, newRoles: string[]) => {
    await usersApi.assignRoles(userId, newRoles)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: newRoles } : u))
  }

  const handleStatusChange = async (user: UserListItem, action: 'active' | 'suspended') => {
    await usersApi.changeStatus(user.id, action)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: action } : u))
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-mono">
          {meta.total} staff accounts
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table card */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading users…
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex items-center justify-center py-16 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-16 text-sm">
                    No users found
                  </TableCell>
                </TableRow>
              )}
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.full_name} email={user.email} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{user.full_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0
                        ? <span className="text-xs text-muted-foreground">No roles</span>
                        : user.roles.map(r => <RoleBadge key={r} role={r} />)
                      }
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '—'
                    }
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRoleModalUser(user)}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                        Roles
                      </Button>

                      {user.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setStatusModal({ user, action: 'suspended' })}
                        >
                          <UserX className="w-3.5 h-3.5 mr-1.5" />
                          Suspend
                        </Button>
                      )}

                      {user.status === 'suspended' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-600/30 hover:bg-green-600/10 hover:text-green-600"
                          onClick={() => setStatusModal({ user, action: 'active' })}
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {!loading && !error && meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono">
              Page {meta.page} of {meta.pages} · {meta.total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => fetchUsers(meta.page - 1)}
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.pages}
                onClick={() => fetchUsers(meta.page + 1)}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {roleModalUser && (
        <RoleModal
          user={roleModalUser}
          availableRoles={roles}
          open={!!roleModalUser}
          onClose={() => setRoleModalUser(null)}
          onSave={handleRoleSave}
        />
      )}

      {statusModal && (
        <ConfirmStatusModal
          user={statusModal.user}
          action={statusModal.action}
          open={!!statusModal}
          onClose={() => setStatusModal(null)}
          onConfirm={() => handleStatusChange(statusModal.user, statusModal.action)}
        />
      )}
    </div>
  )
}