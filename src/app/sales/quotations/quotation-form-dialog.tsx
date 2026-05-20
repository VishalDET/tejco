"use client"

import { useState, useEffect } from "react"
import { SalesDocument, SalesDocumentItem, SalesDocumentStatus } from "../types"
import { Quotation } from "./types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Trash2, FileText, Calculator } from "lucide-react"
import { ClientSelector } from "@/components/sales/client-selector"
import { ProductSelector } from "@/components/sales/product-selector"
import { quotationsApi, usersApi, serializeAddress } from "@/lib/api"
import { toast } from "sonner"

interface QuotationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  onSave: (data: Partial<Quotation>) => void
}

const GST_RATES = [0, 5, 12, 18, 28]

export function QuotationFormDialog({ open, onOpenChange, quotation, onSave }: QuotationFormDialogProps) {
  const [form, setForm] = useState<Partial<Quotation>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

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
    if (open) {
      fetchUsers()
    }
  }, [open])

  useEffect(() => {
    if (quotation) {
      setForm(quotation)
    } else {
      const year = new Date().getFullYear()
      const random = Math.floor(1000 + Math.random() * 9000)
      setForm({
        number: `QUO-${year}-${random}`,
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "Draft",
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        validityDays: 7,
        deliveryTime: "10-15 Working Days",
        salesPersonName: "Ravi Kumar",
        salesPersonCell: "+91-8888888888"
      })
    }
  }, [quotation, open])

  useEffect(() => {
    if (users.length > 0 && form.salesPersonName && !form.salesPersonId) {
      const match = users.find(u => `${u.firstName} ${u.lastName}`.trim().toLowerCase() === form.salesPersonName?.trim().toLowerCase())
      if (match) {
        setForm(prev => ({ ...prev, salesPersonId: String(match.userId) }))
      }
    }
  }, [users, form.salesPersonName, form.salesPersonId])

  const calculateTotals = (items: SalesDocumentItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0)
    const taxAmount = items.reduce((sum, item) => sum + ((item.total || 0) * (item.gstRate / 100)), 0)
    const totalAmount = subtotal + taxAmount
    return { subtotal, taxAmount, totalAmount }
  }

  const set = (field: keyof Quotation, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const onProductSelect = (product: any, variant: any) => {
    const newItem: SalesDocumentItem = {
      id: Math.random().toString(36).substring(2, 9).slice(0, 8),
      productId: product.productId.toString(),
      productName: product.productName,
      name: variant.variantName,
      sku: `${product.baseSKU}${variant.skuSuffix}`,
      quantity: 1,
      unitPrice: variant.sellingPrice,
      total: variant.sellingPrice,
      gstRate: variant.gstPercentage ?? 18,
      imageUrl: variant.variantImage || product.imageUrl || "" 
    }
    // Initialize discount fields
    ;(newItem as any).discountPercentage = 0
    ;(newItem as any).discountAmount = 0
    const newItems = [...(form.items || []), newItem]
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const updateItem = (id: string, field: keyof SalesDocumentItem | "discountPercentage", value: any) => {
    const newItems = (form.items || []).map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value } as any
        if (field === "quantity" || field === "unitPrice" || field === "discountPercentage") {
          const qty = updatedItem.quantity || 0
          const price = updatedItem.unitPrice || 0
          const discPct = updatedItem.discountPercentage || 0
          const discAmt = price * discPct / 100
          updatedItem.discountAmount = discAmt
          updatedItem.total = (price - discAmt) * qty
        }
        return updatedItem as SalesDocumentItem
      }
      return item
    })
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const removeItem = (id: string) => {
    const newItems = (form.items || []).filter(item => item.id !== id)
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const handleSave = async () => {
    if ((!form.clientId && !form.clientName) || (form.items || []).length === 0) return
    setIsSaving(true)
    
    try {
      // Map frontend state to API payload
      const payload = {
        quotationId: quotation?.id && !isNaN(parseInt(quotation.id)) ? parseInt(quotation.id) : 0,
        quotationNumber: form.number || "",
        quotationDate: new Date(form.date || new Date()).toISOString(),
        clientName: form.clientName || "",
        clientAddress: form.billingAddress || "",
        clientMobileNo: form.clientMobileNo || quotation?.clientMobileNo || "", 
        subject: form.subject || form.notes || "Quotation", 
        gstinNo: form.gstinNo || "",
        validityDays: form.validityDays || 7,
        deliveryTime: form.deliveryTime || "7-10 Days",
        salesPersonName: form.salesPersonName || "Admin",
        salesPersonCell: form.salesPersonCell || "",
        salesPersonId: form.salesPersonId ? String(form.salesPersonId) : "",
        createdAt: new Date().toISOString(),
        updatedAt: null,
        items: (form.items || []).map(item => ({
          quotationItemId: isNaN(parseInt(item.id)) ? 0 : parseInt(item.id),
          quotationId: quotation?.id && !isNaN(parseInt(quotation.id)) ? parseInt(quotation.id) : 0,
          productId: isNaN(parseInt(item.productId)) ? 0 : parseInt(item.productId),
          productName: item.productName || "",
          itemName: item.name || "",
          imageUrl: (item as any).imageUrl || "",
          price: item.unitPrice || 0,
          gstPercentage: item.gstRate || 0,
          quantity: item.quantity || 0,
          discountPercentage: (item as any).discountPercentage || 0,
          discountAmount: (item as any).discountAmount || 0
        }))
      }

      if (quotation?.id && !isNaN(parseInt(quotation.id))) {
        await quotationsApi.update(quotation.id, payload)
        toast.success("Quotation updated successfully")
      } else {
        await quotationsApi.create(payload)
        toast.success("Quotation created successfully")
      }
      
      onSave(form)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save quotation:", error)
      toast.error("Failed to save quotation. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-muted/20">
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {quotation ? "Edit Quotation" : "Create New Quotation"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="space-y-6 pb-6">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Quotation Number</Label>
                <Input value={form.number || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date ? form.date.split("T")[0] : ""} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input type="date" value={form.validUntil ? form.validUntil.split("T")[0] : ""} onChange={(e) => set("validUntil", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>
              <div className="space-y-2">
                <Label>Sales Representative *</Label>
                <Select 
                  value={form.salesPersonName || ""}
                  onValueChange={(val) => {
                    const selectedUser = users.find(u => `${u.firstName} ${u.lastName}` === val)
                    if (selectedUser) {
                      setForm(prev => ({
                        ...prev,
                        salesPersonName: val,
                        salesPersonCell: selectedUser.phone || "",
                        salesPersonId: String(selectedUser.userId)
                      } as Partial<Quotation>))
                    } else {
                      setForm(prev => ({
                        ...prev,
                        salesPersonName: val,
                        salesPersonId: undefined
                      } as Partial<Quotation>))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsers ? "Loading..." : "Select Sales Person"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => {
                      const fullName = `${u.firstName} ${u.lastName}`
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
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as SalesDocumentStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Issued">Issued</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input 
                placeholder="e.g. Surgical Blade L4, Testing Item Discounts, etc." 
                value={form.subject || ""} 
                onChange={(e) => set("subject", e.target.value)} 
              />
            </div>

            <Separator />

            {/* Line Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Line Items</h3>
                <ProductSelector onSelect={onProductSelect} />
              </div>

              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[25%]">Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="w-[10%] text-center">Qty</TableHead>
                      <TableHead className="w-[12%] text-right">Price</TableHead>
                      <TableHead className="w-[12%] text-center">Disc %</TableHead>
                      <TableHead className="w-[12%] text-center">GST %</TableHead>
                      <TableHead className="w-[15%] text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground italic">
                          No items added. Click "Add Product" to search the inventory.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (form.items || []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              {(item as any).imageUrl && (
                                <div className="h-10 w-10 rounded border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0 flex items-center justify-center">
                                  <img src={(item as any).imageUrl} alt={item.productName} className="h-full w-full object-contain" />
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
                              type="number" 
                              min="1" 
                              value={item.quantity ?? ""} 
                              onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                              className="h-8 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={item.unitPrice ?? ""} 
                              onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-8 text-right"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              min="0"
                              max="100"
                              value={(item as any).discountPercentage ?? 0} 
                              onChange={(e) => updateItem(item.id, "discountPercentage", parseFloat(e.target.value) || 0)}
                              className="h-8 text-center"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={item.gstRate.toString()} 
                              onValueChange={(v) => v && updateItem(item.id, "gstRate", parseInt(v))}
                            >
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {GST_RATES.map(rate => (
                                  <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{item.total.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Footer Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Billing Address</Label>
                  <Textarea 
                    placeholder="Full billing address..." 
                    rows={2} 
                    value={form.billingAddress || ""} 
                    onChange={(e) => set("billingAddress", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Address</Label>
                  <Textarea 
                    placeholder="Full shipping address..." 
                    rows={2} 
                    value={form.shippingAddress || ""} 
                    onChange={(e) => set("shippingAddress", e.target.value)} 
                  />
                </div>
              </div>

              <div className="bg-muted/30 p-6 rounded-xl space-y-4 border border-muted-foreground/10">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (Gross)</span>
                  <span className="font-medium">₹{form.items?.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)?.toLocaleString()}</span>
                </div>
                {form.items?.some(item => (item as any).discountAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Discount</span>
                    <span className="font-medium text-rose-600">- ₹{form.items?.reduce((sum, item) => sum + (((item as any).discountAmount || 0) * item.quantity), 0)?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total GST</span>
                  <span className="font-medium text-amber-600">+ ₹{form.taxAmount?.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-xl items-baseline">
                  <span>Grand Total</span>
                  <span className="text-primary tracking-tight font-extrabold text-2xl">₹{form.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="pt-2 flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-60">
                  <Calculator className="h-3 w-3" />
                  Calculated automatically
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Label>Notes / Terms & Conditions</Label>
              <Textarea 
                placeholder="Validity period, payment terms, or other instructions..." 
                value={form.notes || ""} 
                onChange={(e) => set("notes", e.target.value)} 
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Discard Changes</Button>
          <Button onClick={handleSave} disabled={(!form.clientId && !form.clientName) || (form.items || []).length === 0 || isSaving} className="min-w-[140px]">
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              quotation ? "Update Quotation" : "Save Quotation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
