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
import { Order, OrderStatus, salesOrderClientCache } from "@/app/sales/orders/types"
import { clientsApi, productsApi } from "@/lib/api"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"

const productDetailsCache = new Map<string, any>()
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
import { PrintLayout, executePrint } from "@/components/common/print"
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

const getPrintCurrencySymbol = (currency?: string) => {
  if (!currency || currency.toUpperCase() === "INR") return "Rs"
  return getCurrencySymbol(currency)
}

const formatDateWithDots = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}.${month}.${year}`
  } catch (e) {
    return dateStr
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
    if (initialOrder.clientId && initialOrder.clientId !== "0" && (!initialOrder.clientName || initialOrder.clientName.startsWith("Client #"))) {
      const cached = salesOrderClientCache.get(initialOrder.clientId)
      if (cached && cached.name) {
        setOrder(prev => ({
          ...prev,
          clientName: cached.name,
          doctorSpeciality: prev.doctorSpeciality || cached.doctorSpeciality || "",
          clientGSTIN: prev.clientGSTIN || cached.gstin || "",
        }))
      } else {
        clientsApi.getById(initialOrder.clientId)
          .then((c) => {
            if (c && c.name) {
              salesOrderClientCache.set(initialOrder.clientId, c)
              setOrder(prev => ({
                ...prev,
                clientName: c.name,
                doctorSpeciality: prev.doctorSpeciality || c.doctorSpeciality || "",
                clientGSTIN: prev.clientGSTIN || c.gstin || "",
              }))
            }
          })
          .catch(() => { })
      }
    }

    // Fetch product details for items where variationId is null/missing/0
    if (initialOrder.items && initialOrder.items.length > 0) {
      const itemsToEnrich = initialOrder.items.filter(
        item => (!item.variantId || item.variantId === 0) && item.productId && item.productId !== "0"
      )

      if (itemsToEnrich.length > 0) {
        Promise.all(
          initialOrder.items.map(async (item) => {
            const hasVariant = !!item.variantId && item.variantId !== 0
            if (hasVariant || !item.productId || item.productId === "0") {
              // If item doesn't have a valid product or variant, check if productName is empty
              if (!item.productName && !item.name && !item.sku) {
                return { ...item, productName: "No product found" }
              }
              return item
            }

            try {
              const cached = productDetailsCache.get(String(item.productId))
              let prod = cached
              if (!prod) {
                const res = await productsApi.getById(item.productId)
                prod = res?.data || res
                if (prod && (prod.productId || prod.productName)) {
                  productDetailsCache.set(String(item.productId), prod)
                }
              }

              if (prod && (prod.productName || prod.name)) {
                const prodName = prod.productName || prod.name || "No product found"
                const defaultVariant = Array.isArray(prod.variants) && prod.variants.length > 0 ? prod.variants[0] : null
                const variantName = defaultVariant?.variantName || prod.variantName || ""
                const sku = item.sku || (defaultVariant ? `${prod.baseSKU || ""}${defaultVariant.skuSuffix || ""}` : prod.baseSKU) || ""
                const imageUrl = item.imageUrl || defaultVariant?.variantImage || prod.imageUrl || prod.image || ""

                return {
                  ...item,
                  productName: prodName,
                  name: item.name || variantName || prodName,
                  sku: sku,
                  imageUrl: imageUrl || item.imageUrl,
                }
              } else {
                return {
                  ...item,
                  productName: item.productName || "No product found",
                }
              }
            } catch (err) {
              console.error(`Failed to fetch product details for productId ${item.productId}:`, err)
              return {
                ...item,
                productName: item.productName || "No product found",
              }
            }
          })
        ).then((enrichedItems) => {
          setOrder(prev => ({
            ...prev,
            items: enrichedItems,
          }))
        })
      }
    }
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

  const printRef = React.useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    executePrint(printRef.current, {
      documentTitle: `Sales Order - ${order.orderNumber}`,
      pageOrientation: "portrait",
    })
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

            {/* <DropdownMenu>
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
            </DropdownMenu> */}

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
                    {order.items.map((item) => {
                      const isNoProduct = !item.productName || item.productName === "No product found"
                      const displayName = isNoProduct ? "No product found" : item.productName

                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {(item as any).imageUrl && !isNoProduct && (
                                <div className="h-10 w-10 rounded border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0 flex items-center justify-center">
                                  <img
                                    src={getGoogleDrivePreviewUrl((item as any).imageUrl) || ""}
                                    alt={displayName}
                                    className="h-full w-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <div>
                                <div className={`font-medium ${isNoProduct ? "text-slate-400 italic font-normal" : "text-slate-900"}`}>
                                  {displayName}
                                </div>
                                {!isNoProduct && (item as any).name && (item as any).name !== item.productName && (
                                  <div className="text-xs text-slate-500">{(item as any).name}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{item.sku || "—"}</TableCell>
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
                            {getCurrencySymbol(order.currencyType)}{item.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? ((item.unitPrice * item.quantity).toLocaleString())}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                <div className="mt-6 flex justify-end">
                  <div className="w-80 space-y-3">
                    {order.paymentType === "Foreign" ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gross Total</span>
                          <span className="font-medium">{getCurrencySymbol(order.currencyType)}{originalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {hasDiscounts && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Discount</span>
                            <span className="text-rose-600 font-medium">- {getCurrencySymbol(order.currencyType)}{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* 1. Base Amount (Price minus GST) */}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gross Base Value (Excl. GST)</span>
                          <span className="font-medium">
                            {getCurrencySymbol(order.currencyType)}
                            {order.items?.reduce((sum, item) => {
                              const price = item.unitPrice || 0
                              const gstRate = item.gstRate || 0
                              const base = gstRate > 0 ? price / (1 + gstRate / 100) : price
                              return sum + (base * item.quantity)
                            }, 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* 2. Total Discount applied on Base Amount */}
                        {hasDiscounts && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Discount (On Base Value)</span>
                            <span className="text-rose-600 font-medium">- {getCurrencySymbol(order.currencyType)}{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}

                        {/* 3. Taxable Subtotal after Discount */}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxable Subtotal</span>
                          <span className="font-medium">{getCurrencySymbol(order.currencyType)}{order.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {/* 4. GST on Discounted Subtotal */}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total GST</span>
                          <span className="text-emerald-600 font-medium">{getCurrencySymbol(order.currencyType)}{order.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </>
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

      {/* ── Hidden Print Area using Common PrintLayout ── */}
      <div id="order-print-area" className="hidden">
        <PrintLayout
          containerRef={printRef}
          documentTitle="SALES ORDER"
          documentSubtitle={`REF: ${order.orderNumber}`}
          footerProps={{
            documentNumber: order.orderNumber,
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
                    {order.salesPersonName && (
                      <div className="mt-1">
                        <div className="text-xs font-semibold text-slate-800">
                          {order.salesPersonName}
                        </div>
                        {order.salesPersonCell && (
                          <div className="text-[11px] text-slate-600">
                            Cell: {order.salesPersonCell}
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
                <div className="font-bold text-sm text-slate-900">{order.clientName}</div>
                {order.doctorSpeciality && (
                  <div className="text-xs text-slate-600 font-medium">{order.doctorSpeciality}</div>
                )}
                {order.billingAddress && (
                  <div className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {order.billingAddress.replace(/\|/g, ", ")}
                  </div>
                )}
                {order.shippingAddress && order.shippingAddress !== order.billingAddress && (
                  <div className="pt-1.5 border-t border-slate-100 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Shipping: </span>
                    {order.shippingAddress.replace(/\|/g, ", ")}
                  </div>
                )}
                <div className="text-xs text-slate-800 pt-1">
                  <span className="font-bold text-slate-900">Client GSTIN / UIN:</span>{" "}
                  <span className="font-mono font-bold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {order.clientGSTIN?.trim() ? order.clientGSTIN : "URP / Unregistered"}
                  </span>
                </div>
              </div>

              {/* Right Column: Order Metadata */}
              <div className="p-3 space-y-1.5 bg-slate-50/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Order No:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {order.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Date:</span>
                  <span className="font-bold text-slate-900">{formatDateWithDots(order.date)}</span>
                </div>
                {order.deliveryDate && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Target Delivery:</span>
                    <span className="font-bold text-slate-900">{formatDateWithDots(order.deliveryDate)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Order Status:</span>
                  <span className="font-semibold text-slate-900">{order.status}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Payment Status:</span>
                  <span className="font-semibold text-slate-900">{order.paymentStatus}</span>
                </div>
                {order.quotationId && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Linked Quote:</span>
                    <span className="font-mono font-semibold text-slate-800">#{order.quotationId}</span>
                  </div>
                )}
                {order.proformaId && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">Linked PI:</span>
                    <span className="font-mono font-semibold text-slate-800">#{order.proformaId}</span>
                  </div>
                )}
                {order.salesPersonName && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                    <span className="text-slate-600 font-medium">Sales Rep:</span>
                    <span className="font-semibold text-slate-900">{order.salesPersonName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes Banner if exists */}
          {order.notes && (
            <div className="text-center font-semibold text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-md mb-3 text-slate-800">
              Notes: <span className="font-normal text-slate-700">{order.notes}</span>
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
                    <div>Rate ({getPrintCurrencySymbol(order.currencyType)})</div>
                    <div className="text-[9px] font-normal text-slate-500">
                      {order.paymentType === "Foreign" ? "Standard" : "(Incl. GST)"}
                    </div>
                  </th>
                  {hasDiscounts && (
                    <th className="py-2 px-2 text-right w-20 border-r border-slate-200">Discount</th>
                  )}
                  {order.paymentType !== "Foreign" && (
                    <th className="py-2 px-2 text-center w-16 border-r border-slate-200">GST %</th>
                  )}
                  <th className="py-2 px-3 text-right w-32">
                    <div>Total ({getPrintCurrencySymbol(order.currencyType)})</div>
                    <div className="text-[9px] font-normal text-slate-500">
                      {order.paymentType === "Foreign" ? "" : "(Incl. GST)"}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                {order.items.map((item, idx) => {
                  const discountPercentage = (item as any).discountPercentage || 0
                  const discountAmount = (item as any).discountAmount || 0
                  const effectiveUnitPrice = item.unitPrice - discountAmount
                  const lineTotal = effectiveUnitPrice * item.quantity

                  const isNoProduct = !item.productName || item.productName === "No product found"
                  const displayName = isNoProduct ? "No product found" : item.productName

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-center font-medium text-slate-500 border-r border-slate-100 align-top">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-100 align-top">
                        <div className="flex items-start gap-2">
                          {(item as any).imageUrl && !isNoProduct && (
                            <div className="h-10 w-10 rounded border border-slate-200 bg-white p-0.5 shrink-0 overflow-hidden">
                              <img
                                src={getGoogleDrivePreviewUrl((item as any).imageUrl) || ""}
                                alt={displayName}
                                className="h-full w-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                          <div>
                            <div className={`text-xs ${isNoProduct ? "font-normal italic text-slate-400" : "font-bold text-slate-900"}`}>
                              {displayName}
                            </div>
                            {!isNoProduct && (item as any).name && (item as any).name !== item.productName && (
                              <div className="text-[10px] text-slate-500">{(item as any).name}</div>
                            )}
                            {!isNoProduct && item.sku && (
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
                        {order.paymentType !== "Foreign" && (
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
                      {order.paymentType !== "Foreign" && (
                        <td className="py-2 px-2 text-center font-medium text-slate-600 border-r border-slate-100 align-top">
                          {item.gstRate}%
                        </td>
                      )}
                      <td className="py-2 px-3 text-right font-bold text-slate-900 align-top">
                        <div>
                          {lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {order.paymentType !== "Foreign" && (
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
                    colSpan={2 + (hasDiscounts ? 1 : 0) + (order.paymentType !== "Foreign" ? 1 : 0)}
                    rowSpan={hasDiscounts ? (order.paymentType !== "Foreign" ? 5 : 3) : (order.paymentType !== "Foreign" ? 4 : 2)}
                    className="p-3 border-r border-slate-200 align-top bg-white"
                  >
                    <div className="space-y-1 text-slate-700">
                      <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
                        Commercial Terms:
                      </div>
                      <div className="text-[11px] grid grid-cols-[110px_1fr] gap-1">
                        <span className="text-slate-500">Tax Clause:</span>
                        <span className="font-semibold text-emerald-800">
                          {order.paymentType === "Foreign" ? "Exempt / Export" : "All quoted prices include GST"}
                        </span>
                        <span className="text-slate-500">Payment Status:</span>
                        <span className="font-semibold text-slate-900">
                          {order.paymentStatus}
                        </span>
                        {order.deliveryDate && (
                          <>
                            <span className="text-slate-500">Target Delivery:</span>
                            <span className="font-semibold text-slate-900">
                              {formatDateWithDots(order.deliveryDate)}
                            </span>
                          </>
                        )}
                        <span className="text-slate-500">Client GSTIN:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {order.clientGSTIN || "Unregistered / URP"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200">
                    Gross Total (Incl. GST):
                  </td>
                  <td className="py-1.5 px-3 text-right font-medium text-slate-800">
                    {getPrintCurrencySymbol(order.currencyType)}{" "}
                    {originalSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>

                {hasDiscounts && (
                  <tr>
                    <td colSpan={2} className="py-1.5 px-3 text-right text-rose-600 border-r border-slate-200">
                      Total Discount:
                    </td>
                    <td className="py-1.5 px-3 text-right font-medium text-rose-600">
                      - {getPrintCurrencySymbol(order.currencyType)}{" "}
                      {totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}

                {order.paymentType !== "Foreign" && (
                  <>
                    <tr>
                      <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200 text-[11px]">
                        Taxable Value (Excl. GST):
                      </td>
                      <td className="py-1.5 px-3 text-right font-normal text-slate-700 text-[11px]">
                        {getPrintCurrencySymbol(order.currencyType)}{" "}
                        {order.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="py-1.5 px-3 text-right text-slate-500 border-r border-slate-200 text-[11px]">
                        GST Amount (Included):
                      </td>
                      <td className="py-1.5 px-3 text-right font-normal text-amber-700 text-[11px]">
                        {getPrintCurrencySymbol(order.currencyType)}{" "}
                        {order.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </>
                )}

                <tr className="border-t border-slate-300 bg-slate-100/90 text-slate-900">
                  <td colSpan={2} className="py-2 px-3 text-right font-bold text-sm border-r border-slate-200">
                    Net Payable (Incl. GST):
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-sm text-slate-950">
                    {getPrintCurrencySymbol(order.currencyType)}{" "}
                    {order.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </PrintLayout>
      </div>

      <OrderFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        order={order}
        onSave={handleSaveOrder}
      />
    </>
  )
}
