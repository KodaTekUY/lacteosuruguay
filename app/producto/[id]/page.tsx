import { getProductById, getDealsForProduct } from "@/lib/db"
import { notFound } from "next/navigation"
import { ProductDetailClient } from "./product-detail-client"

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const productId = parseInt(id, 10)
  
  if (isNaN(productId)) {
    notFound()
  }

  const [product, deals] = await Promise.all([
    getProductById(productId),
    getDealsForProduct(productId)
  ])

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} deals={deals} />
}
