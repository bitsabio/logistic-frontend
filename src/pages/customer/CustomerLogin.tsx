import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Package, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export default function CustomerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed')
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('customer', JSON.stringify(data.customer))
      navigate('/customer/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* Left panel */}
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

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Package className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">LogiX</span>
        </div>

        <div className="relative z-10">
          <p className="text-zinc-500 text-xs font-mono tracking-[0.2em] uppercase mb-6">Client Portal</p>
          <h1 className="text-white text-4xl font-light leading-[1.15] mb-6">
            Track orders,<br />manage deliveries,<br />
            <span className="text-orange-400 font-normal">stay in control.</span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Your dedicated portal for tracking shipments, viewing invoices, and managing your logistics in real time.
          </p>
        </div>

        <p className="relative z-10 text-zinc-600 text-xs font-mono">
          © {new Date().getFullYear()} LogiX · Client Access
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

          <button
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to portal select
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Client sign in</h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Enter your credentials to access your account.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-destructive text-sm leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground/80">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground/80">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className={cn(
                'w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-medium h-10 transition-all duration-200',
                'disabled:bg-orange-500/50'
              )}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/customer/register')}
              className="font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
