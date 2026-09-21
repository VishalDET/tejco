import { useState, useEffect, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Save,
  ShoppingBag,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Truck,
  CheckCircle2,
  Percent,
  LayoutGrid,
  List,
  Tag,
  Layers,
  Calculator,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { purchaseOrderApi, vendorsApi, productsApi, warehousesApi } from "@/lib/api"
import {
  PurchaseOrder,
  PurchaseOrderItem,
  CreatePurchaseOrderPayload,
  RestockLineItem,
  formatCurrency,
} from "./types"
import { Vendor } from "@/app/supply-chain/vendors/types"
import { Warehouse } from "@/app/supply-chain/warehouse/types"
import { SearchableDropdown, SearchableOption } from "@/components/common/searchable-dropdown"

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrder | null
  isEdit?: boolean
  /** Pre-fill line items from low/OOS inventory variants */
  prefilledItems?: RestockLineItem[]
  /** When true, shows an amber restock info banner */
  restockMode?: boolean
}

export function PurchaseOrderForm({ initialData, isEdit = false, prefilledItems, restockMode = false }: PurchaseOrderFormProps) {
  const navigate = useNavigate()

  // Master Data
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => {
    return initialData?.warehouseId ? String(initialData.warehouseId) : ""
  })
  const [isLoadingMasters, setIsLoadingMasters] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Form State
  const [vendorId, setVendorId] = useState<number>(initialData?.vendorId || 0)
  const [orderNumber, setOrderNumber] = useState<string>(
    initialData?.orderNumber ||
    `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(
      new Date().getDate()
    ).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`
  )
  const [orderDate, setOrderDate] = useState<string>(
    initialData?.orderDate ? initialData.orderDate.split("T")[0] : new Date().toISOString().split("T")[0]
  )
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    initialData?.expectedDeliveryDate ? initialData.expectedDeliveryDate.split("T")[0] : ""
  )
  const [orderStatus, setOrderStatus] = useState<string>(initialData?.orderStatus || "Draft")
  const [paymentStatus, setPaymentStatus] = useState<string>(initialData?.paymentStatus || "Pending")
  const [currencyType, setCurrencyType] = useState<string>(initialData?.currencyType || "INR")
  const [billingAddress, setBillingAddress] = useState<string>(initialData?.billingAddress || "")
  const [shippingAddress, setShippingAddress] = useState<string>(
    initialData?.shippingAddress || "Tejco Head Warehouse, Plot 14, Industrial Area, Mumbai 400001"
  )
  const [orderNotes, setOrderNotes] = useState<string>(initialData?.orderNotes || "")
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    initialData?.termsAndConditions ||
    "1. Delivery must be completed by the agreed expected delivery date.\n2. Goods are subject to physical inspection and quality acceptance upon arrival.\n3. Payment terms: 30 days from receipt of certified invoice and delivery slip."
  )

  // GST percentage control (e.g. 18%)
  const [gstPercentage, setGstPercentage] = useState<number>(() => {
    if (initialData && initialData.subtotal > 0 && initialData.gstAmount > 0) {
      return Math.round((initialData.gstAmount / initialData.subtotal) * 100)
    }
    return 18
  })

  // Line items state — seeded from prefilledItems (restock) or initialData or blank row
  const [lineItems, setLineItems] = useState<PurchaseOrderItem[]>(() => {
    // Priority 1: restock pre-fill
    if (prefilledItems && prefilledItems.length > 0) {
      return prefilledItems.map((item) => ({
        orderItemId: 0,
        purchaseOrderId: 0,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.suggestedQty,
        unitPrice: item.unitPrice,
        discountPercentage: 0,
        discountAmount: 0,
        totalPrice: item.suggestedQty * item.unitPrice,
      }))
    }
    // Priority 2: editing existing order
    if (initialData?.lineItems && initialData.lineItems.length > 0) {
      return initialData.lineItems.map((item) => ({
        orderItemId: item.orderItemId || 0,
        purchaseOrderId: initialData.purchaseOrderId || 0,
        productId: item.productId || 0,
        variantId: item.variantId || null,
        sku: item.sku || "",
        productName: item.productName || "",
        variantName: item.variantName || "",
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        discountPercentage: Number(item.discountPercentage || 0),
        discountAmount: Number(item.discountAmount || 0),
        totalPrice: Number(item.totalPrice || 0),
      }))
    }
    // Priority 3: blank row
    return [
      {
        orderItemId: 0,
        purchaseOrderId: 0,
        productId: 0,
        variantId: null,
        sku: "",
        quantity: 1,
        unitPrice: 0,
        discountPercentage: 0,
        discountAmount: 0,
        totalPrice: 0,
      },
    ]
  })

  // Load Vendors, Products & Warehouses
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [vRes, pRes, wRes] = await Promise.all([
          vendorsApi.getAll().catch(() => []),
          productsApi.getAll().catch(() => []),
          warehousesApi.getAll().catch(() => []),
        ])

        const vendorsList = Array.isArray(vRes) ? vRes : (vRes as any)?.data || []
        const productsList = Array.isArray(pRes) ? pRes : (pRes as any)?.data || []
        const warehousesList = Array.isArray(wRes) ? wRes : (wRes as any)?.data || []

        setVendors(vendorsList)
        setProducts(productsList)
        setWarehouses(warehousesList)

        // If editing or existing vendor, ensure address populated
        if (initialData?.vendorId) {
          const v = vendorsList.find(
            (item: any) => item.id === String(initialData.vendorId) || item.vendorId === initialData.vendorId
          )
          if (v && !initialData.billingAddress) {
            setBillingAddress(typeof v.address === "string" ? v.address : "")
          }
        }

        // Check if existing warehouse ID matches or correlate from shippingAddress
        if (initialData?.warehouseId) {
          setSelectedWarehouseId(String(initialData.warehouseId))
        } else if (initialData?.shippingAddress && warehousesList.length > 0) {
          const matched = warehousesList.find((w: any) =>
            w.name && initialData.shippingAddress.toLowerCase().includes(w.name.toLowerCase())
          )
          if (matched) {
            setSelectedWarehouseId(String(matched.id || matched.warehouseId))
          }
        }

        // If initialData has line items, enrich with product and variant names
        if (initialData?.lineItems && initialData.lineItems.length > 0) {
          setLineItems((prev) =>
            prev.map((item) => {
              const p = productsList.find((prod: any) => prod.productId === item.productId)
              const v = p?.variants?.find((varItem: any) => varItem.variantId === item.variantId)
              return {
                ...item,
                productName: item.productName || p?.productName || "",
                variantName: item.variantName || v?.variantName || "",
                sku: item.sku || (v?.skuSuffix ? `${p?.baseSKU || ""}${v.skuSuffix}` : p?.baseSKU) || item.sku,
              }
            })
          )
        }
      } catch (err: any) {
        console.error("Failed to load master records:", err)
      } finally {
        setIsLoadingMasters(false)
      }
    }

    loadMasters()
  }, [initialData])

  // Handle Vendor Change
  const handleVendorChange = (idStr: string) => {
    const idNum = parseInt(idStr, 10) || 0
    setVendorId(idNum)
    const selected = vendors.find(
      (v: any) => v.id === idStr || v.vendorId === idNum || String(v.vendorId) === idStr
    )
    if (selected) {
      if (!billingAddress && selected.address) {
        setBillingAddress(typeof selected.address === "string" ? selected.address : "")
      }
    }
  }

  // Memoized Searchable Options for Suppliers & Products
  const vendorOptions: SearchableOption[] = useMemo(() => {
    return vendors.map((v: any) => {
      const id = String(v.id || v.vendorId)
      const name = v.name || v.vendorName || `Vendor #${id}`
      const badge = v.vendorCode || (v.gstin ? `GST: ${v.gstin}` : undefined)
      const subLabel = [v.city, v.phone, v.email].filter(Boolean).join(" • ") || undefined

      return {
        value: id,
        label: name,
        badge,
        subLabel,
        keywords: [name, v.gstin || "", v.email || "", v.phone || "", v.vendorCode || "", v.city || ""],
      }
    })
  }, [vendors])

  const productOptions: SearchableOption[] = useMemo(() => {
    return products.map((p: any) => {
      const pId = String(p.productId)
      const variantCount = p.variants?.length || 0
      const minPrice = p.variants?.length
        ? Math.min(...p.variants.map((v: any) => Number(v.purchasePrice) || 0))
        : Number(p.purchasePrice) || 0

      return {
        value: pId,
        label: p.productName || `Product #${pId}`,
        badge: p.baseSKU || `ID: ${pId}`,
        subLabel: p.brand ? `Brand: ${p.brand}` : p.categoryName || undefined,
        price: minPrice > 0 ? minPrice : undefined,
        extra: variantCount > 0 ? `${variantCount} variant${variantCount > 1 ? "s" : ""}` : undefined,
        keywords: [
          p.productName || "",
          p.baseSKU || "",
          p.brand || "",
          ...(p.variants || []).map((v: any) => `${v.variantName} ${v.skuSuffix}`),
        ],
      }
    })
  }, [products])

  const getVariantOptions = (variantsList: any[]): SearchableOption[] => {
    return variantsList.map((v: any) => {
      const vId = String(v.variantId)
      return {
        value: vId,
        label: v.variantName || `Variant #${vId}`,
        badge: v.skuSuffix || undefined,
        price: v.purchasePrice ? Number(v.purchasePrice) : undefined,
        subLabel: v.hsnCode ? `HSN: ${v.hsnCode}` : undefined,
        keywords: [v.variantName || "", v.skuSuffix || "", v.hsnCode || ""],
      }
    })
  }

  // Memoized Warehouse Options & Selection
  const warehouseOptions: SearchableOption[] = useMemo(() => {
    return warehouses.map((w: any) => {
      const id = String(w.warehouseId || w.id)
      const name = w.name || w.warehouseName || `Warehouse #${id}`
      const addr = w.address
      const addrStr =
        typeof addr === "object" && addr
          ? [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")
          : typeof addr === "string"
          ? addr
          : ""

      return {
        value: id,
        label: name,
        badge: addr?.city || (w.contactNumber ? `Ph: ${w.contactNumber}` : undefined),
        subLabel: addrStr || undefined,
        extra: w.contactPerson ? `Contact: ${w.contactPerson}` : undefined,
        keywords: [
          name,
          addrStr,
          w.contactPerson || "",
          w.contactNumber || "",
          addr?.city || "",
          addr?.state || "",
        ],
      }
    })
  }, [warehouses])

  const handleWarehouseSelect = (wId: string) => {
    setSelectedWarehouseId(wId)
    if (!wId) return

    const wh = warehouses.find((w: any) => String(w.warehouseId || w.id) === wId)
    if (wh) {
      const addr = wh.address
      const fullAddr =
        typeof addr === "object" && addr
          ? [
              wh.name,
              addr.street,
              addr.city,
              addr.state,
              addr.pincode ? `PIN: ${addr.pincode}` : "",
            ]
              .filter(Boolean)
              .join(", ")
          : typeof addr === "string" && addr
          ? `${wh.name}, ${addr}`
          : wh.name
      setShippingAddress(fullAddr)
    }
  }

  // Static Dropdown Options
  const currencyOptions: SearchableOption[] = [
    { value: "INR", label: "INR (₹) - Indian Rupee", badge: "₹" },
    { value: "USD", label: "USD ($) - US Dollar", badge: "$" },
    { value: "EUR", label: "EUR (€) - Euro", badge: "€" },
    { value: "GBP", label: "GBP (£) - British Pound", badge: "£" },
  ]

  const orderStatusOptions: SearchableOption[] = [
    { value: "Draft", label: "Draft", badge: "Draft" },
    { value: "Pending", label: "Pending", badge: "Review" },
    { value: "Approved", label: "Approved", badge: "Ready" },
    { value: "Ordered", label: "Ordered", badge: "Placed" },
    { value: "Partially Received", label: "Partially Received", badge: "Partial" },
    { value: "Delivered", label: "Delivered", badge: "Complete" },
    { value: "Cancelled", label: "Cancelled", badge: "Void" },
  ]

  const paymentStatusOptions: SearchableOption[] = [
    { value: "Pending", label: "Pending", badge: "Unpaid" },
    { value: "Partially Paid", label: "Partially Paid", badge: "Partial" },
    { value: "Paid", label: "Paid", badge: "Completed" },
    { value: "Overdue", label: "Overdue", badge: "Urgent" },
  ]

  const gstRateOptions: SearchableOption[] = [
    { value: "0", label: "0%", badge: "Nil" },
    { value: "5", label: "5%", badge: "5% GST" },
    { value: "12", label: "12%", badge: "12% GST" },
    { value: "18", label: "18%", badge: "Standard 18%" },
    { value: "28", label: "28%", badge: "28% GST" },
  ]

  // Line Items View Mode & Helpers
  const [itemsViewMode, setItemsViewMode] = useState<"cards" | "table">("cards")

  const currencySymbol = useMemo(() => {
    switch ((currencyType || "").toUpperCase()) {
      case "USD":
        return "$"
      case "EUR":
        return "€"
      case "GBP":
        return "£"
      case "INR":
      default:
        return "₹"
    }
  }, [currencyType])

  const totalUnits = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)
  }, [lineItems])

  const updateLineItem = (index: number, updates: Partial<PurchaseOrderItem>) => {
    setLineItems((prev) => {
      const next = [...prev]
      const current = { ...next[index], ...updates }

      // Calculate discount amount and line total
      const qty = Number(current.quantity) || 0
      const price = Number(current.unitPrice) || 0
      const rawTotal = qty * price

      let discAmt = current.discountAmount
      if (
        updates.discountPercentage !== undefined ||
        updates.quantity !== undefined ||
        updates.unitPrice !== undefined
      ) {
        discAmt = (rawTotal * (Number(current.discountPercentage) || 0)) / 100
        current.discountAmount = Math.round(discAmt * 100) / 100
      } else if (updates.discountAmount !== undefined) {
        discAmt = Number(updates.discountAmount) || 0
        current.discountPercentage =
          rawTotal > 0 ? Math.round(((discAmt / rawTotal) * 100) * 100) / 100 : 0
      }

      current.totalPrice = Math.max(
        0,
        Math.round((rawTotal - (Number(current.discountAmount) || 0)) * 100) / 100
      )
      next[index] = current
      return next
    })
  }

  const handleQtyChange = (index: number, delta: number) => {
    const currentQty = Number(lineItems[index]?.quantity) || 1
    const newQty = Math.max(1, currentQty + delta)
    updateLineItem(index, { quantity: newQty })
  }

  const handleProductSelect = (index: number, productIdStr: string) => {
    const pId = parseInt(productIdStr, 10) || 0
    const prod = products.find((p) => p.productId === pId)

    if (prod) {
      // Pick first variant if present
      const firstVariant = prod.variants && prod.variants.length > 0 ? prod.variants[0] : null
      const sku = firstVariant?.skuSuffix
        ? `${prod.baseSKU || ""}${firstVariant.skuSuffix}`
        : prod.baseSKU || `PRD-${pId}`
      const purchasePrice = Number(firstVariant?.purchasePrice || prod.purchasePrice || 0)

      updateLineItem(index, {
        productId: pId,
        variantId: firstVariant?.variantId || null,
        productName: prod.productName,
        variantName: firstVariant?.variantName || "",
        sku,
        unitPrice: purchasePrice,
      })
    } else {
      updateLineItem(index, {
        productId: pId,
        variantId: null,
        productName: "",
        variantName: "",
        sku: "",
        unitPrice: 0,
      })
    }
  }

  const handleVariantSelect = (index: number, variantIdStr: string) => {
    const vId = parseInt(variantIdStr, 10) || null
    const currentItem = lineItems[index]
    const prod = products.find((p) => p.productId === currentItem.productId)

    if (prod && vId) {
      const variant = prod.variants?.find((v: any) => v.variantId === vId)
      if (variant) {
        const sku = variant.skuSuffix
          ? `${prod.baseSKU || ""}${variant.skuSuffix}`
          : prod.baseSKU || `PRD-${prod.productId}`
        const purchasePrice = Number(variant.purchasePrice || 0)

        updateLineItem(index, {
          variantId: vId,
          variantName: variant.variantName,
          sku,
          unitPrice: purchasePrice > 0 ? purchasePrice : currentItem.unitPrice,
        })
      }
    } else {
      updateLineItem(index, {
        variantId: null,
        variantName: "",
      })
    }
  }

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        orderItemId: 0,
        purchaseOrderId: initialData?.purchaseOrderId || 0,
        productId: 0,
        variantId: null,
        sku: "",
        quantity: 1,
        unitPrice: 0,
        discountPercentage: 0,
        discountAmount: 0,
        totalPrice: 0,
      },
    ])
  }

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) {
      toast.error("A purchase order must have at least one line item")
      return
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Financial Totals
  const subtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0)
  }, [lineItems])

  const gstAmount = useMemo(() => {
    return Math.round(((subtotal * (Number(gstPercentage) || 0)) / 100) * 100) / 100
  }, [subtotal, gstPercentage])

  const totalAmount = useMemo(() => {
    return Math.round((subtotal + gstAmount) * 100) / 100
  }, [subtotal, gstAmount])

  // Form Submit
  const handleSubmit = async (overrideStatus?: string) => {
    if (!vendorId || vendorId === 0) {
      toast.error("Please select a vendor")
      return
    }

    if (!orderNumber.trim()) {
      toast.error("Please enter an order number")
      return
    }

    if (!orderDate) {
      toast.error("Please specify the order date")
      return
    }

    // Validate line items
    const invalidItems = lineItems.filter(
      (item) => !item.productId || item.productId === 0 || item.quantity <= 0
    )
    if (invalidItems.length > 0) {
      toast.error("Please choose a valid product and positive quantity for all line items")
      return
    }

    const finalStatus = overrideStatus || orderStatus

    const payload: CreatePurchaseOrderPayload = {
      purchaseOrderId: isEdit && initialData?.purchaseOrderId ? initialData.purchaseOrderId : 0,
      orderNumber: orderNumber.trim(),
      orderDate: new Date(orderDate).toISOString(),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate).toISOString() : null,
      vendorId,
      orderStatus: finalStatus,
      paymentStatus,
      billingAddress: billingAddress.trim(),
      shippingAddress: shippingAddress.trim(),
      warehouseId: selectedWarehouseId ? Number(selectedWarehouseId) : null,
      subtotal,
      gstAmount,
      totalAmount,
      currencyType,
      orderNotes: orderNotes.trim(),
      termsAndConditions: termsAndConditions.trim(),
      lineItems: lineItems.map((item) => ({
        orderItemId: item.orderItemId || 0,
        purchaseOrderId: isEdit && initialData?.purchaseOrderId ? initialData.purchaseOrderId : 0,
        productId: Number(item.productId),
        variantId: item.variantId ? Number(item.variantId) : null,
        sku: item.sku || "",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discountPercentage: Number(item.discountPercentage || 0),
        discountAmount: Number(item.discountAmount || 0),
        totalPrice: Number(item.totalPrice),
      })),
    }

    setIsSaving(true)
    try {
      if (isEdit && initialData?.purchaseOrderId) {
        await purchaseOrderApi.update(initialData.purchaseOrderId, payload)
        toast.success(`Purchase Order ${orderNumber} updated successfully`)
        navigate(`/purchase/${initialData.purchaseOrderId}`)
      } else {
        const res = await purchaseOrderApi.create(payload)
        toast.success(`Purchase Order ${orderNumber} created successfully`)
        const createdId = (res as any)?.data?.purchaseOrderId || (res as any)?.purchaseOrderId
        if (createdId) {
          navigate(`/purchase/${createdId}`)
        } else {
          navigate("/purchase")
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save purchase order")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isEdit ? `Edit Order #${orderNumber}` : "Create New Purchase Order"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit
                ? "Update line items, pricing, delivery schedule, and order terms."
                : "Fill in supplier details, line items, and terms to issue a procurement order."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/purchase">
            <Button
              variant="outline"
              disabled={isSaving}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
          </Link>

          <Button
            variant="secondary"
            onClick={() => handleSubmit("Draft")}
            disabled={isSaving}
            className="h-9 text-xs gap-1.5"
          >
            Save as Draft
          </Button>

          <Button
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className="h-9 text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isEdit ? "Update Order" : "Submit Purchase Order"}</span>
          </Button>
        </div>
      </div>

      {/* Restock Mode Banner */}
      {restockMode && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Restock Purchase Order
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              This order was auto-generated from your low / out-of-stock inventory.
              {" "}Review quantities, set a vendor, and adjust unit prices before submitting.
            </p>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              {lineItems.length} item{lineItems.length !== 1 ? "s" : ""} pre-filled
            </span>
          </div>
        </div>
      )}

      {/* Main Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Order Details & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <Card className="border shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Supplier & Order Info</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Select the supplier and set core purchase order attributes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vendor Selector */}
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="vendor-select" className="text-xs font-semibold">
                    Vendor / Supplier <span className="text-rose-500">*</span>
                  </Label>
                  <SearchableDropdown
                    value={vendorId ? String(vendorId) : ""}
                    onChange={(val) => handleVendorChange(val || "0")}
                    options={vendorOptions}
                    placeholder={isLoadingMasters ? "Loading suppliers..." : "Select Vendor / Supplier..."}
                    searchPlaceholder="Search supplier by name, GSTIN, city..."
                    icon={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
                    disabled={isLoadingMasters}
                    allowClear
                    popoverWidth={420}
                  />
                </div>

                {/* PO Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="po-number" className="text-xs font-semibold">
                    Purchase Order # <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="po-number"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. PO-2026-1001"
                    className="h-9 text-xs font-mono"
                  />
                </div>

                {/* Order Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="order-date" className="text-xs font-semibold">
                    Order Date <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="order-date"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Expected Delivery Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="expected-date" className="text-xs font-semibold">
                    Expected Delivery Date
                  </Label>
                  <Input
                    id="expected-date"
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="currency-select" className="text-xs font-semibold">
                    Currency
                  </Label>
                  <SearchableDropdown
                    value={currencyType}
                    onChange={(val) => setCurrencyType(val || "INR")}
                    options={currencyOptions}
                    placeholder="Currency"
                    popoverWidth={260}
                  />
                </div>

                {/* Order Status */}
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="status-select" className="text-xs font-semibold">
                    Order Status
                  </Label>
                  <SearchableDropdown
                    value={orderStatus}
                    onChange={(val) => setOrderStatus(val || "Draft")}
                    options={orderStatusOptions}
                    placeholder="Status"
                    popoverWidth={260}
                  />
                </div>
              </div>

              {/* Addresses & Destination Warehouse */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Supplier Billing Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="billing-addr" className="text-xs font-semibold flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    <span>Supplier Billing Address</span>
                  </Label>
                  <Textarea
                    id="billing-addr"
                    placeholder="Vendor's registered billing address..."
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    rows={4}
                    className="resize-none text-xs"
                  />
                </div>

                {/* Destination Warehouse & Shipping Address */}
                <div className="space-y-2.5">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="warehouse-select" className="text-xs font-semibold flex items-center gap-1.5">
                      <WarehouseIcon className="h-3.5 w-3.5 text-primary" />
                      <span>Destination Warehouse</span>
                    </Label>
                    <SearchableDropdown
                      value={selectedWarehouseId}
                      onChange={handleWarehouseSelect}
                      options={warehouseOptions}
                      placeholder={isLoadingMasters ? "Loading warehouses..." : "Select Destination Warehouse..."}
                      searchPlaceholder="Search warehouse by name, city, contact..."
                      icon={<WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                      disabled={isLoadingMasters}
                      allowClear
                      popoverWidth={420}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="shipping-addr" className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>Delivery Address (Auto-filled from warehouse or custom)</span>
                    </Label>
                    <Textarea
                      id="shipping-addr"
                      placeholder="Warehouse or clinic delivery location..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      rows={2}
                      className="resize-none text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card className="border shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/20">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    Procurement Line Items
                  </CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5">
                  Configure products, variants, quantities, and pricing for this order.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* View Mode Toggle */}
                <div className="flex items-center rounded-lg border bg-background p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setItemsViewMode("cards")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${itemsViewMode === "cards"
                        ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                    title="Card View (Spacious & Responsive)"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemsViewMode("table")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${itemsViewMode === "table"
                        ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                      }`}
                    title="Table View (Spreadsheet)"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>Table</span>
                  </button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer bg-background"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Item</span>
                </Button>
              </div>
            </CardHeader>

            {/* Quick Line Items Summary Ribbon */}
            <div className="px-4 py-2 bg-slate-100/70 dark:bg-slate-800/50 border-b flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">
                  {lineItems.length} {lineItems.length === 1 ? "Line Item" : "Line Items"}
                </span>
                <span className="text-border">|</span>
                <span>
                  Total Units: <strong className="text-foreground">{totalUnits}</strong>
                </span>
              </div>
              <div className="font-medium">
                Items Subtotal:{" "}
                <strong className="text-foreground font-bold text-sm">
                  {formatCurrency(subtotal, currencyType)}
                </strong>
              </div>
            </div>

            <CardContent className="p-0">
              {lineItems.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="p-3 rounded-full bg-muted w-12 h-12 mx-auto flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No items in this purchase order
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddLineItem}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add First Item</span>
                  </Button>
                </div>
              ) : itemsViewMode === "cards" ? (
                /* ----------------- CARDS VIEW (Fully Responsive & Spacious) ----------------- */
                <div className="p-4 sm:p-5 space-y-4">
                  {lineItems.map((item, index) => {
                    const selectedProduct = products.find((p) => p.productId === item.productId)
                    const variantsList = selectedProduct?.variants || []
                    const rawTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)

                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-card p-4 sm:p-5 space-y-4 shadow-2xs hover:border-primary/40 transition-all"
                      >
                        {/* Item Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <Badge variant="secondary" className="font-bold text-xs px-2.5 py-0.5 rounded-md">
                              Item #{index + 1}
                            </Badge>

                            {selectedProduct ? (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground">
                                  {selectedProduct.productName}
                                </span>
                                {item.sku && (
                                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                    {item.sku}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Select product details below
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            {/* Line Total Badge */}
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                              <span className="text-[11px] font-normal text-muted-foreground mr-1 hidden sm:inline">
                                Line Total:
                              </span>
                              <span>{formatCurrency(item.totalPrice, currencyType)}</span>
                            </div>

                            {/* Remove Item Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLineItem(index)}
                              disabled={lineItems.length === 1}
                              className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title={lineItems.length === 1 ? "At least one item required" : "Remove item"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Section 1: Product, Variant & SKU */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                          {/* Product Select */}
                          <div className="sm:col-span-5 space-y-1.5 min-w-0">
                            <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                              <span>Product <span className="text-rose-500">*</span></span>
                            </Label>
                            <SearchableDropdown
                              value={item.productId ? String(item.productId) : ""}
                              onChange={(val) => handleProductSelect(index, val || "0")}
                              options={productOptions}
                              placeholder="Search or select product..."
                              searchPlaceholder="Type product name, SKU, brand..."
                              allowClear
                              popoverWidth={440}
                            />
                          </div>

                          {/* Variant Select */}
                          <div className="sm:col-span-4 space-y-1.5 min-w-0">
                            <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Layers className="h-3.5 w-3.5 text-primary" />
                              <span>Variant / Specification</span>
                            </Label>
                            {variantsList.length > 0 ? (
                              <SearchableDropdown
                                value={item.variantId ? String(item.variantId) : ""}
                                onChange={(val) => handleVariantSelect(index, val || "")}
                                options={getVariantOptions(variantsList)}
                                placeholder="Select variant..."
                                searchPlaceholder="Search variant..."
                                popoverWidth={380}
                              />
                            ) : (
                              <div className="h-9 px-3 rounded-lg border border-dashed border-border bg-muted/40 flex items-center text-xs text-muted-foreground">
                                Standard / Base (No variants)
                              </div>
                            )}
                          </div>

                          {/* SKU Code */}
                          <div className="sm:col-span-3 space-y-1.5 min-w-0">
                            <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Tag className="h-3.5 w-3.5 text-primary" />
                              <span>SKU Code</span>
                            </Label>
                            <Input
                              value={item.sku}
                              onChange={(e) => updateLineItem(index, { sku: e.target.value })}
                              placeholder="e.g. PRD-001"
                              className="h-9 text-xs font-mono"
                            />
                          </div>
                        </div>

                        {/* Section 2: Pricing, Quantities & Calculation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
                          {/* Quantity */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Quantity
                            </Label>
                            <div className="flex items-center rounded-lg border bg-background overflow-hidden h-9">
                              <button
                                type="button"
                                onClick={() => handleQtyChange(index, -1)}
                                disabled={Number(item.quantity) <= 1}
                                className="h-full px-2.5 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateLineItem(index, {
                                    quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                                  })
                                }
                                className="h-full border-0 text-center text-sm font-semibold focus-visible:ring-0 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(index, 1)}
                                className="h-full px-2.5 text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Unit Price */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Unit Price ({currencySymbol})
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                {currencySymbol}
                              </span>
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  updateLineItem(index, {
                                    unitPrice: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="h-9 pl-7 pr-3 text-sm font-semibold"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {/* Discount */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Discount
                              </Label>
                              {Number(item.discountAmount) > 0 && (
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                  -{formatCurrency(item.discountAmount, currencyType)}
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step="any"
                                value={item.discountPercentage}
                                onChange={(e) =>
                                  updateLineItem(index, {
                                    discountPercentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                                  })
                                }
                                className="h-9 pr-6 text-sm"
                                placeholder="0"
                              />
                              <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            </div>
                          </div>

                          {/* Line Total Box */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Line Total
                            </Label>
                            <div className="h-9 px-3 rounded-lg border bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground truncate mr-1">
                                {item.quantity} × {currencySymbol}{Number(item.unitPrice || 0).toLocaleString()}
                              </span>
                              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                {formatCurrency(item.totalPrice, currencyType)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* ----------------- COMPACT SPREADSHEET TABLE VIEW ----------------- */
                <div className="overflow-x-auto">
                  <Table className="min-w-[1050px]">
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50 border-b">
                      <TableRow>
                        <TableHead className="w-[50px] text-center text-xs font-semibold">#</TableHead>
                        <TableHead className="min-w-[260px] text-xs font-semibold">Product & Variant</TableHead>
                        <TableHead className="w-[140px] text-xs font-semibold">SKU</TableHead>
                        <TableHead className="w-[130px] text-xs font-semibold">Quantity</TableHead>
                        <TableHead className="w-[150px] text-xs font-semibold">Unit Price ({currencySymbol})</TableHead>
                        <TableHead className="w-[130px] text-xs font-semibold">Discount (%)</TableHead>
                        <TableHead className="w-[150px] text-right text-xs font-semibold">Total Price</TableHead>
                        <TableHead className="w-[50px] text-center"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => {
                        const selectedProduct = products.find((p) => p.productId === item.productId)
                        const variantsList = selectedProduct?.variants || []

                        return (
                          <TableRow key={index} className="hover:bg-muted/30">
                            <TableCell className="text-center font-bold text-xs text-muted-foreground align-middle py-3">
                              {index + 1}
                            </TableCell>

                            {/* Product & Variant */}
                            <TableCell className="align-middle py-3">
                              <div className="space-y-1.5 min-w-[260px] max-w-[340px]">
                                <SearchableDropdown
                                  value={item.productId ? String(item.productId) : ""}
                                  onChange={(val) => handleProductSelect(index, val || "0")}
                                  options={productOptions}
                                  placeholder="Select Product"
                                  searchPlaceholder="Search product..."
                                  allowClear
                                  popoverWidth={440}
                                />

                                {variantsList.length > 0 && (
                                  <SearchableDropdown
                                    value={item.variantId ? String(item.variantId) : ""}
                                    onChange={(val) => handleVariantSelect(index, val || "")}
                                    options={getVariantOptions(variantsList)}
                                    placeholder="Select Variant"
                                    searchPlaceholder="Search variant..."
                                    size="sm"
                                    popoverWidth={360}
                                  />
                                )}
                              </div>
                            </TableCell>

                            {/* SKU */}
                            <TableCell className="align-middle py-3">
                              <Input
                                value={item.sku}
                                onChange={(e) => updateLineItem(index, { sku: e.target.value })}
                                placeholder="SKU"
                                className="h-9 text-xs font-mono"
                              />
                            </TableCell>

                            {/* Quantity */}
                            <TableCell className="align-middle py-3">
                              <div className="flex items-center rounded-lg border bg-background overflow-hidden h-9 w-[110px]">
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(index, -1)}
                                  disabled={Number(item.quantity) <= 1}
                                  className="h-full px-2 text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors flex items-center justify-center cursor-pointer"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateLineItem(index, {
                                      quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                                    })
                                  }
                                  className="h-full border-0 text-center text-xs font-semibold focus-visible:ring-0 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(index, 1)}
                                  className="h-full px-2 text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>

                            {/* Unit Price */}
                            <TableCell className="align-middle py-3">
                              <div className="relative w-[130px]">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                                  {currencySymbol}
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateLineItem(index, {
                                      unitPrice: Math.max(0, parseFloat(e.target.value) || 0),
                                    })
                                  }
                                  className="h-9 pl-6 text-xs font-semibold"
                                />
                              </div>
                            </TableCell>

                            {/* Discount */}
                            <TableCell className="align-middle py-3">
                              <div className="space-y-0.5 w-[110px]">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={item.discountPercentage}
                                    onChange={(e) =>
                                      updateLineItem(index, {
                                        discountPercentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                                      })
                                    }
                                    className="h-9 pr-5 text-xs"
                                  />
                                  <Percent className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                                </div>
                                {Number(item.discountAmount) > 0 && (
                                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    -{formatCurrency(item.discountAmount, currencyType)}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Total Price */}
                            <TableCell className="align-middle py-3 text-right">
                              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                {formatCurrency(item.totalPrice, currencyType)}
                              </div>
                            </TableCell>

                            {/* Action */}
                            <TableCell className="align-middle py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveLineItem(index)}
                                disabled={lineItems.length === 1}
                                className="h-8 w-8 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Add line item button at table bottom */}
              <div className="p-3 sm:p-4 border-t bg-slate-50/40 dark:bg-slate-900/20 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLineItem}
                  className="h-8 text-xs gap-1.5 text-primary hover:text-primary bg-background"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add another line item</span>
                </Button>

                <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                  Subtotal: <span className="font-bold text-foreground">{formatCurrency(subtotal, currencyType)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Order Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Additional notes for vendor or receiving team..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={4}
                  className="resize-none text-xs"
                />
              </CardContent>
            </Card>

            <Card className="border shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Terms & Conditions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Terms and conditions..."
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  rows={4}
                  className="resize-none text-xs font-mono text-[11px]"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right 1 Column: Cost Breakdown & Action Summary */}
        <div className="space-y-6">
          <Card className="border shadow-xs sticky top-6">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Financial Summary</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Review financial totals and apply GST before saving.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Payment Status */}
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="payment-select" className="text-xs font-semibold">
                  Payment Status
                </Label>
                <SearchableDropdown
                  value={paymentStatus}
                  onChange={(val) => setPaymentStatus(val || "Pending")}
                  options={paymentStatusOptions}
                  placeholder="Payment Status"
                  popoverWidth={240}
                />
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(subtotal, currencyType)}
                </span>
              </div>

              {/* GST % and Amount */}
              <div className="space-y-1.5 pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">GST Rate:</span>
                  <div className="w-[120px]">
                    <SearchableDropdown
                      value={String(gstPercentage)}
                      onChange={(v) => setGstPercentage(Number(v))}
                      options={gstRateOptions}
                      size="sm"
                      placeholder="GST %"
                      popoverWidth={200}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">GST Amount:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(gstAmount, currencyType)}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Total Amount:
                  </span>
                  <span className="text-xl font-extrabold text-primary">
                    {formatCurrency(totalAmount, currencyType)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Inclusive of all line items, discounts, and applicable taxes.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSaving}
                  className="w-full h-10 gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isEdit ? "Save Changes" : "Create Purchase Order"}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit("Draft")}
                  disabled={isSaving}
                  className="w-full h-9 text-xs"
                >
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
