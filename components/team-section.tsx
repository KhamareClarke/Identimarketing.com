"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, Linkedin, Twitter, Github, Mail } from "lucide-react"

const team = [
  {
    name: "Khamare Clarke",
    role: "AI Architect",
    specialties: ["SEO Expertise", "Paid Advertising Specialist", "Software Engineering", "Digital Transformation"],
    bio: "As a seasoned AI engineer and digital strategist, Khamare Clarke brings a unique blend of technical expertise and business acumen to the table. With a proven track record of driving innovation and success, Khamare is dedicated to helping businesses thrive in the digital landscape.",
    image: "/khamare.png",
    initials: "KC",
    slug: "khamare-clarke",
    social: {
      linkedin: "https://www.linkedin.com/in/khamare-clarke"
    }
  },
  {
    name: "Llewellyn Livingston",
    role: "Business Consultant",
    specialties: ["ROI-Focused Strategy", "Project Management", "Precision Delivery"],
    bio: "With a keen eye for detail and a passion for driving results, Llewellyn Livingston is a seasoned business consultant and project manager. With a proven track record of delivering high-impact projects, Llewellyn is dedicated to helping businesses achieve their goals.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974",
    initials: "LL",
    slug: "llewellyn-livingston",
    social: {
      linkedin: "#"
    }
  },
  {
    name: "Fiza Saif",
    role: "Software Engineer",
    specialties: ["Full-Stack Development", "Cloud Solutions", "Scalable APIs", "System Architecture"],
    bio: "As a skilled software engineer, Fiza Saif brings a wealth of technical expertise to the table. With a passion for building scalable and efficient solutions, Fiza is dedicated to helping businesses drive innovation and success.",
    image: "/fizaS.png",
    initials: "FS",
    slug: "fiza-saif",
    social: {
      linkedin: "https://www.linkedin.com/in/fiza-saif-3855642a9"
    }
  },
  {
    name: "Kenza Ike",
    role: "Brand & SEO Specialist",
    specialties: ["Brand Strategy", "Social Media", "Top Google Rankings", "Visibility"],
    bio: "With a keen eye for branding and a passion for driving online visibility, Precious Ike is a seasoned brand and SEO specialist. With a proven track record of delivering high-impact results, Precious is dedicated to helping businesses thrive in the digital landscape.",
    image: "/precious.png",
    initials: "PI",
    slug: "kenza-ike",
    social: {
      linkedin: "#"
    }
  }
]

export function TeamSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section id="team" className="py-16 sm:py-20 relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background"></div>
      <div className="absolute top-20 right-[10%] w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-20 left-[10%] w-36 sm:w-56 md:w-72 h-36 sm:h-56 md:h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      
      <div className="container relative z-10 px-4 sm:px-6">
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          ref={ref}
        >
          <span className="inline-flex items-center px-3 py-1 mb-3 sm:mb-4 text-xs sm:text-sm font-medium rounded-full bg-primary/20 text-primary border border-primary/30 shadow-sm shadow-primary/10">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span>Meet Our Experts</span>
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 font-heading bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">
            Meet Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">Experts</span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
            Industry leaders driving innovation and success
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {team.map((member, index) => (
  <motion.div
    key={member.name}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    transition={{ duration: 0.5 }}
  >
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card/95 to-card/90 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 min-h-[480px] flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader className="relative p-6 pb-0 text-center">
        <div className="relative mx-auto mb-6">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-blue-500/30 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse-slow"></div>
            <div className="relative rounded-xl p-1 bg-gradient-to-br from-primary/40 to-blue-500/40">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-xl"></div>
              <div className="relative aspect-square w-28 sm:w-36 rounded-2xl overflow-hidden shadow-lg shadow-primary/10 border-4 border-transparent group-hover:border-gradient-to-r group-hover:from-pink-500 group-hover:via-blue-500 group-hover:to-green-400 transition-all duration-500">
  <img 
    src={member.image} 
    alt={member.name}
    className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
  />
</div>
            </div>
          </div>
        </div>
        <div className="relative">
          <h3 className="text-2xl sm:text-3xl font-extrabold mb-1 font-heading group-hover:text-primary transition-colors duration-300">{member.name}</h3>
          <p className="text-base sm:text-lg text-muted-foreground font-bold mb-4">{member.role}</p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {member.specialties.map((specialty, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs sm:text-base rounded-full font-semibold bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white shadow-md shadow-primary/10 hover:scale-105 transition-all duration-300"
              >
                {specialty}
              </span>
            ))}
          </div>
          {member.social.linkedin && (
  <div className="flex justify-center gap-3 mb-6">
    <a
      href={member.social.linkedin}
      className="p-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 hover:scale-110 transition-all duration-300 shadow-sm shadow-primary/10"
    >
      <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
    </a>
  </div>
)}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex gap-2">
          <Button
            className="flex-1 group relative overflow-hidden shadow-lg shadow-primary/10 rounded-full px-6 py-2 text-base font-bold bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white hover:scale-105 transition-transform duration-300"
            asChild
          >
            <Link href={`/team/${member.slug}`}>
              <span className="relative z-10 flex items-center justify-center">
                View Profile
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 opacity-80 group-hover:opacity-100 transition-opacity rounded-full"></span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hover:bg-primary/20 hover:text-primary transition-colors shadow-sm shadow-primary/10"
            asChild
          >
            <Link href="/#contact">
              <Mail className="h-4 w-4" />
              <span className="sr-only">Contact {member.name}</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
))}
        </motion.div>
        {/* Partner Badges */}
        <div className="flex flex-wrap justify-center items-center gap-6 mt-12 mb-4">
          <img src="/google-partner.svg" alt="Google Partner" className="max-h-64 min-w-[260px] w-auto object-contain" />
          <img src="/ghl-partner.svg" alt="GHL Partner" className="max-h-64 min-w-[260px] w-auto object-contain" />
          <img src="/aws-partner.svg" alt="AWS Partner" className="max-h-64 min-w-[260px] w-auto object-contain" />
        </div>
      </div>
    </section>
  )
}