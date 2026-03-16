"use client"

import { ProductCard } from "./product-card"
import type { Product } from "@/types/product"

interface ProductGridProps {
  products: Product[]
  title?: string
}

export function ProductGrid({ products, title = "Productos" }: ProductGridProps) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">{title}</h2>
      {products.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-card/90 py-12 text-center text-muted-foreground">
          <p>No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
