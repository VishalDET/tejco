import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  FileText,
  Percent,
  RotateCcw,
  Sparkles,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Search,
  RefreshCw,
  Users,
  Building2,
  Package,
  Layers,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts"
import * as XLSX from "xlsx"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  salesDashboardApi,
  type SalesDashboardKPIs,
  type HistoricalTrendItem,
  type PipelineFunnelItem,
  type ForecastResponse,
  type TopSalesPersonItem,
  type TopClientItem,
  type TopProductItem,
  type SalesVsTargetItem,
  type SalesRecordItem,
  type SalesRecordsParams
} from "@/lib/api"

// Helper: Format INR Currency
const formatINR = (val?: number | null) => {
  if (val === undefined || val === null || isNaN(val)) return "₹0"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val)
}

const formatCompactINR = (val?: number | null) => {
  if (val === undefined || val === null || isNaN(val)) return "₹0"
  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`
  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(2)} L`
  if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(1)} K`
  return `₹${val.toFixed(0)}`
}

export default function IntelligenceAnalyticsPage() {
  // Global Filters & Controls
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lookbackMonths, setLookbackMonths] = useState<number>(12)
  const [forecastLookback, setForecastLookback] = useState<number>(6)
  const [forecastMonths, setForecastMonths] = useState<number>(3)
  const [performersDatePreset, setPerformersDatePreset] = useState<string>("12m")
  const [performersLimit, setPerformersLimit] = useState<number>(10)
  const [selectedSalesPersonForTarget, setSelectedSalesPersonForTarget] = useState<string>("all")

  // Data States
  const [kpis, setKpis] = useState<SalesDashboardKPIs | null>(null)
  const [historicalTrend, setHistoricalTrend] = useState<HistoricalTrendItem[]>([])
  const [pipelineFunnel, setPipelineFunnel] = useState<PipelineFunnelItem[]>([])
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null)
  const [topSalesPersons, setTopSalesPersons] = useState<TopSalesPersonItem[]>([])
  const [topClients, setTopClients] = useState<TopClientItem[]>([])
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([])
  const [vsTargetData, setVsTargetData] = useState<SalesVsTargetItem[]>([])

  // Sales Records Grid State
  const [salesRecords, setSalesRecords] = useState<SalesRecordItem[]>([])
  const [recordsTotalCount, setRecordsTotalCount] = useState<number>(0)
  const [recordsPage, setRecordsPage] = useState<number>(1)
  const [recordsPageSize, setRecordsPageSize] = useState<number>(15)
  const [recordsStatus, setRecordsStatus] = useState<string>("all")
  const [recordsSearch, setRecordsSearch] = useState<string>("")
  const [recordsLoading, setRecordsLoading] = useState<boolean>(false)

  // Calculate Date Ranges for Performers & Target
  const getDateRange = useCallback((preset: string) => {
    const end = new Date()
    const start = new Date()
    if (preset === "3m") {
      start.setMonth(end.getMonth() - 3)
    } else if (preset === "6m") {
      start.setMonth(end.getMonth() - 6)
    } else if (preset === "ytd") {
      start.setMonth(0, 1)
    } else {
      // 12m default
      start.setMonth(end.getMonth() - 12)
    }
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0]
    }
  }, [])

  // Initial & Filter Data Loader
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    const dateRange = getDateRange(performersDatePreset)

    try {
      const [
        kpiRes,
        trendRes,
        funnelRes,
        forecastRes,
        salesPersonsRes,
        clientsRes,
        productsRes,
        vsTargetRes
      ] = await Promise.allSettled([
        salesDashboardApi.getKPIs(),
        salesDashboardApi.getHistoricalTrend(lookbackMonths),
        salesDashboardApi.getPipelineFunnel(),
        salesDashboardApi.getForecast(forecastLookback, forecastMonths),
        salesDashboardApi.getTopSalesPersons({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: performersLimit
        }),
        salesDashboardApi.getTopClients({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: performersLimit
        }),
        salesDashboardApi.getTopProducts({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          limit: performersLimit
        }),
        salesDashboardApi.getVsTarget({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          salesPersonId: selectedSalesPersonForTarget === "all" ? undefined : selectedSalesPersonForTarget
        })
      ])

      if (kpiRes.status === "fulfilled" && kpiRes.value?.data) {
        setKpis(kpiRes.value.data)
      }
      if (trendRes.status === "fulfilled" && Array.isArray(trendRes.value?.data)) {
        setHistoricalTrend(trendRes.value.data)
      }
      if (funnelRes.status === "fulfilled" && Array.isArray(funnelRes.value?.data)) {
        setPipelineFunnel(funnelRes.value.data)
      }
      if (forecastRes.status === "fulfilled" && forecastRes.value?.data) {
        setForecastData(forecastRes.value.data)
      }
      if (salesPersonsRes.status === "fulfilled" && Array.isArray(salesPersonsRes.value?.data)) {
        setTopSalesPersons(salesPersonsRes.value.data)
      }
      if (clientsRes.status === "fulfilled" && Array.isArray(clientsRes.value?.data)) {
        setTopClients(clientsRes.value.data)
      }
      if (productsRes.status === "fulfilled" && Array.isArray(productsRes.value?.data)) {
        setTopProducts(productsRes.value.data)
      }
      if (vsTargetRes.status === "fulfilled" && Array.isArray(vsTargetRes.value?.data)) {
        setVsTargetData(vsTargetRes.value.data)
      }
    } catch (err) {
      console.error("Failed to load intelligence dashboard data", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [lookbackMonths, forecastLookback, forecastMonths, performersDatePreset, performersLimit, selectedSalesPersonForTarget, getDateRange])

  // Load Sales Records Grid
  const loadSalesRecords = useCallback(async () => {
    setRecordsLoading(true)
    try {
      const params: SalesRecordsParams = {
        pageNumber: recordsPage,
        pageSize: recordsPageSize,
        status: recordsStatus === "all" ? undefined : recordsStatus
      }
      const res: any = await salesDashboardApi.getSalesRecords(params)
      if (res) {
        if (Array.isArray(res)) {
          setSalesRecords(res)
          setRecordsTotalCount(res.length)
        } else if (res.data && Array.isArray(res.data)) {
          setSalesRecords(res.data)
          setRecordsTotalCount(res.totalCount ?? res.data.length)
        } else if (res.items && Array.isArray(res.items)) {
          setSalesRecords(res.items)
          setRecordsTotalCount(res.totalCount ?? res.items.length)
        }
      }
    } catch (err) {
      console.error("Failed to fetch sales records", err)
    } finally {
      setRecordsLoading(false)
    }
  }, [recordsPage, recordsPageSize, recordsStatus])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  useEffect(() => {
    loadSalesRecords()
  }, [loadSalesRecords])

  // Prepare combined continuous chart for Historical + Forecast projection
  const combinedForecastChartData = useMemo(() => {
    if (!forecastData) return []
    const points: any[] = []

    // Historical part
    if (forecastData.historicalData) {
      forecastData.historicalData.forEach((h) => {
        points.push({
          label: h.monthName,
          actual: h.totalRevenue,
          projected: null,
          lower: null,
          upper: null,
          isForecast: false,
          confidence: null
        })
      })
    }

    // Bridge point: Connect last historical point to first forecast
    const lastHistorical = forecastData.historicalData?.[forecastData.historicalData.length - 1]
    if (lastHistorical && forecastData.forecast?.length > 0) {
      const firstFc = forecastData.forecast[0]
      // Replace or blend bridging
    }

    // Forecast items
    if (forecastData.forecast) {
      forecastData.forecast.forEach((f) => {
        points.push({
          label: f.forecastMonth,
          actual: null,
          projected: f.estimatedRevenue,
          lower: f.lowerBound,
          upper: f.upperBound,
          isForecast: true,
          confidence: f.confidenceLabel
        })
      })
    }

    return points
  }, [forecastData])

  // Group Pipeline Funnel by Document Type
  const funnelByDocType = useMemo(() => {
    const map: Record<string, { totalCount: number; totalValue: number; stages: PipelineFunnelItem[] }> = {}
    pipelineFunnel.forEach((item) => {
      if (!map[item.documentType]) {
        map[item.documentType] = { totalCount: 0, totalValue: 0, stages: [] }
      }
      map[item.documentType].totalCount += item.documentCount
      map[item.documentType].totalValue += item.totalValue
      map[item.documentType].stages.push(item)
    })
    return map
  }, [pipelineFunnel])

  // Client-side search filtering on sales records table
  const filteredSalesRecords = useMemo(() => {
    if (!recordsSearch.trim()) return salesRecords
    const query = recordsSearch.toLowerCase()
    return salesRecords.filter((rec) =>
      rec.orderNumber?.toLowerCase().includes(query) ||
      rec.clientName?.toLowerCase().includes(query) ||
      rec.salesPersonName?.toLowerCase().includes(query) ||
      rec.productName?.toLowerCase().includes(query) ||
      rec.categoryName?.toLowerCase().includes(query)
    )
  }, [salesRecords, recordsSearch])

  // Excel Export Handler
  const handleExportSalesRecords = () => {
    if (!filteredSalesRecords.length) return

    const exportRows = filteredSalesRecords.map((r) => ({
      "Order Number": r.orderNumber,
      "Order Date": r.orderDate ? new Date(r.orderDate).toLocaleDateString("en-IN") : "-",
      "Client Name": r.clientName,
      "Sales Representative": r.salesPersonName,
      "Product": r.productName,
      "Category": r.categoryName,
      "Quantity": r.quantity,
      "Unit Price (₹)": r.unitPrice,
      "Total Price (₹)": r.totalPrice,
      "Status": r.orderStatus
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Records")
    XLSX.writeFile(workbook, `Tejco_Sales_Records_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  // Calculate Cumulative Targets vs Actuals
  const targetSummary = useMemo(() => {
    const totalActual = vsTargetData.reduce((acc, curr) => acc + (curr.actualRevenue || 0), 0)
    const totalTarget = vsTargetData.reduce((acc, curr) => acc + (curr.targetAmount || 0), 0)
    const overallPct = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0
    return { totalActual, totalTarget, overallPct }
  }, [vsTargetData])

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="h-3.5 w-3.5" />
            Executive Sales Intelligence & Forecasting
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Advanced Analytics
          </h1>
          <p className="text-sm text-slate-300">
            Real-time business health, pipeline telemetry, moving average forecasts & performance benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing || loading}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Intelligence"}
          </Button>
        </div>
      </div>

      {/* 1. Real-Time Sales KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue This Month */}
        <Card className="relative overflow-hidden border-indigo-100 dark:border-indigo-950 shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Revenue (This Month)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(kpis?.revenueThisMonth)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200">
                Current Cycle
              </Badge>
              <span>YTD: <strong className="text-foreground">{formatCompactINR(kpis?.revenueThisYear)}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Active Orders & Conversion */}
        <Card className="relative overflow-hidden border-blue-100 dark:border-blue-950 shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Orders & Conversion
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {kpis?.activeOrders ?? 0} <span className="text-xs font-normal text-muted-foreground">Orders</span>
              </div>
              <Badge variant="secondary" className="font-semibold text-xs text-blue-700 dark:text-blue-300">
                {kpis?.conversionRatePct ? `${kpis.conversionRatePct.toFixed(1)}%` : "0%"} Win
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Avg Order Value: <strong className="text-foreground">{formatINR(kpis?.avgOrderValue)}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Pipeline Generation */}
        <Card className="relative overflow-hidden border-emerald-100 dark:border-emerald-950 shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pipeline Created (Month)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {kpis?.quotationsSentThisMonth ?? 0}
                </span>
                <p className="text-[11px] text-muted-foreground font-medium">Quotations</p>
              </div>
              <div className="h-8 w-[1px] bg-border" />
              <div>
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {kpis?.proformaThisMonth ?? 0}
                </span>
                <p className="text-[11px] text-muted-foreground font-medium">Proforma Invoices</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Quotations & invoices created this month
            </p>
          </CardContent>
        </Card>

        {/* Credit Notes & Adjustments */}
        <Card className="relative overflow-hidden border-amber-100 dark:border-amber-950 shadow-xs hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Credit Notes / Returns
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <RotateCcw className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(kpis?.creditNotesRefundAmount)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[11px] text-amber-700 dark:text-amber-300 border-amber-200">
                {kpis?.creditNotesCount ?? 0} Notes
              </Badge>
              <span>Processed Goods Returns</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Historical Trend & Moving Average Forecast Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historical Revenue & Order Volume Trend */}
        <Card className="lg:col-span-2 shadow-xs border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Historical Revenue & Volume Trend
              </CardTitle>
              <CardDescription>
                Month-by-month sales trajectory, gross revenue, and order volume over time.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Lookback:</span>
              <Select
                value={String(lookbackMonths)}
                onValueChange={(val) => setLookbackMonths(Number(val))}
              >
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">Past 6 Mos</SelectItem>
                  <SelectItem value="12">Past 12 Mos</SelectItem>
                  <SelectItem value="24">Past 24 Mos</SelectItem>
                  <SelectItem value="36">Past 36 Mos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {historicalTrend.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 stroke-1 mb-2 opacity-50" />
                <p className="text-sm font-medium">No historical sales data found for the selected lookback.</p>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                    <XAxis
                      dataKey="monthName"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      yAxisId="left"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatCompactINR(val)}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val} ord`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const revenue = payload.find((p) => p.dataKey === "totalRevenue")?.value as number
                          const orders = payload.find((p) => p.dataKey === "totalOrders")?.value as number
                          const avgOrder = payload[0]?.payload?.avgOrderValue
                          return (
                            <div className="rounded-xl border bg-background/95 backdrop-blur-md p-3 shadow-lg text-xs space-y-1">
                              <p className="font-bold text-foreground text-sm border-b pb-1 mb-1">{label}</p>
                              <div className="flex justify-between gap-4">
                                <span className="text-indigo-600 font-semibold">Total Revenue:</span>
                                <span className="font-bold">{formatINR(revenue)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-600 dark:text-slate-400">Total Orders:</span>
                                <span className="font-medium">{orders}</span>
                              </div>
                              {avgOrder ? (
                                <div className="flex justify-between gap-4 pt-1 border-t text-[11px] text-muted-foreground">
                                  <span>Avg Order Value:</span>
                                  <span>{formatINR(avgOrder)}</span>
                                </div>
                              ) : null}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalRevenue"
                      name="Revenue"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalOrders"
                      name="Orders Count"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WMA Sales Forecast & Future Projections */}
        <Card className="shadow-xs border bg-gradient-to-b from-card to-slate-50/50 dark:to-slate-900/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Sales Forecast (WMA)
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200">
                Predictive AI
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Weighted Moving Average projection based on recent {forecastLookback} months actuals.
            </CardDescription>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Input History</label>
                <Select
                  value={String(forecastLookback)}
                  onValueChange={(v) => setForecastLookback(Number(v))}
                >
                  <SelectTrigger className="h-7 text-xs mt-0.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months (Rec.)</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold">Future Horizon</label>
                <Select
                  value={String(forecastMonths)}
                  onValueChange={(v) => setForecastMonths(Number(v))}
                >
                  <SelectTrigger className="h-7 text-xs mt-0.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {forecastData?.forecast?.length ? (
              <div className="space-y-3">
                {forecastData.forecast.map((fc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border bg-background/80 hover:bg-background transition-all shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {fc.forecastMonth}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold ${
                          fc.confidenceLabel === "High"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : fc.confidenceLabel === "Medium"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {fc.confidenceLabel || "High"} Confidence
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">Estimated Revenue:</span>
                      <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatINR(fc.estimatedRevenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-dashed">
                      <span>Expected Range:</span>
                      <span className="font-medium text-foreground">
                        {formatCompactINR(fc.lowerBound)} – {formatCompactINR(fc.upperBound)}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border text-[11px] text-muted-foreground flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <span>
                    Forecast algorithm applies higher weighting to immediate preceding sales cycles with variance confidence bands.
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-muted-foreground text-center">
                <Sparkles className="h-8 w-8 stroke-1 mb-2 opacity-50" />
                <p className="text-xs font-medium">Insufficient sales history for forecast generation.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Sales vs Target & Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Monthly Target */}
        <Card className="shadow-xs border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                Sales Target vs Actual Performance
              </CardTitle>
              <CardDescription>
                Compare achieved revenue against organizational monthly targets and quota gap.
              </CardDescription>
            </div>
            {/* Salesperson Target Filter */}
            <Select
              value={selectedSalesPersonForTarget}
              onValueChange={(val) => {
                if (val !== null) setSelectedSalesPersonForTarget(val)
              }}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Company-Wide" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Company-Wide</SelectItem>
                {topSalesPersons.map((sp) => (
                  <SelectItem key={sp.salesPersonId} value={String(sp.salesPersonId)}>
                    {sp.salesPersonName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {/* Summary Highlights */}
            <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border text-center">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Total Achieved</p>
                <p className="text-sm font-bold text-foreground">{formatCompactINR(targetSummary.totalActual)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Total Target</p>
                <p className="text-sm font-bold text-foreground">{formatCompactINR(targetSummary.totalTarget)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Avg Achievement</p>
                <p className={`text-sm font-bold ${targetSummary.overallPct >= 100 ? "text-emerald-600" : "text-amber-600"}`}>
                  {targetSummary.overallPct.toFixed(1)}%
                </p>
              </div>
            </div>

            {vsTargetData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Target className="h-8 w-8 stroke-1 mb-2 opacity-50" />
                <p className="text-xs">No monthly target metrics available for this period.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vsTargetData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
                    <XAxis dataKey="monthName" fontSize={11} tickLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => formatCompactINR(val)} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const actual = payload.find((p) => p.dataKey === "actualRevenue")?.value as number
                          const target = payload.find((p) => p.dataKey === "targetAmount")?.value as number
                          const pct = payload[0]?.payload?.achievementPct
                          const gap = payload[0]?.payload?.gap
                          return (
                            <div className="rounded-xl border bg-background/95 backdrop-blur-md p-3 shadow-lg text-xs space-y-1">
                              <p className="font-bold border-b pb-1 mb-1">{label}</p>
                              <div className="flex justify-between gap-4">
                                <span className="text-emerald-600 font-semibold">Actual Revenue:</span>
                                <span className="font-bold">{formatINR(actual)}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-indigo-600 font-semibold">Target Quota:</span>
                                <span className="font-bold">{formatINR(target)}</span>
                              </div>
                              <div className="flex justify-between gap-4 pt-1 border-t font-semibold">
                                <span>Achievement Rate:</span>
                                <span className={pct >= 100 ? "text-emerald-600" : "text-amber-600"}>
                                  {pct?.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 text-[11px] text-muted-foreground">
                                <span>Variance Gap:</span>
                                <span>{gap >= 0 ? `Short by ${formatCompactINR(gap)}` : `Surplus of ${formatCompactINR(Math.abs(gap))}`}</span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="actualRevenue" name="Actual Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="targetAmount" name="Target Amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Telemetry & Document Stage Breakdown */}
        <Card className="shadow-xs border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Pipeline Telemetry & Stage Distribution
            </CardTitle>
            <CardDescription>
              Volume and document valuation currently active across conversion pipeline stages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineFunnel.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Layers className="h-8 w-8 stroke-1 mb-2 opacity-50" />
                <p className="text-xs">No active pipeline documents in system.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(funnelByDocType).map(([docType, group]) => (
                  <div key={docType} className="p-3 rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold text-xs bg-background">
                          {docType}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {group.totalCount} documents
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {formatINR(group.totalValue)}
                      </span>
                    </div>

                    {/* Stage Bars */}
                    <div className="space-y-1.5 pt-1">
                      {group.stages.map((stg, i) => {
                        const pctOfDoc = group.totalValue > 0 ? (stg.totalValue / group.totalValue) * 100 : 0
                        return (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between text-[11px] text-muted-foreground">
                              <span className="font-medium text-foreground">{stg.stage} ({stg.documentCount})</span>
                              <span>{formatCompactINR(stg.totalValue)} ({pctOfDoc.toFixed(0)}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                                style={{ width: `${Math.min(pctOfDoc, 100)}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Top Performers (Salespersons, Clients, Products) */}
      <Card className="shadow-xs border">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Leaderboards & Top Performers
            </CardTitle>
            <CardDescription>
              Evaluate highest generating sales champions, VIP doctor/client accounts, and key product lines.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Period:</span>
            <Select
              value={performersDatePreset}
              onValueChange={(val) => {
                if (val !== null) setPerformersDatePreset(val)
              }}
            >
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 Mos</SelectItem>
                <SelectItem value="6m">Last 6 Mos</SelectItem>
                <SelectItem value="12m">Last 12 Mos</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(performersLimit)}
              onValueChange={(v) => {
                if (v !== null) setPerformersLimit(Number(v))
              }}
            >
              <SelectTrigger className="w-[95px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="salespersons" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md mb-4">
              <TabsTrigger value="salespersons" className="text-xs">
                Sales Reps ({topSalesPersons.length})
              </TabsTrigger>
              <TabsTrigger value="clients" className="text-xs">
                Top Clients ({topClients.length})
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs">
                Top Products ({topProducts.length})
              </TabsTrigger>
            </TabsList>

            {/* Top Sales Persons Table */}
            <TabsContent value="salespersons">
              {topSalesPersons.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No sales personnel records returned for selected range.
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                      <TableRow>
                        <TableHead className="w-12 text-center font-bold">#</TableHead>
                        <TableHead>Salesperson</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Orders Closed</TableHead>
                        <TableHead className="text-right">Avg Order Size</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSalesPersons.map((sp, idx) => (
                        <TableRow key={sp.salesPersonId ?? idx} className="hover:bg-slate-50/50">
                          <TableCell className="text-center font-bold text-muted-foreground text-xs">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {sp.salesPersonName}
                          </TableCell>
                          <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                            {formatINR(sp.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {sp.totalOrders}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatINR(sp.avgOrderValue)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold">
                            {sp.totalQuantitySold ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Top Clients Table */}
            <TabsContent value="clients">
              {topClients.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No client activity recorded for selected range.
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                      <TableRow>
                        <TableHead className="w-12 text-center font-bold">#</TableHead>
                        <TableHead>Client / Doctor Organization</TableHead>
                        <TableHead className="text-right">Gross Billed</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Avg Order Value</TableHead>
                        <TableHead className="text-right">Last Purchase Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topClients.map((client, idx) => (
                        <TableRow key={client.clientId ?? idx} className="hover:bg-slate-50/50">
                          <TableCell className="text-center font-bold text-muted-foreground text-xs">
                            {idx === 0 ? "🏆" : idx + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {client.clientName}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatINR(client.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {client.totalOrders}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatINR(client.avgOrderValue)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString("en-IN") : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Top Products Table */}
            <TabsContent value="products">
              {topProducts.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No product sales records returned for selected range.
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                      <TableRow>
                        <TableHead className="w-12 text-center font-bold">#</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">Avg Unit Realization</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((prod, idx) => (
                        <TableRow key={prod.productId ?? idx} className="hover:bg-slate-50/50">
                          <TableCell className="text-center font-bold text-muted-foreground text-xs">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {prod.productName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {prod.categoryName || "General"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-indigo-600 dark:text-indigo-400">
                            {formatINR(prod.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {prod.totalQuantity}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatINR(prod.avgUnitPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 5. Granular Sales Records Data Grid with Excel Export */}
      <Card className="shadow-xs border">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Detailed Sales Records Ledger
            </CardTitle>
            <CardDescription>
              Paginated transactions across all fulfilled line items, clients, reps, and statuses.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search order, client, rep..."
                value={recordsSearch}
                onChange={(e) => setRecordsSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Select
              value={recordsStatus}
              onValueChange={(val) => {
                if (val !== null) {
                  setRecordsStatus(val)
                  setRecordsPage(1)
                }
              }}
            >
              <SelectTrigger className="w-[125px] h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Dispatched">Dispatched</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSalesRecords}
              disabled={filteredSalesRecords.length === 0}
              className="h-8 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
              <span>Loading ledger transactions...</span>
            </div>
          ) : filteredSalesRecords.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No sales records match the specified search or filter criteria.
            </div>
          ) : (
            <>
              <div className="rounded-xl border overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                    <TableRow>
                      <TableHead className="w-32">Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Salesperson</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total Price</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalesRecords.map((item, idx) => (
                      <TableRow key={item.orderId ? `${item.orderId}-${idx}` : idx} className="hover:bg-slate-50/50">
                        <TableCell className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          {item.orderNumber}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.orderDate ? new Date(item.orderDate).toLocaleDateString("en-IN") : "-"}
                        </TableCell>
                        <TableCell className="font-medium text-xs max-w-[160px] truncate" title={item.clientName}>
                          {item.clientName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.salesPersonName || "-"}
                        </TableCell>
                        <TableCell className="font-medium text-xs max-w-[180px] truncate" title={item.productName}>
                          {item.productName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.categoryName || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {formatINR(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs whitespace-nowrap">
                          {formatINR(item.totalPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] uppercase font-bold tracking-wider ${
                              item.orderStatus === "Delivered" || item.orderStatus === "Confirmed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : item.orderStatus === "Processing" || item.orderStatus === "Dispatched"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : item.orderStatus === "Cancelled"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {item.orderStatus || "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 text-xs text-muted-foreground">
                <div>
                  Showing Page <strong className="text-foreground">{recordsPage}</strong> • Total Records:{" "}
                  <strong className="text-foreground">{recordsTotalCount}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRecordsPage((p) => Math.max(p - 1, 1))}
                    disabled={recordsPage <= 1}
                    className="h-8 px-2.5 text-xs"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRecordsPage((p) => p + 1)}
                    disabled={filteredSalesRecords.length < recordsPageSize}
                    className="h-8 px-2.5 text-xs"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
