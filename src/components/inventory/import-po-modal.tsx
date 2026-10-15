import * as React from "react"
import { useState, useEffect } from "react"
import {
  FileText,
  Search,
  CheckCircle2,
  Package,
  Building,
  Calendar,
  AlertCircle,
  ArrowRight,
  Filter,
  Warehouse,
  Tag
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { purchaseOrderApi } from "@/lib/api"
import type { PurchaseOrder } from "@/app/purchase/types"

interface ImportPoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPo: (po: PurchaseOrder) => void
}

export function ImportPoModal({
  open,
  onOpenChange,
  onSelectPo
}: ImportPoModalProps) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null)

  useEffect(() => {
    if (!open) return
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const res = await purchaseOrderApi.getAll()
        const list = Array.isArray(res)
          ? res
          : (res as any)?.data || (res as any)?.items || []
        setPurchaseOrders(list)
      } catch (err) {
        console.error("Failed to load purchase orders for inward import:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [open])

  const filteredOrders = purchaseOrders.filter((po) => {
    const term = searchTerm.toLowerCase()
    return (
      (po.orderNumber || "").toLowerCase().includes(term) ||
      (po.vendorName || "").toLowerCase().includes(term) ||
      (po.warehouseName || "").toLowerCase().includes(term)
    )
  })

  const handleConfirmImport = () => {
    if (!selectedPo) return
    onSelectPo(selectedPo)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-5xl lg:max-w-6xl xl:max-w-7xl h-[88vh] max-h-[92vh] flex flex-col p-6 font-mono">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            <DialogTitle className="text-base font-bold font-mono">
              Import from Approved Purchase Order
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-mono">
            Select an approved vendor purchase order to automatically pull line items, variants, expected quantities, and vendor details into this Inward Receipt.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative my-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PO Number (e.g. PO-...), Vendor Name, Warehouse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs font-mono bg-background"
            autoFocus
          />
        </div>

        {/* Content Area - Spacious 2-Column Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 my-2">
          {/* Left Column: PO List (5 cols) */}
          <div className="md:col-span-5 border border-border rounded-lg overflow-hidden flex flex-col bg-muted/10 h-full">
            <div className="p-2.5 bg-muted/30 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Purchase Orders ({filteredOrders.length})</span>
              <span className="text-[10px] text-muted-foreground">Select to preview</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <Loader layout="container" size="sm" text="Loading Purchase Orders..." />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-20 text-center text-xs text-muted-foreground font-mono">
                  No matching Purchase Orders found.
                </div>
              ) : (
                filteredOrders.map((po) => {
                  const isSelected = selectedPo?.purchaseOrderId === po.purchaseOrderId
                  const itemCount = (po.lineItems || []).length
                  return (
                    <div
                      key={po.purchaseOrderId}
                      onClick={() => setSelectedPo(po)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-foreground text-sm">
                          {po.orderNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            po.orderStatus === "Approved"
                              ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                              : po.orderStatus === "Ordered"
                              ? "border-blue-500/40 text-blue-600 bg-blue-500/10"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          {po.orderStatus || "Pending"}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Building className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate">{po.vendorName || `Vendor #${po.vendorId}`}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {itemCount} {itemCount === 1 ? "Item" : "Items"}
                          </span>
                          <span className="font-bold text-foreground">
                            ₹{(po.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected PO Details & Items Table (7 cols) */}
          <div className="md:col-span-7 border border-border rounded-lg bg-card flex flex-col justify-between h-full overflow-hidden shadow-xs">
            {selectedPo ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* PO Header Details Banner */}
                <div className="p-3.5 border-b border-border bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">
                          {selectedPo.orderNumber}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {selectedPo.orderStatus}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          {selectedPo.vendorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Warehouse className="h-3 w-3 text-muted-foreground" />
                          {selectedPo.warehouseName || "Main Central WH"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-muted-foreground">Gross Value</span>
                      <div className="text-base text-primary font-bold">
                        ₹{(selectedPo.totalAmount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="flex-1 overflow-y-auto p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Line Items & Variants to Inward ({(selectedPo.lineItems || []).length})
                  </span>

                  <div className="border border-border rounded-md overflow-hidden">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Product / Specification</th>
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3 text-center">Qty</th>
                          <th className="py-2 px-3 text-right">Unit Rate</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(selectedPo.lineItems || []).map((item, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="py-2 px-3">
                              <div className="font-semibold text-foreground">
                                {item.productName || `Product #${item.productId}`}
                              </div>
                              {item.variantName ? (
                                <Badge variant="outline" className="text-[10px] font-mono text-primary mt-0.5">
                                  {item.variantName}
                                </Badge>
                              ) : null}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground font-mono">
                              {item.sku || "-"}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-foreground">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-3 text-right">
                              ₹{(item.unitPrice || 0).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-medium">
                              ₹{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-3 stroke-[1.5] text-muted-foreground/40" />
                <p className="text-sm font-semibold text-foreground">No Purchase Order Selected</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Click any Purchase Order on the left panel to preview its line items, variant specifications, and ordered quantities.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3 flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-mono cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedPo}
            onClick={handleConfirmImport}
            className="text-xs font-mono bg-primary text-primary-foreground cursor-pointer"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Import Selected PO Items ({selectedPo?.lineItems?.length || 0} Lines)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
