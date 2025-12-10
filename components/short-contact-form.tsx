"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Send } from "lucide-react"

export default function ShortContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setSubmitted(true)
      setLoading(false)
    }, 1000)
  }

  if (submitted) {
    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="p-8 rounded-2xl bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-center shadow-xl">
        <h3 className="text-xl font-bold mb-2">Thank you!</h3>
        <p>We’ve received your message and will get back to you soon.</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/80 dark:bg-background/80 shadow-xl flex flex-col gap-4 max-w-lg w-full mx-auto">
      <h3 className="text-2xl font-extrabold mb-2 text-primary">Quick Contact</h3>
      <input
        name="name"
        type="text"
        required
        placeholder="Your Name"
        value={form.name}
        onChange={handleChange}
        className="rounded-lg border border-gray-200 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Your Email"
        value={form.email}
        onChange={handleChange}
        className="rounded-lg border border-gray-200 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <textarea
        name="message"
        required
        placeholder="How can we help you?"
        value={form.message}
        onChange={handleChange}
        className="rounded-lg border border-gray-200 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
      />
      <Button
        type="submit"
        size="lg"
        className="w-full rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white font-extrabold text-lg shadow-lg hover:scale-105 transition"
        disabled={loading}
      >
        {loading ? 'Sending...' : (<span className="flex items-center justify-center gap-2">Send <Send className="w-5 h-5" /></span>)}
      </Button>
    </form>
  )
}
