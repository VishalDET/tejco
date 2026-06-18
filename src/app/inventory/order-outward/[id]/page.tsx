import { notFound } from "next/navigation"
import { OutwardScanView } from "./outward-scan-view"
import { orderOutwardApi } from "@/lib/api"
import { mapApiOutwardOrder } from "../types"

export default async function OrderOutwardScanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  
  let order = null
  try {
    const apiOrder = await orderOutwardApi.getById(params.id)
    if (apiOrder) {
      order = mapApiOutwardOrder(apiOrder)
    }
  } catch (err) {
    console.error("Failed to load outward order from API:", err)
  }

  if (!order) {
    notFound()
  }

  return <OutwardScanView order={order} />
}
