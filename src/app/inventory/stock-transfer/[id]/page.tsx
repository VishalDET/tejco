import * as React from "react"
import { useParams } from "react-router-dom"
import { StockTransferView } from "./stock-transfer-view"
import { StockTransfer } from "../types"
import { Loader } from "@/components/ui/loader"

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

export default function StockTransferDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [transfer, setTransfer] = React.useState<StockTransfer | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!id) return
    const found = mockTransfers.find(t => t.id === id) || null
    setTransfer(found)
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader layout="container" size="lg" text="Loading stock transfer..." />
      </div>
    )
  }

  if (!transfer) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-2">
        <h2 className="text-xl font-bold">Stock Transfer Not Found</h2>
        <p className="text-muted-foreground">The requested stock transfer record could not be loaded.</p>
      </div>
    )
  }

  return <StockTransferView transfer={transfer} />
}
