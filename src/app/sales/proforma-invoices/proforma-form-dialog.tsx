
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
    if (!currency) return "\u20B9"
    switch (currency.toUpperCase()) {
      case "USD": return "$"
      case "EUR": return "\u20AC"
      case "GBP": return "\u00A3"
      case "INR": return "\u20B9"
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
        doctorSpeciality: (proforma as any).doctorSpeciality || "",
        clientGSTIN: (proforma as any).clientGSTIN || proforma.gstinNo || "",
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
        doctorSpeciality: "",
        clientGSTIN: "",
      })
    }
  }, [proforma, open])

  useEffect(() => {
    const resolveClientId = async () => {
      if (form.clientName && !form.clientId) {
        try {
          const res = await clientsApi.getAll()
          const match = res.clients.find((c: any) => c.name?.toLowerCase().trim() === form.clientName?.toLowerCase().trim())
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
    const isForeign = form.paymentType === "Foreign"

    // Subtotal is sum of discounted base prices
    const subtotal = items.reduce((sum, item) => {
      const price = item.unitPrice || 0
      const gstRate = isForeign ? 0 : (item.gstRate || 0)
      const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price
      const discAmt = (item as any).discountAmount || 0
      const discountedBase = Math.max(0, basePrice - discAmt)
      return sum + (discountedBase * item.quantity)
    }, 0)

    // Total GST calculated on the discounted base amount
    const taxAmount = isForeign ? 0 : items.reduce((sum, item) => {
      const price = item.unitPrice || 0
      const gstRate = item.gstRate || 0
      const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price
      const discAmt = (item as any).discountAmount || 0
      const discountedBase = Math.max(0, basePrice - discAmt)
      return sum + (discountedBase * (gstRate / 100) * item.quantity)
    }, 0)

    // Grand total is subtotal + taxAmount + freight
    const totalAmount = subtotal + taxAmount + (form.freight || 0)

    return { subtotal, taxAmount, totalAmount }
  }

  const set = (field: keyof ProformaInvoice, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const onProductSelect = (product: any, variant: any) => {
    const sku = `${product.baseSKU || ""}${variant.skuSuffix || ""}` || variant.variantName || product.productName
    const exists = (form.items || []).some(item => item.sku === sku && (item as any).variantId === (variant.variantId || variant.id))
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
      ; (newItem as any).variantId = variant.variantId || variant.id || 0
      ; (newItem as any).discountPercentage = 0
      ; (newItem as any).discountAmount = 0
      ; (newItem as any).stock = variant.currentQuantity ?? 0
      ; (newItem as any).sellingPrice = variant.sellingPrice
      ; (newItem as any).usdAmount = variant.usdAmount || variant.exportSellingPrice || 0
      ; (newItem as any).gstRateOriginal = variant.gstPercentage ?? product.gstPercentage ?? 18

    if ((variant.currentQuantity ?? 0) < 1) {
      toast.warning(`Warning: "${product.productName} - ${variant.variantName}" is currently out of stock.`)
    }

    const newItems = [...(form.items || []), newItem]
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const updateItem = (id: string, field: keyof SalesDocumentItem | "discountPercentage" | "discountAmount", value: any) => {
    const isForeign = form.paymentType === "Foreign"
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
        const qty = updatedItem.quantity || 0
        const price = updatedItem.unitPrice || 0
        const gstRate = isForeign ? 0 : (updatedItem.gstRate || 0)

        // 1. Minus GST from price to get base price:
        const basePrice = gstRate > 0 ? price / (1 + gstRate / 100) : price

        // 2. Apply discount on base price:
        if (field === "discountPercentage") {
          const discPct = Math.max(0, Math.min(100, parseFloat(value) || 0))
          updatedItem.discountPercentage = discPct
          const discAmt = parseFloat((basePrice * (discPct / 100)).toFixed(2))
          updatedItem.discountAmount = discAmt
        } else if (field === "discountAmount") {
          const discAmt = Math.max(0, parseFloat(value) || 0)
          updatedItem.discountAmount = discAmt
          const discPct = basePrice > 0 ? parseFloat(((discAmt / basePrice) * 100).toFixed(2)) : 0
          updatedItem.discountPercentage = discPct
        } else if (field === "unitPrice") {
          if (form.paymentType === "Foreign") {
            updatedItem.usdAmount = price
          } else {
            updatedItem.sellingPrice = price
          }
          const discPct = updatedItem.discountPercentage || 0
          updatedItem.discountAmount = parseFloat((basePrice * (discPct / 100)).toFixed(2))
        }

        // 3. Discounted base price after subtracting discount:
        const discAmt = updatedItem.discountAmount || 0
        const discountedBase = Math.max(0, basePrice - discAmt)

        // 4. Apply mentioned GST % on the discounted amount to get the final unit price & line total:
        const finalUnitPrice = gstRate > 0 ? discountedBase * (1 + gstRate / 100) : discountedBase
        updatedItem.total = parseFloat((finalUnitPrice * qty).toFixed(2))

        return updatedItem as SalesDocumentItem
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
        piNo: form.number || form.proformaNumber || "",
        piDate: form.date ? (form.date.includes("T") ? form.date : new Date(form.date).toISOString()) : new Date().toISOString(),
        clientId: form.clientId && !isNaN(Number(form.clientId)) ? Number(form.clientId) : 0,
        billingName: form.clientName || "",
        billingAddress: form.billingAddress || "",
        freight: form.freight || 0,
        totalAmount: form.totalAmount || 0,
        deliveryTerms: form.deliveryTerms || form.deliveryTime || "10-15 Working Days",
        paymentTerms: form.paymentTerms || form.notes || "",
        paymentType: form.paymentType || "Domestic",
        currencyType: form.currencyType || "INR",
        salesPersonId: form.salesPersonId && !isNaN(Number(form.salesPersonId)) ? Number(form.salesPersonId) : 0,
        salesPersonName: form.salesPersonName || "",
        salesPersonCell: form.salesPersonCell || "",
        status: form.status || "Draft",
        linkedQuotationId: form.sourceQuotationId && !isNaN(Number(form.sourceQuotationId))
          ? Number(form.sourceQuotationId)
          : 0,
        createdAt: proforma?.date && proforma.date.includes("T") ? proforma.date : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorSpeciality: form.doctorSpeciality || (proforma as any)?.doctorSpeciality || "",
        clientGSTIN: form.clientGSTIN || form.gstinNo || (proforma as any)?.clientGSTIN || (proforma as any)?.gstinNo || "",
        items: (form.items || []).map(item => {
          const unitPrice = item.unitPrice || 0
          const discPct = (item as any).discountPercentage || 0
          const discAmt = (item as any).discountAmount !== undefined ? (item as any).discountAmount : (unitPrice * discPct / 100)
          const qty = item.quantity || 0
          const total = (unitPrice - discAmt) * qty

          return {
            proformaInvoiceItemId: isNaN(Number(item.id)) ? 0 : Number(item.id),
            proformaInvoiceId: existingId,
            productId: isNaN(Number(item.productId)) ? 0 : Number(item.productId),
            variantId: (item as any).variantId && !isNaN(Number((item as any).variantId)) ? Number((item as any).variantId) : 0,
            productName: item.productName || item.name || "",
            imageUrl: (item as any).imageUrl || "",
            quantity: qty,
            rate: unitPrice,
            discountPercentage: discPct,
            discountAmount: discAmt,
            total: total,
          }
        }),
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
              <div className="space-y-2 min-w-0">
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
                    set("gstinNo", c.gstin || "")
                    set("clientGSTIN", c.gstin || "")
                    set("doctorSpeciality", (c as any).doctorSpeciality || (c as any).speciality || (c as any).clientType || form.doctorSpeciality || "")
                  }}
                />
                {form.clientName && <p className="text-xs text-muted-foreground truncate">Selected: <strong>{form.clientName}</strong></p>}
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as SalesDocumentStatus)}>
                  <SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Sent to Client">Sent to Client</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Converted To Sales Order">Converted To Sales Order</SelectItem>
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
                    <SelectItem value="INR">INR (&#8377;)</SelectItem>
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

            {/* Subject, Doctor Speciality & Client GSTIN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={form.subject || ""}
                  onChange={(e) => set("subject", e.target.value)}
                  placeholder="e.g. Proforma for Surgical Equipment"
                />
              </div>
              <div className="space-y-2">
                <Label>Doctor Speciality</Label>
                <Input
                  value={form.doctorSpeciality || ""}
                  onChange={(e) => set("doctorSpeciality", e.target.value)}
                  placeholder="e.g. Dermatologist, Trichologist"
                />
              </div>
              <div className="space-y-2">
                <Label>Client GSTIN</Label>
                <Input
                  value={form.clientGSTIN || form.gstinNo || ""}
                  onChange={(e) => {
                    set("clientGSTIN", e.target.value)
                    set("gstinNo", e.target.value)
                  }}
                  placeholder="GSTIN Number"
                />
              </div>
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
                      <TableHead className="w-[20%] font-bold">Product</TableHead>
                      <TableHead className="w-[11%] font-bold">Variant</TableHead>
                      <TableHead className="w-[6%] text-center font-bold">Qty</TableHead>
                      <TableHead className="w-[18%] text-right font-bold">Price</TableHead>
                      <TableHead className="w-[7%] text-center font-bold">Disc %</TableHead>
                      <TableHead className="w-[11%] text-right font-bold">Disc Amt</TableHead>
                      <TableHead className="w-[7%] text-center font-bold">GST %</TableHead>
                      <TableHead className="w-[16%] text-right font-bold">Total</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
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
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate" title={item.productName}>{item.productName}</div>
                                  <div className="text-[11px] text-muted-foreground font-mono">{item.sku}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 font-medium">
                              {item.name || "—"}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" min="1" value={item.quantity ?? ""}
                                onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                className="h-8 text-center border-0 bg-transparent hover:bg-slate-100/80 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-none font-medium px-1 no-spinner"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col items-end">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <span className="text-xs text-muted-foreground font-semibold">{getCurrencySymbol(form.currencyType)}</span>
                                  <Input
                                    type="number"
                                    value={item.unitPrice ?? ""}
                                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                    className="h-8 text-right border-0 bg-transparent hover:bg-slate-100/80 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-none font-semibold px-1 no-spinner w-full min-w-[90px]"
                                  />
                                </div>
                                {form.paymentType !== "Foreign" && (item.gstRate || 0) > 0 && (
                                  <div className="text-[10px] text-muted-foreground whitespace-nowrap pr-1">
                                    Base: {getCurrencySymbol(form.currencyType)}{((item.unitPrice || 0) / (1 + (item.gstRate || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" min="0" max="100"
                                value={(item as any).discountPercentage !== undefined && (item as any).discountPercentage !== 0 ? (item as any).discountPercentage : ""}
                                onChange={(e) => updateItem(item.id, "discountPercentage", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                className="h-8 text-center border-0 bg-transparent hover:bg-slate-100/80 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-none font-medium px-1 no-spinner"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-xs text-muted-foreground font-semibold">{getCurrencySymbol(form.currencyType)}</span>
                                <Input
                                  type="number"
                                  min="0"
                                  value={(item as any).discountAmount !== undefined && (item as any).discountAmount !== 0 ? (item as any).discountAmount : ""}
                                  onChange={(e) => updateItem(item.id, "discountAmount", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                  className="h-8 text-right border-0 bg-transparent hover:bg-slate-100/80 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary shadow-none font-semibold px-1 no-spinner w-full min-w-[70px]"
                                  placeholder="0.00"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium text-slate-600 bg-slate-50/50">
                              {item.gstRate}%
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {getCurrencySymbol(form.currencyType)}{item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                {form.paymentType === "Foreign" ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Total</span>
                      <span className="font-medium">{getCurrencySymbol(form.currencyType)}{form.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {form.items?.some(item => (item as any).discountAmount > 0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Discount</span>
                        <span className="font-medium text-rose-600">- {getCurrencySymbol(form.currencyType)}{form.items?.reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* 1. Base Amount (Price minus GST) */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Base Value (Excl. GST)</span>
                      <span className="font-medium">
                        {getCurrencySymbol(form.currencyType)}
                        {form.items?.reduce((sum, item) => {
                          const price = item.unitPrice || 0
                          const gstRate = item.gstRate || 0
                          const base = gstRate > 0 ? price / (1 + gstRate / 100) : price
                          return sum + (base * item.quantity)
                        }, 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* 2. Total Discount applied on Base Amount */}
                    {form.items?.some(item => (item as any).discountAmount > 0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Discount (On Base Value)</span>
                        <span className="font-medium text-rose-600">
                          - {getCurrencySymbol(form.currencyType)}
                          {form.items?.reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {/* 3. Taxable Subtotal after Discount */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxable Subtotal</span>
                      <span className="font-medium">{getCurrencySymbol(form.currencyType)}{form.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {/* 4. GST on Discounted Subtotal */}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total GST</span>
                      <span className="font-medium text-emerald-600">{getCurrencySymbol(form.currencyType)}{form.taxAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}

                {/* 5. Freight Charges if any */}
                {form.freight !== undefined && form.freight > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Freight Charges</span>
                    <span className="font-medium text-slate-800">+ {getCurrencySymbol(form.currencyType)}{Number(form.freight).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
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
