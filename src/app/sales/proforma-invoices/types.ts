import { SalesDocument, SalesDocumentItem } from "../types"

export interface ApiProformaItem {
  proformaItemId?: number
  proformaInvoiceItemId?: number
  proformaId?: number
  proformaInvoiceId?: number
  productId: number
  productName: string
  itemName?: string
  imageUrl?: string
  price?: number
  rate?: number
  gstPercentage?: number
  quantity: number
  discountPercentage?: number
  discountAmount?: number
  total?: number
}

export interface ApiProforma {
  proformaId?: number
  proformaInvoiceId?: number
  proformaNumber?: string
  piNo?: string
  proformaDate?: string
  piDate?: string
  clientId?: number
  clientName?: string
  billingName?: string
  clientAddress?: string
  billingAddress?: string
  clientMobileNo?: string
  subject?: string
  gstinNo?: string
  validityDays?: number
  deliveryTime?: string
  deliveryTerms?: string
  paymentTerms?: string
  salesPersonName: string
  salesPersonCell: string
  salesPersonId?: string
  sourceQuotationId?: string
  linkedQuotationId?: number
  freight?: number
  totalAmount?: number
  status?: string
  createdAt: string
  updatedAt: string | null
  items: ApiProformaItem[]
  paymentType?: string
  currencyType?: string
}

export interface ProformaInvoiceItem extends SalesDocumentItem {
  discountPercentage?: number
  discountAmount?: number
  discountedUnitPrice?: number
  imageUrl?: string
}

export interface ProformaInvoice extends Omit<SalesDocument, 'items'> {
  proformaId: number
  proformaNumber: string
  subject: string
  clientMobileNo: string
  validityDays: number
  deliveryTime: string
  deliveryTerms?: string
  paymentTerms?: string
  salesPersonName: string
  salesPersonCell: string
  salesPersonId?: string
  gstinNo?: string
  sourceQuotationId?: string
  freight?: number
  items: ProformaInvoiceItem[]
}

export function mapApiProforma(raw: ApiProforma): ProformaInvoice {
  const items = (raw.items || []).map(item => {
    const itemId = item.proformaInvoiceItemId ?? item.proformaItemId ?? 0
    const price = item.rate ?? item.price ?? 0
    const quantity = item.quantity || 0
    const discountPercentage = item.discountPercentage || 0
    const discountAmount = item.hasOwnProperty('discountAmount')
      ? (item.discountAmount || 0)
      : (price * discountPercentage / 100)

    const discountedPrice = price - discountAmount
    const itemSubtotal = discountedPrice * quantity
    const itemTax = itemSubtotal * (item.gstPercentage || 0) / 100
    const itemTotal = item.total ?? (itemSubtotal + itemTax)

    return {
      id: String(itemId),
      productId: String(item.productId || itemId),
      productName: item.productName || "",
      name: item.itemName || item.productName || "",
      sku: item.itemName || item.productName || "",
      quantity,
      unitPrice: price,
      discountPercentage,
      discountAmount,
      discountedUnitPrice: discountedPrice,
      gstRate: item.gstPercentage || 0,
      total: itemTotal,
      imageUrl: item.imageUrl || ""
    }
  })

  const isForeign = raw.paymentType === "Foreign"
  const subtotal = items.reduce((acc, item) => {
    const netItemTotal = (item as any).discountedUnitPrice * item.quantity
    const itemBase = isForeign ? netItemTotal : (netItemTotal / (1 + (item.gstRate || 0) / 100))
    return acc + itemBase
  }, 0)

  const calculatedTotalAmount = items.reduce((acc, item) => acc + ((item as any).discountedUnitPrice * item.quantity), 0)
  const taxAmount = isForeign ? 0 : (calculatedTotalAmount - subtotal)

  const dateValue = raw.piDate || raw.proformaDate || new Date().toISOString()
  const parsedDate = dateValue ? new Date(dateValue) : null
  const validity = raw.validityDays || 7
  const validUntil = parsedDate && !isNaN(parsedDate.getTime())
    ? new Date(parsedDate.getTime() + validity * 24 * 60 * 60 * 1000).toISOString()
    : undefined

  const idValue = raw.proformaInvoiceId ?? raw.proformaId ?? (raw as any).id
  const finalId = idValue ? String(idValue) : `temp-${Math.random().toString(36).substring(2, 9)}`

  const numberValue = raw.piNo || raw.proformaNumber || `PI-${idValue || "NEW"}`
  const clientNameValue = raw.billingName || raw.clientName || ""
  const addressValue = raw.billingAddress || raw.clientAddress || ""

  return {
    id: finalId,
    proformaId: Number(idValue) || 0,
    number: numberValue,
    proformaNumber: numberValue,
    clientId: raw.clientId ? String(raw.clientId) : "",
    clientName: clientNameValue,
    date: dateValue.split("T")[0],
    validUntil,
    status: (raw.status as any) || "Issued",
    items,
    subtotal,
    taxAmount,
    totalAmount: subtotal + taxAmount + (raw.freight || 0),
    billingAddress: addressValue,
    shippingAddress: addressValue,
    notes: raw.paymentTerms || raw.subject || "",
    subject: raw.subject || raw.paymentTerms || "Proforma Invoice",
    paymentTerms: raw.paymentTerms || raw.subject || "",
    deliveryTerms: raw.deliveryTerms || raw.deliveryTime || "",
    clientMobileNo: raw.clientMobileNo || "",
    validityDays: validity,
    deliveryTime: raw.deliveryTerms || raw.deliveryTime || "10-15 Working Days",
    salesPersonName: raw.salesPersonName || "",
    salesPersonCell: raw.salesPersonCell || "",
    salesPersonId: raw.salesPersonId ? String(raw.salesPersonId) : "",
    gstinNo: raw.gstinNo || "",
    sourceQuotationId: raw.sourceQuotationId
      || (raw.linkedQuotationId ? String(raw.linkedQuotationId) : undefined),
    freight: raw.freight ?? 0,
    paymentType: raw.paymentType || "Domestic",
    currencyType: raw.currencyType || "INR",
  }
}
