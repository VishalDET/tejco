import * as React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { stockInwardApi, vendorsApi, warehousesApi, productsApi } from "@/lib/api"
import type { InwardOrder, InwardOrderItem } from "../types"
import {
  generateInvoiceLotNumber,
  generatePhase1LotNumber,
  getDefaultExpiryDate,
  getExpiryStatus
} from "@/lib/barcode-utils"
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
  Tag,
  Warehouse as WarehouseIcon,
  Printer,
  Receipt,
  Barcode,
  Calendar,
  Split,
  RefreshCw,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
  Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import { ImportPoModal } from "@/components/inventory/import-po-modal"
import type { PurchaseOrder } from "@/app/purchase/types"
import { SearchableDropdown, type SearchableOption } from "@/components/common/searchable-dropdown"
import { ProductSelector } from "@/components/sales/product-selector"
import { InwardBarcodePrintModal } from "@/components/inventory/inward-barcode-print-modal"

export default function StockInwardFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const [searchParams] = useSearchParams()
  const poIdParam = searchParams.get("poId")

  const [loading, setLoading] = useState(isEdit || Boolean(poIdParam))
  const [submitting, setSubmitting] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [productsList, setProductsList] = useState<any[]>([])
  const [isPoModalOpen, setIsPoModalOpen] = useState(false)
  const [copiedLotIdx, setCopiedLotIdx] = useState<number | null>(null)
  const [copiedBarcodeIdx, setCopiedBarcodeIdx] = useState<number | null>(null)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [printTargetOrder, setPrintTargetOrder] = useState<InwardOrder | null>(null)
  const [fetchingLotIdx, setFetchingLotIdx] = useState<number | null>(null)
  const [fetchingAllLots, setFetchingAllLots] = useState(false)

  const [form, setForm] = useState<Partial<InwardOrder>>({
    inwardOrderId: 0,
    orderNumber: `INW-${Math.floor(100000 + Math.random() * 900000)}`,
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    vendorId: 0,
    vendorName: "",
    vendorPrefix: "",
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

  const applyDraftFromPo = useCallback((poDraft: any, poIdValue?: string | number, currentVendors = vendors, currentWarehouses = warehouses, currentProducts = productsList) => {
    const vId = Number(poDraft.vendorId || 0)
    const matchedVendor = currentVendors.find(v => Number(v.vendorId || v.id || 0) === vId)
    const targetWhId = Number(poDraft.warehouseId || (currentWarehouses[0]?.warehouseId || Number(currentWarehouses[0]?.id) || 0))
    const matchedWarehouse = currentWarehouses.find(w => Number(w.warehouseId || w.id || 0) === targetWhId)
    const targetWhName = poDraft.warehouseName || matchedWarehouse?.name || matchedWarehouse?.warehouseName || ""

    const draftItems: InwardOrderItem[] = (poDraft.items || []).map((line: any, idx: number) => {
      const prodId = Number(line.productId || 0)
      const varId = Number(line.variantId || 0)
      const matchedProd = currentProducts.find(p => Number(p.productId || p.id || 0) === prodId)
      const matchedVar = matchedProd?.variants?.find((v: any) => Number(v.variantId || v.id || 0) === varId)
      const sku = line.sku || matchedVar?.sku || `SKU-${prodId}`
      const lotNumber = line.lotNumber || ""

      return {
        inwardOrderItemId: 0,
        inwardOrderId: isEdit ? parseInt(id || "0") : 0,
        productId: prodId,
        variantId: varId,
        productName: line.productName || matchedProd?.productName || matchedProd?.name || `Product #${prodId}`,
        variantName: line.variantName || matchedVar?.variantName || matchedVar?.name || (matchedVar?.size ? `${matchedVar.size} ${matchedVar.bevel || ""}`.trim() : "Default"),
        sku: sku,
        barcode: line.barcode || line.lotBarcode || matchedVar?.barcode || "",
        expectedQty: Number(line.expectedQty ?? line.quantity ?? 1),
        receivedQty: Number(line.receivedQty ?? line.expectedQty ?? line.quantity ?? 0),
        acceptedQty: Number(line.acceptedQty ?? line.expectedQty ?? line.quantity ?? 1),
        rejectedQty: 0,
        unitPrice: Number(line.purchasePrice ?? line.unitPrice ?? 0),
        purchasePrice: Number(line.purchasePrice ?? line.unitPrice ?? 0),
        warehouseId: targetWhId,
        warehouseName: targetWhName,
        locationCode: line.locationCode || "RACK-A1",
        lotId: line.lotId,
        lotNumber: lotNumber,
        lotBarcode: line.lotBarcode || lotNumber || "",
        expiryDate: line.expiryDate || getDefaultExpiryDate(2)
      }
    })

    const vPrefix = poDraft.vendorPrefix || matchedVendor?.vendorPrefix || (matchedVendor as any)?.prefix || ""
    setForm(prev => ({
      ...prev,
      orderNumber: poDraft.orderNumber || prev.orderNumber,
      invoiceNumber: poDraft.invoiceNumber || prev.invoiceNumber || "",
      invoiceDate: poDraft.invoiceDate ? poDraft.invoiceDate.slice(0, 10) : prev.invoiceDate,
      vendorId: vId || prev.vendorId,
      vendorName: poDraft.vendorName || matchedVendor?.vendorName || matchedVendor?.name || prev.vendorName || "",
      vendorPrefix: vPrefix || prev.vendorPrefix || "",
      warehouseId: targetWhId || prev.warehouseId,
      warehouseName: targetWhName || prev.warehouseName,
      warehouseCode: matchedWarehouse?.code || prev.warehouseCode || "",
      referenceNumber: poDraft.orderNumber || String(poIdValue || ""),
      poId: Number(poDraft.purchaseOrderId || poIdValue || prev.poId || 0),
      poNumber: poDraft.orderNumber || prev.poNumber || `PO #${poIdValue}`,
      items: draftItems
    }))
  }, [id, isEdit, vendors, warehouses, productsList])

  useEffect(() => {
    let isMounted = true

    const fetchMasterAndRecord = async () => {
      try {
        const [vRes, wRes, pRes] = await Promise.all([
          vendorsApi.getAll().catch(() => []),
          warehousesApi.getAll().catch(() => []),
          productsApi.getAll().catch(() => [])
        ])

        const loadedVendors = Array.isArray(vRes) ? vRes : (vRes as any)?.data || []
        const loadedWarehouses = Array.isArray(wRes) ? wRes : (wRes as any)?.data || []
        const loadedProducts = Array.isArray(pRes) ? pRes : (pRes as any)?.data || []

        if (!isMounted) return
        setVendors(loadedVendors)
        setWarehouses(loadedWarehouses)
        setProductsList(loadedProducts)

        // If editing existing inward order
        if (isEdit && id) {
          const res = await stockInwardApi.getById(id)
          const data = (res as any)?.data || res
          if (data && isMounted) {
            setForm({
              ...data,
              invoiceNumber: data.invoiceNumber || data.referenceNumber || "",
              invoiceDate: data.invoiceDate ? data.invoiceDate.slice(0, 10) : (data.orderDate ? data.orderDate.slice(0, 10) : new Date().toISOString().slice(0, 10)),
              vendorPrefix: data.vendorPrefix || "",
              orderDate: data.orderDate || data.inwardDate || new Date().toISOString(),
              items: (data.items || []).map((i: any, idx: number) => ({
                ...i,
                warehouseId: i.warehouseId || data.warehouseId || 0,
                warehouseName: i.warehouseName || data.warehouseName || "",
                locationCode: i.locationCode || "RACK-A1",
                lotNumber: i.lotNumber || "",
                lotBarcode: i.lotBarcode || i.lotNumber || "",
                expiryDate: i.expiryDate ? i.expiryDate.slice(0, 10) : ""
              }))
            })
          }
        } else if (poIdParam) {
          // Pre-populate from PO
          try {
            const poRes = await stockInwardApi.fromPurchaseOrder(poIdParam)
            const poDraft = (poRes as any)?.data || poRes
            if (poDraft && isMounted) {
              applyDraftFromPo(poDraft, poIdParam, loadedVendors, loadedWarehouses, loadedProducts)
              toast.success(`Draft pre-populated from Purchase Order #${poIdParam}`)
            }
          } catch (err: any) {
            console.error("Failed to load PO draft:", err)
            toast.error("Could not auto-populate from PO #" + poIdParam)
          }
        }
      } catch (err: any) {
        console.error("Failed to load master options or record", err)
        toast.error(err?.message || "Failed to load master data")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchMasterAndRecord()

    return () => {
      isMounted = false
    }
  }, [id, isEdit, poIdParam, applyDraftFromPo])

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
    if (!vId) {
      setForm(prev => ({ ...prev, vendorId: 0, vendorName: "", vendorPrefix: "" }))
      return
    }
    const vendor = vendors.find(v => Number(v.vendorId || v.id || 0) === vId)
    const vPrefix = vendor ? (vendor.vendorPrefix || vendor.prefix || "") : ""
    setForm(prev => ({
      ...prev,
      vendorId: vId,
      vendorName: vendor ? (vendor.vendorName || vendor.name || "") : "",
      vendorPrefix: vPrefix
    }))
  }

  const handleWarehouseSelect = (wId: number) => {
    if (!wId) {
      setForm(prev => ({ ...prev, warehouseId: 0, warehouseName: "", warehouseCode: "" }))
      return
    }
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

  // Handle product addition via ProductSelector dialog
  const handleProductSelect = (product: any, variant: any) => {
    const pId = Number(product.productId || product.id || 0)
    const vId = Number(variant?.variantId || variant?.id || 0)
    const baseSku = product.baseSKU || product.sku || `SKU-${pId}`
    const skuSuffix = variant?.skuSuffix || ""
    const fullSku = variant?.sku || `${baseSku}${skuSuffix}`.trim() || baseSku

    const defaultWarehouseId = form.warehouseId || (warehouses[0]?.warehouseId || Number(warehouses[0]?.id) || 0)
    const defaultWarehouse = warehouses.find(w => Number(w.warehouseId || w.id || 0) === defaultWarehouseId)
    const defaultWarehouseName = defaultWarehouse?.name || defaultWarehouse?.warehouseName || form.warehouseName || ""

    const price = Number(variant?.purchasePrice) || Number(variant?.sellingPrice) || Number(product.purchasePrice) || 0

    const existingIndex = (form.items || []).findIndex(
      item => item.productId === pId && (item.variantId === vId || (!item.variantId && !vId))
    )

    if (existingIndex > -1) {
      toast.info(`Increased quantity for ${product.productName || "Product"}${variant?.variantName ? ` (${variant.variantName})` : ""}`)
      setForm(prev => ({
        ...prev,
        items: (prev.items || []).map((item, idx) =>
          idx === existingIndex ? { ...item, expectedQty: (item.expectedQty || 0) + 1 } : item
        )
      }))
    } else {
      const newItem: InwardOrderItem = {
        inwardOrderItemId: 0,
        inwardOrderId: isEdit ? parseInt(id || "0") : 0,
        productId: pId,
        variantId: vId,
        productName: product.productName || product.name || "",
        variantName: variant?.variantName || variant?.size || (vId > 0 ? `Variant #${vId}` : "Default"),
        sku: fullSku,
        barcode: "",
        expectedQty: 1,
        receivedQty: 0,
        acceptedQty: 1,
        rejectedQty: 0,
        unitPrice: price,
        purchasePrice: price,
        warehouseId: variant?.warehouseId || defaultWarehouseId,
        warehouseName: defaultWarehouseName,
        lotNumber: "",
        lotBarcode: "",
        expiryDate: getDefaultExpiryDate(2),
        locationCode: variant?.rackLocation || "RACK-A1"
      }

      setForm(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }))
      toast.success(`Added ${product.productName || "Product"}${variant?.variantName ? ` (${variant.variantName})` : ""}`)
    }

    setProductsList(prev => {
      if (prev.some(p => Number(p.productId || p.id || 0) === pId)) return prev
      return [...prev, product]
    })
  }

  // Memoized Searchable Options
  const vendorOptions: SearchableOption[] = useMemo(() => {
    return vendors.map(v => {
      const vId = Number(v.vendorId || v.id || 0)
      const vName = v.vendorName || v.name || `Vendor #${vId}`
      const addr = v.address
      const addrStr =
        typeof addr === "object" && addr
          ? [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")
          : typeof addr === "string"
            ? addr
            : ""
      const email = typeof v.email === "string" ? v.email : ""
      const contact = typeof v.contactPerson === "string" ? v.contactPerson : ""
      const phone = typeof v.phone === "string" ? v.phone : (typeof v.contactNumber === "string" ? v.contactNumber : "")
      const sub = email || contact || phone || addrStr || undefined
      const prefix = v.vendorPrefix || v.prefix || ""
      const badge = prefix ? `Prefix: ${prefix}` : (typeof v.vendorCode === "string" ? v.vendorCode : (typeof v.code === "string" ? v.code : undefined))

      return {
        value: String(vId),
        label: vName,
        subLabel: sub,
        badge: badge,
        keywords: [vName, prefix, badge, email, phone, contact, addrStr].filter(Boolean) as string[]
      }
    })
  }, [vendors])

  const warehouseOptions: SearchableOption[] = useMemo(() => {
    return warehouses.map((w: any) => {
      const val = Number(w.warehouseId || w.id || 0)
      const name = w.name || w.warehouseName || `Warehouse #${val}`
      const addr = w.address
      const addrStr =
        typeof addr === "object" && addr
          ? [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")
          : typeof addr === "string"
            ? addr
            : ""
      const locStr = typeof w.location === "string" ? w.location : ""
      const sub = locStr || addrStr || undefined
      const cityBadge = typeof addr === "object" && addr?.city ? String(addr.city) : (typeof w.warehouseCode === "string" ? w.warehouseCode : (typeof w.code === "string" ? w.code : undefined))

      return {
        value: String(val),
        label: name,
        subLabel: sub,
        badge: cityBadge,
        keywords: [name, w.warehouseCode, w.code, locStr, addrStr].filter(Boolean) as string[]
      }
    })
  }, [warehouses])

  const productOptions: SearchableOption[] = useMemo(() => {
    return productsList.map(p => {
      const pId = Number(p.productId || p.id || 0)
      const pName = p.productName || p.name || `Product #${pId}`
      const variantsCount = Array.isArray(p.variants) ? p.variants.length : 0
      const sku = p.baseSKU || p.sku || `SKU-${pId}`
      return {
        value: String(pId),
        label: pName,
        subLabel: sku ? `SKU: ${sku}` : (p.categoryName || undefined),
        badge: variantsCount > 0 ? `${variantsCount} var` : undefined,
        price: p.purchasePrice ? Number(p.purchasePrice) : undefined,
        keywords: [pName, sku, p.categoryName, p.hsnCode, (p as any).brand].filter(Boolean) as string[]
      }
    })
  }, [productsList])

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
      purchasePrice: 0,
      warehouseId: defaultWarehouseId,
      warehouseName: defaultWarehouseName,
      lotNumber: "",
      lotBarcode: "",
      expiryDate: getDefaultExpiryDate(2),
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

  // Handle printing barcode for a single item once generated
  const handlePrintItemBarcode = (item: InwardOrderItem, idx: number) => {
    const code = item.lotBarcode || item.barcode || item.lotNumber
    if (!code) {
      toast.error("Please generate or input a barcode/lot number first")
      return
    }

    const singleItemOrder: InwardOrder = {
      ...form,
      inwardOrderId: form.inwardOrderId || 0,
      orderNumber: form.orderNumber || "INW-DRAFT",
      invoiceNumber: form.invoiceNumber || "",
      vendorId: form.vendorId || 0,
      warehouseId: item.warehouseId || form.warehouseId || 0,
      items: [
        {
          ...item,
          expectedQty: item.expectedQty || 1,
          receivedQty: item.expectedQty || 1,
          acceptedQty: item.expectedQty || 1,
        }
      ]
    }
    setPrintTargetOrder(singleItemOrder)
    setIsBarcodeModalOpen(true)
  }

  // Handle printing barcodes for all items in this inward order
  const handlePrintAllBarcodes = () => {
    if (!form.items || form.items.length === 0) {
      toast.info("Add line items first to print barcode labels")
      return
    }
    const fullOrder: InwardOrder = {
      ...form,
      inwardOrderId: form.inwardOrderId || 0,
      orderNumber: form.orderNumber || "INW-DRAFT",
      invoiceNumber: form.invoiceNumber || "",
      vendorId: form.vendorId || 0,
      warehouseId: form.warehouseId || 0,
      items: (form.items || []).map(item => ({
        ...item,
        expectedQty: item.expectedQty || 1,
        receivedQty: item.expectedQty || 1,
        acceptedQty: item.expectedQty || 1,
      }))
    }
    setPrintTargetOrder(fullOrder)
    setIsBarcodeModalOpen(true)
  }

  // Fetch unique lot number and barcode for a single item from endpoint (Phase 1)
  const handleFetchLotNumber = async (idx: number) => {
    const item = form.items?.[idx]
    if (!item) return

    setFetchingLotIdx(idx)
    try {
      const params = {
        vendorId: form.vendorId || undefined,
        vendorPrefix: form.vendorPrefix || undefined,
        invoiceNumber: form.invoiceNumber || form.referenceNumber || form.orderNumber || "",
        orderNumber: form.orderNumber || "",
        productId: item.productId || 0,
        variantId: item.variantId || 0,
        sku: item.sku || `ITEM${idx + 1}`,
        date: form.invoiceDate ? form.invoiceDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        sequence: idx + 1
      }

      let generatedLot = ""
      let generatedBarcode = ""

      try {
        const res = await stockInwardApi.generateLotNumber(params)
        const data = (res as any)?.data || res
        if (typeof data === "string") {
          generatedLot = data
          generatedBarcode = data
        } else if (data && typeof data === "object") {
          generatedLot = data.lotNumber || data.lotNo || data.lot || data.code || ""
          generatedBarcode = data.lotBarcode || data.barcode || generatedLot || ""
        }
      } catch (apiErr: any) {
        console.warn("API generateLotNumber returned error, falling back to Phase 1 client lot generator:", apiErr)
      }

      // If backend endpoint is pending or returned empty, fallback to client Phase 1 format
      // Formula: {VendorPrefix}-{InvoiceNumber}-{ProductId}[-{VariantId}]-{DateCode}[-{Sequence}]
      if (!generatedLot) {
        generatedLot = generatePhase1LotNumber({
          vendorPrefix: form.vendorPrefix || undefined,
          invoiceNumber: form.invoiceNumber || form.referenceNumber || form.orderNumber || "",
          productId: item.productId || 0,
          variantId: item.variantId || 0,
          date: form.invoiceDate ? form.invoiceDate.slice(0, 10) : undefined,
          sequence: idx + 1
        })
        generatedBarcode = generatedLot
      }

      setForm(prev => {
        const updated = [...(prev.items || [])]
        if (updated[idx]) {
          updated[idx] = {
            ...updated[idx],
            lotNumber: generatedLot,
            lotBarcode: generatedBarcode,
            barcode: generatedBarcode
          }
        }
        return { ...prev, items: updated }
      })

      toast.success(`Assigned Lot #${generatedLot} & Barcode`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to get lot number")
    } finally {
      setFetchingLotIdx(null)
    }
  }

  // Bulk: Fetch/generate unique Phase 1 lot numbers and barcodes for all items
  const handleFetchAllLots = async () => {
    if (!form.items || form.items.length === 0) {
      toast.info("Add line items first before getting lot numbers.")
      return
    }

    setFetchingAllLots(true)
    try {
      const updated = [...(form.items || [])]
      let generatedCount = 0

      for (let i = 0; i < updated.length; i++) {
        const item = updated[i]
        let lot = ""
        let barcode = ""

        try {
          const res = await stockInwardApi.generateLotNumber({
            vendorId: form.vendorId || undefined,
            vendorPrefix: form.vendorPrefix || undefined,
            invoiceNumber: form.invoiceNumber || form.referenceNumber || form.orderNumber || "",
            orderNumber: form.orderNumber || "",
            productId: item.productId || 0,
            variantId: item.variantId || 0,
            sku: item.sku || `ITEM${i + 1}`,
            date: form.invoiceDate ? form.invoiceDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
            sequence: i + 1
          })
          const data = (res as any)?.data || res
          if (typeof data === "string") {
            lot = data
            barcode = data
          } else if (data && typeof data === "object") {
            lot = data.lotNumber || data.lotNo || data.lot || data.code || ""
            barcode = data.lotBarcode || data.barcode || lot || ""
          }
        } catch {
          // fallback
        }

        if (!lot) {
          lot = generatePhase1LotNumber({
            vendorPrefix: form.vendorPrefix || undefined,
            invoiceNumber: form.invoiceNumber || form.referenceNumber || form.orderNumber || "",
            productId: item.productId || 0,
            variantId: item.variantId || 0,
            date: form.invoiceDate ? form.invoiceDate.slice(0, 10) : undefined,
            sequence: i + 1
          })
          barcode = lot
        }

        updated[i] = {
          ...item,
          lotNumber: lot,
          lotBarcode: barcode,
          barcode: barcode
        }
        generatedCount++
      }

      setForm(prev => ({ ...prev, items: updated }))
      toast.success(`Generated unique lot & barcode for all ${generatedCount} items`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate all lots")
    } finally {
      setFetchingAllLots(false)
    }
  }

  // Bulk: Apply expiry date across all items
  const handleBulkSetExpiry = (yearsToAdd: number | null) => {
    if (!form.items || form.items.length === 0) return
    const targetDate = yearsToAdd !== null ? getDefaultExpiryDate(yearsToAdd) : ""
    setForm(prev => ({
      ...prev,
      items: (prev.items || []).map(item => ({
        ...item,
        expiryDate: targetDate
      }))
    }))
    if (targetDate) {
      toast.success(`Applied expiry date (${targetDate}) to all items`)
    } else {
      toast.info("Cleared expiry date for all items")
    }
  }

  // Single Item Change
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
          const sku = firstVar ? (firstVar.sku || `${prod.baseSKU || "SKU"}${firstVar.skuSuffix || ""}`) : (prod.sku || `SKU-${prodIdNum}`)

          current.productId = prodIdNum
          current.productName = prod.productName || prod.name || ""
          current.variantId = firstVar ? (firstVar.variantId || firstVar.id || 0) : 0
          current.variantName = firstVar
            ? (firstVar.variantName || firstVar.name || (firstVar.size ? `${firstVar.size} ${firstVar.bevel || ""}`.trim() : "Default"))
            : "Default"
          current.sku = sku
          current.barcode = current.barcode || (firstVar ? (firstVar.barcode || "") : (prod.barcode || ""))
          current.unitPrice = firstVar ? (Number(firstVar.purchasePrice) || Number(firstVar.sellingPrice) || 0) : (Number(prod.purchasePrice) || 0)
          current.purchasePrice = current.unitPrice
        }
      }

      if (field === "variantId") {
        const vIdNum = parseInt(val)
        const prod = productsList.find(p => (p.productId || p.id) === current.productId)
        if (prod && Array.isArray(prod.variants)) {
          const selVar = prod.variants.find((v: any) => (v.variantId || v.id) === vIdNum)
          if (selVar) {
            const sku = selVar.sku || `${prod.baseSKU || "SKU"}${selVar.skuSuffix || ""}`
            current.variantId = vIdNum
            current.variantName = selVar.variantName || selVar.name || (selVar.size ? `${selVar.size} ${selVar.bevel || ""}`.trim() : "Variant")
            current.sku = sku
            current.barcode = current.barcode || selVar.barcode || ""
            current.unitPrice = Number(selVar.purchasePrice) || Number(selVar.sellingPrice) || current.unitPrice || 0
            current.purchasePrice = current.unitPrice
          }
        }
      }

      if (field === "lotNumber") {
        const prevLot = updated[index]?.lotNumber || ""
        if (!current.lotBarcode || current.lotBarcode === prevLot) {
          current.lotBarcode = val
        }
      }

      updated[index] = current
      return { ...prev, items: updated }
    })
  }

  const handleCopyLot = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedLotIdx(idx)
    toast.success(`Copied Lot #: ${code}`)
    setTimeout(() => setCopiedLotIdx(null), 1500)
  }

  const handleCopyBarcode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedBarcodeIdx(idx)
    toast.success(`Copied Barcode: ${code}`)
    setTimeout(() => setCopiedBarcodeIdx(null), 1500)
  }

  // Handle PO Import from Modal
  const handleSelectPo = async (po: PurchaseOrder) => {
    try {
      const res = await stockInwardApi.fromPurchaseOrder(po.purchaseOrderId)
      const data = (res as any)?.data || res
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        applyDraftFromPo(data, po.purchaseOrderId)
        toast.success(`Imported ${data.items.length} items from PO: ${po.orderNumber}`)
        return
      }
    } catch (err) {
      console.warn("Backend fromPurchaseOrder call failed, falling back to client mapping:", err)
    }

    const matchedVendor = vendors.find(v => (v.vendorId || v.id) === po.vendorId)
    const targetWhId = po.warehouseId || form.warehouseId || (warehouses[0]?.warehouseId || Number(warehouses[0]?.id) || 0)
    const targetWh = warehouses.find(w => Number(w.warehouseId || w.id || 0) === targetWhId)
    const targetWhName = po.warehouseName || targetWh?.name || targetWh?.warehouseName || form.warehouseName || ""

    const poItems: InwardOrderItem[] = (po.lineItems || []).map((line, idx) => {
      const matchedProd = productsList.find(p => (p.productId || p.id) === line.productId)
      const matchedVar = matchedProd?.variants?.find((v: any) => (v.variantId || v.id) === line.variantId)
      const sku = line.sku || matchedVar?.sku || `SKU-${line.productId}`
      const lotNumber = line.lotNumber || ""

      return {
        inwardOrderItemId: 0,
        inwardOrderId: isEdit ? parseInt(id || "0") : 0,
        productId: line.productId,
        variantId: line.variantId || 0,
        productName: line.productName || matchedProd?.name || matchedProd?.productName || `Product #${line.productId}`,
        variantName: line.variantName || matchedVar?.variantName || matchedVar?.name || "Default",
        sku: sku,
        barcode: line.lotBarcode || (line as any).barcode || matchedVar?.barcode || line.sku || "",
        expectedQty: line.quantity || 1,
        receivedQty: 0,
        acceptedQty: line.quantity || 1,
        rejectedQty: 0,
        unitPrice: line.unitPrice || 0,
        purchasePrice: line.unitPrice || 0,
        warehouseId: targetWhId,
        warehouseName: targetWhName,
        locationCode: "RACK-A1",
        lotId: line.lotId,
        lotNumber: lotNumber,
        lotBarcode: line.lotBarcode || lotNumber || "",
        expiryDate: getDefaultExpiryDate(2)
      }
    })

    setForm(prev => ({
      ...prev,
      vendorId: po.vendorId,
      vendorName: po.vendorName || matchedVendor?.vendorName || matchedVendor?.name || "",
      warehouseId: targetWhId,
      warehouseName: targetWhName,
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

    // Phase 1 Mandatory Expiry Date Validation
    const invalidExpiryIdx = (form.items || []).findIndex(i => !i.expiryDate || !i.expiryDate.trim())
    if (invalidExpiryIdx > -1) {
      const item = form.items![invalidExpiryIdx]
      const label = item.productName || item.sku || `Item #${invalidExpiryIdx + 1}`
      toast.error(`Expiry date is mandatory for all items! Please set expiry date for: ${label} (Row ${invalidExpiryIdx + 1})`)
      return
    }

    const payload: InwardOrder = {
      inwardOrderId: isEdit ? parseInt(id || "0") : 0,
      orderNumber: form.orderNumber || form.inwardNumber || `INW-${Date.now()}`,
      invoiceNumber: form.invoiceNumber || form.referenceNumber || "",
      invoiceDate: form.invoiceDate ? new Date(form.invoiceDate).toISOString() : new Date().toISOString(),
      poId: form.poId,
      poNumber: form.poNumber,
      referenceNumber: form.invoiceNumber || form.referenceNumber || form.poNumber || "",
      vendorId: form.vendorId,
      vendorName: form.vendorName || "",
      vendorPrefix: form.vendorPrefix || "",
      warehouseId: form.warehouseId,
      warehouseName: form.warehouseName || "",
      warehouseCode: form.warehouseCode || "",
      orderDate: form.orderDate || new Date().toISOString(),
      status: form.status || "Pending",
      priority: form.priority || "Normal",
      receiverName: form.receiverName || "Admin User",
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: (form.items || []).map((i, idx) => {
        const assignedLot = i.lotNumber || ""
        const assignedBarcode = i.lotBarcode || i.barcode || assignedLot || ""
        return {
          inwardOrderItemId: i.inwardOrderItemId || 0,
          inwardOrderId: isEdit ? parseInt(id || "0") : 0,
          productId: i.productId,
          variantId: i.variantId || 0,
          productName: i.productName || "",
          variantName: i.variantName || "Default",
          sku: i.sku || `SKU-${i.productId}`,
          barcode: assignedBarcode,
          expectedQty: i.expectedQty || i.expectedQuantity || 1,
          receivedQty: i.receivedQty || i.receivedQuantity || 0,
          acceptedQty: i.acceptedQty || i.expectedQty || 1,
          rejectedQty: i.rejectedQty || 0,
          unitPrice: i.unitPrice || i.purchasePrice || 0,
          purchasePrice: i.purchasePrice || i.unitPrice || 0,
          warehouseId: i.warehouseId || form.warehouseId || 0,
          warehouseName: i.warehouseName || form.warehouseName || "",
          lotId: i.lotId,
          lotNumber: assignedLot,
          lotBarcode: assignedBarcode,
          expiryDate: i.expiryDate || "",
          manufacturingDate: i.manufacturingDate || "",
          locationCode: i.locationCode || "RACK-A1"
        }
      }),
      scanHistory: form.scanHistory || []
    }

    setSubmitting(true)
    try {
      if (isEdit && id) {
        await stockInwardApi.update(id, payload)
        toast.success("Stock Inward record updated successfully")
      } else {
        await stockInwardApi.create(payload)
        toast.success("Stock Inward record saved successfully")
      }
      navigate("/inventory/stock-inward")
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Stock Inward order")
    } finally {
      setSubmitting(false)
    }
  }

  // Calculated Metrics
  const totalExpectedUnits = useMemo(() => {
    return (form.items || []).reduce((sum, item) => sum + (Number(item.expectedQty) || 0), 0)
  }, [form.items])

  const totalInvoiceValuation = useMemo(() => {
    return (form.items || []).reduce((sum, item) => {
      const q = Number(item.expectedQty) || 0
      const p = Number(item.purchasePrice || item.unitPrice) || 0
      return sum + q * p
    }, 0)
  }, [form.items])

  const distinctLotsCount = useMemo(() => {
    const lotSet = new Set((form.items || []).map(i => i.lotNumber).filter(Boolean))
    return lotSet.size
  }, [form.items])

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader layout="container" size="md" text="Loading Stock Inward order..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
                {isEdit ? `Edit Inward Order: ${form.orderNumber}` : "Create Stock Inward Receipt"}
              </h1>
              <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/30">
                Multi-Lot Engine
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Inbound Goods Receipt with Vendor Invoice linkage, per-product lot barcodes & expiry dates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPoModalOpen(true)}
            className="text-xs font-mono border-primary/40 text-primary hover:bg-primary/10 cursor-pointer h-9 gap-1.5"
          >
            <DownloadCloud className="h-3.5 w-3.5" />
            Import from PO
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="text-xs font-mono bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer h-9 gap-1.5 font-semibold"
          >
            <Save className="h-3.5 w-3.5" />
            {submitting ? "Saving..." : isEdit ? "Update Inward" : "Save Inward & Create Lots"}
          </Button>
        </div>
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
              <Receipt className="h-4 w-4 text-primary" />
              Vendor Invoice & Inbound Receipt Header
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-mono">
              Enter the vendor's physical invoice details. Lot numbers will be generated automatically for every product on this invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Vendor Invoice Number (Key Feature) */}
            <div className="p-3 rounded-lg border-2 border-primary/40 bg-primary/5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" />
                  Vendor Invoice / Bill Number *
                </label>
                {form.invoiceNumber && (
                  <Badge variant="outline" className="text-[10px] font-mono bg-background text-primary border-primary/30">
                    Formula: {form.vendorPrefix || "GEN"}-{form.invoiceNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}-...
                  </Badge>
                )}
              </div>
              <Input
                placeholder="e.g. INV-2026-9042 or BILL/26/104"
                value={form.invoiceNumber || ""}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                className="mt-1 text-xs font-mono font-bold bg-background text-foreground h-9 shadow-2xs"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Used to generate unique lot codes & barcode serials for all line items on this bill.
              </p>
            </div>

            {/* Vendor Invoice Date */}
            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Vendor Invoice Date
              </label>
              <Input
                type="date"
                value={form.invoiceDate || ""}
                onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                className="mt-1 text-xs font-mono bg-background h-9"
              />
            </div>

            {/* Internal Inward Number */}
            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Internal Inward #
              </label>
              <Input
                value={form.orderNumber || ""}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                className="mt-1 text-xs font-mono bg-background h-9"
                required
              />
            </div>

            {/* Vendor Partner */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold text-muted-foreground">Vendor Partner *</label>
                {form.vendorPrefix && (
                  <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/30">
                    Prefix: {form.vendorPrefix}
                  </Badge>
                )}
              </div>
              <SearchableDropdown
                value={form.vendorId ? String(form.vendorId) : ""}
                onChange={(val) => handleVendorSelect(parseInt(val) || 0)}
                options={vendorOptions}
                placeholder="Select Vendor..."
                searchPlaceholder="Search vendor by name, code, contact..."
                className="mt-1"
                triggerClassName="h-9 font-mono text-xs"
                allowClear
              />
            </div>

            {/* Target Destination Warehouse */}
            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Destination Warehouse *</label>
              <SearchableDropdown
                value={form.warehouseId ? String(form.warehouseId) : ""}
                onChange={(val) => handleWarehouseSelect(parseInt(val) || 0)}
                options={warehouseOptions}
                placeholder="Select Warehouse..."
                searchPlaceholder="Search warehouse name, code..."
                className="mt-1"
                triggerClassName="h-9 font-mono text-xs"
              />
            </div>

            {/* Inward Receipt Timestamp */}
            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Physical Receipt Date</label>
              <Input
                type="datetime-local"
                value={form.orderDate ? new Date(form.orderDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => setForm({ ...form, orderDate: new Date(e.target.value).toISOString() })}
                className="mt-1 text-xs font-mono bg-background h-9"
                required
              />
            </div>

            {/* Receiver Name */}
            <div>
              <label className="text-xs font-mono font-semibold text-muted-foreground">Receiver / QC Staff</label>
              <Input
                value={form.receiverName || ""}
                onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                className="mt-1 text-xs font-mono bg-background h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Multi-Lot & Expiry Quick Utility Bar */}
        <div className="p-3 bg-muted/40 border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              Lot & Expiry Controls:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fetchingAllLots || !form.items || form.items.length === 0}
              onClick={handleFetchAllLots}
              className="h-8 text-xs font-mono border-amber-300 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 cursor-pointer gap-1.5"
            >
              {fetchingAllLots ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              ⚡ Get All Lot Numbers
            </Button>

            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
              <span className="text-[11px] font-semibold">Bulk Expiry:</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleBulkSetExpiry(1)}
                className="h-7 px-2 text-[11px] font-mono cursor-pointer hover:bg-background"
              >
                +1Y
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleBulkSetExpiry(2)}
                className="h-7 px-2 text-[11px] font-mono cursor-pointer hover:bg-background"
              >
                +2Y
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleBulkSetExpiry(3)}
                className="h-7 px-2 text-[11px] font-mono cursor-pointer hover:bg-background"
              >
                +3Y
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleBulkSetExpiry(5)}
                className="h-7 px-2 text-[11px] font-mono cursor-pointer hover:bg-background"
              >
                +5Y
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleBulkSetExpiry(null)}
                className="h-7 px-1.5 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                title="Clear expiry for all items"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <span className="px-2.5 py-1 bg-background rounded-md border border-border">
              Items: <strong>{form.items?.length || 0}</strong>
            </span>
            <span className="px-2.5 py-1 bg-background rounded-md border border-border">
              Units: <strong>{totalExpectedUnits}</strong>
            </span>
            <span className="px-2.5 py-1 bg-background rounded-md border border-border text-emerald-600 dark:text-emerald-400 font-bold">
              ₹{totalInvoiceValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <Badge variant="outline" className="font-mono text-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300">
              {distinctLotsCount} {distinctLotsCount === 1 ? "Lot" : "Lots"} Assigned
            </Badge>
          </div>
        </div>

        {/* Line Items Table with Multi-Lot & Expiry Schema */}
        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-3 pt-4 px-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold font-mono text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Invoiced Products & Multi-Lot Matrix
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Each product or split delivery on this invoice has its own unique lot number, barcode, and expiry date.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsPoModalOpen(true)}
                className="font-mono text-xs cursor-pointer h-8"
              >
                <DownloadCloud className="mr-1 h-3.5 w-3.5" />
                Import from PO
              </Button>
              <ProductSelector onSelect={handleProductSelect} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!form.items || form.items.length === 0}
                onClick={handlePrintAllBarcodes}
                className="font-mono text-xs cursor-pointer h-8"
                title="Print Barcode Labels for all items"
              >
                <Printer className="mr-1 h-3.5 w-3.5 text-primary" />
                Print Labels
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddItem}
                className="font-mono text-xs cursor-pointer h-8"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Empty Row
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!form.items || form.items.length === 0) ? (
              <div className="py-14 px-4 text-center text-muted-foreground font-mono text-xs">
                <Package className="h-9 w-9 mx-auto mb-2 text-muted-foreground/40 stroke-1" />
                <p className="font-semibold text-foreground">No product items added to this invoice yet.</p>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-md mx-auto">
                  Find and add products and variants from your catalog, import from an approved PO, or add manual line rows.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <ProductSelector onSelect={handleProductSelect} />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPoModalOpen(true)}
                    className="font-mono text-xs h-8 cursor-pointer"
                  >
                    <DownloadCloud className="mr-1 h-3.5 w-3.5" />
                    Import from PO
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleAddItem}
                    className="font-mono text-xs h-8 cursor-pointer"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Empty Row
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 w-56">Product Master & Variant</th>
                      <th className="py-2.5 px-3 w-24 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-28 text-right">Unit Rate (₹)</th>
                      <th className="py-2.5 px-3 w-52">Lot #</th>
                      <th className="py-2.5 px-3 w-40">Barcode</th>
                      <th className="py-2.5 px-3 w-44 text-rose-600 dark:text-rose-400">
                        Expiry Date <span className="text-xs font-bold">*</span>
                      </th>
                      <th className="py-2.5 px-3 w-40">Warehouse & Rack</th>
                      <th className="py-2.5 px-3 w-20 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {form.items.map((item, idx) => {
                      const matchedProd = productsList.find(p => (p.productId || p.id) === item.productId)
                      const availableVariants: any[] = matchedProd?.variants || []
                      const matchedVar = availableVariants.find((v: any) => Number(v.variantId || v.id || 0) === Number(item.variantId || 0))
                      const currentItemWhId = item.warehouseId || form.warehouseId || 0
                      const rackSuggestions = getWarehouseRacks(currentItemWhId)
                      const expiryInfo = getExpiryStatus(item.expiryDate)
                      const lineTotal = (item.expectedQty || 0) * (item.purchasePrice || item.unitPrice || 0)

                      return (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          {/* Product & Variant Selection */}
                          <td className="py-2.5 px-3 align-top">
                            <div className="space-y-1.5">
                              <SearchableDropdown
                                value={item.productId ? String(item.productId) : ""}
                                onChange={(val) => handleItemChange(idx, "productId", val)}
                                options={productOptions}
                                placeholder="Select Product..."
                                searchPlaceholder="Search product by name, SKU..."
                                size="sm"
                                popoverWidth={380}
                                triggerClassName="h-8 font-semibold text-xs font-mono"
                              />

                              {availableVariants.length > 0 ? (
                                <SearchableDropdown
                                  value={item.variantId ? String(item.variantId) : ""}
                                  onChange={(val) => handleItemChange(idx, "variantId", val)}
                                  options={availableVariants.map(v => {
                                    const vId = Number(v.variantId || v.id || 0)
                                    const vName = v.variantName || v.name || (v.size ? `${v.size} ${v.bevel || ""}`.trim() : `Variant #${vId}`)
                                    return {
                                      value: String(vId),
                                      label: vName,
                                      subLabel: v.sku ? `SKU: ${v.sku}` : (v.size ? `Size: ${v.size}` : undefined),
                                      badge: v.size || undefined,
                                      price: v.purchasePrice ? Number(v.purchasePrice) : (v.sellingPrice ? Number(v.sellingPrice) : undefined),
                                      keywords: [vName, v.sku, v.size, v.bevel].filter(Boolean) as string[]
                                    }
                                  })}
                                  placeholder="Select Variant Spec..."
                                  searchPlaceholder="Search variant..."
                                  size="sm"
                                  popoverWidth={320}
                                  triggerClassName="h-7 text-[11px] font-mono text-primary font-medium"
                                />
                              ) : (
                                <Input
                                  value={item.variantName || "Default"}
                                  onChange={(e) => handleItemChange(idx, "variantName", e.target.value)}
                                  placeholder="Default Spec"
                                  className="h-7 text-[11px] font-mono bg-background"
                                />
                              )}

                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span>SKU: {item.sku || "—"}</span>
                                {Array.isArray(matchedVar?.lots) && matchedVar.lots.length > 0 && (
                                  <span
                                    className="px-1.5 py-0.2 rounded bg-muted border border-border text-foreground font-mono cursor-help"
                                    title={matchedVar.lots.map((l: any) => `${l.lotNumber || 'Lot'} (${l.currentQuantity ?? l.availableQuantity ?? 0} units, exp: ${l.expiryDate ? l.expiryDate.slice(0, 10) : 'N/A'})`).join('\n')}
                                  >
                                    📦 {matchedVar.lots.length} Active {matchedVar.lots.length === 1 ? 'Lot' : 'Lots'} ({matchedVar.lots.reduce((acc: number, l: any) => acc + (l.currentQuantity ?? l.availableQuantity ?? 0), 0)} units in stock)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Expected Qty */}
                          <td className="py-2.5 px-3 align-top">
                            <Input
                              type="number"
                              min="1"
                              value={item.expectedQty || 1}
                              onChange={(e) => handleItemChange(idx, "expectedQty", parseInt(e.target.value) || 0)}
                              className="h-8 text-xs font-mono bg-background text-center font-bold"
                              required
                            />
                            <p className="text-[10px] text-center text-muted-foreground mt-1">Units</p>
                          </td>

                          {/* Unit Rate & Line Total */}
                          <td className="py-2.5 px-3 align-top text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.purchasePrice || item.unitPrice || 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                handleItemChange(idx, "unitPrice", val)
                                handleItemChange(idx, "purchasePrice", val)
                              }}
                              className="h-8 text-xs font-mono bg-background text-right"
                            />
                            <p className="text-[10px] font-bold text-foreground mt-1">
                              = ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </td>

                          {/* Lot Number */}
                          <td className="py-2.5 px-3 align-top">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1">
                                <Input
                                  value={item.lotNumber || ""}
                                  onChange={(e) => handleItemChange(idx, "lotNumber", e.target.value)}
                                  placeholder="LOT-..."
                                  className="h-8 text-xs font-mono font-semibold bg-background"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={fetchingLotIdx === idx}
                                  onClick={() => handleFetchLotNumber(idx)}
                                  title="Fetch lot and barcode from endpoint"
                                  className="h-8 px-2 text-[11px] font-mono font-medium border-amber-400/50 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 shrink-0 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                                >
                                  {fetchingLotIdx === idx ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                  )}
                                  <span>Get Lot No</span>
                                </Button>
                              </div>

                              {item.lotNumber ? (
                                <div className="flex items-center justify-between text-[10px] px-2 py-0.5 rounded bg-muted/60 border border-border text-foreground">
                                  <span className="flex items-center gap-1 truncate font-mono">
                                    <Tag className="h-3 w-3 shrink-0 text-amber-600" />
                                    <span className="truncate">{item.lotNumber}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLot(item.lotNumber || "", idx)}
                                    className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                                    title="Copy Lot #"
                                  >
                                    {copiedLotIdx === idx ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground font-mono">Click &quot;Get Lot No&quot; to assign</p>
                              )}
                            </div>
                          </td>

                          {/* Barcode */}
                          <td className="py-2.5 px-3 align-top">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1">
                                <Input
                                  value={item.lotBarcode || item.barcode || ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    handleItemChange(idx, "lotBarcode", val)
                                    handleItemChange(idx, "barcode", val)
                                  }}
                                  placeholder="Barcode..."
                                  className="h-8 text-xs font-mono bg-background"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  title="Sync barcode with lot number"
                                  disabled={!item.lotNumber}
                                  onClick={() => {
                                    const syncCode = item.lotNumber || item.sku || `BAR-${item.productId}`
                                    handleItemChange(idx, "lotBarcode", syncCode)
                                    handleItemChange(idx, "barcode", syncCode)
                                    toast.info(`Synced barcode to ${syncCode}`)
                                  }}
                                  className="h-8 w-8 shrink-0 cursor-pointer disabled:opacity-40"
                                >
                                  <Barcode className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </div>

                              {(item.lotBarcode || item.barcode) ? (
                                <div className="flex items-center justify-between text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300">
                                  <span className="flex items-center gap-1 truncate font-mono">
                                    <Barcode className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{item.lotBarcode || item.barcode}</span>
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0 ml-1">
                                    <button
                                      type="button"
                                      onClick={() => handlePrintItemBarcode(item, idx)}
                                      className="text-amber-800 dark:text-amber-300 hover:text-foreground cursor-pointer"
                                      title="Print barcode label for this item"
                                    >
                                      <Printer className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyBarcode(item.lotBarcode || item.barcode || "", idx)}
                                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                                      title="Copy barcode text"
                                    >
                                      {copiedBarcodeIdx === idx ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground font-mono">Auto-assigned with lot</p>
                              )}
                            </div>
                          </td>

                          {/* Expiry Date (Mandatory in Phase 1) */}
                          <td className="py-2.5 px-3 align-top">
                            <div className="space-y-1.5">
                              <Input
                                type="date"
                                value={item.expiryDate || ""}
                                onChange={(e) => handleItemChange(idx, "expiryDate", e.target.value)}
                                className={`h-8 text-xs font-mono bg-background ${!item.expiryDate ? "border-rose-400 dark:border-rose-600/70 focus:border-rose-500" : ""}`}
                                required
                              />

                              {/* Quick Expiry Preset Chips */}
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 5].map(yrs => (
                                  <button
                                    key={yrs}
                                    type="button"
                                    onClick={() => handleItemChange(idx, "expiryDate", getDefaultExpiryDate(yrs))}
                                    className="px-1.5 py-0.5 text-[10px] rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground font-mono cursor-pointer transition-colors"
                                  >
                                    +{yrs}Y
                                  </button>
                                ))}
                                {item.expiryDate && (
                                  <button
                                    type="button"
                                    onClick={() => handleItemChange(idx, "expiryDate", "")}
                                    className="px-1 py-0.5 text-[10px] text-muted-foreground hover:text-destructive cursor-pointer"
                                    title="Clear expiry date"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              {/* Shelf-Life Status Pill or Required indicator */}
                              {item.expiryDate ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] font-mono px-1.5 py-0 ${expiryInfo.status === "valid"
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                      : expiryInfo.status === "expiring-soon"
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                                    }`}
                                >
                                  {expiryInfo.label}
                                </Badge>
                              ) : (
                                <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold font-mono">
                                  * Required for inward
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Warehouse & Rack */}
                          <td className="py-2.5 px-3 align-top">
                            <div className="space-y-1.5">
                              <SearchableDropdown
                                value={String(item.warehouseId || form.warehouseId || 0)}
                                onChange={(val) => handleItemChange(idx, "warehouseId", parseInt(val))}
                                options={warehouseOptions}
                                placeholder="Warehouse..."
                                searchPlaceholder="Search warehouse..."
                                size="sm"
                                popoverWidth={280}
                                triggerClassName="h-8 text-[11px] font-mono font-medium"
                              />

                              <Input
                                list={`rack-options-${idx}`}
                                value={item.locationCode || ""}
                                onChange={(e) => handleItemChange(idx, "locationCode", e.target.value)}
                                placeholder="Rack (e.g. RACK-A1)"
                                className="h-7 text-[11px] font-mono bg-background"
                              />
                              <datalist id={`rack-options-${idx}`}>
                                {rackSuggestions.map((r, rIdx) => (
                                  <option key={rIdx} value={r} />
                                ))}
                              </datalist>
                            </div>
                          </td>

                          {/* Actions: Print Barcode & Remove */}
                          <td className="py-2.5 px-3 align-top text-center">
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={!item.lotBarcode && !item.barcode && !item.lotNumber}
                                onClick={() => handlePrintItemBarcode(item, idx)}
                                title={
                                  item.lotBarcode || item.barcode || item.lotNumber
                                    ? "Print Barcode Labels for this item"
                                    : "Generate barcode first to print"
                                }
                                className="h-7 w-7 text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(idx)}
                                title="Remove line item"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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

        {/* Bottom Submission Bar */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/inventory/stock-inward")}
            className="text-xs font-mono cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="text-xs font-mono bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer h-10 px-5 gap-1.5 font-bold shadow-sm"
          >
            <Save className="h-4 w-4" />
            {submitting ? "Saving Inward Order..." : isEdit ? "Update Inward Record" : "Save Inward & Activate Lots"}
          </Button>
        </div>
      </form>

      {/* PO Import Modal */}
      <ImportPoModal
        open={isPoModalOpen}
        onOpenChange={setIsPoModalOpen}
        onSelectPo={handleSelectPo}
      />

      {/* Inward Barcode Print Modal */}
      {printTargetOrder && (
        <InwardBarcodePrintModal
          open={isBarcodeModalOpen}
          onOpenChange={setIsBarcodeModalOpen}
          order={printTargetOrder}
        />
      )}
    </div>
  )
}
