import { beforeEach, describe, expect, it, vi } from "vitest"

let sqlQueryLog: string[] = []
let txQueryLog: string[] = []
let transactionMock = vi.fn()

function createQueryExecutor(log: string[]) {
  const execute = async (query: string) => {
    log.push(query)

    if (query.includes("INSERT INTO deals")) {
      return [
        {
          id: 999,
          title: "Promo test",
          description: null,
          image: null,
          button_text: "Agregar",
          button_link: null,
          is_active: true,
          deal_type: "bundle",
          apply_mode: "once",
          starts_at: null,
          ends_at: null,
        },
      ]
    }

    if (query.includes("UPDATE deals") || query.includes("SELECT * FROM deals")) {
      return [
        {
          id: 999,
          title: "Promo updated",
          description: null,
          image: null,
          button_text: "Agregar",
          button_link: null,
          is_active: true,
          deal_type: "bundle",
          apply_mode: "once",
          starts_at: null,
          ends_at: null,
        },
      ]
    }

    return []
  }

  const tagged = vi.fn(async (strings: TemplateStringsArray) => {
    const query = strings.join(" ")
    return execute(query)
  })

  ;(tagged as ReturnType<typeof vi.fn> & { query: ReturnType<typeof vi.fn> }).query = vi.fn(
    async (query: string) => execute(query),
  )

  return tagged
}

let sqlMock = createQueryExecutor(sqlQueryLog) as ReturnType<typeof createQueryExecutor> & {
  transaction: typeof transactionMock
}

const neonMock = vi.fn(() => sqlMock)

vi.mock("@neondatabase/serverless", () => ({
  neon: neonMock,
}))

async function loadDbModule() {
  vi.resetModules()
  return import("@/lib/db")
}

describe("deal mutations use SQL transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.DATABASE_URL = "postgres://test:test@localhost:5432/test"
    sqlQueryLog = []
    txQueryLog = []

    const tx = createQueryExecutor(txQueryLog)
    transactionMock = vi.fn(async (queriesOrFn: unknown) => {
      if (typeof queriesOrFn !== "function") {
        throw new Error("Expected transaction callback")
      }

      const queries = (queriesOrFn as (txn: typeof tx) => Promise<unknown>[])(tx)
      const results = []
      for (const query of queries) {
        results.push(await query)
      }
      return results
    })

    sqlMock = Object.assign(createQueryExecutor(sqlQueryLog), {
      transaction: transactionMock,
    })
  })

  it("createDeal runs inside a transaction", async () => {
    const { createDeal } = await loadDbModule()

    const created = await createDeal({
      title: "Promo test",
      description: null,
      image: null,
      button_text: "Agregar",
      button_link: null,
      is_active: true,
      deal_type: "bundle",
      apply_mode: "once",
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [{ min_qty: 1, max_qty: null, total_price: 10, unit_price: null, discount_pct: null }],
    })

    expect(created?.id).toBe(999)
    expect(transactionMock).toHaveBeenCalledTimes(1)
    expect(txQueryLog.some((query) => query.includes("INSERT INTO deals"))).toBe(true)
    expect(txQueryLog.some((query) => query.includes("INSERT INTO deal_products"))).toBe(true)
    expect(txQueryLog.some((query) => query.includes("INSERT INTO deal_tiers"))).toBe(true)
  })

  it("updateDeal runs inside a transaction", async () => {
    const { updateDeal } = await loadDbModule()

    const updated = await updateDeal(999, {
      title: "Promo updated",
      products: [{ product_id: 2, quantity: 2 }],
      tiers: [{ min_qty: 1, max_qty: null, total_price: 20, unit_price: null, discount_pct: null }],
    })

    expect(updated?.id).toBe(999)
    expect(transactionMock).toHaveBeenCalledTimes(1)
    expect(txQueryLog.some((query) => query.includes("UPDATE deals"))).toBe(true)
    expect(txQueryLog.some((query) => query.includes("DELETE FROM deal_products"))).toBe(true)
    expect(txQueryLog.some((query) => query.includes("DELETE FROM deal_tiers"))).toBe(true)
  })

  it("deleteDeal runs inside a transaction", async () => {
    const { deleteDeal } = await loadDbModule()

    const deleted = await deleteDeal(999)

    expect(deleted).toBe(true)
    expect(transactionMock).toHaveBeenCalledTimes(1)
    expect(txQueryLog.some((query) => query.includes("DELETE FROM deals"))).toBe(true)
  })
})
