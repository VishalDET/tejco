import * as React from "react"
import { useNavigate } from "react-router-dom"
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
  ChevronDown,
  FileSpreadsheet
} from "lucide-react"
import { Order, OrderStatus } from "@/app/sales/orders/types"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"
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
import { OrderFormDialog } from "@/app/sales/orders/order-form-dialog"
import * as XLSX from "xlsx"
import { toast } from "sonner"

interface OrderDetailsViewProps {
  order: Order
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

const renderAddressLines = (address?: string) => {
  if (!address) return "N/A"
  const lines = address.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return address
  return lines.map((line, idx) => (
    <span key={idx} className="block">
      {line}{idx < lines.length - 1 ? "," : ""}
    </span>
  ))
}

const renderAddressLinesPrint = (address?: string) => {
  if (!address) return <span>N/A</span>
  const lines = address.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return <span>{address}</span>
  return (
    <>
      {lines.map((line, idx) => (
        <span key={idx} style={{ display: "block" }}>
          {line}{idx < lines.length - 1 ? "," : ""}
        </span>
      ))}
    </>
  )
}

export function OrderDetailsView({ order: initialOrder }: OrderDetailsViewProps) {
  const navigate = useNavigate()
  const [order, setOrder] = React.useState<Order>(initialOrder)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  React.useEffect(() => {
    setOrder(initialOrder)
  }, [initialOrder])

  const originalSubtotal = (order.items || []).reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const totalDiscount = (order.items || []).reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)
  const hasDiscounts = totalDiscount > 0

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

  const handlePrint = () => {
    const el = document.getElementById("order-print-area")
    if (el) {
      el.style.display = "flex"
      el.style.flexDirection = "column"
      window.onafterprint = () => {
        el.style.display = "none"
      }
    }
    window.print()
  }

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new()

      const summaryData = [
        ["TEJCO GLOBAL LLP - SALES ORDER"],
        [],
        ["Order Number", order.orderNumber, "", "Order Date", new Date(order.date).toLocaleDateString("en-GB")],
        ["Target Delivery Date", order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("en-GB") : "N/A", "", "Order Status", order.status],
        ["Client Name", order.clientName, "", "Payment Status", order.paymentStatus],
        ["Client GSTIN", (order as any).clientGSTIN || (order as any).gstinNo || "N/A", "", "Doctor Speciality", (order as any).doctorSpeciality || "N/A"],
        ["Billing Address", order.billingAddress || "N/A"],
        ["Shipping Address", order.shippingAddress || "N/A"],
        ["Currency", order.currencyType || "INR", "", "Payment Type", order.paymentType || "Domestic"],
        [],
        ["LINE ITEMS"],
        ["#", "Product Name", "Variant / Details", "SKU", "Qty", "Unit Price", "Disc %", "Disc Amount", "GST %", "Total Price"]
      ]

      const itemRows = (order.items || []).map((item, idx) => [
        idx + 1,
        item.productName,
        (item as any).name || "",
        item.sku,
        item.quantity,
        item.unitPrice,
        (item as any).discountPercentage || 0,
        (item as any).discountAmount || 0,
        item.gstRate || 0,
        item.total || ((item.unitPrice - ((item as any).discountAmount || 0)) * item.quantity)
      ])

      const totalsData = [
        [],
        ["", "", "", "", "", "", "", "", "Gross Total", originalSubtotal],
        ["", "", "", "", "", "", "", "", "Total Discount", totalDiscount],
        ["", "", "", "", "", "", "", "", "Subtotal (Excl. GST)", order.subtotal || 0],
        ["", "", "", "", "", "", "", "", "GST Amount", order.taxAmount || 0],
        ["", "", "", "", "", "", "", "", "Grand Total", order.totalAmount || 0]
      ]

      const wsData = [...summaryData, ...itemRows, ...totalsData]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      XLSX.utils.book_append_sheet(wb, ws, "Sales Order")
      XLSX.writeFile(wb, `SalesOrder_${order.orderNumber}.xlsx`)
      toast.success("Sales order exported to Excel successfully")
    } catch (err) {
      console.error("Failed to export order to Excel:", err)
      toast.error("Failed to export Excel file")
    }
  }

  const handleSaveOrder = (updatedData: Partial<Order>) => {
    setOrder((prev) => ({
      ...prev,
      ...updatedData
    } as Order))
  }

  return (
    <>
      <div className="flex flex-col gap-6 screen-only">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-muted-foreground">
                Order placed on {new Date(order.date).toLocaleDateString("en-GB")} for {order.clientName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 shadow-sm border-slate-200" onClick={handlePrint}>
              <Printer className="h-4 w-4 text-slate-600" /> Print
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" className="gap-2 shadow-sm border-slate-200">
                    <FileDown className="h-4 w-4 text-slate-600" /> Export <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handlePrint}>
                  <FileDown className="h-4 w-4 text-blue-600" /> Save as PDF (Print)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-md" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4" /> Edit Order
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Items Card */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>Detailed list of products in this order.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Disc Amt</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {(item as any).imageUrl && (
                              <div className="h-10 w-10 rounded border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0 flex items-center justify-center">
                                <img
                                  src={getGoogleDrivePreviewUrl((item as any).imageUrl) || ""}
                                  alt={item.productName}
                                  className="h-full w-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900">{item.productName}</div>
                              {(item as any).name && <div className="text-xs text-slate-500">{(item as any).name}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{item.sku}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {getCurrencySymbol(order.currencyType)}{item.unitPrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-slate-500">
                          {(item as any).discountAmount && (item as any).discountAmount > 0 ? (
                            <span className="text-rose-600 font-medium">
                              -{getCurrencySymbol(order.currencyType)}{((item as any).discountAmount * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {getCurrencySymbol(order.currencyType)}{(item.unitPrice * item.quantity).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 flex justify-end">
                  <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{order.paymentType === "Foreign" ? "Gross Total" : "Gross Total (Incl. GST)"}</span>
                      <span>{getCurrencySymbol(order.currencyType)}{originalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {hasDiscounts && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Discount (Deducted)</span>
                        <span className="text-rose-600 font-medium">- {getCurrencySymbol(order.currencyType)}{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Grand Total</span>
                      <span className="text-primary">{getCurrencySymbol(order.currencyType)}{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card className="shadow-sm border-slate-200">
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
            <Card className="shadow-sm border-slate-200">
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
                    <div className="text-xs text-muted-foreground">Updated {new Date(order.date).toLocaleDateString("en-GB")}</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Target Delivery</div>
                  <div className="text-sm font-medium">
                    {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("en-GB") : "Not Specified"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer & Shipping */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Account</Label>
                  <div className="text-sm font-medium">{order.clientName}</div>
                  {(order as any).doctorSpeciality && (
                    <div className="text-xs text-slate-500 mt-0.5">Speciality: {(order as any).doctorSpeciality}</div>
                  )}
                  {((order as any).clientGSTIN || (order as any).gstinNo) && (
                    <div className="text-xs font-mono font-semibold text-slate-600 mt-0.5">
                      GSTIN: {(order as any).clientGSTIN || (order as any).gstinNo}
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Shipping Address</Label>
                  <div className="text-xs mt-1 leading-relaxed">{renderAddressLines(order.shippingAddress)}</div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase text-muted-foreground">Billing Address</Label>
                  <div className="text-xs mt-1 leading-relaxed">{renderAddressLines(order.billingAddress)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className={order.paymentStatus === "Paid" ? "border-emerald-200 bg-emerald-50/10 shadow-sm" : "border-amber-200 bg-amber-50/10 shadow-sm"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between font-bold">
                  Payment Status
                  <Badge variant={order.paymentStatus === "Paid" ? "default" : "secondary"} className={order.paymentStatus === "Paid" ? "bg-emerald-500 text-white" : ""}>
                    {order.paymentStatus}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Remaining: {getCurrencySymbol(order.currencyType)}{order.paymentStatus === "Paid" ? "0" : order.totalAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Hidden Print Area ── */}
      <div
        id="order-print-area"
        className="hidden bg-white text-black"
        style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", fontFamily: "Arial, sans-serif", fontSize: "12px" }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * { visibility: hidden; }
            #order-print-area, #order-print-area * {
              visibility: visible;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            #order-print-area {
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

        {/* ══ HEADER — Tejco standard branding ══ */}
        <div style={{ position: "relative", width: "100%", height: "105px", overflow: "hidden", flexShrink: 0, background: "#505052" }}>
          {/* White logo zone */}
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

          {/* Company name */}
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

        {/* ══ BODY ══ */}
        <div style={{ flex: "1 1 auto", padding: "0 0 16px 0" }}>

          {/* Title row */}
          <div style={{ borderBottom: "1px solid #D1D5DB" }}>
            <div style={{ textAlign: "center", padding: "6px", fontWeight: "bold", fontSize: "13px", background: "#F9FAFB", borderBottom: "1px solid #D1D5DB" }}>
              SALES ORDER
            </div>
            <div style={{ textAlign: "center", padding: "4px", fontSize: "11px", color: "#374151" }}>
              GST NO :- {COMPANY.gst}
            </div>
          </div>

          {/* Order No + Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #D1D5DB" }}>
            <div style={{ padding: "8px 12px", borderRight: "1px solid #D1D5DB", display: "flex", gap: "8px", alignItems: "center" }}>
              <strong>Order No:</strong>
              <span style={{ marginLeft: "8px" }}>{order.orderNumber}</span>
            </div>
            <div style={{ padding: "8px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
              <strong>DATE:</strong>
              <span style={{ marginLeft: "8px" }}>
                {new Date(order.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Target Delivery Date + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #D1D5DB" }}>
            <div style={{ padding: "8px 12px", borderRight: "1px solid #D1D5DB", display: "flex", gap: "8px", alignItems: "center" }}>
              <strong>Target Delivery:</strong>
              <span style={{ marginLeft: "8px" }}>
                {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "N/A"}
              </span>
            </div>
            <div style={{ padding: "8px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
              <strong>Status:</strong>
              <span style={{ marginLeft: "8px" }}>{order.status}</span>
            </div>
          </div>

          {/* Billing & Shipping Name & Address */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #D1D5DB" }}>
            {/* Billing Address */}
            <div style={{ borderRight: "1px solid #D1D5DB" }}>
              <div style={{ padding: "6px 12px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <strong>Billing Name &amp; Address</strong>
              </div>
              <div style={{ padding: "10px 16px", minHeight: "80px", lineHeight: 1.6, fontSize: "12px" }}>
                <div style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "4px" }}>{order.clientName}</div>
                {renderAddressLinesPrint(order.billingAddress)}
                {((order as any).clientGSTIN || (order as any).gstinNo) && (
                  <div style={{ marginTop: "4px", fontWeight: 600 }}>
                    GSTIN: {(order as any).clientGSTIN || (order as any).gstinNo}
                  </div>
                )}
                {(order as any).doctorSpeciality && (
                  <div style={{ marginTop: "2px", color: "#6B7280" }}>
                    Speciality: {(order as any).doctorSpeciality}
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <div style={{ padding: "6px 12px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <strong>Shipping Destination</strong>
              </div>
              <div style={{ padding: "10px 16px", minHeight: "80px", lineHeight: 1.6, fontSize: "12px" }}>
                {renderAddressLinesPrint(order.shippingAddress || order.billingAddress)}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ borderBottom: "1px solid #D1D5DB" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "left", width: "35%" }}>Products</th>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "15%" }}>Images</th>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "10%" }}>Qty</th>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "20%" }}>
                    Rate ({order.currencyType === "INR" ? "Rs" : getCurrencySymbol(order.currencyType)})
                  </th>
                  <th style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "center", width: "20%" }}>
                    Total ({order.currencyType === "INR" ? "Rs" : getCurrencySymbol(order.currencyType)})
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const discountedPrice = item.unitPrice - ((item as any).discountAmount || 0)
                  const lineTotal = discountedPrice * item.quantity
                  return (
                    <tr key={item.id}>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 600 }}>{item.productName}</div>
                        {(item as any).name && (item as any).name !== item.productName && (
                          <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "2px" }}>{(item as any).name}</div>
                        )}
                        <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "1px" }}>SKU: {item.sku}</div>
                        {(item as any).discountPercentage > 0 && (
                          <div style={{ fontSize: "10px", color: "#DC2626", marginTop: "2px" }}>
                            Disc: {(item as any).discountPercentage}% ({getCurrencySymbol(order.currencyType)}{(item as any).discountAmount?.toLocaleString()}/pc)
                          </div>
                        )}
                        {order.paymentType !== "Foreign" && (
                          <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "2px" }}>GST: {item.gstRate || 18}%</div>
                        )}
                      </td>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "center", verticalAlign: "middle" }}>
                        {(item as any).imageUrl ? (
                          <img
                            src={getGoogleDrivePreviewUrl((item as any).imageUrl) || ""}
                            alt={item.productName}
                            style={{ width: "48px", height: "48px", objectFit: "contain", margin: "0 auto" }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span style={{ color: "#CBD5E1", fontSize: "10px" }}>—</span>
                        )}
                      </td>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "center", verticalAlign: "middle" }}>{item.quantity}</td>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "right", verticalAlign: "middle" }}>
                        {getCurrencySymbol(order.currencyType)}{item.unitPrice.toLocaleString()}
                        {(item as any).discountAmount > 0 && (
                          <div style={{ fontSize: "10px", color: "#DC2626" }}>
                            Net: {getCurrencySymbol(order.currencyType)}{discountedPrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td style={{ border: "1px solid #D1D5DB", padding: "10px", textAlign: "right", verticalAlign: "middle", fontWeight: "bold" }}>
                        {getCurrencySymbol(order.currencyType)}{lineTotal.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}

                {/* Filler rows if few items */}
                {order.items.length < 2 && Array.from({ length: 2 - order.items.length }).map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    {[0, 1, 2, 3, 4].map((c) => (
                      <td key={c} style={{ border: "1px solid #D1D5DB", padding: "20px 10px" }}>&nbsp;</td>
                    ))}
                  </tr>
                ))}

                {/* Gross Total row */}
                {hasDiscounts && (
                  <tr style={{ background: "#F9FAFB" }}>
                    <td colSpan={4} style={{ border: "1px solid #D1D5DB", padding: "8px 10px", fontWeight: "bold" }}>GROSS TOTAL</td>
                    <td style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "right", fontWeight: "bold" }}>
                      {getCurrencySymbol(order.currencyType)}{originalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {/* Total row */}
                <tr style={{ background: "#F3F4F6" }}>
                  <td colSpan={4} style={{ border: "1px solid #D1D5DB", padding: "8px 10px", fontWeight: "bold", fontSize: "12px" }}>TOTAL AMOUNT</td>
                  <td style={{ border: "1px solid #D1D5DB", padding: "8px 10px", textAlign: "right", fontWeight: "bold", fontSize: "13px" }}>
                    {getCurrencySymbol(order.currencyType)}{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div style={{ borderBottom: "1px solid #D1D5DB", padding: "6px 12px" }}>
              <strong>Notes: </strong>
              <span>{order.notes}</span>
            </div>
          )}

          {/* Sales Rep + Bank Details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid #374151", minHeight: "120px" }}>
            {/* Left: Signatory */}
            <div style={{ borderRight: "1px solid #D1D5DB", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontWeight: "bold" }}>{COMPANY.forLine}</div>
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

      {/* Global print CSS */}
      <style>{`
        @media screen {
          .screen-only { display: flex; }
          #order-print-area { display: none; }
        }
      `}</style>

      <OrderFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        order={order}
        onSave={handleSaveOrder}
      />
    </>
  )
}
