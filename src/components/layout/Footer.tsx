import { siteConfig } from '@/lib/siteConfig'
import { AdSlot } from '@/components/ads/AdSlot'

export const Footer = () => (
  <footer className="border-t bg-muted/40 mt-12">
    <div className="container mx-auto px-4 py-4 flex justify-center">
      <AdSlot placement="footer" />
    </div>
    <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} {siteConfig.siteName}
    </div>
  </footer>
)
