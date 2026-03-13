import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import UsersPage from './UsersPage'
import RolesPage from './RolesPage'
import CustomersPage from './CustomersPage'
import { Button } from '@/components/ui/button'
import { Users, LogOut, ChevronLeft, ChevronRight, Shield, Briefcase } from 'lucide-react'

type NavItem = 'users' | 'roles' | 'customers'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState<NavItem>('users')
  const [collapsed, setCollapsed] = useState(false)

  const initials = (user?.name ?? user?.email ?? 'U')[0].toUpperCase()

  const isAdminOrSuper = user?.roles?.some(r => r === 'SUPER_ADMIN' || r === 'ADMIN') ?? false

  const NAV_ITEMS: { key: NavItem; label: string; hidden?: boolean }[] = [
    { key: 'users', label: 'Users', hidden: !isAdminOrSuper },
    { key: 'roles', label: 'Roles', hidden: !isAdminOrSuper },
    { key: 'customers', label: 'Customers', hidden: !isAdminOrSuper },
  ]

  const visibleNavItems = NAV_ITEMS.filter(item => !item.hidden)

  const NAV_ICONS: Record<NavItem, (active: boolean) => React.ReactNode> = {
    users: (active) => <Users  className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />,
    roles: (active) => <Shield className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />,
    customers: (active) => <Briefcase className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />,
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col border-r border-border bg-muted/40 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-[60px]' : 'w-[220px]'
        }`}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-border min-h-[60px]">
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight">
              Logi<span className="text-primary">X</span>
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 ml-auto"
            onClick={() => setCollapsed(v => !v)}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />
            }
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1 p-2 pt-3">
          {visibleNavItems.map(item => {
            const isActive = activeNav === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                title={collapsed ? item.label : undefined}
                style={isActive ? { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' } : {}}
                className={[
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left',
                  collapsed ? 'justify-center' : '',
                  isActive ? '' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                ].join(' ')}
              >
                {NAV_ICONS[item.key](isActive)}
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-2 space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-accent/50 mb-1">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-xs font-semibold truncate">{user?.name ?? 'Admin'}</span>
                <span className="text-[10px] text-primary font-mono truncate">
                  {user?.roles?.[0] ?? 'Staff'}
                </span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            className={`w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
              collapsed ? 'h-9' : 'justify-start gap-2'
            }`}
            onClick={logout}
            title="Logout"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {visibleNavItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <p className="text-base font-semibold text-foreground">No access yet</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your role <span className="font-mono font-medium text-foreground">{user?.roles?.[0] ?? 'unknown'}</span> doesn't have permissions to any section of this panel yet. Contact your administrator to get access.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="gap-2 mt-1">
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </Button>
          </div>
        ) : (
          <>
            {activeNav === 'users' && isAdminOrSuper && <UsersPage />}
            {activeNav === 'roles' && isAdminOrSuper && <RolesPage />}
            {activeNav === 'customers' && isAdminOrSuper && <CustomersPage />}
          </>
        )}
      </main>
    </div>
  )
}