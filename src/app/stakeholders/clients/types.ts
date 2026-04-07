export interface ClientContact {
  id: string
  name: string
  designation: string
  email: string
  phone: string
}

export interface Client {
  id: string
  name: string
  contactPerson: string
  company: string
  email: string
  phone: string
  status: "Active" | "Inactive" | "Lead"
  joinedDate: string
  address: string
  billingAddress: string
  shippingAddress: string
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
