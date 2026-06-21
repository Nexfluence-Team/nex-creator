'use client'

import { useState, useEffect, useRef, useId, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Creator dashboard — page.tsx  (Nexfluence v4, LIGHT)
   Home page after a creator logs in. Three jobs: show how the profile
   is performing (views, custom 7/14/28-day range), surface messages
   from brands with inline reply, and surface notifications.
   ════════════════════════════════════════════════════════════════════ */

const CARD = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const CREATOR = { firstName: 'Amelia', publicSlug: 'amelia-roze' }

type RangeOption = 7 | 14 | 28
const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 28 days', value: 28 },
]

/* 28 days of view counts, oldest → newest, ending today (Jun 19). Swap
   for a real /analytics/views endpoint once one exists.                */
const VIEWS_DATA: { label: string; views: number }[] = [
  { label: 'May 23', views: 210 }, { label: 'May 24', views: 245 }, { label: 'May 25', views: 198 },
  { label: 'May 26', views: 320 }, { label: 'May 27', views: 410 }, { label: 'May 28', views: 380 },
  { label: 'May 29', views: 295 }, { label: 'May 30', views: 330 }, { label: 'May 31', views: 365 },
  { label: 'Jun 1', views: 290 }, { label: 'Jun 2', views: 410 }, { label: 'Jun 3', views: 455 },
  { label: 'Jun 4', views: 500 }, { label: 'Jun 5', views: 470 }, { label: 'Jun 6', views: 520 },
  { label: 'Jun 7', views: 610 }, { label: 'Jun 8', views: 580 }, { label: 'Jun 9', views: 540 },
  { label: 'Jun 10', views: 620 }, { label: 'Jun 11', views: 690 }, { label: 'Jun 12', views: 650 },
  { label: 'Jun 13', views: 700 }, { label: 'Jun 14', views: 680 }, { label: 'Jun 15', views: 750 },
  { label: 'Jun 16', views: 720 }, { label: 'Jun 17', views: 780 }, { label: 'Jun 18', views: 810 },
  { label: 'Jun 19', views: 860 },
]

type NotificationType = 'message' | 'profile_view' | 'payment' | 'deal' | 'insight'
type NotificationItem = { id: string; type: NotificationType; title: string; time: string; unread: boolean }

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', type: 'message', title: 'Kinetics sent you a new message', time: '2h ago', unread: true },
  { id: 'n2', type: 'profile_view', title: 'Lumora Skincare viewed your profile', time: '5h ago', unread: true },
  { id: 'n3', type: 'payment', title: 'Payment received — €420 from Glossé', time: '1d ago', unread: false },
  { id: 'n4', type: 'deal', title: 'Forma Fit wants to extend your partnership', time: '2d ago', unread: true },
  { id: 'n5', type: 'insight', title: 'Your media kit was viewed by 3 new brands', time: '3d ago', unread: false },
  { id: 'n6', type: 'deal', title: 'Amber Wellness invited you as an ambassador', time: '4d ago', unread: false },
]

type Message = { id: string; sender: 'me' | 'them'; text: string; time: string }
type Conversation = {
  id: string; brandName: string; color: string; initials: string; logoUrl: string | null
  unread: boolean; lastMessage: string; lastTime: string; thread: Message[]
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'cv1', brandName: 'Kinetics', color: '#8B31E8', initials: 'KI', logoUrl: null, unread: true,
    lastMessage: "Loved your last reel — can we talk about extending the affiliate rate?", lastTime: '2h ago',
    thread: [
      { id: 'm1', sender: 'them', text: "Hi Amelia! Loved your last reel for the recovery stack.", time: 'Yesterday, 4:10 PM' },
      { id: 'm2', sender: 'them', text: "Conversions were way above what we usually see. Would you be open to talking about bumping your affiliate rate?", time: 'Yesterday, 4:11 PM' },
      { id: 'm3', sender: 'me', text: "That's great to hear! Happy to chat — what did you have in mind?", time: 'Yesterday, 6:32 PM' },
      { id: 'm4', sender: 'them', text: "Loved your last reel — can we talk about extending the affiliate rate?", time: '2h ago' },
    ],
  },
  {
    id: 'cv2', brandName: 'Lumora Skincare', color: '#059669', initials: 'LS', logoUrl: null, unread: false,
    lastMessage: "Following up on the affiliate link — did it ever get fixed?", lastTime: '1d ago',
    thread: [
      { id: 'm1', sender: 'them', text: "Hey! Quick check — is your tracked link still redirecting correctly?", time: '2d ago' },
      { id: 'm2', sender: 'me', text: "Just checked, looks good on my end now. Thanks for flagging it.", time: '2d ago' },
      { id: 'm3', sender: 'them', text: "Following up on the affiliate link — did it ever get fixed?", time: '1d ago' },
    ],
  },
  {
    id: 'cv3', brandName: 'Glossé', color: '#C026D3', initials: 'GL', logoUrl: null, unread: true,
    lastMessage: 'Could you resend the invoice for last month?', lastTime: '3d ago',
    thread: [
      { id: 'm1', sender: 'them', text: "Hi Amelia, finance is closing the books for last month.", time: '3d ago' },
      { id: 'm2', sender: 'them', text: 'Could you resend the invoice for last month?', time: '3d ago' },
    ],
  },
  {
    id: 'cv4', brandName: 'Forma Fit', color: '#2563EB', initials: 'FF', logoUrl: null, unread: false,
    lastMessage: "We'd like to extend the partnership through Q3.", lastTime: '5d ago',
    thread: [
      { id: 'm1', sender: 'them', text: "The training-block series performed really well on our end.", time: '5d ago' },
      { id: 'm2', sender: 'them', text: "We'd like to extend the partnership through Q3.", time: '5d ago' },
      { id: 'm3', sender: 'me', text: "Sounds great — send over the updated brief whenever you're ready.", time: '5d ago' },
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

/* ─── Icons ──────────────────────────────────────────────────────────── */
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

function NexLogo({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`} />
  )
}

/* ─── Square logo tile (brand side of a conversation) ────────────────── */
function LogoTile({ name, color, logoUrl, initials, size = 40 }: { name: string; color: string; logoUrl?: string | null; initials?: string; size?: number }) {
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
    <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {abbr}
    </div>
  )
}

/* ─── Stat card ──────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, delta }: { icon: ReactNode; label: string; value: string; delta?: { label: string; positive: boolean } }) {
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
      </div>
    </div>
  )
}

/* ─── Range dropdown (custom 7 / 14 / 28-day picker) ─────────────────── */
function RangeDropdown({ value, onChange }: { value: RangeOption; onChange: (v: RangeOption) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = RANGE_OPTIONS.find(r => r.value === value) ?? RANGE_OPTIONS[0]!

  useEffect(() => {
    const onClick = (e: globalThis.MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onClick); window.removeEventListener('keydown', onEsc) }
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-[12.5px] font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 ${open ? 'border-primary/30' : 'border-primary/12'}`}>
        <CalendarIcon s={13} />
        {current.label}
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

/* ─── Views chart — hand-rolled SVG, hover tooltip, no chart library ─── */
function ViewsChart({ data }: { data: { label: string; views: number }[] }) {
  const rawId = useId()
  const id = rawId.replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 700, H = 220, PAD_L = 8, PAD_R = 8, PAD_T = 14, PAD_B = 24
  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const n = data.length
  const values = data.map(d => d.views)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = Math.max(max - min, 1)

  const xAt = (i: number) => PAD_L + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => PAD_T + innerH - ((v - min) / span) * innerH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(d.views).toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L ${xAt(n - 1).toFixed(2)} ${(PAD_T + innerH).toFixed(2)} L ${xAt(0).toFixed(2)} ${(PAD_T + innerH).toFixed(2)} Z`

  const tickEvery = Math.max(1, Math.ceil(n / 6))
  const ticks = data.map((_, i) => i).filter(i => i % tickEvery === 0 || i === n - 1)

  const handleMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current; if (!svg) return
    const rect = svg.getBoundingClientRect()
    const xFrac = (e.clientX - rect.left) / rect.width
    const xSvg = xFrac * W
    let idx = Math.round(((xSvg - PAD_L) / innerW) * (n - 1))
    idx = Math.min(n - 1, Math.max(0, idx))
    setHover(idx)
  }

  const hoverPoint = hover !== null ? data[hover] : null

  return (
    <div className="relative h-[220px] w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B31E8" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#FF33BC" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B31E8" />
            <stop offset="55%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#FF33BC" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={p} x1={PAD_L} x2={W - PAD_R} y1={PAD_T + innerH * p} y2={PAD_T + innerH * p} stroke="#8B31E8" strokeOpacity="0.06" strokeWidth="1" />
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
            <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD_T} y2={PAD_T + innerH} stroke="#8B31E8" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx={xAt(hover)} cy={yAt(hoverPoint.views)} r="4.5" fill="white" stroke="#8B31E8" strokeWidth="2.5" />
          </g>
        )}
      </svg>

      {hoverPoint && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-primary/10 bg-ink px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg"
          style={{ left: `${(xAt(hover) / W) * 100}%`, top: `${(yAt(hoverPoint.views) / H) * 100}%`, transform: 'translate(-50%, -135%)' }}
        >
          {hoverPoint.label} · {hoverPoint.views.toLocaleString()} views
        </div>
      )}
    </div>
  )
}

/* ─── Views card — total, delta vs previous period, range dropdown ──── */
function ViewsCard({ range, onRangeChange }: { range: RangeOption; onRangeChange: (r: RangeOption) => void }) {
  const n = VIEWS_DATA.length
  const slice = VIEWS_DATA.slice(n - range)
  const total = slice.reduce((s, d) => s + d.views, 0)

  let delta: { label: string; positive: boolean } | null = null
  if (range * 2 <= n) {
    const prevSlice = VIEWS_DATA.slice(n - range * 2, n - range)
    const prevTotal = prevSlice.reduce((s, d) => s + d.views, 0)
    if (prevTotal > 0) {
      const pct = ((total - prevTotal) / prevTotal) * 100
      delta = { label: `${Math.abs(pct).toFixed(1)}%`, positive: pct >= 0 }
    }
  }

  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/40">Profile views</p>
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
      <div className="mt-6">
        <ViewsChart data={slice} />
      </div>
    </div>
  )
}

/* ─── Notifications panel ────────────────────────────────────────────── */
const NOTIFICATION_STYLE: Record<NotificationType, { icon: ReactNode; bg: string; text: string }> = {
  message: { icon: <ChatBubbleIcon s={16} />, bg: 'bg-primary/[0.08]', text: 'text-primary' },
  profile_view: { icon: <EyeIcon s={16} />, bg: 'bg-sky-50', text: 'text-sky-600' },
  payment: { icon: <EuroIcon s={16} />, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  deal: { icon: <HandshakeIcon s={16} />, bg: 'bg-amber-50', text: 'text-amber-600' },
  insight: { icon: <LightbulbIcon s={16} />, bg: 'bg-violet-50', text: 'text-violet-600' },
}

function NotificationsPanel({
  items, onMarkRead, onMarkAllRead,
}: { items: NotificationItem[]; onMarkRead: (id: string) => void; onMarkAllRead: () => void }) {
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

/* ─── Messages panel — inline inbox: select a conversation, reply ───── */
function MessagesPanel({
  conversations, setConversations,
}: { conversations: Conversation[]; setConversations: (updater: (prev: Conversation[]) => Conversation[]) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null)
  const [draft, setDraft] = useState('')
  const threadEndRef = useRef<HTMLDivElement>(null)
  const selected = conversations.find(c => c.id === selectedId) ?? null

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
    const newMessage: Message = { id: `m${Date.now()}`, sender: 'me', text, time: 'Just now' }
    setConversations(prev => prev.map(c => (c.id === selectedId ? { ...c, thread: [...c.thread, newMessage], lastMessage: text, lastTime: 'Just now' } : c)))
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
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send() }}
                  placeholder="Write a reply…"
                  className="flex-1 rounded-full border border-primary/12 bg-surface-sub px-4 py-2.5 text-[13px] text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)]"
                />
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

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function Page() {
  const [range, setRange] = useState<RangeOption>(7)
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)

  const unreadMessages = conversations.filter(c => c.unread).length
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)))
  const markAllNotificationsRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  const updateConversations = (updater: (prev: Conversation[]) => Conversation[]) => setConversations(updater)

  // TODO: wire these up to next/link once routes exist — "Dashboard" is this page.
  const NAV_LEFT = [
    { label: 'Dashboard', active: true, badge: 0, action: () => {} },
    { label: 'Discover Brands', active: false, badge: 0, action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'Messages', active: false, badge: unreadMessages, action: () => scrollTo('messages') },
    { label: 'My Profile', active: false, badge: 0, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">
      {/* ════════ HEADER ════════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        {/* ── NAV PILL — same component as the rest of the product ── */}
        <div className="mx-auto max-w-[1080px] px-4 pt-3 sm:px-6">
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
              <NexLogo className="h-8 pointer-events-auto drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9" />
            </div>
          </div>
        </div>
      </header>

      {/* ════════ MAIN ════════ */}
      <main className="mx-auto max-w-[1080px] px-6 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[clamp(22px,3.2vw,30px)] font-black tracking-[-0.03em] text-ink">
              Welcome back, {CREATOR.firstName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1 text-[14px] text-ink/55">Here's how your profile has been performing.</p>
          </div>
          <a href={`/creator/${CREATOR.publicSlug}`}
            className={`inline-flex w-fit items-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30`}>
            View public profile
          </a>
        </div>

        {/* Stat cards */}
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<ChatBubbleIcon s={18} />} label="New messages" value={String(unreadMessages)} delta={{ label: '+1 today', positive: true }} />
          <StatCard icon={<EyeIcon s={18} />} label="Profile visits" value={Math.round(VIEWS_DATA.slice(VIEWS_DATA.length - range).reduce((s, d) => s + d.views, 0) * 0.42).toLocaleString()} delta={{ label: '8.6%', positive: true }} />
          <StatCard icon={<HandshakeIcon s={18} />} label="Active deals" value="6" delta={{ label: '+2 this month', positive: true }} />
          <StatCard icon={<BookmarkIcon s={18} filled />} label="Saved by brands" value="24" delta={{ label: '+5 this week', positive: true }} />
        </div>

        {/* Views chart + Notifications */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ViewsCard range={range} onRangeChange={setRange} />
          </div>
          <NotificationsPanel items={notifications} onMarkRead={markNotificationRead} onMarkAllRead={markAllNotificationsRead} />
        </div>

        {/* Messages */}
        <div className="mt-6">
          <MessagesPanel conversations={conversations} setConversations={updateConversations} />
        </div>
      </main>
    </div>
  )
}