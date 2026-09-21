import React, { useState, useEffect, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Calendar,
  Filter,
  Download,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Eye,
  FileSpreadsheet,
  ChevronRight,
  Percent,
  BarChart3,
  PieChart as PieIcon,
  Tag,
  Boxes,
  Building2,
  Plus
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts"
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
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { salesOrderApi, productsApi, categoriesApi, clientsApi } from "@/lib/api"
import { Order, mapApiSalesOrder, OrderStatus, PaymentStatus } from "../orders/types"

// Curated harmonious color palette
const PALETTE = [
  "#4f46e5", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#6366f1", // Iris
]

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount)
}

export type TimeRange = "today" | "week" | "month" | "30d" | "year" | "all" | "custom"

interface DashboardOrder extends Order {
  rawDateTime?: string
}

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "30d", label: "30 Days" },
  { id: "year", label: "This Year" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom Dates" },
]

export default function SalesDashboardPage() {
  const navigate = useNavigate()

  const [orders, setOrders] = useState<DashboardOrder[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Filters
  const [timeRange, setTimeRange] = useState<TimeRange>("all")
  const [customStartDate, setCustomStartDate] = useState<string>("")
  const [customEndDate, setCustomEndDate] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("records")

  // Load live data from backend APIs
  const loadData = async (silent = false) => {
    if (silent) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const [ordersRes, productsRes, categoriesRes, clientsRes] = await Promise.all([
        salesOrderApi.getAll().catch(() => []),
        productsApi.getAll().catch(() => ({ data: [] })),
        categoriesApi.getAll().catch(() => []),
        clientsApi.getAll({ pageSize: 500 }).catch(() => ({ clients: [] }))
      ])

      // 1. Process Sales Orders
      const rawOrders = (ordersRes as any)?.data || (Array.isArray(ordersRes) ? ordersRes : [])
      const mappedOrders: DashboardOrder[] = rawOrders.map((raw: any) => {
        const o = mapApiSalesOrder(raw)
        return {
          ...o,
          rawDateTime: raw.orderDate || raw.date || raw.createdAt
        }
      })
      setOrders(mappedOrders)

      // 2. Process Products
      const rawProducts = (productsRes as any)?.data || (Array.isArray(productsRes) ? productsRes : [])
      setProducts(rawProducts)

      // 3. Process Categories
      const rawCategories = Array.isArray(categoriesRes) ? categoriesRes : ((categoriesRes as any)?.data || [])
      setCategories(rawCategories)

      // 4. Process Clients
      const rawClients = (clientsRes as any)?.clients || (Array.isArray(clientsRes) ? clientsRes : [])
      setClients(rawClients)

    } catch (err: any) {
      console.error("Failed to load sales dashboard data:", err)
      toast.error("Failed to load sales data. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Lookup maps for fast access
  const categoryMap = useMemo(() => {
    const map = new Map<number | string, string>()
    for (const c of categories) {
      const id = String(c.categoryId ?? c.id)
      const name = c.categoryName ?? c.name ?? `Category #${id}`
      map.set(id, name)
      map.set(Number(id), name)
    }
    return map
  }, [categories])

  const productMap = useMemo(() => {
    const map = new Map<number | string, any>()
    for (const p of products) {
      const id = String(p.productId ?? p.id)
      map.set(id, p)
      map.set(Number(id), p)
    }
    return map
  }, [products])

  const clientMap = useMemo(() => {
    const map = new Map<number | string, any>()
    for (const c of clients) {
      const id = String(c.id ?? c.clientId)
      map.set(id, c)
      map.set(Number(id), c)
    }
    return map
  }, [clients])

  // Time-filtered orders
  const filteredOrders = useMemo(() => {
    const now = new Date()
    const getLocalYMD = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${y}-${m}-${day}`
    }

    const todayStr = getLocalYMD(now)

    // Current week: Monday to Sunday
    const currentDay = now.getDay() // 0 = Sun, 1 = Mon ...
    const distToMon = currentDay === 0 ? 6 : currentDay - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - distToMon)
    const mondayStr = getLocalYMD(monday)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const sundayStr = getLocalYMD(sunday)

    // Current Month prefix: YYYY-MM
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    // Past 30 days
    const past30 = new Date(now)
    past30.setDate(now.getDate() - 30)
    const past30Str = getLocalYMD(past30)

    // Current Year prefix: YYYY
    const currentYearPrefix = String(now.getFullYear())

    return orders.filter((o) => {
      const oDateStr = o.date ? o.date.split("T")[0] : ""

      // Time range filter
      if (timeRange === "today") {
        if (oDateStr !== todayStr) return false
      } else if (timeRange === "week") {
        if (oDateStr < mondayStr || oDateStr > sundayStr) return false
      } else if (timeRange === "month") {
        if (!oDateStr.startsWith(currentMonthPrefix)) return false
      } else if (timeRange === "30d") {
        if (oDateStr < past30Str || oDateStr > todayStr) return false
      } else if (timeRange === "year") {
        if (!oDateStr.startsWith(currentYearPrefix)) return false
      } else if (timeRange === "custom") {
        if (customStartDate && oDateStr < customStartDate) return false
        if (customEndDate && oDateStr > customEndDate) return false
      }

      // Category filter
      if (selectedCategory !== "all") {
        const hasMatchingItem = o.items.some((item) => {
          const prod = productMap.get(item.productId) || productMap.get(Number(item.productId))
          return String(prod?.categoryId) === String(selectedCategory)
        })
        if (!hasMatchingItem) return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchNum = o.orderNumber.toLowerCase().includes(q)
        const matchClient = o.clientName.toLowerCase().includes(q)
        const matchItem = o.items.some(
          (i) => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
        )
        if (!matchNum && !matchClient && !matchItem) return false
      }

      return true
    })
  }, [orders, timeRange, customStartDate, customEndDate, selectedCategory, searchQuery, productMap])

  // High-Level KPIs
  const kpis = useMemo(() => {
    let totalRevenue = 0
    let totalTax = 0
    let totalUnits = 0
    let paidRevenue = 0
    let pendingRevenue = 0
    let approvedCount = 0
    let pendingCount = 0
    let deliveredCount = 0

    for (const o of filteredOrders) {
      const orderTotal = Number(o.totalAmount || 0)
      totalRevenue += orderTotal
      totalTax += Number(o.taxAmount || 0)

      if (o.paymentStatus === "Paid") {
        paidRevenue += orderTotal
      } else {
        pendingRevenue += orderTotal
      }

      const status = (o.status || "").toLowerCase()
      if (status === "approved") approvedCount++
      else if (status === "pending") pendingCount++
      else if (status === "delivered") deliveredCount++

      for (const item of o.items) {
        totalUnits += Number(item.quantity || 0)
      }
    }

    const orderCount = filteredOrders.length
    const aov = orderCount > 0 ? totalRevenue / orderCount : 0
    const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0

    return {
      totalRevenue,
      totalTax,
      totalUnits,
      paidRevenue,
      pendingRevenue,
      orderCount,
      aov,
      collectionRate,
      approvedCount,
      pendingCount,
      deliveredCount
    }
  }, [filteredOrders])

  // Category Aggregations
  const categoryAnalytics = useMemo(() => {
    const catRevenue: Record<string, { name: string; revenue: number; units: number; products: Set<string> }> = {}

    for (const o of filteredOrders) {
      for (const item of o.items) {
        const prod = productMap.get(item.productId) || productMap.get(Number(item.productId))
        const catId = prod?.categoryId ? String(prod.categoryId) : "uncategorized"
        const catName = categoryMap.get(catId) || (catId === "uncategorized" ? "General / Medical" : `Category #${catId}`)
        const itemRevenue = Number(item.total || item.unitPrice * item.quantity || 0)
        const itemUnits = Number(item.quantity || 0)

        if (!catRevenue[catId]) {
          catRevenue[catId] = { name: catName, revenue: 0, units: 0, products: new Set() }
        }
        catRevenue[catId].revenue += itemRevenue
        catRevenue[catId].units += itemUnits
        catRevenue[catId].products.add(item.productId)
      }
    }

    const list = Object.entries(catRevenue).map(([id, data]) => {
      const share = kpis.totalRevenue > 0 ? (data.revenue / kpis.totalRevenue) * 100 : 0
      return {
        id,
        name: data.name,
        revenue: data.revenue,
        units: data.units,
        productCount: data.products.size,
        share: Number(share.toFixed(1))
      }
    })

    return list.sort((a, b) => b.revenue - a.revenue)
  }, [filteredOrders, productMap, categoryMap, kpis.totalRevenue])

  // Product Aggregations
  const productAnalytics = useMemo(() => {
    const prodStats: Record<string, { id: string; name: string; sku: string; category: string; units: number; revenue: number; ordersCount: number }> = {}

    for (const o of filteredOrders) {
      for (const item of o.items) {
        const prodId = item.productId
        const prod = productMap.get(prodId) || productMap.get(Number(prodId))
        const catId = prod?.categoryId ? String(prod.categoryId) : "uncategorized"
        const catName = categoryMap.get(catId) || "General"
        const revenue = Number(item.total || item.unitPrice * item.quantity || 0)
        const units = Number(item.quantity || 0)

        if (!prodStats[prodId]) {
          prodStats[prodId] = {
            id: prodId,
            name: item.productName || prod?.productName || item.sku || `Product #${prodId}`,
            sku: item.sku || prod?.baseSKU || `SKU-${prodId}`,
            category: catName,
            units: 0,
            revenue: 0,
            ordersCount: 0
          }
        }
        prodStats[prodId].units += units
        prodStats[prodId].revenue += revenue
        prodStats[prodId].ordersCount += 1
      }
    }

    const list = Object.values(prodStats).map((p) => ({
      ...p,
      avgPrice: p.units > 0 ? p.revenue / p.units : 0
    }))

    return list.sort((a, b) => b.revenue - a.revenue)
  }, [filteredOrders, productMap, categoryMap])

  // Client Aggregations
  const clientAnalytics = useMemo(() => {
    const clientStats: Record<string, { id: string; name: string; type: string; ordersCount: number; totalSpend: number; lastDate: string }> = {}

    for (const o of filteredOrders) {
      const cId = String(o.clientId || "unknown")
      const clientObj = clientMap.get(cId) || clientMap.get(Number(cId))
      const name = o.clientName || clientObj?.name || `Client #${cId}`
      const type = clientObj?.clientType || "Clinic"
      const amount = Number(o.totalAmount || 0)

      if (!clientStats[cId]) {
        clientStats[cId] = {
          id: cId,
          name,
          type,
          ordersCount: 0,
          totalSpend: 0,
          lastDate: o.date
        }
      }
      clientStats[cId].ordersCount += 1
      clientStats[cId].totalSpend += amount
      if (new Date(o.date) > new Date(clientStats[cId].lastDate)) {
        clientStats[cId].lastDate = o.date
      }
    }

    return Object.values(clientStats).sort((a, b) => b.totalSpend - a.totalSpend)
  }, [filteredOrders, clientMap])

  // Revenue & Order Trend Over Time (Chronological & Adaptive)
  const timelineTrend = useMemo(() => {
    // 1. If today: group by hour (or order number if no hour)
    if (timeRange === "today") {
      const hourlyMap: Record<string, { dateLabel: string; revenue: number; orders: number; units: number }> = {}

      for (const o of filteredOrders) {
        const rawTime = o.rawDateTime || o.date
        const d = new Date(rawTime)
        const hasTime = rawTime.includes("T") && !isNaN(d.getTime())
        const key = hasTime ? `${String(d.getHours()).padStart(2, "0")}:00` : o.orderNumber
        const label = hasTime
          ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          : o.orderNumber

        if (!hourlyMap[key]) {
          hourlyMap[key] = { dateLabel: label, revenue: 0, orders: 0, units: 0 }
        }
        hourlyMap[key].revenue += Number(o.totalAmount || 0)
        hourlyMap[key].orders += 1
        for (const it of o.items) {
          hourlyMap[key].units += Number(it.quantity || 0)
        }
      }

      const sortedKeys = Object.keys(hourlyMap).sort()
      return sortedKeys.map((k) => hourlyMap[k])
    }

    // 2. If week, 30d, month, or custom with span <= 60 days: group by Day
    const isDayGrouping =
      timeRange === "week" ||
      timeRange === "month" ||
      timeRange === "30d" ||
      (timeRange === "custom" &&
        (!customStartDate ||
          !customEndDate ||
          Math.abs(new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) <= 60 * 86400000))

    if (isDayGrouping) {
      const dailyMap: Record<string, { dateLabel: string; revenue: number; orders: number; units: number }> = {}

      for (const o of filteredOrders) {
        const d = new Date(o.date)
        if (isNaN(d.getTime())) continue

        const dayKey = o.date.slice(0, 10)
        const dayLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })

        if (!dailyMap[dayKey]) {
          dailyMap[dayKey] = { dateLabel: dayLabel, revenue: 0, orders: 0, units: 0 }
        }
        dailyMap[dayKey].revenue += Number(o.totalAmount || 0)
        dailyMap[dayKey].orders += 1
        for (const it of o.items) {
          dailyMap[dayKey].units += Number(it.quantity || 0)
        }
      }

      const sortedKeys = Object.keys(dailyMap).sort()
      return sortedKeys.map((k) => dailyMap[k])
    }

    // 3. Default: Group by Month for year / all / long custom range
    const monthlyMap: Record<string, { dateLabel: string; revenue: number; orders: number; units: number }> = {}

    for (const o of filteredOrders) {
      const d = new Date(o.date)
      if (isNaN(d.getTime())) continue

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const monthLabel = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { dateLabel: monthLabel, revenue: 0, orders: 0, units: 0 }
      }
      monthlyMap[monthKey].revenue += Number(o.totalAmount || 0)
      monthlyMap[monthKey].orders += 1
      for (const it of o.items) {
        monthlyMap[monthKey].units += Number(it.quantity || 0)
      }
    }

    const sortedKeys = Object.keys(monthlyMap).sort()
    return sortedKeys.map((k) => monthlyMap[k])
  }, [filteredOrders, timeRange, customStartDate, customEndDate])

  // Order Status breakdown
  const orderStatusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of filteredOrders) {
      const st = o.status || "Pending"
      counts[st] = (counts[st] || 0) + 1
    }
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      percent: filteredOrders.length > 0 ? ((count / filteredOrders.length) * 100).toFixed(0) : "0"
    }))
  }, [filteredOrders])

  // Export Data to Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new()

      // Sheet 1: Sales Orders
      const orderRows = filteredOrders.map((o) => ({
        "Order Number": o.orderNumber,
        "Order Date": o.date,
        "Client Name": o.clientName,
        "Items Count": o.items.length,
        "Subtotal (INR)": o.subtotal,
        "Tax Amount (INR)": o.taxAmount,
        "Total Amount (INR)": o.totalAmount,
        "Order Status": o.status,
        "Payment Status": o.paymentStatus
      }))
      const wsOrders = XLSX.utils.json_to_sheet(orderRows)
      XLSX.utils.book_append_sheet(wb, wsOrders, "Sales Orders")

      // Sheet 2: Products
      const productRows = productAnalytics.map((p) => ({
        "Product Name": p.name,
        "SKU": p.sku,
        "Category": p.category,
        "Units Sold": p.units,
        "Total Revenue (INR)": p.revenue,
        "Average Price (INR)": Math.round(p.avgPrice),
        "Orders Count": p.ordersCount
      }))
      const wsProducts = XLSX.utils.json_to_sheet(productRows)
      XLSX.utils.book_append_sheet(wb, wsProducts, "Product Sales")

      // Sheet 3: Categories
      const categoryRows = categoryAnalytics.map((c) => ({
        "Category Name": c.name,
        "Unique Products": c.productCount,
        "Units Sold": c.units,
        "Revenue (INR)": c.revenue,
        "Sales Share (%)": `${c.share}%`
      }))
      const wsCategories = XLSX.utils.json_to_sheet(categoryRows)
      XLSX.utils.book_append_sheet(wb, wsCategories, "Category Sales")

      const dateStr = new Date().toISOString().split("T")[0]
      const rangeSuffix = timeRange === "custom" && (customStartDate || customEndDate)
        ? `${customStartDate || "start"}_to_${customEndDate || "end"}`
        : timeRange
      XLSX.writeFile(wb, `Tejco_Sales_Report_${rangeSuffix}_${dateStr}.xlsx`)
      toast.success("Sales report exported successfully!")
    } catch (err) {
      console.error("Export failed:", err)
      toast.error("Failed to export sales report.")
    }
  }

  const getStatusBadge = (status: OrderStatus | string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200">Approved</Badge>
      case "Pending":
        return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200">Pending</Badge>
      case "Delivered":
        return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200">Delivered</Badge>
      case "Dispatched":
        return <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200">Dispatched</Badge>
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: PaymentStatus | string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300">Paid</Badge>
      case "Unpaid":
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300">Unpaid</Badge>
      case "Partial":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300">Partial</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getActivePeriodDescription = () => {
    const now = new Date()
    if (timeRange === "today") {
      return `Today (${now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})`
    }
    if (timeRange === "week") {
      const currentDay = now.getDay()
      const distToMon = currentDay === 0 ? 6 : currentDay - 1
      const mon = new Date(now)
      mon.setDate(now.getDate() - distToMon)
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      return `This Week (${mon.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${sun.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`
    }
    if (timeRange === "month") {
      return `This Month (${now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })})`
    }
    if (timeRange === "30d") {
      const past30 = new Date(now)
      past30.setDate(now.getDate() - 30)
      return `Past 30 Days (${past30.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short" })})`
    }
    if (timeRange === "year") {
      return `Calendar Year ${now.getFullYear()}`
    }
    if (timeRange === "custom") {
      if (customStartDate && customEndDate) {
        return `${customStartDate} to ${customEndDate}`
      } else if (customStartDate) {
        return `From ${customStartDate} onwards`
      } else if (customEndDate) {
        return `Up to ${customEndDate}`
      }
      return "Custom Date Range"
    }
    return `All Time (${orders.length} orders)`
  }

  return (
    <div className="flex-1 space-y-5 w-full mx-auto pb-10">
      {/* Top Header Row: Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/20 shrink-0">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Sales Dashboard
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Real-time analytics across orders, revenue trajectories, product sales, and clients.
            </p>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            className="h-9 px-3 gap-2 text-xs font-medium border-border/80 hover:bg-muted/70 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : "text-muted-foreground"}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-9 px-3 gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 border-emerald-300/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 shadow-2xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export XLS</span>
          </Button>

          <Link to="/sales/orders">
            <Button size="sm" className="h-9 px-3.5 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Level 2: Control & Period Toolbar Card */}
      <div className="bg-card border border-border/70 rounded-xl p-2.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Segmented Time Range Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Timeframe:</span>
          </div>

          <div className="inline-flex flex-wrap items-center rounded-lg bg-muted/60 p-1 border border-border/50 gap-0.5">
            {TIME_RANGES.map(({ id, label }) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={timeRange === id ? "default" : "ghost"}
                className={`h-7.5 px-3 text-xs font-medium rounded-md transition-all duration-150 ${
                  timeRange === id
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/70"
                }`}
                onClick={() => setTimeRange(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Right: Custom Date Range Pickers OR Active Period Description */}
        {timeRange === "custom" ? (
          <div className="flex flex-wrap items-center gap-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/70 rounded-lg px-3 py-1.5 animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="flex items-center gap-1.5 text-xs text-indigo-950 dark:text-indigo-200 font-medium">
              <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-7 px-2 text-xs rounded border border-indigo-200 dark:border-indigo-800 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-foreground"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-950 dark:text-indigo-200 font-medium">
              <span>To:</span>
              <input
                type="date"
                value={customEndDate}
                min={customStartDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-7 px-2 text-xs rounded border border-indigo-200 dark:border-indigo-800 bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-foreground"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate("")
                  setCustomEndDate("")
                }}
                className="text-[11px] text-muted-foreground hover:text-red-500 px-1.5 py-0.5 rounded font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Clear custom dates"
              >
                Clear
              </button>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground px-2">
            <Clock className="h-3.5 w-3.5 text-indigo-500/70" />
            <span className="font-medium text-foreground/80">{getActivePeriodDescription()}</span>
          </div>
        )}
      </div>

      {/* Active Filter Summary Bar */}
      {(timeRange !== "all" || selectedCategory !== "all" || searchQuery.trim() || customStartDate || customEndDate) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs py-2 px-3.5 bg-muted/40 border border-border/60 rounded-xl shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5 shrink-0">
              <Filter className="h-3.5 w-3.5 text-indigo-500" />
              Active Filters:
            </span>

            {timeRange !== "all" && (
              <Badge variant="secondary" className="gap-1 font-normal bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200">
                Period:{" "}
                <strong className="font-semibold">
                  {timeRange === "today" && "Today"}
                  {timeRange === "week" && "This Week"}
                  {timeRange === "month" && "This Month"}
                  {timeRange === "30d" && "Last 30 Days"}
                  {timeRange === "year" && "This Year"}
                  {timeRange === "custom" && (customStartDate || customEndDate
                    ? `${customStartDate || "Start"} → ${customEndDate || "Now"}`
                    : "Custom Dates")}
                </strong>
                <button
                  type="button"
                  onClick={() => {
                    setTimeRange("all")
                    setCustomStartDate("")
                    setCustomEndDate("")
                  }}
                  className="ml-1 hover:text-red-500 cursor-pointer"
                >
                  ×
                </button>
              </Badge>
            )}

            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="gap-1 font-normal bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200">
                Category: <strong className="font-semibold">{categoryMap.get(selectedCategory) || selectedCategory}</strong>
                <button type="button" onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-red-500 cursor-pointer">×</button>
              </Badge>
            )}

            {searchQuery.trim() && (
              <Badge variant="secondary" className="gap-1 font-normal bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200">
                Search: <strong className="font-semibold">&ldquo;{searchQuery}&rdquo;</strong>
                <button type="button" onClick={() => setSearchQuery("")} className="ml-1 hover:text-red-500 cursor-pointer">×</button>
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTimeRange("all")
              setSelectedCategory("all")
              setSearchQuery("")
              setCustomStartDate("")
              setCustomEndDate("")
            }}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive shrink-0 cursor-pointer self-end sm:self-auto"
          >
            Reset All Filters
          </Button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. Total Sales Revenue */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:shadow-md transition-all duration-200 bg-linear-to-br from-indigo-50/40 via-background to-background dark:from-indigo-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Sales Revenue</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {isLoading ? <Skeleton className="h-8 w-28" /> : formatCurrency(kpis.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold flex items-center">
                  <ArrowUpRight className="h-3 w-3" /> Realized
                </span>
                across {kpis.orderCount} total orders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Total Orders */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:shadow-md transition-all duration-200 bg-linear-to-br from-blue-50/40 via-background to-background dark:from-blue-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orders Volume</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {isLoading ? <Skeleton className="h-8 w-16" /> : kpis.orderCount}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="text-blue-600 font-medium">{kpis.approvedCount} approved</span>
                <span>•</span>
                <span className="text-amber-600 font-medium">{kpis.pendingCount} pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Product Units Sold */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:shadow-md transition-all duration-200 bg-linear-to-br from-emerald-50/40 via-background to-background dark:from-emerald-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Units Sold</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {isLoading ? <Skeleton className="h-8 w-16" /> : `${kpis.totalUnits.toLocaleString()} pcs`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                across {productAnalytics.length} unique products
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Average Order Value */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:shadow-md transition-all duration-200 bg-linear-to-br from-amber-50/40 via-background to-background dark:from-amber-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Order Value (AOV)</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Percent className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis.aov)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ticket size per transaction
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 5. Payments Realization */}
        <Card className="relative overflow-hidden border-border/70 shadow-xs hover:shadow-md transition-all duration-200 bg-linear-to-br from-purple-50/40 via-background to-background dark:from-purple-950/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collected Revenue</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {isLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(kpis.paidRevenue)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="text-emerald-600 font-semibold">{kpis.collectionRate.toFixed(0)}% paid</span>
                <span className="text-muted-foreground">({formatCurrency(kpis.pendingRevenue)} pending)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Row: Timeline Area Chart & Category Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Revenue & Orders Timeline Area Chart (2 Cols) */}
        <Card className="lg:col-span-2 shadow-xs border-border/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Revenue & Orders Trend
              </CardTitle>
              <CardDescription className="text-xs">
                Historical trajectory of gross sales value and transaction volume
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
              {timeRange === "today"
                ? "Hourly View"
                : timeRange === "week" || timeRange === "month" || timeRange === "30d"
                ? "Daily Trend"
                : "Timeline View"}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : timelineTrend.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  No trend data available for the selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="salesOrderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(val) => `${val} ord`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur-xs text-xs space-y-1">
                              <p className="font-semibold text-foreground border-b pb-1">{label}</p>
                              <div className="flex items-center gap-2 text-indigo-600 font-medium">
                                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                <span>Revenue: {formatCurrency(Number(payload[0]?.value || 0))}</span>
                              </div>
                              {payload[1] && (
                                <div className="flex items-center gap-2 text-cyan-600 font-medium">
                                  <span className="h-2 w-2 rounded-full bg-cyan-600" />
                                  <span>Orders: {payload[1].value}</span>
                                </div>
                              )}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesRevGrad)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#salesOrderGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Revenue by Category Donut Chart (1 Col) */}
        <Card className="shadow-xs border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              Sales by Category
            </CardTitle>
            <CardDescription className="text-xs">
              Revenue proportion across medical product lines
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[200px] w-full relative">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-44 w-44 rounded-full" />
                </div>
              ) : categoryAnalytics.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
                  <PieIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  No category records found
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryAnalytics}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="revenue"
                    >
                      {categoryAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="rounded-xl border border-border/60 bg-background/95 p-2.5 shadow-lg backdrop-blur-xs text-xs space-y-1">
                              <p className="font-semibold text-foreground">{data.name}</p>
                              <p className="text-indigo-600 font-medium">Revenue: {formatCurrency(data.revenue)}</p>
                              <p className="text-muted-foreground">{data.units} units ({data.share}%)</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category Legend List */}
            <div className="space-y-1.5 mt-3 max-h-[110px] overflow-y-auto pr-1">
              {categoryAnalytics.slice(0, 4).map((cat, idx) => (
                <div key={cat.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[170px]">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                    <span className="truncate text-muted-foreground font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{formatCurrency(cat.revenue)}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">({cat.share}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Row 2: Top Products Bar Chart & Fulfillment Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Products Bar Chart (2 Cols) */}
        <Card className="lg:col-span-2 shadow-xs border-border/70">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Boxes className="h-4 w-4 text-indigo-600" />
                Top-Selling Products by Revenue
              </CardTitle>
              <CardDescription className="text-xs">
                Highest contributing SKUs in procurement and clinic orders
              </CardDescription>
            </div>
            <Link to="/inventory/products">
              <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 gap-1">
                View All Products <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="h-[220px] w-full">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : productAnalytics.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No product sales data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productAnalytics.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={140}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tick={{ fill: "hsl(var(--foreground))" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="rounded-xl border border-border/60 bg-background/95 p-2.5 shadow-lg backdrop-blur-xs text-xs space-y-1">
                              <p className="font-semibold text-foreground">{data.name}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">SKU: {data.sku}</p>
                              <p className="text-indigo-600 font-semibold">Revenue: {formatCurrency(data.revenue)}</p>
                              <p className="text-muted-foreground">{data.units} units sold</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 6, 6, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fulfillment Pipeline & Order Status (1 Col) */}
        <Card className="shadow-xs border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              Order Pipeline Status
            </CardTitle>
            <CardDescription className="text-xs">
              Live progression of orders through fulfillment
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3 space-y-4">
            {orderStatusBreakdown.map((item, idx) => (
              <div key={item.status} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item.status)}
                    <span className="font-semibold text-foreground">{item.count} orders</span>
                  </div>
                  <span className="text-muted-foreground font-mono text-[11px]">{item.percent}%</span>
                </div>
                <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: PALETTE[idx % PALETTE.length]
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Pipeline Orders</span>
              <span className="font-bold text-foreground">{kpis.orderCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed Data Matrix */}
      <Card className="shadow-xs border-border/70 overflow-hidden">
        <div className="p-4 md:p-5 border-b space-y-4 bg-slate-50/40 dark:bg-slate-900/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Tabs Selector */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
              <TabsList className="flex flex-wrap h-auto sm:h-9 sm:inline-flex bg-muted/60 p-0.5 rounded-lg border gap-0.5 w-full sm:w-auto">
                <TabsTrigger value="records" className="text-xs px-3 py-1.5 sm:py-1 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs whitespace-nowrap">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Sales Records</span>
                  <span className="ml-1 text-[11px] opacity-70">({filteredOrders.length})</span>
                </TabsTrigger>
                <TabsTrigger value="products" className="text-xs px-3 py-1.5 sm:py-1 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs whitespace-nowrap">
                  <Package className="h-3.5 w-3.5" />
                  <span>Products</span>
                  <span className="ml-1 text-[11px] opacity-70">({productAnalytics.length})</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="text-xs px-3 py-1.5 sm:py-1 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs whitespace-nowrap">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Categories</span>
                  <span className="ml-1 text-[11px] opacity-70">({categoryAnalytics.length})</span>
                </TabsTrigger>
                <TabsTrigger value="clients" className="text-xs px-3 py-1.5 sm:py-1 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs whitespace-nowrap">
                  <Users className="h-3.5 w-3.5" />
                  <span>Clients / Doctors</span>
                  <span className="ml-1 text-[11px] opacity-70">({clientAnalytics.length})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search & Category Filter Controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-[240px] sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search order #, product, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8.5 text-xs bg-background w-full"
                />
              </div>

              <div className="w-full sm:w-[180px]">
                <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || "all")}>
                  <SelectTrigger className="h-8.5 text-xs bg-background w-full">
                    <div className="flex items-center gap-1.5 truncate">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="All Categories" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all" className="text-xs font-medium">All Categories</SelectItem>
                    {categories.map((c: any) => {
                      const id = String(c.categoryId ?? c.id)
                      const name = c.categoryName ?? c.name ?? `Category #${id}`
                      return (
                        <SelectItem key={id} value={id} className="text-xs">
                          {name}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {(searchQuery || selectedCategory !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                  }}
                  className="h-8.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab 1: Sales Orders Records */}
        {activeTab === "records" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40">
                <TableRow>
                  <TableHead className="w-[160px] font-semibold text-xs">Order Number</TableHead>
                  <TableHead className="font-semibold text-xs">Date</TableHead>
                  <TableHead className="font-semibold text-xs">Client / Doctor</TableHead>
                  <TableHead className="font-semibold text-xs">Items & SKUs</TableHead>
                  <TableHead className="font-semibold text-xs">Total Amount</TableHead>
                  <TableHead className="font-semibold text-xs">Order Status</TableHead>
                  <TableHead className="font-semibold text-xs">Payment</TableHead>
                  <TableHead className="text-right font-semibold text-xs w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-xs text-muted-foreground">
                      No sales orders found matching your search or filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">
                        <Link
                          to={`/sales/orders/${order.id}`}
                          className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-xs text-foreground truncate max-w-[180px]">
                          {order.clientName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="font-semibold">{order.items.length} {order.items.length === 1 ? "item" : "items"}</span>
                          {order.items.length > 0 && (
                            <span className="block text-[11px] text-muted-foreground font-mono truncate max-w-[140px]">
                              {order.items[0].sku}
                              {order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-xs text-foreground">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        {order.taxAmount > 0 && (
                          <span className="text-[10px] text-muted-foreground">Incl. GST</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/sales/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 2: Product Performance Breakdown */}
        {activeTab === "products" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40">
                <TableRow>
                  <TableHead className="font-semibold text-xs">Product Name</TableHead>
                  <TableHead className="font-semibold text-xs">SKU</TableHead>
                  <TableHead className="font-semibold text-xs">Category</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Units Sold</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Average Price</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Total Revenue</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Orders Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productAnalytics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-xs text-muted-foreground">
                      No products sales records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  productAnalytics.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium text-xs text-foreground">
                        {p.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.sku}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        {p.units.toLocaleString()} pcs
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">
                        {formatCurrency(p.avgPrice)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(p.revenue)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">
                        {p.ordersCount}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 3: Category Performance Breakdown */}
        {activeTab === "categories" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40">
                <TableRow>
                  <TableHead className="font-semibold text-xs">Category Name</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Active SKUs Sold</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Units Sold</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Revenue Generated</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Share of Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryAnalytics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-xs text-muted-foreground">
                      No category records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categoryAnalytics.map((c, i) => (
                    <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium text-xs flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                        <span className="font-semibold text-foreground">{c.name}</span>
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">
                        {c.productCount} SKUs
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        {c.units.toLocaleString()} pcs
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-foreground">
                        {formatCurrency(c.revenue)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{c.share}%</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Tab 4: Client / Doctor Ranking */}
        {activeTab === "clients" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40">
                <TableRow>
                  <TableHead className="font-semibold text-xs">Client / Doctor</TableHead>
                  <TableHead className="font-semibold text-xs">Type</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Orders Placed</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Total Procurement Value</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Last Order Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientAnalytics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-xs text-muted-foreground">
                      No client sales records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  clientAnalytics.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium text-xs text-foreground">
                        {client.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {client.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">
                        {client.ordersCount} orders
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(client.totalSpend)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">
                        {client.lastDate ? new Date(client.lastDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Footer Summary */}
        <div className="p-4 border-t bg-slate-50/40 dark:bg-slate-900/20 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <div>
            Displaying <span className="font-semibold text-foreground">{filteredOrders.length}</span> orders •{" "}
            <span className="font-semibold text-foreground">{productAnalytics.length}</span> products •{" "}
            <span className="font-semibold text-foreground">{categoryAnalytics.length}</span> categories
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span>Filtered Revenue:</span>
            <span className="font-bold text-foreground text-sm">{formatCurrency(kpis.totalRevenue)}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
