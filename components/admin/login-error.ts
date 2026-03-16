const NEXT_REDIRECT_DIGEST_PREFIX = "NEXT_REDIRECT;"

function isNextRedirectError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false
  }

  const maybeRedirectError = error as { digest?: unknown; message?: unknown }
  const digest = maybeRedirectError.digest
  if (typeof digest === "string" && digest.startsWith(NEXT_REDIRECT_DIGEST_PREFIX)) {
    return true
  }

  return maybeRedirectError.message === "NEXT_REDIRECT"
}

export function getLoginErrorMessage(error: unknown): string | undefined {
  if (isNextRedirectError(error)) {
    return undefined
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Error al iniciar sesión"
}
