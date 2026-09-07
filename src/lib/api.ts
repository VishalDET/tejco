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
export { apiClient }
import type { Client, ClientDelivery, Address, ClientContact } from "@/app/stakeholders/clients/types"
import type { Vendor } from "@/app/supply-chain/vendors/types"
import type { Warehouse, ApiWarehouse, Rack } from "@/app/supply-chain/warehouse/types"

// Helpers
export const serializeAddress = (a?: Address) => a ? `${a.street1}|${a.street2 || ""}|${a.city}|${a.state}|${a.pincode}|${a.country}` : ""
const deserializeAddress = (s: any): Address => {
  const p = String(s || "").split("|")
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
  name: string
  company: string
  billingAddress: string | Address | null
  shippingAddress: string | Address | null
  gstin: string
  contactPerson: string
  phone: string
  email?: string
}

/** Maps the backend ApiClient shape to the UI Client type */
export function mapApiClient(raw: ApiClient): Client {
  if (!raw) {
    return {
      id: "0",
      name: "Unknown",
      contactPerson: "",
      company: "",
      email: "",
      phone: "",
      status: "Active",
      clientType: "Clinic",
      hasBranches: false,
      branches: [],
      joinedDate: "",
      address: "",
      billingAddress: { street1: "", city: "", state: "", pincode: "", country: "" },
      shippingAddress: { street1: "", city: "", state: "", pincode: "", country: "" },
      contacts: [],
      instagramUrl: "",
    }
  }

  let extra: any = {}
  
  // Handle case where shippingAddress might be a string with JSON or legacy pipe format
  let mainShippingAddress = raw.shippingAddress
  if (typeof raw.shippingAddress === "string" && raw.shippingAddress.includes("|||")) {
    const parts = raw.shippingAddress.split("|||")
    mainShippingAddress = parts[0]
    try {
      extra = JSON.parse(parts[1])
    } catch (e) {
      console.error("Failed to parse extra client data", e)
    }
  }

  const parseAddr = (addr: any): Address => {
    if (!addr) return { street1: "", city: "", state: "", pincode: "", country: "" }
    if (typeof addr === 'object' && addr.street1 !== undefined) {
      // Return a new plain object to ensure serializability
      return {
        street1: String(addr.street1 || ""),
        street2: String(addr.street2 || ""),
        city: String(addr.city || ""),
        state: String(addr.state || ""),
        pincode: String(addr.pincode || ""),
        country: String(addr.country || ""),
      }
    }
    return deserializeAddress(addr)
  }

  const r = raw as any

  return {
    id: String(raw.clientId ?? 0),
    name: String(raw.name || ""),
    contactPerson: String(raw.contactPerson || extra.contactPerson || ""),
    company: String(raw.company || raw.name || ""),
    email: String(raw.email || extra.email || ""),
    phone: String(raw.phone || ""),
    status: (r.status || extra.status || "Active") as Client["status"],
    clientType: (r.clientType || extra.clientType || "") as Client["clientType"],
    hasBranches: Boolean(r.hasBranches || extra.hasBranches || false),
    branches: Array.isArray(r.branches) ? r.branches : Array.isArray(extra.branches) ? extra.branches : [],
    joinedDate: String(r.joinedDate || extra.joinedDate || ""),
    address: typeof raw.billingAddress === 'string' ? raw.billingAddress : "", // legacy
    billingAddress: extra.billingAddress ? parseAddr(extra.billingAddress) : parseAddr(raw.billingAddress),
    shippingAddress: extra.shippingAddress ? parseAddr(extra.shippingAddress) : parseAddr(mainShippingAddress),
    gstin: raw.gstin ? String(raw.gstin) : undefined,
    contacts: Array.isArray(r.contacts) ? r.contacts : Array.isArray(extra.contacts) ? extra.contacts : [],
    instagramUrl: String(r.instagramUrl || extra.instagramUrl || ""),
    dateOfBirth: r.dateOfBirth ? String(r.dateOfBirth) : undefined,
  }
}


export interface ClientGetAllParams {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortDir?: string
  search?: string
  searchBy?: string
}

export interface ClientGetAllResponse {
  clients: Client[]
  totalCount: number
}

// ---------------------------------------------------------------------------
// Clients  →  /api/Clients
// ---------------------------------------------------------------------------

export const clientsApi = {
  /** GET /api/Client/GetAll — fetch clients with pagination & filtering */
  getAll: async (params?: ClientGetAllParams): Promise<ClientGetAllResponse> => {
    try {
      const query = new URLSearchParams()
      if (params?.pageNumber) query.append("pageNumber", String(params.pageNumber))
      if (params?.pageSize) query.append("pageSize", String(params.pageSize))
      if (params?.sortBy) query.append("sortBy", params.sortBy)
      if (params?.sortDir) query.append("sortDir", params.sortDir)
      if (params?.search) query.append("search", params.search)
      if (params?.searchBy) query.append("searchBy", params.searchBy)

      const queryString = query.toString() ? `?${query.toString()}` : ""
      const raw = await apiClient.get<any>(`/api/Client/GetAll${queryString}`)

      let clients: Client[] = []
      let totalCount = 0

      if (Array.isArray(raw)) {
        clients = raw.map(mapApiClient)
        totalCount = clients.length
      } else if (raw?.data && Array.isArray(raw.data)) {
        clients = raw.data.map(mapApiClient)
        totalCount = raw.totalCount ?? raw.total ?? clients.length
      }

      return { clients, totalCount }
    } catch (err) {
      console.error("Failed to fetch clients:", err)
      return { clients: [], totalCount: 0 }
    }
  },

  /** GET /api/Clients/{id} — fetch a single client */
  getById: async (id: string): Promise<Client> => {
    const raw = await apiClient.get<any>(`/api/Client/GetById/${id}`)
    const data = raw?.data || raw
    return mapApiClient(data)
  },

  /** GET /api/Clients/{id}/deliveries — fetch delivery history for a client */
  getDeliveries: async (id: string): Promise<ClientDelivery[]> => {
    const raw = await apiClient.get<any>(`/api/Client/${id}/deliveries`)
    if (Array.isArray(raw)) return raw
    if (raw?.data && Array.isArray(raw.data)) return raw.data
    return []
  },

  /** POST /api/Client/Create — create a new client */
  create: (data: Partial<Client>) => {
    const payload = {
      clientId: 0,
      name: data.name ?? "",
      company: data.company ?? data.name ?? "",
      contactPerson: data.contactPerson ?? data.name ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      status: data.status ?? "Active",
      clientType: data.clientType ?? "Clinic",
      hasBranches: data.hasBranches ?? false,
      gstin: data.gstin ?? "",
      joinedDate: data.joinedDate || new Date().toISOString(),
      billingAddress: data.billingAddress ?? { street1: "", street2: "", city: "", state: "", pincode: "", country: "India" },
      shippingAddress: data.shippingAddress ?? { street1: "", street2: "", city: "", state: "", pincode: "", country: "India" },
      contacts: data.contacts ?? [],
      branches: data.branches ?? [],
      instagramUrl: data.instagramUrl ?? "",
      dateOfBirth: data.dateOfBirth || null,
    }
    return apiClient.post<any>("/api/Client/Create", payload)
  },

  /** PUT /api/Client/Update/{id} — update an existing client */
  update: (id: string, data: Partial<Client>) => {
    const payload = {
      clientId: parseInt(id),
      name: data.name ?? "",
      company: data.company ?? data.name ?? "",
      contactPerson: data.contactPerson ?? data.name ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      status: data.status ?? "Active",
      clientType: data.clientType ?? "Clinic",
      hasBranches: data.hasBranches ?? false,
      gstin: data.gstin ?? "",
      joinedDate: data.joinedDate || new Date().toISOString(),
      billingAddress: data.billingAddress ?? { street1: "", street2: "", city: "", state: "", pincode: "", country: "India" },
      shippingAddress: data.shippingAddress ?? { street1: "", street2: "", city: "", state: "", pincode: "", country: "India" },
      contacts: data.contacts ?? [],
      branches: data.branches ?? [],
      instagramUrl: data.instagramUrl ?? "",
      dateOfBirth: data.dateOfBirth || null,
    }
    return apiClient.put<any>(`/api/Client/Update/${id}`, payload)
  },

  /** DELETE /api/Clients/{id} — delete a client */
  remove: (id: string) => apiClient.delete<void>(`/api/Client/${id}`),
}

export interface ApiVendor {
  vendorId?: number
  id?: number
  vendorName?: string
  name?: string
  address?: string
  gstin?: string
  email?: string
  contactPerson?: string
  phone?: string
  status?: boolean | string
}

export function mapApiVendor(raw: ApiVendor): Vendor {
  const vId = String(raw.vendorId ?? raw.id ?? 0)
  return {
    id: vId,
    name: raw.vendorName || raw.name || `Vendor #${vId}`,
    contactPerson: raw.contactPerson || raw.vendorName || "",
    email: raw.email || "",
    phone: raw.phone || "",
    address: typeof raw.address === "string" ? raw.address : "",
    gstin: raw.gstin || "",
    status: raw.status === false ? "Inactive" : "Active",
    products: [],
    purchaseHistory: [],
    payments: [],
  }
}

export const vendorsApi = {
  /** GET /api/Vendor — fetch all vendors */
  getAll: async (): Promise<Vendor[]> => {
    try {
      const raw = await apiClient.get<any>("/api/Vendor")
      const list = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : [])
      return list.map(mapApiVendor)
    } catch (err) {
      console.error("Failed to fetch vendors:", err)
      return []
    }
  },

  /** GET /api/Vendor/{id} */
  getById: async (id: string): Promise<Vendor> => {
    const raw = await apiClient.get<any>(`/api/Vendor/${id}`)
    const data = raw?.data || raw
    return mapApiVendor(data)
  },

  /** POST /api/Vendor */
  create: (data: Partial<Vendor>) => {
    const payload = {
      vendorId: 0,
      vendorName: data.name || "",
      contactPerson: data.contactPerson || "",
      email: data.email || "",
      phone: data.phone || "",
      address: typeof data.address === "string" ? data.address : "",
      gstin: data.gstin || "",
      status: data.status === "Inactive" ? false : true,
    }
    return apiClient.post<any>("/api/Vendor", payload)
  },

  /** PUT /api/Vendor/{id} */
  update: (id: string, data: Partial<Vendor>) => {
    const payload = {
      vendorId: parseInt(id) || 0,
      vendorName: data.name || "",
      contactPerson: data.contactPerson || "",
      email: data.email || "",
      phone: data.phone || "",
      address: typeof data.address === "string" ? data.address : "",
      gstin: data.gstin || "",
      status: data.status === "Inactive" ? false : true,
    }
    return apiClient.put<any>(`/api/Vendor/${id}`, payload)
  },

  /** DELETE /api/Vendor/{id} */
  remove: (id: string) => apiClient.delete<void>(`/api/Vendor/${id}`),
}

// ---------------------------------------------------------------------------
// Products  →  /api/Products
// ---------------------------------------------------------------------------
// TODO: import Product type from inventory module once types are defined

export const productsApi = {
  /** GET /api/Product/GetAll */
  getAll: () => apiClient.get<any>("/api/Product/GetAll"),

  /** GET /api/Product/GetById/{id} */
  getById: (id: string | number) => apiClient.get<any>(`/api/Product/GetById/${id}`),

  /** GET /api/Product/SalesDetails/{id} */
  getSalesDetails: (id: string | number) => apiClient.get<any>(`/api/Product/SalesDetails/${id}`),

  /** POST /api/Product/Create */
  create: (data: any) => apiClient.post<any>("/api/Product/Create", data),

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
  let addrObj = {
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  }
  let racks: Rack[] = []

  if (raw.address && typeof raw.address === "object") {
    const addr = raw.address as any
    addrObj = {
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      country: addr.country || "India",
    }
    racks = Array.isArray(raw.racks) ? raw.racks : []
  } else if (typeof raw.address === "string") {
    const address = raw.address as string
    const [addressRaw, racksRaw] = address.split("|||")
    const addressParts = (addressRaw || "").split("|")
    addrObj = {
      street: addressParts[0] || "",
      city: addressParts[1] || "",
      state: addressParts[2] || "",
      pincode: addressParts[3] || "",
      country: addressParts[4] || "India",
    }
    try {
      if (racksRaw) {
        racks = JSON.parse(racksRaw)
      }
    } catch (e) {
      console.error("Failed to parse racks data:", e)
    }
  }

  return {
    id: String(raw.warehouseId ?? (raw as any).id ?? 0),
    warehouseId: raw.warehouseId ?? Number((raw as any).id) ?? 0,
    name: raw.warehouseName || (raw as any).name || "",
    warehouseName: raw.warehouseName || (raw as any).name || "",
    address: addrObj,
    contactPerson: raw.contactPerson || "",
    contactNumber: raw.contactNumber || "",
    status: raw.status ? "Active" : "Inactive",
    racks: racks,
  } as any
}

export const warehousesApi = {
  /** GET /api/Warehouse — fetch all warehouses */
  getAll: async (): Promise<Warehouse[]> => {
    try {
      const raw = await apiClient.get<any>("/api/Warehouse")
      // Handle response envelope { statusCode: 200, data: [...] }
      const list = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : [])
      return list.map(mapApiWarehouse)
    } catch (err) {
      console.error("Failed to fetch warehouses:", err)
      return []
    }
  },

  /** GET /api/Warehouse/{id} */
  getById: async (id: string): Promise<Warehouse> => {
    const raw = await apiClient.get<any>(`/api/Warehouse/GetById/${id}`)
    const data = raw?.data || raw
    return mapApiWarehouse(data)
  },

  /** POST /api/Warehouse */
  create: (data: Partial<Warehouse>) => {
    const payload = {
      warehouseId: 0,
      warehouseName: data.name ?? "",
      address: {
        street: data.address?.street ?? "",
        city: data.address?.city ?? "",
        state: data.address?.state ?? "",
        pincode: data.address?.pincode ?? "",
        country: data.address?.country ?? "India",
      },
      contactPerson: data.contactPerson ?? "",
      contactNumber: data.contactNumber ?? "",
      status: data.status === "Active",
      racks: data.racks ?? [],
    }
    return apiClient.post<any>("/api/Warehouse", payload)
  },

  /** PUT /api/Warehouse/{id} */
  update: (id: string, data: Partial<Warehouse>) => {
    const payload = {
      warehouseId: parseInt(id),
      warehouseName: data.name ?? "",
      address: {
        street: data.address?.street ?? "",
        city: data.address?.city ?? "",
        state: data.address?.state ?? "",
        pincode: data.address?.pincode ?? "",
        country: data.address?.country ?? "India",
      },
      contactPerson: data.contactPerson ?? "",
      contactNumber: data.contactNumber ?? "",
      status: data.status === "Active",
      racks: data.racks ?? [],
    }
    return apiClient.put<any>(`/api/Warehouse/${id}`, payload)
  },

  /** DELETE /api/Warehouse/{id} */
  remove: (id: string) => apiClient.delete<void>(`/api/Warehouse/${id}`),
}

// ---------------------------------------------------------------------------
// Quotations  →  /api/Quotation
// ---------------------------------------------------------------------------

import { mapApiQuotation, Quotation } from "@/app/sales/quotations/types"
import { mapApiProforma, ProformaInvoice } from "@/app/sales/proforma-invoices/types"
import type { SalesDocument } from "@/app/sales/types"

export const quotationsApi = {
  /** GET /api/Quotation/GetAll — fetch all quotations */
  getAll: async (): Promise<Quotation[]> => {
    try {
      const raw = await apiClient.get<any>("/api/Quotation/GetAll")
      if (Array.isArray(raw)) return raw.map(mapApiQuotation)
      if (raw?.data && Array.isArray(raw.data)) return raw.data.map(mapApiQuotation)
      return []
    } catch (err) {
      console.error("Failed to fetch quotations:", err)
      return []
    }
  },

  /** GET /api/Quotation/GetById/{id} */
  getById: async (id: string): Promise<Quotation> => {
    const raw = await apiClient.get<any>(`/api/Quotation/GetById/${id}`)
    const data = raw?.data || raw
    return mapApiQuotation(data)
  },

  /** POST /api/Quotation/Create */
  create: (data: any) => apiClient.post<any>("/api/Quotation/Create", data),

  /** PUT /api/Quotation/Update/{id} */
  update: (id: string, data: any) => apiClient.put<any>(`/api/Quotation/Update/${id}`, data),

  /** DELETE /api/Quotation/Delete/{id} */
  remove: (id: string) => apiClient.delete<void>(`/api/Quotation/Delete/${id}`),
}

// ---------------------------------------------------------------------------
// Proforma Invoices  →  /api/ProformaInvoice
// ---------------------------------------------------------------------------

export const proformaApi = {
  /** GET /api/ProformaInvoice/GetAll */
  getAll: async (): Promise<ProformaInvoice[]> => {
    try {
      const raw = await apiClient.get<any>("/api/ProformaInvoice/GetAll")
      if (Array.isArray(raw)) return raw.map(mapApiProforma)
      if (raw?.data && Array.isArray(raw.data)) return raw.data.map(mapApiProforma)
      return []
    } catch (err) {
      console.error("Failed to fetch proforma invoices:", err)
      return []
    }
  },

  /** GET /api/ProformaInvoice/GetById/{id} */
  getById: async (id: string): Promise<ProformaInvoice> => {
    const raw = await apiClient.get<any>(`/api/ProformaInvoice/GetById/${id}`)
    const data = raw?.data || raw
    return mapApiProforma(data)
  },

  /** POST /api/ProformaInvoice/Create */
  create: (data: any) => apiClient.post<any>("/api/ProformaInvoice/Create", data),

  /** PUT /api/ProformaInvoice/Update/{id} */
  update: (id: string, data: any) => apiClient.put<any>(`/api/ProformaInvoice/Update/${id}`, data),

  /** DELETE /api/ProformaInvoice/Delete/{id} */
  remove: (id: string) => apiClient.delete<void>(`/api/ProformaInvoice/Delete/${id}`),
}

// ---------------------------------------------------------------------------
// Users & Employees  →  /api/User
// ---------------------------------------------------------------------------

export const usersApi = {
  /** GET /api/User/GetAll */
  getAll: () => apiClient.get<any[]>("/api/User/GetAll"),

  /** GET /api/User/GetById/{id} */
  getById: (id: string) => apiClient.get<any>(`/api/User/GetById/${id}`),

  /** POST /api/User/Create */
  create: (data: any) => apiClient.post<any>("/api/User/Create", data),

  /** PUT /api/User/Update/{id} */
  update: (id: string, data: any) => apiClient.put<any>(`/api/User/Update/${id}`, data),

  /** GET /api/User/GetByEmail/{email} */
  getByEmail: (email: string) => apiClient.get<any>(`/api/User/GetByEmail/${email}`),

  /** DELETE /api/User/Delete/{id} */
  remove: (id: string) => apiClient.delete<void>(`/api/User/Delete/${id}`),
}

// ---------------------------------------------------------------------------
// Categories  →  /api/Category
// ---------------------------------------------------------------------------

export const categoriesApi = {
  /** GET /api/Category/GetAll */
  getAll: () => apiClient.get<any[]>("/api/Category/GetAll"),

  /** GET /api/Category/GetById/{id} */
  getById: (id: string) => apiClient.get<any>(`/api/Category/GetById/${id}`),

  /** POST /api/Category/Create */
  create: (data: any) => apiClient.post<any>("/api/Category/Create", data),

  /** PUT /api/Category/Update/{id} */
  update: (id: string, data: any) => apiClient.put<any>(`/api/Category/Update/${id}`, data),

  /** DELETE /api/Category/Delete/{id} */
  remove: (id: string) => apiClient.delete<void>(`/api/Category/Delete/${id}`),
}

// ---------------------------------------------------------------------------
// Auth  →  /api/Auth
// ---------------------------------------------------------------------------

export const authApi = {
  /** POST /api/Auth/login */
  login: (credentials: { username: string; password: string }) => 
    apiClient.post<any>("/api/Auth/login", credentials),
}

// ---------------------------------------------------------------------------
// System Masters  →  /api/SystemMasters
// ---------------------------------------------------------------------------

export const systemMastersApi = {
  /** GET /api/SystemMasters/companies */
  getCompanies: () => apiClient.get<any[]>("/api/SystemMasters/companies"),

  /** GET /api/SystemMasters/departments */
  getDepartments: () => apiClient.get<any[]>("/api/SystemMasters/departments"),

  /** GET /api/SystemMasters/branches */
  getBranches: () => apiClient.get<any[]>("/api/SystemMasters/branches"),
}

// ---------------------------------------------------------------------------
// Sales Orders  →  /api/SalesOrder
// ---------------------------------------------------------------------------

export const salesOrderApi = {
  /** POST /api/SalesOrder/Create */
  create: (data: any) => apiClient.post<any>("/api/SalesOrder/Create", data),

  /** PUT /api/SalesOrder/Update/{id} */
  update: (id: string, data: any) => apiClient.put<any>(`/api/SalesOrder/Update/${id}`, data),

  /** PUT /api/SalesOrder/{id}/Status */
  updateStatus: (id: string | number, newStatus: string, remarks?: string) =>
    apiClient.put<any>(`/api/SalesOrder/${id}/Status`, { newStatus, remarks: remarks || "" }),

  /** GET /api/SalesOrder/GetAll */
  getAll: () => apiClient.get<any[]>("/api/SalesOrder/GetAll"),

  /** GET /api/SalesOrder/GetById/{id} */
  getById: (id: string) => apiClient.get<any>(`/api/SalesOrder/GetById/${id}`),

  /** DELETE /api/SalesOrder/Delete/{id} */
  remove: (id: string) => apiClient.delete<void>(`/api/SalesOrder/Delete/${id}`),
}

// ---------------------------------------------------------------------------
// Dashboard  →  /api/Dashboard
// ---------------------------------------------------------------------------

export const dashboardApi = {
  getKPIs: () => apiClient.get<any>("/api/Dashboard/KPIs"),
  getSalesTrend: () => apiClient.get<any>("/api/Dashboard/SalesTrend"),
  getCategorySales: () => apiClient.get<any>("/api/Dashboard/CategorySales"),
  getWarehouseDistribution: () => apiClient.get<any>("/api/Dashboard/WarehouseDistribution"),
  getRecentActivity: () => apiClient.get<any>("/api/Dashboard/RecentActivity"),
  getTopProducts: () => apiClient.get<any>("/api/Dashboard/TopProducts"),
  getOrderStatus: () => apiClient.get<any>("/api/Dashboard/OrderStatus"),
  getTopClients: () => apiClient.get<any>("/api/Dashboard/TopClients"),
  getCriticalStock: () => apiClient.get<any>("/api/Dashboard/CriticalStock"),
}

// ---------------------------------------------------------------------------
// Order Outward  →  /api/OrderOutward
// ---------------------------------------------------------------------------

export interface ApiOutwardOrderItem {
  outwardOrderItemId: number
  outwardOrderId: number
  productId: number
  productName: string
  variantName: string
  sku: string
  barcode: string
  orderedQty: number
  scannedQty: number
  locationCode: string
}

export interface ApiOutwardScanEvent {
  scanId: number
  outwardOrderId: number
  barcode: string
  message: string
  scanType: string
  productName?: string
  scannedAt: string
}

export interface ApiOutwardOrder {
  outwardOrderId: number
  orderId: number
  orderNumber: string
  clientName: string
  warehouseName: string
  shippingAddress: string
  orderDate: string
  promisedDate: string
  status: string
  priority: string
  pickerName?: string
  createdAt: string
  updatedAt: string
  items: ApiOutwardOrderItem[]
  scanHistory: ApiOutwardScanEvent[]
}

export const orderOutwardApi = {
  getAll: () => apiClient.get<ApiOutwardOrder[]>("/api/OrderOutward/GetAll"),
  getById: (id: number | string) => apiClient.get<ApiOutwardOrder>(`/api/OrderOutward/GetById/${id}`),
  create: (data: Partial<ApiOutwardOrder>) => apiClient.post<ApiOutwardOrder>("/api/OrderOutward/Create", data),
  update: (id: number | string, data: ApiOutwardOrder) => apiClient.put<ApiOutwardOrder>(`/api/OrderOutward/Update/${id}`, data),
  updateStatus: (id: number | string, newStatus: string, remarks: string) => 
    apiClient.put<void>(`/api/OrderOutward/${id}/Status`, { newStatus, remarks }),
  scanBarcode: (id: number | string, scanEvent: Partial<ApiOutwardScanEvent>) => 
    apiClient.post<ApiOutwardScanEvent>(`/api/OrderOutward/${id}/Scan`, scanEvent),
  remove: (id: number | string) => apiClient.delete<void>(`/api/OrderOutward/Delete/${id}`),
}

// ---------------------------------------------------------------------------
// Dispatch  →  /api/Dispatch
// ---------------------------------------------------------------------------

export interface ApiDispatchItem {
  dispatchItemId: number
  dispatchId: number
  productName: string
  sku: string
  quantity: number
}

export interface ApiDispatchTimelineEvent {
  timelineId: number
  dispatchId: number
  label: string
  description: string
  timestamp: string
  status: string
}

export interface ApiDispatch {
  dispatchId: number
  orderId: number
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
  freightPaymentMode: string
  vehicleNumber?: string
  driverName?: string
  driverPhone?: string
  challanNumber?: string
  invoiceNumber?: string
  ewayBillNumber?: string
  shippingLabelRef?: string
  status: string
  remarks?: string
  createdAt?: string
  updatedAt?: string
  items: ApiDispatchItem[]
  timeline: ApiDispatchTimelineEvent[]
}

export const dispatchApi = {
  getAll: () => apiClient.get<ApiDispatch[]>("/api/Dispatch/GetAll"),
  getById: (id: number | string) => apiClient.get<ApiDispatch>(`/api/Dispatch/GetById/${id}`),
  create: (data: Partial<ApiDispatch>) => apiClient.post<ApiDispatch>("/api/Dispatch/Create", data),
  update: (id: number | string, data: ApiDispatch) => apiClient.put<ApiDispatch>(`/api/Dispatch/Update/${id}`, data),
  updateStatus: (id: number | string, newStatus: string, remarks: string) =>
    apiClient.put<void>(`/api/Dispatch/${id}/Status`, { newStatus, remarks }),
  remove: (id: number | string) => apiClient.delete<void>(`/api/Dispatch/Delete/${id}`),
}

// ---------------------------------------------------------------------------
// Country Master  →  /api/CountryMaster
// ---------------------------------------------------------------------------

export interface CountryMaster {
  countryId: number
  countryName: string
  currencyType: string
  paymentType: string
  createdAt?: string
  updatedAt?: string
}

export const countryMasterApi = {
  getAll: () => apiClient.get<CountryMaster[]>("/api/CountryMaster/GetAll"),
  getById: (id: number | string) => apiClient.get<CountryMaster>(`/api/CountryMaster/GetById/${id}`),
  create: (data: Partial<CountryMaster>) => apiClient.post<CountryMaster>("/api/CountryMaster/Create", data),
  update: (id: number | string, data: CountryMaster) => apiClient.put<CountryMaster>(`/api/CountryMaster/Update/${id}`, data),
  remove: (id: number | string) => apiClient.delete<void>(`/api/CountryMaster/Delete/${id}`),
}

// ---------------------------------------------------------------------------
// Stock Inward  →  /api/StockInward
// ---------------------------------------------------------------------------

import type { InwardOrder, InwardScanEvent, StatusUpdateDto } from "@/app/inventory/stock-inward/types"

export const stockInwardApi = {
  getAll: () => apiClient.get<InwardOrder[]>("/api/StockInward/GetAll"),
  getById: (id: number | string) => apiClient.get<InwardOrder>(`/api/StockInward/GetById/${id}`),
  create: (data: Partial<InwardOrder>) => apiClient.post<InwardOrder>("/api/StockInward/Create", data),
  update: (id: number | string, data: Partial<InwardOrder>) => apiClient.put<InwardOrder>(`/api/StockInward/Update/${id}`, data),
  updateStatus: (id: number | string, dto: StatusUpdateDto) => apiClient.put<void>(`/api/StockInward/${id}/Status`, dto),
  scan: (id: number | string, event: InwardScanEvent) => apiClient.post<void>(`/api/StockInward/${id}/Scan`, event),
  remove: (id: number | string) => apiClient.delete<void>(`/api/StockInward/Delete/${id}`),
}



// ---------------------------------------------------------------------------
// Reports  →  /api/Report
// ---------------------------------------------------------------------------

export interface ReportFilterDto {
  startDate?: string   // ISO date string e.g. "2025-01-01"
  endDate?: string     // ISO date string e.g. "2025-12-31"
  [key: string]: unknown  // allow any extra filter fields the backend may accept
}

export const reportsApi = {
  /** POST /api/Report/sales */
  getSales: (filter: ReportFilterDto) =>
    apiClient.post<any>("/api/Report/sales", filter),

  /** POST /api/Report/orders-outward */
  getOrdersOutward: (filter: ReportFilterDto) =>
    apiClient.post<any>("/api/Report/orders-outward", filter),

  /** POST /api/Report/inventory-inward */
  getInventoryInward: (filter: ReportFilterDto) =>
    apiClient.post<any>("/api/Report/inventory-inward", filter),
}


