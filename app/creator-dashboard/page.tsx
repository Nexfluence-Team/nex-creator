'use client'

import { useState, useEffect, useRef, useId, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Creator dashboard — page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const CREATOR = { firstName: 'Amelia', publicSlug: 'amelia-roze' }

type RangeOption = 7 | 14 | 28
const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: 'Last 7 days',  value: 7  },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 28 days', value: 28 },
]

const VIEWS_DATA: { label: string; views: number }[] = [
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

/* Simulated unique visitors ≈ 68% of views (repeat visits filtered) */
const UNIQUE_VISITORS_DATA = VIEWS_DATA.map(d => ({ ...d, views: Math.round(d.views * 0.68) }))

type NotificationType = 'message' | 'profile_view' | 'payment' | 'deal' | 'insight'
type NotificationItem  = { id: string; type: NotificationType; title: string; time: string; unread: boolean }

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', type: 'message',      title: 'Kinetics sent you a new message',          time: '2h ago', unread: true  },
  { id: 'n2', type: 'profile_view', title: 'Lumora Skincare viewed your profile',       time: '5h ago', unread: true  },
  { id: 'n3', type: 'payment',      title: 'Payment received — €420 from Glossé',      time: '1d ago', unread: false },
  { id: 'n4', type: 'deal',         title: 'Forma Fit wants to extend your partnership', time: '2d ago', unread: true  },
  { id: 'n5', type: 'insight',      title: 'Your media kit was viewed by 3 new brands', time: '3d ago', unread: false },
  { id: 'n6', type: 'deal',         title: 'Amber Wellness invited you as an ambassador', time: '4d ago', unread: false },
]

type Message      = { id: string; sender: 'me' | 'them'; text: string; time: string }
type Conversation = {
  id: string; brandName: string; color: string; initials: string; logoUrl: string | null
  unread: boolean; lastMessage: string; lastTime: string; thread: Message[]
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'cv1', brandName: 'Kinetics', color: '#8B31E8', initials: 'KI', logoUrl: null, unread: true,
    lastMessage: 'Loved your last reel — can we talk about extending the affiliate rate?', lastTime: '2h ago',
    thread: [
      { id: 'm1', sender: 'them', text: 'Hi Amelia! Loved your last reel for the recovery stack.',              time: 'Yesterday, 4:10 PM' },
      { id: 'm2', sender: 'them', text: 'Conversions were way above what we usually see. Would you be open to talking about bumping your affiliate rate?', time: 'Yesterday, 4:11 PM' },
      { id: 'm3', sender: 'me',   text: "That's great to hear! Happy to chat — what did you have in mind?",     time: 'Yesterday, 6:32 PM' },
      { id: 'm4', sender: 'them', text: 'Loved your last reel — can we talk about extending the affiliate rate?', time: '2h ago'            },
    ],
  },
  {
    id: 'cv2', brandName: 'Lumora Skincare', color: '#059669', initials: 'LS', logoUrl: null, unread: false,
    lastMessage: 'Following up on the affiliate link — did it ever get fixed?', lastTime: '1d ago',
    thread: [
      { id: 'm1', sender: 'them', text: 'Hey! Quick check — is your tracked link still redirecting correctly?', time: '2d ago' },
      { id: 'm2', sender: 'me',   text: 'Just checked, looks good on my end now. Thanks for flagging it.',      time: '2d ago' },
      { id: 'm3', sender: 'them', text: 'Following up on the affiliate link — did it ever get fixed?',          time: '1d ago' },
    ],
  },
  {
    id: 'cv3', brandName: 'Glossé', color: '#C026D3', initials: 'GL', logoUrl: null, unread: true,
    lastMessage: 'Could you resend the invoice for last month?', lastTime: '3d ago',
    thread: [
      { id: 'm1', sender: 'them', text: 'Hi Amelia, finance is closing the books for last month.',  time: '3d ago' },
      { id: 'm2', sender: 'them', text: 'Could you resend the invoice for last month?',             time: '3d ago' },
    ],
  },
  {
    id: 'cv4', brandName: 'Forma Fit', color: '#2563EB', initials: 'FF', logoUrl: null, unread: false,
    lastMessage: "We'd like to extend the partnership through Q3.", lastTime: '5d ago',
    thread: [
      { id: 'm1', sender: 'them', text: 'The training-block series performed really well on our end.',              time: '5d ago' },
      { id: 'm2', sender: 'them', text: "We'd like to extend the partnership through Q3.",                          time: '5d ago' },
      { id: 'm3', sender: 'me',   text: "Sounds great — send over the updated brief whenever you're ready.",        time: '5d ago' },
    ],
  },
  {
    id: 'cv5', brandName: 'Vāre Coffee', color: '#EA580C', initials: 'VC', logoUrl: null, unread: true,
    lastMessage: 'New roast just dropped — want a box to try?', lastTime: '6d ago',
    thread: [
      { id: 'm1', sender: 'them', text: 'New roast just dropped — want a box to try?', time: '6d ago' },
    ],
  },
]

/* ─────────────────────────── EARNINGS GOAL CONSTANTS ────────────────── */
const AVG_CAMPAIGN_OPTIONS = [
  { label: '€50',   value: 50   },
  { label: '€100',  value: 100  },
  { label: '€200',  value: 200  },
  { label: '€350',  value: 350  },
  { label: '€500',  value: 500  },
  { label: '€750',  value: 750  },
  { label: '€1000', value: 1000 },
  { label: '€1500', value: 1500 },
]
/* Simulated earnings so far this month */
const EARNED_THIS_MONTH = 840

/* ═══════════════════════ ICONS ═══════════════════════════════════════ */
function CalendarIcon({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function ChatBubbleIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function EyeIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
function CursorClickIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 3L5 21l4-4 4 4 2-8-6-10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 12l5-2M15 7l3-3M19 13l2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function HandshakeIcon({ s = 18 }: { s?: number }) {
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
function BookmarkIcon({ s = 18, filled = false }: { s?: number; filled?: boolean }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path d="M6 3.5h12a1 1 0 011 1V21l-7-4-7 4V4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
function EuroIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TargetIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9"  stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5"  stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function LightbulbIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 21h6M12 3a7 7 0 014.9 11.9c-.6.6-1.1 1.3-1.4 2.1H8.5c-.3-.8-.8-1.5-1.4-2.1A7 7 0 0112 3z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function TrendIcon({ up, s = 11 }: { up: boolean; s?: number }) {
  return up ? (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 17l6-6 4 4 6-8M14 7h6v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ) : (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 7l6 6 4-4 6 8M14 17h6v-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  )
}
function SendIcon({ s = 15 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function EditIcon({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function NexLogo({ className = '' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`} />
}

/* ─── Brand logo tile ────────────────────────────────────────────────── */
function LogoTile({ name, color, logoUrl, initials, size = 40 }: {
  name: string; color: string; logoUrl?: string | null; initials?: string; size?: number
}) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (logoUrl) {
    return (
      <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-white" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name} width={size} height={size} className="h-full w-full object-contain p-1" draggable={false} />
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

/* ═══════════════════════ STAT CARD ═══════════════════════════════════ */
function StatCard({ icon, label, value, delta, sublabel }: {
  icon: ReactNode; label: string; value: string
  delta?: { label: string; positive: boolean }
  sublabel?: string
}) {
  return (
    <div className={`flex flex-col justify-between rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">{icon}</span>
        {delta && (
          <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${delta.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <TrendIcon up={delta.positive} s={10} />{delta.label}
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

/* ═══════════════════════ EARNINGS GOAL CARD ══════════════════════════
   Full-width card spanning all 4 stat columns.
   Creator sets:  (1) monthly earnings target  (2) avg campaign value
   Dashboard shows: earned so far · remaining · deals still needed
   ═════════════════════════════════════════════════════════════════════ */
function EarningsGoalCard() {
  const [monthlyGoal, setMonthlyGoal]     = useState(2000)
  const [avgCampaign, setAvgCampaign]     = useState(350)
  const [editingGoal, setEditingGoal]     = useState(false)
  const [goalInput, setGoalInput]         = useState('2000')
  const [campaignOpen, setCampaignOpen]   = useState(false)
  const campaignRef                       = useRef<HTMLDivElement>(null)
  const goalInputRef                      = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (campaignRef.current && !campaignRef.current.contains(e.target as Node)) setCampaignOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { if (editingGoal) goalInputRef.current?.focus() }, [editingGoal])

  const earned       = EARNED_THIS_MONTH
  const remaining    = Math.max(0, monthlyGoal - earned)
  const progress     = Math.min(100, Math.round((earned / Math.max(monthlyGoal, 1)) * 100))
  const dealsNeeded  = remaining > 0 ? Math.ceil(remaining / Math.max(avgCampaign, 1)) : 0
  const isGoalMet    = earned >= monthlyGoal

  const commitGoal = () => {
    const v = parseInt(goalInput.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(v) && v > 0) setMonthlyGoal(v)
    else setGoalInput(String(monthlyGoal))
    setEditingGoal(false)
  }

  return (
    <div className={`flex h-full w-full flex-col rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
      {/* ── Header row ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary flex-shrink-0">
            <TargetIcon s={18} />
          </span>
          <div>
            <p className="text-[13px] font-bold text-ink/50 uppercase tracking-[0.1em]">Monthly earnings goal</p>
            <p className="mt-0.5 text-[11.5px] text-ink/35">Resets on the 1st of each month</p>
          </div>
        </div>

        {/* Goal + avg campaign controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Monthly goal editable */}
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium text-ink/45">Goal:</span>
            {editingGoal ? (
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-bold text-ink/60">€</span>
                <input
                  ref={goalInputRef}
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={commitGoal}
                  onKeyDown={e => { if (e.key === 'Enter') commitGoal(); if (e.key === 'Escape') { setEditingGoal(false); setGoalInput(String(monthlyGoal)) } }}
                  className="w-20 rounded-lg border border-primary/25 bg-white px-2 py-1 text-[13px] font-bold text-ink outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(139,49,232,0.12)]"
                />
              </div>
            ) : (
              <button onClick={() => { setGoalInput(String(monthlyGoal)); setEditingGoal(true) }}
                className="flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/[0.05] px-2.5 py-1 text-[13px] font-bold text-primary transition hover:bg-primary/[0.09]">
                €{monthlyGoal.toLocaleString()}
                <EditIcon s={12} />
              </button>
            )}
          </div>

          {/* Avg campaign value dropdown */}
          <div ref={campaignRef} className="relative">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-ink/45">Avg. per deal:</span>
              <button onClick={() => setCampaignOpen(o => !o)}
                className="flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/[0.05] px-2.5 py-1 text-[13px] font-bold text-primary transition hover:bg-primary/[0.09]">
                €{avgCampaign.toLocaleString()}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={`text-primary/60 transition-transform ${campaignOpen ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {campaignOpen && (
              <div className={`absolute right-0 top-[calc(100%+6px)] z-20 w-[140px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
                {AVG_CAMPAIGN_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => { setAvgCampaign(opt.value); setCampaignOpen(false) }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-semibold transition hover:bg-primary/[0.06] ${avgCampaign === opt.value ? 'bg-primary/[0.07] text-primary' : 'text-ink/75'}`}>
                    {opt.label}
                    {avgCampaign === opt.value && <span className={`h-2 w-2 rounded-full ${GRAD_BTN}`} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="mt-5">
        <div className="flex items-end justify-between mb-2">
          <span className="text-[12px] font-medium text-ink/45">
            <span className="text-[15px] font-extrabold text-ink">€{earned.toLocaleString()}</span>
            {' '}earned of €{monthlyGoal.toLocaleString()}
          </span>
          <span className={`text-[13px] font-bold ${isGoalMet ? 'text-emerald-600' : 'text-ink/55'}`}>
            {progress}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-primary/[0.08]">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${isGoalMet ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : GRAD_BTN}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Status row ── */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {isGoalMet ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5">
            <span className="text-emerald-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="text-[13px] font-bold text-emerald-700">Goal reached — great month! 🎉</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-xl bg-surface-sub px-4 py-2.5">
              <EuroIcon s={15} />
              <span className="text-[13px] font-semibold text-ink/70">
                <span className="font-extrabold text-ink">€{remaining.toLocaleString()}</span> still to earn
              </span>
            </div>
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${GRAD_BTN}`}>
              <HandshakeIcon s={15} />
              <span className="text-[13px] font-bold text-white">
                {dealsNeeded} more deal{dealsNeeded !== 1 ? 's' : ''} needed
              </span>
            </div>
            <p className="text-[11.5px] text-ink/35 ml-1">
              Based on €{avgCampaign.toLocaleString()} avg. per campaign
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════ RANGE DROPDOWN ═════════════════════════════ */
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
        <CalendarIcon s={13} />{current.label}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className={`text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={`absolute right-0 top-[calc(100%+8px)] z-30 w-[170px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
          {RANGE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold transition hover:bg-primary/[0.06] ${value === opt.value ? 'bg-primary/[0.07] text-primary' : 'text-ink/75'}`}>
              {opt.label}{value === opt.value && <span className={`h-2 w-2 flex-shrink-0 rounded-full ${GRAD_BTN}`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════ VIEWS CHART ════════════════════════════════ */
function ViewsChart({ data }: { data: { label: string; views: number }[] }) {
  const rawId = useId()
  const id = rawId.replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 700, H = 220, PAD_L = 8, PAD_R = 8, PAD_T = 14, PAD_B = 24
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const n      = data.length
  const values = data.map(d => d.views)
  const max    = Math.max(...values)
  const min    = Math.min(...values)
  const span   = Math.max(max - min, 1)

  const xAt = (i: number) => PAD_L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => PAD_T + innerH - ((v - min) / span) * innerH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(d.views).toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L ${xAt(n - 1).toFixed(2)} ${(PAD_T + innerH).toFixed(2)} L ${xAt(0).toFixed(2)} ${(PAD_T + innerH).toFixed(2)} Z`

  const tickEvery = Math.max(1, Math.ceil(n / 6))
  const ticks     = data.map((_, i) => i).filter(i => i % tickEvery === 0 || i === n - 1)

  const handleMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current; if (!svg) return
    const rect = svg.getBoundingClientRect()
    const xFrac = (e.clientX - rect.left) / rect.width
    const xSvg  = xFrac * W
    let idx = Math.round(((xSvg - PAD_L) / innerW) * (n - 1))
    idx = Math.min(n - 1, Math.max(0, idx))
    setHover(idx)
  }

  const hoverPoint = hover !== null ? data[hover] : null

  return (
    <div className="relative h-full min-h-[180px] w-full flex-1">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        className="h-full w-full cursor-crosshair"
        onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#8B31E8" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#FF33BC" stopOpacity="0"    />
          </linearGradient>
          <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#8B31E8" />
            <stop offset="55%"  stopColor="#A855F7" />
            <stop offset="100%" stopColor="#FF33BC" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={p} x1={PAD_L} x2={W - PAD_R} y1={PAD_T + innerH * p} y2={PAD_T + innerH * p}
            stroke="#8B31E8" strokeOpacity="0.06" strokeWidth="1" />
        ))}
        <path d={areaPath} fill={`url(#${id}-area)`} />
        <path d={linePath} fill="none" stroke={`url(#${id}-line)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {ticks.map(i => (
          <text key={i} x={xAt(i)} y={H - 6} textAnchor="middle" fontSize="9.5" fontWeight={700} className="fill-ink/35">
            {data[i]?.label}
          </text>
        ))}
        {hoverPoint && hover !== null && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD_T} y2={PAD_T + innerH}
              stroke="#8B31E8" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx={xAt(hover)} cy={yAt(hoverPoint.views)} r="4.5" fill="white" stroke="#8B31E8" strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {hoverPoint && hover !== null && (
        <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-primary/10 bg-ink px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg"
          style={{ left: `${(xAt(hover) / W) * 100}%`, top: `${(yAt(hoverPoint.views) / H) * 100}%`, transform: 'translate(-50%, -135%)' }}>
          {hoverPoint.label} · {hoverPoint.views.toLocaleString()} unique visitors
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════ VIEWS CARD ════════════════════════════════= */
function ViewsCard({ range, onRangeChange }: { range: RangeOption; onRangeChange: (r: RangeOption) => void }) {
  const n = UNIQUE_VISITORS_DATA.length
  const slice = UNIQUE_VISITORS_DATA.slice(n - range)
  const total = slice.reduce((s, d) => s + d.views, 0)

  let delta: { label: string; positive: boolean } | null = null
  if (range * 2 <= n) {
    const prev    = UNIQUE_VISITORS_DATA.slice(n - range * 2, n - range)
    const prevTot = prev.reduce((s, d) => s + d.views, 0)
    if (prevTot > 0) {
      const pct = ((total - prevTot) / prevTot) * 100
      delta = { label: `${Math.abs(pct).toFixed(1)}%`, positive: pct >= 0 }
    }
  }

  return (
    <div className={`flex h-full w-full flex-col rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/40">Unique profile visitors</p>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="text-[32px] font-black tracking-[-0.03em] text-ink">{total.toLocaleString()}</span>
            {delta && (
              <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-bold ${delta.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <TrendIcon up={delta.positive} s={11} />{delta.label}
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] font-medium text-ink/40">{delta ? `vs previous ${range} days` : `Last ${range} days`}</p>
        </div>
        <RangeDropdown value={range} onChange={onRangeChange} />
      </div>
      <div className="mt-6 flex flex-1 flex-col min-h-0">
        <ViewsChart data={slice} />
      </div>
    </div>
  )
}

/* ═══════════════════════ NOTIFICATIONS ══════════════════════════════ */
const NOTIFICATION_STYLE: Record<NotificationType, { icon: ReactNode; bg: string; text: string }> = {
  message:      { icon: <ChatBubbleIcon s={16} />, bg: 'bg-primary/[0.08]', text: 'text-primary'     },
  profile_view: { icon: <EyeIcon s={16} />,        bg: 'bg-sky-50',         text: 'text-sky-600'     },
  payment:      { icon: <EuroIcon s={16} />,       bg: 'bg-emerald-50',     text: 'text-emerald-600' },
  deal:         { icon: <HandshakeIcon s={16} />,  bg: 'bg-amber-50',       text: 'text-amber-600'   },
  insight:      { icon: <LightbulbIcon s={16} />,  bg: 'bg-violet-50',      text: 'text-violet-600'  },
}

function NotificationsPanel({ items, onMarkRead, onMarkAllRead }: {
  items: NotificationItem[]; onMarkRead: (id: string) => void; onMarkAllRead: () => void
}) {
  const unreadCount = items.filter(n => n.unread).length
  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
      <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/8 px-5 py-4">
        <h3 className="text-[14.5px] font-bold text-ink">
          Notifications{unreadCount > 0 && <span className="ml-1.5 text-primary">({unreadCount})</span>}
        </h3>
        {unreadCount > 0 && <button onClick={onMarkAllRead} className="text-[12px] font-bold text-primary hover:underline">Mark all read</button>}
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
              {n.unread && <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${GRAD_BTN}`} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════ MESSAGES PANEL ════════════════════════════= */
function MessagesPanel({ conversations, setConversations }: {
  conversations: Conversation[]
  setConversations: (updater: (prev: Conversation[]) => Conversation[]) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null)
  const [draft, setDraft]           = useState('')
  const threadEndRef                = useRef<HTMLDivElement>(null)
  const selected                    = conversations.find(c => c.id === selectedId) ?? null

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [selectedId, selected?.thread.length])

  const openConversation = (id: string) => {
    setSelectedId(id)
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread: false } : c)))
  }

  const send = () => {
    const text = draft.trim()
    if (!text || !selectedId) return
    const msg: Message = { id: `m${Date.now()}`, sender: 'me', text, time: 'Just now' }
    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, thread: [...c.thread, msg], lastMessage: text, lastTime: 'Just now' } : c))
    setDraft('')
  }

  return (
    <div id="messages" className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
      <div className="border-b border-primary/8 px-5 py-4">
        <h3 className="text-[14.5px] font-bold text-ink">Messages</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr]">
        {/* Conversation list */}
        <div className="divide-y divide-primary/6 border-b border-primary/8 sm:max-h-[460px] sm:overflow-y-auto sm:border-b-0 sm:border-r sm:border-primary/8">
          {conversations.map(c => (
            <button key={c.id} onClick={() => openConversation(c.id)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-primary/[0.04] ${selectedId === c.id ? 'bg-primary/[0.06]' : ''}`}>
              <LogoTile name={c.brandName} color={c.color} logoUrl={c.logoUrl} initials={c.initials} size={38} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-[13px] ${c.unread ? 'font-bold text-ink' : 'font-semibold text-ink/75'}`}>{c.brandName}</span>
                  <span className="flex-shrink-0 text-[10.5px] text-ink/35">{c.lastTime}</span>
                </span>
                <span className={`mt-0.5 block truncate text-[12px] ${c.unread ? 'font-semibold text-ink/60' : 'text-ink/40'}`}>{c.lastMessage}</span>
              </span>
              {c.unread && <span className={`h-2 w-2 flex-shrink-0 rounded-full ${GRAD_BTN}`} />}
            </button>
          ))}
        </div>

        {/* Thread */}
        <div className="flex min-h-[360px] flex-col">
          {selected ? (
            <>
              <div className="flex flex-shrink-0 items-center gap-3 border-b border-primary/8 px-5 py-3.5">
                <LogoTile name={selected.brandName} color={selected.color} logoUrl={selected.logoUrl} initials={selected.initials} size={32} />
                <span className="text-[13.5px] font-bold text-ink">{selected.brandName}</span>
              </div>
              <div className="max-h-[320px] flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {selected.thread.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.5] ${m.sender === 'me' ? `${GRAD_BTN} text-white` : 'bg-surface-sub text-ink/75'}`}>
                      {m.text}
                      <div className={`mt-1 text-[10px] ${m.sender === 'me' ? 'text-white/70' : 'text-ink/35'}`}>{m.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>
              <div className="flex flex-shrink-0 items-center gap-2 border-t border-primary/8 px-4 py-3">
                <input value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send() }}
                  placeholder="Write a reply…"
                  className="flex-1 rounded-full border border-primary/12 bg-surface-sub px-4 py-2.5 text-[13px] text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)]" />
                <button onClick={send} disabled={!draft.trim()} aria-label="Send reply"
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${GRAD_BTN} text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0`}>
                  <SendIcon s={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10 text-center text-[13px] text-ink/40">
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════ */
export default function Page() {
  const [range, setRange]               = useState<RangeOption>(7)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)

  const unreadMessages = conversations.filter(c => c.unread).length
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const markNotificationRead = (id: string) =>
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)))
  const markAllNotificationsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  const updateConversations = (updater: (prev: Conversation[]) => Conversation[]) =>
    setConversations(updater)

  /* Stat card values — derived from data */
  const rangeSlice       = UNIQUE_VISITORS_DATA.slice(UNIQUE_VISITORS_DATA.length - range)
  const uniqueVisitors   = rangeSlice.reduce((s, d) => s + d.views, 0)
  /* Profile clicks ≈ 31% of unique visitors (simulated CTR) */
  const profileClicks    = Math.round(uniqueVisitors * 0.31)
  const activeDeals      = 6
  const savedByBrands    = 24

  const NAV_LEFT  = [
    { label: 'Dashboard',      active: true,  badge: 0,              action: () => {}                },
    { label: 'Discover Brands', active: false, badge: 0,              action: () => {}                },
  ]
  const NAV_RIGHT = [
    { label: 'Messages',  active: false, badge: unreadMessages, action: () => scrollTo('messages') },
    { label: 'My Profile', active: false, badge: 0,              action: () => {}                   },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════════ HEADER ════════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }} />
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true" />
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_RIGHT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                  {n.badge > 0 && (
                    <span className={`flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold text-white ${GRAD_BTN}`}>{n.badge}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9" />
            </div>
          </div>
        </div>
      </header>

      {/* ════════ MAIN ════════ */}
      <main className="mx-auto max-w-[1080px] px-6 py-8">

        {/* Page title */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[clamp(22px,3.2vw,30px)] font-black tracking-[-0.03em] text-ink">
              Welcome back, {CREATOR.firstName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1 text-[14px] text-ink/55">Here's how your profile has been performing.</p>
          </div>
          <a href={`/creator/${CREATOR.publicSlug}`}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30">
            View public profile
          </a>
        </div>

        {/* ── 4 stat cards ── */}
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<EyeIcon s={18} />}
            label="Unique visitors"
            value={uniqueVisitors.toLocaleString()}
            sublabel="Each person counted once"
            delta={{ label: '8.6%', positive: true }}
          />
          <StatCard
            icon={<CursorClickIcon s={18} />}
            label="Profile clicks"
            value={profileClicks.toLocaleString()}
            sublabel="Total clicks on your profile"
            delta={{ label: '+12% vs prev period', positive: true }}
          />
          <StatCard
            icon={<HandshakeIcon s={18} />}
            label="Active deals"
            value={String(activeDeals)}
            delta={{ label: '+2 this month', positive: true }}
          />
          <StatCard
            icon={<BookmarkIcon s={18} filled />}
            label="Saved by brands"
            value={String(savedByBrands)}
            delta={{ label: '+5 this week', positive: true }}
          />
        </div>

        {/* ── Earnings goal card — full width ── */}
        <div className="mt-4">
          <EarningsGoalCard />
        </div>

        {/* ── Views chart + Notifications ── */}
        <div className="mt-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          <div className="flex h-full lg:col-span-2">
            <ViewsCard range={range} onRangeChange={setRange} />
          </div>
          <NotificationsPanel
            items={notifications}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
          />
        </div>

        {/* ── Messages ── */}
        <div className="mt-6">
          <MessagesPanel conversations={conversations} setConversations={updateConversations} />
        </div>
      </main>
    </div>
  )
}