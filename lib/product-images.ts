interface ProductImageSource {
  image?: string | null
  images?: Array<string | null | undefined> | null
}

export function normalizeProductImages(images: Array<string | null | undefined>): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()

  for (const image of images) {
    const trimmed = typeof image === "string" ? image.trim() : ""
    if (!trimmed || seen.has(trimmed)) {
      continue
    }

    seen.add(trimmed)
    normalized.push(trimmed)
  }

  return normalized
}

export function getProductImages(product: ProductImageSource): string[] {
  const gallery = Array.isArray(product.images) ? normalizeProductImages(product.images) : []
  if (gallery.length > 0) {
    return gallery
  }

  return normalizeProductImages([product.image])
}

export function getPrimaryProductImage(
  product: ProductImageSource,
  fallbackImage = "/placeholder.svg",
): string {
  return getProductImages(product)[0] ?? fallbackImage
}
