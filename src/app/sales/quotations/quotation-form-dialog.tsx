"use client"

import { useState, useEffect } from "react"
import { SalesDocument, SalesDocumentItem, SalesDocumentStatus } from "../types"
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

interface QuotationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: SalesDocument | null
  onSave: (data: Partial<SalesDocument>) => void
}

const GST_RATES = [0, 5, 12, 18, 28]

export function QuotationFormDialog({ open, onOpenChange, quotation, onSave }: QuotationFormDialogProps) {
  const [form, setForm] = useState<Partial<SalesDocument>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (quotation) {
      setForm(quotation)
    } else {
      const year = new Date().getFullYear()
      const random = Math.floor(1000 + Math.random() * 9000)
      setForm({
        number: `QUO-${year}-${random}`,
        date: new Date().toISOString().split('T')[0],
        status: "Draft",
        items: [],
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
      })
    }
  }, [quotation, open])

  const calculateTotals = (items: SalesDocumentItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0)
    const taxAmount = items.reduce((sum, item) => sum + ((item.total || 0) * (item.gstRate / 100)), 0)
    const totalAmount = subtotal + taxAmount
    return { subtotal, taxAmount, totalAmount }
  }

  const set = (field: keyof SalesDocument, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const onProductSelect = (product: any, variant: any) => {
    const newItem: SalesDocumentItem = {
      id: Math.random().toString(36).substring(2, 9).slice(0, 8),
      productId: product.productId.toString(),
      productName: product.productName,
      sku: `${product.baseSKU}${variant.skuSuffix}`,
      quantity: 1,
      unitPrice: variant.sellingPrice,
      total: variant.sellingPrice,
      gstRate: 18, // Default GST
    }
    const newItems = [...(form.items || []), newItem]
    const totals = calculateTotals(newItems)
    setForm(prev => ({ ...prev, items: newItems, ...totals }))
  }

  const updateItem = (id: string, field: keyof SalesDocumentItem, value: any) => {
    const newItems = (form.items || []).map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value } as SalesDocumentItem
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    onSave(form)
    setIsSaving(false)
    onOpenChange(false)
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

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6 pb-6">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Quotation Number</Label>
                <Input value={form.number} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Client / Doctor *</Label>
                <ClientSelector 
                  selectedClientId={form.clientId} 
                  onSelect={(c) => {
                    set("clientId", c.id)
                    set("clientName", c.name)
                    set("billingAddress", c.billingAddress)
                    set("shippingAddress", c.shippingAddress)
                  }} 
                />
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
                      <TableHead className="w-[30%]">Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="w-[10%] text-center">Qty</TableHead>
                      <TableHead className="w-[12%] text-right">Price</TableHead>
                      <TableHead className="w-[12%] text-center">GST %</TableHead>
                      <TableHead className="w-[15%] text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(form.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                          No items added. Click "Add Product" to search the inventory.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (form.items || []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-xs font-mono">{item.sku}</TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              min="1" 
                              value={item.quantity} 
                              onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                              className="h-8 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={item.unitPrice} 
                              onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-8 text-right"
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
                    value={form.billingAddress} 
                    onChange={(e) => set("billingAddress", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Address</Label>
                  <Textarea 
                    placeholder="Full shipping address..." 
                    rows={2} 
                    value={form.shippingAddress} 
                    onChange={(e) => set("shippingAddress", e.target.value)} 
                  />
                </div>
              </div>

              <div className="bg-muted/30 p-6 rounded-xl space-y-4 border border-muted-foreground/10">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{form.subtotal?.toLocaleString()}</span>
                </div>
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
                value={form.notes} 
                onChange={(e) => set("notes", e.target.value)} 
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/10 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Discard Changes</Button>
          <Button onClick={handleSave} disabled={!form.clientId || (form.items || []).length === 0 || isSaving} className="min-w-[140px]">
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
