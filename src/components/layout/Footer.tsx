import { siteConfig } from '@/lib/siteConfig'
import { AdSlot } from '@/components/ads/AdSlot'

export const Footer = () => (
  <footer className="bg-primary mt-12">
    <div className="container mx-auto flex justify-center px-4 py-4">
      <AdSlot placement="footer" />
    </div>
    <div className="text-primary-foreground/60 container mx-auto px-4 py-6 text-center text-sm">
      &copy; {new Date().getFullYear()} {siteConfig.siteName}
    </div>
  </footer>
)
