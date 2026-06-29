'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Agency Withdrawal — app/agency/payments/withdraw/page.tsx
   Nexfluence v4, LIGHT
   ════════════════════════════════════════════════════════════════════

   A DEDICATED FULL PAGE for agency withdrawals — not just a modal.
   This gives the agency:
   1. Full withdrawal history with status tracking
   2. All business bank accounts managed in one place
   3. A prominent 3-step withdrawal initiation flow (inline on page)
   4. DAC7 compliance status + annual summary card

   WHY A SEPARATE PAGE (vs the modal on /agency/payments):
     The modal is the quick action. This page is the complete financial
     management view — for accountants, bookkeepers, or the agency
     reviewing their full payout history.

   Header: Dashboard | Payments | Withdraw (active) — agency pattern
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

/* ─── Types ──────────────────────────────────────────────────────── */
type WdStatus = 'completed' | 'processing' | 'failed'

interface WithdrawalRecord {
  id:          string
  amount:      number
  accountId:   string
  bankName:    string
  ibanLast4:   string
  date:        string
  arrivalDate: string
  status:      WdStatus
  ref:         string
}

interface BizBankAccount {
  id:          string
  bankName:    string
  ibanLast4:   string
  ibanFull:    string
  holderName:  string
  isDefault:   boolean
  verified:    boolean
}

/* ─── Mock data ──────────────────────────────────────────────────── */
const AVAILABLE_BALANCE = 3240

const INITIAL_ACCOUNTS: BizBankAccount[] = [
  { id: 'ba1', bankName: 'Swedbank Latvia',   ibanLast4: '8832', ibanFull: 'LV89HABA0551028688832', holderName: 'Baltic Creators Agency SIA', isDefault: true,  verified: true  },
  { id: 'ba2', bankName: 'Revolut Business',  ibanLast4: '4411', ibanFull: 'LT603250075524884411', holderName: 'Baltic Creators Agency SIA', isDefault: false, verified: true  },
]

const INITIAL_HISTORY: WithdrawalRecord[] = [
  { id: 'w1', amount: 2400, accountId: 'ba1', bankName: 'Swedbank Latvia',   ibanLast4: '8832', date: 'Jun 16, 2026', arrivalDate: 'Jun 21, 2026', status: 'completed', ref: 'WD-2026-0448' },
  { id: 'w2', amount: 1800, accountId: 'ba1', bankName: 'Swedbank Latvia',   ibanLast4: '8832', date: 'May 14, 2026', arrivalDate: 'May 19, 2026', status: 'completed', ref: 'WD-2026-0389' },
  { id: 'w3', amount: 2100, accountId: 'ba2', bankName: 'Revolut Business',  ibanLast4: '4411', date: 'Apr 10, 2026', arrivalDate: 'Apr 15, 2026', status: 'completed', ref: 'WD-2026-0312' },
  { id: 'w4', amount: 1500, accountId: 'ba1', bankName: 'Swedbank Latvia',   ibanLast4: '8832', date: 'Mar 8, 2026',  arrivalDate: 'Mar 13, 2026', status: 'completed', ref: 'WD-2026-0241' },
  { id: 'w5', amount: 900,  accountId: 'ba1', bankName: 'Swedbank Latvia',   ibanLast4: '8832', date: 'Feb 12, 2026', arrivalDate: 'Feb 17, 2026', status: 'completed', ref: 'WD-2026-0178' },
]

const YTD_WITHDRAWN = 8700
const YTD_EARNED    = 18450

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function BellIcon({ s = 18 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CheckIcon({ s = 13 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 13 }: { s?: number })           { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function ArrowUpIcon({ s = 18 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 20V4M5 9l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ArrowDownIcon({ s = 18 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 4v16M5 15l7 7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ArrowLeftIcon({ s = 15 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BankIcon({ s = 18 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function PlusIcon({ s = 13 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function TrashIcon({ s = 13 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ShieldCheckIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function StarIcon({ s = 12 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z"/></svg> }
function AlertIcon({ s = 15 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function InfoIcon({ s = 15 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function CalendarIcon({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function DownloadIcon({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 22 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }

/* ─── Helpers ────────────────────────────────────────────────────── */
function fmt(n: number) { return `€${n.toLocaleString('en-EU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` }
function genRef()       { return `WD-2026-${String(Math.floor(Math.random() * 900) + 500)}` }

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
   ADD BANK ACCOUNT MODAL
   ════════════════════════════════════════════════════════════════════ */
function AddBankModal({ open, onClose, onAdd }: {
  open: boolean; onClose: () => void; onAdd: (a: Omit<BizBankAccount, 'id' | 'verified'>) => void
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
    onAdd({ bankName: bankName.trim(), ibanFull: ibanClean, ibanLast4: ibanClean.slice(-4), holderName: holderName.trim(), isDefault })
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
            <p className="text-[11.5px] text-ink/45">For agency withdrawals — must be a company account</p>
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
            <ShieldCheckIcon s={14}/>
            <p className="text-[12px] text-emerald-700 leading-[1.6]">IBAN encrypted and stored by Grade. Nexfluence never stores raw banking details.</p>
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
   WITHDRAWAL FORM — inline 3-step (no modal — this IS the page)
   Step 1: Amount + account selection
   Step 2: Review summary
   Step 3: Success + reference
   ════════════════════════════════════════════════════════════════════ */
function WithdrawalForm({ available, accounts, onComplete }: {
  available:  number
  accounts:   BizBankAccount[]
  onComplete: (amount: number, accountId: string, ref: string) => void
}) {
  const [step,      setStep]      = useState<1|2|3>(1)
  const [amountStr, setAmountStr] = useState('')
  const [accountId, setAccountId] = useState(accounts.find(a => a.isDefault)?.id ?? accounts[0]?.id ?? '')
  const [submitting,setSubmitting]= useState(false)
  const [wdRef,     setWdRef]     = useState('')

  const amount      = parseFloat(amountStr) || 0
  const amountValid = amount > 0 && amount <= available
  const selAcct     = accounts.find(a => a.id === accountId)

  const arrivalDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 4)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  })()

  const handleConfirm = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1000))
    const ref = genRef(); setWdRef(ref)
    setStep(3); setSubmitting(false)
    onComplete(amount, accountId, ref)
  }

  const reset = () => { setStep(1); setAmountStr(''); setWdRef('') }

  if (accounts.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-surface-sub/40 py-16 text-center ${CARD}`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary"><BankIcon s={24}/></div>
        <p className="mt-4 text-[14.5px] font-extrabold text-ink">No bank accounts yet</p>
        <p className="mt-1.5 max-w-[280px] text-[13px] text-ink/50">Add a business bank account to enable withdrawals. Your IBAN is encrypted and stored securely by Grade.</p>
      </div>
    )
  }

  /* Step 3 — Success */
  if (step === 3) {
    return (
      <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
        <div className={`flex flex-col items-center justify-center gap-5 py-12 px-8 text-center ${GRAD_BTN}`}>
          <div className="flex items-center justify-center rounded-2xl bg-white/20" style={{ width: 72, height: 72 }}>
            <CheckIcon s={32}/>
          </div>
          <div>
            <h3 className="text-[24px] font-black tracking-[-0.02em] text-white">Withdrawal initiated!</h3>
            <p className="mt-1.5 max-w-[320px] text-[13.5px] leading-[1.7] text-white/75">
              <span className="font-bold text-white">{fmt(amount)}</span> is on its way to {selAcct?.bankName}. Funds arrive in 3–5 business days.
            </p>
          </div>
        </div>
        <div className="px-7 py-6 space-y-4">
          <div className={`flex items-center gap-4 rounded-2xl border border-primary/12 bg-surface-sub px-5 py-4 ${CARD}`}>
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} text-white text-[10px] font-black`}>REF</div>
            <div>
              <p className="text-[10.5px] font-semibold text-ink/40">Withdrawal reference</p>
              <p className={`text-[18px] font-extrabold tracking-[-0.01em] ${GRAD_TXT}`}>{wdRef}</p>
            </div>
          </div>
          <div className={`rounded-xl border border-primary/10 bg-white p-4 ${CARD}`}>
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              {[
                ['Amount',        fmt(amount)],
                ['To account',    `${selAcct?.bankName} · ···${selAcct?.ibanLast4}`],
                ['Account holder',selAcct?.holderName ?? ''],
                ['Est. arrival',  arrivalDate],
                ['Processed by',  'Grade (YC W26)'],
                ['Reference',     wdRef],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="font-semibold text-ink/40">{label}</p>
                  <p className="font-bold text-ink">{val}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11.5px] text-center text-ink/40">Grade will send a confirmation email to your registered agency address. Keep this reference for your records.</p>
          <div className="flex gap-2.5">
            <button onClick={reset}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub transition">
              New withdrawal
            </button>
            <button onClick={() => {/* mock PDF */}}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold text-white transition ${GRAD_BTN} hover:-translate-y-0.5`}>
              <DownloadIcon s={14}/>Download receipt
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>

      {/* Step indicators */}
      <div className="flex items-center gap-0 border-b border-primary/8">
        {[
          { n: 1, label: 'Enter amount' },
          { n: 2, label: 'Review'       },
          { n: 3, label: 'Complete'     },
        ].map((s, i) => {
          const active = s.n === step
          const done   = s.n < step
          return (
            <div key={s.n} className={`flex flex-1 items-center gap-2 px-5 py-3.5 text-[12.5px] font-semibold ${active ? 'text-primary bg-primary/[0.04]' : done ? 'text-emerald-600' : 'text-ink/35'}`}>
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black ${active ? `${GRAD_BTN} text-white` : done ? 'bg-emerald-500 text-white' : 'bg-surface-sub'}`}>
                {done ? <CheckIcon s={10}/> : s.n}
              </span>
              <span className="hidden sm:block">{s.label}</span>
              {i < 2 && <div className="ml-auto h-px flex-1 bg-primary/8 hidden sm:block"/>}
            </div>
          )
        })}
      </div>

      {/* STEP 1 — Amount + account */}
      {step === 1 && (
        <div className="p-6 space-y-6">
          <div>
            <p className="mb-2 text-[12px] font-bold text-ink/50">Amount to withdraw *</p>
            <div className="relative">
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[20px] font-extrabold text-ink/35">€</span>
              <input type="number" min={1} max={available} step={0.01} value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                className={`${INP} pl-11 text-[22px] font-extrabold tracking-[-0.02em] py-4 ${amountStr && !amountValid ? 'border-rose-300' : ''}`}
                placeholder="0"/>
              <button onClick={() => setAmountStr(String(available))}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-primary/[0.08] px-3.5 py-2 text-[12.5px] font-bold text-primary hover:bg-primary/[0.14] transition">
                All · {fmt(available)}
              </button>
            </div>
            {amountStr && !amountValid && (
              <p className="mt-1.5 text-[12px] font-semibold text-rose-600">
                {amount > available ? `Maximum available is ${fmt(available)}` : 'Enter a valid amount'}
              </p>
            )}
            {/* Quick amount pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[available, Math.floor(available * 0.75), Math.floor(available * 0.5), 1000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4).map(v => (
                <button key={v} onClick={() => setAmountStr(String(v))}
                  className={`rounded-xl border px-4 py-2 text-[13px] font-bold transition ${amountStr === String(v) ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
                  {v === available ? 'All — ' : ''}{fmt(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Account selection */}
          <div>
            <p className="mb-2 text-[12px] font-bold text-ink/50">Withdraw to *</p>
            <div className="space-y-2">
              {accounts.map(acct => (
                <button key={acct.id} onClick={() => setAccountId(acct.id)}
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition ${accountId === acct.id ? 'border-primary/30 bg-primary/[0.04]' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${accountId === acct.id ? GRAD_BTN + ' text-white' : 'bg-surface-sub text-ink/50'}`}><BankIcon s={17}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-bold text-ink">{acct.bankName}</p>
                      {acct.isDefault && <span className="rounded-full bg-primary/[0.08] px-2 py-0.5 text-[10px] font-bold text-primary">Default</span>}
                      {acct.verified && <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600"><CheckIcon s={9}/>Verified</span>}
                    </div>
                    <p className="text-[12.5px] text-ink/45">{acct.holderName} · ···{acct.ibanLast4}</p>
                  </div>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${accountId === acct.id ? `border-primary ${GRAD_BTN}` : 'border-primary/20 bg-white'}`}>
                    {accountId === acct.id && <CheckIcon s={11}/>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-3 rounded-xl bg-surface-sub px-4 py-3.5">
            <InfoIcon s={15}/>
            <div className="text-[12px] text-ink/55 leading-[1.65]">
              <span className="font-bold text-ink">Processing time:</span> 3–5 business days. Processed by <span className="font-semibold text-ink">Grade (YC W26)</span>. DAC7 EU tax reporting handled automatically.
            </div>
          </div>

          <button onClick={() => setStep(2)} disabled={!amountValid || !accountId}
            className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-[15px] font-bold text-white transition ${amountValid && accountId ? `${GRAD_BTN} shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            Review withdrawal<ArrowUpIcon s={18}/>
          </button>
        </div>
      )}

      {/* STEP 2 — Review */}
      {step === 2 && (
        <div className="p-6 space-y-5">
          <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-[13px] font-semibold text-ink/50 hover:text-ink transition">
            <ArrowLeftIcon s={14}/>Back
          </button>

          {/* Confirmation summary */}
          <div className={`overflow-hidden rounded-2xl border border-primary/15 bg-white ${CARD}`}>
            <div className={`flex flex-col items-center justify-center py-8 ${GRAD_BTN}`}>
              <p className="text-[13px] font-semibold text-white/70">Withdrawing from agency wallet</p>
              <p className="mt-1 text-[44px] font-black tracking-[-0.04em] text-white">{fmt(amount)}</p>
            </div>
            <div className="divide-y divide-primary/8 px-6 py-1">
              {[
                ['To account',        `${selAcct?.bankName} · ···${selAcct?.ibanLast4}`],
                ['Account holder',    selAcct?.holderName ?? ''],
                ['Account type',      'Business account'],
                ['Estimated arrival', arrivalDate],
                ['Processed by',      'Grade (YC W26) · SEPA escrow'],
                ['Remaining after',   fmt(available - amount)],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3">
                  <span className="text-[12.5px] font-semibold text-ink/40">{label}</span>
                  <span className="text-right text-[13px] font-semibold text-ink">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[12px] text-center text-ink/40 leading-[1.65]">
            By confirming, you authorise Nexfluence and Grade to transfer {fmt(amount)} from Baltic Creators Agency's wallet to the account shown above.
          </p>

          <button onClick={handleConfirm} disabled={submitting}
            className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-[15px] font-bold text-white transition ${!submitting ? `${GRAD_BTN} shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/15 text-ink/30'}`}>
            {submitting
              ? <><span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink/20 border-t-ink/60"/>Processing…</>
              : <><ArrowDownIcon s={20}/>Confirm withdrawal · {fmt(amount)}</>}
          </button>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   WITHDRAWAL HISTORY ROW
   ════════════════════════════════════════════════════════════════════ */
const WD_STATUS_CFG: Record<WdStatus, { label: string; bg: string; text: string; dot: string }> = {
  completed:  { label: 'Completed',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  processing: { label: 'Processing', bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400'     },
  failed:     { label: 'Failed',     bg: 'bg-rose-50',    text: 'text-rose-600',    dot: 'bg-rose-400'    },
}

function WithdrawalRow({ wd }: { wd: WithdrawalRecord }) {
  const sc = WD_STATUS_CFG[wd.status]
  return (
    <div className="flex items-center gap-3 border-b border-primary/6 px-5 py-4 last:border-0 transition hover:bg-surface-sub/40">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/50`}><ArrowUpIcon s={14}/></div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink">{wd.bankName} · ···{wd.ibanLast4}</p>
        <p className="text-[11.5px] text-ink/40">{wd.ref}</p>
      </div>
      <div className="hidden flex-col items-end sm:flex">
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${sc.bg} ${sc.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
        </span>
        <p className="mt-0.5 text-[11px] text-ink/35 flex items-center gap-1"><CalendarIcon s={11}/>{wd.date}</p>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-[14px] font-extrabold text-ink/70 tabular-nums">−{fmt(wd.amount)}</span>
        <span className="text-[10.5px] text-ink/35">Arrived {wd.arrivalDate}</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function AgencyWithdrawPage() {
  const router = useRouter()

  const [availBal,     setAvailBal]     = useState(AVAILABLE_BALANCE)
  const [accounts,     setAccounts]     = useState<BizBankAccount[]>(INITIAL_ACCOUNTS)
  const [history,      setHistory]      = useState<WithdrawalRecord[]>(INITIAL_HISTORY)
  const [addBankOpen,  setAddBankOpen]  = useState(false)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg,     setToastMsg]     = useState('')

  const UNREAD_NOTIFS = 3

  const showToast = (msg: string) => { setToastMsg(msg); setToastVisible(true); setTimeout(() => setToastVisible(false), 3200) }

  const handleAddAccount = (acct: Omit<BizBankAccount, 'id' | 'verified'>) => {
    const newAcct: BizBankAccount = { ...acct, id: `ba${Date.now()}`, verified: false }
    setAccounts(prev => { const u = acct.isDefault ? prev.map(a => ({ ...a, isDefault: false })) : prev; return [...u, newAcct] })
    showToast(`${acct.bankName} added — verification pending via Grade`)
  }

  const handleSetDefault = (id: string) => { setAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id }))); showToast('Default account updated') }
  const handleDelete      = (id: string) => { setAccounts(prev => prev.filter(a => a.id !== id)); setDeletingId(null); showToast('Account removed') }

  const handleWithdrawalComplete = (amount: number, accountId: string, ref: string) => {
    const acct = accounts.find(a => a.id === accountId)
    if (!acct) return
    const arrivalDate = (() => { const d = new Date(); d.setDate(d.getDate() + 4); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) })()
    const newRecord: WithdrawalRecord = {
      id: `w${Date.now()}`, amount, accountId, bankName: acct.bankName, ibanLast4: acct.ibanLast4,
      date: 'Just now', arrivalDate, status: 'processing', ref,
    }
    setHistory(prev => [newRecord, ...prev])
    setAvailBal(prev => prev - amount)
    showToast(`${fmt(amount)} withdrawal initiated — arrives in 3–5 business days`)
  }

  const ytdPct = Math.min(100, Math.round((YTD_WITHDRAWN / YTD_EARNED) * 100))

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      <Toast visible={toastVisible} message={toastMsg}/>
      <AddBankModal open={addBankOpen} onClose={() => setAddBankOpen(false)} onAdd={handleAddAccount}/>

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg,rgba(139,49,232,0.05) 0%,rgba(139,49,232,0.05) 30%,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 58%,rgba(139,49,232,0.05) 70%,rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {[
                { label: 'Dashboard', active: false, action: () => router.push('/dashboard/agency') },
                { label: 'Payments',  active: false, action: () => router.push('/agency/payments')  },
                { label: 'Withdraw',  active: true,  action: () => {} },
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

        {/* Back link */}
        <button onClick={() => router.push('/agency/payments')}
          className="mb-6 flex items-center gap-1.5 text-[13px] font-semibold text-ink/50 hover:text-primary transition">
          <ArrowLeftIcon s={14}/>Back to Payments
        </button>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-[26px] font-black tracking-[-0.03em] text-ink">Withdraw agency funds</h1>
          <p className="mt-1 text-[14px] text-ink/50">Transfer your agency earnings to a business bank account. Processed securely via Grade (YC W26) within 3–5 business days.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── LEFT: Withdrawal form + history (2/3) ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Balance hero strip */}
            <div className={`overflow-hidden rounded-2xl ${GRAD_BTN} p-6 ${CARD}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-white/60">Available to withdraw</p>
                  <p className="mt-1 text-[38px] font-black tracking-[-0.04em] text-white">{fmt(availBal)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">This year withdrawn</p>
                  <p className="text-[20px] font-extrabold text-white/80">{fmt(YTD_WITHDRAWN)}</p>
                  <p className="text-[11px] text-white/40">of {fmt(YTD_EARNED)} earned</p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white/60 transition-all duration-700" style={{ width: `${ytdPct}%` }}/>
              </div>
              <p className="mt-1.5 text-[11px] text-white/50">{ytdPct}% of this year's earnings withdrawn</p>
            </div>

            {/* Withdrawal form */}
            <WithdrawalForm available={availBal} accounts={accounts} onComplete={handleWithdrawalComplete}/>

            {/* Withdrawal history */}
            <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
              <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
                <h2 className="text-[14.5px] font-extrabold text-ink">Withdrawal history</h2>
                <span className="text-[12px] font-semibold text-ink/40">{history.length} records</span>
              </div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <EuroIcon s={32}/>
                  <p className="mt-3 text-[13.5px] font-semibold text-ink/45">No withdrawals yet</p>
                </div>
              ) : (
                history.map(wd => <WithdrawalRow key={wd.id} wd={wd}/>)
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR (1/3) ── */}
          <div className="space-y-4 lg:col-span-1">
            <div className="lg:sticky lg:top-[84px] space-y-4">

              {/* Business bank accounts */}
              <div className={`rounded-2xl border border-primary/10 bg-white overflow-hidden ${CARD}`}>
                <div className="flex items-center justify-between border-b border-primary/8 px-5 py-4">
                  <h3 className="text-[13.5px] font-extrabold text-ink">Business accounts</h3>
                  <button onClick={() => setAddBankOpen(true)}
                    className="flex items-center gap-1 rounded-lg border border-primary/15 px-3 py-1.5 text-[12px] font-bold text-primary hover:bg-primary/[0.05] transition">
                    <PlusIcon s={11}/>Add
                  </button>
                </div>
                <div className="divide-y divide-primary/6">
                  {accounts.map(acct => (
                    <div key={acct.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/50"><BankIcon s={15}/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13px] font-bold text-ink truncate">{acct.bankName}</p>
                          {acct.isDefault && <span className="flex-shrink-0 flex items-center gap-0.5 rounded-full bg-primary/[0.09] px-1.5 py-0.5 text-[9px] font-bold text-primary"><StarIcon s={8}/>Default</span>}
                          {acct.verified
                            ? <span className="flex-shrink-0 flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600"><CheckIcon s={8}/>Verified</span>
                            : <span className="flex-shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">Pending</span>
                          }
                        </div>
                        <p className="text-[11.5px] text-ink/40">···{acct.ibanLast4}</p>
                      </div>
                      <div className="flex flex-shrink-0 gap-1">
                        {!acct.isDefault && (
                          <button onClick={() => handleSetDefault(acct.id)} title="Set as default"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/30 hover:bg-primary/[0.07] hover:text-primary transition"><StarIcon s={12}/></button>
                        )}
                        {deletingId === acct.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setDeletingId(null)} className="rounded-lg border border-primary/12 px-2 py-1 text-[11px] font-bold text-ink/50 hover:bg-surface-sub transition">Keep</button>
                            <button onClick={() => handleDelete(acct.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition">Remove</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(acct.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/25 hover:bg-rose-50 hover:text-rose-500 transition"><TrashIcon s={12}/></button>
                        )}
                      </div>
                    </div>
                  ))}
                  {accounts.length === 0 && (
                    <div className="flex flex-col items-center py-8 text-center px-5">
                      <BankIcon s={24}/>
                      <p className="mt-2 text-[12.5px] font-semibold text-ink/45">No accounts added</p>
                    </div>
                  )}
                </div>
              </div>

              {/* DAC7 compliance card (agency-only) */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheckIcon s={17}/></div>
                  <div>
                    <p className="text-[13px] font-extrabold text-ink">DAC7 Compliance</p>
                    <p className="text-[11px] text-ink/40">EU digital platform regulation</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-[12.5px] leading-[1.6] text-ink/55">
                  <p className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={11}/></span>All agency payouts are reported to EU tax authorities automatically by Nexfluence SIA (Latvian operator) via Grade.</p>
                  <p className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={11}/></span>You receive an annual income statement from Grade by 31 January each year, pre-formatted for Latvian tax filing.</p>
                  <p className="flex items-start gap-2"><span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={11}/></span>Creator disbursements handled by Grade are reported separately — creators receive their own statements.</p>
                </div>
                {/* Annual YTD summary */}
                <div className="mt-4 rounded-xl bg-surface-sub p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink/40 mb-2.5">2026 year-to-date</p>
                  <div className="grid grid-cols-2 gap-2.5 text-[12.5px]">
                    {[
                      ['Gross earned',  fmt(YTD_EARNED)],
                      ['Withdrawn',     fmt(YTD_WITHDRAWN)],
                      ['In wallet',     fmt(availBal)],
                      ['Tax year ends', '31 Dec 2026'],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-ink/40 font-semibold">{label}</p>
                        <p className="text-ink font-extrabold">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grade info */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400"/>
                  <p className="text-[13px] font-extrabold text-ink">Processed by Grade (YC W26)</p>
                </div>
                <p className="text-[12.5px] leading-[1.65] text-ink/55">Grade handles all escrow, SEPA transfers, and DAC7 reporting for Creator Nexus. Your agency bank account is encrypted at rest. Nexfluence never stores raw IBAN data.</p>
                <div className="mt-3 flex items-center gap-2 text-[11.5px] font-semibold text-ink/40">
                  <AlertIcon s={13}/>
                  <span>Minimum processing: 3–5 business days · No fees charged by Nexfluence</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}