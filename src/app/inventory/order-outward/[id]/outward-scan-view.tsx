
import * as React from "react"
import { useNavigate } from "react-router-dom"
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
  X,
  XCircle,
  Volume2,
  VolumeX,
  Boxes,
  Loader2,
  Sparkles,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  getItemScanStatus,
  getOutwardProgress,
  type OutwardOrder,
  type OutwardScanEvent,
  type OutwardStatus,
  type ScanResultType,
} from "../types"
import { orderOutwardApi, dispatchApi, type OutwardScanResultDto } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import {
  playScanSuccess,
  playItemComplete,
  playOrderComplete,
  playScanError,
  isSoundMuted,
  toggleSound,
} from "@/lib/sound-utils"

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
  const navigate = useNavigate()
  const router = useNavigate()
  const { user } = useAuth()
  const currentUserName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Warehouse Operator"

  const inputRef = React.useRef<HTMLInputElement>(null)
  const [outwardOrder, setOutwardOrder] = React.useState<OutwardOrder>(() => {
    const cloned = cloneOrder(order)
    if (!cloned.pickerName || cloned.pickerName === "Warehouse Operator" || cloned.pickerName === "Unassigned") {
      cloned.pickerName = currentUserName
    }
    return cloned
  })
  const [barcodeValue, setBarcodeValue] = React.useState("")
  const [isScanning, setIsScanning] = React.useState(false)
  const [soundMuted, setSoundMuted] = React.useState<boolean>(() => isSoundMuted())
  const [recentlyScannedId, setRecentlyScannedId] = React.useState<string | null>(null)
  const [showOrderCompleteModal, setShowOrderCompleteModal] = React.useState(false)
  const [latestEvent, setLatestEvent] = React.useState<OutwardScanEvent | null>(
    order.scanHistory[0] ?? null
  )

  const handleToggleSound = () => {
    const next = toggleSound()
    setSoundMuted(next)
    toast.info(next ? "Scan audio cues muted" : "Scan audio cues enabled")
  }

  React.useEffect(() => {
    if (user && (!outwardOrder.pickerName || outwardOrder.pickerName === "Warehouse Operator" || outwardOrder.pickerName === "Unassigned")) {
      const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim()
      if (name) {
        setOutwardOrder(prev => ({ ...prev, pickerName: name }))
      }
    }
  }, [user])

  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = React.useState(false)
  const [isSubmittingDispatch, setIsSubmittingDispatch] = React.useState(false)
  const [dispatchForm, setDispatchForm] = React.useState({
    partnerName: "",
    partnerService: "Standard",
    trackingNumber: "",
    trackingLink: "",
    expectedDeliveryDate: "",
    packageCount: "1",
    grossWeightKg: "",
    freightCharges: "0",
    freightPaymentMode: "Prepaid",
    vehicleNumber: "",
    driverName: "",
    driverPhone: "",
    challanNumber: "",
    invoiceNumber: "",
    ewayBillNumber: "",
    remarks: ""
  })

  async function handleCreateDispatch() {
    if (!dispatchForm.partnerName) {
      toast.error("Please enter a shipping partner name")
      return
    }

    try {
      setIsSubmittingDispatch(true)
      const payload = {
        dispatchId: 0,
        orderId: outwardOrder.orderId ? Number(outwardOrder.orderId) : parseInt(outwardOrder.id) || 0,
        orderNumber: outwardOrder.orderNumber,
        clientName: outwardOrder.clientName,
        warehouseName: outwardOrder.warehouseName,
        warehouseCode: outwardOrder.warehouseCode,
        shippingAddress: outwardOrder.shippingAddress,
        packedAt: new Date().toISOString(),
        partnerName: dispatchForm.partnerName,
        partnerService: dispatchForm.partnerService,
        trackingNumber: dispatchForm.trackingNumber,
        trackingLink: dispatchForm.trackingLink,
        dispatchDate: new Date().toISOString(),
        expectedDeliveryDate: dispatchForm.expectedDeliveryDate ? new Date(dispatchForm.expectedDeliveryDate).toISOString() : new Date().toISOString(),
        packageCount: Number(dispatchForm.packageCount) || 0,
        grossWeightKg: Number(dispatchForm.grossWeightKg) || 0,
        freightCharges: Number(dispatchForm.freightCharges) || 0,
        freightPaymentMode: dispatchForm.freightPaymentMode,
        vehicleNumber: dispatchForm.vehicleNumber,
        driverName: dispatchForm.driverName,
        driverPhone: dispatchForm.driverPhone,
        challanNumber: dispatchForm.challanNumber,
        invoiceNumber: dispatchForm.invoiceNumber,
        ewayBillNumber: dispatchForm.ewayBillNumber,
        shippingLabelRef: "",
        status: "Created",
        remarks: dispatchForm.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: outwardOrder.items.map(item => ({
          dispatchItemId: 0,
          dispatchId: 0,
          productName: item.productName,
          sku: item.sku,
          quantity: item.scannedQty,
          scannedBarcodes: item.scannedBarcodes || []
        })),
        timeline: [
          {
            timelineId: 0,
            dispatchId: 0,
            label: "Created",
            description: `Dispatch record created for order ${outwardOrder.orderNumber} by ${currentUserName}`,
            timestamp: new Date().toISOString(),
            status: "Created"
          }
        ]
      }

      await dispatchApi.create(payload)
      toast.success("Dispatch created successfully!")
      setIsDispatchDialogOpen(false)
      navigate("/inventory/order-outward")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to create dispatch")
    } finally {
      setIsSubmittingDispatch(false)
    }
  }

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

  function handleRemoveScannedBarcode(itemId: string, barcodeToRemove: string) {
    setOutwardOrder((currentOrder) => {
      const nextItems = currentOrder.items.map((item) => {
        if (item.id !== itemId) return item
        const updatedBarcodes = (item.scannedBarcodes || []).filter((b) => b !== barcodeToRemove)
        return {
          ...item,
          scannedQty: Math.max(item.scannedQty - 1, 0),
          scannedBarcodes: updatedBarcodes,
        }
      })

      const event = addScanEvent({
        barcode: barcodeToRemove,
        message: `Removed barcode ${barcodeToRemove} from picked items`,
        type: "warning",
      })
      toast.info(event.message)

      const nextStatus = resolveStatus(currentOrder, nextItems, "warning")
      return {
        ...currentOrder,
        status: nextStatus,
        items: nextItems,
        scanHistory: [event, ...currentOrder.scanHistory],
      }
    })
  }

  function formatIsoDate(dateVal?: any) {
    if (!dateVal) return new Date().toISOString()
    const d = new Date(dateVal)
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }

  async function handleScan(rawBarcode?: string) {
    const barcode = (rawBarcode ?? barcodeValue).trim()
    if (!barcode) return

    const outwardOrderId = Number(outwardOrder.outwardOrderId || outwardOrder.id || 0)
    if (!outwardOrderId) {
      toast.error("Invalid outward order ID")
      return
    }

    setIsScanning(true)
    try {
      // POST /api/OrderOutward/{outwardOrderId}/Scan
      const res = await orderOutwardApi.scanBarcode(outwardOrderId, { barcode })
      const sData = (res as any)?.data || res
      const scanResult: OutwardScanResultDto = sData?.data || sData

      if (!scanResult || scanResult.outwardOrderItemId === undefined) {
        throw new Error(sData?.message || "Invalid scan response received")
      }

      // Match line item by outwardOrderItemId, variantId, productId, or sku
      const itemIndex = outwardOrder.items.findIndex(
        (it) =>
          (scanResult.outwardOrderItemId && Number(it.outwardOrderItemId) === Number(scanResult.outwardOrderItemId)) ||
          (scanResult.variantId && it.variantId === scanResult.variantId) ||
          (scanResult.productId && String(it.productId) === String(scanResult.productId)) ||
          (scanResult.sku && it.sku.toLowerCase() === scanResult.sku.toLowerCase())
      )

      // Update line items with backend-assigned lot number and updated scannedQty
      const nextItems = outwardOrder.items.map((item, idx) => {
        const isMatched =
          (scanResult.outwardOrderItemId && Number(item.outwardOrderItemId) === Number(scanResult.outwardOrderItemId)) ||
          idx === itemIndex
        if (!isMatched) return item

        return {
          ...item,
          scannedQty: scanResult.scannedQty,
          lotNumber: scanResult.lotNumber || item.lotNumber,
          lotId: scanResult.lotId !== undefined ? scanResult.lotId : item.lotId,
          locationCode: scanResult.locationCode || item.locationCode,
          scannedBarcodes: [...(item.scannedBarcodes || []), barcode]
        }
      })

      // Audio cues per API docs (order complete -> fanfare, item complete -> chime, default -> beep)
      if (scanResult.isOrderComplete) {
        playOrderComplete()
      } else if (scanResult.isItemComplete) {
        playItemComplete()
      } else {
        playScanSuccess()
      }

      // Friendly notification message
      const scanMsg = scanResult.isOrderComplete
        ? `Order #${outwardOrder.orderNumber} fully picked and ready for dispatch!`
        : scanResult.isItemComplete
          ? `${scanResult.productName} completed (${scanResult.scannedQty}/${scanResult.orderedQty})`
          : `${scanResult.productName} (${scanResult.scannedQty}/${scanResult.orderedQty}) • Lot: ${scanResult.lotNumber}`

      const event: OutwardScanEvent = {
        id: `scan-${Date.now()}-${Math.random()}`,
        barcode,
        productName: scanResult.productName,
        message: scanMsg,
        type: "success",
        timestamp: new Date().toISOString()
      }

      const nextStatus: OutwardStatus = scanResult.isOrderComplete
        ? "Completed"
        : resolveStatus(outwardOrder, nextItems, "success")

      setLatestEvent(event)
      setOutwardOrder((prev) => ({
        ...prev,
        status: nextStatus,
        items: nextItems,
        scanHistory: [event, ...prev.scanHistory],
      }))

      // Highlight the scanned row
      const matchedRowId = scanResult.outwardOrderItemId ? String(scanResult.outwardOrderItemId) : (itemIndex !== -1 ? outwardOrder.items[itemIndex].id : null)
      if (matchedRowId) {
        setRecentlyScannedId(matchedRowId)
        setTimeout(() => setRecentlyScannedId(null), 2500)
      }

      toast.success(scanMsg)

      if (scanResult.isOrderComplete) {
        setShowOrderCompleteModal(true)
      }
    } catch (err: any) {
      playScanError()
      const errorMsg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        `Barcode '${barcode}' does not match any item in outward order #${outwardOrderId}.`

      const event: OutwardScanEvent = {
        id: `scan-${Date.now()}-${Math.random()}`,
        barcode,
        message: errorMsg,
        type: "error",
        timestamp: new Date().toISOString()
      }

      setLatestEvent(event)
      setOutwardOrder((prev) => ({
        ...prev,
        status: prev.status === "Ready" ? "Scanning" : prev.status,
        scanHistory: [event, ...prev.scanHistory],
      }))

      toast.error(errorMsg)
    } finally {
      setIsScanning(false)
      setBarcodeValue("")
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    handleScan()
  }

  async function handleCompleteOutward() {
    const outwardOrderId = Number(outwardOrder.outwardOrderId || outwardOrder.id || 0)
    try {
      // 1. Sync full payload via PUT Update
      const updatePayload = {
        outwardOrderId,
        orderId: Number(outwardOrder.orderId || 0),
        orderNumber: outwardOrder.orderNumber,
        clientName: outwardOrder.clientName,
        warehouseId: Number(outwardOrder.warehouseId || 0),
        warehouseName: outwardOrder.warehouseName,
        warehouseCode: outwardOrder.warehouseCode,
        shippingAddress: outwardOrder.shippingAddress || "",
        orderDate: formatIsoDate(outwardOrder.orderDate),
        promisedDate: formatIsoDate(outwardOrder.promisedDate),
        status: "Completed",
        priority: outwardOrder.priority || "Normal",
        pickerName: outwardOrder.pickerName || currentUserName,
        freight: Number(outwardOrder.freight || 0),
        createdAt: formatIsoDate(outwardOrder.createdAt),
        updatedAt: new Date().toISOString(),
        items: outwardOrder.items.map((it) => ({
          outwardOrderItemId: Number(it.outwardOrderItemId || 0),
          outwardOrderId,
          productId: Number(it.productId || 0),
          variantId: Number(it.variantId || 0),
          productName: it.productName,
          variantName: it.variantName || "",
          sku: it.sku,
          barcode: it.barcode,
          orderedQty: Number(it.orderedQty || 0),
          scannedQty: Number(it.scannedQty || 0),
          locationCode: it.locationCode || "A-1",
          lotId: it.lotId ? Number(it.lotId) : null,
          lotNumber: it.lotNumber || null
        })),
        scanHistory: outwardOrder.scanHistory.map((sh) => ({
          scanId: Number(sh.scanId || 0),
          outwardOrderId,
          barcode: sh.barcode,
          message: sh.message || " ",
          scanType: sh.scanType || "Pick",
          productName: sh.productName || "",
          scannedAt: formatIsoDate(sh.timestamp)
        }))
      }

      await orderOutwardApi.update(outwardOrderId, updatePayload)

      // 2. PUT /api/OrderOutward/{id}/Status
      await orderOutwardApi.updateStatus(
        outwardOrderId,
        "Completed",
        "Order outward completed successfully by operator"
      )

      setOutwardOrder((currentOrder) => ({
        ...currentOrder,
        status: "Completed",
      }))
      toast.success("Order outward completed successfully!")
    } catch (err: any) {
      console.warn("Failed to complete outward on server:", err)
      setOutwardOrder((currentOrder) => ({
        ...currentOrder,
        status: "Completed",
      }))
      toast.success("Order outward marked completed")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
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
          {outwardOrder.status !== "Completed" && (
            <Button className="gap-2" disabled={!isDispatchReady} onClick={handleCompleteOutward}>
              <Truck className="h-4 w-4" />
              Complete Outward
            </Button>
          )}
          <Dialog open={isDispatchDialogOpen} onOpenChange={setIsDispatchDialogOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={!isDispatchReady}
                >
                  <PackageCheck className="h-4 w-4" />
                  Create Dispatch
                </Button>
              }
            />
            <DialogContent className="w-full sm:max-w-5xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Dispatch Details</DialogTitle>
                <DialogDescription>
                  Enter shipping partner and logistics details to create the dispatch record for order {outwardOrder.orderNumber}.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Logistics Partner */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="partnerName">Shipping Partner *</Label>
                    <Input
                      id="partnerName"
                      placeholder="e.g. Delhivery, BlueDart, DHL"
                      value={dispatchForm.partnerName}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, partnerName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partnerService">Service Type</Label>
                    <Input
                      id="partnerService"
                      placeholder="e.g. Express, Surface, Standard"
                      value={dispatchForm.partnerService}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, partnerService: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Tracking Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trackingNumber">Tracking Number</Label>
                    <Input
                      id="trackingNumber"
                      placeholder="AWB / Tracking ID"
                      value={dispatchForm.trackingNumber}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trackingLink">Tracking Link</Label>
                    <Input
                      id="trackingLink"
                      placeholder="https://..."
                      value={dispatchForm.trackingLink}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, trackingLink: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Dates & Weight */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expectedDeliveryDate">Expected Delivery</Label>
                    <Input
                      id="expectedDeliveryDate"
                      type="date"
                      value={dispatchForm.expectedDeliveryDate}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="packageCount">Package Count</Label>
                    <Input
                      id="packageCount"
                      type="number"
                      min="1"
                      value={dispatchForm.packageCount}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, packageCount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grossWeightKg">Gross Weight (kg)</Label>
                    <Input
                      id="grossWeightKg"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={dispatchForm.grossWeightKg}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, grossWeightKg: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Freight */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="freightCharges">Freight Charges (INR)</Label>
                    <Input
                      id="freightCharges"
                      type="number"
                      value={dispatchForm.freightCharges}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, freightCharges: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Freight Payment Mode</Label>
                    <Select
                      value={dispatchForm.freightPaymentMode}
                      onValueChange={(val) => setDispatchForm(prev => ({ ...prev, freightPaymentMode: val || "Prepaid" }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Payment Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Prepaid">Prepaid</SelectItem>
                        <SelectItem value="To Pay">To Pay</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vehicle & Driver */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                    <Input
                      id="vehicleNumber"
                      placeholder="MH-12-XX-XXXX"
                      value={dispatchForm.vehicleNumber}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverName">Driver Name</Label>
                    <Input
                      id="driverName"
                      value={dispatchForm.driverName}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, driverName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverPhone">Driver Phone</Label>
                    <Input
                      id="driverPhone"
                      placeholder="10-digit number"
                      value={dispatchForm.driverPhone}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, driverPhone: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Documentation */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={dispatchForm.invoiceNumber}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challanNumber">Challan Number</Label>
                    <Input
                      id="challanNumber"
                      value={dispatchForm.challanNumber}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, challanNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ewayBillNumber">E-way Bill Number</Label>
                    <Input
                      id="ewayBillNumber"
                      value={dispatchForm.ewayBillNumber}
                      onChange={(e) => setDispatchForm(prev => ({ ...prev, ewayBillNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    placeholder="Any specific delivery instructions or dispatch notes..."
                    value={dispatchForm.remarks}
                    onChange={(e) => setDispatchForm(prev => ({ ...prev, remarks: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDispatchDialogOpen(false)} disabled={isSubmittingDispatch}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDispatch} disabled={isSubmittingDispatch} className="gap-2">
                  {isSubmittingDispatch ? "Creating..." : "Confirm & Dispatch"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            <CardHeader className="py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Scan Console</CardTitle>
                  <CardDescription>Scan each product barcode against the order pick list.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleSound}
                    className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    title={soundMuted ? "Unmute scan audio cues" : "Mute scan audio cues"}
                  >
                    {soundMuted ? (
                      <>
                        <VolumeX className="h-3.5 w-3.5 text-rose-500" />
                        <span>Muted</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Sound On</span>
                      </>
                    )}
                  </Button>
                  <Progress value={progress.percent} className="min-w-[180px] lg:w-[240px]">
                    <ProgressLabel>Outward progress</ProgressLabel>
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">{progress.percent}%</span>
                  </Progress>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 py-4">
              <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="barcode-scan">Barcode scanner input</Label>
                    <span className="text-[11px] text-muted-foreground">Auto-focus active for physical scanners</span>
                  </div>
                  <div className="relative">
                    <ScanBarcode className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      ref={inputRef}
                      id="barcode-scan"
                      value={barcodeValue}
                      disabled={isScanning}
                      onChange={(event) => setBarcodeValue(event.target.value)}
                      placeholder="Scan variant barcode, composite lot barcode, lot number, or SKU..."
                      className="h-11 pl-10 font-mono text-base"
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isScanning || !barcodeValue.trim()}
                  className="h-11 self-end gap-2 min-w-[140px]"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Validate Scan
                    </>
                  )}
                </Button>
              </form>

              {/* Supported Barcode Formats Pills */}
              <div className="rounded-lg bg-muted/40 p-2.5 border text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Supported Formats:
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-background px-2 py-0.5 font-medium border text-muted-foreground text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Variant Barcode
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-background px-2 py-0.5 font-medium border text-muted-foreground text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Composite Lot Barcode
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-background px-2 py-0.5 font-medium border text-muted-foreground text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    Lot Number
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-background px-2 py-0.5 font-medium border text-muted-foreground text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Product SKU
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">Quick test:</span>
                {outwardOrder.items.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    disabled={isScanning}
                    className="gap-2 font-mono text-xs"
                    onClick={() => handleScan(item.barcode)}
                  >
                    <ScanBarcode className="h-3.5 w-3.5" />
                    {item.barcode}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isScanning}
                  className="gap-2 text-xs"
                  onClick={() => handleScan("UNKNOWN-442")}
                >
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
            <CardHeader className="py-4">
              <CardTitle>Pick List</CardTitle>
              <CardDescription>Locations and quantities required for this outward order.</CardDescription>
            </CardHeader>
            <CardContent className="py-4">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU / Barcode</TableHead>
                    <TableHead>Lot Number</TableHead>
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
                    const isRecentlyScanned =
                      recentlyScannedId === item.id ||
                      (item.outwardOrderItemId && recentlyScannedId === String(item.outwardOrderItemId))

                    return (
                      <TableRow
                        key={item.id}
                        className={
                          isRecentlyScanned
                            ? "bg-emerald-500/10 dark:bg-emerald-500/15 transition-colors duration-500"
                            : "transition-colors duration-200"
                        }
                      >
                        <TableCell>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">{item.variantName}</div>
                          {item.scannedBarcodes && item.scannedBarcodes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.scannedBarcodes.map((bc, bIdx) => (
                                <span
                                  key={bIdx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-700 border border-emerald-500/30"
                                >
                                  <Check className="h-2.5 w-2.5" />
                                  {bc}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveScannedBarcode(item.id, bc)}
                                    className="hover:text-destructive ml-0.5 cursor-pointer"
                                    title="Remove this scanned unit"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{item.sku}</div>
                          <div className="font-mono text-xs text-muted-foreground">{item.barcode}</div>
                        </TableCell>
                        <TableCell>
                          {item.lotNumber ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 shadow-2xs">
                              <Boxes className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span>{item.lotNumber}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground italic">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                              Auto FIFO on scan
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1 font-mono">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.locationCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.orderedQty}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            item.scannedQty >= item.orderedQty ? "text-emerald-600 dark:text-emerald-400 font-bold" : ""
                          }`}
                        >
                          {item.scannedQty}
                        </TableCell>
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
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Order Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-4">
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
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-lg">Scan History</CardTitle>
                <CardDescription>Most recent events first.</CardDescription>
              </div>
              <PackageCheck className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="py-4">
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

      {/* Order Complete Celebration & Dispatch Prompt Modal */}
      <Dialog open={showOrderCompleteModal} onOpenChange={setShowOrderCompleteModal}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-2">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-xl font-bold text-center">
              Picking Completed!
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              All items for Outward Order #{outwardOrder.orderNumber} have been successfully verified and assigned to FIFO lots.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 rounded-lg border bg-muted/40 p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-semibold">{outwardOrder.clientName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Total Units Picked:</span>
              <span className="font-semibold text-emerald-600">{progress.scannedQty} / {progress.totalQty} (100%)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Picker:</span>
              <span className="font-medium">{outwardOrder.pickerName || "Warehouse Staff"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Warehouse:</span>
              <span className="font-medium">{outwardOrder.warehouseCode}</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setShowOrderCompleteModal(false)}
            >
              Review Pick List
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setShowOrderCompleteModal(false)
                setIsDispatchDialogOpen(true)
              }}
            >
              <PackageCheck className="h-4 w-4" />
              Proceed to Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
