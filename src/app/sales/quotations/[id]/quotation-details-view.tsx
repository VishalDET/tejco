
import * as React from "react"
import { useNavigate } from "react-router-dom"
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
import { PrintLayout, executePrint } from "@/components/common/print"

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
  const navigate = useNavigate()
  const router = useNavigate()
  const [quotation, setQuotation] = React.useState<Quotation>(initialQuotation)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const handleSave = async () => {
    try {
      const updated = await quotationsApi.getById(String(initialQuotation.quotationId))
      setQuotation(updated)
      navigate(0)
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
    navigate("/sales/proforma-invoices?convert=true")
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

  const printRef = React.useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    executePrint(printRef.current, {
      documentTitle: `Quotation - ${quotation.number || quotation.quotationNumber}`,
      pageOrientation: "portrait",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
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
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
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

      {/* ── Hidden Print Area using Common PrintLayout ── */}
      <div id="quotation-print-area" className="hidden">
        <PrintLayout
          containerRef={printRef}
          documentTitle="QUOTATION"
          documentSubtitle={`ESTIMATE • REF: ${quotation.number || quotation.quotationNumber}`}
          footerProps={{
            documentNumber: quotation.number || quotation.quotationNumber,
            showBankDetails: false,
            showComputerGeneratedDisclaimer: false,
            customSignatures: (
              <div className="pt-4 border-t mt-4 font-tahoma text-xs">
                <p className="text-[11px] text-slate-500 mb-1.5">
                  The information on prices given here is for your personal use and should not be disclosed to our competitors.
                </p>
                <p className="font-bold text-xs text-slate-800 mb-2">
                  P.O. SHOULD BE IN THE NAME OF TEJCO GLOBAL LLP
                </p>
                <div className="flex justify-between items-end pt-3">
                  <div>
                    <p className="text-[11px] text-slate-500">Thanking you and Assuring Our Best Services</p>
                    <p className="text-xs font-semibold mt-1">Yours faithfully,</p>
                    <div className="mt-3">
                      <div className="font-bold text-xs text-slate-900">FOR TEJCO GLOBAL LLP</div>
                      <div className="text-[#d9232a] font-bold uppercase text-xs mt-0.5">
                        {quotation.salesPersonName || "Authorized Signatory"}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Cell: {quotation.salesPersonCell || "+91 9820096805"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-10 border-b border-slate-300 w-48 mb-1" />
                    <span className="text-[10px] text-slate-400 font-medium">Authorized Signature</span>
                  </div>
                </div>
              </div>
            ),
          }}
        >
          {/* Date and Customer Info Box */}
          <div className="mb-4 text-xs font-sans border border-slate-300 rounded-md overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-slate-300 bg-white">
              {/* Left Column: Customer Details */}
              <div className="p-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quotation For:</div>
                <div className="font-bold text-sm text-slate-900">{quotation.clientName}</div>
                {quotation.doctorSpeciality && (
                  <div className="text-xs text-slate-600 font-medium">{quotation.doctorSpeciality}</div>
                )}
                {quotation.billingAddress && (
                  <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {quotation.billingAddress.replace(/\|/g, ", ")}
                  </div>
                )}
                {quotation.clientMobileNo && (
                  <div className="text-xs text-slate-700 pt-0.5">
                    <span className="font-semibold text-slate-800">Mob No:</span> {quotation.clientMobileNo}
                  </div>
                )}
                <div className="text-xs text-slate-800 pt-1">
                  <span className="font-bold text-slate-900">Client GSTIN / UIN:</span>{" "}
                  <span className="font-mono font-bold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {quotation.gstinNo?.trim() ? quotation.gstinNo : "URP / Unregistered"}
                  </span>
                </div>
              </div>

              {/* Right Column: Quotation Meta */}
              <div className="p-3 space-y-1.5 bg-slate-50/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Quotation No:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {quotation.number || quotation.quotationNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Date:</span>
                  <span className="font-bold text-slate-900">{formatDateWithDots(quotation.date)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Validity:</span>
                  <span className="font-bold text-slate-900">{quotation.validityDays || 7} Days</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Delivery:</span>
                  <span className="font-semibold text-slate-900">{quotation.deliveryTime || "10-15 Working Days"}</span>
                </div>
                {quotation.salesPersonName && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-600 font-medium">Sales Rep:</span>
                    <span className="font-semibold text-slate-900">{quotation.salesPersonName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="text-center font-semibold text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md mb-3 text-slate-800">
            Subject: <span className="font-bold uppercase tracking-wide text-slate-900">{quotation.subject || "Commercial Quote for Products"}</span>
          </div>

          {/* Salutation & Opening */}
          <div className="text-xs text-slate-700 space-y-1 mb-3">
            <p className="font-semibold">Dear Sir / Madam,</p>
            <p>Thank you very much for kind courtesy extended. As discussed, please find our commercial quote detailed below:</p>
          </div>

          {/* ══════════════ PRODUCTS TABULAR FORMAT ══════════════ */}
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-800 font-semibold border-b border-slate-200">
                  <th className="py-2 px-2 text-center w-10 border-r border-slate-200">#</th>
                  <th className="py-2 px-3 text-left border-r border-slate-200">Item Description</th>
                  <th className="py-2 px-2 text-center w-16 border-r border-slate-200">Qty</th>
                  <th className="py-2 px-2.5 text-right w-28 border-r border-slate-200">
                    <div>Rate ({getPrintCurrencySymbol(quotation.currencyType)})</div>
                    <div className="text-[9px] font-normal text-slate-500">
                      {quotation.paymentType === "Foreign" ? "Standard" : "(Incl. GST)"}
                    </div>
                  </th>
                  {hasDiscounts && (
                    <th className="py-2 px-2 text-right w-20 border-r border-slate-200">Discount</th>
                  )}
                  {quotation.paymentType !== "Foreign" && (
                    <th className="py-2 px-2 text-center w-16 border-r border-slate-200">GST %</th>
                  )}
                  <th className="py-2 px-3 text-right w-32">
                    <div>Total ({getPrintCurrencySymbol(quotation.currencyType)})</div>
                    <div className="text-[9px] font-normal text-slate-500">
                      {quotation.paymentType === "Foreign" ? "" : "(Incl. GST)"}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                {quotation.items.map((item, idx) => {
                  const discountPercentage = (item as any).discountPercentage || 0
                  const discountAmount = (item as any).discountAmount || 0
                  const effectiveUnitPrice = item.unitPrice - discountAmount
                  const lineTotal = effectiveUnitPrice * item.quantity

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-center font-medium text-slate-500 border-r border-slate-100 align-top">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 align-top">
                        <div className="flex items-start gap-2">
                          {item.imageUrl && (
                            <div className="h-10 w-10 rounded border border-slate-200 bg-white p-0.5 shrink-0 overflow-hidden">
                              <img
                                src={getGoogleDrivePreviewUrl(item.imageUrl) || ""}
                                alt={item.productName}
                                className="h-full w-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{item.productName}</div>
                            {item.name && item.name !== item.productName && (
                              <div className="text-[10px] text-slate-500">{item.name}</div>
                            )}
                            {item.sku && (
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">SKU: {item.sku}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-slate-800 border-r border-slate-100 align-top">
                        {item.quantity} Nos
                      </td>
                      <td className="py-2 px-2.5 text-right font-medium text-slate-800 border-r border-slate-100 align-top">
                        <div>
                          {item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {quotation.paymentType !== "Foreign" && (
                          <div className="text-[9px] text-emerald-700 font-medium">Incl. GST</div>
                        )}
                      </td>
                      {hasDiscounts && (
                        <td className="py-2 px-2 text-right border-r border-slate-100 align-top">
                          {discountPercentage > 0 ? (
                            <div>
                              <span className="text-rose-600 font-semibold text-[11px]">
                                {discountPercentage}%
                              </span>
                              <div className="text-[10px] text-slate-500">
                                -{(discountAmount * item.quantity).toLocaleString("en-IN")}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                      {quotation.paymentType !== "Foreign" && (
                        <td className="py-2 px-2 text-center font-medium text-slate-600 border-r border-slate-100 align-top">
                          {item.gstRate}%
                        </td>
                      )}
                      <td className="py-2 px-3 text-right font-bold text-slate-900 align-top">
                        <div>
                          {lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {quotation.paymentType !== "Foreign" && (
                          <div className="text-[9px] text-slate-400 font-normal">Incl. GST</div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Totals Summary Footer Rows inside Table */}
              <tfoot className="bg-slate-50/70 text-xs font-semibold text-slate-800">
                <tr>
                  <td
                    colSpan={2 + (hasDiscounts ? 1 : 0) + (quotation.paymentType !== "Foreign" ? 1 : 0)}
                    rowSpan={hasDiscounts ? (quotation.paymentType !== "Foreign" ? 5 : 3) : (quotation.paymentType !== "Foreign" ? 4 : 2)}
                    className="p-3 border-r border-slate-200 align-top bg-white"
                  >
                    <div className="space-y-1 text-slate-700">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                        Commercial Terms:
                      </div>
                      <div className="text-[11px] grid grid-cols-[110px_1fr] gap-1">
                        <span className="text-slate-500">Tax Clause:</span>
                        <span className="font-semibold text-emerald-800">
                          {quotation.paymentType === "Foreign" ? "Exempt / Export" : "All quoted prices include GST"}
                        </span>
                        <span className="text-slate-500">Validity:</span>
                        <span className="font-semibold text-slate-900">{quotation.validityDays || 7} Days</span>
                        <span className="text-slate-500">Delivery Time:</span>
                        <span className="font-semibold text-slate-900">{quotation.deliveryTime || "10-15 Working Days"}</span>
                        <span className="text-slate-500">Client GSTIN:</span>
                        <span className="font-mono font-bold text-slate-900">{quotation.gstinNo || "Unregistered / URP"}</span>
                        <span className="text-slate-500">Payment Type:</span>
                        <span className="font-semibold text-slate-900">{quotation.paymentType || "Domestic"}</span>
                      </div>
                    </div>
                  </td>
                  <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200">
                    Gross Total (Incl. GST):
                  </td>
                  <td className="py-1.5 px-3 text-right font-medium text-slate-800">
                    {getPrintCurrencySymbol(quotation.currencyType)} {originalSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {hasDiscounts && (
                  <tr>
                    <td colSpan={2} className="py-1.5 px-3 text-right text-rose-600 border-r border-slate-200">
                      Total Discount:
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-rose-600">
                      - {getPrintCurrencySymbol(quotation.currencyType)} {totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {quotation.paymentType !== "Foreign" && (
                  <>
                    <tr>
                      <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200 text-[11px]">
                        Taxable Value (Excl. GST):
                      </td>
                      <td className="py-1.5 px-3 text-right font-normal text-slate-700 text-[11px]">
                        {getPrintCurrencySymbol(quotation.currencyType)} {quotation.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200 text-[11px]">
                        GST Amount (Included):
                      </td>
                      <td className="py-1.5 px-3 text-right font-normal text-amber-700 text-[11px]">
                        {getPrintCurrencySymbol(quotation.currencyType)} {quotation.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </>
                )}

                <tr className="border-t border-slate-300 bg-slate-100/90 text-slate-900">
                  <td colSpan={2} className="py-2 px-3 text-right font-bold text-sm border-r border-slate-200">
                    Net Payable (Incl. GST):
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-sm text-slate-950">
                    {getPrintCurrencySymbol(quotation.currencyType)} {quotation.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </PrintLayout>
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
