import { SalesDocument, SalesDocumentItem } from "../types"

export interface ApiQuotationItem {
  quotationItemId: number
  quotationId: number
  productId: number
  productName: string
  itemName: string
  imageUrl: string
  price: number
  gstPercentage: number
  quantity: number
  discountPercentage?: number
  discountAmount?: number
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
  salesPersonId?: string
  status?: string
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
  salesPersonId?: string
  gstinNo?: string
}

export function mapApiQuotation(raw: ApiQuotation): Quotation {
  // Calculate totals incorporating discounts
  const items = raw.items.map(item => {
    const price = item.price || 0
    const quantity = item.quantity || 0
    const discountPercentage = item.discountPercentage || 0
    // If discountAmount is provided use it, otherwise calculate it
    const discountAmount = item.hasOwnProperty('discountAmount') 
      ? (item.discountAmount || 0) 
      : (price * discountPercentage / 100)
    
    const discountedPrice = price - discountAmount
    const itemSubtotal = discountedPrice * quantity
    const itemTax = itemSubtotal * (item.gstPercentage || 0) / 100
    const itemTotal = itemSubtotal + itemTax

    return {
      id: String(item.quotationItemId),
      productId: String(item.productId || item.quotationItemId),
      productName: item.productName,
      name: item.itemName,
      sku: item.itemName, // The API doesn't seem to have a separate SKU field, using itemName as fallback
      quantity,
      unitPrice: price,
      discountPercentage,
      discountAmount,
      discountedUnitPrice: discountedPrice,
      gstRate: item.gstPercentage,
      total: itemTotal,
      imageUrl: item.imageUrl
    }
  })

  const subtotal = items.reduce((acc, item) => acc + (item.discountedUnitPrice * item.quantity), 0)
  const taxAmount = items.reduce((acc, item) => acc + (item.discountedUnitPrice * item.quantity * item.gstRate / 100), 0)

  return {
    id: String(raw.quotationId),
    quotationId: raw.quotationId,
    number: raw.quotationNumber,
    quotationNumber: raw.quotationNumber,
    clientId: "", // Not provided in the list API directly, but we have clientName
    clientName: raw.clientName,
    date: raw.quotationDate,
    validUntil: new Date(new Date(raw.quotationDate).getTime() + raw.validityDays * 24 * 60 * 60 * 1000).toISOString(),
    status: (raw.status as any) || "Issued", // Default status from API response message "Quotations retrieved successfully."
    items,
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
    salesPersonId: (raw as any).salesPersonId ? String((raw as any).salesPersonId) : "",
    gstinNo: raw.gstinNo
  }
}
