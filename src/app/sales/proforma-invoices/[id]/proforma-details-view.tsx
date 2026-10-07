"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"
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
  RefreshCw,
  Mail
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProformaFormDialog } from "../proforma-form-dialog"
import { getAllowedNextStatuses } from "../page"
import { proformaApi, quotationsApi, clientsApi, productsApi } from "@/lib/api"
import { PrintLayout, executePrint, DEFAULT_TEJCO_COMPANY } from "@/components/common/print"
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

export function ProformaDetailsView({ proforma: initialProforma }: ProformaDetailsViewProps) {
  const navigate = useNavigate()
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

            const isForeign = targetProforma.paymentType === "Foreign"
            const finalGst = isForeign ? 0 : (gstRate || 0)
            const basePrice = finalGst > 0 ? (item.unitPrice || 0) / (1 + finalGst / 100) : (item.unitPrice || 0)

            const discPct = item.discountPercentage || 0
            let discAmt = item.discountAmount || 0
            if (discAmt === 0 && discPct > 0) {
              discAmt = parseFloat((basePrice * (discPct / 100)).toFixed(2))
            }

            const discountedBase = Math.max(0, basePrice - discAmt)
            const finalUnitPrice = finalGst > 0 ? discountedBase * (1 + finalGst / 100) : discountedBase
            const itemTotal = parseFloat((finalUnitPrice * item.quantity).toFixed(2))

            return {
              ...item,
              gstRate: gstRate || 0,
              discountAmount: discAmt,
              discountedUnitPrice: finalUnitPrice,
              total: itemTotal
            }
          } catch (err) {
            console.error(`Failed to fetch GST rate for product ID ${item.productId}:`, err)
            return item
          }
        })
      )

      const isForeign = targetProforma.paymentType === "Foreign"
      const subtotal = updatedItems.reduce((acc, item) => {
        const price = item.unitPrice || 0
        const gstRate = isForeign ? 0 : (item.gstRate || 0)
        const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price
        const discAmt = (item as any).discountAmount || 0
        const discountedBase = Math.max(0, basePrice - discAmt)
        return acc + (discountedBase * item.quantity)
      }, 0)

      const taxAmount = isForeign ? 0 : updatedItems.reduce((acc, item) => {
        const price = item.unitPrice || 0
        const gstRate = item.gstRate || 0
        const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price
        const discAmt = (item as any).discountAmount || 0
        const discountedBase = Math.max(0, basePrice - discAmt)
        return acc + (discountedBase * (gstRate / 100) * item.quantity)
      }, 0)

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

  const printRef = React.useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    executePrint(printRef.current, {
      documentTitle: `Proforma Invoice - ${proforma.number || proforma.proformaNumber}`,
      pageOrientation: "portrait",
    })
  }

  const [isSendingEmail, setIsSendingEmail] = React.useState(false)

  const handleSendEmail = async () => {
    try {
      setIsSendingEmail(true)
      await proformaApi.sendEmail(proforma.proformaId || proforma.id)
      toast.success(`Email sent successfully for Proforma Invoice ${proforma.number || proforma.proformaNumber}`)
    } catch (err: any) {
      console.error("Failed to send email:", err)
      toast.error(err?.message || "Failed to send email.")
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleConvertToOrder = async () => {
    if (proforma.status?.toLowerCase() === "converted to sales order") return
    setIsConverting(true)
    try {
      let resolvedClientId =
        proforma.clientId && !isNaN(Number(proforma.clientId)) && Number(proforma.clientId) > 0
          ? Number(proforma.clientId)
          : 0

      let resolvedClientName = proforma.clientName || ""

      // If clientId missing, search client by name using searchBy="ClientName"
      const targetClientName = (resolvedClientName || (proforma as any)?.billingName || "").trim()
      if (!resolvedClientId && targetClientName) {
        const searchTerms = [
          targetClientName,
          targetClientName.split(/[-–—(]/)[0].trim(),
          targetClientName.split(/\s+/).slice(0, 3).join(" ").trim(),
        ].filter(Boolean)

        for (const term of searchTerms) {
          if (resolvedClientId) break
          if (!term || term.length < 2) continue
          try {
            const clientRes = await clientsApi.getAll({
              search: term,
              searchBy: "ClientName",
              pageSize: 20,
            })
            const list = clientRes.clients || []
            const lowerTarget = targetClientName.toLowerCase()
            const match =
              list.find(c => c.name?.trim().toLowerCase() === lowerTarget) ||
              list.find(c => lowerTarget.includes(c.name?.trim().toLowerCase())) ||
              list.find(c => c.name?.trim().toLowerCase().includes(term.toLowerCase())) ||
              (list.length === 1 ? list[0] : null)

            if (match && match.id && !isNaN(Number(match.id)) && Number(match.id) > 0) {
              resolvedClientId = Number(match.id)
              resolvedClientName = match.name || resolvedClientName
              break
            }
          } catch (e) {
            console.error("Failed to query clients API with searchBy=ClientName:", e)
          }
        }
      }

      // Check linked quotation if any
      const quoteId = proforma.sourceQuotationId || (proforma as any).linkedQuotationId
      if (!resolvedClientId && quoteId) {
        try {
          const quote = await quotationsApi.getById(String(quoteId))
          if (quote?.clientId && !isNaN(Number(quote.clientId)) && Number(quote.clientId) > 0) {
            resolvedClientId = Number(quote.clientId)
            if (quote.clientName) resolvedClientName = quote.clientName
          }
        } catch (e) {
          console.error("Failed to fetch linked quotation client ID:", e)
        }
      }

      const salesPersonIdNum = proforma.salesPersonId && !isNaN(Number(proforma.salesPersonId))
        ? Number(proforma.salesPersonId)
        : 0

      const payload = {
        clientId: resolvedClientId,
        ClientId: resolvedClientId,
        salesPersonId: salesPersonIdNum,
        SalesPersonId: salesPersonIdNum,
        targetDeliveryDate: proforma.validUntil ? new Date(proforma.validUntil).toISOString() : new Date().toISOString(),
        orderNotes: proforma.notes || proforma.paymentTerms || proforma.subject || "",
      }

      try {
        await proformaApi.convertToSalesOrder(proforma.proformaId, payload)
        toast.success("Proforma marked as converted to Sales Order")
        setProforma(prev => ({
          ...prev,
          clientId: resolvedClientId ? String(resolvedClientId) : prev.clientId,
          clientName: resolvedClientName || prev.clientName,
          status: "Converted to Sales Order",
        }))
      } catch (apiErr: any) {
        console.error("convertToSalesOrder API warning:", apiErr)
      }

      if (!resolvedClientId) {
        toast.info("Please confirm or select the client on the Sales Order form.")
      }

      localStorage.setItem("convert_source_data", JSON.stringify({
        ...proforma,
        clientId: resolvedClientId ? String(resolvedClientId) : "",
        clientName: resolvedClientName || proforma.clientName || "",
        sourceId: proforma.id,
        proformaId: proforma.proformaId,
        quotationId: quoteId ? parseInt(String(quoteId)) : 0,
        number: "",
        status: "Pending",
        paymentStatus: "Unpaid",
        date: new Date().toISOString().split("T")[0],
      }))
      navigate("/sales/orders?convert=true")
    } catch (err: any) {
      console.error("Failed to convert proforma to sales order:", err)
      toast.error(err?.message || "Failed to convert proforma to sales order.")
    } finally {
      setIsConverting(false)
    }
  }

  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus || proforma.status?.toLowerCase() === newStatus.toLowerCase()) return
    setIsUpdatingStatus(true)
    try {
      await proformaApi.updateStatus(proforma.proformaId || proforma.id, newStatus)
      setProforma((prev) => ({ ...prev, status: newStatus as SalesDocumentStatus }))
      toast.success(`Status updated to "${newStatus}" successfully.`)
    } catch (err: any) {
      console.error("Failed to update status:", err)
      toast.error(err?.message || "Failed to update proforma status.")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleSave = async () => {
    try {
      const updated = await proformaApi.getById(String(initialProforma.proformaId))
      const enriched = await enrichProformaWithGst(updated)
      setProforma(enriched)
      navigate(0)
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

  const getStatusIcon = (status: SalesDocumentStatus | string) => {
    const norm = String(status || "").toLowerCase().trim()
    switch (norm) {
      case "draft": return <Clock className="h-5 w-5 text-slate-400" />
      case "sent to client": return <Mail className="h-5 w-5 text-sky-500" />
      case "accepted": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "rejected": return <Circle className="h-5 w-5 text-rose-500" />
      case "converted to pi":
      case "converted to proforma": return <Receipt className="h-5 w-5 text-purple-500" />
      case "converted to sales order": return <ShoppingCart className="h-5 w-5 text-emerald-500" />
      case "cancelled": return <Circle className="h-5 w-5 text-destructive" />
      case "issued": return <Receipt className="h-5 w-5 text-primary" />
      default: return <Circle className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: SalesDocumentStatus | string) => {
    const norm = String(status || "").toLowerCase().trim()
    if (norm === "draft") {
      return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none">Draft Mode</Badge>
    }
    if (norm === "sent to client") {
      return <Badge variant="secondary" className="bg-sky-100 text-sky-800 border-none">Sent to Client</Badge>
    }
    if (norm === "accepted") {
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Accepted</Badge>
    }
    if (norm === "rejected") {
      return <Badge variant="secondary" className="bg-rose-100 text-rose-800 border-none">Rejected</Badge>
    }
    if (norm === "converted to pi" || norm === "converted to proforma") {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-none">Converted to PI</Badge>
    }
    if (norm === "converted to sales order" || norm === "converted to order") {
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Converted to Order</Badge>
    }
    if (norm === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>
    }
    if (norm === "issued") {
      return <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Issued & Pending</Badge>
    }
    return <Badge variant="outline">{status}</Badge>
  }

  return (
    <>
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SCREEN VIEW â€” Normal dashboard card layout
          Hidden during print via CSS: .screen-only { display: none }
      â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•  */}
      <div className="screen-only flex flex-col gap-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{proforma.number}</h1>
                {getStatusBadge(proforma.status)}
                <div className="w-[190px]">
                  <Select
                    value={proforma.status || "Draft"}
                    onValueChange={handleStatusChange}
                    disabled={isUpdatingStatus || getAllowedNextStatuses(proforma.status).length === 0}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={proforma.status || "Draft"}>
                        {proforma.status || "Draft"} (Current)
                      </SelectItem>
                      {getAllowedNextStatuses(proforma.status).map((st) => (
                        <SelectItem key={st} value={st}>
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            <Button
              variant="outline"
              className="gap-2 border-slate-200 shadow-sm"
              onClick={handleSendEmail}
              disabled={isSendingEmail}
            >
              {isSendingEmail ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-600" /> Sending Email...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 text-slate-600" /> Send Email
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-slate-200 shadow-sm"
              onClick={handlePrint}
            >
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
                        <TableCell className="text-right pr-6 font-extrabold text-slate-900">{getCurrencySymbol(proforma.currencyType)}{item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? ((item.unitPrice * item.quantity).toLocaleString())}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-8 flex justify-end bg-slate-50/20 border-t border-slate-50 font-sans">
                  <div className="w-96 space-y-4">
                    {proforma.paymentType === "Foreign" ? (
                      <>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-slate-500 font-medium">Gross Total</span>
                          <span className="font-bold text-slate-800 text-lg">{getCurrencySymbol(proforma.currencyType)}{originalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {hasDiscounts && (
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-slate-500 font-medium">Total Discount</span>
                            <span className="text-rose-600 font-bold text-lg">- {getCurrencySymbol(proforma.currencyType)}{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* 1. Base Amount (Price minus GST) */}
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-slate-500 font-medium">Gross Base Value (Excl. GST)</span>
                          <span className="font-bold text-slate-800 text-lg">
                            {getCurrencySymbol(proforma.currencyType)}
                            {proforma.items?.reduce((sum, item) => {
                              const price = item.unitPrice || 0
                              const gstRate = item.gstRate || 0
                              const base = gstRate > 0 ? price / (1 + gstRate / 100) : price
                              return sum + (base * item.quantity)
                            }, 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* 2. Total Discount applied on Base Amount */}
                        {hasDiscounts && (
                          <div className="flex justify-between text-sm items-center">
                            <span className="text-slate-500 font-medium">Total Discount (On Base Value)</span>
                            <span className="text-rose-600 font-bold text-lg">- {getCurrencySymbol(proforma.currencyType)}{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}

                        {/* 3. Taxable Subtotal after Discount */}
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-slate-500 font-medium">Taxable Subtotal</span>
                          <span className="font-bold text-slate-800 text-lg">{getCurrencySymbol(proforma.currencyType)}{proforma.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {/* 4. GST on Discounted Subtotal */}
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-slate-500 font-medium">Total GST</span>
                          <span className="text-emerald-600 font-extrabold text-lg">{getCurrencySymbol(proforma.currencyType)}{proforma.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </>
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
                        <span className="text-slate-900 text-4xl font-black tracking-tighter">{getCurrencySymbol(proforma.currencyType)}{proforma.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                        onClick={() => navigate(`/sales/quotations/${proforma.sourceQuotationId}`)}
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

      {/* ── Hidden Print Area using Common PrintLayout ── */}
      <div id="proforma-print-area" className="hidden">
        <PrintLayout
          containerRef={printRef}
          documentTitle="PROFORMA INVOICE"
          documentSubtitle={`REF: ${proforma.number || proforma.proformaNumber}`}
          footerProps={{
            documentNumber: proforma.number || proforma.proformaNumber,
            showBankDetails: true,
            showComputerGeneratedDisclaimer: true,
            authorizedSignatoryLabel: `FOR ${COMPANY.name}`,
            customSignatures: (
              <div className="pt-3 border-t border-slate-300 mt-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-6 items-end">
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1">
                      P.O. SHOULD BE IN THE NAME OF <strong>{COMPANY.name}</strong>
                    </div>
                    <div className="font-bold text-xs text-slate-900">{COMPANY.forLine}</div>
                    {proforma.salesPersonName && (
                      <div className="mt-1">
                        <div className="text-xs font-semibold text-slate-800">
                          {proforma.salesPersonName}
                        </div>
                        {proforma.salesPersonCell && (
                          <div className="text-[11px] text-slate-600">
                            Cell: {proforma.salesPersonCell}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="h-10 border-b border-slate-300 w-48 ml-auto mb-1" />
                    <span className="text-[10px] text-slate-500 font-medium">Authorized Signature</span>
                  </div>
                </div>
              </div>
            ),
          }}
        >
          {/* Customer & Document Information Box */}
          <div className="mb-4 text-xs font-sans border border-slate-300 rounded-md overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-slate-300 bg-white">
              {/* Left Column: Customer Details */}
              <div className="p-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Billing Name &amp; Address:
                </div>
                <div className="font-bold text-sm text-slate-900">{proforma.clientName}</div>
                {proforma.doctorSpeciality && (
                  <div className="text-xs text-slate-600 font-medium">{proforma.doctorSpeciality}</div>
                )}
                {proforma.billingAddress && (
                  <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {proforma.billingAddress.replace(/\|/g, ", ")}
                  </div>
                )}
                {proforma.clientMobileNo && (
                  <div className="text-xs text-slate-700 pt-0.5">
                    <span className="font-semibold text-slate-800">Mob:</span> {proforma.clientMobileNo}
                  </div>
                )}
                <div className="text-xs text-slate-800 pt-1">
                  <span className="font-bold text-slate-900">Client GSTIN / UIN:</span>{" "}
                  <span className="font-mono font-bold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {proforma.gstinNo?.trim() ? proforma.gstinNo : "URP / Unregistered"}
                  </span>
                </div>
              </div>

              {/* Right Column: Proforma Metadata */}
              <div className="p-3 space-y-1.5 bg-slate-50/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">P.I No:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {proforma.number || proforma.proformaNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Date:</span>
                  <span className="font-bold text-slate-900">{formatDateWithDots(proforma.date)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Validity:</span>
                  <span className="font-bold text-slate-900">{proforma.validityDays || 7} Days</span>
                </div>
                {linkedQuotationNumber && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Linked Quote:</span>
                    <span className="font-mono font-semibold text-slate-800">{linkedQuotationNumber}</span>
                  </div>
                )}
                {proforma.deliveryTerms && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Delivery:</span>
                    <span className="font-semibold text-slate-900">{proforma.deliveryTerms}</span>
                  </div>
                )}
                {proforma.salesPersonName && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-600 font-medium">Sales Rep:</span>
                    <span className="font-semibold text-slate-900">{proforma.salesPersonName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subject / Title Banner if exists */}
          {proforma.subject && (
            <div className="text-center font-semibold text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md mb-3 text-slate-800">
              Subject: <span className="font-bold uppercase tracking-wide text-slate-900">{proforma.subject}</span>
            </div>
          )}

          {/* ══════════════ PRODUCTS TABULAR FORMAT ══════════════ */}
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-800 font-semibold border-b border-slate-200">
                  <th className="py-2 px-2 text-center w-10 border-r border-slate-200">#</th>
                  <th className="py-2 px-3 text-left border-r border-slate-200">Item Description</th>
                  <th className="py-2 px-2 text-center w-16 border-r border-slate-200">Qty</th>
                  <th className="py-2 px-2.5 text-right w-28 border-r border-slate-200">
                    <div>Rate ({getPrintCurrencySymbol(proforma.currencyType)})</div>
                    <div className="text-[9px] font-normal text-slate-500">
                      {proforma.paymentType === "Foreign" ? "Standard" : "(Incl. GST)"}
                    </div>
                  </th>
                  {hasDiscounts && (
                    <th className="py-2 px-2 text-right w-20 border-r border-slate-200">Discount</th>
                  )}
                  {proforma.paymentType !== "Foreign" && (
                    <th className="py-2 px-2 text-center w-16 border-r border-slate-200">GST %</th>
                  )}
                  <th className="py-2 px-3 text-right w-32">
                    <div>Total ({getPrintCurrencySymbol(proforma.currencyType)})</div>
                    <div className="text-[9px] font-normal text-slate-500">
                      {proforma.paymentType === "Foreign" ? "" : "(Incl. GST)"}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                {proforma.items.map((item, idx) => {
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
                        {proforma.paymentType !== "Foreign" && (
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
                      {proforma.paymentType !== "Foreign" && (
                        <td className="py-2 px-2 text-center font-medium text-slate-600 border-r border-slate-100 align-top">
                          {item.gstRate}%
                        </td>
                      )}
                      <td className="py-2 px-3 text-right font-bold text-slate-900 align-top">
                        <div>
                          {lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {proforma.paymentType !== "Foreign" && (
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
                    colSpan={2 + (hasDiscounts ? 1 : 0) + (proforma.paymentType !== "Foreign" ? 1 : 0)}
                    rowSpan={hasDiscounts ? (proforma.paymentType !== "Foreign" ? 5 : 3) : (proforma.paymentType !== "Foreign" ? 4 : 2)}
                    className="p-3 border-r border-slate-200 align-top bg-white"
                  >
                    <div className="space-y-1 text-slate-700">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                        Commercial Terms:
                      </div>
                      <div className="text-[11px] grid grid-cols-[110px_1fr] gap-1">
                        <span className="text-slate-500">Tax Clause:</span>
                        <span className="font-semibold text-emerald-800">
                          {proforma.paymentType === "Foreign" ? "Exempt / Export" : "All quoted prices include GST"}
                        </span>
                        <span className="text-slate-500">Payment Terms:</span>
                        <span className="font-semibold text-slate-900">
                          {proforma.paymentTerms || proforma.notes || "100% Advance"}
                        </span>
                        <span className="text-slate-500">Delivery Terms:</span>
                        <span className="font-semibold text-slate-900">
                          {proforma.deliveryTerms || proforma.deliveryTime || "Immediate Delivery"}
                        </span>
                        <span className="text-slate-500">Client GSTIN:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {proforma.gstinNo || "Unregistered / URP"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200">
                    Gross Total (Incl. GST):
                  </td>
                  <td className="py-1.5 px-3 text-right font-medium text-slate-800">
                    {getPrintCurrencySymbol(proforma.currencyType)}{" "}
                    {originalSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {hasDiscounts && (
                  <tr>
                    <td colSpan={2} className="py-1.5 px-3 text-right text-rose-600 border-r border-slate-200">
                      Total Discount:
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-rose-600">
                      - {getPrintCurrencySymbol(proforma.currencyType)}{" "}
                      {totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {proforma.freight !== undefined && proforma.freight > 0 && (
                  <tr>
                    <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200 text-[11px]">
                      Freight Charges:
                    </td>
                    <td className="py-1.5 px-3 text-right font-normal text-slate-800 text-[11px]">
                      + {getPrintCurrencySymbol(proforma.currencyType)}{" "}
                      {proforma.freight.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {proforma.paymentType !== "Foreign" && (
                  <>
                    <tr>
                      <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200 text-[11px]">
                        Taxable Value (Excl. GST):
                      </td>
                      <td className="py-1.5 px-3 text-right font-normal text-slate-700 text-[11px]">
                        {getPrintCurrencySymbol(proforma.currencyType)}{" "}
                        {proforma.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200 text-[11px]">
                        GST Amount (Included):
                      </td>
                      <td className="py-1.5 px-3 text-right font-normal text-amber-700 text-[11px]">
                        {getPrintCurrencySymbol(proforma.currencyType)}{" "}
                        {proforma.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </>
                )}

                <tr className="border-t border-slate-300 bg-slate-100/90 text-slate-900">
                  <td colSpan={2} className="py-2 px-3 text-right font-bold text-sm border-r border-slate-200">
                    Net Payable (Incl. GST):
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-sm text-slate-950">
                    {getPrintCurrencySymbol(proforma.currencyType)}{" "}
                    {proforma.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </PrintLayout>
      </div>

      <ProformaFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        proforma={proforma}
        onSave={handleSave}
      />
    </>
  )
}

