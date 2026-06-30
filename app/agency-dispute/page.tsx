'use client'

import React, { useState, useRef, useEffect, type ReactNode, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Agency Support & Disputes — app/agency/dispute/new/page.tsx
   Nexfluence v4, LIGHT
   ════════════════════════════════════════════════════════════════════

   THE CORE DIFFERENCE FROM BRAND/CREATOR DISPUTE PAGES:
   The agency sits between brands and creators, so disputes can run
   in either direction, plus agency-specific money-flow confusion that
   neither brand nor creator ever has to deal with.

   SIX CATEGORIES (vs brand's creator_dispute / creator's brand_dispute):
     1. brand_dispute    — dispute WITH a managed brand client
                           (retainer non-payment, scope changes, brand
                           bypassing the agency to deal directly with
                           creators, exclusivity violations)
     2. creator_dispute   — dispute WITH a roster creator
                           (non-delivery, bypassing the agency to deal
                           directly with the brand, conduct, fraud)
     3. payment_issue     — BROADER than either single-sided version.
                           Money moves three ways for an agency:
                             brand → agency (retainer / mgmt fee)
                             agency → creator (disbursement)
                             brand → creator (direct, agency monitoring)
                           A "Which payment flow?" selector replaces the
                           single counterparty field brand/creator pages use.
     4. contract_issue    — management agreement OR campaign contract.
                           A contract-type selector determines which
                           party fields appear (brand only, vs brand+creator).
     5. feature_request   — agency-framed platform areas
     6. general            — unchanged pattern

   Everything structural — StepIndicator, file upload, SuccessScreen,
   ExistingTicketsPanel, canAdvance validation — is a verbatim port.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
const LBL      = 'mb-1.5 block text-[12px] font-bold text-ink/50'

/* ─── Types ──────────────────────────────────────────────────────── */
type CategoryId       = 'brand_dispute' | 'creator_dispute' | 'payment_issue' | 'contract_issue' | 'feature_request' | 'general'
type Priority         = 'low' | 'medium' | 'high' | 'critical'
type TicketStatus     = 'open' | 'in_review' | 'resolved' | 'closed'
type PaymentDirection = 'brand_to_agency' | 'agency_to_creator' | 'brand_to_creator'
type ContractType     = 'management_agreement' | 'campaign_contract'

interface TicketFormData {
  category:           CategoryId | null
  priority:           Priority
  subject:            string
  description:        string
  /* Brand dispute */
  brandId:            string
  brandName:          string
  campaignName:       string
  disputeSubtype:     string
  /* Creator dispute */
  creatorName:        string
  creatorHandle:      string
  /* Payment — agency-specific direction selector */
  paymentDirection:   PaymentDirection
  paymentAmount:      string
  paymentDueDate:     string
  paymentRef:         string
  counterpartyName:   string
  /* Contract — agency-specific type selector */
  contractType:       ContractType
  contractId:         string
  /* Feature request */
  featureArea:        string
  featureDescription: string
  /* Evidence */
  files:              File[]
}

interface ExistingTicket {
  id:          string
  category:    CategoryId
  subject:     string
  status:      TicketStatus
  priority:    Priority
  createdDate: string
  updatedDate: string
  assignee:    string | null
}

/* ─── Managed brands — for the brand-dispute selector ────────────── */
const MANAGED_BRANDS = [
  { id: 'mb1', name: 'Kinetics',        color: '#8B31E8', initials: 'KI' },
  { id: 'mb2', name: 'Lumora Skincare', color: '#059669', initials: 'LS' },
  { id: 'mb3', name: 'Forma Fit',       color: '#2563EB', initials: 'FF' },
]

/* ════════════════════════════════════════════════════════════════════
   CATEGORY CONFIG — agency-framed
   ════════════════════════════════════════════════════════════════════ */
interface CategoryConfig {
  id: CategoryId; label: string; tagline: string; icon: ReactNode
  color: string; bg: string; border: string; examples: string[]; sla: string
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'brand_dispute',
    label: 'Brand dispute',
    tagline: 'Disputes with a managed brand client',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 12v3M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200',
    examples: ['Retainer not paid', 'Bypassing agency', 'Scope changed', 'Exclusivity violated'],
    sla: '24–48 hours',
  },
  {
    id: 'creator_dispute',
    label: 'Creator dispute',
    tagline: 'Disputes with a roster creator',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M1 21v-1a7 7 0 0112.03-4.88" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18 8l4 4-4 4M22 12h-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200',
    examples: ['Content not delivered', 'Bypassing agency', 'Fraudulent metrics', 'Brief violation'],
    sla: '24–48 hours',
  },
  {
    id: 'payment_issue',
    label: 'Payment issue',
    tagline: 'Retainer, management fee, or creator disbursement issues',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M5 16h4M15 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
    examples: ['Retainer overdue', 'Disbursement failed', 'Fee miscalculated', 'Escrow held'],
    sla: '4–8 hours',
  },
  {
    id: 'contract_issue',
    label: 'Contract issue',
    tagline: 'Management agreement or campaign contract problems',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 13l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
    examples: ['Won\'t countersign', 'Terms not honoured', 'Wrong contract sent', 'Clause dispute'],
    sla: '24–48 hours',
  },
  {
    id: 'feature_request',
    label: 'Feature request',
    tagline: 'Suggest improvements for agency tools on Creator Nexus',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l2.1-2.1M5.6 18.4l2.1-2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>,
    color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200',
    examples: ['Fee routing clarity', 'Roster management', 'Brand switcher', 'Bulk invoicing'],
    sla: 'We review monthly',
  },
  {
    id: 'general',
    label: 'General / other',
    tagline: 'Anything else — feedback, complaints, questions',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>,
    color: 'text-ink/60', bg: 'bg-surface-sub', border: 'border-primary/12',
    examples: ['Agency account question', 'Platform feedback', 'General complaint', 'Anything else'],
    sla: '48–72 hours',
  },
]

/* ─── Dispute subtypes — agency-framed ───────────────────────────── */
const DISPUTE_SUBTYPES: Record<string, string[]> = {
  brand_dispute: [
    'Retainer or management fee not paid',
    'Brand bypassing agency — dealing directly with roster creators',
    'Campaign scope changed without amending management agreement',
    'Brand withholding payment for a completed campaign',
    'Brand violating exclusivity clause',
    'Unprofessional conduct by brand',
    'Brand requesting early termination without notice period',
  ],
  creator_dispute: [
    'Creator not delivering committed content',
    'Creator bypassing agency — dealing directly with brand',
    'Fraudulent engagement metrics',
    'Brief or contract violation',
    'Unprofessional conduct by creator',
    'Creator refusing contracted roster exclusivity',
    'Creator requesting early contract termination',
  ],
  feature_request: [
    'Campaign builder & fee routing',
    'Contract builder (management / tripartite)',
    'Creator roster management',
    'Brand dashboard & switcher',
    'Payments & invoicing',
    'Messages (brand + creator threads)',
    'Analytics & reporting',
    'Other',
  ],
  general: [
    'Agency account question',
    'Billing question',
    'Platform feedback',
    'Partnership enquiry',
    'General complaint',
    'Something else',
  ],
}

/* ─── Priority & status configs — identical structure to brand/creator pages ── */
const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; text: string; bg: string; border: string; desc: string }> = {
  low:      { label: 'Low',      dot: 'bg-sky-400',    text: 'text-sky-700',    bg: 'bg-sky-50',    border: 'border-sky-200',    desc: 'No urgency — informational'                  },
  medium:   { label: 'Medium',   dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  desc: 'Needs attention within a few days'           },
  high:     { label: 'High',     dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Urgent — affecting active campaigns or payroll' },
  critical: { label: 'Critical', dot: 'bg-rose-500',   text: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200',   desc: 'Fraud, payment failure, account compromise'   },
}

const TICKET_STATUS_CFG: Record<TicketStatus, { label: string; dot: string; bg: string; text: string }> = {
  open:      { label: 'Open',      dot: 'bg-primary/60',  bg: 'bg-primary/[0.07]', text: 'text-primary'     },
  in_review: { label: 'In review', dot: 'bg-amber-400',   bg: 'bg-amber-50',       text: 'text-amber-700'   },
  resolved:  { label: 'Resolved',  dot: 'bg-emerald-400', bg: 'bg-emerald-50',     text: 'text-emerald-700' },
  closed:    { label: 'Closed',    dot: 'bg-ink/25',      bg: 'bg-surface-sub',    text: 'text-ink/45'      },
}

/* ─── Payment direction config — the agency-only money-flow selector ── */
const PAYMENT_DIRECTIONS: { id: PaymentDirection; label: string; desc: string; icon: ReactNode }[] = [
  {
    id: 'brand_to_agency', label: 'Brand → Agency',
    desc: 'Retainer, management fee, or campaign delivery fee owed by a brand client',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  {
    id: 'agency_to_creator', label: 'Agency → Creator',
    desc: 'A disbursement the agency owes to a creator after collecting from the brand',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M1 21v-1a7 7 0 0112.03-4.88" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  },
  {
    id: 'brand_to_creator', label: 'Brand → Creator',
    desc: 'Direct payment between brand and creator that the agency is monitoring',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
]

/* ─── Contract type config — management vs campaign ──────────────── */
const CONTRACT_TYPES: { id: ContractType; label: string; desc: string }[] = [
  { id: 'management_agreement', label: 'Management agreement',  desc: 'Agency ↔ Brand — scope, retainer, authority' },
  { id: 'campaign_contract',     label: 'Campaign contract (3-party)', desc: 'Agency ↔ Brand ↔ Creator — a specific campaign' },
]

/* ─── Existing tickets — agency-flavoured mock ───────────────────── */
const EXISTING_TICKETS: ExistingTicket[] = [
  { id: 'TKT-2026-0047', category: 'payment_issue',    subject: 'Kinetics July retainer — €1,200 overdue by 12 days',              status: 'in_review', priority: 'high',     createdDate: 'Jun 26, 2026', updatedDate: '4h ago',  assignee: 'Nexfluence Billing' },
  { id: 'TKT-2026-0044', category: 'creator_dispute',  subject: 'Sandra Liepa missed final deadline on Electrolyte Hot Yoga',       status: 'open',       priority: 'medium',   createdDate: 'Jun 24, 2026', updatedDate: 'Jun 24',   assignee: null                  },
  { id: 'TKT-2026-0040', category: 'brand_dispute',    subject: 'Forma Fit contacted Rūta Vaitkutė directly, bypassing agency',     status: 'in_review', priority: 'critical', createdDate: 'Jun 20, 2026', updatedDate: 'Jun 21',   assignee: 'Nexfluence Support'  },
  { id: 'TKT-2026-0035', category: 'contract_issue',   subject: 'NordGlow management agreement — still unsigned after 2 weeks',    status: 'open',       priority: 'medium',   createdDate: 'Jun 15, 2026', updatedDate: 'Jun 15',   assignee: null                  },
  { id: 'TKT-2026-0029', category: 'feature_request',  subject: 'Add fee-routing summary to campaign tracker payment card',         status: 'resolved',   priority: 'low',      createdDate: 'Jun 8, 2026',  updatedDate: 'Jun 14',   assignee: 'Nexfluence Product'  },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function ChevLeft({ s = 15 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function Check({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChevRight({ s = 14 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function UploadIcon({ s = 28 }: { s?: number }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 13 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function MailIcon({ s = 22 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 20 }: { s?: number }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function BellIcon({ s = 18 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function AlertIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function EntityTile({ initials, color, size = 30 }: { initials: string; color: string; size?: number }) {
  return <div className="flex flex-shrink-0 items-center justify-center rounded-lg font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{initials}</div>
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function FieldLabel({ children }: { children: ReactNode }) { return <label className={LBL}>{children}</label> }
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={className}><FieldLabel>{label}</FieldLabel>{children}</div>
}

/* ════════════════════════════════════════════════════════════════════
   STEP INDICATOR — identical to brand/creator pages
   ════════════════════════════════════════════════════════════════════ */
const STEPS = ['Category', 'Details', 'Review & submit']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const n = i + 1, done = n < current, active = n === current
        return (
          <div key={label} className="flex items-center">
            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${active ? 'bg-primary/[0.08]' : ''}`}>
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black transition ${done ? `${GRAD_BTN} text-white` : active ? 'border-2 border-primary text-primary' : 'border-2 border-primary/20 text-ink/28'}`}>
                {done ? <Check s={10}/> : n}
              </div>
              <span className={`hidden text-[12.5px] font-semibold sm:inline ${active ? 'text-primary' : done ? 'text-ink/45' : 'text-ink/25'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`mx-1 h-px w-8 rounded-full transition ${done ? GRAD_BTN : 'bg-primary/10'}`}/>}
          </div>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 1 — CATEGORY SELECTOR
   ════════════════════════════════════════════════════════════════════ */
function CategoryStep({ selected, onSelect }: { selected: CategoryId | null; onSelect: (c: CategoryId) => void }) {
  return (
    <div>
      <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">What do you need help with?</h2>
      <p className="mt-1 text-[13.5px] text-ink/50">Select the category that best describes your issue. Our team resolves everything via email.</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(cat => {
          const sel = selected === cat.id
          return (
            <button key={cat.id} type="button" onClick={() => onSelect(cat.id)}
              className={`group relative flex flex-col gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                sel
                  ? `${cat.border} ${cat.bg} shadow-[0_0_0_1px_rgba(139,49,232,0.12),0_6px_20px_-6px_rgba(139,49,232,0.18)]`
                  : `border-primary/10 bg-white hover:border-primary/20 hover:-translate-y-0.5 ${CARD}`
              }`}>
              <div className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${sel ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                {sel && <Check s={9}/>}
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.bg} ${cat.color}`}>{cat.icon}</div>
              <div>
                <p className="text-[14.5px] font-extrabold text-ink">{cat.label}</p>
                <p className="mt-1 text-[12.5px] leading-[1.55] text-ink/55">{cat.tagline}</p>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {cat.examples.map(ex => <span key={ex} className={`rounded-lg px-2 py-0.5 text-[10.5px] font-semibold ${cat.bg} ${cat.color}`}>{ex}</span>)}
                </div>
              </div>
              <div className={`mt-auto flex items-center gap-1.5 text-[11px] font-semibold ${cat.color} opacity-70`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                Response: {cat.sla}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 2 — DETAILS FORM (adapts per category, agency-specific fields)
   ════════════════════════════════════════════════════════════════════ */
function DetailsStep({ form, onChange }: { form: TicketFormData; onChange: (p: Partial<TicketFormData>) => void }) {
  const cat      = CATEGORIES.find(c => c.id === form.category)!
  const subtypes = DISPUTE_SUBTYPES[form.category ?? ''] ?? []

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[]
    onChange({ files: [...form.files, ...files].slice(0, 5) })
    e.target.value = ''
  }
  const removeFile = (i: number) => onChange({ files: form.files.filter((_, idx) => idx !== i) })
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files) as File[]
    onChange({ files: [...form.files, ...dropped].slice(0, 5) })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className={`mb-5 inline-flex items-center gap-3 rounded-2xl border px-4 py-3 ${cat.bg} ${cat.border}`}>
          <span className={cat.color}>{cat.icon}</span>
          <div>
            <p className={`text-[13px] font-extrabold ${cat.color}`}>{cat.label}</p>
            <p className="text-[11.5px] text-ink/50">{cat.tagline}</p>
          </div>
        </div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Tell us what happened</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Be as specific as possible — this goes directly to our team and helps us resolve faster.</p>
      </div>

      {/* Priority */}
      <div>
        <FieldLabel>Priority level *</FieldLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(['low', 'medium', 'high', 'critical'] as Priority[]).map(p => {
            const pc = PRIORITY_CONFIG[p], sel = form.priority === p
            return (
              <button key={p} type="button" onClick={() => onChange({ priority: p })}
                className={`flex flex-col gap-1.5 rounded-xl border-2 px-3.5 py-3 text-left transition ${sel ? `${pc.border} ${pc.bg}` : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${pc.dot}`}/>
                  <span className={`text-[13px] font-extrabold ${sel ? pc.text : 'text-ink'}`}>{pc.label}</span>
                  {sel && <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white"><Check s={9}/></span>}
                </div>
                <p className={`text-[10.5px] font-medium leading-snug ${sel ? pc.text : 'text-ink/40'}`}>{pc.desc}</p>
              </button>
            )
          })}
        </div>
        {form.priority === 'critical' && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertIcon s={15}/>
            <p className="text-[12.5px] font-semibold leading-[1.6] text-rose-700">Critical tickets are escalated immediately. Use only for active fraud, payment failures blocking creator payroll, or account compromise.</p>
          </div>
        )}
      </div>

      {/* Issue subtype */}
      {subtypes.length > 0 && (
        <Field label="Issue type *">
          <select className={INP} value={form.disputeSubtype} onChange={e => onChange({ disputeSubtype: e.target.value })}>
            <option value="">Select issue type…</option>
            {subtypes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      )}

      {/* Subject */}
      <Field label="Subject / headline *">
        <input className={INP} value={form.subject} onChange={e => onChange({ subject: e.target.value })}
          placeholder={
            form.category === 'brand_dispute'   ? 'e.g. Kinetics — July retainer €1,200 overdue 12 days' :
            form.category === 'creator_dispute'  ? 'e.g. Sandra Liepa — missed final deadline on Hot Yoga campaign' :
            form.category === 'payment_issue'    ? 'e.g. Disbursement to Amelia Roze failed via Grade' :
            form.category === 'contract_issue'   ? 'e.g. NordGlow management agreement unsigned 2 weeks' :
            form.category === 'feature_request'  ? 'e.g. Add fee-routing summary to campaign tracker' :
            'Describe your issue in one line…'
          }/>
      </Field>

      {/* ── BRAND DISPUTE context ── */}
      {form.category === 'brand_dispute' && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 space-y-4">
          <p className="text-[12px] font-bold text-violet-600">Brand & campaign details</p>
          <div>
            <FieldLabel>Which brand client?</FieldLabel>
            <div className="space-y-2">
              {MANAGED_BRANDS.map(b => (
                <button key={b.id} type="button" onClick={() => onChange({ brandId: b.id, brandName: b.name })}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${form.brandId === b.id ? 'border-violet-300 bg-violet-50' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                  <EntityTile initials={b.initials} color={b.color} size={32}/>
                  <p className="flex-1 text-[13.5px] font-bold text-ink">{b.name}</p>
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${form.brandId === b.id ? 'border-violet-500 bg-violet-500 text-white' : 'border-primary/20 bg-white'}`}>
                    {form.brandId === b.id && <Check s={10}/>}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Field label="Campaign name (if relevant)"><input className={INP} value={form.campaignName} onChange={e => onChange({ campaignName: e.target.value })} placeholder="e.g. Electrolyte Hot Yoga"/></Field>
        </div>
      )}

      {/* ── CREATOR DISPUTE context ── */}
      {form.category === 'creator_dispute' && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5 space-y-4">
          <p className="text-[12px] font-bold text-sky-600">Creator & campaign details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Creator name"><input className={INP} value={form.creatorName} onChange={e => onChange({ creatorName: e.target.value })} placeholder="Sandra Liepa"/></Field>
            <Field label="Creator handle"><input className={INP} value={form.creatorHandle} onChange={e => onChange({ creatorHandle: e.target.value })} placeholder="@sandra.liepa"/></Field>
            <Field label="Campaign name" className="sm:col-span-2"><input className={INP} value={form.campaignName} onChange={e => onChange({ campaignName: e.target.value })} placeholder="e.g. Electrolyte Hot Yoga"/></Field>
          </div>
        </div>
      )}

      {/* ── PAYMENT ISSUE — the agency-specific money-flow selector ── */}
      {form.category === 'payment_issue' && (
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-emerald-600">Which payment flow does this involve?</p>
            <span className={`rounded-full ${GRAD_BTN} px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-[0.08em] text-white`}>Agency only</span>
          </div>
          <div className="space-y-2">
            {PAYMENT_DIRECTIONS.map(dir => {
              const sel = form.paymentDirection === dir.id
              return (
                <button key={dir.id} type="button" onClick={() => onChange({ paymentDirection: dir.id })}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition ${sel ? 'border-emerald-400 bg-emerald-50' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${sel ? 'bg-emerald-500 text-white' : 'bg-surface-sub text-ink/50'}`}>{dir.icon}</span>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-bold text-ink">{dir.label}</p>
                    <p className="mt-0.5 text-[12px] text-ink/50">{dir.desc}</p>
                  </div>
                  <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${sel ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-primary/20 bg-white'}`}>
                    {sel && <Check s={10}/>}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Amount"><div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/38 font-bold">€</span><input className={`${INP} pl-8`} value={form.paymentAmount} onChange={e => onChange({ paymentAmount: e.target.value })} placeholder="1200"/></div></Field>
            <Field label="Due date"><input type="date" className={INP} value={form.paymentDueDate} onChange={e => onChange({ paymentDueDate: e.target.value })}/></Field>
            <Field label={
              form.paymentDirection === 'agency_to_creator' ? 'Creator name' :
              'Brand name'
            }>
              <input className={INP} value={form.counterpartyName} onChange={e => onChange({ counterpartyName: e.target.value })}
                placeholder={form.paymentDirection === 'agency_to_creator' ? 'e.g. Amelia Roze' : 'e.g. Kinetics'}/>
            </Field>
          </div>
          <Field label="Reference / invoice ID (if any)"><input className={INP} value={form.paymentRef} onChange={e => onChange({ paymentRef: e.target.value })} placeholder="INV-2026-xxxx or PAY-2026-xxxx"/></Field>
        </div>
      )}

      {/* ── CONTRACT ISSUE — management vs campaign type selector ── */}
      {form.category === 'contract_issue' && (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-amber-600">Which type of contract?</p>
            <span className={`rounded-full ${GRAD_BTN} px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-[0.08em] text-white`}>Agency only</span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CONTRACT_TYPES.map(ct => {
              const sel = form.contractType === ct.id
              return (
                <button key={ct.id} type="button" onClick={() => onChange({ contractType: ct.id })}
                  className={`flex flex-col gap-1 rounded-xl border-2 px-4 py-3 text-left transition ${sel ? 'border-amber-400 bg-amber-50' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-bold text-ink">{ct.label}</p>
                    <div className={`flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 transition ${sel ? 'border-amber-500 bg-amber-500 text-white' : 'border-primary/20 bg-white'}`}>
                      {sel && <Check s={9}/>}
                    </div>
                  </div>
                  <p className="text-[11.5px] text-ink/50">{ct.desc}</p>
                </button>
              )
            })}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Brand name"><input className={INP} value={form.brandName} onChange={e => onChange({ brandName: e.target.value })} placeholder="e.g. NordGlow"/></Field>
            {form.contractType === 'campaign_contract' && (
              <Field label="Creator name"><input className={INP} value={form.creatorName} onChange={e => onChange({ creatorName: e.target.value })} placeholder="e.g. Amelia Roze"/></Field>
            )}
            <Field label="Contract ID (if known)" className={form.contractType === 'campaign_contract' ? 'sm:col-span-2' : ''}>
              <input className={INP} value={form.contractId} onChange={e => onChange({ contractId: e.target.value })} placeholder="MGT-2026-xxx or CTR-2026-xxx"/>
            </Field>
          </div>
        </div>
      )}

      {/* ── FEATURE REQUEST ── */}
      {form.category === 'feature_request' && (
        <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-5 space-y-4">
          <p className="text-[12px] font-bold text-pink-600">Feature details</p>
          <Field label="Which part of the platform?">
            <select className={INP} value={form.featureArea} onChange={e => onChange({ featureArea: e.target.value })}>
              <option value="">Select area…</option>
              {['Campaign builder', 'Contract builder', 'Creator roster', 'Brand dashboard & switcher', 'Messages', 'Payments & invoicing', 'Analytics', 'Other'].map(a => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Describe the feature / improvement">
            <textarea className={`${INP} min-h-[80px] resize-y leading-relaxed`} value={form.featureDescription} onChange={e => onChange({ featureDescription: e.target.value })} placeholder="What would it do? Who benefits? How would it work?"/>
          </Field>
        </div>
      )}

      {/* Description — all categories */}
      <Field label={form.category === 'feature_request' ? 'Additional context (optional)' : 'Full description *'}>
        <textarea className={`${INP} min-h-[120px] resize-y leading-relaxed`}
          value={form.description} onChange={e => onChange({ description: e.target.value })}
          placeholder={
            form.category === 'brand_dispute'   ? 'Describe what happened — what the management agreement says, what the brand did or didn\'t do, key dates, and the resolution you need.' :
            form.category === 'creator_dispute'  ? 'Describe the issue — what was agreed, what happened, timestamps, and what resolution you\'re seeking.' :
            form.category === 'payment_issue'    ? 'Describe the payment issue — include which campaign/contract it relates to, the agreed schedule, and what has (or hasn\'t) happened.' :
            form.category === 'contract_issue'   ? 'Describe the contract issue, relevant clause numbers, and what you need the Nexfluence team to do.' :
            form.category === 'feature_request'  ? 'Anything else to help our product team understand the request.' :
            'Describe your issue, question, or feedback in full. Include relevant dates, names, and any steps you\'ve already taken.'
          }/>
      </Field>

      {/* Evidence upload */}
      <div>
        <FieldLabel>Supporting evidence (optional · max 5 files · 10MB each)</FieldLabel>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${dragging ? 'border-primary bg-primary/[0.05] scale-[1.01]' : 'border-primary/20 bg-surface-sub/50 hover:border-primary/40 hover:bg-primary/[0.02]'}`}>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${dragging ? `${GRAD_BTN} text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)]` : 'bg-primary/[0.08] text-primary'}`}>
            <UploadIcon s={22}/>
          </div>
          <div>
            <p className="text-[14px] font-bold text-ink">Drop files here or <span className={GRAD_TXT}>browse</span></p>
            <p className="mt-0.5 text-[12px] text-ink/40">Screenshots, invoices, contracts, recordings — anything that helps</p>
          </div>
          <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*,video/*,.pdf,.csv,.xlsx,.zip" onChange={handleFileChange}/>
        </div>
        {form.files.length > 0 && (
          <div className="mt-3 space-y-2">
            {form.files.map((file, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-white px-4 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{file.name}</p>
                  <p className="text-[11px] text-ink/40">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => removeFile(i)} className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink/35 transition hover:bg-rose-50 hover:text-rose-500"><XIcon s={12}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 3 — REVIEW & SUBMIT
   ════════════════════════════════════════════════════════════════════ */
function ReviewStep({ form, onEditCategory, onEditDetails }: {
  form: TicketFormData; onEditCategory: () => void; onEditDetails: () => void
}) {
  const cat = CATEGORIES.find(c => c.id === form.category)!
  const pc  = PRIORITY_CONFIG[form.priority]

  function ReviewRow({ label, value }: { label: string; value: string }) {
    if (!value) return null
    return (
      <div className="flex items-start justify-between gap-6 border-b border-primary/6 py-2.5 last:border-0">
        <span className="flex-shrink-0 text-[12px] font-semibold text-ink/40">{label}</span>
        <span className="text-right text-[13px] font-semibold text-ink">{value}</span>
      </div>
    )
  }

  const paymentDirLabel = PAYMENT_DIRECTIONS.find(d => d.id === form.paymentDirection)?.label ?? ''
  const contractTypeLabel = CONTRACT_TYPES.find(c => c.id === form.contractType)?.label ?? ''

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Review your ticket</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Double-check before submitting. Our team will respond to the email on your agency account.</p>
      </div>

      {/* Category block */}
      <div className={`rounded-2xl border p-5 ${cat.bg} ${cat.border}`}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-ink/40">Category</p>
          <button onClick={onEditCategory} className="text-[12.5px] font-bold text-primary hover:underline">Change</button>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${cat.bg} ${cat.color} ${cat.border}`}>{cat.icon}</div>
          <div>
            <p className={`text-[14px] font-extrabold ${cat.color}`}>{cat.label}</p>
            <p className="text-[11.5px] text-ink/45">Response: {cat.sla}</p>
          </div>
          <span className={`ml-auto flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11.5px] font-bold ${pc.border} ${pc.bg} ${pc.text}`}>
            <span className={`h-2 w-2 rounded-full ${pc.dot}`}/>{pc.label} priority
          </span>
        </div>
      </div>

      {/* Details block */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-ink/40">Details</p>
          <button onClick={onEditDetails} className="text-[12.5px] font-bold text-primary hover:underline">Edit</button>
        </div>
        <ReviewRow label="Subject"          value={form.subject}/>
        <ReviewRow label="Issue type"       value={form.disputeSubtype}/>
        <ReviewRow label="Brand"            value={form.brandName}/>
        <ReviewRow label="Creator"          value={form.creatorName ? `${form.creatorName} ${form.creatorHandle}` : ''}/>
        <ReviewRow label="Campaign"         value={form.campaignName}/>
        <ReviewRow label="Payment flow"     value={form.category === 'payment_issue' ? paymentDirLabel : ''}/>
        <ReviewRow label="Counterparty"     value={form.counterpartyName}/>
        <ReviewRow label="Payment ref"      value={form.paymentRef}/>
        <ReviewRow label="Contract type"    value={form.category === 'contract_issue' ? contractTypeLabel : ''}/>
        <ReviewRow label="Contract ID"      value={form.contractId}/>
        {form.description && (
          <div className="border-b border-primary/6 py-2.5 last:border-0">
            <span className="text-[12px] font-semibold text-ink/40">Description</span>
            <p className="mt-1.5 text-[13px] leading-[1.65] text-ink/70 whitespace-pre-line">{form.description}</p>
          </div>
        )}
        {form.files.length > 0 && (
          <div className="pt-2.5">
            <span className="text-[12px] font-semibold text-ink/40">Evidence</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {form.files.map((f, i) => <span key={i} className="rounded-lg bg-primary/[0.07] px-2.5 py-1 text-[12px] font-semibold text-primary">{f.name}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* What happens next */}
      <div className="flex gap-4 rounded-2xl border border-primary/10 bg-white p-5">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} shadow-[0_4px_12px_-4px_rgba(139,49,232,0.40)] text-white`}>
          <MailIcon s={18}/>
        </div>
        <div>
          <p className="text-[13.5px] font-extrabold text-ink">What happens next</p>
          <p className="mt-1 text-[12.5px] leading-[1.7] text-ink/55">
            Our team will review your ticket and respond to <span className="font-bold text-ink">your agency account email</span> within <span className="font-bold text-ink">{cat.sla}</span>. For critical tickets, we escalate immediately. You can track status below on this page.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SUCCESS SCREEN
   ════════════════════════════════════════════════════════════════════ */
function SuccessScreen({ ticketId, category, onDone, onViewTickets }: {
  ticketId: string; category: CategoryId; onDone: () => void; onViewTickets: () => void
}) {
  const cat = CATEGORIES.find(c => c.id === category)!
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.50)]`}>
        <Check s={34}/>
      </div>
      <h2 className="text-[24px] font-extrabold tracking-[-0.03em] text-ink">Ticket submitted!</h2>
      <p className="mt-2 max-w-[380px] text-[14px] leading-[1.7] text-ink/55">
        Your <span className="font-bold text-ink">{cat.label.toLowerCase()}</span> ticket has been received. We'll contact you by email within <span className="font-bold text-ink">{cat.sla}</span>.
      </p>

      <div className={`mt-7 flex items-center gap-4 rounded-2xl border border-primary/12 bg-white px-6 py-4 ${CARD}`}>
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}>
          <TicketIcon s={17}/>
        </div>
        <div className="text-left">
          <p className="text-[11.5px] font-semibold text-ink/40">Ticket ID</p>
          <p className={`text-[19px] font-black tracking-[-0.02em] ${GRAD_TXT}`}>{ticketId}</p>
        </div>
      </div>

      <div className="mt-4 max-w-[380px] rounded-2xl border border-primary/10 bg-surface-sub/60 px-5 py-4 text-left">
        <p className="text-[12.5px] font-bold text-ink mb-2">Keep this reference</p>
        <ul className="space-y-1.5 text-[12px] text-ink/55">
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">·</span>A copy of this ticket has been sent to your agency account email.</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">·</span>You can track status in the "My tickets" section below.</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">·</span>Reply to the email thread to add more information.</li>
        </ul>
      </div>

      <div className="mt-7 flex gap-3">
        <button onClick={onDone}
          className={`rounded-xl ${GRAD_BTN} px-7 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
          Back to dashboard
        </button>
        <button onClick={onViewTickets}
          className="rounded-xl border border-primary/15 bg-white px-7 py-3.5 text-[14px] font-bold text-ink/55 transition hover:bg-surface-sub">
          View my tickets
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   EXISTING TICKETS PANEL
   ════════════════════════════════════════════════════════════════════ */
function ExistingTicketsPanel({ tickets }: { tickets: ExistingTicket[] }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
      <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
        <h3 className="text-[14px] font-extrabold text-ink">My tickets</h3>
        <span className={`flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-[11px] font-black text-white ${GRAD_BTN}`}>{tickets.length}</span>
      </div>

      <div className="hidden border-b border-primary/6 bg-surface-sub/60 px-5 py-2.5 text-[11px] font-semibold text-ink/35 sm:grid"
        style={{ gridTemplateColumns: '160px 2fr 1fr 1fr 1fr auto' }}>
        <span>Ticket ID</span><span>Subject</span><span>Category</span><span>Priority</span><span>Status</span><span>Updated</span>
      </div>

      <div className="divide-y divide-primary/6">
        {tickets.map(ticket => {
          const cat = CATEGORIES.find(c => c.id === ticket.category)!
          const sc  = TICKET_STATUS_CFG[ticket.status]
          const pc  = PRIORITY_CONFIG[ticket.priority]
          return (
            <div key={ticket.id}
              className="group flex cursor-pointer flex-col gap-2 px-5 py-4 transition hover:bg-primary/[0.02] sm:grid sm:items-center sm:gap-3"
              style={{ gridTemplateColumns: '160px 2fr 1fr 1fr 1fr auto' }}>
              <span className="text-[12px] font-bold text-primary">{ticket.id}</span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{ticket.subject}</p>
                {ticket.assignee && <p className="text-[11px] text-ink/38">{ticket.assignee}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:contents">
                <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold w-fit ${cat.bg} ${cat.color}`}>
                  <span className="[&>svg]:h-3 [&>svg]:w-3">{cat.icon}</span>
                  <span className="hidden lg:inline">{cat.label}</span>
                </div>
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold w-fit ${pc.bg} ${pc.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`}/>{pc.label}
                </span>
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold w-fit ${sc.bg} ${sc.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11.5px] text-ink/40 whitespace-nowrap">{ticket.updatedDate}</span>
                <ChevRight s={12}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   VALIDATION
   ════════════════════════════════════════════════════════════════════ */
function canAdvance(step: number, form: TicketFormData): boolean {
  if (step === 1) return form.category !== null
  if (step === 2) {
    if (!form.subject.trim() || !form.priority) return false
    if (form.category === 'feature_request') return form.subject.trim().length > 0
    return form.description.trim().length > 0
  }
  return true
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
const DEFAULT_FORM: TicketFormData = {
  category: null, priority: 'medium', subject: '', description: '',
  brandId: '', brandName: '', campaignName: '', disputeSubtype: '',
  creatorName: '', creatorHandle: '',
  paymentDirection: 'brand_to_agency', paymentAmount: '', paymentDueDate: '', paymentRef: '', counterpartyName: '',
  contractType: 'management_agreement', contractId: '',
  featureArea: '', featureDescription: '',
  files: [],
}

export default function AgencyDisputePage() {
  const router = useRouter()

  const [step,     setStep]     = useState(1)
  const [form,     setForm]     = useState<TicketFormData>(DEFAULT_FORM)
  const [success,  setSuccess]  = useState(false)
  const [ticketId, setTicketId] = useState('')
  const [tickets,  setTickets]  = useState<ExistingTicket[]>(EXISTING_TICKETS)
  const topRef     = useRef<HTMLDivElement>(null)
  const ticketsRef = useRef<HTMLDivElement>(null)

  const UNREAD_NOTIFS = 3

  const update = (p: Partial<TicketFormData>) => setForm(prev => ({ ...prev, ...p }))

  const scrollTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const next = () => { if (!canAdvance(step, form)) return; setStep(s => s + 1); scrollTop() }
  const back = () => { setStep(s => s - 1); scrollTop() }

  const submit = () => {
    const id = `TKT-2026-${String(Math.floor(Math.random() * 900) + 100 + tickets.length)}`
    setTicketId(id)
    const newTicket: ExistingTicket = {
      id, category: form.category!, subject: form.subject,
      status: form.priority === 'critical' ? 'in_review' : 'open',
      priority: form.priority, createdDate: 'Just now', updatedDate: 'Just now', assignee: null,
    }
    setTickets(prev => [newTicket, ...prev])
    setSuccess(true); scrollTop()
  }

  const ok = canAdvance(step, form)

  const NAV_LEFT = [
    { label: 'Dashboard', active: false, action: () => router.push('/dashboard/agency') },
    { label: 'Campaigns', active: false, action: () => {} },
    { label: 'Support',   active: true,  action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ HEADER — agency pattern ════ */}
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
        <div ref={topRef}/>

        {/* Page title */}
        {!success && (
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard/agency')}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary">
                <ChevLeft s={14}/>
              </button>
              <div>
                <h1 className="text-[clamp(18px,2.6vw,24px)] font-extrabold tracking-[-0.02em] text-ink">Support & Disputes</h1>
                <p className="mt-0.5 text-[13px] text-ink/45">All issues are reviewed and resolved by the Nexfluence team via email.</p>
              </div>
            </div>
            <StepIndicator current={step}/>
          </div>
        )}

        {/* Wizard */}
        <div className={`${!success ? `rounded-2xl border border-primary/10 bg-white p-6 sm:p-8 ${CARD}` : ''}`}>
          {success ? (
            <SuccessScreen
              ticketId={ticketId}
              category={form.category!}
              onDone={() => router.push('/dashboard/agency')}
              onViewTickets={() => {
                setSuccess(false)
                setTimeout(() => ticketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
              }}
            />
          ) : (
            <>
              {step === 1 && <CategoryStep selected={form.category} onSelect={c => { update({ category: c }); setTimeout(next, 220) }}/>}
              {step === 2 && <DetailsStep form={form} onChange={update}/>}
              {step === 3 && <ReviewStep form={form} onEditCategory={() => setStep(1)} onEditDetails={() => setStep(2)}/>}

              {step > 1 && (
                <div className="mt-10 flex items-center justify-between gap-4 border-t border-primary/10 pt-7">
                  <button onClick={back}
                    className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-3 text-[13.5px] font-bold text-ink/55 transition hover:border-primary/30 hover:text-ink">
                    <ChevLeft s={14}/>Back
                  </button>
                  {step < 3 ? (
                    <button onClick={next} disabled={!ok}
                      className={`flex items-center gap-2 rounded-xl px-7 py-3 text-[13.5px] font-bold text-white transition ${ok ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                      Continue<ChevRight s={14}/>
                    </button>
                  ) : (
                    <button onClick={submit} disabled={!ok}
                      className={`flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-[14.5px] font-bold text-white transition ${ok ? `${GRAD_BTN} shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                      <TicketIcon s={16}/>Submit ticket
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Existing tickets */}
        <div className="mt-10" ref={ticketsRef}>
          <ExistingTicketsPanel tickets={tickets}/>
        </div>

      </main>
    </div>
  )
}