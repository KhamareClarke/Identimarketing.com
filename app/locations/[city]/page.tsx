import type { Metadata } from 'next'
import Script from 'next/script'
import Link from 'next/link'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const cities = {
  "london": {
    name: "London",
    region: "Greater London",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 51.5074,
    lng: -0.1278,
  },
  "manchester": {
    name: "Manchester",
    region: "Greater Manchester",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 53.4808,
    lng: -2.2426,
  },
  "birmingham": {
    name: "Birmingham",
    region: "West Midlands",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 52.4862,
    lng: -1.8904,
  },
  "leeds": {
    name: "Leeds",
    region: "West Yorkshire",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 53.8008,
    lng: -1.5491,
  },
  "bristol": {
    name: "Bristol",
    region: "Bristol",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 51.4545,
    lng: -2.5879,
  },
  "stoke-on-trent": {
    name: "Stoke-on-Trent",
    region: "Staffordshire",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 53.0027,
    lng: -2.1794,
  },
  "new-york": {
    name: "New York",
    region: "New York State",
    country: "United States",
    countryCode: "US",
    lat: 40.7128,
    lng: -74.006,
  },
  "los-angeles": {
    name: "Los Angeles",
    region: "California",
    country: "United States",
    countryCode: "US",
    lat: 34.0522,
    lng: -118.2437,
  },
  "chicago": {
    name: "Chicago",
    region: "Illinois",
    country: "United States",
    countryCode: "US",
    lat: 41.8781,
    lng: -87.6298,
  },
  "miami": {
    name: "Miami",
    region: "Florida",
    country: "United States",
    countryCode: "US",
    lat: 25.7617,
    lng: -80.1918,
  },
}

type CitySlug = keyof typeof cities

const services = [
  {
    title: "SEO",
    description:
      "We improve your search rankings with technical audits, on-page optimisation, and sustainable link building strategies that drive long-term organic growth.",
  },
  {
    title: "Web Development",
    description:
      "Custom, fast-loading websites and web apps built to convert visitors into customers. We focus on performance, accessibility, and clean code.",
  },
  {
    title: "Digital Marketing",
    description:
      "Integrated campaigns across paid search, display, and email that reach your ideal customers at every stage of the buying journey.",
  },
  {
    title: "Social Media",
    description:
      "Strategic content creation and community management across Instagram, LinkedIn, Facebook, TikTok, and X to build brand awareness and engagement.",
  },
  {
    title: "AI Chatbots",
    description:
      "Intelligent conversational agents that qualify leads, answer FAQs, and book appointments 24/7, reducing your support costs and increasing conversions.",
  },
  {
    title: "Brand Identity",
    description:
      "Logos, colour systems, typography, and brand guidelines that create instant recognition and build trust with your target audience.",
  },
]

const benefits = [
  {
    title: "Proven Local Results",
    description:
      "We have helped businesses across the UK and US grow their organic traffic and revenue with strategies tailored to local market conditions.",
  },
  {
    title: "Transparent Monthly Reporting",
    description:
      "You get clear, jargon-free reports every month showing exactly what we have achieved and what we are working on next.",
  },
  {
    title: "Full-Service Under One Roof",
    description:
      "From brand identity to AI automation, our team handles every aspect of your digital presence so you can focus on running your business.",
  },
]

export async function generateStaticParams() {
  return Object.keys(cities).map((city) => ({ city }))
}

export async function generateMetadata({
  params,
}: {
  params: { city: CitySlug }
}): Promise<Metadata> {
  const city = cities[params.city]
  if (!city) return {}

  const title = `Digital Marketing Agency in ${city.name} | SEO & AI Growth Services`
  const description = `Identimarketing delivers SEO, web development, social media, and AI solutions for businesses in ${city.name}. Get a free strategy consultation today.`.slice(
    0,
    155,
  )

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.identimarketing.com/locations/${params.city}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.identimarketing.com/locations/${params.city}`,
    },
  }
}

export default function CityPage({ params }: { params: { city: CitySlug } }) {
  const city = cities[params.city]

  if (!city) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />
        <main className="flex-1 container py-16 px-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Location Not Found</h1>
          <p className="text-slate-500 mb-6">
            We could not find a page for that location.
          </p>
          <Link
            href="/locations"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-sm font-bold"
          >
            View All Locations
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const slug = params.city
  const pageUrl = `https://www.identimarketing.com/locations/${slug}`

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Identimarketing",
    "@id": pageUrl,
    url: "https://www.identimarketing.com",
    telephone: "+44-20-1234-5678",
    areaServed: {
      "@type": "City",
      name: city.name,
    },
    priceRange: "££",
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Do you offer digital marketing services in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, Identimarketing provides full-service digital marketing in ${city.name} including SEO, web development, social media, and AI solutions.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I get started with digital marketing in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Simply book a free consultation through our website. We will audit your current online presence and recommend the best strategy for your ${city.name} business.`,
        },
      },
      {
        "@type": "Question",
        name: `What digital marketing services do you offer in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `We offer SEO, web development, paid advertising (PPC), social media management, AI chatbots, and brand identity services for businesses in ${city.name}.`,
        },
      },
      {
        "@type": "Question",
        name: `How long before I see results from digital marketing in ${city.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `PPC campaigns can drive results within days. SEO typically shows meaningful improvement in 3-6 months. We provide monthly reports throughout.`,
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
        name: "Locations",
        item: "https://www.identimarketing.com/locations",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: city.name,
        item: pageUrl,
      },
    ],
  }

  const faqs = [
    {
      q: `Do you offer digital marketing services in ${city.name}?`,
      a: `Yes, Identimarketing provides full-service digital marketing in ${city.name} including SEO, web development, social media, and AI solutions.`,
    },
    {
      q: `How do I get started with digital marketing in ${city.name}?`,
      a: `Simply book a free consultation through our website. We will audit your current online presence and recommend the best strategy for your ${city.name} business.`,
    },
    {
      q: `What digital marketing services do you offer in ${city.name}?`,
      a: `We offer SEO, web development, paid advertising (PPC), social media management, AI chatbots, and brand identity services for businesses in ${city.name}.`,
    },
    {
      q: `How long before I see results from digital marketing in ${city.name}?`,
      a: `PPC campaigns can drive results within days. SEO typically shows meaningful improvement in 3-6 months. We provide monthly reports throughout.`,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Script
        id={`ld-local-business-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Script
        id={`ld-faq-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id={`ld-breadcrumb-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 sm:py-28 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <p className="text-blue-300 text-sm font-semibold tracking-widest uppercase mb-4">
              Digital Marketing Agency
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Grow Your Business in{" "}
              <span className="bg-gradient-to-r from-pink-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                {city.name}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
              Identimarketing helps {city.name} businesses attract more customers online through
              SEO, web development, social media, and AI-powered growth strategies.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-sm font-bold shadow-lg hover:scale-[1.03] transition-transform duration-200"
            >
              Get a Free Strategy Call
            </Link>
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
              <Link href="/locations" className="hover:text-slate-900 transition-colors">
                Locations
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-medium">{city.name}</span>
            </nav>
          </div>
        </div>

        {/* Services section */}
        <section className="py-16 sm:py-20 px-4 bg-white">
          <div className="container max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
                Services We Offer in {city.name}
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Everything your business needs to win online, delivered by a single specialist team.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose section */}
        <section className="py-16 sm:py-20 px-4 bg-slate-50">
          <div className="container max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
                Why Choose Identimarketing in {city.name}?
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                We combine local market knowledge with proven digital expertise to deliver results that matter.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-sm">{i + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section className="py-16 sm:py-20 px-4 bg-white">
          <div className="container max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500">
                Common questions about our digital marketing services in {city.name}.
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer select-none list-none">
                    <span className="font-semibold text-slate-900 text-sm sm:text-base">
                      {faq.q}
                    </span>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-open:rotate-45 transition-transform duration-200">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5">
                    <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          <div className="container max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Grow Your {city.name} Business?
            </h2>
            <p className="text-slate-300 mb-8 text-lg">
              Book a free, no-obligation consultation and we will show you exactly how we can help.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 text-white text-sm font-bold shadow-lg hover:scale-[1.03] transition-transform duration-200"
            >
              Book Your Free Consultation
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
