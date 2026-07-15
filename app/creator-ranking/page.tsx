'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Creator Rankings — app/creator-ranking/page.tsx
   Nexfluence v4, LIGHT

   PRODUCT CONCEPT: unchanged from prior revision — Product Hunt for
   Baltic creators, opaque Nexus Score™, top-3 shareable 1080×1080 card.

   THIS REVISION:
   • Every emoji removed — platform icons, category icons, rank
     insignia, and the NSC explainer icons are now a consistent
     monoline SVG icon set.
   • Rank insignia is now a RankEmblem — a laurel medallion drawn in
     both React (SVG) and Canvas (paths), replacing the old crown/
     medal emoji. This matters most on the generated share PNG, which
     previously depended on the system emoji font being present.
   • General polish pass: softer shadows, a touch more restraint in
     spacing and border color, a laurel accent on the podium divider.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_3px_rgba(10,6,18,0.04),0_16px_40px_-16px_rgba(139,49,232,0.18)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ─── Types ──────────────────────────────────────────────────────── */
type Period   = 'today' | 'week' | 'month' | 'alltime'
type Category = 'all' | 'fitness' | 'beauty' | 'food' | 'fashion' | 'travel' | 'tech' | 'lifestyle' | 'sport'
type PlatformName = 'Instagram' | 'TikTok' | 'YouTube' | 'Strava'

interface Creator {
  id:              string
  name:            string
  handle:          string
  avatarUrl:       string
  avatarColor:     string
  initials:        string
  niche:           Category
  nicheLabel:      string
  location:        string
  platforms:       { name: PlatformName; followers: string }[]
  _views:          number
  _saves:          number
  _campaigns:      number
  _engagementRate: number
  _recencyBoost:   number
  nsc:             number
  rank:            number
  prevRank:        number | null
  verified:        boolean
  bio:             string
}

/* ─── NSC formula — opaque to users, transparent here ── */
function computeNSC(c: Omit<Creator,'nsc'|'rank'|'prevRank'>): number {
  return Math.round(
    c._views * 0.30 +
    c._saves * 1.80 +
    c._campaigns * 120 +
    c._engagementRate * 400 +
    c._recencyBoost
  )
}

/* ─── Rank colour rings — used by RankEmblem, podium border, canvas ── */
const RANK_RING: Record<number, { from: string; via: string; to: string; label: string; glow: string }> = {
  1: { from: '#F59E0B', via: '#FCD34D', to: '#D97706', label: '#1 Creator', glow: 'rgba(245,158,11,0.45)' },
  2: { from: '#94A3B8', via: '#CBD5E1', to: '#64748B', label: '#2 Creator', glow: 'rgba(148,163,184,0.35)' },
  3: { from: '#C2833B', via: '#E4A45A', to: '#9A6229', label: '#3 Creator', glow: 'rgba(194,131,59,0.35)' },
}
const DEFAULT_RING = { from: '#8B31E8', via: '#B44FF0', to: '#FF33BC', label: 'Ranked', glow: 'rgba(139,49,232,0.28)' }

/* ─── Mock creators dataset ── */
const BASE_CREATORS: Omit<Creator,'nsc'|'rank'|'prevRank'>[] = [
  {
    id: 'c01', name: 'Amelia Roze', handle: 'amelia.roze',
    avatarUrl: '', avatarColor: '#8B31E8', initials: 'AR',
    niche: 'fitness', nicheLabel: 'Fitness & Wellness',
    location: 'Riga, Latvia', verified: true,
    bio: 'Certified PT · HIIT specialist · Sponsored by Kinetics',
    platforms: [
      { name: 'Instagram', followers: '67K'  },
      { name: 'TikTok',    followers: '142K' },
      { name: 'YouTube',   followers: '18K'  },
    ],
    _views: 14800, _saves: 2210, _campaigns: 5, _engagementRate: 7.4, _recencyBoost: 320,
  },
  {
    id: 'c02', name: 'Markus Tamm', handle: 'markus.tamm',
    avatarUrl: '', avatarColor: '#2563EB', initials: 'MT',
    niche: 'sport', nicheLabel: 'Sport & Running',
    location: 'Tallinn, Estonia', verified: true,
    bio: 'Ultra marathon runner · Race ambassador · Trail obsessed',
    platforms: [
      { name: 'Instagram', followers: '38K' },
      { name: 'TikTok',    followers: '95K' },
      { name: 'Strava',    followers: '11K' },
    ],
    _views: 9200, _saves: 1840, _campaigns: 3, _engagementRate: 8.1, _recencyBoost: 190,
  },
  {
    id: 'c03', name: 'Sandra Liepa', handle: 'sandra.liepa',
    avatarUrl: '', avatarColor: '#DB2777', initials: 'SL',
    niche: 'beauty', nicheLabel: 'Beauty & Skincare',
    location: 'Riga, Latvia', verified: true,
    bio: 'Clean beauty · Skin minimalist · Lumora Skincare partner',
    platforms: [
      { name: 'Instagram', followers: '52K' },
      { name: 'TikTok',    followers: '88K' },
    ],
    _views: 11400, _saves: 1980, _campaigns: 4, _engagementRate: 6.9, _recencyBoost: 240,
  },
  {
    id: 'c04', name: 'Rūta Vaitkutė', handle: 'ruta.v',
    avatarUrl: '', avatarColor: '#059669', initials: 'RV',
    niche: 'lifestyle', nicheLabel: 'Lifestyle & Travel',
    location: 'Vilnius, Lithuania', verified: false,
    bio: 'Baltic travel stories · slow living · brand partner',
    platforms: [
      { name: 'Instagram', followers: '29K' },
      { name: 'YouTube',   followers: '8K'  },
    ],
    _views: 7600, _saves: 1320, _campaigns: 2, _engagementRate: 5.8, _recencyBoost: 80,
  },
  {
    id: 'c05', name: 'Jonas Petrauskas', handle: 'jonas.pt',
    avatarUrl: '', avatarColor: '#D97706', initials: 'JP',
    niche: 'fitness', nicheLabel: 'Fitness & Nutrition',
    location: 'Kaunas, Lithuania', verified: false,
    bio: 'Sports nutrition · powerlifting · Vitality Stack creator',
    platforms: [
      { name: 'Instagram', followers: '22K' },
      { name: 'TikTok',    followers: '61K' },
    ],
    _views: 5800, _saves: 940, _campaigns: 2, _engagementRate: 5.2, _recencyBoost: 60,
  },
  {
    id: 'c06', name: 'Elīna Krūmiņa', handle: 'elina.active',
    avatarUrl: '', avatarColor: '#7C3AED', initials: 'EK',
    niche: 'fitness', nicheLabel: 'Fitness & Dance',
    location: 'Riga, Latvia', verified: false,
    bio: 'Dance fitness · Body positivity · 500th creator on Nexus',
    platforms: [
      { name: 'Instagram', followers: '67K' },
      { name: 'TikTok',    followers: '34K' },
    ],
    _views: 6400, _saves: 1100, _campaigns: 1, _engagementRate: 6.1, _recencyBoost: 140,
  },
  {
    id: 'c07', name: 'Laura Kask', handle: 'laurakask',
    avatarUrl: '', avatarColor: '#BE185D', initials: 'LK',
    niche: 'food', nicheLabel: 'Food & Recipes',
    location: 'Tartu, Estonia', verified: true,
    bio: 'Baltic cuisine · fermentation · seasonal cooking',
    platforms: [
      { name: 'Instagram', followers: '44K' },
      { name: 'YouTube',   followers: '22K' },
    ],
    _views: 9800, _saves: 1650, _campaigns: 3, _engagementRate: 5.5, _recencyBoost: 110,
  },
  {
    id: 'c08', name: 'Andris Bērziņš', handle: 'andris.tech',
    avatarUrl: '', avatarColor: '#0369A1', initials: 'AB',
    niche: 'tech', nicheLabel: 'Tech & Gadgets',
    location: 'Riga, Latvia', verified: false,
    bio: 'Baltic tech reviewer · startup culture · honest takes',
    platforms: [
      { name: 'YouTube',   followers: '31K' },
      { name: 'Instagram', followers: '12K' },
    ],
    _views: 4200, _saves: 720, _campaigns: 1, _engagementRate: 4.8, _recencyBoost: 50,
  },
  {
    id: 'c09', name: 'Monika Jankauskaitė', handle: 'monika.j',
    avatarUrl: '', avatarColor: '#EA580C', initials: 'MJ',
    niche: 'fashion', nicheLabel: 'Fashion & Style',
    location: 'Vilnius, Lithuania', verified: true,
    bio: 'Baltic fashion week regular · sustainable style advocate',
    platforms: [
      { name: 'Instagram', followers: '58K' },
      { name: 'TikTok',    followers: '43K' },
    ],
    _views: 8900, _saves: 1480, _campaigns: 2, _engagementRate: 6.3, _recencyBoost: 130,
  },
  {
    id: 'c10', name: 'Tõnis Valk', handle: 'tonis.travels',
    avatarUrl: '', avatarColor: '#0F766E', initials: 'TV',
    niche: 'travel', nicheLabel: 'Travel & Adventure',
    location: 'Tallinn, Estonia', verified: false,
    bio: 'Hidden Baltic gems · van life · outdoor adventures',
    platforms: [
      { name: 'Instagram', followers: '33K' },
      { name: 'YouTube',   followers: '14K' },
    ],
    _views: 5100, _saves: 890, _campaigns: 1, _engagementRate: 5.0, _recencyBoost: 70,
  },
]

/* ─── Period multipliers ── */
const PERIOD_MULT: Record<Period, (base: number, idx: number) => number> = {
  today:   (b, i) => Math.round(b * 0.05 + Math.sin(i) * 400 + 200),
  week:    (b)    => Math.round(b * 0.3),
  month:   (b)    => Math.round(b * 0.7),
  alltime: (b)    => b,
}

function buildRanking(period: Period, category: Category): Creator[] {
  const filtered = category === 'all' ? BASE_CREATORS : BASE_CREATORS.filter(c => c.niche === category)
  return filtered
    .map((c, i) => ({ ...c, nsc: PERIOD_MULT[period](computeNSC(c), i), rank: 0, prevRank: null }))
    .sort((a, b) => b.nsc - a.nsc)
    .map((c, i) => ({ ...c, rank: i + 1, prevRank: i === 0 ? 3 : i === 1 ? 1 : i + 2 }))
}

/* ════════════════════════════════════════════════════════════════════
   ICON SET — replaces every emoji used previously
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function ShareIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function DownloadIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TrendUpIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TrendDownIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function InfoIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function CopyIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function CheckIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TrophyIcon({ s = 22 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M8 3h8v4a4 4 0 01-8 0V3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M8 4H4v2a4 4 0 004 4M16 4h4v2a4 4 0 01-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 11v4M9 20h6M9 20c0-2 1-2.5 3-2.5s3 .5 3 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChatIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BoltIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ── Category icons ── */
function IconSparkle({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
}
function IconDumbbell({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 9v6M2 10v4M20 9v6M22 10v4M7 12h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><rect x="4" y="8" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.6"/><rect x="17" y="8" width="3" height="8" rx="1" stroke="currentColor" strokeWidth="1.6"/></svg>
}
function IconDroplet({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
}
function IconUtensils({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2v7a2 2 0 002 2v11M6 2v7M9 2v7M4 2v7M18 2c-1.7 0-3 1.8-3 5s1.3 5 3 5v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function IconHanger({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 4a2 2 0 10-2 2M12 6l9 6-2 2H5l-2-2 9-6z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 18h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
}
function IconPlane({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 16l20-8-8 20-2-8-8-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
}
function IconLeaf({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 20C4 10 12 4 20 4c0 8-6 16-16 16z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M6 18C10 13 13 9 18 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
const CATEGORY_ICON: Record<Category, (s?: number) => ReactNode> = {
  all:       s => <IconSparkle s={s}/>,
  fitness:   s => <IconDumbbell s={s}/>,
  beauty:    s => <IconDroplet s={s}/>,
  food:      s => <IconUtensils s={s}/>,
  fashion:   s => <IconHanger s={s}/>,
  travel:    s => <IconPlane s={s}/>,
  tech:      s => <BoltIcon s={s}/>,
  lifestyle: s => <IconLeaf s={s}/>,
  sport:     s => <TrophyIcon s={s}/>,
}

/* ── Platform icons — monoline, no brand colour, kept quiet/elegant ── */
function IconInstagramLine({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg>
}
function IconTikTokLine({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 3v11a3.5 3.5 0 11-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 3c.5 2.6 2.3 4.4 5 4.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
}
function IconYouTubeLine({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="1.6"/><path d="M10 9l5 3-5 3V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
}
function IconStravaLine({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 3l5 10h4L11 3H9z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M11.5 13l3 6 3-6h-3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
}
const PLATFORM_ICON: Record<PlatformName, (s?: number) => ReactNode> = {
  Instagram: s => <IconInstagramLine s={s}/>,
  TikTok:    s => <IconTikTokLine s={s}/>,
  YouTube:   s => <IconYouTubeLine s={s}/>,
  Strava:    s => <IconStravaLine s={s}/>,
}

/* ════════════════════════════════════════════════════════════════════
   RANK EMBLEM — laurel medallion, replaces crown/medal emoji everywhere
   ════════════════════════════════════════════════════════════════════ */
function LaurelBranch({ side, gradId }: { side: 'left' | 'right'; gradId: string }) {
  const sign = side === 'left' ? -1 : 1
  const leaves = Array.from({ length: 6 }, (_, i) => i)
  return (
    <g>
      {leaves.map(i => {
        const t = i / (leaves.length - 1)
        const angleDeg = -108 + t * 96
        const rad = (angleDeg * Math.PI) / 180
        const r = 33 + t * 5
        const cx = 50 + sign * Math.cos(rad) * r
        const cy = 60 - Math.sin(rad) * r
        const leafAngle = sign * (angleDeg + 90)
        const scale = 1 - t * 0.32
        return (
          <ellipse key={i} cx={cx} cy={cy} rx={6.4 * scale} ry={3 * scale}
            fill={`url(#${gradId})`} opacity={0.92 - t * 0.18}
            transform={`rotate(${leafAngle} ${cx} ${cy})`}/>
        )
      })}
    </g>
  )
}

function RankEmblem({ rank, size = 64 }: { rank: number; size?: number }) {
  const rr = RANK_RING[rank] ?? DEFAULT_RING
  const gradId = `rank-emblem-grad-${rank}-${size}`
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="absolute inset-0" style={{ filter: `drop-shadow(0 4px 10px ${rr.glow})` }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={rr.from}/>
            <stop offset="55%" stopColor={rr.via}/>
            <stop offset="100%" stopColor={rr.to}/>
          </linearGradient>
        </defs>
        <LaurelBranch side="left" gradId={gradId}/>
        <LaurelBranch side="right" gradId={gradId}/>
        <circle cx="50" cy="42" r="25" fill={`url(#${gradId})`} opacity="0.13"/>
        <circle cx="50" cy="42" r="25" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.4"/>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: size * 0.13 }}>
        <span className="font-black leading-none" style={{
          fontSize: size * 0.3,
          backgroundImage: `linear-gradient(135deg, ${rr.from}, ${rr.to})`,
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}>{rank}</span>
      </div>
    </div>
  )
}

/* ─── Avatar — circular with optional rank ring ── */
function Avatar({ creator, size, ring = false }: { creator: Creator; size: number; ring?: boolean }) {
  const rr = ring && creator.rank <= 3 ? RANK_RING[creator.rank] : null
  const pad = rr ? 3 : 0
  return (
    <div className="relative flex-shrink-0" style={{ width: size + pad * 2, height: size + pad * 2 }}>
      {rr && (
        <div className="absolute inset-0 rounded-full"
          style={{ background: `linear-gradient(135deg, ${rr.from}, ${rr.via}, ${rr.to})`, boxShadow: `0 0 22px ${rr.glow}` }}/>
      )}
      <div className="absolute rounded-full overflow-hidden flex items-center justify-center text-white font-black"
        style={{ inset: pad, background: creator.avatarUrl ? undefined : creator.avatarColor, fontSize: size * 0.35, border: rr ? '2px solid #0A0612' : undefined }}>
        {creator.avatarUrl
          ? <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover"/> // eslint-disable-line @next/next/no-img-element
          : creator.initials}
      </div>
    </div>
  )
}

/* ─── NSC badge — refined pill ── */
function NSCBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = {
    sm: 'px-2.5 py-1 text-[10.5px]',
    md: 'px-3.5 py-1.5 text-[12px]',
    lg: 'px-5 py-2 text-[14px]',
  }[size]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-primary/12 bg-primary/[0.06] font-black text-primary ${cls}`}>
      <span className="text-[10px] font-black tracking-[0.06em] opacity-55">NSC</span>
      {score.toLocaleString()}
    </span>
  )
}

/* ─── Rank delta badge ── */
function RankDelta({ creator }: { creator: Creator }) {
  const prev = creator.prevRank
  if (!prev) return <span className="text-[10px] font-bold tracking-[0.06em] text-ink/25">NEW</span>
  const delta = prev - creator.rank
  if (delta === 0) return <span className="text-[10px] text-ink/30">—</span>
  return (
    <span className={`flex items-center gap-0.5 text-[10.5px] font-bold ${delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
      {delta > 0 ? <TrendUpIcon s={11}/> : <TrendDownIcon s={11}/>}{Math.abs(delta)}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CANVAS SHARE CARD GENERATOR — 1080×1080 PNG, no emoji font dependency
   ════════════════════════════════════════════════════════════════════ */
let _yuseiLoaded = false
async function ensureYuseiMagic(): Promise<void> {
  if (_yuseiLoaded) return
  try {
    if (!document.querySelector('link[href*="Yusei+Magic"]')) {
      const link = document.createElement('link')
      link.href = 'https://fonts.googleapis.com/css2?family=Yusei+Magic&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    await document.fonts.load('400 1em "Yusei Magic"')
    _yuseiLoaded = true
  } catch { _yuseiLoaded = true }
}
function yuseiMagic(weight: 400 | 700 | 900, px: number): string {
  return `${weight} ${px}px 'Yusei Magic', 'Nunito', 'Poppins', 'Helvetica Neue', Arial, sans-serif`
}

/* Draws the same laurel medallion used in React, but with plain Canvas
   paths — no emoji glyph, no font dependency for the icon itself. */
function drawLaurelBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, from: string, via: string, to: string) {
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  grad.addColorStop(0, from); grad.addColorStop(0.55, via); grad.addColorStop(1, to)

  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = grad; ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 1

  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.lineWidth = r * 0.1; ctx.strokeStyle = grad; ctx.stroke()

  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const t = i / 5
      const angleDeg = -108 + t * 96
      const rad = (angleDeg * Math.PI) / 180
      const rr2 = r * 1.28 + t * r * 0.16
      const lx = cx + side * Math.cos(rad) * rr2
      const ly = cy + r * 0.42 - Math.sin(rad) * rr2
      const leafAngle = side * (rad + Math.PI / 2)
      const scale = 1 - t * 0.3
      ctx.save()
      ctx.translate(lx, ly)
      ctx.rotate(leafAngle)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.3 * scale, r * 0.135 * scale, 0, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.globalAlpha = 0.9 - t * 0.15
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.restore()
    }
  }
  ctx.restore()
}

async function generateShareCard(creator: Creator): Promise<string> {
  await ensureYuseiMagic()

  const SIZE = 1080
  const canvas = document.createElement('canvas')
  canvas.width = SIZE; canvas.height = SIZE
  const ctx = canvas.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  bg.addColorStop(0, '#0A0612'); bg.addColorStop(0.45, '#160930'); bg.addColorStop(1, '#0F0620')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, SIZE, SIZE)

  ctx.globalAlpha = 0.04
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(Math.random() * SIZE, Math.random() * SIZE, Math.random() * 1.2, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1

  const orb1 = ctx.createRadialGradient(160, 220, 0, 160, 220, 460)
  orb1.addColorStop(0, 'rgba(139,49,232,0.32)'); orb1.addColorStop(1, 'rgba(139,49,232,0)')
  ctx.fillStyle = orb1; ctx.fillRect(0, 0, SIZE, SIZE)
  const orb2 = ctx.createRadialGradient(SIZE - 120, SIZE - 140, 0, SIZE - 120, SIZE - 140, 380)
  orb2.addColorStop(0, 'rgba(255,51,188,0.22)'); orb2.addColorStop(1, 'rgba(255,51,188,0)')
  ctx.fillStyle = orb2; ctx.fillRect(0, 0, SIZE, SIZE)
  const orb3 = ctx.createRadialGradient(SIZE / 2, SIZE - 80, 0, SIZE / 2, SIZE - 80, 320)
  orb3.addColorStop(0, 'rgba(180,79,240,0.18)'); orb3.addColorStop(1, 'rgba(180,79,240,0)')
  ctx.fillStyle = orb3; ctx.fillRect(0, 0, SIZE, SIZE)

  const rr = RANK_RING[creator.rank] ?? DEFAULT_RING

  /* Ghost rank number */
  ctx.save()
  ctx.font = yuseiMagic(900, 420)
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  const ghostG = ctx.createLinearGradient(0, SIZE * 0.42, 0, SIZE * 0.88)
  ghostG.addColorStop(0, 'rgba(139,49,232,0.22)'); ghostG.addColorStop(1, 'rgba(139,49,232,0)')
  ctx.fillStyle = ghostG
  ctx.fillText(String(creator.rank), SIZE / 2, SIZE * 0.85)
  ctx.restore()

  /* Circular avatar */
  const AV = 210, AX = SIZE / 2, AY = 315, RING = 12
  const ringG = ctx.createLinearGradient(AX - AV / 2, AY - AV / 2, AX + AV / 2, AY + AV / 2)
  ringG.addColorStop(0, rr.from); ringG.addColorStop(0.5, rr.via); ringG.addColorStop(1, rr.to)
  ctx.beginPath(); ctx.arc(AX, AY, AV / 2 + RING + 3, 0, Math.PI * 2)
  ctx.fillStyle = ringG; ctx.shadowColor = rr.glow; ctx.shadowBlur = 50; ctx.fill(); ctx.shadowBlur = 0

  ctx.beginPath(); ctx.arc(AX, AY, AV / 2 + 3, 0, Math.PI * 2); ctx.fillStyle = '#0A0612'; ctx.fill()

  ctx.save()
  ctx.beginPath(); ctx.arc(AX, AY, AV / 2, 0, Math.PI * 2); ctx.clip()
  if (creator.avatarUrl) {
    try {
      const img = new Image(); img.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('img')); img.src = creator.avatarUrl })
      ctx.drawImage(img, AX - AV / 2, AY - AV / 2, AV, AV)
    } catch {
      ctx.fillStyle = creator.avatarColor; ctx.fillRect(AX - AV / 2, AY - AV / 2, AV, AV)
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = yuseiMagic(900, 78)
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(creator.initials, AX, AY)
    }
  } else {
    ctx.fillStyle = creator.avatarColor; ctx.fillRect(AX - AV / 2, AY - AV / 2, AV, AV)
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = yuseiMagic(900, 78)
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(creator.initials, AX, AY)
  }
  ctx.restore(); ctx.textBaseline = 'alphabetic'

  /* Name */
  ctx.font = yuseiMagic(900, 62); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'
  ctx.fillText(creator.name, SIZE / 2, AY + AV / 2 + 84)

  /* Handle */
  const handleG = ctx.createLinearGradient(SIZE * 0.2, 0, SIZE * 0.8, 0)
  handleG.addColorStop(0, '#8B31E8'); handleG.addColorStop(0.5, '#B44FF0'); handleG.addColorStop(1, '#FF33BC')
  ctx.fillStyle = handleG; ctx.font = yuseiMagic(700, 38)
  ctx.fillText(`@${creator.handle}`, SIZE / 2, AY + AV / 2 + 144)

  /* Rank pill — laurel badge (drawn) + label text, no emoji */
  const PILL_W = 420, PILL_H = 104
  const PILL_X = SIZE / 2 - PILL_W / 2
  const PILL_Y = AY + AV / 2 + 192

  const pillG = ctx.createLinearGradient(PILL_X, 0, PILL_X + PILL_W, 0)
  pillG.addColorStop(0, rr.from); pillG.addColorStop(0.5, rr.via); pillG.addColorStop(1, rr.to)
  ctx.beginPath(); roundRect(ctx, PILL_X, PILL_Y, PILL_W, PILL_H, 52)
  ctx.fillStyle = pillG; ctx.shadowColor = rr.glow; ctx.shadowBlur = 36; ctx.fill(); ctx.shadowBlur = 0

  const glossG = ctx.createLinearGradient(0, PILL_Y, 0, PILL_Y + PILL_H * 0.5)
  glossG.addColorStop(0, 'rgba(255,255,255,0.18)'); glossG.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.beginPath(); roundRect(ctx, PILL_X + 2, PILL_Y + 2, PILL_W - 4, PILL_H * 0.5, 50)
  ctx.fillStyle = glossG; ctx.fill()

  /* Laurel badge, white variant so it reads against the coloured pill */
  drawLaurelBadge(ctx, PILL_X + 76, PILL_Y + PILL_H / 2, 34, 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.65)')
  ctx.font = yuseiMagic(900, 30); ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(String(creator.rank), PILL_X + 76, PILL_Y + PILL_H / 2 + 1)

  ctx.font = yuseiMagic(900, 40); ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle'
  ctx.fillText(rr.label, SIZE / 2 + 42, PILL_Y + PILL_H / 2)
  ctx.textBaseline = 'alphabetic'

  /* NSC score */
  const scoreY = PILL_Y + PILL_H + 54
  ctx.font = yuseiMagic(400, 22); ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.textAlign = 'center'
  ctx.fillText('NEXUS SCORE™', SIZE / 2, scoreY)
  ctx.font = yuseiMagic(900, 48); ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.fillText(`NSC ${creator.nsc.toLocaleString()}`, SIZE / 2, scoreY + 56)

  /* Niche pill */
  const NICHE = creator.nicheLabel.toUpperCase()
  ctx.font = yuseiMagic(700, 21)
  const nMet = ctx.measureText(NICHE)
  const nW = nMet.width + 56, nX = SIZE / 2 - nW / 2, nY = scoreY + 90

  ctx.beginPath(); roundRect(ctx, nX - 1, nY - 1, nW + 2, 50, 26)
  const nicheBorderG = ctx.createLinearGradient(nX, 0, nX + nW, 0)
  nicheBorderG.addColorStop(0, '#8B31E8'); nicheBorderG.addColorStop(1, '#FF33BC')
  ctx.fillStyle = nicheBorderG; ctx.fill()

  ctx.beginPath(); roundRect(ctx, nX, nY, nW, 48, 25); ctx.fillStyle = 'rgba(10,6,18,0.65)'; ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(NICHE, SIZE / 2, nY + 24); ctx.textBaseline = 'alphabetic'

  /* Footer */
  const footerH = 148, footerY = SIZE - footerH
  const footerBg = ctx.createLinearGradient(0, footerY - 40, 0, SIZE)
  footerBg.addColorStop(0, 'rgba(10,6,18,0)'); footerBg.addColorStop(0.25, 'rgba(10,6,18,0.75)'); footerBg.addColorStop(1, 'rgba(10,6,18,0.95)')
  ctx.fillStyle = footerBg; ctx.fillRect(0, footerY - 40, SIZE, footerH + 40)

  const lineG = ctx.createLinearGradient(0, 0, SIZE, 0)
  lineG.addColorStop(0, 'rgba(139,49,232,0)'); lineG.addColorStop(0.2, 'rgba(139,49,232,0.7)')
  lineG.addColorStop(0.5, 'rgba(255,51,188,0.9)'); lineG.addColorStop(0.8, 'rgba(139,49,232,0.7)'); lineG.addColorStop(1, 'rgba(139,49,232,0)')
  ctx.strokeStyle = lineG; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(60, footerY + 2); ctx.lineTo(SIZE - 60, footerY + 2); ctx.stroke()

  const brandG = ctx.createLinearGradient(SIZE * 0.2, 0, SIZE * 0.8, 0)
  brandG.addColorStop(0, '#8B31E8'); brandG.addColorStop(0.5, '#B44FF0'); brandG.addColorStop(1, '#FF33BC')
  ctx.font = yuseiMagic(900, 38); ctx.fillStyle = brandG; ctx.textAlign = 'center'
  ctx.fillText('CREATOR NEXUS', SIZE / 2, footerY + 54)

  ctx.font = yuseiMagic(400, 20); ctx.fillStyle = 'rgba(255,255,255,0.42)'
  ctx.fillText('by Nexfluence  ·  Ranked by Nexus Score™', SIZE / 2, footerY + 90)

  ctx.font = yuseiMagic(400, 18); ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillText('nexus.nexfluence.eu', SIZE / 2, footerY + 122)

  return canvas.toDataURL('image/png', 1.0)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/* ════════════════════════════════════════════════════════════════════
   SHARE CARD MODAL
   ════════════════════════════════════════════════════════════════════ */
function ShareCardModal({ creator, onClose }: { creator: Creator; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState(false)
  const rr = RANK_RING[creator.rank] ?? DEFAULT_RING

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    generateShareCard(creator).then(url => { setDataUrl(url); setLoading(false) }).catch(() => setLoading(false))
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [creator.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const download = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl; a.download = `nexus-rank-${creator.rank}-${creator.handle.replace('.', '-')}.png`; a.click()
  }
  const copyLink = () => {
    navigator.clipboard.writeText(`https://nexus.nexfluence.eu/creator/${creator.handle}`).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-md" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[520px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}>
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
          <div>
            <h3 className="text-[16px] font-extrabold text-ink">Share your ranking card</h3>
            <p className="text-[12.5px] text-ink/45 mt-0.5">Download a 1080×1080 PNG — perfect for Instagram</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        <div className="flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0A0612 0%, #1A0B35 100%)' }}>
          {loading ? (
            <div className="flex h-[320px] w-[320px] items-center justify-center rounded-2xl bg-white/5">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"/>
                <p className="text-[12px] text-white/40">Generating card…</p>
              </div>
            </div>
          ) : dataUrl ? (
            <img src={dataUrl} alt="Share card preview" className="h-[320px] w-[320px] rounded-2xl object-cover shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)]"/> // eslint-disable-line @next/next/no-img-element
          ) : (
            <div className="flex h-[320px] w-[320px] items-center justify-center rounded-2xl bg-white/5"><p className="text-[12px] text-white/40">Could not generate card</p></div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2.5 px-6 pb-3">
          <RankEmblem rank={creator.rank} size={26}/>
          <span className="text-[14.5px] font-extrabold text-ink">{creator.name}</span>
          <span className={`text-[13.5px] font-bold ${GRAD_TXT}`}>{rr.label}</span>
        </div>

        <div className="flex gap-3 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
          <button onClick={copyLink} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/60 transition hover:bg-surface-sub">
            {copied ? <><CheckIcon s={13}/>Copied!</> : <><CopyIcon s={13}/>Copy link</>}
          </button>
          <button onClick={download} disabled={!dataUrl || loading}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${dataUrl && !loading ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            <DownloadIcon s={15}/>Download PNG
          </button>
        </div>
        <p className="pb-4 text-center text-[11.5px] text-ink/30">Share on Instagram Feed or Story · 1080×1080px</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PODIUM CARD — Top 3
   ════════════════════════════════════════════════════════════════════ */
function PodiumCard({ creator, onShare }: { creator: Creator; onShare: () => void }) {
  const rr = RANK_RING[creator.rank] ?? DEFAULT_RING
  const isFirst = creator.rank === 1

  return (
    <div className={`relative flex flex-col items-center overflow-hidden rounded-[28px] border bg-white p-7 text-center transition duration-300 hover:-translate-y-1.5 ${CARD} ${isFirst ? 'md:scale-105 md:z-10' : ''}`}
      style={{ borderColor: rr.from + '35' }}>

      {/* Top accent bar in rank gradient */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${rr.from}, ${rr.via}, ${rr.to})` }}/>

      {/* Ghost rank number */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden select-none" aria-hidden="true">
        <span className="pb-0 font-black leading-none text-ink/[0.035]" style={{ fontSize: isFirst ? 280 : 220 }}>{creator.rank}</span>
      </div>

      {/* Laurel emblem */}
      <div className="relative mb-2">
        <RankEmblem rank={creator.rank} size={isFirst ? 56 : 46}/>
      </div>

      <div className="relative mb-4">
        <Avatar creator={creator} size={isFirst ? 96 : 80} ring/>
      </div>

      <h3 className="relative text-[17px] font-extrabold tracking-[-0.02em] text-ink">{creator.name}</h3>
      <p className={`relative mt-0.5 text-[13px] font-bold ${GRAD_TXT}`}>@{creator.handle}</p>
      {creator.verified && (
        <span className="relative mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary/60">
          <img src="/Tick.svg" alt="" className="h-4 w-4"/> {/* eslint-disable-line @next/next/no-img-element */}
          Verified creator
        </span>
      )}

      <span className="relative mt-3 rounded-full border border-primary/12 bg-surface-sub px-3.5 py-1 text-[11.5px] font-bold text-ink/60">
        {creator.nicheLabel}
      </span>

      <div className="relative mt-4">
        <NSCBadge score={creator.nsc} size="lg"/>
        <p className="mt-1.5 text-[10.5px] tracking-[0.04em] text-ink/35">Nexus Score™</p>
      </div>

      <div className="relative mt-4 flex gap-4">
        {creator.platforms.slice(0, 3).map(p => (
          <div key={p.name} className="flex flex-col items-center gap-1">
            <span className="text-ink/40">{PLATFORM_ICON[p.name](15)}</span>
            <span className="text-[11px] font-bold text-ink/70">{p.followers}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-3"><RankDelta creator={creator}/></div>

      <button onClick={onShare}
        className={`relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl ${GRAD_BTN} py-3.5 text-[13.5px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 active:translate-y-0`}>
        <ShareIcon s={15}/>Share my card
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   LIST ROW — Ranks 4+
   ════════════════════════════════════════════════════════════════════ */
function RankRow({ creator }: { creator: Creator }) {
  return (
    <div className={`group flex items-center gap-4 rounded-2xl border border-primary/8 bg-white px-5 py-4 transition duration-300 hover:border-primary/20 hover:-translate-y-0.5 ${CARD}`}>
      <div className="relative flex w-10 flex-shrink-0 items-center justify-center">
        <span className="absolute text-[52px] font-black text-ink/[0.045] leading-none select-none" aria-hidden="true">{creator.rank}</span>
        <span className={`relative text-[18px] font-black ${GRAD_TXT}`}>#{creator.rank}</span>
      </div>

      <Avatar creator={creator} size={44}/>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-bold text-ink">{creator.name}</span>
          {creator.verified && <img src="/Tick.svg" alt="" className="h-4 w-4 flex-shrink-0"/>} {/* eslint-disable-line @next/next/no-img-element */}
        </div>
        <span className="text-[12px] text-ink/45">@{creator.handle} · {creator.nicheLabel}</span>
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        {creator.platforms.slice(0, 2).map(p => (
          <span key={p.name} className="flex items-center gap-1.5 rounded-lg bg-surface-sub px-2.5 py-1.5 text-[11.5px] font-semibold text-ink/55">
            <span className="text-ink/40">{PLATFORM_ICON[p.name](12)}</span>{p.followers}
          </span>
        ))}
      </div>

      <div className="hidden flex-shrink-0 sm:block"><RankDelta creator={creator}/></div>

      <NSCBadge score={creator.nsc} size="sm"/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function RankingsPage() {
  const [period,   setPeriod]   = useState<Period>('week')
  const [category, setCategory] = useState<Category>('all')
  const [shareTarget, setShareTarget] = useState<Creator | null>(null)
  const [showAlgoInfo, setShowAlgoInfo] = useState(false)
  const [animKey,  setAnimKey]  = useState(0)

  const changePeriod   = (p: Period)   => { setPeriod(p); setAnimKey(k => k + 1) }
  const changeCategory = (c: Category) => { setCategory(c); setAnimKey(k => k + 1) }

  const creators = buildRanking(period, category)
  const podium   = creators.slice(0, 3)
  const rest     = creators.slice(3)

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'today',   label: 'Today'      },
    { id: 'week',    label: 'This Week'  },
    { id: 'month',   label: 'This Month' },
    { id: 'alltime', label: 'All Time'   },
  ]
  const CATEGORIES: { id: Category; label: string }[] = [
    { id: 'all',       label: 'All'       },
    { id: 'fitness',   label: 'Fitness'   },
    { id: 'beauty',    label: 'Beauty'    },
    { id: 'food',      label: 'Food'      },
    { id: 'fashion',   label: 'Fashion'   },
    { id: 'travel',    label: 'Travel'    },
    { id: 'tech',      label: 'Tech'      },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'sport',     label: 'Sport'     },
  ]

  const NSC_FACTORS = [
    { icon: <TrendUpIcon s={16}/>, label: 'Reach' },
    { icon: <ChatIcon s={16}/>,    label: 'Engagement quality' },
    { icon: <CheckIcon s={16}/>,   label: 'Campaign record' },
    { icon: <BoltIcon s={16}/>,    label: 'Creator momentum' },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {shareTarget && <ShareCardModal creator={shareTarget} onClose={() => setShareTarget(null)}/>}

      {showAlgoInfo && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4" onClick={() => setShowAlgoInfo(false)}>
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setShowAlgoInfo(false)}/>
          <div className={`relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
            <div className="flex items-start justify-between border-b border-primary/10 px-6 py-5">
              <h3 className="text-[16px] font-extrabold text-ink">How Nexus Score™ works</h3>
              <button onClick={() => setShowAlgoInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-[14px] leading-[1.8] text-ink/65">
                Nexus Score™ is our proprietary ranking signal. It combines multiple signals about a creator's reach, quality of engagement, campaign delivery record, and recent activity momentum.
              </p>
              <div className="rounded-2xl border border-primary/10 bg-surface-sub/40 px-5 py-4 space-y-3">
                {[
                  { label: 'Reach', desc: 'Total profile views and discovery impressions across the platform' },
                  { label: 'Engagement quality', desc: 'How meaningfully your audience interacts — not just follower count' },
                  { label: 'Campaign performance', desc: 'Delivery record, brand ratings, on-time completion history' },
                  { label: 'Creator momentum', desc: 'Recency of activity — active creators rank higher than dormant ones' },
                ].map(s => (
                  <div key={s.label}>
                    <p className={`text-[12.5px] font-extrabold ${GRAD_TXT}`}>{s.label}</p>
                    <p className="text-[12.5px] text-ink/55 mt-0.5">{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[12.5px] font-semibold text-amber-700">
                  The exact formula is proprietary and updated periodically. We intentionally don't publish the weighting — because a disclosed formula is a gamed formula.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ FLOATING NAV ════ */}
      <header className="relative">
        <div className="absolute inset-x-0 z-40 flex justify-center px-4 pt-4">
          <div className="w-full max-w-[600px]">
            <div className="relative flex w-full items-center justify-between rounded-2xl px-4 py-3">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.88) 70%, rgba(255,255,255,0.88) 100%)',
                  WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                  maskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                }}/>
              <div className="relative z-10 flex items-center gap-0.5">
                {[{ label: 'Discover', href: '/creator-search' }, { label: 'Rankings', href: '/creator-ranking' }].map(n => (
                  <a key={n.label} href={n.href} className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary ${n.label === 'Rankings' ? 'text-primary bg-primary/[0.06]' : 'text-ink/70'}`}>{n.label}</a>
                ))}
              </div>
              <div className="w-16 flex-shrink-0" aria-hidden="true"/>
              <div className="relative z-10 flex items-center gap-0.5">
                {[{ label: 'For Brands', href: '/authenticate' }, { label: 'Join Nexus', href: '/authenticate' }].map(n => (
                  <a key={n.label} href={n.href} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary">{n.label}</a>
                ))}
              </div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
                <NexLogo className="pointer-events-auto h-10 drop-shadow-[0_6px_24px_rgba(139,49,232,0.65)] sm:h-12"/>
              </div>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden pb-12 pt-28 text-center" style={{ background: 'linear-gradient(160deg, #F5F0FE 0%, #F8F7FF 40%, #FFF0FA 100%)' }}>
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-[10%] top-[20%] h-80 w-80 rounded-full bg-primary/[0.08] blur-[80px]"/>
            <div className="absolute right-[5%] top-[30%] h-60 w-60 rounded-full bg-magenta/[0.07] blur-[70px]"/>
          </div>

          <div className="relative mb-5 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[12px] font-bold tracking-[0.02em] text-emerald-600">Updated every 24 hours</span>
          </div>

          <h1 className="relative text-[clamp(36px,6vw,72px)] font-black leading-[1.05] tracking-[-0.045em] text-ink">
            Creator <span className={GRAD_TXT}>Rankings</span>
          </h1>
          <p className="relative mt-4 text-[clamp(15px,2vw,18px)] leading-[1.7] text-ink/55 max-w-[520px] mx-auto px-4">
            The Baltic region's most influential creators, ranked daily by Nexus Score™.
          </p>

          <button onClick={() => setShowAlgoInfo(true)}
            className="relative mt-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-[12.5px] font-semibold text-ink/55 backdrop-blur-sm transition hover:border-primary/30 hover:text-primary">
            <InfoIcon s={13}/>Ranked by Nexus Score™ — proprietary algorithm
          </button>
        </div>
      </header>

      {/* ════ FILTERS ════ */}
      <div className="sticky top-0 z-30 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1080px] items-center gap-1 overflow-x-auto px-4 pt-3 pb-0">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => changePeriod(p.id)}
              className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition ${period === p.id ? `${GRAD_BTN} text-white shadow-[0_6px_16px_-6px_rgba(139,49,232,0.4)]` : 'text-ink/50 hover:text-ink/80 hover:bg-surface-sub'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="mx-auto flex max-w-[1080px] gap-2 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => changeCategory(c.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${category === c.id ? 'border-primary/30 bg-primary/[0.07] text-primary' : 'border-primary/10 bg-white text-ink/55 hover:border-primary/20'}`}>
              <span className={category === c.id ? 'text-primary' : 'text-ink/40'}>{CATEGORY_ICON[c.id](13)}</span>{c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-4 py-10">

        {creators.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-3xl ${GRAD_BTN} text-white shadow-[0_16px_40px_-10px_rgba(139,49,232,0.45)]`}><TrophyIcon s={32}/></div>
            <h3 className="text-[20px] font-extrabold text-ink">No creators yet in this category</h3>
            <p className="mt-2 text-[14px] text-ink/45">Check back soon — more creators are joining Nexus every day.</p>
          </div>
        )}

        {podium.length > 0 && (
          <div key={`podium-${animKey}`}>
            <div className="mb-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"/>
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-ink/35">Top creators</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"/>
            </div>

            <div className={`grid gap-6 ${podium.length === 1 ? 'grid-cols-1 max-w-[360px] mx-auto' : podium.length === 2 ? 'grid-cols-2 max-w-[720px] mx-auto' : 'grid-cols-1 sm:grid-cols-3'} mb-14 items-end`}>
              {podium.length === 3
                ? [podium[1]!, podium[0]!, podium[2]!].map(c => <PodiumCard key={c.id} creator={c} onShare={() => setShareTarget(c)}/>)
                : podium.map(c => <PodiumCard key={c.id} creator={c} onShare={() => setShareTarget(c)}/>)
              }
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div key={`list-${animKey}`}>
            <div className="mb-5 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/15 to-transparent"/>
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-ink/30">All rankings</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/15 to-transparent"/>
            </div>
            <div className="space-y-3">
              {rest.map((c, i) => (
                <div key={c.id} style={{ animationDelay: `${i * 40}ms` }} className="animate-[fadeSlideIn_0.4s_ease_forwards] opacity-0">
                  <RankRow creator={c}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NSC explainer footer */}
        <div className={`mt-16 rounded-[28px] border border-primary/10 bg-white p-9 ${CARD}`}>
          <div className="flex flex-col items-center text-center">
            <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_10px_28px_-8px_rgba(139,49,232,0.45)]`}><TrophyIcon s={24}/></div>
            <h3 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Nexus Score™</h3>
            <p className="mt-3 max-w-[540px] text-[14px] leading-[1.8] text-ink/55">
              Rankings update every 24 hours. Nexus Score™ is a composite signal — reach, engagement quality, campaign performance, and creator momentum. The exact formula is proprietary: a disclosed formula is a gamed formula.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {NSC_FACTORS.map(s => (
                <span key={s.label} className="flex items-center gap-2 rounded-xl border border-primary/10 bg-surface-sub px-4 py-2.5 text-[13px] font-semibold text-ink/60">
                  <span className="text-primary/70">{s.icon}</span>{s.label}
                </span>
              ))}
            </div>
            <button onClick={() => setShowAlgoInfo(true)} className="mt-5 text-[13px] font-bold text-primary hover:underline underline-offset-2">
              Learn more about Nexus Score™ →
            </button>
          </div>
        </div>

      </main>

      <footer className="bg-ink py-12 text-center">
        <NexLogo className="mx-auto h-10 mb-3"/>
        <p className="text-[12.5px] text-white/30">Creator Nexus by Nexfluence · Baltic Influencer Marketplace</p>
        <p className="mt-1 text-[12px] text-white/20">Rankings updated every 24h · Nexus Score™ is proprietary</p>
      </footer>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  )
}