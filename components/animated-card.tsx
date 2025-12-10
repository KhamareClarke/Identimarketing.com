"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  index?: number
  children: React.ReactNode
}

export function AnimatedCard({ children, className, index = 0, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          damping: 15,
          stiffness: 120,
          delay: index * 0.08,
          duration: 0.4
        }
      }}
      whileHover={{ 
        scale: 1.03,
        y: -5,
        transition: { 
          type: "spring", 
          damping: 10, 
          stiffness: 400 
        }
      }}
      viewport={{ once: true, margin: "-80px" }}
    >
      <Card 
        className={cn(
          "transform-gpu backdrop-blur-sm transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/20",
          "dark:hover:shadow-primary/10",
          className
        )}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  )
}