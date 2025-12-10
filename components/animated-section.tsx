"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right"
}

export function AnimatedSection({ 
  children, 
  className, 
  delay = 0,
  direction = "up" 
}: AnimatedSectionProps) {
  const getInitialAnimation = () => {
    switch (direction) {
      case "down":
        return { opacity: 0, y: -20 }
      case "left":
        return { opacity: 0, x: 20 }
      case "right":
        return { opacity: 0, x: -20 }
      default:
        return { opacity: 0, y: 20 }
    }
  }

  const getFinalAnimation = () => {
    switch (direction) {
      case "down":
      case "up":
        return { opacity: 1, y: 0 }
      case "left":
      case "right":
        return { opacity: 1, x: 0 }
    }
  }

  return (
    <motion.section
      initial={getInitialAnimation()}
      whileInView={getFinalAnimation()}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ 
        type: "spring",
        damping: 15,
        stiffness: 120,
        delay: delay * 0.08,
        staggerChildren: 0.08,
        delayChildren: 0.1
      }}
      className={cn(
        "relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:via-transparent before:to-primary/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-1000",
        className
      )}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
        initial={{ x: "-100%", opacity: 0 }}
        whileInView={{
          x: ["100%", "-100%"],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          delay: 0.5,
          repeat: Infinity,
          repeatDelay: 5
        }}
        viewport={{ once: true }}
      />

      <div className="relative">
        {children}
      </div>
    </motion.section>
  )
}