/**
 * Cart Pricing Module
 *
 * Exports all pieces needed by API routes and UI integration.
 */

// Types
export type {
  CartItemInput,
  DealType,
  ApplyMode,
  DealTier,
  DealProductRecipe,
  Deal,
  ProductPrice,
  AppliedDealInfo,
  PricedLineItem,
  DealApplication,
  CartTotals,
  PricedCartResult,
} from "./types"

// Engine (pure function)
export { priceCart, MissingProductPriceError } from "./engine"

// Service (DB-backed)
export {
  CartPricingService,
  InvalidCartProductsError,
  getCartPricingService,
  createCartPricingService,
} from "./service"

// Utils
export { round2, sumRound } from "./utils"
