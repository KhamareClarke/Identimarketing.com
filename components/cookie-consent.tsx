"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export default function CookieConsent() {
  const [open, setOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("cookieConsent")
    }
    return true
  })

  function acceptCookies() {
    localStorage.setItem("cookieConsent", "true")
    setOpen(false)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.35 }}
        className="fixed bottom-0 left-0 w-full z-[100] bg-white/95 dark:bg-background/95 shadow-2xl border-t border-gray-200 px-4 py-4 flex flex-col sm:flex-row gap-4 items-center justify-center"
        style={{borderRadius:0}}
        role="dialog"
        aria-live="polite"
      >
        <span className="flex-1 text-gray-900 dark:text-white text-base">
          We use cookies to enhance your experience, personalize content, and analyze traffic. By clicking <b>Accept</b>, you agree to our use of cookies as described in our{' '}
          <a href="/privacy-policy" className="underline font-semibold text-primary hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-primary transition" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
        </span>
        <Button
          size="lg"
          className="rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white font-bold shadow hover:scale-105 transition"
          onClick={acceptCookies}
        >
          Accept
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}
