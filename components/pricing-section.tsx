"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, XCircle } from "lucide-react"
import { Button } from "./ui/button"

const offers = [
  { label: "Website & App Development", value: "webdev" },
  { label: "SEO Services", value: "seo" },
  { label: "Digital Marketing", value: "marketing" },
  { label: "Social Media Management", value: "social" },
  { label: "AI Voice & Chatbots", value: "ai" },
  { label: "Brand Identity", value: "brand" },
  { label: "Consultancy", value: "consultancy" },
]

type Plan = {
  name: string;
  price: string;
  features: string[];
  cta: string;
  popular: boolean;
};

const plans: { [key: string]: Plan[] } = {
  webdev: [
    {
      name: "Starter",
      price: "£899",
      features: [
        "5 Page Responsive Website",
        "Basic CMS Integration",
        "1 Revision Round",
        "Mobile & Tablet Ready",
      ],
      cta: "Build My Website",
      popular: false,
    },
    {
      name: "Growth",
      price: "£1799",
      features: [
        "Everything in Starter",
        "10 Pages + Blog",
        "E-commerce Ready",
        "2 Revision Rounds",
        "Speed & SEO Optimized",
      ],
      cta: "Upgrade My Site",
      popular: true,
    },
    {
      name: "Elite",
      price: "£3499",
      features: [
        "Everything in Growth",
        "Custom App Features",
        "Advanced Animations",
        "Unlimited Revisions",
        "Priority Support",
      ],
      cta: "Go Elite",
      popular: false,
    },
  ],
  seo: [
    {
      name: "Starter",
      price: "£299/mo",
      features: [
        "Local SEO Setup",
        "On-Page Optimization",
        "Monthly Reporting",
        "Basic Link Building",
      ],
      cta: "Boost My Rankings",
      popular: false,
    },
    {
      name: "Growth",
      price: "£599/mo",
      features: [
        "Everything in Starter",
        "Competitor Analysis",
        "Content Strategy",
        "Technical SEO Audit",
        "Advanced Link Building",
      ],
      cta: "Grow My SEO",
      popular: true,
    },
    {
      name: "Elite",
      price: "£1099/mo",
      features: [
        "Everything in Growth",
        "Conversion Rate Optimization",
        "Dedicated Account Manager",
        "Custom Outreach",
        "Priority Support",
      ],
      cta: "Dominate Search",
      popular: false,
    },
  ],
  marketing: [
    {
      name: "Starter",
      price: "£399/mo",
      features: [
        "Google & Meta Ads Setup",
        "Ad Copywriting",
        "Basic Reporting",
        "Budget Management",
      ],
      cta: "Scale My Marketing",
      popular: false,
    },
    {
      name: "Growth",
      price: "£799/mo",
      features: [
        "Everything in Starter",
        "A/B Testing",
        "Conversion Tracking",
        "Landing Page Recommendations",
        "Monthly Optimization Calls",
      ],
      cta: "Optimize Campaigns",
      popular: true,
    },
    {
      name: "Elite",
      price: "£1499/mo",
      features: [
        "Everything in Growth",
        "Multi-Channel Management",
        "Email Funnel Setup",
        "Priority Support",
        "Custom Reporting",
      ],
      cta: "Go Elite",
      popular: false,
    },
  ],
  social: [
    {
      name: "Starter",
      price: "£249/mo",
      features: [
        "Content Calendar",
        "3 Platforms Managed",
        "8 Posts/Month",
        "Basic Reporting",
      ],
      cta: "Grow My Audience",
      popular: false,
    },
    {
      name: "Growth",
      price: "£499/mo",
      features: [
        "Everything in Starter",
        "Paid Social Ad Management",
        "15 Posts/Month",
        "Community Engagement",
        "Monthly Strategy Call",
      ],
      cta: "Boost My Social",
      popular: true,
    },
    {
      name: "Elite",
      price: "£899/mo",
      features: [
        "Everything in Growth",
        "Influencer Outreach",
        "Full Funnel Reporting",
        "24/7 Monitoring",
        "Priority Support",
      ],
      cta: "Go Elite",
      popular: false,
    },
  ],
  ai: [
    {
      name: "Starter",
      price: "£499/mo",
      features: [
        "Basic AI Chatbot",
        "FAQ Automation",
        "Email Integration",
        "Monthly Reporting",
      ],
      cta: "Automate My Leads",
      popular: false,
    },
    {
      name: "Growth",
      price: "£899/mo",
      features: [
        "Everything in Starter",
        "Voice Assistant Integration",
        "CRM Connection",
        "Custom Conversational Flows",
        "Live Chat Escalation",
      ],
      cta: "Upgrade Automation",
      popular: true,
    },
    {
      name: "Elite",
      price: "£1599/mo",
      features: [
        "Everything in Growth",
        "AI Training on Your Data",
        "Omnichannel Support",
        "Priority Support",
        "Custom Integrations",
      ],
      cta: "Go Elite",
      popular: false,
    },
  ],
  brand: [
    {
      name: "Starter",
      price: "£399",
      features: [
        "Logo Design",
        "Brand Colour Palette",
        "Basic Brand Guidelines",
        "1 Revision Round",
      ],
      cta: "Build My Brand",
      popular: false,
    },
    {
      name: "Growth",
      price: "£899",
      features: [
        "Everything in Starter",
        "Messaging Framework",
        "Social Media Kit",
        "2 Revision Rounds",
        "Brand Story Development",
      ],
      cta: "Upgrade My Brand",
      popular: true,
    },
    {
      name: "Elite",
      price: "£1799",
      features: [
        "Everything in Growth",
        "Brand Guidelines Book",
        "Market Positioning",
        "Unlimited Revisions",
        "Priority Support",
      ],
      cta: "Go Elite",
      popular: false,
    },
  ],
  consultancy: [
    {
      name: "Starter",
      price: "£99/hr",
      features: [
        "1:1 Strategy Session",
        "Website/SEO Audit",
        "Actionable Recommendations",
        "Follow-up Email Summary",
      ],
      cta: "Book Starter Session",
      popular: false,
    },
    {
      name: "Growth",
      price: "£399/mo",
      features: [
        "Everything in Starter",
        "Monthly Check-ins",
        "Competitor Benchmarking",
        "Conversion Review",
        "Priority Email Support",
      ],
      cta: "Start Growth Plan",
      popular: true,
    },
    {
      name: "Elite",
      price: "£999/mo",
      features: [
        "Everything in Growth",
        "Weekly Calls",
        "Full Funnel Strategy",
        "Team Training Session",
        "On-call Consultancy",
      ],
      cta: "Go Elite Consultancy",
      popular: false,
    },
  ],
}

export function PricingSection() {
  const [selected, setSelected] = useState("marketing")

  return (
    <section id="pricing" className="relative py-32 sm:py-40 bg-gradient-to-b from-background to-background/90 overflow-hidden">
      {/* Animated background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse-slower"></div>
      </div>
      <div className="container relative z-10 px-8 sm:px-12 lg:px-16 max-w-[90rem] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="flex flex-col items-center mb-10"
        >
          <span className="inline-block mb-4 px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-xs sm:text-sm font-bold shadow-lg tracking-wide uppercase backdrop-blur-md">
            Choose Your Ultimate Offer
          </span>
          <div className="flex flex-wrap justify-center gap-4 p-4 rounded-full bg-white/70 dark:bg-background/60 shadow-xl backdrop-blur-md border border-gradient-to-r from-pink-500 via-blue-500 to-green-400 mb-4">
            {offers.map((offer) => (
              <button
                key={offer.value}
                className={`px-5 py-2.5 rounded-full font-bold text-base sm:text-lg transition-all duration-200 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-md ${selected === offer.value ? "bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white scale-105 shadow-xl" : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"}`}
                onClick={() => setSelected(offer.value)}
                aria-pressed={selected === offer.value}
              >
                {offer.label}
              </button>
            ))}
          </div>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 40 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-center font-heading bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 drop-shadow-lg"
        >
          Simple, Transparent Pricing
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4 text-center leading-relaxed"
        >
          Choose the perfect plan for your business. No hidden fees, no surprises, just results.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="flex justify-center mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-xs font-bold shadow-lg tracking-wide uppercase">All plans include a free onboarding call & dedicated support</span>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 min-h-[300px]">
          {Array.isArray(plans[selected]) ? (
            plans[selected].map((plan: Plan, idx: number) => (
              <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 + idx * 0.1 }}
              className={`relative rounded-3xl p-12 bg-white/90 dark:bg-background/90 backdrop-blur-2xl shadow-2xl border-4 flex flex-col items-center group transition-transform duration-300
  ${plan.popular ? "border-gradient-to-r from-pink-500 via-blue-500 to-green-400 scale-105 shadow-3xl ring-4 ring-pink-400/20 ring-offset-2 animate-glow" : "border-gray-200 dark:border-gray-700 hover:scale-[1.03] hover:shadow-3xl"}
` }
            >
              {plan.popular && (
  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white px-6 py-2 rounded-full text-base font-extrabold shadow-2xl animate-glow ring-2 ring-pink-500/50">
    Most Popular
  </span>
)}
              <h3 className="text-3xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 group-hover:drop-shadow-md">
                {plan.name}
              </h3>
              <div className="text-5xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 group-hover:drop-shadow-md">
                {plan.price}
              </div>
              <ul className="mb-8 space-y-3 text-base text-muted-foreground">
                {plan.features.map((feature: string) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" /> {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full py-4 rounded-full font-bold text-lg bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white shadow-xl hover:from-blue-600 hover:via-pink-500 hover:to-green-400 hover:scale-105 transition-all duration-200 border-0 focus:ring-4 focus:ring-blue-300">
                {plan.cta}
              </Button>
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground opacity-80">No hidden fees</div>
            </motion.div>
          ))
          ) : (
            <div className="col-span-3 text-center py-12 text-muted-foreground animate-pulse">
              Loading plans...
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
