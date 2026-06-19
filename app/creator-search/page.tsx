'use client'

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Brand search results — page.tsx  (Nexfluence v4, LIGHT)
   Creator-side search: "I'm a creator looking for brands to work with."
   Layout borrows the YouTube SERP grammar — thumbnail left, title +
   byline + description-clamp + tags right, single CTA — translated
   into brand listings instead of videos.
   ════════════════════════════════════════════════════════════════════ */

const CARD = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const PAGE_SIZE = 6

const CATEGORIES = ['All', 'Beauty', 'Fitness', 'Sports Nutrition', 'Wellness', 'Fashion', 'Food & Beverage', 'Tech', 'Home & Lifestyle']

type CollabType = 'affiliate' | 'paid' | 'barter'
const COLLAB_OPTIONS: { key: CollabType; label: string }[] = [
  { key: 'affiliate', label: 'Affiliate / Revenue share' },
  { key: 'paid', label: 'Paid campaigns' },
  { key: 'barter', label: 'Barter / Gifting' },
]
const LOCATIONS = ['Latvia', 'Lithuania', 'Estonia']
const SORT_OPTIONS = ['Relevance', 'Most active creators', 'Highest commission', 'Newest'] as const
type SortOption = typeof SORT_OPTIONS[number]

type BrandResult = {
  id: string
  name: string
  verified: boolean
  logoUrl: string
  coverUrl: string
  category: string
  city: string
  country: string
  flagCode: string
  activeCreators: number
  responseTime: string
  collabTypes: CollabType[]
  primaryRate: string
  rateSortValue: number
  rating: number
  postedDaysAgo: number
  description: string
  tags: string[]
}

/* TODO: every logoUrl below points at the same placeholder headshot —
   swap in each brand's real square logo once brand onboarding is wired
   up. Cover images reuse the existing /test/images demo assets.        */
const BRAND_RESULTS: BrandResult[] = [
  {
    id: 'b1', name: 'Kinetics', verified: true, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Kinetics-Leader.png',
    category: 'Sports Nutrition', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 34, responseTime: '24h', collabTypes: ['affiliate', 'paid'], primaryRate: '15% commission', rateSortValue: 15,
    rating: 4.8, postedDaysAgo: 2,
    description: "Clean, third-party-tested sports nutrition. We brief like a marketer, not a vending machine — real lab results before you ever post.",
    tags: ['sports nutrition', 'energy', 'recovery', 'protein'],
  },
  {
    id: 'b2', name: 'Glossé', verified: true, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Drink.png',
    category: 'Beauty', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    activeCreators: 51, responseTime: '12h', collabTypes: ['affiliate', 'barter'], primaryRate: '12% commission', rateSortValue: 12,
    rating: 4.6, postedDaysAgo: 5,
    description: 'Lip care that layers well on camera. First-look rights on every new launch go to our affiliate creators before anyone else hears about it.',
    tags: ['beauty', 'lip care', 'makeup'],
  },
  {
    id: 'b3', name: 'Lumora Skincare', verified: true, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Food.png',
    category: 'Beauty', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 28, responseTime: '48h', collabTypes: ['affiliate', 'paid', 'barter'], primaryRate: 'From €350/video', rateSortValue: 350,
    rating: 4.9, postedDaysAgo: 1,
    description: 'Hydration-first moisturisers built for real morning routines, not studio lighting. Our best-performing creator content is always the messiest.',
    tags: ['skincare', 'moisturiser', 'morning routine'],
  },
  {
    id: 'b4', name: 'Nordic Skin', verified: false, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Listening.png',
    category: 'Beauty', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    activeCreators: 16, responseTime: '72h', collabTypes: ['barter'], primaryRate: '€90+ gift value', rateSortValue: 90,
    rating: 4.3, postedDaysAgo: 11,
    description: 'Minimal-ingredient skincare for sensitive Nordic winters. Small team, slower replies, but genuinely good product to put in front of your audience.',
    tags: ['skincare', 'sensitive skin', 'winter care'],
  },
  {
    id: 'b5', name: 'Forma Fit', verified: true, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Lecture.png',
    category: 'Fitness', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 42, responseTime: '24h', collabTypes: ['paid', 'affiliate'], primaryRate: '18% commission', rateSortValue: 18,
    rating: 4.7, postedDaysAgo: 3,
    description: 'Strength-training apparel tested by the people who design it. We pay on delivery, not on results — no chasing invoices after the post goes live.',
    tags: ['fitness', 'apparel', 'strength training'],
  },
  {
    id: 'b6', name: 'Tundra Tech', verified: false, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Kinetics-phone.png',
    category: 'Tech', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    activeCreators: 9, responseTime: '48h', collabTypes: ['paid'], primaryRate: 'From €500/video', rateSortValue: 500,
    rating: 4.4, postedDaysAgo: 19,
    description: 'Compact home routers built in Tallinn. Looking for a handful of tech creators who can make networking gear feel less like networking gear.',
    tags: ['tech', 'hardware', 'home office'],
  },
  {
    id: 'b7', name: 'Vāre Coffee', verified: true, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Influencing.png',
    category: 'Food & Beverage', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 23, responseTime: '12h', collabTypes: ['barter', 'affiliate'], primaryRate: '10% commission', rateSortValue: 10,
    rating: 4.9, postedDaysAgo: 0,
    description: 'Small-batch roastery shipping across the Baltics. Every gifted bag comes with a roast-date card — no aged stock, ever.',
    tags: ['coffee', 'food & beverage', 'roastery'],
  },
  {
    id: 'b8', name: 'Hygge Home', verified: false, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Header.png',
    category: 'Home & Lifestyle', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    activeCreators: 14, responseTime: '72h', collabTypes: ['barter'], primaryRate: '€150+ gift value', rateSortValue: 150,
    rating: 4.1, postedDaysAgo: 27,
    description: 'Linen homeware made slowly, on purpose. Best fit for creators whose feed already leans soft, neutral, and unhurried.',
    tags: ['home', 'linen', 'interiors'],
  },
  {
    id: 'b9', name: 'Amber Wellness', verified: true, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Food.png',
    category: 'Wellness', city: 'Jūrmala', country: 'Latvia', flagCode: 'lv',
    activeCreators: 31, responseTime: '24h', collabTypes: ['affiliate', 'paid'], primaryRate: '14% commission', rateSortValue: 14,
    rating: 4.6, postedDaysAgo: 6,
    description: 'Sauna and cold-plunge wellness studio with a creator-in-residence program — three free sessions before any commitment, no strings.',
    tags: ['wellness', 'sauna', 'cold plunge'],
  },
  {
    id: 'b10', name: 'Cedar & Salt', verified: false, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Drink.png',
    category: 'Food & Beverage', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    activeCreators: 7, responseTime: '48h', collabTypes: ['barter'], primaryRate: '€80+ gift value', rateSortValue: 80,
    rating: 4.0, postedDaysAgo: 33,
    description: 'Small-batch fermented sauces and pickles out of a single Tallinn kitchen. New to creator partnerships — first cohort gets first pick of flavours.',
    tags: ['food', 'fermentation', 'condiments'],
  },
  {
    id: 'b11', name: 'Solis Skin', verified: true, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Listening.png',
    category: 'Beauty', city: 'Kaunas', country: 'Lithuania', flagCode: 'lt',
    activeCreators: 19, responseTime: '24h', collabTypes: ['affiliate', 'barter'], primaryRate: '16% commission', rateSortValue: 16,
    rating: 4.5, postedDaysAgo: 8,
    description: 'SPF-first skincare built for a region that gets four real seasons. Affiliate creators get a custom tracked link within 24 hours of approval.',
    tags: ['skincare', 'spf', 'sun care'],
  },
  {
    id: 'b12', name: 'Trailhead Outdoors', verified: true, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Lecture.png',
    category: 'Fashion', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 25, responseTime: '24h', collabTypes: ['paid', 'barter'], primaryRate: 'From €300/video', rateSortValue: 300,
    rating: 4.7, postedDaysAgo: 4,
    description: 'Technical outerwear for Baltic trail running and hiking. We brief around terrain and weather, not just the product shot.',
    tags: ['fashion', 'outdoor', 'apparel'],
  },
  {
    id: 'b13', name: 'Velvet Verde', verified: false, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Influencing.png',
    category: 'Wellness', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    activeCreators: 11, responseTime: '72h', collabTypes: ['barter'], primaryRate: '€100+ gift value', rateSortValue: 100,
    rating: 4.2, postedDaysAgo: 15,
    description: 'Plant-based supplement line run by two former pharmacists. Slower to reply, but every formula comes with the actual lab sheet attached.',
    tags: ['wellness', 'supplements', 'plant-based'],
  },
  {
    id: 'b14', name: 'Sauna Sisters', verified: false, logoUrl: '/test/images/Harshul.png', coverUrl: '/test/images/Header.png',
    category: 'Home & Lifestyle', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    activeCreators: 6, responseTime: '48h', collabTypes: ['barter', 'paid'], primaryRate: 'From €200/video', rateSortValue: 200,
    rating: 4.3, postedDaysAgo: 21,
    description: 'Handmade sauna textiles and accessories from a two-person Tallinn studio. Looking for a small group of long-term, repeat partners.',
    tags: ['home', 'sauna', 'textiles'],
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
function UsersIcon({ s = 13 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.9" />
      <path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function NexLogo({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`} />
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

/* ─── Search bar ─────────────────────────────────────────────────────── */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={18} /></span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search brands, categories, or products…"
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
  collabFilter, onToggleCollab, locationFilter, onToggleLocation, verifiedOnly, onToggleVerified, onClear,
}: {
  collabFilter: CollabType[]; onToggleCollab: (k: CollabType) => void
  locationFilter: string[]; onToggleLocation: (loc: string) => void
  verifiedOnly: boolean; onToggleVerified: () => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeCount = collabFilter.length + locationFilter.length + (verifiedOnly ? 1 : 0)

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
        <div className={`absolute left-0 top-[calc(100%+8px)] z-30 w-[280px] overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
          <div className="px-4 pb-2 pt-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Collaboration type</div>
          {COLLAB_OPTIONS.map(c => <FilterCheckRow key={c.key} label={c.label} checked={collabFilter.includes(c.key)} onToggle={() => onToggleCollab(c.key)} />)}
          <div className="mx-4 my-1.5 h-px bg-primary/8" />
          <div className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Location</div>
          {LOCATIONS.map(loc => <FilterCheckRow key={loc} label={loc} checked={locationFilter.includes(loc)} onToggle={() => onToggleLocation(loc)} />)}
          <div className="mx-4 my-1.5 h-px bg-primary/8" />
          <FilterCheckRow label="Verified brands only" checked={verifiedOnly} onToggle={onToggleVerified} />
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

/* ─── Empty state ────────────────────────────────────────────────────── */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/15 bg-surface-sub py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary"><SearchIcon s={26} /></div>
      <h3 className="text-lg font-extrabold text-ink">No brands match your search</h3>
      <p className="mt-2 max-w-[320px] text-[13.5px] leading-[1.6] text-ink/55">Try a different keyword, or clear your filters to see everything available.</p>
      <button onClick={onClear} className={`mt-5 rounded-lg ${GRAD_BTN} px-6 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5`}>Clear all filters</button>
    </div>
  )
}

/* ─── Result card ────────────────────────────────────────────────────── */
function BrandResultCard({
  brand, delay, saved, onToggleSave, onView,
}: { brand: BrandResult; delay: number; saved: boolean; onToggleSave: () => void; onView: () => void }) {
  const activeLabel = brand.postedDaysAgo === 0 ? 'Active today' : `Active ${brand.postedDaysAgo}d ago`
  return (
    <Reveal delay={delay}>
      <div className="group flex flex-col gap-4 py-5 first:pt-0 sm:flex-row sm:items-start">
        {/* Thumbnail */}
        <button onClick={onView} className="relative block w-full flex-shrink-0 overflow-hidden rounded-xl text-left sm:w-[280px]" aria-label={`View ${brand.name}`}>
          <div
            className="aspect-[16/9] w-full bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
            style={{ backgroundImage: `url(${brand.coverUrl})` }}
          />
          <span className="absolute left-2 top-2 rounded-md bg-ink/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
            {brand.category}
          </span>
          <span className="absolute bottom-2 right-2 rounded-md bg-ink/80 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {brand.primaryRate}
          </span>
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button onClick={onView} className="flex min-w-0 items-center gap-2.5 text-left">
              <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg border border-primary/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.logoUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <h3 className="flex items-center gap-1.5 truncate text-[16.5px] font-bold text-ink">
                {brand.name}
                {brand.verified && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/Tick.svg" alt="Verified" className="h-4 w-4 flex-shrink-0" />
                )}
              </h3>
            </button>
            <button onClick={onToggleSave} aria-label={saved ? 'Remove from saved' : 'Save brand'}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition ${saved ? 'bg-primary/[0.1] text-primary' : 'text-ink/35 hover:bg-primary/[0.06] hover:text-primary'}`}>
              <BookmarkIcon s={17} filled={saved} />
            </button>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] font-medium text-ink/45">
            <span>{brand.city}, {brand.country}</span>
            <span className="text-ink/20">·</span>
            <span className="inline-flex items-center gap-1"><UsersIcon s={12} /> {brand.activeCreators} active creators</span>
            <span className="text-ink/20">·</span>
            <span>Replies in {brand.responseTime}</span>
            <span className="text-ink/20">·</span>
            <span>{activeLabel}</span>
          </div>

          <p className="mt-2 line-clamp-2 text-[13.5px] leading-[1.6] text-ink/65">{brand.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {brand.collabTypes.map(t => <CollabBadge key={t} type={t} />)}
            <span className="ml-1 flex items-center gap-1 text-[12px] font-bold text-ink/55">
              <span className="text-amber-400"><StarIcon s={12} /></span>{brand.rating.toFixed(1)}
            </span>
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
  const [collabFilter, setCollabFilter] = useState<CollabType[]>([])
  const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [saved, setSaved] = useState<string[]>([])
  const [sort, setSort] = useState<SortOption>('Relevance')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const toggleCollab = (key: CollabType) => setCollabFilter(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
  const toggleLocation = (loc: string) => setLocationFilter(prev => prev.includes(loc) ? prev.filter(x => x !== loc) : [...prev, loc])
  const toggleSaved = (id: string) => setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const clearAllFilters = () => { setActiveCategory('All'); setCollabFilter([]); setLocationFilter([]); setVerifiedOnly(false); setQuery(''); setShowSavedOnly(false) }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BRAND_RESULTS.filter(b => {
      if (showSavedOnly && !saved.includes(b.id)) return false
      if (activeCategory !== 'All' && b.category !== activeCategory) return false
      if (collabFilter.length > 0 && !collabFilter.some(c => b.collabTypes.includes(c))) return false
      if (locationFilter.length > 0 && !locationFilter.includes(b.country)) return false
      if (verifiedOnly && !b.verified) return false
      if (q && !(b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q)))) return false
      return true
    })
  }, [query, activeCategory, collabFilter, locationFilter, verifiedOnly, showSavedOnly, saved])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'Most active creators') arr.sort((a, b) => b.activeCreators - a.activeCreators)
    else if (sort === 'Highest commission') arr.sort((a, b) => b.rateSortValue - a.rateSortValue)
    else if (sort === 'Newest') arr.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
    return arr
  }, [filtered, sort])

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [query, activeCategory, collabFilter, locationFilter, verifiedOnly, showSavedOnly, sort])

  const visible = sorted.slice(0, visibleCount)
  const resultCountLabel = query.trim()
    ? `${sorted.length} brand${sorted.length === 1 ? '' : 's'} match "${query.trim()}"`
    : `${sorted.length} brand${sorted.length === 1 ? '' : 's'} to discover`

  // TODO: wire these up to next/link once routes exist — "Discover" is this page.
  const NAV_LEFT = [
    { label: 'Discover', active: true, action: () => {} },
    { label: 'My Campaigns', active: false, action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'Messages', active: false, action: () => {} },
    { label: 'Dashboard', active: false, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">
      {/* ════════ HEADER ════════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        {/* ── NAV PILL — same component as the creator & brand profile pages.
           Scaled down for a sticky utility bar (no tall cover photo to bleed
           over here), but the shape, mask, and centred mark are unchanged. ── */}
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
              collabFilter={collabFilter} onToggleCollab={toggleCollab}
              locationFilter={locationFilter} onToggleLocation={toggleLocation}
              verifiedOnly={verifiedOnly} onToggleVerified={() => setVerifiedOnly(v => !v)}
              onClear={() => { setCollabFilter([]); setLocationFilter([]); setVerifiedOnly(false) }}
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
            {visible.map((brand, i) => (
              <BrandResultCard
                key={brand.id}
                brand={brand}
                delay={(i % PAGE_SIZE) * 50}
                saved={saved.includes(brand.id)}
                onToggleSave={() => toggleSaved(brand.id)}
                onView={() => { /* navigate to /brand/[slug] */ }}
              />
            ))}
          </div>
        )}

        {visibleCount < sorted.length && (
          <div className="mt-2 flex justify-center">
            <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="rounded-xl border border-primary/15 bg-white px-6 py-3 text-[13.5px] font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/[0.04]">
              Show more brands
            </button>
          </div>
        )}
      </main>
    </div>
  )
}