export type OrderStatus = "Pending" | "Approved" | "Packed" | "Dispatched" | "Delivered" | "Cancelled"
export type PaymentStatus = "Paid" | "Unpaid" | "Partial"

export interface OrderItem {
  id: string
  orderItemId?: number
  productId: string
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
  quotationId?: string | number
  proformaId?: string | number
}

export interface ApiSalesOrderItem {
  orderItemId: number
  orderId: number
  productId: number
  productName: string
  itemName: string
  imageUrl?: string
  price: number
  gstPercentage: number
  quantity: number
  discountPercentage?: number
  discountAmount?: number
}

export interface ApiSalesOrder {
  orderId: number
  orderNumber: string
  orderDate: string
  deliveryDate?: string
  clientName: string
  clientAddress: string
  clientMobileNo?: string
  gstinNo?: string
  salesPersonName?: string
  salesPersonCell?: string
  salesPersonId?: string
  status?: string
  paymentStatus?: string
  subtotal?: number
  taxAmount?: number
  totalAmount?: number
  notes?: string
  quotationId?: string | number
  proformaId?: string | number
  createdAt?: string
  updatedAt?: string | null
  items: ApiSalesOrderItem[]
}

export function mapApiSalesOrder(raw: any): Order {
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

  const subtotal = items.reduce((acc: number, item: OrderItem) => {
    const discountedPrice = item.unitPrice - (item.discountAmount || 0)
    return acc + (discountedPrice * item.quantity)
  }, 0)
  
  const taxAmount = items.reduce((acc: number, item: OrderItem) => {
    const discountedPrice = item.unitPrice - (item.discountAmount || 0)
    return acc + (discountedPrice * item.quantity * item.gstRate / 100)
  }, 0)

  return {
    id: String(raw.orderId || raw.id),
    orderId: raw.orderId,
    orderNumber: raw.orderNumber || raw.number || "",
    clientId: String(raw.clientId || ""),
    clientName: raw.clientName || (raw.billingAddress ? raw.billingAddress.split(",")[0] : "Client #" + raw.clientId),
    salesPersonId: raw.salesPersonId ? String(raw.salesPersonId) : undefined,
    date: (raw.orderDate || raw.date || new Date().toISOString()).split("T")[0],
    deliveryDate: (raw.targetDeliveryDate || raw.deliveryDate) ? (raw.targetDeliveryDate || raw.deliveryDate).split("T")[0] : undefined,
    status: (raw.orderStatus || raw.status || "Pending") as OrderStatus,
    paymentStatus: (raw.paymentStatus || "Unpaid") as PaymentStatus,
    items,
    subtotal: raw.subtotal || subtotal,
    taxAmount: raw.gstAmount || raw.taxAmount || taxAmount,
    totalAmount: raw.totalAmount || (subtotal + taxAmount),
    billingAddress: raw.billingAddress || raw.clientAddress || "",
    shippingAddress: raw.shippingAddress || raw.clientAddress || "",
    notes: raw.orderNotes || raw.notes || raw.subject || "",
    quotationId: raw.linkedQuotationId || raw.quotationId,
    proformaId: raw.linkedProformaInvoiceId || raw.proformaId,
  }
}
