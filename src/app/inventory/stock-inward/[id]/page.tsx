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
  RotateCcw,
  Printer,
  FileText,
  ShieldCheck,
  Tag,
  User,
  History,
  Lock,
  AlertTriangle,
  XCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import { InwardBarcodePrintModal } from "@/components/inventory/inward-barcode-print-modal"

export default function StockInwardDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [order, setOrder] = useState<InwardOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [scanning, setScanning] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [flaggedScans, setFlaggedScans] = useState<Array<{
    barcode: string
    time: string
    reason: string
  }>>([])

  const isCompleted = order?.status === "Completed"
  const allItemsVerified = Boolean(
    order?.items &&
    order.items.length > 0 &&
    order.items.every(item => (item.receivedQty ?? item.receivedQuantity ?? 0) >= (item.expectedQty ?? item.expectedQuantity ?? 0))
  )
  const totalExpected = order?.items?.reduce((acc, i) => acc + (i.expectedQty ?? i.expectedQuantity ?? 0), 0) || 0
  const totalReceived = order?.items?.reduce((acc, i) => acc + (i.receivedQty ?? i.receivedQuantity ?? 0), 0) || 0
  const isScanningRestricted = Boolean(isCompleted || (totalExpected > 0 && totalReceived >= totalExpected) || allItemsVerified)
  const totalOrderValue = order?.items?.reduce((acc, i) => {
    const p = i.purchasePrice ?? i.unitPrice ?? i.unitCost ?? 0
    return acc + p * (i.receivedQty || i.expectedQty || 1)
  }, 0) || 0

  // Helper to match scanned barcode against inward order line items
  const isBarcodeInOrder = (barcode: string) => {
    const target = (barcode || "").toLowerCase().trim()
    if (!target || !order?.items) return null
    return (
      order.items.find(i => {
        const b = (i.barcode || "").toLowerCase().trim()
        const lb = (i.lotBarcode || "").toLowerCase().trim()
        const ln = (i.lotNumber || "").toLowerCase().trim()
        const sku = (i.sku || "").toLowerCase().trim()
        const inGenerated = i.generatedBarcodes?.some(gb => (gb || "").toLowerCase().trim() === target)
        return b === target || lb === target || ln === target || sku === target || Boolean(inGenerated)
      }) || null
    )
  }

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
    const trimmed = barcodeInput.trim()
    if (!trimmed || !id || !order) return

    // Restriction 1: If total quantity is met or order completed, block scanning
    if (isScanningRestricted) {
      toast.error(
        isCompleted
          ? "This order is marked Completed. Barcode scanning is locked."
          : `Total inward quantity met (${totalReceived}/${totalExpected} units received). Scanning is restricted.`
      )
      setBarcodeInput("")
      return
    }

    // Restriction 2: Check if scanned barcode belongs to any line item in this inward order
    const matchedItem = isBarcodeInOrder(trimmed)

    if (!matchedItem) {
      // Barcode is NOT present in this inward order: Do NOT count it, and flag it!
      const errorMsg = `Barcode "${trimmed}" is NOT present in this inward order! Scan rejected & not counted.`
      toast.error(errorMsg, { duration: 5000 })
      setFlaggedScans(prev => [
        {
          barcode: trimmed,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          reason: "Barcode does not match any product, variant, lot, or SKU in this inward order"
        },
        ...prev
      ])
      setBarcodeInput("")
      return
    }

    // Restriction 3: Check if item is already fully received
    const expQty = matchedItem.expectedQty ?? matchedItem.expectedQuantity ?? 0
    const recQty = matchedItem.receivedQty ?? matchedItem.receivedQuantity ?? 0
    if (recQty >= expQty) {
      toast.error(
        `Quantity limit reached for "${matchedItem.productName}" (${recQty}/${expQty} units received). Scan rejected.`
      )
      setBarcodeInput("")
      return
    }
    setScanning(true)
    try {
      const scanEvent: InwardScanEvent = {
        inwardOrderId: parseInt(id),
        barcode: trimmed,
        scannedQuantity: 1
      }
      await stockInwardApi.scan(id, scanEvent)
      toast.success(`Verified: ${matchedItem.productName} (${trimmed})`)
      setBarcodeInput("")
      fetchOrderDetails()
    } catch (err: any) {
      toast.error(err?.message || `Failed to verify barcode ${trimmed}`)
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
        newStatus: newStatus,
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



  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 font-mono">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left: Back button + Title & Badges + Subtitle */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/inventory/stock-inward")}
            className="h-9 w-9 shrink-0 mt-0.5 rounded-lg border-border/80 hover:bg-muted cursor-pointer transition-colors shadow-2xs"
            title="Back to Stock Inward List"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
                Inward Order: {order.orderNumber || order.inwardNumber}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant={isCompleted ? "default" : "outline"}
                  className={`font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${isCompleted
                    ? "bg-emerald-600 text-white hover:bg-emerald-600"
                    : order.status === "Pending"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                      : "bg-muted text-muted-foreground border-border"
                    }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {order.status}
                </Badge>
                {/* {order.priority && (
                  <Badge variant="outline" className="font-mono text-[10px] uppercase font-semibold text-muted-foreground">
                    {order.priority} Priority
                  </Badge>
                )} */}
                {(order.poNumber || (order.orderNumber?.includes("PO-") ? order.orderNumber.replace(/^INW-/, "") : null)) && (
                  <Badge className="font-mono text-[10px] font-semibold bg-primary/10 text-primary border-primary/30">
                    PO: {order.poNumber || order.orderNumber?.replace(/^INW-/, "")}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                Inward Date:{" "}
                <span className="font-semibold text-foreground">
                  {order.orderDate || order.inwardDate
                    ? new Date(order.orderDate || order.inwardDate || "").toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })
                    : "—"}
                </span>
              </span>
              {order.receiverName && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span>
                    Received By: <span className="font-semibold text-foreground">{order.receiverName}</span>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-start md:mt-0.5">
          {/* Print Barcodes Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBarcodeModalOpen(true)}
            className="h-9 font-mono text-xs border-primary/40 text-primary hover:bg-primary/10 cursor-pointer shadow-2xs gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Barcodes</span>
          </Button>

          {!isCompleted && (
            <Button
              size="sm"
              disabled={statusUpdating}
              onClick={() => handleStatusChange("Completed")}
              className={`h-9 font-mono text-xs text-white cursor-pointer shadow-xs font-semibold gap-1.5 ${allItemsVerified
                ? "bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-500/30"
                : "bg-emerald-700 hover:bg-emerald-600"
                }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Complete Inward</span>
            </Button>
          )}

          {!isCompleted ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/inventory/stock-inward/${id}/edit`)}
              className="h-9 font-mono text-xs cursor-pointer shadow-2xs"
            >
              Edit Order
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Cannot edit an inward order that is already Completed"
              className="h-9 font-mono text-xs opacity-50 cursor-not-allowed shadow-2xs"
            >
              Order Locked
            </Button>
          )}
        </div>
      </div>

      {/* Action Banner for Fully Verified Pending Orders */}
      {allItemsVerified && !isCompleted && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">All {totalExpected} units scanned and verified!</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                Ready to complete the receipt. Completing will activate pre-allocated inventory lots and increment warehouse stock.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleStatusChange("Completed")}
            disabled={statusUpdating}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer font-semibold shrink-0 shadow-sm"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Complete Order Now
          </Button>
        </div>
      )}

      {/* Safety Alert for Completed Orders */}
      {isCompleted && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">
              Order Completed — Stock activated, lots generated & locked from modifications.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/inventory/units")}
            className="h-7 text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 cursor-pointer self-start sm:self-auto"
          >
            View Physical Stock →
          </Button>
        </div>
      )}

      {/* Metadata Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-primary" />
              Vendor Partner
            </span>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-sm font-bold font-mono text-foreground truncate" title={order.vendorName}>
              {order.vendorName || `Vendor #${order.vendorId}`}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">
              Ref: {order.poNumber || order.referenceNumber || (order.orderNumber?.includes("PO-") ? order.orderNumber.replace(/^INW-/, "") : "Direct Receipt")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <Warehouse className="h-3.5 w-3.5 text-primary" />
              Destination Warehouse
            </span>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-sm font-bold font-mono text-foreground truncate" title={order.warehouseName?.replace(/\s+/g, " ")}>
              {(order.warehouseName || `Warehouse #${order.warehouseId}`)?.replace(/\s+/g, " ")}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              Code: {order.warehouseCode || `WH-${order.warehouseId}`}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Receiver & Priority
            </span>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-sm font-bold font-mono text-foreground truncate">
              {order.receiverName || "Admin Staff"}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              Priority: <span className="font-semibold text-foreground">{order.priority || "Normal"}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1 pt-3 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Verification Progress
            </span>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <p className="text-sm font-bold font-mono text-foreground">
              {totalReceived} / {totalExpected} Units Received
            </p>
            <p className={`text-[11px] font-mono ${allItemsVerified ? "text-emerald-600 font-semibold" : "text-amber-600"}`}>
              {allItemsVerified ? "✓ All items fully verified" : `${Math.max(totalExpected - totalReceived, 0)} units pending verification`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Barcode Scanning Console */}
      <Card className={`shadow-xs border transition-all ${isScanningRestricted
        ? "border-emerald-500/40 bg-emerald-500/5"
        : "border-primary/30 bg-primary/5"
        }`}>
        <CardHeader className="pb-2 pt-4 px-4 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold font-mono flex items-center gap-2 text-foreground">
              {isScanningRestricted ? (
                <Lock className="h-4 w-4 text-emerald-600" />
              ) : (
                <Barcode className="h-4 w-4 text-primary" />
              )}
              Live Barcode & Serial Verification Console
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-mono">
              {isScanningRestricted
                ? "Barcode scanning is locked because total inward quantity has been fulfilled."
                : "Scan package barcodes or serial labels to verify items and increment received quantities."}
            </CardDescription>
          </div>
          {isScanningRestricted ? (
            <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Scanning Restricted
            </Badge>
          ) : (
            <Badge variant="outline" className="font-mono text-[10px] bg-primary/10 text-primary border-primary/30 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Active Console
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pt-4 px-4 space-y-3">
          {/* Restriction Alert Banner when Total Quantity is Met or Order is Completed */}
          {isScanningRestricted && (
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs">
              <Lock className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  {isCompleted ? "Order Marked as Completed" : "Total Expected Quantity Met (100% Received)"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isCompleted
                    ? "This inward order has been finalized. Further barcode scans are prohibited."
                    : `All ${totalExpected} expected units have been received (${totalReceived}/${totalExpected}). Scanning has been locked to prevent over-receiving.`}
                </p>
              </div>
            </div>
          )}

          {/* Barcode Input Form */}
          <form onSubmit={handleScanSubmit} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Input
                placeholder={
                  isScanningRestricted
                    ? "Scanning locked (all quantities verified)..."
                    : "Scan barcode or serial number..."
                }
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                disabled={scanning || isScanningRestricted}
                className="text-xs font-mono bg-background pl-8 disabled:opacity-60"
                autoFocus={!isScanningRestricted}
              />
              <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
            <Button
              type="submit"
              disabled={scanning || isScanningRestricted || !barcodeInput.trim()}
              className="font-mono text-xs cursor-pointer bg-primary text-primary-foreground disabled:opacity-50"
            >
              {scanning ? (
                "Verifying..."
              ) : isScanningRestricted ? (
                <>
                  <Lock className="mr-1.5 h-3.5 w-3.5" /> Locked
                </>
              ) : (
                "Verify Scan"
              )}
            </Button>
          </form>

          {/* Flagged / Unrecognized Barcodes Alert */}
          {flaggedScans.length > 0 && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-300 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  {flaggedScans.length} Flagged / Unrecognized Scan{flaggedScans.length > 1 ? "s" : ""}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFlaggedScans([])}
                  className="h-6 text-[10px] text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 px-2 cursor-pointer font-mono"
                >
                  Clear Flagged
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                The following barcode{flaggedScans.length > 1 ? "s do" : " does"} not belong to this inward order and were <strong>rejected & not counted</strong>:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {flaggedScans.map((f, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="font-mono text-[10px] bg-background text-rose-600 dark:text-rose-400 border-rose-500/30 flex items-center gap-1"
                  >
                    <XCircle className="h-3 w-3 text-rose-500 shrink-0" />
                    <span>{f.barcode}</span>
                    <span className="text-muted-foreground ml-1">({f.time})</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items & Variants Verification Table */}
      <Card className="shadow-xs border border-border">
        <CardHeader className="pb-3 pt-4 px-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Inbound Line Items, Variants & QC Inspection
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-mono">
              Review received items, variant specifications, lots, and verification statuses.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {totalOrderValue > 0 && (
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
                Total Value: ₹{totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBarcodeModalOpen(true)}
              className="text-xs font-mono cursor-pointer"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Print Stickers
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Product / SKU</th>
                  <th className="py-2.5 px-4">Variant Spec</th>
                  <th className="py-2.5 px-4">Lot / Barcode</th>
                  <th className="py-2.5 px-4 text-center">Expected</th>
                  <th className="py-2.5 px-4 text-center">Received</th>
                  <th className="py-2.5 px-4">Rack Location</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">QC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items?.map((item, idx) => {
                  const expQty = item.expectedQty ?? item.expectedQuantity ?? 0
                  const recQty = item.receivedQty ?? item.receivedQuantity ?? 0
                  const isComplete = recQty >= expQty
                  const price = item.purchasePrice ?? item.unitPrice ?? item.unitCost ?? 0
                  return (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        <div>{item.productName || `Product #${item.productId}`}</div>
                        <div className="text-[10px] text-muted-foreground">{item.sku || "-"}</div>
                      </td>
                      <td className="py-3 px-4">
                        {item.variantName ? (
                          <Badge variant="outline" className="text-primary font-mono text-[10px]">
                            {item.variantName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <Tag className="h-3 w-3 text-amber-600 shrink-0" />
                            <span className="font-mono text-xs">
                              {item.lotNumber || item.barcode || `LOT-${order.orderNumber?.slice(-5) || "01"}`}
                            </span>
                          </div>
                          {item.barcode && item.barcode !== item.lotNumber && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Barcode: {item.barcode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{expQty}</td>
                      <td className="py-3 px-4 text-center font-bold text-primary">{recQty}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {item.warehouseName && (
                          <div className="text-[10px] text-primary font-semibold">{item.warehouseName}</div>
                        )}
                        <span>{item.locationCode || "RACK-A1"}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        ₹{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isComplete ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                            {expQty - recQty} Pending
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

      {/* Physical Scan Audit Log */}
      <Card className="shadow-xs border border-border">
        <CardHeader className="pb-3 pt-4 px-4 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Physical Scan Audit Log ({order.scanHistory?.length || 0} Events)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-mono">
              Chronological log of barcode and serial scans processed for this inward receipt.
            </CardDescription>
          </div>
          {order.scanHistory && order.scanHistory.length > 0 && (
            <Badge variant="outline" className="font-mono text-[10px]">
              Latest scan: {new Date(order.scanHistory[0].scannedAt || "").toLocaleTimeString()}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {!order.scanHistory || order.scanHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground font-mono">
              No barcode scans recorded yet. Use the scan console above to verify items.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Scanned Barcode</th>
                    <th className="py-2.5 px-4">Matched Line Item</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4 text-right">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.scanHistory.map((scan, idx) => {
                    const matchedItem = isBarcodeInOrder(scan.barcode || "")
                    const isFlagged = !matchedItem

                    return (
                      <tr
                        key={scan.scanId || idx}
                        className={`transition-colors ${isFlagged
                          ? "bg-rose-500/[0.04] hover:bg-rose-500/[0.08]"
                          : "hover:bg-muted/30"
                          }`}
                      >
                        <td className="py-2.5 px-4 text-muted-foreground">
                          {scan.scanId ? `#${scan.scanId}` : idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-bold">
                          <div className="flex items-center gap-1.5">
                            {isFlagged ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                            ) : (
                              <Barcode className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                            <span className={isFlagged ? "text-rose-600 dark:text-rose-400" : "text-foreground"}>
                              {scan.barcode}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          {matchedItem ? (
                            <div>
                              <span className="font-semibold text-foreground">{matchedItem.productName}</span>
                              {matchedItem.variantName && (
                                <span className="text-muted-foreground text-[10px] ml-1">
                                  ({matchedItem.variantName})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 text-[11px]">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              Not in Inward Order (Diff Barcode)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground">
                          {scan.scannedAt
                            ? new Date(scan.scannedAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })
                            : "-"}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {isFlagged ? (
                            <Badge
                              variant="outline"
                              className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-mono text-[10px]"
                            >
                              <XCircle className="h-3 w-3 mr-1 text-rose-600" />
                              Flagged / Unrecognized
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-mono text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inward Barcode Print Modal */}
      <InwardBarcodePrintModal
        open={isBarcodeModalOpen}
        onOpenChange={setIsBarcodeModalOpen}
        order={order}
      />
    </div>
  )
}
