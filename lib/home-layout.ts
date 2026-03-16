export type HomeSection = "deals" | "categories" | "products"

export const HOME_SECTION_IDS: Record<HomeSection, string> = {
  deals: "promociones",
  categories: "categorias",
  products: "productos",
}

export function getHomeSectionsOrder(searchQuery: string): HomeSection[] {
  if (searchQuery.trim().length > 0) {
    return ["categories", "products"]
  }

  return ["deals", "categories", "products"]
}
