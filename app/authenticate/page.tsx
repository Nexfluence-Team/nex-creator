'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

/* ─── Breakpoint hook ─────────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const update = () => setW(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return {
    isMobile:  w > 0 && w < 640,
    isTablet:  w >= 640 && w < 1024,
    isDesktop: w >= 1024,
    w,
  }
}

/* ─── Types ───────────────────────────────────────────────────────── */
type Mode = 'signup' | 'login'

interface SignupData {
  email: string; password: string; showPass: boolean
  otp: string[]; name: string; niches: string[]
  platforms: string[]; followerRange: string; earn: string
  profilePic: string | null; links: Record<string, string>
  referralCode: string
}

/* ─── Data ────────────────────────────────────────────────────────── */
const NICHES = [
  { e: '💄', l: 'Beauty' },    { e: '👗', l: 'Fashion' },
  { e: '✨', l: 'Lifestyle' }, { e: '🍽️', l: 'Food & Drink' },
  { e: '🏋️', l: 'Fitness' },  { e: '✈️', l: 'Travel' },
  { e: '📱', l: 'Tech' },      { e: '🏠', l: 'Home' },
  { e: '💊', l: 'Wellness' },  { e: '🎮', l: 'Gaming' },
]

const PLATFORMS = [
  { id: 'instagram', icon: '📸', label: 'Instagram' },
  { id: 'tiktok',    icon: '🎵', label: 'TikTok' },
  { id: 'youtube',   icon: '▶️', label: 'YouTube' },
  { id: 'linkedin',  icon: '💼', label: 'LinkedIn' },
  { id: 'pinterest', icon: '📌', label: 'Pinterest' },
  { id: 'x',         icon: '✕',  label: 'X / Twitter' },
]

const RANGES = [
  { l: '0 – 5K',      v: '0-5k',      earn: '€200 – €600' },
  { l: '5K – 20K',    v: '5k-20k',    earn: '€600 – €1,200' },
  { l: '20K – 50K',   v: '20k-50k',   earn: '€1,200 – €3,000' },
  { l: '50K – 100K',  v: '50k-100k',  earn: '€3,000 – €6,000' },
  { l: '100K – 500K', v: '100k-500k', earn: '€6,000 – €15,000' },
  { l: '500K+',       v: '500k+',     earn: '€15,000+' },
]

const SOCIAL_INPUTS = [
  { id: 'instagram', icon: '📸', label: 'Instagram', ph: 'instagram.com/yourhandle' },
  { id: 'tiktok',    icon: '🎵', label: 'TikTok',    ph: 'tiktok.com/@yourhandle' },
  { id: 'youtube',   icon: '▶️', label: 'YouTube',   ph: 'youtube.com/@yourchannel' },
  { id: 'linkedin',  icon: '💼', label: 'LinkedIn',  ph: 'linkedin.com/in/yourname' },
]

const QUOTES: Record<number, { text: string; author: string; role: string }> = {
  1: { text: '"Setup took 10 minutes and it already looks more pro than my Linktree."', author: 'Aisha N.',  role: 'Skincare Creator · Riga' },
  2: { text: '"The OTP flow is seamless — I was in within seconds."',                   author: 'Jake M.',   role: 'Fitness Creator · Tallinn' },
  3: { text: '"I went from awkward DMs to a legit inquiry form overnight."',             author: 'Priya K.',  role: 'Fashion Creator · Vilnius' },
  4: { text: '"I connected Instagram and TikTok in one click. Done."',                   author: 'Marta L.',  role: 'Travel Creator · Riga' },
  5: { text: '"I had no idea I could earn this much. The numbers blew me away."',        author: 'Sophie T.', role: 'Lifestyle Creator · Jūrmala' },
  6: { text: '"A great photo makes brands stop and actually read your page."',           author: 'Elena V.',  role: 'Beauty Creator · Tallinn' },
  7: { text: '"The custom domain made it feel like a real brand — because it is."',      author: 'Darius K.', role: 'Tech Creator · Kaunas' },
  8: { text: '"My referral code brought in 12 creators in the first week."',             author: 'Anna B.',   role: 'Food Creator · Riga' },
}

const STEP_COUNT = 8

/* ─── Shared primitives ───────────────────────────────────────────── */
const inputBase: React.CSSProperties = {
  display: 'block', width: '100%',
  background: '#ffffff',
  border: '1.5px solid rgba(10,6,18,0.14)',
  borderRadius: 10, color: '#0a0612',
  fontSize: 15, outline: 'none',
  fontFamily: "'Rubik', sans-serif",
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
}

const labelBase: React.CSSProperties = {
  display: 'block', color: 'rgba(10,6,18,0.45)',
  fontSize: 11, fontWeight: 500,
  letterSpacing: '0.07em', textTransform: 'uppercase',
  marginBottom: 7,
}

/* ─── LightInput ──────────────────────────────────────────────────── */
function LightInput({ label, type = 'text', value, onChange, placeholder, suffix }: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string
  suffix?: React.ReactNode
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div>
      <label style={labelBase}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            ...inputBase, padding: '13px 16px',
            paddingRight: suffix ? 52 : 16,
            borderColor: focus ? 'rgba(128,97,255,0.65)' : 'rgba(10,6,18,0.14)',
            boxShadow: focus ? '0 0 0 3px rgba(128,97,255,0.10)' : 'none',
          }}
        />
        {suffix && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
            {suffix}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── FocusInput (no label variant) ──────────────────────────────── */
function FocusInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        ...inputBase, padding: '13px 16px',
        borderColor: focus ? 'rgba(128,97,255,0.65)' : 'rgba(10,6,18,0.14)',
        boxShadow: focus ? '0 0 0 3px rgba(128,97,255,0.10)' : 'none',
      }}
    />
  )
}

/* ─── OTPRow ──────────────────────────────────────────────────────── */
function OTPRow({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const [foci, setFoci] = useState<boolean[]>(Array(6).fill(false))
  const setF = (i: number, v: boolean) =>
    setFoci(f => { const n = [...f]; n[i] = v; return n })

  const handle = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const next = [...value]; next[i] = v; onChange(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
  }
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus()
  }
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
      {value.map((d, i) => (
        <input
          key={i} ref={el => { refs.current[i] = el }}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handle(i, e.target.value)}
          onKeyDown={e => onKey(i, e)}
          onFocus={() => setF(i, true)}
          onBlur={() => setF(i, false)}
          style={{
            width: 44, height: 52, flexShrink: 0,
            textAlign: 'center', fontSize: 18, fontWeight: 800,
            background: d ? 'rgba(128,97,255,0.06)' : '#fff',
            border: `1.5px solid ${foci[i] ? 'rgba(128,97,255,0.60)' : d ? 'rgba(128,97,255,0.35)' : 'rgba(10,6,18,0.14)'}`,
            borderRadius: 10, color: '#0a0612', outline: 'none',
            fontFamily: "'Rubik', sans-serif",
            boxShadow: foci[i] ? '0 0 0 3px rgba(128,97,255,0.10)' : 'none',
            transition: 'all 0.15s ease',
          }}
        />
      ))}
    </div>
  )
}

/* ─── ContinueBtn ─────────────────────────────────────────────────── */
function ContinueBtn({ disabled, loading, onClick, label = 'Continue' }: {
  disabled: boolean; loading: boolean; onClick: () => void; label?: string
}) {
  const [hov, setHov] = useState(false)
  return (
    <>
      <button
        disabled={disabled || loading}
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'block', width: '100%',
          padding: '15px 24px', borderRadius: 10, border: 'none',
          background: disabled ? 'rgba(200,241,53,0.35)' : hov ? '#b8e000' : '#C8F135',
          color: disabled ? 'rgba(10,6,18,0.38)' : '#0a0612',
          fontSize: 15, fontWeight: 700, letterSpacing: '0.01em',
          fontFamily: "'Rubik', sans-serif",
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.18s ease',
          transform: hov && !disabled ? 'translateY(-1px)' : 'none',
          boxShadow: hov && !disabled ? '0 6px 20px rgba(200,241,53,0.30)' : 'none',
        }}
      >
        {loading ? <Spinner dark /> : label}
      </button>
      {!disabled && (
        <p style={{ textAlign: 'center', color: 'rgba(10,6,18,0.30)', fontSize: 13, marginTop: 10 }}>
          Or press enter to continue
        </p>
      )}
    </>
  )
}

/* ─── SkipBtn ─────────────────────────────────────────────────────── */
function SkipBtn({ onClick }: { onClick: () => void }) {
  return (
    <p style={{ textAlign: 'center', marginTop: 12 }}>
      <button onClick={onClick} style={{
        background: 'none', border: 'none',
        color: 'rgba(10,6,18,0.30)', fontSize: 13,
        cursor: 'pointer', fontFamily: "'Rubik', sans-serif",
      }}>
        Skip for now
      </button>
    </p>
  )
}

/* ─── Spinner ─────────────────────────────────────────────────────── */
function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span style={{
      display: 'inline-block', width: 16, height: 16,
      border: `2px solid ${dark ? 'rgba(10,6,18,0.18)' : 'rgba(255,255,255,0.3)'}`,
      borderTopColor: dark ? '#0a0612' : '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      verticalAlign: 'middle',
    }} />
  )
}

/* ─── SocialBtn ───────────────────────────────────────────────────── */
function SocialBtn({ emoji, label, gradient }: { emoji: string; label: string; gradient?: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '12px 18px', borderRadius: 10, width: '100%',
        border: gradient ? 'none' : '1.5px solid rgba(10,6,18,0.13)',
        background: gradient ?? (hov ? 'rgba(10,6,18,0.03)' : '#fff'),
        color: gradient ? '#fff' : '#0a0612',
        fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: "'Rubik', sans-serif",
        opacity: hov ? 0.88 : 1,
        transform: hov ? 'scale(1.01)' : 'scale(1)',
        transition: 'all 0.18s ease',
        boxShadow: gradient ? 'none' : '0 1px 4px rgba(10,6,18,0.05)',
      }}
    >
      <span style={{ fontSize: 17 }}>{emoji}</span>
      {label}
    </button>
  )
}

/* ─── RightPanel ──────────────────────────────────────────────────── */
function RightPanel({ step }: { step: number }) {
  const q = QUOTES[step] ?? QUOTES[1]
  return (
    <div style={{
      width: '38%', flexShrink: 0,
      background: '#2d4a6e',
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '48px 44px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div aria-hidden style={{
        position: 'absolute', top: 0, right: 0, width: '70%', height: '50%',
        background: 'radial-gradient(ellipse at 80% 20%, rgba(128,97,255,0.18) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div key={step} style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.45s ease forwards' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
          {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#C8F135', fontSize: 20 }}>★</span>)}
        </div>
        <p style={{
          color: '#fff', fontSize: 'clamp(16px, 1.6vw, 20px)',
          fontWeight: 500, lineHeight: 1.55, marginBottom: 28, maxWidth: 300,
        }}>
          {q.text}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #ff33bc, #8061ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff',
          }}>{q.author[0]}</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{q.author}</div>
            <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: 13, marginTop: 2 }}>{q.role}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function AuthPage() {
  const { isMobile, isTablet, isDesktop, w } = useBreakpoint()

  const [mode, setMode]       = useState<Mode>('signup')
  const [step, setStep]       = useState(1)
  const [animKey, setAnimKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [resend, setResend]   = useState(0)
  const [copied, setCopied]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<SignupData>({
    email: '', password: '', showPass: false,
    otp: ['', '', '', '', '', ''],
    name: '', niches: [], platforms: [],
    followerRange: '', earn: '',
    profilePic: null,
    links: { instagram: '', tiktok: '', youtube: '', linkedin: '' },
    referralCode: '',
  })

  const set = (patch: Partial<SignupData>) => setData(d => ({ ...d, ...patch }))

  /* referral code on step 8 */
  useEffect(() => {
    if (step === 8 && !data.referralCode) {
      const pfx = (data.name + 'XXX').slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let sfx = ''
      for (let i = 0; i < 4; i++) sfx += chars[Math.floor(Math.random() * chars.length)]
      set({ referralCode: `${pfx}-${sfx}` })
    }
  }, [step])

  useEffect(() => {
    if (resend <= 0) return
    const id = setInterval(() => setResend(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [resend])

  const goTo = (n: number) => { setAnimKey(k => k + 1); setStep(n) }
  const next  = () => goTo(step + 1)
  const back  = () => goTo(step - 1)
  const fake  = (cb: () => void) => { setLoading(true); setTimeout(() => { setLoading(false); cb() }, 900) }

  const maxStep  = mode === 'login' ? 2 : STEP_COUNT
  const progress = (step / maxStep) * 100

  const toggleNiche = (l: string) =>
    set({ niches: data.niches.includes(l) ? data.niches.filter(x => x !== l) : [...data.niches, l] })
  const togglePlat  = (id: string) =>
    set({ platforms: data.platforms.includes(id) ? data.platforms.filter(x => x !== id) : [...data.platforms, id] })

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = ev => set({ profilePic: ev.target?.result as string })
    r.readAsDataURL(file)
  }

  const canContinue = (): boolean => {
    if (step === 1) return !!data.email && data.password.length >= 6
    if (step === 2) return data.otp.every(d => d !== '')
    if (step === 3) return !!data.name && data.niches.length > 0
    if (step === 4) return data.platforms.length > 0
    if (step === 5) return !!data.followerRange
    return true
  }

  /* ── responsive values ── */
  const navPad   = isMobile ? '14px 16px' : isTablet ? '16px 28px' : '18px 48px'
  const formPad  = isMobile ? '24px 16px' : isTablet ? '32px 32px' : '40px 48px'
  const maxForm  = isMobile ? '100%'       : isTablet ? '480px'     : '480px'
  const h2Size   = isMobile ? 22           : isTablet ? 26          : 30
  const pillSize = isMobile ? 12           : 13

  /* ── step content ── */
  const pillStyle: React.CSSProperties = {
    color: 'rgba(10,6,18,0.42)', fontSize: pillSize,
    fontWeight: 400, marginBottom: 8, display: 'block',
  }
  const h2Style: React.CSSProperties = {
    color: '#0a0612', fontWeight: 900,
    fontSize: h2Size, letterSpacing: '-0.03em',
    lineHeight: 1.15, marginBottom: 24,
  }
  const subStyle: React.CSSProperties = {
    color: 'rgba(10,6,18,0.48)', fontSize: isMobile ? 13 : 14,
    lineHeight: 1.7, marginBottom: 22,
  }

  const renderStep = () => {
    switch (step) {

      /* ── 1: Account ── */
      case 1: return (
        <div>
          <span style={pillStyle}>{mode === 'login' ? 'Welcome back' : 'Create your free account'}</span>
          <h2 style={h2Style}>{mode === 'login' ? 'Sign in to Creator Nexus' : 'Start your creator journey'}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            <SocialBtn emoji="📸" label={`${mode === 'login' ? 'Sign in' : 'Continue'} with Instagram`}
              gradient="linear-gradient(90deg,#f77737,#e1306c,#833ab4)" />
            <SocialBtn emoji="🎵" label={`${mode === 'login' ? 'Sign in' : 'Continue'} with TikTok`} />
          </div>

          {/* divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(10,6,18,0.08)' }} />
            <span style={{ color: 'rgba(10,6,18,0.28)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(10,6,18,0.08)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
            <LightInput label="Email address" type="email" value={data.email}
              onChange={v => set({ email: v })} placeholder="you@email.com" />
            <LightInput label="Password" type={data.showPass ? 'text' : 'password'}
              value={data.password} onChange={v => set({ password: v })}
              placeholder="Min. 6 characters"
              suffix={
                <button type="button" onClick={() => set({ showPass: !data.showPass })} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(10,6,18,0.35)', fontSize: 12,
                  fontFamily: "'Rubik',sans-serif", fontWeight: 600,
                }}>
                  {data.showPass ? 'Hide' : 'Show'}
                </button>
              }
            />
          </div>

          <ContinueBtn disabled={!canContinue()} loading={loading}
            onClick={() => fake(() => { next(); setResend(30) })}
            label={mode === 'login' ? 'Send verification code →' : 'Create account →'} />

          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'rgba(10,6,18,0.35)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setStep(1); setAnimKey(k => k + 1) }}
              style={{ background: 'none', border: 'none', color: '#8061ff', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: "'Rubik',sans-serif" }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      )

      /* ── 2: OTP ── */
      case 2: return (
        <div>
          <span style={pillStyle}>Check your inbox</span>
          <h2 style={h2Style}>Enter the 6-digit code</h2>
          <p style={subStyle}>
            Sent to <span style={{ color: '#8061ff', fontWeight: 600 }}>{data.email || 'your email'}</span>
          </p>
          <div style={{ marginBottom: 22 }}>
            <OTPRow
              value={data.otp}
              onChange={otp => {
                set({ otp })
                if (otp.every(d => d !== '')) {
                  setLoading(true)
                  setTimeout(() => { setLoading(false); next() }, 700)
                }
              }}
            />
          </div>
          {loading
            ? <div style={{ textAlign: 'center', padding: 12 }}><Spinner dark /></div>
            : <ContinueBtn disabled={!canContinue()} loading={false}
                onClick={() => fake(next)} label="Verify & continue →" />
          }
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'rgba(10,6,18,0.35)' }}>
            {resend > 0
              ? <>Resend in <span style={{ color: '#8061ff', fontWeight: 600 }}>{resend}s</span></>
              : <button onClick={() => { set({ otp: Array(6).fill('') }); setResend(30) }} style={{
                    background: 'none', border: 'none', color: '#8061ff',
                    fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: "'Rubik',sans-serif",
                  }}>Resend code</button>
            }
          </p>
        </div>
      )

      /* ── 3: Identity + niches ── */
      case 3: return (
        <div>
          <span style={pillStyle}>Help brands find you</span>
          <h2 style={h2Style}>What type of content do you create?</h2>
          <div style={{ marginBottom: 18 }}>
            <LightInput label="Your full name" value={data.name}
              onChange={v => set({ name: v })} placeholder="Sophie Thomas" />
          </div>
          <label style={labelBase}>Content niches — pick all that apply</label>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24,
          }}>
            {NICHES.map(n => {
              const on = data.niches.includes(n.l)
              return (
                <button key={n.l} onClick={() => toggleNiche(n.l)} style={{
                  display: 'inline-flex', alignItems: 'center',
                  gap: 6, padding: isMobile ? '7px 12px' : '8px 16px',
                  borderRadius: 100,
                  border: `1.5px solid ${on ? 'rgba(128,97,255,0.55)' : 'rgba(10,6,18,0.13)'}`,
                  background: on ? 'rgba(128,97,255,0.08)' : '#fff',
                  color: on ? '#0a0612' : 'rgba(10,6,18,0.58)',
                  fontSize: isMobile ? 13 : 14, fontWeight: on ? 700 : 500,
                  cursor: 'pointer', fontFamily: "'Rubik',sans-serif",
                  transition: 'all 0.15s ease',
                }}>
                  <span style={{ fontSize: 15 }}>{n.e}</span>
                  {n.l}
                </button>
              )
            })}
          </div>
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={() => fake(next)} />
        </div>
      )

      /* ── 4: Platforms ── */
      case 4: return (
        <div>
          <span style={pillStyle}>Your presence</span>
          <h2 style={h2Style}>Which platforms are you on?</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
            gap: isMobile ? 8 : 10,
            marginBottom: 24,
          }}>
            {PLATFORMS.map(p => {
              const on = data.platforms.includes(p.id)
              return (
                <button key={p.id} onClick={() => togglePlat(p.id)} style={{
                  padding: isMobile ? '12px 10px' : '14px 16px',
                  borderRadius: 12,
                  border: `1.5px solid ${on ? 'rgba(128,97,255,0.50)' : 'rgba(10,6,18,0.11)'}`,
                  background: on ? 'rgba(128,97,255,0.07)' : '#fff',
                  display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10,
                  cursor: 'pointer', fontFamily: "'Rubik',sans-serif",
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 4px rgba(10,6,18,0.05)',
                }}>
                  <span style={{ fontSize: isMobile ? 18 : 20, flexShrink: 0 }}>{p.icon}</span>
                  <span style={{
                    fontSize: isMobile ? 13 : 14, fontWeight: on ? 700 : 500,
                    color: on ? '#0a0612' : 'rgba(10,6,18,0.55)',
                  }}>{p.label}</span>
                  {on && <span style={{ marginLeft: 'auto', color: '#8061ff', fontSize: 13 }}>✓</span>}
                </button>
              )
            })}
          </div>
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={() => fake(next)} />
        </div>
      )

      /* ── 5: Earnings ── */
      case 5: return (
        <div>
          <span style={pillStyle}>Just for you</span>
          <h2 style={h2Style}>What's your total audience size?</h2>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 8, marginBottom: 16,
          }}>
            {RANGES.map(r => {
              const on = data.followerRange === r.v
              return (
                <button key={r.v} onClick={() => set({ followerRange: r.v, earn: r.earn })} style={{
                  padding: isMobile ? '11px 8px' : '13px 10px',
                  borderRadius: 10,
                  border: `1.5px solid ${on ? 'rgba(128,97,255,0.55)' : 'rgba(10,6,18,0.11)'}`,
                  background: on ? 'rgba(128,97,255,0.07)' : '#fff',
                  color: on ? '#0a0612' : 'rgba(10,6,18,0.55)',
                  fontWeight: on ? 700 : 500,
                  fontSize: isMobile ? 13 : 14,
                  cursor: 'pointer', fontFamily: "'Rubik',sans-serif",
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 4px rgba(10,6,18,0.04)',
                }}>
                  {r.l}
                </button>
              )
            })}
          </div>

          {data.followerRange && (
            <div style={{
              borderRadius: 12,
              border: '1.5px solid rgba(128,97,255,0.18)',
              background: 'rgba(128,97,255,0.04)',
              padding: isMobile ? '16px' : '20px',
              marginBottom: 18,
              animation: 'fadeUp 0.4s ease forwards',
            }}>
              <p style={{ color: 'rgba(10,6,18,0.42)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Your earning potential
              </p>
              <p style={{ color: '#0a0612', fontWeight: 900, fontSize: isMobile ? 24 : 28, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {data.earn}
              </p>
              <p style={{ color: 'rgba(10,6,18,0.38)', fontSize: 12, marginTop: 6 }}>per month · based on creators like you</p>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: isMobile ? 10 : 16 }}>
                {['3× more brand deals', 'Inbound inquiries', 'Pro first impression'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: '#8061ff', fontSize: 12 }}>✓</span>
                    <span style={{ color: 'rgba(10,6,18,0.48)', fontSize: 11 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={() => fake(next)} />
        </div>
      )

      /* ── 6: Profile photo ── */
      case 6: return (
        <div>
          <span style={pillStyle}>Your face, your brand</span>
          <h2 style={h2Style}>Upload a profile photo</h2>
          <p style={subStyle}>Profiles with photos get 4× more brand views.</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: isMobile ? 100 : 116, height: isMobile ? 100 : 116,
                borderRadius: '50%', cursor: 'pointer',
                background: data.profilePic ? 'transparent' : 'rgba(128,97,255,0.06)',
                border: `2px dashed ${data.profilePic ? 'transparent' : 'rgba(128,97,255,0.28)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                outline: data.profilePic ? '3px solid rgba(128,97,255,0.30)' : 'none',
                outlineOffset: 3, transition: 'all 0.2s ease',
              }}
            >
              {data.profilePic
                ? <img src={data.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                    <div style={{ color: 'rgba(10,6,18,0.32)', fontSize: 11 }}>Click to upload</div>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
            <button onClick={() => fileRef.current?.click()} style={{
              background: 'none', border: '1.5px solid rgba(128,97,255,0.28)',
              borderRadius: 10, padding: '9px 22px',
              color: '#8061ff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Rubik',sans-serif",
              transition: 'all 0.18s ease',
            }}>
              {data.profilePic ? '↑ Change photo' : '↑ Choose photo'}
            </button>
          </div>
          <ContinueBtn disabled={loading} loading={loading} onClick={() => fake(next)} />
          <SkipBtn onClick={next} />
        </div>
      )

      /* ── 7: Social links ── */
      case 7: return (
        <div>
          <span style={pillStyle}>One link to rule them all</span>
          <h2 style={h2Style}>Add your social links</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {SOCIAL_INPUTS.map(s => (
              <div key={s.id}>
                <label style={labelBase}>{s.icon} {s.label}</label>
                <FocusInput
                  value={data.links[s.id] ?? ''}
                  onChange={v => set({ links: { ...data.links, [s.id]: v } })}
                  placeholder={s.ph}
                />
              </div>
            ))}
          </div>
          <ContinueBtn disabled={loading} loading={loading} onClick={() => fake(next)} />
          <SkipBtn onClick={next} />
        </div>
      )

      /* ── 8: Referral ── */
      case 8: return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? 40 : 48, marginBottom: 12, animation: 'bounce 0.6s ease' }}>🎉</div>
          <span style={{ ...pillStyle, textAlign: 'center', display: 'block' }}>Welcome to Creator Nexus</span>
          <h2 style={{ ...h2Style, textAlign: 'center' }}>
            {data.name ? `You're in, ${data.name.split(' ')[0]}!` : "You're in!"}
          </h2>
          <p style={{ ...subStyle, textAlign: 'center', marginBottom: 20 }}>
            Your portfolio is live. Share your referral code and earn coins every time a creator joins.
          </p>
          <div style={{
            borderRadius: 14, border: '1.5px solid rgba(128,97,255,0.18)',
            background: 'rgba(128,97,255,0.04)',
            padding: isMobile ? '18px 16px' : '22px',
            marginBottom: 18,
            animation: 'fadeUp 0.4s ease 0.1s both',
          }}>
            <p style={{ color: 'rgba(10,6,18,0.40)', fontSize: 11, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
              Your referral code
            </p>
            <p style={{ color: '#0a0612', fontWeight: 900, fontSize: isMobile ? 22 : 26, letterSpacing: '0.06em', marginBottom: 14 }}>
              {data.referralCode || '---'}
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#f7f5ff', borderRadius: 10,
              padding: isMobile ? '9px 12px' : '10px 14px',
              marginBottom: 16,
            }}>
              <span style={{
                flex: 1, fontSize: isMobile ? 12 : 13,
                color: '#8061ff', fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                nexfluence.co/r/{data.referralCode}
              </span>
              <button
                onClick={() => { navigator.clipboard.writeText(`nexfluence.co/r/${data.referralCode}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{
                  background: copied ? 'rgba(128,97,255,0.15)' : 'linear-gradient(90deg,#ff33bc,#8061ff)',
                  border: 'none', borderRadius: 8, padding: '7px 12px',
                  color: copied ? '#8061ff' : '#fff',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  fontFamily: "'Rubik',sans-serif", transition: 'all 0.2s ease',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
              {[['10 🪙', 'per signup'], ['25 🪙', 'on upgrade']].map(([n, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: isMobile ? 18 : 20, color: '#ff33bc' }}>{n}</div>
                  <div style={{ color: 'rgba(10,6,18,0.40)', fontSize: 11, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <Link href="/dashboard" style={{
            display: 'block', padding: '15px 24px', borderRadius: 10,
            background: '#C8F135', color: '#0a0612',
            fontSize: 15, fontWeight: 700,
            textDecoration: 'none', textAlign: 'center',
            transition: 'all 0.18s ease',
            animation: 'fadeUp 0.4s ease 0.25s both',
          }}>
            Go to my dashboard →
          </Link>
        </div>
      )

      default: return null
    }
  }

  /* ── SSR guard: don't render until we know the breakpoint ── */
  if (w === 0) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Rubik', sans-serif", background: '#fff' }}>

      {/* ── LEFT white panel ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>

        {/* ── Nav ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: navPad,
          borderBottom: '1px solid rgba(10,6,18,0.06)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10 }}>
            <div style={{
              width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #ff33bc, #8061ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 12px rgba(128,97,255,0.28)',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: isMobile ? 15 : 17, letterSpacing: '-0.03em' }}>N</span>
            </div>
            {!isMobile && (
              <div>
                <div style={{ color: '#0a0612', fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em', lineHeight: 1 }}>Creator Nexus</div>
                <div style={{ color: '#ff7ac3', fontWeight: 500, fontSize: 11 }}>by Nexfluence</div>
              </div>
            )}
            {isMobile && (
              <span style={{ color: '#0a0612', fontWeight: 700, fontSize: 15, letterSpacing: '-0.03em' }}>Creator Nexus</span>
            )}
          </div>

          {/* Sign in / Sign up toggle */}
          <p style={{ color: 'rgba(10,6,18,0.42)', fontSize: isMobile ? 12 : 13, margin: 0 }}>
            {mode === 'signup'
              ? <>{isMobile ? '' : 'Already have an account? '}<button onClick={() => { setMode('login'); setStep(1); setAnimKey(k => k + 1) }}
                  style={{ background: 'none', border: 'none', color: '#0a0612', fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? 12 : 13, fontFamily: "'Rubik',sans-serif" }}>
                  Sign in</button></>
              : <>{isMobile ? '' : "Don't have an account? "}<button onClick={() => { setMode('signup'); setStep(1); setAnimKey(k => k + 1) }}
                  style={{ background: 'none', border: 'none', color: '#0a0612', fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? 12 : 13, fontFamily: "'Rubik',sans-serif" }}>
                  Sign up free</button></>
            }
          </p>
        </nav>

        {/* ── Progress bar ── */}
        <div style={{
          padding: isMobile ? '14px 16px 0' : isTablet ? '16px 28px 0' : '18px 48px 0',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {step > 1 && (
            <button onClick={back} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(10,6,18,0.32)', fontSize: 18, padding: 0, lineHeight: 1,
              flexShrink: 0, transition: 'color 0.18s ease',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0a0612')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(10,6,18,0.32)')}
            >←</button>
          )}
          <div style={{ flex: 1, height: 3, background: 'rgba(10,6,18,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, background: '#0a0612',
              width: `${progress}%`,
              transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          </div>
        </div>

        {/* ── Form area ── */}
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'flex-start', justifyContent: 'center',
          padding: formPad,
          overflowY: 'auto',
        }}>
          <div style={{ width: '100%', maxWidth: maxForm }}>
            <div key={animKey} style={{ animation: 'fadeUp 0.32s ease forwards' }}>
              {renderStep()}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT dark panel — desktop only ── */}
      {isDesktop && <RightPanel step={step} />}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          40%  { transform: translateY(-10px); }
          70%  { transform: translateY(-5px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(10,6,18,0.26); }
        input[type="text"]:focus,
        input[type="email"]:focus,
        input[type="password"]:focus { outline: none; }
      `}</style>
    </div>
  )
}