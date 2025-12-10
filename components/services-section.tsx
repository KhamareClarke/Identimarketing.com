"use client"

import React from "react"
import Link from "next/link"
import { 
  Code, Search, BarChart, MessageSquare, Bot, Palette, ArrowRight, 
  Smartphone, Sparkles, Users, Globe, Cpu, Layers, Zap, Target, PieChart, LayoutGrid
} from "lucide-react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const services = [
  {
    title: "Website & App Development",
    description: "Custom, conversion-focused sites & apps with e-commerce, CMS, and responsive design.",
    icon: Code,
    href: "/services/website-development",
    cta: "Build My Website →"
  },
  {
    title: "SEO Services",
    description: "Rank higher, get found faster. Local SEO, technical fixes, and content that drives traffic & leads.",
    icon: Search,
    href: "/services/seo-services",
    cta: "Boost My Rankings →"
  },
  {
    title: "Digital Marketing",
    description: "Campaigns that pay for themselves: PPC, email funnels, and conversion optimization.",
    icon: BarChart,
    href: "/services/digital-marketing",
    cta: "Scale My Marketing →"
  },
  {
    title: "Social Media Management",
    description: "From posts to paid ads, we grow audiences into paying customers.",
    icon: Users,
    href: "/services/social-media",
    cta: "Grow My Audience →"
  },
  {
    title: "AI Voice & Chatbots",
    description: "24/7 automated lead capture and customer support powered by intelligent AI.",
    icon: Cpu,
    href: "/services/ai-solutions",
    cta: "Automate My Leads →"
  },
  {
    title: "Brand Identity",
    description: "Logos, visuals, and messaging that position your business as a market leader.",
    icon: Palette,
    href: "/services/brand-identity",
    cta: "Build My Brand →"
  },
]

export function ServicesSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.05,
    rootMargin: '-50px 0px',
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 120,
        damping: 15,
        duration: 0.4
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  }

  const gradientColors = [
    'from-pink-500/10 via-blue-500/10 to-green-400/10',
    'from-blue-500/10 via-purple-500/10 to-pink-500/10',
    'from-green-400/10 via-blue-500/10 to-purple-500/10'
  ]

  const iconColors = [
    'text-pink-500',
    'text-blue-500', 
    'text-green-500',
    'text-purple-500',
    'text-cyan-500',
    'text-orange-500'
  ]

  return (
    <section id="services" className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-background to-background/80">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-green-400/5 via-transparent to-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container relative z-10 px-8 sm:px-12 lg:px-16 max-w-[90rem] mx-auto">
        <motion.div 
          className="text-center max-w-5xl mx-auto mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          ref={ref}
        >
          <motion.span 
            className="inline-flex items-center px-5 py-2.5 mb-6 sm:mb-8 text-sm sm:text-base font-medium rounded-full bg-gradient-to-r from-pink-500/10 via-blue-500/10 to-green-400/10 text-primary border border-white/10 backdrop-blur-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-pink-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">
              AI-Enhanced Solutions
            </span>
          </motion.span>
          
          <motion.h2 
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-8 font-heading bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Our Services Built for <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">Growth & Scale</span>
          </motion.h2>
          
          <motion.p 
            className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Custom websites, SEO, AI systems, and digital marketing engineered for maximum results and measurable growth.
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {services.map((service, index) => (
            <motion.div 
              key={service.title} 
              variants={itemVariants}
              whileHover="hover"
              className="h-full"
            >
              <Card className="h-full bg-background/70 backdrop-blur-sm border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group rounded-2xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <CardHeader className="relative p-6 sm:p-8 pb-0 text-center">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-pink-500/10 via-blue-500/10 to-green-400/10 mb-4 sm:mb-6">
                      {React.createElement(service.icon, {
                        className: `h-6 w-6 sm:h-7 sm:w-7 ${iconColors[index]} drop-shadow-sm`
                      })}
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80 leading-tight">
                      {service.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 sm:p-8 pt-4 sm:pt-6 text-center">
                  <CardDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardContent>
                
                <CardFooter className="p-6 sm:p-8 pt-0 flex justify-center">
                  <Button 
                    asChild 
                    className="group relative overflow-hidden px-6 py-5 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-base font-bold shadow-xl hover:from-blue-600 hover:via-pink-500 hover:to-green-400 hover:scale-105 hover:shadow-2xl transition-all duration-200 border-0"
                  >
                    <Link href={service.href} className="flex items-center">
                      <span className="relative z-10">{service.cta}</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}