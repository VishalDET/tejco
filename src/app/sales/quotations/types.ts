import { SalesDocument, SalesDocumentItem } from "../types"

export interface ApiQuotationItem {
  quotationItemId: number
  quotationId: number
  productName: string
  itemName: string
  imageUrl: string
  price: number
  gstPercentage: number
  quantity: number
}

export interface ApiQuotation {
  quotationId: number
  quotationNumber: string
  quotationDate: string
  clientName: string
  clientAddress: string
  clientMobileNo: string
  subject: string
  gstinNo: string
  validityDays: number
  deliveryTime: string
  salesPersonName: string
  salesPersonCell: string
  createdAt: string
  updatedAt: string | null
  items: ApiQuotationItem[]
}

export interface Quotation extends SalesDocument {
  quotationId: number
  quotationNumber: string
  subject: string
  clientMobileNo: string
  validityDays: number
  deliveryTime: string
  salesPersonName: string
  salesPersonCell: string
  gstinNo?: string
}

export function mapApiQuotation(raw: ApiQuotation): Quotation {
  const subtotal = raw.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const taxAmount = raw.items.reduce((acc, item) => acc + (item.price * item.quantity * item.gstPercentage / 100), 0)

  return {
    id: String(raw.quotationId),
    quotationId: raw.quotationId,
    number: raw.quotationNumber,
    quotationNumber: raw.quotationNumber,
    clientId: "", // Not provided in the list API directly, but we have clientName
    clientName: raw.clientName,
    date: raw.quotationDate,
    validUntil: new Date(new Date(raw.quotationDate).getTime() + raw.validityDays * 24 * 60 * 60 * 1000).toISOString(),
    status: "Issued", // Default status from API response message "Quotations retrieved successfully."
    items: raw.items.map(item => ({
      id: String(item.quotationItemId),
      productId: String(item.quotationItemId), // Fallback
      productName: item.productName,
      name: item.itemName,
      sku: item.itemName, // The API doesn't seem to have a separate SKU field, using itemName as fallback
      quantity: item.quantity,
      unitPrice: item.price,
      gstRate: item.gstPercentage,
      total: item.price * item.quantity * (1 + item.gstPercentage / 100),
      imageUrl: item.imageUrl
    })),
    subtotal,
    taxAmount,
    totalAmount: subtotal + taxAmount,
    billingAddress: raw.clientAddress,
    shippingAddress: raw.clientAddress,
    notes: raw.subject,
    subject: raw.subject,
    clientMobileNo: raw.clientMobileNo,
    validityDays: raw.validityDays,
    deliveryTime: raw.deliveryTime,
    salesPersonName: raw.salesPersonName,
    salesPersonCell: raw.salesPersonCell,
    gstinNo: raw.gstinNo
  }
}
