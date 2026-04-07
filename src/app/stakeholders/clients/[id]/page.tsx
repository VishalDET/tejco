// Server Component — fetches from real API and passes data to the client view
import { notFound } from "next/navigation"
import { clientsApi } from "@/lib/api"
import { ClientDetailsView } from "@/app/stakeholders/clients/[id]/client-details-view"

export default async function ClientDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  let client
  try {
    client = await clientsApi.getById(params.id)
  } catch (err: any) {
    console.error(`[ClientDetailsPage] Failed to fetch client ${params.id}:`, err)
    if (err.status === 404) {
      notFound()
    }
    // For other errors (backend down, certificate issues), throw to error.tsx
    throw err
  }

  // Delivery history endpoint not yet available — pass empty array for now
  const allDeliveries = await clientsApi.getDeliveries(params.id).catch(() => [])

  return <ClientDetailsView client={client} allDeliveries={allDeliveries} />
}
