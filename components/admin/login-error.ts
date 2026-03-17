export interface AuthActionState {
  error: string | null
}

export type AuthFormAction = (
  state: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>

export const AUTH_ACTION_INITIAL_STATE: AuthActionState = {
  error: null,
}

export function toAuthActionState(error: unknown, fallbackMessage: string): AuthActionState {
  if (error instanceof Error && error.message.trim().length > 0) {
    return { error: error.message }
  }

  return { error: fallbackMessage }
}
