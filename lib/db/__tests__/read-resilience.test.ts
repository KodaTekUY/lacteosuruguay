import { beforeEach, describe, expect, it, vi } from "vitest"

type SqlQueryHandler = (query: string, values: unknown[]) => unknown[] | Promise<unknown[]>

let taggedQueries: string[] = []
let queryMethodCalls: Array<{ query: string; values: unknown[] }> = []
let queryHandler: SqlQueryHandler = () => []

function normalizeSql(sqlText: string): string {
  return sqlText.replace(/\s+/g, " ").trim()
}

function createSqlMock() {
  const tagged = vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = normalizeSql(strings.join(" "))
    taggedQueries.push(query)
    return (await queryHandler(query, values)) as unknown[]
  }) as ReturnType<typeof vi.fn> & {
    query: (query: string, values?: unknown[]) => Promise<unknown[]>
    transaction: ReturnType<typeof vi.fn>
  }

  tagged.query = vi.fn(async (query: string, values: unknown[] = []) => {
    const normalized = normalizeSql(query)
    queryMethodCalls.push({ query: normalized, values })
    return (await queryHandler(normalized, values)) as unknown[]
  })

  tagged.transaction = vi.fn()
  return tagged
}

let sqlMock = createSqlMock()

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => sqlMock),
}))

async function loadDbModule() {
  vi.resetModules()
  return import("@/lib/db")
}

describe("db reads and updates resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv("NODE_ENV", "test")
    process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test"
    delete process.env.ALLOW_DB_FALLBACK
    taggedQueries = []
    queryMethodCalls = []
    queryHandler = () => []
    sqlMock = createSqlMock()
  })

  it("throws in production when a DB read fails instead of silently using fallback data", async () => {
    vi.stubEnv("NODE_ENV", "production")
    queryHandler = () => {
      throw new Error("db unavailable")
    }

    const { getCategories } = await loadDbModule()

    await expect(getCategories()).rejects.toThrow("Error fetching categories")
  })

  it("loads active deals with batched relation queries (no N+1)", async () => {
    queryHandler = (query) => {
      if (query.includes("FROM deals") && query.includes("WHERE is_active = true")) {
        return [
          {
            id: 1,
            title: "A",
            description: null,
            image: null,
            button_text: "Agregar",
            button_link: null,
            deal_type: "bundle",
            apply_mode: "once",
            starts_at: null,
            ends_at: null,
            is_active: true,
          },
          {
            id: 2,
            title: "B",
            description: null,
            image: null,
            button_text: "Agregar",
            button_link: null,
            deal_type: "bundle",
            apply_mode: "once",
            starts_at: null,
            ends_at: null,
            is_active: true,
          },
        ]
      }

      if (query.includes("FROM deal_products dp") && query.includes("ANY(")) {
        return [
          {
            id: 11,
            deal_id: 1,
            product_id: 101,
            quantity: 1,
            p_id: 101,
            name: "Prod 101",
            price: "10",
            image: null,
            category_id: 1,
            is_popular: true,
            is_active: true,
          },
          {
            id: 12,
            deal_id: 2,
            product_id: 102,
            quantity: 2,
            p_id: 102,
            name: "Prod 102",
            price: "20",
            image: null,
            category_id: 2,
            is_popular: false,
            is_active: true,
          },
        ]
      }

      if (query.includes("FROM deal_tiers") && query.includes("ANY(")) {
        return [
          { id: 21, deal_id: 1, min_qty: 1, max_qty: null, total_price: 9, unit_price: null, discount_pct: null },
          { id: 22, deal_id: 2, min_qty: 1, max_qty: null, total_price: 35, unit_price: null, discount_pct: null },
        ]
      }

      return []
    }

    const { getActiveDeals } = await loadDbModule()
    const deals = await getActiveDeals()

    expect(deals).toHaveLength(2)
    expect(deals[0].products).toHaveLength(1)
    expect(deals[1].products?.[0].quantity).toBe(2)
    expect(deals[0].tiers).toHaveLength(1)
    expect(taggedQueries).toHaveLength(3)
  })

  it("uses dynamic update SQL so nullable fields can be explicitly set to null", async () => {
    queryHandler = (query, values) => {
      if (query.startsWith("UPDATE products SET")) {
        return [
          {
            id: Number(values[values.length - 1]),
            name: "Leche",
            price: 123,
            image: values[0],
            images: values[1],
            category_id: null,
            is_popular: true,
            is_active: true,
          },
        ]
      }
      return []
    }

    const { updateProduct } = await loadDbModule()
    const updated = await updateProduct(7, { image: null, images: [] })

    expect(updated?.image).toBeNull()
    expect(updated?.images).toEqual([])
    expect(queryMethodCalls).toHaveLength(1)
    expect(queryMethodCalls[0].query).toContain("image = $1")
    expect(queryMethodCalls[0].query).toContain("images = $2")
    expect(queryMethodCalls[0].values[0]).toBeNull()
    expect(queryMethodCalls[0].values[1]).toEqual([])
  })

  it("applies active-product filter to catalog pagination queries", async () => {
    queryHandler = (query) => {
      if (query.includes("COUNT(*)::int AS total_items")) {
        return [{ total_items: 1 }]
      }

      if (query.includes("SELECT p.id, p.name, p.price")) {
        return [
          {
            id: 1,
            name: "Leche Entera",
            price: "78.00",
            image: "https://cdn.example.com/leche-1.png",
            images: ["https://cdn.example.com/leche-1.png", "https://cdn.example.com/leche-2.png"],
            category_id: 1,
            is_popular: true,
            is_active: true,
            category_name: "Leches",
          },
        ]
      }

      return []
    }

    const { getCatalogProductsPage } = await loadDbModule()
    await getCatalogProductsPage({ page: 1, pageSize: 16 })

    expect(queryMethodCalls).toHaveLength(2)
    expect(queryMethodCalls[0].query).toContain("WHERE p.is_active = true")
    expect(queryMethodCalls[1].query).toContain("WHERE p.is_active = true")
  })

  it("returns product galleries from DB reads", async () => {
    queryHandler = (query) => {
      if (query.includes("FROM products p") && query.includes("WHERE p.id =")) {
        return [
          {
            id: 9,
            name: "Yogur",
            price: "99.00",
            image: "https://cdn.example.com/yogur-1.png",
            images: ["https://cdn.example.com/yogur-1.png", "https://cdn.example.com/yogur-2.png"],
            category_id: 2,
            is_popular: true,
            is_active: true,
            category_name: "Yogures",
          },
        ]
      }

      return []
    }

    const { getProductById } = await loadDbModule()
    const product = await getProductById(9)

    expect(product?.image).toBe("https://cdn.example.com/yogur-1.png")
    expect(product?.images).toEqual([
      "https://cdn.example.com/yogur-1.png",
      "https://cdn.example.com/yogur-2.png",
    ])
  })
})
