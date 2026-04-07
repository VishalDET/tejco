import { notFound } from "next/navigation"
import { StockTransferView } from "./stock-transfer-view"
import { StockTransfer } from "../types"

// Mock fetch function
async function getTransfer(id: string): Promise<StockTransfer | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Return mock data
  const mockTransfers: StockTransfer[] = [
    {
        id: "1",
        transferId: "TRX-1001",
        date: "2026-03-20",
        reason: "Stock Redistribution",
        status: "Completed",
        sourceWarehouseId: "w1",
        sourceStorageId: "s1",
        destinationWarehouseId: "w2",
        destinationStorageId: "s3",
        items: [
            { id: "i1", productId: "p1", productName: "Surgical Blade #10", sku: "SB-010-G", quantity: 50, unit: "Box" },
            { id: "i2", productId: "p2", productName: "Medical Gauze (Sterile)", sku: "MG-ST-100", quantity: 20, unit: "Pack" }
        ],
        createdAt: "2026-03-20T10:00:00Z",
        updatedAt: "2026-03-21T14:30:00Z"
    },
    {
        id: "2",
        transferId: "TRX-1002",
        date: "2026-03-24",
        reason: "Damaged Stock - Return to HQ",
        status: "In Transit",
        sourceWarehouseId: "w2",
        sourceStorageId: "s4",
        destinationWarehouseId: "w1",
        destinationStorageId: "s2",
        items: [
            { id: "i3", productId: "p3", productName: "Antiseptic Solution 500ml", sku: "AS-500", quantity: 5, unit: "Bottle" }
        ],
        createdAt: "2026-03-24T09:15:00Z",
        updatedAt: "2026-03-24T09:15:00Z"
    }
  ]

  return mockTransfers.find(t => t.id === id) || null
}

export default async function StockTransferDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const transfer = await getTransfer(params.id)

  if (!transfer) {
    notFound()
  }

  return <StockTransferView transfer={transfer} />
}
