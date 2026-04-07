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
import type { Client, ClientDelivery } from "@/app/stakeholders/clients/types"
import type { Vendor } from "@/app/supply-chain/vendors/types"

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
  return {
    id: String(raw.clientId),
    name: raw.clientName,
    contactPerson: raw.contactPerson,
    company: raw.clientName, // In this API, company name is likely clientName
    email: "",               // not provided by API yet
    phone: raw.contactNumber,
    status: "Active",        // default; no status field in API yet
    joinedDate: new Date().toISOString(),
    address: raw.billingAddress,
    billingAddress: raw.billingAddress,
    shippingAddress: raw.shippingAddress,
    gstin: raw.gstin || undefined,
    contacts: [], // backend doesn't support multiple contacts yet
  }
}

// ---------------------------------------------------------------------------
// Clients  →  /api/Clients
// ---------------------------------------------------------------------------

export const clientsApi = {
  /** GET /api/Clients — fetch all clients */
  getAll: async (): Promise<Client[]> => {
    const raw = await apiClient.get<ApiClient[]>("/api/Clients")
    return raw.map(mapApiClient)
  },

  /** GET /api/Clients/{id} — fetch a single client */
  getById: async (id: string): Promise<Client> => {
    const raw = await apiClient.get<ApiClient>(`/api/Clients/${id}`)
    return mapApiClient(raw)
  },

  /** GET /api/Clients/{id}/deliveries — fetch delivery history for a client */
  getDeliveries: (id: string) =>
    apiClient.get<ClientDelivery[]>(`/api/Clients/${id}/deliveries`),

  /** POST /api/Clients — create a new client */
  create: (payload: CreateClientPayload) =>
    apiClient.post<Client>("/api/Clients", payload),

  /** PUT /api/Clients/{id} — update an existing client */
  update: (id: string, data: Partial<Omit<Client, "id">>) =>
    apiClient.put<Client>(`/api/Clients/${id}`, data),

  /** DELETE /api/Clients/{id} — delete a client */
  remove: (id: string) => apiClient.delete<void>(`/api/Clients/${id}`),
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
// Add more domains below as the app grows, e.g.:
//   export const salesApi = { ... }
//   export const purchaseOrdersApi = { ... }
// ---------------------------------------------------------------------------
