"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TypewriterEffectProps {
  words: string[]
  className?: string
  textClassName?: string
  highlightClassName?: string
}

export function TypewriterEffect({ 
  words, 
  className = "",
  textClassName = "",
  highlightClassName = "" 
}: TypewriterEffectProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const typingSpeed = isDeleting ? 50 : 100
    const currentWord = words[currentWordIndex]

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText === currentWord) {
          setTimeout(() => setIsDeleting(true), 1500)
          return
        }
        setCurrentText(currentWord.slice(0, currentText.length + 1))
      } else {
        if (currentText === "") {
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % words.length)
          return
        }
        setCurrentText(currentWord.slice(0, currentText.length - 1))
      }
    }, typingSpeed)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentWordIndex, words])

  return (
    <AnimatePresence mode="wait">
      <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
        {words.map((word, index) => {
          const isHighlighted = word.endsWith(',');
          const displayText = isHighlighted ? word.slice(0, -1) : word;
          
          return (
            <div key={word} className="relative">
              <span className={`${textClassName} ${isHighlighted ? highlightClassName : 'opacity-80'}`}>
                {displayText}
              </span>
              {currentWordIndex === index && (
                <motion.span
                  className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-pink-500 via-blue-500 to-green-400"
                  layoutId="underline"
                />
              )}
            </div>
          );
        })}
      </div>
    </AnimatePresence>
  )
}