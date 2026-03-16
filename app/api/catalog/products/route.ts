import { NextRequest, NextResponse } from "next/server"
import { DEFAULT_CATALOG_PAGE_SIZE, getCatalogProductsPage } from "@/lib/db"

function parsePositiveInt(rawValue: string | null, fallback: number): number {
  if (!rawValue) return fallback

  const value = Number.parseInt(rawValue, 10)
  if (!Number.isInteger(value) || value < 1) {
    return fallback
  }

  return value
}

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams

  const page = parsePositiveInt(searchParams.get("page"), 1)
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_CATALOG_PAGE_SIZE)
  const searchQuery = searchParams.get("query") ?? ""
  const rawCategoryId = searchParams.get("categoryId")

  let categoryId: number | null = null
  if (rawCategoryId) {
    const parsedCategoryId = Number.parseInt(rawCategoryId, 10)
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId < 1) {
      return NextResponse.json(
        { error: "categoryId must be a positive integer" },
        { status: 400 },
      )
    }
    categoryId = parsedCategoryId
  }

  try {
    const result = await getCatalogProductsPage({
      categoryId,
      page,
      pageSize,
      searchQuery,
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { error: "Unable to load products" },
      { status: 500 },
    )
  }
}
