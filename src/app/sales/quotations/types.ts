import { SalesDocument, SalesDocumentItem } from "../types"

export interface ApiQuotationItem {
  quotationItemId: number
  quotationId: number
  productId: number
  variantId?: number
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
  salesPersonId?: number | string
  salesPersonName: string
  salesPersonCell: string
  status?: string
  createdAt: string
  updatedAt: string | null
  totalAmount?: number
  paymentType?: string
  currencyType?: string
  doctorSpeciality?: string[] | string
  items: ApiQuotationItem[]
}

export interface Quotation extends SalesDocument {
  quotationId: number
  quotationNumber: string
  quotationDate?: string
  subject: string
  clientAddress?: string
  clientMobileNo: string
  validityDays: number
  deliveryTime: string
  salesPersonName: string
  salesPersonCell: string
  salesPersonId?: string
  gstinNo?: string
  createdAt?: string
  updatedAt?: string | null
  totalAmount: number
  paymentType?: string
  currencyType?: string
  doctorSpeciality?: string
}

export function mapApiQuotation(raw: ApiQuotation): Quotation {
  const isForeign = (raw as any).paymentType === "Foreign"

  // Calculate totals: minus GST from price -> apply discount -> apply GST on discounted amount
  const items = raw.items.map(item => {
    const price = item.price || 0
    const quantity = item.quantity || 0
    const gstRate = isForeign ? 0 : (item.gstPercentage || 0)
    const discountPercentage = item.discountPercentage || 0

    // 1. Minus GST from price to get base price
    const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price

    // 2. Discount on base price
    const discountAmount = item.hasOwnProperty('discountAmount') && item.discountAmount !== undefined && item.discountAmount !== null
      ? (item.discountAmount || 0)
      : parseFloat((basePrice * (discountPercentage / 100)).toFixed(2))

    // 3. Discounted base price
    const discountedBase = Math.max(0, basePrice - discountAmount)

    // 4. Apply GST % on discounted base amount to get final total
    const finalUnitPrice = gstRate > 0 ? discountedBase * (1 + gstRate / 100) : discountedBase
    const itemTotal = parseFloat((finalUnitPrice * quantity).toFixed(2))

    return {
      id: String(item.quotationItemId),
      quotationItemId: item.quotationItemId,
      productId: String(item.productId || item.quotationItemId),
      variantId: (item as any).variantId || 0,
      productName: item.productName,
      name: item.itemName,
      sku: item.itemName,
      quantity,
      unitPrice: price,
      discountPercentage,
      discountAmount,
      discountedUnitPrice: finalUnitPrice,
      gstRate: item.gstPercentage,
      total: itemTotal,
      imageUrl: item.imageUrl
    }
  })

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

  const totalAmount = subtotal + taxAmount

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
    totalAmount,
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
    gstinNo: raw.gstinNo,
    paymentType: (raw as any).paymentType || "Domestic",
    currencyType: (raw as any).currencyType || "INR",
    doctorSpeciality: Array.isArray((raw as any).doctorSpeciality)
      ? (raw as any).doctorSpeciality.join(", ")
      : ((raw as any).doctorSpeciality || ""),
  }
}
