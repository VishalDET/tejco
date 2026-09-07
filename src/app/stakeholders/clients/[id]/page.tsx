import * as React from "react"
import { useParams } from "react-router-dom"
import { clientsApi } from "@/lib/api"
import { ClientDetailsView } from "@/app/stakeholders/clients/[id]/client-details-view"
import { Loader } from "@/components/ui/loader"

export default function ClientDetailsPage() {
  const params = useParams()
  const id = params.id as string

  const [client, setClient] = React.useState<any>(null)
  const [allDeliveries, setAllDeliveries] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<any>(null)

  React.useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)

    Promise.all([
      clientsApi.getById(id),
      clientsApi.getDeliveries(id).catch(() => []),
    ])
      .then(([clientData, deliveriesData]) => {
        if (active) {
          setClient(clientData)
          setAllDeliveries(deliveriesData)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          console.error(`[ClientDetailsPage] Failed to fetch client ${id}:`, err)
          setError(err)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader layout="container" size="lg" text="Loading client details..." />
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-2">
        <h2 className="text-xl font-bold">Client Not Found</h2>
        <p className="text-muted-foreground">The requested client could not be loaded.</p>
      </div>
    )
  }

  return <ClientDetailsView client={client} allDeliveries={allDeliveries} />
}
