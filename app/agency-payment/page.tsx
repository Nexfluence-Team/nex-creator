'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Agency Payments — app/agency/payments/page.tsx  (Nexfluence v4 LIGHT)
   ════════════════════════════════════════════════════════════════════

   THE TWO MONEY FLOWS THAT MAKE AN AGENCY PAGE DIFFERENT:
   ─────────────────────────────────────────────────────────────────
   MONEY IN  (from brands):
     Retainers     — monthly recurring fees from managed clients
     Campaign fees — delivery fees for single-campaign engagements
     Mgmt fees     — % cut from campaigns run on brand's behalf (via Grade)

   MONEY OUT (operations):
     Creator disbursements — passing campaign budgets through to creators
     Withdrawals           — agency pulling its own earnings to bank

   This page shows BOTH flows. The income breakdown section lets the
   agency see retainer vs fee income clearly. The pending invoices panel
   shows which brands haven't paid yet and lets the agency send reminders
   or mark invoices as received.

   PAYMENT ASKING = InvoiceRequestModal
     Agency fills: brand, amount, type (retainer/fee), period, due date, note
     Sends a formal invoice → appears in brand's messages as RetainerInvoiceCard
     AND appears in pending invoices panel on this page

   WITHDRAWAL = 3-step modal (same as creator but with "Business account" label)
     Or navigate to /agency/payments/withdraw for a full page (link provided)

   KYC gate: agency must verify business identity before withdrawals.
   Toggle MOCK_KYC_VERIFIED to preview.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

const MOCK_KYC_VERIFIED = true

/* ─── Types ──────────────────────────────────────────────────────── */
type TxType   = 'retainer' | 'fee' | 'mgmt_fee' | 'disbursed' | 'invoice_sent' | 'withdrawal'
type TxStatus = 'completed' | 'processing' | 'pending' | 'in_escrow'
type FilterTab = 'all' | 'income' | 'disbursements' | 'withdrawals'
type InvoiceType = 'retainer' | 'campaign_fee' | 'mgmt_fee'

interface AgencyTransaction {
  id:           string
  type:         TxType
  status:       TxStatus
  amount:       number
  description:  string
  detail:       string
  date:         string
  expectedDate?: string
  brandId?:     string
  creatorName?: string
  bankAccount?: string
  ref:          string
}

interface PendingInvoice {
  id:        string
  brandId:   string
  brandName: string
  brandColor:string
  brandInitials: string
  amount:    number
  type:      InvoiceType
  period:    string
  dueDate:   string
  isOverdue: boolean
  ref:       string
}

interface AgencyBankAccount {
  id:          string
  bankName:    string
  ibanLast4:   string
  ibanFull:    string
  holderName:  string
  accountType: 'business' | 'personal'
  isDefault:   boolean
}

/* ─── Mock data ──────────────────────────────────────────────────── */
const MANAGED_BRANDS = [
  { id: 'mb1', name: 'Kinetics',        industry: 'Sports nutrition', color: '#8B31E8', initials: 'KI', retainer: 1200 },
  { id: 'mb2', name: 'Lumora Skincare', industry: 'Beauty',           color: '#059669', initials: 'LS', retainer:  900 },
  { id: 'mb3', name: 'Forma Fit',       industry: 'Fitness apparel',  color: '#2563EB', initials: 'FF', retainer:    0 },
]

const INITIAL_BANK_ACCOUNTS: AgencyBankAccount[] = [
  { id: 'ba1', bankName: 'Swedbank Latvia', ibanLast4: '8832', ibanFull: 'LV89HABA0551028688832', holderName: 'Baltic Creators Agency SIA', accountType: 'business', isDefault: true  },
  { id: 'ba2', bankName: 'Revolut Business',ibanLast4: '4411', ibanFull: 'LT603250075524884411', holderName: 'Baltic Creators Agency SIA', accountType: 'business', isDefault: false },
]

const INITIAL_PENDING_INVOICES: PendingInvoice[] = [
  { id: 'inv1', brandId: 'mb1', brandName: 'Kinetics',        brandColor: '#8B31E8', brandInitials: 'KI', amount: 1200, type: 'retainer',     period: 'July 2026 retainer',     dueDate: 'Jul 7, 2026',  isOverdue: false, ref: 'INV-2026-0052' },
  { id: 'inv2', brandId: 'mb2', brandName: 'Lumora Skincare', brandColor: '#059669', brandInitials: 'LS', amount:  900, type: 'retainer',     period: 'July 2026 retainer',     dueDate: 'Jul 7, 2026',  isOverdue: false, ref: 'INV-2026-0053' },
  { id: 'inv3', brandId: 'mb3', brandName: 'Forma Fit',       brandColor: '#2563EB', brandInitials: 'FF', amount:  700, type: 'campaign_fee', period: 'Training Block Q3 delivery', dueDate: 'Jun 30, 2026', isOverdue: true,  ref: 'INV-2026-0049' },
]

const INITIAL_TRANSACTIONS: AgencyTransaction[] = [
  { id: 't1',  type: 'retainer',    status: 'completed',  amount: 1200, description: 'Kinetics',           detail: 'June 2026 monthly retainer',                 date: 'Jun 1, 2026',   brandId: 'mb1', ref: 'PAY-2026-0612' },
  { id: 't2',  type: 'retainer',    status: 'completed',  amount:  900, description: 'Lumora Skincare',    detail: 'June 2026 monthly retainer',                 date: 'Jun 1, 2026',   brandId: 'mb2', ref: 'PAY-2026-0613' },
  { id: 't3',  type: 'fee',         status: 'completed',  amount:  700, description: 'Forma Fit',          detail: 'Training Block Q3 — campaign delivery fee',  date: 'Jun 12, 2026',  brandId: 'mb3', ref: 'PAY-2026-0628' },
  { id: 't4',  type: 'mgmt_fee',    status: 'completed',  amount:  390, description: 'Grade mgmt fee',     detail: 'Electrolyte Hot Yoga · 15% of €2,600',       date: 'Jun 14, 2026',  brandId: 'mb1', ref: 'PAY-2026-0631' },
  { id: 't5',  type: 'disbursed',   status: 'completed',  amount:  350, description: 'Amelia Roze',        detail: 'Electrolyte Hot Yoga — creator fee via Grade',date: 'Jun 15, 2026',  creatorName: 'Amelia Roze',  ref: 'DIS-2026-0441' },
  { id: 't6',  type: 'disbursed',   status: 'completed',  amount:  280, description: 'Sandra Liepa',       detail: 'Morning Ritual — creator fee via Grade',      date: 'Jun 15, 2026',  creatorName: 'Sandra Liepa', ref: 'DIS-2026-0442' },
  { id: 't7',  type: 'withdrawal',  status: 'completed',  amount: 2400, description: 'Withdrawal to Swedbank Latvia', detail: '···8832 · Processed by Grade',     date: 'Jun 16, 2026',  bankAccount: '···8832', ref: 'WD-2026-0448'  },
  { id: 't8',  type: 'mgmt_fee',    status: 'completed',  amount:  180, description: 'Grade mgmt fee',     detail: 'Vāre Coffee New Roast · 15% of €1,200',      date: 'Jun 18, 2026',  ref: 'PAY-2026-0644' },
  { id: 't9',  type: 'invoice_sent',status: 'pending',    amount: 1200, description: 'Kinetics',           detail: 'July 2026 retainer invoice · due Jul 7',     date: 'Jun 24, 2026',  brandId: 'mb1', ref: 'INV-2026-0052' },
  { id: 't10', type: 'invoice_sent',status: 'pending',    amount:  900, description: 'Lumora Skincare',    detail: 'July 2026 retainer invoice · due Jul 7',     date: 'Jun 24, 2026',  brandId: 'mb2', ref: 'INV-2026-0053' },
  { id: 't11', type: 'fee',         status: 'in_escrow',  amount:  680, description: 'NordGlow',           detail: 'Campaign budget in Grade escrow — awaiting creator delivery', date: 'Jun 20, 2026', expectedDate: 'Jul 31, 2026', ref: 'ESC-2026-0449' },
]

const AVAILABLE_BALANCE  = 3240
const PENDING_INVOICES_TOTAL = 2800
const IN_ESCROW_TOTAL    = 680
const LIFETIME_EARNED    = 18450
const THIS_MONTH_EARNED  = 2580

/* ─── Income breakdown ───────────────────────────────────────────── */
const INCOME_BREAKDOWN = [
  { label: 'Retainers',       amount: 2100, detail: '3 managed brands · /mo',   color: '#8B31E8', pct: 72 },
  { label: 'Management fees', amount:  480, detail: '2 campaigns this month',    color: '#059669', pct: 19 },
  { label: 'Campaign fees',   amount:  700, detail: '1 delivery (Forma Fit)',    color: '#2563EB', pct: 27 },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS — inline SVG only
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function BellIcon({ s = 18 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CheckIcon({ s = 13 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 13 }: { s?: number })            { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function ArrowDownIcon({ s = 18 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 4v16M5 15l7 7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ArrowUpIcon({ s = 15 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 20V4M5 9l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ClockIcon({ s = 14 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BankIcon({ s = 18 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function PlusIcon({ s = 13 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function TrashIcon({ s = 13 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ShieldCheckIcon({ s = 18 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function AlertIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function StarIcon({ s = 12 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z"/></svg> }
function LockIcon({ s = 18 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function RefreshIcon({ s = 13 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 22 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function InfoIcon({ s = 15 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function SendIcon({ s = 14 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BriefcaseIcon({ s = 20 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function RepeatIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ExternalLinkIcon({ s = 13 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChartBarIcon({ s = 18 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function UsersIcon({ s = 14 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmt(n: number): string { return `€${n.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` }
function genRef(): string { return `WD-2026-${String(Math.floor(Math.random() * 900) + 500)}` }
function genInvRef(): string { return `INV-2026-0${String(Math.floor(Math.random() * 90) + 60)}` }

/* ════════════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════════════ */
function Toast({ visible, message }: { visible: boolean; message: string }) {
  return (
    <div className={`fixed bottom-6 left-1/2 z-[900] -translate-x-1/2 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
      <div className={`flex items-center gap-3 rounded-2xl ${GRAD_BTN} px-5 py-3.5 shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]`}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white"><CheckIcon s={12}/></span>
        <p className="text-[13.5px] font-bold text-white">{message}</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   KYC BANNER — blocks withdrawal until business KYC done
   ════════════════════════════════════════════════════════════════════ */
function KycBanner({ onVerify }: { onVerify: () => void }) {
  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50 ${CARD}`}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <LockIcon s={22}/>
        </div>
        <div className="flex-1">
          <p className="text-[14.5px] font-extrabold text-amber-900">Verify your agency identity to unlock withdrawals</p>
          <p className="mt-1 text-[13px] leading-[1.6] text-amber-700">EU DAC7 regulations require business identity verification before any agency payout. Required once — company registration + director ID. Handled securely by Grade.</p>
          <div className="mt-2 flex flex-wrap gap-3 text-[11.5px] font-semibold text-amber-600">
            <span className="flex items-center gap-1"><CheckIcon s={10}/>Company registration doc</span>
            <span className="flex items-center gap-1"><CheckIcon s={10}/>Director ID</span>
            <span className="flex items-center gap-1"><CheckIcon s={10}/>Under 10 minutes</span>
          </div>
        </div>
        <button onClick={onVerify} className="flex-shrink-0 rounded-xl bg-amber-500 px-5 py-3 text-[13.5px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-amber-600">
          Verify agency
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ENTITY TILE — for brand logos in invoices list
   ════════════════════════════════════════════════════════════════════ */
function EntityTile({ initials, color, size = 34 }: { initials: string; color: string; size?: number }) {
  return <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>{initials}</div>
}

/* ════════════════════════════════════════════════════════════════════
   WITHDRAWAL MODAL — 3-step, same flow as creator but business labels
   ════════════════════════════════════════════════════════════════════ */
function WithdrawalModal({ open, available, accounts, onClose, onConfirm }: {
  open: boolean; available: number; accounts: AgencyBankAccount[]
  onClose: () => void; onConfirm: (amount: number, accountId: string, ref: string) => void
}) {
  const [step,      setStep]      = useState<1|2|3>(1)
  const [amountStr, setAmountStr] = useState(String(available))
  const [accountId, setAccountId] = useState(accounts.find(a => a.isDefault)?.id ?? accounts[0]?.id ?? '')
  const [submitting,setSubmitting]= useState(false)
  const [wdRef,     setWdRef]     = useState('')

  useEffect(() => {
    if (open) { setStep(1); setAmountStr(String(available)); setSubmitting(false) }
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open, available])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && step !== 3) onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose, step])

  if (!open) return null

  const amount      = parseFloat(amountStr) || 0
  const amountValid = amount > 0 && amount <= available
  const selAcct     = accounts.find(a => a.id === accountId)

  const arrivalDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 4)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  })()

  const handleConfirm = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 900))
    const ref = genRef(); setWdRef(ref)
    setStep(3); setSubmitting(false)
    onConfirm(amount, accountId, ref)
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget && step !== 3) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => step !== 3 && onClose()}/>
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}
        style={{ maxHeight: 'min(92vh, 660px)' }}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>

        {/* STEP 1 — Amount + account */}
        {step === 1 && (
          <>
            <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
              <div>
                <h3 className="text-[16px] font-extrabold text-ink">Withdraw agency funds</h3>
                <p className="text-[11.5px] text-ink/45">{fmt(available)} available · processed via Grade</p>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10"><XIcon s={13}/></button>
            </div>
            <div className="overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: '55vh' }}>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Amount to withdraw *</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-extrabold text-ink/40">€</span>
                  <input type="number" min={1} max={available} step={0.01} value={amountStr} onChange={e => setAmountStr(e.target.value)}
                    className={`${INP} pl-9 text-[18px] font-extrabold ${amountStr && !amountValid ? 'border-rose-300' : ''}`}/>
                  <button onClick={() => setAmountStr(String(available))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg bg-primary/[0.08] px-2.5 py-1 text-[11.5px] font-bold text-primary hover:bg-primary/[0.14]">
                    Max
                  </button>
                </div>
                {amountStr && !amountValid && <p className="mt-1.5 text-[12px] font-semibold text-rose-600">{amount > available ? `Maximum is ${fmt(available)}` : 'Enter a valid amount'}</p>}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[available, Math.floor(available * 0.5), 1000, 500].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4).map(v => (
                    <button key={v} onClick={() => setAmountStr(String(v))}
                      className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-bold transition ${amountStr === String(v) ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
                      {v === available ? 'All · ' : ''}{fmt(v)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Withdraw to *</label>
                <div className="space-y-2">
                  {accounts.map(acct => (
                    <button key={acct.id} onClick={() => setAccountId(acct.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition ${accountId === acct.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${accountId === acct.id ? GRAD_BTN + ' text-white' : 'bg-surface-sub text-ink/50'}`}><BankIcon s={15}/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13.5px] font-bold text-ink">{acct.bankName}</p>
                          <span className="rounded-full bg-primary/[0.07] px-2 py-0.5 text-[9.5px] font-bold text-primary uppercase">{acct.accountType}</span>
                          {acct.isDefault && <span className="rounded-full bg-surface-sub px-2 py-0.5 text-[9.5px] font-bold text-ink/50">Default</span>}
                        </div>
                        <p className="text-[12px] text-ink/45">{acct.holderName} · ···{acct.ibanLast4}</p>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${accountId === acct.id ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                        {accountId === acct.id && <CheckIcon s={10}/>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-surface-sub px-4 py-3.5">
                <InfoIcon s={15}/>
                <p className="text-[12px] text-ink/55 leading-[1.65]"><span className="font-bold text-ink">Processing time:</span> 3–5 business days. Grade consolidates and processes agency payouts. DAC7 reporting handled automatically for Nexfluence SIA (Latvian operator).</p>
              </div>
            </div>
            <div className="border-t border-primary/10 px-6 py-4 flex gap-2.5">
              <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3.5 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Cancel</button>
              <button onClick={() => setStep(2)} disabled={!amountValid || !accountId}
                className={`flex-[2] rounded-xl py-3.5 text-[14px] font-bold text-white transition ${amountValid && accountId ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                Review withdrawal
              </button>
            </div>
          </>
        )}

        {/* STEP 2 — Review + confirm */}
        {step === 2 && (
          <>
            <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[13px] font-semibold text-ink/50 hover:text-ink">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>Back
              </button>
              <h3 className="text-[15px] font-extrabold text-ink">Confirm withdrawal</h3>
              <div className="w-12"/>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div className={`overflow-hidden rounded-2xl border border-primary/15 bg-white ${CARD}`}>
                <div className={`flex flex-col items-center justify-center py-7 ${GRAD_BTN}`}>
                  <p className="text-[13px] font-semibold text-white/70">Withdrawing from agency wallet</p>
                  <p className="mt-1 text-[40px] font-black tracking-[-0.04em] text-white">{fmt(amount)}</p>
                </div>
                <div className="divide-y divide-primary/8 px-5 py-1">
                  {[
                    { label: 'To account',        value: `${selAcct?.bankName} · ···${selAcct?.ibanLast4}` },
                    { label: 'Account holder',    value: selAcct?.holderName ?? '' },
                    { label: 'Account type',      value: selAcct?.accountType === 'business' ? 'Business account' : 'Personal account' },
                    { label: 'Estimated arrival', value: arrivalDate },
                    { label: 'Processed by',      value: 'Grade (YC W26) · secure escrow' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                      <span className="text-[12px] font-semibold text-ink/40">{row.label}</span>
                      <span className="text-right text-[13px] font-semibold text-ink">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[12px] text-center text-ink/40 leading-[1.65]">
                By confirming, you authorise Nexfluence and Grade to transfer {fmt(amount)} from Baltic Creators Agency's wallet to the account shown.
              </p>
            </div>
            <div className="border-t border-primary/10 px-6 py-4">
              <button onClick={handleConfirm} disabled={submitting}
                className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-[15px] font-bold text-white transition ${!submitting ? `${GRAD_BTN} shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/15 text-ink/30'}`}>
                {submitting
                  ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60"/>Processing…</>
                  : <><ArrowDownIcon s={18}/>Confirm withdrawal · {fmt(amount)}</>}
              </button>
            </div>
          </>
        )}

        {/* STEP 3 — Success */}
        {step === 3 && (
          <div className="flex flex-col items-center px-7 py-10 text-center">
            <div className={`mb-5 flex items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]`} style={{ width: 72, height: 72 }}>
              <CheckIcon s={28}/>
            </div>
            <h3 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">Withdrawal initiated!</h3>
            <p className="mt-2.5 max-w-[320px] text-[13.5px] leading-[1.7] text-ink/55">
              <span className="font-bold text-ink">{fmt(amount)}</span> is on its way to <span className="font-bold text-ink">{selAcct?.bankName}</span>. Funds typically arrive within 3–5 business days.
            </p>
            <div className={`mt-5 flex items-center gap-3 rounded-xl border border-primary/12 bg-surface-sub px-5 py-3.5 ${CARD}`}>
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${GRAD_BTN} text-white text-[10px] font-black`}>REF</div>
              <div className="text-left">
                <p className="text-[10.5px] font-semibold text-ink/40">Reference number</p>
                <p className={`text-[15px] font-extrabold tracking-[-0.01em] ${GRAD_TXT}`}>{wdRef}</p>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] text-ink/35">Grade will send a confirmation email to your registered agency address.</p>
            <button onClick={onClose} className={`mt-6 rounded-xl ${GRAD_BTN} px-8 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5 transition`}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ADD BANK ACCOUNT MODAL — business account variant
   ════════════════════════════════════════════════════════════════════ */
function AddBankModal({ open, onClose, onAdd }: {
  open: boolean; onClose: () => void; onAdd: (acct: Omit<AgencyBankAccount, 'id'>) => void
}) {
  const [bankName,   setBankName]   = useState('')
  const [iban,       setIban]       = useState('')
  const [holderName, setHolderName] = useState('')
  const [isDefault,  setIsDefault]  = useState(false)
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    if (!open) { setBankName(''); setIban(''); setHolderName(''); setIsDefault(false) }
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!open) return null
  const ibanClean = iban.toUpperCase().replace(/\s/g, '')
  const ibanValid = ibanClean.length >= 15 && ibanClean.length <= 34
  const canSave   = bankName.trim() && ibanValid && holderName.trim()

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true); await new Promise(r => setTimeout(r, 700))
    onAdd({ bankName: bankName.trim(), ibanFull: ibanClean, ibanLast4: ibanClean.slice(-4), holderName: holderName.trim(), accountType: 'business', isDefault })
    setSaving(false); onClose()
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[460px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
          <div>
            <h3 className="text-[16px] font-extrabold text-ink">Add business bank account</h3>
            <p className="text-[11.5px] text-ink/45">For agency payouts — must be a business/company account</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10"><XIcon s={13}/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Bank name *</label>
            <input className={INP} value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Swedbank, Luminor, SEB, Revolut Business"/>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-ink/50">IBAN *</label>
            <input className={INP} value={iban} onChange={e => setIban(e.target.value)} placeholder="e.g. LV89HABA0551028688832" style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}/>
            {iban && !ibanValid && <p className="mt-1.5 text-[12px] font-semibold text-rose-600">IBAN must be 15–34 characters</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Account holder name *</label>
            <input className={INP} value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="Baltic Creators Agency SIA"/>
          </div>
          <button onClick={() => setIsDefault(d => !d)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-ink/70 hover:bg-primary/[0.04] transition">
            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${isDefault ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white'}`}>
              {isDefault && <CheckIcon s={10}/>}
            </span>
            Set as default withdrawal account
          </button>
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <ShieldCheckIcon s={15}/>
            <p className="text-[12px] text-emerald-700 leading-[1.6]">Your IBAN is encrypted and stored securely by Grade. Nexfluence never stores raw banking details.</p>
          </div>
        </div>
        <div className="border-t border-primary/10 px-6 py-4 flex gap-2.5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Cancel</button>
          <button onClick={handleSave} disabled={!canSave || saving}
            className={`flex-[2] flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${canSave && !saving ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            {saving ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Saving…</> : <><CheckIcon s={12}/>Save account</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INVOICE REQUEST MODAL — "payment asking"
   Agency selects brand, invoice type, amount, period, due date, note.
   Creates a pending invoice + transaction.
   ════════════════════════════════════════════════════════════════════ */
function InvoiceRequestModal({ open, onClose, onSend }: {
  open: boolean; onClose: () => void
  onSend: (inv: Omit<PendingInvoice, 'id'> & { note: string }) => void
}) {
  const [brandId,     setBrandId]     = useState(MANAGED_BRANDS[0]?.id ?? '')
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('retainer')
  const [amount,      setAmount]      = useState('')
  const [period,      setPeriod]      = useState('')
  const [dueDate,     setDueDate]     = useState('')
  const [note,        setNote]        = useState('')
  const [sending,     setSending]     = useState(false)
  const [sent,        setSent]        = useState(false)

  useEffect(() => {
    if (!open) { setSent(false); setSending(false); setAmount(''); setPeriod(''); setDueDate(''); setNote('') }
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!open) return null

  const brand    = MANAGED_BRANDS.find(b => b.id === brandId)
  const amtNum   = parseFloat(amount) || 0
  const canSend  = brandId && amtNum > 0 && period.trim()

  const TYPE_LABELS: Record<InvoiceType, string> = {
    retainer:     'Monthly retainer',
    campaign_fee: 'Campaign delivery fee',
    mgmt_fee:     'Management fee',
  }

  const handleSend = async () => {
    if (!canSend || !brand) return
    setSending(true); await new Promise(r => setTimeout(r, 800))
    const ref = genInvRef()
    onSend({
      brandId:     brand.id,
      brandName:   brand.name,
      brandColor:  brand.color,
      brandInitials: brand.initials,
      amount:      amtNum,
      type:        invoiceType,
      period:      period.trim(),
      dueDate:     dueDate || 'On receipt',
      isOverdue:   false,
      ref,
      note,
    })
    setSending(false); setSent(true)
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[520px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}
        style={{ maxHeight: 'min(92vh, 720px)' }}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>

        {sent ? (
          /* Success */
          <div className="flex flex-col items-center px-7 py-10 text-center">
            <div className={`mb-5 flex items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]`} style={{ width: 72, height: 72 }}>
              <CheckIcon s={28}/>
            </div>
            <h3 className="text-[20px] font-extrabold text-ink">Invoice sent!</h3>
            <p className="mt-2.5 max-w-[320px] text-[13.5px] leading-[1.7] text-ink/55">
              The invoice has been sent to <span className="font-bold text-ink">{brand?.name}</span> as a message and added to your pending invoices.
            </p>
            <div className="mt-6 flex gap-2.5">
              <button onClick={onClose} className="rounded-xl border border-primary/15 bg-white px-6 py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Done</button>
              <button onClick={onClose} className={`rounded-xl ${GRAD_BTN} px-6 py-3 text-[13.5px] font-bold text-white hover:-translate-y-0.5 transition`}>View in Messages</button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}><EuroIcon s={18}/></div>
                <div>
                  <p className="text-[16px] font-extrabold text-ink">Request payment</p>
                  <p className="text-[11.5px] text-ink/45">Send an invoice to a brand client</p>
                </div>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10"><XIcon s={13}/></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Brand selector */}
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Invoice which brand? *</label>
                <div className="space-y-2">
                  {MANAGED_BRANDS.map(b => (
                    <button key={b.id} type="button" onClick={() => setBrandId(b.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${brandId === b.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                      <EntityTile initials={b.initials} color={b.color} size={34}/>
                      <div className="flex-1"><p className="text-[13.5px] font-bold text-ink">{b.name}</p>
                        <p className="text-[11.5px] text-ink/45">{b.industry}{b.retainer > 0 ? ` · €${b.retainer}/mo retainer` : ' · single campaign'}</p></div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${brandId === b.id ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                        {brandId === b.id && <CheckIcon s={10}/>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoice type */}
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Invoice type *</label>
                <div className="flex flex-wrap gap-2">
                  {(['retainer', 'campaign_fee', 'mgmt_fee'] as InvoiceType[]).map(t => (
                    <button key={t} type="button" onClick={() => setInvoiceType(t)}
                      className={`flex items-center gap-1.5 rounded-xl border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition ${invoiceType === t ? `border-primary/30 ${GRAD_BTN} text-white` : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
                      {invoiceType === t && <CheckIcon s={10}/>}{TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount + period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Amount (€) *</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/38">€</span>
                    <input type="number" min={1} className={`${INP} pl-8`} value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder={brand?.retainer ? String(brand.retainer) : '700'}/>
                  </div>
                  {brand?.retainer && invoiceType === 'retainer' && !amount && (
                    <button onClick={() => setAmount(String(brand.retainer))} className="mt-1.5 text-[11px] font-bold text-primary hover:underline">
                      Use contract rate €{brand.retainer}
                    </button>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Period / description *</label>
                  <input className={INP} value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. July 2026 retainer"/>
                </div>
              </div>

              {/* Due date + note */}
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Due date (optional)</label>
                <input type="date" className={INP} value={dueDate} onChange={e => setDueDate(e.target.value)}/>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Note to brand (optional)</label>
                <textarea className={`${INP} min-h-[72px] resize-y text-[13px]`} value={note} onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Monthly agency management fee per the signed agreement. Please process by the 7th."/>
              </div>

              {/* Preview */}
              {amtNum > 0 && brand && (
                <div className={`rounded-xl border border-primary/10 bg-primary/[0.03] px-4 py-3.5 ${CARD}`}>
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-primary/60 mb-2">Invoice preview</p>
                  <p className="text-[13.5px] font-semibold text-ink">{TYPE_LABELS[invoiceType as InvoiceType]} · <span className="font-extrabold">{fmt(amtNum)}</span></p>
                  <p className="text-[12px] text-ink/50">{brand.name} · {period || 'Period not set'}{dueDate ? ` · due ${dueDate}` : ''}</p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 border-t border-primary/10 px-6 py-4 flex gap-2.5">
              <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Cancel</button>
              <button onClick={handleSend} disabled={!canSend || sending}
                className={`flex-[2] flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${canSend && !sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                {sending ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</> : <><SendIcon s={14}/>Send invoice to {brand?.name}</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TRANSACTION ROW — agency-specific types
   ════════════════════════════════════════════════════════════════════ */
const TX_CFG: Record<TxType, { icon: ReactNode; sign: string; amountCls: string; iconBg: string; label: string }> = {
  retainer:     { icon: <RepeatIcon s={14}/>,    sign: '+', amountCls: 'text-emerald-700', iconBg: 'bg-emerald-50 text-emerald-600', label: 'Retainer'     },
  fee:          { icon: <BriefcaseIcon s={14}/>, sign: '+', amountCls: 'text-emerald-700', iconBg: 'bg-emerald-50 text-emerald-600', label: 'Fee'          },
  mgmt_fee:     { icon: <ChartBarIcon s={14}/>,  sign: '+', amountCls: 'text-primary',     iconBg: 'bg-primary/[0.08] text-primary',  label: 'Mgmt fee'    },
  disbursed:    { icon: <UsersIcon s={14}/>,     sign: '−', amountCls: 'text-amber-700',   iconBg: 'bg-amber-50 text-amber-600',     label: 'Disbursed'    },
  invoice_sent: { icon: <EuroIcon s={14}/>,      sign: '',  amountCls: 'text-ink/55',      iconBg: 'bg-surface-sub text-ink/50',     label: 'Invoice sent' },
  withdrawal:   { icon: <ArrowUpIcon s={14}/>,   sign: '−', amountCls: 'text-ink/70',      iconBg: 'bg-surface-sub text-ink/50',     label: 'Withdrawal'   },
}

const STATUS_CFG: Record<TxStatus, { label: string; bg: string; text: string; dot: string }> = {
  completed:  { label: 'Completed',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  processing: { label: 'Processing', bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400'     },
  pending:    { label: 'Pending',    bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  in_escrow:  { label: 'In escrow',  bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400'  },
}

function TransactionRow({ tx }: { tx: AgencyTransaction }) {
  const tc = TX_CFG[tx.type]
  const sc = STATUS_CFG[tx.status]
  return (
    <div className="flex items-center gap-3 border-b border-primary/6 px-5 py-4 last:border-0 transition hover:bg-surface-sub/40">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${tc.iconBg}`}>{tc.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[13.5px] font-semibold text-ink">{tx.description}</p>
        <p className="text-[11.5px] text-ink/40">{tx.detail}</p>
        {tx.expectedDate && <p className="mt-0.5 text-[11px] font-semibold text-violet-600">Expected {tx.expectedDate}</p>}
      </div>
      <span className={`hidden flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold sm:flex ${sc.bg} ${sc.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
      </span>
      <span className="hidden flex-shrink-0 text-[11.5px] text-ink/35 sm:block">{tx.date}</span>
      <span className={`flex-shrink-0 text-[14px] font-extrabold tabular-nums ${tc.amountCls}`}>
        {tc.sign}{tx.type !== 'invoice_sent' ? fmt(tx.amount) : <span className="text-ink/45">{fmt(tx.amount)}</span>}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function AgencyPaymentsPage() {
  const router = useRouter()

  const [kycVerified,     setKycVerified]     = useState(MOCK_KYC_VERIFIED)
  const [availBal,        setAvailBal]        = useState(AVAILABLE_BALANCE)
  const [transactions,    setTransactions]    = useState<AgencyTransaction[]>(INITIAL_TRANSACTIONS)
  const [bankAccounts,    setBankAccounts]    = useState<AgencyBankAccount[]>(INITIAL_BANK_ACCOUNTS)
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>(INITIAL_PENDING_INVOICES)
  const [filter,          setFilter]          = useState<FilterTab>('all')
  const [withdrawOpen,    setWithdrawOpen]    = useState(false)
  const [addBankOpen,     setAddBankOpen]     = useState(false)
  const [invoiceOpen,     setInvoiceOpen]     = useState(false)
  const [deletingBankId,  setDeletingBankId]  = useState<string | null>(null)
  const [toastVisible,    setToastVisible]    = useState(false)
  const [toastMsg,        setToastMsg]        = useState('')

  const UNREAD_NOTIFS = 3

  const showToast = (msg: string) => { setToastMsg(msg); setToastVisible(true); setTimeout(() => setToastVisible(false), 3200) }

  /* Derived counts */
  const overdueCount = pendingInvoices.filter(i => i.isOverdue).length
  const pendingTotal = pendingInvoices.reduce((s, i) => s + i.amount, 0)

  const handleWithdrawConfirm = (amount: number, accountId: string, ref: string) => {
    const acct = bankAccounts.find(a => a.id === accountId)
    const newTx: AgencyTransaction = {
      id: `t${Date.now()}`, type: 'withdrawal', status: 'processing', amount,
      description: `Withdrawal to ${acct?.bankName ?? 'bank'}`,
      detail: `···${acct?.ibanLast4} · Processing via Grade`,
      date: 'Just now', bankAccount: `···${acct?.ibanLast4}`, ref,
    }
    setTransactions(prev => [newTx, ...prev])
    setAvailBal(prev => prev - amount)
    showToast(`${fmt(amount)} withdrawal initiated — arrives in 3–5 business days`)
  }

  const handleAddBank = (acct: Omit<AgencyBankAccount, 'id'>) => {
    const newAcct: AgencyBankAccount = { ...acct, id: `ba${Date.now()}` }
    setBankAccounts(prev => { const u = acct.isDefault ? prev.map(a => ({ ...a, isDefault: false })) : prev; return [...u, newAcct] })
    showToast(`${acct.bankName} added as withdrawal account`)
  }

  const handleSetDefaultBank = (id: string) => { setBankAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id }))) }
  const handleDeleteBank     = (id: string) => { setBankAccounts(prev => prev.filter(a => a.id !== id)); setDeletingBankId(null); showToast('Bank account removed') }

  const handleInvoiceSend = (inv: Omit<PendingInvoice, 'id'> & { note: string }) => {
    const newInv: PendingInvoice = { ...inv, id: `inv${Date.now()}` }
    setPendingInvoices(prev => [...prev, newInv])
    const newTx: AgencyTransaction = {
      id: `t${Date.now()}`, type: 'invoice_sent', status: 'pending', amount: inv.amount,
      description: inv.brandName, detail: `${inv.period} · due ${inv.dueDate}`,
      date: 'Just now', brandId: inv.brandId, ref: inv.ref,
    }
    setTransactions(prev => [newTx, ...prev])
    showToast(`Invoice of ${fmt(inv.amount)} sent to ${inv.brandName}`)
  }

  const handleMarkPaid = (id: string) => {
    const inv = pendingInvoices.find(i => i.id === id)
    if (!inv) return
    setPendingInvoices(prev => prev.filter(i => i.id !== id))
    const newTx: AgencyTransaction = {
      id: `t${Date.now()}`, type: inv.type === 'retainer' ? 'retainer' : 'fee', status: 'completed',
      amount: inv.amount, description: inv.brandName, detail: `${inv.period} — marked received`,
      date: 'Just now', brandId: inv.brandId, ref: inv.ref,
    }
    setTransactions(prev => [newTx, ...prev])
    setAvailBal(prev => prev + inv.amount)
    showToast(`${fmt(inv.amount)} from ${inv.brandName} marked as received`)
  }

  const handleReminder = (id: string) => {
    const inv = pendingInvoices.find(i => i.id === id)
    if (inv) showToast(`Payment reminder sent to ${inv.brandName}`)
  }

  /* Filtered transactions */
  const filtered = transactions.filter(tx => {
    if (filter === 'income')        return ['retainer','fee','mgmt_fee'].includes(tx.type)
    if (filter === 'disbursements') return tx.type === 'disbursed'
    if (filter === 'withdrawals')   return tx.type === 'withdrawal'
    return true
  })

  const tabCounts = {
    all:           transactions.length,
    income:        transactions.filter(t => ['retainer','fee','mgmt_fee'].includes(t.type)).length,
    disbursements: transactions.filter(t => t.type === 'disbursed').length,
    withdrawals:   transactions.filter(t => t.type === 'withdrawal').length,
  }

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ MODALS ════ */}
      <Toast visible={toastVisible} message={toastMsg}/>
      <WithdrawalModal open={withdrawOpen} available={availBal} accounts={bankAccounts}
        onClose={() => setWithdrawOpen(false)} onConfirm={handleWithdrawConfirm}/>
      <AddBankModal open={addBankOpen} onClose={() => setAddBankOpen(false)} onAdd={handleAddBank}/>
      <InvoiceRequestModal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} onSend={handleInvoiceSend}/>

      {/* ════ HEADER — agency pattern (Bell, no ChatBubble in primary nav) ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg,rgba(139,49,232,0.05) 0%,rgba(139,49,232,0.05) 30%,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 58%,rgba(139,49,232,0.05) 70%,rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {[
                { label: 'Dashboard', active: false, action: () => router.push('/dashboard/agency') },
                { label: 'Campaigns', active: false, action: () => {} },
                { label: 'Payments',  active: true,  action: () => {} },
              ].map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
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
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-4 py-6 sm:px-6 sm:py-8">

        {/* KYC gate */}
        {!kycVerified && <div className="mb-6"><KycBanner onVerify={() => setKycVerified(true)}/></div>}

        {/* ════ BALANCE HERO ════ */}
        <div className={`mb-6 overflow-hidden rounded-2xl ${CARD}`}
          style={{ background: 'linear-gradient(120deg, #8B31E8 0%, #a03be8 40%, #b44af0 70%, #FF33BC 100%)' }}>
          {[
            { w: 280, h: 280, top: '-60%', left: '-5%', op: 0.12, blur: 70 },
            { w: 200, h: 200, top: '-20%', left: '40%', op: 0.10, blur: 55 },
            { w: 320, h: 320, top: '-70%', left: '65%', op: 0.14, blur: 80 },
          ].map((o, i) => (
            <div key={i} aria-hidden="true" style={{ position: 'absolute', borderRadius: '50%', width: o.w, height: o.h, top: o.top, left: o.left, background: 'white', opacity: o.op, filter: `blur(${o.blur}px)`, pointerEvents: 'none' }}/>
          ))}
          <div className="relative px-7 py-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Available balance + actions */}
              <div className="sm:col-span-2">
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/60">Agency wallet — available to withdraw</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <span className="text-[48px] font-black tracking-[-0.04em] text-white">{fmt(availBal)}</span>
                  {kycVerified && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setWithdrawOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-[13.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/30">
                        <ArrowUpIcon s={14}/>Withdraw
                      </button>
                      <button onClick={() => setInvoiceOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-[13.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/25">
                        <EuroIcon s={14}/>Request payment
                      </button>
                    </div>
                  )}
                  {!kycVerified && (
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-white/60"><LockIcon s={14}/>Verify to unlock withdrawals</div>
                  )}
                </div>
              </div>
              {/* Sub-stats */}
              <div className="flex flex-col justify-center gap-4 sm:items-end sm:text-right">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Pending invoices</p>
                  <p className="text-[22px] font-extrabold text-white/80 tracking-[-0.02em]">{fmt(pendingTotal)}</p>
                  <p className="text-[11px] text-white/45">{pendingInvoices.length} invoice{pendingInvoices.length !== 1 ? 's' : ''} outstanding{overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">This month earned</p>
                  <p className="text-[22px] font-extrabold text-white/80 tracking-[-0.02em]">{fmt(THIS_MONTH_EARNED)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════ BODY GRID ════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── LEFT: Transactions (2/3) ── */}
          <div className="lg:col-span-2">
            <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
              <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
                <h2 className="text-[14.5px] font-extrabold text-ink">Transaction history</h2>
                <button className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink/40 transition hover:text-primary">
                  <RefreshIcon s={13}/>Refresh
                </button>
              </div>
              {/* Filter tabs */}
              <div className="flex border-b border-primary/8 px-2">
                {([
                  { id: 'all'           as FilterTab, label: 'All'           },
                  { id: 'income'        as FilterTab, label: 'Income'        },
                  { id: 'disbursements' as FilterTab, label: 'Disbursements' },
                  { id: 'withdrawals'   as FilterTab, label: 'Withdrawals'   },
                ]).map(tab => (
                  <button key={tab.id} onClick={() => setFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-[12.5px] font-semibold transition border-b-2 -mb-px ${filter === tab.id ? 'border-primary text-primary' : 'border-transparent text-ink/45 hover:text-ink/70'}`}>
                    {tab.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === tab.id ? 'bg-primary/[0.1] text-primary' : 'bg-surface-sub text-ink/35'}`}>
                      {tabCounts[tab.id]}
                    </span>
                  </button>
                ))}
              </div>
              <div>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <EuroIcon s={32}/>
                    <p className="mt-3 text-[13.5px] font-semibold text-ink/45">No {filter === 'all' ? '' : filter} transactions yet</p>
                  </div>
                ) : (
                  filtered.map(tx => <TransactionRow key={tx.id} tx={tx}/>)
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDEBAR (1/3) ── */}
          <div className="space-y-4 lg:col-span-1">
            <div className="lg:sticky lg:top-[84px] space-y-4">

              {/* Withdraw / request payment CTAs */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}><BriefcaseIcon s={16}/></div>
                  <div>
                    <p className="text-[13.5px] font-extrabold text-ink">Agency wallet</p>
                    <p className="text-[11.5px] text-ink/45">{fmt(availBal)} available</p>
                  </div>
                </div>
                {kycVerified ? (
                  <div className="space-y-2.5">
                    <button onClick={() => setWithdrawOpen(true)} disabled={availBal <= 0}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[13.5px] font-bold text-white transition ${availBal > 0 ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                      <ArrowDownIcon s={15}/>Withdraw funds
                    </button>
                    <button onClick={() => setInvoiceOpen(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-white py-3 text-[13.5px] font-bold text-primary transition hover:bg-primary/[0.04]">
                      <EuroIcon s={15}/>Request payment from brand
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setKycVerified(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-3.5 text-[13.5px] font-bold text-amber-700 hover:bg-amber-100 transition">
                    <LockIcon s={16}/>Verify agency first
                  </button>
                )}
                {availBal > 0 && kycVerified && (
                  <p className="mt-3 text-center text-[11.5px] text-ink/35">Processed by Grade · 3–5 business days</p>
                )}
              </div>

              {/* ── Income breakdown (agency-only) ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[13.5px] font-extrabold text-ink">This month</h3>
                  <span className={`text-[14px] font-extrabold ${GRAD_TXT}`}>{fmt(THIS_MONTH_EARNED)}</span>
                </div>
                <div className="space-y-3">
                  {INCOME_BREAKDOWN.map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[12.5px] font-semibold text-ink/65">{item.label}</span>
                        <span className="text-[13px] font-extrabold text-ink">{fmt(item.amount)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-sub overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, background: item.color }}/>
                      </div>
                      <p className="mt-1 text-[11px] text-ink/35">{item.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-primary/8 pt-4 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-ink/45">Lifetime earned</span>
                  <span className="text-[14px] font-extrabold text-ink">{fmt(LIFETIME_EARNED)}</span>
                </div>
              </div>

              {/* ── Pending invoices panel (agency-only) ── */}
              <div className={`rounded-2xl border ${overdueCount > 0 ? 'border-amber-200' : 'border-primary/10'} bg-white overflow-hidden ${CARD}`}>
                <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[13.5px] font-extrabold text-ink">Pending invoices</h3>
                    {overdueCount > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-600">
                        <AlertIcon s={10}/>{overdueCount} overdue
                      </span>
                    )}
                  </div>
                  <button onClick={() => setInvoiceOpen(true)}
                    className="flex items-center gap-1 rounded-lg border border-primary/15 px-3 py-1.5 text-[12px] font-bold text-primary hover:bg-primary/[0.05] transition">
                    <PlusIcon s={11}/>New
                  </button>
                </div>
                <div className="divide-y divide-primary/6">
                  {pendingInvoices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-5">
                      <CheckIcon s={22}/>
                      <p className="mt-2 text-[12.5px] font-semibold text-emerald-600">All invoices paid!</p>
                    </div>
                  )}
                  {pendingInvoices.map(inv => (
                    <div key={inv.id} className={`px-5 py-4 ${inv.isOverdue ? 'bg-rose-50/40' : ''}`}>
                      <div className="flex items-start gap-3">
                        <EntityTile initials={inv.brandInitials} color={inv.brandColor} size={32}/>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] font-bold text-ink">{inv.brandName}</p>
                            <span className="flex-shrink-0 text-[13.5px] font-extrabold text-ink">{fmt(inv.amount)}</span>
                          </div>
                          <p className="text-[11.5px] text-ink/45">{inv.period}</p>
                          <p className={`text-[11px] font-semibold ${inv.isOverdue ? 'text-rose-600' : 'text-ink/40'}`}>
                            {inv.isOverdue ? '⚠ Overdue · ' : ''}Due {inv.dueDate}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => handleReminder(inv.id)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/15 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.05]">
                          <SendIcon s={11}/>Remind
                        </button>
                        <button onClick={() => handleMarkPaid(inv.id)}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-bold text-white transition ${GRAD_BTN} hover:-translate-y-0.5`}>
                          <CheckIcon s={11}/>Mark paid
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Bank accounts ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white overflow-hidden ${CARD}`}>
                <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
                  <h3 className="text-[13.5px] font-extrabold text-ink">Business accounts</h3>
                  <button onClick={() => setAddBankOpen(true)}
                    className="flex items-center gap-1 rounded-lg border border-primary/15 px-3 py-1.5 text-[12px] font-bold text-primary hover:bg-primary/[0.05] transition">
                    <PlusIcon s={11}/>Add
                  </button>
                </div>
                <div className="divide-y divide-primary/6">
                  {bankAccounts.map(acct => (
                    <div key={acct.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/50"><BankIcon s={15}/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-bold text-ink truncate">{acct.bankName}</p>
                          {acct.isDefault && (
                            <span className="flex-shrink-0 flex items-center gap-0.5 rounded-full bg-primary/[0.09] px-1.5 py-0.5 text-[9.5px] font-bold text-primary">
                              <StarIcon s={9}/>Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-ink/40">···{acct.ibanLast4} · {acct.accountType}</p>
                      </div>
                      <div className="flex flex-shrink-0 gap-1">
                        {!acct.isDefault && (
                          <button onClick={() => handleSetDefaultBank(acct.id)} title="Set as default"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/30 hover:bg-primary/[0.07] hover:text-primary transition">
                            <StarIcon s={12}/>
                          </button>
                        )}
                        {deletingBankId === acct.id ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setDeletingBankId(null)} className="rounded-lg border border-primary/12 px-2.5 py-1 text-[11px] font-bold text-ink/50 hover:bg-surface-sub transition">Keep</button>
                            <button onClick={() => handleDeleteBank(acct.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition">Remove</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingBankId(acct.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/25 hover:bg-rose-50 hover:text-rose-500 transition"><TrashIcon s={12}/></button>
                        )}
                      </div>
                    </div>
                  ))}
                  {bankAccounts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-5">
                      <BankIcon s={24}/>
                      <p className="mt-2 text-[12.5px] font-semibold text-ink/45">No business accounts</p>
                      <p className="mt-0.5 text-[11.5px] text-ink/35">Add a business bank account to enable withdrawals.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Grade info ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheckIcon s={17}/></div>
                  <div>
                    <p className="text-[13px] font-extrabold text-ink">Powered by Grade</p>
                    <p className="text-[11px] text-ink/40">YC W26 · Escrow + DAC7</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-[12.5px] leading-[1.6] text-ink/55">
                  <p className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={11}/></span>All creator payments are held in escrow and distributed automatically on content approval.</p>
                  <p className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={11}/></span>Agency management fees are deducted at source by Grade before creator receives funds — no manual splitting.</p>
                  <p className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={11}/></span>DAC7 EU tax reporting handled automatically for your agency as a Latvian digital platform operator.</p>
                </div>
                <button onClick={() => router.push('/agency/payments/withdraw')}
                  className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-primary hover:underline">
                  <ExternalLinkIcon s={12}/>Full withdrawal history
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}