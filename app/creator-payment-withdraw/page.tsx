'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Creator Payments — app/creator/payments/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   Balance overview · withdrawal flow (3-step modal) · bank account
   management · full transaction history with filter tabs.

   Powered by Grade (YC W26) escrow — all creator payouts are
   consolidated into one invoice per billing period. DAC7 compliance
   handled automatically by Grade for Nexfluence SIA (Latvian operator).

   KYC gate: if kycVerified = false, withdrawal CTA is blocked and a
   verification banner is shown. Toggle MOCK_KYC_VERIFIED to preview.

   Header: creator dashboard pattern — NexLogo pill centred,
   left nav (Dashboard, Payments), right nav (Bell + badge, My Profile).
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP       = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

/* ── Toggle this to preview the KYC-unverified state ── */
const MOCK_KYC_VERIFIED = true

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type TxType   = 'received' | 'pending' | 'withdrawal'
type TxStatus = 'completed' | 'processing' | 'in_escrow' | 'failed'
type FilterTab = 'all' | 'received' | 'pending' | 'withdrawals'

interface Transaction {
  id:          string
  type:        TxType
  status:      TxStatus
  amount:      number          /* always positive; sign implied by type */
  description: string          /* e.g. "Kinetics · Race Day campaign"  */
  detail:      string          /* e.g. "Commission payment"             */
  date:        string
  expectedDate?: string        /* for pending escrow                    */
  bankAccount?: string         /* for withdrawals                        */
  ref:         string
}

interface BankAccount {
  id:          string
  bankName:    string
  ibanLast4:   string
  ibanFull:    string          /* shown only in confirmation             */
  holderName:  string
  isDefault:   boolean
}

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA
   ════════════════════════════════════════════════════════════════════ */
const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'ba1', bankName: 'Luminor Latvia',  ibanLast4: '4521', ibanFull: 'LV31NDEA0000084194521', holderName: 'Amelia Roze', isDefault: true  },
  { id: 'ba2', bankName: 'SEB Sweden',      ibanLast4: '7788', ibanFull: 'SE3550000000054400788', holderName: 'Amelia Roze', isDefault: false },
]

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', type: 'withdrawal', status: 'completed',  amount: 840,  description: 'Withdrawal to Luminor Latvia',       detail: '···4521 · Processed by Grade',           date: 'Jun 20, 2026', ref: 'WD-2026-0441' },
  { id: 't2', type: 'received',   status: 'completed',  amount: 420,  description: 'Kinetics',                            detail: 'Pre-Workout Race Day · Flat fee',        date: 'Jun 18, 2026', ref: 'PAY-2026-0438' },
  { id: 't3', type: 'received',   status: 'completed',  amount: 240,  description: 'Vāre Coffee',                         detail: 'New Roast Reveal · Commission payout',  date: 'Jun 15, 2026', ref: 'PAY-2026-0431' },
  { id: 't4', type: 'received',   status: 'completed',  amount: 180,  description: 'Lumora Skincare',                     detail: 'Morning Ritual · Commission payout',    date: 'Jun 14, 2026', ref: 'PAY-2026-0428' },
  { id: 't5', type: 'received',   status: 'completed',  amount: 600,  description: 'Grade Consolidated Payout',           detail: 'Billing period May 16 – Jun 13',        date: 'Jun 13, 2026', ref: 'PAY-2026-0420' },
  { id: 't6', type: 'pending',    status: 'in_escrow',  amount: 380,  description: 'Forma Fit',                           detail: 'Training Block Q3 · Awaiting approval', date: 'Jun 10, 2026', expectedDate: 'Jul 18, 2026', ref: 'ESC-2026-0411' },
  { id: 't7', type: 'pending',    status: 'in_escrow',  amount: 240,  description: 'Amber Wellness',                      detail: 'Adaptogen Sleep Stack · In escrow',     date: 'Jun 8, 2026',  expectedDate: 'Jul 25, 2026', ref: 'ESC-2026-0408' },
  { id: 't8', type: 'withdrawal', status: 'completed',  amount: 600,  description: 'Withdrawal to Luminor Latvia',       detail: '···4521 · Processed by Grade',           date: 'May 28, 2026', ref: 'WD-2026-0398' },
  { id: 't9', type: 'received',   status: 'completed',  amount: 350,  description: 'Glossé',                              detail: 'Lip Care Q2 · Flat fee',                date: 'May 25, 2026', ref: 'PAY-2026-0394' },
]

const AVAILABLE_BALANCE = 1440
const PENDING_BALANCE   = 620
const LIFETIME_EARNED   = 4280

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function BellIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChatBubbleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CheckIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function ArrowDownIcon({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 4v16M5 15l7 7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ArrowUpIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 20V4M5 9l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ClockIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BankIcon({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function PlusIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function TrashIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ShieldCheckIcon({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function AlertIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function StarIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z"/></svg>
}
function LockIcon({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function RefreshIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function EuroIcon({ s = 24 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function InfoIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════ */
function fmt(n: number): string {
  return `€${n.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function generateRef(): string {
  return `WD-2026-${String(Math.floor(Math.random() * 900) + 500)}`
}

/* ════════════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════════════ */
function Toast({ visible, message }: { visible: boolean; message: string }) {
  return (
    <div className={`fixed bottom-6 left-1/2 z-[800] -translate-x-1/2 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
      <div className={`flex items-center gap-3 rounded-2xl ${GRAD_BTN} px-5 py-3.5 shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]`}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white"><CheckIcon s={13}/></span>
        <p className="text-[13.5px] font-bold text-white">{message}</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   KYC VERIFICATION BANNER
   Shown when kycVerified = false — blocks all withdrawal actions.
   ════════════════════════════════════════════════════════════════════ */
function KycBanner({ onVerify }: { onVerify: () => void }) {
  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-amber-300 bg-amber-50 ${CARD}`}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <LockIcon s={22}/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] font-extrabold text-amber-900">Verify your identity to unlock withdrawals</p>
          <p className="mt-1 text-[13px] leading-[1.6] text-amber-700">
            EU regulations (DAC7) require identity verification before any payout. This takes under 3 minutes — you'll only need to do it once. Your data is handled securely by Grade.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11.5px] font-semibold text-amber-600">
            <span className="flex items-center gap-1"><CheckIcon s={11}/>Government-issued ID</span>
            <span className="flex items-center gap-1"><CheckIcon s={11}/>Takes ~3 minutes</span>
            <span className="flex items-center gap-1"><CheckIcon s={11}/>One-time only</span>
          </div>
        </div>
        <button onClick={onVerify}
          className="flex-shrink-0 rounded-xl bg-amber-500 px-5 py-3 text-[13.5px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-amber-600 shadow-[0_4px_14px_-4px_rgba(217,119,6,0.5)]">
          Verify identity
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   WITHDRAWAL MODAL — 3-step flow
   Step 1: amount + account
   Step 2: review + confirm
   Step 3: success
   ════════════════════════════════════════════════════════════════════ */
function WithdrawalModal({ open, available, accounts, onClose, onConfirm }: {
  open:      boolean
  available: number
  accounts:  BankAccount[]
  onClose:   () => void
  onConfirm: (amount: number, accountId: string, ref: string) => void
}) {
  const [step,         setStep]         = useState<1 | 2 | 3>(1)
  const [amountStr,    setAmountStr]    = useState(String(available))
  const [accountId,    setAccountId]    = useState(accounts.find(a => a.isDefault)?.id ?? accounts[0]?.id ?? '')
  const [submitting,   setSubmitting]   = useState(false)
  const [withdrawalRef, setWithdrawalRef] = useState('')

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

  const amount       = parseFloat(amountStr) || 0
  const amountValid  = amount > 0 && amount <= available
  const selectedAcct = accounts.find(a => a.id === accountId)

  const arrivalDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 4)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  })()

  const handleConfirm = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 900))
    const ref = generateRef()
    setWithdrawalRef(ref)
    setStep(3)
    setSubmitting(false)
    onConfirm(amount, accountId, ref)
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget && step !== 3) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => step !== 3 && onClose()}/>
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}
        style={{ maxHeight: 'min(92vh, 640px)' }}>

        {/* Drag handle — mobile */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>

        {/* ── STEP 1: Amount + account ── */}
        {step === 1 && (
          <>
            <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
              <div>
                <h3 className="text-[16px] font-extrabold text-ink">Withdraw funds</h3>
                <p className="text-[11.5px] text-ink/45">{fmt(available)} available · processed via Grade</p>
              </div>
              <button onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10">
                <XIcon s={13}/>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {/* Amount input */}
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Amount to withdraw *</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-extrabold text-ink/40">€</span>
                  <input
                    type="number" min={1} max={available} step={0.01}
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    className={`${INP} pl-9 text-[18px] font-extrabold ${amountStr && !amountValid ? 'border-rose-300' : ''}`}
                  />
                  <button onClick={() => setAmountStr(String(available))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg bg-primary/[0.08] px-2.5 py-1 text-[11.5px] font-bold text-primary transition hover:bg-primary/[0.14]">
                    Max
                  </button>
                </div>
                {amountStr && !amountValid && (
                  <p className="mt-1.5 text-[12px] font-semibold text-rose-600">
                    {amount > available ? `Maximum available is ${fmt(available)}` : 'Enter a valid amount'}
                  </p>
                )}
                {/* Quick amount pills */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[available, Math.floor(available * 0.5), 500, 250].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i).slice(0, 4).map(v => (
                    <button key={v} onClick={() => setAmountStr(String(v))}
                      className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-bold transition ${amountStr === String(v) ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
                      {v === available ? 'All · ' : ''}{fmt(v)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank account selector */}
              <div>
                <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Withdraw to *</label>
                <div className="space-y-2">
                  {accounts.map(acct => (
                    <button key={acct.id} onClick={() => setAccountId(acct.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition ${accountId === acct.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${accountId === acct.id ? GRAD_BTN + ' text-white' : 'bg-surface-sub text-ink/50'}`}>
                        <BankIcon s={16}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13.5px] font-bold text-ink">{acct.bankName}</p>
                          {acct.isDefault && <span className="rounded-full bg-primary/[0.08] px-2 py-0.5 text-[10px] font-bold text-primary">Default</span>}
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

              {/* Processing note */}
              <div className="flex items-start gap-3 rounded-xl bg-surface-sub px-4 py-3.5">
                <InfoIcon s={15}/>
                <div className="text-[12px] text-ink/55 leading-[1.65]">
                  <span className="font-bold text-ink">Processing time:</span> 3–5 business days. Payouts are batched and processed by <span className="font-semibold text-ink">Grade</span> — your trusted escrow provider. Grade handles DAC7 tax reporting automatically.
                </div>
              </div>
            </div>

            <div className="border-t border-primary/10 px-6 py-4 flex gap-2.5">
              <button onClick={onClose}
                className="flex-1 rounded-xl border border-primary/15 bg-white py-3.5 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">
                Cancel
              </button>
              <button onClick={() => setStep(2)} disabled={!amountValid || !accountId}
                className={`flex-[2] rounded-xl py-3.5 text-[14px] font-bold text-white transition ${amountValid && accountId ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                Review withdrawal
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Review + confirm ── */}
        {step === 2 && (
          <>
            <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-ink/50 transition hover:text-ink">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>
              <h3 className="text-[15px] font-extrabold text-ink">Confirm withdrawal</h3>
              <div className="w-12"/>
            </div>

            <div className="px-6 py-6 space-y-5">
              {/* Summary card */}
              <div className={`overflow-hidden rounded-2xl border border-primary/15 bg-white ${CARD}`}>
                {/* Amount hero */}
                <div className={`flex flex-col items-center justify-center py-7 ${GRAD_BTN}`}>
                  <p className="text-[13px] font-semibold text-white/70">You're withdrawing</p>
                  <p className="mt-1 text-[40px] font-black tracking-[-0.04em] text-white">{fmt(amount)}</p>
                </div>

                {/* Detail rows */}
                <div className="divide-y divide-primary/8 px-5 py-1">
                  {[
                    { label: 'To account',       value: `${selectedAcct?.bankName} · ···${selectedAcct?.ibanLast4}` },
                    { label: 'Account holder',   value: selectedAcct?.holderName ?? '' },
                    { label: 'Estimated arrival',value: arrivalDate },
                    { label: 'Processed by',     value: 'Grade (YC W26) · secure escrow' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                      <span className="text-[12px] font-semibold text-ink/40">{row.label}</span>
                      <span className="text-right text-[13px] font-semibold text-ink">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[12px] text-center text-ink/40 leading-[1.65]">
                By confirming, you authorise Nexfluence and Grade to transfer {fmt(amount)} from your Creator Nexus balance to the account shown above.
              </p>
            </div>

            <div className="border-t border-primary/10 px-6 py-4">
              <button onClick={handleConfirm} disabled={submitting}
                className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-[15px] font-bold text-white transition ${!submitting ? `${GRAD_BTN} shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/15 text-ink/30'}`}>
                {submitting
                  ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60"/>Processing…</>
                  : <><ArrowDownIcon s={18}/>Confirm withdrawal · {fmt(amount)}</>
                }
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 3 && (
          <div className="flex flex-col items-center px-7 py-10 text-center">
            <div className={`mb-5 flex h-18 w-18 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]`}
              style={{ width: 72, height: 72 }}>
              <CheckIcon s={28}/>
            </div>
            <h3 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">Withdrawal initiated!</h3>
            <p className="mt-2.5 max-w-[320px] text-[13.5px] leading-[1.7] text-ink/55">
              <span className="font-bold text-ink">{fmt(amount)}</span> is on its way to{' '}
              <span className="font-bold text-ink">{selectedAcct?.bankName}</span>. Funds typically arrive within 3–5 business days.
            </p>
            {/* Reference */}
            <div className={`mt-5 flex items-center gap-3 rounded-xl border border-primary/12 bg-surface-sub px-5 py-3.5 ${CARD}`}>
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${GRAD_BTN} text-white text-[11px] font-black`}>
                REF
              </div>
              <div className="text-left">
                <p className="text-[10.5px] font-semibold text-ink/40">Reference number</p>
                <p className={`text-[15px] font-extrabold tracking-[-0.01em] ${GRAD_TEXT}`}>{withdrawalRef}</p>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] text-ink/35">Keep this reference for your records. Grade will send a confirmation to your email.</p>
            <button onClick={onClose}
              className={`mt-6 rounded-xl ${GRAD_BTN} px-8 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ADD BANK ACCOUNT MODAL
   ════════════════════════════════════════════════════════════════════ */
function AddBankModal({ open, onClose, onAdd }: {
  open:    boolean
  onClose: () => void
  onAdd:   (acct: Omit<BankAccount, 'id'>) => void
}) {
  const [bankName,    setBankName]    = useState('')
  const [iban,        setIban]        = useState('')
  const [holderName,  setHolderName]  = useState('')
  const [isDefault,   setIsDefault]   = useState(false)
  const [saving,      setSaving]      = useState(false)

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
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    onAdd({
      bankName:   bankName.trim(),
      ibanFull:   ibanClean,
      ibanLast4:  ibanClean.slice(-4),
      holderName: holderName.trim(),
      isDefault,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[460px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
          <div>
            <h3 className="text-[16px] font-extrabold text-ink">Add bank account</h3>
            <p className="text-[11.5px] text-ink/45">Securely stored and verified via Grade</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10"><XIcon s={13}/></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Bank name *</label>
            <input className={INP} value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Luminor, SEB, Swedbank, Revolut"/>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-ink/50">IBAN *</label>
            <input className={INP} value={iban} onChange={e => setIban(e.target.value)}
              placeholder="e.g. LV31NDEA0000084194521"
              style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}/>
            {iban && !ibanValid && <p className="mt-1.5 text-[12px] font-semibold text-rose-600">IBAN must be 15–34 characters</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Account holder name *</label>
            <input className={INP} value={holderName} onChange={e => setHolderName(e.target.value)} placeholder="As it appears on your bank account"/>
          </div>
          <button onClick={() => setIsDefault(d => !d)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.04]">
            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${isDefault ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white'}`}>
              {isDefault && <CheckIcon s={10}/>}
            </span>
            Set as default withdrawal account
          </button>
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
            <ShieldCheckIcon s={16}/>
            <p className="text-[12px] text-emerald-700 leading-[1.6]">Your IBAN is encrypted and stored securely by Grade. Nexfluence never stores raw bank details.</p>
          </div>
        </div>

        <div className="border-t border-primary/10 px-6 py-4 flex gap-2.5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub">Cancel</button>
          <button onClick={handleSave} disabled={!canSave || saving}
            className={`flex-[2] flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${canSave && !saving ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            {saving ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Saving…</> : <><CheckIcon s={13}/>Save account</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   TRANSACTION ROW
   ════════════════════════════════════════════════════════════════════ */
const TX_TYPE_CFG: Record<TxType, { icon: ReactNode; sign: string; amountCls: string; bg: string }> = {
  received:   { icon: <ArrowDownIcon s={14}/>, sign: '+',  amountCls: 'text-emerald-700', bg: 'bg-emerald-50 text-emerald-600' },
  pending:    { icon: <ClockIcon s={14}/>,     sign: '+',  amountCls: 'text-amber-700',   bg: 'bg-amber-50 text-amber-600'   },
  withdrawal: { icon: <ArrowUpIcon s={14}/>,   sign: '−',  amountCls: 'text-ink/70',      bg: 'bg-surface-sub text-ink/50'   },
}

const TX_STATUS_CFG: Record<TxStatus, { label: string; bg: string; text: string; dot: string }> = {
  completed:  { label: 'Completed',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  processing: { label: 'Processing',  bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400'     },
  in_escrow:  { label: 'In escrow',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  failed:     { label: 'Failed',      bg: 'bg-rose-50',    text: 'text-rose-600',    dot: 'bg-rose-400'    },
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const tc = TX_TYPE_CFG[tx.type]
  const sc = TX_STATUS_CFG[tx.status]
  return (
    <div className="flex items-center gap-3 border-b border-primary/6 px-5 py-4 last:border-0 transition hover:bg-surface-sub/40">
      {/* Type icon */}
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${tc.bg}`}>
        {tc.icon}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-[13.5px] font-semibold text-ink">{tx.description}</p>
        <p className="text-[11.5px] text-ink/40">{tx.detail}</p>
        {tx.expectedDate && (
          <p className="mt-0.5 text-[11px] font-semibold text-amber-600">Expected {tx.expectedDate}</p>
        )}
      </div>

      {/* Status */}
      <span className={`hidden flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold sm:flex ${sc.bg} ${sc.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
      </span>

      {/* Date */}
      <span className="hidden flex-shrink-0 text-[11.5px] text-ink/35 sm:block">{tx.date}</span>

      {/* Amount */}
      <span className={`flex-shrink-0 text-[14px] font-extrabold tabular-nums ${tc.amountCls}`}>
        {tc.sign}{fmt(tx.amount)}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function CreatorPaymentsPage() {
  const router = useRouter()

  const [kycVerified,      setKycVerified]      = useState(MOCK_KYC_VERIFIED)
  const [availBal,         setAvailBal]         = useState(AVAILABLE_BALANCE)
  const [pendingBal]                            = useState(PENDING_BALANCE)
  const [lifetimeBal]                           = useState(LIFETIME_EARNED)
  const [transactions,     setTransactions]     = useState<Transaction[]>(INITIAL_TRANSACTIONS)
  const [bankAccounts,     setBankAccounts]     = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS)

  const [filter,           setFilter]           = useState<FilterTab>('all')
  const [withdrawOpen,     setWithdrawOpen]     = useState(false)
  const [addBankOpen,      setAddBankOpen]      = useState(false)
  const [deletingId,       setDeletingId]       = useState<string | null>(null)
  const [toastVisible,     setToastVisible]     = useState(false)
  const [toastMsg,         setToastMsg]         = useState('')

  const UNREAD_NOTIFS = 2

  const showToast = (msg: string) => {
    setToastMsg(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const handleWithdrawConfirm = (amount: number, accountId: string, ref: string) => {
    const acct = bankAccounts.find(a => a.id === accountId)
    const newTx: Transaction = {
      id:          `t${Date.now()}`,
      type:        'withdrawal',
      status:      'processing',
      amount,
      description: `Withdrawal to ${acct?.bankName ?? 'bank'}`,
      detail:      `···${acct?.ibanLast4} · Processing via Grade`,
      date:        'Just now',
      ref,
    }
    setTransactions(prev => [newTx, ...prev])
    setAvailBal(prev => prev - amount)
    showToast(`${fmt(amount)} withdrawal initiated · arrives in 3–5 business days`)
  }

  const handleAddBank = (acct: Omit<BankAccount, 'id'>) => {
    const newAcct: BankAccount = { ...acct, id: `ba${Date.now()}` }
    setBankAccounts(prev => {
      const updated = acct.isDefault ? prev.map(a => ({ ...a, isDefault: false })) : prev
      return [...updated, newAcct]
    })
    showToast(`${acct.bankName} added as a withdrawal account`)
  }

  const handleSetDefault = (id: string) => {
    setBankAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
  }

  const handleDeleteBank = (id: string) => {
    setBankAccounts(prev => prev.filter(a => a.id !== id))
    setDeletingId(null)
    showToast('Bank account removed')
  }

  /* Filtered transactions */
  const filtered = transactions.filter(tx => {
    if (filter === 'received')    return tx.type === 'received'
    if (filter === 'pending')     return tx.type === 'pending'
    if (filter === 'withdrawals') return tx.type === 'withdrawal'
    return true
  })

  /* Nav */
  const NAV_LEFT = [
    { label: 'Dashboard', active: false, action: () => router.push('/dashboard/creator') },
    { label: 'Payments',  active: true,  action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ MODALS ════ */}
      <Toast visible={toastVisible} message={toastMsg}/>
      <WithdrawalModal
        open={withdrawOpen} available={availBal} accounts={bankAccounts}
        onClose={() => setWithdrawOpen(false)} onConfirm={handleWithdrawConfirm}
      />
      <AddBankModal open={addBankOpen} onClose={() => setAddBankOpen(false)} onAdd={handleAddBank}/>

      {/* ════ HEADER — creator dashboard pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg,rgba(139,49,232,0.05) 0%,rgba(139,49,232,0.05) 30%,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 58%,rgba(139,49,232,0.05) 70%,rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            <div className="relative z-10 flex items-center gap-1.5">
              <button onClick={() => router.push('/creator/messages')}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <ChatBubbleIcon s={18}/>
              </button>
              <button title="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <BellIcon s={18}/>
                {UNREAD_NOTIFS > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>
                    {UNREAD_NOTIFS}
                  </span>
                )}
              </button>
              <button onClick={() => router.push('/creator/profile')}
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

        {/* ════ KYC GATE — shown when not verified ════ */}
        {!kycVerified && (
          <div className="mb-6">
            <KycBanner onVerify={() => setKycVerified(true)}/>
          </div>
        )}

        {/* ════ BALANCE HERO ════ */}
        <div className={`mb-6 overflow-hidden rounded-2xl ${CARD}`}
          style={{ background: 'linear-gradient(120deg, #8B31E8 0%, #a03be8 40%, #b44af0 70%, #FF33BC 100%)' }}>
          {/* Orbs */}
          {[
            { w: 280, h: 280, top: '-60%', left: '-5%',  op: 0.12, blur: 70 },
            { w: 200, h: 200, top: '-20%', left: '40%',  op: 0.10, blur: 55 },
            { w: 320, h: 320, top: '-70%', left: '65%',  op: 0.14, blur: 80 },
          ].map((o, i) => (
            <div key={i} aria-hidden="true" style={{ position: 'absolute', borderRadius: '50%', width: o.w, height: o.h, top: o.top, left: o.left, background: 'white', opacity: o.op, filter: `blur(${o.blur}px)`, pointerEvents: 'none' }}/>
          ))}
          <div className="relative grid grid-cols-1 gap-6 px-7 py-8 sm:grid-cols-3">
            {/* Available balance */}
            <div className="sm:col-span-2">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/60">Available to withdraw</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-[48px] font-black tracking-[-0.04em] text-white">{fmt(availBal)}</span>
                {kycVerified && (
                  <button
                    onClick={() => setWithdrawOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-[13.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/30">
                    <ArrowUpIcon s={14}/>Withdraw
                  </button>
                )}
              </div>
              {!kycVerified && (
                <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-white/60">
                  <LockIcon s={14}/>Verify identity to unlock withdrawals
                </div>
              )}
            </div>

            {/* Right: pending + lifetime */}
            <div className="flex flex-col justify-center gap-4 sm:items-end sm:text-right">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Pending (in escrow)</p>
                <p className="text-[22px] font-extrabold text-white/80 tracking-[-0.02em]">{fmt(pendingBal)}</p>
                <p className="text-[11px] text-white/45">2 campaigns awaiting approval</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">Lifetime earned</p>
                <p className="text-[22px] font-extrabold text-white/80 tracking-[-0.02em]">{fmt(lifetimeBal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ════ BODY: TRANSACTIONS (2/3) + SIDEBAR (1/3) ════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── LEFT: Transaction history ── */}
          <div className="lg:col-span-2">
            <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
                <h2 className="text-[14.5px] font-extrabold text-ink">Transaction history</h2>
                <button className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink/40 transition hover:text-primary">
                  <RefreshIcon s={13}/>Refresh
                </button>
              </div>

              {/* Filter tabs */}
              <div className="flex border-b border-primary/8 px-2">
                {([
                  { id: 'all' as FilterTab,         label: 'All',          count: transactions.length                                    },
                  { id: 'received' as FilterTab,    label: 'Received',     count: transactions.filter(t => t.type === 'received').length  },
                  { id: 'pending' as FilterTab,     label: 'Pending',      count: transactions.filter(t => t.type === 'pending').length   },
                  { id: 'withdrawals' as FilterTab, label: 'Withdrawals',  count: transactions.filter(t => t.type === 'withdrawal').length },
                ]).map(tab => (
                  <button key={tab.id} onClick={() => setFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-[12.5px] font-semibold transition border-b-2 -mb-px ${
                      filter === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-ink/45 hover:text-ink/70'
                    }`}>
                    {tab.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === tab.id ? 'bg-primary/[0.1] text-primary' : 'bg-surface-sub text-ink/35'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Transaction list */}
              <div>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <EuroIcon s={32}/>
                    <p className="mt-3 text-[13.5px] font-semibold text-ink/45">No {filter === 'all' ? '' : filter} transactions yet</p>
                  </div>
                ) : (
                  filtered.map((tx: Transaction) => <TransactionRow key={tx.id} tx={tx}/>)
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-4 lg:col-span-1">
            <div className="lg:sticky lg:top-[84px] space-y-4">

              {/* ── Withdrawal quick-action ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}>
                    <ArrowUpIcon s={15}/>
                  </div>
                  <div>
                    <p className="text-[13.5px] font-extrabold text-ink">Ready to withdraw</p>
                    <p className="text-[11.5px] text-ink/45">{fmt(availBal)} available</p>
                  </div>
                </div>
                {kycVerified ? (
                  <button
                    onClick={() => setWithdrawOpen(true)}
                    disabled={availBal <= 0}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold text-white transition ${
                      availBal > 0
                        ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`
                        : 'cursor-not-allowed bg-ink/10 text-ink/30'
                    }`}>
                    <ArrowDownIcon s={16}/>Withdraw funds
                  </button>
                ) : (
                  <button
                    onClick={() => setKycVerified(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-3.5 text-[13.5px] font-bold text-amber-700 transition hover:bg-amber-100">
                    <LockIcon s={16}/>Verify identity first
                  </button>
                )}
                {availBal > 0 && (
                  <p className="mt-3 text-center text-[11.5px] text-ink/35">
                    Processed by Grade · 3–5 business days
                  </p>
                )}
              </div>

              {/* ── Bank accounts ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white overflow-hidden ${CARD}`}>
                <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
                  <h3 className="text-[13.5px] font-extrabold text-ink">Bank accounts</h3>
                  <button onClick={() => setAddBankOpen(true)}
                    className="flex items-center gap-1 rounded-lg border border-primary/15 px-3 py-1.5 text-[12px] font-bold text-primary transition hover:bg-primary/[0.05]">
                    <PlusIcon s={12}/>Add
                  </button>
                </div>

                <div className="divide-y divide-primary/6">
                  {bankAccounts.map(acct => (
                    <div key={acct.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/50">
                        <BankIcon s={16}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-bold text-ink truncate">{acct.bankName}</p>
                          {acct.isDefault && (
                            <span className="flex-shrink-0 flex items-center gap-0.5 rounded-full bg-primary/[0.09] px-1.5 py-0.5 text-[9.5px] font-bold text-primary">
                              <StarIcon s={9}/>Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-ink/40">···{acct.ibanLast4} · {acct.holderName}</p>
                      </div>
                      <div className="flex flex-shrink-0 gap-1">
                        {!acct.isDefault && (
                          <button onClick={() => handleSetDefault(acct.id)}
                            title="Set as default"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/30 transition hover:bg-primary/[0.07] hover:text-primary">
                            <StarIcon s={13}/>
                          </button>
                        )}
                        {deletingId === acct.id ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setDeletingId(null)}
                              className="rounded-lg border border-primary/12 px-2.5 py-1 text-[11px] font-bold text-ink/50 transition hover:bg-surface-sub">
                              Keep
                            </button>
                            <button onClick={() => handleDeleteBank(acct.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100">
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(acct.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/25 transition hover:bg-rose-50 hover:text-rose-500">
                            <TrashIcon s={13}/>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {bankAccounts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-5">
                      <BankIcon s={26}/>
                      <p className="mt-2 text-[12.5px] font-semibold text-ink/45">No accounts yet</p>
                      <p className="mt-0.5 text-[11.5px] text-ink/35">Add a bank account to enable withdrawals.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Grade info card ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheckIcon s={17}/>
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold text-ink">Payments via Grade</p>
                    <p className="text-[11px] text-ink/40">YC W26 · Secure escrow</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-[12.5px] leading-[1.6] text-ink/55">
                  <p className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={12}/></span>
                    All brand payments are held in escrow by Grade until content is approved.
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={12}/></span>
                    Multiple brand payments are consolidated into one payout per billing period — less accounting for you.
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={12}/></span>
                    DAC7 tax reporting handled automatically — you don't need to file separately for EU digital income.
                  </p>
                </div>
                <div className="mt-4 rounded-xl bg-surface-sub px-3.5 py-2.5">
                  <p className="text-[11px] font-semibold text-ink/40">
                    Questions about a payment? Use the dispute button on any transaction or contact <span className="font-bold text-ink">support@nexfluence.eu</span>
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  )
}