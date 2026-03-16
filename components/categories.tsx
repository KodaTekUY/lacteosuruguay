"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import type { Category } from "@/types/product"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react"
import { getHorizontalScrollControlState } from "@/lib/category-scroll"

interface CategoriesProps {
  categories: Category[]
  selectedCategory: number | null
  onSelectCategory: (categoryId: number | null) => void
}

export function Categories({ categories, selectedCategory, onSelectCategory }: CategoriesProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollControls = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const { canScrollLeft: nextCanScrollLeft, canScrollRight: nextCanScrollRight } =
      getHorizontalScrollControlState(container.scrollLeft, container.clientWidth, container.scrollWidth)

    setCanScrollLeft(nextCanScrollLeft)
    setCanScrollRight(nextCanScrollRight)
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const initialFrameId = window.requestAnimationFrame(() => updateScrollControls())

    const handleScroll = () => {
      updateScrollControls()
    }
    container.addEventListener("scroll", handleScroll, { passive: true })

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateScrollControls())
      resizeObserver.observe(container)
    } else {
      window.addEventListener("resize", updateScrollControls)
    }

    return () => {
      window.cancelAnimationFrame(initialFrameId)
      container.removeEventListener("scroll", handleScroll)
      resizeObserver?.disconnect()
      if (!resizeObserver) {
        window.removeEventListener("resize", updateScrollControls)
      }
    }
  }, [updateScrollControls])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => updateScrollControls())
    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [categories.length, updateScrollControls])

  const scrollCategories = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollDelta = 300
    const offset = direction === "left" ? -scrollDelta : scrollDelta

    container.scrollBy({
      left: offset,
      behavior: "smooth",
    })
  }

  return (
    <section id="categories" className="mb-8">
      <h2 className="mb-3 text-xl font-bold tracking-tight">Categorías</h2>
      <div className="relative">
        {canScrollLeft && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background via-background/90 to-transparent"
          />
        )}
        {canScrollRight && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background via-background/90 to-transparent"
          />
        )}

        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollCategories("left")}
            className={cn(
              "absolute left-1 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background text-foreground shadow-lg transition-colors hover:border-primary/40 hover:text-primary",
            )}
            aria-label="Desplazar categorías a la izquierda"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              "inline-flex h-14 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border pl-3 pr-4 text-sm font-semibold transition-all",
              selectedCategory === null
                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "border-border/70 bg-card/90 text-foreground/90 hover:border-primary/35",
            )}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-current/25">
              <LayoutGrid className="h-5 w-5" />
            </span>
            <span>Todos</span>
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "inline-flex h-14 shrink-0 items-center gap-3 whitespace-nowrap rounded-full border pl-2 pr-4 text-sm font-semibold transition-all",
                selectedCategory === category.id
                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "border-border/70 bg-card/90 text-foreground/90 hover:border-primary/35",
              )}
            >
              <Image
                src={category.image || "/placeholder.svg?height=96&width=96"}
                alt={category.name}
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-full border border-border/50 bg-muted/50 object-cover shadow-sm"
              />
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollCategories("right")}
            className={cn(
              "absolute right-1 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background text-foreground shadow-lg transition-colors hover:border-primary/40 hover:text-primary",
            )}
            aria-label="Desplazar categorías a la derecha"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  )
}
