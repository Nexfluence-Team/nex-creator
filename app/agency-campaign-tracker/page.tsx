'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Agency Campaign Tracker — app/agency/campaign/[id]/page.tsx
   Nexfluence v4, LIGHT
   ════════════════════════════════════════════════════════════════════

   HOW THIS DIFFERS FROM /brand/campaign/[id]:
   ─────────────────────────────────────────────────────────────────
   1. BRAND ATTRIBUTION STRIP
      Every campaign belongs to a managed brand. The agency sees a
      persistent strip showing "Running this campaign for Kinetics"
      with contract type badge and a "Message brand" link.

   2. THREE-PARTY CONTRACTS
      ContractModal has TWO tabs: Creator contract (agency↔creator)
      and Management agreement (agency↔brand). The brand tracker only
      has one contract type.

   3. AGENCY FEE CARD (sidebar)
      New sidebar card below the timeline showing the agency's own
      earnings from this campaign: fee type (% or flat), amount
      earned, amount collected, and fee routing method.

   4. FEE ROUTING
      "Agency collects and distributes" vs "Brand pays creators directly"
      Changes the payment action on each creator row:
        agency_collects → "Pay creator" button (opens payment flow)
        brand_direct    → "Chase brand" button (link to messages)

   5. CONTENT REVIEW MODAL
      Header note: "Reviewing as Baltic Creators Agency on behalf of Kinetics"

   6. TIMELINE MILESTONES
      Agency-specific: "Brief approved by brand" → "Contracts sent" →
      "First submissions" → "Final deadline" → "Agency fee collected" →
      "Creator payouts released"

   7. HEADER NAV
      Agency pattern: Bell+badge + My Profile (right)
      Left: Dashboard | Campaigns | [Campaign title]
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ─── Types ──────────────────────────────────────────────────────── */
type ContentStatus  = 'pending_submission' | 'submitted' | 'approved' | 'revision_requested'
type PaymentStatus  = 'paid' | 'pending' | 'overdue' | 'not_due'
type ContractStatus = 'signed' | 'pending_signature' | 'changes_requested'
type CampaignStatus = 'active' | 'review' | 'completed' | 'paused'
type FeeRouting     = 'agency_collects' | 'brand_direct'
type AgencyFeeType  = 'percent' | 'flat'

interface ContentPiece {
  id:             string
  format:         string
  platform:       string
  title:          string
  submittedDate:  string | null
  status:         ContentStatus
  thumbnailColor: string
}

interface AgencyCreatorRow {
  id:                  string
  name:                string
  handle:              string
  initials:            string
  color:               string
  platform:            string
  followers:           string
  engagementRate:      number
  piecesCommitted:     number
  piecesSubmitted:     number
  piecesApproved:      number
  dealType:            'flat' | 'commission' | 'hybrid'
  flatOwed:            number
  flatPaid:            number
  commissionRate:      number | null
  estimatedCommission: number
  commissionPaid:      number
  paymentStatus:       PaymentStatus
  contractStatus:      ContractStatus
  contractId:          string
  content:             ContentPiece[]
  viewsGenerated:      string
  engagementGenerated: string
  conversionsGenerated:string
}

interface ManagedBrand {
  id:            string
  name:          string
  industry:      string
  color:         string
  initials:      string
  contractType:  'full_management' | 'single_campaign'
  briefApprovedDate: string
}

interface AgencyCampaign {
  id:            string
  title:         string
  objective:     string
  status:        CampaignStatus
  startDate:     string
  endDate:       string
  totalBudget:   number    /* total brand committed */
  creatorBudget: number    /* budget for creators after agency fee */
  agencyFeeType: AgencyFeeType
  agencyFeeRate: number    /* pct or flat amount */
  agencyFeeEarned: number  /* actual fee earned so far */
  agencyFeeCollected: number
  feeRouting:    FeeRouting
  brand:         ManagedBrand
  brief:         string
  creators:      AgencyCreatorRow[]
}

/* ─── Mock data ──────────────────────────────────────────────────── */
const CAMPAIGN_DATA: AgencyCampaign = {
  id: 'ac1',
  title: 'Electrolyte Hot Yoga',
  objective: 'Conversions',
  status: 'active',
  startDate: 'Jun 15, 2026',
  endDate: 'Jul 15, 2026',
  totalBudget: 2600,
  creatorBudget: 2210,
  agencyFeeType: 'percent',
  agencyFeeRate: 15,
  agencyFeeEarned: 390,
  agencyFeeCollected: 195,  /* 50% collected upfront */
  feeRouting: 'agency_collects',
  brand: {
    id: 'mb1', name: 'Kinetics', industry: 'Sports nutrition',
    color: '#8B31E8', initials: 'KI', contractType: 'full_management',
    briefApprovedDate: 'Jun 5, 2026',
  },
  brief: 'Showcase the Electrolyte formula as a genuine part of a hot yoga or intense workout routine. Authentic use — show sweat, effort, recovery. Target women 22–38 in the Baltics. No overly polished aesthetics.',
  creators: [
    {
      id: 'cr1', name: 'Amelia Roze', handle: '@amelia.roze', initials: 'AR', color: '#8B31E8',
      platform: 'Instagram', followers: '142K', engagementRate: 6.8,
      piecesCommitted: 2, piecesSubmitted: 2, piecesApproved: 2,
      dealType: 'flat', flatOwed: 350, flatPaid: 350,
      commissionRate: null, estimatedCommission: 0, commissionPaid: 0,
      paymentStatus: 'paid', contractStatus: 'signed', contractId: 'CTR-AC1-001',
      viewsGenerated: '310K', engagementGenerated: '7.2%', conversionsGenerated: '1.8K',
      content: [
        { id: 'p1', format: 'Instagram Reel', platform: 'Instagram', title: 'Hot Yoga Morning Ritual', submittedDate: 'Jun 22', status: 'approved', thumbnailColor: '#8B31E8' },
        { id: 'p2', format: 'Instagram Story Series', platform: 'Instagram', title: 'Pre-Session Electrolyte Routine', submittedDate: 'Jun 24', status: 'approved', thumbnailColor: '#a03be8' },
      ],
    },
    {
      id: 'cr2', name: 'Sandra Liepa', handle: '@sandra.liepa', initials: 'SL', color: '#DB2777',
      platform: 'TikTok', followers: '89K', engagementRate: 9.4,
      piecesCommitted: 2, piecesSubmitted: 2, piecesApproved: 1,
      dealType: 'flat', flatOwed: 280, flatPaid: 0,
      commissionRate: null, estimatedCommission: 0, commissionPaid: 0,
      paymentStatus: 'overdue', contractStatus: 'signed', contractId: 'CTR-AC1-002',
      viewsGenerated: '245K', engagementGenerated: '9.6%', conversionsGenerated: '1.4K',
      content: [
        { id: 'p3', format: 'TikTok', platform: 'TikTok', title: 'Why I Switched to This Electrolyte', submittedDate: 'Jun 25', status: 'approved', thumbnailColor: '#DB2777' },
        { id: 'p4', format: 'TikTok', platform: 'TikTok', title: 'Post-Yoga Hydration Routine', submittedDate: 'Jun 28', status: 'revision_requested', thumbnailColor: '#ec4899' },
      ],
    },
    {
      id: 'cr3', name: 'Rūta Vaitkutė', handle: '@ruta.glow', initials: 'RV', color: '#C026D3',
      platform: 'TikTok', followers: '87K', engagementRate: 10.1,
      piecesCommitted: 3, piecesSubmitted: 1, piecesApproved: 0,
      dealType: 'commission', flatOwed: 0, flatPaid: 0,
      commissionRate: 14, estimatedCommission: 196, commissionPaid: 0,
      paymentStatus: 'not_due', contractStatus: 'signed', contractId: 'CTR-AC1-003',
      viewsGenerated: '180K', engagementGenerated: '10.4%', conversionsGenerated: '920',
      content: [
        { id: 'p5', format: 'TikTok', platform: 'TikTok', title: 'Real Talk — Does It Actually Work?', submittedDate: 'Jun 29', status: 'submitted', thumbnailColor: '#C026D3' },
        { id: 'p6', format: 'TikTok', platform: 'TikTok', title: 'Piece 2 — Not submitted', submittedDate: null, status: 'pending_submission', thumbnailColor: '#d946ef' },
        { id: 'p7', format: 'TikTok', platform: 'TikTok', title: 'Piece 3 — Not submitted', submittedDate: null, status: 'pending_submission', thumbnailColor: '#e879f9' },
      ],
    },
  ],
}

/* ════════════════════════════════════════════════════════════════════
   ICONS — inline SVG only
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function Check({ s = 12 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 12 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function ChevLeft({ s = 15 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChevRight({ s = 13 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ImageIcon({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function FileIcon({ s = 15 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function ChatIcon({ s = 15 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EyeIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function ZapIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function UsersIcon({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.9"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg> }
function CalIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function DownloadIcon({ s = 14 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function RefreshIcon({ s = 13 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SendIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BellIcon({ s = 18 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function RepeatIcon({ s = 12 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BriefcaseIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function AlertIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ShieldCheckIcon({ s = 16 }: { s?: number }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmt(n: number) { return `€${n.toLocaleString()}` }
function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{initials}</div>
}
function EntityTile({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>{initials}</div>
}
function MiniProgress({ done, total, color = '#8B31E8' }: { done: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/[0.08]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <span className="flex-shrink-0 text-[11px] font-bold text-ink/50">{done}/{total}</span>
    </div>
  )
}

/* ─── Status configs (identical to brand tracker) ────────────────── */
const CONTENT_STATUS: Record<ContentStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending_submission: { label: 'Not submitted',      bg: 'bg-surface-sub', text: 'text-ink/45',      dot: 'bg-ink/20'      },
  submitted:          { label: 'Awaiting review',    bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
  approved:           { label: 'Approved',           bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  revision_requested: { label: 'Revision requested', bg: 'bg-rose-50',     text: 'text-rose-600',    dot: 'bg-rose-400'    },
}
const PAYMENT_STATUS: Record<PaymentStatus, { label: string; bg: string; text: string }> = {
  paid:    { label: 'Paid',    bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  pending: { label: 'Due',     bg: 'bg-amber-50',    text: 'text-amber-700'   },
  overdue: { label: 'Overdue', bg: 'bg-rose-50',     text: 'text-rose-600'    },
  not_due: { label: 'Not due', bg: 'bg-surface-sub', text: 'text-ink/45'      },
}
const CONTRACT_STATUS: Record<ContractStatus, { label: string; bg: string; text: string }> = {
  signed:            { label: 'Signed ✓',           bg: 'bg-emerald-50', text: 'text-emerald-700' },
  pending_signature: { label: 'Awaiting signature', bg: 'bg-amber-50',   text: 'text-amber-700'   },
  changes_requested: { label: 'Changes requested',  bg: 'bg-rose-50',    text: 'text-rose-600'    },
}

/* ════════════════════════════════════════════════════════════════════
   BRAND ATTRIBUTION STRIP
   Persistent banner: "Running this campaign for Kinetics"
   ════════════════════════════════════════════════════════════════════ */
function BrandAttributionStrip({ brand, onMessage }: { brand: ManagedBrand; onMessage: () => void }) {
  return (
    <div className={`mb-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/12 bg-white px-5 py-3.5 ${CARD}`}>
      <div className="flex items-center gap-3">
        <EntityTile initials={brand.initials} color={brand.color} size={36}/>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13.5px] font-extrabold text-ink">{brand.name}</p>
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${brand.contractType === 'full_management' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
              {brand.contractType === 'full_management' ? <><RepeatIcon s={9}/>Managed client</> : 'Single campaign'}
            </span>
          </div>
          <p className="text-[11.5px] text-ink/45">{brand.industry} · Brief approved {brand.briefApprovedDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden text-[11.5px] font-semibold text-ink/35 sm:block">
          Operated by <span className="font-bold text-ink/55">Baltic Creators Agency</span>
        </span>
        <button onClick={onMessage}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3.5 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.04]">
          <ChatIcon s={12}/>Message brand
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   FEE ROUTING BADGE
   ════════════════════════════════════════════════════════════════════ */
function FeeRoutingBadge({ routing }: { routing: FeeRouting }) {
  return routing === 'agency_collects'
    ? <span className={`flex items-center gap-1.5 rounded-full ${GRAD_BTN} px-2.5 py-0.5 text-[10.5px] font-bold text-white`}><BriefcaseIcon s={9}/>Agency distributes</span>
    : <span className="flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10.5px] font-bold text-sky-700"><ShieldCheckIcon s={9}/>Brand pays directly</span>
}

/* ════════════════════════════════════════════════════════════════════
   CONTENT REVIEW MODAL
   Identical to brand tracker but with agency attribution note
   ════════════════════════════════════════════════════════════════════ */
function ContentReviewModal({ open, creator, brandName, onClose, onAction }: {
  open: boolean; creator: AgencyCreatorRow | null; brandName: string; onClose: () => void
  onAction: (creatorId: string, pieceId: string, action: 'approve' | 'revision') => void
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!open || !creator) return null

  const reviewable = creator.content.filter(p => ['submitted', 'approved', 'revision_requested'].includes(p.status))
  const pending    = creator.content.filter(p => p.status === 'pending_submission')

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[680px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`} style={{ maxHeight: '88vh' }}>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <Avatar initials={creator.initials} color={creator.color} size={40}/>
            <div>
              <h2 className="text-[16px] font-extrabold text-ink">Review content — {creator.name}</h2>
              <p className="text-[12px] text-ink/45">
                {creator.piecesCommitted} committed · {creator.piecesApproved} approved ·{' '}
                {creator.content.filter(p => p.status === 'submitted').length} awaiting review
              </p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        {/* Agency attribution note */}
        <div className="flex-shrink-0 flex items-center gap-2 border-b border-primary/6 bg-primary/[0.03] px-6 py-2.5">
          <BriefcaseIcon s={12}/>
          <p className="text-[11.5px] font-semibold text-primary/80">
            Reviewing as <span className="font-extrabold">Baltic Creators Agency</span> on behalf of <span className="font-extrabold">{brandName}</span>
          </p>
        </div>

        {/* Content pieces */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {reviewable.map(piece => {
            const cs = CONTENT_STATUS[piece.status]
            return (
              <div key={piece.id} className={`overflow-hidden rounded-2xl border ${
                piece.status === 'submitted' ? 'border-amber-200 bg-amber-50/30'
                : piece.status === 'revision_requested' ? 'border-rose-200 bg-rose-50/20'
                : 'border-emerald-200 bg-emerald-50/20'}`}>
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-[72px] w-[108px] flex-shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ background: `${piece.thumbnailColor}22` }}>
                    <div style={{ color: piece.thumbnailColor }}><ImageIcon s={24}/></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${cs.bg} ${cs.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cs.dot}`}/>{cs.label}
                      </span>
                      <span className="rounded-lg bg-surface-sub px-2 py-0.5 text-[10.5px] font-semibold text-ink/50">{piece.format}</span>
                    </div>
                    <p className="text-[14px] font-bold text-ink truncate">{piece.title}</p>
                    {piece.submittedDate && <p className="mt-0.5 text-[11.5px] text-ink/40">Submitted {piece.submittedDate}</p>}
                  </div>
                  {piece.status === 'submitted' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => onAction(creator.id, piece.id, 'approve')}
                        className={`flex items-center gap-1.5 rounded-xl ${GRAD_BTN} px-4 py-2 text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.40)] hover:-translate-y-0.5 transition`}>
                        <Check s={11}/>Approve
                      </button>
                      <button onClick={() => onAction(creator.id, piece.id, 'revision')}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-[12.5px] font-bold text-amber-700 hover:bg-amber-100 transition">
                        <RefreshIcon s={11}/>Request revision
                      </button>
                    </div>
                  )}
                  {piece.status === 'approved' && (
                    <span className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check s={16}/></span>
                  )}
                  {piece.status === 'revision_requested' && (
                    <span className="flex-shrink-0 text-[12px] font-bold text-rose-500">Revision sent</span>
                  )}
                </div>
              </div>
            )
          })}
          {pending.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-ink/30">Not yet submitted</p>
              {pending.map(piece => (
                <div key={piece.id} className="flex items-center gap-3 rounded-xl border border-primary/8 bg-surface-sub/50 px-4 py-3 mb-2 last:mb-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/8 text-ink/30"><ImageIcon s={14}/></div>
                  <div>
                    <p className="text-[13px] font-semibold text-ink/50">{piece.format}</p>
                    <p className="text-[11px] text-ink/35">Awaiting creator submission</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-primary/10 bg-surface-sub/40 px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub transition">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CONTRACT MODAL — EXTENDED
   Two tabs: Creator contract (agency↔creator) | Management agreement (agency↔brand)
   ════════════════════════════════════════════════════════════════════ */
function ContractModal({ open, creator, campaign, onClose }: {
  open: boolean; creator: AgencyCreatorRow | null; campaign: AgencyCampaign; onClose: () => void
}) {
  const [tab, setTab] = useState<'creator' | 'management'>('creator')

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) setTab('creator')
    return () => { document.body.style.overflow = '' }
  }, [open])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!open || !creator) return null
  const cs = CONTRACT_STATUS[creator.contractStatus]

  const paymentDesc = creator.dealType === 'flat'
    ? fmt(creator.flatOwed) + ' flat fee'
    : creator.dealType === 'commission'
    ? `${creator.commissionRate}% affiliate commission`
    : `${fmt(creator.flatOwed)} + ${creator.commissionRate}% commission`

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[560px] overflow-hidden rounded-3xl bg-white ${CARD}`} style={{ maxHeight: '88vh' }}>

        {/* Modal header */}
        <div className={`flex items-center justify-between px-6 py-5 ${GRAD_BTN}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20"><FileIcon s={16}/></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">Agency contracts</p>
              <p className="text-[15px] font-extrabold text-white">{creator.name} · {campaign.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30"><XIcon s={13}/></button>
        </div>

        {/* Tab strip */}
        <div className="flex border-b border-primary/10">
          {[
            { id: 'creator'    as const, label: 'Creator contract',      sub: `Baltic Creators Agency ↔ ${creator.name}` },
            { id: 'management' as const, label: 'Management agreement',  sub: `Baltic Creators Agency ↔ ${campaign.brand.name}` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-start gap-0.5 px-5 py-3.5 text-left transition border-b-2 -mb-px ${tab === t.id ? 'border-primary text-primary bg-primary/[0.03]' : 'border-transparent text-ink/45 hover:text-ink/70'}`}>
              <span className="text-[12.5px] font-bold">{t.label}</span>
              <span className="text-[10.5px] text-ink/40">{t.sub}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(88vh - 180px)' }}>

          {/* ── CREATOR CONTRACT TAB ── */}
          {tab === 'creator' && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-bold ${cs.bg} ${cs.text} border-current/20`}>{cs.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] text-ink/40">{creator.contractId}</span>
                  <button className="flex items-center gap-1.5 text-[12.5px] font-bold text-primary hover:underline"><DownloadIcon s={12}/>PDF</button>
                </div>
              </div>
              <div className="space-y-0 rounded-2xl border border-ink/10 divide-y divide-ink/8 overflow-hidden">
                <div className="bg-surface-sub/60 px-5 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/35">Creator Campaign Agreement</p>
                  <p className="mt-0.5 text-[15px] font-extrabold text-ink">{campaign.title}</p>
                  <p className="text-[11.5px] text-ink/45">Operated by Baltic Creators Agency on behalf of {campaign.brand.name}</p>
                </div>
                {[
                  ['Agency (operator)',  'Baltic Creators Agency'],
                  ['Brand (funder)',      campaign.brand.name],
                  ['Creator',           `${creator.name} (${creator.handle})`],
                  ['Campaign',           campaign.title],
                  ['Deliverables',      `${creator.piecesCommitted} piece${creator.piecesCommitted !== 1 ? 's' : ''} on ${creator.platform}`],
                  ['Dates',             `${campaign.startDate} → ${campaign.endDate}`],
                  ['Compensation',       paymentDesc],
                  ['Usage rights',      '12 months, non-exclusive, digital only'],
                  ['Payment routing',    campaign.feeRouting === 'agency_collects' ? 'Agency collects & distributes' : 'Brand pays creator directly via Grade'],
                  ['Late payment',       '1.5% per month after 30 days'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-6 px-5 py-3">
                    <span className="flex-shrink-0 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink/35 pt-0.5">{label}</span>
                    <span className="text-right text-[13px] font-semibold text-ink">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"><Check s={10}/></span>
                  <p className="text-[12.5px] font-extrabold text-emerald-800">Signed by both parties</p>
                </div>
                <p className="text-[12px] text-emerald-700">Harshul Gupta, Founder · Baltic Creators Agency</p>
                <p className="text-[12px] text-emerald-700">{creator.name} · {creator.handle}</p>
              </div>
            </>
          )}

          {/* ── MANAGEMENT AGREEMENT TAB ── */}
          {tab === 'management' && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700">Signed ✓</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] text-ink/40">MGT-2026-001</span>
                  <button className="flex items-center gap-1.5 text-[12.5px] font-bold text-primary hover:underline"><DownloadIcon s={12}/>PDF</button>
                </div>
              </div>
              <div className="space-y-0 rounded-2xl border border-ink/10 divide-y divide-ink/8 overflow-hidden">
                <div className={`px-5 py-3 ${GRAD_BTN}`}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">Agency Management Agreement</p>
                  <p className="mt-0.5 text-[15px] font-extrabold text-white">Full management — {campaign.brand.name}</p>
                </div>
                {[
                  ['Agency',         'Baltic Creators Agency SIA'],
                  ['Brand (client)', `${campaign.brand.name} · ${campaign.brand.industry}`],
                  ['Scope',          'Full influencer marketing management on Creator Nexus'],
                  ['Authority',      'Create campaigns, contract creators, access brand dashboard, process Grade payments'],
                  ['Monthly retainer','€1,200/month'],
                  ['Notice period',   '30 days written notice'],
                  ['Exclusivity',     'Not included'],
                  ['Campaign',        `${campaign.title} — covered under this agreement`],
                  ['Campaign fee routing', campaign.feeRouting === 'agency_collects' ? 'Agency collects total budget, distributes to creators' : 'Brand funds Grade escrow, agency invoices separately'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-6 px-5 py-3">
                    <span className="flex-shrink-0 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink/35 pt-0.5">{label}</span>
                    <span className="text-right text-[13px] font-semibold text-ink">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"><Check s={10}/></span>
                  <p className="text-[12.5px] font-extrabold text-emerald-800">Signed by both parties</p>
                </div>
                <p className="text-[12px] text-emerald-700">Harshul Gupta, Founder · Baltic Creators Agency SIA</p>
                <p className="text-[12px] text-emerald-700">Marketing Director · {campaign.brand.name}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-primary/10 px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub transition">Close</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TIMELINE CARD — agency-specific milestones
   ════════════════════════════════════════════════════════════════════ */
function TimelineCard({ campaign }: { campaign: AgencyCampaign }) {
  const totalDays = 30, elapsed = 14
  const pct = Math.round((elapsed / totalDays) * 100)
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><CalIcon s={14}/></span>
        <h3 className="text-[13.5px] font-extrabold text-ink">Campaign timeline</h3>
      </div>
      <div className="flex items-center justify-between text-[11.5px] font-semibold text-ink/45 mb-2">
        <span>{campaign.startDate}</span>
        <span>{campaign.endDate}</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-primary/[0.08]">
        <div className={`h-full rounded-full ${GRAD_BTN} transition-all duration-700`} style={{ width: `${pct}%` }}/>
        <div className="absolute top-0 bottom-0 w-0.5 bg-ink/40 rounded-full" style={{ left: `${pct}%` }}/>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11.5px]">
        <span className="font-semibold text-primary">{elapsed} days elapsed</span>
        <span className="text-ink/40">{totalDays - elapsed} days remaining</span>
      </div>
      {/* Agency-specific milestones */}
      <div className="mt-4 space-y-2.5">
        {[
          { label: 'Brief approved by brand',      done: true,  date: 'Jun 5'  },
          { label: 'Contracts sent to creators',   done: true,  date: 'Jun 15' },
          { label: 'First content submissions',    done: true,  date: 'Jun 22' },
          { label: 'Final content deadline',       done: false, date: 'Jul 10' },
          { label: 'Agency fee collected',         done: false, date: 'Jul 12' },
          { label: 'Creator payouts released',     done: false, date: 'Jul 15' },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-2.5">
            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${m.done ? `${GRAD_BTN} text-white` : 'border-2 border-primary/20 bg-white'}`}>
              {m.done && <Check s={9}/>}
            </span>
            <span className={`flex-1 text-[12px] font-semibold ${m.done ? 'text-ink/55' : 'text-ink/80'}`}>{m.label}</span>
            <span className="text-[11px] text-ink/35">{m.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   AGENCY FEE CARD — new, no equivalent on brand tracker
   Shows the agency's own earnings from this campaign
   ════════════════════════════════════════════════════════════════════ */
function AgencyFeeCard({ campaign, router }: { campaign: AgencyCampaign; router: ReturnType<typeof useRouter> }) {
  const pct = campaign.agencyFeeEarned === 0 ? 0 : Math.round((campaign.agencyFeeCollected / campaign.agencyFeeEarned) * 100)
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white overflow-hidden ${CARD}`}>
      <div className={`flex items-center gap-3 px-5 py-4 ${GRAD_BTN}`}>
        <BriefcaseIcon s={16}/>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/65">Agency fee</p>
          <p className="text-[15px] font-extrabold text-white">{fmt(campaign.agencyFeeEarned)}</p>
        </div>
        <div className="ml-auto">
          <FeeRoutingBadge routing={campaign.feeRouting}/>
        </div>
      </div>
      <div className="divide-y divide-primary/6">
        {[
          { label: 'Total budget (brand)',  value: fmt(campaign.totalBudget),       detail: 'Committed by brand' },
          { label: 'Creator budget',        value: fmt(campaign.creatorBudget),      detail: `After ${campaign.agencyFeeRate}% agency fee` },
          { label: 'Agency fee earned',     value: fmt(campaign.agencyFeeEarned),    detail: `${campaign.agencyFeeRate}% of ${fmt(campaign.totalBudget)}` },
          { label: 'Collected so far',      value: fmt(campaign.agencyFeeCollected), detail: `${pct}% of fee` },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-[12.5px] font-semibold text-ink/65">{row.label}</p>
              <p className="text-[11px] text-ink/40">{row.detail}</p>
            </div>
            <p className="text-[14px] font-extrabold text-ink">{row.value}</p>
          </div>
        ))}
      </div>
      {/* Fee collection progress */}
      <div className="px-5 pb-4 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold text-ink/40">Fee collected</p>
          <p className="text-[11px] font-bold text-primary">{pct}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-primary/[0.08]">
          <div className={`h-full rounded-full ${GRAD_BTN} transition-all duration-700`} style={{ width: `${pct}%` }}/>
        </div>
        <p className="mt-1.5 text-[11px] text-ink/35">
          {fmt(campaign.agencyFeeEarned - campaign.agencyFeeCollected)} remaining to collect
        </p>
      </div>
      <div className="border-t border-primary/8 px-5 py-4">
        <button onClick={() => router.push('/agency/payments')}
          className={`flex w-full items-center justify-center gap-2 rounded-xl ${GRAD_BTN} py-3 text-[13px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5 transition`}>
          <EuroIcon s={14}/>Agency payments
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAYMENT SUMMARY CARD — extended with creator distribution tracking
   ════════════════════════════════════════════════════════════════════ */
function PaymentSummaryCard({ campaign }: { campaign: AgencyCampaign }) {
  const creators     = campaign.creators
  const totalFlat    = creators.reduce((s, c) => s + c.flatOwed, 0)
  const flatPaid     = creators.reduce((s, c) => s + c.flatPaid, 0)
  const totalComm    = creators.reduce((s, c) => s + c.estimatedCommission, 0)
  const commPaid     = creators.reduce((s, c) => s + c.commissionPaid, 0)
  const totalPaid    = flatPaid + commPaid
  const outstanding  = (totalFlat - flatPaid) + (totalComm - commPaid)
  const overdue      = creators.filter(c => c.paymentStatus === 'overdue').reduce((s, c) => s + (c.flatOwed - c.flatPaid), 0)
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white overflow-hidden ${CARD}`}>
      <div className="border-b border-primary/8 px-5 py-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><EuroIcon s={15}/></span>
        <div>
          <h3 className="text-[13.5px] font-extrabold text-ink">Creator payments</h3>
          <p className="text-[11px] text-ink/40">
            {campaign.feeRouting === 'agency_collects' ? 'Distributed by agency' : 'Paid by brand directly'}
          </p>
        </div>
      </div>
      <div className="divide-y divide-primary/6">
        {[
          { label: 'Flat fees total',    value: fmt(totalFlat),   sub: `${fmt(flatPaid)} distributed`,  ok: flatPaid >= totalFlat },
          { label: 'Commission (est.)',  value: fmt(totalComm),   sub: `${fmt(commPaid)} distributed`,  ok: commPaid >= totalComm },
          { label: 'Total distributed', value: fmt(totalPaid),   sub: 'Via Grade escrow',              ok: true, bold: true      },
          { label: 'Outstanding',       value: fmt(outstanding), sub: overdue > 0 ? `${fmt(overdue)} overdue` : 'On track', ok: outstanding === 0 },
        ].map(row => (
          <div key={row.label} className={`flex items-center justify-between px-5 py-3 ${(row as { bold?: boolean }).bold ? 'bg-surface-sub/50' : ''}`}>
            <div>
              <p className={`text-[13px] ${(row as { bold?: boolean }).bold ? 'font-extrabold text-ink' : 'font-semibold text-ink/65'}`}>{row.label}</p>
              <p className={`text-[11px] font-semibold ${row.ok ? 'text-emerald-600' : 'text-rose-500'}`}>{row.sub}</p>
            </div>
            <p className={`text-[15px] font-extrabold tracking-[-0.02em] ${(row as { bold?: boolean }).bold ? GRAD_TXT : 'text-ink'}`}>{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CREATOR ROSTER ROW
   Same structure as brand tracker + agency-specific payment action
   ════════════════════════════════════════════════════════════════════ */
function CreatorRosterRow({ creator, feeRouting, onReview, onContract, onMessage, onPayCreator }: {
  creator:      AgencyCreatorRow
  feeRouting:   FeeRouting
  onReview:     () => void
  onContract:   () => void
  onMessage:    () => void
  onPayCreator: () => void
}) {
  const ps           = PAYMENT_STATUS[creator.paymentStatus]
  const cst          = CONTRACT_STATUS[creator.contractStatus]
  const pendingReview = creator.content.filter(p => p.status === 'submitted').length
  const totalOwed    = creator.flatOwed + creator.estimatedCommission
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`border-b border-primary/6 last:border-0 ${expanded ? 'bg-primary/[0.015]' : 'hover:bg-primary/[0.02]'} transition-colors`}>
      {/* Main row */}
      <div className="grid items-center gap-4 px-5 py-4"
        style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>

        {/* Creator identity */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar initials={creator.initials} color={creator.color} size={38}/>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[13.5px] font-bold text-ink truncate">{creator.name}</p>
              <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cst.bg} ${cst.text} border-current/20`}>{cst.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[11.5px] text-ink/45">{creator.handle}</p>
              <span className="text-ink/20">·</span>
              <span className="text-[11px] text-ink/40">{creator.platform} · {creator.followers}</span>
            </div>
          </div>
        </div>

        {/* Content progress */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/35 mb-1.5">Content</p>
          <MiniProgress done={creator.piecesApproved} total={creator.piecesCommitted} color={creator.color}/>
          {pendingReview > 0 && (
            <p className="mt-1 text-[10.5px] font-bold text-amber-600">{pendingReview} awaiting review</p>
          )}
        </div>

        {/* Performance */}
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/35">Performance</p>
          <p className="text-[12.5px] font-bold text-ink">{creator.viewsGenerated} <span className="font-medium text-ink/40">views</span></p>
          <p className="text-[12.5px] font-bold text-ink">{creator.engagementGenerated} <span className="font-medium text-ink/40">eng.</span></p>
        </div>

        {/* Payment + routing indicator */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/35 mb-1">Payment</p>
          <p className="text-[13px] font-extrabold text-ink">{totalOwed === 0 ? 'Commission' : fmt(totalOwed)}</p>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${ps.bg} ${ps.text}`}>{ps.label}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Review content */}
          <button onClick={onReview}
            className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-bold transition ${
              pendingReview > 0
                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-primary/15 bg-white text-primary hover:bg-primary/[0.06]'
            }`}>
            <EyeIcon s={13}/>Review
            {pendingReview > 0 && (
              <span className="flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white">{pendingReview}</span>
            )}
          </button>

          {/* Contract (shows both) */}
          <button onClick={onContract}
            className="flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3 py-2 text-[12px] font-bold text-ink/60 transition hover:bg-primary/[0.05] hover:text-primary">
            <FileIcon s={13}/>Contracts
          </button>

          {/* Payment action — depends on routing */}
          {creator.paymentStatus === 'overdue' && (
            feeRouting === 'agency_collects' ? (
              <button onClick={onPayCreator}
                className={`flex items-center gap-1.5 rounded-xl ${GRAD_BTN} px-3 py-2 text-[12px] font-bold text-white transition hover:-translate-y-0.5`}>
                <EuroIcon s={12}/>Pay
              </button>
            ) : (
              <button onClick={onMessage}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] font-bold text-amber-700 transition hover:bg-amber-100">
                <AlertIcon s={12}/>Chase brand
              </button>
            )
          )}

          {/* Message */}
          <button onClick={onMessage}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/15 bg-white text-ink/40 transition hover:bg-primary/[0.05] hover:text-primary">
            <ChatIcon s={13}/>
          </button>

          {/* Expand toggle */}
          <button onClick={() => setExpanded(e => !e)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/12 bg-white text-ink/35 transition hover:bg-surface-sub">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* Expanded piece-by-piece view */}
      {expanded && (
        <div className="border-t border-primary/8 bg-surface-sub/30 px-5 py-4">
          <p className="mb-3 text-[10.5px] font-black uppercase tracking-[0.16em] text-ink/30">Content pieces</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {creator.content.map((piece, i) => {
              const s = CONTENT_STATUS[piece.status]
              return (
                <div key={piece.id} className="flex items-center gap-2.5 rounded-xl border border-primary/8 bg-white px-3.5 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: `${piece.thumbnailColor}18`, color: piece.thumbnailColor }}>
                    <ImageIcon s={13}/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold text-ink/70">Piece {i + 1}</p>
                    <p className="truncate text-[10.5px] text-ink/40">{piece.format}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${s.bg} ${s.text}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function AgencyCampaignTrackerPage() {
  const router = useRouter()
  const [campaign, setCampaign] = useState<AgencyCampaign>(CAMPAIGN_DATA)
  const [reviewCreator,   setReviewCreator]   = useState<AgencyCreatorRow | null>(null)
  const [contractCreator, setContractCreator] = useState<AgencyCreatorRow | null>(null)

  const UNREAD_NOTIFS = 3

  /* Handle content approval/revision */
  const handleContentAction = (creatorId: string, pieceId: string, action: 'approve' | 'revision') => {
    const newStatus: ContentStatus = action === 'approve' ? 'approved' : 'revision_requested'
    setCampaign(prev => ({
      ...prev,
      creators: prev.creators.map(c => {
        if (c.id !== creatorId) return c
        const updated = c.content.map(p => p.id !== pieceId ? p : { ...p, status: newStatus })
        const approved  = updated.filter(p => p.status === 'approved').length
        const submitted = updated.filter(p => ['submitted','approved'].includes(p.status)).length
        return { ...c, content: updated, piecesApproved: approved, piecesSubmitted: submitted }
      }),
    }))
    setReviewCreator(prev => {
      if (!prev || prev.id !== creatorId) return prev
      const updated = prev.content.map(p => p.id !== pieceId ? p : { ...p, status: newStatus })
      return { ...prev, content: updated, piecesApproved: updated.filter(p => p.status === 'approved').length }
    })
  }

  /* Summary numbers */
  const allPieces     = campaign.creators.reduce((s, c) => s + c.piecesCommitted, 0)
  const submitted     = campaign.creators.reduce((s, c) => s + c.piecesSubmitted, 0)
  const approved      = campaign.creators.reduce((s, c) => s + c.piecesApproved, 0)
  const pendingReview = campaign.creators.reduce((s, c) => s + c.content.filter(p => p.status === 'submitted').length, 0)

  const statusCfg: Record<CampaignStatus, { label: string; bg: string; text: string; dot: string }> = {
    active:    { label: 'Active',    bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    review:    { label: 'In review', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
    completed: { label: 'Completed', bg: 'bg-surface-sub',text: 'text-ink/50',      dot: 'bg-ink/25'      },
    paused:    { label: 'Paused',    bg: 'bg-rose-50',    text: 'text-rose-500',    dot: 'bg-rose-400'    },
  }
  const sc = statusCfg[campaign.status]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* Modals */}
      <ContentReviewModal
        open={reviewCreator !== null} creator={reviewCreator} brandName={campaign.brand.name}
        onClose={() => setReviewCreator(null)} onAction={handleContentAction}/>
      <ContractModal
        open={contractCreator !== null} creator={contractCreator} campaign={campaign}
        onClose={() => setContractCreator(null)}/>

      {/* ════ HEADER — agency pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg,rgba(139,49,232,0.05) 0%,rgba(139,49,232,0.05) 30%,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 58%,rgba(139,49,232,0.05) 70%,rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {[
                { label: 'Dashboard', active: false, action: () => router.push('/dashboard/agency') },
                { label: 'Campaigns', active: false, action: () => {} },
                { label: campaign.title.length > 20 ? campaign.title.slice(0, 18) + '…' : campaign.title, active: true, action: () => {} },
              ].map(n => (
                <button key={n.label} onClick={n.action}
                  className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
                  {n.label}
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
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.40)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-6 py-8">

        {/* ── Campaign header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <button onClick={() => router.push('/dashboard/agency')}
              className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary">
              <ChevLeft s={14}/>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-[clamp(20px,2.8vw,26px)] font-black tracking-[-0.03em] text-ink">{campaign.title}</h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold ${sc.bg} ${sc.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
                </span>
                <FeeRoutingBadge routing={campaign.feeRouting}/>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-ink/50">
                <span className="flex items-center gap-1.5"><CalIcon s={12}/>{campaign.startDate} → {campaign.endDate}</span>
                <span className="text-ink/25">·</span>
                <span className="rounded-lg bg-violet-50 px-2 py-0.5 text-[11.5px] font-bold text-violet-700">{campaign.objective}</span>
                <span className="text-ink/25">·</span>
                <span className="flex items-center gap-1"><UsersIcon s={12}/>{campaign.creators.length} creators</span>
                <span className="text-ink/25">·</span>
                <span>{fmt(campaign.totalBudget)} budget</span>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button onClick={() => router.push('/agency/messages')}
              className="flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-ink/60 transition hover:text-primary hover:border-primary/30">
              <SendIcon s={13}/>Message all
            </button>
            <button className="flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-ink/60 transition hover:text-primary hover:border-primary/30">
              <DownloadIcon s={13}/>Export
            </button>
          </div>
        </div>

        {/* ── Brand attribution strip ── */}
        <div className="mt-5">
          <BrandAttributionStrip brand={campaign.brand} onMessage={() => router.push('/agency/messages')}/>
        </div>

        {/* ── 5 stat cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { icon: <ImageIcon s={17}/>,      label: 'Total pieces',    value: String(allPieces),     sub: 'Committed',         accent: false },
            { icon: <SendIcon s={17}/>,        label: 'Submitted',       value: String(submitted),     sub: `${allPieces - submitted} pending`, accent: false },
            { icon: <Check s={17}/>,           label: 'Approved',        value: String(approved),      sub: approved === allPieces ? 'All done' : `${submitted - approved > 0 ? submitted - approved + ' in review' : ''}`, accent: approved === allPieces },
            { icon: <EyeIcon s={17}/>,         label: 'Pending review',  value: String(pendingReview), sub: pendingReview > 0 ? 'Action needed' : 'All clear', accent: false },
            { icon: <BriefcaseIcon s={17}/>,   label: 'Agency fee',      value: fmt(campaign.agencyFeeEarned), sub: `${campaign.agencyFeeRate}% of budget`, accent: true },
          ].map(card => (
            <div key={card.label} className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-5 ${card.accent && card.label === 'Agency fee' ? `${GRAD_BTN} border-transparent shadow-[0_8px_24px_-8px_rgba(139,49,232,0.45)]` : card.accent ? `${GRAD_BTN} border-transparent shadow-[0_8px_24px_-8px_rgba(139,49,232,0.45)]` : `border-primary/10 bg-white ${CARD}`}`}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accent ? 'bg-white/20 text-white' : 'bg-primary/[0.08] text-primary'}`}>{card.icon}</span>
              <div className="mt-4">
                <p className={`text-[24px] sm:text-[26px] font-black tracking-[-0.04em] ${card.accent ? 'text-white' : 'text-ink'}`}>{card.value}</p>
                <p className={`mt-0.5 text-[12px] font-semibold ${card.accent ? 'text-white/70' : 'text-ink/45'}`}>{card.label}</p>
                <p className={`mt-0.5 text-[11px] ${card.accent ? 'text-white/50' : 'text-ink/30'}`}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main layout: roster (left) + sidebar (right) ── */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Creator roster table ── */}
          <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white lg:flex-1 ${CARD}`}>
            <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
              <h2 className="text-[14px] font-extrabold text-ink">Creator roster</h2>
              <p className="text-[12px] text-ink/40">{campaign.creators.length} creators · click row to expand</p>
            </div>
            {/* Table header */}
            <div className="grid border-b border-primary/6 bg-surface-sub/60 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-ink/30"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
              <span>Creator</span><span>Content</span><span>Performance</span><span>Payment</span><span>Actions</span>
            </div>
            {/* Rows */}
            {campaign.creators.map(creator => (
              <CreatorRosterRow
                key={creator.id}
                creator={creator}
                feeRouting={campaign.feeRouting}
                onReview={() => setReviewCreator(creator)}
                onContract={() => setContractCreator(creator)}
                onMessage={() => router.push('/agency/messages')}
                onPayCreator={() => router.push('/agency/payments')}
              />
            ))}
          </div>

          {/* ── Sidebar ── */}
          <div className="flex w-full flex-col gap-4 lg:w-[300px] lg:flex-shrink-0">
            <TimelineCard campaign={campaign}/>
            <AgencyFeeCard campaign={campaign} router={router}/>
            <PaymentSummaryCard campaign={campaign}/>
          </div>
        </div>

        {/* ── Campaign brief snippet ── */}
        <div className={`mt-6 flex gap-4 rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} shadow-[0_4px_12px_-4px_rgba(139,49,232,0.40)] text-white`}>
            <ZapIcon s={16}/>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <p className="text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-ink/40">Campaign brief</p>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600">
                <Check s={9}/>Approved by {campaign.brand.name} on {campaign.brand.briefApprovedDate}
              </span>
            </div>
            <p className="text-[13.5px] leading-[1.7] text-ink/65">{campaign.brief}</p>
          </div>
        </div>

      </main>
    </div>
  )
}