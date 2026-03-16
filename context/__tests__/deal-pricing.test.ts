import { describe, expect, it } from "vitest"
import { getDealUnitPrice } from "../deal-pricing"

describe("getDealUnitPrice", () => {
  it("returns unit price when receiving a deal total for multiple units", () => {
    expect(getDealUnitPrice(25, 2)).toBe(12.5)
  })

  it("returns the same price when quantity is 1", () => {
    expect(getDealUnitPrice(18.99, 1)).toBe(18.99)
  })

  it("returns the original total when quantity is invalid", () => {
    expect(getDealUnitPrice(25, 0)).toBe(25)
    expect(getDealUnitPrice(25, Number.NaN)).toBe(25)
  })
})
