import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  FileDown,
  Printer,
  Edit,
  Loader2,
  RefreshCw,
  Calendar,
  X,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Order, OrderStatus, mapApiSalesOrder } from "./types"
import { OrderFormDialog } from "./order-form-dialog"
import { ClientSelector } from "@/components/sales/client-selector"
import { salesOrderApi } from "@/lib/api"
import { toast } from "sonner"

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages]
  }
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages]
}

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case "Pending":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">Pending Approval</Badge>
    case "Approved":
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Approved</Badge>
    case "Packed":
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-none">Packed</Badge>
    case "Dispatched":
      return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none">Dispatched</Badge>
    case "Delivered":
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Delivered</Badge>
    case "Cancelled":
      return <Badge variant="destructive">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getCurrencySymbol = (currency?: string) => {
  if (!currency) return "₹"
  switch (currency.toUpperCase()) {
    case "USD": return "$"
    case "EUR": return "€"
    case "GBP": return "£"
    case "INR": return "₹"
    default: return currency
  }
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)

  // Server Filter States
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [selectedClientId, setSelectedClientId] = React.useState<string>("")
  const [selectedClientName, setSelectedClientName] = React.useState<string>("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [startDate, setStartDate] = React.useState<string>("")
  const [endDate, setEndDate] = React.useState<string>("")

  // Pagination States
  const [pageNumber, setPageNumber] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [totalCount, setTotalCount] = React.useState(0)

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPageNumber(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchOrders = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const raw = await salesOrderApi.getAll({
        PageNumber: pageNumber,
        PageSize: pageSize,
        SearchTerm: debouncedSearch || undefined,
        ClientId: selectedClientId && selectedClientId !== "0" ? selectedClientId : undefined,
        Status: statusFilter !== "all" ? statusFilter : undefined,
        StartDate: startDate || undefined,
        EndDate: endDate || undefined,
      })

      let list: any[] = []
      let total = 0

      if (Array.isArray(raw)) {
        list = raw
        total = raw.length
      } else if (raw?.data && Array.isArray(raw.data)) {
        list = raw.data
        total = raw.totalCount ?? raw.total ?? raw.totalRecords ?? list.length
      } else if (raw?.items && Array.isArray(raw.items)) {
        list = raw.items
        total = raw.totalCount ?? raw.total ?? raw.totalRecords ?? list.length
      }

      const data = list.map(mapApiSalesOrder)
      setOrders(data)
      setTotalCount(total)
    } catch (error) {
      console.error("Failed to fetch sales orders:", error)
      toast.error("Failed to load sales orders. Please try again.")
      setOrders([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [pageNumber, pageSize, debouncedSearch, selectedClientId, statusFilter, startDate, endDate])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Handle conversion from Proforma
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("convert") === "true") {
      const sourceData = localStorage.getItem("convert_source_data")
      if (sourceData) {
        try {
          const parsed = JSON.parse(sourceData)
          const prefilledOrder = {
            ...parsed,
            id: "",
            orderNumber: `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: "Pending",
            paymentStatus: "Unpaid",
            date: new Date().toISOString().split("T")[0],
            proformaId: parsed.proformaId || parsed.id,
            quotationId: parsed.sourceQuotationId || parsed.quotationId,
          }
          setSelectedOrder(prefilledOrder)
          setIsDialogOpen(true)
        } catch (e) {
          console.error("Failed to parse converted order data:", e)
        }
        window.history.replaceState({}, "", window.location.pathname)
        localStorage.removeItem("convert_source_data")
      }
    }
  }, [])

  const handleCreateOrder = () => {
    setSelectedOrder(null)
    setIsDialogOpen(true)
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const handleSaveOrder = () => {
    fetchOrders(true)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setSelectedClientId("")
    setSelectedClientName("")
    setStatusFilter("all")
    setStartDate("")
    setEndDate("")
    setPageNumber(1)
  }

  const hasActiveFilters = Boolean(
    searchTerm ||
    selectedClientId ||
    statusFilter !== "all" ||
    startDate ||
    endDate
  )

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sales Orders
          </h1>
          <p className="text-muted-foreground">Processing and managing sales orders from clients.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchOrders(true)}
            disabled={isLoading || isRefreshing}
            title="Refresh"
            className="border-slate-200"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleCreateOrder} className="shadow-md gap-2">
            <Plus className="h-4 w-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Tabs for quick Status Filter */}
      <Tabs
        value={statusFilter.toLowerCase()}
        onValueChange={(val) => {
          setStatusFilter(val)
          setPageNumber(1)
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 overflow-x-auto">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium"
            >
              All Orders
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium"
            >
              Approved
            </TabsTrigger>
            <TabsTrigger
              value="packed"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium"
            >
              Packed
            </TabsTrigger>
            <TabsTrigger
              value="dispatched"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium"
            >
              Dispatched
            </TabsTrigger>
            <TabsTrigger
              value="delivered"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium"
            >
              Delivered
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium"
            >
              Cancelled
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Filter Control Bar */}
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Search Input */}
            <div className="lg:col-span-4 space-y-1">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, client..."
                  className="pl-8 h-9 text-xs border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Client Filter */}
            <div className="lg:col-span-3 space-y-1 min-w-0">
              <Label className="text-xs text-muted-foreground">Filter by Client</Label>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 min-w-0">
                  <ClientSelector
                    selectedClientId={selectedClientId}
                    selectedClientName={selectedClientName}
                    onSelect={(c) => {
                      setSelectedClientId(c.id)
                      setSelectedClientName(c.name)
                      setPageNumber(1)
                    }}
                  />
                </div>
                {selectedClientId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      setSelectedClientId("")
                      setSelectedClientName("")
                      setPageNumber(1)
                    }}
                    title="Clear client filter"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div className="lg:col-span-2 space-y-1">
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPageNumber(1)
                }}
                className="h-9 text-xs border-slate-200"
              />
            </div>

            {/* End Date */}
            <div className="lg:col-span-2 space-y-1">
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPageNumber(1)
                }}
                className="h-9 text-xs border-slate-200"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="lg:col-span-1">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full h-9 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table Card */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b bg-slate-50/50">
          <div>
            <CardTitle className="text-base font-semibold">Orders List</CardTitle>
            <CardDescription className="text-xs">
              {totalCount} total sales orders found
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[130px] font-semibold text-xs">Order Number</TableHead>
                <TableHead className="font-semibold text-xs">Client / Doctor</TableHead>
                <TableHead className="font-semibold text-xs">Date</TableHead>
                <TableHead className="font-semibold text-xs">Items</TableHead>
                <TableHead className="text-right font-semibold text-xs">Total Amount</TableHead>
                <TableHead className="font-semibold text-xs">Status</TableHead>
                <TableHead className="font-semibold text-xs">Payment</TableHead>
                <TableHead className="text-right font-semibold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading sales orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground italic">
                    {hasActiveFilters ? "No sales orders found matching your filters." : "No sales orders found."}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id || (order as any).orderId} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-medium font-mono text-primary text-xs">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      <div>{order.clientName}</div>
                      {(order as any).doctorSpeciality && (
                        <div className="text-[11px] text-muted-foreground">{(order as any).doctorSpeciality}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.date ? new Date(order.date).toLocaleDateString("en-GB") : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {(order.items || []).length} {order.items?.length === 1 ? "item" : "items"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs">
                      {getCurrencySymbol((order as any).currencyType)}
                      {(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          order.paymentStatus === "Paid"
                            ? "text-emerald-600 border-emerald-200 bg-emerald-50/40"
                            : "text-amber-600 border-amber-200 bg-amber-50/40"
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleEditOrder(order)}>
                            <Edit className="h-4 w-4" /> Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => navigate(`/sales/orders/${order.id || (order as any).orderId}`)}
                          >
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer"
                            onClick={() => navigate(`/sales/orders/${order.id || (order as any).orderId}`)}
                          >
                            <Printer className="h-4 w-4" /> Print / Export
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          {(() => {
            const currentPage = pageNumber
            const startRow = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1
            const endRow = Math.min(pageNumber * pageSize, totalCount)
            const pageNumbers = getPageNumbers(currentPage, totalPages)

            return (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t text-xs bg-slate-50/40">
                {/* Left side: Item Count & Rows Per Page */}
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground w-full md:w-auto justify-between md:justify-start">
                  <div>
                    Showing <span className="font-semibold text-foreground">{startRow}</span> to{" "}
                    <span className="font-semibold text-foreground">{endRow}</span> of{" "}
                    <span className="font-semibold text-foreground">{totalCount}</span> orders
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">Rows per page</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        if (val) {
                          setPageSize(Number(val))
                          setPageNumber(1)
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[72px] text-xs border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 30, 50, 100].map((size) => (
                          <SelectItem key={size} value={String(size)} className="text-xs">
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right side: Page Navigation */}
                <div className="flex items-center gap-1 sm:gap-1.5 w-full md:w-auto justify-center md:justify-end">
                  <div className="text-xs text-muted-foreground font-medium mr-2 whitespace-nowrap bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    Page <span className="font-bold text-foreground">{totalCount === 0 ? 0 : currentPage}</span> of{" "}
                    <span className="font-bold text-foreground">{totalCount === 0 ? 0 : totalPages}</span>
                  </div>

                  {/* First Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-slate-200"
                    onClick={() => setPageNumber(1)}
                    disabled={pageNumber <= 1 || isLoading || totalCount === 0}
                    title="First page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  {/* Previous Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-slate-200"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1 || isLoading || totalCount === 0}
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Direct Page Numbers */}
                  {totalCount > 0 && (
                    <div className="hidden sm:flex items-center gap-1">
                      {pageNumbers.map((p, idx) => {
                        if (p === "...") {
                          return (
                            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground select-none">
                              ...
                            </span>
                          )
                        }
                        const pageNum = p as number
                        const isSelected = pageNum === currentPage
                        return (
                          <Button
                            key={pageNum}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            disabled={isLoading}
                            className={`h-8 min-w-[32px] px-2 text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                                : "hover:bg-muted border-slate-200"
                            }`}
                            onClick={() => setPageNumber(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  {/* Next Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-slate-200"
                    onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    disabled={pageNumber >= totalPages || isLoading || totalCount === 0}
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Last Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-slate-200"
                    onClick={() => setPageNumber(totalPages)}
                    disabled={pageNumber >= totalPages || isLoading || totalCount === 0}
                    title="Last page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      <OrderFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        order={selectedOrder}
        onSave={handleSaveOrder}
      />
    </div>
  )
}
