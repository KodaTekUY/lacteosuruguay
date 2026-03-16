import type { MetadataRoute } from "next"
import { buildCanonicalUrl } from "@/lib/seo/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: buildCanonicalUrl("/"),
      lastModified: new Date(),
    },
  ]
}
