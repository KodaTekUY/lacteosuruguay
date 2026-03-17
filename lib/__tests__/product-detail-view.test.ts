import { describe, expect, it } from "vitest"
import type { Deal, DealTier } from "@/types/product"
import {
  getDealBannerPricing,
  getDealFirstTierDiscount,
  getDealSecondaryText,
  getDealTypeLabel,
  getTierDisplayText,
  getDealProductsSummary,
} from "@/lib/product-detail-view"

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

describe("product-detail-view helpers", () => {
  it("maps deal type labels to user friendly text", () => {
    expect(getDealTypeLabel("bundle")).toBe("Pack/Combo")
    expect(getDealTypeLabel("tiered_total")).toBe("Precio por cantidad")
    expect(getDealTypeLabel("threshold_unit")).toBe("Precio mayorista")
    expect(getDealTypeLabel("percent_off")).toBe("% Descuento")
  })

  it("builds tier labels for each pricing mode", () => {
    const totalTier: DealTier = {
      id: 1,
      deal_id: 1,
      min_qty: 3,
      max_qty: null,
      total_price: 499,
      unit_price: null,
      discount_pct: null,
    }
    const unitTier: DealTier = {
      id: 2,
      deal_id: 1,
      min_qty: 4,
      max_qty: null,
      total_price: null,
      unit_price: 99,
      discount_pct: null,
    }
    const discountTier: DealTier = {
      id: 3,
      deal_id: 1,
      min_qty: 2,
      max_qty: null,
      total_price: null,
      unit_price: null,
      discount_pct: 15,
    }

    expect(getTierDisplayText(totalTier)).toMatch(/^3\+ → \$\s?499,00$/)
    expect(getTierDisplayText(unitTier)).toMatch(/^4\+ → \$\s?99,00 c\/u$/)
    expect(getTierDisplayText(discountTier)).toBe("2+ → 15% OFF")
  })

  it("summarizes deal products with quantities", () => {
    const deal = buildDeal({
      products: [
        {
          id: 1,
          deal_id: 1,
          product_id: 10,
          quantity: 2,
          product: {
            id: 10,
            name: "Yogur",
            price: 100,
            image: null,
            category_id: 1,
            is_popular: true,
            is_active: true,
          },
        },
        {
          id: 2,
          deal_id: 1,
          product_id: 20,
          quantity: 1,
          product: {
            id: 20,
            name: "Queso crema",
            price: 150,
            image: null,
            category_id: 1,
            is_popular: true,
            is_active: true,
          },
        },
      ],
    })

    expect(getDealProductsSummary(deal)).toBe("2x Yogur + Queso crema")
  })

  it("builds banner pricing values using first tier quantity", () => {
    const deal = buildDeal({
      deal_type: "threshold_unit",
      original_price: 245,
      tiers: [
        {
          id: 1,
          deal_id: 1,
          min_qty: 3,
          max_qty: null,
          total_price: null,
          unit_price: 219,
          discount_pct: null,
        },
      ],
    })

    expect(getDealBannerPricing(deal)).toEqual({
      primaryQty: 3,
      dealPrice: 657,
      originalTotal: 735,
      showOriginalPrice: true,
      savingsAmount: 78,
    })
  })

  it("calculates first tier discount for total tier deals", () => {
    const deal = buildDeal({
      deal_type: "tiered_total",
      original_price: 45,
      tiers: [
        {
          id: 1,
          deal_id: 1,
          min_qty: 4,
          max_qty: null,
          total_price: 160,
          unit_price: null,
          discount_pct: null,
        },
      ],
    })

    expect(getDealFirstTierDiscount(deal)).toBe(11)
  })

  it("prefers description and falls back to product names for secondary text", () => {
    const withDescription = buildDeal({
      description: "Oferta semanal",
    })

    expect(getDealSecondaryText(withDescription)).toBe("Oferta semanal")
    expect(getDealSecondaryText(buildDeal({ products: [] }))).toBeNull()

    const withProducts = buildDeal({
      description: null,
      products: [
        {
          id: 1,
          deal_id: 1,
          product_id: 10,
          quantity: 1,
          product: {
            id: 10,
            name: "Yogur Natural",
            price: 90,
            image: null,
            category_id: 1,
            is_popular: true,
            is_active: true,
          },
        },
        {
          id: 2,
          deal_id: 1,
          product_id: 11,
          quantity: 1,
          product: {
            id: 11,
            name: "Queso crema",
            price: 180,
            image: null,
            category_id: 1,
            is_popular: true,
            is_active: true,
          },
        },
      ],
    })

    expect(getDealSecondaryText(withProducts)).toBe("Yogur Natural • Queso crema")
  })
})
