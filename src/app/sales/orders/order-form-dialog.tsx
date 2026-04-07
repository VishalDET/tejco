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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Trash2, ShoppingCart, Calculator } from "lucide-react"

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onSave: (data: Partial<Order>) => void
}

const TAX_RATE = 0.18 // 18% GST

export function OrderFormDialog({ open, onOpenChange, order, onSave }: OrderFormDialogProps) {
  const [form, setForm] = useState<Partial<Order>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (order) {
      setForm(order)
    } else {
      setForm({
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
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
    const taxAmount = subtotal * TAX_RATE
    const totalAmount = subtotal + taxAmount
    return { subtotal, taxAmount, totalAmount }
  }

  const set = (field: keyof Order, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addItem = () => {
    const newItem: OrderItem = {
      id: crypto.randomUUID().slice(0, 8),
      productId: "",
      productName: "",
      sku: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
    const newItems = [...(form.items || []), newItem]
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    const newItems = (form.items || []).map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
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
    if (!form.clientName || (form.items || []).length === 0) return
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    onSave(form)
    setIsSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            {/* <ShoppingCart className="h-6 w-6 text-primary" /> */}
            {order ? "Edit Sales Order" : "Create New Sales Order"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 pt-2">
          <div className="space-y-6 pb-4">
            {/* Order Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Order #</Label>
                <Input id="orderNumber" value={form.orderNumber} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Order Date</Label>
                <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Target Delivery</Label>
                <Input id="deliveryDate" type="date" value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client / Doctor *</Label>
                <Input id="clientName" placeholder="Search client..." value={form.clientName || ""} onChange={(e) => set("clientName", e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Order Status</Label>
                  <Select value={form.status} onValueChange={(v) => v && set("status", v as OrderStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label htmlFor="paymentStatus">Payment</Label>
                  <Select value={form.paymentStatus} onValueChange={(v) => v && set("paymentStatus", v as PaymentStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesPersonId">Sales Person ID</Label>
                  <Input id="salesPersonId" placeholder="SP-001" value={form.salesPersonId || ""} onChange={(e) => set("salesPersonId", e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Line Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[300px]">Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[150px]">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                          No items added. Click "Add Item" to start.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (form.items || []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input placeholder="Search product..." value={item.productName} onChange={(e) => updateItem(item.id, "productName", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input placeholder="SKU" value={item.sku} onChange={(e) => updateItem(item.id, "sku", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{item.total.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
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

            {/* Totals and Shipping */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Textarea id="billingAddress" placeholder="Full billing address..." rows={2} value={form.billingAddress} onChange={(e) => set("billingAddress", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Textarea id="shippingAddress" placeholder="Full shipping address..." rows={2} value={form.shippingAddress} onChange={(e) => set("shippingAddress", e.target.value)} />
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{form.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span>₹{form.taxAmount?.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{form.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                    <Calculator className="h-3 w-3" /> Automatic calculation enabled
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Order Notes / Special Instructions</Label>
              <Textarea id="notes" placeholder="Any special requests or instructions..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.clientName || (form.items || []).length === 0 || isSaving}>
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              order ? "Update Order" : "Generate Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
