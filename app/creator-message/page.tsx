'use client'

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Creator Messages — app/creator-message/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   OLX-INSPIRED ADDITIONS (this revision):
   • Deal context bar — pinned strip under the thread header showing the
     most recent deal/offer touchpoint for this conversation, mirroring
     OLX's pinned-listing bar above a chat.
   • Offer / counter-offer — a proper negotiation chain: each offer is
     its own card (Accept / Counter / Decline). Countering supersedes
     the old card and appends a fresh one, so the thread always reads
     top-to-bottom as a real negotiation history.
   • Raise a dispute — creator-initiated card, routes to /creator-dispute.
   • Sign details — lightweight "confirm final terms" e-signature card,
     distinct from a full Contract: either party can initiate; whoever
     didn't can countersign inline.
   • Invoice — formal line-itemized document (invoice #, line items,
     computed total, due date), distinct from the existing quick
     "Request payment" ask.
   • All five creator actions (payment request, offer, sign details,
     invoice, dispute) now live behind one "+" quick-actions popover
     instead of a row of header icons.
   • Route fixes: dashboard, profile, invite/contract "view", dispute.
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

let _uid = 0
const newId = (p: string) => `${p}_${++_uid}_${Date.now()}`

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type InviteStatus   = 'pending' | 'accepted' | 'declined'
type ContractStatus = 'pending' | 'signed'   | 'changes_requested'
type PaymentStatus  = 'pending' | 'paid'     | 'reason_given'
type OfferStatus    = 'pending' | 'accepted' | 'declined' | 'countered'
type DisputeStatus  = 'open' | 'under_review' | 'resolved'
type SignStatus     = 'awaiting_counterparty' | 'fully_signed'
type InvoiceStatus  = 'sent' | 'paid' | 'overdue'

interface LineItem { desc: string; qty: number; rate: number }
interface TermRow   { label: string; value: string }

type SpecialCard =
  | { kind: 'invite';   campaignName: string; campaignObjective: string; rate: string;      status: InviteStatus;   sentByMe: boolean }
  | { kind: 'contract'; contractName: string; dealType: string;          pieces: string;    status: ContractStatus; sentByMe: boolean }
  | { kind: 'payment';  amount: string; dueDate: string; campaignName: string; note: string; status: PaymentStatus; sentByMe: boolean }
  | { kind: 'offer';    campaignName: string; amount: string; note: string; offerBy: 'creator' | 'brand'; status: OfferStatus }
  | { kind: 'dispute';  campaignName: string; reason: string; description: string; sentByMe: boolean; status: DisputeStatus }
  | { kind: 'sign_details'; campaignName: string; terms: TermRow[]; sentByMe: boolean; status: SignStatus }
  | { kind: 'invoice';  invoiceNumber: string; campaignName: string; lineItems: LineItem[]; dueDate: string; notes: string; status: InvoiceStatus; sentByMe: boolean }

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

const DISPUTE_REASONS = [
  'Payment overdue', 'Content unfairly rejected', 'Contract terms violated',
  'Scope changed without agreement', 'Communication breakdown', 'Other',
]

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA
   ════════════════════════════════════════════════════════════════════ */
const INITIAL_CONVOS: Conversation[] = [
  {
    id: 'cv1',
    brandName: 'Kinetics', brandType: 'brand', color: '#8B31E8', initials: 'KI', logoUrl: null,
    unread: 1, online: true, lastTime: '2m ago',
    lastMessage: 'I countered at €340 for the 3 pieces.',
    thread: [
      { id: 'm1', sender: 'brand',   text: "Hey Amelia! We'd love to have you on the Vitamin-C Recovery Stack campaign this summer.", time: 'Jun 19, 10:02 AM' },
      { id: 'm2', sender: 'brand',   time: 'Jun 19, 10:03 AM', card: { kind: 'invite', campaignName: 'Vitamin-C Recovery Stack', campaignObjective: 'Conversions', rate: '15% commission', status: 'accepted', sentByMe: false } },
      { id: 'm3', sender: 'creator', text: "Looks great — I've been using similar products and I love the angle. Accepting!", time: 'Jun 19, 10:41 AM' },
      { id: 'm4', sender: 'brand',   text: 'Amazing! Sending you the contract now.', time: 'Jun 19, 11:00 AM' },
      { id: 'm5', sender: 'brand',   time: 'Jun 19, 11:01 AM', card: { kind: 'contract', contractName: 'Vitamin-C Recovery Stack — Amelia Roze', dealType: 'Hybrid', pieces: '3 pieces', status: 'signed', sentByMe: false } },
      { id: 'm6', sender: 'creator', text: 'Signed! Looking forward to working with you on this.', time: 'Jun 19, 11:28 AM' },
      { id: 'm7', sender: 'brand',   time: '10m ago', card: { kind: 'offer', campaignName: 'Vitamin-C Recovery Stack — extra deliverable', amount: '€280', note: 'One extra Reel for the launch week push.', offerBy: 'brand', status: 'countered' } },
      { id: 'm8', sender: 'creator', time: '2m ago', card: { kind: 'offer', campaignName: 'Vitamin-C Recovery Stack — extra deliverable', amount: '€340', note: 'Launch-week turnaround is tight — €340 covers the rush.', offerBy: 'creator', status: 'pending' } },
    ],
  },
  {
    id: 'cv2',
    brandName: 'Forma Fit', brandType: 'brand', color: '#2563EB', initials: 'FF', logoUrl: null,
    unread: 0, online: false, lastTime: '1h ago',
    lastMessage: 'Dispute raised — awaiting Nexfluence review.',
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 10, 9:00 AM', card: { kind: 'invite', campaignName: 'Training Block Q3', campaignObjective: 'UGC', rate: 'From €400/video', status: 'accepted', sentByMe: false } },
      { id: 'm2', sender: 'creator', text: 'Sounds perfect for my training content. In!', time: 'Jun 10, 9:45 AM' },
      { id: 'm3', sender: 'brand',   time: 'Jun 10, 10:00 AM', card: { kind: 'contract', contractName: 'Training Block Q3 — Amelia Roze', dealType: 'Flat fee', pieces: '2 videos', status: 'signed', sentByMe: false } },
      { id: 'm4', sender: 'creator', text: 'Both videos are live — here are the links: [link1] [link2]', time: 'Jun 18, 2:14 PM' },
      { id: 'm5', sender: 'creator', time: 'Jun 20, 9:00 AM', card: { kind: 'payment', amount: '€800', dueDate: 'Jun 18, 2026', campaignName: 'Training Block Q3', note: 'Both deliverables posted on Jun 18. Payment was due within 14 days of go-live per the contract.', status: 'pending', sentByMe: true } },
      { id: 'm6', sender: 'creator', time: '1h ago', card: { kind: 'dispute', campaignName: 'Training Block Q3', reason: 'Payment overdue', description: 'Contract specifies payment within 14 days of go-live. Both deliverables went live Jun 18 and payment is now 2 days past due with no response to my payment request.', sentByMe: true, status: 'open' } },
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
    lastMessage: "I've sent the final terms to sign off on before the full contract.",
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 18, 11:00 AM', card: { kind: 'invite', campaignName: 'Adaptogen Sleep Stack', campaignObjective: 'Conversions', rate: '12% commission', status: 'pending', sentByMe: false } },
      { id: 'm2', sender: 'creator', text: 'Thank you for the invite — reviewing the brief now.', time: 'Jun 18, 11:45 AM' },
      { id: 'm3', sender: 'brand',   text: 'No rush! Let us know if you have questions about the product or brief.', time: 'Jun 18, 12:00 PM' },
      { id: 'm4', sender: 'creator', text: "All good — accepting! Great, I'll get started this week.", time: '1d ago' },
      { id: 'm5', sender: 'creator', time: '1d ago', card: {
          kind: 'sign_details', campaignName: 'Adaptogen Sleep Stack',
          terms: [
            { label: 'Commission rate', value: '12% on tracked sales, 60-day cookie' },
            { label: 'Deliverables', value: '3 pieces — Story, Reel, TikTok' },
            { label: 'Timeline', value: 'Jul 5 – Aug 5' },
            { label: 'Usage rights', value: 'Organic only, no paid amplification' },
          ],
          sentByMe: true, status: 'awaiting_counterparty',
        } },
    ],
  },
  {
    id: 'cv5',
    brandName: 'Vāre Coffee', brandType: 'brand', color: '#EA580C', initials: 'VC', logoUrl: null,
    unread: 0, online: true, lastTime: '2d ago',
    lastMessage: 'Invoice INV-1042 sent — €240 due.',
    thread: [
      { id: 'm1', sender: 'brand',   time: 'Jun 5, 9:00 AM', card: { kind: 'invite', campaignName: 'New Roast Reveal — Baltic Tour', campaignObjective: 'Awareness', rate: '€80 gifting + 10%', status: 'accepted', sentByMe: false } },
      { id: 'm2', sender: 'brand',   time: 'Jun 5, 9:30 AM', card: { kind: 'contract', contractName: 'New Roast Reveal — Amelia Roze', dealType: 'Hybrid', pieces: '1 Reel', status: 'signed', sentByMe: false } },
      { id: 'm3', sender: 'creator', text: 'Reel is live! Tracked sales are looking good already.', time: 'Jun 12, 9:40 AM' },
      { id: 'm4', sender: 'creator', time: '2d ago', card: {
          kind: 'invoice', invoiceNumber: 'INV-1042', campaignName: 'New Roast Reveal', dueDate: 'Jun 26, 2026',
          lineItems: [
            { desc: 'Instagram Reel — New Roast Reveal', qty: 1, rate: 80 },
            { desc: 'Affiliate commission on tracked sales', qty: 1, rate: 160 },
          ],
          notes: 'Reel live since Jun 12. Commission calculated on tracked sales through Jun 20.',
          status: 'sent', sentByMe: true,
        } },
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
function HandshakeIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ReceiptIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
}
function PlusIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"/></svg>
}
function ScaleIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3v18M5 7h14M5 7l-3 7a3.5 3.5 0 007 0L5 7zM19 7l-3 7a3.5 3.5 0 007 0L19 7zM8 21h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TrashIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

function euro(n: number) { return `€${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` }

function extractCampaignNames(convo: Conversation): string[] {
  const set = new Set<string>()
  convo.thread.forEach(m => {
    if (!m.card) return
    if (m.card.kind === 'invite') set.add(m.card.campaignName)
    if (m.card.kind === 'contract') set.add(m.card.contractName.split(' — ')[0]!.trim())
    if (m.card.kind === 'payment') set.add(m.card.campaignName)
    if (m.card.kind === 'offer') set.add(m.card.campaignName)
  })
  return Array.from(set)
}

/* ════════════════════════════════════════════════════════════════════
   DEAL CONTEXT BAR — OLX-style pinned strip showing the most recent
   deal touchpoint for this conversation (invite / contract / offer),
   so the negotiation always has visible anchor context above the chat.
   ════════════════════════════════════════════════════════════════════ */
function computeDealContext(convo: Conversation): { label: string; sub: string; tone: 'green' | 'grey' | 'red' } | null {
  for (let i = convo.thread.length - 1; i >= 0; i--) {
    const m = convo.thread[i]!
    if (!m.card) continue
    if (m.card.kind === 'offer') {
      const tone = m.card.status === 'accepted' ? 'green' : m.card.status === 'declined' ? 'red' : 'grey'
      return { label: `${m.card.campaignName} · ${m.card.amount}`, sub: m.card.status === 'pending' ? (m.card.offerBy === 'creator' ? 'Your offer — awaiting response' : 'Their offer — needs your response') : m.card.status, tone }
    }
    if (m.card.kind === 'contract') {
      const tone = m.card.status === 'signed' ? 'green' : m.card.status === 'changes_requested' ? 'red' : 'grey'
      return { label: m.card.contractName.split(' — ')[0]!.trim(), sub: m.card.status.replace('_', ' '), tone }
    }
    if (m.card.kind === 'invite') {
      const tone = m.card.status === 'accepted' ? 'green' : m.card.status === 'declined' ? 'red' : 'grey'
      return { label: `${m.card.campaignName} · ${m.card.rate}`, sub: m.card.status, tone }
    }
  }
  return null
}

function DealContextBar({ convo, onView }: { convo: Conversation; onView: () => void }) {
  const ctx = useMemo(() => computeDealContext(convo), [convo])
  if (!ctx) return null
  const toneCls = ctx.tone === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ctx.tone === 'red' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-surface-sub text-ink/60 border-primary/8'
  return (
    <div className={`flex flex-shrink-0 items-center justify-between gap-3 border-b px-5 py-2.5 ${toneCls}`}>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-bold leading-tight">{ctx.label}</p>
        <p className="truncate text-[10.5px] font-medium capitalize leading-tight opacity-70">{ctx.sub}</p>
      </div>
      <button onClick={onView} className="flex-shrink-0 text-[11.5px] font-bold underline decoration-1 underline-offset-2 opacity-80 hover:opacity-100">
        View deal
      </button>
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
   INVITE CARD
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
      <div className={`flex items-center gap-2.5 px-4 py-3 ${GRAD_BTN}`}>
        <RocketIcon s={14}/>
        <span className="text-[11.5px] font-bold uppercase tracking-[0.10em] text-white/90">Campaign invite</span>
        {card.status !== 'pending' && (
          <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sc.cls}`}>{sc.label}</span>
        )}
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[14px] font-extrabold leading-tight text-ink">{card.campaignName}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-primary/[0.07] px-2 py-0.5 text-[11px] font-bold text-primary">{card.campaignObjective}</span>
          <span className="text-[12px] font-semibold text-ink/50">{card.rate}</span>
        </div>
      </div>
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
      {card.status === 'pending' && card.sentByMe && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/40">Awaiting response…</p>
        </div>
      )}
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
   CONTRACT CARD
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
      <div className="flex items-center gap-3 border-b border-primary/10 px-4 py-3.5">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} shadow-[0_4px_10px_-4px_rgba(139,49,232,0.45)]`}>
          <FileIcon s={15}/>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-extrabold text-ink">{card.contractName}</p>
          <p className="text-[11px] font-semibold text-ink/45">{card.dealType} · {card.pieces}</p>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sm.badge}`}>{sm.label}</span>
        <button onClick={() => onAction(convoId, 'contract', 'view')}
          className="text-[12px] font-bold text-primary hover:underline">View</button>
      </div>
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
      {card.status === 'signed' && (
        <div className="flex gap-2 border-t border-emerald-100 bg-emerald-50 px-4 py-3">
          <button onClick={() => onAction(convoId, 'contract', 'download')}
            className="flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-700 hover:underline">
            <DownloadIcon s={13}/>Download contract PDF
          </button>
        </div>
      )}
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
   PAYMENT CARD  (quick informal ask — distinct from Invoice)
   ════════════════════════════════════════════════════════════════════ */
function PaymentCard({ card, brandName }: {
  card: Extract<SpecialCard, { kind: 'payment' }>
  brandName: string
}) {
  const headerCls = card.status === 'pending' ? 'bg-amber-500' : card.status === 'paid' ? 'bg-emerald-500' : 'bg-ink/20'
  const statusLabel = card.status === 'pending' ? 'Awaiting payment' : card.status === 'paid' ? 'Paid ✓' : 'Brand responded'
  const badgeCls = card.status === 'reason_given' ? 'bg-surface-sub text-ink/60 border-primary/10' : 'bg-white/20 text-white border-white/30'

  return (
    <div className={`w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'pending' ? 'border-amber-300' : 'border-primary/10'}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 ${headerCls}`}>
        <EuroIcon s={15}/>
        <span className="text-[12px] font-bold uppercase tracking-[0.10em] text-white/90">Payment request</span>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeCls}`}>{statusLabel}</span>
      </div>
      <div className="px-4 py-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-[28px] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{card.amount}</span>
          <span className="text-[12px] font-semibold text-ink/45">due {card.dueDate}</span>
        </div>
        <p className="mt-0.5 text-[12px] font-semibold text-ink/55">{card.campaignName}</p>
        <p className="mt-2 text-[12.5px] leading-[1.65] text-ink/60">{card.note}</p>
      </div>
      {card.status === 'pending' && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-amber-700">Sent to {brandName} — awaiting confirmation or response.</p>
        </div>
      )}
      {card.status === 'paid' && (
        <div className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50 px-4 py-3">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckIcon s={10}/></span>
          <p className="text-[12px] font-semibold text-emerald-700">{brandName} has processed this payment.</p>
        </div>
      )}
      {card.status === 'reason_given' && (
        <div className="flex items-start gap-2 border-t border-amber-200 bg-amber-50 px-4 py-3">
          <AlertIcon s={14}/>
          <p className="text-[11.5px] font-semibold text-amber-700">{brandName} replied with a reason — check the message below.</p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   OFFER CARD — OLX-style negotiation. Each offer is its own card;
   countering supersedes it and appends a fresh one from the other side.
   ════════════════════════════════════════════════════════════════════ */
function OfferCard({ card, convoId, brandName, onAccept, onDecline, onCounter }: {
  card: Extract<SpecialCard, { kind: 'offer' }>
  convoId: string; brandName: string
  onAccept: (convoId: string) => void
  onDecline: (convoId: string) => void
  onCounter: (convoId: string, amount: string, note: string) => void
}) {
  const [countering, setCountering] = useState(false)
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')

  const isFromBrand = card.offerBy === 'brand'
  const isMine       = card.offerBy === 'creator'
  const badge =
    card.status === 'accepted' ? { label: 'Accepted ✓', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' } :
    card.status === 'declined' ? { label: 'Declined',   cls: 'bg-rose-50 text-rose-600 border-rose-200' } :
    card.status === 'countered' ? { label: 'Superseded', cls: 'bg-surface-sub text-ink/45 border-primary/10' } :
    null

  const submitCounter = () => {
    if (!amount.trim()) return
    onCounter(convoId, amount.trim().startsWith('€') ? amount.trim() : `€${amount.trim()}`, note.trim())
    setCountering(false); setAmount(''); setNote('')
  }

  return (
    <div className={`w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'pending' ? 'border-primary/20' : 'border-primary/10'}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 ${GRAD_BTN}`}>
        <HandshakeIcon s={14}/>
        <span className="text-[11.5px] font-bold uppercase tracking-[0.10em] text-white/90">{isMine ? 'Your offer' : 'Offer received'}</span>
        {badge && <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${badge.cls}`}>{badge.label}</span>}
      </div>
      <div className="px-4 py-3.5">
        <div className="flex items-baseline gap-2">
          <span className={`text-[26px] font-black tracking-[-0.03em] ${GRAD_TEXT}`}>{card.amount}</span>
        </div>
        <p className="mt-0.5 text-[12px] font-semibold text-ink/55">{card.campaignName}</p>
        {card.note && <p className="mt-2 text-[12.5px] leading-[1.6] text-ink/60">{card.note}</p>}
      </div>

      {/* Received, pending → Accept / Counter / Decline */}
      {card.status === 'pending' && isFromBrand && !countering && (
        <div className="flex gap-2 border-t border-primary/10 px-4 py-3">
          <button onClick={() => onDecline(convoId)}
            className="flex h-9 flex-1 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-[12.5px] font-bold text-rose-600 transition hover:bg-rose-100">
            Decline
          </button>
          <button onClick={() => setCountering(true)}
            className="flex h-9 flex-1 items-center justify-center rounded-xl border border-primary/15 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.05]">
            Counter
          </button>
          <button onClick={() => onAccept(convoId)}
            className={`flex h-9 flex-1 items-center justify-center gap-1 rounded-xl ${GRAD_BTN} text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
            <CheckIcon s={11}/>Accept
          </button>
        </div>
      )}

      {/* Inline counter form */}
      {countering && (
        <div className="space-y-2.5 border-t border-primary/10 bg-surface-sub px-4 py-3.5">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-ink/40">€</span>
            <input autoFocus value={amount} onChange={e => setAmount(e.target.value)} placeholder="Your counter amount"
              className="w-full rounded-lg border border-primary/15 bg-white py-2 pl-7 pr-3 text-[13px] font-semibold text-ink outline-none focus:border-primary"/>
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a short note (optional)"
            className="w-full rounded-lg border border-primary/15 bg-white px-3 py-2 text-[12.5px] text-ink outline-none focus:border-primary"/>
          <div className="flex gap-2">
            <button onClick={() => setCountering(false)} className="flex-1 rounded-lg border border-primary/15 bg-white py-2 text-[12px] font-bold text-ink/50 transition hover:bg-surface-sub">Cancel</button>
            <button onClick={submitCounter} disabled={!amount.trim()}
              className={`flex-1 rounded-lg py-2 text-[12px] font-bold text-white transition ${amount.trim() ? `${GRAD_BTN} hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/15'}`}>
              Send counter
            </button>
          </div>
        </div>
      )}

      {/* Sent by me, pending → waiting */}
      {card.status === 'pending' && isMine && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/40">Waiting for {brandName} to respond…</p>
        </div>
      )}
      {card.status === 'accepted' && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-emerald-700">Both sides agreed on {card.amount}.</p>
        </div>
      )}
      {card.status === 'declined' && (
        <div className="border-t border-rose-100 bg-rose-50 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-rose-600">This offer was declined.</p>
        </div>
      )}
      {card.status === 'countered' && (
        <div className="border-t border-primary/10 bg-surface-sub px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/45">Superseded by a new offer below.</p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DISPUTE CARD
   ════════════════════════════════════════════════════════════════════ */
function DisputeCard({ card, onOpen }: {
  card: Extract<SpecialCard, { kind: 'dispute' }>
  onOpen: () => void
}) {
  const statusMap: Record<DisputeStatus, { label: string; cls: string }> = {
    open:          { label: 'Open',          cls: 'bg-rose-50 text-rose-700 border-rose-200'    },
    under_review:  { label: 'Under review',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    resolved:      { label: 'Resolved',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }
  const sm = statusMap[card.status]
  return (
    <div className={`w-[320px] max-w-full overflow-hidden rounded-2xl border border-rose-200 bg-white ${CARD}`}>
      <div className="flex items-center gap-2.5 bg-rose-500 px-4 py-3">
        <ScaleIcon s={14}/>
        <span className="text-[11.5px] font-bold uppercase tracking-[0.10em] text-white/90">Dispute raised</span>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sm.cls}`}>{sm.label}</span>
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[13px] font-extrabold text-ink">{card.campaignName}</p>
        <p className="mt-1 text-[11.5px] font-bold uppercase tracking-[0.06em] text-rose-500">{card.reason}</p>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-ink/65">{card.description}</p>
      </div>
      <div className="flex items-center justify-between border-t border-rose-100 bg-rose-50 px-4 py-3">
        <p className="text-[11px] font-semibold text-rose-600">Nexfluence support has been notified.</p>
        <button onClick={onOpen} className="flex-shrink-0 text-[12px] font-bold text-rose-700 hover:underline">View dispute →</button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SIGN DETAILS CARD — lightweight terms confirmation, either party can
   initiate; whoever hasn't signed yet can countersign inline.
   ════════════════════════════════════════════════════════════════════ */
function SignDetailsCard({ card, convoId, brandName, onCountersign }: {
  card: Extract<SpecialCard, { kind: 'sign_details' }>
  convoId: string; brandName: string
  onCountersign: (convoId: string) => void
}) {
  const fully = card.status === 'fully_signed'
  return (
    <div className={`w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${fully ? 'border-emerald-200' : 'border-primary/15'}`}>
      <div className="flex items-center gap-2.5 border-b border-primary/10 px-4 py-3">
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${GRAD_BTN} text-white`}>
          <PenIcon s={13}/>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink/45">Final details to sign</p>
          <p className="truncate text-[13px] font-extrabold text-ink">{card.campaignName}</p>
        </div>
        <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${fully ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          {fully ? 'Fully signed ✓' : 'Awaiting countersign'}
        </span>
      </div>
      <div className="space-y-2 px-4 py-3.5">
        {card.terms.map((t, i) => (
          <div key={i} className="flex items-start justify-between gap-3 text-[12px]">
            <span className="flex-shrink-0 font-semibold text-ink/45">{t.label}</span>
            <span className="text-right font-bold text-ink">{t.value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-primary/8 px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/50">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckIcon s={9}/></span>You signed
        </div>
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${fully ? 'text-ink/50' : 'text-amber-600'}`}>
          {fully
            ? <><span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"><CheckIcon s={9}/></span>{brandName} signed</>
            : <>{!card.sentByMe
                ? <button onClick={() => onCountersign(convoId)} className="rounded-lg border border-primary/20 bg-primary/[0.05] px-2.5 py-1 font-bold text-primary transition hover:bg-primary/[0.1]">Add my signature</button>
                : <span>Awaiting {brandName}…</span>}
              </>
          }
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INVOICE CARD — formal, line-itemized (distinct from PaymentCard)
   ════════════════════════════════════════════════════════════════════ */
function InvoiceCard({ card }: { card: Extract<SpecialCard, { kind: 'invoice' }> }) {
  const total = card.lineItems.reduce((s, li) => s + li.qty * li.rate, 0)
  const statusMap: Record<InvoiceStatus, { label: string; cls: string }> = {
    sent:     { label: 'Sent',     cls: 'bg-white/20 text-white border-white/30' },
    paid:     { label: 'Paid ✓',   cls: 'bg-white/20 text-white border-white/30' },
    overdue:  { label: 'Overdue',  cls: 'bg-white/20 text-white border-white/30' },
  }
  const sm = statusMap[card.status]
  const headerCls = card.status === 'paid' ? 'bg-emerald-500' : card.status === 'overdue' ? 'bg-rose-500' : 'bg-ink'
  return (
    <div className={`w-[340px] max-w-full overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 ${headerCls}`}>
        <ReceiptIcon s={14}/>
        <span className="text-[11.5px] font-bold uppercase tracking-[0.10em] text-white/90">Invoice {card.invoiceNumber}</span>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${sm.cls}`}>{sm.label}</span>
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[12.5px] font-bold text-ink/60">{card.campaignName}</p>
        <div className="mt-3 divide-y divide-primary/6 rounded-xl border border-primary/8">
          {card.lineItems.map((li, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 text-[12px]">
              <span className="min-w-0 flex-1 truncate pr-2 text-ink/70">{li.desc} {li.qty > 1 && <span className="text-ink/40">×{li.qty}</span>}</span>
              <span className="flex-shrink-0 font-bold text-ink">{euro(li.qty * li.rate)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between bg-surface-sub px-3 py-2.5">
            <span className="text-[12.5px] font-bold text-ink">Total</span>
            <span className={`text-[15px] font-black ${GRAD_TEXT}`}>{euro(total)}</span>
          </div>
        </div>
        <p className="mt-2.5 text-[11.5px] font-semibold text-ink/45">Due {card.dueDate}</p>
        {card.notes && <p className="mt-1.5 text-[12px] leading-[1.55] text-ink/55">{card.notes}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-primary/8 bg-surface-sub px-4 py-3">
        <button className="flex items-center gap-1.5 text-[12px] font-bold text-primary hover:underline">
          <DownloadIcon s={13}/>Download PDF
        </button>
        <span className="text-[11px] font-semibold text-ink/40">
          {card.status === 'sent' ? 'Awaiting payment' : card.status === 'paid' ? 'Payment received' : 'Past due date'}
        </span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
   ════════════════════════════════════════════════════════════════════ */
function MessageBubble({ msg, convoId, brandName, brandColor, brandInitials, brandLogoUrl, onCardAction, onOfferAccept, onOfferDecline, onOfferCounter, onDisputeOpen, onCountersign }: {
  msg: Message
  convoId: string
  brandName: string
  brandColor: string
  brandInitials: string
  brandLogoUrl: string | null
  onCardAction: (convoId: string, kind: string, action: string) => void
  onOfferAccept: (convoId: string) => void
  onOfferDecline: (convoId: string) => void
  onOfferCounter: (convoId: string, amount: string, note: string) => void
  onDisputeOpen: () => void
  onCountersign: (convoId: string) => void
}) {
  const isMe = msg.sender === 'creator'

  if (msg.card) {
    return (
      <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && <BrandAvatar initials={brandInitials} color={brandColor} logoUrl={brandLogoUrl} size={30}/>}
        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
          {msg.card.kind === 'invite' && <InviteCard card={msg.card} convoId={convoId} onAction={(id, k, a) => onCardAction(id, k, a)}/>}
          {msg.card.kind === 'contract' && <ContractCard card={msg.card} convoId={convoId} onAction={(id, k, a) => onCardAction(id, k, a)}/>}
          {msg.card.kind === 'payment' && <PaymentCard card={msg.card} brandName={brandName}/>}
          {msg.card.kind === 'offer' && (
            <OfferCard card={msg.card} convoId={convoId} brandName={brandName}
              onAccept={onOfferAccept} onDecline={onOfferDecline} onCounter={onOfferCounter}/>
          )}
          {msg.card.kind === 'dispute' && <DisputeCard card={msg.card} onOpen={onDisputeOpen}/>}
          {msg.card.kind === 'sign_details' && <SignDetailsCard card={msg.card} convoId={convoId} brandName={brandName} onCountersign={onCountersign}/>}
          {msg.card.kind === 'invoice' && <InvoiceCard card={msg.card}/>}
          <span className="px-1 text-[10.5px] font-medium text-ink/35">{msg.time}</span>
        </div>
        {isMe && <div className="h-[30px] w-[30px] flex-shrink-0"/>}
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && <BrandAvatar initials={brandInitials} color={brandColor} logoUrl={brandLogoUrl} size={30}/>}
      <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-[340px] rounded-2xl px-4 py-2.5 text-[13.5px] leading-[1.55] ${
          isMe ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.40)]` : 'bg-surface-sub text-ink/80'
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
   CONVERSATION LIST ROW
   ════════════════════════════════════════════════════════════════════ */
function ConvoRow({ convo, active, onClick }: { convo: Conversation; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${active ? 'bg-primary/[0.07]' : 'hover:bg-primary/[0.03]'}`}>
      <BrandAvatar initials={convo.initials} color={convo.color} logoUrl={convo.logoUrl} size={42} online={convo.online}/>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`truncate text-[13.5px] ${convo.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink/75'}`}>{convo.brandName}</span>
            <span className={`flex-shrink-0 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${convo.brandType === 'agency' ? 'bg-blue-50 text-blue-600' : 'bg-primary/[0.07] text-primary'}`}>
              {convo.brandType === 'agency' ? <AgencyIcon s={9}/> : <BuildingIcon s={9}/>}
            </span>
          </div>
          <span className="flex-shrink-0 text-[10.5px] font-medium text-ink/35">{convo.lastTime}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`truncate text-[12px] ${convo.unread > 0 ? 'font-semibold text-ink/60' : 'text-ink/40'}`}>{convo.lastMessage}</span>
          {convo.unread > 0 && (
            <span className={`flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-black text-white ${GRAD_BTN}`}>{convo.unread}</span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SHARED MODAL FIELD ATOMS
   ════════════════════════════════════════════════════════════════════ */
const M_INP = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[13.5px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
const M_LBL = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.10em] text-ink/45'

function CampaignPicker({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className={M_LBL}>Related campaign</label>
      <input className={M_INP} value={value} onChange={e => onChange(e.target.value)} placeholder="Type or pick a campaign below"/>
      {options.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {options.map(o => (
            <button key={o} type="button" onClick={() => onChange(o)}
              className={`rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold transition ${value === o ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ModalShell({ open, onClose, icon, title, subtitle, children, footer }: {
  open: boolean; onClose: () => void; icon: ReactNode; title: string; subtitle: string
  children: ReactNode; footer: ReactNode
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
    <div className="fixed inset-0 z-[700] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[500px] max-h-[90vh] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>
        <div className="mx-auto mt-3 h-1 w-10 flex-shrink-0 rounded-full bg-ink/12 sm:hidden"/>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]`}>{icon}</div>
            <div><p className="text-[15px] font-extrabold text-ink">{title}</p><p className="text-[11.5px] text-ink/45">{subtitle}</p></div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10"><XIcon s={13}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
        <div className="flex flex-shrink-0 gap-2.5 border-t border-primary/10 px-6 py-4">{footer}</div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAYMENT REQUEST MODAL (quick ask)
   ════════════════════════════════════════════════════════════════════ */
function PaymentRequestModal({ open, brandName, campaignOptions, onClose, onSend }: {
  open: boolean; brandName: string; campaignOptions: string[]
  onClose: () => void
  onSend: (amount: string, dueDate: string, campaignName: string, note: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const valid = amount.trim().length > 0 && campaignName.trim().length > 0

  const handleSend = async () => {
    if (!valid) return
    setSending(true)
    await new Promise(r => setTimeout(r, 700))
    onSend(amount.trim().startsWith('€') ? amount.trim() : `€${amount.trim()}`, dueDate || 'On receipt', campaignName.trim(), note.trim() || `Payment request for ${campaignName.trim()}.`)
    setAmount(''); setDueDate(''); setCampaignName(''); setNote(''); setSending(false)
    onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} icon={<EuroIcon s={18}/>} title="Request payment" subtitle={`From ${brandName}`}
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">Cancel</button>
          <button onClick={handleSend} disabled={!valid || sending}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${valid && !sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            {sending ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</> : <><SendIcon s={14}/>Send request</>}
          </button>
        </>
      }>
      <p className="text-[12.5px] leading-[1.65] text-ink/55">A quick, informal ask — good for a fast nudge. For a formal line-itemized bill, use Send invoice instead.</p>
      <div>
        <label className={M_LBL}>Amount *</label>
        <div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">€</span>
          <input className={`${M_INP} pl-8`} type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="800"/>
        </div>
      </div>
      <CampaignPicker value={campaignName} onChange={setCampaignName} options={campaignOptions}/>
      <div><label className={M_LBL}>Due date (optional)</label><input type="date" className={M_INP} value={dueDate} onChange={e => setDueDate(e.target.value)}/></div>
      <div><label className={M_LBL}>Note (optional)</label>
        <textarea className={`${M_INP} min-h-[80px] resize-none leading-relaxed text-[13px]`} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. All 3 reels posted on Jun 18 as per contract."/>
      </div>
    </ModalShell>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MAKE AN OFFER MODAL
   ════════════════════════════════════════════════════════════════════ */
function OfferModal({ open, brandName, campaignOptions, onClose, onSend }: {
  open: boolean; brandName: string; campaignOptions: string[]
  onClose: () => void; onSend: (campaignName: string, amount: string, note: string) => void
}) {
  const [campaignName, setCampaignName] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const valid = campaignName.trim().length > 0 && amount.trim().length > 0

  const handleSend = () => {
    if (!valid) return
    onSend(campaignName.trim(), amount.trim().startsWith('€') ? amount.trim() : `€${amount.trim()}`, note.trim())
    setCampaignName(''); setAmount(''); setNote(''); onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} icon={<HandshakeIcon s={17}/>} title="Make an offer" subtitle={`To ${brandName}`}
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">Cancel</button>
          <button onClick={handleSend} disabled={!valid}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${valid ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            <SendIcon s={14}/>Send offer
          </button>
        </>
      }>
      <p className="text-[12.5px] leading-[1.65] text-ink/55">Propose a rate for a new deliverable, or open a negotiation on an existing one. {brandName} can accept, counter, or decline right in the thread.</p>
      <CampaignPicker value={campaignName} onChange={setCampaignName} options={campaignOptions}/>
      <div><label className={M_LBL}>Your offer *</label>
        <div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">€</span>
          <input className={`${M_INP} pl-8`} type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="300"/>
        </div>
      </div>
      <div><label className={M_LBL}>Note (optional)</label>
        <textarea className={`${M_INP} min-h-[70px] resize-none leading-relaxed text-[13px]`} value={note} onChange={e => setNote(e.target.value)} placeholder="Explain what's included, timeline, or why this rate."/>
      </div>
    </ModalShell>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SIGN DETAILS MODAL
   ════════════════════════════════════════════════════════════════════ */
function SignDetailsModal({ open, brandName, campaignOptions, onClose, onSend }: {
  open: boolean; brandName: string; campaignOptions: string[]
  onClose: () => void; onSend: (campaignName: string, terms: TermRow[]) => void
}) {
  const [campaignName, setCampaignName] = useState('')
  const [terms, setTerms] = useState<TermRow[]>([
    { label: 'Rate', value: '' }, { label: 'Deliverables', value: '' }, { label: 'Timeline', value: '' },
  ])
  const valid = campaignName.trim().length > 0 && terms.some(t => t.label.trim() && t.value.trim())

  const updTerm = (i: number, patch: Partial<TermRow>) => setTerms(prev => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t))
  const addTerm = () => setTerms(prev => [...prev, { label: '', value: '' }])
  const rmTerm  = (i: number) => setTerms(prev => prev.filter((_, idx) => idx !== i))

  const handleSend = () => {
    const clean = terms.filter(t => t.label.trim() && t.value.trim())
    if (!campaignName.trim() || clean.length === 0) return
    onSend(campaignName.trim(), clean)
    setCampaignName(''); setTerms([{ label: 'Rate', value: '' }, { label: 'Deliverables', value: '' }, { label: 'Timeline', value: '' }]); onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} icon={<PenIcon s={17}/>} title="Sign details" subtitle={`Confirm final terms with ${brandName}`}
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">Cancel</button>
          <button onClick={handleSend} disabled={!valid}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${valid ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            <PenIcon s={14}/>Sign & send
          </button>
        </>
      }>
      <p className="text-[12.5px] leading-[1.65] text-ink/55">A lightweight terms summary — good after a rate is agreed, before a full contract is drawn up. Your signature is added automatically; {brandName} countersigns from their side.</p>
      <CampaignPicker value={campaignName} onChange={setCampaignName} options={campaignOptions}/>
      <div>
        <label className={M_LBL}>Terms</label>
        <div className="space-y-2">
          {terms.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={`${M_INP} w-[38%]`} value={t.label} onChange={e => updTerm(i, { label: e.target.value })} placeholder="Label"/>
              <input className={`${M_INP} flex-1`} value={t.value} onChange={e => updTerm(i, { value: e.target.value })} placeholder="Value"/>
              <button type="button" onClick={() => rmTerm(i)} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/35 transition hover:border-rose-200 hover:text-rose-500"><TrashIcon s={13}/></button>
            </div>
          ))}
          <button type="button" onClick={addTerm} className="text-[12.5px] font-bold text-primary hover:underline">+ Add a term</button>
        </div>
      </div>
    </ModalShell>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INVOICE MODAL
   ════════════════════════════════════════════════════════════════════ */
let _invCounter = 1043
function InvoiceModal({ open, brandName, campaignOptions, onClose, onSend }: {
  open: boolean; brandName: string; campaignOptions: string[]
  onClose: () => void; onSend: (campaignName: string, lineItems: LineItem[], dueDate: string, notes: string) => void
}) {
  const [campaignName, setCampaignName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ desc: '', qty: 1, rate: 0 }])

  const updItem = (i: number, patch: Partial<LineItem>) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  const addItem = () => setItems(prev => [...prev, { desc: '', qty: 1, rate: 0 }])
  const rmItem  = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const total = items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0)
  const valid = campaignName.trim().length > 0 && items.some(it => it.desc.trim() && it.rate > 0)

  const handleSend = () => {
    const clean = items.filter(it => it.desc.trim() && it.rate > 0)
    if (!campaignName.trim() || clean.length === 0) return
    onSend(campaignName.trim(), clean, dueDate || 'On receipt', notes.trim())
    setCampaignName(''); setDueDate(''); setNotes(''); setItems([{ desc: '', qty: 1, rate: 0 }]); onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} icon={<ReceiptIcon s={17}/>} title="Send invoice" subtitle={`Invoice #INV-${_invCounter} · to ${brandName}`}
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">Cancel</button>
          <button onClick={handleSend} disabled={!valid}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${valid ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            <SendIcon s={14}/>Send invoice · {euro(total)}
          </button>
        </>
      }>
      <p className="text-[12.5px] leading-[1.65] text-ink/55">A formal, line-itemized bill. Good for closing out a completed campaign with a proper paper trail.</p>
      <CampaignPicker value={campaignName} onChange={setCampaignName} options={campaignOptions}/>
      <div>
        <label className={M_LBL}>Line items</label>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_50px_80px_36px] items-center gap-2">
              <input className={M_INP} value={it.desc} onChange={e => updItem(i, { desc: e.target.value })} placeholder="Description"/>
              <input className={M_INP} type="number" min={1} value={it.qty} onChange={e => updItem(i, { qty: parseInt(e.target.value, 10) || 1 })} placeholder="Qty"/>
              <div className="relative"><span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-ink/35">€</span>
                <input className={`${M_INP} pl-5`} type="number" min={0} value={it.rate || ''} onChange={e => updItem(i, { rate: parseFloat(e.target.value) || 0 })} placeholder="0"/>
              </div>
              <button type="button" onClick={() => rmItem(i)} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/35 transition hover:border-rose-200 hover:text-rose-500"><TrashIcon s={13}/></button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-[12.5px] font-bold text-primary hover:underline">+ Add line item</button>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-sub px-4 py-2.5">
          <span className="text-[12.5px] font-bold text-ink/60">Total</span>
          <span className={`text-[16px] font-black ${GRAD_TEXT}`}>{euro(total)}</span>
        </div>
      </div>
      <div><label className={M_LBL}>Due date (optional)</label><input type="date" className={M_INP} value={dueDate} onChange={e => setDueDate(e.target.value)}/></div>
      <div><label className={M_LBL}>Notes (optional)</label>
        <textarea className={`${M_INP} min-h-[70px] resize-none leading-relaxed text-[13px]`} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Reel live since Jun 12. Commission calculated through Jun 20."/>
      </div>
    </ModalShell>
  )
}

/* ════════════════════════════════════════════════════════════════════
   RAISE DISPUTE MODAL
   ════════════════════════════════════════════════════════════════════ */
function DisputeModal({ open, brandName, campaignOptions, onClose, onSend }: {
  open: boolean; brandName: string; campaignOptions: string[]
  onClose: () => void; onSend: (campaignName: string, reason: string, description: string) => void
}) {
  const [campaignName, setCampaignName] = useState('')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const valid = campaignName.trim().length > 0 && reason.length > 0 && description.trim().length > 0

  const handleSend = () => {
    if (!valid) return
    onSend(campaignName.trim(), reason, description.trim())
    setCampaignName(''); setReason(''); setDescription(''); onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} icon={<ScaleIcon s={17}/>} title="Raise a dispute" subtitle={`Regarding ${brandName}`}
      footer={
        <>
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">Cancel</button>
          <button onClick={handleSend} disabled={!valid}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl bg-rose-500 py-3 text-[14px] font-bold text-white transition ${valid ? 'hover:-translate-y-0.5 hover:bg-rose-600' : 'cursor-not-allowed opacity-40'}`}>
            <ScaleIcon s={14}/>Submit dispute
          </button>
        </>
      }>
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-[1.6] text-amber-700">
        This notifies Nexfluence support and flags the conversation for review. Use this if a direct message hasn't resolved the issue.
      </p>
      <CampaignPicker value={campaignName} onChange={setCampaignName} options={campaignOptions}/>
      <div>
        <label className={M_LBL}>Reason *</label>
        <div className="flex flex-wrap gap-2">
          {DISPUTE_REASONS.map(r => (
            <button key={r} type="button" onClick={() => setReason(r)}
              className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${reason === r ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div><label className={M_LBL}>Describe what happened *</label>
        <textarea className={`${M_INP} min-h-[100px] resize-none leading-relaxed text-[13px]`} value={description} onChange={e => setDescription(e.target.value)} placeholder="Give dates, amounts, and what you're asking to be resolved."/>
      </div>
    </ModalShell>
  )
}

/* ════════════════════════════════════════════════════════════════════
   QUICK ACTIONS POPOVER — replaces the single € header button
   ════════════════════════════════════════════════════════════════════ */
function QuickActionsMenu({ onSelect }: { onSelect: (action: 'payment' | 'offer' | 'sign' | 'invoice' | 'dispute') => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  const items: { key: 'payment' | 'offer' | 'sign' | 'invoice' | 'dispute'; label: string; sub: string; icon: ReactNode; tone: string }[] = [
    { key: 'payment', label: 'Request payment', sub: 'Quick, informal ask',        icon: <EuroIcon s={15}/>,      tone: 'text-primary bg-primary/[0.08]' },
    { key: 'offer',   label: 'Make an offer',   sub: 'Propose or negotiate a rate', icon: <HandshakeIcon s={15}/>, tone: 'text-primary bg-primary/[0.08]' },
    { key: 'sign',    label: 'Sign details',    sub: 'Confirm final terms',         icon: <PenIcon s={14}/>,       tone: 'text-primary bg-primary/[0.08]' },
    { key: 'invoice', label: 'Send invoice',    sub: 'Formal line-itemized bill',   icon: <ReceiptIcon s={14}/>,   tone: 'text-primary bg-primary/[0.08]' },
    { key: 'dispute', label: 'Raise a dispute', sub: 'Flag an issue for review',    icon: <ScaleIcon s={14}/>,     tone: 'text-rose-600 bg-rose-50' },
  ]
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(o => !o)} title="Quick actions" aria-label="Quick actions"
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${open ? `${GRAD_BTN} text-white shadow-[0_4px_10px_-4px_rgba(139,49,232,0.45)]` : 'bg-primary/[0.08] text-primary hover:bg-primary/[0.14]'}`}
        style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.18s ease, background 0.18s ease' }}>
        <PlusIcon s={17}/>
      </button>
      {open && (
        <div className={`absolute bottom-[calc(100%+8px)] right-0 z-30 w-[250px] overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
          {items.map(it => (
            <button key={it.key} onClick={() => { onSelect(it.key); setOpen(false) }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-primary/[0.05]">
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${it.tone}`}>{it.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-ink">{it.label}</span>
                <span className="block text-[11px] text-ink/45">{it.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function CreatorMessagesPage() {
  const router = useRouter()

  const [convos,   setConvos]   = useState<Conversation[]>(INITIAL_CONVOS)
  const [activeId, setActiveId] = useState<string>(INITIAL_CONVOS[0]!.id)
  const [draft,    setDraft]    = useState('')
  const [search,   setSearch]   = useState('')
  const [showList, setShowList] = useState(true)

  const [payModal,      setPayModal]      = useState(false)
  const [offerModal,    setOfferModal]    = useState(false)
  const [signModal,     setSignModal]     = useState(false)
  const [invoiceModal,  setInvoiceModal]  = useState(false)
  const [disputeModal,  setDisputeModal]  = useState(false)

  const threadEnd = useRef<HTMLDivElement>(null)
  const UNREAD_NOTIFS = 2

  const active   = convos.find(c => c.id === activeId)!
  const filtered = convos.filter(c => c.brandName.toLowerCase().includes(search.toLowerCase()))
  const totalUnread = convos.reduce((n, c) => n + c.unread, 0)
  const campaignOptions = useMemo(() => extractCampaignNames(active), [active])

  useEffect(() => { threadEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [activeId, active?.thread.length])

  const openConvo = (id: string) => {
    setActiveId(id)
    setConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
    setShowList(false)
  }

  const appendCard = (convoId: string, card: SpecialCard, lastMessage: string, extraText?: string) => {
    setConvos(prev => prev.map(c => {
      if (c.id !== convoId) return c
      const msgs: Message[] = [{ id: newId('m'), sender: 'creator', time: 'Just now', card }]
      if (extraText) msgs.push({ id: newId('m'), sender: 'creator', text: extraText, time: 'Just now' })
      return { ...c, thread: [...c.thread, ...msgs], lastMessage, lastTime: 'Just now' }
    }))
  }

  const sendMessage = () => {
    const text = draft.trim(); if (!text) return
    const msg: Message = { id: newId('m'), sender: 'creator', text, time: 'Just now' }
    setConvos(prev => prev.map(c => c.id !== activeId ? c : { ...c, thread: [...c.thread, msg], lastMessage: text, lastTime: 'Just now' }))
    setDraft('')
  }

  /* ── Payment request ── */
  const sendPaymentRequest = (amount: string, dueDate: string, campaignName: string, note: string) => {
    appendCard(activeId, { kind: 'payment', amount, dueDate, campaignName, note, status: 'pending', sentByMe: true }, `Payment request: ${amount}`)
  }

  /* ── Offer / counter-offer ── */
  const sendNewOffer = (campaignName: string, amount: string, note: string) => {
    appendCard(activeId, { kind: 'offer', campaignName, amount, note, offerBy: 'creator', status: 'pending' }, `Offer sent: ${amount}`)
  }
  const respondOfferAccept = (convoId: string) => {
    setConvos(prev => prev.map(c => {
      if (c.id !== convoId) return c
      let acceptedAmount = ''
      const thread = c.thread.map(m => {
        if (m.card?.kind === 'offer' && m.card.status === 'pending' && m.card.offerBy === 'brand') {
          acceptedAmount = m.card.amount
          return { ...m, card: { ...m.card, status: 'accepted' as OfferStatus } }
        }
        return m
      })
      return {
        ...c,
        thread: [...thread, { id: newId('m'), sender: 'creator' as const, text: `Accepted — ${acceptedAmount} works for me. Let's move forward.`, time: 'Just now' }],
        lastMessage: `Offer accepted — ${acceptedAmount}`, lastTime: 'Just now',
      }
    }))
  }
  const respondOfferDecline = (convoId: string) => {
    setConvos(prev => prev.map(c => {
      if (c.id !== convoId) return c
      const thread = c.thread.map(m => m.card?.kind === 'offer' && m.card.status === 'pending' && m.card.offerBy === 'brand'
        ? { ...m, card: { ...m.card, status: 'declined' as OfferStatus } } : m)
      return { ...c, thread: [...thread, { id: newId('m'), sender: 'creator' as const, text: "That rate doesn't work for me on this one — happy to discuss alternatives.", time: 'Just now' }], lastMessage: 'Offer declined', lastTime: 'Just now' }
    }))
  }
  const respondOfferCounter = (convoId: string, amount: string, note: string) => {
    setConvos(prev => prev.map(c => {
      if (c.id !== convoId) return c
      let campaignName = ''
      const thread = c.thread.map(m => {
        if (m.card?.kind === 'offer' && m.card.status === 'pending' && m.card.offerBy === 'brand') {
          campaignName = m.card.campaignName
          return { ...m, card: { ...m.card, status: 'countered' as OfferStatus } }
        }
        return m
      })
      const newOffer: Message = { id: newId('m'), sender: 'creator', time: 'Just now', card: { kind: 'offer', campaignName, amount, note, offerBy: 'creator', status: 'pending' } }
      return { ...c, thread: [...thread, newOffer], lastMessage: `Countered at ${amount}`, lastTime: 'Just now' }
    }))
  }

  /* ── Sign details ── */
  const sendSignDetails = (campaignName: string, terms: TermRow[]) => {
    appendCard(activeId, { kind: 'sign_details', campaignName, terms, sentByMe: true, status: 'awaiting_counterparty' }, `Sent final terms to sign — ${campaignName}`)
  }
  const countersignDetails = (convoId: string) => {
    setConvos(prev => prev.map(c => {
      if (c.id !== convoId) return c
      const thread = c.thread.map(m => m.card?.kind === 'sign_details' && m.card.status === 'awaiting_counterparty' && !m.card.sentByMe
        ? { ...m, card: { ...m.card, status: 'fully_signed' as SignStatus } } : m)
      return { ...c, thread: [...thread, { id: newId('m'), sender: 'creator' as const, text: 'Signed my side — all set on the final terms.', time: 'Just now' }], lastMessage: 'Details fully signed ✓', lastTime: 'Just now' }
    }))
  }

  /* ── Invoice ── */
  const sendInvoice = (campaignName: string, lineItems: LineItem[], dueDate: string, notes: string) => {
    const invoiceNumber = `INV-${_invCounter++}`
    appendCard(activeId, { kind: 'invoice', invoiceNumber, campaignName, lineItems, dueDate, notes, status: 'sent', sentByMe: true }, `Invoice ${invoiceNumber} sent`)
  }

  /* ── Dispute ── */
  const sendDispute = (campaignName: string, reason: string, description: string) => {
    appendCard(activeId, { kind: 'dispute', campaignName, reason, description, sentByMe: true, status: 'open' }, `Dispute raised: ${reason}`)
  }
  const openDisputeCenter = () => router.push('/creator-dispute')

  /* ── Invite / contract actions ── */
  const handleCardAction = (convoId: string, kind: string, action: string) => {
    if (kind === 'invite' && action === 'accept') {
      setConvos(prev => prev.map(c => c.id !== convoId ? c : {
        ...c, lastMessage: "I'd love to work on this campaign!", lastTime: 'Just now',
        thread: [
          ...c.thread.map(m => m.card?.kind === 'invite' && m.card.status === 'pending' ? { ...m, card: { ...m.card, status: 'accepted' as InviteStatus } } : m),
          { id: newId('m'), sender: 'creator' as const, text: "Accepted! I'd love to work on this campaign. Looking forward to it.", time: 'Just now' },
        ],
      }))
      return
    }
    if (kind === 'invite' && action === 'decline') {
      setConvos(prev => prev.map(c => c.id !== convoId ? c : {
        ...c, lastMessage: 'Thanks, not the right fit for me right now.', lastTime: 'Just now',
        thread: [
          ...c.thread.map(m => m.card?.kind === 'invite' && m.card.status === 'pending' ? { ...m, card: { ...m.card, status: 'declined' as InviteStatus } } : m),
          { id: newId('m'), sender: 'creator' as const, text: "Thanks for thinking of me — this isn't quite the right fit right now.", time: 'Just now' },
        ],
      }))
      return
    }
    if (kind === 'invite' && action === 'view') { router.push('/creator-opportunity'); return }

    if (kind === 'contract' && action === 'sign') {
      setConvos(prev => prev.map(c => c.id !== convoId ? c : {
        ...c, lastMessage: 'Contract signed ✓', lastTime: 'Just now',
        thread: [
          ...c.thread.map(m => m.card?.kind === 'contract' && m.card.status === 'pending' ? { ...m, card: { ...m.card, status: 'signed' as ContractStatus } } : m),
          { id: newId('m'), sender: 'creator' as const, text: 'Contract signed ✓ — looking forward to working together!', time: 'Just now' },
        ],
      }))
      return
    }
    if (kind === 'contract' && action === 'changes') {
      setConvos(prev => prev.map(c => c.id !== convoId ? c : {
        ...c, lastMessage: "I've noted some changes I'd need — please review.", lastTime: 'Just now',
        thread: [
          ...c.thread.map(m => m.card?.kind === 'contract' && m.card.status === 'pending' ? { ...m, card: { ...m.card, status: 'changes_requested' as ContractStatus } } : m),
          { id: newId('m'), sender: 'creator' as const, text: "I've flagged some changes I'd need before signing — check the contract for my notes.", time: 'Just now' },
        ],
      }))
      return
    }
    if (kind === 'contract' && action === 'view') { router.push('/creator-contract'); return }
    if (kind === 'contract' && action === 'download') { return }
  }

  const onQuickAction = (action: 'payment' | 'offer' | 'sign' | 'invoice' | 'dispute') => {
    if (action === 'payment') setPayModal(true)
    if (action === 'offer')   setOfferModal(true)
    if (action === 'sign')    setSignModal(true)
    if (action === 'invoice') setInvoiceModal(true)
    if (action === 'dispute') setDisputeModal(true)
  }

  const NAV_LEFT = [
    { label: 'Dashboard', active: false, action: () => router.push('/creator-dashboard') },
    { label: 'Messages',  active: true,  action: () => {} },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-rubik text-ink antialiased">

      <PaymentRequestModal open={payModal} brandName={active?.brandName ?? ''} campaignOptions={campaignOptions} onClose={() => setPayModal(false)} onSend={sendPaymentRequest}/>
      <OfferModal          open={offerModal} brandName={active?.brandName ?? ''} campaignOptions={campaignOptions} onClose={() => setOfferModal(false)} onSend={sendNewOffer}/>
      <SignDetailsModal    open={signModal} brandName={active?.brandName ?? ''} campaignOptions={campaignOptions} onClose={() => setSignModal(false)} onSend={sendSignDetails}/>
      <InvoiceModal        open={invoiceModal} brandName={active?.brandName ?? ''} campaignOptions={campaignOptions} onClose={() => setInvoiceModal(false)} onSend={sendInvoice}/>
      <DisputeModal         open={disputeModal} brandName={active?.brandName ?? ''} campaignOptions={campaignOptions} onClose={() => setDisputeModal(false)} onSend={sendDispute}/>

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
                  {n.label === 'Messages' && totalUnread > 0 && (
                    <span className={`flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${GRAD_BTN}`}>{totalUnread}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            <div className="relative z-10 flex items-center gap-1.5">
              <button title="Notifications" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <BellIcon s={18}/>
                {UNREAD_NOTIFS > 0 && <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>{UNREAD_NOTIFS}</span>}
              </button>
              <button onClick={() => router.push('/display')} className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:flex">My Profile</button>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1080px] flex-1 px-4 py-5 sm:px-6">
        <div className={`flex h-[calc(100vh-88px)] w-full overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>

          {/* ── LEFT: Conversation list ── */}
          <div className={`flex w-full flex-shrink-0 flex-col border-r border-primary/8 sm:w-[280px] lg:w-[300px] ${showList ? 'flex' : 'hidden sm:flex'}`}>
            <div className="flex items-center justify-between border-b border-primary/8 px-4 py-4">
              <h2 className="text-[15px] font-extrabold text-ink">Messages</h2>
              <button className={`flex h-8 w-8 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_10px_-4px_rgba(139,49,232,0.45)]`}><ChatBubbleIcon s={15}/></button>
            </div>
            <div className="px-4 py-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={14}/></span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands…"
                  className="w-full rounded-xl border border-primary/10 bg-surface-sub py-2.5 pl-9 pr-4 text-[13px] text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.08)] placeholder:text-ink/35"/>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0
                ? <p className="px-4 py-8 text-center text-[13px] text-ink/40">No conversations found</p>
                : filtered.map(c => <ConvoRow key={c.id} convo={c} active={c.id === activeId} onClick={() => openConvo(c.id)}/>)
              }
            </div>
          </div>

          {/* ── RIGHT: Thread ── */}
          <div className={`flex min-w-0 flex-1 flex-col ${!showList ? 'flex' : 'hidden sm:flex'}`}>
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-primary/8 px-5 py-3.5">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 transition hover:bg-surface-sub sm:hidden" onClick={() => setShowList(true)}>
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
                <p className="text-[11.5px] font-medium text-ink/45">{active.online ? 'Active now' : 'Last seen recently'}</p>
              </div>
              <button title="More options" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                <MoreIcon s={18}/>
              </button>
            </div>

            {/* Deal context bar — OLX-style pinned strip */}
            <DealContextBar convo={active} onView={() => router.push('/creator-deal')}/>

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
                    onOfferAccept={respondOfferAccept}
                    onOfferDecline={respondOfferDecline}
                    onOfferCounter={respondOfferCounter}
                    onDisputeOpen={openDisputeCenter}
                    onCountersign={countersignDetails}
                  />
                ))}
                <div ref={threadEnd}/>
              </div>
            </div>

            {/* Composer */}
            <div className="flex flex-shrink-0 items-end gap-2.5 border-t border-primary/8 px-4 py-3.5">
              <button title="Attach file" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-ink/40 transition hover:bg-primary/[0.07] hover:text-primary">
                <PaperclipIcon s={17}/>
              </button>

              <QuickActionsMenu onSelect={onQuickAction}/>

              <div className="flex-1 overflow-hidden rounded-2xl border border-primary/12 bg-surface-sub transition focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(139,49,232,0.08)]">
                <textarea
                  value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={`Message ${active.brandName}…`} rows={1}
                  className="block w-full resize-none bg-transparent px-4 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink/35"
                  style={{ maxHeight: 120, minHeight: 40 }}
                  onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 120)}px` }}/>
              </div>

              <button onClick={sendMessage} disabled={!draft.trim()}
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