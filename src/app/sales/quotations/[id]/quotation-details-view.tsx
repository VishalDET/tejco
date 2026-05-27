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
  ChevronRight,
  Receipt
} from "lucide-react"
import { SalesDocumentStatus } from "@/app/sales/types"
import { Quotation } from "@/app/sales/quotations/types"
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
import { quotationsApi } from "@/lib/api"
import { toast } from "sonner"
import { QuotationFormDialog } from "../quotation-form-dialog"

interface QuotationDetailsViewProps {
  quotation: Quotation
}

export function QuotationDetailsView({ quotation: initialQuotation }: QuotationDetailsViewProps) {
  const router = useRouter()
  const [quotation, setQuotation] = React.useState<Quotation>(initialQuotation)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const handleSave = async () => {
    try {
      const updated = await quotationsApi.getById(String(initialQuotation.quotationId))
      setQuotation(updated)
      router.refresh()
    } catch (err) {
      console.error("Failed to refresh quotation after edit:", err)
    }
  }
  const [isConverting, setIsConverting] = React.useState(false)
  const originalSubtotal = quotation.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const totalDiscount = quotation.items.reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)
  const hasDiscounts = totalDiscount > 0
  const isAlreadyConverted = quotation.status === "Converted to Proforma"

  const handleConvertToProforma = async () => {
    if (isAlreadyConverted) return
    setIsConverting(true)
    try {
      // Build the payload to update quotation status
      const payload = {
        quotationId: quotation.quotationId,
        quotationNumber: quotation.quotationNumber || quotation.number,
        quotationDate: new Date(quotation.date).toISOString(),
        clientName: quotation.clientName || "",
        clientAddress: quotation.billingAddress || "",
        clientMobileNo: quotation.clientMobileNo || "",
        subject: quotation.subject || "",
        gstinNo: quotation.gstinNo || "",
        validityDays: quotation.validityDays || 7,
        deliveryTime: quotation.deliveryTime || "",
        salesPersonName: quotation.salesPersonName || "",
        salesPersonCell: quotation.salesPersonCell || "",
        salesPersonId: quotation.salesPersonId ? String(quotation.salesPersonId) : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "Converted to Proforma",
        items: quotation.items.map(item => ({
          quotationItemId: isNaN(parseInt(item.id)) ? 0 : parseInt(item.id),
          quotationId: quotation.quotationId,
          productId: isNaN(parseInt(item.productId)) ? 0 : parseInt(item.productId),
          productName: item.productName || "",
          itemName: item.name || "",
          imageUrl: (item as any).imageUrl || "",
          price: item.unitPrice || 0,
          gstPercentage: item.gstRate || 0,
          quantity: item.quantity || 0,
          discountPercentage: (item as any).discountPercentage || 0,
          discountAmount: (item as any).discountAmount || 0,
        }))
      }
      await quotationsApi.update(String(quotation.quotationId), payload)
      toast.success("Quotation marked as converted")
    } catch (err) {
      console.error("Failed to update quotation status:", err)
      // Continue with conversion even if status update fails
    } finally {
      setIsConverting(false)
    }

    // Store prefill data and navigate to proforma page
    localStorage.setItem("convert_source_data", JSON.stringify({
      ...quotation,
      sourceId: quotation.id,
      number: "",
      status: "Draft",
      date: new Date().toISOString().split("T")[0],
    }))
    router.push("/sales/proforma-invoices?convert=true")
  }

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
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-50"
            onClick={handleConvertToProforma}
            disabled={isAlreadyConverted || isConverting}
          >
            {isConverting
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Converting…</>
              : <><Receipt className="h-4 w-4" /> {isAlreadyConverted ? "Converted to Proforma" : "Convert to Proforma"}</>
            }
          </Button>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
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
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-center">GST %</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items.map((item) => {
                    const discountPercentage = (item as any).discountPercentage || 0
                    const discountAmount = (item as any).discountAmount || 0
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <div className="h-10 w-10 rounded border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0">
                                <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900">{item.productName}</div>
                              <div className="text-xs text-slate-500">{item.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">{item.sku}</TableCell>
                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.unitPrice.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right">
                          {discountPercentage > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                                -{discountPercentage}%
                              </span>
                              <span className="text-[10px] text-slate-400">
                                (₹{discountAmount.toLocaleString("en-IN")} off)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-slate-500">{item.gstRate}%</TableCell>
                        <TableCell className="text-right font-bold text-slate-900">₹{item.total.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="mt-8 flex justify-end">
                <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal (Gross)</span>
                    <span className="font-medium">₹{originalSubtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {hasDiscounts && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Total Discount</span>
                      <span className="text-rose-600 font-medium">- ₹{totalDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Calculated Tax</span>
                    <span className="text-blue-600 font-medium">+ ₹{quotation.taxAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <Separator className="bg-slate-200" />
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span className="text-slate-700">Grand Total</span>
                    <span className="text-primary text-2xl tracking-tight">₹{quotation.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Card */}
          {quotation.subject && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Quotation Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-slate-800 leading-snug">
                  {quotation.subject}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Validity Period</Label>
                  <div className="text-sm font-medium mt-1">{quotation.validityDays} Days</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Estimated Delivery</Label>
                  <div className="text-sm font-medium mt-1">{quotation.deliveryTime || "TBD"}</div>
                </div>
              </div>
              <Separator className="mb-6" />
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
                {quotation.clientMobileNo && (
                  <div className="text-xs text-slate-500 mt-0.5">{quotation.clientMobileNo}</div>
                )}
              </div>
              <Separator className="bg-slate-50" />
              <div>
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Sales Representative</Label>
                <div className="text-sm font-bold text-slate-800 mt-1">{quotation.salesPersonName || "N/A"}</div>
                {quotation.salesPersonCell && (
                  <div className="text-xs text-slate-500 mt-0.5">{quotation.salesPersonCell}</div>
                )}
              </div>
              <Separator className="bg-slate-50" />
              <div>
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Validity</Label>
                <div className="text-sm font-medium text-blue-600 mt-1">Valid until {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString("en-GB") : 'N/A'} ({quotation.validityDays} days)</div>
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

      {/* Hidden Print Layout */}
      <div id="quotation-print-area" className="hidden print:block font-sans max-w-[850px] mx-auto p-8 bg-white text-black leading-relaxed">
        {/* Print Stylesheet injection */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #quotation-print-area, #quotation-print-area * {
              visibility: visible;
            }
            #quotation-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
              display: block !important;
              padding-top: 0 !important;
              margin-top: 0 !important;
            }
            @page {
              size: portrait;
              margin: 0mm 15mm 15mm 15mm;
            }
          }
        `}} />

        {/* Brand Header */}
        <div className="relative h-[110px] w-full mb-8 overflow-hidden">
          {/* Red bar across the right side */}
          <div className="absolute top-[65px] left-0 right-0 h-[12px] bg-[#d9232a]"></div>
          {/* Light grey bar under the red bar */}
          <div className="absolute top-[77px] left-0 right-0 h-[28px] bg-[#e6e6e6]"></div>
          
          {/* Right side dark grey header */}
          <div className="absolute top-0 right-0 left-0 h-[65px] bg-[#505052] flex items-center justify-end pr-6">
            <span className="text-white font-bold text-2xl tracking-wide uppercase">TEJCO GLOBAL LLP</span>
          </div>

          {/* Left side curved logo block */}
          <div className="absolute top-0 left-0 w-[240px] h-[105px] bg-[#505052] rounded-br-[70px] flex flex-col items-center justify-center border-r-[6px] border-b-[6px] border-[#505052]">
            <img src="https://tejcovision.com/wp-content/uploads/2018/09/logo-footer.png" alt="Tejco" className="h-16 object-contain z-10" />
          </div>
        </div>

        {/* Date and Customer Info */}
        <div className="mb-6 text-sm space-y-4">
          <div className="font-bold">Date: {new Date(quotation.date).toLocaleDateString("en-GB")}</div>

          <div className="space-y-1">
            <div className="font-bold text-base">To</div>
            <div className="font-bold text-md">{quotation.clientName}</div>
            <div className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">{quotation.billingAddress?.replace(/\|/g, ", ")}</div>
            {quotation.clientMobileNo && <div className="text-slate-700 mt-1"><strong>Mob No:</strong> {quotation.clientMobileNo}</div>}
          </div>
        </div>

        {/* Subject */}
        <div className="text-center font-bold text-sm my-6">
          Sub : <span className="underline font-bold uppercase">Quotation for {quotation.subject || "Surgical Products"}</span>
        </div>

        {/* Salutation & Opening */}
        <div className="text-sm mb-6">
          <p className="mb-2">Dear Sir,</p>
          <p>Thank you very much for kind courtesy extended. As discussed sending you quote for the same as follows :</p>
        </div>

        {/* Custom Rendered Item Boxes */}
        <div className="space-y-6">
          {quotation.items.map((item, idx) => {
            const discountPercentage = (item as any).discountPercentage || 0
            const discountAmount = (item as any).discountAmount || 0
            return (
              <div key={item.id || idx} className="border-2 border-slate-800 rounded overflow-hidden flex text-sm">
                <div className="flex-1 grid grid-rows-3 divide-y-2 divide-slate-800">
                  {/* Row 1 */}
                  <div className="grid grid-cols-[180px_1fr] divide-x-2 divide-slate-800">
                    <div className="p-1 font-bold bg-slate-100 flex items-center">
                      Product Name : {(() => {
                        const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                        return roman[idx] || String(idx + 1);
                      })()}
                    </div>
                    <div className="p-1 flex flex-col justify-center font-bold text-base">
                      {item.productName}
                      {item.name && <span className="text-xs text-slate-500 font-normal mt-0.5">{item.name}</span>}
                    </div>
                  </div>
                  {/* Row 2 */}
                  <div className="grid grid-cols-[180px_1fr] divide-x-2 divide-slate-800">
                    <div className="p-1 font-bold bg-slate-100 flex items-center">Price</div>
                    <div className="p-1 flex items-center font-semibold">
                      Rs {item.unitPrice.toLocaleString("en-IN")} /-
                      {discountPercentage > 0 && (
                        <span className="text-rose-600 ml-1">
                          ({discountPercentage}% Disc. applied: Rs {(item.unitPrice - discountAmount).toLocaleString("en-IN")}/-)
                        </span>
                      )}
                      &nbsp;+ GST({item.gstRate}%) per pcs
                    </div>
                  </div>
                  {/* Row 3 */}
                  <div className="grid grid-cols-[180px_1fr] divide-x-2 divide-slate-800">
                    <div className="p-1 font-bold bg-slate-100 flex items-center">Qty</div>
                    <div className="p-1 flex items-center font-bold text-base">
                      {item.quantity} Nos
                    </div>
                  </div>
                </div>
                {item.imageUrl && (
                  <div className="w-[180px] border-l-2 border-slate-800 p-2 flex items-center justify-center bg-white flex-shrink-0">
                    <img src={item.imageUrl} alt={item.productName} className="max-h-[110px] max-w-full object-contain" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Spacing */}
        <div className="my-8"></div>

        {/* Terms & Details Table */}
        <table className="w-full border-2 border-slate-800 border-collapse text-sm mb-8">
          <tbody>
            <tr className="border-b-2 border-slate-800 divide-x-2 divide-slate-800">
              <td className="w-1/3 p-1 font-normal bg-slate-100">Taxes:</td>
              <td className="p-1 font-normal">GST extra as Applicable</td>
            </tr>
            <tr className="border-b-2 border-slate-800 divide-x-2 divide-slate-800">
              <td className="p-1 font-normal bg-slate-100">GSTIN No:</td>
              <td className="p-1 font-normal">{quotation.gstinNo || "27AAUFT6646F1ZJ"}</td>
            </tr>
            <tr className="border-b-2 border-slate-800 divide-x-2 divide-slate-800">
              <td className="p-1 font-normal bg-slate-100">Validity of Quotation:</td>
              <td className="p-1 font-normal">{quotation.validityDays || 7} Days</td>
            </tr>
            <tr className="divide-x-2 divide-slate-800">
              <td className="p-1 font-normal bg-slate-100">DELIVERY Time:</td>
              <td className="p-1 font-normal">{quotation.deliveryTime || "10-15 Working Days"}</td>
            </tr>
          </tbody>
        </table>

        {/* Extra text details */}
        <div className="text-xs space-y-4 mb-4 text-slate-800">
          <p>The information on prices given here is for your personal use and should not be disclosed to our competitors.</p>
          <p className="font-semibold text-sm tracking-wide">P.O SHOULD BE IN THE NAME OF TEJCO GLOBAL LLP</p>

          <div className="pt-2">
            <p>Thanking you and Assuring Our Best Services</p>
            <p>Yours faithfully</p>
          </div>

          <div className="pt-0 font-bold text-sm">
            <div>FOR TEJCO GLOBAL LLP</div>
            <div className="text-[#d9232a] font-bold uppercase mt-1">{quotation.salesPersonName || "Admin"}</div>
            <div>Cell : {quotation.salesPersonCell || "+91-xxxxxxxxxx"}</div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="border-t-2 border-slate-200 pt-4 relative mt-12 min-h-[90px]">
          <div className="flex justify-between items-end h-full">
            <div className="text-[11px] text-slate-700 flex items-start gap-2 max-w-[65%] leading-relaxed pb-2">
              <span className="text-red-500 font-bold text-base mt-0.5">📍</span>
              <div>
                <strong>404, Amore Commercial Premises</strong>, Junction of 2<sup>nd</sup> & 4<sup>Th</sup> Road Khar West <br />
                Mumbai - 400052 &nbsp; <strong>Tel:-</strong> 022-46730834 &nbsp; <strong>Email:-</strong> tejcoglobal@gmail.com
              </div>
            </div>
            
            {/* Decorative Footer Polygons (Bottom Right) */}
            <div className="absolute right-0 bottom-0 w-[40%] h-[90px] overflow-hidden flex items-end justify-end pointer-events-none">
              {/* Light Grey Shape */}
              <div className="absolute right-0 bottom-0 w-full h-[60px] bg-[#e6e6e6]" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}></div>
              {/* Red Shape */}
              <div className="absolute right-0 bottom-0 w-[80%] h-[75px] bg-[#d9232a]" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}></div>
              {/* Dark Grey Shape */}
              <div className="absolute right-0 bottom-0 w-[60%] h-[90px] bg-[#505052]" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}></div>
            </div>
          </div>
        </div>
      </div>
      <QuotationFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        quotation={quotation}
        onSave={handleSave}
      />
    </div>
  )
}
