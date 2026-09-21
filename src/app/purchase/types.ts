export type PurchaseOrderStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Ordered"
  | "Partially Received"
  | "Delivered"
  | "Cancelled"

export type PurchasePaymentStatus =
  | "Pending"
  | "Partially Paid"
  | "Paid"
  | "Overdue"

export interface PurchaseOrderItem {
  orderItemId: number
  purchaseOrderId: number
  productId: number
  variantId?: number | null
  sku: string
  productName?: string
  variantName?: string
  quantity: number
  unitPrice: number
  discountPercentage: number
  discountAmount: number
  totalPrice: number
}

export interface PurchaseOrder {
  purchaseOrderId: number
  orderNumber: string
  orderDate: string
  expectedDeliveryDate: string | null
  vendorId: number
  vendorName?: string
  orderStatus: PurchaseOrderStatus | string
  paymentStatus: PurchasePaymentStatus | string
  billingAddress: string
  shippingAddress: string
  warehouseId?: number | null
  warehouseName?: string
  subtotal: number
  gstAmount: number
  totalAmount: number
  currencyType: string
  orderNotes: string
  termsAndConditions: string
  lineItems: PurchaseOrderItem[]
}

/** Used to pre-fill PurchaseOrderForm when creating a restock PO from inventory. */
export interface RestockLineItem {
  productId: number
  productName: string
  variantId: number | null
  variantName: string
  sku: string
  /** From variant.purchasePrice */
  unitPrice: number
  /** Suggested restock qty: max(1, reorderLevel - currentQuantity) */
  suggestedQty: number
  /** Current quantity on hand — for display in the restock banner */
  currentQty: number
  /** Reorder level threshold — for display in the restock banner */
  reorderLevel: number
}

export interface CreatePurchaseOrderPayload {
  purchaseOrderId: number
  orderNumber: string
  orderDate: string
  expectedDeliveryDate: string | null
  vendorId: number
  orderStatus: string
  paymentStatus: string
  billingAddress: string
  shippingAddress: string
  warehouseId?: number | null
  subtotal: number
  gstAmount: number
  totalAmount: number
  currencyType: string
  orderNotes: string
  termsAndConditions: string
  lineItems: {
    orderItemId: number
    purchaseOrderId: number
    productId: number
    variantId: number | null
    sku: string
    quantity: number
    unitPrice: number
    discountPercentage: number
    discountAmount: number
    totalPrice: number
  }[]
}

export interface PurchaseOrderGetAllParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  vendorId?: number | string
  orderStatus?: string
  paymentStatus?: string
}

export interface PurchaseOrderApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
  totalCount?: number | null
  error?: string | null
}

export function formatCurrency(amount: number | null | undefined, currency: string = "INR"): string {
  const val = Number(amount || 0)
  if (currency.toUpperCase() === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val)
  }
  if (currency.toUpperCase() === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(val)
  }
  if (currency.toUpperCase() === "EUR") {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(val)
  }
  return `${currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getOrderStatusBadgeVariant(status: string): {
  variant: "default" | "secondary" | "outline" | "destructive"
  className: string
} {
  const normalized = (status || "").toLowerCase().trim()
  switch (normalized) {
    case "draft":
      return {
        variant: "secondary",
        className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      }
    case "pending":
      return {
        variant: "secondary",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      }
    case "approved":
    case "ordered":
      return {
        variant: "secondary",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      }
    case "partially received":
      return {
        variant: "secondary",
        className: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      }
    case "delivered":
      return {
        variant: "secondary",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      }
    case "cancelled":
      return {
        variant: "destructive",
        className: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      }
    default:
      return {
        variant: "outline",
        className: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      }
  }
}

export function getPaymentStatusBadgeVariant(status: string): {
  className: string
} {
  const normalized = (status || "").toLowerCase().trim()
  switch (normalized) {
    case "paid":
      return {
        className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40",
      }
    case "partially paid":
      return {
        className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40",
      }
    case "pending":
      return {
        className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40",
      }
    case "overdue":
      return {
        className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40",
      }
    default:
      return {
        className: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      }
  }
}
