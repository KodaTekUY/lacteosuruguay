import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const filesToCheck = [
  "app/oferta/[id]/deal-detail-client.tsx",
  "app/producto/[id]/product-detail-client.tsx",
]

const forbiddenPatterns = [
  {
    label: "template strings with a manual dollar sign before formatCurrency",
    pattern: /\$\$\{formatCurrency\(/g,
  },
  {
    label: "jsx lines starting with a manual dollar sign before formatCurrency",
    pattern: /^\s*\$\{formatCurrency\(/gm,
  },
  {
    label: "savings copy with a manual dollar sign before formatCurrency",
    pattern: /Ahorrás\s+\$\{formatCurrency\(/g,
  },
]

describe("formatCurrency usage", () => {
  it("does not prepend a manual dollar sign where formatCurrency is already used", () => {
    const violations = filesToCheck.flatMap((relativePath) => {
      const content = readFileSync(path.join(process.cwd(), relativePath), "utf8")

      return forbiddenPatterns.flatMap(({ label, pattern }) => {
        const matches = content.match(pattern) ?? []
        return matches.map((match) => `${relativePath}: ${label}: ${match}`)
      })
    })

    expect(violations).toEqual([])
  })
})
