import { afterEach, describe, expect, it } from "vitest"
import {
  buildCanonicalUrl,
  getBrandName,
  getHomeStructuredData,
  getSiteOrigin,
} from "@/lib/seo/site"

const ORIGINAL_SITE_URL = process.env.SITE_URL
const ORIGINAL_BRAND_NAME = process.env.BRAND_NAME

afterEach(() => {
  if (ORIGINAL_SITE_URL === undefined) {
    delete process.env.SITE_URL
  } else {
    process.env.SITE_URL = ORIGINAL_SITE_URL
  }

  if (ORIGINAL_BRAND_NAME === undefined) {
    delete process.env.BRAND_NAME
  } else {
    process.env.BRAND_NAME = ORIGINAL_BRAND_NAME
  }
})

describe("seo site helpers", () => {
  it("builds canonical URLs using SITE_URL", () => {
    process.env.SITE_URL = "https://lacteos.example.com/"

    expect(getSiteOrigin()).toBe("https://lacteos.example.com")
    expect(buildCanonicalUrl("/producto/10")).toBe("https://lacteos.example.com/producto/10")
    expect(buildCanonicalUrl("categoria/quesos")).toBe("https://lacteos.example.com/categoria/quesos")
  })

  it("falls back to localhost when SITE_URL is missing", () => {
    delete process.env.SITE_URL

    expect(getSiteOrigin()).toBe("http://localhost:3000")
    expect(buildCanonicalUrl("/")).toBe("http://localhost:3000/")
  })

  it("resolves brand name with fallback", () => {
    delete process.env.BRAND_NAME
    expect(getBrandName()).toBe("Lácteos")

    process.env.BRAND_NAME = "Mi Lactea"
    expect(getBrandName()).toBe("Mi Lactea")
  })

  it("returns organization and website structured data for home", () => {
    process.env.SITE_URL = "https://lacteos.example.com"
    process.env.BRAND_NAME = "Lácteos del Barrio"

    const data = getHomeStructuredData()
    expect(data).toHaveLength(2)
    expect(data[0]).toMatchObject({
      "@type": "Organization",
      name: "Lácteos del Barrio",
      url: "https://lacteos.example.com/",
    })
    expect(data[1]).toMatchObject({
      "@type": "WebSite",
      name: "Lácteos del Barrio",
      url: "https://lacteos.example.com/",
      inLanguage: "es-UY",
    })
  })
})
