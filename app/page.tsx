import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PageLayout } from "@/components/layout/page-layout"
import { HeroSection } from "@/components/hero-section"
import { ServicesSection } from "@/components/services-section"
import { PricingSection } from "@/components/pricing-section"
import { LocationsSection } from "@/components/locations-section"
import { TeamSection } from "@/components/team-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import BlogPreviewSection from "@/components/blog-preview-section"
import { AnimatedSection } from "@/components/animated-section"
import { CTASection } from "@/components/cta-section"
import { ContactSection } from "@/components/contact-section"
import ScarcityPopup from "@/components/scarcity-popup"
import AIChatBot from "@/components/ai-chat-bot"
import ShortContactForm from "@/components/short-contact-form"
import CookieConsent from "@/components/cookie-consent"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'iDENTI-Marketing | AI-Powered SEO & Digital Marketing Agency UK & US',
  description: 'AI-powered SEO, digital marketing, and web development for ambitious businesses in London, Manchester, Stoke-on-Trent, and across the UK & US. Book your free strategy call or get a free SEO audit today!',
  keywords: 'SEO, AI marketing, web development, digital marketing, Stoke-on-Trent, London, Manchester, UK, US, free audit, strategy call, lead generation, conversion',
  openGraph: {
    title: 'iDENTI-Marketing | AI-Powered SEO & Digital Marketing Agency',
    description: 'AI-powered SEO, digital marketing, and web development for ambitious businesses. Book your free strategy call today!',
    url: 'https://www.identimarketing.com',
    siteName: 'Identimarketing',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Identimarketing - AI-Powered Digital Marketing',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iDENTI-Marketing | AI-Powered SEO & Digital Marketing',
    description: 'AI-powered SEO, digital marketing, and web development for ambitious businesses in the UK & US.',
    images: ['/logo.png'],
  },
  alternates: {
    canonical: 'https://www.identimarketing.com',
  },
  robots: 'index,follow',
}

export default function Home() {
  // CookieConsent is mounted globally for compliance

  return (
    <>
      <CookieConsent />
      <PageLayout>
      <SiteHeader />
      <main className="flex-1">
        <AnimatedSection direction="up"><HeroSection /></AnimatedSection>
        <AnimatedSection direction="left"><ServicesSection /></AnimatedSection>
        <AnimatedSection direction="right"><PricingSection /></AnimatedSection>
        <AnimatedSection direction="up"><LocationsSection /></AnimatedSection>
        <AnimatedSection direction="left"><TeamSection /></AnimatedSection>
        <AnimatedSection direction="up"><TestimonialsSection /></AnimatedSection>
        <AnimatedSection direction="left"><BlogPreviewSection /></AnimatedSection>
        <AnimatedSection direction="right"><CTASection /></AnimatedSection>
        <AnimatedSection direction="up"><ContactSection /></AnimatedSection>
              </main>
      <SiteFooter />
      <ScarcityPopup />
      <AIChatBot />
      </PageLayout>
    </>
  );
}