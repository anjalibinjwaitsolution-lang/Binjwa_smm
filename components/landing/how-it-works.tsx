"use client"

import { useRef } from "react"
import { motion, useScroll } from "framer-motion"

const steps = [
  {
    number: 1,
    title: "Show Us Your Brand",
    description: "Upload your logo, colors, and voice guidelines. We learn what makes you unique.",
  },
  {
    number: 2,
    title: "Let Binjwa Take a Swing",
    description: "Our AI generates complete, on-brand posts for all your platforms in seconds.",
  },
  {
    number: 3,
    title: "Make It Yours",
    description: "Review, tweak, or regenerate instantly until it's exactly how you want it.",
  },
  {
    number: 4,
    title: "Send It Everywhere",
    description: "Publish immediately or schedule ahead to Instagram, Facebook, TikTok, Threads, WhatsApp, LinkedIn, and more.",
  },
  {
    number: 5,
    title: "Track & Engage",
    description: "Monitor your performance and respond to your audience from one centralized dashboard.",
  },
]

export function LandingHowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Track scroll progress within the timeline container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  })

  return (
    <section id="how-it-works" className="py-32 px-6 overflow-hidden bg-background">
      <div className="max-w-6xl mx-auto">
        
        {/* Headline */}
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            From Idea to Published Post — 5 Steps
          </motion.h2>
        </div>

        {/* Timeline Container */}
        <div ref={containerRef} className="relative max-w-4xl mx-auto py-10">
          
          {/* Central Vertical Line (Background) */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-gray-800 md:-translate-x-1/2 rounded-full" />
          
          {/* Central Vertical Line (Progress Fill) */}
          <motion.div 
            className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-[#f97316] md:-translate-x-1/2 origin-top rounded-full z-10"
            style={{ scaleY: scrollYProgress }}
          />

          <div className="relative z-20 flex flex-col gap-12 md:gap-24">
            {steps.map((step, index) => {
              const isEven = index % 2 !== 0 
              const alignLeft = !isEven

              return (
                <div key={step.number} className={`flex items-center w-full ${alignLeft ? 'md:justify-start' : 'md:justify-end'} justify-end relative`}>
                  
                  {/* The Node (Circle) */}
                  <div className="absolute left-6 md:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                    <motion.div
                      initial={{ scale: 1, backgroundColor: "#1f2937", color: "#9ca3af" }}
                      whileInView={{ scale: 1.2, backgroundColor: "#f97316", color: "#ffffff" }}
                      viewport={{ once: false, margin: "-45% 0px -45% 0px" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-4 border-background"
                    >
                      {step.number}
                    </motion.div>
                  </div>

                  {/* The Card */}
                  <div className={`w-full md:w-[45%] pl-16 md:pl-0`}>
                    <motion.div 
                      initial={{ opacity: 0, x: alignLeft ? -100 : 100 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: false, margin: "-40% 0px -40% 0px" }}
                      transition={{ duration: 0.6, ease: "backOut" }}
                      whileHover={{ 
                        y: -5, 
                        borderColor: "#f97316",
                        transition: { duration: 0.2 }
                      }}
                      className="bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800 transition-colors duration-300 relative z-20"
                    >
                      {/* Orange Popup Callout */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
                        transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                        className="absolute -top-7 left-8 bg-[#f97316] text-white px-3 py-1.5 rounded-lg shadow-[0_4px_15px_rgba(249,115,22,0.3)] text-xs font-bold uppercase tracking-wider z-30"
                      >
                        {step.title}
                        <div className="absolute -bottom-1 left-4 w-2.5 h-2.5 bg-[#f97316] rotate-45 rounded-sm" />
                      </motion.div>

                      <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{step.description}</p>
                    </motion.div>
                  </div>

                </div>
              )
            })}
          </div>
        </div>
        
      </div>
    </section>
  )
}
