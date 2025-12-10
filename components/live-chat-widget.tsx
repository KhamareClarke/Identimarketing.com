"use client"
import { useEffect, useRef, useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const BOT_NAME = "Identi AI Concierge"

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! 👋 How can I help you grow your business today?' }
  ])
  const [input, setInput] = useState("")
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, open])

  function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!input.trim()) return
    setMessages([...messages, { from: 'user', text: input }])
    setTimeout(() => {
      setMessages(msgs => [...msgs, { from: 'bot', text: 'Thanks for your message! A team member will reply shortly.' }])
    }, 700)
    setInput("")
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {!open && (
          <motion.button
            key="open"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white rounded-full shadow-lg p-4 flex items-center gap-2 hover:scale-110 transition"
            onClick={() => setOpen(true)}
            aria-label="Open live chat"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="font-bold">Live Chat</span>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="w-80 max-w-xs bg-white/95 dark:bg-background/95 rounded-2xl shadow-2xl border border-white/30 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white">
              <span className="font-bold text-base">{BOT_NAME}</span>
              <button onClick={() => setOpen(false)} aria-label="Close chat">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div ref={chatRef} className="flex-1 px-4 py-3 overflow-y-auto max-h-60 text-sm space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 max-w-[85%] ${msg.from === 'bot' ? 'bg-blue-100 text-blue-900 self-start' : 'bg-green-100 text-green-900 self-end ml-auto'}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-gray-200">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-full px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white font-bold rounded-full px-4 py-2 hover:scale-105 transition"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
