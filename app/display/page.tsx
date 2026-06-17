'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Creator portfolio — page.tsx  (Nexfluence v4, LIGHT)
   Changes:
   1. Nav pill: transparent gradient in the middle (white → transparent → white)
   2. Exclusive deals: "Signed in" badge + clickable modal with brand logo
   3. Campaign reviews: brand logo instead of reviewer photo
   4. Social icons: accurate brand SVGs (Instagram, TikTok, YouTube, etc.)
   5. Website button: separate pill below social icons with globe icon
   ════════════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const CARD = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const CARD_HOVER = 'hover:shadow-[0_2px_6px_rgba(10,6,18,0.05),0_24px_56px_-16px_rgba(139,49,232,0.30)]'

const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const CREATOR = {
  name: 'Amelia Roze', firstName: 'Amelia', initials: 'AR',
  location: 'Riga, Latvia',
  bio: "I'm a beauty & lifestyle creator who turns everyday rituals into content that sells. My videos feel like a friend's recommendation, not an ad — which is exactly why my audience acts on them. I work with brands that care about real engagement, not vanity reach.",
  genres: ['Beauty', 'Skincare', 'Lifestyle', 'Wellness'],
  coverUrl: '/test/images/Header.png',
  avatarUrl: '/test/images/Harshul.png',
  websiteUrl: 'https://ameliaroze.com',
}

const EXCLUSIVE_DEALS = [
  {
    id: 'ed1', brand: 'Red Bull', category: 'Energy Drinks', since: '2023', logoText: 'Red Bull',
    exclusive: true, color: '#E8112D', scope: 'Baltic-wide exclusivity',
    description: "Amelia is Red Bull's sole creator for energy drink content across Latvia, Lithuania & Estonia. No energy drink or stimulant brand competitors will be featured on any channel.",
    blockedCategory: 'All energy drink & stimulant brands', duration: 'Rolling annual contract',
    /* Brand logo: text-based SVG logo with brand colour */
    logo: null,
  },
  {
    id: 'ed2', brand: 'Glossé', category: 'Lip Care', since: '2024', logoText: 'Glossé',
    exclusive: false, color: '#8B31E8', scope: 'Preferred partner',
    description: 'Long-term preferred partnership for lip care content. First-look rights on all new Glossé product launches before any other creator in the region.',
    blockedCategory: null, duration: '12-month preferred deal',
    logo: null,
  },
]

const STATS = [
  { to: 142, dec: 0, suffix: 'K', label: 'Combined reach' },
  { to: 6.8, dec: 1, suffix: '%', label: 'Avg engagement' },
  { to: 3.4, dec: 1, suffix: 'M', label: 'Monthly views' },
  { to: 48, dec: 0, suffix: '+', label: 'Brand campaigns' },
]
const DEMOGRAPHICS = {
  audience: '142K',
  primaryGender: { value: '78%', label: 'Female audience' },
  primaryAge: { value: '25–34', label: 'Primary age group' },
  primaryLocation: { value: 'Latvia', label: 'Top location · 64%', flagCode: 'lv' },
  talkAbout: "I create honest beauty and skincare content — morning routines, product results filmed over real time, and lifestyle vlogs from around Riga. My audience trusts me because I only feature what I'd actually rebuy, so when I recommend something, they act on it.",
}
const BRANDS = ['Lumora', 'Kinetics', 'Glossé', 'Nordic Skin', 'Bēta Beauty', 'Aura Labs']

const PHOTOS = [
  { id: 'p1', src: '/test/images/Lecture.png', cls: 'col-span-2 md:col-span-2 md:row-span-2' },
  { id: 'p2', src: '/test/images/Listening.png', cls: 'col-span-2 md:col-span-2 md:row-span-1' },
  { id: 'p3', src: '/test/images/Kinetics-Leader.png', cls: 'col-span-1' },
  { id: 'p4', src: '/test/images/Drink.png', cls: 'col-span-1' },
  { id: 'p5', src: '/test/images/Food.png', cls: 'col-span-1' },
  { id: 'p6', src: '/test/images/Influencing.png', cls: 'col-span-1' },
  { id: 'p7', src: '/test/images/Kinetics-phone.png', cls: 'col-span-2 md:col-span-2' },
]

const COLLABORATIONS = [
  {
    id: 'c1', brand: 'Kinetics', title: 'Vitamin‑C serum launch',
    description: 'We created a 60‑second routine that showed real results over 14 days. The content focused on the glow effect, not just the ingredients.',
    target: 'Women 25‑40 interested in clean beauty', result: '3.2x ROAS, 5.8K units sold in first week',
    videoSrc: '/test/video/Drink.mp4',
    insight: 'Authentic storytelling outperformed polished ads – this campaign proved it. The raw, unfiltered shots drove 78% more engagement than our previous studio‑produced content.',
    metrics: [
      { icon: 'eye', label: 'Views', value: '1.2M' }, { icon: 'heart', label: 'Engagement', value: '8.4%' },
      { icon: 'cart', label: 'ROAS', value: '3.2×' }, { icon: 'share', label: 'Shares', value: '14.2K' },
    ],
    review: {
      rating: 5,
      quote: "Amelia delivered ahead of deadline and the results spoke for themselves — best-converting creator in our whole spring campaign. She understood the brief immediately, needed zero revisions, and the 3.2× ROAS surprised even our own performance team. We've already rebooked her twice.",
      name: 'Elena Roze', role: 'Brand Manager', company: 'Kinetics',
      brandColor: '#2563EB', brandInitials: 'KI',
      brandLogoUrl: '/test/images/brands/kinetics.png',
    },
  },
  {
    id: 'c2', brand: 'Lumora Skincare', title: 'Morning ritual with Lumora',
    description: "A get‑ready‑with‑me style video that naturally integrated Lumora's moisturiser into my daily routine. No hard sell — just honest use.",
    target: 'Skincare enthusiasts looking for hydration', result: '2.1M views, 14% engagement rate',
    videoSrc: '/test/video/Food.mp4',
    insight: 'Showing the product in a real, messy morning routine made it feel accessible. DMs were flooded with "where can I buy this?" within hours.',
    metrics: [
      { icon: 'eye', label: 'Views', value: '2.1M' }, { icon: 'heart', label: 'Engagement', value: '14%' },
      { icon: 'users', label: 'New followers', value: '+8.3K' }, { icon: 'message', label: 'DMs', value: '2.1K' },
    ],
    review: {
      rating: 5,
      quote: "Working with Amelia felt like working with a marketing partner, not a creator. She understood our product, our margins, and pitched the affiliate model herself — something none of our other creators have ever done. The morning ritual video is still our best-performing piece of content six months later.",
      name: 'Mārtiņš Ozols', role: 'Founder', company: 'Lumora Skincare',
      brandColor: '#059669', brandInitials: 'LS',
      brandLogoUrl: '/test/images/brands/lumora.png',
    },
  },
  {
    id: 'c3', brand: 'Glossé', title: 'Lip gloss layering hack',
    description: "We showed how to achieve a plump, glossy look using Glossé's new lip oil. The video went viral on TikTok within 48 hours.",
    target: 'Gen Z and millennials, beauty lovers', result: '4.5M views, 22K shares, 8.2K conversions',
    videoSrc: '/test/video/People.mp4',
    insight: 'TikTok users love hacks. By framing it as a "discovery" rather than a promo, we hit the algorithm sweet spot and gained 12K new followers from this single post.',
    metrics: [
      { icon: 'eye', label: 'Views', value: '4.5M' }, { icon: 'share', label: 'Shares', value: '22K' },
      { icon: 'cart', label: 'Conversions', value: '8.2K' }, { icon: 'users', label: 'New followers', value: '+12K' },
    ],
    review: {
      rating: 4,
      quote: "The content didn't feel like an ad — it felt like a recommendation from a trusted friend. Our DMs blew up the day it went live. We went from sceptical about influencer marketing to building our entire Q3 strategy around creators after this single campaign.",
      name: 'Anna Kalniņa', role: 'Marketing Lead', company: 'Glossé',
      brandColor: '#8B31E8', brandInitials: 'GL',
      brandLogoUrl: '/test/images/brands/glosse.png',
    },
  },
]

const BUDGETS = ['Under €350', '€350–€890', '€890–€2,500', '€2,500+', 'Affiliate only', 'Not sure yet']

/* ─── Icons ──────────────────────────────────────────────────────────── */
const Check = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const Play = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
)
const Pin = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)
const LockIcon = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const CalendarIcon = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

/* ─── Bento icons ────────────────────────────────────────────────────── */
const EyeIcon = ({ s = 26 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)
const PersonIcon = ({ s = 26 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="5" r="2.8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 7.8v1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 9c-.5 0-1.2.6-1.5 1.5L5 16h4l1 5h4l1-5h4l-1.5-5.5C17.2 9.6 16.5 9 16 9"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 9c.7-.5 1.6-.5 2.5-.5s1.8 0 2.5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const HeartPulseIcon = ({ s = 26 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 20.5S3.5 14 3.5 8a4.5 4.5 0 018.5-2 4.5 4.5 0 018.5 2c0 6-8.5 12.5-8.5 12.5z"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 12h2.3l1.5-2.8 2 5 1.5-3.5 1 1.8H18"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ChatBubbleIcon = ({ s = 40 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const LightbulbIcon = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M9 21h6M12 3a7 7 0 014.9 11.9c-.6.6-1.1 1.3-1.4 2.1H8.5c-.3-.8-.8-1.5-1.4-2.1A7 7 0 0112 3z"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

/* ─── Metric card icons ─────────────────────────────────────────────── */
const MetricEyeIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)
const HeartIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const CartIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const ShareIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const UsersIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const MessageIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
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

/* ─── Globe icon for website button ────────────────────────────────── */
const GlobeIcon = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
    <path d="M12 2c-2.8 3-4 6-4 10s1.2 7 4 10M12 2c2.8 3 4 6 4 10s-1.2 7-4 10M2 12h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

/* ─── Social platform PNG icons ──────────────────────────────────────
   Icons are loaded from /public/icons/social/ as PNG files.
   Drop your PNGs there with these exact filenames and they render
   inside the same hover-lift button as before.
   The <img> is 20×20, object-contain, inheriting the button's colour
   treatment via CSS filter on hover (white tint handled by the button
   gradient overlay, not the image itself — so use full-colour PNGs). */
function SocialPngIcon({ src, label }: { src: string; label: string }) {
  return (
    <img
      src={src}
      alt={label}
      width={20}
      height={20}
      className="h-5 w-5 object-contain"
      draggable={false}
    />
  )
}

/* Social links — website intentionally excluded (shown as a separate button below).
   Set href to the real profile URL. Icon src points to your PNG in /public/icons/social/. */
const SOCIAL_LINKS: { key: string; label: string; href: string; icon: ReactNode }[] = [
  { key: 'instagram', label: 'Instagram',   href: '#', icon: <SocialPngIcon src="/icons/social/instagram.png" label="Instagram" /> },
  { key: 'tiktok',    label: 'TikTok',      href: '#', icon: <SocialPngIcon src="/icons/social/tiktok.png"    label="TikTok" /> },
  { key: 'youtube',   label: 'YouTube',     href: '#', icon: <SocialPngIcon src="/icons/social/youtube.png"   label="YouTube" /> },
  { key: 'snapchat',  label: 'Snapchat',    href: '#', icon: <SocialPngIcon src="/icons/social/snapchat.png"  label="Snapchat" /> },
  { key: 'twitter',   label: 'Twitter / X', href: '#', icon: <SocialPngIcon src="/icons/social/x.png"         label="Twitter / X" /> },
  { key: 'linkedin',  label: 'LinkedIn',    href: '#', icon: <SocialPngIcon src="/icons/social/linkedin.png"  label="LinkedIn" /> },
  { key: 'facebook',  label: 'Facebook',    href: '#', icon: <SocialPngIcon src="/icons/social/facebook.png"  label="Facebook" /> },
]

/* ─── Gradient stars ─────────────────────────────────────────────────── */
function GradientStars({ rating, total = 5, size = 28 }: { rating: number; total?: number; size?: number }) {
  const fillId   = 'nex-star-fill'
  const strokeId = 'nex-star-stroke'
  const STAR = 'M12 2l2.8 6.2 6.8.6-5 4.5 1.5 6.7L12 16.5l-6.1 3.5 1.5-6.7-5-4.5 6.8-.6z'
  return (
    <div className="flex items-center gap-2">
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id={fillId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#8B31E8" />
            <stop offset="55%"  stopColor="#A855F7" />
            <stop offset="100%" stopColor="#FF33BC" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#8B31E8" />
            <stop offset="55%"  stopColor="#A855F7" />
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
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
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
      if (!e.isIntersecting) return; io.disconnect()
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
    <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      alt={code.toUpperCase()} className={`inline-block rounded-[4px] object-cover ${className}`} width={28} height={18} />
  )
}

function NexLogo({ height = 28, className = '' }: { height?: number; className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" height={height} className={`object-contain ${className}`} style={{ height }} />
}

/* ─── Brand Logo tile ────────────────────────────────────────────────
   Used in the partnerships modal and in campaign review cards.
   Priority: brandLogoUrl image → colour-tinted initials fallback.
   The image version uses object-contain so logos with transparent
   backgrounds render cleanly without cropping.                       */
function BrandLogo({
  name, color, logoUrl, initials, size = 56,
}: { name: string; color: string; logoUrl?: string | null; initials?: string; size?: number }) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (logoUrl) {
    return (
      <div
        className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm"
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-contain p-1"
          draggable={false}
        />
      </div>
    )
  }
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white shadow-sm"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {abbr}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Partnerships Modal
   Single modal showing ALL deals as cards — scrollable.
   Opened by the one "View Brand Partnerships" button on the page.
   ════════════════════════════════════════════════════════════════════ */
function PartnershipsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-primary/10 bg-white px-7 py-5">
          <div>
            <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">Brand Partnerships</h3>
            <p className="mt-0.5 text-[12px] text-ink/45">{EXCLUSIVE_DEALS.length} active {EXCLUSIVE_DEALS.length === 1 ? 'partnership' : 'partnerships'}</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sub text-ink/45 transition hover:bg-surface-card hover:text-ink text-[13px]">
            ✕
          </button>
        </div>

        {/* Scrollable cards */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
          {EXCLUSIVE_DEALS.map(deal => (
            <div
              key={deal.id}
              className={`rounded-2xl border bg-white p-5 ${CARD} ${deal.exclusive ? 'border-primary/20' : 'border-primary/10'}`}
              style={{ background: `linear-gradient(135deg, ${deal.color}0a 0%, transparent 60%)` }}
            >
              {/* Card header: logo + name + badges */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <BrandLogo name={deal.brand} color={deal.color} logoUrl={deal.logo} initials={deal.logoText} size={48} />
                  <div>
                    <span className="text-[18px] font-black tracking-[-0.03em] block leading-tight" style={{ color: deal.color }}>{deal.logoText}</span>
                    <span className="text-[12px] font-semibold text-ink/50">{deal.scope}</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {deal.exclusive
                    ? <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${GRAD_BTN} text-white`}>Exclusive</span>
                    : <span className="rounded-md border border-primary/20 bg-primary/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">Preferred</span>
                  }
                  <span className="rounded-md border border-primary/12 bg-primary/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary/70">{deal.category}</span>
                </div>
              </div>

              <p className="text-[13px] leading-[1.75] text-ink/65">{deal.description}</p>

              {/* Meta row */}
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

              {/* Signed-in confirmation strip */}
              <div className="mt-3.5 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  <Check s={12} />
                </span>
                <span className="text-[12px] font-semibold text-green-800">
                  {deal.exclusive ? 'Signed in — Exclusive Partner' : 'Signed in — Preferred Partner'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky footer */}
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
  const [modal, setModal] = useState<'inquiry' | 'message' | null>(null)
  const [partnershipsOpen, setPartnershipsOpen] = useState(false)
  const c = CREATOR
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const NAV_LEFT  = [{ label: 'About', action: () => scrollTo('about') }, { label: 'Matrix', action: () => scrollTo('matrix') }]
  const NAV_RIGHT = [{ label: 'Work',  action: () => scrollTo('work')  }, { label: 'Contact', action: () => setModal('message') }]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════════ HEADER ════════ */}
      <header className="relative">
        {/* Cover */}
        <div
          className="relative h-[260px] w-full overflow-hidden bg-gradient-to-br from-primary/30 via-primary-lt/25 to-magenta/30 sm:h-[320px] md:h-[360px]"
          style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!c.coverUrl && <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold uppercase tracking-[0.2em] text-white/55">Cover image</span>}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-canvas/30" />
        </div>

        {/* ── NAV PILL ──────────────────────────────────────────────────────
            The pill itself has NO background and NO blur. Instead a separate
            absolutely-positioned layer behind the buttons carries BOTH the
            white fill and the backdrop-blur, and that whole layer is masked
            with a horizontal gradient:
              • Sides (0–22% / 78–100%): mask fully opaque → white + blur show
              • Centre (34–66%): mask = 0 → layer is clipped away entirely,
                so there is no fill AND no blur — the cover image is 100% clear
              • 22–34% / 66–78%: smooth fade between the two
            Putting the blur on the masked layer (not the pill) is the key:
            where the mask hits 0 the blur disappears too, so the middle is
            real transparency, not frosted/grey glass.                       */}
        <div
          className="absolute inset-x-0 z-40 flex justify-center px-4"
          style={{ top: 28 }}
        >
          <div className="w-full max-w-[600px]">
            <div
              className="relative flex w-full items-center justify-between rounded-2xl px-4 py-3"
              style={{ overflow: 'visible', border: 'none', boxShadow: 'none' }}
            >
              {/* Masked fill + blur layer — sits behind the nav buttons.
                  The mask clips both the white tint and the blur in the centre. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.88) 70%, rgba(255,255,255,0.88) 100%)',
                  WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                  maskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)',
                }}
              />

              {/* Left nav */}
              <div className="relative z-10 flex items-center gap-0.5">
                {NAV_LEFT.map(n => (
                  <button key={n.label} onClick={n.action}
                    className="rounded-lg px-4 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary">
                    {n.label}
                  </button>
                ))}
              </div>

              {/* Centre spacer */}
              <div className="w-16 flex-shrink-0" aria-hidden="true" />

              {/* Right nav */}
              <div className="relative z-10 flex items-center gap-0.5">
                {NAV_RIGHT.map(n => (
                  <button key={n.label} onClick={n.action}
                    className="rounded-lg px-4 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary">
                    {n.label}
                  </button>
                ))}
              </div>

              {/* LOGO — absolute, out of flex flow */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
                <NexLogo
                  height={144}
                  className="pointer-events-auto drop-shadow-[0_6px_24px_rgba(139,49,232,0.65)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SQUARE AVATAR */}
        <div className="mx-auto -mt-20 flex max-w-[1080px] flex-col items-center px-6 sm:-mt-24">
          <div
            className={`relative z-20 h-36 w-36 overflow-hidden rounded-2xl border-4 border-white ${GRAD_BTN} shadow-[0_16px_44px_-12px_rgba(139,49,232,0.45)] sm:h-44 sm:w-44`}
            style={c.avatarUrl ? { backgroundImage: `url(${c.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {!c.avatarUrl && <span className="flex h-full w-full items-center justify-center text-5xl font-black text-white">{c.initials}</span>}
          </div>
          <h1 className="mt-5 inline-flex items-center gap-3 text-[clamp(34px,6vw,56px)] font-black leading-none tracking-[-0.045em] text-ink">
            {c.name}
            {/* Verified blue tick — matches the scale of the name */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-label="Verified"
              className="inline-block flex-shrink-0"
              style={{ width: 'clamp(26px,3.6vw,38px)', height: 'clamp(26px,3.6vw,38px)', marginBottom: '0.06em' }}
            >
              {/* Filled blue badge */}
              <path
                d="M12 2l2.4 1.8 3-.4 1.2 2.8 2.8 1.2-.4 3L22 12l-1.8 2.4.4 3-2.8 1.2-1.2 2.8-3-.4L12 22l-2.4-1.8-3 .4-1.2-2.8-2.8-1.2.4-3L2 12l1.8-2.4-.4-3 2.8-1.2L7.4 2.6l3 .4z"
                fill="#1D9BF0"
              />
              {/* White check */}
              <path
                d="M8 12.5l2.5 2.5 5.5-5.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </h1>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink/60"><span className="text-primary"><Pin /></span>Based in {c.location}</p>

          {/* Social icons — accurate brand SVGs */}
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {SOCIAL_LINKS.map(s => (
              <a key={s.key} href={s.href} aria-label={s.label} title={s.label}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/12 bg-white text-primary transition hover:-translate-y-1 hover:border-transparent hover:bg-gradient-to-br hover:from-primary hover:to-primary-lt hover:text-white hover:shadow-[0_12px_28px_-8px_rgba(139,49,232,0.4)]">
                {s.icon}
              </a>
            ))}
          </div>

          {/* ── Website button — separate pill below social icons ────────── */}
          {c.websiteUrl && (
            <a
              href={c.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2.5 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-[13.5px] font-semibold text-primary shadow-[0_2px_10px_-4px_rgba(139,49,232,0.18)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_rgba(139,49,232,0.30)]"
            >
              <GlobeIcon s={16} />
              <span>ameliaroze.com</span>
              {/* External link arrow */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-40">
                <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}

          {/* ── Brand partnerships — single trigger button ───────────────
              No deal cards on the page. One button opens the modal that
              shows all deals as cards.                                   */}
          {EXCLUSIVE_DEALS.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setPartnershipsOpen(true)}
                className={`inline-flex items-center gap-2.5 rounded-xl ${GRAD_BTN} px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-6px_rgba(139,49,232,0.6)]`}
              >
                <Check s={14} />
                View Brand Partnerships &amp; Exclusivities
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ════════ ABOUT ════════ */}
      <section id="about" className="py-16">
        <div className="mx-auto max-w-[640px] px-6 text-center">
          <SectionHead kicker="Nice to meet you">The person <G>behind the feed</G></SectionHead>
          <Reveal delay={80}>
            <p className="mt-6 text-[clamp(16px,2vw,18px)] leading-[1.85] text-ink/70">{c.bio}</p>
            <button onClick={() => setModal('message')}
              className={`mt-7 rounded-lg ${GRAD_BTN} px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>
              Contact me
            </button>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {c.genres.map(g => <span key={g} className="rounded-lg border border-primary/15 bg-white px-4 py-2 text-[13px] font-semibold text-primary">{g}</span>)}
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal className="pb-6 text-center">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">Trusted by brands across the Baltics</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
          <div className="flex w-max gap-16 animate-marquee hover:[animation-play-state:paused]">
            {[...BRANDS, ...BRANDS].map((b, i) => <span key={i} className="whitespace-nowrap text-[22px] font-extrabold tracking-[-0.03em] text-ink/35 transition hover:text-primary">{b}</span>)}
          </div>
        </div>
      </Reveal>

      {/* ════════ MATRIX ════════ */}
      <section id="matrix" className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="The matrix" className="mb-9">Audience, by the <G>numbers</G></SectionHead>
          <Reveal>
            <div className={`grid grid-cols-2 gap-x-4 gap-y-7 rounded-2xl border border-primary/10 bg-white p-9 sm:grid-cols-4 sm:gap-4 ${CARD} [&>*:not(:last-child)]:sm:border-r [&>*:not(:last-child)]:sm:border-primary/8`}>
              {STATS.map(s => <Stat key={s.label} {...s} />)}
            </div>
          </Reveal>

          <div className="mt-5 grid auto-rows-[minmax(140px,auto)] grid-cols-2 gap-4 md:grid-cols-4">
            <Reveal className="col-span-2 row-span-2 md:col-span-2">
              <div className={`relative flex h-full flex-col rounded-2xl border border-primary/10 bg-white p-7 ${CARD}`}>
                <div className="absolute right-5 top-5 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/12 bg-surface-sub text-primary">
                  <ChatBubbleIcon s={32} />
                </div>
                <span className="inline-flex w-fit items-center rounded-lg bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">What I talk about</span>
                <div className="flex-1" />
                <p className="text-[15px] leading-[1.8] text-ink/70">{DEMOGRAPHICS.talkAbout}</p>
              </div>
            </Reveal>
            <BentoStat delay={60} value={DEMOGRAPHICS.primaryGender.value} label={DEMOGRAPHICS.primaryGender.label} topRightIcon={<PersonIcon s={26} />} />
            <BentoStat delay={120} value={DEMOGRAPHICS.primaryAge.value} label={DEMOGRAPHICS.primaryAge.label} topRightIcon={<HeartPulseIcon s={26} />} />
            <BentoStat delay={180} value={DEMOGRAPHICS.audience} label="Total followers" topRightIcon={<EyeIcon s={26} />} />
            <BentoStat delay={240} value={DEMOGRAPHICS.primaryLocation.value} label={DEMOGRAPHICS.primaryLocation.label}
              topRightIcon={<CountryFlag code={DEMOGRAPHICS.primaryLocation.flagCode} className="h-[18px] w-[28px]" />} />
          </div>
        </div>
      </section>

      {/* ════════ WORK ════════ */}
      <section id="work" className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="My work" className="mb-10">Photos <span className="font-light text-ink/35">&amp;</span> <G>reels</G></SectionHead>
          <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[170px] md:grid-cols-4">
            {PHOTOS.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60} className={p.cls}>
                <div className={`group relative h-full w-full overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 via-primary-lt/10 to-magenta/15 ${CARD}`}>
                  {p.src ? <img src={p.src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    : <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">Photo</span>}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12"><CollaborationCarousel collaborations={COLLABORATIONS} /></Reveal>
        </div>
      </section>

      {/* ════════ WAYS TO WORK ════════ */}
      <section className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="Let's deal" className="mb-10" sub="Three clear ways to collaborate — pick what fits, or mix them.">
            Ways to work <G>together</G>
          </SectionHead>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <WorkModel delay={0} name="Affiliate / Revenue Share" price="10–20%" priceLabel="per sale"
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              features={['Lower or zero upfront','Earn a cut of every sale','Incentives fully aligned','Trackable codes & links']}
              description="My favourite model. I only win when you do." popular={true} onChoose={() => setModal('inquiry')} />
            <WorkModel delay={90} name="Paid Campaigns" price="From €350" priceLabel="per video"
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="6" width="19" height="12" rx="2.5" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="2" /></svg>}
              features={['Flat fee per deliverable','You brief, I produce','Full usage rights included','Fast turnaround']}
              description="Straightforward, predictable pricing." popular={false} onChoose={() => setModal('inquiry')} />
            <WorkModel delay={180} name="Barter / Gifting" price="€120+" priceLabel="product value"
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M4 8l4-4 4 4M20 16l-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 4v9a3 3 0 003 3h2M16 20v-9a3 3 0 00-3-3h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
              features={['Product-for-content exchange','Select premium items only','I genuinely use what I promote','Limited spots available']}
              description="For brands with products I'd honestly love." popular={false} onChoose={() => setModal('inquiry')} />
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="bg-ink px-6 pb-0 pt-14">
        <div className="mx-auto max-w-[900px]">
          <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-center sm:gap-14">
            <div className="flex-shrink-0">
              <div className="h-44 w-44 overflow-hidden rounded-2xl border-4 border-white shadow-[0_20px_50px_-12px_rgba(139,49,232,0.55)]"
                style={c.avatarUrl ? { backgroundImage: `url(${c.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                {!c.avatarUrl && <span className={`flex h-full w-full items-center justify-center text-5xl font-black text-white ${GRAD_BTN}`}>{c.initials}</span>}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-[clamp(26px,4.5vw,42px)] font-black leading-[1.08] tracking-[-0.04em] text-white">
                Let's make something <span className={GRAD_TEXT}>that sells.</span>
              </h2>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-white/55">
                Tell me about your product and your goal. One message — I reply within 48 hours.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <button onClick={() => setModal('inquiry')}
                  className={`rounded-xl ${GRAD_BTN} px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_32px_-8px_rgba(139,49,232,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-8px_rgba(139,49,232,0.7)]`}>
                  Work with me via Creator Nexus
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
              Create Your Own Creator Profile on Nexus and Get Discovered by Brands
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-[150] flex gap-2.5 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <button onClick={() => setModal('message')} className="flex-1 rounded-lg border-[1.5px] border-primary/15 bg-white py-3 text-sm font-bold text-ink">Message</button>
        <button onClick={() => setModal('inquiry')} className={`flex-[1.6] rounded-lg ${GRAD_BTN} py-3 text-sm font-bold text-white`}>Work with me</button>
      </div>

      {/* Modals */}
      <ContactModal open={modal !== null} type={modal ?? 'message'} slug="amelia-roze" firstName={c.firstName} onClose={() => setModal(null)} />
      <PartnershipsModal open={partnershipsOpen} onClose={() => setPartnershipsOpen(false)} />
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

/* ─── Collaboration Carousel ────────────────────────────────────────── */
function CollaborationCarousel({ collaborations }: { collaborations: typeof COLLABORATIONS }) {
  const [current, setCurrent] = useState(0)
  const total = collaborations.length
  const prev = () => setCurrent(c => (c > 0 ? c - 1 : c))
  const next = () => setCurrent(c => (c < total - 1 ? c + 1 : c))
  const item = collaborations[current]

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
            <span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">Featured collaboration</span>
            <span className="text-xs font-medium text-ink/40">#{current + 1}</span>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">
              We collaborated with <span className={GRAD_TEXT}>{item.brand}</span>
            </h3>
            <p className="mt-1 text-lg font-semibold text-ink/80">{item.title}</p>
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

      {/* ── Campaign review card — brand logo replaces reviewer photo ──── */}
      {item.review && (
        <div className={`mt-4 w-full rounded-2xl border border-primary/10 bg-white px-7 py-6 ${CARD}`}>
          <div className="mb-4 flex items-center gap-4">
            <GradientStars rating={item.review.rating} total={5} size={28} />
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink/35">
              {item.review.rating}/5 · Campaign review
            </span>
          </div>
          <p className="text-[15.5px] leading-[1.85] text-ink/75 sm:text-[16px]">"{item.review.quote}"</p>
          <div className="mt-5 flex items-center gap-3 border-t border-primary/10 pt-4">
            {/* Brand logo image — path set per-collaboration in COLLABORATIONS[].review.brandLogoUrl */}
            <BrandLogo
              name={item.review.company}
              color={item.review.brandColor}
              logoUrl={item.review.brandLogoUrl}
              initials={item.review.brandInitials}
              size={44}
            />
            <div>
              <div className="text-[14px] font-bold text-ink">{item.review.name}</div>
              <div className="mt-0.5 text-[12px] text-ink/50">{item.review.role} · {item.review.company}</div>
            </div>
          </div>
        </div>
      )}
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
        <div className={`mb-4 flex items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_8px_20px_-6px_rgba(139,49,232,0.5)] ${popular ? 'h-16 w-16' : 'h-14 w-14'}`}>{icon}</div>
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
function ContactModal({ open, type, slug, firstName, onClose }: { open: boolean; type: 'inquiry' | 'message'; slug: string; firstName: string; onClose: () => void }) {
  const isInq = type === 'inquiry'
  const [form, setForm] = useState({ name: '', company: '', email: '', message: '' })
  const [budget, setBudget] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ok = form.name.trim() && form.email.trim() && form.message.trim()
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; setSent(false); setError(''); setForm({ name: '', company: '', email: '', message: '' }); setBudget('') }
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
        body: JSON.stringify({ type: isInq ? 'inquiry' : 'message', senderName: form.name, senderCompany: form.company, senderEmail: form.email, message: form.message, budget }) })
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
          <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{sent ? 'Message sent!' : isInq ? 'Work with me' : 'Send a message'}</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sub text-base text-ink/50 transition hover:bg-surface-card hover:text-ink">✕</button>
        </div>
        <div className="p-6">
          {sent ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/12 text-green-500"><Check s={30} /></div>
              <h3 className="mb-2 text-xl font-extrabold text-ink">{isInq ? "You're in the inbox!" : 'Message sent!'}</h3>
              <p className="mx-auto max-w-[340px] text-sm leading-[1.7] text-ink/65">{form.name && `Thanks, ${form.name.split(' ')[0]} — `}{firstName} will reply to <b className="text-primary">{form.email || 'your email'}</b> within 48 hours.</p>
              <button onClick={onClose} className={`mx-auto mt-6 rounded-lg ${GRAD_BTN} px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5`}>Done</button>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm leading-[1.6] text-ink/65">{isInq ? "Tell me about your product and goal — I'll reply with a tailored quote within 48 hours." : 'Introduce yourself and tell me what you have in mind. I read every message.'}</p>
              {error && <div className="mb-4 rounded-lg border border-primary/40 bg-primary/[0.06] px-3 py-2 text-[13px] text-primary">{error}</div>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className={lbl}>Your name *</label><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" /></div>
                <div><label className={lbl}>Company</label><input className={inp} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Brand Co." /></div>
              </div>
              <div className="mt-4"><label className={lbl}>Email address *</label><input type="email" className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@brand.com" /></div>
              {isInq && (
                <div className="mt-4"><label className={lbl}>Budget range</label>
                  <div className="flex flex-wrap gap-2">{BUDGETS.map(b => <button key={b} type="button" onClick={() => setBudget(b)} className={`rounded-lg border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition ${budget === b ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>{b}</button>)}</div>
                </div>
              )}
              <div className="mt-4"><label className={lbl}>{isInq ? 'About your project *' : 'Your message *'}</label>
                <textarea className={`${inp} min-h-[108px] resize-y leading-relaxed`} value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder={isInq ? "What are you promoting? What's the goal?" : `Hi ${firstName}, I'm reaching out because…`} />
              </div>
              <button onClick={submit} disabled={!ok || loading}
                className={`mt-5 w-full rounded-lg ${GRAD_BTN} py-3.5 text-[15px] font-bold text-white shadow-[0_8px_28px_-6px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-surface-card disabled:bg-none disabled:text-ink/30 disabled:shadow-none disabled:hover:translate-y-0`}>
                {loading ? 'Sending…' : `Send ${isInq ? 'inquiry' : 'message'}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}