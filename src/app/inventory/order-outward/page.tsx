"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Filter,
  PackageCheck,
  Play,
  RefreshCw,
  ScanBarcode,
  Search,
  Truck,
  Warehouse,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOutwardProgress, mapApiOutwardOrder, type OutwardOrder, type OutwardStatus } from "./types"
import { orderOutwardApi } from "@/lib/api"

const tabFilters: Array<{ label: string; value: "all" | OutwardStatus }> = [
  { label: "All", value: "all" },
  { label: "Ready", value: "Ready" },
  { label: "In Scan", value: "Partially Scanned" },
  { label: "Completed", value: "Completed" },
  { label: "Exceptions", value: "Exception" },
]

function getStatusBadge(status: OutwardStatus) {
  switch (status) {
    case "Ready":
      return <Badge className="border-none bg-blue-100 text-blue-800 hover:bg-blue-100">Ready</Badge>
    case "Scanning":
      return <Badge className="border-none bg-sky-100 text-sky-800 hover:bg-sky-100">Scanning</Badge>
    case "Partially Scanned":
      return <Badge className="border-none bg-amber-100 text-amber-800 hover:bg-amber-100">Partially Scanned</Badge>
    case "Completed":
      return <Badge className="border-none bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Completed</Badge>
    case "Exception":
      return <Badge className="border-none bg-red-100 text-red-800 hover:bg-red-100">Exception</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getPriorityBadge(priority: OutwardOrder["priority"]) {
  switch (priority) {
    case "Urgent":
      return <Badge variant="destructive">Urgent</Badge>
    case "High":
      return <Badge className="border-none bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>
    default:
      return <Badge variant="outline">Normal</Badge>
  }
}

function DashboardStat({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border bg-muted/40">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrderOutwardPage() {
  const router = useRouter()
  const [orders, setOrders] = React.useState<OutwardOrder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"all" | OutwardStatus>("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const fetchOrders = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await orderOutwardApi.getAll()
      const rawList = Array.isArray(res) ? res : ((res as any)?.data && Array.isArray((res as any).data) ? (res as any).data : [])
      setOrders(rawList.map(mapApiOutwardOrder))
    } catch (err) {
      console.error("Failed to load outward orders:", err)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === "all" || order.status === activeTab
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(query) ||
      order.clientName.toLowerCase().includes(query) ||
      order.warehouseName.toLowerCase().includes(query) ||
      order.items.some((item) => item.sku.toLowerCase().includes(query) || item.barcode.includes(query))

    return matchesTab && matchesSearch
  })

  const readyCount = orders.filter((order) => order.status === "Ready").length
  const exceptionCount = orders.filter((order) => order.status === "Exception").length
  const completedCount = orders.filter((order) => order.status === "Completed").length
  const pendingUnits = orders.reduce((sum, order) => sum + getOutwardProgress(order).pendingQty, 0)

  const nextReadyOrderId = orders.find((order) => order.status === "Ready" || order.status === "Pending")?.id

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Order Outward</h1>
            <Badge variant="outline" className="gap-1">
              <ScanBarcode className="h-3.5 w-3.5" />
              Warehouse Scan
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Pick, scan, validate, and prepare approved sales orders for dispatch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchOrders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="gap-2" 
            onClick={() => router.push(`/inventory/order-outward/${nextReadyOrderId}`)}
            disabled={!nextReadyOrderId}
          >
            <Play className="h-4 w-4" />
            Start Next
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStat title="Ready Orders" value={String(readyCount)} description="Waiting for outward scan" icon={ClipboardList} />
        <DashboardStat title="Pending Units" value={String(pendingUnits)} description="Units still to validate" icon={ScanBarcode} />
        <DashboardStat title="Completed" value={String(completedCount)} description="Ready for dispatch handoff" icon={PackageCheck} />
        <DashboardStat title="Exceptions" value={String(exceptionCount)} description="Need warehouse review" icon={AlertCircle} />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | OutwardStatus)} className="w-full">
        <div className="flex flex-col gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="h-auto gap-6 bg-transparent p-0">
            {tabFilters.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none px-0 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search order, client, SKU..."
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg">Outward Queue</CardTitle>
                <CardDescription>Orders shown here are ready for warehouse processing.</CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                <Warehouse className="h-4 w-4" />
                Multi-warehouse queue
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[130px]">Order</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Promise Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No outward orders match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const progress = getOutwardProgress(order)

                      return (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="font-semibold text-primary">{order.orderNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.orderDate).toLocaleDateString("en-GB")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{order.clientName}</div>
                            <div className="line-clamp-1 max-w-[260px] text-xs text-muted-foreground">
                              {order.shippingAddress}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Warehouse className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">{order.warehouseCode}</div>
                                <div className="text-xs text-muted-foreground">{order.warehouseName}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Progress value={progress.percent} className="w-[180px]">
                              <ProgressLabel>{progress.scannedQty}/{progress.totalQty} units</ProgressLabel>
                              <span className="ml-auto text-sm text-muted-foreground tabular-nums">{progress.percent}%</span>
                            </Progress>
                          </TableCell>
                          <TableCell>{new Date(order.promisedDate).toLocaleDateString("en-GB")}</TableCell>
                          <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={order.status === "Completed" ? "outline" : "default"}
                              className="gap-2"
                              onClick={() => router.push(`/inventory/order-outward/${order.id}`)}
                            >
                              {order.status === "Completed" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Truck className="h-4 w-4" />
                              )}
                              {order.status === "Completed" ? "Review" : "Start Outscan"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
