export interface VendorProduct {
  id: string;
  name: string;
  sku: string;
  unit: string;
  price: number;
}

export interface PurchaseHistory {
  id: string;
  poNumber: string;
  date: string;
  amount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  reference: string;
  method: string;
}

export interface Vendor {
  id: string;
  vendorId?: number;
  name: string;
  vendorName?: string;
  contactPerson: string;
  contactPersonName?: string;
  email: string;
  phone: string;
  mobileNumber?: string;
  address: string;
  gstin: string;
  status: 'Active' | 'Inactive';
  vendorPrefix?: string | null;
  products: VendorProduct[];
  purchaseHistory: PurchaseHistory[];
  payments: Payment[];
}

export interface CreateVendorDto {
  vendorId: number;
  vendorName: string;
  address: string;
  gstin: string;
  email: string;
  mobileNumber: string;
  contactPersonName: string;
  vendorPrefix: string | null;
}
