import { Vendor } from "./types"

export const MOCK_VENDORS: Vendor[] = [
  {
    id: "v-1",
    name: "Acme Components Ltd.",
    contactPerson: "Rajesh Kumar",
    email: "rajesh@acmecomponents.in",
    phone: "+91 9876543210",
    address: "123 Industrial Area, Phase 1, New Delhi, 110020",
    gstin: "07AABCA1234Z1Z5",
    status: "Active",
    products: [
      { id: "p-1", name: "Steel Tube 20mm", sku: "ST-20MM", unit: "meter", price: 150 },
      { id: "p-2", name: "Copper Wire 2.5sqmm", sku: "CW-2.5", unit: "roll", price: 1200 },
    ],
    purchaseHistory: [
      { id: "ph-1", poNumber: "PO-2026-001", date: "2026-01-15", amount: 45000, status: "Completed" },
      { id: "ph-2", poNumber: "PO-2026-024", date: "2026-02-28", amount: 12500, status: "Completed" },
      { id: "ph-3", poNumber: "PO-2026-056", date: "2026-03-20", amount: 28000, status: "Pending" },
    ],
    payments: [
      { id: "pay-1", date: "2026-01-20", amount: 45000, reference: "NEFT-SBI-12345", method: "Bank Transfer" },
      { id: "pay-2", date: "2026-03-05", amount: 12500, reference: "CHQ-001234", method: "Cheque" },
    ]
  },
  {
    id: "v-2",
    name: "Global Packaging Solutions",
    contactPerson: "Anita Sharma",
    email: "anita.s@globalpack.in",
    phone: "+91 8765432109",
    address: "Plot 45, MIDC Andheri East, Mumbai, 400093",
    gstin: "27AABCG5678Q1Z9",
    status: "Active",
    products: [
      { id: "p-3", name: "Corrugated Box Medium", sku: "CB-M", unit: "box", price: 45 },
      { id: "p-4", name: "Bubble Wrap Roll", sku: "BW-R", unit: "roll", price: 850 },
    ],
    purchaseHistory: [
      { id: "ph-4", poNumber: "PO-2026-012", date: "2026-02-10", amount: 15400, status: "Completed" },
    ],
    payments: [
      { id: "pay-3", date: "2026-02-15", amount: 15400, reference: "UPI-ICICI-98765", method: "UPI" },
    ]
  },
  {
    id: "v-3",
    name: "Reliable Polymers",
    contactPerson: "Vikram Singh",
    email: "sales@reliablepoly.com",
    phone: "+91 7654321098",
    address: "Shed No 12, GIDC, Ahmedabad, 380024",
    gstin: "24AABCR9012R1Z2",
    status: "Inactive",
    products: [
      { id: "p-5", name: "Plastic Granules HDPE", sku: "PG-HDPE", unit: "kg", price: 110 },
    ],
    purchaseHistory: [
      { id: "ph-5", poNumber: "PO-2025-115", date: "2025-11-20", amount: 55000, status: "Completed" },
    ],
    payments: [
      { id: "pay-4", date: "2025-12-05", amount: 55000, reference: "NEFT-HDFC-34567", method: "Bank Transfer" },
    ]
  }
]
