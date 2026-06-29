'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Creator contract viewer — app/creator/contract/[id]/page.tsx
                              (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   Renders the contract exactly as the brand built it (both Standard
   and Custom modes), adds the creator's own SignBlock, and handles
   three terminal states:

     pending           → "Sign contract" CTA + "Request changes" toggle
     signed            → both signature blocks filled, Download PDF
     changes_requested → amber note sent to brand, awaiting revision

   Data shape mirrors app/brand/contract/new/page.tsx exactly so
   every field the brand set renders identically here.

   Header: NexLogo pill (centred) | Dashboard / Discover left nav |
           Messages icon + badge, Bell + badge, My Profile right nav
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ════════════════════════════════════════════════════════════════════
   TYPES — exact mirror of brand contract builder
   ════════════════════════════════════════════════════════════════════ */
type DealType       = 'cash' | 'commission' | 'hybrid' | 'custom'
type ContractMode   = 'standard' | 'custom'
type ContractStatus = 'pending' | 'signed' | 'changes_requested'

/* Standard contract — all fields from StandardDraft */
interface StandardContract {
  mode:                  'standard'
  dealType:              DealType
  customDealDescription: string
  brandName:             string
  brandReg:              string
  creatorName:           string
  creatorHandle:         string
  campaignName:          string
  campaignObjective:     string
  pieces:                string
  formats:               string
  platforms:             string
  postingWindow:         string
  startDate:             string
  endDate:               string
  usageRights:           string
  exclusivityPeriod:     string
  currency:              string
  flatAmount:            string
  commissionRate:        string
  commissionTracking:    string
  paymentSchedule:       string
  invoiceRequired:       boolean
  latePaymentClause:     boolean
  /* Brand has already signed */
  brandSignerName:       string
  brandSignerDesignation: string
  brandSignerOrg:        string
  brandSignedAt:         string
}

/* Custom contract — mirrors CustomDraft */
interface Clause   { id: string; text: string }
interface Section  { id: string; heading: string; clauses: Clause[] }

interface CustomContract {
  mode:                  'custom'
  dealType:              DealType
  customDealDescription: string
  brandName:             string
  brandReg:              string
  creatorName:           string
  creatorHandle:         string
  campaignName:          string
  sections:              Section[]
  brandSignerName:       string
  brandSignerDesignation: string
  brandSignerOrg:        string
  brandSignedAt:         string
}

type ContractData = StandardContract | CustomContract

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA — one standard, one custom
   ════════════════════════════════════════════════════════════════════ */
const MOCK_STANDARD: StandardContract = {
  mode: 'standard',
  dealType: 'hybrid',
  customDealDescription: '',
  brandName: 'Kinetics SIA',
  brandReg: '40203456789',
  creatorName: 'Amelia Roze',
  creatorHandle: '@amelia.roze',
  campaignName: 'Vitamin-C Recovery Stack — Summer 2026',
  campaignObjective: 'Conversions — product sales',
  pieces: '3',
  formats: '1× Instagram Reel, 2× Story series',
  platforms: 'Instagram, TikTok',
  postingWindow: 'Monday–Thursday, 08:00–20:00 EET',
  startDate: '2026-07-01',
  endDate: '2026-07-31',
  usageRights: '12 months, non-exclusive, digital only',
  exclusivityPeriod: '30 days in sports nutrition category',
  currency: 'EUR',
  flatAmount: '300',
  commissionRate: '8',
  commissionTracking: 'Nexfluence affiliate link + UTM code',
  paymentSchedule: '50% on brief approval, 50% within 14 days of all content going live',
  invoiceRequired: true,
  latePaymentClause: true,
  brandSignerName: 'Harshul Gupta',
  brandSignerDesignation: 'Founder',
  brandSignerOrg: 'Kinetics SIA',
  brandSignedAt: '27 June 2026',
}

const MOCK_CUSTOM: CustomContract = {
  mode: 'custom',
  dealType: 'commission',
  customDealDescription: '',
  brandName: 'Lumora Skincare OÜ',
  brandReg: '12345678',
  creatorName: 'Amelia Roze',
  creatorHandle: '@amelia.roze',
  campaignName: 'Morning Ritual — Vitamin C Serum',
  sections: [
    {
      id: 's1', heading: 'Scope of Work',
      clauses: [
        { id: 'c1', text: 'The Creator shall produce one (1) Instagram Reel of minimum 30 seconds duration featuring the Lumora Vitamin C Serum as part of a genuine morning skincare routine.' },
        { id: 'c2', text: 'Content must be published within the campaign window of 1 July 2026 to 20 July 2026, on a Tuesday, Wednesday, or Thursday for optimal reach.' },
        { id: 'c3', text: 'The Creator shall tag @lumoraskincare in the caption and include the provided affiliate tracking link in their bio for a minimum of 72 hours post-publication.' },
      ],
    },
    {
      id: 's2', heading: 'Compensation',
      clauses: [
        { id: 'c4', text: 'Lumora Skincare shall gift the Creator one (1) complete Morning Ritual Kit (retail value €120) inclusive of the Vitamin C Glow Serum, Hydration Mist, and SPF Day Cream.' },
        { id: 'c5', text: 'In addition, the Creator shall receive a 12% commission on all verified sales tracked via the unique affiliate link for a period of sixty (60) days from the date of first publication.' },
        { id: 'c6', text: 'Commission payments shall be made monthly, within 14 days of the end of each calendar month, provided the Creator has submitted a valid invoice.' },
      ],
    },
    {
      id: 's3', heading: 'Content Rights & Usage',
      clauses: [
        { id: 'c7', text: 'The Creator retains full copyright in all content produced under this Agreement.' },
        { id: 'c8', text: 'The Creator grants Lumora Skincare a non-exclusive, royalty-free licence to boost, repost, and use the content for paid advertising on Instagram and TikTok for a period of six (6) months from the date of first publication.' },
        { id: 'c9', text: 'Lumora Skincare shall not alter, distort, or present the content in a manner inconsistent with the Creator\'s brand identity without prior written consent.' },
      ],
    },
    {
      id: 's4', heading: 'Confidentiality',
      clauses: [
        { id: 'c10', text: 'Both parties agree to keep the specific financial terms of this Agreement confidential and shall not disclose them to third parties without mutual written consent.' },
      ],
    },
  ],
  brandSignerName: 'Marta Kalniņa',
  brandSignerDesignation: 'Head of Partnerships',
  brandSignerOrg: 'Lumora Skincare OÜ',
  brandSignedAt: '25 June 2026',
}

/* Change to MOCK_CUSTOM to preview custom contract */
const ACTIVE_CONTRACT: ContractData = MOCK_STANDARD

/* ════════════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════════════ */
const DEAL_TYPE_LABELS: Record<DealType, string> = {
  cash:       'All cash',
  commission: 'All commission',
  hybrid:     'Hybrid (base fee + commission)',
  custom:     'Custom deal',
}
const DEAL_TYPE_COLORS: Record<DealType, { bg: string; text: string }> = {
  cash:       { bg: 'bg-violet-50',  text: 'text-violet-700'  },
  commission: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  hybrid:     { bg: 'bg-sky-50',     text: 'text-sky-700'     },
  custom:     { bg: 'bg-amber-50',   text: 'text-amber-700'   },
}

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function CheckIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function ChevronLeft({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChatBubbleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function BellIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function PenIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function FileTextIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
}
function DownloadIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CalendarIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function ShieldIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CoinsIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.8"/><path d="M10.67 4A6 6 0 0116 14.33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function AlertIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SendIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ExternalLinkIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   SHARED SMALL COMPONENTS
   ════════════════════════════════════════════════════════════════════ */
function LogoTile({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const abbr = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {abbr}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-[10.5px] font-black uppercase tracking-[0.16em] text-ink/35">{children}</p>
}

/* ─── Review row — identical to brand's ReviewRow in StdStep5 ─── */
function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-primary/8 py-3 last:border-0">
      <span className="flex-shrink-0 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink/38">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">
        {value ?? <span className="italic text-ink/28">Not specified</span>}
      </span>
    </div>
  )
}

/* ─── Format date YYYY-MM-DD → "1 Jul 2026" ─────────────────────── */
function fmtDate(d: string): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

/* ════════════════════════════════════════════════════════════════════
   SIGN MODAL — creator fills in their own SignBlock
   Bottom-sheet on mobile, centred on desktop.
   ════════════════════════════════════════════════════════════════════ */
function SignModal({ open, contractName, brandName, onClose, onSign }: {
  open: boolean
  contractName: string
  brandName: string
  onClose: () => void
  onSign: (name: string, designation: string, org: string) => void
}) {
  const [name,        setName]        = useState('')
  const [designation, setDesignation] = useState('')
  const [org,         setOrg]         = useState('')
  const [signing,     setSigning]     = useState(false)

  useEffect(() => {
    if (open) { setSigning(false); /* keep fields — creator may have partially filled */ }
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!open) return null

  const valid = name.trim().length > 0 && designation.trim().length > 0 && org.trim().length > 0

  const handleSign = async () => {
    if (!valid) return
    setSigning(true)
    await new Promise(r => setTimeout(r, 800))
    onSign(name.trim(), designation.trim(), org.trim())
  }

  const INP = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
  const LBL = 'mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.10em] text-ink/45'

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[520px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>

        {/* Drag handle — mobile */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink/12 sm:hidden"/>

        {/* Modal header */}
        <div className="flex items-start justify-between border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.42)]`}>
              <PenIcon s={17}/>
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-ink">Sign this contract</p>
              <p className="text-[11.5px] text-ink/45">Binding agreement with {brandName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10">
            <XIcon s={13}/>
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-[13px] leading-[1.65] text-ink/55">
            Provide your full name, role, and organisation. This constitutes your binding digital signature on
            <span className="font-semibold text-ink"> "{contractName}"</span>.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={LBL}>Full legal name *</label>
              <input className={INP} value={name} onChange={e => setName(e.target.value)}
                placeholder="Amelia Roze" autoFocus/>
            </div>
            <div>
              <label className={LBL}>Designation *</label>
              <input className={INP} value={designation} onChange={e => setDesignation(e.target.value)}
                placeholder="Content Creator"/>
            </div>
            <div>
              <label className={LBL}>Organisation *</label>
              <input className={INP} value={org} onChange={e => setOrg(e.target.value)}
                placeholder="Self-employed / your company"/>
            </div>
          </div>

          {/* Preview of signature line */}
          {name && designation && org && (
            <div className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <CheckIcon s={11}/>
              </span>
              <p className="text-[13px] font-semibold text-ink">
                Signed by <span className="font-extrabold">{name}</span>, {designation} at {org}
              </p>
            </div>
          )}

          <p className="text-[11.5px] text-ink/40">
            By clicking "Sign contract" you confirm you have read and understood all terms, and agree to be legally bound by this agreement.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 border-t border-primary/10 px-6 py-4 sm:flex-row sm:justify-between">
          <button onClick={onClose}
            className="order-2 rounded-xl border border-primary/15 bg-white px-5 py-3 text-[13.5px] font-bold text-ink/55 transition hover:bg-surface-sub sm:order-1">
            Review again
          </button>
          <button onClick={handleSign} disabled={!valid || signing}
            className={`order-1 flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[14px] font-bold text-white transition sm:order-2 ${valid && !signing ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            {signing ? (
              <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Signing…</>
            ) : (
              <><PenIcon s={14}/>Sign contract</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   BRAND SIGNATURE BLOCK — read-only, already signed
   Rendered below the contract body. Shows who signed for the brand.
   ════════════════════════════════════════════════════════════════════ */
function BrandSignatureBlock({ signerName, signerDesignation, signerOrg, signedAt }: {
  signerName: string; signerDesignation: string; signerOrg: string; signedAt: string
}) {
  return (
    <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-5 ${CARD}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckIcon s={11}/>
        </span>
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">Brand signature</p>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-[15px] font-extrabold text-ink">{signerName}</p>
          <p className="text-[12.5px] text-ink/55">{signerDesignation} · {signerOrg}</p>
          <p className="mt-0.5 text-[11.5px] text-ink/40">Signed {signedAt}</p>
        </div>
        {/* Stylised signature line */}
        <div className="hidden flex-col items-end sm:flex">
          <p className="font-['Georgia',serif] text-[22px] italic tracking-wide text-ink/50"
            style={{ fontFamily: 'Georgia, serif' }}>
            {signerName.split(' ')[0]}
          </p>
          <div className="mt-1 h-px w-32 bg-ink/20"/>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CREATOR SIGNATURE BLOCK — shown in main body
   Pending: dashed placeholder.
   Signed: green confirmation (mirrors brand block).
   ════════════════════════════════════════════════════════════════════ */
function CreatorSignatureBlock({ status, creatorSignerName, creatorSignerDesignation, creatorSignerOrg, signedAt, onSign }: {
  status: ContractStatus
  creatorSignerName: string
  creatorSignerDesignation: string
  creatorSignerOrg: string
  signedAt: string
  onSign: () => void
}) {
  if (status === 'signed') {
    return (
      <div className={`rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/[0.05] to-magenta/[0.03] p-5 ${CARD}`}>
        <div className="mb-3 flex items-center gap-2">
          <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${GRAD_BTN} text-white`}>
            <CheckIcon s={11}/>
          </span>
          <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${GRAD_TEXT}`}>Creator signature</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-[15px] font-extrabold text-ink">{creatorSignerName}</p>
            <p className="text-[12.5px] text-ink/55">{creatorSignerDesignation} · {creatorSignerOrg}</p>
            <p className="mt-0.5 text-[11.5px] text-ink/40">Signed {signedAt}</p>
          </div>
          <div className="hidden flex-col items-end sm:flex">
            <p className="font-['Georgia',serif] text-[22px] italic tracking-wide text-primary/60"
              style={{ fontFamily: 'Georgia, serif' }}>
              {creatorSignerName.split(' ')[0]}
            </p>
            <div className="mt-1 h-px w-32 bg-primary/25"/>
          </div>
        </div>
      </div>
    )
  }

  /* Pending / changes_requested — dashed placeholder */
  return (
    <button onClick={onSign}
      className="group flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/25 bg-primary/[0.02] py-8 text-center transition hover:border-primary/45 hover:bg-primary/[0.04]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 text-primary/50 transition group-hover:border-primary/60 group-hover:text-primary">
        <PenIcon s={18}/>
      </div>
      <p className="text-[13.5px] font-bold text-ink/55 group-hover:text-ink">
        {status === 'changes_requested' ? 'Awaiting revised contract' : 'Your signature goes here'}
      </p>
      <p className="text-[12px] text-ink/35">
        {status === 'changes_requested' ? 'Brand has been notified of your requested changes' : 'Click to review and sign'}
      </p>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STANDARD CONTRACT BODY — identical render to brand's StdStep5
   ════════════════════════════════════════════════════════════════════ */
function StandardContractBody({ c }: { c: StandardContract }) {
  const dealLabel = DEAL_TYPE_LABELS[c.dealType]
  const dt        = DEAL_TYPE_COLORS[c.dealType]

  const budgetSummary =
    c.dealType === 'cash'       ? `${c.currency} ${c.flatAmount}`
    : c.dealType === 'commission' ? `${c.commissionRate}% commission`
    : c.dealType === 'hybrid'     ? `${c.currency} ${c.flatAmount} flat + ${c.commissionRate}% commission`
    : c.customDealDescription || 'Custom'

  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-ink/10 bg-white font-rubik ${CARD}`}>
      {/* Contract header — identical to brand review header */}
      <div className="border-b border-ink/10 px-7 py-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/35">Creator Partnership Agreement</p>
        <h3 className="mt-1 text-[17px] font-extrabold text-ink">{c.campaignName}</h3>
        <p className="mt-1 text-[12px] text-ink/45">
          Between <strong className="text-ink">{c.brandName}</strong> and <strong className="text-ink">{c.creatorName}</strong>
          {' '}· Prepared by Nexfluence
        </p>
        <div className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-bold ${dt.bg} ${dt.text}`}>
          {dealLabel}
        </div>
      </div>

      {/* Contract clauses */}
      <div className="px-7 py-2">
        <ReviewRow label="Deal type"       value={dealLabel}/>
        <ReviewRow label="Brand"           value={`${c.brandName}${c.brandReg ? ` (Reg. ${c.brandReg})` : ''}`}/>
        <ReviewRow label="Creator"         value={`${c.creatorName} ${c.creatorHandle}`}/>
        <ReviewRow label="Campaign"        value={c.campaignName}/>
        {c.campaignObjective && <ReviewRow label="Objective" value={c.campaignObjective}/>}
        <ReviewRow label="Deliverables"    value={c.pieces ? `${c.pieces} piece${Number(c.pieces) !== 1 ? 's' : ''}${c.formats ? ` — ${c.formats}` : ''}` : null}/>
        <ReviewRow label="Platforms"       value={c.platforms}/>
        {c.postingWindow && <ReviewRow label="Posting window" value={c.postingWindow}/>}
        <ReviewRow label="Campaign dates"  value={c.startDate && c.endDate ? `${fmtDate(c.startDate)} → ${fmtDate(c.endDate)}` : fmtDate(c.startDate)}/>
        <ReviewRow label="Usage rights"    value={c.usageRights}/>
        {c.exclusivityPeriod && <ReviewRow label="Exclusivity" value={c.exclusivityPeriod}/>}
        <ReviewRow label="Compensation"    value={budgetSummary}/>
        {c.commissionTracking && <ReviewRow label="Tracking method" value={c.commissionTracking}/>}
        <ReviewRow label="Payment schedule" value={c.paymentSchedule}/>
        {c.invoiceRequired   && <ReviewRow label="Invoice"       value="Required from creator before each payment"/>}
        {c.latePaymentClause && <ReviewRow label="Late payment"  value="1.5% interest per month after 30 days overdue"/>}
        {c.dealType === 'custom' && c.customDealDescription && (
          <ReviewRow label="Custom deal terms" value={
            <span className="text-left text-[13px] leading-[1.55] text-ink/65 whitespace-pre-line">{c.customDealDescription}</span>
          }/>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CUSTOM CONTRACT BODY — identical render to brand's CustStep4
   ════════════════════════════════════════════════════════════════════ */
function CustomContractBody({ c }: { c: CustomContract }) {
  const dealLabel = DEAL_TYPE_LABELS[c.dealType]
  const dt        = DEAL_TYPE_COLORS[c.dealType]

  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-ink/10 bg-white font-rubik ${CARD}`}>
      {/* Header */}
      <div className="border-b border-ink/10 px-7 py-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ink/35">Creator Partnership Agreement</p>
        <h3 className="mt-1 text-[17px] font-extrabold text-ink">{c.campaignName || 'Untitled contract'}</h3>
        <p className="mt-1 text-[12px] text-ink/45">
          Between <strong className="text-ink">{c.brandName}</strong> and <strong className="text-ink">{c.creatorName}</strong>
          {' '}· Prepared by Nexfluence
        </p>
        <div className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-bold ${dt.bg} ${dt.text}`}>
          {dealLabel}
        </div>
        {c.brandReg && <p className="mt-1.5 text-[11px] text-ink/35">{c.brandName} · Reg. {c.brandReg}</p>}
      </div>

      {/* Numbered sections + clauses */}
      <div className="divide-y divide-ink/8 px-7 py-2">
        {c.sections.length === 0 && (
          <p className="py-6 text-center text-[13px] italic text-ink/35">No sections defined.</p>
        )}
        {c.sections.map((section, si) => (
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
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function ContractReadPage() {
  const router = useRouter()

  /* In real app: fetch contract by [id] param */
  const contract: ContractData = ACTIVE_CONTRACT

  const [status,        setStatus]        = useState<ContractStatus>('pending')
  const [signOpen,      setSignOpen]       = useState(false)
  const [changesOpen,   setChangesOpen]    = useState(false)
  const [changesText,   setChangesText]    = useState('')
  const [changesSubmitting, setChangesSubmitting] = useState(false)

  /* Creator signature state — filled after signing */
  const [creatorName,   setCreatorName]   = useState('')
  const [creatorDesig,  setCreatorDesig]  = useState('')
  const [creatorOrg,    setCreatorOrg]    = useState('')
  const [signedAt,      setSignedAt]      = useState('')

  const UNREAD_MESSAGES = 3
  const UNREAD_NOTIFS   = 2

  const handleSign = (name: string, designation: string, org: string) => {
    setCreatorName(name)
    setCreatorDesig(designation)
    setCreatorOrg(org)
    setSignedAt(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    setStatus('signed')
    setSignOpen(false)
  }

  const handleRequestChanges = async () => {
    if (!changesText.trim()) return
    setChangesSubmitting(true)
    await new Promise(r => setTimeout(r, 700))
    setChangesSubmitting(false)
    setStatus('changes_requested')
    setChangesOpen(false)
  }

  const brandName       = contract.brandName
  const contractName    = contract.campaignName
  const brandInitColor  = '#8B31E8'
  const dealType        = contract.dealType
  const dt              = DEAL_TYPE_COLORS[dealType]

  /* ── Compensation summary for sidebar ── */
  const compensationSummary =
    contract.mode === 'standard'
      ? contract.dealType === 'cash'       ? `€${(contract as StandardContract).flatAmount} flat fee`
        : contract.dealType === 'commission' ? `${(contract as StandardContract).commissionRate}% commission`
        : contract.dealType === 'hybrid'     ? `€${(contract as StandardContract).flatAmount} + ${(contract as StandardContract).commissionRate}%`
        : (contract as StandardContract).customDealDescription
      : DEAL_TYPE_LABELS[contract.dealType]

  const piecesCount = contract.mode === 'standard' ? (contract as StandardContract).pieces : null
  const dates = contract.mode === 'standard'
    ? { start: (contract as StandardContract).startDate, end: (contract as StandardContract).endDate }
    : null

  const NAV_LEFT = [
    { label: 'Dashboard', active: false, action: () => router.push('/dashboard/creator') },
    { label: 'Discover',  active: false, action: () => router.push('/discover/brands')   },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ SIGN MODAL ════ */}
      <SignModal
        open={signOpen}
        contractName={contractName}
        brandName={brandName}
        onClose={() => setSignOpen(false)}
        onSign={handleSign}
      />

      {/* ════ HEADER — exact creator dashboard pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5">
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            <div className="relative z-10 flex items-center gap-1.5">
              <button onClick={() => router.push('/creator/messages')} title="Messages" aria-label="Messages"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <ChatBubbleIcon s={18}/>
                {UNREAD_MESSAGES > 0 && (
                  <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>
                    {UNREAD_MESSAGES}
                  </span>
                )}
              </button>
              <button title="Notifications" aria-label="Notifications"
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

        {/* ── Back ── */}
        <button onClick={() => router.back()}
          className="mb-5 flex items-center gap-1.5 text-[13px] font-semibold text-ink/50 transition hover:text-primary">
          <ChevronLeft s={14}/>Back
        </button>

        {/* ════ HERO HEADER CARD ════ */}
        <div className={`mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <div className="flex items-start gap-4">
            <LogoTile name={brandName} color={brandInitColor} size={52}/>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-bold text-ink">{brandName}</p>
                <span className={`rounded-lg px-2.5 py-0.5 text-[10.5px] font-bold ${dt.bg} ${dt.text}`}>
                  {DEAL_TYPE_LABELS[dealType]}
                </span>
                {/* Status badge */}
                {status === 'pending' && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400"/>Awaiting your signature
                  </span>
                )}
                {status === 'signed' && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    <CheckIcon s={11}/>Fully executed
                  </span>
                )}
                {status === 'changes_requested' && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-700">
                    <AlertIcon s={11}/>Changes requested
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-[clamp(18px,2.6vw,24px)] font-black tracking-[-0.02em] leading-tight text-ink">
                {contractName}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink/45">
                <FileTextIcon s={13}/>
                {contract.mode === 'standard' ? 'Standard contract' : 'Custom contract'}
                {' '}· Prepared by Nexfluence
              </p>
            </div>
          </div>
        </div>

        {/* ════ BODY GRID ════ */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── LEFT: Contract content (2/3) ── */}
          <div className="space-y-5 lg:col-span-2">

            {/* Contract body — standard or custom, identical to brand's review render */}
            {contract.mode === 'standard'
              ? <StandardContractBody c={contract as StandardContract}/>
              : <CustomContractBody   c={contract as CustomContract}/>
            }

            {/* ── Brand signature block (read-only, already signed) ── */}
            <div>
              <SectionLabel>Brand signature</SectionLabel>
              <BrandSignatureBlock
                signerName={contract.brandSignerName}
                signerDesignation={contract.brandSignerDesignation}
                signerOrg={contract.brandSignerOrg}
                signedAt={contract.brandSignedAt}
              />
            </div>

            {/* ── Creator signature block ── */}
            <div>
              <SectionLabel>Your signature</SectionLabel>
              <CreatorSignatureBlock
                status={status}
                creatorSignerName={creatorName}
                creatorSignerDesignation={creatorDesig}
                creatorSignerOrg={creatorOrg}
                signedAt={signedAt}
                onSign={() => status === 'pending' && setSignOpen(true)}
              />
            </div>

            {/* ── Request changes panel — expands inline ── */}
            {status === 'pending' && (
              <div>
                {!changesOpen ? (
                  <button onClick={() => setChangesOpen(true)}
                    className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink/40 transition hover:text-amber-600">
                    <AlertIcon s={13}/>Something doesn't look right? Request changes instead
                  </button>
                ) : (
                  <div className={`rounded-2xl border-2 border-amber-200 bg-amber-50 p-5 ${CARD}`}>
                    <div className="mb-3 flex items-center gap-2">
                      <AlertIcon s={16}/>
                      <p className="text-[13.5px] font-extrabold text-amber-800">Request changes</p>
                    </div>
                    <p className="mb-3 text-[12.5px] leading-[1.65] text-amber-700">
                      Describe exactly what you'd like changed. Be specific — {brandName} will receive your note and send a revised contract.
                    </p>
                    <textarea
                      value={changesText}
                      onChange={e => setChangesText(e.target.value)}
                      placeholder={`e.g. Please revise the exclusivity period from 30 days to 14 days. The commission rate should be 10% not 8%. The posting window needs to include Fridays.`}
                      className="min-h-[120px] w-full resize-none rounded-xl border border-amber-200 bg-white px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.12)] placeholder:text-ink/30"
                    />
                    <div className="mt-4 flex items-center gap-3">
                      <button onClick={() => { setChangesOpen(false); setChangesText('') }}
                        className="rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-[13px] font-bold text-amber-700 transition hover:bg-amber-50">
                        Cancel
                      </button>
                      <button
                        onClick={handleRequestChanges}
                        disabled={!changesText.trim() || changesSubmitting}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition ${changesText.trim() && !changesSubmitting ? 'bg-amber-500 hover:bg-amber-600 hover:-translate-y-0.5' : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                        {changesSubmitting
                          ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</>
                          : <><SendIcon s={13}/>Send change request</>
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Changes requested — confirmation */}
            {status === 'changes_requested' && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                <AlertIcon s={18}/>
                <div>
                  <p className="text-[13.5px] font-bold text-amber-800">Changes requested — waiting for {brandName}</p>
                  <p className="mt-0.5 text-[12.5px] text-amber-700">
                    Your feedback has been sent. {brandName} will review and send a revised contract. You'll get a notification when it arrives.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT SIDEBAR (1/3, sticky) ── */}
          <div className="space-y-4 lg:col-span-1">
            <div className="lg:sticky lg:top-[84px] space-y-4">

              {/* ── CTA card ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                {status === 'pending' && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink/40 mb-3">Action required</p>
                    <button onClick={() => setSignOpen(true)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]`}>
                      <PenIcon s={16}/>Sign contract
                    </button>
                    <button onClick={() => setChangesOpen(v => !v)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white py-3 text-[13px] font-bold text-amber-600 transition hover:bg-amber-50">
                      <AlertIcon s={14}/>Request changes
                    </button>
                    <p className="text-center text-[11px] text-ink/35 pt-1">
                      Read the full contract before signing. Once signed this becomes a binding agreement.
                    </p>
                  </div>
                )}

                {status === 'signed' && (
                  <div className="flex flex-col items-center gap-3 py-2 text-center">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_8px_20px_-6px_rgba(139,49,232,0.45)]`}>
                      <CheckIcon s={22}/>
                    </div>
                    <p className="text-[15px] font-extrabold text-ink">Contract fully executed</p>
                    <p className="text-[12.5px] leading-[1.6] text-ink/50">
                      Both parties have signed. This agreement is now binding. A copy has been sent to your messages.
                    </p>
                    <div className="mt-1 flex flex-col gap-2 w-full">
                      <button onClick={() => {/* mock PDF download */}}
                        className="flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
                        <DownloadIcon s={14}/>Download PDF
                      </button>
                      <button onClick={() => router.push('/creator/messages')}
                        className="flex items-center justify-center gap-2 rounded-xl border border-primary/12 bg-white py-2.5 text-[13px] font-bold text-ink/55 transition hover:bg-surface-sub hover:text-ink">
                        <ChatBubbleIcon s={14}/>Open messages
                      </button>
                    </div>
                  </div>
                )}

                {status === 'changes_requested' && (
                  <div className="flex flex-col items-center gap-2 py-2 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                      <AlertIcon s={20}/>
                    </div>
                    <p className="text-[14px] font-extrabold text-amber-800">Changes requested</p>
                    <p className="text-[12px] text-ink/50">Waiting for {brandName} to send a revised contract.</p>
                    <button onClick={() => router.push('/creator/messages')}
                      className="mt-2 flex items-center gap-2 rounded-xl border border-primary/15 px-5 py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
                      <ChatBubbleIcon s={14}/>Message {brandName}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Deal summary ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <SectionLabel>Deal summary</SectionLabel>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-surface-sub p-3.5">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}>
                      <CoinsIcon s={15}/>
                    </div>
                    <div>
                      <p className="text-[13.5px] font-extrabold text-ink">{compensationSummary}</p>
                      <p className="text-[11px] text-ink/45">{DEAL_TYPE_LABELS[dealType]}</p>
                    </div>
                  </div>

                  {piecesCount && (
                    <div className="flex items-center justify-between py-1">
                      <span className="flex items-center gap-1.5 text-[12px] text-ink/50"><FileTextIcon s={13}/>Deliverables</span>
                      <span className="text-[12.5px] font-bold text-ink">
                        {piecesCount} piece{Number(piecesCount) !== 1 ? 's' : ''}
                        {contract.mode === 'standard' && (contract as StandardContract).formats
                          ? ` — ${(contract as StandardContract).formats}` : ''}
                      </span>
                    </div>
                  )}

                  {dates?.start && (
                    <div className="flex items-center justify-between py-1">
                      <span className="flex items-center gap-1.5 text-[12px] text-ink/50"><CalendarIcon s={13}/>Timeline</span>
                      <span className="text-[12.5px] font-bold text-ink">{fmtDate(dates.start)} → {fmtDate(dates.end)}</span>
                    </div>
                  )}

                  {contract.mode === 'standard' && (contract as StandardContract).usageRights && (
                    <div className="flex items-center justify-between py-1">
                      <span className="flex items-center gap-1.5 text-[12px] text-ink/50"><ShieldIcon s={13}/>Usage rights</span>
                      <span className="text-right text-[12px] font-semibold text-ink/70 max-w-[140px]">
                        {(contract as StandardContract).usageRights}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Brand card ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <SectionLabel>Sent by</SectionLabel>
                <div className="flex items-center gap-3 mb-3">
                  <LogoTile name={brandName} color={brandInitColor} size={44}/>
                  <div>
                    <p className="text-[14px] font-extrabold text-ink">{brandName}</p>
                    {contract.brandReg && <p className="text-[11.5px] text-ink/40">Reg. {contract.brandReg}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 mb-3">
                  <CheckIcon s={12}/>
                  <p className="text-[12px] font-semibold text-emerald-700">
                    Signed by <span className="font-bold">{contract.brandSignerName}</span> on {contract.brandSignedAt}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => router.push(`/brand/${brandName.toLowerCase().replace(/\s+/g, '-')}`)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
                    <ExternalLinkIcon s={13}/>View brand profile
                  </button>
                  <button onClick={() => router.push('/creator/messages')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary/12 bg-white py-2.5 text-[13px] font-bold text-ink/55 transition hover:bg-surface-sub hover:text-ink">
                    <ChatBubbleIcon s={14}/>Message {brandName}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ════ STICKY MOBILE ACTION BAR ════ */}
        {status === 'pending' && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
            <div className="mx-auto flex max-w-[440px] gap-2.5">
              <button onClick={() => setChangesOpen(v => !v)}
                className="flex-shrink-0 rounded-xl border border-amber-200 bg-white px-4 py-3 text-[13px] font-bold text-amber-600 transition hover:bg-amber-50">
                Changes
              </button>
              <button onClick={() => setSignOpen(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white ${GRAD_BTN}`}>
                <PenIcon s={15}/>Sign contract
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}