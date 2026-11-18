import * as React from "react"
import { Link } from "react-router-dom"
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Receipt,
  FileCheck,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Clock,
  Truck,
  IndianRupee,
  Building,
  Eye,
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
  accountsApi,
  usersApi,
  type InvoicingQueueItem,
} from "@/lib/api"
import { GenerateInvoiceDialog } from "./generate-invoice-dialog"
import { CommercialAdjustDialog } from "./commercial-adjust-dialog"

export default function InvoicesPage() {
  const { hasPermission } = useAuth()
  const canGenerateInvoice =
    hasPermission("Sales.Invoice.Generate") ||
    hasPermission("SalesOrders.Edit") ||
    hasPermission("SalesOrders.Approve")
  const canAdjustCommercial =
    hasPermission("Sales.Commercial.Edit") || hasPermission("SalesOrders.Edit")

  // Data state
  const [items, setItems] = React.useState<InvoicingQueueItem[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Tab & Filters
  const [activeTab, setActiveTab] = React.useState<"queue" | "invoiced">("queue")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [pageNumber, setPageNumber] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  // Dialog states
  const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = React.useState(false)
  const [selectedOrder, setSelectedOrder] = React.useState<InvoicingQueueItem | null>(null)

  // User name cache for invoicedBy
  const [userNames, setUserNames] = React.useState<Record<string, string>>({})
  const userCacheRef = React.useRef<Record<string, string>>({})

  React.useEffect(() => {
    const rawIds = items
      .map((item) => (item.invoicedBy != null ? String(item.invoicedBy).trim() : ""))
      .filter(Boolean)

    const numericIdsToFetch = Array.from(
      new Set(
        rawIds.filter((id) => /^\d+$/.test(id) && !userCacheRef.current[id])
      )
    )

    if (numericIdsToFetch.length === 0) return

    numericIdsToFetch.forEach((id) => {
      userCacheRef.current[id] = `User #${id}`
    })

    let isMounted = true

    Promise.allSettled(
      numericIdsToFetch.map(async (id) => {
        try {
          const res = await usersApi.getById(id)
          const userData = res?.data ?? res
          const fullName =
            (userData?.name ||
              `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim()) ||
            userData?.username ||
            userData?.userName ||
            userData?.email ||
            `User #${id}`
          return { id, name: fullName }
        } catch (err) {
          console.error(`Failed to fetch user #${id}:`, err)
          return { id, name: `User #${id}` }
        }
      })
    ).then((results) => {
      if (!isMounted) return
      const updates: Record<string, string> = {}
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value) {
          userCacheRef.current[r.value.id] = r.value.name
          updates[r.value.id] = r.value.name
        }
      })
      if (Object.keys(updates).length > 0) {
        setUserNames((prev) => ({ ...prev, ...updates }))
      }
    })

    return () => {
      isMounted = false
    }
  }, [items])

  const getUserDisplayName = React.useCallback(
    (invoicedBy: string | number | null | undefined): string => {
      if (invoicedBy == null || invoicedBy === "") return "—"
      const str = String(invoicedBy).trim()
      if (!/^\d+$/.test(str)) return str
      return userNames[str] || userCacheRef.current[str] || `User #${str}`
    },
    [userNames]
  )

  const fetchData = React.useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true)
      else setIsLoading(true)

      try {
        const includeInvoiced = activeTab === "invoiced"
        const res = await accountsApi.getInvoicingQueue({
          pageNumber,
          pageSize,
          searchTerm: searchTerm.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          includeInvoiced,
        })

        const list = res?.data && Array.isArray(res.data) ? res.data : []
        setItems(list)
        setTotalCount(res?.totalCount || list.length)
      } catch (err: any) {
        console.error("Failed to load accounts invoicing data:", err)
        toast.error(
          err?.info?.message ||
          err?.message ||
          "Failed to load invoicing queue data."
        )
        setItems([])
        setTotalCount(0)
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [activeTab, pageNumber, pageSize, searchTerm, startDate, endDate]
  )

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTabChange = (val: string) => {
    setActiveTab(val as "queue" | "invoiced")
    setPageNumber(1)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setStartDate("")
    setEndDate("")
    setPageNumber(1)
  }

  const hasActiveFilters = Boolean(searchTerm || startDate || endDate)

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const openGenerateModal = (order: InvoicingQueueItem) => {
    setSelectedOrder(order)
    setGenerateDialogOpen(true)
  }

  const openAdjustModal = (order: InvoicingQueueItem) => {
    setSelectedOrder(order)
    setAdjustDialogOpen(true)
  }

  const queueTotalAmount = React.useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0)
  }, [items])

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Accounts Invoicing
              </h1>
              <p className="text-sm text-muted-foreground">
                Generate official GST tax invoices for sales orders to proceed to dispatch.
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
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {activeTab === "queue" ? "Orders in Queue" : "Invoiced Orders"}
              </p>
              <p className="text-2xl font-bold mt-1 text-foreground">
                {totalCount}
              </p>
            </div>
            <div className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Page Total Value
              </p>
              <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">
                ₹{queueTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workflow Stage
              </p>
              <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-200">
                Invoice Gen → Dispatch
              </p>
            </div>
            <div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="queue" className="gap-2">
            <Clock className="h-4 w-4" />
            Invoicing Queue
          </TabsTrigger>
          <TabsTrigger value="invoiced" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Invoiced Historical
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
                  placeholder="Search by order #, client name, invoice #..."
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

            <div className="lg:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
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
                <TableHead className="font-semibold text-xs">Order Number</TableHead>
                <TableHead className="font-semibold text-xs">Client / Doctor</TableHead>
                <TableHead className="font-semibold text-xs">Order Date</TableHead>
                <TableHead className="font-semibold text-xs">Dispatch Info</TableHead>
                <TableHead className="text-right font-semibold text-xs">Subtotal</TableHead>
                <TableHead className="text-right font-semibold text-xs">GST</TableHead>
                <TableHead className="text-right font-semibold text-xs">Total Amount</TableHead>
                <TableHead className="font-semibold text-xs">Status</TableHead>
                {activeTab === "invoiced" && (
                  <TableHead className="font-semibold text-xs">Invoice Details</TableHead>
                )}
                <TableHead className="text-right font-semibold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={activeTab === "invoiced" ? 10 : 9}
                    className="h-36 text-center text-muted-foreground"
                  >
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading invoicing records...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={activeTab === "invoiced" ? 10 : 9}
                    className="h-36 text-center text-muted-foreground italic"
                  >
                    {activeTab === "queue"
                      ? "No orders currently waiting in the invoicing queue."
                      : "No invoiced historical orders found."}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isInvoiced = Boolean(item.invoiceNumber)
                  return (
                    <TableRow key={item.orderId} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                      {/* Order Number */}
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        <Link
                          to={`/sales/orders/${item.orderId}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          {item.orderNumber}
                        </Link>
                      </TableCell>

                      {/* Client */}
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{item.clientName}</div>
                        {item.paymentStatus && (
                          <span className="text-[10px] text-muted-foreground">
                            Payment: {item.paymentStatus}
                          </span>
                        )}
                      </TableCell>

                      {/* Order Date */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.orderDate
                          ? new Date(item.orderDate).toLocaleDateString("en-GB")
                          : "—"}
                      </TableCell>

                      {/* Dispatch Info */}
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          {item.outwardOrderId ? (
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                              Outward #{item.outwardOrderId}
                            </span>
                          ) : isInvoiced ? (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              Pending Dispatch
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {item.dispatchedDate && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.dispatchedDate).toLocaleDateString("en-GB")}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Subtotal */}
                      <TableCell className="text-right text-xs text-muted-foreground">
                        ₹{Number(item.subtotal || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>

                      {/* GST */}
                      <TableCell className="text-right text-xs text-muted-foreground">
                        ₹{Number(item.gstAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="text-right font-bold text-xs text-foreground whitespace-nowrap">
                        ₹{Number(item.totalAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            isInvoiced
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          }
                        >
                          {isInvoiced ? "Invoice Generated" : item.orderStatus || "Completed"}
                        </Badge>
                      </TableCell>

                      {/* Invoice Details (if Historical) */}
                      {activeTab === "invoiced" && (
                        <TableCell className="text-xs">
                          {item.invoiceNumber ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                {item.invoiceNumber}
                              </span>
                              {item.invoiceDate && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(item.invoiceDate).toLocaleDateString("en-GB")}
                                </span>
                              )}
                              {item.invoicedBy != null && item.invoicedBy !== "" && (
                                <span className="text-[10px] text-muted-foreground">
                                  Generated by: {getUserDisplayName(item.invoicedBy)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isInvoiced && canGenerateInvoice && (
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              onClick={() => openGenerateModal(item)}
                            >
                              <FileCheck className="h-3.5 w-3.5" />
                              Generate Invoice
                            </Button>
                          )}

                          {/* {!isInvoiced && canAdjustCommercial && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-slate-200 gap-1 text-slate-700 hover:bg-slate-100"
                              onClick={() => openAdjustModal(item)}
                              title="Adjust Freight, Round-off, Address"
                            >
                              <Sliders className="h-3.5 w-3.5" />
                              Adjust
                            </Button>
                          )} */}

                          <Link to={`/sales/orders/${item.orderId}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="View Order Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
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
                {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} records
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

      {/* Generate Tax Invoice Dialog */}
      <GenerateInvoiceDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        order={selectedOrder}
        onSuccess={() => fetchData(true)}
      />

      {/* Commercial Adjustments Dialog */}
      <CommercialAdjustDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        order={selectedOrder}
        onSuccess={() => fetchData(true)}
      />
    </div>
  )
}
