import { Package, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
              <Package className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-sm text-foreground">LogiOps</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{user?.name}</span>
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-orange-500">
              {user?.roles?.[0] ?? 'UNKNOWN'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16 animate-fade-in">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Welcome back, <span className="text-foreground font-medium">{user?.name}</span>. Your workspace is ready.
            </p>
          </div>
          <div className="mt-4 px-6 py-4 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground font-mono">
            🚧 Dashboard content coming soon
          </div>
        </div>
      </main>
    </div>
  )
}