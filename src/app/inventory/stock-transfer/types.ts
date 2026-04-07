export type TransferStatus = "Draft" | "Pending" | "In Transit" | "Completed" | "Cancelled"

export interface StorageLocation {
  id: string
  name: string
  warehouseId: string
}

export interface Warehouse {
  id: string
  name: string
  locations: StorageLocation[]
}

export interface TransferItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unit: string
}

export interface StockTransfer {
  id: string
  transferId: string // e.g., TRX-1001
  date: string
  reason: string
  status: TransferStatus
  
  sourceWarehouseId: string
  sourceStorageId: string
  
  destinationWarehouseId: string
  destinationStorageId: string
  
  items: TransferItem[]
  notes?: string
  
  createdAt: string
  updatedAt: string
}
