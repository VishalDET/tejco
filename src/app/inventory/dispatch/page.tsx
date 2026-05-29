"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Filter,
  MapPin,
  PackageCheck,
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
import { mockDispatches } from "./mock-data"
import { getDispatchReadiness, type DispatchStatus, type OrderDispatch } from "./types"

const tabFilters: Array<{ label: string; value: "all" | DispatchStatus }> = [
  { label: "All", value: "all" },
  { label: "Ready", value: "Ready" },
  { label: "Dispatched", value: "Dispatched" },
  { label: "In Transit", value: "In Transit" },
  { label: "Delivered", value: "Delivered" },
  { label: "Exceptions", value: "Exception" },
]

function getStatusBadge(status: DispatchStatus) {
  switch (status) {
    case "Ready":
      return <Badge className="border-none bg-blue-100 text-blue-800 hover:bg-blue-100">Ready</Badge>
    case "Dispatched":
      return <Badge className="border-none bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Dispatched</Badge>
    case "In Transit":
      return <Badge className="border-none bg-sky-100 text-sky-800 hover:bg-sky-100">In Transit</Badge>
    case "Delivered":
      return <Badge className="border-none bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Delivered</Badge>
    case "Exception":
      return <Badge className="border-none bg-red-100 text-red-800 hover:bg-red-100">Exception</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function DispatchStat({
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

export default function DispatchPage() {
  const router = useRouter()
  const [dispatches] = React.useState<OrderDispatch[]>(mockDispatches)
  const [activeTab, setActiveTab] = React.useState<"all" | DispatchStatus>("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredDispatches = dispatches.filter((dispatch) => {
    const query = searchQuery.toLowerCase()
    const matchesTab = activeTab === "all" || dispatch.status === activeTab
    const matchesSearch =
      dispatch.orderNumber.toLowerCase().includes(query) ||
      dispatch.clientName.toLowerCase().includes(query) ||
      dispatch.warehouseName.toLowerCase().includes(query) ||
      dispatch.partnerName.toLowerCase().includes(query) ||
      dispatch.trackingNumber.toLowerCase().includes(query)

    return matchesTab && matchesSearch
  })

  const readyCount = dispatches.filter((dispatch) => dispatch.status === "Ready").length
  const inTransitCount = dispatches.filter((dispatch) => dispatch.status === "In Transit").length
  const deliveredCount = dispatches.filter((dispatch) => dispatch.status === "Delivered").length
  const exceptionCount = dispatches.filter((dispatch) => dispatch.status === "Exception").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Dispatch Orders</h1>
            <Badge variant="outline" className="gap-1">
              <Truck className="h-3.5 w-3.5" />
              Shipping Handoff
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Record delivery partners, tracking numbers, package details, and delivery progress.
          </p>
        </div>
        <Button className="gap-2" onClick={() => router.push("/inventory/dispatch/disp-9281")}>
          <Truck className="h-4 w-4" />
          Dispatch Next Ready Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DispatchStat title="Ready" value={String(readyCount)} description="Need dispatch details" icon={ClipboardList} />
        <DispatchStat title="In Transit" value={String(inTransitCount)} description="Shipments on the move" icon={Truck} />
        <DispatchStat title="Delivered" value={String(deliveredCount)} description="Confirmed deliveries" icon={PackageCheck} />
        <DispatchStat title="Exceptions" value={String(exceptionCount)} description="Need delivery review" icon={AlertCircle} />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | DispatchStatus)} className="w-full">
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
            <div className="relative w-full sm:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search order, partner, tracking..."
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
                <CardTitle className="text-lg">Dispatch Register</CardTitle>
                <CardDescription>Track packed orders through courier handoff and delivery.</CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Dispatch-ready orders originate from completed outward scans
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[130px]">Order</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Partner / Tracking</TableHead>
                    <TableHead>Packages</TableHead>
                    <TableHead>Readiness</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDispatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No dispatch records match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDispatches.map((dispatch) => {
                      const readiness = getDispatchReadiness(dispatch)

                      return (
                        <TableRow key={dispatch.id}>
                          <TableCell>
                            <div className="font-semibold text-primary">{dispatch.orderNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {dispatch.dispatchDate ? new Date(dispatch.dispatchDate).toLocaleDateString("en-GB") : "No date"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{dispatch.clientName}</div>
                            <div className="line-clamp-1 max-w-[260px] text-xs text-muted-foreground">
                              <MapPin className="mr-1 inline h-3 w-3" />
                              {dispatch.shippingAddress}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Warehouse className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">{dispatch.warehouseCode}</div>
                                <div className="text-xs text-muted-foreground">{dispatch.warehouseName}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{dispatch.partnerName || "Not assigned"}</div>
                            <div className="font-mono text-xs text-muted-foreground">
                              {dispatch.trackingNumber || "Tracking pending"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{dispatch.packageCount} pkg</div>
                            <div className="text-xs text-muted-foreground">
                              {dispatch.grossWeightKg ? `${dispatch.grossWeightKg} kg` : "Weight pending"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Progress value={readiness.percent} className="w-[160px]">
                              <ProgressLabel>{readiness.complete}/{readiness.total} fields</ProgressLabel>
                              <span className="ml-auto text-sm text-muted-foreground tabular-nums">{readiness.percent}%</span>
                            </Progress>
                          </TableCell>
                          <TableCell>{getStatusBadge(dispatch.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={dispatch.status === "Ready" ? "default" : "outline"}
                              className="gap-2"
                              onClick={() => router.push(`/inventory/dispatch/${dispatch.id}`)}
                            >
                              <Truck className="h-4 w-4" />
                              {dispatch.status === "Ready" ? "Create Dispatch" : "View Dispatch"}
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
