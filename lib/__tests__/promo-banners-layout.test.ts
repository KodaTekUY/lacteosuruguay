import { describe, expect, it } from "vitest"
import { getMobilePromoControlsOrder } from "@/lib/promo-banners-layout"

describe("getMobilePromoControlsOrder", () => {
  it("places the previous caret, dots and next caret in that order on mobile", () => {
    expect(getMobilePromoControlsOrder()).toEqual(["prev", "dots", "next"])
  })
})
