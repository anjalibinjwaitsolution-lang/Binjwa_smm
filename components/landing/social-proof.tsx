"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    quote: "I used to spend a full afternoon writing captions for every platform. Now it's maybe 20 minutes, and honestly Binjwa's suggestions sound more 'on-brand' than some of my own drafts did.",
    author: "Sarah Chen",
    role: "Marketing Director",
    company: "TechFlow",
    avatar: "/professional-woman-diverse.png",
  },
  {
    quote: "The multi-platform posting is the real win for us. One idea in, multiple formats out—straight to Instagram, TikTok, Threads, and WhatsApp. Our engagement's up 150% since we started.",
    author: "Marcus Johnson",
    role: "Social Media Manager",
    company: "GrowthLabs",
    avatar: "/professional-man.jpg",
  },
  {
    quote: "Running an agency means every client wants their own look. White-labeling this made it feel like our own tool, not a plugin.",
    author: "Emily Rodriguez",
    role: "Agency Owner",
    company: "Creative Spark",
    avatar: "/professional-woman-2.png",
  },
]

const companies = ["TechFlow", "GrowthLabs", "Creative Spark", "InnovateCo", "BrandWorks", "Digital Edge"]

export function LandingSocialProof() {
  return (
    <section className="py-24 px-6 bg-background-subtle">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 overflow-hidden">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }}
            viewport={{ once: true, amount: 0.5 }}
            className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4"
          >
            Real Teams, Real Time Saved
          </motion.h2>
        </div>

        {/* Company logos */}
        <div className="flex flex-wrap items-center justify-center gap-12 mb-20 opacity-50">
          {companies.map((company, index) => (
            <motion.div 
              key={company} 
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.5, duration: 0.6, delay: 0.2 + index * 0.1 } }}
              viewport={{ once: true }}
              className="text-2xl font-heading font-bold text-foreground-muted"
            >
              {company}
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => {
            const isLeft = index === 0;
            const isCenter = index === 1;

            const initialTransform = isCenter 
              ? { opacity: 0, scale: 0.5 }
              : isLeft 
                ? { opacity: 0, x: -200, rotateY: -30 }
                : { opacity: 0, x: 200, rotateY: 30 };

            const whileInView = isCenter
              ? { opacity: 1, scale: 1, transition: { duration: 0.6, delay: 0.6, ease: "backOut" } }
              : { opacity: 1, x: 0, rotateY: 0, transition: { type: "spring", bounce: 0.4, duration: 0.8, delay: 0.8 } };

            return (
              <motion.div 
                key={index} 
                initial={initialTransform}
                whileInView={whileInView as any}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.03, 
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  transition: { duration: 0.3, ease: "easeInOut" }
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-background rounded-xl p-6 shadow-md"
              >
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={testimonial.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-foreground-muted">{testimonial.role}</div>
                  <div className="text-sm text-primary">{testimonial.company}</div>
                </div>
              </div>
              <p className="text-foreground-muted leading-relaxed">"{testimonial.quote}"</p>
            </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
