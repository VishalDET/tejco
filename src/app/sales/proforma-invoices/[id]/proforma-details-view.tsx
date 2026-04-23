"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Printer, 
  FileDown, 
  Edit, 
  Receipt, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ShoppingCart,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Calculator
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

interface ProformaDetailsViewProps {
  proforma: SalesDocument
}

export function ProformaDetailsView({ proforma }: ProformaDetailsViewProps) {
  const router = useRouter()

  const getStatusIcon = (status: SalesDocumentStatus) => {
    switch (status) {
      case "Draft": return <Clock className="h-5 w-5 text-slate-400" />
      case "Issued": return <Receipt className="h-5 w-5 text-primary" />
      case "Converted to Sales Order": return <ShoppingCart className="h-5 w-5 text-emerald-500" />
      case "Cancelled": return <Circle className="h-5 w-5 text-destructive" />
      default: return <Circle className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: SalesDocumentStatus) => {
    switch (status) {
      case "Draft": return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none">Draft Mode</Badge>
      case "Issued": return <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Issued & Pending</Badge>
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
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 border-slate-200">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{proforma.number}</h1>
              {getStatusBadge(proforma.status)}
            </div>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Generated on {new Date(proforma.date).toLocaleDateString("en-GB")}
              <Separator orientation="vertical" className="h-3 mx-1" />
              <span className="text-slate-900 font-bold">{proforma.clientName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-slate-200 shadow-sm">
            <Printer className="h-4 w-4 text-slate-600" /> Print PI
          </Button>
          <Button variant="outline" className="gap-2 border-slate-200 shadow-sm">
            <FileDown className="h-4 w-4 text-slate-600" /> Download
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md">
            <Edit className="h-4 w-4" /> Edit Details
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content (Items & Totals) */}
        <div className="col-span-8 space-y-6">
          <Card className="shadow-xl shadow-slate-200/50 border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Billed Items</CardTitle>
                <CardDescription>Product and quantity breakdown for this invoice.</CardDescription>
              </div>
              <div className="bg-white p-2 border rounded-lg flex items-center gap-2 px-3 shadow-sm">
                <Calculator className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">Tax-Inclusive View</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow>
                    <TableHead className="pl-6 font-bold text-slate-700">Description</TableHead>
                    <TableHead className="font-bold text-slate-700">SKU</TableHead>
                    <TableHead className="text-center font-bold text-slate-700">Qty</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Rate</TableHead>
                    <TableHead className="text-center font-bold text-slate-700">GST</TableHead>
                    <TableHead className="text-right pr-6 font-bold text-slate-700">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proforma.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                      <TableCell className="pl-6">
                        <div className="font-bold text-slate-800">{item.productName}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-400">{item.sku}</TableCell>
                      <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium">₹{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-center font-bold text-slate-500 bg-slate-50/50">{item.gstRate}%</TableCell>
                      <TableCell className="text-right pr-6 font-extrabold text-slate-900">₹{item.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-8 flex justify-end bg-slate-50/20 border-t border-slate-50 font-sans">
                <div className="w-96 space-y-4">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500 font-medium">Net Value (Subtotal)</span>
                    <span className="font-bold text-slate-800 text-lg">₹{proforma.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-slate-500 font-medium">Combined GST Amount</span>
                    <span className="text-emerald-600 font-extrabold text-lg">+ ₹{proforma.taxAmount.toLocaleString()}</span>
                  </div>
                  <Separator className="bg-slate-200" />
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-slate-900 font-extrabold text-lg">Total Payable</span>
                    <div className="text-right">
                        <span className="text-slate-900 text-4xl font-black tracking-tighter">₹{proforma.totalAmount.toLocaleString()}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Inclusive of all taxes</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-md font-bold text-slate-800">Notes & Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl">
                 <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                   {proforma.notes || "Standard payment terms apply for this proforma invoice."}
                 </p>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                 <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Digital Copy</div>
                 <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> System Generated</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (Status, Addresses, Meta) */}
        <div className="col-span-4 space-y-6">
          <Card className="shadow-md border-slate-200 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-lg flex items-center justify-between">
                 Status Tracker
                 <Receipt className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl shadow-inner">
                  {getStatusIcon(proforma.status)}
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{proforma.status}</div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Awaiting Conversion</div>
                </div>
              </div>
              
              <Separator className="bg-slate-100" />
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Post-Issuance Actions</Label>
                {proforma.status !== "Converted to Sales Order" && (
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 shadow-lg shadow-emerald-100">
                    <ShoppingCart className="h-4 w-4" /> Convert to Final Order
                  </Button>
                )}
                <Button variant="outline" className="w-full font-bold border-slate-200 text-slate-700">
                    Mark as Discarded
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-lg">Logistics & Billing</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client Account</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-1">{proforma.clientName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Account ID</span>
                  <span className="text-xs font-mono text-slate-500 mt-1">{proforma.clientId}</span>
                </div>
              </div>
              
              <Separator className="bg-slate-50" />
              
              <div className="space-y-4">
                <div className="flex flex-col">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Shipping Destination</Label>
                   <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-700 leading-relaxed italic">
                     {proforma.shippingAddress}
                   </div>
                </div>
                <div className="flex flex-col">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Billing Address</Label>
                   <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-700 leading-relaxed italic">
                     {proforma.billingAddress}
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
