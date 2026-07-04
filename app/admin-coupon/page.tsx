'use client'

import React, {
  useState, useEffect, useRef, useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Admin Coupon Engine — app/admin/coupons/page.tsx
   Nexfluence v4, LIGHT · dark sidebar variant

   THE DUAL-EXPIRY MECHANIC (the thing that makes this strategically
   different from a naive "discount code" table):
   ─────────────────────────────────────────────────────────────────
   Every coupon has two independent expiry conditions that race
   against each other:

     expires_days  — the coupon dies N days after creation, regardless
                     of how many times it was used
     expires_uses  — the coupon dies after N total redemptions,
                     regardless of how much time has passed

   Whichever condition fires FIRST wins. The coupon is marked expired
   immediately — not at midnight, not on next cron job, but the moment
   either threshold is crossed.

   WHY BOTH MATTER:
   · Date-only: you hand out "LAUNCH20" publicly. It never expires.
     Six months later someone posts it on a deal site and you're
     running at 8% fee forever. Date TTL stops this.
   · Use-count-only: "AGENCY001" is for one specific agency partner.
     They never use it. Code sits live forever, anyone who finds it
     can use it. Use-count stops this too, but you still want it to
     expire after the outreach window. You need BOTH.

   COUPON TYPES — four real business levers:
     percentage_fee  Reduces Nexfluence's 12% platform fee
                     → Brand/agency acquisition (lower barrier to entry)
     flat_credit     Credits €N to the user's Grade wallet
                     → Activation (get them to run their first campaign)
     free_campaign   Waives the platform fee on exactly one campaign
                     → Enterprise deal closing
     bonus_payout    Adds X% on top of a creator's next payout
                     → Creator roster acquisition and retention

   ATTRIBUTION TAGS:
   Every coupon carries a source tag ("Vestbee demo", "Email blast
   Jun 2026", "Harshul LinkedIn outreach"). This is the feature
   most founders skip. Without it, you never know which growth
   channel actually converts to paying users. With it, you have
   a growth attribution table by the time you do your Series A.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

/* ─── Types ──────────────────────────────────────────────────────── */
type CouponType      = 'percentage_fee' | 'flat_credit' | 'free_campaign' | 'bonus_payout'
type CouponTarget    = 'all' | 'brands' | 'creators' | 'agencies'
type CouponScope     = 'any' | 'first_campaign' | 'recurring' | 'above_threshold'
type CouponStatus    = 'active' | 'expired_date' | 'expired_uses' | 'paused' | 'draft'
type ExpiryTrigger   = 'date' | 'uses' | 'none'

interface Redemption {
  userId:    string
  userName:  string
  userType:  CouponTarget
  redeemedAt: string
  campaignName: string | null
  valueUnlocked: number  /* in EUR */
}

interface Coupon {
  id:            string
  code:          string
  description:   string
  type:          CouponType
  value:         number          /* pct or EUR amount */
  target:        CouponTarget[]
  scope:         CouponScope
  scopeThreshold?: number        /* for above_threshold: minimum campaign value */
  /* DUAL EXPIRY */
  createdAt:     string          /* ISO date string for date math */
  expiresAfterDays: number       /* date TTL */
  maxUses:       number          /* use-count TTL */
  currentUses:   number
  status:        CouponStatus
  expiryTrigger: ExpiryTrigger   /* which condition fired */
  /* Attribution */
  source:        string          /* e.g. "Vestbee", "Launch event" */
  note:          string
  redemptions:   Redemption[]
  totalValueUnlocked: number     /* EUR equivalent of all discounts given */
}

/* ─── Coupon type config ─────────────────────────────────────────── */
const TYPE_CFG: Record<CouponType, {
  label: string; icon: string; unit: string; unitSuffix: string
  color: string; bg: string; border: string; desc: string
  usedFor: string
}> = {
  percentage_fee: {
    label: 'Reduced platform fee', icon: '%', unit: '%', unitSuffix: '% off fee',
    color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200',
    desc: 'Reduces the 12% platform fee for the holder',
    usedFor: 'Brand/agency acquisition',
  },
  flat_credit: {
    label: 'Wallet credit', icon: '€', unit: '€', unitSuffix: '€ credit',
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
    desc: 'Credits EUR directly to the user\'s Grade wallet',
    usedFor: 'First campaign activation',
  },
  free_campaign: {
    label: 'Free campaign', icon: '🎁', unit: '', unitSuffix: 'one free campaign',
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
    desc: 'Waives the platform fee entirely on one campaign',
    usedFor: 'Enterprise deal closing',
  },
  bonus_payout: {
    label: 'Bonus payout', icon: '+', unit: '%', unitSuffix: '% bonus on payout',
    color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200',
    desc: 'Adds a percentage bonus on top of the creator\'s next payout',
    usedFor: 'Creator roster acquisition',
  },
}

const STATUS_CFG: Record<CouponStatus, { label: string; dot: string; bg: string; text: string }> = {
  active:       { label: 'Active',          dot: 'bg-emerald-400', bg: 'bg-emerald-50',     text: 'text-emerald-700' },
  expired_date: { label: 'Expired (date)',  dot: 'bg-ink/20',      bg: 'bg-surface-sub',    text: 'text-ink/45'      },
  expired_uses: { label: 'Expired (uses)',  dot: 'bg-ink/20',      bg: 'bg-surface-sub',    text: 'text-ink/45'      },
  paused:       { label: 'Paused',          dot: 'bg-amber-400',   bg: 'bg-amber-50',       text: 'text-amber-700'   },
  draft:        { label: 'Draft',           dot: 'bg-primary/50',  bg: 'bg-primary/[0.07]', text: 'text-primary'     },
}

const SCOPE_LABELS: Record<CouponScope, string> = {
  any:              'Any campaign',
  first_campaign:   'First campaign only',
  recurring:        'Recurring (all campaigns)',
  above_threshold:  'Campaigns above value threshold',
}

const TARGET_LABELS: Record<CouponTarget, string> = {
  all: 'All users', brands: 'Brands', creators: 'Creators', agencies: 'Agencies',
}

/* ─── Mock coupon data ───────────────────────────────────────────── */
const TODAY_STR = '2026-07-02'

function daysLeft(createdAt: string, expiresAfterDays: number): number {
  const created = new Date(createdAt).getTime()
  const expires = created + expiresAfterDays * 86400000
  const now     = new Date(TODAY_STR).getTime()
  return Math.max(0, Math.ceil((expires - now) / 86400000))
}

function computeStatus(c: Omit<Coupon, 'status' | 'expiryTrigger'>): CouponStatus {
  if (c.currentUses >= c.maxUses) return 'expired_uses'
  if (daysLeft(c.createdAt, c.expiresAfterDays) === 0) return 'expired_date'
  return 'active'
}

const RAW_COUPONS: Omit<Coupon, 'status' | 'expiryTrigger'>[] = [
  {
    id: 'cp001', code: 'LAUNCH20', description: 'Platform launch promotion — 20% fee reduction for early brands',
    type: 'percentage_fee', value: 20, target: ['brands'], scope: 'first_campaign',
    createdAt: '2026-06-01', expiresAfterDays: 60, maxUses: 50, currentUses: 31,
    source: 'Launch event June 2026', note: 'Shared at Kinetics demo + Vestbee pitch',
    redemptions: [
      { userId: 'u1', userName: 'Kinetics',       userType: 'brands', redeemedAt: 'Jun 15', campaignName: 'Electrolyte Hot Yoga', valueUnlocked: 520 },
      { userId: 'u2', userName: 'Lumora Skincare', userType: 'brands', redeemedAt: 'Jun 18', campaignName: 'Morning Ritual', valueUnlocked: 360 },
      { userId: 'u3', userName: 'SportElite OÜ',  userType: 'brands', redeemedAt: 'Jun 28', campaignName: null, valueUnlocked: 0 },
    ],
    totalValueUnlocked: 4180,
  },
  {
    id: 'cp002', code: 'AGENCY100', description: '€100 wallet credit for new agencies joining the platform',
    type: 'flat_credit', value: 100, target: ['agencies'], scope: 'any',
    createdAt: '2026-06-15', expiresAfterDays: 30, maxUses: 10, currentUses: 3,
    source: 'Agency outreach — Harshul LinkedIn',  note: 'Sent to 8 Baltic agency contacts. 3 converted.',
    redemptions: [
      { userId: 'u4', userName: 'Baltic Creators Agency', userType: 'agencies', redeemedAt: 'Jun 20', campaignName: null, valueUnlocked: 100 },
      { userId: 'u5', userName: 'NordGlow Agency',        userType: 'agencies', redeemedAt: 'Jun 24', campaignName: null, valueUnlocked: 100 },
      { userId: 'u6', userName: 'Riga Media House',       userType: 'agencies', redeemedAt: 'Jun 29', campaignName: null, valueUnlocked: 100 },
    ],
    totalValueUnlocked: 300,
  },
  {
    id: 'cp003', code: 'CREATOR10', description: '10% bonus on next payout — creator roster acquisition drive',
    type: 'bonus_payout', value: 10, target: ['creators'], scope: 'first_campaign',
    createdAt: '2026-07-01', expiresAfterDays: 10, maxUses: 100, currentUses: 7,
    source: 'May 28 creator event (100+ attendees)',  note: 'Handed out at Nexfluence creator event. Tracking conversion vs event attendance.',
    redemptions: [
      { userId: 'u7', userName: 'Amelia Roze',     userType: 'creators', redeemedAt: 'Jul 1', campaignName: 'Electrolyte Hot Yoga', valueUnlocked: 42 },
      { userId: 'u8', userName: 'Sandra Liepa',    userType: 'creators', redeemedAt: 'Jul 1', campaignName: 'Vitamin C Serum',      valueUnlocked: 35 },
      { userId: 'u9', userName: 'Jonas P.',         userType: 'creators', redeemedAt: 'Jul 2', campaignName: null, valueUnlocked: 0   },
    ],
    totalValueUnlocked: 287,
  },
  {
    id: 'cp004', code: 'FREECAMPAIGN', description: 'One free campaign — enterprise prospect closer',
    type: 'free_campaign', value: 0, target: ['brands'], scope: 'first_campaign',
    createdAt: '2026-06-20', expiresAfterDays: 14, maxUses: 1, currentUses: 0,
    source: 'Enterprise deal — Forma Fit pilot',  note: 'Created for Forma Fit negotiation. Single-use only.',
    redemptions: [],
    totalValueUnlocked: 0,
  },
  {
    id: 'cp005', code: 'VESTBEE15', description: 'Vestbee Startup of the Month promo — 15% fee off first 3 months',
    type: 'percentage_fee', value: 15, target: ['brands', 'agencies'], scope: 'recurring',
    createdAt: '2026-05-10', expiresAfterDays: 30, maxUses: 200, currentUses: 200,
    source: 'Vestbee Startup of the Month recognition', note: 'Hit 200 uses in 28 days. Faster than expected.',
    redemptions: [],
    totalValueUnlocked: 18400,
  },
  {
    id: 'cp006', code: 'EARLYAGENCY', description: 'Early agency partner — reduced fee for 90 days',
    type: 'percentage_fee', value: 25, target: ['agencies'], scope: 'recurring',
    createdAt: '2026-01-15', expiresAfterDays: 90, maxUses: 5, currentUses: 2,
    source: 'Seed round — agency pilot programme', note: 'Manually issued to first two agency partners.',
    redemptions: [
      { userId: 'u4', userName: 'Baltic Creators Agency', userType: 'agencies', redeemedAt: 'Jan 15', campaignName: null, valueUnlocked: 2760 },
    ],
    totalValueUnlocked: 2760,
  },
]

const INITIAL_COUPONS: Coupon[] = RAW_COUPONS.map(c => ({
  ...c,
  status: computeStatus(c),
  expiryTrigger: c.currentUses >= c.maxUses ? 'uses'
    : daysLeft(c.createdAt, c.expiresAfterDays) === 0 ? 'date'
    : 'none',
}))

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
const I = (path: string, opts?: { fill?: boolean; s?: number }) => {
  const s = opts?.s ?? 16
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={opts?.fill ? 'currentColor' : 'none'}><path d={path} stroke={opts?.fill ? undefined : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function CheckIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 14 }: { s?: number })          { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function PlusIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function CopyIcon({ s = 13 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function PauseIcon({ s = 13 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="4" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg> }
function PlayIcon({ s = 13 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 3l14 9-14 9V3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TrashIcon({ s = 13 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TagIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg> }
function CalendarIcon({ s = 13 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg> }
function SearchIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ShuffleIcon({ s = 14 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function DashIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> }
function UsersIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 21v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ActivityIcon({ s = 16 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 16 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function FileIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function MegaphoneIcon({ s = 16 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 11v2a8 8 0 008 8v0M3 11a8 8 0 018-8v0M3 11h18M21 11v2M11 19l-2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 7c0 0-3 2-8 2S5 7 5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ZapIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LogoutIcon({ s = 15 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TrendIcon({ s = 11 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function AlertIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   DUAL EXPIRY RACE BARS
   The visual representation of the two conditions racing each other.
   Whichever bar fills first = what killed (or will kill) the coupon.
   ════════════════════════════════════════════════════════════════════ */
function DualExpiryBars({ coupon }: { coupon: Coupon }) {
  const usesPct  = Math.min(100, Math.round((coupon.currentUses / coupon.maxUses) * 100))
  const totalDays = coupon.expiresAfterDays
  const usedDays  = totalDays - daysLeft(coupon.createdAt, coupon.expiresAfterDays)
  const datePct   = Math.min(100, Math.round((usedDays / totalDays) * 100))
  const dLeft     = daysLeft(coupon.createdAt, coupon.expiresAfterDays)

  const dateWon = coupon.expiryTrigger === 'date'
  const usesWon = coupon.expiryTrigger === 'uses'

  return (
    <div className="space-y-2.5">
      {/* Uses bar */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold ${usesWon ? 'text-rose-600' : 'text-ink/45'}`}>
            {usesWon && <span className="text-[9px] font-black bg-rose-500 text-white rounded px-1 py-0.5">TRIGGERED</span>}
            Uses: {coupon.currentUses}/{coupon.maxUses}
          </span>
          <span className="text-[11px] font-semibold text-ink/35">{usesPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]">
          <div className={`h-full rounded-full transition-all duration-500 ${usesWon ? 'bg-rose-500' : usesPct > 80 ? 'bg-amber-400' : GRAD_BTN}`}
            style={{ width: `${usesPct}%` }}/>
        </div>
      </div>
      {/* Date bar */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className={`flex items-center gap-1.5 text-[11px] font-bold ${dateWon ? 'text-rose-600' : 'text-ink/45'}`}>
            {dateWon && <span className="text-[9px] font-black bg-rose-500 text-white rounded px-1 py-0.5">TRIGGERED</span>}
            Time: {usedDays}/{totalDays} days
          </span>
          <span className={`text-[11px] font-semibold ${dLeft <= 2 && !dateWon ? 'text-amber-600 font-bold' : 'text-ink/35'}`}>
            {coupon.status === 'active' ? `${dLeft}d left` : 'expired'}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]">
          <div className={`h-full rounded-full transition-all duration-500 ${dateWon ? 'bg-rose-500' : datePct > 80 ? 'bg-amber-400' : 'bg-blue-400'}`}
            style={{ width: `${datePct}%` }}/>
        </div>
      </div>
      {/* Race result */}
      {coupon.status !== 'active' && coupon.expiryTrigger !== 'none' && (
        <p className="text-[11px] font-bold text-rose-500">
          Expired by {coupon.expiryTrigger === 'uses' ? 'use limit' : 'time limit'} first
        </p>
      )}
      {coupon.status === 'active' && (
        <p className="text-[10.5px] text-ink/35">
          Expires when <span className="font-bold text-ink/50">uses hit {coupon.maxUses}</span> OR <span className="font-bold text-ink/50">{dLeft} days pass</span> — whichever first
        </p>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   CODE GENERATOR — random 6-8 char alphanumeric
   ════════════════════════════════════════════════════════════════════ */
function generateCode(prefix = ''): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const len   = prefix ? 6 : 8
  const rand  = Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return prefix ? `${prefix.toUpperCase()}_${rand}` : rand
}

/* ════════════════════════════════════════════════════════════════════
   CREATE / EDIT MODAL
   ════════════════════════════════════════════════════════════════════ */
interface CouponFormData {
  code: string; description: string; note: string; source: string
  type: CouponType; value: number
  target: CouponTarget[]; scope: CouponScope; scopeThreshold: number
  expiresAfterDays: number; maxUses: number
}

const BLANK_FORM: CouponFormData = {
  code: '', description: '', note: '', source: '',
  type: 'percentage_fee', value: 10,
  target: ['brands'], scope: 'first_campaign', scopeThreshold: 500,
  expiresAfterDays: 10, maxUses: 50,
}

function CreateModal({ open, initial, onClose, onSave }: {
  open: boolean
  initial: Coupon | null
  onClose: () => void
  onSave: (form: CouponFormData) => void
}) {
  const [form, setForm]       = useState<CouponFormData>(BLANK_FORM)
  const [saving, setSaving]   = useState(false)
  const [copied, setCopied]   = useState(false)
  const isEdit = initial !== null

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        code: initial.code, description: initial.description, note: initial.note,
        source: initial.source, type: initial.type, value: initial.value,
        target: initial.target, scope: initial.scope,
        scopeThreshold: initial.scopeThreshold ?? 500,
        expiresAfterDays: initial.expiresAfterDays, maxUses: initial.maxUses,
      } : { ...BLANK_FORM, code: generateCode() })
      setSaving(false); setCopied(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!open) return null

  const set = <K extends keyof CouponFormData>(k: K, v: CouponFormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const toggleTarget = (t: CouponTarget) => {
    setForm(prev => {
      const curr = prev.target
      if (t === 'all') return { ...prev, target: ['all'] }
      const next = curr.filter(x => x !== 'all')
      const upd  = next.includes(t) ? next.filter(x => x !== t) : [...next, t]
      return { ...prev, target: upd.length === 0 ? ['all'] : upd }
    })
  }

  const isValid = form.code.trim().length >= 3 && form.description.trim().length > 0 && form.target.length > 0

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    onSave(form)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(form.code).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const tc  = TYPE_CFG[form.type as CouponType]
  const lbl = 'mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40'

  /* Projected reach */
  const eligible = form.target.includes('all') ? 1847
    : form.target.reduce((s, t) => s + ({ brands: 384, creators: 1348, agencies: 115 }[t as Exclude<CouponTarget,'all'>] ?? 0), 0)

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[640px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(94vh, 820px)' }}>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${GRAD_BTN}`}><TagIcon s={17}/></div>
            <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">
              {isEdit ? 'Edit coupon' : 'Create coupon'}
            </h2>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Code field */}
          <div>
            <label className={lbl}>Coupon code *</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input className={`${INP} font-mono font-bold tracking-widest uppercase pr-10`}
                  value={form.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder="LAUNCH20" maxLength={24}/>
                <button type="button" onClick={copyCode}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 transition hover:text-primary">
                  {copied ? <CheckIcon s={14}/> : <CopyIcon s={14}/>}
                </button>
              </div>
              <button type="button" onClick={() => set('code', generateCode())}
                className={`flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-3.5 py-2.5 text-[12.5px] font-bold text-primary transition hover:bg-primary/[0.04]`}>
                <ShuffleIcon s={13}/>Generate
              </button>
            </div>
            <p className="mt-1 text-[11px] text-ink/35">Min 3 characters. Letters, numbers, underscores only.</p>
          </div>

          {/* Description + source */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={lbl}>Description *</label>
              <input className={INP} value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Platform launch — 20% fee off for early brands"/>
            </div>
            <div>
              <label className={lbl}>Source / attribution tag</label>
              <input className={INP} value={form.source} onChange={e => set('source', e.target.value)}
                placeholder="Vestbee demo, LinkedIn outreach…"/>
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label className={lbl}>Coupon type *</label>
            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(TYPE_CFG) as CouponType[]).map(t => {
                const cfg = TYPE_CFG[t]
                const sel = form.type === t
                return (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className={`flex flex-col gap-1.5 rounded-xl border-2 px-4 py-3 text-left transition ${sel ? `${cfg.border} ${cfg.bg}` : 'border-primary/10 bg-white hover:border-primary/20'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-[14px] font-black ${sel ? `${cfg.bg} ${cfg.color}` : 'bg-surface-sub text-ink/40'}`}>{cfg.icon}</span>
                      <span className={`text-[12.5px] font-bold ${sel ? cfg.color : 'text-ink/65'}`}>{cfg.label}</span>
                      {sel && <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-current text-white/0 ring-2 ring-current"><CheckIcon s={9}/></span>}
                    </div>
                    <p className={`text-[11px] leading-[1.4] ${sel ? cfg.color : 'text-ink/40'}`}>{cfg.usedFor}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Value */}
          {form.type !== 'free_campaign' && (
            <div>
              <label className={lbl}>{form.type === 'flat_credit' ? 'Credit amount (€)' : 'Discount value'}</label>
              <div className="flex items-center gap-3">
                <input type="range"
                  min={form.type === 'flat_credit' ? 10 : 1}
                  max={form.type === 'flat_credit' ? 500 : form.type === 'percentage_fee' ? 50 : 30}
                  step={form.type === 'flat_credit' ? 10 : 1}
                  value={form.value} onChange={e => set('value', parseInt(e.target.value, 10))}
                  className="flex-1 accent-primary"/>
                <div className="flex min-w-[90px] items-center justify-center gap-1 rounded-xl border border-primary/12 bg-surface-sub px-3 py-2">
                  <span className={`text-[18px] font-black ${GRAD_TXT}`}>{form.value}</span>
                  <span className="text-[12px] text-ink/40">{tc.unit}</span>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-ink/35">
                {form.type === 'percentage_fee' && `Reduces platform fee from 12% to ${(12 - form.value * 12 / 100).toFixed(1)}%`}
                {form.type === 'flat_credit'    && `€${form.value} deposited into user's Grade wallet`}
                {form.type === 'bonus_payout'   && `Creator receives ${form.value}% on top of their agreed payout`}
              </p>
            </div>
          )}

          {/* Target */}
          <div>
            <label className={lbl}>Who can redeem?</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'brands', 'creators', 'agencies'] as CouponTarget[]).map(t => (
                <button key={t} type="button" onClick={() => toggleTarget(t)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-[13px] font-bold transition ${form.target.includes(t) ? `${GRAD_BTN} border-transparent text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.4)]` : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
                  {form.target.includes(t) && <CheckIcon s={11}/>}
                  {TARGET_LABELS[t]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] text-ink/40">
              ~<span className="font-bold text-ink">{eligible.toLocaleString()}</span> eligible users
            </p>
          </div>

          {/* Scope */}
          <div>
            <label className={lbl}>Applies to</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SCOPE_LABELS) as CouponScope[]).map(s => (
                <button key={s} type="button" onClick={() => set('scope', s)}
                  className={`rounded-xl border-2 px-3.5 py-2.5 text-left text-[12.5px] font-semibold transition ${form.scope === s ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/12 bg-white text-ink/55 hover:border-primary/22'}`}>
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
            {form.scope === 'above_threshold' && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-[12px] text-ink/45 flex-shrink-0">Min campaign value:</label>
                <div className="relative w-[120px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-[13px]">€</span>
                  <input type="number" min={100} step={100} className={`${INP} pl-7 py-2 text-[13px]`}
                    value={form.scopeThreshold} onChange={e => set('scopeThreshold', parseInt(e.target.value,10)||0)}/>
                </div>
              </div>
            )}
          </div>

          {/* ══ DUAL EXPIRY — THE CORE MECHANIC ══ */}
          <div className={`rounded-2xl border-2 border-primary/15 bg-primary/[0.03] p-5`}>
            <div className="mb-4 flex items-center gap-2">
              <AlertIcon s={14}/>
              <p className="text-[13px] font-extrabold text-ink">Dual-expiry — whichever fires first wins</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Expiry by days */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarIcon s={14}/>
                  <p className="text-[12px] font-black text-blue-700 uppercase tracking-[0.1em]">Expires after</p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input type="range" min={1} max={90} step={1} value={form.expiresAfterDays}
                    onChange={e => set('expiresAfterDays', parseInt(e.target.value, 10))}
                    className="flex-1 accent-blue-500"/>
                  <span className="text-[18px] font-black text-blue-700 min-w-[40px] text-right">
                    {form.expiresAfterDays}d
                  </span>
                </div>
                <p className="text-[11px] text-blue-600/70">
                  Coupon dies {form.expiresAfterDays} days after creation, no matter how many times it was used.
                </p>
              </div>

              {/* Expiry by uses */}
              <div className={`rounded-xl border p-4 ${GRAD_BTN.includes('from-primary') ? 'border-primary/20 bg-primary/[0.05]' : ''} border-primary/20 bg-primary/[0.04]`}>
                <div className="mb-3 flex items-center gap-2">
                  <UsersIcon s={14}/>
                  <p className="text-[12px] font-black text-primary uppercase tracking-[0.1em]">Max uses</p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input type="range" min={1} max={500} step={1} value={form.maxUses}
                    onChange={e => set('maxUses', parseInt(e.target.value, 10))}
                    className="flex-1 accent-primary"/>
                  <input type="number" min={1} max={9999} value={form.maxUses}
                    onChange={e => set('maxUses', parseInt(e.target.value, 10) || 1)}
                    className="w-[60px] rounded-lg border border-primary/20 bg-white px-2 py-1 text-center text-[14px] font-black text-primary outline-none focus:border-primary"/>
                </div>
                <p className="text-[11px] text-primary/60">
                  Coupon dies after {form.maxUses} redemption{form.maxUses !== 1 ? 's' : ''}, no matter how much time has passed.
                </p>
              </div>
            </div>

            {/* Race summary */}
            <div className="mt-3 rounded-xl border border-primary/10 bg-white px-4 py-3">
              <p className="text-[12px] text-ink/55">
                This coupon expires when{' '}
                <span className="font-bold text-blue-600">{form.expiresAfterDays} days pass</span>
                {' '}OR when{' '}
                <span className="font-bold text-primary">{form.maxUses} uses</span>
                {' '}are reached — <span className="font-bold text-ink">whichever comes first.</span>
              </p>
            </div>
          </div>

          {/* Internal note */}
          <div>
            <label className={lbl}>Internal note (admin only)</label>
            <textarea className={`${INP} resize-none leading-relaxed`} rows={2}
              value={form.note} onChange={e => set('note', e.target.value)}
              placeholder="Context for the team — who this was issued to, why, what to watch…"/>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 gap-3 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!isValid || saving}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${isValid && !saving ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
            {saving
              ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Saving…</>
              : <><TagIcon s={14}/>{isEdit ? 'Save changes' : 'Create coupon'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   BULK GENERATE MODAL
   Create N unique codes at once — for events, email campaigns, etc.
   ════════════════════════════════════════════════════════════════════ */
function BulkModal({ open, onClose, onGenerate }: {
  open: boolean
  onClose: () => void
  onGenerate: (codes: string[], settings: Omit<CouponFormData, 'code' | 'description'> & { description: string }) => void
}) {
  const [count,  setCount]  = useState(10)
  const [prefix, setPrefix] = useState('')
  const [type,   setType]   = useState<CouponType>('percentage_fee')
  const [value,  setValue]  = useState(10)
  const [days,   setDays]   = useState(7)
  const [uses,   setUses]   = useState(1)  /* single-use by default for bulk */
  const [source, setSource] = useState('')
  const [preview, setPreview] = useState<string[]>([])
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    if (open) {
      const sample = Array.from({ length: Math.min(count, 5) }, () => generateCode(prefix))
      setPreview(sample)
    }
  }, [open, count, prefix])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!open) return null

  const handleGenerate = () => {
    const codes = Array.from({ length: count }, () => generateCode(prefix))
    onGenerate(codes, {
      source, note: `Bulk generated — ${count} codes`,
      type, value, target: ['all'], scope: 'first_campaign', scopeThreshold: 0,
      expiresAfterDays: days, maxUses: uses, description: `Bulk — ${count} codes`,
    })
  }

  const copyPreview = () => {
    navigator.clipboard.writeText(preview.join('\n')).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 w-full max-w-[520px] overflow-hidden rounded-3xl bg-white ${CARD}`}>
        <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
          <h3 className="text-[16px] font-extrabold text-ink">Bulk generate codes</h3>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40">Number of codes</label>
              <input type="number" min={1} max={500} value={count} onChange={e => setCount(parseInt(e.target.value,10)||1)}
                className={INP}/>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40">Code prefix (optional)</label>
              <input className={`${INP} font-mono uppercase`} value={prefix}
                onChange={e => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="EVENT, OUTREACH…"/>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40">Type</label>
              <select className={INP} value={type} onChange={e => setType(e.target.value as CouponType)}>
                {(Object.keys(TYPE_CFG) as CouponType[]).map(t => <option key={t} value={t}>{TYPE_CFG[t].label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40">Value ({TYPE_CFG[type as CouponType].unit || 'flat'})</label>
              <input type="number" min={0} className={INP} value={value} onChange={e => setValue(parseFloat(e.target.value)||0)}/>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40">Uses per code</label>
              <input type="number" min={1} className={INP} value={uses} onChange={e => setUses(parseInt(e.target.value,10)||1)}/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40">Expires after (days)</label>
              <input type="number" min={1} max={90} className={INP} value={days} onChange={e => setDays(parseInt(e.target.value,10)||1)}/>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40">Source tag</label>
              <input className={INP} value={source} onChange={e => setSource(e.target.value)} placeholder="Event name, campaign…"/>
            </div>
          </div>

          {/* Code preview */}
          <div className="rounded-xl border border-primary/10 bg-[#0A0612] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.1em]">Preview — {count} codes will be generated</p>
              <button onClick={copyPreview} className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary">
                {copied ? <><CheckIcon s={11}/>Copied</> : <><CopyIcon s={11}/>Copy sample</>}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preview.map((c, i) => (
                <span key={i} className="rounded-lg bg-white/[0.07] px-2.5 py-1 font-mono text-[12px] font-bold text-white/80">{c}</span>
              ))}
              {count > 5 && <span className="text-[12px] text-white/30">…and {count - 5} more</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55">Cancel</button>
          <button onClick={handleGenerate}
            className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white ${GRAD_BTN} shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5 transition`}>
            <ZapIcon s={14}/>Generate {count} codes
          </button>
        </div>
      </div>
    </div>
  )
}
/* ════════════════════════════════════════════════════════════════════
   COUPON DETAIL DRAWER
   Slides in from right when a coupon row is clicked.
   Shows full redemption history + live dual-expiry bars.
   ════════════════════════════════════════════════════════════════════ */
function DetailDrawer({ coupon, onClose, onEdit, onPause, onResume, onDelete }: {
  coupon: Coupon | null
  onClose:  () => void
  onEdit:   (c: Coupon) => void
  onPause:  (id: string) => void
  onResume: (id: string) => void
  onDelete: (id: string) => void
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  if (!coupon) return null

  const tc  = TYPE_CFG[coupon.type]
  const sc  = STATUS_CFG[coupon.status]
  const isActive = coupon.status === 'active'

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-ink/30 backdrop-blur-sm" onClick={onClose}/>
      <aside className="fixed right-0 top-0 z-[500] flex h-full w-full max-w-[420px] flex-col bg-white shadow-[−20px_0_40px_-8px_rgba(10,6,18,0.2)]">
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-primary/10 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${isActive ? 'animate-pulse' : ''}`}/>{sc.label}
              </span>
              <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${tc.bg} ${tc.color}`}>{tc.label}</span>
            </div>
            <h3 className="font-mono text-[22px] font-black tracking-widest text-ink">{coupon.code}</h3>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Value hero */}
          <div className={`rounded-2xl p-5 ${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/55 mb-1">Discount value</p>
            <p className="text-[32px] font-black tracking-[-0.04em] text-white">
              {coupon.type === 'free_campaign' ? 'Free campaign'
                : coupon.type === 'flat_credit' ? `€${coupon.value} credit`
                : `${coupon.value}${tc.unit} ${coupon.type === 'percentage_fee' ? 'off fee' : 'bonus'}`}
            </p>
            <p className="text-[12px] text-white/50 mt-1">{tc.desc}</p>
          </div>

          {/* Description + meta */}
          <div className="rounded-xl border border-primary/10 bg-surface-sub/40 px-4 py-4 space-y-2">
            <p className="text-[13.5px] font-semibold text-ink">{coupon.description}</p>
            {[
              { label: 'Source',  value: coupon.source  || '—' },
              { label: 'Target',  value: coupon.target.map(t => TARGET_LABELS[t]).join(', ') },
              { label: 'Scope',   value: SCOPE_LABELS[coupon.scope] },
              { label: 'Created', value: coupon.createdAt },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink/40 font-semibold">{r.label}</span>
                <span className="text-ink font-semibold text-right max-w-[220px] truncate">{r.value}</span>
              </div>
            ))}
            {coupon.note && <p className="text-[12px] text-ink/50 border-t border-primary/8 pt-2 mt-2">{coupon.note}</p>}
          </div>

          {/* Dual expiry bars */}
          <div className="rounded-xl border border-primary/10 bg-white p-4">
            <p className="mb-3 text-[11.5px] font-black uppercase tracking-[0.12em] text-ink/35">Dual-expiry status</p>
            <DualExpiryBars coupon={coupon}/>
          </div>

          {/* GMV unlocked */}
          {coupon.totalValueUnlocked > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-emerald-600 mb-0.5">Total value unlocked</p>
              <p className="text-[22px] font-black text-emerald-700">€{coupon.totalValueUnlocked.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-600/70">{coupon.currentUses} redemption{coupon.currentUses !== 1 ? 's' : ''} · {coupon.redemptions.length} tracked</p>
            </div>
          )}

          {/* Redemption history */}
          {coupon.redemptions.length > 0 && (
            <div>
              <p className="mb-3 text-[11.5px] font-black uppercase tracking-[0.12em] text-ink/35">Redemption history</p>
              <div className="space-y-2">
                {coupon.redemptions.map((r, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-xl border border-primary/8 bg-white px-4 py-3 ${CARD}`}>
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary text-[11px] font-black">
                      {r.userName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-ink truncate">{r.userName}</p>
                      <p className="text-[11px] text-ink/40">{r.redeemedAt}{r.campaignName ? ` · ${r.campaignName}` : ''}</p>
                    </div>
                    {r.valueUnlocked > 0 && (
                      <span className="text-[12px] font-bold text-emerald-600">€{r.valueUnlocked}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 gap-2 border-t border-primary/10 bg-surface-sub/60 px-5 py-4">
          {isActive && (
            <button onClick={() => { onEdit(coupon); onClose() }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl ${GRAD_BTN} py-3 text-[13px] font-bold text-white`}>
              Edit
            </button>
          )}
          {isActive ? (
            <button onClick={() => { onPause(coupon.id); onClose() }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-3 text-[13px] font-bold text-amber-700">
              <PauseIcon s={13}/>Pause
            </button>
          ) : coupon.status === 'paused' ? (
            <button onClick={() => { onResume(coupon.id); onClose() }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-[13px] font-bold text-emerald-700">
              <PlayIcon s={13}/>Resume
            </button>
          ) : null}
          <button onClick={() => { if (window.confirm('Delete this coupon?')) { onDelete(coupon.id); onClose() } }}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50">
            <TrashIcon s={14}/>
          </button>
        </div>
      </aside>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════
   COUPON TABLE ROW
   ════════════════════════════════════════════════════════════════════ */
function CouponRow({ coupon, onClick, onCopy }: {
  coupon: Coupon; onClick: () => void; onCopy: () => void
}) {
  const tc  = TYPE_CFG[coupon.type]
  const sc  = STATUS_CFG[coupon.status]
  const isExpired = coupon.status.startsWith('expired')
  const dLeft = daysLeft(coupon.createdAt, coupon.expiresAfterDays)

  const usesPct = Math.min(100, Math.round((coupon.currentUses / coupon.maxUses) * 100))

  return (
    <tr className={`group border-b border-primary/5 transition hover:bg-primary/[0.015] cursor-pointer ${isExpired ? 'opacity-55' : ''}`}
      onClick={onClick}>
      {/* Code */}
      <td className="py-3.5 pl-5 pr-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13.5px] font-black tracking-wider text-ink">{coupon.code}</span>
          <button type="button" onClick={e => { e.stopPropagation(); onCopy() }}
            className="invisible flex h-6 w-6 items-center justify-center rounded text-ink/35 hover:text-primary group-hover:visible">
            <CopyIcon s={12}/>
          </button>
        </div>
        <p className="text-[11px] text-ink/38 truncate max-w-[180px]">{coupon.description}</p>
      </td>
      {/* Type */}
      <td className="px-3 py-3.5">
        <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${tc.bg} ${tc.color}`}>{tc.label}</span>
      </td>
      {/* Value */}
      <td className="px-3 py-3.5">
        <span className={`text-[14px] font-extrabold ${GRAD_TXT}`}>
          {coupon.type === 'free_campaign' ? 'Free' : `${coupon.value}${tc.unit}`}
        </span>
      </td>
      {/* Status */}
      <td className="px-3 py-3.5">
        <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`}/>{sc.label}
        </span>
      </td>
      {/* Dual expiry mini */}
      <td className="px-3 py-3.5" style={{ minWidth: 160 }}>
        <div className="space-y-1.5">
          {/* Uses bar */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-full max-w-[80px] overflow-hidden rounded-full bg-ink/[0.07]">
              <div className={`h-full rounded-full ${coupon.expiryTrigger === 'uses' ? 'bg-rose-500' : usesPct > 80 ? 'bg-amber-400' : GRAD_BTN}`}
                style={{ width: `${usesPct}%` }}/>
            </div>
            <span className="text-[10.5px] text-ink/40 whitespace-nowrap">{coupon.currentUses}/{coupon.maxUses} uses</span>
          </div>
          {/* Days */}
          <span className={`text-[10.5px] ${coupon.status === 'active' && dLeft <= 3 ? 'font-bold text-amber-600' : 'text-ink/35'}`}>
            {coupon.expiryTrigger === 'date' ? '0d left (expired)' : coupon.status === 'active' ? `${dLeft}d left` : coupon.expiresAfterDays + 'd window'}
          </span>
        </div>
      </td>
      {/* Target */}
      <td className="px-3 py-3.5">
        <div className="flex flex-wrap gap-1">
          {coupon.target.map(t => (
            <span key={t} className="rounded-md bg-surface-sub px-1.5 py-0.5 text-[10px] font-semibold text-ink/50 capitalize">{t}</span>
          ))}
        </div>
      </td>
      {/* Source */}
      <td className="py-3.5 pl-3 pr-5">
        <p className="text-[11.5px] text-ink/40 max-w-[140px] truncate">{coupon.source || '—'}</p>
      </td>
    </tr>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function AdminCouponsPage() {
  const router = useRouter()

  const [coupons,     setCoupons]     = useState<Coupon[]>(INITIAL_COUPONS)
  const [createOpen,  setCreateOpen]  = useState(false)
  const [bulkOpen,    setBulkOpen]    = useState(false)
  const [editTarget,  setEditTarget]  = useState<Coupon | null>(null)
  const [detailCoupon,setDetailCoupon]= useState<Coupon | null>(null)
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState<CouponType | 'all'>('all')
  const [statusFilter,setStatusFilter]= useState<CouponStatus | 'all'>('all')
  const [toast,       setToast]       = useState<{ msg: string } | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast({ msg }); setTimeout(() => setToast(null), 3000)
  }, [])

  /* Derived */
  const active   = coupons.filter(c => c.status === 'active').length
  const expired  = coupons.filter(c => c.status.startsWith('expired')).length
  const totalGMV = coupons.reduce((s, c) => s + c.totalValueUnlocked, 0)
  const totalRed  = coupons.reduce((s, c) => s + c.currentUses, 0)

  /* Filter */
  const visible = coupons.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (typeFilter   !== 'all' && c.type !== typeFilter)     return false
    if (search) {
      const q = search.toLowerCase()
      return c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.source.toLowerCase().includes(q)
    }
    return true
  })

  /* Actions */
  const handleSave = (form: CouponFormData) => {
    if (editTarget) {
      setCoupons(prev => prev.map(c => c.id !== editTarget.id ? c : {
        ...c, code: form.code, description: form.description, note: form.note,
        source: form.source, type: form.type, value: form.value, target: form.target,
        scope: form.scope, scopeThreshold: form.scopeThreshold,
        expiresAfterDays: form.expiresAfterDays, maxUses: form.maxUses,
      }))
      showToast(`Coupon ${form.code} updated`)
    } else {
      const nc: Coupon = {
        id: `cp${Date.now()}`, code: form.code, description: form.description,
        note: form.note, source: form.source, type: form.type, value: form.value,
        target: form.target, scope: form.scope, scopeThreshold: form.scopeThreshold,
        expiresAfterDays: form.expiresAfterDays, maxUses: form.maxUses,
        currentUses: 0, status: 'active', expiryTrigger: 'none',
        createdAt: TODAY_STR, redemptions: [], totalValueUnlocked: 0,
      }
      setCoupons(prev => [nc, ...prev])
      showToast(`Coupon ${form.code} created and live`)
    }
    setCreateOpen(false); setEditTarget(null)
  }

  const handleBulkGenerate = (codes: string[], settings: any) => {
    const bulk: Coupon[] = codes.map((code, i) => ({
      id: `cp_bulk_${Date.now()}_${i}`, code, description: `${settings.source || 'Bulk'} — auto-generated`,
      note: settings.note, source: settings.source, type: settings.type,
      value: settings.value, target: settings.target, scope: settings.scope,
      scopeThreshold: 0, expiresAfterDays: settings.expiresAfterDays,
      maxUses: settings.maxUses, currentUses: 0, status: 'active' as CouponStatus,
      expiryTrigger: 'none' as ExpiryTrigger, createdAt: TODAY_STR,
      redemptions: [], totalValueUnlocked: 0,
    }))
    setCoupons(prev => [...bulk, ...prev])
    setBulkOpen(false)
    showToast(`${codes.length} codes created and active`)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    showToast(`Copied ${code}`)
  }
  const pause  = (id: string) => { setCoupons(prev => prev.map(c => c.id !== id ? c : { ...c, status: 'paused' as CouponStatus })); showToast('Coupon paused') }
  const resume = (id: string) => { setCoupons(prev => prev.map(c => c.id !== id ? c : { ...c, status: 'active' as CouponStatus })); showToast('Coupon resumed') }
  const del    = (id: string) => { setCoupons(prev => prev.filter(c => c.id !== id)); showToast('Coupon deleted') }

  return (
    <div className="flex min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ TOAST ════ */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[900] -translate-x-1/2">
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-white ${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25"><CheckIcon s={13}/></span>
            <p className="text-[13.5px] font-bold">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* ════ MODALS ════ */}
      <CreateModal open={createOpen || editTarget !== null} initial={editTarget}
        onClose={() => { setCreateOpen(false); setEditTarget(null) }} onSave={handleSave}/>
      <BulkModal open={bulkOpen} onClose={() => setBulkOpen(false)} onGenerate={handleBulkGenerate}/>
      <DetailDrawer coupon={detailCoupon} onClose={() => setDetailCoupon(null)}
        onEdit={c => { setDetailCoupon(null); setEditTarget(c) }}
        onPause={pause} onResume={resume} onDelete={del}/>

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
            { icon: <DashIcon s={15}/>,      label: 'Dashboard',     active: false, href: '/admin/dashboard'     },
            { icon: <UsersIcon s={15}/>,     label: 'Users',         active: false, href: '/admin/users'         },
            { icon: <ActivityIcon s={15}/>,  label: 'Campaigns',     active: false, href: '/admin/campaigns'     },
            { icon: <EuroIcon s={15}/>,      label: 'Transactions',  active: false, href: '/admin/transactions'  },
            { icon: <TicketIcon s={15}/>,    label: 'Disputes',      active: false, href: '/admin/disputes'      },
            { icon: <FileIcon s={15}/>,      label: 'Resources',     active: false, href: '/admin/resources'     },
            { icon: <MegaphoneIcon s={15}/>, label: 'Announcements', active: false, href: '/admin/announcements' },
            { icon: <TagIcon s={15}/>,       label: 'Coupons',       active: true,  href: '/admin/coupons', badge: active },
            { icon: <ZapIcon s={15}/>,       label: 'System',        active: false, href: '/admin/system'        },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${item.active ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]` : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'}`}>
              {item.icon}{item.label}
              {(item as any).badge > 0 && (
                <span className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white ${item.active ? 'bg-white/25' : 'bg-emerald-500'}`}>
                  {(item as any).badge}
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
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-primary/10 bg-white/95 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h1 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">Coupons</h1>
            {active > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>{active} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBulkOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
              <ZapIcon s={13}/>Bulk generate
            </button>
            <button onClick={() => { setEditTarget(null); setCreateOpen(true) }}
              className={`flex items-center gap-2 rounded-xl ${GRAD_BTN} px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
              <PlusIcon s={14}/>New coupon
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-6 py-6">

          {/* ── KPI strip ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Active coupons',   value: String(active),                accent: true,  sub: `${expired} expired` },
              { label: 'Total redemptions',value: String(totalRed),               accent: false, sub: 'All-time uses'       },
              { label: 'GMV unlocked',     value: `€${totalGMV.toLocaleString()}`,accent: false, sub: 'Total discount given' },
              { label: 'Avg redemption rate',
                value: (() => {
                  const a = coupons.filter(c => c.maxUses < 9999)
                  if (!a.length) return '—'
                  return Math.round(a.reduce((s, c) => s + (c.currentUses / c.maxUses * 100), 0) / a.length) + '%'
                })(),
                accent: false, sub: 'Uses / max uses' },
            ].map(s => (
              <div key={s.label} className={`flex flex-col gap-2 rounded-2xl border p-5 ${s.accent ? `${GRAD_BTN} border-transparent shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]` : `border-primary/10 bg-white ${CARD}`}`}>
                <div className={`text-[26px] font-black tracking-[-0.03em] ${s.accent ? 'text-white' : 'text-ink'}`}>{s.value}</div>
                <div className={`text-[12.5px] font-semibold ${s.accent ? 'text-white/70' : 'text-ink/50'}`}>{s.label}</div>
                <div className={`text-[11px] ${s.accent ? 'text-white/45' : 'text-ink/35'}`}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Filter bar ── */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 max-w-[280px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={14}/></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code, description…"
                className="w-full rounded-xl border border-primary/12 bg-white py-2 pl-9 pr-3.5 text-[13px] outline-none placeholder:text-ink/28 focus:border-primary/30 transition"/>
            </div>
            {/* Status filter */}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-primary/12 bg-white px-3.5 py-2 text-[13px] font-semibold text-ink/65 outline-none focus:border-primary/30">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired_date">Expired (date)</option>
              <option value="expired_uses">Expired (uses)</option>
            </select>
            {/* Type filter */}
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
              className="rounded-xl border border-primary/12 bg-white px-3.5 py-2 text-[13px] font-semibold text-ink/65 outline-none focus:border-primary/30">
              <option value="all">All types</option>
              {(Object.keys(TYPE_CFG) as CouponType[]).map(t => <option key={t} value={t}>{TYPE_CFG[t].label}</option>)}
            </select>
            <span className="ml-auto text-[12px] text-ink/35 font-semibold">{visible.length} of {coupons.length}</span>
          </div>

          {/* ── Coupon table ── */}
          <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-primary/8 bg-surface-sub/60">
                    {['Code', 'Type', 'Value', 'Status', 'Expiry (uses / days)', 'Target', 'Source'].map((h, i) => (
                      <th key={h} className={`py-3 text-left text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35 ${i === 0 ? 'pl-5 pr-3' : i === 6 ? 'pl-3 pr-5' : 'px-3'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={7} className="py-14 text-center text-[13.5px] text-ink/35">No coupons match the filter.</td></tr>
                  ) : (
                    visible.map(c => (
                      <CouponRow key={c.id} coupon={c}
                        onClick={() => setDetailCoupon(c)}
                        onCopy={() => copyCode(c.code)}/>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-primary/8 bg-surface-sub/40 px-5 py-3">
              <p className="text-[12px] text-ink/40">Click any row to open details</p>
              <p className="text-[12.5px] font-bold text-ink/60">
                Total GMV unlocked: <span className="text-ink font-extrabold">€{visible.reduce((s, c) => s + c.totalValueUnlocked, 0).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}