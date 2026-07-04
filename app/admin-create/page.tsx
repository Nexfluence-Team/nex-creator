'use client'

import React, {
  useState, useEffect, useRef, useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Admin Team Management — app/admin/team/page.tsx
   Nexfluence v4, LIGHT · dark sidebar variant

   WHY THIS PAGE EXISTS (the founder version):
   ─────────────────────────────────────────────
   The single most expensive mistake in early-stage operations isn't
   a bad hire — it's giving every hire full admin access because
   setting up role-based permissions "takes too long."

   One junior support agent accidentally authorising a €4,200
   fraudulent transaction that sat in the pending queue. One growth
   hire accidentally publishing a resource with a €0 platform fee.
   One contractor with lingering dashboard access after they leave.

   These aren't hypothetical. They happen to every marketplace that
   skips this step. You build it once, correctly, before you need it.

   THE PERMISSION PHILOSOPHY — PRINCIPLE OF LEAST PRIVILEGE:
   Every team member gets exactly the access they need to do their
   job. Nothing more. Aleksandrs (Sales) needs to see the dashboard
   to pull metrics for investor decks — he should not be able to
   authorise transactions. A CS hire resolving disputes should not
   be able to permanently ban users. A data analyst should see
   numbers but never individual user emails.

   FOUR ROLES WITH EXPLICIT CAPABILITY GRIDS:
   The key UX insight: nobody reads role descriptions.
   Everyone understands a toggle grid. You see exactly what
   "Support" can do before you send the invite — no surprises.

   Owner   → Full everything. Nuclear key. You only.
   Admin   → Full except team management + cannot touch Owners.
   Support → Disputes + notes + under_review only. No financial data.
   Analyst → Read-only dashboard. No actions. No PII.

   THREE-STEP INVITE FLOW:
   1. Email + Name + Role (description visible)
   2. Permission grid (auto-filled, individually adjustable)
   3. Review + Send (shows exactly what the invite email will say)
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

/* ─── Permission keys ─────────────────────────────────────────────── */
type PermKey =
  | 'dashboard_view' | 'dashboard_export'
  | 'users_view' | 'users_restrict' | 'users_suspend' | 'users_ban'
  | 'transactions_view' | 'transactions_authorise'
  | 'disputes_view' | 'disputes_assign' | 'disputes_resolve' | 'disputes_disqualify'
  | 'resources_view' | 'resources_edit' | 'resources_publish'
  | 'announcements_view' | 'announcements_create' | 'announcements_publish'
  | 'coupons_view' | 'coupons_create' | 'coupons_deactivate'
  | 'team_view' | 'team_invite' | 'team_manage'

type Permissions = Record<PermKey, boolean>

/* ─── Role types ──────────────────────────────────────────────────── */
type AdminRole = 'owner' | 'admin' | 'support' | 'analyst'
type MemberStatus = 'active' | 'invited' | 'deactivated'

/* ─── Permission category structure ─────────────────────────────────
   Shown as rows in the permission grid — each category has a header
   and individual permissions as toggleable columns                   */
interface PermCategory {
  id: string
  label: string
  icon: string
  perms: { key: PermKey; label: string; destructive?: boolean }[]
}

const PERM_CATEGORIES: PermCategory[] = [
  {
    id: 'dashboard', label: 'Dashboard & Analytics', icon: '📊',
    perms: [
      { key: 'dashboard_view',   label: 'View metrics'  },
      { key: 'dashboard_export', label: 'Export data'   },
    ],
  },
  {
    id: 'users', label: 'User Control', icon: '👥',
    perms: [
      { key: 'users_view',     label: 'View users'                  },
      { key: 'users_restrict', label: 'Restrict accounts'           },
      { key: 'users_suspend',  label: 'Suspend accounts', destructive: true },
      { key: 'users_ban',      label: 'Permanent ban',   destructive: true },
    ],
  },
  {
    id: 'transactions', label: 'Transactions', icon: '💶',
    perms: [
      { key: 'transactions_view',       label: 'View transactions'          },
      { key: 'transactions_authorise',  label: 'Authorise payments', destructive: true },
    ],
  },
  {
    id: 'disputes', label: 'Disputes', icon: '⚖️',
    perms: [
      { key: 'disputes_view',         label: 'View disputes'     },
      { key: 'disputes_assign',       label: 'Assign tickets'    },
      { key: 'disputes_resolve',      label: 'Resolve disputes'  },
      { key: 'disputes_disqualify',   label: 'Disqualify',  destructive: true },
    ],
  },
  {
    id: 'resources', label: 'Resources', icon: '📄',
    perms: [
      { key: 'resources_view',    label: 'View resources'  },
      { key: 'resources_edit',    label: 'Edit drafts'     },
      { key: 'resources_publish', label: 'Publish live', destructive: true },
    ],
  },
  {
    id: 'announcements', label: 'Announcements', icon: '📣',
    perms: [
      { key: 'announcements_view',    label: 'View'         },
      { key: 'announcements_create',  label: 'Create drafts'},
      { key: 'announcements_publish', label: 'Publish live', destructive: true },
    ],
  },
  {
    id: 'coupons', label: 'Coupons', icon: '🏷️',
    perms: [
      { key: 'coupons_view',       label: 'View coupons'  },
      { key: 'coupons_create',     label: 'Create coupons'},
      { key: 'coupons_deactivate', label: 'Deactivate',  destructive: true },
    ],
  },
  {
    id: 'team', label: 'Team Management', icon: '🔑',
    perms: [
      { key: 'team_view',   label: 'View team'        },
      { key: 'team_invite', label: 'Invite members'   },
      { key: 'team_manage', label: 'Manage roles', destructive: true },
    ],
  },
]

/* ─── Default permissions per role ──────────────────────────────────  */
const ROLE_PERMISSIONS: Record<AdminRole, Permissions> = {
  owner: {
    dashboard_view: true,  dashboard_export: true,
    users_view: true,      users_restrict: true,   users_suspend: true,    users_ban: true,
    transactions_view: true, transactions_authorise: true,
    disputes_view: true,   disputes_assign: true,  disputes_resolve: true, disputes_disqualify: true,
    resources_view: true,  resources_edit: true,   resources_publish: true,
    announcements_view: true, announcements_create: true, announcements_publish: true,
    coupons_view: true,    coupons_create: true,   coupons_deactivate: true,
    team_view: true,       team_invite: true,      team_manage: true,
  },
  admin: {
    dashboard_view: true,  dashboard_export: true,
    users_view: true,      users_restrict: true,   users_suspend: true,    users_ban: false,
    transactions_view: true, transactions_authorise: true,
    disputes_view: true,   disputes_assign: true,  disputes_resolve: true, disputes_disqualify: true,
    resources_view: true,  resources_edit: true,   resources_publish: true,
    announcements_view: true, announcements_create: true, announcements_publish: true,
    coupons_view: true,    coupons_create: true,   coupons_deactivate: true,
    team_view: false,      team_invite: false,     team_manage: false,
  },
  support: {
    dashboard_view: true,  dashboard_export: false,
    users_view: true,      users_restrict: true,   users_suspend: false,   users_ban: false,
    transactions_view: false, transactions_authorise: false,
    disputes_view: true,   disputes_assign: true,  disputes_resolve: false, disputes_disqualify: false,
    resources_view: true,  resources_edit: false,  resources_publish: false,
    announcements_view: true, announcements_create: false, announcements_publish: false,
    coupons_view: true,    coupons_create: false,  coupons_deactivate: false,
    team_view: false,      team_invite: false,     team_manage: false,
  },
  analyst: {
    dashboard_view: true,  dashboard_export: true,
    users_view: false,     users_restrict: false,  users_suspend: false,   users_ban: false,
    transactions_view: false, transactions_authorise: false,
    disputes_view: false,  disputes_assign: false, disputes_resolve: false, disputes_disqualify: false,
    resources_view: true,  resources_edit: false,  resources_publish: false,
    announcements_view: true, announcements_create: false, announcements_publish: false,
    coupons_view: false,   coupons_create: false,  coupons_deactivate: false,
    team_view: false,      team_invite: false,     team_manage: false,
  },
}

const ROLE_CFG: Record<AdminRole, {
  label: string; badge: string; badgeBg: string; badgeText: string
  desc: string; color: string; canCreate: AdminRole[]
}> = {
  owner: {
    label: 'Owner', badge: '👑', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700',
    desc: 'Full access to everything including team management. Cannot be created by anyone except another Owner.',
    color: '#D97706',
    canCreate: ['owner', 'admin', 'support', 'analyst'],
  },
  admin: {
    label: 'Admin', badge: '⚡', badgeBg: 'bg-violet-50', badgeText: 'text-violet-700',
    desc: 'Full platform access except team management and Owner accounts. Senior ops, growth, CS leads.',
    color: '#8B31E8',
    canCreate: ['support', 'analyst'],
  },
  support: {
    label: 'Support', badge: '🎧', badgeBg: 'bg-blue-50', badgeText: 'text-blue-700',
    desc: 'Can view most pages and act on disputes. Cannot authorise transactions or ban users. CS team.',
    color: '#2563EB',
    canCreate: [],
  },
  analyst: {
    label: 'Analyst', badge: '📊', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700',
    desc: 'Read-only dashboard access. No actions, no PII, no financial details. Investors, data team.',
    color: '#059669',
    canCreate: [],
  },
}

/* ─── Audit entry ─────────────────────────────────────────────────── */
interface TeamAuditEntry {
  id: string; at: string; by: string
  action: string; detail: string
}

/* ─── Team member ─────────────────────────────────────────────────── */
interface TeamMember {
  id:           string
  name:         string
  email:        string
  role:         AdminRole
  status:       MemberStatus
  permissions:  Permissions
  joinedAt:     string
  lastActiveAt: string
  lastPage:     string | null
  invitedBy:    string
  auditLog:     TeamAuditEntry[]
}

/* ─── Mock team data ─────────────────────────────────────────────── */
const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'tm001', name: 'Harshul Gupta', email: 'harshul@nexfluence.eu',
    role: 'owner', status: 'active',
    permissions: ROLE_PERMISSIONS.owner,
    joinedAt: 'Jan 10, 2026', lastActiveAt: 'Now', lastPage: 'Team',
    invitedBy: 'System', auditLog: [],
  },
  {
    id: 'tm002', name: 'Aleksandrs Silonovs', email: 'aleksandrs@nexfluence.eu',
    role: 'admin', status: 'active',
    permissions: { ...ROLE_PERMISSIONS.admin, dashboard_export: true, transactions_authorise: false },
    joinedAt: 'Jan 12, 2026', lastActiveAt: '2h ago', lastPage: 'Transactions',
    invitedBy: 'Harshul Gupta',
    auditLog: [
      { id: 'ta1', at: 'Jan 12, 2026', by: 'Harshul Gupta', action: 'Invited', detail: 'Invited as Admin' },
      { id: 'ta2', at: 'Jan 12, 2026', by: 'Aleksandrs Silonovs', action: 'Accepted invite', detail: 'Account activated' },
      { id: 'ta3', at: 'Jun 1, 2026',  by: 'Harshul Gupta', action: 'Permission changed', detail: 'transactions_authorise → false (per SOC policy)' },
    ],
  },
  {
    id: 'tm003', name: 'Voldemars (CTO)', email: 'voldemars@nexfluence.eu',
    role: 'owner', status: 'active',
    permissions: ROLE_PERMISSIONS.owner,
    joinedAt: 'Jan 10, 2026', lastActiveAt: '45m ago', lastPage: 'System',
    invitedBy: 'Harshul Gupta', auditLog: [
      { id: 'ta4', at: 'Jan 10, 2026', by: 'Harshul Gupta', action: 'Invited', detail: 'Invited as Owner (Co-founder)' },
    ],
  },
  {
    id: 'tm004', name: 'Katrīna Ozola', email: 'katrina@nexfluence.eu',
    role: 'support', status: 'active',
    permissions: ROLE_PERMISSIONS.support,
    joinedAt: 'May 15, 2026', lastActiveAt: '1h ago', lastPage: 'Disputes',
    invitedBy: 'Harshul Gupta', auditLog: [
      { id: 'ta5', at: 'May 15, 2026', by: 'Harshul Gupta', action: 'Invited', detail: 'Invited as Support — CS team' },
      { id: 'ta6', at: 'May 15, 2026', by: 'Katrīna Ozola',  action: 'Accepted invite', detail: 'Account activated' },
    ],
  },
  {
    id: 'tm005', name: 'Darius Kazlauskas', email: 'darius@nexfluence.eu',
    role: 'analyst', status: 'invited',
    permissions: ROLE_PERMISSIONS.analyst,
    joinedAt: '—', lastActiveAt: 'Never', lastPage: null,
    invitedBy: 'Harshul Gupta', auditLog: [
      { id: 'ta7', at: 'Jul 1, 2026', by: 'Harshul Gupta', action: 'Invited', detail: 'Invited as Analyst — Lithuanian investor observer' },
    ],
  },
  {
    id: 'tm006', name: 'Liene Bērziņa', email: 'liene@nexfluence.eu',
    role: 'support', status: 'deactivated',
    permissions: ROLE_PERMISSIONS.support,
    joinedAt: 'Mar 1, 2026', lastActiveAt: 'Jun 10, 2026', lastPage: null,
    invitedBy: 'Harshul Gupta', auditLog: [
      { id: 'ta8', at: 'Mar 1, 2026',  by: 'Harshul Gupta', action: 'Invited', detail: 'Invited as Support — contractor CS' },
      { id: 'ta9', at: 'Jun 10, 2026', by: 'Harshul Gupta', action: 'Deactivated', detail: 'Contract ended. Access revoked.' },
    ],
  },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function CheckIcon({ s = 14 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function PlusIcon({ s = 14 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function SendIcon({ s = 14 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 18-4-8-8-4 19-6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EditIcon({ s = 14 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function KeyIcon({ s = 16 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="7.5" cy="15.5" r="4.5" stroke="currentColor" strokeWidth="1.8"/><path d="M21 2l-9.6 9.6M15 8l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function BanIcon({ s = 14 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ClockIcon({ s = 12 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ChevRight({ s = 13 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function AlertIcon({ s = 15 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function ShieldIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function MailIcon({ s = 14 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function DashIcon({ s = 16 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> }
function UsersIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 21v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ActivityIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 16 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function FileIcon({ s = 16 }: { s?: number })  { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function MegaphoneIcon({ s = 16 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 11v2a8 8 0 008 8v0M3 11a8 8 0 018-8v0M3 11h18M21 11v2M11 19l-2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 7c0 0-3 2-8 2S5 7 5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function TagIcon({ s = 16 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg> }
function ZapIcon({ s = 16 }: { s?: number })   { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LogoutIcon({ s = 15 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ResendIcon({ s = 13 }: { s?: number }) { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="1 4 1 10 7 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   PERMISSION TOGGLE — used in both the invite modal and edit drawer
   ════════════════════════════════════════════════════════════════════ */
function PermToggle({ on, onChange, disabled, destructive }: {
  on: boolean; onChange: (v: boolean) => void
  disabled?: boolean; destructive?: boolean
}) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!on)}
      className={`relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none ${
        disabled ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'
      } ${on
        ? destructive ? 'bg-rose-500' : GRAD_BTN
        : 'bg-ink/15'
      }`}>
      <span className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)' }}/>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PERMISSION GRID — full visual table of all permissions
   Used in both the invite modal (step 2) and the edit drawer
   ════════════════════════════════════════════════════════════════════ */
function PermissionGrid({ perms, onChange, viewerRole, subjectRole, readonly = false }: {
  perms:       Permissions
  onChange?:   (key: PermKey, val: boolean) => void
  viewerRole:  AdminRole
  subjectRole: AdminRole
  readonly?:   boolean
}) {
  /* Owner perms cannot be edited by non-owners */
  const canEdit = !readonly && viewerRole === 'owner'

  return (
    <div className="space-y-4">
      {PERM_CATEGORIES.map(cat => (
        <div key={cat.id} className="rounded-2xl border border-primary/10 bg-white overflow-hidden">
          {/* Category header */}
          <div className="flex items-center gap-2.5 border-b border-primary/8 bg-surface-sub/60 px-4 py-3">
            <span className="text-[16px]">{cat.icon}</span>
            <span className="text-[13px] font-extrabold text-ink">{cat.label}</span>
            {/* Quick summary */}
            <span className="ml-auto text-[11px] text-ink/35">
              {cat.perms.filter(p => perms[p.key]).length}/{cat.perms.length} enabled
            </span>
          </div>
          {/* Permission rows */}
          <div className="divide-y divide-primary/5">
            {cat.perms.map(perm => {
              const isOn = perms[perm.key]
              /* Team management perms locked for non-owners */
              const isLocked = (cat.id === 'team') && viewerRole !== 'owner'
              return (
                <div key={perm.key} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isOn ? perm.destructive ? 'bg-rose-500' : 'bg-emerald-400' : 'bg-ink/15'}`}/>
                    <span className={`text-[13px] font-semibold ${isOn ? 'text-ink' : 'text-ink/40'}`}>{perm.label}</span>
                    {perm.destructive && (
                      <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em] text-rose-500">Destructive</span>
                    )}
                    {isLocked && <span className="text-[10px] text-ink/30 italic">Owner only</span>}
                  </div>
                  <PermToggle
                    on={isOn}
                    destructive={perm.destructive}
                    disabled={isLocked || !canEdit}
                    onChange={v => onChange?.(perm.key, v)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   INVITE MODAL — 3-step flow
   Step 1: Name + Email + Role selection
   Step 2: Permission grid (pre-filled, adjustable)
   Step 3: Review and send
   ════════════════════════════════════════════════════════════════════ */
function InviteModal({ open, viewerRole, onClose, onSend }: {
  open: boolean; viewerRole: AdminRole
  onClose: () => void
  onSend: (name: string, email: string, role: AdminRole, perms: Permissions) => void
}) {
  const [step,  setStep]  = useState(1)
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [role,  setRole]  = useState<AdminRole>('support')
  const [perms, setPerms] = useState<Permissions>({ ...ROLE_PERMISSIONS.support })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) { setStep(1); setName(''); setEmail(''); setRole('support'); setPerms({ ...ROLE_PERMISSIONS.support }); setSending(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  /* Roles this viewer can create */
  const creatableRoles = ROLE_CFG[viewerRole].canCreate

  const selectRole = (r: AdminRole) => {
    setRole(r)
    setPerms({ ...ROLE_PERMISSIONS[r as AdminRole] })
  }
  const togglePerm = (key: PermKey, val: boolean) => setPerms(p => ({ ...p, [key]: val }))

  const step1Valid = name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleSend = async () => {
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    onSend(name.trim(), email.trim(), role, perms)
    setSending(false)
    onClose()
  }

  const rc = ROLE_CFG[role as AdminRole]
  const enabledCount = Object.values(perms).filter(Boolean).length
  const totalCount = Object.keys(perms).length

  const lbl = 'mb-1.5 block text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink/40'

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative z-10 flex w-full max-w-[660px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ maxHeight: 'min(94vh, 860px)' }}>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${GRAD_BTN}`}><KeyIcon s={17}/></div>
            <div>
              <h2 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">Invite team member</h2>
              <div className="mt-1 flex items-center gap-2">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition ${step >= s ? `${GRAD_BTN} text-white` : 'bg-ink/10 text-ink/30'}`}>{s}</div>
                    {s < 3 && <div className={`h-px w-6 transition ${step > s ? 'bg-primary' : 'bg-ink/10'}`}/>}
                  </div>
                ))}
                <span className="ml-1 text-[11px] text-ink/35">
                  {step === 1 ? 'Details & role' : step === 2 ? 'Customise permissions' : 'Review & send'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── STEP 1: Details + Role ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Full name *</label>
                  <input className={INP} value={name} onChange={e => setName(e.target.value)} placeholder="Katrīna Ozola"/>
                </div>
                <div>
                  <label className={lbl}>Work email *</label>
                  <input type="email" className={INP} value={email} onChange={e => setEmail(e.target.value)} placeholder="katrina@nexfluence.eu"/>
                </div>
              </div>

              {/* Role selector */}
              <div>
                <label className={lbl}>Role</label>
                <div className="space-y-2.5">
                  {(Object.keys(ROLE_CFG) as AdminRole[]).filter(r => creatableRoles.includes(r)).map(r => {
                    const cfg = ROLE_CFG[r as AdminRole]
                    const sel = role === r
                    const permCount = Object.values(ROLE_PERMISSIONS[r as AdminRole]).filter(Boolean).length
                    return (
                      <button key={r} type="button" onClick={() => selectRole(r)}
                        className={`flex w-full items-start gap-4 rounded-2xl border-2 px-5 py-4 text-left transition ${sel ? `border-primary/40 bg-primary/[0.04]` : 'border-primary/10 bg-white hover:border-primary/25'}`}>
                        <span className="mt-0.5 text-[22px]">{cfg.badge}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[14px] font-extrabold ${sel ? 'text-primary' : 'text-ink'}`}>{cfg.label}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>{permCount} permissions</span>
                          </div>
                          <p className="text-[12.5px] leading-[1.55] text-ink/55">{cfg.desc}</p>
                        </div>
                        {sel && (
                          <span className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white ${GRAD_BTN}`}><CheckIcon s={11}/></span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Permission grid ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-surface-sub/50 px-4 py-3">
                <div>
                  <p className="text-[13px] font-bold text-ink">
                    {rc.label} default — <span className={GRAD_TXT}>{enabledCount}/{totalCount} permissions enabled</span>
                  </p>
                  <p className="text-[11.5px] text-ink/45 mt-0.5">Adjust individual permissions below. Changes only affect this invite.</p>
                </div>
                <button onClick={() => setPerms({ ...ROLE_PERMISSIONS[role as AdminRole] })}
                  className="text-[12px] font-bold text-primary hover:underline">Reset to default</button>
              </div>
              <PermissionGrid perms={perms} onChange={togglePerm} viewerRole={viewerRole} subjectRole={role}/>
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Preview of invite email */}
              <div className={`overflow-hidden rounded-2xl border ${CARD}`}>
                <div className="flex items-center gap-2 border-b border-primary/8 bg-[#0A0612] px-4 py-3">
                  <MailIcon s={13}/>
                  <span className="text-[11.5px] text-white/60 font-semibold">Invite email preview</span>
                  <span className="ml-auto text-[11px] text-white/30">To: {email}</span>
                </div>
                <div className="bg-white px-5 py-5 space-y-3">
                  <p className="text-[18px] font-extrabold text-ink">You've been invited to Nexfluence admin 🚀</p>
                  <p className="text-[14px] leading-[1.7] text-ink/65">
                    <span className="font-bold text-ink">Harshul Gupta</span> has invited <span className="font-bold text-ink">{name || 'you'}</span> to join the Nexfluence admin team as a <span className={`font-bold ${ROLE_CFG[role as AdminRole].badgeText.replace('text-', 'text-')}`}>{ROLE_CFG[role as AdminRole].label}</span>.
                  </p>
                  <div className={`inline-block rounded-xl ${GRAD_BTN} px-5 py-2.5 text-[14px] font-bold text-white`}>Accept invitation →</div>
                  <p className="text-[12px] text-ink/35">This link expires in 72 hours. If you didn't expect this, ignore it.</p>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-primary/10 bg-surface-sub/40 px-5 py-4 space-y-2">
                {[
                  { label: 'Name',        value: name  },
                  { label: 'Email',       value: email },
                  { label: 'Role',        value: `${ROLE_CFG[role as AdminRole].badge} ${ROLE_CFG[role as AdminRole].label}` },
                  { label: 'Permissions', value: `${enabledCount} of ${totalCount} enabled` },
                  { label: 'Invited by',  value: 'Harshul Gupta (you)' },
                  { label: 'Link expires',value: '72 hours after sending' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between text-[13px]">
                    <span className="text-ink/40 font-semibold">{r.label}</span>
                    <span className="font-bold text-ink">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex flex-shrink-0 gap-3 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">← Back</button>
          ) : (
            <button onClick={onClose} className="flex-1 rounded-xl border border-primary/15 bg-white py-3 text-[13.5px] font-bold text-ink/55 hover:bg-surface-sub">Cancel</button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !step1Valid}
              className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${step === 1 && !step1Valid ? 'cursor-not-allowed bg-ink/10 text-ink/30' : `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5`}`}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSend} disabled={sending}
              className={`flex flex-[2] items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition ${!sending ? `${GRAD_BTN} shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/15 text-ink/30'}`}>
              {sending
                ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Sending…</>
                : <><SendIcon s={14}/>Send invite</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MEMBER DRAWER — full control panel for one team member
   Shows permission grid, audit log, role change, deactivate
   ════════════════════════════════════════════════════════════════════ */
function MemberDrawer({ member, viewerRole, onClose, onRoleChange, onPermChange, onDeactivate, onReactivate, onResendInvite }: {
  member:        TeamMember | null
  viewerRole:    AdminRole
  onClose:       () => void
  onRoleChange:  (id: string, role: AdminRole) => void
  onPermChange:  (id: string, key: PermKey, val: boolean) => void
  onDeactivate:  (id: string) => void
  onReactivate:  (id: string) => void
  onResendInvite:(id: string) => void
}) {
  const [tab, setTab] = useState<'permissions' | 'audit'>('permissions')

  useEffect(() => {
    if (!member) return
    setTab('permissions')
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc)
  }, [member?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!member) return null

  const rc = ROLE_CFG[member.role]
  const isOwner = member.role === 'owner'
  const isViewer = member.id === 'tm001' /* Harshul — self */
  const canEdit = viewerRole === 'owner' && !isViewer
  const enabledCount = Object.values(member.permissions).filter(Boolean).length

  return (
    <>
      <div className="fixed inset-0 z-[500] bg-ink/30 backdrop-blur-sm" onClick={onClose}/>
      <aside className="fixed right-0 top-0 z-[600] flex h-full w-full max-w-[480px] flex-col bg-white shadow-[−20px_0_40px_-8px_rgba(10,6,18,0.2)]">

        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-primary/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-white text-[16px] font-black"
              style={{ background: rc.color }}>
              {member.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-ink">{member.name}</p>
              <p className="text-[12px] text-ink/45">{member.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${rc.badgeBg} ${rc.badgeText}`}>
                  {rc.badge} {rc.label}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  member.status === 'active'      ? 'bg-emerald-50 text-emerald-700' :
                  member.status === 'invited'     ? 'bg-primary/[0.08] text-primary' :
                  'bg-surface-sub text-ink/40'}`}>
                  {member.status === 'active' ? '● Active' : member.status === 'invited' ? '○ Invite pending' : '✕ Deactivated'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10"><XIcon s={14}/></button>
        </div>

        {/* Stats strip */}
        <div className="flex flex-shrink-0 border-b border-primary/8 bg-surface-sub/50 px-5 py-3 gap-6">
          {[
            { label: 'Last active', value: member.lastActiveAt },
            { label: 'Current page', value: member.lastPage ?? '—' },
            { label: 'Joined', value: member.joinedAt },
            { label: 'Permissions', value: `${enabledCount}/${Object.keys(member.permissions).length}` },
          ].map(s => (
            <div key={s.label} className="text-center flex-1">
              <p className="text-[12.5px] font-extrabold text-ink">{s.value}</p>
              <p className="text-[10.5px] text-ink/35 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Role changer (Owner only, not for self) */}
        {canEdit && !isOwner && (
          <div className="flex flex-shrink-0 items-center gap-3 border-b border-primary/8 bg-amber-50 px-5 py-3">
            <span className="text-[12.5px] font-bold text-amber-700 flex-shrink-0">Change role:</span>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(ROLE_CFG) as AdminRole[]).filter(r => r !== 'owner').map(r => (
                <button key={r} type="button" onClick={() => onRoleChange(member.id, r)}
                  className={`rounded-xl border-2 px-3 py-1.5 text-[12px] font-bold transition ${member.role === r ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/15 bg-white text-ink/55 hover:border-primary/25'}`}>
                  {ROLE_CFG[r as AdminRole].badge} {ROLE_CFG[r as AdminRole].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-shrink-0 border-b border-primary/8 bg-surface-sub/40 px-4">
          {[
            { id: 'permissions' as const, label: 'Permissions' },
            { id: 'audit'       as const, label: `Audit log (${member.auditLog.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-3 text-[13px] font-semibold transition ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-ink/45 hover:text-ink/70'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'permissions' && (
            <div className="p-4">
              {!canEdit && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-primary/10 bg-surface-sub/50 px-4 py-3">
                  <AlertIcon s={14}/>
                  <p className="text-[12.5px] text-ink/50 font-semibold">
                    {isViewer ? 'You cannot edit your own permissions.' : 'Only Owners can edit permissions.'}
                  </p>
                </div>
              )}
              <PermissionGrid
                perms={member.permissions}
                onChange={(key, val) => onPermChange(member.id, key, val)}
                viewerRole={viewerRole}
                subjectRole={member.role}
                readonly={!canEdit}
              />
            </div>
          )}
          {tab === 'audit' && (
            <div className="p-4 space-y-3">
              {member.auditLog.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-ink/35">No audit entries for this member.</div>
              ) : [...member.auditLog].reverse().map(entry => (
                <div key={entry.id} className={`rounded-2xl border border-primary/8 bg-white px-4 py-3.5 ${CARD}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-bold text-ink">{entry.action}</span>
                    <span className="text-[11px] text-ink/30">{entry.at}</span>
                  </div>
                  <p className="text-[12.5px] text-ink/55">{entry.detail}</p>
                  <p className="mt-1 text-[11px] text-ink/30">By {entry.by}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action footer */}
        {canEdit && (
          <div className="flex-shrink-0 border-t border-primary/10 bg-surface-sub/60 px-5 py-4 space-y-2">
            {member.status === 'invited' && (
              <button onClick={() => { onResendInvite(member.id); onClose() }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white py-2.5 text-[13px] font-bold text-primary transition hover:bg-primary/[0.04]">
                <ResendIcon s={13}/>Resend invite
              </button>
            )}
            {member.status === 'active' && (
              <button onClick={() => { if (window.confirm(`Deactivate ${member.name}? They will lose all access immediately.`)) { onDeactivate(member.id); onClose() } }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-[13px] font-bold text-rose-700 transition hover:bg-rose-100">
                <BanIcon s={13}/>Deactivate account
              </button>
            )}
            {member.status === 'deactivated' && (
              <button onClick={() => { onReactivate(member.id); onClose() }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-[13px] font-bold text-emerald-700 transition hover:bg-emerald-100">
                <CheckIcon s={13}/>Reactivate account
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
/* ════════════════════════════════════════════════════════════════════
   MEMBER ROW — main table
   ════════════════════════════════════════════════════════════════════ */
function MemberRow({ member, isCurrentUser, onClick }: {
  member: TeamMember; isCurrentUser: boolean; onClick: () => void
}) {
  const rc = ROLE_CFG[member.role]
  const enabledCount = Object.values(member.permissions).filter(Boolean).length
  const totalCount   = Object.keys(member.permissions).length

  const statusCfg = {
    active:      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', label: 'Active' },
    invited:     { bg: 'bg-primary/[0.08]', text: 'text-primary', dot: 'bg-primary/50',  label: 'Invite pending' },
    deactivated: { bg: 'bg-ink/[0.06]',   text: 'text-ink/40',   dot: 'bg-ink/20',       label: 'Deactivated' },
  }[member.status]

  return (
    <tr className={`group border-b border-primary/5 transition cursor-pointer hover:bg-primary/[0.015] ${member.status === 'deactivated' ? 'opacity-55' : ''}`}
      onClick={onClick}>

      {/* Avatar + name */}
      <td className="py-3.5 pl-5 pr-3" style={{ minWidth: 220 }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white text-[11px] font-black"
              style={{ background: rc.color }}>
              {member.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            {/* Online dot for active users */}
            {member.lastActiveAt === 'Now' && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400"/>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-bold text-ink truncate">{member.name}</p>
              {isCurrentUser && <span className="rounded-md bg-primary/[0.08] px-1.5 py-0.5 text-[9.5px] font-black text-primary uppercase tracking-[0.1em]">You</span>}
            </div>
            <p className="text-[11px] text-ink/35 truncate">{member.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-3 py-3.5">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${rc.badgeBg} ${rc.badgeText}`}>
          {rc.badge} {rc.label}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-3.5">
        <span className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusCfg.bg} ${statusCfg.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} ${member.status === 'active' && member.lastActiveAt === 'Now' ? 'animate-pulse' : ''}`}/>
          {statusCfg.label}
        </span>
      </td>

      {/* Permission bar */}
      <td className="px-3 py-3.5" style={{ minWidth: 160 }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-full max-w-[90px] overflow-hidden rounded-full bg-ink/[0.07]">
              <div className={`h-full rounded-full ${GRAD_BTN}`} style={{ width: `${(enabledCount / totalCount) * 100}%` }}/>
            </div>
            <span className="text-[11px] text-ink/40">{enabledCount}/{totalCount}</span>
          </div>
          {/* Quick destructive highlights */}
          <div className="flex gap-1 flex-wrap">
            {member.permissions.users_ban && <span className="rounded px-1 py-0.5 text-[9px] font-bold bg-rose-50 text-rose-500">ban</span>}
            {member.permissions.transactions_authorise && <span className="rounded px-1 py-0.5 text-[9px] font-bold bg-orange-50 text-orange-600">authorise txn</span>}
            {member.permissions.team_manage && <span className="rounded px-1 py-0.5 text-[9px] font-bold bg-amber-50 text-amber-600">team mgmt</span>}
          </div>
        </div>
      </td>

      {/* Last active */}
      <td className="px-3 py-3.5">
        <p className={`text-[12.5px] font-semibold ${member.lastActiveAt === 'Now' ? 'text-emerald-600' : 'text-ink/45'}`}>
          {member.lastActiveAt}
        </p>
        {member.lastPage && (
          <p className="text-[11px] text-ink/30">on {member.lastPage}</p>
        )}
      </td>

      {/* Joined */}
      <td className="px-3 py-3.5 text-[12px] text-ink/40">{member.joinedAt}</td>

      {/* Actions */}
      <td className="py-3.5 pl-3 pr-5">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/12 bg-white text-ink/40 transition hover:border-primary/25 hover:text-primary group-hover:border-primary/20">
          <ChevRight s={13}/>
        </button>
      </td>
    </tr>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function AdminTeamPage() {
  const router = useRouter()

  /* Current viewer — in real app from session. Mock: Harshul = Owner */
  const VIEWER_ID   = 'tm001'
  const VIEWER_ROLE: AdminRole = 'owner'

  const [team,        setTeam]        = useState<TeamMember[]>(INITIAL_TEAM)
  const [inviteOpen,  setInviteOpen]  = useState(false)
  const [drawerMember,setDrawerMember]= useState<TeamMember | null>(null)
  const [roleFilter,  setRoleFilter]  = useState<AdminRole | 'all'>('all')
  const [statFilter,  setStatFilter]  = useState<MemberStatus | 'all'>('all')
  const [toast,       setToast]       = useState<{ msg: string; type: 'ok' | 'warn' } | null>(null)

  const showToast = useCallback((msg: string, type: 'ok' | 'warn' = 'ok') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3200)
  }, [])

  /* Derived */
  const active   = team.filter(m => m.status === 'active').length
  const invited  = team.filter(m => m.status === 'invited').length
  const owners   = team.filter(m => m.role === 'owner').length

  const visible = team.filter(m => {
    if (roleFilter !== 'all' && m.role !== roleFilter)     return false
    if (statFilter !== 'all' && m.status !== statFilter)   return false
    return true
  })

  /* Actions */
  const handleInvite = (name: string, email: string, role: AdminRole, perms: Permissions) => {
    const nm: TeamMember = {
      id: `tm${Date.now()}`, name, email, role, status: 'invited',
      permissions: perms, joinedAt: '—', lastActiveAt: 'Never', lastPage: null,
      invitedBy: 'Harshul Gupta',
      auditLog: [{ id: `ta${Date.now()}`, at: 'Just now', by: 'Harshul Gupta', action: 'Invited', detail: `Invited as ${ROLE_CFG[role as AdminRole].label}` }],
    }
    setTeam(prev => [...prev, nm])
    showToast(`Invite sent to ${email} — link valid 72 hours`)
  }

  const handleRoleChange = (id: string, role: AdminRole) => {
    const entry: TeamAuditEntry = { id: `ta${Date.now()}`, at: 'Just now', by: 'Harshul Gupta', action: 'Role changed', detail: `Changed to ${ROLE_CFG[role as AdminRole].label}` }
    setTeam(prev => prev.map(m => m.id !== id ? m : { ...m, role, permissions: ROLE_PERMISSIONS[role as AdminRole], auditLog: [...m.auditLog, entry] }))
    setDrawerMember(prev => prev?.id === id ? { ...prev, role, permissions: ROLE_PERMISSIONS[role as AdminRole], auditLog: [...prev.auditLog, entry] } : prev)
    showToast(`Role updated to ${ROLE_CFG[role as AdminRole].label}`)
  }

  const handlePermChange = (id: string, key: PermKey, val: boolean) => {
    const entry: TeamAuditEntry = { id: `ta${Date.now()}`, at: 'Just now', by: 'Harshul Gupta', action: 'Permission changed', detail: `${key} → ${val ? 'enabled' : 'disabled'}` }
    setTeam(prev => prev.map(m => m.id !== id ? m : { ...m, permissions: { ...m.permissions, [key]: val }, auditLog: [...m.auditLog, entry] }))
    setDrawerMember(prev => prev?.id === id ? { ...prev, permissions: { ...prev.permissions, [key]: val } } : prev)
  }

  const handleDeactivate = (id: string) => {
    const entry: TeamAuditEntry = { id: `ta${Date.now()}`, at: 'Just now', by: 'Harshul Gupta', action: 'Deactivated', detail: 'Account access revoked' }
    setTeam(prev => prev.map(m => m.id !== id ? m : { ...m, status: 'deactivated' as MemberStatus, auditLog: [...m.auditLog, entry] }))
    showToast('Account deactivated — access revoked immediately', 'warn')
  }

  const handleReactivate = (id: string) => {
    const entry: TeamAuditEntry = { id: `ta${Date.now()}`, at: 'Just now', by: 'Harshul Gupta', action: 'Reactivated', detail: 'Account access restored' }
    setTeam(prev => prev.map(m => m.id !== id ? m : { ...m, status: 'active' as MemberStatus, auditLog: [...m.auditLog, entry] }))
    showToast('Account reactivated')
  }

  const handleResend = (id: string) => {
    const m = team.find(t => t.id === id)
    showToast(`Invite resent to ${m?.email}`)
  }

  return (
    <div className="flex min-h-screen bg-canvas font-rubik text-ink antialiased">

      {/* ════ TOAST ════ */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[900] -translate-x-1/2">
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-white shadow-lg ${toast.type === 'ok' ? `${GRAD_BTN} shadow-[0_12px_32px_-8px_rgba(139,49,232,0.5)]` : 'bg-amber-500'}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
              {toast.type === 'ok' ? <CheckIcon s={13}/> : <AlertIcon s={13}/>}
            </span>
            <p className="text-[13.5px] font-bold">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* ════ MODALS ════ */}
      <InviteModal open={inviteOpen} viewerRole={VIEWER_ROLE} onClose={() => setInviteOpen(false)} onSend={handleInvite}/>
      <MemberDrawer
        member={drawerMember} viewerRole={VIEWER_ROLE}
        onClose={() => setDrawerMember(null)}
        onRoleChange={handleRoleChange}
        onPermChange={handlePermChange}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        onResendInvite={handleResend}
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
            { icon: <DashIcon s={15}/>,      label: 'Dashboard',     href: '/admin/dashboard'     },
            { icon: <UsersIcon s={15}/>,     label: 'User Control',  href: '/admin/user-control'  },
            { icon: <ActivityIcon s={15}/>,  label: 'Campaigns',     href: '/admin/campaigns'     },
            { icon: <EuroIcon s={15}/>,      label: 'Transactions',  href: '/admin/transactions'  },
            { icon: <TicketIcon s={15}/>,    label: 'Disputes',      href: '/admin/disputes'      },
            { icon: <FileIcon s={15}/>,      label: 'Resources',     href: '/admin/resources'     },
            { icon: <MegaphoneIcon s={15}/>, label: 'Announcements', href: '/admin/announcements' },
            { icon: <TagIcon s={15}/>,       label: 'Coupons',       href: '/admin/coupons'       },
            { icon: <KeyIcon s={15}/>,       label: 'Team',          href: '/admin/team', active: true },
            { icon: <ZapIcon s={15}/>,       label: 'System',        href: '/admin/system'        },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${(item as any).active ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]` : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/[0.07] px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${GRAD_BTN}`}>H</div>
            <div className="min-w-0 flex-1"><p className="truncate text-[12.5px] font-bold text-white">Harshul G.</p><p className="text-[11px] text-white/35">Owner</p></div>
            <button onClick={() => router.push('/admin/login')} className="text-white/30 transition hover:text-white/60"><LogoutIcon s={15}/></button>
          </div>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ════ TOPBAR ════ */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-primary/10 bg-white/95 px-6 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <h1 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">Team</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-2.5 py-0.5 text-[11.5px] font-bold text-ink/55">
              {active} active · {invited} pending
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}
              className="rounded-xl border border-primary/12 bg-white px-3 py-2 text-[13px] font-semibold text-ink/65 outline-none">
              <option value="all">All roles</option>
              {(Object.keys(ROLE_CFG) as AdminRole[]).map(r => <option key={r} value={r}>{ROLE_CFG[r as AdminRole].badge} {ROLE_CFG[r as AdminRole].label}</option>)}
            </select>
            <select value={statFilter} onChange={e => setStatFilter(e.target.value as any)}
              className="rounded-xl border border-primary/12 bg-white px-3 py-2 text-[13px] font-semibold text-ink/65 outline-none">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invite pending</option>
              <option value="deactivated">Deactivated</option>
            </select>
            {VIEWER_ROLE === 'owner' && (
              <button onClick={() => setInviteOpen(true)}
                className={`flex items-center gap-2 rounded-xl ${GRAD_BTN} px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] transition hover:-translate-y-0.5`}>
                <PlusIcon s={14}/>Invite member
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto px-6 py-6">

          {/* ── Role overview cards ── */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(Object.keys(ROLE_CFG) as AdminRole[]).map(r => {
              const cfg = ROLE_CFG[r as AdminRole]
              const count = team.filter(m => m.role === r && m.status !== 'deactivated').length
              const permCount = Object.values(ROLE_PERMISSIONS[r as AdminRole]).filter(Boolean).length
              return (
                <button key={r} type="button" onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}
                  className={`flex flex-col gap-3 rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 ${roleFilter === r ? `${GRAD_BTN} border-transparent shadow-[0_8px_24px_-6px_rgba(139,49,232,0.45)]` : `border-primary/10 bg-white ${CARD}`}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[24px]">{cfg.badge}</span>
                    <span className={`text-[24px] font-black tracking-[-0.03em] ${roleFilter === r ? 'text-white' : 'text-ink'}`}>{count}</span>
                  </div>
                  <div>
                    <p className={`text-[14px] font-extrabold ${roleFilter === r ? 'text-white' : 'text-ink'}`}>{cfg.label}</p>
                    <p className={`text-[11.5px] mt-0.5 ${roleFilter === r ? 'text-white/60' : 'text-ink/40'}`}>{permCount} permissions</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* ── Team table ── */}
          <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white ${CARD}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-primary/8 bg-surface-sub/60">
                    {['Member', 'Role', 'Status', 'Permissions', 'Last active', 'Joined', ''].map((h, i) => (
                      <th key={i} className={`py-3 text-left text-[10.5px] font-black uppercase tracking-[0.1em] text-ink/35 ${i === 0 ? 'pl-5 pr-3' : i === 6 ? 'pl-3 pr-5' : 'px-3'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={7} className="py-14 text-center text-[13.5px] text-ink/35">No team members match the filter.</td></tr>
                  ) : visible.map(m => (
                    <MemberRow key={m.id} member={m}
                      isCurrentUser={m.id === VIEWER_ID}
                      onClick={() => setDrawerMember(m)}/>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-primary/8 bg-surface-sub/40 px-5 py-3">
              <p className="text-[12px] text-ink/40">{visible.length} of {team.length} members · click any row to manage</p>
              <p className="text-[12px] text-ink/35">{owners} owner{owners !== 1 ? 's' : ''} · {team.filter(m => m.status === 'active').length} active</p>
            </div>
          </div>

          {/* ── Permission legend ── */}
          <div className={`mt-6 rounded-2xl border border-primary/10 bg-white p-6 ${CARD}`}>
            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${GRAD_BTN}`}><ShieldIcon s={17}/></div>
              <div>
                <h3 className="text-[14px] font-extrabold text-ink">Role access summary</h3>
                <p className="text-[12px] text-ink/40">What each role can access — principle of least privilege</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              {(Object.keys(ROLE_CFG) as AdminRole[]).map(r => {
                const cfg = ROLE_CFG[r as AdminRole]
                const perms = ROLE_PERMISSIONS[r as AdminRole]
                const destructiveCount = PERM_CATEGORIES
                  .flatMap(c => c.perms.filter(p => p.destructive))
                  .filter(p => perms[p.key]).length
                return (
                  <div key={r} className={`rounded-xl border p-4 ${cfg.badgeBg}`}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[18px]">{cfg.badge}</span>
                      <span className={`text-[13px] font-extrabold ${cfg.badgeText}`}>{cfg.label}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11.5px] text-ink/55">{Object.values(perms).filter(Boolean).length} permissions total</p>
                      <p className={`text-[11.5px] font-bold ${destructiveCount > 0 ? 'text-rose-600' : 'text-ink/35'}`}>
                        {destructiveCount} destructive action{destructiveCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}