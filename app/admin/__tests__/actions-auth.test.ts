import { beforeEach, describe, expect, it, vi } from "vitest"

const createCategoryMock = vi.fn()
const revalidatePathMock = vi.fn()
const requireAdminAuthMock = vi.fn()

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
  redirect: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  validateCredentials: vi.fn(),
  setAuthCookie: vi.fn(),
  clearAuthCookie: vi.fn(),
  requireAdminAuth: requireAdminAuthMock,
}))

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
})
