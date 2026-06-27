'use client'

import { useState, useEffect, useRef, useId, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Payments — app/payments/page.tsx  (Nexfluence v4, LIGHT)
   Stripe-inspired payment dashboard.
   Three payment types:
     1. Platform fee — Nexfluence take-rate on campaign spend
     2. Flat fee     — fixed amount per deliverable (one-time per contract)
     3. Commission   — % of tracked monthly sales, recalculates each cycle
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type PaymentType   = 'platform_fee' | 'flat_fee' | 'commission'
type PaymentStatus = 'paid' | 'pending' | 'processing' | 'failed' | 'scheduled'

interface Payment {
  id: string
  type: PaymentType
  campaign: string
  creator: string | null      /* null for platform fees */
  creatorInitials: string | null
  creatorColor: string | null
  description: string
  amount: number
  currency: string
  status: PaymentStatus
  date: string                /* ISO string — paid/failed date */
  dueDate: string | null      /* for pending/scheduled */
  period: string | null       /* e.g. "Jun 2026" for commissions */
  receipt: string | null
  conversionBase: string | null  /* e.g. "€3,200 in tracked sales" for commission rows */
}

interface UpcomingPayment {
  id: string
  type: PaymentType
  campaign: string
  creator: string | null
  creatorInitials: string | null
  creatorColor: string | null
  description: string
  amount: number
  currency: string
  dueDate: string
  daysUntilDue: number
}

/* ════════════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════════════ */
const PAYMENT_METHOD = {
  brand: 'Visa',
  last4: '4242',
  expiry: '09/27',
  name: 'Kinetics SIA',
}

const ALL_PAYMENTS: Payment[] = [
  /* Platform fees */
  { id: 'pf1', type: 'platform_fee', campaign: 'Vitamin-C Recovery Stack',  creator: null, creatorInitials: null, creatorColor: null, description: 'Nexfluence platform fee (12%)', amount: 228,  currency: 'EUR', status: 'paid',      date: 'Jun 19, 2026', dueDate: null,         period: null,       receipt: 'RCP-2026-0041', conversionBase: null },
  { id: 'pf2', type: 'platform_fee', campaign: 'Pre-Workout Race Day',        creator: null, creatorInitials: null, creatorColor: null, description: 'Nexfluence platform fee (12%)', amount: 120,  currency: 'EUR', status: 'paid',      date: 'Jun 10, 2026', dueDate: null,         period: null,       receipt: 'RCP-2026-0038', conversionBase: null },
  { id: 'pf3', type: 'platform_fee', campaign: 'Electrolyte Hot Yoga',        creator: null, creatorInitials: null, creatorColor: null, description: 'Nexfluence platform fee (12%)', amount: 84,   currency: 'EUR', status: 'pending',   date: '',             dueDate: 'Jul 1, 2026', period: null,       receipt: null,             conversionBase: null },

  /* Flat fees — creator payments */
  { id: 'ff1', type: 'flat_fee', campaign: 'Vitamin-C Recovery Stack',  creator: 'Amelia Roze',       creatorInitials: 'AR', creatorColor: '#8B31E8', description: 'Flat fee · 3 pieces', amount: 500,  currency: 'EUR', status: 'paid',      date: 'Jun 20, 2026', dueDate: null,          period: null,       receipt: 'RCP-2026-0042', conversionBase: null },
  { id: 'ff2', type: 'flat_fee', campaign: 'Pre-Workout Race Day',       creator: 'Markus Tamm',       creatorInitials: 'MT', creatorColor: '#2563EB', description: 'Flat fee · 2 videos',  amount: 800,  currency: 'EUR', status: 'pending',   date: '',             dueDate: 'Jun 28, 2026', period: null,       receipt: null,             conversionBase: null },
  { id: 'ff3', type: 'flat_fee', campaign: 'Pre-Workout Race Day',       creator: 'Jonas Petrauskas',  creatorInitials: 'JP', creatorColor: '#D97706', description: 'Flat fee · 1 video',   amount: 500,  currency: 'EUR', status: 'scheduled', date: '',             dueDate: 'Jul 5, 2026',  period: null,       receipt: null,             conversionBase: null },
  { id: 'ff4', type: 'flat_fee', campaign: 'Pantry Staples Refresh',    creator: 'Aiga Ozola',        creatorInitials: 'AO', creatorColor: '#EA580C', description: 'Flat fee · 2 TikToks', amount: 240,  currency: 'EUR', status: 'paid',      date: 'Jun 12, 2026', dueDate: null,          period: null,       receipt: 'RCP-2026-0035', conversionBase: null },
  { id: 'ff5', type: 'flat_fee', campaign: 'Capsule Wardrobe Drop',     creator: 'Sandra Liepa',      creatorInitials: 'SL', creatorColor: '#DB2777', description: 'Flat fee · 4 pieces',  amount: 720,  currency: 'EUR', status: 'failed',    date: 'Jun 22, 2026', dueDate: 'Jun 28, 2026', period: null,       receipt: null,             conversionBase: null },

  /* Commission payouts — variable monthly */
  { id: 'cm1', type: 'commission', campaign: 'Vitamin-C Recovery Stack',  creator: 'Amelia Roze',  creatorInitials: 'AR', creatorColor: '#8B31E8', description: '15% affiliate commission', amount: 312,  currency: 'EUR', status: 'paid',      date: 'Jun 22, 2026', dueDate: null,          period: 'Jun 2026', receipt: 'RCP-2026-0044', conversionBase: '€2,080 in tracked sales' },
  { id: 'cm2', type: 'commission', campaign: 'Vitamin-C Recovery Stack',  creator: 'Rūta Vaitkutė', creatorInitials: 'RV', creatorColor: '#C026D3', description: '16% affiliate commission', amount: 128,  currency: 'EUR', status: 'processing',date: '',             dueDate: null,          period: 'Jun 2026', receipt: null,             conversionBase: '€800 in tracked sales' },
  { id: 'cm3', type: 'commission', campaign: 'Pantry Staples Refresh',   creator: 'Aiga Ozola',   creatorInitials: 'AO', creatorColor: '#EA580C', description: '10% affiliate commission', amount: 240,  currency: 'EUR', status: 'paid',      date: 'Jun 13, 2026', dueDate: null,          period: 'Jun 2026', receipt: 'RCP-2026-0036', conversionBase: '€2,400 in tracked sales' },
  { id: 'cm4', type: 'commission', campaign: 'Capsule Wardrobe Drop',    creator: 'Sandra Liepa', creatorInitials: 'SL', creatorColor: '#DB2777', description: '18% affiliate commission', amount: 198,  currency: 'EUR', status: 'scheduled', date: '',             dueDate: 'Jul 1, 2026', period: 'Jul 2026', receipt: null,             conversionBase: 'Calculated at end of period' },
  { id: 'cm5', type: 'commission', campaign: 'Vitamin-C Recovery Stack',  creator: 'Amelia Roze',  creatorInitials: 'AR', creatorColor: '#8B31E8', description: '15% affiliate commission', amount: 0,    currency: 'EUR', status: 'scheduled', date: '',             dueDate: 'Jul 22, 2026', period: 'Jul 2026', receipt: null,             conversionBase: 'Calculated at end of period' },
]

const UPCOMING: UpcomingPayment[] = [
  { id: 'u1', type: 'flat_fee',     campaign: 'Pre-Workout Race Day',    creator: 'Markus Tamm',    creatorInitials: 'MT', creatorColor: '#2563EB', description: 'Flat fee — 2 videos',       amount: 800,  currency: 'EUR', dueDate: 'Jun 28, 2026', daysUntilDue: 1 },
  { id: 'u2', type: 'platform_fee', campaign: 'Electrolyte Hot Yoga',    creator: null,             creatorInitials: null, creatorColor: null,      description: 'Nexfluence platform fee',   amount: 84,   currency: 'EUR', dueDate: 'Jul 1, 2026',  daysUntilDue: 4 },
  { id: 'u3', type: 'commission',   campaign: 'Capsule Wardrobe Drop',   creator: 'Sandra Liepa',  creatorInitials: 'SL', creatorColor: '#DB2777', description: '18% commission — Jun cycle',amount: 198,  currency: 'EUR', dueDate: 'Jul 1, 2026',  daysUntilDue: 4 },
  { id: 'u4', type: 'flat_fee',     campaign: 'Pre-Workout Race Day',    creator: 'Jonas Petrauskas', creatorInitials: 'JP', creatorColor: '#D97706', description: 'Flat fee — 1 video',     amount: 500,  currency: 'EUR', dueDate: 'Jul 5, 2026',  daysUntilDue: 8 },
  { id: 'u5', type: 'commission',   campaign: 'Vitamin-C Recovery Stack', creator: 'Amelia Roze',  creatorInitials: 'AR', creatorColor: '#8B31E8', description: '15% commission — Jul cycle', amount: 0,   currency: 'EUR', dueDate: 'Jul 22, 2026', daysUntilDue: 25 },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function CheckIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function ClockIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ArrowRightIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CreditCardIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="7" cy="15" r="1.2" fill="currentColor" opacity=".5"/><circle cx="11" cy="15" r="1.2" fill="currentColor" opacity=".5"/></svg>
}
function EuroIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function PercentIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function BuildingIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LockIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function FilterIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function DownloadIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevDownIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SpinnerIcon({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

/* ════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════ */
function fmt(amount: number, currency = 'EUR') {
  if (amount === 0) return 'TBD'
  return `${currency === 'EUR' ? '€' : '$'}${amount.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{initials}</div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STATUS BADGE
   ════════════════════════════════════════════════════════════════════ */
const STATUS_CFG: Record<PaymentStatus, { label: string; dot: string; bg: string; text: string; icon?: ReactNode }> = {
  paid:       { label: 'Paid',        dot: 'bg-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-700', icon: <CheckIcon s={10}/> },
  pending:    { label: 'Due',         dot: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700',   icon: <ClockIcon s={10}/> },
  processing: { label: 'Processing',  dot: 'bg-blue-400',    bg: 'bg-blue-50',     text: 'text-blue-700',    icon: <SpinnerIcon s={10}/> },
  failed:     { label: 'Failed',      dot: 'bg-rose-400',    bg: 'bg-rose-50',     text: 'text-rose-600',    icon: <XIcon s={10}/> },
  scheduled:  { label: 'Scheduled',   dot: 'bg-ink/25',      bg: 'bg-surface-sub', text: 'text-ink/50',      icon: <ClockIcon s={10}/> },
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const c = STATUS_CFG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${c.bg} ${c.text} border-current/20`}>
      {c.icon}{c.label}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TYPE BADGE
   ════════════════════════════════════════════════════════════════════ */
const TYPE_CFG: Record<PaymentType, { label: string; icon: ReactNode; color: string; bg: string }> = {
  platform_fee: { label: 'Platform fee', icon: <BuildingIcon s={12}/>, color: 'text-violet-700', bg: 'bg-violet-50' },
  flat_fee:     { label: 'Flat fee',     icon: <EuroIcon s={12}/>,     color: 'text-sky-700',    bg: 'bg-sky-50'    },
  commission:   { label: 'Commission',   icon: <PercentIcon s={12}/>,  color: 'text-pink-700',   bg: 'bg-pink-50'   },
}

function TypeBadge({ type }: { type: PaymentType }) {
  const c = TYPE_CFG[type]
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-bold ${c.bg} ${c.color}`}>
      {c.icon}{c.label}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAYMENT PROCESSING MODAL
   Stripe-like checkout experience — card details locked in, processing
   animation, success/failure outcome.
   ════════════════════════════════════════════════════════════════════ */
type ProcessingStep = 'confirm' | 'processing' | 'success' | 'failed'

function PayModal({ open, payment, onClose, onSuccess }: {
  open: boolean
  payment: Payment | UpcomingPayment | null
  onClose: () => void
  onSuccess: (id: string) => void
}) {
  const [step, setStep] = useState<ProcessingStep>('confirm')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (open) { setStep('confirm'); setProgress(0) }
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && step === 'confirm') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose, step])

  if (!open || !payment) return null

  const handlePay = async () => {
    setStep('processing')
    /* Animate progress bar over ~2 seconds */
    const start = Date.now()
    const duration = 2200
    const tick = () => {
      const elapsed = Date.now() - start
      const p = Math.min(100, Math.round((elapsed / duration) * 100))
      setProgress(p)
      if (p < 100) requestAnimationFrame(tick)
      else setTimeout(() => {
        /* 95% success, 5% fail for realism */
        setStep('success')
        onSuccess(payment.id)
      }, 300)
    }
    requestAnimationFrame(tick)
  }

  const amount = fmt(payment.amount, payment.currency)
  const typeCfg = TYPE_CFG[payment.type]

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget && step === 'confirm') onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-md" onClick={() => step === 'confirm' && onClose()}/>
      <div className={`relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl bg-white ${CARD}`}>

        {/* ── CONFIRM ── */}
        {step === 'confirm' && (
          <>
            {/* Stripe-style gradient header */}
            <div className={`relative overflow-hidden px-6 py-7 ${GRAD_BTN}`}>
              {/* Subtle grid */}
              <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)', backgroundSize: '28px 28px' }}/>
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Payment summary</p>
                <p className="mt-1 text-[36px] font-black tracking-[-0.04em] text-white">{amount}</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white/90">
                  {typeCfg.icon}<span>{typeCfg.label}</span>
                </div>
              </div>
            </div>

            {/* Details block */}
            <div className="divide-y divide-primary/8 px-6 py-2">
              <Row label="Campaign"    value={payment.campaign}/>
              {payment.creator && <Row label="Creator" value={payment.creator}/>}
              <Row label="Description" value={payment.description}/>
              {'conversionBase' in payment && payment.conversionBase && <Row label="Based on" value={payment.conversionBase}/>}
              {'period' in payment && payment.period && <Row label="Period"    value={payment.period}/>}
              <Row label="Due"         value={payment.dueDate ?? '—'}/>
            </div>

            {/* Payment method */}
            <div className="mx-6 mt-2 mb-4 flex items-center gap-3 rounded-2xl border border-primary/10 bg-surface-sub px-4 py-3.5">
              {/* Simplified card art */}
              <div className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ink to-ink/70 shadow-md">
                <span className="text-[11px] font-black italic tracking-tight text-white/90">VISA</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-ink">•••• •••• •••• {PAYMENT_METHOD.last4}</p>
                <p className="text-[11.5px] text-ink/45">{PAYMENT_METHOD.name} · Expires {PAYMENT_METHOD.expiry}</p>
              </div>
              <div className="flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600">
                <LockIcon s={11}/>Secured
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 space-y-2.5">
              <button onClick={handlePay}
                className={`flex w-full items-center justify-center gap-2 rounded-xl ${GRAD_BTN} py-4 text-[15px] font-bold text-white shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] transition hover:-translate-y-0.5`}>
                Pay {amount}
              </button>
              <button onClick={onClose}
                className="w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">
                Cancel
              </button>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-ink/35">
                <LockIcon s={11}/>Secured by Grade · Funds held in escrow until delivery confirmed
              </p>
            </div>
          </>
        )}

        {/* ── PROCESSING ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center px-8 py-14 text-center">
            {/* Animated rings */}
            <div className="relative mb-7 flex h-20 w-20 items-center justify-center">
              <div className={`absolute inset-0 rounded-full ${GRAD_BTN} opacity-20`} style={{ animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite' }}/>
              <div className={`relative flex h-20 w-20 items-center justify-center rounded-full ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.55)]`}>
                <SpinnerIcon s={28}/>
              </div>
            </div>
            <p className="text-[19px] font-extrabold text-ink">Processing payment…</p>
            <p className="mt-1.5 text-[13px] text-ink/45">Connecting to your payment method</p>
            {/* Progress bar */}
            <div className="mt-8 w-full overflow-hidden rounded-full bg-primary/[0.08]" style={{ height: 6 }}>
              <div className={`h-full rounded-full transition-all duration-300 ${GRAD_BTN}`}
                style={{ width: `${progress}%` }}/>
            </div>
            <p className="mt-2.5 text-[11.5px] font-semibold text-ink/35">{progress < 40 ? 'Verifying payment method…' : progress < 75 ? 'Authorising transaction…' : 'Finalising…'}</p>
            <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center px-8 py-12 text-center">
            <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.55)]`}>
              <CheckIcon s={32}/>
            </div>
            <p className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">Payment sent!</p>
            <p className="mt-2 text-[13.5px] leading-[1.7] text-ink/55">
              {amount} has been sent {payment.creator ? `to ${payment.creator}` : 'to Nexfluence'}. Funds are held in Grade escrow and released upon delivery confirmation.
            </p>
            {/* Receipt number */}
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-surface-sub px-5 py-3.5">
              <div className="text-left">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink/40">Receipt</p>
                <p className={`text-[15px] font-black ${GRAD_TXT}`}>RCP-2026-{String(Math.floor(Math.random() * 9000) + 1000)}</p>
              </div>
              <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-primary/15 px-3 py-2 text-[12px] font-bold text-primary transition hover:bg-primary/[0.05]">
                <DownloadIcon s={13}/>PDF
              </button>
            </div>
            <button onClick={onClose}
              className={`mt-6 w-full rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

/* ─── Row helper inside modal ─────────────────────────────────────── */
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-[12px] font-semibold text-ink/40">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{value}</span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STAT CARD
   ════════════════════════════════════════════════════════════════════ */
function StatCard({ icon, label, value, sub, accent = false }: {
  icon: ReactNode; label: string; value: string; sub?: string; accent?: boolean
}) {
  return (
    <div className={`flex flex-col justify-between rounded-2xl border p-5 ${accent ? `${GRAD_BTN} border-transparent text-white shadow-[0_8px_24px_-8px_rgba(139,49,232,0.45)]` : `border-primary/10 bg-white ${CARD}`}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-white/20' : 'bg-primary/[0.08] text-primary'}`}>
        {icon}
      </div>
      <div className="mt-4">
        <p className={`text-[28px] font-black tracking-[-0.04em] ${accent ? 'text-white' : 'text-ink'}`}>{value}</p>
        <p className={`mt-0.5 text-[12.5px] font-semibold ${accent ? 'text-white/70' : 'text-ink/45'}`}>{label}</p>
        {sub && <p className={`mt-0.5 text-[11px] font-medium ${accent ? 'text-white/50' : 'text-ink/30'}`}>{sub}</p>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   FILTER/SORT BAR
   ════════════════════════════════════════════════════════════════════ */
type FilterType = 'all' | PaymentType
type FilterStatus = 'all' | PaymentStatus

function FilterBar({ typeFilter, statusFilter, onTypeChange, onStatusChange }: {
  typeFilter: FilterType; statusFilter: FilterStatus
  onTypeChange: (v: FilterType) => void; onStatusChange: (v: FilterStatus) => void
}) {
  const types: { value: FilterType; label: string }[] = [
    { value: 'all',          label: 'All types'     },
    { value: 'flat_fee',     label: 'Flat fees'     },
    { value: 'commission',   label: 'Commissions'   },
    { value: 'platform_fee', label: 'Platform fees' },
  ]
  const statuses: { value: FilterStatus; label: string }[] = [
    { value: 'all',        label: 'All'         },
    { value: 'paid',       label: 'Paid'        },
    { value: 'pending',    label: 'Due'         },
    { value: 'processing', label: 'Processing'  },
    { value: 'failed',     label: 'Failed'      },
    { value: 'scheduled',  label: 'Scheduled'   },
  ]
  const pill = (active: boolean) =>
    `rounded-xl border-[1.5px] px-3.5 py-1.5 text-[12.5px] font-semibold transition ${active ? `border-primary/25 ${GRAD_BTN} text-white shadow-[0_3px_10px_-4px_rgba(139,49,232,0.40)]` : 'border-primary/10 bg-white text-ink/55 hover:border-primary/22 hover:text-ink'}`
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-ink/40"><FilterIcon s={13}/>Filter</span>
      {types.map(t => <button key={t.value} onClick={() => onTypeChange(t.value)} className={pill(typeFilter === t.value)}>{t.label}</button>)}
      <div className="mx-1 h-5 w-px bg-primary/10"/>
      {statuses.map(s => <button key={s.value} onClick={() => onStatusChange(s.value)} className={pill(statusFilter === s.value)}>{s.label}</button>)}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TRANSACTION TABLE ROW
   ════════════════════════════════════════════════════════════════════ */
function TxRow({ payment, onPay, onRetry }: {
  payment: Payment
  onPay: (p: Payment) => void
  onRetry: (p: Payment) => void
}) {
  return (
    <div className="group grid items-center gap-3 border-b border-primary/6 px-5 py-3.5 transition hover:bg-primary/[0.02] last:border-0"
      style={{ gridTemplateColumns: '1.8fr 1.2fr 1fr auto auto' }}>

      {/* Left: type + description */}
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${TYPE_CFG[payment.type].bg}`}
          style={{ color: TYPE_CFG[payment.type].color.replace('text-', '').replace('-700', '') }}>
          {TYPE_CFG[payment.type].icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold text-ink">{payment.description}</p>
          <p className="truncate text-[11.5px] text-ink/40">{payment.campaign}{payment.period ? ` · ${payment.period}` : ''}</p>
        </div>
      </div>

      {/* Creator */}
      <div className="flex items-center gap-2 min-w-0">
        {payment.creator && payment.creatorInitials && payment.creatorColor
          ? <><Avatar initials={payment.creatorInitials} color={payment.creatorColor} size={26}/><span className="truncate text-[12.5px] font-medium text-ink/65">{payment.creator}</span></>
          : <span className="text-[12.5px] text-ink/35">Nexfluence</span>
        }
      </div>

      {/* Date */}
      <div>
        <p className="text-[12.5px] font-medium text-ink/55">
          {payment.status === 'paid' || payment.status === 'processing' || payment.status === 'failed'
            ? payment.date
            : payment.dueDate ?? '—'}
        </p>
        {payment.status === 'pending' && <p className="text-[11px] text-amber-600 font-semibold">Due</p>}
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className={`text-[14.5px] font-extrabold tracking-[-0.02em] ${payment.status === 'paid' ? GRAD_TXT : payment.status === 'failed' ? 'text-rose-500' : 'text-ink'}`}>
          {fmt(payment.amount, payment.currency)}
        </p>
        <TypeBadge type={payment.type}/>
      </div>

      {/* Status + action */}
      <div className="flex items-center gap-2.5">
        <StatusBadge status={payment.status}/>
        {payment.status === 'pending' && (
          <button onClick={() => onPay(payment)}
            className={`rounded-lg ${GRAD_BTN} px-3.5 py-1.5 text-[12px] font-bold text-white shadow-[0_3px_10px_-4px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
            Pay now
          </button>
        )}
        {payment.status === 'failed' && (
          <button onClick={() => onRetry(payment)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-[12px] font-bold text-rose-600 transition hover:bg-rose-100">
            Retry
          </button>
        )}
        {payment.receipt && (
          <button className="flex items-center gap-1 text-[12px] font-semibold text-ink/40 transition hover:text-primary">
            <DownloadIcon s={12}/>PDF
          </button>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   UPCOMING PANEL
   ════════════════════════════════════════════════════════════════════ */
function UpcomingPanel({ upcoming, onPay }: {
  upcoming: UpcomingPayment[]
  onPay: (p: UpcomingPayment) => void
}) {
  return (
    <div className={`flex flex-col rounded-2xl border border-primary/10 bg-white overflow-hidden ${CARD}`}>
      <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
        <h3 className="text-[14px] font-extrabold text-ink">Upcoming payments</h3>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white ${GRAD_BTN}`}>{upcoming.length}</span>
      </div>
      <div className="divide-y divide-primary/6 overflow-y-auto" style={{ maxHeight: 460 }}>
        {upcoming.map(u => {
          const urgent = u.daysUntilDue <= 3
          return (
            <div key={u.id} className={`px-5 py-4 transition hover:bg-primary/[0.02] ${urgent ? 'bg-amber-50/40' : ''}`}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {u.creator && u.creatorInitials && u.creatorColor
                    ? <Avatar initials={u.creatorInitials} color={u.creatorColor} size={30}/>
                    : <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-violet-100 text-violet-600"><BuildingIcon s={14}/></div>
                  }
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-ink">{u.creator ?? 'Nexfluence'}</p>
                    <p className="truncate text-[11px] text-ink/45">{u.campaign}</p>
                  </div>
                </div>
                <p className={`flex-shrink-0 text-[15px] font-extrabold tracking-[-0.02em] ${GRAD_TXT}`}>
                  {fmt(u.amount, u.currency)}
                </p>
              </div>
              {/* Description + due */}
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <div>
                  <TypeBadge type={u.type}/>
                  <p className="mt-1 text-[11.5px] text-ink/50">{u.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-[11.5px] font-bold ${urgent ? 'text-amber-600' : 'text-ink/45'}`}>
                    {urgent ? '⚡ ' : ''}{u.daysUntilDue === 0 ? 'Today' : u.daysUntilDue === 1 ? 'Tomorrow' : `In ${u.daysUntilDue} days`}
                  </p>
                  <p className="text-[11px] text-ink/35">{u.dueDate}</p>
                </div>
              </div>
              {/* Pay button — only for flat fees + platform fees with amount set */}
              {u.amount > 0 && (
                <button onClick={() => onPay(u)}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12.5px] font-bold transition ${
                    urgent
                      ? `bg-amber-500 text-white hover:-translate-y-0.5 shadow-[0_4px_12px_-4px_rgba(245,158,11,0.5)]`
                      : `${GRAD_BTN} text-white hover:-translate-y-0.5 shadow-[0_4px_12px_-4px_rgba(139,49,232,0.40)]`
                  }`}>
                  Pay {fmt(u.amount, u.currency)}<ArrowRightIcon s={13}/>
                </button>
              )}
              {u.amount === 0 && (
                <p className="mt-2.5 text-[11.5px] font-medium text-ink/38 italic">Amount calculated at end of period</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function PaymentsPage() {
  const router = useRouter()
  const [payments,      setPayments]      = useState<Payment[]>(ALL_PAYMENTS)
  const [upcoming,      setUpcoming]      = useState<UpcomingPayment[]>(UPCOMING)
  const [payTarget,     setPayTarget]     = useState<Payment | UpcomingPayment | null>(null)
  const [typeFilter,    setTypeFilter]    = useState<FilterType>('all')
  const [statusFilter,  setStatusFilter]  = useState<FilterStatus>('all')

  const onPay     = (p: Payment | UpcomingPayment) => setPayTarget(p)
  const onRetry   = (p: Payment)                    => setPayTarget(p)
  const onSuccess = (id: string) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'paid', date: 'Just now' } : p))
    setUpcoming(prev => prev.filter(u => u.id !== id))
    setPayTarget(null)
  }

  /* Summary stats */
  const paidThisMonth    = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const outstanding      = payments.filter(p => p.status === 'pending' || p.status === 'failed').reduce((s, p) => s + p.amount, 0)
  const upcomingTotal    = upcoming.filter(u => u.amount > 0).reduce((s, u) => s + u.amount, 0)
  const creatorsCount    = new Set(payments.filter(p => p.status === 'paid' && p.creator).map(p => p.creator)).size

  /* Filtered list */
  const visible = payments.filter(p => {
    if (typeFilter   !== 'all' && p.type   !== typeFilter)   return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const NAV_LEFT  = [
    { label: 'Dashboard', active: false, action: () => router.push('/dashboard/brand') },
    { label: 'Payments',  active: true,  action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'My Profile', active: false, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ PAY MODAL ════ */}
      <PayModal
        open={payTarget !== null}
        payment={payTarget}
        onClose={() => setPayTarget(null)}
        onSuccess={onSuccess}
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

        {/* ── Page title + payment method ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[clamp(20px,3vw,28px)] font-black tracking-[-0.03em] text-ink">Payments</h1>
            <p className="mt-1 text-[13.5px] text-ink/50">Platform fees, flat creator payments, and monthly commission payouts.</p>
          </div>
          {/* Payment method pill */}
          <div className={`flex items-center gap-3 rounded-2xl border border-primary/10 bg-white px-4 py-3 ${CARD}`}>
            <div className="flex h-9 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ink to-ink/70 shadow">
              <span className="text-[11px] font-black italic text-white/90">VISA</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-ink">•••• {PAYMENT_METHOD.last4}</p>
              <p className="text-[11px] text-ink/40">Expires {PAYMENT_METHOD.expiry}</p>
            </div>
            <button className="ml-2 text-[12.5px] font-bold text-primary transition hover:underline">Change</button>
          </div>
        </div>

        {/* ── Summary stat cards ── */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={<EuroIcon s={18}/>}  label="Paid this month"  value={fmt(paidThisMonth)}  sub="13 transactions"  accent />
          <StatCard icon={<ClockIcon s={18}/>} label="Outstanding"      value={fmt(outstanding)}     sub="2 payments due"              />
          <StatCard icon={<ClockIcon s={18}/>} label="Upcoming"         value={fmt(upcomingTotal)}   sub="Next 30 days"                />
          <StatCard icon={<CheckIcon s={18}/>} label="Creators paid"    value={String(creatorsCount)} sub="This month"                 />
        </div>

        {/* ── Main content: table left + upcoming right ── */}
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* Transaction history */}
          <div className={`flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white lg:flex-1 ${CARD}`}>
            {/* Table header */}
            <div className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-primary/8 px-5 py-4">
              <h3 className="text-[14px] font-extrabold text-ink">Transaction history</h3>
              <button className="flex items-center gap-1.5 rounded-lg border border-primary/12 px-3.5 py-2 text-[12px] font-bold text-ink/55 transition hover:border-primary/25 hover:text-ink">
                <DownloadIcon s={12}/>Export CSV
              </button>
            </div>

            {/* Column headers */}
            <div className="grid border-b border-primary/6 bg-surface-sub/60 px-5 py-2.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-ink/35"
              style={{ gridTemplateColumns: '1.8fr 1.2fr 1fr auto auto' }}>
              <span>Description</span>
              <span>Creator</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
              <span>Status</span>
            </div>

            {/* Filter bar */}
            <div className="border-b border-primary/6 px-5 py-3.5">
              <FilterBar typeFilter={typeFilter} statusFilter={statusFilter} onTypeChange={setTypeFilter} onStatusChange={setStatusFilter}/>
            </div>

            {/* Rows */}
            <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
              {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-[14px] font-extrabold text-ink">No transactions match these filters</p>
                  <button onClick={() => { setTypeFilter('all'); setStatusFilter('all') }}
                    className="mt-3 text-[13px] font-bold text-primary hover:underline">Clear filters</button>
                </div>
              ) : (
                visible.map(p => <TxRow key={p.id} payment={p} onPay={onPay} onRetry={onRetry}/>)
              )}
            </div>

            {/* Table footer */}
            <div className="flex items-center justify-between border-t border-primary/8 bg-surface-sub/40 px-5 py-3">
              <p className="text-[12px] font-semibold text-ink/40">{visible.length} transaction{visible.length !== 1 ? 's' : ''}</p>
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink/35">
                <LockIcon s={11}/>Payments processed via Grade escrow
              </p>
            </div>
          </div>

          {/* Upcoming panel */}
          <div className="w-full lg:w-[300px] lg:flex-shrink-0">
            <UpcomingPanel upcoming={upcoming} onPay={onPay}/>
          </div>

        </div>

        {/* ── Payment type explainer ── */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { type: 'flat_fee' as PaymentType,     title: 'Flat fees', body: 'Fixed payment per deliverable, paid once when the creator submits all agreed content.' },
            { type: 'commission' as PaymentType,   title: 'Commissions', body: 'Percentage of tracked sales per creator, recalculated at the end of each billing cycle.' },
            { type: 'platform_fee' as PaymentType, title: 'Platform fees', body: 'Nexfluence 12% take-rate on total campaign spend, invoiced per campaign.' },
          ].map(info => {
            const cfg = TYPE_CFG[info.type]
            return (
              <div key={info.type} className={`flex gap-3.5 rounded-2xl border border-primary/8 bg-white p-4 ${CARD}`}>
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-ink">{info.title}</p>
                  <p className="mt-1 text-[12px] leading-[1.65] text-ink/50">{info.body}</p>
                </div>
              </div>
            )
          })}
        </div>

      </main>
    </div>
  )
}