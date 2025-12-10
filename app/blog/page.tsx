"use client"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Search, ArrowRight, Filter, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

const blogPosts = [
  {
    title: "10 SEO Strategies That Actually Work in 2025",
    description: "Discover the latest SEO techniques that are driving real results for businesses in the current digital landscape.",
    date: "May 15, 2025",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=2074",
    slug: "10-seo-strategies-that-actually-work-in-2025"
  },
  {
    title: "How AI is Transforming Digital Marketing",
    description: "Explore the ways artificial intelligence is revolutionizing marketing strategies and customer engagement.",
    date: "May 8, 2025",
    category: "AI",
    image: "https://images.unsplash.com/photo-1677442135136-760c813028c0?q=80&w=2070",
    slug: "how-ai-is-transforming-digital-marketing"
  },
  {
    title: "Building a Brand That Resonates with Your Audience",
    description: "Learn the essential elements of creating a brand identity that connects with your target customers on a deeper level.",
    date: "April 29, 2025",
    category: "Branding",
    image: "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?q=80&w=2074",
    slug: "building-a-brand-that-resonates-with-your-audience"
  },
  {
    title: "Social Media Trends to Watch in 2025",
    description: "Stay ahead of the curve with these emerging social media trends that are shaping how brands connect with their audiences.",
    date: "April 22, 2025",
    category: "Social Media",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2074",
    slug: "social-media-trends-to-watch-in-2025"
  },
  {
    title: "The Ultimate Guide to Content Marketing",
    description: "Everything you need to know about creating a content strategy that drives traffic, engagement, and conversions.",
    date: "April 15, 2025",
    category: "Content",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070",
    slug: "the-ultimate-guide-to-content-marketing"
  },
  {
    title: "Website Design Principles for Higher Conversion Rates",
    description: "Discover the key design elements that can significantly improve your website's ability to convert visitors into customers.",
    date: "April 8, 2025",
    category: "Web Design",
    image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=2069",
    slug: "website-design-principles-for-higher-conversion-rates"
  }
]

const categories = ["All", "SEO", "AI", "Branding", "Social Media", "Content", "Web Design"]

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="py-16 sm:py-20 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background"></div>
          <div className="absolute top-20 right-[10%] w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-[10%] w-36 sm:w-56 md:w-72 h-36 sm:h-56 md:h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
          
          <div className="container relative z-10 px-4 sm:px-6">
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-10 sm:mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center px-3 py-1 mb-3 sm:mb-4 text-xs sm:text-sm font-medium rounded-full bg-primary/10 text-primary">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span>Latest Insights</span>
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 font-heading">
                Our <span className="gradient-text">Blog</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                Insights, tips, and trends in digital marketing
              </p>
            </motion.div>

            <motion.div 
              className="max-w-3xl mx-auto mb-8 sm:mb-12 flex flex-col md:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <Input 
                  placeholder="Search articles..." 
                  className="pl-8 sm:pl-10 border-border/50 focus:border-primary text-xs sm:text-sm h-9 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {categories.map((category) => (
                  <Button 
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`text-xs h-8 sm:h-9 px-2 sm:px-3 ${selectedCategory === category ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Card className="overflow-hidden h-full border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          style={{ objectFit: "cover" }}
                          className="transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <CardHeader className="p-3 sm:p-4">
                        <div className="flex justify-between items-center mb-1 sm:mb-2">
                          <span className="text-xs text-muted-foreground">{post.date}</span>
                          <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                            {post.category}
                          </span>
                        </div>
                        <CardTitle className="line-clamp-2 text-base sm:text-lg">{post.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                        <CardDescription className="text-xs sm:text-sm line-clamp-3">{post.description}</CardDescription>
                      </CardContent>
                      <CardFooter className="p-3 sm:p-4">
                        <Button variant="ghost" className="px-0 group" asChild>
                          <Link href={`/blog/${post.slug}`} className="flex items-center text-primary text-xs sm:text-sm">
                            Read More
                            <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <p className="text-base sm:text-lg text-muted-foreground">No articles found matching your criteria.</p>
                  <Button 
                    variant="outline" 
                    className="mt-3 sm:mt-4 text-xs sm:text-sm h-8 sm:h-9"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("All")
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              )}
            </motion.div>
            
            {filteredPosts.length > 0 && (
              <motion.div 
                className="flex justify-center mt-8 sm:mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Button size="lg" className="group text-xs sm:text-sm h-9 sm:h-10" asChild>
                  <Link href="/" className="flex items-center">
                    View All Articles
                    <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}