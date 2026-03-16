/**
 * Cart Pricing Engine
 * 
 * Motor de cálculo de precios para el carrito con soporte para:
 * - bundle: combo/pack con precio fijo
 * - tiered_total: precio total por cantidad (ej: "1x $45 / 3x $120")
 * - threshold_unit: precio unitario desde cierto umbral (ej: "llevando más de 2: $650 c/u")
 * - percent_off: porcentaje de descuento
 * 
 * Modos de aplicación:
 * - best_price: elegir combinación óptima de tiers
 * - repeatable: el deal puede aplicarse múltiples veces
 * - once: solo una vez por compra
 * 
 * DECISIONES DE DISEÑO:
 * 1. Los precios base SIEMPRE vienen de products.price (nunca del cliente)
 * 2. Un producto puede participar en varios deals, pero sus unidades no se 
 *    pueden "doble-consumir" (tracking de unidades disponibles)
 * 3. Estrategia greedy: evalúa deals ordenados por descuento/unidad y aplica
 *    el que más ahorra primero. No es óptimo global pero es O(n*m) razonable.
 * 4. Para tiered_total con best_price: usa DP para encontrar combinación óptima.
 * 
 * TODO (optimización global):
 * - Implementar branch & bound para encontrar la combinación óptima cuando
 *   hay múltiples deals compitiendo por los mismos productos.
 * - Considerar programación lineal para casos muy complejos.
 */

import type {
  CartItemInput,
  Deal,
  DealTier,
  PricedCartResult,
  PricedLineItem,
  DealApplication,
  ProductUnitTracker,
  DealEvaluation,
  TierCombination,
  AppliedDealInfo,
} from './types'
import { round2, sumRound, deepClone } from './utils'

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Calcula los precios del carrito aplicando deals automáticamente.
 * 
 * @param cartItems - Items del carrito con productId y qty
 * @param productPrices - Map de productId -> precio base (de DB)
 * @param deals - Deals activos y vigentes que aplican a los productos del carrito
 * @param now - Fecha actual para validar vigencia de deals
 * @returns Resultado con items priceados, deals aplicados y totales
 */
export function priceCart(
  cartItems: CartItemInput[],
  productPrices: Map<number, number>,
  deals: Deal[],
  now: Date
): PricedCartResult {
  // 1. Validar y normalizar items del carrito
  const validatedItems = validateAndNormalizeItems(cartItems, productPrices)
  
  // 2. Filtrar deals vigentes
  const activeDeals = filterActiveDeals(deals, now)
  
  // 3. Si no hay deals activos, retornar precios base
  if (activeDeals.length === 0) {
    return buildResultWithoutDeals(validatedItems)
  }

  // 4. Inicializar tracker de unidades disponibles
  const unitTrackers = initializeUnitTrackers(validatedItems)
  
  // 5. Evaluar y aplicar deals (estrategia greedy)
  const { appliedDeals } = applyDealsGreedy(
    activeDeals,
    unitTrackers,
    productPrices
  )
  
  // 6. Construir resultado final
  return buildFinalResult(validatedItems, appliedDeals)
}

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidatedItem {
  productId: number
  qty: number
  baseUnitPrice: number
}

export class MissingProductPriceError extends Error {
  readonly productId: number

  constructor(productId: number) {
    super(`Missing DB price for productId ${productId}`)
    this.name = "MissingProductPriceError"
    this.productId = productId
  }
}

function validateAndNormalizeItems(
  cartItems: CartItemInput[],
  productPrices: Map<number, number>
): ValidatedItem[] {
  return cartItems
    .filter(item => item.qty > 0)
    .map(item => {
      const dbPrice = productPrices.get(item.productId)
      if (dbPrice === undefined) {
        throw new MissingProductPriceError(item.productId)
      }
      
      // SIEMPRE usar precio de DB, ignorar unitPrice del cliente
      return {
        productId: item.productId,
        qty: item.qty,
        baseUnitPrice: dbPrice
      }
    })
}

// ============================================================================
// DEAL FILTERING
// ============================================================================

function filterActiveDeals(deals: Deal[], now: Date): Deal[] {
  return deals.filter(deal => {
    if (!deal.is_active) return false
    
    if (deal.starts_at) {
      const startsAt = new Date(deal.starts_at)
      if (now < startsAt) return false
    }
    
    if (deal.ends_at) {
      const endsAt = new Date(deal.ends_at)
      if (now > endsAt) return false
    }
    
    return true
  })
}

// ============================================================================
// UNIT TRACKING
// ============================================================================

function initializeUnitTrackers(items: ValidatedItem[]): Map<number, ProductUnitTracker> {
  const trackers = new Map<number, ProductUnitTracker>()
  
  for (const item of items) {
    trackers.set(item.productId, {
      productId: item.productId,
      totalUnits: item.qty,
      availableUnits: item.qty,
      baseUnitPrice: item.baseUnitPrice
    })
  }
  
  return trackers
}

// ============================================================================
// DEAL APPLICATION (GREEDY STRATEGY)
// ============================================================================

interface ApplyDealsResult {
  appliedDeals: DealApplication[]
  unitTrackersAfter: Map<number, ProductUnitTracker>
}

function applyDealsGreedy(
  deals: Deal[],
  unitTrackers: Map<number, ProductUnitTracker>,
  productPrices: Map<number, number>
): ApplyDealsResult {
  const appliedDeals: DealApplication[] = []
  const trackers = deepClone(Array.from(unitTrackers.entries()))
  const currentTrackers = new Map<number, ProductUnitTracker>(trackers)

  // Re-evaluar en cada iteración para evitar aplicar deals con estado obsoleto.
  const pendingDeals = [...deals]

  while (pendingDeals.length > 0) {
    const evaluations = pendingDeals
      .map(deal => evaluateDeal(deal, currentTrackers, productPrices))
      .filter(evaluation => evaluation.canApply && evaluation.maxTimesApplicable > 0)

    if (evaluations.length === 0) break

    evaluations.sort((a, b) => {
      const aDiscount = a.discountPerApplication * a.maxTimesApplicable
      const bDiscount = b.discountPerApplication * b.maxTimesApplicable
      return bDiscount - aDiscount
    })

    const bestEvaluation = evaluations[0]
    const application = applyDeal(bestEvaluation, currentTrackers, productPrices)

    if (application && application.timesApplied > 0) {
      appliedDeals.push(application)
    }

    const appliedDealId = bestEvaluation.deal.id
    const index = pendingDeals.findIndex(deal => deal.id === appliedDealId)
    if (index >= 0) {
      pendingDeals.splice(index, 1)
    }
  }

  return { appliedDeals, unitTrackersAfter: currentTrackers }
}

// ============================================================================
// DEAL EVALUATION
// ============================================================================

function evaluateDeal(
  deal: Deal,
  trackers: Map<number, ProductUnitTracker>,
  productPrices: Map<number, number>
): DealEvaluation {
  switch (deal.deal_type) {
    case 'bundle':
      return evaluateBundleDeal(deal, trackers, productPrices)
    case 'tiered_total':
      return evaluateTieredTotalDeal(deal, trackers, productPrices)
    case 'threshold_unit':
      return evaluateThresholdUnitDeal(deal, trackers, productPrices)
    case 'percent_off':
      return evaluatePercentOffDeal(deal, trackers, productPrices)
    default:
      return {
        deal,
        canApply: false,
        maxTimesApplicable: 0,
        discountPerApplication: 0,
        bestTier: null
      }
  }
}

/**
 * BUNDLE: Combo con precio fijo
 * deal_products define la "receta" del combo.
 * Se puede aplicar N veces según el mínimo de (available / required) para cada producto.
 */
function evaluateBundleDeal(
  deal: Deal,
  trackers: Map<number, ProductUnitTracker>,
  productPrices: Map<number, number>
): DealEvaluation {
  if (deal.products.length === 0 || deal.tiers.length === 0) {
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  // Calcular cuántas veces se puede aplicar el bundle
  let maxTimes = Infinity
  for (const recipe of deal.products) {
    const tracker = trackers.get(recipe.product_id)
    if (!tracker || tracker.availableUnits < recipe.quantity) {
      maxTimes = 0
      break
    }
    const timesForThisProduct = Math.floor(tracker.availableUnits / recipe.quantity)
    maxTimes = Math.min(maxTimes, timesForThisProduct)
  }
  
  if (maxTimes === 0 || maxTimes === Infinity) {
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  // Aplicar restricción de apply_mode
  if (deal.apply_mode === 'once') {
    maxTimes = 1
  }
  
  // Calcular precio base del bundle (suma de precios de productos * cantidades)
  let baseBundlePrice = 0
  for (const recipe of deal.products) {
    const price = productPrices.get(recipe.product_id) ?? 0
    baseBundlePrice += price * recipe.quantity
  }
  
  // Usar el tier base (min_qty=1 típicamente)
  const tier = deal.tiers.find(t => t.min_qty === 1) ?? deal.tiers[0]
  const dealPrice = tier.total_price ?? baseBundlePrice
  const discountPerApplication = round2(baseBundlePrice - dealPrice)
  
  return {
    deal,
    canApply: discountPerApplication > 0,
    maxTimesApplicable: maxTimes,
    discountPerApplication,
    bestTier: tier
  }
}

/**
 * TIERED_TOTAL: Precio total, unitario o porcentaje por cantidad
 * Para best_price, encuentra la combinación óptima de tiers.
 * 
 * Soporta tiers con:
 * - total_price: precio total por tier.min_qty unidades
 * - unit_price: precio por unidad cuando qty >= min_qty
 * - discount_pct: porcentaje de descuento cuando qty >= min_qty
 */
function evaluateTieredTotalDeal(
  deal: Deal,
  trackers: Map<number, ProductUnitTracker>,
  productPrices: Map<number, number>
): DealEvaluation {
  // tiered_total típicamente aplica a UN producto
  if (deal.products.length !== 1 || deal.tiers.length === 0) {
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  const productId = deal.products[0].product_id
  const tracker = trackers.get(productId)
  if (!tracker || tracker.availableUnits === 0) {
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  const qty = tracker.availableUnits
  const basePrice = productPrices.get(productId) ?? 0
  const baseTotal = round2(basePrice * qty)
  
  // Detectar qué tipo de tier usa el deal
  const usesUnitPrice = deal.tiers.some(t => t.unit_price !== null)
  const usesDiscountPct = deal.tiers.some(t => t.discount_pct !== null)
  
  if (usesUnitPrice) {
    // Modo "precio por unidad": buscar el mejor tier aplicable por cantidad
    const sortedTiers = [...deal.tiers]
      .filter(t => t.unit_price !== null)
      .sort((a, b) => b.min_qty - a.min_qty)
    
    for (const tier of sortedTiers) {
      if (qty >= tier.min_qty && (tier.max_qty === null || qty <= tier.max_qty)) {
        const dealTotal = round2(tier.unit_price! * qty)
        const discount = round2(baseTotal - dealTotal)
        
        if (discount > 0) {
          return {
            deal,
            canApply: true,
            maxTimesApplicable: 1,
            discountPerApplication: discount,
            bestTier: tier
          }
        }
      }
    }
    
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  if (usesDiscountPct) {
    // Modo "porcentaje de descuento": buscar el mejor tier aplicable por cantidad
    const sortedTiers = [...deal.tiers]
      .filter(t => t.discount_pct !== null)
      .sort((a, b) => b.min_qty - a.min_qty)
    
    for (const tier of sortedTiers) {
      if (qty >= tier.min_qty && (tier.max_qty === null || qty <= tier.max_qty)) {
        const discount = round2(baseTotal * (tier.discount_pct! / 100))
        
        if (discount > 0) {
          return {
            deal,
            canApply: true,
            maxTimesApplicable: 1,
            discountPerApplication: discount,
            bestTier: tier
          }
        }
      }
    }
    
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  // Modo total_price tradicional
  if (deal.apply_mode === 'best_price') {
    // Usar DP para encontrar la combinación óptima
    const optimal = findOptimalTierCombination(deal.tiers, qty, basePrice)
    if (optimal && optimal.totalPrice < baseTotal) {
      return {
        deal,
        canApply: true,
        maxTimesApplicable: 1, // Para best_price, se aplica una vez con la combinación óptima
        discountPerApplication: optimal.totalDiscount,
        bestTier: null, // Usamos optimalCombination en su lugar
        optimalCombination: optimal
      }
    }
  } else {
    // repeatable u once: buscar el mejor tier aplicable
    const sortedTiers = [...deal.tiers].sort((a, b) => b.min_qty - a.min_qty)
    
    for (const tier of sortedTiers) {
      if (qty >= tier.min_qty && (tier.max_qty === null || qty <= tier.max_qty)) {
        const tierPrice = tier.total_price ?? baseTotal
        const discount = round2(baseTotal - tierPrice)
        
        if (discount > 0) {
          let maxTimes = 1
          if (deal.apply_mode === 'repeatable') {
            maxTimes = Math.floor(qty / tier.min_qty)
          }
          
          return {
            deal,
            canApply: true,
            maxTimesApplicable: maxTimes,
            discountPerApplication: discount,
            bestTier: tier
          }
        }
      }
    }
  }
  
  return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
}

/**
 * THRESHOLD_UNIT: Precio desde cierto umbral de cantidad
 * Interpretación: si qty >= min_qty, se aplica el descuento a TODAS las unidades.
 * 
 * Soporta tiers con:
 * - unit_price: precio por unidad (ej: "llevando 3+: $650 c/u")
 * - total_price: precio total fijo (ej: "llevando 3+: $1800 total")
 * - discount_pct: porcentaje de descuento (ej: "llevando 3+: 20% off")
 */
function evaluateThresholdUnitDeal(
  deal: Deal,
  trackers: Map<number, ProductUnitTracker>,
  productPrices: Map<number, number>
): DealEvaluation {
  if (deal.products.length !== 1 || deal.tiers.length === 0) {
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  const productId = deal.products[0].product_id
  const tracker = trackers.get(productId)
  if (!tracker || tracker.availableUnits === 0) {
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  const qty = tracker.availableUnits
  const basePrice = productPrices.get(productId) ?? 0
  const baseTotal = round2(basePrice * qty)
  
  // Buscar el tier aplicable (ordenar por min_qty descendente para encontrar el mejor)
  const sortedTiers = [...deal.tiers].sort((a, b) => b.min_qty - a.min_qty)
  
  for (const tier of sortedTiers) {
    if (qty < tier.min_qty) continue
    if (tier.max_qty !== null && qty > tier.max_qty) continue
    
    let dealTotal: number
    
    if (tier.unit_price !== null) {
      // Precio por unidad
      dealTotal = round2(tier.unit_price * qty)
    } else if (tier.total_price !== null) {
      // Precio total fijo
      dealTotal = tier.total_price
    } else if (tier.discount_pct !== null) {
      // Porcentaje de descuento
      dealTotal = round2(baseTotal * (1 - tier.discount_pct / 100))
    } else {
      continue
    }
    
    const discount = round2(baseTotal - dealTotal)
    
    if (discount > 0) {
      return {
        deal,
        canApply: true,
        maxTimesApplicable: 1, // Se aplica a todas las unidades una vez
        discountPerApplication: discount,
        bestTier: tier
      }
    }
  }
  
  return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
}

/**
 * PERCENT_OFF: Porcentaje de descuento
 * Aplica el porcentaje a TODAS las unidades de los productos afectados.
 */
function evaluatePercentOffDeal(
  deal: Deal,
  trackers: Map<number, ProductUnitTracker>,
  productPrices: Map<number, number>
): DealEvaluation {
  if (deal.products.length === 0 || deal.tiers.length === 0) {
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  // Calcular descuento total potencial sobre TODAS las unidades de los productos
  let totalBasePrice = 0
  let allProductsAvailable = true
  
  for (const recipe of deal.products) {
    const tracker = trackers.get(recipe.product_id)
    if (!tracker || tracker.availableUnits < recipe.quantity) {
      allProductsAvailable = false
      break
    }
    const price = productPrices.get(recipe.product_id) ?? 0
    // Usar TODAS las unidades disponibles, no solo recipe.quantity
    totalBasePrice += price * tracker.availableUnits
  }
  
  if (!allProductsAvailable) {
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  const tier = deal.tiers[0]
  if (tier.discount_pct === null) {
    return { deal, canApply: false, maxTimesApplicable: 0, discountPerApplication: 0, bestTier: null }
  }
  
  const discount = round2(totalBasePrice * (tier.discount_pct / 100))
  
  let maxTimes = 1
  if (deal.apply_mode === 'once') {
    maxTimes = 1
  } else if (deal.apply_mode === 'repeatable') {
    // Para percent_off repeatable, calcular cuántas "unidades de deal" caben
    let minTimesAvailable = Infinity
    for (const recipe of deal.products) {
      const tracker = trackers.get(recipe.product_id)!
      minTimesAvailable = Math.min(minTimesAvailable, Math.floor(tracker.availableUnits / recipe.quantity))
    }
    maxTimes = minTimesAvailable === Infinity ? 1 : minTimesAvailable
  }
  
  return {
    deal,
    canApply: discount > 0,
    maxTimesApplicable: maxTimes,
    discountPerApplication: discount,
    bestTier: tier
  }
}

// ============================================================================
// OPTIMAL TIER COMBINATION (DP for tiered_total + best_price)
// ============================================================================

/**
 * Encuentra la combinación óptima de tiers para minimizar el precio total.
 * Usa programación dinámica: dp[q] = mínimo costo para cubrir q unidades.
 * 
 * Ejemplo: qty=5, tiers=[{min:1, price:45}, {min:3, price:120}]
 * - 5x tier1 = $225
 * - 1x tier2 + 2x tier1 = $120 + $90 = $210
 * - Óptimo: $210
 */
function findOptimalTierCombination(
  tiers: DealTier[],
  qty: number,
  baseUnitPrice: number
): TierCombination | null {
  if (tiers.length === 0 || qty === 0) return null
  
  // dp[q] = { minCost, combination }
  const INF = Number.MAX_SAFE_INTEGER
  const dp: number[] = new Array(qty + 1).fill(INF)
  const parent: Array<{ tier: DealTier; prevQty: number } | null> = new Array(qty + 1).fill(null)
  
  dp[0] = 0
  
  for (let q = 1; q <= qty; q++) {
    // Opción 1: pagar precio base por esta unidad
    const baseCost = dp[q - 1] + baseUnitPrice
    if (baseCost < dp[q]) {
      dp[q] = baseCost
      parent[q] = null // Sin tier, precio base
    }
    
    // Opción 2: aplicar algún tier que cubra hasta q
    for (const tier of tiers) {
      if (tier.total_price === null) continue
      if (tier.min_qty > q) continue
      
      const prevQ = q - tier.min_qty
      if (prevQ < 0) continue
      
      const costWithTier = dp[prevQ] + tier.total_price
      if (costWithTier < dp[q]) {
        dp[q] = costWithTier
        parent[q] = { tier, prevQty: prevQ }
      }
    }
  }
  
  if (dp[qty] === INF) return null
  
  // Reconstruir la combinación
  const tierCounts = new Map<number, { tier: DealTier; count: number }>()
  let currentQ = qty
  
  while (currentQ > 0) {
    const p = parent[currentQ]
    if (p === null) {
      // Una unidad a precio base
      currentQ--
    } else {
      const tierId = p.tier.id
      if (tierCounts.has(tierId)) {
        tierCounts.get(tierId)!.count++
      } else {
        tierCounts.set(tierId, { tier: p.tier, count: 1 })
      }
      currentQ = p.prevQty
    }
  }
  
  const tiersUsed = Array.from(tierCounts.values()).map(({ tier, count }) => ({
    tier,
    timesUsed: count
  }))
  
  const totalPrice = dp[qty]
  const baseTotal = round2(baseUnitPrice * qty)
  const totalDiscount = round2(baseTotal - totalPrice)
  
  return {
    tiers: tiersUsed,
    totalUnits: qty,
    totalPrice: round2(totalPrice),
    totalDiscount
  }
}

// ============================================================================
// DEAL APPLICATION
// ============================================================================

function applyDeal(
  evaluation: DealEvaluation,
  trackers: Map<number, ProductUnitTracker>,
  productPrices: Map<number, number>
): DealApplication | null {
  const { deal, maxTimesApplicable, discountPerApplication, bestTier, optimalCombination } = evaluation
  
  if (maxTimesApplicable === 0) return null
  
  const affectedProducts: Array<{ productId: number; unitsUsed: number }> = []
  let timesApplied = 0
  let totalDiscount = 0
  
  switch (deal.deal_type) {
    case 'bundle': {
      // Aplicar bundle maxTimesApplicable veces
      timesApplied = maxTimesApplicable
      totalDiscount = round2(discountPerApplication * timesApplied)
      
      for (const recipe of deal.products) {
        const tracker = trackers.get(recipe.product_id)!
        const unitsUsed = recipe.quantity * timesApplied
        tracker.availableUnits -= unitsUsed
        affectedProducts.push({ productId: recipe.product_id, unitsUsed })
      }
      break
    }
    
    case 'tiered_total': {
      if (optimalCombination) {
        // best_price mode con total_price
        timesApplied = 1
        totalDiscount = optimalCombination.totalDiscount
        
        const productId = deal.products[0].product_id
        const tracker = trackers.get(productId)!
        tracker.availableUnits = 0 // Todas las unidades consumidas
        affectedProducts.push({ productId, unitsUsed: optimalCombination.totalUnits })
      } else if (bestTier) {
        // Caso con unit_price, discount_pct, o repeatable/once con total_price
        timesApplied = 1
        totalDiscount = discountPerApplication
        const productId = deal.products[0].product_id
        const tracker = trackers.get(productId)!
        
        if (bestTier.unit_price !== null || bestTier.discount_pct !== null) {
          // unit_price o discount_pct: se aplica a todas las unidades disponibles
          affectedProducts.push({ productId, unitsUsed: tracker.availableUnits })
          tracker.availableUnits = 0
        } else if (deal.apply_mode === 'repeatable' && bestTier.total_price !== null) {
          // repeatable con total_price
          timesApplied = maxTimesApplicable
          const unitsUsed = bestTier.min_qty * timesApplied
          const basePrice = productPrices.get(productId) ?? 0
          const baseTotal = round2(basePrice * unitsUsed)
          const dealTotal = round2(bestTier.total_price * timesApplied)
          totalDiscount = round2(baseTotal - dealTotal)
          tracker.availableUnits -= unitsUsed
          affectedProducts.push({ productId, unitsUsed })
        } else {
          // once mode
          affectedProducts.push({ productId, unitsUsed: tracker.totalUnits })
          tracker.availableUnits = 0
        }
      }
      break
    }
    
    case 'threshold_unit': {
      timesApplied = 1
      totalDiscount = discountPerApplication
      
      const productId = deal.products[0].product_id
      const tracker = trackers.get(productId)!
      affectedProducts.push({ productId, unitsUsed: tracker.availableUnits })
      tracker.availableUnits = 0
      break
    }
    
    case 'percent_off': {
      // percent_off aplica a TODAS las unidades, una sola vez
      timesApplied = 1
      totalDiscount = discountPerApplication
      
      for (const recipe of deal.products) {
        const tracker = trackers.get(recipe.product_id)!
        const unitsUsed = tracker.availableUnits // Todas las unidades
        tracker.availableUnits = 0
        affectedProducts.push({ productId: recipe.product_id, unitsUsed })
      }
      break
    }
  }
  
  return {
    dealId: deal.id,
    title: deal.title,
    timesApplied,
    tierUsed: bestTier ? {
      minQty: bestTier.min_qty,
      maxQty: bestTier.max_qty,
      price: bestTier.total_price,
      unitPrice: bestTier.unit_price,
      discountPct: bestTier.discount_pct
    } : undefined,
    discountTotal: totalDiscount,
    affectedProducts
  }
}

// ============================================================================
// RESULT BUILDING
// ============================================================================

function buildResultWithoutDeals(items: ValidatedItem[]): PricedCartResult {
  const pricedItems: PricedLineItem[] = items.map(item => ({
    productId: item.productId,
    qty: item.qty,
    baseUnitPrice: item.baseUnitPrice,
    finalUnitPrice: item.baseUnitPrice,
    lineBaseTotal: round2(item.baseUnitPrice * item.qty),
    lineFinalTotal: round2(item.baseUnitPrice * item.qty),
    appliedDeals: []
  }))
  
  const baseTotal = sumRound(pricedItems.map(i => i.lineBaseTotal))
  
  return {
    items: pricedItems,
    dealsApplied: [],
    totals: {
      baseTotal,
      discountTotal: 0,
      finalTotal: baseTotal
    }
  }
}

function buildFinalResult(
  items: ValidatedItem[],
  appliedDeals: DealApplication[]
): PricedCartResult {
  // Construir mapa de productId -> deals que lo afectan
  const productDeals = new Map<number, AppliedDealInfo[]>()
  
  for (const deal of appliedDeals) {
    for (const affected of deal.affectedProducts) {
      if (!productDeals.has(affected.productId)) {
        productDeals.set(affected.productId, [])
      }
      productDeals.get(affected.productId)!.push({
        dealId: deal.dealId,
        dealTitle: deal.title,
        tierUsed: deal.tierUsed
      })
    }
  }
  
  // Calcular precio final por línea
  const pricedItems: PricedLineItem[] = items.map(item => {
    const baseTotal = round2(item.baseUnitPrice * item.qty)
    const deals = productDeals.get(item.productId) || []
    
    // Calcular descuento total para este producto
    let productDiscount = 0
    for (const deal of appliedDeals) {
      const affected = deal.affectedProducts.find(a => a.productId === item.productId)
      if (affected) {
        // Proporción del descuento que corresponde a este producto
        const totalAffectedUnits = deal.affectedProducts.reduce((sum, a) => sum + a.unitsUsed, 0)
        if (totalAffectedUnits > 0) {
          productDiscount += round2((affected.unitsUsed / totalAffectedUnits) * deal.discountTotal)
        }
      }
    }
    
    const lineFinalTotal = round2(baseTotal - productDiscount)
    const finalUnitPrice = item.qty > 0 ? round2(lineFinalTotal / item.qty) : item.baseUnitPrice
    
    return {
      productId: item.productId,
      qty: item.qty,
      baseUnitPrice: item.baseUnitPrice,
      finalUnitPrice,
      lineBaseTotal: baseTotal,
      lineFinalTotal,
      appliedDeals: deals
    }
  })
  
  const baseTotal = sumRound(pricedItems.map(i => i.lineBaseTotal))
  const discountTotal = sumRound(appliedDeals.map(d => d.discountTotal))
  const finalTotal = round2(baseTotal - discountTotal)
  
  return {
    items: pricedItems,
    dealsApplied: appliedDeals,
    totals: {
      baseTotal,
      discountTotal,
      finalTotal
    }
  }
}
