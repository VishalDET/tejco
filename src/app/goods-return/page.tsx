import * as React from "react"
import {
  RotateCcw,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Edit,
  ShieldCheck,
  Receipt,
  Warehouse,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import {
  returnApi,
  warehousesApi,
  type ReturnRequestDto,
} from "@/lib/api"
import type { ReturnRequest, ReturnStatus } from "./types"
import { ReturnIntakeDialog } from "./return-intake-dialog"
import { ReturnDetailsDialog } from "./return-details-dialog"

export default function GoodsReturnIndexPage() {
  const { hasPermission } = useAuth()
  const canCreate =
    hasPermission("Returns.Create") ||
    hasPermission("GoodsReturn.Create")
  const canEdit =
    hasPermission("Returns.Edit") ||
    hasPermission("GoodsReturn.Edit")
  const canApprove =
    hasPermission("Returns.Approve") ||
    hasPermission("GoodsReturn.Edit") ||
    hasPermission("SalesOrders.Approve")

  // Data State
  const [returnRequests, setReturnRequests] = React.useState<ReturnRequest[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Masters
  const [warehouses, setWarehouses] = React.useState<any[]>([])

  // Filters & Tabs
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [warehouseFilter, setWarehouseFilter] = React.useState<string>("all")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [pageNumber, setPageNumber] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Dialog states
  const [intakeDialogOpen, setIntakeDialogOpen] = React.useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false)
  const [selectedReturn, setSelectedReturn] = React.useState<ReturnRequest | null>(null)

  // Load warehouses
  React.useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const res = await warehousesApi.getAll()
        const list = Array.isArray(res) ? res : (res as any)?.data || []
        setWarehouses(list)
      } catch (err) {
        console.error("Failed to load warehouses:", err)
      }
    }
    loadWarehouses()
  }, [])

  // Fetch Return Requests
  const fetchData = React.useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true)
      else setIsLoading(true)

      try {
        const res = await returnApi.getAll({
          pageNumber,
          pageSize,
          searchTerm: searchTerm.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          warehouseId:
            warehouseFilter === "all" || isNaN(Number(warehouseFilter))
              ? undefined
              : Number(warehouseFilter),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        })

        const list = res?.data && Array.isArray(res.data) ? (res.data as any) : []
        setReturnRequests(list)
        setTotalCount(res?.totalCount || list.length)
      } catch (err: any) {
        console.error("Failed to fetch return requests:", err)
        toast.error(
          err?.info?.message ||
            err?.message ||
            "Failed to load return requests data."
        )
        setReturnRequests([])
        setTotalCount(0)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [pageNumber, pageSize, searchTerm, statusFilter, warehouseFilter, startDate, endDate]
  )

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusTabChange = (val: string) => {
    setStatusFilter(val)
    setPageNumber(1)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setWarehouseFilter("all")
    setStartDate("")
    setEndDate("")
    setPageNumber(1)
  }

  const hasActiveFilters = Boolean(
    searchTerm || warehouseFilter !== "all" || startDate || endDate
  )

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const openIntakeModal = (req?: ReturnRequest) => {
    setSelectedReturn(req || null)
    setIntakeDialogOpen(true)
  }

  const openDetailsModal = (req: ReturnRequest) => {
    setSelectedReturn(req)
    setDetailsDialogOpen(true)
  }

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approved
          </Badge>
        )
      case "submitted":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-none gap-1">
            <Clock className="h-3 w-3" /> Submitted
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" /> Draft
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-none gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status || "Draft"}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-lg">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Goods Return & Replacement
              </h1>
              <p className="text-sm text-muted-foreground">
                Dock intake, QC condition tagging, inventory restocking, and auto Credit Note generation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isLoading || isRefreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`}
            />
            Refresh
          </Button>

          {canCreate && (
            <Button
              size="sm"
              onClick={() => openIntakeModal()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              New Return Intake
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Returns
            </span>
            <span className="text-2xl font-bold mt-1 text-foreground block">
              {totalCount}
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Awaiting Approval
            </span>
            <span className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400 block">
              {returnRequests.filter((r) => r.status?.toLowerCase() === "submitted").length}
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Draft Intakes
            </span>
            <span className="text-2xl font-bold mt-1 text-slate-700 dark:text-slate-300 block">
              {returnRequests.filter((r) => r.status?.toLowerCase() === "draft").length}
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Approved & Restocked
            </span>
            <span className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 block">
              {returnRequests.filter((r) => r.status?.toLowerCase() === "approved").length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={handleStatusTabChange} className="w-full">
        <TabsList className="bg-muted/60 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="text-xs">
            All Statuses
          </TabsTrigger>
          <TabsTrigger value="Draft" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Drafts
          </TabsTrigger>
          <TabsTrigger value="Submitted" className="text-xs gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Submitted
          </TabsTrigger>
          <TabsTrigger value="Approved" className="text-xs gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
          </TabsTrigger>
          <TabsTrigger value="Rejected" className="text-xs gap-1.5">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Control Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-5 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by return #, order #, client name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPageNumber(1)
                  }}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="lg:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Warehouse</label>
              <Select
                value={warehouseFilter}
                onValueChange={(val) => {
                  setWarehouseFilter(val || "all")
                  setPageNumber(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((w: any) => (
                    <SelectItem
                      key={w.warehouseId || w.id}
                      value={String(w.warehouseId || w.id)}
                    >
                      {w.warehouseName || w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPageNumber(1)
                }}
                className="h-9 text-xs"
              />
            </div>

            <div className="lg:col-span-1">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-semibold text-xs">Return Number</TableHead>
                <TableHead className="font-semibold text-xs">Sales Order</TableHead>
                <TableHead className="font-semibold text-xs">Client / Doctor</TableHead>
                <TableHead className="font-semibold text-xs">Warehouse & Bin</TableHead>
                <TableHead className="font-semibold text-xs">Return Date</TableHead>
                <TableHead className="font-semibold text-xs">Reason</TableHead>
                <TableHead className="text-right font-semibold text-xs">Amount</TableHead>
                <TableHead className="font-semibold text-xs">Status</TableHead>
                <TableHead className="font-semibold text-xs">Linked Credit Note</TableHead>
                <TableHead className="text-right font-semibold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-36 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading return requests...
                  </TableCell>
                </TableRow>
              ) : returnRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-36 text-center text-muted-foreground italic">
                    {hasActiveFilters
                      ? "No return requests found matching your filters."
                      : "No goods return requests recorded."}
                  </TableCell>
                </TableRow>
              ) : (
                returnRequests.map((req) => {
                  const isApproved = req.status?.toLowerCase() === "approved"
                  const isDraftOrSubmitted =
                    req.status?.toLowerCase() === "draft" ||
                    req.status?.toLowerCase() === "submitted"

                  return (
                    <TableRow key={req.returnId} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                      {/* Return Number */}
                      <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <button
                          type="button"
                          onClick={() => openDetailsModal(req)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {req.returnNumber}
                        </button>
                      </TableCell>

                      {/* Sales Order */}
                      <TableCell className="font-mono text-xs font-medium">
                        {req.orderNumber}
                      </TableCell>

                      {/* Client */}
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{req.clientName}</div>
                      </TableCell>

                      {/* Warehouse & Bin */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {req.warehouseName || `WH #${req.warehouseId}`}
                          </span>
                          {req.locationCode && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {req.locationCode}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Return Date */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {req.returnDate
                          ? new Date(req.returnDate).toLocaleDateString("en-GB")
                          : "—"}
                      </TableCell>

                      {/* Reason */}
                      <TableCell className="text-xs">
                        <span className="text-slate-700 dark:text-slate-300">
                          {req.reasonText || `Reason #${req.reasonId}`}
                        </span>
                      </TableCell>

                      {/* Total Return Amount */}
                      <TableCell className="text-right font-bold text-xs whitespace-nowrap">
                        ₹{Number(req.totalReturnAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(req.status)}</TableCell>

                      {/* Linked Credit Note */}
                      <TableCell className="text-xs">
                        {isApproved && (req.creditNoteNumber || req.creditNoteId) ? (
                          <button
                            type="button"
                            onClick={() => openDetailsModal(req)}
                            className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Receipt className="h-3 w-3" />
                            {req.creditNoteNumber || `CR #${req.creditNoteId}`}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDetailsModal(req)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="View Return Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {isDraftOrSubmitted && canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openIntakeModal(req)}
                              className="h-7 px-2 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 gap-1"
                              title="Edit Return Intake"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setPageNumber(1)
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>
                Showing {(pageNumber - 1) * pageSize + 1} to{" "}
                {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} requests
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber === 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-medium">
                Page {pageNumber} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                disabled={pageNumber >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Intake Dialog */}
      <ReturnIntakeDialog
        open={intakeDialogOpen}
        onOpenChange={setIntakeDialogOpen}
        returnRequest={selectedReturn}
        onSuccess={() => fetchData(true)}
      />

      {/* Details Dialog */}
      <ReturnDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        returnRequest={selectedReturn}
        onSuccess={() => fetchData(true)}
        onEdit={(req) => openIntakeModal(req)}
      />
    </div>
  )
}
