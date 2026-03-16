import { describe, expect, it } from "vitest"
import { getMobileHeaderRows } from "@/lib/header-layout"

describe("getMobileHeaderRows", () => {
  it("places brand and cart on the first row, then search/export/help on the second", () => {
    expect(getMobileHeaderRows(true)).toEqual([
      ["brand", "cart"],
      ["search", "export", "help"],
    ])
  })

  it("keeps search and help on the second row when export is unavailable", () => {
    expect(getMobileHeaderRows(false)).toEqual([
      ["brand", "cart"],
      ["search", "help"],
    ])
  })
})
