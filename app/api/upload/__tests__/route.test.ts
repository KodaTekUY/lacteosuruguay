import { beforeEach, describe, expect, it, vi } from "vitest"

const requireAdminAuthMock = vi.fn()

vi.mock("@/lib/auth", () => ({
  requireAdminAuth: requireAdminAuthMock,
}))

function makeRequest(formData?: FormData): Request {
  return new Request("http://localhost/api/upload", {
    method: "POST",
    body: formData,
  })
}

describe("POST /api/upload security", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.SIRV_CLIENT_ID
    delete process.env.SIRV_CLIENT_SECRET
    delete process.env.SIRV_ACCOUNT
  })

  it("returns 401 when admin is not authenticated", async () => {
    requireAdminAuthMock.mockRejectedValueOnce(new Error("Unauthorized"))
    const { POST } = await import("@/app/api/upload/route")

    const response = await POST(makeRequest(new FormData()) as never)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe("Unauthorized")
  })

  it("rejects SVG uploads", async () => {
    requireAdminAuthMock.mockResolvedValueOnce(undefined)
    const { POST } = await import("@/app/api/upload/route")
    const formData = new FormData()
    formData.append("file", new File(["<svg></svg>"], "payload.svg", { type: "image/svg+xml" }))

    const response = await POST(makeRequest(formData) as never)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(String(body.error)).toContain("Invalid file type")
  })

  it("does not expose raw upstream errors in the response body", async () => {
    requireAdminAuthMock.mockResolvedValueOnce(undefined)
    const { POST } = await import("@/app/api/upload/route")
    const formData = new FormData()
    formData.append("file", new File(["binary"], "photo.png", { type: "image/png" }))

    const response = await POST(makeRequest(formData) as never)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe("Upload failed")
    expect(String(body.error)).not.toContain("Sirv credentials not configured")
  })
})
