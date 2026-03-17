import { beforeEach, describe, expect, it, vi } from "vitest"

const createCategoryMock = vi.fn()
const revalidatePathMock = vi.fn()
const requireAdminAuthMock = vi.fn()
const redirectMock = vi.fn()
const validateCredentialsMock = vi.fn()
const setAuthCookieMock = vi.fn()
const canRegisterAdminMock = vi.fn()
const registerAdminCredentialsMock = vi.fn()
const updateCredentialsMock = vi.fn()

vi.mock("@/lib/db", () => ({
  createCategory: createCategoryMock,
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  createDeal: vi.fn(),
  updateDeal: vi.fn(),
  deleteDeal: vi.fn(),
  getCategories: vi.fn(),
  getProducts: vi.fn(),
  getAllDeals: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}))

vi.mock("@/lib/auth", () => ({
  validateCredentials: validateCredentialsMock,
  setAuthCookie: setAuthCookieMock,
  clearAuthCookie: vi.fn(),
  requireAdminAuth: requireAdminAuthMock,
  canRegisterAdmin: canRegisterAdminMock,
  registerAdminCredentials: registerAdminCredentialsMock,
  updateCredentials: updateCredentialsMock,
}))

function createLoginFormData(
  username = "admin",
  password = "password123",
) {
  const formData = new FormData()
  formData.set("username", username)
  formData.set("password", password)
  return formData
}

function createCredentialsFormData(overrides?: {
  currentUsername?: string
  currentPassword?: string
  newUsername?: string
  newPassword?: string
}) {
  const formData = new FormData()
  formData.set("currentUsername", overrides?.currentUsername ?? "admin")
  formData.set("currentPassword", overrides?.currentPassword ?? "password123")
  formData.set("newUsername", overrides?.newUsername ?? "nuevo-admin")
  formData.set("newPassword", overrides?.newPassword ?? "newpassword123")
  return formData
}

describe("admin server actions auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("blocks category creation when user is not authenticated", async () => {
    requireAdminAuthMock.mockRejectedValueOnce(new Error("Unauthorized"))
    createCategoryMock.mockResolvedValueOnce({
      id: 1,
      name: "Lacteos",
      image: null,
    })

    const { createCategoryAction } = await import("@/app/admin/actions")

    await expect(
      createCategoryAction({
        name: "Lacteos",
        image: null,
      }),
    ).rejects.toThrow("Unauthorized")

    expect(createCategoryMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("allows category creation when user is authenticated", async () => {
    requireAdminAuthMock.mockResolvedValueOnce(true)
    createCategoryMock.mockResolvedValueOnce({
      id: 1,
      name: "Lacteos",
      image: null,
    })

    const { createCategoryAction } = await import("@/app/admin/actions")
    const result = await createCategoryAction({
      name: "Lacteos",
      image: null,
    })

    expect(result?.name).toBe("Lacteos")
    expect(createCategoryMock).toHaveBeenCalledTimes(1)
    expect(revalidatePathMock).toHaveBeenCalledWith("/")
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin")
  })

  it("returns a specific login error state for invalid credentials", async () => {
    validateCredentialsMock.mockResolvedValueOnce(false)

    const { loginAction } = await import("@/app/admin/actions")
    const result = await loginAction({ error: null }, createLoginFormData())

    expect(result).toEqual({ error: "Credenciales incorrectas" })
    expect(setAuthCookieMock).not.toHaveBeenCalled()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it("redirects after a successful login action", async () => {
    validateCredentialsMock.mockResolvedValueOnce(true)

    const { loginAction } = await import("@/app/admin/actions")
    await loginAction({ error: null }, createLoginFormData())

    expect(setAuthCookieMock).toHaveBeenCalledWith("admin")
    expect(redirectMock).toHaveBeenCalledWith("/admin")
  })

  it("returns registration errors as form state", async () => {
    canRegisterAdminMock.mockResolvedValueOnce(false)

    const { registerAction } = await import("@/app/admin/actions")
    const result = await registerAction({ error: null }, createLoginFormData())

    expect(result).toEqual({ error: "El registro inicial ya fue realizado" })
    expect(registerAdminCredentialsMock).not.toHaveBeenCalled()
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it("returns credential update errors as form state", async () => {
    requireAdminAuthMock.mockResolvedValueOnce(true)
    updateCredentialsMock.mockRejectedValueOnce(new Error("Credenciales actuales incorrectas"))

    const { updateCredentialsAction } = await import("@/app/admin/actions")
    const result = await updateCredentialsAction({ error: null }, createCredentialsFormData())

    expect(result).toEqual({ error: "Credenciales actuales incorrectas" })
    expect(setAuthCookieMock).not.toHaveBeenCalled()
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
