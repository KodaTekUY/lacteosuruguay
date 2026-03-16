"use client"

import { useState } from "react"
import { Minus, Plus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Product } from "@/types/product"
import { useCart } from "@/context/cart-context"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/currency"
import { getImageLoadingClassNames } from "@/lib/image-loading"
import { getPrimaryProductImage } from "@/lib/product-images"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, items, updateQuantity } = useCart()
  const cartItem = items.find((item) => item.id === product.id && !item.isDeal)
  const quantity = cartItem?.quantity ?? 0
  const [isImageLoading, setIsImageLoading] = useState(true)
  const imageClasses = getImageLoadingClassNames(isImageLoading)
  const productImage = getPrimaryProductImage(product)

  return (
    <div className={cn(
      "relative flex flex-col justify-between rounded-3xl border border-border/70 bg-card/95 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg",
      product.is_popular && "ring-2 ring-accent ring-offset-2 ring-offset-background"
    )}>
      {product.is_popular && (
        <div className="absolute -right-2 -top-2 z-10 rounded-full bg-accent p-1.5 text-accent-foreground shadow-md">
          <Star className="h-3 w-3 fill-current" />
        </div>
      )}
      <Link href={`/producto/${product.id}`} className="block">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-muted/70">
          <div
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center bg-muted/80",
              imageClasses.overlay,
            )}
            aria-hidden={!isImageLoading}
          >
            <Spinner className="size-5 text-muted-foreground" />
          </div>
          <Image
            src={productImage}
            alt={product.name}
            fill
            className={cn("object-contain", imageClasses.image)}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setIsImageLoading(false)}
          />
        </div>
        <h3 className="mb-1 font-medium text-foreground transition-colors hover:text-primary">{product.name}</h3>
      </Link>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-foreground">{formatCurrency(Number(product.price))}</span>
        {quantity > 0 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-transparent"
              onClick={() => updateQuantity(product.id, quantity - 1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center font-semibold">{quantity}</span>
            <Button
              size="icon"
              className="rounded-full bg-foreground hover:bg-foreground/90 h-8 w-8"
              onClick={() => updateQuantity(product.id, quantity + 1)}
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
    </div>
  )
}
