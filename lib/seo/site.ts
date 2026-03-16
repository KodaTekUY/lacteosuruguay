const DEFAULT_SITE_URL = "http://localhost:3000"
const DEFAULT_BRAND_NAME = "Lácteos"

function parseSiteUrl(value: string | undefined): URL {
  if (!value) {
    return new URL(DEFAULT_SITE_URL)
  }

  try {
    return new URL(value)
  } catch {
    return new URL(DEFAULT_SITE_URL)
  }
}

export function getSiteOrigin(): string {
  return parseSiteUrl(process.env.SITE_URL).origin
}

export function buildCanonicalUrl(pathname: string): string {
  const safePath = pathname.startsWith("/") ? pathname : `/${pathname}`
  return new URL(safePath, getSiteOrigin()).toString()
}

export function getBrandName(): string {
  const value = process.env.BRAND_NAME?.trim()
  return value && value.length > 0 ? value : DEFAULT_BRAND_NAME
}

export function getHomeStructuredData(): Array<Record<string, unknown>> {
  const brandName = getBrandName()
  const homeUrl = buildCanonicalUrl("/")

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: brandName,
      url: homeUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: brandName,
      url: homeUrl,
      inLanguage: "es-UY",
    },
  ]
}
