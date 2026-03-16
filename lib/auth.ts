import crypto from "node:crypto"
import { cookies } from "next/headers"

const AUTH_COOKIE_NAME = "admin-auth"
const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const TOKEN_SEPARATOR = "."

interface AuthTokenPayload {
  username: string
  exp: number
}

interface TokenOptions {
  nowMs?: number
  maxAgeSeconds?: number
}

function getEnv(name: string): string | null {
  const value = process.env[name]
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getAdminCredentials(): { username: string; password: string } | null {
  const username = getEnv("ADMIN_USERNAME")
  const password = getEnv("ADMIN_PASSWORD")
  if (!username || !password) return null
  return { username, password }
}

function getAuthSecret(): string | null {
  return getEnv("ADMIN_AUTH_SECRET")
}

function signTokenPayload(payloadBase64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url")
}

function safeEqualString(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest()
  const hashB = crypto.createHash("sha256").update(b).digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

export function createAuthToken(username: string, options?: TokenOptions): string {
  const secret = getAuthSecret()
  if (!secret) {
    throw new Error("ADMIN_AUTH_SECRET is not configured")
  }

  const nowMs = options?.nowMs ?? Date.now()
  const maxAgeSeconds = options?.maxAgeSeconds ?? AUTH_MAX_AGE_SECONDS
  const exp = Math.floor(nowMs / 1000) + maxAgeSeconds
  const payload: AuthTokenPayload = { username, exp }
  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
  const signature = signTokenPayload(payloadBase64, secret)
  return `${payloadBase64}${TOKEN_SEPARATOR}${signature}`
}

export function verifyAuthToken(token: string, options?: Pick<TokenOptions, "nowMs">): AuthTokenPayload | null {
  const secret = getAuthSecret()
  if (!secret) return null
  if (!token || !token.includes(TOKEN_SEPARATOR)) return null

  const [payloadBase64, providedSignature] = token.split(TOKEN_SEPARATOR)
  if (!payloadBase64 || !providedSignature) return null

  const expectedSignature = signTokenPayload(payloadBase64, secret)
  if (!safeEqualString(providedSignature, expectedSignature)) return null

  try {
    const decoded = Buffer.from(payloadBase64, "base64url").toString("utf8")
    const payload = JSON.parse(decoded) as Partial<AuthTokenPayload>

    if (!payload || typeof payload.username !== "string" || typeof payload.exp !== "number") {
      return null
    }

    const nowMs = options?.nowMs ?? Date.now()
    const nowSeconds = Math.floor(nowMs / 1000)
    if (payload.exp <= nowSeconds) return null

    return { username: payload.username, exp: payload.exp }
  } catch {
    return null
  }
}

export async function validateCredentials(username: string, password: string): Promise<boolean> {
  const credentials = getAdminCredentials()
  if (!credentials) return false
  return safeEqualString(username, credentials.username) && safeEqualString(password, credentials.password)
}

export async function setAuthCookie(username: string): Promise<void> {
  const cookieStore = await cookies()
  const token = createAuthToken(username)

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: AUTH_MAX_AGE_SECONDS,
    path: "/",
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)
  if (!authCookie?.value) return false
  return verifyAuthToken(authCookie.value) !== null
}

export async function requireAdminAuth(): Promise<void> {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    throw new Error("Unauthorized")
  }
}

