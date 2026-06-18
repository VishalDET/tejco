"use client"

import * as React from "react"
import { dashboardApi } from "@/lib/api"
import {
  LineChart,
  Line,
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
import { useState, useEffect } from "react"
import {
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Users,
  Box
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const COLORS = ["var(--primary)", "var(--secondary)", "oklch(0.7 0.1 250)", "oklch(0.6 0.1 200)", "oklch(0.5 0.1 150)"]

export default function DashboardPage() {
  const [kpis, setKpis] = useState({ totalStockValue: 0, todaysOrders: 0, yesterdaysOrders: 0, pendingDispatch: 0, lowStockItems: 0 })
  const [salesTrendData, setSalesTrendData] = useState([])
  const [categorySalesData, setCategorySalesData] = useState([])
  const [warehouseStockData, setWarehouseStockData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [orderStatus, setOrderStatus] = useState([])
  const [topClients, setTopClients] = useState([])
  const [criticalStock, setCriticalStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          kpisData, salesTrendData, categorySalesData, warehouseData, 
          activityData, productsData, orderStatusData, clientsData, stockData
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
        if (salesTrendData.success) setSalesTrendData(salesTrendData.data)
        if (categorySalesData.success) setCategorySalesData(categorySalesData.data)
        if (warehouseData.success) setWarehouseStockData(warehouseData.data)
        if (activityData.success) setRecentActivity(activityData.data)
        if (productsData.success) setTopProducts(productsData.data)
        if (orderStatusData.success) setOrderStatus(orderStatusData.data)
        if (clientsData.success) setTopClients(clientsData.data)
        if (stockData.success) setCriticalStock(stockData.data)

      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-screen">Loading dashboard data...</div>

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-border/50 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Total Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary">₹{kpis.totalStockValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">{kpis.todaysOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.todaysOrders > kpis.yesterdaysOrders ? (
                <span className="text-emerald-600 font-medium inline-flex items-center">
                  +{((kpis.todaysOrders - kpis.yesterdaysOrders) / (kpis.yesterdaysOrders || 1) * 100).toFixed(1)}% <ArrowUpRight className="ml-1 h-3 w-3" />
                </span>
              ) : (
                <span className="text-rose-600 font-medium inline-flex items-center">
                  {((kpis.todaysOrders - kpis.yesterdaysOrders) / (kpis.yesterdaysOrders || 1) * 100).toFixed(1)}% <ArrowDownRight className="ml-1 h-3 w-3" />
                </span>
              )}{" "}
              <span className="opacity-70">vs yesterday ({kpis.yesterdaysOrders})</span>
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Pending Dispatch</CardTitle>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">{kpis.pendingDispatch}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting fulfillment
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-destructive hover:-translate-y-1 hover:shadow-md transition-all duration-200 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-destructive">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">{kpis.lowStockItems}</div>
            <p className="text-xs text-destructive/80 mt-1 font-medium">Requires immediate reorder</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-bold text-primary">Sales Trend</CardTitle>
            <CardDescription className="text-xs">Monthly revenue overview for the current year.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 pb-4 pr-4 pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)' }} dy={10} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)' }} tickFormatter={(value) => `₹${(value / 1000)}k`} width={60} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '500', fontFamily: 'var(--font-mono)' }}
                    formatter={(value) => [`₹${(value || 0).toLocaleString()}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }} activeDot={{ r: 6, fill: "var(--accent)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-bold text-primary">Order Status Breakdown</CardTitle>
            <CardDescription className="text-xs">Current status of all active orders.</CardDescription>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatus}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {orderStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '500' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-bold text-primary">Top Selling Products</CardTitle>
            <CardDescription className="text-xs">Highest revenue generating products.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0 pb-4 pr-4 pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)' }} tickFormatter={(value) => `₹${(value / 1000)}k`} />
                  <YAxis dataKey="productName" type="category" fontSize={11} tickLine={false} axisLine={false} width={110} tick={{ fill: 'var(--muted-foreground)', fontWeight: 500 }} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '500', fontFamily: 'var(--font-mono)' }}
                    formatter={(value) => [`₹${(value || 0).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill="var(--secondary)" className="hover:fill-primary transition-colors cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-4 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-bold text-primary">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Latest updates from around the system.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {recentActivity.map((activity: any, i: number) => (
                <div key={i} className="flex items-center gap-4 group p-2 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50 cursor-pointer">
                  <div className="h-2 w-2 rounded-full bg-secondary group-hover:bg-primary transition-colors" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground font-mono">{activity.time}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-background">{activity.type}</Badge>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs font-semibold text-secondary hover:text-primary hover:bg-primary/5 h-8">View All Activity</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-base font-bold text-primary">Top Clients</CardTitle>
            <CardDescription className="text-xs">Highest revenue generating clients.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
             <div className="space-y-3">
              {topClients.map((client: any, i: number) => (
                <div key={i} className="flex items-center gap-4 group p-2 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border/50 cursor-pointer">
                  <div className="bg-primary/10 p-2 rounded-md group-hover:bg-primary/20 transition-colors">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{client.clientName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{client.totalOrders} Orders</p>
                  </div>
                  <div className="text-sm font-bold font-mono text-foreground">₹{client.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border border-destructive/20 bg-destructive/5 hover:border-destructive/40 transition-colors">
          <CardHeader>
            <CardTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Stock Alerts
            </CardTitle>
            <CardDescription className="text-xs text-destructive/80">Items critically low on stock.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
             <div className="space-y-3">
              {criticalStock.map((stock: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-2 bg-white/50 rounded-lg border border-destructive/10">
                  <div className="bg-destructive/10 p-2 rounded-md">
                    <Box className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{stock.productName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{stock.variantName}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="font-mono text-[10px] px-1.5 py-0">
                      {stock.currentQuantity} / {stock.reorderLevel}
                    </Badge>
                  </div>
                </div>
              ))}
              {criticalStock.length === 0 && (
                 <p className="text-sm text-muted-foreground italic text-center py-4">All items are sufficiently stocked.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
