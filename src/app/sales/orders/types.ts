export type OrderStatus = "Pending" | "Approved" | "Packed" | "Dispatched" | "Delivered" | "Cancelled"
export type PaymentStatus = "Paid" | "Unpaid" | "Partial"

export interface OrderItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  total: number
  gstRate: number
}

export interface Order {
  id: string
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
}
