'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

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

const FEATURES = [
  {
    pill: 'Portfolio',
    heading: 'A portfolio that\nworks while you sleep',
    body: 'One beautiful page that shows brands exactly who you are — your niche, your stats, your best work. No design skills needed.',
    visual: <PortfolioVisual />,
  },
  {
    pill: 'Discovery',
    heading: 'Brands find\nyou, not the other way',
    body: 'Your profile is searchable by brands actively looking for Baltic creators. Stop cold-DMing. Start getting inbound.',
    visual: <DiscoveryVisual />,
  },
  {
    pill: 'Analytics',
    heading: 'Know who is\nlooking at your work',
    body: 'See exactly when a brand views your portfolio, how long they stay, and which content they engage with most.',
    visual: <AnalyticsVisual />,
  },
  {
    pill: 'Share',
    heading: 'One link.\nEvery platform.',
    body: 'Drop it in your Instagram bio, email signature, or pitch deck. Your entire creator identity, one tap away.',
    visual: <LinkVisual />,
  },
]

export default function Home() {
  return (
    <div style={{ background: '#f7f5ff', minHeight: '100vh', fontFamily: "'Rubik', sans-serif", color: '#0a0612' }}>

      {/* ── HERO ── */}
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
          background: `
            radial-gradient(ellipse 60% 50% at 50% 30%, rgba(128,97,255,0.10) 0%, transparent 65%),
            radial-gradient(ellipse 35% 35% at 15% 70%, rgba(255,51,188,0.06) 0%, transparent 55%)
          `,
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 440, width: '100%' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 44 }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #ff33bc, #8061ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(128,97,255,0.35)',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em' }}>N</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#0a0612', fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Creator Nexus</div>
              <div style={{ color: '#ff7ac3', fontWeight: 500, fontSize: 13 }}>by Nexfluence</div>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{ fontWeight: 900, fontSize: 'clamp(30px, 6vw, 40px)', letterSpacing: '-0.035em', lineHeight: 1.1, marginBottom: 14, color: '#0a0612' }}>
            Your creator portfolio,{' '}
            <span style={{ color: '#8061ff' }}>ready in minutes</span>
          </h1>
          <p style={{ color: 'rgba(10,6,18,0.52)', fontSize: 15, lineHeight: 1.75, marginBottom: 36 }}>
            Bringing impactful creators across the Baltics under one roof.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/authenticate" className="btn-apply" style={{ textDecoration: 'none' }}>
              Create my portfolio
            </Link>
            <Link
              href="/authenticate"
              style={{
                display: 'block', padding: '14px 24px', borderRadius: 8,
                background: 'transparent', color: 'rgba(10,6,18,0.65)',
                fontSize: 15, fontWeight: 700, letterSpacing: '0.04em',
                textAlign: 'center', border: '1px solid rgba(128,97,255,0.30)',
                textDecoration: 'none', transition: 'border-color 0.2s ease, color 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(128,97,255,0.7)'; e.currentTarget.style.color = '#0a0612' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(128,97,255,0.30)'; e.currentTarget.style.color = 'rgba(10,6,18,0.65)' }}
            >
              Sign in
            </Link>
          </div>

          {/* Live count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 }}>
            <span className="dot-live" />
            <span style={{ color: 'rgba(10,6,18,0.35)', fontSize: 12, letterSpacing: '0.04em' }}>
              3,412+ creators already joined
            </span>
          </div>
        </div>

        {/* scroll cue */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, animation: 'bounce 2s ease-in-out infinite' }}>
          <span style={{ color: 'rgba(10,6,18,0.25)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>Scroll</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M4 9l4 4 4-4" stroke="rgba(10,6,18,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </section>

      <StatsBar />

      {FEATURES.map((f, i) => (
        <FeatureSection key={i} {...f} flip={i % 2 !== 0} />
      ))}

      <SocialProof />

      {/* ── BOTTOM CTA ── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: '#0a0612', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(128,97,255,0.18) 0%, transparent 65%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420, margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(26px, 5vw, 36px)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14 }}>
            Ready to get discovered?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.75, marginBottom: 32 }}>
            Join thousands of Baltic creators building their brand on Creator Nexus.
          </p>
          <Link href="/authenticate" className="btn-apply" style={{ textDecoration: 'none', maxWidth: 320, margin: '0 auto' }}>
            Create my portfolio — it is free →
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes slideRight {
          from { width: 0%; }
          to   { width: var(--bar-w); }
        }
        @keyframes ping {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function StatsBar() {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{
      background: '#fff',
      borderTop: '1px solid rgba(128,97,255,0.12)',
      borderBottom: '1px solid rgba(128,97,255,0.12)',
      padding: '32px 24px',
    }}>
      <div style={{
        maxWidth: 720, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, textAlign: 'center',
      }}>
        {[
          { n: 3412, suffix: '+', label: 'Active Creators' },
          { n: 850,  suffix: '+', label: 'Brand Partnerships' },
          { n: 4,    suffix: '.9★', label: 'Average Rating' },
        ].map((s, i) => (
          <div key={i} style={{ opacity: visible ? 1 : 0, transition: `opacity 0.5s ease ${i * 0.12}s` }}>
            <div style={{ fontWeight: 900, fontSize: 'clamp(24px, 4vw, 34px)', letterSpacing: '-0.03em', color: '#0a0612' }}>
              {visible ? <Counter to={s.n} suffix={s.suffix} /> : `0${s.suffix}`}
            </div>
            <div style={{ color: 'rgba(10,6,18,0.45)', fontSize: 13, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureSection({ pill, heading, body, visual, flip }: {
  pill: string; heading: string; body: string; visual: React.ReactNode; flip: boolean
}) {
  const { ref, visible } = useInView()
  return (
    <section ref={ref} style={{ padding: '80px 24px', background: flip ? '#fff' : '#f7f5ff' }}>
      <div style={{
        maxWidth: 960, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap',
        flexDirection: flip ? 'row-reverse' : 'row',
        alignItems: 'center', gap: 56,
      }}>
        <div style={{
          flex: '1 1 260px', minWidth: 0,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <span className="pill-label" style={{ marginBottom: 16, display: 'inline-flex' }}>{pill}</span>
          <h2 style={{
            fontWeight: 900, fontSize: 'clamp(22px, 3.5vw, 30px)',
            letterSpacing: '-0.03em', lineHeight: 1.15,
            color: '#0a0612', marginBottom: 16,
            whiteSpace: 'pre-line',
          }}>{heading}</h2>
          <p style={{ color: 'rgba(10,6,18,0.52)', fontSize: 15, lineHeight: 1.85, maxWidth: 340 }}>{body}</p>
        </div>
        <div style={{
          flex: '1 1 300px', minWidth: 0,
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

function PortfolioVisual() {
  return (
    <div style={{ animation: 'float 5s ease-in-out infinite', maxWidth: 340, margin: '0 auto' }}>
      <div className="border-gradient-pm" style={{
        borderRadius: 20, background: '#0a0612', padding: '28px 24px',
        boxShadow: '0 20px 60px rgba(128,97,255,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #ff33bc, #8061ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 20, color: '#fff',
          }}>S</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>Sophie Thomas</div>
            <div style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12, marginTop: 2 }}>🇱🇻 Riga · Beauty & Lifestyle</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[['23.4K', 'Followers'], ['4.8%', 'Eng. rate'], ['18', 'Collabs']].map(([v, l]) => (
            <div key={l} style={{
              background: 'rgba(128,97,255,0.10)', borderRadius: 12, padding: '12px 8px', textAlign: 'center',
              border: '1px solid rgba(128,97,255,0.20)',
            }}>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{v}</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['#ff7ac3', '#8061ff', '#ff33bc', '#6a66ff'].map((c, i) => (
            <div key={i} style={{
              flex: 1, aspectRatio: '9/14', borderRadius: 10,
              background: `linear-gradient(160deg, ${c}33, ${c}99)`,
              border: `1px solid ${c}44`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function DiscoveryVisual() {
  const brands = [
    { name: 'Nike',     color: '#ff33bc' },
    { name: 'Glossier', color: '#8061ff' },
    { name: 'Dyson',    color: '#6a66ff' },
    { name: 'Rhode',    color: '#ff7ac3' },
    { name: 'Alo',      color: '#ff33bc' },
    { name: 'Skims',    color: '#8061ff' },
  ]
  const nodes = brands.map((b, i) => {
    const angle = (i / brands.length) * Math.PI * 2
    return {
      ...b,
      lx: Math.round((170 + Math.cos(angle) * 130) * 100) / 100,
      ly: Math.round((90  + Math.sin(angle) * 70 ) * 100) / 100,
      cx: Math.round((50 + Math.cos(angle) * 36) * 100) / 100,
      cy: Math.round((50 + Math.sin(angle) * 34) * 100) / 100,
    }
  })
  return (
    <div style={{ maxWidth: 340, margin: '0 auto', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, #ff33bc, #8061ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 26, color: '#fff',
          boxShadow: '0 0 0 12px rgba(128,97,255,0.08), 0 0 0 24px rgba(128,97,255,0.04)',
        }}>
          <span>👤</span>
        </div>
      </div>
      <svg width="100%" height="180" viewBox="0 0 340 180"
        style={{ position: 'absolute', top: 20, left: 0, zIndex: 1 }} aria-hidden>
        {nodes.map((n, i) => (
          <line key={i} x1="170" y1="36" x2={n.lx} y2={n.ly}
            stroke="rgba(128,97,255,0.20)" strokeWidth="1.5" strokeDasharray="4 4" />
        ))}
      </svg>
      <div style={{ position: 'relative', height: 180, marginTop: -36 }}>
        {nodes.map((n, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${n.cx}%`,
            top:  `${n.cy}%`,
            transform: 'translate(-50%, -50%)',
            background: '#ffffff',
            border: '1px solid rgba(128,97,255,0.22)',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 13, fontWeight: 700, color: '#0a0612',
            boxShadow: '0 4px 16px rgba(128,97,255,0.10)',
            animation: `float ${4 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
            whiteSpace: 'nowrap',
          }}>
            {n.name}
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsVisual() {
  const { ref, visible } = useInView()
  const bars = [
    { label: 'Mon', h: 45, color: '#8061ff' },
    { label: 'Tue', h: 70, color: '#8061ff' },
    { label: 'Wed', h: 55, color: '#8061ff' },
    { label: 'Thu', h: 90, color: '#ff33bc' },
    { label: 'Fri', h: 65, color: '#8061ff' },
    { label: 'Sat', h: 80, color: '#8061ff' },
    { label: 'Sun', h: 50, color: '#8061ff' },
  ]
  return (
    <div ref={ref} style={{ maxWidth: 340, margin: '0 auto' }}>
      <div className="border-gradient-pm" style={{
        borderRadius: 20, background: '#fff',
        padding: '24px', boxShadow: '0 12px 40px rgba(128,97,255,0.10)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ color: 'rgba(10,6,18,0.40)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Portfolio views</div>
            <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: '-0.03em', color: '#0a0612' }}>
              {visible ? <Counter to={847} /> : '0'}
            </div>
          </div>
          <div style={{
            background: 'rgba(128,97,255,0.08)', borderRadius: 8,
            padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#8061ff',
          }}>
            ↑ 24% this week
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%', borderRadius: 6,
                background: b.color,
                opacity: visible ? 1 : 0,
                height: visible ? `${b.h}%` : '0%',
                transition: `height 0.7s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.06}s, opacity 0.4s ease ${i * 0.06}s`,
              }} />
              <div style={{ color: 'rgba(10,6,18,0.35)', fontSize: 10, fontWeight: 500 }}>{b.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, borderTop: '1px solid rgba(128,97,255,0.10)', paddingTop: 16 }}>
          {[
            { dot: '#ff33bc', text: 'Nike viewed your portfolio', time: '2m ago' },
            { dot: '#8061ff', text: 'Glossier opened your rates', time: '1h ago' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i === 0 ? 10 : 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.dot, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: '#0a0612', fontWeight: 500 }}>{a.text}</div>
              <div style={{ fontSize: 11, color: 'rgba(10,6,18,0.35)' }}>{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LinkVisual() {
  const [copied, setCopied] = useState(false)
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const platforms = [
    { label: 'Instagram bio',   icon: '📸' },
    { label: 'Email signature', icon: '✉️' },
    { label: 'TikTok bio',      icon: '🎵' },
    { label: 'Pitch deck',      icon: '📋' },
  ]
  return (
    <div style={{ maxWidth: 340, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="border-gradient-pm" style={{
        borderRadius: 16, background: '#0a0612', padding: '20px',
        boxShadow: '0 12px 40px rgba(128,97,255,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, background: 'rgba(128,97,255,0.12)', borderRadius: 10,
            padding: '11px 14px', fontSize: 14, fontWeight: 700,
            color: '#ff7ac3', letterSpacing: '-0.01em',
          }}>
            nexfluence.co/<span style={{ color: '#fff' }}>yourname</span>
          </div>
          <button onClick={copy} style={{
            background: copied ? 'rgba(128,97,255,0.3)' : 'linear-gradient(90deg,#ff33bc,#8061ff)',
            border: 'none', borderRadius: 10, padding: '11px 16px',
            color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s ease',
          }}>
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {platforms.map((p, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 14, padding: '14px 16px',
            border: '1px solid rgba(128,97,255,0.14)',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 2px 12px rgba(128,97,255,0.06)',
            animation: `float ${4.5 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.25}s`,
          }}>
            <span style={{ fontSize: 20 }}>{p.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0612' }}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SocialProof() {
  const { ref, visible } = useInView()
  const reviews = [
    { name: 'Aisha N.',  role: 'Skincare Creator', text: '"Setup took 10 minutes and it already looks more pro than my Linktree."' },
    { name: 'Jake M.',   role: 'Fitness Creator',  text: '"The custom domain made it feel like a real brand — because it is."' },
    { name: 'Priya K.',  role: 'Fashion Creator',  text: '"I went from awkward DMs to a legit inquiry form overnight."' },
  ]
  return (
    <section ref={ref} style={{ padding: '80px 24px', background: '#f7f5ff' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="pill-label" style={{ justifyContent: 'center', marginBottom: 14, display: 'inline-flex' }}>Creators love it</span>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 3.5vw, 30px)', letterSpacing: '-0.03em', color: '#0a0612' }}>
            Don't take our word for it
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {reviews.map((r, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 20, padding: '24px',
              border: '1px solid rgba(128,97,255,0.12)',
              boxShadow: '0 4px 20px rgba(128,97,255,0.06)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`,
            }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {[...Array(5)].map((_, s) => <span key={s} style={{ color: '#ff33bc', fontSize: 14 }}>★</span>)}
              </div>
              <p style={{ color: 'rgba(10,6,18,0.70)', fontSize: 14, lineHeight: 1.75, fontStyle: 'italic', marginBottom: 16 }}>{r.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #ff33bc, #8061ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, color: '#fff',
                }}>{r.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0a0612' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(10,6,18,0.40)' }}>{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}