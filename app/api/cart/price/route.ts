/**
 * POST /api/cart/price
 * 
 * Endpoint para calcular el pricing del carrito con deals aplicados.
 * 
 * Request body:
 * {
 *   items: [{ productId: number, qty: number }]
 * }
 * 
 * Response:
 * {
 *   items: [...],
 *   dealsApplied: [...],
 *   totals: { baseTotal, discountTotal, finalTotal }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCartPricingService, type CartItemInput } from '@/lib/cart-pricing'

// Schema de validación simple
interface RequestBody {
  items: Array<{
    productId: number
    qty: number
  }>
}

function validateRequest(body: unknown): { valid: true; data: RequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' }
  }
  
  const b = body as Record<string, unknown>
  
  if (!Array.isArray(b.items)) {
    return { valid: false, error: 'items must be an array' }
  }
  
  for (let i = 0; i < b.items.length; i++) {
    const item = b.items[i]
    if (!item || typeof item !== 'object') {
      return { valid: false, error: `items[${i}] must be an object` }
    }
    
    const it = item as Record<string, unknown>
    
    if (typeof it.productId !== 'number' || !Number.isInteger(it.productId) || it.productId <= 0) {
      return { valid: false, error: `items[${i}].productId must be a positive integer` }
    }
    
    if (typeof it.qty !== 'number' || !Number.isInteger(it.qty) || it.qty < 0) {
      return { valid: false, error: `items[${i}].qty must be a non-negative integer` }
    }
  }
  
  return {
    valid: true,
    data: {
      items: b.items.map((it: Record<string, unknown>) => ({
        productId: it.productId as number,
        qty: it.qty as number
      }))
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
    
    // Validate
    const validation = validateRequest(body)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    // Convert to CartItemInput format
    const cartItems: CartItemInput[] = validation.data.items.map(item => ({
      productId: item.productId,
      qty: item.qty
    }))
    
    // Price the cart
    const service = getCartPricingService()
    const result = await service.priceCart(cartItems)
    return NextResponse.json(result)
    
  } catch (error) {
    const isInvalidCartProductsError =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error.name === 'InvalidCartProductsError' || error.name === 'MissingProductPriceError')

    if (isInvalidCartProductsError) {
      return NextResponse.json(
        { error: 'One or more products are invalid or unavailable' },
        { status: 400 }
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Error pricing cart:', error)
    } else {
      console.error('Error pricing cart')
    }
    
    // No exponer detalles de error en producción
    const message = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Internal server error'
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// Opcional: GET para health check o documentación
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cart/price',
    method: 'POST',
    description: 'Calculate cart pricing with automatic deal application',
    request: {
      items: [
        { productId: 'number (required)', qty: 'number (required, >= 0)' }
      ]
    },
    response: {
      items: '[ { productId, qty, baseUnitPrice, finalUnitPrice, lineBaseTotal, lineFinalTotal, appliedDeals } ]',
      dealsApplied: '[ { dealId, title, timesApplied, tierUsed?, discountTotal, affectedProducts } ]',
      totals: '{ baseTotal, discountTotal, finalTotal }'
    }
  })
}
