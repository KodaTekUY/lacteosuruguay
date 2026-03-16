import type { MetadataRoute } from "next"
import { buildCanonicalUrl } from "@/lib/seo/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/producto/", "/oferta/", "/categoria/"],
    },
    sitemap: buildCanonicalUrl("/sitemap.xml"),
  }
}
