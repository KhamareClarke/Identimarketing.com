"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Mail, Linkedin, Twitter, Github } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface TeamMember {
  name: string
  role: string
  specialties: string[]
  bio: string
  image: string
  initials: string
  slug: string
  expertise: string[]
  achievements: string[]
  education: string
  social: {
    linkedin: string
  }
}

interface TeamMemberContentProps {
  member: TeamMember
}

export function TeamMemberContent({ member }: TeamMemberContentProps) {
  return (
    <main className="flex-1">
      <div className="relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/5 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative z-10 max-w-4xl py-12 sm:py-20 px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Button variant="outline" className="mb-6" asChild>
              <Link href="/#team" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Team
              </Link>
            </Button>
          </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="overflow-hidden border border-white/10 bg-background/70 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-8 sm:p-12">
                <div className="grid gap-8 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <div className="relative mb-6">
                      <Avatar className="h-48 w-48 mx-auto ring-4 ring-primary/20">
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-blue-600 text-white">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="text-center mb-6">
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">
                        {member.name}
                      </h1>
                      <p className="text-lg font-medium text-muted-foreground mb-4">{member.role}</p>
                      
                      <div className="flex justify-center gap-3">
                        {member.social.linkedin && member.social.linkedin !== "#" && (
                          <Button size="sm" variant="outline" className="rounded-full" asChild>
                            <Link href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-3">About</h2>
                      <p className="text-muted-foreground leading-relaxed">{member.bio}</p>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-3">Specialties</h2>
                      <div className="flex flex-wrap gap-2">
                        {member.specialties.map((specialty, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-pink-500/10 via-blue-500/10 to-green-400/10 text-primary border border-primary/20"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-3">Expertise</h2>
                      <div className="flex flex-wrap gap-2">
                        {member.expertise.map((skill, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-3">Key Achievements</h2>
                      <ul className="space-y-2">
                        {member.achievements.map((achievement, i) => (
                          <li key={i} className="flex items-center gap-2 text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></div>
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-3">Education</h2>
                      <p className="text-muted-foreground">{member.education}</p>
                    </div>

                    <div className="pt-4">
                      <Button className="w-full sm:w-auto group relative overflow-hidden" asChild>
                        <Link href="/#contact" className="flex items-center justify-center">
                          <span className="relative z-10 flex items-center">
                            Contact {member.name.split(" ")[0]}
                            <Mail className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                          <span className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-100 group-hover:opacity-90 transition-opacity"></span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
