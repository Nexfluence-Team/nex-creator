'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getToken } from '../../lib/auth'
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'


function useBreakpoint() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const u = () => setW(window.innerWidth)
    u(); window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])
  return { isMobile: w > 0 && w < 640, w }
}

interface User {
  name: string; email: string; slug: string; plan: string
  profilePicUrl: string; niches: string[]; coins: number
  referralCode: string; createdAt: string
}
interface Analytics {
  views: { total: number; last7: number; last30: number; unique: number }
  inbox: { messages: number; inquiries: number; unread: number }
  content: { videos: number }
  topReferrers: { referrer: string; count: number }[]
}
interface ChartDay { date: string; count: number }

export default function DashboardPage() {
  const router  = useRouter()
  const { isMobile, w } = useBreakpoint()

  const [user,      setUser]      = useState<User | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [chart,     setChart]     = useState<ChartDay[]>([])
  const [coins,     setCoins]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/authenticate'); return }
    const h = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${API}/profile/me`,           { headers: h }).then(r => r.json()),
      fetch(`${API}/analytics/overview`,   { headers: h }).then(r => r.json()),
      fetch(`${API}/analytics/views?days=30`, { headers: h }).then(r => r.json()),
      fetch(`${API}/referrals/me`,         { headers: h }).then(r => r.json()),
    ])
      .then(([userRes, analyticsRes, chartRes, referralsRes]) => {
        if (userRes.success)      setUser(userRes.data.user)
        if (analyticsRes.success) setAnalytics(analyticsRes.data)
        if (chartRes.success)     setChart(chartRes.data.chart ?? [])
        if (referralsRes.success) setCoins(referralsRes.data.coins ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(`nexfluence.co/${user?.slug || ''}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const profileComplete = (() => {
    if (!user) return 0
    let score = 0
    if (user.name)          score += 20
    if (user.profilePicUrl) score += 20
    if (user.slug)          score += 20
    if (user.niches?.length) score += 20
    if (analytics?.content.videos) score += 20
    return score
  })()

  const maxChart = Math.max(...chart.map(d => d.count), 1)

  if (w === 0 || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f5ff', fontFamily: "'Rubik',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(128,97,255,0.2)', borderTopColor: '#8061ff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: 'rgba(10,6,18,0.45)', fontSize: 14 }}>Loading dashboard…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5ff', fontFamily: "'Rubik',sans-serif", color: '#0a0612' }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(10,6,18,0.08)', padding: isMobile ? '0 16px' : '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#ff33bc,#8061ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>N</span>
          </div>
          {!isMobile && <span style={{ fontWeight: 700, fontSize: 15, color: '#0a0612', letterSpacing: '-0.02em' }}>Creator Nexus</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/profile" style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(90deg,#ff33bc,#8061ff)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Edit Portfolio
          </Link>
          {user?.slug && (
            <Link href={`/profile/${user.slug}`} target="_blank" style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid rgba(10,6,18,0.12)', background: '#fff', color: '#0a0612', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              View Public ↗
            </Link>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '24px 16px' : '32px 24px' }}>

        {/* ── WELCOME ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, letterSpacing: '-0.03em', color: '#0a0612', marginBottom: 4 }}>
            Hey {user?.name?.split(' ')[0] || 'Creator'} 👋
          </h1>
          <p style={{ color: 'rgba(10,6,18,0.50)', fontSize: 14 }}>
            Here's how your portfolio is performing.
          </p>
        </div>

        {/* ── STATS GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Profile Views',  value: analytics?.views.total     ?? 0, sub: `+${analytics?.views.last7 ?? 0} this week`,    color: '#8061ff', icon: '👁' },
            { label: 'Unique Visitors', value: analytics?.views.unique   ?? 0, sub: 'all time',                                       color: '#ff33bc', icon: '🌍' },
            { label: 'Inbox Messages', value: (analytics?.inbox.messages ?? 0) + (analytics?.inbox.inquiries ?? 0), sub: `${analytics?.inbox.unread ?? 0} unread`, color: '#ff7ac3', icon: '📬' },
            { label: 'Videos',         value: analytics?.content.videos   ?? 0, sub: 'on your portfolio',                             color: '#6a66ff', icon: '🎬' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1.5px solid rgba(10,6,18,0.08)', boxShadow: '0 2px 8px rgba(10,6,18,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(10,6,18,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
              </div>
              <p style={{ fontWeight: 900, fontSize: isMobile ? 24 : 28, color: s.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{s.value.toLocaleString()}</p>
              <p style={{ fontSize: 11, color: 'rgba(10,6,18,0.40)' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* ── CHART ── */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(10,6,18,0.08)', boxShadow: '0 2px 8px rgba(10,6,18,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 15, color: '#0a0612', marginBottom: 2 }}>Profile Views</p>
                <p style={{ fontSize: 12, color: 'rgba(10,6,18,0.40)' }}>Last 30 days</p>
              </div>
              <div style={{ background: 'rgba(128,97,255,0.08)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#8061ff' }}>
                {analytics?.views.last30 ?? 0} total
              </div>
            </div>
            {chart.length === 0 ? (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(128,97,255,0.20)', borderRadius: 10 }}>
                <p style={{ color: 'rgba(10,6,18,0.35)', fontSize: 13 }}>No view data yet — share your profile link to get started</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                {chart.slice(-30).map((d, i) => (
                  <div key={i} title={`${new Date(d.date).toLocaleDateString()} — ${d.count} views`} style={{
                    flex: 1, borderRadius: '3px 3px 0 0',
                    background: d.count > 0 ? 'linear-gradient(180deg,#8061ff,#ff33bc)' : 'rgba(10,6,18,0.06)',
                    height: `${Math.max((d.count / maxChart) * 100, d.count > 0 ? 8 : 4)}%`,
                    transition: 'height 0.5s ease',
                    cursor: 'default',
                  }} />
                ))}
              </div>
            )}
          </div>

          {/* ── PROFILE COMPLETION ── */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(10,6,18,0.08)', boxShadow: '0 2px 8px rgba(10,6,18,0.04)' }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#0a0612', marginBottom: 4 }}>Profile Completion</p>
            <p style={{ fontSize: 12, color: 'rgba(10,6,18,0.40)', marginBottom: 16 }}>Complete your profile to attract more brands</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 8, background: 'rgba(10,6,18,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#ff33bc,#8061ff)', width: `${profileComplete}%`, borderRadius: 4, transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 15, color: profileComplete === 100 ? '#00a85a' : '#8061ff', flexShrink: 0 }}>{profileComplete}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Display name',    done: !!user?.name,            href: '/profile' },
                { label: 'Profile photo',   done: !!user?.profilePicUrl,   href: '/profile' },
                { label: 'Portfolio URL',   done: !!user?.slug,            href: '/profile' },
                { label: 'Content niches',  done: !!user?.niches?.length,  href: '/profile' },
                { label: 'Add a video',     done: !!(analytics?.content.videos), href: '/profile' },
              ].map(item => (
                <Link key={item.label} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  textDecoration: 'none',
                  opacity: item.done ? 0.45 : 1,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: item.done ? 'rgba(0,168,90,0.12)' : 'rgba(128,97,255,0.08)',
                    border: `1.5px solid ${item.done ? '#00a85a' : 'rgba(128,97,255,0.30)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: item.done ? '#00a85a' : '#8061ff',
                  }}>{item.done ? '✓' : '+'}</div>
                  <span style={{ fontSize: 13, fontWeight: item.done ? 500 : 600, color: item.done ? 'rgba(10,6,18,0.40)' : '#0a0612', textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* ── QUICK ACTIONS ── */}
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(10,6,18,0.08)', boxShadow: '0 2px 8px rgba(10,6,18,0.04)' }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#0a0612', marginBottom: 16 }}>Quick Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '👤', label: 'Edit header & bio',     href: '/profile',     tab: 'header' },
                { icon: '🎬', label: 'Add a video',           href: '/profile',     tab: 'media' },
                { icon: '💰', label: 'Add a service package', href: '/profile',     tab: 'rates' },
                { icon: '📬', label: 'Check your inbox',      href: '/profile',     tab: 'inbox' },
                { icon: '🎁', label: 'View referrals & coins', href: '/referrals',  tab: '' },
              ].map(a => (
                <Link key={a.label} href={a.href} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 10, border: '1.5px solid rgba(10,6,18,0.08)',
                  background: '#fafafa', textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(128,97,255,0.35)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(128,97,255,0.04)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(10,6,18,0.08)'; (e.currentTarget as HTMLAnchorElement).style.background = '#fafafa' }}
                >
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0612' }}>{a.label}</span>
                  <span style={{ marginLeft: 'auto', color: 'rgba(10,6,18,0.30)', fontSize: 14 }}>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── REFERRAL WIDGET ── */}
          <div style={{ background: 'linear-gradient(135deg,#0a0612,#1a0a2e)', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(128,97,255,0.20)', boxShadow: '0 2px 8px rgba(10,6,18,0.10)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '60%', background: 'radial-gradient(ellipse at 80% 20%,rgba(128,97,255,0.20) 0%,transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Referral Program</p>
                <div style={{ background: 'rgba(200,241,53,0.15)', border: '1px solid rgba(200,241,53,0.30)', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#C8F135' }}>
                  {coins} 🪙
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 16, lineHeight: 1.6 }}>
                Share your referral link. Earn 10 coins per signup and 25 coins when they upgrade.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#ff7ac3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  nexfluence.co/r/{user?.referralCode ?? '---'}
                </span>
                <button onClick={copyLink} style={{ background: copied ? 'rgba(128,97,255,0.30)' : 'linear-gradient(90deg,#ff33bc,#8061ff)', border: 'none', borderRadius: 7, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: "'Rubik',sans-serif" }}>
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[{ v: '10 🪙', l: 'per signup' }, { v: '25 🪙', l: 'on upgrade' }].map(s => (
                  <div key={s.l} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <p style={{ fontWeight: 900, fontSize: 16, color: '#ff33bc', marginBottom: 2 }}>{s.v}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{s.l}</p>
                  </div>
                ))}
              </div>
              <Link href="/referrals" style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: 8, background: 'rgba(200,241,53,0.15)', border: '1px solid rgba(200,241,53,0.25)', color: '#C8F135', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                View all rewards →
              </Link>
            </div>
          </div>
        </div>

        {/* ── TOP REFERRERS ── */}
        {(analytics?.topReferrers?.length ?? 0) > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(10,6,18,0.08)', boxShadow: '0 2px 8px rgba(10,6,18,0.04)', marginBottom: 16 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#0a0612', marginBottom: 16 }}>Where Brands Are Finding You</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {analytics!.topReferrers.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(10,6,18,0.35)', width: 16, textAlign: 'right' }}>{i + 1}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(10,6,18,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#8061ff,#ff33bc)', width: `${(r.count / (analytics!.topReferrers[0]?.count || 1)) * 100}%`, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(10,6,18,0.55)', minWidth: 120, textAlign: 'right' }}>{r.referrer}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#8061ff', minWidth: 40, textAlign: 'right' }}>{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PORTFOLIO LINK ── */}
        {user?.slug && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1.5px solid rgba(128,97,255,0.20)', boxShadow: '0 2px 8px rgba(10,6,18,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#0a0612', marginBottom: 2 }}>Your portfolio link</p>
              <p style={{ fontSize: 13, color: '#8061ff', fontWeight: 600 }}>nexfluence.co/{user.slug}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyLink} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid rgba(128,97,255,0.28)', background: '#fff', color: '#8061ff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>
                {copied ? '✓ Copied' : '🔗 Copy link'}
              </button>
              <Link href={`/profile/${user.slug}`} target="_blank" style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(90deg,#ff33bc,#8061ff)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                View live ↗
              </Link>
            </div>
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