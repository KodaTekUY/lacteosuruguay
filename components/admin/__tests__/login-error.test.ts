import { describe, expect, it } from "vitest"

import { getLoginErrorMessage } from "@/components/admin/login-error"

describe("getLoginErrorMessage", () => {
  it("returns undefined for NEXT_REDIRECT errors", () => {
    const redirectError = {
      digest: "NEXT_REDIRECT;replace;/admin;307;",
    }

    expect(getLoginErrorMessage(redirectError)).toBeUndefined()
  })

  it("returns undefined when the error message is NEXT_REDIRECT", () => {
    expect(getLoginErrorMessage(new Error("NEXT_REDIRECT"))).toBeUndefined()
  })

  it("returns the error message for regular errors", () => {
    expect(getLoginErrorMessage(new Error("Credenciales incorrectas"))).toBe(
      "Credenciales incorrectas",
    )
  })

  it("returns a generic message for unknown errors", () => {
    expect(getLoginErrorMessage("unexpected")).toBe("Error al iniciar sesión")
  })
})
