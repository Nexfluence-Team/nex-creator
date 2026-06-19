'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Brand portfolio — page.tsx  (Nexfluence v4, LIGHT)
   Adapted from the creator profile template. Key structural change:
   per-campaign reviews are GONE — reviews live in their own standalone,
   auto-advancing slideshow section, decoupled from any single campaign.
   ════════════════════════════════════════════════════════════════════ */

const API = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:5000'
const CARD = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const CARD_HOVER = 'hover:shadow-[0_2px_6px_rgba(10,6,18,0.05),0_24px_56px_-16px_rgba(139,49,232,0.30)]'

const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const BRAND = {
  name: 'Kinetics', initials: 'KI',
  location: 'Riga, Latvia · Shipping Baltic-wide',
  bio: "We make clean, science-backed sports nutrition for people who train hard and don't have time for hype. Every formula is third-party tested and every claim is one we'll actually show you the study for. We partner with creators who use what they post about — not models holding a shaker bottle.",
  categories: ['Sports Nutrition', 'Energy', 'Performance', 'Recovery'],
  coverUrl: '/test/images/Kinetics-Leader.png',
  avatarUrl: '/test/images/Harshul.png', // TODO: swap for the brand's own logo asset
  websiteUrl: 'https://kinetics.lv',
}

const EXCLUSIVE_CREATORS = [
  {
    id: 'ec1', name: 'Amelia Roze', handle: '@amelia.roze', niche: 'Beauty & Lifestyle', since: '2023',
    exclusive: true, color: '#8B31E8', scope: 'Baltic-wide brand ambassador',
    description: "Amelia is Kinetics' exclusive ambassador for beauty-meets-wellness content across Latvia, Lithuania & Estonia. No other supplement or sports nutrition brand appears on her channels.",
    blockedCategory: 'All competing sports nutrition & supplement brands', duration: 'Rolling annual contract',
    avatarUrl: '/test/images/Harshul.png',
  },
  {
    id: 'ec2', name: 'Markus Tamm', handle: '@markustamm', niche: 'Fitness & Training', since: '2024',
    exclusive: false, color: '#2563EB', scope: 'Preferred partner',
    description: 'Long-term preferred partnership for strength-training content. First access to every new product drop before any other creator in the region.',
    blockedCategory: null, duration: '12-month preferred deal',
    avatarUrl: null,
  },
]

/* ─── Per-campaign-type performance ──────────────────────────────────
   Mirrors the creator page's per-platform metrics, but sliced by HOW
   we pay creators rather than which app they post to. Icons are reused
   from the "Ways to partner" cards below so the iconography stays
   consistent across the whole page.                                   */
type CampaignKey = 'affiliate' | 'paid' | 'barter'
type CampaignStat = { to: number; dec: number; suffix: string; label: string }
type CampaignDemographics = {
  totalValue: { value: string; label: string }
  primaryNiche: { value: string; label: string }
  avgDuration: { value: string; label: string }
  topLocation: { value: string; label: string; flagCode: string }
  whatWeLookFor: string
}
type CampaignTypeEntry = {
  key: CampaignKey
  label: string
  icon: ReactNode
  isPrimary: boolean
  stats: CampaignStat[]
  demographics: CampaignDemographics
}

const CAMPAIGN_TYPE_DATA: Record<CampaignKey, CampaignTypeEntry> = {
  affiliate: {
    key: 'affiliate', label: 'Affiliate / Revenue Share', icon: <Shield s={16} />, isPrimary: true,
    stats: [
      { to: 86, dec: 0, suffix: 'K€', label: 'Sales generated' },
      { to: 4.2, dec: 1, suffix: '%', label: 'Avg conversion' },
      { to: 34, dec: 0, suffix: '', label: 'Active affiliates' },
      { to: 15, dec: 0, suffix: '%', label: 'Avg commission' },
    ],
    demographics: {
      totalValue: { value: '34', label: 'Active affiliate creators' },
      primaryNiche: { value: 'Beauty & Wellness', label: 'Top creator niche' },
      avgDuration: { value: '9 mo', label: 'Avg partnership length' },
      topLocation: { value: 'Latvia', label: 'Top creator base · 58%', flagCode: 'lv' },
      whatWeLookFor: "We look for creators whose audience already trains, recovers, or cares about clean nutrition — not just big numbers. Honest before/after content consistently outperforms polished ads with our audience.",
    },
  },
  paid: {
    key: 'paid', label: 'Paid Campaigns', icon: <ZapIcon s={16} />, isPrimary: false,
    stats: [
      { to: 62, dec: 0, suffix: '', label: 'Campaigns run' },
      { to: 410, dec: 0, suffix: 'K', label: 'Avg reach / campaign' },
      { to: 7.6, dec: 1, suffix: '%', label: 'Avg engagement' },
      { to: 48, dec: 0, suffix: 'K€', label: 'Paid to creators' },
    ],
    demographics: {
      totalValue: { value: '62', label: 'Paid campaigns to date' },
      primaryNiche: { value: 'Fitness & Training', label: 'Top creator niche' },
      avgDuration: { value: '3 wk', label: 'Avg campaign length' },
      topLocation: { value: 'Lithuania', label: 'Top creator base · 44%', flagCode: 'lt' },
      whatWeLookFor: "Flat-fee partners get a clear brief, a fixed budget, and full creative freedom on delivery. We pay on approval, not on results — no chasing invoices after the post goes live.",
    },
  },
  barter: {
    key: 'barter', label: 'Barter / Gifting', icon: <HandshakeIcon s={16} />, isPrimary: false,
    stats: [
      { to: 210, dec: 0, suffix: '', label: 'Products gifted' },
      { to: 2.4, dec: 1, suffix: '', label: 'Content pieces / gift' },
      { to: 41, dec: 0, suffix: '%', label: 'Creator retention' },
      { to: 19, dec: 0, suffix: 'K', label: 'Avg organic reach' },
    ],
    demographics: {
      totalValue: { value: '210+', label: 'Products gifted to creators' },
      primaryNiche: { value: 'Lifestyle & Wellness', label: 'Top creator niche' },
      avgDuration: { value: '1 box', label: 'Typical gift size' },
      topLocation: { value: 'Estonia', label: 'Top creator base · 33%', flagCode: 'ee' },
      whatWeLookFor: "Reserved for creators who'd genuinely use our products without a deal on the table. We send a curated starter box and let the content happen naturally — zero quota, zero obligation.",
    },
  },
}

const CAMPAIGN_TYPE_LIST: CampaignTypeEntry[] = Object.values(CAMPAIGN_TYPE_DATA)

const CREATORS = ['Amelia Roze', 'Markus Tamm', 'Elīna Krūmiņa', 'Jonas Petrauskas', 'Liis Saar', 'Kristaps Bērziņš']

const CAMPAIGN_PHOTOS = [
  { id: 'p1', src: '/test/images/Lecture.png', cls: 'col-span-2 md:col-span-2 md:row-span-2' },
  { id: 'p2', src: '/test/images/Listening.png', cls: 'col-span-2 md:col-span-2 md:row-span-1' },
  { id: 'p3', src: '/test/images/Kinetics-Leader.png', cls: 'col-span-1' },
  { id: 'p4', src: '/test/images/Drink.png', cls: 'col-span-1' },
  { id: 'p5', src: '/test/images/Food.png', cls: 'col-span-1' },
  { id: 'p6', src: '/test/images/Influencing.png', cls: 'col-span-1' },
  { id: 'p7', src: '/test/images/Kinetics-phone.png', cls: 'col-span-2 md:col-span-2' },
]

/* ─── Campaigns ──────────────────────────────────────────────────────
   Same shape as the creator page's COLLABORATIONS, with one deliberate
   removal: no `review` field. Reviews are no longer tied to a single
   campaign — see REVIEWS + ReviewsCarousel further down.               */
const CAMPAIGNS = [
  {
    id: 'cm1', creator: 'Amelia Roze', handle: '@amelia.roze', niche: 'Beauty & Lifestyle',
    title: 'Vitamin-C recovery stack launch',
    description: 'A 60-second routine showing real recovery results over 14 days of training. The content focused on how the stack felt the next morning, not just the ingredient list.',
    target: 'Women 25–40 interested in clean recovery', result: '3.2x ROAS, 5.8K units sold in first week',
    videoSrc: '/test/video/Drink.mp4',
    insight: 'Authentic, lived-in storytelling outperformed our polished studio ads — this campaign proved it. Unfiltered, real-time shots drove 78% more engagement than anything we produced in-house.',
    metrics: [
      { icon: 'eye', label: 'Views', value: '1.2M' }, { icon: 'heart', label: 'Engagement', value: '8.4%' },
      { icon: 'cart', label: 'ROAS', value: '3.2×' }, { icon: 'share', label: 'Shares', value: '14.2K' },
    ],
  },
  {
    id: 'cm2', creator: 'Markus Tamm', handle: '@markustamm', niche: 'Fitness & Training',
    title: 'Pre-workout, race-day tested',
    description: "A training-camp diary integrating our pre-workout blend into Markus's actual race prep — no studio, no script, just the weeks leading up to a half-marathon.",
    target: 'Endurance athletes and serious lifters', result: '2.1M views, 14% engagement rate',
    videoSrc: '/test/video/Food.mp4',
    insight: "Showing the product inside a real, messy training block made it feel earned rather than sold. DMs were flooded with 'where do you get this?' within hours of the race-day post.",
    metrics: [
      { icon: 'eye', label: 'Views', value: '2.1M' }, { icon: 'heart', label: 'Engagement', value: '14%' },
      { icon: 'users', label: 'New followers', value: '+8.3K' }, { icon: 'message', label: 'DMs', value: '2.1K' },
    ],
  },
  {
    id: 'cm3', creator: 'Liis Saar', handle: '@liis.moves', niche: 'Wellness',
    title: 'Electrolyte hack for hot yoga',
    description: "We showed how Liis layers our electrolyte mix before hot yoga sessions to avoid the mid-class crash. The video went viral on TikTok within 48 hours.",
    target: 'Gen Z and millennial wellness audiences', result: '4.5M views, 22K shares, 8.2K conversions',
    videoSrc: '/test/video/People.mp4',
    insight: "TikTok audiences love a discovered hack, not an ad. Framing it that way hit the algorithm sweet spot and brought 12K new followers from a single post.",
    metrics: [
      { icon: 'eye', label: 'Views', value: '4.5M' }, { icon: 'share', label: 'Shares', value: '22K' },
      { icon: 'cart', label: 'Conversions', value: '8.2K' }, { icon: 'users', label: 'New followers', value: '+12K' },
    ],
  },
]

/* ─── Reviews — standalone, decoupled from any single campaign ──────── */
const REVIEWS = [
  {
    id: 'r1', name: 'Amelia Roze', handle: '@amelia.roze', niche: 'Beauty & Lifestyle', followers: '142K',
    avatarUrl: '/test/images/Harshul.png', color: '#8B31E8', initials: 'AR', rating: 5, date: 'May 2026',
    quote: "Kinetics is the rare brand that briefs like a marketer, not a vending machine. They told me the goal, trusted my read on my own audience, and paid on delivery — no waiting on results to get my invoice cleared. I've turned down bigger budgets for a worse process.",
  },
  {
    id: 'r2', name: 'Markus Tamm', handle: '@markustamm', niche: 'Fitness & Training', followers: '68K',
    avatarUrl: null, color: '#2563EB', initials: 'MT', rating: 5, date: 'Apr 2026',
    quote: "I've worked with a lot of supplement brands and most want you to perform enthusiasm you don't feel. Kinetics sent me the lab results before I ever posted. That's the only reason the content felt real, because it was.",
  },
  {
    id: 'r3', name: 'Elīna Krūmiņa', handle: '@elina.kr', niche: 'Wellness', followers: '51K',
    avatarUrl: null, color: '#059669', initials: 'EK', rating: 4, date: 'Mar 2026',
    quote: "Fast replies, fair commission, and they never once asked me to say something I wouldn't actually say. The only thing I'd change is more lead time on briefs — but the partnership itself has been genuinely easy.",
  },
  {
    id: 'r4', name: 'Jonas Petrauskas', handle: '@jonas.fit', niche: 'Strength Training', followers: '94K',
    avatarUrl: null, color: '#D97706', initials: 'JP', rating: 5, date: 'Feb 2026',
    quote: "The affiliate dashboard alone makes Kinetics worth it — I can see conversions in real time instead of guessing at a flat fee's worth. First brand that's made me more by being transparent than by hiding the numbers.",
  },
]

const COLLAB_TYPES = ['Affiliate / Revenue share', 'Paid campaign', 'Barter / Gifting', 'Not sure yet']

/* ─── Icons ──────────────────────────────────────────────────────────── */
function Check({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function Shield({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function StarIcon({ s = 14 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z" />
    </svg>
  )
}
function ZapIcon({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function HandshakeIcon({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3l1 11h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function Play({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
}
function Pin({ s = 15 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
function LockIcon({ s = 13 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function CalendarIcon({ s = 13 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
function EyeIcon({ s = 26 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}
function PersonIcon({ s = 26 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5" r="2.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.8v1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 9c-.5 0-1.2.6-1.5 1.5L5 16h4l1 5h4l1-5h4l-1.5-5.5C17.2 9.6 16.5 9 16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 9c.7-.5 1.6-.5 2.5-.5s1.8 0 2.5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function ChatBubbleIcon({ s = 40 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function LightbulbIcon({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 21h6M12 3a7 7 0 014.9 11.9c-.6.6-1.1 1.3-1.4 2.1H8.5c-.3-.8-.8-1.5-1.4-2.1A7 7 0 0112 3z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
function MetricEyeIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
function HeartIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CartIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ShareIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function UsersIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function MessageIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function MetricIcon({ name, s = 18 }: { name: string; s?: number }) {
  switch (name) {
    case 'eye': return <MetricEyeIcon s={s} />
    case 'heart': return <HeartIcon s={s} />
    case 'cart': return <CartIcon s={s} />
    case 'share': return <ShareIcon s={s} />
    case 'users': return <UsersIcon s={s} />
    case 'message': return <MessageIcon s={s} />
    default: return <MetricEyeIcon s={s} />
  }
}
function GlobeIcon({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2c-2.8 3-4 6-4 10s1.2 7 4 10M12 2c2.8 3 4 6 4 10s-1.2 7-4 10M2 12h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Social platform icons ──────────────────────────────────────────── */
const SOCIAL_LINKS: { key: string; label: string; href: string; src: string }[] = [
  { key: 'instagram', label: 'Instagram', href: '#', src: '/Socials/Instagram.svg' },
  { key: 'tiktok', label: 'TikTok', href: '#', src: '/Socials/TikTok.svg' },
  { key: 'youtube', label: 'YouTube', href: '#', src: '/Socials/YouTube.svg' },
  { key: 'linkedin', label: 'LinkedIn', href: '#', src: '/Socials/LinkedIn.svg' },
  { key: 'facebook', label: 'Facebook', href: '#', src: '/Socials/Facebook.svg' },
]

/* ─── Gradient stars (unique ids per instance — multiple reviews can
   be mounted simultaneously in the sliding track) ──────────────────── */
function GradientStars({ rating, total = 5, size = 28, idSuffix = '' }: { rating: number; total?: number; size?: number; idSuffix?: string }) {
  const fillId = `nex-star-fill${idSuffix}`
  const strokeId = `nex-star-stroke${idSuffix}`
  const STAR = 'M12 2l2.8 6.2 6.8.6-5 4.5 1.5 6.7L12 16.5l-6.1 3.5 1.5-6.7-5-4.5 6.8-.6z'
  return (
    <div className="flex items-center gap-2">
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id={fillId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B31E8" />
            <stop offset="55%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#FF33BC" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B31E8" />
            <stop offset="55%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#FF33BC" />
          </linearGradient>
        </defs>
      </svg>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" overflow="visible">
          {i < rating ? (
            <>
              <path d={STAR} fill={`url(#${fillId})`} stroke="white" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" paintOrder="stroke" />
              <path d={STAR} fill="none" stroke={`url(#${strokeId})`} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d={STAR} fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              <path d={STAR} fill="none" stroke={`url(#${strokeId})`} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" opacity="0.35" />
            </>
          )}
        </svg>
      ))}
    </div>
  )
}

/* ─── Reveal ────────────────────────────────────────────────────────── */
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

/* ─── Animated stat ─────────────────────────────────────────────────── */
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

/* ─── Section head ──────────────────────────────────────────────────── */
function SectionHead({ kicker, children, sub, className = '' }: { kicker: string; children: ReactNode; sub?: string; className?: string }) {
  return (
    <Reveal className={`text-center ${className}`}>
      <div className="mb-4 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/50 sm:w-16" />
          <span className="h-1 w-1 rounded-full bg-primary/60" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-ink/50">{kicker}</p>
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-magenta/60" />
          <span className="h-px w-10 bg-gradient-to-r from-magenta/50 to-transparent sm:w-16" />
        </div>
      </div>
      <h2 className="text-[clamp(30px,4.8vw,48px)] font-black leading-[1.02] tracking-[-0.045em] text-ink">{children}</h2>
      {sub && <p className="mx-auto mt-4 max-w-[540px] text-base leading-[1.7] text-ink/60">{sub}</p>}
    </Reveal>
  )
}

const G = ({ children }: { children: ReactNode }) => <span className={GRAD_TEXT}>{children}</span>

function CountryFlag({ code, className = '' }: { code: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      alt={code.toUpperCase()} className={`inline-block rounded-[4px] object-cover ${className}`} width={28} height={18} />
  )
}

function NexLogo({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`} />
  )
}

/* ─── Person avatar (circle) — used for creators, never a square logo
   tile, so it's visually distinct from the brand's own square mark.    */
function PersonAvatar({ name, color, avatarUrl, initials, size = 56 }: { name: string; color: string; avatarUrl?: string | null; initials?: string; size?: number }) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatarUrl) {
    return (
      <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" draggable={false} />
      </div>
    )
  }
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-sm" style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {abbr}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Campaign-type dropdown — selects which payout model drives the
   Matrix section. Default = the entry flagged isPrimary (Affiliate).
   ════════════════════════════════════════════════════════════════════ */
function CampaignTypeRow({ p, isSelected, onSelect }: { p: CampaignTypeEntry; isSelected: boolean; onSelect: (key: CampaignKey) => void }) {
  return (
    <button
      onClick={() => onSelect(p.key)}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold transition hover:bg-primary/[0.06] ${isSelected ? 'bg-primary/[0.07] text-primary' : 'text-ink/75'}`}
    >
      <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-md bg-primary/[0.08] text-primary">{p.icon}</span>
      <span className="flex-1">{p.label}</span>
      {isSelected && <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${GRAD_BTN}`} />}
    </button>
  )
}

function CampaignTypeDropdown({
  types, current, selected, onSelect,
}: { types: CampaignTypeEntry[]; current: CampaignTypeEntry; selected: CampaignKey; onSelect: (key: CampaignKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const primary = types.filter(t => t.isPrimary)
  const others = types.filter(t => !t.isPrimary)

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onClick); window.removeEventListener('keydown', onEsc) }
  }, [])

  const choose = (key: CampaignKey) => { onSelect(key); setOpen(false) }

  return (
    <div ref={ref} className="relative z-30 w-[280px]">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center gap-2.5 rounded-xl border bg-white px-4 py-2.5 text-[13px] font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 ${CARD} ${open ? 'border-primary/30' : 'border-primary/12'}`}
      >
        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/40">Showing</span>
        <span className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center text-primary">{current.icon}</span>
        <span className="flex-1 truncate text-ink">{current.label}</span>
        {current.isPrimary && (
          <span className="flex-shrink-0 text-primary" title="Most-used model" aria-label="Most-used model">
            <StarIcon s={14} />
          </span>
        )}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className={`flex-shrink-0 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={`absolute right-0 top-[calc(100%+8px)] w-full overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
          <div className="px-4 pb-2 pt-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Primary model</div>
          {primary.map(p => <CampaignTypeRow key={p.key} p={p} isSelected={selected === p.key} onSelect={choose} />)}
          <div className="mx-4 my-1.5 h-px bg-primary/8" />
          <div className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Other models</div>
          {others.map(p => <CampaignTypeRow key={p.key} p={p} isSelected={selected === p.key} onSelect={choose} />)}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Creator Partnerships Modal
   ════════════════════════════════════════════════════════════════════ */
function CreatorPartnershipsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className={`fixed inset-0 z-[600] flex items-center justify-center bg-ink/55 p-5 backdrop-blur-[6px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div
        role="dialog" aria-modal="true"
        className={`max-h-[90vh] w-full max-w-[580px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_-12px_rgba(10,6,18,0.35)] transition-all duration-300 ease-[cubic-bezier(0.34,1.5,0.64,1)] flex flex-col ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}
      >
        <div className="flex-shrink-0 flex items-center justify-between border-b border-primary/10 bg-white px-7 py-5">
          <div>
            <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">Creator Partnerships</h3>
            <p className="mt-0.5 text-[12px] text-ink/45">{EXCLUSIVE_CREATORS.length} active {EXCLUSIVE_CREATORS.length === 1 ? 'partnership' : 'partnerships'}</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sub text-ink/45 transition hover:bg-surface-card hover:text-ink text-[13px]">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
          {EXCLUSIVE_CREATORS.map(deal => (
            <div
              key={deal.id}
              className={`rounded-2xl border bg-white p-5 ${CARD} ${deal.exclusive ? 'border-primary/20' : 'border-primary/10'}`}
              style={{ background: `linear-gradient(135deg, ${deal.color}0a 0%, transparent 60%)` }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <PersonAvatar name={deal.name} color={deal.color} avatarUrl={deal.avatarUrl} size={48} />
                  <div>
                    <span className="text-[16px] font-black tracking-[-0.02em] block leading-tight text-ink">{deal.name}</span>
                    <span className="text-[12px] font-semibold text-ink/50">{deal.handle} · {deal.scope}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {deal.exclusive
                    ? <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${GRAD_BTN} text-white`}>Exclusive</span>
                    : <span className="rounded-md border border-primary/20 bg-primary/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">Preferred</span>
                  }
                  <span className="rounded-md border border-primary/12 bg-primary/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary/70">{deal.niche}</span>
                </div>
              </div>
              <p className="text-[13px] leading-[1.75] text-ink/65">{deal.description}</p>
              <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-primary/8 pt-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/45">
                  <CalendarIcon s={12} /> {deal.duration} · Since {deal.since}
                </span>
                {deal.blockedCategory && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400/80">
                    <LockIcon s={12} /> Blocks: {deal.blockedCategory}
                  </span>
                )}
              </div>
              <div className="mt-3.5 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  <Check s={12} />
                </span>
                <span className="text-[12px] font-semibold text-green-800">
                  {deal.exclusive ? 'Signed in — Exclusive Ambassador' : 'Signed in — Preferred Partner'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 border-t border-primary/10 bg-white px-7 py-4">
          <button onClick={onClose}
            className={`w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)] transition hover:-translate-y-0.5`}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function Page() {
  const [modal, setModal] = useState<'apply' | 'message' | null>(null)
  const [partnershipsOpen, setPartnershipsOpen] = useState(false)
  const [campaignKey, setCampaignKey] = useState<CampaignKey>('affiliate')
  const campaign = CAMPAIGN_TYPE_DATA[campaignKey]
  const b = BRAND
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const NAV_LEFT = [{ label: 'About', action: () => scrollTo('about') }, { label: 'Performance', action: () => scrollTo('matrix') }]
  const NAV_RIGHT = [{ label: 'Campaigns', action: () => scrollTo('work') }, { label: 'Contact', action: () => setModal('message') }]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════════ HEADER ════════ */}
      <header className="relative">
        {/* Cover */}
        <div
          className="relative h-[260px] w-full overflow-hidden bg-gradient-to-br from-primary/30 via-primary-lt/25 to-magenta/30 sm:h-[320px] md:h-[360px]"
          style={b.coverUrl ? { backgroundImage: `url(${b.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!b.coverUrl && <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold uppercase tracking-[0.2em] text-white/55">Cover image</span>}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-canvas/30" />
        </div>

        {/* ── NAV PILL ─────────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 z-40 flex justify-center px-4" style={{ top: 28 }}>
          <div className="w-full max-w-[600px]">
            <div className="relative flex w-full items-center justify-between rounded-2xl px-4 py-3" style={{ overflow: 'visible', border: 'none', boxShadow: 'none' }}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.88) 70%, rgba(255,255,255,0.88) 100%)',
                  WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                  maskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                }}
              />
              <div className="relative z-10 flex items-center gap-0.5">
                {NAV_LEFT.map(n => (
                  <button key={n.label} onClick={n.action}
                    className="rounded-lg px-1.5 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-4">
                    {n.label}
                  </button>
                ))}
              </div>
              <div className="w-16 flex-shrink-0" aria-hidden="true" />
              <div className="relative z-10 flex items-center gap-0.5">
                {NAV_RIGHT.map(n => (
                  <button key={n.label} onClick={n.action}
                    className="rounded-lg px-1.5 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-4">
                    {n.label}
                  </button>
                ))}
              </div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
                <NexLogo className="h-10 sm:h-[120px] pointer-events-auto drop-shadow-[0_6px_24px_rgba(139,49,232,0.65)]" />
              </div>
            </div>
          </div>
        </div>

        {/* AVATAR + NAME */}
        <div className="mx-auto -mt-20 flex max-w-[1080px] flex-col items-center px-6 sm:-mt-24">
          <div
            className={`relative z-20 h-36 w-36 overflow-hidden rounded-2xl border-4 border-white ${GRAD_BTN} shadow-[0_16px_44px_-12px_rgba(139,49,232,0.45)] sm:h-44 sm:w-44`}
            style={b.avatarUrl ? { backgroundImage: `url(${b.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {!b.avatarUrl && <span className="flex h-full w-full items-center justify-center text-5xl font-black text-white">{b.initials}</span>}
          </div>

          <h1 className="mt-5 flex w-full items-center justify-center gap-2.5 text-center text-[clamp(34px,6vw,56px)] font-black leading-none tracking-[-0.045em] text-ink">
            <span>{b.name}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Tick.svg" alt="" className='h-8 w-8' />
          </h1>

          <p className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink/60">
            <span className="text-primary"><Pin /></span>{b.location}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.key}
                href={s.href}
                aria-label={s.label}
                title={s.label}
                className="flex h-8 w-8 items-center justify-center transition-all duration-200 hover:-translate-y-1 hover:opacity-90 hover:drop-shadow-[0_6px_16px_rgba(139,49,232,0.35)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.label} draggable={false} className="block h-full w-full overflow-hidden rounded-md object-contain" />
              </a>
            ))}
          </div>

          {b.websiteUrl && (
            <a
              href={b.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex align-items items-center gap-2.5 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-[13.5px] font-semibold text-primary shadow-[0_2px_10px_-4px_rgba(139,49,232,0.18)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_rgba(139,49,232,0.30)]"
            >
              <GlobeIcon s={16} />
              <span> Visit Website</span>
            </a>
          )}

          {EXCLUSIVE_CREATORS.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setPartnershipsOpen(true)}
                className={`inline-flex items-center gap-2.5 rounded-xl ${GRAD_BTN} px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-6px_rgba(139,49,232,0.6)]`}
              >
                <Shield s={14} />
                View Creator Partnerships &amp; Exclusivities
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ════════ ABOUT ════════ */}
      <section id="about" className="py-16">
        <div className="mx-auto max-w-[640px] px-6 text-center">
          <SectionHead kicker="Nice to meet you">The brand <G>behind the bottle</G></SectionHead>
          <Reveal delay={80}>
            <p className="mt-6 text-[clamp(16px,2vw,18px)] leading-[1.85] text-ink/70">{b.bio}</p>
            <button onClick={() => setModal('apply')}
              className={`mt-7 rounded-lg ${GRAD_BTN} px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>
              Partner with us
            </button>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {b.categories.map(g => <span key={g} className="rounded-lg border border-primary/15 bg-white px-4 py-2 text-[13px] font-semibold text-primary">{g}</span>)}
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal className="pb-6 text-center">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">Trusted by creators across the Baltics</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
          <div className="flex w-max gap-16 animate-marquee hover:[animation-play-state:paused]">
            {[...CREATORS, ...CREATORS].map((nm, i) => <span key={i} className="whitespace-nowrap text-[22px] font-extrabold tracking-[-0.03em] text-ink/35 transition hover:text-primary">{nm}</span>)}
          </div>
        </div>
      </Reveal>

      {/* ════════ MATRIX ════════ */}
      <section id="matrix" className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="The matrix" className="mb-9">Performance, by the <G>numbers</G></SectionHead>
          <div className="mb-6 flex justify-end">
            <CampaignTypeDropdown types={CAMPAIGN_TYPE_LIST} current={campaign} selected={campaignKey} onSelect={setCampaignKey} />
          </div>
          <div key={campaignKey}>
            <Reveal>
              <div className={`grid grid-cols-2 gap-x-4 gap-y-7 rounded-2xl border border-primary/10 bg-white p-6 sm:grid-cols-4 sm:gap-4 sm:p-9 ${CARD} [&>*:not(:last-child)]:sm:border-r [&>*:not(:last-child)]:sm:border-primary/8`}>
                {campaign.stats.map(s => <Stat key={s.label} {...s} />)}
              </div>
            </Reveal>
            <div className="mt-5 grid auto-rows-[minmax(140px,auto)] grid-cols-2 gap-4 md:grid-cols-4">
              <Reveal className="col-span-2 row-span-2 md:col-span-2">
                <div className={`relative flex h-full flex-col rounded-2xl border border-primary/10 bg-white p-7 ${CARD}`}>
                  <div className="absolute right-5 top-5 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/12 bg-surface-sub text-primary">
                    <ChatBubbleIcon s={32} />
                  </div>
                  <span className="inline-flex w-fit items-center rounded-lg bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">What we look for</span>
                  <div className="flex-1" />
                  <p className="text-[15px] leading-[1.8] text-ink/70">{campaign.demographics.whatWeLookFor}</p>
                </div>
              </Reveal>
              <BentoStat delay={60} value={campaign.demographics.primaryNiche.value} label={campaign.demographics.primaryNiche.label} topRightIcon={<PersonIcon s={26} />} />
              <BentoStat delay={120} value={campaign.demographics.avgDuration.value} label={campaign.demographics.avgDuration.label} topRightIcon={<CalendarIcon s={26} />} />
              <BentoStat delay={180} value={campaign.demographics.totalValue.value} label={campaign.demographics.totalValue.label} topRightIcon={<EyeIcon s={26} />} />
              <BentoStat delay={240} value={campaign.demographics.topLocation.value} label={campaign.demographics.topLocation.label}
                topRightIcon={<CountryFlag code={campaign.demographics.topLocation.flagCode} className="h-[18px] w-[28px]" />} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════ WORK / CAMPAIGNS ════════ */}
      <section id="work" className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="Our campaigns" className="mb-10">Campaigns <span className="font-light text-ink/35">&amp;</span> <G>content</G></SectionHead>
          <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[170px] md:grid-cols-4">
            {CAMPAIGN_PHOTOS.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60} className={p.cls}>
                <div className={`group relative h-full w-full overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 via-primary-lt/10 to-magenta/15 ${CARD}`}>
                  {p.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">Photo</span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12"><CampaignCarousel campaigns={CAMPAIGNS} /></Reveal>
        </div>
      </section>

      {/* ════════ REVIEWS — standalone slideshow, decoupled from any campaign ════════ */}
      <section id="reviews" className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[760px] px-6">
          <SectionHead kicker="What creators say" className="mb-12" sub="Unfiltered feedback from creators we've partnered with — not cherry-picked per campaign.">
            Loved by the <G>creators</G> we work with
          </SectionHead>
          <ReviewsCarousel reviews={REVIEWS} />
        </div>
      </section>

      {/* ════════ WAYS TO PARTNER ════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="Let's deal" className="mb-10" sub="Three clear ways we work with creators — pick what fits, or mix them.">
            Ways to <G>partner</G>
          </SectionHead>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <WorkModel delay={0} name="Affiliate / Revenue Share" price="10–20%" priceLabel="per sale"
              icon={<Shield s={28} />}
              features={['No upfront commitment', 'Earn on every sale you drive', 'Real-time tracking dashboard', 'Paid out monthly']}
              description="Our most popular model. You earn when your audience buys." popular={true} onChoose={() => setModal('apply')} />
            <WorkModel delay={90} name="Paid Campaigns" price="From €350" priceLabel="per video"
              icon={<ZapIcon s={28} />}
              features={['Flat fee per deliverable', 'Clear brief, fast approval', 'Paid on delivery, not results', 'Full usage rights included']}
              description="Predictable budget, predictable payout." popular={false} onChoose={() => setModal('apply')} />
            <WorkModel delay={180} name="Barter / Gifting" price="€120+" priceLabel="product value"
              icon={<HandshakeIcon s={28} />}
              features={['Curated product box', 'No content quota', "For creators who'd buy it anyway", 'Limited spots each quarter']}
              description="For creators who genuinely love what we make." popular={false} onChoose={() => setModal('apply')} />
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="bg-ink px-6 pb-28 pt-24 md:pb-0">
        <div className="mx-auto max-w-[900px]">
          <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-center sm:gap-14">
            <div className="flex-shrink-0">
              <div className="h-44 w-44 overflow-hidden rounded-2xl border-4 border-white shadow-[0_20px_50px_-12px_rgba(139,49,232,0.55)]"
                style={b.avatarUrl ? { backgroundImage: `url(${b.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                {!b.avatarUrl && <span className={`flex h-full w-full items-center justify-center text-5xl font-black text-white ${GRAD_BTN}`}>{b.initials}</span>}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-[clamp(26px,4.5vw,42px)] font-black leading-[1.08] tracking-[-0.04em] text-white">
                Let's build your next <span className={GRAD_TEXT}>campaign.</span>
              </h2>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-white/55">
                Tell us about your audience and what you create. One message — we reply within 48 hours.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <button onClick={() => setModal('apply')}
                  className={`rounded-xl ${GRAD_BTN} px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_32px_-8px_rgba(139,49,232,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_rgba(139,49,232,0.7)]`}>
                  Apply to Collaborate
                </button>
                <button onClick={() => setModal('message')}
                  className="rounded-xl border-[1.5px] border-white/25 px-7 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white/[0.06]">
                  Send a message
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/8 py-6 text-center">
            <a href="/authenticate" className={`text-[13px] font-semibold ${GRAD_TEXT} underline-offset-4 hover:underline`}>
              Create Your Own Brand Profile on Nexus and Discover Creators to Partner With
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-[150] flex gap-2.5 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <button onClick={() => setModal('message')} className="flex-1 rounded-lg border-[1.5px] border-primary/15 bg-white py-3 text-sm font-bold text-ink">Message</button>
        <button onClick={() => setModal('apply')} className={`flex-[1.6] rounded-lg ${GRAD_BTN} py-3 text-sm font-bold text-white`}>Apply</button>
      </div>

      {/* Modals */}
      <ContactModal open={modal !== null} type={modal ?? 'message'} slug="kinetics" brandName={b.name} onClose={() => setModal(null)} />
      <CreatorPartnershipsModal open={partnershipsOpen} onClose={() => setPartnershipsOpen(false)} />
    </div>
  )
}

/* ─── Bento stat ────────────────────────────────────────────────────── */
function BentoStat({ value, label, delay, topRightIcon }: { value: string; label: string; delay: number; topRightIcon?: ReactNode }) {
  return (
    <Reveal delay={delay}>
      <div className={`relative flex h-full flex-col justify-center rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
        {topRightIcon && (
          <div className="absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/10 bg-surface-sub p-3 text-primary">
            {topRightIcon}
          </div>
        )}
        <div className={`${GRAD_TEXT} text-[clamp(26px,3.5vw,34px)] font-black tracking-[-0.04em]`}>{value}</div>
        <div className="mt-1.5 text-[12px] font-medium text-ink/55">{label}</div>
      </div>
    </Reveal>
  )
}

/* ─── iPhone reel ───────────────────────────────────────────────────── */
function Phone({ src, label }: { src?: string; label?: string }) {
  return (
    <div className="relative w-[210px] flex-shrink-0 snap-center sm:w-[220px]">
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] border-[7px] border-ink bg-ink shadow-[0_24px_50px_-16px_rgba(10,6,18,0.5)]">
        <div className="absolute left-1/2 top-2.5 z-10 h-4 w-20 -translate-x-1/2 rounded-lg bg-ink" />
        {src ? <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          : <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/25 via-primary-lt/20 to-magenta/25 text-white/70">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Play /></span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em]">{label || 'Reel'}</span>
            </div>}
      </div>
    </div>
  )
}

/* ─── Campaign Carousel — NO embedded review block (reviews live in
   their own section now) ────────────────────────────────────────────── */
function CampaignCarousel({ campaigns }: { campaigns: typeof CAMPAIGNS }) {
  const [current, setCurrent] = useState(0)
  const total = campaigns.length
  const prev = () => setCurrent(c => (c > 0 ? c - 1 : c))
  const next = () => setCurrent(c => (c < total - 1 ? c + 1 : c))
  const item = campaigns[current]
  if (!item) return null

  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between sm:justify-end">
        <span className="text-sm font-medium text-ink/40 sm:hidden">{current + 1} / {total}</span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-ink/40 sm:inline">{current + 1} / {total}</span>
          <div className="flex gap-1.5">
            <button onClick={prev} disabled={current === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Previous">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button onClick={next} disabled={current === total - 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Next">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
          <div>
            <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">
              We partnered with <span className={GRAD_TEXT}>{item.creator}</span>
            </h3>
            <p className="mt-1 text-lg font-semibold text-ink/80">{item.title}</p>
            <p className="mt-0.5 text-[13px] font-medium text-ink/40">{item.handle} · {item.niche}</p>
          </div>
          <p className="text-[15px] leading-relaxed text-ink/70">{item.description}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-medium text-ink/60">Target:</span>
              <span className="font-semibold text-ink">{item.target}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-magenta" />
              <span className="font-medium text-ink/60">Result:</span>
              <span className="font-semibold text-ink">{item.result}</span>
            </span>
          </div>
          {item.metrics && (
            <div className="grid grid-cols-2 gap-2.5">
              {item.metrics.map((m, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-surface-sub px-3.5 py-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary">
                    <MetricIcon name={m.icon} s={16} />
                  </span>
                  <div>
                    <div className="text-[13px] font-black tracking-[-0.02em] text-ink">{m.value}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/40">{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {item.insight && (
            <div className="rounded-lg border border-primary/10 bg-primary/[0.03] px-4 py-3">
              <p className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/[0.10] text-primary">
                  <LightbulbIcon s={13} />
                </span>
                Key insight
              </p>
              <p className="text-sm font-medium leading-relaxed text-ink/70">{item.insight}</p>
            </div>
          )}
        </div>
        <div className="flex justify-center sm:justify-end">
          <Phone src={item.videoSrc} label={item.title} />
        </div>
      </div>
    </div>
  )
}

/* ─── Reviews Carousel — standalone slideshow, auto-advances, pauses
   on hover/focus, navigable via arrows + dots. Decoupled from any
   single campaign on purpose: this is the brand's aggregate
   reputation, not a curated quote per case study.                    */
function ReviewsCarousel({ reviews }: { reviews: typeof REVIEWS }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = reviews.length

  useEffect(() => {
    if (paused || total <= 1) return
    const id = setInterval(() => setIndex(i => (i + 1) % total), 6000)
    return () => clearInterval(id)
  }, [paused, total])

  const go = (i: number) => setIndex(((i % total) + total) % total)

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-ink/40">{index + 1} / {total}</span>
        <div className="flex gap-1.5">
          <button onClick={() => go(index - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary" aria-label="Previous review">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={() => go(index + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary" aria-label="Next review">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateX(-${index * 100}%)` }}>
          {reviews.map(r => (
            <div key={r.id} className="w-full flex-shrink-0 px-0.5">
              <div className={`rounded-2xl border border-primary/10 bg-white p-7 sm:p-9 ${CARD}`}>
                <div className="mb-5 flex items-center justify-between">
                  <GradientStars rating={r.rating} total={5} size={22} idSuffix={`-${r.id}`} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/35">{r.date}</span>
                </div>
                <p className="text-[16.5px] leading-[1.85] text-ink/75 sm:text-[17.5px]">"{r.quote}"</p>
                <div className="mt-7 flex items-center gap-3.5 border-t border-primary/10 pt-5">
                  <PersonAvatar name={r.name} color={r.color} avatarUrl={r.avatarUrl} initials={r.initials} size={48} />
                  <div className="flex-1">
                    <div className="text-[14.5px] font-bold text-ink">{r.name}</div>
                    <div className="mt-0.5 text-[12px] text-ink/50">{r.handle} · {r.niche} · {r.followers} followers</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {reviews.map((r, i) => (
          <button key={r.id} onClick={() => go(i)} aria-label={`Go to review ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === index ? `w-7 ${GRAD_BTN}` : 'w-2 bg-primary/15 hover:bg-primary/30'}`} />
        ))}
      </div>
    </div>
  )
}

/* ─── Work model card ───────────────────────────────────────────────── */
function WorkModel({ name, price, priceLabel, icon, features, description, popular = false, delay = 0, onChoose }: {
  name: string; price: string; priceLabel: string; icon: ReactNode
  features: string[]; description: string; popular?: boolean; delay?: number; onChoose: () => void
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className={`group relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-all hover:-translate-y-2 hover:shadow-xl ${popular ? 'border-primary/30 bg-gradient-to-br from-primary/[0.08] via-primary-lt/[0.04] to-magenta/[0.06] ring-2 ring-primary/20' : 'border-primary/10'} ${CARD} ${CARD_HOVER}`}>
        {popular && (
          <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${GRAD_BTN} px-4 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_4px_12px_rgba(139,49,232,0.4)]`}>
            Most popular
          </span>
        )}
        <div className={`mb-4 flex items-center justify-center rounded-xl border border-primary/10 bg-surface-sub text-primary ${popular ? 'h-16 w-16' : 'h-14 w-14'}`}>{icon}</div>
        <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{name}</h3>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-ink">{price}</span>
          <span className="text-sm font-medium text-ink/50">{priceLabel}</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">{description}</p>
        <ul className="mt-4 flex-1 space-y-2 border-t border-primary/10 pt-4 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-ink/70">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r from-primary to-magenta" />
              {f}
            </li>
          ))}
        </ul>
        <button onClick={onChoose}
          className={`mt-6 w-full rounded-lg py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${popular ? `${GRAD_BTN} text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)] hover:shadow-xl` : 'border border-primary/20 bg-white text-primary hover:bg-primary/[0.04]'}`}>
          Choose this
        </button>
      </div>
    </Reveal>
  )
}

/* ─── Contact modal ─────────────────────────────────────────────────── */
function ContactModal({ open, type, slug, brandName, onClose }: { open: boolean; type: 'apply' | 'message'; slug: string; brandName: string; onClose: () => void }) {
  const isApply = type === 'apply'
  const [form, setForm] = useState({ name: '', handle: '', email: '', message: '' })
  const [collabType, setCollabType] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ok = form.name.trim() && form.email.trim() && form.message.trim()
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; setSent(false); setError(''); setForm({ name: '', handle: '', email: '', message: '' }); setCollabType('') }
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
        body: JSON.stringify({ type: isApply ? 'application' : 'message', senderName: form.name, senderHandle: form.handle, senderEmail: form.email, message: form.message, collabType }) })
      const json = await res.json().catch(() => ({ success: true }))
      if (!json.success && res.status !== 429) throw new Error(json.message || 'Could not send.')
      setSent(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send. Please try again.') } finally { setLoading(false) }
  }

  const inp = 'w-full rounded-lg border border-primary/12 bg-surface-sub px-4 py-3 font-rubik text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30'
  const lbl = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/50'

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className={`fixed inset-0 z-[500] flex items-center justify-center bg-ink/50 p-5 backdrop-blur-[6px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div role="dialog" aria-modal="true"
        className={`max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_70px_-12px_rgba(10,6,18,0.3)] transition-all duration-300 ease-[cubic-bezier(0.34,1.5,0.64,1)] ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/10 bg-white px-6 py-5">
          <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{sent ? 'Message sent!' : isApply ? 'Apply to collaborate' : 'Send a message'}</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sub text-base text-ink/50 transition hover:bg-surface-card hover:text-ink">✕</button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/12 text-green-500"><Check s={30} /></div>
              <h3 className="mb-2 text-xl font-extrabold text-ink">{isApply ? "You're in the inbox!" : 'Message sent!'}</h3>
              <p className="mx-auto max-w-[340px] text-sm leading-[1.7] text-ink/65">{form.name && `Thanks, ${form.name.split(' ')[0]} — `}{brandName} will reply to <b className="text-primary">{form.email || 'your email'}</b> within 48 hours.</p>
              <button onClick={onClose} className={`mx-auto mt-6 rounded-lg ${GRAD_BTN} px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5`}>Done</button>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm leading-[1.6] text-ink/65">{isApply ? "Tell us about your audience and what you create — we'll reply with next steps within 48 hours." : 'Introduce yourself and tell us what you have in mind. We read every message.'}</p>
              {error && <div className="mb-4 rounded-lg border border-primary/40 bg-primary/[0.06] px-3 py-2 text-[13px] text-primary">{error}</div>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className={lbl}>Your name *</label><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" /></div>
                <div><label className={lbl}>@handle or portfolio</label><input className={inp} value={form.handle} onChange={e => set('handle', e.target.value)} placeholder="@yourhandle" /></div>
              </div>
              <div className="mt-4"><label className={lbl}>Email address *</label><input type="email" className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@email.com" /></div>
              {isApply && (
                <div className="mt-4"><label className={lbl}>Preferred collaboration type</label>
                  <div className="flex flex-wrap gap-2">{COLLAB_TYPES.map(ctype => <button key={ctype} type="button" onClick={() => setCollabType(ctype)} className={`rounded-lg border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition ${collabType === ctype ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>{ctype}</button>)}</div>
                </div>
              )}
              <div className="mt-4"><label className={lbl}>{isApply ? 'Why you\'d be a good fit *' : 'Your message *'}</label>
                <textarea className={`${inp} min-h-[108px] resize-y leading-relaxed`} value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder={isApply ? 'What do you create? Who is your audience?' : `Hi ${brandName}, I'm reaching out because…`} />
              </div>
              <button onClick={submit} disabled={!ok || loading}
                className={`mt-5 w-full rounded-lg ${GRAD_BTN} py-3.5 text-[15px] font-bold text-white shadow-[0_8px_28px_-6px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-surface-card disabled:bg-none disabled:text-ink/30 disabled:shadow-none disabled:hover:translate-y-0`}>
                {loading ? 'Sending…' : `Send ${isApply ? 'application' : 'message'}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}