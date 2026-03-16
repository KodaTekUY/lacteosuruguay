export type PromoMobileControlItem = "prev" | "dots" | "next"

export function getMobilePromoControlsOrder(): PromoMobileControlItem[] {
  return ["prev", "dots", "next"]
}
