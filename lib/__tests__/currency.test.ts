import { describe, expect, it } from "vitest"
import { formatCurrency } from "@/lib/currency"

describe("formatCurrency", () => {
  it("formats values with the provided locale and currency", () => {
    const expected = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.5)

    expect(formatCurrency(1234.5, { locale: "en-US", currency: "USD" })).toBe(expected)
  })

  it("falls back to zero when receiving invalid numbers", () => {
    const expected = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0)

    expect(formatCurrency(Number.NaN, { locale: "en-US", currency: "USD" })).toBe(expected)
  })
})
