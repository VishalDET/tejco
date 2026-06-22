"use client"

import { useState, useEffect } from "react"
import { SalesDocumentItem, SalesDocumentStatus } from "../types"
import { ProformaInvoice } from "./types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Trash2, Receipt, Calculator } from "lucide-react"
import { ClientSelector } from "@/components/sales/client-selector"
import { ProductSelector } from "@/components/sales/product-selector"
import { proformaApi, usersApi, serializeAddress, countryMasterApi, clientsApi } from "@/lib/api"
import { toast } from "sonner"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"

interface ProformaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proforma: ProformaInvoice | null
  onSave: (data: Partial<ProformaInvoice>) => void
}

const GST_RATES = [0, 5, 12, 18, 28]

export function ProformaFormDialog({ open, onOpenChange, proforma, onSave }: ProformaFormDialogProps) {
  const [form, setForm] = useState<Partial<ProformaInvoice>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [currencies, setCurrencies] = useState<string[]>(["USD", "EUR", "GBP"])

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

  // Fetch users for salesperson dropdown
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
    if (open) fetchUsers()
  }, [open])

  // Populate form when dialog opens
  useEffect(() => {
    if (proforma) {
      setForm({
        ...proforma,
        date: proforma.date ? proforma.date.split("T")[0] : new Date().toISOString().split("T")[0],
        paymentType: (proforma as any).paymentType || "Domestic",
        currencyType: (proforma as any).currencyType || "INR",
      })
    } else {
      const year = new Date().getFullYear()
      const random = Math.floor(1000 + Math.random() * 9000)
      setForm({
        number: `PI-${year}-${random}`,
        date: new Date().toISOString().split("T")[0],
        status: "Draft",
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        validityDays: 7,
        deliveryTime: "10-15 Working Days",
        deliveryTerms: "10-15 Working Days",
        paymentTerms: "",
        salesPersonName: "",
        salesPersonCell: "",
        subject: "",
        paymentType: "Domestic",
        currencyType: "INR",
      })
    }
  }, [proforma, open])

  useEffect(() => {
    const resolveClientId = async () => {
      if (form.clientName && !form.clientId) {
        try {
          const list = await clientsApi.getAll()
          const match = list.find((c: any) => c.name?.toLowerCase().trim() === form.clientName?.toLowerCase().trim())
          if (match) {
            setForm(prev => ({
              ...prev,
              clientId: match.id,
              billingAddress: prev.billingAddress || serializeAddress(match.billingAddress),
              shippingAddress: prev.shippingAddress || serializeAddress(match.shippingAddress),
            }))
          }
        } catch (err) {
          console.error("Failed to resolve client ID by name:", err)
        }
      }
    }
    if (open) {
      resolveClientId()
    }
  }, [form.clientName, form.clientId, open])

  // Auto-match salesperson name to user list, or resolve mock/invalid salesPersonId
  useEffect(() => {
    if (users.length > 0 && form.salesPersonName) {
      const hasValidId = form.salesPersonId && users.some(u => String(u.userId) === String(form.salesPersonId))
      
      if (!hasValidId) {
        const match = users.find(u =>
          `${u.firstName} ${u.lastName}`.trim().toLowerCase() === form.salesPersonName?.trim().toLowerCase()
        )
        if (match) {
          setForm(prev => ({ 
            ...prev, 
            salesPersonId: String(match.userId),
            salesPersonCell: match.mobile || match.phone || prev.salesPersonCell || ""
          }))
        } else {
          // Clear invalid/mock salesPersonId so user is forced to select a valid one
          setForm(prev => ({ ...prev, salesPersonId: undefined }))
        }
      }
    }
  }, [users, form.salesPersonName, form.salesPersonId])

  const calculateTotals = (items: SalesDocumentItem[]) => {
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

  const set = (field: keyof ProformaInvoice, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const onProductSelect = (product: any, variant: any) => {
    const sku = `${product.baseSKU}${variant.skuSuffix}`
    const exists = (form.items || []).some(item => item.sku === sku)
    if (exists) {
      toast.error(`"${product.productName} - ${variant.variantName}" is already included in this proforma.`)
      return
    }

    const isForeign = form.paymentType === "Foreign"
    const price = isForeign ? (variant.usdAmount || variant.exportSellingPrice || 0) : variant.sellingPrice

    const newItem: SalesDocumentItem = {
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
    setForm(prev => ({ ...prev, items: newItems, ...calculateTotals(newItems) }))
  }

  const updateItem = (id: string, field: keyof SalesDocumentItem | "discountPercentage", value: any) => {
    const newItems = (form.items || []).map(item => {
      if (item.id === id) {
        if (field === "quantity") {
          const qty = parseInt(value) || 0
          const stock = (item as any).stock
          if (stock !== undefined && qty > stock) {
            toast.error(`Requested quantity (${qty}) exceeds available stock (${stock}) for "${item.productName}".`)
          }
        }
        const updated = { ...item, [field]: value } as any
        if (field === "quantity" || field === "unitPrice" || field === "discountPercentage") {
          const qty = updated.quantity || 0
          const price = updated.unitPrice || 0
          const discPct = updated.discountPercentage || 0
          const discAmt = price * discPct / 100
          updated.discountAmount = discAmt
          updated.total = price * qty

          if (field === "unitPrice") {
            if (form.paymentType === "Foreign") {
              updated.usdAmount = price
            } else {
              updated.sellingPrice = price
            }
          }
        }
        return updated as SalesDocumentItem
      }
      return item
    })
    setForm(prev => ({ ...prev, items: newItems, ...calculateTotals(newItems) }))
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
    setForm(prev => ({ ...prev, items: newItems, ...calculateTotals(newItems) }))
  }

  const handleSave = async () => {
    if ((!form.clientId && !form.clientName) || (form.items || []).length === 0) return
    if (!form.salesPersonId) {
      toast.error("Please select a valid Sales Person")
      return
    }
    setIsSaving(true)

    try {
      const existingId = proforma?.proformaId && !isNaN(proforma.proformaId) ? proforma.proformaId : 0

      const payload = {
        proformaInvoiceId: existingId,
        piNo: form.number || "",
        piDate: new Date(form.date || new Date()).toISOString(),
        clientId: form.clientId && !isNaN(parseInt(String(form.clientId))) ? parseInt(String(form.clientId)) : 0,
        billingName: form.clientName || "",
        billingAddress: form.billingAddress || "",
        freight: form.freight || 0,
        totalAmount: form.totalAmount || 0,
        deliveryTerms: form.deliveryTerms || form.deliveryTime || "10-15 Working Days",
        paymentTerms: form.paymentTerms || form.notes || "",
        salesPersonName: form.salesPersonName || "",
        salesPersonCell: form.salesPersonCell || "",
        salesPersonId: form.salesPersonId ? String(form.salesPersonId) : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: form.status || "Draft",
        paymentType: form.paymentType || "Domestic",
        currencyType: form.currencyType || "INR",
        linkedQuotationId: form.sourceQuotationId && !isNaN(parseInt(String(form.sourceQuotationId)))
          ? parseInt(String(form.sourceQuotationId))
          : 0,
        items: (form.items || []).map(item => ({
          proformaInvoiceItemId: isNaN(parseInt(item.id)) ? 0 : parseInt(item.id),
          proformaInvoiceId: existingId,
          productId: isNaN(parseInt(item.productId)) ? 0 : parseInt(item.productId),
          productName: item.productName || "",
          imageUrl: (item as any).imageUrl || "",
          quantity: item.quantity || 0,
          rate: item.unitPrice || 0,
          discountPercentage: (item as any).discountPercentage || 0,
          discountAmount: (item as any).discountAmount || 0,
          total: (item.unitPrice - ((item as any).discountAmount || 0)) * item.quantity,
        })),
      }

      if (existingId > 0) {
        await proformaApi.update(String(existingId), payload)
        toast.success("Proforma invoice updated successfully")
      } else {
        await proformaApi.create(payload)
        toast.success("Proforma invoice created successfully")
      }

      onSave(form as Partial<ProformaInvoice>)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to save proforma:", error)
      const errorMsg = error?.message || "Please try again."
      toast.error(`Failed to save proforma invoice: ${errorMsg}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-muted/20">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {proforma ? "Edit Proforma Invoice" : "Create Proforma Invoice"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="space-y-6 pb-6">
            {/* Header Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>PI Number</Label>
                <Input value={form.number || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date ? form.date.split("T")[0] : ""} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Validity (Days)</Label>
                <Input type="number" min={1} value={form.validityDays ?? 7} onChange={(e) => set("validityDays", parseInt(e.target.value) || 7)} />
              </div>
            </div>

            {/* Client + Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Client / Doctor *</Label>
                <ClientSelector
                  selectedClientId={form.clientId}
                  selectedClientName={form.clientName}
                  onSelect={(c) => {
                    set("clientId", c.id)
                    set("clientName", c.name)
                    set("clientMobileNo", c.phone || "")
                    set("billingAddress", serializeAddress(c.billingAddress))
                    set("shippingAddress", serializeAddress(c.shippingAddress))
                    set("gstinNo", c.gstin)
                  }}
                />
                {form.clientName && <p className="text-xs text-muted-foreground">Selected: <strong>{form.clientName}</strong></p>}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as SalesDocumentStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Issued">Issued</SelectItem>
                    <SelectItem value="Converted to Sales Order">Converted to Sales Order</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Type + Currency Type */}
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

            {/* Sales Person */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Sales Person *</Label>
                <Select
                  value={form.salesPersonName || ""}
                  onValueChange={(val) => {
                    const selectedUser = users.find(u => `${u.firstName} ${u.lastName}`.trim() === val)
                    if (selectedUser) {
                      setForm(prev => ({
                        ...prev,
                        salesPersonName: val || "",
                        salesPersonCell: selectedUser.mobile || selectedUser.phone || "",
                        salesPersonId: String(selectedUser.userId)
                      }))
                    } else {
                      setForm(prev => ({
                        ...prev,
                        salesPersonName: val || "",
                        salesPersonId: undefined
                      }))
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder={loadingUsers ? "Loading..." : "Select sales person"} /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => {
                      const fullName = `${u.firstName} ${u.lastName}`.trim()
                      return (
                        <SelectItem key={u.userId} value={fullName}>
                          {fullName}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sales Person Cell</Label>
                <Input value={form.salesPersonCell || ""} onChange={(e) => set("salesPersonCell", e.target.value)} placeholder="+91-xxxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label>Delivery Terms</Label>
                <Input value={form.deliveryTerms || form.deliveryTime || ""} onChange={(e) => set("deliveryTerms", e.target.value)} placeholder="e.g. 10-15 Working Days" />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={form.subject || ""}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="e.g. Proforma for Surgical Equipment"
              />
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Line Items</h3>
                <ProductSelector onSelect={onProductSelect} paymentType={form.paymentType} />
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-[24%] font-bold">Product</TableHead>
                      <TableHead className="font-bold">SKU</TableHead>
                      <TableHead className="w-[8%] text-center font-bold">Qty</TableHead>
                      <TableHead className="w-[10%] text-right font-bold">Price</TableHead>
                      <TableHead className="w-[8%] text-center font-bold">Disc%</TableHead>
                      <TableHead className="w-[11%] text-right font-bold">Disc Amt</TableHead>
                      <TableHead className="w-[9%] text-center font-bold">GST %</TableHead>
                      <TableHead className="w-[12%] text-right font-bold">Total</TableHead>
                      <TableHead className="w-12.5"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground italic">
                          No items added. Click "Add Product" to search the inventory.
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
                                  <div className="h-10 w-10 rounded border border-slate-100 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                                    <img src={getGoogleDrivePreviewUrl((item as any).imageUrl) || ""} alt={item.productName} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-slate-900">{item.productName}</div>
                                  {item.name && <div className="text-xs text-slate-500">{item.name}</div>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-mono">{item.sku}</TableCell>
                            <TableCell>
                              <Input
                                type="number" min="1" value={item.quantity ?? ""}
                                onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                className="h-8 text-center"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" value={item.unitPrice ?? ""}
                                onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                className="h-8 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" min="0" max="100"
                                value={(item as any).discountPercentage ?? ""}
                                onChange={(e) => updateItem(item.id, "discountPercentage", parseFloat(e.target.value) || 0)}
                                className="h-8 text-center"
                              />
                            </TableCell>
                            <TableCell className="text-right text-slate-600 font-medium">
                              {getCurrencySymbol(form.currencyType)}{(((item as any).discountAmount || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center font-medium text-slate-600 bg-slate-50/50">
                              {item.gstRate}%
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {getCurrencySymbol(form.currencyType)}{item.total.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost" size="icon"
                                onClick={() => removeItem(item.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
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

            {/* Footer: Addresses + Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Billing Address</Label>
                  <Textarea
                    placeholder="Full billing address..."
                    value={typeof form.billingAddress === "object" ? "" : (form.billingAddress as string || "")}
                    onChange={(e) => set("billingAddress", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Address</Label>
                  <Textarea
                    placeholder="Full shipping address..."
                    value={typeof form.shippingAddress === "object" ? "" : (form.shippingAddress as string || "")}
                    onChange={(e) => set("shippingAddress", e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{form.paymentType === "Foreign" ? "Gross Total" : "Gross Total (Incl. GST)"}</span>
                  <span className="font-medium">{getCurrencySymbol(form.currencyType)}{form.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {(form.items || []).some(i => (i as any).discountPercentage > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Discount</span>
                    <span className="font-medium text-rose-600">
                      - {getCurrencySymbol(form.currencyType)}{form.items?.reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)?.toLocaleString()}
                    </span>
                  </div>
                )}
                {form.paymentType !== "Foreign" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal (Excl. GST)</span>
                      <span className="font-medium">{getCurrencySymbol(form.currencyType)}{form.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total GST (Included)</span>
                      <span className="font-medium text-amber-600">{getCurrencySymbol(form.currencyType)}{form.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-xl items-baseline">
                  <span>Grand Total</span>
                  <span className="text-primary tracking-tight font-extrabold text-2xl">{getCurrencySymbol(form.currencyType)}{form.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-60">
                  <Calculator className="h-3 w-3" />
                  Calculated automatically
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Label>Payment Terms / Notes</Label>
              <Textarea
                placeholder="Payment terms, validity period, or other instructions..."
                value={form.paymentTerms || form.notes || ""}
                onChange={(e) => set("paymentTerms", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Discard Changes</Button>
          <Button
            onClick={handleSave}
            disabled={(!form.clientId && !form.clientName) || (form.items || []).length === 0 || isSaving}
            className="min-w-40"
          >
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              proforma ? "Update Proforma" : "Save Proforma"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
