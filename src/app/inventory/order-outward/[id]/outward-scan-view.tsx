"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  MapPin,
  Package,
  PackageCheck,
  RotateCcw,
  ScanBarcode,
  Truck,
  Warehouse,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getItemScanStatus,
  getOutwardProgress,
  type OutwardOrder,
  type OutwardScanEvent,
  type OutwardStatus,
  type ScanResultType,
} from "../types"
import { orderOutwardApi } from "@/lib/api"

interface OutwardScanViewProps {
  order: OutwardOrder
}

function cloneOrder(order: OutwardOrder): OutwardOrder {
  return {
    ...order,
    items: order.items.map((item) => ({ ...item })),
    scanHistory: order.scanHistory.map((event) => ({ ...event })),
  }
}

function getStatusBadge(status: OutwardStatus) {
  switch (status) {
    case "Ready":
      return <Badge className="border-none bg-blue-100 text-blue-800 hover:bg-blue-100">Ready</Badge>
    case "Scanning":
      return <Badge className="border-none bg-sky-100 text-sky-800 hover:bg-sky-100">Scanning</Badge>
    case "Partially Scanned":
      return <Badge className="border-none bg-amber-100 text-amber-800 hover:bg-amber-100">Partially Scanned</Badge>
    case "Completed":
      return <Badge className="border-none bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Completed</Badge>
    case "Exception":
      return <Badge className="border-none bg-red-100 text-red-800 hover:bg-red-100">Exception</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getScanEventStyles(type: ScanResultType) {
  switch (type) {
    case "success":
      return {
        icon: CheckCircle2,
        className: "border-emerald-200 bg-emerald-50 text-emerald-900",
        iconClassName: "text-emerald-600",
      }
    case "warning":
      return {
        icon: AlertTriangle,
        className: "border-amber-200 bg-amber-50 text-amber-900",
        iconClassName: "text-amber-600",
      }
    default:
      return {
        icon: XCircle,
        className: "border-red-200 bg-red-50 text-red-900",
        iconClassName: "text-red-600",
      }
  }
}

function getItemBadge(status: ReturnType<typeof getItemScanStatus>) {
  switch (status) {
    case "Complete":
      return <Badge className="border-none bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Complete</Badge>
    case "Partial":
      return <Badge className="border-none bg-amber-100 text-amber-800 hover:bg-amber-100">Partial</Badge>
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}

export function OutwardScanView({ order }: OutwardScanViewProps) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [outwardOrder, setOutwardOrder] = React.useState<OutwardOrder>(() => cloneOrder(order))
  const [barcodeValue, setBarcodeValue] = React.useState("")
  const [latestEvent, setLatestEvent] = React.useState<OutwardScanEvent | null>(
    order.scanHistory[0] ?? null
  )

  const progress = getOutwardProgress(outwardOrder)
  const isDispatchReady = progress.isComplete
  const eventStyles = latestEvent ? getScanEventStyles(latestEvent.type) : null
  const LatestIcon = eventStyles?.icon

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function addScanEvent(event: Omit<OutwardScanEvent, "id" | "timestamp">) {
    const scanEvent: OutwardScanEvent = {
      ...event,
      id: `scan-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }

    setLatestEvent(scanEvent)
    return scanEvent
  }

  function resolveStatus(
    currentOrder: OutwardOrder,
    items: OutwardOrder["items"],
    eventType: ScanResultType
  ): OutwardStatus {
    if (eventType === "error") return "Exception"

    const nextProgress = getOutwardProgress({ ...currentOrder, items })
    if (nextProgress.isComplete) return "Completed"
    if (nextProgress.scannedQty > 0) return "Partially Scanned"
    return "Scanning"
  }

  async function handleScan(rawBarcode?: string) {
    const barcode = (rawBarcode ?? barcodeValue).trim()
    if (!barcode) return

    // Check item index to register appropriate scan status to server
    const itemIndex = outwardOrder.items.findIndex((item) => item.barcode === barcode)
    
    // Register scan event on server
    try {
      const scanType = itemIndex === -1 ? "Error" : "Pick"
      await orderOutwardApi.scanBarcode(outwardOrder.id, {
        outwardOrderId: outwardOrder.outwardOrderId || parseInt(outwardOrder.id) || 0,
        barcode,
        scanType,
        message: itemIndex === -1 ? "Barcode not found in this order" : "Product scanned successfully",
        scannedAt: new Date().toISOString()
      })
    } catch (apiErr) {
      console.warn("Failed to register scan on server:", apiErr)
    }

    setOutwardOrder((currentOrder) => {
      const idx = currentOrder.items.findIndex((item) => item.barcode === barcode)

      if (idx === -1) {
        const event = addScanEvent({
          barcode,
          message: "Barcode not found in this order",
          type: "error",
        })
        toast.error(event.message)
        return {
          ...currentOrder,
          status: "Exception",
          scanHistory: [event, ...currentOrder.scanHistory],
        }
      }

      const item = currentOrder.items[idx]
      if (item.scannedQty >= item.orderedQty) {
        const event = addScanEvent({
          barcode,
          productName: item.productName,
          message: `${item.productName} is already fully scanned`,
          type: "warning",
        })
        toast.warning(event.message)
        return {
          ...currentOrder,
          scanHistory: [event, ...currentOrder.scanHistory],
        }
      }

      const nextItems = currentOrder.items.map((currentItem, index) =>
        index === idx
          ? { ...currentItem, scannedQty: currentItem.scannedQty + 1 }
          : currentItem
      )

      const nextItem = nextItems[idx]
      const event = addScanEvent({
        barcode,
        productName: item.productName,
        message:
          nextItem.scannedQty === nextItem.orderedQty
            ? `${item.productName} completed`
            : `${nextItem.scannedQty} of ${nextItem.orderedQty} ${item.productName} scanned`,
        type: "success",
      })

      toast.success(event.message)
      const nextStatus = resolveStatus(currentOrder, nextItems, "success")
      
      // Auto-update status on server if we transition to Completed or Partially Scanned
      orderOutwardApi.updateStatus(
        currentOrder.id, 
        nextStatus === "Completed" ? "Picked" : "Picking", 
        `Scanned ${barcode}`
      ).catch(err => console.warn("Failed to update status on server:", err))

      return {
        ...currentOrder,
        status: nextStatus,
        items: nextItems,
        scanHistory: [event, ...currentOrder.scanHistory],
      }
    })

    setBarcodeValue("")
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    handleScan()
  }

  async function handleCompleteOutward() {
    try {
      // Create outward order record only when scanning is completed
      const payload = {
        outwardOrderId: 0,
        orderId: outwardOrder.orderId ? Number(outwardOrder.orderId) : parseInt(outwardOrder.id) || 0,
        orderNumber: outwardOrder.orderNumber,
        clientName: outwardOrder.clientName,
        warehouseName: outwardOrder.warehouseName,
        warehouseCode: outwardOrder.warehouseCode,
        shippingAddress: outwardOrder.shippingAddress,
        orderDate: outwardOrder.orderDate,
        promisedDate: outwardOrder.promisedDate,
        status: "Completed",
        priority: outwardOrder.priority || "Normal",
        pickerName: outwardOrder.pickerName || "Warehouse Operator",
        items: outwardOrder.items.map((item) => ({
          outwardOrderItemId: 0,
          outwardOrderId: 0,
          productId: parseInt(item.productId) || 0,
          productName: item.productName,
          variantName: item.variantName || "",
          sku: item.sku,
          barcode: item.barcode,
          orderedQty: item.orderedQty,
          scannedQty: item.scannedQty,
          locationCode: item.locationCode || "A-1"
        })),
        scanHistory: outwardOrder.scanHistory.map((sh) => ({
          scanId: 0,
          outwardOrderId: 0,
          barcode: sh.barcode,
          message: sh.message,
          scanType: sh.scanType || "Pick",
          productName: sh.productName || "",
          scannedAt: sh.timestamp
        }))
      }

      const created = await orderOutwardApi.create(payload)
      const responseData = (created as any)?.data || created
      const finalId = responseData?.outwardOrderId || responseData?.id || outwardOrder.id

      // Update status to Picked
      await orderOutwardApi.updateStatus(finalId, "Picked", "All items scanned and completed via scan console")
      
      setOutwardOrder((currentOrder) => ({
        ...currentOrder,
        id: String(finalId),
        status: "Completed",
      }))
      toast.success("Order outward created and verified on server")
    } catch (apiErr) {
      console.warn("Failed to create/complete outward on server:", apiErr)
      setOutwardOrder((currentOrder) => ({
        ...currentOrder,
        status: "Completed",
      }))
      toast.success("Order outward completed locally")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{outwardOrder.orderNumber}</h1>
              {getStatusBadge(outwardOrder.status)}
              <Badge variant="outline" className="gap-1">
                <Warehouse className="h-3.5 w-3.5" />
                {outwardOrder.warehouseCode}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Outscanning for {outwardOrder.clientName} from {outwardOrder.warehouseName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button className="gap-2" disabled={!isDispatchReady} onClick={handleCompleteOutward}>
            <Truck className="h-4 w-4" />
            Complete Outward
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            disabled={!isDispatchReady}
            onClick={() => router.push(`/inventory/dispatch/${outwardOrder.id}`)}
          >
            <PackageCheck className="h-4 w-4" />
            Create Dispatch
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Scanned</p>
                <p className="mt-2 text-2xl font-bold">{progress.scannedQty}/{progress.totalQty}</p>
              </div>
              <ScanBarcode className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Pending</p>
                <p className="mt-2 text-2xl font-bold">{progress.pendingQty}</p>
              </div>
              <Package className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Items</p>
                <p className="mt-2 text-2xl font-bold">{outwardOrder.items.length}</p>
              </div>
              <ClipboardCheck className="h-6 w-6 text-sky-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Promise</p>
                <p className="mt-2 text-2xl font-bold">{new Date(outwardOrder.promisedDate).toLocaleDateString("en-GB")}</p>
              </div>
              <Clock3 className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Scan Console</CardTitle>
                  <CardDescription>Scan each product barcode against the order pick list.</CardDescription>
                </div>
                <Progress value={progress.percent} className="min-w-[240px] lg:w-[320px]">
                  <ProgressLabel>Outward progress</ProgressLabel>
                  <span className="ml-auto text-sm text-muted-foreground tabular-nums">{progress.percent}%</span>
                </Progress>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="barcode-scan">Barcode scanner input</Label>
                  <div className="relative">
                    <ScanBarcode className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      id="barcode-scan"
                      value={barcodeValue}
                      onChange={(event) => setBarcodeValue(event.target.value)}
                      placeholder="Scan or type barcode and press Enter"
                      className="h-11 pl-10 font-mono text-base"
                    />
                  </div>
                </div>
                <Button type="submit" className="h-11 self-end gap-2">
                  <Check className="h-4 w-4" />
                  Validate Scan
                </Button>
              </form>

              <div className="flex flex-wrap gap-2">
                {outwardOrder.items.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    className="gap-2 font-mono text-xs"
                    onClick={() => handleScan(item.barcode)}
                  >
                    <ScanBarcode className="h-3.5 w-3.5" />
                    {item.barcode}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => handleScan("UNKNOWN-442")}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Try wrong barcode
                </Button>
              </div>

              {latestEvent && LatestIcon && (
                <Alert className={eventStyles?.className}>
                  <LatestIcon className={eventStyles.iconClassName} />
                  <AlertTitle>{latestEvent.productName ?? latestEvent.barcode}</AlertTitle>
                  <AlertDescription>{latestEvent.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pick List</CardTitle>
              <CardDescription>Locations and quantities required for this outward order.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU / Barcode</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Scanned</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outwardOrder.items.map((item) => {
                    const pendingQty = Math.max(item.orderedQty - item.scannedQty, 0)
                    const itemProgress = item.orderedQty === 0 ? 0 : Math.round((item.scannedQty / item.orderedQty) * 100)

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">{item.variantName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{item.sku}</div>
                          <div className="font-mono text-xs text-muted-foreground">{item.barcode}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1 font-mono">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.locationCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.orderedQty}</TableCell>
                        <TableCell className="text-right font-semibold">{item.scannedQty}</TableCell>
                        <TableCell className="text-right">{pendingQty}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {getItemBadge(getItemScanStatus(item))}
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${itemProgress}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Client</Label>
                <div className="font-medium">{outwardOrder.clientName}</div>
              </div>
              <Separator />
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Shipping Address</Label>
                <div className="mt-1 text-sm leading-relaxed">{outwardOrder.shippingAddress}</div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Picker</Label>
                  <div className="text-sm font-medium">{outwardOrder.pickerName ?? "Unassigned"}</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Warehouse</Label>
                  <div className="text-sm font-medium">{outwardOrder.warehouseCode}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Scan History</CardTitle>
                <CardDescription>Most recent events first.</CardDescription>
              </div>
              <PackageCheck className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {outwardOrder.scanHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No scans yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {outwardOrder.scanHistory.slice(0, 8).map((event) => {
                    const styles = getScanEventStyles(event.type)
                    const EventIcon = styles.icon

                    return (
                      <div key={event.id} className="flex gap-3 rounded-lg border p-3">
                        <div className="mt-0.5">
                          <EventIcon className={`h-4 w-4 ${styles.iconClassName}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{event.message}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{event.barcode}</span>
                            <span>{new Date(event.timestamp).toLocaleTimeString("en-GB")}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
