"use client"

"use client"

import { Fragment } from "react"
import { Search, ShoppingCart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import Link from "next/link"
import { HelpGuide, homeHelpSections } from "@/components/help-guide"
import { CatalogExport } from "@/components/catalog-export"
import type { Category, Product } from "@/types/product"
import { formatCurrency } from "@/lib/currency"
import { getMobileHeaderRows, type MobileHeaderItem } from "@/lib/header-layout"

interface HeaderProps {
  onCartClick: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  products?: Product[]
  filteredProducts?: Product[]
  categories?: Category[]
  selectedCategory?: number | null
}

export function Header({ 
  onCartClick, 
  searchQuery, 
  onSearchChange,
  products = [],
  filteredProducts = [],
  categories = [],
  selectedCategory = null,
}: HeaderProps) {
  const { totalItems, finalTotal } = useCart()
  const hasExportAction = products.length > 0
  const mobileHeaderRows = getMobileHeaderRows(hasExportAction)

  const renderBrand = () => (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-2 text-base font-semibold tracking-tight text-foreground shadow-sm"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
      LácteosUruguay
    </Link>
  )

  const renderSearch = () => (
    <div className="relative min-w-0 flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar productos..."
        className="rounded-full border-border/70 bg-card/90 pl-10"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  )

  const renderExport = () => (
    <CatalogExport
      products={products}
      filteredProducts={filteredProducts}
      categories={categories}
      selectedCategory={selectedCategory}
      searchQuery={searchQuery}
    />
  )

  const renderHelp = () => (
    <HelpGuide
      title="¿Cómo usar la tienda?"
      description="Guía paso a paso para realizar tu compra"
      sections={homeHelpSections}
    />
  )

  const renderCart = () => (
    <Button variant="ghost" className="relative flex items-center gap-2" onClick={onCartClick}>
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && totalItems < 100 && (
        <>
          <span className="text-sm font-medium">{formatCurrency(finalTotal)}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {totalItems}
          </span>
        </>
      )}
      {totalItems >= 100 && (
        <>
          <span className="text-sm font-medium">{formatCurrency(finalTotal)}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {":)"}
          </span>
        </>
      )}
    </Button>
  )

  const renderMobileHeaderItem = (item: MobileHeaderItem) => {
    switch (item) {
      case "brand":
        return renderBrand()
      case "cart":
        return renderCart()
      case "search":
        return renderSearch()
      case "export":
        return hasExportAction ? renderExport() : null
      case "help":
        return renderHelp()
      default:
        return null
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="hidden items-center justify-between gap-4 md:flex">
          {renderBrand()}
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              className="pl-10 rounded-full border-border/70 bg-card/90"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {hasExportAction && renderExport()}
            {renderHelp()}
            {renderCart()}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:hidden">
          {mobileHeaderRows.map((row, rowIndex) => (
            <div
              key={`mobile-header-row-${rowIndex}`}
              className={rowIndex === 0 ? "flex items-center justify-between gap-3" : "flex items-center gap-2"}
            >
              {row.map((item) => (
                <Fragment key={item}>{renderMobileHeaderItem(item)}</Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
