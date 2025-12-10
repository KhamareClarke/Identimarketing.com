"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EnhancedButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
  glowEffect?: boolean
  gradientBorder?: boolean
  rippleEffect?: boolean
}

export function EnhancedButton({
  children,
  className,
  glowEffect = false,
  gradientBorder = false,
  rippleEffect = false,
  ...props
}: EnhancedButtonProps) {
  const [ripples, setRipples] = React.useState<{ x: number; y: number; id: number }[]>([])

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!rippleEffect) return

    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ripple = {
      x,
      y,
      id: Date.now(),
    }

    setRipples((prev) => [...prev, ripple])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
    }, 1000)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative",
        glowEffect && "after:absolute after:inset-0 after:z-[-1] after:blur-xl after:bg-primary/30 after:opacity-0 hover:after:opacity-100 after:transition-opacity"
      )}
    >
      {gradientBorder && (
        <div className="absolute -inset-[1px] rounded-lg bg-gradient-to-r from-primary via-blue-500 to-primary opacity-0 group-hover:opacity-100 blur-sm transition-opacity" />
      )}
      <Button
        className={cn(
          "relative overflow-hidden transform-gpu transition-all duration-300",
          glowEffect && "hover:shadow-lg hover:shadow-primary/20",
          gradientBorder && "border-transparent bg-background",
          rippleEffect && "isolate",
          className
        )}
        onClick={handleRipple}
        {...props}
      >
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute bg-primary/20 rounded-full animate-ripple"
            style={{
              top: ripple.y,
              left: ripple.x,
              transform: "translate(-50%, -50%)",
              width: "10px",
              height: "10px",
            }}
          />
        ))}
        {children}
      </Button>
    </motion.div>
  )
}