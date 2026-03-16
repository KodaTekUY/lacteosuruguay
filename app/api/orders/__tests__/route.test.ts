import { beforeEach, describe, expect, it, vi } from "vitest"

const createOrderMock = vi.fn()

vi.mock("@/lib/db", () => ({
  createOrder: createOrderMock,
}))

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
}

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 for invalid phone", async () => {
    const { POST } = await import("@/app/api/orders/route")
    const response = await POST(
      makeRequest({
        customerPhone: "abc",
        whatsappMessage: "pedido",
        totals: { baseTotal: 10, discountTotal: 0, finalTotal: 10 },
        items: [
          {
            productId: 1,
            dealId: null,
            isDeal: false,
            name: "Leche",
            quantity: 1,
            unitPrice: 10,
            lineTotal: 10,
          },
        ],
      }) as never,
    )

    const body = await response.json()
    expect(response.status).toBe(400)
    expect(String(body.error)).toContain("Invalid request payload")
    expect(createOrderMock).not.toHaveBeenCalled()
  })

  it("persists order and returns id", async () => {
    createOrderMock.mockResolvedValueOnce({ id: 42 })
    const { POST } = await import("@/app/api/orders/route")
    const response = await POST(
      makeRequest({
        customerPhone: "+54 11 5555 5555",
        whatsappMessage: "pedido",
        totals: { baseTotal: 100, discountTotal: 20, finalTotal: 80 },
        items: [
          {
            productId: 1,
            dealId: null,
            isDeal: false,
            name: "Leche",
            quantity: 2,
            unitPrice: 40,
            lineTotal: 80,
          },
        ],
      }) as never,
    )

    const body = await response.json()
    expect(response.status).toBe(201)
    expect(body.orderId).toBe(42)
    expect(createOrderMock).toHaveBeenCalledOnce()
  })

  it("returns 500 when storage fails", async () => {
    createOrderMock.mockRejectedValueOnce(new Error("db down"))
    const { POST } = await import("@/app/api/orders/route")
    const response = await POST(
      makeRequest({
        customerPhone: "+54 11 5555 5555",
        whatsappMessage: "pedido",
        totals: { baseTotal: 100, discountTotal: 20, finalTotal: 80 },
        items: [
          {
            productId: 1,
            dealId: null,
            isDeal: false,
            name: "Leche",
            quantity: 2,
            unitPrice: 40,
            lineTotal: 80,
          },
        ],
      }) as never,
    )

    const body = await response.json()
    expect(response.status).toBe(500)
    expect(body.error).toBe("Unable to register order")
  })
})
