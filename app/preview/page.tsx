'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Preview page — page.tsx  (Nexfluence v4, LIGHT)
   Wraps the exact creator profile with a sticky preview banner.
   Publish → share dialog (YouTube-style).
   ════════════════════════════════════════════════════════════════════ */

const API       = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:5000'
const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const CARD_HOVER = 'hover:shadow-[0_2px_6px_rgba(10,6,18,0.05),0_24px_56px_-16px_rgba(139,49,232,0.30)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ─── Simulated published URL ──────────────────────────────────────── */
const PROFILE_SLUG     = 'amelia-roze'
const PUBLISHED_URL    = `https://nexus.nexfluence.eu/creator/${PROFILE_SLUG}`

/* ══════════════════════════════════════════════════════════════════════
   SHARE PLATFORMS — YouTube-style grid
   ══════════════════════════════════════════════════════════════════════ */
const SHARE_PLATFORMS = [
  {
    id: 'whatsapp', label: 'WhatsApp',
    color: '#25D366', bg: '#e8fdf0',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
      </svg>
    ),
    href: (url: string) => `https://wa.me/?text=${encodeURIComponent(url)}`,
  },
  {
    id: 'instagram', label: 'Instagram',
    color: '#E1306C', bg: '#fdf0f5',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    href: () => null, /* Instagram doesn't support direct link sharing — copy only */
  },
  {
    id: 'tiktok', label: 'TikTok',
    color: '#000000', bg: '#f5f5f5',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
      </svg>
    ),
    href: () => null,
  },
  {
    id: 'linkedin', label: 'LinkedIn',
    color: '#0A66C2', bg: '#eef4fc',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'twitter', label: 'X / Twitter',
    color: '#000000', bg: '#f5f5f5',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    href: (url: string, text?: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? '')}`,
  },
  {
    id: 'facebook', label: 'Facebook',
    color: '#1877F2', bg: '#eef3fd',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'telegram', label: 'Telegram',
    color: '#26A5E4', bg: '#eef8fd',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    href: (url: string, text?: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text ?? '')}`,
  },
  {
    id: 'email', label: 'Email',
    color: '#6B7280', bg: '#f5f5f5',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 7l10 7 10-7" />
      </svg>
    ),
    href: (url: string) => `mailto:?subject=Check out my creator profile&body=Hey, I thought you'd find this interesting: ${url}`,
  },
]

/* ══════════════════════════════════════════════════════════════════════
   SHARE DIALOG
   ══════════════════════════════════════════════════════════════════════ */
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
      /* fallback: select input */
      const input = document.getElementById('share-url-input') as HTMLInputElement | null
      input?.select()
    }
  }

  const shareText = 'Check out my creator profile on Creator Nexus 🚀'

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[700] flex items-end justify-center sm:items-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — slides up on mobile, centred on desktop */}
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl ${CARD} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-ink/15" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/8 px-6 py-4">
          <h3 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">Share your profile</h3>
          <button onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/50 transition hover:bg-ink/10 text-[15px]">
            ✕
          </button>
        </div>

        <div className="px-6 pb-8 pt-5">

          {/* Copy link row */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-primary/12 bg-surface-sub p-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-1">
              {/* Link icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-primary">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                id="share-url-input"
                readOnly
                value={url}
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink/70 outline-none"
                onFocus={e => e.target.select()}
              />
            </div>
            <button
              onClick={copyLink}
              className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-bold transition ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : `${GRAD_BTN} text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`
              }`}
            >
              {copied ? (
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Copied!
                </span>
              ) : 'Copy link'}
            </button>
          </div>

          {/* Platform grid */}
          <p className="mb-4 mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/35">Share to</p>
          <div className="grid grid-cols-4 gap-3">
            {SHARE_PLATFORMS.map(p => {
              const href = p.href(url, shareText)
              const isNoLink = href === null
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (isNoLink) { copyLink(); return }
                    window.open(href, '_blank', 'noopener,noreferrer')
                  }}
                  title={isNoLink ? `Copy link to share on ${p.label}` : `Share on ${p.label}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl p-3 transition hover:bg-surface-sub active:scale-95"
                >
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-2xl transition duration-200 group-hover:scale-110"
                    style={{ background: p.bg, color: p.color }}
                  >
                    {p.icon}
                  </span>
                  <span className="text-center text-[11px] font-semibold leading-tight text-ink/60">
                    {p.label}
                    {isNoLink && <span className="block text-[9.5px] text-ink/35">Copy link</span>}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Web share API (if supported) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={() => navigator.share({ title: 'Creator Nexus — Amelia Roze', url, text: shareText }).catch(() => {})}
              className={`mt-4 w-full rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-primary transition hover:-translate-y-0.5 hover:bg-primary/[0.04]`}
            >
              More options…
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   PUBLISH CONFIRMATION DIALOG
   ══════════════════════════════════════════════════════════════════════ */
function PublishConfirmDialog({
  open, onClose, onConfirm, loading,
}: {
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

        {/* Icon */}
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.45)]`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h3 className="text-[22px] font-extrabold tracking-[-0.03em] text-ink">Ready to go live?</h3>
        <p className="mx-auto mt-3 max-w-[300px] text-[14px] leading-[1.7] text-ink/55">
          Your profile will be published to <span className="font-bold text-primary">{PUBLISHED_URL}</span> and visible to everyone.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full rounded-xl ${GRAD_BTN} py-3.5 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5 disabled:opacity-60`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Publishing…
              </span>
            ) : 'Yes, publish it 🚀'}
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-primary/15 bg-white py-3.5 text-[14px] font-bold text-ink/60 transition hover:bg-surface-sub"
          >
            Keep editing
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   PREVIEW BANNER — sticky at top, above the profile
   ══════════════════════════════════════════════════════════════════════ */
function PreviewBanner({
  onPublish, isPublished,
}: {
  onPublish: () => void
  isPublished: boolean
}) {
  return (
    <div className="sticky top-0 z-[500] flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">

      {/* Left: preview badge + label */}
      <div className="flex items-center gap-3">
        {/* Eye icon */}
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
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
            This is exactly how your profile will look. Happy with it? Hit Publish.
          </p>
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {/* Back to studio */}
        <a
          href="/studio"
          className="hidden items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-[12.5px] font-bold text-amber-700 transition hover:bg-amber-50 sm:flex"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Studio
        </a>

        {/* Publish button */}
        {isPublished ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-[13px] font-bold text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Published!
          </div>
        ) : (
          <button
            onClick={onPublish}
            className={`flex items-center gap-2 rounded-lg ${GRAD_BTN} px-4 py-2 text-[13px] font-bold text-white shadow-[0_4px_14px_-4px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Publish
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   All creator profile code below — identical to page.tsx
   ══════════════════════════════════════════════════════════════════════ */

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
    blockedCategory: 'All energy drink & stimulant brands', duration: 'Rolling annual contract', logo: null,
  },
  {
    id: 'ed2', brand: 'Glossé', category: 'Lip Care', since: '2024', logoText: 'Glossé',
    exclusive: false, color: '#8B31E8', scope: 'Preferred partner',
    description: 'Long-term preferred partnership for lip care content. First-look rights on all new Glossé product launches before any other creator in the region.',
    blockedCategory: null, duration: '12-month preferred deal', logo: null,
  },
]

type PlatformKey = 'instagram' | 'tiktok' | 'youtube' | 'snapchat' | 'twitter' | 'linkedin' | 'facebook'
type PlatformStat = { to: number; dec: number; suffix: string; label: string }
type PlatformDemographics = { audience: string; primaryGender: { value: string; label: string }; primaryAge: { value: string; label: string }; primaryLocation: { value: string; label: string; flagCode: string }; talkAbout: string }
type PlatformEntry = { key: PlatformKey; label: string; icon: string; isPrimary: boolean; stats: PlatformStat[]; demographics: PlatformDemographics }

const PLATFORM_DATA: Record<PlatformKey, PlatformEntry> = {
  instagram: { key: 'instagram', label: 'Instagram', icon: '/Socials/Instagram.svg', isPrimary: true, stats: [{ to: 142, dec: 0, suffix: 'K', label: 'Combined reach' }, { to: 6.8, dec: 1, suffix: '%', label: 'Avg engagement' }, { to: 3.4, dec: 1, suffix: 'M', label: 'Monthly views' }, { to: 48, dec: 0, suffix: '+', label: 'Brand campaigns' }], demographics: { audience: '142K', primaryGender: { value: '78%', label: 'Female audience' }, primaryAge: { value: '25–34', label: 'Primary age group' }, primaryLocation: { value: 'Latvia', label: 'Top location · 64%', flagCode: 'lv' }, talkAbout: "I create honest beauty and skincare content — morning routines, product results filmed over real time, and lifestyle vlogs from around Riga. My audience trusts me because I only feature what I'd actually rebuy, so when I recommend something, they act on it." } },
  tiktok:    { key: 'tiktok',    label: 'TikTok',    icon: '/Socials/TikTok.svg',    isPrimary: false, stats: [{ to: 96,  dec: 0, suffix: 'K', label: 'Followers' }, { to: 11.2, dec: 1, suffix: '%', label: 'Avg engagement' }, { to: 5.1, dec: 1, suffix: 'M', label: 'Monthly views' }, { to: 14, dec: 0, suffix: '', label: 'Viral videos (1M+)' }], demographics: { audience: '96K', primaryGender: { value: '71%', label: 'Female audience' }, primaryAge: { value: '18–24', label: 'Primary age group' }, primaryLocation: { value: 'Lithuania', label: 'Top location · 41%', flagCode: 'lt' }, talkAbout: 'Quick get-ready-with-me clips, trend remixes, and one-take skincare hacks — TikTok is where I test ideas fast and let the algorithm tell me what actually resonates before it goes anywhere else.' } },
  youtube:   { key: 'youtube',   label: 'YouTube',   icon: '/Socials/YouTube.svg',   isPrimary: false, stats: [{ to: 38,  dec: 0, suffix: 'K', label: 'Subscribers' }, { to: 6.4, dec: 1, suffix: ' min', label: 'Avg view duration' }, { to: 22, dec: 0, suffix: 'K', label: 'Watch hours / mo' }, { to: 12, dec: 0, suffix: '', label: 'Sponsored videos' }], demographics: { audience: '38K', primaryGender: { value: '69%', label: 'Female audience' }, primaryAge: { value: '25–34', label: 'Primary age group' }, primaryLocation: { value: 'Latvia', label: 'Top location · 58%', flagCode: 'lv' }, talkAbout: 'Long-form routine breakdowns, full product deep-dives, and month-long skincare experiments — YouTube is where my audience comes for the complete story behind a recommendation, not just the highlight.' } },
  snapchat:  { key: 'snapchat',  label: 'Snapchat',  icon: '/Socials/Snapchat.svg',  isPrimary: false, stats: [{ to: 24,  dec: 0, suffix: 'K', label: 'Subscribers' }, { to: 64, dec: 0, suffix: '%', label: 'Story completion' }, { to: 31, dec: 0, suffix: 'K', label: 'Avg daily views' }, { to: 6, dec: 0, suffix: '', label: 'Takeover campaigns' }], demographics: { audience: '24K', primaryGender: { value: '82%', label: 'Female audience' }, primaryAge: { value: '16–21', label: 'Primary age group' }, primaryLocation: { value: 'Estonia', label: 'Top location · 37%', flagCode: 'ee' }, talkAbout: "Raw, unfiltered day-in-the-life snaps and first impressions of new products — no polish, no second takes. It's my youngest, fastest-reacting audience, and they let me know immediately if something's worth it." } },
  twitter:   { key: 'twitter',   label: 'Twitter / X', icon: '/Socials/Twitter.svg', isPrimary: false, stats: [{ to: 18,  dec: 0, suffix: 'K', label: 'Followers' }, { to: 4.1, dec: 1, suffix: '%', label: 'Avg engagement' }, { to: 890, dec: 0, suffix: 'K', label: 'Monthly impressions' }, { to: 9, dec: 0, suffix: '', label: 'Sponsored threads' }], demographics: { audience: '18K', primaryGender: { value: '54%', label: 'Female audience' }, primaryAge: { value: '25–34', label: 'Primary age group' }, primaryLocation: { value: 'Latvia', label: 'Top location · 49%', flagCode: 'lv' }, talkAbout: 'Hot takes on new launches, honest mini-reviews, and behind-the-scenes threads from brand shoots — X is where my more opinionated, unfiltered side comes out between the polished posts elsewhere.' } },
  linkedin:  { key: 'linkedin',  label: 'LinkedIn',  icon: '/Socials/LinkedIn.svg',  isPrimary: false, stats: [{ to: 9.2, dec: 1, suffix: 'K', label: 'Followers' }, { to: 3.6, dec: 1, suffix: '%', label: 'Avg engagement' }, { to: 210, dec: 0, suffix: 'K', label: 'Post impressions / mo' }, { to: 7, dec: 0, suffix: '', label: 'Brand partnerships' }], demographics: { audience: '9.2K', primaryGender: { value: '61%', label: 'Female audience' }, primaryAge: { value: '28–40', label: 'Primary age group' }, primaryLocation: { value: 'Latvia', label: 'Top location · 52%', flagCode: 'lv' }, talkAbout: 'Creator economy insights, brand collaboration breakdowns, and what actually drives ROI for beauty partnerships — this is where I speak directly to marketing teams, not just consumers.' } },
  facebook:  { key: 'facebook',  label: 'Facebook',  icon: '/Socials/Facebook.svg',  isPrimary: false, stats: [{ to: 52,  dec: 0, suffix: 'K', label: 'Followers' }, { to: 5.4, dec: 1, suffix: '%', label: 'Avg engagement' }, { to: 1.1, dec: 1, suffix: 'M', label: 'Monthly video views' }, { to: 21, dec: 0, suffix: '', label: 'Brand campaigns' }], demographics: { audience: '52K', primaryGender: { value: '84%', label: 'Female audience' }, primaryAge: { value: '35–44', label: 'Primary age group' }, primaryLocation: { value: 'Latvia', label: 'Top location · 71%', flagCode: 'lv' }, talkAbout: "Longer captions, community discussions, and routine recommendations for an audience that's been with me since the beginning — Facebook skews older and more loyal than anywhere else I post." } },
}
const PLATFORM_LIST: PlatformEntry[] = Object.values(PLATFORM_DATA)

const BRANDS = ['Lumora', 'Kinetics', 'Glossé', 'Nordic Skin', 'Bēta Beauty', 'Aura Labs']

const PHOTOS = [
  { id: 'p1', src: '/test/images/Lecture.png',        cls: 'col-span-2 md:col-span-2 md:row-span-2' },
  { id: 'p2', src: '/test/images/Listening.png',      cls: 'col-span-2 md:col-span-2 md:row-span-1' },
  { id: 'p3', src: '/test/images/Kinetics-Leader.png', cls: 'col-span-1' },
  { id: 'p4', src: '/test/images/Drink.png',           cls: 'col-span-1' },
  { id: 'p5', src: '/test/images/Food.png',            cls: 'col-span-1' },
  { id: 'p6', src: '/test/images/Influencing.png',     cls: 'col-span-1' },
  { id: 'p7', src: '/test/images/Kinetics-phone.png',  cls: 'col-span-2 md:col-span-2' },
]

const COLLABORATIONS = [
  {
    id: 'c1', brand: 'Kinetics', title: 'Vitamin‑C serum launch',
    description: 'We created a 60‑second routine that showed real results over 14 days. The content focused on the glow effect, not just the ingredients.',
    target: 'Women 25‑40 interested in clean beauty', result: '3.2x ROAS, 5.8K units sold in first week',
    videoSrc: '/test/video/Drink.mp4',
    insight: 'Authentic storytelling outperformed polished ads – this campaign proved it. The raw, unfiltered shots drove 78% more engagement than our previous studio‑produced content.',
    metrics: [{ icon: 'eye', label: 'Views', value: '1.2M' }, { icon: 'heart', label: 'Engagement', value: '8.4%' }, { icon: 'cart', label: 'ROAS', value: '3.2×' }, { icon: 'share', label: 'Shares', value: '14.2K' }],
    review: { rating: 5, quote: "Amelia delivered ahead of deadline and the results spoke for themselves — best-converting creator in our whole spring campaign. She understood the brief immediately, needed zero revisions, and the 3.2× ROAS surprised even our own performance team. We've already rebooked her twice.", name: 'Elena Roze', role: 'Brand Manager', company: 'Kinetics', brandColor: '#2563EB', brandInitials: 'KI', brandLogoUrl: '/brands/Burger King.jpg' },
  },
  {
    id: 'c2', brand: 'Lumora Skincare', title: 'Morning ritual with Lumora',
    description: "A get‑ready‑with‑me style video that naturally integrated Lumora's moisturiser into my daily routine. No hard sell — just honest use.",
    target: 'Skincare enthusiasts looking for hydration', result: '2.1M views, 14% engagement rate',
    videoSrc: '/test/video/Food.mp4',
    insight: 'Showing the product in a real, messy morning routine made it feel accessible. DMs were flooded with "where can I buy this?" within hours.',
    metrics: [{ icon: 'eye', label: 'Views', value: '2.1M' }, { icon: 'heart', label: 'Engagement', value: '14%' }, { icon: 'users', label: 'New followers', value: '+8.3K' }, { icon: 'message', label: 'DMs', value: '2.1K' }],
    review: { rating: 5, quote: "Working with Amelia felt like working with a marketing partner, not a creator. She understood our product, our margins, and pitched the affiliate model herself — something none of our other creators have ever done. The morning ritual video is still our best-performing piece of content six months later.", name: 'Mārtiņš Ozols', role: 'Founder', company: 'Lumora Skincare', brandColor: '#059669', brandInitials: 'LS', brandLogoUrl: '/brands/Nike.jpg' },
  },
  {
    id: 'c3', brand: 'Glossé', title: 'Lip gloss layering hack',
    description: "We showed how to achieve a plump, glossy look using Glossé's new lip oil. The video went viral on TikTok within 48 hours.",
    target: 'Gen Z and millennials, beauty lovers', result: '4.5M views, 22K shares, 8.2K conversions',
    videoSrc: '/test/video/People.mp4',
    insight: 'TikTok users love hacks. By framing it as a "discovery" rather than a promo, we hit the algorithm sweet spot and gained 12K new followers from this single post.',
    metrics: [{ icon: 'eye', label: 'Views', value: '4.5M' }, { icon: 'share', label: 'Shares', value: '22K' }, { icon: 'cart', label: 'Conversions', value: '8.2K' }, { icon: 'users', label: 'New followers', value: '+12K' }],
    review: { rating: 4, quote: "The content didn't feel like an ad — it felt like a recommendation from a trusted friend. Our DMs blew up the day it went live. We went from sceptical about influencer marketing to building our entire Q3 strategy around creators after this single campaign.", name: 'Anna Kalniņa', role: 'Marketing Lead', company: 'Glossé', brandColor: '#8B31E8', brandInitials: 'GL', brandLogoUrl: '/brands/RedBull.webp' },
  },
]

const BUDGETS = ['Under €350', '€350–€890', '€890–€2,500', '€2,500+', 'Affiliate only', 'Not sure yet']

/* ── Icons (all same as page.tsx) ── */
const Check = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Shield = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3L5 6v6c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
const StarIcon = ({ s = 14 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.95 6.46 7.05.66-5.32 4.78 1.6 6.9L12 17.6l-6.28 3.7 1.6-6.9-5.32-4.78 7.05-.66L12 2.5z" /></svg>
const ZapIcon = ({ s = 28 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
const HandshakeIcon = ({ s = 28 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 17l2 2a1 1 0 103-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 14l2.5 2.5a1 1 0 103-3l-3.88-3.88a3 3 0 00-4.24 0l-.88.88a1 1 0 11-3-3l2.81-2.81a5.79 5.79 0 017.06-.87l.47.28a2 2 0 001.42.25L21 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 3l1 11h-2M3 3l-1 11 6.5 6.5a1 1 0 103-3M3 4h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Play = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
const Pin = ({ s = 15 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" /></svg>
const LockIcon = ({ s = 13 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
const CalendarIcon = ({ s = 13 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
const EyeIcon = ({ s = 26 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" /></svg>
const PersonIcon = ({ s = 26 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2.8" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.8v1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M8 9c-.5 0-1.2.6-1.5 1.5L5 16h4l1 5h4l1-5h4l-1.5-5.5C17.2 9.6 16.5 9 16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.5 9c.7-.5 1.6-.5 2.5-.5s1.8 0 2.5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
const HeartPulseIcon = ({ s = 26 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 20.5S3.5 14 3.5 8a4.5 4.5 0 018.5-2 4.5 4.5 0 018.5 2c0 6-8.5 12.5-8.5 12.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M3.5 12h2.3l1.5-2.8 2 5 1.5-3.5 1 1.8H18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
const ChatBubbleIcon = ({ s = 40 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
const LightbulbIcon = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21h6M12 3a7 7 0 014.9 11.9c-.6.6-1.1 1.3-1.4 2.1H8.5c-.3-.8-.8-1.5-1.4-2.1A7 7 0 0112 3z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.5 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
const MetricEyeIcon = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg>
const HeartIcon = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
const CartIcon = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
const ShareIconSm = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" /><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M8.6 10.7l6.8-4M8.6 13.3l6.8 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
const UsersIcon = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
const MessageIcon = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
const GlobeIcon = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" /><path d="M12 2c-2.8 3-4 6-4 10s1.2 7 4 10M12 2c2.8 3 4 6 4 10s-1.2 7-4 10M2 12h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>

function MetricIcon({ name, s = 18 }: { name: string; s?: number }) {
  switch (name) {
    case 'eye': return <MetricEyeIcon s={s} />
    case 'heart': return <HeartIcon s={s} />
    case 'cart': return <CartIcon s={s} />
    case 'share': return <ShareIconSm s={s} />
    case 'users': return <UsersIcon s={s} />
    case 'message': return <MessageIcon s={s} />
    default: return <MetricEyeIcon s={s} />
  }
}

const SOCIAL_LINKS = [
  { key: 'instagram', label: 'Instagram',   href: '#', src: '/Socials/Instagram.svg' },
  { key: 'tiktok',    label: 'TikTok',      href: '#', src: '/Socials/TikTok.svg'    },
  { key: 'youtube',   label: 'YouTube',     href: '#', src: '/Socials/YouTube.svg'   },
  { key: 'snapchat',  label: 'Snapchat',    href: '#', src: '/Socials/Snapchat.svg'  },
  { key: 'twitter',   label: 'Twitter / X', href: '#', src: '/Socials/Twitter.svg'   },
  { key: 'linkedin',  label: 'LinkedIn',    href: '#', src: '/Socials/LinkedIn.svg'  },
  { key: 'facebook',  label: 'Facebook',    href: '#', src: '/Socials/Facebook.svg'  },
]

function GradientStars({ rating, total = 5, size = 28, idSuffix = '' }: { rating: number; total?: number; size?: number; idSuffix?: string }) {
  const fillId = `nex-star-fill${idSuffix}`, strokeId = `nex-star-stroke${idSuffix}`
  const STAR = 'M12 2l2.8 6.2 6.8.6-5 4.5 1.5 6.7L12 16.5l-6.1 3.5 1.5-6.7-5-4.5 6.8-.6z'
  return (
    <div className="flex items-center gap-2">
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id={fillId} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8B31E8" /><stop offset="55%" stopColor="#A855F7" /><stop offset="100%" stopColor="#FF33BC" /></linearGradient>
          <linearGradient id={strokeId} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8B31E8" /><stop offset="55%" stopColor="#A855F7" /><stop offset="100%" stopColor="#FF33BC" /></linearGradient>
        </defs>
      </svg>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" overflow="visible">
          {i < rating ? (<><path d={STAR} fill={`url(#${fillId})`} stroke="white" strokeWidth="3" strokeLinejoin="round" paintOrder="stroke" /><path d={STAR} fill="none" stroke={`url(#${strokeId})`} strokeWidth="1.6" strokeLinejoin="round" /></>) : (<><path d={STAR} fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round" /><path d={STAR} fill="none" stroke={`url(#${strokeId})`} strokeWidth="1.6" strokeLinejoin="round" opacity="0.35" /></>)}
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
      <div className="text-[clamp(28px,4.2vw,42px)] font-black leading-none tracking-[-0.045em] text-ink">{val.toFixed(dec)}<span className={GRAD_TEXT}>{suffix}</span></div>
      <div className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/45">{label}</div>
    </div>
  )
}

function SectionHead({ kicker, children, sub, className = '' }: { kicker: string; children: ReactNode; sub?: string; className?: string }) {
  return (
    <Reveal className={`text-center ${className}`}>
      <div className="mb-4 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5"><span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/50 sm:w-16" /><span className="h-1 w-1 rounded-full bg-primary/60" /></div>
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-ink/50">{kicker}</p>
        <div className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-magenta/60" /><span className="h-px w-10 bg-gradient-to-r from-magenta/50 to-transparent sm:w-16" /></div>
      </div>
      <h2 className="text-[clamp(30px,4.8vw,48px)] font-black leading-[1.02] tracking-[-0.045em] text-ink">{children}</h2>
      {sub && <p className="mx-auto mt-4 max-w-[540px] text-base leading-[1.7] text-ink/60">{sub}</p>}
    </Reveal>
  )
}

const G = ({ children }: { children: ReactNode }) => <span className={GRAD_TEXT}>{children}</span>
function CountryFlag({ code, className = '' }: { code: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`} alt={code.toUpperCase()} className={`inline-block rounded-[4px] object-cover ${className}`} width={28} height={18} />
}
function NexLogo({ className = '' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`} />
}
function BrandLogo({ name, color, logoUrl, initials, size = 56 }: { name: string; color: string; logoUrl?: string | null; initials?: string; size?: number }) {
  const abbr = initials ?? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (logoUrl) return <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-white shadow-sm" style={{ width: size, height: size }}><img src={logoUrl} alt={name} width={size} height={size} className="h-full w-full object-contain p-1" draggable={false} /></div> // eslint-disable-line @next/next/no-img-element
  return <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white shadow-sm" style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>{abbr}</div>
}

function PlatformRow({ p, isSelected, onSelect }: { p: PlatformEntry; isSelected: boolean; onSelect: (key: PlatformKey) => void }) {
  return (
    <button onClick={() => onSelect(p.key)} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-semibold transition hover:bg-primary/[0.06] ${isSelected ? 'bg-primary/[0.07] text-primary' : 'text-ink/75'}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.icon} alt="" className="h-[18px] w-[18px] flex-shrink-0 rounded-md object-contain" />
      <span className="flex-1">{p.label}</span>
      {isSelected && <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${GRAD_BTN}`} />}
    </button>
  )
}

function PlatformDropdown({ platforms, current, selected, onSelect }: { platforms: PlatformEntry[]; current: PlatformEntry; selected: PlatformKey; onSelect: (key: PlatformKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const primary = platforms.filter(p => p.isPrimary)
  const others  = platforms.filter(p => !p.isPrimary)
  useEffect(() => {
    const h1 = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const h2 = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', h1); window.addEventListener('keydown', h2)
    return () => { document.removeEventListener('mousedown', h1); window.removeEventListener('keydown', h2) }
  }, [])
  const choose = (key: PlatformKey) => { onSelect(key); setOpen(false) }
  return (
    <div ref={ref} className="relative z-30 w-[260px]">
      <button onClick={() => setOpen(o => !o)} className={`flex w-full items-center gap-2.5 rounded-xl border bg-white px-4 py-2.5 text-[13px] font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 ${CARD} ${open ? 'border-primary/30' : 'border-primary/12'}`}>
        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/40">Showing</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.icon} alt="" className="h-[18px] w-[18px] flex-shrink-0 rounded-md object-contain" />
        <span className="flex-1 truncate text-ink">{current.label}</span>
        {current.isPrimary && <span className="flex-shrink-0 text-primary"><StarIcon s={14} /></span>}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className={`flex-shrink-0 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className={`absolute right-0 top-[calc(100%+8px)] w-full overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
          <div className="px-4 pb-2 pt-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Primary platform</div>
          {primary.map(p => <PlatformRow key={p.key} p={p} isSelected={selected === p.key} onSelect={choose} />)}
          <div className="mx-4 my-1.5 h-px bg-primary/8" />
          <div className="px-4 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/35">Other platforms</div>
          <div className="max-h-[260px] overflow-y-auto pb-2">{others.map(p => <PlatformRow key={p.key} p={p} isSelected={selected === p.key} onSelect={choose} />)}</div>
        </div>
      )}
    </div>
  )
}

function PartnershipsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open, onClose])
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} className={`fixed inset-0 z-[600] flex items-center justify-center bg-ink/55 p-5 backdrop-blur-[6px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div role="dialog" aria-modal="true" className={`max-h-[90vh] w-full max-w-[580px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_-12px_rgba(10,6,18,0.35)] transition-all duration-300 ease-[cubic-bezier(0.34,1.5,0.64,1)] flex flex-col ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}>
        <div className="flex-shrink-0 flex items-center justify-between border-b border-primary/10 bg-white px-7 py-5">
          <div><h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">Brand Partnerships</h3><p className="mt-0.5 text-[12px] text-ink/45">{EXCLUSIVE_DEALS.length} active partnerships</p></div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sub text-ink/45 transition hover:bg-surface-card hover:text-ink text-[13px]">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4">
          {EXCLUSIVE_DEALS.map(deal => (
            <div key={deal.id} className={`rounded-2xl border bg-white p-5 ${CARD} ${deal.exclusive ? 'border-primary/20' : 'border-primary/10'}`} style={{ background: `linear-gradient(135deg, ${deal.color}0a 0%, transparent 60%)` }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <BrandLogo name={deal.brand} color={deal.color} logoUrl={deal.logo} initials={deal.logoText} size={48} />
                  <div><span className="text-[18px] font-black tracking-[-0.03em] block leading-tight" style={{ color: deal.color }}>{deal.logoText}</span><span className="text-[12px] font-semibold text-ink/50">{deal.scope}</span></div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {deal.exclusive ? <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${GRAD_BTN} text-white`}>Exclusive</span> : <span className="rounded-md border border-primary/20 bg-primary/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">Preferred</span>}
                  <span className="rounded-md border border-primary/12 bg-primary/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-primary/70">{deal.category}</span>
                </div>
              </div>
              <p className="text-[13px] leading-[1.75] text-ink/65">{deal.description}</p>
              <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-primary/8 pt-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink/45"><CalendarIcon s={12} /> {deal.duration} · Since {deal.since}</span>
                {deal.blockedCategory && <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400/80"><LockIcon s={12} /> Blocks: {deal.blockedCategory}</span>}
              </div>
              <div className="mt-3.5 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white"><Check s={12} /></span>
                <span className="text-[12px] font-semibold text-green-800">{deal.exclusive ? 'Signed in — Exclusive Partner' : 'Signed in — Preferred Partner'}</span>
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

function BentoStat({ value, label, delay, topRightIcon }: { value: string; label: string; delay: number; topRightIcon?: ReactNode }) {
  return (
    <Reveal delay={delay}>
      <div className={`relative flex h-full flex-col justify-center rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
        {topRightIcon && <div className="absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/10 bg-surface-sub p-3 text-primary">{topRightIcon}</div>}
        <div className={`${GRAD_TEXT} text-[clamp(26px,3.5vw,34px)] font-black tracking-[-0.04em]`}>{value}</div>
        <div className="mt-1.5 text-[12px] font-medium text-ink/55">{label}</div>
      </div>
    </Reveal>
  )
}

function Phone({ src, label }: { src?: string; label?: string }) {
  return (
    <div className="relative w-[210px] flex-shrink-0 snap-center sm:w-[220px]">
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] border-[7px] border-ink bg-ink shadow-[0_24px_50px_-16px_rgba(10,6,18,0.5)]">
        <div className="absolute left-1/2 top-2.5 z-10 h-4 w-20 -translate-x-1/2 rounded-lg bg-ink" />
        {src ? <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          : <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/25 via-primary-lt/20 to-magenta/25 text-white/70"><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Play /></span><span className="text-[11px] font-semibold uppercase tracking-[0.15em]">{label || 'Reel'}</span></div>}
      </div>
    </div>
  )
}

function CollaborationCarousel({ collaborations }: { collaborations: typeof COLLABORATIONS }) {
  const [current, setCurrent] = useState(0)
  const total = collaborations.length
  const prev = () => setCurrent(c => c > 0 ? c - 1 : c)
  const next = () => setCurrent(c => c < total - 1 ? c + 1 : c)
  const item = collaborations[current]
  if (!item) return null
  return (
    <div className="relative w-full">
      <div className="mb-3 flex items-center justify-between sm:justify-end">
        <span className="text-sm font-medium text-ink/40 sm:hidden">{current + 1} / {total}</span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-ink/40 sm:inline">{current + 1} / {total}</span>
          <div className="flex gap-1.5">
            <button onClick={prev} disabled={current === 0} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            <button onClick={next} disabled={current === total - 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/10 bg-white text-ink/60 transition hover:bg-primary/[0.06] hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          </div>
        </div>
      </div>
      <div className={`flex flex-col gap-6 rounded-2xl border border-primary/10 bg-white p-6 transition hover:-translate-y-1 sm:flex-row sm:p-8 ${CARD} ${CARD_HOVER}`}>
        <div className="flex flex-1 flex-col space-y-4 pr-0 sm:pr-6">
          <div className="flex items-center gap-3"><span className="rounded-full bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">Featured collaboration</span><span className="text-xs font-medium text-ink/40">#{current + 1}</span></div>
          <div><h3 className="text-2xl font-extrabold tracking-[-0.03em] text-ink">We collaborated with <span className={GRAD_TEXT}>{item.brand}</span></h3><p className="mt-1 text-lg font-semibold text-ink/80">{item.title}</p></div>
          <p className="text-[15px] leading-relaxed text-ink/70">{item.description}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm">
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /><span className="font-medium text-ink/60">Target:</span><span className="font-semibold text-ink">{item.target}</span></span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-magenta" /><span className="font-medium text-ink/60">Result:</span><span className="font-semibold text-ink">{item.result}</span></span>
          </div>
          {item.metrics && <div className="grid grid-cols-2 gap-2.5">{item.metrics.map((m, i) => <div key={i} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-surface-sub px-3.5 py-3"><span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary"><MetricIcon name={m.icon} s={16} /></span><div><div className="text-[13px] font-black tracking-[-0.02em] text-ink">{m.value}</div><div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink/40">{m.label}</div></div></div>)}</div>}
          {item.insight && <div className="rounded-lg border border-primary/10 bg-primary/[0.03] px-4 py-3"><p className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/[0.10] text-primary"><LightbulbIcon s={13} /></span>Key insight</p><p className="text-sm font-medium leading-relaxed text-ink/70">{item.insight}</p></div>}
        </div>
        <div className="flex justify-center sm:justify-end"><Phone src={item.videoSrc} label={item.title} /></div>
      </div>
      {item.review && (
        <div className={`mt-4 w-full rounded-2xl border border-primary/10 bg-white px-7 py-6 ${CARD}`}>
          <div className="mb-4 flex items-center gap-4"><GradientStars rating={item.review.rating} total={5} size={28} idSuffix={`-collab-${item.id}`} /><span className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink/35">{item.review.rating}/5 · Campaign review</span></div>
          <p className="text-[15.5px] leading-[1.85] text-ink/75 sm:text-[16px]">"{item.review.quote}"</p>
          <div className="mt-5 flex items-center gap-3 border-t border-primary/10 pt-4">
            <BrandLogo name={item.review.company} color={item.review.brandColor} logoUrl={item.review.brandLogoUrl} initials={item.review.brandInitials} size={44} />
            <div><div className="text-[14px] font-bold text-ink">{item.review.name}</div><div className="mt-0.5 text-[12px] text-ink/50">{item.review.role} · {item.review.company}</div></div>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkModel({ name, price, priceLabel, icon, features, description, popular = false, delay = 0, onChoose }: { name: string; price: string; priceLabel: string; icon: ReactNode; features: string[]; description: string; popular?: boolean; delay?: number; onChoose: () => void }) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className={`group relative flex h-full flex-col rounded-2xl border bg-white p-6 transition-all hover:-translate-y-2 hover:shadow-xl ${popular ? 'border-primary/30 bg-gradient-to-br from-primary/[0.08] via-primary-lt/[0.04] to-magenta/[0.06] ring-2 ring-primary/20' : 'border-primary/10'} ${CARD} ${CARD_HOVER}`}>
        {popular && <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${GRAD_BTN} px-4 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_4px_12px_rgba(139,49,232,0.4)]`}>Most popular</span>}
        <div className={`mb-4 flex items-center justify-center rounded-xl border border-primary/10 bg-surface-sub text-primary ${popular ? 'h-16 w-16' : 'h-14 w-14'}`}>{icon}</div>
        <h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{name}</h3>
        <div className="mt-1 flex items-baseline gap-1.5"><span className="text-2xl font-black text-ink">{price}</span><span className="text-sm font-medium text-ink/50">{priceLabel}</span></div>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">{description}</p>
        <ul className="mt-4 flex-1 space-y-2 border-t border-primary/10 pt-4 text-sm">{features.map((f, i) => <li key={i} className="flex items-start gap-2.5 text-ink/70"><span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-r from-primary to-magenta" />{f}</li>)}</ul>
        <button onClick={onChoose} className={`mt-6 w-full rounded-lg py-2.5 text-sm font-bold transition hover:-translate-y-0.5 ${popular ? `${GRAD_BTN} text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)] hover:shadow-xl` : 'border border-primary/20 bg-white text-primary hover:bg-primary/[0.04]'}`}>Choose this</button>
      </div>
    </Reveal>
  )
}

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
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc) }, [onClose])
  const submit = async () => {
    if (!ok) return; setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/inbox/${slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: isInq ? 'inquiry' : 'message', senderName: form.name, senderCompany: form.company, senderEmail: form.email, message: form.message, budget }) })
      const json = await res.json().catch(() => ({ success: true }))
      if (!json.success && res.status !== 429) throw new Error(json.message || 'Could not send.')
      setSent(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send. Please try again.') } finally { setLoading(false) }
  }
  const inp = 'w-full rounded-lg border border-primary/12 bg-surface-sub px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30'
  const lbl = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/50'
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} className={`fixed inset-0 z-[500] flex items-center justify-center bg-ink/50 p-5 backdrop-blur-[6px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div role="dialog" aria-modal="true" className={`max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_70px_-12px_rgba(10,6,18,0.3)] transition-all duration-300 ease-[cubic-bezier(0.34,1.5,0.64,1)] ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/10 bg-white px-6 py-5"><h3 className="text-lg font-extrabold tracking-[-0.02em] text-ink">{sent ? 'Message sent!' : isInq ? 'Work with me' : 'Send a message'}</h3><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-sub text-base text-ink/50 transition hover:bg-surface-card hover:text-ink">✕</button></div>
        <div className="p-6">
          {sent ? (
            <div className="py-6 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/12 text-green-500"><Check s={30} /></div><h3 className="mb-2 text-xl font-extrabold text-ink">{isInq ? "You're in the inbox!" : 'Message sent!'}</h3><p className="mx-auto max-w-[340px] text-sm leading-[1.7] text-ink/65">{form.name && `Thanks, ${form.name.split(' ')[0]} — `}{firstName} will reply to <b className="text-primary">{form.email || 'your email'}</b> within 48 hours.</p><button onClick={onClose} className={`mx-auto mt-6 rounded-lg ${GRAD_BTN} px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5`}>Done</button></div>
          ) : (
            <><p className="mb-5 text-sm leading-[1.6] text-ink/65">{isInq ? "Tell me about your product and goal — I'll reply with a tailored quote within 48 hours." : 'Introduce yourself and tell me what you have in mind. I read every message.'}</p>
            {error && <div className="mb-4 rounded-lg border border-primary/40 bg-primary/[0.06] px-3 py-2 text-[13px] text-primary">{error}</div>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className={lbl}>Your name *</label><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" /></div><div><label className={lbl}>Company</label><input className={inp} value={form.company} onChange={e => set('company', e.target.value)} placeholder="Brand Co." /></div></div>
            <div className="mt-4"><label className={lbl}>Email address *</label><input type="email" className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@brand.com" /></div>
            {isInq && <div className="mt-4"><label className={lbl}>Budget range</label><div className="flex flex-wrap gap-2">{BUDGETS.map(b => <button key={b} type="button" onClick={() => setBudget(b)} className={`rounded-lg border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition ${budget === b ? 'border-primary bg-primary/[0.08] text-primary' : 'border-primary/12 bg-white text-ink/55'}`}>{b}</button>)}</div></div>}
            <div className="mt-4"><label className={lbl}>{isInq ? 'About your project *' : 'Your message *'}</label><textarea className={`${inp} min-h-[108px] resize-y leading-relaxed`} value={form.message} onChange={e => set('message', e.target.value)} placeholder={isInq ? "What are you promoting? What's the goal?" : `Hi ${firstName}, I'm reaching out because…`} /></div>
            <button onClick={submit} disabled={!ok || loading} className={`mt-5 w-full rounded-lg ${GRAD_BTN} py-3.5 text-[15px] font-bold text-white shadow-[0_8px_28px_-6px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-surface-card disabled:bg-none disabled:text-ink/30 disabled:shadow-none`}>{loading ? 'Sending…' : `Send ${isInq ? 'inquiry' : 'message'}`}</button></>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE EXPORT — preview wrapper + full creator profile
   ══════════════════════════════════════════════════════════════════════ */
export default function PreviewPage() {
  const [modal, setModal]                   = useState<'inquiry' | 'message' | null>(null)
  const [partnershipsOpen, setPartnershipsOpen] = useState(false)
  const [platformKey, setPlatformKey]       = useState<PlatformKey>('instagram')

  /* Preview / publish state */
  const [confirmOpen, setConfirmOpen]       = useState(false)
  const [publishing, setPublishing]         = useState(false)
  const [isPublished, setIsPublished]       = useState(false)
  const [shareOpen, setShareOpen]           = useState(false)

  const platform = PLATFORM_DATA[platformKey]
  const c        = CREATOR
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const handlePublishClick = () => setConfirmOpen(true)
  const handleConfirmPublish = async () => {
    setPublishing(true)
    /* Simulate API call — replace with real publish endpoint */
    await new Promise(r => setTimeout(r, 1400))
    setPublishing(false)
    setConfirmOpen(false)
    setIsPublished(true)
    /* Open share dialog immediately after publish */
    setTimeout(() => setShareOpen(true), 300)
  }

  const NAV_LEFT  = [{ label: 'About',  action: () => scrollTo('about')   }, { label: 'Matrix',  action: () => scrollTo('matrix') }]
  const NAV_RIGHT = [{ label: 'Work',   action: () => scrollTo('work')    }, { label: 'Contact', action: () => setModal('message') }]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ PREVIEW BANNER (sticky, always visible) ════ */}
      <PreviewBanner onPublish={handlePublishClick} isPublished={isPublished} />

      {/* ════ PUBLISH CONFIRM DIALOG ════ */}
      <PublishConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmPublish}
        loading={publishing}
      />

      {/* ════ SHARE DIALOG ════ */}
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={PUBLISHED_URL}
      />

      {/* ════════════════════════════════════════════════════════════════
          CREATOR PROFILE — exact replica of the public profile page
          ════════════════════════════════════════════════════════════════ */}

      {/* HEADER */}
      <header className="relative">
        <div className="relative h-[260px] w-full overflow-hidden bg-gradient-to-br from-primary/30 via-primary-lt/25 to-magenta/30 sm:h-[320px] md:h-[360px]"
          style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          {!c.coverUrl && <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold uppercase tracking-[0.2em] text-white/55">Cover image</span>}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-canvas/30" />
        </div>

        {/* Nav pill */}
        <div className="absolute inset-x-0 z-40 flex justify-center px-4" style={{ top: 28 }}>
          <div className="w-full max-w-[600px]">
            <div className="relative flex w-full items-center justify-between rounded-2xl px-4 py-3" style={{ overflow: 'visible', border: 'none', boxShadow: 'none' }}>
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
                style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.88) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.88) 70%, rgba(255,255,255,0.88) 100%)', WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)', maskImage: 'linear-gradient(90deg, #000 0%, #000 30%, transparent 42%, transparent 58%, #000 70%, #000 100%)' }} />
              <div className="relative z-10 flex items-center gap-0.5">{NAV_LEFT.map(n => <button key={n.label} onClick={n.action} className="rounded-lg px-1.5 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-4">{n.label}</button>)}</div>
              <div className="w-16 flex-shrink-0" aria-hidden="true" />
              <div className="relative z-10 flex items-center gap-0.5">{NAV_RIGHT.map(n => <button key={n.label} onClick={n.action} className="rounded-lg px-1.5 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:px-4">{n.label}</button>)}</div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"><NexLogo className="h-10 sm:h-[120px] pointer-events-auto drop-shadow-[0_6px_24px_rgba(139,49,232,0.65)]" /></div>
            </div>
          </div>
        </div>

        {/* Avatar + name */}
        <div className="mx-auto -mt-20 flex max-w-[1080px] flex-col items-center px-6 sm:-mt-24">
          <div className={`relative z-20 h-36 w-36 overflow-hidden rounded-2xl border-4 border-white ${GRAD_BTN} shadow-[0_16px_44px_-12px_rgba(139,49,232,0.45)] sm:h-44 sm:w-44`}
            style={c.avatarUrl ? { backgroundImage: `url(${c.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!c.avatarUrl && <span className="flex h-full w-full items-center justify-center text-5xl font-black text-white">{c.initials}</span>}
          </div>
          <h1 className="mt-5 flex w-full items-center justify-center gap-2.5 text-center text-[clamp(34px,6vw,56px)] font-black leading-none tracking-[-0.045em] text-ink">
            <span>{c.name}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Tick.svg" alt="" className="h-8 w-8" />
          </h1>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink/60"><span className="text-primary"><Pin /></span>Based in {c.location}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
            {SOCIAL_LINKS.map(s => (
              <a key={s.key} href={s.href} aria-label={s.label} title={s.label} className="flex h-8 w-8 items-center justify-center transition-all duration-200 hover:-translate-y-1 hover:opacity-90 hover:drop-shadow-[0_6px_16px_rgba(139,49,232,0.35)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.label} draggable={false} className="block h-full w-full overflow-hidden rounded-md object-contain" />
              </a>
            ))}
          </div>
          {c.websiteUrl && (
            <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2.5 rounded-xl border border-primary/15 bg-white px-5 py-2.5 text-[13.5px] font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30">
              <GlobeIcon s={16} /><span>Visit Website</span>
            </a>
          )}
          {EXCLUSIVE_DEALS.length > 0 && (
            <div className="mt-8">
              <button onClick={() => setPartnershipsOpen(true)} className={`inline-flex items-center gap-2.5 rounded-xl ${GRAD_BTN} px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
                <Shield s={14} />View Brand Partnerships &amp; Exclusivities
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ABOUT */}
      <section id="about" className="py-16">
        <div className="mx-auto max-w-[640px] px-6 text-center">
          <SectionHead kicker="Nice to meet you">The person <G>behind the feed</G></SectionHead>
          <Reveal delay={80}>
            <p className="mt-6 text-[clamp(16px,2vw,18px)] leading-[1.85] text-ink/70">{c.bio}</p>
            <button onClick={() => setModal('message')} className={`mt-7 rounded-lg ${GRAD_BTN} px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5`}>Contact me</button>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">{c.genres.map(g => <span key={g} className="rounded-lg border border-primary/15 bg-white px-4 py-2 text-[13px] font-semibold text-primary">{g}</span>)}</div>
          </Reveal>
        </div>
      </section>

      {/* Marquee */}
      <Reveal className="pb-6 text-center">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">Trusted by brands across the Baltics</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
          <div className="flex w-max gap-16 animate-marquee hover:[animation-play-state:paused]">
            {[...BRANDS, ...BRANDS].map((b, i) => <span key={i} className="whitespace-nowrap text-[22px] font-extrabold tracking-[-0.03em] text-ink/35 transition hover:text-primary">{b}</span>)}
          </div>
        </div>
      </Reveal>

      {/* MATRIX */}
      <section id="matrix" className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="The matrix" className="mb-9">Audience, by the <G>numbers</G></SectionHead>
          <div className="mb-6 flex justify-end">
            <PlatformDropdown platforms={PLATFORM_LIST} current={platform} selected={platformKey} onSelect={setPlatformKey} />
          </div>
          <div key={platformKey}>
            <Reveal>
              <div className={`grid grid-cols-2 gap-x-4 gap-y-7 rounded-2xl border border-primary/10 bg-white p-6 sm:grid-cols-4 sm:gap-4 sm:p-9 ${CARD} [&>*:not(:last-child)]:sm:border-r [&>*:not(:last-child)]:sm:border-primary/8`}>
                {platform.stats.map(s => <Stat key={s.label} {...s} />)}
              </div>
            </Reveal>
            <div className="mt-5 grid auto-rows-[minmax(140px,auto)] grid-cols-2 gap-4 md:grid-cols-4">
              <Reveal className="col-span-2 row-span-2 md:col-span-2">
                <div className={`relative flex h-full flex-col rounded-2xl border border-primary/10 bg-white p-7 ${CARD}`}>
                  <div className="absolute right-5 top-5 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/12 bg-surface-sub text-primary"><ChatBubbleIcon s={32} /></div>
                  <span className="inline-flex w-fit items-center rounded-lg bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">What I talk about</span>
                  <div className="flex-1" />
                  <p className="text-[15px] leading-[1.8] text-ink/70">{platform.demographics.talkAbout}</p>
                </div>
              </Reveal>
              <BentoStat delay={60}  value={platform.demographics.primaryGender.value}   label={platform.demographics.primaryGender.label}   topRightIcon={<PersonIcon s={26} />} />
              <BentoStat delay={120} value={platform.demographics.primaryAge.value}      label={platform.demographics.primaryAge.label}       topRightIcon={<HeartPulseIcon s={26} />} />
              <BentoStat delay={180} value={platform.demographics.audience}              label="Total followers"                               topRightIcon={<EyeIcon s={26} />} />
              <BentoStat delay={240} value={platform.demographics.primaryLocation.value} label={platform.demographics.primaryLocation.label}  topRightIcon={<CountryFlag code={platform.demographics.primaryLocation.flagCode} className="h-[18px] w-[28px]" />} />
            </div>
          </div>
        </div>
      </section>

      {/* WORK */}
      <section id="work" className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="My work" className="mb-10">Photos <span className="font-light text-ink/35">&amp;</span> <G>reels</G></SectionHead>
          <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[170px] md:grid-cols-4">
            {PHOTOS.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60} className={p.cls}>
                <div className={`group relative h-full w-full overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 via-primary-lt/10 to-magenta/15 ${CARD}`}>
                  {p.src ? <img src={p.src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">Photo</span>}{/* eslint-disable-line @next/next/no-img-element */}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12"><CollaborationCarousel collaborations={COLLABORATIONS} /></Reveal>
        </div>
      </section>

      {/* WAYS TO WORK */}
      <section className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="Let's deal" className="mb-10" sub="Three clear ways to collaborate — pick what fits, or mix them.">Ways to work <G>together</G></SectionHead>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <WorkModel delay={0}   name="Affiliate / Revenue Share" price="10–20%" priceLabel="per sale"    icon={<Shield s={28} />}      features={['Lower or zero upfront','Earn a cut of every sale','Incentives fully aligned','Trackable codes & links']}         description="My favourite model. I only win when you do."       popular={true}  onChoose={() => setModal('inquiry')} />
            <WorkModel delay={90}  name="Paid Campaigns"            price="From €350" priceLabel="per video" icon={<ZapIcon s={28} />}     features={['Flat fee per deliverable','You brief, I produce','Full usage rights included','Fast turnaround']}               description="Straightforward, predictable pricing."            popular={false} onChoose={() => setModal('inquiry')} />
            <WorkModel delay={180} name="Barter / Gifting"          price="€120+"  priceLabel="product value" icon={<HandshakeIcon s={28} />} features={['Product-for-content exchange','Select premium items only','I genuinely use what I promote','Limited spots available']} description="For brands with products I'd honestly love."       popular={false} onChoose={() => setModal('inquiry')} />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink px-6 pb-28 pt-24 md:pb-0">
        <div className="mx-auto max-w-[900px]">
          <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-center sm:gap-14">
            <div className="flex-shrink-0">
              <div className="h-44 w-44 overflow-hidden rounded-2xl border-4 border-white shadow-[0_20px_50px_-12px_rgba(139,49,232,0.55)]" style={c.avatarUrl ? { backgroundImage: `url(${c.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                {!c.avatarUrl && <span className={`flex h-full w-full items-center justify-center text-5xl font-black text-white ${GRAD_BTN}`}>{c.initials}</span>}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-[clamp(26px,4.5vw,42px)] font-black leading-[1.08] tracking-[-0.04em] text-white">Let's make something <span className={GRAD_TEXT}>that sells.</span></h2>
              <p className="mt-3 text-[14.5px] leading-[1.7] text-white/55">Tell me about your product and your goal. One message — I reply within 48 hours.</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <button onClick={() => setModal('inquiry')} className={`rounded-xl ${GRAD_BTN} px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_32px_-8px_rgba(139,49,232,0.55)] transition hover:-translate-y-0.5`}>Work with me via Creator Nexus</button>
                <button onClick={() => setModal('message')} className="rounded-xl border-[1.5px] border-white/25 px-7 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white/[0.06]">Send a message</button>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/8 py-6 text-center">
            <a href="/authenticate" className={`text-[13px] font-semibold ${GRAD_TEXT} underline-offset-4 hover:underline`}>Create Your Own Creator Profile on Nexus and Get Discovered by Brands</a>
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