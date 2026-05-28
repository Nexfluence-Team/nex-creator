

'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const platColor: Record<string, string> = { instagram: '#e1306c', tiktok: '#0a0612', youtube: '#ff0000' }
const platIcon:  Record<string, string> = { instagram: '📸', tiktok: '🎵', youtube: '▶️' }
const CATS = ['All', 'Product Demo', 'Lifestyle', 'Testimonial Story', 'Travel']

interface Video       { _id: string; title: string; url: string; platform: string; category: string; views: string }
interface Rate        { _id: string; title: string; price: string; turnaround: string; description: string; includes: string[] }
interface CaseStudy   { _id: string; brand: string; description: string; period: string; metrics: { label: string; value: string }[] }
interface Testimonial { _id: string; name: string; role: string; company: string; quote: string; rating: number }
interface Creator {
  _id: string; name: string; slug: string; location: string; bio: string
  profilePicUrl: string; ctaText: string; niches: string[]
  primaryColor: string; accentColor: string; font: string; theme: string
  links: Record<string, string>
}

function useBreakpoint() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const u = () => setW(window.innerWidth)
    u(); window.addEventListener('resize', u)
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
  useEffect(() => { try { setSent(!!localStorage.getItem(key)) } catch {} }, [key])
  const mark = () => { try { localStorage.setItem(key, Date.now().toString()) } catch {}; setSent(true) }
  return { sent, mark }
}

const inp = (f: boolean): React.CSSProperties => ({
  display: 'block', width: '100%', padding: '12px 14px',
  background: '#fff', border: `1.5px solid ${f ? 'rgba(128,97,255,0.65)' : 'rgba(10,6,18,0.14)'}`,
  borderRadius: 9, color: '#0a0612', fontSize: 14, outline: 'none',
  fontFamily: "'Rubik',sans-serif",
  boxShadow: f ? '0 0 0 3px rgba(128,97,255,0.10)' : 'none',
  transition: 'all 0.18s ease',
})
const lbl: React.CSSProperties = {
  display: 'block', color: 'rgba(10,6,18,0.42)', fontSize: 11, fontWeight: 500,
  letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6,
}

function FInput({ value, onChange, placeholder, type = 'text', multiline = false, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  type?: string; multiline?: boolean; rows?: number
}) {
  const [f, setF] = useState(false)
  if (multiline) return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      rows={rows} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...inp(f), resize: 'vertical', lineHeight: 1.65 }} />
  )
  return <input type={type} value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} onFocus={() => setF(true)} onBlur={() => setF(false)} style={inp(f)} />
}

function Modal({ onClose, children, wide }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(10,6,18,0.60)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: wide ? 640 : 520,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 -16px 64px rgba(10,6,18,0.20)',
        animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px', borderBottom: '1px solid rgba(10,6,18,0.07)',
      position: 'sticky', top: 0, background: '#fff', zIndex: 1,
    }}>
      <h3 style={{ margin: 0, fontWeight: 800, fontSize: 17, color: '#0a0612', letterSpacing: '-0.02em' }}>{title}</h3>
      <button onClick={onClose} style={{
        width: 32, height: 32, borderRadius: '50%', border: 'none',
        background: 'rgba(10,6,18,0.07)', cursor: 'pointer', fontSize: 15,
        color: 'rgba(10,6,18,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>✕</button>
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
            <h3 style={{ fontWeight: 800, fontSize: 20, color: '#0a0612', marginBottom: 8 }}>Message sent!</h3>
            <p style={{ color: 'rgba(10,6,18,0.50)', fontSize: 14, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 24px' }}>
              {creatorName} will be in touch via your email. Allow up to 48 hours for a response.
            </p>
            <button onClick={onClose} style={{ marginTop: 20, padding: '12px 28px', borderRadius: 10, border: 'none', background: '#C8F135', color: '#0a0612', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>Done</button>
          </div>
        ) : (
          <>
            <p style={{ color: 'rgba(10,6,18,0.48)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Introduce yourself and tell {firstName} what you have in mind.
            </p>
            {error && <div style={{ background: 'rgba(255,51,51,0.06)', border: '1.5px solid rgba(255,51,51,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#cc0000' }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Your name *</label><FInput value={form.name} onChange={v => set('name', v)} placeholder="Jane Smith" /></div>
                <div><label style={lbl}>Company</label><FInput value={form.company} onChange={v => set('company', v)} placeholder="Brand Co." /></div>
              </div>
              <div><label style={lbl}>Email address *</label><FInput value={form.email} onChange={v => set('email', v)} placeholder="jane@brand.com" type="email" /></div>
              <div><label style={lbl}>Your message *</label><FInput value={form.message} onChange={v => set('message', v)} placeholder={`Hi ${firstName}, I'm reaching out because…`} multiline rows={4} /></div>
            </div>
            <button onClick={submit} disabled={!ok || loading} style={{
              display: 'block', width: '100%', padding: '14px', borderRadius: 10, border: 'none',
              background: ok ? 'linear-gradient(90deg,#ff33bc,#8061ff)' : 'rgba(128,97,255,0.15)',
              color: ok ? '#fff' : 'rgba(10,6,18,0.35)', fontSize: 15, fontWeight: 700,
              cursor: ok ? 'pointer' : 'not-allowed', fontFamily: "'Rubik',sans-serif",
            }}>{loading ? 'Sending…' : 'Send message →'}</button>
          </>
        )}
      </div>
    </Modal>
  )
}

function WorkWithMeModal({ slug, creatorName, rates, onClose, onSent, alreadySent }: {
  slug: string; creatorName: string; rates: Rate[]
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
            <p style={{ fontWeight: 700, fontSize: 14, color: '#0a0612', marginBottom: 12 }}>Packages</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {rates.length === 0 ? (
                <p style={{ color: 'rgba(10,6,18,0.45)', fontSize: 13 }}>No packages listed yet. Send a message to inquire.</p>
              ) : rates.map(r => (
                <div key={r._id} style={{ border: '1.5px solid rgba(10,6,18,0.09)', borderRadius: 12, padding: '16px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <p style={{ fontWeight: 800, fontSize: 14, color: '#0a0612' }}>{r.title}</p>
                    <p style={{ fontWeight: 900, fontSize: 16, color: '#8061ff' }}>{r.price}</p>
                  </div>
                  {r.turnaround && <p style={{ fontSize: 11, color: 'rgba(10,6,18,0.40)', marginBottom: 8 }}>⏱ {r.turnaround}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.includes.slice(0, 3).map((inc, i) => (
                      <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 100, background: 'rgba(128,97,255,0.07)', color: 'rgba(10,6,18,0.60)', border: '1px solid rgba(128,97,255,0.12)' }}>✓ {inc}</span>
                    ))}
                    {r.includes.length > 3 && <span style={{ fontSize: 11, color: 'rgba(10,6,18,0.40)' }}>+{r.includes.length - 3} more</span>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStage('form')} style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#ff33bc,#8061ff)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>
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
                <p style={{ fontWeight: 800, fontSize: 18, color: '#0a0612', marginBottom: 8 }}>You've already reached out!</p>
                <p style={{ color: 'rgba(10,6,18,0.50)', fontSize: 14, lineHeight: 1.7 }}>Check your inbox for a reply from {firstName}.</p>
                <button onClick={onClose} style={{ marginTop: 20, padding: '12px 28px', borderRadius: 10, border: 'none', background: '#C8F135', color: '#0a0612', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>Got it</button>
              </div>
            ) : (
              <>
                <button onClick={() => setStage('rates')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(10,6,18,0.40)', fontSize: 13, cursor: 'pointer', marginBottom: 20, fontFamily: "'Rubik',sans-serif", padding: 0 }}>← Back to packages</button>
                {error && <div style={{ background: 'rgba(255,51,51,0.06)', border: '1.5px solid rgba(255,51,51,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#cc0000' }}>{error}</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div><label style={lbl}>Your name *</label><FInput value={form.name} onChange={v => set('name', v)} placeholder="Jane Smith" /></div>
                    <div><label style={lbl}>Company</label><FInput value={form.company} onChange={v => set('company', v)} placeholder="Brand Co." /></div>
                  </div>
                  <div><label style={lbl}>Email address *</label><FInput value={form.email} onChange={v => set('email', v)} placeholder="jane@brand.com" type="email" /></div>
                  <div>
                    <label style={lbl}>Budget range</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {BUDGETS.map(b => (
                        <button key={b} onClick={() => set('budget', b)} style={{ padding: '7px 13px', borderRadius: 100, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: `1.5px solid ${form.budget === b ? 'rgba(128,97,255,0.55)' : 'rgba(10,6,18,0.12)'}`, background: form.budget === b ? 'rgba(128,97,255,0.08)' : '#fff', color: form.budget === b ? '#0a0612' : 'rgba(10,6,18,0.55)', fontFamily: "'Rubik',sans-serif" }}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div><label style={lbl}>Tell me about your project *</label>
                    <FInput value={form.message} onChange={v => set('message', v)} placeholder="What are you promoting? What's the goal?" multiline rows={4} />
                  </div>
                </div>
                <button onClick={submit} disabled={!ok || loading} style={{ display: 'block', width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: ok ? 'linear-gradient(90deg,#ff33bc,#8061ff)' : 'rgba(128,97,255,0.15)', color: ok ? '#fff' : 'rgba(10,6,18,0.35)', fontSize: 15, fontWeight: 700, cursor: ok ? 'pointer' : 'not-allowed', fontFamily: "'Rubik',sans-serif" }}>
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
            <h3 style={{ fontWeight: 800, fontSize: 20, color: '#0a0612', marginBottom: 8 }}>You're in the inbox!</h3>
            <p style={{ color: 'rgba(10,6,18,0.50)', fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: '0 auto 24px' }}>
              {firstName} has received your inquiry and will reply to <strong style={{ color: '#8061ff' }}>{form.email}</strong> within 24–48 hours.
            </p>
            <button onClick={onClose} style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: '#C8F135', color: '#0a0612', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>Close</button>
          </div>
        </>
      )}
    </Modal>
  )
}

function Skeleton() {
  return (
    <div style={{ background: '#f7f5ff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rubik',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(128,97,255,0.2)', borderTopColor: '#8061ff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: 'rgba(10,6,18,0.45)', fontSize: 14 }}>Loading profile…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function NotFound() {
  return (
    <div style={{ background: '#f7f5ff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rubik',sans-serif", textAlign: 'center', padding: 24 }}>
      <div>
        <p style={{ fontSize: 64, marginBottom: 16 }}>👤</p>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#0a0612', marginBottom: 8 }}>Profile not found</h1>
        <p style={{ color: 'rgba(10,6,18,0.50)', fontSize: 15, marginBottom: 24 }}>This creator hasn't set up their portfolio yet.</p>
        <a href="/" style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(90deg,#ff33bc,#8061ff)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', fontFamily: "'Rubik',sans-serif" }}>Go home</a>
      </div>
    </div>
  )
}

export default function PublicProfilePage() {
  const params   = useParams()
  const username = params.username as string

  const { isMobile, isTablet, w } = useBreakpoint()
  const scrolled = useScrolled(240)
  const { sent: alreadySent, mark: markSent } = useMessageGuard(username)

  const [creator,      setCreator]      = useState<Creator | null>(null)
  const [videos,       setVideos]       = useState<Video[]>([])
  const [rates,        setRates]        = useState<Rate[]>([])
  const [cases,        setCases]        = useState<CaseStudy[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [links,        setLinks]        = useState<Record<string, string>>({})
  const [loading,      setLoading]      = useState(true)
  const [notFound,     setNotFound]     = useState(false)
  const [activeModal,  setActiveModal]  = useState<'message' | 'workwithme' | null>(null)
  const [vidCat,       setVidCat]       = useState('All')

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

  if (loading)              return <Skeleton />
  if (notFound || !creator) return <NotFound />

  const filtered   = vidCat === 'All' ? videos : videos.filter(v => v.category === vidCat)
  const openMsg    = () => setActiveModal('message')
  const openWWM    = () => setActiveModal('workwithme')
  const closeModal = () => setActiveModal(null)
  const handleSent = () => { markSent(); closeModal() }

  const pc = creator.primaryColor || '#8061ff'
  const ac = creator.accentColor  || '#ff33bc'

  const SOCIAL_FIELDS = [
    { id: 'instagram', icon: '📸' }, { id: 'tiktok', icon: '🎵' },
    { id: 'youtube', icon: '▶️' },   { id: 'linkedin', icon: '💼' },
    { id: 'pinterest', icon: '📌' }, { id: 'x', icon: '✕' },
    { id: 'website', icon: '🌐' },   { id: 'email', icon: '✉️' },
  ]

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: `'${creator.font || 'Rubik'}',sans-serif`, color: '#0a0612' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid rgba(10,6,18,0.08)' : 'none', padding: isMobile ? '12px 16px' : '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${pc},${ac})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>N</span>
          </div>
          {scrolled && !isMobile && <span style={{ fontWeight: 700, fontSize: 15, color: '#0a0612' }}>{creator.name}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openMsg} style={{ padding: isMobile ? '8px 14px' : '9px 18px', borderRadius: 100, border: '1.5px solid rgba(10,6,18,0.18)', background: '#fff', color: '#0a0612', fontSize: isMobile ? 12 : 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>
            {alreadySent ? '✓ Message sent' : 'Send a message'}
          </button>
          <button onClick={openWWM} style={{ padding: isMobile ? '8px 14px' : '9px 18px', borderRadius: 100, border: 'none', background: `linear-gradient(90deg,${pc},${ac})`, color: '#fff', fontSize: isMobile ? 12 : 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>
            {creator.ctaText} →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: isMobile ? '100px 20px 60px' : '120px 24px 80px', textAlign: 'center', background: `linear-gradient(180deg,${pc}12 0%,#ffffff 100%)`, borderBottom: '1px solid rgba(10,6,18,0.06)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 50% at 50% 0%,${pc}18 0%,transparent 60%)` }} />
        <div style={{ width: isMobile ? 88 : 110, height: isMobile ? 88 : 110, borderRadius: '50%', margin: '0 auto 20px', background: creator.profilePicUrl ? 'transparent' : `linear-gradient(135deg,${pc}30,${ac}30)`, border: `3px solid ${pc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 40 : 52, overflow: 'hidden', position: 'relative' }}>
          {creator.profilePicUrl
            ? <img src={creator.profilePicUrl} alt={creator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontWeight: 900, color: pc }}>{creator.name[0]?.toUpperCase()}</span>
          }
          <div style={{ position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: '#22c55e', border: '3px solid #fff' }} />
        </div>
        <h1 style={{ fontWeight: 900, fontSize: isMobile ? 28 : 40, letterSpacing: '-0.035em', lineHeight: 1.1, color: '#0a0612', marginBottom: 6 }}>{creator.name}</h1>
        {creator.location && <p style={{ color: 'rgba(10,6,18,0.45)', fontSize: isMobile ? 13 : 15, marginBottom: 14 }}>{creator.location}</p>}
        {creator.bio && <p style={{ color: 'rgba(10,6,18,0.62)', fontSize: isMobile ? 14 : 16, lineHeight: 1.75, maxWidth: 520, margin: '0 auto 20px' }}>{creator.bio}</p>}
        {creator.niches.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            {creator.niches.map(n => (
              <span key={n} style={{ padding: '6px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: `${pc}15`, color: pc, border: `1px solid ${pc}30` }}>{n}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={openWWM} style={{ padding: '13px 28px', borderRadius: 100, border: 'none', background: `linear-gradient(90deg,${pc},${ac})`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif", boxShadow: '0 8px 24px rgba(128,97,255,0.35)' }}>{creator.ctaText} →</button>
          <button onClick={openMsg} style={{ padding: '13px 28px', borderRadius: 100, border: '1.5px solid rgba(10,6,18,0.15)', background: '#fff', color: '#0a0612', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>{alreadySent ? '✓ Message sent' : 'Send a message'}</button>
        </div>
      </section>

      {/* VIDEOS */}
      {videos.length > 0 && (
        <section style={{ padding: isMobile ? '48px 20px' : '64px 24px', maxWidth: 1040, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff7ac3', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 20, height: 1, background: '#ff7ac3' }} />Videos I've created
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, letterSpacing: '-0.03em', color: '#0a0612', margin: 0 }}>My Work</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setVidCat(c)} style={{ padding: '7px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${vidCat === c ? `${pc}80` : 'rgba(10,6,18,0.12)'}`, background: vidCat === c ? `${pc}15` : '#fff', color: vidCat === c ? pc : 'rgba(10,6,18,0.55)', fontFamily: "'Rubik',sans-serif" }}>{c}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 10 : 16 }}>
            {filtered.map(v => (
              <a key={v._id} href={v.url} target="_blank" rel="noopener noreferrer" style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(10,6,18,0.08)', background: '#fff', boxShadow: '0 2px 12px rgba(10,6,18,0.06)', transition: 'all 0.2s ease', textDecoration: 'none', display: 'block' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ aspectRatio: '9/14', background: `linear-gradient(160deg,${pc}20,${ac}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 32 : 40, position: 'relative' }}>
                  <span>{platIcon[v.platform] ?? '🎬'}</span>
                  <div style={{ position: 'absolute', top: 8, left: 8, background: platColor[v.platform] ?? '#0a0612', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 100, textTransform: 'uppercase' }}>
                    {platIcon[v.platform]} {v.platform}
                  </div>
                  {v.views && <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(10,6,18,0.70)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 100 }}>▶ {v.views}</div>}
                </div>
                <div style={{ padding: isMobile ? '10px' : '12px 14px' }}>
                  <p style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: '#0a0612', marginBottom: 3 }}>{v.title}</p>
                  <p style={{ fontSize: 11, color: 'rgba(10,6,18,0.40)' }}>{v.category}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* CASE STUDIES */}
      {cases.length > 0 && (
        <section style={{ padding: isMobile ? '48px 20px' : '64px 24px', background: '#f7f5ff', borderTop: '1px solid rgba(10,6,18,0.07)' }}>
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff7ac3', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 20, height: 1, background: '#ff7ac3' }} />Portfolio
            </p>
            <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, letterSpacing: '-0.03em', color: '#0a0612', marginBottom: 28 }}>Case Studies</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cases.map(c => (
                <div key={c._id} style={{ background: '#fff', borderRadius: 16, padding: isMobile ? '20px' : '24px', border: '1.5px solid rgba(10,6,18,0.08)', boxShadow: '0 2px 12px rgba(10,6,18,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg,${pc}25,${ac}25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, color: pc }}>{c.brand[0]}</div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 15, color: '#0a0612', marginBottom: 2 }}>{c.brand}</p>
                      {c.period && <p style={{ fontSize: 12, color: 'rgba(10,6,18,0.40)' }}>{c.period}</p>}
                    </div>
                  </div>
                  {c.description && <p style={{ fontSize: 14, color: 'rgba(10,6,18,0.65)', lineHeight: 1.75, marginBottom: 16 }}>{c.description}</p>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                    {c.metrics.map((m, i) => (
                      <div key={i} style={{ background: `${pc}10`, borderRadius: 10, padding: '12px', border: `1px solid ${pc}20`, textAlign: 'center' }}>
                        <p style={{ fontWeight: 900, fontSize: 18, color: '#0a0612', marginBottom: 2 }}>{m.value}</p>
                        <p style={{ fontSize: 11, color: 'rgba(10,6,18,0.45)' }}>{m.label}</p>
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
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ff7ac3', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 20, height: 1, background: '#ff7ac3' }} />Testimonials
          </p>
          <h2 style={{ fontWeight: 900, fontSize: isMobile ? 22 : 28, letterSpacing: '-0.03em', color: '#0a0612', marginBottom: 28 }}>Client Love</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(2,1fr)', gap: 16 }}>
            {testimonials.map(t => (
              <div key={t._id} style={{ background: '#fff', borderRadius: 16, padding: '24px', border: '1.5px solid rgba(10,6,18,0.08)', boxShadow: '0 2px 12px rgba(10,6,18,0.05)' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                  {[...Array(5)].map((_, i) => <span key={i} style={{ fontSize: 14, color: i < t.rating ? '#ff33bc' : 'rgba(10,6,18,0.15)' }}>★</span>)}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(10,6,18,0.72)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 16 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(10,6,18,0.06)', paddingTop: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${pc},${ac})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>{t.name[0]}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#0a0612', marginBottom: 1 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(10,6,18,0.40)' }}>{t.role}{t.company ? ` · ${t.company}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA BAND */}
      <section style={{ background: '#0a0612', padding: isMobile ? '56px 20px' : '72px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 60% at 50% 50%,${pc}25 0%,transparent 65%)` }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, margin: '0 auto' }}>
          <h2 style={{ fontWeight: 900, fontSize: isMobile ? 24 : 32, color: '#fff', letterSpacing: '-0.03em', marginBottom: 10, lineHeight: 1.15 }}>Ready to create something great?</h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>Let's talk about your campaign. One message is all it takes.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={openWWM} style={{ padding: '13px 28px', borderRadius: 100, border: 'none', background: `linear-gradient(90deg,${pc},${ac})`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>{creator.ctaText} →</button>
            <button onClick={openMsg} style={{ padding: '13px 28px', borderRadius: 100, border: '1.5px solid rgba(255,255,255,0.20)', background: 'transparent', color: 'rgba(255,255,255,0.80)', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>{alreadySent ? '✓ Message sent' : 'Send a message'}</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0a0612', borderTop: '1px solid rgba(255,255,255,0.07)', padding: isMobile ? '28px 20px' : '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${pc},${ac})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 12 }}>N</span>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Portfolio powered by</p>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontWeight: 700, fontSize: 13 }}>Nexfluence</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {SOCIAL_FIELDS.filter(s => links[s.id]).map(s => (
            <a key={s.id} href={`https://${links[s.id]}`} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.80)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')}
            >{s.id.charAt(0).toUpperCase() + s.id.slice(1)}</a>
          ))}
        </div>
      </footer>

      {/* MOBILE STICKY BAR */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 90, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(10,6,18,0.08)', padding: '12px 16px', display: 'flex', gap: 10 }}>
          <button onClick={openMsg} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid rgba(10,6,18,0.14)', background: '#fff', color: '#0a0612', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>{alreadySent ? '✓ Sent' : 'Message'}</button>
          <button onClick={openWWM} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: `linear-gradient(90deg,${pc},${ac})`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Rubik',sans-serif" }}>{creator.ctaText} →</button>
        </div>
      )}

      {activeModal === 'message' && <MessageModal slug={username} creatorName={creator.name} onClose={closeModal} onSent={handleSent} alreadySent={alreadySent} />}
      {activeModal === 'workwithme' && <WorkWithMeModal slug={username} creatorName={creator.name} rates={rates} onClose={closeModal} onSent={handleSent} alreadySent={alreadySent} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(10,6,18,0.26); }
        textarea { font-family: 'Rubik', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(10,6,18,0.15); border-radius:2px; }
        ${isMobile ? 'body { padding-bottom: 72px; }' : ''}
      `}</style>
    </div>
  )
}