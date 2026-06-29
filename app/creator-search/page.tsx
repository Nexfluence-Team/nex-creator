'use client'

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Creator discover — app/discover/brands/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   Two search modes toggled via a segmented pill in the header:

   BRANDS mode — identical to the existing brand search result page
   (doc 5). Vertical 3-column BrandCard grid. Filters: category,
   collab type, location, active creators, response time, rating,
   verified. Sort: Relevance, Most active creators, Highest commission,
   Newest.

   OPPORTUNITIES mode — open calls posted by brands/agencies that
   creators can actively apply to (distinct from Invites, which are
   brand-initiated). Horizontal, full-width expandable cards. On expand
   the card shows a brief snippet; "View full brief & apply" opens a
   modal with the complete brief, dos/don'ts, and a message composer.
   Filters: niche, deal type, platform, location, rate type, deadline.
   Sort: Best match, Highest pay, Deadline soonest, Newest.

   Header: NexLogo pill (centred) | left nav (Dashboard, Discover) |
           right nav (Messages icon + badge, Bell icon + badge, My Profile)
   — exact pattern as creator dashboard.
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const PAGE_SIZE = 9

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */
type SearchMode = 'brands' | 'opportunities'
type CollabType = 'affiliate' | 'paid' | 'barter'
type DealType   = 'paid' | 'affiliate' | 'barter' | 'hybrid'

/* ─── Brand data ──────────────────────────────────────────────────── */
type BrandResult = {
  id: string; name: string; verified: boolean
  logoUrl: string | null; color: string; initials: string
  category: string; city: string; country: string; flagCode: string
  activeCreators: number; responseTime: string
  collabTypes: CollabType[]; primaryRate: string; rateSortValue: number
  rating: number; postedDaysAgo: number; description: string; tags: string[]
}

/* ─── Opportunity data ────────────────────────────────────────────── */
type Opportunity = {
  id: string
  brandName: string; brandType: 'brand' | 'agency'; brandColor: string
  brandInitials: string; brandLogoUrl: string | null
  title: string; objective: string; dealType: DealType
  niches: string[]; platforms: string[]
  rate: string; rateNote: string; rateSortValue: number
  pieces: number; formats: string[]
  timeline: string; deadline: string; deadlineDaysLeft: number
  brief: string; briefSnippet: string
  dos: string[]; donts: string[]
  location: string; spotsLeft: number; applicationCount: number
  postedDaysAgo: number; matchScore: number
  status: 'open' | 'closing'   // 'closing' = ≤5 days left
}

/* ─── Brand filter state ──────────────────────────────────────────── */
type BrandFilterState = {
  categories: string[]; collabTypes: CollabType[]; locations: string[]
  minActiveCreators: number; maxResponseTime: string
  minRating: number; verifiedOnly: boolean
}
const EMPTY_BRAND_FILTERS: BrandFilterState = {
  categories: [], collabTypes: [], locations: [],
  minActiveCreators: 0, maxResponseTime: '', minRating: 0, verifiedOnly: false,
}

/* ─── Opportunity filter state ────────────────────────────────────── */
type OppFilterState = {
  niches: string[]; dealTypes: DealType[]; platforms: string[]
  locations: string[]; deadline: string; verifiedOnly: boolean
}
const EMPTY_OPP_FILTERS: OppFilterState = {
  niches: [], dealTypes: [], platforms: [],
  locations: [], deadline: '', verifiedOnly: false,
}

/* ─── Brand sorts ─────────────────────────────────────────────────── */
const BRAND_SORT_OPTIONS = ['Relevance', 'Most active creators', 'Highest commission', 'Newest'] as const
type BrandSort = typeof BRAND_SORT_OPTIONS[number]

/* ─── Opportunity sorts ───────────────────────────────────────────── */
const OPP_SORT_OPTIONS = ['Best match', 'Highest pay', 'Deadline soonest', 'Newest'] as const
type OppSort = typeof OPP_SORT_OPTIONS[number]

/* ════════════════════════════════════════════════════════════════════
   FILTER CONSTANTS
   ════════════════════════════════════════════════════════════════════ */
const BRAND_CATEGORIES = ['Beauty', 'Fitness', 'Sports Nutrition', 'Wellness', 'Fashion', 'Food & Beverage', 'Tech', 'Home & Lifestyle']
const OPP_NICHES       = ['Beauty', 'Fitness', 'Wellness', 'Lifestyle', 'Fashion', 'Food & Beverage', 'Tech', 'Travel', 'Parenting', 'Sports']
const PLATFORMS        = ['Instagram', 'TikTok', 'YouTube', 'Snapchat', 'LinkedIn']
const LOCATIONS        = ['Latvia', 'Lithuania', 'Estonia']

const BRAND_COLLAB_OPTIONS: { key: CollabType; label: string }[] = [
  { key: 'affiliate', label: 'Affiliate / Revenue share' },
  { key: 'paid',      label: 'Paid campaigns'            },
  { key: 'barter',   label: 'Barter / Gifting'           },
]
const OPP_DEAL_TYPE_OPTIONS: { key: DealType; label: string }[] = [
  { key: 'paid',      label: 'Paid'      },
  { key: 'affiliate', label: 'Affiliate' },
  { key: 'barter',   label: 'Barter'    },
  { key: 'hybrid',   label: 'Hybrid'    },
]
const BRAND_MIN_ACTIVE_OPTIONS = [
  { label: 'Any', value: 0 }, { label: '10+', value: 10 },
  { label: '20+', value: 20 }, { label: '40+', value: 40 },
]
const BRAND_RESPONSE_OPTIONS = [
  { label: 'Any', value: '' }, { label: '12h', value: '12h' },
  { label: '24h', value: '24h' }, { label: '48h', value: '48h' },
]
const MIN_RATING_OPTIONS = [
  { label: 'Any', value: 0 }, { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 }, { label: '4.8+', value: 4.8 },
]
const OPP_DEADLINE_OPTIONS = [
  { label: 'Any time', value: '' }, { label: 'This week', value: '7' },
  { label: '2 weeks', value: '14' }, { label: 'This month', value: '30' },
]

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA — BRANDS
   ════════════════════════════════════════════════════════════════════ */
const BRAND_RESULTS: BrandResult[] = [
  { id: 'b1', name: 'Kinetics', verified: true, logoUrl: null, color: '#8B31E8', initials: 'KI', category: 'Sports Nutrition', city: 'Riga', country: 'Latvia', flagCode: 'lv', activeCreators: 34, responseTime: '24h', collabTypes: ['affiliate', 'paid'], primaryRate: '15% commission', rateSortValue: 15, rating: 4.8, postedDaysAgo: 2, description: "Clean, third-party-tested sports nutrition. We brief like a marketer, not a vending machine — real lab results before you ever post.", tags: ['sports nutrition', 'energy', 'recovery', 'protein'] },
  { id: 'b2', name: 'Glossé', verified: true, logoUrl: null, color: '#C026D3', initials: 'GL', category: 'Beauty', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt', activeCreators: 51, responseTime: '12h', collabTypes: ['affiliate', 'barter'], primaryRate: '12% commission', rateSortValue: 12, rating: 4.6, postedDaysAgo: 5, description: 'Lip care that layers well on camera. First-look rights on every new launch go to our affiliate creators before anyone else hears about it.', tags: ['beauty', 'lip care', 'makeup'] },
  { id: 'b3', name: 'Lumora Skincare', verified: true, logoUrl: null, color: '#059669', initials: 'LS', category: 'Beauty', city: 'Riga', country: 'Latvia', flagCode: 'lv', activeCreators: 28, responseTime: '48h', collabTypes: ['affiliate', 'paid', 'barter'], primaryRate: 'From €350/video', rateSortValue: 350, rating: 4.9, postedDaysAgo: 1, description: 'Hydration-first moisturisers built for real morning routines, not studio lighting. Our best-performing creator content is always the messiest.', tags: ['skincare', 'moisturiser', 'morning routine'] },
  { id: 'b4', name: 'Nordic Skin', verified: false, logoUrl: null, color: '#0EA5E9', initials: 'NS', category: 'Beauty', city: 'Tallinn', country: 'Estonia', flagCode: 'ee', activeCreators: 16, responseTime: '72h', collabTypes: ['barter'], primaryRate: '€90+ gift value', rateSortValue: 90, rating: 4.3, postedDaysAgo: 11, description: 'Minimal-ingredient skincare for sensitive Nordic winters. Small team, slower replies, but genuinely good product to put in front of your audience.', tags: ['skincare', 'sensitive skin', 'winter care'] },
  { id: 'b5', name: 'Forma Fit', verified: true, logoUrl: null, color: '#2563EB', initials: 'FF', category: 'Fitness', city: 'Riga', country: 'Latvia', flagCode: 'lv', activeCreators: 42, responseTime: '24h', collabTypes: ['paid', 'affiliate'], primaryRate: '18% commission', rateSortValue: 18, rating: 4.7, postedDaysAgo: 3, description: 'Strength-training apparel tested by the people who design it. We pay on delivery, not on results — no chasing invoices after the post goes live.', tags: ['fitness', 'apparel', 'strength training'] },
  { id: 'b6', name: 'Tundra Tech', verified: false, logoUrl: null, color: '#475569', initials: 'TT', category: 'Tech', city: 'Tallinn', country: 'Estonia', flagCode: 'ee', activeCreators: 9, responseTime: '48h', collabTypes: ['paid'], primaryRate: 'From €500/video', rateSortValue: 500, rating: 4.4, postedDaysAgo: 19, description: 'Compact home routers built in Tallinn. Looking for a handful of tech creators who can make networking gear feel less like networking gear.', tags: ['tech', 'hardware', 'home office'] },
  { id: 'b7', name: 'Vāre Coffee', verified: true, logoUrl: null, color: '#EA580C', initials: 'VC', category: 'Food & Beverage', city: 'Riga', country: 'Latvia', flagCode: 'lv', activeCreators: 23, responseTime: '12h', collabTypes: ['barter', 'affiliate'], primaryRate: '10% commission', rateSortValue: 10, rating: 4.9, postedDaysAgo: 0, description: 'Small-batch roastery shipping across the Baltics. Every gifted bag comes with a roast-date card — no aged stock, ever.', tags: ['coffee', 'food & beverage', 'roastery'] },
  { id: 'b8', name: 'Hygge Home', verified: false, logoUrl: null, color: '#D97706', initials: 'HH', category: 'Home & Lifestyle', city: 'Vilnius', country: 'Lithuania', flagCode: 'lt', activeCreators: 14, responseTime: '72h', collabTypes: ['barter'], primaryRate: '€150+ gift value', rateSortValue: 150, rating: 4.1, postedDaysAgo: 27, description: 'Linen homeware made slowly, on purpose. Best fit for creators whose feed already leans soft, neutral, and unhurried.', tags: ['home', 'linen', 'interiors'] },
  { id: 'b9', name: 'Amber Wellness', verified: true, logoUrl: null, color: '#CA8A04', initials: 'AW', category: 'Wellness', city: 'Jūrmala', country: 'Latvia', flagCode: 'lv', activeCreators: 31, responseTime: '24h', collabTypes: ['affiliate', 'paid'], primaryRate: '14% commission', rateSortValue: 14, rating: 4.6, postedDaysAgo: 6, description: 'Sauna and cold-plunge wellness studio with a creator-in-residence program — three free sessions before any commitment, no strings.', tags: ['wellness', 'sauna', 'cold plunge'] },
  { id: 'b10', name: 'Solis Skin', verified: true, logoUrl: null, color: '#16A34A', initials: 'SS', category: 'Beauty', city: 'Kaunas', country: 'Lithuania', flagCode: 'lt', activeCreators: 19, responseTime: '24h', collabTypes: ['affiliate', 'barter'], primaryRate: '16% commission', rateSortValue: 16, rating: 4.5, postedDaysAgo: 8, description: 'SPF-first skincare built for a region that gets four real seasons. Affiliate creators get a custom tracked link within 24 hours of approval.', tags: ['skincare', 'spf', 'sun care'] },
  { id: 'b11', name: 'Trailhead Outdoors', verified: true, logoUrl: null, color: '#0D9488', initials: 'TO', category: 'Fashion', city: 'Riga', country: 'Latvia', flagCode: 'lv', activeCreators: 25, responseTime: '24h', collabTypes: ['paid', 'barter'], primaryRate: 'From €300/video', rateSortValue: 300, rating: 4.7, postedDaysAgo: 4, description: 'Technical outerwear for Baltic trail running and hiking. We brief around terrain and weather, not just the product shot.', tags: ['fashion', 'outdoor', 'apparel'] },
  { id: 'b12', name: 'Cedar & Salt', verified: false, logoUrl: null, color: '#7C3AED', initials: 'CS', category: 'Food & Beverage', city: 'Tallinn', country: 'Estonia', flagCode: 'ee', activeCreators: 7, responseTime: '48h', collabTypes: ['barter'], primaryRate: '€80+ gift value', rateSortValue: 80, rating: 4.0, postedDaysAgo: 33, description: 'Small-batch fermented sauces and pickles out of a single Tallinn kitchen. New to creator partnerships — first cohort gets first pick of flavours.', tags: ['food', 'fermentation', 'condiments'] },
]

/* ════════════════════════════════════════════════════════════════════
   MOCK DATA — OPPORTUNITIES
   ════════════════════════════════════════════════════════════════════ */
const OPPORTUNITY_RESULTS: Opportunity[] = [
  {
    id: 'op1',
    brandName: 'Kinetics', brandType: 'brand', brandColor: '#8B31E8', brandInitials: 'KI', brandLogoUrl: null,
    title: 'Pre-Workout Race Day Launch', objective: 'Conversions', dealType: 'hybrid',
    niches: ['Fitness', 'Sports'], platforms: ['Instagram', 'TikTok'],
    rate: '€300 + 8% commission', rateNote: 'Flat fee on delivery + affiliate rate for 90 days', rateSortValue: 300,
    pieces: 2, formats: ['Instagram Reel', 'TikTok'],
    timeline: 'Jul 1 – Jul 20', deadline: 'Jul 20', deadlineDaysLeft: 23,
    brief: "We're launching our new Pre-Workout Race Day formula and want authentic content from creators who genuinely train. Show your morning or pre-race routine, naturally integrating the product. Real sweat, real reps — no polished gym-flex vibes.",
    briefSnippet: "Launching Pre-Workout Race Day — show your actual training routine with the product. Real sweat, real reps.",
    dos: ['Show it as part of your actual routine', 'Mention the caffeine-free formula', 'Include the discount code in bio for 72h'],
    donts: ["Don't compare to competitors", "Don't script it — we want authentic", 'No exaggerated claims about results'],
    location: 'Latvia', spotsLeft: 3, applicationCount: 11, postedDaysAgo: 2, matchScore: 94, status: 'open',
  },
  {
    id: 'op2',
    brandName: 'Lumora Skincare', brandType: 'brand', brandColor: '#059669', brandInitials: 'LS', brandLogoUrl: null,
    title: 'Morning Ritual — Vitamin C Serum', objective: 'Awareness', dealType: 'barter',
    niches: ['Beauty', 'Wellness', 'Lifestyle'], platforms: ['Instagram'],
    rate: 'Product gifting', rateNote: 'Full morning ritual kit (€120 value) + €50 top-up for reels over 20K views', rateSortValue: 120,
    pieces: 1, formats: ['Instagram Reel'],
    timeline: 'Jul 1 – Jul 20', deadline: 'Jul 20', deadlineDaysLeft: 23,
    brief: 'Our Vitamin C Glow Serum just hit shelves. We want a genuine morning ritual integration — bathroom, natural light, real skin. No heavy editing. The product speaks for itself if you give it a real showcase.',
    briefSnippet: 'Morning ritual integration with Vitamin C Glow Serum. Natural light, real skin, no heavy editing.',
    dos: ['Natural lighting preferred', 'Show before/after skin tone (no filter)', 'Tag @lumoraskincare in the caption'],
    donts: ['No FaceTune or heavy editing', "Don't use competing serums in the same video"],
    location: 'Latvia', spotsLeft: 5, applicationCount: 7, postedDaysAgo: 3, matchScore: 88, status: 'open',
  },
  {
    id: 'op3',
    brandName: 'Baltic Creators Agency', brandType: 'agency', brandColor: '#2563EB', brandInitials: 'BC', brandLogoUrl: null,
    title: 'Q3 Fitness Roster — Multiple Brands', objective: 'UGC + Awareness', dealType: 'paid',
    niches: ['Fitness', 'Wellness', 'Sports'], platforms: ['Instagram', 'TikTok', 'YouTube'],
    rate: '€500 / month retainer', rateNote: '3-month Q3 retainer, 4 pieces/month across 2–3 brands we manage', rateSortValue: 500,
    pieces: 4, formats: ['Instagram Reel', 'TikTok', 'YouTube Short'],
    timeline: 'Jul 1 – Sep 30', deadline: 'Sep 30', deadlineDaysLeft: 95,
    brief: "We manage a portfolio of Baltic fitness and wellness brands and we're building a Q3 creator roster. You'd work across 2–3 brands per month — all health/fitness adjacent.",
    briefSnippet: "Agency retainer across a portfolio of Baltic fitness brands — 4 pieces/month, Q3 only.",
    dos: ['Show genuine product use across categories', 'Maintain consistent quality across all deliverables'],
    donts: ["Don't mix brand identities in a single piece", 'No competitor references for any managed brand'],
    location: 'Estonia', spotsLeft: 2, applicationCount: 19, postedDaysAgo: 1, matchScore: 79, status: 'open',
  },
  {
    id: 'op4',
    brandName: 'Amber Wellness', brandType: 'brand', brandColor: '#CA8A04', brandInitials: 'AW', brandLogoUrl: null,
    title: 'Adaptogen Sleep Stack', objective: 'Conversions', dealType: 'affiliate',
    niches: ['Wellness', 'Lifestyle', 'Fitness'], platforms: ['Instagram', 'TikTok'],
    rate: '12% commission', rateNote: 'On all tracked sales, 60-day cookie, paid monthly', rateSortValue: 0,
    pieces: 3, formats: ['Instagram Story', 'Instagram Reel', 'TikTok'],
    timeline: 'Jul 5 – Aug 5', deadline: 'Aug 5', deadlineDaysLeft: 39,
    brief: "Our Adaptogen Sleep Stack is new to the Baltic market and we're looking for creators who resonate with the wellness/recovery niche. Content should focus on the wind-down routine.",
    briefSnippet: "Affiliate campaign for Adaptogen Sleep Stack — wind-down routine content, 12% commission on all tracked sales.",
    dos: ['Evening / wind-down aesthetic', 'Mention ashwagandha and magnesium key ingredients', 'Include tracked affiliate link in bio'],
    donts: ['No medical claims', "Don't suggest replacing prescription sleep aids"],
    location: 'Latvia', spotsLeft: 8, applicationCount: 4, postedDaysAgo: 4, matchScore: 85, status: 'open',
  },
  {
    id: 'op5',
    brandName: 'Forma Fit', brandType: 'brand', brandColor: '#2563EB', brandInitials: 'FF', brandLogoUrl: null,
    title: 'Strength Training Apparel — Summer Drop', objective: 'Awareness', dealType: 'paid',
    niches: ['Fitness', 'Sports', 'Lifestyle'], platforms: ['Instagram', 'TikTok'],
    rate: 'From €400/deliverable', rateNote: 'Rate depends on follower count tier. All formats covered.', rateSortValue: 400,
    pieces: 2, formats: ['Instagram Reel', 'TikTok'],
    timeline: 'Jun 25 – Jul 15', deadline: 'Jul 15', deadlineDaysLeft: 18,
    brief: "Strength-training apparel tested by the people who design it. Summer drop — two colourways. We want training-environment content: the gym, the trail, the park. Nowhere staged.",
    briefSnippet: "Summer drop campaign for strength training apparel. Train-environment content only — no staged shots.",
    dos: ['Train in it, film it', 'Show both colourways if possible', 'Paid on delivery — fast turnaround'],
    donts: ['No studio or white-background shots', 'No competitor apparel visible'],
    location: 'Latvia', spotsLeft: 4, applicationCount: 16, postedDaysAgo: 0, matchScore: 91, status: 'closing',
  },
  {
    id: 'op6',
    brandName: 'Vāre Coffee', brandType: 'brand', brandColor: '#EA580C', brandInitials: 'VC', brandLogoUrl: null,
    title: 'New Roast Reveal — Baltic Tour', objective: 'Awareness', dealType: 'barter',
    niches: ['Lifestyle', 'Food & Beverage', 'Travel'], platforms: ['Instagram', 'TikTok'],
    rate: 'Product gifting', rateNote: '3-month supply of fresh-roasted beans + limited edition mug (€80 value)', rateSortValue: 80,
    pieces: 1, formats: ['Instagram Reel'],
    timeline: 'Jul 10 – Aug 10', deadline: 'Aug 10', deadlineDaysLeft: 44,
    brief: "New roast dropping from our Riga roastery — single-origin beans from two new farms. We want an honest first-cup reaction. Wherever you actually drink coffee: kitchen, studio, office, outdoor.",
    briefSnippet: "New single-origin roast from Riga. Honest first-cup reaction wherever you actually drink coffee.",
    dos: ['Genuine first reaction only', 'Mention origin (Ethiopia, Colombia)', 'Any setting — real life, not staged café'],
    donts: ['No comparison to big-brand coffees', 'No overclaiming about flavour profiles'],
    location: 'Latvia', spotsLeft: 12, applicationCount: 3, postedDaysAgo: 0, matchScore: 72, status: 'open',
  },
  {
    id: 'op7',
    brandName: 'Nordic Skin', brandType: 'brand', brandColor: '#0EA5E9', brandInitials: 'NS', brandLogoUrl: null,
    title: 'Sensitive Skin Summer Routine', objective: 'Consideration', dealType: 'hybrid',
    niches: ['Beauty', 'Wellness'], platforms: ['Instagram', 'YouTube'],
    rate: '€150 + 10% commission', rateNote: 'Flat for the video, affiliate rate for 60 days', rateSortValue: 150,
    pieces: 2, formats: ['Instagram Reel', 'YouTube Short'],
    timeline: 'Jul 8 – Jul 28', deadline: 'Jul 28', deadlineDaysLeft: 31,
    brief: "Our minimal-ingredient line for sensitive skin needs the right voice. Summer = sunlight, heat, sweat — our formulas handle all of it. We want creators who genuinely deal with sensitive skin, not just a pretty shelf.",
    briefSnippet: "Sensitive skin summer routine. Looking for creators who actually deal with sensitive skin, not just a styled bathroom shelf.",
    dos: ['Real skin, minimal filter', 'Mention the 5-ingredient-or-less formula', 'Share your actual skin concern'],
    donts: ["Don't claim medical skin benefits", 'No competitor comparisons'],
    location: 'Estonia', spotsLeft: 6, applicationCount: 9, postedDaysAgo: 5, matchScore: 77, status: 'open',
  },
  {
    id: 'op8',
    brandName: 'Trailhead Outdoors', brandType: 'brand', brandColor: '#0D9488', brandInitials: 'TO', brandLogoUrl: null,
    title: 'Summer Trail Running Gear', objective: 'Conversions', dealType: 'paid',
    niches: ['Fitness', 'Sports', 'Travel', 'Lifestyle'], platforms: ['Instagram', 'YouTube'],
    rate: 'From €350/video', rateNote: 'Rate scales with views. Bonus on tracked sales over 50 units.', rateSortValue: 350,
    pieces: 2, formats: ['Instagram Reel', 'YouTube Short'],
    timeline: 'Jul 1 – Aug 1', deadline: 'Aug 1', deadlineDaysLeft: 35,
    brief: "Technical outerwear for Baltic trail running. We want creators who actually run outdoors — rain, mud, early mornings. Brief is around terrain and weather, not the product shot itself.",
    briefSnippet: "Technical outerwear for Baltic trail running. Creators who actually run outdoors in all conditions.",
    dos: ['Real trails, real weather conditions', 'Show the technical fit — movement, not pose', 'Mention waterproofing and packability'],
    donts: ['No treadmill or gym shoots', 'No clean, dry, staged trail photos'],
    location: 'Latvia', spotsLeft: 5, applicationCount: 12, postedDaysAgo: 3, matchScore: 68, status: 'open',
  },
  {
    id: 'op9',
    brandName: 'Solis Skin', brandType: 'brand', brandColor: '#16A34A', brandInitials: 'SS', brandLogoUrl: null,
    title: 'SPF Creator Programme — Q3',  objective: 'Awareness', dealType: 'affiliate',
    niches: ['Beauty', 'Lifestyle', 'Wellness'], platforms: ['Instagram', 'TikTok'],
    rate: '16% commission', rateNote: 'Tracked link live within 24h of approval. Paid monthly.', rateSortValue: 0,
    pieces: 3, formats: ['Instagram Reel', 'TikTok', 'Instagram Story'],
    timeline: 'Jul 1 – Sep 30', deadline: 'Sep 30', deadlineDaysLeft: 95,
    brief: "SPF-first skincare built for four real Baltic seasons. Summer focus: daily SPF habit content. We want creators who wear it under makeup, at the beach, at a desk — wherever they actually are.",
    briefSnippet: "SPF-first skincare for Baltic summers. Show the daily SPF habit in real settings — under makeup, at the beach, at a desk.",
    dos: ['Daily routine integration', 'Mention SPF 50 and no white cast', 'Show it layering under makeup'],
    donts: ['No skin-whitening language', 'No before/after comparison claims'],
    location: 'Lithuania', spotsLeft: 15, applicationCount: 6, postedDaysAgo: 7, matchScore: 82, status: 'open',
  },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function SearchIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function XIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function SlidersIcon({ s = 16 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="16" cy="6" r="2.2" fill="currentColor"/><circle cx="6" cy="12" r="2.2" fill="currentColor"/><circle cx="18" cy="18" r="2.2" fill="currentColor"/></svg>
}
function BookmarkIcon({ s = 16, filled = false }: { s?: number; filled?: boolean }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}><path d="M6 3.5h12a1 1 0 011 1V21l-7-4-7 4V4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}
function BellIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChatBubbleIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
}
function CheckIcon({ s = 14 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function StarIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z"/></svg>
}
function ShieldIcon({ s = 10 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ZapIcon({ s = 10 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function HandshakeIcon({ s = 10 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3l-1 11 6.5 6.5a1 1 0 103-3M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function UsersIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.9"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>
}
function ClockIcon({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.9"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevronDownIcon({ s = 14, open }: { s?: number; open: boolean }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BuildingIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function SendIcon({ s = 13 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function BriefcaseIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v3M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   SHARED SMALL COMPONENTS
   ════════════════════════════════════════════════════════════════════ */
function LogoTile({ name, color, logoUrl, initials, size = 44, round = false }: {
  name: string; color: string; logoUrl?: string | null; initials?: string; size?: number; round?: boolean
}) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const rad  = round ? 'rounded-full' : 'rounded-xl'
  if (logoUrl) return (
    <div className={`flex flex-shrink-0 items-center justify-center overflow-hidden border border-primary/10 bg-white ${rad}`} style={{ width: size, height: size }}>
      <img src={logoUrl} alt={name} width={size} height={size} className="h-full w-full object-contain p-1" draggable={false}/> {/* eslint-disable-line @next/next/no-img-element */}
    </div>
  )
  return (
    <div className={`flex flex-shrink-0 items-center justify-center font-extrabold text-white ${rad}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {abbr}
    </div>
  )
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref   = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setVis(true); io.disconnect() } }, { threshold: 0.06, rootMargin: '0px 0px -16px 0px' })
    io.observe(el); return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  )
}

function CollabBadge({ type }: { type: CollabType }) {
  const map: Record<CollabType, { icon: ReactNode; label: string }> = {
    affiliate: { icon: <ShieldIcon s={10}/>,    label: 'Affiliate' },
    paid:      { icon: <ZapIcon s={10}/>,       label: 'Paid'      },
    barter:    { icon: <HandshakeIcon s={10}/>, label: 'Barter'    },
  }
  const m = map[type]
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/15 bg-primary/[0.06] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-primary">
      {m.icon}{m.label}
    </span>
  )
}

const DEAL_TYPE_META: Record<DealType, { label: string; bg: string; text: string }> = {
  paid:      { label: 'Paid',      bg: 'bg-violet-50',  text: 'text-violet-700'  },
  affiliate: { label: 'Affiliate', bg: 'bg-sky-50',     text: 'text-sky-700'     },
  barter:    { label: 'Barter',    bg: 'bg-amber-50',   text: 'text-amber-700'   },
  hybrid:    { label: 'Hybrid',    bg: 'bg-pink-50',    text: 'text-pink-700'    },
}
const OBJ_COLOR: Record<string, string> = {
  Conversions:     'text-violet-600 bg-violet-50',
  Awareness:       'text-sky-600 bg-sky-50',
  UGC:             'text-pink-600 bg-pink-50',
  'UGC + Awareness': 'text-pink-600 bg-pink-50',
  Consideration:   'text-amber-600 bg-amber-50',
}

/* ════════════════════════════════════════════════════════════════════
   SEARCH BAR
   ════════════════════════════════════════════════════════════════════ */
function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={17}/></span>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="w-full rounded-full border border-primary/12 bg-surface-sub py-2.5 pl-11 pr-11 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)] placeholder:text-ink/35"/>
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-ink/8 text-ink/50 transition hover:bg-ink/14">
          <XIcon s={12}/>
        </button>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SORT DROPDOWN — generic
   ════════════════════════════════════════════════════════════════════ */
function SortDropdown<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: readonly T[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h1 = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const h2 = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', h1); window.addEventListener('keydown', h2)
    return () => { document.removeEventListener('mousedown', h1); window.removeEventListener('keydown', h2) }
  }, [])
  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-primary/12 bg-white px-3 py-2 text-[12px] font-semibold text-ink/70 shadow-sm transition hover:-translate-y-0.5">
        <span className="text-ink/40">Sort:</span>
        <span className="text-ink">{value}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className={`text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className={`absolute right-0 top-[calc(100%+8px)] z-30 w-[220px] overflow-hidden rounded-xl border border-primary/10 bg-white ${CARD}`}>
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold transition hover:bg-primary/[0.06] ${value === opt ? 'bg-primary/[0.07] text-primary' : 'text-ink/75'}`}>
              {opt}{value === opt && <span className={`h-2 w-2 flex-shrink-0 rounded-full ${GRAD_BTN}`}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MODAL ATOMS — shared by both filter modals
   ════════════════════════════════════════════════════════════════════ */
function ModalToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-lg border-[1.5px] px-3 py-1.5 text-[12px] font-semibold transition ${active ? 'border-primary bg-primary/[0.08] text-primary' : 'border-ink/10 bg-white text-ink/60 hover:border-primary/30 hover:text-primary'}`}>
      {label}
    </button>
  )
}
function ModalCheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.05]">
      <span className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-md border transition ${checked ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white text-transparent'}`}>
        <CheckIcon s={11}/>
      </span>
      {label}
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   APPLIED FILTER TAG
   ════════════════════════════════════════════════════════════════════ */
type AppliedTag = { key: string; label: string; onRemove: () => void }
function AppliedFilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/[0.07] px-2.5 py-1.5 text-[12px] font-semibold text-primary">
      {label}
      <button onClick={onRemove} className="flex h-4 w-4 items-center justify-center rounded-md bg-primary/15 text-primary transition hover:bg-primary hover:text-white">
        <XIcon s={9}/>
      </button>
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   BRAND FILTER MODAL
   ════════════════════════════════════════════════════════════════════ */
function BrandFilterModal({ open, onClose, onApply, draft, setDraft }: {
  open: boolean; onClose: () => void; onApply: (f: BrandFilterState) => void
  draft: BrandFilterState; setDraft: (f: BrandFilterState) => void
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const toggle = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

  const count = draft.categories.length + draft.collabTypes.length + draft.locations.length +
    (draft.verifiedOnly ? 1 : 0) + (draft.minActiveCreators > 0 ? 1 : 0) +
    (draft.maxResponseTime !== '' ? 1 : 0) + (draft.minRating > 0 ? 1 : 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div className={`relative z-10 flex w-full max-w-[560px] max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white ${CARD}`}>
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-ink">Filter brands</h2>
            {count > 0 && <p className="mt-0.5 text-[12px] font-medium text-ink/45">{count} filter{count !== 1 ? 's' : ''} active</p>}
          </div>
          <div className="flex items-center gap-2">
            {count > 0 && <button onClick={() => setDraft(EMPTY_BRAND_FILTERS)} className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-primary transition hover:bg-primary/[0.07]">Reset all</button>}
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10"><XIcon s={14}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Category</p>
            <div className="flex flex-wrap gap-2">{BRAND_CATEGORIES.map(c => <ModalToggleChip key={c} label={c} active={draft.categories.includes(c)} onClick={() => setDraft({ ...draft, categories: toggle(draft.categories, c) })}/>)}</div>
          </section>
          <section>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Open to</p>
            {BRAND_COLLAB_OPTIONS.map(c => <ModalCheckRow key={c.key} label={c.label} checked={draft.collabTypes.includes(c.key)} onToggle={() => setDraft({ ...draft, collabTypes: toggle(draft.collabTypes, c.key) })}/>)}
          </section>
          <section>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Location</p>
            {LOCATIONS.map(l => <ModalCheckRow key={l} label={l} checked={draft.locations.includes(l)} onToggle={() => setDraft({ ...draft, locations: toggle(draft.locations, l) })}/>)}
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Active creators</p>
            <div className="flex flex-wrap gap-2">{BRAND_MIN_ACTIVE_OPTIONS.map(o => <ModalToggleChip key={o.label} label={o.label} active={draft.minActiveCreators === o.value} onClick={() => setDraft({ ...draft, minActiveCreators: draft.minActiveCreators === o.value ? 0 : o.value })}/>)}</div>
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Responds within</p>
            <div className="flex flex-wrap gap-2">{BRAND_RESPONSE_OPTIONS.map(o => <ModalToggleChip key={o.label} label={o.label} active={draft.maxResponseTime === o.value} onClick={() => setDraft({ ...draft, maxResponseTime: draft.maxResponseTime === o.value ? '' : o.value })}/>)}</div>
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Minimum rating</p>
            <div className="flex flex-wrap gap-2">{MIN_RATING_OPTIONS.map(o => <ModalToggleChip key={o.label} label={o.label} active={draft.minRating === o.value} onClick={() => setDraft({ ...draft, minRating: draft.minRating === o.value ? 0 : o.value })}/>)}</div>
          </section>
          <section><ModalCheckRow label="Verified brands only" checked={draft.verifiedOnly} onToggle={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })}/></section>
        </div>
        <div className="border-t border-primary/8 px-6 py-4">
          <button onClick={() => { onApply(draft); onClose() }}
            className={`w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white shadow-[0_4px_18px_-4px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>
            Show results{count > 0 ? ` · ${count} filter${count !== 1 ? 's' : ''} applied` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   OPPORTUNITY FILTER MODAL
   ════════════════════════════════════════════════════════════════════ */
function OppFilterModal({ open, onClose, onApply, draft, setDraft }: {
  open: boolean; onClose: () => void; onApply: (f: OppFilterState) => void
  draft: OppFilterState; setDraft: (f: OppFilterState) => void
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const toggle = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

  const count = draft.niches.length + draft.dealTypes.length + draft.platforms.length +
    draft.locations.length + (draft.deadline !== '' ? 1 : 0) + (draft.verifiedOnly ? 1 : 0)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true"/>
      <div className={`relative z-10 flex w-full max-w-[560px] max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white ${CARD}`}>
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-ink">Filter opportunities</h2>
            {count > 0 && <p className="mt-0.5 text-[12px] font-medium text-ink/45">{count} filter{count !== 1 ? 's' : ''} active</p>}
          </div>
          <div className="flex items-center gap-2">
            {count > 0 && <button onClick={() => setDraft(EMPTY_OPP_FILTERS)} className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-primary transition hover:bg-primary/[0.07]">Reset all</button>}
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10"><XIcon s={14}/></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Your niche</p>
            <div className="flex flex-wrap gap-2">{OPP_NICHES.map(n => <ModalToggleChip key={n} label={n} active={draft.niches.includes(n)} onClick={() => setDraft({ ...draft, niches: toggle(draft.niches, n) })}/>)}</div>
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Deal type</p>
            <div className="flex flex-wrap gap-2">{OPP_DEAL_TYPE_OPTIONS.map(o => <ModalToggleChip key={o.key} label={o.label} active={draft.dealTypes.includes(o.key)} onClick={() => setDraft({ ...draft, dealTypes: toggle(draft.dealTypes, o.key) })}/>)}</div>
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Platform</p>
            <div className="flex flex-wrap gap-2">{PLATFORMS.map(p => <ModalToggleChip key={p} label={p} active={draft.platforms.includes(p)} onClick={() => setDraft({ ...draft, platforms: toggle(draft.platforms, p) })}/>)}</div>
          </section>
          <section>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Location</p>
            {LOCATIONS.map(l => <ModalCheckRow key={l} label={l} checked={draft.locations.includes(l)} onToggle={() => setDraft({ ...draft, locations: toggle(draft.locations, l) })}/>)}
          </section>
          <section>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Application deadline</p>
            <div className="flex flex-wrap gap-2">{OPP_DEADLINE_OPTIONS.map(o => <ModalToggleChip key={o.label} label={o.label} active={draft.deadline === o.value} onClick={() => setDraft({ ...draft, deadline: draft.deadline === o.value ? '' : o.value })}/>)}</div>
          </section>
          <section><ModalCheckRow label="Verified brands & agencies only" checked={draft.verifiedOnly} onToggle={() => setDraft({ ...draft, verifiedOnly: !draft.verifiedOnly })}/></section>
        </div>
        <div className="border-t border-primary/8 px-6 py-4">
          <button onClick={() => { onApply(draft); onClose() }}
            className={`w-full rounded-xl ${GRAD_BTN} py-3 text-[14px] font-bold text-white shadow-[0_4px_18px_-4px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>
            Show results{count > 0 ? ` · ${count} filter${count !== 1 ? 's' : ''} applied` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   OPPORTUNITY APPLY MODAL
   Full brief + dos/don'ts + message composer.
   Same pattern as InviteDetailModal in the creator dashboard.
   ════════════════════════════════════════════════════════════════════ */
function ApplyModal({ opp, onClose, onApply }: {
  opp: Opportunity
  onClose: () => void
  onApply: (id: string, message: string) => void
}) {
  const [message, setMessage] = useState('')
  const dt  = DEAL_TYPE_META[opp.dealType]
  const obj = OBJ_COLOR[opp.objective] ?? 'text-ink/60 bg-surface-sub'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[680px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(92vh, 800px)' }}>

        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <LogoTile name={opp.brandName} color={opp.brandColor} logoUrl={opp.brandLogoUrl} initials={opp.brandInitials} size={44}/>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold text-ink/40">{opp.brandName}</p>
                <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${opp.brandType === 'agency' ? 'bg-blue-50 text-blue-600' : 'bg-primary/[0.08] text-primary'}`}>
                  {opp.brandType === 'agency' ? <><UsersIcon s={10}/>Agency</> : <><BuildingIcon s={10}/>Brand</>}
                </span>
              </div>
              <h2 className="text-[17px] font-extrabold leading-tight tracking-[-0.01em] text-ink">{opp.title}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${obj}`}>{opp.objective}</span>
                <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${dt.bg} ${dt.text}`}>{dt.label}</span>
                {opp.status === 'closing' && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10.5px] font-bold text-rose-600">
                    ⚡ Closing in {opp.deadlineDaysLeft}d
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10">
            <XIcon s={14}/>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Deal terms grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Rate',       value: opp.rate                                               },
              { label: 'Pieces',     value: `${opp.pieces} piece${opp.pieces !== 1 ? 's' : ''}`   },
              { label: 'Timeline',   value: opp.timeline                                           },
              { label: 'Platforms',  value: opp.platforms.join(' · ')                              },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-surface-sub px-3.5 py-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink/40">{item.label}</p>
                <p className="mt-0.5 text-[13px] font-bold text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Rate note */}
          {opp.rateNote && (
            <p className="rounded-xl border border-primary/12 bg-primary/[0.04] px-4 py-3 text-[12.5px] text-ink/60">
              <span className="font-bold text-primary">Rate note: </span>{opp.rateNote}
            </p>
          )}

          {/* Formats */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40">Formats required</p>
            <div className="flex flex-wrap gap-2">
              {opp.formats.map(f => (
                <span key={f} className="rounded-lg border border-primary/15 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink/70">{f}</span>
              ))}
            </div>
          </div>

          {/* Brief */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40">Campaign brief</p>
            <p className="rounded-xl bg-surface-sub px-4 py-3.5 text-[13.5px] leading-[1.65] text-ink/75">{opp.brief}</p>
          </div>

          {/* Dos & Don'ts */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 px-4 py-3.5">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700">Do</p>
              <ul className="space-y-2">
                {opp.dos.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-emerald-800">
                    <span className="mt-0.5 flex-shrink-0 text-emerald-500"><CheckIcon s={13}/></span>{d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-3.5">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-rose-700">Don't</p>
              <ul className="space-y-2">
                {opp.donts.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-rose-800">
                    <span className="mt-0.5 flex-shrink-0 text-rose-400"><XIcon s={13}/></span>{d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Message composer */}
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-5">
            <p className="mb-1 text-[13px] font-bold text-ink">Your application message</p>
            <p className="mb-3 text-[12px] text-ink/50">Optional — introduce yourself, mention why you're a good fit, or ask a quick question.</p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={`Hi ${opp.brandName}, I'd love to be part of this campaign…`}
              className="min-h-[100px] w-full resize-none rounded-xl border border-primary/15 bg-white px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30"
            />
          </div>

          {/* Spots indicator */}
          <div className="flex items-center justify-between rounded-xl bg-surface-sub px-4 py-3">
            <span className="text-[12.5px] text-ink/55">
              <span className="font-bold text-ink">{opp.spotsLeft}</span> spot{opp.spotsLeft !== 1 ? 's' : ''} remaining · {opp.applicationCount} applicants so far
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-primary/10 bg-surface-sub px-6 py-4">
          <button onClick={onClose}
            className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-[13px] font-bold text-ink/60 transition hover:bg-surface-sub">
            Cancel
          </button>
          <button onClick={() => onApply(opp.id, message)}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN}`}>
            <SendIcon s={13}/>Submit application
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   BRAND CARD — vertical (3-column grid)
   Carries the full BrandCard from the existing creator brand search.
   ════════════════════════════════════════════════════════════════════ */
const BRAND_RESPONSE_ORDER: Record<string, number> = { '12h': 1, '24h': 2, '48h': 3, '72h': 4 }

function BrandCard({ brand, delay, saved, onToggleSave, onView }: {
  brand: BrandResult; delay: number; saved: boolean; onToggleSave: () => void; onView: () => void
}) {
  const activeLabel = brand.postedDaysAgo === 0 ? 'Active today' : `Active ${brand.postedDaysAgo}d ago`
  return (
    <Reveal delay={delay}>
      <div className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/8 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_-8px_rgba(139,49,232,0.24)] ${CARD}`}>
        <div className="flex flex-1 flex-col p-4">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <button onClick={onView} className="flex-shrink-0">
              <div className="ring-2 ring-primary/10 ring-offset-2 transition duration-300 group-hover:ring-primary/40 rounded-full overflow-hidden" style={{ width: 52, height: 52 }}>
                <LogoTile name={brand.name} color={brand.color} logoUrl={brand.logoUrl} initials={brand.initials} size={52} round/>
              </div>
            </button>
            <button onClick={onView} className="min-w-0 flex-1 text-left">
              <h3 className="flex items-center gap-1 truncate text-[14.5px] font-extrabold leading-snug text-ink">
                <span className="truncate">{brand.name}</span>
                {brand.verified && <img src="/Tick.svg" alt="Verified" className="h-[13px] w-[13px] flex-shrink-0"/> /* eslint-disable-line @next/next/no-img-element */}
              </h3>
              <p className="truncate text-[11px] font-semibold text-primary/70">{brand.category}</p>
              <p className="mt-0.5 truncate text-[10.5px] font-medium text-ink/40">{brand.city}, {brand.country} · {activeLabel}</p>
            </button>
            <button onClick={e => { e.stopPropagation(); onToggleSave() }}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition ${saved ? `${GRAD_BTN} text-white shadow-md` : 'bg-surface-sub text-ink/35 hover:bg-primary/10 hover:text-primary'}`}>
              <BookmarkIcon s={15} filled={saved}/>
            </button>
          </div>

          {/* Divider */}
          <div className="my-3.5 h-px bg-primary/8"/>

          {/* Stats strip */}
          <div className="flex items-center justify-around rounded-xl bg-surface-sub px-2 py-2.5">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><UsersIcon s={11}/><span className={`text-[14px] font-extrabold ${GRAD_TEXT}`}>{brand.activeCreators}</span></span>
              <span className="mt-0.5 text-[10px] font-medium leading-none text-ink/40">Creators</span>
            </div>
            <div className="h-6 w-px bg-primary/10"/>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1"><ClockIcon s={11}/><span className={`text-[14px] font-extrabold ${GRAD_TEXT}`}>{brand.responseTime}</span></span>
              <span className="mt-0.5 text-[10px] font-medium leading-none text-ink/40">Response</span>
            </div>
            <div className="h-6 w-px bg-primary/10"/>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-0.5"><span className="text-amber-400"><StarIcon s={12}/></span><span className={`text-[14px] font-extrabold ${GRAD_TEXT}`}>{brand.rating.toFixed(1)}</span></span>
              <span className="mt-0.5 text-[10px] font-medium leading-none text-ink/40">Rating</span>
            </div>
          </div>

          {/* Collab badges + rate */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {brand.collabTypes.map(t => <CollabBadge key={t} type={t}/>)}
          </div>
          <p className="mt-2 text-[11.5px] font-bold text-ink/55">{brand.primaryRate}</p>

          {/* Description */}
          <p className="mt-2 line-clamp-2 h-[2.55rem] overflow-hidden text-[12px] leading-[1.55] text-ink/55">{brand.description}</p>

          {/* CTA */}
          <div className="mt-auto pt-4">
            <button onClick={onView}
              className={`w-full rounded-xl ${GRAD_BTN} py-2.5 text-[13px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
              View profile
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

/* ════════════════════════════════════════════════════════════════════
   OPPORTUNITY CARD — horizontal expandable (full-width stacked)
   Collapsed: logo + title + deal type + rate + spots + deadline + chevron
   Expanded:  + brief snippet + platform pills + "View full brief & apply"
   ════════════════════════════════════════════════════════════════════ */
function OpportunityCard({ opp, delay, saved, applied, expanded, onToggleExpand, onToggleSave, onApply }: {
  opp: Opportunity; delay: number; saved: boolean; applied: boolean; expanded: boolean
  onToggleExpand: () => void; onToggleSave: () => void; onApply: () => void
}) {
  const dt  = DEAL_TYPE_META[opp.dealType]
  const obj = OBJ_COLOR[opp.objective] ?? 'text-ink/60 bg-surface-sub'

  return (
    <Reveal delay={delay}>
      <div className={`overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${CARD} ${expanded ? 'border-primary/25' : 'border-primary/8 hover:border-primary/20'}`}>

        {/* ── Collapsed row ── */}
        <div className="flex items-center gap-3 p-4 sm:gap-4">
          {/* Brand logo */}
          <div className="flex-shrink-0">
            <LogoTile name={opp.brandName} color={opp.brandColor} logoUrl={opp.brandLogoUrl} initials={opp.brandInitials} size={42}/>
          </div>

          {/* Title + meta */}
          <button onClick={onToggleExpand} className="min-w-0 flex-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-extrabold leading-tight text-ink">{opp.title}</span>
              {opp.status === 'closing' && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">⚡ Closing soon</span>
              )}
              {opp.brandType === 'agency' && (
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">Agency</span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-ink/40">{opp.brandName}</span>
              <span className="text-ink/20">·</span>
              <span className={`rounded-lg px-2 py-0.5 text-[10.5px] font-bold ${obj}`}>{opp.objective}</span>
              <span className={`rounded-lg px-2 py-0.5 text-[10.5px] font-bold ${dt.bg} ${dt.text}`}>{dt.label}</span>
            </div>
          </button>

          {/* Rate + deadline */}
          <div className="hidden flex-shrink-0 flex-col items-end gap-0.5 sm:flex">
            <span className="text-[13px] font-bold text-ink">{opp.rate.split('+')[0]?.trim()}</span>
            <span className="flex items-center gap-1 text-[10.5px] font-medium text-ink/40">
              <ClockIcon s={11}/>Due {opp.deadline}
            </span>
          </div>

          {/* Spots pill */}
          <div className="hidden flex-shrink-0 flex-col items-center sm:flex">
            <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${opp.spotsLeft <= 3 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {opp.spotsLeft} spot{opp.spotsLeft !== 1 ? 's' : ''} left
            </span>
          </div>

          {/* Match badge */}
          <div className="hidden flex-shrink-0 sm:block">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold ${opp.matchScore >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : opp.matchScore >= 75 ? 'bg-primary/[0.07] text-primary border-primary/20' : 'bg-surface-sub text-ink/50 border-primary/10'}`}>
              {opp.matchScore}% match
            </span>
          </div>

          {/* Save */}
          <button onClick={e => { e.stopPropagation(); onToggleSave() }}
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition ${saved ? `${GRAD_BTN} text-white shadow-md` : 'bg-surface-sub text-ink/35 hover:bg-primary/10 hover:text-primary'}`}>
            <BookmarkIcon s={14} filled={saved}/>
          </button>

          {/* Expand toggle */}
          <button onClick={onToggleExpand}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-primary/[0.08] hover:text-primary">
            <ChevronDownIcon s={14} open={expanded}/>
          </button>
        </div>

        {/* ── Expanded panel ── */}
        {expanded && (
          <div className="border-t border-primary/8 px-4 pb-4 pt-4">
            {/* Brief snippet */}
            <p className="text-[13.5px] leading-[1.65] text-ink/65">{opp.briefSnippet}</p>

            {/* Platform pills + pieces */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {opp.platforms.map(p => (
                <span key={p} className="rounded-md border border-ink/10 bg-surface-sub px-2.5 py-1 text-[11.5px] font-semibold text-ink/55">{p}</span>
              ))}
              <span className="text-[11.5px] font-medium text-ink/40">· {opp.pieces} piece{opp.pieces !== 1 ? 's' : ''} · {opp.formats.join(', ')}</span>
            </div>

            {/* Mobile: rate + deadline + spots */}
            <div className="mt-3 flex flex-wrap items-center gap-3 sm:hidden">
              <span className="text-[13px] font-bold text-ink">{opp.rate.split('+')[0]?.trim()}</span>
              <span className="flex items-center gap-1 text-[11px] text-ink/40"><ClockIcon s={11}/>Due {opp.deadline}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${opp.spotsLeft <= 3 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {opp.spotsLeft} spot{opp.spotsLeft !== 1 ? 's' : ''} left
              </span>
            </div>

            {/* CTA row */}
            <div className="mt-4 flex items-center gap-3">
              {applied ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-white">
                  <CheckIcon s={14}/>Applied ✓
                </div>
              ) : (
                <button onClick={onApply}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN}`}>
                  <BriefcaseIcon s={14}/>View full brief & apply
                </button>
              )}
              <span className="text-[11.5px] text-ink/35">{opp.applicationCount} applicant{opp.applicationCount !== 1 ? 's' : ''} so far</span>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  )
}

/* ════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ════════════════════════════════════════════════════════════════════ */
function EmptyState({ mode, onClear }: { mode: SearchMode; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/15 bg-surface-sub py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary"><SearchIcon s={26}/></div>
      <h3 className="text-[17px] font-extrabold text-ink">
        No {mode === 'brands' ? 'brands' : 'opportunities'} match your search
      </h3>
      <p className="mt-2 max-w-[320px] text-[13px] leading-[1.6] text-ink/50">
        Try a different keyword or clear your filters to see everything available.
      </p>
      <button onClick={onClear} className={`mt-5 rounded-lg ${GRAD_BTN} px-6 py-2.5 text-[13px] font-bold text-white transition hover:-translate-y-0.5`}>
        Clear all filters
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function CreatorDiscoverPage() {
  const router = useRouter()

  /* ── Mode toggle ── */
  const [mode, setMode] = useState<SearchMode>('opportunities')

  /* ── Shared search / save state ── */
  const [query,        setQuery]        = useState('')
  const [showSaved,    setShowSaved]    = useState(false)
  const [saved,        setSaved]        = useState<string[]>([])
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  /* ── Brand-mode state ── */
  const [brandFilters, setBrandFilters] = useState<BrandFilterState>(EMPTY_BRAND_FILTERS)
  const [brandDraft,   setBrandDraft]   = useState<BrandFilterState>(EMPTY_BRAND_FILTERS)
  const [brandSort,    setBrandSort]    = useState<BrandSort>('Relevance')

  /* ── Opportunity-mode state ── */
  const [oppFilters,   setOppFilters]   = useState<OppFilterState>(EMPTY_OPP_FILTERS)
  const [oppDraft,     setOppDraft]     = useState<OppFilterState>(EMPTY_OPP_FILTERS)
  const [oppSort,      setOppSort]      = useState<OppSort>('Best match')
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [applyTarget,  setApplyTarget]  = useState<Opportunity | null>(null)
  const [applied,      setApplied]      = useState<string[]>([])

  /* ── Header badge counts ── */
  const UNREAD_MESSAGES = 3
  const UNREAD_NOTIFS   = 2

  /* ── Reset on mode switch ── */
  const switchMode = (m: SearchMode) => {
    setMode(m); setQuery(''); setVisibleCount(PAGE_SIZE); setExpandedId(null)
  }

  const toggleSaved = (id: string) =>
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const openFilter  = () => {
    if (mode === 'brands') setBrandDraft(brandFilters)
    else setOppDraft(oppFilters)
    setFilterOpen(true)
  }

  const handleApply = (id: string, _message: string) => {
    setApplied(prev => [...prev, id])
    setApplyTarget(null)
  }

  /* ── Brand applied tags ── */
  const brandAppliedTags: AppliedTag[] = useMemo(() => {
    const tags: AppliedTag[] = []
    brandFilters.categories.forEach(c => tags.push({ key: `bc-${c}`, label: c, onRemove: () => setBrandFilters(f => ({ ...f, categories: f.categories.filter(x => x !== c) })) }))
    brandFilters.collabTypes.forEach(c => tags.push({ key: `bct-${c}`, label: BRAND_COLLAB_OPTIONS.find(o => o.key === c)?.label ?? c, onRemove: () => setBrandFilters(f => ({ ...f, collabTypes: f.collabTypes.filter(x => x !== c) })) }))
    brandFilters.locations.forEach(l => tags.push({ key: `bl-${l}`, label: l, onRemove: () => setBrandFilters(f => ({ ...f, locations: f.locations.filter(x => x !== l) })) }))
    if (brandFilters.minActiveCreators > 0) tags.push({ key: 'bmac', label: `${BRAND_MIN_ACTIVE_OPTIONS.find(o => o.value === brandFilters.minActiveCreators)?.label ?? brandFilters.minActiveCreators}+ creators`, onRemove: () => setBrandFilters(f => ({ ...f, minActiveCreators: 0 })) })
    if (brandFilters.maxResponseTime !== '') tags.push({ key: 'brt', label: `Replies in ${brandFilters.maxResponseTime}`, onRemove: () => setBrandFilters(f => ({ ...f, maxResponseTime: '' })) })
    if (brandFilters.minRating > 0) tags.push({ key: 'brat', label: `${MIN_RATING_OPTIONS.find(o => o.value === brandFilters.minRating)?.label ?? brandFilters.minRating} rating`, onRemove: () => setBrandFilters(f => ({ ...f, minRating: 0 })) })
    if (brandFilters.verifiedOnly) tags.push({ key: 'bv', label: 'Verified only', onRemove: () => setBrandFilters(f => ({ ...f, verifiedOnly: false })) })
    return tags
  }, [brandFilters])

  /* ── Opportunity applied tags ── */
  const oppAppliedTags: AppliedTag[] = useMemo(() => {
    const tags: AppliedTag[] = []
    oppFilters.niches.forEach(n => tags.push({ key: `on-${n}`, label: n, onRemove: () => setOppFilters(f => ({ ...f, niches: f.niches.filter(x => x !== n) })) }))
    oppFilters.dealTypes.forEach(d => tags.push({ key: `od-${d}`, label: DEAL_TYPE_META[d].label, onRemove: () => setOppFilters(f => ({ ...f, dealTypes: f.dealTypes.filter(x => x !== d) })) }))
    oppFilters.platforms.forEach(p => tags.push({ key: `op-${p}`, label: p, onRemove: () => setOppFilters(f => ({ ...f, platforms: f.platforms.filter(x => x !== p) })) }))
    oppFilters.locations.forEach(l => tags.push({ key: `ol-${l}`, label: l, onRemove: () => setOppFilters(f => ({ ...f, locations: f.locations.filter(x => x !== l) })) }))
    if (oppFilters.deadline !== '') tags.push({ key: 'odd', label: OPP_DEADLINE_OPTIONS.find(o => o.value === oppFilters.deadline)?.label ?? oppFilters.deadline, onRemove: () => setOppFilters(f => ({ ...f, deadline: '' })) })
    if (oppFilters.verifiedOnly) tags.push({ key: 'ov', label: 'Verified only', onRemove: () => setOppFilters(f => ({ ...f, verifiedOnly: false })) })
    return tags
  }, [oppFilters])

  const activeFilterCount = mode === 'brands' ? brandAppliedTags.length : oppAppliedTags.length
  const appliedTags       = mode === 'brands' ? brandAppliedTags : oppAppliedTags

  /* ── Brand filtering + sorting ── */
  const filteredBrands = useMemo(() => {
    const q = query.trim().toLowerCase()
    return BRAND_RESULTS.filter(b => {
      if (showSaved && !saved.includes(b.id)) return false
      if (brandFilters.categories.length > 0 && !brandFilters.categories.includes(b.category)) return false
      if (brandFilters.collabTypes.length > 0 && !brandFilters.collabTypes.some(c => b.collabTypes.includes(c))) return false
      if (brandFilters.locations.length > 0 && !brandFilters.locations.includes(b.country)) return false
      if (brandFilters.minActiveCreators > 0 && b.activeCreators < brandFilters.minActiveCreators) return false
      if (brandFilters.maxResponseTime !== '') {
        if ((BRAND_RESPONSE_ORDER[b.responseTime] ?? 99) > (BRAND_RESPONSE_ORDER[brandFilters.maxResponseTime] ?? 99)) return false
      }
      if (brandFilters.minRating > 0 && b.rating < brandFilters.minRating) return false
      if (brandFilters.verifiedOnly && !b.verified) return false
      if (q && !(b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.description.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q)))) return false
      return true
    })
  }, [query, brandFilters, showSaved, saved])

  const sortedBrands = useMemo(() => {
    const arr = [...filteredBrands]
    if (brandSort === 'Most active creators') arr.sort((a, b) => b.activeCreators - a.activeCreators)
    else if (brandSort === 'Highest commission') arr.sort((a, b) => b.rateSortValue - a.rateSortValue)
    else if (brandSort === 'Newest') arr.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
    return arr
  }, [filteredBrands, brandSort])

  /* ── Opportunity filtering + sorting ── */
  const filteredOpps = useMemo(() => {
    const q = query.trim().toLowerCase()
    return OPPORTUNITY_RESULTS.filter(o => {
      if (showSaved && !saved.includes(o.id)) return false
      if (oppFilters.niches.length > 0 && !oppFilters.niches.some(n => o.niches.includes(n))) return false
      if (oppFilters.dealTypes.length > 0 && !oppFilters.dealTypes.includes(o.dealType)) return false
      if (oppFilters.platforms.length > 0 && !oppFilters.platforms.some(p => o.platforms.includes(p))) return false
      if (oppFilters.locations.length > 0 && o.location !== oppFilters.locations[0]) return false
      if (oppFilters.deadline !== '') {
        const days = parseInt(oppFilters.deadline, 10)
        if (o.deadlineDaysLeft > days) return false
      }
      if (oppFilters.verifiedOnly && o.brandType !== 'brand') return false
      if (q && !(o.title.toLowerCase().includes(q) || o.brandName.toLowerCase().includes(q) || o.brief.toLowerCase().includes(q) || o.niches.some(n => n.toLowerCase().includes(q)))) return false
      return true
    })
  }, [query, oppFilters, showSaved, saved])

  const sortedOpps = useMemo(() => {
    const arr = [...filteredOpps]
    if (oppSort === 'Highest pay') arr.sort((a, b) => b.rateSortValue - a.rateSortValue)
    else if (oppSort === 'Deadline soonest') arr.sort((a, b) => a.deadlineDaysLeft - b.deadlineDaysLeft)
    else if (oppSort === 'Newest') arr.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
    else arr.sort((a, b) => b.matchScore - a.matchScore) // Best match
    return arr
  }, [filteredOpps, oppSort])

  useEffect(() => { setVisibleCount(PAGE_SIZE) }, [query, brandFilters, oppFilters, showSaved, brandSort, oppSort, mode])

  const totalResults    = mode === 'brands' ? sortedBrands.length : sortedOpps.length
  const visibleBrands   = sortedBrands.slice(0, visibleCount)
  const visibleOpps     = sortedOpps.slice(0, visibleCount)

  const resultLabel = query.trim()
    ? `${totalResults} ${mode === 'brands' ? 'brand' : 'opportunit'}${totalResults !== 1 ? (mode === 'brands' ? 's' : 'ies') : (mode === 'brands' ? '' : 'y')} match "${query.trim()}"`
    : `${totalResults} ${mode === 'brands' ? 'brand' : 'opportunit'}${totalResults !== 1 ? (mode === 'brands' ? 's' : 'ies') : (mode === 'brands' ? '' : 'y')} to discover`

  const NAV_LEFT = [
    { label: 'Dashboard', active: false, action: () => router.push('/dashboard/creator') },
    { label: 'Discover',  active: true,  action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ APPLY MODAL ════ */}
      {applyTarget && (
        <ApplyModal
          opp={applyTarget}
          onClose={() => setApplyTarget(null)}
          onApply={handleApply}
        />
      )}

      {/* ════ FILTER MODAL — brand ════ */}
      <BrandFilterModal
        open={filterOpen && mode === 'brands'}
        onClose={() => setFilterOpen(false)}
        onApply={f => setBrandFilters(f)}
        draft={brandDraft}
        setDraft={setBrandDraft}
      />

      {/* ════ FILTER MODAL — opportunities ════ */}
      <OppFilterModal
        open={filterOpen && mode === 'opportunities'}
        onClose={() => setFilterOpen(false)}
        onApply={f => setOppFilters(f)}
        draft={oppDraft}
        setDraft={setOppDraft}
      />

      {/* ════ HEADER — matches creator dashboard exactly ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">

          {/* Nav pill */}
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            {/* Right: icon buttons — exact brand dashboard pattern */}
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

          {/* Search + mode toggle row */}
          <div className="mt-2.5 flex items-center gap-2.5">
            {/* ── Mode toggle pill ── */}
            <div className="flex flex-shrink-0 items-center rounded-full border border-primary/12 bg-surface-sub p-0.5">
              {(['opportunities', 'brands'] as const).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${mode === m ? `${GRAD_BTN} text-white shadow-sm` : 'text-ink/55 hover:text-ink'}`}>
                  {m === 'opportunities' ? <><BriefcaseIcon s={12}/>Opportunities</> : <><BuildingIcon s={12}/>Brands</>}
                </button>
              ))}
            </div>

            <SearchBar
              value={query} onChange={setQuery}
              placeholder={mode === 'brands' ? 'Search brands, categories…' : 'Search opportunities, niches…'}
            />

            {/* Filters */}
            <button onClick={openFilter}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition ${
                activeFilterCount > 0
                  ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]`
                  : 'bg-surface-sub text-ink/65 hover:bg-primary/[0.08] hover:text-primary'
              }`}>
              <SlidersIcon s={14}/>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Saved */}
            <button onClick={() => setShowSaved(s => !s)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2.5 text-[12.5px] font-semibold transition ${
                showSaved
                  ? `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)]`
                  : 'bg-surface-sub text-ink/65 hover:bg-primary/[0.08] hover:text-primary'
              }`}>
              <BookmarkIcon s={14} filled={showSaved}/>
              <span className="hidden sm:inline">Saved</span>
              {saved.length > 0 && (
                <span className={`flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${showSaved ? 'bg-white/25' : 'bg-primary/15 text-primary'}`}>
                  {saved.length}
                </span>
              )}
            </button>
          </div>

          {/* Applied filter tags */}
          {appliedTags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {appliedTags.map(tag => <AppliedFilterTag key={tag.key} label={tag.label} onRemove={tag.onRemove}/>)}
            </div>
          )}
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[1080px] px-6 py-5">

        {/* Results header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[12.5px] font-medium text-ink/50">{resultLabel}</p>
            {mode === 'opportunities' && applied.length > 0 && (
              <p className="mt-0.5 text-[11.5px] font-bold text-emerald-600">
                {applied.length} application{applied.length !== 1 ? 's' : ''} submitted ✓
              </p>
            )}
          </div>
          {mode === 'brands'
            ? <SortDropdown value={brandSort} onChange={setBrandSort} options={BRAND_SORT_OPTIONS}/>
            : <SortDropdown value={oppSort}   onChange={setOppSort}   options={OPP_SORT_OPTIONS}/>
          }
        </div>

        {/* ── BRANDS grid ── */}
        {mode === 'brands' && (
          visibleBrands.length === 0
            ? <EmptyState mode="brands" onClear={() => { setBrandFilters(EMPTY_BRAND_FILTERS); setQuery('') }}/>
            : <>
                <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleBrands.map((brand, i) => (
                    <BrandCard key={brand.id} brand={brand} delay={(i % PAGE_SIZE) * 40}
                      saved={saved.includes(brand.id)} onToggleSave={() => toggleSaved(brand.id)}
                      onView={() => router.push(`/brand/${brand.id}`)}/>
                  ))}
                </div>
                {visibleCount < sortedBrands.length && (
                  <div className="mt-8 flex justify-center">
                    <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      className="rounded-xl border border-primary/15 bg-white px-8 py-3 text-[13px] font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/[0.04]">
                      Show more brands
                    </button>
                  </div>
                )}
              </>
        )}

        {/* ── OPPORTUNITIES stacked list ── */}
        {mode === 'opportunities' && (
          visibleOpps.length === 0
            ? <EmptyState mode="opportunities" onClear={() => { setOppFilters(EMPTY_OPP_FILTERS); setQuery('') }}/>
            : <>
                <div className="space-y-3">
                  {visibleOpps.map((opp, i) => (
                    <OpportunityCard
                      key={opp.id} opp={opp} delay={(i % PAGE_SIZE) * 30}
                      saved={saved.includes(opp.id)} applied={applied.includes(opp.id)}
                      expanded={expandedId === opp.id}
                      onToggleExpand={() => setExpandedId(id => id === opp.id ? null : opp.id)}
                      onToggleSave={() => toggleSaved(opp.id)}
                      onApply={() => setApplyTarget(opp)}
                    />
                  ))}
                </div>
                {visibleCount < sortedOpps.length && (
                  <div className="mt-8 flex justify-center">
                    <button onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      className="rounded-xl border border-primary/15 bg-white px-8 py-3 text-[13px] font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/[0.04]">
                      Show more opportunities
                    </button>
                  </div>
                )}
              </>
        )}

      </main>
    </div>
  )
}