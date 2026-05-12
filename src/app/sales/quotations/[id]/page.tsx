import { notFound } from "next/navigation"
import { QuotationDetailsView } from "./quotation-details-view"
import { SalesDocument } from "@/app/sales/types"
import { Quotation } from "@/app/sales/quotations/types"

import { quotationsApi } from "@/lib/api"

async function getQuotation(id: string): Promise<Quotation | null> {
  try {
    return await quotationsApi.getById(id)
  } catch (error) {
    console.error("Error fetching quotation:", error)
    return null
  }
}

export default async function QuotationDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const quotation = await getQuotation(params.id)

  if (!quotation) {
    notFound()
  }

  return <QuotationDetailsView quotation={quotation} />
}
