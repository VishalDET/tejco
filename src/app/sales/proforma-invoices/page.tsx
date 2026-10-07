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
  ShoppingCart,
  RefreshCw,
  Loader2,
  Receipt,
  Mail,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  UserCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { SalesDocumentStatus } from "../types"
import { ProformaInvoice } from "./types"
import { ProformaFormDialog } from "./proforma-form-dialog"
import { proformaApi, clientsApi, quotationsApi } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { SearchableDropdown, SearchableOption } from "@/components/common"
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
  "Accepted": ["Converted To Sales Order"],
  "Rejected": ["Draft"],
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

const formatCurrency = (amount: number, currency?: string) => {
  const curr = (currency || "INR").toUpperCase()
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: curr === "USD" ? "USD" : curr === "EUR" ? "EUR" : "INR",
    maximumFractionDigits: 0
  }).format(amount)
}

export default function ProformaInvoicesPage() {
  const navigate = useNavigate()
  const router = useNavigate()
  const [proformas, setProformas] = React.useState<ProformaInvoice[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedProforma, setSelectedProforma] = React.useState<ProformaInvoice | null>(null)
  const [sendingEmailId, setSendingEmailId] = React.useState<string | null>(null)
  const [convertingId, setConvertingId] = React.useState<string | number | null>(null)

  // Server Filter States
  const [searchTerm, setSearchTerm] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [clientFilter, setClientFilter] = React.useState<string>("all")
  const [startDate, setStartDate] = React.useState<string>("")
  const [endDate, setEndDate] = React.useState<string>("")

  // Clients list for client filter dropdown
  const [clientsList, setClientsList] = React.useState<{ id: string | number; name: string }[]>([])

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

  // Load clients list for the client filter dropdown
  React.useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await clientsApi.getAll({ pageSize: 100 })
        const list = res.clients || []
        setClientsList(list.map(c => ({ id: c.id, name: c.name || c.company || `Client #${c.id}` })))
      } catch (e) {
        console.error("Failed to load clients list for proforma filter:", e)
      }
    }
    loadClients()
  }, [])

  const { user } = useAuth()
  const isSalesPerson =
    Number(user?.roleId) === 3 ||
    String(user?.role || "").toLowerCase().includes("sales person") ||
    String(user?.role || "").toLowerCase() === "salesperson"
  const currentSalesPersonId = isSalesPerson
    ? String(user?.userId || user?.id || (user as any)?.salesPersonId || "")
    : ""

  const fetchProformas = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      if (isSalesPerson && currentSalesPersonId) {
        const list = await proformaApi.getBySalesPerson(currentSalesPersonId)

        let filtered = list
        if (debouncedSearch) {
          const lower = debouncedSearch.toLowerCase()
          filtered = filtered.filter(
            p =>
              p.number?.toLowerCase().includes(lower) ||
              p.proformaNumber?.toLowerCase().includes(lower) ||
              p.clientName?.toLowerCase().includes(lower) ||
              p.subject?.toLowerCase().includes(lower)
          )
        }
        if (clientFilter !== "all") {
          filtered = filtered.filter(p => String(p.clientId) === String(clientFilter))
        }
        if (statusFilter !== "all") {
          filtered = filtered.filter(
            p => String(p.status || "").toLowerCase() === statusFilter.toLowerCase()
          )
        }
        if (startDate) {
          const startTs = new Date(startDate).getTime()
          filtered = filtered.filter(p => p.date && new Date(p.date).getTime() >= startTs)
        }
        if (endDate) {
          const endTs = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1
          filtered = filtered.filter(p => p.date && new Date(p.date).getTime() <= endTs)
        }

        const total = filtered.length
        const startIdx = (pageNumber - 1) * pageSize
        const paginated = filtered.slice(startIdx, startIdx + pageSize)

        setProformas(paginated)
        setTotalCount(total)
      } else {
        const res = await proformaApi.getAll({
          PageNumber: pageNumber,
          PageSize: pageSize,
          SearchTerm: debouncedSearch || undefined,
          ClientId: clientFilter !== "all" ? clientFilter : undefined,
          Status: statusFilter !== "all" ? statusFilter : undefined,
          StartDate: startDate || undefined,
          EndDate: endDate || undefined,
        })

        if (Array.isArray(res)) {
          setProformas(res)
          setTotalCount(res.length)
        } else if (res && typeof res === "object") {
          setProformas(res.data || [])
          setTotalCount(res.totalCount || (res.data ? res.data.length : 0))
        }
      }
    } catch (error) {
      console.error("Failed to fetch proforma invoices:", error)
      toast.error("Failed to load proforma invoices. Please try again.")
      setProformas([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [pageNumber, pageSize, debouncedSearch, clientFilter, statusFilter, startDate, endDate, isSalesPerson, currentSalesPersonId])

  React.useEffect(() => {
    fetchProformas()
  }, [fetchProformas])

  // Handle incoming conversion from a quotation
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("convert") === "true") {
      const sourceData = localStorage.getItem("convert_source_data")
      if (sourceData) {
        try {
          const parsed = JSON.parse(sourceData)
          const prefilled: Partial<ProformaInvoice> = {
            ...parsed,
            proformaId: 0,
            number: `PI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split("T")[0],
            status: "Draft",
            sourceQuotationId: parsed.id || parsed.sourceId,
          }
          setSelectedProforma(prefilled as ProformaInvoice)
          setIsDialogOpen(true)
        } catch (e) {
          console.error("Failed to parse convert source data:", e)
        }
        window.history.replaceState({}, "", window.location.pathname)
        localStorage.removeItem("convert_source_data")
      }
    }
  }, [])

  const handleSendEmail = async (p: ProformaInvoice) => {
    try {
      setSendingEmailId(p.id)
      await proformaApi.sendEmail(p.proformaId || p.id)
      toast.success(`Email sent successfully for Proforma Invoice ${p.number || p.proformaNumber}`)
    } catch (err: any) {
      console.error("Failed to send email:", err)
      toast.error(err?.message || "Failed to send email.")
    } finally {
      setSendingEmailId(null)
    }
  }

  const handleCreate = () => {
    setSelectedProforma(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (p: ProformaInvoice) => {
    setSelectedProforma(p)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    fetchProformas(true)
  }

  const handleConvertToOrder = async (p: ProformaInvoice) => {
    if (p.status?.toLowerCase() === "converted to sales order") return
    setConvertingId(p.id)

    try {
      // 1. Resolve client ID directly or via fallback strategies
      let resolvedClientId =
        p.clientId && !isNaN(Number(p.clientId)) && Number(p.clientId) > 0
          ? Number(p.clientId)
          : 0

      let resolvedClientName = p.clientName || ""
      let fullProforma: ProformaInvoice | null = null

      // Fetch full proforma details if clientId is missing or 0
      if (!resolvedClientId) {
        try {
          fullProforma = await proformaApi.getById(String(p.proformaId || p.id))
          const rawCId =
            fullProforma?.clientId ||
            (fullProforma as any)?.customerId ||
            (fullProforma as any)?.customerMasterId ||
            (fullProforma as any)?.clientMasterId
          if (rawCId && !isNaN(Number(rawCId)) && Number(rawCId) > 0) {
            resolvedClientId = Number(rawCId)
          }
          if (fullProforma?.clientName && !resolvedClientName) {
            resolvedClientName = fullProforma.clientName
          }
        } catch (e) {
          console.error("Failed to fetch detailed proforma for client ID:", e)
        }
      }

      // 2. Check local clientsList by name / company
      const targetClientName = (resolvedClientName || (p as any)?.billingName || "").trim()
      if (!resolvedClientId && targetClientName) {
        const lowerName = targetClientName.toLowerCase()
        const match = clientsList.find(c =>
          c.name?.trim().toLowerCase() === lowerName ||
          (c as any).company?.trim().toLowerCase() === lowerName
        )
        if (match && match.id && !isNaN(Number(match.id)) && Number(match.id) > 0) {
          resolvedClientId = Number(match.id)
          resolvedClientName = match.name || resolvedClientName
        }
      }

      // 3. Search clients via API by client name using searchBy="ClientName"
      if (!resolvedClientId && targetClientName) {
        const searchTerms = [
          targetClientName,
          targetClientName.split(/[-–—(]/)[0].trim(),
          targetClientName.split(/\s+/).slice(0, 3).join(" ").trim(),
        ].filter(Boolean)

        for (const term of searchTerms) {
          if (resolvedClientId) break
          if (!term || term.length < 2) continue
          try {
            const clientRes = await clientsApi.getAll({
              search: term,
              searchBy: "ClientName",
              pageSize: 20,
            })
            const list = clientRes.clients || []
            const lowerTarget = targetClientName.toLowerCase()
            const match =
              list.find(c => c.name?.trim().toLowerCase() === lowerTarget) ||
              list.find(c => lowerTarget.includes(c.name?.trim().toLowerCase())) ||
              list.find(c => c.name?.trim().toLowerCase().includes(term.toLowerCase())) ||
              (list.length === 1 ? list[0] : null)

            if (match && match.id && !isNaN(Number(match.id)) && Number(match.id) > 0) {
              resolvedClientId = Number(match.id)
              resolvedClientName = match.name || resolvedClientName
              break
            }
          } catch (e) {
            console.error("Failed to query clients API with searchBy=ClientName:", e)
          }
        }
      }

      // 4. Check linked quotation for clientId
      const quoteId = p.sourceQuotationId || fullProforma?.sourceQuotationId || (p as any).linkedQuotationId
      if (!resolvedClientId && quoteId) {
        try {
          const quote = await quotationsApi.getById(String(quoteId))
          if (quote?.clientId && !isNaN(Number(quote.clientId)) && Number(quote.clientId) > 0) {
            resolvedClientId = Number(quote.clientId)
            if (quote.clientName) resolvedClientName = quote.clientName
          }
        } catch (e) {
          console.error("Failed to fetch linked quotation client ID:", e)
        }
      }

      const salesPersonIdNum = (p.salesPersonId && !isNaN(Number(p.salesPersonId)))
        ? Number(p.salesPersonId)
        : (fullProforma?.salesPersonId && !isNaN(Number(fullProforma.salesPersonId)))
        ? Number(fullProforma.salesPersonId)
        : 0

      const payload = {
        clientId: resolvedClientId,
        ClientId: resolvedClientId,
        salesPersonId: salesPersonIdNum,
        SalesPersonId: salesPersonIdNum,
        targetDeliveryDate: p.validUntil || fullProforma?.validUntil
          ? new Date(p.validUntil || fullProforma?.validUntil || "").toISOString()
          : new Date().toISOString(),
        orderNotes: p.notes || fullProforma?.notes || p.paymentTerms || p.subject || "",
      }

      try {
        await proformaApi.convertToSalesOrder(p.proformaId, payload)
        setProformas(prev =>
          prev.map(o =>
            o.id === p.id
              ? ({
                  ...o,
                  clientId: resolvedClientId ? String(resolvedClientId) : o.clientId,
                  clientName: resolvedClientName || o.clientName,
                  status: "Converted to Sales Order",
                } as ProformaInvoice)
              : o
          )
        )
        toast.success("Proforma invoice converted to Sales Order successfully.")
      } catch (apiErr: any) {
        console.error("convertToSalesOrder API warning:", apiErr)
      }

      if (!resolvedClientId) {
        toast.info("Please confirm or select the client on the Sales Order form.")
      }

      const mergedData = {
        ...p,
        ...(fullProforma || {}),
        clientId: resolvedClientId ? String(resolvedClientId) : "",
        clientName: resolvedClientName || p.clientName || "",
        sourceId: p.id,
        proformaId: p.proformaId,
        quotationId: quoteId ? parseInt(String(quoteId)) : 0,
        number: "",
        status: "Pending",
        paymentStatus: "Unpaid",
        date: new Date().toISOString().split("T")[0],
      }

      localStorage.setItem("convert_source_data", JSON.stringify(mergedData))
      navigate("/sales/orders?convert=true")
    } catch (err: any) {
      console.error("Failed to convert proforma to sales order:", err)
      toast.error(err?.message || "Failed to convert proforma to sales order.")
    } finally {
      setConvertingId(null)
    }
  }

  const handleStatusUpdate = async (p: ProformaInvoice, newStatus: string, remarks?: string) => {
    try {
      await proformaApi.updateStatus(p.proformaId || p.id, newStatus, remarks)
      toast.success(`Proforma invoice status updated to "${newStatus}".`)
      setProformas(prev =>
        prev.map(item =>
          item.id === p.id ? ({ ...item, status: newStatus as SalesDocumentStatus } as ProformaInvoice) : item
        )
      )
    } catch (err: any) {
      console.error("Failed to update status:", err)
      toast.error(err?.message || "Failed to update proforma status.")
    }
  }

  const handleDelete = async (p: ProformaInvoice) => {
    if (!confirm(`Delete proforma ${p.number}?`)) return
    try {
      await proformaApi.remove(String(p.proformaId))
      toast.success("Proforma invoice deleted.")
      fetchProformas(true)
    } catch {
      toast.error("Failed to delete proforma invoice.")
    }
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setStatusFilter("all")
    setClientFilter("all")
    setStartDate("")
    setEndDate("")
    setPageNumber(1)
  }

  const hasActiveFilters = Boolean(
    searchTerm ||
    statusFilter !== "all" ||
    clientFilter !== "all" ||
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

    for (const p of proformas) {
      totalValue += Number(p.totalAmount || 0)
      const st = (p.status || "").toLowerCase().trim()
      if (st === "draft") draftCount++
      else if (st === "issued") issuedCount++
      else if (st === "converted to sales order" || st === "converted to order") convertedCount++
    }

    return {
      totalCount: totalCount || proformas.length,
      totalValue,
      draftCount,
      issuedCount,
      convertedCount,
    }
  }, [proformas, totalCount])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Proforma Invoices
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage advance invoices, customer approvals, and sales order conversions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchProformas(true)}
            disabled={isLoading || isRefreshing}
            className="hover:rotate-180 transition-transform duration-500"
            title="Refresh list"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button onClick={handleCreate} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
            <Plus className="h-4 w-4" /> New Proforma
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Proformas */}
        <Card className="border-border/70 shadow-xs hover:shadow-md transition-shadow bg-linear-to-br from-indigo-50/40 via-background to-background dark:from-indigo-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Invoices</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {isLoading ? <Skeleton className="h-7 w-12" /> : kpis.totalCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">All generated proformas</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Draft Invoices */}
        <Card className="border-border/70 shadow-xs hover:shadow-md transition-shadow bg-linear-to-br from-slate-50/60 via-background to-background dark:from-slate-900/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Draft Invoices</p>
              <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                {isLoading ? <Skeleton className="h-7 w-12" /> : kpis.draftCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Drafted / In preparation</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Converted to Order */}
        <Card className="border-border/70 shadow-xs hover:shadow-md transition-shadow bg-linear-to-br from-emerald-50/40 via-background to-background dark:from-emerald-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Converted to Order</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {isLoading ? <Skeleton className="h-7 w-12" /> : kpis.convertedCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active sales orders created</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Value */}
        <Card className="border-border/70 shadow-xs hover:shadow-md transition-shadow bg-linear-to-br from-amber-50/40 via-background to-background dark:from-amber-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Page Value</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                {isLoading ? <Skeleton className="h-7 w-24" /> : formatCurrency(kpis.totalValue)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Gross proforma amount</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Proformas Table Card */}
      <Card className="shadow-xs border-border/70 overflow-hidden">
        {/* Controls & Filter Header */}
        <div className="p-4 sm:p-5 border-b bg-slate-50/40 dark:bg-slate-900/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Search Input */}
            <div className="lg:col-span-3 space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PI #, client, subject..."
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

            {/* Client Filter (Searchable Dropdown) */}
            <div className="lg:col-span-3 space-y-1">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Client</Label>
              <SearchableDropdown
                value={clientFilter === "all" ? "" : clientFilter}
                onChange={(val) => {
                  setClientFilter(val ? val : "all")
                  setPageNumber(1)
                }}
                placeholder="All Clients"
                searchPlaceholder="Search client by name or ID..."
                allowClear={true}
                options={[
                  { value: "all", label: "All Clients" },
                  ...clientsList.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                    badge: `#${c.id}`,
                    keywords: [String(c.id), c.name],
                  })),
                ]}
                className="w-full"
                triggerClassName="h-9 text-xs bg-background"
                emptyMessage="No matching clients found"
              />
            </div>

            {/* Status Select */}
            <div className="lg:col-span-2 space-y-1">
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
                  <SelectItem value="Converted To Sales Order">Converted To Sales Order</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="lg:col-span-1.5 space-y-1">
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
            <div className="lg:col-span-1.5 space-y-1">
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
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[170px] py-3.5 px-4 font-semibold text-xs">PI Number</TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs">Client / Doctor</TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs">Date</TableHead>
                  <TableHead className="py-3.5 px-4 font-semibold text-xs">Validity</TableHead>
                  <TableHead className="text-right py-3.5 px-4 font-semibold text-xs">Total Amount</TableHead>
                  <TableHead className="text-center py-3.5 px-4 font-semibold text-xs">Status</TableHead>
                  <TableHead className="text-right py-3.5 px-4 font-semibold text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-44" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-3"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="px-4 py-3 text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell className="px-4 py-3 text-center"><Skeleton className="h-6 w-18 mx-auto rounded-full" /></TableCell>
                      <TableCell className="px-4 py-3 text-right"><Skeleton className="h-7 w-7 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : proformas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-60 text-center py-10">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground max-w-sm mx-auto">
                        <div className="p-3 bg-muted/60 rounded-full mb-1">
                          <Receipt className="h-6 w-6 opacity-40 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">No proforma invoices found</p>
                        <p className="text-xs text-muted-foreground">
                          {hasActiveFilters
                            ? "No proforma invoices match your current search, client, status, or date range filter."
                            : "No proforma invoices have been created yet."}
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
                  proformas.map((p, idx) => (
                    <TableRow key={p.id || `proforma-${idx}`} className="group hover:bg-muted/40 transition-colors">
                      {/* PI Number */}
                      <TableCell className="py-3 px-4 whitespace-nowrap">
                        <Link
                          to={`/sales/proforma-invoices/${p.id}`}
                          className="font-mono text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {p.number || p.proformaNumber || `PI-${p.id}`}
                        </Link>
                      </TableCell>

                      {/* Client */}
                      <TableCell className="py-3 px-4">
                        <div className="flex flex-col max-w-[240px]">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {p.clientName || "—"}
                          </span>
                          {p.subject && (
                            <span className="text-[11px] text-muted-foreground truncate" title={p.subject}>
                              {p.subject}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {p.date ? new Date(p.date).toLocaleDateString("en-GB") : "—"}
                      </TableCell>

                      {/* Validity */}
                      <TableCell className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {p.validUntil ? new Date(p.validUntil).toLocaleDateString("en-GB") : "—"}
                      </TableCell>

                      {/* Total Amount */}
                      <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-xs text-foreground">
                            {getCurrencySymbol((p as any).currencyType)}
                            {Number(p.totalAmount || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          {(!p.paymentType || p.paymentType === "Domestic") && (
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                              Incl. GST
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 px-4 text-center whitespace-nowrap">
                        {getStatusBadge(p.status)}
                      </TableCell>

                      {/* Actions Dropdown */}
                      <TableCell className="py-3 px-4 text-right whitespace-nowrap">
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
                              onClick={() => handleEdit(p)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/sales/proforma-invoices/${p.id}`)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                              Operations
                            </DropdownMenuLabel>
                            {p.status?.toLowerCase() !== "converted to sales order" && (
                              <DropdownMenuItem
                                className="gap-2 text-emerald-600 font-semibold cursor-pointer text-xs focus:bg-emerald-50"
                                onClick={() => handleConvertToOrder(p)}
                                disabled={convertingId === p.id}
                              >
                                {convertingId === p.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                )}
                                {convertingId === p.id ? "Converting..." : "Convert to Order"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => navigate(`/sales/proforma-invoices/${p.id}`)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <FileDown className="h-3.5 w-3.5 text-muted-foreground" /> Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigate(`/sales/proforma-invoices/${p.id}`)}
                              className="gap-2 cursor-pointer text-xs"
                            >
                              <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print Document
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs"
                              onClick={() => handleSendEmail(p)}
                              disabled={sendingEmailId === p.id}
                            >
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {sendingEmailId === p.id ? "Sending Email..." : "Send Email"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                              Update Status
                            </DropdownMenuLabel>
                            {getAllowedNextStatuses(p.status).length > 0 ? (
                              getAllowedNextStatuses(p.status).map((st) => (
                                <DropdownMenuItem
                                  key={st}
                                  className="gap-2 cursor-pointer text-xs"
                                  onClick={() => handleStatusUpdate(p, st)}
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-destructive cursor-pointer text-xs focus:bg-destructive/5"
                              onClick={() => handleDelete(p)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                        <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground select-none">
                          …
                        </span>
                      )
                    }
                    const isCurrent = p === pageNumber
                    return (
                      <Button
                        key={`page-${p}`}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        className={`h-8 w-8 p-0 text-xs font-semibold ${isCurrent ? "pointer-events-none shadow-xs" : ""}`}
                        onClick={() => setPageNumber(Number(p))}
                        disabled={isLoading}
                      >
                        {p}
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

      <ProformaFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        proforma={selectedProforma}
        onSave={handleSave}
      />
    </div>
  )
}

