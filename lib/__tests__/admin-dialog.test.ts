import { describe, expect, it } from "vitest"
import { getAdminDialogContentClassName } from "@/lib/admin-dialog"

describe("getAdminDialogContentClassName", () => {
  it("adds an 80vh max height with vertical scrolling", () => {
    expect(getAdminDialogContentClassName()).toContain("max-h-[80vh]")
    expect(getAdminDialogContentClassName()).toContain("overflow-y-auto")
  })

  it("preserves extra class names", () => {
    expect(getAdminDialogContentClassName("sm:max-w-4xl")).toContain("sm:max-w-4xl")
  })
})
