'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Brand Preview — app/brand/preview/page.tsx  (Nexfluence v4, LIGHT)
   Wraps the exact brand profile with a sticky preview banner.
   Publish → confirm dialog → share dialog (same pattern as creator).
   ════════════════════════════════════════════════════════════════════ */

const API        = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:5000'
const CARD       = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const CARD_HOVER = 'hover:shadow-[0_2px_6px_rgba(10,6,18,0.05),0_24px_56px_-16px_rgba(139,49,232,0.30)]'
const GRAD_BTN   = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const BRAND_SLUG   = 'kinetics'
const PUBLISHED_URL = `https://nexus.nexfluence.eu/brand/${BRAND_SLUG}`

/* ════════════════════════════════════════════════════════════════════
   SHARE PLATFORMS
   ════════════════════════════════════════════════════════════════════ */
const SHARE_PLATFORMS = [
  {
    id: 'whatsapp', label: 'WhatsApp', color: '#25D366', bg: '#e8fdf0',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/></svg>,
    href: (url: string) => `https://wa.me/?text=${encodeURIComponent(url)}`,
  },
  {
    id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', bg: '#eef4fc',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'twitter', label: 'X / Twitter', color: '#000000', bg: '#f5f5f5',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    href: (url: string, text?: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? '')}`,
  },
  {
    id: 'facebook', label: 'Facebook', color: '#1877F2', bg: '#eef3fd',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'telegram', label: 'Telegram', color: '#26A5E4', bg: '#eef8fd',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
    href: (url: string, text?: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? '')}`,
  },
  {
    id: 'email', label: 'Email', color: '#6B7280', bg: '#f5f5f5',
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>,
    href: (url: string) => `mailto:?subject=Check out this brand on Creator Nexus&body=Hey, thought you'd find this interesting: ${url}`,
  },
]

/* ════════════════════════════════════════════════════════════════════
   SHARE DIALOG
   ════════════════════════════════════════════════════════════════════ */
function ShareDialog({ open, onClose, url }: { open: boolean; onClose: () => void; url: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const input = document.getElementById('brand-share-url') as HTMLInputElement | null
      input?.select()
    }
  }

  const shareText = 'Check out this brand on Creator Nexus 🚀'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[700] flex items-end justify-center sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD}`}>

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-ink/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-4">
          <h3 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">Share your brand profile</h3>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10 text-[15px]">✕</button>
        </div>

        <div className="px-6 pb-8 pt-5">
          {/* Copy link row */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-primary/12 bg-surface-sub p-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-primary">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input id="brand-share-url" readOnly value={url}
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink/70 outline-none"
                onFocus={e => e.target.select()} />
            </div>
            <button onClick={copyLink}
              className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-bold transition ${
                copied ? 'bg-emerald-500 text-white' : `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`
              }`}>
              {copied
                ? <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Copied!</span>
                : 'Copy link'}
            </button>
          </div>

          {/* Platform grid */}
          <p className="mb-4 mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/35">Share to</p>
          <div className="grid grid-cols-4 gap-3">
            {SHARE_PLATFORMS.map(p => {
              const href = p.href(url, shareText)
              return (
                <button key={p.id} onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
                  title={`Share on ${p.label}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl p-3 transition hover:bg-surface-sub active:scale-95">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl transition duration-200 group-hover:scale-110"
                    style={{ background: p.bg, color: p.color }}>
                    {p.icon}
                  </span>
                  <span className="text-center text-[11px] font-semibold leading-tight text-ink/60">{p.label}</span>
                </button>
              )
            })}
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={() => navigator.share({ title: `Creator Nexus — ${BRAND_SLUG}`, url, text: shareText }).catch(() => {})}
              className="mt-4 w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-primary transition hover:-translate-y-0.5 hover:bg-primary/[0.04]">
              More options…
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PUBLISH CONFIRM DIALOG
   ════════════════════════════════════════════════════════════════════ */
function PublishConfirmDialog({ open, onClose, onConfirm, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean
}) {
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl bg-white p-8 text-center ${CARD}`}>
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.45)]`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="text-[22px] font-extrabold tracking-[-0.03em] text-ink">Ready to go live?</h3>
        <p className="mx-auto mt-3 max-w-[300px] text-[14px] leading-[1.7] text-ink/55">
          Your brand profile will be published to{' '}
          <span className="font-bold text-primary">{PUBLISHED_URL}</span>{' '}
          and visible to creators across the platform.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button onClick={onConfirm} disabled={loading}
            className={`w-full rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 disabled:opacity-60`}>
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>
                  Publishing…
                </span>
              : 'Yes, publish it 🚀'}
          </button>
          <button onClick={onClose}
            className="w-full rounded-xl border border-primary/15 bg-white py-3.5 text-[14px] font-bold text-ink/60 transition hover:bg-surface-sub">
            Keep editing
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PREVIEW BANNER
   ════════════════════════════════════════════════════════════════════ */
function PreviewBanner({ onPublish, isPublished }: { onPublish: () => void; isPublished: boolean }) {
  return (
    <div className="sticky top-0 z-[500] flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">

      {/* Left */}
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </span>
        <div>
          <p className="text-[13px] font-bold text-amber-800">
            Preview mode
            <span className="ml-2 rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-amber-700">
              Not published
            </span>
          </p>
          <p className="hidden text-[11.5px] text-amber-600/80 sm:block">
            This is exactly how creators will see your brand profile. Happy with it? Hit Publish.
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {/* Back to studio */}
        <a href="/studio/brand"
          className="hidden items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-[12.5px] font-bold text-amber-700 transition hover:bg-amber-50 sm:flex">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Studio
        </a>
        {/* Go to dashboard */}
        <a href="/dashboard/brand"
          className="hidden items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-[12.5px] font-bold text-amber-700 transition hover:bg-amber-50 sm:flex">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          Dashboard
        </a>
        {/* Publish */}
        {isPublished
          ? <div className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-[13px] font-bold text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Published!
            </div>
          : <button onClick={onPublish}
              className={`flex items-center gap-2 rounded-lg ${GRAD_BTN} px-4 py-2 text-[13px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Publish
            </button>
        }
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   BRAND PROFILE — all data identical to the public brand page
   ════════════════════════════════════════════════════════════════════ */

const BRAND = {
  name: 'Kinetics', initials: 'KI',
  location: 'Riga, Latvia · Shipping Baltic-wide',
  bio: "We make clean, science-backed sports nutrition for people who train hard and don't have time for hype. Every formula is third-party tested and every claim is one we'll actually show you the study for. We partner with creators who use what they post about — not models holding a shaker bottle.",
  categories: ['Sports Nutrition', 'Energy', 'Performance', 'Recovery'],
  coverUrl: '/test/images/Kinetics-Leader.png',
  avatarUrl: '/test/images/Harshul.png',
  websiteUrl: 'https://kinetics.lv',
}

const BRAND_PERSONA = {
  caters_to: 'Active adults who train consistently and care about what goes in their body — from competitive gym-goers to weekend endurance athletes.',
  age_range: '24 – 38',
  gender: { male: 62, female: 38 },
  top_locations: [
    { country: 'Latvia',    flagCode: 'lv', pct: 48 },
    { country: 'Lithuania', flagCode: 'lt', pct: 31 },
    { country: 'Estonia',   flagCode: 'ee', pct: 21 },
  ],
  primary_niche: 'Fitness & Sports Nutrition',
  avg_creator_duration: '9 months',
  active_creators: 34,
  conversion_rate: '4.2%',
  avg_engagement: '7.8%',
}

const BRAND_STATS = [
  { to: 380, dec: 0, suffix: '€', label: 'Avg. paid / piece'  },
  { to: 15,  dec: 0, suffix: '%', label: 'Avg. commission'    },
  { to: 34,  dec: 0, suffix: '',  label: 'Active creators'    },
  { to: 24,  dec: 0, suffix: 'h', label: 'Avg. response time' },
]

const GALLERY_IMAGES = [
  { id: 'g1', src: '/test/images/Lecture.png'         },
  { id: 'g2', src: '/test/images/Listening.png'       },
  { id: 'g3', src: '/test/images/Kinetics-Leader.png' },
  { id: 'g4', src: '/test/images/Drink.png'            },
  { id: 'g5', src: '/test/images/Food.png'             },
  { id: 'g6', src: '/test/images/Influencing.png'      },
]
const GALLERY_VIDEO_SRC = '/test/video/Drink.mp4'

const CAMPAIGNS = [
  {
    id: 'cm1', creator: 'Amelia Roze', handle: '@amelia.roze', niche: 'Beauty & Lifestyle',
    title: 'Vitamin-C recovery stack launch',
    description: 'A 60-second routine showing real recovery results over 14 days of training. The content focused on how the stack felt the next morning, not just the ingredient list.',
    target: 'Women 25–40 interested in clean recovery', result: '3.2x ROAS, 5.8K units sold in first week',
    videoSrc: '/test/video/Drink.mp4',
    insight: 'Authentic, lived-in storytelling outperformed our polished studio ads — this campaign proved it. Unfiltered, real-time shots drove 78% more engagement than anything we produced in-house.',
    metrics: [
      { icon: 'eye',   label: 'Views',      value: '1.2M'  },
      { icon: 'heart', label: 'Engagement', value: '8.4%'  },
      { icon: 'cart',  label: 'ROAS',       value: '3.2×'  },
      { icon: 'share', label: 'Shares',     value: '14.2K' },
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
      { icon: 'eye',     label: 'Views',        value: '2.1M' },
      { icon: 'heart',   label: 'Engagement',   value: '14%'  },
      { icon: 'users',   label: 'New followers', value: '+8.3K'},
      { icon: 'message', label: 'DMs',           value: '2.1K' },
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
      { icon: 'eye',   label: 'Views',        value: '4.5M' },
      { icon: 'share', label: 'Shares',       value: '22K'  },
      { icon: 'cart',  label: 'Conversions',  value: '8.2K' },
      { icon: 'users', label: 'New followers', value: '+12K' },
    ],
  },
]

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

/* ──────────────── Icons ──────────────── */
function Check({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function Shield({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ZapIcon({ s = 28 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function HandshakeIcon({ s = 28 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 3l1 11h-2M3 3l-1 11 6.5 6.5a1 1 0 103-3M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function Play({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> }
function Pin({ s = 15 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6"/></svg> }
function LightbulbIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21h6M12 3a7 7 0 014.9 11.9c-.6.6-1.1 1.3-1.4 2.1H8.5c-.3-.8-.8-1.5-1.4-2.1A7 7 0 0112 3z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function CalendarIcon({ s = 13 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg> }
function GlobeIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6"/><path d="M12 2c-2.8 3-4 6-4 10s1.2 7 4 10M12 2c2.8 3 4 6 4 10s-1.2 7-4 10M2 12h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }
function UsersIcon({ s = 26 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ChatBubbleIcon({ s = 32 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function MetricEyeIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function HeartIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CartIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ShareIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function MessageIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }

function MetricIcon({ name, s = 18 }: { name: string; s?: number }) {
  switch (name) {
    case 'eye':     return <MetricEyeIcon s={s} />
    case 'heart':   return <HeartIcon s={s} />
    case 'cart':    return <CartIcon s={s} />
    case 'share':   return <ShareIcon s={s} />
    case 'users':   return <UsersIcon s={s} />
    case 'message': return <MessageIcon s={s} />
    default:        return <MetricEyeIcon s={s} />
  }
}

function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`} /> // eslint-disable-line @next/next/no-img-element
}

const SOCIAL_LINKS = [
  { key: 'instagram', label: 'Instagram', href: '#', src: '/Socials/Instagram.svg' },
  { key: 'tiktok',    label: 'TikTok',    href: '#', src: '/Socials/TikTok.svg'    },
  { key: 'youtube',   label: 'YouTube',   href: '#', src: '/Socials/YouTube.svg'   },
  { key: 'linkedin',  label: 'LinkedIn',  href: '#', src: '/Socials/LinkedIn.svg'  },
  { key: 'facebook',  label: 'Facebook',  href: '#', src: '/Socials/Facebook.svg'  },
]

function GradientStars({ rating, total = 5, size = 22, idSuffix = '' }: { rating: number; total?: number; size?: number; idSuffix?: string }) {
  const fillId = `bp-star-fill${idSuffix}`, strokeId = `bp-star-stroke${idSuffix}`
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
          {i < rating
            ? <><path d={STAR} fill={`url(#${fillId})`} stroke="white" strokeWidth="3" strokeLinejoin="round" paintOrder="stroke"/><path d={STAR} fill="none" stroke={`url(#${strokeId})`} strokeWidth="1.6" strokeLinejoin="round"/></>
            : <><path d={STAR} fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round"/><path d={STAR} fill="none" stroke={`url(#${strokeId})`} strokeWidth="1.6" strokeLinejoin="round" opacity="0.35"/></>
          }
        </svg>
      ))}
    </div>
  )
}

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

function CountryFlag({ code, className = '' }: { code: string; className?: string }) {
  return <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`} alt={code.toUpperCase()} className={`inline-block rounded-[4px] object-cover ${className}`} width={28} height={18} /> // eslint-disable-line @next/next/no-img-element
}

function PersonAvatar({ name, color, avatarUrl, initials, size = 48 }: { name: string; color: string; avatarUrl?: string | null; initials?: string; size?: number }) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatarUrl) return <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-sm" style={{ width: size, height: size }}><img src={avatarUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" draggable={false}/></div> // eslint-disable-line @next/next/no-img-element
  return <div className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-sm" style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>{abbr}</div>
}

function PersonaBento() {
  const p = BRAND_PERSONA
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Reveal className="col-span-2 row-span-2">
        <div className={`relative flex h-full min-h-[220px] flex-col rounded-2xl border border-primary/10 bg-white p-7 ${CARD}`}>
          <div className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/12 bg-surface-sub text-primary"><ChatBubbleIcon s={26}/></div>
          <span className="inline-flex w-fit items-center rounded-lg bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">What we cater to</span>
          <div className="mt-auto pt-6">
            <p className="text-[15px] leading-[1.8] text-ink/70">{p.caters_to}</p>
            <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink/35">{p.primary_niche}</p>
          </div>
        </div>
      </Reveal>
      <Reveal delay={60}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Age range</p>
          <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.age_range}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Core audience</p></div>
        </div>
      </Reveal>
      <Reveal delay={90}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Gender</p>
          <div className="space-y-2.5">
            <div><div className="mb-1 flex items-center justify-between"><span className="text-[11px] font-semibold text-ink/55">Male</span><span className={`text-[12px] font-bold ${GRAD_TEXT}`}>{p.gender.male}%</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-primary/[0.08]"><div className={`h-full rounded-full ${GRAD_BTN}`} style={{ width: `${p.gender.male}%` }}/></div></div>
            <div><div className="mb-1 flex items-center justify-between"><span className="text-[11px] font-semibold text-ink/55">Female</span><span className="text-[12px] font-bold text-magenta">{p.gender.female}%</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-primary/[0.08]"><div className="h-full rounded-full bg-gradient-to-r from-primary-lt to-magenta" style={{ width: `${p.gender.female}%` }}/></div></div>
          </div>
        </div>
      </Reveal>
      <Reveal delay={120} className="col-span-2">
        <div className={`rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Top creator locations</p>
          <div className="space-y-3">
            {p.top_locations.map(loc => (
              <div key={loc.country} className="flex items-center gap-3">
                <CountryFlag code={loc.flagCode} className="h-[14px] w-[22px] flex-shrink-0"/>
                <span className="w-20 flex-shrink-0 text-[12.5px] font-semibold text-ink/70">{loc.country}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-primary/[0.08]" style={{ height: 8 }}><div className={`h-full rounded-full ${GRAD_BTN}`} style={{ width: `${loc.pct}%` }}/></div>
                <span className={`w-9 flex-shrink-0 text-right text-[12px] font-bold ${GRAD_TEXT}`}>{loc.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      <Reveal delay={150}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <div className="flex items-start justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Active creators</p><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><UsersIcon s={18}/></span></div>
          <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.active_creators}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Currently deployed</p></div>
        </div>
      </Reveal>
      <Reveal delay={180}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <div className="flex items-start justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Avg duration</p><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><CalendarIcon s={18}/></span></div>
          <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.avg_creator_duration}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Per partnership</p></div>
        </div>
      </Reveal>
      <Reveal delay={210}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Avg conversion</p>
          <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.conversion_rate}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Across all campaigns</p></div>
        </div>
      </Reveal>
      <Reveal delay={240}>
        <div className={`flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/35">Avg engagement</p>
          <div><div className={`text-[clamp(26px,3vw,32px)] font-black tracking-[-0.04em] ${GRAD_TEXT}`}>{p.avg_engagement}</div><p className="mt-1 text-[12px] font-medium text-ink/45">Across all creators</p></div>
        </div>
      </Reveal>
    </div>
  )
}

function Phone({ src, label }: { src?: string; label?: string }) {
  return (
    <div className="relative w-[210px] flex-shrink-0 snap-center sm:w-[220px]">
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] border-[7px] border-ink bg-ink shadow-[0_24px_50px_-16px_rgba(10,6,18,0.5)]">
        <div className="absolute left-1/2 top-2.5 z-10 h-4 w-20 -translate-x-1/2 rounded-lg bg-ink"/>
        {src ? <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover"/>
          : <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/25 via-primary-lt/20 to-magenta/25 text-white/70"><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Play/></span><span className="text-[11px] font-semibold uppercase tracking-[0.15em]">{label || 'Reel'}</span></div>}
      </div>
    </div>
  )
}

function GalleryBento() {
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-h-0 flex-[5] gap-3">
          <Reveal delay={0} className="flex min-h-0 flex-[5] flex-col">
            <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
              <img src={GALLERY_IMAGES[0]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/> {/* eslint-disable-line @next/next/no-img-element */}
            </div>
          </Reveal>
          <div className="flex min-h-0 flex-[6] flex-col gap-3">
            <Reveal delay={60} className="flex min-h-0 flex-[3] flex-col">
              <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
                <img src={GALLERY_IMAGES[1]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/> {/* eslint-disable-line @next/next/no-img-element */}
              </div>
            </Reveal>
            <Reveal delay={100} className="flex min-h-0 flex-[2] flex-col">
              <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
                <img src={GALLERY_IMAGES[2]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/> {/* eslint-disable-line @next/next/no-img-element */}
              </div>
            </Reveal>
          </div>
        </div>
        <div className="flex min-h-0 flex-[3] gap-3">
          <Reveal delay={140} className="flex min-h-0 flex-[7] flex-col">
            <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
              <img src={GALLERY_IMAGES[3]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/> {/* eslint-disable-line @next/next/no-img-element */}
            </div>
          </Reveal>
          <Reveal delay={180} className="flex min-h-0 flex-[4] flex-col">
            <div className="group relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 to-magenta/15">
              <img src={GALLERY_IMAGES[4]!.src} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/> {/* eslint-disable-line @next/next/no-img-element */}
            </div>
          </Reveal>
        </div>
      </div>
      <Reveal delay={80} className="flex-shrink-0"><Phone src={GALLERY_VIDEO_SRC}/></Reveal>
    </div>
  )
}

function CampaignCarousel({ campaigns }: { campaigns: typeof CAMPAIGNS }) {
  const [current, setCurrent] = useState(0)
  const total = campaigns.length
  const item = campaigns[current]
  if (!item) return null
  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between sm:justify-end">
        <span className="text-sm font-medium text-ink/40 sm:hidden">{current + 1} / {total}</span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-ink/40 sm:inline">{current + 1} / {total}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrent(c => c > 0 ? c - 1 : c)} disabled={current === 0} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            <button onClick={() => setCurrent(c => c < total - 1 ? c + 1 : c)} disabled={current === total - 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          </div>
        </div>
      </div>
      <div className={`flex flex-col gap-6 rounded-2xl border border-primary/10 bg-white p-6 transition hover:-translate-y-1 sm:flex-row sm:p-8 ${CARD} ${CARD_HOVER}`}>
        <div className="flex flex-1 flex-col space-y-4 pr-0 sm:pr-6">
          <div className="flex items-center gap-3"><span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">Featured campaign</span><span className="text-xs font-medium text-ink/40">#{current + 1}</span></div>
          <div><h3 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">We partnered with <span className={GRAD_TEXT}>{item.creator}</span></h3><p className="mt-1 text-lg font-semibold text-ink/80">{item.title}</p><p className="mt-0.5 text-[13px] font-medium text-ink/40">{item.handle} · {item.niche}</p></div>
          <p className="text-[15px] leading-relaxed text-ink/70">{item.description}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm">
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary"/><span className="font-medium text-ink/60">Target:</span><span className="font-semibold text-ink">{item.target}</span></span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-magenta"/><span className="font-medium text-ink/60">Result:</span><span className="font-semibold text-ink">{item.result}</span></span>
          </div>
          {item.metrics && <div className="grid grid-cols-2 gap-2.5">{item.metrics.map((m, i) => <div key={i} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-surface-sub px-3.5 py-3"><span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><MetricIcon name={m.icon} s={16}/></span><div><div className="text-[13px] font-black tracking-[-0.02em] text-ink">{m.value}</div><div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/40">{m.label}</div></div></div>)}</div>}
          {item.insight && <div className="rounded-lg border border-primary/10 bg-primary/[0.03] px-4 py-3"><p className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/[0.10] text-primary"><LightbulbIcon s={13}/></span>Key insight</p><p className="text-sm font-medium leading-relaxed text-ink/70">{item.insight}</p></div>}
        </div>
        <div className="flex justify-center sm:justify-end"><Phone src={item.videoSrc} label={item.title}/></div>
      </div>
    </div>
  )
}

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
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-ink/40">{index + 1} / {total}</span>
        <div className="flex gap-1.5">
          <button onClick={() => go(index - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button onClick={() => go(index + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateX(-${index * 100}%)` }}>
          {reviews.map(r => (
            <div key={r.id} className="w-full flex-shrink-0 px-0.5">
              <div className={`rounded-2xl border border-primary/10 bg-white p-7 sm:p-9 ${CARD}`}>
                <div className="mb-5 flex items-center justify-between"><GradientStars rating={r.rating} total={5} size={22} idSuffix={`-${r.id}`}/><span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/35">{r.date}</span></div>
                <p className="text-[16.5px] leading-[1.85] text-ink/75 sm:text-[17.5px]">"{r.quote}"</p>
                <div className="mt-7 flex items-center gap-3.5 border-t border-primary/10 pt-5">
                  <PersonAvatar name={r.name} color={r.color} avatarUrl={r.avatarUrl} initials={r.initials} size={48}/>
                  <div className="flex-1"><div className="text-[14.5px] font-bold text-ink">{r.name}</div><div className="mt-0.5 text-[12px] text-ink/50">{r.handle} · {r.niche} · {r.followers} followers</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex justify-center gap-2">
        {reviews.map((r, i) => <button key={r.id} onClick={() => go(i)} className={`h-2 rounded-full transition-all ${i === index ? `w-7 ${GRAD_BTN}` : 'w-2 bg-primary/15 hover:bg-primary/30'}`}/>)}
      </div>
    </div>
  )
}

function WorkModel({ name, price, priceLabel, icon, description, popular = false, delay = 0, onChoose }: {
  name: string; price: string; priceLabel: string; icon: ReactNode
  description: string; popular?: boolean; delay?: number; onChoose: () => void
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className={`group relative flex h-full flex-col rounded-2xl border bg-white p-7 transition-all hover:-translate-y-2 hover:shadow-xl ${popular ? 'border-primary/30 bg-gradient-to-br from-primary/[0.08] via-primary-lt/[0.04] to-magenta/[0.06] ring-2 ring-primary/20' : 'border-primary/10'} ${CARD} ${CARD_HOVER}`}>
        {popular && <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${GRAD_BTN} px-4 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_4px_12px_rgba(139,49,232,0.4)]`}>Most popular</span>}
        <div className={`mb-5 flex items-center justify-center rounded-xl border border-primary/10 bg-surface-sub text-primary ${popular ? 'h-16 w-16' : 'h-14 w-14'}`}>{icon}</div>
        <h3 className="text-xl font-extrabold tracking-[-0.02em] text-ink">{name}</h3>
        <div className="mt-1.5 flex items-baseline gap-1.5"><span className="text-2xl font-black text-ink">{price}</span><span className="text-sm font-medium text-ink/50">{priceLabel}</span></div>
        <p className="mt-4 flex-1 text-[14.5px] leading-[1.75] text-ink/65">{description}</p>
        <button onClick={onChoose} className={`mt-7 w-full rounded-xl py-3 text-[14px] font-bold transition hover:-translate-y-0.5 ${popular ? `${GRAD_BTN} text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)] hover:shadow-xl` : 'border border-primary/20 bg-white text-primary hover:bg-primary/[0.04]'}`}>Enquire</button>
      </div>
    </Reveal>
  )
}

function ContactModal({ open, type, brandName, onClose }: { open: boolean; type: 'apply' | 'message'; brandName: string; onClose: () => void }) {
  const isApply = type === 'apply'
  const [form, setForm] = useState({ name: '', handle: '', email: '', message: '' })
  const [collabType, setCollabType] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const ok = form.name.trim() && form.email.trim() && form.message.trim()
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; setSent(false); setForm({ name: '', handle: '', email: '', message: '' }); setCollabType('') }
    return () => { document.body.style.overflow = '' }
  }, [open, type])
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc) }, [onClose])
  // Mock send
  const submit = async () => {
    if (!ok) return; setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    setLoading(false); setSent(true)
  }
  const inp = 'w-full rounded-lg border border-primary/12 bg-surface-sub px-4 py-3 font-rubik text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30'
  const lbl = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/50'
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} className={`fixed inset-0 z-[500] flex items-center justify-center bg-ink/50 p-5 backdrop-blur-[6px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div role="dialog" aria-modal="true" className={`max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_70px_-12px_rgba(10,6,18,0.3)] transition-all duration-300 ease-[cubic-bezier(0.34,1.5,0.64,1)] ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/10 bg-white px-6 py-5"><h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{sent ? 'Message sent!' : isApply ? 'Apply to collaborate' : 'Send a message'}</h3><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sub text-base text-ink/50 transition hover:bg-surface-card hover:text-ink">✕</button></div>
        <div className="p-6">
          {sent
            ? <div className="py-6 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/12 text-green-500"><Check s={30}/></div><h3 className="mb-2 text-xl font-extrabold text-ink">Message sent!</h3><p className="mx-auto max-w-[300px] text-sm leading-[1.7] text-ink/65">{brandName} will get back to you at <b className="text-primary">{form.email}</b> within 48 hours.</p><button onClick={onClose} className={`mx-auto mt-6 rounded-lg ${GRAD_BTN} px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5`}>Done</button></div>
            : <>
                <p className="mb-5 text-sm leading-[1.6] text-ink/65">{isApply ? "Tell us about your audience and what you create — we'll reply with next steps within 48 hours." : 'Introduce yourself and tell us what you have in mind.'}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className={lbl}>Your name *</label><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith"/></div><div><label className={lbl}>@handle</label><input className={inp} value={form.handle} onChange={e => set('handle', e.target.value)} placeholder="@yourhandle"/></div></div>
                <div className="mt-4"><label className={lbl}>Email *</label><input type="email" className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@email.com"/></div>
                {isApply && <div className="mt-4"><label className={lbl}>Preferred collaboration type</label><div className="flex flex-wrap gap-2">{COLLAB_TYPES.map(ct => <button key={ct} type="button" onClick={() => setCollabType(ct)} className={`rounded-lg border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition ${collabType === ct ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>{ct}</button>)}</div></div>}
                <div className="mt-4"><label className={lbl}>{isApply ? "Why you'd be a good fit *" : 'Your message *'}</label><textarea className={`${inp} min-h-[100px] resize-y leading-relaxed`} value={form.message} onChange={e => set('message', e.target.value)} placeholder={isApply ? 'What do you create? Who is your audience?' : `Hi ${brandName}, I'm reaching out because…`}/></div>
                <button onClick={submit} disabled={!ok || loading} className={`mt-5 w-full rounded-lg ${GRAD_BTN} py-3.5 text-[15px] font-bold text-white shadow-[0_8px_28px_-6px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-surface-card disabled:bg-none disabled:text-ink/30 disabled:shadow-none`}>{loading ? 'Sending…' : `Send ${isApply ? 'application' : 'message'}`}</button>
              </>
          }
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function BrandPreviewPage() {
  const [modal, setModal] = useState<'apply' | 'message' | null>(null)

  /* Preview / publish state */
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [publishing,  setPublishing]  = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [shareOpen,   setShareOpen]   = useState(false)

  const b = BRAND
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const handlePublishClick = () => setConfirmOpen(true)
  const handleConfirmPublish = async () => {
    setPublishing(true)
    await new Promise(r => setTimeout(r, 1400))
    setPublishing(false)
    setConfirmOpen(false)
    setIsPublished(true)
    setTimeout(() => setShareOpen(true), 300)
  }

  const NAV_LEFT  = [{ label: 'About',      action: () => scrollTo('about')   }, { label: 'Performance', action: () => scrollTo('matrix') }]
  const NAV_RIGHT = [{ label: 'Campaigns',  action: () => scrollTo('work')    }, { label: 'Contact',     action: () => setModal('message') }]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ PREVIEW BANNER ════ */}
      <PreviewBanner onPublish={handlePublishClick} isPublished={isPublished} />

      {/* ════ PUBLISH CONFIRM ════ */}
      <PublishConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirmPublish} loading={publishing} />

      {/* ════ SHARE DIALOG ════ */}
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} url={PUBLISHED_URL} />

      {/* ════════════════════════════════════════════════════════════════
          BRAND PROFILE — exact replica of public brand page
          ════════════════════════════════════════════════════════════════ */}

      {/* HEADER */}
      <header className="relative">
        <div className="relative h-[260px] w-full overflow-hidden bg-gradient-to-br from-primary/30 via-primary-lt/25 to-magenta/30 sm:h-[320px] md:h-[360px]"
          style={b.coverUrl ? { backgroundImage: `url(${b.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-canvas/30"/>
        </div>

        {/* Nav pill */}
        <div className="absolute inset-x-0 z-40 flex justify-center px-4" style={{ top: 28 }}>
          <div className="w-full max-w-[600px]">
            <div className="relative flex w-full items-center justify-between rounded-2xl px-4 py-3" style={{ overflow: 'visible' }}>
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
                style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.88) 70%, rgba(255,255,255,0.88) 100%)', WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)', maskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)' }}/>
              <div className="relative z-10 flex items-center gap-0.5">{NAV_LEFT.map(n => <button key={n.label} onClick={n.action} className="rounded-lg px-1.5 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-4">{n.label}</button>)}</div>
              <div className="w-16 flex-shrink-0" aria-hidden="true"/>
              <div className="relative z-10 flex items-center gap-0.5">{NAV_RIGHT.map(n => <button key={n.label} onClick={n.action} className="rounded-lg px-1.5 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-4">{n.label}</button>)}</div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
                <NexLogo className="pointer-events-auto h-10 drop-shadow-[0_6px_24px_rgba(139,49,232,0.65)] sm:h-12"/>
              </div>
            </div>
          </div>
        </div>

        {/* Avatar + name */}
        <div className="mx-auto -mt-20 flex max-w-[1080px] flex-col items-center px-6 sm:-mt-24">
          <div className={`relative z-20 h-36 w-36 overflow-hidden rounded-2xl border-4 border-white ${GRAD_BTN} shadow-[0_16px_44px_-12px_rgba(139,49,232,0.45)] sm:h-44 sm:w-44`}
            style={b.avatarUrl ? { backgroundImage: `url(${b.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!b.avatarUrl && <span className="flex h-full w-full items-center justify-center text-5xl font-black text-white">{b.initials}</span>}
          </div>
          <h1 className="mt-5 flex w-full items-center justify-center gap-2.5 text-center text-[clamp(34px,6vw,56px)] font-black leading-none tracking-[-0.045em] text-ink">
            <span>{b.name}</span>
            <img src="/Tick.svg" alt="" className="h-8 w-8"/> {/* eslint-disable-line @next/next/no-img-element */}
          </h1>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink/60"><span className="text-primary"><Pin/></span>{b.location}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
            {SOCIAL_LINKS.map(s => (
              <a key={s.key} href={s.href} aria-label={s.label} title={s.label} className="flex h-8 w-8 items-center justify-center transition-all duration-200 hover:-translate-y-1 hover:drop-shadow-[0_6px_16px_rgba(139,49,232,0.35)]">
                <img src={s.src} alt={s.label} draggable={false} className="block h-full w-full overflow-hidden rounded-md object-contain"/> {/* eslint-disable-line @next/next/no-img-element */}
              </a>
            ))}
          </div>
          {b.websiteUrl && (
            <a href={b.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2.5 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-[13.5px] font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30">
              <GlobeIcon s={16}/><span>Visit Website</span>
            </a>
          )}
        </div>
      </header>

      {/* ABOUT */}
      <section id="about" className="py-16">
        <div className="mx-auto max-w-[640px] px-6 text-center">
          <SectionHead kicker="Nice to meet you">The brand <G>behind the bottle</G></SectionHead>
          <Reveal delay={80}>
            <p className="mt-6 text-[clamp(16px,2vw,18px)] leading-[1.85] text-ink/70">{b.bio}</p>
            <button onClick={() => setModal('apply')} className={`mt-7 rounded-lg ${GRAD_BTN} px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>Partner with us</button>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">{b.categories.map(g => <span key={g} className="rounded-lg border border-primary/15 bg-white px-4 py-2 text-[13px] font-semibold text-primary">{g}</span>)}</div>
          </Reveal>
        </div>
      </section>

      {/* MATRIX */}
      <section id="matrix" className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="The matrix" className="mb-10">Performance, by the <G>numbers</G></SectionHead>
          <Reveal>
            <div className={`grid grid-cols-2 gap-x-4 gap-y-7 rounded-2xl border border-primary/10 bg-white p-6 sm:grid-cols-4 sm:gap-4 sm:p-9 ${CARD} [&>*:not(:last-child)]:sm:border-r [&>*:not(:last-child)]:sm:border-primary/8`}>
              {BRAND_STATS.map(s => <Stat key={s.label} {...s}/>)}
            </div>
          </Reveal>
          <div className="mt-6"><PersonaBento/></div>
        </div>
      </section>

      {/* CAMPAIGNS */}
      <section id="work" className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="Our campaigns" className="mb-10">Campaigns <span className="font-light text-ink/35">&amp;</span> <G>content</G></SectionHead>
          <Reveal><GalleryBento/></Reveal>
          <Reveal className="mt-12"><CampaignCarousel campaigns={CAMPAIGNS}/></Reveal>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[760px] px-6">
          <SectionHead kicker="What creators say" className="mb-12" sub="Unfiltered feedback from creators we've partnered with.">Loved by the <G>creators</G> we work with</SectionHead>
          <ReviewsCarousel reviews={REVIEWS}/>
        </div>
      </section>

      {/* WAYS TO PARTNER */}
      <section className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="Let's deal" className="mb-10" sub="Three clear ways we work with creators — pick what fits, or mix them.">Ways to <G>partner</G></SectionHead>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <WorkModel delay={0}   name="Affiliate / Revenue Share" price="10–20%" priceLabel="per sale"      icon={<Shield s={28}/>}      description="Our most popular model. Earn a commission on every sale you drive — real-time tracking, paid monthly, no upfront commitment needed." popular={true}  onChoose={() => setModal('apply')}/>
            <WorkModel delay={90}  name="Paid Campaigns"            price="From €350" priceLabel="per video"  icon={<ZapIcon s={28}/>}     description="Predictable flat fee per deliverable. Clear brief, fast approval, and payment on delivery — not on results. Full usage rights included." popular={false} onChoose={() => setModal('apply')}/>
            <WorkModel delay={180} name="Barter / Gifting"          price="€120+"  priceLabel="product value" icon={<HandshakeIcon s={28}/>} description="For creators who'd genuinely use our products anyway. We send a curated starter box and let the content happen naturally — zero quota, zero obligation." popular={false} onChoose={() => setModal('apply')}/>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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
              <h2 className="text-[clamp(26px,4.5vw,42px)] font-black leading-[1.08] tracking-[-0.04em] text-white">Let's build your next <span className={GRAD_TEXT}>campaign.</span></h2>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-white/55">Tell us about your audience and what you create. One message — we reply within 48 hours.</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <button onClick={() => setModal('apply')} className={`rounded-xl ${GRAD_BTN} px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_32px_-8px_rgba(139,49,232,0.55)] transition hover:-translate-y-0.5`}>Apply to Collaborate</button>
                <button onClick={() => setModal('message')} className="rounded-xl border-[1.5px] border-white/25 px-7 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white/[0.06]">Send a message</button>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/8 py-6 text-center">
            <a href="/authenticate" className={`text-[13px] font-semibold ${GRAD_TEXT} underline-offset-4 hover:underline`}>Create Your Own Brand Profile on Nexus and Discover Creators to Partner With</a>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-[150] flex gap-2.5 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <button onClick={() => setModal('message')} className="flex-1 rounded-lg border-[1.5px] border-primary/15 bg-white py-3 text-sm font-bold text-ink">Message</button>
        <button onClick={() => setModal('apply')} className={`flex-[1.6] rounded-lg ${GRAD_BTN} py-3 text-sm font-bold text-white`}>Apply</button>
      </div>

      <ContactModal open={modal !== null} type={modal ?? 'apply'} brandName={b.name} onClose={() => setModal(null)}/>
    </div>
  )
}