/**
 * Utilidades de redondeo y cálculo para el pricing engine
 */

/**
 * Redondea a 2 decimales usando redondeo bancario (round half to even)
 * para evitar sesgos acumulativos.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Suma un array de números con redondeo final
 */
export function sumRound(values: number[]): number {
  return round2(values.reduce((acc, v) => acc + v, 0))
}

/**
 * Calcula el precio total de un tier dado una cantidad
 */
export function calculateTierPrice(
  tier: { total_price: number | null; unit_price: number | null; discount_pct: number | null },
  quantity: number,
  basePrice: number
): number {
  if (tier.total_price !== null) {
    return tier.total_price
  }
  if (tier.unit_price !== null) {
    return round2(tier.unit_price * quantity)
  }
  if (tier.discount_pct !== null) {
    return round2(basePrice * quantity * (1 - tier.discount_pct / 100))
  }
  return round2(basePrice * quantity)
}

/**
 * Verifica si una cantidad cae dentro del rango de un tier
 */
export function quantityInTierRange(
  tier: { min_qty: number; max_qty: number | null },
  quantity: number
): boolean {
  if (quantity < tier.min_qty) return false
  if (tier.max_qty !== null && quantity > tier.max_qty) return false
  return true
}

/**
 * Crea una copia profunda simple (para objetos JSON-serializables)
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
