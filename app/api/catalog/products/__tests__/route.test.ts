import { beforeEach, describe, expect, it, vi } from "vitest"

const getCatalogProductsPageMock = vi.fn()

vi.mock("@/lib/db", () => ({
  DEFAULT_CATALOG_PAGE_SIZE: 16,
  getCatalogProductsPage: getCatalogProductsPageMock,
}))

describe("GET /api/catalog/products", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns paginated products", async () => {
    getCatalogProductsPageMock.mockResolvedValueOnce({
      hasMore: true,
      items: [{ id: 1, name: "Leche", price: 10, image: null, category_id: 1, is_popular: true }],
      page: 1,
      pageSize: 16,
      totalItems: 30,
      totalPages: 2,
    })

    const { GET } = await import("@/app/api/catalog/products/route")
    const response = await GET(new Request("http://localhost/api/catalog/products?page=1&pageSize=16") as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(getCatalogProductsPageMock).toHaveBeenCalledWith({
      categoryId: null,
      page: 1,
      pageSize: 16,
      searchQuery: "",
    })
  })

  it("returns 400 for invalid category", async () => {
    const { GET } = await import("@/app/api/catalog/products/route")
    const response = await GET(new Request("http://localhost/api/catalog/products?categoryId=abc") as never)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain("categoryId")
    expect(getCatalogProductsPageMock).not.toHaveBeenCalled()
  })
})
