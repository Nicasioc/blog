import { siteConfig } from '@/lib/siteConfig'
import { AdSlot } from '@/components/ads/AdSlot'

export const Footer = () => (
  <footer className="bg-primary border-brand-secondary mt-16 border-t-4">
    <div className="container mx-auto flex justify-center px-4 py-4 empty:hidden">
      <AdSlot placement="footer" />
    </div>
    <p className="text-primary-foreground/60 container mx-auto px-4 py-6 text-center text-xs">
      &copy; {new Date().getFullYear()} {siteConfig.siteName}. All rights reserved.
    </p>
  </footer>
)
