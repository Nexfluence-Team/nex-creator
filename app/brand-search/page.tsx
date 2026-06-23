'use client'

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Creator search results — page.tsx  (Nexfluence v4, LIGHT)
   Vertical card grid · filter modal (blurred backdrop) · dismissible
   applied-filter tags (rounded rectangles + ×) below search bar.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const PAGE_SIZE = 9

const NICHES = ['Beauty', 'Fitness', 'Wellness', 'Lifestyle', 'Fashion', 'Food & Beverage', 'Tech', 'Travel', 'Parenting']

type CollabType = 'affiliate' | 'paid' | 'barter'
const COLLAB_OPTIONS: { key: CollabType; label: string }[] = [
  { key: 'affiliate', label: 'Affiliate / Revenue share' },
  { key: 'paid',      label: 'Paid campaigns'            },
  { key: 'barter',   label: 'Barter / Gifting'           },
]

type Platform = 'instagram' | 'tiktok' | 'youtube'
const PLATFORM_META: Record<Platform, { label: string; src: string }> = {
  instagram: { label: 'Instagram', src: '/Socials/Instagram.svg' },
  tiktok:    { label: 'TikTok',    src: '/Socials/TikTok.svg'    },
  youtube:   { label: 'YouTube',   src: '/Socials/YouTube.svg'   },
}
const PLATFORM_OPTIONS: Platform[] = ['instagram', 'tiktok', 'youtube']

const LOCATIONS = ['Latvia', 'Lithuania', 'Estonia']
const MIN_FOLLOWERS_OPTIONS = [
  { label: 'Any',   value: 0      },
  { label: '10K+',  value: 10000  },
  { label: '50K+',  value: 50000  },
  { label: '100K+', value: 100000 },
]
const MAX_ENGAGEMENT_OPTIONS = [
  { label: 'Any',   value: 0  },
  { label: '3%+',   value: 3  },
  { label: '5%+',   value: 5  },
  { label: '8%+',   value: 8  },
  { label: '10%+',  value: 10 },
]
const MIN_RATING_OPTIONS = [
  { label: 'Any',   value: 0   },
  { label: '4.0+',  value: 4.0 },
  { label: '4.5+',  value: 4.5 },
  { label: '4.8+',  value: 4.8 },
]

const SORT_OPTIONS = ['Relevance', 'Most followers', 'Highest engagement', 'Newest'] as const
type SortOption = typeof SORT_OPTIONS[number]

/* ── Filter state shape (used for both live + draft inside modal) ── */
type FilterState = {
  niches:       string[]
  platforms:    Platform[]
  collabTypes:  CollabType[]
  minFollowers: number
  minEngagement: number
  minRating:    number
  locations:    string[]
  verifiedOnly: boolean
}
const EMPTY_FILTERS: FilterState = {
  niches: [], platforms: [], collabTypes: [],
  minFollowers: 0, minEngagement: 0, minRating: 0,
  locations: [], verifiedOnly: false,
}

type CreatorResult = {
  id: string; name: string; handle: string; verified: boolean
  avatarUrl: string | null; color: string; initials: string
  niche: string; city: string; country: string; flagCode: string
  platform: Platform; followers: number; followersLabel: string
  engagementRate: number; collabTypes: CollabType[]; primaryRate: string
  rating: number; postedDaysAgo: number; description: string; tags: string[]
}

const CREATOR_RESULTS: CreatorResult[] = [
  {
    id: 'c1', name: 'Amelia Roze', handle: '@amelia.roze', verified: true,
    avatarUrl: '/test/images/Harshul.png', color: '#8B31E8', initials: 'AR',
    niche: 'Beauty', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    platform: 'instagram', followers: 142000, followersLabel: '142K', engagementRate: 6.8,
    collabTypes: ['affiliate', 'paid'], primaryRate: '15% commission', rating: 4.9, postedDaysAgo: 1,
    description: 'Beauty & lifestyle creator who turns everyday routines into content that actually converts — honest results over polished ads.',
    tags: ['beauty', 'skincare', 'lifestyle'],
  },
  {
    id: 'c2', name: 'Markus Tamm', handle: '@markustamm', verified: true,
    avatarUrl: null, color: '#2563EB', initials: 'MT',
    niche: 'Fitness', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    platform: 'tiktok', followers: 96000, followersLabel: '96K', engagementRate: 11.2,
    collabTypes: ['paid', 'affiliate'], primaryRate: 'From €400/video', rating: 4.7, postedDaysAgo: 3,
    description: 'Strength-training diaries shot mid-session, not staged. Known for turning brand briefs into believable training-block content.',
    tags: ['fitness', 'strength training', 'gym'],
  },
  {
    id: 'c3', name: 'Elīna Krūmiņa', handle: '@elina.kr', verified: false,
    avatarUrl: null, color: '#059669', initials: 'EK',
    niche: 'Wellness', city: 'Jūrmala', country: 'Latvia', flagCode: 'lv',
    platform: 'instagram', followers: 51000, followersLabel: '51K', engagementRate: 5.4,
    collabTypes: ['barter', 'affiliate'], primaryRate: '12% commission', rating: 4.5, postedDaysAgo: 9,
    description: 'Slow-living and recovery content for a steady, highly engaged community. Replies fast and never overcommits on deliverables.',
    tags: ['wellness', 'recovery', 'slow living'],
  },
  {
    id: 'c4', name: 'Jonas Petrauskas', handle: '@jonas.fit', verified: true,
    avatarUrl: null, color: '#D97706', initials: 'JP',
    niche: 'Fitness', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    platform: 'youtube', followers: 38000, followersLabel: '38K', engagementRate: 4.9,
    collabTypes: ['paid'], primaryRate: 'From €500/video', rating: 4.8, postedDaysAgo: 2,
    description: 'Long-form training breakdowns and full product deep-dives. His audience comes for the complete story, not the highlight reel.',
    tags: ['fitness', 'training', 'long-form'],
  },
  {
    id: 'c5', name: 'Liis Saar', handle: '@liis.moves', verified: false,
    avatarUrl: null, color: '#0EA5E9', initials: 'LS',
    niche: 'Wellness', city: 'Tartu', country: 'Estonia', flagCode: 'ee',
    platform: 'instagram', followers: 24000, followersLabel: '24K', engagementRate: 9.4,
    collabTypes: ['barter'], primaryRate: '€90+ gift value', rating: 4.2, postedDaysAgo: 14,
    description: 'Hot yoga and recovery rituals, filmed raw with no second takes. Small but unusually loyal audience for her size.',
    tags: ['wellness', 'yoga', 'recovery'],
  },
  {
    id: 'c6', name: 'Kristaps Bērziņš', handle: '@kristaps.tech', verified: false,
    avatarUrl: null, color: '#475569', initials: 'KB',
    niche: 'Tech', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    platform: 'youtube', followers: 18000, followersLabel: '18K', engagementRate: 4.1,
    collabTypes: ['paid'], primaryRate: 'From €350/video', rating: 4.4, postedDaysAgo: 20,
    description: 'Hands-on gadget reviews for a niche but technical audience. Will tell viewers honestly if a product underperforms.',
    tags: ['tech', 'gadgets', 'reviews'],
  },
  {
    id: 'c7', name: 'Sandra Liepa', handle: '@sandra.liepa', verified: true,
    avatarUrl: null, color: '#DB2777', initials: 'SL',
    niche: 'Fashion', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    platform: 'instagram', followers: 68000, followersLabel: '68K', engagementRate: 7.2,
    collabTypes: ['affiliate', 'paid', 'barter'], primaryRate: '18% commission', rating: 4.6, postedDaysAgo: 5,
    description: 'Capsule-wardrobe styling and outfit breakdowns. Strong at turning a single product into a full week of wearable content.',
    tags: ['fashion', 'styling', 'capsule wardrobe'],
  },
  {
    id: 'c8', name: 'Aiga Ozola', handle: '@aiga.bakes', verified: true,
    avatarUrl: null, color: '#EA580C', initials: 'AO',
    niche: 'Food & Beverage', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    platform: 'tiktok', followers: 112000, followersLabel: '112K', engagementRate: 13.5,
    collabTypes: ['affiliate', 'barter'], primaryRate: '10% commission', rating: 4.9, postedDaysAgo: 0,
    description: 'Home-baking recipes that consistently break out beyond her own following. Ingredient swaps and pantry brands perform especially well.',
    tags: ['food', 'baking', 'recipes'],
  },
  {
    id: 'c9', name: 'Henrik Saks', handle: '@henrik.roams', verified: false,
    avatarUrl: null, color: '#0D9488', initials: 'HS',
    niche: 'Travel', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    platform: 'instagram', followers: 45000, followersLabel: '45K', engagementRate: 6.0,
    collabTypes: ['paid', 'barter'], primaryRate: 'From €450/video', rating: 4.3, postedDaysAgo: 17,
    description: 'Slow-travel itineraries across the Baltics and Nordics. Audience skews toward longer trip-planning purchases.',
    tags: ['travel', 'itinerary', 'baltics'],
  },
  {
    id: 'c10', name: 'Justina Rimkutė', handle: '@justina.family', verified: false,
    avatarUrl: null, color: '#7C3AED', initials: 'JR',
    niche: 'Parenting', city: 'Kaunas', country: 'Lithuania', flagCode: 'lt',
    platform: 'instagram', followers: 33000, followersLabel: '33K', engagementRate: 5.8,
    collabTypes: ['barter', 'affiliate'], primaryRate: '14% commission', rating: 4.1, postedDaysAgo: 25,
    description: 'Honest, unsponsored-feeling parenting content. Will only feature products she has actually used with her own kids.',
    tags: ['parenting', 'family', 'kids'],
  },
  {
    id: 'c11', name: 'Gustavs Krasts', handle: '@gustavs.outdoors', verified: false,
    avatarUrl: null, color: '#16A34A', initials: 'GK',
    niche: 'Fitness', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    platform: 'youtube', followers: 29000, followersLabel: '29K', engagementRate: 4.9,
    collabTypes: ['paid'], primaryRate: 'From €300/video', rating: 4.0, postedDaysAgo: 30,
    description: 'Trail running and outdoor fitness gear tested on actual Baltic terrain, rain or shine.',
    tags: ['fitness', 'outdoor', 'trail running'],
  },
  {
    id: 'c12', name: 'Rūta Vaitkutė', handle: '@ruta.glow', verified: true,
    avatarUrl: null, color: '#C026D3', initials: 'RV',
    niche: 'Beauty', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    platform: 'tiktok', followers: 87000, followersLabel: '87K', engagementRate: 10.1,
    collabTypes: ['affiliate'], primaryRate: '16% commission', rating: 4.7, postedDaysAgo: 4,
    description: 'Fast-cut skincare hacks built for discovery, not just her existing following. Strong track record of breakout TikTok posts.',
    tags: ['beauty', 'skincare', 'tiktok hacks'],
  },
  {
    id: 'c13', name: 'Marit Kask', handle: '@marit.sauna', verified: false,
    avatarUrl: null, color: '#0891B2', initials: 'MK',
    niche: 'Wellness', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    platform: 'instagram', followers: 21000, followersLabel: '21K', engagementRate: 8.3,
    collabTypes: ['barter', 'paid'], primaryRate: '€120+ gift value', rating: 4.4, postedDaysAgo: 11,
    description: 'Sauna and cold-plunge culture documented in real sessions, not staged spa shoots. Niche, but the niche is exactly the point.',
    tags: ['wellness', 'sauna', 'cold plunge'],
  },
  {
    id: 'c14', name: 'Roberts Auziņš', handle: '@roberts.daily', verified: true,
    avatarUrl: null, color: '#CA8A04', initials: 'RA',
    niche: 'Lifestyle', city: 'Jūrmala', country: 'Latvia', flagCode: 'lv',
    platform: 'youtube', followers: 56000, followersLabel: '56K', engagementRate: 5.1,
    collabTypes: ['paid', 'affiliate'], primaryRate: 'From €380/video', rating: 4.5, postedDaysAgo: 7,
    description: 'Day-in-the-life vlogs with consistently strong watch time. Good fit for brands that want a product woven into routine, not pitched.',
    tags: ['lifestyle', 'vlog', 'daily routine'],
  },
]

/* ═══════════════════════ ICONS ═══════════════════════════════════════ */
function SearchIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
function XIcon({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
function SlidersIcon({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M22 18h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="6" r="2.2" fill="currentColor" />
      <circle cx="6" cy="12" r="2.2" fill="currentColor" />
      <circle cx="18" cy="18" r="2.2" fill="currentColor" />
    </svg>
  )
}
function BookmarkIcon({ s = 18, filled = false }: { s?: number; filled?: boolean }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path d="M6 3.5h12a1 1 0 011 1V21l-7-4-7 4V4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
function Check({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function StarIcon({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z" />
    </svg>
  )
}
function Shield({ s = 12 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ZapIcon({ s = 12 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function HandshakeIcon({ s = 12 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function NexLogo({ className = '' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`} />
}

/* ═══════════════════════ SHARED SMALL COMPONENTS ══════════════════ */
function PersonAvatar({ name, color, avatarUrl, initials, size = 36 }: {
  name: string; color: string; avatarUrl?: string | null; initials?: string; size?: number
}) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatarUrl) {
    return (
      <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm"
        style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" draggable={false} />
      </div>
    )
  }
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-sm"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {abbr}
    </div>
  )
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' })
    io.observe(el); return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`h-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${className}`}>
      {children}
    </div>
  )
}

function CollabBadge({ type }: { type: CollabType }) {
  const map: Record<CollabType, { icon: ReactNode; label: string }> = {
    affiliate: { icon: <Shield s={10} />, label: 'Affiliate' },
    paid:      { icon: <ZapIcon s={10} />, label: 'Paid' },
    barter:    { icon: <HandshakeIcon s={10} />, label: 'Barter' },
  }
  const m = map[type]
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/15 bg-primary/[0.06] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-primary">
      {m.icon}{m.label}
    </span>
  )
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const m = PLATFORM_META[platform]
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-ink/10 bg-surface-sub px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink/55">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.src} alt="" className="h-3 w-3 rounded-sm object-contain" />{m.label}
    </span>
  )
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-[14px] font-extrabold ${GRAD_TEXT}`}>{value}</span>
      <span className="mt-0.5 text-[10px] font-medium leading-none text-ink/40">{label}</span>
    </div>
  )
}

/* ═══════════════════════ SEARCH BAR ══════════════════════════════════ */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={17} /></span>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder="Search creators, niches, or handles…"
        className="w-full rounded-full border border-primary/12 bg-surface-sub py-2.5 pl-11 pr-11 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/35" />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search"
          className="absolute right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-ink/8 text-ink/50 transition hover:bg-ink/14">
          <XIcon s={12} />
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════ SORT DROPDOWN ═══════════════════════════════ */
function SortDropdown({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h1 = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const h2 = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', h1); window.addEventListener('keydown', h2)
    return () => { document.removeEventListener('mousedown', h1); window.removeEventListener('keydown', h2) }
  }, [])
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-primary/12 bg-white px-3 py-2 text-[12px] font-semibold text-ink/70 shadow-sm transition hover:-translate-y-0.5">
        <span className="text-ink/40">Sort:</span>
        <span className="text-ink">{value}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={`flex-shrink-0 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={`absolute right-0 top-[calc(100%+8px)] z-30 w-[200px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold transition hover:bg-primary/[0.06] ${value === opt ? 'bg-primary/[0.07] text-primary' : 'text-ink/75'}`}>
              {opt}{value === opt && <span className={`h-2 w-2 flex-shrink-0 rounded-full ${GRAD_BTN}`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════ MODAL INTERNALS ══════════════════════════════
   ModalToggleChip — a single selectable option inside the modal
   ═════════════════════════════════════════════════════════════════════ */
function ModalToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-semibold transition ${
        active ? 'border-primary bg-primary/[0.08] text-primary' : 'border-ink/10 bg-white text-ink/60 hover:border-primary/30 hover:text-primary'
      }`}>
      {label}
    </button>
  )
}

function ModalCheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.05]">
      <span className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md border transition ${checked ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white text-transparent'}`}>
        <Check s={11} />
      </span>
      {label}
    </button>
  )
}

/* ═══════════════════════ FILTER MODAL ════════════════════════════════ */
function FilterModal({
  open, onClose, onApply,
  draft, setDraft,
}: {
  open: boolean
  onClose: () => void
  onApply: (f: FilterState) => void
  draft: FilterState
  setDraft: (f: FilterState) => void
}) {
  // lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const activeCount =
    draft.niches.length + draft.platforms.length + draft.collabTypes.length +
    draft.locations.length + (draft.verifiedOnly ? 1 : 0) +
    (draft.minFollowers > 0 ? 1 : 0) + (draft.minEngagement > 0 ? 1 : 0) + (draft.minRating > 0 ? 1 : 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className={`relative z-10 flex w-full max-w-[560px] max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white ${CARD}`}>

        {/* ── Modal header ── */}
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-ink">Filter creators</h2>
            {activeCount > 0 && (
              <p className="mt-0.5 text-[12px] font-medium text-ink/45">{activeCount} filter{activeCount !== 1 ? 's' : ''} active</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button onClick={() => setDraft(EMPTY_FILTERS)}
                className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-primary transition hover:bg-primary/[0.07]">
                Reset all
              </button>
            )}
            <button onClick={onClose} aria-label="Close filters"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10">
              <XIcon s={14} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Niche */}
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Niche</p>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => (
                <ModalToggleChip key={n} label={n} active={draft.niches.includes(n)}
                  onClick={() => setDraft({ ...draft, niches: toggle(draft.niches, n) })} />
              ))}
            </div>
          </section>

          {/* Platform */}
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Platform</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(p => (
                <ModalToggleChip key={p} label={PLATFORM_META[p].label} active={draft.platforms.includes(p)}
                  onClick={() => setDraft({ ...draft, platforms: toggle(draft.platforms, p) })} />
              ))}
            </div>
          </section>

          {/* Collaboration type */}
          <section>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Open to</p>
            {COLLAB_OPTIONS.map(c => (
              <ModalCheckRow key={c.key} label={c.label} checked={draft.collabTypes.includes(c.key)}
                onToggle={() => setDraft({ ...draft, collabTypes: toggle(draft.collabTypes, c.key) })} />
            ))}
          </section>

          {/* Min followers */}
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Minimum followers</p>
            <div className="flex flex-wrap gap-2">
              {MIN_FOLLOWERS_OPTIONS.map(opt => (
                <ModalToggleChip key={opt.label} label={opt.label}
                  active={draft.minFollowers === opt.value}
                  onClick={() => setDraft({ ...draft, minFollowers: draft.minFollowers === opt.value ? 0 : opt.value })} />
              ))}
            </div>
          </section>

          {/* Min engagement */}
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Minimum engagement rate</p>
            <div className="flex flex-wrap gap-2">
              {MAX_ENGAGEMENT_OPTIONS.map(opt => (
                <ModalToggleChip key={opt.label} label={opt.label}
                  active={draft.minEngagement === opt.value}
                  onClick={() => setDraft({ ...draft, minEngagement: draft.minEngagement === opt.value ? 0 : opt.value })} />
              ))}
            </div>
          </section>

          {/* Min rating */}
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Minimum rating</p>
            <div className="flex flex-wrap gap-2">
              {MIN_RATING_OPTIONS.map(opt => (
                <ModalToggleChip key={opt.label} label={opt.label}
                  active={draft.minRating === opt.value}
                  onClick={() => setDraft({ ...draft, minRating: draft.minRating === opt.value ? 0 : opt.value })} />
              ))}
            </div>
          </section>

          {/* Location */}
          <section>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Location</p>
            {LOCATIONS.map(loc => (
              <ModalCheckRow key={loc} label={loc} checked={draft.locations.includes(loc)}
                onToggle={() => setDraft({ ...draft, locations: toggle(draft.locations, loc) })} />
            ))}
          </section>

          {/* Verified only */}
          <section>
            <ModalCheckRow label="Verified creators only" checked={draft.verifiedOnly}
              onToggle={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })} />
          </section>
        </div>

        {/* ── Footer: OK button ── */}
        <div className="border-t border-primary/8 px-6 py-4">
          <button
            onClick={() => { onApply(draft); onClose() }}
            className={`w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white shadow-[0_4px_18px_-4px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 active:translate-y-0`}>
            Show results{activeCount > 0 ? ` · ${activeCount} filter${activeCount !== 1 ? 's' : ''} applied` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════ APPLIED FILTER TAGS ══════════════════════════
   Rounded-rectangle chips below the search bar.
   Each has a × to dismiss it individually.
   ═════════════════════════════════════════════════════════════════════ */
type AppliedTag = { key: string; label: string; onRemove: () => void }

function AppliedFilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.07] px-2.5 py-1.5 text-[12px] font-semibold text-primary">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label} filter`}
        className="flex h-4 w-4 items-center justify-center rounded-md bg-primary/15 text-primary transition hover:bg-primary hover:text-white">
        <XIcon s={9} />
      </button>
    </span>
  )
}

/* ═══════════════════════ EMPTY STATE ══════════════════════════════════ */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/15 bg-surface-sub py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary"><SearchIcon s={26} /></div>
      <h3 className="text-lg font-extrabold text-ink">No creators match your search</h3>
      <p className="mt-2 max-w-[320px] text-[13.5px] leading-[1.6] text-ink/55">Try a different keyword, or clear your filters to see everyone available.</p>
      <button onClick={onClear} className={`mt-5 rounded-lg ${GRAD_BTN} px-6 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5`}>
        Clear all filters
      </button>
    </div>
  )
}

/* ═══════════════════════ CREATOR CARD ════════════════════════════════ */
function CreatorCard({ creator, delay, saved, onToggleSave, onView }: {
  creator: CreatorResult; delay: number; saved: boolean; onToggleSave: () => void; onView: () => void
}) {
  const activeLabel = creator.postedDaysAgo === 0 ? 'Active today' : `Active ${creator.postedDaysAgo}d ago`
  return (
    <Reveal delay={delay}>
      <div className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/8 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_-8px_rgba(139,49,232,0.24)] ${CARD}`}>
        <div className="flex flex-1 flex-col p-4">

          {/* Row 1: identity */}
          <div className="flex items-center gap-3">
            <button onClick={onView} aria-label={`View ${creator.name}'s profile`} className="flex-shrink-0">
              <div className="rounded-full ring-2 ring-primary/20 ring-offset-2 transition duration-300 group-hover:ring-primary/50">
                <PersonAvatar name={creator.name} color={creator.color} avatarUrl={creator.avatarUrl} initials={creator.initials} size={52} />
              </div>
            </button>
            <button onClick={onView} className="min-w-0 flex-1 text-left">
              <h3 className="flex items-center gap-1 truncate text-[14.5px] font-extrabold leading-snug text-ink">
                <span className="truncate">{creator.name}</span>
                {creator.verified && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/Tick.svg" alt="Verified" className="h-[13px] w-[13px] flex-shrink-0" />
                )}
              </h3>
              <p className="truncate text-[11px] font-semibold text-primary/70">{creator.handle}</p>
              <p className="mt-0.5 truncate text-[10.5px] font-medium text-ink/40">
                {creator.city}, {creator.country}<span className="mx-1 text-ink/20">·</span>{activeLabel}
              </p>
            </button>
            <button onClick={e => { e.stopPropagation(); onToggleSave() }}
              aria-label={saved ? 'Remove from saved' : 'Save creator'}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition ${saved ? `${GRAD_BTN} text-white shadow-md` : 'bg-surface-sub text-ink/35 hover:bg-primary/10 hover:text-primary'}`}>
              <BookmarkIcon s={15} filled={saved} />
            </button>
          </div>

          {/* Divider */}
          <div className="my-3.5 h-px bg-primary/8" />

          {/* Row 2: stats */}
          <div className="flex items-center justify-around rounded-xl bg-surface-sub px-2 py-2.5">
            <StatPill value={creator.followersLabel} label="Followers" />
            <div className="h-6 w-px bg-primary/10" />
            <StatPill value={`${creator.engagementRate}%`} label="Engagement" />
            <div className="h-6 w-px bg-primary/10" />
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-0.5">
                <StarIcon s={12} />
                <span className={`text-[13.5px] font-extrabold ${GRAD_TEXT}`}>{creator.rating.toFixed(1)}</span>
              </span>
              <span className="mt-0.5 text-[10px] font-medium leading-none text-ink/40">Rating</span>
            </div>
          </div>

          {/* Row 3: badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <PlatformBadge platform={creator.platform} />
            {creator.collabTypes.map(t => <CollabBadge key={t} type={t} />)}
          </div>

          {/* Row 4: rate */}
          <p className="mt-2 text-[11.5px] font-bold text-ink/55">{creator.primaryRate}</p>

          {/* Row 5: description */}
          <p className="mt-2 line-clamp-2 h-[2.55rem] overflow-hidden text-[12px] leading-[1.55] text-ink/55">
            {creator.description}
          </p>

          {/* Row 6: CTA */}
          <div className="mt-auto pt-4">
            <button onClick={onView}
              className={`w-full rounded-xl ${GRAD_BTN} py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 active:translate-y-0`}>
              View profile
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function Page() {
  const [query, setQuery]             = useState('')
  const [filters, setFilters]         = useState<FilterState>(EMPTY_FILTERS)
  const [draft, setDraft]             = useState<FilterState>(EMPTY_FILTERS)
  const [modalOpen, setModalOpen]     = useState(false)
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [saved, setSaved]             = useState<string[]>([])
  const [sort, setSort]               = useState<SortOption>('Relevance')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const openModal  = () => { setDraft(filters); setModalOpen(true) }
  const closeModal = () => setModalOpen(false)
  const applyFilters = (f: FilterState) => setFilters(f)

  const toggleSaved = (id: string) =>
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  /* ── build applied tag list for display ── */
  const appliedTags: AppliedTag[] = useMemo(() => {
    const tags: AppliedTag[] = []
    filters.niches.forEach(n => tags.push({
      key: `niche-${n}`, label: n,
      onRemove: () => setFilters(f => ({ ...f, niches: f.niches.filter(x => x !== n) })),
    }))
    filters.platforms.forEach(p => tags.push({
      key: `platform-${p}`, label: PLATFORM_META[p].label,
      onRemove: () => setFilters(f => ({ ...f, platforms: f.platforms.filter(x => x !== p) })),
    }))
    filters.collabTypes.forEach(c => {
      const label = COLLAB_OPTIONS.find(o => o.key === c)?.label ?? c
      tags.push({ key: `collab-${c}`, label, onRemove: () => setFilters(f => ({ ...f, collabTypes: f.collabTypes.filter(x => x !== c) })) })
    })
    filters.locations.forEach(loc => tags.push({
      key: `loc-${loc}`, label: loc,
      onRemove: () => setFilters(f => ({ ...f, locations: f.locations.filter(x => x !== loc) })),
    }))
    if (filters.minFollowers > 0) {
      const label = MIN_FOLLOWERS_OPTIONS.find(o => o.value === filters.minFollowers)?.label ?? `${filters.minFollowers}+`
      tags.push({ key: 'minfol', label: `${label} followers`, onRemove: () => setFilters(f => ({ ...f, minFollowers: 0 })) })
    }
    if (filters.minEngagement > 0) {
      const label = MAX_ENGAGEMENT_OPTIONS.find(o => o.value === filters.minEngagement)?.label ?? `${filters.minEngagement}%+`
      tags.push({ key: 'mineng', label: `${label} engagement`, onRemove: () => setFilters(f => ({ ...f, minEngagement: 0 })) })
    }
    if (filters.minRating > 0) {
      const label = MIN_RATING_OPTIONS.find(o => o.value === filters.minRating)?.label ?? `${filters.minRating}+`
      tags.push({ key: 'minrat', label: `${label} rating`, onRemove: () => setFilters(f => ({ ...f, minRating: 0 })) })
    }
    if (filters.verifiedOnly) tags.push({
      key: 'verified', label: 'Verified only',
      onRemove: () => setFilters(f => ({ ...f, verifiedOnly: false })),
    })
    return tags
  }, [filters])

  const activeFilterCount = appliedTags.length

  /* ── filtering + sorting ── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CREATOR_RESULTS.filter(c => {
      if (showSavedOnly && !saved.includes(c.id)) return false
      if (filters.niches.length > 0 && !filters.niches.includes(c.niche)) return false
      if (filters.platforms.length > 0 && !filters.platforms.includes(c.platform)) return false
      if (filters.collabTypes.length > 0 && !filters.collabTypes.some(t => c.collabTypes.includes(t))) return false
      if (filters.minFollowers > 0 && c.followers < filters.minFollowers) return false
      if (filters.minEngagement > 0 && c.engagementRate < filters.minEngagement) return false
      if (filters.minRating > 0 && c.rating < filters.minRating) return false
      if (filters.locations.length > 0 && !filters.locations.includes(c.country)) return false
      if (filters.verifiedOnly && !c.verified) return false
      if (q && !(c.name.toLowerCase().includes(q) || c.niche.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)))) return false
      return true
    })
  }, [query, filters, showSavedOnly, saved])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'Most followers')      arr.sort((a, b) => b.followers - a.followers)
    else if (sort === 'Highest engagement') arr.sort((a, b) => b.engagementRate - a.engagementRate)
    else if (sort === 'Newest')         arr.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
    return arr
  }, [filtered, sort])

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [query, filters, showSavedOnly, sort])

  const visible = sorted.slice(0, visibleCount)
  const resultCountLabel = query.trim()
    ? `${sorted.length} creator${sorted.length === 1 ? '' : 's'} match "${query.trim()}"`
    : `${sorted.length} creator${sorted.length === 1 ? '' : 's'} to discover`

  const NAV_LEFT  = [{ label: 'Discover', active: true }, { label: 'Campaigns', active: false }]
  const NAV_RIGHT = [{ label: 'Messages', active: false }, { label: 'Dashboard', active: false }]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════════ FILTER MODAL ════════ */}
      <FilterModal
        open={modalOpen}
        onClose={closeModal}
        onApply={applyFilters}
        draft={draft}
        setDraft={setDraft}
      />

      {/* ════════ HEADER ════════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">

        {/* Nav pill */}
        <div className="mx-auto max-w-[920px] px-4 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }} />
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label}
                  className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_RIGHT.map(n => (
                <button key={n.label}
                  className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9" />
            </div>
          </div>
        </div>

        {/* Search row */}
        <div className="mx-auto max-w-[920px] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <SearchBar value={query} onChange={setQuery} />

            {/* Filters button */}
            <button onClick={openModal}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition ${
                activeFilterCount > 0
                  ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]`
                  : 'bg-surface-sub text-ink/65 hover:bg-primary/[0.08] hover:text-primary'
              }`}>
              <SlidersIcon s={14} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Saved toggle */}
            <button onClick={() => setShowSavedOnly(s => !s)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2.5 text-[12.5px] font-semibold transition ${
                showSavedOnly
                  ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]`
                  : 'bg-surface-sub text-ink/65 hover:bg-primary/[0.08] hover:text-primary'
              }`}>
              <BookmarkIcon s={14} filled={showSavedOnly} />
              <span className="hidden sm:inline">Saved</span>
              {saved.length > 0 && (
                <span className={`flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${showSavedOnly ? 'bg-white/25' : 'bg-primary/15 text-primary'}`}>
                  {saved.length}
                </span>
              )}
            </button>
          </div>

          {/* Applied filter tags — only when filters active */}
          {appliedTags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {appliedTags.map(tag => (
                <AppliedFilterTag key={tag.key} label={tag.label} onRemove={tag.onRemove} />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ════════ RESULTS ════════ */}
      <main className="mx-auto max-w-[920px] px-4 py-5 sm:px-6">

        <div className="mb-4 flex items-center justify-between">
          <p className="text-[12.5px] font-medium text-ink/50">{resultCountLabel}</p>
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {visible.length === 0 ? (
          <EmptyState onClear={() => { setFilters(EMPTY_FILTERS); setQuery('') }} />
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((creator, i) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                delay={(i % PAGE_SIZE) * 40}
                saved={saved.includes(creator.id)}
                onToggleSave={() => toggleSaved(creator.id)}
                onView={() => { /* navigate to /creator/[slug] */ }}
              />
            ))}
          </div>
        )}

        {visibleCount < sorted.length && (
          <div className="mt-8 flex justify-center">
            <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="rounded-xl border border-primary/15 bg-white px-8 py-3 text-[13px] font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/[0.04]">
              Show more creators
            </button>
          </div>
        )}
      </main>
    </div>
  )
}