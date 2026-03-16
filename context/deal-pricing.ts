export function getDealUnitPrice(dealTotalPrice: number, quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return dealTotalPrice
  }

  return dealTotalPrice / quantity
}
