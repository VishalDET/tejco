import { notFound } from "next/navigation"
import { QuotationDetailsView } from "./quotation-details-view"
import { SalesDocument } from "@/app/sales/types"

// Mock fetch function
async function getQuotation(id: string): Promise<SalesDocument | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Return mock data for demonstration
  return {
    id: id,
    number: `QUO-2024-${id.slice(0, 4).toUpperCase()}`,
    clientId: "c1",
    clientName: "Dr. Aris Varma",
    date: "2024-03-01",
    validUntil: "2024-03-15",
    status: "Issued",
    items: [
      { id: "i1", productId: "p1", productName: "Surgical Blade #10", sku: "SB-010-G", quantity: 100, unitPrice: 12.50, total: 1250, gstRate: 18 },
      { id: "i2", productId: "p2", productName: "Medical Gauze (Sterile)", sku: "MG-ST-100", quantity: 50, unitPrice: 68.41, total: 3420.5, gstRate: 12 }
    ],
    subtotal: 4670.5,
    taxAmount: 635.46, // 1250 * 0.18 (225) + 3420.5 * 0.12 (410.46) = 635.46
    totalAmount: 5305.96,
    billingAddress: "123 Medical Plaza, Mumbai, Maharashtra 400001",
    shippingAddress: "Clinic 5, City Dental Care, Mumbai, Maharashtra 400002",
    notes: "Quote valid for 15 days from the date of issue."
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
