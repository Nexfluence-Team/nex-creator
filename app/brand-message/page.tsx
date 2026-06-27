'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Brand Messages — app/messages/page.tsx  (Nexfluence v4, LIGHT)
   Two-panel layout: conversation list (left) + thread (right).
   Special inline cards:
     • Campaign invite    → Accept / Decline / View proposal
     • Contract           → Sign contract / Request changes
     • Payment request    → Make payment / Reply with reason
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */

/* Invite status from creator's perspective */
type InviteStatus = 'pending' | 'accepted' | 'declined'
/* Contract status */
type ContractStatus = 'pending' | 'signed' | 'changes_requested'
/* Payment request status */
type PaymentStatus = 'pending' | 'paid' | 'reason_given'

type SpecialCard =
  | { kind: 'invite';   campaignName: string; campaignObjective: string; rate: string;      status: InviteStatus;   sentByMe: boolean }
  | { kind: 'contract'; contractName: string; dealType: string; pieces: string;             status: ContractStatus; sentByMe: boolean }
  | { kind: 'payment';  amount: string;       dueDate: string; campaignName: string; note: string; status: PaymentStatus; sentByMe: boolean }

type Message = {
  id: string
  sender: 'brand' | 'creator'
  text?: string
  time: string
  card?: SpecialCard
}

type Conversation = {
  id: string
  creatorName: string
  handle: string
  color: string
  initials: string
  avatarUrl: string | null
  unread: number
  lastMessage: string
  lastTime: string
  online: boolean
  thread: Message[]
}

/* ════════════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════════════ */
const INITIAL_CONVOS: Conversation[] = [
  {
    id: 'cv1', creatorName: 'Amelia Roze', handle: '@amelia.roze', color: '#8B31E8', initials: 'AR', avatarUrl: '/test/images/Harshul.png',
    unread: 2, online: true, lastMessage: 'Can we bump the commission to 18%?', lastTime: '2m ago',
    thread: [
      { id: 'm1', sender: 'brand',   text: 'Hey Amelia, wed love to have you on the Vitamin-C Recovery Stack campaign this summer!', time: 'Jun 19, 10:02 AM' },
      { id: 'm2', sender: 'brand',   time: 'Jun 19, 10:03 AM', card: { kind: 'invite', campaignName: 'Vitamin-C Recovery Stack', campaignObjective: 'Conversions', rate: '15% commission', status: 'accepted', sentByMe: true } },
      { id: 'm3', sender: 'creator', text: 'Looks great — I ve been using similar products and I love the angle. Accepting this!', time: 'Jun 19, 10:41 AM' },
      { id: 'm4', sender: 'brand',   text: 'Amazing! Sending you the contract now.', time: 'Jun 19, 11:00 AM' },
      { id: 'm5', sender: 'brand',   time: 'Jun 19, 11:01 AM', card: { kind: 'contract', contractName: 'Vitamin-C Recovery Stack — Amelia Roze', dealType: 'Hybrid', pieces: '3 pieces', status: 'signed', sentByMe: true } },
      { id: 'm6', sender: 'creator', text: 'Signed! Looking forward to working with you on this.', time: 'Jun 19, 11:28 AM' },
      { id: 'm7', sender: 'creator', text: 'One thing — can we bump the commission to 18%? The last campaign I did at 15% undersold my value a bit.', time: '2m ago' },
    ],
  },
  {
    id: 'cv2', creatorName: 'Markus Tamm', handle: '@markustamm', color: '#2563EB', initials: 'MT', avatarUrl: null,
    unread: 1, online: false, lastMessage: 'Payment is overdue — could you check?', lastTime: '1h ago',
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 10, 9:00 AM', card: { kind: 'invite', campaignName: 'Pre-Workout Race Day', campaignObjective: 'Awareness', rate: 'From €400/video', status: 'accepted', sentByMe: true } },
      { id: 'm2', sender: 'creator', text: 'Sounds perfect for my marathon prep content. In!', time: 'Jun 10, 9:45 AM' },
      { id: 'm3', sender: 'brand',   time: 'Jun 10, 10:00 AM', card: { kind: 'contract', contractName: 'Pre-Workout Race Day — Markus Tamm', dealType: 'Flat fee', pieces: '2 videos', status: 'signed', sentByMe: true } },
      { id: 'm4', sender: 'creator', text: 'Both videos are live — here are the links: [link1] [link2]', time: 'Jun 18, 2:14 PM' },
      { id: 'm5', sender: 'creator', time: '1h ago', card: { kind: 'payment', amount: '€800', dueDate: 'Jun 18, 2026', campaignName: 'Pre-Workout Race Day', note: 'Both deliverables posted on Jun 18. Payment was due within 14 days of go-live per the contract.', status: 'pending', sentByMe: false } },
    ],
  },
  {
    id: 'cv3', creatorName: 'Sandra Liepa', handle: '@sandra.liepa', color: '#DB2777', initials: 'SL', avatarUrl: null,
    unread: 0, online: true, lastMessage: 'Can you clarify the usage rights clause?', lastTime: '3h ago',
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 15, 3:00 PM', card: { kind: 'invite', campaignName: 'Capsule Wardrobe Drop', campaignObjective: 'Consideration', rate: '18% commission', status: 'accepted', sentByMe: true } },
      { id: 'm2', sender: 'creator', text: 'Love this. Count me in!', time: 'Jun 15, 4:22 PM' },
      { id: 'm3', sender: 'brand',   time: 'Jun 16, 9:00 AM', card: { kind: 'contract', contractName: 'Capsule Wardrobe Drop — Sandra Liepa', dealType: 'Commission', pieces: '4 pieces', status: 'changes_requested', sentByMe: true } },
      { id: 'm4', sender: 'creator', text: 'Can you clarify the usage rights clause? Clause 3.2 says "perpetual" but we discussed 12 months.', time: '3h ago' },
    ],
  },
  {
    id: 'cv4', creatorName: 'Rūta Vaitkutė', handle: '@ruta.glow', color: '#C026D3', initials: 'RV', avatarUrl: null,
    unread: 0, online: false, lastMessage: 'Great, Ill get started this week!', lastTime: '1d ago',
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 18, 11:00 AM', card: { kind: 'invite', campaignName: 'Electrolyte Hot Yoga', campaignObjective: 'Conversions', rate: '16% commission', status: 'pending', sentByMe: true } },
      { id: 'm2', sender: 'creator', text: 'Thank you for the invite — reviewing the brief now.', time: 'Jun 18, 11:45 AM' },
      { id: 'm3', sender: 'brand',   text: 'No rush! Let us know if you have questions about the product or brief.', time: 'Jun 18, 12:00 PM' },
      { id: 'm4', sender: 'creator', text: 'All good — accepting! Great, I ll get started this week!', time: '1d ago' },
    ],
  },
  {
    id: 'cv5', creatorName: 'Aiga Ozola', handle: '@aiga.bakes', color: '#EA580C', initials: 'AO', avatarUrl: null,
    unread: 0, online: true, lastMessage: 'Payment received — thank you!', lastTime: '2d ago',
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 5, 9:00 AM', card: { kind: 'invite', campaignName: 'Pantry Staples Refresh', campaignObjective: 'Awareness', rate: '10% commission + €150 product', status: 'accepted', sentByMe: true } },
      { id: 'm2', sender: 'brand',   time: 'Jun 5, 9:30 AM', card: { kind: 'contract', contractName: 'Pantry Staples Refresh — Aiga Ozola', dealType: 'Hybrid', pieces: '2 TikToks', status: 'signed', sentByMe: true } },
      { id: 'm3', sender: 'creator', time: 'Jun 12, 10:00 AM', card: { kind: 'payment', amount: '€240', dueDate: 'Jun 12, 2026', campaignName: 'Pantry Staples Refresh', note: 'Two TikToks live as per contract. Commission on tracked sales totals €240.', status: 'paid', sentByMe: false } },
      { id: 'm4', sender: 'brand',   text: 'Payment processed — should hit your account within 2 business days.', time: '2d ago' },
      { id: 'm5', sender: 'creator', text: 'Payment received — thank you! Would love to do another campaign.', time: '2d ago' },
    ],
  },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function SendIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SearchIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function BellIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChatBubbleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CheckIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function FileIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function EuroIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ArrowLeftIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function PaperclipIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function MoreIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>
}
function RocketIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 7 6 7 13h10c0-7-5-11-5-11z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13c0 2.5 1 4 2.5 5.5L12 21l2.5-2.5C16 17 17 15.5 17 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="11" r="1.5" fill="currentColor"/></svg>
}
function PenIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EditIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CreditCardIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function MessageIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   SMALL SHARED
   ════════════════════════════════════════════════════════════════════ */
function Avatar({ initials, color, avatarUrl, size = 38, online = false }: {
  initials: string; color: string; avatarUrl?: string | null; size?: number; online?: boolean
}) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {avatarUrl
        ? <img src={avatarUrl} alt="" width={size} height={size} className="h-full w-full rounded-full object-cover"/> // eslint-disable-line @next/next/no-img-element
        : <div className="flex h-full w-full items-center justify-center rounded-full font-extrabold text-white" style={{ background: color, fontSize: size * 0.38 }}>{initials}</div>
      }
      {online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"/>}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SPECIAL CARD RENDERERS
   ════════════════════════════════════════════════════════════════════ */

/* ── Campaign Invite Card ── */
function InviteCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'invite' }>
  convoId: string
  onAction: (convoId: string, messageKind: 'invite', action: string) => void
}) {
  const statusConfig = {
    pending:  { label: null,        bg: '' },
    accepted: { label: 'Accepted ✓', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    declined: { label: 'Declined',   bg: 'bg-rose-50 text-rose-600 border-rose-200' },
  }
  const sc = statusConfig[card.status]

  return (
    <div className={`w-[300px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status !== 'pending' ? 'border-primary/10' : 'border-primary/20'}`}>
      {/* Top band */}
      <div className={`flex items-center gap-2.5 px-4 py-3 ${GRAD_BTN}`}>
        <RocketIcon s={15}/>
        <span className="text-[12px] font-bold uppercase tracking-[0.10em] text-white/90">Campaign invite</span>
        {card.status !== 'pending' && (
          <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sc.bg}`}>{sc.label}</span>
        )}
      </div>
      {/* Body */}
      <div className="px-4 py-3.5">
        <p className="text-[14px] font-extrabold leading-tight text-ink">{card.campaignName}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-primary/[0.07] px-2 py-0.5 text-[11px] font-bold text-primary">{card.campaignObjective}</span>
          <span className="text-[12px] font-semibold text-ink/50">{card.rate}</span>
        </div>
      </div>
      {/* Actions — only when pending and creator is viewing (sentByMe = false means brand sent, creator sees buttons) */}
      {card.status === 'pending' && card.sentByMe && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/40">Waiting for creator's response…</p>
        </div>
      )}
      {card.status === 'pending' && !card.sentByMe && (
        <div className="flex gap-2 border-t border-primary/10 px-4 py-3">
          <button onClick={() => onAction(convoId, 'invite', 'view')}
            className="flex-1 rounded-xl border border-primary/15 py-2 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.05]">
            View proposal
          </button>
          <button onClick={() => onAction(convoId, 'invite', 'accept')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl ${GRAD_BTN} py-2 text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]`}>
            <CheckIcon s={11}/>Accept
          </button>
          <button onClick={() => onAction(convoId, 'invite', 'decline')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2 text-[12.5px] font-bold text-rose-600">
            <XIcon s={11}/>Decline
          </button>
        </div>
      )}
      {card.status !== 'pending' && (
        <div className="border-t border-primary/10 px-4 py-3">
          <button onClick={() => onAction(convoId, 'invite', 'view')}
            className="text-[12.5px] font-bold text-primary hover:underline">View campaign details →</button>
        </div>
      )}
    </div>
  )
}

/* ── Contract Card ── */
function ContractCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'contract' }>
  convoId: string
  onAction: (convoId: string, messageKind: 'contract', action: string) => void
}) {
  const statusMap = {
    pending:           { label: 'Awaiting signature', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    signed:            { label: 'Signed ✓',           badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    changes_requested: { label: 'Changes requested',  badge: 'bg-rose-50 text-rose-600 border-rose-200' },
  }
  const sm = statusMap[card.status]

  return (
    <div className={`w-[300px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'changes_requested' ? 'border-rose-200' : 'border-primary/10'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-primary/10 px-4 py-3.5">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} shadow-[0_4px_10px_-4px_rgba(139,49,232,0.45)]`}>
          <FileIcon s={15}/>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-extrabold text-ink">{card.contractName}</p>
          <p className="text-[11px] font-semibold text-ink/45">{card.dealType} · {card.pieces}</p>
        </div>
      </div>
      {/* Status */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sm.badge}`}>{sm.label}</span>
        <button onClick={() => onAction(convoId, 'contract', 'view')}
          className="text-[12px] font-bold text-primary hover:underline">View</button>
      </div>
      {/* Action buttons — brand sent, creator hasn't acted yet */}
      {card.status === 'pending' && card.sentByMe && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/40">Waiting for creator to sign…</p>
        </div>
      )}
      {card.status === 'pending' && !card.sentByMe && (
        <div className="flex gap-2 border-t border-primary/10 px-4 py-3">
          <button onClick={() => onAction(convoId, 'contract', 'sign')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl ${GRAD_BTN} py-2.5 text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.42)]`}>
            <PenIcon s={13}/>Sign contract
          </button>
          <button onClick={() => onAction(convoId, 'contract', 'changes')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-[12.5px] font-bold text-amber-700">
            <EditIcon s={13}/>Request changes
          </button>
        </div>
      )}
      {card.status === 'changes_requested' && (
        <div className="border-t border-rose-100 bg-rose-50 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-rose-600">Creator requested changes — review and resend.</p>
          <button onClick={() => onAction(convoId, 'contract', 'revise')}
            className="mt-1.5 text-[12px] font-bold text-rose-600 hover:underline">Open contract editor →</button>
        </div>
      )}
    </div>
  )
}

/* ── Payment Request Card ── */
function PaymentCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'payment' }>
  convoId: string
  onAction: (convoId: string, messageKind: 'payment', action: string) => void
}) {
  const [showReason, setShowReason] = useState(false)
  const [reason, setReason]         = useState('')

  const statusMap = {
    pending:      { label: 'Payment due',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    paid:         { label: 'Paid ✓',        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    reason_given: { label: 'Reply sent',    badge: 'bg-surface-sub text-ink/50 border-primary/10' },
  }
  const sm = statusMap[card.status]

  return (
    <div className={`w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'pending' ? 'border-amber-300' : 'border-primary/10'}`}>
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-4 py-3 ${card.status === 'pending' ? 'bg-amber-500' : card.status === 'paid' ? 'bg-emerald-500' : 'bg-ink/10'}`}>
        <EuroIcon s={15}/>
        <span className="text-[12px] font-bold uppercase tracking-[0.10em] text-white/90">Payment request</span>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${sm.badge}`}>{sm.label}</span>
      </div>
      {/* Amount + details */}
      <div className="px-4 py-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-[28px] font-black tracking-[-0.04em] ${GRAD_TXT}`}>{card.amount}</span>
          <span className="text-[12px] font-semibold text-ink/45">due {card.dueDate}</span>
        </div>
        <p className="mt-0.5 text-[12px] font-semibold text-ink/55">{card.campaignName}</p>
        <p className="mt-2 text-[12.5px] leading-[1.65] text-ink/60">{card.note}</p>
      </div>
      {/* Brand actions — brand sees this card (creator sent it, sentByMe = false) */}
      {card.status === 'pending' && (
        <div className="border-t border-amber-200 px-4 py-3">
          {!showReason ? (
            <div className="flex gap-2">
              <button onClick={() => onAction(convoId, 'payment', 'pay')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl ${GRAD_BTN} py-2.5 text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.42)]`}>
                <CreditCardIcon s={13}/>Make payment
              </button>
              <button onClick={() => setShowReason(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-white py-2.5 text-[12.5px] font-bold text-ink/60 hover:bg-surface-sub">
                <MessageIcon s={13}/>Give reason
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[11.5px] font-semibold text-ink/50">Explain the delay or revised timeline:</p>
              <textarea
                value={reason} onChange={e => setReason(e.target.value)}
                placeholder="e.g. Processing on our end — payment will be made by Jun 28."
                className="w-full rounded-xl border border-primary/12 bg-surface-sub px-3.5 py-2.5 text-[13px] leading-relaxed text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)] resize-none min-h-[72px]"/>
              <div className="flex gap-2">
                <button onClick={() => setShowReason(false)}
                  className="flex-1 rounded-xl border border-primary/15 py-2 text-[12.5px] font-bold text-ink/50 hover:bg-surface-sub">Cancel</button>
                <button disabled={!reason.trim()}
                  onClick={() => { if (reason.trim()) onAction(convoId, 'payment', `reason:${reason}`) }}
                  className={`flex-[2] rounded-xl py-2 text-[12.5px] font-bold text-white transition ${reason.trim() ? `${GRAD_BTN} shadow-[0_4px_12px_-4px_rgba(139,49,232,0.42)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                  Send reply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {card.status === 'paid' && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[12px] font-semibold text-emerald-700">Payment processed and sent to creator.</p>
        </div>
      )}
      {card.status === 'reason_given' && (
        <div className="border-t border-primary/8 px-4 py-3">
          <p className="text-[12px] font-semibold text-ink/45">You replied with a reason — creator has been notified.</p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MESSAGE BUBBLE — plain text bubble or special card dispatcher
   ════════════════════════════════════════════════════════════════════ */
function MessageBubble({ msg, convoId, onCardAction, creatorColor, creatorInitials, creatorAvatarUrl }: {
  msg: Message
  convoId: string
  onCardAction: (convoId: string, kind: string, action: string) => void
  creatorColor: string
  creatorInitials: string
  creatorAvatarUrl: string | null
}) {
  const isMe = msg.sender === 'brand'

  /* Card messages always appear in a non-bubble layout, aligned by sender */
  if (msg.card) {
    return (
      <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && <Avatar initials={creatorInitials} color={creatorColor} avatarUrl={creatorAvatarUrl} size={30}/>}
        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
          {msg.card.kind === 'invite' && (
            <InviteCard card={msg.card} convoId={convoId} onAction={(id, k, a) => onCardAction(id, k, a)}/>
          )}
          {msg.card.kind === 'contract' && (
            <ContractCard card={msg.card} convoId={convoId} onAction={(id, k, a) => onCardAction(id, k, a)}/>
          )}
          {msg.card.kind === 'payment' && (
            <PaymentCard card={msg.card} convoId={convoId} onAction={(id, k, a) => onCardAction(id, k, a)}/>
          )}
          <span className="px-1 text-[10.5px] font-medium text-ink/35">{msg.time}</span>
        </div>
        {isMe && <div className="h-[30px] w-[30px] flex-shrink-0"/>}
      </div>
    )
  }

  /* Plain text bubble */
  return (
    <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && <Avatar initials={creatorInitials} color={creatorColor} avatarUrl={creatorAvatarUrl} size={30}/>}
      <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-[340px] rounded-2xl px-4 py-2.5 text-[13.5px] leading-[1.55] ${
          isMe
            ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.40)]`
            : 'bg-surface-sub text-ink/80'
        }`} style={isMe ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }}>
          {msg.text}
        </div>
        <span className="px-1 text-[10.5px] font-medium text-ink/35">{msg.time}</span>
      </div>
      {isMe && <div className="h-[30px] w-[30px] flex-shrink-0"/>}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CONVERSATION LIST ITEM
   ════════════════════════════════════════════════════════════════════ */
function ConvoRow({ convo, active, onClick }: { convo: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${active ? 'bg-primary/[0.07]' : 'hover:bg-primary/[0.03]'}`}>
      <Avatar initials={convo.initials} color={convo.color} avatarUrl={convo.avatarUrl} size={42} online={convo.online}/>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-[13.5px] ${convo.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink/75'}`}>
            {convo.creatorName}
          </span>
          <span className="flex-shrink-0 text-[10.5px] font-medium text-ink/35">{convo.lastTime}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`truncate text-[12px] ${convo.unread > 0 ? 'font-semibold text-ink/60' : 'text-ink/40'}`}>
            {convo.lastMessage}
          </span>
          {convo.unread > 0 && (
            <span className={`flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-black text-white ${GRAD_BTN}`}>
              {convo.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAYMENT MODAL (triggered by "Make payment" button in card)
   ════════════════════════════════════════════════════════════════════ */
function PaymentConfirmModal({ open, amount, creatorName, campaignName, onConfirm, onClose }: {
  open: boolean; amount: string; creatorName: string; campaignName: string
  onConfirm: () => void; onClose: () => void
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[400px] overflow-hidden rounded-3xl bg-white p-7 text-center ${CARD}`}>
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.45)]`}>
          <EuroIcon s={26}/>
        </div>
        <h3 className="text-[19px] font-extrabold tracking-[-0.02em] text-ink">Confirm payment</h3>
        <p className="mx-auto mt-2.5 max-w-[300px] text-[13.5px] leading-[1.65] text-ink/55">
          You're about to pay <span className="font-bold text-ink">{amount}</span> to <span className="font-bold text-ink">{creatorName}</span> for <span className="font-bold text-ink">{campaignName}</span>.
        </p>
        <p className="mt-2 text-[12px] text-ink/38">Payment will be processed via your connected payout method through Grade escrow.</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button onClick={onConfirm}
            className={`w-full rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
            Confirm & pay {amount}
          </button>
          <button onClick={onClose}
            className="w-full rounded-xl border border-primary/15 py-3.5 text-[14px] font-bold text-ink/55 transition hover:bg-surface-sub">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function BrandMessagesPage() {
  const router = useRouter()
  const [convos,       setConvos]       = useState<Conversation[]>(INITIAL_CONVOS)
  const [activeId,     setActiveId]     = useState<string>(INITIAL_CONVOS[0]!.id)
  const [draft,        setDraft]        = useState('')
  const [search,       setSearch]       = useState('')
  const [showList,     setShowList]     = useState(true)   /* mobile: toggle list vs thread */
  const [payModal,     setPayModal]     = useState<{ open: boolean; amount: string; creatorName: string; campaignName: string; msgId: string; convoId: string } | null>(null)
  const threadEnd = useRef<HTMLDivElement>(null)

  const active = convos.find(c => c.id === activeId)!
  const filtered = convos.filter(c =>
    c.creatorName.toLowerCase().includes(search.toLowerCase()) ||
    c.handle.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = convos.reduce((n, c) => n + c.unread, 0)

  /* Scroll to bottom of thread when convo changes or new message added */
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeId, active?.thread.length])

  /* Mark as read when opening */
  const openConvo = (id: string) => {
    setActiveId(id)
    setConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
    setShowList(false)
  }

  /* Send plain text message */
  const sendMessage = () => {
    const text = draft.trim(); if (!text) return
    const msg: Message = { id: `m${Date.now()}`, sender: 'brand', text, time: 'Just now' }
    setConvos(prev => prev.map(c => c.id === activeId
      ? { ...c, thread: [...c.thread, msg], lastMessage: text, lastTime: 'Just now' }
      : c
    ))
    setDraft('')
  }

  /* Handle special card actions */
  const handleCardAction = (convoId: string, kind: string, action: string) => {
    if (kind === 'payment' && action === 'pay') {
      /* Find the payment card to get amount etc. */
      const convo = convos.find(c => c.id === convoId)
      const payMsg = convo?.thread.find(m => m.card?.kind === 'payment' && m.card.status === 'pending')
      if (payMsg?.card?.kind === 'payment') {
        setPayModal({ open: true, amount: payMsg.card.amount, creatorName: convo!.creatorName, campaignName: payMsg.card.campaignName, msgId: payMsg.id, convoId })
      }
      return
    }
    if (kind === 'payment' && action.startsWith('reason:')) {
      const reasonText = action.replace('reason:', '')
      /* Update card status + append brand message */
      setConvos(prev => prev.map(c => {
        if (c.id !== convoId) return c
        return {
          ...c,
          lastMessage: reasonText,
          lastTime: 'Just now',
          thread: [
            ...c.thread.map(m => m.card?.kind === 'payment' && m.card.status === 'pending'
              ? { ...m, card: { ...m.card, status: 'reason_given' as PaymentStatus } }
              : m
            ),
            { id: `m${Date.now()}`, sender: 'brand' as const, text: reasonText, time: 'Just now' },
          ],
        }
      }))
      return
    }
    if (kind === 'invite' && (action === 'accept' || action === 'decline')) {
      setConvos(prev => prev.map(c => {
        if (c.id !== convoId) return c
        const status: InviteStatus = action === 'accept' ? 'accepted' : 'declined'
        const replyText = action === 'accept' ? 'Thanks for accepting! Well send the contract shortly.' : 'No problem — thanks for letting us know.'
        return {
          ...c, lastMessage: replyText, lastTime: 'Just now',
          thread: [
            ...c.thread.map(m => m.card?.kind === 'invite' ? { ...m, card: { ...m.card, status } } : m),
            { id: `m${Date.now()}`, sender: 'brand' as const, text: replyText, time: 'Just now' },
          ],
        }
      }))
      return
    }
    if (kind === 'contract' && action === 'changes') {
      setConvos(prev => prev.map(c => {
        if (c.id !== convoId) return c
        return {
          ...c, lastMessage: 'Creator requested contract changes', lastTime: 'Just now',
          thread: c.thread.map(m => m.card?.kind === 'contract' ? { ...m, card: { ...m.card, status: 'changes_requested' as ContractStatus } } : m),
        }
      }))
      return
    }
    if (kind === 'contract' && action === 'sign') {
      setConvos(prev => prev.map(c => {
        if (c.id !== convoId) return c
        return {
          ...c, lastMessage: 'Contract signed ✓', lastTime: 'Just now',
          thread: [
            ...c.thread.map(m => m.card?.kind === 'contract' ? { ...m, card: { ...m.card, status: 'signed' as ContractStatus } } : m),
            { id: `m${Date.now()}`, sender: 'brand' as const, text: 'Contract signed ✓ — welcome aboard! Brief and timeline details are in the contract.', time: 'Just now' },
          ],
        }
      }))
      return
    }
    /* View actions → navigate */
    if (action === 'view') {
      if (kind === 'invite')   router.push('/brand/campaign/new')
      if (kind === 'contract') router.push('/brand/contract/new')
    }
    if (kind === 'contract' && action === 'revise') router.push('/brand/contract/new')
  }

  /* Confirm payment */
  const confirmPayment = () => {
    if (!payModal) return
    setConvos(prev => prev.map(c => {
      if (c.id !== payModal.convoId) return c
      return {
        ...c, lastMessage: `Payment of ${payModal.amount} sent ✓`, lastTime: 'Just now',
        thread: [
          ...c.thread.map(m => m.card?.kind === 'payment' && m.card.status === 'pending'
            ? { ...m, card: { ...m.card, status: 'paid' as PaymentStatus } }
            : m
          ),
          { id: `m${Date.now()}`, sender: 'brand' as const, text: `Payment of ${payModal.amount} has been processed and will arrive in your account within 2 business days.`, time: 'Just now' },
        ],
      }
    }))
    setPayModal(null)
  }

  /* Header nav — exact dashboard pattern */
  const NAV_LEFT  = [
    { label: 'Dashboard',  active: false, action: () => router.push('/dashboard/brand') },
    { label: 'Messages',   active: true,  action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'My Profile', active: false, action: () => {} },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-rubik text-ink antialiased">

      {/* ════ PAYMENT CONFIRM MODAL ════ */}
      {payModal && (
        <PaymentConfirmModal
          open={payModal.open}
          amount={payModal.amount}
          creatorName={payModal.creatorName}
          campaignName={payModal.campaignName}
          onConfirm={confirmPayment}
          onClose={() => setPayModal(null)}
        />
      )}

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
                  {n.label === 'Messages' && totalUnread > 0 && (
                    <span className={`flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${GRAD_BTN}`}>{totalUnread}</span>
                  )}
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
        </div>
      </header>

      {/* ════ MESSENGER ════ */}
      <div className="mx-auto flex w-full max-w-[1080px] flex-1 px-4 py-5 sm:px-6">
        <div className={`flex h-[calc(100vh-88px)] w-full overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>

          {/* ── LEFT: Conversation list ── */}
          <div className={`flex w-full flex-shrink-0 flex-col border-r border-primary/8 sm:w-[280px] lg:w-[300px] ${showList ? 'flex' : 'hidden sm:flex'}`}>
            {/* List header */}
            <div className="flex items-center justify-between border-b border-primary/8 px-4 py-4">
              <h2 className="text-[15px] font-extrabold text-ink">Messages</h2>
              <button className={`flex h-8 w-8 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_10px_-4px_rgba(139,49,232,0.45)]`}>
                <ChatBubbleIcon s={15}/>
              </button>
            </div>
            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={14}/></span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full rounded-xl border border-primary/10 bg-surface-sub py-2.5 pl-9 pr-4 text-[13px] text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.08)] placeholder:text-ink/35"/>
              </div>
            </div>
            {/* Convo list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-ink/40">No conversations found</p>
              ) : (
                filtered.map(c => <ConvoRow key={c.id} convo={c} active={c.id === activeId} onClick={() => openConvo(c.id)}/>)
              )}
            </div>
          </div>

          {/* ── RIGHT: Thread view ── */}
          <div className={`flex min-w-0 flex-1 flex-col ${!showList ? 'flex' : 'hidden sm:flex'}`}>

            {/* Thread header */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-primary/8 px-5 py-3.5">
              {/* Mobile back */}
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 transition hover:bg-surface-sub sm:hidden"
                onClick={() => setShowList(true)}>
                <ArrowLeftIcon s={16}/>
              </button>
              <Avatar initials={active.initials} color={active.color} avatarUrl={active.avatarUrl} size={36} online={active.online}/>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[14px] font-extrabold text-ink">{active.creatorName}</p>
                <p className="text-[11.5px] font-medium text-ink/45">
                  {active.handle}{active.online ? ' · Active now' : ''}
                </p>
              </div>
              {/* Quick actions */}
              <div className="flex items-center gap-1">
                <button onClick={() => router.push('/brand/campaign/new')} title="New campaign invite"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                  <RocketIcon s={16}/>
                </button>
                <button onClick={() => router.push('/brand/contract/new')} title="Send contract"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                  <FileIcon s={16}/>
                </button>
                <button title="More options"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                  <MoreIcon s={18}/>
                </button>
              </div>
            </div>

            {/* Thread messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-4">
                {active.thread.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    convoId={active.id}
                    onCardAction={handleCardAction}
                    creatorColor={active.color}
                    creatorInitials={active.initials}
                    creatorAvatarUrl={active.avatarUrl}
                  />
                ))}
                <div ref={threadEnd}/>
              </div>
            </div>

            {/* Composer */}
            <div className="flex flex-shrink-0 items-end gap-2.5 border-t border-primary/8 px-4 py-3.5">
              <button className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-ink/40 transition hover:bg-primary/[0.07] hover:text-primary">
                <PaperclipIcon s={17}/>
              </button>
              <div className="flex-1 overflow-hidden rounded-2xl border border-primary/12 bg-surface-sub transition focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(139,49,232,0.08)]">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={`Message ${active.creatorName}…`}
                  rows={1}
                  className="block w-full resize-none bg-transparent px-4 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink/35"
                  style={{ maxHeight: 120, minHeight: 40 }}
                  onInput={e => {
                    const t = e.currentTarget
                    t.style.height = 'auto'
                    t.style.height = `${Math.min(t.scrollHeight, 120)}px`
                  }}/>
              </div>
              <button
                onClick={sendMessage}
                disabled={!draft.trim()}
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${draft.trim() ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'bg-ink/8 text-ink/30 cursor-not-allowed'}`}>
                <SendIcon s={15}/>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}