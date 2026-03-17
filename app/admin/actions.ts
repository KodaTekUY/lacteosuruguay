"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { toAuthActionState, type AuthActionState } from "@/components/admin/login-error"
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
import {
  canRegisterAdmin,
  clearAuthCookie,
  registerAdminCredentials,
  requireAdminAuth,
  setAuthCookie,
  updateCredentials,
  validateCredentials,
} from "@/lib/auth"
import {
  authCredentialsSchema,
  authCredentialsUpdateSchema,
  createCategorySchema,
  createDealSchema,
  createProductSchema,
  parseWithSchema,
  positiveIdSchema,
  updateCategorySchema,
  updateDealSchema,
  updateProductSchema,
} from "@/lib/validation/admin"

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

// Auth actions
export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  let data
  try {
    data = parseWithSchema(authCredentialsSchema, {
      username: getFormValue(formData, "username"),
      password: getFormValue(formData, "password"),
    })
  } catch (error) {
    return toAuthActionState(error, "Error al iniciar sesión")
  }

  const isValid = await validateCredentials(data.username, data.password)

  if (!isValid) {
    return { error: "Credenciales incorrectas" }
  }

  await setAuthCookie(data.username)
  redirect("/admin")
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  let data
  try {
    data = parseWithSchema(authCredentialsSchema, {
      username: getFormValue(formData, "username"),
      password: getFormValue(formData, "password"),
    })
  } catch (error) {
    return toAuthActionState(error, "No se pudo crear el usuario administrador")
  }

  const registrationAllowed = await canRegisterAdmin()

  if (!registrationAllowed) {
    return { error: "El registro inicial ya fue realizado" }
  }

  try {
    await registerAdminCredentials(data.username, data.password)
  } catch (error) {
    return toAuthActionState(error, "No se pudo crear el usuario administrador")
  }

  await setAuthCookie(data.username)
  redirect("/admin")
}

export async function updateCredentialsAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await requireAdminAuth()
  } catch {
    redirect("/admin")
  }

  let data
  try {
    data = parseWithSchema(authCredentialsUpdateSchema, {
      currentUsername: getFormValue(formData, "currentUsername"),
      currentPassword: getFormValue(formData, "currentPassword"),
      newUsername: getFormValue(formData, "newUsername"),
      newPassword: getFormValue(formData, "newPassword"),
    })
  } catch (error) {
    return toAuthActionState(error, "No se pudieron actualizar las credenciales")
  }

  try {
    await updateCredentials(data.currentUsername, data.currentPassword, data.newUsername, data.newPassword)
  } catch (error) {
    return toAuthActionState(error, "No se pudieron actualizar las credenciales")
  }

  await setAuthCookie(data.newUsername)
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
