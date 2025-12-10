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
  verification: {
    google: 'your-google-verification-code',
  },
}

import { PagePreloader } from "@/components/page-preloader";

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
          <AnimatedGradientBackground />
          <FloatingElements />
          <PagePreloader>
            {children}
          </PagePreloader>
          <Toaster />
        </ThemeProvider>
        
        {/* Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Identimarketing",
              logo: "/logo.png",
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
                  availableLanguage: ["en"]
                }
              ],
              address: {
                "@type": "PostalAddress",
                streetAddress: "123 Digital Avenue",
                addressLocality: "London",
                postalCode: "EC1A 1BB",
                addressCountry: "GB"
              }
            })
          }}
        />
      </body>
    </html>
  )
}