import { describe, expect, it } from "vitest"
import {
  createProductSchema,
  createCategorySchema,
  createDealSchema,
  parseWithSchema,
  updateProductSchema,
  updateDealSchema,
} from "@/lib/validation/admin"

describe("updateDealSchema date normalization", () => {
  it("accepts Date objects for starts_at and ends_at", () => {
    const startsAt = new Date("2026-03-01T10:00:00.000Z")
    const endsAt = new Date("2026-03-02T10:00:00.000Z")

    const result = parseWithSchema(updateDealSchema, {
      starts_at: startsAt,
      ends_at: endsAt,
    })

    expect(result.starts_at).toBe(startsAt.toISOString())
    expect(result.ends_at).toBe(endsAt.toISOString())
  })
})

describe("admin schemas without color configuration", () => {
  it("allows creating category with only name and image", () => {
    const result = parseWithSchema(createCategorySchema, {
      name: "Quesos",
      image: null,
    })

    expect(result).toEqual({
      name: "Quesos",
      image: null,
    })
  })

  it("allows creating deal without color", () => {
    const result = parseWithSchema(createDealSchema, {
      title: "Combo",
      description: null,
      image: null,
      button_text: "Agregar",
      button_link: null,
      is_active: true,
      deal_type: "bundle",
      apply_mode: "best_price",
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [{ min_qty: 1, max_qty: null, total_price: 100, unit_price: null, discount_pct: null }],
    })

    expect(result.title).toBe("Combo")
    expect(result.products).toHaveLength(1)
    expect(result.tiers).toHaveLength(1)
  })

  it("requires is_active when creating a product", () => {
    expect(() =>
      parseWithSchema(createProductSchema, {
        name: "Leche Entera 1L",
        price: 78,
        image: null,
        category_id: 1,
        is_popular: true,
      }),
    ).toThrow()
  })

  it("allows creating product with is_active flag", () => {
    const result = parseWithSchema(createProductSchema, {
      name: "Leche Entera 1L",
      price: 78,
      image: null,
      images: [" https://cdn.example.com/leche-1.png ", "", "https://cdn.example.com/leche-2.png"],
      category_id: 1,
      is_popular: true,
      is_active: true,
    })

    expect(result.is_active).toBe(true)
    expect(result.images).toEqual([
      "https://cdn.example.com/leche-1.png",
      "https://cdn.example.com/leche-2.png",
    ])
    expect(result.image).toBeNull()
  })

  it("allows clearing the product gallery on update", () => {
    const result = parseWithSchema(updateProductSchema, {
      image: null,
      images: [],
    })

    expect(result).toEqual({
      image: null,
      images: [],
    })
  })
})
