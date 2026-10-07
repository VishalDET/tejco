import * as React from "react"
import { useParams } from "react-router-dom"
import { StockTransferView } from "./stock-transfer-view"
import { StockTransfer, mapApiStockTransfer } from "../types"
import { Loader } from "@/components/ui/loader"
import { stockTransfersApi } from "@/lib/api"
import { apiClient } from "@/lib/api-client"

const mockTransfers: StockTransfer[] = [
  {
      id: "1",
      transferId: "TRX-1001",
      date: "2026-03-20",
      reason: "Stock Redistribution",
      status: "Completed",
      sourceWarehouseId: "3",
      sourceWarehouseName: "AMORE COMMERCIAL",
      sourceStorageId: "0",
      destinationWarehouseId: "4",
      destinationWarehouseName: "Shree Industrial  Centre",
      destinationStorageId: "0",
      items: [
          { id: "i1", productId: "127", productName: "Slitting Devices-Cut To Side Blade(per pcs)", sku: "CUT-SIDE-01", quantity: 50, unit: "pcs" },
          { id: "i2", productId: "128", productName: "Slitting Devices-Disposable Slitter", sku: "SLIT-DISP-01", quantity: 20, unit: "pcs" }
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
      sourceWarehouseId: "4",
      sourceWarehouseName: "Shree Industrial  Centre",
      sourceStorageId: "0",
      destinationWarehouseId: "3",
      destinationWarehouseName: "AMORE COMMERCIAL",
      destinationStorageId: "0",
      items: [
          { id: "i3", productId: "129", productName: "Disposable Slitter 0.9mm", sku: "SLIT-0.9", quantity: 5, unit: "pcs" }
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

    let isSubscribed = true
    setLoading(true)

    async function loadTransfer() {
      try {
        const [transferRes, whRes, prodRes] = await Promise.all([
          stockTransfersApi.getById(id).catch(() => null),
          apiClient.get<any>("/api/Warehouse").catch(() => ({ data: [] })),
          apiClient.get<any>("/api/Product/GetAll").catch(() => ({ data: [] })),
        ])

        const warehouses = Array.isArray(whRes?.data) ? whRes.data : []
        const products = Array.isArray(prodRes?.data) ? prodRes.data : []

        if (!isSubscribed) return

        if (transferRes && (transferRes.success || transferRes.data)) {
          const raw = transferRes.data || transferRes
          setTransfer(mapApiStockTransfer(raw, warehouses, products))
        } else {
          // Fallback to mock transfers for demo IDs
          const found = mockTransfers.find(t => t.id === id || t.transferId === id) || null
          setTransfer(found)
        }
      } catch (err) {
        console.error("Failed to load transfer by id:", err)
        if (isSubscribed) {
          const found = mockTransfers.find(t => t.id === id || t.transferId === id) || null
          setTransfer(found)
        }
      } finally {
        if (isSubscribed) setLoading(false)
      }
    }

    loadTransfer()

    return () => {
      isSubscribed = false
    }
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

  return <StockTransferView transfer={transfer} transferId={id} />
}
