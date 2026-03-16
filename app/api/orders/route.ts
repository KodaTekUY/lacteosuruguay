import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createOrder } from "@/lib/db"

const phoneSchema = z
  .string()
  .trim()
  .min(8)
  .max(30)
  .refine((value) => {
    const digitsOnly = value.replace(/\D/g, "")
    return digitsOnly.length >= 8 && digitsOnly.length <= 15
  })

const orderItemSchema = z.object({
  productId: z.number().int().positive().nullable(),
  dealId: z.number().int().positive().nullable(),
  isDeal: z.boolean(),
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  lineTotal: z.number().nonnegative(),
})

const createOrderSchema = z.object({
  customerPhone: phoneSchema,
  whatsappMessage: z.string().trim().min(1).max(10000),
  totals: z.object({
    baseTotal: z.number().nonnegative(),
    discountTotal: z.number().nonnegative(),
    finalTotal: z.number().nonnegative(),
  }),
  items: z.array(orderItemSchema).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = createOrderSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 },
      )
    }

    const order = await createOrder({
      customer_phone: parsed.data.customerPhone,
      whatsapp_message: parsed.data.whatsappMessage,
      base_total: parsed.data.totals.baseTotal,
      discount_total: parsed.data.totals.discountTotal,
      final_total: parsed.data.totals.finalTotal,
      items: parsed.data.items.map((item) => ({
        product_id: item.productId,
        deal_id: item.dealId,
        is_deal: item.isDeal,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      })),
    })

    if (!order) {
      return NextResponse.json(
        { error: "Unable to register order" },
        { status: 500 },
      )
    }

    return NextResponse.json({ orderId: order.id }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Unable to register order" },
      { status: 500 },
    )
  }
}
