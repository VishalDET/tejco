export interface WarehouseAddress {
  street: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface Shelf {
  id: string
  name: string // e.g., "Shelf 1", "Top Row"
  code: string // e.g., "R1-S1"
}

export interface Rack {
  id: string
  name: string // e.g., "Rack A", "Alpha Section"
  location: string // e.g., "Aisle 1, Left"
  shelves: Shelf[]
}

export interface StorageLocation {
  id: string
  rackName: string
  shelfName: string
  locationCode: string
  isOccupied: boolean
}

export interface Warehouse {
  id: string
  name: string
  address: WarehouseAddress
  contactPerson: string
  contactNumber: string
  status: "Active" | "Inactive"
  
  // Advanced Infrastructure
  racks: Rack[]
}

/** Raw shape returned by the backend for /api/Warehouse */
export interface ApiWarehouse {
  warehouseId: number
  warehouseName: string
  address: string // Format: "street|city|state|pincode|country|||RacksJSON"
  contactPerson: string
  contactNumber: string
  status: boolean
}
