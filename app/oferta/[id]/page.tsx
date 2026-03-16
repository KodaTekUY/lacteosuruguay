import { getDealById } from "@/lib/db"
import { notFound } from "next/navigation"
import { DealDetailClient } from "./deal-detail-client"

interface DealPageProps {
  params: Promise<{ id: string }>
}

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params
  const dealId = parseInt(id, 10)
  
  if (isNaN(dealId)) {
    notFound()
  }

  const deal = await getDealById(dealId)

  if (!deal) {
    notFound()
  }

  return <DealDetailClient deal={deal} />
}
