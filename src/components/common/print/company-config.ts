export interface CompanyPrintInfo {
  name: string
  legalName?: string
  tagline?: string
  logoUrl?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  gstin?: string
  pan?: string
  cin?: string
  email?: string
  phone?: string
  website?: string
  bankDetails?: {
    title?: string
    bankName?: string
    accountName?: string
    accountNumber?: string
    accountType?: string
    ifscCode?: string
    branch?: string
    lines?: string[]
  }
}

export const DEFAULT_TEJCO_COMPANY: CompanyPrintInfo = {
  name: "TEJCO GLOBAL LLP",
  legalName: "TEJCO GLOBAL LLP",
  tagline: "Hair • Skin • Optics",
  logoUrl: "/assets/images/tejco_sidebar_logo.png",
  addressLine1: "A404, Amore Commercial Premises Junction of 2nd & 4th Rd",
  addressLine2: "Khar, Ram Krishna Nagar, Khar West",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400052",
  country: "India",
  gstin: "27AAUFT6646F1ZJ",
  email: "contactus@tejcovision.com",
  phone: "+91 9820096805",
  website: "www.tejcoglobal.com",
  bankDetails: {
    title: "INR BANK DETAILS",
    accountName: "TEJCO GLOBAL LLP",
    bankName: "Indian Overseas Bank",
    branch: "Bandra (West), Mumbai – 400 050",
    accountNumber: "012800000002727",
    accountType: "Current Account",
    ifscCode: "IOBA0000128",
    lines: [
      "Name of Company: TEJCO GLOBAL LLP",
      "Bank: Indian Overseas Bank",
      "Branch Name: Bandra (West), Mumbai – 400 050",
      "Bank Account No: 012800000002727",
      "Type of Account: Current Account",
      "IFSC Code: IOBA0000128",
    ],
  },
}
