import { describe, expect, it } from "vitest"
import {
  CHECKOUT_PHONE_COOKIE_NAME,
  getStoredCheckoutPhoneFromValues,
  isPersistablePhone,
} from "@/lib/checkout-phone"

describe("isPersistablePhone", () => {
  it("accepts phone numbers between 8 and 15 digits", () => {
    expect(isPersistablePhone("095 555 555")).toBe(true)
    expect(isPersistablePhone("+598 95 555 555")).toBe(true)
  })

  it("rejects invalid digit lengths", () => {
    expect(isPersistablePhone("1234567")).toBe(false)
    expect(isPersistablePhone("1234567890123456")).toBe(false)
  })
})

describe("getStoredCheckoutPhoneFromValues", () => {
  it("prefers localStorage value when valid", () => {
    const cookie = `${CHECKOUT_PHONE_COOKIE_NAME}=098%20111%20222`
    expect(getStoredCheckoutPhoneFromValues("095 555 555", cookie)).toBe("095 555 555")
  })

  it("falls back to cookie value when localStorage is absent", () => {
    const cookie = `foo=bar; ${CHECKOUT_PHONE_COOKIE_NAME}=098%20111%20222; theme=light`
    expect(getStoredCheckoutPhoneFromValues(null, cookie)).toBe("098 111 222")
  })

  it("returns null when neither source has a valid phone", () => {
    const cookie = `${CHECKOUT_PHONE_COOKIE_NAME}=12345`
    expect(getStoredCheckoutPhoneFromValues("1234", cookie)).toBeNull()
  })
})
