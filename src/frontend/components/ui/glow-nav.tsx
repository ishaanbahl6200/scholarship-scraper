"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlowNavItem {
  name: string;
  icon?: LucideIcon;
}

interface GlowNavProps {
  items: GlowNavItem[];
  className?: string;
  onSelect?: (name: string) => void;
}

function inverseMousePosition(element: HTMLElement, event: MouseEvent) {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  return {
    x1: -(x - centerX) / 20,
    y1: -(y - centerY) / 20,
  };
}

export function GlowNav({ items, className, onSelect }: GlowNavProps) {
  const navRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const setActiveStyles = (index: number) => {
    const nav = navRef.current;
    if (!nav) return;
    const listItems = nav.querySelectorAll("li");
    const target = listItems[index] as HTMLElement | undefined;
    if (!target) return;
    listItems.forEach((li) => li.classList.remove("active"));
    target.classList.add("active");

    const width = target.offsetWidth;
    const { left } = target.getBoundingClientRect();
    const navLeft = nav.getBoundingClientRect().left;
    const offsetLeft = left - navLeft;

    nav.style.setProperty("--after-bg-position", `${offsetLeft}`);
    nav.style.setProperty("--after-radial-bg-position", `${offsetLeft + width / 2}`);
    nav.style.setProperty("--after-bg-width", `${width}`);
  };

  useEffect(() => {
    setActiveStyles(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    const handleResize = () => setActiveStyles(activeIndex);
    window.addEventListener("resize", handleResize);
    window.addEventListener("DOMContentLoaded", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("DOMContentLoaded", handleResize);
    };
  }, [activeIndex]);

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const nav = navRef.current;
    if (!nav) return;
    const tilt = inverseMousePosition(event.currentTarget, event.nativeEvent);
    nav.style.setProperty("--tilt-bg-y", `${tilt.x1 * 2}`);
    nav.style.setProperty("--tilt-bg-x", `${tilt.y1 * 2}`);
  };

  const handleSelect = (index: number) => {
    setActiveIndex(index);
    onSelect?.(items[index].name);
  };

  return (
    <div
      ref={navRef}
      className={cn(
        "glow-nav fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-6 bg-background/80 backdrop-blur-lg border border-gold-500/30 shadow-lg",
        className,
      )}
    >
      <ul>
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={item.name} className={index === activeIndex ? "active" : ""}>
              <button
                type="button"
                onClick={() => handleSelect(index)}
                onMouseMove={handleMouseMove}
              >
                {Icon ? <Icon size={22} strokeWidth={2.25} /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
