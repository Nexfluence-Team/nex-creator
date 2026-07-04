'use client'

import React, {
  useState, useEffect, useRef, useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Admin Disputes — app/admin/disputes/page.tsx
   Nexfluence v4, LIGHT · dark sidebar variant

   THE INSIGHT MOST ADMINS MISS:
   ─────────────────────────────
   Every dispute is a data point on where your platform is broken.
   10 payment disputes in a week = fee routing is confusing.
   8 content disputes = brief quality is low or expectations aren't
   set properly in the campaign builder. 5 contract disputes = your
   standard clause templates have gaps.

   A dispute queue is not customer support overhead. It's the
   highest-signal product feedback loop you have, because users
   who file disputes are motivated enough to tell you exactly what
   broke. Read every single one personally until you hit 1,000 users.

   STATUS MACHINE — 4 states (exactly as specified):
   ─────────────────────────────────────────────────
   pending      Default on creation. SLA clock starts immediately.
                Nobody has reviewed it. Sorted to the top always.

   in_progress  Admin has assigned it and is actively working.
                Owner shown on every row. SLA clock still running.

   disqualified Not a valid dispute. Bad faith, spam, already resolved
                outside platform, wrong venue, duplicate filing.
                User notified. Logged separately for abuse analytics.

   resolved     Closed. Outcome recorded. One of six possible results:
                brand_wins / creator_wins / agency_wins / split /
                platform_decision / withdrawn

   SLA LOGIC:
   critical priority → 24h SLA
   high priority     → 48h SLA
   medium/low        → 72h SLA
   Breach = SLA clock shown in red + dispute floated to top.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

/* ─── Types ──────────────────────────────────────────────────────── */
type DisputeStatus   = 'pending' | 'in_progress' | 'disqualified' | 'resolved'
type DisputeNature   = 'payment' | 'content' | 'contract' | 'conduct' | 'data' | 'other'
type DisputePriority = 'critical' | 'high' | 'medium' | 'low'
type FiledBy         = 'brand' | 'creator' | 'agency'
type ResolutionOutcome =
  | 'brand_wins' | 'creator_wins' | 'agency_wins'
  | 'split' | 'platform_decision' | 'withdrawn' | 'duplicate'

interface DisputeParty {
  name: string
  type: FiledBy | 'platform'
  role: 'filer' | 'respondent' | 'third_party'
}

interface EvidenceFile {
  id: string; name: string; uploadedBy: string; uploadedAt: string; size: string
}

interface InternalNote {
  id: string; author: string; at: string; text: string
}

interface Dispute {
  id:           string           /* TKT-2026-XXXX */
  filedBy:      FiledBy
  filerName:    string
  nature:       DisputeNature
  subtype:      string
  subject:      string
  description:  string
  priority:     DisputePriority
  status:       DisputeStatus
  parties:      DisputeParty[]
  assignedTo:   string | null
  filedAt:      string           /* ISO date string */
  updatedAt:    string
  slaHours:     number
  hoursElapsed: number
  /* Linked platform entities */
  campaignName:  string | null
  contractId:    string | null
  gradeRef:      string | null
  /* Resolution */
  outcome:       ResolutionOutcome | null
  resolution:    string | null
  resolvedAt:    string | null
  /* Evidence + notes */
  evidence:      EvidenceFile[]
  internalNotes: InternalNote[]
}

/* ─── SLA hours by priority ──────────────────────────────────────── */
const SLA_HOURS: Record<DisputePriority, number> = {
  critical: 24, high: 48, medium: 72, low: 120,
}

function slaStatus(dispute: Dispute): 'ok' | 'warning' | 'breached' {
  if (dispute.status === 'resolved' || dispute.status === 'disqualified') return 'ok'
  const pct = dispute.hoursElapsed / dispute.slaHours
  if (pct >= 1)   return 'breached'
  if (pct >= 0.7) return 'warning'
  return 'ok'
}

function slaLabel(dispute: Dispute): string {
  if (dispute.status === 'resolved' || dispute.status === 'disqualified') return '—'
  const remaining = Math.max(0, dispute.slaHours - dispute.hoursElapsed)
  if (remaining === 0) return 'SLA breached'
  if (remaining < 1)   return `${Math.round(remaining * 60)}m left`
  return `${Math.round(remaining)}h left`
}

/* ─── Mock disputes ──────────────────────────────────────────────── */
const INITIAL_DISPUTES: Dispute[] = [
  {
    id: 'TKT-2026-0051', filedBy: 'agency', filerName: 'Baltic Creators Agency',
    nature: 'conduct', subtype: 'Brand bypassing agency',
    subject: 'Forma Fit contacted roster creator Rūta Vaitkutė directly, bypassing agency',
    description: 'Forma Fit\'s marketing team messaged Rūta Vaitkutė via Instagram DM and negotiated a deal directly, circumventing our management agreement clause 2. We have screenshot evidence. This violates our exclusivity clause and constitutes a material breach of the agency-brand management agreement signed on March 15, 2026.',
    priority: 'critical', status: 'in_progress',
    parties: [
      { name: 'Baltic Creators Agency', type: 'agency',  role: 'filer'       },
      { name: 'Forma Fit',              type: 'brand',   role: 'respondent'  },
      { name: 'Rūta Vaitkutė',         type: 'creator', role: 'third_party' },
    ],
    assignedTo: 'Harshul G.',
    filedAt: '2026-06-20', updatedAt: '2026-06-21', slaHours: 24, hoursElapsed: 18,
    campaignName: null, contractId: 'MGT-2026-003', gradeRef: null,
    outcome: null, resolution: null, resolvedAt: null,
    evidence: [
      { id: 'ev1', name: 'Instagram_DM_screenshot.png', uploadedBy: 'Baltic Creators Agency', uploadedAt: 'Jun 20, 16:44', size: '1.2 MB' },
      { id: 'ev2', name: 'Management_Agreement_MGT-2026-003.pdf', uploadedBy: 'Baltic Creators Agency', uploadedAt: 'Jun 20, 16:45', size: '284 KB' },
    ],
    internalNotes: [
      { id: 'n1', author: 'Harshul G.', at: 'Jun 21, 09:12', text: 'Screenshot evidence is clear. DM was sent on June 18, after management agreement was signed. Reaching out to Forma Fit for response. Will hold Forma Fit campaign transactions pending resolution.' },
    ],
  },
  {
    id: 'TKT-2026-0050', filedBy: 'creator', filerName: 'Sandra Liepa',
    nature: 'payment', subtype: 'Overdue payout',
    subject: 'Campaign payout overdue 18 days — Kinetics Electrolyte Hot Yoga',
    description: 'Content was approved on June 14. I have the approval email. Payment was due within 7 days per the contract (June 21). It is now July 2 — 18 days overdue. I have sent 3 messages to the agency with no response. Grade shows the escrow still hasn\'t been released.',
    priority: 'high', status: 'in_progress',
    parties: [
      { name: 'Sandra Liepa',           type: 'creator', role: 'filer'      },
      { name: 'Baltic Creators Agency', type: 'agency',  role: 'respondent' },
      { name: 'Kinetics',               type: 'brand',   role: 'third_party' },
    ],
    assignedTo: 'Harshul G.',
    filedAt: '2026-07-02', updatedAt: '2026-07-02', slaHours: 48, hoursElapsed: 6,
    campaignName: 'Electrolyte Hot Yoga', contractId: 'CTR-AC1-002', gradeRef: 'GRD-PAY-2026-8815',
    outcome: null, resolution: null, resolvedAt: null,
    evidence: [
      { id: 'ev3', name: 'Content_approval_email.pdf', uploadedBy: 'Sandra Liepa', uploadedAt: 'Jul 2, 08:22', size: '156 KB' },
      { id: 'ev4', name: 'Contract_CTR-AC1-002.pdf',   uploadedBy: 'Sandra Liepa', uploadedAt: 'Jul 2, 08:23', size: '211 KB' },
    ],
    internalNotes: [
      { id: 'n2', author: 'Harshul G.', at: 'Jul 2, 09:00', text: 'Grade transaction GRD-PAY-2026-8815 is in pending_auth state. Agency hasn\'t authorised the release. Will contact agency directly and set a 24h deadline — release or escalate.' },
    ],
  },
  {
    id: 'TKT-2026-0049', filedBy: 'brand', filerName: 'Lumora Skincare',
    nature: 'content', subtype: 'Brief violation',
    subject: 'Creator used competitor product in video — clear brief violation',
    description: 'Jonas Petrauskas submitted a content piece for Vitality Stack Q2. At timestamp 0:42, a competitor product (NaturAlly Vitamins) is visible and clearly identifiable on his shelf. Our brief explicitly prohibited mention or visibility of competitor products. We are withholding approval until this is re-shot.',
    priority: 'medium', status: 'pending',
    parties: [
      { name: 'Lumora Skincare',   type: 'brand',   role: 'filer'      },
      { name: 'Jonas Petrauskas', type: 'creator', role: 'respondent' },
    ],
    assignedTo: null,
    filedAt: '2026-07-02', updatedAt: '2026-07-02', slaHours: 72, hoursElapsed: 3,
    campaignName: 'Vitality Stack Q2', contractId: 'CTR-LS-010', gradeRef: null,
    outcome: null, resolution: null, resolvedAt: null,
    evidence: [
      { id: 'ev5', name: 'Video_screenshot_0-42.png', uploadedBy: 'Lumora Skincare', uploadedAt: 'Jul 2, 11:30', size: '892 KB' },
    ],
    internalNotes: [],
  },
  {
    id: 'TKT-2026-0047', filedBy: 'agency', filerName: 'Baltic Creators Agency',
    nature: 'payment', subtype: 'Retainer non-payment',
    subject: 'Kinetics July retainer €1,200 — overdue 12 days',
    description: 'The July 2026 management retainer of €1,200 was due on July 1 per clause 3 of management agreement MGT-2026-001. As of July 2 (12 days after the billing cycle start), no payment has been received. We have sent 2 reminder emails and one in-platform invoice. No response from the Kinetics team.',
    priority: 'high', status: 'in_progress',
    parties: [
      { name: 'Baltic Creators Agency', type: 'agency', role: 'filer'      },
      { name: 'Kinetics',               type: 'brand',  role: 'respondent' },
    ],
    assignedTo: 'Harshul G.',
    filedAt: '2026-06-26', updatedAt: '2026-06-27', slaHours: 48, hoursElapsed: 52,
    campaignName: null, contractId: 'MGT-2026-001', gradeRef: 'GRD-PAY-2026-8801',
    outcome: null, resolution: null, resolvedAt: null,
    evidence: [
      { id: 'ev6', name: 'Retainer_invoice_July2026.pdf', uploadedBy: 'Baltic Creators Agency', uploadedAt: 'Jun 26, 14:00', size: '98 KB' },
    ],
    internalNotes: [
      { id: 'n3', author: 'Harshul G.', at: 'Jun 27, 10:00', text: 'SLA breached. Kinetics\' founder Mārtiņš unreachable by email. Will try direct call. If no response by EOD, will escalate to payment hold on all active Kinetics campaigns.' },
    ],
  },
  {
    id: 'TKT-2026-0044', filedBy: 'creator', filerName: 'Markus Tamm',
    nature: 'contract', subtype: 'Terms dispute',
    subject: 'Contract clause 4 — usage rights duration differs from verbal agreement',
    description: 'The written contract says 12 months usage rights. During the onboarding call with Baltic Creators Agency on March 10, I was told usage rights would be 6 months. I have a recording of the call. I am not willing to grant 12 months and want the contract amended before I proceed with content creation.',
    priority: 'medium', status: 'pending',
    parties: [
      { name: 'Markus Tamm',            type: 'creator', role: 'filer'      },
      { name: 'Baltic Creators Agency', type: 'agency',  role: 'respondent' },
    ],
    assignedTo: null,
    filedAt: '2026-07-01', updatedAt: '2026-07-01', slaHours: 72, hoursElapsed: 28,
    campaignName: 'Race Day Recovery', contractId: 'CTR-RDR-002', gradeRef: null,
    outcome: null, resolution: null, resolvedAt: null,
    evidence: [
      { id: 'ev7', name: 'Call_recording_Mar10.mp3', uploadedBy: 'Markus Tamm', uploadedAt: 'Jul 1, 15:22', size: '18.4 MB' },
      { id: 'ev8', name: 'Contract_CTR-RDR-002.pdf', uploadedBy: 'Markus Tamm', uploadedAt: 'Jul 1, 15:23', size: '204 KB' },
    ],
    internalNotes: [],
  },
  {
    id: 'TKT-2026-0040', filedBy: 'agency', filerName: 'Baltic Creators Agency',
    nature: 'payment', subtype: 'Campaign fee withheld',
    subject: 'Forma Fit — Training Block Q3 cancellation, escrow refund dispute',
    description: 'Forma Fit cancelled Training Block Q3 after content creation had begun. Per clause 5 of the campaign contract, the creator fee and agency fee are non-refundable once content creation commences. Forma Fit is claiming a full refund via Grade escrow. We are contesting this.',
    priority: 'critical', status: 'resolved',
    parties: [
      { name: 'Baltic Creators Agency', type: 'agency',  role: 'filer'       },
      { name: 'Forma Fit',              type: 'brand',   role: 'respondent'  },
      { name: 'Rūta Vaitkutė',         type: 'creator', role: 'third_party' },
    ],
    assignedTo: 'Harshul G.',
    filedAt: '2026-06-18', updatedAt: '2026-06-22', slaHours: 24, hoursElapsed: 24,
    campaignName: 'Training Block Q3', contractId: 'CTR-FF-004', gradeRef: 'GRD-PAY-2026-8782',
    outcome: 'split',
    resolution: 'Platform reviewed the contract and call recording. Content creation had commenced (2 of 4 pieces drafted). Platform decision: 50% of campaign budget (€475) returned to Forma Fit. Remaining 50% split: creator receives €280 for work done, agency receives €195 partial fee. Both parties accepted. Grade escrow released accordingly.',
    resolvedAt: 'Jun 22, 2026',
    evidence: [
      { id: 'ev9', name: 'Training_Block_brief.pdf',    uploadedBy: 'Baltic Creators Agency', uploadedAt: 'Jun 18', size: '188 KB' },
      { id: 'ev10', name: 'Content_draft_evidence.zip', uploadedBy: 'Rūta Vaitkutė',         uploadedAt: 'Jun 19', size: '24.1 MB' },
    ],
    internalNotes: [
      { id: 'n4', author: 'Harshul G.', at: 'Jun 20, 11:00', text: 'Reviewed drafts. Clear that content creation was underway. Contract is unambiguous. Proposing 50/50 split as fair compromise. Will present to both parties.' },
      { id: 'n5', author: 'Harshul G.', at: 'Jun 22, 14:30', text: 'Both parties accepted the split. Grade transaction amended. Closing as resolved.' },
    ],
  },
  {
    id: 'TKT-2026-0038', filedBy: 'creator', filerName: 'Amelia Roze',
    nature: 'conduct', subtype: 'Unprofessional conduct',
    subject: 'Brand representative used threatening language in messages',
    description: 'A member of Kinetics\' team sent me threatening messages after I submitted content they did not like. Specifically: "We will make sure no brand in the Baltic works with you again." This is harassment and a violation of platform conduct rules. I have the message thread.',
    priority: 'high', status: 'disqualified',
    parties: [
      { name: 'Amelia Roze', type: 'creator', role: 'filer'      },
      { name: 'Kinetics',    type: 'brand',   role: 'respondent' },
    ],
    assignedTo: 'Harshul G.',
    filedAt: '2026-06-10', updatedAt: '2026-06-12', slaHours: 48, hoursElapsed: 48,
    campaignName: 'Electrolyte Hot Yoga', contractId: 'CTR-AC1-001', gradeRef: null,
    outcome: 'duplicate',
    resolution: 'Duplicate of TKT-2026-0035 (same message thread, filed twice by filer). Original ticket resolved with written warning issued to Kinetics contact. This ticket disqualified as duplicate.',
    resolvedAt: 'Jun 12, 2026',
    evidence: [],
    internalNotes: [
      { id: 'n6', author: 'Harshul G.', at: 'Jun 12, 09:00', text: 'Same evidence as TKT-0035 which is already resolved. Disqualifying as duplicate. Filer notified.' },
    ],
  },
]

/* ════════════════════════════════════════════════════════════════════
   CONFIG MAPS
   ════════════════════════════════════════════════════════════════════ */
const STATUS_CFG: Record<DisputeStatus, {
  label: string; dot: string; bg: string; text: string; border: string; tabBg: string
}> = {
  pending:      { label: 'Pending',      dot: 'bg-amber-400',   bg: 'bg-amber-50',          text: 'text-amber-700',   border: 'border-amber-200',   tabBg: 'bg-amber-400'   },
  in_progress:  { label: 'In progress',  dot: 'bg-blue-500',    bg: 'bg-blue-50',           text: 'text-blue-700',    border: 'border-blue-200',    tabBg: 'bg-blue-500'    },
  disqualified: { label: 'Disqualified', dot: 'bg-ink/25',      bg: 'bg-surface-sub',       text: 'text-ink/50',      border: 'border-primary/10',  tabBg: 'bg-ink/30'      },
  resolved:     { label: 'Resolved',     dot: 'bg-emerald-400', bg: 'bg-emerald-50',        text: 'text-emerald-700', border: 'border-emerald-200', tabBg: 'bg-emerald-500' },
}

const NATURE_CFG: Record<DisputeNature, { label: string; icon: string; bg: string; text: string }> = {
  payment:  { label: 'Payment',  icon: '💸', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  content:  { label: 'Content',  icon: '🎬', bg: 'bg-violet-50',  text: 'text-violet-700'  },
  contract: { label: 'Contract', icon: '📋', bg: 'bg-blue-50',    text: 'text-blue-700'    },
  conduct:  { label: 'Conduct',  icon: '⚠️', bg: 'bg-rose-50',    text: 'text-rose-700'    },
  data:     { label: 'Data',     icon: '📊', bg: 'bg-sky-50',     text: 'text-sky-700'     },
  other:    { label: 'Other',    icon: '❓', bg: 'bg-surface-sub', text: 'text-ink/55'      },
}

const PRIORITY_CFG: Record<DisputePriority, { label: string; dot: string; bg: string; text: string }> = {
  critical: { label: 'Critical', dot: 'bg-rose-500',   bg: 'bg-rose-50',    text: 'text-rose-700'    },
  high:     { label: 'High',     dot: 'bg-orange-500', bg: 'bg-orange-50',  text: 'text-orange-700'  },
  medium:   { label: 'Medium',   dot: 'bg-amber-400',  bg: 'bg-amber-50',   text: 'text-amber-700'   },
  low:      { label: 'Low',      dot: 'bg-sky-400',    bg: 'bg-sky-50',     text: 'text-sky-700'     },
}

const PARTY_TYPE_CFG: Record<string, { bg: string; text: string }> = {
  brand:    { bg: 'bg-blue-50',     text: 'text-blue-700'    },
  creator:  { bg: 'bg-violet-50',   text: 'text-violet-700'  },
  agency:   { bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  platform: { bg: 'bg-ink/[0.07]',  text: 'text-ink/60'      },
}

const OUTCOME_LABELS: Record<ResolutionOutcome, string> = {
  brand_wins:        'Brand prevails',
  creator_wins:      'Creator prevails',
  agency_wins:       'Agency prevails',
  split:             'Negotiated split',
  platform_decision: 'Platform decision',
  withdrawn:         'Withdrawn by filer',
  duplicate:         'Duplicate filing',
}

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function CheckIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 14 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function ClockIcon({ s = 13 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function AlertIcon({ s = 15 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function UserIcon({ s = 13 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20v-1a8 8 0 0116 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function FileIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function PaperclipIcon({ s = 13 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function NoteIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LinkIcon({ s = 13 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SearchIcon({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function SendIcon({ s = 13 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function DashIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> }
function UsersIcon({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 21v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ActivityIcon({ s = 16 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TagIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg> }
function MegaphoneIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 11v2a8 8 0 008 8v0M3 11a8 8 0 018-8v0M3 11h18M21 11v2M11 19l-2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 7c0 0-3 2-8 2S5 7 5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ZapIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LogoutIcon({ s = 15 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 18 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function ChevronIcon({ s = 14, dir = 'right' }: { s?: number; dir?: 'left' | 'right' | 'down' }) {
  const paths = { right: 'M9 18l6-6-6-6', left: 'M15 18l-6-6 6-6', down: 'M6 9l6 6 6-6' }
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d={paths[dir]} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   SLA BADGE
   ════════════════════════════════════════════════════════════════════ */
function SLABadge({ dispute }: { dispute: Dispute }) {
  const ss = slaStatus(dispute)
  const label = slaLabel(dispute)
  if (dispute.status === 'resolved' || dispute.status === 'disqualified')
    return <span className="text-[11px] text-ink/30">—</span>
  return (
    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${
      ss === 'breached' ? 'bg-rose-500 text-white animate-pulse' :
      ss === 'warning'  ? 'bg-amber-50 text-amber-700 border border-amber-200' :
      'bg-emerald-50 text-emerald-700'}`}>
      <ClockIcon s={10}/>{label}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DISPUTE DETAIL MODAL
   ════════════════════════════════════════════════════════════════════ */
function DetailModal({ dispute, onClose, onStatusChange, onAssign, onAddNote, onResolve, onDisqualify }: {
  dispute: Dispute | null
  onClose: () => void
  onStatusChange: (id: string, status: DisputeStatus) => void
  onAssign:    (id: string, who: string) => void
  onAddNote:   (id: string, text: string) => void
  onResolve:   (id: string, outcome: ResolutionOutcome, text: string) => void
  onDisqualify:(id: string, reason: string) => void
}) {
  const [activeTab,    setActiveTab]    = useState<'overview' | 'evidence' | 'notes' | 'resolve'>('overview')
  const [noteText,     setNoteText]     = useState('')
  const [resolveOutcome, setResolveOutcome] = useState<ResolutionOutcome>('split')
  const [resolveText,  setResolveText]  = useState('')
  const [disqualReason,setDisqualReason]= useState('')
  const [saving,       setSaving]       = useState(false)

  useEffect(() => {
    if (!dispute) return
    setActiveTab('overview'); setNoteText(''); setResolveText(''); setDisqualReason('')
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [dispute?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!dispute) return null

  const sc = STATUS_CFG[dispute.status]
  const nc = NATURE_CFG[dispute.nature]
  const pc = PRIORITY_CFG[dispute.priority]

  const isPending    = dispute.status === 'pending'
  const isInProgress = dispute.status === 'in_progress'
  const isOpen       = isPending || isInProgress

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    onAddNote(dispute.id, noteText.trim())
    setNoteText('')
    setSaving(false)
  }

  const handleResolve = async () => {
    if (!resolveText.trim()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    onResolve(dispute.id, resolveOutcome, resolveText.trim())
    setSaving(false)
    onClose()
  }

  const handleDisqualify = async () => {
    if (!disqualReason.trim()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    onDisqualify(dispute.id, disqualReason.trim())
    setSaving(false)
    onClose()
  }

  const lbl = 'mb-1.5 block text-[11px] font-black uppercase tracking-[0.14em] text-ink/35'

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" onClick={onClose}/>

      <div className={`relative z-10 flex w-full max-w-[760px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ height: 'min(94vh, 820px)' }}>

        {/* Priority stripe */}
        <div className={`h-1.5 w-full ${pc.dot.replace('bg-', 'bg-').replace('/25', '').replace('/50', '')}`}
          style={{ background: dispute.priority === 'critical' ? '#ef4444' : dispute.priority === 'high' ? '#f97316' : dispute.priority === 'medium' ? '#f59e0b' : '#38bdf8' }}/>

        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-primary/10 px-6 py-5">
          <div className="min-w-0 flex-1 pr-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <code className={`rounded-lg px-2.5 py-0.5 font-mono text-[12px] font-bold ${GRAD_TXT}`}>{dispute.id}</code>
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${isOpen ? 'animate-pulse' : ''}`}/>{sc.label}
              </span>
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${pc.bg} ${pc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`}/>{pc.label}
              </span>
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${nc.bg} ${nc.text}`}>
                {nc.icon} {nc.label}
              </span>
            </div>
            <h2 className="text-[15px] font-extrabold leading-snug text-ink">{dispute.subject}</h2>
            <p className="mt-1 text-[12px] text-ink/40">Filed by <span className="font-bold text-ink/60">{dispute.filerName}</span> · {dispute.filedAt}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <SLABadge dispute={dispute}/>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex flex-shrink-0 border-b border-primary/8 bg-surface-sub/40 px-4">
          {([
            { id: 'overview' as const, label: 'Overview' },
            { id: 'evidence' as const, label: `Evidence (${dispute.evidence.length})` },
            { id: 'notes'    as const, label: `Notes (${dispute.internalNotes.length})` },
            { id: 'resolve'  as const, label: isOpen ? 'Resolve' : 'Resolution',
              hide: dispute.status === 'disqualified' },
          ] as const).filter(t => !('hide' in t && t.hide)).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-[13px] font-semibold transition ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-ink/45 hover:text-ink/70'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-5 p-6">
              {/* Parties */}
              <div>
                <p className={lbl}>Parties</p>
                <div className="flex flex-col gap-2">
                  {dispute.parties.map((p, i) => {
                    const pc2 = PARTY_TYPE_CFG[p.type] ?? PARTY_TYPE_CFG['platform']!
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-primary/8 bg-surface-sub/40 px-4 py-3">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${pc2.bg} ${pc2.text}`}>
                          {p.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-ink truncate">{p.name}</p>
                          <p className="text-[11px] text-ink/40 capitalize">{p.type}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold capitalize ${
                          p.role === 'filer' ? 'bg-primary/[0.08] text-primary' :
                          p.role === 'respondent' ? 'bg-rose-50 text-rose-600' :
                          'bg-surface-sub text-ink/45'}`}>
                          {p.role.replace('_', ' ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <p className={lbl}>Description</p>
                <div className="rounded-xl border border-primary/8 bg-surface-sub/40 px-4 py-4">
                  <p className="text-[13.5px] leading-[1.8] text-ink/70">{dispute.description}</p>
                </div>
              </div>

              {/* Linked entities */}
              {(dispute.campaignName || dispute.contractId || dispute.gradeRef) && (
                <div>
                  <p className={lbl}>Linked to</p>
                  <div className="flex flex-wrap gap-2">
                    {dispute.campaignName && (
                      <a href="#" className="flex items-center gap-2 rounded-xl border border-primary/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-primary transition hover:bg-primary/[0.04]">
                        <ActivityIcon s={13}/>Campaign: {dispute.campaignName}
                      </a>
                    )}
                    {dispute.contractId && (
                      <a href="#" className="flex items-center gap-2 rounded-xl border border-primary/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-primary transition hover:bg-primary/[0.04]">
                        <FileIcon s={13}/>Contract: {dispute.contractId}
                      </a>
                    )}
                    {dispute.gradeRef && (
                      <a href="#" className="flex items-center gap-2 rounded-xl border border-primary/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-primary transition hover:bg-primary/[0.04]">
                        <EuroIcon s={13}/>Grade: {dispute.gradeRef}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={lbl}>Assigned to</p>
                  <div className="flex gap-2">
                    <div className={`flex h-10 flex-1 items-center gap-2 rounded-xl border border-primary/10 bg-surface-sub/40 px-3.5 text-[13px] font-semibold ${dispute.assignedTo ? 'text-ink' : 'text-ink/35 italic'}`}>
                      <UserIcon s={13}/>{dispute.assignedTo ?? 'Unassigned'}
                    </div>
                    {isOpen && !dispute.assignedTo && (
                      <button onClick={() => onAssign(dispute.id, 'Harshul G.')}
                        className={`rounded-xl px-4 py-2 text-[12.5px] font-bold text-white ${GRAD_BTN}`}>
                        Assign me
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className={lbl}>Subtype</p>
                  <div className="flex h-10 items-center rounded-xl border border-primary/10 bg-surface-sub/40 px-3.5 text-[13px] text-ink/70">
                    {dispute.subtype}
                  </div>
                </div>
              </div>

              {/* Resolution block — for closed disputes */}
              {(dispute.status === 'resolved' || dispute.status === 'disqualified') && dispute.resolution && (
                <div className={`rounded-2xl border p-5 ${dispute.status === 'resolved' ? 'border-emerald-200 bg-emerald-50' : 'border-primary/10 bg-surface-sub/40'}`}>
                  <div className="mb-2 flex items-center gap-2">
                    {dispute.outcome && <span className="rounded-full bg-white border border-primary/10 px-2.5 py-0.5 text-[11.5px] font-bold text-ink">{OUTCOME_LABELS[dispute.outcome]}</span>}
                    <span className="text-[11px] text-ink/35">{dispute.resolvedAt}</span>
                  </div>
                  <p className="text-[13.5px] leading-[1.75] text-ink/70">{dispute.resolution}</p>
                </div>
              )}
            </div>
          )}

          {/* ── EVIDENCE ── */}
          {activeTab === 'evidence' && (
            <div className="p-6 space-y-4">
              {dispute.evidence.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PaperclipIcon s={32}/>
                  <p className="mt-3 text-[13.5px] font-bold text-ink/45">No evidence uploaded yet</p>
                  <p className="text-[12px] text-ink/30 mt-1">Files uploaded by disputing parties will appear here.</p>
                </div>
              ) : dispute.evidence.map(ev => (
                <div key={ev.id} className={`flex items-center gap-4 rounded-2xl border border-primary/10 bg-white px-5 py-4 ${CARD}`}>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                    <PaperclipIcon s={18}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink truncate">{ev.name}</p>
                    <p className="text-[11.5px] text-ink/40">{ev.uploadedBy} · {ev.uploadedAt} · {ev.size}</p>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-primary/15 px-3 py-1.5 text-[12px] font-bold text-primary transition hover:bg-primary/[0.04]">
                    View
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── INTERNAL NOTES ── */}
          {activeTab === 'notes' && (
            <div className="flex flex-col h-full p-6 gap-4">
              <div className="flex-1 space-y-3">
                {dispute.internalNotes.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <NoteIcon s={28}/>
                    <p className="mt-3 text-[13px] font-semibold text-ink/40">No internal notes yet</p>
                    <p className="text-[12px] text-ink/28 mt-1">Notes are admin-only and never visible to disputing parties.</p>
                  </div>
                )}
                {dispute.internalNotes.map(note => (
                  <div key={note.id} className={`rounded-2xl border border-primary/10 bg-white p-4 ${CARD}`}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black text-white ${GRAD_BTN}`}>
                        {note.author.split(' ').map(w => w[0]).join('')}
                      </div>
                      <span className="text-[12.5px] font-bold text-ink">{note.author}</span>
                      <span className="text-[11px] text-ink/35">{note.at}</span>
                      <span className="ml-auto rounded-md bg-amber-50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] text-amber-600">Admin only</span>
                    </div>
                    <p className="text-[13px] leading-[1.7] text-ink/70">{note.text}</p>
                  </div>
                ))}
              </div>
              {/* Add note input */}
              {isOpen && (
                <div className="flex gap-2">
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2}
                    placeholder="Add an internal note… (admin-only, never shown to parties)"
                    className={`${INP} resize-none leading-relaxed text-[13px]`}/>
                  <button onClick={handleAddNote} disabled={!noteText.trim() || saving}
                    className={`flex-shrink-0 self-end flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition ${noteText.trim() && !saving ? `${GRAD_BTN} hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                    <SendIcon s={13}/>Add
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── RESOLVE ── */}
          {activeTab === 'resolve' && isOpen && (
            <div className="p-6 space-y-5">
              <div className="rounded-2xl border border-primary/10 bg-surface-sub/40 p-4">
                <p className="text-[12.5px] text-ink/55 leading-[1.6]">
                  <span className="font-bold text-ink">Recording the outcome is permanent.</span> Both disputing parties will receive an email with the resolution summary and the outcome field you choose. The Grade transaction (if linked) can be updated accordingly.
                </p>
              </div>

              {/* Mark in-progress */}
              {isPending && (
                <div>
                  <p className={lbl}>Start working this dispute</p>
                  <button onClick={() => { onAssign(dispute.id, 'Harshul G.'); onStatusChange(dispute.id, 'in_progress') }}
                    className={`flex items-center gap-2 rounded-xl ${GRAD_BTN} px-5 py-3 text-[13.5px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
                    Mark in progress & assign to me
                  </button>
                </div>
              )}

              {/* Resolution outcome */}
              <div>
                <p className={lbl}>Resolution outcome *</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(Object.keys(OUTCOME_LABELS) as ResolutionOutcome[]).map(outcome => (
                    <button key={outcome} type="button" onClick={() => setResolveOutcome(outcome)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left text-[12px] font-bold transition ${resolveOutcome === outcome ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/12 bg-white text-ink/55 hover:border-primary/22'}`}>
                      {OUTCOME_LABELS[outcome]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution text */}
              <div>
                <p className={lbl}>Resolution summary * (sent to all parties)</p>
                <textarea className={`${INP} min-h-[120px] resize-y leading-relaxed`} rows={5}
                  value={resolveText} onChange={e => setResolveText(e.target.value)}
                  placeholder="Describe the decision and reasoning. This is the permanent record — write it for a future audit, not just for the parties involved."/>
              </div>

              <button onClick={handleResolve} disabled={!resolveText.trim() || saving}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold text-white transition ${resolveText.trim() && !saving ? 'bg-emerald-500 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.45)] hover:-translate-y-0.5' : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                {saving ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Saving…</> : <><CheckIcon s={14}/>Mark as resolved</>}
              </button>

              {/* Disqualify */}
              <div className="mt-2 border-t border-primary/10 pt-4">
                <p className={`${lbl} mb-2`}>Or disqualify this dispute</p>
                <textarea className={`${INP} resize-none text-[13px]`} rows={2}
                  value={disqualReason} onChange={e => setDisqualReason(e.target.value)}
                  placeholder="Reason for disqualification (bad faith, duplicate, wrong venue, spam…)"/>
                <button onClick={handleDisqualify} disabled={!disqualReason.trim() || saving}
                  className={`mt-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] font-bold text-rose-600 transition ${disqualReason.trim() ? 'hover:bg-rose-100' : 'cursor-not-allowed opacity-40'}`}>
                  <XIcon s={13}/>Disqualify dispute
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
/* ════════════════════════════════════════════════════════════════════
   DISPUTE TABLE ROW
   ════════════════════════════════════════════════════════════════════ */
function DisputeRow({ dispute, onClick, onAssignMe, onStatusChange }: {
  dispute: Dispute
  onClick:        () => void
  onAssignMe:     (id: string) => void
  onStatusChange: (id: string, status: DisputeStatus) => void
}) {
  const sc  = STATUS_CFG[dispute.status]
  const nc  = NATURE_CFG[dispute.nature]
  const pc  = PRIORITY_CFG[dispute.priority]
  const ss  = slaStatus(dispute)
  const filer = dispute.parties.find(p => p.role === 'filer')
  const respondent = dispute.parties.find(p => p.role === 'respondent')
  const isOpen = dispute.status === 'pending' || dispute.status === 'in_progress'

  return (
    <tr onClick={onClick}
      className={`group border-b border-primary/5 transition cursor-pointer ${
        ss === 'breached' && isOpen ? 'bg-rose-50/50 hover:bg-rose-50' :
        dispute.priority === 'critical' && isOpen ? 'bg-rose-50/20 hover:bg-rose-50/40' :
        'hover:bg-primary/[0.015]'
      }`}>

      {/* ID + subject */}
      <td className="py-3.5 pl-5 pr-3" style={{ minWidth: 240 }}>
        <code className={`block text-[11.5px] font-bold font-mono ${GRAD_TXT} mb-0.5`}>{dispute.id}</code>
        <p className="text-[13px] font-semibold text-ink line-clamp-1">{dispute.subject}</p>
        <p className="text-[11px] text-ink/35 mt-0.5">{dispute.filedAt} · {dispute.filerName}</p>
      </td>

      {/* Nature */}
      <td className="px-3 py-3.5">
        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${nc.bg} ${nc.text}`}>
          {nc.icon} {nc.label}
        </span>
        <p className="mt-1 text-[10.5px] text-ink/35 max-w-[120px] truncate">{dispute.subtype}</p>
      </td>

      {/* Parties */}
      <td className="px-3 py-3.5" style={{ minWidth: 160 }}>
        <div className="space-y-1">
          {filer && (
            <p className="flex items-center gap-1.5 text-[12px] text-ink/60">
              <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-black uppercase ${PARTY_TYPE_CFG[filer.type]?.bg ?? ''} ${PARTY_TYPE_CFG[filer.type]?.text ?? ''}`}>{filer.type}</span>
              <span className="font-semibold truncate max-w-[100px]">{filer.name}</span>
            </p>
          )}
          {respondent && (
            <p className="flex items-center gap-1.5 text-[12px] text-ink/40">
              <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-black uppercase ${PARTY_TYPE_CFG[respondent.type]?.bg ?? ''} ${PARTY_TYPE_CFG[respondent.type]?.text ?? ''}`}>{respondent.type}</span>
              <span className="truncate max-w-[100px]">{respondent.name}</span>
            </p>
          )}
        </div>
      </td>

      {/* Priority + Status */}
      <td className="px-3 py-3.5">
        <div className="space-y-1.5">
          <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${isOpen ? 'animate-pulse' : ''}`}/>{sc.label}
          </span>
          <span className={`flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${pc.bg} ${pc.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`}/>{pc.label}
          </span>
        </div>
      </td>

      {/* SLA */}
      <td className="px-3 py-3.5">
        <SLABadge dispute={dispute}/>
      </td>

      {/* Assigned */}
      <td className="px-3 py-3.5">
        {dispute.assignedTo
          ? <span className="text-[12px] font-semibold text-ink/60">{dispute.assignedTo}</span>
          : <span className="text-[11px] italic text-ink/28">Unassigned</span>}
      </td>

      {/* Actions */}
      <td className="py-3.5 pl-3 pr-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          {dispute.status === 'pending' && !dispute.assignedTo && (
            <button onClick={() => { onAssignMe(dispute.id); onStatusChange(dispute.id, 'in_progress') }}
              className={`flex items-center gap-1.5 rounded-lg ${GRAD_BTN} px-3 py-1.5 text-[11.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.4)] transition hover:-translate-y-0.5`}>
              Pick up
            </button>
          )}
          <button onClick={onClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/12 bg-white text-ink/40 transition hover:border-primary/25 hover:text-primary">
            <ChevronIcon s={13} dir="right"/>
          </button>
        </div>
      </td>
    </tr>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function AdminDisputesPage() {
  const router = useRouter()

  const [disputes,    setDisputes]    = useState<Dispute[]>(INITIAL_DISPUTES)
  const [activeTab,   setActiveTab]   = useState<DisputeStatus | 'all'>('all')
  const [detailDisp,  setDetailDisp]  = useState<Dispute | null>(null)
  const [search,      setSearch]      = useState('')
  const [natFilter,   setNatFilter]   = useState<DisputeNature | 'all'>('all')
  const [toast,       setToast]       = useState<{ msg: string; type: 'ok' | 'warn' } | null>(null)

  const showToast = useCallback((msg: string, type: 'ok' | 'warn' = 'ok') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3200)
  }, [])

  /* Derived counts */
  const counts: Record<DisputeStatus | 'all', number> = {
    all:          disputes.length,
    pending:      disputes.filter(d => d.status === 'pending').length,
    in_progress:  disputes.filter(d => d.status === 'in_progress').length,
    disqualified: disputes.filter(d => d.status === 'disqualified').length,
    resolved:     disputes.filter(d => d.status === 'resolved').length,
  }
  const slaBreached = disputes.filter(d => slaStatus(d) === 'breached').length
  const avgResolutionHours = (() => {
    const res = disputes.filter(d => d.status === 'resolved')
    if (!res.length) return null
    return Math.round(res.reduce((s, d) => s + d.hoursElapsed, 0) / res.length)
  })()

  /* Filtered */
  const visible = disputes.filter(d => {
    if (activeTab !== 'all' && d.status !== activeTab) return false
    if (natFilter !== 'all' && d.nature !== natFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return d.id.toLowerCase().includes(q) ||
        d.subject.toLowerCase().includes(q) ||
        d.filerName.toLowerCase().includes(q) ||
        d.parties.some(p => p.name.toLowerCase().includes(q))
    }
    return true
  }).sort((a, b) => {
    /* Pending critical first, then SLA-breached, then by filed date */
    if (a.status === 'pending'     && b.status !== 'pending')     return -1
    if (b.status === 'pending'     && a.status !== 'pending')     return 1
    if (a.priority === 'critical'  && b.priority !== 'critical')  return -1
    if (b.priority === 'critical'  && a.priority !== 'critical')  return 1
    return slaStatus(b) === 'breached' ? 1 : slaStatus(a) === 'breached' ? -1 : 0
  })

  /* Mutators */
  const mutate = (id: string, patch: Partial<Dispute>) => {
    setDisputes(prev => prev.map(d => d.id !== id ? d : { ...d, ...patch }))
    setDetailDisp(prev => prev?.id === id ? { ...prev, ...patch } : prev)
  }

  const handleStatusChange = (id: string, status: DisputeStatus) => {
    mutate(id, { status, updatedAt: 'Just now' })
    showToast(`Dispute marked ${STATUS_CFG[status].label}`)
  }

  const handleAssign = (id: string, who: string) => {
    mutate(id, { assignedTo: who, status: 'in_progress', updatedAt: 'Just now' })
    showToast(`Assigned to ${who} — status: In progress`)
  }

  const handleAddNote = (id: string, text: string) => {
    const note: InternalNote = { id: `n${Date.now()}`, author: 'Harshul G.', at: 'Just now', text }
    setDisputes(prev => prev.map(d => d.id !== id ? d : { ...d, internalNotes: [...d.internalNotes, note], updatedAt: 'Just now' }))
    setDetailDisp(prev => prev?.id === id ? { ...prev, internalNotes: [...prev.internalNotes, note] } : prev)
    showToast('Internal note added')
  }

  const handleResolve = (id: string, outcome: ResolutionOutcome, resolution: string) => {
    mutate(id, { status: 'resolved', outcome, resolution, resolvedAt: 'Just now', updatedAt: 'Just now' })
    showToast('Dispute resolved — parties notified')
  }

  const handleDisqualify = (id: string, reason: string) => {
    mutate(id, { status: 'disqualified', outcome: 'duplicate', resolution: reason, resolvedAt: 'Just now', updatedAt: 'Just now' })
    showToast('Dispute disqualified — filer notified', 'warn')
  }

  const TABS: { id: DisputeStatus | 'all'; label: string }[] = [
    { id: 'all',          label: 'All disputes'    },
    { id: 'pending',      label: 'Pending'         },
    { id: 'in_progress',  label: 'In progress'     },
    { id: 'resolved',     label: 'Resolved'        },
    { id: 'disqualified', label: 'Disqualified'    },
  ]

  return (
    <div className="flex min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ TOAST ════ */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[900] -translate-x-1/2">
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-white shadow-lg ${toast.type === 'ok' ? `${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]` : 'bg-amber-500'}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
              {toast.type === 'ok' ? <CheckIcon s={13}/> : <AlertIcon s={13}/>}
            </span>
            <p className="text-[13.5px] font-bold">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* ════ DETAIL MODAL ════ */}
      <DetailModal
        dispute={detailDisp}
        onClose={() => setDetailDisp(null)}
        onStatusChange={handleStatusChange}
        onAssign={handleAssign}
        onAddNote={handleAddNote}
        onResolve={handleResolve}
        onDisqualify={handleDisqualify}
      />

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
            { icon: <DashIcon s={15}/>,      label: 'Dashboard',     href: '/admin/dashboard',     badge: 0 },
            { icon: <UsersIcon s={15}/>,     label: 'Users',         href: '/admin/users',         badge: 0 },
            { icon: <ActivityIcon s={15}/>,  label: 'Campaigns',     href: '/admin/campaigns',     badge: 0 },
            { icon: <EuroIcon s={15}/>,      label: 'Transactions',  href: '/admin/transactions',  badge: 0 },
            { icon: <TicketIcon s={15}/>,    label: 'Disputes',      href: '/admin/disputes',      badge: counts.pending + counts.in_progress, active: true },
            { icon: <FileIcon s={15}/>,      label: 'Resources',     href: '/admin/resources',     badge: 0 },
            { icon: <MegaphoneIcon s={15}/>, label: 'Announcements', href: '/admin/announcements', badge: 0 },
            { icon: <TagIcon s={15}/>,       label: 'Coupons',       href: '/admin/coupons',       badge: 0 },
            { icon: <ZapIcon s={15}/>,       label: 'System',        href: '/admin/system',        badge: 0 },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${(item as any).active ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]` : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'}`}>
              {item.icon}{item.label}
              {item.badge > 0 && (
                <span className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white ${(item as any).active ? 'bg-white/25' : 'bg-amber-400'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/[0.07] px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${GRAD_BTN}`}>H</div>
            <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-bold text-white">Harshul G.</p><p className="text-[11px] text-white/35">Founder</p></div>
            <button onClick={() => router.push('/admin/login')} className="text-white/30 transition hover:text-white/60"><LogoutIcon s={15}/></button>
          </div>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ════ TOPBAR ════ */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-primary/10 bg-white/95 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h1 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">Disputes</h1>
            {counts.pending > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"/>
                {counts.pending} pending
              </span>
            )}
            {slaBreached > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-rose-500 px-2.5 py-0.5 text-[11.5px] font-bold text-white animate-pulse">
                <AlertIcon s={11}/>{slaBreached} SLA breached
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={14}/></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, subject, party…"
                className="w-[220px] rounded-xl border border-primary/12 bg-surface-sub py-2 pl-9 pr-3.5 text-[13px] outline-none placeholder:text-ink/28 focus:border-primary/30 focus:w-[260px] transition-all"/>
            </div>
            <select value={natFilter} onChange={e => setNatFilter(e.target.value as DisputeNature | 'all')}
              className="rounded-xl border border-primary/12 bg-white px-3.5 py-2 text-[13px] font-semibold text-ink/65 outline-none">
              <option value="all">All categories</option>
              {(Object.keys(NATURE_CFG) as DisputeNature[]).map(n =>
                <option key={n} value={n}>{NATURE_CFG[n].icon} {NATURE_CFG[n].label}</option>
              )}
            </select>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-6 py-6">

          {/* ── SLA breach alert ── */}
          {slaBreached > 0 && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5">
              <AlertIcon s={17}/>
              <p className="flex-1 text-[13px] font-bold text-rose-700">
                {slaBreached} dispute{slaBreached !== 1 ? 's' : ''} have breached SLA — response time commitments have been missed. Assign and respond now.
              </p>
              <button onClick={() => setActiveTab('in_progress')} className="text-[12.5px] font-bold text-rose-600 underline underline-offset-2">
                View in-progress
              </button>
            </div>
          )}

          {/* ── KPI strip ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Open disputes',        value: String(counts.pending + counts.in_progress), accent: true,  sub: `${counts.pending} pending · ${counts.in_progress} in progress` },
              { label: 'SLA breached',         value: String(slaBreached),                         accent: false, sub: 'Response time missed', warn: slaBreached > 0 },
              { label: 'Resolved',             value: String(counts.resolved),                     accent: false, sub: 'All time' },
              { label: 'Avg resolution time',  value: avgResolutionHours ? `${avgResolutionHours}h` : '—', accent: false, sub: 'Based on closed disputes' },
            ].map(s => (
              <div key={s.label} className={`flex flex-col gap-2 rounded-2xl border p-5 ${s.accent ? `${GRAD_BTN} border-transparent shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]` : s.warn && slaBreached > 0 ? 'border-rose-200 bg-rose-50' : `border-primary/10 bg-white ${CARD}`}`}>
                <div className={`text-[26px] font-black tracking-[-0.03em] ${s.accent ? 'text-white' : s.warn && slaBreached > 0 ? 'text-rose-700' : 'text-ink'}`}>{s.value}</div>
                <div className={`text-[12.5px] font-semibold ${s.accent ? 'text-white/70' : s.warn && slaBreached > 0 ? 'text-rose-600' : 'text-ink/50'}`}>{s.label}</div>
                <div className={`text-[11px] ${s.accent ? 'text-white/45' : 'text-ink/35'}`}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Status tabs ── */}
          <div className="mb-4 flex items-center gap-1 overflow-x-auto rounded-2xl border border-primary/10 bg-white p-1.5 w-fit">
            {TABS.map(tab => {
              const active = activeTab === tab.id
              const count  = counts[tab.id]
              const tabSc  = tab.id !== 'all' ? STATUS_CFG[tab.id] : null
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition whitespace-nowrap ${active ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.4)]` : 'text-ink/50 hover:text-ink/80 hover:bg-surface-sub'}`}>
                  {tab.label}
                  <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-black ${active ? 'bg-white/25 text-white' : 'bg-primary/[0.08] text-primary'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Disputes table ── */}
          <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-primary/8 bg-surface-sub/60">
                    {['Ticket / Subject', 'Category', 'Parties', 'Status', 'SLA', 'Assigned', 'Actions'].map((h, i) => (
                      <th key={h} className={`py-3 text-left text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35 ${i === 0 ? 'pl-5 pr-3' : i === 6 ? 'pl-3 pr-5' : 'px-3'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${GRAD_BTN}`}><TicketIcon s={26}/></div>
                        <p className="text-[14px] font-bold text-ink/45">No disputes match</p>
                        <button onClick={() => { setSearch(''); setNatFilter('all'); setActiveTab('all') }}
                          className="text-[13px] font-bold text-primary hover:underline">Clear filters</button>
                      </div>
                    </td></tr>
                  ) : visible.map(d => (
                    <DisputeRow key={d.id} dispute={d}
                      onClick={() => setDetailDisp(d)}
                      onAssignMe={id => handleAssign(id, 'Harshul G.')}
                      onStatusChange={handleStatusChange}/>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-primary/8 bg-surface-sub/40 px-5 py-3">
              <p className="text-[12px] text-ink/40">{visible.length} of {disputes.length} disputes · click any row to open</p>
              <p className="text-[12px] text-ink/35">
                Nature breakdown: {(Object.keys(NATURE_CFG) as DisputeNature[]).map(n => {
                  const c = disputes.filter(d => d.nature === n).length
                  return c > 0 ? `${NATURE_CFG[n].icon} ${c}` : null
                }).filter(Boolean).join('  ')}
              </p>
            </div>
          </div>

          {/* ── Pattern insight card ── */}
          <div className={`mt-6 rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${GRAD_BTN}`}><AlertIcon s={17}/></div>
              <div>
                <h3 className="text-[14px] font-extrabold text-ink">Dispute pattern analysis</h3>
                <p className="text-[12px] text-ink/40">What the dispute queue is telling you about the product</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  nature: 'payment' as DisputeNature,
                  count: disputes.filter(d => d.nature === 'payment').length,
                  insight: 'Fee routing confusion or agency payment latency. Review agency_collects vs brand_direct clarity in the Campaign Builder.',
                },
                {
                  nature: 'conduct' as DisputeNature,
                  count: disputes.filter(d => d.nature === 'conduct').length,
                  insight: 'Agency exclusivity clauses being violated. Consider a platform-level "bypass detection" notification when a brand DMs a managed creator directly.',
                },
                {
                  nature: 'contract' as DisputeNature,
                  count: disputes.filter(d => d.nature === 'contract').length,
                  insight: 'Usage rights duration mismatch between verbal and written. The Contract Builder\'s usage rights field needs a default + mandatory explicit confirmation.',
                },
              ].map(p => {
                const nc2 = NATURE_CFG[p.nature]
                return (
                  <div key={p.nature} className={`rounded-xl border p-4 space-y-2 ${nc2.bg} border-primary/10`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${nc2.text}`}>{nc2.icon} {nc2.label}</span>
                      <span className={`text-[18px] font-black ${nc2.text}`}>{p.count}</span>
                    </div>
                    <p className="text-[12px] leading-[1.6] text-ink/60">{p.insight}</p>
                  </div>
                )
              })}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}