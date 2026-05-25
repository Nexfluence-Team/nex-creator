'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0612',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Rubik', sans-serif",
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glows */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 70% 55% at 50% 40%, rgba(128,97,255,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(255,51,188,0.08) 0%, transparent 55%)
          `,
          pointerEvents: 'none',
        }}
      />

      {/* Grid texture */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.025,
          backgroundImage: `
            linear-gradient(rgba(128,97,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(128,97,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420, width: '100%' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 48 }}>
          <div
            style={{
              width: 48, height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #ff33bc, #8061ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(128,97,255,0.45)',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.03em' }}>N</span>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Creator Nexus
            </div>
            <div style={{ color: '#ff7ac3', fontWeight: 500, fontSize: 13 }}>
              by Nexfluence
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: '#ffffff',
            fontWeight: 900,
            fontSize: 36,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            marginBottom: 14,
          }}
        >
          Your creator portfolio,{' '}
          <span style={{ color: '#8061ff' }}>ready in minutes</span>
        </h1>

        <p
          style={{
            color: 'rgba(255,255,255,0.50)',
            fontSize: 15,
            lineHeight: 1.75,
            marginBottom: 40,
          }}
        >
          Bringing impactful creators across the Baltics under one roof.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link
            href="/onboarding"
            className="btn-apply"
            style={{ textDecoration: 'none', display: 'block' }}
          >
            Create my portfolio →
          </Link>

          <Link
            href="/login"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 24px',
              borderRadius: 8,
              background: 'transparent',
              color: 'rgba(255,255,255,0.75)',
              fontFamily: "'Rubik', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textAlign: 'center',
              border: '1px solid rgba(128,97,255,0.35)',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(128,97,255,0.75)'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(128,97,255,0.35)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
            }}
          >
            Sign in
          </Link>
        </div>

        {/* Live count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 32,
          }}
        >
          <span className="dot-live" />
          <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 12, letterSpacing: '0.04em' }}>
            3,412+ creators already joined
          </span>
        </div>

      </div>
    </div>
  )
}