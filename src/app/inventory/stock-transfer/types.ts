export type TransferStatus = "Draft" | "Pending" | "In Transit" | "Completed" | "Cancelled"

export interface StorageLocation {
  id: string
  name: string
  warehouseId?: string
}

export interface Warehouse {
  id: string
  name: string
  locations?: StorageLocation[]
  warehouseId?: number
  warehouseName?: string
  address?: any
  contactPerson?: string
  contactNumber?: string
  status?: boolean | string
  racks?: any[]
}

export interface TransferItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unit: string
  variantId?: number
  variantName?: string
  currentQuantity?: number
  size?: string
  imageUrl?: string
  warehouseId?: number
  rackLocation?: string
}

export interface StockTransfer {
  id: string
  transferId: string // e.g., TRX-1001
  date: string
  reason: string
  status: TransferStatus
  
  sourceWarehouseId: string
  sourceWarehouseName?: string
  sourceStorageId: string
  
  destinationWarehouseId: string
  destinationWarehouseName?: string
  destinationStorageId: string
  
  items: TransferItem[]
  notes?: string
  
  createdAt: string
  updatedAt: string
}

export function mapApiStockTransfer(
  raw: any,
  warehouses?: Array<{ warehouseId: number; warehouseName: string }>,
  products?: any[]
): StockTransfer {
  if (!raw) {
    return {
      id: "",
      transferId: "",
      date: new Date().toISOString(),
      reason: "",
      status: "Draft",
      sourceWarehouseId: "",
      sourceStorageId: "",
      destinationWarehouseId: "",
      destinationStorageId: "",
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const id = String(raw.id || raw.stockTransferId || raw.transferId || "")
  const transferId =
    raw.transferNumber ||
    raw.transferNo ||
    (id ? `TRX-${id.padStart(4, "0")}` : "TRX-NEW")

  const rawItems = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.transferItems)
    ? raw.transferItems
    : []

  const items: TransferItem[] = rawItems.map((item: any, idx: number) => {
    // Look up product and variant from catalog if provided
    const product = products?.find((p: any) => String(p.productId) === String(item.productId))
    const variant = product?.variants?.find((v: any) => String(v.variantId) === String(item.variantId))

    const rawSku = item.sku || product?.baseSKU || ""
    const hasMeaningfulSku = rawSku && rawSku.toLowerCase() !== "na"

    let productName = item.productName || product?.productName || item.product?.productName || ""
    if (!productName) {
      productName = hasMeaningfulSku ? rawSku : `Product #${item.productId}`
    }

    const variantName =
      item.variantName ||
      variant?.variantName ||
      (variant?.size ? `${variant.size}` : "")

    return {
      id: String(item.id || item.transferItemId || idx + 1),
      productId: String(item.productId || ""),
      productName,
      sku: hasMeaningfulSku ? rawSku : product?.baseSKU || (item.sku ?? `PRD-${item.productId}`),
      quantity: Number(item.quantity) || 0,
      unit: item.unit || product?.unit || "pcs",
      variantId: item.variantId ? Number(item.variantId) : undefined,
      variantName,
      currentQuantity: item.currentQuantity ?? variant?.currentQuantity,
      size: item.size || variant?.size || "",
      imageUrl: item.imageUrl || variant?.variantImage || (product as any)?.imageUrl || "",
      warehouseId: item.warehouseId ? Number(item.warehouseId) : undefined,
      rackLocation: item.rackLocation || variant?.rackLocation || "",
    }
  })

  const srcWh = warehouses?.find(
    (w) => String(w.warehouseId) === String(raw.sourceWarehouseId)
  )
  const dstWh = warehouses?.find(
    (w) => String(w.warehouseId) === String(raw.destinationWarehouseId)
  )

  const rawSrcStorage = raw.sourceStorageId !== undefined && raw.sourceStorageId !== null ? String(raw.sourceStorageId).trim() : ""
  const sourceStorageId = rawSrcStorage === "0" ? "" : rawSrcStorage

  const rawDstStorage = raw.destinationStorageId !== undefined && raw.destinationStorageId !== null ? String(raw.destinationStorageId).trim() : ""
  const destinationStorageId = rawDstStorage === "0" ? "" : rawDstStorage

  return {
    id,
    transferId:
      typeof transferId === "number" ? `TRX-${transferId}` : String(transferId),
    date: raw.transferDate || raw.date || raw.createdAt || new Date().toISOString(),
    reason: raw.reason || raw.transferReason || "Stock Movement",
    status: (raw.status as TransferStatus) || "Draft",
    sourceWarehouseId: String(raw.sourceWarehouseId ?? ""),
    sourceWarehouseName:
      raw.sourceWarehouseName ||
      srcWh?.warehouseName ||
      (raw.sourceWarehouseId ? `Warehouse #${raw.sourceWarehouseId}` : ""),
    sourceStorageId,
    destinationWarehouseId: String(raw.destinationWarehouseId ?? ""),
    destinationWarehouseName:
      raw.destinationWarehouseName ||
      dstWh?.warehouseName ||
      (raw.destinationWarehouseId ? `Warehouse #${raw.destinationWarehouseId}` : ""),
    destinationStorageId,
    notes: raw.notes || raw.remarks || "",
    items,
    createdAt: raw.createdAt || raw.transferDate || raw.date || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  }
}
