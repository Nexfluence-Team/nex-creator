'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Creator Rankings — app/rankings/page.tsx
   Nexfluence v4, LIGHT

   PRODUCT CONCEPT:
   Product Hunt for Baltic creators. A daily/weekly leaderboard
   where ranking is real but the formula is intentionally opaque.
   The top 3 get a 1080×1080 shareable Instagram card generated
   in-browser via Canvas API — their circular avatar, their rank,
   our logo, their colour ring. Built for virality: every creator
   who shares their card becomes a billboard for Nexus.

   THE ALGORITHM (what we tell users):
   "Ranked by Nexus Score™ — a proprietary signal combining
   reach, engagement quality, campaign performance, and creator
   momentum. Updated every 24 hours."

   THE ALGORITHM (what actually runs in the mock):
     NSC = (views × 0.30) + (saves × 1.80)
           + (campaigns_completed × 120) + (engagement_rate × 400)
           + recency_boost
   We never expose the individual components. The score is shown
   as a single opaque number: "NSC 8,420". This is intentional —
   a disclosed formula is a gamed formula.

   VISUAL SIGNATURE:
   Enormous ghost rank numbers (#1, #2, #3…) printed in gradient
   ink behind each podium card, clipped by a fade mask. The number
   IS the visual hierarchy. Everything else is quiet around it.

   SHAREABLE CARD (Canvas, 1080×1080):
   — Deep ink-to-violet gradient background
   — Creator circular avatar at top-centre, 160px, gradient ring
     coloured by rank (gold/1, silver/2, bronze/3)
   — Name in white Rubik Black, @handle in gradient text
   — Large rank badge in centre
   — Nexfluence logo + URL in footer band
   — Exported as PNG via canvas.toBlob → anchor.download
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ─── Types ──────────────────────────────────────────────────────── */
type Period   = 'today' | 'week' | 'month' | 'alltime'
type Category = 'all' | 'fitness' | 'beauty' | 'food' | 'fashion' | 'travel' | 'tech' | 'lifestyle' | 'sport'

interface Creator {
  id:              string
  name:            string
  handle:          string
  avatarUrl:       string   /* URL — null for mock initials fallback */
  avatarColor:     string   /* fallback bg colour */
  initials:        string
  niche:           Category
  nicheLabel:      string
  location:        string
  platforms:       { name: string; followers: string; icon: string }[]
  /* NSC components — never shown individually */
  _views:          number
  _saves:          number
  _campaigns:      number
  _engagementRate: number
  _recencyBoost:   number
  /* Computed */
  nsc:             number
  rank:            number
  prevRank:        number | null
  verified:        boolean
  bio:             string
}

/* ─── NSC formula — opaque to users, transparent here ──────────────
   We never expose this breakdown. The score is shown as one number.
   What we tell users: "proprietary signal combining reach,
   engagement quality, campaign performance, and creator momentum."  */
function computeNSC(c: Omit<Creator,'nsc'|'rank'|'prevRank'>): number {
  return Math.round(
    c._views * 0.30 +
    c._saves * 1.80 +
    c._campaigns * 120 +
    c._engagementRate * 400 +
    c._recencyBoost
  )
}

/* ─── Rank colour rings (for podium cards and share card) ──────────── */
const RANK_RING: Record<number, {
  from: string; via: string; to: string
  label: string; emoji: string; glow: string
}> = {
  1: { from: '#F59E0B', via: '#FCD34D', to: '#D97706', label: '#1 Creator', emoji: '👑', glow: 'rgba(245,158,11,0.5)' },
  2: { from: '#94A3B8', via: '#CBD5E1', to: '#64748B', label: '#2 Creator', emoji: '🥈', glow: 'rgba(148,163,184,0.4)' },
  3: { from: '#C2833B', via: '#E4A45A', to: '#9A6229', label: '#3 Creator', emoji: '🥉', glow: 'rgba(194,131,59,0.4)' },
}

/* ─── Mock creators dataset ─────────────────────────────────────────
   In production: fetched from /api/creators/rankings?period=&category=
   NSC is computed server-side and returned as a single opaque score.
   Individual components never leave the backend.                      */
const BASE_CREATORS: Omit<Creator,'nsc'|'rank'|'prevRank'>[] = [
  {
    id: 'c01', name: 'Amelia Roze', handle: 'amelia.roze',
    avatarUrl: '', avatarColor: '#8B31E8', initials: 'AR',
    niche: 'fitness', nicheLabel: 'Fitness & Wellness',
    location: 'Riga, Latvia', verified: true,
    bio: 'Certified PT · HIIT specialist · Sponsored by Kinetics',
    platforms: [
      { name: 'Instagram', followers: '67K',  icon: '📸' },
      { name: 'TikTok',   followers: '142K', icon: '🎵' },
      { name: 'YouTube',  followers: '18K',  icon: '▶' },
    ],
    _views: 14800, _saves: 2210, _campaigns: 5, _engagementRate: 7.4, _recencyBoost: 320,
  },
  {
    id: 'c02', name: 'Markus Tamm', handle: 'markus.tamm',
    avatarUrl: '', avatarColor: '#2563EB', initials: 'MT',
    niche: 'sport', nicheLabel: 'Sport & Running',
    location: 'Tallinn, Estonia', verified: true,
    bio: 'Ultra marathon runner · Race ambassador · Trail obsessed',
    platforms: [
      { name: 'Instagram', followers: '38K',  icon: '📸' },
      { name: 'TikTok',   followers: '95K',  icon: '🎵' },
      { name: 'Strava',   followers: '11K',  icon: '🏃' },
    ],
    _views: 9200, _saves: 1840, _campaigns: 3, _engagementRate: 8.1, _recencyBoost: 190,
  },
  {
    id: 'c03', name: 'Sandra Liepa', handle: 'sandra.liepa',
    avatarUrl: '', avatarColor: '#DB2777', initials: 'SL',
    niche: 'beauty', nicheLabel: 'Beauty & Skincare',
    location: 'Riga, Latvia', verified: true,
    bio: 'Clean beauty · Skin minimalist · Lumora Skincare partner',
    platforms: [
      { name: 'Instagram', followers: '52K',  icon: '📸' },
      { name: 'TikTok',   followers: '88K',  icon: '🎵' },
    ],
    _views: 11400, _saves: 1980, _campaigns: 4, _engagementRate: 6.9, _recencyBoost: 240,
  },
  {
    id: 'c04', name: 'Rūta Vaitkutė', handle: 'ruta.v',
    avatarUrl: '', avatarColor: '#059669', initials: 'RV',
    niche: 'lifestyle', nicheLabel: 'Lifestyle & Travel',
    location: 'Vilnius, Lithuania', verified: false,
    bio: 'Baltic travel stories · slow living · brand partner',
    platforms: [
      { name: 'Instagram', followers: '29K',  icon: '📸' },
      { name: 'YouTube',  followers: '8K',   icon: '▶' },
    ],
    _views: 7600, _saves: 1320, _campaigns: 2, _engagementRate: 5.8, _recencyBoost: 80,
  },
  {
    id: 'c05', name: 'Jonas Petrauskas', handle: 'jonas.pt',
    avatarUrl: '', avatarColor: '#D97706', initials: 'JP',
    niche: 'fitness', nicheLabel: 'Fitness & Nutrition',
    location: 'Kaunas, Lithuania', verified: false,
    bio: 'Sports nutrition · powerlifting · Vitality Stack creator',
    platforms: [
      { name: 'Instagram', followers: '22K',  icon: '📸' },
      { name: 'TikTok',   followers: '61K',  icon: '🎵' },
    ],
    _views: 5800, _saves: 940, _campaigns: 2, _engagementRate: 5.2, _recencyBoost: 60,
  },
  {
    id: 'c06', name: 'Elīna Krūmiņa', handle: 'elina.active',
    avatarUrl: '', avatarColor: '#7C3AED', initials: 'EK',
    niche: 'fitness', nicheLabel: 'Fitness & Dance',
    location: 'Riga, Latvia', verified: false,
    bio: 'Dance fitness · Body positivity · 500th creator on Nexus',
    platforms: [
      { name: 'Instagram', followers: '67K',  icon: '📸' },
      { name: 'TikTok',   followers: '34K',  icon: '🎵' },
    ],
    _views: 6400, _saves: 1100, _campaigns: 1, _engagementRate: 6.1, _recencyBoost: 140,
  },
  {
    id: 'c07', name: 'Laura Kask', handle: 'laurakask',
    avatarUrl: '', avatarColor: '#BE185D', initials: 'LK',
    niche: 'food', nicheLabel: 'Food & Recipes',
    location: 'Tartu, Estonia', verified: true,
    bio: 'Baltic cuisine · fermentation · seasonal cooking',
    platforms: [
      { name: 'Instagram', followers: '44K',  icon: '📸' },
      { name: 'YouTube',  followers: '22K',  icon: '▶' },
    ],
    _views: 9800, _saves: 1650, _campaigns: 3, _engagementRate: 5.5, _recencyBoost: 110,
  },
  {
    id: 'c08', name: 'Andris Bērziņš', handle: 'andris.tech',
    avatarUrl: '', avatarColor: '#0369A1', initials: 'AB',
    niche: 'tech', nicheLabel: 'Tech & Gadgets',
    location: 'Riga, Latvia', verified: false,
    bio: 'Baltic tech reviewer · startup culture · honest takes',
    platforms: [
      { name: 'YouTube',  followers: '31K',  icon: '▶' },
      { name: 'Instagram', followers: '12K',  icon: '📸' },
    ],
    _views: 4200, _saves: 720, _campaigns: 1, _engagementRate: 4.8, _recencyBoost: 50,
  },
  {
    id: 'c09', name: 'Monika Jankauskaitė', handle: 'monika.j',
    avatarUrl: '', avatarColor: '#EA580C', initials: 'MJ',
    niche: 'fashion', nicheLabel: 'Fashion & Style',
    location: 'Vilnius, Lithuania', verified: true,
    bio: 'Baltic fashion week regular · sustainable style advocate',
    platforms: [
      { name: 'Instagram', followers: '58K',  icon: '📸' },
      { name: 'TikTok',   followers: '43K',  icon: '🎵' },
    ],
    _views: 8900, _saves: 1480, _campaigns: 2, _engagementRate: 6.3, _recencyBoost: 130,
  },
  {
    id: 'c10', name: 'Tõnis Valk', handle: 'tonis.travels',
    avatarUrl: '', avatarColor: '#0F766E', initials: 'TV',
    niche: 'travel', nicheLabel: 'Travel & Adventure',
    location: 'Tallinn, Estonia', verified: false,
    bio: 'Hidden Baltic gems · van life · outdoor adventures',
    platforms: [
      { name: 'Instagram', followers: '33K',  icon: '📸' },
      { name: 'YouTube',  followers: '14K',  icon: '▶' },
    ],
    _views: 5100, _saves: 890, _campaigns: 1, _engagementRate: 5.0, _recencyBoost: 70,
  },
]

/* ─── Period multipliers — vary scores by time window ─────────────── */
const PERIOD_MULT: Record<Period, (base: number, idx: number) => number> = {
  today:   (b, i) => Math.round(b * 0.05 + Math.sin(i) * 400 + 200),
  week:    (b)    => Math.round(b * 0.3),
  month:   (b)    => Math.round(b * 0.7),
  alltime: (b)    => b,
}

function buildRanking(period: Period, category: Category): Creator[] {
  const filtered = category === 'all'
    ? BASE_CREATORS
    : BASE_CREATORS.filter(c => c.niche === category)

  return filtered
    .map((c, i) => ({
      ...c,
      nsc: PERIOD_MULT[period](computeNSC(c), i),
      rank: 0,
      prevRank: null,
    }))
    .sort((a, b) => b.nsc - a.nsc)
    .map((c, i) => ({ ...c, rank: i + 1, prevRank: i === 0 ? 3 : i === 1 ? 1 : i + 2 }))
}

/* ─── Icons ──────────────────────────────────────────────────────── */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function ShareIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function DownloadIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TrendUpIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function TrendDownIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function XIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function InfoIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function CopyIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function CheckIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ─── Avatar — circular with optional rank ring ─────────────────────── */
function Avatar({ creator, size, ring = false }: { creator: Creator; size: number; ring?: boolean }) {
  const rr = ring && creator.rank <= 3 ? RANK_RING[creator.rank] : null
  const pad = rr ? 3 : 0

  return (
    <div className="relative flex-shrink-0" style={{ width: size + pad * 2, height: size + pad * 2 }}>
      {rr && (
        <div className="absolute inset-0 rounded-full"
          style={{ background: `linear-gradient(135deg, ${rr.from}, ${rr.via}, ${rr.to})`, boxShadow: `0 0 20px ${rr.glow}` }}/>
      )}
      <div className="absolute rounded-full overflow-hidden flex items-center justify-center text-white font-black"
        style={{
          inset: pad,
          background: creator.avatarUrl ? undefined : creator.avatarColor,
          fontSize: size * 0.35,
          border: rr ? '2px solid #0A0612' : undefined,
        }}>
        {creator.avatarUrl
          ? <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover"/> // eslint-disable-line @next/next/no-img-element
          : creator.initials}
      </div>
    </div>
  )
}

/* ─── NSC badge ─────────────────────────────────────────────────────── */
function NSCBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const cls = {
    sm: 'px-2 py-0.5 text-[10.5px]',
    md: 'px-3 py-1 text-[12px]',
    lg: 'px-4 py-1.5 text-[14px]',
  }[size]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-primary/[0.09] font-black text-primary ${cls}`}>
      <span className="text-[10px] font-black opacity-60">NSC</span>
      {score.toLocaleString()}
    </span>
  )
}

/* ─── Rank delta badge ──────────────────────────────────────────────── */
function RankDelta({ creator }: { creator: Creator }) {
  const prev = creator.prevRank
  if (!prev) return <span className="text-[10px] font-bold text-ink/25">NEW</span>
  const delta = prev - creator.rank
  if (delta === 0) return <span className="text-[10px] text-ink/30">—</span>
  return (
    <span className={`flex items-center gap-0.5 text-[10.5px] font-bold ${delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
      {delta > 0 ? <TrendUpIcon s={11}/> : <TrendDownIcon s={11}/>}
      {Math.abs(delta)}
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CANVAS SHARE CARD GENERATOR
   Generates a 1080×1080 PNG entirely client-side.
   No server. No external fonts at runtime. Uses system fallbacks
   that approximate Rubik (the CSS variable --font-rubik).
   
   In production: load Rubik via FontFace API before drawing.
   ════════════════════════════════════════════════════════════════════ */
async function generateShareCard(creator: Creator): Promise<string> {
  const SIZE = 1080
  const canvas = document.createElement('canvas')
  canvas.width  = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!

  /* ── background gradient ── */
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE)
  bg.addColorStop(0,   '#0A0612')
  bg.addColorStop(0.5, '#1A0B35')
  bg.addColorStop(1,   '#0F0820')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, SIZE, SIZE)

  /* ── subtle noise texture via small dots ── */
  ctx.globalAlpha = 0.04
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(Math.random() * SIZE, Math.random() * SIZE, Math.random() * 1.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  /* ── decorative orbs ── */
  const orb1 = ctx.createRadialGradient(200, 200, 0, 200, 200, 400)
  orb1.addColorStop(0, 'rgba(139,49,232,0.25)')
  orb1.addColorStop(1, 'rgba(139,49,232,0)')
  ctx.fillStyle = orb1
  ctx.fillRect(0, 0, SIZE, SIZE)

  const orb2 = ctx.createRadialGradient(SIZE - 150, SIZE - 150, 0, SIZE - 150, SIZE - 150, 350)
  orb2.addColorStop(0, 'rgba(255,51,188,0.18)')
  orb2.addColorStop(1, 'rgba(255,51,188,0)')
  ctx.fillStyle = orb2
  ctx.fillRect(0, 0, SIZE, SIZE)

  /* ── rank ring colours ── */
  const rr = RANK_RING[creator.rank]!

  /* ── large ghost rank number behind everything ── */
  ctx.save()
  ctx.font = `900 380px Arial, sans-serif`
  ctx.textAlign = 'center'
  const ghostGrad = ctx.createLinearGradient(0, SIZE * 0.45, 0, SIZE * 0.85)
  ghostGrad.addColorStop(0, 'rgba(139,49,232,0.18)')
  ghostGrad.addColorStop(1, 'rgba(139,49,232,0)')
  ctx.fillStyle = ghostGrad
  ctx.fillText(`${creator.rank}`, SIZE / 2, SIZE * 0.82)
  ctx.restore()

  /* ── circular avatar at top-centre ── */
  const AV = 200   /* avatar diameter */
  const AX = SIZE / 2
  const AY = 310   /* centre Y */
  const RING = 10  /* ring thickness */

  /* Ring */
  const ringGrad = ctx.createLinearGradient(AX - AV / 2, AY - AV / 2, AX + AV / 2, AY + AV / 2)
  ringGrad.addColorStop(0, rr.from)
  ringGrad.addColorStop(0.5, rr.via)
  ringGrad.addColorStop(1, rr.to)
  ctx.beginPath()
  ctx.arc(AX, AY, AV / 2 + RING, 0, Math.PI * 2)
  ctx.fillStyle = ringGrad
  ctx.shadowColor = rr.glow
  ctx.shadowBlur = 40
  ctx.fill()
  ctx.shadowBlur = 0

  /* Avatar fill (colour or image) */
  ctx.save()
  ctx.beginPath()
  ctx.arc(AX, AY, AV / 2, 0, Math.PI * 2)
  ctx.clip()

  if (creator.avatarUrl) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = () => rej()
        img.src = creator.avatarUrl
      })
      ctx.drawImage(img, AX - AV / 2, AY - AV / 2, AV, AV)
    } catch {
      /* fallback to colour + initials */
      ctx.fillStyle = creator.avatarColor
      ctx.fillRect(AX - AV / 2, AY - AV / 2, AV, AV)
    }
  } else {
    ctx.fillStyle = creator.avatarColor
    ctx.fillRect(AX - AV / 2, AY - AV / 2, AV, AV)
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.font = `900 72px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(creator.initials, AX, AY)
    ctx.textBaseline = 'alphabetic'
  }
  ctx.restore()

  /* ── name ── */
  ctx.fillStyle = '#FFFFFF'
  ctx.font      = `900 58px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(creator.name, SIZE / 2, AY + AV / 2 + 80)

  /* ── handle in gradient ── */
  const handleGrad = ctx.createLinearGradient(SIZE * 0.25, 0, SIZE * 0.75, 0)
  handleGrad.addColorStop(0, '#8B31E8')
  handleGrad.addColorStop(1, '#FF33BC')
  ctx.fillStyle = handleGrad
  ctx.font      = `700 36px Arial, sans-serif`
  ctx.fillText(`@${creator.handle}`, SIZE / 2, AY + AV / 2 + 136)

  /* ── rank badge pill ── */
  const PILL_W = 380, PILL_H = 96, PILL_X = SIZE / 2 - PILL_W / 2, PILL_Y = AY + AV / 2 + 176
  const pillGrad = ctx.createLinearGradient(PILL_X, 0, PILL_X + PILL_W, 0)
  pillGrad.addColorStop(0, rr.from)
  pillGrad.addColorStop(0.5, rr.via)
  pillGrad.addColorStop(1, rr.to)
  ctx.beginPath()
  roundRect(ctx, PILL_X, PILL_Y, PILL_W, PILL_H, 48)
  ctx.fillStyle = pillGrad
  ctx.shadowColor = rr.glow
  ctx.shadowBlur = 28
  ctx.fill()
  ctx.shadowBlur = 0

  /* emoji */
  ctx.font = `52px Arial, sans-serif`
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(rr.emoji, SIZE / 2 - 90, PILL_Y + 62)

  /* rank text */
  ctx.font = `900 40px Arial, sans-serif`
  ctx.fillText(rr.label, SIZE / 2 + 28, PILL_Y + 62)

  /* ── NSC score ── */
  ctx.fillStyle = 'rgba(255,255,255,0.40)'
  ctx.font      = `600 22px Arial, sans-serif`
  ctx.fillText('Nexus Score™', SIZE / 2, PILL_Y + PILL_H + 52)
  ctx.fillStyle = 'rgba(255,255,255,0.80)'
  ctx.font      = `900 32px Arial, sans-serif`
  ctx.fillText(`NSC ${creator.nsc.toLocaleString()}`, SIZE / 2, PILL_Y + PILL_H + 94)

  /* ── niche pill ── */
  const NICHE = creator.nicheLabel.toUpperCase()
  ctx.font = `700 20px Arial, sans-serif`
  const nW = ctx.measureText(NICHE).width + 48
  const nX = SIZE / 2 - nW / 2
  const nY = PILL_Y + PILL_H + 120
  ctx.beginPath()
  roundRect(ctx, nX, nY, nW, 40, 20)
  ctx.fillStyle = 'rgba(139,49,232,0.25)'
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillText(NICHE, SIZE / 2, nY + 26)

  /* ── footer band ── */
  const footerH = 130
  const footerY = SIZE - footerH
  const footerBg = ctx.createLinearGradient(0, footerY, 0, SIZE)
  footerBg.addColorStop(0, 'rgba(139,49,232,0.0)')
  footerBg.addColorStop(0.3, 'rgba(139,49,232,0.45)')
  footerBg.addColorStop(1, 'rgba(139,49,232,0.60)')
  ctx.fillStyle = footerBg
  ctx.fillRect(0, footerY, SIZE, footerH)

  /* Divider line */
  const lineGrad = ctx.createLinearGradient(80, 0, SIZE - 80, 0)
  lineGrad.addColorStop(0, 'rgba(255,255,255,0)')
  lineGrad.addColorStop(0.3, 'rgba(255,255,255,0.35)')
  lineGrad.addColorStop(0.7, 'rgba(255,255,255,0.35)')
  lineGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, footerY + 1); ctx.lineTo(SIZE - 80, footerY + 1)
  ctx.stroke()

  /* Brand name */
  ctx.fillStyle = '#FFFFFF'
  ctx.font      = `900 34px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('CREATOR NEXUS', SIZE / 2, footerY + 48)

  ctx.fillStyle = 'rgba(255,255,255,0.50)'
  ctx.font      = `500 20px Arial, sans-serif`
  ctx.fillText('by Nexfluence · Ranked by Nexus Score™', SIZE / 2, footerY + 82)

  ctx.fillStyle = 'rgba(255,255,255,0.30)'
  ctx.font      = `500 18px Arial, sans-serif`
  ctx.fillText('nexus.nexfluence.eu', SIZE / 2, footerY + 112)

  return canvas.toDataURL('image/png')
}

/* ─── roundRect polyfill ─────────────────────────────────────────── */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/* ════════════════════════════════════════════════════════════════════
   SHARE CARD MODAL
   ════════════════════════════════════════════════════════════════════ */
function ShareCardModal({ creator, onClose }: { creator: Creator; onClose: () => void }) {
  const [dataUrl, setDataUrl]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [copied,  setCopied]    = useState(false)
  const rr = RANK_RING[creator.rank]!

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    generateShareCard(creator)
      .then(url => { setDataUrl(url); setLoading(false) })
      .catch(() => setLoading(false))
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [creator.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const download = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `nexus-rank-${creator.rank}-${creator.handle.replace('.', '-')}.png`
    a.click()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`https://nexus.nexfluence.eu/creator/${creator.handle}`)
      .catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-md" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[520px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-4">
          <div>
            <h3 className="text-[16px] font-extrabold text-ink">Share your ranking card</h3>
            <p className="text-[12.5px] text-ink/45 mt-0.5">Download a 1080×1080 PNG — perfect for Instagram</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        {/* Card preview */}
        <div className="flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0A0612 0%, #1A0B35 100%)' }}>
          {loading ? (
            <div className="flex h-[320px] w-[320px] items-center justify-center rounded-2xl bg-white/5">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"/>
                <p className="text-[12px] text-white/40">Generating card…</p>
              </div>
            </div>
          ) : dataUrl ? (
            <img src={dataUrl} alt="Share card preview" className="h-[320px] w-[320px] rounded-2xl object-cover shadow-[0_16px_48px_-12px_rgba(0,0,0,0.6)]"/> // eslint-disable-line @next/next/no-img-element
          ) : (
            <div className="flex h-[320px] w-[320px] items-center justify-center rounded-2xl bg-white/5">
              <p className="text-[12px] text-white/40">Could not generate card</p>
            </div>
          )}
        </div>

        {/* Rank label */}
        <div className="flex items-center justify-center gap-2 px-6 pb-3">
          <span className="text-[16px]">{rr.emoji}</span>
          <span className="text-[14.5px] font-extrabold text-ink">{creator.name}</span>
          <span className={`text-[13.5px] font-bold ${GRAD_TXT}`}>{rr.label}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
          <button onClick={copyLink}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/60 transition hover:bg-surface-sub">
            {copied ? <><CheckIcon s={13}/>Copied!</> : <><CopyIcon s={13}/>Copy link</>}
          </button>
          <button onClick={download} disabled={!dataUrl || loading}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${dataUrl && !loading ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            <DownloadIcon s={15}/>Download PNG
          </button>
        </div>

        <p className="pb-4 text-center text-[11.5px] text-ink/30">
          Share on Instagram Feed or Story · 1080×1080px
        </p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PODIUM CARD — Top 3 featured cards
   ════════════════════════════════════════════════════════════════════ */
function PodiumCard({ creator, onShare }: { creator: Creator; onShare: () => void }) {
  const rr = RANK_RING[creator.rank]!
  const isFirst = creator.rank === 1

  return (
    <div className={`relative flex flex-col items-center overflow-hidden rounded-3xl border-2 bg-white p-6 text-center transition hover:-translate-y-1 ${CARD} ${isFirst ? 'md:scale-105 md:z-10' : ''}`}
      style={{ borderColor: rr.from + '60' }}>

      {/* Ghost rank number — the visual signature */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden select-none"
        aria-hidden="true">
        <span className="pb-0 font-black leading-none text-ink/[0.04]"
          style={{ fontSize: isFirst ? 280 : 220 }}>
          {creator.rank}
        </span>
      </div>

      {/* Rank emoji crown */}
      <div className="relative mb-3 text-[28px]">{rr.emoji}</div>

      {/* Avatar */}
      <div className="relative mb-4">
        <Avatar creator={creator} size={isFirst ? 96 : 80} ring/>
      </div>

      {/* Name + handle */}
      <h3 className="relative text-[17px] font-extrabold tracking-[-0.02em] text-ink">{creator.name}</h3>
      <p className={`relative mt-0.5 text-[13px] font-bold ${GRAD_TXT}`}>@{creator.handle}</p>
      {creator.verified && (
        <span className="relative mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Tick.svg" alt="" className="h-4 w-4"/>Verified creator
        </span>
      )}

      {/* Niche */}
      <span className="relative mt-3 rounded-full border border-primary/15 bg-surface-sub px-3 py-1 text-[11.5px] font-bold text-ink/60">
        {creator.nicheLabel}
      </span>

      {/* NSC score */}
      <div className="relative mt-4">
        <NSCBadge score={creator.nsc} size="lg"/>
        <p className="mt-1 text-[10.5px] text-ink/35">Nexus Score™</p>
      </div>

      {/* Platform stats */}
      <div className="relative mt-4 flex gap-3">
        {creator.platforms.slice(0, 3).map(p => (
          <div key={p.name} className="flex flex-col items-center gap-0.5">
            <span className="text-[14px]">{p.icon}</span>
            <span className="text-[11px] font-bold text-ink/70">{p.followers}</span>
          </div>
        ))}
      </div>

      {/* Delta */}
      <div className="relative mt-3">
        <RankDelta creator={creator}/>
      </div>

      {/* Share card CTA */}
      <button onClick={onShare}
        className={`relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl ${GRAD_BTN} py-3.5 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 active:translate-y-0`}>
        <ShareIcon s={15}/>Share my card
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   LIST ROW — Ranks 4+
   ════════════════════════════════════════════════════════════════════ */
function RankRow({ creator, onShare }: { creator: Creator; onShare?: () => void }) {
  return (
    <div className={`group flex items-center gap-4 rounded-2xl border border-primary/8 bg-white px-5 py-4 transition hover:border-primary/20 hover:-translate-y-0.5 ${CARD}`}>
      {/* Ghost rank number */}
      <div className="relative flex w-10 flex-shrink-0 items-center justify-center">
        <span className="absolute text-[52px] font-black text-ink/[0.05] leading-none select-none" aria-hidden="true">{creator.rank}</span>
        <span className={`relative text-[18px] font-black ${GRAD_TXT}`}>#{creator.rank}</span>
      </div>

      {/* Avatar */}
      <Avatar creator={creator} size={44}/>

      {/* Name + niche */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14px] font-bold text-ink">{creator.name}</span>
          {creator.verified && <img src="/Tick.svg" alt="" className="h-4 w-4 flex-shrink-0"/>} {/* eslint-disable-line @next/next/no-img-element */}
        </div>
        <span className="text-[12px] text-ink/45">@{creator.handle} · {creator.nicheLabel}</span>
      </div>

      {/* Platform follower pills */}
      <div className="hidden items-center gap-2 sm:flex">
        {creator.platforms.slice(0, 2).map(p => (
          <span key={p.name} className="flex items-center gap-1 rounded-lg bg-surface-sub px-2.5 py-1 text-[11.5px] font-semibold text-ink/55">
            {p.icon} {p.followers}
          </span>
        ))}
      </div>

      {/* Delta */}
      <div className="hidden flex-shrink-0 sm:block"><RankDelta creator={creator}/></div>

      {/* NSC */}
      <NSCBadge score={creator.nsc} size="sm"/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function RankingsPage() {
  const [period,    setPeriod]    = useState<Period>('week')
  const [category,  setCategory]  = useState<Category>('all')
  const [shareTarget, setShareTarget] = useState<Creator | null>(null)
  const [showAlgoInfo, setShowAlgoInfo] = useState(false)
  const [animKey,   setAnimKey]   = useState(0)

  /* Trigger re-rank animation on tab change */
  const changePeriod = (p: Period) => { setPeriod(p); setAnimKey(k => k + 1) }
  const changeCategory = (c: Category) => { setCategory(c); setAnimKey(k => k + 1) }

  const creators = buildRanking(period, category)
  const podium   = creators.slice(0, 3)
  const rest     = creators.slice(3)

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'today',   label: 'Today'      },
    { id: 'week',    label: 'This Week'  },
    { id: 'month',   label: 'This Month' },
    { id: 'alltime', label: 'All Time'   },
  ]

  const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
    { id: 'all',       label: 'All',       emoji: '✨' },
    { id: 'fitness',   label: 'Fitness',   emoji: '💪' },
    { id: 'beauty',    label: 'Beauty',    emoji: '💄' },
    { id: 'food',      label: 'Food',      emoji: '🍽' },
    { id: 'fashion',   label: 'Fashion',   emoji: '👗' },
    { id: 'travel',    label: 'Travel',    emoji: '✈️' },
    { id: 'tech',      label: 'Tech',      emoji: '⚡' },
    { id: 'lifestyle', label: 'Lifestyle', emoji: '🌿' },
    { id: 'sport',     label: 'Sport',     emoji: '🏆' },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ SHARE MODAL ════ */}
      {shareTarget && <ShareCardModal creator={shareTarget} onClose={() => setShareTarget(null)}/>}

      {/* ════ ALGO INFO MODAL ════ */}
      {showAlgoInfo && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4"
          onClick={() => setShowAlgoInfo(false)}>
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setShowAlgoInfo(false)}/>
          <div className={`relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
            <div className="flex items-start justify-between border-b border-primary/10 px-6 py-5">
              <h3 className="text-[16px] font-extrabold text-ink">How Nexus Score™ works</h3>
              <button onClick={() => setShowAlgoInfo(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-[14px] leading-[1.8] text-ink/65">
                Nexus Score™ is our proprietary ranking signal. It combines multiple signals about a creator's reach, quality of engagement, campaign delivery record, and recent activity momentum.
              </p>
              <div className="rounded-2xl border border-primary/10 bg-surface-sub/40 px-5 py-4 space-y-3">
                {[
                  { label: 'Reach', desc: 'Total profile views and discovery impressions across the platform' },
                  { label: 'Engagement quality', desc: 'How meaningfully your audience interacts — not just follower count' },
                  { label: 'Campaign performance', desc: 'Delivery record, brand ratings, on-time completion history' },
                  { label: 'Creator momentum', desc: 'Recency of activity — active creators rank higher than dormant ones' },
                ].map(s => (
                  <div key={s.label}>
                    <p className={`text-[12.5px] font-extrabold ${GRAD_TXT}`}>{s.label}</p>
                    <p className="text-[12.5px] text-ink/55 mt-0.5">{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[12.5px] font-semibold text-amber-700">
                  The exact formula is proprietary and updated periodically. We intentionally don't publish the weighting — because a disclosed formula is a gamed formula.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ FLOATING NAV ════ */}
      <header className="relative">
        <div className="absolute inset-x-0 z-40 flex justify-center px-4 pt-4">
          <div className="w-full max-w-[600px]">
            <div className="relative flex w-full items-center justify-between rounded-2xl px-4 py-3">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.88) 70%, rgba(255,255,255,0.88) 100%)',
                  WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                  maskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                }}/>
              <div className="relative z-10 flex items-center gap-0.5">
                {[{ label: 'Discover', href: '/discover' }, { label: 'Rankings', href: '/rankings' }].map(n => (
                  <a key={n.label} href={n.href} className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary ${n.label === 'Rankings' ? 'text-primary bg-primary/[0.06]' : 'text-ink/70'}`}>{n.label}</a>
                ))}
              </div>
              <div className="w-16 flex-shrink-0" aria-hidden="true"/>
              <div className="relative z-10 flex items-center gap-0.5">
                {[{ label: 'For Brands', href: '/authenticate?role=brand' }, { label: 'Join Nexus', href: '/authenticate' }].map(n => (
                  <a key={n.label} href={n.href} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary">{n.label}</a>
                ))}
              </div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
                <NexLogo className="pointer-events-auto h-10 drop-shadow-[0_6px_24px_rgba(139,49,232,0.65)] sm:h-12"/>
              </div>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden pb-10 pt-28 text-center" style={{ background: 'linear-gradient(160deg, #F5F0FE 0%, #F8F7FF 40%, #FFF0FA 100%)' }}>
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-[10%] top-[20%] h-80 w-80 rounded-full bg-primary/[0.08] blur-[80px]"/>
            <div className="absolute right-[5%] top-[30%] h-60 w-60 rounded-full bg-magenta/[0.07] blur-[70px]"/>
          </div>

          {/* Live dot */}
          <div className="relative mb-5 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[12px] font-bold text-emerald-600">Updated every 24 hours</span>
          </div>

          <h1 className="relative text-[clamp(36px,6vw,72px)] font-black leading-[1.05] tracking-[-0.045em] text-ink">
            Creator <span className={GRAD_TXT}>Rankings</span>
          </h1>
          <p className="relative mt-4 text-[clamp(15px,2vw,18px)] leading-[1.7] text-ink/55 max-w-[520px] mx-auto px-4">
            The Baltic region's most influential creators, ranked daily by Nexus Score™.
          </p>

          {/* Algo disclosure pill */}
          <button onClick={() => setShowAlgoInfo(true)}
            className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-[12.5px] font-semibold text-ink/55 backdrop-blur-sm transition hover:border-primary/30 hover:text-primary">
            <InfoIcon s={13}/>Ranked by Nexus Score™ — proprietary algorithm
          </button>
        </div>
      </header>

      {/* ════ FILTERS ════ */}
      <div className="sticky top-0 z-30 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        {/* Period tabs */}
        <div className="mx-auto flex max-w-[1080px] items-center gap-1 overflow-x-auto px-4 pt-3 pb-0">
          {PERIODS.map(p => (
            <button key={p.id} onClick={() => changePeriod(p.id)}
              className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition ${period === p.id ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.4)]` : 'text-ink/50 hover:text-ink/80 hover:bg-surface-sub'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="mx-auto flex max-w-[1080px] gap-2 overflow-x-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => changeCategory(c.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${category === c.id ? 'border-primary/30 bg-primary/[0.07] text-primary' : 'border-primary/10 bg-white text-ink/55 hover:border-primary/20'}`}>
              <span>{c.emoji}</span>{c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════ MAIN CONTENT ════ */}
      <main className="mx-auto max-w-[1080px] px-4 py-10">

        {/* Empty state */}
        {creators.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-3xl ${GRAD_BTN} text-[36px] shadow-[0_12px_32px_-8px_rgba(139,49,232,0.45)]`}>🏆</div>
            <h3 className="text-[20px] font-extrabold text-ink">No creators yet in this category</h3>
            <p className="mt-2 text-[14px] text-ink/45">Check back soon — more creators are joining Nexus every day.</p>
          </div>
        )}

        {/* ── PODIUM (top 3) ── */}
        {podium.length > 0 && (
          <div key={`podium-${animKey}`}>
            {/* Section label */}
            <div className="mb-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"/>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-ink/35">Top creators</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"/>
            </div>

            <div className={`grid gap-5 ${podium.length === 1 ? 'grid-cols-1 max-w-[360px] mx-auto' : podium.length === 2 ? 'grid-cols-2 max-w-[720px] mx-auto' : 'grid-cols-1 sm:grid-cols-3'} mb-12 items-end`}>
              {/* Reorder for podium visual: 2nd, 1st, 3rd */}
              {podium.length === 3
                ? [podium[1]!, podium[0]!, podium[2]!].map(c => (
                    <PodiumCard key={c.id} creator={c} onShare={() => setShareTarget(c)}/>
                  ))
                : podium.map(c => (
                    <PodiumCard key={c.id} creator={c} onShare={() => setShareTarget(c)}/>
                  ))
              }
            </div>
          </div>
        )}

        {/* ── RANKED LIST (4+) ── */}
        {rest.length > 0 && (
          <div key={`list-${animKey}`}>
            <div className="mb-5 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/15 to-transparent"/>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-ink/30">All rankings</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/15 to-transparent"/>
            </div>
            <div className="space-y-3">
              {rest.map((c, i) => (
                <div key={c.id} style={{ animationDelay: `${i * 40}ms` }}
                  className="animate-[fadeSlideIn_0.4s_ease_forwards] opacity-0"
                  /* @keyframes defined in global CSS or inline:
                     @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) }
                     to { opacity:1; transform:translateY(0) } }
                     Add this to globals.css or use Tailwind's animation plugin. */>
                  <RankRow creator={c}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NSC explainer footer ── */}
        <div className={`mt-16 rounded-3xl border border-primary/10 bg-white p-8 ${CARD}`}>
          <div className="flex flex-col items-center text-center">
            <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${GRAD_BTN} text-[22px] shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]`}>🏆</div>
            <h3 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Nexus Score™</h3>
            <p className="mt-3 max-w-[540px] text-[14px] leading-[1.8] text-ink/55">
              Rankings update every 24 hours. Nexus Score™ is a composite signal — reach, engagement quality, campaign performance, and creator momentum. The exact formula is proprietary: a disclosed formula is a gamed formula.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {[
                { emoji: '📈', label: 'Reach' },
                { emoji: '💬', label: 'Engagement quality' },
                { emoji: '✅', label: 'Campaign record' },
                { emoji: '⚡', label: 'Creator momentum' },
              ].map(s => (
                <span key={s.label} className="flex items-center gap-2 rounded-xl border border-primary/10 bg-surface-sub px-4 py-2.5 text-[13px] font-semibold text-ink/60">
                  {s.emoji} {s.label}
                </span>
              ))}
            </div>
            <button onClick={() => setShowAlgoInfo(true)}
              className="mt-5 text-[13px] font-bold text-primary hover:underline underline-offset-2">
              Learn more about Nexus Score™ →
            </button>
          </div>
        </div>

      </main>

      {/* ════ FOOTER ════ */}
      <footer className="bg-ink py-12 text-center">
        <NexLogo className="mx-auto h-10 mb-3"/>
        <p className="text-[12.5px] text-white/30">Creator Nexus by Nexfluence · Baltic Influencer Marketplace</p>
        <p className="mt-1 text-[12px] text-white/20">Rankings updated every 24h · Nexus Score™ is proprietary</p>
      </footer>

      {/* Keyframe animation for rank list rows */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  )
}