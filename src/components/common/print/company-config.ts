export interface BankDetailsInfo {
  title?: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  accountType?: string
  ifscCode?: string
  swiftCode?: string
  bicCode?: string
  micrCode?: string
  branch?: string
  address?: string
  city?: string
  state?: string
  country?: string
  lines?: string[]
}

export interface CompanyBankDetails extends BankDetailsInfo {
  domestic: BankDetailsInfo
  international: BankDetailsInfo
}

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
  bankDetails?: CompanyBankDetails
}

export const DOMESTIC_BANK_DETAILS: BankDetailsInfo = {
  title: "IOB BANK DETAILS (DOMESTIC / INR)",
  accountName: "TEJCO GLOBAL LLP",
  bankName: "Indian Overseas Bank",
  branch: "Bandra (West), Mumbai – 400 050.",
  accountNumber: "012802000002727",
  accountType: "Current Account",
  ifscCode: "IOBA0000128",
  swiftCode: "IOBAINBB128",
  bicCode: "IOBAINBB128",
  micrCode: "400020006",
  address: "Indian Overseas Bank, Radhaswami Apts. 36th Road, Bandra West, Mumbai, Maharashtra – 400050.",
  city: "Greater Mumbai",
  state: "Maharashtra",
  country: "India",
  lines: [
    "Name of the Company: TEJCO GLOBAL LLP",
    "Bank Name: Indian Overseas Bank",
    "Branch Name: Bandra (West), Mumbai – 400 050.",
    "Bank Account No: 012802000002727",
    "Type of Account: Current Account",
    "IFSC Code: IOBA0000128",
    "BIC Code (Swift): IOBAINBB128",
    "MICR Code: 400020006",
    "Address: Indian Overseas Bank, Radhaswami Apts. 36th Road, Bandra West, Mumbai, Maharashtra – 400050.",
    "City: Greater Mumbai",
    "State: Maharashtra",
    "Country: India",
  ],
}

export const INTERNATIONAL_BANK_DETAILS: BankDetailsInfo = {
  title: "IOB BANK DETAILS (INTERNATIONAL / EEFC)",
  accountName: "TEJCO GLOBAL LLP",
  bankName: "Indian Overseas Bank",
  branch: "Bandra (West), Mumbai – 400 050.",
  accountNumber: "012802000043734",
  accountType: "EEFC Account",
  ifscCode: "IOBA0000128",
  swiftCode: "IOBAINBB128",
  bicCode: "IOBAINBB128",
  micrCode: "400020006",
  address: "Indian Overseas Bank, Radhaswami Apts. 36th Road, Bandra West, Mumbai, Maharashtra – 400050.",
  city: "Greater Mumbai",
  state: "Maharashtra",
  country: "India",
  lines: [
    "Name of the Company: TEJCO GLOBAL LLP",
    "Bank Name: Indian Overseas Bank",
    "Branch Name: Bandra (West), Mumbai – 400 050.",
    "Bank Account No: 012802000043734",
    "Type of Account: EEFC Account",
    "IFSC Code: IOBA0000128",
    "BIC Code (Swift): IOBAINBB128",
    "MICR Code: 400020006",
    "Address: Indian Overseas Bank, Radhaswami Apts. 36th Road, Bandra West, Mumbai, Maharashtra – 400050.",
    "City: Greater Mumbai",
    "State: Maharashtra",
    "Country: India",
  ],
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
    domestic: DOMESTIC_BANK_DETAILS,
    international: INTERNATIONAL_BANK_DETAILS,
    ...DOMESTIC_BANK_DETAILS,
  },
}
