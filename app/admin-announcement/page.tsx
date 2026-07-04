'use client'

import React, {
  useState, useEffect, useRef, useCallback,
  type ReactNode, type ChangeEvent,
} from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Platform Announcements — app/admin/announcements/page.tsx
   Nexfluence v4, LIGHT · dark sidebar variant

   WHAT THIS SYSTEM DOES (THE BUSINESS LOGIC):
   ────────────────────────────────────────────
   You ship an update. You write one announcement. The next time any
   signed-in user in the target audience opens Creator Nexus, a modal
   appears — blocking the page until they acknowledge it. The INSTANT
   it is shown, their user ID (or a localStorage key in this frontend
   implementation) is flagged — they will NEVER see this announcement
   again. Not tomorrow. Not in a different browser tab. Never.

   This is not a notification bell item (which users can ignore
   forever). This is a GUARANTEED first-impression surface. Used
   correctly, it is the most powerful communication channel you have
   because open rate is 100% — it physically blocks the UI.

   THE TWO DELIVERABLES IN THIS FILE:
   1. ADMIN PAGE — compose, schedule, monitor, archive announcements
   2. AnnouncementModal (exported) — the component that goes into the
      root layout (app/layout.tsx) and fires for every signed-in user
      on every page until they've seen the current live announcement.

   PRIORITY SYSTEM — three tiers, not two:
     info      Blue  — feature launches, new regions, milestones
     important Amber — fee changes, policy updates, planned downtime
     critical  Rose  — T&C changes, legal notices, security alerts
                       CANNOT be dismissed without ticking a checkbox.
                       This is a GDPR/legal defensibility requirement.

   10-DAY WINDOW:
   After 10 days the announcement expires automatically even if some
   users haven't logged in. You don't chase ghosts. If it matters that
   much, send an email. The modal is for active users.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

/* ─── Types ──────────────────────────────────────────────────────── */
type Priority   = 'info' | 'important' | 'critical'
type AnnStatus  = 'scheduled' | 'live' | 'paused' | 'expired' | 'archived'
type TargetAudience = 'all' | 'brands' | 'creators' | 'agencies'

interface ReachStats {
  eligible:     number
  shown:        number
  acknowledged: number
}

interface Announcement {
  id:           string
  title:        string
  message:      string
  icon:         string          /* emoji */
  ctaLabel:     string | null
  ctaUrl:       string | null
  priority:     Priority
  status:       AnnStatus
  targetAudience: TargetAudience[]
  requireAck:   boolean         /* must tick checkbox before dismissing */
  scheduledFor: string          /* ISO-like display string */
  expiresAt:    string
  durationDays: number
  createdAt:    string
  createdBy:    string
  reach:        ReachStats
}

/* ─── Form state for the compose panel ───────────────────────────── */
interface AnnForm {
  title:          string
  message:        string
  icon:           string
  ctaLabel:       string
  ctaUrl:         string
  priority:       Priority
  targetAudience: TargetAudience[]
  requireAck:     boolean
  scheduleNow:    boolean
  scheduledFor:   string
  durationDays:   number
}

const BLANK_FORM: AnnForm = {
  title: '', message: '', icon: '🚀', ctaLabel: '', ctaUrl: '',
  priority: 'info', targetAudience: ['all'], requireAck: false,
  scheduleNow: true, scheduledFor: '', durationDays: 10,
}

/* ─── Platform user counts (for eligibility calc) ────────────────── */
const PERSONA_COUNTS: Record<TargetAudience, number> = {
  all: 1847, brands: 384, creators: 1348, agencies: 115,
}
function eligibleCount(targets: TargetAudience[]): number {
  if (targets.includes('all')) return PERSONA_COUNTS.all
  return targets.reduce((sum, t) => sum + PERSONA_COUNTS[t], 0)
}

/* ─── Mock announcements ─────────────────────────────────────────── */
const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann001',
    icon: '🏢', priority: 'important', status: 'live',
    title: 'Agency profiles are now live on Creator Nexus',
    message: 'Brands can now be fully managed by agencies on the platform. Agencies get their own dashboard, contract builder, and three-party campaign management. If you\'re working with an agency, they can now represent you officially on Nexus.',
    ctaLabel: 'See how it works', ctaUrl: '/agency/preview',
    targetAudience: ['all'], requireAck: false,
    scheduledFor: 'Jul 2, 2026 · 09:00', expiresAt: 'Jul 12, 2026',
    durationDays: 10, createdAt: 'Jul 2, 2026', createdBy: 'Harshul G.',
    reach: { eligible: 1847, shown: 312, acknowledged: 187 },
  },
  {
    id: 'ann002',
    icon: '⚖️', priority: 'critical', status: 'live',
    title: 'Updated Creator Terms & Conditions — action required',
    message: 'We\'ve updated the Creator Terms & Conditions to include a new section on agency representation and fee routing. These changes take effect on July 15, 2026. By continuing to use Creator Nexus after that date, you accept the updated terms. Please review them before then.',
    ctaLabel: 'Review updated T&Cs', ctaUrl: '/legal/creator-terms',
    targetAudience: ['creators'], requireAck: true,
    scheduledFor: 'Jul 2, 2026 · 10:00', expiresAt: 'Jul 12, 2026',
    durationDays: 10, createdAt: 'Jul 2, 2026', createdBy: 'Harshul G.',
    reach: { eligible: 1348, shown: 198, acknowledged: 198 },
  },
  {
    id: 'ann003',
    icon: '💸', priority: 'info', status: 'scheduled',
    title: 'Faster payouts — Grade now releases funds in 24h',
    message: 'Starting July 10, Grade will release creator payouts within 24 hours of content approval (previously 1–3 business days). No action needed — this applies to all campaigns automatically.',
    ctaLabel: 'See payout schedule', ctaUrl: '/creator/payments',
    targetAudience: ['creators', 'agencies'], requireAck: false,
    scheduledFor: 'Jul 10, 2026 · 09:00', expiresAt: 'Jul 20, 2026',
    durationDays: 10, createdAt: 'Jul 2, 2026', createdBy: 'Harshul G.',
    reach: { eligible: 0, shown: 0, acknowledged: 0 },
  },
  {
    id: 'ann004',
    icon: '🎉', priority: 'info', status: 'expired',
    title: 'Creator Nexus hits 500 creators in the Baltic region',
    message: 'We\'ve reached 500 creators across Latvia, Lithuania, and Estonia. Thank you for being part of the marketplace that\'s building the Baltic creator economy. More brands, better deals, and new features coming in Q3.',
    ctaLabel: null, ctaUrl: null,
    targetAudience: ['all'], requireAck: false,
    scheduledFor: 'Jun 15, 2026 · 10:00', expiresAt: 'Jun 25, 2026',
    durationDays: 10, createdAt: 'Jun 15, 2026', createdBy: 'Harshul G.',
    reach: { eligible: 1601, shown: 1490, acknowledged: 602 },
  },
]

/* ─── Priority config ─────────────────────────────────────────────── */
const PRIORITY_CFG: Record<Priority, {
  label: string; accentBar: string; iconBg: string; iconText: string
  cardBorder: string; cardBg: string; badgeBg: string; badgeText: string
  ctaClass: string; dot: string
}> = {
  info: {
    label: 'Info', accentBar: 'bg-blue-500',
    iconBg: 'bg-blue-50', iconText: 'text-blue-600',
    cardBorder: 'border-blue-100', cardBg: 'bg-blue-50/30',
    badgeBg: 'bg-blue-50', badgeText: 'text-blue-700',
    ctaClass: 'bg-blue-500 hover:bg-blue-600', dot: 'bg-blue-400',
  },
  important: {
    label: 'Important', accentBar: 'bg-amber-400',
    iconBg: 'bg-amber-50', iconText: 'text-amber-700',
    cardBorder: 'border-amber-200', cardBg: 'bg-amber-50/30',
    badgeBg: 'bg-amber-50', badgeText: 'text-amber-700',
    ctaClass: 'bg-amber-500 hover:bg-amber-600', dot: 'bg-amber-400',
  },
  critical: {
    label: 'Critical', accentBar: 'bg-rose-500',
    iconBg: 'bg-rose-50', iconText: 'text-rose-600',
    cardBorder: 'border-rose-200', cardBg: 'bg-rose-50/30',
    badgeBg: 'bg-rose-50', badgeText: 'text-rose-700',
    ctaClass: 'bg-rose-500 hover:bg-rose-600', dot: 'bg-rose-500',
  },
}

const STATUS_CFG: Record<AnnStatus, { label: string; dot: string; bg: string; text: string }> = {
  scheduled: { label: 'Scheduled', dot: 'bg-primary/60',  bg: 'bg-primary/[0.07]', text: 'text-primary'     },
  live:      { label: 'Live',      dot: 'bg-emerald-400', bg: 'bg-emerald-50',     text: 'text-emerald-700' },
  paused:    { label: 'Paused',    dot: 'bg-ink/30',      bg: 'bg-surface-sub',    text: 'text-ink/50'      },
  expired:   { label: 'Expired',   dot: 'bg-ink/20',      bg: 'bg-surface-sub',    text: 'text-ink/40'      },
  archived:  { label: 'Archived',  dot: 'bg-ink/20',      bg: 'bg-surface-sub',    text: 'text-ink/40'      },
}

const AUDIENCE_LABELS: Record<TargetAudience, string> = {
  all: 'All users', brands: 'Brands', creators: 'Creators', agencies: 'Agencies',
}

const EMOJI_PRESETS = ['🚀','🎉','⚖️','💸','🏢','⚡','🔔','✅','⚠️','🔒','🌍','📣','💡','🎯','🛡️','📋']

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function CheckIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 14 }: { s?: number })           { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function PlusIcon({ s = 14 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function PauseIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="4" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg> }
function PlayIcon({ s = 14 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ArchiveIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="21 8 21 21 3 21 3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="3" width="22" height="5" rx="1" stroke="currentColor" strokeWidth="1.8"/><line x1="10" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function EditIcon({ s = 14 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EyeIcon({ s = 14 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function UsersIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 21v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ClockIcon({ s = 13 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function AlertIcon({ s = 15 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function MegaphoneIcon({ s = 18 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 11v2a8 8 0 008 8v0M3 11a8 8 0 018-8v0M3 11h18M21 11v2M11 19l-2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 7c0 0-3 2-8 2S5 7 5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function DashIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> }
function ActivityIcon({ s = 16 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function FileIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ZapIcon({ s = 16 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LogoutIcon({ s = 15 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TrendUpIcon({ s = 11 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SendIcon({ s = 14 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ExternalIcon({ s = 12 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   USER-FACING ANNOUNCEMENT MODAL
   ─────────────────────────────────────────────────────────────────
   DROP THIS INTO app/layout.tsx — it is the only consumer-side
   piece. The admin page below controls what this modal shows.

   HOW THE "NEVER SHOW AGAIN" WORKS:
   The instant this component mounts and finds a live announcement
   the current user hasn't seen, it writes to localStorage:
     nexfluence_seen_announcement_{id} = "1"
   Even if the user rage-closes the browser mid-read, they won't
   see it again on next visit. The write happens on MOUNT, not on
   dismiss — because if we write on dismiss, a user who force-closes
   the tab will see it again. That's a broken product.

   CRITICAL PRIORITY:
   When priority === 'critical' the dismiss button is DISABLED until
   the user ticks the "I acknowledge this change" checkbox. This
   creates a defensible record of informed consent for legal/T&C
   changes. The checkbox state is NOT stored — only the fact of
   having been shown. The admin audit log records the shown event.
   ════════════════════════════════════════════════════════════════════ */
export function AnnouncementModal({ announcement }: { announcement: Announcement | null }) {
  const [visible, setVisible]  = useState(false)
  const [acked,   setAcked]    = useState(false)
  const [leaving, setLeaving]  = useState(false)

  useEffect(() => {
    if (!announcement) return
    const key = `nexfluence_seen_announcement_${announcement.id}`
    if (typeof window !== 'undefined' && localStorage.getItem(key)) return
    /* Write immediately on mount — before dismiss */
    if (typeof window !== 'undefined') localStorage.setItem(key, '1')
    /* Tiny delay so page renders first */
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [announcement?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    setLeaving(true)
    setTimeout(() => { setVisible(false); setLeaving(false) }, 260)
  }

  if (!visible || !announcement) return null

  const pc = PRIORITY_CFG[announcement.priority]
  const canDismiss = announcement.priority !== 'critical' || acked

  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 transition-all duration-260 ${leaving ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-md" onClick={canDismiss ? dismiss : undefined}/>

      {/* Modal */}
      <div className={`relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl bg-white transition-all duration-300 ease-[cubic-bezier(0.34,1.5,0.64,1)] ${leaving ? 'scale-95 opacity-0' : 'scale-100 opacity-100'} ${CARD}`}
        style={{ boxShadow: '0 32px 80px -16px rgba(10,6,18,0.4)' }}>

        {/* Priority accent bar — the visual signal for urgency */}
        <div className={`h-1.5 w-full ${pc.accentBar}`}/>

        {/* Header */}
        <div className="px-7 pt-6 pb-2">
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-[28px] ${pc.iconBg}`}>
              {announcement.icon}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-black uppercase tracking-[0.12em] ${pc.badgeBg} ${pc.badgeText}`}>
                  {pc.label}
                </span>
                {announcement.requireAck && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-rose-600">
                    Action required
                  </span>
                )}
              </div>
              <h2 className="text-[19px] font-extrabold leading-snug tracking-[-0.02em] text-ink">
                {announcement.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-4">
          <p className="text-[14.5px] leading-[1.85] text-ink/70">{announcement.message}</p>
        </div>

        {/* Critical acknowledgement checkbox */}
        {announcement.priority === 'critical' && (
          <div className="mx-7 mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5">
            <button type="button" onClick={() => setAcked(a => !a)}
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${acked ? 'border-rose-500 bg-rose-500 text-white' : 'border-rose-300 bg-white'}`}>
              {acked && <CheckIcon s={11}/>}
            </button>
            <p className="text-[12.5px] font-semibold leading-[1.6] text-rose-700">
              I have read and understood this notice. I acknowledge the changes described above.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 px-7 pb-7">
          {announcement.ctaLabel && announcement.ctaUrl && (
            <a href={announcement.ctaUrl}
              onClick={dismiss}
              className={`flex items-center justify-center gap-2 rounded-xl py-3.5 text-[14.5px] font-bold text-white transition hover:-translate-y-0.5 ${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]`}>
              {announcement.ctaLabel}<ExternalIcon s={13}/>
            </a>
          )}
          <button onClick={dismiss} disabled={!canDismiss}
            className={`py-2.5 text-[13px] font-semibold transition ${canDismiss ? 'text-ink/40 hover:text-ink/70' : 'cursor-not-allowed text-ink/20'}`}>
            {announcement.priority === 'critical' && !acked
              ? 'Tick the checkbox above to continue'
              : "Got it, don't show again"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   REACH PROGRESS BAR — inline component for announcement cards
   ════════════════════════════════════════════════════════════════════ */
function ReachBar({ reach, status }: { reach: ReachStats; status: AnnStatus }) {
  const pct      = reach.eligible > 0 ? Math.round((reach.shown / reach.eligible) * 100) : 0
  const ackPct   = reach.shown   > 0 ? Math.round((reach.acknowledged / reach.shown) * 100) : 0
  const isLive   = status === 'live'

  return (
    <div className="space-y-2.5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-[22px] font-black tracking-[-0.03em] text-ink">{reach.shown.toLocaleString()}</span>
          <span className="ml-1.5 text-[12px] text-ink/40">of {reach.eligible.toLocaleString()} eligible users</span>
        </div>
        <span className={`text-[14px] font-extrabold ${GRAD_TXT}`}>{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/[0.06]">
        <div className={`h-full rounded-full transition-all duration-700 ${GRAD_BTN} ${isLive ? 'animate-[shimmer_2s_linear_infinite]' : ''}`}
          style={{ width: `${pct}%` }}/>
      </div>
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="flex items-center gap-1.5 text-ink/40">
          <CheckIcon s={10}/>{reach.acknowledged.toLocaleString()} clicked CTA
          {reach.shown > 0 && <span className="text-emerald-600 font-bold">({ackPct}%)</span>}
        </span>
        <span className="text-ink/35">{reach.shown - reach.acknowledged} dismissed without CTA</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DAYS REMAINING BADGE
   ════════════════════════════════════════════════════════════════════ */
function DaysLeft({ expiresAt, status }: { expiresAt: string; status: AnnStatus }) {
  if (status !== 'live' && status !== 'scheduled') return null
  /* In real app derive from actual date diff. Mock: parse from string */
  const days = expiresAt.includes('Jul 12') ? 10
    : expiresAt.includes('Jul 20') ? 18
    : expiresAt.includes('Jun 25') ? 0
    : 10
  if (days === 0) return <span className="text-[11px] font-bold text-rose-500">Expiring today</span>
  return (
    <span className={`flex items-center gap-1 text-[11px] font-bold ${days <= 2 ? 'text-amber-600' : 'text-ink/40'}`}>
      <ClockIcon s={11}/>{days}d remaining
    </span>
  )
}

/* ════════════════════════════════════════════════════════════════════
   LIVE PREVIEW — renders the exact user-facing modal from form state
   ════════════════════════════════════════════════════════════════════ */
function LiveModalPreview({ form }: { form: AnnForm }) {
  const [acked, setAcked] = useState(false)
  const pc = PRIORITY_CFG[form.priority]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink/35">Live preview — exactly what users will see</p>
      </div>

      {/* Scaled-down modal */}
      <div className="overflow-hidden rounded-2xl border border-primary/12 bg-white shadow-[0_12px_40px_-12px_rgba(10,6,18,0.25)]">
        <div className={`h-1.5 w-full ${pc.accentBar}`}/>
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[22px] ${pc.iconBg}`}>
              {form.icon || '🚀'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] ${pc.badgeBg} ${pc.badgeText}`}>
                  {pc.label}
                </span>
                {form.requireAck && (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] text-rose-600">Action required</span>
                )}
              </div>
              <h3 className="text-[14px] font-extrabold leading-snug text-ink">
                {form.title || 'Your announcement title will appear here'}
              </h3>
            </div>
          </div>

          <p className="text-[12.5px] leading-[1.75] text-ink/65 mb-3">
            {form.message || 'Your message body will appear here. Keep it short and clear — users should understand the key point in under 10 seconds.'}
          </p>

          {form.priority === 'critical' && (
            <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
              <button type="button" onClick={() => setAcked(a => !a)}
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition ${acked ? 'border-rose-500 bg-rose-500 text-white' : 'border-rose-300 bg-white'}`}>
                {acked && <CheckIcon s={9}/>}
              </button>
              <p className="text-[11px] font-semibold leading-[1.5] text-rose-700">
                I have read and understood this notice.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {form.ctaLabel && (
              <div className={`rounded-xl py-2.5 text-center text-[13px] font-bold text-white ${GRAD_BTN}`}>
                {form.ctaLabel}
              </div>
            )}
            <div className="text-center text-[11.5px] font-semibold text-ink/35">
              {form.priority === 'critical' && !acked ? 'Tick the checkbox above to continue' : "Got it, don't show again"}
            </div>
          </div>
        </div>
      </div>

      {/* Audience + timing note */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {form.targetAudience.map(a => (
          <span key={a} className="rounded-lg bg-surface-sub px-2.5 py-1 text-[11px] font-semibold text-ink/55">
            {AUDIENCE_LABELS[a]}
          </span>
        ))}
        <span className="text-[11px] text-ink/35">·</span>
        <span className="text-[11px] text-ink/40">{form.durationDays} day window</span>
        <span className="text-[11px] text-ink/35">·</span>
        <span className="text-[11px] font-semibold text-ink/40">
          ~{eligibleCount(form.targetAudience).toLocaleString()} eligible
        </span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   COMPOSE SIDEPANEL
   Slides in from the right. Left side = form. Right side = live preview.
   ════════════════════════════════════════════════════════════════════ */
function ComposeSidepanel({ open, initial, onClose, onPublish, onSaveDraft }: {
  open: boolean
  initial: Partial<AnnForm> | null
  onClose: () => void
  onPublish: (form: AnnForm) => void
  onSaveDraft: (form: AnnForm) => void
}) {
  const [form,      setForm]      = useState<AnnForm>(BLANK_FORM)
  const [loading,   setLoading]   = useState(false)
  const [tab,       setTab]       = useState<'compose' | 'preview'>('compose')
  const [emojiOpen, setEmojiOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...BLANK_FORM, ...initial } : BLANK_FORM)
      setTab('compose')
      setLoading(false)
    }
  }, [open, initial?.title]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const set = (k: keyof AnnForm, v: AnnForm[keyof AnnForm]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const toggleAudience = (a: TargetAudience) => {
    setForm(prev => {
      if (a === 'all') return { ...prev, targetAudience: ['all'] }
      const curr = prev.targetAudience.filter(x => x !== 'all')
      const next = curr.includes(a) ? curr.filter(x => x !== a) : [...curr, a]
      return { ...prev, targetAudience: next.length === 0 ? ['all'] : next }
    })
  }

  const isValid = form.title.trim().length > 0 && form.message.trim().length > 0 && form.targetAudience.length > 0

  const handlePublish = async () => {
    if (!isValid) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    onPublish(form)
  }

  const lbl = 'mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40'

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        className={`fixed inset-0 z-[400] bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}/>

      {/* Sidepanel */}
      <div className={`fixed right-0 top-0 z-[500] flex h-full w-full max-w-[900px] flex-col bg-white shadow-[−20px_0_60px_-10px_rgba(10,6,18,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Panel header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${GRAD_BTN}`}><MegaphoneIcon s={17}/></div>
            <h2 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">
              {initial ? 'Edit announcement' : 'New announcement'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: tabs to switch between form and preview */}
            <div className="flex lg:hidden overflow-hidden rounded-xl border border-primary/12 bg-surface-sub p-1">
              <button onClick={() => setTab('compose')} className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${tab === 'compose' ? `${GRAD_BTN} text-white` : 'text-ink/50'}`}>Compose</button>
              <button onClick={() => setTab('preview')} className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${tab === 'preview' ? `${GRAD_BTN} text-white` : 'text-ink/50'}`}>Preview</button>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: compose form ── */}
          <div className={`flex flex-col overflow-y-auto lg:flex lg:w-[52%] lg:border-r lg:border-primary/10 ${tab === 'preview' ? 'hidden' : 'flex w-full'}`}>
            <div className="flex-1 space-y-5 px-6 py-5">

              {/* Emoji picker */}
              <div>
                <label className={lbl}>Icon / Emoji</label>
                <div className="relative">
                  <button type="button" onClick={() => setEmojiOpen(o => !o)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/12 bg-surface-sub text-[24px] transition hover:border-primary/25 hover:bg-white">
                    {form.icon || '🚀'}
                  </button>
                  {emojiOpen && (
                    <div className={`absolute left-0 top-[calc(100%+6px)] z-20 flex flex-wrap gap-1.5 rounded-2xl border border-primary/10 bg-white p-3 ${CARD}`} style={{ width: 260 }}>
                      {EMOJI_PRESETS.map(e => (
                        <button key={e} type="button"
                          onClick={() => { set('icon', e); setEmojiOpen(false) }}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-[20px] transition hover:bg-primary/[0.07] ${form.icon === e ? 'bg-primary/[0.09] ring-2 ring-primary/30' : ''}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className={lbl}>Title *</label>
                <input className={INP} value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Agency profiles are now live on Creator Nexus"
                  maxLength={120}/>
                <p className="mt-1 text-right text-[11px] text-ink/30">{form.title.length}/120</p>
              </div>

              {/* Message */}
              <div>
                <label className={lbl}>Message *</label>
                <textarea className={`${INP} resize-y leading-relaxed`} rows={4}
                  value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder="Keep it under 3 sentences. Users should get the point before they finish reading."
                  maxLength={600}/>
                <p className="mt-1 flex justify-between text-[11px] text-ink/30">
                  <span>Aim for under 280 characters for best read-through</span>
                  <span>{form.message.length}/600</span>
                </p>
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>CTA button label</label>
                  <input className={INP} value={form.ctaLabel} onChange={e => set('ctaLabel', e.target.value)}
                    placeholder="See what's new"/>
                </div>
                <div>
                  <label className={lbl}>CTA destination URL</label>
                  <input className={INP} value={form.ctaUrl} onChange={e => set('ctaUrl', e.target.value)}
                    placeholder="/changelog"/>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className={lbl}>Priority</label>
                <div className="flex gap-2">
                  {(['info', 'important', 'critical'] as Priority[]).map(p => {
                    const pc = PRIORITY_CFG[p]
                    const sel = form.priority === p
                    return (
                      <button key={p} type="button" onClick={() => set('priority', p)}
                        className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition ${sel ? `${pc.cardBorder} ${pc.cardBg}` : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                        <span className={`h-2 w-2 rounded-full ${pc.dot}`}/>
                        <span className={`text-[12.5px] font-bold ${sel ? pc.badgeText : 'text-ink/55'}`}>{pc.label}</span>
                      </button>
                    )
                  })}
                </div>
                {form.priority === 'critical' && (
                  <p className="mt-2 text-[11.5px] text-rose-600 font-semibold">
                    Critical: users must tick "I acknowledge" before they can dismiss.
                  </p>
                )}
              </div>

              {/* Target audience */}
              <div>
                <label className={lbl}>Who sees this?</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'brands', 'creators', 'agencies'] as TargetAudience[]).map(a => {
                    const sel = form.targetAudience.includes(a)
                    return (
                      <button key={a} type="button" onClick={() => toggleAudience(a)}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-[13px] font-bold transition ${sel ? `${GRAD_BTN} border-transparent text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.4)]` : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
                        {sel && <CheckIcon s={11}/>}{AUDIENCE_LABELS[a]}
                        {sel && <span className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-black ${sel ? 'bg-white/25 text-white' : 'bg-primary/[0.08] text-primary'}`}>
                          {eligibleCount([a]).toLocaleString()}
                        </span>}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[12px] text-ink/40">
                  ~<span className="font-bold text-ink">{eligibleCount(form.targetAudience).toLocaleString()}</span> users will be shown this announcement
                </p>
              </div>

              {/* Require explicit acknowledgement */}
              <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-surface-sub px-4 py-3.5">
                <div>
                  <p className="text-[13px] font-bold text-ink">Require explicit acknowledgement</p>
                  <p className="text-[11.5px] text-ink/45 mt-0.5">Forces a checkbox before the dismiss button activates. Use for T&C or legal changes.</p>
                </div>
                <button type="button" onClick={() => set('requireAck', !form.requireAck)}
                  className={`relative ml-4 flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${form.requireAck ? GRAD_BTN : 'bg-ink/15'}`}>
                  <span className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                    style={{ transform: form.requireAck ? 'translateX(22px)' : 'translateX(2px)' }}/>
                </button>
              </div>

              {/* Schedule & duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Send</label>
                  <div className="flex gap-2">
                    {[{ id: true, label: 'Now' }, { id: false, label: 'Schedule' }].map(opt => (
                      <button key={String(opt.id)} type="button" onClick={() => set('scheduleNow', opt.id)}
                        className={`flex-1 rounded-xl border-2 py-2.5 text-[13px] font-bold transition ${form.scheduleNow === opt.id ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/12 bg-white text-ink/50 hover:border-primary/22'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {!form.scheduleNow && (
                    <input type="datetime-local" className={`${INP} mt-2`}
                      value={form.scheduledFor} onChange={e => set('scheduledFor', e.target.value)}/>
                  )}
                </div>
                <div>
                  <label className={lbl}>Duration (days)</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={1} max={30} step={1} value={form.durationDays}
                      onChange={e => set('durationDays', parseInt(e.target.value, 10))}
                      className="flex-1 accent-primary"/>
                    <span className={`w-12 rounded-xl border border-primary/12 bg-surface-sub py-2 text-center text-[13px] font-extrabold ${GRAD_TXT}`}>
                      {form.durationDays}d
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink/35">Expires after {form.durationDays} days automatically</p>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-shrink-0 gap-3 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
              <button onClick={() => onSaveDraft(form)} disabled={!isValid}
                className={`flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-5 py-3 text-[13.5px] font-bold text-primary transition ${isValid ? 'hover:-translate-y-0.5' : 'cursor-not-allowed opacity-40'}`}>
                <FileIcon s={13}/>Save draft
              </button>
              <button onClick={handlePublish} disabled={!isValid || loading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${isValid && !loading ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                {loading
                  ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Publishing…</>
                  : <><SendIcon s={14}/>{form.scheduleNow ? 'Publish now' : 'Schedule'}</>
                }
              </button>
            </div>
          </div>

          {/* ── RIGHT: live preview ── */}
          <div className={`bg-surface-sub/40 lg:flex lg:w-[48%] lg:flex-col ${tab === 'compose' ? 'hidden' : 'flex w-full'}`}>
            <div className="flex-1 overflow-y-auto p-6">
              <LiveModalPreview form={form}/>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
/* ════════════════════════════════════════════════════════════════════
   ANNOUNCEMENT CARD — shown on the admin listing page
   ════════════════════════════════════════════════════════════════════ */
function AnnouncementCard({ ann, onEdit, onPause, onResume, onArchive }: {
  ann: Announcement
  onEdit:    (ann: Announcement) => void
  onPause:   (id: string) => void
  onResume:  (id: string) => void
  onArchive: (id: string) => void
}) {
  const pc = PRIORITY_CFG[ann.priority]
  const sc = STATUS_CFG[ann.status]
  const isLive  = ann.status === 'live'
  const canAct  = ann.status === 'live' || ann.status === 'scheduled' || ann.status === 'paused'

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white ${CARD} ${ann.status === 'expired' || ann.status === 'archived' ? 'opacity-60' : ''} ${ann.priority === 'critical' && isLive ? 'border-rose-200' : 'border-primary/10'}`}>

      {/* Priority accent */}
      <div className={`h-1 w-full ${pc.accentBar}`}/>

      <div className="p-5">
        {/* Header row */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[22px] ${pc.iconBg}`}>
              {ann.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${isLive ? 'animate-pulse' : ''}`}/>
                  {sc.label}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${pc.badgeBg} ${pc.badgeText}`}>
                  {pc.label}
                </span>
                {ann.requireAck && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10.5px] font-bold text-rose-600">
                    Ack required
                  </span>
                )}
              </div>
              <h3 className="text-[14.5px] font-extrabold leading-snug text-ink">{ann.title}</h3>
            </div>
          </div>
          <DaysLeft expiresAt={ann.expiresAt} status={ann.status}/>
        </div>

        {/* Message preview */}
        <p className="mb-4 line-clamp-2 text-[13px] leading-[1.65] text-ink/55">{ann.message}</p>

        {/* Audience + timing */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11.5px] text-ink/40">
          <span className="flex items-center gap-1"><UsersIcon s={12}/>{ann.targetAudience.map(a => AUDIENCE_LABELS[a]).join(', ')}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><ClockIcon s={11}/>{ann.scheduledFor}</span>
          <span>·</span>
          <span>Expires {ann.expiresAt}</span>
          {ann.ctaLabel && (
            <><span>·</span><span className="flex items-center gap-1"><ExternalIcon s={11}/>{ann.ctaLabel}</span></>
          )}
        </div>

        {/* Reach stats — only if has been shown to anyone */}
        {ann.reach.eligible > 0 && (
          <div className="mb-4 rounded-xl border border-primary/8 bg-surface-sub/50 p-4">
            <ReachBar reach={ann.reach} status={ann.status}/>
          </div>
        )}

        {/* No-reach scheduled message */}
        {ann.status === 'scheduled' && ann.reach.eligible === 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/10 bg-surface-sub/60 px-4 py-3">
            <ClockIcon s={14}/>
            <p className="text-[12.5px] font-semibold text-ink/45">
              Will reach ~{eligibleCount(ann.targetAudience).toLocaleString()} users when it goes live on {ann.scheduledFor}
            </p>
          </div>
        )}

        {/* Actions */}
        {canAct && (
          <div className="flex gap-2">
            <button onClick={() => onEdit(ann)}
              className="flex items-center gap-1.5 rounded-xl border border-primary/15 bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink/60 transition hover:border-primary/30 hover:text-ink">
              <EditIcon s={12}/>Edit
            </button>
            {isLive || ann.status === 'scheduled' ? (
              <button onClick={() => onPause(ann.id)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-[12.5px] font-bold text-amber-700 transition hover:bg-amber-100">
                <PauseIcon s={12}/>Pause
              </button>
            ) : (
              <button onClick={() => onResume(ann.id)}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[12.5px] font-bold text-emerald-700 transition hover:bg-emerald-100">
                <PlayIcon s={12}/>Resume
              </button>
            )}
            <button onClick={() => onArchive(ann.id)}
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-primary/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-ink/35 transition hover:text-ink/60">
              <ArchiveIcon s={12}/>Archive
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function AdminAnnouncementsPage() {
  const router = useRouter()

  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS)
  const [panelOpen,     setPanelOpen]     = useState(false)
  const [editTarget,    setEditTarget]    = useState<Partial<AnnForm> | null>(null)
  const [showArchived,  setShowArchived]  = useState(false)
  const [toast,         setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  /* Preview: show the first live announcement in the admin's own UI */
  const [previewAnn, setPreviewAnn] = useState<Announcement | null>(null)

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3200)
  }, [])

  /* Derived lists */
  const active   = announcements.filter(a => a.status === 'live' || a.status === 'scheduled' || a.status === 'paused')
  const archived = announcements.filter(a => a.status === 'expired' || a.status === 'archived')
  const liveCount = announcements.filter(a => a.status === 'live').length

  /* Actions */
  const handlePublish = (form: AnnForm) => {
    const id   = `ann${Date.now()}`
    const now  = new Date()
    const exp  = new Date(now.getTime() + form.durationDays * 86400000)
    const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const newAnn: Announcement = {
      id, title: form.title, message: form.message,
      icon: form.icon, ctaLabel: form.ctaLabel || null, ctaUrl: form.ctaUrl || null,
      priority: form.priority, targetAudience: form.targetAudience,
      requireAck: form.requireAck, durationDays: form.durationDays,
      status: form.scheduleNow ? 'live' : 'scheduled',
      scheduledFor: form.scheduleNow ? `${fmtDate(now)} · ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : form.scheduledFor,
      expiresAt: fmtDate(exp), createdAt: fmtDate(now), createdBy: 'Harshul G.',
      reach: { eligible: form.scheduleNow ? eligibleCount(form.targetAudience) : 0, shown: 0, acknowledged: 0 },
    }
    setAnnouncements(prev => [newAnn, ...prev])
    setPanelOpen(false)
    setEditTarget(null)
    showToast(form.scheduleNow ? '🚀 Announcement is live — users will see it on their next page load' : '📅 Announcement scheduled')
  }

  const handleSaveDraft = (form: AnnForm) => {
    setPanelOpen(false)
    setEditTarget(null)
    showToast('Draft saved — not yet visible to users')
  }

  const handlePause = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, status: 'paused' as AnnStatus } : a))
    showToast('Announcement paused — no new users will be shown it')
  }

  const handleResume = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, status: 'live' as AnnStatus } : a))
    showToast('Announcement resumed — showing to new users again')
  }

  const handleArchive = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, status: 'archived' as AnnStatus } : a))
    showToast('Archived — removed from active list')
  }

  const handleEdit = (ann: Announcement) => {
    setEditTarget({
      title: ann.title, message: ann.message, icon: ann.icon,
      ctaLabel: ann.ctaLabel ?? '', ctaUrl: ann.ctaUrl ?? '',
      priority: ann.priority, targetAudience: ann.targetAudience,
      requireAck: ann.requireAck, durationDays: ann.durationDays, scheduleNow: true,
    })
    setPanelOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ USER-FACING MODAL PREVIEW (admin preview only) ════ */}
      {previewAnn && <AnnouncementModal announcement={previewAnn}/>}

      {/* ════ TOAST ════ */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[900] -translate-x-1/2">
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-white shadow-lg ${toast.type === 'ok' ? `${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]` : 'bg-rose-500'}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
              {toast.type === 'ok' ? <CheckIcon s={13}/> : <XIcon s={13}/>}
            </span>
            <p className="text-[13.5px] font-bold">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* ════ COMPOSE SIDEPANEL ════ */}
      <ComposeSidepanel
        open={panelOpen}
        initial={editTarget}
        onClose={() => { setPanelOpen(false); setEditTarget(null) }}
        onPublish={handlePublish}
        onSaveDraft={handleSaveDraft}
      />

      {/* ════ SIDEBAR ════ */}
      <aside className="hidden w-[220px] flex-shrink-0 flex-col bg-[#0A0612] lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-5 py-5">
          <NexLogo className="h-8 drop-shadow-[0_2px_10px_rgba(139,49,232,0.5)]"/>
          <div className="flex h-5 items-center rounded-md border border-amber-400/25 bg-amber-400/10 px-2">
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-400">Admin</span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {[
            { icon: <DashIcon s={15}/>,      label: 'Dashboard',      active: false, href: '/admin/dashboard',      badge: 0 },
            { icon: <UsersIcon s={15}/>,     label: 'Users',          active: false, href: '/admin/users',          badge: 0 },
            { icon: <ActivityIcon s={15}/>,  label: 'Campaigns',      active: false, href: '/admin/campaigns',      badge: 0 },
            { icon: <EuroIcon s={15}/>,      label: 'Transactions',   active: false, href: '/admin/transactions',   badge: 0 },
            { icon: <TicketIcon s={15}/>,    label: 'Disputes',       active: false, href: '/admin/disputes',       badge: 0 },
            { icon: <FileIcon s={15}/>,      label: 'Resources',      active: false, href: '/admin/resources',      badge: 0 },
            { icon: <MegaphoneIcon s={15}/>, label: 'Announcements',  active: true,  href: '/admin/announcements',  badge: liveCount },
            { icon: <ZapIcon s={15}/>,       label: 'System',         active: false, href: '/admin/system',         badge: 0 },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${item.active ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]` : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'}`}>
              {item.icon}{item.label}
              {item.badge > 0 && (
                <span className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white ${item.active ? 'bg-white/25' : 'bg-emerald-500'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/[0.07] px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${GRAD_BTN}`}>H</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-white">Harshul G.</p>
              <p className="text-[11px] text-white/35">Founder</p>
            </div>
            <button onClick={() => router.push('/admin/login')} className="text-white/30 transition hover:text-white/60"><LogoutIcon s={15}/></button>
          </div>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ════ TOPBAR ════ */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-primary/10 bg-white/95 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h1 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">Announcements</h1>
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>{liveCount} live
              </span>
            )}
          </div>
          <button onClick={() => { setEditTarget(null); setPanelOpen(true) }}
            className={`flex items-center gap-2 rounded-xl ${GRAD_BTN} px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
            <PlusIcon s={14}/>New announcement
          </button>
        </header>

        <main className="flex-1 overflow-auto px-6 py-6">

          {/* ── How it works explainer (first-time context) ── */}
          <div className={`mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
            <div className="flex items-start gap-5 p-5">
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white ${GRAD_BTN}`}>
                <MegaphoneIcon s={20}/>
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-extrabold text-ink">How announcements work</h3>
                <p className="mt-1 text-[13px] leading-[1.7] text-ink/55">
                  A live announcement shows as a <span className="font-bold text-ink">full-screen modal</span> to every signed-in user in the target audience — on their <span className="font-bold text-ink">next page load</span>. The instant it appears, it's marked as seen for that user. <span className="font-bold text-ink">They will never see it again</span>, even if they close the browser. Announcements expire automatically after the set duration.
                </p>
              </div>
              <div className="hidden flex-shrink-0 grid-cols-3 gap-3 text-center lg:grid">
                {[
                  { label: 'Open rate', value: '100%', note: 'Blocks the UI — no way to miss it' },
                  { label: 'Max duration', value: '30 days', note: 'Auto-expires, no manual cleanup' },
                  { label: 'Per-user', value: 'Once only', note: 'Seen = never shown again' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-surface-sub px-4 py-3">
                    <div className={`text-[22px] font-black ${GRAD_TXT}`}>{s.value}</div>
                    <div className="mt-0.5 text-[11px] font-bold text-ink/50">{s.label}</div>
                    <div className="mt-0.5 text-[10px] text-ink/35">{s.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── KPI strip ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: 'Total live',
                value: String(liveCount),
                sub: 'Currently showing to users',
                accent: liveCount > 0,
              },
              {
                label: 'Total reach today',
                value: announcements.filter(a => a.status === 'live').reduce((s, a) => s + a.reach.shown, 0).toLocaleString(),
                sub: 'Unique users shown a modal',
                accent: false,
              },
              {
                label: 'Avg CTA click rate',
                value: (() => {
                  const total = announcements.reduce((s, a) => s + a.reach.shown, 0)
                  const acked = announcements.reduce((s, a) => s + a.reach.acknowledged, 0)
                  return total > 0 ? `${Math.round((acked / total) * 100)}%` : '—'
                })(),
                sub: 'Of shown users clicked CTA',
                accent: false,
              },
              {
                label: 'Scheduled',
                value: String(announcements.filter(a => a.status === 'scheduled').length),
                sub: 'Queued, not yet live',
                accent: false,
              },
            ].map(s => (
              <div key={s.label} className={`flex flex-col gap-2 rounded-2xl border p-5 ${s.accent ? `${GRAD_BTN} border-transparent shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]` : `border-primary/10 bg-white ${CARD}`}`}>
                <div className={`text-[26px] font-black tracking-[-0.03em] ${s.accent ? 'text-white' : 'text-ink'}`}>{s.value}</div>
                <div className={`text-[12.5px] font-semibold ${s.accent ? 'text-white/70' : 'text-ink/50'}`}>{s.label}</div>
                <div className={`text-[11px] ${s.accent ? 'text-white/45' : 'text-ink/35'}`}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Active + scheduled ── */}
          {active.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-[13px] font-black uppercase tracking-[0.12em] text-ink/40">Active & scheduled ({active.length})</h2>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {active.map(ann => (
                  <AnnouncementCard key={ann.id} ann={ann}
                    onEdit={handleEdit} onPause={handlePause} onResume={handleResume} onArchive={handleArchive}/>
                ))}
              </div>
            </div>
          )}

          {/* ── Empty state ── */}
          {active.length === 0 && (
            <div className={`mb-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white py-16 text-center ${CARD}`}>
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white ${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)]`}>
                <MegaphoneIcon s={28}/>
              </div>
              <h3 className="text-[16px] font-extrabold text-ink">No active announcements</h3>
              <p className="mt-2 max-w-[320px] text-[13px] text-ink/45">Create one to show a modal to all your users on their next page load. 100% open rate, seen once, gone forever.</p>
              <button onClick={() => { setEditTarget(null); setPanelOpen(true) }}
                className={`mt-5 flex items-center gap-2 rounded-xl ${GRAD_BTN} px-6 py-3 text-[13.5px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
                <PlusIcon s={14}/>Create announcement
              </button>
            </div>
          )}

          {/* ── History / archived ── */}
          {archived.length > 0 && (
            <div>
              <button onClick={() => setShowArchived(s => !s)}
                className="mb-4 flex items-center gap-2 text-[13px] font-black uppercase tracking-[0.12em] text-ink/35 hover:text-ink/55">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ transform: showArchived ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                History & archived ({archived.length})
              </button>
              {showArchived && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {archived.map(ann => (
                    <AnnouncementCard key={ann.id} ann={ann}
                      onEdit={handleEdit} onPause={handlePause} onResume={handleResume} onArchive={handleArchive}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Integration guide ── */}
          <div className={`mt-8 rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${GRAD_BTN}`}><ZapIcon s={16}/></div>
              <h3 className="text-[14px] font-extrabold text-ink">Developer integration</h3>
            </div>
            <p className="mb-4 text-[13px] leading-[1.7] text-ink/55">
              Add the <code className="rounded-lg bg-surface-sub px-2 py-0.5 font-mono text-[12px] text-primary">AnnouncementModal</code> component to <code className="rounded-lg bg-surface-sub px-2 py-0.5 font-mono text-[12px] text-primary">app/layout.tsx</code>. It fetches the current live announcement from the backend and handles localStorage deduplication automatically. Zero configuration required per-page.
            </p>
            <div className="rounded-xl border border-primary/10 bg-[#0A0612] px-5 py-4 font-mono text-[13px] leading-[1.9] text-white/80">
              <span className="text-primary/70">{'// '}</span><span className="text-white/40">app/layout.tsx</span><br/>
              <span className="text-primary">import</span>{' { AnnouncementModal } '}<span className="text-primary">from</span>{' '}<span className="text-amber-300">'@/components/AnnouncementModal'</span><br/>
              <span className="text-primary">import</span>{' { getCurrentAnnouncement } '}<span className="text-primary">from</span>{' '}<span className="text-amber-300">'@/lib/announcements'</span><br/><br/>
              <span className="text-primary/70">{'// '}</span><span className="text-white/40">Inside your root layout, after auth check:</span><br/>
              <span className="text-emerald-400">{'<AnnouncementModal'}</span>{' announcement={await getCurrentAnnouncement(userId)} '}<span className="text-emerald-400">{'/>'}</span><br/><br/>
              <span className="text-primary/70">{'// '}</span><span className="text-white/40">localStorage key written on first show:</span><br/>
              <span className="text-amber-300">nexfluence_seen_announcement_{'{id}'}</span>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}