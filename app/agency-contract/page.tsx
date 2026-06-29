'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Agency Contract Maker — app/agency/contract/new/page.tsx
   Nexfluence v4, LIGHT

   TWO CONTRACT DIMENSIONS:

   DIMENSION 1 — AGREEMENT TYPE:
     (A) Agency-Brand management agreement
         Parties: Agency (service provider) + Brand (client)
         Covers: Authority granted, monthly retainer, notice period
         No creator involved.

     (B) Campaign contract — 3-party (tripartite)
         Parties: Agency (operator) + Brand (funder) + Creator (deliverer)
         Covers: All brand contract fields + agency fee clause
         All three must sign.

   DIMENSION 2 — BUILD MODE:
     Standard: Guided form (5 steps)
     Custom:   Section/clause builder (4 steps)

   COMBINED → 4 distinct flows from one entry point:
     Management Standard | Management Custom
     Campaign Standard   | Campaign Custom
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
const LBL      = 'mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.10em] text-ink/45'

/* ─── Types ──────────────────────────────────────────────────────── */
type AgreementType   = 'management' | 'campaign'
type BuildMode       = 'standard' | 'custom'
type DealType        = 'cash' | 'commission' | 'hybrid' | 'custom'
type ManagementScope = 'full_management' | 'single_campaign'
type AgencyFeeType   = 'percent' | 'flat' | 'invoice_separately'
type SendStrategy    = 'simultaneous' | 'brand_first'

interface Clause  { id: string; text: string }
interface Section { id: string; heading: string; clauses: Clause[] }

/* Standard management agreement draft */
interface MgmtDraft {
  managementScope:   ManagementScope
  agencyName:        string; agencyReg: string
  brandName:         string; brandReg:  string
  campaignName:      string
  authorityBullets:  string[]
  noticePeriodDays:  string
  exclusivityClause: boolean
  retainerCurrency:  string; retainerAmount: string
  paymentSchedule:   string
  invoiceRequired:   boolean; latePaymentClause: boolean
  signerName:        string; signerDesignation: string; signerOrg: string
}

/* Standard campaign (tripartite) draft */
interface CampaignDraft {
  dealType: DealType; customDealDescription: string
  agencyName: string; agencyReg: string
  brandName:  string; brandReg:  string
  creatorName: string; creatorHandle: string
  campaignName: string; campaignObjective: string
  pieces: string; formats: string; platforms: string
  postingWindow: string; startDate: string; endDate: string
  usageRights: string; exclusivityPeriod: string
  currency: string; flatAmount: string
  commissionRate: string; commissionTracking: string
  paymentSchedule: string; invoiceRequired: boolean; latePaymentClause: boolean
  agencyFeeType:    AgencyFeeType
  agencyFeePercent: string; agencyFeeFlat: string
  signerName: string; signerDesignation: string; signerOrg: string
}

/* Custom draft (shared for both agreement types) */
interface CustomDraft {
  agreementType:   AgreementType
  managementScope: ManagementScope
  dealType: DealType; customDealDescription: string
  agencyName: string; agencyReg: string
  brandName:  string; brandReg:  string
  creatorName: string; creatorHandle: string
  campaignName: string
  sections:    Section[]
  signerName: string; signerDesignation: string; signerOrg: string
}

const DEFAULT_MGMT: MgmtDraft = {
  managementScope: 'full_management',
  agencyName: 'Baltic Creators Agency', agencyReg: '',
  brandName: '', brandReg: '', campaignName: '',
  authorityBullets: [
    "Create and manage influencer marketing campaigns on the Brand's behalf on Creator Nexus",
    "Select, negotiate with, and contract creators from the Agency's roster",
    "Access the Brand's Creator Nexus dashboard for campaign tracking and management",
    "Process campaign payments and creator fees through Grade escrow on behalf of the Brand",
  ],
  noticePeriodDays: '30', exclusivityClause: false,
  retainerCurrency: 'EUR', retainerAmount: '',
  paymentSchedule: '',
  invoiceRequired: true, latePaymentClause: true,
  signerName: '', signerDesignation: 'Founder', signerOrg: 'Baltic Creators Agency',
}

const DEFAULT_CAMPAIGN: CampaignDraft = {
  dealType: 'hybrid', customDealDescription: '',
  agencyName: 'Baltic Creators Agency', agencyReg: '',
  brandName: '', brandReg: '',
  creatorName: '', creatorHandle: '',
  campaignName: '', campaignObjective: '',
  pieces: '3', formats: '', platforms: '', postingWindow: '', startDate: '', endDate: '',
  usageRights: '12 months, non-exclusive', exclusivityPeriod: '',
  currency: 'EUR', flatAmount: '', commissionRate: '', commissionTracking: '',
  paymentSchedule: '', invoiceRequired: true, latePaymentClause: true,
  agencyFeeType: 'percent', agencyFeePercent: '15', agencyFeeFlat: '',
  signerName: '', signerDesignation: 'Founder', signerOrg: 'Baltic Creators Agency',
}

const DEFAULT_CUSTOM: CustomDraft = {
  agreementType: 'management', managementScope: 'full_management',
  dealType: 'hybrid', customDealDescription: '',
  agencyName: 'Baltic Creators Agency', agencyReg: '',
  brandName: '', brandReg: '', creatorName: '', creatorHandle: '', campaignName: '',
  sections: [],
  signerName: '', signerDesignation: 'Founder', signerOrg: 'Baltic Creators Agency',
}

const MGMT_STEPS_STD  = ['Agreement scope', 'Parties', 'Scope & authority', 'Payment', 'Review & Sign']
const MGMT_STEPS_CUST = ['Agreement scope', 'Parties', 'Contract body', 'Review & Sign']
const CAMP_STEPS_STD  = ['Deal type', 'Parties', 'Deliverables', 'Payment', 'Review & Sign']
const CAMP_STEPS_CUST = ['Deal type', 'Parties', 'Contract body', 'Review & Sign']

const MANAGED_BRANDS = [
  { id: 'mb1', name: 'Kinetics',       industry: 'Sports nutrition', color: '#8B31E8', initials: 'KI' },
  { id: 'mb2', name: 'Lumora Skincare',industry: 'Beauty',           color: '#059669', initials: 'LS' },
  { id: 'mb3', name: 'Forma Fit',      industry: 'Fitness apparel',  color: '#2563EB', initials: 'FF' },
]
const CAMPAIGN_CREATORS = [
  { id: 'cr1', name: 'Amelia Roze',    handle: '@amelia.roze',  color: '#8B31E8', initials: 'AR' },
  { id: 'cr2', name: 'Markus Tamm',    handle: '@markustamm',   color: '#2563EB', initials: 'MT' },
  { id: 'cr3', name: 'Sandra Liepa',   handle: '@sandra.liepa', color: '#DB2777', initials: 'SL' },
  { id: 'cr4', name: 'Rūta Vaitkutė', handle: '@ruta.glow',    color: '#C026D3', initials: 'RV' },
]

const DEAL_TYPES = [
  { id: 'cash' as DealType,       title: 'All cash',       sub: 'Fixed flat fee',
    description: 'Brand pays a fixed fee per deliverable. Creator compensated regardless of results.',
    color: '#8B31E8', bg: '#f5f0fe' },
  { id: 'commission' as DealType, title: 'All commission', sub: '% of every tracked sale',
    description: 'Creator earns a percentage of each sale. No upfront cost to brand — full alignment.',
    color: '#059669', bg: '#edfdf5' },
  { id: 'hybrid' as DealType,     title: 'Hybrid',         sub: 'Base fee + commission',
    description: 'Flat base guarantees creator commitment; commission rewards performance.',
    color: '#2563EB', bg: '#eff4fe' },
  { id: 'custom' as DealType,     title: 'Custom deal',    sub: 'Define your own terms',
    description: "None of the above fit? Describe the deal structure in your own words.",
    color: '#D97706', bg: '#fffbeb' },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS — inline SVG only
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function Check({ s = 12 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChevLeft({ s = 15 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChevRight({ s = 15 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function PlusIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function TrashIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SendIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function FileIcon({ s = 28 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }
function EditFileIcon({ s = 28 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function PenIcon({ s = 22 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 13 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function UsersIcon({ s = 28 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function BuildingIcon({ s = 16 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function BriefcaseIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function RepeatIcon({ s = 26 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ZapIcon({ s = 26 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ShieldIcon({ s = 16 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function InfoIcon({ s = 15 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ════════════════════════════════════════════════════════════════════ */
function FieldLabel({ children }: { children: ReactNode }) { return <label className={LBL}>{children}</label> }
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={className}><FieldLabel>{label}</FieldLabel>{children}</div>
}
function CheckRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-primary/[0.04]">
      <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${checked ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white text-transparent'}`}>
        <Check s={10}/>
      </span>
      <div>
        <span className="text-[13.5px] font-semibold text-ink/70">{label}</span>
        {description && <p className="mt-0.5 text-[12px] text-ink/45">{description}</p>}
      </div>
    </button>
  )
}
function PersonAvatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{initials}</div>
}
function EntityTile({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{initials}</div>
}

/* ════════════════════════════════════════════════════════════════════
   SIDEBAR — "Agency contract" label (vs "Contract setup" on brand page)
   ════════════════════════════════════════════════════════════════════ */
function Sidebar({ steps, current, completed, onJump }: {
  steps: string[]; current: number; completed: Set<number>; onJump: (n: number) => void
}) {
  return (
    <nav className="flex w-[190px] flex-shrink-0 flex-col gap-0.5">
      <p className="mb-3 px-4 text-[10.5px] font-black uppercase tracking-[0.22em] text-ink/30">Agency contract</p>
      {steps.map((label, idx) => {
        const n = idx + 1; const done = completed.has(n); const active = n === current; const canGo = done || n === current
        return (
          <button key={label} type="button" disabled={!canGo} onClick={() => canGo && onJump(n)}
            className={`relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[13.5px] font-semibold transition-all disabled:cursor-default ${active ? 'bg-primary/[0.07] text-primary' : done ? 'text-ink/50 hover:bg-primary/[0.04] hover:text-ink/70' : 'cursor-default text-ink/22'}`}>
            {active && <span className={`absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-full ${GRAD_BTN}`}/>}
            <span className="flex-1 pl-1">{label}</span>
            {done && !active && <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/[0.10] text-primary"><Check s={9}/></span>}
          </button>
        )
      })}
    </nav>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SIGN BLOCK — agency signs first; label says "Agency signature"
   ════════════════════════════════════════════════════════════════════ */
function SignBlock({ signerName, signerDesignation, signerOrg, onChange }: {
  signerName: string; signerDesignation: string; signerOrg: string
  onChange: (f: { signerName?: string; signerDesignation?: string; signerOrg?: string }) => void
}) {
  return (
    <div className={`rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.04] via-transparent to-magenta/[0.03] p-6 ${CARD}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${GRAD_BTN} shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]`}>
          <PenIcon s={16}/>
        </div>
        <div>
          <p className="text-[13.5px] font-extrabold text-ink">Agency signature</p>
          <p className="text-[11.5px] text-ink/45">Agency signs first — this is your digital signature.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Full name *"><input className={INP} value={signerName} onChange={e => onChange({ signerName: e.target.value })} placeholder="Harshul Gupta"/></Field>
        <Field label="Designation *"><input className={INP} value={signerDesignation} onChange={e => onChange({ signerDesignation: e.target.value })} placeholder="Founder"/></Field>
        <Field label="Organisation *"><input className={INP} value={signerOrg} onChange={e => onChange({ signerOrg: e.target.value })} placeholder="Baltic Creators Agency"/></Field>
      </div>
      {signerName && signerDesignation && signerOrg && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white flex-shrink-0"><Check s={12}/></span>
          <p className="text-[13px] font-semibold text-emerald-800">
            Signed by <span className="font-extrabold">{signerName}</span>, {signerDesignation} at {signerOrg}
          </p>
        </div>
      )}
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-primary/8 py-3 last:border-0">
      <span className="flex-shrink-0 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink/38">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{value ?? <span className="italic text-ink/28">Not set</span>}</span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   AGREEMENT TYPE SELECTOR — entry point, two-stage:
   Stage 1: pick management vs campaign
   Stage 2: pick standard vs custom
   ════════════════════════════════════════════════════════════════════ */
function AgreementTypeSelector({ onSelect }: { onSelect: (type: AgreementType, mode: BuildMode) => void }) {
  const [type, setType] = useState<AgreementType | null>(null)

  if (!type) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-[640px]">
          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-black tracking-[-0.03em] text-ink">Create a contract</h1>
            <p className="mt-2 text-[14px] text-ink/50">Agency contracts involve multiple parties. Choose the type of agreement you need.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                id: 'management' as AgreementType,
                icon: <RepeatIcon s={30}/>,
                title: 'Agency-Brand agreement',
                sub: 'Management contract',
                description: "Formalise your agency's authority to manage the brand's influencer marketing. Covers scope, retainer, and the right to run campaigns on their behalf.",
                bullets: ['Monthly retainer or one-time fee', 'Authority to sign creator contracts', 'Brand dashboard access', '30/60/90-day notice period'],
                cta: 'Management agreement',
              },
              {
                id: 'campaign' as AgreementType,
                icon: <UsersIcon s={30}/>,
                title: 'Campaign contract',
                sub: '3-party (Agency + Brand + Creator)',
                description: 'A tripartite contract for a specific campaign. Brand funds it, creator delivers content, agency operates and earns a management fee.',
                bullets: ['All three parties sign', 'Agency fee clause included', 'Creator deliverables + payment', 'Brand retains content ownership'],
                cta: 'Campaign contract',
              },
            ].map(opt => (
              <button key={opt.id} type="button" onClick={() => setType(opt.id)}
                className={`group flex flex-col gap-5 rounded-2xl border-2 border-primary/12 bg-white p-7 text-left transition-all hover:border-primary/30 hover:shadow-[0_8px_28px_-8px_rgba(139,49,232,0.24)] ${CARD}`}>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)]`}>{opt.icon}</div>
                <div>
                  <p className="text-[17px] font-extrabold text-ink">{opt.title}</p>
                  <p className={`mt-0.5 text-[11.5px] font-bold uppercase tracking-[0.08em] ${GRAD_TXT}`}>{opt.sub}</p>
                  <p className="mt-2.5 text-[13px] leading-[1.7] text-ink/55">{opt.description}</p>
                  <ul className="mt-3 space-y-1.5">
                    {opt.bullets.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-[12px] text-ink/55">
                        <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/[0.10] text-primary"><Check s={9}/></span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`mt-auto flex items-center gap-2 rounded-xl ${GRAD_BTN} px-4 py-3 text-[13.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.40)] transition group-hover:-translate-y-0.5`}>
                  {opt.cta}<ChevRight s={14}/>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* Stage 2 — build mode */
  const label = type === 'management' ? 'Agency-Brand agreement' : 'Campaign contract (3-party)'
  const tagCls = type === 'management' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-[560px]">
        <button onClick={() => setType(null)} className="mb-6 flex items-center gap-1.5 text-[13px] font-semibold text-ink/45 transition hover:text-ink/70">
          <ChevLeft s={13}/>Back
        </button>
        <span className={`mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-bold ${tagCls}`}>{label}</span>
        <h2 className="mb-1 text-[22px] font-extrabold tracking-[-0.02em] text-ink">How do you want to build it?</h2>
        <p className="mb-6 text-[13.5px] text-ink/50">Both end with the same review and signing flow.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { mode: 'standard' as BuildMode, icon: <FileIcon s={26}/>,     title: 'Standard form',   sub: 'Guided step-by-step',   desc: 'Answer questions about each clause. Nexfluence builds the structure for you.' },
            { mode: 'custom'   as BuildMode, icon: <EditFileIcon s={26}/>, title: 'Custom builder',   sub: 'Write your own clauses', desc: 'Add sections and write numbered clauses yourself. Full control over every word.' },
          ].map(opt => (
            <button key={opt.mode} type="button" onClick={() => onSelect(type, opt.mode)}
              className={`group flex flex-col gap-4 rounded-2xl border-2 border-primary/12 bg-white p-6 text-left transition-all hover:border-primary/30 hover:shadow-[0_6px_24px_-6px_rgba(139,49,232,0.22)] ${CARD}`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.40)]`}>{opt.icon}</div>
              <div>
                <p className="text-[16px] font-extrabold text-ink">{opt.title}</p>
                <p className={`mt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] ${GRAD_TXT}`}>{opt.sub}</p>
                <p className="mt-2 text-[12.5px] leading-[1.65] text-ink/55">{opt.desc}</p>
              </div>
              <div className={`mt-auto flex items-center gap-2 rounded-xl ${GRAD_BTN} px-4 py-2.5 text-[13px] font-bold text-white transition group-hover:-translate-y-0.5`}>
                Use this<ChevRight s={13}/>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DEAL TYPE STEP — identical to brand contract, used for campaign flows
   ════════════════════════════════════════════════════════════════════ */
function DealTypeStep({ dealType, customDealDescription, onUpdate }: {
  dealType: DealType; customDealDescription: string
  onUpdate: (t: DealType, desc: string) => void
}) {
  return (
    <div>
      <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">What kind of deal is this campaign?</h2>
      <p className="mt-1 text-[13.5px] leading-[1.6] text-ink/50">Shapes the creator payment clauses. Your agency fee is set separately in Step 4.</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DEAL_TYPES.map(dt => {
          const sel = dealType === dt.id
          return (
            <button key={dt.id} type="button" onClick={() => onUpdate(dt.id, customDealDescription)}
              className={`relative flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${sel ? 'border-primary/30 bg-primary/[0.03] shadow-[0_0_0_1px_rgba(139,49,232,0.15),0_6px_20px_-6px_rgba(139,49,232,0.26)]' : `border-primary/10 bg-white hover:border-primary/20 ${CARD}`}`}>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: dt.bg, color: dt.color }}>
                {dt.id === 'cash'       && <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M6 12h.01M18 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
                {dt.id === 'commission' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>}
                {dt.id === 'hybrid'     && <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="15" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/></svg>}
                {dt.id === 'custom'     && <PenIcon s={20}/>}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-[14.5px] font-extrabold text-ink">{dt.title}</p>
                <p className="mt-0.5 text-[11.5px] font-bold uppercase tracking-[0.07em]" style={{ color: dt.color }}>{dt.sub}</p>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink/55">{dt.description}</p>
              </div>
              <div className={`absolute right-4 top-4 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${sel ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                {sel && <Check s={10}/>}
              </div>
            </button>
          )
        })}
      </div>
      {dealType === 'custom' && (
        <div className="mt-4">
          <FieldLabel>Describe the deal structure *</FieldLabel>
          <textarea className={`${INP} min-h-[88px] resize-y leading-relaxed`} value={customDealDescription}
            onChange={e => onUpdate('custom', e.target.value)}
            placeholder="e.g. Brand provides product samples (€150 value) plus 10% commission on tracked sales over 60 days. No flat fee applies."/>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MANAGEMENT STANDARD — Step 1: Agreement scope selector
   full_management vs single_campaign
   ════════════════════════════════════════════════════════════════════ */
function MgmtStep1({ d, u }: { d: MgmtDraft; u: (p: Partial<MgmtDraft>) => void }) {
  return (
    <div>
      <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">What scope of management?</h2>
      <p className="mt-1 text-[13.5px] leading-[1.6] text-ink/50">Determines which clauses appear in the agreement and how the retainer is structured.</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          {
            id: 'full_management' as ManagementScope, icon: <RepeatIcon s={24}/>, color: '#8B31E8', bg: '#f5f0fe',
            title: 'Full influencer marketing management', sub: 'Ongoing monthly retainer',
            desc: "Agency manages all of the brand's influencer marketing on Creator Nexus — campaigns, creator selection, contracts, payment processing, and reporting.",
            bullets: ['All campaigns handled by agency', 'Monthly retainer fee', 'Full brand dashboard access', 'Minimum notice period to terminate'],
          },
          {
            id: 'single_campaign' as ManagementScope, icon: <ZapIcon s={24}/>, color: '#2563EB', bg: '#eff4fe',
            title: 'Single campaign delivery', sub: 'One-time project fee',
            desc: 'Agency is hired to plan and execute one specific campaign — not an ongoing relationship. Scoped to named campaign with a fixed delivery fee.',
            bullets: ['Named campaign only', 'One-time fee on delivery', 'No ongoing commitment', 'Easy to upgrade to full management'],
          },
        ].map(opt => {
          const sel = d.managementScope === opt.id
          return (
            <button key={opt.id} type="button" onClick={() => u({ managementScope: opt.id })}
              className={`relative flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${sel ? 'border-primary/30 bg-primary/[0.03] shadow-[0_0_0_1px_rgba(139,49,232,0.15),0_6px_20px_-6px_rgba(139,49,232,0.26)]' : `border-primary/10 bg-white hover:border-primary/20 ${CARD}`}`}>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: opt.bg, color: opt.color }}>{opt.icon}</div>
              <div className="flex-1 pt-0.5">
                <p className="text-[14px] font-extrabold text-ink">{opt.title}</p>
                <p className="mt-0.5 text-[11.5px] font-bold uppercase tracking-[0.07em]" style={{ color: opt.color }}>{opt.sub}</p>
                <p className="mt-1.5 text-[12.5px] leading-[1.6] text-ink/55">{opt.desc}</p>
                <ul className="mt-3 space-y-1">
                  {opt.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-[12px] text-ink/50">
                      <span className="h-1 w-1 rounded-full bg-ink/30 flex-shrink-0"/>{b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`absolute right-4 top-4 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${sel ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                {sel && <Check s={10}/>}
              </div>
            </button>
          )
        })}
      </div>
      {d.managementScope === 'single_campaign' && (
        <div className="mt-4">
          <FieldLabel>Campaign name (optional)</FieldLabel>
          <input className={INP} value={d.campaignName} onChange={e => u({ campaignName: e.target.value })} placeholder="e.g. Summer Launch — Q3 2026"/>
        </div>
      )}
    </div>
  )
}

/* MANAGEMENT STANDARD — Step 2: Agency + Brand parties */
function MgmtStep2({ d, u }: { d: MgmtDraft; u: (p: Partial<MgmtDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Parties to this agreement</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Agency as service provider, brand as client. No creator is party to a management agreement.</p>
      </div>
      {/* Agency block */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${GRAD_BTN} text-white`}><BriefcaseIcon s={13}/></span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Agency (service provider)</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Agency name *"><input className={INP} value={d.agencyName} onChange={e => u({ agencyName: e.target.value })} placeholder="Baltic Creators Agency"/></Field>
          <Field label="Registration number (optional)"><input className={INP} value={d.agencyReg} onChange={e => u({ agencyReg: e.target.value })} placeholder="e.g. 40203456789"/></Field>
        </div>
      </div>
      {/* Brand block */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><BuildingIcon s={13}/></span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Brand (client)</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Brand / company name *"><input className={INP} value={d.brandName} onChange={e => u({ brandName: e.target.value })} placeholder="Kinetics SIA"/></Field>
          <Field label="Registration number (optional)"><input className={INP} value={d.brandReg} onChange={e => u({ brandReg: e.target.value })} placeholder="e.g. 40203456789"/></Field>
        </div>
      </div>
    </div>
  )
}

/* MANAGEMENT STANDARD — Step 3: Scope & authority */
function MgmtStep3({ d, u }: { d: MgmtDraft; u: (p: Partial<MgmtDraft>) => void }) {
  const updBullet    = (i: number, v: string) => { const next = [...d.authorityBullets]; next[i] = v; u({ authorityBullets: next }) }
  const addBullet    = () => u({ authorityBullets: [...d.authorityBullets, ''] })
  const removeBullet = (i: number) => u({ authorityBullets: d.authorityBullets.filter((_, j) => j !== i) })
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Scope & authority</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Define exactly what the agency is authorised to do, plus notice and exclusivity terms.</p>
      </div>
      {/* Authority bullets */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><ShieldIcon s={13}/></span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Authority granted by brand</p>
        </div>
        <p className="mb-3 text-[12.5px] text-ink/55">The brand explicitly authorises the agency to perform the following on its behalf:</p>
        <div className="space-y-2.5">
          {d.authorityBullets.map((b, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-3.5 w-5 flex-shrink-0 text-right text-[11px] font-bold text-ink/30">{i + 1}.</span>
              <input className={`${INP} flex-1`} value={b} onChange={e => updBullet(i, e.target.value)}
                placeholder={`Authority item ${i + 1}…`}/>
              {d.authorityBullets.length > 1 && (
                <button type="button" onClick={() => removeBullet(i)}
                  className="mt-3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink/28 hover:bg-rose-50 hover:text-rose-400"><XIcon s={12}/></button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addBullet}
          className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-bold text-primary/70 transition hover:bg-primary/[0.06] hover:text-primary">
          <PlusIcon s={12}/>Add authority item
        </button>
      </div>
      {/* Notice + exclusivity */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 space-y-4 ${CARD}`}>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Termination & exclusivity</p>
        <Field label="Notice period to terminate">
          <select className={INP} value={d.noticePeriodDays} onChange={e => u({ noticePeriodDays: e.target.value })}>
            {['14', '30', '60', '90'].map(n => <option key={n} value={n}>{n} days written notice required</option>)}
          </select>
        </Field>
        <CheckRow
          label="Include exclusivity clause"
          description="Brand agrees not to hire other agencies for influencer marketing on Creator Nexus for the duration of this agreement."
          checked={d.exclusivityClause}
          onChange={v => u({ exclusivityClause: v })}
        />
      </div>
    </div>
  )
}

/* MANAGEMENT STANDARD — Step 4: Retainer & payment */
function MgmtStep4({ d, u }: { d: MgmtDraft; u: (p: Partial<MgmtDraft>) => void }) {
  const isOngoing = d.managementScope === 'full_management'
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Retainer & payment terms</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Set the {isOngoing ? 'monthly retainer' : 'delivery fee'}, schedule, and late payment obligations. These become binding clauses.</p>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">{isOngoing ? 'Monthly retainer' : 'Project fee'}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Currency">
            <select className={INP} value={d.retainerCurrency} onChange={e => u({ retainerCurrency: e.target.value })}>
              {['EUR', 'USD', 'GBP'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={isOngoing ? 'Monthly amount *' : 'One-time delivery fee *'} className="sm:col-span-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">{d.retainerCurrency}</span>
              <input type="number" min={0} className={`${INP} pl-12`} value={d.retainerAmount} onChange={e => u({ retainerAmount: e.target.value })} placeholder={isOngoing ? '1200' : '700'}/>
            </div>
          </Field>
        </div>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Schedule</p>
        <Field label="Payment schedule">
          <textarea className={`${INP} min-h-[72px] resize-y`} value={d.paymentSchedule} onChange={e => u({ paymentSchedule: e.target.value })}
            placeholder={isOngoing
              ? 'e.g. Retainer due on the 1st of each month. First payment within 5 days of signing.'
              : 'e.g. 50% on contract signing, 50% within 14 days of campaign completion.'}/>
        </Field>
        <div className="mt-4 space-y-1">
          <CheckRow label="Brand must acknowledge invoice before payment processes" checked={d.invoiceRequired} onChange={v => u({ invoiceRequired: v })}/>
          <CheckRow label="Include late payment clause (1.5% per month after 30 days overdue)" checked={d.latePaymentClause} onChange={v => u({ latePaymentClause: v })}/>
        </div>
      </div>
    </div>
  )
}

/* MANAGEMENT STANDARD — Step 5: Review & Sign */
function MgmtStep5({ d, u, onJump }: { d: MgmtDraft; u: (p: Partial<MgmtDraft>) => void; onJump: (n: number) => void }) {
  const scopeLabel = d.managementScope === 'full_management' ? 'Full influencer marketing management' : 'Single campaign delivery'
  const isOngoing  = d.managementScope === 'full_management'
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Review & sign</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Agency signs first. Contract is then sent to the brand for their countersignature.</p>
      </div>
      {/* Rendered management agreement */}
      <div className={`overflow-hidden rounded-2xl border-2 border-ink/10 bg-white ${CARD}`}>
        <div className="border-b border-ink/10 px-7 py-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/35">Agency Management Agreement</p>
          <h3 className="mt-1 text-[17px] font-extrabold text-ink">
            {d.managementScope === 'single_campaign' && d.campaignName
              ? d.campaignName
              : `Management Agreement — ${d.brandName || 'Brand'}`}
          </h3>
          <p className="mt-1 text-[12px] text-ink/45">
            Between <strong className="text-ink">{d.agencyName || 'Agency'}</strong> and <strong className="text-ink">{d.brandName || 'Brand'}</strong>
            {' '}· Prepared by Nexfluence
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary/[0.07] px-3 py-1 text-[11.5px] font-bold text-primary">{scopeLabel}</div>
        </div>
        <div className="px-7 py-2">
          <ReviewRow label="Agreement type"  value={scopeLabel}/>
          <ReviewRow label="Agency"          value={`${d.agencyName}${d.agencyReg ? ` (Reg. ${d.agencyReg})` : ''}`}/>
          <ReviewRow label="Brand (client)"  value={`${d.brandName}${d.brandReg ? ` (Reg. ${d.brandReg})` : ''}`}/>
          {d.managementScope === 'single_campaign' && d.campaignName && <ReviewRow label="Campaign" value={d.campaignName}/>}
          <ReviewRow label="Authority items" value={`${d.authorityBullets.filter(b => b.trim()).length} items defined`}/>
          <ReviewRow label="Notice period"   value={`${d.noticePeriodDays} days written notice`}/>
          {d.exclusivityClause && <ReviewRow label="Exclusivity" value="Included — platform exclusivity for agreement duration"/>}
          <ReviewRow label={isOngoing ? 'Monthly retainer' : 'Delivery fee'} value={d.retainerAmount ? `${d.retainerCurrency} ${d.retainerAmount}${isOngoing ? '/month' : ' (one-time)'}` : null}/>
          {d.paymentSchedule && <ReviewRow label="Payment schedule" value={d.paymentSchedule}/>}
          {d.invoiceRequired   && <ReviewRow label="Invoice"      value="Required before payment releases"/>}
          {d.latePaymentClause && <ReviewRow label="Late payment" value="1.5% per month after 30 days overdue"/>}
        </div>
        {/* Signature sequence indicator */}
        <div className="flex flex-wrap items-center gap-2 border-t border-ink/8 px-7 py-4">
          <span className={`flex items-center gap-1.5 rounded-full ${GRAD_BTN} px-3 py-1.5 text-[11.5px] font-bold text-white`}>1. Agency signs</span>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-sub px-3 py-1.5 text-[11.5px] font-bold text-ink/50">2. Brand countersigns</span>
          <button type="button" onClick={() => onJump(2)} className="ml-auto text-[12px] font-bold text-primary hover:underline">Edit parties</button>
        </div>
      </div>
      <SignBlock signerName={d.signerName} signerDesignation={d.signerDesignation} signerOrg={d.signerOrg} onChange={f => u({ ...f })}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CAMPAIGN (TRIPARTITE) STANDARD — Steps 2-5
   ════════════════════════════════════════════════════════════════════ */

/* Step 2 — Three party blocks */
function CampStep2({ d, u }: { d: CampaignDraft; u: (p: Partial<CampaignDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Three parties to this contract</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Agency operates the campaign, brand funds it, creator delivers the content. All three sign.</p>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-primary/12 bg-primary/[0.04] px-4 py-3">
        <InfoIcon s={15}/>
        <p className="text-[12.5px] text-ink/60"><span className="font-bold text-ink">3-party contract.</span> Agency signs first as operator, then sends to brand and creator for co-signature.</p>
      </div>
      {/* Agency */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${GRAD_BTN} text-white`}><BriefcaseIcon s={13}/></span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Agency (campaign operator)</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Agency name *"><input className={INP} value={d.agencyName} onChange={e => u({ agencyName: e.target.value })} placeholder="Baltic Creators Agency"/></Field>
          <Field label="Registration number"><input className={INP} value={d.agencyReg} onChange={e => u({ agencyReg: e.target.value })} placeholder="Optional"/></Field>
        </div>
      </div>
      {/* Brand */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><BuildingIcon s={13}/></span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Brand (campaign funder)</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Brand / company name *"><input className={INP} value={d.brandName} onChange={e => u({ brandName: e.target.value })} placeholder="Kinetics SIA"/></Field>
          <Field label="Registration number"><input className={INP} value={d.brandReg} onChange={e => u({ brandReg: e.target.value })} placeholder="Optional"/></Field>
        </div>
      </div>
      {/* Creator */}
      <div className={`rounded-2xl border border-sky-200 bg-sky-50/40 p-5 ${CARD}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600"><UsersIcon s={13}/></span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">Creator (content deliverer)</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Creator full name *"><input className={INP} value={d.creatorName} onChange={e => u({ creatorName: e.target.value })} placeholder="Amelia Roze"/></Field>
          <Field label="Primary handle *"><input className={INP} value={d.creatorHandle} onChange={e => u({ creatorHandle: e.target.value })} placeholder="@amelia.roze"/></Field>
          <Field label="Campaign name *"><input className={INP} value={d.campaignName} onChange={e => u({ campaignName: e.target.value })} placeholder="Vitamin-C Recovery Stack — Summer 2026"/></Field>
          <Field label="Campaign objective"><input className={INP} value={d.campaignObjective} onChange={e => u({ campaignObjective: e.target.value })} placeholder="e.g. Conversions — product sales"/></Field>
        </div>
      </div>
    </div>
  )
}

/* Step 3 — Deliverables (identical to brand contract) */
function CampStep3({ d, u }: { d: CampaignDraft; u: (p: Partial<CampaignDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Deliverables & timeline</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">What content the creator commits to, and when.</p>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Content</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Number of pieces *"><input className={INP} value={d.pieces} onChange={e => u({ pieces: e.target.value })} placeholder="e.g. 3"/></Field>
          <Field label="Content formats"><input className={INP} value={d.formats} onChange={e => u({ formats: e.target.value })} placeholder="e.g. 1× Reel, 2× Story series"/></Field>
          <Field label="Publishing platforms *"><input className={INP} value={d.platforms} onChange={e => u({ platforms: e.target.value })} placeholder="e.g. Instagram, TikTok"/></Field>
          <Field label="Posting window"><input className={INP} value={d.postingWindow} onChange={e => u({ postingWindow: e.target.value })} placeholder="e.g. Mon–Thu, 08:00–20:00"/></Field>
        </div>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Timeline</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Campaign start date"><input type="date" className={INP} value={d.startDate} onChange={e => u({ startDate: e.target.value })}/></Field>
          <Field label="Campaign end date"><input type="date" className={INP} value={d.endDate} onChange={e => u({ endDate: e.target.value })}/></Field>
        </div>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Rights & exclusivity</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Usage rights granted"><input className={INP} value={d.usageRights} onChange={e => u({ usageRights: e.target.value })} placeholder="e.g. 12 months, non-exclusive, digital"/></Field>
          <Field label="Exclusivity period (optional)"><input className={INP} value={d.exclusivityPeriod} onChange={e => u({ exclusivityPeriod: e.target.value })} placeholder="e.g. 30 days category exclusivity"/></Field>
        </div>
      </div>
    </div>
  )
}

/* Step 4 — Creator payment + AGENCY FEE (agency-only addition) */
function CampStep4({ d, u }: { d: CampaignDraft; u: (p: Partial<CampaignDraft>) => void }) {
  const showFlat = d.dealType === 'cash' || d.dealType === 'hybrid'
  const showComm = d.dealType === 'commission' || d.dealType === 'hybrid'
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Payment terms</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Creator compensation and your agency management fee. Both appear as binding clauses.</p>
      </div>
      {/* Creator compensation */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Creator compensation</p>
        <p className="mb-4 text-[12px] text-ink/45">What the brand pays the creator — held in Grade escrow, released on completion</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Currency">
            <select className={INP} value={d.currency} onChange={e => u({ currency: e.target.value })}>
              {['EUR','USD','GBP','SEK','PLN'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          {showFlat && (
            <Field label={d.dealType === 'hybrid' ? 'Base flat fee *' : 'Flat fee *'}>
              <div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">{d.currency}</span>
                <input type="number" min={0} className={`${INP} pl-12`} value={d.flatAmount} onChange={e => u({ flatAmount: e.target.value })} placeholder="350"/></div>
            </Field>
          )}
          {showComm && (
            <Field label="Commission rate *">
              <div className="relative"><input type="number" min={1} max={50} className={`${INP} pr-8`} value={d.commissionRate} onChange={e => u({ commissionRate: e.target.value })} placeholder="15"/>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">%</span></div>
            </Field>
          )}
          {showComm && (
            <Field label="Tracking method">
              <input className={INP} value={d.commissionTracking} onChange={e => u({ commissionTracking: e.target.value })} placeholder="e.g. Nexfluence affiliate link + UTM code"/>
            </Field>
          )}
        </div>
      </div>

      {/* ── AGENCY FEE — exclusive to agency contracts ── */}
      <div className={`rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent p-5 ${CARD}`}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${GRAD_BTN} text-white`}><BriefcaseIcon s={13}/></span>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70">Agency management fee</p>
          </div>
          <span className={`rounded-full ${GRAD_BTN} px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] text-white`}>Agency only</span>
        </div>
        {/* Fee type pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: 'percent'            as AgencyFeeType, label: '% of campaign value' },
            { id: 'flat'               as AgencyFeeType, label: 'Flat fee'              },
            { id: 'invoice_separately' as AgencyFeeType, label: 'Invoice separately'    },
          ].map(opt => (
            <button key={opt.id} type="button" onClick={() => u({ agencyFeeType: opt.id })}
              className={`flex items-center gap-1.5 rounded-xl border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition ${d.agencyFeeType === opt.id ? `border-primary/30 ${GRAD_BTN} text-white` : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
              {d.agencyFeeType === opt.id && <Check s={10}/>}{opt.label}
            </button>
          ))}
        </div>
        {d.agencyFeeType === 'percent' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Agency fee % *">
              <div className="relative"><input type="number" min={1} max={50} className={`${INP} pr-8`} value={d.agencyFeePercent} onChange={e => u({ agencyFeePercent: e.target.value })} placeholder="15"/>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">%</span></div>
              <p className="mt-1.5 text-[11.5px] text-ink/40">Deducted by Grade at payout before creator receives funds</p>
            </Field>
          </div>
        )}
        {d.agencyFeeType === 'flat' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Flat agency fee *">
              <div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">{d.currency}</span>
                <input type="number" min={0} className={`${INP} pl-12`} value={d.agencyFeeFlat} onChange={e => u({ agencyFeeFlat: e.target.value })} placeholder="250"/></div>
              <p className="mt-1.5 text-[11.5px] text-ink/40">Invoiced to brand separately on campaign completion</p>
            </Field>
          </div>
        )}
        {d.agencyFeeType === 'invoice_separately' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/10 bg-primary/[0.04] px-4 py-3">
            <InfoIcon s={14}/>
            <p className="text-[12.5px] text-ink/60">Agency will invoice the brand separately for management services. No fee deducted from creator's Grade payout.</p>
          </div>
        )}
      </div>

      {/* Payment schedule */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Creator payment schedule</p>
        <Field label="Payment schedule">
          <textarea className={`${INP} min-h-[72px] resize-y`} value={d.paymentSchedule} onChange={e => u({ paymentSchedule: e.target.value })}
            placeholder="e.g. 50% on brief approval, 50% within 14 days of all content going live"/>
        </Field>
        <div className="mt-4 space-y-1">
          <CheckRow label="Creator must submit invoice before payment releases" checked={d.invoiceRequired} onChange={v => u({ invoiceRequired: v })}/>
          <CheckRow label="Include late payment clause (1.5% per month after 30 days)" checked={d.latePaymentClause} onChange={v => u({ latePaymentClause: v })}/>
        </div>
      </div>
    </div>
  )
}

/* Step 5 — Campaign tripartite review */
function CampStep5({ d, u, onJump }: { d: CampaignDraft; u: (p: Partial<CampaignDraft>) => void; onJump: (n: number) => void }) {
  const dealLabel = DEAL_TYPES.find(t => t.id === d.dealType)?.title ?? d.dealType
  const budgetSummary =
    d.dealType === 'cash'       ? `${d.currency} ${d.flatAmount}`
    : d.dealType === 'commission' ? `${d.commissionRate}% commission`
    : d.dealType === 'hybrid'     ? `${d.currency} ${d.flatAmount} + ${d.commissionRate}%`
    : d.customDealDescription || 'Custom'
  const agencyFeeSummary =
    d.agencyFeeType === 'percent'            ? `${d.agencyFeePercent}% of campaign value (via Grade)`
    : d.agencyFeeType === 'flat'             ? `${d.currency} ${d.agencyFeeFlat} (invoiced separately)`
    : 'Invoiced to brand separately'
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Review & sign</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Agency signs first. Contract is then sent to brand and creator for co-signature.</p>
      </div>
      <div className={`overflow-hidden rounded-2xl border-2 border-ink/10 bg-white ${CARD}`}>
        <div className="border-b border-ink/10 px-7 py-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/35">Three-Party Campaign Agreement</p>
          <h3 className="mt-1 text-[17px] font-extrabold text-ink">{d.campaignName || 'Campaign name'}</h3>
          <p className="mt-1 text-[12px] text-ink/45">
            {d.agencyName} · {d.brandName} · {d.creatorName} · Prepared by Nexfluence
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11.5px] font-bold text-sky-700">3-party · {dealLabel}</div>
        </div>
        <div className="px-7 py-2">
          <ReviewRow label="Agency (operator)"    value={`${d.agencyName}${d.agencyReg ? ` (Reg. ${d.agencyReg})` : ''}`}/>
          <ReviewRow label="Brand (funder)"        value={`${d.brandName}${d.brandReg ? ` (Reg. ${d.brandReg})` : ''}`}/>
          <ReviewRow label="Creator (deliverer)"   value={`${d.creatorName} ${d.creatorHandle}`}/>
          <ReviewRow label="Campaign"              value={d.campaignName}/>
          {d.campaignObjective && <ReviewRow label="Objective" value={d.campaignObjective}/>}
          <ReviewRow label="Deliverables"          value={d.pieces ? `${d.pieces} piece${Number(d.pieces) !== 1 ? 's' : ''} — ${d.formats || d.platforms}` : null}/>
          <ReviewRow label="Dates"                 value={d.startDate && d.endDate ? `${d.startDate} → ${d.endDate}` : d.startDate || null}/>
          <ReviewRow label="Usage rights"          value={d.usageRights}/>
          {d.exclusivityPeriod && <ReviewRow label="Exclusivity" value={d.exclusivityPeriod}/>}
          <ReviewRow label="Creator compensation"  value={budgetSummary}/>
          {d.commissionTracking && <ReviewRow label="Tracking" value={d.commissionTracking}/>}
          {d.paymentSchedule && <ReviewRow label="Payment schedule" value={d.paymentSchedule}/>}
          <ReviewRow label="Agency fee"            value={agencyFeeSummary}/>
          {d.invoiceRequired   && <ReviewRow label="Invoice"     value="Required before payment releases"/>}
          {d.latePaymentClause && <ReviewRow label="Late payment" value="1.5% per month after 30 days"/>}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-ink/8 px-7 py-4">
          <span className={`flex items-center gap-1.5 rounded-full ${GRAD_BTN} px-3 py-1.5 text-[11.5px] font-bold text-white`}>1. Agency signs</span>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-sub px-3 py-1.5 text-[11.5px] font-bold text-ink/50">2. Brand signs</span>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-sub px-3 py-1.5 text-[11.5px] font-bold text-ink/50">3. Creator signs</span>
          <button type="button" onClick={() => onJump(2)} className="ml-auto text-[12px] font-bold text-primary hover:underline">Edit parties</button>
        </div>
      </div>
      <SignBlock signerName={d.signerName} signerDesignation={d.signerDesignation} signerOrg={d.signerOrg} onChange={f => u({ ...f })}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CUSTOM CONTRACT STEPS — shared for both management and campaign
   ════════════════════════════════════════════════════════════════════ */

/* Custom Step 1 — management: scope selector / campaign: deal type */
/* (reuses MgmtStep1 or DealTypeStep, wired in the page render below) */

/* Custom Step 2 — parties (management = 2-party, campaign = 3-party) */
function CustomPartiesStep({ d, u }: { d: CustomDraft; u: (p: Partial<CustomDraft>) => void }) {
  const isCampaign = d.agreementType === 'campaign'
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Parties to this contract</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">{isCampaign ? 'Agency, brand, and creator — all three sign.' : 'Agency as service provider and brand as client.'}</p>
      </div>
      {isCampaign && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/12 bg-primary/[0.04] px-4 py-3">
          <InfoIcon s={15}/>
          <p className="text-[12.5px] text-ink/60"><span className="font-bold text-ink">3-party contract.</span> Agency signs first, then sends to brand and creator.</p>
        </div>
      )}
      {/* Agency */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${GRAD_BTN} text-white`}><BriefcaseIcon s={13}/></span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Agency</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Agency name *"><input className={INP} value={d.agencyName} onChange={e => u({ agencyName: e.target.value })} placeholder="Baltic Creators Agency"/></Field>
          <Field label="Reg. number"><input className={INP} value={d.agencyReg} onChange={e => u({ agencyReg: e.target.value })} placeholder="Optional"/></Field>
        </div>
      </div>
      {/* Brand */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><BuildingIcon s={13}/></span>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Brand</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Brand / company name *"><input className={INP} value={d.brandName} onChange={e => u({ brandName: e.target.value })} placeholder="Kinetics SIA"/></Field>
          <Field label="Reg. number"><input className={INP} value={d.brandReg} onChange={e => u({ brandReg: e.target.value })} placeholder="Optional"/></Field>
        </div>
      </div>
      {/* Creator (campaign only) */}
      {isCampaign && (
        <div className={`rounded-2xl border border-sky-200 bg-sky-50/40 p-5 ${CARD}`}>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600"><UsersIcon s={13}/></span>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-600">Creator</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Creator full name *"><input className={INP} value={d.creatorName} onChange={e => u({ creatorName: e.target.value })} placeholder="Amelia Roze"/></Field>
            <Field label="Primary handle *"><input className={INP} value={d.creatorHandle} onChange={e => u({ creatorHandle: e.target.value })} placeholder="@amelia.roze"/></Field>
            <Field label="Campaign / agreement name" className="sm:col-span-2"><input className={INP} value={d.campaignName} onChange={e => u({ campaignName: e.target.value })} placeholder="e.g. Vitamin-C Recovery Stack — Summer 2026"/></Field>
          </div>
        </div>
      )}
      {!isCampaign && (
        <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
          <Field label="Agreement name (optional)"><input className={INP} value={d.campaignName} onChange={e => u({ campaignName: e.target.value })} placeholder="e.g. Q3 Management Agreement — Kinetics"/></Field>
        </div>
      )}
    </div>
  )
}

/* Custom Step 3 — Section/clause builder (identical to brand contract) */
function SectionHeadingModal({ onConfirm, onClose }: { onConfirm: (heading: string) => void; onClose: () => void }) {
  const [heading, setHeading] = useState('')
  const inp = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inp.current?.focus()
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[400px] overflow-hidden rounded-2xl bg-white p-6 ${CARD}`}>
        <h3 className="mb-1 text-[16px] font-extrabold text-ink">New section</h3>
        <p className="mb-4 text-[13px] text-ink/50">Give this section a heading. You'll write numbered clauses inside it next.</p>
        <Field label="Section heading *">
          <input ref={inp} className={INP} value={heading} onChange={e => setHeading(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && heading.trim()) { onConfirm(heading.trim()); onClose() } }}
            placeholder="e.g. Scope of Authority, Agency Fee, Confidentiality, Termination"/>
        </Field>
        <div className="mt-4 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Cancel</button>
          <button type="button" disabled={!heading.trim()}
            onClick={() => { if (heading.trim()) { onConfirm(heading.trim()); onClose() } }}
            className={`flex-[2] rounded-xl py-3 text-[13.5px] font-bold text-white transition ${heading.trim() ? `${GRAD_BTN} shadow-[0_6px_18px_-4px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            Add section
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomBodyStep({ sections, onChange }: { sections: Section[]; onChange: (s: Section[]) => void }) {
  const [showModal, setShowModal] = useState(false)
  const addSection    = (heading: string) => onChange([...sections, { id: `s-${Date.now()}`, heading, clauses: [{ id: `c-${Date.now()}`, text: '' }] }])
  const removeSection = (sid: string) => onChange(sections.filter(s => s.id !== sid))
  const addClause     = (sid: string) => onChange(sections.map(s => s.id !== sid ? s : { ...s, clauses: [...s.clauses, { id: `c-${Date.now()}`, text: '' }] }))
  const updateClause  = (sid: string, cid: string, text: string) => onChange(sections.map(s => s.id !== sid ? s : { ...s, clauses: s.clauses.map(c => c.id !== cid ? c : { ...c, text }) }))
  const removeClause  = (sid: string, cid: string) => onChange(sections.map(s => s.id !== sid ? s : { ...s, clauses: s.clauses.filter(c => c.id !== cid) }))
  return (
    <div className="space-y-5">
      {showModal && <SectionHeadingModal onConfirm={addSection} onClose={() => setShowModal(false)}/>}
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Build your contract</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Add sections, write numbered clauses inside each. Common sections: Scope of Authority, Agency Fee, Deliverables, Payment Terms, Confidentiality, Termination.</p>
      </div>
      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-surface-sub/50 py-14 text-center">
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${GRAD_BTN} text-white`}><FileIcon s={22}/></div>
          <p className="text-[14px] font-extrabold text-ink">No sections yet</p>
          <p className="mt-1.5 max-w-[300px] text-[12.5px] text-ink/45">Click "New section" to start building.</p>
        </div>
      )}
      {sections.map((section, si) => (
        <div key={section.id} className={`rounded-2xl border border-primary/12 bg-white p-5 ${CARD}`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg ${GRAD_BTN} text-[11px] font-black text-white`}>{si + 1}</span>
              <h3 className="text-[14.5px] font-extrabold text-ink">{section.heading}</h3>
            </div>
            <button type="button" onClick={() => removeSection(section.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/35 hover:bg-rose-50 hover:text-rose-500"><TrashIcon s={13}/></button>
          </div>
          <div className="space-y-2.5">
            {section.clauses.map((clause, ci) => (
              <div key={clause.id} className="flex items-start gap-2.5">
                <span className="mt-3.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-surface-sub text-[10.5px] font-extrabold text-ink/40">{ci + 1}</span>
                <textarea className={`${INP} flex-1 min-h-[64px] resize-y leading-relaxed text-[13.5px]`}
                  value={clause.text} onChange={e => updateClause(section.id, clause.id, e.target.value)}
                  placeholder={`Clause ${ci + 1}…`}/>
                {section.clauses.length > 1 && (
                  <button type="button" onClick={() => removeClause(section.id, clause.id)}
                    className="mt-3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink/28 hover:bg-rose-50 hover:text-rose-400"><XIcon s={12}/></button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addClause(section.id)}
            className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-bold text-primary/70 transition hover:bg-primary/[0.06] hover:text-primary"><PlusIcon s={12}/>Add clause</button>
        </div>
      ))}
      <button type="button" onClick={() => setShowModal(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/25 py-4 text-[13.5px] font-bold text-primary transition hover:border-primary/45 hover:bg-primary/[0.03]">
        <PlusIcon s={14}/>New section
      </button>
    </div>
  )
}

/* Custom Step 4 — Review & Sign */
function CustomReviewStep({ d, u, onJump }: { d: CustomDraft; u: (p: Partial<CustomDraft>) => void; onJump: (n: number) => void }) {
  const isCampaign = d.agreementType === 'campaign'
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Review & sign</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Your contract as the other parties will see it. Agency signs first.</p>
      </div>
      <div className={`overflow-hidden rounded-2xl border-2 border-ink/10 bg-white ${CARD}`}>
        <div className="border-b border-ink/10 px-7 py-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/35">
            {isCampaign ? 'Three-Party Campaign Agreement' : 'Agency Management Agreement'}
          </p>
          <h3 className="mt-1 text-[17px] font-extrabold text-ink">{d.campaignName || 'Untitled contract'}</h3>
          <p className="mt-1 text-[12px] text-ink/45">
            {isCampaign
              ? <>{d.agencyName} · {d.brandName} · {d.creatorName}</>
              : <>Between <strong className="text-ink">{d.agencyName}</strong> and <strong className="text-ink">{d.brandName}</strong></>
            }
            {' '}· Prepared by Nexfluence
          </p>
        </div>
        <div className="divide-y divide-ink/8 px-7 py-2">
          {d.sections.length === 0 && <p className="py-6 text-center text-[13px] italic text-ink/35">No sections added yet.</p>}
          {d.sections.map((section, si) => (
            <div key={section.id} className="py-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[12px] font-black uppercase tracking-[0.1em] text-ink/40">{si + 1}.</span>
                <h4 className="text-[14px] font-extrabold uppercase tracking-[0.08em] text-ink">{section.heading}</h4>
              </div>
              <ol className="space-y-3 pl-2">
                {section.clauses.map((clause, ci) => (
                  <li key={clause.id} className="flex gap-3 text-[13.5px] leading-[1.75] text-ink/70">
                    <span className="mt-0.5 flex-shrink-0 text-[11px] font-bold text-ink/35">{si + 1}.{ci + 1}</span>
                    <span>{clause.text || <em className="text-ink/28">Empty clause</em>}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-ink/8 px-7 py-4">
          <span className={`flex items-center gap-1.5 rounded-full ${GRAD_BTN} px-3 py-1.5 text-[11.5px] font-bold text-white`}>1. Agency signs</span>
          {isCampaign
            ? <><span className="flex items-center gap-1.5 rounded-full bg-surface-sub px-3 py-1.5 text-[11.5px] font-bold text-ink/50">2. Brand signs</span>
               <span className="flex items-center gap-1.5 rounded-full bg-surface-sub px-3 py-1.5 text-[11.5px] font-bold text-ink/50">3. Creator signs</span></>
            : <span className="flex items-center gap-1.5 rounded-full bg-surface-sub px-3 py-1.5 text-[11.5px] font-bold text-ink/50">2. Brand countersigns</span>
          }
          <button type="button" onClick={() => onJump(3)} className="ml-auto text-[12px] font-bold text-primary hover:underline">Edit body</button>
        </div>
      </div>
      <SignBlock signerName={d.signerName} signerDesignation={d.signerDesignation} signerOrg={d.signerOrg} onChange={f => u({ ...f })}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SEND TO BRAND MODAL — management agreement
   Agency picks which managed brand to send to + optional note
   ════════════════════════════════════════════════════════════════════ */
function SendToBrandModal({ open, contractName, signerName, onClose }: {
  open: boolean; contractName: string; signerName: string; onClose: () => void
}) {
  const [sel,     setSel]     = useState<string>(MANAGED_BRANDS[0]?.id ?? '')
  const [note,    setNote]    = useState('')
  const [sent,    setSent]    = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) { setSent(false); setSending(false); setNote('') }
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open) return null
  const brand = MANAGED_BRANDS.find(b => b.id === sel)

  const handleSend = async () => {
    setSending(true); await new Promise(r => setTimeout(r, 800)); setSending(false); setSent(true)
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
        {sent ? (
          <div className="flex flex-col items-center px-7 py-10 text-center">
            <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.50)]`}><Check s={28}/></div>
            <h3 className="text-[20px] font-extrabold text-ink">Contract sent!</h3>
            <p className="mt-2 max-w-[320px] text-[13.5px] leading-[1.7] text-ink/55">
              The management agreement has been delivered to <span className="font-bold text-ink">{brand?.name}</span>. They can sign, counter-propose, or message you back.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button onClick={onClose} className="rounded-xl border border-primary/15 bg-white px-6 py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Done</button>
              <button onClick={onClose} className={`rounded-xl ${GRAD_BTN} px-6 py-3 text-[13.5px] font-bold text-white hover:-translate-y-0.5 transition`}>View in Messages</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
              <div>
                <h3 className="text-[16px] font-extrabold text-ink">Send management agreement</h3>
                <p className="mt-0.5 text-[12px] text-ink/45">"{contractName || 'Agreement'}" · signed by {signerName || 'you'}</p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={13}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Field label="Send to which brand?">
                <div className="mt-1.5 space-y-2">
                  {MANAGED_BRANDS.map(b => (
                    <button key={b.id} type="button" onClick={() => setSel(b.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${sel === b.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                      <EntityTile initials={b.initials} color={b.color} size={34}/>
                      <div className="flex-1"><p className="text-[13.5px] font-bold text-ink">{b.name}</p><p className="text-[11.5px] text-ink/45">{b.industry}</p></div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${sel === b.id ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                        {sel === b.id && <Check s={10}/>}
                      </div>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Personal note (optional)">
                <textarea className={`${INP} min-h-[72px] resize-y text-[13px]`} value={note} onChange={e => setNote(e.target.value)} placeholder="Any context or talking points for the brand…"/>
              </Field>
            </div>
            <div className="border-t border-primary/10 px-6 py-4">
              <button onClick={handleSend} disabled={sending}
                className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-[14px] font-bold text-white transition ${!sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.48)] hover:-translate-y-0.5` : 'bg-ink/10 cursor-not-allowed text-ink/30'}`}>
                {sending
                  ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</>
                  : <><SendIcon s={15}/>Send to {brand?.name}</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SEND TRIPARTITE MODAL — 3-party campaign contract
   Picks brand + creator, chooses simultaneous vs brand-first strategy
   ════════════════════════════════════════════════════════════════════ */
function SendTripartiteModal({ open, contractName, signerName, onClose }: {
  open: boolean; contractName: string; signerName: string; onClose: () => void
}) {
  const [selBrand,   setSelBrand]   = useState<string>(MANAGED_BRANDS[0]?.id    ?? '')
  const [selCreator, setSelCreator] = useState<string>(CAMPAIGN_CREATORS[0]?.id ?? '')
  const [strategy,   setStrategy]   = useState<SendStrategy>('simultaneous')
  const [sent,       setSent]       = useState(false)
  const [sending,    setSending]    = useState(false)

  useEffect(() => {
    if (!open) { setSent(false); setSending(false) }
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  if (!open) return null
  const brand   = MANAGED_BRANDS.find(b    => b.id === selBrand)
  const creator = CAMPAIGN_CREATORS.find(c => c.id === selCreator)

  const handleSend = async () => {
    setSending(true); await new Promise(r => setTimeout(r, 900)); setSending(false); setSent(true)
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center px-4 py-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[560px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(92vh, 760px)' }}>
        {sent ? (
          <div className="flex flex-col items-center px-7 py-10 text-center">
            <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]`}><Check s={28}/></div>
            <h3 className="text-[20px] font-extrabold text-ink">Tripartite contract sent!</h3>
            <p className="mt-2 max-w-[340px] text-[13.5px] leading-[1.7] text-ink/55">
              <span className="font-bold text-ink">"{contractName || 'Contract'}"</span> has been delivered to{' '}
              <span className="font-bold text-ink">{brand?.name}</span>
              {strategy === 'simultaneous' && <> and <span className="font-bold text-ink">{creator?.name}</span> simultaneously</>}.
              {strategy === 'brand_first' && <> first. {creator?.name} will receive it once {brand?.name} signs.</>}
              {' '}All three parties must sign for it to take effect.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button onClick={onClose} className="rounded-xl border border-primary/15 bg-white px-6 py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Done</button>
              <button onClick={onClose} className={`rounded-xl ${GRAD_BTN} px-6 py-3 text-[13.5px] font-bold text-white hover:-translate-y-0.5 transition`}>View in Messages</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-4">
              <div>
                <h3 className="text-[16px] font-extrabold text-ink">Send tripartite contract</h3>
                <p className="mt-0.5 text-[12px] text-ink/45">"{contractName || 'Contract'}" · signed by {signerName || 'you'}</p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={13}/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Brand selector */}
              <Field label="Brand client (campaign funder)">
                <div className="mt-1.5 space-y-2">
                  {MANAGED_BRANDS.map(b => (
                    <button key={b.id} type="button" onClick={() => setSelBrand(b.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${selBrand === b.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                      <EntityTile initials={b.initials} color={b.color} size={34}/>
                      <div className="flex-1"><p className="text-[13.5px] font-bold text-ink">{b.name}</p><p className="text-[11.5px] text-ink/45">{b.industry}</p></div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${selBrand === b.id ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                        {selBrand === b.id && <Check s={10}/>}
                      </div>
                    </button>
                  ))}
                </div>
              </Field>
              {/* Creator selector */}
              <Field label="Creator (content deliverer)">
                <div className="mt-1.5 space-y-2">
                  {CAMPAIGN_CREATORS.map(cr => (
                    <button key={cr.id} type="button" onClick={() => setSelCreator(cr.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${selCreator === cr.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                      <PersonAvatar initials={cr.initials} color={cr.color} size={34}/>
                      <div className="flex-1"><p className="text-[13.5px] font-bold text-ink">{cr.name}</p><p className="text-[11.5px] text-ink/45">{cr.handle}</p></div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${selCreator === cr.id ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                        {selCreator === cr.id && <Check s={10}/>}
                      </div>
                    </button>
                  ))}
                </div>
              </Field>
              {/* Send strategy */}
              <div>
                <FieldLabel>Signature strategy</FieldLabel>
                <div className="mt-2 space-y-2">
                  {[
                    { id: 'simultaneous' as SendStrategy,
                      title: 'Send to brand and creator simultaneously',
                      desc: `Both ${brand?.name ?? 'brand'} and ${creator?.name ?? 'creator'} receive the contract at the same time and can sign in any order.` },
                    { id: 'brand_first' as SendStrategy,
                      title: `Send to ${brand?.name ?? 'brand'} first`,
                      desc: `${brand?.name ?? 'Brand'} reviews and signs first. The contract is then forwarded to ${creator?.name ?? 'creator'} automatically.` },
                  ].map(opt => (
                    <button key={opt.id} type="button" onClick={() => setStrategy(opt.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition ${strategy === opt.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                      <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${strategy === opt.id ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                        {strategy === opt.id && <Check s={10}/>}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-bold text-ink">{opt.title}</p>
                        <p className="mt-0.5 text-[12px] text-ink/50">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
              <button onClick={handleSend} disabled={sending}
                className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-[14px] font-bold text-white transition ${!sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.48)] hover:-translate-y-0.5` : 'bg-ink/10 cursor-not-allowed text-ink/30'}`}>
                {sending
                  ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</>
                  : <><SendIcon s={15}/>
                    {strategy === 'simultaneous'
                      ? `Send to ${brand?.name ?? 'brand'} & ${creator?.name ?? 'creator'}`
                      : `Send to ${brand?.name ?? 'brand'} first`}</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   VALIDATION
   ════════════════════════════════════════════════════════════════════ */
function canAdvanceMgmt(step: number, d: MgmtDraft): boolean {
  if (step === 1) return true
  if (step === 2) return d.agencyName.trim().length > 0 && d.brandName.trim().length > 0
  if (step === 3) return d.authorityBullets.some(b => b.trim().length > 0) && d.noticePeriodDays.length > 0
  if (step === 4) return d.retainerAmount.trim().length > 0
  return d.signerName.trim().length > 0 && d.signerDesignation.trim().length > 0 && d.signerOrg.trim().length > 0
}
function canAdvanceCamp(step: number, d: CampaignDraft): boolean {
  if (step === 1) return d.dealType !== null && (d.dealType !== 'custom' || d.customDealDescription.trim().length > 0)
  if (step === 2) return d.agencyName.trim().length > 0 && d.brandName.trim().length > 0 && d.creatorName.trim().length > 0 && d.campaignName.trim().length > 0
  if (step === 3) return d.pieces.trim().length > 0 && d.platforms.trim().length > 0
  if (step === 4) {
    const basePaid = d.dealType === 'cash'       ? d.flatAmount.trim().length > 0
                   : d.dealType === 'commission'  ? d.commissionRate.trim().length > 0
                   : d.dealType === 'hybrid'       ? (d.flatAmount.trim().length > 0 && d.commissionRate.trim().length > 0)
                   : true
    const feePaid  = d.agencyFeeType === 'percent'  ? d.agencyFeePercent.trim().length > 0
                   : d.agencyFeeType === 'flat'       ? d.agencyFeeFlat.trim().length > 0
                   : true
    return basePaid && feePaid
  }
  return d.signerName.trim().length > 0 && d.signerDesignation.trim().length > 0 && d.signerOrg.trim().length > 0
}
function canAdvanceCustom(step: number, d: CustomDraft): boolean {
  if (step === 1) return d.agreementType === 'management' ? true : (d.dealType !== null && (d.dealType !== 'custom' || d.customDealDescription.trim().length > 0))
  if (step === 2) return d.agencyName.trim().length > 0 && d.brandName.trim().length > 0
  if (step === 3) return d.sections.length > 0 && d.sections.every(s => s.clauses.some(c => c.text.trim().length > 0))
  return d.signerName.trim().length > 0 && d.signerDesignation.trim().length > 0 && d.signerOrg.trim().length > 0
}

/* ════════════════════════════════════════════════════════════════════
   PAGE — wires all four flows into one route
   ════════════════════════════════════════════════════════════════════ */
export default function AgencyContractPage() {
  const router = useRouter()

  /* Wizard state */
  const [agreementType, setAgreementType] = useState<AgreementType | null>(null)
  const [buildMode,     setBuildMode]     = useState<BuildMode | null>(null)
  const [step,          setStep]          = useState(1)
  const [completed,     setCompleted]     = useState<Set<number>>(new Set())
  const [sendOpen,      setSendOpen]      = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  /* Separate draft per flow */
  const [mgmt, setMgmt]   = useState<MgmtDraft>(DEFAULT_MGMT)
  const [camp, setCamp]   = useState<CampaignDraft>(DEFAULT_CAMPAIGN)
  const [cust, setCust]   = useState<CustomDraft>(DEFAULT_CUSTOM)

  const updMgmt  = useCallback((p: Partial<MgmtDraft>)     => setMgmt(prev => ({ ...prev, ...p })), [])
  const updCamp  = useCallback((p: Partial<CampaignDraft>) => setCamp(prev => ({ ...prev, ...p })), [])
  const updCust  = useCallback((p: Partial<CustomDraft>)   => setCust(prev => ({ ...prev, ...p })), [])

  const scrollTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelect = (type: AgreementType, mode: BuildMode) => {
    setAgreementType(type); setBuildMode(mode)
    setCust(prev => ({ ...prev, agreementType: type }))
    setStep(1); setCompleted(new Set()); scrollTop()
  }

  const isCustom = buildMode === 'custom'
  const isMgmt   = agreementType === 'management'

  const steps =
    isMgmt && !isCustom  ? MGMT_STEPS_STD  :
    isMgmt && isCustom   ? MGMT_STEPS_CUST :
    !isMgmt && !isCustom ? CAMP_STEPS_STD  :
                           CAMP_STEPS_CUST

  const canGo =
    isMgmt && !isCustom  ? canAdvanceMgmt(step, mgmt)   :
    !isMgmt && !isCustom ? canAdvanceCamp(step, camp)   :
                           canAdvanceCustom(step, cust)

  const lastStep = steps?.length ?? 1
  const isReview = step === lastStep

  const next  = () => { if (!canGo) return; setCompleted(prev => new Set([...prev, step])); setStep(s => s + 1); scrollTop() }
  const back  = () => { if (step <= 1) { setAgreementType(null); setBuildMode(null) } else { setStep(s => s - 1) }; scrollTop() }
  const jump  = (n: number) => { setStep(n); scrollTop() }

  const contractName = isMgmt && !isCustom
    ? (mgmt.campaignName || `Management — ${mgmt.brandName}`)
    : !isMgmt && !isCustom
    ? camp.campaignName
    : cust.campaignName
  const signerName = isMgmt && !isCustom ? mgmt.signerName : !isMgmt && !isCustom ? camp.signerName : cust.signerName

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ SEND MODALS ════ */}
      {isMgmt && (
        <SendToBrandModal open={sendOpen} contractName={contractName} signerName={signerName} onClose={() => setSendOpen(false)}/>
      )}
      {!isMgmt && (
        <SendTripartiteModal open={sendOpen} contractName={contractName} signerName={signerName} onClose={() => setSendOpen(false)}/>
      )}

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {[
                { label: 'Dashboard',    active: false, action: () => router.push('/dashboard/agency') },
                { label: 'Campaigns',    active: false, action: () => {} },
                { label: 'New Contract', active: true,  action: () => {} },
              ].map(n => (
                <button key={n.label} type="button" onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            <div className="relative z-10 flex items-center gap-0.5">
              {[
                { label: 'Save draft', action: () => {} },
                { label: 'My Profile', action: () => {} },
              ].map(n => (
                <button key={n.label} type="button" onClick={n.action}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5">
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
      <main ref={mainRef} className="mx-auto max-w-[1080px] px-6 py-8">

        {/* Agreement type + mode selector — shown until user picks */}
        {(!agreementType || !buildMode) && (
          <AgreementTypeSelector onSelect={handleSelect}/>
        )}

        {/* Wizard — shown once type and mode are chosen */}
        {agreementType && buildMode && steps && (
          <div className="flex gap-10">

            {/* Left sidebar */}
            <div className="hidden w-[190px] flex-shrink-0 lg:block">
              <div className="sticky top-[84px]">
                <button type="button"
                  onClick={() => { setAgreementType(null); setBuildMode(null); setStep(1); setCompleted(new Set()) }}
                  className="mb-5 flex items-center gap-1.5 text-[12px] font-semibold text-ink/40 transition hover:text-ink/70">
                  <ChevLeft s={12}/>Change contract type
                </button>
                <Sidebar steps={steps} current={step} completed={completed} onJump={jump}/>
              </div>
            </div>

            {/* Step content */}
            <div className="min-w-0 flex-1">

              {/* ── MANAGEMENT STANDARD ── */}
              {isMgmt && !isCustom && (
                <>
                  {step === 1 && <MgmtStep1 d={mgmt} u={updMgmt}/>}
                  {step === 2 && <MgmtStep2 d={mgmt} u={updMgmt}/>}
                  {step === 3 && <MgmtStep3 d={mgmt} u={updMgmt}/>}
                  {step === 4 && <MgmtStep4 d={mgmt} u={updMgmt}/>}
                  {step === 5 && <MgmtStep5 d={mgmt} u={updMgmt} onJump={jump}/>}
                </>
              )}

              {/* ── MANAGEMENT CUSTOM ── */}
              {isMgmt && isCustom && (
                <>
                  {step === 1 && <MgmtStep1 d={{ ...DEFAULT_MGMT, managementScope: cust.managementScope }} u={p => updCust(p as Partial<CustomDraft>)}/>}
                  {step === 2 && <CustomPartiesStep d={cust} u={updCust}/>}
                  {step === 3 && <CustomBodyStep sections={cust.sections} onChange={s => updCust({ sections: s })}/>}
                  {step === 4 && <CustomReviewStep d={cust} u={updCust} onJump={jump}/>}
                </>
              )}

              {/* ── CAMPAIGN STANDARD ── */}
              {!isMgmt && !isCustom && (
                <>
                  {step === 1 && <DealTypeStep dealType={camp.dealType} customDealDescription={camp.customDealDescription} onUpdate={(t, d) => updCamp({ dealType: t, customDealDescription: d })}/>}
                  {step === 2 && <CampStep2 d={camp} u={updCamp}/>}
                  {step === 3 && <CampStep3 d={camp} u={updCamp}/>}
                  {step === 4 && <CampStep4 d={camp} u={updCamp}/>}
                  {step === 5 && <CampStep5 d={camp} u={updCamp} onJump={jump}/>}
                </>
              )}

              {/* ── CAMPAIGN CUSTOM ── */}
              {!isMgmt && isCustom && (
                <>
                  {step === 1 && <DealTypeStep dealType={cust.dealType} customDealDescription={cust.customDealDescription} onUpdate={(t, d) => updCust({ dealType: t, customDealDescription: d })}/>}
                  {step === 2 && <CustomPartiesStep d={cust} u={updCust}/>}
                  {step === 3 && <CustomBodyStep sections={cust.sections} onChange={s => updCust({ sections: s })}/>}
                  {step === 4 && <CustomReviewStep d={cust} u={updCust} onJump={jump}/>}
                </>
              )}

              {/* ── Navigation buttons ── */}
              <div className="mt-10 flex items-center justify-between gap-4 border-t border-primary/10 pt-7">
                <button type="button" onClick={back}
                  className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-3 text-[13.5px] font-bold text-ink/55 transition hover:border-primary/30 hover:text-ink">
                  <ChevLeft s={14}/>{step > 1 ? 'Back' : 'Cancel'}
                </button>
                {!isReview ? (
                  <button type="button" onClick={next} disabled={!canGo}
                    className={`flex items-center gap-2 rounded-xl px-7 py-3 text-[13.5px] font-bold text-white transition ${canGo ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                    Continue<ChevRight s={14}/>
                  </button>
                ) : (
                  <button type="button" onClick={() => setSendOpen(true)} disabled={!canGo}
                    className={`flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-[14.5px] font-bold text-white transition ${canGo ? `${GRAD_BTN} shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                    <SendIcon s={16}/>
                    {isMgmt ? 'Send to brand' : 'Send contract'}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  )
}