import { notFound } from "next/navigation"
import { OrderDetailsView } from "@/app/sales/orders/[id]/order-details-view"
import { Order } from "@/app/sales/orders/types"

// Mock fetch function (to be replaced with real API call later)
async function getOrder(id: string): Promise<Order | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Return mock data for demonstration
  return {
    id: id,
    orderNumber: `ORD-${id.slice(0, 4).toUpperCase()}`,
    clientId: "c1",
    clientName: "Dr. Aris Varma",
    salesPersonId: "SP-001",
    date: "2026-03-08",
    deliveryDate: "2026-03-15",
    status: "Approved",
    paymentStatus: "Paid",
    items: [
      { id: "i1", productId: "p1", productName: "Surgical Blade #10", sku: "SB-010-G", quantity: 100, unitPrice: 12.50, total: 1250 },
      { id: "i2", productId: "p2", productName: "Medical Gauze (Sterile)", sku: "MG-ST-100", quantity: 50, unitPrice: 68.41, total: 3420.5 }
    ],
    subtotal: 4670.5,
    taxAmount: 840.69,
    totalAmount: 5511.19,
    billingAddress: "123 Medical Plaza, Mumbai, Maharashtra 400001",
    shippingAddress: "Clinic 5, City Dental Care, Mumbai, Maharashtra 400002",
    notes: "Please pack with extra care for fragile blades."
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
