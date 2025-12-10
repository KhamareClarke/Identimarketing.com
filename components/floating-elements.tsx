"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

// Seed-based random number generator for consistent values
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

export function FloatingElements() {
  const [elements, setElements] = useState<Array<{
    id: number
    size: number
    x: number
    y: number
    duration: number
    delay: number
  }>>([])

  useEffect(() => {
    const newElements = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: 10 + seededRandom(i * 1) * 20,
      x: seededRandom(i * 2) * 100,
      y: seededRandom(i * 3) * 100,
      duration: 20 + seededRandom(i * 4) * 10,
      delay: seededRandom(i * 5) * 5
    }))
    setElements(newElements)
  }, [])

  if (elements.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full bg-primary/5 dark:bg-primary/10"
          initial={{ 
            width: element.size,
            height: element.size,
            left: `${element.x}%`,
            top: `${element.y}%`,
            opacity: 0
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            delay: element.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}