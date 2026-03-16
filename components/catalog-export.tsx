"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { FileDown } from "lucide-react"
import type { Category, Product } from "@/types/product"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { formatCurrency } from "@/lib/currency"

interface CatalogExportProps {
  products: Product[]
  filteredProducts: Product[]
  categories: Category[]
  selectedCategory: number | null
  searchQuery?: string
}

type ExportScope = "all" | "filtered"

export function CatalogExport({
  products,
  filteredProducts,
  categories,
  selectedCategory,
  searchQuery = "",
}: CatalogExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [exportScope, setExportScope] = useState<ExportScope>("filtered")

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name
    : null

  const fetchProductsForExport = async (scope: ExportScope): Promise<Product[]> => {
    const pageSize = 60
    const exportProducts: Product[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))

      if (scope === "filtered") {
        const normalizedSearch = searchQuery.trim()
        if (normalizedSearch.length > 0) {
          params.set("query", normalizedSearch)
        }
        if (selectedCategory) {
          params.set("categoryId", String(selectedCategory))
        }
      }

      const response = await fetch(`/api/catalog/products?${params.toString()}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("No se pudo cargar el catalogo para exportar")
      }

      const data = (await response.json()) as { hasMore: boolean; items: Product[] }
      exportProducts.push(...data.items)
      hasMore = data.hasMore
      page += 1
    }

    return exportProducts
  }

  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  const generatePDF = async () => {
    setIsGenerating(true)

    try {
      const productsToExport = await fetchProductsForExport(exportScope)
      
      // Group products by category
      const productsByCategory = new Map<string, Product[]>()
      
      for (const product of productsToExport) {
        const categoryName = product.category_name || product.category || "Sin categoría"
        if (!productsByCategory.has(categoryName)) {
          productsByCategory.set(categoryName, [])
        }
        productsByCategory.get(categoryName)!.push(product)
      }

      // Create PDF
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      
      // Header
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text("Lacteos", pageWidth / 2, 20, { align: "center" })
      
      doc.setFontSize(14)
      doc.setFont("helvetica", "normal")
      doc.text("Catálogo de Productos", pageWidth / 2, 30, { align: "center" })
      
      // Date
      doc.setFontSize(10)
      doc.setTextColor(100)
      const date = new Date().toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      doc.text(`Generado el ${date}`, pageWidth / 2, 38, { align: "center" })
      
      // Scope indicator
      if (exportScope === "filtered" && selectedCategoryName) {
        doc.setFontSize(11)
        doc.setTextColor(60)
        doc.text(`Categoría: ${selectedCategoryName}`, pageWidth / 2, 46, { align: "center" })
      }
      
      doc.setTextColor(0)

      let yPosition = exportScope === "filtered" && selectedCategoryName ? 55 : 48

      // Pre-load all images
      const imageCache = new Map<string, string | null>()
      for (const product of productsToExport) {
        if (product.image && !imageCache.has(product.image)) {
          const base64 = await loadImageAsBase64(product.image)
          imageCache.set(product.image, base64)
        }
      }

      // Generate tables for each category
      for (const [categoryName, categoryProducts] of productsByCategory) {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        // Category header
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(80, 80, 80)
        doc.text(categoryName, 14, yPosition)
        doc.setTextColor(0)
        yPosition += 8

        // Prepare table data with images
        const tableData: (string | { content: string; styles?: object })[][] = []
        const rowImages: { row: number; base64: string }[] = []

        for (let i = 0; i < categoryProducts.length; i++) {
          const product = categoryProducts[i]
          const price = formatCurrency(Number(product.price)).replace(/\u00a0/g, " ")
          
          // Store image info for later
          if (product.image) {
            const base64 = imageCache.get(product.image)
            if (base64) {
              rowImages.push({ row: i, base64 })
            }
          }

          tableData.push([
            "", // Image placeholder
            product.name,
            price,
          ])
        }

        // Create table
        autoTable(doc, {
          startY: yPosition,
          head: [["Imagen", "Producto", "Precio"]],
          body: tableData,
          headStyles: {
            fillColor: [60, 60, 60],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            0: { cellWidth: 25, halign: "center", valign: "middle" },
            1: { cellWidth: "auto", valign: "middle" },
            2: { cellWidth: 30, halign: "right", valign: "middle" },
          },
          styles: {
            fontSize: 10,
            cellPadding: 4,
            minCellHeight: 20,
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
          didDrawCell: (data) => {
            // Add images to cells
            if (data.section === "body" && data.column.index === 0) {
              const rowImage = rowImages.find((img) => img.row === data.row.index)
              if (rowImage) {
                const dim = 16
                const x = data.cell.x + (data.cell.width - dim) / 2
                const y = data.cell.y + (data.cell.height - dim) / 2
                try {
                  doc.addImage(rowImage.base64, "JPEG", x, y, dim, dim)
                } catch {
                  // Image failed to load, skip it
                }
              }
            }
          },
        })

        // Get the final Y position after table
        yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
      }

      // Footer on each page
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        )
      }

      // Save the PDF
      const filename = selectedCategoryName
        ? `catalogo-${selectedCategoryName.toLowerCase().replace(/\s+/g, "-")}.pdf`
        : "catalogo-productos.pdf"
      doc.save(filename)

      setIsOpen(false)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Exportar Catálogo
          </DialogTitle>
          <DialogDescription>
            Genera un PDF con el catálogo de productos para descargar o imprimir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>¿Qué productos incluir?</Label>
            <RadioGroup
              value={exportScope}
              onValueChange={(value) => setExportScope(value as ExportScope)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="filtered" id="filtered" />
                <Label htmlFor="filtered" className="font-normal cursor-pointer">
                  {selectedCategoryName
                    ? `Solo "${selectedCategoryName}" (${filteredProducts.length} productos)`
                    : `Vista actual (${filteredProducts.length} productos)`}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer">
                  Todos los productos ({products.length} productos)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <p>El PDF incluirá:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Imagen del producto</li>
              <li>Nombre y precio</li>
              <li>Agrupado por categorías</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Spinner className="h-4 w-4" />
                Generando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Descargar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
