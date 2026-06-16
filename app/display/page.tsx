'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Creator portfolio — page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════ */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const CARD = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const CARD_HOVER = 'hover:shadow-[0_2px_6px_rgba(10,6,18,0.05),0_24px_56px_-16px_rgba(139,49,232,0.30)]'

/* ════════════════════════════════════════════════════════════════════
   ★★★  YOUR MEDIA GOES HERE  ★★★
   ────────────────────────────────────────────────────────────────────
   1. Cover + avatar → CREATOR.coverUrl / CREATOR.avatarUrl below.
   2. Photos        → PHOTOS array: set each `src` to your image URL.
   3. Reels (video) → REELS array: set each `src` to your .mp4/.webm URL.
   Anything left as '' shows a labelled placeholder, so the layout never breaks.
   ════════════════════════════════════════════════════════════════════ */
const CREATOR = {
  name: 'Amelia Roze', firstName: 'Amelia', initials: 'AR',
  location: 'Riga, Latvia',
  bio: "I'm a beauty & lifestyle creator who turns everyday rituals into content that sells. My videos feel like a friend's recommendation, not an ad — which is exactly why my audience acts on them. I work with brands that care about real engagement, not vanity reach.",
  genres: ['Beauty', 'Skincare', 'Lifestyle', 'Wellness'],
  coverUrl: '/test/images/Header.png',   // ← cover / banner image
  avatarUrl: '/test/images/Harshul.png',  // ← profile photo (shown as a square)
}
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
  primaryLocation: { value: 'Latvia', label: 'Top location · 64%' },
  talkAbout: "I create honest beauty and skincare content — morning routines, product results filmed over real time, and lifestyle vlogs from around Riga. My audience trusts me because I only feature what I'd actually rebuy, so when I recommend something, they act on it.",
}
const BRANDS = ['Lumora', 'Kinetics', 'Glossé', 'Nordic Skin', 'Bēta Beauty', 'Aura Labs']

/* PHOTO BENTO — 7 tiles, tiles a 4-col grid perfectly (no gaps). */
const PHOTOS = [
  { id: 'p1', src: '/test/images/Lecture.png', cls: 'col-span-2 md:col-span-2 md:row-span-2' },
  { id: 'p2', src: '/test/images/Listening.png', cls: 'col-span-2 md:col-span-2 md:row-span-1' },
  { id: 'p3', src: '/test/images/Kinetics-Leader.png', cls: 'col-span-1' },
  { id: 'p4', src: '/test/images/Drink.png', cls: 'col-span-1' },
  { id: 'p5', src: '/test/images/Food.png', cls: 'col-span-1' },
  { id: 'p6', src: '/test/images/Influencing.png', cls: 'col-span-1' },
  { id: 'p7', src: '/test/images/Kinetics-phone.png', cls: 'col-span-2 md:col-span-2' },
]
/* REELS — autoplay/muted/loop video. Set src to your video file. */
const REELS = [
  { id: 'r1', src: '/test/video/Drink.mp4', label: 'Skincare routine' },
  { id: 'r2', src: '/test/video/Food.mp4', label: 'GRWM spring' },
  { id: 'r3', src: '/test/video/People.mp4', label: 'Vitamin-C results' },
]
const TESTIMONIALS = [
  { id: '1', rating: 5, quote: "Amelia delivered ahead of deadline and the results spoke for themselves — best-converting creator in our whole spring campaign. We've already rebooked her twice.", name: 'Elena Roze', role: 'Brand Manager · Kinetics' },
  { id: '2', rating: 5, quote: 'Working with Amelia felt like working with a marketing partner, not a creator. She understood our product, our margins, and pitched the affiliate model herself. Rare.', name: 'Mārtiņš Ozols', role: 'Founder · Lumora Skincare' },
  { id: '3', rating: 5, quote: "The content didn't feel like an ad — it felt like a recommendation. Our DMs blew up the day it went live.", name: 'Anna Kalniņa', role: 'Marketing Lead · Glossé' },
  { id: '4', rating: 5, quote: 'Clear rates, clear timeline, clear results. We upgraded a small barter collab to a paid partnership the next quarter.', name: 'Dāvis Liepa', role: 'Co-founder · Aura Labs' },
]
const BUDGETS = ['Under €350', '€350–€890', '€890–€2,500', '€2,500+', 'Affiliate only', 'Not sure yet']

/* ─── Icons (no arrows) ─────────────────────────────────────────────── */
const Sparkle = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.2L21 9l-5 4.3L17.6 21 12 17.2 6.4 21 8 13.3 3 9l6.6-.8L12 2z" /></svg>
const Check = ({ s = 16 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Play = ({ s = 18 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
const Pin = ({ s = 15 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.6" /></svg>
const SOCIAL: Record<string, ReactNode> = {
  instagram: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" /><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" /></svg>,
  tiktok: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  youtube: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="1.6" /><path d="M10 9l5 3-5 3V9z" fill="currentColor" /></svg>,
}

/* ─── Reveal-on-scroll ──────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>{children}</div>
}

/* ─── Animated stat ─────────────────────────────────────────────────── */
function Stat({ to, dec, suffix, label }: { to: number; dec: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [val, setVal] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVal(to); return }
      const dur = 1500, t0 = performance.now()
      const tick = (n: number) => { const p = Math.min((n - t0) / dur, 1); setVal(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); else setVal(to) }
      requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return (
    <div ref={ref} className="relative px-2 py-3 text-center">
      <div className="text-[clamp(28px,4.2vw,42px)] font-black leading-none tracking-[-0.045em] text-ink">{val.toFixed(dec)}<span className="bg-gradient-to-r from-primary to-magenta bg-clip-text text-transparent">{suffix}</span></div>
      <div className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/45">{label}</div>
    </div>
  )
}

/* ─── Section head — symmetric, human kicker (no one-sided AI line) ──── */
function SectionHead({ kicker, children, sub, className = '' }: { kicker: string; children: ReactNode; sub?: string; className?: string }) {
  return (
    <Reveal className={`text-center ${className}`}>
      <p className="mb-4 flex items-center justify-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.22em] text-ink/40">
        <span className="h-1.5 w-1.5 rotate-45 bg-gradient-to-br from-primary to-magenta" />
        {kicker}
        <span className="h-1.5 w-1.5 rotate-45 bg-gradient-to-br from-primary to-magenta" />
      </p>
      <h2 className="text-[clamp(30px,4.8vw,48px)] font-black leading-[1.02] tracking-[-0.045em] text-ink">{children}</h2>
      {sub && <p className="mx-auto mt-4 max-w-[540px] text-base leading-[1.7] text-ink/60">{sub}</p>}
    </Reveal>
  )
}
/* gradient keyword helper for headings */
const G = ({ children }: { children: ReactNode }) => <span className="bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent">{children}</span>

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function Page() {
  const [modal, setModal] = useState<'inquiry' | 'message' | null>(null)
  const c = CREATOR
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const NAV = [
    { label: 'About', action: () => scrollTo('about') },
    { label: 'Matrix', action: () => scrollTo('matrix') },
    { label: 'Work', action: () => scrollTo('work') },
    { label: 'Contact', action: () => setModal('message') },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

         {/* ════════ HEADER: cover + nav + square avatar ════════ */}
      <header className="relative">
        <div
          className="relative h-[260px] w-full overflow-hidden bg-gradient-to-br from-primary/30 via-primary-lt/25 to-magenta/30 sm:h-[320px] md:h-[360px]"
          style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          {!c.coverUrl && <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold uppercase tracking-[0.2em] text-white/55">Cover image</span>}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-canvas/30" />
 
          {/* Brand line sits ABOVE the bar; the bar holds only the 4 links */}
          <div className="absolute inset-x-0 top-0 z-30 flex flex-col items-center px-4 pt-5">
            <div className="mb-3 flex items-center gap-2.5 [text-shadow:0_1px_8px_rgba(255,255,255,0.5)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary-lt to-magenta text-white shadow-[0_4px_12px_-2px_rgba(139,49,232,0.5)]"><Sparkle s={14} /></span>
              <span className="text-[15px] font-extrabold tracking-[-0.01em] text-ink">It's me, {c.firstName}</span>
            </div>
            <nav className="flex w-full max-w-[520px] items-center justify-center gap-1 rounded-xl border border-white/40 bg-white/80 px-3 py-2.5 shadow-[0_8px_28px_-8px_rgba(10,6,18,0.25)] backdrop-blur-xl sm:gap-2">
              {NAV.map(n => <button key={n.label} onClick={n.action} className="rounded-lg px-4 py-2 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary">{n.label}</button>)}
            </nav>
          </div>
        </div>
 
        {/* SQUARE AVATAR — half on cover */}
        <div className="mx-auto -mt-20 flex max-w-[1080px] flex-col items-center px-6 sm:-mt-24">
          <div className="relative z-20 h-36 w-36 overflow-hidden rounded-2xl border-4 border-canvas bg-gradient-to-br from-primary-lt via-primary to-magenta shadow-[0_16px_44px_-12px_rgba(139,49,232,0.45)] sm:h-44 sm:w-44"
            style={c.avatarUrl ? { backgroundImage: `url(${c.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {!c.avatarUrl && <span className="flex h-full w-full items-center justify-center text-5xl font-black text-white">{c.initials}</span>}
            <span className="absolute bottom-2 left-2 rounded-md bg-green-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Open</span>
          </div>
          <h1 className="mt-5 text-[clamp(34px,6vw,56px)] font-black leading-none tracking-[-0.045em] text-ink">{c.name}</h1>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink/60"><span className="text-primary"><Pin /></span>Based in {c.location}</p>
          <div className="mt-5 flex gap-3">
            {Object.entries(SOCIAL).map(([k, icon]) => <a key={k} href="#" aria-label={k} className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/12 bg-white text-primary transition hover:-translate-y-1 hover:border-transparent hover:bg-gradient-to-br hover:from-primary hover:to-primary-lt hover:text-white hover:shadow-[0_12px_28px_-8px_rgba(139,49,232,0.4)]">{icon}</a>)}
          </div>
        </div>
      </header>
 

      {/* ════════ ABOUT ════════ */}
      <section id="about" className="py-16">
        <div className="mx-auto max-w-[640px] px-6 text-center">
          <SectionHead kicker="Nice to meet you">The person <G>behind the feed</G></SectionHead>
          <Reveal delay={80}>
            <p className="mt-6 text-[clamp(16px,2vw,18px)] leading-[1.85] text-ink/70">{c.bio}</p>
            <button onClick={() => setModal('message')} className="mt-7 rounded-lg bg-gradient-to-r from-primary to-primary-lt px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5">Contact me</button>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              {c.genres.map(g => <span key={g} className="rounded-lg border border-primary/15 bg-white px-4 py-2 text-[13px] font-semibold text-primary">{g}</span>)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* brands */}
      <Reveal className="pb-6 text-center">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">Trusted by brands across the Baltics</p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
          <div className="flex w-max gap-16 animate-marquee hover:[animation-play-state:paused]">
            {[...BRANDS, ...BRANDS].map((b, i) => <span key={i} className="whitespace-nowrap text-[22px] font-extrabold tracking-[-0.03em] text-ink/35 transition hover:text-primary">{b}</span>)}
          </div>
        </div>
      </Reveal>

      {/* ════════ MATRIX: stats + demographics bento ════════ */}
      <section id="matrix" className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="The matrix" className="mb-9">Audience, by the <G>numbers</G></SectionHead>

          <Reveal>
            <div className={`grid grid-cols-2 gap-x-4 gap-y-7 rounded-2xl border border-primary/10 bg-white p-9 sm:grid-cols-4 sm:gap-4 ${CARD} [&>*:not(:last-child)]:sm:border-r [&>*:not(:last-child)]:sm:border-primary/8`}>
              {STATS.map(s => <Stat key={s.label} {...s} />)}
            </div>
          </Reveal>

          {/* demographics bento — varied sizes, fully tiled */}
          <div className="mt-5 grid auto-rows-[minmax(120px,auto)] grid-cols-2 gap-4 md:grid-cols-4">
            <Reveal className="col-span-2 row-span-2 md:col-span-2">
              <div className={`flex h-full flex-col rounded-2xl border border-primary/10 bg-white p-7 ${CARD}`}>
                <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-lg bg-primary/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">What I talk about</span>
                <p className="text-[15px] leading-[1.8] text-ink/70">{DEMOGRAPHICS.talkAbout}</p>
              </div>
            </Reveal>
            <BentoStat delay={60} value={DEMOGRAPHICS.primaryGender.value} label={DEMOGRAPHICS.primaryGender.label} />
            <BentoStat delay={120} value={DEMOGRAPHICS.primaryAge.value} label={DEMOGRAPHICS.primaryAge.label} />
            <BentoStat delay={180} value={DEMOGRAPHICS.audience} label="Total followers" />
            <BentoStat delay={240} value={DEMOGRAPHICS.primaryLocation.value} label={DEMOGRAPHICS.primaryLocation.label} />
          </div>
        </div>
      </section>

      {/* ════════ WORK: photo bento + iPhone reels ════════ */}
      <section id="work" className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="My work" className="mb-10">Photos <span className="font-light text-ink/35">&amp;</span> <G>reels</G></SectionHead>

          {/* PHOTO BENTO — perfectly tiled. Set each photo's `src` in PHOTOS above. */}
          <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[170px] md:grid-cols-4">
            {PHOTOS.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60} className={p.cls}>
                <div className={`group relative h-full w-full overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/15 via-primary-lt/10 to-magenta/15 ${CARD}`}>
                  {p.src
                    ? <img src={p.src} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    : <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35">Photo</span>}
                </div>
              </Reveal>
            ))}
          </div>

          {/* iPHONE REELS — autoplay, muted, looped. Set each reel `src` in REELS above. */}
          <Reveal className="mt-12">
            <div className="flex snap-x gap-6 overflow-x-auto pb-4 sm:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {REELS.map(r => <Phone key={r.id} src={r.src} label={r.label} />)}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════ COMPENSATION — affiliate is double width ════════ */}
      <section className="border-y border-primary/10 bg-surface-sub py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="Let's deal" className="mb-10" sub="Three clear ways to collaborate — pick what fits, or mix them.">
            Ways to work <G>together</G>
          </SectionHead>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Deal big delay={0} status="open" name="Affiliate / revenue share" className="sm:col-span-2 lg:col-span-2"
              icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              desc="My favourite model. Lower (or zero) upfront, and I earn a cut of every sale your campaign drives. Incentives are fully aligned — I only win when you do, so I push the content that actually converts. Best for products with strong repeat purchase."
              foot={<><b className="text-base text-ink">10–20%</b> per sale · trackable codes &amp; links</>} />
            <Deal delay={90} status="open" name="Paid campaigns" className="sm:col-span-1"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="6" width="19" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" /></svg>}
              desc="Flat fee per deliverable. You brief, I produce, you get full usage rights."
              foot={<>From <b className="text-base text-ink">€350</b> / video</>} />
            <Deal delay={180} status="req" name="Barter / gifting" className="sm:col-span-1"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 8l4-4 4 4M20 16l-4 4-4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 4v9a3 3 0 003 3h2M16 20v-9a3 3 0 00-3-3h-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>}
              desc="Product-for-content, selectively, for premium items I'd genuinely use."
              foot={<>Value <b className="text-base text-ink">€120+</b></>} />
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-[1080px] px-6">
          <SectionHead kicker="The receipts" className="mb-9">What <G>brands</G> say</SectionHead>
          <div className="grid gap-5 md:grid-cols-2">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.id} delay={(i % 2) * 90}>
                <div className={`h-full rounded-2xl border border-primary/10 bg-white p-7 transition hover:-translate-y-1 ${CARD} ${CARD_HOVER}`}>
                  <div className="mb-4 flex gap-0.5 text-primary">{'★★★★★'.slice(0, t.rating)}</div>
                  <p className="text-[15px] leading-[1.85] text-ink/75">{t.quote}</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-primary/10 pt-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-lt text-[15px] font-extrabold text-white">{t.name[0]}</div>
                    <div><div className="text-[13.5px] font-bold text-ink">{t.name}</div><div className="mt-0.5 text-xs text-ink/50">{t.role}</div></div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA ════════ */}
      <section className="relative overflow-hidden bg-ink px-6 py-24 text-center">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 40%, rgba(139,49,232,0.38) 0%, transparent 62%), radial-gradient(ellipse 40% 50% at 78% 80%, rgba(255,51,188,0.24) 0%, transparent 60%)' }} />
        <Reveal className="relative z-10 mx-auto max-w-[540px]">
          <h2 className="text-[clamp(30px,5vw,46px)] font-black leading-[1.08] tracking-[-0.04em] text-white">Let's make something that sells.</h2>
          <p className="mb-8 mt-4 text-base leading-[1.7] text-white/55">Tell me about your product and your goal. One message — I reply within 48 hours.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setModal('inquiry')} className="rounded-lg bg-gradient-to-r from-primary to-primary-lt px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5">Work with me</button>
            <button onClick={() => setModal('message')} className="rounded-lg border-[1.5px] border-white/25 px-8 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:border-white hover:bg-white/[0.06]">Send a message</button>
          </div>
        </Reveal>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="bg-ink px-6 pb-16 pt-14 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary-lt to-magenta text-white"><Sparkle s={20} /></div>
        <p className="text-[13px] font-medium text-white/55">Promoted on Nexus by Nexfluence</p>
        <a href="/authenticate" className="mt-3 inline-block text-[13px] font-semibold text-primary-lt underline-offset-4 hover:underline">Create your own creator profile</a>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-[150] flex gap-2.5 border-t border-primary/10 bg-white/95 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <button onClick={() => setModal('message')} className="flex-1 rounded-lg border-[1.5px] border-primary/15 bg-white py-3 text-sm font-bold text-ink">Message</button>
        <button onClick={() => setModal('inquiry')} className="flex-[1.6] rounded-lg bg-gradient-to-r from-primary to-primary-lt py-3 text-sm font-bold text-white">Work with me</button>
      </div>

      <ContactModal open={modal !== null} type={modal ?? 'message'} slug="amelia-roze" firstName={c.firstName} onClose={() => setModal(null)} />
    </div>
  )
}

/* ─── Bento stat ────────────────────────────────────────────────────── */
function BentoStat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className={`flex h-full flex-col justify-center rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
        <div className="bg-gradient-to-r from-primary to-magenta bg-clip-text text-[clamp(26px,3.5vw,34px)] font-black tracking-[-0.04em] text-transparent">{value}</div>
        <div className="mt-1.5 text-[12px] font-medium text-ink/55">{label}</div>
      </div>
    </Reveal>
  )
}

/* ─── iPhone reel (autoplay) ────────────────────────────────────────── */
function Phone({ src, label }: { src?: string; label?: string }) {
  return (
    <div className="relative w-[210px] flex-shrink-0 snap-center sm:w-[220px]">
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] border-[7px] border-ink bg-ink shadow-[0_24px_50px_-16px_rgba(10,6,18,0.5)]">
        <div className="absolute left-1/2 top-2.5 z-10 h-4 w-20 -translate-x-1/2 rounded-lg bg-ink" />
        {src
          ? <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          : <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/25 via-primary-lt/20 to-magenta/25 text-white/70"><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur"><Play /></span><span className="text-[11px] font-semibold uppercase tracking-[0.15em]">{label || 'Reel'}</span></div>}
      </div>
    </div>
  )
}

/* ─── Compensation card ─────────────────────────────────────────────── */
function Deal({ icon, name, status, desc, foot, delay, big, className = '' }: { icon: ReactNode; name: string; status: 'open' | 'req'; desc: string; foot: ReactNode; delay: number; big?: boolean; className?: string }) {
  return (
    <Reveal delay={delay} className={className}>
      <div className={`group relative flex h-full flex-col rounded-2xl border bg-white p-7 transition hover:-translate-y-1.5 ${CARD} ${CARD_HOVER} ${big ? 'border-primary/25 bg-gradient-to-br from-primary/[0.05] to-magenta/[0.03] ring-1 ring-primary/15' : 'border-primary/10'}`}>
        <div className={`mb-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-lt text-white shadow-[0_8px_20px_-6px_rgba(139,49,232,0.5)] ${big ? 'h-16 w-16' : 'h-12 w-12'}`}>{icon}</div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`font-extrabold tracking-[-0.02em] text-ink ${big ? 'text-2xl' : 'text-[18px]'}`}>{name}</div>
          <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${status === 'open' ? 'bg-green-500/12 text-green-700' : 'bg-amber-500/15 text-amber-700'}`}>{status === 'open' ? 'Open' : 'On request'}</span>
        </div>
        <p className={`mt-3 flex-1 leading-[1.7] text-ink/65 ${big ? 'text-[15px]' : 'text-[14px]'}`}>{desc}</p>
        <div className="mt-5 border-t border-dashed border-primary/20 pt-4 text-[13px] text-ink/55">{foot}</div>
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
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const submit = async () => {
    if (!ok) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/inbox/${slug}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: isInq ? 'inquiry' : 'message', senderName: form.name, senderCompany: form.company, senderEmail: form.email, message: form.message, budget }),
      })
      const json = await res.json().catch(() => ({ success: true }))
      if (!json.success && res.status !== 429) throw new Error(json.message || 'Could not send.')
      setSent(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send. Please try again.') } finally { setLoading(false) }
  }

  const inp = 'w-full rounded-lg border border-primary/12 bg-surface-sub px-4 py-3 font-rubik text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.1)] placeholder:text-ink/30'
  const lbl = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-ink/50'

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} className={`fixed inset-0 z-[500] flex items-center justify-center bg-ink/50 p-5 backdrop-blur-[6px] transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div role="dialog" aria-modal="true" className={`max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_70px_-12px_rgba(10,6,18,0.3)] transition-all duration-300 ease-[cubic-bezier(0.34,1.5,0.64,1)] ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-6 scale-95 opacity-0'}`}>
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
              <button onClick={onClose} className="mx-auto mt-6 rounded-lg bg-gradient-to-r from-primary to-primary-lt px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">Done</button>
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
                <textarea className={`${inp} min-h-[108px] resize-y leading-relaxed`} value={form.message} onChange={e => set('message', e.target.value)} placeholder={isInq ? "What are you promoting? What's the goal?" : `Hi ${firstName}, I'm reaching out because…`} />
              </div>
              <button onClick={submit} disabled={!ok || loading} className="mt-5 w-full rounded-lg bg-gradient-to-r from-primary to-primary-lt py-3.5 text-[15px] font-bold text-white shadow-[0_8px_28px_-6px_rgba(139,49,232,0.5)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-surface-card disabled:bg-none disabled:text-ink/30 disabled:shadow-none disabled:hover:translate-y-0">
                {loading ? 'Sending…' : `Send ${isInq ? 'inquiry' : 'message'}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}