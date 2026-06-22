"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Package, Tag, IndianRupee, Layers, Barcode, RefreshCcw, ImageIcon, UploadCloud } from "lucide-react"

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
import { warehousesApi, productsApi, categoriesApi } from "@/lib/api"
import type { Warehouse } from "@/app/supply-chain/warehouse/types"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"

interface Subcategory {
    subcategoryId: number;
    categoryId: number;
    parentSubcategoryId: number | null;
    subcategoryName: string;
    description: string;
    subcategories: Subcategory[];
}

interface Category {
    categoryId: number;
    categoryName: string;
    description: string;
    status: boolean;
    subcategories: Subcategory[];
}

export default function AddProductPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [name, setName] = React.useState("")
    const [baseSKU, setBaseSKU] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [brand, setBrand] = React.useState("")
    const [unit, setUnit] = React.useState("PCS")
    const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<number[]>([])
    const [categories, setCategories] = React.useState<Category[]>([])
    const [taggingNo, setTaggingNo] = React.useState("")
    const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
    // Placeholder for product ID used in barcode generation
    const [tempProdId, setTempProdId] = React.useState("0000")

    // Generate a random product ID only on the client to avoid hydration mismatch
    React.useEffect(() => {
        setTempProdId(Math.floor(1000 + Math.random() * 9000).toString())
    }, [])

    // Fetch warehouses and categories on mount
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [wData, cData] = await Promise.all([
                    warehousesApi.getAll(),
                    categoriesApi.getAll()
                ])
                setWarehouses(wData)
                // The API might return { data: [...] } or just [...]
                const categoryList = (cData as any).data || cData
                setCategories(Array.isArray(categoryList) ? categoryList : [])
            } catch (err) {
                console.error("Failed to fetch master data:", err)
            }
        }
        fetchData()
    }, [])

    // Dynamic state for variants
    const [variants, setVariants] = React.useState([
        {
            id: 1,
            name: "Default",
            sku_suffix: "-DEF",
            salesPrice: "",
            exportSalesPrice: "",
            gstPercentage: "18",
            costPrice: "",
            stock: "",
            barcode: "",
            warehouseId: "",
            rackLocation: "",
            image: null as string | null
        }
    ])

    const generateVariantBarcode = React.useCallback((index: number, path: number[]) => {
        const c = path[0] ? String(path[0]) : "0"
        const s = path[path.length - 1] ? String(path[path.length - 1]).padStart(3, '0') : "000"
        const p = tempProdId
        const v = (index + 1).toString().padStart(2, '0')
        return `${c}${s}${p}${v}`
    }, [tempProdId])

    const calculateBasePrice = (salesPrice: string, gst: string) => {
        const price = parseFloat(salesPrice)
        const gstRate = parseFloat(gst)
        if (isNaN(price) || isNaN(gstRate)) return "0.00"
        return (price / (1 + gstRate / 100)).toFixed(2)
    }

    // Effect to auto-generate barcodes when category selection path changes
    React.useEffect(() => {
        setVariants(prev => prev.map((v, i) => ({
            ...v,
            barcode: generateVariantBarcode(i, selectedCategoryIds)
        })))
    }, [selectedCategoryIds, generateVariantBarcode])

    const addVariant = () => {
        const newIndex = variants.length
        setVariants([...variants, {
            id: Date.now(),
            name: "",
            sku_suffix: "",
            salesPrice: "",
            exportSalesPrice: "",
            gstPercentage: "18",
            costPrice: "",
            stock: "",
            barcode: generateVariantBarcode(newIndex, selectedCategoryIds),
            warehouseId: "",
            rackLocation: "",
            image: null as string | null
        }])
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
        const finalValue = field === "image" ? (getGoogleDrivePreviewUrl(value) || "") : value
        setVariants(variants.map(v =>
            v.id === id ? { ...v, [field]: finalValue } : v
        ))
    }

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const payload = {
            productId: 0,
            productName: name,
            baseSKU: baseSKU,
            productTaggingNo: taggingNo,
            barcodeNumber: tempProdId, // Using the generated base ID
            categoryId: selectedCategoryIds[0] || 0,
            subcategoryId: selectedCategoryIds[1] || 0,
            subcategoryL2Id: selectedCategoryIds[2] || 0,
            subcategoryL3Id: selectedCategoryIds[3] || 0,
            subcategoryL4Id: selectedCategoryIds[4] || 0,
            brand: brand,
            unit: unit,
            description: description,
            hasVariants: variants.length > 0,
            status: true,
            variants: variants.map(v => ({
                variantId: 0,
                productId: 0,
                variantName: v.name,
                skuSuffix: v.sku_suffix,
                purchasePrice: parseFloat(v.costPrice) || 0,
                sellingPrice: parseFloat(v.salesPrice) || 0,
                sellingPriceOutsideIndia: parseFloat(v.exportSalesPrice) || 0,
                exportSellingPrice: parseFloat(v.exportSalesPrice) || 0,
                initialQuantity: parseInt(v.stock) || 0,
                currentQuantity: parseInt(v.stock) || 0,
                reorderLevel: 5, // Default
                status: true,
                gstPercentage: parseInt(v.gstPercentage) || 0,
                warehouseId: parseInt(v.warehouseId) || 0,
                rackLocation: v.rackLocation,
                barcodeNumber: v.barcode,
                variantImage: v.image || "",
                usdAmount: parseFloat(v.exportSalesPrice) || 0
            }))
        }

        try {
            await productsApi.create(payload)
            toast.success("Product created successfully with " + variants.length + " variants")
            router.push("/inventory/products")
        } catch (error) {
            console.error("Error creating product:", error)
            toast.error("Failed to create product. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add Product</h1>
                        <p className="text-muted-foreground">Create a new item in your catalog with variants and stock levels.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Product Information
                                </CardTitle>
                                <CardDescription>
                                    Basic identifying details for the product.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Product Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g., Surgical Blade #10"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="sku">Base SKU</Label>
                                        <Input
                                            id="sku"
                                            placeholder="e.g., SB-010"
                                            required
                                            value={baseSKU}
                                            onChange={(e) => setBaseSKU(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Technical specifications and usage details..."
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
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
                                    Categorize the product for easier searching and reporting.
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
                                <div className="grid grid-cols-2 gap-4">
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
                                            <div className="grid grid-cols-2     gap-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cost Price (₹)</Label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            className="pl-8"
                                                            placeholder="0.00"
                                                            value={v.costPrice}
                                                            onChange={(e) => handleVariantChange(v.id, "costPrice", e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-xs font-bold  uppercase tracking-wide text-muted-foreground">Sale Price (IND) (₹)</Label>
                                                    <div className="relative">
                                                        <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="number"
                                                            className="pl-8"
                                                            placeholder="0.00"
                                                            value={v.salesPrice}
                                                            onChange={(e) => handleVariantChange(v.id, "salesPrice", e.target.value)}
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
                                                        ₹{parseFloat(calculateBasePrice(v.salesPrice, v.gstPercentage)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                                            value={v.exportSalesPrice}
                                                            onChange={(e) => handleVariantChange(v.id, "exportSalesPrice", e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Column 3: Inventory & Warehouse */}
                                        <div className="md:col-span-3 grid gap-4 border-l pl-6">
                                            <div className="grid gap-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Stock</Label>
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
                                                        value={v.warehouseId}
                                                        onValueChange={(val) => handleVariantChange(v.id, "warehouseId", val || "")}
                                                    >
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {warehouses.map(w => (
                                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
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
                                                        <img src={v.image} alt="Variant Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                                                        {/* <Label className="flex flex-col items-center gap-1.5 cursor-pointer hover:text-primary transition-colors py-3 border-2 border-dashed border-muted-foreground/10 rounded-lg bg-muted/5">
                                                            <UploadCloud className="h-5 w-5 text-muted-foreground" />
                                                            <span className="text-[9px] font-bold uppercase tracking-tight">Upload File</span>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0]
                                                                    if (file) handleImageChange(v.id, file)
                                                                }}
                                                            />
                                                        </Label> 
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-px flex-1 bg-muted-foreground/10" />
                                                            <span className="text-[8px] font-bold text-muted-foreground/60">OR</span>
                                                            <div className="h-px flex-1 bg-muted-foreground/10" />
                                                        </div>*/}
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
                        <Button type="submit" disabled={isLoading} className="px-8 font-semibold">
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? "Creating Product..." : "Save Product"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
