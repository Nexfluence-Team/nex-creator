'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Agency public profile — app/agency/[agencySlug]/page.tsx
   Nexfluence v4, LIGHT
   ════════════════════════════════════════════════════════════════════

   THE CORE STRUCTURAL DIFFERENCE FROM BRAND/CREATOR PROFILES:
   ─────────────────────────────────────────────────────────────────
   A brand profile is read by creators deciding whether to trust the
   brand. A creator profile is read by brands deciding whether to hire
   the creator. Each serves exactly ONE audience reading about ONE entity.

   An agency profile is read by TWO distinct audiences with opposite
   questions:
     Brands ask:   "Can this agency run my influencer marketing well?"
     Creators ask: "Will this agency get me good deals and pay fairly?"

   So this page introduces an AUDIENCE TOGGLE — "For Brands" / "For
   Creators" — that lives near the header and reframes the Matrix,
   Work, and Reviews sections below it. Neither the brand nor creator
   reference page needs this mechanic because they only ever address
   one side of the marketplace.

   WHAT'S BORROWED FROM EACH REFERENCE PAGE:
     From brand profile:   PersonaBento layout style, single-entity
                            stat bar, "Ways to Partner" minimal cards
     From creator profile: Platform-style dropdown pattern (repurposed
                            here as the audience toggle), trusted-by
                            marquee, "View managed brands" button
                            (parallels creator's "View Brand
                            Partnerships" modal), full-feature work
                            cards, embedded reviews in collaboration
                            cards

   WHAT'S NEW TO AGENCY ONLY:
     - Audience toggle (For Brands / For Creators)
     - "View managed brands" modal — agency's roster of brand clients
       with contract type badges (parallels creator's exclusivity modal)
     - Three-party campaign carousel — shows BOTH brand AND creator
       in every campaign ("We connected Kinetics with Amelia Roze")
     - Dual review carousels — brand reviews AND creator reviews,
       filtered by the audience toggle
     - Dual "Ways to Partner" card sets — one for brands, one for
       creators, also filtered by the toggle
   ════════════════════════════════════════════════════════════════════ */

const API        = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:5000'
const CARD       = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const CARD_HOVER = 'hover:shadow-[0_2px_6px_rgba(10,6,18,0.05),0_24px_56px_-16px_rgba(139,49,232,0.30)]'
const GRAD_BTN   = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

type Audience = 'brands' | 'creators'

/* ─── Agency identity ────────────────────────────────────────────── */
const AGENCY = {
  name: 'Baltic Creators Agency', initials: 'BC',
  location: 'Riga, Latvia · Operating Baltic-wide',
  bio: "We run influencer marketing end to end for Baltic brands that train, recover, and care about clean living — and we represent the creators who make that content honestly. We brief like marketers, pay creators on time, and never put a name on a deal that doesn't fit. Brands get a managed roster; creators get an agency that actually negotiates on their behalf.",
  categories: ['Sports Nutrition', 'Beauty', 'Fitness', 'Wellness'],
  coverUrl: '/test/images/Kinetics-Leader.png',
  avatarUrl: '/test/images/Harshul.png',
  websiteUrl: 'https://balticcreatorsagency.lv',
}

/* ─── Managed brands — parallels creator's EXCLUSIVE_DEALS ───────── */
const MANAGED_BRANDS = [
  {
    id: 'mb1', brand: 'Kinetics', category: 'Sports Nutrition', since: '2026',
    color: '#8B31E8', initials: 'KI', contractType: 'full_management' as const,
    scope: 'Full influencer marketing management',
    description: 'We run all of Kinetics\' creator partnerships — sourcing, contracts, content approval, and payouts — under a full management retainer.',
    retainer: '€1,200/mo retainer', duration: 'Rolling annual agreement',
  },
  {
    id: 'mb2', brand: 'Lumora Skincare', category: 'Beauty', since: '2026',
    color: '#059669', initials: 'LS', contractType: 'full_management' as const,
    scope: 'Full influencer marketing management',
    description: 'End-to-end management of Lumora\'s creator roster, campaign calendar, and affiliate program across the Baltics.',
    retainer: '€900/mo retainer', duration: 'Rolling annual agreement',
  },
  {
    id: 'mb3', brand: 'Forma Fit', category: 'Fitness apparel', since: '2026',
    color: '#2563EB', initials: 'FF', contractType: 'single_campaign' as const,
    scope: 'Single campaign delivery',
    description: 'Hired for one campaign — Training Block Q3 — covering creator sourcing, contracting, and delivery.',
    retainer: '€700 one-time fee', duration: 'Single campaign delivery',
  },
]

/* ─── Roster creators (shown in "Trusted by" marquee equivalent) ─── */
const ROSTER_CREATORS = ['Amelia Roze', 'Markus Tamm', 'Sandra Liepa', 'Rūta Vaitkutė', 'Jonas Petrauskas', 'Elīna Krūmiņa']

/* ─── Matrix data — split by audience, parallels brand's single 
       persona and creator's per-platform demographics ─────────────── */
const BRAND_STATS = [
  { to: 3,   dec: 0, suffix: '',  label: 'Brands managed'     },
  { to: 24,  dec: 0, suffix: '',  label: 'Creators in roster' },
  { to: 3.4, dec: 1, suffix: '×', label: 'Avg campaign ROAS'  },
  { to: 6,   dec: 0, suffix: 'h', label: 'Avg response time'  },
]
const CREATOR_STATS = [
  { to: 24,  dec: 0, suffix: '',  label: 'Active creators'    },
  { to: 420, dec: 0, suffix: '€', label: 'Avg fee per deal'   },
  { to: 15,  dec: 0, suffix: '%', label: 'Avg commission'     },
  { to: 3,   dec: 0, suffix: 'd', label: 'Avg payment speed'  },
]

const BRAND_PERSONA = {
  what_we_manage: 'We handle the full lifecycle for managed brand clients — creator sourcing, contract negotiation, content approval, and Grade-escrowed payouts — so brand teams can focus on strategy, not chasing deliverables.',
  primary_niche: 'Fitness, Sports Nutrition & Beauty',
  avg_contract_duration: '11 months',
  total_reach: '890K',
  avg_engagement: '8.3%',
  top_niches: [
    { name: 'Sports Nutrition', pct: 42 },
    { name: 'Beauty',           pct: 31 },
    { name: 'Fitness Apparel',  pct: 27 },
  ],
  avg_time_to_launch: '6 days',
}

const CREATOR_PERSONA = {
  what_we_offer: 'We negotiate rates creators can\'t get solo, handle every contract, and chase brand payments so creators never have to. Roster creators get first access to vetted brand deals before they\'re posted publicly.',
  roster_size: 24,
  avg_deals_per_month: '2.1',
  top_brand_categories: [
    { name: 'Sports Nutrition', pct: 38 },
    { name: 'Beauty & Skincare',pct: 34 },
    { name: 'Fitness Apparel',  pct: 28 },
  ],
  avg_creator_tenure: '8 months',
  satisfaction_score: '4.8 / 5',
}

/* ─── Three-party campaign carousel — agency-only, shows both parties ── */
const CAMPAIGNS = [
  {
    id: 'ac1', brand: 'Kinetics', brandColor: '#8B31E8', brandInitials: 'KI',
    creator: 'Amelia Roze', handle: '@amelia.roze', niche: 'Fitness & Lifestyle',
    title: 'Electrolyte Hot Yoga launch',
    description: 'We matched Kinetics with Amelia for a hot-yoga recovery campaign — sourced the creator, negotiated the flat-fee deal, and managed content approval end to end on Kinetics\' behalf.',
    target: 'Women 22–38 training consistently', result: '€2,600 campaign budget, 3.2× engagement vs brand average',
    videoSrc: '/test/video/Drink.mp4',
    insight: 'Matching the right niche creator to the right brand cut campaign setup time from the usual 3 weeks to 6 days — and the agency fee was fully transparent to both sides from the first message.',
    metrics: [
      { icon: 'eye',   label: 'Views',       value: '310K' },
      { icon: 'heart', label: 'Engagement',  value: '7.2%' },
      { icon: 'cart',  label: 'ROAS',        value: '3.2×' },
      { icon: 'share', label: 'Shares',      value: '4.8K' },
    ],
  },
  {
    id: 'ac2', brand: 'Lumora Skincare', brandColor: '#059669', brandInitials: 'LS',
    creator: 'Sandra Liepa', handle: '@sandra.liepa', niche: 'Beauty',
    title: 'Morning Ritual — Vitamin C Serum',
    description: 'A full-management deal — we sourced Sandra from our roster, drafted the creator contract, and handled every revision round so Lumora\'s team never had to touch a single message.',
    target: 'Skincare enthusiasts 24–34', result: '€320 commission earned, 9.6% engagement rate',
    videoSrc: '/test/video/Food.mp4',
    insight: 'Roster-first matching meant Lumora got a creator who already understood their brand voice — zero brief rejections, one revision round total.',
    metrics: [
      { icon: 'eye',   label: 'Views',        value: '245K' },
      { icon: 'heart', label: 'Engagement',   value: '9.6%' },
      { icon: 'users', label: 'New followers', value: '+3.1K'},
      { icon: 'message', label: 'DMs',         value: '890'  },
    ],
  },
  {
    id: 'ac3', brand: 'Forma Fit', brandColor: '#2563EB', brandInitials: 'FF',
    creator: 'Rūta Vaitkutė', handle: '@ruta.glow', niche: 'Wellness',
    title: 'Training Block Q3',
    description: 'A single-campaign delivery — Forma Fit hired us for one campaign only. We sourced and contracted Rūta, ran the brief, and delivered the full content package on time.',
    target: 'Endurance & strength training audiences', result: '€700 delivery fee, 4 pieces delivered on schedule',
    videoSrc: '/test/video/People.mp4',
    insight: 'Single-campaign clients get the same roster access and contract rigor as full-management clients — the only difference is scope, not quality.',
    metrics: [
      { icon: 'eye',   label: 'Views',        value: '180K' },
      { icon: 'share', label: 'Shares',       value: '2.2K' },
      { icon: 'cart',  label: 'Conversions',  value: '920'  },
      { icon: 'users', label: 'New followers', value: '+1.8K'},
    ],
  },
]

/* ─── Dual reviews — brand reviews AND creator reviews ───────────── */
const BRAND_REVIEWS = [
  {
    id: 'br1', name: 'Mārtiņš Ozols', role: 'Founder', company: 'Kinetics',
    color: '#8B31E8', initials: 'KI', rating: 5, date: 'Jun 2026',
    quote: "Baltic Creators Agency briefs like an in-house marketing team, not a vendor. They sourced three creators in under a week, the contracts were watertight, and I haven't had to chase a single deliverable since we signed.",
  },
  {
    id: 'br2', name: 'Anna Kalniņa', role: 'Marketing Lead', company: 'Lumora Skincare',
    color: '#059669', initials: 'LS', rating: 5, date: 'May 2026',
    quote: "We tried managing creators ourselves for a year before signing with this agency. The difference is night and day — roster-matched creators who actually fit our brand voice, and payments that never get delayed.",
  },
  {
    id: 'br3', name: 'Jānis Bērziņš', role: 'Brand Director', company: 'Forma Fit',
    color: '#2563EB', initials: 'FF', rating: 4, date: 'Apr 2026',
    quote: "We only hired them for one campaign and the rigor was the same as I'd expect from a full retainer client. Only note — turnaround on the brief took a few extra days because we weren't on a retainer.",
  },
]

const CREATOR_REVIEWS = [
  {
    id: 'cr1', name: 'Amelia Roze', handle: '@amelia.roze', niche: 'Fitness & Lifestyle', followers: '142K',
    color: '#8B31E8', initials: 'AR', rating: 5, date: 'Jun 2026',
    quote: "I'd been turning down brand DMs for months because negotiating rates myself was exhausting. The agency got me a better rate than I was asking for myself and handled every contract revision — I just show up and make content now.",
  },
  {
    id: 'cr2', name: 'Sandra Liepa', handle: '@sandra.liepa', niche: 'Beauty', followers: '89K',
    color: '#DB2777', initials: 'SL', rating: 5, date: 'May 2026',
    quote: "Payment used to be my biggest stress with brand deals — always chasing invoices. With the agency collecting and distributing, I've never once had to follow up on a payment. That alone is worth the roster fee.",
  },
  {
    id: 'cr3', name: 'Jonas Petrauskas', handle: '@jonas.fit', niche: 'Strength Training', followers: '94K',
    color: '#D97706', initials: 'JP', rating: 4, date: 'Mar 2026',
    quote: "Solid deal flow and they negotiate hard on my behalf, which I appreciate. The only thing I'd want is more lead time before campaign launches — but the partnerships themselves have all been fair and on-brief.",
  },
]

const BRAND_COLLAB_TYPES = ['Full management', 'Single campaign', 'Consulting only']
const CREATOR_COLLAB_TYPES = ['Full roster representation', 'Single campaign deal', 'Referral only']

/* ═══════════════════════ ICONS ═══════════════════════════════════════ */
function Check({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function Shield({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function StarIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z"/></svg>
}
function ZapIcon({ s = 28 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function HandshakeIcon({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 3l1 11h-2M3 3l-1 11 6.5 6.5a1 1 0 103-3M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function Play({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
}
function Pin({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6"/></svg>
}
function LightbulbIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21h6M12 3a7 7 0 014.9 11.9c-.6.6-1.1 1.3-1.4 2.1H8.5c-.3-.8-.8-1.5-1.4-2.1A7 7 0 0112 3z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function CalendarIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
}
function GlobeIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/><path d="M12 2c-2.8 3-4 6-4 10s1.2 7 4 10M12 2c2.8 3 4 6 4 10s-1.2 7-4 10M2 12h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
}
function UsersIcon({ s = 26 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function MetricEyeIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function HeartIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CartIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ShareIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function MessageIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function MetricIcon({ name, s = 18 }: { name: string; s?: number }) {
  switch (name) {
    case 'eye': return <MetricEyeIcon s={s}/>
    case 'heart': return <HeartIcon s={s}/>
    case 'cart': return <CartIcon s={s}/>
    case 'share': return <ShareIcon s={s}/>
    case 'users': return <UsersIcon s={s}/>
    case 'message': return <MessageIcon s={s}/>
    default: return <MetricEyeIcon s={s}/>
  }
}
function ChatBubbleIcon({ s = 32 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function BriefcaseIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function RepeatIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function RocketIcon({ s = 26 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 7 6 7 13h10c0-7-5-11-5-11z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13c0 2.5 1 4 2.5 5.5L12 21l2.5-2.5C16 17 17 15.5 17 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="11" r="1.5" fill="currentColor"/></svg>
}
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}

const SOCIAL_LINKS = [
  { key: 'instagram', label: 'Instagram', href: '#', src: '/Socials/Instagram.svg' },
  { key: 'tiktok',    label: 'TikTok',    href: '#', src: '/Socials/TikTok.svg'    },
  { key: 'youtube',   label: 'YouTube',   href: '#', src: '/Socials/YouTube.svg'   },
  { key: 'linkedin',  label: 'LinkedIn',  href: '#', src: '/Socials/LinkedIn.svg'  },
  { key: 'facebook',  label: 'Facebook',  href: '#', src: '/Socials/Facebook.svg'  },
]

/* ─── Gradient stars — identical to both reference pages ────────── */
function GradientStars({ rating, total = 5, size = 22, idSuffix = '' }: { rating: number; total?: number; size?: number; idSuffix?: string }) {
  const fillId   = `nex-star-fill${idSuffix}`
  const strokeId = `nex-star-stroke${idSuffix}`
  const STAR = 'M12 2l2.8 6.2 6.8.6-5 4.5 1.5 6.7L12 16.5l-6.1 3.5 1.5-6.7-5-4.5 6.8-.6z'
  return (
    <div className="flex items-center gap-1.5">
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id={fillId}   x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8B31E8"/><stop offset="55%" stopColor="#A855F7"/><stop offset="100%" stopColor="#FF33BC"/></linearGradient>
          <linearGradient id={strokeId} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8B31E8"/><stop offset="55%" stopColor="#A855F7"/><stop offset="100%" stopColor="#FF33BC"/></linearGradient>
        </defs>
      </svg>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" overflow="visible">
          {i < rating ? (
            <><path d={STAR} fill={`url(#${fillId})`} stroke="white" strokeWidth="3" strokeLinejoin="round" paintOrder="stroke"/><path d={STAR} fill="none" stroke={`url(#${strokeId})`} strokeWidth="1.6" strokeLinejoin="round"/></>
          ) : (
            <><path d={STAR} fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round"/><path d={STAR} fill="none" stroke={`url(#${strokeId})`} strokeWidth="1.6" strokeLinejoin="round" opacity="0.35"/></>
          )}
        </svg>
      ))}
    </div>
  )
}

/* ─── Reveal — identical to both reference pages ─────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    io.observe(el); return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  )
}

/* ─── Animated stat ───────────────────────────────────────────────── */
function Stat({ to, dec, suffix, label }: { to: number; dec: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [val, setVal] = useState(0)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return; io.disconnect()
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVal(to); return }
      const dur = 1500, t0 = performance.now()
      const tick = (n: number) => { const p = Math.min((n - t0) / dur, 1); setVal(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); else setVal(to) }
      requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    io.observe(el); return () => io.disconnect()
  }, [to])
  return (
    <div ref={ref} className="relative px-2 py-3 text-center">
      <div className="text-[clamp(28px,4.2vw,42px)] font-black leading-none tracking-[-0.045em] text-ink">
        {val.toFixed(dec)}<span className={GRAD_TEXT}>{suffix}</span>
      </div>
      <div className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/45">{label}</div>
    </div>
  )
}

/* ─── Section head — identical to both reference pages ───────────── */
function SectionHead({ kicker, children, sub, className = '' }: { kicker: string; children: ReactNode; sub?: string; className?: string }) {
  return (
    <Reveal className={`text-center ${className}`}>
      <div className="mb-4 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5"><span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/50 sm:w-16"/><span className="h-1 w-1 rounded-full bg-primary/60"/></div>
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-ink/50">{kicker}</p>
        <div className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-magenta/60"/><span className="h-px w-10 bg-gradient-to-r from-magenta/50 to-transparent sm:w-16"/></div>
      </div>
      <h2 className="text-[clamp(30px,4.8vw,48px)] font-black leading-[1.02] tracking-[-0.045em] text-ink">{children}</h2>
      {sub && <p className="mx-auto mt-4 max-w-[540px] text-base leading-[1.7] text-ink/60">{sub}</p>}
    </Reveal>
  )
}

const G = ({ children }: { children: ReactNode }) => <span className={GRAD_TEXT}>{children}</span>

function PersonAvatar({ name, color, avatarUrl, initials, size = 48 }: { name: string; color: string; avatarUrl?: string | null; initials?: string; size?: number }) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatarUrl) {
    return (
      <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" draggable={false}/>
      </div>
    )
  }
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-sm" style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>{abbr}</div>
  )
}

function EntityLogo({ name, color, initials, size = 48 }: { name: string; color: string; initials?: string; size?: number }) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white shadow-sm" style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>{abbr}</div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   AUDIENCE TOGGLE — the single most important agency-only mechanic.
   Switches the Matrix, Work framing, and Reviews sections below it
   between "For Brands" and "For Creators" framing.
   ════════════════════════════════════════════════════════════════════ */
function AudienceToggle({ audience, onChange }: { audience: Audience; onChange: (a: Audience) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-primary/12 bg-white p-1.5 shadow-sm">
      {([
        { id: 'brands' as Audience,   label: 'For Brands',   icon: <BriefcaseIcon s={14}/> },
        { id: 'creators' as Audience, label: 'For Creators', icon: <UsersIcon s={14}/>     },
      ]).map(opt => (
        <button key={opt.id} onClick={() => onChange(opt.id)}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition ${
            audience === opt.id ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]` : 'text-ink/50 hover:text-ink/80'
          }`}>
          {opt.icon}{opt.label}
        </button>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MANAGED BRANDS MODAL — parallels creator page's PartnershipsModal.
   Shows the agency's brand client roster with contract type badges.
   ════════════════════════════════════════════════════════════════════ */
function ManagedBrandsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className={`fixed inset-0 z-[600] flex items-center justify-center bg-ink/55 p-5 backdrop-blur-[6px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div role="dialog" aria-modal="true"
        className={`flex max-h-[90vh] w-full max-w-[580px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_-12px_rgba(10,6,18,0.35)] transition-all duration-300 ease-[cubic-bezier(0.34,1.5,0.64,1)] ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}>
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 bg-white px-7 py-5">
          <div>
            <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">Managed Brands</h3>
            <p className="mt-0.5 text-[12px] text-ink/45">{MANAGED_BRANDS.length} brand clients currently managed</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sub text-[13px] text-ink/45 transition hover:bg-surface-card hover:text-ink">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
          {MANAGED_BRANDS.map(b => (
            <div key={b.id} className={`rounded-2xl border bg-white p-5 ${CARD} ${b.contractType === 'full_management' ? 'border-primary/20' : 'border-primary/10'}`}
              style={{ background: `linear-gradient(135deg, ${b.color}0a 0%, transparent 60%)` }}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <EntityLogo name={b.brand} color={b.color} initials={b.initials} size={48}/>
                  <div>
                    <span className="block text-[18px] font-black leading-tight tracking-[-0.03em]" style={{ color: b.color }}>{b.brand}</span>
                    <span className="text-[12px] font-semibold text-ink/50">{b.scope}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {b.contractType === 'full_management'
                    ? <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${GRAD_BTN} text-white`}><RepeatIcon s={8}/>Managed</span>
                    : <span className="rounded-md border border-primary/20 bg-primary/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">Single campaign</span>
                  }
                  <span className="rounded-md border border-primary/12 bg-primary/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary/70">{b.category}</span>
                </div>
              </div>
              <p className="text-[13px] leading-[1.75] text-ink/65">{b.description}</p>
              <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-primary/8 pt-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/45"><CalendarIcon s={12}/>{b.duration} · Since {b.since}</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/45">{b.retainer}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 border-t border-primary/10 bg-white px-7 py-4">
          <button onClick={onClose} className={`w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)] transition hover:-translate-y-0.5`}>Close</button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PERSONA BENTO — audience-dependent. Reuses brand page's bento card
   layout but swaps the data source based on the toggle.
   ════════════════════════════════════════════════════════════════════ */
function PersonaBento({ audience }: { audience: Audience }) {
  if (audience === 'brands') {
    const p = BRAND_PERSONA
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Reveal className="col-span-2 row-span-2">
          <div className={`relative flex h-full min-h-[220px] flex-col rounded-2xl border border-primary/10 bg-white p-7 ${CARD}`}>
            <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/12 bg-surface-sub text-primary"><ChatBubbleIcon s={26}/></div>
            <span className="inline-flex w-fit items-center rounded-lg bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">What we manage</span>
            <div className="mt-auto pt-6">
              <p className="text-[15px] leading-[1.8] text-ink/70">{p.what_we_manage}</p>
              <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink/35">{p.primary_niche}</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Avg contract</p>
            <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.avg_contract_duration}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Duration with brand</p></div>
          </div>
        </Reveal>
        <Reveal delay={90}>
          <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Total reach</p>
            <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.total_reach}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Across full roster</p></div>
          </div>
        </Reveal>
        <Reveal delay={120} className="col-span-2">
          <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Top niches we cover</p>
            <div className="space-y-3">
              {p.top_niches.map(n => (
                <div key={n.name} className="flex items-center gap-3">
                  <span className="w-32 flex-shrink-0 text-[12.5px] font-semibold text-ink/70">{n.name}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-primary/[0.08]" style={{ height: 8 }}><div className={`h-full rounded-full ${GRAD_BTN}`} style={{ width: `${n.pct}%` }}/></div>
                  <span className={`w-9 flex-shrink-0 text-right text-[12px] font-bold ${GRAD_TEXT}`}>{n.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <Reveal delay={150}>
          <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <div className="flex items-start justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Avg engagement</p><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><HeartIcon s={18}/></span></div>
            <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.avg_engagement}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Across roster creators</p></div>
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <div className="flex items-start justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Time to launch</p><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><RocketIcon s={18}/></span></div>
            <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.avg_time_to_launch}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Brief to first content</p></div>
          </div>
        </Reveal>
      </div>
    )
  }

  /* audience === 'creators' */
  const p = CREATOR_PERSONA
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Reveal className="col-span-2 row-span-2">
        <div className={`relative flex h-full min-h-[220px] flex-col rounded-2xl border border-primary/10 bg-white p-7 ${CARD}`}>
          <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/12 bg-surface-sub text-primary"><ChatBubbleIcon s={26}/></div>
          <span className="inline-flex w-fit items-center rounded-lg bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">What we offer creators</span>
          <div className="mt-auto pt-6">
            <p className="text-[15px] leading-[1.8] text-ink/70">{p.what_we_offer}</p>
            <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink/35">Full negotiation & payment handling</p>
          </div>
        </div>
      </Reveal>
      <Reveal delay={60}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <div className="flex items-start justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Roster size</p><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><UsersIcon s={18}/></span></div>
          <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.roster_size}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Active creators</p></div>
        </div>
      </Reveal>
      <Reveal delay={90}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Deals / month</p>
          <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.avg_deals_per_month}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Avg per roster creator</p></div>
        </div>
      </Reveal>
      <Reveal delay={120} className="col-span-2">
        <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Top brand categories on offer</p>
          <div className="space-y-3">
            {p.top_brand_categories.map(n => (
              <div key={n.name} className="flex items-center gap-3">
                <span className="w-32 flex-shrink-0 text-[12.5px] font-semibold text-ink/70">{n.name}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-primary/[0.08]" style={{ height: 8 }}><div className={`h-full rounded-full ${GRAD_BTN}`} style={{ width: `${n.pct}%` }}/></div>
                <span className={`w-9 flex-shrink-0 text-right text-[12px] font-bold ${GRAD_TEXT}`}>{n.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal delay={150}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <div className="flex items-start justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Avg tenure</p><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><CalendarIcon s={18}/></span></div>
          <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.avg_creator_tenure}</div><p className="mt-1 text-[12px] font-medium text-ink/45">On the roster</p></div>
        </div>
      </Reveal>
      <Reveal delay={180}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <div className="flex items-start justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Satisfaction</p><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><StarIcon s={18}/></span></div>
          <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.satisfaction_score}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Roster creator rating</p></div>
        </div>
      </Reveal>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   GALLERY BENTO — verbatim photo mosaic + phone video pattern
   ════════════════════════════════════════════════════════════════════ */
const GALLERY_IMAGES = [
  { id: 'g1', src: '/test/images/Lecture.png'         },
  { id: 'g2', src: '/test/images/Listening.png'       },
  { id: 'g3', src: '/test/images/Kinetics-Leader.png' },
  { id: 'g4', src: '/test/images/Drink.png'           },
  { id: 'g5', src: '/test/images/Food.png'            },
]
const GALLERY_VIDEO_SRC = '/test/video/Drink.mp4'

function GalleryBento() {
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-h-0 flex-[5] gap-3">
          <Reveal delay={0} className="flex min-h-0 flex-[5] flex-col">
            <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY_IMAGES[0]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
            </div>
          </Reveal>
          <div className="flex min-h-0 flex-[6] flex-col gap-3">
            <Reveal delay={60} className="flex min-h-0 flex-[3] flex-col">
              <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={GALLERY_IMAGES[1]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
              </div>
            </Reveal>
            <Reveal delay={100} className="flex min-h-0 flex-[2] flex-col">
              <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={GALLERY_IMAGES[2]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="flex min-h-0 flex-[3] gap-3">
          <Reveal delay={140} className="flex min-h-0 flex-[7] flex-col">
            <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY_IMAGES[3]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
            </div>
          </Reveal>
          <Reveal delay={180} className="flex min-h-0 flex-[4] flex-col">
            <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GALLERY_IMAGES[4]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
            </div>
          </Reveal>
        </div>
      </div>
      <Reveal delay={80} className="flex-shrink-0"><Phone src={GALLERY_VIDEO_SRC}/></Reveal>
    </div>
  )
}

/* ─── iPhone reel — verbatim from both reference pages ────────────── */
function Phone({ src, label }: { src?: string; label?: string }) {
  return (
    <div className="relative w-[210px] flex-shrink-0 snap-center sm:w-[220px]">
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] border-[7px] border-ink bg-ink shadow-[0_24px_50px_-16px_rgba(10,6,18,0.5)]">
        <div className="absolute left-1/2 top-2.5 z-10 h-4 w-20 -translate-x-1/2 rounded-lg bg-ink"/>
        {src ? <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover"/>
          : <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/25 via-primary-lt/20 to-magenta/25 text-white/70">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Play/></span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em]">{label || 'Reel'}</span>
            </div>}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   THREE-PARTY CAMPAIGN CAROUSEL — agency-only.
   Shows BOTH brand and creator in every card — neither the brand nor
   creator reference page needs to display the other counterparty.
   ════════════════════════════════════════════════════════════════════ */
function CampaignCarousel({ campaigns }: { campaigns: typeof CAMPAIGNS }) {
  const [current, setCurrent] = useState(0)
  const total = campaigns.length
  const prev = () => setCurrent(c => c > 0 ? c - 1 : c)
  const next = () => setCurrent(c => c < total - 1 ? c + 1 : c)
  const item = campaigns[current]
  if (!item) return null

  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between sm:justify-end">
        <span className="text-sm font-medium text-ink/40 sm:hidden">{current + 1} / {total}</span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-ink/40 sm:inline">{current + 1} / {total}</span>
          <div className="flex gap-1.5">
            <button onClick={prev} disabled={current === 0} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={next} disabled={current === total - 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div className={`flex flex-col gap-6 rounded-2xl border border-primary/10 bg-white p-6 transition hover:-translate-y-1 sm:flex-row sm:p-8 ${CARD} ${CARD_HOVER}`}>
        <div className="flex flex-1 flex-col space-y-4 pr-0 sm:pr-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">Featured campaign</span>
            <span className="text-xs font-medium text-ink/40">#{current + 1}</span>
          </div>
          {/* Three-party header — both brand and creator shown */}
          <div>
            <div className="mb-2 flex items-center gap-2.5">
              <EntityLogo name={item.brand} color={item.brandColor} initials={item.brandInitials} size={32}/>
              <span className="text-[13px] font-bold text-ink/70">{item.brand}</span>
              <span className="text-ink/25">×</span>
              <PersonAvatar name={item.creator} color="#8B31E8" initials={item.creator.split(' ').map(w => w[0]).join('')} size={32}/>
              <span className="text-[13px] font-bold text-ink/70">{item.creator}</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">We connected <G>{item.brand}</G> with <G>{item.creator}</G></h3>
            <p className="mt-1 text-lg font-semibold text-ink/80">{item.title}</p>
            <p className="mt-0.5 text-[13px] font-medium text-ink/40">{item.handle} · {item.niche}</p>
          </div>
          <p className="text-[15px] leading-relaxed text-ink/70">{item.description}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm">
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary"/><span className="font-medium text-ink/60">Target:</span><span className="font-semibold text-ink">{item.target}</span></span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-magenta"/><span className="font-medium text-ink/60">Result:</span><span className="font-semibold text-ink">{item.result}</span></span>
          </div>
          {item.metrics && (
            <div className="grid grid-cols-2 gap-2.5">
              {item.metrics.map((m, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-surface-sub px-3.5 py-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><MetricIcon name={m.icon} s={16}/></span>
                  <div><div className="text-[13px] font-black tracking-[-0.02em] text-ink">{m.value}</div><div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/40">{m.label}</div></div>
                </div>
              ))}
            </div>
          )}
          {item.insight && (
            <div className="rounded-lg border border-primary/10 bg-primary/[0.03] px-4 py-3">
              <p className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/[0.10] text-primary"><LightbulbIcon s={13}/></span>Key insight</p>
              <p className="text-sm font-medium leading-relaxed text-ink/70">{item.insight}</p>
            </div>
          )}
        </div>
        <div className="flex justify-center sm:justify-end"><Phone src={item.videoSrc} label={item.title}/></div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DUAL REVIEWS CAROUSEL — audience-dependent.
   Brand reviews when audience='brands', creator reviews when 'creators'.
   ════════════════════════════════════════════════════════════════════ */
function ReviewsCarousel({ audience }: { audience: Audience }) {
  const reviews = audience === 'brands' ? BRAND_REVIEWS : CREATOR_REVIEWS
  const [index, setIndex]   = useState(0)
  const [paused, setPaused] = useState(false)
  const total = reviews.length

  useEffect(() => { setIndex(0) }, [audience])
  useEffect(() => {
    if (paused || total <= 1) return
    const id = setInterval(() => setIndex(i => (i + 1) % total), 6000)
    return () => clearInterval(id)
  }, [paused, total])
  const go = (i: number) => setIndex(((i % total) + total) % total)

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-ink/40">{index + 1} / {total}</span>
        <div className="flex gap-1.5">
          <button onClick={() => go(index - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={() => go(index + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateX(-${index * 100}%)` }}>
          {reviews.map(r => {
            const isCreator = 'handle' in r
            return (
              <div key={r.id} className="w-full flex-shrink-0 px-0.5">
                <div className={`rounded-2xl border border-primary/10 bg-white p-7 sm:p-9 ${CARD}`}>
                  <div className="mb-5 flex items-center justify-between">
                    <GradientStars rating={r.rating} total={5} size={22} idSuffix={`-${r.id}`}/>
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/35">{r.date}</span>
                  </div>
                  <p className="text-[16.5px] leading-[1.85] text-ink/75 sm:text-[17.5px]">"{r.quote}"</p>
                  <div className="mt-7 flex items-center gap-3.5 border-t border-primary/10 pt-5">
                    {isCreator
                      ? <PersonAvatar name={r.name} color={r.color} initials={r.initials} size={48}/>
                      : <EntityLogo  name={r.name} color={r.color} initials={r.initials} size={48}/>
                    }
                    <div className="flex-1">
                      <div className="text-[14.5px] font-bold text-ink">{r.name}</div>
                      <div className="mt-0.5 text-[12px] text-ink/50">
                        {isCreator
                          ? `${(r as typeof CREATOR_REVIEWS[number]).handle} · ${(r as typeof CREATOR_REVIEWS[number]).niche} · ${(r as typeof CREATOR_REVIEWS[number]).followers} followers`
                          : `${(r as typeof BRAND_REVIEWS[number]).role} · ${(r as typeof BRAND_REVIEWS[number]).company}`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {reviews.map((r, i) => (
          <button key={r.id} onClick={() => go(i)} className={`h-2 rounded-full transition-all ${i === index ? `w-7 ${GRAD_BTN}` : 'w-2 bg-primary/15 hover:bg-primary/30'}`}/>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   WORK MODEL CARD — audience-dependent feature sets.
   ════════════════════════════════════════════════════════════════════ */
function WorkModel({ name, price, priceLabel, icon, features, description, popular = false, delay = 0, onChoose }: {
  name: string; price: string; priceLabel: string; icon: ReactNode
  features: string[]; description: string; popular?: boolean; delay?: number; onChoose: () => void
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className={`group relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-all hover:-translate-y-2 hover:shadow-xl ${popular ? 'border-primary/30 bg-gradient-to-br from-primary/[0.08] via-primary-lt/[0.04] to-magenta/[0.06] ring-2 ring-primary/20' : 'border-primary/10'} ${CARD} ${CARD_HOVER}`}>
        {popular && <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${GRAD_BTN} px-4 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_4px_12px_rgba(139,49,232,0.4)]`}>Most popular</span>}
        <div className={`mb-4 flex items-center justify-center rounded-xl border border-primary/10 bg-surface-sub text-primary ${popular ? 'h-16 w-16' : 'h-14 w-14'}`}>{icon}</div>
        <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{name}</h3>
        <div className="mt-1 flex items-baseline gap-1.5"><span className="text-2xl font-black text-ink">{price}</span><span className="text-sm font-medium text-ink/50">{priceLabel}</span></div>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">{description}</p>
        <ul className="mt-4 flex-1 space-y-2 border-t border-primary/10 pt-4 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-ink/70"><span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r from-primary to-magenta"/>{f}</li>
          ))}
        </ul>
        <button onClick={onChoose} className={`mt-6 w-full rounded-lg py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${popular ? `${GRAD_BTN} text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)] hover:shadow-xl` : 'border border-primary/20 bg-white text-primary hover:bg-primary/[0.04]'}`}>Choose this</button>
      </div>
    </Reveal>
  )
}

/* Work models filtered by audience — two distinct card sets */
function WorkModelsGrid({ audience, onChoose }: { audience: Audience; onChoose: () => void }) {
  if (audience === 'brands') {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <WorkModel delay={0} name="Full Management" price="From €900" priceLabel="/month retainer"
          icon={<RepeatIcon s={28}/>}
          features={['All campaigns sourced & run for you','Dedicated roster matching','Contract & payment handling','Monthly performance reporting']}
          description="We run your entire influencer program — you set the goals, we handle everything else."
          popular={true} onChoose={onChoose}/>
        <WorkModel delay={90} name="Single Campaign" price="From €700" priceLabel="one-time fee"
          icon={<ZapIcon s={28}/>}
          features={['One campaign, fully managed','Creator sourcing & contracts','Content approval handled','No ongoing commitment']}
          description="Try us on one campaign before committing to a retainer." popular={false} onChoose={onChoose}/>
        <WorkModel delay={180} name="Consulting Only" price="From €350" priceLabel="per session"
          icon={<HandshakeIcon s={28}/>}
          features={['Strategy & creator brief review','No execution — advice only','Flexible, pay-as-you-go','Good fit for in-house teams']}
          description="Keep running campaigns yourself — we just advise on strategy." popular={false} onChoose={onChoose}/>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      <WorkModel delay={0} name="Full Roster Representation" price="15%" priceLabel="of deal value"
        icon={<RepeatIcon s={28}/>}
        features={['We negotiate every deal for you','Contract & payment handling','First access to vetted brand deals','Dedicated point of contact']}
        description="We represent you across every brand deal — you focus on content, we handle the business." popular={true} onChoose={onChoose}/>
      <WorkModel delay={90} name="Single Campaign Deal" price="10%" priceLabel="of deal value"
        icon={<ZapIcon s={28}/>}
        features={['One deal, fully negotiated','Contract drafted for you','Payment collection handled','No ongoing commitment']}
        description="Let us negotiate just one deal — see if representation is right for you." popular={false} onChoose={onChoose}/>
      <WorkModel delay={180} name="Referral Only" price="5%" priceLabel="of deal value"
        icon={<HandshakeIcon s={28}/>}
        features={['We just make the introduction','You negotiate directly','Minimal involvement','Lowest fee tier']}
        description="We connect you with the brand — you take it from there." popular={false} onChoose={onChoose}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CONTACT MODAL — audience-aware copy and fields.
   type='brand_enquiry' for brands wanting management
   type='creator_apply' for creators wanting to join the roster
   type='message' generic contact
   ════════════════════════════════════════════════════════════════════ */
function ContactModal({ open, type, slug, agencyName, onClose }: {
  open: boolean; type: 'brand_enquiry' | 'creator_apply' | 'message'; slug: string; agencyName: string; onClose: () => void
}) {
  const isBrand   = type === 'brand_enquiry'
  const isCreator = type === 'creator_apply'
  const [form, setForm] = useState({ name: '', company: '', handle: '', email: '', message: '' })
  const [collabType, setCollabType] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ok = form.name.trim() && form.email.trim() && form.message.trim()
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; setSent(false); setError(''); setForm({ name: '', company: '', handle: '', email: '', message: '' }); setCollabType('') }
    return () => { document.body.style.overflow = '' }
  }, [open, type])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const submit = async () => {
    if (!ok) return; setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/inbox/${slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, senderName: form.name, senderCompany: form.company, senderHandle: form.handle, senderEmail: form.email, message: form.message, collabType }) })
      const json = await res.json().catch(() => ({ success: true }))
      if (!json.success && res.status !== 429) throw new Error(json.message || 'Could not send.')
      setSent(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send. Please try again.') } finally { setLoading(false) }
  }

  const inp = 'w-full rounded-lg border border-primary/12 bg-surface-sub px-4 py-3 font-rubik text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30'
  const lbl = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/50'

  const title = isBrand ? 'Hire us to manage your brand' : isCreator ? 'Apply to join our roster' : 'Send a message'

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className={`fixed inset-0 z-[500] flex items-center justify-center bg-ink/50 p-5 backdrop-blur-[6px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div role="dialog" aria-modal="true"
        className={`max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_70px_-12px_rgba(10,6,18,0.3)] transition-all duration-300 ease-[cubic-bezier(0.34,1.5,0.64,1)] ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/10 bg-white px-6 py-5">
          <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{sent ? 'Message sent!' : title}</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sub text-base text-ink/50 transition hover:bg-surface-card hover:text-ink">✕</button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/12 text-green-500"><Check s={30}/></div>
              <h3 className="mb-2 text-xl font-extrabold text-ink">{isCreator ? "You're in the inbox!" : 'Message sent!'}</h3>
              <p className="mx-auto max-w-[340px] text-sm leading-[1.7] text-ink/65">{form.name && `Thanks, ${form.name.split(' ')[0]} — `}{agencyName} will reply to <b className="text-primary">{form.email || 'your email'}</b> within 48 hours.</p>
              <button onClick={onClose} className={`mx-auto mt-6 rounded-lg ${GRAD_BTN} px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5`}>Done</button>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm leading-[1.6] text-ink/65">
                {isBrand ? "Tell us about your brand and goals — we'll reply with a tailored proposal within 48 hours." :
                 isCreator ? "Tell us about your audience and what you create — we'll reply with next steps within 48 hours." :
                 'Introduce yourself and tell us what you have in mind. We read every message.'}
              </p>
              {error && <div className="mb-4 rounded-lg border border-primary/40 bg-primary/[0.06] px-3 py-2 text-[13px] text-primary">{error}</div>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className={lbl}>Your name *</label><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith"/></div>
                {isBrand
                  ? <div><label className={lbl}>Company</label><input className={inp} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Brand Co."/></div>
                  : <div><label className={lbl}>@handle or portfolio</label><input className={inp} value={form.handle} onChange={e => set('handle', e.target.value)} placeholder="@yourhandle"/></div>
                }
              </div>
              <div className="mt-4"><label className={lbl}>Email address *</label><input type="email" className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@email.com"/></div>
              {isBrand && (
                <div className="mt-4"><label className={lbl}>Engagement type</label>
                  <div className="flex flex-wrap gap-2">{BRAND_COLLAB_TYPES.map(ct => <button key={ct} type="button" onClick={() => setCollabType(ct)} className={`rounded-lg border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition ${collabType === ct ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>{ct}</button>)}</div>
                </div>
              )}
              {isCreator && (
                <div className="mt-4"><label className={lbl}>Preferred representation type</label>
                  <div className="flex flex-wrap gap-2">{CREATOR_COLLAB_TYPES.map(ct => <button key={ct} type="button" onClick={() => setCollabType(ct)} className={`rounded-lg border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition ${collabType === ct ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>{ct}</button>)}</div>
                </div>
              )}
              <div className="mt-4"><label className={lbl}>{isBrand ? 'Tell us about your brand *' : isCreator ? "Why you'd be a good fit *" : 'Your message *'}</label>
                <textarea className={`${inp} min-h-[108px] resize-y leading-relaxed`} value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder={isBrand ? 'What do you sell? What are your influencer marketing goals?' : isCreator ? 'What do you create? Who is your audience?' : `Hi ${agencyName}, I'm reaching out because…`}/>
              </div>
              <button onClick={submit} disabled={!ok || loading}
                className={`mt-5 w-full rounded-lg ${GRAD_BTN} py-3.5 text-[15px] font-bold text-white shadow-[0_8px_28px_-6px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-surface-card disabled:bg-none disabled:text-ink/30 disabled:shadow-none`}>
                {loading ? 'Sending…' : `Send ${isBrand ? 'enquiry' : isCreator ? 'application' : 'message'}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function Page() {
  const [modal, setModal] = useState<'brand_enquiry' | 'creator_apply' | 'message' | null>(null)
  const [brandsModalOpen, setBrandsModalOpen] = useState(false)
  const [audience, setAudience] = useState<Audience>('brands')
  const a = AGENCY
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const NAV_LEFT  = [{ label: 'About', action: () => scrollTo('about') }, { label: 'Performance', action: () => scrollTo('matrix') }]
  const NAV_RIGHT = [{ label: 'Campaigns', action: () => scrollTo('work') }, { label: 'Contact', action: () => setModal('message') }]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════════ HEADER ════════ */}
      <header className="relative">
        <div className="relative h-[260px] w-full overflow-hidden bg-gradient-to-br from-primary/30 via-primary-lt/25 to-magenta/30 sm:h-[320px] md:h-[360px]"
          style={a.coverUrl ? { backgroundImage: `url(${a.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-canvas/30"/>
        </div>

        {/* Nav pill */}
        <div className="absolute inset-x-0 z-40 flex justify-center px-4" style={{ top: 28 }}>
          <div className="w-full max-w-[600px]">
            <div className="relative flex w-full items-center justify-between rounded-2xl px-4 py-3" style={{ overflow: 'visible' }}>
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.88) 70%, rgba(255,255,255,0.88) 100%)',
                  WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                  maskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                }}/>
              <div className="relative z-10 flex items-center gap-0.5">
                {NAV_LEFT.map(n => <button key={n.label} onClick={n.action} className="rounded-lg px-1.5 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-4">{n.label}</button>)}
              </div>
              <div className="w-16 flex-shrink-0" aria-hidden="true"/>
              <div className="relative z-10 flex items-center gap-0.5">
                {NAV_RIGHT.map(n => <button key={n.label} onClick={n.action} className="rounded-lg px-1.5 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-4">{n.label}</button>)}
              </div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
                <NexLogo className="pointer-events-auto h-10 drop-shadow-[0_6px_24px_rgba(139,49,232,0.65)] sm:h-12"/>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar + name */}
        <div className="mx-auto -mt-20 flex max-w-[1080px] flex-col items-center px-6 sm:-mt-24">
          <div className={`relative z-20 h-36 w-36 overflow-hidden rounded-2xl border-4 border-white ${GRAD_BTN} shadow-[0_16px_44px_-12px_rgba(139,49,232,0.45)] sm:h-44 sm:w-44`}
            style={a.avatarUrl ? { backgroundImage: `url(${a.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!a.avatarUrl && <span className="flex h-full w-full items-center justify-center text-5xl font-black text-white">{a.initials}</span>}
          </div>
          <h1 className="mt-5 flex w-full items-center justify-center gap-2.5 text-center text-[clamp(30px,5.5vw,52px)] font-black leading-none tracking-[-0.045em] text-ink">
            <span>{a.name}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Tick.svg" alt="" className="h-8 w-8"/>
          </h1>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink/60"><span className="text-primary"><Pin/></span>{a.location}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
            {SOCIAL_LINKS.map(s => (
              <a key={s.key} href={s.href} aria-label={s.label} title={s.label} className="flex h-8 w-8 items-center justify-center transition-all duration-200 hover:-translate-y-1 hover:drop-shadow-[0_6px_16px_rgba(139,49,232,0.35)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.label} draggable={false} className="block h-full w-full overflow-hidden rounded-md object-contain"/>
              </a>
            ))}
          </div>
          {a.websiteUrl && (
            <a href={a.websiteUrl} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2.5 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-[13.5px] font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30">
              <GlobeIcon s={16}/><span>Visit Website</span>
            </a>
          )}

          {/* Managed brands CTA — parallels creator's Partnerships button */}
          <div className="mt-8">
            <button onClick={() => setBrandsModalOpen(true)}
              className={`inline-flex items-center gap-2.5 rounded-xl ${GRAD_BTN} px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-6px_rgba(139,49,232,0.6)]`}>
              <Shield s={14}/>View Managed Brands ({MANAGED_BRANDS.length})
            </button>
          </div>

          {/* Audience toggle — the agency-only mechanic */}
          <div className="mt-7">
            <AudienceToggle audience={audience} onChange={setAudience}/>
          </div>
        </div>
      </header>

      {/* ════════ ABOUT ════════ */}
      <section id="about" className="py-16">
        <div className="mx-auto max-w-[640px] px-6 text-center">
          <SectionHead kicker="Nice to meet you">The agency <G>behind the roster</G></SectionHead>
          <Reveal delay={80}>
            <p className="mt-6 text-[clamp(16px,2vw,18px)] leading-[1.85] text-ink/70">{a.bio}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => setModal('brand_enquiry')}
                className={`rounded-lg ${GRAD_BTN} px-7 py-3.5 text-[14.5px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>
                Hire us for your brand
              </button>
              <button onClick={() => setModal('creator_apply')}
                className="rounded-lg border-[1.5px] border-primary/20 bg-white px-7 py-3.5 text-[14.5px] font-bold text-primary transition hover:-translate-y-0.5 hover:bg-primary/[0.04]">
                Join our roster
              </button>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {a.categories.map(g => <span key={g} className="rounded-lg border border-primary/15 bg-white px-4 py-2 text-[13px] font-semibold text-primary">{g}</span>)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trusted-by marquee — roster creators */}
      <Reveal className="pb-6 text-center">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">Our roster includes</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
          <div className="flex w-max gap-16 animate-marquee hover:[animation-play-state:paused]">
            {[...ROSTER_CREATORS, ...ROSTER_CREATORS].map((name, i) => <span key={i} className="whitespace-nowrap text-[22px] font-extrabold tracking-[-0.03em] text-ink/35 transition hover:text-primary">{name}</span>)}
          </div>
        </div>
      </Reveal>

      {/* ════════ MATRIX — audience-dependent ════════ */}
      <section id="matrix" className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="The matrix" className="mb-10">
            {audience === 'brands' ? <>Performance, by the <G>numbers</G></> : <>What we offer, by the <G>numbers</G></>}
          </SectionHead>

          <div key={audience}>
            <Reveal>
              <div className={`grid grid-cols-2 gap-x-4 gap-y-7 rounded-2xl border border-primary/10 bg-white p-6 sm:grid-cols-4 sm:gap-4 sm:p-9 ${CARD} [&>*:not(:last-child)]:sm:border-r [&>*:not(:last-child)]:sm:border-primary/8`}>
                {(audience === 'brands' ? BRAND_STATS : CREATOR_STATS).map(s => <Stat key={s.label} {...s}/>)}
              </div>
            </Reveal>
            <div className="mt-6"><PersonaBento audience={audience}/></div>
          </div>
        </div>
      </section>

      {/* ════════ CAMPAIGNS / GALLERY ════════ */}
      <section id="work" className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="Our campaigns" className="mb-10">Brands <span className="font-light text-ink/35">×</span> <G>creators</G></SectionHead>
          <Reveal><GalleryBento/></Reveal>
          <Reveal className="mt-12"><CampaignCarousel campaigns={CAMPAIGNS}/></Reveal>
        </div>
      </section>

      {/* ════════ REVIEWS — audience-dependent ════════ */}
      <section id="reviews" className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[760px] px-6">
          <SectionHead kicker={audience === 'brands' ? 'What brands say' : 'What creators say'} className="mb-12"
            sub={audience === 'brands' ? 'Unfiltered feedback from the brands we manage.' : 'Unfiltered feedback from creators on our roster.'}>
            {audience === 'brands' ? <>Trusted by the <G>brands</G> we manage</> : <>Loved by the <G>creators</G> we represent</>}
          </SectionHead>
          <div key={audience}><ReviewsCarousel audience={audience}/></div>
        </div>
      </section>

      {/* ════════ WAYS TO PARTNER — audience-dependent ════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="Let's deal" className="mb-10"
            sub={audience === 'brands' ? 'Three clear ways we work with brands — pick what fits.' : 'Three clear ways we work with creators — pick what fits.'}>
            Ways to <G>partner</G>
          </SectionHead>
          <div key={audience}>
            <WorkModelsGrid audience={audience} onChoose={() => setModal(audience === 'brands' ? 'brand_enquiry' : 'creator_apply')}/>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="bg-ink px-6 pb-28 pt-24 md:pb-0">
        <div className="mx-auto max-w-[900px]">
          <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-center sm:gap-14">
            <div className="flex-shrink-0">
              <div className="h-44 w-44 overflow-hidden rounded-2xl border-4 border-white shadow-[0_20px_50px_-12px_rgba(139,49,232,0.55)]"
                style={a.avatarUrl ? { backgroundImage: `url(${a.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                {!a.avatarUrl && <span className={`flex h-full w-full items-center justify-center text-5xl font-black text-white ${GRAD_BTN}`}>{a.initials}</span>}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-[clamp(26px,4.5vw,42px)] font-black leading-[1.08] tracking-[-0.04em] text-white">
                Let's build something <span className={GRAD_TEXT}>that works.</span>
              </h2>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-white/55">
                Whether you're a brand looking for managed influencer marketing or a creator looking for representation — one message, we reply within 48 hours.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <button onClick={() => setModal('brand_enquiry')}
                  className={`rounded-xl ${GRAD_BTN} px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_32px_-8px_rgba(139,49,232,0.55)] transition hover:-translate-y-0.5`}>
                  Hire us to manage your brand
                </button>
                <button onClick={() => setModal('creator_apply')}
                  className="rounded-xl border-[1.5px] border-white/25 px-7 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white/[0.06]">
                  Apply to join our roster
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/8 py-6 text-center">
            <a href="/authenticate" className={`text-[13px] font-semibold ${GRAD_TEXT} underline-offset-4 hover:underline`}>
              Create Your Own Agency Profile on Nexus and Manage Creators &amp; Brands
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-[150] flex gap-2.5 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <button onClick={() => setModal('creator_apply')} className="flex-1 rounded-lg border-[1.5px] border-primary/15 bg-white py-3 text-sm font-bold text-ink">Join roster</button>
        <button onClick={() => setModal('brand_enquiry')} className={`flex-[1.6] rounded-lg ${GRAD_BTN} py-3 text-sm font-bold text-white`}>Hire us</button>
      </div>

      <ContactModal open={modal !== null} type={modal ?? 'message'} slug="baltic-creators-agency" agencyName={a.name} onClose={() => setModal(null)}/>
      <ManagedBrandsModal open={brandsModalOpen} onClose={() => setBrandsModalOpen(false)}/>
    </div>
  )
}