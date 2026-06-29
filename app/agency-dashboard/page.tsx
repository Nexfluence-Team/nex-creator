'use client'

import { useState, useEffect, useRef, useId, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Agency Dashboard — app/dashboard/agency/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   The agency command centre. Agencies manage campaigns and profiles
   on behalf of contracted brands, and represent a roster of creators.

   Two sides of agency work:
   A) BRAND MANAGEMENT — brands who hired the agency to run their
      Nexfluence presence. Agency can access their brand dashboard,
      create campaigns for them, and manages contracts/payments.
   B) CREATOR ROSTER — creators the agency represents. Agency can
      add them to campaigns, invite new creators to the platform.

   Payment model:
   - Recurring monthly retainer per managed brand
   - One-time campaign delivery fee per campaign
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const AGENCY = { name: 'Baltic Creators Agency', slug: 'baltic-creators-agency', id: 'ag1' }
const UNREAD_MESSAGE_COUNT = 5

/* ─── Range ──────────────────────────────────────────────────────── */
type RangeOption = 7 | 14 | 28
const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: 'Last 7 days',  value: 7  },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 28 days', value: 28 },
]

/* ─── Profile views data ─────────────────────────────────────────── */
const VIEWS_DATA: { label: string; views: number }[] = [
  { label: 'May 23', views: 180 }, { label: 'May 24', views: 210 }, { label: 'May 25', views: 195 },
  { label: 'May 26', views: 280 }, { label: 'May 27', views: 340 }, { label: 'May 28', views: 310 },
  { label: 'May 29', views: 260 }, { label: 'May 30', views: 295 }, { label: 'May 31', views: 320 },
  { label: 'Jun 1',  views: 270 }, { label: 'Jun 2',  views: 350 }, { label: 'Jun 3',  views: 390 },
  { label: 'Jun 4',  views: 420 }, { label: 'Jun 5',  views: 400 }, { label: 'Jun 6',  views: 455 },
  { label: 'Jun 7',  views: 510 }, { label: 'Jun 8',  views: 490 }, { label: 'Jun 9',  views: 460 },
  { label: 'Jun 10', views: 530 }, { label: 'Jun 11', views: 580 }, { label: 'Jun 12', views: 550 },
  { label: 'Jun 13', views: 600 }, { label: 'Jun 14', views: 575 }, { label: 'Jun 15', views: 640 },
  { label: 'Jun 16', views: 610 }, { label: 'Jun 17', views: 670 }, { label: 'Jun 18', views: 700 },
  { label: 'Jun 19', views: 745 },
]

/* ─── Notifications ──────────────────────────────────────────────── */
type NotificationType = 'brand' | 'creator' | 'payment' | 'campaign' | 'contract'
type NotificationItem = { id: string; type: NotificationType; title: string; time: string; unread: boolean }

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', type: 'campaign',  title: "Kinetics approved brief for 'Electrolyte Hot Yoga'",    time: '2h ago',  unread: true  },
  { id: 'n2', type: 'creator',   title: 'Amelia Roze accepted your roster invitation',             time: '5h ago',  unread: true  },
  { id: 'n3', type: 'payment',   title: 'Retainer received — €1,200 from Kinetics',               time: '1d ago',  unread: false },
  { id: 'n4', type: 'contract',  title: 'Lumora Skincare requested a contract revision',           time: '2d ago',  unread: true  },
  { id: 'n5', type: 'brand',     title: 'Forma Fit signed the management agreement',               time: '4d ago',  unread: false },
  { id: 'n6', type: 'campaign',  title: 'Markus Tamm submitted content for review — Forma Fit',   time: '5d ago',  unread: false },
]

/* ─── Managed brands ─────────────────────────────────────────────── */
type ContractStatus = 'active' | 'negotiating' | 'pending' | 'paused'
type ManagedBrand = {
  id: string; name: string; industry: string; location: string
  color: string; initials: string; logoUrl: string | null
  monthlyRetainer: number; contractStatus: ContractStatus
  activeCampaigns: number; totalCampaigns: number
  managedSince: string
}

const MANAGED_BRANDS: ManagedBrand[] = [
  {
    id: 'mb1', name: 'Kinetics', industry: 'Sports nutrition', location: 'Riga, Latvia',
    color: '#8B31E8', initials: 'KI', logoUrl: null,
    monthlyRetainer: 1200, contractStatus: 'active',
    activeCampaigns: 3, totalCampaigns: 8, managedSince: 'Jan 2026',
  },
  {
    id: 'mb2', name: 'Lumora Skincare', industry: 'Beauty', location: 'Tallinn, Estonia',
    color: '#059669', initials: 'LS', logoUrl: null,
    monthlyRetainer: 900, contractStatus: 'active',
    activeCampaigns: 2, totalCampaigns: 5, managedSince: 'Mar 2026',
  },
  {
    id: 'mb3', name: 'Forma Fit', industry: 'Fitness apparel', location: 'Vilnius, Lithuania',
    color: '#2563EB', initials: 'FF', logoUrl: null,
    monthlyRetainer: 800, contractStatus: 'negotiating',
    activeCampaigns: 1, totalCampaigns: 2, managedSince: 'Jun 2026',
  },
]

/* ─── Managed creators ───────────────────────────────────────────── */
type ManagedCreator = {
  id: string; name: string; handle: string; niche: string
  platform: string; followers: string; color: string; initials: string; avatarUrl: string | null
  exclusive: boolean; activeDeals: number
}

const MANAGED_CREATORS: ManagedCreator[] = [
  { id: 'mc1', name: 'Amelia Roze',        handle: '@amelia.roze',   niche: 'Fitness / Lifestyle', platform: 'Instagram', followers: '142K', color: '#8B31E8', initials: 'AR', avatarUrl: null, exclusive: true,  activeDeals: 2 },
  { id: 'mc2', name: 'Markus Tamm',        handle: '@markustamm',    niche: 'Sports',              platform: 'TikTok',    followers: '96K',  color: '#2563EB', initials: 'MT', avatarUrl: null, exclusive: false, activeDeals: 1 },
  { id: 'mc3', name: 'Sandra Liepa',       handle: '@sandra.liepa',  niche: 'Beauty',              platform: 'Instagram', followers: '78K',  color: '#DB2777', initials: 'SL', avatarUrl: null, exclusive: true,  activeDeals: 3 },
  { id: 'mc4', name: 'Rūta Vaitkutė',      handle: '@ruta.glow',     niche: 'Wellness',            platform: 'Instagram', followers: '65K',  color: '#C026D3', initials: 'RV', avatarUrl: null, exclusive: false, activeDeals: 1 },
  { id: 'mc5', name: 'Jonas Petrauskas',   handle: '@jonaspt',       niche: 'Tech / Lifestyle',    platform: 'TikTok',    followers: '52K',  color: '#0891B2', initials: 'JP', avatarUrl: null, exclusive: false, activeDeals: 0 },
]

/* ─── Cross-brand campaigns ──────────────────────────────────────── */
type CampaignStatus = 'active' | 'review' | 'draft' | 'paused'
type ManagedCampaign = {
  id: string; title: string; brandId: string; brandName: string; brandColor: string
  objective: string; status: CampaignStatus
  creators: number; budget: string; endDate: string
  metrics: { views: string; engagement: string; conversions: string }
}

const MANAGED_CAMPAIGNS: ManagedCampaign[] = [
  {
    id: 'cp1', title: 'Vitamin-C Recovery Stack',
    brandId: 'mb1', brandName: 'Kinetics', brandColor: '#8B31E8',
    objective: 'Conversions', status: 'active',
    creators: 5, budget: '€1,900', endDate: 'Jun 30',
    metrics: { views: '1.2M', engagement: '8.4%', conversions: '5.8K' },
  },
  {
    id: 'cp2', title: 'Morning Ritual',
    brandId: 'mb2', brandName: 'Lumora Skincare', brandColor: '#059669',
    objective: 'Awareness', status: 'review',
    creators: 3, budget: '€750', endDate: 'Jul 5',
    metrics: { views: '420K', engagement: '7.1%', conversions: '1.2K' },
  },
  {
    id: 'cp3', title: 'Training Block Q3',
    brandId: 'mb3', brandName: 'Forma Fit', brandColor: '#2563EB',
    objective: 'UGC', status: 'active',
    creators: 2, budget: '€700', endDate: 'Jul 20',
    metrics: { views: '280K', engagement: '5.9%', conversions: '880' },
  },
  {
    id: 'cp4', title: 'Electrolyte Hot Yoga',
    brandId: 'mb1', brandName: 'Kinetics', brandColor: '#8B31E8',
    objective: 'Consideration', status: 'draft',
    creators: 1, budget: '€350', endDate: 'Aug 1',
    metrics: { views: '—', engagement: '—', conversions: '—' },
  },
]

/* ─── Revenue ────────────────────────────────────────────────────── */
const MONTHLY_RETAINERS_ACTIVE = 2100  /* Kinetics + Lumora only (Forma Fit negotiating) */
const CAMPAIGN_FEES_THIS_MONTH = 480
const TOTAL_THIS_MONTH         = MONTHLY_RETAINERS_ACTIVE + CAMPAIGN_FEES_THIS_MONTH
const REVENUE_GOAL_OPTIONS     = [3000, 4000, 5000, 6000, 8000, 10000]

/* ════════════════════════════════════════════════════════════════════
   ICONS — inline SVG only
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function CalendarIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function ChatBubbleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function BellIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EuroIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TrendIcon({ up, s = 11 }: { up: boolean; s?: number }) {
  return up
    ? <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 17l6-6 4 4 6-8M14 7h6v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 7l6 6 4-4 6 8M14 17h6v-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BuildingIcon({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function UsersIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function PlayIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
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
function PlusIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function ExternalLinkIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function CheckIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TargetIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function LightbulbIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21h6M12 3a7 7 0 014.9 11.9c-.6.6-1.1 1.3-1.4 2.1H8.5c-.3-.8-.8-1.5-1.4-2.1A7 7 0 0112 3z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function BriefcaseIcon({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 12v3M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function LockOpenIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 019.9-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function ShieldCheckIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EditIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function RepeatIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SendIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SearchIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function HashIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   LOGO TILE — reused for brands and creators
   ════════════════════════════════════════════════════════════════════ */
function LogoTile({ name, color, logoUrl, initials, size = 40 }: {
  name: string; color: string; logoUrl?: string | null; initials?: string; size?: number
}) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return logoUrl
    ? <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-white" style={{ width: size, height: size }}>
        <img src={logoUrl} alt={name} width={size} height={size} className="h-full w-full object-contain p-1" draggable={false}/> {/* eslint-disable-line */}
      </div>
    : <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white"
        style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
        {abbr}
      </div>
}

/* ════════════════════════════════════════════════════════════════════
   STAT CARD — identical to brand + creator dashboards
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
   AGENCY ACTION STRIP — gradient banner at the top
   Same visual language as brand's CampaignStrip / creator's DiscoverStrip
   ════════════════════════════════════════════════════════════════════ */
function AgencyActionStrip({ onNewCampaign, onInviteBrand, onAddCreator }: {
  onNewCampaign: () => void; onInviteBrand: () => void; onAddCreator: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const orbs = [
    { w: 180, h: 180, top: '-40%', left: '-3%',  op: 0.18, blur: 48 },
    { w: 140, h: 140, top: '10%',  left: '28%',  op: 0.12, blur: 40 },
    { w: 200, h: 200, top: '-50%', left: '58%',  op: 0.14, blur: 56 },
    { w: 120, h: 120, top: '20%',  left: '82%',  op: 0.16, blur: 36 },
  ]
  const totalRetainer = MANAGED_BRANDS.filter(b => b.contractStatus === 'active').reduce((s, b) => s + b.monthlyRetainer, 0)
  return (
    <div className="relative w-full overflow-hidden rounded-2xl"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(105deg, #8b31e8 0%, #a03be8 35%, #b44af0 65%, #ff33bc 100%)',
        transition: 'box-shadow 0.2s ease',
        boxShadow: hovered
          ? '0 16px 48px -12px rgba(139,49,232,0.55), 0 4px 16px -4px rgba(255,51,188,0.30)'
          : '0 8px 32px -8px rgba(139,49,232,0.40), 0 2px 8px -2px rgba(255,51,188,0.20)',
      }}>
      {orbs.map((o, i) => (
        <div key={i} aria-hidden="true" style={{ position: 'absolute', borderRadius: '50%', width: o.w, height: o.h, top: o.top, left: o.left, background: 'rgba(255,255,255,1)', opacity: o.op, filter: `blur(${o.blur}px)`, pointerEvents: 'none' }}/>
      ))}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`, backgroundSize: '32px 32px' }}/>
      <div className="relative z-10 px-7 py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: title + context */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
                <BriefcaseIcon s={22}/>
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[20px] font-black leading-tight tracking-[-0.02em] text-white sm:text-[22px]">Agency command centre</span>
                  <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-white/80" style={{ animation: 'pulse-dot 2s ease-out infinite' }}/>
                </div>
                <p className="mt-0.5 text-[13px] text-white/70">
                  Managing {MANAGED_BRANDS.filter(b => b.contractStatus === 'active').length} brands · {MANAGED_CREATORS.length} creators on roster · €{totalRetainer.toLocaleString()}/mo recurring
                </p>
              </div>
            </div>
            {/* Quick-action pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: 'New campaign',    action: onNewCampaign, primary: true },
                { label: 'Invite a brand',  action: onInviteBrand, primary: false },
                { label: 'Add to roster',   action: onAddCreator,  primary: false },
              ].map(btn => (
                <button key={btn.label} type="button" onClick={btn.action}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold transition hover:-translate-y-0.5 ${btn.primary ? 'bg-white text-primary shadow-[0_4px_16px_rgba(10,6,18,0.18)]' : 'bg-white/15 text-white backdrop-blur-sm hover:bg-white/25'}`}>
                  {btn.primary ? <><PlayIcon s={12}/>New campaign</> : btn.label === 'Invite a brand' ? <><BuildingIcon s={14}/>{btn.label}</> : <><UsersIcon s={14}/>{btn.label}</>}
                </button>
              ))}
            </div>
          </div>
          {/* Right: key stats */}
          <div className="flex flex-shrink-0 gap-4 sm:flex-col sm:text-right">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">Active campaigns</p>
              <p className="text-[26px] font-black leading-none text-white">{MANAGED_CAMPAIGNS.filter(c => c.status === 'active').length}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">This month</p>
              <p className="text-[26px] font-black leading-none text-white">€{TOTAL_THIS_MONTH.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse-dot { 0%{box-shadow:0 0 0 0 rgba(255,255,255,0.6)} 70%{box-shadow:0 0 0 8px rgba(255,255,255,0)} 100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} }`}</style>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CONTRACT STATUS CONFIG
   ════════════════════════════════════════════════════════════════════ */
const CONTRACT_STATUS_META: Record<ContractStatus, { label: string; dot: string; bg: string; text: string }> = {
  active:       { label: 'Active',        dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  negotiating:  { label: 'Negotiating',   dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700'   },
  pending:      { label: 'Pending sign',  dot: 'bg-sky-400',     bg: 'bg-sky-50',     text: 'text-sky-700'     },
  paused:       { label: 'Paused',        dot: 'bg-ink/30',      bg: 'bg-surface-sub', text: 'text-ink/50'     },
}
const CAMPAIGN_STATUS_META: Record<CampaignStatus, { label: string; dot: string; bg: string; text: string }> = {
  active:  { label: 'Active',     dot: 'bg-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  review:  { label: 'In review',  dot: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
  draft:   { label: 'Draft',      dot: 'bg-ink/30',      bg: 'bg-surface-sub', text: 'text-ink/50'      },
  paused:  { label: 'Paused',     dot: 'bg-rose-400',    bg: 'bg-rose-50',     text: 'text-rose-600'    },
}
const OBJECTIVE_COLOR: Record<string, string> = {
  Conversions:   'text-violet-600 bg-violet-50',
  Awareness:     'text-sky-600 bg-sky-50',
  Consideration: 'text-pink-600 bg-pink-50',
  UGC:           'text-teal-600 bg-teal-50',
}

/* ════════════════════════════════════════════════════════════════════
   MANAGED BRANDS ROW
   ════════════════════════════════════════════════════════════════════ */
function BrandManagementCard({ brand, onClick, onDashboardAccess }: {
  brand: ManagedBrand
  onClick: () => void
  onDashboardAccess: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const st = CONTRACT_STATUS_META[brand.contractStatus]
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className={`flex w-[300px] flex-shrink-0 flex-col rounded-2xl border border-primary/10 bg-white p-5 transition ${CARD}`}
      style={{
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 16px 40px -12px rgba(139,49,232,0.28)' : undefined,
      }}>
      {/* Brand identity + contract status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoTile name={brand.name} color={brand.color} logoUrl={brand.logoUrl} initials={brand.initials} size={44}/>
          <div>
            <p className="text-[14.5px] font-extrabold text-ink">{brand.name}</p>
            <p className="text-[12px] text-ink/45">{brand.industry} · {brand.location}</p>
          </div>
        </div>
        <span className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${st.bg} ${st.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>{st.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-0 divide-x divide-primary/8 border-t border-primary/8 pt-4">
        <div className="pr-3 text-center">
          <p className={`text-[16px] font-black tracking-[-0.02em] ${GRAD_TEXT}`}>{brand.activeCampaigns}</p>
          <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink/35">Campaigns</p>
        </div>
        <div className="px-3 text-center">
          <p className={`text-[16px] font-black tracking-[-0.02em] ${GRAD_TEXT}`}>€{(brand.monthlyRetainer).toLocaleString()}</p>
          <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink/35">/ month</p>
        </div>
        <div className="pl-3 text-center">
          <p className={`text-[16px] font-black tracking-[-0.02em] ${GRAD_TEXT}`}>{brand.totalCampaigns}</p>
          <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink/35">Total</p>
        </div>
      </div>

      {/* Since */}
      <p className="mt-3 text-[11px] text-ink/35">Managed since {brand.managedSince}</p>

      {/* Actions */}
      <div className="mt-4 flex gap-2 border-t border-primary/8 pt-4">
        {/* Dashboard access — the key agency feature */}
        <button onClick={() => onDashboardAccess(brand.id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl ${GRAD_BTN} py-2.5 text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
          <LockOpenIcon s={13}/>Dashboard
        </button>
        <button onClick={onClick}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/15 py-2.5 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.04]">
          <PlayIcon s={11}/>New campaign
        </button>
      </div>
    </div>
  )
}

function ManagedBrandsRow({ brands, onBrandClick, onDashboardAccess, onViewAll, onInvite }: {
  brands: ManagedBrand[]
  onBrandClick: (id: string) => void
  onDashboardAccess: (id: string) => void
  onViewAll: () => void
  onInvite: () => void
}) {
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><BuildingIcon s={16}/></span>
          <div>
            <h3 className="text-[14px] font-bold text-ink">Managed brands</h3>
            <p className="text-[11px] text-ink/40">{brands.length} clients · click a brand for campaigns · "Dashboard" for full access</p>
          </div>
        </div>
        <button onClick={onViewAll}
          className="hidden items-center gap-1.5 rounded-lg border border-primary/15 px-3.5 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.04] sm:flex">
          View all<ArrowRightIcon s={12}/>
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {brands.map(b => (
          <BrandManagementCard key={b.id} brand={b}
            onClick={() => onBrandClick(b.id)}
            onDashboardAccess={onDashboardAccess}
          />
        ))}
        {/* Ghost: invite brand */}
        <button type="button" onClick={onInvite}
          className="flex w-[220px] flex-shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/20 bg-surface-sub/50 p-5 text-center transition hover:border-primary/40 hover:bg-primary/[0.03]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><PlusIcon s={18}/></span>
          <div>
            <p className="text-[13px] font-bold text-ink/55">Invite a brand</p>
            <p className="mt-0.5 text-[11px] text-ink/35">Add a new brand client to your agency</p>
          </div>
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MANAGED CREATORS ROW
   ════════════════════════════════════════════════════════════════════ */
function CreatorRosterCard({ creator }: { creator: ManagedCreator }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className={`flex w-[240px] flex-shrink-0 flex-col rounded-2xl border border-primary/10 bg-white p-5 transition ${CARD}`}
      style={{
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 16px 40px -12px rgba(139,49,232,0.28)' : undefined,
      }}>
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <LogoTile name={creator.name} color={creator.color} logoUrl={creator.avatarUrl} initials={creator.initials} size={40}/>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[13.5px] font-extrabold text-ink">{creator.name}</p>
            {creator.exclusive && (
              <span className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-primary/[0.08] px-1.5 py-0.5 text-[9px] font-bold text-primary">
                <ShieldCheckIcon s={9}/>EX
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-ink/45">{creator.handle}</p>
        </div>
      </div>

      {/* Niche + platform */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-lg bg-primary/[0.06] px-2 py-0.5 text-[11px] font-semibold text-primary">{creator.niche}</span>
        <span className="rounded-lg bg-surface-sub px-2 py-0.5 text-[11px] font-semibold text-ink/50">{creator.platform}</span>
      </div>

      {/* Followers + active deals */}
      <div className="mt-3.5 flex items-center justify-between border-t border-primary/8 pt-3.5">
        <span className="text-[12.5px] font-bold text-ink">{creator.followers}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${creator.activeDeals > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-sub text-ink/40'}`}>
          {creator.activeDeals} {creator.activeDeals === 1 ? 'deal' : 'deals'}
        </span>
      </div>
    </div>
  )
}

function ManagedCreatorsRow({ creators, onViewAll, onAddCreator }: {
  creators: ManagedCreator[]; onViewAll: () => void; onAddCreator: () => void
}) {
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><UsersIcon s={16}/></span>
          <div>
            <h3 className="text-[14px] font-bold text-ink">Creator roster</h3>
            <p className="text-[11px] text-ink/40">{creators.length} shown · 24 total — creators you represent and can add to campaigns</p>
          </div>
        </div>
        <button onClick={onViewAll}
          className="hidden items-center gap-1.5 rounded-lg border border-primary/15 px-3.5 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.04] sm:flex">
          View all<ArrowRightIcon s={12}/>
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {creators.map(c => <CreatorRosterCard key={c.id} creator={c}/>)}
        {/* Ghost: add creator */}
        <button type="button" onClick={onAddCreator}
          className="flex w-[200px] flex-shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/20 bg-surface-sub/50 p-5 text-center transition hover:border-primary/40 hover:bg-primary/[0.03]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><PlusIcon s={18}/></span>
          <div>
            <p className="text-[12.5px] font-bold text-ink/55">Add to roster</p>
            <p className="mt-0.5 text-[11px] text-ink/35">Find or invite a creator</p>
          </div>
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CROSS-BRAND CAMPAIGNS ROW
   Same card pattern as brand dashboard but with brand attribution badge
   ════════════════════════════════════════════════════════════════════ */
function AgencyCampaignCard({ campaign, onClick }: { campaign: ManagedCampaign; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const st = CAMPAIGN_STATUS_META[campaign.status]
  const objCls = OBJECTIVE_COLOR[campaign.objective] ?? 'text-ink/60 bg-surface-sub'
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className={`flex w-[290px] flex-shrink-0 flex-col rounded-2xl border border-primary/10 bg-white p-5 text-left transition ${CARD}`}
      style={{
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 16px 40px -12px rgba(139,49,232,0.28)' : undefined,
      }}>
      {/* Brand attribution + title */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Brand badge */}
          <div className="mb-1.5 flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded-sm flex-shrink-0" style={{ background: campaign.brandColor }}/>
            <span className="text-[11px] font-semibold text-ink/45">{campaign.brandName}</span>
          </div>
          <p className="line-clamp-2 text-[13.5px] font-extrabold leading-tight text-ink">{campaign.title}</p>
        </div>
        <span className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${st.bg} ${st.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>{st.label}
        </span>
      </div>

      {/* Objective pill + deadline */}
      <div className="mt-2.5 flex items-center gap-2">
        <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${objCls}`}>{campaign.objective}</span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-ink/40">
          <ClockIcon s={11}/>Ends {campaign.endDate}
        </span>
      </div>

      {/* 3 metrics */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-primary/8 pt-4">
        {[
          { label: 'Views',       value: campaign.metrics.views       },
          { label: 'Engagement',  value: campaign.metrics.engagement  },
          { label: 'Conversions', value: campaign.metrics.conversions },
        ].map(m => (
          <div key={m.label} className="text-center">
            <div className={`text-[14px] font-black tracking-[-0.02em] ${m.value === '—' ? 'text-ink/25' : GRAD_TEXT}`}>{m.value}</div>
            <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink/35">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-primary/8 pt-3.5">
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink/50">
          <UsersIcon s={12}/>{campaign.creators} creator{campaign.creators !== 1 ? 's' : ''}
        </span>
        <span className="text-[11.5px] font-bold text-ink/70">{campaign.budget}</span>
      </div>
    </button>
  )
}

function AgencyCampaignsRow({ campaigns, onCampaignClick, onViewAll, onNewCampaign }: {
  campaigns: ManagedCampaign[]
  onCampaignClick: (id: string) => void
  onViewAll: () => void
  onNewCampaign: () => void
}) {
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><PlayIcon s={14}/></span>
          <div>
            <h3 className="text-[14px] font-bold text-ink">All managed campaigns</h3>
            <p className="text-[11px] text-ink/40">{campaigns.length} campaigns across all brands · click any to open the tracker</p>
          </div>
        </div>
        <button onClick={onViewAll}
          className="hidden items-center gap-1.5 rounded-lg border border-primary/15 px-3.5 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.04] sm:flex">
          View all<ArrowRightIcon s={12}/>
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {campaigns.map(c => (
          <AgencyCampaignCard key={c.id} campaign={c} onClick={() => onCampaignClick(c.id)}/>
        ))}
        <button type="button" onClick={onNewCampaign}
          className="flex w-[200px] flex-shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/20 bg-surface-sub/50 p-5 text-center transition hover:border-primary/40 hover:bg-primary/[0.03]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          </span>
          <span className="text-[12.5px] font-bold leading-tight text-ink/50">New campaign</span>
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   REVENUE CARD — agency earnings breakdown
   Mirror of brand's CreatorTargetCard / creator's EarningsGoalCard
   ════════════════════════════════════════════════════════════════════ */
function AgencyRevenueCard() {
  const [revenueGoal, setRevenueGoal] = useState(5000)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput,   setGoalInput]   = useState('5000')
  const goalInputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingGoal) goalInputRef.current?.focus() }, [editingGoal])

  const totalRetainers  = MANAGED_BRANDS.filter(b => b.contractStatus === 'active').reduce((s, b) => s + b.monthlyRetainer, 0)
  const negotiatingAmt  = MANAGED_BRANDS.filter(b => b.contractStatus === 'negotiating').reduce((s, b) => s + b.monthlyRetainer, 0)
  const campaignFees    = CAMPAIGN_FEES_THIS_MONTH
  const total           = totalRetainers + campaignFees
  const progress        = Math.min(100, Math.round((total / Math.max(revenueGoal, 1)) * 100))
  const remaining       = Math.max(0, revenueGoal - total)
  const isGoalMet       = total >= revenueGoal

  const commitGoal = () => {
    const v = parseInt(goalInput.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(v) && v > 0) setRevenueGoal(v); else setGoalInput(String(revenueGoal))
    setEditingGoal(false)
  }

  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><TargetIcon s={18}/></span>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-ink/50">Agency revenue</p>
            <p className="mt-0.5 text-[11.5px] text-ink/35">Retainers + campaign fees this month</p>
          </div>
        </div>
        {/* Goal editor */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-ink/45">Monthly goal:</span>
          {editingGoal ? (
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-ink/60">€</span>
              <input ref={goalInputRef} value={goalInput}
                onChange={e => setGoalInput(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={commitGoal}
                onKeyDown={e => { if (e.key === 'Enter') commitGoal(); if (e.key === 'Escape') { setEditingGoal(false); setGoalInput(String(revenueGoal)) } }}
                className="w-24 rounded-lg border border-primary/25 bg-white px-2 py-1 text-[13px] font-bold text-ink outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(139,49,232,0.12)]"/>
            </div>
          ) : (
            <button onClick={() => { setGoalInput(String(revenueGoal)); setEditingGoal(true) }}
              className="flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/[0.05] px-2.5 py-1 text-[13px] font-bold text-primary transition hover:bg-primary/[0.09]">
              €{revenueGoal.toLocaleString()}<EditIcon s={12}/>
            </button>
          )}
        </div>
      </div>

      {/* Breakdown: retainers + campaign fees */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-sub p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink/50">
              <RepeatIcon s={13}/>Retainers (active)
            </span>
          </div>
          <p className={`text-[22px] font-black tracking-[-0.03em] ${GRAD_TEXT}`}>€{totalRetainers.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-ink/35">/month · {MANAGED_BRANDS.filter(b => b.contractStatus === 'active').length} active contracts</p>
          {negotiatingAmt > 0 && (
            <p className="mt-1.5 text-[11px] font-semibold text-amber-600">+€{negotiatingAmt.toLocaleString()} pending signature</p>
          )}
        </div>
        <div className="rounded-xl bg-surface-sub p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink/50">
              <PlayIcon s={13}/>Campaign fees
            </span>
          </div>
          <p className={`text-[22px] font-black tracking-[-0.03em] ${GRAD_TEXT}`}>€{campaignFees.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-ink/35">this month · one-time deliveries</p>
        </div>
        <div className="rounded-xl bg-surface-sub p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink/50">
              <EuroIcon s={13}/>Total this month
            </span>
          </div>
          <p className={`text-[22px] font-black tracking-[-0.03em] ${GRAD_TEXT}`}>€{total.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-ink/35">{progress}% of €{revenueGoal.toLocaleString()} goal</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-3 w-full overflow-hidden rounded-full bg-primary/[0.08]">
          <div className={`h-full rounded-full transition-all duration-700 ease-out ${isGoalMet ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : GRAD_BTN}`}
            style={{ width: `${progress}%` }}/>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {isGoalMet ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5">
            <span className="text-emerald-500"><CheckIcon s={16}/></span>
            <span className="text-[13px] font-bold text-emerald-700">Revenue goal reached this month 🎉</span>
          </div>
        ) : (
          <>
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${GRAD_BTN}`}>
              <EuroIcon s={15}/>
              <span className="text-[13px] font-bold text-white">€{remaining.toLocaleString()} to goal</span>
            </div>
            {negotiatingAmt > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5">
                <span className="text-amber-500"><ClockIcon s={14}/></span>
                <span className="text-[13px] font-semibold text-amber-700">€{negotiatingAmt.toLocaleString()}/mo unlocks when Forma Fit signs</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INVITE BRAND MODAL
   ════════════════════════════════════════════════════════════════════ */
function InviteBrandModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [brandName, setBrandName]     = useState('')
  const [email,     setEmail]         = useState('')
  const [note,      setNote]          = useState('')
  const [sending,   setSending]       = useState(false)
  const [sent,      setSent]          = useState(false)

  useEffect(() => {
    if (!open) { setBrandName(''); setEmail(''); setNote(''); setSent(false); setSending(false) }
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open) return null

  const canSend = brandName.trim().length > 0 && email.includes('@')

  const handleSend = async () => {
    if (!canSend) return
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    setSending(false); setSent(true)
    setTimeout(onClose, 1500)
  }

  const INP = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}><BuildingIcon s={18}/></div>
            <div>
              <p className="text-[15px] font-extrabold text-ink">Invite a brand</p>
              <p className="text-[11.5px] text-ink/45">Send an invitation to join Nexfluence</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10"><XIcon s={13}/></button>
        </div>
        {/* Body */}
        {sent ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)] mb-4`}><CheckIcon s={28}/></div>
            <p className="text-[17px] font-extrabold text-ink">Invitation sent!</p>
            <p className="mt-2 text-[13px] text-ink/50">{brandName} will receive an email to join Nexfluence and connect with your agency.</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl bg-primary/[0.04] border border-primary/10 px-4 py-3.5">
              <p className="text-[12.5px] leading-[1.65] text-ink/60">
                The brand will receive an email to create a Nexfluence account. Once they join and <span className="font-bold text-ink">approve you as their agency</span>, you'll be able to manage their profile and run campaigns on their behalf.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Brand name *</label>
              <input className={INP} value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Vāre Coffee"/>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Contact email *</label>
              <input type="email" className={INP} value={email} onChange={e => setEmail(e.target.value)} placeholder="marketing@brand.com"/>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Personal note (optional)</label>
              <textarea className={`${INP} min-h-[80px] resize-none leading-relaxed text-[13.5px]`} value={note} onChange={e => setNote(e.target.value)}
                placeholder="Hi — we'd love to help Vāre Coffee grow your creator partnerships in the Baltics…"/>
            </div>
          </div>
        )}
        {/* Footer */}
        {!sent && (
          <div className="flex gap-2.5 border-t border-primary/10 px-6 py-4">
            <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">Cancel</button>
            <button onClick={handleSend} disabled={!canSend || sending}
              className={`flex-[2] flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${canSend && !sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
              {sending ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</> : <><SendIcon s={14}/>Send invitation</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ADD CREATOR MODAL — find on platform or invite by email
   ════════════════════════════════════════════════════════════════════ */
function AddCreatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab,       setTab]       = useState<'find' | 'invite'>('find')
  const [query,     setQuery]     = useState('')
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [exclusive, setExclusive] = useState(false)
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  /* Mock search results */
  const SEARCH_RESULTS = [
    { id: 'sr1', name: 'Elīna Krūmiņa', handle: '@elina.kr',   niche: 'Lifestyle', followers: '88K',  color: '#D97706' },
    { id: 'sr2', name: 'Kristaps B.',    handle: '@kristapsb',  niche: 'Sports',    followers: '120K', color: '#2563EB' },
    { id: 'sr3', name: 'Liis Saar',      handle: '@liissaar',   niche: 'Food',      followers: '54K',  color: '#059669' },
  ].filter(r => !query || r.name.toLowerCase().includes(query.toLowerCase()) || r.handle.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (!open) { setTab('find'); setQuery(''); setName(''); setEmail(''); setExclusive(false); setSent(false); setSending(false) }
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open) return null

  const canSend  = name.trim().length > 0 && email.includes('@')
  const handleSend = async () => {
    if (!canSend) return
    setSending(true); await new Promise(r => setTimeout(r, 800))
    setSending(false); setSent(true); setTimeout(onClose, 1500)
  }

  const INP = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[500px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}
        style={{ maxHeight: 'min(92vh, 640px)' }}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}><UsersIcon s={18}/></div>
            <div>
              <p className="text-[15px] font-extrabold text-ink">Add to creator roster</p>
              <p className="text-[11.5px] text-ink/45">Find an existing creator or invite someone new</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10"><XIcon s={13}/></button>
        </div>
        {/* Tabs */}
        <div className="flex border-b border-primary/8 px-2">
          {(['find', 'invite'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-[13px] font-semibold transition border-b-2 -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-ink/45 hover:text-ink/70'}`}>
              {t === 'find' ? 'Find on platform' : 'Invite new creator'}
            </button>
          ))}
        </div>

        {sent ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)] mb-4`}><CheckIcon s={28}/></div>
            <p className="text-[17px] font-extrabold text-ink">{tab === 'invite' ? 'Invitation sent!' : 'Request sent!'}</p>
            <p className="mt-2 text-[13px] text-ink/50">{tab === 'invite' ? `${name} will receive an email to join Nexfluence and connect with your agency.` : 'The creator will be notified of your roster invitation.'}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {tab === 'find' ? (
              <>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={15}/></span>
                  <input className={`${INP} pl-10`} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or handle…"/>
                </div>
                <div className="space-y-2">
                  {SEARCH_RESULTS.length === 0 ? (
                    <p className="py-4 text-center text-[13px] text-ink/40">No creators found. Try "Invite new creator" to add someone not yet on the platform.</p>
                  ) : SEARCH_RESULTS.map(r => (
                    <button key={r.id} type="button" onClick={async () => { setSending(true); await new Promise(res => setTimeout(res, 600)); setSending(false); setSent(true); setTimeout(onClose, 1500) }}
                      className={`flex w-full items-center gap-3 rounded-xl border border-primary/10 bg-white px-4 py-3.5 text-left transition hover:border-primary/25 hover:bg-primary/[0.03] ${CARD}`}>
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white text-[14px]" style={{ background: r.color }}>{r.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-ink">{r.name}</p>
                        <p className="text-[12px] text-ink/45">{r.handle} · {r.niche} · {r.followers}</p>
                      </div>
                      <span className="flex items-center gap-1 text-[12px] font-bold text-primary"><PlusIcon s={13}/>Add</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-surface-sub px-4 py-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/[0.08] text-primary"><ShieldCheckIcon s={12}/></div>
                  <p className="text-[12px] text-ink/55">Adding a creator sends them a roster invitation. They must accept before you can include them in campaigns.</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Creator name *</label>
                  <input className={INP} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Liis Saar"/>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Contact email *</label>
                  <input type="email" className={INP} value={email} onChange={e => setEmail(e.target.value)} placeholder="creator@email.com"/>
                </div>
                <button onClick={() => setExclusive(e => !e)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.04]">
                  <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${exclusive ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white'}`}>
                    {exclusive && <CheckIcon s={10}/>}
                  </span>
                  Invite as exclusive creator — they won't work with competitors
                </button>
              </>
            )}
          </div>
        )}
        {/* Footer — only for invite tab */}
        {tab === 'invite' && !sent && (
          <div className="flex gap-2.5 border-t border-primary/10 px-6 py-4">
            <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">Cancel</button>
            <button onClick={handleSend} disabled={!canSend || sending}
              className={`flex-[2] flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${canSend && !sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
              {sending ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</> : <><SendIcon s={14}/>Send invitation</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ALL BRANDS MODAL
   ════════════════════════════════════════════════════════════════════ */
function AllBrandsModal({ open, onClose, onDashboardAccess }: {
  open: boolean; onClose: () => void; onDashboardAccess: (id: string) => void
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
      <div className={`relative z-10 flex w-full max-w-[720px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(90vh, 680px)' }}>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-ink">All managed brands</h2>
            <p className="mt-0.5 text-[12px] text-ink/45">{MANAGED_BRANDS.length} clients · "Dashboard" to access their brand account</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-[15px] text-ink/50 transition hover:bg-ink/10">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3">
            {MANAGED_BRANDS.map(b => {
              const st = CONTRACT_STATUS_META[b.contractStatus]
              return (
                <div key={b.id} className={`flex items-center gap-4 rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                  <LogoTile name={b.name} color={b.color} logoUrl={b.logoUrl} initials={b.initials} size={48}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-ink">{b.name}</p>
                      <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${st.bg} ${st.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>{st.label}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-ink/45">{b.industry} · {b.location} · Managed since {b.managedSince}</p>
                    <p className="text-[12.5px] font-semibold text-ink/65 mt-0.5">€{b.monthlyRetainer.toLocaleString()}/mo · {b.activeCampaigns} active campaigns</p>
                  </div>
                  <button onClick={() => { onClose(); onDashboardAccess(b.id) }}
                    className={`flex flex-shrink-0 items-center gap-2 rounded-xl ${GRAD_BTN} px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
                    <LockOpenIcon s={13}/>Dashboard
                  </button>
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex-shrink-0 border-t border-primary/10 bg-surface-sub px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/60 transition hover:bg-surface-sub">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ALL CREATORS MODAL
   ════════════════════════════════════════════════════════════════════ */
function AllCreatorsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      <div className={`relative z-10 flex w-full max-w-[720px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(90vh, 680px)' }}>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-ink">Creator roster</h2>
            <p className="mt-0.5 text-[12px] text-ink/45">24 total creators · {MANAGED_CREATORS.filter(c => c.exclusive).length} exclusive contracts</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-[15px] text-ink/50 transition hover:bg-ink/10">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MANAGED_CREATORS.map(c => (
              <div key={c.id} className={`flex items-center gap-4 rounded-2xl border border-primary/10 bg-white p-4 ${CARD}`}>
                <LogoTile name={c.name} color={c.color} logoUrl={c.avatarUrl} initials={c.initials} size={44}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink truncate">{c.name}</p>
                    {c.exclusive && <span className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-primary/[0.08] px-2 py-0.5 text-[9.5px] font-bold text-primary"><ShieldCheckIcon s={9}/>EX</span>}
                  </div>
                  <p className="text-[12px] text-ink/45">{c.handle} · {c.platform} · {c.followers}</p>
                  <p className="text-[11.5px] text-ink/50 mt-0.5">{c.niche} · {c.activeDeals} active deal{c.activeDeals !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 border-t border-primary/10 bg-surface-sub px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/60 transition hover:bg-surface-sub">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   RANGE DROPDOWN — identical to brand/creator dashboards
   ════════════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════════════
   VIEWS CHART — identical SVG logic to brand/creator dashboards
   ════════════════════════════════════════════════════════════════════ */
function ViewsChart({ data }: { data: { label: string; views: number }[] }) {
  const rawId = useId(); const id = rawId.replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 700, H = 220, PL = 8, PR = 8, PT = 14, PB = 24
  const iW = W - PL - PR, iH = H - PT - PB
  const n = data.length, vals = data.map(d => d.views)
  const mx = Math.max(...vals), mn = Math.min(...vals), sp = Math.max(mx - mn, 1)
  const xAt = (i: number) => PL + (n === 1 ? iW / 2 : (i / (n - 1)) * iW)
  const yAt = (v: number) => PT + iH - ((v - mn) / sp) * iH
  const lp = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(d.views).toFixed(2)}`).join(' ')
  const ap = `${lp} L ${xAt(n - 1).toFixed(2)} ${(PT + iH).toFixed(2)} L ${xAt(0).toFixed(2)} ${(PT + iH).toFixed(2)} Z`
  const te = Math.max(1, Math.ceil(n / 6)), ticks = data.map((_, i) => i).filter(i => i % te === 0 || i === n - 1)
  const handleMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current; if (!svg) return
    const r = svg.getBoundingClientRect()
    let idx = Math.round((((e.clientX - r.left) / r.width * W) - PL) / iW * (n - 1))
    setHover(Math.min(n - 1, Math.max(0, idx)))
  }
  const hp = hover !== null ? data[hover] : null
  return (
    <div className="relative h-full min-h-[180px] w-full flex-1">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full cursor-crosshair" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B31E8" stopOpacity="0.26"/><stop offset="100%" stopColor="#FF33BC" stopOpacity="0"/></linearGradient>
          <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8B31E8"/><stop offset="55%" stopColor="#A855F7"/><stop offset="100%" stopColor="#FF33BC"/></linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(p => <line key={p} x1={PL} x2={W - PR} y1={PT + iH * p} y2={PT + iH * p} stroke="#8B31E8" strokeOpacity="0.06" strokeWidth="1"/>)}
        <path d={ap} fill={`url(#${id}-a)`}/><path d={lp} fill="none" stroke={`url(#${id}-l)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {ticks.map(i => <text key={i} x={xAt(i)} y={H - 6} textAnchor="middle" fontSize="9.5" fontWeight={700} className="fill-ink/35">{data[i]?.label}</text>)}
        {hp && hover !== null && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={PT} y2={PT + iH} stroke="#8B31E8" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 3"/>
            <circle cx={xAt(hover)} cy={yAt(hp.views)} r="4.5" fill="white" stroke="#8B31E8" strokeWidth="2.5"/>
          </g>
        )}
      </svg>
      {hp && hover !== null && (
        <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-primary/10 bg-ink px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg"
          style={{ left: `${(xAt(hover) / W) * 100}%`, top: `${(yAt(hp.views) / H) * 100}%`, transform: 'translate(-50%, -135%)' }}>
          {hp.label} · {hp.views.toLocaleString()} agency profile views
        </div>
      )}
    </div>
  )
}

function ViewsCard({ range, onRangeChange }: { range: RangeOption; onRangeChange: (r: RangeOption) => void }) {
  const n = VIEWS_DATA.length, slice = VIEWS_DATA.slice(n - range)
  const total = slice.reduce((s, d) => s + d.views, 0)
  let delta: { label: string; positive: boolean } | null = null
  if (range * 2 <= n) {
    const prev = VIEWS_DATA.slice(n - range * 2, n - range), pt = prev.reduce((s, d) => s + d.views, 0)
    if (pt > 0) { const pct = ((total - pt) / pt) * 100; delta = { label: `${Math.abs(pct).toFixed(1)}%`, positive: pct >= 0 } }
  }
  return (
    <div className={`flex h-full w-full flex-col rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/40">Agency profile views</p>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="text-[32px] font-black tracking-[-0.03em] text-ink">{total.toLocaleString()}</span>
            {delta && <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold ${delta.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><TrendIcon up={delta.positive} s={11}/>{delta.label}</span>}
          </div>
          <p className="mt-1 text-[12px] font-medium text-ink/40">{delta ? `vs previous ${range} days` : `Last ${range} days`} · brands and creators discovering your agency</p>
        </div>
        <RangeDropdown value={range} onChange={onRangeChange}/>
      </div>
      <div className="mt-6 flex flex-1 flex-col min-h-0"><ViewsChart data={slice}/></div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   NOTIFICATIONS PANEL — same component as brand/creator
   ════════════════════════════════════════════════════════════════════ */
const NOTIFICATION_STYLE: Record<NotificationType, { icon: ReactNode; bg: string; text: string }> = {
  brand:     { icon: <BuildingIcon s={16}/>,  bg: 'bg-primary/[0.08]', text: 'text-primary'     },
  creator:   { icon: <UsersIcon s={16}/>,     bg: 'bg-sky-50',         text: 'text-sky-600'     },
  payment:   { icon: <EuroIcon s={16}/>,      bg: 'bg-emerald-50',     text: 'text-emerald-600' },
  campaign:  { icon: <PlayIcon s={16}/>,      bg: 'bg-amber-50',       text: 'text-amber-600'   },
  contract:  { icon: <ShieldCheckIcon s={16}/>, bg: 'bg-violet-50',    text: 'text-violet-600'  },
}

function NotificationsPanel({ items, onMarkRead, onMarkAllRead }: {
  items: NotificationItem[]; onMarkRead: (id: string) => void; onMarkAllRead: () => void
}) {
  const unread = items.filter(n => n.unread).length
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
      <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/8 px-5 py-4">
        <h3 className="text-[14.5px] font-bold text-ink">Notifications{unread > 0 && <span className="ml-1.5 text-primary">({unread})</span>}</h3>
        {unread > 0 && <button onClick={onMarkAllRead} className="text-[12px] font-bold text-primary hover:underline">Mark all read</button>}
      </div>
      <div className="max-h-[420px] flex-1 divide-y divide-primary/6 overflow-y-auto">
        {items.map(n => {
          const style = NOTIFICATION_STYLE[n.type]
          return (
            <button key={n.id} onClick={() => onMarkRead(n.id)}
              className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-primary/[0.03] ${n.unread ? 'bg-primary/[0.02]' : ''}`}>
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>{style.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] leading-[1.4] text-ink/80">{n.title}</span>
                <span className="mt-0.5 block text-[11px] font-medium text-ink/40">{n.time}</span>
              </span>
              {n.unread && <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${GRAD_BTN}`}/>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════
   Layout order:
   1. Header: NexLogo pill + left nav (Dashboard, Campaigns, Creators)
              + right nav (ChatBubble+badge, Bell+badge, My Profile)
   2. Modals (InviteBrand, AddCreator, AllBrands, AllCreators)
   3. Main:
      a. Title row + "View agency profile" link
      b. AgencyActionStrip — gradient command centre banner
      c. ManagedBrandsRow — horizontal scrollable brand client cards
      d. ManagedCreatorsRow — creator roster
      e. AgencyCampaignsRow — all campaigns across all brands
      f. 4 stat cards
      g. AgencyRevenueCard
      h. ViewsCard (2/3) + NotificationsPanel (1/3)
   ════════════════════════════════════════════════════════════════════ */
export default function AgencyDashboardPage() {
  const router = useRouter()

  const [range,             setRange]             = useState<RangeOption>(7)
  const [notifications,     setNotifications]     = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [inviteBrandOpen,   setInviteBrandOpen]   = useState(false)
  const [addCreatorOpen,    setAddCreatorOpen]     = useState(false)
  const [allBrandsOpen,     setAllBrandsOpen]     = useState(false)
  const [allCreatorsOpen,   setAllCreatorsOpen]   = useState(false)

  const unreadNotifs   = notifications.filter(n => n.unread).length
  const unreadMessages = UNREAD_MESSAGE_COUNT

  const markNotifRead    = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  const markAllNotifRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))

  const goToMessages    = () => router.push('/messages')
  const goToNewCampaign = () => router.push('/agency/campaigns/new')
  const goToCampaign    = (id: string) => router.push(`/agency/campaign/${id}`)

  /* Brand dashboard access — routes to brand dashboard with agency context */
  const goToBrandDashboard = (brandId: string) => {
    const brand = MANAGED_BRANDS.find(b => b.id === brandId)
    if (brand) router.push(`/dashboard/brand?agencyView=true&brandId=${brandId}&brandName=${encodeURIComponent(brand.name)}`)
  }

  const totalMonthlyRetainer = MANAGED_BRANDS.filter(b => b.contractStatus === 'active').reduce((s, b) => s + b.monthlyRetainer, 0)
  const totalActiveCampaigns = MANAGED_CAMPAIGNS.filter(c => c.status === 'active').length

  const NAV_LEFT = [
    { label: 'Dashboard',  active: true,  action: () => {} },
    { label: 'Campaigns',  active: false, action: goToNewCampaign },
    { label: 'Creators',   active: false, action: () => setAllCreatorsOpen(true) },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ MODALS ════ */}
      <InviteBrandModal  open={inviteBrandOpen}  onClose={() => setInviteBrandOpen(false)}/>
      <AddCreatorModal   open={addCreatorOpen}   onClose={() => setAddCreatorOpen(false)}/>
      <AllBrandsModal    open={allBrandsOpen}    onClose={() => setAllBrandsOpen(false)}    onDashboardAccess={goToBrandDashboard}/>
      <AllCreatorsModal  open={allCreatorsOpen}  onClose={() => setAllCreatorsOpen(false)}/>

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>
            {/* Left nav */}
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            {/* Right nav — icon buttons (same pattern as brand/creator) */}
            <div className="relative z-10 flex items-center gap-1.5">
              <button onClick={goToMessages} title="Messages" aria-label="Messages"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <ChatBubbleIcon s={18}/>
                {unreadMessages > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>
                    {unreadMessages}
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
              <button onClick={() => router.push(`/agency/${AGENCY.slug}`)}
                className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:flex">
                My Profile
              </button>
            </div>
            {/* NexLogo — absolutely centred */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-6 py-8">

        {/* Title row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[clamp(22px,3.2vw,30px)] font-black tracking-[-0.03em] text-ink">
              Welcome back, {AGENCY.name} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1 text-[14px] text-ink/55">Managing {MANAGED_BRANDS.length} brands · {MANAGED_CREATORS.length} creators on roster · €{totalMonthlyRetainer.toLocaleString()}/mo recurring revenue</p>
          </div>
          <a href={`/agency/${AGENCY.slug}`}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30">
            View agency profile
          </a>
        </div>

        {/* Agency action strip */}
        <div className="mt-6">
          <AgencyActionStrip
            onNewCampaign={goToNewCampaign}
            onInviteBrand={() => setInviteBrandOpen(true)}
            onAddCreator={() => setAddCreatorOpen(true)}
          />
        </div>

        {/* Managed brands */}
        <div className="mt-4">
          <ManagedBrandsRow
            brands={MANAGED_BRANDS}
            onBrandClick={goToNewCampaign}
            onDashboardAccess={goToBrandDashboard}
            onViewAll={() => setAllBrandsOpen(true)}
            onInvite={() => setInviteBrandOpen(true)}
          />
        </div>

        {/* Creator roster */}
        <div className="mt-4">
          <ManagedCreatorsRow
            creators={MANAGED_CREATORS}
            onViewAll={() => setAllCreatorsOpen(true)}
            onAddCreator={() => setAddCreatorOpen(true)}
          />
        </div>

        {/* All managed campaigns */}
        <div className="mt-4">
          <AgencyCampaignsRow
            campaigns={MANAGED_CAMPAIGNS}
            onCampaignClick={goToCampaign}
            onViewAll={() => {}}
            onNewCampaign={goToNewCampaign}
          />
        </div>

        {/* 4 stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<BuildingIcon s={18}/>} label="Managed brands"   value={String(MANAGED_BRANDS.length)}       sublabel="Brand clients under contract"     delta={{ label: '+1 this month',          positive: true }}/>
          <StatCard icon={<UsersIcon s={18}/>}    label="Creator roster"   value="24"                                   sublabel="Creators represented"             delta={{ label: '+3 this month',          positive: true }}/>
          <StatCard icon={<PlayIcon s={18}/>}     label="Active campaigns" value={String(totalActiveCampaigns)}         sublabel="Across all managed brands"        delta={{ label: '+2 this week',           positive: true }}/>
          <StatCard icon={<EuroIcon s={18}/>}     label="Monthly retainers" value={`€${totalMonthlyRetainer.toLocaleString()}`} sublabel="Recurring / month (active only)" delta={{ label: '+€900 this month',    positive: true }}/>
        </div>

        {/* Agency revenue card */}
        <div className="mt-4">
          <AgencyRevenueCard/>
        </div>

        {/* Views chart + Notifications */}
        <div className="mt-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          <div className="flex h-full lg:col-span-2">
            <ViewsCard range={range} onRangeChange={setRange}/>
          </div>
          <NotificationsPanel items={notifications} onMarkRead={markNotifRead} onMarkAllRead={markAllNotifRead}/>
        </div>

      </main>
    </div>
  )
}