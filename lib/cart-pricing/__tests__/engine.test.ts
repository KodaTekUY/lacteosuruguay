/**
 * Tests para el Cart Pricing Engine
 * 
 * Ejecutar con: npx vitest run lib/cart-pricing/__tests__/engine.test.ts
 * O: npx jest lib/cart-pricing/__tests__/engine.test.ts
 */

import { describe, it, expect } from 'vitest'
import { MissingProductPriceError, priceCart } from '../engine'
import type { Deal, CartItemInput } from '../types'

// ============================================================================
// TEST FIXTURES
// ============================================================================

function makeProductPrices(prices: Record<number, number>): Map<number, number> {
  return new Map(Object.entries(prices).map(([k, v]) => [Number(k), v]))
}

const NOW = new Date('2025-01-08T12:00:00Z')

// ============================================================================
// BASIC TESTS (sin deals)
// ============================================================================

describe('priceCart - básico', () => {
  it('carrito vacío devuelve totales en cero', () => {
    const result = priceCart([], new Map(), [], NOW)
    
    expect(result.items).toEqual([])
    expect(result.dealsApplied).toEqual([])
    expect(result.totals).toEqual({
      baseTotal: 0,
      discountTotal: 0,
      finalTotal: 0
    })
  })
  
  it('sin deals aplica precios base', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 2 },
      { productId: 2, qty: 3 }
    ]
    const prices = makeProductPrices({ 1: 10, 2: 20 })
    
    const result = priceCart(items, prices, [], NOW)
    
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({
      productId: 1,
      qty: 2,
      baseUnitPrice: 10,
      finalUnitPrice: 10,
      lineBaseTotal: 20,
      lineFinalTotal: 20
    })
    expect(result.items[1]).toMatchObject({
      productId: 2,
      qty: 3,
      baseUnitPrice: 20,
      finalUnitPrice: 20,
      lineBaseTotal: 60,
      lineFinalTotal: 60
    })
    expect(result.totals).toEqual({
      baseTotal: 80,
      discountTotal: 0,
      finalTotal: 80
    })
  })
  
  it('ignora precio unitPrice del cliente y usa precio de DB', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 1, unitPrice: 999 } // Cliente intenta truchar precio
    ]
    const prices = makeProductPrices({ 1: 50 })
    
    const result = priceCart(items, prices, [], NOW)
    
    expect(result.items[0].baseUnitPrice).toBe(50) // Usa precio de DB
    expect(result.items[0].lineFinalTotal).toBe(50)
  })

  it('lanza error si hay productos del carrito sin precio en DB', () => {
    const items: CartItemInput[] = [
      { productId: 999, qty: 1 }
    ]
    const prices = makeProductPrices({})

    expect(() => priceCart(items, prices, [], NOW)).toThrow(MissingProductPriceError)
  })
  
  it('filtra items con qty <= 0', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 0 },
      { productId: 2, qty: -1 },
      { productId: 3, qty: 2 }
    ]
    const prices = makeProductPrices({ 1: 10, 2: 20, 3: 30 })
    
    const result = priceCart(items, prices, [], NOW)
    
    expect(result.items).toHaveLength(1)
    expect(result.items[0].productId).toBe(3)
  })
})

// ============================================================================
// BUNDLE TESTS
// ============================================================================

describe('priceCart - bundle deals', () => {
  it('aplica bundle simple (Mayo + Atún = $240)', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 1 }, // Mayonesa $150
      { productId: 2, qty: 1 }  // Atún $120
    ]
    const prices = makeProductPrices({ 1: 150, 2: 120 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Mayonesa + Atún',
      deal_type: 'bundle',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [
        { product_id: 1, quantity: 1 },
        { product_id: 2, quantity: 1 }
      ],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: 240, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    expect(result.dealsApplied).toHaveLength(1)
    expect(result.dealsApplied[0]).toMatchObject({
      dealId: 1,
      title: 'Mayonesa + Atún',
      timesApplied: 1,
      discountTotal: 30 // 270 - 240 = 30
    })
    expect(result.totals).toEqual({
      baseTotal: 270,
      discountTotal: 30,
      finalTotal: 240
    })
  })
  
  it('bundle se aplica múltiples veces si hay stock', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 3 }, // 3 Mayonesas
      { productId: 2, qty: 3 }  // 3 Atunes
    ]
    const prices = makeProductPrices({ 1: 150, 2: 120 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Mayonesa + Atún',
      deal_type: 'bundle',
      apply_mode: 'repeatable',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [
        { product_id: 1, quantity: 1 },
        { product_id: 2, quantity: 1 }
      ],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: 240, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    expect(result.dealsApplied[0].timesApplied).toBe(3)
    expect(result.dealsApplied[0].discountTotal).toBe(90) // 30 * 3
    expect(result.totals.finalTotal).toBe(720) // 810 - 90
  })
  
  it('bundle con apply_mode=once solo se aplica una vez', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 3 },
      { productId: 2, qty: 3 }
    ]
    const prices = makeProductPrices({ 1: 150, 2: 120 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Mayonesa + Atún',
      deal_type: 'bundle',
      apply_mode: 'once',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [
        { product_id: 1, quantity: 1 },
        { product_id: 2, quantity: 1 }
      ],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: 240, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    expect(result.dealsApplied[0].timesApplied).toBe(1)
    expect(result.dealsApplied[0].discountTotal).toBe(30)
  })
  
  it('bundle pack x2 (Cristal pack x2 $165)', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 4 } // 4 Cristales
    ]
    const prices = makeProductPrices({ 1: 99 }) // $99 c/u
    const deals: Deal[] = [{
      id: 1,
      title: 'Cristal pack x2',
      deal_type: 'bundle',
      apply_mode: 'repeatable',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [
        { product_id: 1, quantity: 2 } // 2 por pack
      ],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: 165, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // 4 unidades = 2 packs
    expect(result.dealsApplied[0].timesApplied).toBe(2)
    // Base: 4 * 99 = 396
    // Deal: 2 * 165 = 330
    // Descuento: 396 - 330 = 66
    expect(result.totals.baseTotal).toBe(396)
    expect(result.totals.discountTotal).toBe(66)
    expect(result.totals.finalTotal).toBe(330)
  })
  
  it('bundle no aplica si falta un producto', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 2 } // Solo mayonesa, falta atún
    ]
    const prices = makeProductPrices({ 1: 150 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Mayonesa + Atún',
      deal_type: 'bundle',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [
        { product_id: 1, quantity: 1 },
        { product_id: 2, quantity: 1 }
      ],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: 240, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    expect(result.dealsApplied).toHaveLength(0)
    expect(result.totals.finalTotal).toBe(300)
  })
})

// ============================================================================
// TIERED_TOTAL TESTS
// ============================================================================

describe('priceCart - tiered_total deals', () => {
  it('aplica tier básico (1x $45)', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 1 }
    ]
    const prices = makeProductPrices({ 1: 50 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Toalla Promo',
      deal_type: 'tiered_total',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: 45, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    expect(result.totals.finalTotal).toBe(45)
    expect(result.totals.discountTotal).toBe(5)
  })
  
  it('best_price elige tier óptimo (qty=3, tier 3x$120)', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 3 }
    ]
    const prices = makeProductPrices({ 1: 50 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Toalla Promo',
      deal_type: 'tiered_total',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: 45, unit_price: null, discount_pct: null },
        { id: 2, deal_id: 1, min_qty: 3, max_qty: null, total_price: 120, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 3 * 50 = 150
    // Óptimo: tier 3x$120
    expect(result.totals.baseTotal).toBe(150)
    expect(result.totals.finalTotal).toBe(120)
    expect(result.totals.discountTotal).toBe(30)
  })
  
  it('best_price combina tiers óptimamente (qty=5: 1x tier3 + 2x tier1)', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 5 }
    ]
    const prices = makeProductPrices({ 1: 50 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Toalla Promo',
      deal_type: 'tiered_total',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: 45, unit_price: null, discount_pct: null },
        { id: 2, deal_id: 1, min_qty: 3, max_qty: null, total_price: 120, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 5 * 50 = 250
    // Opciones:
    // - 5x tier1 = 5 * 45 = 225
    // - 1x tier3 + 2x tier1 = 120 + 90 = 210 ← óptimo
    expect(result.totals.baseTotal).toBe(250)
    expect(result.totals.finalTotal).toBe(210)
    expect(result.totals.discountTotal).toBe(40)
  })
  
  it('repeatable aplica tier múltiples veces', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 6 }
    ]
    const prices = makeProductPrices({ 1: 50 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Toalla Promo',
      deal_type: 'tiered_total',
      apply_mode: 'repeatable',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 3, max_qty: null, total_price: 120, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // 6 unidades / 3 por tier = 2 aplicaciones
    expect(result.dealsApplied[0].timesApplied).toBe(2)
    // Base: 6 * 50 = 300
    // Deal: 2 * 120 = 240
    expect(result.totals.finalTotal).toBe(240)
  })
  
  it('aplica tiered_total con unit_price (precio c/u por cantidad)', () => {
    // Caso: producto base $50, tier1: $45 c/u (1+), tier2: $40 c/u (3+)
    const items: CartItemInput[] = [
      { productId: 1, qty: 4 }
    ]
    const prices = makeProductPrices({ 1: 50 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Promo por cantidad',
      deal_type: 'tiered_total',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: 45, discount_pct: null },
        { id: 2, deal_id: 1, min_qty: 3, max_qty: null, total_price: null, unit_price: 40, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 4 * 50 = 200
    // Con qty=4 >= 3, se aplica tier2: 4 * 40 = 160
    // Descuento: 200 - 160 = 40
    expect(result.totals.baseTotal).toBe(200)
    expect(result.totals.finalTotal).toBe(160)
    expect(result.totals.discountTotal).toBe(40)
    expect(result.dealsApplied).toHaveLength(1)
    expect(result.dealsApplied[0].tierUsed?.unitPrice).toBe(40)
  })
  
  it('aplica tier1 con unit_price cuando qty < tier2.min_qty', () => {
    // Caso: qty=2, solo califica para tier1 ($45 c/u)
    const items: CartItemInput[] = [
      { productId: 1, qty: 2 }
    ]
    const prices = makeProductPrices({ 1: 50 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Promo por cantidad',
      deal_type: 'tiered_total',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: 45, discount_pct: null },
        { id: 2, deal_id: 1, min_qty: 3, max_qty: null, total_price: null, unit_price: 40, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 2 * 50 = 100
    // Con qty=2, se aplica tier1: 2 * 45 = 90
    // Descuento: 100 - 90 = 10
    expect(result.totals.baseTotal).toBe(100)
    expect(result.totals.finalTotal).toBe(90)
    expect(result.totals.discountTotal).toBe(10)
    expect(result.dealsApplied[0].tierUsed?.unitPrice).toBe(45)
  })
  
  it('aplica tiered_total con discount_pct (% descuento por cantidad)', () => {
    // Caso: producto base $100, tier1: 5% off (1+), tier2: 15% off (3+)
    const items: CartItemInput[] = [
      { productId: 1, qty: 4 }
    ]
    const prices = makeProductPrices({ 1: 100 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Descuento por cantidad',
      deal_type: 'tiered_total',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: null, discount_pct: 5 },
        { id: 2, deal_id: 1, min_qty: 3, max_qty: null, total_price: null, unit_price: null, discount_pct: 15 }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 4 * 100 = 400
    // Con qty=4 >= 3, se aplica tier2: 15% off = 400 * 0.15 = 60 descuento
    // Final: 400 - 60 = 340
    expect(result.totals.baseTotal).toBe(400)
    expect(result.totals.discountTotal).toBe(60)
    expect(result.totals.finalTotal).toBe(340)
    expect(result.dealsApplied).toHaveLength(1)
    expect(result.dealsApplied[0].tierUsed?.discountPct).toBe(15)
  })
  
  it('aplica tier1 discount_pct cuando qty < tier2.min_qty', () => {
    // Caso: qty=2, solo califica para tier1 (5% off)
    const items: CartItemInput[] = [
      { productId: 1, qty: 2 }
    ]
    const prices = makeProductPrices({ 1: 100 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Descuento por cantidad',
      deal_type: 'tiered_total',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: null, discount_pct: 5 },
        { id: 2, deal_id: 1, min_qty: 3, max_qty: null, total_price: null, unit_price: null, discount_pct: 15 }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 2 * 100 = 200
    // Con qty=2, se aplica tier1: 5% off = 200 * 0.05 = 10 descuento
    // Final: 200 - 10 = 190
    expect(result.totals.baseTotal).toBe(200)
    expect(result.totals.discountTotal).toBe(10)
    expect(result.totals.finalTotal).toBe(190)
    expect(result.dealsApplied[0].tierUsed?.discountPct).toBe(5)
  })
})

// ============================================================================
// THRESHOLD_UNIT TESTS
// ============================================================================

describe('priceCart - threshold_unit deals', () => {
  it('aplica precio unitario cuando qty >= min_qty', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 3 }
    ]
    const prices = makeProductPrices({ 1: 799 }) // Johnnie Walker $799
    const deals: Deal[] = [{
      id: 1,
      title: 'JW Red llevando +2',
      deal_type: 'threshold_unit',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 3, max_qty: null, total_price: null, unit_price: 650, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 3 * 799 = 2397
    // Deal: 3 * 650 = 1950
    expect(result.totals.baseTotal).toBe(2397)
    expect(result.totals.finalTotal).toBe(1950)
    expect(result.totals.discountTotal).toBe(447) // 149 * 3
  })
  
  it('no aplica si qty < min_qty', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 2 } // Solo 2, necesita 3
    ]
    const prices = makeProductPrices({ 1: 799 })
    const deals: Deal[] = [{
      id: 1,
      title: 'JW Red llevando +2',
      deal_type: 'threshold_unit',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 3, max_qty: null, total_price: null, unit_price: 650, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    expect(result.dealsApplied).toHaveLength(0)
    expect(result.totals.finalTotal).toBe(1598) // 2 * 799
  })
  
  it('aplica threshold_unit con total_price (precio fijo desde umbral)', () => {
    // Caso: "Llevando 3+: $1800 total" (normalmente sería 3 * 799 = 2397)
    const items: CartItemInput[] = [
      { productId: 1, qty: 3 }
    ]
    const prices = makeProductPrices({ 1: 799 })
    const deals: Deal[] = [{
      id: 1,
      title: 'JW Red 3x$1800',
      deal_type: 'threshold_unit',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 3, max_qty: null, total_price: 1800, unit_price: null, discount_pct: null }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 3 * 799 = 2397
    // Deal: $1800 total
    // Descuento: 2397 - 1800 = 597
    expect(result.totals.baseTotal).toBe(2397)
    expect(result.totals.finalTotal).toBe(1800)
    expect(result.totals.discountTotal).toBe(597)
    expect(result.dealsApplied[0].tierUsed?.price).toBe(1800)
  })
  
  it('aplica threshold_unit con discount_pct (% desde umbral)', () => {
    // Caso: "Llevando 3+: 25% off"
    const items: CartItemInput[] = [
      { productId: 1, qty: 4 }
    ]
    const prices = makeProductPrices({ 1: 100 })
    const deals: Deal[] = [{
      id: 1,
      title: '25% off llevando 3+',
      deal_type: 'threshold_unit',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 3, max_qty: null, total_price: null, unit_price: null, discount_pct: 25 }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 4 * 100 = 400
    // Deal: 400 * 0.75 = 300
    // Descuento: 400 * 0.25 = 100
    expect(result.totals.baseTotal).toBe(400)
    expect(result.totals.finalTotal).toBe(300)
    expect(result.totals.discountTotal).toBe(100)
    expect(result.dealsApplied[0].tierUsed?.discountPct).toBe(25)
  })
})

// ============================================================================
// PERCENT_OFF TESTS
// ============================================================================

describe('priceCart - percent_off deals', () => {
  it('aplica descuento porcentual', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 2 }
    ]
    const prices = makeProductPrices({ 1: 100 })
    const deals: Deal[] = [{
      id: 1,
      title: '20% off',
      deal_type: 'percent_off',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: null, discount_pct: 20 }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 2 * 100 = 200
    // Descuento: 200 * 0.20 = 40
    expect(result.totals.baseTotal).toBe(200)
    expect(result.totals.discountTotal).toBe(40)
    expect(result.totals.finalTotal).toBe(160)
  })
})

// ============================================================================
// DATE FILTERING TESTS
// ============================================================================

describe('priceCart - filtrado por fechas', () => {
  it('no aplica deal que aún no comienza', () => {
    const items: CartItemInput[] = [{ productId: 1, qty: 1 }]
    const prices = makeProductPrices({ 1: 100 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Futuro Deal',
      deal_type: 'percent_off',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: '2025-12-01T00:00:00Z', // Futuro
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: null, discount_pct: 50 }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    expect(result.dealsApplied).toHaveLength(0)
    expect(result.totals.finalTotal).toBe(100)
  })
  
  it('no aplica deal vencido', () => {
    const items: CartItemInput[] = [{ productId: 1, qty: 1 }]
    const prices = makeProductPrices({ 1: 100 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Deal Vencido',
      deal_type: 'percent_off',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: '2024-01-01T00:00:00Z',
      ends_at: '2024-12-31T23:59:59Z', // Vencido
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: null, discount_pct: 50 }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    expect(result.dealsApplied).toHaveLength(0)
  })
  
  it('no aplica deal inactivo', () => {
    const items: CartItemInput[] = [{ productId: 1, qty: 1 }]
    const prices = makeProductPrices({ 1: 100 })
    const deals: Deal[] = [{
      id: 1,
      title: 'Deal Inactivo',
      deal_type: 'percent_off',
      apply_mode: 'best_price',
      is_active: false, // Inactivo
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: null, discount_pct: 50 }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    expect(result.dealsApplied).toHaveLength(0)
  })
})

// ============================================================================
// ROUNDING TESTS
// ============================================================================

describe('priceCart - redondeo', () => {
  it('redondea a 2 decimales correctamente', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 3 }
    ]
    const prices = makeProductPrices({ 1: 9.99 })
    
    const result = priceCart(items, prices, [], NOW)
    
    // 3 * 9.99 = 29.97
    expect(result.totals.baseTotal).toBe(29.97)
    expect(result.totals.finalTotal).toBe(29.97)
  })
  
  it('maneja descuentos con decimales', () => {
    const items: CartItemInput[] = [
      { productId: 1, qty: 3 }
    ]
    const prices = makeProductPrices({ 1: 10 })
    const deals: Deal[] = [{
      id: 1,
      title: '33% off',
      deal_type: 'percent_off',
      apply_mode: 'best_price',
      is_active: true,
      starts_at: null,
      ends_at: null,
      products: [{ product_id: 1, quantity: 1 }],
      tiers: [
        { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: null, discount_pct: 33.33 }
      ]
    }]
    
    const result = priceCart(items, prices, deals, NOW)
    
    // Base: 30
    // Descuento: 30 * 0.3333 = 9.999 → 10.00
    expect(result.totals.discountTotal).toBe(10)
    expect(result.totals.finalTotal).toBe(20)
  })
})

// ============================================================================
// REGRESSION TESTS
// ============================================================================

describe('priceCart - regresiones críticas', () => {
  it('no aplica un segundo deal cuando el primero ya consumió las unidades', () => {
    const items: CartItemInput[] = [{ productId: 1, qty: 1 }]
    const prices = makeProductPrices({ 1: 100 })
    const deals: Deal[] = [
      {
        id: 1,
        title: '50% OFF',
        deal_type: 'percent_off',
        apply_mode: 'once',
        is_active: true,
        starts_at: null,
        ends_at: null,
        products: [{ product_id: 1, quantity: 1 }],
        tiers: [
          { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: null, unit_price: null, discount_pct: 50 },
        ],
      },
      {
        id: 2,
        title: '10% OFF umbral',
        deal_type: 'threshold_unit',
        apply_mode: 'once',
        is_active: true,
        starts_at: null,
        ends_at: null,
        products: [{ product_id: 1, quantity: 1 }],
        tiers: [
          { id: 2, deal_id: 2, min_qty: 1, max_qty: null, total_price: null, unit_price: null, discount_pct: 10 },
        ],
      },
    ]

    const result = priceCart(items, prices, deals, NOW)

    expect(result.dealsApplied).toHaveLength(1)
    expect(result.dealsApplied[0].dealId).toBe(1)
    expect(result.dealsApplied[0].discountTotal).toBe(50)
    expect(result.totals).toEqual({
      baseTotal: 100,
      discountTotal: 50,
      finalTotal: 50,
    })
    expect(result.items[0].lineFinalTotal).toBe(50)
    const sumLines = result.items.reduce((sum, item) => sum + item.lineFinalTotal, 0)
    expect(sumLines).toBe(result.totals.finalTotal)
  })
})
