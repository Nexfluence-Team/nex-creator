'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setToken } from '../../lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

/* ─── Design tokens (Nexfluence Design System v4) ────────────────────── */
const C = {
  bg:         '#ffffff',
  bgSub:      '#f5f3ff',
  bgCard:     '#ede9ff',
  bgPage:     '#f8f7ff',
  ink:        '#0a0612',
  inkDim:     'rgba(10,6,18,0.50)',
  inkDim2:    'rgba(10,6,18,0.72)',
  inkFaint:   'rgba(10,6,18,0.28)',
  primary:    '#8b31e8',
  primaryLt:  '#b44af0',
  primaryMd:  '#a03be8',
  primaryBg:  'rgba(139,49,232,0.08)',
  grad:       'linear-gradient(90deg, #8b31e8, #b44af0)',
  gradD:      'linear-gradient(135deg, #8b31e8, #b44af0)',
  gradSoft:   'linear-gradient(135deg, rgba(139,49,232,0.12), rgba(180,74,240,0.06))',
  gradText:   'linear-gradient(90deg, #8b31e8, #b44af0)',
  rXs:        6, rSm: 10, rMd: 14, rLg: 20, rXl: 28,
  border:     '1px solid rgba(139,49,232,0.16)',
  borderH:    '1px solid rgba(139,49,232,0.45)',
  borderS:    '1px solid rgba(139,49,232,0.28)',
  cardBg:     'rgba(139,49,232,0.04)',
  cardBgM:    'rgba(139,49,232,0.08)',
  cardBgA:    'rgba(139,49,232,0.10)',
  shadowSm:   '0 2px 12px rgba(139,49,232,0.10)',
  shadowMd:   '0 8px 32px rgba(139,49,232,0.14)',
  shadowLg:   '0 20px 60px rgba(139,49,232,0.18)',
  shadowCard: '0 4px 24px rgba(10,6,18,0.07)',
  font:       "'Rubik', sans-serif",
} as const

/* ─── Breakpoint hook ────────────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const update = () => setW(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return { isMobile: w > 0 && w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024, w }
}

/* ─── Types & Data (unchanged) ───────────────────────────────────────── */
type Mode = 'signup' | 'login'
interface SignupData {
  email: string; password: string; showPass: boolean
  otp: string[]; name: string; niches: string[]; otherNiche: string
  platforms: string[]; followerRange: string; earn: string
  profilePic: string | null; profileFile: File | null
  links: Record<string, string>
}
const NICHES = [
  { e: '💄', l: 'Beauty' },    { e: '👗', l: 'Fashion' }, { e: '✨', l: 'Lifestyle' },
  { e: '🍽️', l: 'Food & Drink' }, { e: '🏋️', l: 'Fitness' },  { e: '✈️', l: 'Travel' },
  { e: '📱', l: 'Tech' },      { e: '🏠', l: 'Home' }, { e: '💊', l: 'Wellness' },  { e: '🎮', l: 'Gaming' },
]
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' }, { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' }, { id: 'linkedin', label: 'LinkedIn' },
  { id: 'pinterest', label: 'Pinterest' }, { id: 'x', label: 'X / Twitter' },
]
const RANGES = [
  { l: '0 – 5K', v: '0-5k', earn: '€50 – €150' }, { l: '5K – 20K', v: '5k-20k', earn: '€150 – €400' },
  { l: '20K – 50K', v: '20k-50k', earn: '€400 – €900' }, { l: '50K – 100K', v: '50k-100k', earn: '€900 – €2,000' },
  { l: '100K – 500K', v: '100k-500k', earn: '€2,000 – €6,000' }, { l: '500K+', v: '500k+', earn: '€6,000+' },
]
const SOCIAL_INPUTS = [
  { id: 'instagram', icon: '📸', label: 'Instagram', ph: 'instagram.com/yourhandle' },
  { id: 'tiktok', icon: '🎵', label: 'TikTok', ph: 'tiktok.com/@yourhandle' },
  { id: 'youtube', icon: '▶️', label: 'YouTube', ph: 'youtube.com/@yourchannel' },
  { id: 'linkedin', icon: '💼', label: 'LinkedIn', ph: 'linkedin.com/in/yourname' },
]
const QUOTES: Record<number, { text: string; author: string; role: string }> = {
  1: { text: 'Setup took 10 minutes and it already looks more pro than my Linktree.', author: 'Cindy W.',  role: 'Skincare Creator · Riga' },
  2: { text: 'The OTP flow is seamless — I was in within seconds.',                   author: 'Jake M.',   role: 'Fitness Creator · Tallinn' },
  3: { text: 'I went from awkward DMs to a legit inquiry form overnight.',             author: 'Priya K.',  role: 'Fashion Creator · Vilnius' },
  4: { text: 'I connected Instagram and TikTok in one click. Done.',                   author: 'Marta L.',  role: 'Travel Creator · Riga' },
  5: { text: 'I had no idea I could earn this much. The numbers blew me away.',        author: 'Sophie T.', role: 'Lifestyle Creator · Jūrmala' },
  6: { text: 'A great photo makes brands stop and actually read your page.',           author: 'Elena V.',  role: 'Beauty Creator · Tallinn' },
  7: { text: 'The custom domain made it feel like a real brand — because it is.',      author: 'Darius K.', role: 'Tech Creator · Kaunas' },
  8: { text: 'My portfolio went live in under 15 minutes. Brands started messaging the same day.', author: 'Anna B.', role: 'Food Creator · Riga' },
}
const STEP_COUNT = 8

/* ─── Shared primitives ──────────────────────────────────────────────── */
const inputBase: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: C.bgSub,
  border: C.border,
  borderRadius: C.rSm,
  color: C.ink,
  fontSize: 15,
  outline: 'none',
  fontFamily: C.font,
  transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
}

const labelBase: React.CSSProperties = {
  display: 'block',
  color: C.inkDim,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  marginBottom: 7,
  fontFamily: C.font,
}

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
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            ...inputBase,
            padding: '13px 16px',
            paddingRight: suffix ? 52 : 16,
            background: focus ? C.bg : C.bgSub,
            borderColor: focus ? C.primary : 'rgba(139,49,232,0.16)',
            boxShadow: focus ? '0 0 0 3px rgba(139,49,232,0.10)' : 'none',
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

function FocusInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  const [focus, setFocus] = useState(false)
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        ...inputBase,
        padding: '13px 16px',
        background: focus ? C.bg : C.bgSub,
        borderColor: focus ? C.primary : 'rgba(139,49,232,0.16)',
        boxShadow: focus ? '0 0 0 3px rgba(139,49,232,0.10)' : 'none',
      }}
    />
  )
}

function OTPRow({ value, onChange, isMobile }: {
  value: string[]; onChange: (v: string[]) => void; isMobile: boolean
}) {
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
  const boxW = isMobile ? 40 : 48
  const boxH = isMobile ? 48 : 56
  return (
    <div style={{ display: 'flex', gap: isMobile ? 6 : 8, justifyContent: 'flex-start' }}>
      {value.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handle(i, e.target.value)}
          onKeyDown={e => onKey(i, e)}
          onFocus={() => setF(i, true)}
          onBlur={() => setF(i, false)}
          style={{
            width: boxW,
            height: boxH,
            flexShrink: 0,
            textAlign: 'center',
            fontSize: isMobile ? 16 : 20,
            fontWeight: 800,
            background: d ? 'rgba(139,49,232,0.06)' : C.bgSub,
            border: `1.5px solid ${foci[i] ? C.primary : d ? 'rgba(139,49,232,0.40)' : 'rgba(139,49,232,0.18)'}`,
            borderRadius: C.rSm,
            color: C.ink,
            outline: 'none',
            fontFamily: C.font,
            boxShadow: foci[i] ? '0 0 0 3px rgba(139,49,232,0.10)' : 'none',
            transition: 'all 0.15s ease',
          }}
        />
      ))}
    </div>
  )
}

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
          display: 'block',
          width: '100%',
          padding: '15px 24px',
          borderRadius: C.rSm,
          border: 'none',
          background: disabled ? 'rgba(139,49,232,0.18)' : C.grad,
          color: disabled ? 'rgba(10,6,18,0.38)' : '#ffffff',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '0.04em',
          fontFamily: C.font,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
          opacity: hov && !disabled ? 0.88 : 1,
          transform: hov && !disabled ? 'translateY(-2px)' : 'none',
          boxShadow: hov && !disabled ? C.shadowMd : disabled ? 'none' : C.shadowSm,
        }}
      >
        {loading ? <Spinner /> : label}
      </button>
      {!disabled && (
        <p style={{ textAlign: 'center', color: C.inkFaint, fontSize: 12, marginTop: 10, fontFamily: C.font }}>
          Or press enter to continue
        </p>
      )}
    </>
  )
}

function SkipBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <p style={{ textAlign: 'center', marginTop: 12 }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: 'none', border: 'none', color: hov ? C.inkDim2 : C.inkFaint,
          fontSize: 13, cursor: 'pointer', fontFamily: C.font, transition: 'color 0.18s ease',
          padding: '4px 8px',
        }}
      >
        Skip for now
      </button>
    </p>
  )
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span style={{
      display: 'inline-block', width: 16, height: 16,
      border: `2px solid ${dark ? 'rgba(10,6,18,0.18)' : 'rgba(255,255,255,0.30)'}`,
      borderTopColor: dark ? C.ink : '#fff', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', verticalAlign: 'middle',
    }} />
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(139,49,232,0.07)', border: '1px solid rgba(139,49,232,0.25)',
      borderRadius: C.rSm, padding: '12px 16px', marginBottom: 16,
      fontSize: 13, color: '#5b1fa8', fontWeight: 500, fontFamily: C.font,
    }}>
      {msg}
    </div>
  )
}

function InstagramOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function TikTokOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

function ComingSoonSocialBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button type="button" disabled style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '12px 18px', borderRadius: C.rSm, width: '100%', border: C.border,
      background: C.bgSub, color: 'rgba(10,6,18,0.38)', fontSize: 14, fontWeight: 700,
      cursor: 'not-allowed', fontFamily: C.font,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      {label}
      <span style={{
        marginLeft: 'auto', fontSize: 10, fontWeight: 600, background: 'rgba(139,49,232,0.10)',
        color: C.inkDim, padding: '2px 8px', borderRadius: C.rXs, letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>Soon</span>
    </button>
  )
}

/* ─── Step Dots (no numbers) ────────────────────────────────────────── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isCompleted = stepNum < current
        return (
          <div
            key={stepNum}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isActive || isCompleted ? C.gradD : 'rgba(139,49,232,0.20)',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? C.shadowSm : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

/* ─── Review Card (replaces right panel) ────────────────────────────── */
// COMMENTED OUT - Customer review card (hidden but kept for future)
/*
function ReviewCard({ step, avatarUrl }: { step: number; avatarUrl?: string }) {
  const q = QUOTES[step] ?? QUOTES[1]
  return (
    <div style={{
      marginTop: 32,
      borderRadius: C.rLg,
      background: '#ffffff',
      boxShadow: C.shadowCard,
      padding: 24,
      border: '1px solid rgba(139,49,232,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      </div>
      <p style={{
        fontSize: 16, lineHeight: 1.5, color: C.inkDim2,
        marginBottom: 20, fontFamily: C.font,
      }}>
        {q.text}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
          background: avatarUrl ? 'transparent' : C.gradD,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: C.shadowSm,
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={q.author} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          ) : (
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{q.author[0]}</span>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: C.ink }}>{q.author}</div>
          <div style={{ fontSize: 12, color: C.inkDim }}>{q.role}</div>
        </div>
      </div>
    </div>
  )
}
*/

/* ─── OTP friendly errors ────────────────────────────────────────────── */
function friendlyOtpError(msg: string): string {
  if (!msg) return msg
  const lower = msg.toLowerCase()
  if (lower.includes('invalid request data') || lower.includes('invalid request'))
    return 'Incorrect code — please check and try again.'
  if (lower.includes('expired'))
    return 'This code has expired — request a new one.'
  return msg
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function AuthPage() {
  const router = useRouter()
  const { isMobile, isTablet, isDesktop, w } = useBreakpoint()
  const [mode, setMode]             = useState<Mode>('signup')
  const [step, setStep]             = useState(1)
  const [animKey, setAnimKey]       = useState(0)
  const [loading, setLoading]       = useState(false)
  const [resend, setResend]         = useState(0)
  const [error, setError]           = useState('')
  const [pendingToken, setPendingToken] = useState('')
  const [accessToken, setAccessToken]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<SignupData>({
    email: '', password: '', showPass: false,
    otp: ['', '', '', '', '', ''],
    name: '', niches: [], otherNiche: '',
    platforms: [], followerRange: '', earn: '',
    profilePic: null, profileFile: null,
    links: { instagram: '', tiktok: '', youtube: '', linkedin: '' },
  })
  const set = (patch: Partial<SignupData>) => setData(d => ({ ...d, ...patch }))

  useEffect(() => {
    if (resend <= 0) return
    const id = setInterval(() => setResend(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [resend])

  const goTo = (n: number) => { setAnimKey(k => k + 1); setStep(n); setError('') }
  const next  = () => goTo(step + 1)
  const back  = () => goTo(step - 1)
  const maxStep  = mode === 'login' ? 1 : STEP_COUNT
  const progress = (step / maxStep) * 100

  const toggleNiche = (l: string) =>
    set({ niches: data.niches.includes(l) ? data.niches.filter(x => x !== l) : [...data.niches, l] })
  const togglePlat = (id: string) =>
    set({ platforms: data.platforms.includes(id) ? data.platforms.filter(x => x !== id) : [...data.platforms, id] })

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    set({ profileFile: file })
    const r = new FileReader()
    r.onload = ev => set({ profilePic: ev.target?.result as string })
    r.readAsDataURL(file)
  }

  const canContinue = (): boolean => {
    if (step === 1) return !!data.email && data.password.length >= 6
    if (step === 2) return data.otp.every(d => d !== '')
    if (step === 3) {
      const hasValidNiche = data.niches.some(n => n !== '__other__') ||
        (data.niches.includes('__other__') && !!data.otherNiche.trim())
      return !!data.name && data.niches.length > 0 && hasValidNiche
    }
    if (step === 4) return data.platforms.length > 0
    if (step === 5) return !!data.followerRange
    return true
  }

  const authHeader = () => ({ Authorization: `Bearer ${accessToken}` })

  /* ── API handlers — unchanged ── */
  const handleStep1 = async () => {
    setLoading(true); setError('')
    try {
      const endpoint = mode === 'signup' ? '/auth/register' : '/auth/login'
      const res  = await fetch(`${API}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      if (mode === 'login' && json.data.requiresOtp === false) {
        setToken(json.data.accessToken); router.push('/dashboard'); return
      }
      setPendingToken(json.data.pendingToken); next(); setResend(30)
    } catch { setError('Connection error. Make sure the server is running.') }
    finally { setLoading(false) }
  }
  const handleVerifyOTP = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
        body: JSON.stringify({ otp: data.otp.join('') }), credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) { setError(friendlyOtpError(json.message)); return }
      const token = json.data.accessToken
      setToken(token); setAccessToken(token); next()
    } catch { setError('Connection error. Please try again.') }
    finally { setLoading(false) }
  }
  const handleResend = async () => {
    setError('')
    try {
      const res  = await fetch(`${API}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
        body: JSON.stringify({ email: data.email }),
      })
      const json = await res.json()
      if (!json.success) { setError(friendlyOtpError(json.message)); return }
      setPendingToken(json.data.pendingToken); set({ otp: Array(6).fill('') }); setResend(30)
    } catch { setError('Could not resend. Please try again.') }
  }
  const handleStep3 = async () => {
    setLoading(true); setError('')
    try {
      const nichesToSend = data.niches
        .map(n => n === '__other__' ? data.otherNiche.trim() : n).filter(Boolean)
      const res  = await fetch(`${API}/profile/header`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ name: data.name, niches: nichesToSend }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      next()
    } catch { setError('Could not save. Please try again.') }
    finally { setLoading(false) }
  }
  const handleStep4 = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/profile/header`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ platforms: data.platforms }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      next()
    } catch { setError('Could not save. Please try again.') }
    finally { setLoading(false) }
  }
  const handleStep5 = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/profile/header`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ followerRange: data.followerRange }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      next()
    } catch { setError('Could not save. Please try again.') }
    finally { setLoading(false) }
  }
  const handleStep6 = async () => {
    if (!data.profileFile) { next(); return }
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', data.profileFile)
      form.append('type', 'profilePic')
      const res  = await fetch(`${API}/media/upload`, {
        method: 'POST', headers: { ...authHeader() }, body: form,
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      set({ profilePic: json.data.url }); next()
    } catch { setError('Upload failed. Please try again.') }
    finally { setLoading(false) }
  }
  const handleStep7 = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/links`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ links: data.links }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      next()
    } catch { setError('Could not save links. Please try again.') }
    finally { setLoading(false) }
  }

  /* ── responsive layout values ── */
  const barPad   = isMobile ? '12px 0 0' : isTablet ? '14px 0 0' : '16px 0 0'
  const formPad  = isMobile ? '28px 20px'  : isTablet ? '40px 32px'  : '48px 48px'
  const maxForm  = isMobile ? '100%' : isTablet ? '560px' : '480px'
  const h2Size   = isMobile ? 22 : isTablet ? 28 : 30

  const h2Style: React.CSSProperties = {
    color: C.ink,
    fontWeight: 900,
    fontSize: h2Size,
    letterSpacing: '-0.035em',
    lineHeight: 1.1,
    marginBottom: 20,
    fontFamily: C.font,
  }
  const subStyle: React.CSSProperties = {
    color: C.inkDim,
    fontSize: isMobile ? 13 : 14,
    lineHeight: 1.7,
    marginBottom: 22,
    fontFamily: C.font,
  }

  /* ── Steps (no PillLabel on step 1) ── */
  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div>
          <h2 style={h2Style}>
            {mode === 'login' ? 'Sign in to Creator Nexus' : 'Start Your Journey'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            <ComingSoonSocialBtn icon={<InstagramOutlineIcon />}
              label={`${mode === 'login' ? 'Sign in' : 'Continue'} with Instagram`} />
            <ComingSoonSocialBtn icon={<TikTokOutlineIcon />}
              label={`${mode === 'login' ? 'Sign in' : 'Continue'} with TikTok`} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(139,49,232,0.14)' }} />
            <span style={{ color: C.inkFaint, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(139,49,232,0.14)' }} />
          </div>
          <ErrorMsg msg={error} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
            <LightInput label="Email address" type="email" value={data.email}
              onChange={v => set({ email: v })} placeholder="you@email.com" />
            <LightInput label="Password" type={data.showPass ? 'text' : 'password'}
              value={data.password} onChange={v => set({ password: v })}
              placeholder="Min. 6 characters"
              suffix={
                <button type="button" onClick={() => set({ showPass: !data.showPass })} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.inkDim, fontSize: 12, fontFamily: C.font, fontWeight: 600,
                  transition: 'color 0.15s',
                }}>
                  {data.showPass ? 'Hide' : 'Show'}
                </button>
              }
            />
          </div>
          <ContinueBtn
            disabled={!canContinue()} loading={loading}
            onClick={handleStep1}
            label={mode === 'login' ? 'Sign in →' : 'Create account →'}
          />
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: C.inkFaint, fontFamily: C.font }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setStep(1); setAnimKey(k => k + 1); setError('') }}
              style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: C.font }}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      )

      case 2: return (
        <div>
          <h2 style={h2Style}>Enter the 6-digit code</h2>
          <p style={subStyle}>
            Sent to <span style={{ color: C.primary, fontWeight: 600 }}>{data.email}</span>
          </p>
          <ErrorMsg msg={error} />
          <div style={{ marginBottom: 22 }}>
            <OTPRow value={data.otp} isMobile={isMobile} onChange={otp => {
                set({ otp })
                if (otp.every(d => d !== '')) handleVerifyOTP()
              }} />
          </div>
          {loading
            ? <div style={{ textAlign: 'center', padding: 12 }}><Spinner dark /></div>
            : <ContinueBtn disabled={!canContinue()} loading={false} onClick={handleVerifyOTP} label="Verify & continue →" />
          }
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: C.inkFaint, fontFamily: C.font }}>
            {resend > 0
              ? <>Resend in <span style={{ color: C.primary, fontWeight: 600 }}>{resend}s</span></>
              : <button onClick={handleResend} style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: C.font }}>Resend code</button>
            }
          </p>
        </div>
      )

      case 3: return (
        <div>
          <h2 style={h2Style}>What type of content do you create?</h2>
          <div style={{ marginBottom: 18 }}>
            <LightInput label="Your full name" value={data.name} onChange={v => set({ name: v })} placeholder="Sophie Thomas" />
          </div>
          <label style={labelBase}>Content niches — pick all that apply</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: data.niches.includes('__other__') ? 12 : 24 }}>
            {NICHES.map(n => {
              const on = data.niches.includes(n.l)
              return (
                <button key={n.l} onClick={() => toggleNiche(n.l)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: isMobile ? '7px 12px' : '7px 16px', borderRadius: C.rSm,
                  border: on ? '1px solid transparent' : C.border,
                  background: on ? C.grad : C.bg, color: on ? '#ffffff' : C.inkDim,
                  fontSize: isMobile ? 13 : 14, fontWeight: on ? 700 : 500,
                  cursor: 'pointer', fontFamily: C.font, transition: 'all 0.15s ease',
                }}><span style={{ fontSize: 15 }}>{n.e}</span>{n.l}</button>
              )
            })}
            {(() => {
              const on = data.niches.includes('__other__')
              return (
                <button onClick={() => toggleNiche('__other__')} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: isMobile ? '7px 12px' : '7px 16px', borderRadius: C.rSm,
                  border: on ? '1px solid transparent' : C.border,
                  background: on ? C.grad : C.bg, color: on ? '#ffffff' : C.inkDim,
                  fontSize: isMobile ? 13 : 14, fontWeight: on ? 700 : 500,
                  cursor: 'pointer', fontFamily: C.font, transition: 'all 0.15s ease',
                }}>+ Other</button>
              )
            })()}
          </div>
          {data.niches.includes('__other__') && (
            <div style={{ marginBottom: 24, animation: 'fadeUp 0.25s ease forwards' }}>
              <LightInput label="What's your niche?" value={data.otherNiche} onChange={v => set({ otherNiche: v })} placeholder="e.g. DIY Crafts, Motorsport, Parenting…" />
            </div>
          )}
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleStep3} />
        </div>
      )

      case 4: return (
        <div>
          <h2 style={h2Style}>Which platforms are you on?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 8 : 10, marginBottom: 24 }}>
            {PLATFORMS.map(p => {
              const on = data.platforms.includes(p.id)
              return (
                <button key={p.id} onClick={() => togglePlat(p.id)} style={{
                  padding: isMobile ? '12px 10px' : '14px 16px', borderRadius: C.rMd,
                  border: on ? '1px solid transparent' : C.border,
                  background: on ? C.grad : C.bgSub, color: on ? '#ffffff' : C.inkDim,
                  fontSize: isMobile ? 13 : 14, fontWeight: on ? 700 : 500,
                  cursor: 'pointer', fontFamily: C.font, transition: 'all 0.15s ease',
                  boxShadow: on ? C.shadowSm : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>{p.label}</span>
                  {on && <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: C.primaryMd, fontWeight: 900, flexShrink: 0 }}>✓</span>}
                </button>
              )
            })}
          </div>
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleStep4} />
        </div>
      )

      case 5: return (
        <div>
          <h2 style={h2Style}>What's your total follower count?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {RANGES.map(r => {
              const on = data.followerRange === r.v
              return (
                <button key={r.v} onClick={() => set({ followerRange: r.v, earn: r.earn })} style={{
                  padding: isMobile ? '11px 8px' : '13px 10px', borderRadius: C.rSm,
                  border: on ? `1px solid ${C.primary}` : C.border,
                  background: on ? C.cardBgM : C.bgSub, color: on ? C.ink : C.inkDim,
                  fontWeight: on ? 700 : 500, fontSize: isMobile ? 13 : 14,
                  cursor: 'pointer', fontFamily: C.font, transition: 'all 0.15s ease',
                  boxShadow: on ? C.shadowSm : 'none',
                }}>{r.l}</button>
              )
            })}
          </div>
          {data.followerRange && (
            <div style={{ borderRadius: C.rLg, border: '1px solid rgba(139,49,232,0.18)', background: C.cardBg, padding: isMobile ? 16 : 20, marginBottom: 18, position: 'relative', overflow: 'hidden', boxShadow: C.shadowCard }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgba(180,74,240,0.55), transparent)` }} />
              <p style={{ color: C.inkDim, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6, fontFamily: C.font }}>Your earning potential</p>
              <p style={{ color: C.ink, fontWeight: 900, fontSize: isMobile ? 26 : 30, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: C.font }}>{data.earn}</p>
              <p style={{ color: C.inkDim, fontSize: 12, marginTop: 6, fontFamily: C.font }}>per month · based on creators like you</p>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {['3× more brand deals', 'Inbound inquiries', 'Pro first impression'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: C.primary, fontSize: 12 }}>✓</span><span style={{ color: C.inkDim, fontSize: 11, fontFamily: C.font }}>{t}</span></div>
                ))}
              </div>
            </div>
          )}
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleStep5} />
        </div>
      )

      case 6: return (
        <div>
          <h2 style={h2Style}>Upload a profile photo</h2>
          <p style={subStyle}>Profiles with photos get 4× more brand views.</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: isMobile ? 100 : 116, height: isMobile ? 100 : 116, borderRadius: '50%', cursor: 'pointer',
              background: data.profilePic ? 'transparent' : C.bgCard,
              border: `2px dashed ${data.profilePic ? 'transparent' : 'rgba(139,49,232,0.28)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              outline: data.profilePic ? `3px solid rgba(139,49,232,0.30)` : 'none', outlineOffset: 3,
              transition: 'all 0.2s ease', boxShadow: data.profilePic ? C.shadowMd : 'none',
            }}>
              {data.profilePic ? <img src={data.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center' }}><div style={{ fontSize: 24, marginBottom: 4 }}>📷</div><div style={{ color: C.inkDim, fontSize: 11, fontFamily: C.font }}>Click to upload</div></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
            <button onClick={() => fileRef.current?.click()} style={{ background: 'none', border: '1.5px solid rgba(139,49,232,0.30)', borderRadius: C.rSm, padding: '9px 22px', color: C.primary, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: C.font, transition: 'border-color 0.15s, box-shadow 0.15s' }}>{data.profilePic ? '↑ Change photo' : '↑ Choose photo'}</button>
          </div>
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={loading} loading={loading} onClick={handleStep6} />
          <SkipBtn onClick={next} />
        </div>
      )

      case 7: return (
        <div>
          <h2 style={h2Style}>Add your social links</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {SOCIAL_INPUTS.map(s => (
              <div key={s.id}>
                <label style={labelBase}>{s.icon} {s.label}</label>
                <FocusInput value={data.links[s.id] ?? ''} onChange={v => set({ links: { ...data.links, [s.id]: v } })} placeholder={s.ph} />
              </div>
            ))}
          </div>
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={loading} loading={loading} onClick={handleStep7} />
          <SkipBtn onClick={next} />
        </div>
      )

      case 8: return (
        <div style={{ textAlign: 'center', paddingTop: isMobile ? 8 : 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px', background: 'linear-gradient(135deg, rgba(139,49,232,0.18), rgba(180,74,240,0.10))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 28 : 32, boxShadow: C.shadowLg, animation: 'bounce 0.6s ease' }}>🎉</div>
          <h2 style={{ ...h2Style, textAlign: 'center' }}>{data.name ? `You're in, ${data.name.split(' ')[0]}!` : "You're in!"}</h2>
          <p style={{ ...subStyle, textAlign: 'center', maxWidth: 340, margin: '0 auto 32px' }}>Your creator portfolio is live and ready to share with brands. Start building your profile to attract your first deal.</p>
          <button onClick={() => router.push('/dashboard')} style={{ display: 'block', width: '100%', padding: '15px 24px', borderRadius: C.rSm, background: C.grad, color: '#ffffff', border: 'none', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer', fontFamily: C.font, transition: 'opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease', boxShadow: C.shadowMd, animation: 'fadeUp 0.4s ease 0.15s both' }} onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}>Go to my dashboard →</button>
        </div>
      )

      default: return null
    }
  }

  if (w === 0) return null

  return (
    <div style={{ minHeight: '100vh', background: C.bgPage, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 20 : 32 }}>
      <div style={{ width: '100%', maxWidth: maxForm, margin: '0 auto' }}>

        {/* Logo centered at top – transparent background, no shadow */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: C.rLg,
            overflow: 'hidden',
            background: 'transparent',   // transparent background
            // no box-shadow
          }}>
            <img
              src="/Nex.webp"
              alt="Creator Nexus"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Progress dots (only for signup) */}
        {mode === 'signup' && (
          <div style={{ padding: barPad, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            {step > 1 && (
              <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkFaint, fontSize: 18, padding: '4px 2px', lineHeight: 1, flexShrink: 0, fontFamily: C.font, transition: 'color 0.15s', minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => (e.currentTarget.style.color = C.ink)} onMouseLeave={e => (e.currentTarget.style.color = C.inkFaint)} aria-label="Go back">←</button>
            )}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <StepDots current={step} total={STEP_COUNT} />
            </div>
          </div>
        )}

        {/* Form */}
        <div style={{ background: '#ffffff', borderRadius: C.rLg, boxShadow: C.shadowCard, padding: formPad }}>
          <div key={animKey} style={{ animation: 'fadeUp 0.32s ease forwards' }}>
            {renderStep()}
          </div>
        </div>

        {/* Review card at bottom (only for signup, step 1-7; not on success/login) */}
        {/* COMMENTED OUT - Customer review card (hidden but kept for future)
        {mode === 'signup' && step !== 8 && (
          <ReviewCard step={step} avatarUrl="/people/Cindy.webp" />
        )}
        */}

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}70%{transform:translateY(-5px)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(10,6,18,0.28); font-family: 'Rubik', sans-serif; }
        input:focus { outline: none; }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}