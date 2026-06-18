"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Package, Tag, IndianRupee, Layers, Barcode, RefreshCcw, Loader2, AlertCircle, UploadCloud, Image as ImageIcon } from "lucide-react"

import { apiClient } from "@/lib/api-client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { BarcodeDisplay } from "@/components/ui/barcode-display"
import { categoriesApi, warehousesApi } from "@/lib/api"

interface Subcategory {
    subcategoryId: number
    categoryId: number
    parentSubcategoryId: number | null
    subcategoryName: string
    description: string
    status: boolean
    subcategories: Subcategory[]
}

interface Category {
    categoryId: number
    categoryName: string
    description: string
    status: boolean
    subcategories: Subcategory[]
}

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Form state
    const [name, setName] = React.useState("")
    const [sku, setSku] = React.useState("")
    const [desc, setDesc] = React.useState("")
    const [taggingNo, setTaggingNo] = React.useState("")
    const [brand, setBrand] = React.useState("")
    const [unit, setUnit] = React.useState("")

    // Categories state
    const [categories, setCategories] = React.useState<Category[]>([])
    const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<number[]>([])
    const [warehouses, setWarehouses] = React.useState<any[]>([])

    // Dynamic state for variants
    const [variants, setVariants] = React.useState<any[]>([])

    const calculateBasePrice = (salesPrice: string, gst: string) => {
        const price = parseFloat(salesPrice)
        const gstRate = parseFloat(gst)
        if (isNaN(price) || isNaN(gstRate)) return "0.00"
        return (price / (1 + gstRate / 100)).toFixed(2)
    }

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)

                // Fetch Categories & Warehouses
                const [catRes, wRes] = await Promise.all([
                    categoriesApi.getAll(),
                    warehousesApi.getAll().catch(() => [])
                ])
                const cats = Array.isArray(catRes) ? catRes : (catRes as any).data || []
                setCategories(cats)
                setWarehouses(wRes)

                if (!params.id) return

                const response = await apiClient.get<any>(`/api/Product/GetById/${params.id}`)

                if (response.success && response.data) {
                    const p = response.data
                    setName(p.productName || "")
                    setSku(p.baseSKU || "")
                    setDesc(p.description || "")
                    setBrand(p.brand || "")
                    setUnit(p.unit || "")

                    // Initialize category path
                    const path: number[] = []
                    if (p.categoryId) path.push(p.categoryId)
                    if (p.subcategoryId) path.push(p.subcategoryId)
                    if (p.subcategoryL2Id) path.push(p.subcategoryL2Id)
                    if (p.subcategoryL3Id) path.push(p.subcategoryL3Id)
                    if (p.subcategoryL4Id) path.push(p.subcategoryL4Id)
                    setSelectedCategoryIds(path)

                    setTaggingNo(p.productTaggingNo || "")

                    if (p.variants && p.variants.length > 0) {
                        setVariants(p.variants.map((v: any) => ({
                            id: v.variantId,
                            productId: v.productId,
                            name: v.variantName,
                            sku_suffix: v.skuSuffix,
                            purchasePrice: v.purchasePrice?.toString() || "0",
                            price: v.sellingPrice?.toString() || "0",
                            exportPrice: v.usdAmount?.toString() || v.sellingPriceOutsideIndia?.toString() || v.exportSellingPrice?.toString() || "0",
                            initialQuantity: v.initialQuantity?.toString() || "0",
                            stock: v.currentQuantity?.toString() || "0",
                            reorderLevel: v.reorderLevel?.toString() || "5",
                            gstPercentage: v.gstPercentage?.toString() || "18",
                            warehouseId: v.warehouseId?.toString() || "",
                            rackLocation: v.rackLocation || "",
                            barcode: v.barcodeNumber || "",
                            image: v.variantImage || null
                        })))
                    } else {
                        setVariants([{ id: 1, name: "Default", sku_suffix: "-DEF", purchasePrice: "0", price: "0", exportPrice: "0", initialQuantity: "0", stock: "0", reorderLevel: "5", gstPercentage: "18", warehouseId: "", rackLocation: "", barcode: "", image: null }])
                    }
                } else {
                    setError(response.message || "Product not found")
                }
            } catch (err: any) {
                console.error("Error fetching data:", err)
                setError(err.message || "An unexpected error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [params.id])

    const addVariant = () => {
        setVariants([...variants, { id: Date.now(), name: "", sku_suffix: "", purchasePrice: "0", price: "0", exportPrice: "0", initialQuantity: "0", stock: "0", reorderLevel: "5", gstPercentage: "18", warehouseId: "", rackLocation: "", barcode: "", image: null }])
    }

    const handleImageChange = (id: number, file: File) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            setVariants(prev => prev.map(v =>
                v.id === id ? { ...v, image: reader.result as string } : v
            ))
        }
        if (file) {
            reader.readAsDataURL(file)
        }
    }

    const removeImage = (id: number) => {
        setVariants(prev => prev.map(v =>
            v.id === id ? { ...v, image: null } : v
        ))
    }

    const removeVariant = (id: number) => {
        if (variants.length > 1) {
            setVariants(variants.filter(v => v.id !== id))
        }
    }

    const handleVariantChange = (id: number, field: string, value: string) => {
        setVariants(variants.map(v =>
            v.id === id ? { ...v, [field]: value } : v
        ))
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSaving(true)

        const payload = {
            productId: parseInt(params.id as string),
            productName: name,
            baseSKU: sku,
            productTaggingNo: taggingNo,
            barcodeNumber: "",
            categoryId: selectedCategoryIds[0] || 0,
            subcategoryId: selectedCategoryIds[1] || 0,
            subcategoryL2Id: selectedCategoryIds[2] || 0,
            subcategoryL3Id: selectedCategoryIds[3] || 0,
            subcategoryL4Id: selectedCategoryIds[4] || 0,
            brand: brand,
            unit: unit,
            description: desc,
            hasVariants: variants.length > 0,
            status: true,
            variants: variants.map(v => ({
                variantId: typeof v.id === 'string' || v.id > 1000000000 ? 0 : v.id, // Timestamp IDs are new variants
                productId: v.productId || parseInt(params.id as string),
                variantName: v.name,
                skuSuffix: v.sku_suffix,
                purchasePrice: parseFloat(v.purchasePrice) || 0,
                sellingPrice: parseFloat(v.price) || 0,
                initialQuantity: parseInt(v.initialQuantity) || 0,
                currentQuantity: parseInt(v.stock) || 0,
                reservedQuantity: 0,
                reorderLevel: parseInt(v.reorderLevel) || 5,
                status: true,
                gstPercentage: parseFloat(v.gstPercentage) || 0,
                warehouseId: parseInt(v.warehouseId) || 0,
                rackLocation: v.rackLocation || "",
                barcodeNumber: v.barcode || "",
                variantImage: v.image || "",
                usdAmount: parseFloat(v.exportPrice) || 0
            }))
        }

        try {
            const response = await apiClient.put<any>(`/api/Product/Update/${params.id}`, payload)
            if (response.success) {
                toast.success(`Product "${name}" updated successfully`)
                router.push("/inventory/products")
            } else {
                toast.error(response.message || "Failed to update product")
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred during update")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" type="button" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
                        <p className="text-muted-foreground">Modify product details, pricing, and variant stock levels.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Loading product details...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed rounded-xl bg-destructive/5 border-destructive/20">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-destructive">Error Loading Product</h3>
                            <p className="text-muted-foreground">{error}</p>
                        </div>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            <RefreshCcw className="mr-2 h-4 w-4" /> Try Again
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" />
                                        Product Information
                                    </CardTitle>
                                    <CardDescription>
                                        Product ID: {params.id}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Product Name</Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="sku">Base SKU</Label>
                                            <Input
                                                id="sku"
                                                value={sku}
                                                onChange={(e) => setSku(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={desc}
                                            onChange={(e) => setDesc(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-blue-600" />
                                        Classification
                                    </CardTitle>
                                    <CardDescription>
                                        Define how this product is grouped.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {(() => {
                                            const renderedSelects = []
                                            let currentOptions: (Category | Subcategory)[] = categories

                                            // Always show root level, then show subsequent levels if a parent is selected and has children
                                            for (let i = 0; i <= selectedCategoryIds.length; i++) {
                                                if (currentOptions.length === 0 && i > 0) break;

                                                const levelIndex = i
                                                const selectedId = selectedCategoryIds[i]
                                                const currentVal = selectedId ? String(selectedId) : ""
                                                const label = levelIndex === 0 ? "Category" : `Subcategory Level ${levelIndex}`

                                                const selectedItem = selectedId ? currentOptions.find(o => ((o as any).subcategoryId || (o as any).categoryId) === selectedId) : null
                                                const selectedName = selectedItem ? ((selectedItem as any).subcategoryName || (selectedItem as any).categoryName) : ""

                                                renderedSelects.push(
                                                    <div key={levelIndex} className="grid gap-2">
                                                        <Label>{label}</Label>
                                                        <Select
                                                            required={levelIndex === 0}
                                                            value={currentVal}
                                                            onValueChange={(val) => {
                                                                const newPath = selectedCategoryIds.slice(0, levelIndex)
                                                                if (val) newPath.push(parseInt(val))
                                                                setSelectedCategoryIds(newPath)
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={`Select ${label.toLowerCase()}`}>
                                                                    {selectedName}
                                                                </SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {currentOptions.map((opt) => {
                                                                    const id = (opt as any).subcategoryId || (opt as any).categoryId
                                                                    const name = (opt as any).subcategoryName || (opt as any).categoryName
                                                                    return (
                                                                        <SelectItem key={id} value={String(id)}>
                                                                            {name}
                                                                        </SelectItem>
                                                                    )
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )

                                                // Prepare options for the next level
                                                if (selectedId && selectedItem) {
                                                    currentOptions = selectedItem.subcategories || []
                                                } else {
                                                    currentOptions = []
                                                }
                                            }
                                            return renderedSelects
                                        })()}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                        <div className="grid gap-2">
                                            <Label htmlFor="brand">Brand</Label>
                                            <Input
                                                id="brand"
                                                value={brand}
                                                onChange={(e) => setBrand(e.target.value)}
                                                placeholder="e.g., Tejco"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="unit">Unit</Label>
                                            <Select value={unit} onValueChange={(val) => setUnit(val || "PCS")}>
                                                <SelectTrigger id="unit">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PCS">Pieces (PCS)</SelectItem>
                                                    <SelectItem value="BOX">Box</SelectItem>
                                                    <SelectItem value="PKT">Packet</SelectItem>
                                                    <SelectItem value="SET">Set</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2 pt-2 border-t">
                                        <Label htmlFor="taggingNo">Product Tagging No.</Label>
                                        <Input
                                            id="taggingNo"
                                            value={taggingNo}
                                            onChange={(e) => setTaggingNo(e.target.value)}
                                            placeholder="e.g., TAG-12345"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>




                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="grid gap-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-violet-600" />
                                        Variants & Pricing
                                    </CardTitle>
                                    <CardDescription>
                                        Manage Different sizes, price points, and locations.
                                    </CardDescription>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Variant
                                </Button>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                {variants.map((v, index) => (
                                    <div key={v.id} className="relative grid gap-4 pt-8 p-5 border-2 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                                        {variants.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-0 right-2 h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => removeVariant(v.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                            {/* Column 1: Variant Info */}
                                            <div className="md:col-span-3 grid gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Variant Name</Label>
                                                    <Input
                                                        placeholder="e.g., Large / Stainless"
                                                        value={v.name}
                                                        onChange={(e) => handleVariantChange(v.id, "name", e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SKU Suffix</Label>
                                                    <Input
                                                        placeholder="-LG"
                                                        value={v.sku_suffix}
                                                        onChange={(e) => handleVariantChange(v.id, "sku_suffix", e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Column 2: Pricing & Breakdown */}
                                            <div className="md:col-span-4 grid gap-4 border-l pl-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cost Price (₹)</Label>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                className="pl-8"
                                                                placeholder="0.00"
                                                                value={v.purchasePrice}
                                                                onChange={(e) => handleVariantChange(v.id, "purchasePrice", e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sale Price (IND) (₹)</Label>
                                                        <div className="relative">
                                                            <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                className="pl-8"
                                                                placeholder="0.00"
                                                                value={v.price}
                                                                onChange={(e) => handleVariantChange(v.id, "price", e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GST %</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="18"
                                                            value={v.gstPercentage}
                                                            onChange={(e) => handleVariantChange(v.id, "gstPercentage", e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Base Price</Label>
                                                        <div className="h-10 flex items-center px-3 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                                                            ₹{parseFloat(calculateBasePrice(v.price, v.gstPercentage)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                    <div className="grid gap-2 col-span-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sale Price (INTL) ($)</Label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">$</span>
                                                            <Input
                                                                type="number"
                                                                className="pl-8"
                                                                placeholder="0.00"
                                                                value={v.exportPrice}
                                                                onChange={(e) => handleVariantChange(v.id, "exportPrice", e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 3: Inventory & Warehouse */}
                                            <div className="md:col-span-3 grid gap-4 border-l pl-6">
                                                <div className="grid gap-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Stock / Current Stock</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={v.stock}
                                                        onChange={(e) => handleVariantChange(v.id, "stock", e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Warehouse</Label>
                                                        <Select
                                                            value={v.warehouseId ? String(v.warehouseId) : undefined}
                                                            onValueChange={(val) => handleVariantChange(v.id, "warehouseId", val || "")}
                                                        >
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {warehouses.map(w => (
                                                                    <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rack/Place</Label>
                                                        <Input
                                                            className="h-9"
                                                            placeholder="A-1"
                                                            value={v.rackLocation}
                                                            onChange={(e) => handleVariantChange(v.id, "rackLocation", e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 4: Barcode & Image Display */}
                                            <div className="md:col-span-2 flex flex-col gap-3">
                                                {/* Image Upload Area */}
                                                <div className="relative aspect-square w-full rounded-lg border-2 border-dashed border-muted-foreground/20 bg-white flex items-center justify-center overflow-hidden group">
                                                    {v.image ? (
                                                        <>
                                                            <img src={v.image} alt="Variant Preview" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => removeImage(v.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col gap-2 w-full p-2">
                                                            <div className="relative">
                                                                <ImageIcon className="absolute left-2 top-2 h-3 w-3 text-muted-foreground/50" />
                                                                <Input
                                                                    className="h-7 pl-6 text-[10px] bg-white/50"
                                                                    placeholder="Paste URL"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault()
                                                                            const val = (e.target as HTMLInputElement).value
                                                                            if (val) handleVariantChange(v.id, "image", val)
                                                                        }
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        const val = e.target.value
                                                                        if (val) handleVariantChange(v.id, "image", val)
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Barcode Display */}
                                                {v.barcode && (
                                                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-dashed gap-1">
                                                        <div className="w-full h-10">
                                                            <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                                                                {/* Simple dummy barcode effect */}
                                                                {Array.from({ length: 20 }).map((_, i) => (
                                                                    <rect key={i} x={i * 5} y="0" width={((i * 7) % 3) + 1.5} height="40" fill="black" />
                                                                ))}
                                                            </svg>
                                                        </div>
                                                        <p className="text-[9px] font-mono font-bold tracking-tighter truncate w-full text-center">
                                                            {v.barcode}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-end gap-4">
                            <Button variant="outline" type="button" onClick={() => router.back()}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving} className="px-8 font-semibold">
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? "Updating..." : "Update Product"}
                            </Button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}
