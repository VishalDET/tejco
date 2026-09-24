export type OrderStatus = "Pending" | "Approved" | "Packed" | "Dispatched" | "Delivered" | "Cancelled"
export type PaymentStatus = "Paid" | "Unpaid" | "Partial"

export interface OrderItem {
  id: string
  orderItemId?: number
  productId: string
  variantId?: number
  productName: string
  name?: string
  sku: string
  quantity: number
  unitPrice: number
  discountPercentage?: number
  discountAmount?: number
  total: number
  gstRate: number
  imageUrl?: string
}

export interface Order {
  id: string
  orderId?: number
  orderNumber: string
  clientId: string
  clientName: string
  salesPersonId?: string
  date: string
  deliveryDate?: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  items: OrderItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  billingAddress: string
  shippingAddress: string
  notes?: string
  doctorSpeciality?: string
  clientGSTIN?: string
  quotationId?: string | number
  proformaId?: string | number
  paymentType?: string
  currencyType?: string
}

export interface ApiSalesOrderItem {
  orderItemId: number
  orderId: number
  productId: number
  variantId?: number
  productName?: string
  itemName?: string
  sku: string
  imageUrl?: string
  price?: number
  unitPrice?: number
  gstPercentage?: number
  quantity: number
  discountPercentage?: number
  discountAmount?: number
  totalPrice?: number
  total?: number
}

export interface ApiSalesOrder {
  orderId: number
  orderNumber: string
  orderDate: string
  targetDeliveryDate?: string
  deliveryDate?: string
  clientId?: number
  clientName?: string
  billingAddress?: string
  shippingAddress?: string
  clientAddress?: string
  clientMobileNo?: string
  gstinNo?: string
  clientGSTIN?: string
  doctorSpeciality?: string
  salesPersonId?: number | string
  salesPersonName?: string
  salesPersonCell?: string
  orderStatus?: string
  status?: string
  paymentStatus?: string
  subtotal?: number
  gstAmount?: number
  taxAmount?: number
  totalAmount?: number
  orderNotes?: string
  notes?: string
  linkedQuotationId?: number
  linkedProformaInvoiceId?: number
  quotationId?: string | number
  proformaId?: string | number
  parentOrderId?: number
  paymentType?: string
  currencyType?: string
  createdAt?: string
  updatedAt?: string | null
  lineItems?: ApiSalesOrderItem[]
  items?: ApiSalesOrderItem[]
}

export const salesOrderClientCache = new Map<string, any>()

export function mapApiSalesOrder(raw: any, clientMap?: Map<string, any>): Order {
  const rawItems = raw.lineItems || raw.items || []
  const items = rawItems.map((item: any) => {
    const price = item.price || item.unitPrice || 0
    const quantity = item.quantity || 0
    const discountPercentage = item.discountPercentage || 0
    const discountAmount = item.hasOwnProperty('discountAmount')
      ? (item.discountAmount || 0)
      : (price * discountPercentage / 100)
      
    const discountedPrice = price - discountAmount
    const itemSubtotal = discountedPrice * quantity
    const itemTax = itemSubtotal * (item.gstPercentage || item.gstRate || 0) / 100
    const itemTotal = item.total || item.totalPrice || (itemSubtotal + itemTax)

    return {
      id: String(item.orderItemId || item.id || Math.random().toString(36).substring(2, 9)),
      orderItemId: item.orderItemId,
      productId: String(item.productId),
      variantId: item.variantId || 0,
      productName: item.productName || item.sku || "",
      name: item.itemName || item.name || item.sku || "",
      sku: item.sku || item.itemName || item.name || "",
      quantity,
      unitPrice: price,
      discountPercentage,
      discountAmount,
      total: itemTotal,
      gstRate: item.gstPercentage || item.gstRate || 18,
      imageUrl: item.imageUrl || ""
    }
  })

  const isForeign = raw.paymentType === "Foreign"

  // Use API-provided subtotal/gst/total if available (no line items returned from GetAll)
  const apiSubtotal = raw.subtotal ?? 0
  const apiGst = raw.gstAmount ?? raw.taxAmount ?? 0
  const apiTotal = raw.totalAmount ?? 0

  // Recalculate from items only if items are present
  let subtotal = apiSubtotal
  let taxAmount = apiGst
  let totalAmount = apiTotal

  if (items.length > 0) {
    const calcTotal = items.reduce((acc: number, item: OrderItem) => {
      return acc + ((item.unitPrice - (item.discountAmount || 0)) * item.quantity)
    }, 0)
    const calcSubtotal = items.reduce((acc: number, item: OrderItem) => {
      const netItemTotal = (item.unitPrice - (item.discountAmount || 0)) * item.quantity
      const itemBase = isForeign ? netItemTotal : (netItemTotal / (1 + (item.gstRate || 0) / 100))
      return acc + itemBase
    }, 0)
    subtotal = calcSubtotal
    taxAmount = isForeign ? 0 : (calcTotal - calcSubtotal)
    totalAmount = calcTotal
  }

  const cId = String(raw.clientId || "")
  const cachedClient = (cId && cId !== "0") ? (clientMap?.get(cId) || salesOrderClientCache.get(cId)) : null

  // 1. Direct client name fields on the raw object
  let clientName = raw.clientName || raw.customerName || raw.billingName || raw.client?.name || raw.client?.clientName

  // 2. Client name from cache / master
  if (!clientName && cachedClient?.name) {
    clientName = cachedClient.name
  }

  // 3. Fallback: only if billing address has a doctor/person title, extract it
  if (!clientName && raw.billingAddress) {
    const firstPart = String(raw.billingAddress).split("|")[0].split(",")[0].trim()
    if (/^(Dr\.|Dr |Mr\.|Mrs\.|Ms\.|M\/s|Prof\.)/i.test(firstPart)) {
      clientName = firstPart
    }
  }

  // 4. Default fallback
  if (!clientName) {
    clientName = (cId && cId !== "0") ? `Client #${cId}` : "—"
  }

  const doctorSpeciality = raw.doctorSpeciality || cachedClient?.doctorSpeciality || ""
  const clientGSTIN = raw.clientGSTIN || raw.gstinNo || cachedClient?.gstin || ""

  return {
    id: String(raw.orderId || raw.id),
    orderId: raw.orderId,
    orderNumber: raw.orderNumber || raw.number || "",
    clientId: cId,
    clientName,
    salesPersonId: raw.salesPersonId ? String(raw.salesPersonId) : undefined,
    date: (raw.orderDate || raw.date || new Date().toISOString()).split("T")[0],
    deliveryDate: (raw.targetDeliveryDate || raw.deliveryDate)
      ? (raw.targetDeliveryDate || raw.deliveryDate).split("T")[0]
      : undefined,
    status: (raw.orderStatus || raw.status || "Pending") as OrderStatus,
    paymentStatus: (raw.paymentStatus || "Unpaid") as PaymentStatus,
    items,
    subtotal,
    taxAmount,
    totalAmount,
    billingAddress: raw.billingAddress || raw.clientAddress || "",
    shippingAddress: raw.shippingAddress || raw.clientAddress || "",
    notes: raw.orderNotes || raw.notes || raw.subject || "",
    doctorSpeciality,
    clientGSTIN,
    quotationId: raw.linkedQuotationId || raw.quotationId || undefined,
    proformaId: raw.linkedProformaInvoiceId || raw.proformaId || undefined,
    paymentType: raw.paymentType || "Domestic",
    currencyType: raw.currencyType || "INR",
  }
}
