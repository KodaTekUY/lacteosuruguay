export const CHECKOUT_PHONE_STORAGE_KEY = "checkout-customer-phone"
export const CHECKOUT_PHONE_COOKIE_NAME = "checkout_customer_phone"
const CHECKOUT_PHONE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export function isPersistablePhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "")
  return digitsOnly.length >= 8 && digitsOnly.length <= 15
}

function sanitizePersistedPhone(phone: string | null): string | null {
  if (!phone) {
    return null
  }

  const normalizedPhone = phone.trim()
  if (!isPersistablePhone(normalizedPhone)) {
    return null
  }

  return normalizedPhone
}

function readPhoneFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null
  }

  const cookieEntry = cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .find((entry) => entry.startsWith(`${CHECKOUT_PHONE_COOKIE_NAME}=`))

  if (!cookieEntry) {
    return null
  }

  const [, rawValue = ""] = cookieEntry.split("=")
  const decodedValue = decodeURIComponent(rawValue)
  return sanitizePersistedPhone(decodedValue)
}

export function getStoredCheckoutPhoneFromValues(
  localStorageValue: string | null,
  cookieHeader: string | null,
): string | null {
  const fromLocalStorage = sanitizePersistedPhone(localStorageValue)
  if (fromLocalStorage) {
    return fromLocalStorage
  }

  return readPhoneFromCookie(cookieHeader)
}

export function getStoredCheckoutPhone(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  let localStorageValue: string | null = null
  try {
    localStorageValue = window.localStorage.getItem(CHECKOUT_PHONE_STORAGE_KEY)
  } catch {
    localStorageValue = null
  }

  const cookieHeader = typeof document === "undefined" ? null : document.cookie
  return getStoredCheckoutPhoneFromValues(localStorageValue, cookieHeader)
}

export function persistCheckoutPhone(phone: string): void {
  if (typeof window === "undefined") {
    return
  }

  const normalizedPhone = sanitizePersistedPhone(phone)
  if (!normalizedPhone) {
    return
  }

  try {
    window.localStorage.setItem(CHECKOUT_PHONE_STORAGE_KEY, normalizedPhone)
  } catch {
    // no-op: localStorage can fail in privacy mode or restricted contexts.
  }

  try {
    document.cookie = `${CHECKOUT_PHONE_COOKIE_NAME}=${encodeURIComponent(normalizedPhone)}; path=/; max-age=${CHECKOUT_PHONE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`
  } catch {
    // no-op: cookie write is best effort.
  }
}

export function clearStoredCheckoutPhone(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(CHECKOUT_PHONE_STORAGE_KEY)
  } catch {
    // no-op
  }

  try {
    document.cookie = `${CHECKOUT_PHONE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`
  } catch {
    // no-op
  }
}
