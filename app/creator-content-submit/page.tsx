'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Creator content submission
   app/creator/campaign/[id]/submit/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   Creator submits content LINKS (not direct uploads) for each
   deliverable piece in a campaign. One link per piece, plus caption
   draft, hashtags, optional note to brand.

   Three piece states:
     pending_submission → empty form, "Submit for review"
     submitted          → read-only preview + "Edit" escape hatch
     approved           → emerald success, read-only
     revision_requested → brand feedback shown (amber) + re-submit form

   Layout: 2/3 main (piece cards stacked) + 1/3 sticky sidebar
   (campaign summary + brief quick-ref + "coming soon" card).

   Header: creator dashboard pattern (NexLogo pill centred,
   left breadcrumb nav, right Bell + My Profile).
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type ContentStatus = 'pending_submission' | 'submitted' | 'approved' | 'revision_requested'
type Platform      = 'Instagram' | 'TikTok' | 'YouTube'

interface BrandFeedback {
  date: string
  text: string
}

interface PieceSubmission {
  link:       string
  caption:    string
  hashtags:   string[]
  noteToB:    string   /* note to brand */
  submittedAt: string
}

interface DeliverablePiece {
  id:           string
  pieceNumber:  number
  totalPieces:  number
  format:       string          /* "Instagram Reel", "TikTok", "YouTube Short", … */
  platform:     Platform
  deadline:     string
  status:       ContentStatus
  submission:   PieceSubmission | null
  feedback:     BrandFeedback | null  /* set when revision_requested */
}

interface Campaign {
  id:           string
  name:         string
  brandName:    string
  brandColor:   string
  brandInitials:string
  objective:    string
  dealType:     string
  compensation: string
  pieces:       DeliverablePiece[]
  contractId:   string
  opportunityId:string
  briefDos:     string[]
  briefDonts:   string[]
}

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA
   3 pieces — approved, revision_requested, pending_submission
   ════════════════════════════════════════════════════════════════════ */
const CAMPAIGN: Campaign = {
  id:            'cp-kinetics-q3',
  name:          'Vitamin-C Recovery Stack',
  brandName:     'Kinetics',
  brandColor:    '#8B31E8',
  brandInitials: 'KI',
  objective:     'Conversions',
  dealType:      'Hybrid',
  compensation:  '€300 flat + 8% commission',
  contractId:    'CTR-2026-002',
  opportunityId: 'op-kinetics-racedday',
  briefDos: [
    'Show product in your actual training routine — real sweat, real reps',
    'Mention the caffeine-free formula specifically',
    'Include the discount code in bio for 72 hours after posting',
    'Tag @kinetics.lv in the caption',
  ],
  briefDonts: [
    "Don't compare to competitor brands by name",
    "Don't script it — first-person authentic delivery only",
    'No exaggerated performance claims',
    "Don't remove or crop out the product label",
  ],
  pieces: [
    {
      id: 'p1',
      pieceNumber: 1,
      totalPieces: 3,
      format: 'Instagram Reel',
      platform: 'Instagram',
      deadline: 'Jul 15, 2026',
      status: 'approved',
      submission: {
        link:        'https://drive.google.com/file/d/1abc_reel_morning_routine/view',
        caption:     "Morning recovery stack routine with @kinetics.lv — this is genuinely what my post-training wind-down looks like. The Vitamin-C complex has been a game changer for next-day soreness. Link in bio for 10% off 💪",
        hashtags:    ['#KineticsRecovery', '#TrainingRecovery', '#VitaminC', '#AmeliaFit'],
        noteToB:     'Morning light was perfect for this one. Shot three takes — this was the most natural.',
        submittedAt: 'Jun 22, 2026 · 10:14 AM',
      },
      feedback: null,
    },
    {
      id: 'p2',
      pieceNumber: 2,
      totalPieces: 3,
      format: 'TikTok',
      platform: 'TikTok',
      deadline: 'Jul 15, 2026',
      status: 'revision_requested',
      submission: {
        link:        'https://drive.google.com/file/d/1xyz_tiktok_recovery/view',
        caption:     "Ok real talk — I tested Kinetics Recovery Stack vs my old electrolytes for 3 weeks. The difference was actually surprising. Full breakdown in comments 👇 @kinetics.lv",
        hashtags:    ['#RecoveryStack', '#Kinetics', '#MarathonPrep'],
        noteToB:     'Hook-style opening to grab attention in first 2 seconds.',
        submittedAt: 'Jun 23, 2026 · 3:47 PM',
      },
      feedback: {
        date: 'Jun 24, 2026 · 2:14 PM',
        text: "Great energy and the hook is strong! One issue — at the 0:38 mark the video implicitly positions our product against a competitor brand. Please re-edit to remove the competitor product from frame, or replace with a generic 'electrolyte drink' reference. Also please add the affiliate link in bio before resubmitting. Everything else is great!",
      },
    },
    {
      id: 'p3',
      pieceNumber: 3,
      totalPieces: 3,
      format: 'Instagram Story',
      platform: 'Instagram',
      deadline: 'Jul 15, 2026',
      status: 'pending_submission',
      submission: null,
      feedback: null,
    },
  ],
}

/* ════════════════════════════════════════════════════════════════════
   STATUS CONFIG — identical to brand page
   ════════════════════════════════════════════════════════════════════ */
const STATUS_CFG: Record<ContentStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending_submission: { label: 'Not submitted',      bg: 'bg-surface-sub', text: 'text-ink/45',      dot: 'bg-ink/20'      },
  submitted:          { label: 'Awaiting review',    bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
  approved:           { label: 'Approved ✓',         bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  revision_requested: { label: 'Revision requested', bg: 'bg-rose-50',     text: 'text-rose-600',    dot: 'bg-rose-400'    },
}

/* ════════════════════════════════════════════════════════════════════
   PLATFORM COLORS
   ════════════════════════════════════════════════════════════════════ */
const PLATFORM_COLOR: Record<Platform, string> = {
  Instagram: 'text-pink-600 bg-pink-50',
  TikTok:    'text-slate-800 bg-slate-50',
  YouTube:   'text-red-600 bg-red-50',
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
function ChevLeft({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevRight({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LinkIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CheckIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function EditIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function AlertIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function SendIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function FileTextIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
}
function CalendarIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function ExternalLinkIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SparkleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l2.1-2.1M5.6 18.4l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function VideoIcon({ s = 22 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 7l-7 5 7 5V7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChatBubbleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════ */
function isValidUrl(s: string): boolean {
  return s.trim().startsWith('http://') || s.trim().startsWith('https://')
}

function detectLinkSource(url: string): { label: string; color: string } {
  if (url.includes('drive.google.com'))  return { label: 'Google Drive', color: 'text-blue-600'   }
  if (url.includes('dropbox.com'))       return { label: 'Dropbox',      color: 'text-blue-500'   }
  if (url.includes('wetransfer.com'))    return { label: 'WeTransfer',   color: 'text-teal-600'   }
  if (url.includes('tiktok.com'))        return { label: 'TikTok',       color: 'text-slate-800'  }
  if (url.includes('instagram.com'))     return { label: 'Instagram',    color: 'text-pink-600'   }
  if (url.includes('youtube.com') || url.includes('youtu.be'))
                                         return { label: 'YouTube',      color: 'text-red-600'    }
  if (url.startsWith('http'))            return { label: 'Direct link',  color: 'text-ink/55'     }
  return { label: '', color: '' }
}

/* ════════════════════════════════════════════════════════════════════
   TOAST — identical to brand review page
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
   HASHTAG PILL INPUT — type a tag, press Enter or comma to add
   ════════════════════════════════════════════════════════════════════ */
function HashtagInput({ hashtags, onChange }: {
  hashtags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')
  const INP_BASE = 'rounded-xl border border-primary/12 bg-surface-sub text-[13.5px] text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

  const commit = () => {
    const raw = input.trim().replace(/^#+/, '').trim()
    if (!raw) return
    const tag = `#${raw}`
    if (!hashtags.includes(tag)) onChange([...hashtags, tag])
    setInput('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {hashtags.map(h => (
          <span key={h} className="flex items-center gap-1.5 rounded-full bg-primary/[0.08] px-3 py-1 text-[12.5px] font-semibold text-primary">
            {h}
            <button onClick={() => onChange(hashtags.filter(x => x !== h))}
              className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary/60 transition hover:bg-primary hover:text-white">
              <XIcon s={9}/>
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() } }}
        onBlur={commit}
        placeholder="Type a hashtag and press Enter…"
        className={`${INP_BASE} w-full px-4 py-2.5 placeholder:text-ink/30`}
      />
      <p className="mt-1.5 text-[11px] text-ink/35">Press Enter or comma to add · these appear in your caption</p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PIECE CARD
   The main component — handles all four status states.
   ════════════════════════════════════════════════════════════════════ */
function PieceCard({ piece, campaign, onSubmit }: {
  piece:    DeliverablePiece
  campaign: Campaign
  onSubmit: (pieceId: string, data: PieceSubmission) => void
}) {
  /* Form state — pre-fill from existing submission if revision_requested */
  const [link,     setLink]     = useState(piece.submission?.link     ?? '')
  const [caption,  setCaption]  = useState(piece.submission?.caption  ?? '')
  const [hashtags, setHashtags] = useState<string[]>(piece.submission?.hashtags ?? [])
  const [note,     setNote]     = useState(piece.submission?.noteToB  ?? '')
  const [editing,  setEditing]  = useState(false) /* for 'submitted' state edit mode */

  const sc      = STATUS_CFG[piece.status]
  const platCls = PLATFORM_COLOR[piece.platform]
  const isForm  = piece.status === 'pending_submission'
               || piece.status === 'revision_requested'
               || editing

  const linkSource = link ? detectLinkSource(link) : null
  const linkValid  = isValidUrl(link)
  const captionOk  = caption.trim().length >= 20
  const canSubmit  = linkValid && captionOk

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(piece.id, {
      link:        link.trim(),
      caption:     caption.trim(),
      hashtags,
      noteToB:     note.trim(),
      submittedAt: 'Just now',
    })
    setEditing(false)
  }

  const INP = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[13.5px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white ${CARD} ${
      piece.status === 'revision_requested' ? 'border-amber-200' :
      piece.status === 'approved'           ? 'border-emerald-200' :
      'border-primary/10'
    }`}>
      {/* ── Piece header ── */}
      <div className={`flex items-start justify-between gap-3 border-b px-6 py-4 ${
        piece.status === 'revision_requested' ? 'border-amber-100 bg-amber-50/40' :
        piece.status === 'approved'           ? 'border-emerald-100 bg-emerald-50/30' :
        'border-primary/8 bg-surface-sub/50'
      }`}>
        <div className="flex items-center gap-3">
          {/* Piece number bubble */}
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-black text-white text-[16px] ${GRAD_BTN}`}>
            {piece.pieceNumber}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[14.5px] font-extrabold text-ink">
                Piece {piece.pieceNumber} of {piece.totalPieces}
              </p>
              <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${platCls}`}>{piece.format}</span>
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink/45">
              <CalendarIcon s={12}/>Due {piece.deadline}
            </p>
          </div>
        </div>

        {/* Edit button — only for submitted state */}
        {piece.status === 'submitted' && !editing && (
          <button onClick={() => setEditing(true)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3.5 py-2 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.04]">
            <EditIcon s={13}/>Edit
          </button>
        )}
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* ── APPROVED — read-only success ── */}
        {piece.status === 'approved' && !editing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <CheckIcon s={18}/>
              </span>
              <div>
                <p className="text-[14px] font-extrabold text-emerald-800">Content approved by {campaign.brandName} ✓</p>
                <p className="text-[12px] text-emerald-700">Submitted {piece.submission?.submittedAt}</p>
              </div>
            </div>
            {piece.submission && (
              <div className="rounded-xl border border-primary/10 bg-surface-sub/60 px-4 py-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <LinkIcon s={13}/>
                  <a href={piece.submission.link} target="_blank" rel="noopener noreferrer"
                    className="truncate text-[12.5px] font-semibold text-primary hover:underline">
                    {piece.submission.link}
                  </a>
                  <ExternalLinkIcon s={12}/>
                </div>
                <p className="text-[12.5px] leading-[1.6] text-ink/55 line-clamp-2">{piece.submission.caption}</p>
              </div>
            )}
          </div>
        )}

        {/* ── SUBMITTED — read-only preview (or edit mode) ── */}
        {piece.status === 'submitted' && !editing && piece.submission && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
              <AlertIcon s={16}/>
              <div>
                <p className="text-[13px] font-bold text-amber-800">Submitted — awaiting review from {campaign.brandName}</p>
                <p className="text-[11.5px] text-amber-700">{piece.submission.submittedAt}</p>
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-primary/10 bg-surface-sub/60 px-4 py-4">
              {/* Link */}
              <div className="flex items-center gap-2">
                <LinkIcon s={13}/>
                <a href={piece.submission.link} target="_blank" rel="noopener noreferrer"
                  className="truncate flex-1 text-[12.5px] font-semibold text-primary hover:underline">
                  {piece.submission.link}
                </a>
                <ExternalLinkIcon s={12}/>
              </div>
              {/* Caption preview */}
              <p className="text-[13px] leading-[1.65] text-ink/65 whitespace-pre-line">{piece.submission.caption}</p>
              {/* Hashtags */}
              {piece.submission.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {piece.submission.hashtags.map(h => (
                    <span key={h} className="rounded-full bg-primary/[0.08] px-2.5 py-0.5 text-[12px] font-semibold text-primary">{h}</span>
                  ))}
                </div>
              )}
              {/* Note */}
              {piece.submission.noteToB && (
                <p className="border-t border-primary/8 pt-3 text-[12px] italic text-ink/45">
                  Note to brand: "{piece.submission.noteToB}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── REVISION REQUESTED — brand feedback + re-submit form ── */}
        {piece.status === 'revision_requested' && piece.feedback && !editing && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 mb-2">
            <p className="mb-2 text-[10.5px] font-black uppercase tracking-[0.14em] text-amber-700">
              Feedback from {campaign.brandName} · {piece.feedback.date}
            </p>
            <p className="text-[13.5px] leading-[1.75] text-amber-900">{piece.feedback.text}</p>
          </div>
        )}

        {/* ── SUBMISSION FORM (pending / revision / edit mode) ── */}
        {isForm && (
          <div className="space-y-5">
            {editing && (
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-ink">Edit your submission</p>
                <button onClick={() => setEditing(false)}
                  className="text-[12.5px] font-semibold text-ink/45 hover:text-ink">
                  Cancel
                </button>
              </div>
            )}
            {piece.status === 'revision_requested' && !editing && (
              <p className="text-[13.5px] font-bold text-amber-800">Resubmit your revised content below:</p>
            )}

            {/* ── 1. Content link ── */}
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Content link *</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"><LinkIcon s={16}/></span>
                <input
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="Paste your Google Drive, Dropbox, or direct video link…"
                  className={`w-full rounded-xl border px-4 py-3 pl-11 text-[13.5px] text-ink outline-none transition placeholder:text-ink/28 focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)] ${
                    link && !linkValid
                      ? 'border-rose-300 bg-rose-50 focus:border-rose-400'
                      : link && linkValid
                        ? 'border-emerald-300 bg-emerald-50/40 focus:border-emerald-400'
                        : 'border-primary/12 bg-surface-sub focus:border-primary'
                  }`}
                />
                {/* Detected source tag */}
                {linkSource?.label && (
                  <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2.5 py-0.5 text-[11.5px] font-bold border border-primary/10 ${linkSource.color}`}>
                    {linkSource.label}
                  </span>
                )}
              </div>
              {link && !linkValid && (
                <p className="mt-1.5 text-[11.5px] font-semibold text-rose-600">Link must start with https:// — is this the full URL?</p>
              )}

              {/* Accepted sources */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] font-semibold text-ink/35 mr-0.5">Accepted:</span>
                {[
                  { label: 'Google Drive', color: 'text-blue-600 bg-blue-50'  },
                  { label: 'Dropbox',      color: 'text-blue-500 bg-blue-50'  },
                  { label: 'WeTransfer',   color: 'text-teal-600 bg-teal-50'  },
                  { label: 'TikTok',       color: 'text-slate-700 bg-slate-50'},
                  { label: 'Instagram',    color: 'text-pink-600 bg-pink-50'  },
                  { label: 'YouTube',      color: 'text-red-600 bg-red-50'    },
                  { label: 'Direct URL',   color: 'text-ink/55 bg-surface-sub'},
                ].map(src => (
                  <span key={src.label} className={`rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${src.color}`}>
                    {src.label}
                  </span>
                ))}
              </div>
              <p className="mt-1.5 text-[11.5px] text-ink/40 leading-[1.5]">
                Make sure the link is set to <span className="font-bold text-ink">anyone with the link can view</span> before submitting.
              </p>
            </div>

            {/* ── 2. Caption draft ── */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[12px] font-bold text-ink/50">Caption draft *</label>
                <span className={`text-[11px] font-semibold ${captionOk ? 'text-emerald-600' : 'text-ink/35'}`}>
                  {caption.length} chars{!captionOk && caption.length > 0 ? ' (min 20)' : ''}
                </span>
              </div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={4}
                placeholder={`Write the caption you'll post. Remember to:\n· Tag @${campaign.brandName.toLowerCase().replace(' ', '')} in the caption\n· Include the discount code in bio for 72 hours\n· Keep it authentic — first-person voice`}
                className={`w-full resize-y rounded-xl border px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition placeholder:text-ink/28 placeholder:text-[12.5px] focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)] ${
                  captionOk
                    ? 'border-emerald-300 bg-emerald-50/30 focus:border-emerald-400'
                    : 'border-primary/12 bg-surface-sub focus:border-primary'
                }`}
              />
            </div>

            {/* ── 3. Hashtags ── */}
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Hashtags</label>
              <HashtagInput hashtags={hashtags} onChange={setHashtags}/>
            </div>

            {/* ── 4. Note to brand (optional) ── */}
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-ink/50">Note to brand <span className="font-normal text-ink/35">(optional)</span></label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="Anything you want Kinetics to know about this piece — e.g. timing of the clip, why you made certain choices, or a heads-up about post timing…"
                className="w-full resize-none rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]"
              />
            </div>

            {/* ── Submit CTA ── */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold text-white transition ${
                  canSubmit
                    ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`
                    : 'cursor-not-allowed bg-ink/10 text-ink/30'
                }`}>
                <SendIcon s={15}/>
                {piece.status === 'revision_requested'
                  ? 'Resubmit revised content'
                  : editing
                    ? 'Update submission'
                    : `Submit piece ${piece.pieceNumber} for review`
                }
              </button>
              {!canSubmit && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-[11px] font-semibold text-ink/40 leading-snug">
                    {!linkValid && '· Add a valid link\n'}
                    {!captionOk && `· Caption (min 20 chars)`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CAMPAIGN SUMMARY CARD — sidebar
   ════════════════════════════════════════════════════════════════════ */
function CampaignSummaryCard({ campaign, onViewContract }: {
  campaign: Campaign
  onViewContract: () => void
}) {
  const submitted = campaign.pieces.filter(p => p.status !== 'pending_submission').length
  const approved  = campaign.pieces.filter(p => p.status === 'approved').length
  const total     = campaign.pieces.length

  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white text-[15px]"
          style={{ background: campaign.brandColor }}>
          {campaign.brandInitials}
        </div>
        <div>
          <p className="text-[14px] font-extrabold text-ink leading-tight">{campaign.name}</p>
          <p className="text-[12px] text-ink/45">{campaign.brandName}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
          <span className="font-semibold text-ink/50">Pieces submitted</span>
          <span className="font-bold text-ink">{submitted} / {total}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary/[0.08]">
          <div className={`h-full rounded-full transition-all duration-700 ${approved === total ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : GRAD_BTN}`}
            style={{ width: `${(submitted / total) * 100}%` }}/>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink/35">
          <span>{approved} approved</span>
          <span>·</span>
          <span>{total - submitted} remaining</span>
        </div>
      </div>

      {/* Key deal info */}
      <div className="space-y-2 border-t border-primary/8 pt-4">
        {[
          { label: 'Compensation', value: campaign.compensation },
          { label: 'Deal type',    value: campaign.dealType     },
          { label: 'Objective',    value: campaign.objective    },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-ink/45">{row.label}</span>
            <span className="text-[12.5px] font-semibold text-ink">{row.value}</span>
          </div>
        ))}
      </div>

      <button onClick={onViewContract}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
        <FileTextIcon s={14}/>View contract
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   BRIEF QUICK-REF CARD — sidebar
   ════════════════════════════════════════════════════════════════════ */
function BriefQuickRefCard({ campaign, onViewFull }: {
  campaign: Campaign
  onViewFull: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const doItems    = expanded ? campaign.briefDos    : campaign.briefDos.slice(0, 3)
  const dontItems  = expanded ? campaign.briefDonts  : campaign.briefDonts.slice(0, 3)

  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] font-extrabold text-ink">Brief quick-ref</p>
        <button onClick={onViewFull}
          className="text-[12px] font-bold text-primary hover:underline">
          Full brief →
        </button>
      </div>

      {/* Dos */}
      <div className="mb-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">Do</p>
        <ul className="space-y-2">
          {doItems.map((d, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <CheckIcon s={10}/>
              </span>
              <span className="text-[12.5px] leading-[1.5] text-ink/65">{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Don'ts */}
      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-rose-500">Don't</p>
        <ul className="space-y-2">
          {dontItems.map((d, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-400">
                <XIcon s={9}/>
              </span>
              <span className="text-[12.5px] leading-[1.5] text-ink/65">{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {(campaign.briefDos.length > 3 || campaign.briefDonts.length > 3) && (
        <button onClick={() => setExpanded(e => !e)}
          className="mt-3 text-[12px] font-semibold text-primary/70 hover:text-primary">
          {expanded ? 'Show less' : `+${Math.max(campaign.briefDos.length - 3, campaign.briefDonts.length - 3)} more items`}
        </button>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   COMING SOON CARD — sidebar
   "Direct uploads coming soon — for now paste a link"
   ════════════════════════════════════════════════════════════════════ */
function ComingSoonCard() {
  return (
    <div className={`overflow-hidden rounded-2xl border-2 bg-white ${CARD}`}
      style={{ borderImage: 'linear-gradient(135deg, #8B31E8, #FF33BC) 1' }}>
      {/* Gradient top accent */}
      <div className={`h-1 w-full ${GRAD_BTN}`}/>

      <div className="px-5 py-5">
        <div className="mb-3 flex items-center gap-2.5">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.42)]`}>
            <VideoIcon s={17}/>
          </div>
          <div>
            <p className="text-[13.5px] font-extrabold text-ink leading-tight">Direct uploads</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.09] px-2 py-0.5 text-[10px] font-bold text-primary">
              <SparkleIcon s={9}/>Coming soon
            </span>
          </div>
        </div>

        <p className="text-[13px] leading-[1.7] text-ink/65">
          We're building native video upload so you can share content directly on Creator Nexus — no external link needed. Brands will be able to preview your content right inside the platform.
        </p>

        <div className="mt-3 rounded-xl bg-primary/[0.05] border border-primary/10 px-3.5 py-3">
          <p className="text-[12px] leading-[1.6] text-ink/55">
            <span className="font-bold text-ink">For now:</span> upload your video to Google Drive or Dropbox, set it to "anyone with the link can view", then paste the link in the form above.
          </p>
        </div>

        <p className="mt-3 text-[11px] text-ink/35 leading-[1.6]">
          ✦ Early access available for verified creators — we'll notify you when direct uploads go live.
        </p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function CreatorContentSubmitPage() {
  const router = useRouter()

  const [campaign,     setCampaign]     = useState<Campaign>(CAMPAIGN)
  const [activePieceN, setActivePieceN] = useState(1) /* 1-based */
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg,     setToastMsg]     = useState('')

  const UNREAD_NOTIFS = 2

  const piece: DeliverablePiece = campaign.pieces.find((p: DeliverablePiece) => p.pieceNumber === activePieceN)!

  const showToast = (msg: string) => {
    setToastMsg(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const handleSubmit = (pieceId: string, data: PieceSubmission) => {
    setCampaign(prev => ({
      ...prev,
      pieces: prev.pieces.map(p =>
        p.id !== pieceId ? p : { ...p, status: 'submitted' as ContentStatus, submission: data }
      ),
    }))
    showToast(`Piece ${piece.pieceNumber} submitted · ${campaign.brandName} will review shortly`)
  }

  const totalPieces = campaign.pieces.length
  const prevPiece   = activePieceN > 1          ? activePieceN - 1 : null
  const nextPiece   = activePieceN < totalPieces ? activePieceN + 1 : null

  const NAV_LEFT = [
    { label: 'Dashboard',       action: () => router.push('/dashboard/creator') },
    { label: campaign.name,     action: () => router.push(`/creator/campaign/${campaign.id}`) },
    { label: 'Submit content',  action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ TOAST ════ */}
      <Toast visible={toastVisible} message={toastMsg}/>

      {/* ════ HEADER — creator dashboard pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg,rgba(139,49,232,0.05) 0%,rgba(139,49,232,0.05) 30%,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 58%,rgba(139,49,232,0.05) 70%,rgba(139,49,232,0.05) 100%)' }}/>

            {/* Left — breadcrumb */}
            <div className="relative z-10 flex items-center gap-0">
              {NAV_LEFT.map((n, i) => (
                <div key={n.label} className="flex items-center gap-0">
                  {i > 0 && <span className="px-1 text-[13px] text-ink/20">/</span>}
                  <button onClick={n.action}
                    className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-2.5 ${i === NAV_LEFT.length - 1 ? 'text-primary' : 'text-ink/55'}`}>
                    <span className="hidden sm:inline">{n.label}</span>
                    <span className="sm:hidden">{i === 0 ? 'Dashboard' : i === NAV_LEFT.length - 1 ? 'Submit' : ''}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>

            {/* Right — icon buttons */}
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

            {/* NexLogo pill — centred */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-4 py-6 sm:px-6 sm:py-8">

        {/* ── Page title row ── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button onClick={() => router.push(`/creator/campaign/${campaign.id}`)}
              className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary">
              <ChevLeft s={14}/>
            </button>
            <div>
              <h1 className="text-[clamp(17px,2.5vw,22px)] font-extrabold tracking-[-0.02em] text-ink">
                Submit content
              </h1>
              <p className="mt-0.5 text-[12.5px] text-ink/45">
                {campaign.name} · {campaign.brandName} · {totalPieces} piece{totalPieces !== 1 ? 's' : ''} required
              </p>
            </div>
          </div>

          {/* Piece navigation */}
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button disabled={!prevPiece} onClick={() => prevPiece && setActivePieceN(prevPiece)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30">
              <ChevLeft s={14}/>
            </button>
            <span className="text-[12px] font-semibold text-ink/40 px-1">
              {activePieceN} / {totalPieces}
            </span>
            <button disabled={!nextPiece} onClick={() => nextPiece && setActivePieceN(nextPiece)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30">
              <ChevRight s={14}/>
            </button>
          </div>
        </div>

        {/* ── Piece quick-nav tabs ── */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {campaign.pieces.map((p: DeliverablePiece) => {
            const sc  = STATUS_CFG[p.status]
            const act = p.pieceNumber === activePieceN
            return (
              <button key={p.id} onClick={() => setActivePieceN(p.pieceNumber)}
                className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px] font-bold transition ${
                  act
                    ? 'border-primary/25 bg-primary/[0.07] text-primary'
                    : 'border-primary/10 bg-white text-ink/55 hover:border-primary/20'
                }`}>
                <span className={`h-2 w-2 rounded-full ${sc.dot}`}/>
                Piece {p.pieceNumber}
                <span className="hidden sm:inline text-[11px] font-medium opacity-70">— {p.format}</span>
              </button>
            )
          })}
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── LEFT: Piece card (2/3) ── */}
          <div className="lg:col-span-2">
            <PieceCard
              key={piece.id}   /* re-mount on piece change to reset form state */
              piece={piece}
              campaign={campaign}
              onSubmit={handleSubmit}
            />
          </div>

          {/* ── RIGHT: Sidebar (1/3) ── */}
          <div className="space-y-4 lg:col-span-1">
            <div className="lg:sticky lg:top-[84px] space-y-4">
              <CampaignSummaryCard
                campaign={campaign}
                onViewContract={() => router.push(`/creator/contract/${campaign.contractId}`)}
              />
              <BriefQuickRefCard
                campaign={campaign}
                onViewFull={() => router.push(`/creator/opportunity/${campaign.opportunityId}`)}
              />
              <ComingSoonCard/>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}