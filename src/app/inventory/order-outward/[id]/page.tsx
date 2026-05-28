import { notFound } from "next/navigation"
import { getMockOutwardOrder } from "../mock-data"
import { OutwardScanView } from "./outward-scan-view"

export default async function OrderOutwardScanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const order = getMockOutwardOrder(params.id)

  if (!order) {
    notFound()
  }

  return <OutwardScanView order={order} />
}
