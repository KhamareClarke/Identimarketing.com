import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TermsConditionsPage() {
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
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-sm sm:prose-base max-w-none">
            <p>Last updated: May 15, 2025</p>
            
            <h2>1. Introduction</h2>
            <p>These Terms and Conditions ("Terms") govern your use of the Identimarketing website and services. By accessing or using our website and services, you agree to be bound by these Terms.</p>
            
            <h2>2. Definitions</h2>
            <ul>
              <li><strong>"Company," "we," "us," or "our"</strong> refers to Identimarketing.</li>
              <li><strong>"Website"</strong> refers to Identimarketing's website.</li>
              <li><strong>"Services"</strong> refers to the digital marketing, SEO, web development, and other services provided by Identimarketing.</li>
              <li><strong>"You"</strong> refers to the individual accessing or using the Website and Services, or the company or other legal entity on behalf of which such individual is accessing or using the Website and Services.</li>
            </ul>
            
            <h2>3. Use of Our Website and Services</h2>
            <p>By using our Website and Services, you agree to:</p>
            <ul>
              <li>Use our Website and Services only for lawful purposes and in accordance with these Terms.</li>
              <li>Not use our Website and Services in any way that violates any applicable federal, state, local, or international law or regulation.</li>
              <li>Not use our Website and Services to transmit or send unsolicited commercial communications.</li>
              <li>Not attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of our Website and Services.</li>
            </ul>
            
            <h2>4. Intellectual Property</h2>
            <p>The Website and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof) are owned by the Company, its licensors, or other providers of such material and are protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
            
            <h2>5. User Content</h2>
            <p>Any content you submit to our Website or provide to us in connection with our Services ("User Content") remains your property. However, by providing User Content to us, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such User Content in connection with providing our Services to you.</p>
            
            <h2>6. Service Agreements</h2>
            <p>Our Services are subject to separate service agreements that will be provided to you before commencement of any work. These service agreements will outline specific terms, deliverables, timelines, and payment terms for the Services you engage us to provide.</p>
            
            <h2>7. Payment Terms</h2>
            <p>Payment terms for our Services will be outlined in the service agreements. Generally, we require a deposit before commencing work, with the balance due upon completion or according to an agreed payment schedule for ongoing services.</p>
            
            <h2>8. Limitation of Liability</h2>
            <p>To the fullest extent permitted by applicable law, the Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Services.</p>
            
            <h2>9. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless the Company, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Website and Services.</p>
            
            <h2>10. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law principles.</p>
            
            <h2>11. Changes to These Terms</h2>
            <p>We may revise and update these Terms from time to time in our sole discretion. All changes are effective immediately when we post them. Your continued use of the Website and Services following the posting of revised Terms means that you accept and agree to the changes.</p>
            
            <h2>12. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <ul>
              <li>By email: legal@identimarketing.com</li>
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