import { describe, expect, it } from "vitest"
import { getCarouselControlPositionClasses } from "@/lib/carousel-control-classes"

describe("getCarouselControlPositionClasses", () => {
  it("keeps the default horizontal offsets when no custom position is provided", () => {
    expect(getCarouselControlPositionClasses({ orientation: "horizontal", direction: "previous" })).toBe(
      "top-1/2 -left-12 -translate-y-1/2",
    )
    expect(getCarouselControlPositionClasses({ orientation: "horizontal", direction: "next" })).toBe(
      "top-1/2 -right-12 -translate-y-1/2",
    )
  })

  it("drops the horizontal left/right defaults when the consumer already positions the control", () => {
    expect(
      getCarouselControlPositionClasses({
        orientation: "horizontal",
        direction: "previous",
        className: "left-3 top-1/2 z-10",
      }),
    ).toBe("top-1/2 -translate-y-1/2")

    expect(
      getCarouselControlPositionClasses({
        orientation: "horizontal",
        direction: "next",
        className: "right-3 top-1/2 z-10",
      }),
    ).toBe("top-1/2 -translate-y-1/2")
  })
})
