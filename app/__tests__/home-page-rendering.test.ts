import { describe, expect, it } from "vitest"
import * as homePageModule from "@/app/page"

describe("home page rendering strategy", () => {
  it("forces dynamic rendering to avoid stale catalog snapshots in production", () => {
    expect(homePageModule.dynamic).toBe("force-dynamic")
  })
})

