export interface InwardOrderItem {
  inwardOrderItemId?: number
  inwardOrderId?: number
  productId: number
  variantId?: number
  productName?: string
  variantName?: string
  size?: string
  bevel?: string
  sku?: string
  barcode?: string
  expectedQty: number
  receivedQty: number
  acceptedQty?: number
  rejectedQty?: number
  rejectionReason?: string
  lotId?: number
  lotNumber?: string
  lotBarcode?: string
  expiryDate?: string
  manufacturingDate?: string
  locationCode?: string
  warehouseId?: number
  warehouseName?: string
  unitPrice?: number
  unitCost?: number
  purchasePrice?: number
  generatedBarcodes?: string[]
  // UI fallback props
  expectedQuantity?: number
  receivedQuantity?: number
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

export interface CreateStockInwardItemDto {
  inwardOrderItemId: number
  inwardOrderId: number
  productId: number
  variantId: number
  productName: string
  variantName: string
  sku: string
  barcode: string
  expectedQty: number
  receivedQty: number
  locationCode: string
  lotId: number
  lotNumber: string
  purchasePrice: number
  expiryDate: string
}

export interface CreateStockInwardScanDto {
  scanId: number
  inwardOrderId: number
  barcode: string
  message: string
  scanType: string
  productName: string
  scannedAt: string
}

export interface CreateStockInwardDto {
  inwardOrderId: number
  orderNumber: string
  vendorId: number
  vendorName: string
  warehouseId: number
  warehouseName: string
  warehouseCode: string
  orderDate: string
  status: string
  priority: string
  receiverName: string
  createdAt: string
  updatedAt: string
  purchaseOrderId: number
  invoiceNumber: string
  items: CreateStockInwardItemDto[]
  scanHistory: CreateStockInwardScanDto[]
}

export interface InwardOrder {
  inwardOrderId?: number
  id?: number
  orderNumber?: string
  inwardNumber?: string
  invoiceNumber?: string
  invoiceDate?: string
  poId?: number
  poNumber?: string
  purchaseOrderId?: number
  vendorId: number
  vendorName?: string
  vendorPrefix?: string
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
  id?: number
  status?: string
  newStatus: string
  comments?: string
  remarks?: string
}

export interface VariantActiveLot {
  lotId?: number
  lotNumber?: string
  productId?: number
  variantId?: number
  warehouseId?: number
  warehouseName?: string
  rackLocation?: string
  initialQuantity?: number
  currentQuantity?: number
  reservedQuantity?: number
  availableQuantity?: number
  expiryDate?: string
  inwardDate?: string
  status?: string
}

