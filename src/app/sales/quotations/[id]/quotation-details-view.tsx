"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Printer, 
  FileDown, 
  Edit, 
  FileText, 
  CheckCircle2, 
  Circle, 
  Clock, 
  RefreshCw,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { SalesDocument, SalesDocumentStatus } from "@/app/sales/types"
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

interface QuotationDetailsViewProps {
  quotation: SalesDocument
}

export function QuotationDetailsView({ quotation }: QuotationDetailsViewProps) {
  const router = useRouter()

  const getStatusIcon = (status: SalesDocumentStatus) => {
    switch (status) {
      case "Draft": return <Clock className="h-5 w-5 text-slate-500" />
      case "Issued": return <CheckCircle2 className="h-5 w-5 text-blue-500" />
      case "Converted to Proforma": return <RefreshCw className="h-5 w-5 text-emerald-500" />
      case "Converted to Sales Order": return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case "Cancelled": return <Circle className="h-5 w-5 text-destructive" />
      default: return <Circle className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: SalesDocumentStatus) => {
    switch (status) {
      case "Draft": return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-none">Draft</Badge>
      case "Issued": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">Issued</Badge>
      case "Converted to Proforma": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Converted to Proforma</Badge>
      case "Converted to Sales Order": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Converted to Order</Badge>
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
              <h1 className="text-3xl font-bold tracking-tight">{quotation.number}</h1>
              {getStatusBadge(quotation.status)}
            </div>
            <p className="text-muted-foreground">Quotation generated on {new Date(quotation.date).toLocaleDateString("en-GB")} for {quotation.clientName}</p>
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
            <Edit className="h-4 w-4" /> Edit Quotation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Items Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Quoted Items</CardTitle>
              <CardDescription>Product selection and pricing for this quotation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-center">GST %</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.productName}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{item.sku}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{item.gstRate}%</TableCell>
                      <TableCell className="text-right font-medium">₹{item.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-8 flex justify-end">
                <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">₹{quotation.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Calculated Tax</span>
                    <span className="text-blue-600 font-medium">+ ₹{quotation.taxAmount.toLocaleString()}</span>
                  </div>
                  <Separator className="bg-slate-200" />
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span className="text-slate-700">Grand Total</span>
                    <span className="text-primary text-2xl tracking-tight">₹{quotation.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Notes to Client</h4>
                  <div className="text-sm border p-4 rounded-lg bg-slate-50 border-slate-100 italic text-slate-600">
                    {quotation.notes || "No special terms provided for this quotation."}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Status Tracker */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg">Document Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-full">
                  {getStatusIcon(quotation.status)}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-700">{quotation.status}</div>
                  <div className="text-xs text-slate-400 font-medium">Last active on {new Date(quotation.date).toLocaleDateString("en-GB")}</div>
                </div>
              </div>
              <Separator className="bg-slate-100" />
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Lifecycle Management</div>
                {quotation.status === "Issued" && (
                  <Button variant="outline" className="w-full justify-start text-xs font-semibold gap-2 border-slate-200" size="sm">
                    <RefreshCw className="h-3.5 w-3.5 text-primary" /> Convert to Proforma
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start text-xs font-semibold gap-2 border-slate-200" size="sm">
                  <FileDown className="h-3.5 w-3.5" /> Generate PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Addresses */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-lg">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Account / Doctor</Label>
                <div className="text-sm font-bold text-slate-800 mt-1">{quotation.clientName}</div>
              </div>
              <Separator className="bg-slate-50" />
              <div>
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Validity</Label>
                <div className="text-sm font-medium text-blue-600 mt-1">Valid until {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString("en-GB") : 'N/A'}</div>
              </div>
              <Separator className="bg-slate-50" />
              <div>
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Shipping Address</Label>
                <div className="text-xs mt-2 leading-relaxed text-slate-600 font-medium">{quotation.shippingAddress}</div>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Billing Address</Label>
                <div className="text-xs mt-2 leading-relaxed text-slate-600 font-medium">{quotation.billingAddress}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
