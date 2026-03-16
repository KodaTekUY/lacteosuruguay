/**
 * Cart Pricing Types
 * 
 * Tipos para el motor de pricing del carrito con soporte para
 * deals, bundles, tiers y diferentes modos de aplicación.
 */

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CartItemInput {
  productId: number
  qty: number
  /** Precio que envía el cliente (NO se confía, se valida contra DB) */
  unitPrice?: number
}

// ============================================================================
// DEAL TYPES (from DB schema)
// ============================================================================

export type DealType = 'bundle' | 'tiered_total' | 'threshold_unit' | 'percent_off'
export type ApplyMode = 'best_price' | 'repeatable' | 'once'

export interface DealTier {
  id: number
  deal_id: number
  min_qty: number
  max_qty: number | null
  total_price: number | null    // Para tiered_total: precio total por X unidades
  unit_price: number | null     // Para threshold_unit: precio por unidad
  discount_pct: number | null   // Para percent_off: porcentaje de descuento
}

export interface DealProductRecipe {
  product_id: number
  quantity: number  // Cantidad requerida de este producto por "1 unidad de deal"
}

export interface Deal {
  id: number
  title: string
  deal_type: DealType
  apply_mode: ApplyMode
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  products: DealProductRecipe[]
  tiers: DealTier[]
}

export interface ProductPrice {
  id: number
  price: number
}

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export interface AppliedDealInfo {
  dealId: number
  dealTitle: string
  tierUsed?: {
    minQty: number
    maxQty: number | null
    price: number | null
    unitPrice: number | null
    discountPct: number | null
  }
}

export interface PricedLineItem {
  productId: number
  qty: number
  /** Precio base de products.price */
  baseUnitPrice: number
  /** Precio unitario efectivo después de deals */
  finalUnitPrice: number
  /** qty * baseUnitPrice */
  lineBaseTotal: number
  /** qty * finalUnitPrice (o el total calculado por deal) */
  lineFinalTotal: number
  /** Deals que afectan este item */
  appliedDeals: AppliedDealInfo[]
}

export interface DealApplication {
  dealId: number
  title: string
  timesApplied: number
  tierUsed?: {
    minQty: number
    maxQty: number | null
    price: number | null
    unitPrice: number | null
    discountPct: number | null
  }
  /** Descuento total logrado por este deal */
  discountTotal: number
  /** Productos afectados y cuántas unidades de cada uno */
  affectedProducts: Array<{
    productId: number
    unitsUsed: number
  }>
}

export interface CartTotals {
  /** Suma de todos los lineBaseTotal */
  baseTotal: number
  /** Ahorro total por deals */
  discountTotal: number
  /** baseTotal - discountTotal */
  finalTotal: number
}

export interface PricedCartResult {
  items: PricedLineItem[]
  dealsApplied: DealApplication[]
  totals: CartTotals
}

// ============================================================================
// INTERNAL TYPES (for pricing engine)
// ============================================================================

/** 
 * Tracking de unidades disponibles por producto.
 * Cuando un deal "consume" unidades, se restan de availableUnits.
 */
export interface ProductUnitTracker {
  productId: number
  totalUnits: number
  availableUnits: number
  baseUnitPrice: number
}

/**
 * Resultado de evaluar un deal contra el carrito
 */
export interface DealEvaluation {
  deal: Deal
  canApply: boolean
  maxTimesApplicable: number
  /** Descuento por cada aplicación del deal */
  discountPerApplication: number
  /** Mejor tier a usar */
  bestTier: DealTier | null
  /** Para tiered_total con best_price: breakdown de la combinación óptima */
  optimalCombination?: TierCombination
}

/**
 * Para tiered_total con best_price: combinación de tiers
 */
export interface TierCombination {
  tiers: Array<{ tier: DealTier; timesUsed: number }>
  totalUnits: number
  totalPrice: number
  totalDiscount: number
}
