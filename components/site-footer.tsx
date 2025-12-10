"use client"

import Link from "next/link"
import { ArrowUp, Mail, Phone } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function SiteFooter() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Subscribed!",
        description: "You've been added to our newsletter.",
      })
      setEmail("")
      setIsSubmitting(false)
    }, 1000)
  }
  return (
    <footer className="relative bg-background text-foreground py-16 sm:py-20 mt-16 sm:mt-20 border-t-4 border-t-transparent" style={{borderImage: 'linear-gradient(to right, #ec4899, #3b82f6, #22d3ee) 1'}}>
      <div className="max-w-[90rem] mx-auto px-8 sm:px-12 lg:px-16">
        <div className="w-full flex flex-col md:flex-row justify-between items-start gap-12 pb-10 border-b border-gray-800">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-blue-500/10 to-green-400/10 opacity-90 rounded-2xl pointer-events-none"></div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-gradient-to-r from-pink-500 via-blue-500 to-green-400 opacity-60 animate-pulse-slow pointer-events-none"></div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            <div className="flex flex-col items-start max-w-sm gap-3">
              <div className="flex items-center gap-3">
  <img src="/logo.png" alt="IdentiMarketing Logo" className="w-10 h-10 object-contain" />
  <span className="text-2xl sm:text-3xl font-black tracking-tight font-heading bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">IdentiMarketing</span>
</div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">SEO & digital marketing for ambitious UK & US brands. Trusted by industry leaders.</p>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">Want more tips? <a href="https://calendly.com/khamareclarke" target="_blank" rel="noopener noreferrer" className="underline font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 hover:opacity-80 transition">Join our newsletter</a> for exclusive marketing strategies & growth hacks.</p>
              <a href="https://calendly.com/khamareclarke" target="_blank" rel="noopener noreferrer" className="mt-6 mb-3 inline-block px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all text-base">Book Your Free Strategy Call</a>
              <div className="flex space-x-4 mt-3">
                <a href="#" aria-label="Facebook" className="p-2 rounded-full bg-gradient-to-br from-pink-500 via-blue-500 to-green-400 text-white shadow-md hover:opacity-90 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="#" aria-label="Twitter" className="p-2 rounded-full bg-gradient-to-br from-pink-500 via-blue-500 to-green-400 text-white shadow-md hover:opacity-90 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </a>
                <a href="#" aria-label="Instagram" className="p-2 rounded-full bg-gradient-to-br from-pink-500 via-blue-500 to-green-400 text-white shadow-md hover:opacity-90 transition-colors">
                  {/* Instagram icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="#" aria-label="LinkedIn" className="p-2 rounded-full bg-gradient-to-br from-pink-500 via-blue-500 to-green-400 text-white shadow-md hover:opacity-90 transition-colors">
                  {/* LinkedIn icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3">
              <h4 className="font-semibold text-lg mb-5 text-white">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <span className="mr-1.5 sm:mr-2">→</span> About Us
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <span className="mr-1.5 sm:mr-2">→</span> Services
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <span className="mr-1.5 sm:mr-2">→</span> Blog
                  </Link>
                </li>
                <li>
                  <Link href="/#testimonials" className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <span className="mr-1.5 sm:mr-2">→</span> Testimonials
                  </Link>
                </li>
                <li>
                  <Link href="/#locations" className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <span className="mr-1.5 sm:mr-2">→</span> Areas We Cover
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <span className="mr-1.5 sm:mr-2">→</span> Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-start gap-3">
              <h4 className="font-semibold text-lg mb-5 text-white">Contact</h4>
              <span className="text-sm sm:text-base text-gray-400 flex items-center"><Mail className="inline w-5 h-5 mr-3 text-blue-400" /> info@identimarketing.com</span>
              <span className="text-sm sm:text-base text-gray-400 flex items-center"><Phone className="inline w-5 h-5 mr-3 text-blue-400" /> +44 1234 567890</span>
              <p className="text-sm sm:text-base text-gray-400 mt-3">Questions? <Link href="/contact" className="text-blue-400 hover:underline">Contact our team</Link></p>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
            2025 Identimarketing. All rights reserved. | 
            <Link href="/privacy-policy" className="hover:text-primary transition-colors"> Privacy Policy</Link> | 
            <Link href="/terms-conditions" className="hover:text-primary transition-colors"> Terms & Conditions</Link>
          </p>
          <button onClick={scrollToTop} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-all">
            <ArrowUp className="h-4 w-4" />
            <span className="sr-only">Back to top</span>
          </button>
        </div>
      </div>
    </footer>
  );
}