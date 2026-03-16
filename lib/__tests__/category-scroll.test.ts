import { describe, expect, it } from "vitest"
import { getHorizontalScrollControlState } from "@/lib/category-scroll"

describe("getHorizontalScrollControlState", () => {
  it("hides both controls when there is no overflow", () => {
    expect(getHorizontalScrollControlState(0, 400, 400)).toEqual({
      canScrollLeft: false,
      canScrollRight: false,
    })
  })

  it("shows only right control at initial position when overflowing", () => {
    expect(getHorizontalScrollControlState(0, 300, 800)).toEqual({
      canScrollLeft: false,
      canScrollRight: true,
    })
  })

  it("shows both controls while in the middle", () => {
    expect(getHorizontalScrollControlState(200, 300, 800)).toEqual({
      canScrollLeft: true,
      canScrollRight: true,
    })
  })

  it("shows only left control when reached the end", () => {
    expect(getHorizontalScrollControlState(500, 300, 800)).toEqual({
      canScrollLeft: true,
      canScrollRight: false,
    })
  })
})
