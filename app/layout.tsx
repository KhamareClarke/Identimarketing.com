import './globals.css'
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AnimatedGradientBackground } from "@/components/animated-gradient-background"
import { FloatingElements } from "@/components/floating-elements"
import Script from 'next/script'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.identimarketing.com'),
  title: {
    default: 'Identimarketing - Premier Digital Marketing Agency in UK & US | SEO Services',
    template: '%s | Identimarketing'
  },
  description: 'Transform your online presence with Identimarketing. Expert digital marketing, SEO, web development, and AI solutions for businesses across the UK and US. Get results that matter.',
  keywords: [
    'digital marketing agency',
    'SEO services',
    'web development',
    'social media marketing',
    'brand identity',
    'AI marketing solutions',
    'UK marketing agency',
    'US marketing agency',
    'Stoke-on-Trent',
    'London',
    'New York'
  ],
  authors: [{ name: 'Identimarketing Team' }],
  creator: 'Identimarketing',
  publisher: 'Identimarketing',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://www.identimarketing.com',
    siteName: 'Identimarketing',
    title: 'Identimarketing - Premier Digital Marketing Agency in UK & US',
    description: 'Transform your online presence with expert digital marketing, SEO, web development, and AI solutions. Trusted by businesses across the UK and US.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Identimarketing - Digital Marketing Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@identimarketing',
    creator: '@identimarketing',
    title: 'Identimarketing - Premier Digital Marketing Agency',
    description: 'Expert digital marketing, SEO, web development, and AI solutions for UK & US businesses.',
    images: ['/logo.png'],
  },
  alternates: {
    canonical: 'https://www.identimarketing.com',
  },
}

import { PagePreloader } from "@/components/page-preloader";
import { OnboardingProvider } from "@/components/onboarding-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1E40AF" />
      </head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <OnboardingProvider>
            <AnimatedGradientBackground />
            <FloatingElements />
            <PagePreloader>
              {children}
            </PagePreloader>
            <Toaster />
          </OnboardingProvider>
        </ThemeProvider>
        
        {/* Structured Data - Organization */}
        <Script
          id="structured-data-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Identimarketing",
              alternateName: "iDENTI-Marketing",
              url: "https://www.identimarketing.com",
              logo: "https://www.identimarketing.com/logo.png",
              description: "Premier digital marketing agency specializing in AI-powered SEO, web development, and digital marketing solutions for UK and US businesses.",
              sameAs: [
                "https://www.facebook.com/identimarketing",
                "https://twitter.com/identimarketing",
                "https://www.linkedin.com/company/identimarketing",
                "https://www.instagram.com/identimarketing"
              ],
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  telephone: "+44-20-1234-5678",
                  contactType: "customer service",
                  areaServed: ["GB", "US"],
                  availableLanguage: ["en"],
                  email: "info@identimarketing.com"
                }
              ],
              address: {
                "@type": "PostalAddress",
                streetAddress: "123 Digital Avenue",
                addressLocality: "London",
                postalCode: "EC1A 1BB",
                addressCountry: "GB"
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "127",
                bestRating: "5",
                worstRating: "1"
              }
            })
          }}
        />
        
        {/* Structured Data - LocalBusiness */}
        <Script
          id="structured-data-local-business"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "@id": "https://www.identimarketing.com/#organization",
              name: "Identimarketing",
              image: "https://www.identimarketing.com/logo.png",
              priceRange: "££",
              telephone: "+44-20-1234-5678",
              email: "info@identimarketing.com",
              address: {
                "@type": "PostalAddress",
                streetAddress: "123 Digital Avenue",
                addressLocality: "London",
                addressRegion: "Greater London",
                postalCode: "EC1A 1BB",
                addressCountry: "GB"
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "51.5074",
                longitude: "-0.1278"
              },
              url: "https://www.identimarketing.com",
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "09:00",
                  closes: "18:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: "Saturday",
                  opens: "10:00",
                  closes: "16:00"
                }
              ],
              areaServed: [
                {
                  "@type": "City",
                  name: "London"
                },
                {
                  "@type": "City",
                  name: "Manchester"
                },
                {
                  "@type": "City",
                  name: "Birmingham"
                },
                {
                  "@type": "City",
                  name: "Stoke-on-Trent"
                }
              ]
            })
          }}
        />
        
        {/* Structured Data - Service */}
        <Script
          id="structured-data-service"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              serviceType: "Digital Marketing Services",
              provider: {
                "@type": "Organization",
                name: "Identimarketing",
                url: "https://www.identimarketing.com"
              },
              areaServed: ["GB", "US"],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Digital Marketing Services",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "SEO Services",
                      description: "Comprehensive SEO services including local SEO, technical SEO, and content optimization"
                    }
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Web Development",
                      description: "Custom website and app development with e-commerce and CMS integration"
                    }
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Digital Marketing",
                      description: "PPC campaigns, email marketing, and conversion optimization"
                    }
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "AI Solutions",
                      description: "AI-powered chatbots and voice assistants for automated lead capture"
                    }
                  }
                ]
              }
            })
          }}
        />
      </body>
    </html>
  )
}