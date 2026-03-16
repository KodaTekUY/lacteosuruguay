/**
 * Cart Pricing Service
 * 
 * Servicio que carga datos de DB y orquesta el motor de pricing.
 * Maneja la conexión a Postgres y las queries necesarias.
 */

import { neon } from "@neondatabase/serverless"
import { priceCart } from './engine'
import type {
  CartItemInput,
  Deal,
  DealTier,
  DealProductRecipe,
  PricedCartResult,
  DealType,
  ApplyMode
} from './types'

export class InvalidCartProductsError extends Error {
  readonly productIds: number[]

  constructor(productIds: number[]) {
    super(`Invalid product IDs: ${productIds.join(", ")}`)
    this.name = "InvalidCartProductsError"
    this.productIds = productIds
  }
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class CartPricingService {
  private sql: ReturnType<typeof neon>
  
  constructor(databaseUrl?: string) {
    const url = databaseUrl ?? process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL is required for CartPricingService')
    }
    this.sql = neon(url)
  }
  
  /**
   * Calcula el pricing del carrito con deals aplicados automáticamente.
   * 
   * @param items - Items del carrito [{productId, qty}]
   * @param now - Fecha actual (opcional, default: new Date())
   * @returns PricedCartResult con breakdown completo
   */
  async priceCart(
    items: CartItemInput[],
    now: Date = new Date()
  ): Promise<PricedCartResult> {
    if (items.length === 0) {
      return {
        items: [],
        dealsApplied: [],
        totals: { baseTotal: 0, discountTotal: 0, finalTotal: 0 }
      }
    }
    
    const productIds = items.map(i => i.productId)
    
    // Cargar datos en paralelo
    const [productPrices, deals] = await Promise.all([
      this.loadProductPrices(productIds),
      this.loadActiveDeals(productIds, now)
    ])

    const missingProductIds = Array.from(new Set(productIds)).filter((id) => !productPrices.has(id))
    if (missingProductIds.length > 0) {
      throw new InvalidCartProductsError(missingProductIds)
    }
    
    // Ejecutar motor de pricing
    return priceCart(items, productPrices, deals, now)
  }
  
  /**
   * Carga precios de productos desde DB
   * 
   * Query: SELECT id, price FROM products WHERE id = ANY($1) AND is_active = true
   */
  private async loadProductPrices(productIds: number[]): Promise<Map<number, number>> {
    const result = await this.sql`
      SELECT id, price 
      FROM products 
      WHERE id = ANY(${productIds})
        AND is_active = true
    ` as Array<{ id: number; price: string | number }>
    
    const prices = new Map<number, number>()
    for (const row of result) {
      prices.set(row.id, Number(row.price))
    }
    
    return prices
  }
  
  /**
   * Carga deals activos y vigentes para los productos del carrito.
   * 
   * Query compleja con CTEs para obtener deals, productos y tiers en una sola query.
   */
  private async loadActiveDeals(productIds: number[], now: Date): Promise<Deal[]> {
    const nowISO = now.toISOString()
    
    const result = await this.sql`
      WITH relevant_deals AS (
        SELECT DISTINCT d.id, d.title, d.deal_type, d.apply_mode, 
               d.is_active, d.starts_at, d.ends_at
        FROM deals d
        INNER JOIN deal_products dp ON dp.deal_id = d.id
        INNER JOIN products p ON p.id = dp.product_id
        WHERE dp.product_id = ANY(${productIds})
          AND p.is_active = true
          AND d.is_active = true
          AND (d.starts_at IS NULL OR d.starts_at <= ${nowISO}::timestamp)
          AND (d.ends_at IS NULL OR d.ends_at >= ${nowISO}::timestamp)
      )
      SELECT 
        rd.id AS deal_id,
        rd.title,
        rd.deal_type,
        rd.apply_mode,
        rd.is_active,
        rd.starts_at,
        rd.ends_at,
        dp.product_id,
        dp.quantity AS product_quantity,
        dt.id AS tier_id,
        dt.min_qty AS tier_min_qty,
        dt.max_qty AS tier_max_qty,
        dt.total_price AS tier_total_price,
        dt.unit_price AS tier_unit_price,
        dt.discount_pct AS tier_discount_pct
      FROM relevant_deals rd
      LEFT JOIN deal_products dp ON dp.deal_id = rd.id
      LEFT JOIN deal_tiers dt ON dt.deal_id = rd.id
      ORDER BY rd.id, dp.product_id, dt.min_qty
    ` as DealQueryRow[]
    
    // Agrupar resultados por deal
    const dealsMap = new Map<number, Deal>()
    const dealProductsMap = new Map<number, Map<number, DealProductRecipe>>()
    const dealTiersMap = new Map<number, Map<number, DealTier>>()
    
    for (const row of result) {
      // Crear o actualizar deal
      if (!dealsMap.has(row.deal_id)) {
        dealsMap.set(row.deal_id, {
          id: row.deal_id,
          title: row.title,
          deal_type: row.deal_type as DealType,
          apply_mode: row.apply_mode as ApplyMode,
          is_active: row.is_active,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          products: [],
          tiers: []
        })
        dealProductsMap.set(row.deal_id, new Map())
        dealTiersMap.set(row.deal_id, new Map())
      }
      
      // Agregar producto si no existe
      if (row.product_id && !dealProductsMap.get(row.deal_id)!.has(row.product_id)) {
        dealProductsMap.get(row.deal_id)!.set(row.product_id, {
          product_id: row.product_id,
          quantity: row.product_quantity ?? 1
        })
      }
      
      // Agregar tier si no existe
      if (row.tier_id && !dealTiersMap.get(row.deal_id)!.has(row.tier_id)) {
        dealTiersMap.get(row.deal_id)!.set(row.tier_id, {
          id: row.tier_id,
          deal_id: row.deal_id,
          min_qty: row.tier_min_qty ?? 1,
          max_qty: row.tier_max_qty,
          total_price: row.tier_total_price ? Number(row.tier_total_price) : null,
          unit_price: row.tier_unit_price ? Number(row.tier_unit_price) : null,
          discount_pct: row.tier_discount_pct ? Number(row.tier_discount_pct) : null
        })
      }
    }
    
    // Ensamblar deals finales
    const deals: Deal[] = []
    for (const [dealId, deal] of dealsMap) {
      deal.products = Array.from(dealProductsMap.get(dealId)!.values())
      deal.tiers = Array.from(dealTiersMap.get(dealId)!.values())
      deals.push(deal)
    }
    
    return deals
  }
}

// Tipo para filas de la query de deals
interface DealQueryRow {
  deal_id: number
  title: string
  deal_type: string
  apply_mode: string
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  product_id: number | null
  product_quantity: number | null
  tier_id: number | null
  tier_min_qty: number | null
  tier_max_qty: number | null
  tier_total_price: string | null
  tier_unit_price: string | null
  tier_discount_pct: string | null
}

// ============================================================================
// SINGLETON / FACTORY
// ============================================================================

let _instance: CartPricingService | null = null

/**
 * Obtiene una instancia singleton del servicio de pricing.
 * Útil para reutilizar conexión en múltiples requests.
 */
export function getCartPricingService(): CartPricingService {
  if (!_instance) {
    _instance = new CartPricingService()
  }
  return _instance
}

/**
 * Crea una nueva instancia (útil para testing con DB de prueba)
 */
export function createCartPricingService(databaseUrl: string): CartPricingService {
  return new CartPricingService(databaseUrl)
}
