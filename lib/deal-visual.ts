import type { Deal } from "@/types/product"

const DEAL_PLACEHOLDER_IMAGE = "/placeholder.svg?height=320&width=320"

export interface PromoBundleVisualItem {
  alt: string
  id: number
  price: number
  quantity: number
  src: string
}

export type PromoDealVisual =
  | { mode: "image"; src: string }
  | { items: PromoBundleVisualItem[]; mode: "bundle" }

function getSortedBundleItems(deal: Deal): PromoBundleVisualItem[] {
  return (deal.products ?? [])
    .filter((dealProduct) => dealProduct.product)
    .map((dealProduct) => ({
      id: dealProduct.id,
      src: dealProduct.product?.image || DEAL_PLACEHOLDER_IMAGE,
      alt: dealProduct.product?.name || deal.title,
      quantity: dealProduct.quantity,
      price: Number(dealProduct.product?.price ?? 0),
    }))
    .sort((a, b) => b.price - a.price)
}

function getFallbackDealImage(deal: Deal): string {
  const topProductImage = getSortedBundleItems(deal)[0]?.src
  return topProductImage ?? DEAL_PLACEHOLDER_IMAGE
}

export function getPromoDealVisual(deal: Deal): PromoDealVisual {
  if (deal.image) {
    return { mode: "image", src: deal.image }
  }

  if (deal.deal_type === "bundle") {
    return { mode: "bundle", items: getSortedBundleItems(deal) }
  }

  return { mode: "image", src: getFallbackDealImage(deal) }
}
