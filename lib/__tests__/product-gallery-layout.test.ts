import { describe, expect, it } from "vitest"
import {
  getProductGalleryControlClassName,
  getProductGalleryFrameClassName,
  getProductGalleryWrapperClassName,
} from "@/lib/product-gallery-layout"

describe("product gallery layout", () => {
  it("uses a bounded mobile wrapper instead of a full-width gallery shell", () => {
    expect(getProductGalleryWrapperClassName()).toBe("mx-auto w-full max-w-56 sm:max-w-64 lg:max-w-[28rem]")
  })

  it("uses a responsive square frame instead of fixed mobile width and height", () => {
    expect(getProductGalleryFrameClassName()).toBe(
      "relative mx-auto flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/70 p-2 shadow-sm sm:p-3",
    )
  })

  it("keeps gallery controls smaller on mobile and restores the larger size from sm", () => {
    const previousControlClassName = getProductGalleryControlClassName("previous")
    const nextControlClassName = getProductGalleryControlClassName("next")

    expect(previousControlClassName).toContain("left-2")
    expect(previousControlClassName).toContain("h-8 w-8")
    expect(previousControlClassName).toContain("sm:left-3")
    expect(previousControlClassName).toContain("sm:h-10 sm:w-10")

    expect(nextControlClassName).toContain("right-2")
    expect(nextControlClassName).toContain("h-8 w-8")
    expect(nextControlClassName).toContain("sm:right-3")
    expect(nextControlClassName).toContain("sm:h-10 sm:w-10")
  })
})
