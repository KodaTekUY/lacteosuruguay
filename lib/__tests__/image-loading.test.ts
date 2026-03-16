import { describe, expect, it } from "vitest"
import { getImageLoadingClassNames } from "@/lib/image-loading"

describe("getImageLoadingClassNames", () => {
  it("returns visible overlay while image is loading", () => {
    const classes = getImageLoadingClassNames(true)

    expect(classes.overlay).toContain("opacity-100")
    expect(classes.image).toContain("opacity-0")
  })

  it("hides overlay and reveals image when loading ends", () => {
    const classes = getImageLoadingClassNames(false)

    expect(classes.overlay).toContain("opacity-0")
    expect(classes.overlay).toContain("pointer-events-none")
    expect(classes.image).toContain("opacity-100")
  })
})

