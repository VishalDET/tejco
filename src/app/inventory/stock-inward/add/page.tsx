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
  FileText,
  DownloadCloud,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  Warehouse as WarehouseIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import { ImportPoModal } from "@/components/inventory/import-po-modal"
import type { PurchaseOrder } from "@/app/purchase/types"

export default function StockInwardFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [productsList, setProductsList] = useState<any[]>([])
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)

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
    referenceNumber: "",
    poId: 0,
    poNumber: "",
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
              orderDate: data.orderDate || data.inwardDate || new Date().toISOString(),
              items: (data.items || []).map((i: any) => ({
                ...i,
                warehouseId: i.warehouseId || data.warehouseId || 0,
                warehouseName: i.warehouseName || data.warehouseName || "",
                locationCode: i.locationCode || "RACK-A1"
              }))
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

  // Get available rack / bin codes for a specific warehouse
  const getWarehouseRacks = (whId?: number): string[] => {
    if (!whId) return ["RACK-A1", "RACK-A2", "RACK-B1", "BIN-01"]
    const wh = warehouses.find(w => Number(w.warehouseId || w.id || 0) === Number(whId))
    if (!wh) return ["RACK-A1", "RACK-A2", "RACK-B1", "BIN-01"]

    const list: string[] = []
    if (Array.isArray(wh.racks) && wh.racks.length > 0) {
      wh.racks.forEach((r: any) => {
        if (r.name) list.push(r.name)
        if (Array.isArray(r.shelves)) {
          r.shelves.forEach((s: any) => {
            if (s.code) list.push(s.code)
            else if (s.name) list.push(`${r.name} - ${s.name}`)
          })
        }
      })
    }
    if (list.length === 0) {
      return ["RACK-A1", "RACK-A2", "RACK-B1", "RACK-B2", "BIN-01", "BIN-02"]
    }
    return Array.from(new Set(list))
  }

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
    const wName = warehouse ? (warehouse.name || warehouse.warehouseName || "") : ""
    const wCode = warehouse ? (warehouse.code || warehouse.warehouseCode || `WH-${wId}`) : ""
    setForm(prev => {
      const updatedItems = (prev.items || []).map(item => {
        if (!item.warehouseId || item.warehouseId === 0 || item.warehouseId === prev.warehouseId) {
          return {
            ...item,
            warehouseId: wId,
            warehouseName: wName
          }
        }
        return item
      })

      return {
        ...prev,
        warehouseId: wId,
        warehouseName: wName,
        warehouseCode: wCode,
        items: updatedItems
      }
    })
  }

  const handleAddItem = () => {
    const defaultWarehouseId = form.warehouseId || (warehouses[0]?.warehouseId || Number(warehouses[0]?.id) || 0)
    const defaultWarehouse = warehouses.find(w => Number(w.warehouseId || w.id || 0) === defaultWarehouseId)
    const defaultWarehouseName = defaultWarehouse?.name || defaultWarehouse?.warehouseName || form.warehouseName || ""

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
      acceptedQty: 1,
      rejectedQty: 0,
      unitPrice: 0,
      warehouseId: defaultWarehouseId,
      warehouseName: defaultWarehouseName,
      lotNumber: `LOT-${Date.now().toString().slice(-6)}`,
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

      if (field === "warehouseId") {
        const wIdNum = parseInt(val)
        const wh = warehouses.find(w => Number(w.warehouseId || w.id || 0) === wIdNum)
        current.warehouseId = wIdNum
        current.warehouseName = wh ? (wh.name || wh.warehouseName || "") : ""
      }

      if (field === "productId") {
        const prodIdNum = parseInt(val)
        const prod = productsList.find(p => (p.productId || p.id) === prodIdNum)
        if (prod) {
          const vars = Array.isArray(prod.variants) ? prod.variants : []
          const firstVar = vars[0]

          current.productId = prodIdNum
          current.productName = prod.productName || prod.name || ""
          current.variantId = firstVar ? (firstVar.variantId || firstVar.id || 0) : 0
          current.variantName = firstVar
            ? (firstVar.variantName || firstVar.name || firstVar.size ? `${firstVar.size || ""} ${firstVar.variantName || ""}`.trim() : "Default")
            : "Default"
          current.sku = firstVar ? (firstVar.sku || `${prod.baseSKU || "SKU"}${firstVar.skuSuffix || ""}`) : (prod.sku || `SKU-${prodIdNum}`)
          current.barcode = firstVar ? (firstVar.barcode || current.sku) : (prod.barcode || `BAR-${prodIdNum}`)
          current.unitPrice = firstVar ? (Number(firstVar.purchasePrice) || Number(firstVar.sellingPrice) || 0) : (Number(prod.purchasePrice) || 0)
        }
      }

      if (field === "variantId") {
        const vIdNum = parseInt(val)
        const prod = productsList.find(p => (p.productId || p.id) === current.productId)
        if (prod && Array.isArray(prod.variants)) {
          const selVar = prod.variants.find((v: any) => (v.variantId || v.id) === vIdNum)
          if (selVar) {
            current.variantId = vIdNum
            current.variantName = selVar.variantName || selVar.name || (selVar.size ? `${selVar.size} ${selVar.bevel || ""}`.trim() : "Variant")
            current.sku = selVar.sku || `${prod.baseSKU || "SKU"}${selVar.skuSuffix || ""}`
            current.barcode = selVar.barcode || current.sku
            current.unitPrice = Number(selVar.purchasePrice) || Number(selVar.sellingPrice) || current.unitPrice || 0
          }
        }
      }

      updated[index] = current
      return { ...prev, items: updated }
    })
  }

  // Handle PO Import from Modal
  const handleSelectPo = (po: PurchaseOrder) => {
    const matchedVendor = vendors.find(v => (v.vendorId || v.id) === po.vendorId)
    const matchedWarehouse = warehouses.find(w => Number(w.warehouseId || w.id || 0) === po.warehouseId)

    const targetWhId = po.warehouseId || form.warehouseId || (warehouses[0]?.warehouseId || Number(warehouses[0]?.id) || 0)
    const targetWh = warehouses.find(w => Number(w.warehouseId || w.id || 0) === targetWhId)
    const targetWhName = po.warehouseName || targetWh?.name || targetWh?.warehouseName || form.warehouseName || ""

    const poItems: InwardOrderItem[] = (po.lineItems || []).map((line) => {
      // Find matching product to get full variant details if missing
      const matchedProd = productsList.find(p => (p.productId || p.id) === line.productId)
      const matchedVar = matchedProd?.variants?.find((v: any) => (v.variantId || v.id) === line.variantId)

      return {
        inwardOrderItemId: 0,
        inwardOrderId: isEdit ? parseInt(id || "0") : 0,
        productId: line.productId,
        variantId: line.variantId || 0,
        productName: line.productName || matchedProd?.name || matchedProd?.productName || `Product #${line.productId}`,
        variantName: line.variantName || matchedVar?.variantName || matchedVar?.name || "Default",
        sku: line.sku || matchedVar?.sku || `SKU-${line.productId}`,
        barcode: line.sku || matchedVar?.barcode || `BAR-${line.productId}`,
        expectedQty: line.quantity || 1,
        receivedQty: 0,
        acceptedQty: line.quantity || 1,
        rejectedQty: 0,
        unitPrice: line.unitPrice || 0,
        warehouseId: targetWhId,
        warehouseName: targetWhName,
        locationCode: "RACK-A1",
        lotNumber: `LOT-${(po.orderNumber || "").replace(/[^0-9]/g, "") || Date.now().toString().slice(-6)}`
      }
    })

    setForm(prev => ({
      ...prev,
      vendorId: po.vendorId,
      vendorName: po.vendorName || matchedVendor?.vendorName || matchedVendor?.name || "",
      warehouseId: targetWhId,
      warehouseName: targetWhName,
      warehouseCode: matchedWarehouse?.code || prev.warehouseCode || "",
      referenceNumber: po.orderNumber,
      poId: po.purchaseOrderId,
      poNumber: po.orderNumber,
      items: poItems
    }))

    toast.success(`Imported ${poItems.length} items from PO: ${po.orderNumber}`)
  }

  const handleClearPoLink = () => {
    setForm(prev => ({
      ...prev,
      poId: 0,
      poNumber: "",
      referenceNumber: ""
    }))
    toast.info("Cleared Purchase Order link")
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
      poId: form.poId,
      poNumber: form.poNumber,
      referenceNumber: form.referenceNumber || form.poNumber || "",
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
        acceptedQty: i.acceptedQty || i.expectedQty || 1,
        rejectedQty: i.rejectedQty || 0,
        unitPrice: i.unitPrice || 0,
        warehouseId: i.warehouseId || form.warehouseId || 0,
        warehouseName: i.warehouseName || form.warehouseName || "",
        lotNumber: i.lotNumber || "",
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
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-foreground">
              {isEdit ? `Edit Inward Order: ${form.orderNumber}` : "Create Stock Inward Order"}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Inbound Goods Receipt with PO linkage, variant mapping & serialized inventory.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsPoModalOpen(true)}
          className="text-xs font-mono border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
        >
          <DownloadCloud className="mr-1.5 h-3.5 w-3.5" />
          Import from Purchase Order
        </Button>
      </div>

      {/* PO Linkage Banner (if linked) */}
      {form.poNumber && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">
              Linked to Purchase Order: <span className="text-primary">{form.poNumber}</span>
            </span>
            <Badge variant="outline" className="text-[10px] bg-background">
              Ref PO #{form.poId || form.poNumber}
            </Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearPoLink}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <X className="mr-1 h-3 w-3" />
            Unlink PO
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Details Card */}
        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-border">
            <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Inward Receipt Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Order / Inward Number</label>
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

        {/* Line Items Table with Variant Selection */}
        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Inward Items & Variants Schema
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Map master products, exact variant sizes (0.7mm–1.2mm, bevels), lots, destination warehouse, and rack bin locations.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsPoModalOpen(true)}
                className="font-mono text-xs cursor-pointer"
              >
                <DownloadCloud className="mr-1 h-3.5 w-3.5" />
                Import from PO
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddItem}
                className="font-mono text-xs cursor-pointer bg-primary text-primary-foreground"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!form.items || form.items.length === 0) ? (
              <div className="py-12 text-center text-muted-foreground font-mono text-xs">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40 stroke-1" />
                <p>No product items added yet.</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  Click "Import from PO" to auto-load approved lines, or "Add Item" to add manually.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4 w-44">Product Master</th>
                      <th className="py-2.5 px-4 w-40">Variant</th>
                      <th className="py-2.5 px-4 w-28">Barcode</th>
                      <th className="py-2.5 px-4 w-20">Expected Qty</th>
                      <th className="py-2.5 px-4 w-24">Unit Rate (₹)</th>
                      <th className="py-2.5 px-4 w-28">Lot / Batch #</th>
                      <th className="py-2.5 px-4 w-36">Warehouse</th>
                      <th className="py-2.5 px-4 w-32">Rack / Bin</th>
                      <th className="py-2.5 px-4 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {form.items.map((item, idx) => {
                      const matchedProd = productsList.find(p => (p.productId || p.id) === item.productId)
                      const availableVariants: any[] = matchedProd?.variants || []
                      const currentItemWhId = item.warehouseId || form.warehouseId || 0
                      const rackSuggestions = getWarehouseRacks(currentItemWhId)

                      return (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          {/* Product Selection */}
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

                          {/* Variant Selection */}
                          <td className="py-2 px-4">
                            {availableVariants.length > 0 ? (
                              <select
                                value={item.variantId || 0}
                                onChange={(e) => handleItemChange(idx, "variantId", e.target.value)}
                                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-mono shadow-2xs font-semibold text-primary"
                              >
                                {availableVariants.map(v => (
                                  <option key={v.variantId || v.id} value={v.variantId || v.id}>
                                    {v.variantName || v.name || (v.size ? `${v.size} ${v.bevel || ""}`.trim() : `Variant #${v.id}`)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                value={item.variantName || "Default"}
                                onChange={(e) => handleItemChange(idx, "variantName", e.target.value)}
                                placeholder="Default"
                                className="h-8 text-xs font-mono bg-background"
                              />
                            )}
                          </td>

                          {/* SKU & Barcode */}
                          <td className="py-2 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground truncate max-w-[120px]">{item.sku || "-"}</span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{item.barcode || "-"}</span>
                            </div>
                          </td>

                          {/* Expected Qty */}
                          <td className="py-2 px-4">
                            <Input
                              type="number"
                              min="1"
                              value={item.expectedQty || 1}
                              onChange={(e) => handleItemChange(idx, "expectedQty", parseInt(e.target.value) || 0)}
                              className="h-8 text-xs font-mono bg-background text-center font-bold"
                              required
                            />
                          </td>

                          {/* Unit Rate */}
                          <td className="py-2 px-4">
                            <Input
                              type="number"
                              min="0"
                              value={item.unitPrice || 0}
                              onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs font-mono bg-background"
                            />
                          </td>

                          {/* Lot / Batch */}
                          <td className="py-2 px-4">
                            <Input
                              value={item.lotNumber || ""}
                              onChange={(e) => handleItemChange(idx, "lotNumber", e.target.value)}
                              placeholder="LOT-..."
                              className="h-8 text-xs font-mono bg-background"
                            />
                          </td>

                          {/* Warehouse Selection */}
                          <td className="py-2 px-4">
                            <select
                              value={item.warehouseId || form.warehouseId || 0}
                              onChange={(e) => handleItemChange(idx, "warehouseId", parseInt(e.target.value))}
                              className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-mono shadow-2xs font-medium"
                              required
                            >
                              <option value={0}>Select Warehouse...</option>
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
                          </td>

                          {/* Rack / Bin Location */}
                          <td className="py-2 px-4">
                            <div className="relative">
                              <Input
                                list={`rack-options-${idx}`}
                                value={item.locationCode || ""}
                                onChange={(e) => handleItemChange(idx, "locationCode", e.target.value)}
                                placeholder="e.g. RACK-A1"
                                className="h-8 text-xs font-mono bg-background"
                              />
                              <datalist id={`rack-options-${idx}`}>
                                {rackSuggestions.map((rackName, rIdx) => (
                                  <option key={rIdx} value={rackName} />
                                ))}
                              </datalist>
                            </div>
                          </td>

                          {/* Actions */}
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
                      )
                    })}
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

      {/* PO Import Modal */}
      <ImportPoModal
        open={isPoModalOpen}
        onOpenChange={setIsPoModalOpen}
        onSelectPo={handleSelectPo}
      />
    </div>
  )
}
