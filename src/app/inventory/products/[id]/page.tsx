"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Package, Tag, IndianRupee, Layers, Barcode, RefreshCcw, Loader2, AlertCircle } from "lucide-react"

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
    const [category, setCategory] = React.useState("")
    const [subcategory, setSubcategory] = React.useState("")
    const [taggingNo, setTaggingNo] = React.useState("")
    const [barcode, setBarcode] = React.useState("")

    // Dynamic state for variants
    const [variants, setVariants] = React.useState<any[]>([])

    React.useEffect(() => {
        const fetchProduct = async () => {
            if (!params.id) return

            try {
                setIsLoading(true)
                const response = await apiClient.get<any>(`/api/Product/GetById/${params.id}`)
                
                if (response.success && response.data) {
                    const p = response.data
                    setName(p.productName || "")
                    setSku(p.baseSKU || "")
                    setDesc(p.description || "")
                    setCategory(p.categoryId ? p.categoryId.toString() : "")
                    setSubcategory(p.subcategoryId ? p.subcategoryId.toString() : "")
                    setTaggingNo(p.productTaggingNo || "")
                    setBarcode(p.barcodeNumber || "")
                    
                    if (p.variants && p.variants.length > 0) {
                        setVariants(p.variants.map((v: any) => ({
                            id: v.variantId,
                            name: v.variantName,
                            sku_suffix: v.skuSuffix,
                            price: v.sellingPrice.toString(),
                            stock: v.currentQuantity.toString()
                        })))
                    } else {
                        setVariants([{ id: 1, name: "Standard", sku_suffix: "", price: "0", stock: "0" }])
                    }
                } else {
                    setError(response.message || "Product not found")
                }
            } catch (err: any) {
                console.error("Error fetching product:", err)
                setError(err.message || "An unexpected error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        fetchProduct()
    }, [params.id])

    const addVariant = () => {
        setVariants([...variants, { id: Date.now(), name: "", sku_suffix: "", price: "", stock: "" }])
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

        // Simulate API call
        setTimeout(() => {
            setIsSaving(false)
            toast.success(`Product "${name}" updated successfully`)
            router.push("/inventory/products")
        }, 1000)
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
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
                                    <Barcode className="h-5 w-5 text-emerald-600" />
                                    Tagging & Barcode
                                </CardTitle>
                                <CardDescription>
                                    Inventory tracking and scanning configuration.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="taggingNo">Product Tagging No.</Label>
                                    <Input
                                        id="taggingNo"
                                        value={taggingNo}
                                        onChange={(e) => setTaggingNo(e.target.value)}
                                        placeholder="e.g., TAG-12345"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="barcode">Barcode Number</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="barcode"
                                            value={barcode}
                                            onChange={(e) => setBarcode(e.target.value)}
                                            placeholder="UPC / EAN / GTIN"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setBarcode(Math.floor(100000000000 + Math.random() * 900000000000).toString())}
                                        >
                                            <RefreshCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {barcode && (
                                    <div className="pt-4 border-t">
                                        <BarcodeDisplay value={barcode} label={name} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>


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
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Surgical Instruments</SelectItem>
                                        <SelectItem value="3">Consumables</SelectItem>
                                        <SelectItem value="2">Diagnostic Equipment</SelectItem>
                                        {category && category !== "1" && category !== "2" && category !== "3" && (
                                            <SelectItem value={category}>Category ID: {category}</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Subcategory</Label>
                                <Select value={subcategory} onValueChange={(val) => setSubcategory(val || "")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select subcategory" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">Blades/Gloves</SelectItem>
                                        <SelectItem value="230">Forceps</SelectItem>
                                        <SelectItem value="232">Gauze</SelectItem>
                                        {subcategory && subcategory !== "7" && subcategory !== "230" && subcategory !== "232" && (
                                            <SelectItem value={subcategory}>Subcategory ID: {subcategory}</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="grid gap-1">
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-violet-600" />
                                    Variants & Pricing
                                </CardTitle>
                                <CardDescription>
                                    Manage versions and their respective details.
                                </CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Variant
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            {variants.map((v, index) => (
                                <div key={v.id} className="relative grid gap-4 p-4 border rounded-lg bg-muted/30">
                                    {variants.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 text-destructive"
                                            onClick={() => removeVariant(v.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Variant Name</Label>
                                            <Input
                                                value={v.name}
                                                onChange={(e) => handleVariantChange(v.id, "name", e.target.value)}
                                                placeholder="e.g., Large"
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>SKU Suffix</Label>
                                            <Input
                                                value={v.sku_suffix}
                                                onChange={(e) => handleVariantChange(v.id, "sku_suffix", e.target.value)}
                                                placeholder="-LG"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Price (₹)</Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    className="pl-8"
                                                    value={v.price}
                                                    onChange={(e) => handleVariantChange(v.id, "price", e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Initial Stock</Label>
                                            <Input
                                                type="number"
                                                value={v.stock}
                                                onChange={(e) => handleVariantChange(v.id, "stock", e.target.value)}
                                                required
                                            />
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
