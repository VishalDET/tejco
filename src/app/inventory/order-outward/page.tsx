
import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  ChevronRight,
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
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOutwardProgress, mapApiOutwardOrder, type OutwardOrder, type OutwardStatus } from "./types"
import { orderOutwardApi, salesOrderApi, warehousesApi, apiClient, productsApi } from "@/lib/api"
import { mapApiSalesOrder } from "../../sales/orders/types"

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
      <CardContent className="flex items-center justify-between p-3.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-1 text-xl font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrderOutwardPage() {
  const navigate = useNavigate()
  const router = useNavigate()
  const [orders, setOrders] = React.useState<OutwardOrder[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<"all" | OutwardStatus>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedOrders, setExpandedOrders] = React.useState<Record<number, boolean>>({})

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }))
  }

  const fetchOrders = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Parallel fetch for Sales Orders, Products Catalog, Warehouses, and Outward Orders
      const [resOrders, resProducts, resWarehouses, resOutward] = await Promise.all([
        salesOrderApi.getAll(),
        productsApi.getAll(),
        warehousesApi.getAll(),
        orderOutwardApi.getAll().catch(() => [])
      ])

      const rawList = Array.isArray(resOrders) ? resOrders : ((resOrders as any)?.data && Array.isArray((resOrders as any).data) ? (resOrders as any).data : [])
      const mappedOrders = rawList.map(mapApiSalesOrder)
      // Only show orders which are approved by status (status === "Approved")
      const approvedOrders = mappedOrders.filter((order: any) => order.status === "Approved")

      // Process product catalog to map SKU to Barcode
      const productCatalog = resProducts?.success && Array.isArray(resProducts.data) ? resProducts.data : []
      const barcodeMap = new Map<string, { barcode: string; variantName: string }>()
      productCatalog.forEach((prod: any) => {
        if (prod.variants && Array.isArray(prod.variants)) {
          prod.variants.forEach((v: any) => {
            const sku = `${prod.baseSKU || ""}${v.skuSuffix || ""}`
            if (sku) {
              barcodeMap.set(sku.toLowerCase(), {
                barcode: v.barcode || v.sku || sku,
                variantName: v.variantName || ""
              })
            }
          })
        }
      })

      // Select first active warehouse or use fallback
      const defaultWarehouse = resWarehouses.find((w: any) => w.status === "Active") || resWarehouses[0]
      const whName = defaultWarehouse?.name || "Main Warehouse"
      const whCode = defaultWarehouse?.id ? `WH-${defaultWarehouse.id}` : "M-WH"

      // Process outward orders list from DB
      const rawOutwardList = Array.isArray(resOutward) ? resOutward : ((resOutward as any)?.data && Array.isArray((resOutward as any).data) ? (resOutward as any).data : [])
      const outwardOrders: OutwardOrder[] = []
      const processedOrderIds = new Set<number>()

      // 1. Add all saved outward orders from the DB first
      rawOutwardList.forEach((out: any) => {
        try {
          const mapped = mapApiOutwardOrder(out)
          outwardOrders.push(mapped)
          if (mapped.orderId) {
            processedOrderIds.add(mapped.orderId)
          }
        } catch (e) {
          console.warn("Failed to map outward order:", e)
        }
      })

      // 2. Add approved Sales Orders that don't have an outward order record yet
      approvedOrders.forEach((order: any) => {
        if (!processedOrderIds.has(order.orderId)) {
          const items = order.items.map((item: any) => {
            const skuLower = (item.sku || "").toLowerCase()
            const resolved = barcodeMap.get(skuLower)
            return {
              id: item.id,
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              barcode: resolved?.barcode || item.sku, // Resolved barcode from Product variants
              variantName: resolved?.variantName || item.name || "",
              orderedQty: item.quantity,
              scannedQty: 0,
              locationCode: "A-1"
            }
          })

          outwardOrders.push({
            id: order.id,
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            clientName: order.clientName,
            warehouseName: whName,
            warehouseCode: whCode,
            shippingAddress: order.shippingAddress,
            orderDate: order.date,
            promisedDate: order.deliveryDate || order.date,
            status: "Ready",
            priority: "Normal",
            items,
            scanHistory: []
          })
        }
      })

      setOrders(outwardOrders)
    } catch (err) {
      console.error("Failed to load outward orders from approved sales orders:", err)
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

  // Group orders by orderId
  const groupedOrdersMap = new Map<number, OutwardOrder[]>()
  filteredOrders.forEach((order) => {
    const list = groupedOrdersMap.get(order.orderId || 0) || []
    list.push(order)
    groupedOrdersMap.set(order.orderId || 0, list)
  })

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
            onClick={() => navigate(`/inventory/order-outward/${nextReadyOrderId}`)}
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
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between py-4">
              <div>
                <CardTitle className="text-lg">Outward Queue</CardTitle>
                <CardDescription>Orders shown here are ready for warehouse processing.</CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                <Warehouse className="h-4 w-4" />
                Multi-warehouse queue
              </div>
            </CardHeader>
            <CardContent className="py-4">
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
                    Array.from(groupedOrdersMap.entries()).map(([orderId, runs]) => {
                      const representative = runs[0]
                      const isExpanded = !!expandedOrders[orderId]
                      const hasMultipleRuns = runs.length > 1

                      if (!hasMultipleRuns) {
                        const order = representative
                        const progress = getOutwardProgress(order)
                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div className="font-semibold text-primary">
                                {order.orderNumber} <span className="text-xs text-muted-foreground font-normal">(ID: {order.orderId})</span>
                              </div>
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
                                disabled={isLoading}
                                onClick={async () => {
                                  navigate(`/inventory/order-outward/${order.id}`)
                                }}
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
                      }

                      // Render grouped rows
                      return (
                        <React.Fragment key={orderId}>
                          <TableRow className="bg-muted/30 font-medium hover:bg-muted/40 border-l-4 border-l-primary">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => toggleOrderExpand(orderId)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                  <div>
                                    <div className="font-semibold text-primary">
                                      {representative.orderNumber} <span className="text-xs text-muted-foreground font-normal">(ID: {representative.orderId})</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(representative.orderDate).toLocaleDateString("en-GB")}
                                    </div>
                                  </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{representative.clientName}</div>
                              <div className="line-clamp-1 max-w-[260px] text-xs text-muted-foreground">
                                {representative.shippingAddress}
                              </div>
                            </TableCell>
                            <TableCell colSpan={2}>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                                  {runs.length} Outward Runs
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>{new Date(representative.promisedDate).toLocaleDateString("en-GB")}</TableCell>
                            <TableCell>{getPriorityBadge(representative.priority)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-background">Batch Group</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs font-semibold text-primary"
                                onClick={() => toggleOrderExpand(orderId)}
                              >
                                {isExpanded ? "Hide Runs" : "Show Runs"}
                              </Button>
                            </TableCell>
                          </TableRow>

                          {isExpanded && runs.map((order, runIdx) => {
                            const progress = getOutwardProgress(order)
                            return (
                              <TableRow key={order.id} className="bg-muted/10 border-l-4 border-l-primary/40 hover:bg-muted/15">
                                <TableCell className="pl-12">
                                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Run #{runs.length - runIdx} (ID: {order.id})
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs text-muted-foreground">
                                    Warehouse: <span className="font-medium text-foreground">{order.warehouseCode}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs text-muted-foreground line-clamp-1">{order.warehouseName}</div>
                                </TableCell>
                                <TableCell>
                                  <Progress value={progress.percent} className="w-[180px]">
                                    <ProgressLabel>{progress.scannedQty}/{progress.totalQty} units</ProgressLabel>
                                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{progress.percent}%</span>
                                  </Progress>
                                </TableCell>
                                <TableCell colSpan={2} />
                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant={order.status === "Completed" ? "outline" : "default"}
                                    className="gap-2 h-8 text-xs"
                                    disabled={isLoading}
                                    onClick={async () => {
                                      navigate(`/inventory/order-outward/${order.id}`)
                                    }}
                                  >
                                    {order.status === "Completed" ? (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    ) : (
                                      <Truck className="h-3.5 w-3.5" />
                                    )}
                                    {order.status === "Completed" ? "Review" : "Start Outscan"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </React.Fragment>
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
