export type OutwardStatus =
  | "Pending"
  | "Picking"
  | "Picked"
  | "Packed"
  | "ReadyForDispatch"
  | "Dispatched"
  | "Delivered"
  | "Cancelled"
  | "Ready"
  | "Scanning"
  | "Partially Scanned"
  | "Completed"
  | "Exception"

export type ScanResultType = "success" | "warning" | "error"

export interface OutwardOrderItem {
  id: string
  outwardOrderItemId?: number
  productId: string
  productName: string
  variantName?: string
  sku: string
  barcode: string
  orderedQty: number
  scannedQty: number
  locationCode: string
}

export interface OutwardScanEvent {
  id: string
  scanId?: number
  barcode: string
  message: string
  type: ScanResultType
  scanType?: string
  timestamp: string
  productName?: string
}

export interface OutwardOrder {
  id: string
  outwardOrderId?: number
  orderId?: number
  orderNumber: string
  clientName: string
  warehouseName: string
  warehouseCode: string
  shippingAddress: string
  orderDate: string
  promisedDate: string
  status: OutwardStatus
  priority: "Normal" | "High" | "Urgent" | string
  pickerName?: string
  items: OutwardOrderItem[]
  scanHistory: OutwardScanEvent[]
}

export function getOutwardProgress(order: OutwardOrder) {
  const totalQty = order.items.reduce((sum, item) => sum + item.orderedQty, 0)
  const scannedQty = order.items.reduce((sum, item) => sum + item.scannedQty, 0)
  const percent = totalQty === 0 ? 0 : Math.round((scannedQty / totalQty) * 100)

  return {
    totalQty,
    scannedQty,
    pendingQty: Math.max(totalQty - scannedQty, 0),
    percent,
    isComplete: totalQty > 0 && scannedQty >= totalQty,
  }
}

export function getItemScanStatus(item: OutwardOrderItem) {
  if (item.scannedQty === 0) return "Pending"
  if (item.scannedQty >= item.orderedQty) return "Complete"
  return "Partial"
}

// ---------------------------------------------------------------------------
// Mapping functions to translate Api models to UI models
// ---------------------------------------------------------------------------

import type { ApiOutwardOrder, ApiOutwardOrderItem, ApiOutwardScanEvent } from "@/lib/api"

export function mapApiOutwardOrderItem(raw: ApiOutwardOrderItem): OutwardOrderItem {
  return {
    id: String(raw.outwardOrderItemId || `item-${Math.random()}`),
    outwardOrderItemId: raw.outwardOrderItemId,
    productId: String(raw.productId),
    productName: raw.productName || "Unknown Product",
    variantName: raw.variantName || "",
    sku: raw.sku || "",
    barcode: raw.barcode || "",
    orderedQty: raw.orderedQty || 0,
    scannedQty: raw.scannedQty || 0,
    locationCode: raw.locationCode || "N/A"
  }
}

export function mapApiOutwardScanEvent(raw: ApiOutwardScanEvent): OutwardScanEvent {
  // Map backend scanType or status to UI ScanResultType
  let type: ScanResultType = "success"
  if (raw.scanType?.toLowerCase() === "error") {
    type = "error"
  } else if (raw.scanType?.toLowerCase() === "warning") {
    type = "warning"
  }

  return {
    id: String(raw.scanId || `scan-${Math.random()}`),
    scanId: raw.scanId,
    barcode: raw.barcode || "",
    message: raw.message || "Scanned",
    type,
    scanType: raw.scanType || "Pick",
    timestamp: raw.scannedAt || new Date().toISOString(),
    productName: raw.productName
  }
}

export function mapApiOutwardOrder(rawInput: ApiOutwardOrder | any): OutwardOrder {
  const raw = (rawInput?.success && rawInput?.data) ? rawInput.data : rawInput;

  // Translate backend status to match UI status expectation
  let status: OutwardStatus = "Ready"
  if (raw.status) {
    if (raw.status === "Pending" || raw.status === "Ready") {
      status = "Ready"
    } else if (raw.status === "Picking" || raw.status === "Scanning") {
      status = "Scanning"
    } else if (raw.status === "Partially Scanned" || raw.status === "Picked") {
      status = "Partially Scanned"
    } else if (raw.status === "Completed" || raw.status === "Packed" || raw.status === "Dispatched") {
      status = "Completed"
    } else if (raw.status === "Exception") {
      status = "Exception"
    } else {
      status = raw.status as OutwardStatus
    }
  }

  // Generate a warehouseCode
  const nameParts = (raw.warehouseName || "WH").split(" ")
  const warehouseCode = nameParts.length >= 2 
    ? `${nameParts[0].substring(0,3).toUpperCase()}-${nameParts[1].substring(0,2).toUpperCase()}`
    : nameParts[0].substring(0,6).toUpperCase()

  return {
    id: String(raw.outwardOrderId),
    outwardOrderId: raw.outwardOrderId,
    orderId: raw.orderId,
    orderNumber: raw.orderNumber || `SO-${raw.orderId}`,
    clientName: raw.clientName || "Unknown Client",
    warehouseName: raw.warehouseName || "Default Warehouse",
    warehouseCode,
    shippingAddress: raw.shippingAddress || "",
    orderDate: raw.orderDate || new Date().toISOString(),
    promisedDate: raw.promisedDate || new Date().toISOString(),
    status,
    priority: (raw.priority === "High" || raw.priority === "Urgent") ? raw.priority : "Normal",
    pickerName: raw.pickerName,
    items: Array.isArray(raw.items) ? raw.items.map(mapApiOutwardOrderItem) : [],
    scanHistory: Array.isArray(raw.scanHistory) ? raw.scanHistory.map(mapApiOutwardScanEvent) : []
  }
}

