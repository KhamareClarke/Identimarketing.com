import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// This would typically come from a CMS or API
const blogPosts = [
  {
    slug: "10-seo-strategies-that-actually-work-in-2025",
    title: "10 SEO Strategies That Actually Work in 2025",
    description: "Discover the latest SEO techniques that are driving real results for businesses in the current digital landscape.",
    date: "May 15, 2025",
    author: "Alex Johnson",
    category: "SEO",
    image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?q=80&w=2074",
    content: `
      <p>Search Engine Optimization continues to evolve at a rapid pace. What worked a few years ago may not be effective today. In this article, we'll explore the most effective SEO strategies for 2025 that are actually delivering results.</p>
      
      <h2>1. AI-Powered Content Optimization</h2>
      <p>With search engines becoming increasingly sophisticated in understanding content quality and relevance, AI tools can help optimize your content for both search engines and users. These tools analyze top-ranking content and provide recommendations for improvements.</p>
      
      <h2>2. Voice Search Optimization</h2>
      <p>As voice assistants become more prevalent, optimizing for voice search is no longer optional. Focus on conversational keywords and questions that people might ask verbally.</p>
      
      <h2>3. User Experience Signals</h2>
      <p>Search engines now heavily weigh user experience metrics like page load speed, mobile-friendliness, and interaction metrics. Ensuring your site provides an excellent user experience is crucial for SEO success.</p>
      
      <h2>4. E-E-A-T Principles</h2>
      <p>Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T) continue to be important ranking factors. Demonstrating your expertise and building trust with your audience is essential.</p>
      
      <h2>5. Semantic Search Understanding</h2>
      <p>Rather than focusing solely on keywords, understand the intent behind searches and create content that comprehensively addresses topics.</p>
      
      <h2>6. Video Content Optimization</h2>
      <p>Video content continues to gain importance in search results. Creating and optimizing video content can significantly boost your visibility.</p>
      
      <h2>7. Core Web Vitals Optimization</h2>
      <p>Google's Core Web Vitals metrics remain crucial ranking factors. Ensuring your site performs well in these metrics is essential for SEO success.</p>
      
      <h2>8. Local SEO Focus</h2>
      <p>For businesses with physical locations, local SEO continues to be vital. Optimize your Google Business Profile and ensure consistent NAP (Name, Address, Phone) information across the web.</p>
      
      <h2>9. Structured Data Implementation</h2>
      <p>Implementing structured data helps search engines understand your content better and can result in rich snippets in search results, increasing click-through rates.</p>
      
      <h2>10. Sustainable Link Building</h2>
      <p>Quality backlinks remain important, but focus on sustainable, natural link building strategies rather than manipulative tactics that could result in penalties.</p>
      
      <h2>Conclusion</h2>
      <p>SEO continues to evolve, but the fundamental principle remains the same: create valuable content for users, and make it easily accessible to both users and search engines. By implementing these strategies, you'll be well-positioned for SEO success in 2025 and beyond.</p>
    `
  },
  {
    slug: "how-ai-is-transforming-digital-marketing",
    title: "How AI is Transforming Digital Marketing",
    description: "Explore the ways artificial intelligence is revolutionizing marketing strategies and customer engagement.",
    date: "May 8, 2025",
    author: "Sarah Chen",
    category: "AI",
    image: "https://images.unsplash.com/photo-1677442135136-760c813028c0?q=80&w=2070",
    content: `
      <p>Artificial Intelligence is no longer just a buzzword in digital marketing—it's becoming an essential component of successful marketing strategies. In this article, we'll explore how AI is transforming various aspects of digital marketing.</p>
      
      <h2>Personalization at Scale</h2>
      <p>AI enables marketers to deliver personalized experiences to thousands or even millions of customers simultaneously. By analyzing user behavior, preferences, and past interactions, AI can help create tailored content, product recommendations, and offers that resonate with individual users.</p>
      
      <h2>Predictive Analytics</h2>
      <p>AI-powered predictive analytics helps marketers forecast trends, customer behavior, and campaign performance. This allows for more informed decision-making and strategic planning.</p>
      
      <h2>Content Creation and Optimization</h2>
      <p>AI tools can now generate content, suggest optimizations, and even create variations for A/B testing. While human creativity remains essential, AI can significantly enhance content creation processes.</p>
      
      <h2>Chatbots and Conversational Marketing</h2>
      <p>Advanced AI chatbots provide instant, 24/7 customer service and can guide users through the sales funnel. These conversational interfaces are becoming increasingly sophisticated and human-like.</p>
      
      <h2>Automated Advertising</h2>
      <p>AI optimizes ad targeting, bidding, and placement in real-time, maximizing ROI. Platforms like Google and Facebook use AI to deliver ads to the most receptive audiences.</p>
      
      <h2>Voice Search Optimization</h2>
      <p>As voice assistants become more prevalent, AI helps marketers optimize for voice searches, which often differ from text-based queries.</p>
      
      <h2>Customer Journey Mapping</h2>
      <p>AI analyzes touchpoints across channels to create comprehensive customer journey maps, helping marketers understand and optimize the entire customer experience.</p>
      
      <h2>Conclusion</h2>
      <p>AI is not replacing marketers but rather augmenting their capabilities. By embracing AI technologies, marketers can achieve greater efficiency, personalization, and effectiveness in their campaigns. The future of digital marketing will increasingly be shaped by advances in artificial intelligence.</p>
    `
  }
]

// Add this function to generate static paths for all blog posts
export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find(post => post.slug === params.slug) || blogPosts[0]

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="container max-w-4xl py-8 sm:py-10 px-4 sm:px-6">
          <Button variant="ghost" className="mb-6 sm:mb-8 group text-xs sm:text-sm h-8 sm:h-9" asChild>
            <Link href="/blog" className="flex items-center">
              <ArrowLeft className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
              Back to all posts
            </Link>
          </Button>
          
          <div className="relative h-[250px] sm:h-[300px] md:h-[400px] w-full mb-6 sm:mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-full bg-primary/10 text-primary">
              <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {post.category}
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">{post.title}</h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-muted-foreground mb-6 sm:mb-8 text-xs sm:text-sm">
            <div className="flex items-center">
              <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {post.author}
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {post.date}
            </div>
          </div>
          
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}