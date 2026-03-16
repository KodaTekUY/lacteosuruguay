import { describe, expect, it } from "vitest"
import {
  getActiveDealTierId,
  getAccumulatedTieredTotalPricing,
  getDealControlCount,
  getDealControlStepQuantity,
  getDealPrice,
  getInitialDealCartQuantity,
  getDealOriginalTotalForDisplay,
  getNonBundleDealNextQuantity,
  getNonBundleDealPrevQuantity,
  type CartItem,
  type Deal,
  type DealProduct,
} from "@/types/product"

const baseDeal: Deal = {
  id: 1,
  title: "Oferta",
  description: null,
  image: null,
  button_text: "Agregar",
  button_link: null,
  is_active: true,
  deal_type: "tiered_total",
  apply_mode: "best_price",
  starts_at: null,
  ends_at: null,
}

describe("getInitialDealCartQuantity", () => {
  it("returns first tier min qty for quantity deals", () => {
    const deal: Deal = {
      ...baseDeal,
      tiers: [
        {
          id: 2,
          deal_id: 1,
          min_qty: 6,
          max_qty: null,
          total_price: 100,
          unit_price: null,
          discount_pct: null,
        },
        {
          id: 1,
          deal_id: 1,
          min_qty: 3,
          max_qty: 5,
          total_price: 60,
          unit_price: null,
          discount_pct: null,
        },
      ],
    }

    expect(getInitialDealCartQuantity(deal)).toBe(3)
  })

  it("returns 1 for bundle deals", () => {
    const deal: Deal = {
      ...baseDeal,
      deal_type: "bundle",
      tiers: [
        {
          id: 1,
          deal_id: 1,
          min_qty: 4,
          max_qty: null,
          total_price: 70,
          unit_price: null,
          discount_pct: null,
        },
      ],
    }

    expect(getInitialDealCartQuantity(deal)).toBe(1)
  })

  it("returns 1 when tiers are missing", () => {
    const deal: Deal = { ...baseDeal, tiers: [] }
    expect(getInitialDealCartQuantity(deal)).toBe(1)
  })
})

describe("deal control quantities", () => {
  const productA: DealProduct = {
    id: 10,
    deal_id: 1,
    product_id: 100,
    quantity: 1,
    product: {
      id: 100,
      name: "Leche Entera 1L",
      price: 52,
      image: null,
    },
  }

  const productB: DealProduct = {
    id: 11,
    deal_id: 1,
    product_id: 101,
    quantity: 2,
    product: {
      id: 101,
      name: "Queso Muzzarella",
      price: 290,
      image: null,
    },
  }

  const baseItem: Omit<CartItem, "id" | "name" | "price" | "image" | "quantity"> = {}

  it("uses first tier qty as step for quantity deals", () => {
    const deal: Deal = {
      ...baseDeal,
      deal_type: "tiered_total",
      products: [productA],
      tiers: [
        {
          id: 1,
          deal_id: 1,
          min_qty: 3,
          max_qty: null,
          total_price: 130,
          unit_price: null,
          discount_pct: null,
        },
      ],
    }

    expect(getDealControlStepQuantity(deal, productA)).toBe(3)
  })

  it("uses product quantity as step for bundles", () => {
    const deal: Deal = {
      ...baseDeal,
      deal_type: "bundle",
      products: [productB],
      tiers: [],
    }

    expect(getDealControlStepQuantity(deal, productB)).toBe(2)
  })

  it("calculates control count for quantity deal from product cart qty", () => {
    const deal: Deal = {
      ...baseDeal,
      deal_type: "tiered_total",
      products: [productA],
      tiers: [
        {
          id: 1,
          deal_id: 1,
          min_qty: 3,
          max_qty: null,
          total_price: 130,
          unit_price: null,
          discount_pct: null,
        },
      ],
    }
    const items: CartItem[] = [
      {
        ...baseItem,
        id: 100,
        name: "Leche Entera 1L",
        price: 52,
        image: null,
        quantity: 7,
      },
    ]

    expect(getDealControlCount(deal, items)).toBe(7)
  })

  it("calculates control count for bundle using minimum complete set", () => {
    const deal: Deal = {
      ...baseDeal,
      deal_type: "bundle",
      products: [productA, productB],
      tiers: [],
    }
    const items: CartItem[] = [
      {
        ...baseItem,
        id: 100,
        name: "Leche Entera 1L",
        price: 52,
        image: null,
        quantity: 3,
      },
      {
        ...baseItem,
        id: 101,
        name: "Queso Muzzarella",
        price: 290,
        image: null,
        quantity: 5,
      },
    ]

    expect(getDealControlCount(deal, items)).toBe(2)
  })
})

describe("non bundle quantity transitions", () => {
  it("adds first tier quantity on first add", () => {
    expect(getNonBundleDealNextQuantity(0, 3)).toBe(3)
  })

  it("adds one unit when already in cart", () => {
    expect(getNonBundleDealNextQuantity(3, 3)).toBe(4)
  })

  it("subtracts one unit while above first tier", () => {
    expect(getNonBundleDealPrevQuantity(5, 3)).toBe(4)
  })

  it("clears all when subtraction would go below first tier", () => {
    expect(getNonBundleDealPrevQuantity(3, 3)).toBe(0)
  })
})

describe("deal original total display", () => {
  const deal: Deal = {
    ...baseDeal,
    original_price: 45,
    tiers: [
      {
        id: 1,
        deal_id: 1,
        min_qty: 4,
        max_qty: 7,
        total_price: 160,
        unit_price: null,
        discount_pct: null,
      },
      {
        id: 2,
        deal_id: 1,
        min_qty: 8,
        max_qty: null,
        total_price: 300,
        unit_price: null,
        discount_pct: null,
      },
    ],
  }

  it("uses active tier min_qty when tier is total_price", () => {
    expect(getDealOriginalTotalForDisplay(deal, 6)).toBe(180)
    expect(getDealOriginalTotalForDisplay(deal, 8)).toBe(360)
  })
})

describe("tiered total accumulation", () => {
  const deal: Deal = {
    ...baseDeal,
    original_price: 45,
    tiers: [
      {
        id: 1,
        deal_id: 1,
        min_qty: 4,
        max_qty: 7,
        total_price: 160,
        unit_price: null,
        discount_pct: null,
      },
      {
        id: 2,
        deal_id: 1,
        min_qty: 8,
        max_qty: null,
        total_price: 300,
        unit_price: null,
        discount_pct: null,
      },
    ],
  }

  it("accumulates repeated tiers for 12 units", () => {
    expect(getAccumulatedTieredTotalPricing(deal, 12)).toEqual({
      appliedQuantity: 12,
      dealTotal: 460,
    })
  })

  it("keeps same accumulated tier pricing for 13 units", () => {
    expect(getAccumulatedTieredTotalPricing(deal, 13)).toEqual({
      appliedQuantity: 12,
      dealTotal: 460,
    })
  })

  it("moves to next accumulated threshold at 16 units", () => {
    expect(getAccumulatedTieredTotalPricing(deal, 16)).toEqual({
      appliedQuantity: 16,
      dealTotal: 600,
    })
  })

  it("returns first available tier for partial quantity", () => {
    expect(getAccumulatedTieredTotalPricing(deal, 6)).toEqual({
      appliedQuantity: 4,
      dealTotal: 160,
    })
  })
})

describe("active tier selection", () => {
  const deal: Deal = {
    ...baseDeal,
    tiers: [
      {
        id: 10,
        deal_id: 1,
        min_qty: 4,
        max_qty: 7,
        total_price: 160,
        unit_price: null,
        discount_pct: null,
      },
      {
        id: 20,
        deal_id: 1,
        min_qty: 8,
        max_qty: null,
        total_price: 300,
        unit_price: null,
        discount_pct: null,
      },
    ],
  }

  it("returns first tier as active for quantity inside first range", () => {
    expect(getActiveDealTierId(deal, 6)).toBe(10)
  })

  it("returns second tier as active when reaching next threshold", () => {
    expect(getActiveDealTierId(deal, 8)).toBe(20)
  })

  it("returns null when quantity is zero", () => {
    const dealWithBaseTier: Deal = {
      ...baseDeal,
      tiers: [
        {
          id: 1,
          deal_id: 1,
          min_qty: 1,
          max_qty: 3,
          total_price: null,
          unit_price: 45,
          discount_pct: null,
        },
        {
          id: 2,
          deal_id: 1,
          min_qty: 4,
          max_qty: null,
          total_price: 160,
          unit_price: null,
          discount_pct: null,
        },
      ],
    }

    expect(getActiveDealTierId(dealWithBaseTier, 0)).toBeNull()
  })
})

describe("deal price coercion", () => {
  it("coerces total_price numeric strings to number", () => {
    const deal: Deal = {
      ...baseDeal,
      tiers: [
        {
          id: 1,
          deal_id: 1,
          min_qty: 1,
          max_qty: null,
          total_price: "269" as unknown as number,
          unit_price: null,
          discount_pct: null,
        },
      ],
    }

    expect(getDealPrice(deal, 1)).toBe(269)
  })

  it("scales bundle totals by applied quantity", () => {
    const bundleDeal: Deal = {
      ...baseDeal,
      deal_type: "bundle",
      original_price: 306,
      tiers: [
        {
          id: 1,
          deal_id: 1,
          min_qty: 1,
          max_qty: null,
          total_price: 269,
          unit_price: null,
          discount_pct: null,
        },
      ],
    }

    expect(getDealPrice(bundleDeal, 2)).toBe(538)
    expect(getDealOriginalTotalForDisplay(bundleDeal, 2)).toBe(612)
  })

  it("scales percent-off totals by quantity", () => {
    const percentDeal: Deal = {
      ...baseDeal,
      deal_type: "percent_off",
      original_price: 129,
      tiers: [
        {
          id: 1,
          deal_id: 1,
          min_qty: 1,
          max_qty: null,
          total_price: null,
          unit_price: null,
          discount_pct: 15,
        },
      ],
    }

    expect(getDealPrice(percentDeal, 2)).toBeCloseTo(219.3, 2)
    expect(getDealOriginalTotalForDisplay(percentDeal, 2)).toBe(258)
  })
})
