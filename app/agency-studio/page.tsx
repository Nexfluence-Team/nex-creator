'use client'

/* ════════════════════════════════════════════════════════════════════
   Agency Studio — app/studio/agency/page.tsx  (Nexfluence v4)
   ════════════════════════════════════════════════════════════════════
   MOCK MODE: no backend required.
   • Save = 650ms simulated delay, always succeeds.
   • uploadAsset = URL.createObjectURL — local preview only, lost on refresh.
   • All form state lives in React state only.

   STRUCTURAL ALIGNMENT WITH BRAND + CREATOR STUDIO:
   • VISITED_KEY = 'nex_agency_studio_visited'
   • Same SSR-safe hydration / guided → free-edit architecture
   • Per-section dirty flags + per-section save buttons
   • Unsaved-changes guard blocks nav if activeSection is dirty
   • TopBar shows currentIsDirty (not global dirty)
   • GuidedBanner "Edit freely" exits wizard
   • Mobile save bar: wizard mode only
   • Dashboard link → /dashboard/agency
   • All field atoms (TF, TA, SF, SW, etc.) identical API surface

   AGENCY-SPECIFIC SECTIONS (7):
   1. agency_basics    — Name, logo, cover, HQ, markets, bio, team size, founded, website, specialisms
   2. services         — 6 service cards (campaign mgmt, creator matching, etc.) each with enable + stats
   3. brand_portfolio  — Brands worked with (logo, name, category, campaigns, note)
   4. creator_roster   — Creators represented (handle, platform, followers, niche, exclusive flag)
   5. results          — Campaign case studies (brand + creator dual-attribution, metrics, insight)
   6. testimonials     — Reviews from brands OR creators (type toggle, quote, rating, avatar, color)
   7. engagement_models— How to hire (retainer, project, performance — icon, price, features, popular)
   ════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, type ReactNode } from 'react'

const VISITED_KEY = 'nex_agency_studio_visited'
const CARD        = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN    = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type SectionId     = 'agency_basics' | 'services' | 'brand_portfolio' | 'creator_roster' | 'results' | 'testimonials' | 'engagement_models'
type SectionStatus = 'empty' | 'partial' | 'done'
type ServiceKey    = 'campaign_mgmt' | 'creator_matching' | 'content_production' | 'paid_amplification' | 'analytics' | 'brand_strategy'
type WorkIconKey   = 'shield' | 'zap' | 'handshake'
type MetricIconKey = 'eye' | 'heart' | 'cart' | 'share' | 'users' | 'message'
type ReviewerType  = 'brand' | 'creator'

interface ServiceStatInput    { value: string; label: string }
interface ServiceInput        { key: ServiceKey; enabled: boolean; description: string; stats: ServiceStatInput[] }

interface BrandPortfolioItemInput {
  id: string; name: string; category: string; logoUrl: string; color: string
  campaignCount: string; note: string
}
interface CreatorRosterItemInput  {
  id: string; name: string; handle: string; platform: string; followers: string
  niche: string; exclusive: boolean; avatarUrl: string; color: string
}
interface ResultMetricInput       { icon: MetricIconKey; label: string; value: string }
interface ResultInput             {
  id: string; brand: string; creator: string; title: string; objective: string
  description: string; result: string; videoUrl: string; insight: string
  metrics: ResultMetricInput[]
}
interface TestimonialInput        {
  id: string; reviewerType: ReviewerType; name: string; role: string
  company: string; handle: string; niche: string; quote: string
  rating: number; date: string; avatarUrl: string; color: string
}
interface EngagementModelInput    {
  id: string; name: string; price: string; priceLabel: string
  icon: WorkIconKey; description: string; features: string[]; popular: boolean
}
interface AgencyBasicsInput       {
  name: string; hq: string; bio: string; markets: string[]
  teamSize: string; founded: string; websiteUrl: string
  specialisms: string[]; logoUrl: string; coverUrl: string
}

interface AgencyProfileFormData {
  basics:           AgencyBasicsInput
  services:         ServiceInput[]
  brandPortfolio:   BrandPortfolioItemInput[]
  creatorRoster:    CreatorRosterItemInput[]
  results:          ResultInput[]
  testimonials:     TestimonialInput[]
  engagementModels: EngagementModelInput[]
}

/* ════════════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════════════ */
const SERVICE_META: Record<ServiceKey, { label: string; tagline: string; icon: ReactNode }> = {
  campaign_mgmt:      { label: 'Campaign management',    tagline: 'End-to-end campaign planning and execution',           icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  creator_matching:   { label: 'Creator matching',       tagline: 'Finding the right creators for your brand',            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  content_production: { label: 'Content production',     tagline: 'Scripting, directing, and post-production support',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  paid_amplification: { label: 'Paid amplification',     tagline: 'Boosting organic content with paid media spend',       icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  analytics:          { label: 'Analytics & reporting',  tagline: 'Performance dashboards and attribution reporting',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M2 20h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
  brand_strategy:     { label: 'Brand strategy',         tagline: 'Long-term influencer strategy and positioning advice',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg> },
}

const SERVICE_STAT_PRESETS: Record<ServiceKey, ServiceStatInput[]> = {
  campaign_mgmt:      [{ value: '', label: 'Campaigns managed' }, { value: '', label: 'Avg campaign ROI' }, { value: '', label: 'Brands served' }],
  creator_matching:   [{ value: '', label: 'Creators placed'   }, { value: '', label: 'Match success rate' }, { value: '', label: 'Niches covered' }],
  content_production: [{ value: '', label: 'Content pieces'    }, { value: '', label: 'Platforms covered' }, { value: '', label: 'Avg turnaround' }],
  paid_amplification: [{ value: '', label: 'Ad spend managed'  }, { value: '', label: 'Avg ROAS'          }, { value: '', label: 'Boosted campaigns' }],
  analytics:          [{ value: '', label: 'Reports delivered' }, { value: '', label: 'KPIs tracked'       }, { value: '', label: 'Data sources' }],
  brand_strategy:     [{ value: '', label: 'Strategy engagements' }, { value: '', label: 'Brands retained' }, { value: '', label: 'Avg engagement lift' }],
}

const SERVICE_ORDER: ServiceKey[] = ['campaign_mgmt', 'creator_matching', 'content_production', 'paid_amplification', 'analytics', 'brand_strategy']

const SECTION_META: { id: SectionId; label: string; description: string; icon: ReactNode }[] = [
  { id: 'agency_basics',     label: 'Agency basics',          description: 'Name, logo, bio, markets and specialisms',        icon: <IcBriefcase s={18}/> },
  { id: 'services',          label: 'Services',               description: 'What your agency offers and key stats',           icon: <IcLayers s={18}/>    },
  { id: 'brand_portfolio',   label: 'Brand portfolio',        description: 'Brands you have worked with',                     icon: <IcGrid s={18}/>      },
  { id: 'creator_roster',    label: 'Creator roster',         description: 'Creators you represent or manage',                icon: <IcUsers s={18}/>     },
  { id: 'results',           label: 'Results',                description: 'Campaign case studies with proof of performance', icon: <IcBarChart s={18}/>  },
  { id: 'testimonials',      label: 'Testimonials',           description: 'Reviews from brands and creators',                icon: <IcStar s={18}/>      },
  { id: 'engagement_models', label: 'Engagement models',      description: 'How brands can hire your agency',                 icon: <IcTag s={18}/>       },
]

const METRIC_ICON_OPTIONS: { key: MetricIconKey; label: string }[] = [
  { key: 'eye', label: 'Views' }, { key: 'heart', label: 'Engagement' },
  { key: 'cart', label: 'Conversions' }, { key: 'share', label: 'Shares' },
  { key: 'users', label: 'Followers' }, { key: 'message', label: 'Reach' },
]

const WORK_ICON_OPTIONS: { key: WorkIconKey; label: string; el: ReactNode }[] = [
  { key: 'shield',    label: 'Shield',    el: <IcShield s={20}/>    },
  { key: 'zap',       label: 'Lightning', el: <IcZap s={20}/>       },
  { key: 'handshake', label: 'Handshake', el: <IcHandshake s={20}/> },
]

/* ════════════════════════════════════════════════════════════════════
   FACTORIES
   ════════════════════════════════════════════════════════════════════ */
let _uid = 0
const newId = (p: string) => `${p}_${++_uid}`
const mockDelay = (ms = 650) => new Promise(r => setTimeout(r, ms))
async function uploadAsset(file: File): Promise<string> { return URL.createObjectURL(file) }

function moveById<T extends { id: string }>(list: T[], id: string, dir: -1|1): T[] {
  const i = list.findIndex(x => x.id === id); if (i === -1) return list
  const j = i + dir; if (j < 0 || j >= list.length) return list
  const copy = [...list]; [copy[i], copy[j]] = [copy[j]!, copy[i]!]; return copy
}

const mkBrandItem    = (): BrandPortfolioItemInput  => ({ id: newId('b'), name: '', category: '', logoUrl: '', color: '#8B31E8', campaignCount: '', note: '' })
const mkCreatorItem  = (): CreatorRosterItemInput   => ({ id: newId('c'), name: '', handle: '', platform: 'Instagram', followers: '', niche: '', exclusive: false, avatarUrl: '', color: '#8B31E8' })
const mkResultMetrics= (): ResultMetricInput[]       => [{ icon: 'eye', label: 'Reach', value: '' }, { icon: 'heart', label: 'Engagement', value: '' }, { icon: 'cart', label: 'ROAS', value: '' }, { icon: 'share', label: 'Shares', value: '' }]
const mkResult       = (): ResultInput              => ({ id: newId('r'), brand: '', creator: '', title: '', objective: '', description: '', result: '', videoUrl: '', insight: '', metrics: mkResultMetrics() })
const mkTestimonial  = (): TestimonialInput         => ({ id: newId('t'), reviewerType: 'brand', name: '', role: '', company: '', handle: '', niche: '', quote: '', rating: 5, date: '', avatarUrl: '', color: '#8B31E8' })
const mkModel        = (): EngagementModelInput     => ({ id: newId('m'), name: '', price: '', priceLabel: '', icon: 'shield', description: '', features: [''], popular: false })

function defaultServices(): ServiceInput[] {
  return SERVICE_ORDER.map(key => ({ key, enabled: false, description: '', stats: SERVICE_STAT_PRESETS[key].map(s => ({ ...s })) }))
}

function defaultEngagementModels(): EngagementModelInput[] {
  return [
    { id: newId('m'), name: 'Monthly Retainer', price: '', priceLabel: '/month', icon: 'shield',
      description: 'Ongoing partnership — we handle everything from strategy to execution.',
      features: ['Dedicated account manager', 'Monthly campaign calendar', 'Unlimited creator briefs', 'Weekly performance reports'], popular: true },
    { id: newId('m'), name: 'Project-Based', price: '', priceLabel: '/project', icon: 'zap',
      description: 'One campaign, clearly scoped, fixed price.',
      features: ['Single campaign scope', 'Creator selection + briefing', 'Full campaign execution', 'Final results report'], popular: false },
    { id: newId('m'), name: 'Performance Fee', price: '', priceLabel: '% of sales', icon: 'handshake',
      description: "We only earn when your campaign delivers.",
      features: ['No upfront agency fee', 'Pay on results only', 'Aligned incentives', 'Minimum campaign spend applies'], popular: false },
  ]
}

function createInitialProfile(): AgencyProfileFormData {
  return {
    basics: { name: '', hq: 'Riga, Latvia', bio: '', markets: ['Latvia', 'Lithuania', 'Estonia'], teamSize: '', founded: '', websiteUrl: '', specialisms: [], logoUrl: '', coverUrl: '' },
    services:          defaultServices(),
    brandPortfolio:    [],
    creatorRoster:     [],
    results:           [],
    testimonials:      [],
    engagementModels:  defaultEngagementModels(),
  }
}

function computeStatus(p: AgencyProfileFormData, id: SectionId): SectionStatus {
  switch (id) {
    case 'agency_basics':     return p.basics.name.trim() && p.basics.bio.trim() ? 'done' : p.basics.name.trim() ? 'partial' : 'empty'
    case 'services': {
      const on = p.services.filter(s => s.enabled)
      if (!on.length) return 'empty'
      return on.some(s => s.stats.some(st => st.value.trim())) ? 'done' : 'partial'
    }
    case 'brand_portfolio':   return p.brandPortfolio.length >= 2 ? 'done' : p.brandPortfolio.length ? 'partial' : 'empty'
    case 'creator_roster':    return p.creatorRoster.length >= 3  ? 'done' : p.creatorRoster.length  ? 'partial' : 'empty'
    case 'results':           return p.results.length > 0 && p.results.some(r => r.title.trim()) ? 'done' : 'empty'
    case 'testimonials':      return p.testimonials.length > 0 && p.testimonials.some(t => t.quote.trim()) ? 'done' : 'empty'
    case 'engagement_models': return p.engagementModels.some(m => m.name.trim() && m.price.trim()) ? 'done' : 'partial'
    default:                  return 'empty'
  }
}

/* ════════════════════════════════════════════════════════════════════
   ICONS  (inline SVG only — same rule as brand + creator studio)
   ════════════════════════════════════════════════════════════════════ */
function IcCheck({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcChevron({ s = 16, open }: { s?: number; open: boolean }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcBriefcase({ s = 20 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M12 12v3M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function IcLayers({ s = 20 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M3 13l9 5 9-5M3 17.5l9 5 9-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcGrid({ s = 20 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="3" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7"/><rect x="3" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7"/><rect x="13" y="13" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.7"/></svg> }
function IcUsers({ s = 20 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function IcBarChart({ s = 20 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M2 20h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function IcStar({ s = 20 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> }
function IcStarFilled({ s = 22 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z"/></svg> }
function IcTag({ s = 20 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11.5 3H5a2 2 0 00-2 2v6.5a2 2 0 00.6 1.4l9 9a2 2 0 002.8 0l6.5-6.5a2 2 0 000-2.8l-9-9a2 2 0 00-1.4-.6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><circle cx="8" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.5"/></svg> }
function IcShield({ s = 22 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcZap({ s = 22 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcHandshake({ s = 22 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcTrash({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-9 0l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcArrowUp({ s = 14 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcArrowDown({ s = 14 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcPlus({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function IcEye({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function IcHeart({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcCart({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function IcShare({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function IcMessage({ s = 16 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }

function MetricIcon({ icon, s = 16 }: { icon: MetricIconKey; s?: number }) {
  switch (icon) {
    case 'eye':     return <IcEye s={s}/>
    case 'heart':   return <IcHeart s={s}/>
    case 'cart':    return <IcCart s={s}/>
    case 'share':   return <IcShare s={s}/>
    case 'users':   return <IcUsers s={s}/>
    case 'message': return <IcMessage s={s}/>
  }
}
function WorkIcon({ icon, s = 22 }: { icon: WorkIconKey; s?: number }) {
  switch (icon) { case 'shield': return <IcShield s={s}/>; case 'zap': return <IcZap s={s}/>; case 'handshake': return <IcHandshake s={s}/> }
}

/* ════════════════════════════════════════════════════════════════════
   FIELD ATOMS — identical API surface to brand + creator studio
   ════════════════════════════════════════════════════════════════════ */
const base = 'rounded-lg border border-primary/12 bg-surface-sub px-4 py-3 font-rubik text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30'
const iCls = `${base} w-full`
const tCls = `${iCls} min-h-[100px] resize-y leading-relaxed`

function FL({ children, hint }: { children: ReactNode; hint?: string }) {
  return <label className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/50"><span>{children}</span>{hint && <span className="normal-case tracking-normal text-ink/30">{hint}</span>}</label>
}
function TF({ label, value, onChange, placeholder, hint, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; type?: string }) {
  return <div><FL hint={hint}>{label}</FL><input className={iCls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}/></div>
}
function TA({ label, value, onChange, placeholder, maxLength }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return <div><FL hint={maxLength ? `${value.length}/${maxLength}` : undefined}>{label}</FL><textarea className={tCls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}/></div>
}
function SF({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <div><FL>{label}</FL><select className={iCls} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
}
function SW({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/10 bg-white px-4 py-3.5">
      <div><div className="text-[13px] font-bold text-ink">{label}</div>{description && <div className="mt-0.5 text-[12px] text-ink/50">{description}</div>}</div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${checked ? GRAD_BTN : 'bg-ink/15'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
      </button>
    </div>
  )
}
function TagInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const commit = () => { const v = draft.trim(); if (v && !values.includes(v)) onChange([...values, v]); setDraft('') }
  return (
    <div><FL>{label}</FL>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/12 bg-surface-sub px-3 py-2.5 focus-within:border-primary focus-within:bg-white">
        {values.map(v => (<span key={v} className="flex items-center gap-1.5 rounded-md border border-primary/15 bg-white px-2.5 py-1 text-[12.5px] font-semibold text-primary">{v}<button type="button" onClick={() => onChange(values.filter(x => x !== v))} className="text-primary/50 hover:text-primary">✕</button></span>))}
        <input className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-ink outline-none placeholder:text-ink/30" value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() } if (e.key === 'Backspace' && !draft) onChange(values.slice(0, -1)) }} onBlur={commit}/>
      </div>
    </div>
  )
}
function StrList({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div><FL>{label}</FL>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={`${base} min-w-0 flex-1`} value={v} onChange={e => onChange(values.map((x, j) => j === i ? e.target.value : x))} placeholder={placeholder}/>
            <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:border-red-200 hover:text-red-500">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...values, ''])} className="text-[12.5px] font-bold text-primary hover:underline">+ Add line</button>
      </div>
    </div>
  )
}
function AssetUpload({ label, value, onChange, aspect = 'square', hint }: { label: string; value: string; onChange: (url: string) => void; aspect?: 'square' | 'wide'; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null); const [busy, setBusy] = useState(false)
  const handle = async (file: File) => { setBusy(true); try { onChange(await uploadAsset(file)) } finally { setBusy(false) } }
  return (
    <div><FL hint={hint}>{label}</FL>
      <div className="flex items-center gap-4">
        <div className={`relative overflow-hidden rounded-xl border border-primary/12 bg-white ${aspect === 'wide' ? 'h-20 w-36' : 'h-20 w-20'}`}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover"/> : <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/30">Empty</span>}
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-[10px] font-semibold text-primary">Uploading…</div>}
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => ref.current?.click()} className="rounded-lg border border-primary/20 bg-white px-4 py-2 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.05]">{value ? 'Replace' : 'Upload'}</button>
          {value && <button type="button" onClick={() => onChange('')} className="text-[12px] font-semibold text-ink/40 hover:text-red-500">Remove</button>}
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = '' }}/>
      </div>
    </div>
  )
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div><FL>{label}</FL>
      <div className="flex items-center gap-2.5 rounded-lg border border-primary/12 bg-surface-sub px-3 py-2">
        <input type="color" value={value || '#8B31E8'} onChange={e => onChange(e.target.value)} className="h-8 w-9 cursor-pointer rounded border border-primary/15 bg-transparent"/>
        <input className="flex-1 bg-transparent font-rubik text-sm text-ink outline-none" value={value} onChange={e => onChange(e.target.value)} placeholder="#8B31E8"/>
      </div>
    </div>
  )
}
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className={n <= value ? 'text-primary' : 'text-ink/15'}><IcStarFilled s={22}/></button>
      ))}
    </div>
  )
}
function IconPicker<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { key: T; label: string; el: ReactNode }[] }) {
  return (
    <div><FL>{label}</FL>
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
   LAYOUT ATOMS
   ════════════════════════════════════════════════════════════════════ */
function StatusPill({ status }: { status: SectionStatus }) {
  if (status === 'done')    return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600"><IcCheck s={11}/> Complete</span>
  if (status === 'partial') return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500"><span className="h-1.5 w-1.5 rounded-full bg-amber-400"/> In progress</span>
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink/35"><span className="h-1.5 w-1.5 rounded-full bg-ink/20"/> Not started</span>
}

function CardHeader({ title, index, total, onRemove, onUp, onDown }: { title: string; index: number; total: number; onRemove: () => void; onUp: () => void; onDown: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <span className="truncate text-[13px] font-extrabold text-ink">{title}</span>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <button type="button" onClick={onUp}     disabled={index === 0}         className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:text-primary disabled:opacity-30"><IcArrowUp/></button>
        <button type="button" onClick={onDown}   disabled={index === total - 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:text-primary disabled:opacity-30"><IcArrowDown/></button>
        <button type="button" onClick={onRemove}                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/40 transition hover:border-red-200 hover:text-red-500"><IcTrash/></button>
      </div>
    </div>
  )
}
function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-white py-3.5 text-[13px] font-bold text-primary transition hover:border-primary/40 hover:bg-primary/[0.04]">
      <IcPlus s={15}/>{label}
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
          <span className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-extrabold tracking-[-0.01em] text-ink">{title}</span><StatusPill status={status}/></span>
          <span className="mt-0.5 block truncate text-[12.5px] text-ink/50">{description}</span>
        </span>
        <IcChevron open={isOpen}/>
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

function Sidebar({ activeId, statuses, onSelect }: { activeId: SectionId | null; statuses: Record<SectionId, SectionStatus>; onSelect: (id: SectionId) => void }) {
  const done = SECTION_META.filter(s => statuses[s.id] === 'done').length
  return (
    <div className={`sticky top-24 hidden w-[252px] flex-shrink-0 self-start rounded-2xl border border-primary/10 bg-white p-4 lg:block ${CARD}`}>
      <div className="mb-3 px-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40"><span>Profile setup</span><span>{done}/{SECTION_META.length}</span></div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sub"><div className={`h-full ${GRAD_BTN}`} style={{ width: `${(done / SECTION_META.length) * 100}%` }}/></div>
      </div>
      <div className="space-y-0.5">
        {SECTION_META.map(s => (
          <button key={s.id} type="button" onClick={() => onSelect(s.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-primary/[0.06] ${activeId === s.id ? 'bg-primary/[0.08]' : ''}`}>
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${activeId === s.id ? `${GRAD_BTN} text-white` : 'bg-surface-sub text-primary'}`}>{s.icon}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-bold text-ink">{s.label}</span><StatusPill status={statuses[s.id]}/></span>
          </button>
        ))}
      </div>
    </div>
  )
}

function MobileNav({ activeId, statuses, onSelect }: { activeId: SectionId | null; statuses: Record<SectionId, SectionStatus>; onSelect: (id: SectionId) => void }) {
  return (
    <div className="sticky top-[57px] z-30 flex gap-2 overflow-x-auto border-b border-primary/10 bg-canvas/95 px-4 py-3 backdrop-blur-md lg:hidden">
      {SECTION_META.map(s => (
        <button key={s.id} type="button" onClick={() => onSelect(s.id)}
          className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-2 text-[12px] font-bold transition ${activeId === s.id ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>
          {statuses[s.id] === 'done' && <IcCheck s={11}/>}{s.label}
        </button>
      ))}
    </div>
  )
}

function TopBar({ dirty, saving, lastSaved, onSave }: { dirty: boolean; saving: boolean; lastSaved: Date | null; onSave: () => void }) {
  const status = saving ? 'Saving…' : dirty ? 'Unsaved changes' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not saved yet'
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <img src="/Nex.webp" alt="Nexfluence" className="h-7 w-auto"/>
          <span className="hidden text-[13px] font-bold text-ink/30 sm:inline">/</span>
          <span className="hidden text-[13px] font-bold text-ink/60 sm:inline">Agency Studio</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="hidden text-[12px] text-ink/40 sm:inline">{status}</span>
          <a href="/dashboard/agency" className="hidden items-center gap-1.5 rounded-lg border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-bold text-ink/60 transition hover:bg-surface-sub hover:text-ink sm:flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>
            Dashboard
          </a>
          <a href="/agency/preview" target="_blank" rel="noopener noreferrer" className="hidden rounded-lg border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.05] sm:inline-block">Preview</a>
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
        <p className="text-[13.5px] font-extrabold text-ink">Step {index + 1} of {total} — let&apos;s build your agency profile</p>
        <p className="mt-0.5 text-[12.5px] text-ink/55">Fill in one section at a time. Jump anywhere, or edit freely whenever you&apos;re ready.</p>
      </div>
      <button type="button" onClick={onExit} className="flex-shrink-0 text-[12.5px] font-bold text-primary hover:underline">Edit freely</button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SECTION FIELD BLOCKS
   ════════════════════════════════════════════════════════════════════ */

/* ── 1. Agency Basics ── */
function AgencyBasicsSection({ value, onChange }: { value: AgencyBasicsInput; onChange: (p: Partial<AgencyBasicsInput>) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AssetUpload label="Agency logo" value={value.logoUrl} onChange={url => onChange({ logoUrl: url })} hint="Square, 400×400px+"/>
        <AssetUpload label="Cover image" value={value.coverUrl} onChange={url => onChange({ coverUrl: url })} aspect="wide" hint="1600×500px+"/>
      </div>
      <TF label="Agency name" value={value.name} onChange={name => onChange({ name })} placeholder="Baltic Creators Agency"/>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TF label="Headquarters" value={value.hq}        onChange={hq        => onChange({ hq })}        placeholder="Riga, Latvia"/>
        <TF label="Founded"      value={value.founded}   onChange={founded   => onChange({ founded })}   placeholder="2018"/>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TF label="Team size"    value={value.teamSize}  onChange={teamSize  => onChange({ teamSize })}  placeholder="12"/>
        <TF label="Website"      value={value.websiteUrl}onChange={websiteUrl=> onChange({ websiteUrl })}placeholder="https://yoursite.com" type="url"/>
      </div>
      <TA  label="About the agency" value={value.bio} onChange={bio => onChange({ bio })} placeholder="Tell brands and creators who you are, which markets you operate in, and what makes your agency different." maxLength={500}/>
      <TagInput label="Markets served" values={value.markets}    onChange={markets    => onChange({ markets })}    placeholder="Type a market and press Enter"/>
      <TagInput label="Specialisms"    values={value.specialisms}onChange={specialisms=> onChange({ specialisms })}placeholder="Type a specialism and press Enter"/>
    </div>
  )
}

/* ── 2. Services ── */
function ServicesSection({ services, onChange }: {
  services: ServiceInput[]
  onChange: (updated: ServiceInput[]) => void
}) {
  const updService = (key: ServiceKey, patch: Partial<ServiceInput>) =>
    onChange(services.map(s => s.key === key ? { ...s, ...patch } : s))
  const updStat = (key: ServiceKey, i: number, val: string) =>
    onChange(services.map(s => s.key === key ? { ...s, stats: s.stats.map((st, idx) => idx === i ? { ...st, value: val } : st) } : s))

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">Enable the services your agency offers. Add headline stats to each to build credibility — e.g. "200+ campaigns managed".</p>
      {services.map(svc => {
        const meta = SERVICE_META[svc.key]
        return (
          <div key={svc.key} className={`overflow-hidden rounded-2xl border transition ${svc.enabled ? 'border-primary/20 bg-white' : 'border-primary/8 bg-surface-sub/50'}`}>
            {/* Service header row */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition ${svc.enabled ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/12 bg-surface-sub text-primary'}`}>
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-extrabold text-ink">{meta.label}</p>
                <p className="text-[12px] text-ink/45">{meta.tagline}</p>
              </div>
              <button type="button" role="switch" aria-checked={svc.enabled} onClick={() => updService(svc.key, { enabled: !svc.enabled })}
                className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${svc.enabled ? GRAD_BTN : 'bg-ink/15'}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${svc.enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
              </button>
            </div>

            {/* Expanded form — only when enabled */}
            {svc.enabled && (
              <div className="border-t border-primary/8 px-5 pb-5 pt-4 space-y-4">
                <TA label="Description" value={svc.description} onChange={v => updService(svc.key, { description: v })} placeholder={`Describe how you deliver ${meta.label.toLowerCase()} for your clients.`} maxLength={280}/>
                <div>
                  <FL>Headline stats <span className="normal-case font-normal tracking-normal text-ink/30">(shown on your profile)</span></FL>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {svc.stats.map((stat, i) => (
                      <div key={i} className="rounded-xl border border-primary/10 bg-surface-sub/60 p-3">
                        <input className={iCls} value={stat.value} onChange={e => updStat(svc.key, i, e.target.value)} placeholder="200+"/>
                        <p className="mt-1.5 truncate text-[11px] font-semibold text-ink/40">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── 3. Brand Portfolio ── */
function BrandPortfolioSection({ items, onAdd, onRemove, onMove, onChange }: {
  items: BrandPortfolioItemInput[]; onAdd: () => void; onRemove: (id: string) => void
  onMove: (id: string, d: -1|1) => void; onChange: (id: string, p: Partial<BrandPortfolioItemInput>) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">Showcase the brands you have worked with. Brands on Creator Nexus will recognise these names and it builds immediate trust.</p>
      {items.length === 0 && <EmptyHint text="No brands yet. Add your most recognisable client first."/>}
      {items.map((item, i) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <CardHeader title={item.name || `Brand ${i + 1}`} index={i} total={items.length}
            onRemove={() => onRemove(item.id)} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)}/>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Brand name" value={item.name}     onChange={v => onChange(item.id, { name: v })}     placeholder="Kinetics"/>
            <TF label="Category"   value={item.category} onChange={v => onChange(item.id, { category: v })} placeholder="Sports nutrition"/>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Campaigns run" value={item.campaignCount} onChange={v => onChange(item.id, { campaignCount: v })} placeholder="8"/>
            <TF label="Headline note" value={item.note}          onChange={v => onChange(item.id, { note: v })}          placeholder="Baltic market launch — 3.2x ROAS"/>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorField  label="Brand colour" value={item.color}   onChange={v => onChange(item.id, { color: v })}/>
            <AssetUpload label="Brand logo"   value={item.logoUrl} onChange={v => onChange(item.id, { logoUrl: v })} hint="Square logo preferred"/>
          </div>
        </div>
      ))}
      <AddBtn label="Add a brand" onClick={onAdd}/>
    </div>
  )
}

/* ── 4. Creator Roster ── */
function CreatorRosterSection({ items, onAdd, onRemove, onMove, onChange }: {
  items: CreatorRosterItemInput[]; onAdd: () => void; onRemove: (id: string) => void
  onMove: (id: string, d: -1|1) => void; onChange: (id: string, p: Partial<CreatorRosterItemInput>) => void
}) {
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Snapchat', 'Twitter', 'LinkedIn', 'Facebook']
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">List the creators you represent or actively manage. Brands can see who's in your roster when evaluating your agency.</p>
      {items.length === 0 && <EmptyHint text="No creators yet. Add your headline creator first."/>}
      {items.map((item, i) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <CardHeader title={item.name ? `${item.name} ${item.handle}` : `Creator ${i + 1}`} index={i} total={items.length}
            onRemove={() => onRemove(item.id)} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)}/>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Full name" value={item.name}   onChange={v => onChange(item.id, { name: v })}   placeholder="Amelia Roze"/>
            <TF label="Handle"    value={item.handle} onChange={v => onChange(item.id, { handle: v })} placeholder="@amelia.roze"/>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SF label="Primary platform" value={item.platform} onChange={v => onChange(item.id, { platform: v })} options={PLATFORMS.map(p => ({ value: p, label: p }))}/>
            <TF label="Followers"        value={item.followers}onChange={v => onChange(item.id, { followers: v })}placeholder="142K"/>
            <TF label="Niche"            value={item.niche}    onChange={v => onChange(item.id, { niche: v })}    placeholder="Fitness & wellness"/>
          </div>
          <div className="mt-4"><SW label="Exclusive contract" description="This creator is exclusively represented by your agency." checked={item.exclusive} onChange={v => onChange(item.id, { exclusive: v })}/></div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorField  label="Accent colour"  value={item.color}     onChange={v => onChange(item.id, { color: v })}/>
            <AssetUpload label="Creator photo"  value={item.avatarUrl} onChange={v => onChange(item.id, { avatarUrl: v })} hint="Optional — falls back to initials"/>
          </div>
        </div>
      ))}
      <AddBtn label="Add a creator to roster" onClick={onAdd}/>
    </div>
  )
}

/* ── 5. Results ── */
function ResultsSection({ items, onAdd, onRemove, onMove, onChange }: {
  items: ResultInput[]; onAdd: () => void; onRemove: (id: string) => void
  onMove: (id: string, d: -1|1) => void; onChange: (id: string, p: Partial<ResultInput>) => void
}) {
  const updMetric = (item: ResultInput, i: number, p: Partial<ResultMetricInput>) =>
    onChange(item.id, { metrics: item.metrics.map((m, idx) => idx === i ? { ...m, ...p } : m) })
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">Campaign case studies that prove your agency's performance. Include both the brand and the creator(s) involved for full context.</p>
      {items.length === 0 && <EmptyHint text="No results yet. Add your strongest campaign case study first."/>}
      {items.map((item, i) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <CardHeader title={item.title || `Campaign ${i + 1}`} index={i} total={items.length}
            onRemove={() => onRemove(item.id)} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)}/>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Brand (client)"    value={item.brand}   onChange={v => onChange(item.id, { brand: v })}   placeholder="Kinetics"/>
            <TF label="Creator(s) used"   value={item.creator} onChange={v => onChange(item.id, { creator: v })} placeholder="@amelia.roze · @markustamm"/>
          </div>
          <div className="mt-4"><TF label="Campaign title" value={item.title} onChange={v => onChange(item.id, { title: v })} placeholder="Baltic Fitness Creator Campaign Q2 2026"/></div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Campaign objective" value={item.objective} onChange={v => onChange(item.id, { objective: v })} placeholder="Product launch — brand awareness in Baltic markets"/>
            <TF label="Headline result"    value={item.result}    onChange={v => onChange(item.id, { result: v })}    placeholder="3.2× ROAS, 5.8K units sold, 2.1M organic reach"/>
          </div>
          <div className="mt-4"><TA label="What we did" value={item.description} onChange={v => onChange(item.id, { description: v })} placeholder="Describe the campaign — strategy, creator selection, content approach, and execution." maxLength={400}/></div>
          <div className="mt-4"><TA label="Key insight"  value={item.insight}    onChange={v => onChange(item.id, { insight: v })}    placeholder="What made this campaign work? What would you do differently?" maxLength={280}/></div>
          <div className="mt-4">
            <AssetUpload label="Campaign video / highlight reel" value={item.videoUrl} onChange={v => onChange(item.id, { videoUrl: v })} aspect="wide" hint="Optional — best performing content from this campaign"/>
          </div>
          <div className="mt-5">
            <FL>Results to highlight</FL>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {item.metrics.map((m, mi) => (
                <div key={mi} className="rounded-xl border border-primary/10 bg-white p-3">
                  <div className="mb-2 flex gap-1">
                    {METRIC_ICON_OPTIONS.map(opt => (
                      <button key={opt.key} type="button" onClick={() => updMetric(item, mi, { icon: opt.key })}
                        className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${m.icon === opt.key ? 'border-primary bg-primary/[0.1] text-primary' : 'border-transparent text-ink/25 hover:text-ink/50'}`}>
                        <MetricIcon icon={opt.key} s={13}/>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={iCls} value={m.value} onChange={e => updMetric(item, mi, { value: e.target.value })} placeholder="3.2×"/>
                    <input className={iCls} value={m.label} onChange={e => updMetric(item, mi, { label: e.target.value })} placeholder="ROAS"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <AddBtn label="Add a campaign result" onClick={onAdd}/>
    </div>
  )
}

/* ── 6. Testimonials ── */
function TestimonialsSection({ items, onAdd, onRemove, onMove, onChange }: {
  items: TestimonialInput[]; onAdd: () => void; onRemove: (id: string) => void
  onMove: (id: string, d: -1|1) => void; onChange: (id: string, p: Partial<TestimonialInput>) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">Testimonials from both brands you have serviced and creators you have managed. Both perspectives build trust with different audiences.</p>
      {items.length === 0 && <EmptyHint text="No testimonials yet. Add a brand testimonial first — they carry the most weight."/>}
      {items.map((item, i) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <CardHeader title={item.name || `Testimonial ${i + 1}`} index={i} total={items.length}
            onRemove={() => onRemove(item.id)} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)}/>

          {/* Reviewer type toggle */}
          <div className="mb-4 flex gap-2">
            {(['brand', 'creator'] as ReviewerType[]).map(t => (
              <button key={t} type="button" onClick={() => onChange(item.id, { reviewerType: t })}
                className={`rounded-xl border-2 px-4 py-2 text-[12.5px] font-bold transition capitalize ${item.reviewerType === t ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/10 bg-white text-ink/55 hover:border-primary/20'}`}>
                {t}
              </button>
            ))}
          </div>

          {item.reviewerType === 'brand' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TF label="Name"    value={item.name}    onChange={v => onChange(item.id, { name: v })}    placeholder="Mārtiņš Ozols"/>
              <TF label="Role"    value={item.role}    onChange={v => onChange(item.id, { role: v })}    placeholder="Founder"/>
              <TF label="Company" value={item.company} onChange={v => onChange(item.id, { company: v })} placeholder="Kinetics SIA"/>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TF label="Name"    value={item.name}   onChange={v => onChange(item.id, { name: v })}   placeholder="Amelia Roze"/>
              <TF label="Handle"  value={item.handle} onChange={v => onChange(item.id, { handle: v })} placeholder="@amelia.roze"/>
              <TF label="Niche"   value={item.niche}  onChange={v => onChange(item.id, { niche: v })}  placeholder="Fitness & wellness"/>
            </div>
          )}

          <div className="mt-4"><TA label="Quote" value={item.quote} onChange={v => onChange(item.id, { quote: v })} placeholder="What did they say about working with your agency?" maxLength={400}/></div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><FL>Rating</FL><StarRating value={item.rating} onChange={r => onChange(item.id, { rating: r })}/></div>
            <TF label="Date" value={item.date} onChange={v => onChange(item.id, { date: v })} placeholder="June 2026"/>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ColorField  label={item.reviewerType === 'brand' ? 'Brand colour' : 'Accent colour'} value={item.color}     onChange={v => onChange(item.id, { color: v })}/>
            <AssetUpload label={item.reviewerType === 'brand' ? 'Brand logo'  : 'Creator photo'}  value={item.avatarUrl} onChange={v => onChange(item.id, { avatarUrl: v })} hint="Optional"/>
          </div>
        </div>
      ))}
      <AddBtn label="Add a testimonial" onClick={onAdd}/>
    </div>
  )
}

/* ── 7. Engagement Models ── */
function EngagementModelsSection({ items, onAdd, onRemove, onMove, onChange }: {
  items: EngagementModelInput[]; onAdd: () => void; onRemove: (id: string) => void
  onMove: (id: string, d: -1|1) => void; onChange: (id: string, p: Partial<EngagementModelInput>) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink/55">How brands can hire your agency — shown as cards on your profile. Most agencies list two or three models.</p>
      {items.map((item, i) => (
        <div key={item.id} className="rounded-2xl border border-primary/10 bg-surface-sub p-5">
          <CardHeader title={item.name || `Model ${i + 1}`} index={i} total={items.length}
            onRemove={() => onRemove(item.id)} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)}/>
          <IconPicker label="Icon" value={item.icon} onChange={v => onChange(item.id, { icon: v })} options={WORK_ICON_OPTIONS}/>
          <div className="mt-4"><TF label="Model name" value={item.name} onChange={v => onChange(item.id, { name: v })} placeholder="Monthly Retainer"/></div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TF label="Price"       value={item.price}      onChange={v => onChange(item.id, { price: v })}      placeholder="€2,500"/>
            <TF label="Price label" value={item.priceLabel} onChange={v => onChange(item.id, { priceLabel: v })} placeholder="/month"/>
          </div>
          <div className="mt-4"><TF label="Short description" value={item.description} onChange={v => onChange(item.id, { description: v })} placeholder="Ongoing partnership — we handle everything."/></div>
          <div className="mt-4"><StrList label="What's included" values={item.features} onChange={v => onChange(item.id, { features: v })} placeholder="Dedicated account manager"/></div>
          <div className="mt-4"><SW label="Highlight as most popular" checked={item.popular} onChange={v => onChange(item.id, { popular: v })}/></div>
        </div>
      ))}
      <AddBtn label="Add an engagement model" onClick={onAdd}/>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function AgencyStudioPage() {
  const [profile,  setProfile]  = useState<AgencyProfileFormData>(createInitialProfile)
  const [guided,   setGuided]   = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const isReturn = !!localStorage.getItem(VISITED_KEY)
    setGuided(!isReturn); setHydrated(true)
  }, [])

  const [guidedIdx,      setGuidedIdx]      = useState(0)
  const [activeSection,  setActiveSection]  = useState<SectionId | null>('agency_basics')
  const [blockWarning,   setBlockWarning]   = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [lastSaved,      setLastSaved]      = useState<Date | null>(null)
  const [sectionDirty,   setSectionDirty]   = useState<Partial<Record<SectionId, boolean>>>({})
  const [sectionSaving,  setSectionSaving]  = useState<Partial<Record<SectionId, boolean>>>({})

  const sectionRefs = useRef<Partial<Record<SectionId, HTMLDivElement | null>>>({})
  const regRef = (id: SectionId) => (el: HTMLDivElement | null) => { sectionRefs.current[id] = el }
  const scrollTo = (id: SectionId) => requestAnimationFrame(() => sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }))

  const currentIsDirty    = !!(activeSection && sectionDirty[activeSection])
  const wizardSectionId: SectionId = SECTION_META[guidedIdx]?.id ?? 'agency_basics'

  const finishGuided = (jumpTo?: SectionId) => {
    localStorage.setItem(VISITED_KEY, '1'); setGuided(false)
    setActiveSection(jumpTo ?? null); if (jumpTo) scrollTo(jumpTo)
  }
  const exitGuided    = () => finishGuided(wizardSectionId)
  const continueGuided = async () => {
    setSaving(true); await mockDelay(); setSaving(false); setLastSaved(new Date())
    const next = guidedIdx + 1
    if (next >= SECTION_META.length) { finishGuided(); return }
    setGuidedIdx(next); scrollTo(SECTION_META[next]?.id ?? 'agency_basics')
  }

  const requestSwitch = (id: SectionId) => {
    if (guided) { exitGuided(); return }
    if (activeSection === id) return
    if (currentIsDirty) { setBlockWarning(true); return }
    setBlockWarning(false); setActiveSection(id); scrollTo(id)
  }

  const saveSectionById = async (id: SectionId) => {
    setSectionSaving(prev => ({ ...prev, [id]: true })); await mockDelay(600)
    setSectionSaving(prev => ({ ...prev, [id]: false })); setSectionDirty(prev => ({ ...prev, [id]: false }))
    setBlockWarning(false); setLastSaved(new Date())
  }

  const upd = <K extends keyof AgencyProfileFormData>(key: K, val: AgencyProfileFormData[K], sectionId?: SectionId) => {
    setProfile(p => ({ ...p, [key]: val }))
    if (!guided && sectionId) setSectionDirty(prev => ({ ...prev, [sectionId]: true }))
  }

  const updBasics   = (patch: Partial<AgencyBasicsInput>) => upd('basics', { ...profile.basics, ...patch }, 'agency_basics')
  const updServices = (updated: ServiceInput[])            => upd('services', updated, 'services')

  const addBrand  = () => upd('brandPortfolio', [...profile.brandPortfolio, mkBrandItem()], 'brand_portfolio')
  const rmBrand   = (id: string) => upd('brandPortfolio', profile.brandPortfolio.filter(x => x.id !== id), 'brand_portfolio')
  const mvBrand   = (id: string, d: -1|1) => upd('brandPortfolio', moveById(profile.brandPortfolio, id, d), 'brand_portfolio')
  const chBrand   = (id: string, p: Partial<BrandPortfolioItemInput>) => upd('brandPortfolio', profile.brandPortfolio.map(x => x.id === id ? { ...x, ...p } : x), 'brand_portfolio')

  const addCreator = () => upd('creatorRoster', [...profile.creatorRoster, mkCreatorItem()], 'creator_roster')
  const rmCreator  = (id: string) => upd('creatorRoster', profile.creatorRoster.filter(x => x.id !== id), 'creator_roster')
  const mvCreator  = (id: string, d: -1|1) => upd('creatorRoster', moveById(profile.creatorRoster, id, d), 'creator_roster')
  const chCreator  = (id: string, p: Partial<CreatorRosterItemInput>) => upd('creatorRoster', profile.creatorRoster.map(x => x.id === id ? { ...x, ...p } : x), 'creator_roster')

  const addResult  = () => upd('results', [...profile.results, mkResult()], 'results')
  const rmResult   = (id: string) => upd('results', profile.results.filter(x => x.id !== id), 'results')
  const mvResult   = (id: string, d: -1|1) => upd('results', moveById(profile.results, id, d), 'results')
  const chResult   = (id: string, p: Partial<ResultInput>) => upd('results', profile.results.map(x => x.id === id ? { ...x, ...p } : x), 'results')

  const addTest    = () => upd('testimonials', [...profile.testimonials, mkTestimonial()], 'testimonials')
  const rmTest     = (id: string) => upd('testimonials', profile.testimonials.filter(x => x.id !== id), 'testimonials')
  const mvTest     = (id: string, d: -1|1) => upd('testimonials', moveById(profile.testimonials, id, d), 'testimonials')
  const chTest     = (id: string, p: Partial<TestimonialInput>) => upd('testimonials', profile.testimonials.map(x => x.id === id ? { ...x, ...p } : x), 'testimonials')

  const addModel   = () => upd('engagementModels', [...profile.engagementModels, mkModel()], 'engagement_models')
  const rmModel    = (id: string) => upd('engagementModels', profile.engagementModels.filter(x => x.id !== id), 'engagement_models')
  const mvModel    = (id: string, d: -1|1) => upd('engagementModels', moveById(profile.engagementModels, id, d), 'engagement_models')
  const chModel    = (id: string, p: Partial<EngagementModelInput>) => upd('engagementModels', profile.engagementModels.map(x => x.id === id ? { ...x, ...p } : x), 'engagement_models')

  const handleSave = async () => { setSaving(true); await mockDelay(700); setSaving(false); setLastSaved(new Date()) }

  const statuses: Record<SectionId, SectionStatus> = {
    agency_basics:     computeStatus(profile, 'agency_basics'),
    services:          computeStatus(profile, 'services'),
    brand_portfolio:   computeStatus(profile, 'brand_portfolio'),
    creator_roster:    computeStatus(profile, 'creator_roster'),
    results:           computeStatus(profile, 'results'),
    testimonials:      computeStatus(profile, 'testimonials'),
    engagement_models: computeStatus(profile, 'engagement_models'),
  }

  const sectionContent: Record<SectionId, ReactNode> = {
    agency_basics:     <AgencyBasicsSection     value={profile.basics}           onChange={updBasics}/>,
    services:          <ServicesSection          services={profile.services}       onChange={updServices}/>,
    brand_portfolio:   <BrandPortfolioSection    items={profile.brandPortfolio}    onAdd={addBrand}   onRemove={rmBrand}   onMove={mvBrand}   onChange={chBrand}/>,
    creator_roster:    <CreatorRosterSection     items={profile.creatorRoster}     onAdd={addCreator} onRemove={rmCreator} onMove={mvCreator} onChange={chCreator}/>,
    results:           <ResultsSection           items={profile.results}           onAdd={addResult}  onRemove={rmResult}  onMove={mvResult}  onChange={chResult}/>,
    testimonials:      <TestimonialsSection      items={profile.testimonials}      onAdd={addTest}    onRemove={rmTest}    onMove={mvTest}    onChange={chTest}/>,
    engagement_models: <EngagementModelsSection  items={profile.engagementModels}  onAdd={addModel}   onRemove={rmModel}   onMove={mvModel}   onChange={chModel}/>,
  }

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

  const UnsavedWarning = () => (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-[11px] font-black text-white">!</span>
      <div className="min-w-0 flex-1"><p className="text-[13px] font-bold text-amber-800">You have unsaved changes</p><p className="mt-0.5 text-[12px] text-amber-700">Save this section before switching to another one.</p></div>
      <button type="button" onClick={() => setBlockWarning(false)} className="flex-shrink-0 text-amber-400 hover:text-amber-600 text-lg leading-none">×</button>
    </div>
  )

  if (!hydrated) return null

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">
      <TopBar dirty={currentIsDirty} saving={saving} lastSaved={lastSaved} onSave={() => void handleSave()}/>
      <MobileNav activeId={guided ? wizardSectionId : (activeSection ?? null)} statuses={statuses} onSelect={requestSwitch}/>

      <div className="mx-auto flex max-w-[1180px] gap-6 px-4 py-8 pb-24 sm:px-6 lg:py-10 lg:pb-10">
        <Sidebar activeId={guided ? wizardSectionId : (activeSection ?? null)} statuses={statuses} onSelect={requestSwitch}/>

        <main className="min-w-0 flex-1 space-y-4">
          {!guided && blockWarning && <UnsavedWarning/>}

          {/* ══ WIZARD MODE ═══════════════════════════════════════════ */}
          {guided && (() => {
            const s = SECTION_META[guidedIdx]!
            return (
              <>
                <GuidedBanner index={guidedIdx} total={SECTION_META.length} onExit={exitGuided}/>
                <Section key={s.id} icon={s.icon} title={s.label} description={s.description}
                  status={statuses[s.id]} isOpen={true} onToggle={() => {}} refCb={regRef(s.id)} footer={wizardFooter}>
                  {sectionContent[s.id]}
                </Section>
              </>
            )
          })()}

          {/* ══ FREE-EDIT MODE ════════════════════════════════════════ */}
          {!guided && (() => {
            if (!activeSection) {
              return (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white px-8 py-16 text-center">
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${GRAD_BTN}`}><IcBriefcase s={24}/></div>
                  <p className="text-[15px] font-extrabold text-ink">Select a section to edit</p>
                  <p className="mt-1.5 text-[13px] text-ink/50">Choose any section from the sidebar to start editing your agency profile.</p>
                </div>
              )
            }
            const s = SECTION_META.find(x => x.id === activeSection)!
            return (
              <Section key={s.id} icon={s.icon} title={s.label} description={s.description}
                status={statuses[s.id]} isOpen={true} onToggle={() => {}} refCb={regRef(s.id)} footer={freeEditFooter(s.id)}>
                {sectionContent[s.id]}
              </Section>
            )
          })()}
        </main>
      </div>

      {/* Mobile save bar — wizard mode only */}
      {guided && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
          <span className="text-[12px] font-semibold text-ink/45">{saving ? 'Saving…' : `Step ${guidedIdx + 1} of ${SECTION_META.length}`}</span>
          <button type="button" onClick={() => void continueGuided()} disabled={saving}
            className={`rounded-lg ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-40`}>
            {saving ? '…' : guidedIdx >= SECTION_META.length - 1 ? 'Finish' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  )
}