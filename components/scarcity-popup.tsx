"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap } from "lucide-react"

export default function ScarcityPopup() {
  const [open, setOpen] = useState(true)
  const [spotsLeft, setSpotsLeft] = useState(3)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSpotsLeft(Math.floor(Math.random() * 5) + 2)
  }, [])

  if (!mounted || !open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="max-w-sm w-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 shadow-2xl rounded-2xl border border-white/20 p-6 flex flex-col gap-3 text-white relative"
          role="dialog"
          aria-live="polite"
        >
        <button
          className="absolute top-3 right-3 text-white/80 hover:text-white"
          onClick={() => setOpen(false)}
          aria-label="Close popup"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-6 h-6 animate-pulse" />
          <span className="font-bold text-lg">Limited Time Offer: Only {spotsLeft} Free SEO Audits Left This Month!</span>
        </div>
        <p className="text-white/90 text-base mb-2">Secure your spot for a complimentary strategy call and get a free, expert SEO audit. See exactly how much more traffic and revenue you could be generating. Limited availability. Don't miss out!</p>
        <Button
          size="lg"
          className="w-full rounded-full bg-white text-primary font-extrabold text-lg hover:bg-blue-100 hover:text-blue-700 transition"
          asChild
        >
          <a href="https://calendly.com/khamareclarke" target="_blank" rel="noopener noreferrer">Book My Free Strategy Call</a>
        </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
// Removed extra CTA buttons and email input as requested.
