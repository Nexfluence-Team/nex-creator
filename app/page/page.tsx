'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

/* ─── Demo profile data ───────────────────────────────────────────── */
const CREATOR = {
  name:       'Sophie Thomas',
  username:   'sophiethomas',
  location:   '🇱🇻 Riga, Latvia',
  bio:        'Gold Coast UGC creator specialising in travel, lifestyle and product content that actually converts. I create scroll-stopping videos for brands who want content that feels real and drives results.',
  niches:     ['Beauty', 'Lifestyle', 'Travel', 'Wellness'],
  ctaText:    'Work With Me',
  stats: [
    { label: 'Followers',      value: '33.4K' },
    { label: 'Avg. Engagement', value: '4.8%' },
    { label: 'Happy Clients',  value: '80+' },
    { label: 'Avg. Views',     value: '23.1K' },
  ],
  brands: ['Nike','Glossier','Dyson','Rhode','Alo Yoga','Skims','NARS','Replenish'],
  videos: [
    { id:'1', title:'Skincare Routine',    cat:'Product Demo',        platform:'instagram', views:'23.1K', emoji:'🧴' },
    { id:'2', title:'Morning Routine',     cat:'Lifestyle',           platform:'tiktok',    views:'45.2K', emoji:'☀️' },
    { id:'3', title:'Beauty Haul',         cat:'Testimonial Story',   platform:'instagram', views:'18.7K', emoji:'💄' },
    { id:'4', title:'Bali Travel Vlog',    cat:'Travel',              platform:'youtube',   views:'67.4K', emoji:'✈️' },
    { id:'5', title:'Home Scent Review',   cat:'Product Demo',        platform:'tiktok',    views:'12.3K', emoji:'🕯️' },
    { id:'6', title:'Wellness Reset',      cat:'Lifestyle',           platform:'instagram', views:'31.0K', emoji:'🧘' },
  ],
  rates: [
    {
      id: '1', title: 'UGC Video — Single',
      price: '€350', turnaround: '5 business days',
      description: 'One high-quality, scroll-stopping UGC video tailored to your brand.',
      includes: ['60s raw + edited video','2 revision rounds','Usage rights included','Script & concept ideation'],
    },
    {
      id: '2', title: 'UGC Bundle — 3 Videos',
      price: '€900', turnaround: '10 business days',
      description: 'Best value. Three videos across different formats for maximum versatility.',
      includes: ['3 × 60s raw + edited videos','Hook variations per video','3 revision rounds','Full usage rights','Content calendar suggestions'],
    },
    {
      id: '3', title: 'Monthly Retainer',
      price: 'From €2,500/mo', turnaround: 'Ongoing',
      description: 'Dedicated monthly content partnership. Ideal for brands scaling their UGC strategy.',
      includes: ['8–12 videos per month','Priority turnaround','Weekly content calls','Unlimited revisions','Exclusivity options available'],
    },
  ],
  cases: [
    {
      id:'1', brand:'Replenish Labs', period:'30-day campaign',
      description:'Created a 3-video testimonial series for their collagen supplement launch. Content ran as paid ads across Meta and drove a 34% lower CPM than their in-house creative.',
      metrics:[{label:'Avg. Views',value:'23.1K'},{label:'Reach',value:'8.5K'},{label:'CTR',value:'4.2%'}],
    },
    {
      id:'2', brand:'Glossier', period:'2-month campaign',
      description:'Developed lifestyle UGC for the Futuredew oil launch across Instagram and TikTok. The TikTok video hit 67K organic views within 48 hours and was used in their paid rotation for 6 weeks.',
      metrics:[{label:'Views',value:'67.4K'},{label:'Saves',value:'3.2K'},{label:'Shares',value:'1.1K'}],
    },
  ],
  testimonials: [
    { id:'1', name:'Kacey Williams',  role:'Founder',    company:'Replenish Labs', rating:5, quote:'Sophie is an incredible talent. She created amazing clips that felt authentic, fresh, and exactly on-brand. We\'ve now put her on a monthly retainer and the results speak for themselves.' },
    { id:'2', name:'Priya Mehta',     role:'CMO',        company:'Glossier EU',    rating:5, quote:'Working with Sophie was seamless from brief to delivery. She understood the product immediately and the content she made outperformed all our other creators that quarter.' },
    { id:'3', name:'Marc Delacroix',  role:'Founder',    company:'Aesop Collective',rating:5,quote:'The attention to detail, the aesthetic, the storytelling — all world class. Sophie elevated our brand through content alone.' },
    { id:'4', name:'Zoe Campbell',    role:'Head of Digital','company':'Alo Yoga EU',rating:5,quote:'Fast, professional, creative. Sophie delivered ahead of schedule and the content has been running as a top-performing ad for 3 months now.' },
  ],
  links: { instagram:'instagram.com/sophiethomas',tiktok:'tiktok.com/@sophiethomas',youtube:'youtube.com/@sophiethomas' },
}

const CATS = ['All', 'Product Demo', 'Lifestyle', 'Testimonial Story', 'Travel']
const MSG_KEY = `nex_msg_${CREATOR.username}`

const platColor: Record<string,string> = { instagram:'#e1306c',tiktok:'#0a0612',youtube:'#ff0000' }
const platIcon:  Record<string,string> = { instagram:'📸',tiktok:'🎵',youtube:'▶️' }

/* ─── Breakpoint ──────────────────────────────────────────────────── */
function useBreakpoint() {
  const [w,setW] = useState(0)
  useEffect(()=>{ const u=()=>setW(window.innerWidth); u(); window.addEventListener('resize',u); return ()=>window.removeEventListener('resize',u) },[])
  return { isMobile:w>0&&w<640, isTablet:w>=640&&w<1024, w }
}

/* ─── Scroll position ────────────────────────────────────────────── */
function useScrolled(offset=80) {
  const [scrolled,setScrolled] = useState(false)
  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>offset)
    window.addEventListener('scroll',h); return ()=>window.removeEventListener('scroll',h)
  },[offset])
  return scrolled
}

/* ─── Local-storage message guard ────────────────────────────────── */
function useMessageGuard() {
  const [sent,setSent] = useState(false)
  useEffect(()=>{ try{ setSent(!!localStorage.getItem(MSG_KEY)) }catch{} },[])
  const mark = () => { try{ localStorage.setItem(MSG_KEY,Date.now().toString()) }catch{}; setSent(true) }
  return { sent, mark }
}

/* ─── Small shared styles ────────────────────────────────────────── */
const inp = (f:boolean):React.CSSProperties => ({
  display:'block', width:'100%', padding:'12px 14px',
  background:'#fff', border:`1.5px solid ${f?'rgba(128,97,255,0.65)':'rgba(10,6,18,0.14)'}`,
  borderRadius:9, color:'#0a0612', fontSize:14, outline:'none',
  fontFamily:"'Rubik',sans-serif",
  boxShadow:f?'0 0 0 3px rgba(128,97,255,0.10)':'none',
  transition:'all 0.18s ease',
})
const lbl:React.CSSProperties = {
  display:'block',color:'rgba(10,6,18,0.42)',fontSize:11,fontWeight:500,
  letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:6,
}

function FInput({ value,onChange,placeholder,type='text',multiline=false,rows=3,required }: {
  value:string; onChange:(v:string)=>void; placeholder?:string
  type?:string; multiline?:boolean; rows?:number; required?:boolean
}) {
  const [f,setF]=useState(false)
  if (multiline) return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      rows={rows} required={required} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{...inp(f),resize:'vertical',lineHeight:1.65}} />
  )
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} required={required} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={inp(f)} />
}

/* ─── Modal wrapper ──────────────────────────────────────────────── */
function Modal({ onClose, children, wide }: { onClose:()=>void; children:React.ReactNode; wide?:boolean }) {
  useEffect(()=>{ document.body.style.overflow='hidden'; return ()=>{ document.body.style.overflow='' } },[])
  return (
    <div style={{
      position:'fixed',inset:0,zIndex:500,
      background:'rgba(10,6,18,0.60)',backdropFilter:'blur(6px)',
      display:'flex',alignItems:'flex-end',justifyContent:'center',
      padding:'0',
    }} onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div style={{
        background:'#fff',borderRadius:'20px 20px 0 0',
        width:'100%',maxWidth:wide?640:520,
        maxHeight:'92vh',overflowY:'auto',
        boxShadow:'0 -16px 64px rgba(10,6,18,0.20)',
        animation:'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title:string; onClose:()=>void }) {
  return (
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'20px 24px',borderBottom:'1px solid rgba(10,6,18,0.07)',
      position:'sticky',top:0,background:'#fff',zIndex:1,
    }}>
      <h3 style={{margin:0,fontWeight:800,fontSize:17,color:'#0a0612',letterSpacing:'-0.02em'}}>{title}</h3>
      <button onClick={onClose} style={{
        width:32,height:32,borderRadius:'50%',border:'none',
        background:'rgba(10,6,18,0.07)',cursor:'pointer',fontSize:15,
        color:'rgba(10,6,18,0.45)',display:'flex',alignItems:'center',justifyContent:'center',
      }}>✕</button>
    </div>
  )
}

/* ─── MESSAGE MODAL ──────────────────────────────────────────────── */
function MessageModal({ onClose, onSent, alreadySent }: {
  onClose:()=>void; onSent:()=>void; alreadySent:boolean
}) {
  const [form,setForm] = useState({ name:'',company:'',email:'',message:'' })
  const [sent,setSent] = useState(false)
  const [loading,setLoading] = useState(false)
  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}))
  const ok  = form.name && form.email && form.message

  const submit = () => {
    if (!ok) return
    setLoading(true)
    setTimeout(()=>{ setLoading(false); setSent(true); onSent() },900)
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Send a message" onClose={onClose} />
      <div style={{padding:'24px'}}>
        {alreadySent || sent ? (
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <p style={{fontSize:40,marginBottom:16}}>✅</p>
            <h3 style={{fontWeight:800,fontSize:20,color:'#0a0612',marginBottom:8,letterSpacing:'-0.02em'}}>Message sent!</h3>
            <p style={{color:'rgba(10,6,18,0.50)',fontSize:14,lineHeight:1.7,maxWidth:320,margin:'0 auto 24px'}}>
              {CREATOR.name} will be in touch via your email address. Please allow up to 48 hours for a response.
            </p>
            <p style={{
              background:'rgba(128,97,255,0.07)',border:'1px solid rgba(128,97,255,0.18)',
              borderRadius:10,padding:'12px 16px',fontSize:13,
              color:'rgba(10,6,18,0.50)',lineHeight:1.6,
            }}>
              💡 To keep things organised, each person can send one message. Continue your conversation by email once {CREATOR.name.split(' ')[0]} replies.
            </p>
            <button onClick={onClose} style={{
              marginTop:20,padding:'12px 28px',borderRadius:10,border:'none',
              background:'#C8F135',color:'#0a0612',fontSize:14,fontWeight:700,
              cursor:'pointer',fontFamily:"'Rubik',sans-serif",
            }}>Done</button>
          </div>
        ) : (
          <>
            <p style={{color:'rgba(10,6,18,0.48)',fontSize:13,lineHeight:1.6,marginBottom:20}}>
              Introduce yourself and tell {CREATOR.name.split(' ')[0]} what you have in mind. Include your email so she can reply directly.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:20}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={lbl}>Your name *</label><FInput value={form.name} onChange={v=>set('name',v)} placeholder="Jane Smith" required /></div>
                <div><label style={lbl}>Company</label><FInput value={form.company} onChange={v=>set('company',v)} placeholder="Brand Co. (optional)" /></div>
              </div>
              <div><label style={lbl}>Email address *</label><FInput value={form.email} onChange={v=>set('email',v)} placeholder="jane@brand.com" type="email" required /></div>
              <div><label style={lbl}>Your message *</label><FInput value={form.message} onChange={v=>set('message',v)} placeholder={`Hi ${CREATOR.name.split(' ')[0]}, I'm reaching out because…`} multiline rows={4} required /></div>
            </div>
            <div style={{
              background:'rgba(128,97,255,0.05)',border:'1px solid rgba(128,97,255,0.14)',
              borderRadius:10,padding:'12px 14px',marginBottom:20,
            }}>
              <p style={{fontSize:12,color:'rgba(10,6,18,0.45)',lineHeight:1.6,margin:0}}>
                📌 You can send <strong style={{color:'#0a0612'}}>one message</strong>. Your email is required so {CREATOR.name.split(' ')[0]} can reply directly to you.
              </p>
            </div>
            <button onClick={submit} disabled={!ok||loading} style={{
              display:'block',width:'100%',padding:'14px',borderRadius:10,border:'none',
              background:ok?'linear-gradient(90deg,#ff33bc,#8061ff)':'rgba(128,97,255,0.15)',
              color:ok?'#fff':'rgba(10,6,18,0.35)',fontSize:15,fontWeight:700,
              cursor:ok?'pointer':'not-allowed',fontFamily:"'Rubik',sans-serif",
              transition:'all 0.2s ease',
            }}>{loading?'Sending…':'Send message →'}</button>
          </>
        )}
      </div>
    </Modal>
  )
}

/* ─── WORK WITH ME MODAL ─────────────────────────────────────────── */
function WorkWithMeModal({ onClose, onMessageOpen, alreadySent }: {
  onClose:()=>void; onMessageOpen:()=>void; alreadySent:boolean
}) {
  const [stage, setStage] = useState<'rates'|'form'|'success'>('rates')
  const [form,  setForm]  = useState({ name:'',company:'',email:'',budget:'',message:'' })
  const [loading,setLoading] = useState(false)
  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}))
  const ok  = form.name && form.email && form.message

  const submit = () => {
    if (!ok) return
    setLoading(true)
    setTimeout(()=>{ setLoading(false); setStage('success') },900)
  }

  const BUDGETS = ['Under €500','€500 – €1,000','€1,000 – €2,500','€2,500 – €5,000','€5,000+','Not sure yet']

  return (
    <Modal onClose={onClose} wide>
      {stage==='rates' && (
        <>
          <ModalHeader title="Work with Sophie" onClose={onClose} />
          <div style={{padding:'24px'}}>

            {/* ROI highlight */}
            <div style={{
              background:'linear-gradient(135deg,rgba(128,97,255,0.08),rgba(255,51,188,0.06))',
              border:'1px solid rgba(128,97,255,0.18)',borderRadius:14,
              padding:'18px 20px',marginBottom:24,
            }}>
              <p style={{fontWeight:800,fontSize:15,color:'#0a0612',marginBottom:10,letterSpacing:'-0.01em'}}>
                📈 Why brands choose Sophie
              </p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {[
                  {v:'4.8%',  l:'Avg. engagement rate'},
                  {v:'3–4×',  l:'Higher CTR vs brand creative'},
                  {v:'23.1K', l:'Average video views'},
                ].map(s=>(
                  <div key={s.l} style={{textAlign:'center'}}>
                    <p style={{fontWeight:900,fontSize:20,color:'#8061ff',letterSpacing:'-0.02em',marginBottom:2}}>{s.v}</p>
                    <p style={{fontSize:11,color:'rgba(10,6,18,0.45)',lineHeight:1.4}}>{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rates */}
            <p style={{fontWeight:700,fontSize:14,color:'#0a0612',marginBottom:12,letterSpacing:'-0.01em'}}>Packages</p>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
              {CREATOR.rates.map(r=>(
                <div key={r.id} style={{
                  border:'1.5px solid rgba(10,6,18,0.09)',borderRadius:12,padding:'16px',
                  background:'#fff',boxShadow:'0 2px 8px rgba(10,6,18,0.04)',
                }}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <p style={{fontWeight:800,fontSize:14,color:'#0a0612',letterSpacing:'-0.01em'}}>{r.title}</p>
                    <p style={{fontWeight:900,fontSize:16,color:'#8061ff'}}>{r.price}</p>
                  </div>
                  {r.turnaround && <p style={{fontSize:11,color:'rgba(10,6,18,0.40)',marginBottom:8}}>⏱ {r.turnaround}</p>}
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {r.includes.slice(0,3).map((inc,i)=>(
                      <span key={i} style={{
                        fontSize:11,padding:'3px 9px',borderRadius:100,
                        background:'rgba(128,97,255,0.07)',color:'rgba(10,6,18,0.60)',
                        border:'1px solid rgba(128,97,255,0.12)',
                      }}>✓ {inc}</span>
                    ))}
                    {r.includes.length>3&&<span style={{fontSize:11,color:'rgba(10,6,18,0.40)'}}>+{r.includes.length-3} more</span>}
                  </div>
                </div>
              ))}
            </div>

            <p style={{fontSize:12,color:'rgba(10,6,18,0.40)',textAlign:'center',marginBottom:16}}>
              Custom packages available · All prices exclude VAT
            </p>

            <button onClick={()=>setStage('form')} style={{
              display:'block',width:'100%',padding:'14px',borderRadius:10,border:'none',
              background:'linear-gradient(90deg,#ff33bc,#8061ff)',
              color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Rubik',sans-serif",
            }}>Send an inquiry →</button>
          </div>
        </>
      )}

      {stage==='form' && (
        <>
          <ModalHeader title="Send an inquiry" onClose={onClose} />
          <div style={{padding:'24px'}}>
            {alreadySent ? (
              <div style={{textAlign:'center',padding:'24px 0'}}>
                <p style={{fontSize:36,marginBottom:12}}>📬</p>
                <p style={{fontWeight:800,fontSize:18,color:'#0a0612',marginBottom:8}}>You've already reached out!</p>
                <p style={{color:'rgba(10,6,18,0.50)',fontSize:14,lineHeight:1.7}}>
                  Check your inbox for a reply from {CREATOR.name.split(' ')[0]}. She typically responds within 24–48 hours.
                </p>
                <button onClick={onClose} style={{
                  marginTop:20,padding:'12px 28px',borderRadius:10,border:'none',
                  background:'#C8F135',color:'#0a0612',fontSize:14,fontWeight:700,
                  cursor:'pointer',fontFamily:"'Rubik',sans-serif",
                }}>Got it</button>
              </div>
            ) : (
              <>
                <button onClick={()=>setStage('rates')} style={{
                  display:'flex',alignItems:'center',gap:6,background:'none',border:'none',
                  color:'rgba(10,6,18,0.40)',fontSize:13,cursor:'pointer',marginBottom:20,
                  fontFamily:"'Rubik',sans-serif",padding:0,
                }}>← Back to packages</button>

                <div style={{display:'flex',flexDirection:'column',gap:13,marginBottom:18}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div><label style={lbl}>Your name *</label><FInput value={form.name} onChange={v=>set('name',v)} placeholder="Jane Smith" /></div>
                    <div><label style={lbl}>Company *</label><FInput value={form.company} onChange={v=>set('company',v)} placeholder="Brand Co." /></div>
                  </div>
                  <div><label style={lbl}>Email address *</label><FInput value={form.email} onChange={v=>set('email',v)} placeholder="jane@brand.com" type="email" /></div>
                  <div>
                    <label style={lbl}>Budget range</label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                      {BUDGETS.map(b=>(
                        <button key={b} onClick={()=>set('budget',b)} style={{
                          padding:'7px 13px',borderRadius:100,cursor:'pointer',fontSize:12,fontWeight:600,
                          border:`1.5px solid ${form.budget===b?'rgba(128,97,255,0.55)':'rgba(10,6,18,0.12)'}`,
                          background:form.budget===b?'rgba(128,97,255,0.08)':'#fff',
                          color:form.budget===b?'#0a0612':'rgba(10,6,18,0.55)',
                          fontFamily:"'Rubik',sans-serif",transition:'all 0.15s ease',
                        }}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div><label style={lbl}>Tell me about your project *</label>
                    <FInput value={form.message} onChange={v=>set('message',v)}
                      placeholder="What product/service are you promoting? What's the goal? Any brief or references?" multiline rows={4} />
                  </div>
                </div>
                <div style={{
                  background:'rgba(128,97,255,0.05)',border:'1px solid rgba(128,97,255,0.14)',
                  borderRadius:10,padding:'11px 14px',marginBottom:18,
                }}>
                  <p style={{fontSize:12,color:'rgba(10,6,18,0.45)',lineHeight:1.6,margin:0}}>
                    📌 One inquiry per person. {CREATOR.name.split(' ')[0]} will reply to your email within 24–48 hours.
                  </p>
                </div>
                <button onClick={submit} disabled={!ok||loading} style={{
                  display:'block',width:'100%',padding:'14px',borderRadius:10,border:'none',
                  background:ok?'linear-gradient(90deg,#ff33bc,#8061ff)':'rgba(128,97,255,0.15)',
                  color:ok?'#fff':'rgba(10,6,18,0.35)',fontSize:15,fontWeight:700,
                  cursor:ok?'pointer':'not-allowed',fontFamily:"'Rubik',sans-serif",transition:'all 0.2s ease',
                }}>{loading?'Sending…':'Submit inquiry →'}</button>
              </>
            )}
          </div>
        </>
      )}

      {stage==='success' && (
        <>
          <ModalHeader title="Inquiry sent!" onClose={onClose} />
          <div style={{padding:'32px 24px',textAlign:'center'}}>
            <p style={{fontSize:48,marginBottom:16}}>🎉</p>
            <h3 style={{fontWeight:800,fontSize:20,color:'#0a0612',marginBottom:8,letterSpacing:'-0.02em'}}>You're in the inbox!</h3>
            <p style={{color:'rgba(10,6,18,0.50)',fontSize:14,lineHeight:1.7,maxWidth:340,margin:'0 auto 24px'}}>
              {CREATOR.name.split(' ')[0]} has received your inquiry and will reply to <strong style={{color:'#8061ff'}}>{form.email}</strong> within 24–48 hours.
            </p>
            <div style={{
              background:'rgba(128,97,255,0.06)',border:'1px solid rgba(128,97,255,0.16)',
              borderRadius:12,padding:'16px',marginBottom:24,textAlign:'left',
            }}>
              {[`📧 Check ${form.email} for her reply`,'⏱ Typical response: 24–48 hours','🤝 She\'ll send a proposal or ask follow-up questions'].map((t,i)=>(
                <p key={i} style={{fontSize:13,color:'rgba(10,6,18,0.60)',marginBottom:i<2?8:0,lineHeight:1.5}}>{t}</p>
              ))}
            </div>
            <button onClick={onClose} style={{
              padding:'12px 32px',borderRadius:10,border:'none',
              background:'#C8F135',color:'#0a0612',fontSize:14,fontWeight:700,
              cursor:'pointer',fontFamily:"'Rubik',sans-serif",
            }}>Close</button>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ─── MAIN PROFILE PAGE ──────────────────────────────────────────── */
export default function ProfilePage() {
  const { isMobile, isTablet } = useBreakpoint()
  const scrolled = useScrolled(240)
  const { sent: alreadySent, mark: markSent } = useMessageGuard()
  const [activeModal, setActiveModal] = useState<'message'|'workwithme'|null>(null)
  const [vidCat, setVidCat] = useState('All')

  const openMessage    = () => setActiveModal('message')
  const openWorkWithMe = () => setActiveModal('workwithme')
  const closeModal     = () => setActiveModal(null)
  const handleSent     = () => { markSent(); closeModal() }

  const filtered = vidCat==='All' ? CREATOR.videos : CREATOR.videos.filter(v=>v.cat===vidCat)

  return (
    <div style={{background:'#ffffff',minHeight:'100vh',fontFamily:"'Rubik',sans-serif",color:'#0a0612'}}>

      {/* ── STICKY NAV ── */}
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        background: scrolled?'rgba(255,255,255,0.95)':'transparent',
        backdropFilter: scrolled?'blur(12px)':'none',
        borderBottom: scrolled?'1px solid rgba(10,6,18,0.08)':'none',
        padding: isMobile?'12px 16px':'14px 32px',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        transition:'all 0.3s ease',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{
            width:32,height:32,borderRadius:9,flexShrink:0,
            background:'linear-gradient(135deg,#ff33bc,#8061ff)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 3px 10px rgba(128,97,255,0.30)',
          }}>
            <span style={{color:'#fff',fontWeight:900,fontSize:14}}>N</span>
          </div>
          {scrolled && !isMobile && (
            <span style={{fontWeight:700,fontSize:15,color:'#0a0612',letterSpacing:'-0.02em'}}>
              {CREATOR.name}
            </span>
          )}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={openMessage} style={{
            padding: isMobile?'8px 14px':'9px 18px',
            borderRadius:100,border:'1.5px solid rgba(10,6,18,0.18)',
            background:'#fff',color:'#0a0612',fontSize: isMobile?12:13,fontWeight:700,
            cursor:'pointer',fontFamily:"'Rubik',sans-serif",
            transition:'all 0.18s ease',
          }}>
            {alreadySent ? '✓ Message sent' : 'Send a message'}
          </button>
          <button onClick={openWorkWithMe} style={{
            padding: isMobile?'8px 14px':'9px 18px',
            borderRadius:100,border:'none',
            background:'linear-gradient(90deg,#ff33bc,#8061ff)',
            color:'#fff',fontSize: isMobile?12:13,fontWeight:700,
            cursor:'pointer',fontFamily:"'Rubik',sans-serif",
            boxShadow:'0 4px 16px rgba(128,97,255,0.30)',
            transition:'all 0.18s ease',
          }}>{CREATOR.ctaText} →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        padding: isMobile?'100px 20px 60px':'120px 24px 80px',
        textAlign:'center',
        background:'linear-gradient(180deg,#f7f5ff 0%,#ffffff 100%)',
        borderBottom:'1px solid rgba(10,6,18,0.06)',
        position:'relative',overflow:'hidden',
      }}>
        {/* bg decoration */}
        <div aria-hidden style={{
          position:'absolute',top:0,left:0,right:0,bottom:0,pointerEvents:'none',
          background:'radial-gradient(ellipse 60% 50% at 50% 0%,rgba(128,97,255,0.10) 0%,transparent 60%)',
        }}/>

        {/* Avatar */}
        <div style={{
          width: isMobile?88:110, height: isMobile?88:110,
          borderRadius:'50%', margin:'0 auto 20px',
          background:'linear-gradient(135deg,rgba(255,51,188,0.20),rgba(128,97,255,0.20))',
          border:'3px solid rgba(128,97,255,0.25)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize: isMobile?40:52, position:'relative',
        }}>
          👩‍💻
          <div style={{
            position:'absolute',bottom:2,right:2,
            width:20,height:20,borderRadius:'50%',
            background:'#22c55e',border:'3px solid #fff',
          }}/>
        </div>

        {/* Name */}
        <h1 style={{
          fontWeight:900,fontSize: isMobile?28:40,
          letterSpacing:'-0.035em',lineHeight:1.1,
          color:'#0a0612',marginBottom:6,
        }}>{CREATOR.name}</h1>
        <p style={{color:'rgba(10,6,18,0.45)',fontSize: isMobile?13:15,marginBottom:14}}>
          {CREATOR.location}
        </p>
        <p style={{
          color:'rgba(10,6,18,0.62)',fontSize: isMobile?14:16,
          lineHeight:1.75,maxWidth:520,margin:'0 auto 20px',
        }}>{CREATOR.bio}</p>

        {/* Niches */}
        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:8,marginBottom:28}}>
          {CREATOR.niches.map(n=>(
            <span key={n} style={{
              padding:'6px 14px',borderRadius:100,fontSize:13,fontWeight:600,
              background:'rgba(128,97,255,0.08)',color:'#8061ff',
              border:'1px solid rgba(128,97,255,0.20)',
            }}>{n}</span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={openWorkWithMe} style={{
            padding:'13px 28px',borderRadius:100,border:'none',
            background:'linear-gradient(90deg,#ff33bc,#8061ff)',
            color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',
            fontFamily:"'Rubik',sans-serif",
            boxShadow:'0 8px 24px rgba(128,97,255,0.35)',
            transition:'all 0.2s ease',
          }}>{CREATOR.ctaText} →</button>
          <button onClick={openMessage} style={{
            padding:'13px 28px',borderRadius:100,
            border:'1.5px solid rgba(10,6,18,0.15)',
            background:'#fff',color:'#0a0612',fontSize:15,fontWeight:700,cursor:'pointer',
            fontFamily:"'Rubik',sans-serif",transition:'all 0.2s ease',
          }}>{alreadySent?'✓ Message sent':'Send a message'}</button>
        </div>
      </section>

      {/* ── BRAND TICKER ── */}
      <div style={{
        borderBottom:'1px solid rgba(10,6,18,0.07)',
        padding:'18px 0',overflow:'hidden',background:'#fff',
      }}>
        <div style={{
          display:'flex',gap:48,width:'max-content',
          animation:'marquee 22s linear infinite',
        }}>
          {[...CREATOR.brands,...CREATOR.brands].map((b,i)=>(
            <span key={i} style={{
              fontWeight:800,fontSize:15,color:'rgba(10,6,18,0.20)',
              letterSpacing:'-0.01em',whiteSpace:'nowrap',
              transition:'color 0.2s ease',cursor:'default',
            }}>{b}</span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{
        padding: isMobile?'32px 20px':'40px 24px',
        background:'#f7f5ff',borderBottom:'1px solid rgba(10,6,18,0.07)',
      }}>
        <div style={{
          maxWidth:700,margin:'0 auto',
          display:'grid',gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:16,
        }}>
          {CREATOR.stats.map(s=>(
            <div key={s.label} style={{textAlign:'center'}}>
              <p style={{fontWeight:900,fontSize: isMobile?24:32,color:'#0a0612',letterSpacing:'-0.03em',marginBottom:4}}>
                {s.value}
              </p>
              <p style={{fontSize:13,color:'rgba(10,6,18,0.45)',fontWeight:500}}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VIDEOS ── */}
      <section style={{padding: isMobile?'48px 20px':'64px 24px',maxWidth:1040,margin:'0 auto'}}>
        <p style={{fontSize:11,fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#ff7ac3',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
          <span style={{display:'inline-block',width:20,height:1,background:'#ff7ac3'}}/>Videos I've created
        </p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
          <h2 style={{fontWeight:900,fontSize: isMobile?22:28,letterSpacing:'-0.03em',color:'#0a0612',margin:0}}>My Work</h2>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setVidCat(c)} style={{
                padding:'7px 14px',borderRadius:100,fontSize:12,fontWeight:600,cursor:'pointer',
                border:`1.5px solid ${vidCat===c?'rgba(128,97,255,0.50)':'rgba(10,6,18,0.12)'}`,
                background:vidCat===c?'rgba(128,97,255,0.08)':'#fff',
                color:vidCat===c?'#8061ff':'rgba(10,6,18,0.55)',
                fontFamily:"'Rubik',sans-serif",transition:'all 0.15s ease',
              }}>{c}</button>
            ))}
          </div>
        </div>
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(3,1fr)',
          gap: isMobile?10:16,
        }}>
          {filtered.map(v=>(
            <div key={v.id} style={{
              borderRadius:16,overflow:'hidden',
              border:'1.5px solid rgba(10,6,18,0.08)',
              background:'#fff',cursor:'pointer',
              boxShadow:'0 2px 12px rgba(10,6,18,0.06)',
              transition:'all 0.2s ease',
            }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 32px rgba(10,6,18,0.12)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 12px rgba(10,6,18,0.06)'}}
            >
              <div style={{
                aspectRatio:'9/14',
                background:`linear-gradient(160deg,rgba(128,97,255,0.12),rgba(255,51,188,0.12))`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize: isMobile?32:40, position:'relative',
              }}>
                {v.emoji}
                <div style={{
                  position:'absolute',top:8,left:8,
                  background:platColor[v.platform]??'#0a0612',
                  color:'#fff',fontSize:9,fontWeight:700,
                  padding:'3px 7px',borderRadius:100,letterSpacing:'0.04em',textTransform:'uppercase',
                }}>{platIcon[v.platform]} {v.platform}</div>
                {v.views && (
                  <div style={{
                    position:'absolute',bottom:8,right:8,
                    background:'rgba(10,6,18,0.70)',color:'#fff',
                    fontSize:10,fontWeight:700,padding:'3px 7px',borderRadius:100,
                  }}>▶ {v.views}</div>
                )}
              </div>
              <div style={{padding: isMobile?'10px':'12px 14px'}}>
                <p style={{fontWeight:700,fontSize: isMobile?12:13,color:'#0a0612',marginBottom:3}}>{v.title}</p>
                <p style={{fontSize:11,color:'rgba(10,6,18,0.40)'}}>{v.cat}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CASE STUDIES ── */}
      <section style={{padding: isMobile?'48px 20px':'64px 24px',background:'#f7f5ff',borderTop:'1px solid rgba(10,6,18,0.07)'}}>
        <div style={{maxWidth:840,margin:'0 auto'}}>
          <p style={{fontSize:11,fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#ff7ac3',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
            <span style={{display:'inline-block',width:20,height:1,background:'#ff7ac3'}}/>Portfolio
          </p>
          <h2 style={{fontWeight:900,fontSize: isMobile?22:28,letterSpacing:'-0.03em',color:'#0a0612',marginBottom:28}}>Case Studies</h2>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {CREATOR.cases.map(c=>(
              <div key={c.id} style={{
                background:'#fff',borderRadius:16,padding: isMobile?'20px':'24px',
                border:'1.5px solid rgba(10,6,18,0.08)',
                boxShadow:'0 2px 12px rgba(10,6,18,0.05)',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
                  <div style={{
                    width:44,height:44,borderRadius:12,flexShrink:0,
                    background:'linear-gradient(135deg,rgba(128,97,255,0.15),rgba(255,51,188,0.15))',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontWeight:900,fontSize:18,color:'#8061ff',
                  }}>{c.brand[0]}</div>
                  <div>
                    <p style={{fontWeight:800,fontSize:15,color:'#0a0612',marginBottom:2}}>{c.brand}</p>
                    <p style={{fontSize:12,color:'rgba(10,6,18,0.40)'}}>{c.period}</p>
                  </div>
                </div>
                <p style={{fontSize:14,color:'rgba(10,6,18,0.65)',lineHeight:1.75,marginBottom:16}}>{c.description}</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                  {c.metrics.map((m,i)=>(
                    <div key={i} style={{
                      background:'rgba(128,97,255,0.06)',borderRadius:10,padding:'12px',
                      border:'1px solid rgba(128,97,255,0.12)',textAlign:'center',
                    }}>
                      <p style={{fontWeight:900,fontSize:18,color:'#0a0612',marginBottom:2}}>{m.value}</p>
                      <p style={{fontSize:11,color:'rgba(10,6,18,0.45)'}}>{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{padding: isMobile?'48px 20px':'64px 24px',maxWidth:1040,margin:'0 auto'}}>
        <p style={{fontSize:11,fontWeight:500,letterSpacing:'0.14em',textTransform:'uppercase',color:'#ff7ac3',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
          <span style={{display:'inline-block',width:20,height:1,background:'#ff7ac3'}}/>Testimonials
        </p>
        <h2 style={{fontWeight:900,fontSize: isMobile?22:28,letterSpacing:'-0.03em',color:'#0a0612',marginBottom:28}}>Client Love</h2>
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile?'1fr':isTablet?'1fr 1fr':'repeat(2,1fr)',
          gap:16,
        }}>
          {CREATOR.testimonials.map(t=>(
            <div key={t.id} style={{
              background:'#fff',borderRadius:16,padding:'24px',
              border:'1.5px solid rgba(10,6,18,0.08)',
              boxShadow:'0 2px 12px rgba(10,6,18,0.05)',
            }}>
              <div style={{display:'flex',gap:2,marginBottom:12}}>
                {[...Array(5)].map((_,i)=>(
                  <span key={i} style={{fontSize:14,color:i<t.rating?'#ff33bc':'rgba(10,6,18,0.15)'}}>★</span>
                ))}
              </div>
              <p style={{fontSize:14,color:'rgba(10,6,18,0.72)',lineHeight:1.8,fontStyle:'italic',marginBottom:16}}>
                "{t.quote}"
              </p>
              <div style={{display:'flex',alignItems:'center',gap:10,borderTop:'1px solid rgba(10,6,18,0.06)',paddingTop:14}}>
                <div style={{
                  width:36,height:36,borderRadius:'50%',flexShrink:0,
                  background:'linear-gradient(135deg,#ff33bc,#8061ff)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontWeight:800,fontSize:14,color:'#fff',
                }}>{t.name[0]}</div>
                <div>
                  <p style={{fontWeight:700,fontSize:13,color:'#0a0612',marginBottom:1}}>{t.name}</p>
                  <p style={{fontSize:12,color:'rgba(10,6,18,0.40)'}}>{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA BAND ── */}
      <section style={{
        background:'#0a0612',padding: isMobile?'56px 20px':'72px 24px',
        textAlign:'center',position:'relative',overflow:'hidden',
      }}>
        <div aria-hidden style={{
          position:'absolute',inset:0,pointerEvents:'none',
          background:'radial-gradient(ellipse 60% 60% at 50% 50%,rgba(128,97,255,0.18) 0%,transparent 65%)',
        }}/>
        <div style={{position:'relative',zIndex:1,maxWidth:440,margin:'0 auto'}}>
          <h2 style={{fontWeight:900,fontSize: isMobile?24:32,color:'#fff',letterSpacing:'-0.03em',marginBottom:10,lineHeight:1.15}}>
            Ready to create something great?
          </h2>
          <p style={{color:'rgba(255,255,255,0.45)',fontSize:15,lineHeight:1.7,marginBottom:28}}>
            Let's talk about your campaign. One message is all it takes.
          </p>
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={openWorkWithMe} style={{
              padding:'13px 28px',borderRadius:100,border:'none',
              background:'linear-gradient(90deg,#ff33bc,#8061ff)',
              color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',
              fontFamily:"'Rubik',sans-serif",boxShadow:'0 8px 24px rgba(128,97,255,0.40)',
            }}>{CREATOR.ctaText} →</button>
            <button onClick={openMessage} style={{
              padding:'13px 28px',borderRadius:100,
              border:'1.5px solid rgba(255,255,255,0.20)',
              background:'transparent',color:'rgba(255,255,255,0.80)',
              fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Rubik',sans-serif",
            }}>{alreadySent?'✓ Message sent':'Send a message'}</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background:'#0a0612',borderTop:'1px solid rgba(255,255,255,0.07)',
        padding: isMobile?'28px 20px':'32px 40px',
        display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{
            width:28,height:28,borderRadius:8,
            background:'linear-gradient(135deg,#ff33bc,#8061ff)',
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            <span style={{color:'#fff',fontWeight:900,fontSize:12}}>N</span>
          </div>
          <div>
            <p style={{color:'rgba(255,255,255,0.25)',fontSize:12}}>Portfolio powered by</p>
            <p style={{color:'rgba(255,255,255,0.60)',fontWeight:700,fontSize:13}}>Nexfluence</p>
          </div>
        </div>
        <div style={{display:'flex',gap:16}}>
          {Object.entries(CREATOR.links).map(([k,v])=>v&&(
            <a key={k} href={`https://${v}`} target="_blank" rel="noopener noreferrer" style={{
              color:'rgba(255,255,255,0.40)',fontSize:12,fontWeight:500,textDecoration:'none',
              transition:'color 0.18s ease',
            }}
              onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.80)')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.40)')}
            >{k.charAt(0).toUpperCase()+k.slice(1)}</a>
          ))}
        </div>
      </footer>

      {/* ── MOBILE STICKY CTA BAR ── */}
      {isMobile && (
        <div style={{
          position:'fixed',bottom:0,left:0,right:0,zIndex:90,
          background:'rgba(255,255,255,0.96)',backdropFilter:'blur(12px)',
          borderTop:'1px solid rgba(10,6,18,0.08)',
          padding:'12px 16px',display:'flex',gap:10,
        }}>
          <button onClick={openMessage} style={{
            flex:1,padding:'12px',borderRadius:10,
            border:'1.5px solid rgba(10,6,18,0.14)',
            background:'#fff',color:'#0a0612',fontSize:13,fontWeight:700,
            cursor:'pointer',fontFamily:"'Rubik',sans-serif",
          }}>{alreadySent?'✓ Sent':'Message'}</button>
          <button onClick={openWorkWithMe} style={{
            flex:2,padding:'12px',borderRadius:10,border:'none',
            background:'linear-gradient(90deg,#ff33bc,#8061ff)',
            color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
            fontFamily:"'Rubik',sans-serif",
          }}>{CREATOR.ctaText} →</button>
        </div>
      )}

      {/* ── MODALS ── */}
      {activeModal==='message' && (
        <MessageModal onClose={closeModal} onSent={handleSent} alreadySent={alreadySent} />
      )}
      {activeModal==='workwithme' && (
        <WorkWithMeModal onClose={closeModal} onMessageOpen={openMessage} alreadySent={alreadySent} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:translateY(0) } }
        input::placeholder, textarea::placeholder { color: rgba(10,6,18,0.26); }
        textarea { font-family: 'Rubik', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(10,6,18,0.15); border-radius:2px; }
        ${isMobile ? 'body { padding-bottom: 72px; }' : ''}
      `}</style>
    </div>
  )
}