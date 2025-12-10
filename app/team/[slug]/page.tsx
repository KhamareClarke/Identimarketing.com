import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { notFound } from "next/navigation"
import { TeamMemberContent } from "./team-member-content"

const team = [
  {
    name: "Khamare Clarke",
    role: "AI Architect",
    specialties: ["SEO Expertise", "Paid Advertising Specialist", "Software Engineering", "Digital Transformation"],
    bio: "As a seasoned AI engineer and digital strategist, Khamare Clarke brings a unique blend of technical expertise and business acumen to the table. With a proven track record of driving innovation and success, Khamare is dedicated to helping businesses thrive in the digital landscape.",
    image: "/khamare.png",
    initials: "KC",
    slug: "khamare-clarke",
    expertise: [
      "Advanced AI Implementation",
      "Machine Learning Systems",
      "Digital Marketing Strategy",
      "SEO Optimization",
      "Paid Advertising",
      "Technical Architecture"
    ],
    achievements: [
      "Led development of proprietary AI marketing algorithms",
      "Implemented AI solutions for Fortune 500 companies",
      "Published research on AI in digital marketing",
      "Speaker at major tech conferences"
    ],
    education: "MSc in Artificial Intelligence from Imperial College London",
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
    expertise: [
      "Project Management",
      "Business Strategy",
      "ROI-Focused Strategy",
      "Team Leadership",
      "Process Optimization",
      "Change Management"
    ],
    achievements: [
      "Successfully managed $50M+ worth of projects",
      "Implemented AI solutions across 100+ businesses",
      "Certified PMP and Scrum Master",
      "Award-winning project manager"
    ],
    education: "MBA from London Business School",
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
    expertise: [
      "Full-Stack Development",
      "Cloud Architecture",
      "API Design",
      "Database Management",
      "System Integration",
      "Performance Optimization"
    ],
    achievements: [
      "Developed enterprise-level applications",
      "Created innovative cloud solutions",
      "Open source contributor",
      "Tech community mentor"
    ],
    education: "BSc in Computer Science from University of Manchester",
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
    expertise: [
      "Brand Strategy",
      "SEO Optimization",
      "Social Media Marketing",
      "Content Strategy",
      "Digital Branding",
      "Analytics & Reporting"
    ],
    achievements: [
      "Increased client organic traffic by 300%+",
      "Created award-winning brand campaigns",
      "SEO specialist for major brands",
      "Digital marketing thought leader"
    ],
    education: "BA in Marketing from University College London",
    social: {
      linkedin: "#"
    }
  }
]

// Generate static params for all team members
export async function generateStaticParams() {
  return team.map((member) => ({
    slug: member.slug,
  }))
}

export default function TeamMemberPage({ params }: { params: { slug: string } }) {
  const member = team.find(m => m.slug === params.slug)
  
  if (!member) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-background/90">
      <SiteHeader />
      <TeamMemberContent member={member} />
      <SiteFooter />
    </div>
  )
}