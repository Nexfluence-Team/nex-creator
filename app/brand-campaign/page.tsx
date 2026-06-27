'use client'

import { useState, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   New Campaign — app/brand/campaign/new/page.tsx  (Nexfluence v4, LIGHT)
   5-step wizard. Left sidebar navigation only — no mobile pill rows,
   no progress bars, no step numbering. Header matches dashboard exactly.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

/* ─── Types ──────────────────────────────────────────────────────── */
type Objective  = 'awareness' | 'consideration' | 'conversions' | 'app'
type Gender     = 'all' | 'male' | 'female'
type BudgetType = 'flat' | 'commission' | 'hybrid'

interface CampaignDraft {
  objective:     Objective | null
  name:          string
  description:   string
  dos:           string
  donts:         string
  guidelines:    string
  ageMin:        number
  ageMax:        number
  gender:        Gender
  locations:     string[]
  niches:        string[]
  languages:     string[]
  budgetType:    BudgetType
  flatBudget:    string
  commissionPct: string
  startDate:     string
  endDate:       string
  piecesRequired: number
}

const DEFAULT: CampaignDraft = {
  objective: null,
  name: '', description: '', dos: '', donts: '', guidelines: '',
  ageMin: 18, ageMax: 45,
  gender: 'all',
  locations: ['Latvia'],
  niches: [],
  languages: ['English'],
  budgetType: 'commission',
  flatBudget: '',
  commissionPct: '15',
  startDate: '', endDate: '',
  piecesRequired: 3,
}

/* ─── Options ────────────────────────────────────────────────────── */
const ALL_LOCATIONS = ['Latvia','Lithuania','Estonia','Finland','Sweden','Germany','Poland','Netherlands','United Kingdom','Rest of EU']
const ALL_NICHES    = ['Fitness & Training','Sports Nutrition','Wellness','Beauty','Lifestyle','Food & Drink','Travel','Tech','Gaming','Fashion','Parenting','Finance','Education','Music','Comedy']
const ALL_LANGUAGES = ['English','Latvian','Lithuanian','Estonian','Russian','Swedish','Finnish','German']

const STEPS = [
  { n: 1, label: 'Objective'  },
  { n: 2, label: 'Brief'      },
  { n: 3, label: 'Audience'   },
  { n: 4, label: 'Budget'     },
  { n: 5, label: 'Review'     },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function Check({ s = 12 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevLeft({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ChevRight({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SearchIcon({ s = 18 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>
}
function XIcon({ s = 11 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
}
function SpeakerIcon({ s = 28 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function HeartIcon({ s = 28 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CartIcon({ s = 28 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function AppIcon({ s = 28 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 18h.01M9 6h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>
}
function CalIcon({ s = 15 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function PercentIcon({ s = 24 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="6.5" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="17.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function CoinsIcon({ s = 24 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.8"/><path d="M10.67 4A6 6 0 0116 14.33M13 16a5 5 0 100-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.8"/></svg>
}
function MixIcon({ s = 24 }: { s?: number }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9"  cy="6"  r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="15" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="9"  cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/></svg>
}

/* ════════════════════════════════════════════════════════════════════
   LEFT SIDEBAR — text-only, no circles, no numbers, no dots
   Active step has a 3px gradient left bar and gradient text.
   Done steps are dimmer with a tiny check.
   ════════════════════════════════════════════════════════════════════ */
function Sidebar({ current, completed, onJump }: {
  current: number
  completed: Set<number>
  onJump: (n: number) => void
}) {
  return (
    <nav className="flex w-[190px] flex-shrink-0 flex-col gap-0.5" aria-label="Campaign builder steps">
      {/* Section label */}
      <p className="mb-3 px-4 text-[10.5px] font-black uppercase tracking-[0.22em] text-ink/30">Campaign setup</p>

      {STEPS.map(s => {
        const done   = completed.has(s.n)
        const active = s.n === current
        const canGo  = done || s.n === current   /* only jump to completed or current */

        return (
          <button
            key={s.n}
            type="button"
            disabled={!canGo}
            onClick={() => canGo && onJump(s.n)}
            className={`
              relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[13.5px] font-semibold
              transition-all duration-150 disabled:cursor-default
              ${active
                ? 'bg-primary/[0.07] text-primary'
                : done
                  ? 'text-ink/50 hover:bg-primary/[0.04] hover:text-ink/70'
                  : 'cursor-default text-ink/25'}
            `}
          >
            {/* Active accent bar */}
            {active && (
              <span className={`absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-full ${GRAD_BTN}`}/>
            )}
            <span className="flex-1 pl-1">{s.label}</span>
            {done && !active && (
              <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/[0.10] text-primary">
                <Check s={9}/>
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SHARED FORM PRIMITIVES — same tokens as brand dashboard
   ════════════════════════════════════════════════════════════════════ */
const INP = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/30 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'
const LBL = 'mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.10em] text-ink/45'

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className={LBL}>{children}</p>
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[12.5px] font-semibold text-primary">
      {label}
      <button type="button" onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full text-primary/60 transition hover:bg-primary/[0.14] hover:text-primary">
        <XIcon s={9}/>
      </button>
    </span>
  )
}

function PillGrid({ label, all, selected, onToggle }: {
  label: string; all: string[]; selected: string[]; onToggle: (v: string) => void
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {all.map(item => {
          const on = selected.includes(item)
          return (
            <button key={item} type="button" onClick={() => onToggle(item)}
              className={`flex items-center gap-1.5 rounded-xl border-[1.5px] px-3.5 py-2 text-[13px] font-semibold transition ${
                on
                  ? `border-primary/30 ${GRAD_BTN} text-white shadow-[0_4px_10px_-4px_rgba(139,49,232,0.38)]`
                  : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25 hover:text-primary'
              }`}>
              {on && <Check s={10}/>}
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Age range dual-handle slider ─────────────────────────────── */
function AgeSlider({ min, max, onChange }: {
  min: number; max: number; onChange: (mn: number, mx: number) => void
}) {
  const MIN = 13, MAX = 65, SPAN = MAX - MIN
  const trackRef = useRef<HTMLDivElement>(null)

  const pct  = (v: number) => ((v - MIN) / SPAN) * 100
  const clmp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v)))

  const xToVal = (cx: number) => {
    const el = trackRef.current; if (!el) return MIN
    const { left, width } = el.getBoundingClientRect()
    return clmp(((cx - left) / width) * SPAN + MIN)
  }

  const drag = (handle: 'min' | 'max') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const move = (ev: MouseEvent | TouchEvent) => {
      const cx = 'touches' in ev ? ev.touches[0]!.clientX : ev.clientX
      const v = xToVal(cx)
      if (handle === 'min') onChange(Math.min(v, max - 1), max)
      else                  onChange(min, Math.max(v, min + 1))
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', up)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <FieldLabel>Age range</FieldLabel>
        <span className="text-[13.5px] font-bold text-ink">{min}–{max === MAX ? `${MAX}+` : max}</span>
      </div>
      <div ref={trackRef} className="relative mx-2 h-[6px] cursor-pointer rounded-full bg-primary/[0.10]">
        <div className={`absolute top-0 h-full rounded-full ${GRAD_BTN}`}
          style={{ left: `${pct(min)}%`, width: `${pct(max) - pct(min)}%` }}/>
        {(['min', 'max'] as const).map(h => (
          <button key={h} type="button"
            className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary bg-white shadow-md active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            style={{ left: `${pct(h === 'min' ? min : max)}%` }}
            onMouseDown={drag(h)} onTouchStart={drag(h)}/>
        ))}
      </div>
      <div className="mt-3.5 flex justify-between px-1 text-[11px] font-semibold text-ink/30">
        {[13, 18, 25, 35, 45, 55, '65+'].map(t => <span key={t}>{t}</span>)}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 1 — OBJECTIVE
   ════════════════════════════════════════════════════════════════════ */
const OBJECTIVES = [
  { id: 'awareness'     as Objective, title: 'Awareness',     sub: 'Reach & impressions',   desc: 'Introduce your brand to new audiences. Best for new product launches or entering new markets.',                             icon: <SpeakerIcon s={26}/>, color: '#8B31E8', bg: '#f5f0fe' },
  { id: 'consideration' as Objective, title: 'Consideration', sub: 'Traffic & engagement',  desc: 'Drive people to learn more — visits, profile views, saves and meaningful engagement with your brand.',                    icon: <HeartIcon   s={26}/>, color: '#2563EB', bg: '#eff4fe' },
  { id: 'conversions'   as Objective, title: 'Conversions',   sub: 'Sales & sign-ups',      desc: 'Move people to act. Track clicks, purchases, and affiliate conversions with full attribution.',                           icon: <CartIcon    s={26}/>, color: '#DB2777', bg: '#fdf0f7' },
  { id: 'app'           as Objective, title: 'App Promotion', sub: 'Installs & engagement', desc: "Drive installs or re-engagement for your mobile or web app via creator deep-links.",                                       icon: <AppIcon     s={26}/>, color: '#D97706', bg: '#fffbeb' },
]

function Step1({ draft, update }: { draft: CampaignDraft; update: (p: Partial<CampaignDraft>) => void }) {
  return (
    <div>
      <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">What's the goal of this campaign?</h2>
      <p className="mt-1 text-[13.5px] leading-[1.6] text-ink/50">Your objective shapes how Nexfluence scores creator matches and which metrics it optimises for.</p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OBJECTIVES.map(obj => {
          const sel = draft.objective === obj.id
          return (
            <button key={obj.id} type="button" onClick={() => update({ objective: obj.id })}
              className={`group relative flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                sel
                  ? 'border-primary/30 bg-primary/[0.03] shadow-[0_0_0_1px_rgba(139,49,232,0.15),0_6px_20px_-6px_rgba(139,49,232,0.28)]'
                  : `border-primary/10 bg-white hover:border-primary/22 ${CARD}`
              }`}>
              {/* Icon badge */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition"
                style={{ background: obj.bg, color: obj.color }}>
                {obj.icon}
              </div>
              {/* Text */}
              <div className="flex-1 pt-0.5">
                <p className="text-[14.5px] font-extrabold tracking-[-0.01em] text-ink">{obj.title}</p>
                <p className="mt-0.5 text-[11.5px] font-bold uppercase tracking-[0.08em]" style={{ color: obj.color }}>{obj.sub}</p>
                <p className="mt-2 text-[12.5px] leading-[1.65] text-ink/55">{obj.desc}</p>
              </div>
              {/* Radio circle */}
              <div className={`absolute right-4 top-4 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                sel ? `border-primary ${GRAD_BTN}` : 'border-primary/25 bg-white'
              }`}>
                {sel && <Check s={10}/>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 2 — BRIEF
   ════════════════════════════════════════════════════════════════════ */
function Step2({ draft, update }: { draft: CampaignDraft; update: (p: Partial<CampaignDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Write your campaign brief</h2>
        <p className="mt-1 text-[13.5px] leading-[1.6] text-ink/50">Creators read this before applying. Be specific — the clearer your brief, the better the matches.</p>
      </div>

      <div>
        <FieldLabel>Campaign name *</FieldLabel>
        <input className={INP} value={draft.name} onChange={e => update({ name: e.target.value })}
          placeholder="e.g. Vitamin-C Recovery Stack — Summer 2026"/>
      </div>

      <div>
        <FieldLabel>What is this campaign about? *</FieldLabel>
        <textarea className={`${INP} min-h-[96px] resize-y leading-relaxed`}
          value={draft.description} onChange={e => update({ description: e.target.value })}
          placeholder="Describe the product, the story you want told, and why it matters to your audience. What result do you want creators to show over what timeframe?"/>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full bg-emerald-100 text-[9px] font-black text-emerald-600">✓</span>
              Do's — what to include
            </span>
          </FieldLabel>
          <textarea className={`${INP} min-h-[120px] resize-y leading-relaxed`}
            value={draft.dos} onChange={e => update({ dos: e.target.value })}
            placeholder={"Show authentic before/after results\nInclude product in real training context\nMention third-party testing\nTag our brand handle"}/>
        </div>
        <div>
          <FieldLabel>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full bg-rose-100 text-[9px] font-black text-rose-500">✕</span>
              Don'ts — what to avoid
            </span>
          </FieldLabel>
          <textarea className={`${INP} min-h-[120px] resize-y leading-relaxed`}
            value={draft.donts} onChange={e => update({ donts: e.target.value })}
            placeholder={"No comparison to competitors\nNo medicinal/disease-cure claims\nNo overly filtered visuals\nDo not remove product branding"}/>
        </div>
      </div>

      <div>
        <FieldLabel>Additional guidelines (optional)</FieldLabel>
        <textarea className={`${INP} min-h-[72px] resize-y leading-relaxed`}
          value={draft.guidelines} onChange={e => update({ guidelines: e.target.value })}
          placeholder="Tone of voice, required hashtags, posting windows, usage rights, format preferences…"/>
      </div>

      <div className={`flex gap-3 rounded-2xl border border-primary/10 bg-primary/[0.025] p-4 ${CARD}`}>
        <span className="text-[16px]">💡</span>
        <p className="text-[12.5px] leading-[1.7] text-ink/55">
          <span className="font-bold text-ink">Pro tip:</span> Briefs with specific result targets — "show real recovery over 14 days" — get 2.3× more high-quality applications than vague ones.
        </p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 3 — AUDIENCE
   ════════════════════════════════════════════════════════════════════ */
function Step3({ draft, update }: { draft: CampaignDraft; update: (p: Partial<CampaignDraft>) => void }) {
  const toggle = (field: 'locations' | 'niches' | 'languages', val: string) => {
    const arr = draft[field]
    update({ [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] })
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Define your target audience</h2>
        <p className="mt-1 text-[13.5px] leading-[1.6] text-ink/50">Nexfluence uses this to surface creators whose follower demographics match who you want to reach.</p>
      </div>

      {/* Age */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <AgeSlider min={draft.ageMin} max={draft.ageMax}
          onChange={(mn, mx) => update({ ageMin: mn, ageMax: mx })}/>
      </div>

      {/* Gender */}
      <div>
        <FieldLabel>Gender</FieldLabel>
        <div className="flex flex-wrap gap-2.5">
          {(['all', 'male', 'female'] as Gender[]).map(g => (
            <button key={g} type="button" onClick={() => update({ gender: g })}
              className={`flex items-center gap-2 rounded-xl border-[1.5px] px-5 py-2.5 text-[13px] font-bold capitalize transition ${
                draft.gender === g
                  ? `border-primary/25 ${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.38)]`
                  : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'
              }`}>
              {draft.gender === g && <Check s={11}/>}
              {g === 'all' ? 'All genders' : g === 'male' ? 'Male' : 'Female'}
            </button>
          ))}
        </div>
      </div>

      <PillGrid label="Target locations *" all={ALL_LOCATIONS}
        selected={draft.locations} onToggle={v => toggle('locations', v)}/>

      <PillGrid label="Creator niches" all={ALL_NICHES}
        selected={draft.niches} onToggle={v => toggle('niches', v)}/>

      <PillGrid label="Content languages" all={ALL_LANGUAGES}
        selected={draft.languages} onToggle={v => toggle('languages', v)}/>

      {/* Selected tags summary */}
      {(draft.locations.length > 0 || draft.niches.length > 0 || draft.languages.length > 0) && (
        <div>
          <FieldLabel>Selected</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {draft.locations.map(l  => <Tag key={l}  label={`📍 ${l}`}  onRemove={() => toggle('locations', l)}/>)}
            {draft.niches.map(n     => <Tag key={n}  label={`# ${n}`}   onRemove={() => toggle('niches', n)}/>)}
            {draft.languages.map(l  => <Tag key={l}  label={`🗣 ${l}`}  onRemove={() => toggle('languages', l)}/>)}
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 4 — BUDGET & SCHEDULE
   ════════════════════════════════════════════════════════════════════ */
const BUDGET_TYPES = [
  { id: 'commission' as BudgetType, title: 'Commission',     sub: '% per sale',           icon: <PercentIcon s={22}/>, desc: 'Pay creators a % of every sale they drive. No upfront cost — incentives fully aligned.' },
  { id: 'flat'       as BudgetType, title: 'Flat fee',       sub: 'Per deliverable',      icon: <CoinsIcon   s={22}/>, desc: 'Fixed amount per piece of content. Clear costs, fast agreements, usage rights included.'  },
  { id: 'hybrid'     as BudgetType, title: 'Hybrid',         sub: 'Base fee + commission',icon: <MixIcon     s={22}/>, desc: 'A base fee guarantees commitment; commission rewards performance. Best for conversions.'   },
]

function Step4({ draft, update }: { draft: CampaignDraft; update: (p: Partial<CampaignDraft>) => void }) {
  const bt = draft.budgetType
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Budget & schedule</h2>
        <p className="mt-1 text-[13.5px] leading-[1.6] text-ink/50">How you'll pay creators and when the campaign runs. Adjust per creator after matching.</p>
      </div>

      {/* Payment model */}
      <div>
        <FieldLabel>Payment model</FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {BUDGET_TYPES.map(b => {
            const sel = bt === b.id
            return (
              <button key={b.id} type="button" onClick={() => update({ budgetType: b.id })}
                className={`flex flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-all ${
                  sel
                    ? 'border-primary/30 bg-primary/[0.03] shadow-[0_0_0_1px_rgba(139,49,232,0.14),0_6px_20px_-6px_rgba(139,49,232,0.26)]'
                    : `border-primary/10 bg-white hover:border-primary/22 ${CARD}`
                }`}>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  sel ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.42)]` : 'bg-primary/[0.08] text-primary'
                }`}>
                  {b.icon}
                </div>
                <div>
                  <p className="text-[13.5px] font-extrabold text-ink">{b.title}</p>
                  <p className="text-[11px] font-semibold text-ink/40">{b.sub}</p>
                  <p className="mt-1.5 text-[12px] leading-[1.6] text-ink/55">{b.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Amount inputs */}
      <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(bt === 'flat' || bt === 'hybrid') && (
            <div>
              <FieldLabel>{bt === 'hybrid' ? 'Base flat fee per creator (€)' : 'Flat fee per deliverable (€)'}</FieldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/40">€</span>
                <input type="number" min={0} className={`${INP} pl-8`}
                  value={draft.flatBudget} onChange={e => update({ flatBudget: e.target.value })}
                  placeholder="350"/>
              </div>
            </div>
          )}
          {(bt === 'commission' || bt === 'hybrid') && (
            <div>
              <FieldLabel>Commission rate</FieldLabel>
              <div className="relative">
                <input type="number" min={1} max={50} className={`${INP} pr-8`}
                  value={draft.commissionPct} onChange={e => update({ commissionPct: e.target.value })}
                  placeholder="15"/>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-ink/40">%</span>
              </div>
              <p className="mt-1.5 text-[11px] text-ink/35">Industry avg for fitness/nutrition: 10–20%</p>
            </div>
          )}
        </div>
      </div>

      {/* Content pieces */}
      <div>
        <FieldLabel>Pieces of content required per creator</FieldLabel>
        <div className="flex flex-wrap gap-2.5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button key={n} type="button" onClick={() => update({ piecesRequired: n })}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border-[1.5px] text-[14px] font-extrabold transition ${
                draft.piecesRequired === n
                  ? `border-primary/25 ${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.38)]`
                  : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'
              }`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {([['startDate', 'Start date'], ['endDate', 'End date']] as const).map(([field, lbl]) => (
          <div key={field}>
            <FieldLabel>{lbl}</FieldLabel>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary/50"><CalIcon s={15}/></span>
              <input type="date" className={`${INP} pl-10`}
                value={draft[field]} onChange={e => update({ [field]: e.target.value })}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 5 — REVIEW
   ════════════════════════════════════════════════════════════════════ */
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-primary/8 py-3 last:border-0">
      <span className="flex-shrink-0 text-[12px] font-bold uppercase tracking-[0.07em] text-ink/35">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">
        {value ?? <span className="italic text-ink/25">Not set</span>}
      </span>
    </div>
  )
}

function ReviewBlock({ title, step, onEdit, children }: { title: string; step: number; onEdit: (n: number) => void; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11.5px] font-extrabold uppercase tracking-[0.12em] text-ink/40">{title}</p>
        <button type="button" onClick={() => onEdit(step)}
          className="text-[12.5px] font-bold text-primary transition hover:underline">Edit</button>
      </div>
      {children}
    </div>
  )
}

function Step5({ draft, onEdit }: { draft: CampaignDraft; onEdit: (n: number) => void }) {
  const obj = OBJECTIVES.find(o => o.id === draft.objective)
  const bt  = BUDGET_TYPES.find(b => b.id === draft.budgetType)
  const budgetSummary = draft.budgetType === 'flat'
    ? `€${draft.flatBudget || '—'} per deliverable`
    : draft.budgetType === 'commission'
    ? `${draft.commissionPct || '—'}% commission`
    : `€${draft.flatBudget || '—'} + ${draft.commissionPct || '—'}%`

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">Review your campaign</h2>
        <p className="mt-1 text-[13.5px] leading-[1.6] text-ink/50">Everything look right? Click Search for Creators to see your matches.</p>
      </div>

      <ReviewBlock title="Objective" step={1} onEdit={onEdit}>
        {obj
          ? <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: obj.bg, color: obj.color }}>{obj.icon}</div>
              <div>
                <p className="text-[14px] font-extrabold text-ink">{obj.title}</p>
                <p className="text-[11.5px] font-semibold text-ink/45">{obj.sub}</p>
              </div>
            </div>
          : <p className="text-[13px] italic text-ink/30">No objective selected</p>
        }
      </ReviewBlock>

      <ReviewBlock title="Brief" step={2} onEdit={onEdit}>
        <Row label="Name"        value={draft.name}/>
        <Row label="Description" value={draft.description ? <span className="line-clamp-2 text-left text-[13px] leading-[1.5] text-ink/65">{draft.description}</span> : null}/>
        <Row label="Do's"        value={draft.dos   ? <span className="whitespace-pre-line text-left text-[12.5px] leading-[1.5] text-ink/65">{draft.dos}</span>   : null}/>
        <Row label="Don'ts"      value={draft.donts ? <span className="whitespace-pre-line text-left text-[12.5px] leading-[1.5] text-ink/65">{draft.donts}</span> : null}/>
      </ReviewBlock>

      <ReviewBlock title="Audience" step={3} onEdit={onEdit}>
        <Row label="Age"       value={`${draft.ageMin}–${draft.ageMax === 65 ? '65+' : draft.ageMax}`}/>
        <Row label="Gender"    value={draft.gender === 'all' ? 'All genders' : draft.gender}/>
        <Row label="Locations" value={draft.locations.join(', ') || null}/>
        <Row label="Niches"    value={draft.niches.join(', ')    || null}/>
        <Row label="Languages" value={draft.languages.join(', ') || null}/>
      </ReviewBlock>

      <ReviewBlock title="Budget & schedule" step={4} onEdit={onEdit}>
        <Row label="Model"   value={bt?.title}/>
        <Row label="Payment" value={budgetSummary}/>
        <Row label="Content" value={`${draft.piecesRequired} piece${draft.piecesRequired !== 1 ? 's' : ''} per creator`}/>
        <Row label="Dates"   value={draft.startDate && draft.endDate ? `${draft.startDate} → ${draft.endDate}` : draft.startDate || null}/>
      </ReviewBlock>

      <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <span className="text-[18px] leading-none">🚀</span>
        <p className="text-[12.5px] leading-[1.7] text-emerald-800">
          <span className="font-bold">Ready to search.</span> Nexfluence will rank creators by audience demographic match, niche relevance, and historical performance for your objective.
        </p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   VALIDATION
   ════════════════════════════════════════════════════════════════════ */
function canAdvance(step: number, d: CampaignDraft): boolean {
  if (step === 1) return d.objective !== null
  if (step === 2) return d.name.trim().length > 0 && d.description.trim().length > 0
  if (step === 3) return d.locations.length > 0
  if (step === 4) {
    if (d.budgetType === 'flat')       return d.flatBudget.trim().length > 0
    if (d.budgetType === 'commission') return d.commissionPct.trim().length > 0
    return d.flatBudget.trim().length > 0 && d.commissionPct.trim().length > 0
  }
  return true
}

/* ════════════════════════════════════════════════════════════════════
   PAGE — header identical to brand dashboard, sidebar-only nav
   ════════════════════════════════════════════════════════════════════ */
export default function NewCampaignPage() {
  const router = useRouter()
  const [step,      setStep]      = useState(1)
  const [draft,     setDraft]     = useState<CampaignDraft>(DEFAULT)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const mainRef = useRef<HTMLDivElement>(null)

  const update = (p: Partial<CampaignDraft>) => setDraft(prev => ({ ...prev, ...p }))

  const scrollTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const next = () => {
    if (!canAdvance(step, draft)) return
    setCompleted(prev => new Set([...prev, step]))
    setStep(s => s + 1)
    scrollTop()
  }

  const back = () => { setStep(s => s - 1); scrollTop() }

  const jump = (n: number) => { setStep(n); scrollTop() }

  const search = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nexfluence_campaign_draft', JSON.stringify(draft))
    }
    router.push('/brand/campaign/search')
  }

  const ok = canAdvance(step, draft)

  /* ─── Nav items — mirror dashboard exactly ─────────────────────── */
  const NAV_LEFT  = [
    { label: 'Dashboard',         active: false, action: () => router.push('/dashboard/brand') },
    { label: 'New Campaign',      active: true,  action: () => {} },
  ]
  const NAV_RIGHT = [
    { label: 'Save draft',        active: false, action: () => {} },
    { label: 'My Profile',        active: false, action: () => {} },
  ]

  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ HEADER — exact dashboard pattern ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            {/* Subtle side blush — mirrors dashboard */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>

            {/* Left */}
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_LEFT.map(n => (
                <button key={n.label} type="button" onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
                  {n.label}
                </button>
              ))}
            </div>

            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>

            {/* Right */}
            <div className="relative z-10 flex items-center gap-0.5">
              {NAV_RIGHT.map(n => (
                <button key={n.label} type="button" onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/60'}`}>
                  {n.label}
                </button>
              ))}
            </div>

            {/* Nexfluence logo — absolutely centred, overflowing, identical to dashboard */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.40)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main ref={mainRef} className="mx-auto max-w-[1080px] px-6 py-8">
        <div className="flex gap-10">

          {/* ── Left sidebar — desktop only, no bullets, no pills ── */}
          <div className="hidden w-[190px] flex-shrink-0 lg:block">
            <div className="sticky top-[84px]">
              <Sidebar current={step} completed={completed} onJump={jump}/>
            </div>
          </div>

          {/* ── Step content ── */}
          <div className="min-w-0 flex-1">

            {step === 1 && <Step1 draft={draft} update={update}/>}
            {step === 2 && <Step2 draft={draft} update={update}/>}
            {step === 3 && <Step3 draft={draft} update={update}/>}
            {step === 4 && <Step4 draft={draft} update={update}/>}
            {step === 5 && <Step5 draft={draft} onEdit={jump}/>}

            {/* ── Nav buttons ── */}
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-primary/10 pt-7">
              <button type="button"
                onClick={step > 1 ? back : () => router.push('/dashboard/brand')}
                className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-3 text-[13.5px] font-bold text-ink/55 transition hover:border-primary/30 hover:text-ink">
                <ChevLeft s={14}/>{step > 1 ? 'Back' : 'Cancel'}
              </button>

              {step < 5 ? (
                <button type="button" onClick={next} disabled={!ok}
                  className={`flex items-center gap-2 rounded-xl px-7 py-3 text-[13.5px] font-bold text-white transition ${
                    ok
                      ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`
                      : 'cursor-not-allowed bg-ink/10 text-ink/30'
                  }`}>
                  Continue<ChevRight s={14}/>
                </button>
              ) : (
                <button type="button" onClick={search}
                  className={`flex items-center gap-2.5 rounded-xl ${GRAD_BTN} px-8 py-3.5 text-[14.5px] font-bold text-white shadow-[0_10px_28px_-6px_rgba(139,49,232,0.50)] transition hover:-translate-y-0.5`}>
                  <SearchIcon s={17}/>Search for Creators
                </button>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}