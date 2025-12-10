"use client"

import { motion } from "framer-motion"

export function AnimatedGradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Primary animated gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.3), transparent 50%), radial-gradient(circle at 100% 100%, hsl(var(--primary) / 0.3), transparent 50%)",
            "radial-gradient(circle at 100% 0%, hsl(var(--primary) / 0.3), transparent 50%), radial-gradient(circle at 0% 100%, hsl(var(--primary) / 0.3), transparent 50%)",
            "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.3), transparent 50%), radial-gradient(circle at 100% 100%, hsl(var(--primary) / 0.3), transparent 50%)",
          ],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear",
        }}
      />

      {/* Secondary floating gradients */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-1/2 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
          x: ["-25%", "0%", "-25%"],
          y: ["-25%", "0%", "-25%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-600/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.3, 0.2],
          x: ["25%", "0%", "25%"],
          y: ["25%", "0%", "25%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary) / 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[100px]" />
    </div>
  )
}