import { describe, expect, it } from "vitest"
import { toDateTimeLocalInputValue } from "@/lib/datetime-local"

describe("toDateTimeLocalInputValue", () => {
  it("formats Date values for datetime-local input", () => {
    const value = toDateTimeLocalInputValue(new Date(2026, 1, 3, 9, 7))
    expect(value).toBe("2026-02-03T09:07")
  })

  it("returns empty string for invalid values", () => {
    expect(toDateTimeLocalInputValue(null)).toBe("")
    expect(toDateTimeLocalInputValue("invalid-date")).toBe("")
  })

  it("accepts ISO strings and returns a valid datetime-local shape", () => {
    const value = toDateTimeLocalInputValue("2026-03-01T10:00:00.000Z")
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })
})
