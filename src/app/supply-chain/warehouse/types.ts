export interface StorageLocation {
  id: string
  name: string
  warehouseId: string
}

export interface Warehouse {
  id: string
  name: string
  address: string
  contactPerson: string
  contactNumber: string
  status: "Active" | "Inactive"
  locations?: StorageLocation[]
}

/** Raw shape returned by the backend for /api/Warehouse */
export interface ApiWarehouse {
  warehouseId: number
  warehouseName: string
  address: string
  contactPerson: string
  contactNumber: string
  status: boolean
}
