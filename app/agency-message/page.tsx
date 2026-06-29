'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Agency Messages — app/agency/messages/page.tsx  (Nexfluence v4 LIGHT)
   ════════════════════════════════════════════════════════════════════

   THE CORE INSIGHT:
   The agency is a dual-role entity. It talks to BOTH brands AND creators.
   This page has two parallel conversation lists, toggled by a tab strip.

   TAB A — BRAND CONVERSATIONS  (agency ↔ brand clients)
     Avatar type: rounded-xl square logo tiles  (brands are entities)
     Agency POV:  agency = sender, brand = receiver
     Special cards exclusive to brand threads:
       • ManagementContractCard  — agency sends management agreement to brand
       • RetainerInvoiceCard     — agency sends monthly invoice to brand
       • CampaignApprovalCard    — agency proposes campaign brief for brand sign-off
     sentByMe rules in brand threads:
       All three card types above → agency sent them → sentByMe=true
       → agency sees waiting/status states, brand sees action buttons (not rendered here)

   TAB B — CREATOR CONVERSATIONS  (agency ↔ roster creators)
     Avatar type: rounded-full circles  (creators are people)
     Agency acts AS the brand from a creator's perspective.
     Special cards are IDENTICAL to /messages (brand messages page):
       • InviteCard  (agency sent → sentByMe=true → "Waiting for creator's response…")
       • ContractCard (agency sent → sentByMe=true → "Waiting for creator to sign…")
       • PaymentCard  (creator sent → sentByMe=false → agency sees Make payment / Give reason)
     sentByMe rules in creator threads: exactly mirrors brand messages page.

   MODALS:
     InvoiceModal          — agency fills retainer amount + period → RetainerInvoiceCard
     CampaignApprovalModal — agency proposes campaign brief → CampaignApprovalCard
     PaymentConfirmModal   — confirms payment to creator (same as brand messages)
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type ThreadTab    = 'brands' | 'creators'

/* Shared with brand + creator pages — must be identical */
type InviteStatus   = 'pending' | 'accepted' | 'declined'
type ContractStatus = 'pending' | 'signed'   | 'changes_requested'
type PaymentStatus  = 'pending' | 'paid'     | 'reason_given'

/* Agency-only statuses */
type MgmtContractStatus  = 'pending' | 'signed' | 'declined'
type InvoiceStatus       = 'pending' | 'paid'   | 'overdue'
type ApprovalStatus      = 'pending' | 'approved' | 'changes_requested'

type SpecialCard =
  /* ── Shared with brand/creator pages ── */
  | { kind: 'invite';    campaignName: string; campaignObjective: string; rate: string;
      status: InviteStatus;   sentByMe: boolean }
  | { kind: 'contract';  contractName: string; dealType: string; pieces: string;
      status: ContractStatus; sentByMe: boolean }
  | { kind: 'payment';   amount: string; dueDate: string; campaignName: string; note: string;
      status: PaymentStatus;  sentByMe: boolean }
  /* ── Agency-only (brand thread cards) ── */
  | { kind: 'mgmt_contract'; title: string; retainer: string; period: string;
      status: MgmtContractStatus; sentByMe: boolean }
  | { kind: 'invoice';   amount: string; period: string; dueDate: string; note: string;
      status: InvoiceStatus; sentByMe: boolean }
  | { kind: 'approval';  campaignName: string; objective: string; budget: string; note: string;
      status: ApprovalStatus; sentByMe: boolean }

type Message = {
  id:     string
  sender: 'agency' | 'other'   /* agency = me, other = brand or creator */
  text?:  string
  time:   string
  card?:  SpecialCard
}

type BrandConvo = {
  id:            string
  brandName:     string
  industry:      string
  color:         string
  initials:      string
  logoUrl:       string | null
  contractType:  'full_management' | 'single_campaign'
  unread:        number
  lastMessage:   string
  lastTime:      string
  online:        boolean
  thread:        Message[]
}

type CreatorConvo = {
  id:          string
  creatorName: string
  handle:      string
  color:       string
  initials:    string
  avatarUrl:   string | null
  niche:       string
  unread:      number
  lastMessage: string
  lastTime:    string
  online:      boolean
  thread:      Message[]
}

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA — BRAND CONVERSATIONS
   ════════════════════════════════════════════════════════════════════ */
const INITIAL_BRAND_CONVOS: BrandConvo[] = [
  {
    id: 'bc1', brandName: 'Kinetics', industry: 'Sports nutrition',
    color: '#8B31E8', initials: 'KI', logoUrl: null,
    contractType: 'full_management',
    unread: 2, online: true, lastTime: '30m ago',
    lastMessage: 'Can you push the Electrolyte campaign brief over today?',
    thread: [
      { id: 'm1', sender: 'agency', text: "Hi Mārtiņš! We've got the Q3 campaign plan ready. Sending the management agreement now.", time: 'Jan 15, 10:00 AM' },
      { id: 'm2', sender: 'agency', time: 'Jan 15, 10:02 AM', card: { kind: 'mgmt_contract', title: 'Agency Management Agreement — Kinetics', retainer: '€1,200/month', period: 'Jan–Dec 2026', status: 'signed', sentByMe: true } },
      { id: 'm3', sender: 'other',  text: 'Signed and looking good. Welcome to the team — excited to grow with you!', time: 'Jan 15, 2:18 PM' },
      { id: 'm4', sender: 'agency', time: 'Feb 1, 9:00 AM', card: { kind: 'invoice', amount: '€1,200', period: 'February 2026 retainer', dueDate: 'Feb 7, 2026', note: 'Monthly agency management fee per the signed agreement.', status: 'paid', sentByMe: true } },
      { id: 'm5', sender: 'agency', time: 'Jun 5, 11:00 AM', card: { kind: 'approval', campaignName: 'Electrolyte Hot Yoga', objective: 'Conversions · target Latvian fitness audience 22–38F', budget: '€350 flat fee + 3 creators', note: 'We propose launching Jul 1. Creators shortlisted: Amelia Roze, Sandra Liepa, Rūta Vaitkutė.', status: 'approved', sentByMe: true } },
      { id: 'm6', sender: 'other',  text: 'The Electrolyte brief is perfect. Go ahead and launch.', time: 'Jun 5, 3:45 PM' },
      { id: 'm7', sender: 'other',  text: 'Can you push the next campaign brief over today? We want to get the Race Day one moving.', time: '30m ago' },
    ],
  },
  {
    id: 'bc2', brandName: 'Lumora Skincare', industry: 'Beauty',
    color: '#059669', initials: 'LS', logoUrl: null,
    contractType: 'full_management',
    unread: 1, online: false, lastTime: '2h ago',
    lastMessage: 'Invoice for July is here.',
    thread: [
      { id: 'm1', sender: 'agency', text: 'Exciting to onboard Lumora! Here is the management agreement for your review.', time: 'Mar 1, 9:00 AM' },
      { id: 'm2', sender: 'agency', time: 'Mar 1, 9:05 AM', card: { kind: 'mgmt_contract', title: 'Agency Management Agreement — Lumora Skincare', retainer: '€900/month', period: 'Mar–Dec 2026', status: 'signed', sentByMe: true } },
      { id: 'm3', sender: 'other',  text: 'Signed! Really happy to be working with Baltic Creators Agency.', time: 'Mar 1, 4:00 PM' },
      { id: 'm4', sender: 'agency', time: 'Jun 1, 9:00 AM', card: { kind: 'invoice', amount: '€900', period: 'June 2026 retainer', dueDate: 'Jun 7, 2026', note: 'Monthly agency management fee.', status: 'paid', sentByMe: true } },
      { id: 'm5', sender: 'agency', time: '2h ago', card: { kind: 'invoice', amount: '€900', period: 'July 2026 retainer', dueDate: 'Jul 7, 2026', note: 'Monthly agency management fee — please process by the 7th.', status: 'pending', sentByMe: true } },
    ],
  },
  {
    id: 'bc3', brandName: 'Forma Fit', industry: 'Fitness apparel',
    color: '#2563EB', initials: 'FF', logoUrl: null,
    contractType: 'single_campaign',
    unread: 0, online: true, lastTime: '1d ago',
    lastMessage: 'Waiting for you to sign the campaign agreement.',
    thread: [
      { id: 'm1', sender: 'agency', text: "Hi! We're thrilled to take on Training Block Q3 for Forma Fit. Sending the campaign delivery agreement now.", time: 'Jun 10, 10:00 AM' },
      { id: 'm2', sender: 'agency', time: 'Jun 10, 10:05 AM', card: { kind: 'mgmt_contract', title: 'Campaign Delivery Agreement — Forma Fit', retainer: '€700 one-time', period: 'Training Block Q3', status: 'pending', sentByMe: true } },
      { id: 'm3', sender: 'other',  text: 'Thanks for sending this over. Just need to run it by our legal team — should be back to you by end of week.', time: '1d ago' },
    ],
  },
  {
    id: 'bc4', brandName: 'Vāre Coffee', industry: 'Food & beverage',
    color: '#B45309', initials: 'VC', logoUrl: null,
    contractType: 'single_campaign',
    unread: 0, online: false, lastTime: '3d ago',
    lastMessage: 'Here is what we propose for the launch.',
    thread: [
      { id: 'm1', sender: 'agency', text: "Hi Vāre! Baltic Creators Agency here. We manage some of the top Baltic lifestyle creators and noticed your new roast launch — think we could drive fantastic results for you.", time: '3d ago' },
      { id: 'm2', sender: 'agency', time: '3d ago', card: { kind: 'approval', campaignName: 'New Roast Reveal — Baltic Tour', objective: 'Awareness · target coffee enthusiasts 25–40 across Latvia & Estonia', budget: '€80 gifting + 10% commission · 3 creators', note: 'We would run this alongside our existing Kinetics roster. Expected organic reach 400K+.', status: 'pending', sentByMe: true } },
    ],
  },
  {
    id: 'bc5', brandName: 'NordGlow', industry: 'Beauty',
    color: '#0E7490', initials: 'NG', logoUrl: null,
    contractType: 'full_management',
    unread: 0, online: false, lastTime: '5d ago',
    lastMessage: 'We sent over the management proposal.',
    thread: [
      { id: 'm1', sender: 'agency', text: "Hi NordGlow! We've been following your brand closely — the Baltic premium beauty market is exactly where we specialize. Here is a management proposal.", time: '5d ago' },
      { id: 'm2', sender: 'agency', time: '5d ago', card: { kind: 'mgmt_contract', title: 'Agency Management Proposal — NordGlow', retainer: '€950/month', period: 'Q3–Q4 2026 pilot', status: 'pending', sentByMe: true } },
    ],
  },
]

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA — CREATOR CONVERSATIONS
   Agency POV = brand POV toward creators.
   sentByMe rules identical to /messages (brand messages page).
   ════════════════════════════════════════════════════════════════════ */
const INITIAL_CREATOR_CONVOS: CreatorConvo[] = [
  {
    id: 'cc1', creatorName: 'Amelia Roze', handle: '@amelia.roze',
    color: '#8B31E8', initials: 'AR', avatarUrl: null,
    niche: 'Fitness / Lifestyle', unread: 1, online: true, lastTime: '1h ago',
    lastMessage: 'Can we bump the commission to 18%?',
    thread: [
      { id: 'm1', sender: 'agency', text: "Hi Amelia! Baltic Creators Agency here. We'd love to onboard you to our Q3 fitness roster and have your first campaign ready.", time: 'Jun 14, 10:00 AM' },
      { id: 'm2', sender: 'agency', time: 'Jun 14, 10:05 AM', card: { kind: 'invite', campaignName: 'Q3 Fitness Roster — Kinetics', campaignObjective: 'Conversions', rate: '15% commission', status: 'accepted', sentByMe: true } },
      { id: 'm3', sender: 'other',  text: "Accepted! I've been hoping to work with Kinetics — great fit for my content.", time: 'Jun 14, 11:30 AM' },
      { id: 'm4', sender: 'agency', text: 'Amazing! Sending the roster representation agreement now.', time: 'Jun 14, 11:45 AM' },
      { id: 'm5', sender: 'agency', time: 'Jun 14, 11:46 AM', card: { kind: 'contract', contractName: 'Creator Representation — Amelia Roze', dealType: 'Full roster', pieces: '4 pieces/month', status: 'signed', sentByMe: true } },
      { id: 'm6', sender: 'other',  text: 'Signed! Looking forward to it.', time: 'Jun 14, 12:30 PM' },
      { id: 'm7', sender: 'other',  text: 'Quick question — can we bump the commission to 18% for the next Kinetics campaign? I think 15% undersells my value a bit.', time: '1h ago' },
    ],
  },
  {
    id: 'cc2', creatorName: 'Markus Tamm', handle: '@markustamm',
    color: '#2563EB', initials: 'MT', avatarUrl: null,
    niche: 'Sports', unread: 0, online: false, lastTime: '3h ago',
    lastMessage: 'Training Block Q3 invite sent — waiting on Markus.',
    thread: [
      { id: 'm1', sender: 'agency', text: "Hi Markus! We represent several Baltic fitness brands and think you'd be a great fit for Forma Fit's Q3 campaign.", time: 'Jun 20, 9:00 AM' },
      { id: 'm2', sender: 'agency', time: 'Jun 20, 9:05 AM', card: { kind: 'invite', campaignName: 'Training Block Q3 — Forma Fit', campaignObjective: 'UGC', rate: 'From €400/video', status: 'pending', sentByMe: true } },
      { id: 'm3', sender: 'other',  text: "Looks interesting — I'll review the brief and get back to you by end of week.", time: '3h ago' },
    ],
  },
  {
    id: 'cc3', creatorName: 'Sandra Liepa', handle: '@sandra.liepa',
    color: '#DB2777', initials: 'SL', avatarUrl: null,
    niche: 'Beauty', unread: 2, online: true, lastTime: '2h ago',
    lastMessage: 'Payment is overdue — please check with Lumora.',
    thread: [
      { id: 'm1', sender: 'agency', time: 'Jun 10, 9:00 AM', card: { kind: 'invite', campaignName: 'Morning Ritual — Lumora Skincare', campaignObjective: 'Awareness', rate: '€120 product + 10%', status: 'accepted', sentByMe: true } },
      { id: 'm2', sender: 'other',  text: 'Looks perfect for my content! Accepted.', time: 'Jun 10, 11:00 AM' },
      { id: 'm3', sender: 'agency', time: 'Jun 11, 10:00 AM', card: { kind: 'contract', contractName: 'Morning Ritual — Sandra Liepa', dealType: 'Hybrid', pieces: '2 Reels', status: 'signed', sentByMe: true } },
      { id: 'm4', sender: 'other',  text: 'Both Reels are live — links: [reel1] [reel2]', time: 'Jun 22, 3:00 PM' },
      { id: 'm5', sender: 'other',  time: '2h ago', card: { kind: 'payment', amount: '€320', dueDate: 'Jun 22, 2026', campaignName: 'Morning Ritual — Lumora Skincare', note: 'Two Reels live as per contract. Commission on tracked sales totals €320.', status: 'pending', sentByMe: false } },
    ],
  },
  {
    id: 'cc4', creatorName: 'Rūta Vaitkutė', handle: '@ruta.glow',
    color: '#C026D3', initials: 'RV', avatarUrl: null,
    niche: 'Wellness', unread: 0, online: false, lastTime: '1d ago',
    lastMessage: "Roster invite pending — Rūta is reviewing.",
    thread: [
      { id: 'm1', sender: 'agency', text: "Hi Rūta! We've been following your wellness content — really authentic. We'd love to represent you and pitch you into a few upcoming campaigns.", time: '1d ago' },
      { id: 'm2', sender: 'agency', time: '1d ago', card: { kind: 'invite', campaignName: 'Q3 Wellness Roster', campaignObjective: 'UGC + Awareness', rate: '€500/month retainer or per-deal', status: 'pending', sentByMe: true } },
    ],
  },
  {
    id: 'cc5', creatorName: 'Jonas Petrauskas', handle: '@jonaspt',
    color: '#0891B2', initials: 'JP', avatarUrl: null,
    niche: 'Tech / Lifestyle', unread: 0, online: true, lastTime: '4d ago',
    lastMessage: 'Welcome to the roster!',
    thread: [
      { id: 'm1', sender: 'agency', time: '4d ago', card: { kind: 'invite', campaignName: 'Tech & Lifestyle Roster', campaignObjective: 'Awareness', rate: 'Per-deal basis', status: 'accepted', sentByMe: true } },
      { id: 'm2', sender: 'other',  text: "Thanks for reaching out! Happy to join the roster.", time: '4d ago' },
      { id: 'm3', sender: 'agency', time: '4d ago', card: { kind: 'contract', contractName: 'Creator Representation — Jonas Petrauskas', dealType: 'Single campaign', pieces: 'Per campaign', status: 'signed', sentByMe: true } },
      { id: 'm4', sender: 'agency', text: 'Welcome to the roster, Jonas! We have a couple of tech-adjacent pitches coming in Q3 — will keep you posted.', time: '4d ago' },
    ],
  },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS — inline SVG only
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function SendIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SearchIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function BellIcon({ s = 18 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChatIcon({ s = 15 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CheckIcon({ s = 13 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 13 }: { s?: number })           { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function FileIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function EuroIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ArrowLeftIcon({ s = 16 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function PaperclipIcon({ s = 16 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function MoreIcon({ s = 18 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg> }
function RocketIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 7 6 7 13h10c0-7-5-11-5-11z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13c0 2.5 1 4 2.5 5.5L12 21l2.5-2.5C16 17 17 15.5 17 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="11" r="1.5" fill="currentColor"/></svg> }
function PenIcon({ s = 15 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EditIcon({ s = 15 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CreditCardIcon({ s = 15 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function MessageIcon({ s = 15 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function RepeatIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ZapIcon({ s = 14 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function InvoiceIcon({ s = 15 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16l3-2 2 2 2-2 2 2 2-2 3 2V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function BriefcaseIcon({ s = 15 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function AlertIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BuildingIcon({ s = 11 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> }
function UsersIcon({ s = 11 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   AVATAR COMPONENTS
   Brands → rounded-xl (entity tiles)
   Creators → rounded-full (personal circles)
   ════════════════════════════════════════════════════════════════════ */
function EntityAvatar({ initials, color, logoUrl, size = 38, online = false, round = false }: {
  initials: string; color: string; logoUrl?: string | null
  size?: number; online?: boolean; round?: boolean
}) {
  const r = round ? 'rounded-full' : 'rounded-xl'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {logoUrl
        ? <img src={logoUrl} alt="" width={size} height={size} className={`h-full w-full ${r} object-cover`}/> // eslint-disable-line
        : <div className={`flex h-full w-full items-center justify-center ${r} font-extrabold text-white`}
            style={{ background: color, fontSize: size * 0.36 }}>{initials}</div>
      }
      {online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"/>}
    </div>
  )
}

/* Agency's own avatar — always gradient square */
function AgencySelfAvatar({ size = 30 }: { size?: number }) {
  return (
    <div className={`flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white text-[11px] ${GRAD_BTN}`}
      style={{ width: size, height: size }}>BC</div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ── BRAND THREAD CARDS (agency-only card types) ──
   ════════════════════════════════════════════════════════════════════ */

/* Management Contract Card */
function MgmtContractCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'mgmt_contract' }>
  convoId: string
  onAction: (convoId: string, kind: string, action: string) => void
}) {
  const statusMap: Record<MgmtContractStatus, { label: string; badge: string; footer?: string }> = {
    pending:  { label: 'Awaiting signature', badge: 'bg-amber-50 text-amber-700 border-amber-200', footer: 'Waiting for brand to sign…' },
    signed:   { label: 'Signed ✓',           badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    declined: { label: 'Declined',           badge: 'bg-rose-50 text-rose-600 border-rose-200' },
  }
  const sm = statusMap[card.status]
  return (
    <div className={`w-[300px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'declined' ? 'border-rose-200' : 'border-primary/10'}`}>
      <div className="flex items-center gap-3 border-b border-primary/10 px-4 py-3.5">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_10px_-4px_rgba(139,49,232,0.45)]`}>
          <FileIcon s={15}/>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-extrabold text-ink">{card.title}</p>
          <p className="text-[11px] font-semibold text-ink/45">{card.retainer} · {card.period}</p>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sm.badge}`}>{sm.label}</span>
        <button onClick={() => onAction(convoId, 'mgmt_contract', 'view')}
          className="text-[12px] font-bold text-primary hover:underline">View</button>
      </div>
      {card.status === 'pending' && card.sentByMe && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/40">{sm.footer}</p>
        </div>
      )}
      {card.status === 'signed' && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[12px] font-semibold text-emerald-700">Agreement active. Brand dashboard access granted.</p>
        </div>
      )}
    </div>
  )
}

/* Retainer Invoice Card */
function RetainerInvoiceCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'invoice' }>
  convoId: string
  onAction: (convoId: string, kind: string, action: string) => void
}) {
  const [showReason, setShowReason] = useState(false)
  const [reason, setReason]         = useState('')

  const hdr   = card.status === 'paid' ? 'bg-emerald-500' : card.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-500'
  const badge = card.status === 'paid'
    ? 'bg-white/20 text-white border-white/30'
    : card.status === 'overdue'
    ? 'bg-white/20 text-white border-white/30'
    : 'bg-white/20 text-white border-white/30'
  const statusLabel = card.status === 'paid' ? 'Paid ✓' : card.status === 'overdue' ? 'Overdue' : 'Invoice sent'

  return (
    <div className={`w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'overdue' ? 'border-rose-300' : card.status === 'pending' ? 'border-amber-300' : 'border-primary/10'}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 ${hdr}`}>
        <InvoiceIcon s={15}/>
        <span className="text-[12px] font-bold uppercase tracking-[0.10em] text-white/90">Retainer invoice</span>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badge}`}>{statusLabel}</span>
      </div>
      <div className="px-4 py-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-[28px] font-black tracking-[-0.04em] ${GRAD_TXT}`}>{card.amount}</span>
          <span className="text-[12px] font-semibold text-ink/45">due {card.dueDate}</span>
        </div>
        <p className="mt-0.5 text-[12px] font-semibold text-ink/55">{card.period}</p>
        <p className="mt-2 text-[12.5px] leading-[1.65] text-ink/60">{card.note}</p>
      </div>
      {card.status === 'pending' && (
        <div className="border-t border-amber-200 px-4 py-3">
          {!showReason ? (
            <p className="text-[11.5px] font-semibold text-amber-700">Invoice sent — awaiting payment from brand.</p>
          ) : (
            <div className="space-y-2">
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                placeholder="e.g. Payment will be delayed until Jul 10 — cash flow issue."
                className="w-full rounded-xl border border-primary/12 bg-surface-sub px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none transition resize-none focus:border-primary focus:bg-white placeholder:text-ink/28"/>
              <div className="flex gap-2">
                <button onClick={() => setShowReason(false)}
                  className="flex-1 rounded-xl border border-primary/15 py-2 text-[12px] font-bold text-ink/50 hover:bg-surface-sub">Cancel</button>
                <button disabled={!reason.trim()} onClick={() => { if (reason.trim()) { onAction(convoId, 'invoice', `note:${reason}`); setShowReason(false) } }}
                  className={`flex-[2] rounded-xl py-2 text-[12px] font-bold text-white transition ${reason.trim() ? `${GRAD_BTN} hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                  Add note
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {card.status === 'paid' && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[12px] font-semibold text-emerald-700">Retainer received — recorded in agency revenue.</p>
        </div>
      )}
      {card.status === 'overdue' && (
        <div className="border-t border-rose-100 bg-rose-50 px-4 py-3 flex items-center gap-2">
          <AlertIcon s={13}/>
          <p className="text-[11.5px] font-semibold text-rose-600">Overdue — consider following up with the brand directly.</p>
        </div>
      )}
    </div>
  )
}

/* Campaign Approval Card */
function CampaignApprovalCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'approval' }>
  convoId: string
  onAction: (convoId: string, kind: string, action: string) => void
}) {
  const statusMap: Record<ApprovalStatus, { label: string; badge: string }> = {
    pending:           { label: 'Awaiting approval',  badge: 'bg-amber-50 text-amber-700 border-amber-200'  },
    approved:          { label: 'Approved ✓',          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    changes_requested: { label: 'Changes requested', badge: 'bg-rose-50 text-rose-600 border-rose-200'     },
  }
  const sm = statusMap[card.status]
  return (
    <div className={`w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'changes_requested' ? 'border-rose-200' : 'border-primary/10'}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 ${GRAD_BTN}`}>
        <RocketIcon s={14}/>
        <span className="text-[12px] font-bold uppercase tracking-[0.10em] text-white/90">Campaign proposal</span>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sm.badge}`}>{sm.label}</span>
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[14px] font-extrabold leading-tight text-ink">{card.campaignName}</p>
        <p className="mt-1 text-[12px] font-semibold text-ink/50">{card.objective}</p>
        <p className="mt-1.5 text-[12px] text-ink/55">{card.budget}</p>
        {card.note && <p className="mt-2 text-[12.5px] leading-[1.65] text-ink/55">{card.note}</p>}
      </div>
      {card.status === 'pending' && card.sentByMe && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/40">Proposal sent — waiting for brand sign-off…</p>
        </div>
      )}
      {card.status === 'approved' && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-3 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-emerald-700">Brand approved — campaign ready to launch.</p>
          <button onClick={() => onAction(convoId, 'approval', 'launch')}
            className="text-[12px] font-bold text-emerald-700 hover:underline">Launch →</button>
        </div>
      )}
      {card.status === 'changes_requested' && (
        <div className="border-t border-rose-100 bg-rose-50 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-rose-600">Brand requested changes to the brief.</p>
          <button onClick={() => onAction(convoId, 'approval', 'revise')}
            className="mt-1 text-[12px] font-bold text-rose-600 hover:underline">Open campaign builder →</button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ── CREATOR THREAD CARDS (shared types, brand-POV logic) ──
   Identical to /messages (brand messages) — agency acts as brand.
   ════════════════════════════════════════════════════════════════════ */

/* Invite Card — agency sent */
function InviteCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'invite' }>
  convoId: string
  onAction: (convoId: string, kind: 'invite', action: string) => void
}) {
  const statusConfig: Record<InviteStatus, { label: string; cls: string }> = {
    pending:  { label: '',             cls: ''                                              },
    accepted: { label: 'Accepted ✓',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    declined: { label: 'Declined',    cls: 'bg-rose-50 text-rose-600 border-rose-200'          },
  }
  const sc = statusConfig[card.status]
  return (
    <div className={`w-[300px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status !== 'pending' ? 'border-primary/10' : 'border-primary/20'}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 ${GRAD_BTN}`}>
        <RocketIcon s={14}/>
        <span className="text-[11.5px] font-bold uppercase tracking-[0.10em] text-white/90">Campaign invite</span>
        {card.status !== 'pending' && <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${sc.cls}`}>{sc.label}</span>}
      </div>
      <div className="px-4 py-3.5">
        <p className="text-[14px] font-extrabold leading-tight text-ink">{card.campaignName}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-primary/[0.07] px-2 py-0.5 text-[11px] font-bold text-primary">{card.campaignObjective}</span>
          <span className="text-[12px] font-semibold text-ink/50">{card.rate}</span>
        </div>
      </div>
      {card.status === 'pending' && card.sentByMe && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/40">Waiting for creator's response…</p>
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

/* Contract Card — agency sent */
function ContractCard({ card, convoId, onAction }: {
  card: Extract<SpecialCard, { kind: 'contract' }>
  convoId: string
  onAction: (convoId: string, kind: 'contract', action: string) => void
}) {
  const statusMap: Record<ContractStatus, { label: string; badge: string }> = {
    pending:           { label: 'Awaiting signature', badge: 'bg-amber-50 text-amber-700 border-amber-200'  },
    signed:            { label: 'Signed ✓',           badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    changes_requested: { label: 'Changes requested',  badge: 'bg-rose-50 text-rose-600 border-rose-200'    },
  }
  const sm = statusMap[card.status]
  return (
    <div className={`w-[300px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'changes_requested' ? 'border-rose-200' : 'border-primary/10'}`}>
      <div className="flex items-center gap-3 border-b border-primary/10 px-4 py-3.5">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_10px_-4px_rgba(139,49,232,0.45)]`}>
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
      {card.status === 'pending' && card.sentByMe && (
        <div className="border-t border-primary/10 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-ink/40">Waiting for creator to sign…</p>
        </div>
      )}
      {card.status === 'changes_requested' && (
        <div className="border-t border-rose-100 bg-rose-50 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-rose-600">Creator requested changes — review and resend.</p>
          <button onClick={() => onAction(convoId, 'contract', 'revise')}
            className="mt-1 text-[12px] font-bold text-rose-600 hover:underline">Open contract editor →</button>
        </div>
      )}
    </div>
  )
}

/* Payment Card — creator sent, agency sees action buttons */
function PaymentCard({ card, convoId, creatorName, onAction }: {
  card: Extract<SpecialCard, { kind: 'payment' }>
  convoId: string
  creatorName: string
  onAction: (convoId: string, kind: 'payment', action: string) => void
}) {
  const [showReason, setShowReason] = useState(false)
  const [reason, setReason]         = useState('')
  const statusMap: Record<PaymentStatus, { label: string; badge: string }> = {
    pending:      { label: 'Payment due',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    paid:         { label: 'Paid ✓',       badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    reason_given: { label: 'Reply sent',   badge: 'bg-surface-sub text-ink/50 border-primary/10' },
  }
  const sm  = statusMap[card.status]
  const hdr = card.status === 'pending' ? 'bg-amber-500' : card.status === 'paid' ? 'bg-emerald-500' : 'bg-ink/10'
  return (
    <div className={`w-[320px] max-w-full overflow-hidden rounded-2xl border bg-white ${CARD} ${card.status === 'pending' ? 'border-amber-300' : 'border-primary/10'}`}>
      <div className={`flex items-center gap-2.5 px-4 py-3 ${hdr}`}>
        <EuroIcon s={15}/>
        <span className="text-[12px] font-bold uppercase tracking-[0.10em] text-white/90">Payment request</span>
        <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${sm.badge}`}>{sm.label}</span>
      </div>
      <div className="px-4 py-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-[28px] font-black tracking-[-0.04em] ${GRAD_TXT}`}>{card.amount}</span>
          <span className="text-[12px] font-semibold text-ink/45">due {card.dueDate}</span>
        </div>
        <p className="mt-0.5 text-[12px] font-semibold text-ink/55">{card.campaignName}</p>
        <p className="mt-2 text-[12.5px] leading-[1.65] text-ink/60">{card.note}</p>
      </div>
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
              <p className="text-[11.5px] font-semibold text-ink/50">Explain the delay or revised timeline to {creatorName}:</p>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                placeholder="e.g. Processing on our end — will reach you by Jun 28."
                className="w-full rounded-xl border border-primary/12 bg-surface-sub px-3.5 py-2.5 text-[13px] leading-relaxed text-ink outline-none transition placeholder:text-ink/28 resize-none focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]"/>
              <div className="flex gap-2">
                <button onClick={() => setShowReason(false)}
                  className="flex-1 rounded-xl border border-primary/15 py-2 text-[12.5px] font-bold text-ink/50 hover:bg-surface-sub">Cancel</button>
                <button disabled={!reason.trim()}
                  onClick={() => { if (reason.trim()) onAction(convoId, 'payment', `reason:${reason}`) }}
                  className={`flex-[2] rounded-xl py-2 text-[12.5px] font-bold text-white transition ${reason.trim() ? `${GRAD_BTN} hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                  Send reply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {card.status === 'paid' && (
        <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-[12px] font-semibold text-emerald-700">Payment processed and sent to {creatorName}.</p>
        </div>
      )}
      {card.status === 'reason_given' && (
        <div className="border-t border-primary/8 px-4 py-3">
          <p className="text-[12px] font-semibold text-ink/45">You replied with a reason — {creatorName} has been notified.</p>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MESSAGE BUBBLE
   isMe = msg.sender === 'agency'
   Agency's gradient bubbles on the right, other's grey on left.
   The other entity is either a brand (squared tile) or creator (circle).
   ════════════════════════════════════════════════════════════════════ */
function MessageBubble({ msg, convoId, otherName, otherColor, otherInitials, otherLogoUrl, otherIsCreator, onCardAction }: {
  msg: Message; convoId: string
  otherName: string; otherColor: string; otherInitials: string; otherLogoUrl: string | null
  otherIsCreator: boolean
  onCardAction: (convoId: string, kind: string, action: string) => void
}) {
  const isMe = msg.sender === 'agency'

  const OtherAv = () => (
    <EntityAvatar initials={otherInitials} color={otherColor} logoUrl={otherLogoUrl} size={30} round={otherIsCreator}/>
  )

  if (msg.card) {
    return (
      <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMe && <OtherAv/>}
        <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
          {msg.card.kind === 'invite'        && <InviteCard        card={msg.card} convoId={convoId} onAction={(id,k,a) => onCardAction(id,k,a)}/>}
          {msg.card.kind === 'contract'      && <ContractCard      card={msg.card} convoId={convoId} onAction={(id,k,a) => onCardAction(id,k,a)}/>}
          {msg.card.kind === 'payment'       && <PaymentCard       card={msg.card} convoId={convoId} creatorName={otherName} onAction={(id,k,a) => onCardAction(id,k,a)}/>}
          {msg.card.kind === 'mgmt_contract' && <MgmtContractCard  card={msg.card} convoId={convoId} onAction={(id,k,a) => onCardAction(id,k,a)}/>}
          {msg.card.kind === 'invoice'       && <RetainerInvoiceCard card={msg.card} convoId={convoId} onAction={(id,k,a) => onCardAction(id,k,a)}/>}
          {msg.card.kind === 'approval'      && <CampaignApprovalCard card={msg.card} convoId={convoId} onAction={(id,k,a) => onCardAction(id,k,a)}/>}
          <span className="px-1 text-[10.5px] font-medium text-ink/35">{msg.time}</span>
        </div>
        {isMe && <AgencySelfAvatar size={30}/>}
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && <OtherAv/>}
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
      {isMe && <AgencySelfAvatar size={30}/>}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CONVERSATION LIST ROWS
   ════════════════════════════════════════════════════════════════════ */
function BrandConvoRow({ convo, active, onClick }: { convo: BrandConvo; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${active ? 'bg-primary/[0.07]' : 'hover:bg-primary/[0.03]'}`}>
      <EntityAvatar initials={convo.initials} color={convo.color} logoUrl={convo.logoUrl} size={42} online={convo.online}/>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`truncate text-[13.5px] ${convo.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink/75'}`}>{convo.brandName}</span>
            <span className={`flex-shrink-0 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${convo.contractType === 'full_management' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
              {convo.contractType === 'full_management' ? <><RepeatIcon s={8}/>Managed</> : <><ZapIcon s={8}/>Campaign</>}
            </span>
          </div>
          <span className="flex-shrink-0 text-[10.5px] font-medium text-ink/35">{convo.lastTime}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`truncate text-[12px] ${convo.unread > 0 ? 'font-semibold text-ink/60' : 'text-ink/40'}`}>{convo.lastMessage}</span>
          {convo.unread > 0 && <span className={`flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-black text-white ${GRAD_BTN}`}>{convo.unread}</span>}
        </div>
      </div>
    </button>
  )
}

function CreatorConvoRow({ convo, active, onClick }: { convo: CreatorConvo; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${active ? 'bg-primary/[0.07]' : 'hover:bg-primary/[0.03]'}`}>
      <EntityAvatar initials={convo.initials} color={convo.color} logoUrl={convo.avatarUrl} size={42} online={convo.online} round/>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`truncate text-[13.5px] ${convo.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink/75'}`}>{convo.creatorName}</span>
          </div>
          <span className="flex-shrink-0 text-[10.5px] font-medium text-ink/35">{convo.lastTime}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={`truncate text-[12px] ${convo.unread > 0 ? 'font-semibold text-ink/60' : 'text-ink/40'}`}>
            {convo.handle} · {convo.lastMessage}
          </span>
          {convo.unread > 0 && <span className={`flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-black text-white ${GRAD_BTN}`}>{convo.unread}</span>}
        </div>
      </div>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAYMENT CONFIRM MODAL (same as brand messages)
   ════════════════════════════════════════════════════════════════════ */
function PaymentConfirmModal({ open, amount, creatorName, campaignName, onConfirm, onClose }: {
  open: boolean; amount: string; creatorName: string; campaignName: string
  onConfirm: () => void; onClose: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
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
        <p className="mt-2 text-[12px] text-ink/38">Payment processed via Grade escrow — DAC7 compliant. Creator receives funds within 2 business days.</p>
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
   INVOICE MODAL — agency sends retainer invoice to brand
   ════════════════════════════════════════════════════════════════════ */
function InvoiceModal({ open, brandName, onClose, onSend }: {
  open: boolean; brandName: string
  onClose: () => void
  onSend: (amount: string, period: string, dueDate: string, note: string) => void
}) {
  const [amount,   setAmount]   = useState('')
  const [period,   setPeriod]   = useState('')
  const [dueDate,  setDueDate]  = useState('')
  const [note,     setNote]     = useState('')
  const [sending,  setSending]  = useState(false)

  useEffect(() => {
    if (!open) { setAmount(''); setPeriod(''); setDueDate(''); setNote(''); setSending(false) }
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open) return null
  const valid   = amount.trim().length > 0 && period.trim().length > 0
  const INP     = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[13.5px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
  const LBL     = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.10em] text-ink/45'

  const handleSend = async () => {
    if (!valid) return
    setSending(true); await new Promise(r => setTimeout(r, 700))
    onSend(amount.trim().startsWith('€') ? amount.trim() : `€${amount.trim()}`, period.trim(), dueDate || 'On receipt', note.trim() || `Monthly management fee for ${period.trim()}.`)
    setSending(false); onClose()
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[460px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}><InvoiceIcon s={18}/></div>
            <div>
              <p className="text-[15px] font-extrabold text-ink">Send retainer invoice</p>
              <p className="text-[11.5px] text-ink/45">To {brandName}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10"><XIcon s={13}/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LBL}>Amount *</label>
              <div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">€</span>
                <input className={`${INP} pl-8`} type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="1200"/></div></div>
            <div><label className={LBL}>Billing period *</label>
              <input className={INP} value={period} onChange={e => setPeriod(e.target.value)} placeholder="July 2026 retainer"/></div>
          </div>
          <div><label className={LBL}>Due date (optional)</label>
            <input type="date" className={INP} value={dueDate} onChange={e => setDueDate(e.target.value)}/></div>
          <div><label className={LBL}>Note (optional)</label>
            <textarea className={`${INP} min-h-[72px] resize-none leading-relaxed text-[13px]`} value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Monthly management fee per the signed agreement. Please process by the 7th."/></div>
        </div>
        <div className="flex gap-2.5 border-t border-primary/10 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Cancel</button>
          <button onClick={handleSend} disabled={!valid || sending}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${valid && !sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            {sending ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</> : <><SendIcon s={14}/>Send invoice</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CAMPAIGN APPROVAL MODAL — agency proposes campaign to brand
   ════════════════════════════════════════════════════════════════════ */
function CampaignApprovalSendModal({ open, brandName, onClose, onSend }: {
  open: boolean; brandName: string
  onClose: () => void
  onSend: (campaignName: string, objective: string, budget: string, note: string) => void
}) {
  const [campaignName, setCampaignName] = useState('')
  const [objective,    setObjective]    = useState('')
  const [budget,       setBudget]       = useState('')
  const [note,         setNote]         = useState('')
  const [sending,      setSending]      = useState(false)

  useEffect(() => {
    if (!open) { setCampaignName(''); setObjective(''); setBudget(''); setNote(''); setSending(false) }
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open) return null
  const valid = campaignName.trim().length > 0 && objective.trim().length > 0
  const INP   = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[13.5px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
  const LBL   = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.10em] text-ink/45'

  const handleSend = async () => {
    if (!valid) return
    setSending(true); await new Promise(r => setTimeout(r, 700))
    onSend(campaignName.trim(), objective.trim(), budget.trim(), note.trim())
    setSending(false); onClose()
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}><RocketIcon s={18}/></div>
            <div>
              <p className="text-[15px] font-extrabold text-ink">Propose a campaign</p>
              <p className="text-[11.5px] text-ink/45">For approval by {brandName}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10"><XIcon s={13}/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-[12.5px] leading-[1.65] text-ink/55">Send a campaign brief to {brandName} for sign-off before you start booking creators.</p>
          <div><label className={LBL}>Campaign name *</label>
            <input className={INP} value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. Summer Launch — Race Day"/></div>
          <div><label className={LBL}>Objective & audience *</label>
            <input className={INP} value={objective} onChange={e => setObjective(e.target.value)} placeholder="e.g. Conversions · Latvian fitness audience 22–38"/></div>
          <div><label className={LBL}>Budget & creators (optional)</label>
            <input className={INP} value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. €350 flat fee + 3 creators"/></div>
          <div><label className={LBL}>Note to brand (optional)</label>
            <textarea className={`${INP} min-h-[80px] resize-none leading-relaxed text-[13px]`} value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Creators shortlisted: Amelia Roze, Sandra Liepa. Timeline: Jul 1 launch."/></div>
        </div>
        <div className="flex gap-2.5 border-t border-primary/10 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Cancel</button>
          <button onClick={handleSend} disabled={!valid || sending}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${valid && !sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            {sending ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</> : <><SendIcon s={14}/>Send for approval</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function AgencyMessagesPage() {
  const router = useRouter()

  const [tab,          setTab]          = useState<ThreadTab>('brands')
  const [brandConvos,  setBrandConvos]  = useState<BrandConvo[]>(INITIAL_BRAND_CONVOS)
  const [creatorConvos,setCreatorConvos]= useState<CreatorConvo[]>(INITIAL_CREATOR_CONVOS)
  const [activeBrandId, setActiveBrandId]   = useState<string>(INITIAL_BRAND_CONVOS[0]!.id)
  const [activeCreatorId, setActiveCreatorId] = useState<string>(INITIAL_CREATOR_CONVOS[0]!.id)
  const [draft,        setDraft]        = useState('')
  const [search,       setSearch]       = useState('')
  const [showList,     setShowList]     = useState(true)

  /* Modals */
  const [payModal,     setPayModal]     = useState<{ open: boolean; amount: string; creatorName: string; campaignName: string; convoId: string } | null>(null)
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [approvalModal,setApprovalModal]= useState(false)

  const threadEnd = useRef<HTMLDivElement>(null)
  const UNREAD_NOTIFS = 3

  /* Derived */
  const brandUnread   = brandConvos.reduce((n, c)  => n + c.unread, 0)
  const creatorUnread = creatorConvos.reduce((n, c) => n + c.unread, 0)
  const totalUnread   = brandUnread + creatorUnread

  const activeBrand   = brandConvos.find(c   => c.id === activeBrandId)!
  const activeCreator = creatorConvos.find(c  => c.id === activeCreatorId)!

  const filteredBrands  = brandConvos.filter(c   => c.brandName.toLowerCase().includes(search.toLowerCase()))
  const filteredCreators = creatorConvos.filter(c => c.creatorName.toLowerCase().includes(search.toLowerCase()) || c.handle.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [tab, activeBrandId, activeCreatorId, activeBrand?.thread.length, activeCreator?.thread.length])

  const openBrandConvo = (id: string) => {
    setActiveBrandId(id); setBrandConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c)); setShowList(false)
  }
  const openCreatorConvo = (id: string) => {
    setActiveCreatorId(id); setCreatorConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c)); setShowList(false)
  }

  const switchTab = (t: ThreadTab) => { setTab(t); setSearch(''); setShowList(true) }

  /* Send plain text */
  const sendMessage = () => {
    const text = draft.trim(); if (!text) return
    const msg: Message = { id: `m${Date.now()}`, sender: 'agency', text, time: 'Just now' }
    if (tab === 'brands') {
      setBrandConvos(prev => prev.map(c => c.id !== activeBrandId ? c : { ...c, thread: [...c.thread, msg], lastMessage: text, lastTime: 'Just now' }))
    } else {
      setCreatorConvos(prev => prev.map(c => c.id !== activeCreatorId ? c : { ...c, thread: [...c.thread, msg], lastMessage: text, lastTime: 'Just now' }))
    }
    setDraft('')
  }

  /* Brand thread card actions */
  const handleBrandCardAction = (convoId: string, kind: string, action: string) => {
    if (kind === 'invoice' && action.startsWith('note:')) {
      const note = action.replace('note:', '')
      const replyMsg: Message = { id: `m${Date.now()}`, sender: 'agency', text: note, time: 'Just now' }
      setBrandConvos(prev => prev.map(c => c.id !== convoId ? c : { ...c, lastMessage: note, lastTime: 'Just now', thread: [...c.thread, replyMsg] }))
      return
    }
    if (kind === 'approval' && action === 'launch') { router.push('/agency/campaign/new'); return }
    if (kind === 'approval' && action === 'revise') { router.push('/agency/campaign/new'); return }
  }

  /* Creator thread card actions */
  const handleCreatorCardAction = (convoId: string, kind: string, action: string) => {
    if (kind === 'payment' && action === 'pay') {
      const convo   = creatorConvos.find(c => c.id === convoId)
      const payMsg  = convo?.thread.find(m => m.card?.kind === 'payment' && m.card.status === 'pending')
      if (payMsg?.card?.kind === 'payment') {
        setPayModal({ open: true, amount: payMsg.card.amount, creatorName: convo!.creatorName, campaignName: payMsg.card.campaignName, convoId })
      }
      return
    }
    if (kind === 'payment' && action.startsWith('reason:')) {
      const reasonText = action.replace('reason:', '')
      setCreatorConvos(prev => prev.map(c => {
        if (c.id !== convoId) return c
        return { ...c, lastMessage: reasonText, lastTime: 'Just now',
          thread: [...c.thread.map(m => m.card?.kind === 'payment' && m.card.status === 'pending' ? { ...m, card: { ...m.card, status: 'reason_given' as PaymentStatus } } : m),
            { id: `m${Date.now()}`, sender: 'agency' as const, text: reasonText, time: 'Just now' }] }
      }))
      return
    }
    if (kind === 'contract' && action === 'revise') { router.push('/agency/campaign/new'); return }
    if (kind === 'invite'   && action === 'view')   { router.push('/agency/campaign/new'); return }
    if (kind === 'contract' && action === 'view')   { router.push('/agency/campaign/new'); return }
  }

  /* Confirm payment to creator */
  const confirmPayment = () => {
    if (!payModal) return
    setCreatorConvos(prev => prev.map(c => {
      if (c.id !== payModal.convoId) return c
      return { ...c, lastMessage: `Payment of ${payModal.amount} sent ✓`, lastTime: 'Just now',
        thread: [...c.thread.map(m => m.card?.kind === 'payment' && m.card.status === 'pending' ? { ...m, card: { ...m.card, status: 'paid' as PaymentStatus } } : m),
          { id: `m${Date.now()}`, sender: 'agency' as const, text: `Payment of ${payModal.amount} has been processed via Grade and will arrive within 2 business days.`, time: 'Just now' }] }
    }))
    setPayModal(null)
  }

  /* Send invoice to brand */
  const sendInvoice = (amount: string, period: string, dueDate: string, note: string) => {
    const card: SpecialCard = { kind: 'invoice', amount, period, dueDate, note, status: 'pending', sentByMe: true }
    const msg: Message = { id: `m${Date.now()}`, sender: 'agency', time: 'Just now', card }
    setBrandConvos(prev => prev.map(c => c.id !== activeBrandId ? c : { ...c, thread: [...c.thread, msg], lastMessage: `Invoice sent: ${amount}`, lastTime: 'Just now' }))
  }

  /* Send campaign approval request */
  const sendCampaignApproval = (campaignName: string, objective: string, budget: string, note: string) => {
    const card: SpecialCard = { kind: 'approval', campaignName, objective, budget, note, status: 'pending', sentByMe: true }
    const msg: Message = { id: `m${Date.now()}`, sender: 'agency', time: 'Just now', card }
    setBrandConvos(prev => prev.map(c => c.id !== activeBrandId ? c : { ...c, thread: [...c.thread, msg], lastMessage: `Campaign proposed: ${campaignName}`, lastTime: 'Just now' }))
  }

  /* Send campaign invite to creator */
  const sendCreatorInvite = () => router.push('/agency/campaign/new')
  const sendCreatorContract = () => router.push('/agency/campaign/new')

  /* ── Derive active convo props for the thread panel ── */
  const isBrandsTab  = tab === 'brands'
  const activeConvo  = isBrandsTab ? activeBrand   : activeCreator
  const activeName   = isBrandsTab ? activeBrand?.brandName   : activeCreator?.creatorName
  const activeColor  = activeConvo?.color   ?? '#8B31E8'
  const activeInits  = activeConvo?.initials ?? ''
  const activeOnline = activeConvo?.online   ?? false
  const activeSub    = isBrandsTab
    ? (activeBrand?.industry ?? '')
    : `${activeCreator?.handle} · ${activeCreator?.niche}`
  const thread       = isBrandsTab ? activeBrand?.thread   ?? [] : activeCreator?.thread   ?? []

  return (
    <div className="flex min-h-screen flex-col bg-canvas font-rubik text-ink antialiased">

      {/* ════ MODALS ════ */}
      {payModal && <PaymentConfirmModal open={payModal.open} amount={payModal.amount} creatorName={payModal.creatorName} campaignName={payModal.campaignName} onConfirm={confirmPayment} onClose={() => setPayModal(null)}/>}
      <InvoiceModal           open={invoiceModal}  brandName={activeBrand?.brandName ?? ''} onClose={() => setInvoiceModal(false)}  onSend={sendInvoice}/>
      <CampaignApprovalSendModal open={approvalModal} brandName={activeBrand?.brandName ?? ''} onClose={() => setApprovalModal(false)} onSend={sendCampaignApproval}/>

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {[
                { label: 'Dashboard',  active: false, action: () => router.push('/dashboard/agency') },
                { label: 'Campaigns',  active: false, action: () => {} },
                { label: 'Messages',   active: true,  action: () => {} },
              ].map(n => (
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
            <div className="relative z-10 flex items-center gap-1.5">
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <BellIcon s={18}/>
                {UNREAD_NOTIFS > 0 && <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>{UNREAD_NOTIFS}</span>}
              </button>
              <button onClick={() => router.push('/agency/baltic-creators-agency')}
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

      {/* ════ MESSENGER ════ */}
      <div className="mx-auto flex w-full max-w-[1080px] flex-1 px-4 py-5 sm:px-6">
        <div className={`flex h-[calc(100vh-88px)] w-full overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>

          {/* ── LEFT: Conversation list with tabs ── */}
          <div className={`flex w-full flex-shrink-0 flex-col border-r border-primary/8 sm:w-[290px] lg:w-[310px] ${showList ? 'flex' : 'hidden sm:flex'}`}>

            {/* List header */}
            <div className="flex items-center justify-between border-b border-primary/8 px-4 py-4">
              <h2 className="text-[15px] font-extrabold text-ink">Messages</h2>
              <button className={`flex h-8 w-8 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_10px_-4px_rgba(139,49,232,0.45)]`}>
                <ChatIcon s={14}/>
              </button>
            </div>

            {/* ── TAB STRIP — the key agency-only feature ── */}
            <div className="flex border-b border-primary/8">
              {(['brands', 'creators'] as ThreadTab[]).map(t => {
                const count = t === 'brands' ? brandUnread : creatorUnread
                return (
                  <button key={t} onClick={() => switchTab(t)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 py-3 text-[13px] font-semibold capitalize transition ${tab === t ? 'text-primary' : 'text-ink/45 hover:text-ink/65'}`}>
                    {t === 'brands' ? <BuildingIcon s={12}/> : <UsersIcon s={12}/>}
                    {t}
                    {count > 0 && <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white ${GRAD_BTN}`}>{count}</span>}
                    {tab === t && <span className={`absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full ${GRAD_BTN}`}/>}
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={14}/></span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${tab === 'brands' ? 'brands' : 'creators'}…`}
                  className="w-full rounded-xl border border-primary/10 bg-surface-sub py-2.5 pl-9 pr-4 text-[13px] text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.08)] placeholder:text-ink/35"/>
              </div>
            </div>

            {/* Convo list */}
            <div className="flex-1 overflow-y-auto">
              {tab === 'brands' && (
                filteredBrands.length === 0
                  ? <p className="px-4 py-8 text-center text-[13px] text-ink/40">No brand conversations found</p>
                  : filteredBrands.map(c => <BrandConvoRow key={c.id} convo={c} active={c.id === activeBrandId} onClick={() => openBrandConvo(c.id)}/>)
              )}
              {tab === 'creators' && (
                filteredCreators.length === 0
                  ? <p className="px-4 py-8 text-center text-[13px] text-ink/40">No creator conversations found</p>
                  : filteredCreators.map(c => <CreatorConvoRow key={c.id} convo={c} active={c.id === activeCreatorId} onClick={() => openCreatorConvo(c.id)}/>)
              )}
            </div>
          </div>

          {/* ── RIGHT: Thread view ── */}
          <div className={`flex min-w-0 flex-1 flex-col ${!showList ? 'flex' : 'hidden sm:flex'}`}>

            {/* Thread header */}
            <div className="flex flex-shrink-0 items-center gap-3 border-b border-primary/8 px-5 py-3.5">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 transition hover:bg-surface-sub sm:hidden" onClick={() => setShowList(true)}>
                <ArrowLeftIcon s={16}/>
              </button>
              <EntityAvatar initials={activeInits} color={activeColor} logoUrl={null} size={36} online={activeOnline} round={!isBrandsTab}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-extrabold text-ink">{activeName}</p>
                  {isBrandsTab && activeBrand && (
                    <span className={`flex-shrink-0 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${activeBrand.contractType === 'full_management' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                      {activeBrand.contractType === 'full_management' ? <><RepeatIcon s={8}/>Managed</> : <><ZapIcon s={8}/>Campaign</>}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] font-medium text-ink/45">
                  {activeSub}{activeOnline ? ' · Active now' : ''}
                </p>
              </div>

              {/* Thread header quick actions — DIFFER by tab */}
              <div className="flex items-center gap-1">
                {isBrandsTab ? (
                  <>
                    {/* Brand thread: propose campaign, send contract, send invoice */}
                    <button onClick={() => setApprovalModal(true)} title="Propose campaign"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                      <RocketIcon s={16}/>
                    </button>
                    <button onClick={() => router.push('/agency/campaign/new')} title="Send management contract"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                      <FileIcon s={16}/>
                    </button>
                    <button onClick={() => setInvoiceModal(true)} title="Send retainer invoice"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                      <InvoiceIcon s={16}/>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Creator thread: send invite, send contract (same as brand messages) */}
                    <button onClick={sendCreatorInvite} title="Send campaign invite"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                      <RocketIcon s={16}/>
                    </button>
                    <button onClick={sendCreatorContract} title="Send contract"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                      <FileIcon s={16}/>
                    </button>
                  </>
                )}
                <button title="More options"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/45 transition hover:bg-primary/[0.07] hover:text-primary">
                  <MoreIcon s={18}/>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="flex flex-col gap-4">
                {thread.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    convoId={activeConvo?.id ?? ''}
                    otherName={activeName ?? ''}
                    otherColor={activeColor}
                    otherInitials={activeInits}
                    otherLogoUrl={null}
                    otherIsCreator={!isBrandsTab}
                    onCardAction={isBrandsTab ? handleBrandCardAction : handleCreatorCardAction}
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
                  placeholder={`Message ${activeName}…`}
                  rows={1}
                  className="block w-full resize-none bg-transparent px-4 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink/35"
                  style={{ maxHeight: 120, minHeight: 40 }}
                  onInput={e => {
                    const t = e.currentTarget
                    t.style.height = 'auto'
                    t.style.height = `${Math.min(t.scrollHeight, 120)}px`
                  }}/>
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