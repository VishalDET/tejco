export interface Address {
  street1: string
  street2?: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface ClientContact {
  id: string
  name: string
  designation: string
  email: string
  phone: string
}

export interface ClientBranch {
  id: string
  name: string
  address: Address
  contacts: ClientContact[]
}

export type ClientType = "Clinic" | "Doctor" | "Hospital" | "Retail" | "Others"

export interface Client {
  id: string
  name: string
  contactPerson: string
  company: string
  email: string
  phone: string
  status: "Active" | "Inactive" | "Lead"
  clientType: ClientType
  hasBranches: boolean
  branches: ClientBranch[]
  joinedDate: string
  address: string // legacy/combined
  billingAddress: Address
  shippingAddress: Address
  gstin?: string
  contacts: ClientContact[]
}

export interface ClientDelivery {
  id: string
  clientId: string
  date: string // ISO date string
  productName: string
  quantity: number
  unit: string
  amount: number
  status: "Delivered" | "In Transit" | "Processing" | "Returned"
  dispatchId: string
}
