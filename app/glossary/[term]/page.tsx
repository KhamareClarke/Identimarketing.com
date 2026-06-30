import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const glossaryTerms = {
  seo: {
    term: "SEO (Search Engine Optimisation)",
    shortTerm: "SEO",
    definition:
      "SEO is the practice of optimising a website to rank higher in search engine results pages (SERPs), increasing organic (non-paid) traffic.",
    fullExplanation:
      "Search Engine Optimisation involves improving both the technical aspects of your website and its content to make it more visible to search engines like Google and Bing. A well-optimised website earns higher rankings for relevant search queries, driving more qualified visitors without paying for each click.",
    whyItMatters:
      "Businesses that rank on page one of Google receive over 90% of all organic search clicks. SEO is a long-term investment that compounds over time, delivering sustainable traffic and leads.",
    relatedTerms: ["local-seo", "keyword-research", "backlinks", "technical-seo"],
    category: "SEO",
  },
  "local-seo": {
    term: "Local SEO",
    shortTerm: "Local SEO",
    definition:
      "Local SEO is the process of optimising your online presence to attract more business from relevant local searches on Google and other search engines.",
    fullExplanation:
      "Local SEO focuses on appearing in the 'Local Pack' (the map results that appear for location-based searches) and organic rankings for searches with local intent. Key tactics include Google Business Profile optimisation, local citations, and earning reviews.",
    whyItMatters:
      "46% of all Google searches seek local information. For businesses with a physical location or service area, local SEO is often the highest-ROI digital marketing investment available.",
    relatedTerms: ["seo", "keyword-research"],
    category: "SEO",
  },
  ppc: {
    term: "PPC (Pay-Per-Click Advertising)",
    shortTerm: "PPC",
    definition:
      "PPC is an online advertising model where advertisers pay a fee each time one of their ads is clicked, buying visits to their site rather than earning them organically.",
    fullExplanation:
      "PPC advertising platforms like Google Ads and Microsoft Ads allow businesses to bid on keywords and display ads at the top of search results. You only pay when someone clicks your ad. Well-managed PPC campaigns deliver immediate traffic and are highly measurable.",
    whyItMatters:
      "PPC is the fastest way to drive targeted traffic to a website. Unlike SEO, results are near-immediate. It is ideal for new businesses, product launches, or any scenario where speed matters.",
    relatedTerms: ["seo", "cro"],
    category: "Advertising",
  },
  cro: {
    term: "CRO (Conversion Rate Optimisation)",
    shortTerm: "CRO",
    definition:
      "CRO is the process of increasing the percentage of website visitors who complete a desired action such as filling in a form, making a purchase, or calling your business.",
    fullExplanation:
      "CRO uses data, user research, and A/B testing to understand why visitors are not converting and to systematically improve website elements such as headlines, CTAs, forms, and page layout to increase the conversion rate.",
    whyItMatters:
      "Doubling your conversion rate effectively doubles your revenue without increasing traffic. CRO ensures you extract maximum value from existing marketing spend.",
    relatedTerms: ["ppc", "seo", "content-marketing"],
    category: "Marketing",
  },
  "content-marketing": {
    term: "Content Marketing",
    shortTerm: "Content Marketing",
    definition:
      "Content marketing is a strategic approach focused on creating and distributing valuable, relevant content to attract and retain a clearly defined audience and to drive profitable customer action.",
    fullExplanation:
      "Instead of pitching products directly, content marketing provides genuinely useful information in the form of blog posts, videos, guides, podcasts, and infographics. This builds trust, authority, and organic search visibility over time.",
    whyItMatters:
      "Content marketing generates 3x more leads than outbound marketing and costs 62% less. High-quality content is also the foundation of both SEO and social media success.",
    relatedTerms: ["seo", "social-media-marketing", "keyword-research"],
    category: "Marketing",
  },
  backlinks: {
    term: "Backlinks",
    shortTerm: "Backlinks",
    definition:
      "Backlinks (also called inbound links) are links from one website to another. Search engines treat backlinks as votes of confidence, the more high-quality backlinks a page has, the more authority it carries.",
    fullExplanation:
      "Not all backlinks are equal. A single link from a trusted, authoritative website (like the BBC or Forbes) is worth far more than dozens of links from low-quality sites. Building backlinks through PR, guest posting, and creating link-worthy content is a core off-page SEO tactic.",
    whyItMatters:
      "Backlinks remain one of Google's top three ranking factors. Websites with strong backlink profiles consistently outrank competitors for competitive search terms.",
    relatedTerms: ["seo", "content-marketing", "local-seo"],
    category: "SEO",
  },
  "keyword-research": {
    term: "Keyword Research",
    shortTerm: "Keyword Research",
    definition:
      "Keyword research is the process of finding and analysing search terms that people enter into search engines, used to guide content creation and SEO strategy.",
    fullExplanation:
      "Effective keyword research identifies terms with the right balance of search volume, competition, and commercial intent. Tools like Ahrefs, SEMrush, and Google Keyword Planner help marketers discover opportunities their competitors may have missed.",
    whyItMatters:
      "Targeting the wrong keywords wastes months of effort. Proper keyword research ensures every piece of content you create has the potential to attract genuinely interested visitors who are likely to convert.",
    relatedTerms: ["seo", "content-marketing", "ppc"],
    category: "SEO",
  },
  "brand-identity": {
    term: "Brand Identity",
    shortTerm: "Brand Identity",
    definition:
      "Brand identity is the collection of visual and verbal elements that a company creates to portray the right image to its customers including logo, colour palette, typography, and tone of voice.",
    fullExplanation:
      "A strong brand identity goes beyond aesthetics. It communicates your values, builds recognition, and creates emotional connections with your audience. Consistent brand application across all touchpoints builds trust and distinguishes you from competitors.",
    whyItMatters:
      "Consistent branding increases revenue by up to 23%. Customers are far more likely to purchase from brands they recognise and trust.",
    relatedTerms: ["content-marketing", "social-media-marketing"],
    category: "Branding",
  },
  "social-media-marketing": {
    term: "Social Media Marketing",
    shortTerm: "Social Media Marketing",
    definition:
      "Social media marketing is the use of social media platforms to connect with your audience, build your brand, increase sales, and drive website traffic.",
    fullExplanation:
      "Effective social media marketing combines organic content (posts, stories, reels) with paid advertising to reach both existing followers and new audiences. Each platform, Instagram, LinkedIn, Facebook, TikTok, X, requires a tailored strategy.",
    whyItMatters:
      "4.9 billion people use social media globally. For most businesses, social media is where their customers already spend time, making it one of the highest-reach marketing channels available.",
    relatedTerms: ["content-marketing", "brand-identity", "ppc"],
    category: "Marketing",
  },
  "technical-seo": {
    term: "Technical SEO",
    shortTerm: "Technical SEO",
    definition:
      "Technical SEO refers to optimising the infrastructure of a website so search engines can crawl, index, and render it efficiently, improving rankings without changing content.",
    fullExplanation:
      "Technical SEO covers page speed (Core Web Vitals), mobile-friendliness, HTTPS security, XML sitemaps, robots.txt, canonical tags, structured data, and fixing crawl errors. It is the foundation on which all other SEO efforts are built.",
    whyItMatters:
      "Even the best content will underperform if search engines cannot properly access and understand your website. Technical SEO fixes ensure that your content investment delivers its full potential.",
    relatedTerms: ["seo", "keyword-research", "backlinks"],
    category: "SEO",
  },
}

type TermSlug = keyof typeof glossaryTerms

const categoryColours: Record<string, string> = {
  SEO: "bg-blue-50 text-blue-700 border-blue-100",
  Advertising: "bg-violet-50 text-violet-700 border-violet-100",
  Marketing: "bg-green-50 text-green-700 border-green-100",
  Branding: "bg-pink-50 text-pink-700 border-pink-100",
}

const relatedTermLabels: Record<string, string> = Object.fromEntries(
  Object.entries(glossaryTerms).map(([slug, data]) => [slug, data.shortTerm]),
)

export async function generateStaticParams() {
  return Object.keys(glossaryTerms).map((term) => ({ term }))
}

export async function generateMetadata({
  params,
}: {
  params: { term: TermSlug }
}): Promise<Metadata> {
  const entry = glossaryTerms[params.term]
  if (!entry) return {}

  const title = `What is ${entry.shortTerm}? | Digital Marketing Glossary`
  const description = entry.definition.slice(0, 155)

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.identimarketing.com/glossary/${params.term}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.identimarketing.com/glossary/${params.term}`,
    },
  }
}

export default function GlossaryTermPage({ params }: { params: { term: TermSlug } }) {
  const entry = glossaryTerms[params.term]

  if (!entry) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main className="flex-1 container py-16 px-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Term Not Found</h1>
          <p className="text-slate-500 mb-6">
            We could not find that glossary term.
          </p>
          <Link
            href="/glossary"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-sm font-bold"
          >
            Back to Glossary
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const slug = params.term
  const pageUrl = `https://www.identimarketing.com/glossary/${slug}`

  const definedTermSchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: entry.term,
    description: entry.definition,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Digital Marketing Glossary",
      url: "https://www.identimarketing.com/glossary",
    },
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is ${entry.shortTerm}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${entry.definition} ${entry.fullExplanation}`,
        },
      },
      {
        "@type": "Question",
        name: `Why does ${entry.shortTerm} matter for my business?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.whyItMatters,
        },
      },
    ],
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.identimarketing.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Glossary",
        item: "https://www.identimarketing.com/glossary",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: entry.term,
        item: pageUrl,
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Script
        id={`ld-defined-term-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }}
      />
      <Script
        id={`ld-faq-term-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id={`ld-breadcrumb-term-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <SiteHeader />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-slate-100 bg-slate-50">
          <div className="container max-w-3xl mx-auto px-4 py-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/" className="hover:text-slate-900 transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/glossary" className="hover:text-slate-900 transition-colors">
                Glossary
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">{entry.shortTerm}</span>
            </nav>
          </div>
        </div>

        <article className="container max-w-3xl mx-auto py-12 sm:py-16 px-4">
          {/* Back link */}
          <Link
            href="/glossary"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-8"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Glossary
          </Link>

          {/* Category badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${
                categoryColours[entry.category] ?? "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {entry.category}
            </span>
          </div>

          {/* Term heading */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6">
            {entry.term}
          </h1>

          {/* Definition */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8">
            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-2">
              Definition
            </p>
            <p className="text-lg text-slate-800 font-medium leading-relaxed">{entry.definition}</p>
          </div>

          {/* Full explanation */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Full Explanation</h2>
            <p className="text-slate-600 leading-relaxed">{entry.fullExplanation}</p>
          </section>

          {/* Why it matters */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Why {entry.shortTerm} Matters for Your Business
            </h2>
            <div className="flex gap-4 bg-blue-50 border border-blue-100 rounded-2xl p-5 sm:p-6">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 flex items-center justify-center mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p className="text-slate-700 leading-relaxed">{entry.whyItMatters}</p>
            </div>
          </section>

          {/* Related terms */}
          {entry.relatedTerms.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Related Terms</h2>
              <div className="flex flex-wrap gap-2">
                {entry.relatedTerms.map((relSlug) => (
                  <Link
                    key={relSlug}
                    href={`/glossary/${relSlug}`}
                    className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
                  >
                    {relatedTermLabels[relSlug] ?? relSlug}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Divider */}
          <hr className="border-slate-100 my-10" />

          {/* CTA */}
          <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-extrabold text-white mb-3">
              Want to apply {entry.shortTerm} to your business?
            </h2>
            <p className="text-slate-300 mb-7">
              Book a free consultation and our experts will show you exactly how we can help you grow.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-sm font-bold shadow-lg hover:scale-[1.03] transition-transform duration-200"
            >
              Get a Free Consultation
            </Link>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
