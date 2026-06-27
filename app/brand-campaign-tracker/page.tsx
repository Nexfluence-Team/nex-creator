'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useRouter, useParams } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Campaign Tracker — app/brand/campaign/[id]/page.tsx
   Per-campaign view: content pipeline, creator roster, payment
   tracking, content review modal, contract view modal.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type ContentStatus   = 'pending_submission' | 'submitted' | 'approved' | 'revision_requested'
type PaymentStatus   = 'paid' | 'pending' | 'overdue' | 'not_due'
type ContractStatus  = 'signed' | 'pending_signature' | 'changes_requested'
type CampaignStatus  = 'active' | 'review' | 'completed' | 'paused'

interface ContentPiece {
  id: string
  format: string        /* e.g. "Instagram Reel", "TikTok" */
  platform: string
  title: string
  submittedDate: string | null
  status: ContentStatus
  thumbnailColor: string
}

interface CreatorRow {
  id: string
  name: string
  handle: string
  initials: string
  color: string
  platform: string
  platformIcon: string  /* path */
  engagementRate: number
  followers: string
  piecesCommitted: number
  piecesSubmitted: number
  piecesApproved: number
  /* Payment */
  dealType: 'flat' | 'commission' | 'hybrid'
  flatOwed: number
  flatPaid: number
  commissionRate: number | null
  estimatedCommission: number
  commissionPaid: number
  paymentStatus: PaymentStatus
  /* Contract */
  contractStatus: ContractStatus
  contractId: string
  /* Content pieces */
  content: ContentPiece[]
  /* Views / engagement generated */
  viewsGenerated: string
  engagementGenerated: string
  conversionsGenerated: string
}

interface Campaign {
  id: string
  title: string
  objective: string
  status: CampaignStatus
  startDate: string
  endDate: string
  budget: string
  totalSpend: number
  color: string
  brief: string
  creators: CreatorRow[]
}

/* ════════════════════════════════════════════════════════════════════
   DATA — Campaign cp1: Vitamin-C Recovery Stack
   ════════════════════════════════════════════════════════════════════ */
const CAMPAIGN_DATA: Campaign = {
  id: 'cp1',
  title: 'Vitamin-C Recovery Stack',
  objective: 'Conversions',
  status: 'active',
  startDate: 'Jun 1, 2026',
  endDate: 'Jun 30, 2026',
  budget: '€1,900',
  totalSpend: 1580,
  color: '#8B31E8',
  brief: 'Showcase our Vitamin-C Recovery Stack as a genuine part of a training routine. Show real results over 7–14 days of use. Honest, unfiltered content only.',
  creators: [
    {
      id: 'cr1', name: 'Amelia Roze', handle: '@amelia.roze', initials: 'AR', color: '#8B31E8',
      platform: 'Instagram', platformIcon: '/Socials/Instagram.svg',
      engagementRate: 6.8, followers: '142K',
      piecesCommitted: 3, piecesSubmitted: 3, piecesApproved: 3,
      dealType: 'hybrid', flatOwed: 500, flatPaid: 500, commissionRate: 15, estimatedCommission: 312, commissionPaid: 312,
      paymentStatus: 'paid',
      contractStatus: 'signed', contractId: 'CTR-2026-001',
      viewsGenerated: '420K', engagementGenerated: '8.1%', conversionsGenerated: '2.1K',
      content: [
        { id: 'p1', format: 'Instagram Reel', platform: 'Instagram', title: 'Day 1–7 Recovery Routine', submittedDate: 'Jun 8', status: 'approved', thumbnailColor: '#8B31E8' },
        { id: 'p2', format: 'Instagram Story Series', platform: 'Instagram', title: 'Product Unboxing + First Impression', submittedDate: 'Jun 10', status: 'approved', thumbnailColor: '#a03be8' },
        { id: 'p3', format: 'Instagram Reel', platform: 'Instagram', title: '14-Day Results Check-in', submittedDate: 'Jun 19', status: 'approved', thumbnailColor: '#b44af0' },
      ],
    },
    {
      id: 'cr2', name: 'Markus Tamm', handle: '@markustamm', initials: 'MT', color: '#2563EB',
      platform: 'TikTok', platformIcon: '/Socials/TikTok.svg',
      engagementRate: 11.2, followers: '96K',
      piecesCommitted: 2, piecesSubmitted: 2, piecesApproved: 1,
      dealType: 'flat', flatOwed: 800, flatPaid: 0, commissionRate: null, estimatedCommission: 0, commissionPaid: 0,
      paymentStatus: 'overdue',
      contractStatus: 'signed', contractId: 'CTR-2026-002',
      viewsGenerated: '380K', engagementGenerated: '11.4%', conversionsGenerated: '1.8K',
      content: [
        { id: 'p4', format: 'TikTok', platform: 'TikTok', title: 'Race Day Morning Routine ft. Recovery Stack', submittedDate: 'Jun 15', status: 'approved', thumbnailColor: '#2563EB' },
        { id: 'p5', format: 'TikTok', platform: 'TikTok', title: 'Electrolyte vs Recovery Stack — Real Talk', submittedDate: 'Jun 20', status: 'revision_requested', thumbnailColor: '#3b82f6' },
      ],
    },
    {
      id: 'cr3', name: 'Rūta Vaitkutė', handle: '@ruta.glow', initials: 'RV', color: '#C026D3',
      platform: 'TikTok', platformIcon: '/Socials/TikTok.svg',
      engagementRate: 10.1, followers: '87K',
      piecesCommitted: 3, piecesSubmitted: 1, piecesApproved: 0,
      dealType: 'commission', flatOwed: 0, flatPaid: 0, commissionRate: 16, estimatedCommission: 128, commissionPaid: 0,
      paymentStatus: 'not_due',
      contractStatus: 'signed', contractId: 'CTR-2026-003',
      viewsGenerated: '290K', engagementGenerated: '10.3%', conversionsGenerated: '1.1K',
      content: [
        { id: 'p6', format: 'TikTok', platform: 'TikTok', title: 'Skincare x Recovery — My Honest Opinion', submittedDate: 'Jun 22', status: 'submitted', thumbnailColor: '#C026D3' },
        { id: 'p7', format: 'TikTok', platform: 'TikTok', title: 'Piece 2 — Not submitted yet', submittedDate: null, status: 'pending_submission', thumbnailColor: '#d946ef' },
        { id: 'p8', format: 'TikTok', platform: 'TikTok', title: 'Piece 3 — Not submitted yet', submittedDate: null, status: 'pending_submission', thumbnailColor: '#e879f9' },
      ],
    },
    {
      id: 'cr4', name: 'Jonas Petrauskas', handle: '@jonas.fit', initials: 'JP', color: '#D97706',
      platform: 'YouTube', platformIcon: '/Socials/YouTube.svg',
      engagementRate: 4.9, followers: '38K',
      piecesCommitted: 1, piecesSubmitted: 0, piecesApproved: 0,
      dealType: 'flat', flatOwed: 500, flatPaid: 0, commissionRate: null, estimatedCommission: 0, commissionPaid: 0,
      paymentStatus: 'not_due',
      contractStatus: 'signed', contractId: 'CTR-2026-004',
      viewsGenerated: '110K', engagementGenerated: '5.2%', conversionsGenerated: '840',
      content: [
        { id: 'p9', format: 'YouTube Video', platform: 'YouTube', title: 'Piece 1 — Not submitted yet', submittedDate: null, status: 'pending_submission', thumbnailColor: '#D97706' },
      ],
    },
    {
      id: 'cr5', name: 'Elīna Krūmiņa', handle: '@elina.kr', initials: 'EK', color: '#059669',
      platform: 'Instagram', platformIcon: '/Socials/Instagram.svg',
      engagementRate: 5.4, followers: '51K',
      piecesCommitted: 2, piecesSubmitted: 2, piecesApproved: 2,
      dealType: 'hybrid', flatOwed: 200, flatPaid: 200, commissionRate: 12, estimatedCommission: 96, commissionPaid: 96,
      paymentStatus: 'paid',
      contractStatus: 'signed', contractId: 'CTR-2026-005',
      viewsGenerated: '98K', engagementGenerated: '5.6%', conversionsGenerated: '620',
      content: [
        { id: 'p10', format: 'Instagram Reel', platform: 'Instagram', title: 'Morning Recovery Ritual', submittedDate: 'Jun 12', status: 'approved', thumbnailColor: '#059669' },
        { id: 'p11', format: 'Instagram Post', platform: 'Instagram', title: 'Why I Added This to My Stack', submittedDate: 'Jun 16', status: 'approved', thumbnailColor: '#10b981' },
      ],
    },
  ],
}

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function Check({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function ChevLeft({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EuroIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ImageIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function FileIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function ChatIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EyeIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function ZapIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function UsersIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.9"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>
}
function CalIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function DownloadIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function RefreshIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SendIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   SHARED HELPERS
   ════════════════════════════════════════════════════════════════════ */
function Avatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{initials}</div>
  )
}

function fmt(n: number) { return `€${n.toLocaleString()}` }

/* ════════════════════════════════════════════════════════════════════
   STATUS CONFIGS
   ════════════════════════════════════════════════════════════════════ */
const CONTENT_STATUS: Record<ContentStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending_submission: { label: 'Not submitted',      bg: 'bg-surface-sub',  text: 'text-ink/45',       dot: 'bg-ink/20'        },
  submitted:          { label: 'Awaiting review',    bg: 'bg-amber-50',     text: 'text-amber-700',    dot: 'bg-amber-400'     },
  approved:           { label: 'Approved',           bg: 'bg-emerald-50',   text: 'text-emerald-700',  dot: 'bg-emerald-400'   },
  revision_requested: { label: 'Revision requested', bg: 'bg-rose-50',      text: 'text-rose-600',     dot: 'bg-rose-400'      },
}
const PAYMENT_STATUS: Record<PaymentStatus, { label: string; bg: string; text: string }> = {
  paid:     { label: 'Paid',     bg: 'bg-emerald-50',   text: 'text-emerald-700' },
  pending:  { label: 'Due',      bg: 'bg-amber-50',     text: 'text-amber-700'   },
  overdue:  { label: 'Overdue',  bg: 'bg-rose-50',      text: 'text-rose-600'    },
  not_due:  { label: 'Not due',  bg: 'bg-surface-sub',  text: 'text-ink/45'      },
}
const CONTRACT_STATUS: Record<ContractStatus, { label: string; bg: string; text: string }> = {
  signed:             { label: 'Signed ✓',            bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  pending_signature:  { label: 'Awaiting signature',  bg: 'bg-amber-50',    text: 'text-amber-700'   },
  changes_requested:  { label: 'Changes requested',   bg: 'bg-rose-50',     text: 'text-rose-600'    },
}

/* Mini progress bar */
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

/* ════════════════════════════════════════════════════════════════════
   CONTENT REVIEW MODAL
   Shows all pieces for one creator; brand can Approve or Request revision
   ════════════════════════════════════════════════════════════════════ */
function ContentReviewModal({ open, creator, onClose, onAction }: {
  open: boolean
  creator: CreatorRow | null
  onClose: () => void
  onAction: (creatorId: string, pieceId: string, action: 'approve' | 'revision') => void
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

  if (!open || !creator) return null

  const reviewable = creator.content.filter(p => p.status === 'submitted' || p.status === 'approved' || p.status === 'revision_requested')
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
              <p className="text-[12px] text-ink/45">{creator.piecesCommitted} pieces committed · {creator.piecesApproved} approved · {creator.content.filter(p => p.status === 'submitted').length} awaiting review</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/45 transition hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Reviewable pieces */}
          {reviewable.map(piece => {
            const cs = CONTENT_STATUS[piece.status]
            return (
              <div key={piece.id} className={`overflow-hidden rounded-2xl border ${piece.status === 'submitted' ? 'border-amber-200 bg-amber-50/30' : piece.status === 'revision_requested' ? 'border-rose-200 bg-rose-50/20' : 'border-emerald-200 bg-emerald-50/20'}`}>
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail placeholder */}
                  <div className="flex h-[72px] w-[108px] flex-shrink-0 items-center justify-center rounded-xl shadow-sm" style={{ background: `${piece.thumbnailColor}22` }}>
                    <div style={{ color: piece.thumbnailColor }}><ImageIcon s={24}/></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${cs.bg} ${cs.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cs.dot}`}/>
                        {cs.label}
                      </span>
                      <span className="rounded-lg bg-surface-sub px-2 py-0.5 text-[10.5px] font-semibold text-ink/50">{piece.format}</span>
                    </div>
                    <p className="text-[14px] font-bold text-ink truncate">{piece.title}</p>
                    {piece.submittedDate && <p className="mt-0.5 text-[11.5px] text-ink/40">Submitted {piece.submittedDate}</p>}
                  </div>
                  {/* Actions */}
                  {piece.status === 'submitted' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => onAction(creator.id, piece.id, 'approve')}
                        className={`flex items-center gap-1.5 rounded-xl ${GRAD_BTN} px-4 py-2 text-[12.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.40)] transition hover:-translate-y-0.5`}>
                        <Check s={11}/>Approve
                      </button>
                      <button onClick={() => onAction(creator.id, piece.id, 'revision')}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-[12.5px] font-bold text-amber-700 transition hover:bg-amber-100">
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

          {/* Pending (not yet submitted) */}
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
          <button onClick={onClose}
            className="w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CONTRACT VIEW MODAL
   ════════════════════════════════════════════════════════════════════ */
function ContractModal({ open, creator, campaign, onClose }: {
  open: boolean; creator: CreatorRow | null; campaign: Campaign; onClose: () => void
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

  if (!open || !creator) return null
  const cs = CONTRACT_STATUS[creator.contractStatus]

  const paymentDesc = creator.dealType === 'flat'
    ? `${fmt(creator.flatOwed)} flat fee`
    : creator.dealType === 'commission'
    ? `${creator.commissionRate}% affiliate commission`
    : `${fmt(creator.flatOwed)} + ${creator.commissionRate}% commission`

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[520px] overflow-hidden rounded-3xl bg-white ${CARD}`} style={{ maxHeight: '88vh' }}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 ${GRAD_BTN}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20"><FileIcon s={16}/></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/65">Contract</p>
              <p className="text-[15px] font-extrabold text-white">{creator.contractId}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white transition hover:bg-white/30"><XIcon s={13}/></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: 'calc(88vh - 120px)' }}>
          {/* Status */}
          <div className="mb-5 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-bold ${cs.bg} ${cs.text} border-current/20`}>{cs.label}</span>
            <button className="flex items-center gap-1.5 text-[12.5px] font-bold text-primary hover:underline"><DownloadIcon s={12}/>Download PDF</button>
          </div>

          {/* Contract body */}
          <div className="space-y-0 rounded-2xl border border-ink/10 divide-y divide-ink/8 overflow-hidden">
            <div className="bg-surface-sub/60 px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/35">Creator Partnership Agreement</p>
              <p className="mt-0.5 text-[15px] font-extrabold text-ink">{campaign.title}</p>
            </div>
            {[
              ['Parties',        `Kinetics SIA and ${creator.name} (${creator.handle})`],
              ['Campaign',       campaign.title],
              ['Objective',      campaign.objective],
              ['Deliverables',   `${creator.piecesCommitted} piece${creator.piecesCommitted !== 1 ? 's' : ''} of content on ${creator.platform}`],
              ['Dates',          `${campaign.startDate} → ${campaign.endDate}`],
              ['Compensation',   paymentDesc],
              ['Usage rights',   '12 months, non-exclusive, digital only'],
              ['Exclusivity',    'No category exclusivity'],
              ['Late payment',   '1.5% per month after 30 days'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-6 px-5 py-3">
                <span className="flex-shrink-0 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink/35 pt-0.5">{label}</span>
                <span className="text-right text-[13px] font-semibold text-ink">{value}</span>
              </div>
            ))}
          </div>

          {/* Signature block */}
          <div className="mt-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"><Check s={10}/></span>
              <p className="text-[12.5px] font-extrabold text-emerald-800">Signed by both parties</p>
            </div>
            <p className="text-[12px] text-emerald-700">Harshul Gupta, Founder · Kinetics SIA</p>
            <p className="text-[12px] text-emerald-700">{creator.name} · {creator.handle}</p>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-primary/10 px-6 py-4">
          <button onClick={onClose}
            className="w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CAMPAIGN TIMELINE CARD
   ════════════════════════════════════════════════════════════════════ */
function TimelineCard({ campaign }: { campaign: Campaign }) {
  /* Calculate progress — mock: 19 of 30 days in */
  const totalDays = 30, elapsed = 19
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
        {/* Today marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-ink/50 rounded-full" style={{ left: `${pct}%` }}/>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11.5px]">
        <span className="font-semibold text-primary">{elapsed} days elapsed</span>
        <span className="text-ink/40">{totalDays - elapsed} days remaining</span>
      </div>
      {/* Milestones */}
      <div className="mt-4 space-y-2.5">
        {[
          { label: 'Brief sent & contracts signed', done: true,  date: 'Jun 1'  },
          { label: 'First content submissions',     done: true,  date: 'Jun 8'  },
          { label: 'Mid-campaign review',           done: true,  date: 'Jun 15' },
          { label: 'Final content deadline',        done: false, date: 'Jun 26' },
          { label: 'Campaign close & payouts',      done: false, date: 'Jun 30' },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-2.5">
            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${m.done ? `${GRAD_BTN} text-white` : 'border-2 border-primary/20 bg-white'}`}>
              {m.done && <Check s={9}/>}
            </span>
            <span className={`flex-1 text-[12px] font-semibold ${m.done ? 'text-ink/60' : 'text-ink/80'}`}>{m.label}</span>
            <span className="text-[11px] text-ink/35">{m.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAYMENT SUMMARY CARD
   ════════════════════════════════════════════════════════════════════ */
function PaymentSummaryCard({ creators, router }: { creators: CreatorRow[]; router: ReturnType<typeof useRouter> }) {
  const totalFlat      = creators.reduce((s, c) => s + c.flatOwed, 0)
  const totalFlatPaid  = creators.reduce((s, c) => s + c.flatPaid, 0)
  const totalComm      = creators.reduce((s, c) => s + c.estimatedCommission, 0)
  const totalCommPaid  = creators.reduce((s, c) => s + c.commissionPaid, 0)
  const platform       = 228   /* Nexfluence 12% platform fee */
  const totalPaid      = totalFlatPaid + totalCommPaid + platform
  const outstanding    = (totalFlat - totalFlatPaid) + (totalComm - totalCommPaid)
  const overdue        = creators.filter(c => c.paymentStatus === 'overdue').reduce((s, c) => s + (c.flatOwed - c.flatPaid), 0)

  return (
    <div className={`rounded-2xl border border-primary/10 bg-white overflow-hidden ${CARD}`}>
      <div className="border-b border-primary/8 px-5 py-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><EuroIcon s={15}/></span>
        <h3 className="text-[13.5px] font-extrabold text-ink">Payment summary</h3>
      </div>
      <div className="divide-y divide-primary/6">
        {[
          { label: 'Flat fees total',      value: fmt(totalFlat),     sub: `${fmt(totalFlatPaid)} paid`,       ok: totalFlatPaid >= totalFlat },
          { label: 'Commission (est.)',     value: fmt(totalComm),     sub: `${fmt(totalCommPaid)} paid`,       ok: totalCommPaid >= totalComm },
          { label: 'Platform fee (12%)',    value: fmt(platform),      sub: 'Paid',                             ok: true                        },
          { label: 'Total paid',           value: fmt(totalPaid),     sub: 'This campaign',                    ok: true,  bold: true           },
          { label: 'Outstanding',          value: fmt(outstanding),   sub: `${fmt(overdue)} overdue`,          ok: outstanding === 0           },
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
      <div className="px-5 py-4">
        <button onClick={() => router.push('/payments')}
          className={`flex w-full items-center justify-center gap-2 rounded-xl ${GRAD_BTN} py-3 text-[13px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
          <EuroIcon s={14}/>Go to Payments
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CREATOR ROSTER ROW
   ════════════════════════════════════════════════════════════════════ */
function CreatorRosterRow({ creator, onReview, onContract, onMessage }: {
  creator: CreatorRow
  onReview: () => void
  onContract: () => void
  onMessage: () => void
}) {
  const cs  = CONTENT_STATUS
  const ps  = PAYMENT_STATUS[creator.paymentStatus]
  const cst = CONTRACT_STATUS[creator.contractStatus]

  const pendingReview = creator.content.filter(p => p.status === 'submitted').length
  const totalOwed     = creator.flatOwed + creator.estimatedCommission
  const totalPaid     = creator.flatPaid + creator.commissionPaid
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`border-b border-primary/6 last:border-0 transition-colors ${expanded ? 'bg-primary/[0.015]' : 'hover:bg-primary/[0.02]'}`}>
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
              <img src={creator.platformIcon} alt="" className="h-3 w-3 object-contain opacity-60"/> {/* eslint-disable-line @next/next/no-img-element */}
              <span className="text-[11px] text-ink/40">{creator.followers}</span>
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

        {/* Payment */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/35 mb-1">Payment</p>
          <p className="text-[13px] font-extrabold text-ink">{totalOwed === 0 ? 'Commission' : fmt(totalOwed)}</p>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${ps.bg} ${ps.text}`}>
            {ps.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button onClick={onReview}
            className={`relative flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.06] ${pendingReview > 0 ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : ''}`}>
            <EyeIcon s={13}/>Review
            {pendingReview > 0 && (
              <span className="flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white">{pendingReview}</span>
            )}
          </button>
          <button onClick={onContract}
            className="flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3 py-2 text-[12px] font-bold text-ink/60 transition hover:bg-primary/[0.05] hover:text-primary">
            <FileIcon s={13}/>Contract
          </button>
          <button onClick={onMessage}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/15 bg-white text-ink/40 transition hover:bg-primary/[0.05] hover:text-primary">
            <ChatIcon s={13}/>
          </button>
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
              const s = cs[piece.status]
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
export default function CampaignTrackerPage() {
  const router = useRouter()
  const params = useParams()

  /* In real app: fetch campaign by params.id. Here we use the mock. */
  const [campaign, setCampaign] = useState<Campaign>(CAMPAIGN_DATA)

  /* Modals */
  const [reviewCreator,   setReviewCreator]   = useState<CreatorRow | null>(null)
  const [contractCreator, setContractCreator] = useState<CreatorRow | null>(null)

  /* Handle content approval/revision */
  const handleContentAction = (creatorId: string, pieceId: string, action: 'approve' | 'revision') => {
    setCampaign(prev => ({
      ...prev,
      creators: prev.creators.map(c => {
        if (c.id !== creatorId) return c
        const updated = c.content.map(p =>
          p.id !== pieceId ? p : { ...p, status: action === 'approve' ? 'approved' as ContentStatus : 'revision_requested' as ContentStatus }
        )
        const approved  = updated.filter(p => p.status === 'approved').length
        const submitted = updated.filter(p => p.status === 'submitted').length
        return { ...c, content: updated, piecesApproved: approved, piecesSubmitted: approved + submitted }
      }),
    }))
    /* Update the modal's creator reference too */
    setReviewCreator(prev => {
      if (!prev || prev.id !== creatorId) return prev
      const updated = prev.content.map(p =>
        p.id !== pieceId ? p : { ...p, status: action === 'approve' ? 'approved' as ContentStatus : 'revision_requested' as ContentStatus }
      )
      return { ...prev, content: updated, piecesApproved: updated.filter(p => p.status === 'approved').length }
    })
  }

  /* Summary numbers */
  const allPieces     = campaign.creators.reduce((s, c) => s + c.piecesCommitted, 0)
  const submitted     = campaign.creators.reduce((s, c) => s + c.piecesSubmitted, 0)
  const approved      = campaign.creators.reduce((s, c) => s + c.piecesApproved, 0)
  const pendingReview = campaign.creators.reduce((s, c) => s + c.content.filter(p => p.status === 'submitted').length, 0)

  /* Campaign status config */
  const statusCfg: Record<CampaignStatus, { label: string; bg: string; text: string; dot: string }> = {
    active:    { label: 'Active',     bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
    review:    { label: 'In review',  bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
    completed: { label: 'Completed',  bg: 'bg-surface-sub', text: 'text-ink/50',      dot: 'bg-ink/25'      },
    paused:    { label: 'Paused',     bg: 'bg-rose-50',     text: 'text-rose-500',    dot: 'bg-rose-400'    },
  }
  const sc = statusCfg[campaign.status]

  /* Nav */
  const NAV_LEFT  = [
    { label: 'Dashboard',  active: false, action: () => router.push('/dashboard/brand') },
    { label: 'Campaigns',  active: true,  action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'Messages',   active: false, action: () => router.push('/messages') },
    { label: 'My Profile', active: false, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ CONTENT REVIEW MODAL ════ */}
      <ContentReviewModal
        open={reviewCreator !== null}
        creator={reviewCreator}
        onClose={() => setReviewCreator(null)}
        onAction={handleContentAction}
      />

      {/* ════ CONTRACT MODAL ════ */}
      <ContractModal
        open={contractCreator !== null}
        creator={contractCreator}
        campaign={campaign}
        onClose={() => setContractCreator(null)}
      />

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg,rgba(139,49,232,0.05) 0%,rgba(139,49,232,0.05) 30%,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 58%,rgba(139,49,232,0.05) 70%,rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_RIGHT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
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

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-6 py-8">

        {/* ── Campaign header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <button onClick={() => router.push('/dashboard/brand')}
              className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary">
              <ChevLeft s={14}/>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-[clamp(20px,2.8vw,26px)] font-black tracking-[-0.03em] text-ink">{campaign.title}</h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold ${sc.bg} ${sc.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-ink/50">
                <span className="flex items-center gap-1.5"><CalIcon s={12}/>{campaign.startDate} → {campaign.endDate}</span>
                <span className="text-ink/25">·</span>
                <span className="rounded-lg bg-violet-50 px-2 py-0.5 text-[11.5px] font-bold text-violet-700">{campaign.objective}</span>
                <span className="text-ink/25">·</span>
                <span className="flex items-center gap-1"><UsersIcon s={12}/>{campaign.creators.length} creators</span>
                <span className="text-ink/25">·</span>
                <span>{campaign.budget} budget</span>
              </div>
            </div>
          </div>
          {/* Quick actions */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <button onClick={() => router.push('/messages')}
              className="flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-ink/60 transition hover:text-primary hover:border-primary/30">
              <SendIcon s={13}/>Message all
            </button>
            <button className="flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-ink/60 transition hover:text-primary hover:border-primary/30">
              <DownloadIcon s={13}/>Export
            </button>
          </div>
        </div>

        {/* ── Content pipeline stat cards ── */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { icon: <ImageIcon s={17}/>,  label: 'Total pieces',      value: String(allPieces),     sub: 'Across all creators',             accent: false },
            { icon: <UsersIcon s={17}/>,  label: 'Submitted',         value: String(submitted),     sub: `${allPieces - submitted} pending`, accent: false },
            { icon: <Check s={17}/>,      label: 'Approved',          value: String(approved),      sub: `${submitted - approved > 0 ? `${submitted - approved} awaiting review` : 'All reviewed'}`, accent: approved === allPieces },
            { icon: <EuroIcon s={17}/>,   label: 'Pending review',    value: String(pendingReview), sub: pendingReview > 0 ? 'Action needed' : 'All clear', accent: false },
          ].map(card => (
            <div key={card.label} className={`flex flex-col justify-between rounded-2xl border p-5 ${card.accent ? `${GRAD_BTN} border-transparent shadow-[0_8px_24px_-8px_rgba(139,49,232,0.45)]` : `border-primary/10 bg-white ${CARD}`}`}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accent ? 'bg-white/20 text-white' : 'bg-primary/[0.08] text-primary'}`}>{card.icon}</span>
              <div className="mt-4">
                <p className={`text-[26px] font-black tracking-[-0.04em] ${card.accent ? 'text-white' : 'text-ink'}`}>{card.value}</p>
                <p className={`mt-0.5 text-[12px] font-semibold ${card.accent ? 'text-white/70' : 'text-ink/45'}`}>{card.label}</p>
                <p className={`mt-0.5 text-[11px] ${card.accent ? 'text-white/50' : 'text-ink/30'}`}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main two-column layout ── */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── LEFT: Creator roster ── */}
          <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white lg:flex-1 ${CARD}`}>
            <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
              <h2 className="text-[14px] font-extrabold text-ink">Creator roster</h2>
              <p className="text-[12px] text-ink/40">{campaign.creators.length} creators · click row to expand pieces</p>
            </div>
            {/* Table header */}
            <div className="grid border-b border-primary/6 bg-surface-sub/60 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-ink/30"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
              <span>Creator</span>
              <span>Content</span>
              <span>Performance</span>
              <span>Payment</span>
              <span>Actions</span>
            </div>
            {/* Rows */}
            {campaign.creators.map(creator => (
              <CreatorRosterRow
                key={creator.id}
                creator={creator}
                onReview={() => setReviewCreator(creator)}
                onContract={() => setContractCreator(creator)}
                onMessage={() => router.push('/messages')}
              />
            ))}
          </div>

          {/* ── RIGHT: Timeline + Payment ── */}
          <div className="flex w-full flex-col gap-4 lg:w-[280px] lg:flex-shrink-0">
            <TimelineCard campaign={campaign}/>
            <PaymentSummaryCard creators={campaign.creators} router={router}/>
          </div>

        </div>

        {/* ── Campaign brief snippet ── */}
        <div className={`mt-6 flex gap-4 rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} shadow-[0_4px_12px_-4px_rgba(139,49,232,0.40)] text-white`}>
            <ZapIcon s={16}/>
          </div>
          <div>
            <p className="text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-ink/40 mb-1">Campaign brief</p>
            <p className="text-[13.5px] leading-[1.7] text-ink/65">{campaign.brief}</p>
          </div>
        </div>

      </main>
    </div>
  )
}