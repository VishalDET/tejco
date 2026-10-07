import * as React from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  FileDown,
  Printer,
  Edit,
  RefreshCw,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  X,
  Building2,
  ExternalLink,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter
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
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { quotationsApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { SalesDocumentStatus } from "../types"
import { Quotation } from "./types"
import { QuotationFormDialog } from "./quotation-form-dialog"
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

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  "Draft": ["Sent to Client", "Cancelled"],
  "Sent to Client": ["Accepted", "Rejected"],
  "Accepted": ["Converted To PI", "Converted To Sales Order"],
  "Rejected": ["Draft"],
  "Converted To PI": ["Accepted"],
  "Converted To Sales Order": ["Accepted"],
}

export const getAllowedNextStatuses = (currentStatus?: string): string[] => {
  if (!currentStatus) return ALLOWED_STATUS_TRANSITIONS["Draft"] || []
  const norm = currentStatus.trim().toLowerCase()
  const matchKey = Object.keys(ALLOWED_STATUS_TRANSITIONS).find(
    (k) => k.toLowerCase() === norm
  )
  if (matchKey) {
    return ALLOWED_STATUS_TRANSITIONS[matchKey]
  }
  if (norm === "issued") {
    return ["Accepted", "Rejected"]
  }
  return []
}

const getStatusBadge = (status: SalesDocumentStatus | string) => {
  const norm = String(status || "").toLowerCase().trim()
  if (norm === "draft") {
    return (
      <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
        Draft
      </Badge>
    )
  }
  if (norm === "sent to client") {
    return (
      <Badge variant="secondary" className="bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-medium">
        Sent to Client
      </Badge>
    )
  }
  if (norm === "accepted") {
    return (
      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium">
        Accepted
      </Badge>
    )
  }
  if (norm === "rejected") {
    return (
      <Badge variant="secondary" className="bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-medium">
        Rejected
      </Badge>
    )
  }
  if (norm === "converted to pi" || norm === "converted to proforma") {
    return (
      <Badge variant="secondary" className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-medium">
        Converted to PI
      </Badge>
    )
  }
  if (norm === "converted to sales order" || norm === "converted to order" || norm === "converted to so") {
    return (
      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium">
        Converted to Order
      </Badge>
    )
  }
  if (norm === "cancelled") {
    return <Badge variant="destructive" className="text-[11px]">Cancelled</Badge>
  }
  if (norm === "issued") {
    return (
      <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
        Issued
      </Badge>
    )
  }
  return <Badge variant="outline" className="text-[11px]">{status || "Unknown"}</Badge>
}

const formatCurrency = (amount: number, currency?: string) => {
  const curr = (currency || "INR").toUpperCase()
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: curr === "USD" ? "USD" : curr === "EUR" ? "EUR" : "INR",
    maximumFractionDigits: 0
  }).format(amount)
}

export default function QuotationsPage() {
  const navigate = useNavigate()
  const [quotations, setQuotations] = React.useState<Quotation[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedQuotation, setSelectedQuotation] = React.useState<Quotation | null>(null)

  // Server Filter States
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [startDate, setStartDate] = React.useState<string>("")
  const [endDate, setEndDate] = React.useState<string>("")

  // Pagination States
  const [pageNumber, setPageNumber] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [totalCount, setTotalCount] = React.useState(0)

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPageNumber(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { user } = useAuth()
  const isSalesPerson =
    Number(user?.roleId) === 3 ||
    String(user?.role || "").toLowerCase().includes("sales person") ||
    String(user?.role || "").toLowerCase() === "salesperson"
  const currentSalesPersonId = isSalesPerson
    ? String(user?.userId || user?.id || (user as any)?.salesPersonId || "")
    : ""

  const fetchQuotations = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      if (isSalesPerson && currentSalesPersonId) {
        // Fetch all quotations for this specific sales person
        const list = await quotationsApi.getBySalesPerson(currentSalesPersonId)
        
        // Filter in-memory by status, search, and date if applied
        let filtered = list
        if (debouncedSearch) {
          const lower = debouncedSearch.toLowerCase()
          filtered = filtered.filter(
            q =>
              q.number?.toLowerCase().includes(lower) ||
              q.quotationNumber?.toLowerCase().includes(lower) ||
              q.clientName?.toLowerCase().includes(lower) ||
              q.subject?.toLowerCase().includes(lower)
          )
        }
        if (statusFilter !== "all") {
          filtered = filtered.filter(
            q => String(q.status || "").toLowerCase() === statusFilter.toLowerCase()
          )
        }
        if (startDate) {
          const startTs = new Date(startDate).getTime()
          filtered = filtered.filter(q => q.date && new Date(q.date).getTime() >= startTs)
        }
        if (endDate) {
          const endTs = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1
          filtered = filtered.filter(q => q.date && new Date(q.date).getTime() <= endTs)
        }

        const total = filtered.length
        const startIdx = (pageNumber - 1) * pageSize
        const paginated = filtered.slice(startIdx, startIdx + pageSize)

        setQuotations(paginated)
        setTotalCount(total)
      } else {
        const res = await quotationsApi.getAll({
          PageNumber: pageNumber,
          PageSize: pageSize,
          SearchTerm: debouncedSearch || undefined,
          Status: statusFilter !== "all" ? statusFilter : undefined,
          StartDate: startDate || undefined,
          EndDate: endDate || undefined,
        })

        if (Array.isArray(res)) {
          setQuotations(res)
          setTotalCount(res.length)
        } else if (res && typeof res === "object") {
          setQuotations(res.data || [])
          setTotalCount(res.totalCount || (res.data ? res.data.length : 0))
        }
      }
    } catch (error) {
      console.error("Failed to fetch quotations:", error)
      toast.error("Failed to load quotations. Please try again.")
      setQuotations([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [pageNumber, pageSize, debouncedSearch, statusFilter, startDate, endDate, isSalesPerson, currentSalesPersonId])

  React.useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  const handleCreate = () => {
    setSelectedQuotation(null)
    setIsDialogOpen(true)
  }

  const handleConvertToProforma = async (q: Quotation) => {
    try {
      const payload = {
        quotationId: q.quotationId,
        quotationNumber: q.quotationNumber || q.number,
        quotationDate: new Date(q.date).toISOString(),
        clientName: q.clientName || "",
        clientAddress: q.billingAddress || "",
        clientMobileNo: q.clientMobileNo || "",
        subject: q.subject || "",
        gstinNo: q.gstinNo || "",
        validityDays: q.validityDays || 7,
        deliveryTime: q.deliveryTime || "",
        salesPersonName: q.salesPersonName || "",
        salesPersonCell: q.salesPersonCell || "",
        salesPersonId: q.salesPersonId ? String(q.salesPersonId) : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "Converted to Proforma",
        paymentType: q.paymentType || "Domestic",
        currencyType: q.currencyType || "INR",
        items: (q.items || []).map((item) => ({
          quotationItemId: isNaN(parseInt(item.id)) ? 0 : parseInt(item.id),
          quotationId: q.quotationId,
          productId: isNaN(parseInt(item.productId)) ? 0 : parseInt(item.productId),
          productName: item.productName || "",
          itemName: item.name || "",
          imageUrl: (item as any).imageUrl || "",
          price: item.unitPrice || 0,
          gstPercentage: item.gstRate || 0,
          quantity: item.quantity || 0,
          discountPercentage: (item as any).discountPercentage || 0,
          discountAmount: (item as any).discountAmount || 0,
        }))
      }
      await quotationsApi.update(String(q.quotationId), payload)
      setQuotations((prev) =>
        prev.map((o) => (o.id === q.id ? ({ ...o, status: "Converted to Proforma" } as Quotation) : o))
      )
      toast.success("Quotation status marked as Converted")
    } catch (err) {
      console.error("Failed to update quotation status on convert:", err)
    }

    localStorage.setItem(
      "convert_source_data",
      JSON.stringify({
        ...q,
        sourceId: q.id,
        number: "",
        status: "Draft",
        date: new Date().toISOString().split("T")[0]
      })
    )
    navigate("/sales/proforma-invoices?convert=true")
  }

  const handleStatusUpdate = async (q: Quotation, newStatus: string, remarks?: string) => {
    try {
      await quotationsApi.updateStatus(q.quotationId || q.id, newStatus, remarks)
      toast.success(`Quotation status updated to "${newStatus}".`)
      setQuotations((prev) =>
        prev.map((item) =>
          item.id === q.id ? ({ ...item, status: newStatus as SalesDocumentStatus } as Quotation) : item
        )
      )
    } catch (err: any) {
      console.error("Failed to update quotation status:", err)
      toast.error(err?.message || "Failed to update quotation status.")
    }
  }

  const handleEdit = (q: Quotation) => {
    setSelectedQuotation(q)
    setIsDialogOpen(true)
  }

  const handleSave = (data: Partial<Quotation>) => {
    if (selectedQuotation) {
      setQuotations((prev) =>
        prev.map((o) => (o.id === selectedQuotation.id ? ({ ...o, ...data } as Quotation) : o))
      )
    } else {
      const newQuo: Quotation = {
        ...data,
        id: Math.random().toString(36).substring(2, 11),
      } as Quotation
      setQuotations((prev) => [newQuo, ...prev])
    }
    fetchQuotations(true)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setStatusFilter("all")
    setStartDate("")
    setEndDate("")
    setPageNumber(1)
  }

  const hasActiveFilters = Boolean(
    searchTerm ||
    statusFilter !== "all" ||
    startDate ||
    endDate
  )

  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const pageNumbers = getPageNumbers(pageNumber, totalPages)
  const currentPage = pageNumber

  // Summary Metrics / KPIs
  const kpis = React.useMemo(() => {
    let totalValue = 0
    let draftCount = 0
    let issuedCount = 0
    let convertedCount = 0

    for (const q of quotations) {
      totalValue += Number(q.totalAmount || 0)
      const st = (q.status || "").toLowerCase().trim()
      if (st === "draft") draftCount++
      else if (st === "issued") issuedCount++
      else if (st === "converted to proforma" || st === "converted to pi") convertedCount++
    }

    return {
      totalCount: totalCount || quotations.length,
      totalValue,
      draftCount,
      issuedCount,
      convertedCount,
    }
  }, [quotations, totalCount])

  return (
    <div className="flex flex-col gap-6 w-full mx-auto pb-10 animate-in fade-in duration-300">
      {/* Top Header Row: Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/20 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Quotations
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/70 shadow-2xs">
                {quotations.length} total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Create, track, and manage commercial price estimates provided to doctors and clinics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchQuotations(true)}
            disabled={isLoading || isRefreshing}
            className="h-9 px-3 gap-2 text-xs font-medium border-border/80 hover:bg-muted/70 shadow-2xs"
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            onClick={handleCreate}
            size="sm"
            className="h-9 px-3.5 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Quotation</span>
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Quotations */}
        <Card className="border-border/70 shadow-xs hover:shadow-md transition-shadow bg-linear-to-br from-indigo-50/40 via-background to-background dark:from-indigo-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Quotations</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {isLoading ? <Skeleton className="h-7 w-12" /> : kpis.totalCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">All generated estimates</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Issued & Pending */}
        <Card className="border-border/70 shadow-xs hover:shadow-md transition-shadow bg-linear-to-br from-blue-50/40 via-background to-background dark:from-blue-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issued & Pending</p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {isLoading ? <Skeleton className="h-7 w-12" /> : kpis.issuedCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting client decision</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Converted to PI */}
        <Card className="border-border/70 shadow-xs hover:shadow-md transition-shadow bg-linear-to-br from-emerald-50/40 via-background to-background dark:from-emerald-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Converted to PI</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isLoading ? <Skeleton className="h-7 w-12" /> : kpis.convertedCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Advanced to proforma</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Pipeline Value */}
        <Card className="border-border/70 shadow-xs hover:shadow-md transition-shadow bg-linear-to-br from-amber-50/40 via-background to-background dark:from-amber-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Value</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {isLoading ? <Skeleton className="h-7 w-24" /> : formatCurrency(kpis.totalValue)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Gross quoted amount</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Quotations Table Card */}
      <Card className="shadow-xs border-border/70 overflow-hidden">
        {/* Controls & Filter Header */}
        <div className="p-4 sm:p-5 border-b bg-slate-50/40 dark:bg-slate-900/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Search Input */}
            <div className="lg:col-span-4 space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quote #, client, subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 h-9 text-xs bg-background w-full"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Select */}
            <div className="lg:col-span-3 space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val || "all")
                  setPageNumber(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-background w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent to Client">Sent to Client</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Converted To PI">Converted To PI</SelectItem>
                  <SelectItem value="Converted To Sales Order">Converted To Sales Order</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="lg:col-span-2 space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">From Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setPageNumber(1)
                  }}
                  className="pl-8 h-9 text-xs bg-background w-full"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="lg:col-span-2 space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">To Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setPageNumber(1)
                  }}
                  className="pl-8 h-9 text-xs bg-background w-full"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="lg:col-span-1">
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="h-9 w-full text-xs text-muted-foreground hover:text-foreground border border-dashed border-border"
                  title="Clear all filters"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              ) : (
                <div className="h-9" />
              )}
            </div>
          </div>

          {/* Quick Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
            <span className="text-[11px] text-muted-foreground font-semibold mr-1">Quick Filter:</span>
            {[
              { id: "all", label: "All Quotes" },
              { id: "Issued", label: "Issued" },
              { id: "Converted To PI", label: "Converted to PI" },
              { id: "Draft", label: "Draft" },
            ].map(({ id, label }) => {
              const active = statusFilter.toLowerCase() === id.toLowerCase()
              return (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  className={`h-7 px-2.5 text-[11px] font-medium rounded-full transition-all ${
                    active
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground bg-background"
                  }`}
                  onClick={() => {
                    setStatusFilter(id)
                    setPageNumber(1)
                  }}
                >
                  {label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Table Container */}
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-3.5 px-4 font-semibold text-xs text-foreground whitespace-nowrap">
                    Quotation #
                  </TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs text-foreground whitespace-nowrap">
                    Client / Doctor
                  </TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs text-foreground whitespace-nowrap">
                    Date
                  </TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs text-foreground whitespace-nowrap">
                    Validity
                  </TableHead>
                  <TableHead className="text-right py-3.5 px-4 font-semibold text-xs text-foreground whitespace-nowrap">
                    Total Amount
                  </TableHead>
                  <TableHead className="text-center py-3.5 px-4 font-semibold text-xs text-foreground whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="text-right py-3.5 px-4 font-semibold text-xs text-foreground whitespace-nowrap w-[90px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-44" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-3 text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell className="px-4 py-3 text-center"><Skeleton className="h-6 w-18 mx-auto rounded-full" /></TableCell>
                      <TableCell className="px-4 py-3 text-right"><Skeleton className="h-7 w-7 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : quotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-60 text-center py-10">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground max-w-sm mx-auto">
                        <div className="p-3 bg-muted/60 rounded-full mb-1">
                          <Search className="h-6 w-6 opacity-40 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">No quotations found</p>
                        <p className="text-xs text-muted-foreground">
                          {hasActiveFilters
                            ? "No quotations match your current search, status, or date range filter."
                            : "No quotations have been created yet."}
                        </p>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearFilters}
                            className="h-8 text-xs mt-2"
                          >
                            Reset Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  quotations.map((q) => (
                    <TableRow key={q.id} className="group hover:bg-muted/40 transition-colors">
                      {/* Quotation Number */}
                      <TableCell className="py-3 px-4 whitespace-nowrap">
                        <Link
                          to={`/sales/quotations/${q.id}`}
                          className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                        >
                          {q.number || q.quotationNumber || `QUO-${q.id}`}
                        </Link>
                      </TableCell>

                      {/* Client / Doctor */}
                      <TableCell className="py-3 px-4">
                        <div className="flex flex-col max-w-[240px]">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {q.clientName || "Unnamed Client"}
                          </span>
                          {(q.subject || q.notes) && (
                            <span className="text-[11px] text-muted-foreground truncate">
                              {q.subject || q.notes}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {q.date
                          ? new Date(q.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })
                          : "—"}
                      </TableCell>

                      {/* Validity */}
                      <TableCell className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {q.validUntil ? (
                          new Date(q.validUntil).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })
                        ) : q.validityDays ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                            {q.validityDays} days
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-xs text-foreground">
                            {formatCurrency(q.totalAmount, (q as any).currencyType)}
                          </span>
                          {(!q.paymentType || q.paymentType === "Domestic") && (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              Incl. GST
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          {getStatusBadge(q.status)}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/sales/quotations/${q.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-md hover:bg-muted"
                              title="View Quotation Details"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </Link>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 rounded-md hover:bg-muted"
                                >
                                  <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-48 shadow-lg border-border">
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                                Management
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleEdit(q)}
                                className="gap-2 cursor-pointer text-xs"
                              >
                                <Edit className="h-3.5 w-3.5 text-muted-foreground" /> Edit Quotation
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/sales/quotations/${q.id}`)}
                                className="gap-2 cursor-pointer text-xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /> Detailed View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                                Operations
                              </DropdownMenuLabel>
                              {q.status?.toLowerCase() !== "converted to proforma" &&
                                q.status?.toLowerCase() !== "converted to pi" && (
                                  <DropdownMenuItem
                                    className="gap-2 text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer text-xs"
                                    onClick={() => handleConvertToProforma(q)}
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" /> Convert to Proforma
                                  </DropdownMenuItem>
                                )}
                              <DropdownMenuItem
                                onClick={() => navigate(`/sales/quotations/${q.id}`)}
                                className="gap-2 cursor-pointer text-xs"
                              >
                                <FileDown className="h-3.5 w-3.5 text-muted-foreground" /> Export as PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/sales/quotations/${q.id}`)}
                                className="gap-2 cursor-pointer text-xs"
                              >
                                <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print Document
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                                Update Status
                              </DropdownMenuLabel>
                              {getAllowedNextStatuses(q.status).length > 0 ? (
                                getAllowedNextStatuses(q.status).map((st) => (
                                  <DropdownMenuItem
                                    key={st}
                                    className="gap-2 cursor-pointer text-xs"
                                    onClick={() => handleStatusUpdate(q, st)}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
                                    Mark as {st}
                                  </DropdownMenuItem>
                                ))
                              ) : (
                                <div className="px-2 py-1 text-[11px] text-muted-foreground italic">
                                  No transitions available
                                </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="p-4 border-t bg-slate-50/40 dark:bg-slate-900/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            {/* Left side: Showing count and page size selector */}
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground w-full md:w-auto justify-between md:justify-start">
              <div>
                Showing{" "}
                <span className="font-bold text-foreground">
                  {totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-foreground">
                  {Math.min(pageNumber * pageSize, totalCount)}
                </span>{" "}
                of <span className="font-bold text-foreground">{totalCount}</span> entries
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs">Rows per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val))
                    setPageNumber(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right side: Pagination Navigation Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 w-full md:w-auto justify-center md:justify-end">
              <div className="text-xs text-muted-foreground font-medium mr-2 whitespace-nowrap bg-background px-2.5 py-1 rounded-md border border-border">
                Page <span className="font-bold text-foreground">{totalCount === 0 ? 0 : currentPage}</span> of{" "}
                <span className="font-bold text-foreground">{totalCount === 0 ? 0 : totalPages}</span>
              </div>

              {/* First Page */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
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
                            ? "bg-indigo-600 text-white shadow-2xs font-semibold hover:bg-indigo-700"
                            : "hover:bg-muted"
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
                className="h-8 w-8 p-0"
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
                className="h-8 w-8 p-0"
                onClick={() => setPageNumber(totalPages)}
                disabled={pageNumber >= totalPages || isLoading || totalCount === 0}
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <QuotationFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        quotation={selectedQuotation}
        onSave={handleSave}
      />
    </div>
  )
}
