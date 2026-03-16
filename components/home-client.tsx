"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Header } from "@/components/header"
import { Categories } from "@/components/categories"
import { PromoBanners } from "@/components/promo-banners"
import { ProductGrid } from "@/components/product-grid"
import { CartDrawer } from "@/components/cart-drawer"
import type { Category, Deal, Product } from "@/types/product"
import { getHomeSectionsOrder, HOME_SECTION_IDS } from "@/lib/home-layout"

interface HomeClientProps {
  categories: Category[]
  deals: Deal[]
  initialHasMore: boolean
  initialProducts: Product[]
  initialTotalItems: number
  pageSize: number
}

interface CatalogProductsResponse {
  hasMore: boolean
  items: Product[]
  page: number
  totalItems: number
}

export function HomeClient({
  categories,
  deals,
  initialHasMore,
  initialProducts,
  initialTotalItems,
  pageSize,
}: HomeClientProps) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(initialTotalItems)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const isFirstFilterRender = useRef(true)
  const activeRequestId = useRef(0)

  const loadProductsPage = useCallback(
    async ({ append, page }: { append: boolean; page: number }) => {
      const requestId = ++activeRequestId.current

      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }
      setCatalogError(null)

      try {
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("pageSize", String(pageSize))

        const normalizedSearch = searchQuery.trim()
        if (normalizedSearch.length > 0) {
          params.set("query", normalizedSearch)
        }
        if (selectedCategory !== null) {
          params.set("categoryId", String(selectedCategory))
        }

        const response = await fetch(`/api/catalog/products?${params.toString()}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("No se pudo cargar el catálogo")
        }

        const data = (await response.json()) as CatalogProductsResponse

        if (requestId !== activeRequestId.current) {
          return
        }

        setProducts((prev) => {
          if (!append) return data.items

          const seen = new Set(prev.map((item) => item.id))
          const next = [...prev]
          for (const item of data.items) {
            if (!seen.has(item.id)) {
              seen.add(item.id)
              next.push(item)
            }
          }
          return next
        })
        setHasMore(data.hasMore)
        setCurrentPage(data.page)
        setTotalItems(data.totalItems)
      } catch (error) {
        if (requestId !== activeRequestId.current) {
          return
        }

        setCatalogError(error instanceof Error ? error.message : "No se pudo cargar el catálogo")

        if (!append) {
          setProducts([])
          setCurrentPage(1)
          setHasMore(false)
          setTotalItems(0)
        }
      } finally {
        if (requestId === activeRequestId.current) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    },
    [pageSize, searchQuery, selectedCategory],
  )

  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false
      return
    }

    const timeout = setTimeout(() => {
      void loadProductsPage({ append: false, page: 1 })
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [loadProductsPage])

  useEffect(() => {
    const trigger = loadMoreRef.current
    if (!trigger || !hasMore || isLoading || isLoadingMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        void loadProductsPage({ append: true, page: currentPage + 1 })
      },
      { rootMargin: "300px 0px" },
    )

    observer.observe(trigger)

    return () => {
      observer.disconnect()
    }
  }, [currentPage, hasMore, isLoading, isLoadingMore, loadProductsPage])

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory) return null
    return categories.find((category) => category.id === selectedCategory)?.name ?? null
  }, [categories, selectedCategory])

  const gridTitle = selectedCategoryName || (searchQuery ? `Resultados para "${searchQuery}"` : "Productos")
  const homeSectionOrder = useMemo(() => getHomeSectionsOrder(searchQuery), [searchQuery])

  return (
    <div className="min-h-screen">
      <Header
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={products}
        filteredProducts={products}
        categories={categories}
        selectedCategory={selectedCategory}
      />
      <main className="container mx-auto px-4 py-8">
        {homeSectionOrder.map((section) => {
          if (section === "deals") {
            return (
              <section key="home-section-deals" id={HOME_SECTION_IDS.deals} className="scroll-mt-28">
                <PromoBanners deals={deals} searchQuery={searchQuery} />
              </section>
            )
          }

          if (section === "categories") {
            return (
              <section key="home-section-categories" id={HOME_SECTION_IDS.categories} className="scroll-mt-28">
                <Categories
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </section>
            )
          }

          return (
            <section key="home-section-products" id={HOME_SECTION_IDS.products} className="scroll-mt-28">
              <ProductGrid products={products} title={gridTitle} />
            </section>
          )
        })}

        {catalogError && (
          <p className="mt-4 text-sm text-destructive">{catalogError}</p>
        )}

        {!catalogError && (
          <div className="mt-6 flex flex-col items-center gap-3">
            {isLoading && <p className="text-sm text-muted-foreground">Buscando productos...</p>}
            {isLoadingMore && <p className="text-sm text-muted-foreground">Cargando más productos...</p>}
            {!isLoading && !isLoadingMore && products.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Mostrando {products.length} de {totalItems} productos
              </p>
            )}
            {hasMore && <div ref={loadMoreRef} className="h-4 w-full" aria-hidden />}
          </div>
        )}
      </main>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
