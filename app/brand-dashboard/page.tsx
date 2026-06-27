'use client'

import { useState, useEffect, useRef, useId, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Brand dashboard — app/dashboard/brand/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const BRAND = { name: 'Kinetics', slug: 'kinetics' }

/* ─── Range ──────────────────────────────────────────────────────── */
type RangeOption = 7 | 14 | 28
const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: 'Last 7 days',  value: 7  },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 28 days', value: 28 },
]

/* ─── Views data ─────────────────────────────────────────────────── */
const VIEWS_DATA: { label: string; views: number }[] = [
  { label: 'May 23', views: 150 }, { label: 'May 24', views: 175 }, { label: 'May 25', views: 160 },
  { label: 'May 26', views: 210 }, { label: 'May 27', views: 260 }, { label: 'May 28', views: 240 },
  { label: 'May 29', views: 205 }, { label: 'May 30', views: 230 }, { label: 'May 31', views: 250 },
  { label: 'Jun 1',  views: 205 }, { label: 'Jun 2',  views: 265 }, { label: 'Jun 3',  views: 290 },
  { label: 'Jun 4',  views: 310 }, { label: 'Jun 5',  views: 295 }, { label: 'Jun 6',  views: 330 },
  { label: 'Jun 7',  views: 380 }, { label: 'Jun 8',  views: 360 }, { label: 'Jun 9',  views: 340 },
  { label: 'Jun 10', views: 385 }, { label: 'Jun 11', views: 420 }, { label: 'Jun 12', views: 400 },
  { label: 'Jun 13', views: 430 }, { label: 'Jun 14', views: 415 }, { label: 'Jun 15', views: 455 },
  { label: 'Jun 16', views: 440 }, { label: 'Jun 17', views: 470 }, { label: 'Jun 18', views: 490 },
  { label: 'Jun 19', views: 520 },
]

/* ─── Notifications ──────────────────────────────────────────────── */
type NotificationType = 'application' | 'profile_view' | 'payout' | 'deal' | 'insight'
type NotificationItem = { id: string; type: NotificationType; title: string; time: string; unread: boolean }

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', type: 'application',  title: 'Amelia Roze applied to your affiliate program',  time: '2h ago', unread: true  },
  { id: 'n2', type: 'profile_view', title: 'Markus Tamm viewed your brand profile',           time: '5h ago', unread: true  },
  { id: 'n3', type: 'payout',       title: 'Payout sent — €380 to Rūta Vaitkutė',            time: '1d ago', unread: false },
  { id: 'n4', type: 'deal',         title: 'Sandra Liepa accepted your campaign brief',       time: '2d ago', unread: true  },
  { id: 'n5', type: 'insight',      title: 'Your affiliate program crossed 500 conversions',  time: '3d ago', unread: false },
  { id: 'n6', type: 'deal',         title: 'Aiga Ozola requested to extend her partnership',  time: '4d ago', unread: false },
]

/* ─── Unread message count (badge only — full inbox is /messages) ── */
const UNREAD_MESSAGE_COUNT = 3

/* ─── Active campaigns ───────────────────────────────────────────── */
type CampaignStatus = 'active' | 'review' | 'draft'
type ActiveCampaign = {
  id: string; title: string; objective: string; status: CampaignStatus
  creators: number; budget: string; endDate: string
  metrics: { views: string; engagement: string; conversions: string }
  color: string
}
const ACTIVE_CAMPAIGNS: ActiveCampaign[] = [
  {
    id: 'cp1', title: 'Vitamin-C Recovery Stack',
    objective: 'Conversions', status: 'active',
    creators: 5, budget: '€1,900', endDate: 'Jun 30',
    metrics: { views: '1.2M', engagement: '8.4%', conversions: '5.8K' },
    color: '#8B31E8',
  },
  {
    id: 'cp2', title: 'Pre-Workout Race Day',
    objective: 'Awareness', status: 'active',
    creators: 3, budget: '€1,050', endDate: 'Jul 5',
    metrics: { views: '840K', engagement: '11.2%', conversions: '2.1K' },
    color: '#2563EB',
  },
  {
    id: 'cp3', title: 'Electrolyte Hot Yoga',
    objective: 'Consideration', status: 'review',
    creators: 2, budget: '€700', endDate: 'Jul 12',
    metrics: { views: '320K', engagement: '6.8%', conversions: '940' },
    color: '#DB2777',
  },
]

/* ─── Perf constants ─────────────────────────────────────────────── */
const CURRENT_ACTIVE_CREATORS     = 9
const CURRENT_AVG_CONVERSION_RATE = 4.2
const CURRENT_AVG_ENGAGEMENT_RATE = 7.8
const CURRENT_PIECES_OF_CONTENT   = 23

const TARGET_CONVERSION_OPTIONS = [
  { label: '2%',  value: 2  }, { label: '3%',  value: 3  }, { label: '5%',  value: 5  },
  { label: '7%',  value: 7  }, { label: '10%', value: 10 },
]
const TARGET_ENGAGEMENT_OPTIONS = [
  { label: '3%',  value: 3  }, { label: '5%',  value: 5  }, { label: '8%',  value: 8  },
  { label: '10%', value: 10 }, { label: '12%', value: 12 },
]
const CONTENT_PER_CREATOR_OPTIONS = [
  { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 },
  { label: '4', value: 4 }, { label: '5', value: 5 },
]

/* ═══════════════════════════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════════════════════════ */
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
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 3l1 11h-2M3 3l-1 11 6.5 6.5a1 1 0 103-3M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
function UsersIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.9"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>
}
function ZapIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ImageIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function RocketIcon({ s = 24 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 7 6 7 13h10c0-7-5-11-5-11z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 13c0 2.5 1 4 2.5 5.5L12 21l2.5-2.5C16 17 17 15.5 17 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 13H7L5 15l4 1M14.5 13H17l2 2-4 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="11" r="1.5" fill="currentColor"/>
    </svg>
  )
}
function ArrowRightIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SparkleIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l2.1-2.1M5.6 18.4l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function PlayIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
}
function ClockIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}

/* ═══════════════════════ STAT CARD ════════════════════════════════ */
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

/* ═══════════════════════ CAMPAIGN STRIP ════════════════════════════ */
function CampaignStrip({ onClick }: { onClick: () => void }) {
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
            <RocketIcon s={26}/>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[20px] font-black leading-tight tracking-[-0.02em] text-white sm:text-[22px]">Start a campaign</span>
              <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-white/80" style={{ animation: 'pulse-dot 2s ease-out infinite' }}/>
            </div>
            <p className="mt-1 max-w-[480px] text-[13.5px] leading-[1.6] text-white/75">
              Define your brief, set your goals, and let creators know exactly what you need. Launch in minutes.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Brief & dos/don'ts", 'Campaign goals', 'Key metrics', 'Creator matching'].map((pill, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold text-white/90 backdrop-blur-sm">
                  <SparkleIcon s={10}/>{pill}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">Active campaigns</p>
            <p className="text-[22px] font-black leading-none text-white">{ACTIVE_CAMPAIGNS.length}</p>
          </div>
          <button type="button"
            className="flex items-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-[14px] font-bold text-primary shadow-[0_4px_16px_rgba(10,6,18,0.18)]"
            style={{ transition: 'transform 0.18s ease', transform: hovered ? 'translateY(-1px)' : 'none' }}
            onClick={onClick}>
            New campaign<ArrowRightIcon s={15}/>
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse-dot { 0%{box-shadow:0 0 0 0 rgba(255,255,255,0.6)} 70%{box-shadow:0 0 0 8px rgba(255,255,255,0)} 100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} }`}</style>
    </button>
  )
}

/* ═══════════════════════ ACTIVE CAMPAIGNS ROW ══════════════════════
   Horizontal strip below the campaign banner. Each card is clickable
   → /brand/campaign/[id] (tracker page — built later).
   ════════════════════════════════════════════════════════════════════ */
const STATUS_META: Record<CampaignStatus, { label: string; dot: string; bg: string; text: string }> = {
  active: { label: 'Active',      dot: 'bg-emerald-400',  bg: 'bg-emerald-50',  text: 'text-emerald-700'  },
  review: { label: 'In review',   dot: 'bg-amber-400',    bg: 'bg-amber-50',    text: 'text-amber-700'    },
  draft:  { label: 'Draft',       dot: 'bg-ink/30',       bg: 'bg-surface-sub', text: 'text-ink/50'       },
}
const OBJECTIVE_COLOR: Record<string, string> = {
  Conversions: 'text-violet-600 bg-violet-50',
  Awareness:   'text-sky-600 bg-sky-50',
  Consideration: 'text-pink-600 bg-pink-50',
}

function CampaignCard({ campaign, onClick }: { campaign: ActiveCampaign; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const st = STATUS_META[campaign.status]
  const objCls = OBJECTIVE_COLOR[campaign.objective] ?? 'text-ink/60 bg-surface-sub'
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className={`flex w-[290px] flex-shrink-0 flex-col rounded-2xl border border-primary/10 bg-white p-5 text-left transition ${CARD}`}
      style={{
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered
          ? '0 16px 40px -12px rgba(139,49,232,0.28), 0 2px 8px -2px rgba(10,6,18,0.06)'
          : undefined,
      }}>
      {/* Top row: title + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${campaign.color}18` }}>
            <PlayIcon s={14}/>
          </div>
          <span className="line-clamp-2 text-[13.5px] font-extrabold leading-tight text-ink" style={{ color: 'inherit' }}>
            {campaign.title}
          </span>
        </div>
        <span className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${st.bg} ${st.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>
          {st.label}
        </span>
      </div>

      {/* Objective pill + deadline */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${objCls}`}>{campaign.objective}</span>
        <span className="flex items-center gap-1 text-[11px] font-medium text-ink/40">
          <ClockIcon s={11}/>Ends {campaign.endDate}
        </span>
      </div>

      {/* 3 micro-metrics */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-primary/8 pt-4">
        {[
          { label: 'Views',       value: campaign.metrics.views       },
          { label: 'Engagement',  value: campaign.metrics.engagement  },
          { label: 'Conversions', value: campaign.metrics.conversions },
        ].map(m => (
          <div key={m.label} className="text-center">
            <div className={`text-[14px] font-black tracking-[-0.02em] ${GRAD_TEXT}`}>{m.value}</div>
            <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink/35">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Footer: creators + budget */}
      <div className="mt-4 flex items-center justify-between border-t border-primary/8 pt-3.5">
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink/50">
          <UsersIcon s={12}/>{campaign.creators} creator{campaign.creators !== 1 ? 's' : ''}
        </span>
        <span className="text-[11.5px] font-bold text-ink/70">{campaign.budget}</span>
      </div>
    </button>
  )
}

function ActiveCampaignsRow({ onCampaignClick, onViewAll }: {
  onCampaignClick: (id: string) => void
  onViewAll: () => void
}) {
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><PlayIcon s={14}/></span>
          <div>
            <h3 className="text-[14px] font-bold text-ink">Running campaigns</h3>
            <p className="text-[11px] text-ink/40">{ACTIVE_CAMPAIGNS.length} active — click any to open the tracker</p>
          </div>
        </div>
        <button onClick={onViewAll}
          className="hidden items-center gap-1.5 rounded-lg border border-primary/15 px-3.5 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.04] sm:flex">
          View all<ArrowRightIcon s={12}/>
        </button>
      </div>
      {/* Horizontally scrollable row — no scrollbar visible */}
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ACTIVE_CAMPAIGNS.map(c => (
          <CampaignCard key={c.id} campaign={c} onClick={() => onCampaignClick(c.id)}/>
        ))}
        {/* "Start new" ghost card */}
        <button type="button" onClick={() => onCampaignClick('new')}
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

/* ═══════════════════════ CREATOR TARGET CARD ═══════════════════════ */
function GoalSelect<T extends number>({
  label, value, options, onChange,
}: {
  label: string; value: T; options: { label: string; value: T }[]; onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.value === value)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-medium text-ink/45">{label}</span>
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/[0.05] px-2.5 py-1 text-[13px] font-bold text-primary transition hover:bg-primary/[0.09]">
          {current?.label}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={`text-primary/60 transition-transform ${open ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      {open && (
        <div className={`absolute left-0 top-[calc(100%+6px)] z-20 w-[110px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-semibold transition hover:bg-primary/[0.06] ${value === opt.value ? 'bg-primary/[0.07] text-primary' : 'text-ink/75'}`}>
              {opt.label}
              {value === opt.value && <span className={`h-2 w-2 rounded-full ${GRAD_BTN}`}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CreatorTargetCard() {
  const [targetConversion,  setTargetConversion]  = useState(5)
  const [targetEngagement,  setTargetEngagement]  = useState(8)
  const [contentPerCreator, setContentPerCreator] = useState(2)
  const convGap    = Math.max(0, targetConversion - CURRENT_AVG_CONVERSION_RATE)
  const engGap     = Math.max(0, targetEngagement - CURRENT_AVG_ENGAGEMENT_RATE)
  const needed     = Math.max(0, Math.ceil(Math.max(convGap * 1.5, engGap * 1.0) - (contentPerCreator - 1) * 0.4))
  const convProg   = Math.min(100, Math.round((CURRENT_AVG_CONVERSION_RATE / Math.max(targetConversion, 0.01)) * 100))
  const engProg    = Math.min(100, Math.round((CURRENT_AVG_ENGAGEMENT_RATE  / Math.max(targetEngagement,  0.01)) * 100))
  const allMet     = needed === 0
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><TargetIcon s={18}/></span>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-ink/50">Creator performance targets</p>
            <p className="mt-0.5 text-[11.5px] text-ink/35">Set your targets — we'll tell you how many more creators you need</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <GoalSelect label="Target conversion:"   value={targetConversion}  options={TARGET_CONVERSION_OPTIONS}    onChange={setTargetConversion}/>
          <GoalSelect label="Target engagement:"   value={targetEngagement}  options={TARGET_ENGAGEMENT_OPTIONS}    onChange={setTargetEngagement}/>
          <GoalSelect label="Content per creator:" value={contentPerCreator} options={CONTENT_PER_CREATOR_OPTIONS}  onChange={setContentPerCreator}/>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: 'Conversion rate', cur: CURRENT_AVG_CONVERSION_RATE, tgt: targetConversion, prog: convProg },
          { label: 'Engagement rate', cur: CURRENT_AVG_ENGAGEMENT_RATE, tgt: targetEngagement, prog: engProg  },
        ].map(bar => (
          <div key={bar.label} className="rounded-xl bg-surface-sub p-4">
            <div className="flex items-end justify-between mb-2">
              <span className="text-[12px] font-medium text-ink/45">{bar.label}</span>
              <span className={`text-[12px] font-bold ${bar.cur >= bar.tgt ? 'text-emerald-600' : 'text-ink/55'}`}>
                {bar.cur}% <span className="font-medium text-ink/35">/ {bar.tgt}%</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary/[0.08]">
              <div className={`h-full rounded-full transition-all duration-700 ${bar.cur >= bar.tgt ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : GRAD_BTN}`}
                style={{ width: `${bar.prog}%` }}/>
            </div>
            <p className="mt-1.5 text-[11px] text-ink/35">
              {bar.cur >= bar.tgt ? '✓ Target met' : `${(bar.tgt - bar.cur).toFixed(1)}% gap remaining`}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {allMet ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5">
            <span className="text-emerald-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="text-[13px] font-bold text-emerald-700">All targets met with your current creator roster 🎉</span>
          </div>
        ) : (
          <>
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${GRAD_BTN}`}>
              <UsersIcon s={15}/>
              <span className="text-[13px] font-bold text-white">{needed} more creator{needed !== 1 ? 's' : ''} needed</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-sub px-4 py-2.5">
              <ImageIcon s={15}/>
              <span className="text-[13px] font-semibold text-ink/70"><span className="font-extrabold text-ink">{needed * contentPerCreator}</span> more piece{needed * contentPerCreator !== 1 ? 's' : ''} of content</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-sub px-4 py-2.5">
              <UsersIcon s={15}/>
              <span className="text-[13px] font-semibold text-ink/70"><span className="font-extrabold text-ink">{CURRENT_ACTIVE_CREATORS + needed}</span> total creators to hit targets</span>
            </div>
            <p className="ml-1 text-[11.5px] text-ink/35">
              At {contentPerCreator} piece{contentPerCreator !== 1 ? 's' : ''}/creator · targets: {targetConversion}% CVR, {targetEngagement}% ER
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════ RANGE DROPDOWN ═══════════════════════════ */
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

/* ═══════════════════════ VIEWS CHART ══════════════════════════════ */
function ViewsChart({ data }: { data: { label: string; views: number }[] }) {
  const rawId = useId()
  const id    = rawId.replace(/:/g, '')
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
  const te = Math.max(1, Math.ceil(n / 6))
  const ticks = data.map((_, i) => i).filter(i => i % te === 0 || i === n - 1)
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
        <path d={ap} fill={`url(#${id}-a)`}/>
        <path d={lp} fill="none" stroke={`url(#${id}-l)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
          {hp.label} · {hp.views.toLocaleString()} profile views
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
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/40">Profile views</p>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="text-[32px] font-black tracking-[-0.03em] text-ink">{total.toLocaleString()}</span>
            {delta && <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold ${delta.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><TrendIcon up={delta.positive} s={11}/>{delta.label}</span>}
          </div>
          <p className="mt-1 text-[12px] font-medium text-ink/40">{delta ? `vs previous ${range} days` : `Last ${range} days`} · creators discovering your profile</p>
        </div>
        <RangeDropdown value={range} onChange={onRangeChange}/>
      </div>
      <div className="mt-6 flex flex-1 flex-col min-h-0"><ViewsChart data={slice}/></div>
    </div>
  )
}

/* ═══════════════════════ NOTIFICATIONS PANEL ══════════════════════ */
const NOTIFICATION_STYLE: Record<NotificationType, { icon: ReactNode; bg: string; text: string }> = {
  application:  { icon: <ChatBubbleIcon s={16}/>, bg: 'bg-primary/[0.08]', text: 'text-primary'     },
  profile_view: { icon: <EyeIcon s={16}/>,        bg: 'bg-sky-50',         text: 'text-sky-600'     },
  payout:       { icon: <EuroIcon s={16}/>,       bg: 'bg-emerald-50',     text: 'text-emerald-600' },
  deal:         { icon: <HandshakeIcon s={16}/>,  bg: 'bg-amber-50',       text: 'text-amber-600'   },
  insight:      { icon: <LightbulbIcon s={16}/>,  bg: 'bg-violet-50',      text: 'text-violet-600'  },
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

/* ═══════════════════════════════════════════════════════════════════
   ALL CAMPAIGNS MODAL
   Triggered by "View all" in the running campaigns row.
   Shows every campaign as a larger card. Clicking one routes to its
   tracker page at /brand/campaign/[id].
   ═══════════════════════════════════════════════════════════════════ */
function AllCampaignsModal({ open, onClose, onSelect }: {
  open: boolean
  onClose: () => void
  onSelect: (id: string) => void
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>

      {/* Panel */}
      <div className={`relative z-10 flex w-full max-w-[760px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(90vh, 720px)' }}>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-ink">All campaigns</h2>
            <p className="mt-0.5 text-[12px] text-ink/45">{ACTIVE_CAMPAIGNS.length} campaigns · click any to open the tracker</p>
          </div>
          <button onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-[15px] text-ink/50 transition hover:bg-ink/10">
            ✕
          </button>
        </div>

        {/* Campaign list — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ACTIVE_CAMPAIGNS.map(c => {
              const st = STATUS_META[c.status]
              const objCls = OBJECTIVE_COLOR[c.objective] ?? 'text-ink/60 bg-surface-sub'
              return (
                <button key={c.id} type="button"
                  onClick={() => { onClose(); onSelect(c.id) }}
                  className={`group flex flex-col rounded-2xl border border-primary/10 bg-white p-5 text-left transition hover:-translate-y-1 ${CARD}`}
                  style={{ transition: 'transform 0.18s ease, box-shadow 0.18s ease' }}>

                  {/* Top: accent strip + title */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${c.color}18` }}>
                      <PlayIcon s={15}/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-extrabold leading-tight text-ink">{c.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg px-2.5 py-0.5 text-[10.5px] font-bold ${objCls}`}>{c.objective}</span>
                        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${st.bg} ${st.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3 metrics */}
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-primary/8 pt-4">
                    {[
                      { label: 'Views',       value: c.metrics.views       },
                      { label: 'Engagement',  value: c.metrics.engagement  },
                      { label: 'Conversions', value: c.metrics.conversions },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <div className={`text-[15px] font-black tracking-[-0.02em] ${GRAD_TEXT}`}>{m.value}</div>
                        <div className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink/35">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-primary/8 pt-3.5">
                    <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink/50">
                      <UsersIcon s={12}/>{c.creators} creator{c.creators !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1 text-[11px] text-ink/40"><ClockIcon s={11}/>Ends {c.endDate}</span>
                      <span className="text-[11.5px] font-bold text-ink/70">{c.budget}</span>
                    </div>
                  </div>

                  {/* Open tracker hint */}
                  <div className={`mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold text-primary transition group-hover:opacity-100 ${GRAD_BTN} text-white opacity-0`}>
                    Open tracker <ArrowRightIcon s={12}/>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
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

/* ═══════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function BrandDashboardPage() {
  const router = useRouter()
  const [range,              setRange]              = useState<RangeOption>(7)
  const [notifications,      setNotifications]      = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [allCampaignsOpen,   setAllCampaignsOpen]   = useState(false)

  const unreadNotifs   = notifications.filter(n => n.unread).length
  const unreadMessages = UNREAD_MESSAGE_COUNT

  const markNotifRead    = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  const markAllNotifRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))

  const goToMessages    = () => router.push('/messages')
  const goToNewCampaign = () => router.push('/brand/campaign/new')
  const goToCampaign    = (id: string) => id === 'new' ? goToNewCampaign() : router.push(`/brand/campaign/${id}`)

  const NAV_LEFT = [
    { label: 'Dashboard',         active: true,  action: () => {} },
    { label: 'Discover Creators', active: false, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ ALL CAMPAIGNS MODAL ════ */}
      <AllCampaignsModal
        open={allCampaignsOpen}
        onClose={() => setAllCampaignsOpen(false)}
        onSelect={goToCampaign}
      />

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

            {/* Right nav — icon buttons + My Profile text */}
            <div className="relative z-10 flex items-center gap-1.5">
              {/* Messages icon */}
              <button onClick={goToMessages} title="Messages" aria-label="Messages"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <ChatBubbleIcon s={18}/>
                {unreadMessages > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>
                    {unreadMessages}
                  </span>
                )}
              </button>
              {/* Notifications icon */}
              <button title="Notifications" aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <BellIcon s={18}/>
                {unreadNotifs > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>
                    {unreadNotifs}
                  </span>
                )}
              </button>
              {/* My Profile text */}
              <button className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:flex">
                My Profile
              </button>
            </div>

            {/* Logo — absolutely centred */}
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
              Welcome back, {BRAND.name} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1 text-[14px] text-ink/55">Here's how your creator partnerships have been performing.</p>
          </div>
          <a href={`/brand/${BRAND.slug}`}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30">
            View public profile
          </a>
        </div>

        {/* Campaign strip */}
        <div className="mt-6">
          <CampaignStrip onClick={goToNewCampaign}/>
        </div>

        {/* Running campaigns */}
        <div className="mt-4">
          <ActiveCampaignsRow
            onCampaignClick={goToCampaign}
            onViewAll={() => setAllCampaignsOpen(true)}
          />
        </div>

        {/* 4 stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<UsersIcon s={18}/>}  label="Active creators"      value={String(CURRENT_ACTIVE_CREATORS)}   sublabel="Currently deployed"         delta={{ label: '+3 this month',        positive: true }}/>
          <StatCard icon={<ZapIcon s={18}/>}    label="Avg. conversion rate" value={`${CURRENT_AVG_CONVERSION_RATE}%`} sublabel="Across all active creators" delta={{ label: '+0.6% vs last month', positive: true }}/>
          <StatCard icon={<EyeIcon s={18}/>}    label="Avg. engagement rate" value={`${CURRENT_AVG_ENGAGEMENT_RATE}%`} sublabel="Across all active creators" delta={{ label: '+1.1% vs last month', positive: true }}/>
          <StatCard icon={<ImageIcon s={18}/>}  label="Pieces of content"    value={String(CURRENT_PIECES_OF_CONTENT)} sublabel="Published this month"       delta={{ label: '+5 this week',         positive: true }}/>
        </div>

        {/* Creator target card */}
        <div className="mt-4">
          <CreatorTargetCard/>
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