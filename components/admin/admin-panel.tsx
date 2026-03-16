"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoriesAdmin } from "./categories-admin"
import { ProductsAdmin } from "./products-admin"
import { DealsAdmin } from "./deals-admin"
import type { Category, Product, Deal } from "@/types/product"
import { Package, Grid3X3, Megaphone, ArrowLeft, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { logoutAction } from "@/app/admin/actions"

interface AdminPanelProps {
  initialCategories: Category[]
  initialProducts: Product[]
  initialDeals: Deal[]
}

export function AdminPanel({ initialCategories, initialProducts, initialDeals }: AdminPanelProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [products, setProducts] = useState(initialProducts)
  const [deals, setDeals] = useState(initialDeals)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu catálogo de productos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la tienda
            </Link>
          </Button>
          <form action={logoutAction}>
            <Button variant="ghost" type="submit">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="categories" className="gap-2">
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Categorías</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="deals" className="gap-2">
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Ofertas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoriesAdmin categories={categories} setCategories={setCategories} />
        </TabsContent>

        <TabsContent value="products">
          <ProductsAdmin products={products} setProducts={setProducts} categories={categories} />
        </TabsContent>

        <TabsContent value="deals">
          <DealsAdmin deals={deals} setDeals={setDeals} products={products} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
