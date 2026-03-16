import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

async function loadAuthModule() {
  vi.resetModules()
  return import("@/lib/auth")
}

describe("auth token security", () => {
  beforeEach(() => {
    process.env.ADMIN_AUTH_SECRET = "test-secret-key-for-auth"
    process.env.ADMIN_USERNAME = "admin-user"
    process.env.ADMIN_PASSWORD = "admin-pass"
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
  it("does not accept insecure default credentials when env is missing", async () => {
    delete process.env.ADMIN_USERNAME
    delete process.env.ADMIN_PASSWORD
    process.env.ADMIN_AUTH_SECRET = "test-secret-key-for-auth"

    const { validateCredentials } = await loadAuthModule()
    const valid = await validateCredentials("admin", "admin123")

    expect(valid).toBe(false)
  })
})
