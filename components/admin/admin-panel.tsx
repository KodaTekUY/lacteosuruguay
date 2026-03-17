"use client"

import { useActionState, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoriesAdmin } from "./categories-admin"
import { ProductsAdmin } from "./products-admin"
import { DealsAdmin } from "./deals-admin"
import type { Category, Product, Deal } from "@/types/product"
import { Package, Grid3X3, Megaphone, ArrowLeft, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { logoutAction, updateCredentialsAction } from "@/app/admin/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AUTH_ACTION_INITIAL_STATE } from "@/components/admin/login-error"

interface AdminPanelProps {
  initialCategories: Category[]
  initialProducts: Product[]
  initialDeals: Deal[]
}

export function AdminPanel({ initialCategories, initialProducts, initialDeals }: AdminPanelProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [products, setProducts] = useState(initialProducts)
  const [deals, setDeals] = useState(initialDeals)
  const [showCredentialsForm, setShowCredentialsForm] = useState(false)
  const [currentUsername, setCurrentUsername] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [credentialsState, submitCredentialsAction, credentialsPending] = useActionState(
    updateCredentialsAction,
    AUTH_ACTION_INITIAL_STATE,
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu catálogo de productos</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Button type="button" onClick={() => setShowCredentialsForm((prev) => !prev)}>
            Cambiar usuario/contraseña
          </Button>
        </div>
      </div>

      {showCredentialsForm && (
        <form
          action={submitCredentialsAction}
          className="mb-8 grid gap-3 rounded-lg border p-4 md:grid-cols-2"
        >
          <div className="space-y-1">
            <Label htmlFor="currentUsername">Usuario actual</Label>
            <Input
              id="currentUsername"
              name="currentUsername"
              value={currentUsername}
              onChange={(event) => setCurrentUsername(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="newUsername">Nuevo usuario</Label>
            <Input
              id="newUsername"
              name="newUsername"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </div>
          {credentialsState.error && (
            <p className="text-sm text-destructive md:col-span-2">{credentialsState.error}</p>
          )}
          <div className="md:col-span-2">
            <Button type="submit" disabled={credentialsPending}>
              {credentialsPending ? "Actualizando..." : "Actualizar credenciales"}
            </Button>
          </div>
        </form>
      )}

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
