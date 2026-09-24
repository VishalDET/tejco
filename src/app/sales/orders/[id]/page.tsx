import * as React from "react"
import { useParams } from "react-router-dom"
import { OrderDetailsView } from "@/app/sales/orders/[id]/order-details-view"
import { Order, mapApiSalesOrder, salesOrderClientCache } from "@/app/sales/orders/types"
import { salesOrderApi, clientsApi } from "@/lib/api"
import { Loader } from "@/components/ui/loader"

export default function OrderDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [order, setOrder] = React.useState<Order | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)

    salesOrderApi.getById(id)
      .then(async (raw) => {
        if (!active) return
        const data = raw?.data || raw
        if (data) {
          const mapped = mapApiSalesOrder(data, salesOrderClientCache)
          if (mapped.clientId && mapped.clientId !== "0" && (!mapped.clientName || mapped.clientName.startsWith("Client #"))) {
            try {
              const client = salesOrderClientCache.get(mapped.clientId) || await clientsApi.getById(mapped.clientId)
              if (client && client.name) {
                salesOrderClientCache.set(mapped.clientId, client)
                mapped.clientName = client.name
                mapped.doctorSpeciality = mapped.doctorSpeciality || client.doctorSpeciality || ""
                mapped.clientGSTIN = mapped.clientGSTIN || client.gstin || ""
              }
            } catch {}
          }
          setOrder(mapped)
        }
        setLoading(false)
      })
      .catch((error) => {
        if (active) {
          console.error(`Failed to load sales order ${id}:`, error)
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
        <Loader layout="container" size="lg" text="Loading order details..." />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-2">
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <p className="text-muted-foreground">The requested order could not be loaded.</p>
      </div>
    )
  }

  return <OrderDetailsView order={order} />
}
