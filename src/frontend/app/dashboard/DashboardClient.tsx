'use client'

import { useState } from 'react'
import { Award, Sparkles, Search, User } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import MatchesPanel from '@/components/dashboard/MatchesPanel'
import ScholarshipsPanel from '@/components/dashboard/ScholarshipsPanel'
import ProfilePanel from '@/components/dashboard/ProfilePanel'
import { GlowNav } from '@/components/ui/glow-nav'

const slides = [
  { name: 'Matches', icon: Sparkles },
  { name: 'Scholarships', icon: Search },
  { name: 'Profile', icon: User },
]

export default function DashboardClient({ user }: { user: any }) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative h-screen overflow-hidden">
        <Link
          href="/"
          className="absolute left-6 top-6 z-30 inline-flex items-center gap-2 rounded-full p-2 text-foreground hover:text-foreground/80 transition-colors"
          aria-label="Back to landing page"
        >
          <Award className="h-6 w-6" />
          <span className="text-lg font-light tracking-tight">Grantly.</span>
        </Link>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            className="w-screen h-full px-4 sm:px-6 lg:px-8 pb-24 pt-16"
            initial={{ opacity: 0, x: activeIndex > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeIndex > 0 ? -40 : 40 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <div className="max-w-7xl mx-auto h-full">
              {activeIndex === 0 && <MatchesPanel />}
              {activeIndex === 1 && <ScholarshipsPanel />}
              {activeIndex === 2 && <ProfilePanel />}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <GlowNav
        items={slides.map((slide, index) => ({
          name: slide.name,
          url: `#slide-${index}`,
          icon: slide.icon,
        }))}
        onSelect={(name) => {
          const nextIndex = slides.findIndex((slide) => slide.name === name)
          if (nextIndex >= 0) {
            setActiveIndex(nextIndex)
          }
        }}
      />
    </div>
  )
}
