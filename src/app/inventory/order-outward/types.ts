export type OutwardStatus =
  | "Ready"
  | "Scanning"
  | "Partially Scanned"
  | "Completed"
  | "Exception"

export type ScanResultType = "success" | "warning" | "error"

export interface OutwardOrderItem {
  id: string
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
  barcode: string
  message: string
  type: ScanResultType
  timestamp: string
  productName?: string
}

export interface OutwardOrder {
  id: string
  orderNumber: string
  clientName: string
  warehouseName: string
  warehouseCode: string
  shippingAddress: string
  orderDate: string
  promisedDate: string
  status: OutwardStatus
  priority: "Normal" | "High" | "Urgent"
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
