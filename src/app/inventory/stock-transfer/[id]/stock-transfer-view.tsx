import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Printer,
  FileDown,
  Edit,
  Boxes,
  Warehouse,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Calendar,
  Info,
  MapPin,
  ClipboardList,
  RefreshCw,
  Loader2,
  ChevronDown
} from "lucide-react"
import { StockTransfer, TransferStatus, mapApiStockTransfer } from "../types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeliveryChallan, GatePass } from "../components/print-templates"
import { executePrint } from "@/components/common/print"
import { stockTransfersApi } from "@/lib/api"
import { apiClient } from "@/lib/api-client"
import { StockTransferDialog } from "../stock-transfer-dialog"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"

interface StockTransferViewProps {
  transfer?: StockTransfer | null
  transferId?: string | number
}

export function StockTransferView({ transfer: initialTransfer, transferId }: StockTransferViewProps) {
  const navigate = useNavigate()
  const params = useParams()
  const effectiveId = transferId || initialTransfer?.id || params?.id

  const [transfer, setTransfer] = React.useState<StockTransfer | null>(initialTransfer || null)
  const [isLoading, setIsLoading] = React.useState(!initialTransfer && !!effectiveId)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const challanPrintRef = React.useRef<HTMLDivElement>(null)
  const gatePassPrintRef = React.useRef<HTMLDivElement>(null)

  const handleStatusChange = async (newStatus: TransferStatus) => {
    if (!effectiveId) return
    setIsUpdatingStatus(true)
    try {
      await stockTransfersApi.updateStatus(effectiveId, newStatus)
      setTransfer((prev) => (prev ? { ...prev, status: newStatus } : null))
      toast.success(`Transfer status updated to ${newStatus}`)
      fetchTransferDetails(true)
    } catch (err: any) {
      console.error("Failed to update stock transfer status:", err)
      toast.error(err?.message || `Failed to update status to ${newStatus}`)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchTransferDetails = React.useCallback(async (silent = false) => {
    if (!effectiveId) return

    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const [res, whRes, prodRes] = await Promise.all([
        stockTransfersApi.getById(effectiveId).catch(() => null),
        apiClient.get<any>("/api/Warehouse").catch(() => ({ data: [] })),
        apiClient.get<any>("/api/Product/GetAll").catch(() => ({ data: [] })),
      ])

      const warehouses = Array.isArray(whRes?.data) ? whRes.data : []
      const products = Array.isArray(prodRes?.data) ? prodRes.data : []

      if (res && (res.success || res.data)) {
        const raw = res.data || res
        setTransfer(mapApiStockTransfer(raw, warehouses, products))
        if (silent) toast.success("Transfer details refreshed")
      }
    } catch (err: any) {
      console.error("Failed to fetch transfer details from GET /api/Inventory/StockTransfers/{id}:", err)
      if (silent) toast.error("Failed to refresh transfer details")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [effectiveId])

  React.useEffect(() => {
    if (initialTransfer) {
      setTransfer(initialTransfer)
    } else if (effectiveId) {
      fetchTransferDetails()
    }
  }, [initialTransfer, effectiveId, fetchTransferDetails])

  const handlePrint = (type: "challan" | "gatepass") => {
    if (!transfer) return
    if (type === "challan") {
      executePrint(challanPrintRef.current, {
        documentTitle: `Delivery Challan - ${transfer.transferId}`,
        pageOrientation: "portrait",
      })
    } else {
      executePrint(gatePassPrintRef.current, {
        documentTitle: `Gate Pass - ${transfer.transferId}`,
        pageOrientation: "portrait",
      })
    }
  }

  const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
      case "Draft": return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-none">Draft</Badge>
      case "Pending": return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">Pending Approval</Badge>
      case "In Transit": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">In Transit</Badge>
      case "Completed": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Completed</Badge>
      case "Cancelled": return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader layout="container" size="lg" text="Loading stock transfer details..." />
      </div>
    )
  }

  if (!transfer) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold">Stock Transfer Record Not Found</h2>
        <p className="text-muted-foreground text-sm">Unable to locate the stock transfer record with ID: {effectiveId}</p>
        <Button variant="outline" onClick={() => navigate("/inventory/stock-transfer")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stock Transfers
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{transfer.transferId}</h1>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 focus:outline-none group cursor-pointer"
                      disabled={isUpdatingStatus}
                    >
                      {getStatusBadge(transfer.status)}
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  }
                />
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusChange("Draft")} disabled={transfer.status === "Draft" || isUpdatingStatus}>
                    <Clock className="h-4 w-4 mr-2 text-slate-500" /> Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("Pending")} disabled={transfer.status === "Pending" || isUpdatingStatus}>
                    <Clock className="h-4 w-4 mr-2 text-amber-500" /> Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("In Transit")} disabled={transfer.status === "In Transit" || isUpdatingStatus}>
                    <Truck className="h-4 w-4 mr-2 text-blue-500" /> In Transit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange("Completed")} disabled={transfer.status === "Completed" || isUpdatingStatus}>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> Completed
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusChange("Cancelled")} disabled={transfer.status === "Cancelled" || isUpdatingStatus} className="text-destructive">
                    <AlertCircle className="h-4 w-4 mr-2 text-destructive" /> Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Transfer initiated on {isMounted ? new Date(transfer.date).toLocaleDateString("en-GB") : transfer.date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => fetchTransferDetails(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handlePrint("challan")}>
            <Printer className="h-4 w-4" /> Print Challan
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handlePrint("gatepass")}>
            <Truck className="h-4 w-4" /> Print Gate Pass
          </Button>
          <Button className="gap-2" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4" /> Edit Transfer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Routing Visualization */}
          <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-slate-50/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="h-4 w-4" />
                <h3 className="font-bold text-xs uppercase tracking-wider">Transfer Routing</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between relative px-8">
                {/* Connector Line */}
                <div className="absolute top-[26px] left-[15%] right-[15%] h-[2px] bg-dashed border-b-2 border-slate-200 border-dashed z-0" />

                <div className="relative z-10 flex flex-col items-center gap-3 group">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-amber-100 group-hover:border-amber-300 transition-colors">
                    <Warehouse className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">SOURCE</div>
                    <div className="font-bold text-sm">{transfer.sourceWarehouseName || transfer.sourceWarehouseId}</div>
                    <div className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {transfer.sourceStorageId || "General Storage"}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 bg-white p-2 rounded-full shadow-sm border border-slate-100 rotate-0">
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-3 group">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-blue-100 group-hover:border-blue-300 transition-colors">
                    <Warehouse className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">DESTINATION</div>
                    <div className="font-bold text-sm">{transfer.destinationWarehouseName || transfer.destinationWarehouseId}</div>
                    <div className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {transfer.destinationStorageId || "General Storage"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transfered Products</CardTitle>
                <CardDescription>Detailed list of items in this stock movement.</CardDescription>
              </div>
              <div className="bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
                <span className="text-xs text-muted-foreground uppercase font-bold mr-2">Total Quantity:</span>
                <span className="font-bold text-primary">{transfer.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfer.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{item.productName}</div>
                        {(item.variantName || item.size) && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            {item.variantName && <span>{item.variantName}</span>}
                            {item.size && item.size !== item.variantName && (
                              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.size}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{item.sku}</TableCell>
                      <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          {transfer.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-slate-400" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 italic leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                  "{transfer.notes}"
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Status Tracker */}
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-4">
              <CardTitle className="text-sm uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Live Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 relative">
              <div className="space-y-8">
                <div className="flex gap-4 group">
                  <div className="relative flex flex-col items-center">
                    <div className="z-10 bg-emerald-100 p-1.5 rounded-full border-2 border-white shadow-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="absolute top-7 w-[2px] h-10 bg-emerald-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Transfer Initiated</div>
                    <div className="text-[10px] text-muted-foreground">{isMounted ? new Date(transfer.createdAt).toLocaleString() : ""}</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className={`z-10 ${transfer.status === 'In Transit' || transfer.status === 'Completed' ? 'bg-blue-100 p-1.5 rounded-full border-2 border-white shadow-sm' : 'bg-slate-100 p-1.5 rounded-full border-2 border-white shadow-sm'}`}>
                      <Truck className={`h-4 w-4 ${transfer.status === 'In Transit' || transfer.status === 'Completed' ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div className={`absolute top-7 w-[2px] h-10 ${transfer.status === 'Completed' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${transfer.status === 'In Transit' || transfer.status === 'Completed' ? '' : 'text-slate-400'}`}>In Transit</div>
                    <div className="text-[10px] text-muted-foreground">{transfer.status === 'In Transit' || transfer.status === 'Completed' ? `Dispatched to ${transfer.destinationWarehouseName || 'Destination'}` : '--'}</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div className={`z-10 ${transfer.status === 'Completed' ? 'bg-emerald-100 p-1.5 rounded-full border-2 border-white shadow-sm' : 'bg-slate-100 p-1.5 rounded-full border-2 border-white shadow-sm'}`}>
                      <Boxes className={`h-4 w-4 ${transfer.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${transfer.status === 'Completed' ? '' : 'text-slate-400'}`}>Received & Validated</div>
                    <div className="text-[10px] text-muted-foreground">{transfer.status === 'Completed' ? (isMounted ? new Date(transfer.updatedAt).toLocaleString() : "") : '--'}</div>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="pt-4 mt-6 border-t flex flex-col gap-2">
                {transfer.status === "Draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 text-xs"
                    onClick={() => handleStatusChange("Pending")}
                    disabled={isUpdatingStatus}
                  >
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> Submit for Approval
                  </Button>
                )}
                {(transfer.status === "Draft" || transfer.status === "Pending") && (
                  <Button
                    size="sm"
                    className="w-full gap-2 text-xs"
                    onClick={() => handleStatusChange("In Transit")}
                    disabled={isUpdatingStatus}
                  >
                    <Truck className="h-3.5 w-3.5" /> Dispatch / Start Transit
                  </Button>
                )}
                {transfer.status === "In Transit" && (
                  <Button
                    size="sm"
                    className="w-full gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleStatusChange("Completed")}
                    disabled={isUpdatingStatus}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Receive & Validate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transfer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transfer Reason</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <div className="text-sm font-medium text-amber-900">{transfer.reason}</div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Created By</label>
                  <div className="text-sm font-medium">Warehouse Admin</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Auth ID</label>
                  <div className="text-sm font-medium">TRX-{transfer.id || "01"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Hidden Print Area using Common PrintLayout ── */}
      <div id="stock-transfer-print-area" className="hidden">
        <DeliveryChallan transfer={transfer} containerRef={challanPrintRef} />
        <GatePass transfer={transfer} containerRef={gatePassPrintRef} />
      </div>

      {/* Edit Transfer Dialog */}
      <StockTransferDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        transfer={transfer}
        onSave={(updated) => {
          setTransfer((prev) => (prev ? { ...prev, ...updated } : null))
          fetchTransferDetails(true)
        }}
      />
    </div>
  )
}
