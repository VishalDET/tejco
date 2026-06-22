export type DispatchStatus =
  | "Created"
  | "Packed"
  | "ReadyForDispatch"
  | "Dispatched"
  | "InTransit"
  | "OutForDelivery"
  | "Delivered"
  | "Returned"
  | "Cancelled"
  | "Ready"
  | "In Transit"
  | "Exception"

export type FreightPaymentMode = "Paid" | "To Pay" | "Included" | string

export interface DispatchItem {
  id: string
  dispatchItemId?: number
  productName: string
  sku: string
  quantity: number
}

export interface DispatchTimelineEvent {
  id: string
  timelineId?: number
  label: string
  description: string
  timestamp: string
  status: "complete" | "current" | "pending" | "exception" | string
}

export interface OrderDispatch {
  id: string
  dispatchId?: number
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

// ---------------------------------------------------------------------------
// Mapping functions to translate Api models to UI models
// ---------------------------------------------------------------------------

import type { ApiDispatch, ApiDispatchItem, ApiDispatchTimelineEvent } from "@/lib/api"

export function mapApiDispatchItem(raw: ApiDispatchItem): DispatchItem {
  return {
    id: String(raw.dispatchItemId || `di-${Math.random()}`),
    dispatchItemId: raw.dispatchItemId,
    productName: raw.productName || "Unknown Product",
    sku: raw.sku || "",
    quantity: raw.quantity || 0,
  }
}

export function mapApiDispatchTimelineEvent(raw: ApiDispatchTimelineEvent): DispatchTimelineEvent {
  let status = "pending"
  if (raw.status === "Delivered") {
    status = "complete"
  } else if (raw.status === "Created" || raw.status === "Packed" || raw.status === "Dispatched" || raw.status === "InTransit") {
    status = "current"
  } else if (raw.status === "Cancelled" || raw.status === "Returned") {
    status = "exception"
  }

  return {
    id: String(raw.timelineId || `timeline-${Math.random()}`),
    timelineId: raw.timelineId,
    label: raw.label || "Timeline Event",
    description: raw.description || "",
    timestamp: raw.timestamp || new Date().toISOString(),
    status,
  }
}

export function mapApiDispatch(rawInput: ApiDispatch | any): OrderDispatch {
  const raw = (rawInput?.success && rawInput?.data) ? rawInput.data : rawInput;

  let status: DispatchStatus = "Ready"
  if (raw.status) {
    if (raw.status === "Created" || raw.status === "Packed") {
      status = "Ready"
    } else if (raw.status === "Dispatched" || raw.status === "ReadyForDispatch") {
      status = "Dispatched"
    } else if (raw.status === "InTransit" || raw.status === "OutForDelivery") {
      status = "In Transit"
    } else if (raw.status === "Delivered") {
      status = "Delivered"
    } else if (raw.status === "Cancelled" || raw.status === "Returned") {
      status = "Exception"
    } else {
      status = raw.status as DispatchStatus
    }
  }

  return {
    id: String(raw.dispatchId),
    dispatchId: raw.dispatchId,
    orderId: String(raw.orderId),
    orderNumber: raw.orderNumber || `SO-${raw.orderId}`,
    clientName: raw.clientName || "Unknown Client",
    warehouseName: raw.warehouseName || "Default Warehouse",
    warehouseCode: raw.warehouseCode || "WH",
    shippingAddress: raw.shippingAddress || "",
    packedAt: raw.packedAt,
    partnerName: raw.partnerName || "",
    partnerService: raw.partnerService || "",
    trackingNumber: raw.trackingNumber || "",
    trackingLink: raw.trackingLink || "",
    dispatchDate: raw.dispatchDate || "",
    expectedDeliveryDate: raw.expectedDeliveryDate || "",
    packageCount: raw.packageCount || 0,
    grossWeightKg: raw.grossWeightKg || 0,
    freightCharges: raw.freightCharges || 0,
    freightPaymentMode: raw.freightPaymentMode || "Paid",
    vehicleNumber: raw.vehicleNumber || "",
    driverName: raw.driverName || "",
    driverPhone: raw.driverPhone || "",
    challanNumber: raw.challanNumber || "",
    invoiceNumber: raw.invoiceNumber || "",
    ewayBillNumber: raw.ewayBillNumber || "",
    shippingLabelRef: raw.shippingLabelRef || "",
    status,
    remarks: raw.remarks || "",
    items: Array.isArray(raw.items) ? raw.items.map(mapApiDispatchItem) : [],
    timeline: Array.isArray(raw.timeline) ? raw.timeline.map(mapApiDispatchTimelineEvent) : [],
  }
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

export function mapOrderDispatchToApi(ui: OrderDispatch): ApiDispatch {
  return {
    dispatchId: ui.dispatchId || parseInt(ui.id) || 0,
    orderId: parseInt(ui.orderId) || 0,
    orderNumber: ui.orderNumber,
    clientName: ui.clientName,
    warehouseName: ui.warehouseName,
    warehouseCode: ui.warehouseCode,
    shippingAddress: ui.shippingAddress,
    packedAt: ui.packedAt,
    partnerName: ui.partnerName,
    partnerService: ui.partnerService || "",
    trackingNumber: ui.trackingNumber,
    trackingLink: ui.trackingLink || "",
    dispatchDate: ui.dispatchDate,
    expectedDeliveryDate: ui.expectedDeliveryDate,
    packageCount: ui.packageCount,
    grossWeightKg: ui.grossWeightKg,
    freightCharges: ui.freightCharges,
    freightPaymentMode: ui.freightPaymentMode,
    vehicleNumber: ui.vehicleNumber,
    driverName: ui.driverName,
    driverPhone: ui.driverPhone,
    challanNumber: ui.challanNumber,
    invoiceNumber: ui.invoiceNumber,
    ewayBillNumber: ui.ewayBillNumber,
    shippingLabelRef: ui.shippingLabelRef,
    status: ui.status,
    remarks: ui.remarks,
    items: ui.items.map(item => ({
      dispatchItemId: item.dispatchItemId || parseInt(item.id) || 0,
      dispatchId: ui.dispatchId || parseInt(ui.id) || 0,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity
    })),
    timeline: ui.timeline.map(event => ({
      timelineId: event.timelineId || parseInt(event.id) || 0,
      dispatchId: ui.dispatchId || parseInt(ui.id) || 0,
      label: event.label,
      description: event.description,
      timestamp: event.timestamp,
      status: event.status === "complete" ? "Delivered" : event.status === "exception" ? "Cancelled" : "InTransit"
    }))
  }
}

