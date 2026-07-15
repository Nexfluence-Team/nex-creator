'use client'

import { useState, useEffect, useRef, useId, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Creator dashboard — app/dashboard/creator/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   CHANGES v3:
   • Route fixes: /creator-message, /creator-search, /creator-deal?id=,
     /display — matching the real route list, no more 404s.
   • Earnings arc gauge (confirmed vs. in-pipeline) replaces the linear
     goal bar; monthly goal + avg-per-deal are now one editable sentence.
   • Notifications moved to the top as a horizontally scrollable card row,
     including a locked "Nexus Pro" teaser card → opens SubscriptionModal.
   • Portfolio "lite" preview card near the top.
   • Invites / Active deals / Goals / To-do / Performance are all
     collapsible cards.
   • New: Goals section, To-do list (with smart + manual items, each
     wired to a real route).
   • Active deals now show expected-earnings RANGES; the mean of each
     range feeds the "in pipeline" figure in the earnings arc. Negotiating
     deals can be "finalized" inline, which recomputes everything live.
   • Views chart is now a bar chart, with save-events overlaid as markers.
   • Every "major" action (accept/reject invite, finalize deal, edit goal,
     reach a goal) logs a chart event + shows a "Saved" toast.
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const CREATOR = { firstName: 'Amelia' }
const UNREAD_MESSAGES = 3

let _uid = 0
const newId = (p: string) => `${p}_${++_uid}`
const euro = (n: number) => `€${n.toLocaleString()}`

/* ─── Range ─────────────────────────────────────────────────────── */
type RangeOption = 7 | 14 | 28
const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: 'Last 7 days',  value: 7  },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 28 days', value: 28 },
]

/* ─── Unique visitors data ───────────────────────────────────────── */
const UNIQUE_VISITORS_DATA: { label: string; views: number }[] = [
  { label: 'May 23', views: 210 }, { label: 'May 24', views: 245 }, { label: 'May 25', views: 198 },
  { label: 'May 26', views: 320 }, { label: 'May 27', views: 410 }, { label: 'May 28', views: 380 },
  { label: 'May 29', views: 295 }, { label: 'May 30', views: 330 }, { label: 'May 31', views: 365 },
  { label: 'Jun 1',  views: 290 }, { label: 'Jun 2',  views: 410 }, { label: 'Jun 3',  views: 455 },
  { label: 'Jun 4',  views: 500 }, { label: 'Jun 5',  views: 470 }, { label: 'Jun 6',  views: 520 },
  { label: 'Jun 7',  views: 610 }, { label: 'Jun 8',  views: 580 }, { label: 'Jun 9',  views: 540 },
  { label: 'Jun 10', views: 620 }, { label: 'Jun 11', views: 690 }, { label: 'Jun 12', views: 650 },
  { label: 'Jun 13', views: 700 }, { label: 'Jun 14', views: 680 }, { label: 'Jun 15', views: 750 },
  { label: 'Jun 16', views: 720 }, { label: 'Jun 17', views: 780 }, { label: 'Jun 18', views: 810 },
  { label: 'Jun 19', views: 860 },
]

/* ─── Notifications ──────────────────────────────────────────────── */
type NotificationType = 'message' | 'profile_view' | 'payment' | 'deal' | 'insight'
type NotificationItem = { id: string; type: NotificationType; title: string; time: string; unread: boolean }

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', type: 'message',      title: 'Kinetics sent you a new campaign invite',          time: '2h ago',  unread: true  },
  { id: 'n2', type: 'profile_view', title: 'Lumora Skincare viewed your creator profile',       time: '5h ago',  unread: true  },
  { id: 'n3', type: 'payment',      title: 'Payment received — €420 from Glossé',              time: '1d ago',  unread: false },
  { id: 'n4', type: 'deal',         title: 'Forma Fit sent you a contract to sign',             time: '2d ago',  unread: true  },
  { id: 'n5', type: 'insight',      title: 'Your profile was saved by 3 new brands this week', time: '3d ago',  unread: false },
  { id: 'n6', type: 'deal',         title: 'Amber Wellness approved your content piece',        time: '4d ago',  unread: false },
]

/* ─── Invites / Opportunities ────────────────────────────────────── */
type InviteStatus = 'pending' | 'accepted' | 'rejected'
type DealType     = 'paid' | 'affiliate' | 'barter' | 'hybrid'

type Invite = {
  id: string
  senderName: string; senderType: 'brand' | 'agency'; senderColor: string
  senderInitials: string; senderLogoUrl: string | null
  campaignTitle: string; objective: string; dealType: DealType
  rate: string; rateNote: string
  pieces: number; formats: string[]
  timeline: string; deadline: string
  brief: string
  dos: string[]; donts: string[]
  platforms: string[]
  status: InviteStatus
  receivedAt: string
}

const INITIAL_INVITES: Invite[] = [
  {
    id: 'inv1',
    senderName: 'Kinetics', senderType: 'brand', senderColor: '#8B31E8',
    senderInitials: 'KI', senderLogoUrl: null,
    campaignTitle: 'Pre-Workout Race Day Launch',
    objective: 'Conversions', dealType: 'hybrid',
    rate: '€300 + 8% commission', rateNote: 'Flat fee on delivery + affiliate rate for 90 days',
    pieces: 2, formats: ['Instagram Reel', 'TikTok'],
    timeline: 'Jun 25 – Jul 15', deadline: 'Jul 15',
    brief: "We're launching our new Pre-Workout Race Day formula and want authentic content from creators who genuinely train. Show your morning or pre-race routine, naturally integrating the product. Real sweat, real reps — no polished gym-flex vibes.",
    dos: ['Show it as part of your actual routine', 'Mention the caffeine-free formula', 'Include the discount code in bio for 72h'],
    donts: ["Don't compare to competitors", "Don't script it — we want authentic", "No exaggerated claims about results"],
    platforms: ['Instagram', 'TikTok'],
    status: 'pending',
    receivedAt: '2h ago',
  },
  {
    id: 'inv2',
    senderName: 'Lumora Skincare', senderType: 'brand', senderColor: '#059669',
    senderInitials: 'LS', senderLogoUrl: null,
    campaignTitle: 'Morning Ritual — Vitamin C Serum',
    objective: 'Awareness', dealType: 'barter',
    rate: 'Product gifting', rateNote: 'Full morning ritual kit (€120 value) + €50 top-up for reels over 20K views',
    pieces: 1, formats: ['Instagram Reel'],
    timeline: 'Jul 1 – Jul 20', deadline: 'Jul 20',
    brief: 'Our Vitamin C Glow Serum just hit shelves. We want a genuine morning ritual integration — bathroom, natural light, real skin. No heavy editing. The product speaks for itself if you give it a real showcase.',
    dos: ['Natural lighting preferred', 'Show before/after skin tone (no filter)', 'Tag @lumoraskincare in the caption'],
    donts: ['No FaceTune or heavy editing', "Don't use competing serums in the same video"],
    platforms: ['Instagram'],
    status: 'pending',
    receivedAt: '1d ago',
  },
  {
    id: 'inv3',
    senderName: 'Baltic Creators Agency', senderType: 'agency', senderColor: '#2563EB',
    senderInitials: 'BC', senderLogoUrl: null,
    campaignTitle: 'Q3 Fitness Roster — Multiple Brands',
    objective: 'UGC + Awareness', dealType: 'paid',
    rate: '€500 / month retainer', rateNote: '3-month Q3 retainer, 4 pieces/month across 2–3 brands we manage',
    pieces: 4, formats: ['Instagram Reel', 'TikTok', 'YouTube Short'],
    timeline: 'Jul 1 – Sep 30', deadline: 'Sep 30',
    brief: "We manage a portfolio of Baltic fitness and wellness brands and we're building a Q3 creator roster. You'd work across 2–3 brands per month — all health/fitness adjacent. Full briefs per campaign, but we give creators significant creative freedom.",
    dos: ['Show genuine product use across categories', 'Maintain consistent quality across all deliverables', 'Respond to brief within 48h of receipt'],
    donts: ["Don't mix brand identities in a single piece", 'No competitor references for any managed brand'],
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    status: 'pending',
    receivedAt: '3d ago',
  },
  {
    id: 'inv4',
    senderName: 'Amber Wellness', senderType: 'brand', senderColor: '#D97706',
    senderInitials: 'AW', senderLogoUrl: null,
    campaignTitle: 'Adaptogen Sleep Stack',
    objective: 'Conversions', dealType: 'affiliate',
    rate: '12% commission', rateNote: 'On all tracked sales, 60-day cookie, paid monthly',
    pieces: 3, formats: ['Instagram Story', 'Instagram Reel', 'TikTok'],
    timeline: 'Jul 5 – Aug 5', deadline: 'Aug 5',
    brief: "Our Adaptogen Sleep Stack is new to the Baltic market and we're looking for creators who resonate with the wellness/recovery niche. Content should focus on the wind-down routine — reading, journaling, supplements before bed.",
    dos: ['Evening / wind-down aesthetic', 'Mention ashwagandha and magnesium key ingredients', 'Include tracked affiliate link in bio'],
    donts: ['No medical claims', "Don't suggest replacing prescription sleep aids"],
    platforms: ['Instagram', 'TikTok'],
    status: 'pending',
    receivedAt: '4d ago',
  },
]

/* ─── Active deals — now with expected-earnings RANGES ───────────── */
type DealStatus = 'active' | 'review' | 'negotiation'
type ActiveDeal = {
  id: string
  brandName: string; brandColor: string; brandInitials: string; brandLogoUrl: string | null
  campaignTitle: string; objective: string; status: DealStatus
  piecesCommitted: number; piecesSubmitted: number; piecesApproved: number
  payMin: number; payMax: number; endDate: string
}

const INITIAL_ACTIVE_DEALS: ActiveDeal[] = [
  {
    id: 'd1',
    brandName: 'Kinetics', brandColor: '#8B31E8', brandInitials: 'KI', brandLogoUrl: null,
    campaignTitle: 'Vitamin-C Recovery Stack',
    objective: 'Conversions', status: 'active',
    piecesCommitted: 3, piecesSubmitted: 2, piecesApproved: 1,
    payMin: 340, payMax: 420, endDate: 'Jun 30',
  },
  {
    id: 'd2',
    brandName: 'Lumora Skincare', brandColor: '#059669', brandInitials: 'LS', brandLogoUrl: null,
    campaignTitle: 'Morning Ritual',
    objective: 'Awareness', status: 'review',
    piecesCommitted: 2, piecesSubmitted: 2, piecesApproved: 1,
    payMin: 200, payMax: 300, endDate: 'Jul 5',
  },
  {
    id: 'd3',
    brandName: 'Forma Fit', brandColor: '#2563EB', brandInitials: 'FF', brandLogoUrl: null,
    campaignTitle: 'Training Block Q3',
    objective: 'UGC', status: 'negotiation',
    piecesCommitted: 4, piecesSubmitted: 0, piecesApproved: 0,
    payMin: 450, payMax: 550, endDate: 'Jul 20',
  },
]

const dealRange = (d: ActiveDeal) => `${euro(d.payMin)}–${euro(d.payMax)}`
const dealMean  = (d: ActiveDeal) => Math.round((d.payMin + d.payMax) / 2)

/* ─── Earnings goal ──────────────────────────────────────────────── */
const EARNED_THIS_MONTH = 840

/* ─── Goals ───────────────────────────────────────────────────────── */
type GoalIcon = 'users' | 'handshake' | 'grid' | 'euro'
interface GoalItem { id: string; label: string; current: number; target: number; unit: string; icon: GoalIcon }

const INITIAL_GOALS: GoalItem[] = [
  { id: 'g1', label: 'Grow Instagram to 50K followers',        current: 41200, target: 50000, unit: 'followers', icon: 'users'     },
  { id: 'g2', label: 'Land 5 new brand deals this quarter',    current: 3,     target: 5,     unit: 'deals',     icon: 'handshake' },
  { id: 'g3', label: 'Publish 12 portfolio photos',            current: 6,     target: 12,    unit: 'photos',    icon: 'grid'      },
  { id: 'g4', label: 'Diversify into 3 income types',          current: 2,     target: 3,     unit: 'types',     icon: 'euro'      },
]

const BUMP_STEP: Record<string, number> = { followers: 500, deals: 1, photos: 1, types: 1, goal: 1 }

/* ─── To-do ──────────────────────────────────────────────────────── */
interface ManualTodo { id: string; label: string; done: boolean; href?: string; cta?: string }

const INITIAL_MANUAL_TODOS: ManualTodo[] = [
  { id: 'm1', label: 'Add 6 more portfolio photos to reach 12',   done: false, href: '/creator-studio',         cta: 'Open studio'    },
  { id: 'm2', label: 'Verify your primary platform stats are current', done: false, href: '/creator-studio',   cta: 'Open studio'    },
  { id: 'm3', label: 'Submit your next content piece for Kinetics', done: false, href: '/creator-content-submit', cta: 'Submit content' },
  { id: 'm4', label: 'Review your active contract terms',         done: false, href: '/creator-contract',      cta: 'View contract'  },
  { id: 'm5', label: 'Set up your payout method',                 done: false, href: '/creator-payment-withdraw', cta: 'Set up payouts' },
]

/* ─── Portfolio lite preview ─────────────────────────────────────── */
const PORTFOLIO_LITE = [
  { id: 'p1', tone: '#8B31E8' }, { id: 'p2', tone: '#FF33BC' }, { id: 'p3', tone: '#2563EB' },
  { id: 'p4', tone: '#059669' }, { id: 'p5', tone: '#D97706' }, { id: 'p6', tone: '#DB2777' },
]

/* ─── Chart events (save log) ────────────────────────────────────── */
interface ChartEvent { id: string; label: string; dayIndex: number }

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function CalendarIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function ChatBubbleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function BellIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EyeIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function HandshakeIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EuroIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LightbulbIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21h6M12 3a7 7 0 014.9 11.9c-.6.6-1.1 1.3-1.4 2.1H8.5c-.3-.8-.8-1.5-1.4-2.1A7 7 0 0112 3z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function TrendIcon({ up, s = 11 }: { up: boolean; s?: number }) {
  return up
    ? <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 17l6-6 4 4 6-8M14 7h6v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 7l6 6 4-4 6 8M14 17h6v-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TargetIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function ArrowRightIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SparkleIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l2.1-2.1M5.6 18.4l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function ClockIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CursorClickIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 3L5 21l4-4 4 4 2-8-6-10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 12l5-2M15 7l3-3M19 13l2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function BookmarkIcon({ s = 18, filled = false }: { s?: number; filled?: boolean }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}><path d="M6 3.5h12a1 1 0 011 1V21l-7-4-7 4V4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}
function SearchIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function EditIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CheckCircleIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function FileTextIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
}
function InboxIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CheckIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BuildingIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function UsersIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function GridIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7"/><rect x="3" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7"/></svg>
}
function PlusIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function LockIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function UserCircleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M6.2 18.2c1.1-2.4 3.2-3.7 5.8-3.7s4.7 1.3 5.8 3.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function IconChevron({ s = 16, open }: { s?: number; open: boolean }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}

/* ─── Logo tile ───────────────────────────────────────────────────── */
function LogoTile({ name, color, logoUrl, initials, size = 40 }: {
  name: string; color: string; logoUrl?: string | null; initials?: string; size?: number
}) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (logoUrl) {
    return (
      <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-white" style={{ width: size, height: size }}>
        <img src={logoUrl} alt={name} width={size} height={size} className="h-full w-full object-contain p-1" draggable={false}/> {/* eslint-disable-line @next/next/no-img-element */}
      </div>
    )
  }
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {abbr}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   COLLAPSIBLE CARD — generic wrapper used by Goals / To-do / Performance
   ════════════════════════════════════════════════════════════════════ */
function CollapsibleCard({ icon, title, meta, headerRight, defaultOpen = true, children }: {
  icon: ReactNode; title: string; meta?: string; headerRight?: ReactNode; defaultOpen?: boolean; children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white ${CARD}`}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button type="button" onClick={() => setOpen(o => !o)} className="flex flex-1 items-center gap-2.5 text-left">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">{icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-ink">{title}</span>
            {meta && <span className="block text-[11px] text-ink/40">{meta}</span>}
          </span>
        </button>
        <div className="flex flex-shrink-0 items-center gap-2">
          {open && headerRight}
          <button type="button" onClick={() => setOpen(o => !o)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 transition hover:bg-primary/[0.06] hover:text-primary">
            <IconChevron s={16} open={open}/>
          </button>
        </div>
      </div>
      {open && <div className="border-t border-primary/8 px-5 pb-5 pt-4">{children}</div>}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STAT CARD
   ════════════════════════════════════════════════════════════════════ */
function StatCard({ icon, label, value, delta, sublabel }: {
  icon: ReactNode; label: string; value: string
  delta?: { label: string; positive: boolean }; sublabel?: string
}) {
  return (
    <div className={`flex flex-col justify-between rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">{icon}</span>
        {delta && (
          <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${delta.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <TrendIcon up={delta.positive} s={10}/>{delta.label}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-[24px] font-black tracking-[-0.03em] text-ink">{value}</div>
        <div className="mt-0.5 text-[12.5px] font-medium text-ink/50">{label}</div>
        {sublabel && <div className="mt-0.5 text-[11px] font-medium text-ink/35">{sublabel}</div>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DISCOVER STRIP
   ════════════════════════════════════════════════════════════════════ */
function DiscoverStrip({ onClick, dealsCount }: { onClick: () => void; dealsCount: number }) {
  const [hovered, setHovered] = useState(false)
  const orbs = [
    { w: 180, h: 180, top: '-40%', left: '-3%',  op: 0.18, blur: 48 },
    { w: 140, h: 140, top: '10%',  left: '28%',  op: 0.12, blur: 40 },
    { w: 200, h: 200, top: '-50%', left: '58%',  op: 0.14, blur: 56 },
    { w: 120, h: 120, top: '20%',  left: '82%',  op: 0.16, blur: 36 },
  ]
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="relative w-full overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
      style={{
        background: 'linear-gradient(105deg, #8b31e8 0%, #a03be8 35%, #b44af0 65%, #ff33bc 100%)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered
          ? '0 16px 48px -12px rgba(139,49,232,0.55), 0 4px 16px -4px rgba(255,51,188,0.30)'
          : '0 8px 32px -8px rgba(139,49,232,0.40), 0 2px 8px -2px rgba(255,51,188,0.20)',
      }}>
      {orbs.map((o, i) => (
        <div key={i} aria-hidden="true" style={{ position: 'absolute', borderRadius: '50%', width: o.w, height: o.h, top: o.top, left: o.left, background: 'rgba(255,255,255,1)', opacity: o.op, filter: `blur(${o.blur}px)`, pointerEvents: 'none' }}/>
      ))}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}/>
      <div className="relative z-10 flex flex-col items-start justify-between gap-5 px-7 py-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm"
            style={{ transition: 'transform 0.2s ease', transform: hovered ? 'scale(1.08)' : 'scale(1)' }}>
            <SearchIcon s={26}/>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[20px] font-black leading-tight tracking-[-0.02em] text-white sm:text-[22px]">Discover brands</span>
              <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-white/80" style={{ animation: 'pulse-dot 2s ease-out infinite' }}/>
            </div>
            <p className="mt-1 max-w-[480px] text-[13.5px] leading-[1.6] text-white/75">
              Browse brands actively looking for creators. Filter by niche, deal type, and location — find your next partnership in minutes.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Paid partnerships', 'Affiliate deals', 'Barter gifting', 'Brand matching'].map((pill, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold text-white/90 backdrop-blur-sm">
                  <SparkleIcon s={10}/>{pill}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">Active deals</p>
            <p className="text-[22px] font-black leading-none text-white">{dealsCount}</p>
          </div>
          <button type="button"
            className="flex items-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-[14px] font-bold text-primary shadow-[0_4px_16px_rgba(10,6,18,0.18)]"
            style={{ transition: 'transform 0.18s ease', transform: hovered ? 'translateY(-1px)' : 'none' }}
            onClick={onClick}>
            Browse brands<ArrowRightIcon s={15}/>
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse-dot { 0%{box-shadow:0 0 0 0 rgba(255,255,255,0.6)} 70%{box-shadow:0 0 0 8px rgba(255,255,255,0)} 100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} }`}</style>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PHOTOS CARD — portfolio lite preview
   ════════════════════════════════════════════════════════════════════ */
function PhotosCard({ onManage }: { onManage: () => void }) {
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><GridIcon s={15}/></span>
          <div>
            <h3 className="text-[14px] font-bold text-ink">Your portfolio</h3>
            <p className="text-[11px] text-ink/40">{PORTFOLIO_LITE.length} photos · 2 videos · updated 2 days ago</p>
          </div>
        </div>
        <button onClick={onManage}
          className="hidden items-center gap-1.5 rounded-lg border border-primary/15 px-3.5 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.04] sm:flex">
          Manage<ArrowRightIcon s={12}/>
        </button>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PORTFOLIO_LITE.map(p => (
          <div key={p.id} className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: `linear-gradient(135deg, ${p.tone}, ${p.tone}cc)` }}>
            <GridIcon s={18}/>
          </div>
        ))}
        <button onClick={onManage}
          className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary/25 text-primary transition hover:border-primary/45 hover:bg-primary/[0.04]">
          <PlusIcon s={16}/>
          <span className="text-[9.5px] font-bold">Add</span>
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ARC GAUGE + INLINE-EDITABLE EARNINGS CARD
   ════════════════════════════════════════════════════════════════════ */
function ArcGauge({ earnedFrac, expectedFrac }: { earnedFrac: number; expectedFrac: number }) {
  const r = 84, cx = 100, cy = 104
  const circumference = Math.PI * r
  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const dash = (frac: number) => `${circumference * Math.min(1, Math.max(0, frac))} ${circumference}`
  return (
    <svg viewBox="0 0 200 120" className="w-full">
      <defs>
        <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B31E8"/><stop offset="100%" stopColor="#FF33BC"/>
        </linearGradient>
      </defs>
      <path d={trackPath} fill="none" stroke="#8B31E8" strokeOpacity="0.08" strokeWidth="14" strokeLinecap="round"/>
      <path d={trackPath} fill="none" stroke="#8B31E8" strokeOpacity="0.22" strokeWidth="14" strokeLinecap="round" strokeDasharray={dash(expectedFrac)}/>
      <path d={trackPath} fill="none" stroke="url(#arc-grad)" strokeWidth="14" strokeLinecap="round" strokeDasharray={dash(earnedFrac)}/>
    </svg>
  )
}

function InlineNumberEdit({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(value))
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])
  const commit = () => {
    const n = parseInt(draft.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(n) && n > 0) onCommit(n)
    setEditing(false)
  }
  if (editing) {
    return (
      <input ref={ref} value={draft}
        onChange={e => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false) } }}
        className="inline-block w-[74px] rounded-md border border-primary/30 bg-white px-1.5 py-0.5 text-center font-extrabold text-primary outline-none focus:shadow-[0_0_0_2px_rgba(139,49,232,0.15)]"/>
    )
  }
  return (
    <button type="button" onClick={() => { setDraft(String(value)); setEditing(true) }}
      className="font-extrabold text-primary underline decoration-primary/30 decoration-2 underline-offset-4 hover:decoration-primary">
      {euro(value)}
    </button>
  )
}

function EarningsArcCard({ monthlyGoal, avgCampaign, earned, expected, onGoalCommit, onAvgCommit }: {
  monthlyGoal: number; avgCampaign: number; earned: number; expected: number
  onGoalCommit: (v: number) => void; onAvgCommit: (v: number) => void
}) {
  const earnedFrac   = Math.min(1, earned / Math.max(monthlyGoal, 1))
  const expectedFrac = Math.min(1, (earned + expected) / Math.max(monthlyGoal, 1))
  const remaining    = Math.max(0, monthlyGoal - earned - expected)
  const dealsNeeded  = remaining > 0 ? Math.ceil(remaining / Math.max(avgCampaign, 1)) : 0
  const isGoalMet    = earned >= monthlyGoal

  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><TargetIcon s={18}/></span>
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-ink/50">This month's earnings</p>
          <p className="mt-0.5 text-[11.5px] text-ink/35">Confirmed income vs. what's still in the pipeline</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative w-full max-w-[280px] flex-shrink-0">
          <ArcGauge earnedFrac={earnedFrac} expectedFrac={expectedFrac}/>
          <div className="pointer-events-none absolute inset-x-0 top-[54%] flex flex-col items-center">
            <span className="text-[30px] font-black leading-none tracking-[-0.03em] text-ink">{euro(earned)}</span>
            <span className="mt-1 text-[11.5px] font-semibold text-ink/40">of {euro(monthlyGoal)} goal</span>
          </div>
        </div>
        <div className="mt-1 flex-1 sm:mt-0">
          <div className="flex flex-wrap gap-4 text-[12px]">
            <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${GRAD_BTN}`}/>Confirmed · {euro(earned)}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary/25"/>In progress · {euro(expected)}</span>
          </div>
          <p className="mt-3 text-[14.5px] leading-[1.8] text-ink/70">
            I want to earn <InlineNumberEdit value={monthlyGoal} onCommit={onGoalCommit}/> this month, averaging <InlineNumberEdit value={avgCampaign} onCommit={onAvgCommit}/> per deal
            {isGoalMet
              ? <> — goal reached, amazing work! 🎉</>
              : <> — that's <span className="font-extrabold text-ink">{dealsNeeded} more deal{dealsNeeded !== 1 ? 's' : ''}</span> needed to hit my goal.</>}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SUBSCRIPTION MODAL — "Nexus Pro" upsell
   ════════════════════════════════════════════════════════════════════ */
function SubscriptionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open) return null
  const price = billing === 'monthly' ? 19 : 15
  const perks = [
    'See exactly who viewed your profile — industry, role, and company',
    'Full analytics history, no 28-day limit',
    'Priority placement in brand search results',
    'Early access to high-budget campaign invites',
  ]
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
        <div className={`px-7 pb-6 pt-7 text-white ${GRAD_BTN}`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-black uppercase tracking-[0.08em]">
              <LockIcon s={10}/>Nexus Pro
            </span>
            <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/25"><XIcon s={13}/></button>
          </div>
          <h2 className="mt-4 text-[21px] font-black leading-tight tracking-[-0.02em]">See who's checking out your profile</h2>
          <p className="mt-1.5 text-[13px] text-white/80">Someone from the Design industry viewed you today — unlock their name & role.</p>
        </div>
        <div className="px-7 py-6">
          <div className="mb-5 flex rounded-xl border border-primary/12 bg-surface-sub p-1">
            {(['monthly', 'annual'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`flex-1 rounded-lg py-2 text-[12.5px] font-bold transition ${billing === b ? `${GRAD_BTN} text-white` : 'text-ink/50'}`}>
                {b === 'monthly' ? 'Monthly' : 'Annual · save 20%'}
              </button>
            ))}
          </div>
          <div className="mb-5 flex items-baseline gap-1.5">
            <span className="text-[32px] font-black tracking-[-0.03em] text-ink">€{price}</span>
            <span className="text-[13px] font-medium text-ink/40">/ month</span>
          </div>
          <ul className="mb-6 space-y-2.5">
            {perks.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-ink/70">
                <span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckCircleIcon s={15}/></span>{p}
              </li>
            ))}
          </ul>
          {!claimed ? (
            <button onClick={() => setClaimed(true)}
              className={`w-full rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>
              Upgrade to Pro
            </button>
          ) : (
            <div className="rounded-xl bg-emerald-50 px-4 py-3.5 text-center">
              <p className="text-[13px] font-bold text-emerald-700">Demo mode — billing isn't connected yet</p>
              <p className="mt-1 text-[11.5px] text-emerald-600/80">This is where checkout would open in the live product.</p>
            </div>
          )}
          <p className="mt-3 text-center text-[11px] text-ink/30">Cancel anytime · billed in EUR</p>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   NOTIFICATIONS — top scrollable card row
   ════════════════════════════════════════════════════════════════════ */
const NOTIFICATION_STYLE: Record<NotificationType, { icon: ReactNode; bg: string; text: string }> = {
  message:      { icon: <ChatBubbleIcon s={16}/>, bg: 'bg-primary/[0.08]', text: 'text-primary'     },
  profile_view: { icon: <EyeIcon s={16}/>,        bg: 'bg-sky-50',         text: 'text-sky-600'     },
  payment:      { icon: <EuroIcon s={16}/>,       bg: 'bg-emerald-50',     text: 'text-emerald-600' },
  deal:         { icon: <HandshakeIcon s={16}/>,  bg: 'bg-amber-50',       text: 'text-amber-600'   },
  insight:      { icon: <LightbulbIcon s={16}/>,  bg: 'bg-violet-50',      text: 'text-violet-600'  },
}

function NotificationCard({ n, onClick }: { n: NotificationItem; onClick: () => void }) {
  const style = NOTIFICATION_STYLE[n.type]
  return (
    <button onClick={onClick}
      className={`flex w-[240px] flex-shrink-0 flex-col rounded-2xl border bg-white p-4 text-left transition ${CARD} ${n.unread ? 'border-primary/20' : 'border-primary/10 opacity-70'}`}>
      <div className="flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>{style.icon}</span>
        {n.unread && <span className={`h-2 w-2 rounded-full ${GRAD_BTN}`}/>}
      </div>
      <p className="mt-2.5 line-clamp-3 text-[12.5px] leading-[1.45] text-ink/80">{n.title}</p>
      <p className="mt-2 text-[10.5px] font-medium text-ink/35">{n.time}</p>
    </button>
  )
}

function PremiumTeaserCard({ onUnlock }: { onUnlock: () => void }) {
  return (
    <button onClick={onUnlock}
      className={`relative flex w-[240px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 text-left transition hover:-translate-y-0.5 ${CARD}`}>
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><EyeIcon s={15}/></span>
        <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[9.5px] font-black text-white"><LockIcon s={9}/>PRO</span>
      </div>
      <p className="mt-2.5 text-[12.5px] font-semibold leading-[1.45] text-ink/85">
        Someone from the <span className="font-extrabold text-ink">Design</span> industry viewed your profile
      </p>
      <p className="mt-2 select-none text-[13px] font-bold leading-tight text-ink/40" style={{ filter: 'blur(4px)' }}>
        Elīna ██████ · Creative Director
      </p>
      <p className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-amber-600">
        Unlock with Nexus Pro<ArrowRightIcon s={11}/>
      </p>
    </button>
  )
}

function NotificationsTopCard({ items, onMarkRead, onMarkAllRead, onUnlockPremium }: {
  items: NotificationItem[]; onMarkRead: (id: string) => void; onMarkAllRead: () => void; onUnlockPremium: () => void
}) {
  const unread = items.filter(n => n.unread).length
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><BellIcon s={15}/></span>
          <div>
            <h3 className="text-[14px] font-bold text-ink">Notifications{unread > 0 && <span className="ml-1.5 text-primary">({unread})</span>}</h3>
            <p className="text-[11px] text-ink/40">Scroll for more · tap to open</p>
          </div>
        </div>
        {unread > 0 && <button onClick={onMarkAllRead} className="text-[12px] font-bold text-primary hover:underline">Mark all read</button>}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <PremiumTeaserCard onUnlock={onUnlockPremium}/>
        {items.map(n => <NotificationCard key={n.id} n={n} onClick={() => onMarkRead(n.id)}/>)}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INVITE DETAIL MODAL
   ════════════════════════════════════════════════════════════════════ */
const DEAL_TYPE_META: Record<DealType, { label: string; bg: string; text: string }> = {
  paid:      { label: 'Paid',      bg: 'bg-violet-50',  text: 'text-violet-700'  },
  affiliate: { label: 'Affiliate', bg: 'bg-sky-50',     text: 'text-sky-700'     },
  barter:    { label: 'Barter',    bg: 'bg-amber-50',   text: 'text-amber-700'   },
  hybrid:    { label: 'Hybrid',    bg: 'bg-pink-50',    text: 'text-pink-700'    },
}
const OBJECTIVE_COLOR: Record<string, string> = {
  Conversions: 'text-violet-600 bg-violet-50',
  Awareness:   'text-sky-600 bg-sky-50',
  UGC:         'text-pink-600 bg-pink-50',
  'UGC + Awareness': 'text-pink-600 bg-pink-50',
  Consideration: 'text-amber-600 bg-amber-50',
}

function InviteDetailModal({ invite, onClose, onAccept, onReject }: {
  invite: Invite
  onClose: () => void
  onAccept: (id: string, message: string) => void
  onReject: (id: string) => void
}) {
  const [step, setStep]       = useState<'detail' | 'accept' | 'rejected'>('detail')
  const [message, setMessage] = useState('')
  const dt  = DEAL_TYPE_META[invite.dealType]
  const obj = OBJECTIVE_COLOR[invite.objective] ?? 'text-ink/60 bg-surface-sub'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [onClose])

  const handleAccept = () => {
    if (step === 'detail') { setStep('accept'); return }
    onAccept(invite.id, message)
  }

  const handleReject = () => {
    setStep('rejected')
    setTimeout(() => { onReject(invite.id); onClose() }, 1200)
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[680px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(92vh, 780px)' }}>

        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <LogoTile name={invite.senderName} color={invite.senderColor} logoUrl={invite.senderLogoUrl} initials={invite.senderInitials} size={44}/>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold text-ink/40">{invite.senderName}</p>
                <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${invite.senderType === 'agency' ? 'bg-blue-50 text-blue-600' : 'bg-primary/[0.08] text-primary'}`}>
                  {invite.senderType === 'agency' ? <><UsersIcon s={10}/>Agency</> : <><BuildingIcon s={10}/>Brand</>}
                </span>
              </div>
              <h2 className="text-[17px] font-extrabold leading-tight tracking-[-0.01em] text-ink">{invite.campaignTitle}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${obj}`}>{invite.objective}</span>
                <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${dt.bg} ${dt.text}`}>{dt.label}</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-ink/40"><ClockIcon s={11}/>Received {invite.receivedAt}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10">
            <XIcon s={14}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Rate',      value: invite.rate },
              { label: 'Pieces',    value: `${invite.pieces} piece${invite.pieces !== 1 ? 's' : ''}` },
              { label: 'Timeline',  value: invite.timeline },
              { label: 'Platforms', value: invite.platforms.join(' · ') },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-surface-sub px-3.5 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/40">{item.label}</p>
                <p className="mt-0.5 text-[13px] font-bold text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          {invite.rateNote && (
            <p className="rounded-xl border border-primary/12 bg-primary/[0.04] px-4 py-3 text-[12.5px] text-ink/60">
              <span className="font-bold text-primary">Rate note: </span>{invite.rateNote}
            </p>
          )}

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40">Formats required</p>
            <div className="flex flex-wrap gap-2">
              {invite.formats.map(f => (
                <span key={f} className="rounded-lg border border-primary/15 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink/70">{f}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40">Campaign brief</p>
            <p className="rounded-xl bg-surface-sub px-4 py-3.5 text-[13.5px] leading-[1.65] text-ink/75">{invite.brief}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 px-4 py-3.5">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700">Do</p>
              <ul className="space-y-2">
                {invite.dos.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-emerald-800">
                    <span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={13}/></span>{d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-3.5">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-rose-700">Don't</p>
              <ul className="space-y-2">
                {invite.donts.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-rose-800">
                    <span className="mt-0.5 flex-shrink-0 text-rose-400"><XIcon s={13}/></span>{d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {step === 'accept' && (
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-5">
              <p className="mb-1 text-[13px] font-bold text-ink">Add a message to {invite.senderName}</p>
              <p className="mb-3 text-[12px] text-ink/50">Optional — introduce yourself or ask a quick question before the conversation thread opens.</p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Hi ${invite.senderName}, I'd love to work on this campaign…`}
                className="min-h-[100px] w-full resize-none rounded-xl border border-primary/15 bg-white px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30"
              />
            </div>
          )}

          {step === 'rejected' && (
            <div className="flex items-center justify-center rounded-2xl bg-rose-50 py-6">
              <div className="flex items-center gap-2 text-rose-600">
                <XIcon s={18}/>
                <span className="text-[14px] font-bold">Invite declined</span>
              </div>
            </div>
          )}
        </div>

        {step !== 'rejected' && (
          <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-primary/10 bg-surface-sub px-6 py-4">
            <button onClick={handleReject}
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-2.5 text-[13px] font-bold text-rose-600 transition hover:bg-rose-50">
              <XIcon s={13}/>Decline
            </button>
            <div className="flex items-center gap-2.5">
              {step === 'accept' && (
                <button onClick={() => setStep('detail')}
                  className="rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-semibold text-ink/60 transition hover:bg-surface-sub">
                  Back
                </button>
              )}
              <button onClick={handleAccept}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN}`}>
                {step === 'detail' ? <><CheckIcon s={14}/>Accept & respond</> : <><ChatBubbleIcon s={14}/>Send & open chat</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INVITES ROW — collapsible
   ════════════════════════════════════════════════════════════════════ */
function InviteCard({ invite, onClick }: { invite: Invite; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const dt  = DEAL_TYPE_META[invite.dealType]
  const obj = OBJECTIVE_COLOR[invite.objective] ?? 'text-ink/60 bg-surface-sub'
  const isResolved = invite.status !== 'pending'

  return (
    <button type="button" onClick={onClick} disabled={isResolved}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className={`flex w-[280px] flex-shrink-0 flex-col rounded-2xl border bg-white p-5 text-left transition ${CARD} ${isResolved ? 'cursor-default opacity-55' : 'border-primary/10'}`}
      style={{
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: (!isResolved && hovered) ? 'translateY(-3px)' : 'none',
        boxShadow: (!isResolved && hovered) ? '0 16px 40px -12px rgba(139,49,232,0.28)' : undefined,
      }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <LogoTile name={invite.senderName} color={invite.senderColor} logoUrl={invite.senderLogoUrl} initials={invite.senderInitials} size={36}/>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="block text-[11px] font-semibold text-ink/40">{invite.senderName}</span>
              {invite.senderType === 'agency' && (
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[9.5px] font-bold text-blue-600">Agency</span>
              )}
            </div>
            <span className="block line-clamp-2 text-[13px] font-extrabold leading-tight text-ink">{invite.campaignTitle}</span>
          </div>
        </div>
        {isResolved && (
          <span className={`flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${invite.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {invite.status === 'accepted' ? <><CheckIcon s={10}/>Accepted</> : <><XIcon s={10}/>Declined</>}
          </span>
        )}
        {!isResolved && (
          <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-primary mt-1.5" style={{ animation: 'pulse-badge 2s ease-out infinite' }}/>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-lg px-2.5 py-0.5 text-[10.5px] font-bold ${obj}`}>{invite.objective}</span>
        <span className={`rounded-lg px-2.5 py-0.5 text-[10.5px] font-bold ${dt.bg} ${dt.text}`}>{dt.label}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-primary/8 pt-4">
        <span className="text-[12.5px] font-bold text-ink">{invite.rate.split('+')[0]?.trim()}</span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-ink/40">
          <ClockIcon s={11}/>{invite.receivedAt}
        </span>
      </div>

      {!isResolved && (
        <div className={`mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-bold transition ${hovered ? `${GRAD_BTN} text-white` : 'bg-primary/[0.06] text-primary'}`}>
          View & respond<ArrowRightIcon s={11}/>
        </div>
      )}
      <style>{`@keyframes pulse-badge { 0%{box-shadow:0 0 0 0 rgba(139,49,232,0.5)} 70%{box-shadow:0 0 0 6px rgba(139,49,232,0)} 100%{box-shadow:0 0 0 0 rgba(139,49,232,0)} }`}</style>
    </button>
  )
}

function InvitesRow({ invites, onOpenInvite }: {
  invites: Invite[]
  onOpenInvite: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const pending = invites.filter(i => i.status === 'pending').length
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setOpen(o => !o)} className="flex flex-1 items-center gap-2.5 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><InboxIcon s={15}/></span>
          <div>
            <h3 className="flex items-center gap-2 text-[14px] font-bold text-ink">
              Opportunities & invites
              {pending > 0 && (
                <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white ${GRAD_BTN}`}>{pending}</span>
              )}
            </h3>
            <p className="text-[11px] text-ink/40">
              {pending > 0 ? `${pending} pending invite${pending !== 1 ? 's' : ''} — click to view full brief and respond` : 'No pending invites right now'}
            </p>
          </div>
        </button>
        <button type="button" onClick={() => setOpen(o => !o)}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink/40 transition hover:bg-primary/[0.06] hover:text-primary">
          <IconChevron s={16} open={open}/>
        </button>
      </div>
      {open && (
        invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary/20 py-10 text-center">
            <InboxIcon s={28}/>
            <p className="mt-3 text-[13px] font-semibold text-ink/45">No invites yet</p>
            <p className="mt-1 text-[12px] text-ink/35">Complete your profile to start receiving collaboration requests from brands.</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {invites.map(inv => (
              <InviteCard key={inv.id} invite={inv} onClick={() => onOpenInvite(inv.id)}/>
            ))}
          </div>
        )
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ACTIVE DEALS ROW — collapsible, range/mean earnings
   ════════════════════════════════════════════════════════════════════ */
const DEAL_STATUS_META: Record<DealStatus, { label: string; dot: string; bg: string; text: string }> = {
  active:      { label: 'Active',      dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  review:      { label: 'In review',   dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700'   },
  negotiation: { label: 'Negotiating', dot: 'bg-sky-400',     bg: 'bg-sky-50',     text: 'text-sky-700'     },
}

function DealCard({ deal, onClick, onFinalize }: { deal: ActiveDeal; onClick: () => void; onFinalize: (id: string) => void }) {
  const [hovered, setHovered] = useState(false)
  const st = DEAL_STATUS_META[deal.status]
  const objCls = OBJECTIVE_COLOR[deal.objective] ?? 'text-ink/60 bg-surface-sub'
  const contentProg = deal.piecesCommitted > 0 ? Math.round((deal.piecesApproved / deal.piecesCommitted) * 100) : 0
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={e => { if (e.key === 'Enter') onClick() }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className={`flex w-[290px] flex-shrink-0 cursor-pointer flex-col rounded-2xl border border-primary/10 bg-white p-5 text-left transition ${CARD}`}
      style={{
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 16px 40px -12px rgba(139,49,232,0.28)' : undefined,
      }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <LogoTile name={deal.brandName} color={deal.brandColor} logoUrl={deal.brandLogoUrl} initials={deal.brandInitials} size={36}/>
          <div className="min-w-0">
            <span className="block text-[11px] font-semibold text-ink/40">{deal.brandName}</span>
            <span className="block line-clamp-1 text-[13.5px] font-extrabold leading-tight text-ink">{deal.campaignTitle}</span>
          </div>
        </div>
        <span className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${st.bg} ${st.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>{st.label}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${objCls}`}>{deal.objective}</span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-ink/40"><ClockIcon s={11}/>Due {deal.endDate}</span>
      </div>
      <div className="mt-4 border-t border-primary/8 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-ink/45">Content progress</span>
          <span className="text-[11px] font-bold text-ink/60">{deal.piecesApproved}/{deal.piecesCommitted} approved</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-primary/[0.08]">
          <div className={`h-full rounded-full transition-all duration-700 ${contentProg === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : GRAD_BTN}`}
            style={{ width: `${contentProg}%` }}/>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[10.5px] text-ink/35">
          <span>{deal.piecesSubmitted} submitted</span><span>·</span><span>{deal.piecesCommitted - deal.piecesSubmitted} pending</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-primary/8 pt-3.5">
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink/50"><FileTextIcon s={13}/>Expected value</span>
        <span className="text-[13px] font-bold text-ink">{dealRange(deal)} <span className="font-medium text-ink/40">avg {euro(dealMean(deal))}</span></span>
      </div>
      {deal.status === 'negotiation' && (
        <button type="button" onClick={e => { e.stopPropagation(); onFinalize(deal.id) }}
          className={`mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11.5px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN}`}>
          <CheckIcon s={12}/>Mark terms finalized
        </button>
      )}
    </div>
  )
}

function ActiveDealsRow({ deals, onDealClick, onViewAll, onFinalize }: {
  deals: ActiveDeal[]; onDealClick: (id: string) => void; onViewAll: () => void; onFinalize: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setOpen(o => !o)} className="flex flex-1 items-center gap-2.5 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><HandshakeIcon s={14}/></span>
          <div>
            <h3 className="text-[14px] font-bold text-ink">Active deals</h3>
            <p className="text-[11px] text-ink/40">{deals.length} in progress — click any to open the campaign</p>
          </div>
        </button>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button onClick={onViewAll}
            className="hidden items-center gap-1.5 rounded-lg border border-primary/15 px-3.5 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.04] sm:flex">
            View all<ArrowRightIcon s={12}/>
          </button>
          <button type="button" onClick={() => setOpen(o => !o)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/40 transition hover:bg-primary/[0.06] hover:text-primary">
            <IconChevron s={16} open={open}/>
          </button>
        </div>
      </div>
      {open && (
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {deals.map(d => (
            <DealCard key={d.id} deal={d} onClick={() => onDealClick(d.id)} onFinalize={onFinalize}/>
          ))}
          <button type="button" onClick={() => onDealClick('discover')}
            className="flex w-[200px] flex-shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/20 bg-surface-sub/50 p-5 text-center transition hover:border-primary/40 hover:bg-primary/[0.03]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><SearchIcon s={16}/></span>
            <span className="text-[12.5px] font-bold leading-tight text-ink/50">Find a new deal</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ALL DEALS MODAL
   ════════════════════════════════════════════════════════════════════ */
function AllDealsModal({ open, deals, onClose, onSelect, onFinalize }: {
  open: boolean; deals: ActiveDeal[]; onClose: () => void; onSelect: (id: string) => void; onFinalize: (id: string) => void
}) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[760px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(90vh, 720px)' }}>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-ink">All deals</h2>
            <p className="mt-0.5 text-[12px] text-ink/45">{deals.length} active deals · click any to open the campaign</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-[15px] text-ink/50 transition hover:bg-ink/10">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {deals.map(d => {
              const st = DEAL_STATUS_META[d.status]
              const objCls = OBJECTIVE_COLOR[d.objective] ?? 'text-ink/60 bg-surface-sub'
              const pct = d.piecesCommitted > 0 ? Math.round((d.piecesApproved / d.piecesCommitted) * 100) : 0
              return (
                <div key={d.id} role="button" tabIndex={0}
                  onClick={() => { onClose(); onSelect(d.id) }}
                  onKeyDown={e => { if (e.key === 'Enter') { onClose(); onSelect(d.id) } }}
                  className={`group flex cursor-pointer flex-col rounded-2xl border border-primary/10 bg-white p-5 text-left transition hover:-translate-y-1 ${CARD}`}
                  style={{ transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}>
                  <div className="flex items-start gap-3">
                    <LogoTile name={d.brandName} color={d.brandColor} logoUrl={d.brandLogoUrl} initials={d.brandInitials} size={40}/>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-ink/40">{d.brandName}</p>
                      <p className="truncate text-[14px] font-extrabold leading-tight text-ink">{d.campaignTitle}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-0.5 text-[10.5px] font-bold ${objCls}`}>{d.objective}</span>
                        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${st.bg} ${st.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>{st.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-primary/8 pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-ink/45">Content progress</span>
                      <span className="text-[11px] font-bold text-ink/60">{d.piecesApproved}/{d.piecesCommitted} approved</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-primary/[0.08]">
                      <div className={`h-full rounded-full transition-all duration-700 ${pct === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : GRAD_BTN}`}
                        style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-primary/8 pt-3.5">
                    <span className="flex items-center gap-1 text-[11px] text-ink/40"><ClockIcon s={11}/>Due {d.endDate}</span>
                    <span className="text-[13px] font-bold text-ink">{dealRange(d)} <span className="font-medium text-ink/40">avg {euro(dealMean(d))}</span></span>
                  </div>
                  {d.status === 'negotiation' && (
                    <button type="button" onClick={e => { e.stopPropagation(); onFinalize(d.id) }}
                      className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-white py-2 text-[11.5px] font-bold text-primary transition hover:bg-primary/[0.05]">
                      <CheckIcon s={12}/>Mark terms finalized
                    </button>
                  )}
                  <div className={`mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold transition group-hover:opacity-100 ${GRAD_BTN} text-white opacity-0`}>
                    Open campaign<ArrowRightIcon s={12}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex-shrink-0 border-t border-primary/10 bg-surface-sub px-6 py-4">
          <button onClick={onClose}
            className="w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/60 transition hover:bg-surface-sub">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   GOALS SECTION
   ════════════════════════════════════════════════════════════════════ */
const GOAL_ICON: Record<GoalIcon, ReactNode> = {
  users: <UsersIcon s={15}/>, handshake: <HandshakeIcon s={15}/>, grid: <GridIcon s={15}/>, euro: <EuroIcon s={15}/>,
}

function GoalRow({ goal, onBump, onRemove }: { goal: GoalItem; onBump: (id: string) => void; onRemove: (id: string) => void }) {
  const pct  = Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100))
  const done = goal.current >= goal.target
  return (
    <div className="rounded-xl border border-primary/10 bg-surface-sub p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${done ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/[0.08] text-primary'}`}>
            {done ? <CheckIcon s={14}/> : GOAL_ICON[goal.icon]}
          </span>
          <div>
            <p className="text-[13px] font-bold text-ink">{goal.label}</p>
            <p className="text-[11px] font-medium text-ink/40">{goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {!done && (
            <button onClick={() => onBump(goal.id)}
              className="rounded-lg border border-primary/15 bg-white px-2.5 py-1 text-[11px] font-bold text-primary transition hover:bg-primary/[0.05]">
              + Update
            </button>
          )}
          <button onClick={() => onRemove(goal.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/30 transition hover:text-red-500">✕</button>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary/[0.08]">
        <div className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : GRAD_BTN}`} style={{ width: `${pct}%` }}/>
      </div>
    </div>
  )
}

function AddGoalForm({ onAdd }: { onAdd: (label: string, target: number) => void }) {
  const [open, setOpen]     = useState(false)
  const [label, setLabel]   = useState('')
  const [target, setTarget] = useState('')
  const submit = () => {
    const t = parseInt(target.replace(/[^0-9]/g, ''), 10)
    if (label.trim() && !isNaN(t) && t > 0) { onAdd(label.trim(), t); setLabel(''); setTarget(''); setOpen(false) }
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-white py-3 text-[12.5px] font-bold text-primary transition hover:border-primary/40 hover:bg-primary/[0.04]">
        <PlusIcon s={13}/>Add a goal
      </button>
    )
  }
  return (
    <div className="rounded-xl border border-primary/15 bg-white p-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_120px]">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Reach 100 brand messages"
          className="rounded-lg border border-primary/12 bg-surface-sub px-3 py-2 text-[13px] text-ink outline-none focus:border-primary"/>
        <input value={target} onChange={e => setTarget(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Target #"
          className="rounded-lg border border-primary/12 bg-surface-sub px-3 py-2 text-[13px] text-ink outline-none focus:border-primary"/>
      </div>
      <div className="mt-2.5 flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-ink/40 hover:text-ink/60">Cancel</button>
        <button onClick={submit} className={`rounded-lg ${GRAD_BTN} px-4 py-1.5 text-[12px] font-bold text-white`}>Add goal</button>
      </div>
    </div>
  )
}

function GoalsSection({ goals, onBump, onRemove, onAdd }: {
  goals: GoalItem[]; onBump: (id: string) => void; onRemove: (id: string) => void; onAdd: (label: string, target: number) => void
}) {
  const doneCount = goals.filter(g => g.current >= g.target).length
  return (
    <CollapsibleCard icon={<TargetIcon s={15}/>} title="Goals" meta={`${doneCount}/${goals.length} reached`} defaultOpen>
      <div className="space-y-3">
        {goals.map(g => <GoalRow key={g.id} goal={g} onBump={onBump} onRemove={onRemove}/>)}
        <AddGoalForm onAdd={onAdd}/>
      </div>
    </CollapsibleCard>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TO-DO SECTION
   ════════════════════════════════════════════════════════════════════ */
function TodoRow({ label, done, cta, onGo, onToggle }: {
  label: string; done: boolean; cta?: string; onGo?: () => void; onToggle?: () => void
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${done ? 'border-emerald-100 bg-emerald-50/50' : 'border-primary/10 bg-white'}`}>
      <button type="button" onClick={onToggle} disabled={!onToggle}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${done ? 'border-emerald-400 bg-emerald-400 text-white' : 'border-primary/25 bg-white'} ${!onToggle ? 'cursor-default' : ''}`}>
        {done && <CheckIcon s={11}/>}
      </button>
      <span className={`flex-1 text-[13px] font-medium leading-snug ${done ? 'text-ink/40 line-through' : 'text-ink/80'}`}>{label}</span>
      {onGo && !done && (
        <button onClick={onGo} className="flex-shrink-0 rounded-lg border border-primary/15 bg-white px-3 py-1.5 text-[11.5px] font-bold text-primary transition hover:bg-primary/[0.05]">
          {cta ?? 'Open'}
        </button>
      )}
    </div>
  )
}

function AddTodoForm({ onAdd }: { onAdd: (label: string) => void }) {
  const [open, setOpen]   = useState(false)
  const [label, setLabel] = useState('')
  const submit = () => { if (label.trim()) { onAdd(label.trim()); setLabel(''); setOpen(false) } }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-white py-3 text-[12.5px] font-bold text-primary transition hover:border-primary/40 hover:bg-primary/[0.04]">
        <PlusIcon s={13}/>Add a task
      </button>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white p-2.5">
      <input value={label} onChange={e => setLabel(e.target.value)} autoFocus
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false) }}
        placeholder="e.g. Update my media kit"
        className="flex-1 rounded-lg border border-primary/12 bg-surface-sub px-3 py-2 text-[13px] text-ink outline-none focus:border-primary"/>
      <button onClick={submit} className={`rounded-lg ${GRAD_BTN} px-3.5 py-2 text-[12px] font-bold text-white`}>Add</button>
      <button onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-[12px] font-bold text-ink/40 hover:text-ink/60">✕</button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   VIEWS BAR CHART — with save-event markers
   ════════════════════════════════════════════════════════════════════ */
function ViewsBarChart({ data, events }: { data: { label: string; views: number }[]; events: { id: string; label: string; idx: number }[] }) {
  const rawId = useId()
  const id    = rawId.replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 700, H = 220, PL = 8, PR = 8, PT = 26, PB = 24
  const iW = W - PL - PR, iH = H - PT - PB
  const n = data.length
  const maxV = Math.max(...data.map(d => d.views), 1)
  const barGap = iW / n * 0.3
  const barW = Math.max(2, iW / n - barGap)
  const xAt = (i: number) => PL + (i + 0.5) * (iW / n)
  const hAt = (v: number) => (v / (maxV * 1.15)) * iH
  const te = Math.max(1, Math.ceil(n / 6))
  const ticks = data.map((_, i) => i).filter(i => i % te === 0 || i === n - 1)
  const handleMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current; if (!svg) return
    const r = svg.getBoundingClientRect()
    const relX = (e.clientX - r.left) / r.width * W
    const idx = Math.floor((relX - PL) / (iW / n))
    setHover(Math.min(n - 1, Math.max(0, idx)))
  }
  const hp = hover !== null ? data[hover] : null
  return (
    <div className="relative h-full min-h-[180px] w-full flex-1">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full cursor-crosshair"
        onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B44AF0"/><stop offset="100%" stopColor="#8B31E8"/>
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(p => <line key={p} x1={PL} x2={W - PR} y1={PT + iH * p} y2={PT + iH * p} stroke="#8B31E8" strokeOpacity="0.06" strokeWidth="1"/>)}
        {data.map((d, i) => {
          const h = hAt(d.views), x = xAt(i) - barW / 2, y = PT + iH - h
          const active = hover === i
          return (
            <rect key={i} x={x} y={y} width={barW} height={h} rx={Math.min(barW * 0.28, 6)}
              fill={active ? '#FF33BC' : `url(#${id}-bar)`} opacity={hover === null || active ? 1 : 0.55}
              style={{ transition: 'opacity 0.15s' }}/>
          )
        })}
        {ticks.map(i => <text key={i} x={xAt(i)} y={H - 6} textAnchor="middle" fontSize="9.5" fontWeight={700} className="fill-ink/35">{data[i]?.label}</text>)}
        {events.map(ev => ev.idx >= 0 && ev.idx < n && (
          <g key={ev.id}>
            <title>{ev.label}</title>
            <line x1={xAt(ev.idx)} x2={xAt(ev.idx)} y1={PT - 14} y2={PT + iH} stroke="#F59E0B" strokeDasharray="2 3" strokeWidth="1.4" opacity="0.7"/>
            <circle cx={xAt(ev.idx)} cy={PT - 14} r="4" fill="#F59E0B"/>
          </g>
        ))}
      </svg>
      {hp && hover !== null && (
        <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-primary/10 bg-ink px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg"
          style={{ left: `${(xAt(hover) / W) * 100}%`, top: `${(hAt(hp.views) > 0 ? (PT + iH - hAt(hp.views)) : PT) / H * 100}%`, transform: 'translate(-50%, -135%)' }}>
          {hp.label} · {hp.views.toLocaleString()} unique visitors
        </div>
      )}
    </div>
  )
}

function RangeDropdown({ value, onChange }: { value: RangeOption; onChange: (v: RangeOption) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = RANGE_OPTIONS.find(r => r.value === value) ?? RANGE_OPTIONS[0]!
  useEffect(() => {
    const h1 = (e: globalThis.MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const h2 = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', h1); window.addEventListener('keydown', h2)
    return () => { document.removeEventListener('mousedown', h1); window.removeEventListener('keydown', h2) }
  }, [])
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-[12.5px] font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 ${open ? 'border-primary/30' : 'border-primary/12'}`}>
        <CalendarIcon s={13}/>{current.label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className={`text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className={`absolute right-0 top-[calc(100%+8px)] z-30 w-[170px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
          {RANGE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold transition hover:bg-primary/[0.06] ${value === opt.value ? 'bg-primary/[0.07] text-primary' : 'text-ink/75'}`}>
              {opt.label}{value === opt.value && <span className={`h-2 w-2 flex-shrink-0 rounded-full ${GRAD_BTN}`}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ViewsCard({ range, onRangeChange, events }: { range: RangeOption; onRangeChange: (r: RangeOption) => void; events: ChartEvent[] }) {
  const n = UNIQUE_VISITORS_DATA.length, slice = UNIQUE_VISITORS_DATA.slice(n - range)
  const total = slice.reduce((s, d) => s + d.views, 0)
  const sliceStart = n - range
  const visibleEvents = events.filter(e => e.dayIndex >= sliceStart).map(e => ({ id: e.id, label: e.label, idx: e.dayIndex - sliceStart }))
  let delta: { label: string; positive: boolean } | null = null
  if (range * 2 <= n) {
    const prev = UNIQUE_VISITORS_DATA.slice(n - range * 2, n - range), pt = prev.reduce((s, d) => s + d.views, 0)
    if (pt > 0) { const pct = ((total - pt) / pt) * 100; delta = { label: `${Math.abs(pct).toFixed(1)}%`, positive: pct >= 0 } }
  }
  return (
    <div className={`flex h-full w-full flex-col rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/40">Unique profile visitors — growth</p>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="text-[32px] font-black tracking-[-0.03em] text-ink">{total.toLocaleString()}</span>
            {delta && <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold ${delta.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><TrendIcon up={delta.positive} s={11}/>{delta.label}</span>}
          </div>
          <p className="mt-1 text-[12px] font-medium text-ink/40">{delta ? `vs previous ${range} days` : `Last ${range} days`} · amber markers = your saved changes</p>
        </div>
        <RangeDropdown value={range} onChange={onRangeChange}/>
      </div>
      <div className="mt-6 flex flex-1 flex-col min-h-0"><ViewsBarChart data={slice} events={visibleEvents}/></div>
    </div>
  )
}

function ChartEventsPanel({ events }: { events: ChartEvent[] }) {
  const recent = [...events].slice(-6).reverse()
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
      <div className="flex-shrink-0 border-b border-primary/8 px-5 py-4">
        <h3 className="text-[14.5px] font-bold text-ink">Saved changes</h3>
        <p className="mt-0.5 text-[11.5px] text-ink/40">Major updates are logged here and marked on the chart</p>
      </div>
      <div className="max-h-[420px] flex-1 space-y-1 overflow-y-auto p-3">
        {recent.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <SparkleIcon s={20}/>
            <p className="mt-2 text-[12.5px] font-semibold text-ink/40">No changes yet</p>
            <p className="mt-1 text-[11.5px] text-ink/30">Edit your goal or accept an invite to see it here.</p>
          </div>
        ) : recent.map(ev => (
          <div key={ev.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-primary/[0.03]">
            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400"/>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] leading-[1.4] text-ink/80">{ev.label}</p>
              <p className="mt-0.5 text-[10.5px] font-medium text-ink/35">Marked on chart · today</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function CreatorDashboardPage() {
  const router = useRouter()

  const [range,          setRange]          = useState<RangeOption>(7)
  const [notifications,  setNotifications]  = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [invites,        setInvites]        = useState<Invite[]>(INITIAL_INVITES)
  const [deals,          setDeals]          = useState<ActiveDeal[]>(INITIAL_ACTIVE_DEALS)
  const [goals,          setGoals]          = useState<GoalItem[]>(INITIAL_GOALS)
  const [manualTodos,    setManualTodos]    = useState<ManualTodo[]>(INITIAL_MANUAL_TODOS)
  const [openInviteId,   setOpenInviteId]   = useState<string | null>(null)
  const [allDealsOpen,   setAllDealsOpen]   = useState(false)
  const [subOpen,        setSubOpen]        = useState(false)

  const [monthlyGoal, setMonthlyGoal] = useState(2000)
  const [avgCampaign, setAvgCampaign] = useState(350)

  const [chartEvents, setChartEvents] = useState<ChartEvent[]>([])
  const [toast,       setToast]       = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const logChartEvent = (label: string) => {
    setChartEvents(prev => [...prev, { id: newId('evt'), label, dayIndex: UNIQUE_VISITORS_DATA.length - 1 }])
    setToast(label)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  const openInvite     = invites.find(i => i.id === openInviteId) ?? null
  const unreadNotifs   = notifications.filter(n => n.unread).length
  const pendingInvites = invites.filter(i => i.status === 'pending').length
  const negotiationDeal = deals.find(d => d.status === 'negotiation')
  const expectedFromDeals = deals.filter(d => d.status !== 'negotiation').reduce((s, d) => s + dealMean(d), 0)

  const markNotifRead    = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  const markAllNotifRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))

  const handleAcceptInvite = (id: string, _message: string) => {
    const inv = invites.find(i => i.id === id)
    setInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'accepted' } : i))
    setOpenInviteId(null)
    if (inv) logChartEvent(`Accepted ${inv.senderName} invite`)
    router.push('/creator-message')
  }
  const handleRejectInvite = (id: string) => {
    const inv = invites.find(i => i.id === id)
    setInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected' } : i))
    setOpenInviteId(null)
    if (inv) logChartEvent(`Declined ${inv.senderName} invite`)
  }

  const finalizeDeal = (id: string) => {
    const d = deals.find(x => x.id === id)
    setDeals(prev => prev.map(x => x.id === id ? { ...x, status: 'active' } : x))
    if (d) logChartEvent(`Finalized ${d.brandName} deal terms`)
  }

  const bumpGoal = (id: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g
      const step = BUMP_STEP[g.unit] ?? 1
      const nextCurrent = Math.min(g.target, g.current + step)
      if (nextCurrent >= g.target && g.current < g.target) logChartEvent(`Reached goal: ${g.label}`)
      return { ...g, current: nextCurrent }
    }))
  }
  const removeGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id))
  const addGoal = (label: string, target: number) => {
    setGoals(prev => [...prev, { id: newId('goal'), label, current: 0, target, unit: 'goal', icon: 'grid' }])
    logChartEvent(`Added goal: ${label}`)
  }

  const toggleManualTodo = (id: string) => setManualTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const addManualTodo = (label: string) => setManualTodos(prev => [...prev, { id: newId('todo'), label, done: false }])

  const handleGoalCommit = (v: number) => { setMonthlyGoal(v); logChartEvent(`Updated monthly goal to ${euro(v)}`) }
  const handleAvgCommit  = (v: number) => { setAvgCampaign(v); logChartEvent(`Updated avg. deal estimate to ${euro(v)}`) }

  const goToMessages  = () => router.push('/creator-message')
  const goToDiscover  = () => router.push('/creator-search')
  const goToDeal      = (id: string) => id === 'discover' ? goToDiscover() : router.push(`/creator-deal?id=${id}`)
  const goToStudio    = () => router.push('/creator-studio')
  const goToProfile   = () => router.push('/display')

  /* Derived stat values */
  const rangeSlice     = UNIQUE_VISITORS_DATA.slice(UNIQUE_VISITORS_DATA.length - range)
  const uniqueVisitors = rangeSlice.reduce((s, d) => s + d.views, 0)
  const profileClicks  = Math.round(uniqueVisitors * 0.31)
  const activeDeals    = deals.length
  const savedByBrands  = 24

  /* Smart to-dos — recomputed live from invites/deals state */
  const smartTodos: { id: string; label: string; done: boolean; cta?: string; onGo?: () => void }[] = [
    {
      id: 'smart-invites',
      label: pendingInvites > 0 ? `Reply to ${pendingInvites} pending invite${pendingInvites !== 1 ? 's' : ''}` : 'All invites answered',
      done: pendingInvites === 0,
      cta: 'Review',
      onGo: pendingInvites > 0 ? () => { const first = invites.find(i => i.status === 'pending'); if (first) setOpenInviteId(first.id) } : undefined,
    },
    {
      id: 'smart-negotiation',
      label: negotiationDeal ? `Finish negotiating terms with ${negotiationDeal.brandName}` : 'No deals in negotiation',
      done: !negotiationDeal,
      cta: 'Review deal',
      onGo: negotiationDeal ? () => setAllDealsOpen(true) : undefined,
    },
  ]

  const doneManualCount = manualTodos.filter(t => t.done).length
  const doneSmartCount  = smartTodos.filter(t => t.done).length

  const NAV_LEFT = [
    { label: 'Dashboard',        active: true,  action: () => {} },
    { label: 'Discover brands',  active: false, action: goToDiscover },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {openInvite && (
        <InviteDetailModal
          invite={openInvite}
          onClose={() => setOpenInviteId(null)}
          onAccept={handleAcceptInvite}
          onReject={handleRejectInvite}
        />
      )}

      <AllDealsModal
        open={allDealsOpen}
        deals={deals}
        onClose={() => setAllDealsOpen(false)}
        onSelect={goToDeal}
        onFinalize={finalizeDeal}
      />

      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)}/>

      {toast && (
        <div className="fixed right-5 top-5 z-[750] flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircleIcon s={15}/></span>
          <div>
            <p className="text-[12.5px] font-bold text-emerald-700">Saved</p>
            <p className="text-[11.5px] text-ink/50">{toast}</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>

            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>

            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>

            <div className="relative z-10 flex items-center gap-1.5">
              <button onClick={goToMessages} title="Messages" aria-label="Messages"
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
                {unreadNotifs > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>
                    {unreadNotifs}
                  </span>
                )}
              </button>
              <button onClick={goToProfile} title="My Profile" aria-label="My Profile"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <UserCircleIcon s={19}/>
              </button>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-6 py-8">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[clamp(22px,3.2vw,30px)] font-black tracking-[-0.03em] text-ink">
              Welcome back, {CREATOR.firstName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1 text-[14px] text-ink/55">Here's how your profile and partnerships have been performing.</p>
          </div>
          <a href="/display"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30">
            View public profile
          </a>
        </div>

        {/* Notifications — top, scrollable */}
        <div className="mt-6">
          <NotificationsTopCard items={notifications} onMarkRead={markNotifRead} onMarkAllRead={markAllNotifRead} onUnlockPremium={() => setSubOpen(true)}/>
        </div>

        {/* Portfolio lite */}
        <div className="mt-4">
          <PhotosCard onManage={goToStudio}/>
        </div>

        {/* Earnings arc */}
        <div className="mt-4">
          <EarningsArcCard
            monthlyGoal={monthlyGoal} avgCampaign={avgCampaign}
            earned={EARNED_THIS_MONTH} expected={expectedFromDeals}
            onGoalCommit={handleGoalCommit} onAvgCommit={handleAvgCommit}
          />
        </div>

        {/* Discover strip */}
        <div className="mt-6">
          <DiscoverStrip onClick={goToDiscover} dealsCount={activeDeals}/>
        </div>

        {/* Opportunities & invites */}
        <div className="mt-4">
          <InvitesRow invites={invites} onOpenInvite={id => setOpenInviteId(id)}/>
        </div>

        {/* Active deals */}
        <div className="mt-4">
          <ActiveDealsRow deals={deals} onDealClick={goToDeal} onViewAll={() => setAllDealsOpen(true)} onFinalize={finalizeDeal}/>
        </div>

        {/* Goals */}
        <div className="mt-4">
          <GoalsSection goals={goals} onBump={bumpGoal} onRemove={removeGoal} onAdd={addGoal}/>
        </div>

        {/* To-do */}
        <div className="mt-4">
          <CollapsibleCard icon={<CheckCircleIcon s={15}/>} title="To-do" meta={`${doneSmartCount + doneManualCount}/${smartTodos.length + manualTodos.length} done`} defaultOpen>
            <div className="space-y-2.5">
              {smartTodos.map(t => <TodoRow key={t.id} label={t.label} done={t.done} cta={t.cta} onGo={t.onGo}/>)}
              {manualTodos.map(t => (
                <TodoRow key={t.id} label={t.label} done={t.done} cta={t.cta}
                  onGo={t.href ? () => router.push(t.href!) : undefined}
                  onToggle={() => toggleManualTodo(t.id)}/>
              ))}
              <AddTodoForm onAdd={addManualTodo}/>
            </div>
          </CollapsibleCard>
        </div>

        {/* Performance — stat cards + growth chart + saved-changes log */}
        <div className="mt-4">
          <CollapsibleCard icon={<TrendIcon up s={15}/>} title="Performance" meta="Views, clicks, and deal activity" defaultOpen>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={<EyeIcon s={18}/>}            label="Unique visitors"  value={uniqueVisitors.toLocaleString()} sublabel="Each person counted once"          delta={{ label: '8.6%',               positive: true }}/>
              <StatCard icon={<CursorClickIcon s={18}/>}    label="Profile clicks"   value={profileClicks.toLocaleString()}  sublabel="Brands clicking into your profile"  delta={{ label: '+12% vs prev period', positive: true }}/>
              <StatCard icon={<HandshakeIcon s={18}/>}      label="Active deals"     value={String(activeDeals)}             sublabel="Currently in progress"              delta={{ label: '+2 this month',       positive: true }}/>
              <StatCard icon={<BookmarkIcon s={18} filled/>} label="Saved by brands" value={String(savedByBrands)}           sublabel="Brands shortlisting you"            delta={{ label: '+5 this week',        positive: true }}/>
            </div>
            <div className="mt-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
              <div className="flex h-full lg:col-span-2">
                <ViewsCard range={range} onRangeChange={setRange} events={chartEvents}/>
              </div>
              <ChartEventsPanel events={chartEvents}/>
            </div>
          </CollapsibleCard>
        </div>

      </main>
    </div>
  )
}