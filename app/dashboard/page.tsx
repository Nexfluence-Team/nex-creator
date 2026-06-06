'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getToken } from '../../lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

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
  rXs:        6,
  rSm:        10,
  rMd:        14,
  rLg:        20,
  rXl:        28,
  border:     '1px solid rgba(139,49,232,0.16)',
  borderH:    '1px solid rgba(139,49,232,0.45)',
  shadowSm:   '0 2px 12px rgba(139,49,232,0.10)',
  shadowMd:   '0 8px 32px rgba(139,49,232,0.14)',
  shadowCard: '0 4px 24px rgba(10,6,18,0.07)',
  font:       "'Rubik', sans-serif",
}

/* ─── Icons (SVG, no emojis, accept size prop) ──────────────────────── */
const Icon = ({ children, size = 20, ...props }: { children: React.ReactNode; size?: number; [key: string]: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    {children}
  </svg>
)

function EyeIcon({ size = 20 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </Icon>
  )
}

function GlobeIcon({ size = 20 }: { size?: number }) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </Icon>
  )
}

function InboxIcon({ size = 20 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M22 12h-4l-3 3-3-3H2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}

function VideoIcon({ size = 20 }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="2" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="m22 8-4 4 4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <Icon size={size}>
      <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <Icon size={size}>
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </Icon>
  )
}

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}

function ArrowRightIcon({ size = 14 }: { size?: number }) {
  return (
    <Icon size={size}>
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="12 5 19 12 12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </Icon>
  )
}

function ExternalIcon({ size = 14 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </Icon>
  )
}

function EditIcon({ size = 16 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M17 3l4 4-7 7H10v-4l7-7z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 21h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </Icon>
  )
}

function PackageIcon({ size = 20 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 6h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="14" x2="12" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </Icon>
  )
}

/* ─── Helper functions ──────────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const u = () => setW(window.innerWidth)
    u(); window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])
  return { isMobile: w > 0 && w < 640, isTablet: w >= 640 && w < 1024, w }
}

interface User {
  name: string; email: string; slug: string; plan: string
  profilePicUrl: string; niches: string[]; createdAt: string
}
interface Analytics {
  views: { total: number; last7: number; last30: number; unique: number }
  inbox: { messages: number; inquiries: number; unread: number }
  content: { videos: number }
  topReferrers: { referrer: string; count: number }[]
}
interface ChartDay { date: string; count: number }

export default function DashboardPage() {
  const router = useRouter()
  const { isMobile, isTablet, w } = useBreakpoint()

  const [user,      setUser]      = useState<User | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [chart,     setChart]     = useState<ChartDay[]>([])
  const [loading,   setLoading]   = useState(true)
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/authenticate'); return }
    const h = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${API}/profile/me`,              { headers: h }).then(r => r.json()),
      fetch(`${API}/analytics/overview`,      { headers: h }).then(r => r.json()),
      fetch(`${API}/analytics/views?days=30`, { headers: h }).then(r => r.json()),
    ])
      .then(([userRes, analyticsRes, chartRes]) => {
        if (userRes.success)      setUser(userRes.data.user)
        if (analyticsRes.success) setAnalytics(analyticsRes.data)
        if (chartRes.success)     setChart(chartRes.data.chart ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(`https://nexus.nexfluence.eu/profile/${user?.slug || ''}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const profileComplete = (() => {
    if (!user) return 0
    let score = 0
    if (user.name)           score += 20
    if (user.profilePicUrl)  score += 20
    if (user.slug)           score += 20
    if (user.niches?.length) score += 20
    if (analytics?.content.videos) score += 20
    return score
  })()

  const maxChart = Math.max(...chart.map(d => d.count), 1)

  const cols = (mobile: string, tablet: string, desktop: string) =>
    isMobile ? mobile : isTablet ? tablet : desktop

  if (w === 0 || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bgPage, fontFamily: C.font }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.primaryBg}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: C.inkDim, fontSize: 14 }}>Loading dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bgPage, fontFamily: C.font, color: C.ink }}>

      {/* ── TOP BAR ── */}
      <div style={{
        background: C.bg,
        borderBottom: `1px solid ${C.primaryBg}`,
        padding: isMobile ? '0 16px' : '0 32px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: C.rSm, overflow: 'hidden', flexShrink: 0, background: 'transparent' }}>
            <img src="/Nex.webp" alt="Creator Nexus" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          {!isMobile && (
            <span style={{ fontWeight: 700, fontSize: 15, color: C.ink, letterSpacing: '-0.02em' }}>Creator Nexus</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/profile" style={{ padding: '8px 16px', borderRadius: C.rSm, background: C.grad, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Edit Portfolio
          </Link>
          {user?.slug && (
            <Link href={`https://nexus.nexfluence.eu/profile/${user.slug}`} target="_blank" style={{ padding: '8px 14px', borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`, background: C.bg, color: C.ink, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              View Public <ExternalIcon size={14} />
            </Link>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 16px' : isTablet ? '28px 20px' : '32px 24px' }}>

        {/* ── WELCOME ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, letterSpacing: '-0.03em', color: C.ink, marginBottom: 4 }}>
            Hey {user?.name?.split(' ')[0] || 'Creator'}
          </h1>
          <p style={{ color: C.inkDim, fontSize: 14 }}>Here's how your portfolio is performing.</p>
        </div>

        {/* ── STATS GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: cols('repeat(2,1fr)', 'repeat(2,1fr)', 'repeat(4,1fr)'), gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Profile Views',   value: analytics?.views.total ?? 0, sub: `+${analytics?.views.last7 ?? 0} this week`, icon: <EyeIcon size={20} /> },
            { label: 'Unique Visitors', value: analytics?.views.unique ?? 0, sub: 'all time', icon: <GlobeIcon size={20} /> },
            { label: 'Inbox Messages',  value: (analytics?.inbox.messages ?? 0) + (analytics?.inbox.inquiries ?? 0), sub: `${analytics?.inbox.unread ?? 0} unread`, icon: <InboxIcon size={20} /> },
            { label: 'Videos',          value: analytics?.content.videos ?? 0, sub: 'on your portfolio', icon: <VideoIcon size={20} /> },
          ].map(s => (
            <div key={s.label} style={{ background: C.bg, borderRadius: C.rLg, padding: '18px 20px', border: C.border, boxShadow: C.shadowCard }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: C.primary, display: 'flex' }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
              </div>
              <p style={{ fontWeight: 900, fontSize: isMobile ? 24 : 28, color: C.primary, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value.toLocaleString()}</p>
              <p style={{ fontSize: 11, color: C.inkDim }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── CHART + PROFILE COMPLETION ── */}
        <div style={{ display: 'grid', gridTemplateColumns: cols('1fr', '1fr', '2fr 1fr'), gap: 16, marginBottom: 16 }}>

          {/* Chart */}
          <div style={{ background: C.bg, borderRadius: C.rLg, padding: '24px', border: C.border, boxShadow: C.shadowCard }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 2 }}>Profile Views</p>
                <p style={{ fontSize: 12, color: C.inkDim }}>Last 30 days</p>
              </div>
              <div style={{ background: C.primaryBg, borderRadius: C.rSm, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: C.primary }}>
                {analytics?.views.last30 ?? 0} total
              </div>
            </div>
            {chart.length === 0 ? (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${C.primaryBg}`, borderRadius: C.rMd }}>
                <p style={{ color: C.inkDim, fontSize: 13, textAlign: 'center', padding: '0 16px' }}>No view data yet — share your profile link to get started</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                {chart.slice(-30).map((d, i) => (
                  <div key={i} title={`${new Date(d.date).toLocaleDateString()} — ${d.count} views`} style={{
                    flex: 1, borderRadius: `${C.rXs}px ${C.rXs}px 0 0`,
                    background: d.count > 0 ? C.grad : C.primaryBg,
                    height: `${Math.max((d.count / maxChart) * 100, d.count > 0 ? 8 : 4)}%`,
                    transition: 'height 0.5s ease', cursor: 'default',
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* Profile Completion */}
          <div style={{ background: C.bg, borderRadius: C.rLg, padding: '24px', border: C.border, boxShadow: C.shadowCard }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 4 }}>Profile Completion</p>
            <p style={{ fontSize: 12, color: C.inkDim, marginBottom: 16 }}>Complete your profile to attract more brands</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 8, background: C.primaryBg, borderRadius: C.rXs, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.grad, width: `${profileComplete}%`, borderRadius: C.rXs, transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 15, color: profileComplete === 100 ? '#00a85a' : C.primary, flexShrink: 0 }}>{profileComplete}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Display name',   done: !!user?.name,                  href: '/profile' },
                { label: 'Profile photo',  done: !!user?.profilePicUrl,         href: '/profile' },
                { label: 'Portfolio URL',  done: !!user?.slug,                  href: '/profile' },
                { label: 'Content niches', done: !!user?.niches?.length,        href: '/profile' },
                { label: 'Add a video',    done: !!(analytics?.content.videos), href: '/profile' },
              ].map(item => (
                <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', opacity: item.done ? 0.55 : 1 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: item.done ? 'rgba(0,168,90,0.12)' : C.primaryBg,
                    border: `1.5px solid ${item.done ? '#00a85a' : C.primaryBg}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.done ? <CheckIcon size={12} /> : <PlusIcon size={12} />}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: item.done ? 500 : 600, color: item.done ? C.inkDim : C.ink, textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ background: C.bg, borderRadius: C.rLg, padding: '24px', border: C.border, boxShadow: C.shadowCard, marginBottom: 16 }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 16 }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: cols('1fr', 'repeat(2,1fr)', 'repeat(4,1fr)'), gap: 10 }}>
            {[
              { label: 'Edit header & bio',     href: '/profile', icon: <EditIcon size={18} /> },
              { label: 'Add a video',           href: '/profile', icon: <VideoIcon size={18} /> },
              { label: 'Add a service package', href: '/profile', icon: <PackageIcon size={18} /> },
              { label: 'Check your inbox',      href: '/profile', icon: <InboxIcon size={18} /> },
            ].map(a => (
              <Link key={a.label} href={a.href} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderRadius: C.rMd, border: C.border, background: C.bgSub,
                textDecoration: 'none', transition: 'all 0.15s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = C.primary; (e.currentTarget as HTMLAnchorElement).style.background = C.primaryBg }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = C.border; (e.currentTarget as HTMLAnchorElement).style.background = C.bgSub }}
              >
                <span style={{ display: 'flex', color: C.primary }}>{a.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{a.label}</span>
                <span style={{ marginLeft: 'auto', color: C.inkDim }}><ArrowRightIcon size={14} /></span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── TOP REFERRERS ── */}
        {(analytics?.topReferrers?.length ?? 0) > 0 && (
          <div style={{ background: C.bg, borderRadius: C.rLg, padding: '24px', border: C.border, boxShadow: C.shadowCard, marginBottom: 16 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 16 }}>Where Brands Are Finding You</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analytics!.topReferrers.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.inkFaint, width: 16, textAlign: 'right' }}>{i + 1}</span>
                  <div style={{ flex: 1, height: 6, background: C.primaryBg, borderRadius: C.rXs, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: C.grad, width: `${(r.count / (analytics!.topReferrers[0]?.count || 1)) * 100}%`, borderRadius: C.rXs }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.inkDim, minWidth: 120, textAlign: 'right' }}>{r.referrer}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.primary, minWidth: 40, textAlign: 'right' }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PORTFOLIO LINK ── */}
        {user?.slug ? (
          <div style={{
            background: C.bg, borderRadius: C.rLg, padding: '20px 24px',
            border: `1.5px solid ${C.primaryBg}`, boxShadow: C.shadowCard,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 2 }}>Your portfolio link</p>
              <p style={{ fontSize: 13, color: C.primary, fontWeight: 600 }}>nexus.nexfluence.eu/profile/{user.slug}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyLink} style={{
                padding: '9px 18px', borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`,
                background: C.bg, color: C.primary, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <CopyIcon size={16} /> {copied ? 'Copied!' : 'Copy link'}
              </button>
              <Link href={`https://nexus.nexfluence.eu/profile/${user.slug}`} target="_blank" style={{
                padding: '9px 18px', borderRadius: C.rSm, border: 'none', background: C.grad,
                color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                View live <ExternalIcon size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            background: C.bg, borderRadius: C.rLg, padding: '20px 24px',
            border: `1.5px dashed ${C.primaryBg}`, display: 'flex',
            alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 2 }}>Set your portfolio URL</p>
              <p style={{ fontSize: 13, color: C.inkDim }}>Choose a unique username so brands can find and share your page.</p>
            </div>
            <Link href="/profile" style={{ padding: '9px 18px', borderRadius: C.rSm, background: C.grad, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Set username →
            </Link>
          </div>
        )}

      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}