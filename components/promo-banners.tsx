"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import type { Deal, DealTier } from "@/types/product"
import { getDealPrice } from "@/types/product"
import { getPromoDealVisual, type PromoBundleVisualItem } from "@/lib/deal-visual"
import { getMobilePromoControlsOrder, type PromoMobileControlItem } from "@/lib/promo-banners-layout"

interface PromoBannersProps {
  deals: Deal[]
  searchQuery?: string
}

function getSortedTiers(deal: Deal): DealTier[] {
  return [...(deal.tiers ?? [])].sort((a, b) => a.min_qty - b.min_qty)
}

function getDealTypeLabel(deal: Deal): string {
  if (deal.deal_type === "bundle") {
    return "Combo"
  }
  if (deal.deal_type === "tiered_total") {
    return "Precio por cantidad"
  }
  if (deal.deal_type === "threshold_unit") {
    return "Precio mayorista"
  }
  if (deal.deal_type === "percent_off") {
    return "% Descuento"
  }
  return "Oferta"
}

function getTierLabel(tier: DealTier): string {
  if (tier.total_price !== null) {
    return `${tier.min_qty}+ → ${formatCurrency(Number(tier.total_price))}`
  }
  if (tier.unit_price !== null) {
    return `${tier.min_qty}+ → ${formatCurrency(Number(tier.unit_price))} c/u`
  }
  if (tier.discount_pct !== null) {
    return `${tier.min_qty}+ → ${Number(tier.discount_pct)}% OFF`
  }
  return `${tier.min_qty}+`
}

function getSecondaryText(deal: Deal): string | null {
  const description = deal.description?.trim()
  if (description) {
    return description
  }

  const names = (deal.products ?? [])
    .map((dealProduct) => dealProduct.product?.name?.trim())
    .filter((name): name is string => Boolean(name))

  if (names.length === 0) {
    return null
  }

  return names.slice(0, 3).join(" • ")
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
      <div className="relative mx-auto h-48 w-48 border border-border/60 bg-background/70 p-2 shadow-sm sm:h-56 sm:w-56 md:h-64 md:w-64">
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
    <div className="w-full max-w-[280px] aspect-square grid grid-cols-3 grid-rows-3 gap-1.5 sm:max-w-[300px]">
      <div className="col-span-2 row-span-2 relative border border-border/60 bg-background/70 p-2 shadow-sm rounded-xl overflow-hidden">
        <Image
          src={displayProducts[0].src}
          alt={displayProducts[0].alt}
          fill
          className="object-contain p-2"
          sizes="(min-width: 1024px) 180px, 45vw"
          priority={priority}
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

export function PromoBanners({ deals, searchQuery }: PromoBannersProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const normalizedSearch = searchQuery?.trim() ?? ""

  const nextSlide = useCallback(() => {
    if (deals.length <= 1) {
      setCurrentIndex(0)
      return
    }
    setCurrentIndex((prev) => (prev + 1) % deals.length)
  }, [deals.length])

  const prevSlide = useCallback(() => {
    if (deals.length <= 1) {
      setCurrentIndex(0)
      return
    }
    setCurrentIndex((prev) => (prev - 1 + deals.length) % deals.length)
  }, [deals.length])

  useEffect(() => {
    if (!isAutoPlaying || deals.length <= 1) {
      return
    }

    const interval = window.setInterval(nextSlide, 6000)
    return () => window.clearInterval(interval)
  }, [deals.length, isAutoPlaying, nextSlide])

  const resolvedIndex = deals.length > 0 ? currentIndex % deals.length : 0
  const featuredDeal = deals[resolvedIndex] ?? null
  const sortedTiers = useMemo(() => {
    if (!featuredDeal) return []
    return getSortedTiers(featuredDeal)
  }, [featuredDeal])
  const primaryTier = sortedTiers[0] ?? null
  const primaryQty = primaryTier?.min_qty ?? 1
  const rawDealPrice = featuredDeal ? getDealPrice(featuredDeal, primaryQty) : null
  const dealPrice = rawDealPrice !== null ? Number(rawDealPrice) : null
  const originalTotal = featuredDeal?.original_price
    ? Number(featuredDeal.original_price) * primaryQty
    : null
  const showOriginalPrice =
    originalTotal !== null && dealPrice !== null && dealPrice < originalTotal
  const savingsAmount = showOriginalPrice && originalTotal !== null && dealPrice !== null
    ? originalTotal - dealPrice
    : 0
  const secondaryText = featuredDeal ? getSecondaryText(featuredDeal) : null
  const visual = featuredDeal
    ? getPromoDealVisual(featuredDeal)
    : { mode: "image" as const, src: "/placeholder.svg?height=320&width=320" }

  if (normalizedSearch.length > 0 || !featuredDeal) {
    return null
  }

  const renderMobileControl = (item: PromoMobileControlItem) => {
    switch (item) {
      case "prev":
        return (
          <button
            key="mobile-promo-prev"
            type="button"
            onClick={prevSlide}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card text-foreground sm:hidden"
            aria-label="Oferta anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )
      case "next":
        return (
          <button
            key="mobile-promo-next"
            type="button"
            onClick={nextSlide}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card text-foreground sm:hidden"
            aria-label="Oferta siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )
      case "dots":
        return (
          <div key="mobile-promo-dots" className="flex flex-wrap justify-center items-center gap-2">
            {deals.map((deal, index) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === resolvedIndex ? "w-7 bg-primary" : "w-2 bg-foreground/20 hover:bg-foreground/35",
                )}
                aria-label={`Ir a la oferta ${index + 1}`}
              />
            ))}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <section
      id="deals"
      className="mb-8"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Ofertas destacadas
          </span>
          <h2 className="text-2xl font-black leading-none tracking-tight sm:text-3xl">Primero lo más conveniente</h2>
          <p className="max-w-prose text-sm text-muted-foreground">Promociones activas para ahorrar desde el primer click.</p>
        </div>

        {deals.length > 1 && (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={prevSlide}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Oferta anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Oferta siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative mx-auto overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-primary/20 via-card to-accent/20 p-4 shadow-md sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />

        <Link
          href={`/oferta/${featuredDeal.id}`}
          className="relative grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] md:gap-8"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-foreground/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-background">
                {getDealTypeLabel(featuredDeal)}
              </span>
              {primaryTier && primaryTier.min_qty > 1 && (
                <span className="inline-flex rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                  Desde {primaryTier.min_qty} unidades
                </span>
              )}
            </div>

            <h3 className="text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              {featuredDeal.title}
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

                {savingsAmount > 0 && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Ahorrás {formatCurrency(savingsAmount)}
                  </p>
                )}
              </div>
            )}

            {sortedTiers.length > 0 && (
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {sortedTiers.map((tier, index) => (
                  <span
                    key={tier.id}
                    className={cn(
                      "inline-flex shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
                      index === 0
                        ? "border-primary/30 bg-primary text-primary-foreground"
                        : "border-border/70 bg-card/90 text-foreground/80",
                    )}
                  >
                    {getTierLabel(tier)}
                  </span>
                ))}
              </div>
            )}

            <span className="inline-flex w-fit rounded-full bg-foreground px-5 py-2 text-sm font-bold text-background transition-transform duration-200 md:hover:scale-[1.02]">
              Ver oferta
            </span>
          </div>

          {visual.mode === "bundle" ? (
            <div className="mx-auto flex w-full items-center justify-center md:justify-self-end">
              {renderBundleVisual(visual.items, featuredDeal.title, resolvedIndex === 0)}
            </div>
          ) : (
            <div className="relative mx-auto flex h-50 w-full self-center items-center justify-center overflow-hidden rounded-[1.75rem] border border-border/60 bg-background/70 p-2 shadow-sm sm:h-56 sm:w-56 sm:p-3 md:h-64 md:w-64 md:justify-self-end">
              <Image
                src={visual.src}
                alt={featuredDeal.title}
                fill
                sizes="(min-width: 1024px) 280px, (min-width: 768px) 240px, (min-width: 640px) 224px, 192px"
                className="object-contain p-2"
                priority={resolvedIndex === 0}
              />
            </div>
          )}
        </Link>
      </div>

      {deals.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          {getMobilePromoControlsOrder().map((item) => renderMobileControl(item))}
        </div>
      )}
    </section>
  )
}
