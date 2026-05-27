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
import { salesOrderApi } from "@/lib/api"
import { toast } from "sonner"

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

  useEffect(() => {
    if (order) {
      setForm(order)
    } else {
      setForm({
        orderNumber: `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split('T')[0],
        status: "Pending",
        paymentStatus: "Unpaid",
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
      })
    }
  }, [order, open])

  const calculateTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0)
    const taxAmount = items.reduce((sum, item) => sum + ((item.total || 0) * ((item.gstRate || 0) / 100)), 0)
    const totalAmount = subtotal + taxAmount
    return { subtotal, taxAmount, totalAmount }
  }

  const set = (field: keyof Order, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const onProductSelect = (product: any, variant: any) => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substring(2, 9).slice(0, 8),
      productId: product.productId.toString(),
      productName: product.productName,
      name: variant.variantName,
      sku: `${product.baseSKU}${variant.skuSuffix}`,
      quantity: 1,
      unitPrice: variant.sellingPrice,
      total: variant.sellingPrice,
      gstRate: variant.gstPercentage ?? product.gstPercentage ?? 18,
      imageUrl: variant.variantImage || product.imageUrl || "",
    }
    const newItems = [...(form.items || []), newItem]
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    const newItems = (form.items || []).map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value } as OrderItem
        if (field === "quantity" || field === "unitPrice") {
          updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0)
        }
        return updatedItem
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
    if (!form.clientId || (form.items || []).length === 0) return
    setIsSaving(true)
    
    try {
      const payload = {
        orderId: order?.orderId && !isNaN(Number(order.orderId)) ? Number(order.orderId) : 0,
        orderNumber: form.orderNumber || "",
        orderDate: new Date(form.date || new Date()).toISOString(),
        deliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : undefined,
        clientName: form.clientName || "",
        clientAddress: form.billingAddress || "",
        clientMobileNo: "",
        gstinNo: "",
        salesPersonName: "Admin",
        salesPersonCell: "",
        salesPersonId: form.salesPersonId ? String(form.salesPersonId) : "SP-001",
        status: form.status || "Pending",
        paymentStatus: form.paymentStatus || "Unpaid",
        notes: form.notes || "",
        quotationId: form.quotationId ? String(form.quotationId) : undefined,
        proformaId: form.proformaId ? String(form.proformaId) : undefined,
        items: (form.items || []).map(item => ({
          orderItemId: item.orderItemId && !isNaN(Number(item.orderItemId)) ? Number(item.orderItemId) : 0,
          orderId: order?.orderId && !isNaN(Number(order.orderId)) ? Number(order.orderId) : 0,
          productId: isNaN(parseInt(item.productId)) ? 0 : parseInt(item.productId),
          productName: item.productName || "",
          itemName: item.name || "",
          imageUrl: item.imageUrl || "",
          price: item.unitPrice || 0,
          gstPercentage: item.gstRate || 0,
          quantity: item.quantity || 0,
          discountPercentage: item.discountPercentage || 0,
          discountAmount: item.discountAmount || 0
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

            {(form.quotationId || form.proformaId) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                {form.quotationId && (
                  <div className="space-y-2">
                    <Label className="text-slate-500 font-medium">Source Quotation ID</Label>
                    <Input value={form.quotationId} disabled className="bg-slate-100/50 border-slate-200 font-mono text-xs" />
                  </div>
                )}
                {form.proformaId && (
                  <div className="space-y-2">
                    <Label className="text-slate-500 font-medium">Source Proforma ID</Label>
                    <Input value={form.proformaId} disabled className="bg-slate-100/50 border-slate-200 font-mono text-xs" />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Client / Doctor *</Label>
                <ClientSelector 
                    selectedClientId={form.clientId} 
                    selectedClientName={form.clientName}
                    onSelect={(c) => {
                        set("clientId", c.id)
                        set("clientName", c.name)
                        set("billingAddress", c.billingAddress)
                        set("shippingAddress", c.shippingAddress)
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

            <Separator className="bg-slate-100" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Ordered Items</h3>
                <ProductSelector onSelect={onProductSelect} />
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-[30%] font-bold text-slate-700">Product</TableHead>
                      <TableHead className="font-bold text-slate-700">SKU</TableHead>
                      <TableHead className="w-[10%] text-center font-bold text-slate-700">Qty</TableHead>
                      <TableHead className="w-[12%] text-right font-bold text-slate-700">Price</TableHead>
                      <TableHead className="w-[12%] text-center font-bold text-slate-700">GST %</TableHead>
                      <TableHead className="w-[15%] text-right font-bold text-slate-700">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-slate-400 italic">
                          No items in this order. Use "Add Product" to select items.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (form.items || []).map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              {(item as any).imageUrl && (
                                <div className="h-10 w-10 rounded border border-slate-100 overflow-hidden bg-slate-50 flex-shrink-0 flex items-center justify-center">
                                  <img src={(item as any).imageUrl} alt={item.productName} className="h-full w-full object-contain" />
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
                              value={item.quantity} 
                              onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                              className="h-8 text-center border-slate-200"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={item.unitPrice} 
                              onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-8 text-right border-slate-200"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={(item.gstRate ?? 18).toString()} 
                              onValueChange={(v) => v && updateItem(item.id, "gstRate", parseInt(v))}
                            >
                              <SelectTrigger className="h-8 border-slate-200"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {GST_RATES.map(rate => (
                                  <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900">
                            ₹{item.total.toLocaleString()}
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
                      ))
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
                  <span>Subtotal</span>
                  <span className="text-slate-900 font-medium">₹{form.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-sm italic">
                  <span>Taxes (Multiple GST)</span>
                  <span className="text-emerald-600 font-medium">+ ₹{form.taxAmount?.toLocaleString()}</span>
                </div>
                <Separator className="bg-slate-200" />
                <div className="flex justify-between font-bold text-xl items-baseline pt-2">
                  <span className="text-slate-700">Final Order Total</span>
                  <span className="text-emerald-700 tracking-tight font-extrabold text-3xl">₹{form.totalAmount?.toLocaleString()}</span>
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
