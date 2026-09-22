import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { dashboardApi } from "@/lib/api"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Users,
  Box,
  RefreshCw,
  Zap,
  Activity,
  ChevronRight,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
  BarChart3,
  TrendingDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"

import { useAuth } from "@/hooks/use-auth"

const CHART_COLORS = [
  "#2563eb", // Vibrant Royal Blue
  "#10b981", // Emerald Green
  "#f59e0b", // Warm Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4"  // Cyan
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { hasPermission, permissions, user } = useAuth()
  const hasDashboardAccess = hasPermission("Dashboard.View")

  const [kpis, setKpis] = useState({
    totalStockValue: 0,
    todaysOrders: 0,
    yesterdaysOrders: 0,
    pendingDispatch: 0,
    lowStockItems: 0
  })
  const [salesTrendData, setSalesTrendData] = useState([])
  const [categorySalesData, setCategorySalesData] = useState([])
  const [warehouseStockData, setWarehouseStockData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [orderStatus, setOrderStatus] = useState([])
  const [topClients, setTopClients] = useState([])
  const [criticalStock, setCriticalStock] = useState([])
  const [loading, setLoading] = useState(true)

  // Redirect users who don't have dashboard permission to their first accessible module
  useEffect(() => {
    if (hasDashboardAccess) return

    if (hasPermission(["SalesOrders.View", "Quotations.View", "ProformaInvoices.View"])) {
      navigate("/sales/dashboard", { replace: true })
      return
    }
    if (hasPermission(["Products.View", "Products.MaskedView", "Products.FullView"])) {
      navigate("/inventory/products", { replace: true })
      return
    }
    if (hasPermission("Clients.View")) {
      navigate("/stakeholders/clients", { replace: true })
      return
    }
    if (hasPermission(["PurchaseOrders.View", "Purchases.View"])) {
      navigate("/purchase", { replace: true })
      return
    }
    if (hasPermission("Vendors.View")) {
      navigate("/supply-chain/vendors", { replace: true })
      return
    }
    if (hasPermission("Warehouses.View")) {
      navigate("/supply-chain/warehouse", { replace: true })
      return
    }
    if (hasPermission("Reports.View")) {
      navigate("/intelligence/reports", { replace: true })
      return
    }
    if (hasPermission(["Users.View", "Roles.View", "Masters.View", "System.Users.View"])) {
      navigate("/system/users", { replace: true })
      return
    }
  }, [hasDashboardAccess, hasPermission, navigate])

  const fetchDashboardData = async () => {
    if (!hasDashboardAccess) return
    setLoading(true)
    try {
      const [
        kpisData, salesTrendDataRes, categorySalesDataRes, warehouseDataRes,
        activityDataRes, productsDataRes, orderStatusDataRes, clientsDataRes, stockDataRes
      ] = await Promise.all([
        dashboardApi.getKPIs(),
        dashboardApi.getSalesTrend(),
        dashboardApi.getCategorySales(),
        dashboardApi.getWarehouseDistribution(),
        dashboardApi.getRecentActivity(),
        dashboardApi.getTopProducts(),
        dashboardApi.getOrderStatus(),
        dashboardApi.getTopClients(),
        dashboardApi.getCriticalStock()
      ])

      if (kpisData.success) setKpis(kpisData.data)
      if (salesTrendDataRes.success) setSalesTrendData(salesTrendDataRes.data)
      if (categorySalesDataRes.success) setCategorySalesData(categorySalesDataRes.data)
      if (warehouseDataRes.success) setWarehouseStockData(warehouseDataRes.data)
      if (activityDataRes.success) setRecentActivity(activityDataRes.data)
      if (productsDataRes.success) setTopProducts(productsDataRes.data)
      if (orderStatusDataRes.success) setOrderStatus(orderStatusDataRes.data)
      if (clientsDataRes.success) setTopClients(clientsDataRes.data)
      if (stockDataRes.success) setCriticalStock(stockDataRes.data)

    } catch (error) {
      console.error("Failed to fetch dashboard data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasDashboardAccess) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [hasDashboardAccess])

  if (!hasDashboardAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-md w-full text-center border-border shadow-md">
          <CardHeader className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-bold">Access Restricted</CardTitle>
            <CardDescription className="text-xs">
              You do not have permission to view the main executive dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader layout="container" size="lg" text="Loading enterprise dashboard..." />
      </div>
    )
  }

  const orderTrendPercent = kpis.yesterdaysOrders > 0
    ? ((kpis.todaysOrders - kpis.yesterdaysOrders) / kpis.yesterdaysOrders * 100).toFixed(1)
    : "0.0"

  const isOrderPositive = kpis.todaysOrders >= kpis.yesterdaysOrders

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Modern Ultra-Sleek Glassmorphic Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 p-8 text-white shadow-2xl border border-white/10">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-xl border border-white/15 text-blue-200">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Tejco ERP • Enterprise Analytics</span>
            </div> */}
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-mono">
              Executive Dashboard
            </h1>
            <p className="text-sm md:text-base text-slate-300/90 leading-relaxed">
              Consolidated overview of enterprise stock valuation, order processing streams, and inventory health metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="lg"
              onClick={fetchDashboardData}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-md transition-all shadow-sm rounded-xl font-mono text-xs cursor-pointer"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Data
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/sales/orders")}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition-all rounded-xl font-mono text-xs cursor-pointer"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 */}
        <Card
          onClick={() => navigate("/inventory/products")}
          className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer rounded-xl"
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Total Stock Value</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              ₹{kpis.totalStockValue.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 font-mono">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live warehouse valuation
            </p>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card
          onClick={() => navigate("/sales/orders")}
          className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer rounded-xl"
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Today's Orders</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {kpis.todaysOrders}
            </div>
            <div className="text-[11px] mt-1 flex items-center gap-1.5 font-mono">
              {isOrderPositive ? (
                <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100/80 dark:bg-emerald-950 px-1.5 py-0.2 rounded text-[10px]">
                  +{orderTrendPercent}% <ArrowUpRight className="ml-0.5 h-3 w-3" />
                </span>
              ) : (
                <span className="inline-flex items-center text-rose-700 dark:text-rose-400 font-bold bg-rose-100/80 dark:bg-rose-950 px-1.5 py-0.2 rounded text-[10px]">
                  {orderTrendPercent}% <ArrowDownRight className="ml-0.5 h-3 w-3" />
                </span>
              )}
              <span className="text-muted-foreground">vs yesterday ({kpis.yesterdaysOrders})</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card
          onClick={() => navigate("/sales/orders")}
          className="relative overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-card shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer rounded-xl"
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Pending Dispatch</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-2xs">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {kpis.pendingDispatch}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 font-mono">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Awaiting outbound scan
            </p>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card
          onClick={() => navigate("/inventory/products")}
          className="relative overflow-hidden border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer rounded-xl"
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-rose-600 to-red-600" />
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-4 px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 font-mono">Critical Stock Alerts</span>
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-2xs">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold font-mono tracking-tight text-rose-700 dark:text-rose-400">
              {kpis.lowStockItems}
            </div>
            <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 font-mono font-semibold mt-1">
              SKUs requiring reorder
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Sales Performance Area Chart */}
        <Card className="lg:col-span-4 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold text-foreground font-mono flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Revenue Performance Curve
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Monthly revenue trajectory across the current fiscal cycle.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)" }}
                    dy={10}
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)" }}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                      fontWeight: "600",
                      fontFamily: "var(--font-mono)",
                      backgroundColor: "var(--card)"
                    }}
                    formatter={(value) => [`₹${(value || 0).toLocaleString()}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Donut Chart */}
        <Card className="lg:col-span-3 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-foreground font-mono flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              Order Pipeline Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-mono">
              Live status breakdown of active order workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatus}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {orderStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        className="hover:opacity-85 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px", fontFamily: "var(--font-mono)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Top Products & Audit Stream */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Top Grossing Products */}
        <Card className="lg:col-span-3 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-foreground font-mono">
              Top Grossing Products
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-mono">
              Highest grossing SKUs in current billing cycle.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis
                    type="number"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)" }}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <YAxis
                    dataKey="productName"
                    type="category"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tick={{ fill: "var(--foreground)", fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid var(--border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "12px",
                      fontWeight: "600",
                      fontFamily: "var(--font-mono)"
                    }}
                    formatter={(val) => [`₹${(val || 0).toLocaleString()}`, "Revenue"]}
                  />
                  <Bar
                    dataKey="revenue"
                    radius={[0, 6, 6, 0]}
                    fill="#2563eb"
                    className="hover:fill-blue-700 transition-colors cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Telemetry Log */}
        <Card className="lg:col-span-4 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-foreground font-mono flex items-center justify-between">
                <span>Live Activity Telemetry</span>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-background border-primary/30 text-primary">
                  Live Feed
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Recent ERP transactions, stock updates, and order events.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2.5">
                {recentActivity.map((activity: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border border-slate-100 dark:border-slate-800/60 cursor-pointer"
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {activity.text}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {activity.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold font-mono shrink-0 bg-background">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
          <div className="p-4 pt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/sales/orders")}
              className="w-full text-xs font-mono font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
            >
              View Full System Log <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Row 4: Account Partners & Critical Inventory */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Account Partners */}
        <Card className="shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-foreground font-mono flex items-center justify-between">
              <span>Top Account Partners</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/stakeholders/clients")}
                className="text-xs font-mono text-blue-600 hover:text-blue-700 p-0 h-auto font-semibold cursor-pointer"
              >
                Client Directory
              </Button>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-mono">
              Key B2B clients ranked by cumulative order revenue.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {topClients.map((client: any, i: number) => (
                <div
                  key={i}
                  onClick={() => navigate("/stakeholders/clients")}
                  className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border border-slate-100 dark:border-slate-800/60 cursor-pointer group"
                >
                  <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {client.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {client.totalOrders} Orders Executed
                    </p>
                  </div>
                  <div className="text-sm font-extrabold font-mono text-foreground shrink-0">
                    ₹{client.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Critical Stock Alerts */}
        <Card className="shadow-sm border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-rose-700 dark:text-rose-400 font-mono flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Inventory Reorders
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/inventory/products")}
                className="text-xs font-mono text-rose-700 hover:text-rose-800 p-0 h-auto font-semibold cursor-pointer"
              >
                Inventory Catalog
              </Button>
            </CardTitle>
            <CardDescription className="text-xs text-rose-600/90 font-mono">
              SKUs reaching or breaching mandatory safety stock thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {criticalStock.map((stock: any, i: number) => (
                <div
                  key={i}
                  onClick={() => navigate("/inventory/products")}
                  className="flex items-center gap-3.5 p-3 rounded-xl bg-card border border-rose-100 dark:border-rose-900/50 shadow-xs cursor-pointer hover:border-rose-300 transition-colors"
                >
                  <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 shrink-0">
                    <Box className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {stock.productName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {stock.variantName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="destructive" className="font-mono text-[11px] px-2.5 py-0.5 font-bold">
                      {stock.currentQuantity} / {stock.reorderLevel} qty
                    </Badge>
                  </div>
                </div>
              ))}
              {criticalStock.length === 0 && (
                <p className="text-sm text-muted-foreground font-mono italic text-center py-6">
                  All inventory SKUs are currently well above reorder thresholds.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
