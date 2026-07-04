'use client'

import React, {
  useState, useEffect, useRef, useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   User Control — app/admin/user-control/page.tsx
   Nexfluence v4, LIGHT · dark sidebar variant

   THE FIVE CONTROL STATES — a SPECTRUM, not a binary:
   ─────────────────────────────────────────────────────────────────
   Most platforms give you "ban" or "nothing." That's lazy and
   causes two failure modes:
     (a) You over-punish — ban someone who needed a warning,
         they file a lawsuit, you lose.
     (b) You under-punish — warn someone who needed a ban,
         they defraud again.

   Graduated enforcement solves both. Every level has a documented,
   defensible purpose.

   active        → Normal. No restrictions.

   under_review  → Monitoring. User operates normally but every
                   action is logged at elevated detail. No friction
                   for the user — just more scrutiny for you.
                   Use: early fraud signals, DAC7 concerns,
                   dispute investigation.

   restricted    → Capabilities degraded but account alive.
                   Cannot: create campaigns, receive payouts,
                   sign new contracts.
                   Can: message (so you can reach them), view
                   their own data, appeal via support.
                   Grade: payout hold activated.
                   Use: payment disputes, KYC failures, content
                   violations under review.

   suspended     → Account fully frozen. Session invalidated.
                   Profile hidden. Pending campaigns paused.
                   Grade: all escrow held.
                   Duration: manual lift only.
                   Use: confirmed fraud attempt, harassment,
                   serious contract breach. One step before ban.

   banned        → Permanent. GDPR-compliant deletion (data
                   retained for legal, profile removed).
                   Email + device fingerprint blocklisted.
                   Grade relationship terminated.
                   Associated accounts flagged.
                   Use: proven fraud, synthetic account, repeated
                   abuse after suspension. No way back.

   PERSONA DIMENSION — why it matters:
   The same status flag has wildly different downstream effects
   depending on who you're applying it to:
     Brand restricted  → cannot launch campaigns (protects creators)
     Creator restricted → cannot receive payouts (protects brands)
     Agency restricted  → cannot act for EITHER side (protects both)
   The UI surfaces these persona-specific consequences explicitly
   in the action modal. Admins should never have to guess what
   "restrict" means for a specific user type.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

/* ─── Types ──────────────────────────────────────────────────────── */
type UserStatus  = 'active' | 'under_review' | 'restricted' | 'suspended' | 'banned'
type UserType    = 'brand' | 'creator' | 'agency'
type RiskLevel   = 'low' | 'medium' | 'high' | 'critical'
type AuditAction = 'warning_issued' | 'status_changed' | 'note_added' | 'grade_hold' | 'system_flag' | 'account_unbanned' | 'review_cleared'

interface AuditEntry {
  id:        string
  action:    AuditAction
  from:      UserStatus | null
  to:        UserStatus | null
  by:        string              /* admin name or "System" */
  at:        string
  reason:    string
  isSystem:  boolean
}

interface UserAccount {
  id:           string
  name:         string
  email:        string
  type:         UserType
  status:       UserStatus
  riskLevel:    RiskLevel
  joinedAt:     string
  lastActiveAt: string
  kycVerified:  boolean
  /* Stats */
  campaigns:    number
  disputes:     number
  totalGMV:     number
  flagCount:    number           /* number of flags/warnings */
  /* Active restrictions */
  gradeHold:    boolean
  profileHidden:boolean
  sessionKilled:boolean
  /* Audit */
  auditLog:     AuditEntry[]
  /* Optional context */
  linkedTicket: string | null
  note:         string
}

/* ─── Persona-specific consequences of each status ───────────────── */
const PERSONA_CONSEQUENCES: Record<UserType, Record<UserStatus, string[]>> = {
  brand: {
    active:       ['Can launch campaigns', 'Can sign contracts', 'Can message creators'],
    under_review: ['Operating normally', 'All actions logged at elevated detail', 'No friction for user'],
    restricted:   ['Cannot create new campaigns', 'Cannot sign new contracts', 'Can still message creators'],
    suspended:    ['Session invalidated — cannot log in', 'Profile hidden from creators', 'Pending campaigns paused', 'Grade escrow frozen'],
    banned:       ['Account deleted (data retained for legal)', 'Email blocklisted', 'Device fingerprint flagged', 'Grade relationship terminated'],
  },
  creator: {
    active:       ['Can receive payouts', 'Can accept campaign invites', 'Can submit content'],
    under_review: ['Operating normally', 'All actions logged at elevated detail', 'No friction for user'],
    restricted:   ['Cannot receive payouts — Grade hold active', 'Cannot sign new contracts', 'Can still message brands'],
    suspended:    ['Session invalidated — cannot log in', 'Profile hidden from brands', 'Pending payouts frozen in escrow', 'Active campaigns paused'],
    banned:       ['Account deleted (data retained for legal)', 'Email blocklisted', 'Device fingerprint flagged', 'Any earned escrow returned to brands'],
  },
  agency: {
    active:       ['Can manage brands and creators', 'Can sign management agreements', 'Can process payouts'],
    under_review: ['Operating normally', 'All actions logged at elevated detail', 'Brand clients notified of review'],
    restricted:   ['Cannot act on behalf of brands', 'Cannot distribute payouts to creators', 'Cannot sign new management agreements'],
    suspended:    ['Session invalidated — cannot log in', 'All managed brand campaigns paused', 'Creator disbursements frozen', 'Brand clients notified'],
    banned:       ['Account deleted (data retained for legal)', 'Brand clients must find new management', 'Creator roster contracts voided', 'Email + device blocklisted'],
  },
}

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS_CFG: Record<UserStatus, {
  label: string; dot: string; bg: string; text: string; border: string
  severity: number  /* 0=safe, 4=nuclear */
  icon: string
}> = {
  active:       { label: 'Active',        dot: 'bg-emerald-400', bg: 'bg-emerald-50',     text: 'text-emerald-700', border: 'border-emerald-200', severity: 0, icon: '✓' },
  under_review: { label: 'Under review',  dot: 'bg-blue-400',    bg: 'bg-blue-50',        text: 'text-blue-700',    border: 'border-blue-200',    severity: 1, icon: '🔍' },
  restricted:   { label: 'Restricted',    dot: 'bg-amber-400',   bg: 'bg-amber-50',       text: 'text-amber-700',   border: 'border-amber-200',   severity: 2, icon: '⚠' },
  suspended:    { label: 'Suspended',     dot: 'bg-orange-500',  bg: 'bg-orange-50',      text: 'text-orange-700',  border: 'border-orange-200',  severity: 3, icon: '🔒' },
  banned:       { label: 'Banned',        dot: 'bg-rose-600',    bg: 'bg-rose-50',        text: 'text-rose-700',    border: 'border-rose-200',    severity: 4, icon: '🚫' },
}

const RISK_CFG: Record<RiskLevel, { label: string; dot: string; bg: string; text: string }> = {
  low:      { label: 'Low risk',      dot: 'bg-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  medium:   { label: 'Medium risk',   dot: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
  high:     { label: 'High risk',     dot: 'bg-orange-500',  bg: 'bg-orange-50',   text: 'text-orange-700'  },
  critical: { label: 'Critical risk', dot: 'bg-rose-600',    bg: 'bg-rose-50',     text: 'text-rose-700'    },
}

const TYPE_CFG: Record<UserType, { label: string; bg: string; text: string; color: string }> = {
  brand:   { label: 'Brand',   bg: 'bg-blue-50',    text: 'text-blue-700',    color: '#2563EB' },
  creator: { label: 'Creator', bg: 'bg-violet-50',  text: 'text-violet-700',  color: '#8B31E8' },
  agency:  { label: 'Agency',  bg: 'bg-emerald-50', text: 'text-emerald-700', color: '#059669' },
}

const AUDIT_CFG: Record<AuditAction, { label: string; icon: string; color: string }> = {
  warning_issued:   { label: 'Warning issued',    icon: '⚠',  color: 'text-amber-600'  },
  status_changed:   { label: 'Status changed',    icon: '🔄',  color: 'text-blue-600'   },
  note_added:       { label: 'Note added',        icon: '📝',  color: 'text-ink/50'     },
  grade_hold:       { label: 'Grade hold placed', icon: '💳',  color: 'text-orange-600' },
  system_flag:      { label: 'System flag',       icon: '🤖',  color: 'text-rose-600'   },
  account_unbanned: { label: 'Account restored',  icon: '✅',  color: 'text-emerald-600'},
  review_cleared:   { label: 'Review cleared',    icon: '🟢',  color: 'text-emerald-600'},
}

/* ─── Mock users ─────────────────────────────────────────────────── */
const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u001', name: 'Jonas Petrauskas', email: 'jonas@petrauskas.lt',
    type: 'creator', status: 'restricted', riskLevel: 'high',
    joinedAt: 'May 12, 2026', lastActiveAt: '5h ago',
    kycVerified: false, campaigns: 2, disputes: 1, totalGMV: 0,
    flagCount: 2, gradeHold: true, profileHidden: false, sessionKilled: false,
    linkedTicket: 'TKT-2026-0049', note: 'Brief violation + KYC pending. Restricted pending KYC completion and dispute resolution.',
    auditLog: [
      { id: 'a1', action: 'system_flag',    from: 'active',     to: null,         by: 'System',      at: 'Jul 2, 2026 · 11:30', reason: 'Competitor product visible in submitted content — auto-flagged by content review.', isSystem: true },
      { id: 'a2', action: 'grade_hold',     from: null,         to: null,         by: 'System',      at: 'Jul 2, 2026 · 11:30', reason: 'Automatic Grade payout hold triggered by content flag.', isSystem: true },
      { id: 'a3', action: 'status_changed', from: 'active',     to: 'restricted', by: 'Harshul G.',  at: 'Jul 2, 2026 · 12:00', reason: 'Content violation (TKT-2026-0049) and KYC not verified after 52 days. Restricted until both are resolved.', isSystem: false },
    ],
  },
  {
    id: 'u002', name: 'Unknown Creator', email: 'user8841@fastmail.com',
    type: 'creator', status: 'banned', riskLevel: 'critical',
    joinedAt: 'Jun 26, 2026', lastActiveAt: 'Jun 28, 2026',
    kycVerified: false, campaigns: 0, disputes: 0, totalGMV: 0,
    flagCount: 5, gradeHold: true, profileHidden: true, sessionKilled: true,
    linkedTicket: null, note: 'Synthetic account. Fraudulent payout request (€8,500, no contract, no campaign). Banned Jun 28.',
    auditLog: [
      { id: 'a4', action: 'system_flag',    from: 'active',     to: null,         by: 'System',      at: 'Jun 28, 2026 · 22:47', reason: 'Transaction €8,500 flagged — 40× above new account average, no campaign/contract linked.', isSystem: true },
      { id: 'a5', action: 'status_changed', from: 'active',     to: 'suspended',  by: 'Harshul G.',  at: 'Jun 28, 2026 · 23:00', reason: 'Synthetic account suspected. Immediate suspension pending investigation.', isSystem: false },
      { id: 'a6', action: 'status_changed', from: 'suspended',  to: 'banned',     by: 'Harshul G.',  at: 'Jun 28, 2026 · 23:02', reason: 'Confirmed synthetic account. No real identity. Fraudulent payout rejected (TKT none). Permanent ban. Email + device fingerprint blocklisted.', isSystem: false },
    ],
  },
  {
    id: 'u003', name: 'NordGlow Agency', email: 'admin@nordglow.lv',
    type: 'agency', status: 'under_review', riskLevel: 'medium',
    joinedAt: 'Jun 28, 2026', lastActiveAt: '2d ago',
    kycVerified: false, campaigns: 0, disputes: 0, totalGMV: 0,
    flagCount: 0, gradeHold: false, profileHidden: false, sessionKilled: false,
    linkedTicket: null, note: 'KYC documents not uploaded 72h after joining. Placed under review. Auto-lifts when KYC clears.',
    auditLog: [
      { id: 'a7', action: 'system_flag',    from: 'active',     to: null,         by: 'System',      at: 'Jul 1, 2026 · 09:00', reason: 'KYC documents not uploaded within 72-hour SLA window.', isSystem: true },
      { id: 'a8', action: 'status_changed', from: 'active',     to: 'under_review',by: 'System',     at: 'Jul 1, 2026 · 09:00', reason: 'Auto-triggered: KYC SLA breached. Account placed under review. User notified.', isSystem: true },
    ],
  },
  {
    id: 'u004', name: 'Forma Fit', email: 'mktg@formafit.ee',
    type: 'brand', status: 'restricted', riskLevel: 'high',
    joinedAt: 'Mar 5, 2026', lastActiveAt: '1h ago',
    kycVerified: true, campaigns: 3, disputes: 2, totalGMV: 4200,
    flagCount: 2, gradeHold: false, profileHidden: false, sessionKilled: false,
    linkedTicket: 'TKT-2026-0051', note: 'Bypassed managed agency (TKT-0051) and filed false cancellation on Training Block Q3 (TKT-0040). Restricted pending dispute resolution.',
    auditLog: [
      { id: 'a9', action: 'warning_issued',  from: null,        to: null,         by: 'Harshul G.',  at: 'Jun 20, 2026 · 14:00', reason: 'Contacted managed creator Rūta Vaitkutė directly via Instagram, bypassing Baltic Creators Agency. Written warning issued.', isSystem: false },
      { id: 'a10', action: 'status_changed', from: 'active',    to: 'restricted', by: 'Harshul G.',  at: 'Jun 22, 2026 · 16:00', reason: 'Second breach of agency exclusivity clause (TKT-2026-0051). Restricted until dispute resolved. Cannot launch new campaigns.', isSystem: false },
      { id: 'a11', action: 'note_added',     from: null,        to: null,         by: 'Harshul G.',  at: 'Jun 22, 2026 · 16:01', reason: 'Notified Forma Fit CMO by email. 7-day resolution window.', isSystem: false },
    ],
  },
  {
    id: 'u005', name: 'Reval Nutrition', email: 'info@revalnutrition.ee',
    type: 'brand', status: 'suspended', riskLevel: 'critical',
    joinedAt: 'Jun 30, 2026', lastActiveAt: 'Jul 2, 2026',
    kycVerified: false, campaigns: 0, disputes: 0, totalGMV: 0,
    flagCount: 3, gradeHold: true, profileHidden: true, sessionKilled: true,
    linkedTicket: null, note: 'New account, multiple failed payment attempts in first 24h. Suspected card testing / carding fraud. Suspended pending investigation.',
    auditLog: [
      { id: 'a12', action: 'system_flag',    from: 'active',    to: null,         by: 'System',      at: 'Jul 2, 2026 · 07:12', reason: '3 failed payment attempts in 4 minutes. Card testing pattern detected.', isSystem: true },
      { id: 'a13', action: 'grade_hold',     from: null,        to: null,         by: 'System',      at: 'Jul 2, 2026 · 07:12', reason: 'Grade notified of potential carding attempt. Payment method flagged.', isSystem: true },
      { id: 'a14', action: 'status_changed', from: 'active',    to: 'suspended',  by: 'Harshul G.',  at: 'Jul 2, 2026 · 08:00', reason: 'Card testing fraud pattern. Suspended account. Session killed. Profile hidden. Awaiting Stripe chargeback data.', isSystem: false },
    ],
  },
  {
    id: 'u006', name: 'Kinetics', email: 'info@kinetics.lv',
    type: 'brand', status: 'active', riskLevel: 'low',
    joinedAt: 'Jan 15, 2026', lastActiveAt: '1h ago',
    kycVerified: true, campaigns: 8, disputes: 1, totalGMV: 41200,
    flagCount: 1, gradeHold: false, profileHidden: false, sessionKilled: false,
    linkedTicket: null, note: 'Conduct flag (harsh message to Amelia Roze) resolved with written warning. Strong GMV. Flagship client.',
    auditLog: [
      { id: 'a15', action: 'warning_issued', from: null,        to: null,         by: 'Harshul G.',  at: 'Jun 12, 2026 · 09:00', reason: 'Team member sent threatening message to creator Amelia Roze (TKT-2026-0035). Written warning issued to account contact.', isSystem: false },
    ],
  },
  {
    id: 'u007', name: 'Amelia Roze', email: 'amelia@ameliaroze.com',
    type: 'creator', status: 'active', riskLevel: 'low',
    joinedAt: 'Feb 3, 2026', lastActiveAt: '3h ago',
    kycVerified: true, campaigns: 5, disputes: 1, totalGMV: 0,
    flagCount: 0, gradeHold: false, profileHidden: false, sessionKilled: false,
    linkedTicket: null, note: 'Dispute filed against brand (conduct, resolved). No violations. Top creator on platform.',
    auditLog: [],
  },
  {
    id: 'u008', name: 'Baltic Creators Agency', email: 'hello@balticcreatorsagency.lv',
    type: 'agency', status: 'active', riskLevel: 'low',
    joinedAt: 'Jan 10, 2026', lastActiveAt: '2h ago',
    kycVerified: true, campaigns: 14, disputes: 3, totalGMV: 18450,
    flagCount: 0, gradeHold: false, profileHidden: false, sessionKilled: false,
    linkedTicket: null, note: 'Platform\'s flagship agency. All 3 disputes filed by them (legitimate). No violations.',
    auditLog: [],
  },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function CheckIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 14 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function SearchIcon({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ShieldIcon({ s = 16 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function AlertIcon({ s = 15 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function ClockIcon({ s = 13 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ChevRightIcon({ s = 13 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function DashIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> }
function UsersIcon({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 21v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ActivityIcon({ s = 16 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 16 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function FileIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function MegaphoneIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 11v2a8 8 0 008 8v0M3 11a8 8 0 018-8v0M3 11h18M21 11v2M11 19l-2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 7c0 0-3 2-8 2S5 7 5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function TagIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg> }
function ZapIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LogoutIcon({ s = 15 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LockIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg> }
function UnlockIcon({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M7 11V7a5 5 0 019.9-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill="currentColor"/></svg> }
function BanIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function EyeIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function NoteIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function SendIcon({ s = 13 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function GradeIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   CONTROL SPECTRUM STEPPER
   Visual severity ladder — shows available transitions from current
   status with persona-specific consequence previews
   ════════════════════════════════════════════════════════════════════ */
function ControlSpectrum({ current, target, onSelect }: {
  current: UserStatus
  target:  UserStatus
  onSelect: (s: UserStatus) => void
}) {
  const ALL: UserStatus[] = ['active', 'under_review', 'restricted', 'suspended', 'banned']
  return (
    <div className="space-y-2">
      {ALL.map(status => {
        const cfg = STATUS_CFG[status]
        const isCurrent = status === current
        const isSelected = status === target
        const isEscalation = cfg.severity > STATUS_CFG[current].severity
        return (
          <button key={status} type="button" onClick={() => onSelect(status)}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition ${
              isSelected
                ? status === 'banned' ? 'border-rose-500 bg-rose-50'
                : status === 'suspended' ? 'border-orange-400 bg-orange-50'
                : status === 'restricted' ? 'border-amber-400 bg-amber-50'
                : status === 'under_review' ? 'border-blue-400 bg-blue-50'
                : `${GRAD_BTN.replace('bg-gradient', 'border-gradient')} border-primary/40 bg-primary/[0.04]`
              : 'border-primary/10 bg-white hover:border-primary/25'
            } ${isCurrent ? 'ring-2 ring-inset ring-primary/20' : ''}`}>
            <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[16px] ${cfg.bg}`}>{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[13.5px] font-extrabold ${isSelected ? cfg.text : 'text-ink'}`}>{cfg.label}</span>
                {isCurrent && <span className="rounded-full bg-primary/[0.09] px-2 py-0.5 text-[10px] font-black text-primary uppercase tracking-[0.1em]">Current</span>}
                {isEscalation && !isCurrent && <span className="text-[10px] font-bold text-rose-500">↑ Escalation</span>}
              </div>
              <p className="text-[11.5px] text-ink/40 mt-0.5">
                {status === 'active'       ? 'Full platform access restored' :
                 status === 'under_review' ? 'Monitoring only — no friction for user' :
                 status === 'restricted'   ? 'Capabilities degraded, account alive' :
                 status === 'suspended'    ? 'Account frozen, session killed' :
                 'Permanent — cannot be undone without exceptional approval'}
              </p>
            </div>
            {isSelected && (
              <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white ${
                status === 'banned' ? 'bg-rose-500' : status === 'suspended' ? 'bg-orange-500' : status === 'restricted' ? 'bg-amber-500' : status === 'under_review' ? 'bg-blue-500' : GRAD_BTN}`}>
                <CheckIcon s={11}/>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   ACTION MODAL
   Compact status-change dialog triggered from row quick-actions
   or from the drawer action buttons
   ════════════════════════════════════════════════════════════════════ */
function ActionModal({ open, user, onClose, onConfirm }: {
  open: boolean
  user: UserAccount | null
  onClose: () => void
  onConfirm: (user: UserAccount, newStatus: UserStatus, reason: string, gradeHold: boolean, killSession: boolean) => void
}) {
  const [target,     setTarget]     = useState<UserStatus>('restricted')
  const [reason,     setReason]     = useState('')
  const [gradeHold,  setGradeHold]  = useState(false)
  const [killSess,   setKillSess]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [confirmed,  setConfirmed]  = useState(false)

  useEffect(() => {
    if (open && user) {
      setTarget(user.status)
      setReason('')
      setGradeHold(user.status === 'restricted' || user.status === 'suspended' || user.status === 'banned')
      setKillSess(user.status === 'suspended' || user.status === 'banned')
      setSaving(false)
      setConfirmed(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [open, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !user) return null

  const isBan   = target === 'banned'
  const isSusp  = target === 'suspended'
  const isSafe  = target === 'active'
  const isValid = reason.trim().length > 0 && (target !== user.status)
  const needDoubleConfirm = isBan || isSusp

  const tc  = TYPE_CFG[user.type]
  const tsc = STATUS_CFG[target as UserStatus]
  const consequences = PERSONA_CONSEQUENCES[user.type][target as UserStatus]

  const handleConfirm = async () => {
    if (!isValid) return
    if (needDoubleConfirm && !confirmed) { setConfirmed(true); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    onConfirm(user, target, reason.trim(), gradeHold, killSess)
    setSaving(false)
    onClose()
  }

  const lbl = 'mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40'

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[620px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(94vh, 860px)' }}>

        {/* Severity stripe */}
        <div className="h-1.5 w-full"
          style={{ background: isBan ? '#dc2626' : isSusp ? '#f97316' : isSafe ? '#10b981' : target === 'restricted' ? '#f59e0b' : '#3b82f6' }}/>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[18px] ${tsc.bg}`}>{tsc.icon}</div>
            <div>
              <h3 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">User control — {user.name}</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${tc.bg} ${tc.text}`}>{tc.label}</span>
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CFG[user.status].bg} ${STATUS_CFG[user.status].text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CFG[user.status].dot}`}/>{STATUS_CFG[user.status].label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Spectrum picker */}
          <div>
            <label className={lbl}>Set account status</label>
            <ControlSpectrum current={user.status} target={target} onSelect={setTarget}/>
          </div>

          {/* Consequences */}
          {target !== user.status && (
            <div className={`rounded-2xl border p-4 ${tsc.bg} ${tsc.border}`}>
              <p className={`text-[11.5px] font-black uppercase tracking-[0.12em] mb-2.5 ${tsc.text}`}>
                What this means for {user.name} ({tc.label})
              </p>
              <ul className="space-y-1.5">
                {consequences.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12.5px] text-ink/70">
                    <span className={`mt-0.5 flex-shrink-0 font-bold ${isBan ? 'text-rose-500' : isSusp ? 'text-orange-500' : isSafe ? 'text-emerald-600' : tsc.text}`}>
                      {isBan || isSusp ? '✕' : isSafe ? '✓' : '·'}
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Grade hold + session kill toggles */}
          {target !== 'active' && target !== 'under_review' && (
            <div className="space-y-2">
              <label className={lbl}>Platform actions</label>
              {[
                { key: 'grade', icon: <GradeIcon s={14}/>, label: 'Grade hold', sub: 'Freeze all pending payouts via Grade escrow', val: gradeHold, set: setGradeHold },
                { key: 'session', icon: <LockIcon s={14}/>, label: 'Kill session', sub: 'Invalidate all active sessions — user is logged out immediately', val: killSess, set: setKillSess },
              ].map(t => (
                <button key={t.key} type="button" onClick={() => t.set(!t.val)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${t.val ? 'border-rose-200 bg-rose-50' : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                  <span className={t.val ? 'text-rose-500' : 'text-ink/40'}>{t.icon}</span>
                  <div className="flex-1">
                    <p className={`text-[13px] font-bold ${t.val ? 'text-rose-700' : 'text-ink'}`}>{t.label}</p>
                    <p className="text-[11.5px] text-ink/45">{t.sub}</p>
                  </div>
                  <div className={`flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${t.val ? 'bg-rose-500' : 'bg-ink/15'}`}>
                    <span className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                      style={{ transform: t.val ? 'translateX(22px)' : 'translateX(2px)' }}/>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Reason — mandatory */}
          <div>
            <label className={lbl}>Documented reason * (immutable audit log entry)</label>
            <textarea className={`${INP} min-h-[90px] resize-y leading-relaxed`} rows={3}
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Write this for a future audit, not just for today. Include what triggered this action, what evidence you reviewed, and what outcome you expect."/>
            <p className="mt-1 text-[11px] text-ink/35">This cannot be edited after submission. It is the permanent record.</p>
          </div>

          {/* Double-confirm for nuclear options */}
          {needDoubleConfirm && confirmed && (
            <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4">
              <div className="flex items-start gap-3">
                <AlertIcon s={18}/>
                <div>
                  <p className="text-[13.5px] font-extrabold text-rose-800">
                    {isBan ? 'This is permanent. There is no undo.' : 'This will immediately log out the user and freeze their account.'}
                  </p>
                  <p className="mt-1 text-[12.5px] text-rose-700">
                    {isBan
                      ? 'A ban permanently deletes the account, blocklists the email and device, and terminates their Grade relationship. Click confirm again to proceed.'
                      : 'The user\'s session will be killed within seconds. Their profile will be hidden. Grade escrow frozen. Click confirm to proceed.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 gap-3 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Cancel</button>
          <button onClick={handleConfirm} disabled={!isValid || saving}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${
              isValid && !saving
                ? isBan   ? 'bg-rose-600 shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)] hover:-translate-y-0.5'
                : isSusp  ? 'bg-orange-500 shadow-[0_8px_24px_-6px_rgba(249,115,22,0.5)] hover:-translate-y-0.5'
                : isSafe  ? 'bg-emerald-500 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.45)] hover:-translate-y-0.5'
                : `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`
                : 'cursor-not-allowed bg-ink/10 text-ink/30'
            }`}>
            {saving
              ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Applying…</>
              : needDoubleConfirm && !confirmed
              ? <><AlertIcon s={14}/>{isBan ? 'Click again to confirm permanent ban' : 'Click again to confirm suspension'}</>
              : <><CheckIcon s={14}/>Apply — {STATUS_CFG[target as UserStatus].label}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   USER DETAIL DRAWER — full control panel for one user
   ════════════════════════════════════════════════════════════════════ */
function UserDrawer({ user, onClose, onAction, onAddNote }: {
  user: UserAccount | null
  onClose: () => void
  onAction: (user: UserAccount) => void
  onAddNote: (id: string, note: string) => void
}) {
  const [tab,  setTab]  = useState<'overview' | 'audit' | 'notes'>('overview')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setTab('overview'); setNote('')
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  const sc  = STATUS_CFG[user.status]
  const tc  = TYPE_CFG[user.type]
  const rc  = RISK_CFG[user.riskLevel]
  const isEditable = user.status !== 'banned'

  const handleNote = async () => {
    if (!note.trim()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    onAddNote(user.id, note.trim())
    setNote(''); setSaving(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[500] bg-ink/30 backdrop-blur-sm" onClick={onClose}/>
      <aside className={`fixed right-0 top-0 z-[600] flex h-full w-full max-w-[440px] flex-col bg-white shadow-[−20px_0_40px_-8px_rgba(10,6,18,0.2)]`}>

        {/* Header */}
        <div className={`flex flex-shrink-0 items-start justify-between border-b border-primary/10 px-5 py-4 ${user.status === 'banned' ? 'bg-rose-50' : user.status === 'suspended' ? 'bg-orange-50' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-white text-[16px] font-black`}
              style={{ background: tc.color }}>
              {user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-ink">{user.name}</p>
              <p className="text-[12px] text-ink/45">{user.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${sc.bg} ${sc.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
                </span>
                <span className={`rounded-lg px-2 py-0.5 text-[10.5px] font-bold ${tc.bg} ${tc.text}`}>{tc.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0 border-b border-primary/8 bg-surface-sub/40 px-4">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'audit'    as const, label: `Audit log (${user.auditLog.length})` },
            { id: 'notes'    as const, label: 'Notes' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-3 text-[13px] font-semibold transition ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-ink/45 hover:text-ink/70'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'overview' && (
            <div className="space-y-4 p-5">
              {/* Risk score */}
              <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${rc.bg}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${rc.dot}`}/>
                  <span className={`text-[13px] font-extrabold ${rc.text}`}>{rc.label}</span>
                </div>
                <div className="flex items-center gap-3 text-[12px] text-ink/45">
                  <span>{user.disputes} dispute{user.disputes !== 1 ? 's' : ''}</span>
                  <span>{user.flagCount} flag{user.flagCount !== 1 ? 's' : ''}</span>
                  <span>{user.kycVerified ? '✓ KYC' : '✗ No KYC'}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Campaigns', value: user.campaigns },
                  { label: 'Disputes',  value: user.disputes  },
                  { label: 'GMV',       value: user.totalGMV > 0 ? `€${user.totalGMV.toLocaleString()}` : '€0' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-primary/10 bg-surface-sub/40 px-3 py-3 text-center">
                    <p className="text-[18px] font-black text-ink">{s.value}</p>
                    <p className="text-[11px] text-ink/40 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Account flags */}
              {[
                { icon: <GradeIcon s={13}/>, label: 'Grade hold active',   active: user.gradeHold,    color: 'text-orange-600 bg-orange-50 border-orange-200' },
                { icon: <EyeIcon s={13}/>,   label: 'Profile hidden',      active: user.profileHidden, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { icon: <LockIcon s={13}/>,  label: 'Session killed',      active: user.sessionKilled, color: 'text-rose-700 bg-rose-50 border-rose-200'   },
              ].filter(f => f.active).map(f => (
                <div key={f.label} className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px] font-bold ${f.color}`}>
                  {f.icon}{f.label}
                </div>
              ))}

              {/* Meta */}
              <div className="rounded-xl border border-primary/10 bg-surface-sub/40 px-4 py-4 space-y-2">
                {[
                  { label: 'Joined',       value: user.joinedAt },
                  { label: 'Last active',  value: user.lastActiveAt },
                  { label: 'KYC',          value: user.kycVerified ? '✓ Verified' : '✗ Not verified' },
                  { label: 'Email',        value: user.email },
                  ...(user.linkedTicket ? [{ label: 'Linked ticket', value: user.linkedTicket }] : []),
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-ink/40 font-semibold">{r.label}</span>
                    <span className={`font-semibold ${r.label === 'KYC' ? (user.kycVerified ? 'text-emerald-600' : 'text-rose-500') : 'text-ink'}`}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Internal note */}
              {user.note && (
                <div className="rounded-xl border border-primary/10 bg-primary/[0.03] px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-ink/35 mb-1.5">Admin note</p>
                  <p className="text-[13px] leading-[1.65] text-ink/65">{user.note}</p>
                </div>
              )}
            </div>
          )}

          {/* ── AUDIT LOG ── */}
          {tab === 'audit' && (
            <div className="p-5 space-y-3">
              {user.auditLog.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <p className="text-[13px] text-ink/35 font-semibold">No audit entries yet</p>
                  <p className="text-[11.5px] text-ink/25 mt-1">Actions taken on this account will appear here.</p>
                </div>
              ) : [...user.auditLog].reverse().map(entry => {
                const ac = AUDIT_CFG[entry.action]
                return (
                  <div key={entry.id} className={`rounded-2xl border border-primary/8 bg-white px-4 py-4 ${CARD}`}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[16px]">{ac.icon}</span>
                      <span className={`text-[12.5px] font-bold ${ac.color}`}>{ac.label}</span>
                      {entry.isSystem && (
                        <span className="rounded-md bg-ink/[0.06] px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] text-ink/40">System</span>
                      )}
                      <span className="ml-auto text-[11px] text-ink/30">{entry.at}</span>
                    </div>
                    {entry.from && entry.to && (
                      <div className="mb-2 flex items-center gap-2 text-[11.5px]">
                        <span className={`rounded-full px-2.5 py-0.5 font-bold ${STATUS_CFG[entry.from].bg} ${STATUS_CFG[entry.from].text}`}>{STATUS_CFG[entry.from].label}</span>
                        <span className="text-ink/30">→</span>
                        <span className={`rounded-full px-2.5 py-0.5 font-bold ${STATUS_CFG[entry.to].bg} ${STATUS_CFG[entry.to].text}`}>{STATUS_CFG[entry.to].label}</span>
                      </div>
                    )}
                    <p className="text-[12.5px] leading-[1.65] text-ink/60">{entry.reason}</p>
                    {!entry.isSystem && <p className="mt-1.5 text-[11px] text-ink/35">By {entry.by}</p>}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── NOTES ── */}
          {tab === 'notes' && (
            <div className="flex flex-col p-5 gap-4">
              <div className="rounded-xl border border-primary/10 bg-surface-sub/40 px-4 py-3">
                <p className="text-[12.5px] leading-[1.65] text-ink/60">{user.note || 'No note yet.'}</p>
              </div>
              <div className="flex gap-2">
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Update the internal note for this account…"
                  className={`${INP} resize-none text-[13px] leading-relaxed`}/>
                <button onClick={handleNote} disabled={!note.trim() || saving}
                  className={`flex-shrink-0 self-end flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white ${note.trim() && !saving ? `${GRAD_BTN} hover:-translate-y-0.5 transition` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                  <SendIcon s={12}/>Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isEditable && (
          <div className="flex-shrink-0 border-t border-primary/10 bg-surface-sub/60 px-5 py-4">
            <p className="mb-2.5 text-[10.5px] font-black uppercase tracking-[0.14em] text-ink/35">Quick actions</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { status: 'active' as UserStatus,       label: 'Restore',      icon: <UnlockIcon s={13}/>, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                { status: 'under_review' as UserStatus, label: 'Flag review',  icon: <EyeIcon s={13}/>,    cls: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { status: 'restricted' as UserStatus,   label: 'Restrict',     icon: <AlertIcon s={13}/>,  cls: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' },
                { status: 'suspended' as UserStatus,    label: 'Suspend',      icon: <LockIcon s={13}/>,   cls: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100' },
              ] as const).map(btn => (
                <button key={btn.status} type="button"
                  onClick={() => { onAction(user) }}
                  disabled={user.status === btn.status}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-[12.5px] font-bold transition ${btn.cls} disabled:opacity-35 disabled:cursor-not-allowed`}>
                  {btn.icon}{btn.label}
                </button>
              ))}
            </div>
            <button onClick={() => onAction(user)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-400 bg-rose-50 py-2.5 text-[12.5px] font-bold text-rose-700 hover:bg-rose-100 transition">
              <BanIcon s={13}/>Permanent ban
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
/* ════════════════════════════════════════════════════════════════════
   USER ROW — main table row
   ════════════════════════════════════════════════════════════════════ */
function UserRow({ user, selected, onSelect, onOpenDrawer, onQuickAction }: {
  user:        UserAccount
  selected:    boolean
  onSelect:    (id: string) => void
  onOpenDrawer:(u: UserAccount) => void
  onQuickAction:(u: UserAccount) => void
}) {
  const sc = STATUS_CFG[user.status]
  const tc = TYPE_CFG[user.type]
  const rc = RISK_CFG[user.riskLevel]

  const rowBg = user.status === 'banned'    ? 'bg-rose-50/40 hover:bg-rose-50/70' :
                user.status === 'suspended' ? 'bg-orange-50/40 hover:bg-orange-50/70' :
                user.riskLevel === 'critical' ? 'bg-rose-50/20 hover:bg-rose-50/40' :
                'hover:bg-primary/[0.015]'

  return (
    <tr className={`group border-b border-primary/5 transition cursor-pointer ${rowBg}`}
      onClick={() => onOpenDrawer(user)}>

      {/* Checkbox */}
      <td className="w-10 pl-5 pr-2 py-3.5" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={() => onSelect(user.id)}
          className={`flex h-[18px] w-[18px] items-center justify-center rounded-md border-2 transition ${selected ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white'}`}>
          {selected && <CheckIcon s={9}/>}
        </button>
      </td>

      {/* User */}
      <td className="py-3.5 pl-1 pr-3" style={{ minWidth: 200 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white"
            style={{ background: tc.color }}>
            {user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-ink truncate">{user.name}</p>
            <p className="text-[11px] text-ink/35 truncate">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-3 py-3.5">
        <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${tc.bg} ${tc.text}`}>{tc.label}</span>
      </td>

      {/* Status */}
      <td className="px-3 py-3.5">
        <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${user.status === 'restricted' || user.status === 'suspended' ? 'animate-pulse' : ''}`}/>
          {sc.label}
        </span>
      </td>

      {/* Risk */}
      <td className="px-3 py-3.5">
        <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${rc.bg} ${rc.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${rc.dot}`}/>{rc.label}
        </span>
      </td>

      {/* Stats */}
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-3 text-[12px] text-ink/45">
          <span>{user.campaigns} camp.</span>
          <span>{user.disputes} disp.</span>
          {user.flagCount > 0 && <span className="font-bold text-amber-600">{user.flagCount} flags</span>}
        </div>
      </td>

      {/* KYC */}
      <td className="px-3 py-3.5">
        <span className={`text-[12px] font-bold ${user.kycVerified ? 'text-emerald-600' : 'text-rose-500'}`}>
          {user.kycVerified ? '✓ KYC' : '✗ No KYC'}
        </span>
      </td>

      {/* Last active */}
      <td className="px-3 py-3.5">
        <span className="text-[12px] text-ink/40">{user.lastActiveAt}</span>
      </td>

      {/* Actions */}
      <td className="py-3.5 pl-3 pr-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          {user.status !== 'banned' && (
            <button onClick={() => onQuickAction(user)}
              className={`flex items-center gap-1.5 rounded-lg ${GRAD_BTN} px-3 py-1.5 text-[11.5px] font-bold text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.4)] transition hover:-translate-y-0.5`}>
              <ShieldIcon s={12}/>Control
            </button>
          )}
          <button onClick={() => onOpenDrawer(user)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/12 bg-white text-ink/40 transition hover:border-primary/25 hover:text-primary">
            <ChevRightIcon s={13}/>
          </button>
        </div>
      </td>
    </tr>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function AdminUserControlPage() {
  const router = useRouter()

  const [users,      setUsers]      = useState<UserAccount[]>(INITIAL_USERS)
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState<UserType | 'all'>('all')
  const [statFilter, setStatFilter] = useState<UserStatus | 'all'>('all')
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all')
  const [drawerUser, setDrawerUser] = useState<UserAccount | null>(null)
  const [modalUser,  setModalUser]  = useState<UserAccount | null>(null)
  const [toast,      setToast]      = useState<{ msg: string; type: 'ok' | 'warn' } | null>(null)

  const showToast = useCallback((msg: string, type: 'ok' | 'warn' = 'ok') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3200)
  }, [])

  /* Derived */
  const restricted = users.filter(u => u.status === 'restricted').length
  const suspended  = users.filter(u => u.status === 'suspended').length
  const banned     = users.filter(u => u.status === 'banned').length
  const critical   = users.filter(u => u.riskLevel === 'critical').length

  /* Filtered */
  const visible = users.filter(u => {
    if (typeFilter !== 'all' && u.type !== typeFilter)     return false
    if (statFilter !== 'all' && u.status !== statFilter)   return false
    if (riskFilter !== 'all' && u.riskLevel !== riskFilter)return false
    if (search) {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => {
    /* Critical risk first, then by status severity desc */
    const rs: Record<RiskLevel, number>   = { critical: 4, high: 3, medium: 2, low: 1 }
    const ss: Record<UserStatus, number>  = { banned: 4, suspended: 3, restricted: 2, under_review: 1, active: 0 }
    if (a.riskLevel === 'critical' && b.riskLevel !== 'critical') return -1
    if (b.riskLevel === 'critical' && a.riskLevel !== 'critical') return 1
    return ss[b.status as UserStatus] - ss[a.status as UserStatus] || rs[b.riskLevel as RiskLevel] - rs[a.riskLevel as RiskLevel]
  })

  /* Actions */
  const applyControl = (user: UserAccount, newStatus: UserStatus, reason: string, gradeHold: boolean, killSession: boolean) => {
    const entry: AuditEntry = {
      id: `a${Date.now()}`, action: 'status_changed',
      from: user.status, to: newStatus,
      by: 'Harshul G.', at: 'Just now', reason, isSystem: false,
    }
    setUsers(prev => prev.map(u => u.id !== user.id ? u : {
      ...u, status: newStatus,
      gradeHold:    gradeHold,
      profileHidden: newStatus === 'suspended' || newStatus === 'banned',
      sessionKilled: killSession,
      auditLog: [...u.auditLog, entry],
    }))
    setDrawerUser(prev => prev?.id === user.id ? { ...prev, status: newStatus, gradeHold, auditLog: [...prev.auditLog, entry] } : prev)
    const msgs: Record<UserStatus, string> = {
      active:       `${user.name} restored to active`,
      under_review: `${user.name} placed under review`,
      restricted:   `${user.name} restricted — capabilities degraded`,
      suspended:    `${user.name} suspended — account frozen`,
      banned:       `${user.name} permanently banned`,
    }
    showToast(msgs[newStatus], newStatus === 'active' ? 'ok' : 'warn')
    setModalUser(null)
  }

  const addNote = (id: string, note: string) => {
    setUsers(prev => prev.map(u => u.id !== id ? u : { ...u, note }))
    setDrawerUser(prev => prev?.id === id ? { ...prev, note } : prev)
    showToast('Note updated')
  }

  /* Bulk */
  const selectedNonBanned = users.filter(u => selected.has(u.id) && u.status !== 'banned')

  const bulkApply = (status: UserStatus) => {
    const reason = window.prompt(`Reason for bulk ${STATUS_CFG[status].label.toLowerCase()} (${selectedNonBanned.length} users):`)
    if (!reason?.trim()) return
    setUsers(prev => prev.map(u => !selected.has(u.id) || u.status === 'banned' ? u : {
      ...u, status,
      gradeHold: status !== 'active' && status !== 'under_review',
      profileHidden: status === 'suspended' || status === 'banned',
      sessionKilled: status === 'suspended' || status === 'banned',
      auditLog: [...u.auditLog, { id: `a${Date.now()}${u.id}`, action: 'status_changed' as AuditAction, from: u.status, to: status, by: 'Harshul G.', at: 'Just now', reason: `[Bulk] ${reason}`, isSystem: false }],
    }))
    setSelected(new Set())
    showToast(`${selectedNonBanned.length} users set to ${STATUS_CFG[status].label}`, status === 'active' ? 'ok' : 'warn')
  }

  const toggleSelect = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const allSel = visible.length > 0 && visible.every(u => selected.has(u.id))
  const toggleAll = () => {
    if (allSel) setSelected(new Set())
    else setSelected(new Set(visible.map(u => u.id)))
  }

  return (
    <div className="flex min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ TOAST ════ */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[900] -translate-x-1/2">
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-white shadow-lg ${toast.type === 'ok' ? `${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]` : 'bg-amber-500 shadow-[0_12px_32px_-8px_rgba(245,158,11,0.5)]'}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
              {toast.type === 'ok' ? <CheckIcon s={13}/> : <AlertIcon s={13}/>}
            </span>
            <p className="text-[13.5px] font-bold">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* ════ MODALS ════ */}
      <ActionModal open={modalUser !== null} user={modalUser} onClose={() => setModalUser(null)} onConfirm={applyControl}/>
      <UserDrawer user={drawerUser} onClose={() => setDrawerUser(null)}
        onAction={u => { setModalUser(u) }}
        onAddNote={addNote}/>

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
            { icon: <DashIcon s={15}/>,      label: 'Dashboard',     href: '/admin/dashboard',     badge: 0       },
            { icon: <UsersIcon s={15}/>,     label: 'User Control',  href: '/admin/user-control',  badge: restricted + suspended, active: true },
            { icon: <ActivityIcon s={15}/>,  label: 'Campaigns',     href: '/admin/campaigns',     badge: 0       },
            { icon: <EuroIcon s={15}/>,      label: 'Transactions',  href: '/admin/transactions',  badge: 0       },
            { icon: <TicketIcon s={15}/>,    label: 'Disputes',      href: '/admin/disputes',      badge: 0       },
            { icon: <FileIcon s={15}/>,      label: 'Resources',     href: '/admin/resources',     badge: 0       },
            { icon: <MegaphoneIcon s={15}/>, label: 'Announcements', href: '/admin/announcements', badge: 0       },
            { icon: <TagIcon s={15}/>,       label: 'Coupons',       href: '/admin/coupons',       badge: 0       },
            { icon: <ZapIcon s={15}/>,       label: 'System',        href: '/admin/system',        badge: 0       },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${(item as any).active ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]` : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'}`}>
              {item.icon}{item.label}
              {item.badge > 0 && (
                <span className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white ${(item as any).active ? 'bg-white/25' : 'bg-rose-500'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/[0.07] px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${GRAD_BTN}`}>H</div>
            <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-bold text-white">Harshul G.</p><p className="text-[11px] text-white/35">Founder</p></div>
            <button onClick={() => router.push('/admin/login')} className="text-white/30 transition hover:text-white/60"><LogoutIcon s={15}/></button>
          </div>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ════ TOPBAR ════ */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-primary/10 bg-white/95 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h1 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">User Control</h1>
            {(restricted + suspended) > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11.5px] font-bold text-rose-700">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"/>
                {restricted + suspended} action needed
              </span>
            )}
          </div>
          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={14}/></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user…"
                className="w-[200px] rounded-xl border border-primary/12 bg-surface-sub py-2 pl-9 pr-3.5 text-[13px] outline-none placeholder:text-ink/28 focus:border-primary/30 focus:w-[240px] transition-all"/>
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
              className="rounded-xl border border-primary/12 bg-white px-3 py-2 text-[13px] font-semibold text-ink/65 outline-none">
              <option value="all">All types</option>
              <option value="brand">Brands</option>
              <option value="creator">Creators</option>
              <option value="agency">Agencies</option>
            </select>
            <select value={statFilter} onChange={e => setStatFilter(e.target.value as any)}
              className="rounded-xl border border-primary/12 bg-white px-3 py-2 text-[13px] font-semibold text-ink/65 outline-none">
              <option value="all">All statuses</option>
              {(Object.keys(STATUS_CFG) as UserStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as any)}
              className="rounded-xl border border-primary/12 bg-white px-3 py-2 text-[13px] font-semibold text-ink/65 outline-none">
              <option value="all">All risk levels</option>
              {(Object.keys(RISK_CFG) as RiskLevel[]).map(r => <option key={r} value={r}>{RISK_CFG[r].label}</option>)}
            </select>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-6 py-6">

          {/* ── Critical risk alert ── */}
          {critical > 0 && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5">
              <AlertIcon s={17}/>
              <p className="flex-1 text-[13px] font-bold text-rose-700">
                {critical} user{critical !== 1 ? 's' : ''} at critical risk — review and take action before they contaminate the marketplace.
              </p>
              <button onClick={() => setRiskFilter('critical')} className="text-[12.5px] font-bold text-rose-600 underline underline-offset-2">Filter</button>
            </div>
          )}

          {/* ── KPI strip ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Restricted',   value: String(restricted),            accent: restricted > 0, warn: true,  sub: 'Capabilities degraded'  },
              { label: 'Suspended',    value: String(suspended),             accent: suspended > 0,  warn: true,  sub: 'Session killed'          },
              { label: 'Banned',       value: String(banned),                accent: false,          warn: false, sub: 'Permanent bans'          },
              { label: 'Critical risk',value: String(critical),              accent: false,          warn: critical > 0, sub: 'Need immediate review' },
            ].map(s => (
              <div key={s.label} className={`flex flex-col gap-2 rounded-2xl border p-5 ${
                s.accent ? 'bg-rose-50 border-rose-200' :
                s.warn && parseInt(s.value) > 0 ? 'bg-amber-50 border-amber-200' :
                `border-primary/10 bg-white ${CARD}`
              }`}>
                <div className={`text-[26px] font-black tracking-[-0.03em] ${s.accent || (s.warn && parseInt(s.value) > 0) ? 'text-rose-700' : 'text-ink'}`}>{s.value}</div>
                <div className={`text-[12.5px] font-semibold ${s.accent || (s.warn && parseInt(s.value) > 0) ? 'text-rose-600' : 'text-ink/50'}`}>{s.label}</div>
                <div className={`text-[11px] ${s.accent || (s.warn && parseInt(s.value) > 0) ? 'text-rose-500/70' : 'text-ink/35'}`}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Bulk actions ── */}
          {selected.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/15 bg-white px-5 py-3">
              <span className="text-[13px] font-bold text-ink/60">{selected.size} selected</span>
              <div className="h-4 w-px bg-primary/15"/>
              {([
                { status: 'active' as UserStatus,      label: 'Restore all',    cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                { status: 'under_review' as UserStatus,label: 'Flag review',    cls: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'         },
                { status: 'restricted' as UserStatus,  label: 'Restrict all',   cls: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'        },
                { status: 'suspended' as UserStatus,   label: 'Suspend all',    cls: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'    },
                { status: 'banned' as UserStatus,      label: 'Ban all',        cls: 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'           },
              ] as const).map(b => (
                <button key={b.status} onClick={() => bulkApply(b.status)}
                  className={`flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2 text-[12.5px] font-bold transition ${b.cls}`}>
                  {b.label}
                </button>
              ))}
              <button onClick={() => setSelected(new Set())} className="ml-auto text-[12px] font-bold text-ink/40 hover:text-ink/60">Clear</button>
            </div>
          )}

          {/* ── Users table ── */}
          <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-primary/8 bg-surface-sub/60">
                    <th className="w-10 pl-5 pr-2 py-3">
                      <button type="button" onClick={toggleAll}
                        className={`flex h-[18px] w-[18px] items-center justify-center rounded-md border-2 transition ${allSel ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/20 bg-white'}`}>
                        {allSel && <CheckIcon s={9}/>}
                      </button>
                    </th>
                    {['User', 'Type', 'Status', 'Risk', 'Activity', 'KYC', 'Last active', 'Actions'].map((h, i) => (
                      <th key={h} className={`py-3 text-left text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35 ${i === 0 ? 'pl-1 pr-3' : i === 7 ? 'pl-3 pr-5' : 'px-3'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={9} className="py-14 text-center text-[13.5px] text-ink/35">No users match the filter.</td></tr>
                  ) : visible.map(u => (
                    <UserRow key={u.id} user={u} selected={selected.has(u.id)}
                      onSelect={toggleSelect}
                      onOpenDrawer={setDrawerUser}
                      onQuickAction={setModalUser}/>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-primary/8 bg-surface-sub/40 px-5 py-3">
              <p className="text-[12px] text-ink/40">{visible.length} of {users.length} users · click row to open control panel</p>
              <p className="text-[12px] text-ink/35">{users.filter(u => u.status === 'active').length} active · {users.filter(u => !u.kycVerified).length} KYC pending</p>
            </div>
          </div>

          {/* ── Trust & Safety explainer ── */}
          <div className={`mt-6 rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${GRAD_BTN}`}><ShieldIcon s={17}/></div>
              <div>
                <h3 className="text-[14px] font-extrabold text-ink">Graduated enforcement — why it matters</h3>
                <p className="text-[12px] text-ink/40">Every level has a documented, defensible purpose</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
              {(Object.entries(STATUS_CFG) as [UserStatus, typeof STATUS_CFG[UserStatus]][]).map(([status, cfg]) => (
                <div key={status} className={`rounded-xl border p-3.5 ${cfg.bg} ${cfg.border}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[16px]">{cfg.icon}</span>
                    <span className={`text-[12px] font-extrabold ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <p className="text-[11px] leading-[1.5] text-ink/55">
                    {status === 'active'       ? 'Full access. Normal user.'            :
                     status === 'under_review' ? 'Monitoring only. No friction.'        :
                     status === 'restricted'   ? 'Capabilities degraded. Account alive.':
                     status === 'suspended'    ? 'Fully frozen. Session killed.'         :
                     'Permanent. Email + device blocked.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}