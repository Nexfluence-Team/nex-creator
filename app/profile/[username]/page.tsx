'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

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

/* ─── Helper functions ───────────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const u = () => setW(window.innerWidth)
    u()
    window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])
  return { isMobile: w > 0 && w < 640, isTablet: w >= 640 && w < 1024, w }
}

function useScrolled(offset = 80) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > offset)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [offset])
  return scrolled
}

function useMessageGuard(slug: string) {
  const key = `nex_msg_${slug}`
  const [sent, setSent] = useState(false)
  useEffect(() => {
    try {
      setSent(!!localStorage.getItem(key))
    } catch {}
  }, [key])
  const mark = () => {
    try {
      localStorage.setItem(key, Date.now().toString())
    } catch {}
    setSent(true)
  }
  return { sent, mark }
}

/* ─── Input styles (v4) ──────────────────────────────────────────────── */
const inputBase = (focused: boolean): React.CSSProperties => ({
  display: 'block',
  width: '100%',
  padding: '12px 14px',
  background: focused ? C.bg : C.bgSub,
  border: focused ? `1.5px solid ${C.primary}` : C.border,
  borderRadius: C.rSm,
  color: C.ink,
  fontSize: 14,
  outline: 'none',
  fontFamily: C.font,
  boxShadow: focused ? `0 0 0 3px ${C.primaryBg}` : 'none',
  transition: 'all 0.18s ease',
})

const labelBase: React.CSSProperties = {
  display: 'block',
  color: C.inkDim,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  marginBottom: 6,
  fontFamily: C.font,
}

function FInput({ value, onChange, placeholder, type = 'text', multiline = false, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  type?: string; multiline?: boolean; rows?: number
}) {
  const [focused, setFocused] = useState(false)
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputBase(focused), resize: 'vertical', lineHeight: 1.65 }}
      />
    )
  }
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={inputBase(focused)}
    />
  )
}

/* ─── Modal components (refined) ─────────────────────────────────────── */
function Modal({ onClose, children, wide }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(10,6,18,0.60)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: C.bg,
          borderRadius: `${C.rLg}px ${C.rLg}px 0 0`,
          width: '100%',
          maxWidth: wide ? 640 : 520,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 -16px 64px rgba(10,6,18,0.20)',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px', borderBottom: `1px solid ${C.primaryBg}`,
        position: 'sticky', top: 0, background: C.bg, zIndex: 1,
      }}
    >
      <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17, color: C.ink, letterSpacing: '-0.02em' }}>{title}</h3>
      <button
        onClick={onClose}
        style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none',
          background: C.primaryBg, cursor: 'pointer', fontSize: 15,
          color: C.inkDim, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ✕
      </button>
    </div>
  )
}

function MessageModal({ slug, creatorName, onClose, onSent, alreadySent }: {
  slug: string; creatorName: string
  onClose: () => void; onSent: () => void; alreadySent: boolean
}) {
  const [form, setForm] = useState({ name: '', company: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const ok = form.name && form.email && form.message
  const firstName = creatorName.split(' ')[0]

  const submit = async () => {
    if (!ok) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/inbox/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          senderName: form.name,
          senderCompany: form.company,
          senderEmail: form.email,
          message: form.message,
        }),
      })
      const json = await res.json()
      if (!json.success && res.status !== 429) throw new Error(json.message)
      setSent(true); onSent()
    } catch (e: any) {
      setError(e.message || 'Could not send. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Send a message" onClose={onClose} />
      <div style={{ padding: '24px' }}>
        {alreadySent || sent ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>✅</p>
            <h3 style={{ fontWeight: 800, fontSize: 20, color: C.ink, marginBottom: 8 }}>Message sent!</h3>
            <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 24px' }}>
              {creatorName} will be in touch via your email. Allow up to 48 hours for a response.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: 20, padding: '12px 28px', borderRadius: C.rSm, border: 'none',
                background: C.grad, color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: C.font,
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: C.inkDim, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Introduce yourself and tell {firstName} what you have in mind.
            </p>
            {error && (
              <div
                style={{
                  background: `${C.primary}10`, border: `1px solid ${C.primary}40`,
                  borderRadius: C.rXs, padding: '8px 12px', marginBottom: 14,
                  fontSize: 13, color: C.primary,
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelBase}>Your name *</label>
                  <FInput value={form.name} onChange={v => set('name', v)} placeholder="Jane Smith" />
                </div>
                <div>
                  <label style={labelBase}>Company</label>
                  <FInput value={form.company} onChange={v => set('company', v)} placeholder="Brand Co." />
                </div>
              </div>
              <div>
                <label style={labelBase}>Email address *</label>
                <FInput value={form.email} onChange={v => set('email', v)} placeholder="jane@brand.com" type="email" />
              </div>
              <div>
                <label style={labelBase}>Your message *</label>
                <FInput
                  value={form.message}
                  onChange={v => set('message', v)}
                  placeholder={`Hi ${firstName}, I'm reaching out because…`}
                  multiline rows={4}
                />
              </div>
            </div>
            <button
              onClick={submit}
              disabled={!ok || loading}
              style={{
                display: 'block', width: '100%', padding: '14px', borderRadius: C.rSm, border: 'none',
                background: ok ? C.grad : C.primaryBg,
                color: ok ? '#fff' : C.inkDim,
                fontSize: 15, fontWeight: 700, cursor: ok ? 'pointer' : 'not-allowed',
                fontFamily: C.font,
              }}
            >
              {loading ? 'Sending…' : 'Send message →'}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}

function WorkWithMeModal({ slug, creatorName, rates, onClose, onSent, alreadySent }: {
  slug: string; creatorName: string; rates: any[]
  onClose: () => void; onSent: () => void; alreadySent: boolean
}) {
  const [stage, setStage] = useState<'rates' | 'form' | 'success'>('rates')
  const [form, setForm] = useState({ name: '', company: '', email: '', budget: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const ok = form.name && form.email && form.message
  const BUDGETS = ['Under €500', '€500 – €1,000', '€1,000 – €2,500', '€2,500 – €5,000', '€5,000+', 'Not sure yet']
  const firstName = creatorName.split(' ')[0]

  const submit = async () => {
    if (!ok) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/inbox/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inquiry',
          senderName: form.name,
          senderCompany: form.company,
          senderEmail: form.email,
          message: form.message,
          budget: form.budget,
        }),
      })
      const json = await res.json()
      if (!json.success && res.status !== 429) throw new Error(json.message)
      setStage('success'); onSent()
    } catch (e: any) {
      setError(e.message || 'Could not send. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} wide>
      {stage === 'rates' && (
        <>
          <ModalHeader title={`Work with ${firstName}`} onClose={onClose} />
          <div style={{ padding: '24px' }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 12 }}>Packages</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {rates.length === 0 ? (
                <p style={{ color: C.inkDim, fontSize: 13 }}>No packages listed yet. Send a message to inquire.</p>
              ) : (
                rates.map((r: any) => (
                  <div
                    key={r._id}
                    style={{
                      border: `1px solid ${C.primaryBg}`, borderRadius: C.rMd, padding: '16px',
                      background: C.bg, boxShadow: C.shadowSm,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <p style={{ fontWeight: 800, fontSize: 14, color: C.ink }}>{r.title}</p>
                      <p style={{ fontWeight: 900, fontSize: 16, color: C.primary }}>{r.price}</p>
                    </div>
                    {r.turnaround && <p style={{ fontSize: 11, color: C.inkDim, marginBottom: 8 }}>⏱ {r.turnaround}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {r.includes.slice(0, 3).map((inc: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 11, padding: '3px 9px', borderRadius: C.rXs,
                            background: C.primaryBg, color: C.inkDim,
                            border: `1px solid ${C.primaryBg}`,
                          }}
                        >
                          ✓ {inc}
                        </span>
                      ))}
                      {r.includes.length > 3 && (
                        <span style={{ fontSize: 11, color: C.inkFaint }}>+{r.includes.length - 3} more</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setStage('form')}
              style={{
                display: 'block', width: '100%', padding: '14px', borderRadius: C.rSm, border: 'none',
                background: C.grad, color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: C.font,
              }}
            >
              Send an inquiry →
            </button>
          </div>
        </>
      )}

      {stage === 'form' && (
        <>
          <ModalHeader title="Send an inquiry" onClose={onClose} />
          <div style={{ padding: '24px' }}>
            {alreadySent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>📬</p>
                <p style={{ fontWeight: 800, fontSize: 18, color: C.ink, marginBottom: 8 }}>You've already reached out!</p>
                <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7 }}>Check your inbox for a reply from {firstName}.</p>
                <button
                  onClick={onClose}
                  style={{
                    marginTop: 20, padding: '12px 28px', borderRadius: C.rSm, border: 'none',
                    background: C.grad, color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: C.font,
                  }}
                >
                  Got it
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setStage('rates')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
                    color: C.inkDim, fontSize: 13, cursor: 'pointer', marginBottom: 20,
                    fontFamily: C.font, padding: 0,
                  }}
                >
                  ← Back to packages
                </button>
                {error && (
                  <div
                    style={{
                      background: `${C.primary}10`, border: `1px solid ${C.primary}40`,
                      borderRadius: C.rXs, padding: '8px 12px', marginBottom: 14,
                      fontSize: 13, color: C.primary,
                    }}
                  >
                    {error}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={labelBase}>Your name *</label>
                      <FInput value={form.name} onChange={v => set('name', v)} placeholder="Jane Smith" />
                    </div>
                    <div>
                      <label style={labelBase}>Company</label>
                      <FInput value={form.company} onChange={v => set('company', v)} placeholder="Brand Co." />
                    </div>
                  </div>
                  <div>
                    <label style={labelBase}>Email address *</label>
                    <FInput value={form.email} onChange={v => set('email', v)} placeholder="jane@brand.com" type="email" />
                  </div>
                  <div>
                    <label style={labelBase}>Budget range</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {BUDGETS.map(b => (
                        <button
                          key={b}
                          onClick={() => set('budget', b)}
                          style={{
                            padding: '7px 13px', borderRadius: C.rSm, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            border: `1.5px solid ${form.budget === b ? C.primary : C.primaryBg}`,
                            background: form.budget === b ? C.primaryBg : C.bg,
                            color: form.budget === b ? C.ink : C.inkDim,
                            fontFamily: C.font,
                          }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelBase}>Tell me about your project *</label>
                    <FInput
                      value={form.message}
                      onChange={v => set('message', v)}
                      placeholder="What are you promoting? What's the goal?"
                      multiline rows={4}
                    />
                  </div>
                </div>
                <button
                  onClick={submit}
                  disabled={!ok || loading}
                  style={{
                    display: 'block', width: '100%', padding: '14px', borderRadius: C.rSm, border: 'none',
                    background: ok ? C.grad : C.primaryBg,
                    color: ok ? '#fff' : C.inkDim,
                    fontSize: 15, fontWeight: 700, cursor: ok ? 'pointer' : 'not-allowed',
                    fontFamily: C.font,
                  }}
                >
                  {loading ? 'Sending…' : 'Submit inquiry →'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {stage === 'success' && (
        <>
          <ModalHeader title="Inquiry sent!" onClose={onClose} />
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎉</p>
            <h3 style={{ fontWeight: 800, fontSize: 20, color: C.ink, marginBottom: 8 }}>You're in the inbox!</h3>
            <p style={{ color: C.inkDim, fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: '0 auto 24px' }}>
              {firstName} has received your inquiry and will reply to <strong style={{ color: C.primary }}>{form.email}</strong> within 24–48 hours.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '12px 32px', borderRadius: C.rSm, border: 'none',
                background: C.grad, color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: C.font,
              }}
            >
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ─── Skeleton & Not Found ───────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ background: C.bgPage, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.primaryBg}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: C.inkDim, fontSize: 14 }}>Loading profile…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function NotFound() {
  return (
    <div style={{ background: C.bgPage, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, textAlign: 'center', padding: 24 }}>
      <div>
        <p style={{ fontSize: 64, marginBottom: 16 }}>👤</p>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: C.ink, marginBottom: 8 }}>Profile not found</h1>
        <p style={{ color: C.inkDim, fontSize: 15, marginBottom: 24 }}>This creator hasn't set up their portfolio yet.</p>
        <a href="/" style={{ padding: '12px 24px', borderRadius: C.rSm, background: C.grad, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', fontFamily: C.font }}>Go home</a>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string

  const { isMobile, isTablet, w } = useBreakpoint()
  const scrolled = useScrolled(240)
  const { sent: alreadySent, mark: markSent } = useMessageGuard(username)

  const [creator, setCreator] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [rates, setRates] = useState<any[]>([])
  const [cases, setCases] = useState<any[]>([])
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [links, setLinks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeModal, setActiveModal] = useState<'message' | 'workwithme' | null>(null)
  const [vidCat, setVidCat] = useState('All')

  useEffect(() => {
    if (!username) return
    fetch(`${API}/profile/${username}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) { setNotFound(true); return }
        const d = json.data
        setCreator(d.user)
        setVideos(d.videos ?? [])
        setRates(d.rates ?? [])
        setCases(d.cases ?? [])
        setTestimonials(d.testimonials ?? [])
        setLinks(d.links ?? {})
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <Skeleton />
  if (notFound || !creator) return <NotFound />

  const filtered = vidCat === 'All' ? videos : videos.filter(v => v.category === vidCat)
  const openMsg = () => setActiveModal('message')
  const openWWM = () => setActiveModal('workwithme')
  const closeModal = () => setActiveModal(null)
  const handleSent = () => { markSent(); closeModal() }

  // Creator custom colours (fallback to system tokens)
  const pc = creator.primaryColor || C.primary
  const ac = creator.accentColor || C.primaryLt
  const customGrad = `linear-gradient(90deg, ${pc}, ${ac})`

  const CATS = ['All', 'Product Demo', 'Lifestyle', 'Testimonial Story', 'Travel']
  const SOCIAL_FIELDS = [
    { id: 'instagram', icon: '📸' }, { id: 'tiktok', icon: '🎵' },
    { id: 'youtube', icon: '▶️' }, { id: 'linkedin', icon: '💼' },
    { id: 'pinterest', icon: '📌' }, { id: 'x', icon: '✕' },
    { id: 'website', icon: '🌐' }, { id: 'email', icon: '✉️' },
  ]

  return (
    <div style={{ background: C.bgPage, minHeight: '100vh', fontFamily: `'${creator.font || 'Rubik'}', sans-serif`, color: C.ink }}>

      {/* NAV */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? `1px solid ${C.primaryBg}` : 'none',
          padding: isMobile ? '12px 16px' : '14px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: C.rSm, flexShrink: 0,
              background: customGrad, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>N</span>
          </div>
          {scrolled && !isMobile && <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{creator.name}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={openMsg}
            style={{
              padding: isMobile ? '8px 14px' : '9px 18px',
              borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`,
              background: C.bg, color: C.inkDim, fontSize: isMobile ? 12 : 13,
              fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
            }}
          >
            {alreadySent ? '✓ Message sent' : 'Send a message'}
          </button>
          <button
            onClick={openWWM}
            style={{
              padding: isMobile ? '8px 14px' : '9px 18px',
              borderRadius: C.rSm, border: 'none',
              background: customGrad, color: '#fff', fontSize: isMobile ? 12 : 13,
              fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
            }}
          >
            {creator.ctaText} →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          padding: isMobile ? '100px 20px 60px' : '120px 24px 80px',
          textAlign: 'center',
          background: `linear-gradient(180deg, ${pc}12 0%, ${C.bgPage} 100%)`,
          borderBottom: `1px solid ${C.primaryBg}`,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${pc}18 0%, transparent 60%)`,
          }}
        />
        <div
          style={{
            width: isMobile ? 88 : 110, height: isMobile ? 88 : 110,
            borderRadius: '50%', margin: '0 auto 20px',
            background: creator.profilePicUrl ? 'transparent' : `${pc}30`,
            border: `3px solid ${pc}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? 40 : 52, overflow: 'hidden', position: 'relative',
          }}
        >
          {creator.profilePicUrl ? (
            <img src={creator.profilePicUrl} alt={creator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontWeight: 900, color: pc }}>{creator.name[0]?.toUpperCase()}</span>
          )}
          <div
            style={{
              position: 'absolute', bottom: 2, right: 2, width: 20, height: 20,
              borderRadius: '50%', background: '#22c55e', border: '3px solid #fff',
            }}
          />
        </div>
        <h1
          style={{
            fontWeight: 900, fontSize: isMobile ? 28 : 40, letterSpacing: '-0.035em',
            lineHeight: 1.1, color: C.ink, marginBottom: 6,
          }}
        >
          {creator.name}
        </h1>
        {creator.location && (
          <p style={{ color: C.inkDim, fontSize: isMobile ? 13 : 15, marginBottom: 14 }}>{creator.location}</p>
        )}
        {creator.bio && (
          <p
            style={{
              color: C.inkDim2, fontSize: isMobile ? 14 : 16, lineHeight: 1.75,
              maxWidth: 520, margin: '0 auto 20px',
            }}
          >
            {creator.bio}
          </p>
        )}
        {creator.niches.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            {creator.niches.map((n: string) => (
              <span
                key={n}
                style={{
                  padding: '6px 14px', borderRadius: C.rXs, fontSize: 13, fontWeight: 600,
                  background: `${pc}15`, color: pc, border: `1px solid ${pc}30`,
                }}
              >
                {n}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={openWWM}
            style={{
              padding: '13px 28px', borderRadius: C.rSm, border: 'none',
              background: customGrad, color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: C.font, boxShadow: C.shadowMd,
            }}
          >
            {creator.ctaText} →
          </button>
          <button
            onClick={openMsg}
            style={{
              padding: '13px 28px', borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`,
              background: C.bg, color: C.ink, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: C.font,
            }}
          >
            {alreadySent ? '✓ Message sent' : 'Send a message'}
          </button>
        </div>
      </section>

      {/* VIDEOS */}
      {videos.length > 0 && (
        <section style={{ padding: isMobile ? '48px 20px' : '64px 24px', maxWidth: 1040, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: pc, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span style={{ display: 'inline-block', width: 20, height: 1, background: pc }} />Videos I've created
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, letterSpacing: '-0.03em', color: C.ink, margin: 0 }}>My Work</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATS.map(c => (
                <button
                  key={c}
                  onClick={() => setVidCat(c)}
                  style={{
                    padding: '7px 14px', borderRadius: C.rSm, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: `1.5px solid ${vidCat === c ? pc : C.primaryBg}`,
                    background: vidCat === c ? `${pc}15` : C.bg,
                    color: vidCat === c ? pc : C.inkDim,
                    fontFamily: C.font,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 10 : 16 }}>
            {filtered.map((v: any) => (
              <a
                key={v._id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  borderRadius: C.rLg, overflow: 'hidden', border: `1px solid ${C.primaryBg}`,
                  background: C.bg, boxShadow: C.shadowCard, transition: 'all 0.2s ease',
                  textDecoration: 'none', display: 'block',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)' }}
              >
                <div
                  style={{
                    aspectRatio: '9/14', background: `linear-gradient(160deg,${pc}20,${ac}20)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isMobile ? 32 : 40, position: 'relative',
                  }}
                >
                  <span>🎬</span>
                  <div
                    style={{
                      position: 'absolute', top: 8, left: 8,
                      background: pc, color: '#fff', fontSize: 9, fontWeight: 700,
                      padding: '3px 7px', borderRadius: C.rXs, textTransform: 'uppercase',
                    }}
                  >
                    {v.platform}
                  </div>
                  {v.views && (
                    <div
                      style={{
                        position: 'absolute', bottom: 8, right: 8,
                        background: C.ink, color: '#fff', fontSize: 10, fontWeight: 700,
                        padding: '3px 7px', borderRadius: C.rXs,
                      }}
                    >
                      ▶ {v.views}
                    </div>
                  )}
                </div>
                <div style={{ padding: isMobile ? '10px' : '12px 14px' }}>
                  <p style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: C.ink, marginBottom: 3 }}>{v.title}</p>
                  <p style={{ fontSize: 11, color: C.inkDim }}>{v.category}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* CASE STUDIES */}
      {cases.length > 0 && (
        <section
          style={{
            padding: isMobile ? '48px 20px' : '64px 24px',
            background: C.bgSub, borderTop: `1px solid ${C.primaryBg}`,
          }}
        >
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <p
              style={{
                fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: pc, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ display: 'inline-block', width: 20, height: 1, background: pc }} />Portfolio
            </p>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, letterSpacing: '-0.03em', color: C.ink, marginBottom: 28 }}>Case Studies</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cases.map((c: any) => (
                <div
                  key={c._id}
                  style={{
                    background: C.bg, borderRadius: C.rLg, padding: isMobile ? '20px' : '24px',
                    border: `1px solid ${C.primaryBg}`, boxShadow: C.shadowCard,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div
                      style={{
                        width: 44, height: 44, borderRadius: C.rMd, flexShrink: 0,
                        background: `${pc}25`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 18, color: pc,
                      }}
                    >
                      {c.brand[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 2 }}>{c.brand}</p>
                      {c.period && <p style={{ fontSize: 12, color: C.inkDim }}>{c.period}</p>}
                    </div>
                  </div>
                  {c.description && <p style={{ fontSize: 14, color: C.inkDim2, lineHeight: 1.75, marginBottom: 16 }}>{c.description}</p>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {c.metrics.map((m: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          background: `${pc}10`, borderRadius: C.rMd, padding: '12px',
                          border: `1px solid ${pc}20`, textAlign: 'center',
                        }}
                      >
                        <p style={{ fontWeight: 900, fontSize: 18, color: C.ink, marginBottom: 2 }}>{m.value}</p>
                        <p style={{ fontSize: 11, color: C.inkDim }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section style={{ padding: isMobile ? '48px 20px' : '64px 24px', maxWidth: 1040, margin: '0 auto' }}>
          <p
            style={{
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: pc, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span style={{ display: 'inline-block', width: 20, height: 1, background: pc }} />Testimonials
          </p>
          <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, letterSpacing: '-0.03em', color: C.ink, marginBottom: 28 }}>Client Love</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(2,1fr)', gap: 16 }}>
            {testimonials.map((t: any) => (
              <div
                key={t._id}
                style={{
                  background: C.bg, borderRadius: C.rLg, padding: '24px',
                  border: `1px solid ${C.primaryBg}`, boxShadow: C.shadowCard,
                }}
              >
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ fontSize: 14, color: i < t.rating ? pc : C.primaryBg }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: 14, color: C.inkDim2, lineHeight: 1.8, marginBottom: 16 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: `1px solid ${C.primaryBg}`, paddingTop: 14 }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: customGrad, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14, color: '#fff',
                    }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 1 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: C.inkDim }}>
                      {t.role}{t.company ? ` · ${t.company}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA BAND */}
      <section
        style={{
          background: C.ink, padding: isMobile ? '56px 20px' : '72px 24px',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${pc}25 0%, transparent 65%)`,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, margin: '0 auto' }}>
          <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, color: '#fff', letterSpacing: '-0.03em', marginBottom: 10, lineHeight: 1.15 }}>
            Ready to create something great?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Let's talk about your campaign. One message is all it takes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={openWWM}
              style={{
                padding: '13px 28px', borderRadius: C.rSm, border: 'none',
                background: customGrad, color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: C.font,
              }}
            >
              {creator.ctaText} →
            </button>
            <button
              onClick={openMsg}
              style={{
                padding: '13px 28px', borderRadius: C.rSm,
                border: '1.5px solid rgba(255,255,255,0.20)', background: 'transparent',
                color: 'rgba(255,255,255,0.80)', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: C.font,
              }}
            >
              {alreadySent ? '✓ Message sent' : 'Send a message'}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: C.ink, borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: isMobile ? '28px 20px' : '32px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: C.rXs, flexShrink: 0,
              background: customGrad, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 12 }}>N</span>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Portfolio powered by</p>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 700, fontSize: 13 }}>Nexfluence</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {SOCIAL_FIELDS.filter(s => links[s.id]).map(s => (
            <a
              key={s.id}
              href={`https://${links[s.id]}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.80)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')}
            >
              {s.id.charAt(0).toUpperCase() + s.id.slice(1)}
            </a>
          ))}
        </div>
      </footer>

      {/* MOBILE STICKY BAR */}
      {isMobile && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90,
            background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
            borderTop: `1px solid ${C.primaryBg}`, padding: '12px 16px',
            display: 'flex', gap: 10,
          }}
        >
          <button
            onClick={openMsg}
            style={{
              flex: 1, padding: '12px', borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`,
              background: C.bg, color: C.ink, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
            }}
          >
            {alreadySent ? '✓ Sent' : 'Message'}
          </button>
          <button
            onClick={openWWM}
            style={{
              flex: 2, padding: '12px', borderRadius: C.rSm, border: 'none',
              background: customGrad, color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: C.font,
            }}
          >
            {creator.ctaText} →
          </button>
        </div>
      )}

      {activeModal === 'message' && (
        <MessageModal slug={username} creatorName={creator.name} onClose={closeModal} onSent={handleSent} alreadySent={alreadySent} />
      )}
      {activeModal === 'workwithme' && (
        <WorkWithMeModal slug={username} creatorName={creator.name} rates={rates} onClose={closeModal} onSent={handleSent} alreadySent={alreadySent} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        @keyframes slideUp { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:translateY(0) } }
        input::placeholder, textarea::placeholder { color: ${C.inkFaint}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.primaryBg}; border-radius: 2px; }
        ${isMobile ? 'body { padding-bottom: 72px; }' : ''}
      `}</style>
    </div>
  )
}