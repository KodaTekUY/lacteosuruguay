import { describe, expect, it } from "vitest"
import { getHomeSectionsOrder } from "@/lib/home-layout"

describe("getHomeSectionsOrder", () => {
  it("shows deals first on home when there is no search query", () => {
    expect(getHomeSectionsOrder("")).toEqual(["deals", "categories", "products"])
  })

  it("hides deals when searching but keeps categories before products", () => {
    expect(getHomeSectionsOrder("yogur")).toEqual(["categories", "products"])
  })
})
