import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { stockInwardApi, vendorsApi, warehousesApi, productsApi } from "@/lib/api"
import type { InwardOrder, InwardOrderItem } from "../types"
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Package,
  FileText
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"

export default function StockInwardFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [productsList, setProductsList] = useState<any[]>([])

  const [form, setForm] = useState<Partial<InwardOrder>>({
    inwardOrderId: 0,
    orderNumber: `INW-${Math.floor(100000 + Math.random() * 900000)}`,
    vendorId: 0,
    vendorName: "",
    warehouseId: 0,
    warehouseName: "",
    warehouseCode: "",
    orderDate: new Date().toISOString(),
    status: "Pending",
    priority: "Normal",
    receiverName: "Admin User",
    items: [],
    scanHistory: []
  })

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [vRes, wRes, pRes] = await Promise.all([
          vendorsApi.getAll().catch(() => []),
          warehousesApi.getAll().catch(() => []),
          productsApi.getAll().catch(() => [])
        ])
        setVendors(Array.isArray(vRes) ? vRes : (vRes as any)?.data || [])
        setWarehouses(Array.isArray(wRes) ? wRes : (wRes as any)?.data || [])
        setProductsList(Array.isArray(pRes) ? pRes : (pRes as any)?.data || [])
      } catch (err: any) {
        console.error("Failed to load master options", err)
      }
    }

    fetchMasterData()

    if (isEdit && id) {
      const fetchRecord = async () => {
        try {
          const res = await stockInwardApi.getById(id)
          const data = (res as any)?.data || res
          if (data) {
            setForm({
              ...data,
              orderDate: data.orderDate || data.inwardDate || new Date().toISOString()
            })
          }
        } catch (err: any) {
          toast.error(err?.message || "Failed to load Stock Inward order details")
        } finally {
          setLoading(false)
        }
      }
      fetchRecord()
    }
  }, [id, isEdit])

  const handleVendorSelect = (vId: number) => {
    const vendor = vendors.find(v => (v.vendorId || v.id) === vId)
    setForm(prev => ({
      ...prev,
      vendorId: vId,
      vendorName: vendor ? (vendor.vendorName || vendor.name || "") : ""
    }))
  }

  const handleWarehouseSelect = (wId: number) => {
    const warehouse = warehouses.find(w => Number(w.warehouseId || w.id || 0) === wId)
    setForm(prev => ({
      ...prev,
      warehouseId: wId,
      warehouseName: warehouse ? (warehouse.name || warehouse.warehouseName || "") : "",
      warehouseCode: warehouse ? (warehouse.code || warehouse.warehouseCode || `WH-${wId}`) : ""
    }))
  }

  const handleAddItem = () => {
    const newItem: InwardOrderItem = {
      inwardOrderItemId: 0,
      inwardOrderId: isEdit ? parseInt(id || "0") : 0,
      productId: 0,
      variantId: 0,
      productName: "",
      variantName: "",
      sku: "",
      barcode: "",
      expectedQty: 1,
      receivedQty: 0,
      locationCode: "RACK-A1"
    }
    setForm(prev => ({ ...prev, items: [...(prev.items || []), newItem] }))
  }

  const handleRemoveItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }))
  }

  const handleItemChange = (index: number, field: keyof InwardOrderItem, val: any) => {
    setForm(prev => {
      const updated = [...(prev.items || [])]
      const current = { ...updated[index], [field]: val }

      if (field === "productId") {
        const prodIdNum = parseInt(val)
        const prod = productsList.find(p => (p.productId || p.id) === prodIdNum)
        if (prod) {
          current.productId = prodIdNum
          current.productName = prod.productName || prod.name || ""
          current.sku = prod.sku || `SKU-${prodIdNum}`
          current.barcode = prod.barcode || `BAR-${prodIdNum}`
          current.variantId = prod.variantId || 0
          current.variantName = prod.variantName || "Default Variant"
        }
      }

      updated[index] = current
      return { ...prev, items: updated }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendorId || form.vendorId === 0) {
      toast.error("Please select a vendor")
      return
    }
    if (!form.warehouseId || form.warehouseId === 0) {
      toast.error("Please select a target warehouse")
      return
    }
    if (!form.items || form.items.length === 0) {
      toast.error("Please add at least one item to the inward receipt")
      return
    }

    const payload: InwardOrder = {
      inwardOrderId: isEdit ? parseInt(id || "0") : 0,
      orderNumber: form.orderNumber || form.inwardNumber || `INW-${Date.now()}`,
      vendorId: form.vendorId,
      vendorName: form.vendorName || "",
      warehouseId: form.warehouseId,
      warehouseName: form.warehouseName || "",
      warehouseCode: form.warehouseCode || "",
      orderDate: form.orderDate || new Date().toISOString(),
      status: form.status || "Pending",
      priority: form.priority || "Normal",
      receiverName: form.receiverName || "Admin User",
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: (form.items || []).map(i => ({
        inwardOrderItemId: i.inwardOrderItemId || 0,
        inwardOrderId: isEdit ? parseInt(id || "0") : 0,
        productId: i.productId,
        variantId: i.variantId || 0,
        productName: i.productName || "",
        variantName: i.variantName || "Default",
        sku: i.sku || `SKU-${i.productId}`,
        barcode: i.barcode || `BAR-${i.productId}`,
        expectedQty: i.expectedQty || i.expectedQuantity || 1,
        receivedQty: i.receivedQty || i.receivedQuantity || 0,
        locationCode: i.locationCode || "RACK-A1"
      })),
      scanHistory: form.scanHistory || []
    }

    setSubmitting(true)
    try {
      if (isEdit && id) {
        await stockInwardApi.update(id, payload)
        toast.success("Stock Inward record updated successfully")
      } else {
        await stockInwardApi.create(payload)
        toast.success("Stock Inward record created successfully")
      }
      navigate("/inventory/stock-inward")
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Stock Inward order")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader layout="container" size="md" text="Loading Stock Inward order..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-foreground">
              {isEdit ? `Edit Inward Order: ${form.orderNumber}` : "Create Stock Inward Order"}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              record stock inwards
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Details Card */}
        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-3 pt-0 px-4 border-b border-border">
            <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Inward Receipt Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Order Number</label>
              <Input
                value={form.orderNumber || ""}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                className="mt-1 text-xs font-mono bg-background"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Order Date</label>
              <Input
                type="datetime-local"
                value={form.orderDate ? new Date(form.orderDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => setForm({ ...form, orderDate: new Date(e.target.value).toISOString() })}
                className="mt-1 text-xs font-mono bg-background"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Receiver Name</label>
              <Input
                value={form.receiverName || ""}
                onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                className="mt-1 text-xs font-mono bg-background"
              />
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Vendor Partner</label>
              <select
                value={form.vendorId || 0}
                onChange={(e) => handleVendorSelect(parseInt(e.target.value))}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono shadow-2xs focus:outline-hidden"
                required
              >
                <option value={0}>Select Vendor...</option>
                {vendors.map(v => (
                  <option key={v.vendorId || v.id} value={v.vendorId || v.id}>
                    {v.vendorName || v.name || `Vendor #${v.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Target Warehouse</label>
              <select
                value={form.warehouseId || 0}
                onChange={(e) => handleWarehouseSelect(parseInt(e.target.value))}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono shadow-2xs focus:outline-hidden"
                required
              >
                <option value={0}>Select Target Warehouse...</option>
                {warehouses.map((w: any) => {
                  const val = Number(w.warehouseId || w.id || 0)
                  const name = w.name || w.warehouseName || `Warehouse #${val}`
                  return (
                    <option key={w.id || w.warehouseId || val} value={val}>
                      {name}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Priority</label>
              <select
                value={form.priority || "Normal"}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-mono shadow-2xs focus:outline-hidden"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Line Items Table */}
        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-3 pt-0 px-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Inward Items Schema (`InwardOrderItem`)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Select master products, SKUs, and location codes.
              </CardDescription>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={handleAddItem} className="font-mono text-xs cursor-pointer">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {(!form.items || form.items.length === 0) ? (
              <div className="py-8 text-center text-muted-foreground font-mono text-xs">
                No product items added yet. Click "Add Item" above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Product</th>
                      <th className="py-2.5 px-4">SKU / Barcode</th>
                      <th className="py-2.5 px-4 w-28">Expected Qty</th>
                      <th className="py-2.5 px-4 w-32">Location Code</th>
                      <th className="py-2.5 px-4 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {form.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-4">
                          <select
                            value={item.productId || 0}
                            onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-mono shadow-2xs"
                            required
                          >
                            <option value={0}>Select Product...</option>
                            {productsList.map(p => (
                              <option key={p.productId || p.id} value={p.productId || p.id}>
                                {p.productName || p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{item.sku || "-"}</span>
                            <span className="text-[10px] text-muted-foreground">{item.barcode || "-"}</span>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            type="number"
                            min="1"
                            value={item.expectedQty || 1}
                            onChange={(e) => handleItemChange(idx, "expectedQty", parseInt(e.target.value) || 0)}
                            className="h-8 text-xs font-mono bg-background"
                            required
                          />
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            value={item.locationCode || "RACK-A1"}
                            onChange={(e) => handleItemChange(idx, "locationCode", e.target.value)}
                            className="h-8 text-xs font-mono bg-background"
                          />
                        </td>
                        <td className="py-2 px-4 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => handleRemoveItem(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="font-mono text-xs cursor-pointer">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="font-mono text-xs cursor-pointer bg-primary text-primary-foreground">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {submitting ? "Submitting..." : isEdit ? "Update Order" : "Create Stock Inward Order"}
          </Button>
        </div>
      </form>
    </div>
  )
}
