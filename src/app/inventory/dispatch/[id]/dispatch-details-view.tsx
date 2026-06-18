"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Link2,
  MapPin,
  Package,
  Printer,
  Save,
  Truck,
  Weight,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  deliveryPartners,
  getDispatchReadiness,
  mapOrderDispatchToApi,
  type DispatchStatus,
  type OrderDispatch,
} from "../types"
import { dispatchApi } from "@/lib/api"

interface DispatchDetailsViewProps {
  dispatch: OrderDispatch
}

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

function cloneDispatch(dispatch: OrderDispatch): OrderDispatch {
  return {
    ...dispatch,
    items: dispatch.items.map((item) => ({ ...item })),
    timeline: dispatch.timeline.map((event) => ({ ...event })),
  }
}

export function DispatchDetailsView({ dispatch }: DispatchDetailsViewProps) {
  const router = useRouter()
  const [form, setForm] = React.useState<OrderDispatch>(() => cloneDispatch(dispatch))
  const readiness = getDispatchReadiness(form)

  function updateField<K extends keyof OrderDispatch>(key: K, value: OrderDispatch[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function saveDraft() {
    try {
      const apiPayload = mapOrderDispatchToApi(form)
      await dispatchApi.update(form.id, apiPayload)
      toast.success("Dispatch details saved successfully on server")
    } catch (err) {
      console.error("Failed to save dispatch:", err)
      toast.error("Failed to save dispatch to server")
    }
  }

  async function markDispatched() {
    if (!readiness.isReady) {
      toast.error("Add delivery partner, tracking number, package count, and dispatch date first.")
      return
    }

    const nextTimeline = [
      {
        id: `tl-${Date.now()}`,
        label: "Dispatched",
        description: `${form.partnerName} tracking ${form.trackingNumber} recorded.`,
        timestamp: new Date().toISOString(),
        status: "current",
      },
      ...form.timeline.map((event) => ({ ...event, status: event.status === "current" ? "complete" : event.status })),
    ]

    const nextForm = {
      ...form,
      status: "Dispatched" as DispatchStatus,
      timeline: nextTimeline
    }

    setForm(nextForm)

    try {
      const apiPayload = mapOrderDispatchToApi(nextForm)
      await dispatchApi.update(form.id, apiPayload)
      await dispatchApi.updateStatus(form.id, "Dispatched", "Order marked as Dispatched")
      toast.success("Order marked as dispatched on server")
    } catch (err) {
      console.error("Failed to update status on server:", err)
      toast.success("Order marked as dispatched locally")
    }
  }

  async function updateStatus(status: DispatchStatus) {
    const nextTimeline = [
      {
        id: `tl-${Date.now()}`,
        label: status,
        description:
          status === "Delivered"
            ? "Delivery confirmation recorded."
            : status === "Exception"
              ? "Delivery exception reported for warehouse follow-up."
              : `Shipment status updated to ${status}.`,
        timestamp: new Date().toISOString(),
        status: status === "Exception" ? "exception" : "current",
      },
      ...form.timeline.map((event) => ({ ...event, status: event.status === "current" ? "complete" : event.status })),
    ]

    const nextForm = {
      ...form,
      status,
      timeline: nextTimeline
    }

    setForm(nextForm)

    try {
      const apiPayload = mapOrderDispatchToApi(nextForm)
      await dispatchApi.update(form.id, apiPayload)
      
      let apiStatus = status
      if (status === "In Transit") apiStatus = "InTransit"
      
      await dispatchApi.updateStatus(form.id, apiStatus, `Shipment status updated to ${status}`)
      toast.success(`Dispatch status updated to ${status} on server`)
    } catch (err) {
      console.error("Failed to update status on server:", err)
      toast.success(`Dispatch status updated to ${status} locally`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{form.orderNumber}</h1>
              {getStatusBadge(form.status)}
              <Badge variant="outline" className="gap-1">
                <Truck className="h-3.5 w-3.5" />
                Dispatch
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Record logistics details for {form.clientName} from {form.warehouseName}.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Label
          </Button>
          <Button variant="outline" className="gap-2" onClick={saveDraft}>
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button className="gap-2" onClick={markDispatched}>
            <Truck className="h-4 w-4" />
            Mark Dispatched
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Packages</p>
                <p className="mt-2 text-2xl font-bold">{form.packageCount}</p>
              </div>
              <Package className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Weight</p>
                <p className="mt-2 text-2xl font-bold">{form.grossWeightKg || 0} kg</p>
              </div>
              <Weight className="h-6 w-6 text-sky-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Freight</p>
                <p className="mt-2 text-2xl font-bold">Rs {form.freightCharges || 0}</p>
              </div>
              <IndianRupee className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Progress value={readiness.percent}>
              <ProgressLabel>Dispatch readiness</ProgressLabel>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">{readiness.percent}%</span>
            </Progress>
            <p className="mt-3 text-xs text-muted-foreground">
              {readiness.complete} of {readiness.total} required fields complete.
            </p>
          </CardContent>
        </Card>
      </div>

      {!readiness.isReady && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="text-amber-600" />
          <AlertTitle>Dispatch details incomplete</AlertTitle>
          <AlertDescription>
            Add delivery partner, tracking number, package count, and dispatch date before marking this order dispatched.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Info</CardTitle>
              <CardDescription>Record the delivery partner, tracking number, tracking link, charges, and dispatch date.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {/* Delivery Partner — full width */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="partnerName">Delivery Partner (Company Name) *</Label>
                <select
                  id="partnerName"
                  value={form.partnerName}
                  onChange={(event) => updateField("partnerName", event.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Select delivery partner</option>
                  {deliveryPartners.map((partner) => (
                    <option key={partner} value={partner}>
                      {partner}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tracking Number */}
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking / AWB Number</Label>
                <Input
                  id="trackingNumber"
                  value={form.trackingNumber}
                  onChange={(event) => updateField("trackingNumber", event.target.value)}
                  placeholder="e.g. 1234567890"
                  className="font-mono"
                />
              </div>

              {/* Tracking Link */}
              <div className="space-y-2">
                <Label htmlFor="trackingLink">Tracking Link (URL)</Label>
                <Input
                  id="trackingLink"
                  type="url"
                  value={(form as any).trackingLink ?? ""}
                  onChange={(event) => updateField("trackingLink" as any, event.target.value)}
                  placeholder="https://track.delhivery.com/..."
                />
              </div>

              {/* Freight Charges */}
              <div className="space-y-2">
                <Label htmlFor="freightCharges">Freight Charges (₹)</Label>
                <Input
                  id="freightCharges"
                  type="number"
                  min={0}
                  value={form.freightCharges ?? ""}
                  placeholder="0"
                  onChange={(event) => updateField("freightCharges", Number(event.target.value))}
                />
              </div>

              {/* Dispatch Date */}
              <div className="space-y-2">
                <Label htmlFor="dispatchDate">Dispatch Date *</Label>
                <Input
                  id="dispatchDate"
                  type="date"
                  value={form.dispatchDate}
                  onChange={(event) => updateField("dispatchDate", event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Packed Items</CardTitle>
              <CardDescription>Products included in this dispatch handoff.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="text-right font-semibold">{item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{form.clientName}</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{form.shippingAddress}</div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Warehouse</Label>
                  <div className="text-sm font-medium">{form.warehouseCode}</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Packed</Label>
                  <div className="text-sm font-medium">
                    {form.packedAt ? new Date(form.packedAt).toLocaleDateString("en-GB") : "Pending"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tracking Timeline</CardTitle>
                <CardDescription>Operational delivery events.</CardDescription>
              </div>
              <ClipboardList className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {form.timeline.map((event) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={
                          event.status === "exception"
                            ? "rounded-full bg-red-100 p-1.5 text-red-600"
                            : event.status === "pending"
                              ? "rounded-full bg-slate-100 p-1.5 text-slate-400"
                              : "rounded-full bg-emerald-100 p-1.5 text-emerald-600"
                        }
                      >
                        {event.status === "exception" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{event.label}</div>
                      <div className="text-sm text-muted-foreground">{event.description}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString("en-GB")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-5" />
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start gap-2" onClick={() => updateStatus("In Transit")}>
                  <Truck className="h-4 w-4" />
                  Mark In Transit
                </Button>
                <Button variant="outline" className="justify-start gap-2" onClick={() => updateStatus("Delivered")}>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Delivered
                </Button>
                <Button variant="outline" className="justify-start gap-2 text-red-700" onClick={() => updateStatus("Exception")}>
                  <AlertTriangle className="h-4 w-4" />
                  Report Exception
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dispatch Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  Partner
                </span>
                <span className="font-medium">{form.partnerName || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <ClipboardList className="h-4 w-4" />
                  Tracking
                </span>
                <span className="font-mono text-xs">{form.trackingNumber || "—"}</span>
              </div>
              {(form as any).trackingLink && (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                    Link
                  </span>
                  <a
                    href={(form as any).trackingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-primary underline-offset-2 hover:underline"
                  >
                    Track
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Freight</span>
                <span className="font-medium">
                  {form.freightCharges != null ? `₹${form.freightCharges}` : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
