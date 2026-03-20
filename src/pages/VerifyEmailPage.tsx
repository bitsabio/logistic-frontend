// src/pages/VerifyEmailPage.tsx

import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Package, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApi } from '@/api/auth'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // email is passed via navigate state:
  //   navigate('/verify-email', { state: { email: 'user@example.com' } })
  const email = (location.state as { email?: string })?.email ?? ''

  const [digits,    setDigits]    = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)
  const [cooldown,  setCooldown]  = useState(0)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const otp = digits.join('')

  // ── Input handlers ────────────────────────────────────────────────────────

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next  = [...digits]
    next[index] = digit
    setDigits(next)
    setError(null)
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((d, i) => { if (i < 6) next[i] = d })
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (otp.length < 6) {
      setError('Please enter all 6 digits.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await authApi.verifyEmail(email, otp)
      setSuccess(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Invalid or expired code. Please try again.'
      setError(msg)
      setDigits(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 0)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Resend ────────────────────────────────────────────────────────────────

  function startCooldown() {
    setCooldown(60)
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (!email || resending || cooldown > 0) return
    setResending(true)
    setResendMsg(null)
    setError(null)
    try {
      await authApi.resendVerification(email)
      setResendMsg('A new code has been sent. Check your inbox.')
      setDigits(['', '', '', '', '', ''])
      startCooldown()
      setTimeout(() => inputRefs.current[0]?.focus(), 0)
    } catch {
      setResendMsg('Could not resend. Please try again.')
    } finally {
      setResending(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow p-10 flex flex-col items-center gap-4 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Email Verified!</h2>
          <p className="text-sm text-gray-500">Your account is now active. You can sign in.</p>
          <Button
            onClick={() => navigate('/login')}
            className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-10"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // ── OTP entry screen ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow p-10 flex flex-col items-center gap-6 w-full max-w-md">

        {/* Logo */}
        <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
          <Package className="w-6 h-6 text-white" strokeWidth={2} />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            We sent a 6-digit code to<br />
            <span className="font-medium text-gray-700">{email || 'your email address'}</span>
          </p>
        </div>

        {/* OTP inputs */}
        <div className="flex gap-2.5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={`w-11 h-14 text-center text-xl font-bold rounded-lg border transition
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}
              `}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 text-center -mt-2">{error}</p>
        )}

        {/* Resend success message */}
        {resendMsg && !error && (
          <p className="text-sm text-green-600 text-center -mt-2">{resendMsg}</p>
        )}

        {/* Verify button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading || otp.length < 6}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium h-10 disabled:bg-orange-500/50 flex items-center justify-center gap-2"
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</>
            : 'Verify email'
          }
        </Button>

        {/* Resend link */}
        <p className="text-sm text-gray-500 text-center">
          Didn't receive a code?{' '}
          {cooldown > 0 ? (
            <span className="text-gray-400 inline-flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-orange-600 hover:underline font-medium disabled:opacity-50 inline-flex items-center gap-1"
            >
              {resending
                ? <><Loader2 className="w-3 h-3 animate-spin" />Sending…</>
                : 'Resend code'
              }
            </button>
          )}
        </p>

        {/* Back link */}
        <button
          onClick={() => navigate('/login')}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          ← Back to sign in
        </button>

      </div>
    </div>
  )
}