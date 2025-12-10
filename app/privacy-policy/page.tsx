import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container max-w-4xl py-8 sm:py-12 px-4 sm:px-6">
          <Button variant="ghost" className="mb-6 sm:mb-8 group text-xs sm:text-sm h-8 sm:h-9" asChild>
            <Link href="/" className="flex items-center">
              <ArrowLeft className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
              Back to home
            </Link>
          </Button>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8">Privacy Policy</h1>
          
          <div className="prose prose-sm sm:prose-base max-w-none">
            <p>Last updated: May 15, 2025</p>
            
            <h2>1. Introduction</h2>
            <p>At Identimarketing ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website or use our services.</p>
            
            <h2>2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, phone number, company name, and other contact details you provide when filling out forms on our website.</li>
              <li><strong>Usage Data:</strong> Information about how you use our website, including pages visited, time spent on pages, and other analytical data.</li>
              <li><strong>Technical Data:</strong> IP address, browser type and version, device information, and other technology identifiers.</li>
              <li><strong>Marketing Preferences:</strong> Your preferences in receiving marketing communications from us.</li>
            </ul>
            
            <h2>3. How We Collect Your Information</h2>
            <p>We collect information through:</p>
            <ul>
              <li>Direct interactions when you fill out forms, subscribe to newsletters, or contact us.</li>
              <li>Automated technologies such as cookies and similar tracking technologies.</li>
              <li>Third parties such as analytics providers and advertising networks.</li>
            </ul>
            
            <h2>4. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul>
              <li>To provide and maintain our services.</li>
              <li>To notify you about changes to our services.</li>
              <li>To allow you to participate in interactive features of our website.</li>
              <li>To provide customer support.</li>
              <li>To gather analysis or valuable information to improve our services.</li>
              <li>To monitor the usage of our services.</li>
              <li>To detect, prevent, and address technical issues.</li>
              <li>To provide you with news, special offers, and general information about other goods, services, and events which we offer.</li>
            </ul>
            
            <h2>5. Data Retention</h2>
            <p>We will retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including for the purposes of satisfying any legal, accounting, or reporting requirements.</p>
            
            <h2>6. Data Security</h2>
            <p>We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.</p>
            
            <h2>7. Your Data Protection Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li>The right to access your personal data.</li>
              <li>The right to request correction of your personal data.</li>
              <li>The right to request erasure of your personal data.</li>
              <li>The right to object to processing of your personal data.</li>
              <li>The right to request restriction of processing your personal data.</li>
              <li>The right to request transfer of your personal data.</li>
              <li>The right to withdraw consent.</li>
            </ul>
            
            <h2>8. Cookies</h2>
            <p>We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
            
            <h2>9. Third-Party Links</h2>
            <p>Our website may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.</p>
            
            <h2>10. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
            
            <h2>11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <ul>
              <li>By email: privacy@identimarketing.com</li>
              <li>By phone: +1 (555) 123-4567</li>
              <li>By mail: 123 Marketing Street, Digital City, DC 12345</li>
            </ul>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}