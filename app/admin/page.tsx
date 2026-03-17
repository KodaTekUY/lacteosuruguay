import { getCategories, getProducts, getAllDeals } from "@/lib/db"
import { AdminPanel } from "@/components/admin/admin-panel"
import { LoginForm } from "@/components/admin/login-form"
import { canRegisterAdmin, isAuthenticated } from "@/lib/auth"
import { loginAction, registerAction } from "./actions"

export const metadata = {
  title: "Admin - Gestión de Catálogo",
  description: "Panel de administración para gestionar categorías, productos y ofertas",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminPage() {
  const authenticated = await isAuthenticated()
  const allowRegister = await canRegisterAdmin()

  if (!authenticated) {
    return (
      <LoginForm
        loginAction={loginAction}
        registerAction={registerAction}
        canRegister={allowRegister}
      />
    )
  }

  const [categories, products, deals] = await Promise.all([getCategories(), getProducts(), getAllDeals()])

  return (
    <div className="bg-muted/30">
      <AdminPanel initialCategories={categories} initialProducts={products} initialDeals={deals} />
    </div>
  )
}
