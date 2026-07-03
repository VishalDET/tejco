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
import { getGoogleDrivePreviewUrl } from "@/lib/utils"
import { toast } from "sonner"
import { QuotationFormDialog } from "../quotation-form-dialog"

interface QuotationDetailsViewProps {
  quotation: Quotation
}

const getCurrencySymbol = (currency?: string) => {
  if (!currency) return "₹"
  switch (currency.toUpperCase()) {
    case "USD": return "$"
    case "EUR": return "€"
    case "GBP": return "£"
    case "INR": return "₹"
    default: return currency
  }
}

const getPrintCurrencySymbol = (currency?: string) => {
  if (!currency || currency.toUpperCase() === "INR") return "Rs"
  return getCurrencySymbol(currency)
}

const formatDateWithDots = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}.${month}.${year}`
  } catch (e) {
    return dateStr
  }
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
  const isAlreadyConverted = quotation.status?.toLowerCase() === "converted to proforma" || quotation.status?.toLowerCase() === "converted to pi"

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
        paymentType: quotation.paymentType || "Domestic",
        currencyType: quotation.currencyType || "INR",
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
    const norm = String(status || "").toLowerCase()
    switch (norm) {
      case "draft": return <Clock className="h-5 w-5 text-slate-500" />
      case "issued": return <CheckCircle2 className="h-5 w-5 text-blue-500" />
      case "converted to proforma":
      case "converted to pi": return <RefreshCw className="h-5 w-5 text-emerald-500" />
      case "converted to sales order": return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case "cancelled": return <Circle className="h-5 w-5 text-destructive" />
      default: return <Circle className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: SalesDocumentStatus) => {
    const norm = String(status || "").toLowerCase()
    switch (norm) {
      case "draft": return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-none">Draft</Badge>
      case "issued": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">Issued</Badge>
      case "converted to proforma":
      case "converted to pi": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Converted to Proforma</Badge>
      case "converted to sales order": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Converted to Order</Badge>
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>
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
          <Button variant="outline" className="gap-2" onClick={() => {
            const el = document.getElementById('quotation-print-area')
            if (el) {
              el.style.display = 'flex'
              el.style.flexDirection = 'column'
              window.onafterprint = () => { el.style.display = 'none' }
            }
            window.print()
          }}>
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
                    <TableHead className="py-2 text-xs">Product</TableHead>
                    <TableHead className="py-2 text-xs">SKU</TableHead>
                    <TableHead className="text-center py-2 text-xs">Qty</TableHead>
                    <TableHead className="text-right py-2 text-xs">Unit Price</TableHead>
                    <TableHead className="text-right py-2 text-xs">Discount</TableHead>
                    <TableHead className="text-center py-2 text-xs">GST %</TableHead>
                    <TableHead className="text-right py-2 text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotation.items.map((item) => {
                    const discountPercentage = (item as any).discountPercentage || 0
                    const discountAmount = (item as any).discountAmount || 0
                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell className="py-1.5">
                          <div className="flex items-center gap-2.5">
                            {item.imageUrl && (
                              <div className="h-8 w-8 rounded border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0">
                                <img src={getGoogleDrivePreviewUrl(item.imageUrl) || ""} alt={item.productName} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900 text-xs">{item.productName}</div>
                              <div className="text-[10px] text-slate-500">{item.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] font-mono text-slate-500 py-1.5">{item.sku}</TableCell>
                        <TableCell className="text-center font-medium py-1.5 text-xs">{item.quantity}</TableCell>
                        <TableCell className="text-right py-1.5 text-xs">{getCurrencySymbol(quotation.currencyType)}{item.unitPrice.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right py-1.5">
                          {discountPercentage > 0 ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1 py-0.5 rounded">
                                -{discountPercentage}%
                              </span>
                              <span className="text-[9px] text-slate-400">
                                ({getCurrencySymbol(quotation.currencyType)}{(discountAmount * item.quantity).toLocaleString("en-IN")} off)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-slate-500 py-1.5 text-xs">{item.gstRate}%</TableCell>
                        <TableCell className="text-right font-bold text-slate-900 py-1.5 text-xs">{getCurrencySymbol(quotation.currencyType)}{(item.unitPrice * item.quantity).toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="mt-8 flex justify-end">
                <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{quotation.paymentType === "Foreign" ? "Gross Total" : "Gross Total (Incl. GST)"}</span>
                    <span className="font-medium">{getCurrencySymbol(quotation.currencyType)}{originalSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {hasDiscounts && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Total Discount (Deducted)</span>
                      <span className="text-rose-600 font-medium">- {getCurrencySymbol(quotation.currencyType)}{totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {quotation.paymentType !== "Foreign" && (
                    <>
                      <Separator className="my-1.5 opacity-50" />
                      <div className="flex justify-between text-xs text-slate-500 italic">
                        <span>Subtotal (Excl. GST)</span>
                        <span>{getCurrencySymbol(quotation.currencyType)}{quotation.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 italic">
                        <span>Total GST (Included)</span>
                        <span className="text-amber-600">{getCurrencySymbol(quotation.currencyType)}{quotation.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  <Separator className="bg-slate-200" />
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span className="text-slate-700">Grand Total</span>
                    <span className="text-primary text-2xl tracking-tight">{getCurrencySymbol(quotation.currencyType)}{quotation.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
      <div id="quotation-print-area" className="hidden bg-white text-black leading-relaxed font-tahoma" style={{ width: "210mm", minHeight: "297mm", margin: "0 auto" }}>
        {/* Print Stylesheet injection */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #quotation-print-area, #quotation-print-area * {
              visibility: visible;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            #quotation-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm !important;
              min-height: 297mm !important;
              display: flex !important;
              flex-direction: column !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              font-family: 'Tahoma', sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .font-calibri {
              font-family: 'Calibri', 'Arial', sans-serif !important;
            }
            .font-verdana {
              font-family: 'Verdana', sans-serif !important;
            }
            .font-tahoma {
              font-family: 'Tahoma', sans-serif !important;
            }
            .print-body {
              flex: 1 1 auto !important;
            }
            @page {
              size: A4 portrait;
              margin: 0;
            }
          }
        `}} />

        {/* ===== BRAND HEADER — matches PDF exactly ===== */}
        <div className="relative w-full overflow-hidden flex-shrink-0" style={{ height: "105px" }}>
          {/* Full-width dark grey background */}
          <div className="absolute inset-0 bg-[#505052]" />

          {/* White logo zone on LEFT — diagonal clip on right edge */}
          <div
            className="absolute top-0 left-0 bg-white flex flex-col items-center justify-center"
            style={{
              width: "240px",
              height: "86px",
              clipPath: "polygon(0 0, 82% 0, 100% 100%, 0 100%)"
            }}
          >
            <img
              src="/assets/images/tejco_sidebar_logo.png"
              alt="Tejco Global LLP"
              style={{ height: "50px", width: "auto", objectFit: "contain", marginLeft: "-28px" }}
            />
            <div
              className="font-verdana uppercase text-[#505052]"
              style={{ fontSize: "7px", letterSpacing: "0.22em", marginLeft: "-28px", marginTop: "3px" }}
            >
              Hair &bull; Skin &bull; Optics
            </div>
          </div>

          {/* Red diagonal slash between white and dark grey */}
          <div
            className="absolute top-0 bg-[#d9232a]"
            style={{
              left: "195px",
              width: "58px",
              height: "86px",
              clipPath: "polygon(38% 0, 100% 0, 62% 100%, 0 100%)"
            }}
          />

          {/* TEJCO GLOBAL LLP — right-aligned in dark grey zone */}
          <div
            className="absolute top-0 right-0 flex items-center justify-end"
            style={{ left: "230px", height: "86px", paddingRight: "22px" }}
          >
            <span
              className="font-calibri font-bold text-white"
              style={{ fontSize: "21px", letterSpacing: "0.06em" }}
            >
              TEJCO GLOBAL LLP
            </span>
          </div>

          {/* Red horizontal stripe — bottom of dark grey area */}
          <div
            className="absolute left-0 right-0 bg-[#d9232a]"
            style={{ top: "86px", height: "10px" }}
          />

          {/* Light grey stripe below red */}
          <div
            className="absolute left-0 right-0 bg-[#e6e6e6]"
            style={{ top: "96px", height: "9px" }}
          />
        </div>

        {/* ===== BODY CONTENT ===== */}
        <div className="print-body" style={{ flex: "1 1 auto", padding: "14px 22px 10px 22px" }}>

          {/* Date and Customer Info */}
          <div className="mb-4 text-sm font-calibri" style={{ marginTop: "10px" }}>
            <div className="font-bold" style={{ marginBottom: "8px" }}>Date: {formatDateWithDots(quotation.date)}</div>
            <div>
              <div className="font-bold" style={{ fontSize: "13px" }}>To</div>
              <div className="font-bold" style={{ fontSize: "13px" }}>{quotation.clientName}</div>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed" style={{ fontSize: "12px" }}>{quotation.billingAddress?.replace(/\|/g, ", ")}</div>
              {quotation.clientMobileNo && <div className="text-slate-700"><strong>Mob No:</strong> {quotation.clientMobileNo}</div>}
            </div>
          </div>

          {/* Subject */}
          <div className="text-center font-bold font-tahoma" style={{ fontSize: "13px", margin: "14px 0" }}>
            Sub : <span className="underline">Quotation for <span className="uppercase">{quotation.subject || "Surgical Products"}</span> .</span>
          </div>

          {/* Salutation & Opening */}
          <div className="font-tahoma" style={{ fontSize: "12px", marginBottom: "12px" }}>
            <p style={{ marginBottom: "4px" }}>Dear Sir,</p>
            <p>Thank you very much for kind courtesy extended. As discussed sending you quote for the same as follows :</p>
          </div>

          {/* Item Boxes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }} className="font-tahoma">
            {quotation.items.map((item, idx) => {
              const discountPercentage = (item as any).discountPercentage || 0
              const discountAmount = (item as any).discountAmount || 0
              const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
              return (
                <div key={item.id || idx} style={{ border: "2px solid #1e293b", borderRadius: "3px", overflow: "hidden", display: "flex", fontSize: "11px" }}>
                  <div style={{ flex: 1, display: "grid", gridTemplateRows: "1fr 1fr 1fr" }}>
                    {/* Row 1 — Product Name */}
                    <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", borderBottom: "2px solid #1e293b" }}>
                      <div style={{ padding: "3px 8px", fontWeight: "bold", background: "#f1f5f9", display: "flex", alignItems: "center", borderRight: "2px solid #1e293b" }}>
                        Product Name : {roman[idx] || String(idx + 1)}
                      </div>
                      <div style={{ padding: "3px 8px", display: "flex", flexDirection: "column", justifyContent: "center", fontWeight: "bold", fontSize: "12px" }}>
                        {item.productName}
                        {item.name && <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "normal", marginTop: "2px" }}>{item.name}</span>}
                      </div>
                    </div>
                    {/* Row 2 — Price */}
                    <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", borderBottom: "2px solid #1e293b" }}>
                      <div style={{ padding: "3px 8px", fontWeight: "bold", background: "#f1f5f9", display: "flex", alignItems: "center", borderRight: "2px solid #1e293b" }}>
                        Price
                      </div>
                      <div style={{ padding: "3px 8px", display: "flex", alignItems: "center", fontWeight: "600" }}>
                        {getPrintCurrencySymbol(quotation.currencyType)} {item.unitPrice.toLocaleString("en-IN")}{quotation.currencyType === "INR" ? " /-" : ""}
                        {discountPercentage > 0 && (
                          <span style={{ color: "#e11d48", marginLeft: "4px", fontWeight: "normal", fontSize: "10px" }}>
                            ({discountPercentage}% Disc. applied: {getPrintCurrencySymbol(quotation.currencyType)} {(item.unitPrice - discountAmount).toLocaleString("en-IN")}{quotation.currencyType === "INR" ? " /-" : ""})
                          </span>
                        )}
                        {quotation.paymentType !== "Foreign" && (
                          <span>&nbsp;+ GST({item.gstRate}%) per pcs</span>
                        )}
                      </div>
                    </div>
                    {/* Row 3 — Qty */}
                    <div style={{ display: "grid", gridTemplateColumns: "125px 1fr" }}>
                      <div style={{ padding: "3px 8px", fontWeight: "bold", background: "#f1f5f9", display: "flex", alignItems: "center", borderRight: "2px solid #1e293b" }}>
                        Qty
                      </div>
                      <div style={{ padding: "3px 8px", display: "flex", alignItems: "center", fontWeight: "bold", fontSize: "12px" }}>
                        {item.quantity} Nos
                      </div>
                    </div>
                  </div>
                  {item.imageUrl && (
                    <div style={{ width: "120px", borderLeft: "2px solid #1e293b", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", background: "white", flexShrink: 0 }}>
                      <img src={getGoogleDrivePreviewUrl(item.imageUrl) || ""} alt={item.productName} style={{ maxHeight: "70px", maxWidth: "100%", objectFit: "contain" }} referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Spacing */}
          <div style={{ height: "20px" }} />

          {/* Terms & Details Table */}
          <table className="font-tahoma" style={{ width: "100%", border: "2px solid #1e293b", borderCollapse: "collapse", fontSize: "12px", marginBottom: "20px" }}>
            <tbody>
              <tr style={{ borderBottom: "2px solid #1e293b" }}>
                <td style={{ width: "33%", padding: "4px 6px", background: "#f1f5f9", borderRight: "2px solid #1e293b" }}>GSTIN No:</td>
                <td style={{ padding: "4px 6px" }}>{quotation.gstinNo || "27AAUFT6646F1ZJ"}</td>
              </tr>
              <tr style={{ borderBottom: "2px solid #1e293b" }}>
                <td style={{ padding: "4px 6px", background: "#f1f5f9", borderRight: "2px solid #1e293b" }}>Validity of Quotation:</td>
                <td style={{ padding: "4px 6px" }}>{quotation.validityDays || 7} Days</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 6px", background: "#f1f5f9", borderRight: "2px solid #1e293b" }}>DELIVERY Time:</td>
                <td style={{ padding: "4px 6px" }}>{quotation.deliveryTime || "10-15 Working Days"}</td>
              </tr>
            </tbody>
          </table>

          {/* Closing Text */}
          <div className="font-tahoma" style={{ fontSize: "11px", marginBottom: "12px" }}>
            <p style={{ marginBottom: "6px" }}>The information on prices given here is for your personal use and should not be disclosed to our competitors.</p>
            <p style={{ fontWeight: "600", fontSize: "12px", marginBottom: "10px" }}>P.O SHOULD BE IN THE NAME OF TEJCO GLOBAL LLP</p>
            <p style={{ marginBottom: "2px" }}>Thanking you and Assuring Our Best Services</p>
            <p style={{ marginBottom: "10px" }}>Yours faithfully</p>
            <div style={{ fontWeight: "bold", fontSize: "12px" }}>
              <div>FOR TEJCO GLOBAL LLP</div>
              <div style={{ color: "#d9232a", fontWeight: "bold", textTransform: "uppercase", marginTop: "4px" }}>{quotation.salesPersonName || "Admin"}</div>
              <div>Cell : {quotation.salesPersonCell || "+91-xxxxxxxxxx"}</div>
            </div>
          </div>

        </div>{/* end body wrapper */}

        {/* ===== BRAND FOOTER — matches PDF exactly ===== */}
        <div className="relative flex-shrink-0" style={{ minHeight: "80px", width: "100%" }}>
          {/* Top separator line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "#cbd5e1" }} />

          {/* Address — left side */}
          <div
            className="font-calibri"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "60%",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              paddingLeft: "22px",
              paddingTop: "8px",
              paddingBottom: "8px",
              fontSize: "9.5px",
              color: "#374151",
              lineHeight: "1.5"
            }}
          >
            <span style={{ color: "#d9232a", fontSize: "12px", lineHeight: 1, marginTop: "1px", flexShrink: 0 }}>📍</span>
            <div>
              <strong>404, Amore Commercial Premises</strong>, Junction of 2<sup>nd</sup> &amp; 4<sup>th</sup> Road Khar West<br />
              Mumbai - 400052 &nbsp;<strong>Tel:-</strong> 022-46730834 &nbsp;<strong>Email:-</strong> tejcoglobal@gmail.com
            </div>
          </div>

          {/* Decorative polygons — bottom-right corner, exact match to PDF */}
          <div style={{ position: "absolute", right: 0, bottom: 0, width: "42%", height: "80px", overflow: "hidden", pointerEvents: "none" }}>
            {/* Outermost — light grey */}
            <div style={{ position: "absolute", right: 0, bottom: 0, width: "100%", height: "52px", background: "#e6e6e6", clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
            {/* Middle — red */}
            <div style={{ position: "absolute", right: 0, bottom: 0, width: "78%", height: "68px", background: "#d9232a", clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
            {/* Inner — dark grey */}
            <div style={{ position: "absolute", right: 0, bottom: 0, width: "56%", height: "80px", background: "#505052", clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
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
