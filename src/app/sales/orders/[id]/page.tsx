import { notFound } from "next/navigation"
import { OrderDetailsView } from "@/app/sales/orders/[id]/order-details-view"
import { Order, mapApiSalesOrder } from "@/app/sales/orders/types"
import { salesOrderApi } from "@/lib/api"

async function getOrder(id: string): Promise<Order | null> {
  try {
    const raw = await salesOrderApi.getById(id)
    const data = raw?.data || raw
    if (!data) return null
    return mapApiSalesOrder(data)
  } catch (error) {
    console.error(`Failed to load sales order ${id}:`, error)
    return null
  }
}

export default async function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const order = await getOrder(params.id)

  if (!order) {
    notFound()
  }

  return <OrderDetailsView order={order} />
}
