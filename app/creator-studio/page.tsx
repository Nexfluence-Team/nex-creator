'use client'

/* ════════════════════════════════════════════════════════════════════
   Creator Studio — app/studio/creator/page.tsx  (Nexfluence v4)
   ════════════════════════════════════════════════════════════════════
   MOCK MODE: no backend required.
   • Save = 600ms simulated delay, always succeeds.
   • uploadAsset = URL.createObjectURL — local preview only, lost on refresh.
   • All form state lives in React state only.

   ROUTE INTEGRATION (this revision):
   • TopBar "Dashboard" → /creator-dashboard (was the wrong /dashboard/creator)
   • TopBar "Preview"   → /preview (was the wrong /creator/preview)
   • Logo/wordmark      → clickable, also goes to /creator-dashboard
   • Finishing the wizard no longer just flips an internal flag — it shows
     a real completion screen with working exits: dashboard, public
     profile (/display), or keep customizing (drops into free-edit).

   STRUCTURAL ALIGNMENT WITH BRAND STUDIO:
   • VISITED_KEY = 'nex_creator_studio_visited' — same SSR-safe hydration pattern
   • Free-edit: single activeSection in DOM at a time (not a Set)
   • Per-section dirty flags + per-section save buttons
   • Unsaved-changes guard: blocks nav if activeSection is dirty
   • TopBar shows currentIsDirty, not global dirty
   • GuidedBanner "Edit freely" exits guided mode
   • Mobile save bar: wizard mode only (hidden once wizard is complete)
   ════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const VISITED_KEY = 'nex_creator_studio_visited'
const CARD = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'

/* ════════════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════════════ */
type PlatformKey = 'instagram' | 'tiktok' | 'youtube' | 'snapchat' | 'twitter' | 'linkedin' | 'facebook'
type SectionId = 'basics' | 'platforms' | 'portfolio' | 'collaborations' | 'partnerships' | 'pricing'
type SectionStatus = 'empty' | 'partial' | 'done'
type MetricIconKey = 'eye' | 'heart' | 'cart' | 'share' | 'users' | 'message'
type WorkIconKey = 'shield' | 'zap' | 'handshake'
type PhotoSize = 'large' | 'wide' | 'small'

interface PlatformStatInput { value: string; suffix: string; label: string }
interface PlatformDemographicsInput {
  audienceSize: string
  genderValue: string; genderLabel: string
  ageValue: string; ageLabel: string
  locationValue: string; locationLabel: string; locationFlag: string
  talkAbout: string
}
interface PlatformInput {
  connected: boolean; handle: string
  stats: PlatformStatInput[]
  demographics: PlatformDemographicsInput
}
interface PartnershipInput {
  id: string; brand: string; category: string; since: string; duration: string
  exclusive: boolean; scope: string; description: string; blockedCategory: string
  color: string; logoUrl: string
}
interface PortfolioPhotoInput { id: string; url: string; size: PhotoSize }
interface CollabMetricInput { icon: MetricIconKey; label: string; value: string }
interface CollabReviewInput {
  enabled: boolean; rating: number; quote: string
  name: string; role: string; company: string
  brandColor: string; brandLogoUrl: string
}
interface CollaborationInput {
  id: string; brand: string; title: string; description: string
  target: string; result: string; videoUrl: string; insight: string
  metrics: CollabMetricInput[]; review: CollabReviewInput
}
interface WorkModelInput {
  id: string; name: string; price: string; priceLabel: string
  icon: WorkIconKey; description: string; features: string[]; popular: boolean
}
interface BasicsInput {
  name: string; firstName: string; location: string; bio: string
  genres: string[]; websiteUrl: string; avatarUrl: string; coverUrl: string
}
interface ProfileFormData {
  basics: BasicsInput
  platforms: Record<PlatformKey, PlatformInput>
  primaryPlatform: PlatformKey
  partnerships: PartnershipInput[]
  photos: PortfolioPhotoInput[]
  collaborations: CollaborationInput[]
  workModels: WorkModelInput[]
}

/* ════════════════════════════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════════════════════════════ */
const PLATFORM_ORDER: PlatformKey[] = ['instagram', 'tiktok', 'youtube', 'snapchat', 'twitter', 'linkedin', 'facebook']

const PLATFORM_META: Record<PlatformKey, { label: string; icon: string }> = {
  instagram: { label: 'Instagram',   icon: '/Socials/Instagram.svg' },
  tiktok:    { label: 'TikTok',      icon: '/Socials/TikTok.svg'    },
  youtube:   { label: 'YouTube',     icon: '/Socials/YouTube.svg'   },
  snapchat:  { label: 'Snapchat',    icon: '/Socials/Snapchat.svg'  },
  twitter:   { label: 'Twitter / X', icon: '/Socials/Twitter.svg'   },
  linkedin:  { label: 'LinkedIn',    icon: '/Socials/LinkedIn.svg'  },
  facebook:  { label: 'Facebook',    icon: '/Socials/Facebook.svg'  },
}

const PLATFORM_STAT_PRESETS: Record<PlatformKey, PlatformStatInput[]> = {
  instagram: [
    { value: '', suffix: 'K',   label: 'Combined reach'    },
    { value: '', suffix: '%',   label: 'Avg engagement'    },
    { value: '', suffix: 'M',   label: 'Monthly views'     },
    { value: '', suffix: '+',   label: 'Brand campaigns'   },
  ],
  tiktok: [
    { value: '', suffix: 'K',   label: 'Followers'         },
    { value: '', suffix: '%',   label: 'Avg engagement'    },
    { value: '', suffix: 'M',   label: 'Monthly views'     },
    { value: '', suffix: '',    label: 'Viral videos (1M+)'},
  ],
  youtube: [
    { value: '', suffix: 'K',   label: 'Subscribers'       },
    { value: '', suffix: ' min',label: 'Avg view duration' },
    { value: '', suffix: 'K',   label: 'Watch hours / mo'  },
    { value: '', suffix: '',    label: 'Sponsored videos'  },
  ],
  snapchat: [
    { value: '', suffix: 'K',   label: 'Subscribers'       },
    { value: '', suffix: '%',   label: 'Story completion'  },
    { value: '', suffix: 'K',   label: 'Avg daily views'   },
    { value: '', suffix: '',    label: 'Takeover campaigns' },
  ],
  twitter: [
    { value: '', suffix: 'K',   label: 'Followers'         },
    { value: '', suffix: '%',   label: 'Avg engagement'    },
    { value: '', suffix: 'K',   label: 'Monthly impressions'},
    { value: '', suffix: '',    label: 'Sponsored threads' },
  ],
  linkedin: [
    { value: '', suffix: 'K',   label: 'Followers'         },
    { value: '', suffix: '%',   label: 'Avg engagement'    },
    { value: '', suffix: 'K',   label: 'Post impressions / mo'},
    { value: '', suffix: '',    label: 'Brand partnerships' },
  ],
  facebook: [
    { value: '', suffix: 'K',   label: 'Followers'         },
    { value: '', suffix: '%',   label: 'Avg engagement'    },
    { value: '', suffix: 'M',   label: 'Monthly video views'},
    { value: '', suffix: '',    label: 'Brand campaigns'   },
  ],
}

const FLAG_OPTIONS = [
  { code: 'lv', label: 'Latvia'         },
  { code: 'lt', label: 'Lithuania'      },
  { code: 'ee', label: 'Estonia'        },
  { code: 'pl', label: 'Poland'         },
  { code: 'de', label: 'Germany'        },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'us', label: 'United States'  },
]

const PHOTO_SIZE_OPTIONS: { value: PhotoSize; label: string }[] = [
  { value: 'large', label: 'Large (2×2)'    },
  { value: 'wide',  label: 'Wide (2×1)'     },
  { value: 'small', label: 'Standard (1×1)' },
]

const METRIC_ICON_OPTIONS: { key: MetricIconKey; label: string }[] = [
  { key: 'eye',     label: 'Views'      },
  { key: 'heart',   label: 'Engagement' },
  { key: 'cart',    label: 'Conversions'},
  { key: 'share',   label: 'Shares'     },
  { key: 'users',   label: 'Followers'  },
  { key: 'message', label: 'Messages'   },
]

const SECTION_META: { id: SectionId; label: string; description: string; icon: ReactNode }[] = [
  { id: 'basics',         label: 'Profile basics',        description: 'Name, photo, bio and location',              icon: <IconUser s={18} />        },
  { id: 'platforms',      label: 'Platforms & audience',  description: 'Stats and demographics per platform',        icon: <IconLayers s={18} />      },
  { id: 'portfolio',      label: 'Portfolio',             description: 'Photos and reels that show your work',       icon: <IconGrid s={18} />        },
  { id: 'collaborations', label: 'Collaborations',        description: 'Past campaigns and brand reviews',           icon: <IconStarBurst s={18} />   },
  { id: 'partnerships',   label: 'Partnerships',          description: 'Exclusive or preferred brand deals',         icon: <IconShieldSm s={18} />    },
  { id: 'pricing',        label: 'Ways to work together', description: 'Your collaboration models & pricing',        icon: <IconTag s={18} />         },
]

/* ════════════════════════════════════════════════════════════════════
   Factories
   ════════════════════════════════════════════════════════════════════ */
let _uid = 0
const newId = (p: string) => `${p}_${++_uid}`

function emptyDemographics(): PlatformDemographicsInput {
  return {
    audienceSize: '',
    genderValue: '', genderLabel: 'Female audience',
    ageValue: '',    ageLabel: 'Primary age group',
    locationValue: '', locationLabel: '', locationFlag: 'lv',
    talkAbout: '',
  }
}

function mkPlatform(key: PlatformKey): PlatformInput {
  return { connected: false, handle: '', stats: PLATFORM_STAT_PRESETS[key].map(s => ({ ...s })), demographics: emptyDemographics() }
}

function mkMetrics(): CollabMetricInput[] {
  return [
    { icon: 'eye',   label: 'Views',      value: '' },
    { icon: 'heart', label: 'Engagement', value: '' },
    { icon: 'cart',  label: 'ROAS',       value: '' },
    { icon: 'share', label: 'Shares',     value: '' },
  ]
}

function mkCollaboration(): CollaborationInput {
  return {
    id: newId('collab'), brand: '', title: '', description: '', target: '', result: '',
    videoUrl: '', insight: '', metrics: mkMetrics(),
    review: { enabled: false, rating: 5, quote: '', name: '', role: '', company: '', brandColor: '#8B31E8', brandLogoUrl: '' },
  }
}

function mkPartnership(): PartnershipInput {
  return {
    id: newId('deal'), brand: '', category: '', since: '', duration: '', exclusive: false,
    scope: '', description: '', blockedCategory: '', color: '#8B31E8', logoUrl: '',
  }
}

function mkWorkModel(): WorkModelInput {
  return { id: newId('model'), name: '', price: '', priceLabel: '', icon: 'shield', description: '', features: [''], popular: false }
}

function defaultWorkModels(): WorkModelInput[] {
  return [
    {
      id: newId('model'), name: 'Affiliate / Revenue Share', price: '', priceLabel: 'per sale', icon: 'shield',
      description: 'I only win when you do.',
      features: ['Lower or zero upfront', 'Earn a cut of every sale', 'Incentives fully aligned', 'Trackable codes & links'],
      popular: true,
    },
    {
      id: newId('model'), name: 'Paid Campaigns', price: '', priceLabel: 'per video', icon: 'zap',
      description: 'Straightforward, predictable pricing.',
      features: ['Flat fee per deliverable', 'You brief, I produce', 'Full usage rights included', 'Fast turnaround'],
      popular: false,
    },
    {
      id: newId('model'), name: 'Barter / Gifting', price: '', priceLabel: 'product value', icon: 'handshake',
      description: "For brands with products I'd honestly love.",
      features: ['Product-for-content exchange', 'Select premium items only', 'I genuinely use what I promote', 'Limited spots available'],
      popular: false,
    },
  ]
}

function createInitialProfile(): ProfileFormData {
  const platforms = {} as Record<PlatformKey, PlatformInput>
  for (const key of PLATFORM_ORDER) platforms[key] = mkPlatform(key)
  platforms.instagram = { ...platforms.instagram, connected: true }
  return {
    basics: { name: '', firstName: '', location: '', bio: '', genres: [], websiteUrl: '', avatarUrl: '', coverUrl: '' },
    platforms, primaryPlatform: 'instagram',
    partnerships: [], photos: [], collaborations: [], workModels: defaultWorkModels(),
  }
}

/* ════════════════════════════════════════════════════════════════════
   Mock utilities
   ════════════════════════════════════════════════════════════════════ */
const mockDelay = (ms = 600) => new Promise(r => setTimeout(r, ms))

async function uploadAsset(file: File): Promise<string> {
  return URL.createObjectURL(file)
}

function moveById<T extends { id: string }>(list: T[], id: string, dir: -1 | 1): T[] {
  const i = list.findIndex(x => x.id === id)
  if (i === -1) return list
  const j = i + dir
  if (j < 0 || j >= list.length) return list
  const copy = [...list]
  ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  return copy
}

function computeStatus(p: ProfileFormData, id: SectionId): SectionStatus {
  switch (id) {
    case 'basics':
      return p.basics.name.trim() && p.basics.bio.trim() ? 'done' : p.basics.name.trim() ? 'partial' : 'empty'
    case 'platforms': {
      const on = PLATFORM_ORDER.filter(k => p.platforms[k].connected)
      if (!on.length) return 'empty'
      return on.some(k => p.platforms[k].stats.some(s => s.value.trim())) ? 'done' : 'partial'
    }
    case 'portfolio':    return p.photos.length >= 4 ? 'done' : p.photos.length ? 'partial' : 'empty'
    case 'collaborations': return p.collaborations.length ? 'done' : 'empty'
    case 'partnerships':   return p.partnerships.length  ? 'done' : 'empty'
    case 'pricing':        return p.workModels.some(m => m.name.trim() && m.price.trim()) ? 'done' : 'partial'
    default: return 'empty'
  }
}

/* ════════════════════════════════════════════════════════════════════
   Icons
   ════════════════════════════════════════════════════════════════════ */
function IconCheck({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconChevron({ s = 16, open }: { s?: number; open: boolean }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconUser({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" /><path d="M4.5 20c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}
function IconLayers({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M3 13l9 5 9-5M3 17.5l9 5 9-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconGrid({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7" /><rect x="13" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7" /><rect x="3" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7" /><rect x="13" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7" /></svg>
}
function IconStarBurst({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
}
function IconShieldSm({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
}
function IconTag({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11.5 3H5a2 2 0 00-2 2v6.5a2 2 0 00.6 1.4l9 9a2 2 0 002.8 0l6.5-6.5a2 2 0 000-2.8l-9-9a2 2 0 00-1.4-.6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="8" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.5" /></svg>
}
function IconStar({ s = 22 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z" /></svg>
}
function IconShield({ s = 22 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconZap({ s = 22 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconHandshake({ s = 22 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconEye({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
}
function IconHeart({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconCart({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconShare({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" /><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}
function IconUsers({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}
function IconMessage({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconTrash({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconArrowUp({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconArrowDown({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconPlus({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
}

function MetricIcon({ icon, s = 18 }: { icon: MetricIconKey; s?: number }) {
  switch (icon) {
    case 'eye':     return <IconEye s={s} />
    case 'heart':   return <IconHeart s={s} />
    case 'cart':    return <IconCart s={s} />
    case 'share':   return <IconShare s={s} />
    case 'users':   return <IconUsers s={s} />
    case 'message': return <IconMessage s={s} />
  }
}

function WorkIcon({ icon, s = 22 }: { icon: WorkIconKey; s?: number }) {
  switch (icon) {
    case 'shield':    return <IconShield s={s} />
    case 'zap':       return <IconZap s={s} />
    case 'handshake': return <IconHandshake s={s} />
  }
}

const WORK_ICON_OPTIONS: { key: WorkIconKey; label: string; el: ReactNode }[] = [
  { key: 'shield',    label: 'Shield',    el: <IconShield s={20} />    },
  { key: 'zap',       label: 'Lightning', el: <IconZap s={20} />       },
  { key: 'handshake', label: 'Handshake', el: <IconHandshake s={20} /> },
]

/* ════════════════════════════════════════════════════════════════════
   Field atoms  (identical API surface to brand studio)
   ════════════════════════════════════════════════════════════════════ */
const base = 'rounded-lg border border-primary/12 bg-surface-sub px-4 py-3 font-rubik text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30'
const iCls = `${base} w-full`
const tCls = `${iCls} min-h-[100px] resize-y leading-relaxed`

function FL({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/50">
      <span>{children}</span>
      {hint && <span className="normal-case tracking-normal text-ink/30">{hint}</span>}
    </label>
  )
}
function TF({ label, value, onChange, placeholder, hint, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string; type?: string
}) {
  return <div><FL hint={hint}>{label}</FL><input className={iCls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} /></div>
}
function TA({ label, value, onChange, placeholder, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  return (
    <div>
      <FL hint={maxLength ? `${value.length}/${maxLength}` : undefined}>{label}</FL>
      <textarea className={tCls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} />
    </div>
  )
}
function SF({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return <div><FL>{label}</FL><select className={iCls} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
}
function SW({ label, checked, onChange, description }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; description?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/10 bg-white px-4 py-3.5">
      <div>
        <div className="text-[13px] font-bold text-ink">{label}</div>
        {description && <div className="mt-0.5 text-[12px] text-ink/50">{description}</div>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${checked ? GRAD_BTN : 'bg-ink/15'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
function TagInput({ label, values, onChange, placeholder }: {
  label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string
}) {
  const [draft, setDraft] = useState('')
  const commit = () => { const v = draft.trim(); if (v && !values.includes(v)) onChange([...values, v]); setDraft('') }
  return (
    <div>
      <FL>{label}</FL>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/12 bg-surface-sub px-3 py-2.5 focus-within:border-primary focus-within:bg-white">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1.5 rounded-md border border-primary/15 bg-white px-2.5 py-1 text-[12.5px] font-semibold text-primary">
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} className="text-primary/50 hover:text-primary">✕</button>
          </span>
        ))}
        <input className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-ink/30"
          value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() } if (e.key === 'Backspace' && !draft) onChange(values.slice(0, -1)) }}
          onBlur={commit} />
      </div>
    </div>
  )
}
function StrList({ label, values, onChange, placeholder }: {
  label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string
}) {
  return (
    <div>
      <FL>{label}</FL>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={`${base} min-w-0 flex-1`} value={v}
              onChange={e => onChange(values.map((x, j) => j === i ? e.target.value : x))}
              placeholder={placeholder} />
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:border-red-200 hover:text-red-500">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...values, ''])} className="text-[12.5px] font-bold text-primary hover:underline">+ Add line</button>
      </div>
    </div>
  )
}
function AssetUpload({ label, value, onChange, kind = 'image', aspect = 'square', hint }: {
  label: string; value: string; onChange: (url: string) => void
  kind?: 'image' | 'video'; aspect?: 'square' | 'wide'; hint?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const handle = async (file: File) => {
    setBusy(true)
    try { onChange(await uploadAsset(file)) } finally { setBusy(false) }
  }
  return (
    <div>
      <FL hint={hint}>{label}</FL>
      <div className="flex items-center gap-4">
        <div className={`relative overflow-hidden rounded-xl border border-primary/12 bg-white ${aspect === 'wide' ? 'h-20 w-36' : 'h-20 w-20'}`}>
          {value
            ? kind === 'video'
              ? <video src={value} className="h-full w-full object-cover" muted />
              : <img src={value} alt="" className="h-full w-full object-cover" />
            : <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/30">Empty</span>
          }
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-[10px] font-semibold text-primary">Uploading…</div>}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => ref.current?.click()}
            className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.05]">
            {value ? 'Replace' : 'Upload'}
          </button>
          {value && <button type="button" onClick={() => onChange('')} className="text-[12px] font-semibold text-ink/40 hover:text-red-500">Remove</button>}
        </div>
        <input ref={ref} type="file" accept={kind === 'video' ? 'video/*' : 'image/*'} className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = '' }} />
      </div>
    </div>
  )
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FL>{label}</FL>
      <div className="flex items-center gap-2.5 rounded-lg border border-primary/12 bg-surface-sub px-3 py-2">
        <input type="color" value={value || '#8B31E8'} onChange={e => onChange(e.target.value)} className="h-8 w-9 cursor-pointer rounded border border-primary/15 bg-transparent" />
        <input className="flex-1 bg-transparent font-rubik text-sm text-ink outline-none" value={value} onChange={e => onChange(e.target.value)} placeholder="#8B31E8" />
      </div>
    </div>
  )
}
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className={n <= value ? 'text-primary' : 'text-ink/15'}>
          <IconStar s={22} />
        </button>
      ))}
    </div>
  )
}
function IconPicker<T extends string>({ label, value, onChange, options }: {
  label: string; value: T; onChange: (v: T) => void
  options: { key: T; label: string; el: ReactNode }[]
}) {
  return (
    <div>
      <FL>{label}</FL>
      <div className="flex gap-2">
        {options.map(o => (
          <button key={o.key} type="button" onClick={() => onChange(o.key)} title={o.label}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border transition ${value === o.key ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/10 bg-white text-ink/40 hover:text-primary'}`}>
            {o.el}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Layout atoms
   ════════════════════════════════════════════════════════════════════ */
function StatusPill({ status }: { status: SectionStatus }) {
  if (status === 'done')    return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600"><IconCheck s={11} /> Complete</span>
  if (status === 'partial') return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> In progress</span>
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink/35"><span className="h-1.5 w-1.5 rounded-full bg-ink/20" /> Not started</span>
}

function CardHeader({ title, index, total, onRemove, onUp, onDown }: {
  title: string; index: number; total: number; onRemove: () => void; onUp: () => void; onDown: () => void
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <span className="truncate text-[13px] font-extrabold text-ink">{title}</span>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <button type="button" onClick={onUp} disabled={index === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:text-primary disabled:opacity-30"><IconArrowUp /></button>
        <button type="button" onClick={onDown} disabled={index === total - 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:text-primary disabled:opacity-30"><IconArrowDown /></button>
        <button type="button" onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:border-red-200 hover:text-red-500"><IconTrash /></button>
      </div>
    </div>
  )
}
function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-white py-3.5 text-[13px] font-bold text-primary transition hover:border-primary/40 hover:bg-primary/[0.04]">
      <IconPlus s={15} /> {label}
    </button>
  )
}
function EmptyHint({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-primary/20 bg-surface-sub px-4 py-6 text-center text-[13px] text-ink/45">{text}</p>
}

function Section({ icon, title, description, status, isOpen, onToggle, footer, children, refCb }: {
  icon: ReactNode; title: string; description: string; status: SectionStatus
  isOpen: boolean; onToggle: () => void; footer?: ReactNode; children: ReactNode
  refCb: (el: HTMLDivElement | null) => void
}) {
  return (
    <div ref={refCb} className={`scroll-mt-28 overflow-hidden rounded-2xl border bg-white transition ${CARD} ${isOpen ? 'border-primary/25' : 'border-primary/10'}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-7">
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition ${isOpen ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/12 bg-surface-sub text-primary'}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-extrabold tracking-[-0.01em] text-ink">{title}</span>
            <StatusPill status={status} />
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-ink/50">{description}</span>
        </span>
        <IconChevron open={isOpen} />
      </button>
      {isOpen && (
        <div className="border-t border-primary/8 px-5 py-6 sm:px-7">
          <div className="space-y-6">{children}</div>
          {footer && <div className="mt-7 border-t border-primary/8 pt-5">{footer}</div>}
        </div>
      )}
    </div>
  )
}

function Sidebar({ activeId, statuses, onSelect }: {
  activeId: SectionId | null; statuses: Record<SectionId, SectionStatus>; onSelect: (id: SectionId) => void
}) {
  const done = SECTION_META.filter(s => statuses[s.id] === 'done').length
  return (
    <div className={`sticky top-24 hidden w-[252px] flex-shrink-0 self-start rounded-2xl border border-primary/10 bg-white p-4 lg:block ${CARD}`}>
      <div className="mb-3 px-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40">
          <span>Profile setup</span><span>{done}/{SECTION_META.length}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sub">
          <div className={`h-full ${GRAD_BTN}`} style={{ width: `${(done / SECTION_META.length) * 100}%` }} />
        </div>
      </div>
      <div className="space-y-0.5">
        {SECTION_META.map(s => (
          <button key={s.id} type="button" onClick={() => onSelect(s.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-primary/[0.06] ${activeId === s.id ? 'bg-primary/[0.08]' : ''}`}>
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${activeId === s.id ? `${GRAD_BTN} text-white` : 'bg-surface-sub text-primary'}`}>{s.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-bold text-ink">{s.label}</span>
              <StatusPill status={statuses[s.id]} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MobileNav({ activeId, statuses, onSelect }: {
  activeId: SectionId | null; statuses: Record<SectionId, SectionStatus>; onSelect: (id: SectionId) => void
}) {
  return (
    <div className="sticky top-[57px] z-30 flex gap-2 overflow-x-auto border-b border-primary/10 bg-canvas/95 px-4 py-3 backdrop-blur-md lg:hidden">
      {SECTION_META.map(s => (
        <button key={s.id} type="button" onClick={() => onSelect(s.id)}
          className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-[12px] font-bold transition ${activeId === s.id ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>
          {statuses[s.id] === 'done' && <IconCheck s={11} />}
          {s.label}
        </button>
      ))}
    </div>
  )
}

function TopBar({ dirty, saving, lastSaved, onSave }: {
  dirty: boolean; saving: boolean; lastSaved: Date | null; onSave: () => void
}) {
  const status = saving ? 'Saving…'
    : dirty ? 'Unsaved changes'
    : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not saved yet'
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/creator-dashboard" className="flex items-center gap-2.5">
          <img src="/Nex.webp" alt="Nexfluence" className="h-7 w-auto" />
          <span className="hidden text-[13px] font-bold text-ink/30 sm:inline">/</span>
          <span className="hidden text-[13px] font-bold text-ink/60 sm:inline">Creator Studio</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="hidden text-[12px] text-ink/40 sm:inline">{status}</span>
          {/* Dashboard link — real route, matches the built /creator-dashboard page */}
          <Link href="/creator-dashboard"
            className="hidden items-center gap-1.5 rounded-lg border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-bold text-ink/60 transition hover:bg-surface-sub hover:text-ink sm:flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
            Dashboard
          </Link>
          {/* Preview link — real route, matches the built /preview page */}
          <Link href="/preview" target="_blank" rel="noopener noreferrer"
            className="hidden rounded-lg border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.05] sm:inline-block">
            Preview
          </Link>
          <button type="button" onClick={onSave} disabled={saving || !dirty}
            className={`rounded-lg ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </header>
  )
}

function GuidedBanner({ index, total, onExit }: { index: number; total: number; onExit: () => void }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-primary-lt/[0.04] to-magenta/[0.05] px-5 py-4">
      <div>
        <p className="text-[13.5px] font-extrabold text-ink">Step {index + 1} of {total} — let&apos;s build your creator profile</p>
        <p className="mt-0.5 text-[12.5px] text-ink/55">Fill in one section at a time. Jump anywhere, or edit freely whenever you&apos;re ready.</p>
      </div>
      <button type="button" onClick={onExit} className="flex-shrink-0 text-[12.5px] font-bold text-primary hover:underline">Edit freely</button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Wizard completion screen — the real exit point once every section
   has been walked through. Replaces the old dead-end that just
   flipped into free-edit with nothing selected.
   ════════════════════════════════════════════════════════════════════ */
function CompletionScreen({ firstName, onDashboard, onPreview, onKeepEditing }: {
  firstName: string; onDashboard: () => void; onPreview: () => void; onKeepEditing: () => void
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white px-6 py-14 text-center sm:px-10 ${CARD}`}>
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-magenta/10 shadow-[0_20px_60px_rgba(139,49,232,0.18)]">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="cs-done-ck" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8b31e8" /><stop offset="1" stopColor="#b44af0" />
            </linearGradient>
          </defs>
          <path d="M7 16 L13 22 L25 10" stroke="url(#cs-done-ck)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <h2 className="text-[22px] font-extrabold tracking-[-0.03em] text-ink sm:text-[26px]">
        {firstName ? `Your profile is ready, ${firstName}!` : 'Your profile is ready!'}
      </h2>
      <p className="mx-auto mt-2 max-w-[380px] text-[13.5px] leading-relaxed text-ink/55">
        Every section is filled in. Brands can now find you, review your work, and reach out for deals.
      </p>
      <div className="mx-auto mt-8 flex max-w-[320px] flex-col gap-3">
        <button type="button" onClick={onDashboard}
          className={`rounded-lg ${GRAD_BTN} px-6 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>
          Go to my dashboard →
        </button>
        <button type="button" onClick={onPreview}
          className="rounded-lg border border-primary/20 bg-white px-6 py-3.5 text-[14px] font-bold text-primary transition hover:bg-primary/[0.05]">
          Preview my public profile
        </button>
        <button type="button" onClick={onKeepEditing}
          className="text-[12.5px] font-bold text-ink/45 transition hover:text-ink/70">
          Keep customizing my profile
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Section field blocks
   ════════════════════════════════════════════════════════════════════ */
function BasicsSection({ value, onChange }: { value: BasicsInput; onChange: (p: Partial<BasicsInput>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AssetUpload label="Avatar" value={value.avatarUrl} onChange={url => onChange({ avatarUrl: url })} hint="Square, 400×400px+" />
        <AssetUpload label="Cover image" value={value.coverUrl} onChange={url => onChange({ coverUrl: url })} aspect="wide" hint="Wide banner, 1600×500px+" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TF label="Full name" value={value.name} onChange={name => onChange({ name })} placeholder="Amelia Roze" />
        <TF label="First name" value={value.firstName} onChange={firstName => onChange({ firstName })} placeholder="Amelia" hint="Used in inbox replies" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TF label="Location" value={value.location} onChange={location => onChange({ location })} placeholder="Riga, Latvia" />
        <TF label="Website" value={value.websiteUrl} onChange={websiteUrl => onChange({ websiteUrl })} placeholder="https://yoursite.com" type="url" />
      </div>
      <TA label="Bio" value={value.bio} onChange={bio => onChange({ bio })} placeholder="Tell brands who you are and what makes your content work." maxLength={400} />
      <TagInput label="Content genres" values={value.genres} onChange={genres => onChange({ genres })} placeholder="Type a genre and press Enter" />
    </div>
  )
}

function PlatformsSection({ platforms, primaryPlatform, onToggle, onSetPrimary, onHandle, onStat, onDemo }: {
  platforms: Record<PlatformKey, PlatformInput>; primaryPlatform: PlatformKey
  onToggle: (k: PlatformKey) => void; onSetPrimary: (k: PlatformKey) => void
  onHandle: (k: PlatformKey, v: string) => void
  onStat: (k: PlatformKey, i: number, p: Partial<PlatformStatInput>) => void
  onDemo: (k: PlatformKey, p: Partial<PlatformDemographicsInput>) => void
}) {
  const on = PLATFORM_ORDER.filter(k => platforms[k].connected)
  return (
    <div className="space-y-6">
      <div>
        <FL>Where are you active?</FL>
        <div className="flex flex-wrap gap-2.5">
          {PLATFORM_ORDER.map(k => {
            const m = PLATFORM_META[k]; const active = platforms[k].connected
            return (
              <button key={k} type="button" onClick={() => onToggle(k)}
                className={`flex items-center gap-2 rounded-xl border-[1.5px] px-3.5 py-2.5 text-[13px] font-semibold transition ${active ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/10 bg-white text-ink/55 hover:border-primary/25'}`}>
                <img src={m.icon} alt="" className="h-[17px] w-[17px] rounded-[3px] object-contain" />
                {m.label}
                {active && <IconCheck s={13} />}
              </button>
            )
          })}
        </div>
      </div>
      {on.length === 0 && <EmptyHint text="Select at least one platform above to start filling in your numbers." />}
      {on.map(k => {
        const pl = platforms[k]; const m = PLATFORM_META[k]; const primary = primaryPlatform === k
        return (
          <div key={k} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img src={m.icon} alt="" className="h-5 w-5 rounded-md object-contain" />
                <span className="text-[14px] font-extrabold text-ink">{m.label}</span>
              </div>
              <button type="button" onClick={() => onSetPrimary(k)}
                className={`flex items-center gap-1.5 rounded-lg border-[1.5px] px-3 py-1.5 text-[11.5px] font-bold transition ${primary ? 'border-primary bg-primary/[0.1] text-primary' : 'border-primary/12 bg-white text-ink/45 hover:text-primary'}`}>
                <IconStarBurst s={13} />{primary ? 'Primary platform' : 'Set as primary'}
              </button>
            </div>
            <TF label="Handle or profile URL" value={pl.handle} onChange={v => onHandle(k, v)} placeholder={`@yourname on ${m.label}`} />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pl.stats.map((stat, i) => (
                <div key={i} className="rounded-xl border border-primary/10 bg-white p-3.5">
                  <div className="grid grid-cols-[1fr_72px] gap-2">
                    <input className={iCls} value={stat.value} onChange={e => onStat(k, i, { value: e.target.value })} placeholder="0" />
                    <input className={iCls} value={stat.suffix} onChange={e => onStat(k, i, { suffix: e.target.value })} placeholder="K" />
                  </div>
                  <input className={`${iCls} mt-2`} value={stat.label} onChange={e => onStat(k, i, { label: e.target.value })} placeholder="Metric label" />
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TF label="Audience size" value={pl.demographics.audienceSize} onChange={v => onDemo(k, { audienceSize: v })} placeholder="142K" />
              <div className="grid grid-cols-2 gap-2">
                <TF label="Top gender %" value={pl.demographics.genderValue} onChange={v => onDemo(k, { genderValue: v })} placeholder="78%" />
                <TF label="Gender label"  value={pl.demographics.genderLabel} onChange={v => onDemo(k, { genderLabel: v })} placeholder="Female audience" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TF label="Top age range" value={pl.demographics.ageValue} onChange={v => onDemo(k, { ageValue: v })} placeholder="25–34" />
                <TF label="Age label"     value={pl.demographics.ageLabel}  onChange={v => onDemo(k, { ageLabel: v })}  placeholder="Primary age group" />
              </div>
              <div className="grid grid-cols-[1fr_1fr_96px] gap-2">
                <TF label="Top location"    value={pl.demographics.locationValue} onChange={v => onDemo(k, { locationValue: v })} placeholder="Latvia" />
                <TF label="Location label"  value={pl.demographics.locationLabel} onChange={v => onDemo(k, { locationLabel: v })} placeholder="Top location · 64%" />
                <SF label="Flag" value={pl.demographics.locationFlag} onChange={v => onDemo(k, { locationFlag: v })} options={FLAG_OPTIONS.map(f => ({ value: f.code, label: f.label }))} />
              </div>
            </div>
            <div className="mt-4">
              <TA label="What I talk about here" value={pl.demographics.talkAbout} onChange={v => onDemo(k, { talkAbout: v })} placeholder="Describe the content and tone on this platform." maxLength={320} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PortfolioSection({ photos, onAdd, onRemove, onSize }: {
  photos: PortfolioPhotoInput[]
  onAdd: (f: File) => Promise<void>
  onRemove: (id: string) => void
  onSize: (id: string, s: PhotoSize) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const handle = async (f: File) => { setBusy(true); try { await onAdd(f) } finally { setBusy(false) } }
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">Add photos and reels that show your best work. Mix sizes for a lively grid — large tiles for hero shots, standard for the rest.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map(p => (
          <div key={p.id} className="space-y-2">
            <div className="group relative aspect-square overflow-hidden rounded-xl border border-primary/10 bg-surface-sub">
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => onRemove(p.id)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-ink/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                <IconTrash s={14} />
              </button>
            </div>
            <select className={iCls} value={p.size} onChange={e => onSize(p.id, e.target.value as PhotoSize)}>
              {PHOTO_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-white text-primary transition hover:border-primary/40 hover:bg-primary/[0.04] disabled:opacity-50">
          <IconPlus s={20} />
          <span className="text-[11.5px] font-bold">{busy ? 'Uploading…' : 'Add photo'}</span>
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = '' }} />
    </div>
  )
}

function CollaborationsSection({ items, onAdd, onRemove, onMove, onChange }: {
  items: CollaborationInput[]
  onAdd: () => void; onRemove: (id: string) => void
  onMove: (id: string, d: -1|1) => void; onChange: (id: string, p: Partial<CollaborationInput>) => void
}) {
  const updMetric = (item: CollaborationInput, i: number, p: Partial<CollabMetricInput>) =>
    onChange(item.id, { metrics: item.metrics.map((m, idx) => idx === i ? { ...m, ...p } : m) })
  const updReview = (item: CollaborationInput, p: Partial<CollabReviewInput>) =>
    onChange(item.id, { review: { ...item.review, ...p } })

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">Case studies from real campaigns — proof that you deliver results, with optional brand reviews attached.</p>
      {items.length === 0 && <EmptyHint text="No collaborations yet. Add your strongest campaign first." />}
      {items.map((item, i) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <CardHeader title={item.brand || `Collaboration ${i + 1}`} index={i} total={items.length}
            onRemove={() => onRemove(item.id)} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Brand" value={item.brand} onChange={v => onChange(item.id, { brand: v })} placeholder="Lumora Skincare" />
            <TF label="Campaign title" value={item.title} onChange={v => onChange(item.id, { title: v })} placeholder="Morning ritual with Lumora" />
          </div>
          <div className="mt-4"><TA label="What you did" value={item.description} onChange={v => onChange(item.id, { description: v })} placeholder="A get-ready-with-me video that naturally featured the product." /></div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Target audience"  value={item.target} onChange={v => onChange(item.id, { target: v })} placeholder="Skincare enthusiasts, 25–34" />
            <TF label="Headline result"  value={item.result} onChange={v => onChange(item.id, { result: v })} placeholder="2.1M views, 14% engagement" />
          </div>
          <div className="mt-4"><AssetUpload label="Campaign video / reel" value={item.videoUrl} onChange={v => onChange(item.id, { videoUrl: v })} kind="video" aspect="wide" hint="A short reel for this case study" /></div>
          <div className="mt-4"><TA label="Key insight" value={item.insight} onChange={v => onChange(item.id, { insight: v })} placeholder="What made this campaign work?" /></div>
          <div className="mt-5">
            <FL>Results to highlight</FL>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {item.metrics.map((m, mi) => (
                <div key={mi} className="rounded-xl border border-primary/10 bg-white p-3">
                  <div className="mb-2 flex gap-1">
                    {METRIC_ICON_OPTIONS.map(opt => (
                      <button key={opt.key} type="button" onClick={() => updMetric(item, mi, { icon: opt.key })}
                        className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${m.icon === opt.key ? 'border-primary bg-primary/[0.1] text-primary' : 'border-transparent text-ink/25 hover:text-ink/50'}`}>
                        <MetricIcon icon={opt.key} s={13} />
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={iCls} value={m.value} onChange={e => updMetric(item, mi, { value: e.target.value })} placeholder="2.1M" />
                    <input className={iCls} value={m.label} onChange={e => updMetric(item, mi, { label: e.target.value })} placeholder="Views" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <SW label="Include a brand review" description="Adds a quoted testimonial under this campaign." checked={item.review.enabled} onChange={v => updReview(item, { enabled: v })} />
            {item.review.enabled && (
              <div className="mt-4 space-y-4 rounded-xl border border-primary/10 bg-white p-4">
                <div><FL>Rating</FL><StarRating value={item.review.rating} onChange={r => updReview(item, { rating: r })} /></div>
                <TA label="Quote" value={item.review.quote} onChange={v => updReview(item, { quote: v })} placeholder="What the brand said about working with you." />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <TF label="Reviewer name" value={item.review.name}    onChange={v => updReview(item, { name: v })}    placeholder="Mārtiņš Ozols" />
                  <TF label="Role"          value={item.review.role}    onChange={v => updReview(item, { role: v })}    placeholder="Founder" />
                  <TF label="Company"       value={item.review.company} onChange={v => updReview(item, { company: v })} placeholder="Lumora Skincare" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ColorField label="Brand color"  value={item.review.brandColor}   onChange={v => updReview(item, { brandColor: v })}   />
                  <AssetUpload label="Brand logo"   value={item.review.brandLogoUrl} onChange={v => updReview(item, { brandLogoUrl: v })} />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <AddBtn label="Add a collaboration" onClick={onAdd} />
    </div>
  )
}

function PartnershipsSection({ items, onAdd, onRemove, onMove, onChange }: {
  items: PartnershipInput[]; onAdd: () => void; onRemove: (id: string) => void
  onMove: (id: string, d: -1|1) => void; onChange: (id: string, p: Partial<PartnershipInput>) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">Optional — list any exclusive or preferred-partner deals. These show brands what categories are already locked up.</p>
      {items.length === 0 && <EmptyHint text="No partnerships yet. Skip if you don't have any exclusivity deals." />}
      {items.map((item, i) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <CardHeader title={item.brand || `Partnership ${i + 1}`} index={i} total={items.length}
            onRemove={() => onRemove(item.id)} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Brand"    value={item.brand}    onChange={v => onChange(item.id, { brand: v })}    placeholder="Red Bull" />
            <TF label="Category" value={item.category} onChange={v => onChange(item.id, { category: v })} placeholder="Energy drinks" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Partner since" value={item.since}    onChange={v => onChange(item.id, { since: v })}    placeholder="2023" />
            <TF label="Deal length"   value={item.duration} onChange={v => onChange(item.id, { duration: v })} placeholder="Rolling annual contract" />
          </div>
          <div className="mt-4"><SW label="Exclusive deal" description="Blocks competing brands in this category." checked={item.exclusive} onChange={v => onChange(item.id, { exclusive: v })} /></div>
          <div className="mt-4"><TF label="Scope" value={item.scope} onChange={v => onChange(item.id, { scope: v })} placeholder="Baltic-wide exclusivity" /></div>
          <div className="mt-4"><TA label="Description" value={item.description} onChange={v => onChange(item.id, { description: v })} placeholder="What does this partnership cover?" /></div>
          {item.exclusive && (
            <div className="mt-4"><TF label="Blocked category" value={item.blockedCategory} onChange={v => onChange(item.id, { blockedCategory: v })} placeholder="All energy drink & stimulant brands" /></div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorField label="Brand color" value={item.color}   onChange={v => onChange(item.id, { color: v })}   />
            <AssetUpload label="Brand logo"  value={item.logoUrl} onChange={v => onChange(item.id, { logoUrl: v })} />
          </div>
        </div>
      ))}
      <AddBtn label="Add a partnership" onClick={onAdd} />
    </div>
  )
}

function PricingSection({ items, onAdd, onRemove, onMove, onChange }: {
  items: WorkModelInput[]; onAdd: () => void; onRemove: (id: string) => void
  onMove: (id: string, d: -1|1) => void; onChange: (id: string, p: Partial<WorkModelInput>) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">The ways brands can work with you, shown as cards on your profile. Most creators list two or three.</p>
      {items.map((item, i) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <CardHeader title={item.name || `Model ${i + 1}`} index={i} total={items.length}
            onRemove={() => onRemove(item.id)} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)} />
          <IconPicker label="Icon" value={item.icon} onChange={v => onChange(item.id, { icon: v })} options={WORK_ICON_OPTIONS} />
          <div className="mt-4"><TF label="Name" value={item.name} onChange={v => onChange(item.id, { name: v })} placeholder="Affiliate / Revenue Share" /></div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Price"       value={item.price}      onChange={v => onChange(item.id, { price: v })}      placeholder="10–20%" />
            <TF label="Price label" value={item.priceLabel} onChange={v => onChange(item.id, { priceLabel: v })} placeholder="per sale" />
          </div>
          <div className="mt-4"><TF label="Short description" value={item.description} onChange={v => onChange(item.id, { description: v })} placeholder="I only win when you do." /></div>
          <div className="mt-4"><StrList label="Features" values={item.features} onChange={v => onChange(item.id, { features: v })} placeholder="Trackable codes & links" /></div>
          <div className="mt-4"><SW label="Highlight as most popular" checked={item.popular} onChange={v => onChange(item.id, { popular: v })} /></div>
        </div>
      ))}
      <AddBtn label="Add a way to work together" onClick={onAdd} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════
   FIRST VISIT  → wizard: one section shown at a time.
                  "Save & continue" saves + advances.
                  Reaching the last section shows CompletionScreen,
                  which routes to /creator-dashboard, /display, or
                  drops into free-edit. localStorage flag written on
                  natural completion or "Edit freely" mid-wizard exit.

   RETURN VISIT → free-edit: sidebar always visible, only the active
                  section card is in the DOM.
                  Clicking a sidebar item while the current section
                  has unsaved changes is BLOCKED — an inline warning
                  appears and the user must save first.
   ════════════════════════════════════════════════════════════════════ */
export default function CreatorStudioPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileFormData>(createInitialProfile)

  /* ── Mode detection (localStorage, read after mount to avoid SSR mismatch) ── */
  const [guided,   setGuided]   = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const isReturn = !!localStorage.getItem(VISITED_KEY)
    setGuided(!isReturn)
    setHydrated(true)
  }, [])

  /* ── Wizard step ── */
  const [guidedIdx, setGuidedIdx] = useState(0)

  /* ── Wizard finished — shows CompletionScreen instead of auto-exiting ── */
  const [wizardDone, setWizardDone] = useState(false)

  /* ── Free-edit: which section is open (null = none) ── */
  const [activeSection, setActiveSection] = useState<SectionId | null>('basics')

  /* ── Unsaved-changes guard ── */
  const [blockWarning, setBlockWarning] = useState(false)

  /* ── Top-bar save state (wizard mode) ── */
  const [saving,    setSaving]    = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  /* ── Per-section dirty / saving flags (free-edit mode) ── */
  const [sectionDirty,  setSectionDirty]  = useState<Partial<Record<SectionId, boolean>>>({})
  const [sectionSaving, setSectionSaving] = useState<Partial<Record<SectionId, boolean>>>({})

  const sectionRefs = useRef<Partial<Record<SectionId, HTMLDivElement | null>>>({})
  const regRef = (id: SectionId) => (el: HTMLDivElement | null) => { sectionRefs.current[id] = el }

  const scrollTo = (id: SectionId) =>
    requestAnimationFrame(() => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }))

  /* ── Derived: is the currently open section dirty? ── */
  const currentIsDirty = !!(activeSection && sectionDirty[activeSection])

  /* ─────────────────────────────────────────────────────────────────
     Wizard helpers
  ───────────────────────────────────────────────────────────────── */
  const wizardSectionId: SectionId = SECTION_META[guidedIdx]?.id ?? 'basics'

  const finishGuided = (jumpTo?: SectionId) => {
    localStorage.setItem(VISITED_KEY, '1')
    setGuided(false)
    setWizardDone(false)
    setActiveSection(jumpTo ?? null)
    if (jumpTo) scrollTo(jumpTo)
  }

  const exitGuided = () => finishGuided(wizardSectionId)

  const continueGuided = async () => {
    setSaving(true)
    await mockDelay()
    setSaving(false)
    setLastSaved(new Date())
    const next = guidedIdx + 1
    if (next >= SECTION_META.length) {
      // Reached the end — show the real completion screen instead of
      // silently flipping into an empty free-edit view.
      localStorage.setItem(VISITED_KEY, '1')
      setWizardDone(true)
      return
    }
    setGuidedIdx(next)
    scrollTo(SECTION_META[next]?.id ?? 'basics')
  }

  /* ── Completion-screen exits ── */
  const goToDashboard    = () => router.push('/creator-dashboard')
  const openPublicPreview = () => window.open('/display', '_blank', 'noopener,noreferrer')
  const keepCustomizing  = () => {
    setGuided(false)
    setWizardDone(false)
    setActiveSection('basics')
    scrollTo('basics')
  }

  /* ─────────────────────────────────────────────────────────────────
     Free-edit navigation — blocked if current section is dirty
  ───────────────────────────────────────────────────────────────── */
  const requestSwitch = (id: SectionId) => {
    if (guided) { exitGuided(); return }
    if (activeSection === id) return
    if (currentIsDirty) { setBlockWarning(true); return }
    setBlockWarning(false)
    setActiveSection(id)
    scrollTo(id)
  }

  /* ─────────────────────────────────────────────────────────────────
     Per-section save (free-edit mode)
  ───────────────────────────────────────────────────────────────── */
  const saveSectionById = async (id: SectionId) => {
    setSectionSaving(prev => ({ ...prev, [id]: true }))
    await mockDelay()
    setSectionSaving(prev => ({ ...prev, [id]: false }))
    setSectionDirty(prev => ({ ...prev, [id]: false }))
    setBlockWarning(false)
    setLastSaved(new Date())
  }

  /* ─────────────────────────────────────────────────────────────────
     Profile state updates — marks the relevant section dirty
  ───────────────────────────────────────────────────────────────── */
  const upd = <K extends keyof ProfileFormData>(
    key: K, val: ProfileFormData[K], sectionId?: SectionId,
  ) => {
    setProfile(p => ({ ...p, [key]: val }))
    if (!guided && sectionId) setSectionDirty(prev => ({ ...prev, [sectionId]: true }))
  }

  const updBasics = (patch: Partial<BasicsInput>) =>
    upd('basics', { ...profile.basics, ...patch }, 'basics')

  const updPlatform = (k: PlatformKey, patch: Partial<PlatformInput>) =>
    upd('platforms', { ...profile.platforms, [k]: { ...profile.platforms[k], ...patch } }, 'platforms')

  const togglePlatform = (k: PlatformKey) => {
    const next = !profile.platforms[k].connected
    updPlatform(k, { connected: next })
    if (!next && profile.primaryPlatform === k) {
      const fb = PLATFORM_ORDER.find(x => x !== k && profile.platforms[x].connected)
      upd('primaryPlatform', fb ?? k, 'platforms')
    }
  }

  const updStat = (k: PlatformKey, i: number, p: Partial<PlatformStatInput>) =>
    updPlatform(k, { stats: profile.platforms[k].stats.map((s, idx) => idx === i ? { ...s, ...p } : s) })

  const updDemo = (k: PlatformKey, p: Partial<PlatformDemographicsInput>) =>
    updPlatform(k, { demographics: { ...profile.platforms[k].demographics, ...p } })

  const addPhoto = async (f: File) => {
    const url = await uploadAsset(f)
    upd('photos', [...profile.photos, { id: newId('ph'), url, size: 'small' }], 'portfolio')
  }
  const rmPhoto = (id: string) => upd('photos', profile.photos.filter(p => p.id !== id), 'portfolio')
  const szPhoto = (id: string, s: PhotoSize) =>
    upd('photos', profile.photos.map(p => p.id === id ? { ...p, size: s } : p), 'portfolio')

  const addCollab = () => upd('collaborations', [...profile.collaborations, mkCollaboration()], 'collaborations')
  const rmCollab  = (id: string) => upd('collaborations', profile.collaborations.filter(c => c.id !== id), 'collaborations')
  const mvCollab  = (id: string, d: -1|1) => upd('collaborations', moveById(profile.collaborations, id, d), 'collaborations')
  const chCollab  = (id: string, p: Partial<CollaborationInput>) =>
    upd('collaborations', profile.collaborations.map(c => c.id === id ? { ...c, ...p } : c), 'collaborations')

  const addPartner = () => upd('partnerships', [...profile.partnerships, mkPartnership()], 'partnerships')
  const rmPartner  = (id: string) => upd('partnerships', profile.partnerships.filter(p => p.id !== id), 'partnerships')
  const mvPartner  = (id: string, d: -1|1) => upd('partnerships', moveById(profile.partnerships, id, d), 'partnerships')
  const chPartner  = (id: string, p: Partial<PartnershipInput>) =>
    upd('partnerships', profile.partnerships.map(x => x.id === id ? { ...x, ...p } : x), 'partnerships')

  const addModel = () => upd('workModels', [...profile.workModels, mkWorkModel()], 'pricing')
  const rmModel  = (id: string) => upd('workModels', profile.workModels.filter(m => m.id !== id), 'pricing')
  const mvModel  = (id: string, d: -1|1) => upd('workModels', moveById(profile.workModels, id, d), 'pricing')
  const chModel  = (id: string, p: Partial<WorkModelInput>) =>
    upd('workModels', profile.workModels.map(m => m.id === id ? { ...m, ...p } : m), 'pricing')

  /* ── Wizard global save (top bar) ── */
  const handleSave = async () => {
    setSaving(true)
    await mockDelay(700)
    setSaving(false)
    setLastSaved(new Date())
  }

  /* ─────────────────────────────────────────────────────────────────
     Derived
  ───────────────────────────────────────────────────────────────── */
  const statuses: Record<SectionId, SectionStatus> = {
    basics:         computeStatus(profile, 'basics'),
    platforms:      computeStatus(profile, 'platforms'),
    portfolio:      computeStatus(profile, 'portfolio'),
    collaborations: computeStatus(profile, 'collaborations'),
    partnerships:   computeStatus(profile, 'partnerships'),
    pricing:        computeStatus(profile, 'pricing'),
  }

  /* ─────────────────────────────────────────────────────────────────
     Section content map
  ───────────────────────────────────────────────────────────────── */
  const sectionContent: Record<SectionId, ReactNode> = {
    basics: <BasicsSection value={profile.basics} onChange={updBasics} />,
    platforms: (
      <PlatformsSection
        platforms={profile.platforms} primaryPlatform={profile.primaryPlatform}
        onToggle={togglePlatform} onSetPrimary={k => upd('primaryPlatform', k, 'platforms')}
        onHandle={(k, v) => updPlatform(k, { handle: v })}
        onStat={updStat} onDemo={updDemo}
      />
    ),
    portfolio:      <PortfolioSection      photos={profile.photos}          onAdd={addPhoto}   onRemove={rmPhoto}   onSize={szPhoto} />,
    collaborations: <CollaborationsSection items={profile.collaborations}   onAdd={addCollab}  onRemove={rmCollab}  onMove={mvCollab}  onChange={chCollab} />,
    partnerships:   <PartnershipsSection   items={profile.partnerships}     onAdd={addPartner} onRemove={rmPartner} onMove={mvPartner} onChange={chPartner} />,
    pricing:        <PricingSection        items={profile.workModels}       onAdd={addModel}   onRemove={rmModel}   onMove={mvModel}   onChange={chModel} />,
  }

  /* ─────────────────────────────────────────────────────────────────
     Footer builders
  ───────────────────────────────────────────────────────────────── */
  const wizardFooter = (
    <button type="button" onClick={() => void continueGuided()} disabled={saving}
      className={`rounded-lg ${GRAD_BTN} px-6 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:opacity-50`}>
      {saving ? 'Saving…' : guidedIdx >= SECTION_META.length - 1 ? 'Finish setup →' : 'Save & continue →'}
    </button>
  )

  const freeEditFooter = (id: SectionId) => (
    <button type="button" onClick={() => void saveSectionById(id)}
      disabled={!sectionDirty[id] || !!sectionSaving[id]}
      className={`rounded-lg ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0`}>
      {sectionSaving[id] ? 'Saving…' : sectionDirty[id] ? 'Save this section' : 'Saved ✓'}
    </button>
  )

  /* ─────────────────────────────────────────────────────────────────
     Unsaved-changes warning banner
  ───────────────────────────────────────────────────────────────── */
  const UnsavedWarning = () => (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black text-white">!</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-amber-800">You have unsaved changes</p>
        <p className="mt-0.5 text-[12px] text-amber-700">Save this section before switching to another one.</p>
      </div>
      <button type="button" onClick={() => setBlockWarning(false)} className="flex-shrink-0 text-amber-400 hover:text-amber-600 text-lg leading-none">×</button>
    </div>
  )

  /* ─────────────────────────────────────────────────────────────────
     Prevent hydration flash
  ───────────────────────────────────────────────────────────────── */
  if (!hydrated) return null

  /* ─────────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">
      <TopBar dirty={currentIsDirty} saving={saving} lastSaved={lastSaved} onSave={() => void handleSave()} />
      <MobileNav
        activeId={guided ? wizardSectionId : (activeSection ?? null)}
        statuses={statuses}
        onSelect={requestSwitch}
      />

      <div className="mx-auto flex max-w-[1180px] gap-6 px-4 py-8 pb-24 sm:px-6 lg:py-10 lg:pb-10">
        <Sidebar
          activeId={guided ? wizardSectionId : (activeSection ?? null)}
          statuses={statuses}
          onSelect={requestSwitch}
        />

        <main className="min-w-0 flex-1 space-y-4">

          {/* Unsaved-changes warning */}
          {!guided && blockWarning && <UnsavedWarning />}

          {/* ══ WIZARD MODE — one section at a time ═══════════════════ */}
          {guided && !wizardDone && (() => {
            const s = SECTION_META[guidedIdx]!
            return (
              <>
                <GuidedBanner index={guidedIdx} total={SECTION_META.length} onExit={exitGuided} />
                <Section
                  key={s.id}
                  icon={s.icon} title={s.label} description={s.description}
                  status={statuses[s.id]}
                  isOpen={true}
                  onToggle={() => { /* always open in wizard */ }}
                  refCb={regRef(s.id)}
                  footer={wizardFooter}
                >
                  {sectionContent[s.id]}
                </Section>
              </>
            )
          })()}

          {/* ══ WIZARD COMPLETE — real exit point, not a dead end ══════ */}
          {guided && wizardDone && (
            <CompletionScreen
              firstName={profile.basics.firstName.trim() || profile.basics.name.trim().split(' ')[0] || ''}
              onDashboard={goToDashboard}
              onPreview={openPublicPreview}
              onKeepEditing={keepCustomizing}
            />
          )}

          {/* ══ FREE-EDIT MODE — only the active section in the DOM ═══ */}
          {!guided && (() => {
            if (!activeSection) {
              return (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white px-8 py-16 text-center">
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${GRAD_BTN}`}>
                    <IconLayers s={24} />
                  </div>
                  <p className="text-[15px] font-extrabold text-ink">Select a section to edit</p>
                  <p className="mt-1.5 text-[13px] text-ink/50">Choose any section from the sidebar to start editing your creator profile.</p>
                </div>
              )
            }
            const s = SECTION_META.find(x => x.id === activeSection)!
            return (
              <Section
                key={s.id}
                icon={s.icon} title={s.label} description={s.description}
                status={statuses[s.id]}
                isOpen={true}
                onToggle={() => { /* single-section view, always open */ }}
                refCb={regRef(s.id)}
                footer={freeEditFooter(s.id)}
              >
                {sectionContent[s.id]}
              </Section>
            )
          })()}

        </main>
      </div>

      {/* Mobile save bar — wizard mode only, hidden once the wizard is done */}
      {guided && !wizardDone && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
          <span className="text-[12px] font-semibold text-ink/45">
            {saving ? 'Saving…' : `Step ${guidedIdx + 1} of ${SECTION_META.length}`}
          </span>
          <button type="button" onClick={() => void continueGuided()} disabled={saving}
            className={`rounded-lg ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-40`}>
            {saving ? '…' : guidedIdx >= SECTION_META.length - 1 ? 'Finish' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  )
}