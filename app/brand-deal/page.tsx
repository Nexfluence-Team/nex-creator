'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Brand deal page — brand/deal/[dealId]/page.tsx
   (Nexfluence v4, LIGHT)

   This page is served exclusively to authenticated brands.
   A creator cannot reach this route.

   Flow:
     DRAFT  → pick deal type → fill contract → send offer
     OFFERED / ACCEPTED / IN_PROGRESS → active deal view
     REVIEW_WINDOW → approve or dispute within 48 h
     COMPLETED / CANCELLED / DISPUTED → terminal states
   ════════════════════════════════════════════════════════════════════ */

const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'

/* ─── Types ──────────────────────────────────────────────────────── */
type DealType   = 'cash' | 'barter' | 'affiliate' | 'hybrid'
type DealStatus =
  | 'DRAFT' | 'OFFERED' | 'ACCEPTED' | 'IN_PROGRESS'
  | 'DELIVERED' | 'REVIEW_WINDOW' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

const DEAL_TYPES: { key: DealType; label: string; desc: string; icon: string }[] = [
  { key: 'cash',      label: 'Paid (Cash)',           desc: 'Fixed fee per deliverable. Held in escrow until approved.',    icon: '💸' },
  { key: 'barter',    label: 'Barter / Gifting',      desc: 'Product or service in exchange. No cash escrow needed.',       icon: '🎁' },
  { key: 'affiliate', label: 'Affiliate / Rev-share', desc: 'Commission on tracked sales, paid monthly.',                   icon: '📈' },
  { key: 'hybrid',    label: 'Hybrid (Cash + Barter)',desc: 'Fixed fee plus product gift. Both terms apply.',               icon: '🤝' },
]

const STATUS_META: Record<DealStatus, { label: string; color: string; bg: string; dot: string }> = {
  DRAFT:         { label: 'Draft',         color: 'text-ink/50',      bg: 'bg-ink/[0.06]',  dot: 'bg-ink/30'      },
  OFFERED:       { label: 'Offer sent',    color: 'text-amber-700',   bg: 'bg-amber-50',    dot: 'bg-amber-400'   },
  ACCEPTED:      { label: 'Accepted',      color: 'text-blue-700',    bg: 'bg-blue-50',     dot: 'bg-blue-400'    },
  IN_PROGRESS:   { label: 'In progress',   color: 'text-violet-700',  bg: 'bg-violet-50',   dot: 'bg-primary'     },
  DELIVERED:     { label: 'Delivered',     color: 'text-teal-700',    bg: 'bg-teal-50',     dot: 'bg-teal-500'    },
  REVIEW_WINDOW: { label: '48-h review',   color: 'text-orange-700',  bg: 'bg-orange-50',   dot: 'bg-orange-400'  },
  COMPLETED:     { label: 'Completed ✓',   color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-500' },
  DISPUTED:      { label: 'Disputed',      color: 'text-red-700',     bg: 'bg-red-50',      dot: 'bg-red-500'     },
  CANCELLED:     { label: 'Cancelled',     color: 'text-ink/45',      bg: 'bg-ink/[0.05]',  dot: 'bg-ink/25'      },
}

type ContractField = {
  id: string; label: string; placeholder: string
  type: 'text' | 'number' | 'date' | 'textarea' | 'select'
  options?: string[]
}

const BASE_FIELDS: ContractField[] = [
  { id: 'creator_name',  label: 'Creator name',            placeholder: 'Amelia Roze',                                type: 'text'     },
  { id: 'brand_name',    label: 'Brand / company name',    placeholder: 'Kinetics SIA',                              type: 'text'     },
  { id: 'deliverable',   label: 'Deliverable description', placeholder: 'One 60-sec TikTok reel — recovery stack',   type: 'textarea' },
  { id: 'deadline',      label: 'Content deadline',        placeholder: '',                                           type: 'date'     },
  { id: 'platform',      label: 'Platform',                placeholder: '',                                           type: 'select',  options: ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Multiple'] },
  { id: 'usage_rights',  label: 'Usage rights granted',    placeholder: '12 months, paid ads allowed',               type: 'text'     },
  { id: 'exclusivity',   label: 'Exclusivity clause',      placeholder: 'No competing supplement brands for 60 days', type: 'text'    },
  { id: 'revisions',     label: 'Max revision rounds',     placeholder: '2',                                          type: 'number'  },
]
const CASH_FIELDS: ContractField[] = [
  { id: 'fee',           label: 'Agreed fee (€)',          placeholder: '500',  type: 'number' },
  { id: 'payment_split', label: 'Payment timing',          placeholder: '',     type: 'select', options: ['100% on delivery', '50% upfront / 50% on delivery', '100% upfront into escrow'] },
]
const BARTER_FIELDS: ContractField[] = [
  { id: 'product_name',  label: 'Product / gift name',     placeholder: 'Recovery Stack Bundle', type: 'text'   },
  { id: 'product_value', label: 'Est. product value (€)',  placeholder: '120',                   type: 'number' },
  { id: 'shipping_by',   label: 'Product ships by',        placeholder: '',                      type: 'date'   },
]
const AFFILIATE_FIELDS: ContractField[] = [
  { id: 'commission_rate',  label: 'Commission rate (%)', placeholder: '15', type: 'number' },
  { id: 'cookie_window',    label: 'Cookie window (days)', placeholder: '30', type: 'number' },
  { id: 'payout_schedule',  label: 'Payout schedule',     placeholder: '',   type: 'select', options: ['Monthly (1st)', 'Monthly (15th)', 'Bi-weekly', 'On request (min €50)'] },
]
const EXTRA_FIELDS: ContractField[] = [
  { id: 'additional_promises', label: 'Additional promises / perks',        placeholder: 'e.g. early access, co-branded post', type: 'textarea' },
  { id: 'notes',               label: 'Private notes (not in contract)',     placeholder: 'Internal only',                      type: 'textarea' },
]

function fieldsForType(t: DealType): ContractField[] {
  const b = [...BASE_FIELDS]
  if (t === 'cash')      return [...b, ...CASH_FIELDS,                  ...EXTRA_FIELDS]
  if (t === 'barter')    return [...b, ...BARTER_FIELDS,                ...EXTRA_FIELDS]
  if (t === 'affiliate') return [...b, ...AFFILIATE_FIELDS,             ...EXTRA_FIELDS]
  if (t === 'hybrid')    return [...b, ...CASH_FIELDS, ...BARTER_FIELDS,...EXTRA_FIELDS]
  return [...b, ...EXTRA_FIELDS]
}

/* ─── Simulated active deal for the active-deal view ─────────────── */
const MOCK_ACTIVE = {
  deliverable:      'One 60-sec TikTok reel featuring the recovery stack.',
  deliveredAt:      new Date(Date.now() - 18 * 3600 * 1000),
  reviewEndsAt:     new Date(Date.now() + 30 * 3600 * 1000),
  escrowAmount:     500,
  platformFee:      25,
  deliverableUrl:   'https://tiktok.com/@amelia.roze/video/example123',
  contractSignedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
}

/* ══════════════════════════════════════════════════════════════════
   ICONS
   ══════════════════════════════════════════════════════════════════ */
const CheckIcon  = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
const LockIcon   = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
const ClockIcon  = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
const EuroIcon   = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
const FileIcon   = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
const XIcon      = ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>

/* ══════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ══════════════════════════════════════════════════════════════════ */
const inp = 'w-full rounded-xl border border-primary/15 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)] placeholder:text-ink/30'

function Label({ text }: { text: string }) {
  return <p className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">{text}</p>
}

function StatusBadge({ status }: { status: DealStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold ${m.bg} ${m.color}`}>
      <span className={`h-2 w-2 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function Card({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">{icon}</span>
        <h3 className="text-[15px] font-extrabold tracking-[-0.02em] text-ink">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-primary/6 py-2.5 last:border-0">
      <span className="text-[13px] font-medium text-ink/50">{label}</span>
      <span className={`text-right text-[13px] font-bold ${bold ? GRAD_TEXT : 'text-ink'}`}>{value}</span>
    </div>
  )
}

function Countdown({ endsAt }: { endsAt: Date }) {
  const calc = () => {
    const d = Math.max(0, endsAt.getTime() - Date.now())
    return { h: Math.floor(d / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000), done: d === 0 }
  }
  const [t, setT] = useState(calc)
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id) })
  if (t.done) return <span className="font-bold text-emerald-600">Window closed — auto-released</span>
  return <span className="font-mono text-[15px] font-black tabular-nums text-orange-600">{String(t.h).padStart(2,'0')}:{String(t.m).padStart(2,'0')}:{String(t.s).padStart(2,'0')}</span>
}

/* ══════════════════════════════════════════════════════════════════
   CANCEL MODAL  (brand-only, locked after delivery)
   ══════════════════════════════════════════════════════════════════ */
function CancelModal({ open, onClose, dealStatus }: { open: boolean; onClose: () => void; dealStatus: DealStatus }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [done, setDone] = useState(false)
  const locked = ['DELIVERED', 'REVIEW_WINDOW', 'COMPLETED', 'DISPUTED'].includes(dealStatus)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) { setReason(''); setDetails(''); setDone(false) }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-5">
          <h3 className="text-[16px] font-extrabold text-ink">Cancel this deal</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10 transition"><XIcon s={13} /></button>
        </div>
        <div className="px-6 py-5">
          {locked ? (
            /* Hard lock — no cancellation after delivery */
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600"><LockIcon s={15} /></span>
                <div>
                  <p className="text-[14px] font-bold text-red-800">Cancellation not available</p>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-red-700">
                    The creator has already delivered their content. You cannot cancel this deal unilaterally. If the content doesn't meet the brief, raise a dispute — our team mediates within 24 hours.
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="mt-4 w-full rounded-xl border border-red-200 bg-white py-2.5 text-[13px] font-bold text-red-700 hover:bg-red-50 transition">Close</button>
            </div>
          ) : done ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500"><CheckIcon s={24} /></div>
              <p className="text-[16px] font-extrabold text-ink">Deal cancelled</p>
              <p className="mt-2 text-[13px] text-ink/55">Escrowed funds will be refunded within 3–5 business days.</p>
              <button onClick={onClose} className={`mt-5 w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white`}>Done</button>
            </div>
          ) : (
            <>
              {dealStatus === 'IN_PROGRESS' && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
                  <strong>Note:</strong> The creator has started work. The 5% platform fee (€25) is non-refundable. Remaining escrow will be returned.
                </div>
              )}
              <div className="mb-4">
                <Label text="Reason for cancelling" />
                <div className="flex flex-wrap gap-2">
                  {['Change of campaign plans', 'Budget cut', 'Creator unavailable', 'Brief mismatch', 'Other'].map(r => (
                    <button key={r} onClick={() => setReason(r)}
                      className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[12.5px] font-semibold transition ${reason === r ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/60'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <Label text="Additional context (optional)" />
                <textarea rows={3} className={`${inp} resize-none`} value={details} onChange={e => setDetails(e.target.value)} placeholder="Any context for the creator…" />
              </div>
              <div className="flex gap-2.5">
                <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 py-3 text-[13px] font-bold text-ink/60 hover:bg-surface-sub transition">Back</button>
                <button disabled={!reason} onClick={() => setDone(true)}
                  className="flex-[1.5] rounded-xl bg-red-600 py-3 text-[13px] font-bold text-white transition hover:bg-red-700 disabled:opacity-40">
                  Cancel deal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   DISPUTE MODAL  (brand-only, during review window)
   ══════════════════════════════════════════════════════════════════ */
function DisputeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) { setReason(''); setDetails(''); setDone(false) }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-5">
          <h3 className="text-[16px] font-extrabold text-ink">Raise a dispute</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10 transition"><XIcon s={13} /></button>
        </div>
        <div className="px-6 py-5">
          {done ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500"><ClockIcon s={24} /></div>
              <p className="text-[16px] font-extrabold text-ink">Dispute submitted</p>
              <p className="mt-2 text-[13px] text-ink/55">Payment is frozen. Our team will review within 24 hours and contact both parties.</p>
              <button onClick={onClose} className={`mt-5 w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white`}>Done</button>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-[13px] text-orange-800">
                <strong>Payment is frozen</strong> while your dispute is reviewed. Intentional abuse of the dispute system (e.g. filing after using the content) may result in account review.
              </div>
              <div className="mb-4">
                <Label text="What's the issue?" />
                <div className="flex flex-wrap gap-2">
                  {['Content does not match brief', 'Wrong platform posted', 'Missing #ad disclosure', 'Content already deleted', 'Quality below standard', 'Other'].map(r => (
                    <button key={r} onClick={() => setReason(r)}
                      className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[12.5px] font-semibold transition ${reason === r ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/60'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <Label text="Describe the issue" />
                <textarea rows={3} className={`${inp} resize-none`} value={details} onChange={e => setDetails(e.target.value)} placeholder="Describe clearly. Evidence (screenshots, links) can be uploaded after submission." />
              </div>
              <div className="flex gap-2.5">
                <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 py-3 text-[13px] font-bold text-ink/60 hover:bg-surface-sub transition">Back</button>
                <button disabled={!reason} onClick={() => setDone(true)}
                  className={`flex-[1.5] rounded-xl ${GRAD_BTN} py-3 text-[13px] font-bold text-white disabled:opacity-40 transition hover:-translate-y-0.5`}>
                  Submit dispute
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAYMENT MODAL  (escrow)
   ══════════════════════════════════════════════════════════════════ */
function PaymentModal({ open, onClose, amount, onSuccess }: { open: boolean; onClose: () => void; amount: number; onSuccess: () => void }) {
  const [method, setMethod] = useState<'card' | 'bank'>('card')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const fee = Math.round(amount * 0.05)
  const total = amount + fee

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) { setDone(false); setLoading(false) }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const pay = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1800)) /* swap for Stripe / Grade API call */
    setLoading(false); setDone(true)
    setTimeout(() => { onSuccess(); onClose() }, 1600)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-5">
          <h3 className="text-[16px] font-extrabold text-ink">Pay into escrow</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10 transition"><XIcon s={13} /></button>
        </div>
        <div className="px-6 py-5">
          {done ? (
            <div className="py-4 text-center">
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)]`}><CheckIcon s={28} /></div>
              <p className="text-[16px] font-extrabold text-ink">Payment received!</p>
              <p className="mt-2 text-[13px] text-ink/55">€{total} is held in escrow. The creator has been notified and the deal is now active.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-xl border border-primary/12 bg-primary/[0.04] px-4 py-3.5 text-[13px] leading-[1.65] text-ink/70">
                <span className="font-bold text-primary">How escrow works: </span>
                Your payment is held securely by Nexfluence and only released to the creator after content is delivered and your 48-hour review window passes — or when you manually approve early.
              </div>
              <div className="mb-5 rounded-xl bg-surface-sub px-5 py-4">
                <Row label="Agreed fee"        value={`€${amount}`} />
                <Row label="Platform fee (5%)" value={`€${fee}`} />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-ink">Total charged today</span>
                  <span className={`text-[20px] font-black ${GRAD_TEXT}`}>€{total}</span>
                </div>
              </div>
              <div className="mb-5">
                <Label text="Payment method" />
                <div className="flex gap-2.5">
                  {([['card', '💳 Card'], ['bank', '🏦 Bank transfer']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setMethod(key)}
                      className={`flex-1 rounded-xl border-[1.5px] py-3 text-[13px] font-bold transition ${method === key ? 'border-primary bg-primary/[0.07] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {method === 'card' && (
                <div className="mb-5 space-y-3">
                  <div><Label text="Card number" /><input className={inp} placeholder="1234 5678 9012 3456" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label text="Expiry" /><input className={inp} placeholder="MM / YY" /></div>
                    <div><Label text="CVC" /><input className={inp} placeholder="123" /></div>
                  </div>
                </div>
              )}
              {method === 'bank' && (
                <div className="mb-5 rounded-xl border border-primary/12 bg-surface-sub px-4 py-4 text-[13px] leading-[1.7] text-ink/70">
                  <p className="font-bold text-ink mb-2">Transfer details</p>
                  <p>IBAN: <span className="font-mono font-bold">LV12 NEXF 0000 0000 0001 23</span></p>
                  <p>BIC: <span className="font-mono font-bold">NEXFLV2X</span></p>
                  <p className="mt-2 text-[12px] text-ink/45">Reference: <span className="font-bold">DEAL-ABC123</span></p>
                  <p className="mt-2 text-[11.5px] text-ink/40">Deal activates automatically once payment clears (1–2 business days).</p>
                </div>
              )}
              <div className="mb-5 flex items-center gap-2 text-[12px] text-ink/40">
                <LockIcon s={13} />
                <span>256-bit SSL · Funds held by Nexfluence SIA · Grade payment rails</span>
              </div>
              <button onClick={pay} disabled={loading}
                className={`w-full rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 disabled:opacity-60`}>
                {loading ? <span className="flex items-center justify-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Processing…</span> : `Pay €${total} into escrow`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE — BRAND ONLY
   ══════════════════════════════════════════════════════════════════ */
export default function BrandDealPage() {
  const [dealType, setDealType]     = useState<DealType | null>(null)
  const [fields, setFields]         = useState<Record<string, string>>({})
  const [step, setStep]             = useState<'type' | 'contract' | 'review' | 'active'>('type')
  const [dealStatus, setDealStatus] = useState<DealStatus>('DRAFT')
  const [payOpen, setPayOpen]       = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)

  const contractFields = dealType ? fieldsForType(dealType) : []
  const feeAmount      = parseInt(fields['fee'] || '0', 10) || MOCK_ACTIVE.escrowAmount
  const setField       = (id: string, v: string) => setFields(f => ({ ...f, [id]: v }))

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">

        {/* Page header */}
        <div className="mb-7">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Deal management</p>
          <h1 className="text-[clamp(24px,4vw,30px)] font-black tracking-[-0.04em] text-ink">
            {step === 'active' ? 'Active deal — Amelia Roze' : 'Create a deal'}
          </h1>
          <p className="mt-1.5 text-[14px] text-ink/55">
            {step === 'active'
              ? 'Track progress, review the deliverable, and manage payment from here.'
              : 'Set the terms, sign the contract, and fund the escrow — all in one place.'}
          </p>
        </div>

        {/* Cancellation policy notice */}
        <div className={`mb-6 rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><LockIcon s={14} /></span>
            <div>
              <p className="text-[13px] font-extrabold text-ink mb-1.5">Nexfluence deal protection policy</p>
              <div className="space-y-1 text-[12.5px] text-ink/60 leading-[1.6]">
                <p>✅ <strong>Before delivery</strong> — you may cancel any time. Full refund minus platform fees already charged.</p>
                <p>⏳ <strong>After delivery, within 48 h</strong> — cancellation is <strong>locked</strong>. Raise a dispute; our team mediates within 24 h.</p>
                <p>🔒 <strong>After 48 h</strong> — payment auto-releases to the creator. No refunds. Support-only disputes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 1: Deal type ── */}
        {step === 'type' && (
          <Card title="What kind of deal is this?" icon={<FileIcon s={17} />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DEAL_TYPES.map(dt => (
                <button key={dt.key} onClick={() => setDealType(dt.key)}
                  className={`flex items-start gap-3 rounded-xl border-[1.5px] p-4 text-left transition ${dealType === dt.key ? 'border-primary bg-primary/[0.06]' : 'border-primary/12 bg-white hover:border-primary/30'}`}>
                  <span className="text-2xl flex-shrink-0">{dt.icon}</span>
                  <div className="flex-1">
                    <p className={`text-[14px] font-bold ${dealType === dt.key ? 'text-primary' : 'text-ink'}`}>{dt.label}</p>
                    <p className="mt-0.5 text-[12px] leading-[1.5] text-ink/50">{dt.desc}</p>
                  </div>
                  {dealType === dt.key && <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${GRAD_BTN} text-white`}><CheckIcon s={10} /></span>}
                </button>
              ))}
            </div>
            <button disabled={!dealType} onClick={() => setStep('contract')}
              className={`mt-5 w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40`}>
              Next: Fill contract details →
            </button>
          </Card>
        )}

        {/* ── STEP 2: Contract ── */}
        {step === 'contract' && dealType && (
          <Card title="Contract details" icon={<FileIcon s={17} />}>
            <div className="space-y-4">
              {contractFields.map(f => (
                <div key={f.id}>
                  <Label text={f.label} />
                  {f.type === 'textarea' ? (
                    <textarea rows={3} className={`${inp} resize-none`} placeholder={f.placeholder} value={fields[f.id] || ''} onChange={e => setField(f.id, e.target.value)} />
                  ) : f.type === 'select' ? (
                    <select className={inp} value={fields[f.id] || ''} onChange={e => setField(f.id, e.target.value)}>
                      <option value="">Select…</option>
                      {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} className={inp} placeholder={f.placeholder} value={fields[f.id] || ''} onChange={e => setField(f.id, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2.5">
              <button onClick={() => setStep('type')} className="rounded-xl border border-primary/15 px-5 py-3 text-[13px] font-bold text-ink/60 transition hover:bg-surface-sub">← Back</button>
              <button onClick={() => setStep('review')} className={`flex-1 rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white transition hover:-translate-y-0.5`}>Review contract →</button>
            </div>
          </Card>
        )}

        {/* ── STEP 3: Review & send ── */}
        {step === 'review' && dealType && (
          <Card title="Review & send offer" icon={<FileIcon s={17} />}>
            <div className="mb-5 space-y-0.5 rounded-xl bg-surface-sub px-5 py-4">
              <Row label="Deal type" value={DEAL_TYPES.find(d => d.key === dealType)?.label ?? ''} />
              {contractFields.map(f => fields[f.id] ? <Row key={f.id} label={f.label} value={fields[f.id]!} bold={f.id === 'fee'} /> : null)}
            </div>
            {['cash', 'hybrid'].includes(dealType) && feeAmount > 0 && (
              <div className="mb-5 rounded-xl border border-primary/12 bg-primary/[0.04] px-4 py-3.5 text-[13px] leading-[1.65] text-ink/70">
                <span className="font-bold text-primary">Escrow payment: </span>
                Once the creator accepts, you'll pay <strong>€{feeAmount + Math.round(feeAmount * 0.05)}</strong> (fee + 5% platform) into escrow. Funds release 48 h after delivery unless you dispute.
              </div>
            )}
            <div className="flex gap-2.5">
              <button onClick={() => setStep('contract')} className="rounded-xl border border-primary/15 px-5 py-3 text-[13px] font-bold text-ink/60 transition hover:bg-surface-sub">← Edit</button>
              <button onClick={() => { setDealStatus('OFFERED'); setStep('active') }}
                className={`flex-1 rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white transition hover:-translate-y-0.5`}>
                Send offer to creator 🚀
              </button>
            </div>
          </Card>
        )}

        {/* ── ACTIVE DEAL VIEW ── */}
        {step === 'active' && (
          <div className="space-y-5">

            {/* Status header */}
            <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/40">Deal with Amelia Roze · DEAL-ABC123</p>
                  <h2 className="text-[18px] font-extrabold tracking-[-0.03em] text-ink">{fields['deliverable'] || MOCK_ACTIVE.deliverable}</h2>
                  <p className="mt-1 text-[13px] text-ink/50">Signed {MOCK_ACTIVE.contractSignedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <StatusBadge status={dealStatus} />
              </div>
              {/* Simulate accept → pay for demo */}
              {dealStatus === 'OFFERED' && (
                <button onClick={() => { setDealStatus('ACCEPTED'); setPayOpen(true) }}
                  className={`mt-4 rounded-xl ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white`}>
                  Demo: Creator accepted → Pay now
                </button>
              )}
            </div>

            {/* Escrow + Timeline */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Card title="Escrow balance" icon={<EuroIcon s={17} />}>
                <Row label="Held in escrow"   value={`€${feeAmount}`} />
                <Row label="Platform fee (5%)" value={`€${Math.round(feeAmount * 0.05)}`} />
                <Row label="Creator receives"  value={`€${feeAmount - Math.round(feeAmount * 0.05)}`} bold />
                <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-[12px] text-amber-800">
                  <strong>Auto-release:</strong> Funds release 48 h after delivery unless you raise a dispute.
                </p>
              </Card>
              <Card title="Deal timeline" icon={<ClockIcon s={17} />}>
                {[
                  { label: 'Contract signed',   done: true,                                                           time: MOCK_ACTIVE.contractSignedAt.toLocaleDateString() },
                  { label: 'Payment received',  done: ['IN_PROGRESS','DELIVERED','REVIEW_WINDOW','COMPLETED'].includes(dealStatus), time: 'Escrowed' },
                  { label: 'Content delivered', done: ['DELIVERED','REVIEW_WINDOW','COMPLETED'].includes(dealStatus), time: ['IN_PROGRESS'].includes(dealStatus) ? 'Pending' : MOCK_ACTIVE.deliveredAt.toLocaleString() },
                  { label: '48-h review',       done: dealStatus === 'COMPLETED',                                     time: dealStatus === 'REVIEW_WINDOW' ? 'Running…' : '—' },
                  { label: 'Payment released',  done: dealStatus === 'COMPLETED',                                     time: dealStatus === 'COMPLETED' ? 'Done' : 'Pending' },
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <span className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${t.done ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white'}`}>
                      {t.done && <CheckIcon s={10} />}
                    </span>
                    <div className="flex-1">
                      <p className={`text-[13px] font-semibold ${t.done ? 'text-ink' : 'text-ink/40'}`}>{t.label}</p>
                      <p className="text-[11px] text-ink/35">{t.time}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </div>

            {/* 48-h review window */}
            {dealStatus === 'REVIEW_WINDOW' && (
              <div className={`rounded-2xl border border-orange-200 bg-orange-50 p-6 ${CARD}`}>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><ClockIcon s={18} /></span>
                    <div>
                      <p className="text-[14px] font-extrabold text-orange-900">Review window active</p>
                      <p className="text-[12.5px] text-orange-700">Auto-release in: <Countdown endsAt={MOCK_ACTIVE.reviewEndsAt} /></p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button onClick={() => setDisputeOpen(true)}
                      className="rounded-xl border-[1.5px] border-red-300 bg-white px-4 py-2.5 text-[13px] font-bold text-red-700 transition hover:bg-red-50">
                      Raise a dispute
                    </button>
                    <button onClick={() => setDealStatus('COMPLETED')}
                      className={`rounded-xl ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5`}>
                      Approve &amp; release payment
                    </button>
                  </div>
                </div>
                <div className="rounded-xl border border-orange-200 bg-white px-4 py-3">
                  <p className="mb-1 text-[12.5px] font-bold text-orange-800">Delivered content:</p>
                  <a href={MOCK_ACTIVE.deliverableUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[13px] font-semibold text-primary underline underline-offset-2 break-all">
                    {MOCK_ACTIVE.deliverableUrl}
                  </a>
                </div>
                <p className="mt-3 text-[12px] text-orange-700/70">
                  ⚠ Once the 48-h window closes, payment is <strong>automatically released</strong>. After delivery you cannot cancel — only dispute.
                </p>
              </div>
            )}

            {/* Demo: simulate delivery (IN_PROGRESS) */}
            {dealStatus === 'IN_PROGRESS' && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center">
                <p className="text-[13px] text-violet-700 mb-3">Waiting for the creator to deliver content…</p>
                <button onClick={() => setDealStatus('REVIEW_WINDOW')}
                  className="rounded-xl border border-violet-300 bg-white px-5 py-2.5 text-[13px] font-bold text-violet-700 hover:bg-violet-50 transition">
                  Demo: Creator uploaded → Start 48-h window
                </button>
              </div>
            )}

            {/* Completed */}
            {dealStatus === 'COMPLETED' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CheckIcon s={20} /></span>
                  <div>
                    <p className="text-[14px] font-extrabold text-emerald-900">Deal completed — payment released ✓</p>
                    <p className="text-[12.5px] text-emerald-700">€{feeAmount - Math.round(feeAmount * 0.05)} transferred to Amelia Roze.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cancel button — only before delivery */}
            {['OFFERED', 'ACCEPTED', 'IN_PROGRESS'].includes(dealStatus) && (
              <div className="flex justify-end">
                <button onClick={() => setCancelOpen(true)}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[13px] font-bold text-red-600 transition hover:bg-red-50">
                  Cancel this deal
                </button>
              </div>
            )}

            {/* Lock notice after delivery */}
            {['DELIVERED', 'REVIEW_WINDOW'].includes(dealStatus) && (
              <div className="flex items-center gap-2.5 rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3">
                <LockIcon s={14} />
                <p className="text-[12.5px] text-ink/55">
                  <strong>Cancellation locked.</strong> Content has been delivered. You can only raise a dispute within the 48-hour window.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <PaymentModal open={payOpen} onClose={() => setPayOpen(false)} amount={feeAmount} onSuccess={() => setDealStatus('IN_PROGRESS')} />
        <CancelModal  open={cancelOpen}  onClose={() => setCancelOpen(false)}  dealStatus={dealStatus} />
        <DisputeModal open={disputeOpen} onClose={() => setDisputeOpen(false)} />
      </div>
    </div>
  )
}