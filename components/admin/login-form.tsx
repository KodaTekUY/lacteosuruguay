"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, LogIn } from "lucide-react"
import {
  AUTH_ACTION_INITIAL_STATE,
  type AuthFormAction,
} from "@/components/admin/login-error"

interface LoginFormProps {
  loginAction: AuthFormAction
  registerAction?: AuthFormAction
  canRegister?: boolean
}

async function noopRegisterAction(): Promise<typeof AUTH_ACTION_INITIAL_STATE> {
  return AUTH_ACTION_INITIAL_STATE
}

export function LoginForm({ loginAction, registerAction, canRegister = false }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submittedAction, setSubmittedAction] = useState<"login" | "register">("login")
  const [loginState, submitLoginAction, loginPending] = useActionState(
    loginAction,
    AUTH_ACTION_INITIAL_STATE,
  )
  const [registerState, submitRegisterAction, registerPending] = useActionState(
    registerAction ?? noopRegisterAction,
    AUTH_ACTION_INITIAL_STATE,
  )
  const isLoading = loginPending || registerPending
  const currentError = submittedAction === "register" ? registerState.error : loginState.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted/50 via-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Panel de Administración</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          {canRegister && (
            <CardDescription className="text-amber-700">
              No hay usuario administrador aún. Registrá el primero.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form
            action={submitLoginAction}
            className="space-y-4"
            onSubmitCapture={(event) => {
              const nativeEvent = event.nativeEvent as SubmitEvent
              const submitter = nativeEvent.submitter as HTMLElement | null
              setSubmittedAction(
                submitter?.getAttribute("data-auth-action") === "register" ? "register" : "login",
              )
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            {currentError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {currentError}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-auth-action="login"
            >
              {loginPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar sesión
                </>
              )}
            </Button>
            {canRegister && (
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                formAction={submitRegisterAction}
                data-auth-action="register"
              >
                {registerPending ? "Creando usuario..." : "Crear usuario"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
