import type { Deal, DealTier, DealType } from "@/types/product"
import { getDealPrice } from "@/types/product"
import { formatCurrency } from "./currency"

export interface DealBannerPricing {
  primaryQty: number
  dealPrice: number | null
  originalTotal: number | null
  showOriginalPrice: boolean
  savingsAmount: number
}

export function getSortedDealTiers(deal: Deal): DealTier[] {
  return [...(deal.tiers ?? [])].sort((a, b) => a.min_qty - b.min_qty)
}

export function getDealBannerPricing(deal: Deal): DealBannerPricing {
  const primaryTier = getSortedDealTiers(deal)[0] ?? null
  const primaryQty = Math.max(1, primaryTier?.min_qty ?? 1)
  const rawDealPrice = getDealPrice(deal, primaryQty)
  const dealPrice = rawDealPrice !== null ? Number(rawDealPrice) : null
  const originalTotal = deal.original_price ? Number(deal.original_price) * primaryQty : null
  const showOriginalPrice =
    originalTotal !== null &&
    dealPrice !== null &&
    Number.isFinite(originalTotal) &&
    Number.isFinite(dealPrice) &&
    dealPrice < originalTotal
  const savingsAmount = showOriginalPrice && originalTotal !== null && dealPrice !== null
    ? Math.max(0, Math.round((originalTotal - dealPrice) * 100) / 100)
    : 0

  return {
    primaryQty,
    dealPrice,
    originalTotal,
    showOriginalPrice,
    savingsAmount,
  }
}

export function getDealFirstTierDiscount(deal: Deal): number | null {
  if (!deal.original_price) return null
  const firstTier = getSortedDealTiers(deal)[0]
  if (!firstTier) return null

  if (firstTier.discount_pct !== null) {
    return Number(firstTier.discount_pct)
  }

  let firstTierPrice: number | null = null
  if (firstTier.total_price !== null) {
    firstTierPrice = Number(firstTier.total_price)
  } else if (firstTier.unit_price !== null) {
    const tierQuantity = Math.max(1, firstTier.min_qty)
    firstTierPrice = Number(firstTier.unit_price) * tierQuantity
  }

  if (firstTierPrice === null) return null

  const originalForTier = Number(deal.original_price) * Math.max(1, firstTier.min_qty)
  if (!Number.isFinite(originalForTier) || originalForTier <= 0) return null

  const discount = Math.round((1 - firstTierPrice / originalForTier) * 100)
  return discount > 0 ? discount : null
}

export function getDealSecondaryText(deal: Deal): string | null {
  const description = deal.description?.trim()
  if (description) {
    return description
  }

  const names = (deal.products ?? [])
    .map((dealProduct) => dealProduct.product?.name?.trim())
    .filter((name): name is string => Boolean(name))

  if (names.length === 0) {
    return null
  }

  return names.slice(0, 3).join(" • ")
}

export function getDealTypeLabel(dealType: DealType): string {
  switch (dealType) {
    case "bundle":
      return "Pack/Combo"
    case "tiered_total":
      return "Precio por cantidad"
    case "threshold_unit":
      return "Precio mayorista"
    case "percent_off":
      return "% Descuento"
    default:
      return dealType
  }
}

export function getTierDisplayText(tier: DealTier): string {
  if (tier.unit_price !== null) {
    return `${tier.min_qty}+ → ${formatCurrency(Number(tier.unit_price))} c/u`
  }
  if (tier.total_price !== null) {
    return `${tier.min_qty}+ → ${formatCurrency(Number(tier.total_price))}`
  }
  if (tier.discount_pct !== null) {
    return `${tier.min_qty}+ → ${Number(tier.discount_pct)}% OFF`
  }
  return ""
}

export function getDealProductsSummary(deal: Deal): string {
  if (!deal.products || deal.products.length === 0) return ""

  return deal.products
    .map((dealProduct) => {
      const name = dealProduct.product?.name || ""
      return dealProduct.quantity > 1 ? `${dealProduct.quantity}x ${name}` : name
    })
    .filter(Boolean)
    .join(" + ")
}
