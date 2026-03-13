import { useNavigate } from 'react-router-dom'
import { Briefcase, ShieldCheck, ArrowRight, Package } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex">

      {/* Left panel — matches LoginPage exactly */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-zinc-950 overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 w-[360px] h-[360px] bg-orange-600/8 rounded-full blur-[100px] pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Package className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">LogiX</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="text-zinc-500 text-xs font-mono tracking-[0.2em] uppercase mb-6">
            Logistics Management Platform
          </p>
          <h1 className="text-white text-4xl font-light leading-[1.15] mb-6">
            Staff and clients,<br />working from<br />
            <span className="text-orange-400 font-normal">one platform.</span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Manage orders, shipments, warehouse inventory, fleet, and billing — with a dedicated portal for your clients too.
          </p>
          <div className="mt-10 flex gap-8">
            {[
              { value: '38', label: 'DB Tables' },
              { value: '7', label: 'Roles' },
              { value: '23', label: 'Permissions' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-white text-2xl font-semibold">{s.value}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-zinc-600 text-xs font-mono">
          © {new Date().getFullYear()} LogiX · All rights reserved
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">LogiX</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Choose your portal to continue.
            </p>
          </div>

          <div className="space-y-3">

            {/* Staff portal */}
            <button
              onClick={() => navigate('/login')}
              className="group w-full flex items-center gap-4 rounded-xl border bg-card p-4 text-left hover:border-orange-500/40 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                <ShieldCheck className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Staff Portal</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">Admins, managers, drivers &amp; dispatchers</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Client portal */}
            <button
              onClick={() => navigate('/customer/login')}
              className="group w-full flex items-center gap-4 rounded-xl border bg-card p-4 text-left hover:border-orange-500/40 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                <Briefcase className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Client Portal</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">Track shipments and manage your orders</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
