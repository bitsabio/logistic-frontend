// src/pages/RegisterPage.tsx

import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import apiClient from '@/api/client'
import { cn } from '@/lib/utils'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [fullName,     setFullName]     = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading,    setIsLoading]    = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await apiClient.post('/auth/register', {
        email,
        password,
        full_name: fullName,
      })
      // On success navigate to OTP page, passing email in state
      navigate('/verify-email', { state: { email } })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* Left panel — same style as LoginPage */}
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
          <span className="text-white font-semibold text-lg tracking-tight">LogiOps</span>
        </div>

        <div className="relative z-10">
          <p className="text-zinc-500 text-xs font-mono tracking-[0.2em] uppercase mb-6">
            Admin Operations Platform
          </p>
          <h1 className="text-white text-4xl font-light leading-[1.15] mb-6">
            Join your team<br />on the platform<br />
            <span className="text-orange-400 font-normal">built for logistics.</span>
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
            Manage orders, shipments, warehouse inventory, fleet, and billing — all from a single unified admin panel.
          </p>
        </div>

        <p className="relative z-10 text-zinc-600 text-xs font-mono">
          © {new Date().getFullYear()} LogiOps · Internal use only
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
            <span className="font-semibold text-foreground">LogiOps</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Create account</h2>
            <p className="text-muted-foreground text-sm mt-1.5">
              Fill in your details to get started.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-destructive text-sm leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-foreground/80">Full name</Label>
              <Input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="John Smith"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground/80">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground/80">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className={cn(
                'w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-medium h-10 transition-all duration-200',
                'disabled:bg-orange-500/50'
              )}
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
                : 'Create account'
              }
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Access is restricted to authorised staff only.<br />
            Contact your administrator if you need access.
          </p>

        </div>
      </div>
    </div>
  )
}