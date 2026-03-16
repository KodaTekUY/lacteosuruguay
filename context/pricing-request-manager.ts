import type { PricedCartResult } from "@/types/product"

export interface PricingPayloadItem {
  productId: number
  qty: number
}

type PricingResponse = Pick<Response, "ok" | "json">

type PricingFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<PricingResponse>

interface PricingRequestBaseResult {
  isLatest: boolean
  requestId: number
}

export type PricingRequestResult =
  | (PricingRequestBaseResult & {
      data: PricedCartResult
      status: "success"
    })
  | (PricingRequestBaseResult & {
      status: "aborted"
    })
  | (PricingRequestBaseResult & {
      error: Error
      status: "error"
    })

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === "AbortError"
  }
  return error instanceof Error && error.name === "AbortError"
}

export function createPricingRequestManager(fetchImpl: PricingFetch = fetch): {
  cancel: () => void
  run: (items: PricingPayloadItem[]) => Promise<PricingRequestResult>
} {
  let activeController: AbortController | null = null
  let latestRequestId = 0

  const run = async (items: PricingPayloadItem[]): Promise<PricingRequestResult> => {
    activeController?.abort()
    const controller = new AbortController()
    activeController = controller
    const requestId = ++latestRequestId

    try {
      const response = await fetchImpl("/api/cart/price", {
        body: JSON.stringify({ items }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error("Error al calcular precios")
      }

      const data = (await response.json()) as PricedCartResult
      return {
        data,
        isLatest: requestId === latestRequestId,
        requestId,
        status: "success",
      }
    } catch (error) {
      if (isAbortError(error)) {
        return {
          isLatest: requestId === latestRequestId,
          requestId,
          status: "aborted",
        }
      }

      return {
        error: error instanceof Error ? error : new Error("Error desconocido"),
        isLatest: requestId === latestRequestId,
        requestId,
        status: "error",
      }
    } finally {
      if (activeController === controller) {
        activeController = null
      }
    }
  }

  const cancel = () => {
    activeController?.abort()
    activeController = null
  }

  return { cancel, run }
}
