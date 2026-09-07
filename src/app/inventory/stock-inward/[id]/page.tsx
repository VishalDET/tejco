import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { stockInwardApi } from "@/lib/api"
import type { InwardOrder, InwardScanEvent } from "../types"
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  Package,
  Building,
  Warehouse,
  Clock,
  AlertCircle,
  Barcode,
  Save,
  RotateCcw
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"

export default function StockInwardDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [order, setOrder] = useState<InwardOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [scanning, setScanning] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const fetchOrderDetails = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await stockInwardApi.getById(id)
      const data = (res as any)?.data || res
      setOrder(data)
    } catch (err: any) {
      toast.error(err?.message || "Failed to load Stock Inward details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetails()
  }, [id])

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim() || !id || !order) return

    setScanning(true)
    try {
      const scanEvent: InwardScanEvent = {
        inwardOrderId: parseInt(id),
        barcode: barcodeInput.trim(),
        scannedQuantity: 1
      }
      await stockInwardApi.scan(id, scanEvent)
      toast.success(`Scanned barcode: ${barcodeInput}`)
      setBarcodeInput("")
      fetchOrderDetails()
    } catch (err: any) {
      toast.error(err?.message || `Failed to verify barcode ${barcodeInput}`)
    } finally {
      setScanning(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !order) return
    setStatusUpdating(true)
    try {
      await stockInwardApi.updateStatus(id, {
        id: parseInt(id),
        status: newStatus,
        comments: `Status updated to ${newStatus} from details view`
      })
      toast.success(`Order status updated to ${newStatus}`)
      fetchOrderDetails()
    } catch (err: any) {
      toast.error(err?.message || `Failed to update status to ${newStatus}`)
    } finally {
      setStatusUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader layout="container" size="md" text="Loading Inward Receipt & Verification Data..." />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="py-12 text-center text-muted-foreground font-mono text-xs">
        Stock Inward record not found.
      </div>
    )
  }

  const allItemsVerified = order.items?.every(item => (item.receivedQty ?? item.receivedQuantity ?? 0) >= (item.expectedQty ?? item.expectedQuantity ?? 0))

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/inventory/stock-inward")} className="h-8 w-8 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono tracking-tight text-foreground">
                Inward Order: {order.orderNumber || order.inwardNumber}
              </h1>
              <Badge variant="outline" className="font-mono">{order.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Inward Date: {order.orderDate || order.inwardDate ? new Date(order.orderDate || order.inwardDate || "").toLocaleDateString("en-IN") : "-"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.status !== "Received" && (
            <Button
              size="sm"
              disabled={statusUpdating}
              onClick={() => handleStatusChange("Received")}
              className="font-mono text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Mark as Received & Add Stock
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/inventory/stock-inward/add`)}
            className="font-mono text-xs cursor-pointer"
          >
            Edit Order
          </Button>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Vendor Partner</span>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-sm font-bold font-mono text-foreground">{order.vendorName || `Vendor #${order.vendorId}`}</p>
            <p className="text-[11px] text-muted-foreground font-mono">Ref PO: {order.referenceNumber || "N/A"}</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Destination Warehouse</span>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-sm font-bold font-mono text-foreground">{order.warehouseName || `Warehouse #${order.warehouseId}`}</p>
            <p className="text-[11px] text-muted-foreground font-mono">Status: {order.status}</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Verification Progress</span>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-sm font-bold font-mono text-foreground">
              {order.items?.reduce((acc, i) => acc + (i.receivedQty ?? i.receivedQuantity ?? 0), 0)} / {order.items?.reduce((acc, i) => acc + (i.expectedQty ?? i.expectedQuantity ?? 0), 0)} Units Verified
            </p>
            <p className="text-[11px] text-emerald-600 font-mono">
              {allItemsVerified ? "All items fully verified" : "Pending barcode scans"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Barcode Scanning Console */}
      <Card className="shadow-xs border border-primary/30 bg-primary/5">
        <CardHeader className="pb-2 pt-4 px-4 border-b border-primary/10">
          <CardTitle className="text-sm font-bold font-mono text-primary flex items-center gap-2">
            <Barcode className="h-4 w-4" />
            Live Barcode & Serial Verification Console
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-mono">
            Scan hardware serials or package barcodes to auto-increment received quantities.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 px-4">
          <form onSubmit={handleScanSubmit} className="flex gap-2 max-w-md">
            <Input
              placeholder="Scan barcode or serial number..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="text-xs font-mono bg-background"
              autoFocus
            />
            <Button type="submit" disabled={scanning} className="font-mono text-xs cursor-pointer bg-primary text-primary-foreground">
              {scanning ? "Verifying..." : "Verify Scan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Items Verification Table */}
      <Card className="shadow-xs border border-border">
        <CardHeader className="pb-3 pt-4 px-4 border-b border-border">
          <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Inbound Line Items & Quantities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Product / SKU</th>
                  <th className="py-2.5 px-4">Expected Qty</th>
                  <th className="py-2.5 px-4">Received Qty</th>
                  <th className="py-2.5 px-4">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items?.map((item, idx) => {
                  const expQty = item.expectedQty ?? item.expectedQuantity ?? 0
                  const recQty = item.receivedQty ?? item.receivedQuantity ?? 0
                  const isComplete = recQty >= expQty
                  return (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {item.productName || `Product #${item.productId}`}
                      </td>
                      <td className="py-3 px-4 font-bold">{expQty}</td>
                      <td className="py-3 px-4 font-bold text-primary">{recQty}</td>
                      <td className="py-3 px-4">₹{(item.unitPrice || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        {isComplete ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                            {expQty - recQty} Units Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
