import { SalesDocument } from "../types"

export interface ApiProformaItem {
  proformaItemId: number
  proformaId: number
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

export interface ApiProforma {
  proformaId: number
  proformaNumber: string
  proformaDate: string
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
  sourceQuotationId?: string
  createdAt: string
  updatedAt: string | null
  items: ApiProformaItem[]
}

export interface ProformaInvoice extends SalesDocument {
  proformaId: number
  proformaNumber: string
  subject: string
  clientMobileNo: string
  validityDays: number
  deliveryTime: string
  salesPersonName: string
  salesPersonCell: string
  salesPersonId?: string
  gstinNo?: string
  sourceQuotationId?: string
}

export function mapApiProforma(raw: ApiProforma): ProformaInvoice {
  const items = raw.items.map(item => {
    const price = item.price || 0
    const quantity = item.quantity || 0
    const discountPercentage = item.discountPercentage || 0
    const discountAmount = item.hasOwnProperty('discountAmount')
      ? (item.discountAmount || 0)
      : (price * discountPercentage / 100)

    const discountedPrice = price - discountAmount
    const itemSubtotal = discountedPrice * quantity
    const itemTax = itemSubtotal * (item.gstPercentage || 0) / 100
    const itemTotal = itemSubtotal + itemTax

    return {
      id: String(item.proformaItemId),
      productId: String(item.productId || item.proformaItemId),
      productName: item.productName,
      name: item.itemName,
      sku: item.itemName,
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

  const subtotal = items.reduce((acc, item) => acc + ((item as any).discountedUnitPrice * item.quantity), 0)
  const taxAmount = items.reduce((acc, item) => acc + ((item as any).discountedUnitPrice * item.quantity * item.gstRate / 100), 0)

  const parsedDate = raw.proformaDate ? new Date(raw.proformaDate) : null
  const validUntil = parsedDate && !isNaN(parsedDate.getTime()) && raw.validityDays
    ? new Date(parsedDate.getTime() + raw.validityDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined

  const idValue = raw.proformaId || (raw as any).proformaInvoiceId || (raw as any).id
  const finalId = idValue ? String(idValue) : `temp-${Math.random().toString(36).substring(2, 9)}`

  return {
    id: finalId,
    proformaId: Number(idValue) || 0,
    number: raw.proformaNumber || `PI-${idValue || "NEW"}`,
    proformaNumber: raw.proformaNumber || `PI-${idValue || "NEW"}`,
    clientId: "",
    clientName: raw.clientName || "",
    date: raw.proformaDate || new Date().toISOString().split("T")[0],
    validUntil,
    status: "Issued",
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
    salesPersonId: raw.salesPersonId ? String(raw.salesPersonId) : "",
    gstinNo: raw.gstinNo,
    sourceQuotationId: raw.sourceQuotationId,
  }
}
