"use client"

import { useState } from "react"
import OnboardingForm from "@/components/onboarding/OnboardingForm"

export default function OnboardClient({
  defaultValues,
}: {
  defaultValues: Record<string, unknown>
}) {
  const [showForm, setShowForm] = useState(false)

  if (!showForm) {
    return (
      <div className="w-full flex flex-col items-center text-center gap-8 py-12">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white">
          Help us, help you...
        </h1>
        <p className="text-white/70 text-base sm:text-lg lg:text-xl max-w-2xl">
          Fill out some questions to tailor your experience.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-full bg-[#1f1f1f] text-[#7a7a7a] px-12 py-4 text-lg font-medium shadow-[0_10px_25px_rgba(0,0,0,0.45)] transition-all duration-200 hover:text-white hover:scale-105"
        >
          Continue
        </button>
      </div>
    )
  }

  return <OnboardingForm defaultValues={defaultValues} onBack={() => setShowForm(false)} />
}
