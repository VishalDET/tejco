"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Printer, 
  FileDown, 
  Edit, 
  ShoppingCart, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Truck, 
  PackageCheck,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Order, OrderStatus } from "@/app/sales/orders/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface OrderDetailsViewProps {
  order: Order
}

export function OrderDetailsView({ order }: OrderDetailsViewProps) {
  const router = useRouter()

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "Pending": return <Clock className="h-5 w-5 text-amber-500" />
      case "Approved": return <CheckCircle2 className="h-5 w-5 text-blue-500" />
      case "Packed": return <ShoppingCart className="h-5 w-5 text-purple-500" />
      case "Dispatched": return <Truck className="h-5 w-5 text-indigo-500" />
      case "Delivered": return <PackageCheck className="h-5 w-5 text-emerald-500" />
      case "Cancelled": return <Circle className="h-5 w-5 text-destructive" />
      default: return <Circle className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Pending": return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none">Pending Approval</Badge>
      case "Approved": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">Approved</Badge>
      case "Packed": return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-none">Packed</Badge>
      case "Dispatched": return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-none">Dispatched</Badge>
      case "Delivered": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Delivered</Badge>
      case "Cancelled": return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-muted-foreground">Order placed on {new Date(order.date).toLocaleDateString()} for {order.clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Export
          </Button>
          <Button className="gap-2">
            <Edit className="h-4 w-4" /> Edit Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Items Card */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Detailed list of products in this order.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{item.sku}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">₹{item.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 flex justify-end">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span>₹{order.taxAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1 text-muted-foreground">Internal Notes</h4>
                  <p className="text-sm border p-3 rounded-md bg-muted/20 italic">
                    {order.notes || "No extra notes provided for this order."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Status Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  {getStatusIcon(order.status)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{order.status}</div>
                  <div className="text-xs text-muted-foreground">Updated {new Date(order.date).toLocaleDateString()}</div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Actions</div>
                <Button variant="outline" className="w-full justify-start text-xs font-normal" size="sm">Update Tracking Info</Button>
                <Button variant="outline" className="w-full justify-start text-xs font-normal" size="sm">Mark as Dispatched</Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Shipping */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Account</Label>
                <div className="text-sm font-medium">{order.clientName}</div>
                <div className="text-xs text-muted-foreground">Sales Rep: {order.salesPersonId || "Unassigned"}</div>
              </div>
              <Separator />
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Shipping Address</Label>
                <div className="text-xs mt-1 leading-relaxed">{order.shippingAddress}</div>
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground">Billing Address</Label>
                <div className="text-xs mt-1 leading-relaxed">{order.billingAddress}</div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className={order.paymentStatus === "Paid" ? "border-emerald-200 bg-emerald-50/10" : "border-amber-200 bg-amber-50/10"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between font-bold">
                Payment Status
                <Badge variant={order.paymentStatus === "Paid" ? "default" : "secondary"} className={order.paymentStatus === "Paid" ? "bg-emerald-500" : ""}>
                    {order.paymentStatus}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground">Remaining: ₹{order.paymentStatus === "Paid" ? "0" : order.totalAmount.toLocaleString()}</div>
                {order.paymentStatus !== "Paid" && (
                  <Button variant="link" className="p-0 h-auto text-xs mt-2 uppercase font-bold text-primary">Record Payment</Button>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
