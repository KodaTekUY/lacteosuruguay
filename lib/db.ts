import { neon } from "@neondatabase/serverless"
import { getProductImages } from "@/lib/product-images"

// Type definitions
export interface Category {
  id: number
  name: string
  image: string | null
}

export interface Product {
  id: number
  name: string
  price: number
  image: string | null
  images?: string[]
  category_id: number | null
  category_name?: string
  is_popular: boolean
  is_active: boolean
}

export interface CreateOrderItemInput {
  product_id: number | null
  deal_id: number | null
  is_deal: boolean
  item_name: string
  quantity: number
  unit_price: number
  line_total: number
}

export interface CreateOrderInput {
  customer_phone: string
  whatsapp_message: string
  base_total: number
  discount_total: number
  final_total: number
  items: CreateOrderItemInput[]
}

export interface CreatedOrder {
  id: number
}

export interface CatalogProductsFilters {
  categoryId?: number | null
  page?: number
  pageSize?: number
  searchQuery?: string
}

export interface CatalogProductsPage {
  hasMore: boolean
  items: Product[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type DealType = 'bundle' | 'tiered_total' | 'threshold_unit' | 'percent_off'
export type ApplyMode = 'best_price' | 'repeatable' | 'once'

export const DEFAULT_CATALOG_PAGE_SIZE = 16
const MAX_CATALOG_PAGE_SIZE = 60
const DEFAULT_CATEGORY_COLOR = "bg-neutral-100"
const DEFAULT_DEAL_COLOR = "bg-neutral-100"

export interface DealTier {
  id: number
  deal_id: number
  min_qty: number
  max_qty: number | null
  total_price: number | null
  unit_price: number | null
  discount_pct: number | null
}

export interface DealProduct {
  id: number
  deal_id: number
  product_id: number
  quantity: number
  product?: Product
}

export interface Deal {
  id: number
  title: string
  description: string | null
  image: string | null
  button_text: string
  button_link: string | null
  is_active: boolean
  deal_type: DealType
  apply_mode: ApplyMode
  starts_at: string | null
  ends_at: string | null
  // Related data
  products?: DealProduct[]
  tiers?: DealTier[]
  original_price?: number
}

interface DealProductWithProductRow {
  id: number
  deal_id: number
  product_id: number
  quantity: number
  p_id: number
  name: string
  price: number | string
  image: string | null
  images?: string[] | null
  category_id: number | null
  is_popular: boolean
  is_active: boolean
}

const fallbackCategories: Category[] = [
  { id: 1, name: "Snacks", image: "/placeholder.svg?height=60&width=60" },
  { id: 2, name: "Breakfast", image: "/placeholder.svg?height=60&width=60" },
  { id: 3, name: "Canned", image: "/placeholder.svg?height=60&width=60" },
  { id: 4, name: "Sauce", image: "/placeholder.svg?height=60&width=60" },
  { id: 5, name: "Dairy", image: "/placeholder.svg?height=60&width=60" },
  { id: 6, name: "Bakery", image: "/placeholder.svg?height=60&width=60" },
  { id: 7, name: "Cheese", image: "/placeholder.svg?height=60&width=60" },
  { id: 8, name: "Candy", image: "/placeholder.svg?height=60&width=60" },
]

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Mushroom Sauce",
    price: 13.99,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 4,
    category_name: "Sauce",
    is_popular: true,
    is_active: true,
  },
  {
    id: 2,
    name: "Ghetto Gastro",
    price: 13.99,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 1,
    category_name: "Snacks",
    is_popular: true,
    is_active: true,
  },
  {
    id: 3,
    name: "Seasoned Avocado",
    price: 8.5,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 1,
    category_name: "Snacks",
    is_popular: true,
    is_active: true,
  },
  {
    id: 4,
    name: "Eggs",
    price: 9.99,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 5,
    category_name: "Dairy",
    is_popular: true,
    is_active: true,
  },
  {
    id: 5,
    name: "Organic Milk",
    price: 5.99,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 5,
    category_name: "Dairy",
    is_popular: true,
    is_active: true,
  },
  {
    id: 6,
    name: "Whole Grain Cereal",
    price: 7.49,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 2,
    category_name: "Breakfast",
    is_popular: true,
    is_active: true,
  },
  {
    id: 7,
    name: "Tomato Soup",
    price: 4.99,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 3,
    category_name: "Canned",
    is_popular: true,
    is_active: true,
  },
  {
    id: 8,
    name: "Cheddar Cheese",
    price: 11.99,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 7,
    category_name: "Cheese",
    is_popular: true,
    is_active: true,
  },
  {
    id: 9,
    name: "Sourdough Bread",
    price: 6.49,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 6,
    category_name: "Bakery",
    is_popular: true,
    is_active: true,
  },
  {
    id: 10,
    name: "Potato Chips",
    price: 3.99,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 1,
    category_name: "Snacks",
    is_popular: true,
    is_active: true,
  },
  {
    id: 11,
    name: "Chocolate Bar",
    price: 2.99,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 8,
    category_name: "Candy",
    is_popular: true,
    is_active: true,
  },
  {
    id: 12,
    name: "BBQ Sauce",
    price: 5.49,
    image: "/placeholder.svg?height=200&width=200",
    category_id: 4,
    category_name: "Sauce",
    is_popular: true,
    is_active: true,
  },
]

const fallbackDeals: Deal[] = [
  {
    id: 1,
    title: "Meal Plan with Grocery Store",
    description: "Get your meal plan, and make your grocery store for yours.",
    image: "/placeholder.svg?height=150&width=150",
    button_text: "Agregar",
    button_link: null,
    is_active: true,
    deal_type: 'bundle',
    apply_mode: 'best_price',
    starts_at: null,
    ends_at: null,
    products: [
      {
        id: 1,
        deal_id: 1,
        product_id: 1,
        quantity: 1,
        product: {
          id: 1,
          name: "Mushroom Sauce",
          price: 13.99,
          image: "/placeholder.svg?height=200&width=200",
          category_id: 4,
          is_popular: true,
          is_active: true,
        },
      },
      {
        id: 2,
        deal_id: 1,
        product_id: 5,
        quantity: 1,
        product: {
          id: 5,
          name: "Organic Milk",
          price: 5.99,
          image: "/placeholder.svg?height=200&width=200",
          category_id: 5,
          is_popular: true,
          is_active: true,
        },
      },
      {
        id: 3,
        deal_id: 1,
        product_id: 6,
        quantity: 1,
        product: {
          id: 6,
          name: "Whole Grain Cereal",
          price: 7.49,
          image: "/placeholder.svg?height=200&width=200",
          category_id: 2,
          is_popular: true,
          is_active: true,
        },
      },
    ],
    tiers: [
      { id: 1, deal_id: 1, min_qty: 1, max_qty: null, total_price: 25.99, unit_price: null, discount_pct: null },
    ],
    original_price: 27.47,
  },
  {
    id: 2,
    title: "Making the Most of Your Grocery",
    description: "Making the most of your grocery to promote high quality products.",
    image: "/placeholder.svg?height=150&width=150",
    button_text: "Agregar",
    button_link: null,
    is_active: true,
    deal_type: 'bundle',
    apply_mode: 'best_price',
    starts_at: null,
    ends_at: null,
    products: [
      {
        id: 4,
        deal_id: 2,
        product_id: 4,
        quantity: 1,
        product: {
          id: 4,
          name: "Eggs",
          price: 9.99,
          image: "/placeholder.svg?height=200&width=200",
          category_id: 5,
          is_popular: true,
          is_active: true,
        },
      },
      {
        id: 5,
        deal_id: 2,
        product_id: 8,
        quantity: 1,
        product: {
          id: 8,
          name: "Cheddar Cheese",
          price: 11.99,
          image: "/placeholder.svg?height=200&width=200",
          category_id: 7,
          is_popular: true,
          is_active: true,
        },
      },
    ],
    tiers: [
      { id: 2, deal_id: 2, min_qty: 1, max_qty: null, total_price: 18.99, unit_price: null, discount_pct: null },
    ],
    original_price: 21.98,
  },
]

const isDatabaseConfigured = !!process.env.DATABASE_URL

// Create SQL client only if DATABASE_URL is available
const sql = isDatabaseConfigured ? neon(process.env.DATABASE_URL!) : null

type SqlClient = NonNullable<typeof sql>

interface DealBaseRow {
  id: number
  title: string
  description: string | null
  image: string | null
  button_text: string
  button_link: string | null
  is_active: boolean
  deal_type: DealType
  apply_mode: ApplyMode
  starts_at: string | null
  ends_at: string | null
}

function shouldUseFallbackOnReadError() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DB_FALLBACK === "true"
}

function handleReadError<T>(message: string, fallbackValue: T, error: unknown): T {
  console.error(`${message}:`, error)

  if (shouldUseFallbackOnReadError()) {
    return fallbackValue
  }

  throw new Error(message, {
    cause: error instanceof Error ? error : new Error(String(error)),
  })
}

function normalizeCatalogPage(value?: number): number {
  if (!Number.isInteger(value) || value === undefined || value < 1) {
    return 1
  }
  return value
}

function normalizeCatalogPageSize(value?: number): number {
  if (!Number.isInteger(value) || value === undefined || value < 1) {
    return DEFAULT_CATALOG_PAGE_SIZE
  }
  return Math.min(value, MAX_CATALOG_PAGE_SIZE)
}

function normalizeCatalogSearchQuery(value?: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getFilteredFallbackProducts(
  categoryId: number | null,
  searchQuery: string | null,
): Product[] {
  return fallbackProducts
    .filter((product) => {
      if (!product.is_active) return false
      const matchesCategory = categoryId === null || product.category_id === categoryId
      const matchesSearch =
        searchQuery === null || product.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      if (a.is_popular === b.is_popular) {
        return a.id - b.id
      }
      return a.is_popular ? -1 : 1
    })
    .map((product) => normalizeProductRecord(product))
}

function paginateCatalogItems(
  items: Product[],
  page: number,
  pageSize: number,
): CatalogProductsPage {
  const totalItems = items.length
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
  const offset = (page - 1) * pageSize
  const paginatedItems = items.slice(offset, offset + pageSize)
  const hasMore = offset + paginatedItems.length < totalItems

  return {
    items: paginatedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasMore,
  }
}

function normalizeProductRecord(product: Product): Product {
  const images = getProductImages(product)

  return {
    ...product,
    image: images[0] ?? null,
    images,
  }
}

function normalizeProductRecords(products: Product[]): Product[] {
  return products.map((product) => normalizeProductRecord(product))
}

function getNormalizedProductMutationImages(data: Pick<Partial<Product>, "image" | "images">): string[] | undefined {
  if (data.image === undefined && data.images === undefined) {
    return undefined
  }

  return getProductImages({
    image: data.image ?? null,
    images: data.images ?? undefined,
  })
}

function mapDealProducts(rows: DealProductWithProductRow[]): DealProduct[] {
  return rows.map((row) => ({
    id: row.id,
    deal_id: row.deal_id,
    product_id: row.product_id,
    quantity: row.quantity,
    product: normalizeProductRecord({
      id: row.p_id,
      name: row.name,
      price: Number(row.price),
      image: row.image,
      images: row.images ?? undefined,
      category_id: row.category_id,
      is_popular: row.is_popular,
      is_active: row.is_active,
    }),
  }))
}

function buildDealsWithRelations(
  deals: DealBaseRow[],
  dealProductRows: DealProductWithProductRow[],
  tierRows: DealTier[],
): Deal[] {
  const productsByDealId = new Map<number, DealProduct[]>()
  const tiersByDealId = new Map<number, DealTier[]>()

  for (const row of dealProductRows) {
    const rows = productsByDealId.get(row.deal_id) ?? []
    rows.push(
      ...mapDealProducts([
        {
          id: row.id,
          deal_id: row.deal_id,
          product_id: row.product_id,
          quantity: row.quantity,
          p_id: row.p_id,
          name: row.name,
          price: row.price,
          image: row.image,
          images: row.images ?? undefined,
          category_id: row.category_id,
          is_popular: row.is_popular,
          is_active: row.is_active,
        },
      ]),
    )
    productsByDealId.set(row.deal_id, rows)
  }

  for (const tier of tierRows) {
    const rows = tiersByDealId.get(tier.deal_id) ?? []
    rows.push(tier)
    tiersByDealId.set(tier.deal_id, rows)
  }

  return deals.map((deal) => {
    const products = productsByDealId.get(deal.id) ?? []
    const tiers = tiersByDealId.get(deal.id) ?? []
    const original_price = products.reduce(
      (sum, product) => sum + (product.product?.price ?? 0) * product.quantity,
      0,
    )

    return {
      ...deal,
      products,
      tiers,
      original_price,
    }
  })
}

async function hydrateDeals(deals: DealBaseRow[]): Promise<Deal[]> {
  if (!sql || deals.length === 0) {
    return deals.map((deal) => ({ ...deal, products: [], tiers: [], original_price: 0 }))
  }

  const dealIds = deals.map((deal) => deal.id)
  const [dealProducts, tiers] = await Promise.all([
    sql`
      SELECT dp.id, dp.deal_id, dp.product_id, dp.quantity,
             p.id as p_id, p.name, p.price, p.image, p.images, p.category_id, p.is_popular, p.is_active
      FROM deal_products dp
      INNER JOIN products p ON p.id = dp.product_id
      WHERE dp.deal_id = ANY(${dealIds})
      ORDER BY dp.deal_id, dp.id
    `,
    sql`
      SELECT id, deal_id, min_qty, max_qty, total_price, unit_price, discount_pct
      FROM deal_tiers
      WHERE deal_id = ANY(${dealIds})
      ORDER BY deal_id, min_qty ASC
    `,
  ])

  return buildDealsWithRelations(
    deals,
    dealProducts as DealProductWithProductRow[],
    tiers as DealTier[],
  )
}

function buildUpdateStatement(
  table: "categories" | "products" | "deals",
  id: number,
  updates: Record<string, unknown>,
): { query: string; values: unknown[] } | null {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined)

  if (entries.length === 0) return null

  const setClauses = entries.map(([key], index) => `${key} = $${index + 1}`).join(", ")
  const values = entries.map(([, value]) => value)
  values.push(id)

  return {
    query: `UPDATE ${table} SET ${setClauses} WHERE id = $${entries.length + 1} RETURNING *`,
    values,
  }
}

async function selectById<T>(client: SqlClient, table: "categories" | "products" | "deals", id: number): Promise<T | null> {
  const rows = await client.query(`SELECT * FROM ${table} WHERE id = $1`, [id])
  return (rows[0] as T) ?? null
}

// Database queries with fallback
export async function getCategories(): Promise<Category[]> {
  if (!sql) return fallbackCategories

  try {
    const categories = await sql`SELECT id, name, image FROM categories ORDER BY id`
    return categories as Category[]
  } catch (error) {
    return handleReadError("Error fetching categories", fallbackCategories, error)
  }
}

export async function getProducts(): Promise<Product[]> {
  if (!sql) return normalizeProductRecords(fallbackProducts)

  try {
    const products = await sql`
      SELECT p.id, p.name, p.price, p.image, p.images, p.category_id, p.is_popular, p.is_active, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id
    `
    return normalizeProductRecords(products as Product[])
  } catch (error) {
    return handleReadError("Error fetching products", normalizeProductRecords(fallbackProducts), error)
  }
}

export async function getCatalogProductsPage(
  filters: CatalogProductsFilters = {},
): Promise<CatalogProductsPage> {
  const page = normalizeCatalogPage(filters.page)
  const pageSize = normalizeCatalogPageSize(filters.pageSize)
  const normalizedCategoryId =
    typeof filters.categoryId === "number" && Number.isInteger(filters.categoryId) && filters.categoryId > 0
      ? filters.categoryId
      : null
  const normalizedSearchQuery = normalizeCatalogSearchQuery(filters.searchQuery)

  const fallbackResult = paginateCatalogItems(
    getFilteredFallbackProducts(normalizedCategoryId, normalizedSearchQuery),
    page,
    pageSize,
  )

  if (!sql) {
    return fallbackResult
  }

  try {
    const whereClauses: string[] = []
    const whereValues: unknown[] = []

    whereClauses.push("p.is_active = true")

    if (normalizedCategoryId !== null) {
      whereValues.push(normalizedCategoryId)
      whereClauses.push(`p.category_id = $${whereValues.length}`)
    }

    if (normalizedSearchQuery !== null) {
      whereValues.push(`%${normalizedSearchQuery}%`)
      whereClauses.push(`p.name ILIKE $${whereValues.length}`)
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""

    const countRows = (await sql.query(
      `
        SELECT COUNT(*)::int AS total_items
        FROM products p
        ${whereSql}
      `,
      whereValues,
    )) as Array<{ total_items: number }>

    const totalItems = Number(countRows[0]?.total_items ?? 0)
    const offset = (page - 1) * pageSize

    const products = (await sql.query(
      `
        SELECT p.id, p.name, p.price, p.image, p.images, p.category_id, p.is_popular, p.is_active, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereSql}
        ORDER BY p.is_popular DESC, p.id ASC
        LIMIT $${whereValues.length + 1}
        OFFSET $${whereValues.length + 2}
      `,
      [...whereValues, pageSize, offset],
    )) as Product[]

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)

    return {
      items: normalizeProductRecords(products),
      page,
      pageSize,
      totalItems,
      totalPages,
      hasMore: offset + products.length < totalItems,
    }
  } catch (error) {
    return handleReadError("Error fetching catalog products page", fallbackResult, error)
  }
}

export async function getPopularProducts(): Promise<Product[]> {
  if (!sql) return normalizeProductRecords(fallbackProducts.filter((p) => p.is_popular && p.is_active))

  try {
    const products = await sql`
      SELECT p.id, p.name, p.price, p.image, p.images, p.category_id, p.is_popular, p.is_active, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_popular = true AND p.is_active = true
      ORDER BY p.id
    `
    return normalizeProductRecords(products as Product[])
  } catch (error) {
    return handleReadError(
      "Error fetching popular products",
      normalizeProductRecords(fallbackProducts.filter((p) => p.is_popular && p.is_active)),
      error,
    )
  }
}

export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  if (!sql) return normalizeProductRecords(fallbackProducts.filter((p) => p.category_id === categoryId && p.is_active))

  try {
    const products = await sql`
      SELECT p.id, p.name, p.price, p.image, p.images, p.category_id, p.is_popular, p.is_active, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ${categoryId} AND p.is_active = true
      ORDER BY p.id
    `
    return normalizeProductRecords(products as Product[])
  } catch (error) {
    return handleReadError(
      "Error fetching products by category",
      normalizeProductRecords(fallbackProducts.filter((p) => p.category_id === categoryId && p.is_active)),
      error,
    )
  }
}

export async function getProductById(productId: number): Promise<Product | null> {
  if (!sql) {
    const product = fallbackProducts.find((p) => p.id === productId && p.is_active) || null
    return product ? normalizeProductRecord(product) : null
  }

  try {
    const products = await sql`
      SELECT p.id, p.name, p.price, p.image, p.images, p.category_id, p.is_popular, p.is_active, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ${productId} AND p.is_active = true
    `
    const product = (products as Product[])[0] || null
    return product ? normalizeProductRecord(product) : null
  } catch (error) {
    const fallbackProduct = fallbackProducts.find((p) => p.id === productId && p.is_active) || null
    return handleReadError(
      "Error fetching product by id",
      fallbackProduct ? normalizeProductRecord(fallbackProduct) : null,
      error,
    )
  }
}

export async function getDealsForProduct(productId: number): Promise<Deal[]> {
  if (!sql) {
    return fallbackDeals.filter(deal => 
      deal.products?.some(dp => dp.product_id === productId)
    )
  }

  try {
    const now = new Date().toISOString()
    const deals = await sql`
      SELECT DISTINCT d.id, d.title, d.description, d.image, d.button_text, d.button_link, 
             d.deal_type, d.apply_mode, d.starts_at, d.ends_at, d.is_active
      FROM deals d
      INNER JOIN deal_products dp ON dp.deal_id = d.id
      INNER JOIN products p ON p.id = dp.product_id
      WHERE dp.product_id = ${productId}
        AND p.is_active = true
        AND d.is_active = true
        AND (d.starts_at IS NULL OR d.starts_at <= ${now})
        AND (d.ends_at IS NULL OR d.ends_at >= ${now})
      ORDER BY d.id
    `
    return hydrateDeals(deals as DealBaseRow[])
  } catch (error) {
    return handleReadError(
      "Error fetching deals for product",
      fallbackDeals.filter(deal => deal.products?.some(dp => dp.product_id === productId)),
      error,
    )
  }
}

export async function getDealById(dealId: number): Promise<Deal | null> {
  if (!sql) {
    return fallbackDeals.find(d => d.id === dealId) || null
  }

  try {
    const now = new Date().toISOString()
    const deals = await sql`
      SELECT id, title, description, image, button_text, button_link, 
             deal_type, apply_mode, starts_at, ends_at, is_active
      FROM deals
      WHERE id = ${dealId}
        AND is_active = true
        AND (starts_at IS NULL OR starts_at <= ${now})
        AND (ends_at IS NULL OR ends_at >= ${now})
    `

    if ((deals as DealBaseRow[]).length === 0) return null

    const hydrated = await hydrateDeals(deals as DealBaseRow[])
    return hydrated[0] ?? null
  } catch (error) {
    return handleReadError("Error fetching deal by id", fallbackDeals.find(d => d.id === dealId) || null, error)
  }
}

export async function getActiveDeals(): Promise<Deal[]> {
  if (!sql) return fallbackDeals

  try {
    const now = new Date().toISOString()
    const deals = await sql`
      SELECT id, title, description, image, button_text, button_link, 
             deal_type, apply_mode, starts_at, ends_at, is_active
      FROM deals
      WHERE is_active = true
        AND (starts_at IS NULL OR starts_at <= ${now})
        AND (ends_at IS NULL OR ends_at >= ${now})
      ORDER BY id
    `
    return hydrateDeals(deals as DealBaseRow[])
  } catch (error) {
    return handleReadError("Error fetching deals", fallbackDeals, error)
  }
}

export async function getAllDeals(): Promise<Deal[]> {
  if (!sql) return fallbackDeals
  try {
    const deals = await sql`SELECT * FROM deals ORDER BY id`
    return hydrateDeals(deals as DealBaseRow[])
  } catch (error) {
    return handleReadError("Error fetching all deals", fallbackDeals, error)
  }
}

export async function createOrder(data: CreateOrderInput): Promise<CreatedOrder | null> {
  if (!sql) return null

  try {
    const results = (await sql.transaction((tx) => {
      const queries = [
        tx`
          INSERT INTO orders (customer_phone, whatsapp_message, base_total, discount_total, final_total)
          VALUES (${data.customer_phone}, ${data.whatsapp_message}, ${data.base_total}, ${data.discount_total}, ${data.final_total})
          RETURNING id
        `,
      ]

      for (const item of data.items) {
        queries.push(tx`
          INSERT INTO order_items (order_id, product_id, deal_id, is_deal, item_name, quantity, unit_price, line_total)
          VALUES (
            currval(pg_get_serial_sequence('orders', 'id')),
            ${item.product_id},
            ${item.deal_id},
            ${item.is_deal},
            ${item.item_name},
            ${item.quantity},
            ${item.unit_price},
            ${item.line_total}
          )
        `)
      }

      return queries
    })) as Array<unknown[]>

    const rows = (results[0] ?? []) as CreatedOrder[]
    return rows[0] ?? null
  } catch (error) {
    console.error("Error creating order:", error)
    return null
  }
}

// CRUD functions for admin panel
export async function createCategory(data: Omit<Category, "id">): Promise<Category | null> {
  if (!sql) return null
  try {
    const result = await sql`
      INSERT INTO categories (name, image, color)
      VALUES (${data.name}, ${data.image}, ${DEFAULT_CATEGORY_COLOR})
      RETURNING *
    `
    return result[0] as Category
  } catch (error) {
    console.error("Error creating category:", error)
    return null
  }
}

export async function updateCategory(id: number, data: Partial<Category>): Promise<Category | null> {
  if (!sql) return null
  try {
    const statement = buildUpdateStatement("categories", id, {
      name: data.name,
      image: data.image,
    })

    if (!statement) {
      return selectById<Category>(sql, "categories", id)
    }

    const result = await sql.query(statement.query, statement.values)
    return (result[0] as Category) ?? null
  } catch (error) {
    console.error("Error updating category:", error)
    return null
  }
}

export async function deleteCategory(id: number): Promise<boolean> {
  if (!sql) return false
  try {
    await sql`DELETE FROM categories WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Error deleting category:", error)
    return false
  }
}

export async function createProduct(data: Omit<Product, "id" | "category_name">): Promise<Product | null> {
  if (!sql) return null
  try {
    const images = getProductImages(data)
    const primaryImage = images[0] ?? null
    const result = await sql`
      INSERT INTO products (name, price, image, images, category_id, is_popular, is_active)
      VALUES (${data.name}, ${data.price}, ${primaryImage}, ${images}, ${data.category_id}, ${data.is_popular}, ${data.is_active})
      RETURNING *
    `
    return normalizeProductRecord(result[0] as Product)
  } catch (error) {
    console.error("Error creating product:", error)
    return null
  }
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product | null> {
  if (!sql) return null
  try {
    const normalizedImages = getNormalizedProductMutationImages(data)
    const statement = buildUpdateStatement("products", id, {
      name: data.name,
      price: data.price,
      image: normalizedImages ? normalizedImages[0] ?? null : undefined,
      images: normalizedImages,
      category_id: data.category_id,
      is_popular: data.is_popular,
      is_active: data.is_active,
    })

    if (!statement) {
      const existing = await selectById<Product>(sql, "products", id)
      return existing ? normalizeProductRecord(existing) : null
    }

    const result = await sql.query(statement.query, statement.values)
    const product = (result[0] as Product) ?? null
    return product ? normalizeProductRecord(product) : null
  } catch (error) {
    console.error("Error updating product:", error)
    return null
  }
}

export async function deleteProduct(id: number): Promise<boolean> {
  if (!sql) return false
  try {
    await sql`DELETE FROM products WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    return false
  }
}

export interface CreateDealInput {
  title: string
  description: string | null
  image: string | null
  button_text: string
  button_link: string | null
  is_active: boolean
  deal_type: DealType
  apply_mode: ApplyMode
  starts_at?: string | null
  ends_at?: string | null
  products?: { product_id: number; quantity: number }[]
  tiers?: Omit<DealTier, 'id' | 'deal_id'>[]
}

export async function createDeal(data: CreateDealInput): Promise<Deal | null> {
  if (!sql) return null
  try {
    const results = (await sql.transaction((tx) => {
      const queries = [
        tx`
          INSERT INTO deals (title, description, image, color, button_text, button_link, is_active, deal_type, apply_mode, starts_at, ends_at)
          VALUES (${data.title}, ${data.description}, ${data.image}, ${DEFAULT_DEAL_COLOR}, ${data.button_text}, ${data.button_link}, ${data.is_active}, ${data.deal_type}, ${data.apply_mode}, ${data.starts_at || null}, ${data.ends_at || null})
          RETURNING *
        `,
      ]

      if (data.products && data.products.length > 0) {
        for (const { product_id, quantity } of data.products) {
          queries.push(tx`
            INSERT INTO deal_products (deal_id, product_id, quantity)
            VALUES (currval(pg_get_serial_sequence('deals', 'id')), ${product_id}, ${quantity})
          `)
        }
      }

      if (data.tiers && data.tiers.length > 0) {
        for (const tier of data.tiers) {
          queries.push(tx`
            INSERT INTO deal_tiers (deal_id, min_qty, max_qty, total_price, unit_price, discount_pct)
            VALUES (currval(pg_get_serial_sequence('deals', 'id')), ${tier.min_qty}, ${tier.max_qty || null}, ${tier.total_price || null}, ${tier.unit_price || null}, ${tier.discount_pct || null})
          `)
        }
      }

      return queries
    })) as Array<unknown[]>

    const dealRows = (results[0] ?? []) as Deal[]
    return dealRows[0] ?? null
  } catch (error) {
    console.error("Error creating deal:", error)
    return null
  }
}

export interface UpdateDealInput {
  title?: string
  description?: string | null
  image?: string | null
  button_text?: string
  button_link?: string | null
  is_active?: boolean
  deal_type?: DealType
  apply_mode?: ApplyMode
  starts_at?: string | null
  ends_at?: string | null
  products?: { product_id: number; quantity: number }[]
  tiers?: Omit<DealTier, 'id' | 'deal_id'>[]
}

export async function updateDeal(id: number, data: UpdateDealInput): Promise<Deal | null> {
  if (!sql) return null
  try {
    const dealUpdateStatement = buildUpdateStatement("deals", id, {
      title: data.title,
      description: data.description,
      image: data.image,
      button_text: data.button_text,
      button_link: data.button_link,
      is_active: data.is_active,
      deal_type: data.deal_type,
      apply_mode: data.apply_mode,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
    })

    const results = (await sql.transaction((tx) => {
      const queries = []

      if (dealUpdateStatement) {
        queries.push(tx.query(dealUpdateStatement.query, dealUpdateStatement.values))
      } else {
        queries.push(tx`SELECT * FROM deals WHERE id = ${id}`)
      }

      if (data.products !== undefined) {
        queries.push(tx`DELETE FROM deal_products WHERE deal_id = ${id}`)
        for (const { product_id, quantity } of data.products) {
          queries.push(tx`
            INSERT INTO deal_products (deal_id, product_id, quantity)
            VALUES (${id}, ${product_id}, ${quantity})
          `)
        }
      }

      if (data.tiers !== undefined) {
        queries.push(tx`DELETE FROM deal_tiers WHERE deal_id = ${id}`)
        for (const tier of data.tiers) {
          queries.push(tx`
            INSERT INTO deal_tiers (deal_id, min_qty, max_qty, total_price, unit_price, discount_pct)
            VALUES (${id}, ${tier.min_qty}, ${tier.max_qty || null}, ${tier.total_price || null}, ${tier.unit_price || null}, ${tier.discount_pct || null})
          `)
        }
      }

      return queries
    })) as Array<unknown[]>

    const updatedRows = (results[0] ?? []) as Deal[]
    return updatedRows[0] ?? null
  } catch (error) {
    console.error("Error updating deal:", error)
    return null
  }
}

export async function deleteDeal(id: number): Promise<boolean> {
  if (!sql) return false
  try {
    await sql.transaction((tx) => [
      tx`DELETE FROM deal_products WHERE deal_id = ${id}`,
      tx`DELETE FROM deal_tiers WHERE deal_id = ${id}`,
      tx`DELETE FROM deals WHERE id = ${id}`,
    ])
    return true
  } catch (error) {
    console.error("Error deleting deal:", error)
    return false
  }
}
