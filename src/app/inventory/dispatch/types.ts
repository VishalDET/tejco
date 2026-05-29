export type DispatchStatus =
  | "Ready"
  | "Dispatched"
  | "In Transit"
  | "Delivered"
  | "Exception"

export type FreightPaymentMode = "Paid" | "To Pay" | "Included"

export interface DispatchItem {
  id: string
  productName: string
  sku: string
  quantity: number
}

export interface DispatchTimelineEvent {
  id: string
  label: string
  description: string
  timestamp: string
  status: "complete" | "current" | "pending" | "exception"
}

export interface OrderDispatch {
  id: string
  orderId: string
  orderNumber: string
  clientName: string
  warehouseName: string
  warehouseCode: string
  shippingAddress: string
  packedAt?: string
  partnerName: string
  partnerService?: string
  trackingNumber: string
  trackingLink?: string
  dispatchDate: string
  expectedDeliveryDate?: string
  packageCount: number
  grossWeightKg?: number
  freightCharges?: number
  freightPaymentMode: FreightPaymentMode
  vehicleNumber?: string
  driverName?: string
  driverPhone?: string
  challanNumber?: string
  invoiceNumber?: string
  ewayBillNumber?: string
  shippingLabelRef?: string
  status: DispatchStatus
  remarks?: string
  items: DispatchItem[]
  timeline: DispatchTimelineEvent[]
}

export const deliveryPartners = [
  "Blue Dart",
  "Delhivery",
  "DTDC",
  "India Post",
  "Porter",
  "Local Courier",
  "Hand Delivery",
  "Other",
]

export function getDispatchReadiness(dispatch: OrderDispatch) {
  const hasPartner = dispatch.partnerName.trim().length > 0
  const hasTracking = dispatch.trackingNumber.trim().length > 0
  const hasDate = dispatch.dispatchDate.trim().length > 0
  const complete = [hasPartner, hasTracking, hasDate].filter(Boolean).length

  return {
    complete,
    total: 3,
    percent: Math.round((complete / 3) * 100),
    isReady: complete === 3,
  }
}
