'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Admin Login — app/admin/login/page.tsx
   Nexfluence v4, LIGHT

   WHO THIS IS FOR:
   Nexfluence employees — the internal team who monitor the marketplace,
   handle escalations, manage disputes, and oversee platform health.
   NOT a user-facing page. Zero public discoverability by design:
     - No link from any user-facing page
     - Hard route: /admin/login
     - No "forgot password" flow (handled by IT/ops, not self-service)
     - No "create account" — admin accounts are provisioned by IT

   AUTH FLOW:
   Step 1 — Email + password (standard credentials)
   Step 2 — OTP (6-digit time-based code via Authenticator app)
             MFA is mandatory for admin, non-negotiable.
             SMS fallback via "Use backup code" link.

   VISUAL DESIGN:
   Deliberately different from the user-facing auth page to signal
   "you are in a different context." The user auth page is white + gradient
   + animated. The admin login is:
     - Near-black background (#0A0612, the ink colour)
     - Single centred card, no decorative distractions
     - Primary gradient only used on the CTA and focus rings
     - "Admin Portal" badge in muted amber, not violet — a deliberate
       colour break from the user experience so admins always know
       which surface they are on

   SECURITY SIGNALS SHOWN IN UI:
     - Session IP display (mock) — admin sees which IP is being used
     - "This session is only active on this device" note
     - Clear "Admin portal only" header label
     - Rate-limit error state after 5 failed password attempts
   ════════════════════════════════════════════════════════════════════ */

const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const CARD     = 'shadow-[0_2px_4px_rgba(0,0,0,0.3),0_24px_64px_-16px_rgba(0,0,0,0.5)]'
const INP      = 'w-full rounded-xl border bg-white/[0.06] px-4 py-3.5 text-[14.5px] text-white outline-none transition placeholder:text-white/25 focus:bg-white/[0.10] focus:shadow-[0_0_0_2px_rgba(139,49,232,0.55)]'
const INP_ERR  = 'border-rose-500/60 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.45)]'
const INP_OK   = 'border-white/[0.12] focus:border-primary/60'

/* ─── Mock admin credential — for demo only ──────────────────────── */
const ADMIN_EMAIL    = 'admin@nexfluence.eu'
const ADMIN_PASSWORD = 'Nexus2026!'
const CORRECT_OTP    = '482 916'

/* ────────────────────────────────────────────────────────────────── */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function ShieldCheck({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function EyeIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function EyeOffIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LockIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg>
}
function MailIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function AlertIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function SmartphoneIcon({ s = 36 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg>
}
function CheckCircle({ s = 40 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M7 12l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ─── OTP input — 6 boxes with auto-advance ──────────────────────── */
function OTPInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error: boolean }) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null)) // eslint-disable-line react-hooks/rules-of-hooks
  const digits = (value.replace(/\s/g, '') + '      ').split('').slice(0, 6)

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, idx) => idx === i ? ' ' : d).join('').trimEnd()
      onChange(next.slice(0, i) + ' ')
      if (i > 0) refs[i - 1]?.current?.focus()
    }
  }
  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    if (!char) return
    const next = digits.map((d, idx) => idx === i ? char : d).join('')
    onChange(next.trim())
    if (i < 5) refs[i + 1]?.current?.focus()
  }
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    refs[Math.min(pasted.length, 5)]?.current?.focus()
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className={`h-14 w-12 rounded-xl border text-center text-[22px] font-black text-white outline-none transition sm:h-[60px] sm:w-[52px] sm:text-[24px] ${
            error
              ? 'border-rose-500/60 bg-rose-500/10 focus:shadow-[0_0_0_2px_rgba(239,68,68,0.45)]'
              : d.trim()
                ? 'border-primary/60 bg-primary/[0.12] focus:shadow-[0_0_0_2px_rgba(139,49,232,0.55)]'
                : 'border-white/[0.10] bg-white/[0.05] focus:border-primary/40 focus:bg-white/[0.09] focus:shadow-[0_0_0_2px_rgba(139,49,232,0.40)]'
          }`}
        />
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function AdminLoginPage() {
  const router = useRouter()

  type Step = 'credentials' | 'otp' | 'success'
  const [step,        setStep]        = useState<Step>('credentials')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [otp,         setOtp]         = useState('')
  const [loading,     setLoading]     = useState(false)
  const [attempts,    setAttempts]    = useState(0)
  const [credErr,     setCredErr]     = useState('')
  const [otpErr,      setOtpErr]      = useState('')
  const [otpResent,   setOtpResent]   = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => { emailRef.current?.focus() }, [])

  /* Mock session IP */
  const SESSION_IP = '185.220.101.42'
  const SESSION_LOC = 'Riga, Latvia'

  const handleCredentials = async () => {
    setCredErr('')
    if (!email.trim() || !password.trim()) { setCredErr('Both email and password are required.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    const att = attempts + 1
    setAttempts(att)
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      if (att >= 5) { setCredErr('Account locked after 5 failed attempts. Contact IT support to unlock.'); return }
      setCredErr(`Incorrect email or password. ${5 - att} attempt${5 - att !== 1 ? 's' : ''} remaining.`)
      return
    }
    setAttempts(0)
    setStep('otp')
  }

  const handleOTP = async () => {
    setOtpErr('')
    const entered = otp.replace(/\s/g, '')
    if (entered.length < 6) { setOtpErr('Enter all 6 digits.'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    if (entered !== CORRECT_OTP.replace(/\s/g, '')) {
      setOtpErr('Incorrect code. Check your Authenticator app and try again.')
      setOtp('')
      return
    }
    setStep('success')
    await new Promise(r => setTimeout(r, 1400))
    router.push('/admin/dashboard')
  }

  const resendOTP = async () => {
    setOtpResent(true)
    await new Promise(r => setTimeout(r, 600))
    setTimeout(() => setOtpResent(false), 4000)
  }

  const locked = attempts >= 5

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0612] px-4 py-10 font-rubik antialiased">

      {/* Background orbs — subtle, darker than user auth */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[120px]"/>
        <div className="absolute -bottom-24 -right-16 h-[400px] w-[400px] rounded-full bg-magenta/[0.05] blur-[100px]"/>
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.03] blur-[140px]"/>
      </div>

      <div className="relative z-10 w-full max-w-[420px]">

        {/* Logo + Admin badge */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <NexLogo className="h-10 drop-shadow-[0_4px_24px_rgba(139,49,232,0.55)]"/>
          <div className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3.5 py-1.5">
            <ShieldCheck s={13}/>
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-400">Admin Portal</span>
          </div>
        </div>

        {/* Card */}
        <div className={`overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.04] backdrop-blur-xl ${CARD}`}>

          {/* ════ STEP 1: CREDENTIALS ════ */}
          {step === 'credentials' && (
            <div className="px-8 py-8">
              <h1 className="text-[22px] font-extrabold tracking-[-0.025em] text-white">Sign in to admin</h1>
              <p className="mt-1 text-[13px] text-white/45">Nexfluence internal use only. All sessions are logged.</p>

              {/* Rate-limit / lock error */}
              {credErr && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3">
                  <AlertIcon s={15}/>
                  <p className="text-[12.5px] font-semibold leading-[1.6] text-rose-400">{credErr}</p>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-white/40">Email</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"><MailIcon s={16}/></span>
                    <input
                      ref={emailRef}
                      type="email"
                      autoComplete="email"
                      disabled={locked || loading}
                      value={email}
                      onChange={e => { setEmail(e.target.value); setCredErr('') }}
                      onKeyDown={e => e.key === 'Enter' && handleCredentials()}
                      placeholder="admin@nexfluence.eu"
                      className={`${INP} pl-11 ${credErr && !locked ? INP_ERR : INP_OK} disabled:opacity-40`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-white/40">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"><LockIcon s={16}/></span>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      autoComplete="current-password"
                      disabled={locked || loading}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setCredErr('') }}
                      onKeyDown={e => e.key === 'Enter' && handleCredentials()}
                      placeholder="••••••••••"
                      className={`${INP} pl-11 pr-12 ${credErr && !locked ? INP_ERR : INP_OK} disabled:opacity-40`}
                    />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white/60">
                      {showPwd ? <EyeOffIcon s={17}/> : <EyeIcon s={17}/>}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCredentials}
                disabled={locked || loading || !email.trim() || !password.trim()}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[14.5px] font-bold text-white transition ${
                  !locked && !loading && email.trim() && password.trim()
                    ? `${GRAD_BTN} shadow-[0_8px_28px_-6px_rgba(139,49,232,0.55)] hover:-translate-y-0.5`
                    : 'cursor-not-allowed bg-white/[0.08] text-white/25'
                }`}>
                {loading
                  ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Verifying…</>
                  : locked ? 'Account locked' : 'Continue'}
              </button>

              {/* Security context */}
              <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                <ShieldCheck s={14}/>
                <div className="min-w-0">
                  <p className="text-[11.5px] font-semibold text-white/45">
                    Signing in from <span className="font-bold text-white/65">{SESSION_IP}</span> · {SESSION_LOC}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/28">This session will be logged with timestamp and IP.</p>
                </div>
              </div>

              <p className="mt-5 text-center text-[12px] text-white/25">
                Forgot your password?{' '}
                <a href="mailto:it@nexfluence.eu" className="font-semibold text-primary/70 hover:text-primary">Contact IT support</a>
              </p>
            </div>
          )}

          {/* ════ STEP 2: OTP ════ */}
          {step === 'otp' && (
            <div className="px-8 py-8">
              <button onClick={() => { setStep('credentials'); setOtp(''); setOtpErr('') }}
                className="mb-5 flex items-center gap-1.5 text-[12.5px] font-semibold text-white/35 transition hover:text-white/60">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/[0.12] text-primary">
                  <SmartphoneIcon s={26}/>
                </div>
                <div>
                  <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-white">Two-factor auth</h2>
                  <p className="mt-0.5 text-[12.5px] text-white/40">Open your Authenticator app and enter the 6-digit code.</p>
                </div>
              </div>

              {/* Email confirm */}
              <div className="mb-5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
                <p className="text-[12px] text-white/40">Signing in as <span className="font-semibold text-white/65">{email}</span></p>
              </div>

              {otpErr && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3">
                  <AlertIcon s={15}/>
                  <p className="text-[12.5px] font-semibold leading-[1.6] text-rose-400">{otpErr}</p>
                </div>
              )}

              <OTPInput value={otp} onChange={v => { setOtp(v); setOtpErr('') }} error={!!otpErr}/>

              <button
                onClick={handleOTP}
                disabled={loading || otp.replace(/\s/g, '').length < 6}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[14.5px] font-bold text-white transition ${
                  !loading && otp.replace(/\s/g, '').length >= 6
                    ? `${GRAD_BTN} shadow-[0_8px_28px_-6px_rgba(139,49,232,0.55)] hover:-translate-y-0.5`
                    : 'cursor-not-allowed bg-white/[0.08] text-white/25'
                }`}>
                {loading
                  ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Verifying…</>
                  : 'Verify & sign in'}
              </button>

              <div className="mt-5 flex flex-col items-center gap-2">
                <button onClick={resendOTP} className="text-[12px] font-semibold text-white/35 transition hover:text-white/60">
                  {otpResent ? '✓ New code sent to your Authenticator' : "Didn't get a code?"}
                </button>
                <a href="mailto:it@nexfluence.eu" className="text-[12px] font-semibold text-primary/55 transition hover:text-primary">
                  Use backup code
                </a>
              </div>
            </div>
          )}

          {/* ════ STEP 3: SUCCESS ════ */}
          {step === 'success' && (
            <div className="flex flex-col items-center px-8 py-12 text-center">
              <div className="mb-5 text-emerald-400 animate-[pulse_1s_ease-in-out_1]">
                <CheckCircle s={52}/>
              </div>
              <h2 className="text-[20px] font-extrabold text-white">Verified</h2>
              <p className="mt-2 text-[13px] text-white/40">Opening admin dashboard…</p>
              <div className="mt-6 flex items-center gap-2 text-white/25">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/15 border-t-white/50"/>
                <span className="text-[12px] font-medium">Redirecting</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[11.5px] text-white/20">
          Creator Nexus Admin Portal · Nexfluence SIA · All access is logged and audited
        </p>
      </div>
    </div>
  )
}