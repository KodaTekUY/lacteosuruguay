import { getCategories, getProducts, getAllDeals } from "@/lib/db"
import { AdminPanel } from "@/components/admin/admin-panel"
import { LoginForm } from "@/components/admin/login-form"
import { isAuthenticated } from "@/lib/auth"
import { loginAction } from "./actions"

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

  if (!authenticated) {
    return <LoginForm onLogin={loginAction} />
  }

  const [categories, products, deals] = await Promise.all([getCategories(), getProducts(), getAllDeals()])

  return (
    <div className="bg-muted/30">
      <AdminPanel initialCategories={categories} initialProducts={products} initialDeals={deals} />
    </div>
  )
}
