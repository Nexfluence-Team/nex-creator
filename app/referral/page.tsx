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

interface ReferralData {
  referralCode:  string
  referralLink:  string
  coins:         number
  coinsEarned:   number
  signupCount:   number
  upgradeCount:  number
  rewards:       { id: string; label: string; coinCost: number }[]
}

export default function ReferralsPage() {
  const router = useRouter()
  const { isMobile, w } = useBreakpoint()

  const [data,      setData]      = useState<ReferralData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [copied,    setCopied]    = useState(false)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [redeemMsg, setRedeemMsg] = useState('')
  const [error,     setError]     = useState('')

  const load = () => {
    const token = getToken()
    if (!token) { router.push('/authenticate'); return }
    fetch(`${API}/referrals/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message)
        setData(json.data)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const copy = () => {
    navigator.clipboard.writeText(data?.referralLink ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const redeem = async (rewardId: string) => {
    setRedeeming(rewardId); setError(''); setRedeemMsg('')
    try {
      const token = getToken()
      const res   = await fetch(`${API}/referrals/redeem`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ reward: rewardId }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
      setRedeemMsg(json.data.message)
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRedeeming(null)
    }
  }

  const share = (platform: string) => {
    const link = data?.referralLink ?? ''
    const text = `Join me on Creator Nexus — the portfolio platform for Baltic creators. Use my referral link:`
    if (platform === 'instagram') navigator.clipboard.writeText(`${text} ${link}`)
    if (platform === 'email')     window.location.href = `mailto:?subject=Join Creator Nexus&body=${text} ${link}`
  }

  if (w === 0 || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f7f5ff', fontFamily: "'Rubik',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(128,97,255,0.2)', borderTopColor: '#8061ff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: 'rgba(10,6,18,0.45)', fontSize: 14 }}>Loading referrals…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5ff', fontFamily: "'Rubik',sans-serif", color: '#0a0612' }}>

      {/* ── TOP BAR ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(10,6,18,0.08)', padding: isMobile ? '0 16px' : '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1.5px solid rgba(10,6,18,0.12)', color: 'rgba(10,6,18,0.50)', textDecoration: 'none', fontSize: 15 }}>←</Link>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#ff33bc,#8061ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 15 }}>N</span>
          </div>
          {!isMobile && <span style={{ fontWeight: 700, fontSize: 15, color: '#0a0612', letterSpacing: '-0.02em' }}>Referrals</span>}
        </div>
        <div style={{ background: 'rgba(128,97,255,0.08)', border: '1px solid rgba(128,97,255,0.20)', borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 700, color: '#8061ff' }}>
          {data?.coins ?? 0} 🪙 coins
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '24px 16px' : '32px 24px' }}>

        {/* ── HERO ── */}
        <div style={{ background: 'linear-gradient(135deg,#0a0612,#1a0a2e)', borderRadius: 20, padding: isMobile ? '28px 20px' : '36px 40px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', background: 'radial-gradient(ellipse at 90% 50%,rgba(128,97,255,0.25) 0%,transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8F135', marginBottom: 8 }}>Referral Program</p>
            <h1 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 30, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.15 }}>
              Invite creators.<br />Earn coins. Unlock Pro.
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 24, maxWidth: 420 }}>
              Share your referral link and earn 10 coins per signup. When they upgrade to Pro, you earn 25 more. Redeem coins for free Pro access.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { v: data?.coins ?? 0,        l: 'Coins available', color: '#C8F135' },
                { v: data?.signupCount ?? 0,  l: 'Creators joined',  color: '#ff7ac3' },
                { v: data?.upgradeCount ?? 0, l: 'Upgraded to Pro',  color: '#8061ff' },
              ].map(s => (
                <div key={s.l} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                  <p style={{ fontWeight: 900, fontSize: isMobile ? 20 : 24, color: s.color, letterSpacing: '-0.02em', marginBottom: 4 }}>{s.v}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{s.l}</p>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#ff7ac3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data?.referralLink ?? '---'}
              </span>
              <button onClick={copy} style={{ background: copied ? 'rgba(200,241,53,0.20)' : 'linear-gradient(90deg,#ff33bc,#8061ff)', border: 'none', borderRadius: 8, padding: '8px 16px', color: copied ? '#C8F135' : '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: "'Rubik',sans-serif" }}>
                {copied ? '✓ Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>

        {/* ── SHARE SHORTCUTS ── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1.5px solid rgba(10,6,18,0.08)', marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0a0612', marginBottom: 14 }}>Share your link</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { icon: '📸', label: 'Copy for Instagram', action: () => share('instagram') },
              { icon: '🎵', label: 'Copy for TikTok',    action: () => share('instagram') },
              { icon: '✉️', label: 'Share via email',    action: () => share('email') },
            ].map(s => (
              <button key={s.label} onClick={s.action} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(10,6,18,0.10)', background: '#fafafa', fontSize: 13, fontWeight: 600, color: '#0a0612', cursor: 'pointer', fontFamily: "'Rubik',sans-serif", transition: 'all 0.15s ease' }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ERROR / SUCCESS ── */}
        {error && (
          <div style={{ background: 'rgba(255,51,51,0.06)', border: '1.5px solid rgba(255,51,51,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#cc0000' }}>{error}</div>
        )}
        {redeemMsg && (
          <div style={{ background: 'rgba(0,168,90,0.07)', border: '1.5px solid rgba(0,168,90,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#00a85a', fontWeight: 600 }}>🎉 {redeemMsg}</div>
        )}

        {/* ── REWARDS ── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(10,6,18,0.08)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#0a0612' }}>Redeem Coins</p>
            <div style={{ background: 'rgba(128,97,255,0.08)', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#8061ff' }}>
              {data?.coins ?? 0} 🪙 available
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(10,6,18,0.45)', marginBottom: 20 }}>Exchange coins for Pro plan access</p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 12 }}>
            {(data?.rewards ?? []).map(r => {
              const canAfford = (data?.coins ?? 0) >= r.coinCost
              const isRedeeming = redeeming === r.id
              return (
                <div key={r.id} style={{
                  border: `1.5px solid ${canAfford ? 'rgba(128,97,255,0.25)' : 'rgba(10,6,18,0.08)'}`,
                  borderRadius: 12, padding: '16px 18px',
                  background: canAfford ? 'rgba(128,97,255,0.03)' : '#fafafa',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#0a0612', marginBottom: 4 }}>{r.label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 900, fontSize: 16, color: canAfford ? '#8061ff' : 'rgba(10,6,18,0.35)' }}>{r.coinCost} 🪙</span>
                    </div>
                  </div>
                  <button
                    onClick={() => canAfford && redeem(r.id)}
                    disabled={!canAfford || isRedeeming}
                    style={{
                      padding: '9px 18px', borderRadius: 8, border: 'none',
                      background: canAfford ? 'linear-gradient(90deg,#ff33bc,#8061ff)' : 'rgba(10,6,18,0.07)',
                      color: canAfford ? '#fff' : 'rgba(10,6,18,0.30)',
                      fontSize: 13, fontWeight: 700, cursor: canAfford ? 'pointer' : 'not-allowed',
                      fontFamily: "'Rubik',sans-serif", flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isRedeeming ? '…' : canAfford ? 'Redeem' : `Need ${r.coinCost - (data?.coins ?? 0)} more`}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(10,6,18,0.08)' }}>
          <p style={{ fontWeight: 800, fontSize: 15, color: '#0a0612', marginBottom: 20 }}>How it works</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { step: '01', title: 'Share your link', body: 'Copy your unique referral link and share it with other creators via Instagram, TikTok, or email.', icon: '🔗' },
              { step: '02', title: 'They sign up',    body: 'When a creator signs up using your link, you automatically earn 10 coins.', icon: '🎉' },
              { step: '03', title: 'They upgrade',    body: 'When your referred creator upgrades to a Pro plan, you earn a bonus 25 coins.', icon: '🚀' },
              { step: '04', title: 'Redeem rewards',  body: 'Use your coins to unlock free Pro plan access — monthly, yearly, or lifetime.', icon: '🎁' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(128,97,255,0.08)', border: '1.5px solid rgba(128,97,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0a0612', marginBottom: 4 }}>{s.title}</p>
                  <p style={{ fontSize: 13, color: 'rgba(10,6,18,0.55)', lineHeight: 1.6 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}