"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Search, ArrowRight, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const blogPosts = [
  {
    title: "10 SEO Strategies That Actually Work in 2025",
    description: "Discover the latest SEO techniques that are driving real results for businesses in the current digital landscape.",
    date: "May 15, 2025",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=2074",
    slug: "10-seo-strategies-that-actually-work-in-2025",
  },
  {
    title: "How AI is Transforming Digital Marketing",
    description: "Explore the ways artificial intelligence is revolutionizing marketing strategies and customer engagement.",
    date: "May 8, 2025",
    category: "AI",
    image: "https://images.unsplash.com/photo-1677442135136-760c813028c0?q=80&w=2070",
    slug: "how-ai-is-transforming-digital-marketing",
  },
  {
    title: "Building a Brand That Resonates with Your Audience",
    description: "Learn the essential elements of creating a brand identity that connects with your target customers on a deeper level.",
    date: "April 29, 2025",
    category: "Branding",
    image: "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?q=80&w=2074",
    slug: "building-a-brand-that-resonates-with-your-audience",
  },
  {
    title: "Social Media Trends to Watch in 2025",
    description: "Stay ahead of the curve with these emerging social media trends that are shaping how brands connect with their audiences.",
    date: "April 22, 2025",
    category: "Social Media",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2074",
    slug: "social-media-trends-to-watch-in-2025",
  },
  {
    title: "The Ultimate Guide to Content Marketing",
    description: "Everything you need to know about creating a content strategy that drives traffic, engagement, and conversions.",
    date: "April 15, 2025",
    category: "Content",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070",
    slug: "the-ultimate-guide-to-content-marketing",
  },
  {
    title: "Website Design Principles for Higher Conversion Rates",
    description: "Discover the key design elements that can significantly improve your website's ability to convert visitors into customers.",
    date: "April 8, 2025",
    category: "Web Design",
    image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=2069",
    slug: "website-design-principles-for-higher-conversion-rates",
  },
  {
    title: "The Complete Guide to Local SEO for UK Businesses",
    description: "Everything UK businesses need to know about local SEO -- from Google Business Profile to local citations and earning 5-star reviews.",
    date: "June 24, 2025",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2074",
    slug: "complete-guide-local-seo-uk-businesses",
  },
  {
    title: "PPC vs SEO: Which Channel is Right for Your Business?",
    description: "Compare pay-per-click advertising and organic SEO to discover which strategy delivers the best ROI for your specific business situation.",
    date: "June 17, 2025",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070",
    slug: "ppc-vs-seo-which-is-right-for-your-business",
  },
  {
    title: "How to Increase Your Website's Conversion Rate",
    description: "Proven CRO techniques that turn more website visitors into paying customers without increasing your marketing spend.",
    date: "June 10, 2025",
    category: "Web Design",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015",
    slug: "how-to-increase-website-conversion-rate",
  },
  {
    title: "AI Chatbots for Customer Service: A Complete Guide",
    description: "Learn how AI-powered chatbots can handle customer queries 24/7, reduce support costs, and improve customer satisfaction scores.",
    date: "June 3, 2025",
    category: "AI",
    image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=2006",
    slug: "ai-chatbots-customer-service-guide",
  },
  {
    title: "Email Marketing Best Practices for 2025",
    description: "Boost your email open rates, click-throughs, and conversions with these proven email marketing strategies for 2025.",
    date: "May 20, 2025",
    category: "Content",
    image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?q=80&w=2070",
    slug: "email-marketing-best-practices-2025",
  },
  {
    title: "How to Build a Brand Identity That Stands Out",
    description: "A step-by-step guide to creating a distinctive brand identity -- from defining your values to designing a memorable visual system.",
    date: "May 1, 2025",
    category: "Branding",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070",
    slug: "how-to-build-a-brand-identity",
  },
  {
    title: "Google Algorithm Updates: What Business Owners Need to Know",
    description: "Stay ahead of Google's core updates with a clear explanation of what changes, what stays the same, and how to future-proof your SEO.",
    date: "April 15, 2025",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=2027",
    slug: "google-algorithm-updates-what-you-need-to-know",
  },
  {
    title: "Technical SEO Checklist: 15 Issues That Are Killing Your Rankings",
    description: "Identify and fix the most common technical SEO problems that prevent your website from reaching its full ranking potential.",
    date: "April 1, 2025",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072",
    slug: "technical-seo-checklist-15-must-fix-issues",
  },
  {
    title: "Pay-Per-Click Advertising: A Beginner's Guide",
    description: "New to PPC? This beginner-friendly guide covers how Google Ads works, how to set a budget, and how to run your first profitable campaign.",
    date: "March 18, 2025",
    category: "PPC",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2074",
    slug: "pay-per-click-advertising-beginners-guide",
  },
]

const categories = ["All", "SEO", "AI", "Branding", "Social Media", "Content", "Web Design", "PPC"]

const categoryColors: Record<string, string> = {
  SEO:           "bg-blue-50 text-blue-600 border-blue-100",
  AI:            "bg-violet-50 text-violet-600 border-violet-100",
  Branding:      "bg-orange-50 text-orange-600 border-orange-100",
  "Social Media": "bg-pink-50 text-pink-600 border-pink-100",
  Content:       "bg-green-50 text-green-600 border-green-100",
  "Web Design":  "bg-cyan-50 text-cyan-600 border-cyan-100",
  PPC:           "bg-amber-50 text-amber-600 border-amber-100",
}

export default function BlogClient() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden bg-slate-50/60">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 mb-5 text-sm font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <BookOpen className="w-4 h-4 text-blue-500" />
            Latest Insights
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 font-heading tracking-tight">
            Our{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">
              Blog
            </span>
          </h1>
          <p className="text-lg text-slate-500">
            SEO, AI marketing, and digital growth insights for UK &amp; US businesses
          </p>
        </motion.div>

        {/* Search + category filters */}
        <motion.div
          className="max-w-3xl mx-auto mb-10 flex flex-col md:flex-row gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search articles..."
              className="pl-10 h-11 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white border-transparent shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              >
                <Card className="overflow-hidden h-full border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group rounded-2xl">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader className="p-5 pb-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400">{post.date}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${categoryColors[post.category] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {post.category}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-base font-bold text-slate-900 leading-snug">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-2">
                    <CardDescription className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                      {post.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="px-5 pb-5">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-600 group-hover:gap-2.5 transition-all duration-200"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-slate-500 mb-4">No articles found matching your criteria.</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCategory("All") }}
                className="px-5 py-2 rounded-full border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </motion.div>

        {filteredPosts.length > 0 && (
          <motion.div
            className="flex justify-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-slate-900 text-slate-900 text-sm font-bold hover:bg-slate-900 hover:text-white transition-all duration-200"
            >
              View All Articles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
