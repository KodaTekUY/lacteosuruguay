import { z } from "zod"
import { normalizeProductImages } from "@/lib/product-images"

const nullableShortTextSchema = (label: string, max: number) =>
  z
    .union([z.string(), z.null()])
    .transform((value) => (value === null ? null : value.trim()))
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || value.length <= max, `${label} no puede superar ${max} caracteres`)

const requiredTextSchema = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(max, `${label} no puede superar ${max} caracteres`)

const normalizeNullableDateInput = (value: unknown): unknown => {
  if (value === null || value === undefined) return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "__invalid_date__"
    return value.toISOString()
  }

  if (typeof value === "string") {
    return value.trim()
  }

  return value
}

const nullableDateSchema: z.ZodType<string | null, z.ZodTypeDef, unknown> = z.preprocess(
  normalizeNullableDateInput,
  z
    .union([z.string(), z.null()])
    .refine(
      (value) => value === null || value.length === 0 || !Number.isNaN(Date.parse(value)),
      "Fecha invalida",
    )
    .transform((value) => (value && value.length > 0 ? value : null)),
)

const dealProductSchema = z.object({
  product_id: z.number().int().positive("product_id debe ser un entero positivo"),
  quantity: z.number().int().min(1, "quantity debe ser mayor o igual a 1"),
})

const dealTierSchema = z
  .object({
    min_qty: z.number().int().min(1, "min_qty debe ser mayor o igual a 1"),
    max_qty: z.number().int().min(1).nullable(),
    total_price: z.number().positive().nullable(),
    unit_price: z.number().positive().nullable(),
    discount_pct: z.number().positive().max(100).nullable(),
  })
  .superRefine((tier, ctx) => {
    const definedPriceVariants = [tier.total_price, tier.unit_price, tier.discount_pct].filter(
      (value) => value !== null,
    )

    if (definedPriceVariants.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada tier debe definir exactamente uno: total_price, unit_price o discount_pct",
      })
    }

    if (tier.max_qty !== null && tier.max_qty < tier.min_qty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "max_qty no puede ser menor que min_qty",
      })
    }
  })

const dealCommonSchema = z.object({
  title: requiredTextSchema("Titulo", 200),
  description: nullableShortTextSchema("Descripcion", 2000),
  image: nullableShortTextSchema("Imagen", 500),
  button_text: requiredTextSchema("Texto del boton", 50),
  button_link: nullableShortTextSchema("Link del boton", 500),
  is_active: z.boolean(),
  deal_type: z.enum(["bundle", "tiered_total", "threshold_unit", "percent_off"]),
  apply_mode: z.enum(["best_price", "repeatable", "once"]),
  starts_at: nullableDateSchema,
  ends_at: nullableDateSchema,
})

const productImagesSchema = z
  .array(z.union([z.string(), z.null()]))
  .transform((value) => normalizeProductImages(value))

function validateDateRange(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  ctx: z.RefinementCtx,
) {
  if (!startsAt || !endsAt) return

  const start = new Date(startsAt).getTime()
  const end = new Date(endsAt).getTime()
  if (start > end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La fecha de inicio no puede ser posterior a la fecha de fin",
    })
  }
}

export const positiveIdSchema = z.number().int().positive("ID invalido")

export const createCategorySchema = z.object({
  name: requiredTextSchema("Nombre", 100),
  image: nullableShortTextSchema("Imagen", 500),
})

export const updateCategorySchema = z.object({
  name: requiredTextSchema("Nombre", 100).optional(),
  image: nullableShortTextSchema("Imagen", 500).optional(),
})

export const createProductSchema = z.object({
  name: requiredTextSchema("Nombre", 200),
  price: z.number().positive("Precio debe ser mayor a 0"),
  image: nullableShortTextSchema("Imagen", 500),
  images: productImagesSchema.default([]),
  category_id: z.number().int().positive().nullable(),
  is_popular: z.boolean(),
  is_active: z.boolean(),
})

export const updateProductSchema = z.object({
  name: requiredTextSchema("Nombre", 200).optional(),
  price: z.number().positive("Precio debe ser mayor a 0").optional(),
  image: nullableShortTextSchema("Imagen", 500).optional(),
  images: productImagesSchema.optional(),
  category_id: z.number().int().positive().nullable().optional(),
  is_popular: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export const createDealSchema = dealCommonSchema
  .extend({
    products: z.array(dealProductSchema).min(1, "Debes seleccionar al menos un producto"),
    tiers: z.array(dealTierSchema).min(1, "Debes definir al menos un tier"),
  })
  .superRefine((data, ctx) => {
    validateDateRange(data.starts_at, data.ends_at, ctx)
  })

export const updateDealSchema = z
  .object({
    title: requiredTextSchema("Titulo", 200).optional(),
    description: nullableShortTextSchema("Descripcion", 2000).optional(),
    image: nullableShortTextSchema("Imagen", 500).optional(),
    button_text: requiredTextSchema("Texto del boton", 50).optional(),
    button_link: nullableShortTextSchema("Link del boton", 500).optional(),
    is_active: z.boolean().optional(),
    deal_type: z.enum(["bundle", "tiered_total", "threshold_unit", "percent_off"]).optional(),
    apply_mode: z.enum(["best_price", "repeatable", "once"]).optional(),
    starts_at: nullableDateSchema.optional(),
    ends_at: nullableDateSchema.optional(),
    products: z.array(dealProductSchema).min(1, "products no puede estar vacio").optional(),
    tiers: z.array(dealTierSchema).min(1, "tiers no puede estar vacio").optional(),
  })
  .superRefine((data, ctx) => {
    validateDateRange(data.starts_at, data.ends_at, ctx)
  })

export const authCredentialsSchema = z.object({
  username: requiredTextSchema("Usuario", 100),
  password: z.string().trim().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
})

export const authCredentialsUpdateSchema = z.object({
  currentUsername: requiredTextSchema("Usuario actual", 100),
  currentPassword: z
    .string()
    .trim()
    .min(8, "La contraseña actual debe tener al menos 8 caracteres")
    .max(200),
  newUsername: requiredTextSchema("Nuevo usuario", 100),
  newPassword: z
    .string()
    .trim()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .max(200),
})

export function parseWithSchema<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (parsed.success) return parsed.data

  const firstIssue = parsed.error.issues[0]
  console.error("Validation error:", parsed.error.format())
  throw new Error(firstIssue?.message ?? "Entrada invalida")
}
