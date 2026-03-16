import type {
  ApplyMode as DbApplyMode,
  Category as DbCategory,
  Deal as DbDeal,
  DealProduct as DbDealProduct,
  DealTier as DbDealTier,
  DealType as DbDealType,
  Product as DbProduct,
} from "@/lib/db"
import type {
  AppliedDealInfo as PricingAppliedDealInfo,
  DealApplication as PricingDealApplication,
  PricedCartResult as PricingPricedCartResult,
} from "@/lib/cart-pricing/types"
import { formatCurrency } from "@/lib/currency"

export interface Product extends Omit<DbProduct, "category_id" | "is_popular" | "is_active"> {
  category_id?: number | null
  is_popular?: boolean
  is_active?: boolean
  category?: string
}
export type Category = DbCategory
export type DealTier = DbDealTier
export type DealType = DbDealType
export type ApplyMode = DbApplyMode

export interface DealProduct extends Omit<DbDealProduct, "product"> {
  product?: Product
}

export interface Deal extends Omit<DbDeal, "products" | "tiers"> {
  products?: DealProduct[]
  tiers?: DealTier[]
}

export type AppliedDealInfo = PricingAppliedDealInfo
export type DealApplication = PricingDealApplication
export type PricedCartResult = PricingPricedCartResult

export interface CartItem extends Product {
  quantity: number
  isDeal?: boolean
  dealId?: number
  dealTitle?: string
  originalPrice?: number
  finalUnitPrice?: number
  lineFinalTotal?: number
  appliedDeals?: AppliedDealInfo[]
}

interface AccumulatedTieredTotalPricing {
  appliedQuantity: number
  dealTotal: number
}

export function getInitialDealCartQuantity(deal: Deal): number {
  if (deal.deal_type === "bundle") {
    return 1
  }

  if (!deal.tiers || deal.tiers.length === 0) {
    return 1
  }

  const firstTier = [...deal.tiers]
    .filter((tier) => Number.isInteger(tier.min_qty) && tier.min_qty > 0)
    .sort((a, b) => a.min_qty - b.min_qty)[0]

  return firstTier?.min_qty ?? 1
}

export function getDealControlStepQuantity(deal: Deal, dealProduct: DealProduct): number {
  const safeBaseQuantity = Number.isInteger(dealProduct.quantity) && dealProduct.quantity > 0 ? dealProduct.quantity : 1
  if (deal.deal_type === "bundle") {
    return safeBaseQuantity
  }
  return safeBaseQuantity * getInitialDealCartQuantity(deal)
}

export function getDealControlCount(deal: Deal, items: CartItem[]): number {
  if (!deal.products || deal.products.length === 0) {
    return 0
  }

  if (deal.deal_type !== "bundle") {
    const firstProduct = deal.products.find((dealProduct) => dealProduct.product)
    if (!firstProduct) {
      return 0
    }
    return items.find((item) => item.id === firstProduct.product_id && !item.isDeal)?.quantity ?? 0
  }

  const stepCounts = deal.products
    .filter((dealProduct) => dealProduct.product)
    .map((dealProduct) => {
      const stepQuantity = getDealControlStepQuantity(deal, dealProduct)
      const cartQuantity = items.find((item) => item.id === dealProduct.product_id && !item.isDeal)?.quantity ?? 0
      return Math.floor(cartQuantity / stepQuantity)
    })

  if (stepCounts.length === 0) {
    return 0
  }

  return Math.max(0, Math.min(...stepCounts))
}

export function getNonBundleDealNextQuantity(currentQuantity: number, firstTierQuantity: number): number {
  const safeFirstTierQuantity =
    Number.isInteger(firstTierQuantity) && firstTierQuantity > 0 ? firstTierQuantity : 1
  const safeCurrentQuantity =
    Number.isInteger(currentQuantity) && currentQuantity > 0 ? currentQuantity : 0

  if (safeCurrentQuantity === 0) {
    return safeFirstTierQuantity
  }

  return safeCurrentQuantity + 1
}

export function getNonBundleDealPrevQuantity(currentQuantity: number, firstTierQuantity: number): number {
  const safeFirstTierQuantity =
    Number.isInteger(firstTierQuantity) && firstTierQuantity > 0 ? firstTierQuantity : 1
  const safeCurrentQuantity =
    Number.isInteger(currentQuantity) && currentQuantity > 0 ? currentQuantity : 0

  if (safeCurrentQuantity <= safeFirstTierQuantity) {
    return 0
  }

  return safeCurrentQuantity - 1
}

export function getAccumulatedTieredTotalPricing(
  deal: Deal,
  quantity: number,
): AccumulatedTieredTotalPricing | null {
  if (deal.deal_type !== "tiered_total" || !deal.tiers || deal.tiers.length === 0) {
    return null
  }

  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0
  if (safeQuantity === 0) {
    return null
  }

  const totalPriceTiers = deal.tiers.filter(
    (tier) =>
      tier.total_price !== null &&
      Number.isInteger(tier.min_qty) &&
      tier.min_qty > 0,
  )

  if (totalPriceTiers.length === 0) {
    return null
  }

  const inf = Number.MAX_SAFE_INTEGER
  const dp: number[] = new Array(safeQuantity + 1).fill(inf)
  dp[0] = 0

  for (let units = 1; units <= safeQuantity; units++) {
    for (const tier of totalPriceTiers) {
      if (units < tier.min_qty) continue
      const previous = dp[units - tier.min_qty]
      if (previous === inf) continue
      const candidate = previous + Number(tier.total_price)
      if (candidate < dp[units]) {
        dp[units] = candidate
      }
    }
  }

  let appliedQuantity = 0
  let dealTotal = 0
  for (let units = 1; units <= safeQuantity; units++) {
    if (dp[units] === inf) continue
    if (units > appliedQuantity) {
      appliedQuantity = units
      dealTotal = dp[units]
    }
  }

  if (appliedQuantity === 0) {
    return null
  }

  return {
    appliedQuantity,
    dealTotal: Math.round(dealTotal * 100) / 100,
  }
}

export function getDealOriginalTotalForDisplay(deal: Deal, quantity: number): number | null {
  if (!deal.original_price) {
    return null
  }

  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1

  const accumulatedTieredTotal = getAccumulatedTieredTotalPricing(deal, safeQuantity)
  if (accumulatedTieredTotal && accumulatedTieredTotal.appliedQuantity > 0) {
    return Number(deal.original_price) * accumulatedTieredTotal.appliedQuantity
  }

  if (!deal.tiers || deal.tiers.length === 0) {
    return Number(deal.original_price) * safeQuantity
  }

  const sortedTiers = [...deal.tiers].sort((a, b) => b.min_qty - a.min_qty)

  for (const tier of sortedTiers) {
    if (safeQuantity >= tier.min_qty && (tier.max_qty === null || safeQuantity <= tier.max_qty)) {
      if (tier.total_price !== null) {
        if (deal.deal_type === "bundle") {
          return Number(deal.original_price) * safeQuantity
        }
        return Number(deal.original_price) * tier.min_qty
      }
      return Number(deal.original_price) * safeQuantity
    }
  }

  return Number(deal.original_price) * safeQuantity
}

export function getActiveDealTierId(deal: Deal, quantity: number): number | null {
  if (!deal.tiers || deal.tiers.length === 0) {
    return null
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return null
  }

  const safeQuantity = Math.floor(quantity)
  const sortedTiers = [...deal.tiers].sort((a, b) => b.min_qty - a.min_qty)

  for (const tier of sortedTiers) {
    if (safeQuantity >= tier.min_qty && (tier.max_qty === null || safeQuantity <= tier.max_qty)) {
      return tier.id
    }
  }

  return null
}

// Helper function to get the best price for a deal
export function getDealPrice(deal: Deal, quantity: number = 1): number | null {
  if (!deal.tiers || deal.tiers.length === 0) return null

  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1
  const sortedTiers = [...deal.tiers].sort((a, b) => b.min_qty - a.min_qty)

  for (const tier of sortedTiers) {
    if (safeQuantity >= tier.min_qty && (tier.max_qty === null || safeQuantity <= tier.max_qty)) {
      if (tier.total_price !== null) {
        if (deal.deal_type === "bundle") {
          return Number(tier.total_price) * safeQuantity
        }
        return Number(tier.total_price)
      }
      if (tier.unit_price !== null) {
        return Number(tier.unit_price) * safeQuantity
      }
      if (tier.discount_pct !== null && deal.original_price) {
        const discountedTotal = Number(deal.original_price) * safeQuantity * (1 - Number(tier.discount_pct) / 100)
        return Math.round(discountedTotal * 100) / 100
      }
    }
  }

  const baseTier = deal.tiers.find((tier) => tier.min_qty === 1)
  if (baseTier) {
    if (baseTier.total_price !== null) {
      if (deal.deal_type === "bundle") {
        return Number(baseTier.total_price) * safeQuantity
      }
      return Number(baseTier.total_price)
    }
    if (baseTier.unit_price !== null) return Number(baseTier.unit_price) * safeQuantity
  }

  return null
}

// Helper to get display price info for a deal
export function getDealPriceDisplay(deal: Deal): { price: number | null; label: string } {
  if (!deal.tiers || deal.tiers.length === 0) {
    return { price: null, label: "" }
  }

  const baseTier = deal.tiers.find((tier) => tier.min_qty === 1) || deal.tiers[0]

  if (baseTier.total_price !== null) {
    return { price: baseTier.total_price, label: formatCurrency(Number(baseTier.total_price)) }
  }
  if (baseTier.unit_price !== null) {
    return { price: baseTier.unit_price, label: `${formatCurrency(Number(baseTier.unit_price))} c/u` }
  }
  if (baseTier.discount_pct !== null) {
    return { price: null, label: `${baseTier.discount_pct}% OFF` }
  }

  return { price: null, label: "" }
}
