import { OrderStatus, PaymentStatus, OrderItem } from "./orders/types"

export type SalesDocumentStatus = 
  | "Draft" 
  | "Issued" 
  | "Converted to Proforma" 
  | "Converted to Sales Order" 
  | "Cancelled"

export interface SalesDocumentItem extends OrderItem {
  gstRate: number
}

export interface SalesDocument {
  id: string
  number: string
  clientId: string
  clientName: string
  date: string
  validUntil?: string
  status: SalesDocumentStatus
  items: SalesDocumentItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  billingAddress: string
  shippingAddress: string
  notes?: string
  sourceId?: string // ID of the document it was converted from
}
