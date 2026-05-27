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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProformaFormDialog } from "../proforma-form-dialog"
import { proformaApi } from "@/lib/api"
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
    "Branch Name : Bandra (West), Mumbai – 400 050.",
    "Bank Account No : 012800000002727",
    "Type of Account : Current Account",
    "IFSC Code : IOBA0000128",
  ],
}

export function ProformaDetailsView({ proforma: initialProforma }: ProformaDetailsViewProps) {
  const router = useRouter()
  const [proforma, setProforma] = React.useState<ProformaInvoice>(initialProforma)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isConverting, setIsConverting] = React.useState(false)

  const handleConvertToOrder = async () => {
    if (proforma.status === "Converted to Sales Order") return
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
      setProforma(updated)
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
      {/* ═══════════════════════════════════════════════════════════
          SCREEN VIEW — Normal dashboard card layout
          Hidden during print via CSS: .screen-only { display: none }
      ═══════════════════════════════════════════════════════════ */}
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
            <Button variant="outline" className="gap-2 border-slate-200 shadow-sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 text-slate-600" /> Print PI
            </Button>
            <Button variant="outline" className="gap-2 border-slate-200 shadow-sm">
              <FileDown className="h-4 w-4 text-slate-600" /> Download
            </Button>
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
                              <img src={item.imageUrl} alt={item.productName} className="w-8 h-8 rounded object-cover border border-slate-100" />
                            )}
                            <div>
                              <div className="font-bold text-slate-800">{item.productName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-400">{item.sku}</TableCell>
                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">₹{item.unitPrice.toLocaleString()}</div>
                          {item.discountPercentage !== undefined && item.discountPercentage > 0 && (
                            <div className="text-[10px] text-red-500 font-bold mt-0.5">
                              -{item.discountPercentage}% (-₹{(item.discountAmount || 0).toLocaleString()})
                            </div>
                          )}
                        </TableCell>
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
                    {proforma.freight !== undefined && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-500 font-medium">Freight Charges</span>
                        <span className="font-bold text-slate-800 text-lg">+ ₹{proforma.freight.toLocaleString()}</span>
                      </div>
                    )}
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

          {/* Sidebar */}
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

      {/* ═══════════════════════════════════════════════════════════
          PRINT-ONLY VIEW — Formal invoice document layout
          Hidden on screen, shown only during @media print
      ═══════════════════════════════════════════════════════════ */}
      <div className="print-only" style={{ fontFamily: "Arial, sans-serif", fontSize: "12px" }}>

        {/* Header */}
        <div style={{ display: "flex", borderBottom: "4px solid #374151" }}>
          {/* Logo area */}
          <div style={{ padding: "16px 24px", background: "#fff", minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 80 80" style={{ width: 80, height: 80 }}>
              <ellipse cx="20" cy="20" rx="18" ry="18" fill="#CC2229" />
              <rect x="0" y="28" width="80" height="12" fill="#4A4A4A" />
              <text x="6" y="60" fontSize="11" fontWeight="bold" fill="#1a1a1a" fontFamily="Arial">TEJCO</text>
              <text x="6" y="72" fontSize="5.5" fill="#4A4A4A" fontFamily="Arial">Skin • Hair • Optics</text>
            </svg>
          </div>
          {/* Red stripe */}
          <div style={{ width: 8, background: "#DC2626", flexShrink: 0 }} />
          {/* Company name */}
          <div style={{ flex: 1, background: "#4B5563", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 24px" }}>
            <span style={{ color: "#fff", fontSize: 22, fontWeight: "bold", letterSpacing: 4, textTransform: "uppercase" }}>
              {COMPANY.name}
            </span>
          </div>
        </div>

        {/* Invoice Title */}
        <div style={{ borderBottom: "1px solid #D1D5DB" }}>
          <div style={{ textAlign: "center", padding: "6px", fontWeight: "bold", fontSize: 13, background: "#F9FAFB", borderBottom: "1px solid #D1D5DB" }}>
            PROFORMA INVOICE
          </div>
          <div style={{ textAlign: "center", padding: "4px", fontSize: 11, color: "#374151" }}>
            GST NO :- {COMPANY.gst}
          </div>
        </div>

        {/* PI No / Date */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #D1D5DB" }}>
          <div style={{ padding: "8px 12px", borderRight: "1px solid #D1D5DB", display: "flex", gap: 8, alignItems: "center" }}>
            <strong>P.I No</strong>
            <span style={{ marginLeft: 8 }}>{proforma.number}</span>
          </div>
          <div style={{ padding: "8px 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <strong>DATE</strong>
            <span style={{ marginLeft: 8 }}>
              {new Date(proforma.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Billing Name & Address */}
        <div style={{ borderBottom: "1px solid #D1D5DB" }}>
          <div style={{ padding: "6px 12px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
            <strong>Billing Name &amp; Address</strong>
          </div>
          <div style={{ padding: "10px 16px", minHeight: 80, lineHeight: 1.6, fontSize: 12 }}>
            <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 4 }}>{proforma.clientName}</div>
            {renderAddressLinesPrint(proforma.billingAddress)}
            {proforma.gstinNo && <div style={{ marginTop: 4, fontWeight: 600 }}>GSTIN: {proforma.gstinNo}</div>}
          </div>
        </div>

        {/* Items Table */}
        <div style={{ borderBottom: "1px solid #D1D5DB" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "left", width: "35%" }}>Products</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "20%" }}>Images</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "10%" }}>Qty</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "17.5%" }}>Rate in Rs/<br />Doller</th>
                <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "17.5%" }}>Total in Rs/<br />Doller</th>
              </tr>
            </thead>
            <tbody>
              {proforma.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ border: "1px solid #D1D5DB", padding: "10px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                    {item.discountPercentage !== undefined && item.discountPercentage > 0 && (
                      <div style={{ fontSize: 10, color: "#DC2626", marginTop: 2 }}>
                        Discount: {item.discountPercentage}%
                        {item.discountAmount !== undefined && ` (₹${item.discountAmount.toLocaleString()})`}
                      </div>
                    )}
                  </td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "center", verticalAlign: "middle" }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.productName} style={{ width: 48, height: 48, objectFit: "cover", margin: "0 auto", border: "1px solid #E5E7EB" }} />
                      : <span style={{ color: "#CBD5E1", fontSize: 10 }}>—</span>
                    }
                  </td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "center", verticalAlign: "middle" }}>{item.quantity}</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "right", verticalAlign: "middle" }}>₹{item.unitPrice.toLocaleString()}</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "right", verticalAlign: "middle", fontWeight: "bold" }}>₹{item.total.toLocaleString()}</td>
                </tr>
              ))}

              {/* Filler rows */}
              {proforma.items.length < 3 && Array.from({ length: 3 - proforma.items.length }).map((_, idx) => (
                <tr key={`empty-${idx}`}>
                  {[0, 1, 2, 3, 4].map((c) => (
                    <td key={c} style={{ border: "1px solid #D1D5DB", padding: "14px 10px" }}>&nbsp;</td>
                  ))}
                </tr>
              ))}

              {/* Freight */}
              <tr style={{ background: "#F9FAFB" }}>
                <td colSpan={4} style={{ border: "1px solid #D1D5DB", padding: "8px 10px", fontWeight: "bold" }}>FREIGHT</td>
                <td style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "right", fontWeight: "bold" }}>
                  {proforma.freight !== undefined && proforma.freight > 0 ? `₹${proforma.freight.toLocaleString()}` : "-"}
                </td>
              </tr>

              {/* Total */}
              <tr style={{ background: "#F3F4F6" }}>
                <td colSpan={4} style={{ border: "1px solid #D1D5DB", padding: "8px 10px", fontWeight: "bold", fontSize: 12 }}>TOTAL</td>
                <td style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "right", fontWeight: "bold", fontSize: 13 }}>
                  ₹{proforma.totalAmount.toLocaleString()}
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

        {/* Footer: Sales Rep + Bank */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #D1D5DB", minHeight: 120 }}>
          {/* Left: Sales Rep */}
          <div style={{ borderRight: "1px solid #D1D5DB", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontWeight: "bold" }}>{COMPANY.forLine}</div>
            {proforma.salesPersonName && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontWeight: 600 }}>
                  {proforma.salesPersonName}
                  {proforma.salesPersonCell && `: +91 ${proforma.salesPersonCell}`}
                </div>
                {proforma.salesPersonCell && (
                  <div style={{ color: "#2563EB", fontSize: 11, marginTop: 2 }}>{proforma.salesPersonCell}</div>
                )}
              </div>
            )}
            <div style={{ marginTop: "auto", color: "#2563EB", textDecoration: "underline", fontSize: 11 }}>
              AUTHORISED SIGNATORY
            </div>
          </div>

          {/* Right: Bank Details */}
          <div style={{ padding: "14px 16px" }}>
            <div style={{ color: "#2563EB", textDecoration: "underline", fontSize: 11, marginBottom: 6 }}>Bank Details</div>
            {COMPANY.bankDetails.map((line, idx) => (
              <div key={idx} style={{ fontSize: 11, lineHeight: 1.6, color: "#374151" }}>{line}</div>
            ))}
          </div>
        </div>

        {/* Document footer */}
        <div style={{ padding: "12px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 9, color: "#9CA3AF", letterSpacing: 1 }}>
            This is a computer-generated document. No signature required.
          </p>
        </div>
      </div>

      {/* ── Global print CSS injected inline ─────────────────────── */}
      <style>{`
        @media print {
          .screen-only { display: none !important; }
          .print-only  { display: block !important; }
          body { margin: 0; padding: 0; }
        }
        @media screen {
          .print-only  { display: none !important; }
          .screen-only { display: flex; }
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
