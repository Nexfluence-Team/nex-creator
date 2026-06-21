'use client'

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Creator search results — page.tsx  (Nexfluence v4, LIGHT)
   Brand-side search: "I'm a brand looking for creators in my niche."
   Same SERP grammar and nav pill as the brand search results page —
   the result card, filter set, and sort options are reworked around
   what a brand actually evaluates a creator on (reach, engagement,
   platform, niche fit) instead of what a creator evaluates a brand on.
   ════════════════════════════════════════════════════════════════════ */

const CARD = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const PAGE_SIZE = 6

const CATEGORIES = ['All', 'Beauty', 'Fitness', 'Wellness', 'Lifestyle', 'Fashion', 'Food & Beverage', 'Tech', 'Travel', 'Parenting']

type CollabType = 'affiliate' | 'paid' | 'barter'
const COLLAB_OPTIONS: { key: CollabType; label: string }[] = [
  { key: 'affiliate', label: 'Affiliate / Revenue share' },
  { key: 'paid', label: 'Paid campaigns' },
  { key: 'barter', label: 'Barter / Gifting' },
]

type Platform = 'instagram' | 'tiktok' | 'youtube'
const PLATFORM_META: Record<Platform, { label: string; src: string }> = {
  instagram: { label: 'Instagram', src: '/Socials/Instagram.svg' },
  tiktok: { label: 'TikTok', src: '/Socials/TikTok.svg' },
  youtube: { label: 'YouTube', src: '/Socials/YouTube.svg' },
}
const PLATFORM_OPTIONS: Platform[] = ['instagram', 'tiktok', 'youtube']

const LOCATIONS = ['Latvia', 'Lithuania', 'Estonia']
const MIN_FOLLOWERS_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '10K+', value: 10000 },
  { label: '50K+', value: 50000 },
  { label: '100K+', value: 100000 },
]
const SORT_OPTIONS = ['Relevance', 'Most followers', 'Highest engagement', 'Newest'] as const
type SortOption = typeof SORT_OPTIONS[number]

type CreatorResult = {
  id: string
  name: string
  handle: string
  verified: boolean
  avatarUrl: string | null
  color: string
  initials: string
  coverUrl: string
  niche: string
  city: string
  country: string
  flagCode: string
  platform: Platform
  followers: number
  followersLabel: string
  engagementRate: number
  collabTypes: CollabType[]
  primaryRate: string
  rating: number
  postedDaysAgo: number
  description: string
  tags: string[]
}

/* TODO: cover images cycle through the existing /test/images demo
   assets — swap in real content thumbnails once creator onboarding
   has actual uploads to pull from.                                    */
const CREATOR_RESULTS: CreatorResult[] = [
  {
    id: 'c1', name: 'Amelia Roze', handle: '@amelia.roze', verified: true, avatarUrl: '/test/images/Harshul.png', color: '#8B31E8', initials: 'AR',
    coverUrl: '/test/images/Header.png', niche: 'Beauty', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    platform: 'instagram', followers: 142000, followersLabel: '142K', engagementRate: 6.8,
    collabTypes: ['affiliate', 'paid'], primaryRate: '15% commission', rating: 4.9, postedDaysAgo: 1,
    description: 'Beauty & lifestyle creator who turns everyday routines into content that actually converts — honest results over polished ads.',
    tags: ['beauty', 'skincare', 'lifestyle'],
  },
  {
    id: 'c2', name: 'Markus Tamm', handle: '@markustamm', verified: true, avatarUrl: null, color: '#2563EB', initials: 'MT',
    coverUrl: '/test/images/Kinetics-Leader.png', niche: 'Fitness', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    platform: 'tiktok', followers: 96000, followersLabel: '96K', engagementRate: 11.2,
    collabTypes: ['paid', 'affiliate'], primaryRate: 'From €400/video', rating: 4.7, postedDaysAgo: 3,
    description: 'Strength-training diaries shot mid-session, not staged. Known for turning brand briefs into believable training-block content.',
    tags: ['fitness', 'strength training', 'gym'],
  },
  {
    id: 'c3', name: 'Elīna Krūmiņa', handle: '@elina.kr', verified: false, avatarUrl: null, color: '#059669', initials: 'EK',
    coverUrl: '/test/images/Lecture.png', niche: 'Wellness', city: 'Jūrmala', country: 'Latvia', flagCode: 'lv',
    platform: 'instagram', followers: 51000, followersLabel: '51K', engagementRate: 5.4,
    collabTypes: ['barter', 'affiliate'], primaryRate: '12% commission', rating: 4.5, postedDaysAgo: 9,
    description: 'Slow-living and recovery content for a steady, highly engaged community. Replies fast and never overcommits on deliverables.',
    tags: ['wellness', 'recovery', 'slow living'],
  },
  {
    id: 'c4', name: 'Jonas Petrauskas', handle: '@jonas.fit', verified: true, avatarUrl: null, color: '#D97706', initials: 'JP',
    coverUrl: '/test/images/Listening.png', niche: 'Fitness', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    platform: 'youtube', followers: 38000, followersLabel: '38K', engagementRate: 4.9,
    collabTypes: ['paid'], primaryRate: 'From €500/video', rating: 4.8, postedDaysAgo: 2,
    description: 'Long-form training breakdowns and full product deep-dives. His audience comes for the complete story, not the highlight reel.',
    tags: ['fitness', 'training', 'long-form'],
  },
  {
    id: 'c5', name: 'Liis Saar', handle: '@liis.moves', verified: false, avatarUrl: null, color: '#0EA5E9', initials: 'LS',
    coverUrl: '/test/images/Drink.png', niche: 'Wellness', city: 'Tartu', country: 'Estonia', flagCode: 'ee',
    platform: 'instagram', followers: 24000, followersLabel: '24K', engagementRate: 9.4,
    collabTypes: ['barter'], primaryRate: '€90+ gift value', rating: 4.2, postedDaysAgo: 14,
    description: 'Hot yoga and recovery rituals, filmed raw with no second takes. Small but unusually loyal audience for her size.',
    tags: ['wellness', 'yoga', 'recovery'],
  },
  {
    id: 'c6', name: 'Kristaps Bērziņš', handle: '@kristaps.tech', verified: false, avatarUrl: null, color: '#475569', initials: 'KB',
    coverUrl: '/test/images/Kinetics-phone.png', niche: 'Tech', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    platform: 'youtube', followers: 18000, followersLabel: '18K', engagementRate: 4.1,
    collabTypes: ['paid'], primaryRate: 'From €350/video', rating: 4.4, postedDaysAgo: 20,
    description: 'Hands-on gadget reviews for a niche but technical audience. Will tell viewers honestly if a product underperforms.',
    tags: ['tech', 'gadgets', 'reviews'],
  },
  {
    id: 'c7', name: 'Sandra Liepa', handle: '@sandra.liepa', verified: true, avatarUrl: null, color: '#DB2777', initials: 'SL',
    coverUrl: '/test/images/Food.png', niche: 'Fashion', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    platform: 'instagram', followers: 68000, followersLabel: '68K', engagementRate: 7.2,
    collabTypes: ['affiliate', 'paid', 'barter'], primaryRate: '18% commission', rating: 4.6, postedDaysAgo: 5,
    description: 'Capsule-wardrobe styling and outfit breakdowns. Strong at turning a single product into a full week of wearable content.',
    tags: ['fashion', 'styling', 'capsule wardrobe'],
  },
  {
    id: 'c8', name: 'Aiga Ozola', handle: '@aiga.bakes', verified: true, avatarUrl: null, color: '#EA580C', initials: 'AO',
    coverUrl: '/test/images/Influencing.png', niche: 'Food & Beverage', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    platform: 'tiktok', followers: 112000, followersLabel: '112K', engagementRate: 13.5,
    collabTypes: ['affiliate', 'barter'], primaryRate: '10% commission', rating: 4.9, postedDaysAgo: 0,
    description: 'Home-baking recipes that consistently break out beyond her own following. Ingredient swaps and pantry brands perform especially well.',
    tags: ['food', 'baking', 'recipes'],
  },
  {
    id: 'c9', name: 'Henrik Saks', handle: '@henrik.roams', verified: false, avatarUrl: null, color: '#0D9488', initials: 'HS',
    coverUrl: '/test/images/Header.png', niche: 'Travel', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    platform: 'instagram', followers: 45000, followersLabel: '45K', engagementRate: 6.0,
    collabTypes: ['paid', 'barter'], primaryRate: 'From €450/video', rating: 4.3, postedDaysAgo: 17,
    description: 'Slow-travel itineraries across the Baltics and Nordics. Audience skews toward longer trip-planning purchases.',
    tags: ['travel', 'itinerary', 'baltics'],
  },
  {
    id: 'c10', name: 'Justina Rimkutė', handle: '@justina.family', verified: false, avatarUrl: null, color: '#7C3AED', initials: 'JR',
    coverUrl: '/test/images/Lecture.png', niche: 'Parenting', city: 'Kaunas', country: 'Lithuania', flagCode: 'lt',
    platform: 'instagram', followers: 33000, followersLabel: '33K', engagementRate: 5.8,
    collabTypes: ['barter', 'affiliate'], primaryRate: '14% commission', rating: 4.1, postedDaysAgo: 25,
    description: 'Honest, unsponsored-feeling parenting content. Will only feature products she has actually used with her own kids.',
    tags: ['parenting', 'family', 'kids'],
  },
  {
    id: 'c11', name: 'Gustavs Krasts', handle: '@gustavs.outdoors', verified: false, avatarUrl: null, color: '#16A34A', initials: 'GK',
    coverUrl: '/test/images/Listening.png', niche: 'Fitness', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    platform: 'youtube', followers: 29000, followersLabel: '29K', engagementRate: 4.9,
    collabTypes: ['paid'], primaryRate: 'From €300/video', rating: 4.0, postedDaysAgo: 30,
    description: 'Trail running and outdoor fitness gear tested on actual Baltic terrain, rain or shine.',
    tags: ['fitness', 'outdoor', 'trail running'],
  },
  {
    id: 'c12', name: 'Rūta Vaitkutė', handle: '@ruta.glow', verified: true, avatarUrl: null, color: '#C026D3', initials: 'RV',
    coverUrl: '/test/images/Drink.png', niche: 'Beauty', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    platform: 'tiktok', followers: 87000, followersLabel: '87K', engagementRate: 10.1,
    collabTypes: ['affiliate'], primaryRate: '16% commission', rating: 4.7, postedDaysAgo: 4,
    description: 'Fast-cut skincare hacks built for discovery, not just her existing following. Strong track record of breakout TikTok posts.',
    tags: ['beauty', 'skincare', 'tiktok hacks'],
  },
  {
    id: 'c13', name: 'Marit Kask', handle: '@marit.sauna', verified: false, avatarUrl: null, color: '#0891B2', initials: 'MK',
    coverUrl: '/test/images/Kinetics-Leader.png', niche: 'Wellness', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    platform: 'instagram', followers: 21000, followersLabel: '21K', engagementRate: 8.3,
    collabTypes: ['barter', 'paid'], primaryRate: '€120+ gift value', rating: 4.4, postedDaysAgo: 11,
    description: 'Sauna and cold-plunge culture documented in real sessions, not staged spa shoots. Niche, but the niche is exactly the point.',
    tags: ['wellness', 'sauna', 'cold plunge'],
  },
  {
    id: 'c14', name: 'Roberts Auziņš', handle: '@roberts.daily', verified: true, avatarUrl: null, color: '#CA8A04', initials: 'RA',
    coverUrl: '/test/images/Food.png', niche: 'Lifestyle', city: 'Jūrmala', country: 'Latvia', flagCode: 'lv',
    platform: 'youtube', followers: 56000, followersLabel: '56K', engagementRate: 5.1,
    collabTypes: ['paid', 'affiliate'], primaryRate: 'From €380/video', rating: 4.5, postedDaysAgo: 7,
    description: 'Day-in-the-life vlogs with consistently strong watch time. Good fit for brands that want a product woven into routine, not pitched.',
    tags: ['lifestyle', 'vlog', 'daily routine'],
  },
]

/* ─── Icons ──────────────────────────────────────────────────────────── */
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
function Shield({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ZapIcon({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function HandshakeIcon({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3l1 11h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NexLogo({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`} />
  )
}

/* ─── Person avatar (circle) ─────────────────────────────────────────── */
function PersonAvatar({ name, color, avatarUrl, initials, size = 36 }: { name: string; color: string; avatarUrl?: string | null; initials?: string; size?: number }) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatarUrl) {
    return (
      <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" draggable={false} />
      </div>
    )
  }
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-sm" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {abbr}
    </div>
  )
}

/* ─── Reveal (lightweight entrance fade for list rows) ───────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' })
    io.observe(el); return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}>
      {children}
    </div>
  )
}

/* ─── Collaboration-type badge ───────────────────────────────────────── */
function CollabBadge({ type }: { type: CollabType }) {
  const map: Record<CollabType, { icon: ReactNode; label: string }> = {
    affiliate: { icon: <Shield s={11} />, label: 'Affiliate' },
    paid: { icon: <ZapIcon s={11} />, label: 'Paid' },
    barter: { icon: <HandshakeIcon s={11} />, label: 'Barter' },
  }
  const m = map[type]
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/15 bg-primary/[0.06] px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-primary">
      {m.icon}{m.label}
    </span>
  )
}

/* ─── Platform badge ─────────────────────────────────────────────────── */
function PlatformBadge({ platform }: { platform: Platform }) {
  const m = PLATFORM_META[platform]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-ink/10 bg-surface-sub px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-ink/55">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.src} alt="" className="h-3 w-3 rounded-sm object-contain" />{m.label}
    </span>
  )
}

/* ─── Search bar ─────────────────────────────────────────────────────── */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={18} /></span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search creators, niches, or handles…"
        className="w-full rounded-full border border-primary/12 bg-surface-sub py-3 pl-11 pr-11 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/35"
      />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search"
          className="absolute right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-ink/8 text-ink/50 transition hover:bg-ink/14">
          <XIcon s={12} />
        </button>
      )}
    </div>
  )
}

/* ─── Category chip ─────────────────────────────────────────────────── */
function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex-shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${active ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]` : 'bg-surface-sub text-ink/65 hover:bg-primary/[0.08] hover:text-primary'}`}>
      {label}
    </button>
  )
}

/* ─── Filter checkbox row ────────────────────────────────────────────── */
function FilterCheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold text-ink/75 transition hover:bg-primary/[0.06]">
      <span className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md border transition ${checked ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white text-transparent'}`}>
        <Check s={11} />
      </span>
      {label}
    </button>
  )
}

/* ─── Filters popover ────────────────────────────────────────────────── */
function FiltersPopover({
  platformFilter, onTogglePlatform,
  collabFilter, onToggleCollab,
  minFollowers, onSetMinFollowers,
  locationFilter, onToggleLocation,
  verifiedOnly, onToggleVerified,
  onClear,
}: {
  platformFilter: Platform[]; onTogglePlatform: (p: Platform) => void
  collabFilter: CollabType[]; onToggleCollab: (k: CollabType) => void
  minFollowers: number; onSetMinFollowers: (v: number) => void
  locationFilter: string[]; onToggleLocation: (loc: string) => void
  verifiedOnly: boolean; onToggleVerified: () => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeCount = platformFilter.length + collabFilter.length + locationFilter.length + (verifiedOnly ? 1 : 0) + (minFollowers > 0 ? 1 : 0)

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onClick); window.removeEventListener('keydown', onEsc) }
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(o => !o)}
        className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition ${activeCount > 0 ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]` : 'bg-surface-sub text-ink/65 hover:bg-primary/[0.08] hover:text-primary'}`}>
        <SlidersIcon s={14} /> Filters
        {activeCount > 0 && <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold">{activeCount}</span>}
      </button>

      {open && (
        <div className={`absolute left-0 top-[calc(100%+8px)] z-30 w-[300px] overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
          <div className="px-4 pb-2 pt-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Minimum followers</div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
            {MIN_FOLLOWERS_OPTIONS.map(opt => (
              <button key={opt.label} onClick={() => onSetMinFollowers(minFollowers === opt.value ? 0 : opt.value)}
                className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-bold transition ${minFollowers === opt.value ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mx-4 mb-1.5 h-px bg-primary/8" />
          <div className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Platform</div>
          {PLATFORM_OPTIONS.map(p => <FilterCheckRow key={p} label={PLATFORM_META[p].label} checked={platformFilter.includes(p)} onToggle={() => onTogglePlatform(p)} />)}
          <div className="mx-4 my-1.5 h-px bg-primary/8" />
          <div className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Open to</div>
          {COLLAB_OPTIONS.map(c => <FilterCheckRow key={c.key} label={c.label} checked={collabFilter.includes(c.key)} onToggle={() => onToggleCollab(c.key)} />)}
          <div className="mx-4 my-1.5 h-px bg-primary/8" />
          <div className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Location</div>
          {LOCATIONS.map(loc => <FilterCheckRow key={loc} label={loc} checked={locationFilter.includes(loc)} onToggle={() => onToggleLocation(loc)} />)}
          <div className="mx-4 my-1.5 h-px bg-primary/8" />
          <FilterCheckRow label="Verified creators only" checked={verifiedOnly} onToggle={onToggleVerified} />
          <div className="border-t border-primary/8 px-4 py-3">
            <button onClick={onClear} className="text-[12.5px] font-bold text-primary hover:underline">Clear all filters</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Sort dropdown ──────────────────────────────────────────────────── */
function SortDropdown({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onClick); window.removeEventListener('keydown', onEsc) }
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-primary/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-ink/70 shadow-sm transition hover:-translate-y-0.5">
        Sort: <span className="text-ink">{value}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className={`flex-shrink-0 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={`absolute right-0 top-[calc(100%+8px)] z-30 w-[210px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
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

/* ─── Empty state ────────────────────────────────────────────────────── */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/15 bg-surface-sub py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary"><SearchIcon s={26} /></div>
      <h3 className="text-lg font-extrabold text-ink">No creators match your search</h3>
      <p className="mt-2 max-w-[320px] text-[13.5px] leading-[1.6] text-ink/55">Try a different keyword, or clear your filters to see everyone available.</p>
      <button onClick={onClear} className={`mt-5 rounded-lg ${GRAD_BTN} px-6 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5`}>Clear all filters</button>
    </div>
  )
}

/* ─── Result card ────────────────────────────────────────────────────── */
function CreatorResultCard({
  creator, delay, saved, onToggleSave, onView,
}: { creator: CreatorResult; delay: number; saved: boolean; onToggleSave: () => void; onView: () => void }) {
  const activeLabel = creator.postedDaysAgo === 0 ? 'Active today' : `Active ${creator.postedDaysAgo}d ago`
  const platformIcon = PLATFORM_META[creator.platform].src

  return (
    <Reveal delay={delay}>
      <div className="group flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-start">
        {/* Thumbnail */}
        <button onClick={onView} className="relative block w-full flex-shrink-0 overflow-hidden rounded-xl text-left sm:w-[280px]" aria-label={`View ${creator.name}`}>
          <div
            className="aspect-[16/9] w-full bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
            style={{ backgroundImage: `url(${creator.coverUrl})` }}
          />
          <span className="absolute left-2 top-2 rounded-md bg-ink/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
            {creator.niche}
          </span>
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-ink/80 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={platformIcon} alt="" className="h-3 w-3 rounded-sm" /> {creator.followersLabel}
          </span>
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button onClick={onView} className="flex min-w-0 items-center gap-2.5 text-left">
              <PersonAvatar name={creator.name} color={creator.color} avatarUrl={creator.avatarUrl} initials={creator.initials} size={36} />
              <div className="min-w-0">
                <h3 className="flex items-center gap-1.5 truncate text-[16.5px] font-bold text-ink">
                  {creator.name}
                  {creator.verified && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/Tick.svg" alt="Verified" className="h-4 w-4 flex-shrink-0" />
                  )}
                </h3>
                <p className="truncate text-[12px] font-medium text-ink/40">{creator.handle}</p>
              </div>
            </button>
            <button onClick={onToggleSave} aria-label={saved ? 'Remove from saved' : 'Save creator'}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition ${saved ? 'bg-primary/[0.1] text-primary' : 'text-ink/35 hover:bg-primary/[0.06] hover:text-primary'}`}>
              <BookmarkIcon s={17} filled={saved} />
            </button>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] font-medium text-ink/45">
            <span>{creator.city}, {creator.country}</span>
            <span className="text-ink/20">·</span>
            <span>{creator.followersLabel} followers</span>
            <span className="text-ink/20">·</span>
            <span>{creator.engagementRate}% engagement</span>
            <span className="text-ink/20">·</span>
            <span>{activeLabel}</span>
          </div>

          <p className="mt-2 line-clamp-2 text-[13.5px] leading-[1.6] text-ink/65">{creator.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <PlatformBadge platform={creator.platform} />
            {creator.collabTypes.map(t => <CollabBadge key={t} type={t} />)}
            <span className="flex items-center gap-1 text-[12px] font-bold text-ink/55">
              <span className="text-amber-400"><StarIcon s={12} /></span>{creator.rating.toFixed(1)}
            </span>
            <span className="text-[12px] font-semibold text-ink/45">{creator.primaryRate}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-shrink-0 sm:pt-1">
          <button onClick={onView}
            className={`w-full rounded-lg ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 sm:w-auto`}>
            View profile
          </button>
        </div>
      </div>
    </Reveal>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function Page() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [platformFilter, setPlatformFilter] = useState<Platform[]>([])
  const [collabFilter, setCollabFilter] = useState<CollabType[]>([])
  const [minFollowers, setMinFollowers] = useState(0)
  const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [saved, setSaved] = useState<string[]>([])
  const [sort, setSort] = useState<SortOption>('Relevance')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const togglePlatform = (p: Platform) => setPlatformFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  const toggleCollab = (key: CollabType) => setCollabFilter(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
  const toggleLocation = (loc: string) => setLocationFilter(prev => prev.includes(loc) ? prev.filter(x => x !== loc) : [...prev, loc])
  const toggleSaved = (id: string) => setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const clearAllFilters = () => { setActiveCategory('All'); setPlatformFilter([]); setCollabFilter([]); setMinFollowers(0); setLocationFilter([]); setVerifiedOnly(false); setQuery(''); setShowSavedOnly(false) }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CREATOR_RESULTS.filter(c => {
      if (showSavedOnly && !saved.includes(c.id)) return false
      if (activeCategory !== 'All' && c.niche !== activeCategory) return false
      if (platformFilter.length > 0 && !platformFilter.includes(c.platform)) return false
      if (collabFilter.length > 0 && !collabFilter.some(t => c.collabTypes.includes(t))) return false
      if (minFollowers > 0 && c.followers < minFollowers) return false
      if (locationFilter.length > 0 && !locationFilter.includes(c.country)) return false
      if (verifiedOnly && !c.verified) return false
      if (q && !(c.name.toLowerCase().includes(q) || c.niche.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)))) return false
      return true
    })
  }, [query, activeCategory, platformFilter, collabFilter, minFollowers, locationFilter, verifiedOnly, showSavedOnly, saved])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'Most followers') arr.sort((a, b) => b.followers - a.followers)
    else if (sort === 'Highest engagement') arr.sort((a, b) => b.engagementRate - a.engagementRate)
    else if (sort === 'Newest') arr.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
    return arr
  }, [filtered, sort])

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [query, activeCategory, platformFilter, collabFilter, minFollowers, locationFilter, verifiedOnly, showSavedOnly, sort])

  const visible = sorted.slice(0, visibleCount)
  const resultCountLabel = query.trim()
    ? `${sorted.length} creator${sorted.length === 1 ? '' : 's'} match "${query.trim()}"`
    : `${sorted.length} creator${sorted.length === 1 ? '' : 's'} to discover`

  // TODO: wire these up to next/link once routes exist — "Discover" is this page.
  const NAV_LEFT = [
    { label: 'Discover', active: true, action: () => {} },
    { label: 'Campaigns', active: false, action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'Messages', active: false, action: () => {} },
    { label: 'Dashboard', active: false, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">
      {/* ════════ HEADER ════════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        {/* ── NAV PILL — same component as the creator & brand profile pages
           and the brand search results page. Scaled for a sticky utility
           bar; shape, mask, and centred mark stay consistent everywhere. ── */}
        <div className="mx-auto max-w-[920px] px-4 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{
                background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)',
              }}
            />
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_RIGHT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="h-8 pointer-events-auto drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9" />
            </div>
          </div>
        </div>

        {/* ── Search + filters ── */}
        <div className="mx-auto max-w-[920px] px-6 py-4">
          <div className="flex items-center gap-3">
            <SearchBar value={query} onChange={setQuery} />
            <button onClick={() => setShowSavedOnly(s => !s)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition ${showSavedOnly ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]` : 'bg-surface-sub text-ink/65 hover:bg-primary/[0.08] hover:text-primary'}`}>
              <BookmarkIcon s={15} filled={showSavedOnly} />
              <span className="hidden sm:inline">Saved</span>
              {saved.length > 0 && <span className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${showSavedOnly ? 'bg-white/25' : 'bg-primary/15 text-primary'}`}>{saved.length}</span>}
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {CATEGORIES.map(cat => <CategoryChip key={cat} label={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />)}
            <FiltersPopover
              platformFilter={platformFilter} onTogglePlatform={togglePlatform}
              collabFilter={collabFilter} onToggleCollab={toggleCollab}
              minFollowers={minFollowers} onSetMinFollowers={setMinFollowers}
              locationFilter={locationFilter} onToggleLocation={toggleLocation}
              verifiedOnly={verifiedOnly} onToggleVerified={() => setVerifiedOnly(v => !v)}
              onClear={() => { setPlatformFilter([]); setCollabFilter([]); setMinFollowers(0); setLocationFilter([]); setVerifiedOnly(false) }}
            />
          </div>
        </div>
      </header>

      {/* ════════ RESULTS ════════ */}
      <main className="mx-auto max-w-[920px] px-6 py-6">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[13px] font-medium text-ink/50">{resultCountLabel}</p>
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {visible.length === 0 ? (
          <div className="mt-4"><EmptyState onClear={clearAllFilters} /></div>
        ) : (
          <div className="divide-y divide-primary/8">
            {visible.map((creator, i) => (
              <CreatorResultCard
                key={creator.id}
                creator={creator}
                delay={(i % PAGE_SIZE) * 50}
                saved={saved.includes(creator.id)}
                onToggleSave={() => toggleSaved(creator.id)}
                onView={() => { /* navigate to /creator/[slug] */ }}
              />
            ))}
          </div>
        )}

        {visibleCount < sorted.length && (
          <div className="mt-2 flex justify-center">
            <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="rounded-xl border border-primary/15 bg-white px-6 py-3 text-[13.5px] font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/[0.04]">
              Show more creators
            </button>
          </div>
        )}
      </main>
    </div>
  )
}