'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Agency Content Review — app/agency/campaign/[id]/review/[pieceId]/page.tsx
   Nexfluence v4, LIGHT
   ════════════════════════════════════════════════════════════════════

   HOW THIS DIFFERS FROM /brand/campaign/[id]/review/[pieceId]:
   ─────────────────────────────────────────────────────────────────
   1. AGENCY ATTRIBUTION BADGE
      A small badge near the creator card shows "Reviewing on behalf
      of Kinetics" — the agency is approving content as the operator,
      but the approval ultimately represents the brand's sign-off.

   2. HEADER BREADCRUMB
      Dashboard / Campaigns / [Campaign] / Review — agency pattern,
      with Bell+badge and My Profile on the right (no second-level
      ChatBubble icon; agency messages live at /agency/messages).

   3. ROUTING
      All /brand/... and /messages routes become /agency/... routes.
      Campaign back-link goes to /agency/campaign/[id].

   4. FEEDBACK COMPOSER NOTE
      Updated copy: "This message will be sent to {creator} via
      Messages on behalf of {brand}."

   5. ESCALATE TO DISPUTE
      Routes to /agency/dispute/new (placeholder, mirrors brand flow).

   Everything else — platform mockups (TikTok/Instagram/YouTube),
   stats strip, caption card, brief compliance checklist, feedback
   history — is a verbatim port. The review mechanics don't change
   just because an agency operates the campaign.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ─── Types ──────────────────────────────────────────────────────── */
type ContentStatus = 'pending_submission' | 'submitted' | 'approved' | 'revision_requested'
type Platform      = 'Instagram' | 'TikTok' | 'YouTube'

interface FeedbackEntry {
  id: string
  date: string
  text: string
  type: 'revision_request' | 'approval' | 'note'
}

interface ContentPiece {
  id: string
  pieceNumber: number
  totalPieces: number
  format: string
  platform: Platform
  title: string
  caption: string
  hashtags: string[]
  submittedDate: string
  status: ContentStatus
  thumbnailColor: string
  gradientEnd: string
  stats: { views: string; likes: string; comments: string; shares: string; saves: string; engagement: string }
  creator: {
    id: string; name: string; handle: string; initials: string; color: string
    platform: Platform; followers: string; campaignName: string; contractId: string
    prevPieceId: string | null; nextPieceId: string | null
  }
  brand: { name: string; color: string; initials: string }
  feedbackHistory: FeedbackEntry[]
}

/* ─── Brief checklist — identical pattern to brand page ──────────── */
interface CheckItem { id: string; type: 'do' | 'dont'; label: string; required: boolean }

const BRIEF_CHECKLIST: CheckItem[] = [
  { id: 'c1', type: 'do',   label: 'Shows authentic, sweaty effort — not staged', required: true  },
  { id: 'c2', type: 'do',   label: 'Electrolyte formula featured during/after workout', required: true  },
  { id: 'c3', type: 'do',   label: 'Targets women 22–38 demographic tone',        required: false },
  { id: 'c4', type: 'do',   label: 'Brand handle @kinetics.lv tagged',            required: true  },
  { id: 'c5', type: 'dont', label: 'No comparison to competitor products',        required: true  },
  { id: 'c6', type: 'dont', label: 'No medicinal / disease-cure claims',          required: true  },
  { id: 'c7', type: 'dont', label: 'No overly polished or filtered aesthetic',    required: false },
  { id: 'c8', type: 'dont', label: 'Brand identity unaltered',                    required: true  },
]

/* ─── Mock data — Sandra Liepa's revision-requested piece ────────── */
const PIECE_DATA: ContentPiece = {
  id: 'p4',
  pieceNumber: 2,
  totalPieces: 2,
  format: 'TikTok',
  platform: 'TikTok',
  title: 'Post-Yoga Hydration Routine',
  caption: 'My hot yoga recovery non-negotiable 🔥 Sweated through an entire 75-min flow and this electrolyte mix is the only thing that gets me back to normal within 20 minutes. Been using @kinetics.lv for 3 weeks now and honestly didn t expect to feel this much of a difference.\n\nFull routine breakdown in comments 👇\n\n#HotYogaRecovery #Kinetics #ElectrolyteBalance #YogaLife #PostWorkout',
  hashtags: ['#HotYogaRecovery', '#Kinetics', '#ElectrolyteBalance', '#YogaLife', '#PostWorkout'],
  submittedDate: 'Jun 28, 2026',
  status: 'revision_requested',
  thumbnailColor: '#DB2777',
  gradientEnd: '#9d174d',
  stats: { views: '52.4K', likes: '3.8K', comments: '341', shares: '298', saves: '215', engagement: '9.6%' },
  creator: {
    id: 'cr2', name: 'Sandra Liepa', handle: '@sandra.liepa', initials: 'SL', color: '#DB2777',
    platform: 'TikTok', followers: '89K',
    campaignName: 'Electrolyte Hot Yoga',
    contractId: 'CTR-AC1-002',
    prevPieceId: 'p3',
    nextPieceId: null,
  },
  brand: { name: 'Kinetics', color: '#8B31E8', initials: 'KI' },
  feedbackHistory: [
    {
      id: 'fb1',
      date: 'Jun 29, 2026 · 11:08 AM',
      type: 'revision_request',
      text: 'Love the energy and the hook lands well! One thing — at 0:42 there\'s a competitor electrolyte tub visible in frame on the shelf. Could you re-shoot that angle or blur it out? Also the brand handle isn\'t tagged in the caption yet — please add @kinetics.lv before resubmitting.',
    },
  ],
}

/* ════════════════════════════════════════════════════════════════════
   ICONS — inline SVG only
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function Check({ s = 13 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 13 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function ChevLeft({ s = 15 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChevRight({ s = 15 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SendIcon({ s = 15 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EyeIcon({ s = 15 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function HeartIcon({ s = 15 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChatIcon({ s = 15 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ShareIcon({ s = 15 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BookmarkIcon({ s = 15 }: { s?: number }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 3.5h12a1 1 0 011 1V21l-7-4-7 4V4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> }
function PlayIcon({ s = 32 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> }
function AlertIcon({ s = 16 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function RefreshIcon({ s = 14 }: { s?: number }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 15 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function MusicIcon({ s = 13 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function SparkleIcon({ s = 12 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l2.1-2.1M5.6 18.4l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function BellIcon({ s = 18 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function BriefcaseIcon({ s = 13 }: { s?: number }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   PLATFORM CONTENT MOCK-UPS — verbatim port from brand page
   ════════════════════════════════════════════════════════════════════ */
function TikTokFrame({ piece }: { piece: ContentPiece }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative mx-auto overflow-hidden rounded-2xl" style={{ width: 280, height: 496, background: `linear-gradient(160deg, ${piece.thumbnailColor} 0%, ${piece.gradientEnd} 100%)` }}>
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }}/>
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-10 pb-3">
        <span className="text-[13px] font-semibold text-white/70">Following</span>
        <span className="text-[13px] font-bold text-white">For You</span>
        <span className="text-[13px] font-semibold text-white/70">LIVE</span>
        <div className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-white"/>
      </div>
      <button onClick={() => setPlaying(p => !p)} className="absolute inset-0 flex items-center justify-center">
        {!playing && <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"><PlayIcon s={28}/></div>}
        {playing && <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-white"><div className="flex gap-1.5"><div className="h-5 w-1.5 rounded-full bg-white"/><div className="h-5 w-1.5 rounded-full bg-white"/></div></div>}
      </button>
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-0.5"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white"><HeartIcon s={19}/></div><span className="text-[10px] font-bold text-white">{piece.stats.likes}</span></div>
        <div className="flex flex-col items-center gap-0.5"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white"><ChatIcon s={18}/></div><span className="text-[10px] font-bold text-white">{piece.stats.comments}</span></div>
        <div className="flex flex-col items-center gap-0.5"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white"><BookmarkIcon s={18}/></div><span className="text-[10px] font-bold text-white">{piece.stats.saves}</span></div>
        <div className="flex flex-col items-center gap-0.5"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white"><ShareIcon s={18}/></div><span className="text-[10px] font-bold text-white">{piece.stats.shares}</span></div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-black/30" style={{ animation: 'spin 4s linear infinite' }}><MusicIcon s={14}/></div>
      </div>
      <div className="absolute bottom-0 left-0 right-12 px-4 pb-8">
        <p className="text-[12.5px] font-bold text-white">{piece.creator.handle}</p>
        <p className="mt-1 text-[11.5px] leading-[1.5] text-white/85 line-clamp-3">{piece.caption.split('\n')[0]}</p>
        <div className="mt-2 flex items-center gap-1.5"><MusicIcon s={11}/><p className="text-[10.5px] text-white/70 truncate">original sound · {piece.creator.name}</p></div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function InstagramFrame({ piece }: { piece: ContentPiece }) {
  const [playing, setPlaying] = useState(false)
  const [liked, setLiked]     = useState(false)
  const [saved, setSaved]     = useState(false)
  return (
    <div className="mx-auto overflow-hidden rounded-2xl bg-black" style={{ width: 280 }}>
      <div className="flex items-center gap-2.5 bg-black px-3 py-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: `linear-gradient(135deg, ${piece.thumbnailColor}, ${piece.gradientEnd})` }}>
          <span className="text-[10px] font-black text-white">{piece.creator.initials}</span>
        </div>
        <div className="flex-1 min-w-0"><p className="text-[12px] font-bold text-white truncate">{piece.creator.handle}</p></div>
        <button className="rounded-full border border-white/40 px-3 py-0.5 text-[11px] font-bold text-white">Follow</button>
        <span className="text-white/60 text-lg">···</span>
      </div>
      <div className="relative" style={{ height: 420, background: `linear-gradient(160deg, ${piece.thumbnailColor} 0%, ${piece.gradientEnd} 100%)` }}>
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.3) 28px, rgba(255,255,255,0.3) 29px)', backgroundSize: '100% 29px' }}/>
        <button onClick={() => setPlaying(p => !p)} className="absolute inset-0 flex items-center justify-center">
          {!playing && <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white"><PlayIcon s={24}/></div>}
        </button>
        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/30 px-2 py-1 backdrop-blur-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" fill="none"/><circle cx="12" cy="12" r="3" fill="white"/></svg>
          <span className="text-[10px] font-bold text-white">REELS</span>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1"><EyeIcon s={12}/><span className="text-[11.5px] font-bold text-white">{piece.stats.views} views</span></div>
      </div>
      <div className="flex items-center justify-between bg-black px-4 py-2.5">
        <div className="flex items-center gap-4">
          <button onClick={() => setLiked(l => !l)} className={liked ? 'text-rose-500' : 'text-white'}><HeartIcon s={22}/></button>
          <button className="text-white"><ChatIcon s={21}/></button>
          <button className="text-white"><ShareIcon s={21}/></button>
        </div>
        <button onClick={() => setSaved(s => !s)} className="text-white"><BookmarkIcon s={21}/></button>
      </div>
      <div className="bg-black px-4 pb-4">
        <p className="text-[12px] font-bold text-white">{piece.stats.likes} likes</p>
        <p className="mt-1 text-[12px] text-white/80 line-clamp-2"><span className="font-bold">{piece.creator.handle}</span> {piece.caption.split('\n')[0]}</p>
        <p className="mt-1 text-[11px] text-blue-400">{piece.hashtags.slice(0, 3).join(' ')}</p>
      </div>
    </div>
  )
}

function YouTubeFrame({ piece }: { piece: ContentPiece }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="mx-auto overflow-hidden rounded-xl bg-[#0f0f0f]" style={{ width: 320 }}>
      <div className="relative" style={{ height: 180, background: `linear-gradient(160deg, ${piece.thumbnailColor} 0%, ${piece.gradientEnd} 100%)` }}>
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <svg width="52" height="12" viewBox="0 0 90 20" fill="none"><path d="M32.5 0H57.5C63.023 0 67.5 4.477 67.5 10C67.5 15.523 63.023 20 57.5 20H32.5C26.977 20 22.5 15.523 22.5 10C22.5 4.477 26.977 0 32.5 0Z" fill="#FF0000"/><path d="M37 6.5L46 10L37 13.5V6.5Z" fill="white"/><path d="M71 3H74.5L77 11.5L79.5 3H83L79 15.5H75L71 3Z" fill="white"/><path d="M83.5 3H87V15.5H83.5V3Z" fill="white"/></svg>
        </div>
        <button onClick={() => setPlaying(p => !p)} className="absolute inset-0 flex items-center justify-center">
          {!playing && <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg"><PlayIcon s={22}/></div>}
        </button>
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5"><span className="text-[10px] font-bold text-white">8:42</span></div>
      </div>
      <div className="h-1 w-full bg-white/20"><div className="h-full w-[35%] bg-red-600"/></div>
      <div className="flex gap-3 p-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ background: piece.thumbnailColor }}><span className="text-[11px] font-black text-white">{piece.creator.initials}</span></div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-semibold text-white leading-snug line-clamp-2">{piece.title}</p>
          <p className="mt-1 text-[11px] text-white/50">{piece.creator.handle} · {piece.stats.views} views · {piece.submittedDate}</p>
        </div>
        <button className="text-white/50 flex-shrink-0">···</button>
      </div>
      <div className="flex items-center gap-3 border-t border-white/10 px-3 py-2.5">
        <div className="flex items-center gap-1 text-white/70"><HeartIcon s={13}/><span className="text-[11px]">{piece.stats.likes}</span></div>
        <div className="flex items-center gap-1 text-white/70"><ChatIcon s={13}/><span className="text-[11px]">{piece.stats.comments}</span></div>
        <div className="flex items-center gap-1 text-white/70"><ShareIcon s={13}/><span className="text-[11px]">{piece.stats.shares}</span></div>
        <span className="ml-auto text-[11px] font-semibold text-red-400">{piece.stats.engagement} eng.</span>
      </div>
    </div>
  )
}

function PlatformMockup({ piece }: { piece: ContentPiece }) {
  if (piece.platform === 'TikTok')  return <TikTokFrame piece={piece}/>
  if (piece.platform === 'YouTube') return <YouTubeFrame piece={piece}/>
  return <InstagramFrame piece={piece}/>
}

/* ─── Status badge config ──────────────────────────────────────── */
const STATUS_CFG: Record<ContentStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending_submission: { label: 'Not submitted',      bg: 'bg-surface-sub', text: 'text-ink/45',      dot: 'bg-ink/20'      },
  submitted:          { label: 'Awaiting review',    bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
  approved:           { label: 'Approved ✓',         bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  revision_requested: { label: 'Revision requested', bg: 'bg-rose-50',     text: 'text-rose-600',    dot: 'bg-rose-400'    },
}

/* ════════════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════════════ */
function Toast({ visible, message }: { visible: boolean; message: string }) {
  return (
    <div className={`fixed bottom-6 left-1/2 z-[800] -translate-x-1/2 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
      <div className={`flex items-center gap-3 rounded-2xl ${GRAD_BTN} px-5 py-3.5 shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]`}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white"><Check s={13}/></span>
        <p className="text-[13.5px] font-bold text-white">{message}</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   AGENCY ATTRIBUTION BADGE
   ════════════════════════════════════════════════════════════════════ */
function AgencyAttributionBadge({ brandName }: { brandName: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/12 bg-primary/[0.04] px-3.5 py-2.5">
      <BriefcaseIcon s={13}/>
      <p className="text-[12px] font-semibold text-primary/80">
        Reviewing as <span className="font-extrabold">Baltic Creators Agency</span> on behalf of <span className="font-extrabold">{brandName}</span>
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function AgencyContentReviewPage() {
  const router = useRouter()

  const [piece,  setPiece]  = useState<ContentPiece>(PIECE_DATA)
  const [status, setStatus] = useState<ContentStatus>(PIECE_DATA.status)

  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(BRIEF_CHECKLIST.map(c => [c.id, false]))
  )
  const toggleCheck = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  const requiredPassed = BRIEF_CHECKLIST.filter(c => c.required).every(c => checked[c.id])
  const allDos   = BRIEF_CHECKLIST.filter(c => c.type === 'do')
  const allDonts = BRIEF_CHECKLIST.filter(c => c.type === 'dont')

  const [feedback,     setFeedback]     = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg,     setToastMsg]     = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const UNREAD_NOTIFS = 3

  const showToast = (msg: string) => { setToastMsg(msg); setToastVisible(true); setTimeout(() => setToastVisible(false), 3000) }

  const handleApprove = () => {
    setStatus('approved')
    const approval: FeedbackEntry = { id: `fb${Date.now()}`, date: 'Just now', type: 'approval', text: feedback.trim() || 'Content approved — great work!' }
    setPiece(prev => ({ ...prev, feedbackHistory: [...prev.feedbackHistory, approval] }))
    setFeedback('')
    showToast('Content approved · creator notified via message')
  }

  const handleRequestRevision = () => {
    if (!feedback.trim()) { textareaRef.current?.focus(); return }
    setStatus('revision_requested')
    const entry: FeedbackEntry = { id: `fb${Date.now()}`, date: 'Just now', type: 'revision_request', text: feedback.trim() }
    setPiece(prev => ({ ...prev, feedbackHistory: [...prev.feedbackHistory, entry] }))
    setFeedback('')
    showToast('Revision requested · feedback sent to creator')
  }

  const handleSendNote = () => {
    if (!feedback.trim()) return
    const entry: FeedbackEntry = { id: `fb${Date.now()}`, date: 'Just now', type: 'note', text: feedback.trim() }
    setPiece(prev => ({ ...prev, feedbackHistory: [...prev.feedbackHistory, entry] }))
    setFeedback('')
    showToast('Note sent to creator via messages')
  }

  const sc = STATUS_CFG[status as ContentStatus]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      <Toast visible={toastVisible} message={toastMsg}/>

      {/* ════ HEADER — agency breadcrumb pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg,rgba(139,49,232,0.05) 0%,rgba(139,49,232,0.05) 30%,rgba(255,255,255,0) 42%,rgba(255,255,255,0) 58%,rgba(139,49,232,0.05) 70%,rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {[
                { label: 'Dashboard', action: () => router.push('/dashboard/agency') },
                { label: 'Campaigns', action: () => {} },
                { label: piece.creator.campaignName.length > 18 ? piece.creator.campaignName.slice(0, 16) + '…' : piece.creator.campaignName, action: () => router.push('/agency/campaign/ac1') },
                { label: 'Review', action: () => {}, active: true },
              ].map((n, i) => (
                <div key={n.label} className="flex items-center gap-0.5">
                  {i > 0 && <span className="text-ink/20 text-[13px] px-0.5">/</span>}
                  <button onClick={n.action}
                    className={`rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3 ${(n as { active?: boolean }).active ? 'text-primary' : 'text-ink/55'}`}>
                    {n.label}
                  </button>
                </div>
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
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.40)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-6 py-8">

        {/* Page title row */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button onClick={() => router.push('/agency/campaign/ac1')}
              className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary">
              <ChevLeft s={14}/>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-[clamp(17px,2.5vw,22px)] font-extrabold tracking-[-0.02em] text-ink">{piece.title}</h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
                </span>
              </div>
              <p className="text-[12.5px] text-ink/45">
                {piece.format} · {piece.creator.campaignName} · Piece {piece.pieceNumber} of {piece.totalPieces} · Submitted {piece.submittedDate}
              </p>
            </div>
          </div>
          {/* Piece navigation */}
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <button disabled={!piece.creator.prevPieceId}
              onClick={() => piece.creator.prevPieceId && router.push(`/agency/campaign/ac1/review/${piece.creator.prevPieceId}`)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30">
              <ChevLeft s={14}/>
            </button>
            <span className="text-[12px] font-semibold text-ink/40 px-1">{piece.pieceNumber} / {piece.totalPieces}</span>
            <button disabled={!piece.creator.nextPieceId}
              onClick={() => piece.creator.nextPieceId && router.push(`/agency/campaign/ac1/review/${piece.creator.nextPieceId}`)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/15 text-ink/50 transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30">
              <ChevRight s={14}/>
            </button>
          </div>
        </div>

        {/* Agency attribution badge */}
        <div className="mb-6">
          <AgencyAttributionBadge brandName={piece.brand.name}/>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* LEFT: Content viewer */}
          <div className="flex flex-col gap-4 lg:flex-1">
            <div className={`flex items-center justify-center rounded-2xl border border-primary/10 bg-gradient-to-br from-ink to-ink/80 py-8 px-6 ${CARD}`}>
              <PlatformMockup piece={piece}/>
            </div>

            <div className={`grid grid-cols-3 gap-0 overflow-hidden rounded-2xl border border-primary/10 bg-white sm:grid-cols-6 ${CARD}`}>
              {[
                { icon: <EyeIcon s={14}/>,      label: 'Views',      value: piece.stats.views      },
                { icon: <HeartIcon s={14}/>,    label: 'Likes',      value: piece.stats.likes      },
                { icon: <ChatIcon s={14}/>,     label: 'Comments',   value: piece.stats.comments   },
                { icon: <ShareIcon s={14}/>,    label: 'Shares',     value: piece.stats.shares     },
                { icon: <BookmarkIcon s={14}/>, label: 'Saves',      value: piece.stats.saves      },
                { icon: <SparkleIcon s={14}/>,  label: 'Engagement', value: piece.stats.engagement },
              ].map((stat, i) => (
                <div key={stat.label} className={`flex flex-col items-center justify-center gap-1.5 py-4 ${i < 5 ? 'border-b sm:border-b-0 sm:border-r border-primary/8' : ''}`}>
                  <span className="text-ink/40">{stat.icon}</span>
                  <span className={`text-[16px] font-extrabold ${GRAD_TXT}`}>{stat.value}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/35">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
              <p className="mb-2 text-[10.5px] font-black uppercase tracking-[0.16em] text-ink/35">Caption</p>
              <p className="text-[13.5px] leading-[1.75] whitespace-pre-line text-ink/70">{piece.caption}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {piece.hashtags.map(h => <span key={h} className="rounded-lg bg-primary/[0.07] px-2.5 py-1 text-[12px] font-semibold text-primary">{h}</span>)}
              </div>
            </div>
          </div>

          {/* RIGHT: Review panel */}
          <div className="flex w-full flex-col gap-4 lg:w-[340px] lg:flex-shrink-0">

            {/* Creator identity */}
            <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white text-[16px]" style={{ background: piece.creator.color }}>{piece.creator.initials}</div>
                <div>
                  <p className="text-[14px] font-extrabold text-ink">{piece.creator.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[12px] text-ink/45">{piece.creator.handle}</p>
                    <span className="text-ink/20">·</span>
                    <p className="text-[12px] text-ink/45">{piece.creator.followers} followers</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push('/agency/messages')}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/15 py-2.5 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.05]">
                  <SendIcon s={13}/>Message
                </button>
                <button onClick={() => router.push('/agency/campaign/ac1')}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/15 py-2.5 text-[12.5px] font-bold text-ink/55 transition hover:bg-surface-sub">
                  <ChevLeft s={13}/>All pieces
                </button>
              </div>
            </div>

            {/* Brief compliance checklist */}
            <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[13px] font-extrabold text-ink">Brief compliance</p>
                <span className={`text-[11.5px] font-bold ${requiredPassed ? 'text-emerald-600' : 'text-ink/40'}`}>
                  {BRIEF_CHECKLIST.filter(c => checked[c.id]).length}/{BRIEF_CHECKLIST.length} checked
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600 mb-1.5">Do's</p>
                {allDos.map(item => (
                  <button key={item.id} type="button" onClick={() => toggleCheck(item.id)}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] transition hover:bg-surface-sub/80 ${checked[item.id] ? 'bg-emerald-50/60' : ''}`}>
                    <span className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md border-2 transition ${checked[item.id] ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-primary/20 bg-white'}`}>
                      {checked[item.id] && <Check s={10}/>}
                    </span>
                    <span className={`flex-1 font-medium leading-snug ${checked[item.id] ? 'text-emerald-700' : 'text-ink/65'}`}>
                      {item.label}{item.required && <span className="ml-1 text-rose-400 text-[10px]">*</span>}
                    </span>
                  </button>
                ))}
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-500 mt-3 mb-1.5">Don'ts — confirm none are violated</p>
                {allDonts.map(item => (
                  <button key={item.id} type="button" onClick={() => toggleCheck(item.id)}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] transition hover:bg-surface-sub/80 ${checked[item.id] ? 'bg-emerald-50/60' : ''}`}>
                    <span className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md border-2 transition ${checked[item.id] ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-rose-300 bg-white'}`}>
                      {checked[item.id] && <Check s={10}/>}
                    </span>
                    <span className={`flex-1 font-medium leading-snug ${checked[item.id] ? 'text-emerald-700' : 'text-ink/65'}`}>
                      {item.label}{item.required && <span className="ml-1 text-rose-400 text-[10px]">*</span>}
                    </span>
                  </button>
                ))}
              </div>
              {!requiredPassed && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5">
                  <AlertIcon s={14}/>
                  <p className="text-[12px] font-semibold text-amber-700">Tick all required (*) items before approving.</p>
                </div>
              )}
            </div>

            {/* Feedback composer */}
            <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
              <p className="mb-3 text-[13px] font-extrabold text-ink">Feedback to creator</p>
              <p className="mb-3 text-[12px] text-ink/45 leading-[1.6]">
                This message will be sent to <span className="font-bold text-ink">{piece.creator.name}</span> via Messages, on behalf of <span className="font-bold text-ink">{piece.brand.name}</span>. Be specific and constructive.
              </p>
              <textarea
                ref={textareaRef}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder={status === 'approved'
                  ? `Great job, ${piece.creator.name}! Content approved. Optional additional note…`
                  : `Hi ${piece.creator.name}, thank you for submitting. Here's what needs to be adjusted before we can approve…`}
                rows={5}
                className="w-full resize-none rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition placeholder:text-ink/30 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]"/>

              <div className="mt-3 flex flex-col gap-2.5">
                <button onClick={handleApprove} disabled={!requiredPassed}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13.5px] font-bold text-white transition ${requiredPassed ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                  <Check s={14}/>{status === 'approved' ? 'Approved ✓' : 'Approve content'}
                </button>
                {status !== 'approved' && (
                  <button onClick={handleRequestRevision}
                    className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3 text-[13.5px] font-bold text-amber-700 transition hover:bg-amber-100">
                    <RefreshIcon s={14}/>Request revision
                    {!feedback.trim() && <span className="ml-1 text-[11px] font-medium text-amber-500">(write feedback first)</span>}
                  </button>
                )}
                <button onClick={handleSendNote} disabled={!feedback.trim()}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[12.5px] font-bold transition ${feedback.trim() ? 'border-primary/20 text-primary hover:bg-primary/[0.05]' : 'border-primary/8 text-ink/28 cursor-not-allowed'}`}>
                  <SendIcon s={13}/>Send as note only
                </button>
                <button onClick={() => router.push('/agency/dispute/new')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 py-2.5 text-[12.5px] font-bold text-rose-500 transition hover:bg-rose-50">
                  <TicketIcon s={13}/>Escalate to dispute
                </button>
              </div>
            </div>

            {/* Feedback history */}
            {piece.feedbackHistory.length > 0 && (
              <div className={`rounded-2xl border border-primary/10 bg-white overflow-hidden ${CARD}`}>
                <div className="border-b border-primary/8 px-5 py-4">
                  <p className="text-[13px] font-extrabold text-ink">Feedback history</p>
                  <p className="text-[11.5px] text-ink/40 mt-0.5">{piece.feedbackHistory.length} entr{piece.feedbackHistory.length !== 1 ? 'ies' : 'y'} · visible to creator</p>
                </div>
                <div className="divide-y divide-primary/6">
                  {piece.feedbackHistory.map(entry => {
                    const typeCfg = ({
                      revision_request: { label: 'Revision requested', dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50'   },
                      approval:         { label: 'Approved',           dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                      note:             { label: 'Note sent',          dot: 'bg-primary/50',  text: 'text-primary',     bg: 'bg-primary/[0.05]' },
                    } as Record<FeedbackEntry['type'], { label: string; dot: string; text: string; bg: string }>)[entry.type as FeedbackEntry['type']]
                    return (
                      <div key={entry.id} className={`px-5 py-4 ${typeCfg.bg}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`flex items-center gap-1.5 text-[11px] font-bold ${typeCfg.text}`}><span className={`h-1.5 w-1.5 rounded-full ${typeCfg.dot}`}/>{typeCfg.label}</span>
                          <span className="text-[10.5px] text-ink/35">{entry.date}</span>
                        </div>
                        <p className="text-[13px] leading-[1.65] text-ink/70">{entry.text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}