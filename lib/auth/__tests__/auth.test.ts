import { beforeEach, describe, expect, it, vi } from "vitest"

const getAdminUserByUsernameMock = vi.fn()
const hasAdminUsersMock = vi.fn()
const createAdminUserMock = vi.fn()
const updateAdminUserCredentialsMock = vi.fn()

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

vi.mock("@/lib/db", () => ({
  isDatabaseAvailable: true,
  getAdminUserByUsername: getAdminUserByUsernameMock,
  hasAdminUsers: hasAdminUsersMock,
  createAdminUser: createAdminUserMock,
  updateAdminUserCredentials: updateAdminUserCredentialsMock,
}))

async function loadAuthModule() {
  vi.resetModules()
  return import("@/lib/auth")
}

describe("auth token security", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_AUTH_SECRET = "test-secret-key-for-auth"
    process.env.ADMIN_USERNAME = "admin-user"
    process.env.ADMIN_PASSWORD = "admin-pass"
    getAdminUserByUsernameMock.mockResolvedValue(null)
    hasAdminUsersMock.mockResolvedValue(false)
  })

  it("creates a signed token and validates it before expiration", async () => {
    const { createAuthToken, verifyAuthToken } = await loadAuthModule()

    const nowMs = Date.UTC(2026, 0, 1, 0, 0, 0)
    const token = createAuthToken("admin-user", { nowMs, maxAgeSeconds: 60 })
    const payload = verifyAuthToken(token, { nowMs: nowMs + 30_000 })

    expect(payload?.username).toBe("admin-user")
    expect(payload?.exp).toBe(Math.floor(nowMs / 1000) + 60)
  })

  it("rejects tampered tokens", async () => {
    const { createAuthToken, verifyAuthToken } = await loadAuthModule()

    const token = createAuthToken("admin-user", { nowMs: Date.UTC(2026, 0, 1), maxAgeSeconds: 60 })
    const [payload, signature] = token.split(".")
    const tamperedPayload = Buffer.from(
      JSON.stringify({ username: "intruder", exp: 9999999999 }),
      "utf8",
    ).toString("base64url")
    const tamperedToken = `${tamperedPayload}.${signature}`

    expect(verifyAuthToken(tamperedToken)).toBeNull()
    expect(verifyAuthToken(`${payload}.invalid-signature`)).toBeNull()
  })

  it("rejects expired tokens", async () => {
    const { createAuthToken, verifyAuthToken } = await loadAuthModule()

    const nowMs = Date.UTC(2026, 0, 1, 0, 0, 0)
    const token = createAuthToken("admin-user", { nowMs, maxAgeSeconds: 1 })

    expect(verifyAuthToken(token, { nowMs: nowMs + 2_000 })).toBeNull()
  })
})

describe("credential validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADMIN_AUTH_SECRET = "test-secret-key-for-auth"
    process.env.ADMIN_USERNAME = "admin-user"
    process.env.ADMIN_PASSWORD = "admin-pass"
    getAdminUserByUsernameMock.mockResolvedValue(null)
    hasAdminUsersMock.mockResolvedValue(false)
  })

  it("does not accept insecure default credentials when env is missing", async () => {
    delete process.env.ADMIN_USERNAME
    delete process.env.ADMIN_PASSWORD
    process.env.ADMIN_AUTH_SECRET = "test-secret-key-for-auth"

    const { validateCredentials } = await loadAuthModule()
    const valid = await validateCredentials("admin", "admin123")

    expect(valid).toBe(false)
  })

  it("does not fall back to env credentials once DB admins exist", async () => {
    hasAdminUsersMock.mockResolvedValue(true)

    const { validateCredentials } = await loadAuthModule()

    await expect(validateCredentials("admin-user", "admin-pass")).resolves.toBe(false)
  })

  it("validates credentials against hash stored in DB", async () => {
    const { registerAdminCredentials, validateCredentials } = await loadAuthModule()

    createAdminUserMock.mockImplementation(async (_username: string, passwordHash: string) => {
      getAdminUserByUsernameMock.mockResolvedValue({
        id: 1,
        username: "db-admin",
        password_hash: passwordHash,
      })
      return { id: 1, username: "db-admin", password_hash: passwordHash }
    })

    await registerAdminCredentials("db-admin", "secreto123")

    await expect(validateCredentials("db-admin", "secreto123")).resolves.toBe(true)
    await expect(validateCredentials("db-admin", "secreto999")).resolves.toBe(false)
  })

  it("updates stored credentials using current password validation", async () => {
    const { registerAdminCredentials, updateCredentials, validateCredentials } = await loadAuthModule()

    let storedHash = ""
    createAdminUserMock.mockImplementation(async (_username: string, passwordHash: string) => {
      storedHash = passwordHash
      getAdminUserByUsernameMock.mockImplementation(async (username: string) => {
        if (username === "admin-old") {
          return { id: 1, username: "admin-old", password_hash: storedHash }
        }
        if (username === "admin-new") {
          return { id: 1, username: "admin-new", password_hash: storedHash }
        }
        return null
      })
      return { id: 1, username: "admin-old", password_hash: passwordHash }
    })

    updateAdminUserCredentialsMock.mockImplementation(async (_id: number, username: string, passwordHash: string) => {
      storedHash = passwordHash
      return { id: 1, username, password_hash: passwordHash }
    })

    await registerAdminCredentials("admin-old", "secreto123")
    await updateCredentials("admin-old", "secreto123", "admin-new", "nuevaClave123")

    await expect(validateCredentials("admin-new", "nuevaClave123")).resolves.toBe(true)
    await expect(validateCredentials("admin-old", "secreto123")).resolves.toBe(false)
  })
})
