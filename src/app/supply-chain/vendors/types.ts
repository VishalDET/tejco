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
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  status: 'Active' | 'Inactive';
  products: VendorProduct[];
  purchaseHistory: PurchaseHistory[];
  payments: Payment[];
}
