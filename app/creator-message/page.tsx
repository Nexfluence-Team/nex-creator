'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Creator Messages — app/creator/messages/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   Two-panel messenger: conversation list (left) + thread (right).

   POV = CREATOR. isMe = msg.sender === 'creator'.

   Inline special cards — what the CREATOR can do:

   INVITE card (brand sent → sentByMe = false):
     pending           → Accept | Decline | View proposal
     accepted          → "View campaign →"
     declined          → "Invite declined"

   CONTRACT card (brand sent → sentByMe = false):
     pending           → Sign contract | Request changes
     signed            → Download / View contract →
     changes_requested → "Awaiting revised contract from [brand]"

   PAYMENT card (creator sends → sentByMe = true):
     pending           → "Awaiting payment from [brand]" (creator waiting)
     paid              → "Payment received ✓"
     reason_given      → brand's reason shown in amber box

   Creator's composer quick actions:
     € icon → PaymentRequestModal (fill amount + note + campaign → insert card)
     No campaign invite button (brand-only)
     No send-contract button (brand-only)
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ════════════════════════════════════════════════════════════════════
   TYPES — identical to brand messages page
   ════════════════════════════════════════════════════════════════════ */
type InviteStatus   = 'pending' | 'accepted' | 'declined'
type ContractStatus = 'pending' | 'signed'   | 'changes_requested'
type PaymentStatus  = 'pending' | 'paid'     | 'reason_given'

type SpecialCard =
  | { kind: 'invite';   campaignName: string; campaignObjective: string; rate: string;      status: InviteStatus;   sentByMe: boolean }
  | { kind: 'contract'; contractName: string; dealType: string;          pieces: string;    status: ContractStatus; sentByMe: boolean }
  | { kind: 'payment';  amount: string; dueDate: string; campaignName: string; note: string; status: PaymentStatus; sentByMe: boolean }

type Message = {
  id: string
  sender: 'brand' | 'creator'
  text?: string
  time: string
  card?: SpecialCard
}

type Conversation = {
  id: string
  brandName: string
  brandType: 'brand' | 'agency'
  color: string
  initials: string
  logoUrl: string | null
  unread: number
  lastMessage: string
  lastTime: string
  online: boolean
  thread: Message[]
}

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA
   Same narrative as brand page but POV-flipped:
   creator = 'me' (right, gradient) | brand = 'them' (left, grey)
   sentByMe values are from CREATOR perspective
   ════════════════════════════════════════════════════════════════════ */
const INITIAL_CONVOS: Conversation[] = [
  {
    id: 'cv1',
    brandName: 'Kinetics', brandType: 'brand', color: '#8B31E8', initials: 'KI', logoUrl: null,
    unread: 1, online: true, lastTime: '2m ago',
    lastMessage: 'Can we bump the commission to 18%?',
    thread: [
      { id: 'm1', sender: 'brand',   text: "Hey Amelia! We'd love to have you on the Vitamin-C Recovery Stack campaign this summer.", time: 'Jun 19, 10:02 AM' },
      { id: 'm2', sender: 'brand',   time: 'Jun 19, 10:03 AM', card: { kind: 'invite', campaignName: 'Vitamin-C Recovery Stack', campaignObjective: 'Conversions', rate: '15% commission', status: 'accepted', sentByMe: false } },
      { id: 'm3', sender: 'creator', text: "Looks great — I've been using similar products and I love the angle. Accepting!", time: 'Jun 19, 10:41 AM' },
      { id: 'm4', sender: 'brand',   text: 'Amazing! Sending you the contract now.', time: 'Jun 19, 11:00 AM' },
      { id: 'm5', sender: 'brand',   time: 'Jun 19, 11:01 AM', card: { kind: 'contract', contractName: 'Vitamin-C Recovery Stack — Amelia Roze', dealType: 'Hybrid', pieces: '3 pieces', status: 'signed', sentByMe: false } },
      { id: 'm6', sender: 'creator', text: 'Signed! Looking forward to working with you on this.', time: 'Jun 19, 11:28 AM' },
      { id: 'm7', sender: 'creator', text: 'One thing — can we bump the commission to 18%? The last campaign I did at 15% undersold my value a bit.', time: '2m ago' },
    ],
  },
  {
    id: 'cv2',
    brandName: 'Forma Fit', brandType: 'brand', color: '#2563EB', initials: 'FF', logoUrl: null,
    unread: 0, online: false, lastTime: '1h ago',
    lastMessage: 'Payment is overdue — could you check?',
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 10, 9:00 AM', card: { kind: 'invite', campaignName: 'Training Block Q3', campaignObjective: 'UGC', rate: 'From €400/video', status: 'accepted', sentByMe: false } },
      { id: 'm2', sender: 'creator', text: 'Sounds perfect for my training content. In!', time: 'Jun 10, 9:45 AM' },
      { id: 'm3', sender: 'brand',   time: 'Jun 10, 10:00 AM', card: { kind: 'contract', contractName: 'Training Block Q3 — Amelia Roze', dealType: 'Flat fee', pieces: '2 videos', status: 'signed', sentByMe: false } },
      { id: 'm4', sender: 'creator', text: 'Both videos are live — here are the links: [link1] [link2]', time: 'Jun 18, 2:14 PM' },
      { id: 'm5', sender: 'creator', time: '1h ago', card: { kind: 'payment', amount: '€800', dueDate: 'Jun 18, 2026', campaignName: 'Training Block Q3', note: 'Both deliverables posted on Jun 18. Payment was due within 14 days of go-live per the contract.', status: 'pending', sentByMe: true } },
    ],
  },
  {
    id: 'cv3',
    brandName: 'Lumora Skincare', brandType: 'brand', color: '#059669', initials: 'LS', logoUrl: null,
    unread: 2, online: true, lastTime: '3h ago',
    lastMessage: 'Contract pending — please review clause 3.2',
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 15, 3:00 PM', card: { kind: 'invite', campaignName: 'Morning Ritual — Vitamin C Serum', campaignObjective: 'Awareness', rate: '€120 product + 10%', status: 'accepted', sentByMe: false } },
      { id: 'm2', sender: 'creator', text: 'Love this. Count me in!', time: 'Jun 15, 4:22 PM' },
      { id: 'm3', sender: 'brand',   time: 'Jun 16, 9:00 AM', card: { kind: 'contract', contractName: 'Morning Ritual — Amelia Roze', dealType: 'Hybrid', pieces: '1 Reel', status: 'pending', sentByMe: false } },
      { id: 'm4', sender: 'brand',   text: 'Contract sent! Clause 3.2 covers usage rights — 12 months non-exclusive. Let me know if you have questions.', time: '3h ago' },
    ],
  },
  {
    id: 'cv4',
    brandName: 'Amber Wellness', brandType: 'brand', color: '#CA8A04', initials: 'AW', logoUrl: null,
    unread: 0, online: false, lastTime: '1d ago',
    lastMessage: "Great, I'll get started this week!",
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 18, 11:00 AM', card: { kind: 'invite', campaignName: 'Adaptogen Sleep Stack', campaignObjective: 'Conversions', rate: '12% commission', status: 'pending', sentByMe: false } },
      { id: 'm2', sender: 'creator', text: 'Thank you for the invite — reviewing the brief now.', time: 'Jun 18, 11:45 AM' },
      { id: 'm3', sender: 'brand',   text: 'No rush! Let us know if you have questions about the product or brief.', time: 'Jun 18, 12:00 PM' },
      { id: 'm4', sender: 'creator', text: "All good — accepting! Great, I'll get started this week.", time: '1d ago' },
    ],
  },
  {
    id: 'cv5',
    brandName: 'Vāre Coffee', brandType: 'brand', color: '#EA580C', initials: 'VC', logoUrl: null,
    unread: 0, online: true, lastTime: '2d ago',
    lastMessage: 'Payment received — thank you!',
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 5, 9:00 AM', card: { kind: 'invite', campaignName: 'New Roast Reveal — Baltic Tour', campaignObjective: 'Awareness', rate: '€80 gifting + 10%', status: 'accepted', sentByMe: false } },
      { id: 'm2', sender: 'brand',   time: 'Jun 5, 9:30 AM', card: { kind: 'contract', contractName: 'New Roast Reveal — Amelia Roze', dealType: 'Hybrid', pieces: '1 Reel', status: 'signed', sentByMe: false } },
      { id: 'm3', sender: 'creator', time: 'Jun 12, 10:00 AM', card: { kind: 'payment', amount: '€240', dueDate: 'Jun 12, 2026', campaignName: 'New Roast Reveal', note: 'Reel live as per contract. Commission on tracked sales totals €240.', status: 'paid', sentByMe: true } },
      { id: 'm4', sender: 'brand',   text: 'Payment processed — should hit your account within 2 business days.', time: '2d ago' },
      { id: 'm5', sender: 'creator', text: 'Payment received — thank you! Would love to do another campaign.', time: '2d ago' },
    ],
  },
  {
    id: 'cv6',
    brandName: 'Baltic Creators Agency', brandType: 'agency', color: '#2563EB', initials: 'BC', logoUrl: null,
    unread: 0, online: false, lastTime: '4d ago',
    lastMessage: 'Looking forward to working with you this quarter.',
    thread: [
      { id: 'm1', sender: 'brand',   text: "Hi Amelia! We manage several Baltic fitness brands and we'd love to add you to our Q3 creator roster.", time: 'Jun 14, 10:00 AM' },
      { id: 'm2', sender: 'brand',   time: 'Jun 14, 10:05 AM', card: { kind: 'invite', campaignName: 'Q3 Fitness Roster — Multiple Brands', campaignObjective: 'UGC + Awareness', rate: '€500/month retainer', status: 'accepted', sentByMe: false } },
      { id: 'm3', sender: 'creator', text: 'This looks like a great fit. Happy to join the Q3 roster!', time: 'Jun 14, 11:30 AM' },
      { id: 'm4', sender: 'brand',   time: 'Jun 14, 12:00 PM', card: { kind: 'contract', contractName: 'Q3 Fitness Roster — Amelia Roze', dealType: 'Paid retainer', pieces: '4 pieces/month', status: 'signed', sentByMe: false } },
      { id: 'm5', sender: 'brand',   text: 'Looking forward to working with you this quarter.', time: '4d ago' },
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
function AlertIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function DownloadIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BuildingIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function AgencyIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
   ════════════════════════════════════════════════════════════════════ */
function BrandAvatar({ initials, color, logoUrl, size = 38, online = false }: {
  initials: string; color: string; logoUrl?: string | null; size?: number; online?: boolean
}) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {logoUrl
        ? <img src={logoUrl} alt="" width={size} height={size} className="h-full w-full rounded-xl object-cover"/> // eslint-disable-line @next/next/no-img-element
        : <div className="flex h-full w-full items-center justify-center rounded-xl font-extrabold text-white" style={{ background: color, fontSize: size * 0.36 }}>{initials}</div>
      }
      {online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"/>}
    </div>
  )
}

/* The creator's own avatar is a circle (personal) */
function CreatorAvatar({ size = 30 }: { size?: number }) {
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: size, height: size, background: '#8B31E8', fontSize: size * 0.36 }}>
      AR
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INVITE CARD  — brand sent → sentByMe = false from creator's view
   ════════════════════════════════════════════════════════════════════ */
function InviteCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'invite' }>
  convoId: string
  onAction: (convoId: string, kind: 'invite', action: string) => void
}) {
  const statusConfig: Record<InviteStatus, { label: string; cls: string }> = {
    pending:  { label: '',              cls: ''                                        },
    accepted: { label: 'Accepted ✓',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    declined: { label: 'Declined',     cls: 'bg-rose-50 text-rose-600 border-rose-200'           },
  }
  const sc = statusConfig[card.status]

  return (
    <div className={`w-[300px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status !== 'pending' ? 'border-primary/10' : 'border-primary/20'}`}>
      {/* Top gradient band */}
      <div className={`flex items-center gap-2.5 px-4 py-3 ${GRAD_BTN}`}>
        <RocketIcon s={14}/>
        <span className="text-[11.5px] font-bold uppercase tracking-[0.10em] text-white/90">Campaign invite</span>
        {card.status !== 'pending' && (
          <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sc.cls}`}>{sc.label}</span>
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

      {/* Creator actions — pending, brand sent it (sentByMe = false) */}
      {card.status === 'pending' && !card.sentByMe && (
        <div className="flex gap-2 border-t border-primary/10 px-4 py-3">
          <button onClick={() => onAction(convoId, 'invite', 'view')}
            className="flex-1 rounded-xl border border-primary/15 py-2 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.05]">
            View brief
          </button>
          <button onClick={() => onAction(convoId, 'invite', 'accept')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl ${GRAD_BTN} py-2 text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
            <CheckIcon s={11}/>Accept
          </button>
          <button onClick={() => onAction(convoId, 'invite', 'decline')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 py-2 text-[12.5px] font-bold text-rose-600 transition hover:bg-rose-100">
            <XIcon s={11}/>Decline
          </button>
        </div>
      )}

      {/* If creator sent the invite (agency flow) and waiting — not typical but handle */}
      {card.status === 'pending' && card.sentByMe && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/40">Awaiting response…</p>
        </div>
      )}

      {/* Resolved state footer */}
      {card.status !== 'pending' && (
        <div className="border-t border-primary/10 px-4 py-3">
          <button onClick={() => onAction(convoId, 'invite', 'view')}
            className="text-[12.5px] font-bold text-primary hover:underline">
            View campaign details →
          </button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CONTRACT CARD — brand sent → sentByMe = false from creator's view
   ════════════════════════════════════════════════════════════════════ */
function ContractCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'contract' }>
  convoId: string
  onAction: (convoId: string, kind: 'contract', action: string) => void
}) {
  const statusMap: Record<ContractStatus, { label: string; badge: string }> = {
    pending:           { label: 'Awaiting your signature', badge: 'bg-amber-50 text-amber-700 border-amber-200'  },
    signed:            { label: 'Signed ✓',               badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    changes_requested: { label: 'Changes requested',       badge: 'bg-rose-50 text-rose-600 border-rose-200'    },
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

      {/* Status row */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sm.badge}`}>{sm.label}</span>
        <button onClick={() => onAction(convoId, 'contract', 'view')}
          className="text-[12px] font-bold text-primary hover:underline">View</button>
      </div>

      {/* Creator actions — brand sent it, creator hasn't acted yet */}
      {card.status === 'pending' && !card.sentByMe && (
        <div className="flex gap-2 border-t border-primary/10 px-4 py-3">
          <button onClick={() => onAction(convoId, 'contract', 'sign')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl ${GRAD_BTN} py-2.5 text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.42)] transition hover:-translate-y-0.5`}>
            <PenIcon s={13}/>Sign contract
          </button>
          <button onClick={() => onAction(convoId, 'contract', 'changes')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-[12.5px] font-bold text-amber-700 transition hover:bg-amber-100">
            <EditIcon s={13}/>Request changes
          </button>
        </div>
      )}

      {/* Signed — download CTA */}
      {card.status === 'signed' && (
        <div className="flex gap-2 border-t border-emerald-100 bg-emerald-50 px-4 py-3">
          <button onClick={() => onAction(convoId, 'contract', 'download')}
            className="flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-700 hover:underline">
            <DownloadIcon s={13}/>Download contract PDF
          </button>
        </div>
      )}

      {/* Changes requested — creator already sent request, waiting */}
      {card.status === 'changes_requested' && (
        <div className="border-t border-rose-100 bg-rose-50 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-rose-600">
            Change request sent — awaiting revised contract from brand.
          </p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAYMENT CARD — creator sent it (sentByMe = true)
   Shows status from creator's perspective:
     pending      → "Awaiting payment" (creator waiting on brand)
     paid         → "Received ✓"
     reason_given → amber box showing brand's reason/explanation
   ════════════════════════════════════════════════════════════════════ */
function PaymentCard({ card, convoId, brandName }: {
  card: Extract<SpecialCard, { kind: 'payment' }>
  convoId: string
  brandName: string
}) {
  const headerCls =
    card.status === 'pending'      ? 'bg-amber-500'  :
    card.status === 'paid'         ? 'bg-emerald-500' :
                                     'bg-ink/20'

  const statusLabel =
    card.status === 'pending'      ? 'Awaiting payment' :
    card.status === 'paid'         ? 'Paid ✓'           :
                                     'Brand responded'

  const badgeCls =
    card.status === 'pending'      ? 'bg-white/20 text-white border-white/30' :
    card.status === 'paid'         ? 'bg-white/20 text-white border-white/30' :
                                     'bg-surface-sub text-ink/60 border-primary/10'

  return (
    <div className={`w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'pending' ? 'border-amber-300' : 'border-primary/10'}`}>
      {/* Header band */}
      <div className={`flex items-center gap-2.5 px-4 py-3 ${headerCls}`}>
        <EuroIcon s={15}/>
        <span className="text-[12px] font-bold uppercase tracking-[0.10em] text-white/90">Payment request</span>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeCls}`}>{statusLabel}</span>
      </div>

      {/* Amount + details */}
      <div className="px-4 py-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-[28px] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{card.amount}</span>
          <span className="text-[12px] font-semibold text-ink/45">due {card.dueDate}</span>
        </div>
        <p className="mt-0.5 text-[12px] font-semibold text-ink/55">{card.campaignName}</p>
        <p className="mt-2 text-[12.5px] leading-[1.65] text-ink/60">{card.note}</p>
      </div>

      {/* Status footers */}
      {card.status === 'pending' && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-amber-700">
            Sent to {brandName} — awaiting confirmation or response.
          </p>
        </div>
      )}

      {card.status === 'paid' && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-3 flex items-center gap-2">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon s={10}/>
          </span>
          <p className="text-[12px] font-semibold text-emerald-700">
            {brandName} has processed this payment.
          </p>
        </div>
      )}

      {card.status === 'reason_given' && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
          <AlertIcon s={14}/>
          <p className="text-[11.5px] font-semibold text-amber-700">
            {brandName} replied with a reason — check the message below.
          </p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
   isMe = msg.sender === 'creator'
   Gradient bubbles on the right for creator, grey on left for brand.
   ════════════════════════════════════════════════════════════════════ */
function MessageBubble({ msg, convoId, brandName, brandColor, brandInitials, brandLogoUrl, onCardAction }: {
  msg: Message
  convoId: string
  brandName: string
  brandColor: string
  brandInitials: string
  brandLogoUrl: string | null
  onCardAction: (convoId: string, kind: string, action: string) => void
}) {
  const isMe = msg.sender === 'creator'

  /* Card layout — same outer flex shell, card component inside */
  if (msg.card) {
    return (
      <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && <BrandAvatar initials={brandInitials} color={brandColor} logoUrl={brandLogoUrl} size={30}/>}
        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
          {msg.card.kind === 'invite' && (
            <InviteCard card={msg.card} convoId={convoId}
              onAction={(id, k, a) => onCardAction(id, k, a)}/>
          )}
          {msg.card.kind === 'contract' && (
            <ContractCard card={msg.card} convoId={convoId}
              onAction={(id, k, a) => onCardAction(id, k, a)}/>
          )}
          {msg.card.kind === 'payment' && (
            <PaymentCard card={msg.card} convoId={convoId} brandName={brandName}/>
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
      {!isMe && <BrandAvatar initials={brandInitials} color={brandColor} logoUrl={brandLogoUrl} size={30}/>}
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
   CONVERSATION LIST ROW — brand logo tile instead of circle
   ════════════════════════════════════════════════════════════════════ */
function ConvoRow({ convo, active, onClick }: { convo: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${active ? 'bg-primary/[0.07]' : 'hover:bg-primary/[0.03]'}`}>
      <BrandAvatar initials={convo.initials} color={convo.color} logoUrl={convo.logoUrl} size={42} online={convo.online}/>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`truncate text-[13.5px] ${convo.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink/75'}`}>
              {convo.brandName}
            </span>
            <span className={`flex-shrink-0 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${convo.brandType === 'agency' ? 'bg-blue-50 text-blue-600' : 'bg-primary/[0.07] text-primary'}`}>
              {convo.brandType === 'agency' ? <AgencyIcon s={9}/> : <BuildingIcon s={9}/>}
            </span>
          </div>
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
   PAYMENT REQUEST MODAL
   Creator fills in amount, campaign name, note, due date.
   On confirm → inserts a payment card into the thread (sentByMe = true).
   ════════════════════════════════════════════════════════════════════ */
function PaymentRequestModal({ open, brandName, onClose, onSend }: {
  open: boolean
  brandName: string
  onClose: () => void
  onSend: (amount: string, dueDate: string, campaignName: string, note: string) => void
}) {
  const [amount,       setAmount]       = useState('')
  const [dueDate,      setDueDate]      = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [note,         setNote]         = useState('')
  const [sending,      setSending]      = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open) return null

  const valid = amount.trim().length > 0 && campaignName.trim().length > 0

  const handleSend = async () => {
    if (!valid) return
    setSending(true)
    await new Promise(r => setTimeout(r, 700))
    onSend(
      amount.trim().startsWith('€') ? amount.trim() : `€${amount.trim()}`,
      dueDate || 'On receipt',
      campaignName.trim(),
      note.trim() || `Payment request for ${campaignName.trim()}.`
    )
    setAmount(''); setDueDate(''); setCampaignName(''); setNote(''); setSending(false)
    onClose()
  }

  const INP = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[13.5px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
  const LBL = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.10em] text-ink/45'

  return (
    <div className="fixed inset-0 z-[700] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>

        {/* Drag handle — mobile */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>

        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]`}>
              <EuroIcon s={18}/>
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-ink">Request payment</p>
              <p className="text-[11.5px] text-ink/45">From {brandName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10">
            <XIcon s={13}/>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-[12.5px] leading-[1.65] text-ink/55">
            This sends a formal payment request to {brandName} inside the conversation thread. They'll see the amount, due date, and your note.
          </p>

          {/* Amount */}
          <div>
            <label className={LBL}>Amount *</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">€</span>
              <input className={`${INP} pl-8`} type="number" min={1}
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="800"/>
            </div>
          </div>

          {/* Campaign name */}
          <div>
            <label className={LBL}>Campaign / deliverable *</label>
            <input className={INP} value={campaignName} onChange={e => setCampaignName(e.target.value)}
              placeholder="e.g. Vitamin-C Recovery Stack — 3 Reels"/>
          </div>

          {/* Due date */}
          <div>
            <label className={LBL}>Due date (optional)</label>
            <input type="date" className={INP} value={dueDate} onChange={e => setDueDate(e.target.value)}/>
          </div>

          {/* Note */}
          <div>
            <label className={LBL}>Note / invoice detail (optional)</label>
            <textarea className={`${INP} min-h-[80px] resize-none leading-relaxed text-[13px]`}
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. All 3 reels posted on Jun 18 as per contract. Tracked affiliate commission totals €800 for the period."/>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 border-t border-primary/10 px-6 py-4">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">
            Cancel
          </button>
          <button onClick={handleSend} disabled={!valid || sending}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${valid && !sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            {sending
              ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</>
              : <><SendIcon s={14}/>Send payment request</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function CreatorMessagesPage() {
  const router = useRouter()

  const [convos,    setConvos]    = useState<Conversation[]>(INITIAL_CONVOS)
  const [activeId,  setActiveId]  = useState<string>(INITIAL_CONVOS[0]!.id)
  const [draft,     setDraft]     = useState('')
  const [search,    setSearch]    = useState('')
  const [showList,  setShowList]  = useState(true)   /* mobile toggle */
  const [payModal,  setPayModal]  = useState(false)

  const threadEnd = useRef<HTMLDivElement>(null)

  const UNREAD_NOTIFS  = 2

  const active   = convos.find(c => c.id === activeId)!
  const filtered = convos.filter(c =>
    c.brandName.toLowerCase().includes(search.toLowerCase())
  )
  const totalUnread = convos.reduce((n, c) => n + c.unread, 0)

  /* Auto-scroll to latest message */
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeId, active?.thread.length])

  /* Mark read on open */
  const openConvo = (id: string) => {
    setActiveId(id)
    setConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
    setShowList(false)
  }

  /* Send plain text */
  const sendMessage = () => {
    const text = draft.trim(); if (!text) return
    const msg: Message = { id: `m${Date.now()}`, sender: 'creator', text, time: 'Just now' }
    setConvos(prev => prev.map(c => c.id !== activeId ? c : {
      ...c, thread: [...c.thread, msg], lastMessage: text, lastTime: 'Just now',
    }))
    setDraft('')
  }

  /* Send payment request card */
  const sendPaymentRequest = (amount: string, dueDate: string, campaignName: string, note: string) => {
    const card: SpecialCard = { kind: 'payment', amount, dueDate, campaignName, note, status: 'pending', sentByMe: true }
    const msg: Message = { id: `m${Date.now()}`, sender: 'creator', time: 'Just now', card }
    setConvos(prev => prev.map(c => c.id !== activeId ? c : {
      ...c,
      thread: [...c.thread, msg],
      lastMessage: `Payment request: ${amount}`,
      lastTime: 'Just now',
    }))
  }

  /* Handle special card actions from creator's perspective */
  const handleCardAction = (convoId: string, kind: string, action: string) => {

    /* ── INVITE actions ── */
    if (kind === 'invite' && action === 'accept') {
      setConvos(prev => prev.map(c => {
        if (c.id !== convoId) return c
        return {
          ...c,
          lastMessage: "I'd love to work on this campaign!",
          lastTime: 'Just now',
          thread: [
            ...c.thread.map(m => m.card?.kind === 'invite' && m.card.status === 'pending'
              ? { ...m, card: { ...m.card, status: 'accepted' as InviteStatus } }
              : m
            ),
            { id: `m${Date.now()}`, sender: 'creator' as const, text: "Accepted! I'd love to work on this campaign. Looking forward to it.", time: 'Just now' },
          ],
        }
      }))
      return
    }

    if (kind === 'invite' && action === 'decline') {
      setConvos(prev => prev.map(c => {
        if (c.id !== convoId) return c
        return {
          ...c,
          lastMessage: "Thanks, not the right fit for me right now.",
          lastTime: 'Just now',
          thread: [
            ...c.thread.map(m => m.card?.kind === 'invite' && m.card.status === 'pending'
              ? { ...m, card: { ...m.card, status: 'declined' as InviteStatus } }
              : m
            ),
            { id: `m${Date.now()}`, sender: 'creator' as const, text: "Thanks for thinking of me — this isn't quite the right fit right now.", time: 'Just now' },
          ],
        }
      }))
      return
    }

    if (kind === 'invite' && action === 'view') {
      router.push('/creator/opportunity/current')
      return
    }

    /* ── CONTRACT actions ── */
    if (kind === 'contract' && action === 'sign') {
      setConvos(prev => prev.map(c => {
        if (c.id !== convoId) return c
        return {
          ...c,
          lastMessage: 'Contract signed ✓',
          lastTime: 'Just now',
          thread: [
            ...c.thread.map(m => m.card?.kind === 'contract' && m.card.status === 'pending'
              ? { ...m, card: { ...m.card, status: 'signed' as ContractStatus } }
              : m
            ),
            { id: `m${Date.now()}`, sender: 'creator' as const, text: 'Contract signed ✓ — looking forward to working together!', time: 'Just now' },
          ],
        }
      }))
      return
    }

    if (kind === 'contract' && action === 'changes') {
      setConvos(prev => prev.map(c => {
        if (c.id !== convoId) return c
        return {
          ...c,
          lastMessage: "I've noted some changes I'd need — please review.",
          lastTime: 'Just now',
          thread: [
            ...c.thread.map(m => m.card?.kind === 'contract' && m.card.status === 'pending'
              ? { ...m, card: { ...m.card, status: 'changes_requested' as ContractStatus } }
              : m
            ),
            { id: `m${Date.now()}`, sender: 'creator' as const, text: "I've flagged some changes I'd need before signing — check the contract for my notes.", time: 'Just now' },
          ],
        }
      }))
      return
    }

    if (kind === 'contract' && action === 'view') {
      router.push('/creator/contract/current')
      return
    }

    if (kind === 'contract' && action === 'download') {
      /* mock download */
      return
    }
  }

  const NAV_LEFT = [
    { label: 'Dashboard', active: false, action: () => router.push('/dashboard/creator') },
    { label: 'Messages',  active: true,  action: () => {} },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-rubik text-ink antialiased">

      {/* ════ PAYMENT REQUEST MODAL ════ */}
      <PaymentRequestModal
        open={payModal}
        brandName={active?.brandName ?? ''}
        onClose={() => setPayModal(false)}
        onSend={sendPaymentRequest}
      />

      {/* ════ HEADER — exact creator dashboard pattern ════ */}
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
                  {n.label === 'Messages' && totalUnread > 0 && (
                    <span className={`flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${GRAD_BTN}`}>{totalUnread}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>

            {/* Right nav — icon buttons matching creator dashboard */}
            <div className="relative z-10 flex items-center gap-1.5">
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

            {/* NexLogo pill — centred */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MESSENGER PANEL ════ */}
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
                  placeholder="Search brands…"
                  className="w-full rounded-xl border border-primary/10 bg-surface-sub py-2.5 pl-9 pr-4 text-[13px] text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.08)] placeholder:text-ink/35"/>
              </div>
            </div>

            {/* Convo list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0
                ? <p className="px-4 py-8 text-center text-[13px] text-ink/40">No conversations found</p>
                : filtered.map(c => <ConvoRow key={c.id} convo={c} active={c.id === activeId} onClick={() => openConvo(c.id)}/>)
              }
            </div>
          </div>

          {/* ── RIGHT: Thread ── */}
          <div className={`flex min-w-0 flex-1 flex-col ${!showList ? 'flex' : 'hidden sm:flex'}`}>

            {/* Thread header */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-primary/8 px-5 py-3.5">
              {/* Mobile back */}
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 transition hover:bg-surface-sub sm:hidden"
                onClick={() => setShowList(true)}>
                <ArrowLeftIcon s={16}/>
              </button>

              <BrandAvatar initials={active.initials} color={active.color} logoUrl={active.logoUrl} size={36} online={active.online}/>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-extrabold text-ink">{active.brandName}</p>
                  <span className={`flex-shrink-0 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${active.brandType === 'agency' ? 'bg-blue-50 text-blue-600' : 'bg-primary/[0.07] text-primary'}`}>
                    {active.brandType === 'agency' ? <><AgencyIcon s={9}/>Agency</> : <><BuildingIcon s={9}/>Brand</>}
                  </span>
                </div>
                <p className="text-[11.5px] font-medium text-ink/45">
                  {active.online ? 'Active now' : 'Last seen recently'}
                </p>
              </div>

              {/* Quick actions — creator only has payment request */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPayModal(true)}
                  title="Request payment"
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-bold transition ${GRAD_BTN} text-white shadow-[0_4px_10px_-4px_rgba(139,49,232,0.40)] hover:-translate-y-0.5`}>
                  <EuroIcon s={14}/>
                  <span className="hidden sm:inline">Request payment</span>
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
                    brandName={active.brandName}
                    brandColor={active.color}
                    brandInitials={active.initials}
                    brandLogoUrl={active.logoUrl}
                    onCardAction={handleCardAction}
                  />
                ))}
                <div ref={threadEnd}/>
              </div>
            </div>

            {/* Composer */}
            <div className="flex flex-shrink-0 items-end gap-2.5 border-t border-primary/8 px-4 py-3.5">
              <button
                title="Attach file"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-ink/40 transition hover:bg-primary/[0.07] hover:text-primary">
                <PaperclipIcon s={17}/>
              </button>

              <div className="flex-1 overflow-hidden rounded-2xl border border-primary/12 bg-surface-sub transition focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(139,49,232,0.08)]">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={`Message ${active.brandName}…`}
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