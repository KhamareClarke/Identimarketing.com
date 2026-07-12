import { MetadataRoute } from 'next'

const BASE = 'https://www.identimarketing.com'

const services = [
  'website-development',
  'seo-services',
  'digital-marketing',
  'social-media',
  'ai-solutions',
  'brand-identity',
]

const blogSlugs = [
  '10-seo-strategies-that-actually-work-in-2025',
  'how-ai-is-transforming-digital-marketing',
  'building-a-brand-that-resonates-with-your-audience',
  'social-media-trends-to-watch-in-2025',
  'the-ultimate-guide-to-content-marketing',
  'website-design-principles-for-higher-conversion-rates',
  'complete-guide-local-seo-uk-businesses',
  'ppc-vs-seo-which-is-right-for-your-business',
  'how-to-increase-website-conversion-rate',
  'ai-chatbots-customer-service-guide',
  'email-marketing-best-practices-2025',
  'how-to-build-a-brand-identity',
  'google-algorithm-updates-what-you-need-to-know',
  'technical-seo-checklist-15-must-fix-issues',
  'pay-per-click-advertising-beginners-guide',
]

const teamSlugs = [
  'khamare-clarke',
  'llewellyn-livingston',
  'fiza-saif',
  'kenza-ike',
]

const locationSlugs = [
  'london',
  'manchester',
  'birmingham',
  'leeds',
  'bristol',
  'stoke-on-trent',
  'new-york',
  'los-angeles',
  'chicago',
  'miami',
]

const glossaryTerms = [
  'seo',
  'local-seo',
  'ppc',
  'cro',
  'content-marketing',
  'backlinks',
  'keyword-research',
  'brand-identity',
  'social-media-marketing',
  'technical-seo',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                       lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/services`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/blog`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/locations`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/glossary`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/team`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/privacy-policy`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms-conditions`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    ...services.map(slug => ({
      url: `${BASE}/services/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
    ...blogSlugs.map(slug => ({
      url: `${BASE}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...teamSlugs.map(slug => ({
      url: `${BASE}/team/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
    ...locationSlugs.map(slug => ({
      url: `${BASE}/locations/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...glossaryTerms.map(term => ({
      url: `${BASE}/glossary/${term}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
