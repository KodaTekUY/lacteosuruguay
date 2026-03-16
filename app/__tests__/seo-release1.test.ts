import { afterEach, describe, expect, it, vi } from "vitest"

const ORIGINAL_SITE_URL = process.env.SITE_URL

async function importWithFreshModules() {
  vi.resetModules()
  const home = await import("@/app/page")
  const admin = await import("@/app/admin/page")
  const robotsModule = await import("@/app/robots")
  const sitemapModule = await import("@/app/sitemap")

  return {
    home,
    admin,
    robots: robotsModule.default,
    sitemap: sitemapModule.default,
  }
}

afterEach(() => {
  if (ORIGINAL_SITE_URL === undefined) {
    delete process.env.SITE_URL
  } else {
    process.env.SITE_URL = ORIGINAL_SITE_URL
  }
})

describe("release 1 SEO setup", () => {
  it("exposes home canonical metadata", async () => {
    process.env.SITE_URL = "https://lacteos.example.com"
    const { home } = await importWithFreshModules()

    expect(typeof home.generateMetadata).toBe("function")

    const metadata = await home.generateMetadata()
    expect(metadata.alternates?.canonical).toBe("https://lacteos.example.com/")
  })

  it("marks admin as noindex", async () => {
    const { admin } = await importWithFreshModules()
    expect(admin.metadata.robots).toEqual({
      index: false,
      follow: false,
    })
  })

  it("returns robots rules with release 1 disallow paths", async () => {
    process.env.SITE_URL = "https://lacteos.example.com"
    const { robots } = await importWithFreshModules()
    const rules = robots()

    expect(rules.sitemap).toBe("https://lacteos.example.com/sitemap.xml")
    const singleRule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules
    expect(singleRule.allow).toBe("/")
    expect(singleRule.disallow).toEqual(
      expect.arrayContaining(["/admin", "/api", "/producto/", "/oferta/", "/categoria/"]),
    )
  })

  it("returns a sitemap with only home page", async () => {
    process.env.SITE_URL = "https://lacteos.example.com"
    const { sitemap } = await importWithFreshModules()
    const entries = await sitemap()

    expect(entries).toHaveLength(1)
    expect(entries[0]?.url).toBe("https://lacteos.example.com/")
  })
})
