import { beforeEach, describe, expect, it, vi } from "vitest"

type QueryHandler = (query: string, values: unknown[]) => unknown[] | Promise<unknown[]>

let queryHandler: QueryHandler = () => []

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim()
}

function createSqlMock() {
  return vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = normalizeQuery(strings.join(" "))
    return (await queryHandler(query, values)) as unknown[]
  })
}

let sqlMock = createSqlMock()

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => sqlMock),
}))

describe("CartPricingService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sqlMock = createSqlMock()
    queryHandler = () => []
  })

  it("loads data from DB and applies deals through the pricing engine", async () => {
    queryHandler = (query) => {
      if (query.includes("SELECT id, price") && query.includes("FROM products")) {
        return [{ id: 1, price: "10.00" }]
      }

      if (query.includes("WITH relevant_deals AS")) {
        return [
          {
            deal_id: 11,
            title: "Promo tier",
            deal_type: "tiered_total",
            apply_mode: "once",
            is_active: true,
            starts_at: null,
            ends_at: null,
            product_id: 1,
            product_quantity: 1,
            tier_id: 21,
            tier_min_qty: 1,
            tier_max_qty: null,
            tier_total_price: "15.00",
            tier_unit_price: null,
            tier_discount_pct: null,
          },
        ]
      }

      return []
    }

    const { CartPricingService } = await import("@/lib/cart-pricing/service")
    const service = new CartPricingService("postgres://test:test@localhost:5432/test")
    const result = await service.priceCart([{ productId: 1, qty: 2 }], new Date("2026-02-26T00:00:00.000Z"))

    expect(result.totals.baseTotal).toBe(20)
    expect(result.totals.discountTotal).toBe(5)
    expect(result.totals.finalTotal).toBe(15)
    expect(result.dealsApplied).toHaveLength(1)
  })

  it("throws when cart contains products missing in DB", async () => {
    queryHandler = (query) => {
      if (query.includes("SELECT id, price") && query.includes("FROM products")) {
        return [{ id: 1, price: "10.00" }]
      }

      if (query.includes("WITH relevant_deals AS")) {
        return []
      }

      return []
    }

    const { CartPricingService, InvalidCartProductsError } = await import("@/lib/cart-pricing/service")
    const service = new CartPricingService("postgres://test:test@localhost:5432/test")

    await expect(service.priceCart([{ productId: 1, qty: 1 }, { productId: 999, qty: 1 }])).rejects.toMatchObject({
      name: "InvalidCartProductsError",
      productIds: [999],
    })

    await expect(service.priceCart([{ productId: 999, qty: 1 }])).rejects.toBeInstanceOf(InvalidCartProductsError)
  })

  it("loads product prices only for active products", async () => {
    let productPriceQuery = ""

    queryHandler = (query) => {
      if (query.includes("SELECT id, price") && query.includes("FROM products")) {
        productPriceQuery = query
        return []
      }

      if (query.includes("WITH relevant_deals AS")) {
        return []
      }

      return []
    }

    const { CartPricingService } = await import("@/lib/cart-pricing/service")
    const service = new CartPricingService("postgres://test:test@localhost:5432/test")

    await expect(service.priceCart([{ productId: 1, qty: 1 }])).rejects.toMatchObject({
      name: "InvalidCartProductsError",
    })
    expect(productPriceQuery).toContain("is_active = true")
  })
})
