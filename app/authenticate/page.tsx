'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setToken } from '../../lib/auth'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
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
  otp: string[]; name: string; niches: string[]; otherNiche: string
  platforms: string[]; followerRange: string; earn: string
  profilePic: string | null; profileFile: File | null
  links: Record<string, string>
}
/* ─── Data ────────────────────────────────────────────────────────── */
const NICHES = [
  { e: '💄', l: 'Beauty' },    { e: '👗', l: 'Fashion' },
  { e: '✨', l: 'Lifestyle' }, { e: '🍽️', l: 'Food & Drink' },
  { e: '🏋️', l: 'Fitness' },  { e: '✈️', l: 'Travel' },
  { e: '📱', l: 'Tech' },      { e: '🏠', l: 'Home' },
  { e: '💊', l: 'Wellness' },  { e: '🎮', l: 'Gaming' },
]

/* ── Issue 5 fix: icons removed from PLATFORMS ── */
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'x',         label: 'X / Twitter' },
]

/* ── Issue 4 fix: Baltic-realistic earning figures ── */
const RANGES = [
  { l: '0 – 5K',      v: '0-5k',      earn: '€50 – €150' },
  { l: '5K – 20K',    v: '5k-20k',    earn: '€150 – €400' },
  { l: '20K – 50K',   v: '20k-50k',   earn: '€400 – €900' },
  { l: '50K – 100K',  v: '50k-100k',  earn: '€900 – €2,000' },
  { l: '100K – 500K', v: '100k-500k', earn: '€2,000 – €6,000' },
  { l: '500K+',       v: '500k+',     earn: '€6,000+' },
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
  8: { text: '"My portfolio went live in under 15 minutes. Brands started messaging the same day."', author: 'Anna B.', role: 'Food Creator · Riga' },
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
function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(255,51,51,0.06)',
      border: '1.5px solid rgba(255,51,51,0.25)',
      borderRadius: 10, padding: '10px 14px',
      marginBottom: 16, fontSize: 13,
      color: '#cc0000', fontWeight: 500,
    }}>
      {msg}
    </div>
  )
}

/* ── Issue 1 fix: black outline SVG icons ── */
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

/* ── Issue 1 fix: disabled "coming soon" social button ── */
function ComingSoonSocialBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div>
      <button
        type="button"
        disabled
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '12px 18px', borderRadius: 10, width: '100%',
          border: '1.5px solid rgba(10,6,18,0.10)',
          background: 'rgba(10,6,18,0.02)',
          color: 'rgba(10,6,18,0.38)',
          fontSize: 14, fontWeight: 700,
          cursor: 'not-allowed', fontFamily: "'Rubik', sans-serif",
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
        {label}
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontWeight: 600,
          background: 'rgba(10,6,18,0.06)',
          color: 'rgba(10,6,18,0.35)',
          padding: '2px 8px', borderRadius: 20,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          Soon
        </span>
      </button>
    </div>
  )
}

function RightPanel({ step }: { step: number }) {
  const q = QUOTES[step] ?? QUOTES[1]
  return (
    <div style={{
      width: '38%', flexShrink: 0,
      background: 'linear-gradient(160deg, #f7f4ff 0%, #fff0f8 100%)',
      borderLeft: '1px solid rgba(128,97,255,0.12)',
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center',
      padding: '48px 44px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* decorative orbs */}
      <div aria-hidden style={{
        position: 'absolute', top: '-10%', right: '-10%', width: '55%', height: '40%',
        background: 'radial-gradient(ellipse at 70% 30%, rgba(128,97,255,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: '5%', left: '-5%', width: '45%', height: '35%',
        background: 'radial-gradient(ellipse at 30% 70%, rgba(255,51,188,0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      {/* logo mark at top */}
      <div style={{ marginBottom: 48, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
          <img src="/Nex.webp" alt="Creator Nexus" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div>
          <div style={{ color: '#0a0612', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', lineHeight: 1 }}>Creator Nexus</div>
          <div style={{ color: '#ff7ac3', fontWeight: 500, fontSize: 11 }}>by Nexfluence</div>
        </div>
      </div>
      <div key={step} style={{ position: 'relative', zIndex: 1, animation: 'fadeUp 0.45s ease forwards' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
          {[...Array(5)].map((_, i) => <span key={i} style={{ color: '#ff33bc', fontSize: 20 }}>★</span>)}
        </div>
        <p style={{
          color: 'rgba(10,6,18,0.75)', fontSize: 'clamp(15px, 1.5vw, 19px)',
          fontWeight: 500, lineHeight: 1.6, marginBottom: 28, maxWidth: 300,
          fontStyle: 'italic',
        }}>
          {q.text}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #ff33bc, #8061ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff',
            boxShadow: '0 4px 16px rgba(128,97,255,0.28)',
          }}>{q.author[0]}</div>
          <div>
            <div style={{ color: '#0a0612', fontWeight: 700, fontSize: 15 }}>{q.author}</div>
            <div style={{ color: 'rgba(10,6,18,0.45)', fontSize: 13, marginTop: 2 }}>{q.role}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Issue 2 fix: friendly OTP error messages ── */
function friendlyOtpError(msg: string): string {
  if (!msg) return msg
  const lower = msg.toLowerCase()
  if (lower.includes('invalid request data') || lower.includes('invalid request')) {
    return 'Incorrect code — please check and try again.'
  }
  if (lower.includes('expired')) {
    return 'This code has expired — request a new one.'
  }
  return msg
}

/* ─── Main Page ───────────────────────────────────────────────────── */
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
  /* ── Issue 3 fix: canContinue updated for "Other" niche ── */
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
  /* ── Step 1: Register or Login ── */
  const handleStep1 = async () => {
    setLoading(true); setError('')
    try {
      const endpoint = mode === 'signup' ? '/auth/register' : '/auth/login'
      const res  = await fetch(`${API}${endpoint}`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ email: data.email, password: data.password }),
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      if (mode === 'login' && json.data.requiresOtp === false) {
        setToken(json.data.accessToken)
        router.push('/dashboard')
        return
      }
      setPendingToken(json.data.pendingToken)
      next()
      setResend(30)
    } catch {
      setError('Connection error. Make sure the server is running.')
    } finally {
      setLoading(false)
    }
  }
  /* ── Step 2: Verify OTP — Issue 2 fix: friendly errors ── */
  const handleVerifyOTP = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/auth/verify-otp`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
        body:        JSON.stringify({ otp: data.otp.join('') }),
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) { setError(friendlyOtpError(json.message)); return }
      const token = json.data.accessToken
      setToken(token)
      setAccessToken(token)
      next()
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  /* ── Resend OTP ── */
  const handleResend = async () => {
    setError('')
    try {
      const res  = await fetch(`${API}/auth/resend-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
        body:    JSON.stringify({ email: data.email }),
      })
      const json = await res.json()
      if (!json.success) { setError(friendlyOtpError(json.message)); return }
      setPendingToken(json.data.pendingToken)
      set({ otp: Array(6).fill('') })
      setResend(30)
    } catch {
      setError('Could not resend. Please try again.')
    }
  }
  /* ── Step 3: Name + niches — Issue 3 fix: resolve __other__ before sending ── */
  const handleStep3 = async () => {
    setLoading(true); setError('')
    try {
      const nichesToSend = data.niches
        .map(n => n === '__other__' ? data.otherNiche.trim() : n)
        .filter(Boolean)
      const res  = await fetch(`${API}/profile/header`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({ name: data.name, niches: nichesToSend }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      next()
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  /* ── Step 4: Platforms ── */
  const handleStep4 = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/profile/header`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({ platforms: data.platforms }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      next()
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  /* ── Step 5: Follower range ── */
  const handleStep5 = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/profile/header`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({ followerRange: data.followerRange }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      next()
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  /* ── Step 6: Profile photo ── */
  const handleStep6 = async () => {
    if (!data.profileFile) { next(); return }
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', data.profileFile)
      form.append('type', 'profilePic')
      const res  = await fetch(`${API}/media/upload`, {
        method:  'POST',
        headers: { ...authHeader() },
        body:    form,
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      set({ profilePic: json.data.url })
      next()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  /* ── Step 7: Social links ── */
  const handleStep7 = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API}/links`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body:    JSON.stringify({ links: data.links }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message); return }
      next()
    } catch {
      setError('Could not save links. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  /* ── responsive values ── */
  const navPad  = isMobile ? '14px 16px' : isTablet ? '16px 28px' : '18px 48px'
  const formPad = isMobile ? '24px 16px' : isTablet ? '32px 32px' : '40px 48px'
  const maxForm = isMobile ? '100%' : '480px'
  const h2Size  = isMobile ? 22 : isTablet ? 26 : 30
  const pillSize = isMobile ? 12 : 13
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
      /* ── 1: Account — Issue 1 fix: coming soon buttons with black outline SVG logos ── */
      case 1: return (
        <div>
          <span style={pillStyle}>{mode === 'login' ? 'Welcome back' : 'Create your free account'}</span>
          <h2 style={h2Style}>{mode === 'login' ? 'Sign in to Creator Nexus' : 'Start your creator journey'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
            <ComingSoonSocialBtn
              icon={<InstagramOutlineIcon />}
              label={`${mode === 'login' ? 'Sign in' : 'Continue'} with Instagram`}
            />
            <ComingSoonSocialBtn
              icon={<TikTokOutlineIcon />}
              label={`${mode === 'login' ? 'Sign in' : 'Continue'} with TikTok`}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(10,6,18,0.08)' }} />
            <span style={{ color: 'rgba(10,6,18,0.28)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(10,6,18,0.08)' }} />
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
                  color: 'rgba(10,6,18,0.35)', fontSize: 12,
                  fontFamily: "'Rubik',sans-serif", fontWeight: 600,
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
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'rgba(10,6,18,0.35)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setStep(1); setAnimKey(k => k + 1); setError('') }}
              style={{ background: 'none', border: 'none', color: '#8061ff', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: "'Rubik',sans-serif" }}
            >
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      )
      /* ── 2: OTP (signup only) ── */
      case 2: return (
        <div>
          <span style={pillStyle}>Check your inbox</span>
          <h2 style={h2Style}>Enter the 6-digit code</h2>
          <p style={subStyle}>
            Sent to <span style={{ color: '#8061ff', fontWeight: 600 }}>{data.email}</span>
          </p>
          <ErrorMsg msg={error} />
          <div style={{ marginBottom: 22 }}>
            <OTPRow
              value={data.otp}
              onChange={otp => {
                set({ otp })
                if (otp.every(d => d !== '')) handleVerifyOTP()
              }}
            />
          </div>
          {loading
            ? <div style={{ textAlign: 'center', padding: 12 }}><Spinner dark /></div>
            : <ContinueBtn disabled={!canContinue()} loading={false}
                onClick={handleVerifyOTP} label="Verify & continue →" />
          }
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'rgba(10,6,18,0.35)' }}>
            {resend > 0
              ? <>Resend in <span style={{ color: '#8061ff', fontWeight: 600 }}>{resend}s</span></>
              : <button onClick={handleResend} style={{
                    background: 'none', border: 'none', color: '#8061ff',
                    fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: "'Rubik',sans-serif",
                  }}>Resend code</button>
            }
          </p>
        </div>
      )
      /* ── 3: Identity + niches — Issue 3 fix: "Other" pill + text input ── */
      case 3: return (
        <div>
          <span style={pillStyle}>Help brands find you</span>
          <h2 style={h2Style}>What type of content do you create?</h2>
          <div style={{ marginBottom: 18 }}>
            <LightInput label="Your full name" value={data.name}
              onChange={v => set({ name: v })} placeholder="Sophie Thomas" />
          </div>
          <label style={labelBase}>Content niches — pick all that apply</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: data.niches.includes('__other__') ? 12 : 24 }}>
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
                  <span style={{ fontSize: 15 }}>{n.e}</span>{n.l}
                </button>
              )
            })}
            {/* Other pill */}
            {(() => {
              const on = data.niches.includes('__other__')
              return (
                <button onClick={() => toggleNiche('__other__')} style={{
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
                  + Other
                </button>
              )
            })()}
          </div>
          {/* Conditional text input for "Other" niche */}
          {data.niches.includes('__other__') && (
            <div style={{ marginBottom: 24, animation: 'fadeUp 0.25s ease forwards' }}>
              <LightInput
                label="What's your niche?"
                value={data.otherNiche}
                onChange={v => set({ otherNiche: v })}
                placeholder="e.g. DIY Crafts, Motorsport, Parenting…"
              />
            </div>
          )}
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleStep3} />
        </div>
      )
      /* ── 4: Platforms — Issue 5 fix: icons removed ── */
      case 4: return (
        <div>
          <span style={pillStyle}>Your presence</span>
          <h2 style={h2Style}>Which platforms are you on?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 8 : 10, marginBottom: 24 }}>
            {PLATFORMS.map(p => {
              const on = data.platforms.includes(p.id)
              return (
                <button key={p.id} onClick={() => togglePlat(p.id)} style={{
                  padding: isMobile ? '12px 10px' : '14px 16px',
                  borderRadius: 12,
                  border: `1.5px solid ${on ? 'rgba(128,97,255,0.50)' : 'rgba(10,6,18,0.11)'}`,
                  background: on ? 'rgba(128,97,255,0.07)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', fontFamily: "'Rubik',sans-serif",
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 4px rgba(10,6,18,0.05)',
                }}>
                  <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: on ? 700 : 500, color: on ? '#0a0612' : 'rgba(10,6,18,0.55)' }}>
                    {p.label}
                  </span>
                  {on && <span style={{ color: '#8061ff', fontSize: 13 }}>✓</span>}
                </button>
              )
            })}
          </div>
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleStep4} />
        </div>
      )
      /* ── 5: Earnings — Issue 4 fix: "follower count" heading + Baltic earnings ── */
      case 5: return (
        <div>
          <span style={pillStyle}>Just for you</span>
          <h2 style={h2Style}>What's your total follower count?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {RANGES.map(r => {
              const on = data.followerRange === r.v
              return (
                <button key={r.v} onClick={() => set({ followerRange: r.v, earn: r.earn })} style={{
                  padding: isMobile ? '11px 8px' : '13px 10px',
                  borderRadius: 10,
                  border: `1.5px solid ${on ? 'rgba(128,97,255,0.55)' : 'rgba(10,6,18,0.11)'}`,
                  background: on ? 'rgba(128,97,255,0.07)' : '#fff',
                  color: on ? '#0a0612' : 'rgba(10,6,18,0.55)',
                  fontWeight: on ? 700 : 500, fontSize: isMobile ? 13 : 14,
                  cursor: 'pointer', fontFamily: "'Rubik',sans-serif",
                  transition: 'all 0.15s ease',
                }}>
                  {r.l}
                </button>
              )
            })}
          </div>
          {data.followerRange && (
            <div style={{
              borderRadius: 12, border: '1.5px solid rgba(128,97,255,0.18)',
              background: 'rgba(128,97,255,0.04)',
              padding: isMobile ? '16px' : '20px', marginBottom: 18,
              animation: 'fadeUp 0.4s ease forwards',
            }}>
              <p style={{ color: 'rgba(10,6,18,0.42)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                Your earning potential
              </p>
              <p style={{ color: '#0a0612', fontWeight: 900, fontSize: isMobile ? 24 : 28, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {data.earn}
              </p>
              <p style={{ color: 'rgba(10,6,18,0.38)', fontSize: 12, marginTop: 6 }}>per month · based on creators like you</p>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {['3× more brand deals', 'Inbound inquiries', 'Pro first impression'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: '#8061ff', fontSize: 12 }}>✓</span>
                    <span style={{ color: 'rgba(10,6,18,0.48)', fontSize: 11 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleStep5} />
        </div>
      )
      /* ── 6: Profile photo ── */
      case 6: return (
        <div>
          <span style={pillStyle}>Your face, your brand</span>
          <h2 style={h2Style}>Upload a profile photo</h2>
          <p style={subStyle}>Profiles with photos get 4× more brand views.</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: isMobile ? 100 : 116, height: isMobile ? 100 : 116,
              borderRadius: '50%', cursor: 'pointer',
              background: data.profilePic ? 'transparent' : 'rgba(128,97,255,0.06)',
              border: `2px dashed ${data.profilePic ? 'transparent' : 'rgba(128,97,255,0.28)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              outline: data.profilePic ? '3px solid rgba(128,97,255,0.30)' : 'none',
              outlineOffset: 3, transition: 'all 0.2s ease',
            }}>
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
            }}>
              {data.profilePic ? '↑ Change photo' : '↑ Choose photo'}
            </button>
          </div>
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={loading} loading={loading} onClick={handleStep6} />
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
          <ErrorMsg msg={error} />
          <ContinueBtn disabled={loading} loading={loading} onClick={handleStep7} />
          <SkipBtn onClick={next} />
        </div>
      )
      /* ── 8: Success — referral section removed ── */
      case 8: return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? 40 : 48, marginBottom: 12, animation: 'bounce 0.6s ease' }}>🎉</div>
          <span style={{ ...pillStyle, textAlign: 'center', display: 'block' }}>Welcome to Creator Nexus</span>
          <h2 style={{ ...h2Style, textAlign: 'center' }}>
            {data.name ? `You're in, ${data.name.split(' ')[0]}!` : "You're in!"}
          </h2>
          <p style={{ ...subStyle, textAlign: 'center', maxWidth: 340, margin: '0 auto 32px' }}>
            Your creator portfolio is live and ready to share with brands. Start building your profile to attract your first deal.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'block', width: '100%', padding: '15px 24px', borderRadius: 10,
              background: '#C8F135', color: '#0a0612', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Rubik', sans-serif",
              transition: 'all 0.18s ease',
              animation: 'fadeUp 0.4s ease 0.15s both',
            }}
          >
            Go to my dashboard →
          </button>
        </div>
      )
      default: return null
    }
  }
  if (w === 0) return null
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Rubik', sans-serif", background: '#fff' }}>
      {/* ── LEFT white panel ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {/* Nav */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: navPad, borderBottom: '1px solid rgba(10,6,18,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10 }}>
            <div style={{
              width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, borderRadius: 10, flexShrink: 0,
              overflow: 'hidden',
            }}>
              <img src="/Nex.webp" alt="Creator Nexus" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
          <p style={{ color: 'rgba(10,6,18,0.42)', fontSize: isMobile ? 12 : 13, margin: 0 }}>
            {mode === 'signup'
              ? <>{isMobile ? '' : 'Already have an account? '}
                  <button onClick={() => { setMode('login'); setStep(1); setAnimKey(k => k + 1); setError('') }}
                    style={{ background: 'none', border: 'none', color: '#0a0612', fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? 12 : 13, fontFamily: "'Rubik',sans-serif" }}>
                    Sign in
                  </button></>
              : <>{isMobile ? '' : "Don't have an account? "}
                  <button onClick={() => { setMode('signup'); setStep(1); setAnimKey(k => k + 1); setError('') }}
                    style={{ background: 'none', border: 'none', color: '#0a0612', fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? 12 : 13, fontFamily: "'Rubik',sans-serif" }}>
                    Sign up free
                  </button></>
            }
          </p>
        </nav>
        {/* Progress bar — only show on signup */}
        {mode === 'signup' && (
          <div style={{
            padding: isMobile ? '14px 16px 0' : isTablet ? '16px 28px 0' : '18px 48px 0',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {step > 1 && (
              <button onClick={back} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(10,6,18,0.32)', fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0,
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0a0612')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(10,6,18,0.32)')}
              >←</button>
            )}
            <div style={{ flex: 1, height: 3, background: 'rgba(10,6,18,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #ff33bc, #8061ff)',
                width: `${progress}%`,
                transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            </div>
          </div>
        )}
        {/* Form area */}
        <div style={{
          flex: 1, display: 'flex',
          alignItems: 'flex-start', justifyContent: 'center',
          padding: formPad, overflowY: 'auto',
        }}>
          <div style={{ width: '100%', maxWidth: maxForm }}>
            <div key={animKey} style={{ animation: 'fadeUp 0.32s ease forwards' }}>
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
      {/* RIGHT dark panel — desktop only */}
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