export interface InwardOrderItem {
  inwardOrderItemId?: number
  inwardOrderId?: number
  productId: number
  variantId?: number
  productName?: string
  variantName?: string
  sku?: string
  barcode?: string
  expectedQty: number
  receivedQty: number
  locationCode?: string
  // UI fallback props
  expectedQuantity?: number
  receivedQuantity?: number
  unitPrice?: number
}

export interface ScanHistoryItem {
  scanId?: number
  inwardOrderId?: number
  barcode?: string
  message?: string
  scanType?: string
  productName?: string
  scannedAt?: string
}

export interface InwardOrder {
  inwardOrderId?: number
  id?: number
  orderNumber?: string
  inwardNumber?: string
  vendorId: number
  vendorName?: string
  warehouseId: number
  warehouseName?: string
  warehouseCode?: string
  orderDate?: string
  inwardDate?: string
  status?: string
  priority?: string
  receiverName?: string
  referenceNumber?: string
  notes?: string
  totalAmount?: number
  createdAt?: string
  updatedAt?: string
  items: InwardOrderItem[]
  scanHistory?: ScanHistoryItem[]
}

export interface InwardScanEvent {
  inwardOrderId: number
  barcode: string
  scanType?: string
  scannedQuantity?: number
  message?: string
}

export interface StatusUpdateDto {
  id: number
  status: string
  comments?: string
}
