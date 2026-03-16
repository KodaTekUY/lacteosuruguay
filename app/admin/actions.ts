"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createDeal,
  updateDeal,
  deleteDeal,
  getCategories,
  getProducts,
  getAllDeals,
  type Category as DbCategory,
  type CreateDealInput,
  type Product as DbProduct,
  type UpdateDealInput,
} from "@/lib/db"
import { clearAuthCookie, requireAdminAuth, setAuthCookie, validateCredentials } from "@/lib/auth"
import {
  createCategorySchema,
  createDealSchema,
  createProductSchema,
  parseWithSchema,
  positiveIdSchema,
  updateCategorySchema,
  updateDealSchema,
  updateProductSchema,
} from "@/lib/validation/admin"

// Auth actions
export async function loginAction(username: string, password: string) {
  const isValid = await validateCredentials(username, password)

  if (!isValid) {
    throw new Error("Credenciales incorrectas")
  }

  await setAuthCookie(username)
  redirect("/admin")
}

export async function logoutAction() {
  await clearAuthCookie()
  redirect("/admin")
}

const revalidatePaths = () => {
  revalidatePath("/")
  revalidatePath("/admin")
}

// Admin data actions
export async function getCategoriesAction() {
  await requireAdminAuth()
  return getCategories()
}

export async function getProductsAction() {
  await requireAdminAuth()
  return getProducts()
}

export async function getDealsAction() {
  await requireAdminAuth()
  return getAllDeals()
}

// Category actions
export async function createCategoryAction(data: Omit<DbCategory, "id">) {
  await requireAdminAuth()
  const validatedData = parseWithSchema(createCategorySchema, data)
  const result = await createCategory(validatedData)
  if (result) {
    revalidatePaths()
  }
  return result
}

export async function updateCategoryAction(id: number, data: Partial<DbCategory>) {
  await requireAdminAuth()
  const validatedId = parseWithSchema(positiveIdSchema, id)
  const validatedData = parseWithSchema(updateCategorySchema, data)
  const result = await updateCategory(validatedId, validatedData)
  if (result) {
    revalidatePaths()
  }
  return result
}

export async function deleteCategoryAction(id: number) {
  await requireAdminAuth()
  const validatedId = parseWithSchema(positiveIdSchema, id)
  const result = await deleteCategory(validatedId)
  if (result) {
    revalidatePaths()
  }
  return result
}

// Product actions
export async function createProductAction(data: Omit<DbProduct, "id" | "category_name">) {
  await requireAdminAuth()
  const validatedData = parseWithSchema(createProductSchema, data)
  const result = await createProduct(validatedData)
  if (result) {
    revalidatePaths()
  }
  return result
}

export async function updateProductAction(id: number, data: Partial<DbProduct>) {
  await requireAdminAuth()
  const validatedId = parseWithSchema(positiveIdSchema, id)
  const validatedData = parseWithSchema(updateProductSchema, data)
  const result = await updateProduct(validatedId, validatedData)
  if (result) {
    revalidatePaths()
  }
  return result
}

export async function deleteProductAction(id: number) {
  await requireAdminAuth()
  const validatedId = parseWithSchema(positiveIdSchema, id)
  const result = await deleteProduct(validatedId)
  if (result) {
    revalidatePaths()
  }
  return result
}

// Deal actions
export async function createDealAction(data: CreateDealInput) {
  await requireAdminAuth()
  const validatedData = parseWithSchema(createDealSchema, data)
  const result = await createDeal(validatedData)
  if (result) {
    revalidatePaths()
  }
  return result
}

export async function updateDealAction(id: number, data: UpdateDealInput) {
  try {
    await requireAdminAuth()
    const validatedId = parseWithSchema(positiveIdSchema, id)
    const validatedData = parseWithSchema(updateDealSchema, data)
    const result = await updateDeal(validatedId, validatedData)
    if (result) {
      revalidatePaths()
    }
    return result
  } catch (error) {
    console.error("Error validating deal update data:", error)
    throw error
  }
}

export async function deleteDealAction(id: number) {
  await requireAdminAuth()
  const validatedId = parseWithSchema(positiveIdSchema, id)
  const result = await deleteDeal(validatedId)
  if (result) {
    revalidatePaths()
  }
  return result
}
