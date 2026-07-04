'use client'

import { useState, useEffect, useRef, useId, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Admin Dashboard — app/admin/dashboard/page.tsx
   Nexfluence v4, LIGHT (dark sidebar variant)

   WHO THIS IS FOR:
   Nexfluence employees monitoring the marketplace. They are not
   brands, creators, or agencies — they are the platform's internal
   operating team. This page is their command centre.

   THE FOUR THINGS THE USER ASKED FOR:
   ─────────────────────────────────────────────────────────────────
   1. PERSONA DROPDOWN — "Dashboard of Creator / Agency / Brands / All"
      Controls which user type the dashboard stats are scoped to.
      Every number, chart, and table on the page changes when you
      switch. Options: All Users · Brands · Creators · Agencies

   2. TIMEZONE SELECTOR — "In what time you are looking at"
      Admin team operates from Riga but monitors across the Baltics.
      Live clock in the chosen timezone sits in the header bar.
      Timezone affects all "last active", "time spent" and timestamp
      displays across the page.

   3. NOTIFICATIONS PANEL — same structural pattern as user dashboards
      but with admin-specific event types: new_signup, dispute_filed,
      payment_flagged, content_violation, kyc_pending, system_alert.
      Unread badge in the header bell icon.

   4. AVERAGE TIME SPENT — prominent KPI card with per-session value,
      weekly trend chart (7-day bar), and persona breakdown so admin
      can see which user type is most / least engaged.

   ADDITIONAL MEANINGFUL ADMIN METRICS:
   (These are things a marketplace operator needs to see that no user
   dashboard provides — GMV, conversion funnel, dispute rate, payout
   health, DAC7 compliance progress.)

   LAYOUT: Dark left sidebar (nav) + light main area — intentionally
   different from the user nav pill pattern so admins can instantly
   tell they are in an admin context.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ─── Persona filter ─────────────────────────────────────────────── */
type PersonaFilter = 'all' | 'brands' | 'creators' | 'agencies'
const PERSONA_OPTIONS: { id: PersonaFilter; label: string; icon: ReactNode; color: string }[] = [
  { id: 'all',      label: 'All Users',   icon: null, color: '#8B31E8' },
  { id: 'brands',   label: 'Brands',      icon: null, color: '#2563EB' },
  { id: 'creators', label: 'Creators',    icon: null, color: '#DB2777' },
  { id: 'agencies', label: 'Agencies',    icon: null, color: '#059669' },
]

/* ─── Timezone options ───────────────────────────────────────────── */
interface TZOption { id: string; label: string; iana: string; offset: string }
const TZ_OPTIONS: TZOption[] = [
  { id: 'riga',     label: 'Riga (Latvia)',       iana: 'Europe/Riga',     offset: 'UTC+3' },
  { id: 'tallinn',  label: 'Tallinn (Estonia)',   iana: 'Europe/Tallinn',  offset: 'UTC+3' },
  { id: 'vilnius',  label: 'Vilnius (Lithuania)', iana: 'Europe/Vilnius',  offset: 'UTC+3' },
  { id: 'london',   label: 'London (UK)',         iana: 'Europe/London',   offset: 'UTC+1' },
  { id: 'utc',      label: 'UTC',                 iana: 'UTC',             offset: 'UTC+0' },
]

/* ─── Notification types ─────────────────────────────────────────── */
type AdminNotifType = 'new_signup' | 'dispute_filed' | 'payment_flagged' | 'content_violation' | 'kyc_pending' | 'system_alert'

interface AdminNotif {
  id: string; type: AdminNotifType; title: string; sub: string; time: string; unread: boolean; severity: 'info' | 'warn' | 'crit'
}

const INITIAL_NOTIFS: AdminNotif[] = [
  { id: 'an1', type: 'payment_flagged',   title: 'Payment flagged — €4,200 above threshold',    sub: 'Lumora Skincare · Grade ref PAY-2026-8812',                                    time: '8m ago',   unread: true,  severity: 'crit' },
  { id: 'an2', type: 'dispute_filed',     title: 'Dispute filed — tripartite contract breach',   sub: 'Baltic Creators Agency vs Forma Fit · TKT-2026-0040',                         time: '42m ago',  unread: true,  severity: 'warn' },
  { id: 'an3', type: 'kyc_pending',       title: 'KYC pending >72h — agency account stalled',    sub: 'NordGlow Agency · joined Jun 28 · documents not uploaded',                    time: '2h ago',   unread: true,  severity: 'warn' },
  { id: 'an4', type: 'new_signup',        title: '3 new brands signed up this hour',              sub: 'SportElite OÜ · Reval Nutrition · FreshFarm Foods',                           time: '1h ago',   unread: true,  severity: 'info' },
  { id: 'an5', type: 'content_violation', title: 'Content review flagged — off-brief submission', sub: 'Jonas Petrauskas · campaign Vitality Stack Q2 · 1 piece flagged',             time: '3h ago',   unread: false, severity: 'warn' },
  { id: 'an6', type: 'system_alert',      title: 'Grade webhook latency — payouts delayed 8min',  sub: 'Affecting 3 campaigns · auto-resolved at 14:22',                              time: '4h ago',   unread: false, severity: 'crit' },
  { id: 'an7', type: 'new_signup',        title: 'Creator milestone — 500th creator onboarded',   sub: 'Elīna Krūmiņa · @elina.active · 67K Instagram · Latvia',                     time: '6h ago',   unread: false, severity: 'info' },
  { id: 'an8', type: 'dispute_filed',     title: 'Dispute escalated by creator to Nexfluence',   sub: 'Sandra Liepa · brand Kinetics · payment overdue 18 days · TKT-2026-0038',    time: '1d ago',   unread: false, severity: 'warn' },
]

/* ─── Per-persona KPI datasets ───────────────────────────────────── */
interface KPISet {
  totalUsers: number; activeToday: number; newThisWeek: number; churnRate: string
  avgTimeSpent: string; avgSessionsPerWeek: number
  gmv: string; gmvDelta: string; gmvUp: boolean
  campaigns: number; activeCampaigns: number
  disputeRate: string; payoutHealth: string
  conversionRate: string
  timeSpentTrend: number[]  // 7 days, Mon–Sun, in minutes
  sessionTrend: number[]
}

const KPI_DATA: Record<PersonaFilter, KPISet> = {
  all: {
    totalUsers: 1847, activeToday: 312, newThisWeek: 84, churnRate: '1.8%',
    avgTimeSpent: '14m 22s', avgSessionsPerWeek: 5.2,
    gmv: '€284,500', gmvDelta: '+18.4%', gmvUp: true,
    campaigns: 142, activeCampaigns: 67,
    disputeRate: '2.1%', payoutHealth: '98.6%',
    conversionRate: '4.3%',
    timeSpentTrend: [11, 14, 13, 16, 15, 18, 14],
    sessionTrend:   [4.8, 5.1, 4.9, 5.6, 5.3, 5.8, 5.2],
  },
  brands: {
    totalUsers: 384, activeToday: 91, newThisWeek: 22, churnRate: '0.9%',
    avgTimeSpent: '8m 47s', avgSessionsPerWeek: 3.8,
    gmv: '€284,500', gmvDelta: '+18.4%', gmvUp: true,
    campaigns: 142, activeCampaigns: 67,
    disputeRate: '1.4%', payoutHealth: '99.1%',
    conversionRate: '—',
    timeSpentTrend: [7, 9, 8, 10, 9, 11, 8],
    sessionTrend:   [3.5, 3.9, 3.7, 4.1, 3.8, 4.2, 3.8],
  },
  creators: {
    totalUsers: 1348, activeToday: 198, newThisWeek: 57, churnRate: '2.4%',
    avgTimeSpent: '19m 08s', avgSessionsPerWeek: 6.1,
    gmv: '—', gmvDelta: '—', gmvUp: true,
    campaigns: 142, activeCampaigns: 67,
    disputeRate: '2.7%', payoutHealth: '97.9%',
    conversionRate: '—',
    timeSpentTrend: [16, 20, 18, 22, 21, 24, 19],
    sessionTrend:   [5.6, 6.0, 5.8, 6.4, 6.1, 6.7, 6.1],
  },
  agencies: {
    totalUsers: 115, activeToday: 23, newThisWeek: 5, churnRate: '0.6%',
    avgTimeSpent: '22m 55s', avgSessionsPerWeek: 7.4,
    gmv: '€68,200', gmvDelta: '+31.2%', gmvUp: true,
    campaigns: 48, activeCampaigns: 31,
    disputeRate: '3.2%', payoutHealth: '98.2%',
    conversionRate: '—',
    timeSpentTrend: [19, 24, 22, 26, 25, 28, 23],
    sessionTrend:   [6.9, 7.3, 7.1, 7.8, 7.5, 8.0, 7.4],
  },
}

/* ─── Recent users table ─────────────────────────────────────────── */
const RECENT_USERS = [
  { id: 'u1', name: 'SportElite OÜ',           type: 'brand',   status: 'active',   joined: 'Jun 30, 2026', gmv: '€0',      campaigns: 0, lastActive: '8m ago'  },
  { id: 'u2', name: 'Elīna Krūmiņa',           type: 'creator', status: 'active',   joined: 'Jun 30, 2026', gmv: '—',       campaigns: 0, lastActive: '6h ago'  },
  { id: 'u3', name: 'Baltic Creators Agency',  type: 'agency',  status: 'active',   joined: 'Jan 10, 2026', gmv: '€18,450', campaigns: 14, lastActive: '2h ago' },
  { id: 'u4', name: 'Kinetics',                type: 'brand',   status: 'active',   joined: 'Jan 15, 2026', gmv: '€41,200', campaigns: 8,  lastActive: '1h ago' },
  { id: 'u5', name: 'Amelia Roze',             type: 'creator', status: 'active',   joined: 'Feb 3, 2026',  gmv: '—',       campaigns: 5,  lastActive: '3h ago' },
  { id: 'u6', name: 'NordGlow Agency',         type: 'agency',  status: 'kyc_hold', joined: 'Jun 28, 2026', gmv: '€0',      campaigns: 0, lastActive: '2d ago'  },
  { id: 'u7', name: 'Lumora Skincare',         type: 'brand',   status: 'active',   joined: 'Mar 5, 2026',  gmv: '€29,700', campaigns: 5,  lastActive: '4h ago' },
  { id: 'u8', name: 'Jonas Petrauskas',        type: 'creator', status: 'flagged',  joined: 'May 12, 2026', gmv: '—',       campaigns: 2,  lastActive: '5h ago' },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function ChevDown({ s = 14 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BellIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SearchIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function TrendUp({ s = 12 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TrendDown({ s = 12 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ClockIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function UsersIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 21v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ActivityIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ZapIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ShieldIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function LogoutIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function GlobeIcon({ s = 14 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2c-2.8 3-4 6-4 10s1.2 7 4 10M12 2c2.8 3 4 6 4 10s-1.2 7-4 10M2 12h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function BriefcaseIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function BuildingIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function DashboardIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> }
function AlertIcon({ s = 14 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function FlagIcon({ s = 13 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function CheckIcon({ s = 12 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   LIVE CLOCK
   ════════════════════════════════════════════════════════════════════ */
function LiveClock({ iana }: { iana: string }) {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { timeZone: iana, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [iana])
  return <span className="font-mono text-[13px] font-bold text-ink/60 tabular-nums">{time}</span>
}

/* ════════════════════════════════════════════════════════════════════
   ANIMATED STAT — number counts up when it enters viewport
   ════════════════════════════════════════════════════════════════════ */
function AnimStat({ value, prefix = '', suffix = '', duration = 1200 }: { value: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [displayed, setDisplayed] = useState(0)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setStarted(true); io.disconnect() } }, { threshold: 0.5 })
    io.observe(el); return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!started) return
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplayed(Math.round(value * eased))
      if (p < 1) requestAnimationFrame(tick)
      else setDisplayed(value)
    }
    requestAnimationFrame(tick)
  }, [started, value, duration])
  return <span ref={ref}>{prefix}{displayed.toLocaleString()}{suffix}</span>
}

/* ════════════════════════════════════════════════════════════════════
   TIME-SPENT MINI BAR CHART — the "#4" metric the user asked for
   ════════════════════════════════════════════════════════════════════ */
function TimeSpentChart({ data, persona }: { data: number[]; persona: PersonaFilter }) {
  const rawId = useId()
  const id = rawId.replace(/:/g, '')
  const [hov, setHov] = useState<number | null>(null)
  const W = 400, H = 110, PL = 8, PR = 8, PT = 12, PB = 28
  const iW = W - PL - PR, iH = H - PT - PB
  const n = data.length
  const max = Math.max(...data, 1)
  const barW = iW / n - 4
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const personaColor: Record<PersonaFilter, string> = { all: '#8B31E8', brands: '#2563EB', creators: '#DB2777', agencies: '#059669' }
  const col = personaColor[persona]

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full cursor-crosshair"
        onMouseLeave={() => setHov(null)}>
        <defs>
          <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.85"/>
            <stop offset="100%" stopColor={col} stopOpacity="0.35"/>
          </linearGradient>
          <linearGradient id={`${id}-hov`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col}/>
            <stop offset="100%" stopColor={col} stopOpacity="0.6"/>
          </linearGradient>
        </defs>
        {data.map((v, i) => {
          const x = PL + i * (iW / n) + (iW / n - barW) / 2
          const barH = (v / max) * iH
          const y = PT + iH - barH
          const active = hov === i
          return (
            <g key={i} onMouseEnter={() => setHov(i)}>
              <rect x={x} y={y} width={barW} height={barH} rx={3}
                fill={active ? `url(#${id}-hov)` : `url(#${id}-bar)`}
                style={{ transition: 'fill 0.15s' }}/>
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="9" fontWeight="600"
                fill={active ? col : '#8A8590'}>{days[i]}</text>
              {active && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9.5" fontWeight="800" fill={col}>
                  {v}m
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   KPI STAT CARD
   ════════════════════════════════════════════════════════════════════ */
function KPICard({ icon, label, value, rawValue, delta, deltaUp, sub, iconBg }: {
  icon: ReactNode; label: string; value: string; rawValue?: number
  delta?: string; deltaUp?: boolean; sub?: string; iconBg: string
}) {
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white ${iconBg}`}>{icon}</div>
        {delta && (
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${deltaUp !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {deltaUp !== false ? <TrendUp s={11}/> : <TrendDown s={11}/>}{delta}
          </span>
        )}
      </div>
      <div>
        <div className="text-[26px] font-black tracking-[-0.03em] text-ink">
          {rawValue !== undefined ? <AnimStat value={rawValue}/> : value}
        </div>
        <div className="mt-0.5 text-[12.5px] font-medium text-ink/50">{label}</div>
        {sub && <div className="mt-0.5 text-[11px] text-ink/35">{sub}</div>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PERSONA DROPDOWN
   ════════════════════════════════════════════════════════════════════ */
function PersonaDropdown({ value, onChange }: { value: PersonaFilter; onChange: (p: PersonaFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = PERSONA_OPTIONS.find(p => p.id === value)!

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', h); window.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('keydown', esc) }
  }, [])

  const personaIcon: Record<PersonaFilter, ReactNode> = {
    all:      <UsersIcon s={14}/>,
    brands:   <BuildingIcon s={14}/>,
    creators: <ActivityIcon s={14}/>,
    agencies: <BriefcaseIcon s={14}/>,
  }
  const personaColor: Record<PersonaFilter, string> = { all: '#8B31E8', brands: '#2563EB', creators: '#DB2777', agencies: '#059669' }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-bold transition ${open ? 'border-primary/30 bg-primary/[0.06] text-primary' : 'border-primary/15 bg-white text-ink/70 hover:border-primary/25 hover:text-ink'} ${CARD}`}>
        <span style={{ color: personaColor[value] }}>{personaIcon[value]}</span>
        {current.label}
        <ChevDown s={13}/>
      </button>
      {open && (
        <div className={`absolute left-0 top-[calc(100%+8px)] z-30 w-[200px] overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
          <div className="border-b border-primary/8 px-4 py-2.5">
            <p className="text-[10.5px] font-black uppercase tracking-[0.14em] text-ink/35">View dashboard for</p>
          </div>
          {PERSONA_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false) }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-primary/[0.04] ${value === opt.id ? 'bg-primary/[0.05]' : ''}`}>
              <span style={{ color: personaColor[opt.id] }}>{personaIcon[opt.id]}</span>
              <span className={`text-[13px] font-semibold ${value === opt.id ? 'text-primary font-bold' : 'text-ink/70'}`}>{opt.label}</span>
              {value === opt.id && <span className={`ml-auto flex h-4 w-4 items-center justify-center rounded-full text-white ${GRAD_BTN}`}><CheckIcon s={9}/></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TIMEZONE DROPDOWN
   ════════════════════════════════════════════════════════════════════ */
function TimezoneDropdown({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = TZ_OPTIONS.find(t => t.id === value)!

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-semibold text-ink/60 transition hover:border-primary/20 hover:text-ink ${open ? 'border-primary/25' : 'border-primary/12 bg-white'}`}>
        <GlobeIcon s={13}/>
        <span>{current.label}</span>
        <ChevDown s={12}/>
      </button>
      {open && (
        <div className={`absolute right-0 top-[calc(100%+6px)] z-30 w-[230px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
          {TZ_OPTIONS.map(tz => (
            <button key={tz.id} onClick={() => { onChange(tz.id); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-[12.5px] transition hover:bg-primary/[0.04] ${value === tz.id ? 'bg-primary/[0.05] text-primary font-bold' : 'text-ink/70'}`}>
              <span>{tz.label}</span>
              <span className="text-[11px] text-ink/35">{tz.offset}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   NOTIFICATIONS PANEL
   ════════════════════════════════════════════════════════════════════ */
const NOTIF_CFG: Record<AdminNotifType, { bg: string; text: string; icon: ReactNode }> = {
  new_signup:        { bg: 'bg-primary/[0.08]',    text: 'text-primary',     icon: <UsersIcon s={15}/> },
  dispute_filed:     { bg: 'bg-amber-50',           text: 'text-amber-700',   icon: <TicketIcon s={15}/> },
  payment_flagged:   { bg: 'bg-rose-50',            text: 'text-rose-600',    icon: <AlertIcon s={15}/> },
  content_violation: { bg: 'bg-orange-50',          text: 'text-orange-700',  icon: <FlagIcon s={14}/> },
  kyc_pending:       { bg: 'bg-sky-50',             text: 'text-sky-700',     icon: <ShieldIcon s={15}/> },
  system_alert:      { bg: 'bg-rose-50',            text: 'text-rose-600',    icon: <ZapIcon s={15}/> },
}
const SEVERITY_DOT: Record<string, string> = { crit: 'bg-rose-500', warn: 'bg-amber-400', info: 'bg-primary/50' }

function NotificationsPanel({ items, onMarkRead, onMarkAll }: {
  items: AdminNotif[]; onMarkRead: (id: string) => void; onMarkAll: () => void
}) {
  const unread = items.filter(n => n.unread).length
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
      <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/8 px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-bold text-ink">Alerts & notifications</h3>
          {unread > 0 && <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-black text-white ${GRAD_BTN}`}>{unread}</span>}
        </div>
        {unread > 0 && <button onClick={onMarkAll} className="text-[12px] font-bold text-primary hover:underline">Mark all read</button>}
      </div>
      <div className="max-h-[440px] divide-y divide-primary/6 overflow-y-auto">
        {items.map(n => {
          const cfg = NOTIF_CFG[n.type]
          return (
            <button key={n.id} onClick={() => onMarkRead(n.id)}
              className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition hover:bg-primary/[0.02] ${n.unread ? 'bg-primary/[0.015]' : ''}`}>
              <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.text}`}>{cfg.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold leading-[1.35] text-ink/80">{n.title}</p>
                <p className="mt-0.5 truncate text-[11px] text-ink/40">{n.sub}</p>
                <span className="mt-1 block text-[10.5px] font-medium text-ink/35">{n.time}</span>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1.5 pt-0.5">
                {n.unread && <span className={`h-2 w-2 flex-shrink-0 rounded-full ${SEVERITY_DOT[n.severity]}`}/>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   USERS TABLE
   ════════════════════════════════════════════════════════════════════ */
function UserRow({ u, persona }: { u: typeof RECENT_USERS[number]; persona: PersonaFilter }) {
  if (persona !== 'all' && u.type !== persona.slice(0, -1)) return null
  const typeColor: Record<string, string> = { brand: '#2563EB', creator: '#DB2777', agency: '#059669' }
  const typeLabel: Record<string, string> = { brand: 'Brand', creator: 'Creator', agency: 'Agency' }
  const statusCfg: Record<string, { bg: string; text: string; label: string }> = {
    active:   { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active'   },
    kyc_hold: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'KYC hold' },
    flagged:  { bg: 'bg-rose-50',    text: 'text-rose-600',    label: 'Flagged'  },
  }
  const sc = statusCfg[u.status] ?? statusCfg['active']!
  return (
    <tr className="group border-b border-primary/6 hover:bg-primary/[0.02] transition">
      <td className="py-3 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white text-[11px] font-black"
            style={{ background: typeColor[u.type] ?? '#8B31E8' }}>
            {u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-[13px] font-semibold text-ink">{u.name}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className="rounded-lg px-2 py-0.5 text-[11px] font-bold" style={{ background: `${typeColor[u.type]}15`, color: typeColor[u.type] }}>
          {typeLabel[u.type]}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span>
      </td>
      <td className="px-3 py-3 text-[12.5px] text-ink/50">{u.joined}</td>
      <td className="px-3 py-3 text-[12.5px] font-semibold text-ink/70">{u.gmv}</td>
      <td className="px-3 py-3 text-[12.5px] text-ink/50">{u.campaigns}</td>
      <td className="py-3 pl-3 pr-5 text-[12.5px] text-ink/40">{u.lastActive}</td>
    </tr>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const router = useRouter()

  const [persona,   setPersona]   = useState<PersonaFilter>('all')
  const [tzId,      setTzId]      = useState('riga')
  const [notifs,    setNotifs]    = useState<AdminNotif[]>(INITIAL_NOTIFS)
  const [notifOpen, setNotifOpen] = useState(false)
  const [search,    setSearch]    = useState('')
  const notifRef = useRef<HTMLDivElement>(null)

  const kpi     = KPI_DATA[persona as PersonaFilter]
  const tz      = TZ_OPTIONS.find(t => t.id === tzId)!
  const unread  = notifs.filter(n => n.unread).length

  useEffect(() => {
    const h = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const markRead    = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })))

  const personaGradient: Record<PersonaFilter, string> = {
    all:      GRAD_BTN,
    brands:   'bg-gradient-to-r from-blue-500 to-blue-700',
    creators: 'bg-gradient-to-r from-pink-500 to-rose-600',
    agencies: 'bg-gradient-to-r from-emerald-500 to-teal-600',
  }
  const pg = personaGradient[persona as PersonaFilter]

  const filteredUsers = RECENT_USERS.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false
    if (persona !== 'all' && u.type !== persona.slice(0, -1)) return false
    return true
  })

  return (
    <div className="flex min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ LEFT SIDEBAR — dark, always-visible on desktop ════ */}
      <aside className="hidden w-[220px] flex-shrink-0 flex-col bg-[#0A0612] lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-5 py-5">
          <NexLogo className="h-8 drop-shadow-[0_2px_10px_rgba(139,49,232,0.5)]"/>
          <div className="flex h-5 items-center rounded-md border border-amber-400/25 bg-amber-400/10 px-2">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-400">Admin</span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {[
            { icon: <DashboardIcon s={15}/>, label: 'Dashboard',  active: true, href: '/admin/dashboard' },
            { icon: <UsersIcon s={15}/>,     label: 'Users',      active: false, href: '/admin/users'    },
            { icon: <ActivityIcon s={15}/>,  label: 'Campaigns',  active: false, href: '/admin/campaigns' },
            { icon: <EuroIcon s={15}/>,      label: 'Payments',   active: false, href: '/admin/payments'  },
            { icon: <TicketIcon s={15}/>,    label: 'Disputes',   active: false, href: '/admin/disputes'  },
            { icon: <ShieldIcon s={15}/>,    label: 'Compliance', active: false, href: '/admin/compliance' },
            { icon: <ZapIcon s={15}/>,       label: 'System',     active: false, href: '/admin/system'    },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${item.active ? `${pg} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]` : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/[0.07] px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${pg}`}>H</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-white">Harshul G.</p>
              <p className="text-[11px] text-white/35">Founder</p>
            </div>
            <button onClick={() => router.push('/admin/login')} className="text-white/30 transition hover:text-white/60"><LogoutIcon s={15}/></button>
          </div>
        </div>
      </aside>

      {/* ════ MAIN AREA ════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ════ TOP BAR ════ */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-primary/10 bg-white/95 px-6 py-3 backdrop-blur-xl">
          <div className="flex flex-1 items-center gap-3">
            {/* Persona dropdown — the first of the four asked-for features */}
            <PersonaDropdown value={persona} onChange={setPersona}/>

            {/* Timezone selector — the second */}
            <TimezoneDropdown value={tzId} onChange={setTzId}/>

            {/* Live clock in selected timezone */}
            <div className="hidden items-center gap-1.5 rounded-xl border border-primary/10 bg-surface-sub px-3 py-2 sm:flex">
              <ClockIcon s={13}/>
              <LiveClock iana={tz.iana}/>
              <span className="text-[11px] text-ink/35">{tz.offset}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden sm:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={14}/></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search users…"
                className="w-[180px] rounded-xl border border-primary/12 bg-surface-sub py-2 pl-9 pr-3.5 text-[13px] outline-none placeholder:text-ink/30 focus:border-primary/30 focus:bg-white focus:w-[220px] transition-all"/>
            </div>

            {/* Notifications bell — the third asked-for feature */}
            <div ref={notifRef} className="relative">
              <button onClick={() => setNotifOpen(o => !o)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition hover:bg-primary/[0.07] ${notifOpen ? 'bg-primary/[0.07] text-primary' : 'text-ink/60'}`}>
                <BellIcon s={18}/>
                {unread > 0 && <span className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${GRAD_BTN}`}>{unread}</span>}
              </button>
              {notifOpen && (
                <div className={`absolute right-0 top-[calc(100%+10px)] z-50 w-[380px] overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
                  <NotificationsPanel items={notifs} onMarkRead={id => { markRead(id); setNotifOpen(false) }} onMarkAll={markAllRead}/>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ════ PAGE CONTENT ════ */}
        <main className="flex-1 px-6 py-7 overflow-auto">

          {/* Page title + persona indicator */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[24px] font-black tracking-[-0.03em] text-ink">
                Marketplace overview
                {persona !== 'all' && <> · <span className={GRAD_TXT}>{PERSONA_OPTIONS.find(p => p.id === persona)?.label}</span></>}
              </h1>
              <p className="mt-0.5 text-[13px] text-ink/45">
                {new Date().toLocaleDateString('en-GB', { timeZone: tz.iana, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {tz.label}
              </p>
            </div>
            {/* Critical alert count strip */}
            {notifs.filter(n => n.unread && n.severity === 'crit').length > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5">
                <AlertIcon s={15}/>
                <span className="text-[12.5px] font-bold text-rose-700">
                  {notifs.filter(n => n.unread && n.severity === 'crit').length} critical alert{notifs.filter(n => n.unread && n.severity === 'crit').length !== 1 ? 's' : ''} need attention
                </span>
                <button onClick={() => setNotifOpen(true)} className="text-[12px] font-bold text-rose-500 hover:underline">View</button>
              </div>
            )}
          </div>

          {/* ── ROW 1: 4 core KPI cards ── */}
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard icon={<UsersIcon s={18}/>} label="Total users" rawValue={kpi.totalUsers}
              delta={`+${kpi.newThisWeek} this week`} deltaUp iconBg={pg} value={kpi.totalUsers.toLocaleString()}
              sub={`${kpi.activeToday} active today`}/>
            <KPICard icon={<EuroIcon s={18}/>} label="Total GMV" value={kpi.gmv}
              delta={kpi.gmvDelta !== '—' ? kpi.gmvDelta : undefined} deltaUp={kpi.gmvUp} iconBg={pg}
              sub="Gross marketplace value"/>
            <KPICard icon={<ActivityIcon s={18}/>} label="Active campaigns" rawValue={kpi.activeCampaigns}
              delta={`${kpi.campaigns} total`} deltaUp iconBg={pg} value={String(kpi.activeCampaigns)}
              sub="Currently running"/>
            <KPICard icon={<ZapIcon s={18}/>} label="Payout health" value={kpi.payoutHealth}
              delta={`${kpi.disputeRate} dispute rate`} deltaUp={false} iconBg={pg}
              sub="Grade escrow uptime"/>
          </div>

          {/* ── ROW 2: 3 more KPIs ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <KPICard icon={<ShieldIcon s={18}/>} label="Churn rate" value={kpi.churnRate}
              iconBg="bg-gradient-to-r from-slate-400 to-slate-600" sub="30-day rolling"/>
            <KPICard icon={<UsersIcon s={18}/>} label="New users this week" rawValue={kpi.newThisWeek}
              delta={`${kpi.churnRate} churn`} deltaUp={false} iconBg={pg} value={String(kpi.newThisWeek)}/>
            {kpi.conversionRate !== '—'
              ? <KPICard icon={<ZapIcon s={18}/>} label="Avg conversion rate" value={kpi.conversionRate}
                  iconBg={pg} sub="Creator-driven sales"/>
              : <KPICard icon={<ClockIcon s={18}/>} label="Avg sessions/week" value={`${kpi.avgSessionsPerWeek}×`}
                  iconBg={pg} sub="Per active user"/>
            }
          </div>

          {/* ── ROW 3: AVG TIME SPENT (feature #4) + Notifications ── */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Time spent card — spans 2 cols */}
            <div className={`lg:col-span-2 flex flex-col rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink/35">Avg time spent per session</p>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-[36px] font-black tracking-[-0.04em] text-ink">{kpi.avgTimeSpent}</span>
                    <div className="mb-1 flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                      <TrendUp s={11}/>+1m 12s vs last week
                    </div>
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink/45">
                    {kpi.avgSessionsPerWeek} sessions/week per active {persona === 'all' ? 'user' : persona.slice(0, -1)}
                  </p>
                </div>
                <div className="flex gap-3">
                  {(['brands', 'creators', 'agencies'] as const).map(p => {
                    const d = KPI_DATA[p]
                    const col: Record<string, string> = { brands: 'text-blue-600 bg-blue-50', creators: 'text-rose-600 bg-rose-50', agencies: 'text-emerald-600 bg-emerald-50' }
                    return (
                      <div key={p} className={`rounded-xl px-3 py-2.5 text-center ${col[p]}`}>
                        <p className="text-[15px] font-black">{d.avgTimeSpent.split('m')[0]}m</p>
                        <p className="text-[10px] font-bold capitalize">{p.slice(0, -1)}s</p>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/30">7-day trend — avg minutes per session</p>
                <TimeSpentChart data={kpi.timeSpentTrend} persona={persona}/>
              </div>
            </div>

            {/* Compact notifications — just recent criticals + warns */}
            <div className={`flex flex-col rounded-2xl border border-primary/10 bg-white overflow-hidden ${CARD}`}>
              <div className="flex items-center justify-between border-b border-primary/8 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-ink">Alerts</span>
                  {unread > 0 && <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black text-white ${GRAD_BTN}`}>{unread}</span>}
                </div>
                <button onClick={() => setNotifOpen(true)} className="text-[12px] font-bold text-primary hover:underline">View all</button>
              </div>
              <div className="flex-1 divide-y divide-primary/5 overflow-y-auto">
                {notifs.slice(0, 5).map(n => {
                  const cfg = NOTIF_CFG[n.type as AdminNotifType]
                  return (
                    <button key={n.id} onClick={() => { markRead(n.id); setNotifOpen(true) }}
                      className={`flex w-full items-start gap-2.5 px-4 py-3 text-left transition hover:bg-primary/[0.02] ${n.unread ? 'bg-primary/[0.01]' : ''}`}>
                      <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.text}`}>{cfg.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[12px] font-semibold leading-[1.4] text-ink/75">{n.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] text-ink/35">{n.time}</span>
                          {n.unread && <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[n.severity]}`}/>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── ROW 4: DAC7 / compliance mini-cards ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Creators with DAC7 data',   value: '89%',  sub: '1,200 of 1,348',  color: 'text-emerald-600 bg-emerald-50' },
              { label: 'KYC verified accounts',      value: '94%',  sub: '1,736 of 1,847',  color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Open dispute tickets',       value: '14',   sub: '2 critical',       color: 'text-amber-700 bg-amber-50'   },
              { label: 'Failed payout retries',      value: '3',    sub: 'Auto-retry 12:00', color: 'text-rose-600 bg-rose-50'     },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border border-primary/10 bg-white px-5 py-4 ${CARD}`}>
                <div className={`mb-2 inline-flex rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] ${s.color}`}>{s.label}</div>
                <div className="text-[26px] font-black tracking-[-0.03em] text-ink">{s.value}</div>
                <div className="mt-0.5 text-[11.5px] text-ink/40">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── ROW 5: Recent users table ── */}
          <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
            <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
              <h3 className="text-[14px] font-bold text-ink">
                Recent users
                {persona !== 'all' && <span className="ml-1.5 text-ink/40">— {PERSONA_OPTIONS.find(p => p.id === persona)?.label} only</span>}
              </h3>
              <button className="text-[12px] font-bold text-primary hover:underline">View all users</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-primary/6 bg-surface-sub/60">
                    {['User', 'Type', 'Status', 'Joined', 'GMV', 'Campaigns', 'Last active'].map(h => (
                      <th key={h} className={`py-2.5 text-left text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35 ${h === 'User' ? 'pl-5 pr-3' : h === 'Last active' ? 'pl-3 pr-5' : 'px-3'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0
                    ? <tr><td colSpan={7} className="py-8 text-center text-[13px] text-ink/35">No users match the current filter.</td></tr>
                    : filteredUsers.map(u => <UserRow key={u.id} u={u} persona={persona}/>)
                  }
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Full-panel notifications overlay (mobile + "View all" trigger) */}
      {notifOpen && (
        <div className="fixed inset-0 z-[400] flex items-start justify-end bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={() => setNotifOpen(false)}>
          <div className="m-4 w-full max-w-[400px] overflow-hidden rounded-2xl bg-white" onClick={e => e.stopPropagation()}>
            <NotificationsPanel items={notifs} onMarkRead={markRead} onMarkAll={markAllRead}/>
            <div className="border-t border-primary/8 p-4">
              <button onClick={() => setNotifOpen(false)} className="w-full rounded-xl border border-primary/15 py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}