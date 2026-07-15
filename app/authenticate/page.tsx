'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/* ═══════════════════════════════════════════════════════════════════════
   MOCK MODE  — zero real API calls, zero storage.
   ▸ Any 6-digit OTP code is accepted.
   ▸ Every save/upload succeeds after a short simulated delay.
   ▸ Data lives in React state only; intentionally lost on refresh.
   ▸ "Login" path skips OTP and goes straight to success.
═══════════════════════════════════════════════════════════════════════ */
const mock = (ms = 650) => new Promise(r => setTimeout(r, ms))

/* ─── Design tokens ──────────────────────────────────────────────────── */
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
  grad:       'linear-gradient(90deg, #8b31e8, #b44af0)',
  gradD:      'linear-gradient(135deg, #8b31e8, #b44af0)',
  gradSoft:   'linear-gradient(135deg, rgba(139,49,232,0.12), rgba(180,74,240,0.06))',
  rXs: 6, rSm: 10, rMd: 14, rLg: 20,
  border:     '1px solid rgba(139,49,232,0.16)',
  cardBg:     'rgba(139,49,232,0.04)',
  cardBgM:    'rgba(139,49,232,0.08)',
  shadowSm:   '0 2px 12px rgba(139,49,232,0.10)',
  shadowMd:   '0 8px 32px rgba(139,49,232,0.14)',
  shadowLg:   '0 20px 60px rgba(139,49,232,0.18)',
  shadowCard: '0 4px 24px rgba(10,6,18,0.07)',
  font:       'var(--font-rubik), sans-serif',
} as const

/* ─── Breakpoint ─────────────────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const up = () => setW(window.innerWidth)
    up(); window.addEventListener('resize', up)
    return () => window.removeEventListener('resize', up)
  }, [])
  return { isMobile: w > 0 && w < 640, isTablet: w >= 640 && w < 1024, w }
}

/* ─── Types ──────────────────────────────────────────────────────────── */
type Role = 'creator' | 'brand' | 'agency'
type Mode = 'signup' | 'login'
interface FormData {
  email: string; password: string; showPass: boolean
  otp: string[]
  name: string; niches: string[]; otherNiche: string
  platforms: string[]; mainPlatform: string; followerRange: string; earn: string
  profilePic: string | null; profileFile: File | null
  links: Record<string, string>
}

/* ─── Statics ────────────────────────────────────────────────────────── */
const NICHES = [
  { e: '💄', l: 'Beauty' }, { e: '👗', l: 'Fashion' },
  { e: '✨', l: 'Lifestyle' }, { e: '🍽️', l: 'Food & Drink' },
  { e: '💪', l: 'Fitness' }, { e: '✈️', l: 'Travel' },
  { e: '💻', l: 'Tech' }, { e: '🏠', l: 'Home' },
  { e: '🧘', l: 'Wellness' }, { e: '🎮', l: 'Gaming' },
]

/* Single source of truth for every platform: selection, main-platform pick,
   social-link inputs, and earnings weighting all read from this one array. */
const PLATFORMS = [
  { id: 'instagram', label: 'Instagram',   group: 'short' as const, ph: 'instagram.com/yourhandle',       logo: (s = 20) => <IGLogo        size={s} /> },
  { id: 'tiktok',    label: 'TikTok',      group: 'short' as const, ph: 'tiktok.com/@yourhandle',         logo: (s = 20) => <TikTokLogo    size={s} /> },
  { id: 'x',         label: 'X / Twitter', group: 'short' as const, ph: 'x.com/yourhandle',               logo: (s = 20) => <XLogo         size={s} /> },
  { id: 'pinterest', label: 'Pinterest',   group: 'short' as const, ph: 'pinterest.com/yourhandle',       logo: (s = 20) => <PinterestLogo size={s} /> },
  { id: 'youtube',   label: 'YouTube',     group: 'long'  as const, ph: 'youtube.com/@yourchannel',       logo: (s = 20) => <YTLogo        size={s} /> },
  { id: 'linkedin',  label: 'LinkedIn',    group: 'long'  as const, ph: 'linkedin.com/in/yourname',       logo: (s = 20) => <LinkedInLogo  size={s} /> },
  { id: 'spotify',   label: 'Spotify',     group: 'long'  as const, ph: 'open.spotify.com/show/yourshow', logo: (s = 20) => <SpotifyLogo   size={s} /> },
  { id: 'medium',    label: 'Medium',      group: 'long'  as const, ph: 'medium.com/@yourhandle',         logo: (s = 20) => <MediumLogo    size={s} /> },
]

/* Base earning tiers (Instagram baseline) — every other platform is a
   multiplier off this, so amounts change per platform, not just per follower count. */
const RANGES = [
  { l: '0 – 5K',      v: '0-5k',      lo: 50,   hi: 150   },
  { l: '5K – 20K',    v: '5k-20k',    lo: 150,  hi: 400   },
  { l: '20K – 50K',   v: '20k-50k',   lo: 400,  hi: 900   },
  { l: '50K – 100K',  v: '50k-100k',  lo: 900,  hi: 2000  },
  { l: '100K – 500K', v: '100k-500k', lo: 2000, hi: 6000  },
  { l: '500K+',       v: '500k+',     lo: 6000, hi: 15000, plus: true },
]

const PLATFORM_MULTIPLIER: Record<string, number> = {
  instagram: 1,
  tiktok:    0.85,
  x:         0.70,
  pinterest: 0.65,
  youtube:   1.45,
  linkedin:  1.60,
  spotify:   1.20,
  medium:    0.90,
}

function computeEarn(platformId: string, rangeVal: string): string {
  const range = RANGES.find(r => r.v === rangeVal)
  if (!range || !platformId) return ''
  const mult = PLATFORM_MULTIPLIER[platformId] ?? 1
  const round = (n: number, step: number) => Math.round((n * mult) / step) * step
  const lo = round(range.lo, range.lo >= 1000 ? 50 : 10)
  const hi = round(range.hi, range.hi >= 1000 ? 50 : 10)
  const fmt = (n: number) => `€${n.toLocaleString('en-US')}`
  return range.plus ? `${fmt(lo)}+` : `${fmt(lo)} – ${fmt(hi)}`
}

const STEP_COUNT: Record<Role, number> = { creator: 8, brand: 2, agency: 2 }
const ROLE_LABEL: Record<Role, string>  = { creator: 'Creator', brand: 'Brand', agency: 'Agency' }

/* ─── Shared style bases ─────────────────────────────────────────────── */
const inputBase: React.CSSProperties = {
  display: 'block', width: '100%',
  background: C.bgSub, border: C.border,
  borderRadius: C.rSm, color: C.ink,
  fontSize: 15, outline: 'none', fontFamily: C.font,
  transition: 'border-color .18s, box-shadow .18s, background .18s',
}
const labelBase: React.CSSProperties = {
  display: 'block', color: C.inkDim, fontSize: 11, fontWeight: 600,
  letterSpacing: '0.18em', textTransform: 'uppercase',
  marginBottom: 7, fontFamily: C.font,
}

/* ══════════════════ ROLE SVG MARKS ════════════════════════════════════ */
function CreatorMark({ active }: { active: boolean }) {
  const id = `cm${active ? 1 : 0}`
  const c1 = active ? '#8b31e8' : 'rgba(10,6,18,0.30)'
  const c2 = active ? '#b44af0' : 'rgba(10,6,18,0.18)'
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={c1}/><stop offset="1" stopColor={c2}/>
        </linearGradient>
      </defs>
      <circle cx="22" cy="14" r="7" stroke={`url(#${id})`} strokeWidth="2.5" fill="none"/>
      <path d="M7 40 C7 30 37 30 37 40" stroke={`url(#${id})`} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <line x1="35" y1="9"   x2="35" y2="15"  stroke={c2} strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="12"  x2="38" y2="12"  stroke={c2} strokeWidth="2" strokeLinecap="round"/>
      <line x1="32.8" y1="9.8"  x2="37.2" y2="14.2" stroke={c2} strokeWidth="2" strokeLinecap="round"/>
      <line x1="37.2" y1="9.8"  x2="32.8" y2="14.2" stroke={c2} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function BrandMark({ active }: { active: boolean }) {
  const id = `bm${active ? 1 : 0}`
  const c1 = active ? '#8b31e8' : 'rgba(10,6,18,0.30)'
  const c2 = active ? '#b44af0' : 'rgba(10,6,18,0.18)'
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={c1}/><stop offset="1" stopColor={c2}/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="24" height="24" rx="6" stroke={`url(#${id})`} strokeWidth="2.5" fill="none"/>
      <line x1="15" y1="20" x2="29" y2="20" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round"/>
      <line x1="17" y1="26" x2="27" y2="26" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 5 L22 10" stroke={c2} strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 5 L26 7.5 L22 10" stroke={c2} strokeWidth="2" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}
function AgencyMark({ active }: { active: boolean }) {
  const id = `am${active ? 1 : 0}`
  const c1 = active ? '#8b31e8' : 'rgba(10,6,18,0.30)'
  const c2 = active ? '#b44af0' : 'rgba(10,6,18,0.18)'
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor={c1}/><stop offset="1" stopColor={c2}/>
        </linearGradient>
      </defs>
      <circle cx="22" cy="8"  r="4.5" stroke={`url(#${id})`} strokeWidth="2.5" fill="none"/>
      <circle cx="10" cy="34" r="4.5" stroke={`url(#${id})`} strokeWidth="2.5" fill="none"/>
      <circle cx="34" cy="34" r="4.5" stroke={`url(#${id})`} strokeWidth="2.5" fill="none"/>
      <line x1="22" y1="12.5" x2="13"   y2="30"   stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="12.5" x2="31"   y2="30"   stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round"/>
      <line x1="14.5" y1="34" x2="29.5" y2="34"   stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

/* ══════════════════ PLATFORM BRAND LOGOS ═══════════════════════════════
   Accurate brand-colour SVG logos for every platform we support.
   `size` prop lets the same component scale for buttons (20) and inputs (18).
══════════════════════════════════════════════════════════════════════ */
function IGLogo({ size = 20 }: { size?: number }) {
  const id = 'ig-grad'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <radialGradient id={id} cx="30%" cy="107%" r="150%">
          <stop offset="0%"   stopColor="#fdf497"/>
          <stop offset="10%"  stopColor="#fdf497"/>
          <stop offset="50%"  stopColor="#fd5949"/>
          <stop offset="68%"  stopColor="#d6249f"/>
          <stop offset="100%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill={`url(#${id})`}/>
      <circle cx="12" cy="12" r="4.3" stroke="#fff" strokeWidth="1.8" fill="none"/>
      <circle cx="17.3" cy="6.7" r="1.1" fill="#fff"/>
    </svg>
  )
}

function TikTokLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.5" fill="#010101"/>
      <path d="M13.5 4.5 C13.5 4.5 13.5 11.5 13.5 13.5 C13.5 15.43 11.93 17 10 17 C8.07 17 6.5 15.43 6.5 13.5 C6.5 11.57 8.07 10 10 10 L10 7 C6.41 7 3.5 9.91 3.5 13.5 C3.5 17.09 6.41 20 10 20 C13.59 20 16.5 17.09 16.5 13.5 L16.5 9 C17.7 9.87 19.17 10.4 20.7 10.46 L20.7 7.46 C19.11 7.35 17.71 6.42 16.9 5.09 C16.55 4.51 16.35 3.83 16.35 3.1 L13.35 3.1 Z"
        fill="#69C9D0" transform="translate(0.3 0.3)"/>
      <path d="M13.5 4.5 C13.5 4.5 13.5 11.5 13.5 13.5 C13.5 15.43 11.93 17 10 17 C8.07 17 6.5 15.43 6.5 13.5 C6.5 11.57 8.07 10 10 10 L10 7 C6.41 7 3.5 9.91 3.5 13.5 C3.5 17.09 6.41 20 10 20 C13.59 20 16.5 17.09 16.5 13.5 L16.5 9 C17.7 9.87 19.17 10.4 20.7 10.46 L20.7 7.46 C19.11 7.35 17.71 6.42 16.9 5.09 C16.55 4.51 16.35 3.83 16.35 3.1 L13.35 3.1 Z"
        fill="#EE1D52" transform="translate(-0.3 -0.3)"/>
      <path d="M13.5 4.5 C13.5 4.5 13.5 11.5 13.5 13.5 C13.5 15.43 11.93 17 10 17 C8.07 17 6.5 15.43 6.5 13.5 C6.5 11.57 8.07 10 10 10 L10 7 C6.41 7 3.5 9.91 3.5 13.5 C3.5 17.09 6.41 20 10 20 C13.59 20 16.5 17.09 16.5 13.5 L16.5 9 C17.7 9.87 19.17 10.4 20.7 10.46 L20.7 7.46 C19.11 7.35 17.71 6.42 16.9 5.09 C16.55 4.51 16.35 3.83 16.35 3.1 L13.35 3.1 Z"
        fill="#ffffff"/>
    </svg>
  )
}

function YTLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.5" fill="#FF0000"/>
      <path d="M10 8.5 L16.5 12 L10 15.5 Z" fill="#ffffff"/>
    </svg>
  )
}

function LinkedInLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.5" fill="#0A66C2"/>
      <rect x="5" y="9" width="3" height="10" fill="#fff"/>
      <circle cx="6.5" cy="6.5" r="1.75" fill="#fff"/>
      <path d="M10.5 9 L10.5 19 L13.5 19 L13.5 13.5 C13.5 12.12 14.62 11 16 11 C17.38 11 18.5 12.12 18.5 13.5 L18.5 19 L21.5 19 L21.5 13 C21.5 10.52 19.48 8.5 17 8.5 C15.77 8.5 14.66 9.01 13.87 9.84 L13.5 9 Z" fill="#fff"/>
    </svg>
  )
}

function PinterestLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.5" fill="#E60023"/>
      <path d="M12 3 C7.58 3 4 6.58 4 11 C4 14.37 5.99 17.27 8.87 18.62 C8.81 18.08 8.76 17.24 8.9 16.63 C9.02 16.08 9.71 13.19 9.71 13.19 C9.71 13.19 9.5 12.77 9.5 12.15 C9.5 11.18 10.07 10.45 10.76 10.45 C11.35 10.45 11.63 10.9 11.63 11.44 C11.63 12.05 11.24 12.96 11.04 13.8 C10.87 14.5 11.39 15.07 12.08 15.07 C13.32 15.07 14.27 13.75 14.27 11.83 C14.27 10.12 13.03 8.93 11.28 8.93 C9.27 8.93 8.1 10.43 8.1 11.98 C8.1 12.59 8.34 13.25 8.64 13.6 C8.7 13.67 8.7 13.74 8.67 13.82 C8.57 14.23 8.33 15.16 8.29 15.34 C8.23 15.57 8.1 15.62 7.86 15.51 C6.97 15.09 6.4 13.8 6.4 11.95 C6.4 9.49 8.2 7.22 11.54 7.22 C14.21 7.22 16.29 9.13 16.29 11.77 C16.29 14.52 14.61 16.72 12.24 16.72 C11.53 16.72 10.86 16.35 10.63 15.91 L10.11 17.87 C9.88 18.74 9.28 19.84 8.88 20.52 C9.89 20.83 10.94 21 12 21 C16.42 21 20 17.42 20 13 C20 8.58 16.42 5 12 5 Z" fill="#fff" transform="translate(0 -2)"/>
    </svg>
  )
}

function XLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.5" fill="#000000"/>
      <path d="M17.75 4 L13.37 9.08 L19.5 19.5 L14.5 19.5 L10.86 13.6 L6 19.5 L4 19.5 L8.69 14.07 L2.5 4 L7.5 4 L10.87 9.52 L15.5 4 Z" fill="#ffffff"/>
    </svg>
  )
}

function SpotifyLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.5" fill="#1DB954"/>
      <path d="M6.4 9.6c3.7-1.05 7.7-.85 10.9 1" stroke="#0A2E16" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M6.8 13c3-.8 6.3-.65 9 .85" stroke="#0A2E16" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M7.2 16.1c2.4-.55 5-.45 7.2.7" stroke="#0A2E16" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

function MediumLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5.5" fill="#000000"/>
      <circle cx="8.3" cy="12" r="4" fill="#fff"/>
      <ellipse cx="15.2" cy="12" rx="2.3" ry="4" fill="#fff"/>
      <ellipse cx="19.6" cy="12" rx="0.9" ry="4" fill="#fff"/>
    </svg>
  )
}

/* ══════════════════ PRIMITIVES ════════════════════════════════════════ */

function LightInput({ label, type = 'text', value, onChange, placeholder, suffix, onEnter }: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string
  suffix?: React.ReactNode; onEnter?: () => void
}) {
  const [focus, setFocus] = useState(false)
  return (
    <div>
      <label style={labelBase}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter() }}
          style={{
            ...inputBase, padding: '13px 16px', paddingRight: suffix ? 52 : 16,
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
    <input value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        ...inputBase, padding: '13px 16px',
        background: focus ? C.bg : C.bgSub,
        borderColor: focus ? C.primary : 'rgba(139,49,232,0.16)',
        boxShadow: focus ? '0 0 0 3px rgba(139,49,232,0.10)' : 'none',
      }}
    />
  )
}

function OTPRow({ value, onChange, isMobile, onComplete }: {
  value: string[]; onChange: (v: string[]) => void
  isMobile: boolean; onComplete: () => void
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const [foci, setFoci] = useState<boolean[]>(Array(6).fill(false))
  const setF = (i: number, v: boolean) => setFoci(f => { const n = [...f]; n[i] = v; return n })
  const handle = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const next = [...value]; next[i] = v; onChange(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
    if (v && i === 5 && next.every(d => d !== '')) setTimeout(onComplete, 150)
  }
  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus()
  }
  const bW = isMobile ? 42 : 52; const bH = isMobile ? 50 : 60
  return (
    <div style={{ display: 'flex', gap: isMobile ? 7 : 10 }}>
      {value.map((d, i) => (
        <input key={i} ref={el => { refs.current[i] = el }}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handle(i, e.target.value)}
          onKeyDown={e => onKey(i, e)}
          onFocus={() => setF(i, true)} onBlur={() => setF(i, false)}
          style={{
            width: bW, height: bH, flexShrink: 0, textAlign: 'center',
            fontSize: isMobile ? 18 : 22, fontWeight: 800,
            background: d ? 'rgba(139,49,232,0.06)' : C.bgSub,
            border: `1.5px solid ${foci[i] ? C.primary : d ? 'rgba(139,49,232,0.40)' : 'rgba(139,49,232,0.18)'}`,
            borderRadius: C.rSm, color: C.ink, outline: 'none', fontFamily: C.font,
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
      <button disabled={disabled || loading} onClick={onClick}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          display: 'block', width: '100%', padding: '15px 24px',
          borderRadius: C.rSm, border: 'none',
          background: disabled ? 'rgba(139,49,232,0.18)' : C.grad,
          color: disabled ? 'rgba(10,6,18,0.38)' : '#fff',
          fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', fontFamily: C.font,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'opacity .2s, transform .2s, box-shadow .2s',
          opacity: hov && !disabled ? 0.88 : 1,
          transform: hov && !disabled ? 'translateY(-2px)' : 'none',
          boxShadow: hov && !disabled ? C.shadowMd : disabled ? 'none' : C.shadowSm,
        }}>
        {loading ? <Spinner /> : label}
      </button>
      {!disabled && !loading && (
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
      <button onClick={onClick}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.font,
          color: hov ? C.inkDim2 : C.inkFaint, fontSize: 13, padding: '4px 8px',
          transition: 'color .18s',
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
      border: `2px solid ${dark ? 'rgba(10,6,18,0.18)' : 'rgba(255,255,255,0.30)'}`,
      borderTopColor: dark ? C.ink : '#fff', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite', verticalAlign: 'middle',
    }}/>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(139,49,232,0.07)', border: '1px solid rgba(139,49,232,0.25)',
      borderRadius: C.rSm, padding: '12px 16px', marginBottom: 16,
      fontSize: 13, color: '#5b1fa8', fontWeight: 500, fontFamily: C.font,
    }}>{msg}</div>
  )
}

function DemoHint() {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      background: 'rgba(139,49,232,0.05)', border: '1px solid rgba(139,49,232,0.15)',
      borderRadius: C.rSm, padding: '10px 14px', marginBottom: 20,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: C.gradD, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 900, marginTop: 1,
      }}>i</div>
      <span style={{ fontSize: 12, color: C.inkDim, fontFamily: C.font, lineHeight: 1.55 }}>
        <strong style={{ color: C.primary, fontWeight: 700 }}>Demo mode</strong> — any 6 digits
        will work. No real email has been sent.
      </span>
    </div>
  )
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1; const active = n === current; const done = n < current
        return (
          <div key={n} style={{
            width: active ? 24 : 9, height: 9, borderRadius: 99,
            background: active || done ? C.grad : 'rgba(139,49,232,0.20)',
            transition: 'all 0.25s ease', boxShadow: active ? C.shadowSm : 'none',
          }}/>
        )
      })}
    </div>
  )
}

function ComingSoonBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button type="button" disabled style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '12px 18px', borderRadius: C.rSm, width: '100%',
      border: C.border, background: C.bgSub,
      color: 'rgba(10,6,18,0.38)', fontSize: 14, fontWeight: 700,
      cursor: 'not-allowed', fontFamily: C.font,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      {label}
      <span style={{
        marginLeft: 'auto', fontSize: 10, fontWeight: 600,
        background: 'rgba(139,49,232,0.10)', color: C.inkDim,
        padding: '2px 8px', borderRadius: C.rXs, letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>Soon</span>
    </button>
  )
}

/* ══════════════════ ECOSYSTEM GRAPHIC ═════════════════════════════════
   Shows the three-sided marketplace: Brand ↔ Agency ↔ Creator, with
   campaigns/content/payouts flowing between them. Lives on the role screen.
══════════════════════════════════════════════════════════════════════ */
function EcosystemGraphic({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 420, margin: '0 auto 28px' }}>
      <svg viewBox="0 0 420 66" width="100%" height={isMobile ? 56 : 66} style={{ position: 'absolute', top: 16, left: 0 }} fill="none">
        <defs>
          <marker id="ecoArrow" markerWidth="7" markerHeight="7" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(139,49,232,0.42)" />
          </marker>
        </defs>
        <path d="M55 12 C 140 -12, 280 -12, 365 12" stroke="rgba(139,49,232,0.32)" strokeWidth="1.5" strokeDasharray="3 5" fill="none" markerEnd="url(#ecoArrow)" />
        <path d="M365 40 C 280 62, 140 62, 55 40" stroke="rgba(139,49,232,0.32)" strokeWidth="1.5" strokeDasharray="3 5" fill="none" markerEnd="url(#ecoArrow)" />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {[
          { mark: <BrandMark active />,   label: 'Brand'   },
          { mark: <AgencyMark active />,  label: 'Agency'  },
          { mark: <CreatorMark active />, label: 'Creator' },
        ].map((n, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#fff',
              boxShadow: C.shadowCard, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              <div style={{ transform: 'scale(0.72)' }}>{n.mark}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.inkDim, letterSpacing: '0.10em', textTransform: 'uppercase', fontFamily: C.font }}>
              {n.label}
            </span>
          </div>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: 11, color: C.inkFaint, marginTop: 10, fontFamily: C.font, lineHeight: 1.5 }}>
        One ecosystem — campaigns flow in, content flows out, payouts flow back.
      </p>
    </div>
  )
}

/* ══════════════════ STEP 0 — ROLE SELECTOR ════════════════════════════ */
function RoleSelector({ onSelect, isMobile }: {
  onSelect: (r: Role) => void; isMobile: boolean
}) {
  const [hov, setHov] = useState<Role | null>(null)
  const roles = [
    { id: 'agency'  as Role, mark: <AgencyMark  active={hov === 'agency' }/>,
      title: "I'm an Agency", tagline: 'Manage campaigns at scale. Earn on every deal you run.' },
    { id: 'creator' as Role, mark: <CreatorMark active={hov === 'creator'}/>,
      title: "I'm a Creator", tagline: 'Build your portfolio. Get discovered. Earn from deals.' },
    { id: 'brand'   as Role, mark: <BrandMark   active={hov === 'brand'  }/>,
      title: "I'm a Brand",   tagline: 'Find creators. Launch campaigns. Pay for results.' },
  ]
  return (
    <div style={{ width: '100%', maxWidth: 520, animation: 'fadeUp 0.35s ease forwards' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
        <div style={{ width: 52, height: 52, borderRadius: C.rLg, overflow: 'hidden' }}>
          <img src="/Nex.webp" alt="Nexfluence"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
        </div>
      </div>
      <h1 style={{
        textAlign: 'center', fontFamily: C.font, fontWeight: 900,
        fontSize: isMobile ? 24 : 30, letterSpacing: '-0.04em',
        color: C.ink, lineHeight: 1.1, marginBottom: 10,
      }}>Who are you here as?</h1>
      <p style={{
        textAlign: 'center', fontFamily: C.font, color: C.inkDim,
        fontSize: 14, marginBottom: 22, lineHeight: 1.7,
      }}>Choose your role to get the right experience.</p>

      <EcosystemGraphic isMobile={isMobile}/>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 14 }}>
        {roles.map((r, i) => {
          const on = hov === r.id
          return (
            <button key={r.id}
              onClick={() => onSelect(r.id)}
              onMouseEnter={() => setHov(r.id)}
              onMouseLeave={() => setHov(null)}
              style={{
                flex: 1, display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'center' : 'flex-start',
                gap: isMobile ? 16 : 14,
                padding: isMobile ? '18px 20px' : '24px 20px',
                borderRadius: C.rLg,
                border: on ? `1px solid ${C.primary}` : C.border,
                background: on ? C.bgSub : C.bg,
                cursor: 'pointer', textAlign: 'left', fontFamily: C.font,
                transition: 'all 0.18s ease',
                boxShadow: on ? C.shadowMd : C.shadowCard,
                transform: on ? 'translateY(-3px)' : 'none',
                animation: `fadeUp 0.35s ease ${0.06 * i}s both`,
              }}>
              <div style={{
                width: 52, height: 52, flexShrink: 0, borderRadius: C.rMd,
                background: on ? C.gradSoft : 'rgba(139,49,232,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.18s',
              }}>{r.mark}</div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: 800, fontSize: 15, color: on ? C.ink : C.inkDim2,
                  letterSpacing: '-0.02em', marginBottom: 4, fontFamily: C.font,
                  transition: 'color 0.15s',
                }}>{r.title}</p>
                <p style={{ color: C.inkFaint, fontSize: 12, lineHeight: 1.5, fontFamily: C.font }}>
                  {r.tagline}
                </p>
              </div>
              <div style={{
                marginLeft: isMobile ? 'auto' : undefined,
                color: on ? C.primary : 'rgba(139,49,232,0.30)',
                fontSize: 18, fontWeight: 700, flexShrink: 0,
                transition: 'color 0.15s, transform 0.15s',
                transform: on ? 'translateX(3px)' : 'none',
              }}>→</div>
            </button>
          )
        })}
      </div>
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: C.inkFaint, fontFamily: C.font }}>
        Free forever · No credit card needed · GDPR compliant
      </p>
    </div>
  )
}

/* ══════════════════ SHORT SUCCESS (brand / agency) ═══════════════════ */
function ShortSuccess({ role, email, isMobile, onContinue }: {
  role: Role; email: string; isMobile: boolean; onContinue: () => void
}) {
  const cfg = role === 'brand'
    ? { hl: 'Brand account ready.', sub: "Your brand profile is set up. Let's build it so creators can find you.", cta: 'Set up brand profile →' }
    : { hl: 'Agency account ready.', sub: "Your agency dashboard is live. Start onboarding your creators and brands.", cta: 'Go to agency dashboard →' }
  return (
    <div style={{ textAlign: 'center', paddingTop: isMobile ? 8 : 16 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
        background: 'linear-gradient(135deg,rgba(139,49,232,0.18),rgba(180,74,240,0.10))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: C.shadowLg, animation: 'bounce 0.6s ease',
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="ss-ck" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8b31e8"/><stop offset="1" stopColor="#b44af0"/>
            </linearGradient>
          </defs>
          <path d="M7 16 L13 22 L25 10" stroke="url(#ss-ck)"
            strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </div>
      <h2 style={{
        color: C.ink, fontWeight: 900, fontSize: isMobile ? 22 : 26,
        letterSpacing: '-0.035em', lineHeight: 1.1, fontFamily: C.font, textAlign: 'center', marginBottom: 6,
      }}>{cfg.hl}</h2>
      <p style={{
        color: C.inkDim, fontSize: 14, lineHeight: 1.7,
        maxWidth: 340, margin: '8px auto 28px', fontFamily: C.font,
      }}>
        Signed in as <span style={{ color: C.primary, fontWeight: 600 }}>{email || 'you'}</span>.
        {' '}{cfg.sub}
      </p>
      <button onClick={onContinue}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
        style={{
          display: 'block', width: '100%', padding: '15px 24px',
          borderRadius: C.rSm, background: C.grad, color: '#fff',
          border: 'none', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em',
          cursor: 'pointer', fontFamily: C.font, boxShadow: C.shadowMd,
          transition: 'opacity .2s, transform .2s', animation: 'fadeUp 0.4s ease 0.15s both',
        }}>{cfg.cta}</button>
    </div>
  )
}

/* ══════════════════════ MAIN PAGE ═════════════════════════════════════ */
export default function AuthPage() {
  const router = useRouter()
  const { isMobile, isTablet, w } = useBreakpoint()

  const [role, setRole]           = useState<Role | null>(null)
  const [mode, setMode]           = useState<Mode>('signup')
  const [step, setStep]           = useState(1)
  const [animKey, setAnimKey]     = useState(0)
  const [loading, setLoading]     = useState(false)
  const [resend, setResend]       = useState(0)
  const [error, setError]         = useState('')
  const [shortSuccess, setShortSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<FormData>({
    email: '', password: '', showPass: false,
    otp: ['', '', '', '', '', ''],
    name: '', niches: [], otherNiche: '',
    platforms: [], mainPlatform: '', followerRange: '', earn: '',
    profilePic: null, profileFile: null,
    links: {},
  })
  const patch = (p: Partial<FormData>) => setData(d => ({ ...d, ...p }))

  useEffect(() => {
    if (resend <= 0) return
    const id = setInterval(() => setResend(t => t - 1), 1000)
    return () => clearInterval(id)
  }, [resend])

  const goTo = (n: number) => { setAnimKey(k => k + 1); setStep(n); setError('') }
  const next  = () => goTo(step + 1)

  const back = () => {
    if (shortSuccess)  { setShortSuccess(false); setAnimKey(k => k + 1); return }
    if (step === 1)    { setRole(null); setAnimKey(k => k + 1); setError(''); return }
    goTo(step - 1)
  }

  const selectRole = (r: Role) => {
    setRole(r); setStep(1); setMode('signup')
    setShortSuccess(false); setAnimKey(k => k + 1); setError('')
    patch({
      email: '', password: '', showPass: false,
      otp: ['', '', '', '', '', ''],
      name: '', niches: [], otherNiche: '',
      platforms: [], mainPlatform: '', followerRange: '', earn: '',
      profilePic: null, profileFile: null,
      links: {},
    })
  }

  const totalSteps = role ? STEP_COUNT[role] : 8

  const toggleNiche = (l: string) =>
    patch({ niches: data.niches.includes(l) ? data.niches.filter(x => x !== l) : [...data.niches, l] })

  const togglePlat = (id: string) => {
    const active = data.platforms.includes(id)
    const platforms = active ? data.platforms.filter(x => x !== id) : [...data.platforms, id]
    const patchObj: Partial<FormData> = { platforms }
    // if you deselect your current main platform, clear the dependent fields
    if (active && data.mainPlatform === id) {
      patchObj.mainPlatform = ''
      patchObj.followerRange = ''
      patchObj.earn = ''
    }
    patch(patchObj)
  }

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    patch({ profileFile: f })
    const r = new FileReader(); r.onload = ev => patch({ profilePic: ev.target?.result as string }); r.readAsDataURL(f)
  }

  const canContinue = (): boolean => {
    if (step === 1) return !!data.email && data.password.length >= 6
    if (step === 2) return data.otp.every(d => d !== '')
    if (role === 'creator') {
      if (step === 3) return data.platforms.length > 0
      if (step === 4) return !!data.mainPlatform && !!data.followerRange
      if (step === 5) {
        const ok = data.niches.some(n => n !== '__other__') ||
          (data.niches.includes('__other__') && !!data.otherNiche.trim())
        return !!data.name && data.niches.length > 0 && ok
      }
    }
    return true
  }

  /* ══════════════════ MOCK HANDLERS ══════════════════════════════════ */

  const handleStep1 = async () => {
    setLoading(true); setError('')
    await mock()
    if (mode === 'login') {
      if (role === 'brand' || role === 'agency') { setShortSuccess(true) }
      else { goTo(8) }
    } else {
      next(); setResend(30)
    }
    setLoading(false)
  }

  const handleVerifyOTP = useCallback(async () => {
    if (loading) return
    setLoading(true); setError('')
    await mock(700)
    if (role === 'brand' || role === 'agency') { setShortSuccess(true) }
    else { next() }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, role, step])

  const handleResend = () => {
    patch({ otp: Array(6).fill('') }); setResend(30)
  }

  const handleSave = async () => {
    setLoading(true); setError(''); await mock(500); next(); setLoading(false)
  }

  const handlePhotoStep = async () => {
    if (!data.profileFile) { next(); return }
    setLoading(true); setError(''); await mock(900); next(); setLoading(false)
  }

  /* ══════════════════ LAYOUT HELPERS ═════════════════════════════════ */
  const formPad = isMobile ? '28px 20px' : isTablet ? '40px 32px' : '48px 48px'
  const maxForm = isMobile ? '100%' : '480px'
  const h2: React.CSSProperties = {
    color: C.ink, fontWeight: 900, fontSize: isMobile ? 22 : 28,
    letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 6, fontFamily: C.font,
  }
  const sub: React.CSSProperties = {
    color: C.inkDim, fontSize: isMobile ? 13 : 14,
    lineHeight: 1.7, marginBottom: 22, fontFamily: C.font,
  }
  const Kicker = ({ text }: { text: string }) => (
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: C.primary, marginBottom: 8, fontFamily: C.font,
    }}>{text}</p>
  )

  const RolePill = () => {
    if (!role) return null
    const marks: Record<Role, React.ReactNode> = {
      creator: <CreatorMark active/>, brand: <BrandMark active/>, agency: <AgencyMark active/>,
    }
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '5px 12px 5px 8px', borderRadius: 99,
        background: C.gradSoft, border: '1px solid rgba(139,49,232,0.20)', marginBottom: 18,
      }}>
        <span style={{
          display: 'flex', transform: 'scale(0.55)', transformOrigin: 'left center',
          width: 26, height: 26, overflow: 'hidden', alignItems: 'center',
        }}>{marks[role]}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, fontFamily: C.font, letterSpacing: '0.04em' }}>
          {ROLE_LABEL[role]}
        </span>
        <button
          onClick={() => { setRole(null); setShortSuccess(false); setAnimKey(k => k + 1) }}
          style={{
            background: 'none', border: 'none', padding: '0 0 0 4px',
            color: C.inkFaint, cursor: 'pointer', fontSize: 13,
            fontFamily: C.font, display: 'flex', alignItems: 'center',
          }}
          title="Change role">×</button>
      </div>
    )
  }

  const platformBtnStyle = (on: boolean): React.CSSProperties => ({
    padding: isMobile ? '12px 10px' : '14px 14px', borderRadius: C.rMd,
    border: on ? `1px solid ${C.primary}` : C.border,
    background: on ? C.cardBgM : C.bgSub, color: on ? C.ink : C.inkDim,
    fontSize: 14, fontWeight: on ? 700 : 500,
    cursor: 'pointer', fontFamily: C.font, transition: 'all 0.15s',
    boxShadow: on ? C.shadowSm : 'none',
    display: 'flex', alignItems: 'center', gap: 10,
  })

  /* ══════════════════════ STEP RENDERS ════════════════════════════════ */
  const renderStep = () => {
    if (!role) return null

    if (shortSuccess && (role === 'brand' || role === 'agency')) {
      return (
        <ShortSuccess role={role} email={data.email} isMobile={isMobile}
          onContinue={() => router.push(role === 'brand' ? '/brand-studio' : '/agency-studio')}/>
      )
    }

    switch (step) {

      /* ── 1: Email + password ── */
      case 1: return (
        <div>
          <RolePill/>
          <h2 style={h2}>{mode === 'login' ? 'Welcome back' : 'Start your journey'}</h2>
          <p style={sub}>
            {mode === 'login' ? 'Sign in to your Creator Nexus account.'
              : role === 'creator' ? 'Build your creator portfolio and start landing brand deals.'
              : role === 'brand'   ? 'Discover creators, run campaigns, and pay for real results.'
              :                     'Manage creators and brands at scale with one dashboard.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
            <ComingSoonBtn icon={<IGLogo size={18}/>}
              label={`${mode === 'login' ? 'Sign in' : 'Continue'} with Instagram`}/>
            <ComingSoonBtn icon={<TikTokLogo size={18}/>}
              label={`${mode === 'login' ? 'Sign in' : 'Continue'} with TikTok`}/>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(139,49,232,0.14)' }}/>
            <span style={{ color: C.inkFaint, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(139,49,232,0.14)' }}/>
          </div>

          <ErrorMsg msg={error}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
            <LightInput label="Email address" type="email" value={data.email}
              onChange={v => patch({ email: v })} placeholder="you@email.com"
              onEnter={canContinue() ? handleStep1 : undefined}/>
            <LightInput label="Password" type={data.showPass ? 'text' : 'password'}
              value={data.password} onChange={v => patch({ password: v })}
              placeholder="Min. 6 characters"
              onEnter={canContinue() ? handleStep1 : undefined}
              suffix={
                <button type="button" onClick={() => patch({ showPass: !data.showPass })} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: C.inkDim, fontSize: 12, fontFamily: C.font, fontWeight: 600,
                }}>{data.showPass ? 'Hide' : 'Show'}</button>
              }/>
          </div>

          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleStep1}
            label={mode === 'login' ? 'Sign in →' : 'Create account →'}/>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: C.inkFaint, fontFamily: C.font }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
              style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: C.font }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>
      )

      /* ── 2: OTP ── */
      case 2: return (
        <div>
          <RolePill/>
          <Kicker text={`Step 2 of ${totalSteps} · Verify email`}/>
          <h2 style={h2}>Enter the 6-digit code</h2>
          <p style={sub}>
            We'd normally send a code to <span style={{ color: C.primary, fontWeight: 600 }}>{data.email || 'your email'}</span>
          </p>
          <DemoHint/>
          <ErrorMsg msg={error}/>
          <div style={{ marginBottom: 24 }}>
            <OTPRow value={data.otp} isMobile={isMobile}
              onComplete={handleVerifyOTP}
              onChange={otp => patch({ otp })}/>
          </div>
          {loading
            ? <div style={{ textAlign: 'center', padding: 12 }}><Spinner dark/></div>
            : <ContinueBtn disabled={!canContinue()} loading={false}
                onClick={handleVerifyOTP} label="Verify & continue →"/>
          }
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: C.inkFaint, fontFamily: C.font }}>
            {resend > 0
              ? <>Resend in <span style={{ color: C.primary, fontWeight: 600 }}>{resend}s</span></>
              : <button onClick={handleResend} style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: C.font }}>Resend code</button>
            }
          </p>
        </div>
      )

      /* ── 3 (creator): Platforms — short-form / long-form segregated ── */
      case 3: if (role !== 'creator') return null; return (
        <div>
          <Kicker text="Step 3 of 8 · Platforms"/>
          <h2 style={h2}>Which platforms are you on?</h2>
          <p style={sub}>Select every platform where you post or publish regularly.</p>

          <label style={labelBase}>🎬 Short-form</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 8 : 10, marginBottom: 20 }}>
            {PLATFORMS.filter(p => p.group === 'short').map(p => {
              const on = data.platforms.includes(p.id)
              return (
                <button key={p.id} onClick={() => togglePlat(p.id)} style={platformBtnStyle(on)}>
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{p.logo(20)}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{p.label}</span>
                  {on && (
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', background: C.grad,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff', fontWeight: 900, flexShrink: 0,
                    }}>✓</span>
                  )}
                </button>
              )
            })}
          </div>

          <label style={labelBase}>🎙️ Long-form</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 8 : 10, marginBottom: 24 }}>
            {PLATFORMS.filter(p => p.group === 'long').map(p => {
              const on = data.platforms.includes(p.id)
              return (
                <button key={p.id} onClick={() => togglePlat(p.id)} style={platformBtnStyle(on)}>
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{p.logo(20)}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{p.label}</span>
                  {on && (
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', background: C.grad,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff', fontWeight: 900, flexShrink: 0,
                    }}>✓</span>
                  )}
                </button>
              )
            })}
          </div>

          <ErrorMsg msg={error}/>
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleSave}/>
        </div>
      )

      /* ── 4 (creator): Main platform + followers + earning potential (moved up) ── */
      case 4: if (role !== 'creator') return null; return (
        <div>
          <Kicker text="Step 4 of 8 · Your reach"/>
          <h2 style={h2}>Choose your main platform</h2>
          <p style={sub}>The platform where you post the most — this is what brands see first.</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
            {PLATFORMS.filter(p => data.platforms.includes(p.id)).map(p => {
              const on = data.mainPlatform === p.id
              return (
                <button key={p.id}
                  onClick={() => patch({ mainPlatform: p.id, followerRange: '', earn: '' })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: isMobile ? '9px 14px' : '10px 16px', borderRadius: C.rSm,
                    border: on ? `1px solid ${C.primary}` : C.border,
                    background: on ? C.cardBgM : C.bg, color: on ? C.ink : C.inkDim,
                    fontSize: 14, fontWeight: on ? 700 : 500, cursor: 'pointer',
                    fontFamily: C.font, transition: 'all 0.15s',
                    boxShadow: on ? C.shadowSm : 'none',
                  }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>{p.logo(18)}</span>
                  {p.label}
                </button>
              )
            })}
          </div>

          {data.mainPlatform && (
            <>
              <label style={labelBase}>
                Followers on {PLATFORMS.find(p => p.id === data.mainPlatform)?.label}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {RANGES.map(r => {
                  const on = data.followerRange === r.v
                  return (
                    <button key={r.v}
                      onClick={() => patch({ followerRange: r.v, earn: computeEarn(data.mainPlatform, r.v) })}
                      style={{
                        padding: isMobile ? '11px 8px' : '13px 10px', borderRadius: C.rSm,
                        border: on ? `1px solid ${C.primary}` : C.border,
                        background: on ? C.cardBgM : C.bgSub, color: on ? C.ink : C.inkDim,
                        fontWeight: on ? 700 : 500, fontSize: isMobile ? 13 : 14,
                        cursor: 'pointer', fontFamily: C.font, transition: 'all 0.15s',
                        boxShadow: on ? C.shadowSm : 'none',
                      }}>{r.l}</button>
                  )
                })}
              </div>
            </>
          )}

          {data.followerRange && data.mainPlatform && (
            <div style={{
              borderRadius: C.rLg, border: '1px solid rgba(139,49,232,0.18)',
              background: C.cardBg, padding: isMobile ? 16 : 20,
              marginBottom: 18, position: 'relative', overflow: 'hidden',
              boxShadow: C.shadowCard,
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg,transparent,rgba(180,74,240,0.55),transparent)' }}/>
              <p style={{ color: C.inkDim, fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6, fontFamily: C.font }}>Your earning potential</p>
              <p style={{ color: C.ink, fontWeight: 900, fontSize: isMobile ? 26 : 30, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: C.font }}>{data.earn}</p>
              <p style={{ color: C.inkDim, fontSize: 12, marginTop: 6, fontFamily: C.font }}>
                per month on {PLATFORMS.find(p => p.id === data.mainPlatform)?.label} · based on creators like you
              </p>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {[
                  { e: '🤝', t: '3× more brand deals' },
                  { e: '📩', t: 'Inbound inquiries' },
                  { e: '⭐', t: 'Pro first impression' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 13 }}>{row.e}</span>
                    <span style={{ color: C.inkDim, fontSize: 11, fontFamily: C.font }}>{row.t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ErrorMsg msg={error}/>
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleSave}/>
        </div>
      )

      /* ── 5 (creator): Name + niches ── */
      case 5: if (role !== 'creator') return null; return (
        <div>
          <Kicker text="Step 5 of 8 · Your content"/>
          <h2 style={h2}>What do you create?</h2>
          <p style={sub}>This helps brands find creators like you.</p>
          <div style={{ marginBottom: 16 }}>
            <LightInput label="Your full name" value={data.name}
              onChange={v => patch({ name: v })} placeholder="Sophie Thomas"/>
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
                  background: on ? C.grad : C.bg, color: on ? '#fff' : C.inkDim,
                  fontSize: 13, fontWeight: on ? 700 : 500,
                  cursor: 'pointer', fontFamily: C.font, transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 13 }}>{n.e}</span>{n.l}
                </button>
              )
            })}
            {(() => {
              const on = data.niches.includes('__other__')
              return (
                <button onClick={() => toggleNiche('__other__')} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: isMobile ? '7px 12px' : '7px 16px', borderRadius: C.rSm,
                  border: on ? '1px solid transparent' : C.border,
                  background: on ? C.grad : C.bg, color: on ? '#fff' : C.inkDim,
                  fontSize: 13, fontWeight: on ? 700 : 500, cursor: 'pointer', fontFamily: C.font, transition: 'all 0.15s',
                }}>+ Other</button>
              )
            })()}
          </div>
          {data.niches.includes('__other__') && (
            <div style={{ marginBottom: 24, animation: 'fadeUp 0.25s ease forwards' }}>
              <LightInput label="What's your niche?" value={data.otherNiche}
                onChange={v => patch({ otherNiche: v })}
                placeholder="e.g. DIY Crafts, Motorsport, Parenting…"/>
            </div>
          )}
          <ErrorMsg msg={error}/>
          <ContinueBtn disabled={!canContinue()} loading={loading} onClick={handleSave}/>
        </div>
      )

      /* ── 6 (creator): Profile photo ── */
      case 6: if (role !== 'creator') return null; return (
        <div>
          <Kicker text="Step 6 of 8 · Profile photo"/>
          <h2 style={h2}>Add a profile photo</h2>
          <p style={sub}>Profiles with photos get 4× more brand views.</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: isMobile ? 100 : 116, height: isMobile ? 100 : 116,
              borderRadius: '50%', cursor: 'pointer',
              background: data.profilePic ? 'transparent' : C.bgCard,
              border: `2px dashed ${data.profilePic ? 'transparent' : 'rgba(139,49,232,0.28)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              outline: data.profilePic ? '3px solid rgba(139,49,232,0.30)' : 'none',
              outlineOffset: 3, transition: 'all 0.2s',
              boxShadow: data.profilePic ? C.shadowMd : 'none',
            }}>
              {data.profilePic
                ? <img src={data.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                : <div style={{ textAlign: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ display: 'block', margin: '0 auto 4px' }}>
                      <rect x="2" y="7" width="24" height="17" rx="3" stroke="rgba(139,49,232,0.50)" strokeWidth="2"/>
                      <circle cx="14" cy="15" r="4.5" stroke="rgba(139,49,232,0.50)" strokeWidth="2"/>
                      <path d="M10 7 L12 4 L16 4 L18 7" stroke="rgba(139,49,232,0.50)" strokeWidth="2" strokeLinejoin="round" fill="none"/>
                      <circle cx="22" cy="11" r="1.5" fill="rgba(139,49,232,0.50)"/>
                    </svg>
                    <div style={{ color: C.inkDim, fontSize: 11, fontFamily: C.font }}>Click to upload</div>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile}/>
            <button onClick={() => fileRef.current?.click()} style={{
              background: 'none', border: '1.5px solid rgba(139,49,232,0.30)',
              borderRadius: C.rSm, padding: '9px 22px',
              color: C.primary, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: C.font,
            }}>{data.profilePic ? '↑ Change photo' : '↑ Choose photo'}</button>
          </div>
          <ErrorMsg msg={error}/>
          <ContinueBtn disabled={loading} loading={loading} onClick={handlePhotoStep}/>
          <SkipBtn onClick={next}/>
        </div>
      )

      /* ── 7 (creator): Social links — only for platforms picked in step 3 ── */
      case 7: if (role !== 'creator') return null; return (
        <div>
          <Kicker text="Step 7 of 8 · Social links"/>
          <h2 style={h2}>Add your social links</h2>
          <p style={sub}>Brands use these to verify your audience before reaching out.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            {PLATFORMS.filter(p => data.platforms.includes(p.id)).map(p => (
              <div key={p.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {p.logo(18)}
                  </span>
                  <span style={{
                    color: C.inkDim, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: C.font,
                  }}>{p.label}</span>
                </div>
                <FocusInput value={data.links[p.id] ?? ''}
                  onChange={v => patch({ links: { ...data.links, [p.id]: v } })}
                  placeholder={p.ph}/>
              </div>
            ))}
          </div>
          <ErrorMsg msg={error}/>
          <ContinueBtn disabled={loading} loading={loading} onClick={handleSave}/>
          <SkipBtn onClick={next}/>
        </div>
      )

      /* ── 8 (creator): Success ── */
      case 8: if (role !== 'creator') return null; return (
        <div style={{ textAlign: 'center', paddingTop: isMobile ? 8 : 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
            background: 'linear-gradient(135deg,rgba(139,49,232,0.18),rgba(180,74,240,0.10))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: C.shadowLg, animation: 'bounce 0.6s ease',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="cr-ck" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8b31e8"/><stop offset="1" stopColor="#b44af0"/>
                </linearGradient>
              </defs>
              <path d="M7 16 L13 22 L25 10" stroke="url(#cr-ck)"
                strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h2 style={{ ...h2, textAlign: 'center' }}>
            {data.name ? `You're in, ${data.name.split(' ')[0]}!` : "You're in!"}
          </h2>
          <p style={{ ...sub, textAlign: 'center', maxWidth: 340, margin: '8px auto 32px' }}>
            Your creator portfolio is ready. Let's build it out so brands can discover you.
          </p>
          <button
            onClick={() => router.push('/creator-studio')}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
            style={{
              display: 'block', width: '100%', padding: '15px 24px',
              borderRadius: C.rSm, background: C.grad, color: '#fff',
              border: 'none', fontSize: 15, fontWeight: 700, letterSpacing: '0.04em',
              cursor: 'pointer', fontFamily: C.font, boxShadow: C.shadowMd,
              transition: 'opacity .2s, transform .2s', animation: 'fadeUp 0.4s ease 0.15s both',
            }}>Build my profile →</button>
        </div>
      )

      default: return null
    }
  }

  const showDots = role === 'creator' && mode === 'signup' && !shortSuccess
  if (w === 0) return null

  if (!role) return (
    <div style={{
      minHeight: '100vh', background: C.bgPage,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '24px 20px' : '40px 24px',
    }}>
      <RoleSelector onSelect={selectRole} isMobile={isMobile}/>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;}button{-webkit-tap-highlight-color:transparent;}
      `}</style>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: C.bgPage,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '24px 20px' : '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: maxForm }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: C.rLg, overflow: 'hidden' }}>
            <img src="/Nex.webp" alt="Nexfluence"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={back} aria-label="Go back" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.inkFaint, fontSize: 18, lineHeight: 1, padding: '4px 2px',
            minWidth: 28, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: C.font, transition: 'color 0.15s', flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = C.ink)}
            onMouseLeave={e => (e.currentTarget.style.color = C.inkFaint)}
          >←</button>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {showDots
              ? <StepDots current={step} total={totalSteps}/>
              : !shortSuccess && (
                <span style={{ fontSize: 12, color: C.inkFaint, fontFamily: C.font, fontWeight: 600, letterSpacing: '0.06em' }}>
                  {ROLE_LABEL[role]} · Step {step} of {totalSteps}
                </span>
              )
            }
          </div>
          <div style={{ width: 28, flexShrink: 0 }}/>
        </div>

        <div style={{
          background: '#fff', borderRadius: C.rLg,
          boxShadow: C.shadowCard, padding: formPad,
          border: '1px solid rgba(139,49,232,0.08)',
        }}>
          <div key={animKey} style={{ animation: 'fadeUp 0.32s ease forwards' }}>
            {renderStep()}
          </div>
        </div>

        {step === 1 && !shortSuccess && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: C.inkFaint, fontFamily: C.font, lineHeight: 1.6 }}>
            Free forever · No credit card needed · GDPR compliant
          </p>
        )}
      </div>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-10px)}70%{transform:translateY(-5px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box;}
        input::placeholder{color:rgba(10,6,18,0.28);}
        input:focus{outline:none;}
        button{-webkit-tap-highlight-color:transparent;}
      `}</style>
    </div>
  )
}