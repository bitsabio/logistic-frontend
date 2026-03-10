import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import UsersPage from './UsersPage.tsx'
import { Button } from '@/components/ui/button'
import { Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

type NavItem = 'users'

const NAV_ITEMS: { key: NavItem; label: string; icon: React.ReactNode }[] = [
  { key: 'users', label: 'Users', icon: <Users className="w-4 h-4 shrink-0" /> },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [activeNav, setActiveNav] = useState<NavItem>('users')
  const [collapsed, setCollapsed] = useState(false)

  const initials = (user?.name ?? user?.email ?? 'U')[0].toUpperCase()

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
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left
                ${collapsed ? 'justify-center' : ''}
                ${activeNav === item.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
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
      <main className="flex-1 overflow-y-auto">
        {activeNav === 'users' && <UsersPage />}
      </main>
    </div>
  )
}