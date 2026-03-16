import type React from "react"
import type { Metadata } from "next"
import { Sora, IBM_Plex_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SiteFooter } from "@/components/site-footer"
import { CartProvider } from "@/context/cart-context"
import { getBrandName, getSiteOrigin } from "@/lib/seo/site"

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["400", "500", "600", "700"] })
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-geist-mono", weight: ["400", "500", "600"] })

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: `${getBrandName()} | Tienda online`,
    template: `%s | ${getBrandName()}`,
  },
  description: "Tienda online de productos lácteos con carrito y envío por WhatsApp.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_UY",
    title: `${getBrandName()} | Tienda online`,
    description: "Tienda online de productos lácteos con carrito y envío por WhatsApp.",
    siteName: getBrandName(),
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${getBrandName()} | Tienda online`,
    description: "Tienda online de productos lácteos con carrito y envío por WhatsApp.",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${sora.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <SiteFooter />
          </div>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
