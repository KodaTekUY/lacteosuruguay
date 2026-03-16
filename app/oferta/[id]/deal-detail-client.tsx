"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Minus, Plus, ShoppingCart, Package, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Deal, DealTier } from "@/types/product"
import {
  getActiveDealTierId,
  getAccumulatedTieredTotalPricing,
  getDealControlCount,
  getDealControlStepQuantity,
  getDealOriginalTotalForDisplay,
  getDealPrice,
  getInitialDealCartQuantity,
  getNonBundleDealNextQuantity,
  getNonBundleDealPrevQuantity,
} from "@/types/product"
import { useCart } from "@/context/cart-context"
import { CartDrawer } from "@/components/cart-drawer"
import { HelpGuide, dealDetailHelpSections } from "@/components/help-guide"
import { getPromoDealVisual, type PromoBundleVisualItem } from "@/lib/deal-visual"
import { formatCurrency } from "@/lib/currency"

interface DealDetailClientProps {
  deal: Deal
}

export function DealDetailClient({ deal }: DealDetailClientProps) {
  const { addToCart, items, updateQuantity, totalItems, finalTotal } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const initialDealQuantity = getInitialDealCartQuantity(deal)

  // Get deal type label
  const getDealTypeLabel = (dealType: string): string => {
    switch (dealType) {
      case 'bundle': return 'Pack/Combo'
      case 'tiered_total': return 'Precio por cantidad'
      case 'threshold_unit': return 'Precio mayorista'
      case 'percent_off': return '% Descuento'
      default: return dealType
    }
  }

  // Helper to get tier display text
  const getTierDisplayText = (tier: DealTier): string => {
    if (tier.unit_price !== null) {
      return `${tier.min_qty}+ unidades → ${formatCurrency(Number(tier.unit_price))} c/u`
    } else if (tier.total_price !== null) {
      return `${tier.min_qty}+ unidades → ${formatCurrency(Number(tier.total_price))} total`
    } else if (tier.discount_pct !== null) {
      return `${tier.min_qty}+ unidades → ${Number(tier.discount_pct)}% de descuento`
    }
    return ''
  }

  // Calculate discount for first tier
  const getFirstTierDiscount = (): number | null => {
    if (!deal.original_price || !deal.tiers || deal.tiers.length === 0) return null
    const tier = deal.tiers[0]
    
    if (tier.discount_pct !== null) return Number(tier.discount_pct)
    
    let tierPrice: number | null = null
    if (tier.total_price !== null) {
      tierPrice = Number(tier.total_price)
    } else if (tier.unit_price !== null) {
      const totalQty = deal.products?.reduce((sum, dp) => sum + dp.quantity, 0) || 1
      tierPrice = Number(tier.unit_price) * totalQty * tier.min_qty
    }
    
    if (!tierPrice) return null
    const originalForTier = Number(deal.original_price) * tier.min_qty
    const discount = Math.round((1 - tierPrice / originalForTier) * 100)
    return discount > 0 ? discount : null
  }

  const renderBundleVisual = (items: PromoBundleVisualItem[]) => {
    const hasMoreProducts = items.length > 6
    const displayProducts = items.slice(0, hasMoreProducts ? 5 : 6)
    const remainingCount = Math.max(0, items.length - 5)

    if (displayProducts.length === 0) {
      return (
        <div className="relative mx-auto h-56 w-56 sm:h-64 sm:w-64 lg:h-[28rem] lg:w-[28rem]">
          <Image
            src="/placeholder.svg?height=320&width=320"
            alt={deal.title}
            fill
            sizes="(min-width: 1280px) 448px, (min-width: 1024px) 400px, (min-width: 640px) 256px, 224px"
            className="object-contain"
            priority
          />
        </div>
      )
    }

    if (displayProducts.length === 1) {
      return (
        <div className="relative mx-auto h-56 w-56 border border-border/60 bg-background/70 p-2 shadow-sm sm:h-64 sm:w-64 lg:h-[28rem] lg:w-[28rem]">
          <Image
            src={displayProducts[0].src}
            alt={displayProducts[0].alt}
            fill
            sizes="(min-width: 1280px) 448px, (min-width: 1024px) 400px, (min-width: 640px) 256px, 224px"
            className="object-contain"
            priority
          />
        </div>
      )
    }

    return (
      <div className="w-full max-w-[360px] aspect-square grid grid-cols-3 grid-rows-3 gap-2 sm:max-w-[420px] lg:max-w-[480px]">
        <div className="col-span-2 row-span-2 relative border border-border/60 bg-background/70 p-2 shadow-sm rounded-xl overflow-hidden">
          <Image
            src={displayProducts[0].src}
            alt={displayProducts[0].alt}
            fill
            className="object-contain p-2"
            sizes="(min-width: 1024px) 180px, 45vw"
            priority
          />
          {displayProducts[0].quantity > 1 && (
            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
              x{displayProducts[0].quantity}
            </span>
          )}
        </div>

        {displayProducts.length >= 2 && (
          <div className="relative border border-border/60 bg-background/70 p-2 shadow-sm rounded-xl overflow-hidden">
            <Image
              src={displayProducts[1].src}
              alt={displayProducts[1].alt}
              fill
              sizes="(min-width: 1024px) 90px, 22vw"
              className="object-contain p-1"
            />
            {displayProducts[1].quantity > 1 && (
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                x{displayProducts[1].quantity}
              </span>
            )}
          </div>
        )}

        {displayProducts.length >= 3 && (
          <div className="relative border border-border/60 bg-background/70 p-2 shadow-sm rounded-xl overflow-hidden">
            <Image
              src={displayProducts[2].src}
              alt={displayProducts[2].alt}
              fill
              sizes="(min-width: 1024px) 90px, 22vw"
              className="object-contain p-1"
            />
            {displayProducts[2].quantity > 1 && (
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                x{displayProducts[2].quantity}
              </span>
            )}
          </div>
        )}

        {displayProducts.length >= 4 && (
          <div className="relative border border-border/60 bg-background/70 p-2 shadow-sm rounded-xl overflow-hidden">
            <Image
              src={displayProducts[3].src}
              alt={displayProducts[3].alt}
              fill
              sizes="(min-width: 1024px) 90px, 22vw"
              className="object-contain p-1"
            />
            {displayProducts[3].quantity > 1 && (
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                x{displayProducts[3].quantity}
              </span>
            )}
          </div>
        )}

        {displayProducts.length >= 5 && (
          <div className="relative border border-border/60 bg-background/70 p-2 shadow-sm rounded-xl overflow-hidden">
            <Image
              src={displayProducts[4].src}
              alt={displayProducts[4].alt}
              fill
              sizes="(min-width: 1024px) 90px, 22vw"
              className="object-contain p-1"
            />
            {displayProducts[4].quantity > 1 && (
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                x{displayProducts[4].quantity}
              </span>
            )}
          </div>
        )}

        {hasMoreProducts ? (
          <div className="relative border border-border/60 bg-background/70 p-2 shadow-sm overflow-hidden flex items-center justify-center">
            <span className="text-2xl font-bold text-muted-foreground">+{remainingCount}</span>
          </div>
        ) : displayProducts.length >= 6 ? (
          <div className="relative border border-border/60 bg-background/70 p-2 shadow-sm overflow-hidden">
            <Image
              src={displayProducts[5].src}
              alt={displayProducts[5].alt}
              fill
              sizes="(min-width: 1024px) 90px, 22vw"
              className="object-contain p-1"
            />
            {displayProducts[5].quantity > 1 && (
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                x{displayProducts[5].quantity}
              </span>
            )}
          </div>
        ) : null}

        {!hasMoreProducts &&
          displayProducts.length < 6 &&
          displayProducts.length >= 2 &&
          Array.from({ length: 6 - displayProducts.length }).map((_, index) => (
            <div key={`empty-${index}`} className="rounded-xl border border-border/60 bg-background/70 p-2 shadow-sm" />
          ))}
      </div>
    )
  }

  // Get product quantity in cart
  const getProductCartQuantity = (productId: number) => {
    const item = items.find(item => item.id === productId && !item.isDeal)
    return item?.quantity ?? 0
  }

  const firstDealProduct = deal.products?.find((dealProduct) => dealProduct.product)
  const nonBundleProductQuantity = firstDealProduct?.product ? getProductCartQuantity(firstDealProduct.product.id) : 0
  const bundleControlCount = getDealControlCount(deal, items)
  const dealControlCount = deal.deal_type === "bundle" ? bundleControlCount : nonBundleProductQuantity
  const dealPriceQuantity = dealControlCount > 0 ? dealControlCount : initialDealQuantity
  const accumulatedTieredTotal = getAccumulatedTieredTotalPricing(deal, dealControlCount)
  const tierVisualQuantity = dealControlCount > 0 ? dealPriceQuantity : 0
  const calculatedDealPrice = getDealPrice(deal, dealPriceQuantity)
  const dealPrice =
    dealControlCount > 0 && accumulatedTieredTotal
      ? accumulatedTieredTotal.dealTotal
      : calculatedDealPrice
  const offerDisplayQuantity =
    dealControlCount > 0 && accumulatedTieredTotal
      ? accumulatedTieredTotal.appliedQuantity
      : dealPriceQuantity
  const originalDisplayTotal = getDealOriginalTotalForDisplay(deal, dealPriceQuantity)
  const activeDealTierId = getActiveDealTierId(deal, tierVisualQuantity)
  const discount = getFirstTierDiscount()
  const visual = getPromoDealVisual(deal)

  const addDealProducts = () => {
    if (deal.deal_type !== "bundle") {
      if (!firstDealProduct?.product) return
      const currentQuantity = getProductCartQuantity(firstDealProduct.product.id)
      const nextQuantity = getNonBundleDealNextQuantity(currentQuantity, initialDealQuantity)
      const quantityToAdd = nextQuantity - currentQuantity

      for (let i = 0; i < quantityToAdd; i++) {
        addToCart(firstDealProduct.product)
      }
      return
    }

    deal.products?.forEach((dealProduct) => {
      if (!dealProduct.product) return
      const stepQuantity = getDealControlStepQuantity(deal, dealProduct)
      for (let i = 0; i < stepQuantity; i++) {
        addToCart(dealProduct.product)
      }
    })
  }

  const removeDealProducts = () => {
    if (dealControlCount <= 0) return

    if (deal.deal_type !== "bundle") {
      if (!firstDealProduct?.product) return
      const currentQuantity = getProductCartQuantity(firstDealProduct.product.id)
      const nextQuantity = getNonBundleDealPrevQuantity(currentQuantity, initialDealQuantity)
      updateQuantity(firstDealProduct.product.id, nextQuantity)
      return
    }

    deal.products?.forEach((dealProduct) => {
      if (!dealProduct.product) return
      const stepQuantity = getDealControlStepQuantity(deal, dealProduct)
      const currentQuantity = getProductCartQuantity(dealProduct.product.id)
      updateQuantity(dealProduct.product.id, currentQuantity - stepQuantity)
    })
  }

  // Add all products from deal to cart
  const addAllProductsToCart = () => {
    deal.products?.forEach(dp => {
      if (dp.product) {
        for (let i = 0; i < dp.quantity; i++) {
          addToCart(dp.product)
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver a la tienda
          </Link>
          <div className="flex items-center gap-2">
            <HelpGuide
              title="¿Cómo funciona esta oferta?"
              description="Guía para entender y aprovechar las ofertas"
              sections={dealDetailHelpSections}
            />
            <Button variant="ghost" className="relative flex items-center gap-2" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && totalItems < 100 && (
                <>
                  <span className="text-sm font-medium">{formatCurrency(finalTotal)}</span>
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {totalItems}
                  </span>
                </>
              )}
              {totalItems >= 100 && (
                <>
                  <span className="text-sm font-medium">{formatCurrency(finalTotal)}</span>
                  <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {':)'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="container mx-auto px-4 py-8">
        {/* Deal Header */}
        <div className={`rounded-3xl p-8 mb-8`}>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Deal Image */}
            <div className="flex items-center justify-center">
              {visual.mode === "bundle" ? (
                renderBundleVisual(visual.items)
              ) : (
                <div className="relative mx-auto flex h-56 w-56 self-center items-center justify-center overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/70 p-2 shadow-sm sm:h-64 sm:w-64 sm:p-3 lg:h-[28rem] lg:w-[28rem] md:justify-self-end">
                  <Image
                    src={visual.src}
                    alt={deal.title}
                    fill
                    sizes="(min-width: 1280px) 448px, (min-width: 1024px) 400px, (min-width: 640px) 256px, 224px"
                    className="object-contain p-2"
                    priority
                  />
                </div>
              )}
            </div>

            {/* Deal Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium bg-secondary px-3 py-1 rounded-full text-secondary-foreground">
                  {getDealTypeLabel(deal.deal_type)}
                </span>
                {discount !== null && discount > 0 && (
                  <span className="text-sm font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-sm">
                    {discount}% OFF
                  </span>
                )}
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{deal.title}</h1>
              
              {deal.description && (
                <p className="text-muted-foreground mb-6">{deal.description}</p>
              )}

              {/* Price Section */}
              <div className="mb-6">
                {originalDisplayTotal !== null && dealPrice !== null && Number(dealPrice) < originalDisplayTotal && (
                  <div className="flex flex-wrap items-baseline gap-3 mb-2">
                    {dealControlCount > 0 && (
                      <span className="text-xl font-semibold text-muted-foreground">
                        {offerDisplayQuantity} x
                      </span>
                    )}
                    <span className="text-xl text-muted-foreground line-through">
                      {formatCurrency(originalDisplayTotal)}
                    </span>
                    <span className="text-4xl font-bold text-primary">
                      {formatCurrency(Number(dealPrice))}
                    </span>
                  </div>
                )}
                {(originalDisplayTotal === null || dealPrice === null || Number(dealPrice) >= originalDisplayTotal) && dealPrice !== null && (
                  <div className="flex items-baseline gap-3">
                    {dealControlCount > 0 && (
                      <span className="text-xl font-semibold text-muted-foreground">
                        {offerDisplayQuantity} x
                      </span>
                    )}
                    <span className="text-4xl font-bold text-primary">
                      {formatCurrency(Number(dealPrice))}
                    </span>
                  </div>
                )}

              </div>

              {/* Tiers */}
              {deal.deal_type !== 'bundle' && deal.tiers && deal.tiers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Niveles de precio:</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Show base price tier if no tier starts at 1 */}
                    {!deal.tiers.some(t => t.min_qty === 1) && deal.original_price && (
                      <span className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full font-medium">
                        1+ unidades → {formatCurrency(Number(deal.original_price))} c/u
                      </span>
                    )}
                    {deal.tiers.map((tier) => {
                      const tierText = getTierDisplayText(tier)
                      if (!tierText) return null
                      const isReached = tierVisualQuantity >= tier.min_qty
                      const isActive = activeDealTierId === tier.id

                      return (
                        <span
                          key={tier.id}
                          className={[
                            "text-sm px-3 py-1 rounded-full font-medium transition-all duration-300 bg-primary text-primary-foreground",
                            isReached ? "scale-105 shadow-md shadow-primary/40" : "",
                            isActive ? "scale-110 shadow-lg shadow-primary/60 ring-2 ring-primary/40" : "",
                          ].join(" ")}
                        >
                          {tierText}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  disabled={dealControlCount <= 0}
                  onClick={removeDealProducts}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-8 text-center font-semibold">{dealControlCount}</span>
                <Button
                  size="icon"
                  className="rounded-full bg-foreground hover:bg-foreground/90 h-9 w-9"
                  onClick={addDealProducts}
                >
                  <Plus className="h-4 w-4 text-background" />
                </Button>
                {dealControlCount === 0 && (
                  <span className="text-sm text-muted-foreground">
                    {deal.deal_type === "bundle"
                      ? "Agrega 1 pack al carrito"
                      : `Agrega ${initialDealQuantity} unidades al carrito`}
                  </span>
                )}
              </div>
{/*  */}            </div>
          </div>
        </div>

        {/* Products in Deal */}
        {deal.products && deal.products.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">
                  {deal.deal_type === 'bundle' ? 'Productos incluidos en esta oferta' : 'Producto de la oferta'}
                </h2>
              </div>
              {deal.products.length > 1 && (
                <Button
                  variant="outline"
                  onClick={addAllProductsToCart}
                  className="rounded-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Agregar todos por separado
                </Button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {deal.products.map((dp) => {
                if (!dp.product) return null
                const product = dp.product
                const cartQty = getProductCartQuantity(product.id)
                const isInCart = cartQty > 0

                return (
                  <Card key={dp.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <Link href={`/producto/${product.id}`} className="block">
                        <div className="aspect-square relative mb-3 bg-muted rounded-xl overflow-hidden">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-contain hover:scale-105 transition-transform"
                          />
                          {dp.quantity > 1 && (
                            <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                              x{dp.quantity}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium mb-1 hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold">{formatCurrency(Number(product.price))}</span>
                        
                        {isInCart ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(product.id, cartQty - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-6 text-center font-semibold">{cartQty}</span>
                            <Button
                              size="icon"
                              className="rounded-full bg-foreground hover:bg-foreground/90 h-8 w-8"
                              onClick={() => updateQuantity(product.id, cartQty + 1)}
                            >
                              <Plus className="h-4 w-4 text-background" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            className="rounded-full bg-foreground hover:bg-foreground/90 h-8 w-8"
                            onClick={() => addToCart(product)}
                          >
                            <Plus className="h-4 w-4 text-background" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Info Box for non-bundle deals */}
        {deal.deal_type !== 'bundle' && deal.products && deal.products.length > 0 && (
          <div className="mt-8 p-6 bg-card rounded-2xl border">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary rounded-full">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">¿Cómo funciona esta oferta?</h3>
                <p className="text-muted-foreground text-sm">
                  {deal.deal_type === 'tiered_total' && 
                    'Agrega el producto al carrito y el descuento se aplicará automáticamente según la cantidad que lleves.'
                  }
                  {deal.deal_type === 'threshold_unit' && 
                    'Agrega el producto al carrito. Cuando alcances la cantidad mínima, el precio especial se aplicará automáticamente.'
                  }
                  {deal.deal_type === 'percent_off' && 
                    'Agrega el producto al carrito y el porcentaje de descuento se aplicará automáticamente.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
