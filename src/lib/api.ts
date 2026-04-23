/**
 * API Module — All application API calls in one place.
 *
 * Import the specific namespace you need:
 *   import { clientsApi } from "@/lib/api"
 *   import { vendorsApi } from "@/lib/api"
 *
 * Base URL is configured in api-client.ts via NEXT_PUBLIC_API_BASE_URL.
 */

import { apiClient } from "./api-client"
import type { Client, ClientDelivery, Address, ClientContact } from "@/app/stakeholders/clients/types"
import type { Vendor } from "@/app/supply-chain/vendors/types"
import type { Warehouse, ApiWarehouse } from "@/app/supply-chain/warehouse/types"

// Helpers
const serializeAddress = (a?: Address) => a ? `${a.street1}|${a.street2 || ""}|${a.city}|${a.state}|${a.pincode}|${a.country}` : ""
const deserializeAddress = (s: string): Address => {
  const p = (s || "").split("|")
  return { 
    street1: p[0] || "", 
    street2: p[1] || "", 
    city: p[2] || "", 
    state: p[3] || "", 
    pincode: p[4] || "", 
    country: p[5] || "India" 
  }
}

// ---------------------------------------------------------------------------
// Payload types — shapes expected by the backend
// ---------------------------------------------------------------------------

export interface CreateClientPayload {
  clientId: number       // 0 for new records
  clientName: string
  billingAddress: string
  shippingAddress: string
  gstin: string
  contactPerson: string
  contactNumber: string
}

/** Raw shape returned by the backend for GET /api/Clients and GET /api/Clients/{id} */
export interface ApiClient {
  clientId: number
  clientName: string
  billingAddress: string
  shippingAddress: string
  gstin: string
  contactPerson: string
  contactNumber: string
}

/** Maps the backend ApiClient shape to the UI Client type */
export function mapApiClient(raw: ApiClient): Client {
  let extra: any = {}
  let mainShippingAddress = raw.shippingAddress

  if (raw.shippingAddress && raw.shippingAddress.includes("|||")) {
    const parts = raw.shippingAddress.split("|||")
    mainShippingAddress = parts[0]
    try {
      extra = JSON.parse(parts[1])
    } catch (e) {
      console.error("Failed to parse extra client data", e)
    }
  }

  return {
    id: String(raw.clientId),
    name: raw.clientName,
    contactPerson: raw.contactPerson || extra.contactPerson || "",
    company: raw.clientName,
    email: extra.email || "",
    phone: raw.contactNumber,
    status: extra.status || "Active",
    clientType: extra.clientType || "Clinic",
    hasBranches: extra.hasBranches || false,
    branches: extra.branches || [],
    joinedDate: extra.joinedDate || new Date().toISOString(),
    address: raw.billingAddress, // legacy
    billingAddress: extra.billingAddress || deserializeAddress(raw.billingAddress),
    shippingAddress: extra.shippingAddress || deserializeAddress(mainShippingAddress),
    gstin: raw.gstin || undefined,
    contacts: extra.contacts || [],
  }
}

// ---------------------------------------------------------------------------
// Clients  →  /api/Clients
// ---------------------------------------------------------------------------

export const clientsApi = {
  /** GET /api/Clients — fetch all clients */
  getAll: async (): Promise<Client[]> => {
    try {
      const raw = await apiClient.get<any>("/api/Client/GetAll")
      if (Array.isArray(raw)) return raw.map(mapApiClient)
      if (raw?.data && Array.isArray(raw.data)) return raw.data.map(mapApiClient)
      return []
    } catch (err) {
      console.error("Failed to fetch clients:", err)
      return []
    }
  },

  /** GET /api/Clients/{id} — fetch a single client */
  getById: async (id: string): Promise<Client> => {
    const raw = await apiClient.get<ApiClient>(`/api/Client/GetById/${id}`)
    return mapApiClient(raw)
  },

  /** GET /api/Clients/{id}/deliveries — fetch delivery history for a client */
  getDeliveries: (id: string) =>
    apiClient.get<ClientDelivery[]>(`/api/Client/${id}/deliveries`),

  /** POST /api/Clients — create a new client */
  create: (data: Partial<Client>) => {
    const extra = {
      email: data.email,
      clientType: data.clientType,
      hasBranches: data.hasBranches,
      branches: data.branches,
      contacts: data.contacts,
      status: data.status,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      joinedDate: data.joinedDate || new Date().toISOString()
    }
    
    // We store the searchable/readable string in the main field, and the object in the hidden segment
    const billingStr = serializeAddress(data.billingAddress)
    const shippingStr = serializeAddress(data.shippingAddress)
    const finalShippingSegment = `${shippingStr}|||${JSON.stringify(extra)}`

    const payload = {
      clientId: 0,
      clientName: data.name ?? "",
      billingAddress: billingStr,
      shippingAddress: finalShippingSegment,
      gstin: data.gstin ?? "",
      contactPerson: data.contactPerson ?? data.name ?? "",
      contactNumber: data.phone ?? "",
    }
    return apiClient.post<any>("/api/Client", payload)
  },

  /** PUT /api/Clients/{id} — update an existing client */
  update: (id: string, data: Partial<Client>) => {
    const extra = {
      email: data.email,
      clientType: data.clientType,
      hasBranches: data.hasBranches,
      branches: data.branches,
      contacts: data.contacts,
      status: data.status,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      joinedDate: data.joinedDate
    }

    const billingStr = serializeAddress(data.billingAddress)
    const shippingStr = serializeAddress(data.shippingAddress)
    const finalShippingSegment = `${shippingStr}|||${JSON.stringify(extra)}`

    const payload = {
      clientId: parseInt(id),
      clientName: data.name ?? "",
      billingAddress: billingStr,
      shippingAddress: finalShippingSegment,
      gstin: data.gstin ?? "",
      contactPerson: data.contactPerson ?? data.name ?? "",
      contactNumber: data.phone ?? "",
    }
    return apiClient.put<any>(`/api/Client/${id}`, payload)
  },

  /** DELETE /api/Clients/{id} — delete a client */
  remove: (id: string) => apiClient.delete<void>(`/api/Client/${id}`),
}

// ---------------------------------------------------------------------------
// Vendors  →  /api/Vendors
// ---------------------------------------------------------------------------

export const vendorsApi = {
  /** GET /api/Vendors — fetch all vendors */
  getAll: () => apiClient.get<Vendor[]>("/api/Vendors"),

  /** GET /api/Vendors/{id} — fetch a single vendor */
  getById: (id: string) => apiClient.get<Vendor>(`/api/Vendors/${id}`),

  /** POST /api/Vendors — create a new vendor */
  create: (data: Omit<Vendor, "id" | "products" | "purchaseHistory" | "payments">) =>
    apiClient.post<Vendor>("/api/Vendors", data),

  /** PUT /api/Vendors/{id} — update an existing vendor */
  update: (id: string, data: Partial<Omit<Vendor, "id">>) =>
    apiClient.put<Vendor>(`/api/Vendors/${id}`, data),

  /** DELETE /api/Vendors/{id} — delete a vendor */
  remove: (id: string) => apiClient.delete<void>(`/api/Vendors/${id}`),
}

// ---------------------------------------------------------------------------
// Products  →  /api/Products
// ---------------------------------------------------------------------------
// TODO: import Product type from inventory module once types are defined

export const productsApi = {
  /** GET /api/Products */
  getAll: () => apiClient.get<unknown[]>("/api/Products"),

  /** GET /api/Products/{id} */
  getById: (id: string) => apiClient.get<unknown>(`/api/Products/${id}`),

  /** POST /api/Products */
  create: (data: unknown) => apiClient.post<unknown>("/api/Products", data),

  /** PUT /api/Products/{id} */
  update: (id: string, data: unknown) =>
    apiClient.put<unknown>(`/api/Products/${id}`, data),

  /** DELETE /api/Products/{id} */
  remove: (id: string) => apiClient.delete<void>(`/api/Products/${id}`),
}

// ---------------------------------------------------------------------------
// Warehouses  →  /api/Warehouse
// ---------------------------------------------------------------------------

export function mapApiWarehouse(raw: ApiWarehouse): Warehouse {
  const [addressRaw, racksRaw] = raw.address.split("|||")
  const addressParts = (addressRaw || "").split("|")

  let racks: any[] = []
  try {
    if (racksRaw) {
      racks = JSON.parse(racksRaw)
    }
  } catch (e) {
    console.error("Failed to parse racks data:", e)
  }

  return {
    id: String(raw.warehouseId),
    name: raw.warehouseName,
    address: {
      street: addressParts[0] || "",
      city: addressParts[1] || "",
      state: addressParts[2] || "",
      pincode: addressParts[3] || "",
      country: addressParts[4] || "India",
    },
    contactPerson: raw.contactPerson,
    contactNumber: raw.contactNumber,
    status: raw.status ? "Active" : "Inactive",
    racks: racks,
  }
}

export const warehousesApi = {
  /** GET /api/Warehouse/GetAll — fetch all warehouses */
  getAll: async (): Promise<Warehouse[]> => {
    try {
      const raw = await apiClient.get<any>("/api/Warehouse/GetAll")
      if (Array.isArray(raw)) return raw.map(mapApiWarehouse)
      if (raw?.data && Array.isArray(raw.data)) return raw.data.map(mapApiWarehouse)
      return []
    } catch (err) {
      console.error("Failed to fetch warehouses:", err)
      return []
    }
  },

  /** GET /api/Warehouse/{id} */
  getById: async (id: string): Promise<Warehouse> => {
    const raw = await apiClient.get<ApiWarehouse>(`/api/Warehouse/GetById/${id}`)
    return mapApiWarehouse(raw)
  },

  /** POST /api/Warehouse */
  create: (data: Partial<Warehouse>) => {
    const addr = data.address
    const serializedAddress = addr
      ? `${addr.street}|${addr.city}|${addr.state}|${addr.pincode}|${addr.country}`
      : ""

    const racksJson = data.racks ? JSON.stringify(data.racks) : "[]"
    const finalAddress = `${serializedAddress}|||${racksJson}`

    const payload = {
      warehouseId: 0,
      warehouseName: data.name,
      address: finalAddress,
      contactPerson: data.contactPerson,
      contactNumber: data.contactNumber,
      status: data.status === "Active",
    }
    return apiClient.post<any>("/api/Warehouse", payload)
  },

  /** PUT /api/Warehouse/{id} */
  update: (id: string, data: Partial<Warehouse>) => {
    const addr = data.address
    const serializedAddress = addr
      ? `${addr.street}|${addr.city}|${addr.state}|${addr.pincode}|${addr.country}`
      : ""

    const racksJson = data.racks ? JSON.stringify(data.racks) : "[]"
    const finalAddress = `${serializedAddress}|||${racksJson}`

    const payload = {
      warehouseId: parseInt(id),
      warehouseName: data.name,
      address: finalAddress,
      contactPerson: data.contactPerson,
      contactNumber: data.contactNumber,
      status: data.status === "Active",
    }
    return apiClient.put<any>(`/api/Warehouse/${id}`, payload)
  },

  /** DELETE /api/Warehouse/{id} */
  remove: (id: string) => apiClient.delete<void>(`/api/Warehouse/${id}`),
}

// ---------------------------------------------------------------------------
// Add more domains below as the app grows, e.g.:
//   export const salesApi = { ... }
//   export const purchaseOrdersApi = { ... }
// ---------------------------------------------------------------------------
