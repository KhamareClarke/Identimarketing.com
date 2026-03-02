"use client"

import React, { createContext, useContext, useState } from "react"
import { OnboardingForm } from "@/components/onboarding-form"

type OnboardingContextType = {
  openOnboarding: boolean
  setOpenOnboarding: (open: boolean) => void
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider")
  return ctx
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [openOnboarding, setOpenOnboarding] = useState(false)

  return (
    <OnboardingContext.Provider value={{ openOnboarding, setOpenOnboarding }}>
      {children}
      <OnboardingForm
        isOpen={openOnboarding}
        onClose={() => setOpenOnboarding(false)}
        title="Get started"
        subtitle="Tell us a bit about you and we'll get back within 24 hours."
      />
    </OnboardingContext.Provider>
  )
}
