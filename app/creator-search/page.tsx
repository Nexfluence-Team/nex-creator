'use client'

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Brand search results — page.tsx  (Nexfluence v4, LIGHT)
   Vertical card grid · filter modal (blurred backdrop) · dismissible
   applied-filter tags (rounded rectangles + ×) below search bar.
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const PAGE_SIZE = 9

const CATEGORIES = ['Beauty', 'Fitness', 'Sports Nutrition', 'Wellness', 'Fashion', 'Food & Beverage', 'Tech', 'Home & Lifestyle']

type CollabType = 'affiliate' | 'paid' | 'barter'
const COLLAB_OPTIONS: { key: CollabType; label: string }[] = [
  { key: 'affiliate', label: 'Affiliate / Revenue share' },
  { key: 'paid',      label: 'Paid campaigns'            },
  { key: 'barter',   label: 'Barter / Gifting'           },
]

const LOCATIONS = ['Latvia', 'Lithuania', 'Estonia']

const MIN_ACTIVE_CREATORS = [
  { label: 'Any',  value: 0  },
  { label: '10+',  value: 10 },
  { label: '20+',  value: 20 },
  { label: '40+',  value: 40 },
]
const RESPONSE_TIME_OPTIONS = [
  { label: 'Any',  value: ''    },
  { label: '12h',  value: '12h' },
  { label: '24h',  value: '24h' },
  { label: '48h',  value: '48h' },
]
const MIN_RATING_OPTIONS = [
  { label: 'Any',   value: 0   },
  { label: '4.0+',  value: 4.0 },
  { label: '4.5+',  value: 4.5 },
  { label: '4.8+',  value: 4.8 },
]

const SORT_OPTIONS = ['Relevance', 'Most active creators', 'Highest commission', 'Newest'] as const
type SortOption = typeof SORT_OPTIONS[number]

/* ── Filter state shape (live + draft inside modal) ── */
type FilterState = {
  categories:        string[]
  collabTypes:       CollabType[]
  locations:         string[]
  minActiveCreators: number
  maxResponseTime:   string
  minRating:         number
  verifiedOnly:      boolean
}
const EMPTY_FILTERS: FilterState = {
  categories: [], collabTypes: [], locations: [],
  minActiveCreators: 0, maxResponseTime: '', minRating: 0, verifiedOnly: false,
}

type BrandResult = {
  id: string; name: string; verified: boolean
  logoUrl: string; category: string
  city: string; country: string; flagCode: string
  activeCreators: number; responseTime: string
  collabTypes: CollabType[]; primaryRate: string; rateSortValue: number
  rating: number; postedDaysAgo: number; description: string; tags: string[]
}

const BRAND_RESULTS: BrandResult[] = [
  {
    id: 'b1', name: 'Kinetics', verified: true, logoUrl: '/test/images/Harshul.png',
    category: 'Sports Nutrition', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 34, responseTime: '24h', collabTypes: ['affiliate', 'paid'],
    primaryRate: '15% commission', rateSortValue: 15, rating: 4.8, postedDaysAgo: 2,
    description: "Clean, third-party-tested sports nutrition. We brief like a marketer, not a vending machine — real lab results before you ever post.",
    tags: ['sports nutrition', 'energy', 'recovery', 'protein'],
  },
  {
    id: 'b2', name: 'Glossé', verified: true, logoUrl: '/test/images/Harshul.png',
    category: 'Beauty', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    activeCreators: 51, responseTime: '12h', collabTypes: ['affiliate', 'barter'],
    primaryRate: '12% commission', rateSortValue: 12, rating: 4.6, postedDaysAgo: 5,
    description: 'Lip care that layers well on camera. First-look rights on every new launch go to our affiliate creators before anyone else hears about it.',
    tags: ['beauty', 'lip care', 'makeup'],
  },
  {
    id: 'b3', name: 'Lumora Skincare', verified: true, logoUrl: '/test/images/Harshul.png',
    category: 'Beauty', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 28, responseTime: '48h', collabTypes: ['affiliate', 'paid', 'barter'],
    primaryRate: 'From €350/video', rateSortValue: 350, rating: 4.9, postedDaysAgo: 1,
    description: 'Hydration-first moisturisers built for real morning routines, not studio lighting. Our best-performing creator content is always the messiest.',
    tags: ['skincare', 'moisturiser', 'morning routine'],
  },
  {
    id: 'b4', name: 'Nordic Skin', verified: false, logoUrl: '/test/images/Harshul.png',
    category: 'Beauty', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    activeCreators: 16, responseTime: '72h', collabTypes: ['barter'],
    primaryRate: '€90+ gift value', rateSortValue: 90, rating: 4.3, postedDaysAgo: 11,
    description: 'Minimal-ingredient skincare for sensitive Nordic winters. Small team, slower replies, but genuinely good product to put in front of your audience.',
    tags: ['skincare', 'sensitive skin', 'winter care'],
  },
  {
    id: 'b5', name: 'Forma Fit', verified: true, logoUrl: '/test/images/Harshul.png',
    category: 'Fitness', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 42, responseTime: '24h', collabTypes: ['paid', 'affiliate'],
    primaryRate: '18% commission', rateSortValue: 18, rating: 4.7, postedDaysAgo: 3,
    description: 'Strength-training apparel tested by the people who design it. We pay on delivery, not on results — no chasing invoices after the post goes live.',
    tags: ['fitness', 'apparel', 'strength training'],
  },
  {
    id: 'b6', name: 'Tundra Tech', verified: false, logoUrl: '/test/images/Harshul.png',
    category: 'Tech', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    activeCreators: 9, responseTime: '48h', collabTypes: ['paid'],
    primaryRate: 'From €500/video', rateSortValue: 500, rating: 4.4, postedDaysAgo: 19,
    description: 'Compact home routers built in Tallinn. Looking for a handful of tech creators who can make networking gear feel less like networking gear.',
    tags: ['tech', 'hardware', 'home office'],
  },
  {
    id: 'b7', name: 'Vāre Coffee', verified: true, logoUrl: '/test/images/Harshul.png',
    category: 'Food & Beverage', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 23, responseTime: '12h', collabTypes: ['barter', 'affiliate'],
    primaryRate: '10% commission', rateSortValue: 10, rating: 4.9, postedDaysAgo: 0,
    description: 'Small-batch roastery shipping across the Baltics. Every gifted bag comes with a roast-date card — no aged stock, ever.',
    tags: ['coffee', 'food & beverage', 'roastery'],
  },
  {
    id: 'b8', name: 'Hygge Home', verified: false, logoUrl: '/test/images/Harshul.png',
    category: 'Home & Lifestyle', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    activeCreators: 14, responseTime: '72h', collabTypes: ['barter'],
    primaryRate: '€150+ gift value', rateSortValue: 150, rating: 4.1, postedDaysAgo: 27,
    description: 'Linen homeware made slowly, on purpose. Best fit for creators whose feed already leans soft, neutral, and unhurried.',
    tags: ['home', 'linen', 'interiors'],
  },
  {
    id: 'b9', name: 'Amber Wellness', verified: true, logoUrl: '/test/images/Harshul.png',
    category: 'Wellness', city: 'Jūrmala', country: 'Latvia', flagCode: 'lv',
    activeCreators: 31, responseTime: '24h', collabTypes: ['affiliate', 'paid'],
    primaryRate: '14% commission', rateSortValue: 14, rating: 4.6, postedDaysAgo: 6,
    description: 'Sauna and cold-plunge wellness studio with a creator-in-residence program — three free sessions before any commitment, no strings.',
    tags: ['wellness', 'sauna', 'cold plunge'],
  },
  {
    id: 'b10', name: 'Cedar & Salt', verified: false, logoUrl: '/test/images/Harshul.png',
    category: 'Food & Beverage', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    activeCreators: 7, responseTime: '48h', collabTypes: ['barter'],
    primaryRate: '€80+ gift value', rateSortValue: 80, rating: 4.0, postedDaysAgo: 33,
    description: 'Small-batch fermented sauces and pickles out of a single Tallinn kitchen. New to creator partnerships — first cohort gets first pick of flavours.',
    tags: ['food', 'fermentation', 'condiments'],
  },
  {
    id: 'b11', name: 'Solis Skin', verified: true, logoUrl: '/test/images/Harshul.png',
    category: 'Beauty', city: 'Kaunas', country: 'Lithuania', flagCode: 'lt',
    activeCreators: 19, responseTime: '24h', collabTypes: ['affiliate', 'barter'],
    primaryRate: '16% commission', rateSortValue: 16, rating: 4.5, postedDaysAgo: 8,
    description: 'SPF-first skincare built for a region that gets four real seasons. Affiliate creators get a custom tracked link within 24 hours of approval.',
    tags: ['skincare', 'spf', 'sun care'],
  },
  {
    id: 'b12', name: 'Trailhead Outdoors', verified: true, logoUrl: '/test/images/Harshul.png',
    category: 'Fashion', city: 'Riga', country: 'Latvia', flagCode: 'lv',
    activeCreators: 25, responseTime: '24h', collabTypes: ['paid', 'barter'],
    primaryRate: 'From €300/video', rateSortValue: 300, rating: 4.7, postedDaysAgo: 4,
    description: 'Technical outerwear for Baltic trail running and hiking. We brief around terrain and weather, not just the product shot.',
    tags: ['fashion', 'outdoor', 'apparel'],
  },
  {
    id: 'b13', name: 'Velvet Verde', verified: false, logoUrl: '/test/images/Harshul.png',
    category: 'Wellness', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt',
    activeCreators: 11, responseTime: '72h', collabTypes: ['barter'],
    primaryRate: '€100+ gift value', rateSortValue: 100, rating: 4.2, postedDaysAgo: 15,
    description: 'Plant-based supplement line run by two former pharmacists. Slower to reply, but every formula comes with the actual lab sheet attached.',
    tags: ['wellness', 'supplements', 'plant-based'],
  },
  {
    id: 'b14', name: 'Sauna Sisters', verified: false, logoUrl: '/test/images/Harshul.png',
    category: 'Home & Lifestyle', city: 'Tallinn', country: 'Estonia', flagCode: 'ee',
    activeCreators: 6, responseTime: '48h', collabTypes: ['barter', 'paid'],
    primaryRate: 'From €200/video', rateSortValue: 200, rating: 4.3, postedDaysAgo: 21,
    description: 'Handmade sauna textiles and accessories from a two-person Tallinn studio. Looking for a small group of long-term, repeat partners.',
    tags: ['home', 'sauna', 'textiles'],
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
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
function Shield({ s = 11 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ZapIcon({ s = 11 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function HandshakeIcon({ s = 11 }: { s?: number }) {
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
function UsersIcon({ s = 12 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.9" />
      <path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}
function ClockIcon({ s = 12 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function NexLogo({ className = '' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`} />
}

/* ═══════════════════════ SHARED SMALL COMPONENTS ══════════════════════ */
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
        placeholder="Search brands, categories, or products…"
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

/* ═══════════════════════ SORT DROPDOWN ══════════════════════════════ */
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

/* ═══════════════════════ MODAL INTERNALS ═════════════════════════════ */
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

/* ═══════════════════════ FILTER MODAL ═══════════════════════════════ */
function FilterModal({
  open, onClose, onApply, draft, setDraft,
}: {
  open: boolean; onClose: () => void; onApply: (f: FilterState) => void
  draft: FilterState; setDraft: (f: FilterState) => void
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const toggle = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const activeCount =
    draft.categories.length + draft.collabTypes.length + draft.locations.length +
    (draft.verifiedOnly ? 1 : 0) + (draft.minActiveCreators > 0 ? 1 : 0) +
    (draft.maxResponseTime !== '' ? 1 : 0) + (draft.minRating > 0 ? 1 : 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Modal panel */}
      <div className={`relative z-10 flex w-full max-w-[560px] max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white ${CARD}`}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-ink">Filter brands</h2>
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Category */}
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <ModalToggleChip key={c} label={c} active={draft.categories.includes(c)}
                  onClick={() => setDraft({ ...draft, categories: toggle(draft.categories, c) })} />
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

          {/* Location */}
          <section>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Location</p>
            {LOCATIONS.map(loc => (
              <ModalCheckRow key={loc} label={loc} checked={draft.locations.includes(loc)}
                onToggle={() => setDraft({ ...draft, locations: toggle(draft.locations, loc) })} />
            ))}
          </section>

          {/* Min active creators */}
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Active creators</p>
            <div className="flex flex-wrap gap-2">
              {MIN_ACTIVE_CREATORS.map(opt => (
                <ModalToggleChip key={opt.label} label={opt.label}
                  active={draft.minActiveCreators === opt.value}
                  onClick={() => setDraft({ ...draft, minActiveCreators: draft.minActiveCreators === opt.value ? 0 : opt.value })} />
              ))}
            </div>
          </section>

          {/* Response time */}
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Responds within</p>
            <div className="flex flex-wrap gap-2">
              {RESPONSE_TIME_OPTIONS.map(opt => (
                <ModalToggleChip key={opt.label} label={opt.label}
                  active={draft.maxResponseTime === opt.value}
                  onClick={() => setDraft({ ...draft, maxResponseTime: draft.maxResponseTime === opt.value ? '' : opt.value })} />
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

          {/* Verified only */}
          <section>
            <ModalCheckRow label="Verified brands only" checked={draft.verifiedOnly}
              onToggle={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })} />
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-primary/8 px-6 py-4">
          <button onClick={() => { onApply(draft); onClose() }}
            className={`w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white shadow-[0_4px_18px_-4px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 active:translate-y-0`}>
            Show results{activeCount > 0 ? ` · ${activeCount} filter${activeCount !== 1 ? 's' : ''} applied` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════ APPLIED FILTER TAGS ════════════════════════ */
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

/* ═══════════════════════ EMPTY STATE ════════════════════════════════ */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/15 bg-surface-sub py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary"><SearchIcon s={26} /></div>
      <h3 className="text-lg font-extrabold text-ink">No brands match your search</h3>
      <p className="mt-2 max-w-[320px] text-[13.5px] leading-[1.6] text-ink/55">Try a different keyword, or clear your filters to see everything available.</p>
      <button onClick={onClear} className={`mt-5 rounded-lg ${GRAD_BTN} px-6 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5`}>
        Clear all filters
      </button>
    </div>
  )
}

/* ═══════════════════════ BRAND CARD ════════════════════════════════ */
function BrandCard({ brand, delay, saved, onToggleSave, onView }: {
  brand: BrandResult; delay: number; saved: boolean; onToggleSave: () => void; onView: () => void
}) {
  const activeLabel = brand.postedDaysAgo === 0 ? 'Active today' : `Active ${brand.postedDaysAgo}d ago`

  return (
    <Reveal delay={delay}>
      <div className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/8 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_-8px_rgba(139,49,232,0.24)] ${CARD}`}>
        <div className="flex flex-1 flex-col p-4">

          {/* Row 1: identity */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <button onClick={onView} aria-label={`View ${brand.name}`} className="flex-shrink-0">
              <div className="overflow-hidden rounded-full border border-primary/10 bg-surface-sub ring-2 ring-primary/10 ring-offset-2 transition duration-300 group-hover:ring-primary/40"
                style={{ width: 52, height: 52 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-cover" draggable={false} />
              </div>
            </button>

            {/* Name + category + meta */}
            <button onClick={onView} className="min-w-0 flex-1 text-left">
              <h3 className="flex items-center gap-1 truncate text-[14.5px] font-extrabold leading-snug text-ink">
                <span className="truncate">{brand.name}</span>
                {brand.verified && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/Tick.svg" alt="Verified" className="h-[13px] w-[13px] flex-shrink-0" />
                )}
              </h3>
              <p className="truncate text-[11px] font-semibold text-primary/70">{brand.category}</p>
              <p className="mt-0.5 truncate text-[10.5px] font-medium text-ink/40">
                {brand.city}, {brand.country}<span className="mx-1 text-ink/20">·</span>{activeLabel}
              </p>
            </button>

            {/* Bookmark */}
            <button onClick={e => { e.stopPropagation(); onToggleSave() }}
              aria-label={saved ? 'Remove from saved' : 'Save brand'}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition ${saved ? `${GRAD_BTN} text-white shadow-md` : 'bg-surface-sub text-ink/35 hover:bg-primary/10 hover:text-primary'}`}>
              <BookmarkIcon s={15} filled={saved} />
            </button>
          </div>

          {/* Divider */}
          <div className="my-3.5 h-px bg-primary/8" />

          {/* Row 2: stats */}
          <div className="flex items-center justify-around rounded-xl bg-surface-sub px-2 py-2.5">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1">
                <UsersIcon s={11} />
                <span className={`text-[14px] font-extrabold ${GRAD_TEXT}`}>{brand.activeCreators}</span>
              </span>
              <span className="mt-0.5 text-[10px] font-medium leading-none text-ink/40">Creators</span>
            </div>
            <div className="h-6 w-px bg-primary/10" />
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1">
                <ClockIcon s={11} />
                <span className={`text-[14px] font-extrabold ${GRAD_TEXT}`}>{brand.responseTime}</span>
              </span>
              <span className="mt-0.5 text-[10px] font-medium leading-none text-ink/40">Response</span>
            </div>
            <div className="h-6 w-px bg-primary/10" />
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-0.5">
                <StarIcon s={12} />
                <span className={`text-[14px] font-extrabold ${GRAD_TEXT}`}>{brand.rating.toFixed(1)}</span>
              </span>
              <span className="mt-0.5 text-[10px] font-medium leading-none text-ink/40">Rating</span>
            </div>
          </div>

          {/* Row 3: collab badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {brand.collabTypes.map(t => <CollabBadge key={t} type={t} />)}
          </div>

          {/* Row 4: primary rate */}
          <p className="mt-2 text-[11.5px] font-bold text-ink/55">{brand.primaryRate}</p>

          {/* Row 5: description */}
          <p className="mt-2 line-clamp-2 h-[2.55rem] overflow-hidden text-[12px] leading-[1.55] text-ink/55">
            {brand.description}
          </p>

          {/* Row 6: CTA pinned to bottom */}
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

  const openModal    = () => { setDraft(filters); setModalOpen(true) }
  const closeModal   = () => setModalOpen(false)
  const applyFilters = (f: FilterState) => setFilters(f)
  const toggleSaved  = (id: string) => setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  /* ── Applied tag list ── */
  const appliedTags: AppliedTag[] = useMemo(() => {
    const tags: AppliedTag[] = []
    filters.categories.forEach(c => tags.push({
      key: `cat-${c}`, label: c,
      onRemove: () => setFilters(f => ({ ...f, categories: f.categories.filter(x => x !== c) })),
    }))
    filters.collabTypes.forEach(c => {
      const label = COLLAB_OPTIONS.find(o => o.key === c)?.label ?? c
      tags.push({ key: `collab-${c}`, label, onRemove: () => setFilters(f => ({ ...f, collabTypes: f.collabTypes.filter(x => x !== c) })) })
    })
    filters.locations.forEach(loc => tags.push({
      key: `loc-${loc}`, label: loc,
      onRemove: () => setFilters(f => ({ ...f, locations: f.locations.filter(x => x !== loc) })),
    }))
    if (filters.minActiveCreators > 0) {
      const label = MIN_ACTIVE_CREATORS.find(o => o.value === filters.minActiveCreators)?.label ?? `${filters.minActiveCreators}+`
      tags.push({ key: 'minac', label: `${label} creators`, onRemove: () => setFilters(f => ({ ...f, minActiveCreators: 0 })) })
    }
    if (filters.maxResponseTime !== '') {
      tags.push({ key: 'resp', label: `Replies in ${filters.maxResponseTime}`, onRemove: () => setFilters(f => ({ ...f, maxResponseTime: '' })) })
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

  /* ── Response time helper ── */
  const responseOrder: Record<string, number> = { '12h': 1, '24h': 2, '48h': 3, '72h': 4 }

  /* ── Filtering + sorting ── */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BRAND_RESULTS.filter(b => {
      if (showSavedOnly && !saved.includes(b.id)) return false
      if (filters.categories.length > 0 && !filters.categories.includes(b.category)) return false
      if (filters.collabTypes.length > 0 && !filters.collabTypes.some(c => b.collabTypes.includes(c))) return false
      if (filters.locations.length > 0 && !filters.locations.includes(b.country)) return false
      if (filters.minActiveCreators > 0 && b.activeCreators < filters.minActiveCreators) return false
      if (filters.maxResponseTime !== '') {
        const brandOrder = responseOrder[b.responseTime] ?? 99
        const maxOrder   = responseOrder[filters.maxResponseTime] ?? 99
        if (brandOrder > maxOrder) return false
      }
      if (filters.minRating > 0 && b.rating < filters.minRating) return false
      if (filters.verifiedOnly && !b.verified) return false
      if (q && !(b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q)))) return false
      return true
    })
  }, [query, filters, showSavedOnly, saved])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'Most active creators') arr.sort((a, b) => b.activeCreators - a.activeCreators)
    else if (sort === 'Highest commission') arr.sort((a, b) => b.rateSortValue - a.rateSortValue)
    else if (sort === 'Newest') arr.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
    return arr
  }, [filtered, sort])

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [query, filters, showSavedOnly, sort])

  const visible = sorted.slice(0, visibleCount)
  const resultCountLabel = query.trim()
    ? `${sorted.length} brand${sorted.length === 1 ? '' : 's'} match "${query.trim()}"`
    : `${sorted.length} brand${sorted.length === 1 ? '' : 's'} to discover`

  const NAV_LEFT  = [{ label: 'Discover', active: true }, { label: 'My Campaigns', active: false }]
  const NAV_RIGHT = [{ label: 'Messages', active: false }, { label: 'Dashboard', active: false }]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* Filter modal */}
      <FilterModal open={modalOpen} onClose={closeModal} onApply={applyFilters} draft={draft} setDraft={setDraft} />

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

          {/* Applied filter tags */}
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
            {visible.map((brand, i) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                delay={(i % PAGE_SIZE) * 40}
                saved={saved.includes(brand.id)}
                onToggleSave={() => toggleSaved(brand.id)}
                onView={() => { /* navigate to /brand/[slug] */ }}
              />
            ))}
          </div>
        )}

        {visibleCount < sorted.length && (
          <div className="mt-8 flex justify-center">
            <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              className="rounded-xl border border-primary/15 bg-white px-8 py-3 text-[13px] font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/[0.04]">
              Show more brands
            </button>
          </div>
        )}
      </main>
    </div>
  )
}