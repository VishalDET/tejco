import { useState, useEffect, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  ShoppingBag,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Eye,
  FileEdit,
  RefreshCw,
  TrendingUp,
  Filter,
  Truck,
  ArrowUpDown,
  Copy,
  Calendar,
  Building2,
  Receipt,
  XCircle,
  Printer,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableDropdown, SearchableOption } from "@/components/common/searchable-dropdown"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { StatGrid, StatCard } from "@/components/common/cards"
import { toast } from "sonner"
import { purchaseOrderApi, vendorsApi } from "@/lib/api"
import {
  PurchaseOrder,
  formatCurrency,
  getOrderStatusBadgeVariant,
  getPaymentStatusBadgeVariant,
  PurchaseOrderStatus,
} from "./types"
import { Vendor } from "@/app/supply-chain/vendors/types"

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All Orders", value: "" },
  { label: "Draft", value: "Draft" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Ordered", value: "Ordered" },
  { label: "Partially Received", value: "Partially Received" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
]

export default function PurchaseOrdersPage() {
  const navigate = useNavigate()

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Server Filters
  const [searchInput, setSearchInput] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [vendorFilter, setVendorFilter] = useState<string>("")
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("")
  const [paymentFilter, setPaymentFilter] = useState<string>("")

  // Pagination state
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(10)
  const [totalCount, setTotalCount] = useState<number>(0)

  // Overall KPI stats across all orders
  const [allTimeStats, setAllTimeStats] = useState({
    totalCount: 0,
    totalSpend: 0,
    draftCount: 0,
    pendingCount: 0,
    deliveredCount: 0,
  })
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  // Quick Status Update Dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [newStatus, setNewStatus] = useState<string>("Pending")
  const [statusRemarks, setStatusRemarks] = useState<string>("")
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false)

  const orderStatusChangeOptions: SearchableOption[] = [
    { value: "Draft", label: "Draft" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Ordered", label: "Ordered" },
    { value: "Partially Received", label: "Partially Received" },
    { value: "Delivered", label: "Delivered" },
    { value: "Cancelled", label: "Cancelled" },
  ]

  // Map vendor ID to Vendor Name
  const vendorMap = useMemo(() => {
    const map = new Map<number | string, Vendor>()
    for (const v of vendors) {
      if (v.id) map.set(v.id, v)
      if ((v as any).vendorId) map.set((v as any).vendorId, v)
    }
    return map
  }, [vendors])

  const getVendorName = (vendorId: number) => {
    const v = vendorMap.get(vendorId) || vendorMap.get(String(vendorId))
    return v?.name || (v as any)?.vendorName || `Vendor #${vendorId}`
  }

  // Selected vendor name for dropdown trigger
  const selectedVendorName = useMemo(() => {
    if (!vendorFilter) return ""
    const v = vendorMap.get(vendorFilter) || vendorMap.get(Number(vendorFilter))
    return v?.name || (v as any)?.vendorName || `Vendor #${vendorFilter}`
  }, [vendorFilter, vendorMap])

  // Debounce search input -> searchTerm
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInput)
      setPageIndex(0)
    }, 350)
    return () => clearTimeout(handler)
  }, [searchInput])

  // Load overall statistics & vendors on mount
  const loadOverallStats = async () => {
    try {
      const res = await purchaseOrderApi.getAll({ pageSize: 1000 })
      const allOrders = res.data || []
      let totalSpend = 0
      let draftCount = 0
      let pendingCount = 0
      let deliveredCount = 0
      const counts: Record<string, number> = { all: res.totalCount ?? allOrders.length }

      for (const o of allOrders) {
        totalSpend += Number(o.totalAmount || 0)
        const st = (o.orderStatus || "").toLowerCase()
        counts[st] = (counts[st] || 0) + 1
        if (st === "draft") draftCount++
        else if (st === "pending" || st === "ordered") pendingCount++
        else if (st === "delivered") deliveredCount++
      }

      setAllTimeStats({
        totalCount: res.totalCount ?? allOrders.length,
        totalSpend,
        draftCount,
        pendingCount,
        deliveredCount,
      })
      setStatusCounts(counts)
    } catch (err) {
      console.error("Failed to load overall stats:", err)
    }
  }

  const loadVendors = async () => {
    try {
      const vRes = await vendorsApi.getAll()
      setVendors(Array.isArray(vRes) ? vRes : [])
    } catch (err) {
      console.error("Failed to load vendors:", err)
    }
  }

  useEffect(() => {
    loadOverallStats()
    loadVendors()
  }, [])

  // Load paginated & server-filtered orders
  const loadOrders = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const res = await purchaseOrderApi.getAll({
        pageNumber: pageIndex + 1,
        pageSize,
        searchTerm: searchTerm.trim() || undefined,
        vendorId: vendorFilter || undefined,
        orderStatus: orderStatusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
      })

      const rawOrders = res?.data || []
      setOrders(Array.isArray(rawOrders) ? rawOrders : [])
      setTotalCount(res?.totalCount ?? rawOrders.length)
    } catch (err: any) {
      toast.error(err?.message || "Failed to load purchase orders")
      setOrders([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [pageIndex, pageSize, searchTerm, vendorFilter, orderStatusFilter, paymentFilter])

  // Active filter checks
  const hasActiveFilters = Boolean(searchTerm || vendorFilter || orderStatusFilter || paymentFilter)
  const activeFilterCount = [
    Boolean(searchTerm),
    Boolean(vendorFilter),
    Boolean(orderStatusFilter),
    Boolean(paymentFilter),
  ].filter(Boolean).length

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = pageIndex + 1
  const startRow = totalCount === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, totalCount)

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total]
    }
    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total]
    }
    return [1, "...", current - 1, current, current + 1, "...", total]
  }

  // Status Dialog Handler
  const handleOpenStatusDialog = (order: PurchaseOrder) => {
    setSelectedOrder(order)
    setNewStatus(order.orderStatus || "Pending")
    setStatusRemarks("")
    setStatusDialogOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return
    setIsSubmittingStatus(true)
    try {
      await purchaseOrderApi.updateStatus(
        selectedOrder.purchaseOrderId,
        newStatus,
        statusRemarks
      )
      toast.success(
        `Purchase Order ${selectedOrder.orderNumber} updated to ${newStatus}`
      )
      setStatusDialogOpen(false)
      await Promise.all([loadOrders(), loadOverallStats()])
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status")
    } finally {
      setIsSubmittingStatus(false)
    }
  }

  const handleCopy = (text: string, label = "Order number") => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const resetAllFilters = () => {
    setSearchInput("")
    setSearchTerm("")
    setVendorFilter("")
    setOrderStatusFilter("")
    setPaymentFilter("")
    setPageIndex(0)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Purchase Orders
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage supplier procurement orders, track deliverables, and manage costs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadOrders(true)
              loadOverallStats()
            }}
            disabled={isRefreshing || isLoading}
            className="h-9 px-3 gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Link to="/purchase/create">
            <Button
              className="h-9 px-4 gap-2 bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Purchase Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <StatGrid columns={4}>
        <StatCard
          title="Total Purchase Orders"
          value={isLoading && allTimeStats.totalCount === 0 ? "-" : allTimeStats.totalCount}
          icon={ShoppingBag}
          color="blue"
          variant="classic"
          description="Total procurement orders created"
          badge="All Time"
          isLoading={isLoading && allTimeStats.totalCount === 0}
        />
        <StatCard
          title="Draft & Pending"
          value={isLoading && allTimeStats.totalCount === 0 ? "-" : allTimeStats.draftCount + allTimeStats.pendingCount}
          icon={Clock}
          color="amber"
          variant="classic"
          description={`${allTimeStats.draftCount} draft, ${allTimeStats.pendingCount} pending fulfillment`}
          badge="In Progress"
          isLoading={isLoading && allTimeStats.totalCount === 0}
        />
        <StatCard
          title="Delivered / Fulfilled"
          value={isLoading && allTimeStats.totalCount === 0 ? "-" : allTimeStats.deliveredCount}
          icon={CheckCircle2}
          color="emerald"
          variant="classic"
          description="Orders received & stored in stock"
          badge="Completed"
          isLoading={isLoading && allTimeStats.totalCount === 0}
        />
        <StatCard
          title="Total Procurement Spend"
          value={isLoading && allTimeStats.totalCount === 0 ? "-" : formatCurrency(allTimeStats.totalSpend, "INR")}
          icon={TrendingUp}
          color="indigo"
          variant="classic"
          description="Combined valuation across all orders"
          badge="Spend"
          isLoading={isLoading && allTimeStats.totalCount === 0}
        />
      </StatGrid>

      {/* Main List Card with Filters */}
      <Card className="border shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b space-y-3.5">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b">
            {STATUS_TABS.map((tab) => {
              const isActive = orderStatusFilter === tab.value
              const tabCount = tab.value === ""
                ? (statusCounts["all"] ?? allTimeStats.totalCount)
                : (statusCounts[tab.value.toLowerCase()] ?? 0)

              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setOrderStatusFilter(tab.value)
                    setPageIndex(0)
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tabCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-primary-foreground"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {tabCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Row 2: Search & Dropdown Filter Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl bg-muted/30 dark:bg-slate-900/40 border border-border/60 backdrop-blur-xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Search Input */}
              <div className="relative min-w-[220px] sm:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PO #, vendor, SKU, notes..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs rounded-lg bg-background/90 border-border/60 focus:border-primary transition-all duration-200"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("")
                      setSearchTerm("")
                      setPageIndex(0)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Vendor Dropdown */}
              <div className="flex items-center gap-1">
                <Select
                  value={vendorFilter || "all"}
                  onValueChange={(val) => {
                    setVendorFilter(!val || val === "all" ? "" : val)
                    setPageIndex(0)
                  }}
                >
                  <SelectTrigger
                    className={`h-9 text-xs rounded-lg transition-all duration-200 cursor-pointer min-w-[150px] sm:min-w-[170px] ${
                      vendorFilter
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/20 shadow-xs"
                        : "border-border/60 hover:border-border bg-background/90"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400 opacity-80" />
                      <SelectValue placeholder="All Vendors">
                        {selectedVendorName || "All Vendors"}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-72 shadow-lg border rounded-xl">
                    <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                      All Vendors
                    </SelectItem>
                    {vendors.map((v: any) => {
                      const id = String(v.vendorId ?? v.id)
                      const name = v.vendorName ?? v.name ?? `Vendor #${id}`
                      return (
                        <SelectItem key={id} value={id} className="text-xs cursor-pointer">
                          {name}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {vendorFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all shrink-0 cursor-pointer"
                    onClick={() => {
                      setVendorFilter("")
                      setPageIndex(0)
                    }}
                    title="Clear vendor filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Order Status Dropdown */}
              <div className="flex items-center gap-1">
                <Select
                  value={orderStatusFilter || "all"}
                  onValueChange={(val) => {
                    setOrderStatusFilter(!val || val === "all" ? "" : val)
                    setPageIndex(0)
                  }}
                >
                  <SelectTrigger
                    className={`h-9 text-xs rounded-lg transition-all duration-200 cursor-pointer min-w-[140px] sm:min-w-[155px] ${
                      orderStatusFilter
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/20 shadow-xs"
                        : "border-border/60 hover:border-border bg-background/90"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 opacity-80" />
                      <SelectValue placeholder="All Statuses">
                        {orderStatusFilter || "All Statuses"}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="shadow-lg border rounded-xl">
                    <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                      All Statuses
                    </SelectItem>
                    <SelectItem value="Draft" className="text-xs cursor-pointer">Draft</SelectItem>
                    <SelectItem value="Pending" className="text-xs cursor-pointer">Pending</SelectItem>
                    <SelectItem value="Approved" className="text-xs cursor-pointer">Approved</SelectItem>
                    <SelectItem value="Ordered" className="text-xs cursor-pointer">Ordered</SelectItem>
                    <SelectItem value="Partially Received" className="text-xs cursor-pointer">Partially Received</SelectItem>
                    <SelectItem value="Delivered" className="text-xs cursor-pointer">Delivered</SelectItem>
                    <SelectItem value="Cancelled" className="text-xs cursor-pointer">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {orderStatusFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all shrink-0 cursor-pointer"
                    onClick={() => {
                      setOrderStatusFilter("")
                      setPageIndex(0)
                    }}
                    title="Clear status filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Payment Status Dropdown */}
              <div className="flex items-center gap-1">
                <Select
                  value={paymentFilter || "all"}
                  onValueChange={(val) => {
                    setPaymentFilter(!val || val === "all" ? "" : val)
                    setPageIndex(0)
                  }}
                >
                  <SelectTrigger
                    className={`h-9 text-xs rounded-lg transition-all duration-200 cursor-pointer min-w-[140px] sm:min-w-[155px] ${
                      paymentFilter
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/20 shadow-xs"
                        : "border-border/60 hover:border-border bg-background/90"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Receipt className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 opacity-80" />
                      <SelectValue placeholder="All Payments">
                        {paymentFilter || "All Payments"}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="shadow-lg border rounded-xl">
                    <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                      All Payments
                    </SelectItem>
                    <SelectItem value="Pending" className="text-xs cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="Partially Paid" className="text-xs cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Partially Paid
                      </div>
                    </SelectItem>
                    <SelectItem value="Paid" className="text-xs cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Paid
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {paymentFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all shrink-0 cursor-pointer"
                    onClick={() => {
                      setPaymentFilter("")
                      setPageIndex(0)
                    }}
                    title="Clear payment filter"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Right side: Reset Filters & Total Count Badge */}
            <div className="flex items-center gap-2 ml-auto">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all duration-200 font-medium cursor-pointer"
                  onClick={resetAllFilters}
                  title="Reset all filters"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                  <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200">
                    {activeFilterCount}
                  </Badge>
                </Button>
              )}

              <Badge variant="outline" className="h-8 px-2.5 text-xs font-medium bg-background/80 border-border/60 gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-foreground">{totalCount}</span>
                <span className="text-muted-foreground">orders</span>
              </Badge>
            </div>
          </div>

          {/* Row 3: Active Filters Tags Strip (Animated) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <span className="text-[11px] text-muted-foreground font-medium mr-1">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => { setSearchInput(""); setSearchTerm(""); setPageIndex(0) }}
                    className="hover:text-blue-900 dark:hover:text-white ml-0.5 cursor-pointer"
                    title="Remove search filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {vendorFilter && (
                <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 font-semibold shadow-2xs">
                  <Building2 className="h-3 w-3" />
                  Vendor: {selectedVendorName}
                  <button
                    onClick={() => { setVendorFilter(""); setPageIndex(0) }}
                    className="hover:text-blue-900 dark:hover:text-white ml-0.5 cursor-pointer"
                    title="Remove vendor filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {orderStatusFilter && (
                <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 font-medium">
                  <Clock className="h-3 w-3" />
                  Status: {orderStatusFilter}
                  <button
                    onClick={() => { setOrderStatusFilter(""); setPageIndex(0) }}
                    className="hover:text-amber-900 dark:hover:text-white ml-0.5 cursor-pointer"
                    title="Remove status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {paymentFilter && (
                <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 font-medium">
                  <Receipt className="h-3 w-3" />
                  Payment: {paymentFilter}
                  <button
                    onClick={() => { setPaymentFilter(""); setPageIndex(0) }}
                    className="hover:text-emerald-900 dark:hover:text-white ml-0.5 cursor-pointer"
                    title="Remove payment filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40">
              <TableRow>
                <TableHead className="w-[180px] font-semibold text-xs">Order Number</TableHead>
                <TableHead className="font-semibold text-xs">Dates</TableHead>
                <TableHead className="font-semibold text-xs">Vendor</TableHead>
                <TableHead className="font-semibold text-xs">Items</TableHead>
                <TableHead className="font-semibold text-xs">Total Amount</TableHead>
                <TableHead className="font-semibold text-xs">Order Status</TableHead>
                <TableHead className="font-semibold text-xs">Payment</TableHead>
                <TableHead className="w-[80px] text-right font-semibold text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 py-6">
                      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
                        <ShoppingBag className="h-8 w-8 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                          No purchase orders found
                        </p>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          {hasActiveFilters
                            ? "Try adjusting your filters or search keywords to find what you're looking for."
                            : "Get started by drafting or issuing your first purchase order to suppliers."}
                        </p>
                      </div>
                      {hasActiveFilters ? (
                        <Button size="sm" variant="outline" onClick={resetAllFilters} className="mt-2 gap-1.5 cursor-pointer">
                          <X className="h-4 w-4" />
                          <span>Clear Filters</span>
                        </Button>
                      ) : (
                        <Link to="/purchase/create">
                          <Button size="sm" className="mt-2 gap-1.5 cursor-pointer">
                            <Plus className="h-4 w-4" />
                            <span>Create Purchase Order</span>
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((po) => {
                  const statusInfo = getOrderStatusBadgeVariant(po.orderStatus)
                  const paymentInfo = getPaymentStatusBadgeVariant(po.paymentStatus)
                  const vendorName = getVendorName(po.vendorId)
                  const itemCount = po.lineItems?.length || 0

                  return (
                    <TableRow key={po.purchaseOrderId} className="hover:bg-muted/40 transition-colors">
                      {/* Order Number */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/purchase/${po.purchaseOrderId}`}
                            className="font-mono text-sm font-semibold text-primary hover:underline"
                          >
                            {po.orderNumber}
                          </Link>
                          <button
                            onClick={() => handleCopy(po.orderNumber, "Order number")}
                            className="text-muted-foreground/50 hover:text-foreground transition-colors p-1 cursor-pointer"
                            title="Copy order number"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Dates */}
                      <TableCell>
                        <div className="flex flex-col text-xs space-y-0.5">
                          <span className="text-slate-900 dark:text-slate-100 font-medium">
                            {po.orderDate ? new Date(po.orderDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }) : "—"}
                          </span>
                          {po.expectedDeliveryDate && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              Exp: {new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Vendor */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {vendorName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[160px]">
                            {vendorName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Items */}
                      <TableCell>
                        <div className="text-xs">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {itemCount} {itemCount === 1 ? "item" : "items"}
                          </span>
                          {po.lineItems && po.lineItems.length > 0 && po.lineItems[0].sku && (
                            <span className="block text-[11px] text-muted-foreground font-mono truncate max-w-[120px]">
                              {po.lineItems[0].sku}
                              {po.lineItems.length > 1 ? ` +${po.lineItems.length - 1}` : ""}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(po.totalAmount, po.currencyType || "INR")}
                        </div>
                        {Number(po.gstAmount || 0) > 0 && (
                          <div className="text-[11px] text-muted-foreground">
                            Incl. GST: {formatCurrency(po.gstAmount, po.currencyType || "INR")}
                          </div>
                        )}
                      </TableCell>

                      {/* Order Status */}
                      <TableCell>
                        <Badge
                          variant={statusInfo.variant}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusInfo.className}`}
                        >
                          {po.orderStatus || "Draft"}
                        </Badge>
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${paymentInfo.className}`}
                        >
                          {po.paymentStatus || "Pending"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48 shadow-lg rounded-xl">
                            <DropdownMenuLabel className="text-xs">Order Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => navigate(`/purchase/${po.purchaseOrderId}`)}
                              className="cursor-pointer gap-2"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/purchase/${po.purchaseOrderId}/print`)}
                              className="cursor-pointer gap-2"
                            >
                              <Printer className="h-4 w-4 text-muted-foreground" />
                              <span>Print PO</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/purchase/${po.purchaseOrderId}/edit`)}
                              className="cursor-pointer gap-2"
                            >
                              <FileEdit className="h-4 w-4 text-muted-foreground" />
                              <span>Edit Order</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenStatusDialog(po)}
                              className="cursor-pointer gap-2"
                            >
                              <RefreshCw className="h-4 w-4 text-muted-foreground" />
                              <span>Update Status</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Server-Side Pagination Footer */}
        <div className="p-4 border-t bg-slate-50/40 dark:bg-slate-900/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          {/* Left side: Item Count & Rows Per Page */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div>
              Showing <span className="font-semibold text-foreground">{startRow}</span> to{" "}
              <span className="font-semibold text-foreground">{endRow}</span> of{" "}
              <span className="font-semibold text-foreground">{totalCount}</span> purchase orders
            </div>

            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  if (val) {
                    setPageSize(Number(val))
                    setPageIndex(0)
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[72px] text-xs cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)} className="text-xs cursor-pointer">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right side: Page Navigation */}
          <div className="flex items-center gap-1 sm:gap-1.5 w-full md:w-auto justify-center md:justify-end">
            {/* Number of Pages Display */}
            <div className="text-xs text-muted-foreground font-medium mr-2 whitespace-nowrap bg-muted/40 px-2.5 py-1 rounded-md border">
              Page <span className="font-bold text-foreground">{totalCount === 0 ? 0 : currentPage}</span> of{" "}
              <span className="font-bold text-foreground">{totalCount === 0 ? 0 : totalPages}</span>
            </div>

            {/* First Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0 || isLoading || totalCount === 0}
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              disabled={pageIndex === 0 || isLoading || totalCount === 0}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>

            {/* Direct Page Numbers */}
            {totalCount > 0 && (
              <div className="hidden sm:flex items-center gap-1">
                {getPageNumbers(currentPage, totalPages).map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-xs text-muted-foreground select-none"
                      >
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
                      className={`h-8 min-w-[32px] px-2 text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setPageIndex(pageNum - 1)}
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
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => setPageIndex((i) => Math.min(totalPages - 1, i + 1))}
              disabled={pageIndex >= totalPages - 1 || isLoading || totalCount === 0}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>

            {/* Last Page */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => setPageIndex(totalPages - 1)}
              disabled={pageIndex >= totalPages - 1 || isLoading || totalCount === 0}
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Status Update Modal */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Update Order Status
            </DialogTitle>
            <DialogDescription>
              Change status for purchase order{" "}
              <strong className="font-mono text-foreground">
                {selectedOrder?.orderNumber}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="status-select">Order Status</Label>
              <SearchableDropdown
                value={newStatus}
                onChange={(v) => setNewStatus(v || "Pending")}
                options={orderStatusChangeOptions}
                placeholder="Select new status"
                popoverWidth={300}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-remarks">Remarks / Notes (Optional)</Label>
              <Textarea
                id="status-remarks"
                placeholder="Add any remarks or delivery comments..."
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={isSubmittingStatus}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isSubmittingStatus || !newStatus}
              className="gap-2"
            >
              {isSubmittingStatus ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>Save Status</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
