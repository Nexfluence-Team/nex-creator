'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Opportunity read — app/creator/opportunity/[id]/page.tsx
                      (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   Full-page read of a brand's campaign opportunity.

   Data shape maps directly from the brand's campaign builder
   (app/brand/campaign/new/page.tsx) so every field shown here
   corresponds to something the brand filled in:
     - objective, name, description, dos, donts, guidelines
     - ageMin/ageMax, gender, locations, niches, languages
     - budgetType, flatBudget, commissionPct, startDate, endDate
     - piecesRequired

   Two entry modes, same page:
     • mode="invite"      — brand sent a direct invite (from dashboard
                            InvitesRow). Actions: Accept + message | Decline.
     • mode="opportunity" — creator found this in Discover. Actions:
                            Apply with message | Save.

   Layout (desktop): 2/3 main content + 1/3 sticky sidebar.
   Header: NexLogo pill (centred) | left nav | right icon nav —
   exact creator dashboard pattern.
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ════════════════════════════════════════════════════════════════════
   TYPES — mirrors CampaignDraft from campaign builder + sender info
   ════════════════════════════════════════════════════════════════════ */
type Objective  = 'awareness' | 'consideration' | 'conversions' | 'app'
type Gender     = 'all' | 'male' | 'female'
type BudgetType = 'flat' | 'commission' | 'hybrid'
type DealType   = 'paid' | 'affiliate' | 'barter' | 'hybrid'
type EntryMode  = 'invite' | 'opportunity'
type PageStatus = 'pending' | 'accepted' | 'applied' | 'declined'

interface OpportunityData {
  /* Sender */
  id:              string
  brandName:       string
  brandSlug:       string
  brandType:       'brand' | 'agency'
  brandColor:      string
  brandInitials:   string
  brandLogoUrl:    string | null
  brandRating:     number
  brandActiveCreators: number
  brandResponseTime:   string
  brandCity:       string
  brandCountry:    string
  brandBio:        string
  brandEmail:      string          /* shown as unlocked after accept/apply */

  /* Campaign — all from CampaignDraft */
  objective:       Objective
  name:            string
  description:     string
  dos:             string          /* newline-separated */
  donts:           string          /* newline-separated */
  guidelines:      string
  ageMin:          number
  ageMax:          number
  gender:          Gender
  locations:       string[]
  niches:          string[]
  languages:       string[]
  budgetType:      BudgetType
  dealType:        DealType
  flatBudget:      string
  commissionPct:   string
  startDate:       string
  endDate:         string
  piecesRequired:  number
  formats:         string[]
  platforms:       string[]
  rateNote:        string

  /* Discovery metadata */
  matchScore:      number
  spotsLeft:       number
  applicationCount: number
  postedDaysAgo:   number
  deadlineDaysLeft: number
  deadline:        string
  mode:            EntryMode       /* invite | opportunity */
  status:          PageStatus
}

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA — mirrors what a brand would set in the campaign builder
   ════════════════════════════════════════════════════════════════════ */
const MOCK_OPPORTUNITY: OpportunityData = {
  id: 'op-kinetics-racedday',

  /* Brand */
  brandName:           'Kinetics',
  brandSlug:           'kinetics',
  brandType:           'brand',
  brandColor:          '#8B31E8',
  brandInitials:       'KI',
  brandLogoUrl:        null,
  brandRating:         4.8,
  brandActiveCreators: 34,
  brandResponseTime:   '24h',
  brandCity:           'Riga',
  brandCountry:        'Latvia',
  brandBio:            'Clean, third-party-tested sports nutrition. We brief like a marketer, not a vending machine — real lab results before you ever post.',
  brandEmail:          'creators@kinetics.lv',

  /* Campaign brief — exactly what the brand typed in Step 2 */
  objective:           'conversions',
  name:                'Pre-Workout Race Day Launch',
  description:         "We're launching our new Pre-Workout Race Day formula and want authentic content from creators who genuinely train. Show your morning or pre-race routine, naturally integrating the product. Real sweat, real reps — no polished gym-flex vibes.\n\nThe formula is caffeine-free and tested by third-party labs. We want creators who can speak to that credibility honestly — not just hold the product in a gym selfie.",
  dos:                 "Show it as part of your actual training routine\nMention the caffeine-free formula specifically\nInclude the discount code in bio for 72 hours after posting\nFilm in a real training environment — outdoors, gym floor, track\nTag @kinetics.lv in the caption",
  donts:               "Don't compare to competitor brands by name\nDon't script it — we want authentic, first-person delivery\nNo exaggerated claims about results or performance\nDon't remove or crop out the product label\nNo excessive filters — skin and sweat should look real",
  guidelines:          "Hashtags: #KineticsRaceDay #CleanFuel #ThirdPartyTested\nPosting window: Tuesday–Thursday for best organic reach\nUsage rights: we retain right to boost content as paid ads for 60 days post-publish\nMinimum video length: 45 seconds for reels, 3 minutes for YouTube\nCaption must include the tracking link in bio",

  /* Audience — from Step 3 */
  ageMin:              20,
  ageMax:              38,
  gender:              'all',
  locations:           ['Latvia', 'Lithuania', 'Estonia'],
  niches:              ['Fitness & Training', 'Sports Nutrition', 'Wellness'],
  languages:           ['English', 'Latvian'],

  /* Budget — from Step 4 */
  budgetType:          'hybrid',
  dealType:            'hybrid',
  flatBudget:          '300',
  commissionPct:       '8',
  startDate:           '2026-07-01',
  endDate:             '2026-07-20',
  piecesRequired:      2,
  formats:             ['Instagram Reel', 'TikTok'],
  platforms:           ['Instagram', 'TikTok'],
  rateNote:            'Flat €300 paid on content delivery. Affiliate rate of 8% runs for 90 days from the day you post, paid monthly via Grade.',

  /* Metadata */
  matchScore:          94,
  spotsLeft:           3,
  applicationCount:    11,
  postedDaysAgo:       2,
  deadlineDaysLeft:    18,
  deadline:            'Jul 20',
  mode:                'invite',   /* change to 'opportunity' to test that flow */
  status:              'pending',
}

/* ════════════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════════════ */
const OBJECTIVE_META: Record<Objective, {
  title: string; sub: string; color: string; bg: string; description: string
}> = {
  awareness:     { title: 'Awareness',     sub: 'Reach & impressions',   color: '#8B31E8', bg: '#f5f0fe', description: 'Brand wants to reach new audiences and build recognition.' },
  consideration: { title: 'Consideration', sub: 'Traffic & engagement',  color: '#2563EB', bg: '#eff4fe', description: 'Brand wants people to explore, save, and engage with their product.' },
  conversions:   { title: 'Conversions',   sub: 'Sales & sign-ups',      color: '#DB2777', bg: '#fdf0f7', description: 'Brand is tracking clicks, purchases and affiliate conversions with full attribution.' },
  app:           { title: 'App Promotion', sub: 'Installs & engagement', color: '#D97706', bg: '#fffbeb', description: 'Brand wants creators to drive app installs or re-engagement via tracked links.' },
}

const BUDGET_META: Record<BudgetType, { title: string; sub: string }> = {
  flat:       { title: 'Flat fee',       sub: 'Fixed per deliverable'        },
  commission: { title: 'Commission',     sub: 'Revenue share on sales'        },
  hybrid:     { title: 'Hybrid',         sub: 'Base fee + commission'         },
}

const DEAL_TYPE_META: Record<DealType, { label: string; bg: string; text: string }> = {
  paid:      { label: 'Paid',      bg: 'bg-violet-50',  text: 'text-violet-700'  },
  affiliate: { label: 'Affiliate', bg: 'bg-sky-50',     text: 'text-sky-700'     },
  barter:    { label: 'Barter',    bg: 'bg-amber-50',   text: 'text-amber-700'   },
  hybrid:    { label: 'Hybrid',    bg: 'bg-pink-50',    text: 'text-pink-700'    },
}

const OBJ_PILL: Record<Objective, string> = {
  awareness:     'text-violet-600 bg-violet-50',
  consideration: 'text-sky-600 bg-sky-50',
  conversions:   'text-pink-600 bg-pink-50',
  app:           'text-amber-600 bg-amber-50',
}

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function ChevronLeft({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChatBubbleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function BellIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CheckIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function ClockIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function StarIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z"/></svg>
}
function UsersIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function SendIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BookmarkIcon({ s = 14, filled = false }: { s?: number; filled?: boolean }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}><path d="M6 3.5h12a1 1 0 011 1V21l-7-4-7 4V4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}
function FileTextIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
}
function MapPinIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function TargetIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
}
function PercentIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function CoinsIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.8"/><path d="M10.67 4A6 6 0 0116 14.33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function MixIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="15" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function SpeakerIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function HeartIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CartIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function AppIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 18h.01M9 6h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>
}
function ExternalLinkIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BuildingIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function AgencyIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function MailIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LockIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function CalendarIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function ImageIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   OBJECTIVE ICON helper
   ════════════════════════════════════════════════════════════════════ */
function ObjectiveIcon({ objective, s = 20 }: { objective: Objective; s?: number }) {
  switch (objective) {
    case 'awareness':     return <SpeakerIcon s={s}/>
    case 'consideration': return <HeartIcon   s={s}/>
    case 'conversions':   return <CartIcon    s={s}/>
    case 'app':           return <AppIcon     s={s}/>
  }
}

function BudgetIcon({ type, s = 18 }: { type: BudgetType; s?: number }) {
  switch (type) {
    case 'flat':       return <CoinsIcon   s={s}/>
    case 'commission': return <PercentIcon s={s}/>
    case 'hybrid':     return <MixIcon     s={s}/>
  }
}

/* ════════════════════════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
   ════════════════════════════════════════════════════════════════════ */
function LogoTile({ name, color, logoUrl, initials, size = 44 }: {
  name: string; color: string; logoUrl?: string | null; initials?: string; size?: number
}) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (logoUrl) return (
    <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-white" style={{ width: size, height: size }}>
      <img src={logoUrl} alt={name} width={size} height={size} className="h-full w-full object-contain p-1" draggable={false}/> {/* eslint-disable-line @next/next/no-img-element */}
    </div>
  )
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {abbr}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-[10.5px] font-black uppercase tracking-[0.16em] text-ink/35">{children}</p>
}

/* ─── parse newline-separated string into array of non-empty lines ── */
function parseLines(s: string): string[] {
  return s.split('\n').map(l => l.trim()).filter(Boolean)
}

/* ─── Format date string YYYY-MM-DD → "Jul 1, 2026" ────────────── */
function fmtDate(d: string): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return d }
}

/* ════════════════════════════════════════════════════════════════════
   ACTION MODAL — Accept/Apply with message composer
   ════════════════════════════════════════════════════════════════════ */
function ActionModal({ open, opp, onClose, onConfirm }: {
  open: boolean
  opp: OpportunityData
  onClose: () => void
  onConfirm: (message: string) => void
}) {
  const [msg, setMsg] = useState('')
  const isInvite = opp.mode === 'invite'

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; setMsg('') }
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[520px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>
        {/* Drag bar — mobile */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>

        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <LogoTile name={opp.brandName} color={opp.brandColor} logoUrl={opp.brandLogoUrl} initials={opp.brandInitials} size={40}/>
            <div>
              <p className="text-[11px] font-semibold text-ink/40">{opp.brandName}</p>
              <p className="text-[15px] font-extrabold leading-tight text-ink">{isInvite ? 'Accept this invite' : 'Submit your application'}</p>
            </div>
          </div>

          <p className="text-[13px] text-ink/55 mb-4">
            {isInvite
              ? `Write a short message to ${opp.brandName} — introduce yourself, mention why you're a strong fit, or ask a quick question. They'll receive it as your first message in the thread.`
              : `Write a short application message. Mention what makes you the right creator for "${opp.name}". Optional but strongly recommended.`
            }
          </p>

          <textarea
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder={isInvite
              ? `Hi ${opp.brandName}! I'd love to join this campaign. I've been training consistently for 3 years and my audience is exactly the demographic you're targeting…`
              : `Hi ${opp.brandName}! I'd love to be part of the "${opp.name}" campaign. My audience is ${opp.niches[0] ?? 'fitness'}-focused and I've driven strong conversion results for similar brands…`
            }
            className="min-h-[120px] w-full resize-none rounded-xl border border-primary/15 bg-surface-sub px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30"
          />

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-between">
            <button onClick={onClose}
              className="order-2 flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-3 text-[13px] font-bold text-ink/55 transition hover:bg-surface-sub sm:order-1">
              Cancel
            </button>
            <button onClick={() => onConfirm(msg)}
              className={`order-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[14px] font-bold text-white transition hover:-translate-y-0.5 sm:order-2 ${GRAD_BTN}`}>
              {isInvite ? <><CheckIcon s={14}/>Accept & send message</> : <><SendIcon s={14}/>Submit application</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DECLINE CONFIRM
   ════════════════════════════════════════════════════════════════════ */
function DeclineModal({ open, brandName, onClose, onConfirm }: {
  open: boolean; brandName: string; onClose: () => void; onConfirm: () => void
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[380px] overflow-hidden rounded-3xl bg-white p-7 text-center ${CARD}`}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <XIcon s={24}/>
        </div>
        <h3 className="text-[17px] font-extrabold text-ink">Decline invite?</h3>
        <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-[1.65] text-ink/55">
          {brandName} won't be notified of the specific reason. You can change your mind later by reaching out directly.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button onClick={onConfirm}
            className="w-full rounded-xl bg-rose-500 py-3.5 text-[14px] font-bold text-white transition hover:bg-rose-600">
            Yes, decline
          </button>
          <button onClick={onClose}
            className="w-full rounded-xl border border-primary/15 bg-white py-3.5 text-[14px] font-bold text-ink/55 transition hover:bg-surface-sub">
            Keep for now
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function OpportunityReadPage() {
  const router  = useRouter()

  /* In real app: fetch by [id] param. Here we use the mock. */
  const [opp, setOpp]               = useState<OpportunityData>(MOCK_OPPORTUNITY)
  const [status, setStatus]         = useState<PageStatus>(MOCK_OPPORTUNITY.status)
  const [saved, setSaved]           = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)

  /* Header badge constants */
  const UNREAD_MESSAGES = 3
  const UNREAD_NOTIFS   = 2

  const isResolved = status !== 'pending'
  const obj  = OBJECTIVE_META[opp.objective]
  const dt   = DEAL_TYPE_META[opp.dealType]
  const bm   = BUDGET_META[opp.budgetType]
  const dosList   = parseLines(opp.dos)
  const dontsList = parseLines(opp.donts)
  const guidelinesList = parseLines(opp.guidelines)

  const handleConfirm = (_message: string) => {
    setActionOpen(false)
    setStatus(opp.mode === 'invite' ? 'accepted' : 'applied')
    /* In real app: POST to API, then push to messages */
    setTimeout(() => router.push('/creator/messages'), 800)
  }

  const handleDecline = () => {
    setDeclineOpen(false)
    setStatus('declined')
  }

  const paymentSummary = opp.budgetType === 'flat'
    ? `€${opp.flatBudget} per deliverable`
    : opp.budgetType === 'commission'
    ? `${opp.commissionPct}% commission`
    : `€${opp.flatBudget} flat + ${opp.commissionPct}% commission`

  const NAV_LEFT = [
    { label: 'Dashboard', active: false, action: () => router.push('/dashboard/creator') },
    { label: 'Discover',  active: false, action: () => router.push('/discover/brands')   },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ MODALS ════ */}
      <ActionModal
        open={actionOpen}
        opp={opp}
        onClose={() => setActionOpen(false)}
        onConfirm={handleConfirm}
      />
      <DeclineModal
        open={declineOpen}
        brandName={opp.brandName}
        onClose={() => setDeclineOpen(false)}
        onConfirm={handleDecline}
      />

      {/* ════ HEADER — exact creator dashboard pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5">
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            <div className="relative z-10 flex items-center gap-1.5">
              <button onClick={() => router.push('/creator/messages')} title="Messages" aria-label="Messages"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <ChatBubbleIcon s={18}/>
                {UNREAD_MESSAGES > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>
                    {UNREAD_MESSAGES}
                  </span>
                )}
              </button>
              <button title="Notifications" aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <BellIcon s={18}/>
                {UNREAD_NOTIFS > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>
                    {UNREAD_NOTIFS}
                  </span>
                )}
              </button>
              <button onClick={() => router.push('/creator/profile')}
                className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:flex">
                My Profile
              </button>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Back link ── */}
        <button onClick={() => router.back()}
          className="mb-5 flex items-center gap-1.5 text-[13px] font-semibold text-ink/50 transition hover:text-primary">
          <ChevronLeft s={14}/>Back
        </button>

        {/* ════════════════════ HERO HEADER ════════════════════ */}
        <div className={`mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          {/* Brand row */}
          <div className="flex items-center gap-3">
            <LogoTile name={opp.brandName} color={opp.brandColor} logoUrl={opp.brandLogoUrl} initials={opp.brandInitials} size={48}/>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-bold text-ink">{opp.brandName}</p>
                <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${opp.brandType === 'agency' ? 'bg-blue-50 text-blue-600' : 'bg-primary/[0.08] text-primary'}`}>
                  {opp.brandType === 'agency' ? <><AgencyIcon s={10}/>Agency</> : <><BuildingIcon s={10}/>Brand</>}
                </span>
                <span className="text-[11px] text-ink/35">{opp.brandCity}, {opp.brandCountry}</span>
              </div>
              {/* Mode label */}
              <p className="mt-0.5 text-[11px] font-semibold text-ink/40">
                {opp.mode === 'invite' ? '📩 Sent you a direct invite' : '🔓 Open opportunity'}
              </p>
            </div>
          </div>

          {/* Campaign title */}
          <h1 className="mt-4 text-[clamp(20px,2.8vw,28px)] font-black tracking-[-0.03em] leading-tight text-ink">
            {opp.name}
          </h1>

          {/* Pills row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${OBJ_PILL[opp.objective]}`}>
              {obj.title}
            </span>
            <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${dt.bg} ${dt.text}`}>
              {dt.label}
            </span>
            {opp.deadlineDaysLeft <= 7 && (
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10.5px] font-bold text-rose-600">
                ⚡ Closing in {opp.deadlineDaysLeft}d
              </span>
            )}
            {/* Resolved state badge */}
            {status === 'accepted' && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-700">
                <CheckIcon s={12}/>Accepted
              </span>
            )}
            {status === 'applied' && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-700">
                <CheckIcon s={12}/>Applied
              </span>
            )}
            {status === 'declined' && (
              <span className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[11.5px] font-bold text-rose-600">
                <XIcon s={11}/>Declined
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-primary/8 pt-4">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink/50">
              <ClockIcon s={13}/>Deadline: <span className="font-bold text-ink">{opp.deadline}</span>
            </div>
            {opp.mode === 'opportunity' && (
              <>
                <div className={`flex items-center gap-1.5 text-[12px] font-medium ${opp.spotsLeft <= 3 ? 'text-rose-600 font-bold' : 'text-ink/50'}`}>
                  <span className={`h-2 w-2 rounded-full ${opp.spotsLeft <= 3 ? 'bg-rose-400' : 'bg-emerald-400'}`}/>
                  {opp.spotsLeft} spot{opp.spotsLeft !== 1 ? 's' : ''} remaining
                </div>
                <div className="text-[12px] text-ink/40">{opp.applicationCount} applicants so far</div>
              </>
            )}
            {/* Match score */}
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-[12px] font-bold ${opp.matchScore >= 90 ? 'text-emerald-600' : 'text-primary'}`}>
                {opp.matchScore}% match
              </span>
              <div className="w-24 overflow-hidden rounded-full bg-primary/[0.08]" style={{ height: 5 }}>
                <div className={`h-full rounded-full transition-all duration-700 ${opp.matchScore >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : GRAD_BTN}`}
                  style={{ width: `${opp.matchScore}%` }}/>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════ BODY GRID ════════════════════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── LEFT — main content (2/3) ── */}
          <div className="space-y-5 lg:col-span-2">

            {/* Campaign brief */}
            <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
              <SectionLabel>Campaign brief</SectionLabel>
              {/* Objective context */}
              <div className="mb-4 flex items-center gap-3 rounded-xl p-3.5" style={{ background: obj.bg }}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/60" style={{ color: obj.color }}>
                  <ObjectiveIcon objective={opp.objective} s={20}/>
                </div>
                <div>
                  <p className="text-[12px] font-bold" style={{ color: obj.color }}>{obj.title} · {obj.sub}</p>
                  <p className="text-[12px] text-ink/55">{obj.description}</p>
                </div>
              </div>
              {/* Description */}
              <div className="space-y-3">
                {opp.description.split('\n\n').map((para, i) => (
                  <p key={i} className="text-[14px] leading-[1.75] text-ink/70">{para}</p>
                ))}
              </div>
            </div>

            {/* Content requirements */}
            <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
              <SectionLabel>Content requirements</SectionLabel>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: <FileTextIcon s={16}/>, label: 'Pieces',   value: `${opp.piecesRequired} piece${opp.piecesRequired !== 1 ? 's' : ''}` },
                  { icon: <ImageIcon s={16}/>,    label: 'Formats',  value: opp.formats.join(', ')   },
                  { icon: <CalendarIcon s={16}/>, label: 'Runs',     value: `${fmtDate(opp.startDate)} – ${fmtDate(opp.endDate)}` },
                  { icon: <TargetIcon s={16}/>,   label: 'Platforms',value: opp.platforms.join(', ') },
                ].map(item => (
                  <div key={item.label} className="rounded-xl bg-surface-sub p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-primary/70">{item.icon}</div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/40">{item.label}</p>
                    <p className="mt-0.5 text-[13px] font-bold text-ink">{item.value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dos & Don'ts */}
            <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
              <SectionLabel>What to do & what not to do</SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Dos */}
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="mb-3 text-[10.5px] font-black uppercase tracking-[0.14em] text-emerald-700">✓  Do this</p>
                  {dosList.length > 0 ? (
                    <ul className="space-y-2.5">
                      {dosList.map((line, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <CheckIcon s={10}/>
                          </span>
                          <span className="text-[13px] leading-[1.55] text-emerald-900">{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-[13px] italic text-emerald-700/50">No specific requirements listed.</p>}
                </div>

                {/* Don'ts */}
                <div className="rounded-xl bg-rose-50 p-4">
                  <p className="mb-3 text-[10.5px] font-black uppercase tracking-[0.14em] text-rose-700">✕  Don't do this</p>
                  {dontsList.length > 0 ? (
                    <ul className="space-y-2.5">
                      {dontsList.map((line, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                            <XIcon s={10}/>
                          </span>
                          <span className="text-[13px] leading-[1.55] text-rose-900">{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-[13px] italic text-rose-700/50">No restrictions listed.</p>}
                </div>
              </div>

              {/* Additional guidelines */}
              {guidelinesList.length > 0 && (
                <div className="mt-4 rounded-xl bg-surface-sub p-4">
                  <p className="mb-2.5 text-[10.5px] font-black uppercase tracking-[0.14em] text-ink/40">Additional guidelines</p>
                  <ul className="space-y-2">
                    {guidelinesList.map((line, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-ink/30"/>
                        <span className="text-[13px] leading-[1.6] text-ink/65">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Target audience */}
            <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
              <SectionLabel>Creator & audience they're looking for</SectionLabel>
              <div className="space-y-4">

                {/* Age + Gender row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface-sub p-3.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/40">Target age</p>
                    <p className="mt-1 text-[15px] font-extrabold text-ink">
                      {opp.ageMin}–{opp.ageMax === 65 ? '65+' : opp.ageMax}
                    </p>
                    <p className="text-[11px] text-ink/40">years old</p>
                  </div>
                  <div className="rounded-xl bg-surface-sub p-3.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/40">Gender focus</p>
                    <p className="mt-1 text-[15px] font-extrabold text-ink capitalize">
                      {opp.gender === 'all' ? 'All genders' : opp.gender}
                    </p>
                  </div>
                </div>

                {/* Locations */}
                {opp.locations.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-[11.5px] font-bold text-ink/50">
                      <MapPinIcon s={13}/>Target locations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {opp.locations.map(l => (
                        <span key={l} className="rounded-lg border border-primary/12 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink/70">{l}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Niches */}
                {opp.niches.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-[11.5px] font-bold text-ink/50">
                      <TargetIcon s={13}/>Creator niches wanted
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {opp.niches.map(n => (
                        <span key={n} className="rounded-lg border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-[12.5px] font-semibold text-primary">{n}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {opp.languages.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11.5px] font-bold text-ink/50">Content language{opp.languages.length > 1 ? 's' : ''}</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.languages.map(l => (
                        <span key={l} className="rounded-lg border border-ink/10 bg-surface-sub px-3 py-1.5 text-[12.5px] font-semibold text-ink/60">🗣 {l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RIGHT SIDEBAR (1/3, sticky) ── */}
          <div className="space-y-4 lg:col-span-1">
            <div className="lg:sticky lg:top-[84px] space-y-4">

              {/* ── CTA card ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                {status === 'pending' && (
                  <>
                    <button onClick={() => setActionOpen(true)}
                      className={`w-full rounded-xl py-3.5 text-[14px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]`}>
                      {opp.mode === 'invite' ? '✓ Accept & message brand' : '→ Apply with message'}
                    </button>
                    <div className="mt-2.5 flex gap-2">
                      {opp.mode === 'invite' && (
                        <button onClick={() => setDeclineOpen(true)}
                          className="flex-1 rounded-xl border border-rose-200 bg-white py-3 text-[13px] font-bold text-rose-600 transition hover:bg-rose-50">
                          Decline
                        </button>
                      )}
                      <button onClick={() => setSaved(s => !s)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 px-4 text-[13px] font-bold transition ${saved ? 'border-primary/20 bg-primary/[0.06] text-primary' : 'border-primary/12 bg-white text-ink/50 hover:border-primary/25 hover:text-primary'} ${opp.mode !== 'invite' ? 'flex-1' : 'w-auto'}`}>
                        <BookmarkIcon s={14} filled={saved}/>{opp.mode !== 'invite' && (saved ? 'Saved' : 'Save')}
                      </button>
                    </div>
                  </>
                )}
                {status === 'accepted' && (
                  <div className="flex flex-col items-center gap-2 py-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"><CheckIcon s={22}/></div>
                    <p className="text-[14px] font-extrabold text-emerald-700">Invite accepted!</p>
                    <p className="text-[12.5px] text-ink/50">Opening messages thread…</p>
                    <button onClick={() => router.push('/creator/messages')}
                      className="mt-2 flex items-center gap-2 rounded-xl border border-primary/15 px-5 py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
                      <ChatBubbleIcon s={14}/>Open messages
                    </button>
                  </div>
                )}
                {status === 'applied' && (
                  <div className="flex flex-col items-center gap-2 py-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"><CheckIcon s={22}/></div>
                    <p className="text-[14px] font-extrabold text-emerald-700">Application submitted!</p>
                    <p className="text-[12.5px] text-ink/50">{opp.brandName} will respond within {opp.brandResponseTime}.</p>
                    <button onClick={() => router.push('/creator/messages')}
                      className="mt-2 flex items-center gap-2 rounded-xl border border-primary/15 px-5 py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
                      <ChatBubbleIcon s={14}/>Open messages
                    </button>
                  </div>
                )}
                {status === 'declined' && (
                  <div className="flex flex-col items-center gap-2 py-2 text-center">
                    <p className="text-[14px] font-bold text-ink/55">Invite declined</p>
                    <button onClick={() => router.push('/discover/brands')}
                      className="mt-1 rounded-xl border border-primary/15 px-5 py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
                      Browse more opportunities
                    </button>
                  </div>
                )}
              </div>

              {/* ── Compensation ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <SectionLabel>Compensation</SectionLabel>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}>
                    <BudgetIcon type={opp.budgetType} s={18}/>
                  </div>
                  <div>
                    <p className="text-[14px] font-extrabold text-ink">{paymentSummary}</p>
                    <p className="text-[11.5px] text-ink/45">{bm.title} · {bm.sub}</p>
                  </div>
                </div>
                {opp.rateNote && (
                  <p className="rounded-xl bg-primary/[0.05] px-3.5 py-2.5 text-[12.5px] leading-[1.6] text-ink/60 border border-primary/10">
                    {opp.rateNote}
                  </p>
                )}
                {/* Unlocked email — only after accept/apply */}
                <div className="mt-4 border-t border-primary/8 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11.5px] font-bold text-ink/50">Direct email</p>
                    {!isResolved && <span className="flex items-center gap-1 text-[11px] font-semibold text-ink/35"><LockIcon s={11}/>Unlocks on accept</span>}
                  </div>
                  {isResolved && status !== 'declined' ? (
                    <a href={`mailto:${opp.brandEmail}`}
                      className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.04] px-3.5 py-2.5 text-[13px] font-semibold text-primary transition hover:bg-primary/[0.08]">
                      <MailIcon s={14}/>{opp.brandEmail}
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-surface-sub px-3.5 py-2.5 text-[13px] font-semibold text-ink/30 select-none">
                      <MailIcon s={14}/>
                      <span>{'*'.repeat(8)}@{opp.brandEmail.split('@')[1]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── About the brand ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <SectionLabel>About {opp.brandName}</SectionLabel>
                <div className="flex items-center gap-3 mb-3">
                  <LogoTile name={opp.brandName} color={opp.brandColor} logoUrl={opp.brandLogoUrl} initials={opp.brandInitials} size={44}/>
                  <div>
                    <p className="text-[14px] font-extrabold text-ink">{opp.brandName}</p>
                    <p className="text-[11.5px] text-ink/45">{opp.brandCity}, {opp.brandCountry}</p>
                  </div>
                </div>
                <p className="mb-4 text-[12.5px] leading-[1.65] text-ink/55">{opp.brandBio}</p>

                {/* Mini stats */}
                <div className="grid grid-cols-3 divide-x divide-primary/8 rounded-xl border border-primary/8 bg-surface-sub">
                  {[
                    { icon: <StarIcon s={12}/>,  value: opp.brandRating.toFixed(1),     label: 'Rating'   },
                    { icon: <UsersIcon s={12}/>, value: String(opp.brandActiveCreators), label: 'Creators' },
                    { icon: <ClockIcon s={12}/>, value: opp.brandResponseTime,           label: 'Replies'  },
                  ].map(stat => (
                    <div key={stat.label} className="flex flex-col items-center py-3">
                      <span className="mb-1 text-amber-400">{stat.icon}</span>
                      <span className={`text-[14px] font-extrabold ${GRAD_TEXT}`}>{stat.value}</span>
                      <span className="mt-0.5 text-[9.5px] font-semibold text-ink/35">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-col gap-2">
                  <button onClick={() => router.push(`/brand/${opp.brandSlug}`)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
                    <ExternalLinkIcon s={13}/>View brand profile
                  </button>
                  <button onClick={() => router.push('/creator/messages')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary/12 bg-white py-2.5 text-[13px] font-bold text-ink/55 transition hover:bg-surface-sub hover:text-ink">
                    <ChatBubbleIcon s={14}/>Message on platform
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ════ STICKY MOBILE ACTION BAR ════ */}
        {status === 'pending' && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
            <div className="mx-auto flex max-w-[400px] gap-2.5">
              {opp.mode === 'invite' && (
                <button onClick={() => setDeclineOpen(true)}
                  className="flex-shrink-0 rounded-xl border border-rose-200 bg-white px-4 py-3 text-[13px] font-bold text-rose-600 transition hover:bg-rose-50">
                  Decline
                </button>
              )}
              <button onClick={() => setActionOpen(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white ${GRAD_BTN}`}>
                {opp.mode === 'invite' ? 'Accept & message' : 'Apply with message'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}