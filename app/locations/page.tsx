import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LocationsSection } from "@/components/locations-section"

export default function LocationsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-background/90">
      <SiteHeader />
      <main className="flex-1">
        <LocationsSection />
      </main>
      <SiteFooter />
    </div>
  )
}