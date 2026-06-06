
'use client'
import { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react'
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
  shadowLg:   '0 20px 60px rgba(139,49,232,0.18)',
  font:       "'Rubik', sans-serif",
}

/* ─── Icons (SVG, accept style and other props) ─────────────────────── */
const Icon = ({ children, size = 20, ...props }: { children: React.ReactNode; size?: number; [key: string]: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    {children}
  </svg>
)

function ProfileIcon({ size = 20, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M5 20v-2a7 7 0 0 1 14 0v2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </Icon>
  )
}
function VideoIcon({ size = 20, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <rect x="2" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="m22 8-4 4 4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}
function PriceIcon({ size = 20, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </Icon>
  )
}
function CaseIcon({ size = 20, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </Icon>
  )
}
function TestimonialIcon({ size = 20, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}
function LinkIcon({ size = 20, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}
function DesignIcon({ size = 20, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="2.18" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="8" y1="2" x2="8" y2="22" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="16" y1="2" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1.5"/>
    </Icon>
  )
}
function InboxIcon({ size = 20, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M22 12h-4l-3 3-3-3H2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}
function CameraIcon({ size = 20, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="18" y1="8" x2="18" y2="8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </Icon>
  )
}
function CheckIcon({ size = 16, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}
function PlusIcon({ size = 16, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </Icon>
  )
}
function EditIcon({ size = 16, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M17 3l4 4-7 7H10v-4l7-7z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 21h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </Icon>
  )
}
function DeleteIcon({ size = 16, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </Icon>
  )
}
function ArrowLeftIcon({ size = 16, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="12 19 5 12 12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </Icon>
  )
}
function ArrowRightIcon({ size = 14, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="12 5 19 12 12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </Icon>
  )
}
function ChevronDownIcon({ size = 16, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}
function StarIcon({ size = 16, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <polygon points="12 17.27 18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21 12 17.27" stroke="none"/>
    </Icon>
  )
}
function ExternalIcon({ size = 14, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </Icon>
  )
}
function MailIcon({ size = 16, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <polyline points="2,6 12,13 22,6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}
function InstagramIcon({ size = 18, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
    </Icon>
  )
}
function TikTokIcon({ size = 18, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </Icon>
  )
}
function YouTubeIcon({ size = 18, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none"/>
    </Icon>
  )
}
function LinkedInIcon({ size = 18, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </Icon>
  )
}
function PinterestIcon({ size = 18, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M8 20l4-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 4a7 7 0 0 0-7 7c0 3 1.5 5 4 6.5 0-1.5-.5-3 .5-4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </Icon>
  )
}
function XIcon({ size = 18, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </Icon>
  )
}
function WebsiteIcon({ size = 18, ...props }: { size?: number; [key: string]: any }) {
  return (
    <Icon size={size} {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </Icon>
  )
}
function EmailIcon({ size = 18, ...props }: { size?: number; [key: string]: any }) {
  return <MailIcon size={size} {...props} />
}

/* ─── Helper functions ──────────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return `${Math.floor(s / 604800)}w ago`
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
}

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

interface Video  { id: string; title: string; url: string; platform: string; category: string; views: string }
interface Photo  { id: string; url: string }
interface Rate   { id: string; title: string; price: string; turnaround: string; description: string; includes: string[] }
interface Case   { id: string; brand: string; description: string; period: string; metrics: { label: string; value: string }[] }
interface Testi  { id: string; name: string; role: string; company: string; quote: string; rating: number }
interface InboxMsg {
  id: string; type: 'message' | 'inquiry'; read: boolean
  name: string; company: string; email: string
  message: string; budget?: string; receivedAt: string
}
interface Profile {
  name: string; bio: string; location: string; profilePic: string | null
  ctaText: string; niches: string[]; slug: string
  videos: Video[]; photos: Photo[]; rates: Rate[]; cases: Case[]; testimonials: Testi[]
  links: Record<string, string>
  theme: string; primaryColor: string; accentColor: string; font: string
}

type SetProfile = Dispatch<SetStateAction<Profile>>

/* ─── Constants ───────────────────────────────────────────────────── */
const NICHES     = ['Beauty','Fashion','Lifestyle','Food & Drink','Fitness','Travel','Tech','Home','Wellness','Gaming','Parenting','Finance']
const CATEGORIES = ['Testimonial Story','Product Demo','Lifestyle','Travel','Unboxing','Review']
const SWATCHES   = ['#8b31e8','#b44af0','#a03be8','#ff7ac3','#4ECDC4','#FF6B35','#0a0612','#2d4a6e']
const THEMES     = [
  { id: 'minimal', label: 'Minimal',  bg: '#ffffff', fg: '#0a0612' },
  { id: 'dark',    label: 'Dark',     bg: '#0a0612', fg: '#ffffff' },
  { id: 'violet',  label: 'Violet',   bg: '#1a0a2e', fg: '#ffffff' },
  { id: 'warm',    label: 'Warm',     bg: '#fdf8f0', fg: '#0a0612' },
  { id: 'classic', label: 'Classic',  bg: '#f7f5ff', fg: '#0a0612' },
  { id: 'bloom',   label: 'Bloom',    bg: '#fff0f5', fg: '#0a0612' },
]
const SOCIAL_FIELDS = [
  { id: 'instagram', icon: <InstagramIcon size={18} />, label: 'Instagram',   ph: 'instagram.com/yourhandle' },
  { id: 'tiktok',    icon: <TikTokIcon size={18} />,    label: 'TikTok',      ph: 'tiktok.com/@yourhandle' },
  { id: 'youtube',   icon: <YouTubeIcon size={18} />,   label: 'YouTube',     ph: 'youtube.com/@channel' },
  { id: 'linkedin',  icon: <LinkedInIcon size={18} />,  label: 'LinkedIn',    ph: 'linkedin.com/in/name' },
  { id: 'pinterest', icon: <PinterestIcon size={18} />, label: 'Pinterest',   ph: 'pinterest.com/handle' },
  { id: 'x',         icon: <XIcon size={18} />,         label: 'X / Twitter', ph: 'x.com/handle' },
  { id: 'website',   icon: <WebsiteIcon size={18} />,   label: 'Website',     ph: 'yourwebsite.com' },
  { id: 'email',     icon: <EmailIcon size={18} />,     label: 'Email',       ph: 'you@email.com' },
]
const NAV: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: 'header',       icon: <ProfileIcon size={18} />,      label: 'Header' },
  { id: 'media',        icon: <VideoIcon size={18} />,        label: 'Media' },
  { id: 'rates',        icon: <PriceIcon size={18} />,        label: 'Rates' },
  { id: 'cases',        icon: <CaseIcon size={18} />,         label: 'Case Studies' },
  { id: 'testimonials', icon: <TestimonialIcon size={18} />,  label: 'Testimonials' },
  { id: 'links',        icon: <LinkIcon size={18} />,         label: 'Links' },
  { id: 'design',       icon: <DesignIcon size={18} />,       label: 'Design' },
  { id: 'inbox',        icon: <InboxIcon size={18} />,        label: 'Inbox' },
]
const INIT: Profile = {
  name: '', bio: '', location: '', profilePic: null, ctaText: 'Work With Me', niches: [], slug: '',
  videos: [], photos: [], rates: [], cases: [], testimonials: [],
  links: { instagram: '', tiktok: '', youtube: '', linkedin: '', pinterest: '', x: '', website: '', email: '' },
  theme: 'minimal', primaryColor: C.primary, accentColor: C.primaryLt, font: 'Rubik',
}

/* ─── Style helpers (v4) ──────────────────────────────────────────── */
const inputBase = (focused: boolean): React.CSSProperties => ({
  display: 'block', width: '100%', padding: '11px 14px',
  background: focused ? C.bg : C.bgSub,
  border: focused ? `1.5px solid ${C.primary}` : C.border,
  borderRadius: C.rSm, color: C.ink, fontSize: 14, outline: 'none',
  fontFamily: C.font,
  boxShadow: focused ? `0 0 0 3px ${C.primaryBg}` : 'none',
  transition: 'all 0.18s ease',
})
const labelBase: React.CSSProperties = {
  display: 'block', color: C.inkDim, fontSize: 11,
  fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6, fontFamily: C.font,
}
const sectionTitle: React.CSSProperties = { fontWeight: 800, fontSize: 17, color: C.ink, letterSpacing: '-0.02em', marginBottom: 4 }
const sectionSub:   React.CSSProperties = { color: C.inkDim, fontSize: 13, marginBottom: 24, lineHeight: 1.5, fontFamily: C.font }
const divider:      React.CSSProperties = { height: 1, background: C.primaryBg, margin: '24px 0' }
const card:         React.CSSProperties = { background: C.bg, border: C.border, borderRadius: C.rLg, padding: '16px', boxShadow: C.shadowCard }
const emptyBox:     React.CSSProperties = { border: `2px dashed ${C.primaryBg}`, borderRadius: C.rLg, padding: '40px 24px', textAlign: 'center', background: C.primaryBg }

/* ─── Primitives ──────────────────────────────────────────────────── */
function FInput({ value, onChange, placeholder, type = 'text', multiline = false, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  type?: string; multiline?: boolean; rows?: number
}) {
  const [f, setF] = useState(false)
  if (multiline) return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      rows={rows} onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...inputBase(f), resize: 'vertical', lineHeight: 1.6 }} />
  )
  return <input type={type} value={value} onChange={e => onChange(e.target.value)}
    placeholder={placeholder} onFocus={() => setF(true)} onBlur={() => setF(false)} style={inputBase(f)} />
}

function Field({ label, children, mb = 16 }: { label: string; children: React.ReactNode; mb?: number }) {
  return <div style={{ marginBottom: mb }}><label style={labelBase}>{label}</label>{children}</div>
}

function TagPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: C.rSm, cursor: 'pointer',
      border: `1.5px solid ${active ? C.primary : C.primaryBg}`,
      background: active ? C.primaryBg : C.bg,
      color: active ? C.ink : C.inkDim,
      fontSize: 13, fontWeight: active ? 700 : 500,
      fontFamily: C.font, transition: 'all 0.15s ease',
    }}>{label}</button>
  )
}

function ApiError({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{
      background: `${C.primary}10`, border: `1px solid ${C.primary}40`,
      borderRadius: C.rXs, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: C.primary,
    }}>{msg}</div>
  )
}

function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: C.ink, color: '#fff', padding: '10px 22px', borderRadius: C.rMd,
      fontSize: 13, fontWeight: 600, zIndex: 9999, pointerEvents: 'none',
      animation: 'fadeUp 0.22s ease forwards',
      boxShadow: C.shadowMd, fontFamily: C.font, whiteSpace: 'nowrap',
    }}>{msg}</div>
  )
}

function useApiSave() {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const save = async (fn: () => Promise<void>) => {
    setLoading(true); setSaveError('')
    try {
      await fn()
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (e: any) {
      setSaveError(e.message || 'Save failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return { saved, loading, saveError, save }
}

function SaveRow({ onSave, saved, loading, error = '' }: {
  onSave: () => void; saved: boolean; loading: boolean; error?: string
}) {
  return (
    <div style={{ paddingTop: 24, marginTop: 8, borderTop: `1px solid ${C.primaryBg}` }}>
      <ApiError msg={error} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onSave} style={{
          padding: '11px 28px', borderRadius: C.rSm, border: 'none',
          background: saved ? C.primaryBg : C.grad,
          color: saved ? C.primary : '#fff',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          fontFamily: C.font, transition: 'all 0.2s ease',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {saved ? <CheckIcon size={16} /> : loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: n <= (hover || value) ? C.primary : C.primaryBg,
            padding: '2px', transition: 'color 0.1s ease',
          }}>
          <StarIcon size={20} />
        </button>
      ))}
    </div>
  )
}

/* ─── Modals (refined) ─────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,6,18,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: C.bg, borderRadius: C.rLg, width: '100%', maxWidth: 500,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: C.shadowLg,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: `1px solid ${C.primaryBg}`,
          position: 'sticky', top: 0, background: C.bg, zIndex: 1,
        }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: C.ink, letterSpacing: '-0.02em' }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: C.primaryBg, cursor: 'pointer', fontSize: 14,
            color: C.inkDim, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

function ModalFooter({ onCancel, onSave, label = 'Add', disabled }: {
  onCancel: () => void; onSave: () => void; label?: string; disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.primaryBg}` }}>
      <button onClick={onCancel} style={{
        padding: '10px 20px', borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`,
        background: C.bg, color: C.inkDim, fontSize: 14, fontWeight: 600,
        cursor: 'pointer', fontFamily: C.font,
      }}>Cancel</button>
      <button onClick={onSave} disabled={disabled} style={{
        padding: '10px 24px', borderRadius: C.rSm, border: 'none',
        background: disabled ? C.primaryBg : C.grad,
        color: disabled ? C.inkDim : '#fff',
        fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: C.font,
      }}>{label}</button>
    </div>
  )
}

function VideoModal({ onClose, onAdd }: { onClose: () => void; onAdd: (v: Omit<Video, 'id'>) => void }) {
  const [d, setD] = useState({ title: '', url: '', platform: 'instagram', category: 'Product Demo', views: '' })
  const ok = d.title && d.url
  return (
    <Modal title="Add Video" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Video URL"><FInput value={d.url} onChange={v => setD(x => ({ ...x, url: v }))} placeholder="paste instagram, tiktok or youtube link" /></Field>
        <Field label="Title"><FInput value={d.title} onChange={v => setD(x => ({ ...x, title: v }))} placeholder="Short video title" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Platform">
            <select value={d.platform} onChange={e => setD(x => ({ ...x, platform: e.target.value }))} style={{ ...inputBase(false), cursor: 'pointer' }}>
              {['instagram', 'tiktok', 'youtube', 'other'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select value={d.category} onChange={e => setD(x => ({ ...x, category: e.target.value }))} style={{ ...inputBase(false), cursor: 'pointer' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="View count (optional)"><FInput value={d.views} onChange={v => setD(x => ({ ...x, views: v }))} placeholder="e.g. 23.4K" /></Field>
      </div>
      <ModalFooter onCancel={onClose} disabled={!ok} onSave={() => { onAdd(d); onClose() }} />
    </Modal>
  )
}

function RateModal({ onClose, onAdd, initial }: { onClose: () => void; onAdd: (r: Omit<Rate, 'id'> & { id?: string }) => void; initial?: Rate }) {
  const [d, setD] = useState(initial ?? { id: '', title: '', price: '', turnaround: '', description: '', includes: [''] })
  const setInclude = (i: number, v: string) => { const a = [...d.includes]; a[i] = v; setD(x => ({ ...x, includes: a })) }
  const addLine    = () => setD(x => ({ ...x, includes: [...x.includes, ''] }))
  const removeLine = (i: number) => setD(x => ({ ...x, includes: x.includes.filter((_, j) => j !== i) }))
  const ok = d.title && d.price
  return (
    <Modal title={initial ? 'Edit Service' : 'Add Service'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Service title"><FInput value={d.title} onChange={v => setD(x => ({ ...x, title: v }))} placeholder="e.g. UGC Video Package" /></Field>
          <Field label="Price"><FInput value={d.price} onChange={v => setD(x => ({ ...x, price: v }))} placeholder="e.g. €500" /></Field>
        </div>
        <Field label="Turnaround time"><FInput value={d.turnaround} onChange={v => setD(x => ({ ...x, turnaround: v }))} placeholder="e.g. 5 business days" /></Field>
        <Field label="Description"><FInput value={d.description} onChange={v => setD(x => ({ ...x, description: v }))} placeholder="Brief description" multiline /></Field>
        <div>
          <label style={labelBase}>What's included</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.includes.map((inc, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <FInput value={inc} onChange={v => setInclude(i, v)} placeholder={`Item ${i + 1}`} />
                {d.includes.length > 1 && (
                  <button onClick={() => removeLine(i)} style={{
                    flexShrink: 0, width: 30, height: 30, borderRadius: '50%', border: 'none',
                    background: C.primaryBg, color: C.primary, cursor: 'pointer', fontSize: 14,
                  }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={addLine} style={{
              alignSelf: 'flex-start', background: 'none', border: `1.5px dashed ${C.primaryBg}`,
              borderRadius: C.rSm, padding: '7px 14px', color: C.primary, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: C.font,
            }}>+ Add item</button>
          </div>
        </div>
      </div>
      <ModalFooter onCancel={onClose} disabled={!ok} label={initial ? 'Save changes' : 'Add service'}
        onSave={() => { onAdd({ ...d }); onClose() }} />
    </Modal>
  )
}

function CaseModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Omit<Case, 'id'>) => void }) {
  const [d, setD] = useState({
    brand: '', description: '', period: '',
    metrics: [{ label: 'Avg. Views', value: '' }, { label: 'Reach', value: '' }, { label: 'Saves', value: '' }]
  })
  const setMetric = (i: number, k: 'label' | 'value', v: string) => {
    const m = [...d.metrics]; m[i] = { ...m[i], [k]: v }; setD(x => ({ ...x, metrics: m }))
  }
  return (
    <Modal title="Add Case Study" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Brand name"><FInput value={d.brand} onChange={v => setD(x => ({ ...x, brand: v }))} placeholder="e.g. Nike" /></Field>
          <Field label="Time period"><FInput value={d.period} onChange={v => setD(x => ({ ...x, period: v }))} placeholder="e.g. 30-day campaign" /></Field>
        </div>
        <Field label="Campaign description"><FInput value={d.description} onChange={v => setD(x => ({ ...x, description: v }))} placeholder="What did you create?" multiline rows={4} /></Field>
        <div>
          <label style={labelBase}>Key metrics</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.metrics.map((m, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <FInput value={m.label} onChange={v => setMetric(i, 'label', v)} placeholder="Metric name" />
                <FInput value={m.value} onChange={v => setMetric(i, 'value', v)} placeholder="e.g. 23.4K" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <ModalFooter onCancel={onClose} disabled={!d.brand} label="Add case study"
        onSave={() => { onAdd(d); onClose() }} />
    </Modal>
  )
}

function TestiModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Omit<Testi, 'id'>) => void }) {
  const [d, setD] = useState({ name: '', role: '', company: '', quote: '', rating: 5 })
  return (
    <Modal title="Add Testimonial" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Client name"><FInput value={d.name} onChange={v => setD(x => ({ ...x, name: v }))} placeholder="Kacey Smith" /></Field>
          <Field label="Company"><FInput value={d.company} onChange={v => setD(x => ({ ...x, company: v }))} placeholder="Brand Co." /></Field>
        </div>
        <Field label="Role / Title"><FInput value={d.role} onChange={v => setD(x => ({ ...x, role: v }))} placeholder="e.g. Founder & CEO" /></Field>
        <Field label="Their quote"><FInput value={d.quote} onChange={v => setD(x => ({ ...x, quote: v }))} placeholder="What did they say?" multiline rows={4} /></Field>
        <Field label="Rating"><StarRating value={d.rating} onChange={r => setD(x => ({ ...x, rating: r }))} /></Field>
      </div>
      <ModalFooter onCancel={onClose} disabled={!d.name || !d.quote} label="Add testimonial"
        onSave={() => { onAdd(d); onClose() }} />
    </Modal>
  )
}

/* ─── TABS (converted to v4) ───────────────────────────────────────── */
function HeaderTab({ profile, setProfile }: { profile: Profile; setProfile: SetProfile }) {
  const { saved, loading, saveError, save } = useApiSave()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const set = (patch: Partial<Profile>) => setProfile(p => ({ ...p, ...patch }))

  const pickPic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPendingFile(file)
    const r = new FileReader()
    r.onload = ev => set({ profilePic: ev.target?.result as string })
    r.readAsDataURL(file)
  }

  const handleSave = () => {
    save(async () => {
      const token = getToken()
      let profilePicUrl = profile.profilePic
      if (pendingFile) {
        const form = new FormData()
        form.append('file', pendingFile)
        form.append('type', 'profilePic')
        const res = await fetch(`${API}/media/upload`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message)
        profilePicUrl = json.data.url
        setPendingFile(null)
      }
      const res = await fetch(`${API}/profile/header`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profile.name || undefined,
          bio: profile.bio || undefined,
          location: profile.location || undefined,
          ctaText: profile.ctaText || undefined,
          slug: profile.slug?.length >= 3 ? profile.slug : undefined,
          niches: profile.niches,
          profilePicUrl: profilePicUrl ?? '',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
    })
  }

  return (
    <div>
      <h2 style={sectionTitle}>Header</h2>
      <p style={sectionSub}>This is the first thing brands see on your portfolio.</p>
      <label style={labelBase}>Profile photo</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <div onClick={() => fileRef.current?.click()} style={{
          width: 80, height: 80, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
          background: profile.profilePic ? 'transparent' : C.primaryBg,
          border: `2px dashed ${profile.profilePic ? 'transparent' : C.primaryBg}`,
          outline: profile.profilePic ? `3px solid ${C.primaryBg}` : 'none',
          outlineOffset: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', transition: 'all 0.2s ease',
        }}>
          {profile.profilePic
            ? <img src={profile.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <CameraIcon size={32} style={{ color: C.inkDim }} />
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickPic} />
        <div>
          <button onClick={() => fileRef.current?.click()} style={{
            display: 'block', background: 'none', border: `1.5px solid ${C.primaryBg}`,
            borderRadius: C.rSm, padding: '8px 16px', color: C.primary, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: C.font, marginBottom: 6,
          }}>{profile.profilePic ? 'Change photo' : 'Upload photo'}</button>
          <p style={{ color: C.inkFaint, fontSize: 12, margin: 0 }}>JPG or PNG · Max 5MB</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Display name"><FInput value={profile.name} onChange={v => set({ name: v })} placeholder="Sophie Thomas" /></Field>
          <Field label="Location"><FInput value={profile.location} onChange={v => set({ location: v })} placeholder="Riga, Latvia" /></Field>
        </div>
        <Field label="Bio / Tagline"><FInput value={profile.bio} onChange={v => set({ bio: v })} placeholder="UGC creator specialising in beauty & lifestyle." multiline rows={3} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="CTA button text"><FInput value={profile.ctaText} onChange={v => set({ ctaText: v })} placeholder="Work With Me" /></Field>
          <Field label="Portfolio URL slug">
            <div style={{ position: 'relative' }}>
              {/* Permanent @ symbol prefix */}
              <span style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14,
                fontWeight: 500,
                color: C.inkDim,
                pointerEvents: 'none',
              }}>@</span>
              <input
                value={profile.slug}
                onChange={e => set({ slug: e.target.value })}
                placeholder="username"
                style={{
                  ...inputBase(false),
                  paddingLeft: 32,
                }}
              />
            </div>
          </Field>
        </div>
        <Field label="Content niches — pick all that apply" mb={4}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {NICHES.map(n => (
              <TagPill key={n} label={n} active={profile.niches.includes(n)}
                onClick={() => set({ niches: profile.niches.includes(n) ? profile.niches.filter(x => x !== n) : [...profile.niches, n] })} />
            ))}
          </div>
        </Field>
      </div>
      <SaveRow onSave={handleSave} saved={saved} loading={loading} error={saveError} />
    </div>
  )
}

function MediaTab({ profile, setProfile }: { profile: Profile; setProfile: SetProfile }) {
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  const platIcon: Record<string, React.ReactNode> = {
    instagram: <InstagramIcon size={20} />,
    tiktok: <TikTokIcon size={20} />,
    youtube: <YouTubeIcon size={20} />,
    other: <VideoIcon size={20} />,
  }
  const platName: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', other: 'Video' }

  const addVideo = (v: Omit<Video, 'id'>) => {
    const tempId = `temp_${Date.now()}`
    setProfile(p => ({ ...p, videos: [...p.videos, { ...v, id: tempId }] }))
    const token = getToken()
    fetch(`${API}/media/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(v),
    })
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message)
        setProfile(p => ({
          ...p, videos: p.videos.map(vid =>
            vid.id === tempId ? { ...json.data.video, id: json.data.video._id } : vid
          )
        }))
      })
      .catch(err => {
        setMediaError(err.message)
        setProfile(p => ({ ...p, videos: p.videos.filter(vid => vid.id !== tempId) }))
      })
  }

  const removeVideo = (id: string) => {
    setProfile(p => ({ ...p, videos: p.videos.filter(v => v.id !== id) }))
    const token = getToken()
    fetch(`${API}/media/videos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  }

  const addPhotos = async (files: FileList) => {
    setPhotoUploading(true)
    setMediaError('')
    const token = getToken()
    for (const file of Array.from(files)) {
      const tempId = `temp_${Date.now()}_${Math.random()}`
      const tempUrl = URL.createObjectURL(file)
      setProfile(p => ({ ...p, photos: [...p.photos, { id: tempId, url: tempUrl }] }))
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('type', 'photo')
        const res = await fetch(`${API}/media/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message)
        const savedId = json.data._id || json.data.id || tempId
        const savedUrl = json.data.url || tempUrl
        setProfile(p => ({
          ...p,
          photos: p.photos.map(ph => ph.id === tempId ? { id: savedId, url: savedUrl } : ph),
        }))
      } catch (err: any) {
        setMediaError(err.message || 'Photo upload failed.')
        setProfile(p => ({ ...p, photos: p.photos.filter(ph => ph.id !== tempId) }))
      }
    }
    setPhotoUploading(false)
  }

  const removePhoto = (id: string) => {
    setProfile(p => ({ ...p, photos: p.photos.filter(ph => ph.id !== id) }))
    const token = getToken()
    fetch(`${API}/media/photos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  }

  return (
    <div>
      <h2 style={sectionTitle}>Media</h2>
      <p style={sectionSub}>Add videos and photos to showcase your best work.</p>
      <ApiError msg={mediaError} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
          Videos <span style={{ color: C.inkDim, fontWeight: 400 }}>({profile.videos.length})</span>
        </span>
        <button onClick={() => setShowVideoModal(true)} style={{
          background: C.grad, border: 'none', borderRadius: C.rSm, padding: '8px 16px',
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
        }}>+ Add video</button>
      </div>

      {profile.videos.length === 0
        ? <div style={emptyBox}>
            <VideoIcon size={32} style={{ color: C.inkDim, marginBottom: 8 }} />
            <p style={{ fontWeight: 700, color: C.ink, fontSize: 15, marginBottom: 4 }}>No videos yet</p>
            <p style={{ color: C.inkDim, fontSize: 13 }}>Add your best UGC videos to show brands what you can do.</p>
          </div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 4 }}>
            {profile.videos.map(v => {
              const ytThumb = v.platform === 'youtube' ? getYouTubeThumbnail(v.url) : null
              return (
                <div key={v.id} style={{ ...card, padding: 0, overflow: 'hidden', position: 'relative' }}>
                  <button onClick={() => removeVideo(v.id)} style={{
                    position: 'absolute', top: 8, right: 8, zIndex: 2,
                    width: 24, height: 24, borderRadius: '50%', border: 'none',
                    background: 'rgba(10,6,18,0.55)', color: '#fff', cursor: 'pointer', fontSize: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                  }}>✕</button>
                  <div style={{ aspectRatio: '9/14', position: 'relative', overflow: 'hidden', background: C.primaryBg }}>
                    {ytThumb ? (
                      <img src={ytThumb} alt={v.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ fontSize: 36 }}>{platIcon[v.platform]}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.inkDim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{platName[v.platform] ?? 'Video'}</span>
                        {v.url && (
                          <a href={v.url} target="_blank" rel="noopener noreferrer" style={{
                            fontSize: 11, fontWeight: 700, color: C.primary,
                            background: C.primaryBg, border: `1px solid ${C.primaryBg}`,
                            borderRadius: C.rXs, padding: '4px 10px', textDecoration: 'none',
                            marginTop: 4,
                          }}>View ↗</a>
                        )}
                      </div>
                    )}
                    {ytThumb && (
                      <a href={v.url} target="_blank" rel="noopener noreferrer" style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(10,6,18,0.22)', textDecoration: 'none', transition: 'background 0.18s ease',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(10,6,18,0.44)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(10,6,18,0.22)' }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.92)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 14, marginLeft: 2 }}>▶</span>
                        </div>
                      </a>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ fontWeight: 700, fontSize: 12, color: C.ink, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</p>
                    <p style={{ fontSize: 11, color: C.inkDim }}>{v.category}{v.views ? ` · ${v.views} views` : ''}</p>
                  </div>
                </div>
              )
            })}
          </div>
      }

      <div style={divider} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>
          Photos <span style={{ color: C.inkDim, fontWeight: 400 }}>({profile.photos.length})</span>
        </span>
        <button
          onClick={() => photoRef.current?.click()}
          disabled={photoUploading}
          style={{
            border: `1.5px solid ${C.primaryBg}`, borderRadius: C.rSm, padding: '8px 16px',
            background: C.bg, color: C.primary, fontSize: 13, fontWeight: 700,
            cursor: photoUploading ? 'not-allowed' : 'pointer',
            fontFamily: C.font, opacity: photoUploading ? 0.65 : 1,
          }}>
          {photoUploading ? 'Uploading…' : '+ Add photos'}
        </button>
      </div>
      <input ref={photoRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => { if (e.target.files) addPhotos(e.target.files); e.target.value = '' }} />

      {profile.photos.length === 0
        ? <div style={emptyBox}>
            <CameraIcon size={32} style={{ color: C.inkDim, marginBottom: 8 }} />
            <p style={{ fontWeight: 700, color: C.ink, fontSize: 15, marginBottom: 4 }}>No photos yet</p>
            <p style={{ color: C.inkDim, fontSize: 13 }}>Upload product photos and behind-the-scenes content.</p>
          </div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 8 }}>
            {profile.photos.map(ph => (
              <div key={ph.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: C.rMd, overflow: 'hidden', border: C.border, background: C.primaryBg }}>
                <img src={ph.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button onClick={() => removePhoto(ph.id)} style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 22, height: 22, borderRadius: '50%', border: 'none',
                  background: 'rgba(10,6,18,0.55)', color: '#fff', cursor: 'pointer', fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(4px)',
                }}>✕</button>
              </div>
            ))}
          </div>
      }

      {showVideoModal && <VideoModal onClose={() => setShowVideoModal(false)} onAdd={addVideo} />}
    </div>
  )
}

function RatesTab({ profile, setProfile }: { profile: Profile; setProfile: SetProfile }) {
  const [showModal, setShowModal] = useState(false)
  const [editRate, setEditRate] = useState<Rate | undefined>()
  const [rateError, setRateError] = useState('')

  const addRate = (r: Omit<Rate, 'id'> & { id?: string }) => {
    if (r.id) {
      const token = getToken()
      fetch(`${API}/rates/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(r),
      })
        .then(res => res.json())
        .then(json => {
          if (!json.success) throw new Error(json.message)
          setProfile(p => ({ ...p, rates: p.rates.map(x => x.id === r.id ? { ...json.data.rate, id: json.data.rate._id } : x) }))
        })
        .catch(err => setRateError(err.message))
    } else {
      const tempId = `temp_${Date.now()}`
      const tempRate: Rate = { ...r, id: tempId } as Rate
      setProfile(p => ({ ...p, rates: [...p.rates, tempRate] }))
      const token = getToken()
      fetch(`${API}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(r),
      })
        .then(res => res.json())
        .then(json => {
          if (!json.success) throw new Error(json.message)
          setProfile(p => ({ ...p, rates: p.rates.map(x => x.id === tempId ? { ...json.data.rate, id: json.data.rate._id } : x) }))
        })
        .catch(err => {
          setRateError(err.message)
          setProfile(p => ({ ...p, rates: p.rates.filter(x => x.id !== tempId) }))
        })
    }
  }

  const removeRate = (id: string) => {
    setProfile(p => ({ ...p, rates: p.rates.filter(r => r.id !== id) }))
    const token = getToken()
    fetch(`${API}/rates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  }

  return (
    <div>
      <h2 style={sectionTitle}>Rates & Services</h2>
      <p style={sectionSub}>Show brands exactly what you offer and how much it costs.</p>
      <ApiError msg={rateError} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => { setEditRate(undefined); setShowModal(true) }} style={{
          background: C.grad, border: 'none', borderRadius: C.rSm, padding: '8px 16px',
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
        }}>+ Add service</button>
      </div>
      {profile.rates.length === 0
        ? <div style={emptyBox}>
            <PriceIcon size={32} style={{ color: C.inkDim, marginBottom: 8 }} />
            <p style={{ fontWeight: 700, color: C.ink, fontSize: 15, marginBottom: 4 }}>No services yet</p>
            <p style={{ color: C.inkDim, fontSize: 13 }}>Add your packages so brands know exactly what to expect.</p>
          </div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profile.rates.map(r => (
              <div key={r.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 2 }}>{r.title}</p>
                    <p style={{ fontWeight: 700, fontSize: 18, color: C.primary }}>{r.price}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditRate(r); setShowModal(true) }} style={{
                      padding: '6px 12px', borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`,
                      background: C.bg, color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
                    }}>Edit</button>
                    <button onClick={() => removeRate(r.id)} style={{
                      padding: '6px 12px', borderRadius: C.rSm, border: 'none',
                      background: C.primaryBg, color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
                    }}>Delete</button>
                  </div>
                </div>
                {r.turnaround && <p style={{ fontSize: 12, color: C.inkDim, marginBottom: 8 }}>⏱ {r.turnaround}</p>}
                {r.description && <p style={{ fontSize: 13, color: C.inkDim2, marginBottom: 10, lineHeight: 1.5 }}>{r.description}</p>}
                {r.includes.filter(Boolean).length > 0 && (
                  <div style={{ borderTop: `1px solid ${C.primaryBg}`, paddingTop: 10 }}>
                    {r.includes.filter(Boolean).map((inc, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <CheckIcon size={12} style={{ color: C.primary }} />
                        <span style={{ fontSize: 13, color: C.inkDim }}>{inc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
      }
      {showModal && <RateModal onClose={() => setShowModal(false)} onAdd={addRate} initial={editRate} />}
    </div>
  )
}

function CasesTab({ profile, setProfile }: { profile: Profile; setProfile: SetProfile }) {
  const [showModal, setShowModal] = useState(false)
  const [caseError, setCaseError] = useState('')

  const addCase = (c: Omit<Case, 'id'>) => {
    const tempId = `temp_${Date.now()}`
    setProfile(p => ({ ...p, cases: [...p.cases, { ...c, id: tempId }] }))
    const token = getToken()
    fetch(`${API}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(c),
    })
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message)
        setProfile(p => ({ ...p, cases: p.cases.map(x => x.id === tempId ? { ...json.data.caseStudy, id: json.data.caseStudy._id } : x) }))
      })
      .catch(err => {
        setCaseError(err.message)
        setProfile(p => ({ ...p, cases: p.cases.filter(x => x.id !== tempId) }))
      })
  }

  const removeCase = (id: string) => {
    setProfile(p => ({ ...p, cases: p.cases.filter(c => c.id !== id) }))
    const token = getToken()
    fetch(`${API}/cases/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  }

  return (
    <div>
      <h2 style={sectionTitle}>Case Studies</h2>
      <p style={sectionSub}>Prove your value with real campaign results and metrics.</p>
      <ApiError msg={caseError} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowModal(true)} style={{
          background: C.grad, border: 'none', borderRadius: C.rSm, padding: '8px 16px',
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
        }}>+ Add case study</button>
      </div>
      {profile.cases.length === 0
        ? <div style={emptyBox}>
            <CaseIcon size={32} style={{ color: C.inkDim, marginBottom: 8 }} />
            <p style={{ fontWeight: 700, color: C.ink, fontSize: 15, marginBottom: 4 }}>No case studies yet</p>
            <p style={{ color: C.inkDim, fontSize: 13 }}>Show brands the real impact of your collaborations.</p>
          </div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profile.cases.map(c => (
              <div key={c.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: C.rMd,
                      background: C.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 16, color: C.primary,
                    }}>{c.brand[0]?.toUpperCase()}</div>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 15, color: C.ink, marginBottom: 1 }}>{c.brand}</p>
                      {c.period && <p style={{ fontSize: 12, color: C.inkDim }}>{c.period}</p>}
                    </div>
                  </div>
                  <button onClick={() => removeCase(c.id)} style={{
                    padding: '6px 12px', borderRadius: C.rSm, border: 'none',
                    background: C.primaryBg, color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
                  }}>Delete</button>
                </div>
                {c.description && <p style={{ fontSize: 13, color: C.inkDim2, marginBottom: 12, lineHeight: 1.5 }}>{c.description}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {c.metrics.map((m, i) => (
                    <div key={i} style={{ background: C.primaryBg, borderRadius: C.rMd, padding: '10px 12px', border: `1px solid ${C.primaryBg}` }}>
                      <p style={{ fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 2 }}>{m.value || '—'}</p>
                      <p style={{ fontSize: 11, color: C.inkDim }}>{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
      }
      {showModal && <CaseModal onClose={() => setShowModal(false)} onAdd={addCase} />}
    </div>
  )
}

function TestimonialsTab({ profile, setProfile }: { profile: Profile; setProfile: SetProfile }) {
  const [showModal, setShowModal] = useState(false)
  const [testiError, setTestiError] = useState('')

  const addTesti = (t: Omit<Testi, 'id'>) => {
    const tempId = `temp_${Date.now()}`
    setProfile(p => ({ ...p, testimonials: [...p.testimonials, { ...t, id: tempId }] }))
    const token = getToken()
    fetch(`${API}/testimonials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(t),
    })
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message)
        setProfile(p => ({
          ...p,
          testimonials: p.testimonials.map(x => x.id === tempId ? { ...json.data.testimonial, id: json.data.testimonial._id } : x),
        }))
      })
      .catch(err => {
        setTestiError(err.message)
        setProfile(p => ({ ...p, testimonials: p.testimonials.filter(x => x.id !== tempId) }))
      })
  }

  const removeTesti = (id: string) => {
    setProfile(p => ({ ...p, testimonials: p.testimonials.filter(t => t.id !== id) }))
    const token = getToken()
    fetch(`${API}/testimonials/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
  }

  return (
    <div>
      <h2 style={sectionTitle}>Testimonials</h2>
      <p style={sectionSub}>Let past clients speak for you. Social proof converts brands.</p>
      <ApiError msg={testiError} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowModal(true)} style={{
          background: C.grad, border: 'none', borderRadius: C.rSm, padding: '8px 16px',
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
        }}>+ Add testimonial</button>
      </div>
      {profile.testimonials.length === 0
        ? <div style={emptyBox}>
            <TestimonialIcon size={32} style={{ color: C.inkDim, marginBottom: 8 }} />
            <p style={{ fontWeight: 700, color: C.ink, fontSize: 15, marginBottom: 4 }}>No testimonials yet</p>
            <p style={{ color: C.inkDim, fontSize: 13 }}>Ask previous clients for a quote to build trust with new brands.</p>
          </div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profile.testimonials.map(t => (
              <div key={t.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} size={16} style={{ color: i < t.rating ? C.primary : C.primaryBg }} />
                    ))}
                  </div>
                  <button onClick={() => removeTesti(t.id)} style={{
                    padding: '6px 12px', borderRadius: C.rSm, border: 'none',
                    background: C.primaryBg, color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
                  }}>Delete</button>
                </div>
                <p style={{ fontSize: 14, color: C.inkDim2, lineHeight: 1.7, marginBottom: 14 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: C.gradD, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 13, color: '#fff',
                  }}>{t.name[0]?.toUpperCase()}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 1 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: C.inkDim }}>{t.role}{t.company ? ` · ${t.company}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
      {showModal && <TestiModal onClose={() => setShowModal(false)} onAdd={addTesti} />}
    </div>
  )
}

function LinksTab({ profile, setProfile }: { profile: Profile; setProfile: SetProfile }) {
  const { saved, loading, saveError, save } = useApiSave()
  const setLink = (k: string, v: string) => setProfile(p => ({ ...p, links: { ...p.links, [k]: v } }))

  const handleSave = () => {
    save(async () => {
      const token = getToken()
      const res = await fetch(`${API}/links`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ links: profile.links }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
    })
  }

  return (
    <div>
      <h2 style={sectionTitle}>Social Links</h2>
      <p style={sectionSub}>Connect your platforms so brands can find and follow you everywhere.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {SOCIAL_FIELDS.map(s => (
          <div key={s.id}>
            <label style={labelBase}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {s.icon} {s.label}
              </span>
            </label>
            <FInput value={profile.links[s.id] ?? ''} onChange={v => setLink(s.id, v)} placeholder={s.ph} />
          </div>
        ))}
      </div>
      <SaveRow onSave={handleSave} saved={saved} loading={loading} error={saveError} />
    </div>
  )
}

function DesignTab({ profile, setProfile }: { profile: Profile; setProfile: SetProfile }) {
  const { saved, loading, saveError, save } = useApiSave()
  const set = (patch: Partial<Profile>) => setProfile(p => ({ ...p, ...patch }))

  const handleSave = () => {
    save(async () => {
      const token = getToken()
      const res = await fetch(`${API}/profile/design`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          theme: profile.theme,
          primaryColor: profile.primaryColor,
          accentColor: profile.accentColor,
          font: 'Rubik',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message)
    })
  }

  return (
    <div>
      <h2 style={sectionTitle}>Design</h2>
      <p style={sectionSub}>Customise the look and feel of your portfolio.</p>

      <label style={labelBase}>Portfolio theme</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 28 }}>
        {THEMES.map(t => {
          const active = profile.theme === t.id
          return (
            <button key={t.id} onClick={() => set({ theme: t.id })} style={{
              borderRadius: C.rMd, overflow: 'hidden', cursor: 'pointer', padding: 0,
              border: `2px solid ${active ? C.primary : C.primaryBg}`,
              boxShadow: active ? C.shadowSm : 'none',
              transition: 'all 0.18s ease', background: 'none',
            }}>
              <div style={{ background: t.bg, padding: '16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60 }}>
                <div style={{ width: 36, height: 8, borderRadius: C.rXs, background: t.fg, opacity: 0.7 }} />
              </div>
              <div style={{
                padding: '8px', textAlign: 'center', fontSize: 12, fontWeight: active ? 700 : 500,
                color: active ? C.primary : C.inkDim,
                borderTop: `1px solid ${C.primaryBg}`, background: C.bg,
                fontFamily: C.font,
              }}>{t.label}</div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 }}>
        {[
          { label: 'Primary colour', key: 'primaryColor', val: profile.primaryColor },
          { label: 'Accent colour',  key: 'accentColor',  val: profile.accentColor },
        ].map(c => (
          <div key={c.key}>
            <label style={labelBase}>{c.label}</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input type="color" value={c.val} onChange={e => set({ [c.key]: e.target.value })}
                style={{ width: 40, height: 40, borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`, cursor: 'pointer', padding: 2, background: C.bg }} />
              <FInput value={c.val} onChange={v => set({ [c.key]: v })} placeholder="#000000" />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SWATCHES.map(s => (
                <button key={s} onClick={() => set({ [c.key]: s })} style={{
                  width: 24, height: 24, borderRadius: '50%', background: s, border: 'none', cursor: 'pointer',
                  outline: c.val === s ? `2px solid ${C.primary}` : '2px solid transparent',
                  outlineOffset: 2, transition: 'outline 0.15s ease', flexShrink: 0,
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <SaveRow onSave={handleSave} saved={saved} loading={loading} error={saveError} />
    </div>
  )
}

function InboxTab({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const [msgs, setMsgs] = useState<InboxMsg[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'messages' | 'inquiries' | 'unread'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    fetch(`${API}/inbox`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        if (!json.success) throw new Error(json.message)
        const mapped: InboxMsg[] = json.data.messages.map((m: any) => ({
          id: m._id, type: m.type, read: m.read,
          name: m.senderName, company: m.senderCompany ?? '',
          email: m.senderEmail, message: m.message, budget: m.budget,
          receivedAt: timeAgo(m.createdAt),
        }))
        setMsgs(mapped)
        onUnreadChange?.(mapped.filter(m => !m.read).length)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id: string) => {
    const token = getToken()
    await fetch(`${API}/inbox/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
    setMsgs(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, read: true } : m)
      onUnreadChange?.(updated.filter(m => !m.read).length)
      return updated
    })
  }

  const deleteMsg = async (id: string) => {
    const token = getToken()
    await fetch(`${API}/inbox/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setMsgs(prev => {
      const updated = prev.filter(m => m.id !== id)
      onUnreadChange?.(updated.filter(m => !m.read).length)
      return updated
    })
  }

  const toggle = (id: string) => { setExpanded(e => e === id ? null : id); markRead(id) }

  const unreadCount = msgs.filter(m => !m.read).length
  const inquiryCount = msgs.filter(m => m.type === 'inquiry').length
  const messageCount = msgs.filter(m => m.type === 'message').length

  const filtered = msgs.filter(m => {
    if (filter === 'messages') return m.type === 'message'
    if (filter === 'inquiries') return m.type === 'inquiry'
    if (filter === 'unread') return !m.read
    return true
  })

  const typeColor = (t: string) => t === 'inquiry'
    ? { bg: C.primaryBg, color: C.primary, border: C.primaryBg }
    : { bg: C.primaryBg, color: C.primaryLt, border: C.primaryBg }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bgPage }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${C.primaryBg}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: C.inkDim, fontSize: 14 }}>Loading inbox…</p>
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, background: C.bgPage, overflowY: 'auto', padding: '28px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontWeight: 900, fontSize: 22, color: C.ink, letterSpacing: '-0.03em', marginBottom: 4 }}>Inbox</h2>
          <p style={{ color: C.inkDim, fontSize: 13 }}>Messages and inquiries from brands and collaborators.</p>
        </div>
        {error && <ApiError msg={error} />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: msgs.length, color: C.ink },
            { label: 'Unread', value: unreadCount, color: C.primary },
            { label: 'Inquiries', value: inquiryCount, color: C.primary },
            { label: 'Messages', value: messageCount, color: C.inkDim },
          ].map(s => (
            <div key={s.label} style={{ background: C.bg, borderRadius: C.rLg, padding: '14px 16px', border: C.border, boxShadow: C.shadowCard }}>
              <p style={{ fontWeight: 900, fontSize: 22, color: s.color, letterSpacing: '-0.02em', marginBottom: 2 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: C.inkDim, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['all', 'messages', 'inquiries', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: C.rSm, cursor: 'pointer',
              background: filter === f ? C.ink : C.bg,
              color: filter === f ? '#fff' : C.inkDim,
              fontSize: 12, fontWeight: filter === f ? 700 : 500,
              fontFamily: C.font,
              border: filter === f ? `1.5px solid ${C.ink}` : `1.5px solid ${C.primaryBg}`,
              transition: 'all 0.15s ease',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 && (
                <span style={{ marginLeft: 6, background: C.primary, color: '#fff', borderRadius: C.rXs, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: C.bg, borderRadius: C.rLg, border: C.border }}>
            <InboxIcon size={36} style={{ color: C.inkDim, marginBottom: 12 }} />
            <p style={{ fontWeight: 700, fontSize: 16, color: C.ink, marginBottom: 6 }}>Nothing here yet</p>
            <p style={{ color: C.inkDim, fontSize: 14 }}>
              {filter === 'unread' ? 'All caught up — no unread messages.' : 'Share your portfolio link to start receiving messages.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(m => {
              const tc = typeColor(m.type)
              const open = expanded === m.id
              return (
                <div key={m.id} style={{
                  background: C.bg, borderRadius: C.rLg,
                  border: `1.5px solid ${!m.read ? C.primaryBg : C.border}`,
                  boxShadow: !m.read ? C.shadowSm : C.shadowCard,
                  overflow: 'hidden', transition: 'all 0.2s ease',
                }}>
                  <div onClick={() => toggle(m.id)} style={{ padding: '16px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                      background: m.read ? 'transparent' : C.primary,
                      border: m.read ? `1.5px solid ${C.primaryBg}` : 'none',
                    }} />
                    <div style={{
                      width: 40, height: 40, borderRadius: C.rMd, flexShrink: 0,
                      background: C.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: 15, color: C.primary,
                    }}>{m.name[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: C.ink, letterSpacing: '-0.01em' }}>{m.name}</span>
                        {m.company && <span style={{ fontSize: 12, color: C.inkDim }}>· {m.company}</span>}
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: C.rXs,
                          background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: 'auto',
                        }}>{m.type}</span>
                      </div>
                      {!open && <p style={{ fontSize: 13, color: C.inkDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', marginBottom: 6, lineHeight: 1.5 }}>{m.message}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, color: C.inkFaint }}>⏱ {m.receivedAt}</span>
                        {m.budget && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: C.rXs,
                            background: C.primaryBg, color: C.ink, border: `1px solid ${C.primaryBg}`,
                          }}>💰 {m.budget}</span>
                        )}
                      </div>
                    </div>
                    <ChevronDownIcon size={12} style={{ color: C.inkFaint, flexShrink: 0, marginTop: 2, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                  </div>
                  {open && (
                    <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${C.primaryBg}`, paddingTop: 16 }}>
                      <p style={{ fontSize: 14, color: C.inkDim2, lineHeight: 1.8, background: C.primaryBg, borderRadius: C.rMd, padding: '14px 16px', marginBottom: 14, borderLeft: `3px solid ${tc.color}` }}>{m.message}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', background: C.primaryBg, borderRadius: C.rMd, border: `1px solid ${C.primaryBg}` }}>
                        <MailIcon size={14} style={{ color: C.primary }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.inkDim }}>Reply to:</span>
                        <a href={`mailto:${m.email}`} style={{ fontSize: 13, fontWeight: 700, color: C.primary, textDecoration: 'none' }}>{m.email}</a>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <a href={`mailto:${m.email}?subject=Re: Your inquiry via Nexfluence&body=Hi ${m.name.split(' ')[0]},%0A%0AThanks for reaching out!`}
                          style={{ padding: '9px 18px', borderRadius: C.rSm, border: 'none', background: C.grad, color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: C.font }}>Reply via email</a>
                        {!m.read && (
                          <button onClick={e => { e.stopPropagation(); markRead(m.id) }} style={{ padding: '9px 16px', borderRadius: C.rSm, fontSize: 13, fontWeight: 600, border: `1.5px solid ${C.primaryBg}`, background: C.bg, color: C.inkDim, cursor: 'pointer', fontFamily: C.font }}>Mark as read</button>
                        )}
                        <button onClick={e => { e.stopPropagation(); deleteMsg(m.id) }} style={{ padding: '9px 14px', borderRadius: C.rSm, fontSize: 13, fontWeight: 600, border: 'none', background: C.primaryBg, color: C.primary, cursor: 'pointer', fontFamily: C.font, marginLeft: 'auto' }}>Delete</button>
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

function LivePreview({ profile, device }: { profile: Profile; device: string }) {
  const theme = THEMES.find(t => t.id === profile.theme) ?? THEMES[0]
  const maxW = device === 'Mobile' ? 340 : device === 'Tablet' ? 600 : '100%'
  const previewUrl = profile.slug ? `nexus.nexfluence.eu/profile/${profile.slug}` : 'nexus.nexfluence.eu/profile/yourname'
  return (
    <div style={{ flex: 1, background: C.bgPage, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: 24, overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: maxW, transition: 'max-width 0.4s ease' }}>
        <div style={{ background: '#f0edf8', borderRadius: `${C.rMd}px ${C.rMd}px 0 0`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${C.primaryBg}`, borderBottom: 'none' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ flex: 1, background: 'white', borderRadius: C.rSm, padding: '4px 10px', fontSize: 11, color: C.inkDim, border: `1px solid ${C.primaryBg}` }}>{previewUrl}</div>
        </div>
        <div style={{ background: theme.bg, border: `1px solid ${C.primaryBg}`, borderTop: 'none', borderRadius: `0 0 ${C.rMd}px ${C.rMd}px`, overflow: 'hidden', boxShadow: C.shadowLg }}>
          <div style={{ background: `linear-gradient(135deg, ${profile.primaryColor}22, ${profile.accentColor}22)`, padding: '28px 24px', textAlign: 'center', borderBottom: `1px solid ${C.primaryBg}` }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px', background: profile.profilePic ? 'transparent' : `linear-gradient(135deg,${profile.primaryColor},${profile.accentColor})`, border: `3px solid ${profile.primaryColor}44`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 22, color: '#fff' }}>
              {profile.profilePic ? <img src={profile.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile.name ? profile.name[0].toUpperCase() : '?')}
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 20, color: theme.fg, letterSpacing: '-0.02em', marginBottom: 6, fontFamily: C.font }}>{profile.name || 'Your Name'}</h2>
            {profile.location && <p style={{ fontSize: 12, color: `${theme.fg}70`, marginBottom: 8 }}>📍 {profile.location}</p>}
            {profile.bio && <p style={{ fontSize: 12, color: `${theme.fg}80`, lineHeight: 1.5, maxWidth: 260, margin: '0 auto 14px' }}>{profile.bio}</p>}
            <button style={{ background: `linear-gradient(90deg,${profile.primaryColor},${profile.accentColor})`, border: 'none', borderRadius: C.rSm, padding: '8px 20px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'default', fontFamily: C.font }}>{profile.ctaText || 'Work With Me'}</button>
          </div>
          {profile.niches.length > 0 && (
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.primaryBg}`, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {profile.niches.map(n => (
                <span key={n} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: C.rXs, background: `${profile.primaryColor}15`, color: profile.primaryColor, border: `1px solid ${profile.primaryColor}30` }}>{n}</span>
              ))}
            </div>
          )}
          <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', textAlign: 'center', gap: 8, borderBottom: `1px solid ${C.primaryBg}` }}>
            {[
              { label: 'Videos', val: profile.videos.length },
              { label: 'Services', val: profile.rates.length },
              { label: 'Reviews', val: profile.testimonials.length },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontWeight: 800, fontSize: 16, color: theme.fg }}>{s.val || '—'}</p>
                <p style={{ fontSize: 10, color: `${theme.fg}55` }}>{s.label}</p>
              </div>
            ))}
          </div>
          {Object.values(profile.links).some(Boolean) && (
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {SOCIAL_FIELDS.filter(s => profile.links[s.id]).map(s => (
                <span key={s.id} style={{ fontSize: 18, cursor: 'default' }}>{s.icon}</span>
              ))}
            </div>
          )}
          <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: `1px solid ${C.primaryBg}` }}>
            <p style={{ fontSize: 10, color: `${theme.fg}30` }}>Made with Nexfluence</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudioPage() {
  const router = useRouter()
  const { isMobile, isDesktop, w } = useBreakpoint()
  const [tab, setTab] = useState<Tab>('header')
  const [profile, setProfile] = useState<Profile>(INIT)
  const [device, setDevice] = useState('Desktop')
  const [showPreview, setShowPreview] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [inboxUnread, setInboxUnread] = useState(0)
  const [toast, setToast] = useState('')
  const showToast = (msg: string, ms = 2200) => { setToast(msg); setTimeout(() => setToast(''), ms) }

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/authenticate'); return }
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${API}/profile/me`,    { headers }).then(r => r.json()),
      fetch(`${API}/media/videos`,  { headers }).then(r => r.json()),
      fetch(`${API}/rates`,         { headers }).then(r => r.json()),
      fetch(`${API}/cases`,         { headers }).then(r => r.json()),
      fetch(`${API}/testimonials`,  { headers }).then(r => r.json()),
      fetch(`${API}/links`,         { headers }).then(r => r.json()),
      fetch(`${API}/media/photos`,  { headers }).then(r => r.json()).catch(() => ({ success: false })),
    ])
      .then(([userRes, videosRes, ratesRes, casesRes, testiRes, linksRes, photosRes]) => {
        const u = userRes.data?.user ?? {}
        const videos = (videosRes.data?.videos ?? []).map((v: any) => ({ ...v, id: v._id }))
        const rates = (ratesRes.data?.rates ?? []).map((r: any) => ({ ...r, id: r._id }))
        const cases = (casesRes.data?.cases ?? []).map((c: any) => ({ ...c, id: c._id }))
        const testis = (testiRes.data?.testimonials ?? []).map((t: any) => ({ ...t, id: t._id }))
        const photos = (photosRes?.data?.photos ?? []).map((p: any) => ({ id: p._id || p.id, url: p.url }))
        const linksRaw = linksRes.data?.links ?? {}

        setProfile({
          name: u.name ?? '', bio: u.bio ?? '', location: u.location ?? '',
          profilePic: u.profilePicUrl ?? null, ctaText: u.ctaText ?? 'Work With Me', niches: u.niches ?? [], slug: u.slug ?? '',
          videos, photos, rates, cases, testimonials: testis,
          links: {
            instagram: linksRaw.instagram ?? '', tiktok: linksRaw.tiktok ?? '', youtube: linksRaw.youtube ?? '',
            linkedin: linksRaw.linkedin ?? '', pinterest: linksRaw.pinterest ?? '', x: linksRaw.x ?? '',
            website: linksRaw.website ?? '', email: linksRaw.email ?? '',
          },
          theme: u.theme ?? 'minimal', primaryColor: u.primaryColor ?? C.primary, accentColor: u.accentColor ?? C.primaryLt, font: 'Rubik',
        })
      })
      .catch(console.error)
      .finally(() => setPageLoading(false))
  }, [])

  if (w === 0 || pageLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bgPage, fontFamily: C.font }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: `3px solid ${C.primaryBg}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: C.inkDim, fontSize: 14 }}>Loading your studio…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: C.font, background: C.bgPage, overflow: 'hidden' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, flexShrink: 0, background: C.bg, borderBottom: `1px solid ${C.primaryBg}`, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`, color: C.inkDim, textDecoration: 'none', fontSize: 15 }}>←</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: C.rSm, flexShrink: 0, overflow: 'hidden', background: 'transparent' }}>
              <img src="/Nex.webp" alt="Creator Nexus" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            {!isMobile && <span style={{ fontWeight: 700, fontSize: 15, color: C.ink, letterSpacing: '-0.02em' }}>Portfolio Studio</span>}
          </div>
          {/* Replaced Upgrade badge with Dashboard button */}
          <Link
            href="/dashboard"
            style={{
              background: C.primaryBg,
              border: `1px solid ${C.primaryBg}`,
              borderRadius: C.rXs,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: C.primary,
              textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.primary
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = C.primaryBg
              e.currentTarget.style.color = C.primary
            }}
          >
            Dashboard
          </Link>
        </div>
        {isDesktop && tab !== 'inbox' && (
          <div style={{ display: 'flex', background: C.primaryBg, borderRadius: C.rSm, padding: 3 }}>
            {['Desktop', 'Tablet', 'Mobile'].map(d => (
              <button key={d} onClick={() => setDevice(d)} style={{
                padding: '6px 14px', borderRadius: C.rSm, border: 'none', cursor: 'pointer',
                background: device === d ? C.bg : 'transparent',
                color: device === d ? C.ink : C.inkDim,
                fontSize: 13, fontWeight: device === d ? 700 : 500,
                fontFamily: C.font,
                boxShadow: device === d ? C.shadowSm : 'none',
                transition: 'all 0.15s ease',
              }}>{d}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isMobile && (
            <button onClick={() => setShowPreview(p => !p)} style={{ padding: '8px 14px', borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`, background: C.bg, color: C.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font }}>
              {showPreview ? '← Edit' : 'Preview'}
            </button>
          )}
          <button
            onClick={() => {
              if (!profile.slug) {
                showToast('Create a username for your profile')
                return
              }
              window.open(`https://nexus.nexfluence.eu/profile/${profile.slug}`, '_blank')
            }}
            style={{ padding: '8px 16px', borderRadius: C.rSm, border: 'none', background: C.grad, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6 }}
          >Preview ↗</button>
          {!isMobile && (
            <button
              onClick={() => {
                if (!profile.slug) {
                  showToast('Create a username for your profile')
                  return
                }
                navigator.clipboard.writeText(`https://nexus.nexfluence.eu/profile/${profile.slug}`)
                showToast('Link copied!')
              }}
              style={{ padding: '8px 14px', borderRadius: C.rSm, border: `1.5px solid ${C.primaryBg}`, background: C.bg, color: C.inkDim, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 6 }}
            ><LinkIcon size={14} /> Copy link</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {(!isMobile || !showPreview) && (
          <div style={{
            width: isMobile ? '100%' : isDesktop ? 200 : 56, flexShrink: 0,
            background: C.bg, borderRight: `1px solid ${C.primaryBg}`,
            display: 'flex', flexDirection: isMobile ? 'row' : 'column',
            overflowX: isMobile ? 'auto' : 'visible', overflowY: isMobile ? 'visible' : 'auto',
          }}>
            {NAV.map(n => {
              const active = tab === n.id
              const unread = n.id === 'inbox' ? inboxUnread : 0
              return (
                <button key={n.id} onClick={() => setTab(n.id)} style={{
                  display: 'flex',
                  flexDirection: isDesktop ? 'row' : 'column',
                  alignItems: 'center',
                  justifyContent: isDesktop ? 'flex-start' : 'center',
                  gap: isDesktop ? 10 : 4,
                  padding: isDesktop ? '12px 16px' : isMobile ? '12px 16px' : '14px 8px',
                  border: 'none', cursor: 'pointer',
                  background: active ? C.primaryBg : 'transparent',
                  borderLeft: isDesktop ? (active ? `3px solid ${C.primary}` : '3px solid transparent') : 'none',
                  borderBottom: isMobile ? (active ? `3px solid ${C.primary}` : '3px solid transparent') : 'none',
                  transition: 'all 0.15s ease', flexShrink: 0,
                  fontFamily: C.font, whiteSpace: 'nowrap',
                  position: 'relative',
                }}>
                  <span style={{ fontSize: isDesktop ? 17 : 20, position: 'relative', color: active ? C.primary : C.inkDim }}>
                    {n.icon}
                    {unread > 0 && !active && (
                      <span style={{ position: 'absolute', top: -4, right: -6, width: 16, height: 16, borderRadius: '50%', background: C.primary, color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, border: `2px solid ${C.bg}` }}>{unread}</span>
                    )}
                  </span>
                  {(isDesktop || isMobile) && (
                    <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: active ? 700 : 500, color: active ? C.primary : C.inkDim, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {n.label}
                      {isDesktop && unread > 0 && (
                        <span style={{ background: C.primary, color: '#fff', borderRadius: C.rXs, padding: '1px 6px', fontSize: 9, fontWeight: 900 }}>{unread}</span>
                      )}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {!isMobile && tab !== 'inbox' && (
          <div style={{ width: isDesktop ? 380 : '100%', flexShrink: 0, background: C.bg, overflowY: 'auto', borderRight: `1px solid ${C.primaryBg}`, padding: '28px 24px' }}>
            {tab === 'header' && <HeaderTab profile={profile} setProfile={setProfile} />}
            {tab === 'media' && <MediaTab profile={profile} setProfile={setProfile} />}
            {tab === 'rates' && <RatesTab profile={profile} setProfile={setProfile} />}
            {tab === 'cases' && <CasesTab profile={profile} setProfile={setProfile} />}
            {tab === 'testimonials' && <TestimonialsTab profile={profile} setProfile={setProfile} />}
            {tab === 'links' && <LinksTab profile={profile} setProfile={setProfile} />}
            {tab === 'design' && <DesignTab profile={profile} setProfile={setProfile} />}
          </div>
        )}

        {tab === 'inbox' && !isMobile && <InboxTab onUnreadChange={setInboxUnread} />}
        {tab === 'inbox' && isMobile && !showPreview && <InboxTab onUnreadChange={setInboxUnread} />}

        {isMobile && !showPreview && tab !== 'inbox' && (
          <div style={{ flex: 1, background: C.bg, overflowY: 'auto', padding: '20px 16px' }}>
            {tab === 'header' && <HeaderTab profile={profile} setProfile={setProfile} />}
            {tab === 'media' && <MediaTab profile={profile} setProfile={setProfile} />}
            {tab === 'rates' && <RatesTab profile={profile} setProfile={setProfile} />}
            {tab === 'cases' && <CasesTab profile={profile} setProfile={setProfile} />}
            {tab === 'testimonials' && <TestimonialsTab profile={profile} setProfile={setProfile} />}
            {tab === 'links' && <LinksTab profile={profile} setProfile={setProfile} />}
            {tab === 'design' && <DesignTab profile={profile} setProfile={setProfile} />}
          </div>
        )}

        {tab !== 'inbox' && (isDesktop || (isMobile && showPreview)) && (
          <LivePreview profile={profile} device={device} />
        )}
      </div>

      <Toast msg={toast} />

      <style>{`
        * { box-sizing: border-box; }
        textarea { font-family: ${C.font}; }
        select { font-family: ${C.font}; }
        input::placeholder, textarea::placeholder { color: ${C.inkFaint}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.primaryBg}; border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
