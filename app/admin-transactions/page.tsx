'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Admin Transactions Dashboard — app/admin/transactions/page.tsx
   Nexfluence v4, LIGHT · dark sidebar variant (matches admin shell)

   THE CORE MECHANIC — MANUAL TRANSACTION AUTHORISATION:
   ─────────────────────────────────────────────────────────────────
   In early-stage marketplace operations, every payment that Grade
   initiates hits a holding state before it executes. The admin
   must physically click "Authorise" before any real money moves.
   This is a startup's safeguard: before you have battle-tested
   fraud detection, automated KYC matching, and dispute-rate
   benchmarks, the founder's own eyes are the last line of defence.

   When your fraud rate drops below 0.5%, your DAC7 compliance is
   fully automated, and your monthly volume exceeds €500K, you flip
   the global switch and transactions self-authorise. Until then:
   every payment queues here.

   FOUR STATES A TRANSACTION MOVES THROUGH:
     pending_auth  → Admin has not yet reviewed. Cannot proceed.
     approved      → Admin clicked Authorise. Grade releases to escrow.
     rejected      → Admin blocked it. Grade returns funds to payer.
     released      → Escrow released to recipient (post-delivery confirm).

   TWO GLOBAL CONTROLS (top of page):
     1. Auto-authorise toggle — OFF by default. When flipped ON,
        NEW transactions skip the queue and go straight to approved.
        Existing pending_auth items stay in the queue.
     2. Daily limit — admin sets a per-day volume ceiling. Any
        single transaction above this threshold always requires
        manual review, even when auto-authorise is ON. Protects
        against large fraud even after you scale.

   TRANSACTION TABLE:
     Filterable by: status · type · persona · date range
     Sortable by:   amount · date · status
     Row actions:   Authorise · Reject · View detail (modal)
     Bulk actions:  Select multiple → Authorise all / Reject all

   TRANSACTION DETAIL MODAL:
     Full context: who sent, who receives, which campaign, which
     contract, Grade reference, DAC7 implications, risk signals
     (first transaction from this account? above average? unusual time?)

   RISK SIGNALS — automated flags shown alongside each row:
     🔴 CRIT:  Amount > 10× account average · First ever transaction
               from this account · Account < 7 days old
     🟡 WARN:  Amount 3–10× average · Account flagged in disputes ·
               KYC not verified
     🟢 INFO:  All clear, within normal range
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ─── Types ──────────────────────────────────────────────────────── */
type TxStatus    = 'pending_auth' | 'approved' | 'rejected' | 'released'
type TxType      = 'escrow_deposit' | 'creator_payout' | 'agency_fee' | 'retainer' | 'refund' | 'withdrawal'
type TxPersona   = 'brand' | 'creator' | 'agency'
type RiskLevel   = 'crit' | 'warn' | 'ok'

interface RiskFlag { level: RiskLevel; label: string }

interface Transaction {
  id: string
  gradeRef: string
  type: TxType
  status: TxStatus
  amount: number
  currency: string
  fromName: string
  fromType: TxPersona
  toName: string
  toType: TxPersona | 'platform'
  campaignName: string | null
  contractId: string | null
  createdAt: string       // ISO-ish display string
  authorisedAt: string | null
  authorisedBy: string | null
  risk: RiskFlag[]
  note: string | null
}

/* ─── Transaction mock data ──────────────────────────────────────── */
const RAW_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx001', gradeRef: 'GRD-PAY-2026-8821',
    type: 'escrow_deposit', status: 'pending_auth',
    amount: 2600, currency: 'EUR',
    fromName: 'Kinetics', fromType: 'brand',
    toName: 'Grade Escrow', toType: 'platform',
    campaignName: 'Electrolyte Hot Yoga', contractId: 'CTR-AC1-001',
    createdAt: 'Jul 2, 2026 · 09:14', authorisedAt: null, authorisedBy: null,
    risk: [{ level: 'warn', label: 'Largest single deposit from this brand' }],
    note: null,
  },
  {
    id: 'tx002', gradeRef: 'GRD-PAY-2026-8815',
    type: 'creator_payout', status: 'pending_auth',
    amount: 420, currency: 'EUR',
    fromName: 'Grade Escrow', fromType: 'platform' as TxPersona,
    toName: 'Amelia Roze', toType: 'creator',
    campaignName: 'Electrolyte Hot Yoga', contractId: 'CTR-AC1-001',
    createdAt: 'Jul 2, 2026 · 08:52', authorisedAt: null, authorisedBy: null,
    risk: [{ level: 'ok', label: 'Within normal range' }],
    note: 'Content approved Jun 30. Release triggered by admin.',
  },
  {
    id: 'tx003', gradeRef: 'GRD-PAY-2026-8812',
    type: 'escrow_deposit', status: 'pending_auth',
    amount: 4200, currency: 'EUR',
    fromName: 'Lumora Skincare', fromType: 'brand',
    toName: 'Grade Escrow', toType: 'platform',
    campaignName: 'Morning Ritual Launch', contractId: 'CTR-LS-009',
    createdAt: 'Jul 2, 2026 · 07:33', authorisedAt: null, authorisedBy: null,
    risk: [
      { level: 'crit', label: "10\u00d7 above this account's average deposit" },
      { level: 'warn', label: 'KYC last verified >60 days ago' },
    ],
    note: null,
  },
  {
    id: 'tx004', gradeRef: 'GRD-PAY-2026-8808',
    type: 'agency_fee', status: 'pending_auth',
    amount: 390, currency: 'EUR',
    fromName: 'Grade Escrow', fromType: 'platform' as TxPersona,
    toName: 'Baltic Creators Agency', toType: 'agency',
    campaignName: 'Electrolyte Hot Yoga', contractId: 'CTR-AC1-001',
    createdAt: 'Jul 2, 2026 · 08:52', authorisedAt: null, authorisedBy: null,
    risk: [{ level: 'ok', label: 'Standard 15% agency fee' }],
    note: '15% of €2,600 campaign budget',
  },
  {
    id: 'tx005', gradeRef: 'GRD-PAY-2026-8801',
    type: 'retainer', status: 'pending_auth',
    amount: 1200, currency: 'EUR',
    fromName: 'Kinetics', fromType: 'brand',
    toName: 'Baltic Creators Agency', toType: 'agency',
    campaignName: null, contractId: 'MGT-2026-001',
    createdAt: 'Jul 1, 2026 · 23:58', authorisedAt: null, authorisedBy: null,
    risk: [{ level: 'ok', label: 'Recurring monthly retainer — 6th in sequence' }],
    note: 'July 2026 management retainer.',
  },
  {
    id: 'tx006', gradeRef: 'GRD-PAY-2026-8796',
    type: 'withdrawal', status: 'pending_auth',
    amount: 1840, currency: 'EUR',
    fromName: 'Baltic Creators Agency', fromType: 'agency',
    toName: 'Luminance Agency SIA (bank)', toType: 'platform',
    campaignName: null, contractId: null,
    createdAt: 'Jul 1, 2026 · 18:22', authorisedAt: null, authorisedBy: null,
    risk: [{ level: 'warn', label: 'First withdrawal from this bank account' }],
    note: null,
  },
  {
    id: 'tx007', gradeRef: 'GRD-PAY-2026-8789',
    type: 'creator_payout', status: 'pending_auth',
    amount: 280, currency: 'EUR',
    fromName: 'Grade Escrow', fromType: 'platform' as TxPersona,
    toName: 'Markus Tamm', toType: 'creator',
    campaignName: 'Race Day Recovery', contractId: 'CTR-RDR-002',
    createdAt: 'Jul 1, 2026 · 16:05', authorisedAt: null, authorisedBy: null,
    risk: [
      { level: 'crit', label: "Creator account < 7 days old" },
      { level: 'warn', label: 'KYC document pending' },
    ],
    note: null,
  },
  {
    id: 'tx008', gradeRef: 'GRD-PAY-2026-8782',
    type: 'refund', status: 'pending_auth',
    amount: 950, currency: 'EUR',
    fromName: 'Grade Escrow', fromType: 'platform' as TxPersona,
    toName: 'Forma Fit', toType: 'brand',
    campaignName: 'Training Block Q3', contractId: 'CTR-FF-004',
    createdAt: 'Jul 1, 2026 · 12:41', authorisedAt: null, authorisedBy: null,
    risk: [{ level: 'warn', label: 'Linked to an open dispute ticket' }],
    note: 'Campaign cancelled. Escrow refund to brand per dispute resolution TKT-2026-0040.',
  },
  /* ── ALREADY PROCESSED ── */
  {
    id: 'tx009', gradeRef: 'GRD-PAY-2026-8774',
    type: 'creator_payout', status: 'approved',
    amount: 350, currency: 'EUR',
    fromName: 'Grade Escrow', fromType: 'platform' as TxPersona,
    toName: 'Sandra Liepa', toType: 'creator',
    campaignName: 'Morning Ritual — Vitamin C', contractId: 'CTR-LS-008',
    createdAt: 'Jun 30, 2026 · 14:18', authorisedAt: 'Jun 30, 2026 · 14:31', authorisedBy: 'Harshul G.',
    risk: [{ level: 'ok', label: 'Within normal range' }],
    note: null,
  },
  {
    id: 'tx010', gradeRef: 'GRD-PAY-2026-8768',
    type: 'escrow_deposit', status: 'released',
    amount: 1800, currency: 'EUR',
    fromName: 'Forma Fit', fromType: 'brand',
    toName: 'Grade Escrow', toType: 'platform',
    campaignName: 'Race Day Recovery', contractId: 'CTR-RDR-001',
    createdAt: 'Jun 29, 2026 · 11:02', authorisedAt: 'Jun 29, 2026 · 11:15', authorisedBy: 'Harshul G.',
    risk: [{ level: 'ok', label: 'Within normal range' }],
    note: null,
  },
  {
    id: 'tx011', gradeRef: 'GRD-PAY-2026-8761',
    type: 'creator_payout', status: 'rejected',
    amount: 8500, currency: 'EUR',
    fromName: 'Grade Escrow', fromType: 'platform' as TxPersona,
    toName: 'Unknown Creator', toType: 'creator',
    campaignName: null, contractId: null,
    createdAt: 'Jun 28, 2026 · 22:47', authorisedAt: 'Jun 28, 2026 · 23:02', authorisedBy: 'Harshul G.',
    risk: [
      { level: 'crit', label: 'No campaign or contract linked' },
      { level: 'crit', label: 'Amount 40× above account average' },
      { level: 'crit', label: 'Account registered 2 days ago' },
    ],
    note: 'REJECTED: Suspected synthetic account. Account suspended. Grade funds returned to payer.',
  },
  {
    id: 'tx012', gradeRef: 'GRD-PAY-2026-8755',
    type: 'agency_fee', status: 'released',
    amount: 270, currency: 'EUR',
    fromName: 'Grade Escrow', fromType: 'platform' as TxPersona,
    toName: 'Baltic Creators Agency', toType: 'agency',
    campaignName: 'Morning Ritual — Vitamin C', contractId: 'CTR-LS-008',
    createdAt: 'Jun 30, 2026 · 14:18', authorisedAt: 'Jun 30, 2026 · 14:31', authorisedBy: 'Harshul G.',
    risk: [{ level: 'ok', label: 'Standard 15% agency fee' }],
    note: null,
  },
]

/* ─── Filter / sort state ────────────────────────────────────────── */
type StatusFilter = 'all' | TxStatus
type TypeFilter   = 'all' | TxType
type SortField    = 'createdAt' | 'amount' | 'status'
type SortDir      = 'asc' | 'desc'

const STATUS_LABELS: Record<TxStatus, string> = {
  pending_auth: 'Pending auth',
  approved:     'Approved',
  rejected:     'Rejected',
  released:     'Released',
}
const TYPE_LABELS: Record<TxType, string> = {
  escrow_deposit: 'Escrow deposit',
  creator_payout: 'Creator payout',
  agency_fee:     'Agency fee',
  retainer:       'Retainer',
  refund:         'Refund',
  withdrawal:     'Withdrawal',
}

/* ─── Daily limit default ─────────────────────────────────────────── */
const DEFAULT_DAILY_LIMIT = 5000   /* EUR */

/* ════════════════════════════════════════════════════════════════════
   ICONS — inline SVG only
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function CheckIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 14 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function ChevDown({ s = 12 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChevRight({ s = 13 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 18 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ClockIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function AlertIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function ShieldIcon({ s = 18 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ZapIcon({ s = 18 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 18 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function DashIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> }
function UsersIcon({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 21v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ActivityIcon({ s = 16 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LogoutIcon({ s = 15 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function FilterIcon({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SearchIcon({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function TrendUpIcon({ s = 11 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function InfoIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function ExternalIcon({ s = 11 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SettingsIcon({ s = 14 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   STATUS + TYPE CONFIG
   ════════════════════════════════════════════════════════════════════ */
const STATUS_CFG: Record<TxStatus, { bg: string; text: string; dot: string; label: string }> = {
  pending_auth: { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pending auth'  },
  approved:     { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400', label: 'Approved'      },
  rejected:     { bg: 'bg-rose-50',     text: 'text-rose-600',    dot: 'bg-rose-500',    label: 'Rejected'      },
  released:     { bg: 'bg-primary/[0.07]', text: 'text-primary',  dot: 'bg-primary',     label: 'Released'      },
}

const TYPE_CFG: Record<TxType, { bg: string; text: string; label: string }> = {
  escrow_deposit: { bg: 'bg-blue-50',       text: 'text-blue-700',    label: 'Escrow deposit' },
  creator_payout: { bg: 'bg-violet-50',     text: 'text-violet-700',  label: 'Creator payout' },
  agency_fee:     { bg: 'bg-emerald-50',    text: 'text-emerald-700', label: 'Agency fee'     },
  retainer:       { bg: 'bg-teal-50',       text: 'text-teal-700',    label: 'Retainer'       },
  refund:         { bg: 'bg-orange-50',     text: 'text-orange-700',  label: 'Refund'         },
  withdrawal:     { bg: 'bg-slate-100',     text: 'text-slate-700',   label: 'Withdrawal'     },
}

const RISK_CFG: Record<RiskLevel, { dot: string; text: string; bg: string }> = {
  crit: { dot: 'bg-rose-500',   text: 'text-rose-600',   bg: 'bg-rose-50'   },
  warn: { dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50'  },
  ok:   { dot: 'bg-emerald-400',text: 'text-emerald-700',bg: 'bg-emerald-50' },
}

/* ─── Highest risk level across flags ────────────────────────────── */
function topRisk(flags: RiskFlag[]): RiskLevel {
  if (flags.some(f => f.level === 'crit')) return 'crit'
  if (flags.some(f => f.level === 'warn')) return 'warn'
  return 'ok'
}

/* ════════════════════════════════════════════════════════════════════
   TOGGLE SWITCH — for the auto-authorise global control
   ════════════════════════════════════════════════════════════════════ */
function Toggle({ on, onChange, disabled = false }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => !disabled && onChange(!on)}
      className={`relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${on ? GRAD_BTN : 'bg-ink/15'} ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
      <span className={`inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-5.5' : ''}`}
        style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)' }}/>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   KPI STAT CARD — compact variant for the transactions strip
   ════════════════════════════════════════════════════════════════════ */
function TxKPICard({ icon, label, value, sub, delta, deltaUp, accent = false }: {
  icon: ReactNode; label: string; value: string; sub?: string
  delta?: string; deltaUp?: boolean; accent?: boolean
}) {
  return (
    <div className={`flex flex-col gap-3.5 rounded-2xl border p-5 ${accent ? `${GRAD_BTN} border-transparent text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]` : `border-primary/10 bg-white ${CARD}`}`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent ? 'bg-white/20 text-white' : 'bg-primary/[0.08] text-primary'}`}>{icon}</div>
        {delta && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${accent ? 'bg-white/20 text-white' : deltaUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <TrendUpIcon s={10}/>{delta}
          </span>
        )}
      </div>
      <div>
        <div className={`text-[26px] font-black tracking-[-0.03em] ${accent ? 'text-white' : 'text-ink'}`}>{value}</div>
        <div className={`mt-0.5 text-[12px] font-semibold ${accent ? 'text-white/70' : 'text-ink/50'}`}>{label}</div>
        {sub && <div className={`mt-0.5 text-[11px] ${accent ? 'text-white/50' : 'text-ink/35'}`}>{sub}</div>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   RISK BADGE CHIP
   ════════════════════════════════════════════════════════════════════ */
function RiskBadge({ flags }: { flags: RiskFlag[] }) {
  const top = topRisk(flags)
  const cfg = RISK_CFG[top]
  if (top === 'ok') return <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${cfg.bg} ${cfg.text}`}><CheckIcon s={10}/></span>
  return (
    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}/>
      {top === 'crit' ? 'High risk' : 'Review'}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CONFIRM MODAL — for authorise/reject with optional note
   ════════════════════════════════════════════════════════════════════ */
function ConfirmModal({ open, mode, tx, onConfirm, onClose }: {
  open: boolean; mode: 'approve' | 'reject' | 'bulk_approve' | 'bulk_reject'
  tx: Transaction | null; count?: number
  onConfirm: (note: string) => void; onClose: () => void
}) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) { setNote(''); setLoading(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [open, onClose])

  if (!open) return null

  const isApprove = mode === 'approve' || mode === 'bulk_approve'
  const isBulk    = mode === 'bulk_approve' || mode === 'bulk_reject'

  const handleConfirm = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    setLoading(false)
    onConfirm(note.trim())
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl bg-white ${CARD}`}>

        {/* Coloured top stripe */}
        <div className={`h-1.5 w-full ${isApprove ? GRAD_BTN : 'bg-rose-500'}`}/>

        <div className="px-7 py-6">
          {/* Header */}
          <div className="mb-5 flex items-start gap-4">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${isApprove ? GRAD_BTN + ' shadow-[0_8px_20px_-6px_rgba(139,49,232,0.45)]' : 'bg-rose-500 shadow-[0_8px_20px_-6px_rgba(239,68,68,0.4)]'}`}>
              {isApprove ? <CheckIcon s={22}/> : <XIcon s={22}/>}
            </div>
            <div>
              <h3 className="text-[18px] font-extrabold tracking-[-0.02em] text-ink">
                {isApprove ? 'Authorise transaction' : 'Reject transaction'}
                {isBulk ? 's' : ''}
              </h3>
              {tx && !isBulk && (
                <p className="mt-0.5 text-[12.5px] text-ink/50">
                  {tx.gradeRef} · <span className="font-bold text-ink">€{tx.amount.toLocaleString()}</span>
                </p>
              )}
            </div>
          </div>

          {/* Transaction summary if single */}
          {tx && !isBulk && (
            <div className="mb-4 rounded-xl border border-primary/10 bg-surface-sub px-4 py-3 space-y-1.5">
              {[
                { label: 'From',     value: tx.fromName       },
                { label: 'To',       value: tx.toName         },
                { label: 'Type',     value: TYPE_LABELS[tx.type] },
                { label: 'Amount',   value: `€${tx.amount.toLocaleString()}` },
                ...(tx.campaignName ? [{ label: 'Campaign', value: tx.campaignName }] : []),
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between gap-4">
                  <span className="text-[11.5px] font-semibold text-ink/40">{r.label}</span>
                  <span className="text-[12.5px] font-bold text-ink">{r.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Risk flags — show for approve so admin acknowledges */}
          {tx && isApprove && topRisk(tx.risk) !== 'ok' && (
            <div className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${topRisk(tx.risk) === 'crit' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
              <AlertIcon s={15}/>
              <div>
                <p className={`text-[12px] font-bold ${topRisk(tx.risk) === 'crit' ? 'text-rose-700' : 'text-amber-700'} mb-1`}>
                  {topRisk(tx.risk) === 'crit' ? 'High-risk transaction' : 'Flags to review'}
                </p>
                {tx.risk.filter(f => f.level !== 'ok').map((f, i) => (
                  <p key={i} className={`text-[11.5px] ${topRisk(tx.risk) === 'crit' ? 'text-rose-600' : 'text-amber-600'}`}>· {f.label}</p>
                ))}
              </div>
            </div>
          )}

          {/* Note field */}
          <div className="mb-5">
            <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40">
              {isApprove ? 'Note (optional)' : 'Reason for rejection *'}
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder={isApprove ? 'Any authorisation notes or conditions…' : 'Why is this being rejected? This is logged and visible to the Grade audit trail.'}
              className="w-full resize-none rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[13.5px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]"/>
          </div>

          {/* CTA */}
          <div className="flex gap-2.5">
            <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">
              Cancel
            </button>
            <button onClick={handleConfirm}
              disabled={loading || (!isApprove && !note.trim())}
              className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${
                !loading && (isApprove || note.trim())
                  ? isApprove
                    ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`
                    : 'bg-rose-500 shadow-[0_8px_24px_-6px_rgba(239,68,68,0.4)] hover:-translate-y-0.5'
                  : 'cursor-not-allowed bg-ink/10 text-ink/30'
              }`}>
              {loading
                ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Processing…</>
                : isApprove ? <><CheckIcon s={14}/>Authorise & release</> : <><XIcon s={14}/>Reject transaction</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TRANSACTION DETAIL MODAL
   Full audit context: parties, Grade ref, risk breakdown, timeline
   ════════════════════════════════════════════════════════════════════ */
function DetailModal({ tx, onClose, onApprove, onReject }: {
  tx: Transaction | null; onClose: () => void
  onApprove: (tx: Transaction) => void; onReject: (tx: Transaction) => void
}) {
  const open = tx !== null
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!tx) return null
  const sc  = STATUS_CFG[tx.status]
  const tc  = TYPE_CFG[tx.type]
  const top = topRisk(tx.risk)

  function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
      <div className="flex items-start justify-between gap-6 border-b border-primary/6 py-2.5 last:border-0">
        <span className="flex-shrink-0 text-[12px] font-semibold text-ink/40">{label}</span>
        <span className={`text-right text-[12.5px] font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[580px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(92vh, 760px)' }}>

        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-primary/10 px-6 py-5">
          <div>
            <p className="text-[10.5px] font-black uppercase tracking-[0.18em] text-ink/35">Transaction detail</p>
            <h3 className="mt-0.5 text-[17px] font-extrabold tracking-[-0.02em] text-ink">{tx.gradeRef}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
              </span>
              <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${tc.bg} ${tc.text}`}>{tc.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10">
            <XIcon s={14}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Amount hero */}
          <div className={`flex items-center justify-between rounded-2xl p-5 ${GRAD_BTN}`}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Amount</p>
              <p className="text-[32px] font-black tracking-[-0.04em] text-white">€{tx.amount.toLocaleString()}</p>
              <p className="text-[12px] text-white/55">{tx.currency} · via Grade escrow</p>
            </div>
            <div className="text-white/30"><EuroIcon s={40}/></div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { role: 'From', name: tx.fromName, type: tx.fromType },
              { role: 'To',   name: tx.toName,   type: tx.toType   },
            ].map(p => (
              <div key={p.role} className="rounded-2xl border border-primary/10 bg-surface-sub/50 p-4">
                <p className="mb-1.5 text-[10.5px] font-black uppercase tracking-[0.14em] text-ink/35">{p.role}</p>
                <p className="text-[14px] font-extrabold text-ink">{p.name}</p>
                <p className="text-[11.5px] text-ink/40 capitalize">{p.type}</p>
              </div>
            ))}
          </div>

          {/* Core fields */}
          <div className="rounded-2xl border border-primary/10 bg-white px-5 py-1">
            <Row label="Grade reference" value={tx.gradeRef} mono/>
            <Row label="Transaction type" value={TYPE_LABELS[tx.type]}/>
            {tx.campaignName && <Row label="Campaign" value={tx.campaignName}/>}
            {tx.contractId   && <Row label="Contract" value={tx.contractId} mono/>}
            <Row label="Created" value={tx.createdAt}/>
            {tx.authorisedAt  && <Row label="Processed" value={tx.authorisedAt}/>}
            {tx.authorisedBy  && <Row label="Authorised by" value={tx.authorisedBy}/>}
            {tx.note          && <Row label="Note" value={tx.note}/>}
          </div>

          {/* Risk flags */}
          <div className={`rounded-2xl border p-4 space-y-2 ${top === 'crit' ? 'border-rose-200 bg-rose-50' : top === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.14em] ${top === 'crit' ? 'text-rose-700' : top === 'warn' ? 'text-amber-700' : 'text-emerald-700'}`}>
              Risk assessment
            </p>
            {tx.risk.map((f, i) => {
              const rc = RISK_CFG[f.level]
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${rc.dot}`}/>
                  <span className={`text-[12.5px] font-semibold ${rc.text}`}>{f.label}</span>
                </div>
              )
            })}
          </div>

          {/* DAC7 note */}
          <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/[0.03] px-4 py-3">
            <InfoIcon s={14}/>
            <p className="text-[12px] text-ink/55">
              {tx.toType === 'creator' && tx.amount > 0
                ? `This payout to ${tx.toName} will be reported to Grade for DAC7 income tracking.`
                : 'DAC7 reporting applies only to creator payout transactions.'
              }
            </p>
          </div>
        </div>

        {/* Action bar — only shown if pending */}
        {tx.status === 'pending_auth' && (
          <div className="flex flex-shrink-0 gap-3 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
            <button onClick={() => { onClose(); onReject(tx) }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-3 text-[13.5px] font-bold text-rose-600 transition hover:bg-rose-50">
              <XIcon s={13}/>Reject
            </button>
            <button onClick={() => { onClose(); onApprove(tx) }}
              className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN} shadow-[0_6px_18px_-6px_rgba(139,49,232,0.5)]`}>
              <CheckIcon s={14}/>Authorise & release
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SIMPLE DROPDOWN — for filter controls
   ════════════════════════════════════════════════════════════════════ */
function FilterDropdown<T extends string>({ value, options, onChange, label }: {
  value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cur = options.find(o => o.id === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] font-semibold transition ${open ? 'border-primary/30 bg-primary/[0.05] text-primary' : 'border-primary/12 bg-white text-ink/65 hover:border-primary/22'}`}>
        <span className="text-ink/35 text-[10.5px] font-bold uppercase tracking-[0.08em] hidden sm:inline">{label}:</span>
        {cur.label}
        <ChevDown s={11}/>
      </button>
      {open && (
        <div className={`absolute left-0 top-[calc(100%+6px)] z-30 min-w-[170px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
          {options.map(opt => (
            <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[12.5px] transition hover:bg-primary/[0.04] ${value === opt.id ? 'bg-primary/[0.06] font-bold text-primary' : 'text-ink/70'}`}>
              {opt.label}
              {value === opt.id && <span className={`flex h-4 w-4 items-center justify-center rounded-full text-white ${GRAD_BTN}`}><CheckIcon s={9}/></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function AdminTransactionsPage() {
  const router = useRouter()

  /* ── Local transaction state (starts from mock, mutated by actions) ── */
  const [txns, setTxns] = useState<Transaction[]>(RAW_TRANSACTIONS)

  /* ── Global controls ── */
  const [autoAuthorise,   setAutoAuthorise]   = useState(false)
  const [dailyLimit,      setDailyLimit]       = useState(DEFAULT_DAILY_LIMIT)
  const [editingLimit,    setEditingLimit]     = useState(false)
  const [limitInput,      setLimitInput]       = useState(String(DEFAULT_DAILY_LIMIT))

  /* ── Filters ── */
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('all')
  const [search,       setSearch]       = useState('')
  const [sortField,    setSortField]    = useState<SortField>('createdAt')
  const [sortDir,      setSortDir]      = useState<SortDir>('desc')

  /* ── Selection ── */
  const [selected,   setSelected]   = useState<Set<string>>(new Set())

  /* ── Modals ── */
  const [confirmTx,  setConfirmTx]  = useState<Transaction | null>(null)
  const [confirmMode,setConfirmMode]= useState<'approve' | 'reject' | 'bulk_approve' | 'bulk_reject'>('approve')
  const [detailTx,   setDetailTx]  = useState<Transaction | null>(null)
  const [toast,      setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  /* ── Toast ── */
  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  /* ── Derived pending queue ── */
  const pendingQueue = txns.filter(t => t.status === 'pending_auth')
  const pendingCount = pendingQueue.length
  const pendingValue = pendingQueue.reduce((s, t) => s + t.amount, 0)
  const critPending  = pendingQueue.filter(t => topRisk(t.risk) === 'crit').length

  /* ── KPI numbers ── */
  const totalVolume    = txns.filter(t => t.status !== 'rejected').reduce((s, t) => s + t.amount, 0)
  const todayVolume    = txns.filter(t => t.status !== 'rejected' && t.createdAt.includes('Jul 2')).reduce((s, t) => s + t.amount, 0)
  const totalCount     = txns.length
  const approvedCount  = txns.filter(t => t.status === 'approved' || t.status === 'released').length
  const rejectedCount  = txns.filter(t => t.status === 'rejected').length

  /* ── Filtered + sorted list ── */
  const visible = txns
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (typeFilter   !== 'all' && t.type   !== typeFilter)   return false
      if (search && !t.fromName.toLowerCase().includes(search.toLowerCase()) &&
                    !t.toName.toLowerCase().includes(search.toLowerCase()) &&
                    !t.gradeRef.toLowerCase().includes(search.toLowerCase()) &&
                    !(t.campaignName?.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
    .sort((a, b) => {
      if (sortField === 'amount')    return sortDir === 'desc' ? b.amount - a.amount : a.amount - b.amount
      if (sortField === 'status')    return sortDir === 'desc' ? b.status.localeCompare(a.status) : a.status.localeCompare(b.status)
      /* createdAt — sort by index in original array as proxy for time */
      const ai = RAW_TRANSACTIONS.findIndex(x => x.id === a.id)
      const bi = RAW_TRANSACTIONS.findIndex(x => x.id === b.id)
      return sortDir === 'desc' ? bi - ai : ai - bi
    })

  /* ── Authorise / reject single ── */
  const executeApprove = (tx: Transaction, note: string) => {
    setTxns(prev => prev.map(t => t.id !== tx.id ? t : {
      ...t, status: 'approved' as TxStatus,
      authorisedAt: 'Just now', authorisedBy: 'Harshul G.',
      note: note || t.note,
    }))
    setSelected(prev => { const s = new Set(prev); s.delete(tx.id); return s })
    showToast(`✓ Authorised ${tx.gradeRef} — Grade will release funds`)
    setConfirmTx(null)
  }

  const executeReject = (tx: Transaction, note: string) => {
    setTxns(prev => prev.map(t => t.id !== tx.id ? t : {
      ...t, status: 'rejected' as TxStatus,
      authorisedAt: 'Just now', authorisedBy: 'Harshul G.',
      note: note,
    }))
    setSelected(prev => { const s = new Set(prev); s.delete(tx.id); return s })
    showToast(`Transaction rejected — funds returned via Grade`, 'err')
    setConfirmTx(null)
  }

  /* ── Bulk actions ── */
  const selectedPending = txns.filter(t => selected.has(t.id) && t.status === 'pending_auth')

  const executeBulkApprove = (note: string) => {
    const ids = new Set(selectedPending.map(t => t.id))
    setTxns(prev => prev.map(t => ids.has(t.id) ? { ...t, status: 'approved' as TxStatus, authorisedAt: 'Just now', authorisedBy: 'Harshul G.' } : t))
    setSelected(new Set())
    showToast(`✓ Authorised ${ids.size} transactions`)
    setConfirmTx(null)
  }

  const executeBulkReject = (note: string) => {
    const ids = new Set(selectedPending.map(t => t.id))
    setTxns(prev => prev.map(t => ids.has(t.id) ? { ...t, status: 'rejected' as TxStatus, authorisedAt: 'Just now', authorisedBy: 'Harshul G.', note } : t))
    setSelected(new Set())
    showToast(`${ids.size} transactions rejected`, 'err')
    setConfirmTx(null)
  }

  /* ── Select all visible pending ── */
  const allVisiblePendingIds = visible.filter(t => t.status === 'pending_auth').map(t => t.id)
  const allVisibleSelected   = allVisiblePendingIds.length > 0 && allVisiblePendingIds.every(id => selected.has(id))

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected(prev => { const s = new Set(prev); allVisiblePendingIds.forEach(id => s.delete(id)); return s })
    } else {
      setSelected(prev => new Set([...prev, ...allVisiblePendingIds]))
    }
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  /* ── Auto-authorise toggle side-effect ── */
  const handleAutoToggle = (val: boolean) => {
    setAutoAuthorise(val)
    if (val) showToast('Auto-authorise ON — new transactions will skip the queue. Existing queue unchanged.')
    else     showToast('Auto-authorise OFF — all transactions require manual review')
  }

  /* ── Sort header ── */
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIndicator = ({ field }: { field: SortField }) => (
    <span className={`ml-1 text-[10px] ${sortField === field ? 'text-primary' : 'text-ink/20'}`}>
      {sortField === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  )

  return (
    <div className="flex min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ MODALS ════ */}
      <DetailModal
        tx={detailTx} onClose={() => setDetailTx(null)}
        onApprove={tx => { setDetailTx(null); setConfirmTx(tx); setConfirmMode('approve') }}
        onReject={tx  => { setDetailTx(null); setConfirmTx(tx); setConfirmMode('reject')  }}
      />
      <ConfirmModal
        open={confirmTx !== null}
        mode={confirmMode}
        tx={confirmTx}
        onClose={() => setConfirmTx(null)}
        onConfirm={(note) => {
          if (!confirmTx) return
          if (confirmMode === 'approve')       executeApprove(confirmTx, note)
          else if (confirmMode === 'reject')   executeReject(confirmTx, note)
          else if (confirmMode === 'bulk_approve') executeBulkApprove(note)
          else if (confirmMode === 'bulk_reject')  executeBulkReject(note)
        }}
      />

      {/* ════ TOAST ════ */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-[900] -translate-x-1/2 transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-white shadow-lg ${toast.type === 'ok' ? GRAD_BTN + ' shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]' : 'bg-rose-500 shadow-[0_12px_32px_-8px_rgba(239,68,68,0.4)]'}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-white">
              {toast.type === 'ok' ? <CheckIcon s={13}/> : <XIcon s={13}/>}
            </span>
            <p className="text-[13.5px] font-bold">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* ════ SIDEBAR ════ */}
      <aside className="hidden w-[220px] flex-shrink-0 flex-col bg-[#0A0612] lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-5 py-5">
          <NexLogo className="h-8 drop-shadow-[0_2px_10px_rgba(139,49,232,0.5)]"/>
          <div className="flex h-5 items-center rounded-md border border-amber-400/25 bg-amber-400/10 px-2">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-400">Admin</span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {[
            { icon: <DashIcon s={15}/>,     label: 'Dashboard',    active: false, href: '/admin/dashboard'    },
            { icon: <UsersIcon s={15}/>,    label: 'Users',        active: false, href: '/admin/users'        },
            { icon: <ActivityIcon s={15}/>, label: 'Campaigns',    active: false, href: '/admin/campaigns'    },
            { icon: <EuroIcon s={15}/>,     label: 'Transactions', active: true,  href: '/admin/transactions' },
            { icon: <TicketIcon s={15}/>,   label: 'Disputes',     active: false, href: '/admin/disputes'     },
            { icon: <ShieldIcon s={15}/>,   label: 'Compliance',   active: false, href: '/admin/compliance'   },
            { icon: <ZapIcon s={15}/>,      label: 'System',       active: false, href: '/admin/system'       },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${item.active ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]` : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'}`}>
              {item.icon}{item.label}
              {item.label === 'Transactions' && pendingCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-white">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/[0.07] px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${GRAD_BTN}`}>H</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-white">Harshul G.</p>
              <p className="text-[11px] text-white/35">Founder</p>
            </div>
            <button onClick={() => router.push('/admin/login')} className="text-white/30 transition hover:text-white/60"><LogoutIcon s={15}/></button>
          </div>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ════ TOPBAR ════ */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-primary/10 bg-white/95 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">Transactions</h1>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"/>
                {pendingCount} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* ── GLOBAL: Auto-authorise ── */}
            <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 ${autoAuthorise ? 'border-emerald-200 bg-emerald-50' : 'border-primary/12 bg-white'}`}>
              <span className={`text-[12px] font-bold ${autoAuthorise ? 'text-emerald-700' : 'text-ink/55'}`}>
                Auto-auth
              </span>
              <Toggle on={autoAuthorise} onChange={handleAutoToggle}/>
            </div>
            {/* ── GLOBAL: Daily limit ── */}
            <div className="flex items-center gap-2 rounded-xl border border-primary/12 bg-white px-3.5 py-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink/35 hidden sm:inline">Limit/day</span>
              {editingLimit ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-ink/50">€</span>
                  <input autoFocus type="number" min={0} value={limitInput} onChange={e => setLimitInput(e.target.value)}
                    onBlur={() => { const v = parseInt(limitInput, 10); if (!isNaN(v) && v > 0) { setDailyLimit(v); showToast(`Daily limit set to €${v.toLocaleString()}`) } setEditingLimit(false) }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                    className="w-[70px] rounded-lg border border-primary/20 bg-surface-sub px-2 py-0.5 text-[13px] font-bold text-ink outline-none focus:border-primary"/>
                </div>
              ) : (
                <button onClick={() => { setLimitInput(String(dailyLimit)); setEditingLimit(true) }}
                  className="text-[13px] font-bold text-ink hover:text-primary transition">
                  €{dailyLimit.toLocaleString()}
                  <span className="ml-1 text-[10px] text-ink/30">edit</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-6 py-6">

          {/* ════ CRITICAL ALERT if any crit pending ════ */}
          {critPending > 0 && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5">
              <AlertIcon s={18}/>
              <p className="flex-1 text-[13px] font-bold text-rose-700">
                {critPending} high-risk transaction{critPending !== 1 ? 's' : ''} in the pending queue — review before authorising.
              </p>
              <button onClick={() => setStatusFilter('pending_auth')} className="text-[12.5px] font-bold text-rose-600 underline underline-offset-2">
                Show pending
              </button>
            </div>
          )}

          {/* ════ AUTO-AUTH EXPLAINER STRIP ════ */}
          {autoAuthorise && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
              <CheckIcon s={16}/>
              <p className="text-[13px] font-semibold text-emerald-700 flex-1">
                Auto-authorise is <strong>ON</strong> — new transactions under €{dailyLimit.toLocaleString()} will process without manual review. Transactions above the limit still queue here.
              </p>
              <button onClick={() => handleAutoToggle(false)} className="text-[12px] font-bold text-emerald-700 underline underline-offset-2">Turn off</button>
            </div>
          )}

          {/* ════ KPI STRIP ════ */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <TxKPICard accent icon={<EuroIcon s={18}/>}
              label="Pending auth value" value={`€${pendingValue.toLocaleString()}`}
              sub={`${pendingCount} transactions waiting`}/>
            <TxKPICard icon={<EuroIcon s={18}/>}
              label="Total volume (today)" value={`€${todayVolume.toLocaleString()}`}
              delta="+12% vs yesterday" deltaUp sub="Jul 2, 2026"/>
            <TxKPICard icon={<CheckIcon s={18}/>}
              label="Processed today" value={String(approvedCount)}
              sub={`${rejectedCount} rejected`} delta={`${totalCount} total`} deltaUp/>
            <TxKPICard icon={<ShieldIcon s={18}/>}
              label="All-time GMV cleared" value={`€${totalVolume.toLocaleString()}`}
              sub="Authorised + released"/>
          </div>

          {/* ════ FILTER BAR + BULK ACTIONS ════ */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] max-w-[260px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={14}/></span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ref…"
                className="w-full rounded-xl border border-primary/12 bg-white py-2 pl-9 pr-3.5 text-[13px] outline-none placeholder:text-ink/28 focus:border-primary/30 focus:bg-white transition"/>
            </div>

            <FilterDropdown<StatusFilter>
              label="Status" value={statusFilter} onChange={setStatusFilter}
              options={[
                { id: 'all',          label: 'All statuses'   },
                { id: 'pending_auth', label: 'Pending auth'   },
                { id: 'approved',     label: 'Approved'       },
                { id: 'rejected',     label: 'Rejected'       },
                { id: 'released',     label: 'Released'       },
              ]}/>

            <FilterDropdown<TypeFilter>
              label="Type" value={typeFilter} onChange={setTypeFilter}
              options={[
                { id: 'all',             label: 'All types'       },
                { id: 'escrow_deposit',  label: 'Escrow deposit'  },
                { id: 'creator_payout',  label: 'Creator payout'  },
                { id: 'agency_fee',      label: 'Agency fee'      },
                { id: 'retainer',        label: 'Retainer'        },
                { id: 'refund',          label: 'Refund'          },
                { id: 'withdrawal',      label: 'Withdrawal'      },
              ]}/>

            {/* Bulk action bar — appears when items selected */}
            {selected.size > 0 && selectedPending.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-3.5 py-2">
                <span className="text-[12.5px] font-bold text-ink/55">{selectedPending.length} selected</span>
                <div className="h-4 w-px bg-primary/15"/>
                <button onClick={() => { setConfirmMode('bulk_approve'); setConfirmTx(selectedPending[0] ?? null) }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN}`}>
                  <CheckIcon s={11}/>Authorise all
                </button>
                <button onClick={() => { setConfirmMode('bulk_reject'); setConfirmTx(selectedPending[0] ?? null) }}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] font-bold text-rose-600 transition hover:bg-rose-100">
                  <XIcon s={11}/>Reject all
                </button>
                <button onClick={() => setSelected(new Set())} className="text-[11px] text-ink/35 hover:text-ink/60">Clear</button>
              </div>
            )}

            <div className="ml-auto text-[12px] text-ink/35 font-semibold">
              {visible.length} of {txns.length} shown
            </div>
          </div>

          {/* ════ TRANSACTION TABLE ════ */}
          <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-primary/8 bg-surface-sub/60">
                    {/* Select-all checkbox for pending */}
                    <th className="w-10 pl-5 pr-2 py-3">
                      <button type="button" onClick={toggleSelectAll}
                        className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border-2 transition ${allVisibleSelected ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white'}`}
                        style={{ width: 18, height: 18 }}>
                        {allVisibleSelected && <CheckIcon s={9}/>}
                      </button>
                    </th>
                    <th className="py-3 pl-1 pr-3 text-left text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35">Grade ref</th>
                    <th className="px-3 py-3 text-left text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35">Type</th>
                    <th className="px-3 py-3 text-left text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35">From → To</th>
                    <th className="px-3 py-3 text-left">
                      <button onClick={() => handleSort('amount')} className="flex items-center text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35 hover:text-ink/60">
                        Amount<span className="ml-1">{sortField === 'amount' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left">
                      <button onClick={() => handleSort('status')} className="flex items-center text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35 hover:text-ink/60">
                        Status<span className="ml-1">{sortField === 'status' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
                      </button>
                    </th>
                    <th className="px-3 py-3 text-left text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35">Risk</th>
                    <th className="px-3 py-3 text-left">
                      <button onClick={() => handleSort('createdAt')} className="flex items-center text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35 hover:text-ink/60">
                        Time<span className="ml-1">{sortField === 'createdAt' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
                      </button>
                    </th>
                    <th className="py-3 pl-3 pr-5 text-right text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr><td colSpan={9} className="py-14 text-center text-[13.5px] text-ink/35">No transactions match the current filter.</td></tr>
                  )}
                  {visible.map(tx => {
                    const sc   = STATUS_CFG[tx.status as TxStatus]
                    const tc   = TYPE_CFG[tx.type as TxType]
                    const top  = topRisk(tx.risk)
                    const isPending = tx.status === 'pending_auth'
                    const isSel     = selected.has(tx.id)
                    const rowHighlight = top === 'crit' && isPending
                      ? 'bg-rose-50/60 hover:bg-rose-50'
                      : top === 'warn' && isPending
                      ? 'bg-amber-50/40 hover:bg-amber-50/80'
                      : 'hover:bg-primary/[0.015]'

                    return (
                      <tr key={tx.id} className={`border-b border-primary/5 transition ${rowHighlight} ${isSel ? 'ring-1 ring-inset ring-primary/20' : ''}`}>

                        {/* Checkbox — only selectable if pending */}
                        <td className="w-10 pl-5 pr-2 py-3.5">
                          {isPending ? (
                            <button type="button" onClick={() => toggleSelect(tx.id)}
                              className={`flex items-center justify-center rounded-md border-2 transition ${isSel ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white'}`}
                              style={{ width: 18, height: 18 }}>
                              {isSel && <CheckIcon s={9}/>}
                            </button>
                          ) : <span className="inline-block h-[18px] w-[18px]"/>}
                        </td>

                        {/* Grade ref */}
                        <td className="py-3.5 pl-1 pr-3">
                          <p className="text-[12px] font-bold font-mono text-ink">{tx.gradeRef}</p>
                          {tx.contractId && <p className="text-[10.5px] text-ink/35 font-mono">{tx.contractId}</p>}
                        </td>

                        {/* Type */}
                        <td className="px-3 py-3.5">
                          <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${tc.bg} ${tc.text}`}>{tc.label}</span>
                        </td>

                        {/* From → To */}
                        <td className="px-3 py-3.5">
                          <p className="text-[12.5px] font-semibold text-ink">{tx.fromName}</p>
                          <p className="text-[11.5px] text-ink/40">→ {tx.toName}</p>
                          {tx.campaignName && <p className="text-[10.5px] text-ink/30 truncate max-w-[160px]">{tx.campaignName}</p>}
                        </td>

                        {/* Amount */}
                        <td className="px-3 py-3.5">
                          <p className={`text-[14px] font-black tracking-[-0.02em] ${tx.amount > dailyLimit ? 'text-rose-600' : 'text-ink'}`}>
                            €{tx.amount.toLocaleString()}
                            {tx.amount > dailyLimit && <span className="ml-1 text-[9px] font-bold text-rose-400">ABOVE LIMIT</span>}
                          </p>
                          <p className="text-[11px] text-ink/35">{tx.currency} · Grade</p>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${isPending ? 'animate-pulse' : ''}`}/>
                            {sc.label}
                          </span>
                          {tx.authorisedBy && (
                            <p className="mt-0.5 text-[10px] text-ink/30">{tx.authorisedBy}</p>
                          )}
                        </td>

                        {/* Risk */}
                        <td className="px-3 py-3.5">
                          <RiskBadge flags={tx.risk}/>
                          {top !== 'ok' && (
                            <p className="mt-1 max-w-[120px] text-[10px] leading-[1.4] text-ink/40 line-clamp-2">
                              {tx.risk.find(f => f.level === top)?.label}
                            </p>
                          )}
                        </td>

                        {/* Time */}
                        <td className="px-3 py-3.5">
                          <p className="text-[12px] text-ink/55">{tx.createdAt}</p>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-3 pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View detail */}
                            <button onClick={() => setDetailTx(tx)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/12 bg-white text-ink/40 transition hover:border-primary/25 hover:text-primary">
                              <ExternalIcon s={12}/>
                            </button>
                            {/* Authorise — only for pending */}
                            {isPending && (
                              <>
                                <button onClick={() => { setConfirmTx(tx); setConfirmMode('approve') }}
                                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN} shadow-[0_4px_12px_-4px_rgba(139,49,232,0.4)]`}>
                                  <CheckIcon s={11}/>Auth
                                </button>
                                <button onClick={() => { setConfirmTx(tx); setConfirmMode('reject') }}
                                  className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[12px] font-bold text-rose-600 transition hover:bg-rose-100">
                                  <XIcon s={11}/>Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer totals */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/8 bg-surface-sub/40 px-5 py-3">
              <p className="text-[12px] text-ink/40">
                Showing {visible.length} of {txns.length} transactions
                {statusFilter !== 'all' ? ` · filtered: ${STATUS_LABELS[statusFilter as TxStatus]}` : ''}
              </p>
              <p className="text-[12.5px] font-bold text-ink/60">
                Visible total: <span className="text-ink font-extrabold">€{visible.reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* ════ GUARD RAILS CARD ════ */}
          <div className={`mt-6 rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${GRAD_BTN}`}><ShieldIcon s={18}/></div>
              <div>
                <h3 className="text-[14px] font-extrabold text-ink">Authorisation guard rails</h3>
                <p className="text-[12px] text-ink/45">These settings govern when transactions need manual review vs. auto-processing</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  label: 'Manual auth mode',
                  value: autoAuthorise ? 'OFF — new transactions self-approve' : 'ON — every transaction queues here',
                  status: autoAuthorise ? 'warn' : 'ok',
                  note: autoAuthorise ? 'Turn off when fraud signals are low and volume is high' : 'Default for early-stage. Flip when you trust your fraud stack.',
                },
                {
                  label: 'Per-transaction ceiling',
                  value: `€${dailyLimit.toLocaleString()} hard limit`,
                  status: 'ok' as const,
                  note: 'Any transaction above this always requires manual review, even when auto-auth is ON.',
                },
                {
                  label: 'High-risk auto-block',
                  value: 'Accounts < 7 days old',
                  status: 'ok' as const,
                  note: 'New accounts cannot receive payouts without manual authorisation regardless of other settings.',
                },
              ].map(g => (
                <div key={g.label} className={`rounded-xl border p-4 ${g.status === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-primary/10 bg-surface-sub/40'}`}>
                  <p className={`text-[10.5px] font-black uppercase tracking-[0.12em] mb-1.5 ${g.status === 'warn' ? 'text-amber-600' : 'text-ink/35'}`}>{g.label}</p>
                  <p className={`text-[13.5px] font-extrabold ${g.status === 'warn' ? 'text-amber-800' : 'text-ink'}`}>{g.value}</p>
                  <p className="mt-1 text-[11px] leading-[1.5] text-ink/45">{g.note}</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}