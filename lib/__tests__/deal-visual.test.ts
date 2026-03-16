import { describe, expect, it } from "vitest"
import type { Deal } from "@/types/product"
import { getPromoDealVisual } from "@/lib/deal-visual"

function buildDeal(overrides: Partial<Deal>): Deal {
  return {
    id: 1,
    title: "Oferta",
    description: null,
    image: null,
    button_text: "Agregar",
    button_link: null,
    is_active: true,
    deal_type: "bundle",
    apply_mode: "best_price",
    starts_at: null,
    ends_at: null,
    products: [],
    tiers: [],
    ...overrides,
  }
}

describe("getPromoDealVisual", () => {
  it("returns bundle grid when bundle deal has no own image", () => {
    const deal = buildDeal({
      image: null,
      deal_type: "bundle",
      products: [
        {
          id: 1,
          deal_id: 1,
          product_id: 10,
          quantity: 1,
          product: {
            id: 10,
            name: "Leche",
            price: 80,
            image: "/leche.png",
            category_id: 1,
            is_popular: true,
            is_active: true,
          },
        },
        {
          id: 2,
          deal_id: 1,
          product_id: 20,
          quantity: 2,
          product: {
            id: 20,
            name: "Queso",
            price: 120,
            image: "/queso.png",
            category_id: 1,
            is_popular: true,
            is_active: true,
          },
        },
      ],
    })

    const visual = getPromoDealVisual(deal)

    expect(visual.mode).toBe("bundle")
    if (visual.mode !== "bundle") {
      throw new Error("Expected bundle mode")
    }

    expect(visual.items).toHaveLength(2)
    expect(visual.items[0].src).toBe("/queso.png")
    expect(visual.items[0].quantity).toBe(2)
    expect(visual.items[1].src).toBe("/leche.png")
  })
})
