import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft,
  FileEdit,
  Printer,
  RefreshCw,
  Building2,
  Calendar,
  Truck,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Copy,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  User,
  Warehouse as WarehouseIcon,
  Eye,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchableDropdown, SearchableOption } from "@/components/common/searchable-dropdown"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { purchaseOrderApi, vendorsApi, productsApi, warehousesApi } from "@/lib/api"
import {
  PurchaseOrder,
  formatCurrency,
  getOrderStatusBadgeVariant,
  getPaymentStatusBadgeVariant,
} from "../types"
import { Vendor } from "@/app/supply-chain/vendors/types"
import { Warehouse } from "@/app/supply-chain/warehouse/types"
import { PurchaseOrderPrintDocument } from "../print/purchase-order-print-document"

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Status Dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false)
  const [newStatus, setNewStatus] = useState<string>("Pending")
  const [statusRemarks, setStatusRemarks] = useState<string>("")
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false)

  const orderStatusOptions: SearchableOption[] = [
    { value: "Draft", label: "Draft" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Ordered", label: "Ordered" },
    { value: "Partially Received", label: "Partially Received" },
    { value: "Delivered", label: "Delivered" },
    { value: "Cancelled", label: "Cancelled" },
  ]

  const loadOrder = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [res, prodRes, whRes, vListRes] = await Promise.all([
        purchaseOrderApi.getById(id),
        productsApi.getAll().catch(() => []),
        warehousesApi.getAll().catch(() => []),
        vendorsApi.getAll().catch(() => []),
      ])

      const data = (res as any)?.data || res
      if (data) {
        // Map products by productId
        const pList = Array.isArray(prodRes) ? prodRes : (prodRes as any)?.data || []
        const pMap: Record<number, any> = {}
        pList.forEach((p: any) => {
          if (p.productId) pMap[p.productId] = p
        })

        // Enrich line items with product and variant names
        if (data.lineItems && Array.isArray(data.lineItems)) {
          data.lineItems = data.lineItems.map((item: any) => {
            const p = pMap[item.productId]
            const variant = p?.variants?.find((v: any) => v.variantId === item.variantId)
            return {
              ...item,
              productName: item.productName || p?.productName || `Product #${item.productId}`,
              variantName: item.variantName || variant?.variantName || (variant ? "Standard" : ""),
              sku: item.sku || (variant?.skuSuffix ? `${p?.baseSKU || ""}${variant.skuSuffix}` : p?.baseSKU) || item.sku,
            }
          })
        }

        setOrder(data)
        setNewStatus(data.orderStatus || "Pending")

        // Find warehouse
        const whList = Array.isArray(whRes) ? whRes : (whRes as any)?.data || []
        if (data.warehouseId) {
          const matched = whList.find((w: any) => String(w.warehouseId || w.id) === String(data.warehouseId))
          if (matched) setWarehouse(matched)
        } else if (data.shippingAddress) {
          const matched = whList.find((w: any) =>
            w.name && data.shippingAddress.toLowerCase().includes(w.name.toLowerCase())
          )
          if (matched) setWarehouse(matched)
        }

        // Match vendor details
        if (data.vendorId) {
          const vList = Array.isArray(vListRes) ? vListRes : (vListRes as any)?.data || []
          const matchedVendor = vList.find(
            (v: any) => String(v.id) === String(data.vendorId) || String(v.vendorId) === String(data.vendorId)
          )
          if (matchedVendor) {
            setVendor(matchedVendor)
          } else {
            try {
              const vRes = await vendorsApi.getById(String(data.vendorId))
              const vData = (vRes as any)?.data || vRes
              if (vData) setVendor(vData)
            } catch {
              // fallback: vendor not found or endpoint failed
            }
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load purchase order")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const handleUpdateStatus = async () => {
    if (!order || !id) return
    setIsSubmittingStatus(true)
    try {
      await purchaseOrderApi.updateStatus(id, newStatus, statusRemarks)
      toast.success(`Purchase order status updated to ${newStatus}`)
      setStatusDialogOpen(false)
      setOrder((prev) => (prev ? { ...prev, orderStatus: newStatus } : prev))
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status")
    } finally {
      setIsSubmittingStatus(false)
    }
  }

  const handleCopy = (text: string, label = "Order number") => {
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-60 w-full rounded-xl" />
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex-1 p-6 md:p-8 max-w-[800px] mx-auto text-center space-y-4">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-14 h-14 mx-auto flex items-center justify-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold">Purchase Order Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The purchase order you requested with ID #{id} does not exist or could not be loaded.
        </p>
        <Link to="/purchase">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Purchase Orders</span>
          </Button>
        </Link>
      </div>
    )
  }

  const statusInfo = getOrderStatusBadgeVariant(order.orderStatus)
  const paymentInfo = getPaymentStatusBadgeVariant(order.paymentStatus)
  const vendorDisplayName =
    vendor?.name || (vendor as any)?.vendorName || order.vendorName || `Vendor #${order.vendorId}`

  return (
    <div className="flex-1 p-6 md:p-8 max-w-[1400px] mx-auto space-y-6 pb-20 print:p-0 print:max-w-none">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/purchase">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg border bg-background hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight font-mono text-slate-900 dark:text-slate-100">
                {order.orderNumber}
              </h1>
              <button
                onClick={() => handleCopy(order.orderNumber)}
                className="text-muted-foreground/60 hover:text-foreground transition-colors p-1"
                title="Copy order number"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <Badge
                variant={statusInfo.variant}
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusInfo.className}`}
              >
                {order.orderStatus || "Draft"}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${paymentInfo.className}`}
              >
                {order.paymentStatus || "Pending"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
              <span>
                Issued on{" "}
                {order.orderDate
                  ? new Date(order.orderDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>Supplier: <strong className="text-slate-900 dark:text-slate-100">{vendorDisplayName}</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print PO</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handlePrint} className="cursor-pointer gap-2 text-xs">
                <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Quick Print</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/purchase/${order.purchaseOrderId}/print`)}
                className="cursor-pointer gap-2 text-xs"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Print / PDF Preview</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewStatus(order.orderStatus || "Draft")
              setStatusRemarks("")
              setStatusDialogOpen(true)
            }}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Update Status</span>
          </Button>

          <Link to={`/purchase/${order.purchaseOrderId}/edit`}>
            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs bg-primary text-primary-foreground shadow-xs"
            >
              <FileEdit className="h-4 w-4" />
              <span>Edit Order</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ──────────────── PRINT STYLES & PRINT ROOT ──────────────── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #purchase-order-print-root,
          #purchase-order-print-root * {
            visibility: visible;
          }
          #purchase-order-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print-hidden,
          .screen-only {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />

      {/* Hidden print document rendered for window.print() */}
      <div className="hidden print:block">
        <PurchaseOrderPrintDocument
          order={order}
          vendor={vendor}
          warehouse={warehouse}
          containerId="purchase-order-print-root"
        />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Items & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items Card */}
          <Card className="border shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <span>Procurement Line Items</span>
                </div>
                <span className="text-xs font-normal text-muted-foreground">
                  {order.lineItems?.length || 0} {(order.lineItems?.length || 0) === 1 ? "item" : "items"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/60 dark:bg-slate-900/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Product / Description</TableHead>
                    <TableHead className="text-xs font-semibold">SKU</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Quantity</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Unit Price</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Discount</TableHead>
                    <TableHead className="text-right text-xs font-semibold">Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.lineItems && order.lineItems.length > 0 ? (
                    order.lineItems.map((item, idx) => (
                      <TableRow key={item.orderItemId || idx} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            {item.productName || `Product #${item.productId}`}
                          </div>
                          {item.variantName && (
                            <div className="text-[11px] text-muted-foreground">
                              Variant: {item.variantName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {item.sku || "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatCurrency(item.unitPrice, order.currencyType || "INR")}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {Number(item.discountAmount || 0) > 0 ? (
                            <span>
                              {formatCurrency(item.discountAmount, order.currencyType || "INR")}{" "}
                              {item.discountPercentage ? `(${item.discountPercentage}%)` : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.totalPrice, order.currencyType || "INR")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs py-8 text-muted-foreground">
                        No line items recorded for this purchase order.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Order Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {order.orderNotes || "No special order notes specified."}
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Terms & Conditions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                  {order.termsAndConditions || "Standard procurement and inspection terms apply."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right 1 Column: Supplier, Logistics & Financials */}
        <div className="space-y-6">
          {/* Supplier Info */}
          <Card className="border shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Supplier Details</span>
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  {(vendor?.id || order.vendorId) && (
                    <Badge variant="outline" className="text-[10px] font-mono bg-background">
                      ID: #{vendor?.id || order.vendorId}
                    </Badge>
                  )}
                  {vendor?.status && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 ${
                        vendor.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {vendor.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px] font-medium mb-0.5">
                  Vendor / Supplier Name
                </span>
                <span className="font-semibold text-base text-slate-900 dark:text-slate-100 block">
                  {vendorDisplayName}
                </span>
              </div>

              {(vendor?.gstin || (vendor as any)?.GSTIN) && (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                      GSTIN / Tax ID
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 select-all">
                      {vendor?.gstin || (vendor as any)?.GSTIN}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                    title="Copy GSTIN"
                    onClick={() => handleCopy(vendor?.gstin || (vendor as any)?.GSTIN, "GSTIN")}
                  >
                    {copiedField === "GSTIN" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              )}

              {vendor?.contactPerson && (
                <div>
                  <span className="text-muted-foreground block text-[11px] font-medium mb-0.5">
                    Contact Person
                  </span>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{vendor.contactPerson}</span>
                  </div>
                </div>
              )}

              {vendor?.email && (
                <div>
                  <span className="text-muted-foreground block text-[11px] font-medium mb-0.5">
                    Email Address
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${vendor.email}`}
                        className="text-primary hover:underline font-medium truncate"
                      >
                        {vendor.email}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                      title="Copy Email"
                      onClick={() => handleCopy(vendor.email, "Email")}
                    >
                      {copiedField === "Email" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {vendor?.phone && (
                <div>
                  <span className="text-muted-foreground block text-[11px] font-medium mb-0.5">
                    Phone Number
                  </span>
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <a href={`tel:${vendor.phone}`} className="hover:underline font-medium">
                      {vendor.phone}
                    </a>
                  </div>
                </div>
              )}

              {(vendor?.address || order.billingAddress) && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground block text-[11px] font-medium mb-1">
                    Registered / Billing Address
                  </span>
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {vendor?.address || order.billingAddress}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t flex items-center justify-end">
                <Link
                  to="/supply-chain/vendors"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Vendors Directory</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Billing Locations */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Delivery & Addresses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-3 text-xs">
              {warehouse ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <WarehouseIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {warehouse.name}
                    </span>
                    {warehouse.address?.city && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {warehouse.address.city}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed pl-5">
                    {order.shippingAddress || "Not specified"}
                  </p>
                  {warehouse.contactPerson && (
                    <div className="text-[11px] text-muted-foreground mt-1 pl-5">
                      Contact: {warehouse.contactPerson} {warehouse.contactNumber ? `(${warehouse.contactNumber})` : ""}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <span className="text-muted-foreground block text-[11px] font-semibold mb-0.5">
                    Shipping Destination:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {order.shippingAddress || "Not specified"}
                  </p>
                </div>
              )}

              <div className="pt-2.5 border-t">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground text-[11px] font-semibold">
                    Supplier Billing Address:
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed pl-5">
                  {order.billingAddress || "Not specified"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>Cost Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(order.subtotal, order.currencyType || "INR")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GST / Taxes:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(order.gstAmount, order.currencyType || "INR")}
                </span>
              </div>

              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Total Amount:
                </span>
                <span className="text-lg font-extrabold text-primary">
                  {formatCurrency(order.totalAmount, order.currencyType || "INR")}
                </span>
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${paymentInfo.className}`}
                >
                  {order.paymentStatus || "Pending"}
                </Badge>
              </div>

              {order.expectedDeliveryDate && (
                <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Expected Delivery:
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {new Date(order.expectedDeliveryDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Status Update Modal */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Update Order Status
            </DialogTitle>
            <DialogDescription>
              Change status for purchase order{" "}
              <strong className="font-mono text-foreground">{order.orderNumber}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="status-select">Order Status</Label>
              <SearchableDropdown
                value={newStatus}
                onChange={(v) => setNewStatus(v || "Pending")}
                options={orderStatusOptions}
                placeholder="Select new status"
                popoverWidth={300}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-remarks">Remarks / Notes (Optional)</Label>
              <Textarea
                id="status-remarks"
                placeholder="Add any remarks or delivery comments..."
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={isSubmittingStatus}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isSubmittingStatus || !newStatus}
              className="gap-2"
            >
              {isSubmittingStatus ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>Save Status</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
