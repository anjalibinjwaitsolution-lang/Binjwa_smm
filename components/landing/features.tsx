"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, ChevronDown, Image as ImageIcon, Smile, MapPin, Send, MoreHorizontal, ArrowUpRight, ArrowDownRight, Bell, Users, BarChart2, MessageSquare } from "lucide-react"

export function LandingFeatures() {
  const [activeIndex, setActiveIndex] = useState(0)
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = sectionsRef.current.findIndex(el => el === entry.target)
          if (index !== -1) setActiveIndex(index)
        }
      })
    }

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-45% 0px -45% 0px", // Triggers when the element crosses the middle of the screen
      threshold: 0
    })

    sectionsRef.current.forEach(section => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  const featuresData = [
    {
      title: "It Actually Sounds Like You",
      desc: "Binjwa learns your voice and values over time, so posts don't read like they came from a robot.",
      list: []
    },
    {
      title: "One Post, Every Platform",
      desc: "Write once, publish to Instagram, Facebook, LinkedIn, X, TikTok, Threads, Pinterest, WhatsApp, Bluesky, and YouTube — formatted right for each.",
      list: []
    },
    {
      title: "Your Brand, Kept Consistent",
      desc: "Colors, fonts, and tone stay locked in, even when five people on your team are posting.",
      list: []
    },
    {
      title: "Make It Look Like Yours",
      desc: "White-label it into your own platform, or use it standalone — your call.",
      list: []
    },
    {
      title: "Post When People Are Actually Looking",
      desc: "Binjwa predicts the best times to post for each platform, automatically.",
      list: []
    },
    {
      title: "See What's Actually Working",
      desc: "All your analytics, across every channel, in one dashboard — no more tab-switching.",
      list: []
    }
  ]

  const Mockups = [CalendarMockup, ComposerMockup, AnalyticsMockup, EngageMockup, ListeningMockup]
  const ActiveMockup = Mockups[activeIndex % Mockups.length]

  return (
    <section id="features" className="bg-[#0D0D0D] relative pt-24">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center overflow-hidden">
        <h2 className="text-2xl sm:text-3xl lg:text-[42px] xl:text-5xl font-extrabold text-white tracking-tight leading-tight whitespace-nowrap">
          Why Teams Actually Stick With Binjwa
        </h2>
      </div>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row">
          
          {/* LEFT: Sticky Viewport for Image (50%) */}
          <div className="lg:w-1/2 lg:sticky lg:top-0 lg:h-screen flex items-center justify-center py-12 lg:py-0 pr-0 lg:pr-12">
            <div 
              key={activeIndex} 
              className="w-full relative animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
            >
              <ActiveMockup />
            </div>
          </div>

          {/* RIGHT: Scrolling Content (50%) */}
          <div className="lg:w-1/2 py-[20vh] space-y-[40vh] pb-[30vh]">
            {featuresData.map((feature, i) => (
              <div 
                key={i} 
                ref={(el) => {
                  sectionsRef.current[i] = el
                }}
                className={`space-y-6 transition-all duration-700 ${activeIndex === i ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-8'}`}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">{feature.title}</h2>
                <p className="text-lg text-[#E5E5E5] leading-relaxed">{feature.desc}</p>
                <ul className="space-y-4 pt-2">
                  {feature.list.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-[#F16522] flex-shrink-0 mt-0.5" />
                      <span className="text-[#A3A3A3] font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

// --- Layout Wrapper ---
const LaptopFrame = ({ children, badgeText }: { children: React.ReactNode, badgeText: string }) => (
  <div className="mx-auto w-full max-w-2xl transform transition-transform hover:scale-[1.02] duration-500 relative">
    
    {/* Floating Pill Badge */}
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F16522] text-white font-bold px-6 py-1.5 rounded-full text-xs shadow-lg z-30 tracking-wide border-2 border-[#1C1C1E]">
      {badgeText}
    </div>

    {/* Screen */}
    <div className="relative rounded-t-2xl border-[10px] border-[#1C1C1E] bg-[#1C1C1E] overflow-hidden shadow-2xl">
      {/* Webcam dot */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#000000] z-20 shadow-inner"></div>
      
      <div className="relative bg-[#09090B] w-full aspect-[16/10] overflow-hidden rounded-sm flex flex-col">
        {/* Fake Browser Header */}
        <div className="bg-[#18181B] border-b border-[#27272A] h-8 flex items-center px-3 gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
          </div>
          <div className="mx-auto bg-[#27272A] border border-[#3F3F46] rounded text-[9px] text-center text-[#A1A1AA] px-16 py-0.5 font-medium flex items-center gap-1">
            binjwa-smm.app
          </div>
        </div>
        {/* App Content */}
        <div className="flex-1 bg-[#09090B] relative overflow-hidden">
          {children}
        </div>
      </div>
    </div>
    {/* Base */}
    <div className="relative h-4 w-full bg-[#27272A] rounded-b-2xl shadow-xl border-t border-[#3F3F46]">
      <div className="absolute inset-x-1/3 top-0 h-1 bg-[#3F3F46] rounded-b-md"></div>
    </div>
  </div>
)

// --- Mockup Components ---

function CalendarMockup() {
  return (
    <LaptopFrame badgeText="Calendar">
      <div className="flex flex-col h-full bg-[#09090B] text-white">
        <div className="border-b border-[#27272A] px-4 py-3 flex justify-between items-center bg-[#18181B]/50">
          <div className="font-semibold text-white text-sm">Content Calendar</div>
          <div className="flex gap-2">
            <div className="px-3 py-1.5 text-xs font-medium bg-[#18181B] border border-[#27272A] rounded-md text-[#A1A1AA] shadow-sm hover:bg-[#27272A] transition-colors">Filter</div>
            <div className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-md flex items-center gap-1 shadow-[0_0_15px_rgba(234,88,12,0.4)] hover:bg-orange-500 cursor-pointer transition-all">
              Create new post <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-px bg-[#27272A] flex-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
            <div key={day} className="bg-[#09090B] p-2 text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider text-center border-b border-[#27272A]">{day}</div>
          ))}
          {Array.from({length: 10}).map((_, i) => (
            <div key={i} className="bg-[#09090B] min-h-[90px] p-2 relative group hover:bg-[#18181B] transition-colors">
              <span className="text-[10px] text-[#52525B] font-medium">{i + 12}</span>
              {i === 2 && <div className="mt-1 p-1.5 bg-orange-900/40 border border-orange-500/30 rounded-md text-[9px] text-orange-400 truncate font-semibold shadow-sm">LinkedIn: Q3 Report</div>}
              {i === 4 && <div className="mt-1 p-1.5 bg-purple-900/40 border border-purple-500/30 rounded-md text-[9px] text-purple-400 truncate font-semibold shadow-sm">IG: Office Culture</div>}
              {i === 7 && <div className="mt-1 p-1.5 bg-cyan-900/40 border border-cyan-500/30 rounded-md text-[9px] text-cyan-400 truncate font-semibold shadow-sm">Twitter: Thread</div>}
            </div>
          ))}
        </div>
      </div>
      
      {/* Floating Menu Overlay */}
      <div className="absolute top-12 right-6 w-40 bg-[#18181B] rounded-lg shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] border border-[#27272A] p-1.5 z-10 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="px-3 py-1.5 text-xs text-[#52525B] font-bold uppercase tracking-wider mb-1">Views</div>
        {['All Posts', 'Scheduled', 'Queue', 'Sponsored', 'Recycle'].map((item, i) => (
          <div key={i} className="px-3 py-1.5 text-xs text-[#E4E4E7] hover:bg-[#27272A] hover:text-white rounded-md cursor-pointer transition-colors font-medium">
            {item}
          </div>
        ))}
      </div>
    </LaptopFrame>
  )
}

function ComposerMockup() {
  return (
    <LaptopFrame badgeText="Publish Now">
      <div className="w-full h-full bg-[#09090B] flex overflow-hidden">
        {/* Sidebar Networks */}
        <div className="w-14 bg-[#18181B] border-r border-[#27272A] flex flex-col items-center py-5 gap-4">
          <div className="w-8 h-8 rounded-full bg-orange-900/50 text-orange-400 flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-orange-500 ring-offset-1 ring-offset-[#09090B] cursor-pointer">in</div>
          <div className="w-8 h-8 rounded-full bg-[#27272A] text-[#A1A1AA] flex items-center justify-center text-xs font-bold hover:bg-[#3F3F46] cursor-pointer transition-colors">ig</div>
          <div className="w-8 h-8 rounded-full bg-[#27272A] text-[#A1A1AA] flex items-center justify-center text-xs font-bold hover:bg-[#3F3F46] cursor-pointer transition-colors">tw</div>
        </div>
        {/* Editor */}
        <div className="flex-1 p-5 flex flex-col bg-[#09090B]">
          <div className="text-xs font-bold text-[#E4E4E7] mb-3">Composer Workspace</div>
          <div className="flex-1 border border-[#27272A] rounded-lg p-3 text-sm text-[#A1A1AA] focus-within:border-orange-500 transition-colors bg-[#18181B] shadow-inner">
            Excited to announce our new enterprise features! 🚀 Check out the link below and let us know what you think. #SaaS #Growth
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-3 text-[#52525B]">
              <ImageIcon className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              <Smile className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
              <MapPin className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
            </div>
            <button className="bg-orange-600 text-white px-5 py-2 rounded-md text-xs font-bold shadow-[0_0_15px_rgba(234,88,12,0.4)] hover:bg-orange-500 transition-all">
              Publish Now
            </button>
          </div>
        </div>
        {/* Preview Panel */}
        <div className="w-[40%] bg-[#18181B]/50 border-l border-[#27272A] p-5 hidden sm:block">
          <div className="text-[10px] font-bold text-[#71717A] tracking-widest uppercase mb-3 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div> Live Preview
          </div>
          <div className="bg-[#09090B] border border-[#27272A] rounded-xl p-4 shadow-sm relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#27272A] border border-[#3F3F46] rounded-full flex-shrink-0"></div>
              <div className="space-y-1.5 w-full">
                <div className="w-1/2 h-2.5 bg-[#3F3F46] rounded"></div>
                <div className="w-1/3 h-2 bg-[#27272A] rounded"></div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="w-full h-2 bg-[#27272A] rounded"></div>
              <div className="w-4/5 h-2 bg-[#27272A] rounded"></div>
              <div className="w-full h-20 bg-[#18181B] border border-[#27272A] rounded-lg mt-3 flex items-center justify-center text-[#3F3F46]">
                <ImageIcon className="w-6 h-6 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </LaptopFrame>
  )
}

function AnalyticsMockup() {
  return (
    <LaptopFrame badgeText="Analytics">
      <div className="p-5 h-full bg-[#09090B] flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Audience", val: "45.2K", inc: true, pct: "12%" },
            { label: "Engagement", val: "12.8%", inc: true, pct: "4.3%" },
            { label: "Total Views", val: "1.2M", inc: true, pct: "8.2%" },
          ].map((stat, i) => (
            <div key={i} className="bg-[#18181B] p-3.5 rounded-xl border border-[#27272A] hover:border-[#3F3F46] transition-colors">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#71717A] mb-1">{stat.label}</div>
              <div className="text-xl font-extrabold text-white">{stat.val}</div>
              <div className={`text-[10px] font-bold mt-1.5 flex items-center ${stat.inc ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stat.inc ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {stat.pct} vs last month
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[#18181B] p-5 rounded-xl border border-[#27272A] flex-1 flex flex-col relative overflow-hidden">
          {/* Subtle neon glow for chart background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-600 rounded-full blur-[60px] opacity-20"></div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-orange-400" /> Performance Vectors
            </div>
            <div className="text-[9px] font-bold px-2 py-1 bg-[#27272A] rounded-md text-[#A1A1AA] uppercase tracking-wider border border-[#3F3F46]">GA4 Synced</div>
          </div>
          <div className="flex-1 relative flex items-end justify-between px-2 gap-1.5 z-10">
            {/* Glowing lines in background for style */}
            <div className="absolute inset-0 border-b border-dashed border-[#3F3F46] opacity-30 bottom-[25%] pointer-events-none"></div>
            <div className="absolute inset-0 border-b border-dashed border-[#3F3F46] opacity-30 bottom-[50%] pointer-events-none"></div>
            <div className="absolute inset-0 border-b border-dashed border-[#3F3F46] opacity-30 bottom-[75%] pointer-events-none"></div>

            {[30, 45, 60, 40, 75, 55, 90, 85, 100, 70, 85].map((h, i) => (
              <div key={i} className="w-full bg-[#27272A] rounded-t relative group cursor-pointer transition-all hover:bg-orange-900/50" style={{ height: `${h}%` }}>
                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity w-full flex justify-center z-10">
                   <div className="bg-white text-black text-[9px] font-bold py-0.5 px-1.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                     {h * 10}
                   </div>
                </div>
                <div className="w-full bg-orange-500 rounded-t absolute bottom-0 left-0 transition-all group-hover:bg-orange-400 shadow-[0_-5px_15px_rgba(249,115,22,0.3)]" style={{ height: `${h * 0.6}%` }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LaptopFrame>
  )
}

function EngageMockup() {
  return (
    <LaptopFrame badgeText="Response">
      <div className="bg-[#09090B] flex h-full overflow-hidden">
        <div className="w-[35%] border-r border-[#27272A] flex flex-col bg-[#18181B]">
          <div className="p-3 border-b border-[#27272A] font-bold text-xs text-white flex justify-between items-center bg-[#09090B]">
            Unified Inbox
          </div>
          <div className="flex-1 overflow-hidden">
            {[
              { n: "Sarah Jenkins", msg: "Can I get a refund for...", active: true, time: "2m", tag: "Support" },
              { n: "David Chen", msg: "Loved the new update!", active: false, time: "1h", tag: "Feedback" },
              { n: "TechCorp", msg: "Partnership inquiry", active: false, time: "3h", tag: "Sales" }
            ].map((c, i) => (
              <div key={i} className={`p-3 border-b border-[#27272A] cursor-pointer transition-colors ${c.active ? 'bg-orange-900/20 border-l-4 border-l-orange-500' : 'hover:bg-[#27272A] border-l-4 border-l-transparent bg-[#18181B]'}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs font-bold text-white">{c.n}</div>
                  <div className="text-[9px] text-[#71717A] font-medium">{c.time}</div>
                </div>
                <div className="text-[10px] text-[#A1A1AA] truncate mb-1.5">{c.msg}</div>
                <div className={`text-[8px] uppercase tracking-wider font-bold inline-block px-1.5 py-0.5 rounded ${c.active ? 'bg-orange-900/50 text-orange-400 border border-orange-800' : 'bg-[#27272A] text-[#71717A] border border-[#3F3F46]'}`}>{c.tag}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-[#09090B]">
          <div className="p-3 border-b border-[#27272A] flex items-center justify-between bg-[#09090B] z-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2">
              <div className="font-bold text-xs text-white">Sarah Jenkins</div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            </div>
            <div className="text-[9px] font-bold bg-[#27272A] border border-[#3F3F46] text-[#E4E4E7] px-2 py-1 rounded">Assign Ticket</div>
          </div>
          <div className="flex-1 p-4 space-y-4 overflow-hidden bg-[#09090B]">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-purple-900/50 text-purple-400 border border-purple-800 flex items-center justify-center text-[10px] font-bold shadow-sm">SJ</div>
              <div className="bg-[#18181B] border border-[#27272A] rounded-xl rounded-tl-sm p-3 text-xs text-[#E4E4E7] shadow-sm max-w-[85%] leading-relaxed">
                Hi, I ordered the pro plan yesterday but realized I meant to get the team plan. Can I get a refund for the difference?
              </div>
            </div>
            <div className="flex items-start gap-2.5 flex-row-reverse">
                <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold shadow-[0_0_10px_rgba(234,88,12,0.4)]">AI</div>
                <div className="bg-orange-600 text-white rounded-xl rounded-tr-sm p-3 text-xs shadow-[0_0_15px_rgba(234,88,12,0.2)] max-w-[85%] leading-relaxed">
                  Of course! I can process that right now for you. Give me just a moment.
                </div>
            </div>
          </div>
          <div className="p-3 bg-[#09090B] border-t border-[#27272A]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400 mb-2 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span> Assistant drafting...
              </div>
              <div className="relative">
                <input type="text" placeholder="Review AI Draft..." className="w-full bg-[#18181B] border border-[#27272A] rounded-md py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-[#52525B]" />
                <button className="absolute right-1.5 top-1.5 p-1 bg-orange-600 rounded flex items-center justify-center text-white hover:bg-orange-500 transition-all shadow-[0_0_10px_rgba(234,88,12,0.4)]">
                  <Send className="w-3 h-3" />
                </button>
              </div>
          </div>
        </div>
      </div>
    </LaptopFrame>
  )
}

function ListeningMockup() {
  return (
    <LaptopFrame badgeText="Brand's Reputation">
      <div className="h-full bg-[#09090B] p-4 space-y-4">
        <div className="bg-[#18181B] rounded-xl border border-[#27272A] p-4 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-rose-600 rounded-full blur-[50px] opacity-20"></div>
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
              Brand Sentiment Stream
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-900/30 px-2 py-0.5 rounded border border-rose-800">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span> Live
            </div>
          </div>
          <div className="space-y-2.5 relative z-10">
            {[
              { u: "@industry_leader", text: "Binjwa SMM just released a game-changing update for teams. Worth checking out.", tag: "Positive", color: "bg-emerald-900/30 text-emerald-400 border-emerald-800" },
              { u: "@tech_reviewer", text: "Deep dive into the top 5 SMM platforms of 2026. Thread 👇", tag: "Neutral", color: "bg-[#27272A] text-[#A1A1AA] border-[#3F3F46]" }
            ].map((m, i) => (
              <div key={i} className="flex gap-3 p-3 bg-[#09090B] hover:bg-[#18181B] transition-colors rounded-lg border border-[#27272A]">
                <div className="w-7 h-7 rounded-full bg-[#27272A] border border-[#3F3F46] flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] font-extrabold text-white">{m.u}</div>
                    <div className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${m.color}`}>{m.tag}</div>
                  </div>
                  <div className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed">{m.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#18181B] rounded-xl border border-[#27272A] p-4 hover:border-[#3F3F46] transition-colors group">
              <div className="text-[9px] font-bold text-[#71717A] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider"><Bell className="w-3.5 h-3.5 text-orange-400" /> Alert Volatility</div>
              <div className="text-xl font-black text-white group-hover:text-orange-400 transition-colors">+81%</div>
              <div className="text-[10px] font-bold text-rose-400 flex items-center mt-1"><ArrowUpRight className="w-3 h-3 mr-0.5" /> High Spikes Detected</div>
          </div>
          <div className="bg-[#18181B] rounded-xl border border-[#27272A] p-4 hover:border-[#3F3F46] transition-colors group">
              <div className="text-[9px] font-bold text-[#71717A] flex items-center gap-1.5 mb-1.5 uppercase tracking-wider"><Users className="w-3.5 h-3.5 text-orange-400" /> Unique Reach</div>
              <div className="text-xl font-black text-white group-hover:text-orange-400 transition-colors">899K</div>
              <div className="text-[10px] font-bold text-emerald-400 flex items-center mt-1"><ArrowUpRight className="w-3 h-3 mr-0.5" /> Stable growth</div>
          </div>
        </div>
      </div>
    </LaptopFrame>
  )
}
