import * as React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  Package,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { creditNoteApi, salesOrderApi } from "@/lib/api"
import { ClientSelector } from "@/components/sales/client-selector"
import { ProductSelector } from "@/components/sales/product-selector"
import type { CreditNote, CreditNoteItem } from "./types"

interface CreditNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditNote?: CreditNote | null
  onSuccess: () => void
}

const RETURN_REASONS = [
  "Damaged Goods",
  "Defective / Quality Issue",
  "Incorrect Item Sent",
  "Customer Return / Cancellation",
  "Transit Damage",
  "Shortage / Missing Item",
  "Other",
]

export function CreditNoteDialog({
  open,
  onOpenChange,
  creditNote,
  onSuccess,
}: CreditNoteDialogProps) {
  const isEditing = Boolean(creditNote)

  const [clientId, setClientId] = useState<number>(0)
  const [clientName, setClientName] = useState<string>("")
  const [orderId, setOrderId] = useState<number>(0)
  const [orderNumber, setOrderNumber] = useState<string>("")
  const [status, setStatus] = useState<string>("Pending")
  const [items, setItems] = useState<CreditNoteItem[]>([])

  // Available orders for the selected client
  const [clientOrders, setClientOrders] = useState<any[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize or reset form
  useEffect(() => {
    if (open) {
      if (creditNote) {
        setClientId(creditNote.clientId || 0)
        setClientName(creditNote.clientName || "")
        setOrderId(creditNote.orderId || 0)
        setOrderNumber(creditNote.orderNumber || (creditNote.orderId ? `SO-${creditNote.orderId}` : ""))
        setStatus(creditNote.status || "Pending")
        const rawItems = (creditNote.items && creditNote.items.length > 0)
          ? creditNote.items
          : (creditNote.selectedProducts || [])

        setItems(
          rawItems.length > 0
            ? rawItems.map((p) => ({
              creditNoteItemId: p.creditNoteItemId,
              productId: p.productId,
              productName: p.productName || `Product #${p.productId}`,
              variantId: p.variantId || 0,
              variantName: p.variantName || "",
              sku: p.sku || "",
              quantity: p.quantity || 1,
              unitPrice: p.unitPrice || 0,
              totalPrice: p.totalPrice,
              returnReason: p.returnReason || "Customer Return / Cancellation",
            }))
            : []
        )
      } else {
        setClientId(0)
        setClientName("")
        setOrderId(0)
        setOrderNumber("")
        setStatus("Pending")
        setItems([])
        setClientOrders([])
      }
    }
  }, [open, creditNote])

  // Load orders for selected client
  useEffect(() => {
    if (clientId && clientId > 0) {
      setIsLoadingOrders(true)
      salesOrderApi
        .getAll({ ClientId: clientId, PageSize: 50 })
        .then((res: any) => {
          const list = Array.isArray(res) ? res : res?.data || []
          setClientOrders(list)
        })
        .catch((err) => {
          console.error("Failed to load client orders:", err)
          setClientOrders([])
        })
        .finally(() => setIsLoadingOrders(false))
    } else {
      setClientOrders([])
    }
  }, [clientId])

  // When order selection changes, use orderId to fetch full details via /api/SalesOrder/GetById/{id}
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false)

  const handleSelectOrder = async (selectedOrdId: string) => {
    const numId = Number(selectedOrdId)
    setOrderId(numId)

    if (!numId || numId === 0) {
      setOrderNumber("")
      return
    }

    try {
      setIsLoadingOrderDetails(true)
      const res = await salesOrderApi.getById(String(numId))
      const orderData = res?.data || res

      if (orderData) {
        setOrderNumber(orderData.orderNumber || `SO-${orderData.orderId || numId}`)

        // If client is not yet selected or differs, populate client details as well
        if (orderData.clientId && (!clientId || clientId === 0)) {
          setClientId(orderData.clientId)
          if (orderData.clientName) {
            setClientName(orderData.clientName)
          }
        }

        // Map order lineItems into return products
        if (orderData.lineItems && Array.isArray(orderData.lineItems) && orderData.lineItems.length > 0) {
          const orderProducts: CreditNoteItem[] = orderData.lineItems.map((li: any) => ({
            productId: li.productId,
            productName: li.productName || li.itemName || `Product #${li.productId}`,
            variantId: li.variantId || 0,
            variantName: li.variantName || "",
            sku: li.sku || "",
            quantity: li.quantity || 1,
            unitPrice: li.unitPrice || 0,
            returnReason: "Customer Return / Cancellation",
          }))
          setItems(orderProducts)
          toast.success(`Loaded ${orderProducts.length} items from Order ${orderData.orderNumber || numId}`)
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch order details by id:", err)
      toast.error("Could not fetch order details. Please try again.")
    } finally {
      setIsLoadingOrderDetails(false)
    }
  }

  // Handle product addition via ProductSelector
  const handleProductSelect = (product: any, variant: any) => {
    const pId = Number(product.productId)
    const vId = Number(variant?.variantId || 0)

    const existingIndex = items.findIndex(
      (i) => i.productId === pId && i.variantId === vId
    )

    if (existingIndex > -1) {
      toast.info("Product already in return list. Updated quantity.")
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it
        )
      )
      return
    }

    const newItem: CreditNoteItem = {
      productId: pId,
      productName: product.productName,
      variantId: vId,
      variantName: variant?.variantName || "",
      sku: `${product.baseSKU || ""}${variant?.skuSuffix || ""}`,
      quantity: 1,
      unitPrice: variant?.sellingPrice ?? product.sellingPrice ?? 0,
      returnReason: "Customer Return / Cancellation",
    }
    setItems((prev) => [...prev, newItem])
  }

  const handleUpdateItem = (
    index: number,
    field: keyof CreditNoteItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const totalReturnAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId || clientId === 0) {
      toast.error("Please select a client")
      return
    }

    if (items.length === 0) {
      toast.error("Please add at least one product to return")
      return
    }

    // Validate quantities and reasons
    for (const it of items) {
      if (it.quantity <= 0) {
        toast.error(`Quantity for ${it.productName || "Product"} must be greater than 0`)
        return
      }
      if (!it.returnReason || !it.returnReason.trim()) {
        toast.error(`Please select a return reason for ${it.productName || "all items"}`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      const selectedProductsPayload = items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId || 0,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        returnReason: it.returnReason,
      }))

      if (isEditing && creditNote?.creditNoteId) {
        const updatePayload = {
          creditNoteId: creditNote.creditNoteId,
          orderId: orderId || 0,
          clientId: clientId,
          status: status,
          selectedProducts: selectedProductsPayload,
        }
        await creditNoteApi.update(creditNote.creditNoteId, updatePayload)
        toast.success("Credit note updated successfully")
      } else {
        const createPayload = {
          orderId: orderId || 0,
          clientId: clientId,
          createdBy: 1, // User ID
          selectedProducts: selectedProductsPayload,
        }
        await creditNoteApi.create(createPayload)
        toast.success("Credit note created successfully")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error("Failed to save credit note:", err)
      toast.error(err?.message || "Failed to save credit note")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl w-[95vw] max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-amber-50/50">
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            {isEditing
              ? `Edit Credit Note: ${creditNote?.creditNoteNumber || ""}`
              : "Create New Credit Note (Goods Return)"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Fields: Client & Order */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Client / Clinic <span className="text-red-500">*</span>
              </Label>
              <ClientSelector
                selectedClientId={clientId ? String(clientId) : undefined}
                selectedClientName={clientName}
                onSelect={(c) => {
                  setClientId(Number(c.id))
                  setClientName(c.name)
                  setOrderId(0)
                  setOrderNumber("")
                }}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Link Sales Order (Optional)</Label>
              <Select
                value={orderId ? String(orderId) : ""}
                onValueChange={(val) => {
                  if (val) handleSelectOrder(val)
                }}
                disabled={!clientId || isLoadingOrders || isLoadingOrderDetails}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !clientId
                        ? "Select a client first"
                        : isLoadingOrders
                          ? "Loading orders..."
                          : isLoadingOrderDetails
                            ? "Fetching order details..."
                            : orderNumber || "Select sales order"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None / Direct Return</SelectItem>
                  {orderId > 0 && !clientOrders.some((ord: any) => ord.orderId === orderId) && (
                    <SelectItem value={String(orderId)}>
                      {orderNumber || `SO-${orderId}`}
                    </SelectItem>
                  )}
                  {clientOrders.map((ord: any) => (
                    <SelectItem key={ord.orderId} value={String(ord.orderId)}>
                      {ord.orderNumber || `SO-${ord.orderId}`} — (₹
                      {Number(ord.totalAmount || 0).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => {
                    if (val) setStatus(val)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Processed">Processed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Products Return List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Products for Return
                </h3>
                <p className="text-xs text-muted-foreground">
                  Specify items, quantities, refund rates, and return reasons.
                </p>
              </div>
              <div>
                <ProductSelector onSelect={handleProductSelect} />
              </div>
            </div>

            {items.length === 0 ? (
              <div className="border border-dashed rounded-xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center">
                <Package className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-600">
                  No return products added yet
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click "Select Product" above or choose a Sales Order to pre-fill.
                </p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[30%]">Product / Variant</TableHead>
                      <TableHead className="w-[15%]">Qty</TableHead>
                      <TableHead className="w-[18%]">Unit Price (₹)</TableHead>
                      <TableHead className="w-[25%]">Return Reason</TableHead>
                      <TableHead className="w-[12%] text-right">Subtotal</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => {
                      const lineTotal =
                        (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
                      return (
                        <TableRow key={idx}>
                          <TableCell className="align-top py-3">
                            <div className="font-medium text-slate-800 text-sm">
                              {item.productName}
                            </div>
                            {item.variantName && (
                              <div className="text-xs text-slate-500">
                                Variant: {item.variantName}
                              </div>
                            )}
                            {item.sku && (
                              <div className="text-[11px] font-mono text-slate-400">
                                SKU: {item.sku}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="align-top py-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(
                                  idx,
                                  "quantity",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="h-8 w-20 text-center"
                            />
                          </TableCell>

                          <TableCell className="align-top py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(
                                  idx,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 w-28 text-right"
                            />
                          </TableCell>

                          <TableCell className="align-top py-3">
                            <Select
                              value={item.returnReason}
                              onValueChange={(val) => {
                                if (val) handleUpdateItem(idx, "returnReason", val)
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Reason..." />
                              </SelectTrigger>
                              <SelectContent>
                                {RETURN_REASONS.map((r) => (
                                  <SelectItem key={r} value={r} className="text-xs">
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="align-top py-3 text-right font-semibold text-slate-800 text-sm">
                            ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>

                          <TableCell className="align-top py-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(idx)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {/* Footer calculation */}
                <div className="flex justify-between items-center p-4 bg-slate-50 border-t">
                  <span className="text-sm font-semibold text-slate-700">
                    Total Credit Amount:
                  </span>
                  <span className="text-xl font-bold text-amber-600">
                    ₹{totalReturnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white min-w-[130px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Credit Note"
              ) : (
                "Create Credit Note"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
