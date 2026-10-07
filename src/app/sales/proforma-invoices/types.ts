import { SalesDocument, SalesDocumentItem } from "../types"

export interface ApiProformaItem {
  proformaInvoiceItemId?: number
  proformaItemId?: number
  proformaInvoiceId?: number
  proformaId?: number
  productId: number
  variantId?: number
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
  proformaInvoiceId?: number
  proformaId?: number
  piNo?: string
  proformaNumber?: string
  piDate?: string
  proformaDate?: string
  clientId?: number
  billingName?: string
  clientName?: string
  billingAddress?: string
  clientAddress?: string
  clientMobileNo?: string
  subject?: string
  gstinNo?: string
  clientGSTIN?: string
  doctorSpeciality?: string
  validityDays?: number
  deliveryTime?: string
  deliveryTerms?: string
  paymentTerms?: string
  salesPersonName: string
  salesPersonCell: string
  salesPersonId?: number | string
  sourceQuotationId?: string
  linkedQuotationId?: number
  freight?: number
  totalAmount?: number
  status?: string
  createdAt?: string
  updatedAt?: string | null
  items: ApiProformaItem[]
  paymentType?: string
  currencyType?: string
}

export interface ProformaInvoiceItem extends SalesDocumentItem {
  variantId?: number
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
  clientGSTIN?: string
  doctorSpeciality?: string
  sourceQuotationId?: string
  freight?: number
  items: ProformaInvoiceItem[]
}

export function mapApiProforma(raw: ApiProforma): ProformaInvoice {
  const items = (raw.items || []).map(item => {
    const itemId = item.proformaInvoiceItemId ?? item.proformaItemId ?? 0
    const price = item.rate ?? item.price ?? 0
    const quantity = item.quantity || 0
    const isForeign = raw.paymentType === "Foreign"
    const gstRate = isForeign ? 0 : (item.gstPercentage || 0)
    const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price

    const discountPercentage = item.discountPercentage || 0
    let discountAmount = 0

    if (item.hasOwnProperty('discountAmount') && item.discountAmount !== undefined && item.discountAmount !== null) {
      discountAmount = item.discountAmount
    } else if (discountPercentage > 0) {
      discountAmount = parseFloat((basePrice * discountPercentage / 100).toFixed(2))
    }

    const discountedBase = Math.max(0, basePrice - discountAmount)
    const finalUnitPrice = gstRate > 0 ? discountedBase * (1 + gstRate / 100) : discountedBase
    const itemTotal = parseFloat((finalUnitPrice * quantity).toFixed(2))

    return {
      id: String(itemId),
      productId: String(item.productId || itemId),
      variantId: item.variantId || 0,
      productName: item.productName || "",
      name: item.itemName || item.productName || "",
      sku: item.itemName || item.productName || "",
      quantity,
      unitPrice: price,
      discountPercentage,
      discountAmount,
      discountedUnitPrice: finalUnitPrice,
      gstRate: item.gstPercentage || 0,
      total: itemTotal,
      imageUrl: item.imageUrl || ""
    }
  })

  const isForeign = raw.paymentType === "Foreign"
  const subtotal = items.reduce((acc, item) => {
    const price = item.unitPrice || 0
    const gstRate = isForeign ? 0 : (item.gstRate || 0)
    const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price
    const discAmt = (item as any).discountAmount || 0
    const discountedBase = Math.max(0, basePrice - discAmt)
    return acc + (discountedBase * item.quantity)
  }, 0)

  const taxAmount = isForeign ? 0 : items.reduce((acc, item) => {
    const price = item.unitPrice || 0
    const gstRate = item.gstRate || 0
    const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price
    const discAmt = (item as any).discountAmount || 0
    const discountedBase = Math.max(0, basePrice - discAmt)
    return acc + (discountedBase * (gstRate / 100) * item.quantity)
  }, 0)

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

  const rawClientId =
    raw.clientId ??
    (raw as any).client_id ??
    (raw as any).clientMasterId ??
    (raw as any).customerId ??
    (raw as any).customerMasterId ??
    (raw as any).client?.id ??
    (raw as any).client?.clientId
  const resolvedClientId =
    rawClientId !== undefined && rawClientId !== null && String(rawClientId).trim() !== "" && String(rawClientId).trim() !== "0"
      ? String(rawClientId)
      : ""

  return {
    id: finalId,
    proformaId: Number(idValue) || 0,
    number: numberValue,
    proformaNumber: numberValue,
    clientId: resolvedClientId,
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
    gstinNo: raw.clientGSTIN || raw.gstinNo || "",
    clientGSTIN: raw.clientGSTIN || raw.gstinNo || "",
    doctorSpeciality: (raw as any).doctorSpeciality || "",
    sourceQuotationId: raw.sourceQuotationId
      || (raw.linkedQuotationId ? String(raw.linkedQuotationId) : undefined),
    freight: raw.freight ?? 0,
    paymentType: raw.paymentType || "Domestic",
    currencyType: raw.currencyType || "INR",
  }
}
