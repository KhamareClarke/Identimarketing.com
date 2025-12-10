"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
  glowEffect?: boolean
}

export function AnimatedButton({ 
  children, 
  className,
  glowEffect = false,
  ...props 
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative",
        glowEffect && "after:absolute after:inset-0 after:z-[-1] after:blur-xl after:bg-primary/30 after:opacity-0 hover:after:opacity-100 after:transition-opacity"
      )}
    >
      <Button
        className={cn(
          "transform-gpu transition-all duration-300",
          glowEffect && "hover:shadow-lg hover:shadow-primary/20",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
}