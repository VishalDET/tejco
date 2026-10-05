export interface CreditNoteItem {
  creditNoteItemId?: number
  creditNoteId?: number
  productId: number
  productName?: string
  variantId?: number
  variantName?: string
  sku?: string
  quantity: number
  unitPrice: number
  totalPrice?: number
  returnReason: string
}

export interface CreditNote {
  creditNoteId: number
  creditNoteNumber: string
  orderId: number
  orderNumber?: string | null
  clientId: number
  clientName?: string | null
  totalCreditAmount: number
  status: "Pending" | "Approved" | "Processed" | "Rejected" | string
  createdBy?: number
  createdAt?: string
  updatedAt?: string
  items?: CreditNoteItem[]
  selectedProducts?: CreditNoteItem[]
}

export interface CreateCreditNotePayload {
  orderId: number
  clientId: number
  createdBy: number
  selectedProducts: {
    productId: number
    variantId: number
    quantity: number
    unitPrice: number
    returnReason: string
  }[]
}

export interface UpdateCreditNotePayload {
  creditNoteId?: number
  orderId: number
  clientId: number
  status?: string
  selectedProducts: {
    productId: number
    variantId: number
    quantity: number
    unitPrice: number
    returnReason: string
  }[]
}
