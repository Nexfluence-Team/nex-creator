'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ─── Design tokens (Nexfluence v4) ──────────────────────────────────── */
const C = {
  bgPage:     '#f8f7ff',
  bg:         '#ffffff',
  bgSub:      '#f5f3ff',
  bgCard:     '#ede9ff',
  ink:        '#0a0612',
  inkDim:     'rgba(10,6,18,0.50)',
  inkDim2:    'rgba(10,6,18,0.72)',
  inkFaint:   'rgba(10,6,18,0.28)',
  primary:    '#8b31e8',
  primaryLt:  '#b44af0',
  primaryMd:  '#a03be8',
  primaryBg:  'rgba(139,49,232,0.08)',
  grad:       'linear-gradient(90deg, #8b31e8, #b44af0)',
  gradD:      'linear-gradient(135deg, #8b31e8, #b44af0)',
  gradSoft:   'linear-gradient(135deg, rgba(139,49,232,0.12), rgba(180,74,240,0.06))',
  gradText:   'linear-gradient(90deg, #8b31e8, #b44af0)',
  rXs:        6,
  rSm:        10,
  rMd:        14,
  rLg:        20,
  rXl:        28,
  border:     '1px solid rgba(139,49,232,0.16)',
  borderH:    '1px solid rgba(139,49,232,0.45)',
  shadowSm:   '0 2px 12px rgba(139,49,232,0.10)',
  shadowMd:   '0 8px 32px rgba(139,49,232,0.14)',
  shadowLg:   '0 20px 60px rgba(139,49,232,0.18)',
  shadowCard: '0 4px 24px rgba(10,6,18,0.07)',
  font:       "'Rubik', sans-serif",
}

/* ─── Intersection Observer hook ────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ─── Counter animation ──────────────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, visible } = useInView()
  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = Math.ceil(to / 60)
    const id = setInterval(() => {
      start = Math.min(start + step, to)
      setVal(start)
      if (start >= to) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [visible, to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ─── Shared pill label ──────────────────────────────────────────────── */
function PillLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    }}>
      <div style={{ width: 20, height: 1, background: C.primary, flexShrink: 0 }} />
      <span style={{
        color: C.primary,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontFamily: C.font,
      }}>
        {children}
      </span>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div style={{
      background: C.bgPage,
      minHeight: '100vh',
      fontFamily: C.font,
      color: C.ink,
    }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 60% 50% at 50% 30%, ${C.primaryBg} 0%, transparent 65%)`,
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 520, width: '100%' }}>
          {/* Logo – transparent container, no shadow */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <div style={{
              width: 64, height: 64, borderRadius: C.rLg, overflow: 'hidden',
              background: 'transparent',
            }}>
              <img src="/Nex.webp" alt="Nexfluence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          <h1 style={{
            fontWeight: 900,
            fontSize: 'clamp(36px, 8vw, 56px)',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            marginBottom: 20,
            background: C.gradText,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Your Creator Portfolio, Ready in Minutes
          </h1>
          <p style={{ color: C.inkDim2, fontSize: 18, lineHeight: 1.6, marginBottom: 40, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
            Join the fastest‑growing network of Baltic creators. Get discovered by brands, showcase your work, and start earning.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 320, margin: '0 auto' }}>
            <Link
              href="/authenticate"
              style={{
                display: 'block',
                padding: '14px 24px',
                borderRadius: C.rSm,
                background: C.grad,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: C.shadowMd,
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
            >
              Create my portfolio 
            </Link>
            <Link
              href="/authenticate"
              style={{
                display: 'block',
                padding: '14px 24px',
                borderRadius: C.rSm,
                background: 'transparent',
                color: C.inkDim,
                fontSize: 15,
                fontWeight: 700,
                textAlign: 'center',
                border: `1.5px solid ${C.primaryBg}`,
                textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.ink }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.primaryBg; e.currentTarget.style.color = C.inkDim }}
            >
              Sign in
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary, boxShadow: `0 0 0 2px ${C.primaryBg}` }} />
            <span style={{ color: C.inkFaint, fontSize: 13, fontWeight: 500 }}>3,412+ creators already earning</span>
          </div>
        </div>
      </section>

      <StatsBar />

      <FeatureSection
        pill="Portfolio"
        heading="A portfolio that works while you sleep"
        body="One beautiful page that shows brands exactly who you are — your niche, your stats, your best work. No design skills needed."
        visual={<PortfolioVisual />}
        flip={false}
      />
      <FeatureSection
        pill="Discovery"
        heading="Brands find you, not the other way around"
        body="Your profile is searchable by brands actively looking for Baltic creators. Stop cold‑DMing. Start getting inbound."
        visual={<DiscoveryVisual />}
        flip={true}
      />
      <FeatureSection
        pill="Analytics"
        heading="Know who is looking at your work"
        body="See exactly when a brand views your portfolio, how long they stay, and which content they engage with most."
        visual={<AnalyticsVisual />}
        flip={false}
      />
      <FeatureSection
        pill="Share"
        heading="One link. Every platform."
        body="Drop it in your Instagram bio, email signature, or pitch deck. Your entire creator identity, one tap away."
        visual={<LinkVisual />}
        flip={true}
      />

      <SocialProof />

      <section style={{ padding: '80px 24px', textAlign: 'center', background: C.ink, position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${C.primaryBg} 0%, transparent 65%)`,
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 500, margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 38px)', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 16 }}>
            Ready to Get Discovered ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.75, marginBottom: 32 }}>
            Join Thousands of Baltic Creators Building their Brand on Creator Nexus.
          </p>
          <Link
            href="/authenticate"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              borderRadius: C.rSm,
              background: C.grad,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: C.shadowMd,
              transition: 'transform 0.2s, opacity 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
          >
            Create Portfolio for Free 
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        * { box-sizing: border-box; }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}

/* ─── Stats Bar ──────────────────────────────────────────────────────── */
function StatsBar() {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{
      background: C.bg,
      borderTop: `1px solid ${C.primaryBg}`,
      borderBottom: `1px solid ${C.primaryBg}`,
      padding: '40px 24px',
    }}>
      <div style={{
        maxWidth: 960, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, textAlign: 'center',
      }}>
        {[
          { n: 3412, suffix: '+', label: 'Active Creators' },
          { n: 850,  suffix: '+', label: 'Brand Partnerships' },
          { n: 4.6,  suffix: '', label: 'Average Rating' },
        ].map((s, i) => (
          <div key={i} style={{ opacity: visible ? 1 : 0, transition: `opacity 0.5s ease ${i * 0.12}s` }}>
            <div style={{ fontWeight: 900, fontSize: 'clamp(28px, 5vw, 36px)', letterSpacing: '-0.03em', color: C.primary }}>
              {visible ? <Counter to={s.n} suffix={s.suffix} /> : `0${s.suffix}`}
            </div>
            <div style={{ color: C.inkDim, fontSize: 14, marginTop: 6, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Feature Section (alternating) ──────────────────────────────────── */
function FeatureSection({ pill, heading, body, visual, flip }: {
  pill: string; heading: string; body: string; visual: React.ReactNode; flip: boolean
}) {
  const { ref, visible } = useInView()
  return (
    <section ref={ref} style={{
      padding: '80px 24px',
      background: flip ? C.bg : C.bgPage,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap',
        flexDirection: flip ? 'row-reverse' : 'row',
        alignItems: 'center', gap: 64,
      }}>
        <div style={{
          flex: '1 1 300px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <PillLabel>{pill}</PillLabel>
          <h2 style={{
            fontWeight: 900,
            fontSize: 'clamp(24px, 4vw, 34px)',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            color: C.ink,
            marginBottom: 18,
            whiteSpace: 'pre-line',
          }}>{heading}</h2>
          <p style={{ color: C.inkDim2, fontSize: 16, lineHeight: 1.7, maxWidth: 440 }}>{body}</p>
        </div>
        <div style={{
          flex: '1 1 360px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s',
        }}>
          {visual}
        </div>
      </div>
    </section>
  )
}

/* ─── Portfolio Visual ───────────────────────────────────────────────── */
function PortfolioVisual() {
  return (
    <div style={{ animation: 'float 5s ease-in-out infinite', maxWidth: 380, margin: '0 auto' }}>
      <div style={{
        borderRadius: C.rLg,
        background: C.ink,
        padding: '28px 24px',
        boxShadow: C.shadowLg,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: C.rMd, flexShrink: 0,
            background: C.gradD,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 22, color: '#fff',
          }}>S</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>Sophie Thomas</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 2 }}>Riga · Beauty & Lifestyle</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            ['23.4K', 'Followers'],
            ['4.8%', 'Eng. rate'],
            ['18', 'Collabs'],
          ].map(([val, label]) => (
            <div key={label} style={{
              background: C.primaryBg,
              borderRadius: C.rMd,
              padding: '12px 8px',
              textAlign: 'center',
              border: `1px solid ${C.primaryBg}`,
            }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{val}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['#ff7ac3', C.primary, C.primaryLt, C.primaryMd].map((c, i) => (
            <div key={i} style={{
              flex: 1, aspectRatio: '9/14', borderRadius: C.rSm,
              background: `linear-gradient(160deg, ${c}33, ${c}99)`,
              border: `1px solid ${c}44`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Discovery Visual – Redbull Card (no button, just text) ─────────── */
function DiscoveryVisual() {
  return (
    <div style={{ maxWidth: 380, margin: '0 auto' }}>
      <div style={{
        borderRadius: C.rLg,
        background: C.bg,
        padding: '28px',
        boxShadow: C.shadowCard,
        border: `1px solid ${C.primaryBg}`,
        textAlign: 'center',
      }}>
        <div style={{
          width: 100,
          height: 100,
          margin: '0 auto 20px',
          borderRadius: C.rLg,
          overflow: 'hidden',
          background: 'transparent',
        }}>
          <img
            src="/brands/RedBull.webp"
            alt="Redbull"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cb/Red_Bull.svg/1200px-Red_Bull.svg.png' }}
          />
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 12 }}>
          Brands with opportunities awaiting you
        </h3>
        <p style={{ color: C.inkDim2, fontSize: 14, lineHeight: 1.6 }}>
          Baltic creators are getting invited to exclusive campaigns. Your portfolio is your ticket in.
        </p>
      </div>
    </div>
  )
}

/* ─── Analytics Visual ───────────────────────────────────────────────── */
function AnalyticsVisual() {
  const { ref, visible } = useInView()
  const bars = [
    { label: 'Mon', h: 45 },
    { label: 'Tue', h: 70 },
    { label: 'Wed', h: 55 },
    { label: 'Thu', h: 92 },
    { label: 'Fri', h: 65 },
    { label: 'Sat', h: 80 },
    { label: 'Sun', h: 50 },
  ]
  return (
    <div ref={ref} style={{ maxWidth: 380, margin: '0 auto' }}>
      <div style={{
        borderRadius: C.rLg,
        background: C.bg,
        padding: '28px',
        boxShadow: C.shadowCard,
        border: `1px solid ${C.primaryBg}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ color: C.inkDim, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Portfolio views
            </div>
            <div style={{ fontWeight: 900, fontSize: 32, letterSpacing: '-0.03em', color: C.ink }}>
              {visible ? <Counter to={847} /> : '0'}
            </div>
          </div>
          <div style={{
            background: C.primaryBg,
            borderRadius: C.rSm,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: C.primary,
          }}>
            2x <span style={{ color: C.primaryLt }}>Increased</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%', borderRadius: C.rXs,
                background: C.grad,
                opacity: visible ? 1 : 0,
                height: visible ? `${b.h}%` : '0%',
                transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.06}s, opacity 0.4s ease ${i * 0.06}s`,
              }} />
              <div style={{ color: C.inkFaint, fontSize: 11, fontWeight: 500 }}>{b.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, borderTop: `1px solid ${C.primaryBg}`, paddingTop: 20 }}>
          {[
            { text: 'Nike Viewed Your Portfolio', time: '2 Hours ago' },
            { text: 'Glossier Opened Your Rates', time: '1 Day ago' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i === 0 ? 12 : 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: C.ink, fontWeight: 500 }}>{a.text}</div>
              <div style={{ fontSize: 11, color: C.inkFaint }}>{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Link Visual – Professional version with SVG icons, no backgrounds, Rubik font, light card ──── */
function LinkVisual() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const platforms = [
    { label: 'Instagram', icon: <InstagramIcon /> },
    { label: 'Email', icon: <EmailIcon /> },
    { label: 'TikTok ', icon: <TikTokIcon /> },
    { label: 'Pitch Deck', icon: <FileIcon /> },
  ]

  return (
    <div style={{ maxWidth: 380, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Main link card – light background (white), gradient border */}
      <div style={{
        borderRadius: C.rLg,
        background: C.bg,
        padding: '24px',
        boxShadow: C.shadowCard,
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${C.primaryBg}`,
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{
            flex: 1,
            background: C.primaryBg,
            borderRadius: C.rSm,
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 700,
            color: C.primary,
            letterSpacing: '-0.01em',
            fontFamily: C.font,   // Rubik font
          }}>
            nexfluence.co/<span style={{ color: C.ink }}>creator</span>
          </div>
          <button
            onClick={copy}
            style={{
              background: copied ? C.primaryBg : C.grad,
              border: 'none',
              borderRadius: C.rSm,
              padding: '12px 20px',
              color: copied ? C.primary : '#fff',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: C.font,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: copied ? 'none' : C.shadowSm,
            }}
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <p style={{
          color: C.inkDim,
          fontSize: 12,
          marginTop: 14,
          textAlign: 'center',
          fontFamily: C.font,
        }}>
          Your custom link — share it anywhere
        </p>
      </div>

      {/* Platform cards – icon background removed, clean SVG icons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {platforms.map((p, i) => (
          <div
            key={i}
            style={{
              background: C.bg,
              borderRadius: C.rMd,
              padding: '14px 16px',
              border: `1px solid ${C.primaryBg}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: C.shadowSm,
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = C.shadowMd
              e.currentTarget.style.borderColor = C.primary
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = C.shadowSm
              e.currentTarget.style.borderColor = C.primaryBg
            }}
          >
            {/* Icon container – transparent background */}
            <div style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',   // removed background
              color: C.primary,
            }}>
              {p.icon}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, fontFamily: C.font }}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── SVG Icons (clean, no emojis, inherit color) ───────────────────── */
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <polyline points="2,6 12,13 22,6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

/* ─── Social Proof Section with images (no italic) ───────────────────── */
function SocialProof() {
  const { ref, visible } = useInView()
  const reviews = [
    { name: 'Aisha N.', role: 'Skincare Creator', text: 'Setup took 10 minutes and it already looks more pro than my Linktree.', img: '/people/Cindy.webp' },
    { name: 'Jake M.', role: 'Fitness Creator', text: 'The custom domain made it feel like a real brand — because it is.', img: '/people/Cindy.webp' },
    { name: 'Priya K.', role: 'Fashion Creator', text: 'I went from awkward DMs to a legit inquiry form overnight.', img: '/people/Cindy.webp' },
  ]
  return (
    <section ref={ref} style={{ padding: '80px 24px', background: C.bgPage }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <PillLabel>Creators love it</PillLabel>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(28px, 4vw, 36px)', letterSpacing: '-0.03em', color: C.ink }}>
            Don't take our word for it
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {reviews.map((r, i) => (
            <div key={i} style={{
              background: C.bg,
              borderRadius: C.rLg,
              padding: '28px',
              border: `1px solid ${C.primaryBg}`,
              boxShadow: C.shadowCard,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`,
            }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                {[...Array(5)].map((_, s) => <span key={s} style={{ color: C.primaryLt, fontSize: 14 }}>★</span>)}
              </div>
              <p style={{ color: C.inkDim2, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                "{r.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                  background: 'transparent',
                  flexShrink: 0,
                }}>
                  <img
                    src={r.img}
                    alt={r.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: C.inkDim }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}