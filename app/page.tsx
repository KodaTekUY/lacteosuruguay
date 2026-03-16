import type { Metadata } from "next"
import { getCategories, getActiveDeals, getCatalogProductsPage, DEFAULT_CATALOG_PAGE_SIZE } from "@/lib/db"
import { HomeClient } from "@/components/home-client"
import { buildCanonicalUrl, getBrandName, getHomeStructuredData } from "@/lib/seo/site"
import Script from "next/script"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const brandName = getBrandName()
  return {
    title: `${brandName}`,
    description: "Catálogo online de productos lácteos con promociones y pedido por WhatsApp.",
    alternates: {
      canonical: buildCanonicalUrl("/"),
    },
    openGraph: {
      title: `${brandName}`,
      description: "Catálogo online de productos lácteos con promociones y pedido por WhatsApp.",
      url: buildCanonicalUrl("/"),
    },
  }
}

export default async function Home() {
  const structuredData = getHomeStructuredData()
  const [categories, deals, catalogPage] = await Promise.all([
    getCategories(),
    getActiveDeals(),
    getCatalogProductsPage({ page: 1, pageSize: DEFAULT_CATALOG_PAGE_SIZE }),
  ])

  return (
    <>
      {structuredData.map((entry, index) => (
        <Script
          id={`home-structured-data-${index}`}
          key={`home-structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
      <HomeClient
        categories={categories}
        deals={deals}
        initialHasMore={catalogPage.hasMore}
        initialProducts={catalogPage.items}
        initialTotalItems={catalogPage.totalItems}
        pageSize={catalogPage.pageSize}
      />
    </>
  )
}
