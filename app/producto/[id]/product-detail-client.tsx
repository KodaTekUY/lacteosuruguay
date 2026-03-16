"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Minus, Plus, ShoppingCart, Sparkles, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import type { Deal, Product } from "@/types/product"
import { useCart } from "@/context/cart-context"
import { CartDrawer } from "@/components/cart-drawer"
import { HelpGuide, productDetailHelpSections } from "@/components/help-guide"
import { formatCurrency } from "@/lib/currency"
import { getPromoDealVisual, type PromoBundleVisualItem } from "@/lib/deal-visual"
import {
  getProductGalleryControlClassName,
  getProductGalleryFrameClassName,
  getProductGalleryWrapperClassName,
} from "@/lib/product-gallery-layout"
import { getProductImages } from "@/lib/product-images"
import {
  getDealBannerPricing,
  getDealFirstTierDiscount,
  getDealSecondaryText,
  getDealTypeLabel,
  getSortedDealTiers,
  getTierDisplayText,
} from "@/lib/product-detail-view"

interface ProductDetailClientProps {
  product: Product
  deals: Deal[]
}

function renderBundleVisual(items: PromoBundleVisualItem[], dealTitle: string, priority: boolean) {
  const hasMoreProducts = items.length > 6
  const displayProducts = items.slice(0, hasMoreProducts ? 5 : 6)
  const remainingCount = Math.max(0, items.length - 5)

  if (displayProducts.length === 0) {
    return (
      <div className="relative mx-auto h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64">
        <Image
          src="/placeholder.svg?height=320&width=320"
          alt={dealTitle}
          fill
          sizes="(min-width: 1024px) 280px, (min-width: 768px) 240px, (min-width: 640px) 224px, 192px"
          className="object-contain"
          priority={priority}
        />
      </div>
    )
  }

  if (displayProducts.length === 1) {
    return (
      <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/70 p-2 shadow-sm sm:h-56 sm:w-56 md:h-64 md:w-64">
        <Image
          src={displayProducts[0].src}
          alt={displayProducts[0].alt}
          fill
          sizes="(min-width: 1024px) 280px, (min-width: 768px) 240px, (min-width: 640px) 224px, 192px"
          className="object-contain"
          priority={priority}
        />
      </div>
    )
  }

  return (
    <div className="aspect-square w-full max-w-[280px] grid-cols-3 grid-rows-3 gap-1.5 sm:max-w-[300px] md:max-w-[320px] grid">
      <div className="relative col-span-2 row-span-2 overflow-hidden rounded-xl border border-border/60 bg-background/70 p-2 shadow-sm">
        <Image
          src={displayProducts[0].src}
          alt={displayProducts[0].alt}
          fill
          sizes="(min-width: 1024px) 200px, 45vw"
          className="object-contain p-2"
          priority={priority}
        />
        {displayProducts[0].quantity > 1 && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
            x{displayProducts[0].quantity}
          </span>
        )}
      </div>

      {displayProducts.slice(1, 5).map((productItem) => (
        <div
          key={productItem.id}
          className="relative overflow-hidden rounded-xl border border-border/60 bg-background/70 p-2 shadow-sm"
        >
          <Image
            src={productItem.src}
            alt={productItem.alt}
            fill
            sizes="(min-width: 1024px) 100px, 22vw"
            className="object-contain p-1"
          />
          {productItem.quantity > 1 && (
            <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              x{productItem.quantity}
            </span>
          )}
        </div>
      ))}

      {hasMoreProducts ? (
        <div className="flex items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-background/70 p-2 shadow-sm">
          <span className="text-2xl font-bold text-muted-foreground">+{remainingCount}</span>
        </div>
      ) : displayProducts.length >= 6 ? (
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background/70 p-2 shadow-sm">
          <Image
            src={displayProducts[5].src}
            alt={displayProducts[5].alt}
            fill
            sizes="(min-width: 1024px) 100px, 22vw"
            className="object-contain p-1"
          />
          {displayProducts[5].quantity > 1 && (
            <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
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

export function ProductDetailClient({ product, deals }: ProductDetailClientProps) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const { addToCart, items, updateQuantity, isLoadingPricing, totalItems, finalTotal } = useCart()

  const cartItem = items.find((item) => item.id === product.id && !item.isDeal)
  const quantity = cartItem?.quantity ?? 0
  const lineFinalTotal = cartItem?.lineFinalTotal
  const appliedDeals = cartItem?.appliedDeals
  const unitPrice = Number(product.price)
  const baseTotal = quantity * unitPrice
  const finalLineTotal = lineFinalTotal ?? baseTotal
  const hasSavings = quantity > 0 && finalLineTotal < baseTotal
  const savingsAmount = hasSavings ? baseTotal - finalLineTotal : 0
  const productImages = useMemo(() => {
    const gallery = getProductImages(product)
    return gallery.length > 0 ? gallery : ["/placeholder.svg?height=640&width=640"]
  }, [product])

  const productDeals = useMemo(
    () => deals.filter((deal) => (deal.products ?? []).some((dealProduct) => dealProduct.product_id === product.id)),
    [deals, product.id],
  )

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    const updateSelectedIndex = () => {
      setSelectedImageIndex(carouselApi.selectedScrollSnap())
    }

    updateSelectedIndex()
    carouselApi.on("select", updateSelectedIndex)
    carouselApi.on("reInit", updateSelectedIndex)

    return () => {
      carouselApi.off("select", updateSelectedIndex)
      carouselApi.off("reInit", updateSelectedIndex)
    }
  }, [carouselApi])

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a la tienda
          </Link>

          <div className="flex items-center gap-2">
            <HelpGuide
              title="¿Cómo comprar este producto?"
              description="Guía para agregar productos y aprovechar ofertas"
              sections={productDetailHelpSections}
            />
            <Button
              variant="ghost"
              className="relative flex items-center gap-2"
              onClick={() => setIsCartOpen(true)}
            >
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

      <main className="container mx-auto space-y-10 px-4 py-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl p-4 sm:p-6 lg:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="flex items-center justify-center">
              <div className={getProductGalleryWrapperClassName()}>
                <Carousel
                  className="mx-auto w-full"
                  opts={{ loop: productImages.length > 1 }}
                  setApi={setCarouselApi}
                >
                  <CarouselContent className="ml-0">
                    {productImages.map((productImage, index) => (
                      <CarouselItem key={`${product.id}-${index}`} className="pl-0">
                        <div className={getProductGalleryFrameClassName()}>
                          <Image
                            src={productImage}
                            alt={`${product.name} - imagen ${index + 1}`}
                            fill
                            sizes="(min-width: 1280px) 448px, (min-width: 1024px) 400px, (min-width: 640px) 256px, 224px"
                            className="object-contain p-2"
                            priority={index === 0}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {productImages.length > 1 && (
                    <>
                      <CarouselPrevious className={getProductGalleryControlClassName("previous")} />
                      <CarouselNext className={getProductGalleryControlClassName("next")} />
                    </>
                  )}
                </Carousel>

                {productImages.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {productImages.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        type="button"
                        className={cn(
                          "h-2.5 w-2.5 rounded-full transition-all",
                          index === selectedImageIndex ? "w-6 bg-foreground" : "bg-muted-foreground/35",
                        )}
                        aria-label={`Ver imagen ${index + 1} de ${productImages.length}`}
                        aria-current={index === selectedImageIndex}
                        onClick={() => carouselApi?.scrollTo(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {product.category_name && (
                  <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                    {product.category_name}
                  </span>
                )}
                {product.is_popular && (
                  <span className="inline-flex rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                    Destacado
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{product.name}</h1>

              <div className="space-y-1">
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {quantity > 0
                    ? `Subtotal (${quantity} ${quantity === 1 ? "unidad" : "unidades"})`
                    : "Precio unitario"}
                </p>
                <div className="flex flex-wrap items-baseline gap-2">
                  {hasSavings && (
                    <span className="text-xl text-muted-foreground line-through">{formatCurrency(baseTotal)}</span>
                  )}
                  <span className={cn("font-bold leading-none", hasSavings ? "text-4xl text-primary" : "text-4xl")}>
                    {formatCurrency(Number(quantity > 0 ? finalLineTotal : unitPrice))}
                  </span>
                </div>
                {hasSavings && (
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Ahorrás {formatCurrency(savingsAmount)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  disabled={quantity <= 0}
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-8 text-center text-xl font-semibold">{quantity}</span>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-foreground hover:bg-foreground/90"
                  onClick={() => (quantity > 0 ? updateQuantity(product.id, quantity + 1) : addToCart(product))}
                >
                  <Plus className="h-4 w-4 text-background" />
                </Button>
                {quantity === 0 && <span className="text-sm text-muted-foreground">Agrega 1 unidad al carrito</span>}
              </div>

              {quantity > 0 && (
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  {isLoadingPricing ? (
                    <p className="text-sm text-muted-foreground">Calculando precio...</p>
                  ) : (
                    <div className="space-y-2">
                      {appliedDeals && appliedDeals.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            Ofertas aplicadas automáticamente
                          </p>
                          {appliedDeals.map((appliedDeal, index) => (
                            <p key={`${appliedDeal.dealId}-${index}`} className="text-xs text-muted-foreground">
                              • {appliedDeal.dealTitle}
                              {appliedDeal.tierUsed?.discountPct && ` (${appliedDeal.tierUsed.discountPct}% OFF)`}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Si hay una oferta compatible, se aplica automáticamente al subtotal.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {productDeals.length > 0 ? (
          <section className="space-y-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Ofertas para este producto
              </span>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Promociones con {product.name}</h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                Estas ofertas incluyen este producto y se aplican automáticamente al agregarlo al carrito. ¡Aprovechá los mejores precios!
              </p>
            </div>

            <div className="space-y-4">
              {productDeals.map((deal, index) => {
                const sortedTiers = getSortedDealTiers(deal)
                const primaryTier = sortedTiers[0] ?? null
                const secondaryText = getDealSecondaryText(deal)
                const visual = getPromoDealVisual(deal)
                const { primaryQty, dealPrice, originalTotal, showOriginalPrice, savingsAmount: dealSavings } =
                  getDealBannerPricing(deal)

                return (
                  <Link key={deal.id} href={`/oferta/${deal.id}`} className="group block">
                    <article className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-primary/15 via-card to-accent/15 p-4 shadow-sm transition-all hover:shadow-md sm:p-6">
                      <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
                      <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />

                      <div className="relative grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] md:gap-8">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-foreground/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-background">
                              {getDealTypeLabel(deal.deal_type)}
                            </span>
                            {primaryTier && primaryTier.min_qty > 1 && (
                              <span className="inline-flex rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                                Desde {primaryTier.min_qty} unidades
                              </span>
                            )}
                          </div>

                          <h3 className="text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">
                            {deal.title}
                          </h3>

                          {secondaryText && (
                            <p className="max-w-prose text-sm text-muted-foreground sm:text-base">{secondaryText}</p>
                          )}

                          {dealPrice !== null && (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-baseline gap-2">
                                {showOriginalPrice && originalTotal !== null && (
                                  <span className="text-base font-medium text-muted-foreground line-through">
                                    {primaryQty}x {formatCurrency(originalTotal)}
                                  </span>
                                )}
                                <span className="text-4xl font-black leading-none text-foreground">
                                  {formatCurrency(dealPrice)}
                                </span>
                              </div>

                              {dealSavings > 0 && (
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                  Ahorrás {formatCurrency(dealSavings)}
                                </p>
                              )}
                            </div>
                          )}

                          {sortedTiers.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              {sortedTiers.map((tier, tierIndex) => {
                                const tierText = getTierDisplayText(tier)
                                if (!tierText) return null

                                return (
                                  <span
                                    key={tier.id}
                                    className={cn(
                                      "inline-flex shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
                                      tierIndex === 0
                                        ? "border-primary/30 bg-primary text-primary-foreground"
                                        : "border-border/70 bg-card/90 text-foreground/80",
                                    )}
                                  >
                                    {tierText}
                                  </span>
                                )
                              })}
                            </div>
                          )}

                          <span className="inline-flex w-fit rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background transition-transform duration-200 group-hover:scale-[1.02]">
                            Ver oferta
                          </span>
                        </div>

                        {visual.mode === "bundle" ? (
                          <div className="mx-auto flex w-full items-center justify-center md:justify-self-end">
                            {renderBundleVisual(visual.items, deal.title, index === 0)}
                          </div>
                        ) : (
                          <div className="relative mx-auto flex h-48 w-48 items-center justify-center overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/70 p-2 shadow-sm sm:h-56 sm:w-56 sm:p-3 md:h-64 md:w-64 md:justify-self-end">
                            <Image
                              src={visual.src}
                              alt={deal.title}
                              fill
                              sizes="(min-width: 1024px) 280px, (min-width: 768px) 240px, (min-width: 640px) 224px, 192px"
                              className="object-contain p-2"
                              priority={index === 0}
                            />
                          </div>
                        )}
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
            <Tag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              No hay ofertas disponibles para este producto
            </h3>
          </div>
        )}
      </main>
    </div>
  )
}
