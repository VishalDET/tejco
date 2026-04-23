import { notFound } from "next/navigation"
import { ProformaDetailsView } from "./proforma-details-view"
import { SalesDocument } from "@/app/sales/types"

// Mock fetch function
async function getProforma(id: string): Promise<SalesDocument | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Return mock data for demonstration
  return {
    id: id,
    number: `PI-2024-${id.slice(0, 4).toUpperCase()}`,
    clientId: "c2",
    clientName: "City Dental Clinic",
    date: "2024-03-05",
    status: "Issued",
    items: [
      { id: "i3", productId: "p3", productName: "Dental Chair (Elite)", sku: "DC-EL-2024", quantity: 1, unitPrice: 85000, total: 85000, gstRate: 18 },
      { id: "i4", productId: "p4", productName: "LED Curing Light", sku: "LED-CL-B", quantity: 4, unitPrice: 4500, total: 18000, gstRate: 12 }
    ],
    subtotal: 103000,
    taxAmount: 17460, // 85000 * 0.18 (15300) + 18000 * 0.12 (2160) = 17460
    totalAmount: 120460,
    billingAddress: "456 Healthcare Row, Pune, Maharashtra 411001",
    shippingAddress: "Main Clinic, 2nd Floor, City Dental, Pune 411002",
    notes: "Proforma generated for advance payment (50%). Balance due upon delivery."
  }
}

export default async function ProformaDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const proforma = await getProforma(params.id)

  if (!proforma) {
    notFound()
  }

  return <ProformaDetailsView proforma={proforma} />
}
