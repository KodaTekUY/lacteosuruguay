"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ImageUpload } from "@/components/ui/image-upload"
import { HelpGuide, adminCategoriesHelpSections } from "@/components/help-guide"
import type { Category } from "@/types/product"
import { getAdminDialogContentClassName } from "@/lib/admin-dialog"
import { resolveImageForSubmit, uploadImageFile } from "@/lib/image-submit"
import {
  createCategoryAction,
  deleteCategoryAction,
  getCategoriesAction,
  updateCategoryAction,
} from "@/app/admin/actions"

interface CategoriesAdminProps {
  categories: Category[]
  setCategories: (categories: Category[]) => void
}

const ITEMS_PER_PAGE = 8

export function CategoriesAdmin({ categories, setCategories }: CategoriesAdminProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: "", image: "" })
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(categories.length / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedCategories = categories.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const refreshCategories = async () => {
    const latestCategories = await getCategoriesAction()
    setCategories(latestCategories)
  }

  const resetForm = () => {
    setFormData({ name: "", image: "" })
    setSelectedImageFile(null)
    setEditingCategory(null)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const image = await resolveImageForSubmit({
        existingImage: formData.image,
        selectedFile: selectedImageFile,
        uploadFile: uploadImageFile,
      })

      const categoryData = {
        ...formData,
        image: image ?? "",
      }

      const result = editingCategory
        ? await updateCategoryAction(editingCategory.id, categoryData)
        : await createCategoryAction(categoryData)

      if (!result) {
        throw new Error("No se pudo guardar la categoria")
      }

      await refreshCategories()
      setIsOpen(false)
      resetForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo guardar la categoria")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({ name: category.name, image: category.image || "" })
    setSelectedImageFile(null)
    setIsOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Estas seguro de eliminar esta categoria?")) return

    setErrorMessage(null)

    try {
      const result = await deleteCategoryAction(id)
      if (!result) {
        throw new Error("No se pudo eliminar la categoria")
      }
      await refreshCategories()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar la categoria")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categorias ({categories.length})</CardTitle>
        <div className="flex items-center gap-2">
          <HelpGuide
            title="Administrar Categorias"
            description="Guia completa para gestionar las categorias de productos"
            sections={adminCategoriesHelpSections}
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
                  Nueva Categoria
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className={getAdminDialogContentClassName()}>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Editar Categoria" : "Nueva Categoria"}</DialogTitle>
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
                  <Label>Imagen</Label>
                  <ImageUpload
                    value={formData.image}
                    file={selectedImageFile}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                    onFileChange={setSelectedImageFile}
                    placeholder="Selecciona una imagen para la categoria"
                  />
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
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Image
                    src={category.image || "/placeholder.svg?height=40&width=40"}
                    alt={category.name}
                    width={40}
                    height={40}
                    className="rounded-md"
                  />
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {categories.length > ITEMS_PER_PAGE && (
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
