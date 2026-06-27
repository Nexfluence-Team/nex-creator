'use client'

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Creator search — app/brand/campaign/search/page.tsx  (Nexfluence v4)
   Reads campaign draft from sessionStorage (set by /brand/campaign/new).
   Grid of creator cards with filter modal + Send Invite flow.
   Header matches brand dashboard exactly.
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const PAGE_SIZE = 9

/* ─── Campaign draft (read from sessionStorage) ─────────────────── */
interface CampaignDraft {
  objective: string | null
  name: string
  description: string
  ageMin: number
  ageMax: number
  gender: string
  locations: string[]
  niches: string[]
  budgetType: string
  commissionPct: string
  flatBudget: string
}
const EMPTY_DRAFT: CampaignDraft = {
  objective: null, name: '', description: '',
  ageMin: 18, ageMax: 45, gender: 'all',
  locations: [], niches: [], budgetType: 'commission',
  commissionPct: '15', flatBudget: '',
}

const OBJECTIVE_LABELS: Record<string, string> = {
  awareness: 'Awareness', consideration: 'Consideration',
  conversions: 'Conversions', app: 'App Promotion',
}
const OBJECTIVE_COLORS: Record<string, { text: string; bg: string }> = {
  awareness:     { text: 'text-violet-700',  bg: 'bg-violet-50'  },
  consideration: { text: 'text-blue-700',    bg: 'bg-blue-50'    },
  conversions:   { text: 'text-pink-700',    bg: 'bg-pink-50'    },
  app:           { text: 'text-amber-700',   bg: 'bg-amber-50'   },
}

/* ─── Filter types ───────────────────────────────────────────────── */
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
const MIN_ENGAGEMENT_OPTIONS = [
  { label: 'Any',  value: 0  },
  { label: '3%+',  value: 3  },
  { label: '5%+',  value: 5  },
  { label: '8%+',  value: 8  },
  { label: '10%+', value: 10 },
]
const MIN_RATING_OPTIONS = [
  { label: 'Any',  value: 0   },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
  { label: '4.8+', value: 4.8 },
]
const SORT_OPTIONS = ['Relevance', 'Most followers', 'Highest engagement', 'Newest'] as const
type SortOption = typeof SORT_OPTIONS[number]

type FilterState = {
  niches: string[]; platforms: Platform[]; collabTypes: CollabType[]
  minFollowers: number; minEngagement: number; minRating: number
  locations: string[]; verifiedOnly: boolean
}
const EMPTY_FILTERS: FilterState = {
  niches: [], platforms: [], collabTypes: [],
  minFollowers: 0, minEngagement: 0, minRating: 0,
  locations: [], verifiedOnly: false,
}

/* ─── Creator data ───────────────────────────────────────────────── */
type CreatorResult = {
  id: string; name: string; handle: string; verified: boolean
  avatarUrl: string | null; color: string; initials: string
  niche: string; city: string; country: string; flagCode: string
  platform: Platform; followers: number; followersLabel: string
  engagementRate: number; collabTypes: CollabType[]; primaryRate: string
  rating: number; postedDaysAgo: number; description: string; tags: string[]
  matchScore: number  /* 0–100, shown as a match % bar */
}

const CREATOR_RESULTS: CreatorResult[] = [
  { id: 'c1',  name: 'Amelia Roze',       handle: '@amelia.roze',       verified: true,  avatarUrl: '/test/images/Harshul.png', color: '#8B31E8', initials: 'AR', niche: 'Beauty',          city: 'Riga',     country: 'Latvia',    flagCode: 'lv', platform: 'instagram', followers: 142000, followersLabel: '142K', engagementRate: 6.8,  collabTypes: ['affiliate','paid'],          primaryRate: '15% commission', rating: 4.9, postedDaysAgo: 1,  description: 'Beauty & lifestyle creator who turns everyday routines into content that actually converts — honest results over polished ads.',                                           tags: ['beauty','skincare','lifestyle'], matchScore: 97 },
  { id: 'c2',  name: 'Markus Tamm',       handle: '@markustamm',        verified: true,  avatarUrl: null,                       color: '#2563EB', initials: 'MT', niche: 'Fitness',         city: 'Tallinn',  country: 'Estonia',   flagCode: 'ee', platform: 'tiktok',    followers: 96000,  followersLabel: '96K',  engagementRate: 11.2, collabTypes: ['paid','affiliate'],          primaryRate: 'From €400/video',  rating: 4.7, postedDaysAgo: 3,  description: 'Strength-training diaries shot mid-session, not staged. Known for turning brand briefs into believable training-block content.',                                          tags: ['fitness','strength training','gym'], matchScore: 91 },
  { id: 'c3',  name: 'Elīna Krūmiņa',    handle: '@elina.kr',           verified: false, avatarUrl: null,                       color: '#059669', initials: 'EK', niche: 'Wellness',        city: 'Jūrmala',  country: 'Latvia',    flagCode: 'lv', platform: 'instagram', followers: 51000,  followersLabel: '51K',  engagementRate: 5.4,  collabTypes: ['barter','affiliate'],        primaryRate: '12% commission',  rating: 4.5, postedDaysAgo: 9,  description: 'Slow-living and recovery content for a steady, highly engaged community. Replies fast and never overcommits on deliverables.',                                            tags: ['wellness','recovery','slow living'], matchScore: 84 },
  { id: 'c4',  name: 'Jonas Petrauskas',  handle: '@jonas.fit',          verified: true,  avatarUrl: null,                       color: '#D97706', initials: 'JP', niche: 'Fitness',         city: 'Vilnius',  country: 'Lithuania', flagCode: 'lt', platform: 'youtube',   followers: 38000,  followersLabel: '38K',  engagementRate: 4.9,  collabTypes: ['paid'],                      primaryRate: 'From €500/video',  rating: 4.8, postedDaysAgo: 2,  description: 'Long-form training breakdowns and full product deep-dives. His audience comes for the complete story, not the highlight reel.',                                           tags: ['fitness','training','long-form'], matchScore: 88 },
  { id: 'c5',  name: 'Liis Saar',         handle: '@liis.moves',         verified: false, avatarUrl: null,                       color: '#0EA5E9', initials: 'LS', niche: 'Wellness',        city: 'Tartu',    country: 'Estonia',   flagCode: 'ee', platform: 'instagram', followers: 24000,  followersLabel: '24K',  engagementRate: 9.4,  collabTypes: ['barter'],                    primaryRate: '€90+ gift value',  rating: 4.2, postedDaysAgo: 14, description: 'Hot yoga and recovery rituals, filmed raw with no second takes. Small but unusually loyal audience for her size.',                                                       tags: ['wellness','yoga','recovery'], matchScore: 76 },
  { id: 'c6',  name: 'Kristaps Bērziņš', handle: '@kristaps.tech',      verified: false, avatarUrl: null,                       color: '#475569', initials: 'KB', niche: 'Tech',            city: 'Riga',     country: 'Latvia',    flagCode: 'lv', platform: 'youtube',   followers: 18000,  followersLabel: '18K',  engagementRate: 4.1,  collabTypes: ['paid'],                      primaryRate: 'From €350/video',  rating: 4.4, postedDaysAgo: 20, description: 'Hands-on gadget reviews for a niche but technical audience. Will tell viewers honestly if a product underperforms.',                                                    tags: ['tech','gadgets','reviews'], matchScore: 62 },
  { id: 'c7',  name: 'Sandra Liepa',      handle: '@sandra.liepa',       verified: true,  avatarUrl: null,                       color: '#DB2777', initials: 'SL', niche: 'Fashion',         city: 'Vilnius',  country: 'Lithuania', flagCode: 'lt', platform: 'instagram', followers: 68000,  followersLabel: '68K',  engagementRate: 7.2,  collabTypes: ['affiliate','paid','barter'], primaryRate: '18% commission',  rating: 4.6, postedDaysAgo: 5,  description: 'Capsule-wardrobe styling and outfit breakdowns. Strong at turning a single product into a full week of wearable content.',                                               tags: ['fashion','styling','capsule wardrobe'], matchScore: 73 },
  { id: 'c8',  name: 'Aiga Ozola',        handle: '@aiga.bakes',         verified: true,  avatarUrl: null,                       color: '#EA580C', initials: 'AO', niche: 'Food & Beverage', city: 'Riga',     country: 'Latvia',    flagCode: 'lv', platform: 'tiktok',    followers: 112000, followersLabel: '112K', engagementRate: 13.5, collabTypes: ['affiliate','barter'],        primaryRate: '10% commission',  rating: 4.9, postedDaysAgo: 0,  description: 'Home-baking recipes that consistently break out beyond her own following. Ingredient swaps and pantry brands perform especially well.',                                 tags: ['food','baking','recipes'], matchScore: 80 },
  { id: 'c9',  name: 'Henrik Saks',       handle: '@henrik.roams',       verified: false, avatarUrl: null,                       color: '#0D9488', initials: 'HS', niche: 'Travel',          city: 'Tallinn',  country: 'Estonia',   flagCode: 'ee', platform: 'instagram', followers: 45000,  followersLabel: '45K',  engagementRate: 6.0,  collabTypes: ['paid','barter'],             primaryRate: 'From €450/video',  rating: 4.3, postedDaysAgo: 17, description: 'Slow-travel itineraries across the Baltics and Nordics. Audience skews toward longer trip-planning purchases.',                                                        tags: ['travel','itinerary','baltics'], matchScore: 58 },
  { id: 'c10', name: 'Justina Rimkutė',  handle: '@justina.family',     verified: false, avatarUrl: null,                       color: '#7C3AED', initials: 'JR', niche: 'Parenting',       city: 'Kaunas',   country: 'Lithuania', flagCode: 'lt', platform: 'instagram', followers: 33000,  followersLabel: '33K',  engagementRate: 5.8,  collabTypes: ['barter','affiliate'],        primaryRate: '14% commission',  rating: 4.1, postedDaysAgo: 25, description: 'Honest, unsponsored-feeling parenting content. Will only feature products she has actually used with her own kids.',                                                   tags: ['parenting','family','kids'], matchScore: 55 },
  { id: 'c11', name: 'Gustavs Krasts',    handle: '@gustavs.outdoors',   verified: false, avatarUrl: null,                       color: '#16A34A', initials: 'GK', niche: 'Fitness',         city: 'Riga',     country: 'Latvia',    flagCode: 'lv', platform: 'youtube',   followers: 29000,  followersLabel: '29K',  engagementRate: 4.9,  collabTypes: ['paid'],                      primaryRate: 'From €300/video',  rating: 4.0, postedDaysAgo: 30, description: 'Trail running and outdoor fitness gear tested on actual Baltic terrain, rain or shine.',                                                                                tags: ['fitness','outdoor','trail running'], matchScore: 69 },
  { id: 'c12', name: 'Rūta Vaitkutė',    handle: '@ruta.glow',          verified: true,  avatarUrl: null,                       color: '#C026D3', initials: 'RV', niche: 'Beauty',          city: 'Vilnius',  country: 'Lithuania', flagCode: 'lt', platform: 'tiktok',    followers: 87000,  followersLabel: '87K',  engagementRate: 10.1, collabTypes: ['affiliate'],                 primaryRate: '16% commission',  rating: 4.7, postedDaysAgo: 4,  description: 'Fast-cut skincare hacks built for discovery, not just her existing following. Strong track record of breakout TikTok posts.',                                            tags: ['beauty','skincare','tiktok hacks'], matchScore: 94 },
  { id: 'c13', name: 'Marit Kask',        handle: '@marit.sauna',        verified: false, avatarUrl: null,                       color: '#0891B2', initials: 'MK', niche: 'Wellness',        city: 'Tallinn',  country: 'Estonia',   flagCode: 'ee', platform: 'instagram', followers: 21000,  followersLabel: '21K',  engagementRate: 8.3,  collabTypes: ['barter','paid'],             primaryRate: '€120+ gift value', rating: 4.4, postedDaysAgo: 11, description: 'Sauna and cold-plunge culture documented in real sessions, not staged spa shoots. Niche, but the niche is exactly the point.',                                          tags: ['wellness','sauna','cold plunge'], matchScore: 71 },
  { id: 'c14', name: 'Roberts Auziņš',   handle: '@roberts.daily',      verified: true,  avatarUrl: null,                       color: '#CA8A04', initials: 'RA', niche: 'Lifestyle',       city: 'Jūrmala',  country: 'Latvia',    flagCode: 'lv', platform: 'youtube',   followers: 56000,  followersLabel: '56K',  engagementRate: 5.1,  collabTypes: ['paid','affiliate'],          primaryRate: 'From €380/video',  rating: 4.5, postedDaysAgo: 7,  description: 'Day-in-the-life vlogs with consistently strong watch time. Good fit for brands that want a product woven into routine, not pitched.',                                   tags: ['lifestyle','vlog','daily routine'], matchScore: 79 },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function SearchIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function XIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function SlidersIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14M22 18h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="16" cy="6" r="2.2" fill="currentColor"/><circle cx="6" cy="12" r="2.2" fill="currentColor"/><circle cx="18" cy="18" r="2.2" fill="currentColor"/></svg>
}
function BookmarkIcon({ s = 16, filled = false }: { s?: number; filled?: boolean }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}><path d="M6 3.5h12a1 1 0 011 1V21l-7-4-7 4V4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}
function Check({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function StarIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z"/></svg>
}
function SendIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ShieldIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ZapIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function HandshakeIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevronLeft({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function UserCheckIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M1 21v-1a7 7 0 0112.03-4.88M16 18l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
   ════════════════════════════════════════════════════════════════════ */
function PersonAvatar({ name, color, avatarUrl, initials, size = 48 }: {
  name: string; color: string; avatarUrl?: string | null; initials?: string; size?: number
}) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatarUrl) return <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full" style={{ width: size, height: size }}><img src={avatarUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" draggable={false}/></div> // eslint-disable-line @next/next/no-img-element
  return <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{abbr}</div>
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.06, rootMargin: '0px 0px -16px 0px' })
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
    affiliate: { icon: <ShieldIcon s={10}/>,    label: 'Affiliate' },
    paid:      { icon: <ZapIcon s={10}/>,       label: 'Paid'      },
    barter:    { icon: <HandshakeIcon s={10}/>, label: 'Barter'    },
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
      <img src={m.src} alt="" className="h-3 w-3 rounded-sm object-contain"/> {/* eslint-disable-line @next/next/no-img-element */}
      {m.label}
    </span>
  )
}

/* ─── Match score pill ──────────────────────────────────────────── */
function MatchBadge({ score }: { score: number }) {
  const cls = score >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : score >= 75 ? 'bg-primary/[0.07] text-primary border-primary/20'
            :               'bg-surface-sub text-ink/50 border-primary/10'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${cls}`}>
      {score}% match
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CAMPAIGN CONTEXT BANNER
   Shown at top of results — summarises what campaign they're searching for
   ════════════════════════════════════════════════════════════════════ */
function CampaignBanner({ draft, onEdit }: { draft: CampaignDraft; onEdit: () => void }) {
  const objLabel = draft.objective ? (OBJECTIVE_LABELS[draft.objective] ?? draft.objective) : null
  const objStyle = draft.objective ? (OBJECTIVE_COLORS[draft.objective] ?? { text: 'text-ink/60', bg: 'bg-surface-sub' }) : null

  const targeting: string[] = []
  if (draft.ageMin || draft.ageMax) targeting.push(`Age ${draft.ageMin}–${draft.ageMax === 65 ? '65+' : draft.ageMax}`)
  if (draft.gender && draft.gender !== 'all') targeting.push(draft.gender === 'male' ? 'Male' : 'Female')
  if (draft.locations.length > 0) targeting.push(draft.locations.slice(0, 2).join(', ') + (draft.locations.length > 2 ? ` +${draft.locations.length - 2}` : ''))
  if (draft.niches.length > 0) targeting.push(draft.niches.slice(0, 2).join(', ') + (draft.niches.length > 2 ? ` +${draft.niches.length - 2}` : ''))

  if (!draft.name && !objLabel) return null

  return (
    <div className={`mb-5 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 sm:flex-row sm:items-center sm:gap-5 ${CARD}`}>
      {/* Left: campaign identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Gradient campaign icon */}
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} shadow-[0_4px_12px_-4px_rgba(139,49,232,0.40)]`}>
          <SendIcon s={16}/>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[14px] font-extrabold text-ink">
              {draft.name || 'Untitled campaign'}
            </p>
            {objLabel && objStyle && (
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${objStyle.bg} ${objStyle.text}`}>
                {objLabel}
              </span>
            )}
          </div>
          {targeting.length > 0 && (
            <p className="mt-0.5 text-[11.5px] text-ink/45">
              Targeting: {targeting.join(' · ')}
            </p>
          )}
        </div>
      </div>
      {/* Right: edit link */}
      <button type="button" onClick={onEdit}
        className="flex flex-shrink-0 items-center gap-1.5 self-start rounded-lg border border-primary/15 px-3.5 py-2 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.04] sm:self-auto">
        Edit campaign
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INVITE CONFIRMATION MODAL
   ════════════════════════════════════════════════════════════════════ */
function InviteModal({ open, creator, campaignName, onConfirm, onClose }: {
  open: boolean
  creator: CreatorResult | null
  campaignName: string
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open || !creator) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl bg-white p-7 text-center ${CARD}`}>

        {/* Creator avatar */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <PersonAvatar name={creator.name} color={creator.color} avatarUrl={creator.avatarUrl} initials={creator.initials} size={64}/>
        </div>

        {/* Headline */}
        <h3 className="text-[18px] font-extrabold tracking-[-0.02em] text-ink">
          Invite {creator.name}?
        </h3>
        <p className="mx-auto mt-2 max-w-[320px] text-[13.5px] leading-[1.65] text-ink/55">
          They'll receive a campaign invite for <span className="font-bold text-ink">"{campaignName || 'your campaign'}"</span> with your brief, dos/don'ts, and payment terms. They can accept, decline, or message you back.
        </p>

        {/* Creator quick stats */}
        <div className="mx-auto mt-4 flex items-center justify-center gap-5 rounded-2xl bg-surface-sub px-5 py-3">
          <div className="text-center">
            <p className={`text-[15px] font-black ${GRAD_TEXT}`}>{creator.followersLabel}</p>
            <p className="text-[10px] font-semibold text-ink/40">Followers</p>
          </div>
          <div className="h-6 w-px bg-primary/10"/>
          <div className="text-center">
            <p className={`text-[15px] font-black ${GRAD_TEXT}`}>{creator.engagementRate}%</p>
            <p className="text-[10px] font-semibold text-ink/40">Engagement</p>
          </div>
          <div className="h-6 w-px bg-primary/10"/>
          <div className="text-center">
            <p className={`text-[15px] font-black ${GRAD_TEXT}`}>{creator.primaryRate}</p>
            <p className="text-[10px] font-semibold text-ink/40">Rate</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button type="button" onClick={onConfirm}
            className={`w-full rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
            Send invite
          </button>
          <button type="button" onClick={onClose}
            className="w-full rounded-xl border border-primary/15 bg-white py-3.5 text-[14px] font-bold text-ink/55 transition hover:bg-surface-sub">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   FILTER MODAL
   ════════════════════════════════════════════════════════════════════ */
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
        <Check s={11}/>
      </span>
      {label}
    </button>
  )
}

function FilterModal({ open, onClose, onApply, draft, setDraft }: {
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

  const activeCount = draft.niches.length + draft.platforms.length + draft.collabTypes.length +
    draft.locations.length + (draft.verifiedOnly ? 1 : 0) +
    (draft.minFollowers > 0 ? 1 : 0) + (draft.minEngagement > 0 ? 1 : 0) + (draft.minRating > 0 ? 1 : 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div className={`relative z-10 flex w-full max-w-[560px] max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white ${CARD}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-ink">Filter creators</h2>
            {activeCount > 0 && <p className="mt-0.5 text-[12px] font-medium text-ink/45">{activeCount} filter{activeCount !== 1 ? 's' : ''} active</p>}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button onClick={() => setDraft(EMPTY_FILTERS)} className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-primary transition hover:bg-primary/[0.07]">Reset all</button>
            )}
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10"><XIcon s={14}/></button>
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Niche</p>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(n => <ModalToggleChip key={n} label={n} active={draft.niches.includes(n)} onClick={() => setDraft({ ...draft, niches: toggle(draft.niches, n) })}/>)}
            </div>
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Platform</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(p => <ModalToggleChip key={p} label={PLATFORM_META[p].label} active={draft.platforms.includes(p)} onClick={() => setDraft({ ...draft, platforms: toggle(draft.platforms, p) })}/>)}
            </div>
          </section>
          <section>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Open to</p>
            {COLLAB_OPTIONS.map(c => <ModalCheckRow key={c.key} label={c.label} checked={draft.collabTypes.includes(c.key)} onToggle={() => setDraft({ ...draft, collabTypes: toggle(draft.collabTypes, c.key) })}/>)}
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Minimum followers</p>
            <div className="flex flex-wrap gap-2">
              {MIN_FOLLOWERS_OPTIONS.map(opt => <ModalToggleChip key={opt.label} label={opt.label} active={draft.minFollowers === opt.value} onClick={() => setDraft({ ...draft, minFollowers: draft.minFollowers === opt.value ? 0 : opt.value })}/>)}
            </div>
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Minimum engagement rate</p>
            <div className="flex flex-wrap gap-2">
              {MIN_ENGAGEMENT_OPTIONS.map(opt => <ModalToggleChip key={opt.label} label={opt.label} active={draft.minEngagement === opt.value} onClick={() => setDraft({ ...draft, minEngagement: draft.minEngagement === opt.value ? 0 : opt.value })}/>)}
            </div>
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Minimum rating</p>
            <div className="flex flex-wrap gap-2">
              {MIN_RATING_OPTIONS.map(opt => <ModalToggleChip key={opt.label} label={opt.label} active={draft.minRating === opt.value} onClick={() => setDraft({ ...draft, minRating: draft.minRating === opt.value ? 0 : opt.value })}/>)}
            </div>
          </section>
          <section>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Location</p>
            {LOCATIONS.map(loc => <ModalCheckRow key={loc} label={loc} checked={draft.locations.includes(loc)} onToggle={() => setDraft({ ...draft, locations: toggle(draft.locations, loc) })}/>)}
          </section>
          <section>
            <ModalCheckRow label="Verified creators only" checked={draft.verifiedOnly} onToggle={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })}/>
          </section>
        </div>
        {/* Footer */}
        <div className="border-t border-primary/8 px-6 py-4">
          <button onClick={() => { onApply(draft); onClose() }}
            className={`w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white shadow-[0_4px_18px_-4px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>
            Show results{activeCount > 0 ? ` · ${activeCount} filter${activeCount !== 1 ? 's' : ''} applied` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   APPLIED FILTER TAGS
   ════════════════════════════════════════════════════════════════════ */
type AppliedTag = { key: string; label: string; onRemove: () => void }

function AppliedFilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.07] px-2.5 py-1.5 text-[12px] font-semibold text-primary">
      {label}
      <button onClick={onRemove} className="flex h-4 w-4 items-center justify-center rounded-md bg-primary/15 text-primary transition hover:bg-primary hover:text-white">
        <XIcon s={9}/>
      </button>
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SORT DROPDOWN
   ════════════════════════════════════════════════════════════════════ */
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
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={`text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className={`absolute right-0 top-[calc(100%+8px)] z-30 w-[200px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold transition hover:bg-primary/[0.06] ${value === opt ? 'bg-primary/[0.07] text-primary' : 'text-ink/75'}`}>
              {opt}{value === opt && <span className={`h-2 w-2 flex-shrink-0 rounded-full ${GRAD_BTN}`}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SEARCH BAR
   ════════════════════════════════════════════════════════════════════ */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={17}/></span>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder="Search creators, niches, or handles…"
        className="w-full rounded-full border border-primary/12 bg-surface-sub py-2.5 pl-11 pr-11 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)] placeholder:text-ink/35"/>
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-ink/8 text-ink/50 transition hover:bg-ink/14">
          <XIcon s={12}/>
        </button>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════════════════════════════════════ */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/15 bg-surface-sub py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary"><SearchIcon s={26}/></div>
      <h3 className="text-[17px] font-extrabold text-ink">No creators match your search</h3>
      <p className="mt-2 max-w-[320px] text-[13px] leading-[1.6] text-ink/50">Try a different keyword or clear your filters to see all available creators.</p>
      <button onClick={onClear} className={`mt-5 rounded-lg ${GRAD_BTN} px-6 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5`}>Clear all filters</button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CREATOR CARD
   Primary CTA: "Send Invite" (gradient)
   Secondary CTA: "View profile" (ghost)
   Invited state: "Invited ✓" (emerald, disabled)
   ════════════════════════════════════════════════════════════════════ */
function CreatorCard({ creator, delay, saved, invited, onToggleSave, onInvite, onView }: {
  creator: CreatorResult; delay: number
  saved: boolean; invited: boolean
  onToggleSave: () => void; onInvite: () => void; onView: () => void
}) {
  const activeLabel = creator.postedDaysAgo === 0 ? 'Active today' : `Active ${creator.postedDaysAgo}d ago`

  return (
    <Reveal delay={delay}>
      <div className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/8 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_-8px_rgba(139,49,232,0.22)] ${CARD}`}>
        <div className="flex flex-1 flex-col p-4">

          {/* ── Identity row ── */}
          <div className="flex items-start gap-3">
            <button onClick={onView} className="flex-shrink-0">
              <div className="rounded-full ring-2 ring-primary/15 ring-offset-2 transition duration-200 group-hover:ring-primary/40">
                <PersonAvatar name={creator.name} color={creator.color} avatarUrl={creator.avatarUrl} initials={creator.initials} size={48}/>
              </div>
            </button>
            <button onClick={onView} className="min-w-0 flex-1 text-left">
              <h3 className="flex items-center gap-1 text-[14px] font-extrabold leading-snug text-ink">
                <span className="truncate">{creator.name}</span>
                {creator.verified && <img src="/Tick.svg" alt="Verified" className="h-[13px] w-[13px] flex-shrink-0"/> /* eslint-disable-line @next/next/no-img-element */}
              </h3>
              <p className="text-[11.5px] font-semibold text-primary/70">{creator.handle}</p>
              <p className="mt-0.5 text-[10.5px] font-medium text-ink/40">{creator.city}, {creator.country}<span className="mx-1">·</span>{activeLabel}</p>
            </button>
            {/* Save bookmark */}
            <button onClick={e => { e.stopPropagation(); onToggleSave() }}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition ${saved ? `${GRAD_BTN} text-white shadow-md` : 'bg-surface-sub text-ink/35 hover:bg-primary/10 hover:text-primary'}`}>
              <BookmarkIcon s={14} filled={saved}/>
            </button>
          </div>

          {/* ── Match score ── */}
          <div className="mt-2.5 flex items-center gap-2">
            <MatchBadge score={creator.matchScore}/>
            {/* Match bar */}
            <div className="flex-1 overflow-hidden rounded-full bg-primary/[0.08]" style={{ height: 4 }}>
              <div className={`h-full rounded-full transition-all duration-700 ${creator.matchScore >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : GRAD_BTN}`}
                style={{ width: `${creator.matchScore}%` }}/>
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className="mt-3 flex items-center justify-around rounded-xl bg-surface-sub px-2 py-2.5">
            <div className="flex flex-col items-center">
              <span className={`text-[13.5px] font-extrabold ${GRAD_TEXT}`}>{creator.followersLabel}</span>
              <span className="mt-0.5 text-[9.5px] font-semibold text-ink/40">Followers</span>
            </div>
            <div className="h-5 w-px bg-primary/10"/>
            <div className="flex flex-col items-center">
              <span className={`text-[13.5px] font-extrabold ${GRAD_TEXT}`}>{creator.engagementRate}%</span>
              <span className="mt-0.5 text-[9.5px] font-semibold text-ink/40">Engagement</span>
            </div>
            <div className="h-5 w-px bg-primary/10"/>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-0.5">
                <span className="text-amber-400"><StarIcon s={12}/></span>
                <span className={`text-[13.5px] font-extrabold ${GRAD_TEXT}`}>{creator.rating.toFixed(1)}</span>
              </span>
              <span className="mt-0.5 text-[9.5px] font-semibold text-ink/40">Rating</span>
            </div>
          </div>

          {/* ── Badges ── */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <PlatformBadge platform={creator.platform}/>
            {creator.collabTypes.map(t => <CollabBadge key={t} type={t}/>)}
          </div>

          {/* ── Rate ── */}
          <p className="mt-2 text-[11.5px] font-bold text-ink/55">{creator.primaryRate}</p>

          {/* ── Description ── */}
          <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-[1.55] text-ink/50">{creator.description}</p>

          {/* ── CTA buttons ── */}
          <div className="mt-auto flex flex-col gap-2 pt-4">
            {invited ? (
              /* Invited state — full width, emerald, disabled */
              <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-[13px] font-bold text-white">
                <UserCheckIcon s={15}/> Invited ✓
              </div>
            ) : (
              /* Primary — Send Invite */
              <button type="button" onClick={onInvite}
                className={`flex items-center justify-center gap-2 rounded-xl ${GRAD_BTN} py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
                <SendIcon s={14}/>Send Invite
              </button>
            )}
            {/* Secondary — View profile (always visible) */}
            <button type="button" onClick={onView}
              className="flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white py-2 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.04]">
              View profile
            </button>
          </div>

        </div>
      </div>
    </Reveal>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function CampaignSearchPage() {
  const router = useRouter()

  /* Read campaign draft from sessionStorage */
  const [campaign, setCampaign] = useState<CampaignDraft>(EMPTY_DRAFT)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('nexfluence_campaign_draft')
      if (raw) setCampaign({ ...EMPTY_DRAFT, ...JSON.parse(raw) })
    } catch {}
  }, [])

  /* Search + filter state */
  const [query,         setQuery]         = useState('')
  const [filters,       setFilters]       = useState<FilterState>(EMPTY_FILTERS)
  const [filterDraft,   setFilterDraft]   = useState<FilterState>(EMPTY_FILTERS)
  const [filterOpen,    setFilterOpen]    = useState(false)
  const [sort,          setSort]          = useState<SortOption>('Relevance')
  const [showSaved,     setShowSaved]     = useState(false)
  const [saved,         setSaved]         = useState<string[]>([])
  const [visibleCount,  setVisibleCount]  = useState(PAGE_SIZE)

  /* Invite state */
  const [inviteTarget,  setInviteTarget]  = useState<CreatorResult | null>(null)
  const [invited,       setInvited]       = useState<string[]>([])

  const openFilter  = () => { setFilterDraft(filters); setFilterOpen(true) }
  const applyFilter = (f: FilterState) => setFilters(f)

  const toggleSaved = (id: string) =>
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleInviteConfirm = () => {
    if (!inviteTarget) return
    setInvited(prev => [...prev, inviteTarget.id])
    setInviteTarget(null)
  }

  /* Applied tags */
  const appliedTags: AppliedTag[] = useMemo(() => {
    const tags: AppliedTag[] = []
    filters.niches.forEach(n => tags.push({ key: `n-${n}`, label: n, onRemove: () => setFilters(f => ({ ...f, niches: f.niches.filter(x => x !== n) })) }))
    filters.platforms.forEach(p => tags.push({ key: `p-${p}`, label: PLATFORM_META[p].label, onRemove: () => setFilters(f => ({ ...f, platforms: f.platforms.filter(x => x !== p) })) }))
    filters.collabTypes.forEach(c => tags.push({ key: `c-${c}`, label: COLLAB_OPTIONS.find(o => o.key === c)?.label ?? c, onRemove: () => setFilters(f => ({ ...f, collabTypes: f.collabTypes.filter(x => x !== c) })) }))
    filters.locations.forEach(l => tags.push({ key: `l-${l}`, label: l, onRemove: () => setFilters(f => ({ ...f, locations: f.locations.filter(x => x !== l) })) }))
    if (filters.minFollowers > 0) tags.push({ key: 'mf', label: `${MIN_FOLLOWERS_OPTIONS.find(o => o.value === filters.minFollowers)?.label ?? filters.minFollowers} followers`, onRemove: () => setFilters(f => ({ ...f, minFollowers: 0 })) })
    if (filters.minEngagement > 0) tags.push({ key: 'me', label: `${MIN_ENGAGEMENT_OPTIONS.find(o => o.value === filters.minEngagement)?.label ?? filters.minEngagement}% engagement`, onRemove: () => setFilters(f => ({ ...f, minEngagement: 0 })) })
    if (filters.minRating > 0) tags.push({ key: 'mr', label: `${MIN_RATING_OPTIONS.find(o => o.value === filters.minRating)?.label ?? filters.minRating} rating`, onRemove: () => setFilters(f => ({ ...f, minRating: 0 })) })
    if (filters.verifiedOnly) tags.push({ key: 'v', label: 'Verified only', onRemove: () => setFilters(f => ({ ...f, verifiedOnly: false })) })
    return tags
  }, [filters])

  /* Filtered + sorted results */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CREATOR_RESULTS.filter(c => {
      if (showSaved && !saved.includes(c.id)) return false
      if (filters.niches.length > 0 && !filters.niches.includes(c.niche)) return false
      if (filters.platforms.length > 0 && !filters.platforms.includes(c.platform)) return false
      if (filters.collabTypes.length > 0 && !filters.collabTypes.some(t => c.collabTypes.includes(t))) return false
      if (filters.minFollowers > 0 && c.followers < filters.minFollowers) return false
      if (filters.minEngagement > 0 && c.engagementRate < filters.minEngagement) return false
      if (filters.minRating > 0 && c.rating < filters.minRating) return false
      if (filters.locations.length > 0 && !filters.locations.includes(c.country)) return false
      if (filters.verifiedOnly && !c.verified) return false
      if (q && !([c.name, c.niche, c.description, ...c.tags].some(v => v.toLowerCase().includes(q)))) return false
      return true
    })
  }, [query, filters, showSaved, saved])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'Most followers')      arr.sort((a, b) => b.followers - a.followers)
    else if (sort === 'Highest engagement') arr.sort((a, b) => b.engagementRate - a.engagementRate)
    else if (sort === 'Newest')         arr.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
    else                                arr.sort((a, b) => b.matchScore - a.matchScore)   // Relevance = match score desc
    return arr
  }, [filtered, sort])

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [query, filters, showSaved, sort])

  const visible = sorted.slice(0, visibleCount)
  const resultLabel = query.trim()
    ? `${sorted.length} creator${sorted.length !== 1 ? 's' : ''} match "${query.trim()}"`
    : `${sorted.length} creator${sorted.length !== 1 ? 's' : ''} found`

  /* Header nav — exact dashboard pattern */
  const NAV_LEFT  = [
    { label: 'Dashboard',   active: false, action: () => router.push('/dashboard/brand') },
    { label: 'Find creators', active: true,  action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'Messages',    active: false, action: () => router.push('/messages') },
    { label: 'My Profile',  active: false, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ INVITE MODAL ════ */}
      <InviteModal
        open={inviteTarget !== null}
        creator={inviteTarget}
        campaignName={campaign.name}
        onConfirm={handleInviteConfirm}
        onClose={() => setInviteTarget(null)}
      />

      {/* ════ FILTER MODAL ════ */}
      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={applyFilter}
        draft={filterDraft}
        setDraft={setFilterDraft}
      />

      {/* ════ HEADER — exact dashboard pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_RIGHT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.40)] sm:h-9"/>
            </div>
          </div>

          {/* Search row */}
          <div className="mt-2.5 flex items-center gap-2.5">
            {/* Back to campaign builder */}
            <button type="button" onClick={() => router.push('/brand/campaign/new')}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/12 text-ink/50 transition hover:border-primary/30 hover:text-primary">
              <ChevronLeft s={15}/>
            </button>

            <SearchBar value={query} onChange={setQuery}/>

            {/* Filters */}
            <button onClick={openFilter}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition ${
                appliedTags.length > 0
                  ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]`
                  : 'bg-surface-sub text-ink/65 hover:bg-primary/[0.08] hover:text-primary'
              }`}>
              <SlidersIcon s={14}/>
              Filters
              {appliedTags.length > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold">
                  {appliedTags.length}
                </span>
              )}
            </button>

            {/* Saved toggle */}
            <button onClick={() => setShowSaved(s => !s)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2.5 text-[12.5px] font-semibold transition ${
                showSaved ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]` : 'bg-surface-sub text-ink/65 hover:bg-primary/[0.08] hover:text-primary'
              }`}>
              <BookmarkIcon s={14} filled={showSaved}/>
              <span className="hidden sm:inline">Saved</span>
              {saved.length > 0 && (
                <span className={`flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${showSaved ? 'bg-white/25' : 'bg-primary/15 text-primary'}`}>
                  {saved.length}
                </span>
              )}
            </button>
          </div>

          {/* Applied filter tags */}
          {appliedTags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {appliedTags.map(tag => <AppliedFilterTag key={tag.key} label={tag.label} onRemove={tag.onRemove}/>)}
            </div>
          )}
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-6 py-6">

        {/* Campaign context banner */}
        <CampaignBanner draft={campaign} onEdit={() => router.push('/brand/campaign/new')}/>

        {/* Results header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-ink/50">{resultLabel}</p>
            {invited.length > 0 && (
              <p className="mt-0.5 text-[11.5px] font-bold text-emerald-600">
                {invited.length} invite{invited.length !== 1 ? 's' : ''} sent ✓
              </p>
            )}
          </div>
          <SortDropdown value={sort} onChange={setSort}/>
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <EmptyState onClear={() => { setFilters(EMPTY_FILTERS); setQuery('') }}/>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((creator, i) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                delay={(i % PAGE_SIZE) * 40}
                saved={saved.includes(creator.id)}
                invited={invited.includes(creator.id)}
                onToggleSave={() => toggleSaved(creator.id)}
                onInvite={() => setInviteTarget(creator)}
                onView={() => router.push(`/creator/${creator.handle.replace('@', '')}`)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
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