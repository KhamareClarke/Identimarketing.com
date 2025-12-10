import Link from "next/link"

// Dummy blog preview data. In production, fetch from CMS or API.
const BLOG_POSTS = [
  {
    title: "How AI Transforms Digital Marketing in 2025",
    slug: "ai-digital-marketing-2025",
    image: "/ai-marketing-2025.png",
    alt: "AI Digital Marketing Illustration",
    excerpt: "Discover how AI is revolutionizing marketing for UK & US brands: automation, personalization, and ROI.",
    date: "2025-08-30"
  },
  {
    title: "SEO Strategies for UK Businesses: 2025 Edition",
    slug: "seo-strategies-uk-2025",
    image: "/seo-2025.png",
    alt: "SEO Strategy Charts",
    excerpt: "The latest SEO tactics for local and national visibility. Actionable tips for UK business owners.",
    date: "2025-08-22"
  },
  {
    title: "Case Study: +£500K Revenue with AI Chatbots",
    slug: "case-study-ai-chatbots",
    image: "/aichat-2025.png",
    alt: "AI Chatbot Case Study",
    excerpt: "How a Stoke-on-Trent retailer doubled leads and boosted revenue using AI-powered chatbots.",
    date: "2025-08-15"
  }
];

export default function BlogPreviewSection() {
  return (
    <section id="insights" className="py-16 sm:py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 font-heading bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-blue-500 to-green-400">
            Insights & Articles
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Latest strategies, case studies, and AI marketing trends for UK & US businesses.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block rounded-xl overflow-hidden shadow-lg hover:shadow-2xl bg-white/90 dark:bg-background/90 border border-gray-100 dark:border-gray-800 transition-all">
              <div className="relative h-52 w-full overflow-hidden">
                <img
                  src={post.image}
                  alt={post.alt}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-base text-muted-foreground mb-3">
                  {post.excerpt}
                </p>
                <span className="text-xs text-muted-foreground font-semibold">
                  {new Date(post.date).toLocaleDateString("en-GB", { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/blog" className="inline-block px-8 py-3 rounded-full font-bold bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white shadow-lg hover:scale-105 transition-transform duration-300">
            View All Insights →
          </Link>
        </div>
      </div>
    </section>
  );
}
