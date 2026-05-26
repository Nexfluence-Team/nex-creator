'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

/* ─── Breakpoint ──────────────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(0)
  useEffect(() => {
    const u = () => setW(window.innerWidth)
    u(); window.addEventListener('resize', u)
    return () => window.removeEventListener('resize', u)
  }, [])
  return { isMobile: w > 0 && w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024, w }
}

/* ─── Types ───────────────────────────────────────────────────────── */
type Tab = 'header' | 'media' | 'rates' | 'cases' | 'testimonials' | 'links' | 'design' | 'inbox'

interface Video   { id: string; title: string; url: string; platform: string; category: string; views: string }
interface Rate    { id: string; title: string; price: string; turnaround: string; description: string; includes: string[] }
interface Case    { id: string; brand: string; description: string; period: string; metrics: { label: string; value: string }[] }
interface Testi   { id: string; name: string; role: string; company: string; quote: string; rating: number }

interface InboxMsg {
  id: string
  type: 'message' | 'inquiry'
  read: boolean
  name: string
  company: string
  email: string
  message: string
  budget?: string
  receivedAt: string   // human-readable relative time
}

interface Profile {
  name: string; bio: string; location: string; profilePic: string | null
  ctaText: string; niches: string[]; slug: string
  videos: Video[]; rates: Rate[]; cases: Case[]; testimonials: Testi[]
  links: Record<string, string>
  theme: string; primaryColor: string; accentColor: string; font: string
}

/* ─── Constants ───────────────────────────────────────────────────── */
const NICHES    = ['Beauty','Fashion','Lifestyle','Food & Drink','Fitness','Travel','Tech','Home','Wellness','Gaming','Parenting','Finance']
const CATEGORIES = ['Testimonial Story','Product Demo','Lifestyle','Travel','Unboxing','Review']
const FONTS     = ['Rubik','Inter','Playfair Display','Montserrat']
const SWATCHES  = ['#8061ff','#ff33bc','#ff7ac3','#C8F135','#4ECDC4','#FF6B35','#0a0612','#2d4a6e']
const THEMES    = [
  { id:'minimal', label:'Minimal',  bg:'#ffffff', fg:'#0a0612' },
  { id:'dark',    label:'Dark',     bg:'#0a0612', fg:'#ffffff' },
  { id:'violet',  label:'Violet',   bg:'#1a0a2e', fg:'#ffffff' },
  { id:'warm',    label:'Warm',     bg:'#fdf8f0', fg:'#0a0612' },
  { id:'classic', label:'Classic',  bg:'#f7f5ff', fg:'#0a0612' },
  { id:'bloom',   label:'Bloom',    bg:'#fff0f5', fg:'#0a0612' },
]
const SOCIAL_FIELDS = [
  { id:'instagram', icon:'📸', label:'Instagram', ph:'instagram.com/yourhandle' },
  { id:'tiktok',    icon:'🎵', label:'TikTok',    ph:'tiktok.com/@yourhandle' },
  { id:'youtube',   icon:'▶️', label:'YouTube',   ph:'youtube.com/@channel' },
  { id:'linkedin',  icon:'💼', label:'LinkedIn',  ph:'linkedin.com/in/name' },
  { id:'pinterest', icon:'📌', label:'Pinterest', ph:'pinterest.com/handle' },
  { id:'x',         icon:'✕',  label:'X / Twitter',ph:'x.com/handle' },
  { id:'website',   icon:'🌐', label:'Website',   ph:'yourwebsite.com' },
  { id:'email',     icon:'✉️', label:'Email',     ph:'you@email.com' },
]
const NAV: { id: Tab; icon: string; label: string; badge?: number }[] = [
  { id:'header',       icon:'👤', label:'Header' },
  { id:'media',        icon:'🎬', label:'Media' },
  { id:'rates',        icon:'💰', label:'Rates' },
  { id:'cases',        icon:'📊', label:'Case Studies' },
  { id:'testimonials', icon:'💬', label:'Testimonials' },
  { id:'links',        icon:'🔗', label:'Links' },
  { id:'design',       icon:'🎨', label:'Design' },
  { id:'inbox',        icon:'📬', label:'Inbox', badge:3 },
]

const DEMO_INBOX: InboxMsg[] = [
  {
    id:'1', type:'inquiry', read:false,
    name:'Jane Smith', company:'Glossier EU', email:'jane.smith@glossier.com',
    budget:'€1,000 – €2,500',
    message:"Hi Sophie! We're launching a new serum next quarter and would love a 3-video UGC series. We saw your Replenish Labs work and it's exactly the vibe we're going for. Can we set up a quick call to discuss?",
    receivedAt:'2 hours ago',
  },
  {
    id:'2', type:'inquiry', read:false,
    name:'Marcus Obi', company:'Alo Yoga EU', email:'marcus@aloyoga.eu',
    budget:'€2,500 – €5,000',
    message:"Hey Sophie, Alo here. We're scaling our Baltic UGC strategy and want a monthly content partner. Your lifestyle content has the exact aesthetic we're building toward. Open to a retainer conversation?",
    receivedAt:'5 hours ago',
  },
  {
    id:'3', type:'message', read:false,
    name:'Priya Mehta', company:'Rhode', email:'priya@rhodebeauty.co',
    message:"Love your content style Sophie — particularly the Bali vlog and the skincare routine. We're looking for creators who can authentically represent the Rhode aesthetic in the Baltics. Keen to explore?",
    receivedAt:'1 day ago',
  },
  {
    id:'4', type:'inquiry', read:true,
    name:'Lena Kovacs', company:'Dyson Nordic', email:'l.kovacs@dyson.com',
    budget:'€500 – €1,000',
    message:"Hi Sophie, we'd love a single hero video for our new Airwrap launch campaign in the Baltics. Looking for a creator who can make it feel aspirational but relatable. Your work checks every box.",
    receivedAt:'3 days ago',
  },
  {
    id:'5', type:'message', read:true,
    name:'Tom Bergmann', company:'NARS Cosmetics', email:'t.bergmann@narscosmetics.com',
    message:"Sophie, big fan of your recent posts. NARS is planning a spring push in Eastern Europe and we think your audience is a great fit for us. Would love to chat more about potential collaboration.",
    receivedAt:'5 days ago',
  },
  {
    id:'6', type:'inquiry', read:true,
    name:'Sofia Andersson', company:'Skims EU', email:'sofia@skims.eu',
    budget:'€1,000 – €2,500',
    message:"Hi! I manage creator partnerships at Skims for Europe. We've been following your content for a while and are impressed by your engagement rates. Would love to send you a brief for an upcoming campaign.",
    receivedAt:'1 week ago',
  },
]
const INIT: Profile = {
  name:'', bio:'', location:'', profilePic:null, ctaText:'Work With Me', niches:[], slug:'',
  videos:[], rates:[], cases:[], testimonials:[],
  links:{ instagram:'',tiktok:'',youtube:'',linkedin:'',pinterest:'',x:'',website:'',email:'' },
  theme:'minimal', primaryColor:'#8061ff', accentColor:'#ff33bc', font:'Rubik',
}

/* ─── Style helpers ───────────────────────────────────────────────── */
const inp = (f: boolean): React.CSSProperties => ({
  display:'block', width:'100%', padding:'11px 14px',
  background:'#fff', border:`1.5px solid ${f ? 'rgba(128,97,255,0.65)' : 'rgba(10,6,18,0.13)'}`,
  borderRadius:8, color:'#0a0612', fontSize:14, outline:'none',
  fontFamily:"'Rubik',sans-serif",
  boxShadow: f ? '0 0 0 3px rgba(128,97,255,0.10)' : 'none',
  transition:'all 0.18s ease',
})
const lbl: React.CSSProperties = {
  display:'block', color:'rgba(10,6,18,0.42)', fontSize:11,
  fontWeight:500, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:6,
}
const sectionTitle: React.CSSProperties = {
  fontWeight:800, fontSize:17, color:'#0a0612', letterSpacing:'-0.02em', marginBottom:4,
}
const sectionSub: React.CSSProperties = {
  color:'rgba(10,6,18,0.45)', fontSize:13, marginBottom:24, lineHeight:1.5,
}
const divider: React.CSSProperties = {
  height:1, background:'rgba(10,6,18,0.07)', margin:'24px 0',
}
const card: React.CSSProperties = {
  background:'#fff', border:'1.5px solid rgba(10,6,18,0.09)',
  borderRadius:12, padding:'16px',
  boxShadow:'0 2px 8px rgba(10,6,18,0.05)',
}
const emptyBox: React.CSSProperties = {
  border:'2px dashed rgba(128,97,255,0.25)', borderRadius:12,
  padding:'40px 24px', textAlign:'center', background:'rgba(128,97,255,0.03)',
}

/* ─── Primitives ──────────────────────────────────────────────────── */
function FInput({ value, onChange, placeholder, type='text', multiline=false, rows=3 }: {
  value:string; onChange:(v:string)=>void; placeholder?:string
  type?:string; multiline?:boolean; rows?:number
}) {
  const [f,setF] = useState(false)
  if (multiline) return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      rows={rows} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{...inp(f), resize:'vertical', lineHeight:1.6}} />
  )
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={inp(f)} />
}

function Field({ label, children, mb=16 }: { label:string; children:React.ReactNode; mb?:number }) {
  return <div style={{marginBottom:mb}}><label style={lbl}>{label}</label>{children}</div>
}

function TagPill({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'7px 14px', borderRadius:100, cursor:'pointer',
      border:`1.5px solid ${active ? 'rgba(128,97,255,0.55)' : 'rgba(10,6,18,0.12)'}`,
      background: active ? 'rgba(128,97,255,0.08)' : '#fff',
      color: active ? '#0a0612' : 'rgba(10,6,18,0.55)',
      fontSize:13, fontWeight: active ? 700 : 500,
      fontFamily:"'Rubik',sans-serif", transition:'all 0.15s ease',
    }}>
      {label}
    </button>
  )
}

function SaveRow({ onSave, saved, loading }: { onSave:()=>void; saved:boolean; loading:boolean }) {
  return (
    <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:24, marginTop:8, borderTop:'1px solid rgba(10,6,18,0.07)' }}>
      <button onClick={onSave} style={{
        padding:'11px 28px', borderRadius:8, border:'none',
        background: saved ? 'rgba(0,168,90,0.12)' : '#C8F135',
        color: saved ? '#00a85a' : '#0a0612',
        fontSize:14, fontWeight:700, cursor:'pointer',
        fontFamily:"'Rubik',sans-serif", transition:'all 0.2s ease',
        display:'flex', alignItems:'center', gap:8,
      }}>
        {saved ? '✓ Saved!' : loading ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}

function useSave() {
  const [saved,setSaved] = useState(false)
  const [loading,setLoading] = useState(false)
  const save = (cb?:()=>void) => {
    setLoading(true)
    setTimeout(()=>{ setLoading(false); setSaved(true); cb?.(); setTimeout(()=>setSaved(false),2200) },600)
  }
  return { saved, loading, save }
}

function StarRating({ value, onChange }: { value:number; onChange:(n:number)=>void }) {
  const [hover,setHover] = useState(0)
  return (
    <div style={{display:'flex',gap:4}}>
      {[1,2,3,4,5].map(n=>(
        <button key={n} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}
          onClick={()=>onChange(n)} style={{
            background:'none',border:'none',cursor:'pointer',
            fontSize:22, color: n<=(hover||value) ? '#ff33bc' : 'rgba(10,6,18,0.18)',
            padding:'2px', transition:'color 0.1s ease',
          }}>★</button>
      ))}
    </div>
  )
}

/* ─── Modal Wrapper ───────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      background:'rgba(10,6,18,0.55)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{
        background:'#fff', borderRadius:16, width:'100%', maxWidth:500,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 32px 80px rgba(10,6,18,0.22)',
      }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'18px 24px', borderBottom:'1px solid rgba(10,6,18,0.07)',
          position:'sticky', top:0, background:'#fff', zIndex:1,
        }}>
          <h3 style={{margin:0, fontWeight:800, fontSize:16, color:'#0a0612', letterSpacing:'-0.02em'}}>{title}</h3>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:'50%', border:'none',
            background:'rgba(10,6,18,0.07)', cursor:'pointer', fontSize:14,
            color:'rgba(10,6,18,0.50)', display:'flex', alignItems:'center', justifyContent:'center',
          }}>✕</button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  )
}

function ModalFooter({ onCancel, onSave, label='Add', disabled }: {
  onCancel:()=>void; onSave:()=>void; label?:string; disabled?:boolean
}) {
  return (
    <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20,paddingTop:16,borderTop:'1px solid rgba(10,6,18,0.07)'}}>
      <button onClick={onCancel} style={{
        padding:'10px 20px', borderRadius:8, border:'1.5px solid rgba(10,6,18,0.12)',
        background:'#fff', color:'rgba(10,6,18,0.55)', fontSize:14, fontWeight:600,
        cursor:'pointer', fontFamily:"'Rubik',sans-serif",
      }}>Cancel</button>
      <button onClick={onSave} disabled={disabled} style={{
        padding:'10px 24px', borderRadius:8, border:'none',
        background: disabled ? 'rgba(200,241,53,0.35)' : '#C8F135',
        color: disabled ? 'rgba(10,6,18,0.38)' : '#0a0612',
        fontSize:14, fontWeight:700, cursor: disabled?'not-allowed':'pointer',
        fontFamily:"'Rubik',sans-serif",
      }}>{label}</button>
    </div>
  )
}

/* ─── VIDEO MODAL ─────────────────────────────────────────────────── */
function VideoModal({ onClose, onAdd }: { onClose:()=>void; onAdd:(v:Video)=>void }) {
  const [d,setD] = useState({ title:'', url:'', platform:'instagram', category:'Product Demo', views:'' })
  const ok = d.title && d.url
  return (
    <Modal title="Add Video" onClose={onClose}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Field label="Video URL"><FInput value={d.url} onChange={v=>setD(x=>({...x,url:v}))} placeholder="paste instagram, tiktok or youtube link" /></Field>
        <Field label="Title"><FInput value={d.title} onChange={v=>setD(x=>({...x,title:v}))} placeholder="Short video title" /></Field>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Platform">
            <select value={d.platform} onChange={e=>setD(x=>({...x,platform:e.target.value}))} style={{...inp(false),cursor:'pointer'}}>
              {['instagram','tiktok','youtube','other'].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={d.category} onChange={e=>setD(x=>({...x,category:e.target.value}))} style={{...inp(false),cursor:'pointer'}}>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="View count (optional)"><FInput value={d.views} onChange={v=>setD(x=>({...x,views:v}))} placeholder="e.g. 23.4K" /></Field>
      </div>
      <ModalFooter onCancel={onClose} disabled={!ok}
        onSave={()=>{ onAdd({...d,id:Date.now().toString()}); onClose() }} />
    </Modal>
  )
}

/* ─── RATE MODAL ──────────────────────────────────────────────────── */
function RateModal({ onClose, onAdd, initial }: { onClose:()=>void; onAdd:(r:Rate)=>void; initial?:Rate }) {
  const [d,setD] = useState(initial ?? { id:'', title:'', price:'', turnaround:'', description:'', includes:[''] })
  const setInclude = (i:number,v:string) => { const a=[...d.includes]; a[i]=v; setD(x=>({...x,includes:a})) }
  const addLine    = () => setD(x=>({...x,includes:[...x.includes,'']}))
  const removeLine = (i:number) => setD(x=>({...x,includes:x.includes.filter((_,j)=>j!==i)}))
  const ok = d.title && d.price
  return (
    <Modal title={initial ? 'Edit Service' : 'Add Service'} onClose={onClose}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Service title"><FInput value={d.title} onChange={v=>setD(x=>({...x,title:v}))} placeholder="e.g. UGC Video Package" /></Field>
          <Field label="Price"><FInput value={d.price} onChange={v=>setD(x=>({...x,price:v}))} placeholder="e.g. €500 or from €200" /></Field>
        </div>
        <Field label="Turnaround time"><FInput value={d.turnaround} onChange={v=>setD(x=>({...x,turnaround:v}))} placeholder="e.g. 5 business days" /></Field>
        <Field label="Description"><FInput value={d.description} onChange={v=>setD(x=>({...x,description:v}))} placeholder="Brief description of this service" multiline /></Field>
        <div>
          <label style={lbl}>What's included</label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {d.includes.map((inc,i)=>(
              <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
                <FInput value={inc} onChange={v=>setInclude(i,v)} placeholder={`Item ${i+1}`} />
                {d.includes.length>1 && (
                  <button onClick={()=>removeLine(i)} style={{
                    flexShrink:0,width:30,height:30,borderRadius:'50%',border:'none',
                    background:'rgba(255,51,188,0.10)',color:'#ff33bc',cursor:'pointer',fontSize:14,
                  }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={addLine} style={{
              alignSelf:'flex-start',background:'none',border:'1.5px dashed rgba(128,97,255,0.30)',
              borderRadius:8,padding:'7px 14px',color:'#8061ff',fontSize:13,fontWeight:600,
              cursor:'pointer',fontFamily:"'Rubik',sans-serif",
            }}>+ Add item</button>
          </div>
        </div>
      </div>
      <ModalFooter onCancel={onClose} disabled={!ok} label={initial?'Save changes':'Add service'}
        onSave={()=>{ onAdd({...d,id:d.id||Date.now().toString()}); onClose() }} />
    </Modal>
  )
}

/* ─── CASE STUDY MODAL ────────────────────────────────────────────── */
function CaseModal({ onClose, onAdd }: { onClose:()=>void; onAdd:(c:Case)=>void }) {
  const [d,setD] = useState({
    brand:'', description:'', period:'',
    metrics:[{label:'Avg. Views',value:''},{label:'Reach',value:''},{label:'Saves',value:''}]
  })
  const setMetric = (i:number,k:'label'|'value',v:string) => {
    const m=[...d.metrics]; m[i]={...m[i],[k]:v}; setD(x=>({...x,metrics:m}))
  }
  const ok = d.brand
  return (
    <Modal title="Add Case Study" onClose={onClose}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Brand name"><FInput value={d.brand} onChange={v=>setD(x=>({...x,brand:v}))} placeholder="e.g. Nike" /></Field>
          <Field label="Time period"><FInput value={d.period} onChange={v=>setD(x=>({...x,period:v}))} placeholder="e.g. 30-day campaign" /></Field>
        </div>
        <Field label="Campaign description"><FInput value={d.description} onChange={v=>setD(x=>({...x,description:v}))} placeholder="What did you create and what was the outcome?" multiline rows={4} /></Field>
        <div>
          <label style={lbl}>Key metrics</label>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {d.metrics.map((m,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <FInput value={m.label} onChange={v=>setMetric(i,'label',v)} placeholder="Metric name" />
                <FInput value={m.value} onChange={v=>setMetric(i,'value',v)} placeholder="e.g. 23.4K" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <ModalFooter onCancel={onClose} disabled={!ok} label="Add case study"
        onSave={()=>{ onAdd({...d,id:Date.now().toString()}); onClose() }} />
    </Modal>
  )
}

/* ─── TESTIMONIAL MODAL ───────────────────────────────────────────── */
function TestiModal({ onClose, onAdd }: { onClose:()=>void; onAdd:(t:Testi)=>void }) {
  const [d,setD] = useState({ name:'', role:'', company:'', quote:'', rating:5 })
  const ok = d.name && d.quote
  return (
    <Modal title="Add Testimonial" onClose={onClose}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Client name"><FInput value={d.name} onChange={v=>setD(x=>({...x,name:v}))} placeholder="Kacey Smith" /></Field>
          <Field label="Company"><FInput value={d.company} onChange={v=>setD(x=>({...x,company:v}))} placeholder="Brand Co." /></Field>
        </div>
        <Field label="Role / Title"><FInput value={d.role} onChange={v=>setD(x=>({...x,role:v}))} placeholder="e.g. Founder & CEO" /></Field>
        <Field label="Their quote"><FInput value={d.quote} onChange={v=>setD(x=>({...x,quote:v}))} placeholder="What did they say about working with you?" multiline rows={4} /></Field>
        <Field label="Rating">
          <StarRating value={d.rating} onChange={r=>setD(x=>({...x,rating:r}))} />
        </Field>
      </div>
      <ModalFooter onCancel={onClose} disabled={!ok} label="Add testimonial"
        onSave={()=>{ onAdd({...d,id:Date.now().toString()}); onClose() }} />
    </Modal>
  )
}

/* ─── TAB: HEADER ─────────────────────────────────────────────────── */
function HeaderTab({ profile, setProfile }: { profile:Profile; setProfile:(p:Profile)=>void }) {
  const { saved, loading, save } = useSave()
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (patch:Partial<Profile>) => setProfile({...profile,...patch})

  const pickPic = (e:React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; if(!file) return
    const r=new FileReader(); r.onload=ev=>set({profilePic:ev.target?.result as string}); r.readAsDataURL(file)
  }

  return (
    <div>
      <h2 style={sectionTitle}>Header</h2>
      <p style={sectionSub}>This is the first thing brands see on your portfolio.</p>

      {/* Profile photo */}
      <label style={lbl}>Profile photo</label>
      <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:24}}>
        <div onClick={()=>fileRef.current?.click()} style={{
          width:80,height:80,borderRadius:'50%',cursor:'pointer',flexShrink:0,
          background:profile.profilePic?'transparent':'rgba(128,97,255,0.08)',
          border:`2px dashed ${profile.profilePic?'transparent':'rgba(128,97,255,0.28)'}`,
          outline:profile.profilePic?'3px solid rgba(128,97,255,0.30)':'none',
          outlineOffset:3, display:'flex',alignItems:'center',justifyContent:'center',
          overflow:'hidden', transition:'all 0.2s ease',
        }}>
          {profile.profilePic
            ? <img src={profile.profilePic} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            : <span style={{fontSize:24}}>📷</span>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={pickPic} />
        <div>
          <button onClick={()=>fileRef.current?.click()} style={{
            display:'block',background:'none',border:'1.5px solid rgba(128,97,255,0.28)',
            borderRadius:8,padding:'8px 16px',color:'#8061ff',fontSize:13,fontWeight:700,
            cursor:'pointer',fontFamily:"'Rubik',sans-serif",marginBottom:6,
          }}>{profile.profilePic?'Change photo':'Upload photo'}</button>
          <p style={{color:'rgba(10,6,18,0.38)',fontSize:12,margin:0}}>JPG or PNG · Max 5MB</p>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Display name"><FInput value={profile.name} onChange={v=>set({name:v})} placeholder="Sophie Thomas" /></Field>
          <Field label="Location"><FInput value={profile.location} onChange={v=>set({location:v})} placeholder="Riga, Latvia" /></Field>
        </div>
        <Field label="Bio / Tagline"><FInput value={profile.bio} onChange={v=>set({bio:v})} placeholder="UGC creator specialising in beauty & lifestyle. I create scroll-stopping content for brands that converts." multiline rows={3} /></Field>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="CTA button text"><FInput value={profile.ctaText} onChange={v=>set({ctaText:v})} placeholder="Work With Me" /></Field>
          <Field label="Portfolio URL slug">
            <div style={{position:'relative'}}>
              <span style={{
                position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',
                fontSize:13,color:'rgba(10,6,18,0.38)',fontWeight:500,
              }}>nexfluence.co/</span>
              <input value={profile.slug} onChange={e=>set({slug:e.target.value})} placeholder="yourname"
                style={{...inp(false),paddingLeft:96}} />
            </div>
          </Field>
        </div>
        <Field label="Content niches — pick all that apply" mb={4}>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
            {NICHES.map(n=>(
              <TagPill key={n} label={n} active={profile.niches.includes(n)}
                onClick={()=>set({niches:profile.niches.includes(n)?profile.niches.filter(x=>x!==n):[...profile.niches,n]})} />
            ))}
          </div>
        </Field>
      </div>
      <SaveRow onSave={()=>save()} saved={saved} loading={loading} />
    </div>
  )
}

/* ─── TAB: MEDIA ──────────────────────────────────────────────────── */
function MediaTab({ profile, setProfile }: { profile:Profile; setProfile:(p:Profile)=>void }) {
  const [showVideoModal, setShowVideoModal] = useState(false)
  const { saved, loading, save } = useSave()
  const addVideo = (v:Video) => setProfile({...profile,videos:[...profile.videos,v]})
  const removeVideo = (id:string) => setProfile({...profile,videos:profile.videos.filter(v=>v.id!==id)})
  const platIcon: Record<string,string> = { instagram:'📸',tiktok:'🎵',youtube:'▶️',other:'🎬' }

  return (
    <div>
      <h2 style={sectionTitle}>Media</h2>
      <p style={sectionSub}>Add videos and photos to showcase your best work.</p>

      {/* Videos */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <span style={{fontWeight:700,fontSize:15,color:'#0a0612'}}>Videos <span style={{color:'rgba(10,6,18,0.35)',fontWeight:400}}>({profile.videos.length})</span></span>
        <button onClick={()=>setShowVideoModal(true)} style={{
          background:'linear-gradient(90deg,#ff33bc,#8061ff)',border:'none',
          borderRadius:8,padding:'8px 16px',color:'#fff',fontSize:13,fontWeight:700,
          cursor:'pointer',fontFamily:"'Rubik',sans-serif",
        }}>+ Add video</button>
      </div>

      {profile.videos.length===0
        ? <div style={emptyBox}>
            <p style={{fontSize:28,marginBottom:8}}>🎬</p>
            <p style={{fontWeight:700,color:'#0a0612',fontSize:15,marginBottom:4}}>No videos yet</p>
            <p style={{color:'rgba(10,6,18,0.45)',fontSize:13}}>Add your best UGC videos to show brands what you can do.</p>
          </div>
        : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:4}}>
            {profile.videos.map(v=>(
              <div key={v.id} style={{...card,position:'relative'}}>
                <button onClick={()=>removeVideo(v.id)} style={{
                  position:'absolute',top:10,right:10,width:24,height:24,borderRadius:'50%',border:'none',
                  background:'rgba(255,51,188,0.12)',color:'#ff33bc',cursor:'pointer',fontSize:12,
                  display:'flex',alignItems:'center',justifyContent:'center',
                }}>✕</button>
                <div style={{
                  aspectRatio:'9/14',background:'linear-gradient(160deg,rgba(128,97,255,0.15),rgba(255,51,188,0.15))',
                  borderRadius:8,marginBottom:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,
                }}>{platIcon[v.platform]}</div>
                <p style={{fontWeight:700,fontSize:13,color:'#0a0612',marginBottom:3}}>{v.title}</p>
                <p style={{fontSize:11,color:'rgba(10,6,18,0.40)'}}>
                  {v.category}{v.views?` · ${v.views} views`:''}
                </p>
              </div>
            ))}
          </div>
      }

      <div style={divider} />

      {/* Photos */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <span style={{fontWeight:700,fontSize:15,color:'#0a0612'}}>Photos</span>
        <button style={{
          border:'1.5px solid rgba(128,97,255,0.28)',borderRadius:8,padding:'8px 16px',
          background:'#fff',color:'#8061ff',fontSize:13,fontWeight:700,
          cursor:'pointer',fontFamily:"'Rubik',sans-serif",
        }}>+ Add photos</button>
      </div>
      <div style={emptyBox}>
        <p style={{fontSize:28,marginBottom:8}}>🖼️</p>
        <p style={{fontWeight:700,color:'#0a0612',fontSize:15,marginBottom:4}}>No photos yet</p>
        <p style={{color:'rgba(10,6,18,0.45)',fontSize:13}}>Upload product photos and behind-the-scenes content.</p>
      </div>

      <SaveRow onSave={()=>save()} saved={saved} loading={loading} />
      {showVideoModal && <VideoModal onClose={()=>setShowVideoModal(false)} onAdd={addVideo} />}
    </div>
  )
}

/* ─── TAB: RATES ──────────────────────────────────────────────────── */
function RatesTab({ profile, setProfile }: { profile:Profile; setProfile:(p:Profile)=>void }) {
  const [showModal, setShowModal] = useState(false)
  const [editRate, setEditRate]   = useState<Rate|undefined>()
  const { saved, loading, save }  = useSave()

  const addRate = (r:Rate) => {
    const exists = profile.rates.find(x=>x.id===r.id)
    setProfile({...profile, rates: exists ? profile.rates.map(x=>x.id===r.id?r:x) : [...profile.rates,r]})
  }
  const removeRate = (id:string) => setProfile({...profile,rates:profile.rates.filter(r=>r.id!==id)})

  return (
    <div>
      <h2 style={sectionTitle}>Rates & Services</h2>
      <p style={sectionSub}>Show brands exactly what you offer and how much it costs.</p>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button onClick={()=>{setEditRate(undefined);setShowModal(true)}} style={{
          background:'linear-gradient(90deg,#ff33bc,#8061ff)',border:'none',
          borderRadius:8,padding:'8px 16px',color:'#fff',fontSize:13,fontWeight:700,
          cursor:'pointer',fontFamily:"'Rubik',sans-serif",
        }}>+ Add service</button>
      </div>

      {profile.rates.length===0
        ? <div style={emptyBox}>
            <p style={{fontSize:28,marginBottom:8}}>💰</p>
            <p style={{fontWeight:700,color:'#0a0612',fontSize:15,marginBottom:4}}>No services yet</p>
            <p style={{color:'rgba(10,6,18,0.45)',fontSize:13}}>Add your packages so brands know exactly what to expect.</p>
          </div>
        : <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {profile.rates.map(r=>(
              <div key={r.id} style={{...card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                  <div>
                    <p style={{fontWeight:800,fontSize:15,color:'#0a0612',marginBottom:2}}>{r.title}</p>
                    <p style={{fontWeight:700,fontSize:18,color:'#8061ff'}}>{r.price}</p>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>{setEditRate(r);setShowModal(true)}} style={{
                      padding:'6px 12px',borderRadius:6,border:'1.5px solid rgba(128,97,255,0.28)',
                      background:'#fff',color:'#8061ff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Rubik',sans-serif",
                    }}>Edit</button>
                    <button onClick={()=>removeRate(r.id)} style={{
                      padding:'6px 12px',borderRadius:6,border:'none',
                      background:'rgba(255,51,188,0.10)',color:'#ff33bc',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Rubik',sans-serif",
                    }}>Delete</button>
                  </div>
                </div>
                {r.turnaround && <p style={{fontSize:12,color:'rgba(10,6,18,0.45)',marginBottom:8}}>⏱ {r.turnaround}</p>}
                {r.description && <p style={{fontSize:13,color:'rgba(10,6,18,0.60)',marginBottom:10,lineHeight:1.5}}>{r.description}</p>}
                {r.includes.filter(Boolean).length>0 && (
                  <div style={{borderTop:'1px solid rgba(10,6,18,0.07)',paddingTop:10}}>
                    {r.includes.filter(Boolean).map((inc,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                        <span style={{color:'#8061ff',fontSize:12}}>✓</span>
                        <span style={{fontSize:13,color:'rgba(10,6,18,0.65)'}}>{inc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
      }

      <SaveRow onSave={()=>save()} saved={saved} loading={loading} />
      {showModal && <RateModal onClose={()=>setShowModal(false)} onAdd={addRate} initial={editRate} />}
    </div>
  )
}

/* ─── TAB: CASE STUDIES ───────────────────────────────────────────── */
function CasesTab({ profile, setProfile }: { profile:Profile; setProfile:(p:Profile)=>void }) {
  const [showModal, setShowModal] = useState(false)
  const { saved, loading, save }  = useSave()
  const addCase    = (c:Case)   => setProfile({...profile,cases:[...profile.cases,c]})
  const removeCase = (id:string)=> setProfile({...profile,cases:profile.cases.filter(c=>c.id!==id)})

  return (
    <div>
      <h2 style={sectionTitle}>Case Studies</h2>
      <p style={sectionSub}>Prove your value with real campaign results and metrics.</p>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button onClick={()=>setShowModal(true)} style={{
          background:'linear-gradient(90deg,#ff33bc,#8061ff)',border:'none',
          borderRadius:8,padding:'8px 16px',color:'#fff',fontSize:13,fontWeight:700,
          cursor:'pointer',fontFamily:"'Rubik',sans-serif",
        }}>+ Add case study</button>
      </div>

      {profile.cases.length===0
        ? <div style={emptyBox}>
            <p style={{fontSize:28,marginBottom:8}}>📊</p>
            <p style={{fontWeight:700,color:'#0a0612',fontSize:15,marginBottom:4}}>No case studies yet</p>
            <p style={{color:'rgba(10,6,18,0.45)',fontSize:13}}>Show brands the real impact of your collaborations.</p>
          </div>
        : <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {profile.cases.map(c=>(
              <div key={c.id} style={{...card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{
                      width:42,height:42,borderRadius:10,
                      background:'linear-gradient(135deg,rgba(128,97,255,0.15),rgba(255,51,188,0.15))',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontWeight:900,fontSize:16,color:'#8061ff',
                    }}>{c.brand[0]?.toUpperCase()}</div>
                    <div>
                      <p style={{fontWeight:800,fontSize:15,color:'#0a0612',marginBottom:1}}>{c.brand}</p>
                      {c.period && <p style={{fontSize:12,color:'rgba(10,6,18,0.40)'}}>{c.period}</p>}
                    </div>
                  </div>
                  <button onClick={()=>removeCase(c.id)} style={{
                    padding:'6px 12px',borderRadius:6,border:'none',
                    background:'rgba(255,51,188,0.10)',color:'#ff33bc',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Rubik',sans-serif",
                  }}>Delete</button>
                </div>
                {c.description && <p style={{fontSize:13,color:'rgba(10,6,18,0.60)',marginBottom:12,lineHeight:1.5}}>{c.description}</p>}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {c.metrics.map((m,i)=>(
                    <div key={i} style={{
                      background:'rgba(128,97,255,0.06)',borderRadius:8,
                      padding:'10px 12px',border:'1px solid rgba(128,97,255,0.12)',
                    }}>
                      <p style={{fontWeight:800,fontSize:16,color:'#0a0612',marginBottom:2}}>{m.value||'—'}</p>
                      <p style={{fontSize:11,color:'rgba(10,6,18,0.45)'}}>{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
      }

      <SaveRow onSave={()=>save()} saved={saved} loading={loading} />
      {showModal && <CaseModal onClose={()=>setShowModal(false)} onAdd={addCase} />}
    </div>
  )
}

/* ─── TAB: TESTIMONIALS ───────────────────────────────────────────── */
function TestimonialsTab({ profile, setProfile }: { profile:Profile; setProfile:(p:Profile)=>void }) {
  const [showModal, setShowModal] = useState(false)
  const { saved, loading, save }  = useSave()
  const addTesti    = (t:Testi)    => setProfile({...profile,testimonials:[...profile.testimonials,t]})
  const removeTesti = (id:string)  => setProfile({...profile,testimonials:profile.testimonials.filter(t=>t.id!==id)})

  return (
    <div>
      <h2 style={sectionTitle}>Testimonials</h2>
      <p style={sectionSub}>Let past clients speak for you. Social proof converts brands.</p>

      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button onClick={()=>setShowModal(true)} style={{
          background:'linear-gradient(90deg,#ff33bc,#8061ff)',border:'none',
          borderRadius:8,padding:'8px 16px',color:'#fff',fontSize:13,fontWeight:700,
          cursor:'pointer',fontFamily:"'Rubik',sans-serif",
        }}>+ Add testimonial</button>
      </div>

      {profile.testimonials.length===0
        ? <div style={emptyBox}>
            <p style={{fontSize:28,marginBottom:8}}>💬</p>
            <p style={{fontWeight:700,color:'#0a0612',fontSize:15,marginBottom:4}}>No testimonials yet</p>
            <p style={{color:'rgba(10,6,18,0.45)',fontSize:13}}>Ask previous clients for a quote to build trust with new brands.</p>
          </div>
        : <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {profile.testimonials.map(t=>(
              <div key={t.id} style={{...card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div style={{display:'flex',gap:2}}>
                    {[...Array(5)].map((_,i)=>(
                      <span key={i} style={{fontSize:14,color:i<t.rating?'#ff33bc':'rgba(10,6,18,0.15)'}}>★</span>
                    ))}
                  </div>
                  <button onClick={()=>removeTesti(t.id)} style={{
                    padding:'6px 12px',borderRadius:6,border:'none',
                    background:'rgba(255,51,188,0.10)',color:'#ff33bc',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Rubik',sans-serif",
                  }}>Delete</button>
                </div>
                <p style={{fontSize:14,color:'rgba(10,6,18,0.70)',lineHeight:1.7,fontStyle:'italic',marginBottom:14}}>
                  "{t.quote}"
                </p>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{
                    width:34,height:34,borderRadius:'50%',flexShrink:0,
                    background:'linear-gradient(135deg,#ff33bc,#8061ff)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontWeight:800,fontSize:13,color:'#fff',
                  }}>{t.name[0]?.toUpperCase()}</div>
                  <div>
                    <p style={{fontWeight:700,fontSize:13,color:'#0a0612',marginBottom:1}}>{t.name}</p>
                    <p style={{fontSize:12,color:'rgba(10,6,18,0.40)'}}>{t.role}{t.company?` · ${t.company}`:''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }

      <SaveRow onSave={()=>save()} saved={saved} loading={loading} />
      {showModal && <TestiModal onClose={()=>setShowModal(false)} onAdd={addTesti} />}
    </div>
  )
}

/* ─── TAB: LINKS ──────────────────────────────────────────────────── */
function LinksTab({ profile, setProfile }: { profile:Profile; setProfile:(p:Profile)=>void }) {
  const { saved, loading, save } = useSave()
  const setLink = (k:string,v:string) => setProfile({...profile,links:{...profile.links,[k]:v}})

  return (
    <div>
      <h2 style={sectionTitle}>Social Links</h2>
      <p style={sectionSub}>Connect your platforms so brands can find and follow you everywhere.</p>

      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {SOCIAL_FIELDS.map(s=>(
          <div key={s.id}>
            <label style={lbl}>{s.icon} {s.label}</label>
            <FInput value={profile.links[s.id]??''} onChange={v=>setLink(s.id,v)} placeholder={s.ph} />
          </div>
        ))}
      </div>

      <SaveRow onSave={()=>save()} saved={saved} loading={loading} />
    </div>
  )
}

/* ─── TAB: DESIGN ─────────────────────────────────────────────────── */
function DesignTab({ profile, setProfile }: { profile:Profile; setProfile:(p:Profile)=>void }) {
  const { saved, loading, save } = useSave()
  const set = (patch:Partial<Profile>) => setProfile({...profile,...patch})

  return (
    <div>
      <h2 style={sectionTitle}>Design</h2>
      <p style={sectionSub}>Customise the look and feel of your portfolio.</p>

      {/* Theme */}
      <label style={lbl}>Portfolio theme</label>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:28}}>
        {THEMES.map(t=>{
          const active = profile.theme===t.id
          return (
            <button key={t.id} onClick={()=>set({theme:t.id})} style={{
              borderRadius:10,overflow:'hidden',cursor:'pointer',padding:0,
              border:`2px solid ${active?'#8061ff':'rgba(10,6,18,0.12)'}`,
              boxShadow: active?'0 0 0 3px rgba(128,97,255,0.18)':'none',
              transition:'all 0.18s ease', background:'none',
            }}>
              <div style={{background:t.bg,padding:'16px 10px',display:'flex',alignItems:'center',justifyContent:'center',height:60}}>
                <div style={{width:36,height:8,borderRadius:4,background:t.fg,opacity:0.7}} />
              </div>
              <div style={{
                padding:'8px',textAlign:'center',fontSize:12,fontWeight:active?700:500,
                color:active?'#8061ff':'rgba(10,6,18,0.55)',
                borderTop:'1px solid rgba(10,6,18,0.07)',background:'#fff',
                fontFamily:"'Rubik',sans-serif",
              }}>{t.label}</div>
            </button>
          )
        })}
      </div>

      {/* Colors */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:28}}>
        {[
          { label:'Primary colour', key:'primaryColor', val:profile.primaryColor },
          { label:'Accent colour',  key:'accentColor',  val:profile.accentColor },
        ].map(c=>(
          <div key={c.key}>
            <label style={lbl}>{c.label}</label>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
              <input type="color" value={c.val}
                onChange={e=>set({[c.key]:e.target.value})}
                style={{width:40,height:40,borderRadius:8,border:'1.5px solid rgba(10,6,18,0.13)',cursor:'pointer',padding:2,background:'#fff'}} />
              <FInput value={c.val} onChange={v=>set({[c.key]:v})} placeholder="#8061ff" />
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {SWATCHES.map(s=>(
                <button key={s} onClick={()=>set({[c.key]:s})} style={{
                  width:24,height:24,borderRadius:'50%',background:s,border:'none',
                  cursor:'pointer',outline:c.val===s?'2px solid #8061ff':'2px solid transparent',
                  outlineOffset:2,transition:'outline 0.15s ease',flexShrink:0,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Font */}
      <label style={lbl}>Typography</label>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:4}}>
        {FONTS.map(f=>{
          const active=profile.font===f
          return (
            <button key={f} onClick={()=>set({font:f})} style={{
              padding:'14px 16px',borderRadius:10,cursor:'pointer',textAlign:'left',
              border:`1.5px solid ${active?'rgba(128,97,255,0.55)':'rgba(10,6,18,0.12)'}`,
              background:active?'rgba(128,97,255,0.07)':'#fff',
              transition:'all 0.15s ease',fontFamily:"'Rubik',sans-serif",
            }}>
              <p style={{fontFamily:f==='Rubik'?"'Rubik',sans-serif":f==='Inter'?"'Inter',sans-serif":f==='Playfair Display'?"'Playfair Display',serif":"'Montserrat',sans-serif",
                fontWeight:700,fontSize:15,color:active?'#0a0612':'rgba(10,6,18,0.55)',marginBottom:2}}>{f}</p>
              <p style={{fontSize:11,color:'rgba(10,6,18,0.35)'}}>The quick brown fox</p>
            </button>
          )
        })}
      </div>

      <SaveRow onSave={()=>save()} saved={saved} loading={loading} />
    </div>
  )
}

/* ─── INBOX TAB ───────────────────────────────────────────────────── */
function InboxTab() {
  const [msgs, setMsgs]   = useState<InboxMsg[]>(DEMO_INBOX)
  const [filter, setFilter] = useState<'all'|'messages'|'inquiries'|'unread'>('all')
  const [expanded, setExpanded] = useState<string|null>(null)

  const unreadCount  = msgs.filter(m=>!m.read).length
  const inquiryCount = msgs.filter(m=>m.type==='inquiry').length
  const messageCount = msgs.filter(m=>m.type==='message').length

  const markRead = (id:string) =>
    setMsgs(prev=>prev.map(m=>m.id===id?{...m,read:true}:m))
  const deleteMsg = (id:string) =>
    setMsgs(prev=>prev.filter(m=>m.id!==id))
  const toggle = (id:string) => {
    setExpanded(e=>e===id?null:id)
    markRead(id)
  }

  const filtered = msgs.filter(m=>{
    if (filter==='messages')  return m.type==='message'
    if (filter==='inquiries') return m.type==='inquiry'
    if (filter==='unread')    return !m.read
    return true
  })

  const typeColor = (t:string) => t==='inquiry'
    ? { bg:'rgba(128,97,255,0.10)', color:'#8061ff', border:'rgba(128,97,255,0.25)' }
    : { bg:'rgba(255,122,195,0.10)', color:'#ff33bc', border:'rgba(255,122,195,0.25)' }

  return (
    <div style={{flex:1,background:'#f7f5ff',overflowY:'auto',padding:'28px 24px'}}>
      <div style={{maxWidth:720,margin:'0 auto'}}>

        {/* Header */}
        <div style={{marginBottom:24}}>
          <h2 style={{fontWeight:900,fontSize:22,color:'#0a0612',letterSpacing:'-0.03em',marginBottom:4}}>
            Inbox
          </h2>
          <p style={{color:'rgba(10,6,18,0.45)',fontSize:13}}>
            Messages and inquiries from brands and collaborators.
          </p>
        </div>

        {/* Stats row */}
        <div style={{
          display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24,
        }}>
          {[
            { label:'Total',     value:msgs.length,   color:'#0a0612' },
            { label:'Unread',    value:unreadCount,   color:'#ff33bc' },
            { label:'Inquiries', value:inquiryCount,  color:'#8061ff' },
            { label:'Messages',  value:messageCount,  color:'rgba(10,6,18,0.50)' },
          ].map(s=>(
            <div key={s.label} style={{
              background:'#fff',borderRadius:12,padding:'14px 16px',
              border:'1.5px solid rgba(10,6,18,0.08)',
              boxShadow:'0 2px 8px rgba(10,6,18,0.04)',
            }}>
              <p style={{fontWeight:900,fontSize:22,color:s.color,letterSpacing:'-0.02em',marginBottom:2}}>
                {s.value}
              </p>
              <p style={{fontSize:11,color:'rgba(10,6,18,0.42)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em'}}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap'}}>
          {(['all','messages','inquiries','unread'] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:'7px 16px',borderRadius:100,cursor:'pointer',
              background:filter===f?'#0a0612':'#fff',
              color:filter===f?'#fff':'rgba(10,6,18,0.55)',
              fontSize:12,fontWeight:filter===f?700:500,
              fontFamily:"'Rubik',sans-serif",
              border:filter===f?'1.5px solid #0a0612':'1.5px solid rgba(10,6,18,0.10)',
              transition:'all 0.15s ease',
            }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
              {f==='unread'&&unreadCount>0&&
                <span style={{
                  marginLeft:6,background:'#ff33bc',color:'#fff',
                  borderRadius:100,padding:'1px 6px',fontSize:10,fontWeight:800,
                }}>{unreadCount}</span>
              }
            </button>
          ))}
        </div>

        {/* Message list */}
        {filtered.length===0 ? (
          <div style={{
            textAlign:'center',padding:'60px 24px',background:'#fff',
            borderRadius:16,border:'1.5px solid rgba(10,6,18,0.08)',
          }}>
            <p style={{fontSize:36,marginBottom:12}}>📭</p>
            <p style={{fontWeight:700,fontSize:16,color:'#0a0612',marginBottom:6}}>Nothing here yet</p>
            <p style={{color:'rgba(10,6,18,0.42)',fontSize:14}}>
              {filter==='unread'?'All caught up — no unread messages.':'Share your portfolio link to start receiving messages.'}
            </p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtered.map(m=>{
              const tc   = typeColor(m.type)
              const open = expanded===m.id
              return (
                <div key={m.id} style={{
                  background:'#fff',borderRadius:14,
                  border:`1.5px solid ${!m.read?'rgba(128,97,255,0.28)':'rgba(10,6,18,0.08)'}`,
                  boxShadow: !m.read?'0 4px 16px rgba(128,97,255,0.08)':'0 2px 8px rgba(10,6,18,0.04)',
                  overflow:'hidden',transition:'all 0.2s ease',
                }}>

                  {/* Card header — always visible */}
                  <div
                    onClick={()=>toggle(m.id)}
                    style={{
                      padding:'16px 18px',cursor:'pointer',
                      display:'flex',alignItems:'flex-start',gap:14,
                    }}
                  >
                    {/* Unread dot */}
                    <div style={{
                      width:8,height:8,borderRadius:'50%',flexShrink:0,marginTop:6,
                      background:m.read?'transparent':'#8061ff',
                      border:m.read?'1.5px solid rgba(10,6,18,0.15)':'none',
                      transition:'all 0.2s ease',
                    }}/>

                    {/* Avatar */}
                    <div style={{
                      width:40,height:40,borderRadius:12,flexShrink:0,
                      background:`linear-gradient(135deg,${tc.color}30,${tc.color}60)`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontWeight:900,fontSize:15,color:tc.color,
                    }}>{m.name[0].toUpperCase()}</div>

                    {/* Meta */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                        <span style={{fontWeight:800,fontSize:14,color:'#0a0612',letterSpacing:'-0.01em'}}>
                          {m.name}
                        </span>
                        {m.company && (
                          <span style={{fontSize:12,color:'rgba(10,6,18,0.42)'}}>· {m.company}</span>
                        )}
                        <span style={{
                          fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:100,
                          background:tc.bg,color:tc.color,border:`1px solid ${tc.border}`,
                          textTransform:'uppercase',letterSpacing:'0.06em',marginLeft:'auto',
                        }}>{m.type}</span>
                      </div>

                      {/* Preview line */}
                      {!open && (
                        <p style={{
                          fontSize:13,color:'rgba(10,6,18,0.55)',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                          maxWidth:'100%',marginBottom:6,lineHeight:1.5,
                        }}>{m.message}</p>
                      )}

                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:11,color:'rgba(10,6,18,0.35)'}}>⏱ {m.receivedAt}</span>
                        {m.budget && (
                          <span style={{
                            fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:100,
                            background:'rgba(200,241,53,0.25)',color:'rgba(10,6,18,0.70)',
                            border:'1px solid rgba(200,241,53,0.50)',
                          }}>💰 {m.budget}</span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <span style={{
                      fontSize:12,color:'rgba(10,6,18,0.30)',flexShrink:0,marginTop:2,
                      transform:open?'rotate(180deg)':'rotate(0deg)',transition:'transform 0.2s ease',
                    }}>▼</span>
                  </div>

                  {/* Expanded body */}
                  {open && (
                    <div style={{padding:'0 18px 18px',borderTop:'1px solid rgba(10,6,18,0.06)',paddingTop:16}}>
                      {/* Full message */}
                      <p style={{
                        fontSize:14,color:'rgba(10,6,18,0.70)',lineHeight:1.8,
                        background:'rgba(10,6,18,0.03)',borderRadius:10,padding:'14px 16px',
                        marginBottom:14,borderLeft:`3px solid ${tc.color}`,
                      }}>
                        {m.message}
                      </p>

                      {/* Email */}
                      <div style={{
                        display:'flex',alignItems:'center',gap:8,marginBottom:14,
                        padding:'10px 14px',background:'rgba(128,97,255,0.05)',
                        borderRadius:8,border:'1px solid rgba(128,97,255,0.12)',
                      }}>
                        <span style={{fontSize:14}}>✉️</span>
                        <span style={{fontSize:13,fontWeight:500,color:'rgba(10,6,18,0.55)'}}>Reply to:</span>
                        <a href={`mailto:${m.email}`} style={{
                          fontSize:13,fontWeight:700,color:'#8061ff',textDecoration:'none',
                        }}>{m.email}</a>
                      </div>

                      {/* Actions */}
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        <a
                          href={`mailto:${m.email}?subject=Re: Your inquiry via Nexfluence&body=Hi ${m.name.split(' ')[0]},%0A%0AThanks for reaching out!`}
                          style={{
                            padding:'9px 18px',borderRadius:8,border:'none',
                            background:'linear-gradient(90deg,#ff33bc,#8061ff)',
                            color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none',
                            display:'inline-flex',alignItems:'center',gap:6,
                            fontFamily:"'Rubik',sans-serif",
                          }}
                        >
                          ✉️ Reply via email
                        </a>
                        {!m.read&&(
                          <button onClick={e=>{e.stopPropagation();markRead(m.id)}} style={{
                            padding:'9px 16px',borderRadius:8,fontSize:13,fontWeight:600,
                            border:'1.5px solid rgba(10,6,18,0.12)',background:'#fff',
                            color:'rgba(10,6,18,0.55)',cursor:'pointer',fontFamily:"'Rubik',sans-serif",
                          }}>Mark as read</button>
                        )}
                        <button onClick={e=>{e.stopPropagation();deleteMsg(m.id)}} style={{
                          padding:'9px 14px',borderRadius:8,fontSize:13,fontWeight:600,
                          border:'none',background:'rgba(255,51,188,0.08)',
                          color:'#ff33bc',cursor:'pointer',fontFamily:"'Rubik',sans-serif",
                          marginLeft:'auto',
                        }}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── LIVE PREVIEW ────────────────────────────────────────────────── */
function LivePreview({ profile, device }: { profile:Profile; device:string }) {
  const theme = THEMES.find(t=>t.id===profile.theme)??THEMES[0]
  const maxW  = device==='Mobile'?340:device==='Tablet'?600:'100%'

  return (
    <div style={{
      flex:1,background:'#f0eef8',display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'flex-start',padding:24,overflowY:'auto',
    }}>
      <div style={{width:'100%',maxWidth:maxW,transition:'max-width 0.4s ease'}}>
        {/* Browser chrome */}
        <div style={{
          background:'#e8e4f0',borderRadius:'12px 12px 0 0',
          padding:'10px 14px',display:'flex',alignItems:'center',gap:8,
          border:'1px solid rgba(10,6,18,0.08)',borderBottom:'none',
        }}>
          <div style={{display:'flex',gap:5}}>
            {['#ff5f57','#febc2e','#28c840'].map(c=>(
              <div key={c} style={{width:10,height:10,borderRadius:'50%',background:c}} />
            ))}
          </div>
          <div style={{
            flex:1,background:'white',borderRadius:6,padding:'4px 10px',
            fontSize:11,color:'rgba(10,6,18,0.40)',border:'1px solid rgba(10,6,18,0.08)',
          }}>
            nexfluence.co/{profile.slug||'yourname'}
          </div>
        </div>

        {/* Profile card */}
        <div style={{
          background:theme.bg,border:'1px solid rgba(10,6,18,0.08)',
          borderTop:'none',borderRadius:'0 0 12px 12px',overflow:'hidden',
          boxShadow:'0 8px 32px rgba(10,6,18,0.10)',
        }}>
          {/* Hero */}
          <div style={{
            background:`linear-gradient(135deg, ${profile.primaryColor}22, ${profile.accentColor}22)`,
            padding:'28px 24px',textAlign:'center',
            borderBottom:`1px solid rgba(10,6,18,0.06)`,
          }}>
            <div style={{
              width:64,height:64,borderRadius:'50%',margin:'0 auto 12px',
              background:profile.profilePic?'transparent':`linear-gradient(135deg,${profile.primaryColor},${profile.accentColor})`,
              border:`3px solid ${profile.primaryColor}44`,
              overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',
              fontWeight:900,fontSize:22,color:'#fff',
            }}>
              {profile.profilePic
                ? <img src={profile.profilePic} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                : profile.name?profile.name[0].toUpperCase():'?'
              }
            </div>
            <h2 style={{
              fontWeight:900,fontSize:20,color:theme.fg,letterSpacing:'-0.02em',
              marginBottom:6,fontFamily:profile.font?`'${profile.font}',sans-serif`:"'Rubik',sans-serif",
            }}>{profile.name||'Your Name'}</h2>
            {profile.location && <p style={{fontSize:12,color:`${theme.fg}70`,marginBottom:8}}>📍 {profile.location}</p>}
            {profile.bio && <p style={{fontSize:12,color:`${theme.fg}80`,lineHeight:1.5,maxWidth:260,margin:'0 auto 14px'}}>{profile.bio}</p>}
            <button style={{
              background:`linear-gradient(90deg,${profile.primaryColor},${profile.accentColor})`,
              border:'none',borderRadius:100,padding:'8px 20px',
              color:'#fff',fontSize:13,fontWeight:700,cursor:'default',
              fontFamily:"'Rubik',sans-serif",
            }}>{profile.ctaText||'Work With Me'}</button>
          </div>

          {/* Niches */}
          {profile.niches.length>0 && (
            <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(10,6,18,0.06)',display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
              {profile.niches.map(n=>(
                <span key={n} style={{
                  fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:100,
                  background:`${profile.primaryColor}15`,color:profile.primaryColor,
                  border:`1px solid ${profile.primaryColor}30`,
                }}>{n}</span>
              ))}
            </div>
          )}

          {/* Counts */}
          <div style={{padding:'14px 16px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',textAlign:'center',gap:8,borderBottom:'1px solid rgba(10,6,18,0.06)'}}>
            {[
              {label:'Videos',   val:profile.videos.length},
              {label:'Services', val:profile.rates.length},
              {label:'Reviews',  val:profile.testimonials.length},
            ].map(s=>(
              <div key={s.label}>
                <p style={{fontWeight:800,fontSize:16,color:theme.fg}}>{s.val||'—'}</p>
                <p style={{fontSize:10,color:`${theme.fg}55`}}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Social links */}
          {Object.values(profile.links).some(Boolean) && (
            <div style={{padding:'12px 16px',display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap'}}>
              {SOCIAL_FIELDS.filter(s=>profile.links[s.id]).map(s=>(
                <span key={s.id} title={s.label} style={{
                  fontSize:18, cursor:'default',
                  filter:'grayscale(0.3)',
                }}>{s.icon}</span>
              ))}
            </div>
          )}

          <div style={{padding:'12px 16px',textAlign:'center',borderTop:'1px solid rgba(10,6,18,0.05)'}}>
            <p style={{fontSize:10,color:`${theme.fg}30`}}>Made with Nexfluence</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ───────────────────────────────────────────────────── */
export default function StudioPage() {
  const { isMobile, isDesktop, w } = useBreakpoint()
  const [tab,     setTab]     = useState<Tab>('header')
  const [profile, setProfile] = useState<Profile>(INIT)
  const [device,  setDevice]  = useState('Desktop')
  const [showPreview, setShowPreview] = useState(false)

  if (w===0) return null

  const activeNav = NAV.find(n=>n.id===tab)

  return (
    <div style={{
      display:'flex', flexDirection:'column', height:'100vh',
      fontFamily:"'Rubik',sans-serif", background:'#f7f5ff', overflow:'hidden',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 20px',height:56,flexShrink:0,
        background:'#fff',borderBottom:'1px solid rgba(10,6,18,0.08)',
        zIndex:10,
      }}>
        {/* Left */}
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Link href="/dashboard" style={{
            display:'flex',alignItems:'center',justifyContent:'center',
            width:30,height:30,borderRadius:8,
            border:'1.5px solid rgba(10,6,18,0.12)',color:'rgba(10,6,18,0.50)',
            textDecoration:'none',fontSize:15,transition:'all 0.15s ease',
          }}>←</Link>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{
              width:28,height:28,borderRadius:8,flexShrink:0,
              background:'linear-gradient(135deg,#ff33bc,#8061ff)',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <span style={{color:'#fff',fontWeight:900,fontSize:13}}>N</span>
            </div>
            {!isMobile && (
              <span style={{fontWeight:700,fontSize:15,color:'#0a0612',letterSpacing:'-0.02em'}}>Portfolio Studio</span>
            )}
          </div>
          <span style={{
            background:'rgba(128,97,255,0.10)',border:'1px solid rgba(128,97,255,0.20)',
            borderRadius:100,padding:'3px 10px',fontSize:11,fontWeight:700,color:'#8061ff',
          }}>Upgrade</span>
        </div>

        {/* Centre – device switcher (desktop only, hidden on inbox) */}
        {isDesktop && tab !== 'inbox' && (
          <div style={{
            display:'flex',background:'rgba(10,6,18,0.05)',borderRadius:8,padding:3,
          }}>
            {['Desktop','Tablet','Mobile'].map(d=>(
              <button key={d} onClick={()=>setDevice(d)} style={{
                padding:'6px 14px',borderRadius:6,border:'none',cursor:'pointer',
                background:device===d?'#fff':'transparent',
                color:device===d?'#0a0612':'rgba(10,6,18,0.45)',
                fontSize:13,fontWeight:device===d?700:500,
                fontFamily:"'Rubik',sans-serif",
                boxShadow:device===d?'0 1px 4px rgba(10,6,18,0.10)':'none',
                transition:'all 0.15s ease',
              }}>{d}</button>
            ))}
          </div>
        )}

        {/* Right */}
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {isMobile && (
            <button onClick={()=>setShowPreview(p=>!p)} style={{
              padding:'8px 14px',borderRadius:8,border:'1.5px solid rgba(128,97,255,0.28)',
              background:'#fff',color:'#8061ff',fontSize:13,fontWeight:700,
              cursor:'pointer',fontFamily:"'Rubik',sans-serif",
            }}>{showPreview?'← Edit':'Preview'}</button>
          )}
          <Link href="/profile/demo" target="_blank" style={{
            padding:'8px 16px',borderRadius:8,border:'none',
            background:'#C8F135',color:'#0a0612',fontSize:13,fontWeight:700,
            textDecoration:'none',display:'flex',alignItems:'center',gap:6,
            transition:'all 0.18s ease',
          }}>Preview ↗</Link>
          <button onClick={()=>{navigator.clipboard.writeText(`nexfluence.co/${profile.slug||'yourname'}`)}} style={{
            padding:'8px 14px',borderRadius:8,
            border:'1.5px solid rgba(10,6,18,0.12)',
            background:'#fff',color:'rgba(10,6,18,0.65)',fontSize:13,fontWeight:600,
            cursor:'pointer',fontFamily:"'Rubik',sans-serif",
            display:isMobile?'none':'flex',alignItems:'center',gap:6,
          }}>🔗 Copy link</button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>

        {/* ── SIDEBAR ── */}
        {(!isMobile || !showPreview) && (
          <div style={{
            width: isMobile?'100%':isDesktop?200:56,
            flexShrink:0,
            background:'#0a0612',
            display:'flex',flexDirection: isMobile?'row':'column',
            overflowX: isMobile?'auto':'visible',
            overflowY: isMobile?'visible':'auto',
            borderRight:'1px solid rgba(255,255,255,0.06)',
          }}>
            {NAV.map(n=>{
              const active=tab===n.id
              const unread = n.id==='inbox' ? DEMO_INBOX.filter(m=>!m.read).length : 0
              return (
                <button key={n.id} onClick={()=>setTab(n.id)} style={{
                  display:'flex',
                  flexDirection: isDesktop?'row':'column',
                  alignItems:'center',
                  justifyContent: isDesktop?'flex-start':'center',
                  gap: isDesktop?10:4,
                  padding: isDesktop?'12px 16px': isMobile?'12px 16px':'14px 8px',
                  border:'none',cursor:'pointer',
                  background: active?'rgba(128,97,255,0.18)':'transparent',
                  borderLeft: isDesktop?(active?'3px solid #8061ff':'3px solid transparent'):'none',
                  borderBottom: isMobile?(active?'3px solid #8061ff':'3px solid transparent'):'none',
                  transition:'all 0.15s ease',
                  flexShrink:0,
                  fontFamily:"'Rubik',sans-serif",
                  whiteSpace:'nowrap',
                  minWidth: isMobile?'auto':0,
                  position:'relative',
                }}>
                  <span style={{fontSize: isDesktop?17:20, position:'relative'}}>
                    {n.icon}
                    {unread>0&&!active&&(
                      <span style={{
                        position:'absolute',top:-4,right:-6,
                        width:16,height:16,borderRadius:'50%',
                        background:'#ff33bc',color:'#fff',
                        fontSize:9,fontWeight:900,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        lineHeight:1,border:'2px solid #0a0612',
                      }}>{unread}</span>
                    )}
                  </span>
                  {(isDesktop||isMobile) && (
                    <span style={{
                      fontSize: isMobile?11:13,fontWeight:active?700:500,
                      color:active?'#fff':'rgba(255,255,255,0.45)',
                      display:'flex',alignItems:'center',gap:6,
                    }}>
                      {n.label}
                      {isDesktop&&unread>0&&(
                        <span style={{
                          background:'#ff33bc',color:'#fff',borderRadius:100,
                          padding:'1px 6px',fontSize:9,fontWeight:900,lineHeight:1.4,
                        }}>{unread}</span>
                      )}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ── EDIT PANEL (all tabs except inbox) ── */}
        {(!isMobile || !showPreview) && !isMobile && tab !== 'inbox' && (
          <div style={{
            width:isDesktop?380:'100%',flexShrink:0,
            background:'#fff',overflowY:'auto',
            borderRight:'1px solid rgba(10,6,18,0.08)',
            padding:'28px 24px',
          }}>
            {tab==='header'       && <HeaderTab       profile={profile} setProfile={setProfile} />}
            {tab==='media'        && <MediaTab         profile={profile} setProfile={setProfile} />}
            {tab==='rates'        && <RatesTab         profile={profile} setProfile={setProfile} />}
            {tab==='cases'        && <CasesTab         profile={profile} setProfile={setProfile} />}
            {tab==='testimonials' && <TestimonialsTab  profile={profile} setProfile={setProfile} />}
            {tab==='links'        && <LinksTab         profile={profile} setProfile={setProfile} />}
            {tab==='design'       && <DesignTab        profile={profile} setProfile={setProfile} />}
          </div>
        )}

        {/* ── INBOX — full width, no preview ── */}
        {tab === 'inbox' && !isMobile && <InboxTab />}
        {tab === 'inbox' && isMobile && !showPreview && <InboxTab />}

        {/* Mobile edit panel (full width, non-inbox tabs) */}
        {isMobile && !showPreview && tab !== 'inbox' && (
          <div style={{flex:1,background:'#fff',overflowY:'auto',padding:'20px 16px'}}>
            {tab==='header'       && <HeaderTab       profile={profile} setProfile={setProfile} />}
            {tab==='media'        && <MediaTab         profile={profile} setProfile={setProfile} />}
            {tab==='rates'        && <RatesTab         profile={profile} setProfile={setProfile} />}
            {tab==='cases'        && <CasesTab         profile={profile} setProfile={setProfile} />}
            {tab==='testimonials' && <TestimonialsTab  profile={profile} setProfile={setProfile} />}
            {tab==='links'        && <LinksTab         profile={profile} setProfile={setProfile} />}
            {tab==='design'       && <DesignTab        profile={profile} setProfile={setProfile} />}
          </div>
        )}

        {/* ── PREVIEW PANEL — hidden on inbox ── */}
        {tab !== 'inbox' && (isDesktop || (isMobile && showPreview)) && (
          <LivePreview profile={profile} device={device} />
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        textarea { font-family: 'Rubik', sans-serif; }
        select { font-family: 'Rubik', sans-serif; }
        input::placeholder, textarea::placeholder { color: rgba(10,6,18,0.26); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(10,6,18,0.15); border-radius: 2px; }
      `}</style>
    </div>
  )
}