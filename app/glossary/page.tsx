import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: 'Digital Marketing Glossary | SEO & Marketing Terms Explained',
  description:
    'A comprehensive glossary of digital marketing, SEO, and AI marketing terms explained in plain English for UK & US businesses.',
  alternates: {
    canonical: 'https://www.identimarketing.com/glossary',
  },
  openGraph: {
    title: 'Digital Marketing Glossary | SEO & Marketing Terms Explained',
    description:
      'A comprehensive glossary of digital marketing, SEO, and AI marketing terms explained in plain English for UK & US businesses.',
    url: 'https://www.identimarketing.com/glossary',
  },
}

const glossaryTerms = {
  seo: {
    term: "SEO (Search Engine Optimisation)",
    shortTerm: "SEO",
    category: "SEO",
    definition:
      "SEO is the practice of optimising a website to rank higher in search engine results pages (SERPs), increasing organic (non-paid) traffic.",
  },
  "local-seo": {
    term: "Local SEO",
    shortTerm: "Local SEO",
    category: "SEO",
    definition:
      "Local SEO is the process of optimising your online presence to attract more business from relevant local searches on Google and other search engines.",
  },
  ppc: {
    term: "PPC (Pay-Per-Click Advertising)",
    shortTerm: "PPC",
    category: "Advertising",
    definition:
      "PPC is an online advertising model where advertisers pay a fee each time one of their ads is clicked, buying visits to their site rather than earning them organically.",
  },
  cro: {
    term: "CRO (Conversion Rate Optimisation)",
    shortTerm: "CRO",
    category: "Marketing",
    definition:
      "CRO is the process of increasing the percentage of website visitors who complete a desired action such as filling in a form, making a purchase, or calling your business.",
  },
  "content-marketing": {
    term: "Content Marketing",
    shortTerm: "Content Marketing",
    category: "Marketing",
    definition:
      "Content marketing is a strategic approach focused on creating and distributing valuable, relevant content to attract and retain a clearly defined audience and to drive profitable customer action.",
  },
  backlinks: {
    term: "Backlinks",
    shortTerm: "Backlinks",
    category: "SEO",
    definition:
      "Backlinks (also called inbound links) are links from one website to another. Search engines treat backlinks as votes of confidence.",
  },
  "keyword-research": {
    term: "Keyword Research",
    shortTerm: "Keyword Research",
    category: "SEO",
    definition:
      "Keyword research is the process of finding and analysing search terms that people enter into search engines, used to guide content creation and SEO strategy.",
  },
  "brand-identity": {
    term: "Brand Identity",
    shortTerm: "Brand Identity",
    category: "Branding",
    definition:
      "Brand identity is the collection of visual and verbal elements that a company creates to portray the right image to its customers including logo, colour palette, typography, and tone of voice.",
  },
  "social-media-marketing": {
    term: "Social Media Marketing",
    shortTerm: "Social Media Marketing",
    category: "Marketing",
    definition:
      "Social media marketing is the use of social media platforms to connect with your audience, build your brand, increase sales, and drive website traffic.",
  },
  "technical-seo": {
    term: "Technical SEO",
    shortTerm: "Technical SEO",
    category: "SEO",
    definition:
      "Technical SEO refers to optimising the infrastructure of a website so search engines can crawl, index, and render it efficiently, improving rankings without changing content.",
  },
}

const categoryColours: Record<string, string> = {
  SEO: "bg-blue-50 text-blue-700 border-blue-100",
  Advertising: "bg-violet-50 text-violet-700 border-violet-100",
  Marketing: "bg-green-50 text-green-700 border-green-100",
  Branding: "bg-pink-50 text-pink-700 border-pink-100",
}

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Digital Marketing Glossary",
  url: "https://www.identimarketing.com/glossary",
  itemListElement: Object.entries(glossaryTerms).map(([slug, data], index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: data.term,
    url: `https://www.identimarketing.com/glossary/${slug}`,
  })),
}

export default function GlossaryIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Script
        id="ld-glossary-itemlist"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-16 sm:py-24 px-4">
          <div className="container max-w-3xl mx-auto text-center">
            <p className="text-blue-300 text-sm font-semibold tracking-widest uppercase mb-4">
              Knowledge Base
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5">
              Digital Marketing{" "}
              <span className="bg-gradient-to-r from-pink-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                Glossary
              </span>
            </h1>
            <p className="text-slate-300 text-lg max-w-xl mx-auto">
              Plain-English definitions for every digital marketing, SEO, and AI term your business
              needs to understand.
            </p>
          </div>
        </section>

        {/* Breadcrumb */}
        <div className="border-b border-slate-100 bg-slate-50">
          <div className="container max-w-5xl mx-auto px-4 py-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/" className="hover:text-slate-900 transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">Glossary</span>
            </nav>
          </div>
        </div>

        {/* Terms grid */}
        <section className="py-14 sm:py-20 px-4">
          <div className="container max-w-5xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                All Terms{" "}
                <span className="text-slate-400 font-normal text-base ml-1">
                  ({Object.keys(glossaryTerms).length})
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Object.entries(glossaryTerms).map(([slug, data]) => (
                <Link
                  key={slug}
                  href={`/glossary/${slug}`}
                  className="group bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base leading-snug">
                      {data.term}
                    </h3>
                    <span
                      className={`flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        categoryColours[data.category] ?? "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {data.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
                    {data.definition}
                  </p>
                  <span className="text-xs font-semibold text-blue-500 group-hover:underline">
                    Read more
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 sm:py-20 px-4 bg-slate-50 border-t border-slate-100">
          <div className="container max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              Want to put this knowledge to work?
            </h2>
            <p className="text-slate-500 mb-8">
              Book a free strategy call and our team will show you how these services can grow your
              business.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-sm font-bold shadow-md hover:scale-[1.03] transition-transform duration-200"
            >
              Get a Free Consultation
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
