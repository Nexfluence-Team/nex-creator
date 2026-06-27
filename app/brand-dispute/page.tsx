'use client'

import { useState, useRef, useEffect, type ReactNode, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Support & Disputes — app/dispute/new/page.tsx  (Nexfluence v4)
   Six ticket categories · adaptive context forms · evidence upload ·
   success screen with ticket ID · existing tickets panel.
   All disputes are resolved by the Nexfluence team via email.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
const LBL      = 'mb-1.5 block text-[12px] font-bold text-ink/50'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type CategoryId   = 'creator_dispute' | 'payment_issue' | 'incorrect_data' | 'contract_issue' | 'feature_request' | 'general'
type Priority     = 'low' | 'medium' | 'high' | 'critical'
type TicketStatus = 'open' | 'in_review' | 'resolved' | 'closed'

interface TicketFormData {
  category: CategoryId | null
  priority: Priority
  subject: string
  description: string
  /* Creator dispute */
  creatorName: string
  creatorHandle: string
  campaignName: string
  disputeSubtype: string
  /* Payment */
  paymentAmount: string
  paymentDate: string
  paymentRef: string
  /* Data error */
  dataField: string
  reportedValue: string
  expectedValue: string
  dataSource: string
  /* Contract */
  contractId: string
  contractIssueType: string
  /* Feature request */
  featureArea: string
  featureDescription: string
  /* Evidence */
  files: File[]
}

interface ExistingTicket {
  id: string
  category: CategoryId
  subject: string
  status: TicketStatus
  priority: Priority
  createdDate: string
  updatedDate: string
  assignee: string | null
}

/* ════════════════════════════════════════════════════════════════════
   CATEGORY CONFIG
   ════════════════════════════════════════════════════════════════════ */
interface CategoryConfig {
  id: CategoryId
  label: string
  tagline: string
  icon: ReactNode
  color: string
  bg: string
  border: string
  examples: string[]
  sla: string
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'creator_dispute',
    label: 'Creator dispute',
    tagline: 'Content, brief violations, metrics, or conduct',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M1 21v-1a7 7 0 0112.03-4.88" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18 8l4 4-4 4M22 12h-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200',
    examples: ['Content not delivered', 'Brief violated', 'Fraudulent engagement', 'Unprofessional conduct'],
    sla: '24–48 hours',
  },
  {
    id: 'payment_issue',
    label: 'Payment issue',
    tagline: 'Wrong amounts, failed payments, or refund requests',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M5 16h4M15 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
    examples: ['Wrong amount charged', 'Payment not received', 'Escrow hold', 'Refund request'],
    sla: '4–8 hours',
  },
  {
    id: 'incorrect_data',
    label: 'Incorrect data',
    tagline: 'Wrong follower counts, metrics, or profile info',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 3h18v18H3z" stroke="currentColor" strokeWidth="1.8" rx="2" ry="2"/><path d="M9 9h6M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="18.5" cy="18.5" r="3.5" fill="white" stroke="currentColor" strokeWidth="1.8"/><path d="M17.5 18.5l.7.7 1.3-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200',
    examples: ['Wrong follower count', 'Engagement rate off', 'Wrong niche tagged', 'Outdated profile info'],
    sla: '48–72 hours',
  },
  {
    id: 'contract_issue',
    label: 'Contract issue',
    tagline: 'Signature, terms, or breach of contract',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 13l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
    examples: ['Creator won\'t sign', 'Terms not honoured', 'Wrong contract sent', 'Clause dispute'],
    sla: '24–48 hours',
  },
  {
    id: 'feature_request',
    label: 'Feature request',
    tagline: 'Suggest improvements or new platform features',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l2.1-2.1M5.6 18.4l2.1-2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>,
    color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200',
    examples: ['New filter option', 'Dashboard metric', 'Integration request', 'Workflow improvement'],
    sla: 'We review monthly',
  },
  {
    id: 'general',
    label: 'General / other',
    tagline: 'Anything else — feedback, complaints, questions',
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>,
    color: 'text-ink/60', bg: 'bg-surface-sub', border: 'border-primary/12',
    examples: ['Account question', 'Platform feedback', 'General complaint', 'Anything else'],
    sla: '48–72 hours',
  },
]

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; text: string; bg: string; border: string; desc: string }> = {
  low:      { label: 'Low',      dot: 'bg-sky-400',    text: 'text-sky-700',    bg: 'bg-sky-50',    border: 'border-sky-200',    desc: 'No urgency — informational'          },
  medium:   { label: 'Medium',   dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  desc: 'Needs attention within a few days'   },
  high:     { label: 'High',     dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', desc: 'Urgent — affecting campaign delivery' },
  critical: { label: 'Critical', dot: 'bg-rose-500',   text: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200',   desc: 'Fraud, payment failure, data breach'  },
}

const TICKET_STATUS_CFG: Record<TicketStatus, { label: string; dot: string; bg: string; text: string }> = {
  open:      { label: 'Open',      dot: 'bg-primary/60',  bg: 'bg-primary/[0.07]',  text: 'text-primary'      },
  in_review: { label: 'In review', dot: 'bg-amber-400',   bg: 'bg-amber-50',        text: 'text-amber-700'    },
  resolved:  { label: 'Resolved',  dot: 'bg-emerald-400', bg: 'bg-emerald-50',       text: 'text-emerald-700'  },
  closed:    { label: 'Closed',    dot: 'bg-ink/25',      bg: 'bg-surface-sub',      text: 'text-ink/45'       },
}

/* ════════════════════════════════════════════════════════════════════
   EXISTING TICKETS (mock)
   ════════════════════════════════════════════════════════════════════ */
const EXISTING_TICKETS: ExistingTicket[] = [
  { id: 'TKT-2026-0041', category: 'payment_issue',    subject: 'Payment of €800 to Markus Tamm not processed',       status: 'in_review', priority: 'high',   createdDate: 'Jun 21, 2026', updatedDate: '2h ago',   assignee: 'Nexfluence Billing' },
  { id: 'TKT-2026-0039', category: 'incorrect_data',   subject: 'Engagement rate for Sandra Liepa showing 3% not 7%', status: 'resolved',  priority: 'medium', createdDate: 'Jun 18, 2026', updatedDate: 'Jun 19',   assignee: 'Nexfluence Data'    },
  { id: 'TKT-2026-0031', category: 'feature_request',  subject: 'Add CSV export for campaign performance data',        status: 'open',      priority: 'low',    createdDate: 'Jun 10, 2026', updatedDate: 'Jun 10',   assignee: null                 },
  { id: 'TKT-2026-0028', category: 'creator_dispute',  subject: 'Creator @elina.kr missed final content deadline',    status: 'closed',    priority: 'medium', createdDate: 'Jun 5, 2026',  updatedDate: 'Jun 15',   assignee: 'Nexfluence Support' },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function ChevLeft({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function Check({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function UploadIcon({ s = 28 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function MailIcon({ s = 22 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TicketIcon({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg>
}
function ChevRight({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function AlertIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════ */
function FieldLabel({ children }: { children: ReactNode }) {
  return <label className={LBL}>{children}</label>
}
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={className}><FieldLabel>{label}</FieldLabel>{children}</div>
}

/* ════════════════════════════════════════════════════════════════════
   STEP INDICATOR  (1 → 2 → 3)
   ════════════════════════════════════════════════════════════════════ */
const STEPS = ['Category', 'Details', 'Review & submit']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done   = n < current
        const active = n === current
        return (
          <div key={label} className="flex items-center">
            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${active ? 'bg-primary/[0.08]' : ''}`}>
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black transition ${done ? `${GRAD_BTN} text-white` : active ? 'border-2 border-primary text-primary' : 'border-2 border-primary/20 text-ink/28'}`}>
                {done ? <Check s={10}/> : n}
              </div>
              <span className={`hidden text-[12.5px] font-semibold sm:inline ${active ? 'text-primary' : done ? 'text-ink/45' : 'text-ink/25'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-px w-8 rounded-full transition ${done ? GRAD_BTN : 'bg-primary/10'}`}/>
            )}
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
              {/* Selector circle */}
              <div className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${sel ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                {sel && <Check s={9}/>}
              </div>
              {/* Icon */}
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.bg} ${cat.color}`}>
                {cat.icon}
              </div>
              {/* Copy */}
              <div>
                <p className="text-[14.5px] font-extrabold text-ink">{cat.label}</p>
                <p className="mt-1 text-[12.5px] leading-[1.55] text-ink/55">{cat.tagline}</p>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {cat.examples.map(ex => (
                    <span key={ex} className={`rounded-lg px-2 py-0.5 text-[10.5px] font-semibold ${cat.bg} ${cat.color}`}>{ex}</span>
                  ))}
                </div>
              </div>
              {/* SLA */}
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
   STEP 2 — DETAILS FORM (adapts per category)
   ════════════════════════════════════════════════════════════════════ */
const DISPUTE_SUBTYPES: Record<string, string[]> = {
  creator_dispute: ['Content not delivered', 'Brief / contract violation', 'Fraudulent engagement metrics', 'Plagiarised or off-brief content', 'Unprofessional conduct', 'Refusal to make revisions'],
  payment_issue:   ['Wrong amount charged', 'Payment not received by creator', 'Escrow hold — funds not released', 'Refund request', 'Duplicate charge', 'Other payment issue'],
  contract_issue:  ['Creator refuses to sign', 'Terms not honoured', 'Wrong creator received contract', 'Clause interpretation dispute', 'Contract expired without delivery'],
  incorrect_data:  ['Follower count wrong', 'Engagement rate wrong', 'Niche / category mislabelled', 'Platform not listed', 'Location wrong', 'Other data issue'],
  feature_request: ['Search & discovery', 'Campaign management', 'Creator analytics', 'Payment & contracts', 'Notifications', 'Integrations', 'Other'],
  general:         ['Account question', 'Platform feedback', 'Billing question', 'Partnership enquiry', 'General complaint'],
}

function DetailsStep({ form, onChange }: {
  form: TicketFormData
  onChange: (p: Partial<TicketFormData>) => void
}) {
  const cat = CATEGORIES.find(c => c.id === form.category)!
  const subtypes = DISPUTE_SUBTYPES[form.category ?? ''] ?? []

  /* File handling */
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    onChange({ files: [...form.files, ...files].slice(0, 5) })
    e.target.value = ''
  }
  const removeFile = (i: number) => onChange({ files: form.files.filter((_, idx) => idx !== i) })

  const [dragging, setDragging] = useState(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
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
            const pc = PRIORITY_CONFIG[p]
            const sel = form.priority === p
            return (
              <button key={p} type="button" onClick={() => onChange({ priority: p })}
                className={`flex flex-col gap-1.5 rounded-xl border-2 px-3.5 py-3 text-left transition ${sel ? `${pc.border} ${pc.bg}` : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${pc.dot}`}/>
                  <span className={`text-[13px] font-extrabold ${sel ? pc.text : 'text-ink'}`}>{pc.label}</span>
                  {sel && <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white"><Check s={9}/></span>}
                </div>
                <p className={`text-[10.5px] font-medium ${sel ? pc.text : 'text-ink/40'} leading-snug`}>{pc.desc}</p>
              </button>
            )
          })}
        </div>
        {form.priority === 'critical' && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertIcon s={15}/>
            <p className="text-[12.5px] font-semibold leading-[1.6] text-rose-700">Critical tickets are escalated immediately. Use only for active payment fraud, data breaches, or immediate campaign-blocking issues.</p>
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
            form.category === 'creator_dispute'  ? 'e.g. @markustamm — piece 2 violates brand safety brief' :
            form.category === 'payment_issue'    ? 'e.g. €800 flat fee to Markus Tamm — payment failed Jun 28' :
            form.category === 'incorrect_data'   ? 'e.g. Sandra Liepa engagement rate shows 3% — should be 7.2%' :
            form.category === 'contract_issue'   ? 'e.g. CTR-2026-002 — creator refusing to countersign' :
            form.category === 'feature_request'  ? 'e.g. Add bulk CSV export for all campaign analytics' :
            'Describe your issue in one line…'
          }/>
      </Field>

      {/* Category-specific context fields */}
      {form.category === 'creator_dispute' && (
        <div className={`rounded-2xl border border-violet-100 bg-violet-50/40 p-5 space-y-4`}>
          <p className="text-[12px] font-bold text-violet-600">Creator details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Creator name"><input className={INP} value={form.creatorName} onChange={e => onChange({ creatorName: e.target.value })} placeholder="Markus Tamm"/></Field>
            <Field label="Creator handle"><input className={INP} value={form.creatorHandle} onChange={e => onChange({ creatorHandle: e.target.value })} placeholder="@markustamm"/></Field>
            <Field label="Campaign name" className="sm:col-span-2"><input className={INP} value={form.campaignName} onChange={e => onChange({ campaignName: e.target.value })} placeholder="e.g. Pre-Workout Race Day"/></Field>
          </div>
        </div>
      )}

      {form.category === 'payment_issue' && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-4">
          <p className="text-[12px] font-bold text-emerald-600">Payment details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Amount"><div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/38 font-bold">€</span><input className={`${INP} pl-8`} value={form.paymentAmount} onChange={e => onChange({ paymentAmount: e.target.value })} placeholder="800"/></div></Field>
            <Field label="Payment date"><input type="date" className={INP} value={form.paymentDate} onChange={e => onChange({ paymentDate: e.target.value })}/></Field>
            <Field label="Receipt / ref (if any)"><input className={INP} value={form.paymentRef} onChange={e => onChange({ paymentRef: e.target.value })} placeholder="RCP-2026-xxxx"/></Field>
          </div>
        </div>
      )}

      {form.category === 'incorrect_data' && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5 space-y-4">
          <p className="text-[12px] font-bold text-sky-600">Data correction details</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Field / metric name"><input className={INP} value={form.dataField} onChange={e => onChange({ dataField: e.target.value })} placeholder="e.g. Engagement rate, Follower count"/></Field>
            <Field label="Source URL (if available)"><input className={INP} value={form.dataSource} onChange={e => onChange({ dataSource: e.target.value })} placeholder="https://…"/></Field>
            <Field label="Value shown on Nexfluence"><input className={INP} value={form.reportedValue} onChange={e => onChange({ reportedValue: e.target.value })} placeholder="e.g. 3.1%"/></Field>
            <Field label="Correct value (with source)"><input className={INP} value={form.expectedValue} onChange={e => onChange({ expectedValue: e.target.value })} placeholder="e.g. 7.2% — verified via Instagram Insights"/></Field>
          </div>
        </div>
      )}

      {form.category === 'contract_issue' && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 space-y-4">
          <p className="text-[12px] font-bold text-amber-600">Contract reference</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contract ID"><input className={INP} value={form.contractId} onChange={e => onChange({ contractId: e.target.value })} placeholder="CTR-2026-xxx"/></Field>
            <Field label="Creator involved"><input className={INP} value={form.creatorName} onChange={e => onChange({ creatorName: e.target.value })} placeholder="e.g. Markus Tamm"/></Field>
          </div>
        </div>
      )}

      {form.category === 'feature_request' && (
        <div className="rounded-2xl border border-pink-100 bg-pink-50/40 p-5 space-y-4">
          <p className="text-[12px] font-bold text-pink-600">Feature details</p>
          <Field label="Which part of the platform?">
            <select className={INP} value={form.featureArea} onChange={e => onChange({ featureArea: e.target.value })}>
              <option value="">Select area…</option>
              {['Campaign builder', 'Creator search', 'Brand dashboard', 'Messages', 'Contracts', 'Payments', 'Analytics', 'Other'].map(a => <option key={a}>{a}</option>)}
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
            form.category === 'creator_dispute'  ? 'Describe the issue in detail. Include what was agreed, what happened, any timestamps, and what resolution you re seeking.' :
            form.category === 'payment_issue'    ? 'Describe the payment issue. Include transaction details, what the contract says, and what outcome you expect.' :
            form.category === 'incorrect_data'   ? 'Explain where you found the discrepancy and how its affecting your campaign decisions.' :
            form.category === 'contract_issue'   ? 'Describe the contract issue, relevant clause numbers, and what you need from the Nexfluence team.' :
            form.category === 'feature_request'  ? 'Anything else to help our product team understand the request.' :
            'Describe your issue, question, or feedback in full. Include relevant dates, names, and any steps you ve already taken.'
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
            <p className="mt-0.5 text-[12px] text-ink/40">Screenshots, recordings, documents, CSV exports — anything that helps</p>
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
  form: TicketFormData
  onEditCategory: () => void
  onEditDetails: () => void
}) {
  const cat = CATEGORIES.find(c => c.id === form.category)!
  const pc  = PRIORITY_CONFIG[form.priority]

  const ReviewRow = ({ label, value }: { label: string; value: string }) =>
    value
      ? <div className="flex items-start justify-between gap-6 border-b border-primary/6 py-2.5 last:border-0"><span className="flex-shrink-0 text-[12px] font-semibold text-ink/40">{label}</span><span className="text-right text-[13px] font-semibold text-ink">{value}</span></div>
      : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Review your ticket</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Double-check before submitting. Our team will respond to the email on your account.</p>
      </div>

      {/* Category block */}
      <div className={`rounded-2xl border p-5 ${cat.bg} ${cat.border}`}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-ink/40">Category</p>
          <button onClick={onEditCategory} className="text-[12.5px] font-bold text-primary hover:underline">Change</button>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.bg} ${cat.color} border ${cat.border}`}>{cat.icon}</div>
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
        <ReviewRow label="Subject" value={form.subject}/>
        <ReviewRow label="Issue type" value={form.disputeSubtype}/>
        <ReviewRow label="Creator" value={form.creatorName ? `${form.creatorName} ${form.creatorHandle}` : ''}/>
        <ReviewRow label="Campaign" value={form.campaignName}/>
        <ReviewRow label="Payment ref" value={form.paymentRef}/>
        <ReviewRow label="Contract" value={form.contractId}/>
        <ReviewRow label="Data field" value={form.dataField ? `${form.dataField}: shown "${form.reportedValue}" — expected "${form.expectedValue}"` : ''}/>
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
              {form.files.map((f, i) => (
                <span key={i} className="rounded-lg bg-primary/[0.07] px-2.5 py-1 text-[12px] font-semibold text-primary">{f.name}</span>
              ))}
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
            Our team will review your ticket and respond to <span className="font-bold text-ink">your account email</span> within <span className="font-bold text-ink">{cat.sla}</span>. For critical tickets, we escalate immediately. You can track status below on this page.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SUCCESS SCREEN
   ════════════════════════════════════════════════════════════════════ */
function SuccessScreen({ ticketId, category, onDone }: {
  ticketId: string; category: CategoryId; onDone: () => void
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

      {/* Ticket ID card */}
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
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">·</span>A copy of this ticket has been sent to your account email.</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">·</span>You can track status in the "My tickets" section below.</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">·</span>Reply to the email thread to add more information.</li>
        </ul>
      </div>

      <div className="mt-7 flex gap-3">
        <button onClick={onDone}
          className={`rounded-xl ${GRAD_BTN} px-7 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
          Back to dashboard
        </button>
        <button onClick={() => { onDone(); setTimeout(() => window.scrollTo({ top: 9999, behavior: 'smooth' }), 100) }}
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
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white ${GRAD_BTN}`}>{tickets.length}</span>
      </div>

      {/* Column headers */}
      <div className="grid border-b border-primary/6 bg-surface-sub/60 px-5 py-2.5 text-[11px] font-semibold text-ink/35"
        style={{ gridTemplateColumns: 'auto 2fr 1fr 1fr 1fr auto' }}>
        <span className="w-32">Ticket ID</span>
        <span>Subject</span>
        <span>Category</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Updated</span>
      </div>

      <div className="divide-y divide-primary/6">
        {tickets.map(ticket => {
          const cat = CATEGORIES.find(c => c.id === ticket.category)!
          const sc  = TICKET_STATUS_CFG[ticket.status]
          const pc  = PRIORITY_CONFIG[ticket.priority]
          return (
            <div key={ticket.id}
              className="group grid cursor-pointer items-center gap-3 px-5 py-4 transition hover:bg-primary/[0.02]"
              style={{ gridTemplateColumns: 'auto 2fr 1fr 1fr 1fr auto' }}>
              {/* ID */}
              <span className="w-32 text-[12px] font-bold text-primary">{ticket.id}</span>
              {/* Subject */}
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">{ticket.subject}</p>
                {ticket.assignee && <p className="text-[11px] text-ink/38">{ticket.assignee}</p>}
              </div>
              {/* Category */}
              <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold w-fit ${cat.bg} ${cat.color}`}>
                <span className="[&>svg]:h-3 [&>svg]:w-3">{cat.icon}</span>
                <span className="hidden lg:inline">{cat.label}</span>
              </div>
              {/* Priority */}
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold w-fit ${pc.bg} ${pc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`}/>{pc.label}
              </span>
              {/* Status */}
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold w-fit ${sc.bg} ${sc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
              </span>
              {/* Updated */}
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
    if (form.category === 'feature_request') return form.disputeSubtype.trim().length > 0 || form.subject.trim().length > 0
    return form.description.trim().length > 0
  }
  return true
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
const DEFAULT_FORM: TicketFormData = {
  category: null, priority: 'medium', subject: '', description: '',
  creatorName: '', creatorHandle: '', campaignName: '', disputeSubtype: '',
  paymentAmount: '', paymentDate: '', paymentRef: '',
  dataField: '', reportedValue: '', expectedValue: '', dataSource: '',
  contractId: '', contractIssueType: '',
  featureArea: '', featureDescription: '',
  files: [],
}

export default function DisputePage() {
  const router = useRouter()
  const [step,    setStep]    = useState(1)
  const [form,    setForm]    = useState<TicketFormData>(DEFAULT_FORM)
  const [success, setSuccess] = useState(false)
  const [ticketId, setTicketId] = useState('')
  const [tickets, setTickets] = useState<ExistingTicket[]>(EXISTING_TICKETS)
  const topRef = useRef<HTMLDivElement>(null)

  const update = (p: Partial<TicketFormData>) => setForm(prev => ({ ...prev, ...p }))

  const scrollTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const next = () => {
    if (!canAdvance(step, form)) return
    setStep(s => s + 1); scrollTop()
  }
  const back = () => { setStep(s => s - 1); scrollTop() }

  const submit = () => {
    const id = `TKT-2026-${String(Math.floor(Math.random() * 900) + 100 + tickets.length)}`
    setTicketId(id)
    /* Add to existing tickets */
    const newTicket: ExistingTicket = {
      id, category: form.category!, subject: form.subject,
      status: form.priority === 'critical' ? 'in_review' : 'open',
      priority: form.priority, createdDate: 'Just now', updatedDate: 'Just now', assignee: null,
    }
    setTickets(prev => [newTicket, ...prev])
    setSuccess(true); scrollTop()
  }

  const ok = canAdvance(step, form)

  const NAV_LEFT  = [
    { label: 'Dashboard', active: false, action: () => router.push('/dashboard/brand') },
    { label: 'Support',   active: true,  action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'My Profile', active: false, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

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
        <div ref={topRef}/>

        {/* ── Page title ── */}
        {!success && (
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/dashboard/brand')}
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

        {/* ── Wizard ── */}
        <div className={`${!success ? `rounded-2xl border border-primary/10 bg-white p-6 sm:p-8 ${CARD}` : ''}`}>
          {success ? (
            <SuccessScreen
              ticketId={ticketId}
              category={form.category!}
              onDone={() => router.push('/dashboard/brand')}
            />
          ) : (
            <>
              {step === 1 && <CategoryStep selected={form.category} onSelect={c => { update({ category: c }); setTimeout(next, 220) }}/>}
              {step === 2 && <DetailsStep form={form} onChange={update}/>}
              {step === 3 && <ReviewStep form={form} onEditCategory={() => setStep(1)} onEditDetails={() => setStep(2)}/>}

              {/* Nav buttons */}
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

        {/* ── Existing tickets ── */}
        <div className="mt-10">
          <ExistingTicketsPanel tickets={tickets}/>
        </div>

      </main>
    </div>
  )
}