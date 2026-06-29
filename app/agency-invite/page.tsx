'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Agency Invite Page — app/agency/invite/page.tsx  (Nexfluence v4, LIGHT)
   ════════════════════════════════════════════════════════════════════
   Route: /agency/invite
   Entry points:
     • "Invite a brand"  button on agency dashboard → ?type=brand
     • "Add to roster"   button on agency dashboard → ?type=creator
     • Direct navigation → shows type selector first

   FULL FLOW:
   ─────────────────────────────────────────────────────────────────
   COMMON:
     Step 0 — Type selector (brand / creator)
     Step 1 — Find or invite
               Sub-tab A: Search existing platform users
               Sub-tab B: Invite someone new by email

   IF INVITING NEW PERSON (sub-tab B):
     Step 2 — Enter details (name + email + personal note)
     Step 3 — Choose relationship scope
               • Brand:   Full management (retainer) | Single campaign
               • Creator: Full roster (exclusive option) | Single campaign
     Step 4 — Contract preview
               • Brand:   Agency management agreement auto-drafted
               • Creator: Creator roster agreement auto-drafted
     Step 5 — Send invitation → success screen

   IF FOUND ON PLATFORM (sub-tab A):
     Steps 2–3 same as above (scope + contract preview)
     Step 4 → Send connection request → success screen

   WHAT THE INVITED PERSON RECEIVES:
   ─────────────────────────────────────────────────────────────────
   An email with a "Review & accept" CTA. Clicking it opens Creator Nexus
   with a pre-filled acceptance dialog (shown here as AcceptancePreview):
     • See who is inviting them
     • Choose their permission level (Full management / Specific campaign)
     • Sign the auto-drafted contract
     • Confirm payment terms (for brands: retainer amount; for creators: fee structure)
   They can accept, counter-propose, or decline.

   CONTRACT DEFAULTS (auto-drafted from scope):
   ─────────────────────────────────────────────────────────────────
   Brand — Full management:
     • Agency management agreement
     • Monthly retainer (brand sets amount)
     • Agency acts on brand's behalf for all campaigns
     • 30-day notice period for termination
   Brand — Single campaign:
     • Campaign delivery agreement
     • One-time campaign fee (agency sets)
     • Scoped to specific campaign only
   Creator — Full roster:
     • Creator representation agreement
     • Agency fee: 15% of deal value per campaign
     • Exclusive option: cannot work with competitors
   Creator — Single campaign:
     • Campaign participation agreement
     • Agency introduces creator to brand
     • Creator paid directly by brand via Grade escrow
   ════════════════════════════════════════════════════════════════════ */

const CARD      = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN  = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TEXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'

const AGENCY = { name: 'Baltic Creators Agency', slug: 'baltic-creators-agency' }
const UNREAD_MESSAGE_COUNT = 5

/* ─── Types ──────────────────────────────────────────────────────── */
type InviteType      = 'brand' | 'creator'
type FindMode        = 'search' | 'new'
type BrandScope      = 'full_management' | 'single_campaign'
type CreatorScope    = 'full_roster' | 'single_campaign'
type Step            = 0 | 1 | 2 | 3 | 4

interface PlatformBrand   { id: string; name: string; industry: string; location: string; color: string; initials: string }
interface PlatformCreator { id: string; name: string; handle: string; niche: string; platform: string; followers: string; color: string; initials: string }

interface InviteFormState {
  /* Step 1 */
  findMode:          FindMode
  searchQuery:       string
  selectedBrandId:   string | null
  selectedCreatorId: string | null
  /* Step 2 — new person */
  contactName:       string
  contactEmail:      string
  personalNote:      string
  /* Step 3 — scope */
  brandScope:        BrandScope
  creatorScope:      CreatorScope
  exclusive:         boolean
  /* Brand-specific */
  monthlyRetainer:   string
  campaignBudget:    string
  campaignName:      string
  /* Creator-specific */
  agencyFee:         string
}

/* ─── Mock platform data ─────────────────────────────────────────── */
const PLATFORM_BRANDS: PlatformBrand[] = [
  { id: 'pb1', name: 'Vāre Coffee',       industry: 'Food & beverage', location: 'Riga, Latvia',        color: '#B45309', initials: 'VC' },
  { id: 'pb2', name: 'NordGlow',           industry: 'Beauty',          location: 'Tallinn, Estonia',    color: '#0E7490', initials: 'NG' },
  { id: 'pb3', name: 'ActiveBalt',         industry: 'Sportswear',      location: 'Vilnius, Lithuania',  color: '#15803D', initials: 'AB' },
  { id: 'pb4', name: 'Skrīveru Saldumi',  industry: 'Food & confectionery', location: 'Riga, Latvia',  color: '#9333EA', initials: 'SS' },
]
const PLATFORM_CREATORS: PlatformCreator[] = [
  { id: 'pc1', name: 'Elīna Krūmiņa',  handle: '@elina.kr',    niche: 'Lifestyle',     platform: 'Instagram', followers: '88K',  color: '#D97706', initials: 'EK' },
  { id: 'pc2', name: 'Kristaps B.',     handle: '@kristapsb',   niche: 'Sports',        platform: 'TikTok',    followers: '120K', color: '#2563EB', initials: 'KB' },
  { id: 'pc3', name: 'Liis Saar',       handle: '@liissaar',    niche: 'Food',          platform: 'Instagram', followers: '54K',  color: '#059669', initials: 'LS' },
  { id: 'pc4', name: 'Tomas Balsys',    handle: '@tomasbalsys', niche: 'Fitness',       platform: 'YouTube',   followers: '210K', color: '#DC2626', initials: 'TB' },
]

/* ─── Contract clause templates ─────────────────────────────────── */
const CONTRACT_CLAUSES = {
  brand_full: [
    { num: '1.1', text: 'Baltic Creators Agency ("Agency") shall manage all influencer marketing activities on behalf of the Brand on Creator Nexus, including campaign creation, creator selection, brief writing, content approval, and payment processing.' },
    { num: '1.2', text: 'The Brand authorises the Agency to act on its behalf for all Creator Nexus platform actions, including signing campaign contracts with individual creators.' },
    { num: '1.3', text: 'The monthly management retainer is payable on the 1st of each calendar month via the Grade escrow system. Late payment incurs a 1.5% monthly surcharge.' },
    { num: '1.4', text: 'Either party may terminate this agreement with 30 days written notice. Campaigns already in progress at termination shall be completed under these terms.' },
    { num: '1.5', text: 'All campaign performance data, creator contacts, and platform assets generated during this agreement remain the property of the Brand upon termination.' },
  ],
  brand_campaign: [
    { num: '1.1', text: 'The Agency shall plan and execute a single influencer marketing campaign on behalf of the Brand, as defined by the campaign brief agreed between both parties prior to launch.' },
    { num: '1.2', text: 'The one-time campaign delivery fee covers creator sourcing, brief creation, content coordination, and final reporting. It does not include media spend or creator fees.' },
    { num: '1.3', text: 'The campaign delivery fee is payable 50% upfront upon signature and 50% upon campaign completion, processed via the Grade escrow system.' },
    { num: '1.4', text: 'This agreement is scoped solely to the named campaign. Any additional campaigns require a separate agreement or upgrade to a full management arrangement.' },
  ],
  creator_full: [
    { num: '1.1', text: 'Baltic Creators Agency ("Agency") shall represent the Creator on Creator Nexus, including sourcing brand partnerships, negotiating deal terms, reviewing contracts, and managing payment flows on the Creator\'s behalf.' },
    { num: '1.2', text: 'The Agency shall earn a representation fee of 15% of the gross deal value of each campaign secured for the Creator. This fee is deducted automatically by Grade at the point of payout.' },
    { num: '1.3', text: 'The Creator retains full creative control over content. The Agency shall communicate brand feedback but shall not override the Creator\'s editorial judgment without prior agreement.' },
    { num: '1.4', text: 'Either party may terminate this representation with 14 days written notice. Any campaigns in negotiation or active at termination shall be completed under these terms.' },
  ],
  creator_full_exclusive: [
    { num: '1.1', text: 'Baltic Creators Agency ("Agency") shall exclusively represent the Creator on Creator Nexus. The Creator agrees not to accept direct brand partnerships or work with competing agencies on the platform during the term of this agreement.' },
    { num: '1.2', text: 'In consideration of exclusivity, the Agency commits to securing a minimum of two paid brand partnerships per calendar quarter for the Creator. If this minimum is not met, the exclusive clause may be waived for that quarter.' },
    { num: '1.3', text: 'The Agency shall earn a representation fee of 15% of the gross deal value of each campaign secured for the Creator. This fee is deducted automatically by Grade at the point of payout.' },
    { num: '1.4', text: 'Either party may terminate this exclusive representation with 30 days written notice. Any campaigns active at termination shall be completed under these terms.' },
  ],
  creator_campaign: [
    { num: '1.1', text: 'The Agency introduces the Creator to the Brand for a specific campaign, facilitating the connection and initial negotiation. The direct working relationship for campaign execution is between Creator and Brand.' },
    { num: '1.2', text: 'The Creator shall be paid directly by the Brand via the Grade escrow system. The Agency earns an introduction fee of 10% of the agreed creator fee, charged to the Brand.' },
    { num: '1.3', text: 'The Agency\'s role concludes upon the Creator and Brand reaching a signed contract. Any subsequent campaigns between the same Creator and Brand require a new introduction agreement.' },
  ],
}

/* ════════════════════════════════════════════════════════════════════
   ICONS — inline SVG only
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function BellIcon({ s = 18 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ChatBubbleIcon({ s = 18 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function BuildingIcon({ s = 20 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function UsersIcon({ s = 20 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M2 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 20v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ArrowLeftIcon({ s = 16 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ArrowRightIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function CheckIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 14 }: { s?: number })          { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function SearchIcon({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function SendIcon({ s = 15 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M21 3L11 13M21 3l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function MailIcon({ s = 20 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ShieldCheckIcon({ s = 18 }: { s?: number }){ return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function FileTextIcon({ s = 18 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> }
function RepeatIcon({ s = 18 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ZapIcon({ s = 18 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 18 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SparkleIcon({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M16.3 7.7l2.1-2.1M5.6 18.4l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function InfoIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }

/* ─── Logo tile ──────────────────────────────────────────────────── */
function LogoTile({ name, color, initials, size = 40 }: { name: string; color: string; initials?: string; size?: number }) {
  const abbr = initials ?? name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="flex flex-shrink-0 items-center justify-center rounded-xl font-extrabold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}>
      {abbr}
    </div>
  )
}

/* ─── Field atoms ────────────────────────────────────────────────── */
const inputCls = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 font-rubik text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

function FL({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="mb-1.5 flex items-center justify-between text-[12px] font-bold uppercase tracking-[0.07em] text-ink/50">
      <span>{children}</span>
      {hint && <span className="normal-case font-normal tracking-normal text-ink/35">{hint}</span>}
    </label>
  )
}
function TF({ label, value, onChange, placeholder, hint, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string; type?: string }) {
  return (
    <div>
      <FL hint={hint}>{label}</FL>
      <input className={inputCls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}/>
    </div>
  )
}
function TA({ label, value, onChange, placeholder, maxLength }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return (
    <div>
      <FL hint={maxLength ? `${value.length}/${maxLength}` : undefined}>{label}</FL>
      <textarea className={`${inputCls} min-h-[90px] resize-none leading-relaxed`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}/>
    </div>
  )
}
function SW({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/10 bg-white px-4 py-3.5">
      <div>
        <div className="text-[13.5px] font-bold text-ink">{label}</div>
        {description && <div className="mt-0.5 text-[12px] text-ink/50">{description}</div>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${checked ? GRAD_BTN : 'bg-ink/15'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP INDICATOR
   ════════════════════════════════════════════════════════════════════ */
const STEP_LABELS: Record<Step, string> = {
  0: 'Type',
  1: 'Find',
  2: 'Details',
  3: 'Scope & terms',
  4: 'Contract preview',
}

function StepIndicator({ current, inviteType }: { current: Step; inviteType: InviteType | null }) {
  const steps: Step[] = [1, 2, 3, 4]
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done    = current > step
        const active  = current === step
        const future  = current < step
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-[12.5px] font-extrabold transition ${done ? `${GRAD_BTN} border-transparent text-white` : active ? 'border-primary bg-white text-primary' : 'border-primary/15 bg-surface-sub text-ink/30'}`}>
                {done ? <CheckIcon s={14}/> : step}
              </div>
              <span className={`mt-1.5 hidden text-[10.5px] font-semibold sm:block ${active ? 'text-primary' : done ? 'text-ink/45' : 'text-ink/25'}`}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-[2px] w-10 rounded-full transition sm:w-16 ${done ? GRAD_BTN : 'bg-primary/10'}`}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SCOPE OPTION CARD
   ════════════════════════════════════════════════════════════════════ */
function ScopeCard({ icon, title, subtitle, bullets, selected, onClick, badge }: {
  icon: ReactNode; title: string; subtitle: string; bullets: string[]
  selected: boolean; onClick: () => void; badge?: string
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full flex-col rounded-2xl border-2 p-5 text-left transition hover:-translate-y-0.5 ${selected ? 'border-primary bg-primary/[0.03] shadow-[0_0_0_4px_rgba(139,49,232,0.08)]' : 'border-primary/10 bg-white hover:border-primary/25'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition ${selected ? `${GRAD_BTN} text-white` : 'bg-primary/[0.07] text-primary'}`}>{icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[14.5px] font-extrabold text-ink">{title}</p>
              {badge && <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${selected ? 'bg-primary/15 text-primary' : 'bg-surface-sub text-ink/45'}`}>{badge}</span>}
            </div>
            <p className="text-[12.5px] text-ink/50">{subtitle}</p>
          </div>
        </div>
        <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${selected ? `${GRAD_BTN} border-transparent` : 'border-primary/20'}`}>
          {selected && <CheckIcon s={10}/>}
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] text-ink/60">
            <span className={`mt-0.5 flex-shrink-0 ${selected ? 'text-primary' : 'text-ink/25'}`}><CheckIcon s={11}/></span>{b}
          </li>
        ))}
      </ul>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CONTRACT PREVIEW PANEL
   ════════════════════════════════════════════════════════════════════ */
function ContractPreview({ clauses, title, parties }: {
  clauses: { num: string; text: string }[]
  title: string
  parties: { agency: string; other: string; otherRole: string }
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-primary/12 bg-white ${CARD}`}>
      {/* Header strip */}
      <div className={`${GRAD_BTN} px-6 py-4`}>
        <div className="flex items-center gap-3">
          <FileTextIcon s={20}/>
          <div>
            <p className="text-[15px] font-extrabold text-white">{title}</p>
            <p className="text-[12px] text-white/70">Auto-drafted · editable after acceptance</p>
          </div>
        </div>
      </div>
      {/* Parties */}
      <div className="grid grid-cols-2 divide-x divide-primary/8 border-b border-primary/8">
        {[
          { label: 'Agency', value: parties.agency },
          { label: parties.otherRole, value: parties.other || '(name entered above)' },
        ].map(p => (
          <div key={p.label} className="px-5 py-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink/35">{p.label}</p>
            <p className="mt-0.5 text-[13.5px] font-bold text-ink">{p.value}</p>
          </div>
        ))}
      </div>
      {/* Clauses */}
      <div className="divide-y divide-primary/6 px-5">
        {clauses.map(c => (
          <div key={c.num} className="py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 rounded-md bg-primary/[0.08] px-2 py-0.5 text-[11px] font-extrabold text-primary">{c.num}</span>
              <p className="text-[13px] leading-[1.7] text-ink/70">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Footer note */}
      <div className="flex items-start gap-2.5 border-t border-primary/8 bg-surface-sub px-5 py-4">
        <InfoIcon s={14}/>
        <p className="text-[12px] leading-[1.6] text-ink/50">
          This is an auto-drafted preview. Both parties can propose amendments before signing. Once accepted, the full contract is stored on Creator Nexus and signed digitally via the platform.
        </p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ACCEPTANCE PREVIEW — shows what the invited person will see
   ════════════════════════════════════════════════════════════════════ */
function AcceptancePreview({ inviteType, contactName, scope }: {
  inviteType: InviteType
  contactName: string
  scope: BrandScope | CreatorScope
}) {
  const scopeLabel =
    inviteType === 'brand'
      ? scope === 'full_management' ? 'Full platform management' : 'Single campaign only'
      : scope === 'full_roster'    ? 'Full creator representation' : 'Single campaign introduction'
  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-dashed border-primary/20 bg-surface-sub ${CARD}`}>
      <div className="border-b border-primary/8 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/[0.1] text-primary"><MailIcon s={12}/></span>
          <p className="text-[12px] font-bold text-ink/50">What {contactName || 'they'} will receive — acceptance dialog preview</p>
        </div>
      </div>
      <div className="px-5 py-5">
        {/* Mock dialog */}
        <div className={`overflow-hidden rounded-2xl border border-primary/12 bg-white shadow-xl ${CARD}`}>
          {/* Dialog header */}
          <div className={`${GRAD_BTN} px-5 py-4`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">Agency invitation</p>
            <p className="mt-0.5 text-[17px] font-extrabold text-white">{AGENCY.name} wants to work with you</p>
          </div>
          <div className="px-5 py-5 space-y-4">
            {/* Agency identity */}
            <div className="flex items-center gap-3 rounded-xl bg-surface-sub px-4 py-3.5">
              <LogoTile name={AGENCY.name} color="#8B31E8" initials="BC" size={40}/>
              <div>
                <p className="text-[13.5px] font-bold text-ink">{AGENCY.name}</p>
                <p className="text-[12px] text-ink/45">Riga, Latvia · Verified agency on Creator Nexus</p>
              </div>
            </div>
            {/* Scope proposal */}
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-ink/40">Proposed arrangement</p>
              <div className={`flex items-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/[0.04] px-4 py-3`}>
                <span className="text-primary">{inviteType === 'brand' ? <RepeatIcon s={16}/> : <ZapIcon s={16}/>}</span>
                <p className="text-[13.5px] font-bold text-ink">{scopeLabel}</p>
              </div>
            </div>
            {/* Their choices */}
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-ink/40">Your response</p>
              <div className="flex flex-col gap-2">
                <button className={`flex items-center gap-2.5 rounded-xl ${GRAD_BTN} px-4 py-3 text-[13.5px] font-bold text-white`}>
                  <CheckIcon s={15}/>Accept invitation & review contract
                </button>
                <button className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-white px-4 py-3 text-[13.5px] font-bold text-ink/60">
                  Propose different terms
                </button>
                <button className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-semibold text-ink/35">
                  <XIcon s={13}/>Decline
                </button>
              </div>
            </div>
            {/* Trust note */}
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-3">
              <ShieldCheckIcon s={14}/>
              <p className="text-[11.5px] text-emerald-700">You stay in full control. You can revoke agency access at any time from your settings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   SUCCESS SCREEN
   ════════════════════════════════════════════════════════════════════ */
function SuccessScreen({ inviteType, contactName, email, scope, onAddAnother, onGoToDashboard }: {
  inviteType: InviteType; contactName: string; email: string
  scope: BrandScope | CreatorScope; onAddAnother: () => void; onGoToDashboard: () => void
}) {
  const isBrand = inviteType === 'brand'
  const scopeLabel =
    isBrand
      ? scope === 'full_management' ? 'Full management' : 'Single campaign'
      : scope === 'full_roster'    ? 'Full representation' : 'Single campaign'

  const NEXT_STEPS = isBrand
    ? [
        { icon: <MailIcon s={16}/>, title: 'Invitation sent', body: `${contactName || email} will receive an email with a link to accept your invitation and review the management agreement.` },
        { icon: <ShieldCheckIcon s={16}/>, title: 'They accept & sign', body: 'Once they create their profile and sign the auto-drafted contract, they appear in your Managed Brands list.' },
        { icon: <RepeatIcon s={16}/>, title: 'You get access', body: "You'll be notified instantly. You can then build campaigns, manage creators, and access their brand dashboard." },
      ]
    : [
        { icon: <MailIcon s={16}/>, title: 'Invitation sent', body: `${contactName || email} will receive an email with a link to accept your roster invitation.` },
        { icon: <ShieldCheckIcon s={16}/>, title: 'They accept & sign', body: 'Once they create their profile and sign the representation agreement, they appear in your Creator Roster.' },
        { icon: <ZapIcon s={16}/>, title: 'Start booking deals', body: "You can immediately start adding them to campaign pitches. Their consent is on file." },
      ]

  return (
    <div className="flex flex-col items-center py-8">
      {/* Animated success mark */}
      <div className={`flex h-24 w-24 items-center justify-center rounded-3xl ${GRAD_BTN} text-white shadow-[0_20px_48px_-12px_rgba(139,49,232,0.55)]`}
        style={{ animation: 'pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both' }}>
        <CheckIcon s={40}/>
      </div>
      <h2 className="mt-6 text-[24px] font-black tracking-[-0.02em] text-ink">Invitation sent!</h2>
      <p className="mt-2 text-center text-[14.5px] text-ink/55">
        {isBrand ? 'Brand invitation' : 'Creator invitation'} sent to <strong className="text-ink">{email}</strong>
      </p>

      {/* Summary card */}
      <div className={`mt-6 w-full max-w-[480px] overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
        <div className="border-b border-primary/8 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40">Invitation summary</p>
        </div>
        {[
          { label: inviteType === 'brand' ? 'Brand' : 'Creator', value: contactName || '—' },
          { label: 'Email',        value: email        },
          { label: 'Arrangement', value: scopeLabel   },
          { label: 'Contract',    value: 'Auto-drafted · pending their signature' },
          { label: 'Status',      value: 'Awaiting acceptance' },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between border-b border-primary/6 px-5 py-3.5 last:border-b-0">
            <span className="text-[12.5px] font-semibold text-ink/45">{row.label}</span>
            <span className="text-[13px] font-bold text-ink">{row.value}</span>
          </div>
        ))}
      </div>

      {/* What happens next */}
      <div className="mt-6 w-full max-w-[480px]">
        <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-ink/40">What happens next</p>
        <div className="space-y-3">
          {NEXT_STEPS.map((s, i) => (
            <div key={i} className={`flex items-start gap-4 rounded-xl border border-primary/8 bg-white px-4 py-4 ${CARD}`}>
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} text-white`}>{s.icon}</div>
              <div>
                <p className="text-[13.5px] font-bold text-ink">{s.title}</p>
                <p className="mt-0.5 text-[12.5px] leading-[1.6] text-ink/55">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex w-full max-w-[480px] flex-col gap-2.5 sm:flex-row">
        <button onClick={onAddAnother}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-5 py-3 text-[14px] font-bold text-primary transition hover:bg-primary/[0.04]">
          Invite another
        </button>
        <button onClick={onGoToDashboard}
          className={`flex flex-[2] items-center justify-center gap-2 rounded-xl ${GRAD_BTN} px-5 py-3 text-[14px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
          Back to dashboard<ArrowRightIcon s={15}/>
        </button>
      </div>
      <style>{`@keyframes pop-in { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
export default function AgencyInvitePage() {
  const router  = useRouter()
  const unreadMessages = UNREAD_MESSAGE_COUNT

  /* ── State ────────────────────────────────────────────────────── */
  const [step,        setStep]        = useState<Step>(0)
  const [inviteType,  setInviteType]  = useState<InviteType | null>(null)
  const [submitted,   setSubmitted]   = useState(false)
  const [sending,     setSending]     = useState(false)

  const [form, setForm] = useState<InviteFormState>({
    findMode:          'new',
    searchQuery:       '',
    selectedBrandId:   null,
    selectedCreatorId: null,
    contactName:       '',
    contactEmail:      '',
    personalNote:      '',
    brandScope:        'full_management',
    creatorScope:      'full_roster',
    exclusive:         false,
    monthlyRetainer:   '',
    campaignBudget:    '',
    campaignName:      '',
    agencyFee:         '15',
  })

  const upd = (patch: Partial<InviteFormState>) => setForm(f => ({ ...f, ...patch }))

  /* ── Initialise from URL query param ─────────────────────────── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('type')
    if (t === 'brand' || t === 'creator') { setInviteType(t); setStep(1) }
  }, [])

  /* ── Derived ──────────────────────────────────────────────────── */
  const isBrand  = inviteType === 'brand'
  const isNew    = form.findMode === 'new'

  const selectedEntity = isBrand
    ? PLATFORM_BRANDS.find(b => b.id === form.selectedBrandId)
    : PLATFORM_CREATORS.find(c => c.id === form.selectedCreatorId)

  const displayName = isNew
    ? form.contactName
    : selectedEntity
      ? isBrand ? (selectedEntity as PlatformBrand).name : (selectedEntity as PlatformCreator).name
      : ''

  const contractClauses = isBrand
    ? form.brandScope === 'full_management' ? CONTRACT_CLAUSES.brand_full : CONTRACT_CLAUSES.brand_campaign
    : form.creatorScope === 'full_roster'
      ? form.exclusive ? CONTRACT_CLAUSES.creator_full_exclusive : CONTRACT_CLAUSES.creator_full
      : CONTRACT_CLAUSES.creator_campaign

  const contractTitle = isBrand
    ? form.brandScope === 'full_management' ? 'Agency Management Agreement' : 'Campaign Delivery Agreement'
    : form.creatorScope === 'full_roster'
      ? form.exclusive ? 'Exclusive Creator Representation Agreement' : 'Creator Representation Agreement'
      : 'Campaign Participation Agreement'

  /* ── Validation per step ──────────────────────────────────────── */
  const canProceed1 = form.findMode === 'search'
    ? (isBrand ? !!form.selectedBrandId : !!form.selectedCreatorId)
    : true // search mode requires selection; new mode always allows continue to step 2

  const canProceed2 = isNew
    ? form.contactName.trim().length > 0 && form.contactEmail.includes('@')
    : true // if found on platform, identity already known

  const canProceed3 = isBrand
    ? form.brandScope === 'full_management' ? form.monthlyRetainer.trim().length > 0 : form.campaignBudget.trim().length > 0
    : true // creator scope has sensible defaults

  /* ── Navigation ───────────────────────────────────────────────── */
  const goBack = () => {
    if (step === 1) { setStep(0); setInviteType(null) }
    else setStep(s => (s - 1) as Step)
  }

  const goNext = () => {
    if (step === 1 && !isNew && !canProceed1) return // can't advance without selection in search mode
    if (step === 2 && !canProceed2) return
    if (step === 3 && !canProceed3) return

    // Skip step 2 (details) if found on platform — identity is known
    if (step === 1 && !isNew) { setStep(3); return }
    setStep(s => (s + 1) as Step)
  }

  const handleSend = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))
    setSending(false)
    setSubmitted(true)
  }

  const handleAddAnother = () => {
    setStep(0); setInviteType(null); setSubmitted(false); setSending(false)
    setForm({ findMode:'new', searchQuery:'', selectedBrandId:null, selectedCreatorId:null, contactName:'', contactEmail:'', personalNote:'', brandScope:'full_management', creatorScope:'full_roster', exclusive:false, monthlyRetainer:'', campaignBudget:'', campaignName:'', agencyFee:'15' })
  }

  /* ── Filtered search results ──────────────────────────────────── */
  const brandResults  = PLATFORM_BRANDS.filter(b => !form.searchQuery || b.name.toLowerCase().includes(form.searchQuery.toLowerCase()) || b.industry.toLowerCase().includes(form.searchQuery.toLowerCase()))
  const creatorResults = PLATFORM_CREATORS.filter(c => !form.searchQuery || c.name.toLowerCase().includes(form.searchQuery.toLowerCase()) || c.handle.toLowerCase().includes(form.searchQuery.toLowerCase()))

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ HEADER ════ */}
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1080px] px-4 pb-3 pt-3 sm:px-6">
          <div className="relative flex w-full items-center justify-between rounded-2xl px-3 py-2.5" style={{ overflow: 'visible' }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl backdrop-blur-xl"
              style={{ background: 'linear-gradient(90deg, rgba(139,49,232,0.05) 0%, rgba(139,49,232,0.05) 30%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(139,49,232,0.05) 70%, rgba(139,49,232,0.05) 100%)' }}/>
            <div className="relative z-10 flex items-center gap-0.5">
              {[
                { label: 'Dashboard',  action: () => router.push('/dashboard/agency'), active: false },
                { label: 'Campaigns',  action: () => {},                               active: false },
                { label: 'Creators',   action: () => {},                               active: false },
              ].map(n => (
                <button key={n.label} onClick={n.action}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition hover:bg-primary/[0.08] hover:text-primary sm:px-3.5 ${n.active ? 'text-primary' : 'text-ink/70'}`}>
                  {n.label}
                </button>
              ))}
            </div>
            <div className="w-12 flex-shrink-0 sm:w-16" aria-hidden="true"/>
            <div className="relative z-10 flex items-center gap-1.5">
              <button onClick={() => router.push('/messages')} title="Messages"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <ChatBubbleIcon s={18}/>
                {unreadMessages > 0 && <span className={`absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-white ${GRAD_BTN}`}>{unreadMessages}</span>}
              </button>
              <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/60 transition hover:bg-primary/[0.08] hover:text-primary">
                <BellIcon s={18}/>
              </button>
              <button onClick={() => router.push(`/agency/${AGENCY.slug}`)}
                className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-ink/70 transition hover:bg-primary/[0.08] hover:text-primary sm:flex">
                My Profile
              </button>
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
              <NexLogo className="pointer-events-auto h-8 drop-shadow-[0_4px_14px_rgba(139,49,232,0.4)] sm:h-9"/>
            </div>
          </div>
        </div>
      </header>

      {/* ════ MAIN ════ */}
      <main className="mx-auto max-w-[780px] px-4 py-8 sm:px-6 sm:py-10">

        {/* Top bar: back link + step indicator */}
        {!submitted && step > 0 && (
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={goBack}
              className="flex items-center gap-2 self-start rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-bold text-ink/55 transition hover:bg-surface-sub hover:text-ink">
              <ArrowLeftIcon s={14}/>Back
            </button>
            <StepIndicator current={step} inviteType={inviteType}/>
          </div>
        )}

        {/* ══ STEP 0: Type selector ══════════════════════════════════ */}
        {step === 0 && !submitted && (
          <div>
            <div className="mb-8 text-center">
              <h1 className="text-[28px] font-black tracking-[-0.03em] text-ink sm:text-[32px]">Who do you want to invite?</h1>
              <p className="mt-2 text-[14.5px] text-ink/50">Add a new brand client or creator to your agency on Creator Nexus.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Brand tile */}
              <button type="button" onClick={() => { setInviteType('brand'); setStep(1) }}
                className={`group flex flex-col items-start rounded-3xl border-2 border-primary/10 bg-white p-7 text-left transition hover:-translate-y-1 hover:border-primary/30 ${CARD}`}>
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition group-hover:scale-105`}>
                  <BuildingIcon s={28}/>
                </div>
                <h2 className="mt-5 text-[20px] font-extrabold tracking-[-0.02em] text-ink">Invite a brand</h2>
                <p className="mt-1.5 text-[13.5px] leading-[1.65] text-ink/50">A brand who wants you to manage their Creator Nexus presence — campaigns, creators, and payments.</p>
                <ul className="mt-5 space-y-2">
                  {['Monthly retainer contract', 'You run their campaigns', 'Full brand dashboard access', 'Payment via Grade escrow'].map(b => (
                    <li key={b} className="flex items-center gap-2 text-[12.5px] text-ink/55">
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/[0.1] text-primary"><CheckIcon s={9}/></span>{b}
                    </li>
                  ))}
                </ul>
                <div className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl ${GRAD_BTN} py-3 text-[13.5px] font-bold text-white transition group-hover:-translate-y-0.5`}>
                  Invite a brand<ArrowRightIcon s={14}/>
                </div>
              </button>

              {/* Creator tile */}
              <button type="button" onClick={() => { setInviteType('creator'); setStep(1) }}
                className={`group flex flex-col items-start rounded-3xl border-2 border-primary/10 bg-white p-7 text-left transition hover:-translate-y-1 hover:border-primary/30 ${CARD}`}>
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] transition group-hover:scale-105`}>
                  <UsersIcon s={28}/>
                </div>
                <h2 className="mt-5 text-[20px] font-extrabold tracking-[-0.02em] text-ink">Invite a creator</h2>
                <p className="mt-1.5 text-[13.5px] leading-[1.65] text-ink/50">A creator you want to represent or work with. They join your roster and you can add them to brand campaigns.</p>
                <ul className="mt-5 space-y-2">
                  {['Creator representation agreement', 'Add to brand campaigns', 'Optional exclusive contract', '15% agency fee on deals'].map(b => (
                    <li key={b} className="flex items-center gap-2 text-[12.5px] text-ink/55">
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/[0.1] text-primary"><CheckIcon s={9}/></span>{b}
                    </li>
                  ))}
                </ul>
                <div className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl ${GRAD_BTN} py-3 text-[13.5px] font-bold text-white transition group-hover:-translate-y-0.5`}>
                  Add a creator<ArrowRightIcon s={14}/>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 1: Find or invite new ════════════════════════════ */}
        {step === 1 && !submitted && (
          <div>
            <div className="mb-6">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-primary">{isBrand ? 'Invite a brand' : 'Invite a creator'}</p>
              <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-ink">
                {isBrand ? 'Are they already on Creator Nexus?' : 'Are they already on Creator Nexus?'}
              </h1>
              <p className="mt-1 text-[14px] text-ink/50">Find an existing account or invite someone new by email.</p>
            </div>

            {/* Find / New tabs */}
            <div className={`mb-5 flex overflow-hidden rounded-2xl border border-primary/10 bg-surface-sub p-1 ${CARD}`}>
              {([
                { mode: 'search' as FindMode, label: `Find on platform`, icon: <SearchIcon s={15}/> },
                { mode: 'new'    as FindMode, label: `Invite new ${isBrand ? 'brand' : 'creator'}`,  icon: <MailIcon s={15}/> },
              ] as const).map(t => (
                <button key={t.mode} onClick={() => upd({ findMode: t.mode, searchQuery: '', selectedBrandId: null, selectedCreatorId: null })}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold transition ${form.findMode === t.mode ? `bg-white text-primary shadow-sm ${CARD}` : 'text-ink/45 hover:text-ink/65'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* SEARCH MODE */}
            {form.findMode === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={16}/></span>
                  <input className={`${inputCls} pl-11`} value={form.searchQuery} onChange={e => upd({ searchQuery: e.target.value })}
                    placeholder={isBrand ? 'Search by brand name or industry…' : 'Search by name or @handle…'}/>
                </div>
                <div className="space-y-2">
                  {(isBrand ? brandResults : creatorResults).map(item => {
                    const isBrandItem = isBrand
                    const isSelected  = isBrandItem ? form.selectedBrandId === item.id : form.selectedCreatorId === item.id
                    return (
                      <button key={item.id} type="button"
                        onClick={() => isBrandItem ? upd({ selectedBrandId: item.id }) : upd({ selectedCreatorId: item.id })}
                        className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${isSelected ? `border-primary bg-primary/[0.03] ${CARD}` : `border-primary/10 bg-white hover:border-primary/25 ${CARD}`}`}>
                        <LogoTile name={item.name} color={item.color} initials={'initials' in item ? item.initials : undefined} size={44}/>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-ink">{item.name}</p>
                          {isBrandItem
                            ? <p className="text-[12.5px] text-ink/45">{(item as PlatformBrand).industry} · {(item as PlatformBrand).location}</p>
                            : <p className="text-[12.5px] text-ink/45">{(item as PlatformCreator).handle} · {(item as PlatformCreator).niche} · {(item as PlatformCreator).followers}</p>
                          }
                        </div>
                        <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${isSelected ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20'}`}>
                          {isSelected && <CheckIcon s={10}/>}
                        </div>
                      </button>
                    )
                  })}
                  {(isBrand ? brandResults : creatorResults).length === 0 && (
                    <div className="flex flex-col items-center rounded-2xl border border-dashed border-primary/20 py-10 text-center">
                      <SearchIcon s={28}/>
                      <p className="mt-3 text-[13px] font-semibold text-ink/45">No results found</p>
                      <p className="mt-1 text-[12px] text-ink/35">Switch to "Invite new" to add someone not yet on the platform.</p>
                    </div>
                  )}
                </div>
                {!canProceed1 && (
                  <p className="text-[12.5px] font-semibold text-amber-600">Select a {isBrand ? 'brand' : 'creator'} above to continue.</p>
                )}
              </div>
            )}

            {/* NEW MODE — just a teaser, full details on next step */}
            {form.findMode === 'new' && (
              <div className="space-y-4">
                <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
                  <div className="border-b border-primary/8 px-5 py-4">
                    <p className="text-[13.5px] font-bold text-ink">What happens when you invite someone new</p>
                  </div>
                  <div className="divide-y divide-primary/6">
                    {[
                      { step: '1', icon: <MailIcon s={16}/>, label: 'You enter their name and email', detail: 'They receive a branded email from Nexfluence on your agency\'s behalf.' },
                      { step: '2', icon: <BuildingIcon s={16}/>, label: 'They create their profile', detail: `They sign up as a ${isBrand ? 'brand' : 'creator'} on Creator Nexus — takes about 3 minutes.` },
                      { step: '3', icon: <FileTextIcon s={16}/>, label: 'They review the auto-drafted contract', detail: 'A management or representation agreement is pre-filled based on the scope you choose in the next step.' },
                      { step: '4', icon: <CheckIcon s={16}/>, label: 'They accept or counter-propose', detail: isBrand ? 'Once signed, they appear in your Managed Brands list and you get dashboard access.' : 'Once signed, they appear in your Creator Roster and you can start booking them into campaigns.' },
                    ].map(row => (
                      <div key={row.step} className="flex items-start gap-4 px-5 py-4">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${GRAD_BTN} text-white text-[13px] font-black`}>{row.step}</div>
                        <div>
                          <p className="text-[13.5px] font-bold text-ink">{row.label}</p>
                          <p className="mt-0.5 text-[12.5px] leading-[1.6] text-ink/50">{row.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={goNext} disabled={form.findMode === 'search' && !canProceed1}
                className={`flex items-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-bold text-white transition ${(form.findMode === 'search' && !canProceed1) ? 'cursor-not-allowed bg-ink/15 text-ink/30' : `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`}`}>
                Continue<ArrowRightIcon s={15}/>
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Contact details ════════════════════════════════ */}
        {step === 2 && !submitted && isNew && (
          <div>
            <div className="mb-6">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-primary">{isBrand ? 'Brand details' : 'Creator details'}</p>
              <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-ink">Who are you inviting?</h1>
              <p className="mt-1 text-[14px] text-ink/50">Enter their details. The email is where the invitation will be sent.</p>
            </div>
            <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white p-6 space-y-5 ${CARD}`}>
              <TF label={isBrand ? 'Brand name' : 'Creator name'} value={form.contactName} onChange={v => upd({ contactName: v })}
                placeholder={isBrand ? 'e.g. Vāre Coffee' : 'e.g. Liis Saar'}/>
              <TF label="Email address" value={form.contactEmail} onChange={v => upd({ contactEmail: v })}
                placeholder={isBrand ? 'marketing@brand.com' : 'creator@email.com'} type="email"
                hint="Invitation will be sent here"/>
              <TA label="Personal note (optional)" value={form.personalNote} onChange={v => upd({ personalNote: v })} maxLength={400}
                placeholder={isBrand
                  ? `Hi — we'd love to help ${form.contactName || 'your brand'} grow through creator partnerships in the Baltics. I think we'd be a great fit…`
                  : `Hi ${form.contactName || 'there'} — I've been following your content and think we could find some great brand partnerships for you…`}/>
              {/* Preview of how the email looks */}
              <div className="rounded-xl border border-primary/10 bg-surface-sub px-4 py-4">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink/40">Email preview</p>
                <div className="rounded-xl border border-primary/8 bg-white px-4 py-4">
                  <p className="text-[12px] font-semibold text-ink/50">From: <span className="text-ink">Baltic Creators Agency via Nexfluence</span></p>
                  <p className="text-[12px] font-semibold text-ink/50 mt-0.5">To: <span className="text-ink">{form.contactEmail || '—'}</span></p>
                  <p className="text-[12px] font-semibold text-ink/50 mt-0.5">Subject: <span className="text-ink">{AGENCY.name} has invited you to {isBrand ? 'manage your brand on Creator Nexus' : 'join their creator roster'}</span></p>
                  <div className="mt-3 border-t border-primary/8 pt-3">
                    <p className="text-[13px] leading-[1.65] text-ink/70">
                      {form.personalNote
                        ? form.personalNote
                        : `${AGENCY.name} has invited you to ${isBrand ? 'join Creator Nexus and let them manage your influencer marketing campaigns' : 'join their creator roster on Creator Nexus'}. Click below to review the invitation and get started.`}
                    </p>
                    <div className={`mt-4 inline-flex items-center gap-2 rounded-xl ${GRAD_BTN} px-5 py-2.5 text-[13px] font-bold text-white`}>
                      Review invitation<ArrowRightIcon s={13}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={goNext} disabled={!canProceed2}
                className={`flex items-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-bold text-white transition ${!canProceed2 ? 'cursor-not-allowed bg-ink/15 text-ink/30' : `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`}`}>
                Continue<ArrowRightIcon s={15}/>
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Scope & payment terms ═════════════════════════ */}
        {step === 3 && !submitted && (
          <div>
            <div className="mb-6">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-primary">Arrangement</p>
              <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-ink">What kind of relationship?</h1>
              <p className="mt-1 text-[14px] text-ink/50">This determines which contract is auto-drafted and how payments are structured.</p>
            </div>

            {/* BRAND scope */}
            {isBrand && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ScopeCard
                    icon={<RepeatIcon s={22}/>}
                    title="Full platform management"
                    subtitle="Ongoing retainer"
                    badge="Recommended"
                    bullets={['You manage all their campaigns', 'Monthly retainer payment', 'Full brand dashboard access', '30-day notice to exit']}
                    selected={form.brandScope === 'full_management'}
                    onClick={() => upd({ brandScope: 'full_management' })}
                  />
                  <ScopeCard
                    icon={<ZapIcon s={22}/>}
                    title="Single campaign only"
                    subtitle="One-time delivery fee"
                    bullets={['Scoped to one campaign', 'One-time payment on delivery', 'No ongoing commitment', 'Upgrade to full later']}
                    selected={form.brandScope === 'single_campaign'}
                    onClick={() => upd({ brandScope: 'single_campaign' })}
                  />
                </div>

                {/* Payment terms */}
                <div className={`rounded-2xl border border-primary/10 bg-white p-5 space-y-4 ${CARD}`}>
                  <p className="text-[13.5px] font-extrabold text-ink">Payment terms</p>
                  {form.brandScope === 'full_management' ? (
                    <TF label="Monthly retainer (€)" value={form.monthlyRetainer} onChange={v => upd({ monthlyRetainer: v })}
                      placeholder="e.g. 1200" hint="Required · paid on the 1st of each month via Grade"/>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TF label="Campaign delivery fee (€)" value={form.campaignBudget} onChange={v => upd({ campaignBudget: v })}
                        placeholder="e.g. 800" hint="Required · 50% upfront, 50% on completion"/>
                      <TF label="Campaign name" value={form.campaignName} onChange={v => upd({ campaignName: v })}
                        placeholder="e.g. Summer launch 2026"/>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3">
                    <ShieldCheckIcon s={14}/>
                    <p className="text-[12px] text-emerald-700">All payments are processed via Grade escrow — DAC7 compliant, automatically invoiced, released on milestone.</p>
                  </div>
                </div>
              </div>
            )}

            {/* CREATOR scope */}
            {!isBrand && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ScopeCard
                    icon={<UsersIcon s={22}/>}
                    title="Full creator representation"
                    subtitle="15% fee on each deal"
                    badge="Recommended"
                    bullets={['You source all brand deals', '15% agency fee via Grade', 'You negotiate on their behalf', 'Optional: exclusive contract']}
                    selected={form.creatorScope === 'full_roster'}
                    onClick={() => upd({ creatorScope: 'full_roster' })}
                  />
                  <ScopeCard
                    icon={<ZapIcon s={22}/>}
                    title="Single campaign introduction"
                    subtitle="10% introduction fee (brand pays)"
                    bullets={['You intro creator to one brand', '10% fee charged to brand', 'Creator & brand work directly', 'No ongoing commitment']}
                    selected={form.creatorScope === 'single_campaign'}
                    onClick={() => upd({ creatorScope: 'single_campaign' })}
                  />
                </div>

                {/* Exclusive option — only for full roster */}
                {form.creatorScope === 'full_roster' && (
                  <div className={`rounded-2xl border border-primary/10 bg-white p-5 space-y-3 ${CARD}`}>
                    <p className="text-[13.5px] font-extrabold text-ink">Contract options</p>
                    <SW
                      label="Exclusive representation"
                      description="Creator agrees not to work with competing agencies or take direct brand deals on Creator Nexus. In return, you commit to a minimum of 2 paid deals per quarter."
                      checked={form.exclusive}
                      onChange={v => upd({ exclusive: v })}
                    />
                    <div className="flex items-start gap-2.5 rounded-xl bg-primary/[0.04] border border-primary/10 px-3.5 py-3">
                      <InfoIcon s={14}/>
                      <p className="text-[12px] text-ink/55">Agency fee defaults to 15% of gross deal value, deducted automatically by Grade at payout time. You can negotiate a different rate in the contract before both parties sign.</p>
                    </div>
                  </div>
                )}

                {form.creatorScope === 'single_campaign' && (
                  <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                    <TF label="Campaign name" value={form.campaignName} onChange={v => upd({ campaignName: v })} placeholder="e.g. Kinetics — Summer launch 2026" hint="Optional"/>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={goNext} disabled={!canProceed3}
                className={`flex items-center gap-2 rounded-xl px-6 py-3.5 text-[14px] font-bold text-white transition ${!canProceed3 ? 'cursor-not-allowed bg-ink/15 text-ink/30' : `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`}`}>
                Preview contract<ArrowRightIcon s={15}/>
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 4: Contract preview + send ═══════════════════════ */}
        {step === 4 && !submitted && (
          <div>
            <div className="mb-6">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-primary">Contract preview</p>
              <h1 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-ink">Review before sending</h1>
              <p className="mt-1 text-[14px] text-ink/50">This contract will be sent to {displayName || form.contactEmail || 'them'} for review. Both parties sign before it takes effect.</p>
            </div>

            <div className="space-y-5">
              {/* Contract */}
              <ContractPreview
                clauses={contractClauses}
                title={contractTitle}
                parties={{
                  agency:    AGENCY.name,
                  other:     displayName || form.contactEmail,
                  otherRole: isBrand ? 'Brand' : 'Creator',
                }}
              />

              {/* Acceptance preview */}
              <AcceptancePreview
                inviteType={inviteType!}
                contactName={displayName}
                scope={isBrand ? form.brandScope : form.creatorScope}
              />

              {/* Send summary */}
              <div className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
                <p className="mb-4 text-[13.5px] font-extrabold text-ink">Ready to send</p>
                <div className="space-y-2">
                  {[
                    { label: isBrand ? 'Brand' : 'Creator', value: displayName || '—' },
                    { label: 'Email',       value: isNew ? form.contactEmail : `${displayName} (on platform)` },
                    { label: 'Contract',    value: contractTitle },
                    ...(isBrand && form.brandScope === 'full_management' && form.monthlyRetainer ? [{ label: 'Retainer', value: `€${form.monthlyRetainer}/month` }] : []),
                    ...(isBrand && form.brandScope === 'single_campaign' && form.campaignBudget  ? [{ label: 'Campaign fee', value: `€${form.campaignBudget}` }] : []),
                    ...(!isBrand ? [{ label: 'Agency fee', value: `${form.agencyFee}% of deal value via Grade` }] : []),
                    ...(!isBrand && form.exclusive ? [{ label: 'Exclusivity', value: 'Yes — included in contract' }] : []),
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between border-b border-primary/6 py-2.5 last:border-b-0">
                      <span className="text-[12.5px] font-semibold text-ink/45">{row.label}</span>
                      <span className="text-[13px] font-bold text-ink">{row.value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleSend} disabled={sending}
                  className={`mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-[15px] font-bold text-white transition ${sending ? 'cursor-not-allowed bg-ink/15' : `${GRAD_BTN} shadow-[0_8px_28px_-8px_rgba(139,49,232,0.55)] hover:-translate-y-0.5`}`}>
                  {sending
                    ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending invitation…</>
                    : <><SendIcon s={16}/>Send invitation to {displayName || form.contactEmail}</>}
                </button>
                <p className="mt-3 text-center text-[11.5px] text-ink/35">
                  By sending, you confirm you have the right to invite this {isBrand ? 'brand' : 'creator'} on behalf of {AGENCY.name}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ SUCCESS ════════════════════════════════════════════════ */}
        {submitted && (
          <SuccessScreen
            inviteType={inviteType!}
            contactName={displayName}
            email={isNew ? form.contactEmail : `${displayName} (on platform)`}
            scope={isBrand ? form.brandScope : form.creatorScope}
            onAddAnother={handleAddAnother}
            onGoToDashboard={() => router.push('/dashboard/agency')}
          />
        )}

      </main>
    </div>
  )
}