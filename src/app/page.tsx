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
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{kpis.totalStockValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.todaysOrders}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.todaysOrders > kpis.yesterdaysOrders ? (
                <span className="text-emerald-500 inline-flex items-center">
                  +{((kpis.todaysOrders - kpis.yesterdaysOrders) / (kpis.yesterdaysOrders || 1) * 100).toFixed(1)}% <ArrowUpRight className="ml-1 h-3 w-3" />
                </span>
              ) : (
                <span className="text-red-500 inline-flex items-center">
                  {((kpis.todaysOrders - kpis.yesterdaysOrders) / (kpis.yesterdaysOrders || 1) * 100).toFixed(1)}% <ArrowDownRight className="ml-1 h-3 w-3" />
                </span>
              )}{" "}
              vs yesterday ({kpis.yesterdaysOrders})
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Dispatch</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingDispatch}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting fulfillment
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-warning">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{kpis.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Requires immediate reorder</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Monthly revenue overview for the current year.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${(value || 0).toLocaleString()}`} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) => `₹${(value || 0).toLocaleString()}`}
                  />
                  <Line type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
            <CardDescription>Current status of all active orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {orderStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Highest revenue generating products.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="productName" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from around the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">{activity.type}</Badge>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-primary hover:bg-primary/5">View All Activity</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>Highest revenue generating clients.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {topClients.map((client: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{client.clientName}</p>
                    <p className="text-xs text-muted-foreground">{client.totalOrders} Orders</p>
                  </div>
                  <div className="text-sm font-bold">₹{client.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Critical Stock Alerts</CardTitle>
            <CardDescription>Items critically low on stock.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {criticalStock.map((stock: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <Box className="h-4 w-4 text-destructive" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{stock.productName} ({stock.variantName})</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">{stock.currentQuantity} / {stock.reorderLevel}</Badge>
                </div>
              ))}
              {criticalStock.length === 0 && (
                 <p className="text-sm text-muted-foreground">All items are sufficiently stocked.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
