import * as React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import {
  Boxes,
  Barcode,
  Search,
  Warehouse,
  Calendar,
  Printer,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Eye,
  MapPin,
  AlertCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Package,
  Sparkles,
  X,
  ScanBarcode,
  TrendingUp,
  Layers,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  FileText
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  inventoryLotsApi,
  warehousesApi,
  type ProductLot,
  type LotsQueryParams
} from "@/lib/api"
import { generateCode128SvgMarkup } from "@/lib/barcode-utils"
import { LotBarcodePrintModal } from "@/components/inventory/lot-barcode-print-modal"

function formatCurrency(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0.00"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(val)
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  } catch {
    return dateStr
  }
}

function getExpiryStatus(expiryDateStr?: string | null) {
  if (!expiryDateStr) {
    return {
      label: "No Expiry",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300",
      isExpired: false
    }
  }
  try {
    const d = new Date(expiryDateStr)
    if (isNaN(d.getTime())) {
      return { label: expiryDateStr, badgeClass: "bg-slate-100 text-slate-700", isExpired: false }
    }
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const formatted = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

    if (diffDays < 0) {
      return {
        label: `Expired (${formatted})`,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        isExpired: true,
        diffDays
      }
    } else if (diffDays <= 60) {
      return {
        label: `Expiring Soon (${diffDays}d)`,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        isExpired: false,
        diffDays
      }
    } else {
      return {
        label: formatted,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        isExpired: false,
        diffDays
      }
    }
  } catch {
    return { label: expiryDateStr, badgeClass: "bg-slate-100 text-slate-700", isExpired: false }
  }
}

function getLotStatusBadge(status?: string, availableQty?: number) {
  const norm = (status || "Active").toLowerCase()
  if (norm === "expired") {
    return <Badge className="bg-rose-600 hover:bg-rose-600 text-white border-none">Expired</Badge>
  }
  if (norm === "depleted" || (availableQty !== undefined && availableQty <= 0)) {
    return (
      <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border">
        Depleted
      </Badge>
    )
  }
  if (norm === "pending") {
    return <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-none">Pending</Badge>
  }
  return <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-none">Active</Badge>
}

export default function InventoryUnitsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Data states
  const [lots, setLots] = useState<ProductLot[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [warehouses, setWarehouses] = useState<any[]>([])

  // Filter states
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "")
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("search") || "")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => searchParams.get("warehouseId") || "all")
  const [selectedStatus, setSelectedStatus] = useState<string>(() => searchParams.get("status") || "all")
  const [pageNumber, setPageNumber] = useState<number>(() => {
    const p = parseInt(searchParams.get("page") || "1", 10)
    return isNaN(p) || p < 1 ? 1 : p
  })
  const [pageSize, setPageSize] = useState<number>(() => {
    const ps = parseInt(searchParams.get("pageSize") || "25", 10)
    return isNaN(ps) || ps < 1 ? 25 : ps
  })

  // Barcode inspector & copy states
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [quickScanBarcode, setQuickScanBarcode] = useState("")
  const [scannedHighlightedLotId, setScannedHighlightedLotId] = useState<number | null>(null)
  const scannerInputRef = useRef<HTMLInputElement>(null)

  // Details Modal & Print Modal states
  const [selectedLotForDetails, setSelectedLotForDetails] = useState<ProductLot | null>(null)
  const [detailsModalLoading, setDetailsModalLoading] = useState(false)
  const [printModalState, setPrintModalState] = useState<{
    open: boolean
    lot?: ProductLot
    lots?: ProductLot[]
  }>({ open: false })

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPageNumber(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Sync state to URL params
  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (debouncedSearch) nextParams.set("search", debouncedSearch)
    if (selectedWarehouseId !== "all") nextParams.set("warehouseId", selectedWarehouseId)
    if (selectedStatus !== "all") nextParams.set("status", selectedStatus)
    if (pageNumber > 1) nextParams.set("page", String(pageNumber))
    if (pageSize !== 25) nextParams.set("pageSize", String(pageSize))
    setSearchParams(nextParams, { replace: true })
  }, [debouncedSearch, selectedWarehouseId, selectedStatus, pageNumber, pageSize, setSearchParams])

  // Load warehouses list once
  useEffect(() => {
    async function loadWarehouses() {
      try {
        const res = await warehousesApi.getAll()
        const raw = Array.isArray(res) ? res : (res as any)?.data || []
        setWarehouses(raw)
      } catch (err) {
        console.error("Failed to fetch warehouses:", err)
      }
    }
    loadWarehouses()
  }, [])

  // Fetch Lots data
  const fetchLots = useCallback(async () => {
    setLoading(true)
    try {
      const params: LotsQueryParams = {
        pageNumber,
        pageSize,
        warehouseId: selectedWarehouseId !== "all" ? selectedWarehouseId : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        searchTerm: debouncedSearch.trim() || undefined
      }

      const res = await inventoryLotsApi.getAll(params)
      const list: ProductLot[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res as any)
          ? (res as any)
          : []

      setLots(list)
      const count = typeof res?.totalCount === "number" ? res.totalCount : list.length
      setTotalCount(count)
    } catch (err: any) {
      console.error("Failed to load inventory lots:", err)
      toast.error(err?.response?.data?.message || err?.message || "Failed to load inventory lots")
      setLots([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [pageNumber, pageSize, selectedWarehouseId, selectedStatus, debouncedSearch])

  useEffect(() => {
    fetchLots()
  }, [fetchLots])

  // Copy to clipboard helper
  const handleCopy = (text: string, key: string, label: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Quick scanner handler
  const handleQuickScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = quickScanBarcode.trim()
    if (!code) return

    // Check if code matches any loaded lot
    const matched = lots.find(
      (l) =>
        l.lotBarcode?.toLowerCase() === code.toLowerCase() ||
        l.lotNumber?.toLowerCase() === code.toLowerCase()
    )

    if (matched) {
      setScannedHighlightedLotId(matched.lotId)
      toast.success(`Lot located: ${matched.lotNumber} (${matched.productName})`)
      setSelectedLotForDetails(matched)
      setQuickScanBarcode("")
      setTimeout(() => setScannedHighlightedLotId(null), 4000)
      return
    }

    // Otherwise, search backend specifically for this code
    try {
      const res = await inventoryLotsApi.getAll({ searchTerm: code, pageSize: 5 })
      const found: ProductLot[] = Array.isArray(res?.data) ? res.data : []
      if (found.length > 0) {
        const lot = found[0]
        toast.success(`Found lot: ${lot.lotNumber} (${lot.productName})`)
        setSelectedLotForDetails(lot)
        setSearchTerm(code)
      } else {
        toast.error(`No lot found with barcode: "${code}"`)
      }
    } catch {
      toast.error(`Error searching barcode: "${code}"`)
    } finally {
      setQuickScanBarcode("")
    }
  }

  // Open Lot Details Modal (optionally refreshing by lotId)
  const handleOpenDetails = async (lot: ProductLot) => {
    setSelectedLotForDetails(lot)
    setDetailsModalLoading(true)
    try {
      const res = await inventoryLotsApi.getById(lot.lotId)
      if (res?.data) {
        setSelectedLotForDetails(res.data)
      }
    } catch {
      // Keep row lot if specific getById is unavailable
    } finally {
      setDetailsModalLoading(false)
    }
  }

  // Open Print Modal for single lot
  const handleOpenPrintModal = (lot: ProductLot) => {
    setPrintModalState({
      open: true,
      lot,
      lots: [lot]
    })
  }

  // Open Print Modal for all currently loaded lots
  const handlePrintAllLots = () => {
    if (lots.length === 0) {
      toast.info("No lots available to print")
      return
    }
    setPrintModalState({
      open: true,
      lot: lots[0],
      lots
    })
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalAvailQty = lots.reduce((acc, l) => acc + (Number(l.availableQuantity) || 0), 0)
    const totalValuation = lots.reduce(
      (acc, l) => acc + (Number(l.availableQuantity) || 0) * (Number(l.purchasePrice) || 0),
      0
    )
    const activeLotsCount = lots.filter(
      (l) => (l.status || "Active").toLowerCase() === "active" && (Number(l.availableQuantity) || 0) > 0
    ).length
    const depletedOrExpiredCount = lots.filter(
      (l) =>
        (l.status || "").toLowerCase() === "depleted" ||
        (l.status || "").toLowerCase() === "expired" ||
        (Number(l.availableQuantity) || 0) <= 0
    ).length

    return {
      totalAvailQty,
      totalValuation,
      activeLotsCount,
      depletedOrExpiredCount
    }
  }, [lots])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const startItem = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1
  const endItem = Math.min(pageNumber * pageSize, totalCount)

  const hasActiveFilters =
    debouncedSearch !== "" || selectedWarehouseId !== "all" || selectedStatus !== "all"

  const handleClearFilters = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setSelectedWarehouseId("all")
    setSelectedStatus("all")
    setPageNumber(1)
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1700px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Inventory Lots & Batches
              </h1>
              <p className="text-xs text-muted-foreground">
                Track FIFO lots, batch inward history, stock allocations, expiry dates, and barcode labels across warehouses.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsScannerOpen((prev) => !prev)
              setTimeout(() => scannerInputRef.current?.focus(), 150)
            }}
            className={`gap-1.5 text-xs h-9 ${isScannerOpen ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" : ""}`}
          >
            <ScanBarcode className="h-4 w-4" />
            <span>{isScannerOpen ? "Close Scanner" : "Barcode Scanner"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintAllLots}
            disabled={lots.length === 0}
            className="gap-1.5 text-xs h-9 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 dark:border-indigo-800 dark:hover:bg-indigo-950/40"
          >
            <Printer className="h-4 w-4" />
            <span>Print Lot Labels</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLots}
            disabled={loading}
            className="gap-1.5 text-xs h-9"
            title="Refresh lots list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Handheld Barcode Scanner Banner */}
      {isScannerOpen && (
        <Card className="border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900 transition-all">
          <CardContent className="p-4">
            <form onSubmit={handleQuickScanSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <ScanBarcode className="absolute left-3 top-2.5 h-4 w-4 text-indigo-500" />
                <Input
                  ref={scannerInputRef}
                  value={quickScanBarcode}
                  onChange={(e) => setQuickScanBarcode(e.target.value)}
                  placeholder="Scan or type lot barcode or lot number and press Enter..."
                  className="pl-9 font-mono text-sm h-9 bg-background"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button type="submit" size="sm" className="h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                  <Search className="h-3.5 w-3.5" />
                  <span>Locate Lot</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsScannerOpen(false)}
                  className="h-9 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span>Supports handheld laser/optical scanners. Scanned code will locate the lot and open its full record.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Lots
              </span>
              <Boxes className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {totalCount}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {lots.length} loaded on this page
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Lots
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.activeLotsCount}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              With on-hand available stock
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Available Stock
              </span>
              <Layers className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground">
              {metrics.totalAvailQty}{" "}
              <span className="text-xs font-medium text-muted-foreground">PCS</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Across all filtered lots
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Stock Valuation
              </span>
              <IndianRupee className="h-4 w-4 text-violet-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground truncate">
              {formatCurrency(metrics.totalValuation)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              At inward purchase cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="shadow-2xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search lot number, barcode, product, variant, or SKU..."
                className="pl-9 h-9 text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Warehouse Select */}
            <div className="w-full sm:w-56">
              <Select
                value={selectedWarehouseId}
                onValueChange={(val: any) => {
                  setSelectedWarehouseId(String(val || "all"))
                  setPageNumber(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id || wh.warehouseId} value={String(wh.id || wh.warehouseId)}>
                      {wh.name || wh.warehouseName || `Warehouse #${wh.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Select */}
            <div className="w-full sm:w-40">
              <Select
                value={selectedStatus}
                onValueChange={(val: any) => {
                  setSelectedStatus(String(val || "all"))
                  setPageNumber(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Depleted">Depleted</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Size Select */}
            <div className="w-full sm:w-32">
              <Select
                value={String(pageSize)}
                onValueChange={(val: any) => {
                  setPageSize(Number(val) || 25)
                  setPageNumber(1)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Page Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-1 border-t text-xs text-muted-foreground flex-wrap">
              <span>Active filters:</span>
              {debouncedSearch && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Search: "{debouncedSearch}"
                  <button type="button" onClick={() => setSearchTerm("")} className="hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedWarehouseId !== "all" && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Warehouse: {warehouses.find((w) => String(w.id || w.warehouseId) === selectedWarehouseId)?.name || selectedWarehouseId}
                  <button type="button" onClick={() => setSelectedWarehouseId("all")} className="hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedStatus !== "all" && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                  Status: {selectedStatus}
                  <button type="button" onClick={() => setSelectedStatus("all")} className="hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 text-[11px] text-indigo-600 hover:text-indigo-800 p-0 ml-1 cursor-pointer"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Lots Table */}
      <Card className="shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="h-10 text-xs">
                <TableHead className="w-[240px]">Lot Number & Barcode</TableHead>
                <TableHead className="min-w-[200px]">Product & Variant</TableHead>
                <TableHead className="min-w-[170px]">Warehouse & Rack</TableHead>
                <TableHead className="text-right min-w-[130px]">Stock Quantities</TableHead>
                <TableHead className="text-right min-w-[120px]">Cost & Valuation</TableHead>
                <TableHead className="min-w-[150px]">Dates & Expiry</TableHead>
                <TableHead className="text-center w-[90px]">Status</TableHead>
                <TableHead className="text-right w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                      <span>Loading inventory lots and batches...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : lots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <Boxes className="h-10 w-10 text-muted-foreground/30 stroke-[1.2]" />
                      <p className="font-semibold text-sm text-foreground">No Inventory Lots Found</p>
                      <p className="max-w-sm text-xs text-muted-foreground">
                        {hasActiveFilters
                          ? "No lots match your current search or filter criteria. Try resetting filters."
                          : "No lot records have been generated yet. Lots are automatically created during Stock Inward."}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-2 text-xs">
                          Reset Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                lots.map((lot) => {
                  const expiry = getExpiryStatus(lot.expiryDate)
                  const lotBarcodeVal = lot.lotBarcode || lot.lotNumber
                  const lotValuation = (Number(lot.availableQuantity) || 0) * (Number(lot.purchasePrice) || 0)
                  const isHighlighted = scannedHighlightedLotId === lot.lotId
                  const initialQty = Number(lot.initialQuantity) || 0
                  const availQty = Number(lot.availableQuantity ?? lot.currentQuantity) || 0
                  const currentQty = Number(lot.currentQuantity) || 0
                  const stockPercent = initialQty > 0 ? Math.min(100, Math.round((availQty / initialQty) * 100)) : 100

                  return (
                    <TableRow
                      key={lot.lotId}
                      className={`hover:bg-muted/30 transition-colors ${
                        isHighlighted ? "bg-indigo-500/15 dark:bg-indigo-500/20 ring-1 ring-indigo-500" : ""
                      }`}
                    >
                      {/* Lot Number & Barcode */}
                      <TableCell className="align-top py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-foreground text-xs tracking-tight">
                              {lot.lotNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(lot.lotNumber, `lot-${lot.lotId}`, "Lot number")}
                              className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                              title="Copy Lot Number"
                            >
                              {copiedKey === `lot-${lot.lotId}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>

                          {/* Barcode Strip */}
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                            <Barcode className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[160px]">{lotBarcodeVal}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(lotBarcodeVal, `bc-${lot.lotId}`, "Lot barcode")}
                              className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                              title="Copy Barcode"
                            >
                              {copiedKey === `bc-${lot.lotId}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      {/* Product & Variant */}
                      <TableCell className="align-top py-3">
                        <div className="space-y-0.5">
                          <Link
                            to={`/inventory/products/view/${lot.productId}`}
                            className="font-semibold text-sm text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1 group"
                          >
                            <span>{lot.productName}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {lot.variantName || "Standard Variant"}
                          </div>
                          {lot.skuSuffix && (
                            <span className="inline-block text-[10px] font-mono font-medium text-slate-500 bg-muted px-1.5 py-0.2 rounded mt-0.5">
                              SKU Suffix: {lot.skuSuffix}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Warehouse & Rack */}
                      <TableCell className="align-top py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                            <Warehouse className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{lot.warehouseName || "Main Warehouse"}</span>
                          </div>
                          {lot.rackLocation ? (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-foreground border">
                              <MapPin className="h-3 w-3 text-indigo-500" />
                              <span>Rack: {lot.rackLocation}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">No rack assigned</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Stock Quantities */}
                      <TableCell className="align-top py-3 text-right">
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="text-base font-bold text-foreground">
                              {availQty}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                              Available PCS
                            </span>
                          </div>

                          <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-2">
                            <span>Initial: {initialQty}</span>
                            {currentQty !== availQty && <span>Current: {currentQty}</span>}
                            {Number(lot.reservedQuantity) > 0 && (
                              <span className="text-amber-600">Res: {lot.reservedQuantity}</span>
                            )}
                          </div>

                          {/* Mini visual capacity bar */}
                          <div className="w-24 ml-auto bg-muted rounded-full h-1 overflow-hidden mt-1">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Purchase Cost & Valuation */}
                      <TableCell className="align-top py-3 text-right">
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-foreground">
                            {formatCurrency(lot.purchasePrice)}
                            <span className="text-[10px] text-muted-foreground font-normal ml-0.5">/unit</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Val: <span className="font-medium text-foreground">{formatCurrency(lotValuation)}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Inward & Expiry Dates */}
                      <TableCell className="align-top py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>Inward: {formatDate(lot.inwardDate)}</span>
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] h-5 px-1.5 font-medium ${expiry.badgeClass}`}
                            >
                              <Clock className="h-2.5 w-2.5 mr-1 shrink-0" />
                              <span>{expiry.label}</span>
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-top py-3 text-center">
                        {getLotStatusBadge(lot.status, availQty)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-top py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 dark:border-indigo-800 dark:hover:bg-indigo-950/40 cursor-pointer"
                            onClick={() => handleOpenPrintModal(lot)}
                            title="Print Barcode Label"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Print</span>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            onClick={() => handleOpenDetails(lot)}
                            title="View Full Lot Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t bg-muted/10 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{startItem}</span> to{" "}
            <span className="font-semibold text-foreground">{endItem}</span> of{" "}
            <span className="font-semibold text-foreground">{totalCount}</span> lots
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber <= 1 || loading}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="h-8 px-2 gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <span className="px-2 font-medium">
              Page {pageNumber} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber >= totalPages || loading}
              onClick={() => setPageNumber((p) => p + 1)}
              className="h-8 px-2 gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Lot Inspection Details Modal */}
      <Dialog open={!!selectedLotForDetails} onOpenChange={(open) => !open && setSelectedLotForDetails(null)}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedLotForDetails && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold font-mono">
                    Lot #{selectedLotForDetails.lotNumber}
                  </DialogTitle>
                  {getLotStatusBadge(selectedLotForDetails.status, selectedLotForDetails.availableQuantity)}
                </div>
                <DialogDescription>
                  Full warehouse inward batch, stock distribution, and tracking metadata.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Barcode Render Strip */}
                <div className="p-3 rounded-xl border bg-muted/20 flex flex-col items-center justify-center gap-2">
                  <div
                    className="overflow-x-auto max-w-full"
                    dangerouslySetInnerHTML={{
                      __html: generateCode128SvgMarkup(
                        selectedLotForDetails.lotBarcode || selectedLotForDetails.lotNumber,
                        { height: 48, showText: true }
                      )
                    }}
                  />
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-1">
                    <span>Barcode: {selectedLotForDetails.lotBarcode || selectedLotForDetails.lotNumber}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          selectedLotForDetails.lotBarcode || selectedLotForDetails.lotNumber,
                          "modal-bc",
                          "Barcode"
                        )
                      }
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {copiedKey === "modal-bc" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Product & Variant Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border bg-card space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product</span>
                    <div className="font-semibold text-sm text-foreground">{selectedLotForDetails.productName}</div>
                    <div className="text-muted-foreground">ID: #{selectedLotForDetails.productId}</div>
                  </div>

                  <div className="p-3 rounded-lg border bg-card space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Variant</span>
                    <div className="font-semibold text-sm text-foreground">{selectedLotForDetails.variantName}</div>
                    <div className="font-mono text-muted-foreground">
                      Variant ID: #{selectedLotForDetails.variantId} {selectedLotForDetails.skuSuffix && `• ${selectedLotForDetails.skuSuffix}`}
                    </div>
                  </div>
                </div>

                {/* Stock Quantities Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg border bg-muted/20 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Initial Inward</span>
                    <div className="text-lg font-bold text-foreground mt-0.5">{selectedLotForDetails.initialQuantity}</div>
                    <span className="text-[10px] text-muted-foreground">PCS</span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-muted/20 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Current Stock</span>
                    <div className="text-lg font-bold text-foreground mt-0.5">{selectedLotForDetails.currentQuantity}</div>
                    <span className="text-[10px] text-muted-foreground">PCS</span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">Reserved</span>
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-0.5">{selectedLotForDetails.reservedQuantity || 0}</div>
                    <span className="text-[10px] text-amber-800 dark:text-amber-400">PCS</span>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Available</span>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{selectedLotForDetails.availableQuantity}</div>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-400">PCS</span>
                  </div>
                </div>

                {/* Warehouse Location & Financials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border bg-card space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Storage Location</span>
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedLotForDetails.warehouseName || "Main Central Warehouse"}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Rack Location: <span className="font-mono font-medium text-foreground">{selectedLotForDetails.rackLocation || "Not Assigned"}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border bg-card space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pricing & Value</span>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Purchase Cost:</span>
                      <span className="font-semibold text-foreground">{formatCurrency(selectedLotForDetails.purchasePrice)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Lot Value:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(
                          (Number(selectedLotForDetails.availableQuantity) || 0) * (Number(selectedLotForDetails.purchasePrice) || 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit & Order References */}
                <div className="p-3 rounded-lg border bg-muted/10 text-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inward & Traceability</span>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      <span>Inward Order: </span>
                      {selectedLotForDetails.inwardOrderId ? (
                        <Link
                          to={`/inventory/stock-inward/${selectedLotForDetails.inwardOrderId}`}
                          className="font-medium text-indigo-600 hover:underline"
                        >
                          #{selectedLotForDetails.inwardOrderId}
                        </Link>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                    <div>
                      <span>Inward Date: </span>
                      <span className="font-medium text-foreground">{formatDate(selectedLotForDetails.inwardDate)}</span>
                    </div>
                    <div>
                      <span>Expiry Date: </span>
                      <span className="font-medium text-foreground">{formatDate(selectedLotForDetails.expiryDate)}</span>
                    </div>
                    <div>
                      <span>Created At: </span>
                      <span className="font-medium text-foreground">{formatDate(selectedLotForDetails.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/inventory/products/view/${selectedLotForDetails.productId}`)}
                  className="gap-1.5 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View Product</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const l = selectedLotForDetails
                    setSelectedLotForDetails(null)
                    handleOpenPrintModal(l)
                  }}
                  className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Barcode Label</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lot Barcode Print Modal */}
      <LotBarcodePrintModal
        open={printModalState.open}
        onOpenChange={(open) => setPrintModalState((prev) => ({ ...prev, open }))}
        product={
          printModalState.lot
            ? {
                productId: printModalState.lot.productId,
                productName: printModalState.lot.productName,
                baseSKU: printModalState.lot.productName
              }
            : undefined
        }
        variant={
          printModalState.lot
            ? {
                variantId: printModalState.lot.variantId,
                variantName: printModalState.lot.variantName,
                skuSuffix: printModalState.lot.skuSuffix
              }
            : undefined
        }
        lots={printModalState.lots || (printModalState.lot ? [printModalState.lot] : [])}
        initialSelectedLotId={printModalState.lot?.lotId}
      />
    </div>
  )
}
