"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingNavbarItem {
  name: string
  icon?: LucideIcon
  onClick?: () => void
}

interface FloatingNavbarProps {
  items: FloatingNavbarItem[]
  activeIndex?: number
  className?: string
}

export function FloatingNavbar({ items, activeIndex = 0, className }: FloatingNavbarProps) {
  const navRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const activeButton = nav.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement
    if (!activeButton) return

    const navRect = nav.getBoundingClientRect()
    const buttonRect = activeButton.getBoundingClientRect()
    const offsetLeft = buttonRect.left - navRect.left
    const buttonWidth = buttonRect.width

    nav.style.setProperty("--active-position", `${offsetLeft}px`)
    nav.style.setProperty("--active-width", `${buttonWidth}px`)
  }, [activeIndex])

  return (
    <div className={cn("fixed bottom-6 left-0 right-0 flex justify-center z-50", className)}>
      <nav
        ref={navRef}
        className="floating-navbar flex items-center justify-center space-x-4 rounded-full border border-gold-500/30 bg-background/80 backdrop-blur-lg p-2 shadow-lg relative overflow-hidden"
      >
        {/* Gold gradient background for active item */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-b from-gold-500/20 via-gold-500/15 to-gold-500/10 rounded-full transition-all duration-300 ease-out pointer-events-none"
          style={{
            width: "var(--active-width, 0px)",
            transform: "translateX(var(--active-position, 0px))",
          }}
        />
        
        {/* Radial glow effect */}
        <div
          className="absolute left-0 top-0 h-full rounded-full pointer-events-none opacity-60 blur-xl transition-all duration-300 ease-out"
          style={{
            width: "var(--active-width, 0px)",
            transform: "translateX(calc(var(--active-position, 0px) + var(--active-width, 0px) / 2))",
            background: "radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%)",
            marginLeft: "calc(var(--active-width, 0px) / -2)",
          }}
        />

        {items.map((item, index) => {
          const Icon = item.icon
          const isActive = index === activeIndex
          
          return (
            <Button
              key={item.name}
              data-index={index}
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full transition-all duration-300 relative z-10",
                isActive
                  ? "text-gold-500"
                  : "text-foreground/70 hover:text-gold-500/80"
              )}
              onClick={item.onClick}
              aria-label={item.name}
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span className="sr-only">{item.name}</span>
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
