import { describe, expect, it, vi } from "vitest"
import type { PricedCartResult } from "@/types/product"
import { createPricingRequestManager } from "@/context/pricing-request-manager"

type MockResponse = {
  ok: boolean
  json: () => Promise<unknown>
}

type DeferredRequest = {
  reject: (reason?: unknown) => void
  resolve: (value: MockResponse) => void
  signal: AbortSignal | undefined
}

const makeResponse = (result: PricedCartResult, ok: boolean = true): MockResponse => ({
  ok,
  json: async () => result,
})

const makePricedResult = (finalTotal: number): PricedCartResult => ({
  items: [],
  dealsApplied: [],
  totals: {
    baseTotal: finalTotal,
    discountTotal: 0,
    finalTotal,
  },
})

describe("createPricingRequestManager", () => {
  it("aborts previous pricing request when a newer one starts", async () => {
    const pending: DeferredRequest[] = []

    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<MockResponse>((resolve, reject) => {
        const signal = init?.signal
        signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"))
        })
        pending.push({ resolve, reject, signal })
      })
    })

    const manager = createPricingRequestManager(fetchMock as unknown as typeof fetch)

    const firstRunPromise = manager.run([{ productId: 1, qty: 1 }])
    const secondRunPromise = manager.run([{ productId: 1, qty: 2 }])

    pending[1]?.resolve(makeResponse(makePricedResult(20)))

    const secondRun = await secondRunPromise
    const firstRun = await firstRunPromise

    expect(secondRun.status).toBe("success")
    expect(secondRun.isLatest).toBe(true)
    if (secondRun.status === "success") {
      expect(secondRun.data.totals.finalTotal).toBe(20)
    }

    expect(firstRun.status).toBe("aborted")
    expect(firstRun.isLatest).toBe(false)
  })

  it("returns an error result when pricing API responds with non-ok status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse(makePricedResult(0), false),
    )

    const manager = createPricingRequestManager(fetchMock as unknown as typeof fetch)
    const result = await manager.run([{ productId: 1, qty: 1 }])

    expect(result.status).toBe("error")
    expect(result.isLatest).toBe(true)
    if (result.status === "error") {
      expect(result.error.message).toBe("Error al calcular precios")
    }
  })
})
