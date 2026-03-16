"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageUpload } from "@/components/ui/image-upload"
import { HelpGuide, adminProductsHelpSections } from "@/components/help-guide"
import type { Category, Product } from "@/types/product"
import { getAdminDialogContentClassName } from "@/lib/admin-dialog"
import { resolveImagesForSubmit, uploadImageFile } from "@/lib/image-submit"
import { getProductImages } from "@/lib/product-images"
import {
  createProductAction,
  deleteProductAction,
  getProductsAction,
  updateProductAction,
} from "@/app/admin/actions"
import { formatCurrency } from "@/lib/currency"

interface ProductsAdminProps {
  products: Product[]
  setProducts: (products: Product[]) => void
  categories: Category[]
}

const ITEMS_PER_PAGE = 10

interface ProductImageField {
  id: string
  url: string
  file: File | null
}

export function ProductsAdmin({ products, setProducts, categories }: ProductsAdminProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const imageFieldCounterRef = useRef(0)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category_id: "",
    is_popular: true,
    is_active: true,
  })
  const createImageField = (url = "", file: File | null = null): ProductImageField => ({
    id: `product-image-${imageFieldCounterRef.current++}`,
    url,
    file,
  })
  const [imageFields, setImageFields] = useState<ProductImageField[]>(() => [createImageField()])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const refreshProducts = async () => {
    const latestProducts = await getProductsAction()
    setProducts(latestProducts)
  }

  const resetForm = () => {
    setFormData({ name: "", price: "", category_id: "", is_popular: true, is_active: true })
    setImageFields([createImageField()])
    setEditingProduct(null)
    setErrorMessage(null)
  }

  const updateImageField = (fieldId: string, patch: Partial<Omit<ProductImageField, "id">>) => {
    setImageFields((currentFields) =>
      currentFields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
    )
  }

  const addImageField = () => {
    setImageFields((currentFields) => [...currentFields, createImageField()])
  }

  const removeImageField = (fieldId: string) => {
    setImageFields((currentFields) => {
      const remainingFields = currentFields.filter((field) => field.id !== fieldId)
      return remainingFields.length > 0 ? remainingFields : [createImageField()]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const images = await resolveImagesForSubmit({
        existingImages: imageFields.map((field) => field.url),
        selectedFiles: imageFields.map((field) => field.file),
        uploadFile: uploadImageFile,
      })

      const productData = {
        name: formData.name,
        price: Number.parseFloat(formData.price),
        image: images[0] ?? null,
        images,
        category_id: formData.category_id ? Number.parseInt(formData.category_id, 10) : null,
        is_popular: formData.is_popular,
        is_active: formData.is_active,
      }

      const result = editingProduct
        ? await updateProductAction(editingProduct.id, productData)
        : await createProductAction(productData)

      if (!result) {
        throw new Error("No se pudo guardar el producto")
      }

      await refreshProducts()
      setIsOpen(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar el producto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    const productImages = getProductImages(product)
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category_id: product.category_id?.toString() || "",
      is_popular: product.is_popular ?? true,
      is_active: product.is_active ?? true,
    })
    setImageFields(
      (productImages.length > 0 ? productImages : [""]).map((imageUrl) => createImageField(imageUrl)),
    )
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Estas seguro de eliminar este producto?")) return

    setErrorMessage(null)

    try {
      const result = await deleteProductAction(id)
      if (!result) {
        throw new Error("No se pudo eliminar el producto")
      }
      await refreshProducts()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar el producto")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Productos ({products.length})</CardTitle>
        <div className="flex items-center gap-2">
          <HelpGuide
            title="Administrar Productos"
            description="Guia completa para gestionar los productos de la tienda"
            sections={adminProductsHelpSections}
          />
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">
                  Nuevo producto
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className={getAdminDialogContentClassName()}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">Sin categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <Label>Fotos del producto</Label>
                      <p className="text-xs text-muted-foreground">
                        La primera foto se usa como portada en la card y en el detalle.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addImageField}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar foto
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {imageFields.map((field, index) => (
                      <div key={field.id} className="rounded-xl border border-border/70 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">
                              {index === 0 ? "Foto 1 (principal)" : `Foto ${index + 1}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {index === 0 ? "Se muestra en la card del producto" : "Visible en la galería del detalle"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImageField(field.id)}
                            disabled={imageFields.length === 1 && !field.url && !field.file}
                          >
                            Quitar
                          </Button>
                        </div>

                        <ImageUpload
                          value={field.url}
                          file={field.file}
                          onChange={(url) => updateImageField(field.id, { url, file: null })}
                          onFileChange={(file) => updateImageField(field.id, { file })}
                          placeholder={
                            index === 0
                              ? "Selecciona la imagen principal del producto"
                              : "Selecciona una imagen adicional del producto"
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_popular"
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked as boolean })}
                  />
                  <Label htmlFor="is_popular">Producto destacado</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                  />
                  <Label htmlFor="is_active">Producto activo</Label>
                </div>
                {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {errorMessage && <p className="mb-3 text-sm text-destructive">{errorMessage}</p>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Destacado</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Image
                    src={product.image || "/placeholder.svg?height=40&width=40"}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded-md"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{formatCurrency(Number(product.price))}</TableCell>
                <TableCell>{product.category_name || "-"}</TableCell>
                <TableCell>{product.is_popular ? "Si" : "No"}</TableCell>
                <TableCell>{product.is_active === false ? "No" : "Si"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {products.length > ITEMS_PER_PAGE && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pagina {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
