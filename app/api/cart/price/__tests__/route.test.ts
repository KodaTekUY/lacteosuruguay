import { beforeEach, describe, expect, it, vi } from "vitest"

const priceCartMock = vi.fn()
const getCartPricingServiceMock = vi.fn(() => ({
  priceCart: priceCartMock,
}))

vi.mock("@/lib/cart-pricing", () => ({
  getCartPricingService: getCartPricingServiceMock,
}))

describe("POST /api/cart/price", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv("NODE_ENV", "test")
  })

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("@/app/api/cart/price/route")
    const request = new Request("http://localhost/api/cart/price", {
      method: "POST",
      body: "{invalid json",
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe("Invalid JSON body")
  })

  it("returns 400 for invalid payload schema", async () => {
    const { POST } = await import("@/app/api/cart/price/route")
    const request = new Request("http://localhost/api/cart/price", {
      method: "POST",
      body: JSON.stringify({ wrong: [] }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe("items must be an array")
  })

  it("returns priced cart for valid payload", async () => {
    priceCartMock.mockResolvedValueOnce({
      items: [],
      dealsApplied: [],
      totals: { baseTotal: 100, discountTotal: 20, finalTotal: 80 },
    })

    const { POST } = await import("@/app/api/cart/price/route")
    const request = new Request("http://localhost/api/cart/price", {
      method: "POST",
      body: JSON.stringify({ items: [{ productId: 1, qty: 2 }] }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.totals.finalTotal).toBe(80)
    expect(priceCartMock).toHaveBeenCalledWith([{ productId: 1, qty: 2 }])
  })

  it("returns 400 when cart contains invalid products", async () => {
    priceCartMock.mockRejectedValueOnce({ name: "InvalidCartProductsError" })

    const { POST } = await import("@/app/api/cart/price/route")
    const request = new Request("http://localhost/api/cart/price", {
      method: "POST",
      body: JSON.stringify({ items: [{ productId: 999, qty: 1 }] }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe("One or more products are invalid or unavailable")
  })

  it("returns 500 with generic error in production mode", async () => {
    vi.stubEnv("NODE_ENV", "production")
    priceCartMock.mockRejectedValueOnce(new Error("db exploded"))

    const { POST } = await import("@/app/api/cart/price/route")
    const request = new Request("http://localhost/api/cart/price", {
      method: "POST",
      body: JSON.stringify({ items: [{ productId: 1, qty: 1 }] }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe("Internal server error")
  })
})
