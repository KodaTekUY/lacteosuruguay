import { describe, expect, it } from "vitest"
import { getPrimaryProductImage, getProductImages } from "@/lib/product-images"

describe("product image helpers", () => {
  it("prefers the explicit images gallery when available", () => {
    const product = {
      id: 1,
      name: "Leche",
      image: "https://cdn.example.com/legacy.png",
      images: [" https://cdn.example.com/a.png ", "https://cdn.example.com/b.png"],
    }

    expect(getProductImages(product)).toEqual([
      "https://cdn.example.com/a.png",
      "https://cdn.example.com/b.png",
    ])
    expect(getPrimaryProductImage(product)).toBe("https://cdn.example.com/a.png")
  })

  it("falls back to the legacy image when there is no gallery", () => {
    const product = {
      id: 1,
      name: "Leche",
      image: " https://cdn.example.com/legacy.png ",
    }

    expect(getProductImages(product)).toEqual(["https://cdn.example.com/legacy.png"])
    expect(getPrimaryProductImage(product)).toBe("https://cdn.example.com/legacy.png")
  })

  it("returns the placeholder when the product has no valid images", () => {
    const product = {
      id: 1,
      name: "Leche",
      image: "   ",
      images: ["", "   "],
    }

    expect(getProductImages(product)).toEqual([])
    expect(getPrimaryProductImage(product)).toBe("/placeholder.svg")
  })
})
