"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, Moon, Sun, LogIn, LayoutDashboard } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { cn } from "@/lib/utils"
import { useOnboarding } from "@/components/onboarding-provider"

const navItems = [
  { name: "Services", href: "/#services" },
  { name: "Testimonials", href: "/#testimonials" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/#contact" },
]

const appLinks = [
  { name: "Sign in", href: "/auth/login", icon: LogIn },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
]

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { setOpenOnboarding } = useOnboarding()

  useEffect(() => {
    setMounted(true)
    
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!mounted) return null;
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300 border-b border-transparent",
      scrolled 
        ? "bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-white/10 shadow-xl" 
        : "bg-transparent"
    )}>
      <Container size="wide" className="flex h-16 sm:h-18 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <span className="flex items-center gap-2">
            <img src="/logo.png" alt="IdentiMarketing Logo" className="w-8 h-8 object-contain" />
            <motion.span 
              className="font-bold text-xl sm:text-2xl md:text-3xl font-heading bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Identimarketing
            </motion.span>
          </span>
        </Link>
        
        <nav className="hidden md:flex gap-8 lg:gap-10 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors relative group"
            >
              {item.name}
              <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-blue-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4">
          {appLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
            >
              <link.icon className="h-4 w-4" />
              {link.name}
            </Link>
          ))}
          {mounted && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full h-10 w-10 hover:bg-foreground/5 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setOpenOnboarding(true)}
            className="group relative overflow-hidden px-8 py-6 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-sm font-extrabold shadow-xl hover:from-blue-600 hover:via-pink-500 hover:to-green-400 hover:scale-105 hover:shadow-2xl transition-all duration-200 border-0 focus:ring-4 focus:ring-blue-300"
          >
            <span className="relative z-10">Get Started</span>
          </Button>
        </div>
        <div className="flex items-center md:hidden gap-3">
          {mounted && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full h-10 w-10 hover:bg-foreground/5"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full h-10 w-10 hover:bg-foreground/5"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-5 w-5 transition-transform duration-200" />
            ) : (
              <Menu className="h-5 w-5 transition-transform duration-200" />
            )}
          </Button>
        </div>
      </Container>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 pt-20 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              className="container mx-auto px-4 py-6 bg-background/80 backdrop-blur-lg rounded-t-2xl border-t border-white/10 shadow-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.nav 
                className="flex flex-col space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.1
                    }
                  }
                }}
              >
                {navItems.map((item) => (
                  <motion.div
                    key={item.name}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { 
                        opacity: 1, 
                        x: 0,
                        transition: { 
                          type: "spring",
                          stiffness: 300,
                          damping: 24
                        }
                      }
                    }}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-foreground/5 hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-2 border-t border-white/10 mt-2" />
                {appLinks.map((link) => (
                  <motion.div
                    key={link.name}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        transition: { type: "spring", stiffness: 300, damping: 24 }
                      }
                    }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-base font-medium rounded-lg transition-colors hover:bg-foreground/5 hover:text-primary"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  className="pt-2"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { 
                      opacity: 1, 
                      y: 0,
                      transition: { 
                        delay: 0.2,
                        type: "spring",
                        stiffness: 300,
                        damping: 24
                      }
                    }
                  }}
                >
                  <Button
                    type="button"
                    onClick={() => { setIsOpen(false); setOpenOnboarding(true); }}
                    className="w-full py-5 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-base font-extrabold shadow-xl hover:from-blue-600 hover:via-pink-500 hover:to-green-400 hover:scale-100 hover:shadow-2xl transition-all duration-200 border-0"
                  >
                    Get Started
                  </Button>
                </motion.div>
              </motion.nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}