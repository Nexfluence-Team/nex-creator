'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Creator → Brand Review
   app/creator/review/[campaignId]/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   After a campaign completes and payment is received, the creator can
   leave a structured review of the brand or agency they worked with.

   Form sections:
     1. Deal context card (read-only)
     2. Overall star rating (1–5, large, required)
     3. Sub-ratings — Communication · Payment · Brief clarity · Professionalism
     4. "Would you work with them again?" pill selector
     5. Written review (public — shown on brand profile, min 50 chars, required)
     6. Private note to Nexfluence (optional, collapsible amber section)
     7. Post anonymously toggle
     8. Submit CTA

   On submit → success screen with reference number + CTAs.

   Header: creator dashboard pattern (NexLogo centred, breadcrumb left,
   Bell + My Profile right). Form max-w-[640px] centred — single column,
   deliberate focus — no competing sidebar.
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type WorkAgain = 'definitely' | 'maybe' | 'no' | null

interface SubRatings {
  communication: number   /* 0 = not rated, 1–5 */
  payment:       number
  briefClarity:  number
  professionalism: number
}

interface ReviewForm {
  overall:        number
  subRatings:     SubRatings
  workAgain:      WorkAgain
  publicReview:   string
  privateNote:    string
  anonymous:      boolean
}

interface CampaignContext {
  id:             string
  campaignName:   string
  brandName:      string
  brandType:      'brand' | 'agency'
  brandColor:     string
  brandInitials:  string
  completedDate:  string
  compensation:   string
  piecesDelivered: number
  contractId:     string
  brandSlug:      string
}

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA
   ════════════════════════════════════════════════════════════════════ */
const CAMPAIGN: CampaignContext = {
  id:              'cp-kinetics-q3',
  campaignName:    'Vitamin-C Recovery Stack',
  brandName:       'Kinetics',
  brandType:       'brand',
  brandColor:      '#8B31E8',
  brandInitials:   'KI',
  completedDate:   'Jun 20, 2026',
  compensation:    '€440 received (€300 flat + €140 commission)',
  piecesDelivered: 3,
  contractId:      'CTR-2026-002',
  brandSlug:       'kinetics',
}

/* ════════════════════════════════════════════════════════════════════
   STAR RATING LABELS — contextual copy per rating per category
   ════════════════════════════════════════════════════════════════════ */
const OVERALL_LABELS: Record<number, string> = {
  1: 'Poor experience',
  2: 'Below expectations',
  3: 'Decent — room to improve',
  4: 'Good to work with',
  5: 'Excellent — highly recommend',
}

const SUB_LABELS: Record<string, string> = {
  communication: 'How responsive and clear was the brand?',
  payment:       'Were payments accurate and on time?',
  briefClarity:  'Was the brief detailed and easy to work from?',
  professionalism: 'Overall conduct and respect for your work',
}

const SUB_DISPLAY: Record<keyof SubRatings, string> = {
  communication:   'Communication',
  payment:         'Payment reliability',
  briefClarity:    'Brief clarity',
  professionalism: 'Professionalism',
}

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
function ChevLeft({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CheckIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function StarFilledIcon({ s = 28, color = 'currentColor' }: { s?: number; color?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={color}><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z"/></svg>
}
function StarOutlineIcon({ s = 28 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
}
function LockIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function EyeOffIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function CalendarIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function EuroIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BuildingIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function AgencyIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function ExternalLinkIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevronDown({ s = 14, open }: { s?: number; open: boolean }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SparkleIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l2.1-2.1M5.6 18.4l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function FileTextIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   STAR RATING COMPONENT — large interactive, supports hover preview
   ════════════════════════════════════════════════════════════════════ */
function StarRating({ value, onChange, size = 36, readonly = false }: {
  value:    number
  onChange?: (v: number) => void
  size?:    number
  readonly?: boolean
}) {
  const [hovered, setHovered] = useState(0)
  const display = readonly ? value : (hovered || value)

  return (
    <div className="flex items-center gap-1"
      onMouseLeave={() => !readonly && setHovered(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          className={`flex-shrink-0 transition-transform duration-100 ${!readonly ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}`}
          aria-label={`Rate ${n} star${n !== 1 ? 's' : ''}`}
          style={{ WebkitTapHighlightColor: 'transparent' }}>
          {n <= display
            ? <StarFilledIcon s={size}
                color={n <= 2 ? '#f97316' : n <= 3 ? '#eab308' : '#8B31E8'}/>
            : <StarOutlineIcon s={size}/>
          }
        </button>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   COMPACT SUB-RATING ROW
   ════════════════════════════════════════════════════════════════════ */
function SubRatingRow({ label, subLabel, value, onChange }: {
  label:    string
  subLabel: string
  value:    number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-primary/8 bg-surface-sub/60 px-5 py-4 transition hover:border-primary/20 hover:bg-white">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-bold text-ink">{label}</p>
          <p className="text-[11.5px] text-ink/45 leading-snug mt-0.5">{subLabel}</p>
        </div>
        {value > 0 && (
          <span className={`flex-shrink-0 text-[12px] font-extrabold ${GRAD_TEXT}`}>{value}/5</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <StarRating value={value} onChange={onChange} size={22}/>
        {value === 0 && (
          <span className="text-[10.5px] font-semibold text-ink/30">Optional</span>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SECTION HEADER — consistent visual rhythm across form sections
   ════════════════════════════════════════════════════════════════════ */
function SectionHeader({ number, title, subtitle }: {
  number: number; title: string; subtitle?: string
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${GRAD_BTN} text-[12px] font-extrabold text-white mt-0.5`}>
        {number}
      </div>
      <div>
        <h3 className="text-[15px] font-extrabold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-ink/50">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SUCCESS SCREEN
   ════════════════════════════════════════════════════════════════════ */
function SuccessScreen({ form, campaign, reviewRef, onDashboard, onBrandProfile }: {
  form:           ReviewForm
  campaign:       CampaignContext
  reviewRef:      string
  onDashboard:    () => void
  onBrandProfile: () => void
}) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      {/* Success mark */}
      <div className={`mb-6 flex items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_14px_36px_-8px_rgba(139,49,232,0.5)]`}
        style={{ width: 80, height: 80 }}>
        <CheckIcon s={32}/>
      </div>

      <h2 className="text-[26px] font-extrabold tracking-[-0.03em] text-ink">Review submitted!</h2>
      <p className="mt-2 max-w-[380px] text-[14px] leading-[1.7] text-ink/55">
        Your review of <span className="font-bold text-ink">{campaign.brandName}</span> has been received. It'll appear on their profile after a quick moderation check — usually under 24 hours.
      </p>

      {/* What they submitted */}
      <div className={`mt-7 w-full max-w-[440px] overflow-hidden rounded-2xl border border-primary/12 bg-white text-left ${CARD}`}>
        <div className={`px-5 py-4 ${GRAD_BTN}`}>
          <div className="flex items-center gap-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/80">Your review of {campaign.brandName}</p>
            {form.anonymous && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">Anonymous</span>
            )}
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          {/* Stars */}
          <StarRating value={form.overall} size={22} readonly/>
          {/* Review snippet */}
          <p className="text-[13.5px] leading-[1.7] text-ink/70 line-clamp-3">{form.publicReview}</p>
          {/* Work again */}
          {form.workAgain && (
            <p className="text-[12px] font-semibold text-ink/50">
              Work again:{' '}
              <span className={`font-bold ${form.workAgain === 'definitely' ? 'text-emerald-600' : form.workAgain === 'maybe' ? 'text-amber-600' : 'text-rose-600'}`}>
                {form.workAgain === 'definitely' ? 'Definitely ✓' : form.workAgain === 'maybe' ? 'Maybe' : 'No'}
              </span>
            </p>
          )}
        </div>
        <div className="border-t border-primary/8 px-5 py-3">
          <p className="text-[11px] font-semibold text-ink/35">Reference: <span className="font-bold text-ink/55">{reviewRef}</span></p>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-7 flex flex-col gap-2.5 w-full max-w-[360px]">
        <button onClick={onDashboard}
          className={`flex items-center justify-center gap-2 rounded-xl ${GRAD_BTN} px-7 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
          Back to dashboard
        </button>
        <button onClick={onBrandProfile}
          className="flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-7 py-3.5 text-[14px] font-bold text-primary transition hover:bg-primary/[0.04]">
          <ExternalLinkIcon s={14}/>View {campaign.brandName} profile
        </button>
      </div>

      <p className="mt-5 text-[11.5px] text-ink/30">
        Need to update or retract your review? Email <span className="font-semibold text-ink/45">support@nexfluence.eu</span> with reference {reviewRef}.
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function CreatorBrandReviewPage() {
  const router = useRouter()

  const [form, setForm] = useState<ReviewForm>({
    overall:      0,
    subRatings:   { communication: 0, payment: 0, briefClarity: 0, professionalism: 0 },
    workAgain:    null,
    publicReview: '',
    privateNote:  '',
    anonymous:    false,
  })

  const [submitted,    setSubmitted]    = useState(false)
  const [reviewRef,    setReviewRef]    = useState('')
  const [noteExpanded, setNoteExpanded] = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const UNREAD_NOTIFS = 2

  /* Validation */
  const reviewOk   = form.publicReview.trim().length >= 50
  const canSubmit  = form.overall > 0 && reviewOk

  /* Update helpers */
  const setOverall      = (v: number) => setForm(f => ({ ...f, overall: v }))
  const setSubRating    = (key: keyof SubRatings) => (v: number) =>
    setForm(f => ({ ...f, subRatings: { ...f.subRatings, [key]: v } }))
  const setWorkAgain    = (v: WorkAgain) => setForm(f => ({ ...f, workAgain: f.workAgain === v ? null : v }))
  const setPublicReview = (v: string) => setForm(f => ({ ...f, publicReview: v }))
  const setPrivateNote  = (v: string) => setForm(f => ({ ...f, privateNote: v }))
  const setAnonymous    = (v: boolean) => setForm(f => ({ ...f, anonymous: v }))

  const handleSubmit = async () => {
    if (!canSubmit) { textareaRef.current?.focus(); return }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 900))
    const ref = `REV-2026-${String(Math.floor(Math.random() * 900) + 100)}`
    setReviewRef(ref)
    setSubmitted(true)
    setSubmitting(false)
  }

  const NAV_LEFT = [
    { label: 'Dashboard', action: () => router.push('/dashboard/creator') },
    { label: 'Campaigns', action: () => router.push(`/creator/campaign/${CAMPAIGN.id}`) },
    { label: 'Review',    action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ HEADER — creator dashboard pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg,rgba(139,49,232,0.05) 0%,rgba(139,49,232,0.05) 30%,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 58%,rgba(139,49,232,0.05) 70%,rgba(139,49,232,0.05) 100%)' }}/>
            {/* Breadcrumb left nav */}
            <div className="relative z-10 flex items-center gap-0">
              {NAV_LEFT.map((n, i) => (
                <div key={n.label} className="flex items-center gap-0">
                  {i > 0 && <span className="px-1 text-[13px] text-ink/20">/</span>}
                  <button onClick={n.action}
                    className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-2.5 ${i === NAV_LEFT.length - 1 ? 'text-primary' : 'text-ink/55'}`}>
                    {n.label}
                  </button>
                </div>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            {/* Right icon nav */}
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
            {/* NexLogo centred */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">

        {/* ════ SUCCESS SCREEN ════ */}
        {submitted && (
          <SuccessScreen
            form={form}
            campaign={CAMPAIGN}
            reviewRef={reviewRef}
            onDashboard={() => router.push('/dashboard/creator')}
            onBrandProfile={() => router.push(`/brand/${CAMPAIGN.brandSlug}`)}
          />
        )}

        {/* ════ REVIEW FORM ════ */}
        {!submitted && (
          <>
            {/* ── Page title ── */}
            <div className="mb-7 flex items-start gap-3">
              <button onClick={() => router.push(`/creator/campaign/${CAMPAIGN.id}`)}
                className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary">
                <ChevLeft s={14}/>
              </button>
              <div>
                <h1 className="text-[clamp(20px,3vw,26px)] font-extrabold tracking-[-0.03em] leading-tight text-ink">
                  Review your experience
                </h1>
                <p className="mt-1 text-[13.5px] text-ink/50">
                  Your review helps other creators make better decisions — and helps brands improve.
                </p>
              </div>
            </div>

            {/* ── 0. Deal context card ── */}
            <div className={`mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
              {/* Brand bar */}
              <div className="flex items-center gap-3.5 border-b border-primary/8 px-5 py-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white text-[16px]"
                  style={{ background: CAMPAIGN.brandColor }}>
                  {CAMPAIGN.brandInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[16px] font-extrabold text-ink">{CAMPAIGN.brandName}</p>
                    <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${CAMPAIGN.brandType === 'agency' ? 'bg-blue-50 text-blue-600' : 'bg-primary/[0.08] text-primary'}`}>
                      {CAMPAIGN.brandType === 'agency' ? <><AgencyIcon s={9}/>Agency</> : <><BuildingIcon s={9}/>Brand</>}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-ink/45">{CAMPAIGN.campaignName}</p>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-700">
                    <CheckIcon s={11}/>Completed
                  </span>
                </div>
              </div>
              {/* Campaign detail rows */}
              <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
                {[
                  { icon: <CalendarIcon s={12}/>, label: 'Completed', value: CAMPAIGN.completedDate   },
                  { icon: <EuroIcon s={12}/>,     label: 'Received',  value: CAMPAIGN.compensation    },
                  { icon: <FileTextIcon s={12}/>, label: 'Contract',  value: CAMPAIGN.contractId      },
                  { icon: <SparkleIcon s={12}/>,  label: 'Pieces',    value: `${CAMPAIGN.piecesDelivered} approved` },
                ].map((row, i) => (
                  <div key={row.label} className={`flex flex-col gap-0.5 px-5 py-3 ${i < 3 ? 'border-r border-primary/6' : ''} ${i >= 2 ? 'border-t border-primary/6 sm:border-t-0' : ''}`}>
                    <span className="flex items-center gap-1 text-[10.5px] font-semibold text-ink/35">{row.icon}{row.label}</span>
                    <span className="text-[12.5px] font-bold text-ink leading-snug">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">

              {/* ── 1. OVERALL RATING ── */}
              <div className={`rounded-2xl border bg-white p-6 ${CARD} ${form.overall > 0 ? 'border-primary/20' : 'border-primary/10'}`}>
                <SectionHeader
                  number={1}
                  title="Overall rating"
                  subtitle={`How was your overall experience working with ${CAMPAIGN.brandName}?`}
                />

                {/* Stars — large, centred */}
                <div className="flex flex-col items-center gap-4 py-2">
                  <StarRating value={form.overall} onChange={setOverall} size={44}/>
                  {form.overall > 0 ? (
                    <p className={`text-[14px] font-extrabold ${GRAD_TEXT}`}>
                      {OVERALL_LABELS[form.overall]}
                    </p>
                  ) : (
                    <p className="text-[13.5px] text-ink/35">Tap a star to rate</p>
                  )}
                </div>

                {form.overall === 0 && (
                  <p className="mt-3 text-center text-[11.5px] font-semibold text-rose-500">
                    Overall rating is required to submit
                  </p>
                )}
              </div>

              {/* ── 2. SUB-RATINGS ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
                <SectionHeader
                  number={2}
                  title="Rate specific aspects"
                  subtitle="Optional — but detailed ratings help creators understand exactly what to expect."
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(Object.keys(form.subRatings) as (keyof SubRatings)[]).map(key => (
                    <SubRatingRow
                      key={key}
                      label={SUB_DISPLAY[key]}
                      subLabel={SUB_LABELS[key]}
                      value={form.subRatings[key]}
                      onChange={setSubRating(key)}
                    />
                  ))}
                </div>
              </div>

              {/* ── 3. WOULD YOU WORK WITH THEM AGAIN ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
                <SectionHeader
                  number={3}
                  title="Would you work with them again?"
                  subtitle="This feeds the recommendation score on their brand profile."
                />
                <div className="flex flex-wrap gap-3">
                  {([
                    { value: 'definitely' as WorkAgain, label: '👍 Definitely',                    activeCls: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
                    { value: 'maybe'      as WorkAgain, label: '🤷 Maybe — depends on the terms',  activeCls: 'border-amber-400 bg-amber-50 text-amber-700'     },
                    { value: 'no'         as WorkAgain, label: '👎 No — not again',                activeCls: 'border-rose-300 bg-rose-50 text-rose-700'         },
                  ]).map(opt => (
                    <button key={String(opt.value)} type="button" onClick={() => setWorkAgain(opt.value)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-[13.5px] font-bold transition ${
                        form.workAgain === opt.value
                          ? opt.activeCls
                          : 'border-primary/10 bg-white text-ink/60 hover:border-primary/25 hover:text-ink'
                      }`}>
                      {form.workAgain === opt.value && <CheckIcon s={13}/>}
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2.5 text-[11.5px] text-ink/35">Optional · you can change your mind later</p>
              </div>

              {/* ── 4. WRITTEN REVIEW (public) ── */}
              <div className={`rounded-2xl border bg-white p-6 ${CARD} ${!reviewOk && form.publicReview.length > 0 ? 'border-rose-200' : form.publicReview.length >= 50 ? 'border-emerald-200' : 'border-primary/10'}`}>
                <SectionHeader
                  number={4}
                  title="Write your review"
                />
                {/* Public badge */}
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary/[0.05] border border-primary/10 px-3.5 py-2.5">
                  <SparkleIcon s={14}/>
                  <p className="text-[12.5px] font-semibold text-ink/65">
                    This review is <span className="font-bold text-ink">public</span> — it'll appear on {CAMPAIGN.brandName}'s creator profile after moderation.
                  </p>
                </div>

                <textarea
                  ref={textareaRef}
                  value={form.publicReview}
                  onChange={e => setPublicReview(e.target.value)}
                  rows={5}
                  placeholder={`Tell other creators what it was really like to work with ${CAMPAIGN.brandName}. Was the brief clear? Did they communicate well? Were payments on time? The good and the honest — both help.`}
                  className={`w-full resize-y rounded-xl border px-4 py-3.5 text-[14px] leading-[1.75] text-ink outline-none transition placeholder:text-ink/28 focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)] ${
                    form.publicReview.length >= 50
                      ? 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-400'
                      : form.publicReview.length > 0
                        ? 'border-primary/12 bg-surface-sub focus:border-primary'
                        : 'border-primary/12 bg-surface-sub focus:border-primary'
                  }`}
                />

                {/* Character counter + hint */}
                <div className="mt-2 flex items-center justify-between">
                  <p className={`text-[11.5px] font-semibold ${
                    form.publicReview.length >= 50 ? 'text-emerald-600' :
                    form.publicReview.length > 0   ? 'text-amber-600' :
                    'text-ink/35'
                  }`}>
                    {form.publicReview.length < 50
                      ? `${50 - form.publicReview.length} more characters needed`
                      : `${form.publicReview.length} characters · looks good`
                    }
                  </p>
                  <span className="text-[11.5px] text-ink/30">{form.publicReview.length} / min 50</span>
                </div>

                {/* Writing prompts */}
                {form.publicReview.length === 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <p className="w-full text-[11.5px] font-semibold text-ink/35">Prompts to get started:</p>
                    {[
                      'Brief was clear and specific',
                      'Payment was fast',
                      'Great communication throughout',
                      'Would recommend to other creators',
                      'Gave creative freedom',
                    ].map(prompt => (
                      <button key={prompt} onClick={() => setPublicReview(form.publicReview + (form.publicReview ? ' ' : '') + prompt + '.')}
                        className="rounded-lg border border-primary/12 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink/55 transition hover:border-primary/30 hover:text-primary">
                        + {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── 5. PRIVATE NOTE (collapsible, amber) ── */}
              <div className={`overflow-hidden rounded-2xl border transition ${noteExpanded ? 'border-amber-200' : 'border-primary/10 bg-white'} ${CARD}`}>
                <button
                  type="button"
                  onClick={() => setNoteExpanded(e => !e)}
                  className={`flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition ${noteExpanded ? 'bg-amber-50' : 'bg-white hover:bg-surface-sub/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${noteExpanded ? 'bg-amber-100 text-amber-600' : 'bg-surface-sub text-ink/50'}`}>
                      <LockIcon s={15}/>
                    </div>
                    <div className="text-left">
                      <p className={`text-[13.5px] font-bold ${noteExpanded ? 'text-amber-800' : 'text-ink'}`}>
                        Add a private note to Nexfluence
                      </p>
                      <p className={`text-[11.5px] ${noteExpanded ? 'text-amber-600' : 'text-ink/45'}`}>
                        Optional · visible only to the Nexfluence team, never posted publicly
                      </p>
                    </div>
                  </div>
                  <div className={noteExpanded ? 'text-amber-600' : 'text-ink/35'}>
                    <ChevronDown s={16} open={noteExpanded}/>
                  </div>
                </button>

                {noteExpanded && (
                  <div className="border-t border-amber-200 bg-amber-50/60 px-6 py-5">
                    <p className="mb-3 text-[12.5px] leading-[1.7] text-amber-800">
                      Use this if there were issues you'd rather not post publicly — late payments, unexpected brief changes, unprofessional conduct. This goes directly to the Nexfluence team and can prompt internal review or mediation.
                    </p>
                    <textarea
                      value={form.privateNote}
                      onChange={e => setPrivateNote(e.target.value)}
                      rows={3}
                      placeholder="e.g. Payment was 12 days late despite contract stating 7 days. Brand acknowledged the delay but didn't explain why…"
                      className="w-full resize-none rounded-xl border border-amber-200 bg-white px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition placeholder:text-ink/28 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(217,119,6,0.12)]"
                    />
                    {form.privateNote.length > 0 && (
                      <p className="mt-2 text-[11.5px] font-semibold text-amber-600">
                        ✓ Note will be sent to Nexfluence team on submission
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ── 6. ANONYMOUS TOGGLE ── */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <button
                  type="button"
                  onClick={() => setAnonymous(!form.anonymous)}
                  className="flex w-full items-center gap-4 text-left">
                  {/* Toggle pill */}
                  <div className={`relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${form.anonymous ? GRAD_BTN : 'bg-ink/15'}`}>
                    <div className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${form.anonymous ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <EyeOffIcon s={15}/>
                      <p className="text-[14px] font-bold text-ink">Post anonymously</p>
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink/45">
                      Your name won't appear on the review — it'll show as "Verified Creator". The brand won't know it was you. Nexfluence still verifies your identity.
                    </p>
                  </div>
                </button>
              </div>

              {/* ── 7. SUBMIT ── */}
              <div className="space-y-3 pb-8">
                {/* Validation hint */}
                {(!canSubmit) && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-sub px-4 py-3">
                    <p className="text-[12.5px] font-semibold text-ink/50">To submit:</p>
                    <div className="flex flex-wrap gap-2">
                      {form.overall === 0 && (
                        <span className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-[12px] font-bold text-rose-600">
                          · Add your overall star rating
                        </span>
                      )}
                      {!reviewOk && (
                        <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-600">
                          · Write at least 50 characters
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-4.5 text-[15px] font-bold text-white transition ${
                    canSubmit && !submitting
                      ? `${GRAD_BTN} shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] hover:-translate-y-0.5`
                      : 'cursor-not-allowed bg-ink/10 text-ink/30'
                  }`}
                  style={{ paddingTop: '14px', paddingBottom: '14px' }}>
                  {submitting
                    ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Submitting review…</>
                    : <><CheckIcon s={16}/>Submit review of {CAMPAIGN.brandName}</>
                  }
                </button>

                <p className="text-center text-[11.5px] text-ink/35 leading-[1.6]">
                  Your review is subject to Nexfluence's community guidelines. False or defamatory reviews may be removed.
                  {form.anonymous ? '' : ' Your name will be visible on the brand\'s public profile.'}
                </p>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  )
}