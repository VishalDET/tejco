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
import { warehousesApi, productsApi } from "@/lib/api"
import type { Warehouse } from "@/app/supply-chain/warehouse/types"

export default function AddProductPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [name, setName] = React.useState("")
    const [baseSKU, setBaseSKU] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [brand, setBrand] = React.useState("")
    const [unit, setUnit] = React.useState("PCS")
    const [category, setCategory] = React.useState("")
    const [subcategory, setSubcategory] = React.useState("")
    const [taggingNo, setTaggingNo] = React.useState("")
    const [warehouses, setWarehouses] = React.useState<Warehouse[]>([])
    // Placeholder for product ID used in barcode generation
    const [tempProdId, setTempProdId] = React.useState("0000")
    
    // Generate a random product ID only on the client to avoid hydration mismatch
    React.useEffect(() => {
        setTempProdId(Math.floor(1000 + Math.random() * 9000).toString())
    }, [])

    // Fetch warehouses on mount
    React.useEffect(() => {
        const fetchWarehouses = async () => {
            const data = await warehousesApi.getAll()
            setWarehouses(data)
        }
        fetchWarehouses()
    }, [])

    // Dynamic state for variants
    const [variants, setVariants] = React.useState([
        { 
            id: 1, 
            name: "Default", 
            sku_suffix: "-DEF", 
            salesPrice: "", 
            gstPercentage: "18", 
            costPrice: "",
            stock: "", 
            barcode: "",
            warehouseId: "",
            rackLocation: "",
            image: null as string | null
        }
    ])

    const generateVariantBarcode = React.useCallback((index: number, catId: string, subId: string) => {
        const c = catId || "0"
        const s = subId || "000"
        const p = tempProdId
        const v = (index + 1).toString().padStart(2, '0')
        return `${c}${s}${p}${v}`
    }, [tempProdId])

    const calculateBasePrice = (salesPrice: string, gst: string) => {
        const price = parseFloat(salesPrice)
        const gstRate = parseFloat(gst)
        if (isNaN(price) || isNaN(gstRate)) return "0.00"
        return (price - (price * gstRate / 100)).toFixed(2)
    }

    // Effect to auto-generate barcodes when category or subcategory changes
    React.useEffect(() => {
        setVariants(prev => prev.map((v, i) => ({
            ...v,
            barcode: generateVariantBarcode(i, category, subcategory)
        })))
    }, [category, subcategory, generateVariantBarcode])

    const addVariant = () => {
        const newIndex = variants.length
        setVariants([...variants, { 
            id: Date.now(), 
            name: "", 
            sku_suffix: "", 
            salesPrice: "", 
            gstPercentage: "18", 
            costPrice: "",
            stock: "", 
            barcode: generateVariantBarcode(newIndex, category, subcategory),
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
        setVariants(variants.map(v =>
            v.id === id ? { ...v, [field]: value } : v
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
            categoryId: parseInt(category) || 0,
            subcategoryId: parseInt(subcategory) || 0,
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
                initialQuantity: parseInt(v.stock) || 0,
                currentQuantity: parseInt(v.stock) || 0,
                reorderLevel: 5, // Default
                status: true,
                gstPercentage: parseInt(v.gstPercentage) || 0,
                warehouseId: parseInt(v.warehouseId) || 0,
                rackLocation: v.rackLocation,
                barcodeNumber: v.barcode,
                variantImage: v.image || ""
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
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select required value={category} onValueChange={(val) => setCategory(val || "")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Surgical Instruments</SelectItem>
                                            <SelectItem value="3">Consumables</SelectItem>
                                            <SelectItem value="2">Diagnostic Equipment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Subcategory (Optional)</Label>
                                    <Select value={subcategory} onValueChange={(val) => setSubcategory(val || "")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select subcategory" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">Blades/Gloves</SelectItem>
                                            <SelectItem value="230">Forceps</SelectItem>
                                            <SelectItem value="232">Gauze</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                <div key={v.id} className="relative grid gap-4 p-5 border-2 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                                    {variants.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => removeVariant(v.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                        {/* Column 1: Variant Info */}
                                        <div className="md:col-span-4 grid gap-4">
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
                                        <div className="md:col-span-3 grid gap-4 border-l pl-6">
                                            <div className="grid grid-cols-1 gap-4">
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
                                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sales Price (₹)</Label>
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
                                                        ₹{calculateBasePrice(v.salesPrice, v.gstPercentage)}
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
                                                        <img src={v.image} alt="Variant Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
                                                    <Label className="flex flex-col items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                                                        <UploadCloud className="h-6 w-6 text-muted-foreground" />
                                                        <span className="text-[10px] font-medium uppercase tracking-tight">Upload Image</span>
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
                                                )}
                                            </div>

                                            {/* Barcode Display */}
                                            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-dashed gap-1">
                                                <div className="w-full h-10">
                                                    <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                                                        {/* Simple dummy barcode effect */}
                                                        {Array.from({length: 20}).map((_, i) => (
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
