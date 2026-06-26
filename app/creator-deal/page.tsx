'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Creator deal page — creator/deal/[dealId]/page.tsx
   (Nexfluence v4, LIGHT)

   This page is served exclusively to authenticated creators.
   A brand cannot reach this route.

   Flow:
     OFFERED       → review offer → accept or counter
     ACCEPTED      → brand pays (shown as waiting state here)
     IN_PROGRESS   → upload deliverable
     REVIEW_WINDOW → 48-h countdown, dispute if needed
     COMPLETED     → withdraw earnings
   ════════════════════════════════════════════════════════════════════ */

const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'

/* ─── Types ──────────────────────────────────────────────────────── */
type DealStatus =
  | 'OFFERED' | 'ACCEPTED' | 'IN_PROGRESS'
  | 'DELIVERED' | 'REVIEW_WINDOW' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'

const STATUS_META: Record<DealStatus, { label: string; color: string; bg: string; dot: string }> = {
  OFFERED:       { label: 'Offer received',  color: 'text-amber-700',   bg: 'bg-amber-50',    dot: 'bg-amber-400'   },
  ACCEPTED:      { label: 'Accepted',        color: 'text-blue-700',    bg: 'bg-blue-50',     dot: 'bg-blue-400'    },
  IN_PROGRESS:   { label: 'In progress',     color: 'text-violet-700',  bg: 'bg-violet-50',   dot: 'bg-primary'     },
  DELIVERED:     { label: 'Delivered',       color: 'text-teal-700',    bg: 'bg-teal-50',     dot: 'bg-teal-500'    },
  REVIEW_WINDOW: { label: '48-h review',     color: 'text-orange-700',  bg: 'bg-orange-50',   dot: 'bg-orange-400'  },
  COMPLETED:     { label: 'Completed ✓',     color: 'text-emerald-700', bg: 'bg-emerald-50',  dot: 'bg-emerald-500' },
  DISPUTED:      { label: 'Disputed',        color: 'text-red-700',     bg: 'bg-red-50',      dot: 'bg-red-500'     },
  CANCELLED:     { label: 'Cancelled',       color: 'text-ink/45',      bg: 'bg-ink/[0.05]',  dot: 'bg-ink/25'      },
}

/* ─── Incoming deal data (replace with API fetch) ────────────────── */
const DEAL = {
  id:               'DEAL-ABC123',
  brand:            'Kinetics',
  brandColor:       '#8B31E8',
  dealType:         'Hybrid (Cash + Barter)',
  fee:              500,
  productName:      'Recovery Stack Bundle',
  productValue:     120,
  deliverable:      'One 60-sec TikTok reel featuring the recovery stack with honest results review.',
  deadline:         '2026-07-15',
  platform:         'TikTok',
  usageRights:      '12 months, paid ads allowed',
  exclusivity:      'No competing supplement brands for 60 days',
  revisions:        '2 rounds max',
  platformFee:      25,    /* 5% */
  creatorPayout:    475,
  reviewEndsAt:     new Date(Date.now() + 30 * 3600 * 1000),
  deliveredAt:      new Date(Date.now() - 18 * 3600 * 1000),
  contractSignedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
}

/* ══════════════════════════════════════════════════════════════════
   ICONS
   ══════════════════════════════════════════════════════════════════ */
const CheckIcon  = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
const ClockIcon  = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
const EuroIcon   = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
const UploadIcon = ({ s = 20 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
const FileIcon   = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
const XIcon      = ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>

/* ══════════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ══════════════════════════════════════════════════════════════════ */
const inp = 'w-full rounded-xl border border-primary/15 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)] placeholder:text-ink/30'

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
  if (t.done) return <span className="font-bold text-emerald-600">Window closed — payment released!</span>
  return <span className="font-mono text-[15px] font-black tabular-nums text-orange-600">{String(t.h).padStart(2,'0')}:{String(t.m).padStart(2,'0')}:{String(t.s).padStart(2,'0')}</span>
}

/* ══════════════════════════════════════════════════════════════════
   COUNTER OFFER MODAL
   ══════════════════════════════════════════════════════════════════ */
function CounterModal({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const [fee, setFee]     = useState('')
  const [note, setNote]   = useState('')
  const [done, setDone]   = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) { setFee(''); setNote(''); setDone(false) }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-5">
          <h3 className="text-[16px] font-extrabold text-ink">Send a counter offer</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10 transition"><XIcon s={13} /></button>
        </div>
        <div className="px-6 py-5">
          {done ? (
            <div className="py-4 text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${GRAD_BTN}`}><CheckIcon s={24} /></div>
              <p className="text-[16px] font-extrabold text-ink">Counter offer sent!</p>
              <p className="mt-2 text-[13px] text-ink/55">Kinetics will review your counter and respond. You'll be notified.</p>
              <button onClick={() => { onSent(); onClose() }} className={`mt-5 w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white`}>Done</button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-[13px] text-ink/60 leading-[1.6]">Propose different terms. The brand will receive your counter and can accept, negotiate, or decline.</p>
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Your proposed fee (€)</p>
                <input type="number" className={inp} value={fee} onChange={e => setFee(e.target.value)} placeholder={`Current offer: €${DEAL.fee}`} />
              </div>
              <div className="mb-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Message to brand</p>
                <textarea rows={3} className={`${inp} resize-none`} value={note} onChange={e => setNote(e.target.value)} placeholder="Explain your counter — e.g. scope, exclusivity terms, timeline…" />
              </div>
              <div className="flex gap-2.5">
                <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 py-3 text-[13px] font-bold text-ink/60 hover:bg-surface-sub transition">Back</button>
                <button disabled={!fee && !note} onClick={() => setDone(true)}
                  className={`flex-[1.5] rounded-xl ${GRAD_BTN} py-3 text-[13px] font-bold text-white disabled:opacity-40 transition hover:-translate-y-0.5`}>
                  Send counter
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
   DISPUTE MODAL  (creator raises ticket during review window)
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
              <p className="text-[16px] font-extrabold text-ink">Dispute raised</p>
              <p className="mt-2 text-[13px] text-ink/55">Payment is frozen. Our team reviews within 24 hours and will contact both parties.</p>
              <button onClick={onClose} className={`mt-5 w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white`}>Done</button>
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-[13px] text-orange-800">
                Only raise a dispute if there's a genuine issue — e.g. the brand is asking for extra deliverables not in the contract or threatening non-payment. Our team reviews within 24 h.
              </div>
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">What's the issue?</p>
                <div className="flex flex-wrap gap-2">
                  {['Brand requesting out-of-scope work', 'Brand threatening to reject valid content', 'Technical payment issue', 'Contract terms not honoured', 'Other'].map(r => (
                    <button key={r} onClick={() => setReason(r)}
                      className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[12.5px] font-semibold transition ${reason === r ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/60'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Describe the issue</p>
                <textarea rows={3} className={`${inp} resize-none`} value={details} onChange={e => setDetails(e.target.value)} placeholder="Be specific. Include any messages or evidence." />
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
   WITHDRAW MODAL
   ══════════════════════════════════════════════════════════════════ */
function WithdrawModal({ open, onClose, amount, onSuccess }: { open: boolean; onClose: () => void; amount: number; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) { setDone(false); setLoading(false) }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const withdraw = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400)) /* swap for real payout API */
    setLoading(false); setDone(true)
    setTimeout(() => { onSuccess(); onClose() }, 1400)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-5">
          <h3 className="text-[16px] font-extrabold text-ink">Withdraw earnings</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 hover:bg-ink/10 transition"><XIcon s={13} /></button>
        </div>
        <div className="px-6 py-5">
          {done ? (
            <div className="py-4 text-center">
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)]`}><CheckIcon s={28} /></div>
              <p className="text-[16px] font-extrabold text-ink">Withdrawal initiated!</p>
              <p className="mt-2 text-[13px] text-ink/55">€{amount} will arrive in your registered IBAN within 1–3 business days.</p>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-xl bg-surface-sub px-5 py-4">
                <Row label="Available to withdraw" value={`€${amount}`} bold />
                <Row label="Transfer to"           value="IBAN: LV12 PRIV ···· ···· 8842" />
                <Row label="Processing time"       value="1–3 business days" />
              </div>
              <p className="mb-5 text-[12.5px] text-ink/50 leading-[1.6]">
                To update your payout IBAN, go to <strong>Settings → Payment</strong> before withdrawing.
              </p>
              <button onClick={withdraw} disabled={loading}
                className={`w-full rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 disabled:opacity-60`}>
                {loading ? <span className="flex items-center justify-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Processing…</span> : `Withdraw €${amount}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   PAGE — CREATOR ONLY
   ══════════════════════════════════════════════════════════════════ */
export default function CreatorDealPage() {
  const [dealStatus, setDealStatus]   = useState<DealStatus>('OFFERED')
  const [deliverableUrl, setUrl]      = useState('')
  const [uploading, setUploading]     = useState(false)
  const [counterOpen, setCounterOpen] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawn, setWithdrawn]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    setUploading(true)
    await new Promise(r => setTimeout(r, 1600))
    setUploading(false)
    setDealStatus('REVIEW_WINDOW')
  }

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">

        {/* Page header */}
        <div className="mb-7">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Incoming deal</p>
          <h1 className="text-[clamp(24px,4vw,30px)] font-black tracking-[-0.04em] text-ink">
            Deal from {DEAL.brand}
          </h1>
          <p className="mt-1.5 text-[14px] text-ink/55">Review the terms, deliver your content, and withdraw once payment releases.</p>
        </div>

        {/* Status header */}
        <div className={`mb-5 rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/40">Deal ID: {DEAL.id}</p>
              <h2 className="text-[17px] font-extrabold tracking-[-0.03em] text-ink">{DEAL.deliverable}</h2>
              <p className="mt-1 text-[13px] text-ink/50">
                Deadline: {new Date(DEAL.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <StatusBadge status={dealStatus} />
          </div>
        </div>

        {/* ── OFFERED: review + accept or counter ── */}
        {dealStatus === 'OFFERED' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Deal terms */}
              <Card title="What they're asking for" icon={<FileIcon s={17} />}>
                <Row label="Deal type"     value={DEAL.dealType} />
                <Row label="Deliverable"   value={DEAL.deliverable} />
                <Row label="Platform"      value={DEAL.platform} />
                <Row label="Deadline"      value={new Date(DEAL.deadline).toLocaleDateString('en-GB')} />
                <Row label="Usage rights"  value={DEAL.usageRights} />
                <Row label="Exclusivity"   value={DEAL.exclusivity} />
                <Row label="Revisions"     value={DEAL.revisions} />
              </Card>

              {/* What you get */}
              <Card title="What you'll receive" icon={<EuroIcon s={17} />}>
                <Row label="Cash fee"      value={`€${DEAL.fee}`} bold />
                <Row label="Platform fee"  value={`−€${DEAL.platformFee}`} />
                <Row label="Your payout"   value={`€${DEAL.creatorPayout}`} bold />
                <Row label="Product gift"  value={`${DEAL.productName} (€${DEAL.productValue})`} />
                <Row label="Total value"   value={`€${DEAL.creatorPayout + DEAL.productValue}`} bold />
                <div className="mt-4 rounded-lg bg-primary/[0.04] border border-primary/12 px-3.5 py-3 text-[12.5px] text-ink/65">
                  Cash fee is held in escrow by Nexfluence and released 48 h after you deliver, unless the brand disputes.
                </div>
              </Card>
            </div>

            {/* Accept or counter */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setCounterOpen(true)}
                className="flex-1 rounded-xl border-[1.5px] border-primary/25 bg-white py-3.5 text-[14px] font-bold text-primary transition hover:bg-primary/[0.04]">
                Counter offer
              </button>
              <button onClick={() => setDealStatus('ACCEPTED')}
                className={`flex-[2] rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
                Accept deal ✓
              </button>
            </div>

            <button className="w-full rounded-xl border border-red-200 bg-white py-3 text-[13px] font-bold text-red-600 transition hover:bg-red-50">
              Decline this deal
            </button>
          </div>
        )}

        {/* ── ACCEPTED: waiting for brand payment ── */}
        {dealStatus === 'ACCEPTED' && (
          <div className="space-y-5">
            <div className={`rounded-2xl border border-blue-200 bg-blue-50 p-6 ${CARD}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><ClockIcon s={18} /></span>
                <div>
                  <p className="text-[14px] font-extrabold text-blue-900">Waiting for payment</p>
                  <p className="text-[12.5px] text-blue-700">Kinetics has been notified and is paying into escrow. You'll get a notification once funds are locked and you can start work.</p>
                </div>
              </div>
              {/* Demo shortcut */}
              <button onClick={() => setDealStatus('IN_PROGRESS')}
                className="mt-4 rounded-xl border border-blue-300 bg-white px-5 py-2.5 text-[13px] font-bold text-blue-700 hover:bg-blue-50 transition">
                Demo: Brand paid → Start work
              </button>
            </div>
            <Card title="Your deal summary" icon={<FileIcon s={17} />}>
              <Row label="Cash fee (in escrow)" value={`€${DEAL.fee}`} />
              <Row label="Your payout"          value={`€${DEAL.creatorPayout}`} bold />
              <Row label="Product gift"         value={`${DEAL.productName}`} />
              <Row label="Deadline"             value={new Date(DEAL.deadline).toLocaleDateString('en-GB')} />
            </Card>
          </div>
        )}

        {/* ── IN_PROGRESS: upload deliverable ── */}
        {dealStatus === 'IN_PROGRESS' && (
          <div className="space-y-5">
            <div className={`rounded-2xl border border-violet-200 bg-violet-50 p-5 ${CARD}`}>
              <p className="text-[14px] font-extrabold text-violet-900 mb-1">🎬 Time to create!</p>
              <p className="text-[13px] text-violet-700">Your escrow is funded. Create and post your content, then submit the live URL below. The brand gets 48 hours to review before your payment releases automatically.</p>
            </div>

            <Card title="Submit your deliverable" icon={<UploadIcon s={17} />}>
              <p className="mb-4 text-[13px] text-ink/60 leading-[1.65]">
                Post your content, then paste the live public URL here. The brand reviews for 48 hours — after that, payment auto-releases to you.
              </p>
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">Live content URL</p>
                <input className={inp} value={deliverableUrl} onChange={e => setUrl(e.target.value)} placeholder="https://tiktok.com/@yourhandle/video/…" />
              </div>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-primary/10" />
                <span className="text-[11px] text-ink/35 font-semibold">or upload a file</span>
                <div className="h-px flex-1 bg-primary/10" />
              </div>
              <input ref={fileRef} type="file" accept="video/*,image/*" className="hidden" />
              <button onClick={() => fileRef.current?.click()}
                className="mb-4 w-full rounded-xl border-2 border-dashed border-primary/20 py-5 text-[13px] font-semibold text-primary/70 transition hover:border-primary/40 hover:bg-primary/[0.03]">
                <span className="flex flex-col items-center gap-1.5"><UploadIcon s={22} /><span>Click to upload file</span></span>
              </button>
              <button onClick={handleUpload} disabled={!deliverableUrl.trim() || uploading}
                className={`w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50`}>
                {uploading ? <span className="flex items-center justify-center gap-2"><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Submitting…</span> : 'Mark as delivered'}
              </button>
            </Card>

            <Card title="Deal reminder" icon={<FileIcon s={17} />}>
              <Row label="Deliverable" value={DEAL.deliverable} />
              <Row label="Platform"    value={DEAL.platform} />
              <Row label="Deadline"    value={new Date(DEAL.deadline).toLocaleDateString('en-GB')} />
              <Row label="Revisions"   value={DEAL.revisions} />
            </Card>
          </div>
        )}

        {/* ── REVIEW_WINDOW: 48-h countdown ── */}
        {dealStatus === 'REVIEW_WINDOW' && (
          <div className="space-y-5">
            <div className={`rounded-2xl border border-orange-200 bg-orange-50 p-6 ${CARD}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><ClockIcon s={18} /></span>
                  <div>
                    <p className="text-[14px] font-extrabold text-orange-900">48-hour review window</p>
                    <p className="text-[12.5px] text-orange-700">Auto-release in: <Countdown endsAt={DEAL.reviewEndsAt} /></p>
                  </div>
                </div>
                <button onClick={() => setDealStatus('COMPLETED')}
                  className="rounded-xl border border-orange-300 bg-white px-4 py-2 text-[12.5px] font-bold text-orange-700 hover:bg-orange-50 transition">
                  Demo: Timer expired →
                </button>
              </div>
              <p className="mt-4 text-[12.5px] text-orange-800/80">
                The brand is reviewing your content. If no dispute is raised within 48 hours, <strong>€{DEAL.creatorPayout} releases automatically</strong> to your account. You'll be notified immediately.
              </p>
            </div>

            <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
              <p className="mb-2 text-[13px] font-bold text-ink">Your submitted content</p>
              <a href={deliverableUrl || 'https://tiktok.com/@amelia.roze/video/example123'} target="_blank" rel="noopener noreferrer"
                className="text-[13px] font-semibold text-primary underline underline-offset-2 break-all">
                {deliverableUrl || 'https://tiktok.com/@amelia.roze/video/example123'}
              </a>
            </div>

            <Card title="Expected payout" icon={<EuroIcon s={17} />}>
              <Row label="Escrow amount"  value={`€${DEAL.fee}`} />
              <Row label="Platform fee"   value={`−€${DEAL.platformFee}`} />
              <Row label="Your payout"    value={`€${DEAL.creatorPayout}`} bold />
              <p className="mt-3 text-[12px] text-ink/45">Available to withdraw once the review window closes.</p>
            </Card>

            <div className="flex justify-end">
              <button onClick={() => setDisputeOpen(true)}
                className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-[13px] font-bold text-red-600 transition hover:bg-red-50">
                Something wrong? Raise a ticket
              </button>
            </div>
          </div>
        )}

        {/* ── COMPLETED: withdraw ── */}
        {dealStatus === 'COMPLETED' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CheckIcon s={20} /></span>
                <div>
                  <p className="text-[14px] font-extrabold text-emerald-900">Deal complete — payment released! 🎉</p>
                  <p className="text-[12.5px] text-emerald-700">€{DEAL.creatorPayout} is ready to withdraw to your bank account.</p>
                </div>
              </div>
            </div>

            <Card title="Withdraw your earnings" icon={<EuroIcon s={17} />}>
              {withdrawn ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CheckIcon s={18} /></span>
                  <div>
                    <p className="text-[14px] font-bold text-emerald-900">Withdrawal initiated</p>
                    <p className="text-[12px] text-emerald-700">€{DEAL.creatorPayout} arriving in 1–3 business days.</p>
                  </div>
                </div>
              ) : (
                <>
                  <Row label="Available now"   value={`€${DEAL.creatorPayout}`} bold />
                  <Row label="Transfer to"     value="IBAN: LV12 PRIV ···· ···· 8842" />
                  <Row label="Processing time" value="1–3 business days" />
                  <button onClick={() => setWithdrawOpen(true)}
                    className={`mt-5 w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
                    Withdraw €{DEAL.creatorPayout}
                  </button>
                </>
              )}
            </Card>
          </div>
        )}

        {/* Modals */}
        <CounterModal  open={counterOpen}  onClose={() => setCounterOpen(false)}  onSent={() => setDealStatus('OFFERED')} />
        <DisputeModal  open={disputeOpen}  onClose={() => setDisputeOpen(false)} />
        <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} amount={DEAL.creatorPayout} onSuccess={() => setWithdrawn(true)} />
      </div>
    </div>
  )
}