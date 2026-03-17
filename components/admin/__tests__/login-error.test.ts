import { describe, expect, it } from "vitest"

import {
  AUTH_ACTION_INITIAL_STATE,
  toAuthActionState,
} from "@/components/admin/login-error"

describe("toAuthActionState", () => {
  it("exposes the original error message when available", () => {
    expect(toAuthActionState(new Error("Credenciales incorrectas"), "Error al iniciar sesión")).toEqual({
      error: "Credenciales incorrectas",
    })
  })

  it("falls back to the provided message for unknown errors", () => {
    expect(toAuthActionState("unexpected", "Error al iniciar sesión")).toEqual({
      error: "Error al iniciar sesión",
    })
  })

  it("starts with an empty error state", () => {
    expect(AUTH_ACTION_INITIAL_STATE).toEqual({ error: null })
  })
})
