
import * as React from "react"
import { StockTransfer, TransferItem, TransferStatus, mapApiStockTransfer } from "./types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Trash2, ArrowRight, Boxes, MapPin, Calculator, Info, RefreshCw, AlertCircle, Package, User, Phone, Layers, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductSelector } from "@/components/sales/product-selector"
import { apiClient } from "@/lib/api-client"
import { stockTransfersApi, CreateStockTransferDto } from "@/lib/api"
import { toast } from "sonner"

export interface ApiWarehouse {
    warehouseId: number
    warehouseName: string
    address?: {
        street?: string
        city?: string
        state?: string
        pincode?: string
        country?: string
    } | string
    contactPerson?: string
    contactNumber?: string
    status?: boolean
    racks?: Array<{
        id: string
        name: string
        location?: string
        shelves?: Array<{
            id: string
            name: string
            code: string
        }>
    }>
}

interface StorageOption {
    id: string
    name: string
}

function getWarehouseStorageLocations(warehouse?: ApiWarehouse | null): StorageOption[] {
    if (!warehouse) return []
    const locations: StorageOption[] = []

    if (warehouse.racks && Array.isArray(warehouse.racks) && warehouse.racks.length > 0) {
        warehouse.racks.forEach((rack) => {
            if (rack.shelves && Array.isArray(rack.shelves) && rack.shelves.length > 0) {
                rack.shelves.forEach((shelf) => {
                    locations.push({
                        id: shelf.code || shelf.id || `${rack.name}-${shelf.name}`,
                        name: `${rack.name} > ${shelf.name}${shelf.code ? ` (${shelf.code})` : ""}`,
                    })
                })
            } else {
                locations.push({
                    id: rack.id || rack.name,
                    name: `${rack.name}${rack.location ? ` (${rack.location})` : ""}`,
                })
            }
        })
    }

    if (locations.length === 0) {
        locations.push(
            { id: "general", name: "General / Main Floor" },
            { id: "receiving", name: "Receiving / Loading Dock" },
            { id: "dispatch-bay", name: "Dispatch / Outward Bay" }
        )
    }

    return locations
}

interface StockTransferDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transfer: StockTransfer | null
    onSave: (data: Partial<StockTransfer>) => void
}

export function StockTransferDialog({ open, onOpenChange, transfer, onSave }: StockTransferDialogProps) {
    const [form, setForm] = React.useState<Partial<StockTransfer>>({})
    const [isSaving, setIsSaving] = React.useState(false)
    const [warehouses, setWarehouses] = React.useState<ApiWarehouse[]>([])
    const [isLoadingWarehouses, setIsLoadingWarehouses] = React.useState(false)
    const [warehouseError, setWarehouseError] = React.useState<string | null>(null)

    // Detailed warehouse states fetched from http://tejco.digitaledgetech.in/api/api/Warehouse/{id}
    const [sourceWarehouseDetails, setSourceWarehouseDetails] = React.useState<ApiWarehouse | null>(null)
    const [destWarehouseDetails, setDestWarehouseDetails] = React.useState<ApiWarehouse | null>(null)
    const [isLoadingSourceWh, setIsLoadingSourceWh] = React.useState(false)
    const [isLoadingDestWh, setIsLoadingDestWh] = React.useState(false)
    const [sourceAutoAssigned, setSourceAutoAssigned] = React.useState(false)
    const [isLoadingInitialData, setIsLoadingInitialData] = React.useState(false)

    // Fetch warehouses list from http://tejco.digitaledgetech.in/api/api/Warehouse
    const fetchWarehouses = React.useCallback(async () => {
        setIsLoadingWarehouses(true)
        setWarehouseError(null)
        try {
            const res = await apiClient.get<any>("/api/Warehouse")
            let list: ApiWarehouse[] = []
            if (res && res.success && Array.isArray(res.data)) {
                list = res.data
            } else if (res && Array.isArray(res.data)) {
                list = res.data
            } else if (Array.isArray(res)) {
                list = res
            }
            setWarehouses(list)
        } catch (err: any) {
            console.error("Failed to fetch warehouses:", err)
            setWarehouseError(err?.message || "Failed to load warehouses")
            toast.error("Failed to load warehouses")
        } finally {
            setIsLoadingWarehouses(false)
        }
    }, [])

    // Fetch individual warehouse info from http://tejco.digitaledgetech.in/api/api/Warehouse/{id}
    const fetchWarehouseById = React.useCallback(async (id: string | number): Promise<ApiWarehouse | null> => {
        if (!id) return null
        try {
            const res = await apiClient.get<any>(`/api/Warehouse/${id}`)
            if (res && res.success && res.data) {
                return res.data as ApiWarehouse
            } else if (res && res.data) {
                return res.data as ApiWarehouse
            } else if (res && res.warehouseId) {
                return res as ApiWarehouse
            }
            return null
        } catch (err) {
            console.error(`Failed to fetch warehouse info for ID ${id}:`, err)
            return null
        }
    }, [])

    const loadSourceWarehouse = React.useCallback(async (id: string | number, preferredStorageId?: string, isFromProduct: boolean = false) => {
        const idStr = String(id)
        setIsLoadingSourceWh(true)
        try {
            let whData = await fetchWarehouseById(id)
            if (!whData) {
                whData = warehouses.find(w => String(w.warehouseId) === idStr) || null
            }

            if (whData) {
                setSourceWarehouseDetails(whData)
                const locations = getWarehouseStorageLocations(whData)

                let targetStorage = preferredStorageId || ""
                if (!targetStorage && locations.length > 0) {
                    targetStorage = locations[0].id
                }

                setForm(prev => ({
                    ...prev,
                    sourceWarehouseId: idStr,
                    sourceWarehouseName: whData?.warehouseName || prev.sourceWarehouseName || "",
                    sourceStorageId: targetStorage || prev.sourceStorageId || "",
                }))

                if (isFromProduct) {
                    setSourceAutoAssigned(true)
                    toast.info(`Source warehouse auto-set to "${whData.warehouseName}" (from product)`)
                }
            }
        } finally {
            setIsLoadingSourceWh(false)
        }
    }, [fetchWarehouseById, warehouses])

    const loadDestWarehouse = React.useCallback(async (id: string | number, preferredStorageId?: string) => {
        const idStr = String(id)
        setIsLoadingDestWh(true)
        try {
            let whData = await fetchWarehouseById(id)
            if (!whData) {
                whData = warehouses.find(w => String(w.warehouseId) === idStr) || null
            }

            if (whData) {
                setDestWarehouseDetails(whData)
                const locations = getWarehouseStorageLocations(whData)

                let targetStorage = preferredStorageId || ""
                if (!targetStorage && locations.length > 0) {
                    targetStorage = locations[0].id
                }

                setForm(prev => ({
                    ...prev,
                    destinationWarehouseId: idStr,
                    destinationWarehouseName: whData?.warehouseName || prev.destinationWarehouseName || "",
                    destinationStorageId: targetStorage || prev.destinationStorageId || "",
                }))
            }
        } finally {
            setIsLoadingDestWh(false)
        }
    }, [fetchWarehouseById, warehouses])

    React.useEffect(() => {
        if (!open) return

        let isCancelled = false

        async function initDialog() {
            setIsLoadingInitialData(true)
            setWarehouseError(null)
            try {
                // 1. Fetch warehouses and products catalogue in parallel
                const [whRes, prodRes] = await Promise.all([
                    apiClient.get<any>("/api/Warehouse").catch(() => ({ data: [] })),
                    apiClient.get<any>("/api/Product/GetAll").catch(() => ({ data: [] })),
                ])

                const whList: ApiWarehouse[] = Array.isArray(whRes?.data) ? whRes.data : []
                const prodList: any[] = Array.isArray(prodRes?.data) ? prodRes.data : []

                if (isCancelled) return
                setWarehouses(whList)

                if (transfer) {
                    let fullTransferData: any = transfer

                    // If editing an existing transfer with an ID, fetch latest details from backend
                    if (transfer.id) {
                        try {
                            const detailsRes = await stockTransfersApi.getById(transfer.id)
                            if (detailsRes && (detailsRes.success || detailsRes.data)) {
                                fullTransferData = detailsRes.data || detailsRes
                            }
                        } catch (err) {
                            console.warn("Could not fetch latest transfer details from API, using provided transfer object:", err)
                        }
                    }

                    if (isCancelled) return

                    // Map using mapApiStockTransfer to enrich with warehouses and products
                    const enriched = mapApiStockTransfer(fullTransferData, whList, prodList)

                    const initialForm: Partial<StockTransfer> = {
                        ...enriched,
                        date: enriched.date ? enriched.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
                    }
                    setForm(initialForm)
                    setSourceAutoAssigned(false)

                    // Also fetch the specific warehouse details for source and destination to populate racks & contacts
                    if (enriched.sourceWarehouseId) {
                        const srcDetail = await fetchWarehouseById(enriched.sourceWarehouseId)
                        if (!isCancelled && srcDetail) {
                            setSourceWarehouseDetails(srcDetail)
                        }
                    } else {
                        setSourceWarehouseDetails(null)
                    }

                    if (enriched.destinationWarehouseId) {
                        const dstDetail = await fetchWarehouseById(enriched.destinationWarehouseId)
                        if (!isCancelled && dstDetail) {
                            setDestWarehouseDetails(dstDetail)
                        }
                    } else {
                        setDestWarehouseDetails(null)
                    }
                } else {
                    // New transfer form initialization
                    setForm({
                        transferId: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
                        date: new Date().toISOString().slice(0, 10),
                        status: "Draft",
                        reason: "",
                        items: [],
                        sourceWarehouseId: "",
                        sourceWarehouseName: "",
                        sourceStorageId: "",
                        destinationWarehouseId: "",
                        destinationWarehouseName: "",
                        destinationStorageId: "",
                        notes: "",
                    })
                    setSourceWarehouseDetails(null)
                    setDestWarehouseDetails(null)
                    setSourceAutoAssigned(false)
                }
            } catch (err) {
                console.error("Error initializing stock transfer dialog:", err)
            } finally {
                if (!isCancelled) {
                    setIsLoadingInitialData(false)
                }
            }
        }

        initDialog()

        return () => {
            isCancelled = true
        }
    }, [open, transfer?.id, fetchWarehouseById])

    const set = (field: keyof StockTransfer, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    // Match source and destination warehouses (fallback to loaded list)
    const sourceWarehouse = React.useMemo(() => {
        return warehouses.find(
            (w) => String(w.warehouseId) === String(form.sourceWarehouseId) || w.warehouseName === form.sourceWarehouseId
        )
    }, [warehouses, form.sourceWarehouseId])

    const destWarehouse = React.useMemo(() => {
        return warehouses.find(
            (w) => String(w.warehouseId) === String(form.destinationWarehouseId) || w.warehouseName === form.destinationWarehouseId
        )
    }, [warehouses, form.destinationWarehouseId])

    // Use full detailed warehouse objects
    const effectiveSourceWarehouse = sourceWarehouseDetails || sourceWarehouse
    const effectiveDestWarehouse = destWarehouseDetails || destWarehouse

    // Compute storage locations based on warehouse racks/shelves
    const sourceLocations = React.useMemo(() => {
        const locs = getWarehouseStorageLocations(effectiveSourceWarehouse)
        if (form.sourceStorageId && !locs.some((l) => l.id === form.sourceStorageId)) {
            locs.unshift({ id: form.sourceStorageId, name: form.sourceStorageId })
        }
        return locs
    }, [effectiveSourceWarehouse, form.sourceStorageId])

    const destLocations = React.useMemo(() => {
        const locs = getWarehouseStorageLocations(effectiveDestWarehouse)
        if (form.destinationStorageId && !locs.some((l) => l.id === form.destinationStorageId)) {
            locs.unshift({ id: form.destinationStorageId, name: form.destinationStorageId })
        }
        return locs
    }, [effectiveDestWarehouse, form.destinationStorageId])

    const handleSourceWarehouseChange = async (warehouseId: string | null) => {
        if (!warehouseId) return
        setSourceAutoAssigned(false)
        await loadSourceWarehouse(warehouseId, undefined, false)
    }

    const handleDestWarehouseChange = async (warehouseId: string | null) => {
        if (!warehouseId) return
        await loadDestWarehouse(warehouseId, undefined)
    }

    // Product selection via ProductSelector
    const handleProductSelect = async (product: any, variant: any) => {
        const pId = String(product.productId)
        const vId = Number(variant?.variantId || 0)
        const baseSku = product.baseSKU || ""
        const skuSuffix = variant?.skuSuffix || ""
        const fullSku = `${baseSku}${skuSuffix}`.trim() || baseSku || variant?.variantName || ""
        const variantWarehouseId = variant?.warehouseId || (product as any).warehouseId
        const variantRackLocation = variant?.rackLocation || ""

        // Check if item already exists
        const existingIndex = (form.items || []).findIndex(
            (item) => String(item.productId) === pId && (item.variantId === vId || (!item.variantId && !vId))
        )

        if (existingIndex > -1) {
            toast.info(`Increased quantity for ${product.productName}${variant?.variantName ? ` (${variant.variantName})` : ""}`)
            setForm((prev) => ({
                ...prev,
                items: (prev.items || []).map((item, idx) =>
                    idx === existingIndex ? { ...item, quantity: (item.quantity || 0) + 1 } : item
                ),
            }))
        } else {
            const newItem: TransferItem = {
                id: Math.random().toString(36).substring(2, 9).slice(0, 8),
                productId: pId,
                productName: product.productName,
                sku: fullSku,
                quantity: 1,
                unit: (product as any).unit || "Unit",
                variantId: vId,
                variantName: variant?.variantName || "",
                currentQuantity: variant?.currentQuantity ?? 0,
                size: variant?.size || "",
                imageUrl: variant?.variantImage || (product as any).imageUrl || "",
                warehouseId: variantWarehouseId,
                rackLocation: variantRackLocation,
            }

            setForm((prev) => ({
                ...prev,
                items: [...(prev.items || []), newItem],
            }))
            toast.success(`Added ${product.productName}${variant?.variantName ? ` - ${variant.variantName}` : ""}`)
        }

        // Auto-detect and fetch Source Warehouse info from variant's warehouseId
        if (variantWarehouseId) {
            await loadSourceWarehouse(variantWarehouseId, variantRackLocation, true)
        }
    }

    const updateItem = (id: string, field: keyof TransferItem, value: any) => {
        setForm((prev) => ({
            ...prev,
            items: (prev.items || []).map((item) => (item.id === id ? { ...item, [field]: value } : item)),
        }))
    }

    const removeItem = (id: string) => {
        setForm((prev) => ({
            ...prev,
            items: (prev.items || []).filter((item) => item.id !== id),
        }))
    }

    const handleSave = async () => {
        if (!form.reason?.trim()) {
            toast.error("Please enter a reason for the transfer")
            return
        }
        if (!form.sourceWarehouseId) {
            toast.error("Please select a source warehouse")
            return
        }
        if (!form.destinationWarehouseId) {
            toast.error("Please select a destination warehouse")
            return
        }
        if (
            form.sourceWarehouseId === form.destinationWarehouseId &&
            form.sourceStorageId &&
            form.destinationStorageId &&
            form.sourceStorageId === form.destinationStorageId
        ) {
            toast.error("Source and destination storage location cannot be the same within the same warehouse")
            return
        }
        if ((form.items || []).length === 0) {
            toast.error("Please add at least one product to transfer")
            return
        }

        setIsSaving(true)
        try {
            const srcWh = effectiveSourceWarehouse || warehouses.find((w) => String(w.warehouseId) === String(form.sourceWarehouseId))
            const dstWh = effectiveDestWarehouse || warehouses.find((w) => String(w.warehouseId) === String(form.destinationWarehouseId))

            const parsedSourceStorageId = parseInt(String(form.sourceStorageId || 0), 10)
            const parsedDestStorageId = parseInt(String(form.destinationStorageId || 0), 10)

            const apiPayload: CreateStockTransferDto = {
                date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
                reason: (form.reason || "").trim(),
                sourceWarehouseId: Number(form.sourceWarehouseId) || 0,
                sourceStorageId: isNaN(parsedSourceStorageId) ? 0 : parsedSourceStorageId,
                destinationWarehouseId: Number(form.destinationWarehouseId) || 0,
                destinationStorageId: isNaN(parsedDestStorageId) ? 0 : parsedDestStorageId,
                notes: (form.notes || "").trim(),
                items: (form.items || []).map((item) => ({
                    productId: Number(item.productId) || 0,
                    variantId: Number(item.variantId) || 0,
                    sku: item.sku || "",
                    quantity: Number(item.quantity) || 1,
                    unit: item.unit || "pcs",
                })),
            }

            let responseData: any = null
            if (!transfer) {
                const response = await stockTransfersApi.create(apiPayload)
                responseData = response?.data
            }

            const payload: Partial<StockTransfer> = {
                ...form,
                id: responseData?.id ? String(responseData.id) : form.id,
                transferId: responseData?.transferNumber || form.transferId,
                sourceWarehouseName: srcWh?.warehouseName || form.sourceWarehouseName || "",
                destinationWarehouseName: dstWh?.warehouseName || form.destinationWarehouseName || "",
            }

            onSave(payload)
            toast.success(transfer ? "Stock transfer updated successfully" : "Stock transfer created successfully")
            onOpenChange(false)
        } catch (err: any) {
            console.error("Failed to save stock transfer:", err)
            toast.error(err?.message || "Failed to save stock transfer")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-50/50 outline-none border-none shadow-2xl">
                <DialogHeader className="p-6 pb-4 bg-white border-b sticky top-0 z-20 shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-normal flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Boxes className="h-6 w-6 text-primary" />
                            </div>
                            {transfer ? "Edit Stock Transfer" : "New Stock Transfer"}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="px-3 py-1 bg-white">{form.transferId}</Badge>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 w-full overflow-y-auto">
                    {isLoadingInitialData ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm font-medium text-slate-600">Loading stock transfer details...</span>
                        </div>
                    ) : (
                        <div className="p-6 space-y-8 pb-10">
                        {/* Section 1: General Info & Product Selection */}
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 lg:col-span-8 space-y-6">
                                <Card className="border-none shadow-sm overflow-hidden">
                                    <div className="bg-white px-6 py-5 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Info className="h-4 w-4 text-primary" />
                                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">General Information</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="date">Transfer Date</Label>
                                                <Input id="date" type="date" value={form.date ? form.date.slice(0, 10) : ""} onChange={(e) => set("date", e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="status">Status</Label>
                                                <Select value={form.status} onValueChange={(v) => v && set("status", v as TransferStatus)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Draft">Draft</SelectItem>
                                                        <SelectItem value="Pending">Pending</SelectItem>
                                                        <SelectItem value="In Transit">In Transit</SelectItem>
                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label htmlFor="reason">Reason for Transfer *</Label>
                                                <Input id="reason" placeholder="e.g., Stock Redistribution, Defective Return..." value={form.reason} onChange={(e) => set("reason", e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-sm overflow-hidden">
                                    <div className="bg-white px-6 py-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Boxes className="h-4 w-4 text-primary" />
                                                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Product Selection</h3>
                                            </div>
                                            <ProductSelector onSelect={handleProductSelect} />
                                        </div>

                                        <div className="border rounded-xl overflow-hidden bg-white">
                                            <Table>
                                                <TableHeader className="bg-slate-50">
                                                    <TableRow>
                                                        <TableHead className="text-[11px] font-bold">Product / Variant / SKU</TableHead>
                                                        <TableHead className="w-[110px] text-[11px] font-bold text-center">Qty</TableHead>
                                                        <TableHead className="w-[110px] text-[11px] font-bold">Unit</TableHead>
                                                        <TableHead className="w-[50px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(form.items || []).length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground bg-slate-50/20">
                                                                <div className="flex flex-col items-center justify-center gap-2 py-4">
                                                                    <Package className="h-7 w-7 text-slate-300" />
                                                                    <span className="text-sm font-medium text-slate-600">No products added yet</span>
                                                                    <span className="text-xs text-slate-400">Click "Add Product" above to search and select products from inventory</span>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        (form.items || []).map((item) => (
                                                            <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                                <TableCell className="align-top py-3">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <span className="font-semibold text-sm text-slate-900 leading-tight">
                                                                            {item.productName || "Unnamed Product"}
                                                                        </span>
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            {item.variantName && (
                                                                                <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700">
                                                                                    {item.variantName}
                                                                                </Badge>
                                                                            )}
                                                                            {item.size && (
                                                                                <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">
                                                                                    {item.size}
                                                                                </Badge>
                                                                            )}
                                                                            {item.sku && (
                                                                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                                    SKU: {item.sku}
                                                                                </span>
                                                                            )}
                                                                            {item.currentQuantity !== undefined && (
                                                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                                                                    item.currentQuantity < (item.quantity || 1)
                                                                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                                                        : "text-slate-400"
                                                                                }`}>
                                                                                    Stock: {item.currentQuantity}
                                                                                </span>
                                                                            )}
                                                                            {item.warehouseId && (
                                                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-normal bg-amber-50/60 text-amber-800 border-amber-200">
                                                                                    Warehouse #{item.warehouseId}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="align-top py-3">
                                                                    <div className="pt-0.5">
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            className="h-9 text-center font-bold border-slate-200 shadow-none focus-visible:ring-primary/20"
                                                                            value={item.quantity}
                                                                            onChange={(e) => updateItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                                                                        />
                                                                        {item.currentQuantity !== undefined && item.quantity > item.currentQuantity && (
                                                                            <div className="text-[9px] text-amber-600 font-semibold mt-1 text-center">
                                                                                Exceeds stock
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="align-top py-3">
                                                                    <div className="pt-0.5">
                                                                        <Input
                                                                            className="h-9 text-xs border-slate-200 shadow-none focus-visible:ring-primary/20"
                                                                            value={item.unit}
                                                                            placeholder="Unit"
                                                                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="align-top py-3">
                                                                    <div className="pt-1 text-right">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => removeItem(item.id)}
                                                                            className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-full"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Section 2: Warehouse Routing */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                <Card className="border-none shadow-sm overflow-hidden h-full">
                                    <div className="bg-white px-6 py-5 h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Warehouse Routing</h3>
                                            </div>
                                            {isLoadingWarehouses && (
                                                <div className="flex items-center text-xs text-primary font-medium animate-pulse">
                                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                    Syncing...
                                                </div>
                                            )}
                                        </div>

                                        {warehouseError && (
                                            <div className="mb-4 bg-destructive/10 text-destructive text-xs p-3 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                                    <span>{warehouseError}</span>
                                                </div>
                                                <Button type="button" variant="outline" size="sm" onClick={fetchWarehouses} className="h-7 text-xs border-destructive/20 hover:bg-destructive/10">
                                                    <RefreshCw className="h-3 w-3 mr-1" /> Retry
                                                </Button>
                                            </div>
                                        )}

                                        <div className="relative space-y-8">
                                            {/* Connector Line */}
                                            <div className="absolute left-[19px] top-8 bottom-8 w-[2px] border-l-2 border-slate-200 border-dashed z-0" />

                                            {/* Source Warehouse (FROM) */}
                                            <div className="relative z-10 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-amber-100 p-2 rounded-full border-2 border-white shadow-sm font-bold text-xs text-amber-700">FROM</div>
                                                        <h4 className="text-sm font-bold text-slate-800">Source Warehouse</h4>
                                                    </div>
                                                    {sourceAutoAssigned && (
                                                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 font-semibold">
                                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                                            From Product
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="ml-10 space-y-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] uppercase font-bold text-slate-400">Warehouse *</Label>
                                                            {(isLoadingWarehouses || isLoadingSourceWh) && (
                                                                <span className="text-[10px] text-amber-600 flex items-center gap-1 font-medium">
                                                                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Fetching details...
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Select
                                                            value={form.sourceWarehouseId ? String(form.sourceWarehouseId) : ""}
                                                            onValueChange={handleSourceWarehouseChange}
                                                            disabled={isLoadingWarehouses}
                                                        >
                                                            <SelectTrigger className="h-9 border-slate-200 bg-white shadow-none">
                                                                <SelectValue placeholder={isLoadingWarehouses ? "Loading warehouses..." : "Select source warehouse"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-60">
                                                                {warehouses.map((w) => (
                                                                    <SelectItem key={w.warehouseId} value={String(w.warehouseId)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium">{w.warehouseName}</span>
                                                                            <span className="text-[10px] text-muted-foreground font-mono">#{w.warehouseId}</span>
                                                                            {w.racks && w.racks.length > 0 && (
                                                                                <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                                                                                    {w.racks.length} Racks
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        {/* Source Warehouse Info Card */}
                                                        {effectiveSourceWarehouse && (
                                                            <div className="mt-2 p-3 bg-amber-50/40 rounded-lg border border-amber-100 space-y-1.5 text-xs">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold text-slate-800">{effectiveSourceWarehouse.warehouseName}</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Badge variant="secondary" className="text-[9px] font-mono bg-white border border-amber-200">
                                                                            ID #{effectiveSourceWarehouse.warehouseId}
                                                                        </Badge>
                                                                        {effectiveSourceWarehouse.status !== undefined && (
                                                                            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${effectiveSourceWarehouse.status ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
                                                                                {effectiveSourceWarehouse.status ? "Active" : "Inactive"}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {effectiveSourceWarehouse.address && (
                                                                    <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                                                        <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-amber-600" />
                                                                        <span className="leading-tight">
                                                                            {typeof effectiveSourceWarehouse.address === "object"
                                                                                ? [effectiveSourceWarehouse.address.street, effectiveSourceWarehouse.address.city, effectiveSourceWarehouse.address.state, effectiveSourceWarehouse.address.pincode].filter(Boolean).join(", ")
                                                                                : String(effectiveSourceWarehouse.address)}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {(effectiveSourceWarehouse.contactPerson || effectiveSourceWarehouse.contactNumber) && (
                                                                    <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                                                                        {effectiveSourceWarehouse.contactPerson && (
                                                                            <div className="flex items-center gap-1">
                                                                                <User className="h-3 w-3 text-slate-400" />
                                                                                <span>{effectiveSourceWarehouse.contactPerson.trim()}</span>
                                                                            </div>
                                                                        )}
                                                                        {effectiveSourceWarehouse.contactNumber && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Phone className="h-3 w-3 text-slate-400" />
                                                                                <span>{effectiveSourceWarehouse.contactNumber.trim()}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {effectiveSourceWarehouse.racks && effectiveSourceWarehouse.racks.length > 0 && (
                                                                    <div className="text-[10px] text-slate-500 pt-0.5 flex items-center gap-1">
                                                                        <Layers className="h-3 w-3 text-amber-600" />
                                                                        <span>{effectiveSourceWarehouse.racks.length} rack(s) mapped in facility</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Storage Location</Label>
                                                        <Select
                                                            value={form.sourceStorageId || ""}
                                                            disabled={!form.sourceWarehouseId}
                                                            onValueChange={(v) => v && set("sourceStorageId", v)}
                                                        >
                                                            <SelectTrigger className="h-9 border-slate-200 bg-white shadow-none">
                                                                <SelectValue placeholder="Select storage location" />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-60">
                                                                {sourceLocations.map((l) => (
                                                                    <SelectItem key={l.id} value={l.id}>
                                                                        {l.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Destination Warehouse (TO) */}
                                            <div className="relative z-10 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-100 p-2 rounded-full border-2 border-white shadow-sm font-bold text-xs text-blue-700">TO</div>
                                                    <h4 className="text-sm font-bold text-slate-800">Destination Warehouse</h4>
                                                </div>
                                                <div className="ml-10 space-y-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] uppercase font-bold text-slate-400">Warehouse *</Label>
                                                            {(isLoadingWarehouses || isLoadingDestWh) && (
                                                                <span className="text-[10px] text-blue-600 flex items-center gap-1 font-medium">
                                                                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Loading info...
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Select
                                                            value={form.destinationWarehouseId ? String(form.destinationWarehouseId) : ""}
                                                            onValueChange={handleDestWarehouseChange}
                                                            disabled={isLoadingWarehouses}
                                                        >
                                                            <SelectTrigger className="h-9 border-slate-200 bg-white shadow-none">
                                                                <SelectValue placeholder={isLoadingWarehouses ? "Loading warehouses..." : "Select destination warehouse"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-60">
                                                                {warehouses.map((w) => (
                                                                    <SelectItem key={w.warehouseId} value={String(w.warehouseId)}>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium">{w.warehouseName}</span>
                                                                            <span className="text-[10px] text-muted-foreground font-mono">#{w.warehouseId}</span>
                                                                            {w.racks && w.racks.length > 0 && (
                                                                                <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                                                                                    {w.racks.length} Racks
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>

                                                        {/* Destination Warehouse Info Card */}
                                                        {effectiveDestWarehouse && (
                                                            <div className="mt-2 p-3 bg-blue-50/40 rounded-lg border border-blue-100 space-y-1.5 text-xs">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold text-slate-800">{effectiveDestWarehouse.warehouseName}</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Badge variant="secondary" className="text-[9px] font-mono bg-white border border-blue-200">
                                                                            ID #{effectiveDestWarehouse.warehouseId}
                                                                        </Badge>
                                                                        {effectiveDestWarehouse.status !== undefined && (
                                                                            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${effectiveDestWarehouse.status ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-500 bg-slate-50 border-slate-200"}`}>
                                                                                {effectiveDestWarehouse.status ? "Active" : "Inactive"}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {effectiveDestWarehouse.address && (
                                                                    <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                                                        <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-blue-600" />
                                                                        <span className="leading-tight">
                                                                            {typeof effectiveDestWarehouse.address === "object"
                                                                                ? [effectiveDestWarehouse.address.street, effectiveDestWarehouse.address.city, effectiveDestWarehouse.address.state, effectiveDestWarehouse.address.pincode].filter(Boolean).join(", ")
                                                                                : String(effectiveDestWarehouse.address)}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {(effectiveDestWarehouse.contactPerson || effectiveDestWarehouse.contactNumber) && (
                                                                    <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-0.5">
                                                                        {effectiveDestWarehouse.contactPerson && (
                                                                            <div className="flex items-center gap-1">
                                                                                <User className="h-3 w-3 text-slate-400" />
                                                                                <span>{effectiveDestWarehouse.contactPerson.trim()}</span>
                                                                            </div>
                                                                        )}
                                                                        {effectiveDestWarehouse.contactNumber && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Phone className="h-3 w-3 text-slate-400" />
                                                                                <span>{effectiveDestWarehouse.contactNumber.trim()}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {effectiveDestWarehouse.racks && effectiveDestWarehouse.racks.length > 0 && (
                                                                    <div className="text-[10px] text-slate-500 pt-0.5 flex items-center gap-1">
                                                                        <Layers className="h-3 w-3 text-blue-600" />
                                                                        <span>{effectiveDestWarehouse.racks.length} rack(s) mapped in facility</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Storage Location</Label>
                                                        <Select
                                                            value={form.destinationStorageId || ""}
                                                            disabled={!form.destinationWarehouseId}
                                                            onValueChange={(v) => v && set("destinationStorageId", v)}
                                                        >
                                                            <SelectTrigger className="h-9 border-slate-200 bg-white shadow-none">
                                                                <SelectValue placeholder="Select storage location" />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-60">
                                                                {destLocations.map((l) => (
                                                                    <SelectItem key={l.id} value={l.id}>
                                                                        {l.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-8">
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calculator className="h-4 w-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Summary</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-muted-foreground">Unique Products:</span>
                                                    <span className="text-sm font-semibold">{form.items?.length || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">Total Quantity:</span>
                                                    <span className="text-lg font-bold text-primary">{form.items?.reduce((a, b) => a + (b.quantity || 0), 0) || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <Card className="border-none shadow-sm overflow-hidden">
                            <div className="bg-white px-6 py-5">
                                <Label htmlFor="notes">Additional Performance Notes / Remarks</Label>
                                <Textarea id="notes" placeholder="Add any special instructions for the movers or logistics team..." className="mt-2 min-h-[80px] bg-slate-50/50 border-none" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                            </div>
                        </Card>
                    </div>
                    )}
                </ScrollArea>

                <DialogFooter className="p-6 space-y-4 border-t bg-white shrink-0 z-20">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving || isLoadingInitialData} className="font-bold">Cancel</Button>
                    <Button onClick={handleSave} disabled={!form.reason || (form.items || []).length === 0 || !form.sourceWarehouseId || !form.destinationWarehouseId || isSaving || isLoadingInitialData} className="px-8 font-bold gap-2">
                        {isSaving ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                        ) : (
                            <>{transfer ? "Update Stock" : "Execute Transfer"} <ArrowRight className="h-4 w-4" /></>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
