"use client"

import { useState, useEffect } from "react"
import { Order, OrderItem, OrderStatus, PaymentStatus } from "./types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Trash2, ShoppingCart, Calculator } from "lucide-react"
import { ClientSelector } from "@/components/sales/client-selector"
import { ProductSelector } from "@/components/sales/product-selector"
import { salesOrderApi, countryMasterApi, clientsApi, serializeAddress, usersApi, proformaApi } from "@/lib/api"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onSave: (data: Partial<Order>) => void
}

const GST_RATES = [0, 5, 12, 18, 28]

export function OrderFormDialog({ open, onOpenChange, order, onSave }: OrderFormDialogProps) {
  const [form, setForm] = useState<Partial<Order>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [currencies, setCurrencies] = useState<string[]>(["USD", "EUR", "GBP"])
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [proformas, setProformas] = useState<any[]>([])
  const [loadingLinked, setLoadingLinked] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        const res = await usersApi.getAll() as any
        const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : [])
        setUsers(list)
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoadingUsers(false)
      }
    }
    const fetchLinkedOptions = async () => {
      try {
        setLoadingLinked(true)
        const pList = await proformaApi.getAll()
        setProformas(pList)
      } catch (err) {
        console.error("Error fetching proformas:", err)
      } finally {
        setLoadingLinked(false)
      }
    }
    if (open) {
      fetchUsers()
      fetchLinkedOptions()
    }
  }, [open])

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await countryMasterApi.getAll()
        const list = Array.isArray(res) ? res : ((res as any)?.data && Array.isArray((res as any).data) ? (res as any).data : [])
        const uniqueCurrencies = Array.from(
          new Set(
            list
              .map((c: any) => c.currencyType?.trim())
              .filter((c: any) => c && c.toUpperCase() !== "INR")
          )
        ) as string[]
        if (uniqueCurrencies.length > 0) {
          setCurrencies(uniqueCurrencies)
        }
      } catch (err) {
        console.error("Failed to fetch currencies from country master:", err)
      }
    }
    fetchCurrencies()
  }, [])

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

  function calculateTotals(items: OrderItem[]) {
    const grossTotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const totalDiscount = items.reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)
    const totalAmount = grossTotal - totalDiscount
    const subtotal = items.reduce((sum, item) => {
      const netItemTotal = (item.unitPrice - ((item as any).discountAmount || 0)) * item.quantity
      const itemBase = netItemTotal / (1 + (item.gstRate || 0) / 100)
      return sum + itemBase
    }, 0)
    const taxAmount = totalAmount - subtotal
    return { subtotal, taxAmount, totalAmount }
  }

  useEffect(() => {
    const initForm = async () => {
      if (order) {
        const isForeign = (order as any).paymentType === "Foreign"
        
        let initialForm = {
          ...order,
          paymentType: (order as any).paymentType || "Domestic",
          currencyType: (order as any).currencyType || "INR",
        }

        setForm(initialForm)

        try {
          let clientId = order.clientId || ""
          let billingAddress = order.billingAddress || ""
          let shippingAddress = order.shippingAddress || ""

          // 1. Resolve client by name if ID is missing
          if (order.clientName && !clientId) {
            const list = await clientsApi.getAll()
            const match = list.find((c: any) => c.name?.toLowerCase().trim() === order.clientName?.toLowerCase().trim())
            if (match) {
              clientId = match.id
              // Always use client master's addresses when resolving client ID during conversion
              billingAddress = serializeAddress(match.billingAddress)
              shippingAddress = serializeAddress(match.shippingAddress)
            }
          }

          // 2. Resolve GST rates for items
          let items = order.items || []
          if (!isForeign && items.length > 0) {
            const resp = await apiClient.get<any>("/api/Product/GetAll")
            const products = resp.success && Array.isArray(resp.data) ? resp.data : []
            items = items.map(item => {
              const product = products.find((p: any) => String(p.productId) === String(item.productId))
              if (product) {
                const variant = product.variants?.find((v: any) => {
                  const sku = `${product.baseSKU}${v.skuSuffix}`
                  return sku === item.sku || v.variantName === item.name || v.variantName === item.productName
                }) || product.variants?.[0]
                const gstRate = variant?.gstPercentage ?? product.gstPercentage ?? 18
                return {
                  ...item,
                  gstRate
                }
              }
              return item
            })
          }

          const totals = calculateTotals(items)

          setForm(prev => ({
            ...prev,
            clientId,
            billingAddress,
            shippingAddress,
            items,
            ...totals
          }))
        } catch (err) {
          console.error("Error initializing order form details:", err)
        }
      } else {
        setForm({
          orderNumber: `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().split('T')[0],
          status: "Pending",
          paymentStatus: "Unpaid",
          paymentType: "Domestic",
          currencyType: "INR",
          items: [],
          subtotal: 0,
          taxAmount: 0,
          totalAmount: 0,
        })
      }
    }

    if (open) {
      initForm()
    }
  }, [order, open])

  // Auto-match salesperson name to user list, or resolve mock/invalid salesPersonId
  useEffect(() => {
    if (users.length > 0 && (form as any).salesPersonName) {
      const hasValidId = form.salesPersonId && users.some(u => String(u.userId) === String(form.salesPersonId))
      if (!hasValidId) {
        const match = users.find(u =>
          `${u.firstName} ${u.lastName}`.trim().toLowerCase() === (form as any).salesPersonName?.trim().toLowerCase()
        )
        if (match) {
          setForm(prev => ({ 
            ...prev, 
            salesPersonId: String(match.userId)
          }))
        }
      }
    }
  }, [users, (form as any).salesPersonName])

  const set = (field: keyof Order, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const onProductSelect = (product: any, variant: any) => {
    const sku = `${product.baseSKU}${variant.skuSuffix}`
    const exists = (form.items || []).some(item => item.sku === sku)
    if (exists) {
      toast.error(`"${product.productName} - ${variant.variantName}" is already included in this order.`)
      return
    }

    const isForeign = form.paymentType === "Foreign"
    const price = isForeign ? (variant.usdAmount || variant.exportSellingPrice || 0) : variant.sellingPrice

    const newItem: OrderItem = {
      id: Math.random().toString(36).substring(2, 9).slice(0, 8),
      productId: product.productId.toString(),
      productName: product.productName,
      name: variant.variantName,
      sku: sku,
      quantity: 1,
      unitPrice: price,
      total: price,
      gstRate: isForeign ? 0 : (variant.gstPercentage ?? product.gstPercentage ?? 18),
      imageUrl: variant.variantImage || product.imageUrl || "",
    }
    ;(newItem as any).discountPercentage = 0
    ;(newItem as any).discountAmount = 0
    ;(newItem as any).stock = variant.currentQuantity ?? 0
    ;(newItem as any).sellingPrice = variant.sellingPrice
    ;(newItem as any).usdAmount = variant.usdAmount || variant.exportSellingPrice || 0
    ;(newItem as any).gstRateOriginal = variant.gstPercentage ?? product.gstPercentage ?? 18

    if ((variant.currentQuantity ?? 0) < 1) {
      toast.warning(`Warning: "${product.productName} - ${variant.variantName}" is currently out of stock.`)
    }

    const newItems = [...(form.items || []), newItem]
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const updateItem = (id: string, field: keyof OrderItem | "discountPercentage", value: any) => {
    const newItems = (form.items || []).map(item => {
      if (item.id === id) {
        if (field === "quantity") {
          const qty = parseInt(value) || 0
          const stock = (item as any).stock
          if (stock !== undefined && qty > stock) {
            toast.error(`Requested quantity (${qty}) exceeds available stock (${stock}) for "${item.productName}".`)
          }
        }
        const updatedItem = { ...item, [field]: value } as any
        if (field === "quantity" || field === "unitPrice" || field === "discountPercentage") {
          const qty = updatedItem.quantity || 0
          const price = updatedItem.unitPrice || 0
          const discPct = updatedItem.discountPercentage || 0
          const discAmt = price * discPct / 100
          updatedItem.discountAmount = discAmt
          updatedItem.total = price * qty

          if (field === "unitPrice") {
            if (form.paymentType === "Foreign") {
              updatedItem.usdAmount = price
            } else {
              updatedItem.sellingPrice = price
            }
          }
        }
        return updatedItem as OrderItem
      }
      return item
    })
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const handlePaymentTypeChange = (newPaymentType: string) => {
    const newCurrency = newPaymentType === "Domestic" ? "INR" : "USD"
    setForm(prev => ({
      ...prev,
      paymentType: newPaymentType,
      currencyType: newCurrency,
      items: [],
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0
    }))
    toast.success("Payment type changed. Product selection cleared.")
  }

  const removeItem = (id: string) => {
    const newItems = (form.items || []).filter(item => item.id !== id)
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const handleSave = async () => {
    if (!form.clientId || (form.items || []).length === 0) return
    setIsSaving(true)
    
    try {
      const payload = {
        orderId: order?.orderId && !isNaN(Number(order.orderId)) ? Number(order.orderId) : 0,
        orderNumber: form.orderNumber || "",
        orderDate: new Date(form.date || new Date()).toISOString(),
        targetDeliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : new Date().toISOString(),
        clientId: isNaN(parseInt(String(form.clientId || ""))) ? 0 : parseInt(String(form.clientId || "")),
        orderStatus: form.status || "Pending",
        paymentStatus: form.paymentStatus || "Unpaid",
        salesPersonId: isNaN(parseInt(String(form.salesPersonId || ""))) ? 4 : parseInt(String(form.salesPersonId || "")),
        billingAddress: form.billingAddress || "",
        status: form.status || "Pending",
        shippingAddress: form.shippingAddress || form.billingAddress || "",
        subtotal: form.subtotal || 0,
        gstAmount: form.taxAmount || 0,
        totalAmount: form.totalAmount || 0,
        orderNotes: form.notes || "",
        linkedProformaInvoiceId: form.proformaId && !isNaN(parseInt(String(form.proformaId))) ? parseInt(String(form.proformaId)) : 0,
        linkedQuotationId: form.quotationId && !isNaN(parseInt(String(form.quotationId))) ? parseInt(String(form.quotationId)) : 0,
        parentOrderId: 0,
        paymentType: form.paymentType || "Domestic",
        currencyType: form.currencyType || "INR",
        lineItems: (form.items || []).map(item => ({
          orderItemId: item.orderItemId && !isNaN(Number(item.orderItemId)) ? Number(item.orderItemId) : 0,
          orderId: order?.orderId && !isNaN(Number(order.orderId)) ? Number(order.orderId) : 0,
          productId: isNaN(parseInt(item.productId)) ? 0 : parseInt(item.productId),
          sku: item.sku || "",
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice || 0,
          discountPercentage: item.discountPercentage || 0,
          discountAmount: item.discountAmount || 0,
          totalPrice: (item.unitPrice - (item.discountAmount || 0)) * item.quantity
        }))
      }

      if (order?.id && !isNaN(parseInt(order.id))) {
        await salesOrderApi.update(order.id, payload)
        toast.success("Sales Order updated successfully")
      } else {
        await salesOrderApi.create(payload)
        toast.success("Sales Order created successfully")
      }

      onSave(form)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to save Sales Order:", error)
      const errorMsg = error?.message || "Please try again."
      toast.error(`Failed to save Sales Order: ${errorMsg}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-emerald-50/50">
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-600" />
            {order ? "Edit Sales Order" : "Create New Sales Order"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="space-y-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Order Number</Label>
                <Input value={form.orderNumber} disabled className="bg-muted border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Order Date</Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="border-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Target Delivery</Label>
                <Input type="date" value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} className="border-slate-200" />
              </div>
            </div>

            {/* Linked Proforma / Quotation hierarchy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
              {/* Step 1: Pick a Proforma */}
              <div className="space-y-2">
                <Label className="text-slate-600 font-semibold">
                  Linked Proforma Invoice
                  {!order?.proformaId && <span className="text-slate-400 font-normal text-xs ml-1">(optional)</span>}
                </Label>
                {order?.proformaId ? (
                  // Read-only when converting from proforma
                  <div className="flex items-center gap-2 bg-slate-100/50 border border-slate-200 rounded-md px-3 py-2">
                    <span className="text-xs font-mono text-slate-700 font-bold">
                      {(() => {
                        const p = proformas.find((x: any) => String(x.proformaId) === String(form.proformaId))
                        return p ? (p.proformaNumber || p.number) : `PI-${form.proformaId}`
                      })()}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">ID: {form.proformaId}</span>
                  </div>
                ) : (
                  <Select
                    value={form.proformaId ? String(form.proformaId) : "none"}
                    onValueChange={(v) => {
                      if (v === "none") {
                        setForm(prev => ({ ...prev, proformaId: undefined, quotationId: undefined }))
                      } else {
                        const selected = proformas.find((p: any) => String(p.proformaId) === v)
                        const linkedQId = selected?.sourceQuotationId
                          ? parseInt(String(selected.sourceQuotationId))
                          : undefined
                        setForm(prev => ({
                          ...prev,
                          proformaId: v as string,
                          quotationId: linkedQId
                        }))
                      }
                    }}
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder={loadingLinked ? "Loading..." : "Select Proforma (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {proformas.map((p: any) => (
                        <SelectItem key={p.proformaId} value={String(p.proformaId)}>
                          <span className="font-bold">{p.proformaNumber || p.number}</span>
                          <span className="text-slate-500 ml-1 text-xs">— {p.clientName}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Step 2: Quotation auto-derived from selected Proforma */}
              <div className="space-y-2">
                <Label className="text-slate-600 font-semibold">Linked Quotation</Label>
                {(() => {
                  const linkedQId = form.quotationId ? String(form.quotationId) : null
                  const selectedProforma = form.proformaId
                    ? proformas.find((p: any) => String(p.proformaId) === String(form.proformaId))
                    : null
                  const quotationNumber = selectedProforma?.sourceQuotationId
                    ? `QT-${selectedProforma.sourceQuotationId}`
                    : null

                  if (!linkedQId || linkedQId === "0") {
                    return (
                      <div className="flex items-center gap-2 bg-slate-50 border border-dashed border-slate-200 rounded-md px-3 py-2 text-slate-400 text-xs italic">
                        {form.proformaId ? "No quotation linked to this proforma" : "Select a proforma first"}
                      </div>
                    )
                  }
                  return (
                    <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 rounded-md px-3 py-2">
                      <span className="text-xs font-bold font-mono text-emerald-700">{quotationNumber || `QT-${linkedQId}`}</span>
                      <span className="text-xs text-slate-400 ml-auto">ID: {linkedQId}</span>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Client / Doctor *</Label>
                <ClientSelector 
                    selectedClientId={form.clientId} 
                    selectedClientName={form.clientName}
                    onSelect={(c) => {
                        setForm(prev => ({
                          ...prev,
                          clientId: c.id,
                          clientName: c.name,
                          billingAddress: serializeAddress(c.billingAddress),
                          shippingAddress: serializeAddress(c.shippingAddress),
                        }))
                    }} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v as OrderStatus)}>
                    <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Packed">Packed</SelectItem>
                      <SelectItem value="Dispatched">Dispatched</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment</Label>
                  <Select value={form.paymentStatus} onValueChange={(v) => set("paymentStatus", v as PaymentStatus)}>
                    <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={form.paymentType || "Domestic"} onValueChange={(v) => handlePaymentTypeChange(v as string)}>
                  <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Domestic">Domestic</SelectItem>
                    <SelectItem value="Foreign">Foreign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency Type</Label>
                <Select value={form.currencyType || "INR"} disabled>
                  <SelectTrigger className="border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Ordered Items</h3>
                <ProductSelector onSelect={onProductSelect} paymentType={form.paymentType} />
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-[24%] font-bold text-slate-700">Product</TableHead>
                      <TableHead className="font-bold text-slate-700">SKU</TableHead>
                      <TableHead className="w-[8%] text-center font-bold text-slate-700">Qty</TableHead>
                      <TableHead className="w-[10%] text-right font-bold text-slate-700">Price</TableHead>
                      <TableHead className="w-[8%] text-center font-bold text-slate-700">Disc%</TableHead>
                      <TableHead className="w-[11%] text-right font-bold text-slate-700">Disc Amt</TableHead>
                      <TableHead className="w-[9%] text-center font-bold text-slate-700">GST %</TableHead>
                      <TableHead className="w-[12%] text-right font-bold text-slate-700">Total</TableHead>
                      <TableHead className="w-12.5"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-slate-400 italic">
                          No items in this order. Use "Add Product" to select items.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (form.items || []).map((item) => {
                        const isOverStock = (item as any).stock !== undefined && item.quantity > (item as any).stock
                        return (
                          <TableRow 
                            key={item.id} 
                            className={isOverStock ? "bg-orange-50/80 hover:bg-orange-100/80 border-orange-200 transition-colors" : "hover:bg-slate-50/50"}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                {(item as any).imageUrl && (
                                  <div className="h-10 w-10 rounded border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0 flex items-center justify-center">
                                    <img src={getGoogleDrivePreviewUrl((item as any).imageUrl) || ""} alt={item.productName} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-slate-900">{item.productName}</div>
                                  {(item as any).name && <div className="text-xs text-slate-500">{(item as any).name}</div>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-mono text-slate-500">{item.sku}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                min="1" 
                                value={item.quantity ?? ""} 
                                onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                className="h-8 text-center border-slate-200"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={item.unitPrice ?? ""} 
                                onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                className="h-8 text-right border-slate-200"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                min="0"
                                max="100"
                                value={(item as any).discountPercentage ?? ""} 
                                onChange={(e) => updateItem(item.id, "discountPercentage", parseFloat(e.target.value) || 0)}
                                className="h-8 text-center border-slate-200"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell className="text-right text-slate-600 font-medium">
                              {getCurrencySymbol(form.currencyType)}{(((item as any).discountAmount || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center font-medium text-slate-600 bg-slate-50/50">
                              {item.gstRate}%
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900">
                              {getCurrencySymbol(form.currencyType)}{item.total.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeItem(item.id)}
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Billing Address</Label>
                  <Textarea 
                    placeholder="Full billing address..." 
                    rows={2} 
                    value={form.billingAddress} 
                    onChange={(e) => set("billingAddress", e.target.value)} 
                    className="border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Shipping Address</Label>
                  <Textarea 
                    placeholder="Full shipping address..." 
                    rows={2} 
                    value={form.shippingAddress} 
                    onChange={(e) => set("shippingAddress", e.target.value)} 
                    className="border-slate-200"
                  />
                </div>
              </div>

               <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl space-y-4 shadow-sm">
                <div className="flex justify-between text-slate-500 text-sm italic">
                  <span>{form.paymentType === "Foreign" ? "Gross Total" : "Gross Total (Incl. GST)"}</span>
                  <span className="text-slate-900 font-medium">{getCurrencySymbol(form.currencyType)}{form.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {form.items?.some(item => (item as any).discountAmount > 0) && (
                  <div className="flex justify-between text-slate-500 text-sm italic">
                    <span>Total Discount</span>
                    <span className="text-rose-600 font-medium">- {getCurrencySymbol(form.currencyType)}{form.items?.reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                {form.paymentType !== "Foreign" && (
                  <>
                    <Separator className="bg-slate-200/50" />
                    <div className="flex justify-between text-slate-500 text-xs italic">
                      <span>Subtotal (Excl. GST)</span>
                      <span className="text-slate-900 font-medium">{getCurrencySymbol(form.currencyType)}{form.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-xs italic">
                      <span>Total GST (Included)</span>
                      <span className="text-emerald-600 font-medium">{getCurrencySymbol(form.currencyType)}{form.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
                <Separator className="bg-slate-200" />
                <div className="flex justify-between font-bold text-xl items-baseline pt-2">
                  <span className="text-slate-700">Final Order Total</span>
                  <span className="text-emerald-700 tracking-tight font-extrabold text-3xl">{getCurrencySymbol(form.currencyType)}{form.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-4 flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-bold opacity-75">
                  <Calculator className="h-3 w-3" />
                  Real-time synchronization active
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Label className="text-sm font-semibold text-slate-700">Order Notes / Commission Details</Label>
              <Textarea 
                placeholder="Any specific order instructions, sales person notes..." 
                value={form.notes} 
                onChange={(e) => set("notes", e.target.value)} 
                className="border-slate-200"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-slate-50 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving} className="text-slate-500">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.clientId || (form.items || []).length === 0 || isSaving} className="min-w-[160px] bg-emerald-600 hover:bg-emerald-700">
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              order ? "Update Sales Order" : "Generate Final Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
