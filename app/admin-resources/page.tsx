'use client'

import React, { useState, useEffect, useRef, useCallback, type ReactNode, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'

/* ════════════════════════════════════════════════════════════════════
   Admin Resource Editor — app/admin/resources/page.tsx
   Nexfluence v4, LIGHT · dark sidebar variant

   THE STRATEGIC INSIGHT BEHIND THIS PAGE:
   ────────────────────────────────────────
   Every marketplace that fails at scale does so partly because legal
   and operational documents become a graveyard — last edited during
   the seed round, never touched since, contractually stale by the
   time you're doing Series A due diligence.

   This page solves that by treating platform resources like code:
   versioned, diff-able, publish-gated, and editable by the ops team
   without a developer deploy. Legal shouldn't require a git PR.

   THREE EDITOR MODES — because one size breaks all:

   1. RICH TEXT (legal/policy docs)
      contentEditable with a minimal toolbar. Bold, italic, H2/H3,
      bullets, numbered lists, links. Word count live. Version snapshots
      on every save so you can roll back without a database query.

   2. CLAUSE EDITOR (contract templates)
      Numbered clauses in individual textarea blocks. Add, remove,
      reorder. Variable placeholders ({{creator_name}}) highlighted
      inline. Preview tab shows rendered contract output.
      This is how you keep contract templates current without a lawyer
      having to email a Word doc to your developer.

   3. STRUCTURED CONFIG (platform settings)
      Type-safe fields — sliders, toggles, number inputs. Never raw
      JSON. A misconfigured platform fee rate is an audit risk;
      a slider with validated bounds is not.

   PUBLISH GATE:
   Saving creates a draft. Publishing makes it live. If the resource
   is a legal doc seen by users (T&C, Privacy Policy), publishing
   triggers a "users must re-accept" flag — this is a GDPR/ePrivacy
   requirement for material changes, not a nice-to-have.
   ════════════════════════════════════════════════════════════════════ */

const CARD     = 'shadow-[0_1px_2px_rgba(10,6,18,0.04),0_12px_32px_-12px_rgba(139,49,232,0.16)]'
const GRAD_BTN = 'bg-gradient-to-r from-primary via-primary-lt to-magenta'
const GRAD_TXT = 'bg-gradient-to-r from-primary via-primary-lt to-magenta bg-clip-text text-transparent'
const INP      = 'w-full rounded-xl border border-primary/12 bg-surface-sub px-4 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]'

/* ─── Types ──────────────────────────────────────────────────────── */
type ResourceCategory = 'legal' | 'contracts' | 'emails' | 'config'
type EditorMode       = 'richtext' | 'clauses' | 'config'
type ResourceStatus   = 'published' | 'draft' | 'needs_review'

interface ResourceVersion {
  id: string
  savedAt: string
  savedBy: string
  wordCount: number
  note: string
}

interface ConfigField {
  key: string
  label: string
  type: 'number' | 'percentage' | 'toggle' | 'select' | 'text'
  value: number | boolean | string
  min?: number
  max?: number
  step?: number
  options?: string[]
  description: string
  unit?: string
}

interface Clause {
  id: string
  number: string
  text: string
}

interface Resource {
  id: string
  category: ResourceCategory
  title: string
  description: string
  editorMode: EditorMode
  status: ResourceStatus
  requiresReaccept: boolean   /* if published, users must re-accept on next login */
  lastEditedAt: string
  lastEditedBy: string
  publishedAt: string | null
  publishedBy: string | null
  wordCount: number
  versions: ResourceVersion[]
  /* content — depends on editorMode */
  content: string             /* richtext: HTML string */
  clauses: Clause[]           /* clauses mode */
  configFields: ConfigField[] /* config mode */
  affectsPersonas: ('brand' | 'creator' | 'agency')[]
}

/* ─── Resource catalogue ─────────────────────────────────────────── */
const RESOURCES: Resource[] = [
  /* ── LEGAL ── */
  {
    id: 'r01', category: 'legal', editorMode: 'richtext', status: 'published',
    requiresReaccept: true,
    title: 'Platform Terms of Service',
    description: 'Master terms governing use of Creator Nexus for all users.',
    lastEditedAt: 'Jun 15, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 15, 2026', publishedBy: 'Harshul G.',
    wordCount: 3842, affectsPersonas: ['brand', 'creator', 'agency'],
    versions: [
      { id: 'v3', savedAt: 'Jun 15, 2026 · 14:22', savedBy: 'Harshul G.', wordCount: 3842, note: 'Added Grade payment processing clause' },
      { id: 'v2', savedAt: 'May 2, 2026 · 09:14',  savedBy: 'Harshul G.', wordCount: 3710, note: 'DAC7 obligations section added'        },
      { id: 'v1', savedAt: 'Jan 10, 2026 · 11:00', savedBy: 'Harshul G.', wordCount: 3200, note: 'Initial version'                       },
    ],
    content: `<h2>1. Acceptance of Terms</h2><p>By accessing or using Creator Nexus ("the Platform"), operated by Nexfluence SIA ("Nexfluence", "we", "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.</p><h2>2. Eligibility</h2><p>You must be at least 18 years of age and have the legal capacity to enter into binding contracts in your jurisdiction. By registering, you represent and warrant that you meet these requirements.</p><h2>3. Platform Role</h2><p>Creator Nexus is a three-sided marketplace connecting brands, creators, and agencies. Nexfluence acts as a platform operator and is not a party to any agreement made between users, except where explicitly stated in writing.</p><h2>4. Payments & Escrow</h2><p>All payments on the Platform are processed through Grade (YC W26), our authorised payment and escrow provider. By transacting on Creator Nexus, you agree to Grade's payment terms in addition to these Terms. Nexfluence charges a platform fee of 12% on all completed transactions.</p><h2>5. DAC7 Obligations</h2><p>As a platform operator based in Latvia (EU), Nexfluence is subject to the EU DAC7 Directive. We are required to collect, verify, and report income data for qualifying sellers (creators and agencies) to the Latvian State Revenue Service. By transacting on the platform you consent to this reporting obligation.</p>`,
    clauses: [], configFields: [],
  },
  {
    id: 'r02', category: 'legal', editorMode: 'richtext', status: 'published',
    requiresReaccept: true,
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect personal data under GDPR.',
    lastEditedAt: 'Jun 15, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 15, 2026', publishedBy: 'Harshul G.',
    wordCount: 2918, affectsPersonas: ['brand', 'creator', 'agency'],
    versions: [
      { id: 'v2', savedAt: 'Jun 15, 2026 · 14:30', savedBy: 'Harshul G.', wordCount: 2918, note: 'Grade data processor added as sub-processor' },
      { id: 'v1', savedAt: 'Jan 10, 2026 · 11:05', savedBy: 'Harshul G.', wordCount: 2640, note: 'Initial version' },
    ],
    content: `<h2>1. Data Controller</h2><p>Nexfluence SIA, registered in Riga, Latvia (EU), is the data controller for personal data processed through Creator Nexus. You may contact us at privacy@nexfluence.eu.</p><h2>2. Data We Collect</h2><p>We collect information you provide directly (name, email, social handles, payment details), data generated by your use of the platform (campaign activity, message history, transaction records), and technical data (IP address, browser type, device information).</p><h2>3. Legal Basis</h2><p>We process your data on the basis of (a) contract performance — necessary to provide the platform service; (b) legal obligation — DAC7 income reporting; (c) legitimate interests — fraud prevention and platform security; and (d) consent — marketing communications, where you have opted in.</p><h2>4. Data Retention</h2><p>Transaction and contract records are retained for 7 years to meet EU accounting and tax reporting obligations. Profile and campaign data is retained for the duration of your account plus 2 years after account closure.</p>`,
    clauses: [], configFields: [],
  },
  {
    id: 'r03', category: 'legal', editorMode: 'richtext', status: 'draft',
    requiresReaccept: true,
    title: 'Creator Terms & Conditions',
    description: 'Specific T&Cs for creator accounts — deliverables, payments, conduct.',
    lastEditedAt: 'Jul 1, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'May 20, 2026', publishedBy: 'Harshul G.',
    wordCount: 2240, affectsPersonas: ['creator'],
    versions: [
      { id: 'v3', savedAt: 'Jul 1, 2026 · 10:08',  savedBy: 'Harshul G.', wordCount: 2240, note: 'DRAFT — added agency representation clause' },
      { id: 'v2', savedAt: 'May 20, 2026 · 15:44', savedBy: 'Harshul G.', wordCount: 2090, note: 'Published — platform rate updated to 12%'   },
      { id: 'v1', savedAt: 'Jan 10, 2026 · 11:10', savedBy: 'Harshul G.', wordCount: 1920, note: 'Initial version' },
    ],
    content: `<h2>1. Creator Account</h2><p>As a creator on Creator Nexus, you represent that you are the sole owner of the social media accounts linked to your profile and have the right to enter into paid partnerships on those channels.</p><h2>2. Deliverables & Briefs</h2><p>When you accept a campaign, you agree to deliver content that complies with the campaign brief, platform guidelines, and all applicable advertising standards. Content that materially deviates from an approved brief may result in withheld payment per the contract terms.</p><h2>3. Payment & Escrow</h2><p>Campaign fees are held in escrow by Grade and released upon admin-authorised confirmation of delivery. The platform retains 12% of all creator earnings as a service fee. DAC7 income reporting applies to creators earning above the annual threshold.</p><h2>4. Agency Representation</h2><p>If you choose to be represented by an agency on Creator Nexus, the agency may negotiate deals, sign contracts, and receive payments on your behalf per the terms of your representation agreement. You retain the right to terminate representation with the agreed notice period.</p>`,
    clauses: [], configFields: [],
  },
  {
    id: 'r04', category: 'legal', editorMode: 'richtext', status: 'published',
    requiresReaccept: false,
    title: 'DAC7 Data Processing Notice',
    description: 'Mandatory EU DAC7 income reporting disclosure for creators & agencies.',
    lastEditedAt: 'Jun 1, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 1, 2026', publishedBy: 'Harshul G.',
    wordCount: 1480, affectsPersonas: ['creator', 'agency'],
    versions: [
      { id: 'v1', savedAt: 'Jun 1, 2026 · 09:00', savedBy: 'Harshul G.', wordCount: 1480, note: 'Initial version — legal review passed' },
    ],
    content: `<h2>DAC7 Income Reporting — What You Need to Know</h2><p>Under EU Directive 2021/514 (DAC7), Nexfluence SIA is required to collect, verify, and report income data for qualifying platform sellers to the Latvian State Revenue Service by January 31 of the following calendar year.</p><h2>Who Is Affected</h2><p>You are subject to DAC7 reporting if you are a creator or agency who earned income through Creator Nexus during the reporting year and either (a) are resident in an EU member state, or (b) earned above the reporting threshold (€2,000 or 25 transactions, whichever is reached first).</p><h2>What We Report</h2><p>We report your name, address, tax identification number (TIN), date of birth (for individuals), country of tax residence, total income earned on the platform, and the number of completed transactions.</p>`,
    clauses: [], configFields: [],
  },
  /* ── CONTRACTS ── */
  {
    id: 'r05', category: 'contracts', editorMode: 'clauses', status: 'published',
    requiresReaccept: false,
    title: 'Standard Creator Contract — Base Clauses',
    description: 'Default clauses pre-loaded into every brand→creator campaign contract.',
    lastEditedAt: 'Jun 20, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 20, 2026', publishedBy: 'Harshul G.',
    wordCount: 880, affectsPersonas: ['brand', 'creator'],
    versions: [
      { id: 'v2', savedAt: 'Jun 20, 2026 · 16:00', savedBy: 'Harshul G.', wordCount: 880, note: 'Added content ownership clause' },
      { id: 'v1', savedAt: 'Feb 1, 2026 · 10:00',  savedBy: 'Harshul G.', wordCount: 740, note: 'Initial version' },
    ],
    content: '',
    configFields: [],
    clauses: [
      { id: 'c01', number: '1', text: '{{creator_name}} ("Creator") agrees to create and publish the content specified in the campaign brief provided by {{brand_name}} ("Brand") within the timeframe agreed in this contract.' },
      { id: 'c02', number: '2', text: 'All content must comply with the campaign brief, platform community guidelines, and applicable advertising standards including ASA/IAB disclosure requirements for paid partnerships.' },
      { id: 'c03', number: '3', text: 'The Brand agrees to pay Creator the agreed fee in full via Grade escrow, released upon confirmation of compliant content delivery. The platform service fee of 12% is deducted automatically.' },
      { id: 'c04', number: '4', text: 'Creator grants Brand a non-exclusive, royalty-free licence to repurpose, share, and use the delivered content for digital marketing purposes for a period of {{usage_rights_period}} months following publication.' },
      { id: 'c05', number: '5', text: 'Either party may terminate this contract with 7 days written notice prior to content creation commencing. After creation has begun, termination is subject to the payment terms and dispute resolution process on Creator Nexus.' },
      { id: 'c06', number: '6', text: 'Any dispute arising from this contract shall first be addressed through the Creator Nexus dispute resolution process. Unresolved disputes are subject to the laws of the Republic of Latvia.' },
    ],
  },
  {
    id: 'r06', category: 'contracts', editorMode: 'clauses', status: 'published',
    requiresReaccept: false,
    title: 'Standard Agency Management Agreement — Base Clauses',
    description: 'Default clauses for agency↔brand management agreements.',
    lastEditedAt: 'Jun 10, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 10, 2026', publishedBy: 'Harshul G.',
    wordCount: 940, affectsPersonas: ['agency', 'brand'],
    versions: [
      { id: 'v1', savedAt: 'Jun 10, 2026 · 11:30', savedBy: 'Harshul G.', wordCount: 940, note: 'Initial version' },
    ],
    content: '',
    configFields: [],
    clauses: [
      { id: 'c01', number: '1', text: '{{agency_name}} ("Agency") is engaged by {{brand_name}} ("Brand") to manage influencer marketing activities on Creator Nexus on the Brand\'s behalf, as specified in the scope section of this agreement.' },
      { id: 'c02', number: '2', text: 'The Agency is authorised to source, negotiate with, and contract creators from its roster; access the Brand\'s Creator Nexus dashboard; and process campaign payments through Grade escrow on the Brand\'s behalf.' },
      { id: 'c03', number: '3', text: 'Brand agrees to pay Agency the agreed monthly retainer of {{retainer_amount}} {{currency}}, due on the 1st of each calendar month. A late payment fee of 1.5% per month applies after 30 days overdue.' },
      { id: 'c04', number: '4', text: 'This agreement may be terminated by either party with {{notice_period_days}} days written notice. The Agency is entitled to all retainer payments due up to the termination date.' },
      { id: 'c05', number: '5', text: 'The Agency shall maintain confidentiality of all Brand business information accessed during the term of this agreement and for 2 years following termination.' },
    ],
  },
  {
    id: 'r07', category: 'contracts', editorMode: 'clauses', status: 'needs_review',
    requiresReaccept: false,
    title: 'Tripartite Campaign Contract — Base Clauses',
    description: 'Three-party clauses for Agency + Brand + Creator campaign agreements.',
    lastEditedAt: 'Jul 2, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 1, 2026', publishedBy: 'Harshul G.',
    wordCount: 1140, affectsPersonas: ['agency', 'brand', 'creator'],
    versions: [
      { id: 'v3', savedAt: 'Jul 2, 2026 · 08:00',  savedBy: 'Harshul G.', wordCount: 1140, note: 'NEEDS REVIEW — fee routing language updated, pending legal sign-off' },
      { id: 'v2', savedAt: 'Jun 1, 2026 · 14:00',  savedBy: 'Harshul G.', wordCount: 1040, note: 'Added agency fee deduction clause' },
      { id: 'v1', savedAt: 'Apr 15, 2026 · 09:00', savedBy: 'Harshul G.', wordCount: 900,  note: 'Initial version' },
    ],
    content: '',
    configFields: [],
    clauses: [
      { id: 'c01', number: '1', text: 'This agreement is entered into by {{agency_name}} ("Agency") as campaign operator, {{brand_name}} ("Brand") as campaign funder, and {{creator_name}} ("Creator") as content deliverer. All three parties must sign for this contract to take effect.' },
      { id: 'c02', number: '2', text: 'Brand agrees to fund the campaign budget of {{campaign_budget}} {{currency}} into Grade escrow prior to campaign commencement. These funds are held by Grade and released to Creator and Agency upon confirmed delivery.' },
      { id: 'c03', number: '3', text: 'Creator shall deliver {{deliverables_count}} piece(s) of content as specified in the campaign brief, to be approved by Agency acting on Brand\'s behalf, within the agreed timeline.' },
      { id: 'c04', number: '4', text: 'Upon admin-authorised confirmation of content delivery, Grade shall release funds as follows: Creator receives {{creator_payment}} {{currency}}; Agency receives its management fee of {{agency_fee}} {{currency}} ({{agency_fee_pct}}% of campaign value).' },
      { id: 'c05', number: '5', text: 'Content ownership: Brand receives a {{usage_rights_period}}-month non-exclusive licence to repurpose and distribute the delivered content. Creator retains underlying intellectual property rights.' },
      { id: 'c06', number: '6', text: 'This contract is governed by the laws of the Republic of Latvia. Disputes shall be resolved first through the Creator Nexus platform dispute process, then through Latvian jurisdiction if unresolved.' },
    ],
  },
  /* ── EMAILS ── */
  {
    id: 'r08', category: 'emails', editorMode: 'richtext', status: 'published',
    requiresReaccept: false,
    title: 'Brand Welcome Email',
    description: 'Sent to new brand accounts upon registration and studio completion.',
    lastEditedAt: 'May 15, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'May 15, 2026', publishedBy: 'Harshul G.',
    wordCount: 320, affectsPersonas: ['brand'],
    versions: [
      { id: 'v2', savedAt: 'May 15, 2026 · 10:00', savedBy: 'Harshul G.', wordCount: 320, note: 'Personalised subject line added' },
      { id: 'v1', savedAt: 'Jan 15, 2026 · 09:00', savedBy: 'Harshul G.', wordCount: 280, note: 'Initial version' },
    ],
    content: `<h2>Welcome to Creator Nexus, {{brand_name}} 🚀</h2><p>Your brand profile is live. Here's what to do next:</p><p><strong>1. Build your first campaign</strong> — define your goal, set your brief, and let our Baltic creator network know what you need.</p><p><strong>2. Browse creators</strong> — search by niche, platform, and audience demographics. Every creator on Nexus has verified metrics via Phyllo.</p><p><strong>3. Your first deal is performance-based</strong> — you only pay when creators deliver. Funds are held in escrow by Grade until content is approved.</p><p>Questions? Reply to this email or reach us at hello@nexfluence.eu.</p><p>— The Nexfluence team</p>`,
    clauses: [], configFields: [],
  },
  {
    id: 'r09', category: 'emails', editorMode: 'richtext', status: 'published',
    requiresReaccept: false,
    title: 'Creator Welcome Email',
    description: 'Sent to new creator accounts upon onboarding completion.',
    lastEditedAt: 'May 15, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'May 15, 2026', publishedBy: 'Harshul G.',
    wordCount: 295, affectsPersonas: ['creator'],
    versions: [
      { id: 'v1', savedAt: 'May 15, 2026 · 10:05', savedBy: 'Harshul G.', wordCount: 295, note: 'Initial version' },
    ],
    content: `<h2>You're on Creator Nexus, {{creator_name}} ✨</h2><p>Your creator profile is live and discoverable by brands across the Baltic region.</p><p><strong>What happens next:</strong></p><p>Brands will invite you to campaigns that match your niche. When you accept and deliver approved content, payment is released from escrow automatically — no more chasing invoices.</p><p><strong>Your first campaign tip:</strong> Make sure your portfolio section shows your best work. Brands browse profiles before sending invites — a complete profile gets 4× more campaign offers.</p><p>— The Nexfluence team</p>`,
    clauses: [], configFields: [],
  },
  {
    id: 'r10', category: 'emails', editorMode: 'richtext', status: 'draft',
    requiresReaccept: false,
    title: 'Payment Release Notification',
    description: 'Sent to creator/agency when Grade releases funds from escrow.',
    lastEditedAt: 'Jul 1, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'May 15, 2026', publishedBy: 'Harshul G.',
    wordCount: 185, affectsPersonas: ['creator', 'agency'],
    versions: [
      { id: 'v2', savedAt: 'Jul 1, 2026 · 16:30', savedBy: 'Harshul G.', wordCount: 185, note: 'DRAFT — added Grade reference number' },
      { id: 'v1', savedAt: 'May 15, 2026 · 10:10', savedBy: 'Harshul G.', wordCount: 162, note: 'Initial version' },
    ],
    content: `<h2>Payment released — {{amount}} {{currency}} 💸</h2><p>Your content for <strong>{{campaign_name}}</strong> has been approved and payment has been released from escrow.</p><p><strong>Amount:</strong> {{amount}} {{currency}}<br/><strong>Grade reference:</strong> {{grade_ref}}<br/><strong>Expected in your account:</strong> 1–3 business days</p><p>Track your earnings in your Nexus payments dashboard. For any questions, contact support@nexfluence.eu.</p>`,
    clauses: [], configFields: [],
  },
  {
    id: 'r11', category: 'emails', editorMode: 'richtext', status: 'published',
    requiresReaccept: false,
    title: 'Dispute Acknowledgement Email',
    description: 'Sent to both parties when a dispute ticket is opened.',
    lastEditedAt: 'Jun 5, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 5, 2026', publishedBy: 'Harshul G.',
    wordCount: 210, affectsPersonas: ['brand', 'creator', 'agency'],
    versions: [
      { id: 'v1', savedAt: 'Jun 5, 2026 · 11:00', savedBy: 'Harshul G.', wordCount: 210, note: 'Initial version' },
    ],
    content: `<h2>Dispute received — {{ticket_id}}</h2><p>We've received a dispute ticket related to <strong>{{campaign_name}}</strong> or a related agreement. Our team will review and respond within {{response_sla}}.</p><p><strong>Ticket ID:</strong> {{ticket_id}}<br/><strong>Filed by:</strong> {{filer_name}}<br/><strong>Category:</strong> {{dispute_category}}</p><p>Both parties are expected to refrain from unilateral action (removing content, cancelling payments) while the dispute is under review. Violation of this may affect the outcome.</p>`,
    clauses: [], configFields: [],
  },
  /* ── CONFIG ── */
  {
    id: 'r12', category: 'config', editorMode: 'config', status: 'published',
    requiresReaccept: false,
    title: 'Platform Fee Rates',
    description: 'Percentage fees charged by Nexfluence on completed transactions.',
    lastEditedAt: 'Jun 1, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 1, 2026', publishedBy: 'Harshul G.',
    wordCount: 0, affectsPersonas: ['brand', 'creator', 'agency'],
    versions: [
      { id: 'v2', savedAt: 'Jun 1, 2026', savedBy: 'Harshul G.', wordCount: 0, note: 'Rate updated to 12%' },
    ],
    content: '', clauses: [],
    configFields: [
      { key: 'platform_fee_pct', label: 'Platform fee rate', type: 'percentage', value: 12, min: 0, max: 30, step: 0.5, unit: '%', description: 'Deducted from every completed creator payout via Grade. Applied before creator receives funds.' },
      { key: 'agency_pass_through', label: 'Agency pass-through fee', type: 'percentage', value: 8, min: 0, max: 20, step: 0.5, unit: '%', description: 'Fee applied to transactions processed via agency accounts (lower than direct brand rate to incentivise agency partnerships).' },
      { key: 'min_campaign_value', label: 'Minimum campaign value', type: 'number', value: 100, min: 50, max: 10000, step: 10, unit: '€', description: 'Campaigns below this value cannot be created. Prevents micro-transaction overhead.' },
      { key: 'max_single_payout', label: 'Max single payout (auto)', type: 'number', value: 5000, min: 500, max: 50000, step: 100, unit: '€', description: 'Any single payout above this requires manual admin authorisation on the Transactions page.' },
    ],
  },
  {
    id: 'r13', category: 'config', editorMode: 'config', status: 'published',
    requiresReaccept: false,
    title: 'DAC7 Reporting Thresholds',
    description: 'Thresholds that trigger mandatory EU DAC7 income reporting.',
    lastEditedAt: 'Jun 1, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 1, 2026', publishedBy: 'Harshul G.',
    wordCount: 0, affectsPersonas: ['creator', 'agency'],
    versions: [
      { id: 'v1', savedAt: 'Jun 1, 2026', savedBy: 'Harshul G.', wordCount: 0, note: 'Initial — EU statutory values' },
    ],
    content: '', clauses: [],
    configFields: [
      { key: 'dac7_income_threshold', label: 'Annual income threshold', type: 'number', value: 2000, min: 0, max: 50000, step: 100, unit: '€', description: 'Creators and agencies earning above this annually are reported to the Latvian SRS. EU statutory minimum is €2,000.' },
      { key: 'dac7_transaction_threshold', label: 'Transaction count threshold', type: 'number', value: 25, min: 1, max: 200, step: 1, unit: 'transactions', description: 'Reporting also triggers if this many transactions are completed, regardless of total value.' },
      { key: 'dac7_auto_collect_tin', label: 'Auto-request TIN at threshold', type: 'toggle', value: true, description: 'When a user crosses 80% of the reporting threshold, automatically prompt them to submit their Tax Identification Number.' },
      { key: 'dac7_report_currency', label: 'Reporting currency', type: 'select', value: 'EUR', options: ['EUR', 'USD'], description: 'Currency in which income is reported to Latvian SRS. Must be EUR for EU compliance.' },
    ],
  },
  {
    id: 'r14', category: 'config', editorMode: 'config', status: 'published',
    requiresReaccept: false,
    title: 'KYC & Verification SLAs',
    description: 'Timeouts and thresholds for user identity verification flows.',
    lastEditedAt: 'Jun 1, 2026', lastEditedBy: 'Harshul G.',
    publishedAt: 'Jun 1, 2026', publishedBy: 'Harshul G.',
    wordCount: 0, affectsPersonas: ['brand', 'creator', 'agency'],
    versions: [
      { id: 'v1', savedAt: 'Jun 1, 2026', savedBy: 'Harshul G.', wordCount: 0, note: 'Initial' },
    ],
    content: '', clauses: [],
    configFields: [
      { key: 'kyc_review_sla_hours', label: 'KYC review SLA', type: 'number', value: 72, min: 12, max: 240, step: 12, unit: 'hours', description: 'Maximum hours before a submitted KYC application must be reviewed. Accounts are limited until KYC clears.' },
      { key: 'new_account_payout_hold_days', label: 'New account payout hold', type: 'number', value: 7, min: 0, max: 30, step: 1, unit: 'days', description: 'Payouts to accounts less than this many days old always require manual admin authorisation, regardless of auto-auth setting.' },
      { key: 'kyc_reminder_interval_hours', label: 'KYC reminder interval', type: 'number', value: 24, min: 6, max: 72, step: 6, unit: 'hours', description: 'How often to send KYC completion reminders to accounts with pending documents.' },
      { key: 'unverified_campaign_limit', label: 'Campaign limit (unverified)', type: 'number', value: 1, min: 0, max: 5, step: 1, unit: 'campaigns', description: 'Max number of active campaigns an unverified brand account can run simultaneously.' },
    ],
  },
]

/* ════════════════════════════════════════════════════════════════════
   ICONS
   ════════════════════════════════════════════════════════════════════ */
function NexLogo({ className = '' }: { className?: string }) {
  return <img src="/Nex.webp" alt="Nexfluence" className={`w-auto object-contain ${className}`}/> // eslint-disable-line @next/next/no-img-element
}
function CheckIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function XIcon({ s = 14 }: { s?: number })           { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function SearchIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function PlusIcon({ s = 14 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg> }
function TrashIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EditIcon({ s = 15 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function FileIcon({ s = 18 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ShieldIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function MailIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function SettingsIcon({ s = 16 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg> }
function ClockIcon({ s = 13 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function UsersIcon({ s = 16 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M2 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11a3 3 0 000-6M22 21v-1a7 7 0 00-5-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> }
function ActivityIcon({ s = 16 }: { s?: number })    { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EuroIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 6.5a7.5 7.5 0 100 11M3.5 10h10M3.5 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function TicketIcon({ s = 16 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 9V7a2 2 0 012-2h16a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round"/></svg> }
function DashIcon({ s = 16 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> }
function LogoutIcon({ s = 15 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function AlertIcon({ s = 14 }: { s?: number })       { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function HistoryIcon({ s = 14 }: { s?: number })     { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3v5h5M12 7v5l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ZapIcon({ s = 16 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function EyeIcon({ s = 14 }: { s?: number })         { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg> }
function BoldIcon({ s = 14 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ItalicIcon({ s = 14 }: { s?: number })      { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> }
function H2Icon({ s = 14 }: { s?: number })          { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6v12M4 12h8M12 6v12M17 10v8M19 15l-2 3h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ListIcon({ s = 14 }: { s?: number })        { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><line x1="9" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg> }
function OLIcon({ s = 14 }: { s?: number })          { return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><line x1="10" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="10" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="10" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 6h1v4M4 10h2M4 18h2a1 1 0 000-2H4a1 1 0 010-2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> }

/* ════════════════════════════════════════════════════════════════════
   CATEGORY CONFIG
   ════════════════════════════════════════════════════════════════════ */
const CATEGORY_CFG: Record<ResourceCategory, { label: string; icon: ReactNode; color: string; bg: string; border: string }> = {
  legal:     { label: 'Legal',     icon: <ShieldIcon s={15}/>,   color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200' },
  contracts: { label: 'Contracts', icon: <FileIcon s={15}/>,     color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200'   },
  emails:    { label: 'Emails',    icon: <MailIcon s={15}/>,     color: 'text-pink-700',    bg: 'bg-pink-50',     border: 'border-pink-200'   },
  config:    { label: 'Config',    icon: <SettingsIcon s={15}/>, color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
}

const STATUS_CFG: Record<ResourceStatus, { label: string; dot: string; bg: string; text: string }> = {
  published:    { label: 'Published',    dot: 'bg-emerald-400', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  draft:        { label: 'Draft',        dot: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
  needs_review: { label: 'Needs review', dot: 'bg-rose-500',    bg: 'bg-rose-50',     text: 'text-rose-700'    },
}

/* ────────────────────────────────────────────────────────────────── */
function countWords(html: string): number {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
}

function highlightVars(text: string): string {
  return text.replace(/\{\{([^}]+)\}\}/g, '<mark class="bg-primary/[0.12] text-primary rounded px-0.5 font-semibold">{{$1}}</mark>')
}

/* ════════════════════════════════════════════════════════════════════
   RESOURCE CARD
   ════════════════════════════════════════════════════════════════════ */
function ResourceCard({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const cat = CATEGORY_CFG[resource.category]
  const st  = STATUS_CFG[resource.status]
  const draftCount = resource.versions.filter(v => v.note.includes('DRAFT') || v.note.includes('NEEDS')).length

  return (
    <button type="button" onClick={onClick}
      className={`group flex w-full flex-col gap-4 rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-1 ${CARD} ${resource.status === 'needs_review' ? 'border-rose-200' : 'border-primary/10'} hover:shadow-[0_2px_6px_rgba(10,6,18,0.05),0_20px_48px_-12px_rgba(139,49,232,0.28)]`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${cat.bg} ${cat.color}`}>{cat.icon}</div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.bg} ${st.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>{st.label}
          </span>
          {resource.status === 'draft' && (
            <span className="text-[10px] font-semibold text-ink/35">Unpublished changes</span>
          )}
        </div>
      </div>

      {/* Title + desc */}
      <div className="flex-1">
        <h3 className="text-[14px] font-extrabold leading-snug text-ink group-hover:text-primary transition-colors">{resource.title}</h3>
        <p className="mt-1 text-[12.5px] leading-[1.5] text-ink/50">{resource.description}</p>
      </div>

      {/* Meta */}
      <div className="space-y-2 border-t border-primary/8 pt-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-ink/35 flex items-center gap-1.5"><ClockIcon s={11}/>Edited {resource.lastEditedAt}</span>
          {resource.editorMode !== 'config' && (
            <span className="text-[11px] text-ink/35">{resource.wordCount.toLocaleString()} words</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {resource.affectsPersonas.map(p => (
              <span key={p} className="rounded-md bg-surface-sub px-2 py-0.5 text-[10px] font-semibold capitalize text-ink/50">{p}</span>
            ))}
          </div>
          {resource.requiresReaccept && (
            <span className="flex items-center gap-1 text-[10.5px] font-semibold text-amber-600">
              <AlertIcon s={11}/>Re-accept on publish
            </span>
          )}
        </div>
      </div>

      {/* Edit CTA */}
      <div className={`-mx-5 -mb-5 flex items-center justify-center gap-2 rounded-b-2xl border-t border-primary/8 py-3 text-[13px] font-bold text-primary/60 transition group-hover:bg-primary/[0.04] group-hover:text-primary`}>
        <EditIcon s={14}/>Edit resource
      </div>
    </button>
  )
}

/* ════════════════════════════════════════════════════════════════════
   RICH TEXT TOOLBAR
   ════════════════════════════════════════════════════════════════════ */
function RichTextToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement> }) {
  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }
  const tools = [
    { icon: <BoldIcon s={14}/>,   cmd: 'bold',                 title: 'Bold'           },
    { icon: <ItalicIcon s={14}/>, cmd: 'italic',               title: 'Italic'         },
    { icon: <H2Icon s={14}/>,     cmd: 'formatBlock',  val: 'h2', title: 'Heading 2'   },
    { icon: <ListIcon s={14}/>,   cmd: 'insertUnorderedList',  title: 'Bullet list'    },
    { icon: <OLIcon s={14}/>,     cmd: 'insertOrderedList',    title: 'Numbered list'  },
  ]
  return (
    <div className="flex items-center gap-0.5 border-b border-primary/10 bg-surface-sub/60 px-3 py-2">
      {tools.map((t, i) => (
        <button key={i} type="button" title={t.title}
          onMouseDown={e => { e.preventDefault(); exec(t.cmd, t.val) }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink/50 transition hover:bg-white hover:text-primary hover:shadow-sm">
          {t.icon}
        </button>
      ))}
      <div className="mx-1.5 h-4 w-px bg-primary/15"/>
      <button type="button" title="Clear formatting"
        onMouseDown={e => { e.preventDefault(); exec('removeFormat') }}
        className="rounded-lg px-2 py-1 text-[11px] font-semibold text-ink/40 transition hover:bg-white hover:text-ink/70">
        Clear
      </button>
    </div>
  )
}
/* ════════════════════════════════════════════════════════════════════
   EDIT MODAL — three editor modes, version history, publish gate
   ════════════════════════════════════════════════════════════════════ */
function EditModal({ resource, onClose, onSave, onPublish }: {
  resource: Resource | null
  onClose: () => void
  onSave: (id: string, patch: Partial<Resource>, note: string) => void
  onPublish: (id: string) => void
}) {
  const open = resource !== null
  const [activeTab,   setActiveTab]   = useState<'edit' | 'preview' | 'history'>('edit')
  const [content,     setContent]     = useState('')
  const [clauses,     setClauses]     = useState<Clause[]>([])
  const [configVals,  setConfigVals]  = useState<ConfigField[]>([])
  const [saveNote,    setSaveNote]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [dirty,       setDirty]       = useState(false)
  const [wordCount,   setWordCount]   = useState(0)
  const editorRef = useRef<HTMLDivElement>(null)

  /* Reset state whenever resource changes */
  useEffect(() => {
    if (!resource) return
    setContent(resource.content)
    setClauses(resource.clauses.map(c => ({ ...c })))
    setConfigVals(resource.configFields.map(f => ({ ...f })))
    setWordCount(resource.wordCount)
    setActiveTab('edit')
    setDirty(false)
    setSaved(false)
    setSaveNote('')
  }, [resource?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Sync contentEditable → state */
  useEffect(() => {
    if (!editorRef.current || resource?.editorMode !== 'richtext') return
    editorRef.current.innerHTML = content
  }, [resource?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') tryClose() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!resource) return null

  const cat = CATEGORY_CFG[resource.category]
  const st  = STATUS_CFG[resource.status]

  const tryClose = () => {
    if (dirty && !window.confirm('You have unsaved changes. Close anyway?')) return
    onClose()
  }

  const handleEditorInput = () => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    setContent(html)
    setWordCount(countWords(html))
    setDirty(true)
    setSaved(false)
  }

  const handleClauseChange = (id: string, text: string) => {
    setClauses(prev => prev.map(c => c.id === id ? { ...c, text } : c))
    setDirty(true); setSaved(false)
  }
  const addClause = () => {
    const next = { id: `c${Date.now()}`, number: String(clauses.length + 1), text: '' }
    setClauses(prev => [...prev, next])
    setDirty(true)
  }
  const removeClause = (id: string) => {
    setClauses(prev => prev.filter(c => c.id !== id).map((c, i) => ({ ...c, number: String(i + 1) })))
    setDirty(true); setSaved(false)
  }
  const moveClause = (id: string, dir: -1 | 1) => {
    setClauses(prev => {
      const idx = prev.findIndex(c => c.id === id)
      if (idx + dir < 0 || idx + dir >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[idx + dir]] = [next[idx + dir]!, next[idx]!]
      return next.map((c, i) => ({ ...c, number: String(i + 1) }))
    })
    setDirty(true); setSaved(false)
  }
  const updateConfigVal = (key: string, value: number | boolean | string) => {
    setConfigVals(prev => prev.map(f => f.key === key ? { ...f, value } : f))
    setDirty(true); setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false); setSaved(true); setDirty(false)
    onSave(resource.id, {
      content,
      clauses: clauses.map(c => ({ ...c })),
      configFields: configVals.map(f => ({ ...f })),
      wordCount: resource.editorMode === 'richtext' ? wordCount : resource.editorMode === 'clauses' ? clauses.reduce((s, c) => s + countWords(c.text), 0) : 0,
      status: 'draft' as ResourceStatus,
    }, saveNote || 'Quick save')
    setSaveNote('')
  }

  const handlePublish = () => {
    if (dirty) { alert('Save your changes before publishing.'); return }
    const msg = resource.requiresReaccept
      ? `Publishing "${resource.title}" will require all ${resource.affectsPersonas.join(', ')} users to re-accept this document on their next login. Continue?`
      : `Publish "${resource.title}"?`
    if (!window.confirm(msg)) return
    onPublish(resource.id)
  }

  /* ─── RICH TEXT EDITOR ────────────────────────────────────────── */
  const RichTextEditor = () => (
    <div className="flex flex-col">
      <RichTextToolbar editorRef={editorRef as React.RefObject<HTMLDivElement>}/>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleEditorInput}
        className="min-h-[360px] flex-1 overflow-y-auto px-6 py-5 text-[14px] leading-[1.9] text-ink/80 outline-none [&>h2]:mb-2 [&>h2]:mt-5 [&>h2]:text-[17px] [&>h2]:font-extrabold [&>h2]:text-ink [&>h3]:mb-1.5 [&>h3]:mt-4 [&>h3]:text-[15px] [&>h3]:font-bold [&>h3]:text-ink [&>p]:mb-3 [&>ul]:mb-3 [&>ul]:ml-5 [&>ul]:list-disc [&>ol]:mb-3 [&>ol]:ml-5 [&>ol]:list-decimal [&>strong]:font-bold [&>em]:italic"
      />
    </div>
  )

  /* ─── CLAUSE EDITOR ───────────────────────────────────────────── */
  const ClauseEditor = () => (
    <div className="space-y-3 p-5">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/[0.03] px-4 py-2.5">
        <ZapIcon s={13}/>
        <p className="text-[12px] text-ink/55">Variables like <span className="font-mono font-bold text-primary">{'{{brand_name}}'}</span> are auto-filled when contracts are generated. Highlighted in preview.</p>
      </div>
      {clauses.map((clause, i) => (
        <div key={clause.id} className={`group rounded-xl border border-primary/10 bg-white p-4 ${CARD}`}>
          <div className="mb-2.5 flex items-center gap-2">
            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-white ${GRAD_BTN}`}>{clause.number}</span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => moveClause(clause.id, -1)} disabled={i === 0}
                className="flex h-6 w-6 items-center justify-center rounded text-ink/30 hover:text-ink/60 disabled:opacity-20">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => moveClause(clause.id, 1)} disabled={i === clauses.length - 1}
                className="flex h-6 w-6 items-center justify-center rounded text-ink/30 hover:text-ink/60 disabled:opacity-20">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => removeClause(clause.id)} className="flex h-6 w-6 items-center justify-center rounded text-ink/28 hover:bg-rose-50 hover:text-rose-500">
                <TrashIcon s={12}/>
              </button>
            </div>
          </div>
          <textarea value={clause.text} rows={3} onChange={e => handleClauseChange(clause.id, e.target.value)}
            placeholder={`Clause ${clause.number} text…`}
            className={`${INP} resize-y text-[13.5px] leading-relaxed`}/>
        </div>
      ))}
      <button onClick={addClause}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/25 py-3.5 text-[13px] font-bold text-primary/60 transition hover:border-primary/45 hover:bg-primary/[0.02] hover:text-primary">
        <PlusIcon s={14}/>Add clause
      </button>
    </div>
  )

  /* ─── PREVIEW (clauses rendered) ────────────────────────────────── */
  const ClausePreview = () => (
    <div className="p-6">
      <div className="mb-5 rounded-xl border border-primary/10 bg-primary/[0.02] px-5 py-3">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink/35 mb-0.5">Rendered contract template</p>
        <p className="text-[12px] text-ink/45">Variables shown highlighted — replaced with actual values when a contract is generated.</p>
      </div>
      <ol className="space-y-4">
        {clauses.map(c => (
          <li key={c.id} className="flex gap-3.5 text-[13.5px] leading-[1.85] text-ink/75">
            <span className="mt-0.5 flex-shrink-0 text-[11px] font-black text-ink/35">{c.number}.</span>
            <span dangerouslySetInnerHTML={{ __html: highlightVars(c.text) }}/>
          </li>
        ))}
      </ol>
    </div>
  )

  /* ─── CONFIG EDITOR ───────────────────────────────────────────── */
  const ConfigEditor = () => (
    <div className="space-y-4 p-5">
      <div className="mb-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
        <ShieldIcon s={14}/>
        <p className="text-[12px] font-semibold text-emerald-700">These settings are type-validated. Changes take effect platform-wide when published.</p>
      </div>
      {configVals.map(field => (
        <div key={field.key} className={`rounded-2xl border border-primary/10 bg-white p-5 ${CARD}`}>
          <div className="mb-1 flex items-start justify-between gap-4">
            <div>
              <p className="text-[13.5px] font-extrabold text-ink">{field.label}</p>
              <p className="mt-0.5 text-[12px] text-ink/45">{field.description}</p>
            </div>
            {field.type === 'toggle' && (
              <button type="button" onClick={() => updateConfigVal(field.key, !field.value)}
                className={`relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${field.value ? GRAD_BTN : 'bg-ink/15'}`}>
                <span className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                  style={{ transform: field.value ? 'translateX(22px)' : 'translateX(2px)' }}/>
              </button>
            )}
          </div>
          {(field.type === 'number' || field.type === 'percentage') && (
            <div className="mt-3 flex items-center gap-3">
              <input type="range" min={field.min} max={field.max} step={field.step} value={Number(field.value)}
                onChange={e => updateConfigVal(field.key, parseFloat(e.target.value))}
                className="flex-1 accent-primary"/>
              <div className="flex items-center gap-1 rounded-xl border border-primary/12 bg-surface-sub px-3 py-1.5 min-w-[80px] justify-center">
                <input type="number" min={field.min} max={field.max} step={field.step} value={Number(field.value)}
                  onChange={e => updateConfigVal(field.key, parseFloat(e.target.value) || 0)}
                  className="w-[50px] bg-transparent text-center text-[14px] font-extrabold text-ink outline-none"/>
                {field.unit && <span className="text-[12px] text-ink/45">{field.unit}</span>}
              </div>
            </div>
          )}
          {field.type === 'select' && (
            <div className="mt-3 flex flex-wrap gap-2">
              {field.options?.map(opt => (
                <button key={opt} type="button" onClick={() => updateConfigVal(field.key, opt)}
                  className={`rounded-xl border px-4 py-2 text-[13px] font-bold transition ${field.value === opt ? `${GRAD_BTN} border-transparent text-white` : 'border-primary/12 bg-white text-ink/55 hover:border-primary/25'}`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
          {field.type === 'text' && (
            <input className={`${INP} mt-3`} value={String(field.value)} onChange={e => updateConfigVal(field.key, e.target.value)}/>
          )}
        </div>
      ))}
    </div>
  )

  /* ─── VERSION HISTORY ─────────────────────────────────────────── */
  const VersionHistory = () => (
    <div className="p-5 space-y-3">
      <p className="text-[12px] font-bold text-ink/40 uppercase tracking-[0.1em] mb-4">Saved versions — click to restore</p>
      {resource.versions.map((v, i) => (
        <button key={v.id} type="button"
          onClick={() => {
            if (i === 0) return /* already current */
            if (!window.confirm(`Restore to "${v.note}"? Current unsaved changes will be lost.`)) return
            setContent(resource.content) /* in real app, load that version's content */
            if (editorRef.current) editorRef.current.innerHTML = resource.content
            setDirty(true)
            setActiveTab('edit')
          }}
          className={`w-full flex items-start gap-4 rounded-2xl border px-4 py-4 text-left transition ${i === 0 ? 'border-primary/20 bg-primary/[0.04]' : `border-primary/10 bg-white hover:border-primary/25 ${CARD}`}`}>
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white ${i === 0 ? GRAD_BTN : 'bg-ink/15 text-ink/50'}`}>
            {i === 0 ? 'Now' : `v${resource.versions.length - i}`}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-semibold ${i === 0 ? 'text-primary' : 'text-ink/70'}`}>{v.note}</p>
            <p className="text-[11.5px] text-ink/40 mt-0.5">{v.savedAt} · {v.savedBy} · {v.wordCount.toLocaleString()} words</p>
          </div>
          {i !== 0 && <span className="text-[11px] font-bold text-primary/50 mt-1">Restore →</span>}
        </button>
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) tryClose() }}>
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={tryClose}/>

      <div className={`relative z-10 flex w-full max-w-[860px] flex-col overflow-hidden rounded-3xl bg-white ${CARD}`}
        style={{ height: 'min(92vh, 760px)' }}>

        {/* ── Modal header ── */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-primary/10 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${cat.bg} ${cat.color}`}>{cat.icon}</div>
            <div>
              <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">{resource.title}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.bg} ${st.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`}/>{st.label}
                </span>
                <span className="text-[11.5px] text-ink/35">Last saved {resource.lastEditedAt} by {resource.lastEditedBy}</span>
                {resource.editorMode !== 'config' && <span className="text-[11.5px] text-ink/35">· {wordCount.toLocaleString()} words</span>}
                {dirty && <span className="text-[11.5px] font-semibold text-amber-600">· Unsaved changes</span>}
                {saved && <span className="text-[11.5px] font-semibold text-emerald-600">· Saved ✓</span>}
              </div>
            </div>
          </div>
          <button onClick={tryClose} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink/45 hover:bg-ink/10">
            <XIcon s={14}/>
          </button>
        </div>

        {/* ── Re-accept warning ── */}
        {resource.requiresReaccept && resource.status === 'published' && (
          <div className="flex flex-shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-6 py-3">
            <AlertIcon s={15}/>
            <p className="text-[12.5px] font-semibold text-amber-700">
              Publishing changes to this document will prompt all {resource.affectsPersonas.join(', ')} users to re-accept it on their next login — required for material legal changes.
            </p>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex flex-shrink-0 items-center gap-0 border-b border-primary/8 bg-surface-sub/40 px-4 pt-0">
          {([
            { id: 'edit' as const, label: resource.editorMode === 'config' ? 'Settings' : 'Editor', always: true },
            { id: 'preview' as const, label: 'Preview', always: resource.editorMode === 'clauses' },
            { id: 'history' as const, label: `History (${resource.versions.length})`, always: true },
          ] as const).filter(t => t.always || t.id === 'preview').map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-[13px] font-semibold transition ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-ink/45 hover:text-ink/70'}`}>
              {tab.id === 'edit' && <EditIcon s={13}/>}
              {tab.id === 'preview' && <EyeIcon s={13}/>}
              {tab.id === 'history' && <HistoryIcon s={13}/>}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Editor area ── */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'edit' && resource.editorMode === 'richtext'  && <RichTextEditor/>}
          {activeTab === 'edit' && resource.editorMode === 'clauses'   && <ClauseEditor/>}
          {activeTab === 'edit' && resource.editorMode === 'config'    && <ConfigEditor/>}
          {activeTab === 'preview' && resource.editorMode === 'clauses' && <ClausePreview/>}
          {activeTab === 'history' && <VersionHistory/>}
        </div>

        {/* ── Footer: save note + actions ── */}
        <div className="flex-shrink-0 border-t border-primary/10 bg-surface-sub/60 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {resource.editorMode !== 'config' && (
              <input value={saveNote} onChange={e => setSaveNote(e.target.value)}
                placeholder="Save note (optional — what changed?)"
                className="flex-1 rounded-xl border border-primary/12 bg-white px-4 py-2.5 text-[13px] text-ink outline-none transition placeholder:text-ink/28 focus:border-primary focus:shadow-[0_0_0_3px_rgba(139,49,232,0.10)]"/>
            )}
            <div className="flex gap-2.5">
              <button onClick={handleSave} disabled={saving || !dirty}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13.5px] font-bold text-white transition ${dirty && !saving ? `${GRAD_BTN} shadow-[0_6px_18px_-6px_rgba(139,49,232,0.45)] hover:-translate-y-0.5` : 'cursor-not-allowed bg-ink/10 text-ink/30'}`}>
                {saving ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Saving…</> : <><CheckIcon s={13}/>Save draft</>}
              </button>
              <button onClick={handlePublish}
                className="flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-5 py-2.5 text-[13.5px] font-bold text-primary transition hover:-translate-y-0.5 hover:bg-primary/[0.04]">
                <ZapIcon s={13}/>Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function AdminResourcesPage() {
  const router = useRouter()

  const [resources,    setResources]    = useState<Resource[]>(RESOURCES)
  const [activeTab,    setActiveTab]    = useState<ResourceCategory | 'all'>('all')
  const [search,       setSearch]       = useState('')
  const [editTarget,   setEditTarget]   = useState<Resource | null>(null)
  const [toast,        setToast]        = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }, [])

  const handleSave = (id: string, patch: Partial<Resource>, note: string) => {
    setResources(prev => prev.map(r => {
      if (r.id !== id) return r
      const newVersion: ResourceVersion = {
        id: `v${Date.now()}`,
        savedAt: 'Just now',
        savedBy: 'Harshul G.',
        wordCount: patch.wordCount ?? r.wordCount,
        note: note || 'Quick save',
      }
      return {
        ...r,
        ...patch,
        lastEditedAt: 'Just now',
        lastEditedBy: 'Harshul G.',
        versions: [newVersion, ...r.versions].slice(0, 10),
      }
    }))
    showToast('Draft saved successfully')
  }

  const handlePublish = (id: string) => {
    setResources(prev => prev.map(r => r.id !== id ? r : {
      ...r,
      status: 'published' as ResourceStatus,
      publishedAt: 'Just now',
      publishedBy: 'Harshul G.',
    }))
    setEditTarget(prev => prev?.id === id ? { ...prev, status: 'published', publishedAt: 'Just now', publishedBy: 'Harshul G.' } : prev)
    showToast('Published — changes are now live on the platform')
  }

  const handleBulkPublish = () => {
    const ids = bulkSelected
    setResources(prev => prev.map(r => ids.has(r.id) ? { ...r, status: 'published' as ResourceStatus, publishedAt: 'Just now', publishedBy: 'Harshul G.' } : r))
    setBulkSelected(new Set())
    showToast(`Published ${ids.size} resource${ids.size !== 1 ? 's' : ''}`)
  }

  /* Filtered list */
  const filtered = resources.filter(r => {
    if (activeTab !== 'all' && r.category !== activeTab) return false
    if (search) {
      const q = search.toLowerCase()
      return r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    }
    return true
  })

  /* Counts per tab */
  const counts: Record<ResourceCategory | 'all', number> = {
    all:       resources.length,
    legal:     resources.filter(r => r.category === 'legal').length,
    contracts: resources.filter(r => r.category === 'contracts').length,
    emails:    resources.filter(r => r.category === 'emails').length,
    config:    resources.filter(r => r.category === 'config').length,
  }

  const draftCount       = resources.filter(r => r.status === 'draft').length
  const needsReviewCount = resources.filter(r => r.status === 'needs_review').length

  const TABS: { id: ResourceCategory | 'all'; label: string; icon: ReactNode }[] = [
    { id: 'all',       label: 'All',       icon: <FileIcon s={14}/> },
    { id: 'legal',     label: 'Legal',     icon: <ShieldIcon s={14}/> },
    { id: 'contracts', label: 'Contracts', icon: <FileIcon s={14}/> },
    { id: 'emails',    label: 'Emails',    icon: <MailIcon s={14}/> },
    { id: 'config',    label: 'Config',    icon: <SettingsIcon s={14}/> },
  ]

  return (
    <div className="flex min-h-screen bg-canvas font-rubik text-ink antialiased">

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

      {/* ════ EDIT MODAL ════ */}
      <EditModal
        resource={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
        onPublish={handlePublish}
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
            { icon: <DashIcon s={15}/>,     label: 'Dashboard',    active: false, href: '/admin/dashboard',    badge: 0 },
            { icon: <UsersIcon s={15}/>,    label: 'Users',        active: false, href: '/admin/users',        badge: 0 },
            { icon: <ActivityIcon s={15}/>, label: 'Campaigns',    active: false, href: '/admin/campaigns',    badge: 0 },
            { icon: <EuroIcon s={15}/>,     label: 'Transactions', active: false, href: '/admin/transactions', badge: 0 },
            { icon: <TicketIcon s={15}/>,   label: 'Disputes',     active: false, href: '/admin/disputes',     badge: 0 },
            { icon: <FileIcon s={15}/>,     label: 'Resources',    active: true,  href: '/admin/resources',    badge: draftCount + needsReviewCount },
            { icon: <ZapIcon s={15}/>,      label: 'System',       active: false, href: '/admin/system',       badge: 0 },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all ${item.active ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.45)]` : 'text-white/45 hover:bg-white/[0.06] hover:text-white/80'}`}>
              {item.icon}{item.label}
              {item.badge > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-white">{item.badge}</span>
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
            <h1 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">Resources</h1>
            {(draftCount + needsReviewCount) > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"/>
                {draftCount} draft{draftCount !== 1 ? 's' : ''}{needsReviewCount > 0 ? ` · ${needsReviewCount} need review` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"><SearchIcon s={14}/></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search resources…"
                className="w-[200px] rounded-xl border border-primary/12 bg-surface-sub py-2 pl-9 pr-3.5 text-[13px] outline-none placeholder:text-ink/28 focus:border-primary/30 focus:bg-white focus:w-[240px] transition-all"/>
            </div>
            {/* Bulk publish */}
            {bulkSelected.size > 0 && (
              <button onClick={handleBulkPublish}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold text-white ${GRAD_BTN} shadow-[0_4px_12px_-4px_rgba(139,49,232,0.4)]`}>
                <ZapIcon s={13}/>Publish {bulkSelected.size}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto px-6 py-6">

          {/* ── Needs-review alert ── */}
          {needsReviewCount > 0 && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5">
              <AlertIcon s={16}/>
              <p className="flex-1 text-[13px] font-bold text-rose-700">
                {needsReviewCount} resource{needsReviewCount !== 1 ? 's' : ''} flagged for review before next publish — check contract templates.
              </p>
              <button onClick={() => setActiveTab('contracts')} className="text-[12.5px] font-bold text-rose-600 underline underline-offset-2">
                View contracts
              </button>
            </div>
          )}

          {/* ── Category tabs ── */}
          <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-2xl border border-primary/10 bg-white p-1.5 w-fit">
            {TABS.map(tab => {
              const active = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition whitespace-nowrap ${active ? `${GRAD_BTN} text-white shadow-[0_4px_12px_-4px_rgba(139,49,232,0.4)]` : 'text-ink/50 hover:text-ink/80 hover:bg-surface-sub'}`}>
                  {tab.icon}
                  {tab.label}
                  <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-black ${active ? 'bg-white/25 text-white' : 'bg-primary/[0.08] text-primary'}`}>
                    {counts[tab.id]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Resource grid ── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${GRAD_BTN} text-white shadow-[0_8px_24px_-6px_rgba(139,49,232,0.4)]`}>
                <SearchIcon s={28}/>
              </div>
              <p className="text-[15px] font-bold text-ink/50">No resources match "{search}"</p>
              <button onClick={() => setSearch('')} className="mt-3 text-[13px] font-bold text-primary hover:underline">Clear search</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map(resource => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onClick={() => setEditTarget(resource)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}