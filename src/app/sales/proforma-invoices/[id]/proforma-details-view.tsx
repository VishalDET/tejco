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
  Calculator,
  RefreshCw
} from "lucide-react"
import { SalesDocumentStatus } from "@/app/sales/types"
import { ProformaInvoice } from "@/app/sales/proforma-invoices/types"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProformaFormDialog } from "../proforma-form-dialog"
import { proformaApi, quotationsApi, productsApi } from "@/lib/api"
import { toast } from "sonner"

interface ProformaDetailsViewProps {
  proforma: ProformaInvoice
}

const COMPANY = {
  name: "TEJCO GLOBAL LLP",
  gst: "27AAUFT6646F1ZJ",
  forLine: "FOR TEJCO GLOBAL LLP",
  bankDetails: [
    "INR BANK DETAILS",
    "Name of the Company: TEJCO GLOBAL LLP",
    "Branch Name : Bandra (West), Mumbai \u2013 400 050.",
    "Bank Account No : 012800000002727",
    "Type of Account : Current Account",
    "IFSC Code : IOBA0000128",
  ],
}

const getCurrencySymbol = (currency?: string) => {
  if (!currency) return "\u20B9"
  switch (currency.toUpperCase()) {
    case "USD": return "$"
    case "EUR": return "\u20AC"
    case "GBP": return "\u00A3"
    case "INR": return "\u20B9"
    default: return currency
  }
}

export function ProformaDetailsView({ proforma: initialProforma }: ProformaDetailsViewProps) {
  const router = useRouter()
  const [proforma, setProforma] = React.useState<ProformaInvoice>(initialProforma)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isConverting, setIsConverting] = React.useState(false)
  const [linkedQuotationNumber, setLinkedQuotationNumber] = React.useState<string | null>(null)
  const originalSubtotal = (proforma.items || []).reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const totalDiscount = (proforma.items || []).reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)
  const hasDiscounts = totalDiscount > 0

  // Fetch linked quotation number when sourceQuotationId is present
  React.useEffect(() => {
    const fetchLinkedQuotation = async () => {
      if (!proforma.sourceQuotationId) return
      try {
        const q = await quotationsApi.getById(String(proforma.sourceQuotationId))
        setLinkedQuotationNumber(q.number || `QT-${proforma.sourceQuotationId}`)
      } catch {
        setLinkedQuotationNumber(`QT-${proforma.sourceQuotationId}`)
      }
    }
    fetchLinkedQuotation()
  }, [proforma.sourceQuotationId])

  const enrichProformaWithGst = async (targetProforma: ProformaInvoice): Promise<ProformaInvoice> => {
    if (!targetProforma.items || targetProforma.items.length === 0) return targetProforma

    try {
      const updatedItems = await Promise.all(
        targetProforma.items.map(async (item) => {
          if (!item.productId) return item
          try {
            const prodRes = await productsApi.getById(item.productId)
            const product = prodRes?.data || prodRes

            let gstRate = item.gstRate
            if (product) {
              if (product.variants && Array.isArray(product.variants)) {
                // Robust matching:
                // 1. Try SKU matching
                // 2. Try variantName matching against item.name
                // 3. Fall back to the first variant
                const variant = product.variants.find((v: any) => {
                  const sku = `${product.baseSKU || ""}${v.skuSuffix || ""}`
                  return sku.toLowerCase() === item.sku.toLowerCase() ||
                    v.variantName?.toLowerCase() === item.name?.toLowerCase()
                }) || product.variants[0]

                if (variant) {
                  gstRate = variant.gstPercentage ?? product.gstPercentage ?? gstRate
                } else {
                  gstRate = product.gstPercentage ?? gstRate
                }
              } else {
                gstRate = product.gstPercentage ?? gstRate
              }
            }

            return {
              ...item,
              gstRate: gstRate || 0
            }
          } catch (err) {
            console.error(`Failed to fetch GST rate for product ID ${item.productId}:`, err)
            return item
          }
        })
      )

      const isForeign = targetProforma.paymentType === "Foreign"
      const subtotal = updatedItems.reduce((acc, item) => {
        const netItemTotal = (item as any).discountedUnitPrice * item.quantity
        const itemBase = isForeign ? netItemTotal : (netItemTotal / (1 + (item.gstRate || 0) / 100))
        return acc + itemBase
      }, 0)

      const calculatedTotalAmount = updatedItems.reduce((acc, item) => acc + ((item as any).discountedUnitPrice * item.quantity), 0)
      const taxAmount = isForeign ? 0 : (calculatedTotalAmount - subtotal)

      return {
        ...targetProforma,
        items: updatedItems,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount + (targetProforma.freight || 0)
      }
    } catch (err) {
      console.error("Failed to update GST rates dynamically:", err)
      return targetProforma
    }
  }

  // Fetch correct GST rates on mount or when initialProforma items/settings change
  React.useEffect(() => {
    enrichProformaWithGst(initialProforma).then(setProforma)
  }, [initialProforma.items, initialProforma.paymentType, initialProforma.freight])

  const handleConvertToOrder = async () => {
    if (proforma.status?.toLowerCase() === "converted to sales order") return
    setIsConverting(true)
    try {
      const payload = {
        proformaInvoiceId: proforma.proformaId,
        piNo: proforma.proformaNumber || "",
        piDate: new Date(proforma.date || new Date()).toISOString(),
        billingName: proforma.clientName || "",
        billingAddress: proforma.billingAddress || "",
        freight: proforma.freight || 0,
        totalAmount: proforma.totalAmount || 0,
        deliveryTerms: proforma.deliveryTerms || proforma.deliveryTime || "10-15 Working Days",
        paymentTerms: proforma.paymentTerms || proforma.notes || "",
        salesPersonName: proforma.salesPersonName || "",
        salesPersonCell: proforma.salesPersonCell || "",
        salesPersonId: proforma.salesPersonId ? String(proforma.salesPersonId) : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "Converted to Sales Order",
        paymentType: proforma.paymentType || "Domestic",
        currencyType: proforma.currencyType || "INR",
        items: (proforma.items || []).map(item => ({
          proformaInvoiceItemId: isNaN(parseInt(item.id)) ? 0 : parseInt(item.id),
          proformaInvoiceId: proforma.proformaId,
          productId: isNaN(parseInt(item.productId)) ? 0 : parseInt(item.productId),
          productName: item.productName || "",
          imageUrl: (item as any).imageUrl || "",
          quantity: item.quantity || 0,
          rate: item.unitPrice || 0,
          discountPercentage: (item as any).discountPercentage || 0,
          discountAmount: (item as any).discountAmount || 0,
          total: item.total || 0,
        })),
      }
      await proformaApi.update(String(proforma.proformaId), payload)
      toast.success("Proforma marked as converted to Sales Order")
      setProforma(prev => ({ ...prev, status: "Converted to Sales Order" }))
    } catch (err) {
      console.error("Failed to update proforma status:", err)
    } finally {
      setIsConverting(false)
    }

    localStorage.setItem("convert_source_data", JSON.stringify({
      ...proforma,
      sourceId: proforma.id,
      proformaId: proforma.proformaId,
      quotationId: proforma.sourceQuotationId ? parseInt(String(proforma.sourceQuotationId)) : 0,
      number: "",
      status: "Pending",
      paymentStatus: "Unpaid",
      date: new Date().toISOString().split("T")[0],
    }))
    router.push("/sales/orders?convert=true")
  }

  const handleSave = async () => {
    try {
      const updated = await proformaApi.getById(String(initialProforma.proformaId))
      const enriched = await enrichProformaWithGst(updated)
      setProforma(enriched)
      router.refresh()
    } catch (err) {
      console.error("Failed to refresh proforma after edit:", err)
    }
  }

  const renderAddressLines = (addr: string) => {
    if (!addr) return <span className="text-slate-400 italic">Not provided</span>
    const lines = addr.split("|").map(s => s.trim()).filter(Boolean)
    if (lines.length === 0) return <span className="text-slate-400 italic">Not provided</span>
    return (
      <div className="flex flex-col gap-0.5">
        {lines.map((line, idx) => (
          <span key={idx}>{line}</span>
        ))}
      </div>
    )
  }

  const renderAddressLinesPrint = (addr: string) => {
    if (!addr) return null
    const lines = addr.split("|").map((s) => s.trim()).filter(Boolean)
    return lines.map((line, idx) => <div key={idx}>{line}</div>)
  }

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
      case "Issued": return <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Issued &amp; Pending</Badge>
      case "Converted to Sales Order": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Converted to Order</Badge>
      case "Cancelled": return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SCREEN VIEW â€” Normal dashboard card layout
          Hidden during print via CSS: .screen-only { display: none }
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="screen-only flex flex-col gap-6">
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
              <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Generated on {new Date(proforma.date).toLocaleDateString("en-GB")}
                <Separator orientation="vertical" className="h-3 mx-1" />
                <span className="text-slate-900 font-bold">{proforma.clientName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 border-slate-200 shadow-sm" onClick={() => {
              const el = document.getElementById('proforma-print-area')
              if (el) {
                el.style.display = 'flex'
                el.style.flexDirection = 'column'
                window.onafterprint = () => { el.style.display = 'none' }
              }
              window.print()
            }}>
              <Printer className="h-4 w-4 text-slate-600" /> Print PI
            </Button>
            {/* <Button variant="outline" className="gap-2 border-slate-200 shadow-sm">
              <FileDown className="h-4 w-4 text-slate-600" /> Download
            </Button> */}
            <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md" onClick={() => setIsDialogOpen(true)}>
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
                      <TableHead className="text-right font-bold text-slate-700">Disc Amt</TableHead>
                      <TableHead className="text-center font-bold text-slate-700">GST</TableHead>
                      <TableHead className="text-right pr-6 font-bold text-slate-700">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proforma.items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img src={getGoogleDrivePreviewUrl(item.imageUrl) || ""} alt={item.productName} className="w-8 h-8 rounded object-cover border border-slate-100" referrerPolicy="no-referrer" />
                            )}
                            <div>
                              <div className="font-bold text-slate-800">{item.productName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-400">{item.sku}</TableCell>
                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{getCurrencySymbol(proforma.currencyType)}{item.unitPrice.toLocaleString()}</div>
                        </TableCell>
                        <TableCell className="text-right text-slate-500">
                          {item.discountAmount && item.discountAmount > 0 ? (
                            <span className="text-rose-600 font-medium">
                              -{getCurrencySymbol(proforma.currencyType)}{(item.discountAmount * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : "\u2014"}
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-500 bg-slate-50/50">{item.gstRate}%</TableCell>
                        <TableCell className="text-right pr-6 font-extrabold text-slate-900">{getCurrencySymbol(proforma.currencyType)}{(item.unitPrice * item.quantity).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-8 flex justify-end bg-slate-50/20 border-t border-slate-50 font-sans">
                  <div className="w-96 space-y-4">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-slate-500 font-medium">{proforma.paymentType === "Foreign" ? "Gross Total" : "Gross Total (Incl. GST)"}</span>
                      <span className="font-bold text-slate-800 text-lg">{getCurrencySymbol(proforma.currencyType)}{originalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {proforma.paymentType !== "Foreign" && (
                      <>
                        <Separator className="my-1.5 opacity-50" />

                        <div className="flex justify-between text-sm items-center">
                          <span className="text-slate-500 font-medium">Total GST (Included)</span>
                          <span className="text-emerald-600 font-extrabold text-lg">{getCurrencySymbol(proforma.currencyType)}{proforma.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    )}
                    {hasDiscounts && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-500 font-medium">Total Discount (Deducted)</span>
                        <span className="text-rose-600 font-bold text-lg">- {getCurrencySymbol(proforma.currencyType)}{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    {proforma.freight !== undefined && proforma.freight > 0 && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-500 font-medium">Freight Charges</span>
                        <span className="font-bold text-slate-800 text-lg">+ {getCurrencySymbol(proforma.currencyType)}{proforma.freight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <Separator className="bg-slate-200" />
                    <div className="flex justify-between items-baseline pt-2">
                      <span className="text-slate-900 font-extrabold text-lg">Total Payable</span>
                      <div className="text-right">
                        <span className="text-slate-900 text-4xl font-black tracking-tighter">{getCurrencySymbol(proforma.currencyType)}{proforma.totalAmount.toLocaleString()}</span>
                        {proforma.paymentType !== "Foreign" && (
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Inclusive of all taxes</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-md font-bold text-slate-800">Notes &amp; Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl">
                  <p className="text-sm leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                    {proforma.paymentTerms || proforma.notes || "Standard payment terms apply for this proforma invoice."}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Digital Copy</div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> System Generated</div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  {proforma.status?.toLowerCase() !== "converted to sales order" && (
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 shadow-lg shadow-emerald-100"
                      onClick={handleConvertToOrder}
                      disabled={isConverting}
                    >
                      {isConverting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Convert to Final Order
                        </>
                      )}
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
                <CardTitle className="text-lg">Logistics &amp; Billing</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client Account</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-1">{proforma.clientName}</span>
                  </div>
                  {proforma.clientMobileNo && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Mobile</span>
                      <span className="text-xs font-semibold text-slate-600 mt-1">{proforma.clientMobileNo}</span>
                    </div>
                  )}
                  {proforma.gstinNo && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">GSTIN</span>
                      <span className="text-xs font-mono font-bold text-slate-600 mt-1">{proforma.gstinNo}</span>
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-50" />

                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Delivery Terms</span>
                    <span className="text-xs font-semibold text-slate-700 mt-1">{proforma.deliveryTerms || proforma.deliveryTime || "10-15 Working Days"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment Terms</span>
                    <span className="text-xs font-semibold text-slate-700 mt-1">{proforma.paymentTerms || proforma.notes || "N/A"}</span>
                  </div>
                </div>

                <Separator className="bg-slate-50" />

                <div className="space-y-4">
                  <div className="flex flex-col">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Shipping Destination</Label>
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-700 leading-relaxed italic">
                      {renderAddressLines(proforma.shippingAddress)}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Billing Address</Label>
                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-700 leading-relaxed italic">
                      {renderAddressLines(proforma.billingAddress)}
                    </div>
                  </div>
                </div>

                {linkedQuotationNumber && (
                  <>
                    <Separator className="bg-slate-50" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Linked Quotation</span>
                      <button
                        onClick={() => router.push(`/sales/quotations/${proforma.sourceQuotationId}`)}
                        className="text-sm font-bold text-primary hover:underline mt-1 text-left"
                      >
                        {linkedQuotationNumber}
                      </button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {proforma.salesPersonName && (
              <Card className="shadow-md border-slate-200">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Sales Representative
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</span>
                    <span className="text-sm font-bold text-slate-800 mt-1">{proforma.salesPersonName}</span>
                  </div>
                  {proforma.salesPersonCell && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Cell</span>
                      <span className="text-xs font-semibold text-slate-600 mt-1">{proforma.salesPersonCell}</span>
                    </div>
                  )}
                  {proforma.salesPersonId && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sales Person ID</span>
                      <span className="text-xs font-mono text-slate-500 mt-1">#{proforma.salesPersonId}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ Hidden Print Area â€” matches Proforma-Invoice.pdf exactly â”€â”€â”€ */}
      <div
        id="proforma-print-area"
        className="hidden bg-white text-black"
        style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", fontFamily: "Arial, sans-serif", fontSize: "12px" }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * { visibility: hidden; }
            #proforma-print-area, #proforma-print-area * {
              visibility: visible;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            #proforma-print-area {
              position: absolute;
              left: 0; top: 0;
              width: 210mm !important;
              min-height: 297mm !important;
              display: flex !important;
              flex-direction: column !important;
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page { size: A4 portrait; margin: 0; }
          }
        `}} />

        {/* â•â• HEADER â€” matches PDF: white logo left, red slash, dark grey right â•â• */}
        <div style={{ position: "relative", width: "100%", height: "105px", overflow: "hidden", flexShrink: 0, background: "#505052" }}>
          {/* White logo zone â€” diagonal clip */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: "240px", height: "86px",
            background: "white",
            clipPath: "polygon(0 0, 82% 0, 100% 100%, 0 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
          }}>
            <img
              src="/assets/images/tejco_sidebar_logo.png"
              alt="Tejco"
              style={{ height: "50px", width: "auto", objectFit: "contain", marginLeft: "-28px" }}
            />
            <div style={{ fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#505052", marginLeft: "-28px", marginTop: "3px", fontFamily: "Verdana, sans-serif" }}>
              Hair &bull; Skin &bull; Optics
            </div>
          </div>

          {/* Red diagonal slash */}
          <div style={{
            position: "absolute", top: 0, left: "195px",
            width: "58px", height: "86px",
            background: "#d9232a",
            clipPath: "polygon(38% 0, 100% 0, 62% 100%, 0 100%)"
          }} />

          {/* Company name â€” right of dark grey */}
          <div style={{
            position: "absolute", top: 0, right: 0, left: "230px", height: "86px",
            display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "22px"
          }}>
            <span style={{ color: "white", fontSize: "21px", fontWeight: "bold", letterSpacing: "0.06em", fontFamily: "Calibri, Arial, sans-serif" }}>
              TEJCO GLOBAL LLP
            </span>
          </div>

          {/* Red stripe */}
          <div style={{ position: "absolute", top: "86px", left: 0, right: 0, height: "10px", background: "#d9232a" }} />
          {/* Light grey stripe */}
          <div style={{ position: "absolute", top: "96px", left: 0, right: 0, height: "9px", background: "#e6e6e6" }} />
        </div>

        {/* â•â• BODY â•â• */}
        <div style={{ flex: "1 1 auto", padding: "0 0 16px 0" }}>

          {/* Title rows */}
          <div style={{ borderBottom: "1px solid #D1D5DB" }}>
            <div style={{ textAlign: "center", padding: "6px", fontWeight: "bold", fontSize: "13px", background: "#F9FAFB", borderBottom: "1px solid #D1D5DB" }}>
              PROFORMA INVOICE
            </div>
            <div style={{ textAlign: "center", padding: "4px", fontSize: "11px", color: "#374151" }}>
              GST NO :- {COMPANY.gst}
            </div>
          </div>

          {/* PI No + Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #D1D5DB" }}>
            <div style={{ padding: "8px 12px", borderRight: "1px solid #D1D5DB", display: "flex", gap: "8px", alignItems: "center" }}>
              <strong>P.I No</strong>
              <span style={{ marginLeft: "8px" }}>{proforma.number}</span>
            </div>
            <div style={{ padding: "8px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
              <strong>DATE</strong>
              <span style={{ marginLeft: "8px" }}>
                {new Date(proforma.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Billing Name & Address */}
          <div style={{ borderBottom: "1px solid #D1D5DB" }}>
            <div style={{ padding: "6px 12px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
              <strong>Billing Name &amp; Address</strong>
            </div>
            <div style={{ padding: "10px 16px", minHeight: "80px", lineHeight: 1.6, fontSize: "12px" }}>
              <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>{proforma.clientName}</div>
              {renderAddressLinesPrint(proforma.billingAddress)}
              {proforma.clientMobileNo && <div style={{ marginTop: "4px" }}>Mob: {proforma.clientMobileNo}</div>}
              {proforma.gstinNo && <div style={{ marginTop: "4px", fontWeight: 600 }}>GSTIN: {proforma.gstinNo}</div>}
            </div>
          </div>

          {/* Items Table */}
          <div style={{ borderBottom: "1px solid #D1D5DB" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "left", width: "35%" }}>Products</th>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "20%" }}>Images</th>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "10%" }}>Qty</th>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "17.5%" }}>
                    Rate ({proforma.currencyType === "INR" ? "Rs" : getCurrencySymbol(proforma.currencyType)})
                  </th>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "17.5%" }}>
                    Total ({proforma.currencyType === "INR" ? "Rs" : getCurrencySymbol(proforma.currencyType)})
                  </th>
                </tr>
              </thead>
              <tbody>
                {proforma.items.map((item) => {
                  const discountedPrice = item.unitPrice - ((item as any).discountAmount || 0)
                  const lineTotal = discountedPrice * item.quantity
                  return (
                    <tr key={item.id}>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 600 }}>{item.productName}</div>
                        {item.name && item.name !== item.productName && (
                          <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "2px" }}>{item.name}</div>
                        )}
                        {(item as any).discountPercentage > 0 && (
                          <div style={{ fontSize: "10px", color: "#DC2626", marginTop: "2px" }}>
                            Disc: {(item as any).discountPercentage}% ({getCurrencySymbol(proforma.currencyType)}{(item as any).discountAmount?.toLocaleString()}/pc)
                          </div>
                        )}
                        {proforma.paymentType !== "Foreign" && (
                          <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "2px" }}>GST: {item.gstRate}%</div>
                        )}
                      </td>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "center", verticalAlign: "middle" }}>
                        {item.imageUrl
                          ? <img src={getGoogleDrivePreviewUrl(item.imageUrl) || ""} alt={item.productName} style={{ width: "48px", height: "48px", objectFit: "contain", margin: "0 auto" }} referrerPolicy="no-referrer" />
                          : <span style={{ color: "#CBD5E1", fontSize: "10px" }}>\u2014</span>
                        }
                      </td>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "center", verticalAlign: "middle" }}>{item.quantity}</td>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "right", verticalAlign: "middle" }}>
                        {getCurrencySymbol(proforma.currencyType)}{item.unitPrice.toLocaleString()}
                        {(item as any).discountAmount > 0 && (
                          <div style={{ fontSize: "10px", color: "#DC2626" }}>
                            Net: {getCurrencySymbol(proforma.currencyType)}{discountedPrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "right", verticalAlign: "middle", fontWeight: "bold" }}>
                        {getCurrencySymbol(proforma.currencyType)}{lineTotal.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}

                {/* Filler rows if few items */}
                {proforma.items.length < 2 && Array.from({ length: 2 - proforma.items.length }).map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    {[0, 1, 2, 3, 4].map((c) => (
                      <td key={c} style={{ border: "1px solid #D1D5DB", padding: "20px 10px" }}>&nbsp;</td>
                    ))}
                  </tr>
                ))}

                {/* Freight row */}
                <tr style={{ background: "#F9FAFB" }}>
                  <td colSpan={4} style={{ border: "1px solid #D1D5DB", padding: "8px 10px", fontWeight: "bold" }}>FREIGHT</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "right", fontWeight: "bold" }}>
                    {proforma.freight && proforma.freight > 0
                      ? `${getCurrencySymbol(proforma.currencyType)}${proforma.freight.toLocaleString()}`
                      : "-"}
                  </td>
                </tr>

                {/* Total row */}
                <tr style={{ background: "#F3F4F6" }}>
                  <td colSpan={4} style={{ border: "1px solid #D1D5DB", padding: "8px 10px", fontWeight: "bold", fontSize: "12px" }}>TOTAL</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "right", fontWeight: "bold", fontSize: "13px" }}>
                    {getCurrencySymbol(proforma.currencyType)}{proforma.totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Terms */}
          <div style={{ borderBottom: "1px solid #D1D5DB", padding: "6px 12px" }}>
            <strong>Payment Terms: </strong>
            <span>{proforma.paymentTerms || proforma.notes || "100% Advance"}</span>
          </div>

          {/* Delivery Terms */}
          <div style={{ borderBottom: "1px solid #D1D5DB", padding: "6px 12px" }}>
            <strong>DELIVERY TERMS :- </strong>
            <span>{proforma.deliveryTerms || proforma.deliveryTime || "Immediate Delivery"}</span>
          </div>

          {/* Sales Rep + Bank Details â€” 2-column footer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid #374151", minHeight: "120px" }}>
            {/* Left: Sales Rep */}
            <div style={{ borderRight: "1px solid #D1D5DB", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontWeight: "bold" }}>{COMPANY.forLine}</div>
              {proforma.salesPersonName && (
                <div style={{ marginTop: "4px" }}>
                  <div style={{ fontWeight: 600 }}>
                    {proforma.salesPersonName}{proforma.salesPersonCell && `: ${proforma.salesPersonCell}`}
                  </div>
                </div>
              )}
              <div style={{ marginTop: "auto", color: "#2563EB", textDecoration: "underline", fontSize: "11px" }}>
                AUTHORISED SIGNATORY
              </div>
            </div>

            {/* Right: Bank Details */}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ color: "#2563EB", textDecoration: "underline", fontSize: "11px", marginBottom: "6px" }}>Bank Details</div>
              {COMPANY.bankDetails.map((line, idx) => (
                <div key={idx} style={{ fontSize: "11px", lineHeight: 1.6, color: "#374151", fontWeight: idx === 0 ? "bold" : "normal" }}>
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div style={{ padding: "10px 16px", textAlign: "center" }}>
            <p style={{ fontSize: "9px", color: "#9CA3AF", letterSpacing: "1px" }}>
              This is a computer-generated document. No signature required.
            </p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Global print CSS â”€â”€ */}
      <style>{`
        @media screen {
          .screen-only { display: flex; }
          #proforma-print-area { display: none; }
        }
      `}</style>

      <ProformaFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        proforma={proforma}
        onSave={handleSave}
      />
    </>
  )
}
