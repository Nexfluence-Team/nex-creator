'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Contract Maker — app/brand/contract/new/page.tsx  (Nexfluence v4)
   Mode A: Standard guided form (5 steps)
   Mode B: Custom section/clause builder
   Both end with a signed review + send-to-creator flow.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ─── Common form styles (matches rest of platform) ─────────────── */
const INP = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
const LBL = 'mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.10em] text-ink/45'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type DealType = 'cash' | 'commission' | 'hybrid' | 'custom'
type Mode = 'standard' | 'custom'

/* Standard contract form data */
interface StandardDraft {
  /* Step 1 – Deal type */
  dealType: DealType
  customDealDescription: string
  /* Step 2 – Parties */
  brandName: string
  brandReg: string
  creatorName: string
  creatorHandle: string
  campaignName: string
  campaignObjective: string
  /* Step 3 – Deliverables */
  pieces: string
  formats: string
  platforms: string
  postingWindow: string
  startDate: string
  endDate: string
  usageRights: string
  exclusivityPeriod: string
  /* Step 4 – Payment */
  currency: string
  flatAmount: string
  commissionRate: string
  commissionTracking: string
  paymentSchedule: string
  invoiceRequired: boolean
  latePaymentClause: boolean
  /* Step 5 – Sign */
  signerName: string
  signerDesignation: string
  signerOrg: string
}

/* Custom contract section/clause structure */
interface Clause {
  id: string
  text: string
}
interface Section {
  id: string
  heading: string
  clauses: Clause[]
}

interface CustomDraft {
  dealType: DealType
  customDealDescription: string
  brandName: string
  brandReg: string
  creatorName: string
  creatorHandle: string
  campaignName: string
  sections: Section[]
  signerName: string
  signerDesignation: string
  signerOrg: string
}

const DEFAULT_STANDARD: StandardDraft = {
  dealType: 'hybrid', customDealDescription: '',
  brandName: '', brandReg: '', creatorName: '', creatorHandle: '', campaignName: '', campaignObjective: '',
  pieces: '3', formats: '', platforms: '', postingWindow: '', startDate: '', endDate: '',
  usageRights: '12 months, non-exclusive', exclusivityPeriod: '',
  currency: 'EUR', flatAmount: '', commissionRate: '', commissionTracking: '', paymentSchedule: '',
  invoiceRequired: true, latePaymentClause: true,
  signerName: '', signerDesignation: '', signerOrg: '',
}

const DEFAULT_CUSTOM: CustomDraft = {
  dealType: 'hybrid', customDealDescription: '',
  brandName: '', brandReg: '', creatorName: '', creatorHandle: '', campaignName: '',
  sections: [],
  signerName: '', signerDesignation: '', signerOrg: '',
}

/* Steps for each mode */
const STD_STEPS  = ['Deal type', 'Parties', 'Deliverables', 'Payment', 'Review & Sign']
const CUST_STEPS = ['Deal type', 'Parties', 'Contract body', 'Review & Sign']

/* Mock creator list for the "Send" flow */
const CAMPAIGN_CREATORS = [
  { id: 'cr1', name: 'Amelia Roze',    handle: '@amelia.roze',    color: '#8B31E8', initials: 'AR' },
  { id: 'cr2', name: 'Markus Tamm',    handle: '@markustamm',     color: '#2563EB', initials: 'MT' },
  { id: 'cr3', name: 'Rūta Vaitkutė', handle: '@ruta.glow',      color: '#C026D3', initials: 'RV' },
  { id: 'cr4', name: 'Jonas Petrauskas', handle: '@jonas.fit',    color: '#D97706', initials: 'JP' },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function Check({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevLeft({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevRight({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function PlusIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function TrashIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SendIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function FileIcon({ s = 28 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><line x1="10" y1="9" x2="8" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
}
function EditFileIcon({ s = 28 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function PenIcon({ s = 22 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function DragIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="5" r="1.2" fill="currentColor"/><circle cx="15" cy="5" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="19" r="1.2" fill="currentColor"/><circle cx="15" cy="19" r="1.2" fill="currentColor"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ════════════════════════════════════════════════════════════════════ */
function FieldLabel({ children }: { children: ReactNode }) {
  return <label className={LBL}>{children}</label>
}
function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={className}><FieldLabel>{label}</FieldLabel>{children}</div>
}
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] font-semibold text-ink/70 transition hover:bg-primary/[0.04]">
      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${checked ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white text-transparent'}`}>
        <Check s={10}/>
      </span>
      {label}
    </button>
  )
}
function PersonAvatar({ initials, color, size = 36 }: { initials: string; color: string; size?: number }) {
  return <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{initials}</div>
}

/* ════════════════════════════════════════════════════════════════════
   LEFT SIDEBAR — matches campaign builder exactly
   ════════════════════════════════════════════════════════════════════ */
function Sidebar({ steps, current, completed, onJump }: {
  steps: string[]; current: number; completed: Set<number>; onJump: (n: number) => void
}) {
  return (
    <nav className="flex w-[190px] flex-shrink-0 flex-col gap-0.5">
      <p className="mb-3 px-4 text-[10.5px] font-black uppercase tracking-[0.22em] text-ink/30">Contract setup</p>
      {steps.map((label, idx) => {
        const n = idx + 1
        const done   = completed.has(n)
        const active = n === current
        const canGo  = done || n === current
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
   DEAL TYPE STEP (shared between modes)
   ════════════════════════════════════════════════════════════════════ */
const DEAL_TYPES: { id: DealType; title: string; sub: string; description: string; color: string; bg: string }[] = [
  { id: 'cash',       title: 'All cash',         sub: 'Fixed flat fee',             description: 'Brand pays a fixed fee per deliverable. No performance dependency — creator is compensated regardless of results.',           color: '#8B31E8', bg: '#f5f0fe' },
  { id: 'commission', title: 'All commission',    sub: '% of every tracked sale',    description: 'Creator earns a percentage of each sale they drive. No upfront cost to the brand — full performance alignment.',             color: '#059669', bg: '#edfdf5' },
  { id: 'hybrid',     title: 'Hybrid',            sub: 'Base fee + commission',      description: 'A flat base guarantees creator commitment; the commission layer rewards performance. Most balanced for both sides.',          color: '#2563EB', bg: '#eff4fe' },
  { id: 'custom',     title: 'Custom deal',       sub: 'Define your own terms',      description: 'None of the above fit? Describe the deal in your own words. You can use this alongside or instead of the fields below.',    color: '#D97706', bg: '#fffbeb' },
]

function DealTypeStep({ dealType, customDealDescription, onUpdate }: {
  dealType: DealType
  customDealDescription: string
  onUpdate: (t: DealType, desc: string) => void
}) {
  return (
    <div>
      <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">What kind of deal is this?</h2>
      <p className="mt-1 text-[13.5px] leading-[1.6] text-ink/50">This shapes the payment clauses in your contract. You can fine-tune the exact amounts in the next steps.</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DEAL_TYPES.map(dt => {
          const sel = dealType === dt.id
          return (
            <button key={dt.id} type="button" onClick={() => onUpdate(dt.id, customDealDescription)}
              className={`relative flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${sel ? 'border-primary/30 bg-primary/[0.03] shadow-[0_0_0_1px_rgba(139,49,232,0.15),0_6px_20px_-6px_rgba(139,49,232,0.26)]' : `border-primary/10 bg-white hover:border-primary/20 ${CARD}`}`}>
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: dt.bg, color: dt.color }}>
                {dt.id === 'cash'       && <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M6 12h.01M18 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
                {dt.id === 'commission' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>}
                {dt.id === 'hybrid'    && <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="15" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="9" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/></svg>}
                {dt.id === 'custom'    && <PenIcon s={20}/>}
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
          <FieldLabel>Describe your custom deal structure *</FieldLabel>
          <textarea className={`${INP} min-h-[88px] resize-y leading-relaxed`}
            value={customDealDescription}
            onChange={e => onUpdate('custom', e.target.value)}
            placeholder="e.g. Brand provides product samples (value €150+) plus 10% commission on all tracked sales during a 60-day window. No flat fee applies."/>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STANDARD CONTRACT — STEP 2: PARTIES
   ════════════════════════════════════════════════════════════════════ */
function StdStep2({ d, u }: { d: StandardDraft; u: (p: Partial<StandardDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Parties & campaign</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Who is this contract between, and which campaign does it cover?</p>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Brand</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Brand / company name *"><input className={INP} value={d.brandName} onChange={e => u({ brandName: e.target.value })} placeholder="Kinetics SIA"/></Field>
          <Field label="Registration number (optional)"><input className={INP} value={d.brandReg} onChange={e => u({ brandReg: e.target.value })} placeholder="e.g. 40203456789"/></Field>
        </div>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Creator</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Creator full name *"><input className={INP} value={d.creatorName} onChange={e => u({ creatorName: e.target.value })} placeholder="Amelia Roze"/></Field>
          <Field label="Primary handle *"><input className={INP} value={d.creatorHandle} onChange={e => u({ creatorHandle: e.target.value })} placeholder="@amelia.roze"/></Field>
        </div>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Campaign</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Campaign name *"><input className={INP} value={d.campaignName} onChange={e => u({ campaignName: e.target.value })} placeholder="Vitamin-C Recovery Stack — Summer 2026"/></Field>
          <Field label="Campaign objective"><input className={INP} value={d.campaignObjective} onChange={e => u({ campaignObjective: e.target.value })} placeholder="e.g. Conversions — product sales"/></Field>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STANDARD CONTRACT — STEP 3: DELIVERABLES
   ════════════════════════════════════════════════════════════════════ */
function StdStep3({ d, u }: { d: StandardDraft; u: (p: Partial<StandardDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Deliverables & timeline</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">What content is the creator committing to, and when?</p>
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

/* ════════════════════════════════════════════════════════════════════
   STANDARD CONTRACT — STEP 4: PAYMENT
   ════════════════════════════════════════════════════════════════════ */
function StdStep4({ d, u }: { d: StandardDraft; u: (p: Partial<StandardDraft>) => void }) {
  const showFlat = d.dealType === 'cash' || d.dealType === 'hybrid'
  const showComm = d.dealType === 'commission' || d.dealType === 'hybrid'
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Payment terms</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Set exact amounts, schedule, and tracking. These become binding clauses in the contract.</p>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Compensation</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Currency">
            <select className={INP} value={d.currency} onChange={e => u({ currency: e.target.value })}>
              {['EUR','USD','GBP','SEK','PLN'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          {showFlat && <Field label={d.dealType === 'hybrid' ? 'Flat base fee (total) *' : 'Flat fee *'}><div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">{d.currency}</span><input type="number" min={0} className={`${INP} pl-12`} value={d.flatAmount} onChange={e => u({ flatAmount: e.target.value })} placeholder="350"/></div></Field>}
          {showComm && <Field label="Commission rate *"><div className="relative"><input type="number" min={1} max={50} className={`${INP} pr-8`} value={d.commissionRate} onChange={e => u({ commissionRate: e.target.value })} placeholder="15"/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">%</span></div></Field>}
          {showComm && <Field label="Tracking method"><input className={INP} value={d.commissionTracking} onChange={e => u({ commissionTracking: e.target.value })} placeholder="e.g. Nexfluence affiliate link + UTM code"/></Field>}
          {d.dealType === 'custom' && <Field label="Compensation description *"><textarea className={`${INP} col-span-2 min-h-[72px] resize-y`} value={d.flatAmount} onChange={e => u({ flatAmount: e.target.value })} placeholder="Describe what the creator receives and when"/></Field>}
        </div>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Schedule</p>
        <Field label="Payment schedule"><textarea className={`${INP} min-h-[72px] resize-y`} value={d.paymentSchedule} onChange={e => u({ paymentSchedule: e.target.value })} placeholder="e.g. 50% on brief approval, 50% within 14 days of all content going live"/></Field>
        <div className="mt-4 space-y-1">
          <CheckRow label="Creator must submit an invoice before payment" checked={d.invoiceRequired} onChange={v => u({ invoiceRequired: v })}/>
          <CheckRow label="Include late payment clause (1.5% per month after 30 days)" checked={d.latePaymentClause} onChange={v => u({ latePaymentClause: v })}/>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SIGN BLOCK — shared across both modes
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
          <p className="text-[13.5px] font-extrabold text-ink">Sign this contract</p>
          <p className="text-[11.5px] text-ink/45">Provide your full name and role. This acts as your digital signature.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Full name *">
          <input className={INP} value={signerName} onChange={e => onChange({ signerName: e.target.value })} placeholder="Harshul Gupta"/>
        </Field>
        <Field label="Designation *">
          <input className={INP} value={signerDesignation} onChange={e => onChange({ signerDesignation: e.target.value })} placeholder="Founder"/>
        </Field>
        <Field label="Organisation *">
          <input className={INP} value={signerOrg} onChange={e => onChange({ signerOrg: e.target.value })} placeholder="Kinetics SIA"/>
        </Field>
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

/* ════════════════════════════════════════════════════════════════════
   STANDARD CONTRACT — STEP 5: REVIEW + SIGN
   ════════════════════════════════════════════════════════════════════ */
function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-primary/8 py-3 last:border-0">
      <span className="flex-shrink-0 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink/38">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{value ?? <span className="italic text-ink/28">Not set</span>}</span>
    </div>
  )
}

function StdStep5({ d, u, onJump }: { d: StandardDraft; u: (p: Partial<StandardDraft>) => void; onJump: (n: number) => void }) {
  const dealLabel = DEAL_TYPES.find(t => t.id === d.dealType)?.title ?? d.dealType
  const budgetSummary = d.dealType === 'cash'       ? `${d.currency} ${d.flatAmount}`
                       : d.dealType === 'commission' ? `${d.commissionRate}% commission`
                       : d.dealType === 'hybrid'     ? `${d.currency} ${d.flatAmount} + ${d.commissionRate}% commission`
                       : d.customDealDescription || 'Custom'

  const Section = ({ title, step, children }: { title: string; step: number; children: ReactNode }) => (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink/40">{title}</p>
        <button type="button" onClick={() => onJump(step)} className="text-[12.5px] font-bold text-primary hover:underline">Edit</button>
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Review & sign</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Check every clause before signing. Once sent, the creator receives a copy.</p>
      </div>
      {/* Rendered contract preview */}
      <div className={`rounded-2xl border-2 border-ink/10 bg-white p-6 font-rubik ${CARD}`}>
        <div className="mb-5 border-b border-ink/10 pb-5 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/35">Creator Partnership Agreement</p>
          <h3 className="mt-1 text-[17px] font-extrabold text-ink">{d.campaignName || 'Campaign name'}</h3>
          <p className="mt-1 text-[12px] text-ink/45">Prepared by Nexfluence · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="space-y-0">
          <ReviewRow label="Deal type"       value={dealLabel}/>
          <ReviewRow label="Brand"           value={d.brandName}/>
          <ReviewRow label="Creator"         value={`${d.creatorName} ${d.creatorHandle}`}/>
          <ReviewRow label="Campaign"        value={d.campaignName}/>
          <ReviewRow label="Deliverables"    value={d.pieces ? `${d.pieces} piece${Number(d.pieces) !== 1 ? 's' : ''} — ${d.formats || d.platforms}` : null}/>
          <ReviewRow label="Dates"           value={d.startDate && d.endDate ? `${d.startDate} → ${d.endDate}` : d.startDate || null}/>
          <ReviewRow label="Usage rights"    value={d.usageRights}/>
          {d.exclusivityPeriod && <ReviewRow label="Exclusivity" value={d.exclusivityPeriod}/>}
          <ReviewRow label="Compensation"    value={budgetSummary}/>
          {d.commissionTracking && <ReviewRow label="Tracking" value={d.commissionTracking}/>}
          <ReviewRow label="Payment schedule" value={d.paymentSchedule}/>
          {d.invoiceRequired && <ReviewRow label="Invoice" value="Required before payment"/>}
          {d.latePaymentClause && <ReviewRow label="Late payment" value="1.5% per month after 30 days"/>}
        </div>
      </div>
      <SignBlock signerName={d.signerName} signerDesignation={d.signerDesignation} signerOrg={d.signerOrg}
        onChange={f => u({ ...f })}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CUSTOM CONTRACT — STEP 2: PARTIES (reuses StdStep2 structure)
   ════════════════════════════════════════════════════════════════════ */
function CustStep2({ d, u }: { d: CustomDraft; u: (p: Partial<CustomDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Parties & campaign</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">These details appear at the top of your contract.</p>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Brand</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Brand / company name *"><input className={INP} value={d.brandName} onChange={e => u({ brandName: e.target.value })} placeholder="Kinetics SIA"/></Field>
          <Field label="Registration number"><input className={INP} value={d.brandReg} onChange={e => u({ brandReg: e.target.value })} placeholder="Optional"/></Field>
        </div>
      </div>
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary/60">Creator</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Creator full name *"><input className={INP} value={d.creatorName} onChange={e => u({ creatorName: e.target.value })} placeholder="Amelia Roze"/></Field>
          <Field label="Primary handle *"><input className={INP} value={d.creatorHandle} onChange={e => u({ creatorHandle: e.target.value })} placeholder="@amelia.roze"/></Field>
          <Field label="Campaign name" className="sm:col-span-2"><input className={INP} value={d.campaignName} onChange={e => u({ campaignName: e.target.value })} placeholder="Vitamin-C Recovery Stack — Summer 2026"/></Field>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CUSTOM CONTRACT — STEP 3: CONTRACT BODY
   Section heading modal + numbered clause boxes
   ════════════════════════════════════════════════════════════════════ */
function SectionHeadingModal({ onConfirm, onClose }: { onConfirm: (heading: string) => void; onClose: () => void }) {
  const [heading, setHeading] = useState('')
  const inp = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inp.current?.focus()
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[400px] overflow-hidden rounded-2xl bg-white p-6 ${CARD}`}>
        <h3 className="mb-1 text-[16px] font-extrabold text-ink">New section</h3>
        <p className="mb-4 text-[13px] text-ink/50">Give this section a heading. You'll add numbered clauses inside it next.</p>
        <Field label="Section heading *">
          <input ref={inp} className={INP} value={heading} onChange={e => setHeading(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && heading.trim()) { onConfirm(heading.trim()); onClose() } }}
            placeholder="e.g. Deliverables, Payment Terms, Confidentiality"/>
        </Field>
        <div className="mt-4 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">Cancel</button>
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

function CustStep3({ sections, onChange }: { sections: Section[]; onChange: (s: Section[]) => void }) {
  const [showModal, setShowModal] = useState(false)

  const addSection = (heading: string) => {
    const newSection: Section = { id: `s-${Date.now()}`, heading, clauses: [{ id: `c-${Date.now()}`, text: '' }] }
    onChange([...sections, newSection])
  }

  const removeSection = (sid: string) => onChange(sections.filter(s => s.id !== sid))

  const addClause = (sid: string) => {
    onChange(sections.map(s => s.id !== sid ? s : { ...s, clauses: [...s.clauses, { id: `c-${Date.now()}`, text: '' }] }))
  }

  const updateClause = (sid: string, cid: string, text: string) => {
    onChange(sections.map(s => s.id !== sid ? s : { ...s, clauses: s.clauses.map(c => c.id !== cid ? c : { ...c, text }) }))
  }

  const removeClause = (sid: string, cid: string) => {
    onChange(sections.map(s => s.id !== sid ? s : { ...s, clauses: s.clauses.filter(c => c.id !== cid) }))
  }

  return (
    <div className="space-y-5">
      {showModal && <SectionHeadingModal onConfirm={addSection} onClose={() => setShowModal(false)}/>}

      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Build your contract</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Add sections, then write numbered clauses inside each. Clauses are numbered automatically.</p>
      </div>

      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-surface-sub/50 py-14 text-center">
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] text-white`}>
            <FileIcon s={22}/>
          </div>
          <p className="text-[14px] font-extrabold text-ink">No sections yet</p>
          <p className="mt-1.5 max-w-[280px] text-[12.5px] text-ink/45">Click "New section" to start building. Common sections: Parties, Scope of Work, Payment, Content Rights, Confidentiality.</p>
        </div>
      )}

      {sections.map((section, si) => (
        <div key={section.id} className={`rounded-2xl border border-primary/12 bg-white p-5 ${CARD}`}>
          {/* Section header */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg ${GRAD_BTN} text-[11px] font-black text-white`}>{si + 1}</span>
              <h3 className="text-[14.5px] font-extrabold text-ink">{section.heading}</h3>
            </div>
            <button type="button" onClick={() => removeSection(section.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/35 transition hover:bg-rose-50 hover:text-rose-500">
              <TrashIcon s={13}/>
            </button>
          </div>

          {/* Clauses */}
          <div className="space-y-2.5">
            {section.clauses.map((clause, ci) => (
              <div key={clause.id} className="flex items-start gap-2.5">
                {/* Clause number */}
                <span className="mt-3.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-surface-sub text-[10.5px] font-extrabold text-ink/40">{ci + 1}</span>
                {/* Clause textarea */}
                <textarea
                  className={`${INP} flex-1 min-h-[64px] resize-y leading-relaxed text-[13.5px]`}
                  value={clause.text}
                  onChange={e => updateClause(section.id, clause.id, e.target.value)}
                  placeholder={`Clause ${ci + 1} — type the clause text here…`}/>
                {/* Remove clause (only if more than 1) */}
                {section.clauses.length > 1 && (
                  <button type="button" onClick={() => removeClause(section.id, clause.id)}
                    className="mt-3 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink/28 transition hover:bg-rose-50 hover:text-rose-400">
                    <XIcon s={12}/>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add clause */}
          <button type="button" onClick={() => addClause(section.id)}
            className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-bold text-primary/70 transition hover:bg-primary/[0.06] hover:text-primary">
            <PlusIcon s={12}/>Add clause
          </button>
        </div>
      ))}

      {/* New section button */}
      <button type="button" onClick={() => setShowModal(true)}
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/25 py-4 text-[13.5px] font-bold text-primary transition hover:border-primary/45 hover:bg-primary/[0.03]`}>
        <PlusIcon s={14}/>New section
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CUSTOM CONTRACT — STEP 4: REVIEW + SIGN
   ════════════════════════════════════════════════════════════════════ */
function CustStep4({ d, u, onJump }: { d: CustomDraft; u: (p: Partial<CustomDraft>) => void; onJump: (n: number) => void }) {
  const dealLabel = DEAL_TYPES.find(t => t.id === d.dealType)?.title ?? d.dealType
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Review & sign</h2>
        <p className="mt-1 text-[13.5px] text-ink/50">Your contract as it will appear to the creator. Sign below to confirm.</p>
      </div>
      {/* Rendered contract */}
      <div className={`rounded-2xl border-2 border-ink/10 bg-white ${CARD}`}>
        {/* Contract header */}
        <div className="border-b border-ink/10 px-7 py-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/35">Creator Partnership Agreement</p>
          <h3 className="mt-1 text-[17px] font-extrabold text-ink">{d.campaignName || 'Untitled contract'}</h3>
          <p className="mt-1 text-[12px] text-ink/45">Between <strong className="text-ink">{d.brandName || 'Brand'}</strong> and <strong className="text-ink">{d.creatorName || 'Creator'}</strong> · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-surface-sub px-3 py-1 text-[11.5px] font-semibold text-ink/55">
            Deal type: <span className="font-extrabold text-ink">{dealLabel}</span>
          </div>
        </div>
        {/* Sections */}
        <div className="divide-y divide-ink/8 px-7 py-2">
          {d.sections.length === 0 && (
            <p className="py-6 text-center text-[13px] italic text-ink/35">No sections added yet.</p>
          )}
          {d.sections.map((section, si) => (
            <div key={section.id} className="py-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[12px] font-black uppercase tracking-[0.1em] text-ink/40">{si + 1}.</span>
                <h4 className="text-[14px] font-extrabold uppercase tracking-[0.08em] text-ink">{section.heading}</h4>
              </div>
              <ol className="space-y-2 pl-2">
                {section.clauses.map((clause, ci) => (
                  <li key={clause.id} className="flex gap-3 text-[13.5px] leading-[1.7] text-ink/70">
                    <span className="mt-0.5 flex-shrink-0 text-[11px] font-bold text-ink/35">{si + 1}.{ci + 1}</span>
                    <span>{clause.text || <em className="text-ink/28">Empty clause</em>}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        {/* Edit link */}
        <div className="border-t border-ink/8 px-7 py-4 text-right">
          <button type="button" onClick={() => onJump(3)} className="text-[12.5px] font-bold text-primary hover:underline">Edit contract body</button>
        </div>
      </div>
      <SignBlock signerName={d.signerName} signerDesignation={d.signerDesignation} signerOrg={d.signerOrg}
        onChange={f => u({ ...f })}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SEND CONTRACT MODAL
   Shows after signing — lets brand pick which creator to send to,
   option to customise key fields for that specific creator.
   ════════════════════════════════════════════════════════════════════ */
function SendModal({ open, contractName, signerName, onClose, onSend }: {
  open: boolean; contractName: string; signerName: string; onClose: () => void; onSend: (creatorId: string) => void
}) {
  const [selectedCreator, setSelectedCreator] = useState<string>(CAMPAIGN_CREATORS[0]?.id ?? '')
  const [customise, setCustomise] = useState(false)
  const [customRate, setCustomRate] = useState('')
  const [customNote, setCustomNote] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!open) { setSent(false); setCustomise(false); setCustomRate(''); setCustomNote('') }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const handleSend = async () => {
    /* Mock 800ms send */
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    onSend(selectedCreator)
  }

  const creator = CAMPAIGN_CREATORS.find(c => c.id === selectedCreator)

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl bg-white ${CARD}`}>

        {sent ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center px-7 py-10 text-center">
            <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]`}>
              <Check s={28}/>
            </div>
            <h3 className="text-[20px] font-extrabold text-ink">Contract sent!</h3>
            <p className="mt-2 max-w-[320px] text-[13.5px] leading-[1.7] text-ink/55">
              <span className="font-bold text-ink">{creator?.name}</span> has received the contract in their messages and a notification. They can sign, counter-propose, or message you back.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-primary/15 bg-white px-6 py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">
                Done
              </button>
              <button type="button" onClick={onClose}
                className={`rounded-xl ${GRAD_BTN} px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_6px_20px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
                Go to Messages
              </button>
            </div>
          </div>
        ) : (
          /* ── Send flow ── */
          <>
            <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
              <div>
                <h3 className="text-[16px] font-extrabold text-ink">Send contract</h3>
                <p className="mt-0.5 text-[12px] text-ink/45">"{contractName || 'Contract'}" · signed by {signerName || 'you'}</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/45 transition hover:bg-ink/10"><XIcon s={13}/></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Creator selector */}
              <div>
                <FieldLabel>Send to which creator?</FieldLabel>
                <div className="mt-1.5 space-y-2">
                  {CAMPAIGN_CREATORS.map(cr => (
                    <button key={cr.id} type="button" onClick={() => setSelectedCreator(cr.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${selectedCreator === cr.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                      <PersonAvatar initials={cr.initials} color={cr.color} size={34}/>
                      <div className="flex-1">
                        <p className="text-[13.5px] font-bold text-ink">{cr.name}</p>
                        <p className="text-[11.5px] text-ink/45">{cr.handle}</p>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${selectedCreator === cr.id ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                        {selectedCreator === cr.id && <Check s={10}/>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customise for this creator */}
              <div>
                <CheckRow label={`Customise contract for ${creator?.name ?? 'this creator'} only`} checked={customise} onChange={setCustomise}/>
                {customise && (
                  <div className={`mt-3 space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4`}>
                    <p className="text-[11.5px] font-bold text-amber-700">Overrides apply to this creator only — the base contract stays unchanged for others.</p>
                    <Field label="Custom rate / compensation">
                      <input className={INP} value={customRate} onChange={e => setCustomRate(e.target.value)} placeholder="e.g. €500 flat + 12% commission"/>
                    </Field>
                    <Field label="Additional note to creator">
                      <textarea className={`${INP} min-h-[60px] resize-y text-[13px]`} value={customNote} onChange={e => setCustomNote(e.target.value)} placeholder="Any specific terms, context, or personal message…"/>
                    </Field>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-primary/10 px-6 py-4">
              <button type="button" onClick={handleSend}
                className={`flex w-full items-center justify-center gap-2.5 rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.48)] transition hover:-translate-y-0.5`}>
                <SendIcon s={15}/>Send contract to {creator?.name}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MODE SELECTOR (landing before choosing Standard vs Custom)
   ════════════════════════════════════════════════════════════════════ */
function ModeSelector({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-[620px]">
        <div className="mb-8 text-center">
          <h1 className="text-[26px] font-black tracking-[-0.03em] text-ink">Create a contract</h1>
          <p className="mt-2 text-[14px] text-ink/50">Choose how you'd like to build it. Both options end with the same review and send flow.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              mode: 'standard' as Mode,
              icon: <FileIcon s={30}/>,
              title: 'Standard contract',
              sub: 'Guided form',
              desc: 'Answer questions step by step — parties, deliverables, payment terms. Nexfluence builds the clauses for you based on your answers.',
              cta: 'Use standard form',
            },
            {
              mode: 'custom' as Mode,
              icon: <EditFileIcon s={30}/>,
              title: 'Custom contract',
              sub: 'Write your own',
              desc: 'Build a contract from scratch — add sections (e.g. Confidentiality, IP Rights), write numbered clauses inside each, in your own words.',
              cta: 'Build custom contract',
            },
          ].map(opt => (
            <button key={opt.mode} type="button" onClick={() => onSelect(opt.mode)}
              className={`group flex flex-col gap-5 rounded-2xl border-2 border-primary/12 bg-white p-7 text-left transition-all hover:border-primary/30 hover:shadow-[0_8px_28px_-8px_rgba(139,49,232,0.24)] ${CARD}`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)]`}>
                {opt.icon}
              </div>
              <div>
                <p className="text-[17px] font-extrabold text-ink">{opt.title}</p>
                <p className={`mt-0.5 text-[11.5px] font-bold uppercase tracking-[0.08em] ${GRAD_TXT}`}>{opt.sub}</p>
                <p className="mt-2.5 text-[13px] leading-[1.7] text-ink/55">{opt.desc}</p>
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

/* ════════════════════════════════════════════════════════════════════
   VALIDATION
   ════════════════════════════════════════════════════════════════════ */
function canAdvanceStd(step: number, d: StandardDraft): boolean {
  if (step === 1) return d.dealType !== null && (d.dealType !== 'custom' || d.customDealDescription.trim().length > 0)
  if (step === 2) return d.brandName.trim().length > 0 && d.creatorName.trim().length > 0 && d.campaignName.trim().length > 0
  if (step === 3) return d.pieces.trim().length > 0 && d.platforms.trim().length > 0
  if (step === 4) {
    if (d.dealType === 'cash')       return d.flatAmount.trim().length > 0
    if (d.dealType === 'commission') return d.commissionRate.trim().length > 0
    if (d.dealType === 'hybrid')     return d.flatAmount.trim().length > 0 && d.commissionRate.trim().length > 0
    return true
  }
  return d.signerName.trim().length > 0 && d.signerDesignation.trim().length > 0 && d.signerOrg.trim().length > 0
}

function canAdvanceCust(step: number, d: CustomDraft): boolean {
  if (step === 1) return d.dealType !== null && (d.dealType !== 'custom' || d.customDealDescription.trim().length > 0)
  if (step === 2) return d.brandName.trim().length > 0 && d.creatorName.trim().length > 0
  if (step === 3) return d.sections.length > 0 && d.sections.every(s => s.clauses.some(c => c.text.trim().length > 0))
  return d.signerName.trim().length > 0 && d.signerDesignation.trim().length > 0 && d.signerOrg.trim().length > 0
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function ContractNewPage() {
  const router = useRouter()
  const [mode,      setMode]      = useState<Mode | null>(null)
  const [step,      setStep]      = useState(1)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [sendOpen,  setSendOpen]  = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  /* Standard draft */
  const [std, setStd] = useState<StandardDraft>(DEFAULT_STANDARD)
  const updStd = useCallback((p: Partial<StandardDraft>) => setStd(prev => ({ ...prev, ...p })), [])

  /* Custom draft */
  const [cust, setCust] = useState<CustomDraft>(DEFAULT_CUSTOM)
  const updCust = useCallback((p: Partial<CustomDraft>) => setCust(prev => ({ ...prev, ...p })), [])

  const scrollTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const steps    = mode === 'standard' ? STD_STEPS : CUST_STEPS
  const canGo    = mode === 'standard' ? canAdvanceStd(step, std) : canAdvanceCust(step, cust)
  const lastStep = steps.length
  const isReview = step === lastStep

  const next = () => {
    if (!canGo) return
    setCompleted(prev => new Set([...prev, step]))
    setStep(s => s + 1)
    scrollTop()
  }
  const back  = () => { setStep(s => s - 1); scrollTop() }
  const jump  = (n: number) => { setStep(n); scrollTop() }

  const selectMode = (m: Mode) => { setMode(m); setStep(1); setCompleted(new Set()) }

  const contractName = mode === 'standard' ? std.campaignName : cust.campaignName
  const signerName   = mode === 'standard' ? std.signerName   : cust.signerName

  /* ── Nav items — exact dashboard pattern ── */
  const NAV_LEFT  = [
    { label: 'Dashboard',        active: false, action: () => router.push('/dashboard/brand') },
    { label: 'New Contract',     active: true,  action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'Save draft',       active: false, action: () => {} },
    { label: 'My Profile',       active: false, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ SEND MODAL ════ */}
      <SendModal
        open={sendOpen}
        contractName={contractName}
        signerName={signerName}
        onClose={() => setSendOpen(false)}
        onSend={creatorId => { console.log('Sending to', creatorId) }}
      />

      {/* ════ HEADER — exact dashboard pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} type="button" onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_RIGHT.map(n => (
                <button key={n.label} type="button" onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
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

        {/* Mode selector — shown until user picks */}
        {!mode && <ModeSelector onSelect={selectMode}/>}

        {/* Wizard — shown once mode is chosen */}
        {mode && (
          <div className="flex gap-10">
            {/* Left sidebar */}
            <div className="hidden w-[190px] flex-shrink-0 lg:block">
              <div className="sticky top-[84px]">
                {/* Back to mode selector */}
                <button type="button" onClick={() => { setMode(null); setStep(1); setCompleted(new Set()) }}
                  className="mb-5 flex items-center gap-1.5 text-[12px] font-semibold text-ink/40 transition hover:text-ink/70">
                  <ChevLeft s={12}/>Change contract type
                </button>
                <Sidebar steps={steps} current={step} completed={completed} onJump={jump}/>
              </div>
            </div>

            {/* Step content */}
            <div className="min-w-0 flex-1">

              {/* ── STANDARD STEPS ── */}
              {mode === 'standard' && (
                <>
                  {step === 1 && <DealTypeStep dealType={std.dealType} customDealDescription={std.customDealDescription} onUpdate={(t, d) => updStd({ dealType: t, customDealDescription: d })}/>}
                  {step === 2 && <StdStep2 d={std} u={updStd}/>}
                  {step === 3 && <StdStep3 d={std} u={updStd}/>}
                  {step === 4 && <StdStep4 d={std} u={updStd}/>}
                  {step === 5 && <StdStep5 d={std} u={updStd} onJump={jump}/>}
                </>
              )}

              {/* ── CUSTOM STEPS ── */}
              {mode === 'custom' && (
                <>
                  {step === 1 && <DealTypeStep dealType={cust.dealType} customDealDescription={cust.customDealDescription} onUpdate={(t, d) => updCust({ dealType: t, customDealDescription: d })}/>}
                  {step === 2 && <CustStep2 d={cust} u={updCust}/>}
                  {step === 3 && <CustStep3 sections={cust.sections} onChange={s => updCust({ sections: s })}/>}
                  {step === 4 && <CustStep4 d={cust} u={updCust} onJump={jump}/>}
                </>
              )}

              {/* ── Navigation buttons ── */}
              <div className="mt-10 flex items-center justify-between gap-4 border-t border-primary/10 pt-7">
                <button type="button" onClick={step > 1 ? back : () => setMode(null)}
                  className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-3 text-[13.5px] font-bold text-ink/55 transition hover:border-primary/30 hover:text-ink">
                  <ChevLeft s={14}/>{step > 1 ? 'Back' : 'Cancel'}
                </button>

                {!isReview ? (
                  <button type="button" onClick={next} disabled={!canGo}
                    className={`flex items-center gap-2 rounded-xl px-7 py-3 text-[13.5px] font-bold text-white transition ${canGo ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                    Continue<ChevRight s={14}/>
                  </button>
                ) : (
                  /* Review step CTA — Send contract */
                  <button type="button" onClick={() => setSendOpen(true)} disabled={!canGo}
                    className={`flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-[14.5px] font-bold text-white transition ${canGo ? `${GRAD_BTN} shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                    <SendIcon s={16}/>Send Contract
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