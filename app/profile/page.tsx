'use client'
import { useState } from 'react'
import Link from 'next/link'

const SIDEBAR_SECTIONS = [
  { icon: '▦', label: 'Header' },
  { icon: '◉', label: 'Profile' },
  { icon: '🖼', label: 'Media' },
  { icon: '💰', label: 'Rates' },
  { icon: '📊', label: 'Analytics', badge: 'New' },
  { icon: '📋', label: 'Case Studies', badge: 'New' },
  { icon: '💬', label: 'Testimonials' },
  { icon: '🔗', label: 'Links' },
  { icon: '✉️', label: 'Contact' },
]

const THEMES = ['Classic', 'Minimal', 'MacBook', 'Bloom', 'Dark', 'Warm']
const DEVICES = ['Desktop', 'Tablet', 'Mobile']

export default function StudioPage() {
  const [activeSection, setActiveSection] = useState('Header')
  const [tab, setTab] = useState<'Content' | 'Design'>('Design')
  const [device, setDevice] = useState('Desktop')
  const [selectedTheme, setSelectedTheme] = useState('Minimal')
  const [showChecklist, setShowChecklist] = useState(true)

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex font-body">
      {/* LEFT PANEL */}
      <aside className="w-64 bg-white border-r border-[#E2DDD6] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E2DDD6] flex items-center gap-3">
          <Link href="/dashboard" className="text-[#6B6760] hover:text-[#111010] transition-colors">←</Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#111010] rounded-lg flex items-center justify-center">
              <span className="text-[#C8F135] font-display font-black text-xs">N</span>
            </div>
            <span className="font-display font-black text-base text-[#111010]">Portfolio Studio</span>
          </div>
          <button className="ml-auto bg-[#F5F0E8] border border-[#E2DDD6] text-[#6B6760] text-xs px-2 py-1 rounded-lg font-display font-bold hover:border-[#111010] transition-colors">
            Upgrade
          </button>
        </div>

        {/* Section nav */}
        <nav className="p-3 space-y-1 border-b border-[#E2DDD6]">
          {SIDEBAR_SECTIONS.map(s => (
            <button key={s.label} onClick={() => setActiveSection(s.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${activeSection === s.label ? 'bg-[#111010] text-white' : 'text-[#6B6760] hover:bg-[#F5F0E8] hover:text-[#111010]'}`}>
              <span className="text-base">{s.icon}</span>
              <span className="font-display font-bold text-sm flex-1">{s.label}</span>
              {s.badge && <span className="bg-[#C8F135] text-[#111010] text-[10px] font-display font-black px-1.5 py-0.5 rounded-full">{s.badge}</span>}
            </button>
          ))}
        </nav>

        {/* Content / Design tabs */}
        <div className="p-3 flex-1 overflow-auto">
          <div className="flex bg-[#F5F0E8] rounded-xl p-1 mb-4">
            {(['Content', 'Design'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-display font-bold transition-all ${tab === t ? 'bg-white shadow text-[#111010]' : 'text-[#6B6760]'}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'Design' && (
            <div>
              <p className="text-xs font-display font-bold uppercase tracking-wider text-[#6B6760] mb-3">Hero section</p>
              <p className="text-xs text-[#6B6760] font-body mb-3">Choose a design for your hero section. Saved to your profile.</p>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map(t => (
                  <button key={t} onClick={() => setSelectedTheme(t)}
                    className={`aspect-video rounded-xl border-2 text-sm font-display font-bold transition-all flex items-center justify-center ${selectedTheme === t ? 'border-[#111010] bg-[#111010] text-white' : 'border-[#E2DDD6] bg-[#F5F0E8] text-[#6B6760] hover:border-[#111010]'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'Content' && activeSection === 'Header' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-display font-bold text-[#111010] mb-2">Display Name</label>
                <input defaultValue="Sarvesh Mishra" className="w-full px-3 py-2.5 rounded-xl border-2 border-[#E2DDD6] bg-white focus:outline-none focus:border-[#111010] text-sm font-body text-[#111010]" />
              </div>
              <div>
                <label className="block text-xs font-display font-bold text-[#111010] mb-2">Bio</label>
                <textarea rows={3} defaultValue="UGC Creator based in India" className="w-full px-3 py-2.5 rounded-xl border-2 border-[#E2DDD6] bg-white focus:outline-none focus:border-[#111010] text-sm font-body text-[#111010] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-display font-bold text-[#111010] mb-2">Location</label>
                <input defaultValue="India" className="w-full px-3 py-2.5 rounded-xl border-2 border-[#E2DDD6] bg-white focus:outline-none focus:border-[#111010] text-sm font-body text-[#111010]" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t border-[#E2DDD6]">
          <button onClick={() => setShowChecklist(true)} className="w-full py-2.5 bg-[#111010] text-white rounded-xl font-display font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#C8F135] hover:text-[#111010] transition-all">
            <span>●</span> Portfolio Checklist
          </button>
          <button className="w-full mt-2 py-2 text-[#6B6760] text-xs font-display font-bold hover:text-[#111010] transition-colors">
            🔒 Secret.. Coming Soon
          </button>
        </div>
      </aside>

      {/* MAIN PREVIEW */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-[#E2DDD6] px-4 py-3 flex items-center justify-between">
          <div className="flex gap-1">
            {['↩', '↪'].map(a => (
              <button key={a} className="w-8 h-8 rounded-lg border border-[#E2DDD6] flex items-center justify-center text-[#6B6760] hover:bg-[#F5F0E8] transition-colors font-bold">{a}</button>
            ))}
          </div>
          {/* Device switcher */}
          <div className="flex bg-[#F5F0E8] rounded-xl p-1 gap-1">
            {DEVICES.map(d => (
              <button key={d} onClick={() => setDevice(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all ${device === d ? 'bg-white shadow text-[#111010]' : 'text-[#6B6760]'}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-[#C8F135] text-[#111010] px-4 py-2 rounded-full font-display font-black text-sm hover:bg-[#111010] hover:text-white transition-all">
              Preview ↗
            </button>
            <button className="border border-[#E2DDD6] text-[#111010] px-4 py-2 rounded-full font-display font-bold text-sm hover:bg-[#F5F0E8] transition-colors">
              Copy link 🔗
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 bg-[#F0EBE0] flex items-start justify-center p-8 overflow-auto">
          <div className={`bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${device === 'Mobile' ? 'w-80' : device === 'Tablet' ? 'w-[600px]' : 'w-full max-w-3xl'}`}>
            {/* Nav */}
            <div className="bg-[#111010] text-white px-6 py-4 flex items-center justify-between">
              <div className="w-8 h-8 bg-[#C8F135] rounded-lg flex items-center justify-center">
                <span className="text-[#111010] font-display font-black text-sm">N</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/60 text-sm font-display font-bold">Portfolio</span>
                <span className="text-white/60 text-sm font-display font-bold">Rates</span>
                <button className="bg-white text-[#111010] px-3 py-1.5 rounded-full text-sm font-display font-bold">Get Started</button>
              </div>
            </div>
            {/* Hero */}
            <div className="p-8 flex items-start gap-6 bg-[#111010] text-white">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#C8F135] to-[#4ECDC4] flex items-center justify-center text-[#111010] font-display font-black text-4xl flex-shrink-0">S</div>
              <div>
                <p className="text-white/50 text-sm mb-1">Hi there, I'm</p>
                <h2 className="font-display font-black text-4xl mb-3">{device === 'Mobile' ? 'Sarvesh' : 'Sarvesh Mishra'}</h2>
                <button className="bg-white text-[#111010] px-5 py-2.5 rounded-full font-display font-bold text-sm mr-3">Get Started</button>
                <span className="text-white/40 text-sm">🇮🇳 India</span>
              </div>
            </div>
            {/* Work section placeholder */}
            <div className="p-6 border-b border-[#E2DDD6]">
              <p className="text-xs text-[#6B6760] font-display font-bold uppercase tracking-wider mb-2">Videos I've created</p>
              <h3 className="font-display font-black text-2xl text-[#111010] mb-4">My Work</h3>
              <div className="bg-[#F5F0E8] rounded-2xl h-24 flex items-center justify-center text-[#6B6760] text-sm font-body border-2 border-dashed border-[#E2DDD6]">
                No videos yet — upload your first!
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs text-[#6B6760] font-display font-bold uppercase tracking-wider mb-2">My Rates</p>
              <h3 className="font-display font-black text-2xl text-[#111010] mb-2">How I help you make great content</h3>
              <p className="text-[#6B6760] text-sm font-body">No services set. Add your rates to attract brands.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CHECKLIST MODAL */}
      {showChecklist && (
        <div className="fixed inset-0 bg-[#111010]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e3a5f] rounded-3xl p-8 max-w-sm w-full text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="font-display font-black text-xl">Portfolio Setup</h3>
                <span className="bg-[#C8F135] text-[#111010] text-xs font-display font-black px-2 py-0.5 rounded-full">Level 1</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50 font-display font-bold">
                2/6
                <button onClick={() => setShowChecklist(false)} className="ml-2 text-white/50 hover:text-white transition-colors text-lg">×</button>
              </div>
            </div>
            {/* Progress */}
            <div className="h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-[#C8F135] rounded-full" style={{ width: '33%' }} />
            </div>
            <p className="text-white/50 text-xs mb-4 font-body">33% complete</p>
            {/* Tabs */}
            <div className="flex gap-4 mb-6 text-sm">
              <span className="font-display font-bold text-white">To do · 4</span>
              <span className="font-display font-bold text-white/40">Done · 2</span>
            </div>
            {/* Items */}
            <div className="space-y-3">
              {[
                { label: 'Upload a video', sub: 'Show off your best content' },
                { label: 'Add a social link', sub: 'Instagram, TikTok, YouTube — link them up' },
                { label: 'Customise your colour palette', sub: 'Make your portfolio uniquely yours' },
                { label: 'Change your hero font', sub: 'Typography makes a big difference' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 bg-white/10 rounded-2xl p-4">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-display font-bold text-sm">{item.label}</p>
                    <p className="text-white/50 text-xs font-body">{item.sub}</p>
                  </div>
                  <button className="bg-[#C8F135] text-[#111010] text-xs px-3 py-1.5 rounded-full font-display font-black hover:bg-white transition-all">
                    Go →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}