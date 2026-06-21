'use client'

/* ════════════════════════════════════════════════════════════════════
   Creator Studio — page.tsx  (Nexfluence v4)
   ════════════════════════════════════════════════════════════════════
   The editor creators use to build the public profile (see the public
   profile page.tsx for the read-only result of this data).

   Behaviour: a single screen made of independent, collapsible sections.
   The first time someone opens the Studio, "guided mode" keeps exactly
   one section open at a time with a "Save & continue" footer that
   advances to the next section — a soft step-by-step onboarding.
   The moment someone clicks any other section (via the sidebar, the
   mobile chip nav, or another section's header) guided mode exits
   permanently for the session and every section becomes independently
   expandable/collapsible, so editing one thing later never forces the
   whole flow again.

   AUTH — this file intentionally has no auth check in it. Since it
   lives at its own route (app/studio/page.tsx → /studio), the cleanest
   place to gate it is one of:
     (a) middleware.ts — add a matcher for '/studio' that checks the
         session cookie/token before the route even renders, or
     (b) wrap the JSX below in your existing AuthProvider's guard
         component/hook (the one already used for silent token refresh
         elsewhere in the app) and redirect unauthenticated visitors.
   Left out here on purpose rather than guessed, since it needs to match
   whatever your AuthProvider actually exports.
   ════════════════════════════════════════════════════════════════════ */

import { useRef, useState, type ReactNode } from 'react'

const API = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:5000'

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
  genderValue: string
  genderLabel: string
  ageValue: string
  ageLabel: string
  locationValue: string
  locationLabel: string
  locationFlag: string
  talkAbout: string
}

interface PlatformInput {
  connected: boolean
  handle: string
  stats: PlatformStatInput[]
  demographics: PlatformDemographicsInput
}

interface PartnershipInput {
  id: string
  brand: string
  category: string
  since: string
  duration: string
  exclusive: boolean
  scope: string
  description: string
  blockedCategory: string
  color: string
  logoUrl: string
}

interface PortfolioPhotoInput {
  id: string
  url: string
  size: PhotoSize
}

interface CollabMetricInput {
  icon: MetricIconKey
  label: string
  value: string
}

interface CollabReviewInput {
  enabled: boolean
  rating: number
  quote: string
  name: string
  role: string
  company: string
  brandColor: string
  brandLogoUrl: string
}

interface CollaborationInput {
  id: string
  brand: string
  title: string
  description: string
  target: string
  result: string
  videoUrl: string
  insight: string
  metrics: CollabMetricInput[]
  review: CollabReviewInput
}

interface WorkModelInput {
  id: string
  name: string
  price: string
  priceLabel: string
  icon: WorkIconKey
  description: string
  features: string[]
  popular: boolean
}

interface BasicsInput {
  name: string
  firstName: string
  location: string
  bio: string
  genres: string[]
  websiteUrl: string
  avatarUrl: string
  coverUrl: string
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
   Constants & presets
   ════════════════════════════════════════════════════════════════════ */
const PLATFORM_ORDER: PlatformKey[] = ['instagram', 'tiktok', 'youtube', 'snapchat', 'twitter', 'linkedin', 'facebook']

const PLATFORM_META: Record<PlatformKey, { label: string; icon: string }> = {
  instagram: { label: 'Instagram', icon: '/Socials/Instagram.svg' },
  tiktok: { label: 'TikTok', icon: '/Socials/TikTok.svg' },
  youtube: { label: 'YouTube', icon: '/Socials/YouTube.svg' },
  snapchat: { label: 'Snapchat', icon: '/Socials/Snapchat.svg' },
  twitter: { label: 'Twitter / X', icon: '/Socials/Twitter.svg' },
  linkedin: { label: 'LinkedIn', icon: '/Socials/LinkedIn.svg' },
  facebook: { label: 'Facebook', icon: '/Socials/Facebook.svg' },
}

const PLATFORM_STAT_PRESETS: Record<PlatformKey, PlatformStatInput[]> = {
  instagram: [
    { value: '', suffix: 'K', label: 'Combined reach' },
    { value: '', suffix: '%', label: 'Avg engagement' },
    { value: '', suffix: 'M', label: 'Monthly views' },
    { value: '', suffix: '+', label: 'Brand campaigns' },
  ],
  tiktok: [
    { value: '', suffix: 'K', label: 'Followers' },
    { value: '', suffix: '%', label: 'Avg engagement' },
    { value: '', suffix: 'M', label: 'Monthly views' },
    { value: '', suffix: '', label: 'Viral videos (1M+)' },
  ],
  youtube: [
    { value: '', suffix: 'K', label: 'Subscribers' },
    { value: '', suffix: ' min', label: 'Avg view duration' },
    { value: '', suffix: 'K', label: 'Watch hours / mo' },
    { value: '', suffix: '', label: 'Sponsored videos' },
  ],
  snapchat: [
    { value: '', suffix: 'K', label: 'Subscribers' },
    { value: '', suffix: '%', label: 'Story completion' },
    { value: '', suffix: 'K', label: 'Avg daily views' },
    { value: '', suffix: '', label: 'Takeover campaigns' },
  ],
  twitter: [
    { value: '', suffix: 'K', label: 'Followers' },
    { value: '', suffix: '%', label: 'Avg engagement' },
    { value: '', suffix: 'K', label: 'Monthly impressions' },
    { value: '', suffix: '', label: 'Sponsored threads' },
  ],
  linkedin: [
    { value: '', suffix: 'K', label: 'Followers' },
    { value: '', suffix: '%', label: 'Avg engagement' },
    { value: '', suffix: 'K', label: 'Post impressions / mo' },
    { value: '', suffix: '', label: 'Brand partnerships' },
  ],
  facebook: [
    { value: '', suffix: 'K', label: 'Followers' },
    { value: '', suffix: '%', label: 'Avg engagement' },
    { value: '', suffix: 'M', label: 'Monthly video views' },
    { value: '', suffix: '', label: 'Brand campaigns' },
  ],
}

const FLAG_OPTIONS: { code: string; label: string }[] = [
  { code: 'lv', label: 'Latvia' },
  { code: 'lt', label: 'Lithuania' },
  { code: 'ee', label: 'Estonia' },
  { code: 'pl', label: 'Poland' },
  { code: 'de', label: 'Germany' },
  { code: 'gb', label: 'United Kingdom' },
  { code: 'us', label: 'United States' },
]

const PHOTO_SIZE_OPTIONS: { value: PhotoSize; label: string }[] = [
  { value: 'large', label: 'Large (2×2)' },
  { value: 'wide', label: 'Wide (2×1)' },
  { value: 'small', label: 'Standard (1×1)' },
]

const METRIC_ICON_OPTIONS: { key: MetricIconKey; label: string }[] = [
  { key: 'eye', label: 'Views' },
  { key: 'heart', label: 'Engagement' },
  { key: 'cart', label: 'Conversions' },
  { key: 'share', label: 'Shares' },
  { key: 'users', label: 'Followers' },
  { key: 'message', label: 'Messages' },
]

/* ════════════════════════════════════════════════════════════════════
   Factories & helpers
   ════════════════════════════════════════════════════════════════════ */
let uid = 0
function newId(prefix: string): string {
  uid += 1
  return `${prefix}_${uid}`
}

function emptyDemographics(): PlatformDemographicsInput {
  return {
    audienceSize: '', genderValue: '', genderLabel: 'Female audience',
    ageValue: '', ageLabel: 'Primary age group',
    locationValue: '', locationLabel: '', locationFlag: 'lv',
    talkAbout: '',
  }
}

function createPlatform(key: PlatformKey): PlatformInput {
  return {
    connected: false,
    handle: '',
    stats: PLATFORM_STAT_PRESETS[key].map(s => ({ ...s })),
    demographics: emptyDemographics(),
  }
}

function createEmptyMetrics(): CollabMetricInput[] {
  return [
    { icon: 'eye', label: 'Views', value: '' },
    { icon: 'heart', label: 'Engagement', value: '' },
    { icon: 'cart', label: 'ROAS', value: '' },
    { icon: 'share', label: 'Shares', value: '' },
  ]
}

function createCollaboration(): CollaborationInput {
  return {
    id: newId('collab'), brand: '', title: '', description: '', target: '', result: '',
    videoUrl: '', insight: '', metrics: createEmptyMetrics(),
    review: { enabled: false, rating: 5, quote: '', name: '', role: '', company: '', brandColor: '#8B31E8', brandLogoUrl: '' },
  }
}

function createPartnership(): PartnershipInput {
  return {
    id: newId('deal'), brand: '', category: '', since: '', duration: '', exclusive: false,
    scope: '', description: '', blockedCategory: '', color: '#8B31E8', logoUrl: '',
  }
}

function createWorkModel(): WorkModelInput {
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
  // Record<PlatformKey, PlatformInput> is populated for every key below,
  // so the cast is safe — every PlatformKey member is assigned in the loop.
  const platforms = {} as Record<PlatformKey, PlatformInput>
  for (const key of PLATFORM_ORDER) platforms[key] = createPlatform(key)
  platforms.instagram = { ...platforms.instagram, connected: true }

  return {
    basics: { name: '', firstName: '', location: '', bio: '', genres: [], websiteUrl: '', avatarUrl: '', coverUrl: '' },
    platforms,
    primaryPlatform: 'instagram',
    partnerships: [],
    photos: [],
    collaborations: [],
    workModels: defaultWorkModels(),
  }
}

/**
 * TEMPORARY — visualization-only upload.
 *
 * Right now this just returns a local object URL so the Studio is fully
 * usable before any backend exists. Object URLs only live for this
 * browser tab/session, so nothing persists across reloads yet — that's
 * expected at this stage.
 *
 * Once the Express + Cloudinary backend is ready, replace the body of
 * this function with the real upload call, e.g.:
 *
 *   const body = new FormData()
 *   body.append('file', file)
 *   const res = await fetch(`${API}/upload`, { method: 'POST', body })
 *   const json = await res.json() as { url: string }
 *   return json.url
 *
 * No other code in this file needs to change — every field already
 * calls uploadAsset() and just stores whatever string URL comes back.
 */
async function uploadAsset(file: File): Promise<string> {
  return URL.createObjectURL(file)
}

function moveById<T extends { id: string }>(list: T[], id: string, dir: -1 | 1): T[] {
  const index = list.findIndex(item => item.id === id)
  if (index === -1) return list
  const target = index + dir
  if (target < 0 || target >= list.length) return list
  const a = list[index]
  const b = list[target]
  if (!a || !b) return list
  const copy = [...list]
  copy[index] = b
  copy[target] = a
  return copy
}

function computeStatus(profile: ProfileFormData, id: SectionId): SectionStatus {
  switch (id) {
    case 'basics':
      if (profile.basics.name.trim() && profile.basics.bio.trim()) return 'done'
      return profile.basics.name.trim() ? 'partial' : 'empty'
    case 'platforms': {
      const connected = PLATFORM_ORDER.filter(k => profile.platforms[k].connected)
      if (connected.length === 0) return 'empty'
      const filled = connected.some(k => profile.platforms[k].stats.some(s => s.value.trim() !== ''))
      return filled ? 'done' : 'partial'
    }
    case 'portfolio':
      if (profile.photos.length >= 4) return 'done'
      return profile.photos.length > 0 ? 'partial' : 'empty'
    case 'collaborations':
      return profile.collaborations.length > 0 ? 'done' : 'empty'
    case 'partnerships':
      return profile.partnerships.length > 0 ? 'done' : 'empty'
    case 'pricing':
      return profile.workModels.some(m => m.name.trim() && m.price.trim()) ? 'done' : 'partial'
    default:
      return 'empty'
  }
}

/* ════════════════════════════════════════════════════════════════════
   Icons (small, local set — kept self-contained for this file)
   ════════════════════════════════════════════════════════════════════ */
function IconCheck({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconChevron({ s = 16, open }: { s?: number; open: boolean }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconUser({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" /><path d="M4.5 20c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}
function IconLayers({ s = 20 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3 13l9 5 9-5M3 17.5l9 5 9-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconGrid({ s = 20 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
      <rect x="3" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
      <rect x="13" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}
function IconStarBurst({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
}
function IconShieldSmall({ s = 20 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
}
function IconTag({ s = 20 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11.5 3H5a2 2 0 00-2 2v6.5a2 2 0 00.6 1.4l9 9a2 2 0 002.8 0l6.5-6.5a2 2 0 000-2.8l-9-9a2 2 0 00-1.4-.6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
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
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconEye({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
}
function IconHeart({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function IconCart({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconShare({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function IconUsers({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
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

function MetricIconView({ icon, s = 18 }: { icon: MetricIconKey; s?: number }) {
  switch (icon) {
    case 'eye': return <IconEye s={s} />
    case 'heart': return <IconHeart s={s} />
    case 'cart': return <IconCart s={s} />
    case 'share': return <IconShare s={s} />
    case 'users': return <IconUsers s={s} />
    case 'message': return <IconMessage s={s} />
    default: return <IconEye s={s} />
  }
}

const WORK_ICON_OPTIONS: { key: WorkIconKey; label: string; render: ReactNode }[] = [
  { key: 'shield', label: 'Shield', render: <IconShield s={20} /> },
  { key: 'zap', label: 'Lightning', render: <IconZap s={20} /> },
  { key: 'handshake', label: 'Handshake', render: <IconHandshake s={20} /> },
]

const SECTION_META: { id: SectionId; label: string; description: string; icon: ReactNode }[] = [
  { id: 'basics', label: 'Profile basics', description: 'Name, photo, bio and location', icon: <IconUser s={18} /> },
  { id: 'platforms', label: 'Platforms & audience', description: 'Stats and demographics per platform', icon: <IconLayers s={18} /> },
  { id: 'portfolio', label: 'Portfolio', description: 'Photos and reels that show your work', icon: <IconGrid s={18} /> },
  { id: 'collaborations', label: 'Collaborations', description: 'Past campaigns and brand reviews', icon: <IconStarBurst s={18} /> },
  { id: 'partnerships', label: 'Partnerships', description: 'Exclusive or preferred brand deals', icon: <IconShieldSmall s={18} /> },
  { id: 'pricing', label: 'Ways to work together', description: 'Your collaboration models & pricing', icon: <IconTag s={18} /> },
]

/* ════════════════════════════════════════════════════════════════════
   Field atoms
   ════════════════════════════════════════════════════════════════════ */
const fieldBase = 'rounded-lg border border-primary/12 bg-surface-sub px-4 py-3 font-rubik text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30'
const inputCls = `${fieldBase} w-full`
const textareaCls = `${inputCls} min-h-[100px] resize-y leading-relaxed`

function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/50">
      <span>{children}</span>
      {hint && <span className="normal-case tracking-normal text-ink/30">{hint}</span>}
    </label>
  )
}

function TextField({
  label, value, onChange, placeholder, hint, type = 'text', inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  type?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'url'
}) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <input className={inputCls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} inputMode={inputMode} />
    </div>
  )
}

function TextAreaField({
  label, value, onChange, placeholder, maxLength,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return (
    <div>
      <FieldLabel hint={maxLength ? `${value.length}/${maxLength}` : undefined}>{label}</FieldLabel>
      <textarea className={textareaCls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} />
    </div>
  )
}

function SelectField({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select className={inputCls} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SwitchField({
  label, checked, onChange, description,
}: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/10 bg-white px-4 py-3.5">
      <div>
        <div className="text-[13px] font-bold text-ink">{label}</div>
        {description && <div className="mt-0.5 text-[12px] text-ink/50">{description}</div>}
      </div>
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${checked ? GRAD_BTN : 'bg-ink/15'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

function TagInputField({
  label, values, onChange, placeholder,
}: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const commit = () => {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/12 bg-surface-sub px-3 py-2.5 focus-within:border-primary focus-within:bg-white">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1.5 rounded-md border border-primary/15 bg-white px-2.5 py-1 text-[12.5px] font-semibold text-primary">
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} className="text-primary/50 hover:text-primary" aria-label={`Remove ${v}`}>✕</button>
          </span>
        ))}
        <input
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-ink/30"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
            if (e.key === 'Backspace' && draft === '' && values.length) onChange(values.slice(0, -1))
          }}
          onBlur={commit}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

function StringListField({
  label, values, onChange, placeholder,
}: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={`${fieldBase} min-w-0 flex-1`}
              value={v}
              onChange={e => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={placeholder}
            />
            <button
              type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} aria-label="Remove line"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/10 text-ink/40 transition hover:border-red-200 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...values, ''])} className="text-[12.5px] font-bold text-primary hover:underline">
          + Add line
        </button>
      </div>
    </div>
  )
}

function AssetUploadField({
  label, value, onChange, kind = 'image', aspect = 'square', hint,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  kind?: 'image' | 'video'
  aspect?: 'square' | 'wide'
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (file: File) => {
    setBusy(true)
    try {
      const url = await uploadAsset(file)
      onChange(url)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <div className="flex items-center gap-4">
        <div className={`relative overflow-hidden rounded-xl border border-primary/12 bg-white ${aspect === 'wide' ? 'h-20 w-36' : 'h-20 w-20'}`}>
          {value ? (
            kind === 'video' ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={value} className="h-full w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/30">Empty</span>
          )}
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-[10px] font-semibold text-primary">Uploading…</div>}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.05]">
            {value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="text-[12px] font-semibold text-ink/40 hover:text-red-500">
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef} type="file" accept={kind === 'video' ? 'video/*' : 'image/*'} className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2.5 rounded-lg border border-primary/12 bg-surface-sub px-3 py-2">
        <input type="color" value={value || '#8B31E8'} onChange={e => onChange(e.target.value)} className="h-8 w-9 cursor-pointer rounded border border-primary/15 bg-transparent" aria-label={`${label} swatch`} />
        <input className="flex-1 bg-transparent font-rubik text-sm text-ink outline-none" value={value} onChange={e => onChange(e.target.value)} placeholder="#8B31E8" />
      </div>
    </div>
  )
}

function StarRatingInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className={n <= value ? 'text-primary' : 'text-ink/15'} aria-label={`${n} star`}>
          <IconStar s={22} />
        </button>
      ))}
    </div>
  )
}

function IconPickerField<T extends string>({
  label, value, onChange, options,
}: { label: string; value: T; onChange: (v: T) => void; options: { key: T; label: string; render: ReactNode }[] }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-2">
        {options.map(o => (
          <button
            key={o.key} type="button" onClick={() => onChange(o.key)} title={o.label} aria-label={o.label}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border transition ${value === o.key ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/10 bg-white text-ink/40 hover:text-primary'}`}
          >
            {o.render}
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
  if (status === 'done') {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600"><IconCheck s={11} /> Complete</span>
  }
  if (status === 'partial') {
    return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> In progress</span>
  }
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink/35"><span className="h-1.5 w-1.5 rounded-full bg-ink/20" /> Not started</span>
}

function ItemCardHeader({
  title, index, total, onRemove, onMoveUp, onMoveDown,
}: { title: string; index: number; total: number; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <span className="truncate text-[13px] font-extrabold text-ink">{title}</span>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <button type="button" onClick={onMoveUp} disabled={index === 0} aria-label="Move up" className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:text-primary disabled:opacity-30">
          <IconArrowUp />
        </button>
        <button type="button" onClick={onMoveDown} disabled={index === total - 1} aria-label="Move down" className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:text-primary disabled:opacity-30">
          <IconArrowDown />
        </button>
        <button type="button" onClick={onRemove} aria-label="Remove" className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:border-red-200 hover:text-red-500">
          <IconTrash />
        </button>
      </div>
    </div>
  )
}

function AddItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-white py-3.5 text-[13px] font-bold text-primary transition hover:border-primary/40 hover:bg-primary/[0.04]">
      <IconPlus s={15} /> {label}
    </button>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-primary/20 bg-surface-sub px-4 py-6 text-center text-[13px] text-ink/45">{text}</p>
}

function AccordionSection({
  icon, title, description, status, isOpen, onToggle, footer, children, registerRef,
}: {
  icon: ReactNode
  title: string
  description: string
  status: SectionStatus
  isOpen: boolean
  onToggle: () => void
  footer?: ReactNode
  children: ReactNode
  registerRef: (el: HTMLDivElement | null) => void
}) {
  return (
    <div ref={registerRef} className={`scroll-mt-28 overflow-hidden rounded-2xl border bg-white transition ${CARD} ${isOpen ? 'border-primary/25' : 'border-primary/10'}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-7">
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition ${isOpen ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/12 bg-surface-sub text-primary'}`}>
          {icon}
        </span>
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

function Sidebar({
  activeId, statuses, onSelect,
}: { activeId: SectionId | null; statuses: Record<SectionId, SectionStatus>; onSelect: (id: SectionId) => void }) {
  const doneCount = SECTION_META.filter(s => statuses[s.id] === 'done').length
  return (
    <div className={`sticky top-24 hidden w-[252px] flex-shrink-0 self-start rounded-2xl border border-primary/10 bg-white p-4 lg:block ${CARD}`}>
      <div className="mb-3 px-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40">
          <span>Profile setup</span><span>{doneCount}/{SECTION_META.length}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sub">
          <div className={`h-full ${GRAD_BTN}`} style={{ width: `${(doneCount / SECTION_META.length) * 100}%` }} />
        </div>
      </div>
      <div className="space-y-0.5">
        {SECTION_META.map(s => (
          <button
            key={s.id} type="button" onClick={() => onSelect(s.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-primary/[0.06] ${activeId === s.id ? 'bg-primary/[0.08]' : ''}`}
          >
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

function MobileSectionNav({
  activeId, statuses, onSelect,
}: { activeId: SectionId | null; statuses: Record<SectionId, SectionStatus>; onSelect: (id: SectionId) => void }) {
  return (
    <div className="sticky top-[57px] z-30 flex gap-2 overflow-x-auto border-b border-primary/10 bg-canvas/95 px-4 py-3 backdrop-blur-md lg:hidden">
      {SECTION_META.map(s => (
        <button
          key={s.id} type="button" onClick={() => onSelect(s.id)}
          className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-[12px] font-bold transition ${activeId === s.id ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}
        >
          {statuses[s.id] === 'done' && <IconCheck s={11} />}
          {s.label}
        </button>
      ))}
    </div>
  )
}

function StudioTopBar({
  dirty, saving, lastSavedAt, onSave, previewHref,
}: { dirty: boolean; saving: boolean; lastSavedAt: Date | null; onSave: () => void; previewHref: string }) {
  const statusText = saving
    ? 'Saving…'
    : dirty
      ? 'Unsaved changes'
      : lastSavedAt
        ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Not saved yet'

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Nex.webp" alt="Nexfluence" className="h-7 w-auto" />
          <span className="hidden text-[13px] font-bold text-ink/30 sm:inline">/</span>
          <span className="hidden text-[13px] font-bold text-ink/60 sm:inline">Studio</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="hidden text-[12px] text-ink/40 sm:inline">{statusText}</span>
          <a
            href={previewHref} target="_blank" rel="noopener noreferrer"
            className="hidden rounded-lg border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.05] sm:inline-block"
          >
            Preview
          </a>
          <button
            type="button" onClick={onSave} disabled={saving || !dirty}
            className={`rounded-lg ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`}
          >
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
        <p className="text-[13.5px] font-extrabold text-ink">Step {index + 1} of {total} — let&apos;s build your profile</p>
        <p className="mt-0.5 text-[12.5px] text-ink/55">Fill in one section at a time. Jump anywhere, or edit freely whenever you&apos;re ready.</p>
      </div>
      <button type="button" onClick={onExit} className="flex-shrink-0 text-[12.5px] font-bold text-primary hover:underline">
        Edit sections freely
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Section field components
   ════════════════════════════════════════════════════════════════════ */
function BasicsFields({ value, onChange }: { value: BasicsInput; onChange: (patch: Partial<BasicsInput>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AssetUploadField label="Avatar" value={value.avatarUrl} onChange={url => onChange({ avatarUrl: url })} hint="Square, 400×400px+" />
        <AssetUploadField label="Cover image" value={value.coverUrl} onChange={url => onChange({ coverUrl: url })} aspect="wide" hint="Wide banner, 1600×500px+" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Full name" value={value.name} onChange={name => onChange({ name })} placeholder="Amelia Roze" />
        <TextField label="First name" value={value.firstName} onChange={firstName => onChange({ firstName })} placeholder="Amelia" hint="Used in your inbox replies" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Location" value={value.location} onChange={location => onChange({ location })} placeholder="Riga, Latvia" />
        <TextField label="Website" value={value.websiteUrl} onChange={websiteUrl => onChange({ websiteUrl })} placeholder="https://yoursite.com" type="url" />
      </div>
      <TextAreaField label="Bio" value={value.bio} onChange={bio => onChange({ bio })} placeholder="Tell brands who you are and what makes your content work." maxLength={400} />
      <TagInputField label="Content genres" values={value.genres} onChange={genres => onChange({ genres })} placeholder="Type a genre and press Enter" />
    </div>
  )
}

function PlatformsFields({
  platforms, primaryPlatform, onToggle, onSetPrimary, onHandleChange, onStatChange, onDemoChange,
}: {
  platforms: Record<PlatformKey, PlatformInput>
  primaryPlatform: PlatformKey
  onToggle: (key: PlatformKey) => void
  onSetPrimary: (key: PlatformKey) => void
  onHandleChange: (key: PlatformKey, handle: string) => void
  onStatChange: (key: PlatformKey, index: number, patch: Partial<PlatformStatInput>) => void
  onDemoChange: (key: PlatformKey, patch: Partial<PlatformDemographicsInput>) => void
}) {
  const connectedKeys = PLATFORM_ORDER.filter(k => platforms[k].connected)

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel>Where are you active?</FieldLabel>
        <div className="flex flex-wrap gap-2.5">
          {PLATFORM_ORDER.map(key => {
            const meta = PLATFORM_META[key]
            const isOn = platforms[key].connected
            return (
              <button
                key={key} type="button" onClick={() => onToggle(key)}
                className={`flex items-center gap-2 rounded-xl border-[1.5px] px-3.5 py-2.5 text-[13px] font-semibold transition ${isOn ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/10 bg-white text-ink/55 hover:border-primary/25'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meta.icon} alt="" className="h-[17px] w-[17px] rounded-[3px] object-contain" />
                {meta.label}
                {isOn && <IconCheck s={13} />}
              </button>
            )
          })}
        </div>
      </div>

      {connectedKeys.length === 0 && <EmptyHint text="Select at least one platform above to start filling in your numbers." />}

      {connectedKeys.map(key => {
        const platform = platforms[key]
        const meta = PLATFORM_META[key]
        const isPrimary = primaryPlatform === key
        return (
          <div key={key} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meta.icon} alt="" className="h-5 w-5 rounded-md object-contain" />
                <span className="text-[14px] font-extrabold text-ink">{meta.label}</span>
              </div>
              <button
                type="button" onClick={() => onSetPrimary(key)}
                className={`flex items-center gap-1.5 rounded-lg border-[1.5px] px-3 py-1.5 text-[11.5px] font-bold transition ${isPrimary ? 'border-primary bg-primary/[0.1] text-primary' : 'border-primary/12 bg-white text-ink/45 hover:text-primary'}`}
              >
                <IconStarBurst s={13} />
                {isPrimary ? 'Primary platform' : 'Set as primary'}
              </button>
            </div>

            <TextField label="Handle or profile URL" value={platform.handle} onChange={v => onHandleChange(key, v)} placeholder={`@yourname on ${meta.label}`} />

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {platform.stats.map((stat, index) => (
                <div key={index} className="rounded-xl border border-primary/10 bg-white p-3.5">
                  <div className="grid grid-cols-[1fr_72px] gap-2">
                    <input className={inputCls} value={stat.value} onChange={e => onStatChange(key, index, { value: e.target.value })} placeholder="0" inputMode="decimal" />
                    <input className={inputCls} value={stat.suffix} onChange={e => onStatChange(key, index, { suffix: e.target.value })} placeholder="K" />
                  </div>
                  <input className={`${inputCls} mt-2`} value={stat.label} onChange={e => onStatChange(key, index, { label: e.target.value })} placeholder="Metric label" />
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Audience size" value={platform.demographics.audienceSize} onChange={v => onDemoChange(key, { audienceSize: v })} placeholder="142K" />
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Top gender %" value={platform.demographics.genderValue} onChange={v => onDemoChange(key, { genderValue: v })} placeholder="78%" />
                <TextField label="Gender label" value={platform.demographics.genderLabel} onChange={v => onDemoChange(key, { genderLabel: v })} placeholder="Female audience" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Top age range" value={platform.demographics.ageValue} onChange={v => onDemoChange(key, { ageValue: v })} placeholder="25–34" />
                <TextField label="Age label" value={platform.demographics.ageLabel} onChange={v => onDemoChange(key, { ageLabel: v })} placeholder="Primary age group" />
              </div>
              <div className="grid grid-cols-[1fr_1fr_96px] gap-2">
                <TextField label="Top location" value={platform.demographics.locationValue} onChange={v => onDemoChange(key, { locationValue: v })} placeholder="Latvia" />
                <TextField label="Location label" value={platform.demographics.locationLabel} onChange={v => onDemoChange(key, { locationLabel: v })} placeholder="Top location · 64%" />
                <SelectField label="Flag" value={platform.demographics.locationFlag} onChange={v => onDemoChange(key, { locationFlag: v })} options={FLAG_OPTIONS.map(f => ({ value: f.code, label: f.label }))} />
              </div>
            </div>
            <div className="mt-4">
              <TextAreaField label="What I talk about here" value={platform.demographics.talkAbout} onChange={v => onDemoChange(key, { talkAbout: v })} placeholder="Describe the content and tone on this platform." maxLength={320} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PortfolioFields({
  photos, onAdd, onRemove, onSizeChange,
}: {
  photos: PortfolioPhotoInput[]
  onAdd: (file: File) => Promise<void>
  onRemove: (id: string) => void
  onSizeChange: (id: string, size: PhotoSize) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handleAdd = async (file: File) => {
    setBusy(true)
    try { await onAdd(file) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">Add the photos and reels that show your best work. Mix sizes to build a lively grid — large tiles for hero shots, standard for the rest.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map(photo => (
          <div key={photo.id} className="space-y-2">
            <div className="group relative aspect-square overflow-hidden rounded-xl border border-primary/10 bg-surface-sub">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button" onClick={() => onRemove(photo.id)} aria-label="Remove photo"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-ink/60 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
              >
                <IconTrash s={14} />
              </button>
            </div>
            <select className={inputCls} value={photo.size} onChange={e => onSizeChange(photo.id, e.target.value as PhotoSize)}>
              {PHOTO_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
        <button
          type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-white text-primary transition hover:border-primary/40 hover:bg-primary/[0.04] disabled:opacity-50"
        >
          <IconPlus s={20} />
          <span className="text-[11.5px] font-bold">{busy ? 'Uploading…' : 'Add photo'}</span>
        </button>
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) void handleAdd(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function CollaborationCard({
  item, index, total, onRemove, onMoveUp, onMoveDown, onChange,
}: {
  item: CollaborationInput
  index: number
  total: number
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onChange: (patch: Partial<CollaborationInput>) => void
}) {
  const updateMetric = (i: number, patch: Partial<CollabMetricInput>) =>
    onChange({ metrics: item.metrics.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) })
  const updateReview = (patch: Partial<CollabReviewInput>) => onChange({ review: { ...item.review, ...patch } })

  return (
    <div className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
      <ItemCardHeader title={item.brand || `Collaboration ${index + 1}`} index={index} total={total} onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Brand" value={item.brand} onChange={brand => onChange({ brand })} placeholder="Lumora Skincare" />
        <TextField label="Campaign title" value={item.title} onChange={title => onChange({ title })} placeholder="Morning ritual with Lumora" />
      </div>
      <div className="mt-4">
        <TextAreaField label="What you did" value={item.description} onChange={description => onChange({ description })} placeholder="A get-ready-with-me video that naturally featured the product." />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Target audience" value={item.target} onChange={target => onChange({ target })} placeholder="Skincare enthusiasts, 25–34" />
        <TextField label="Headline result" value={item.result} onChange={result => onChange({ result })} placeholder="2.1M views, 14% engagement" />
      </div>
      <div className="mt-4">
        <AssetUploadField label="Video" value={item.videoUrl} onChange={videoUrl => onChange({ videoUrl })} kind="video" aspect="wide" hint="A short reel for this case study" />
      </div>
      <div className="mt-4">
        <TextAreaField label="Key insight" value={item.insight} onChange={insight => onChange({ insight })} placeholder="What made this campaign work?" />
      </div>

      <div className="mt-5">
        <FieldLabel>Results to highlight</FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {item.metrics.map((metric, i) => (
            <div key={i} className="rounded-xl border border-primary/10 bg-white p-3">
              <div className="mb-2 flex gap-1">
                {METRIC_ICON_OPTIONS.map(opt => (
                  <button
                    key={opt.key} type="button" onClick={() => updateMetric(i, { icon: opt.key })} title={opt.label} aria-label={opt.label}
                    className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${metric.icon === opt.key ? 'border-primary bg-primary/[0.1] text-primary' : 'border-transparent text-ink/25 hover:text-ink/50'}`}
                  >
                    <MetricIconView icon={opt.key} s={13} />
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={inputCls} value={metric.value} onChange={e => updateMetric(i, { value: e.target.value })} placeholder="2.1M" />
                <input className={inputCls} value={metric.label} onChange={e => updateMetric(i, { label: e.target.value })} placeholder="Views" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <SwitchField label="Include a brand review" description="Adds a quoted testimonial under this campaign." checked={item.review.enabled} onChange={enabled => updateReview({ enabled })} />
        {item.review.enabled && (
          <div className="mt-4 space-y-4 rounded-xl border border-primary/10 bg-white p-4">
            <div>
              <FieldLabel>Rating</FieldLabel>
              <StarRatingInput value={item.review.rating} onChange={rating => updateReview({ rating })} />
            </div>
            <TextAreaField label="Quote" value={item.review.quote} onChange={quote => updateReview({ quote })} placeholder="What the brand said about working with you." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField label="Reviewer name" value={item.review.name} onChange={name => updateReview({ name })} placeholder="Mārtiņš Ozols" />
              <TextField label="Role" value={item.review.role} onChange={role => updateReview({ role })} placeholder="Founder" />
              <TextField label="Company" value={item.review.company} onChange={company => updateReview({ company })} placeholder="Lumora Skincare" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField label="Brand color" value={item.review.brandColor} onChange={brandColor => updateReview({ brandColor })} />
              <AssetUploadField label="Brand logo" value={item.review.brandLogoUrl} onChange={brandLogoUrl => updateReview({ brandLogoUrl })} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CollaborationsFields({
  items, onAdd, onRemove, onMove, onChange,
}: {
  items: CollaborationInput[]
  onAdd: () => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onChange: (id: string, patch: Partial<CollaborationInput>) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">These become case studies on your profile — the campaigns that prove you deliver results, with optional brand reviews attached.</p>
      {items.length === 0 && <EmptyHint text="No collaborations yet. Add your strongest campaign first." />}
      {items.map((item, index) => (
        <CollaborationCard
          key={item.id} item={item} index={index} total={items.length}
          onRemove={() => onRemove(item.id)} onMoveUp={() => onMove(item.id, -1)} onMoveDown={() => onMove(item.id, 1)}
          onChange={patch => onChange(item.id, patch)}
        />
      ))}
      <AddItemButton label="Add a collaboration" onClick={onAdd} />
    </div>
  )
}

function PartnershipsFields({
  items, onAdd, onRemove, onMove, onChange,
}: {
  items: PartnershipInput[]
  onAdd: () => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onChange: (id: string, patch: Partial<PartnershipInput>) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">Optional — list any exclusive or preferred-partner deals. These show brands what categories are already locked up.</p>
      {items.length === 0 && <EmptyHint text="No partnerships yet. Skip this if you don't have any exclusivity deals." />}
      {items.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <ItemCardHeader title={item.brand || `Partnership ${index + 1}`} index={index} total={items.length} onRemove={() => onRemove(item.id)} onMoveUp={() => onMove(item.id, -1)} onMoveDown={() => onMove(item.id, 1)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Brand" value={item.brand} onChange={brand => onChange(item.id, { brand })} placeholder="Red Bull" />
            <TextField label="Category" value={item.category} onChange={category => onChange(item.id, { category })} placeholder="Energy drinks" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Partner since" value={item.since} onChange={since => onChange(item.id, { since })} placeholder="2023" />
            <TextField label="Deal length" value={item.duration} onChange={duration => onChange(item.id, { duration })} placeholder="Rolling annual contract" />
          </div>
          <div className="mt-4">
            <SwitchField label="Exclusive deal" description="Blocks competing brands in this category." checked={item.exclusive} onChange={exclusive => onChange(item.id, { exclusive })} />
          </div>
          <div className="mt-4">
            <TextField label="Scope" value={item.scope} onChange={scope => onChange(item.id, { scope })} placeholder="Baltic-wide exclusivity" />
          </div>
          <div className="mt-4">
            <TextAreaField label="Description" value={item.description} onChange={description => onChange(item.id, { description })} placeholder="What does this partnership cover?" />
          </div>
          {item.exclusive && (
            <div className="mt-4">
              <TextField label="Blocked category" value={item.blockedCategory} onChange={blockedCategory => onChange(item.id, { blockedCategory })} placeholder="All energy drink & stimulant brands" />
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorField label="Brand color" value={item.color} onChange={color => onChange(item.id, { color })} />
            <AssetUploadField label="Brand logo" value={item.logoUrl} onChange={logoUrl => onChange(item.id, { logoUrl })} />
          </div>
        </div>
      ))}
      <AddItemButton label="Add a partnership" onClick={onAdd} />
    </div>
  )
}

function PricingFields({
  items, onAdd, onRemove, onMove, onChange,
}: {
  items: WorkModelInput[]
  onAdd: () => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onChange: (id: string, patch: Partial<WorkModelInput>) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">The ways brands can work with you, shown as cards on your profile. Most creators list two or three.</p>
      {items.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <ItemCardHeader title={item.name || `Model ${index + 1}`} index={index} total={items.length} onRemove={() => onRemove(item.id)} onMoveUp={() => onMove(item.id, -1)} onMoveDown={() => onMove(item.id, 1)} />
          <IconPickerField label="Icon" value={item.icon} onChange={icon => onChange(item.id, { icon })} options={WORK_ICON_OPTIONS} />
          <div className="mt-4">
            <TextField label="Name" value={item.name} onChange={name => onChange(item.id, { name })} placeholder="Affiliate / Revenue Share" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Price" value={item.price} onChange={price => onChange(item.id, { price })} placeholder="10–20%" />
            <TextField label="Price label" value={item.priceLabel} onChange={priceLabel => onChange(item.id, { priceLabel })} placeholder="per sale" />
          </div>
          <div className="mt-4">
            <TextField label="Short description" value={item.description} onChange={description => onChange(item.id, { description })} placeholder="I only win when you do." />
          </div>
          <div className="mt-4">
            <StringListField label="Features" values={item.features} onChange={features => onChange(item.id, { features })} placeholder="Trackable codes & links" />
          </div>
          <div className="mt-4">
            <SwitchField label="Highlight as most popular" checked={item.popular} onChange={popular => onChange(item.id, { popular })} />
          </div>
        </div>
      ))}
      <AddItemButton label="Add a way to work together" onClick={onAdd} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function StudioPage() {
  const [profile, setProfile] = useState<ProfileFormData>(createInitialProfile)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const [guidedMode, setGuidedMode] = useState(true)
  const [guidedIndex, setGuidedIndex] = useState(0)
  const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set<SectionId>(['basics']))

  const sectionRefs = useRef<Partial<Record<SectionId, HTMLDivElement | null>>>({})

  const currentGuidedSection: SectionId = SECTION_META[guidedIndex]?.id ?? 'basics'

  const isOpen = (id: SectionId) => (guidedMode ? currentGuidedSection === id : openSections.has(id))

  const scrollToSection = (id: SectionId) => {
    requestAnimationFrame(() => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const exitGuided = (openId: SectionId) => {
    setGuidedMode(false)
    setOpenSections(new Set([openId]))
  }

  const toggleSection = (id: SectionId) => {
    if (guidedMode) { exitGuided(id); scrollToSection(id); return }
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectFromNav = (id: SectionId) => {
    if (guidedMode) {
      exitGuided(id)
    } else {
      setOpenSections(prev => new Set(prev).add(id))
    }
    scrollToSection(id)
  }

  const continueGuided = () => {
    const next = guidedIndex + 1
    if (next >= SECTION_META.length) { setGuidedMode(false); setOpenSections(new Set()); return }
    setGuidedIndex(next)
    scrollToSection(SECTION_META[next]?.id ?? 'basics')
  }

  const update = <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const updateBasics = (patch: Partial<BasicsInput>) => update('basics', { ...profile.basics, ...patch })

  const updatePlatform = (key: PlatformKey, patch: Partial<PlatformInput>) =>
    update('platforms', { ...profile.platforms, [key]: { ...profile.platforms[key], ...patch } })

  const togglePlatform = (key: PlatformKey) => {
    const nextConnected = !profile.platforms[key].connected
    updatePlatform(key, { connected: nextConnected })
    if (!nextConnected && profile.primaryPlatform === key) {
      const fallback = PLATFORM_ORDER.find(k => k !== key && profile.platforms[k].connected)
      update('primaryPlatform', fallback ?? key)
    }
  }

  const setPrimaryPlatform = (key: PlatformKey) => update('primaryPlatform', key)
  const updatePlatformHandle = (key: PlatformKey, handle: string) => updatePlatform(key, { handle })

  const updatePlatformStat = (key: PlatformKey, index: number, patch: Partial<PlatformStatInput>) =>
    updatePlatform(key, { stats: profile.platforms[key].stats.map((s, i) => (i === index ? { ...s, ...patch } : s)) })

  const updatePlatformDemo = (key: PlatformKey, patch: Partial<PlatformDemographicsInput>) =>
    updatePlatform(key, { demographics: { ...profile.platforms[key].demographics, ...patch } })

  const addPhoto = async (file: File) => {
    const url = await uploadAsset(file)
    update('photos', [...profile.photos, { id: newId('photo'), url, size: 'small' }])
  }
  const removePhoto = (id: string) => update('photos', profile.photos.filter(p => p.id !== id))
  const setPhotoSize = (id: string, size: PhotoSize) => update('photos', profile.photos.map(p => (p.id === id ? { ...p, size } : p)))

  const addCollaboration = () => update('collaborations', [...profile.collaborations, createCollaboration()])
  const removeCollaboration = (id: string) => update('collaborations', profile.collaborations.filter(c => c.id !== id))
  const moveCollaboration = (id: string, dir: -1 | 1) => update('collaborations', moveById(profile.collaborations, id, dir))
  const changeCollaboration = (id: string, patch: Partial<CollaborationInput>) =>
    update('collaborations', profile.collaborations.map(c => (c.id === id ? { ...c, ...patch } : c)))

  const addPartnership = () => update('partnerships', [...profile.partnerships, createPartnership()])
  const removePartnership = (id: string) => update('partnerships', profile.partnerships.filter(p => p.id !== id))
  const movePartnership = (id: string, dir: -1 | 1) => update('partnerships', moveById(profile.partnerships, id, dir))
  const changePartnership = (id: string, patch: Partial<PartnershipInput>) =>
    update('partnerships', profile.partnerships.map(p => (p.id === id ? { ...p, ...patch } : p)))

  const addWorkModel = () => update('workModels', [...profile.workModels, createWorkModel()])
  const removeWorkModel = (id: string) => update('workModels', profile.workModels.filter(m => m.id !== id))
  const moveWorkModel = (id: string, dir: -1 | 1) => update('workModels', moveById(profile.workModels, id, dir))
  const changeWorkModel = (id: string, patch: Partial<WorkModelInput>) =>
    update('workModels', profile.workModels.map(m => (m.id === id ? { ...m, ...patch } : m)))

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${API}/studio/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
    } catch {
      // offline or backend unreachable — the draft stays safe in local state
    } finally {
      setSaving(false)
      setDirty(false)
      setLastSavedAt(new Date())
    }
  }

  const statuses: Record<SectionId, SectionStatus> = {
    basics: computeStatus(profile, 'basics'),
    platforms: computeStatus(profile, 'platforms'),
    portfolio: computeStatus(profile, 'portfolio'),
    collaborations: computeStatus(profile, 'collaborations'),
    partnerships: computeStatus(profile, 'partnerships'),
    pricing: computeStatus(profile, 'pricing'),
  }

  const registerRef = (id: SectionId) => (el: HTMLDivElement | null) => { sectionRefs.current[id] = el }

  const continueFooter = guidedMode ? (
    <button
      type="button" onClick={continueGuided}
      className={`rounded-lg ${GRAD_BTN} px-6 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}
    >
      {guidedIndex >= SECTION_META.length - 1 ? 'Finish setup' : 'Save & continue'}
    </button>
  ) : undefined

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">
      <StudioTopBar dirty={dirty} saving={saving} lastSavedAt={lastSavedAt} onSave={() => void handleSave()} previewHref="/c/preview" />
      <MobileSectionNav activeId={guidedMode ? currentGuidedSection : null} statuses={statuses} onSelect={selectFromNav} />

      <div className="mx-auto flex max-w-[1180px] gap-6 px-4 py-8 pb-24 sm:px-6 lg:py-10 lg:pb-10">
        <Sidebar activeId={guidedMode ? currentGuidedSection : null} statuses={statuses} onSelect={selectFromNav} />

        <main className="min-w-0 flex-1 space-y-5">
          {guidedMode && <GuidedBanner index={guidedIndex} total={SECTION_META.length} onExit={() => exitGuided(currentGuidedSection)} />}

          <AccordionSection
            icon={<IconUser s={20} />} title="Profile basics" description="Name, photo, bio and location"
            status={statuses.basics} isOpen={isOpen('basics')} onToggle={() => toggleSection('basics')} registerRef={registerRef('basics')}
            footer={currentGuidedSection === 'basics' ? continueFooter : undefined}
          >
            <BasicsFields value={profile.basics} onChange={updateBasics} />
          </AccordionSection>

          <AccordionSection
            icon={<IconLayers s={20} />} title="Platforms & audience" description="Stats and demographics per platform"
            status={statuses.platforms} isOpen={isOpen('platforms')} onToggle={() => toggleSection('platforms')} registerRef={registerRef('platforms')}
            footer={currentGuidedSection === 'platforms' ? continueFooter : undefined}
          >
            <PlatformsFields
              platforms={profile.platforms} primaryPlatform={profile.primaryPlatform}
              onToggle={togglePlatform} onSetPrimary={setPrimaryPlatform} onHandleChange={updatePlatformHandle}
              onStatChange={updatePlatformStat} onDemoChange={updatePlatformDemo}
            />
          </AccordionSection>

          <AccordionSection
            icon={<IconGrid s={20} />} title="Portfolio" description="Photos and reels that show your work"
            status={statuses.portfolio} isOpen={isOpen('portfolio')} onToggle={() => toggleSection('portfolio')} registerRef={registerRef('portfolio')}
            footer={currentGuidedSection === 'portfolio' ? continueFooter : undefined}
          >
            <PortfolioFields photos={profile.photos} onAdd={addPhoto} onRemove={removePhoto} onSizeChange={setPhotoSize} />
          </AccordionSection>

          <AccordionSection
            icon={<IconStarBurst s={20} />} title="Collaborations" description="Past campaigns and brand reviews"
            status={statuses.collaborations} isOpen={isOpen('collaborations')} onToggle={() => toggleSection('collaborations')} registerRef={registerRef('collaborations')}
            footer={currentGuidedSection === 'collaborations' ? continueFooter : undefined}
          >
            <CollaborationsFields items={profile.collaborations} onAdd={addCollaboration} onRemove={removeCollaboration} onMove={moveCollaboration} onChange={changeCollaboration} />
          </AccordionSection>

          <AccordionSection
            icon={<IconShieldSmall s={20} />} title="Partnerships" description="Exclusive or preferred brand deals"
            status={statuses.partnerships} isOpen={isOpen('partnerships')} onToggle={() => toggleSection('partnerships')} registerRef={registerRef('partnerships')}
            footer={currentGuidedSection === 'partnerships' ? continueFooter : undefined}
          >
            <PartnershipsFields items={profile.partnerships} onAdd={addPartnership} onRemove={removePartnership} onMove={movePartnership} onChange={changePartnership} />
          </AccordionSection>

          <AccordionSection
            icon={<IconTag s={20} />} title="Ways to work together" description="Your collaboration models & pricing"
            status={statuses.pricing} isOpen={isOpen('pricing')} onToggle={() => toggleSection('pricing')} registerRef={registerRef('pricing')}
            footer={currentGuidedSection === 'pricing' ? continueFooter : undefined}
          >
            <PricingFields items={profile.workModels} onAdd={addWorkModel} onRemove={removeWorkModel} onMove={moveWorkModel} onChange={changeWorkModel} />
          </AccordionSection>
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <span className="text-[12px] font-semibold text-ink/45">{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'All changes saved'}</span>
        <button
          type="button" onClick={() => void handleSave()} disabled={saving || !dirty}
          className={`rounded-lg ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-40`}
        >
          Save
        </button>
      </div>
    </div>
  )
}