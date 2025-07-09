import './globals.css'
import { Toaster } from 'sonner'
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider'

export const metadata = {
  title: 'WALI Livraison - Plateforme de Livraison en Côte d\'Ivoire',
  description: 'Plateforme de livraison multi-services en Côte d\'Ivoire avec paiement mobile intégré',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-background text-foreground antialiased">
        <GoogleMapsProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </GoogleMapsProvider>
      </body>
    </html>
  )
}
