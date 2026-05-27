import { notFound } from "next/navigation"
import { ProformaDetailsView } from "./proforma-details-view"
import { proformaApi } from "@/lib/api"

export default async function ProformaDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  
  try {
    const proforma = await proformaApi.getById(params.id)
    
    if (!proforma) {
      notFound()
    }
    
    return <ProformaDetailsView proforma={proforma} />
  } catch (error) {
    console.error(`Error loading proforma ${params.id}:`, error)
    notFound()
  }
}
