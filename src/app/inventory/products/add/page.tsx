"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, Plus, Trash2, Package, Tag, IndianRupee, Layers, Barcode, RefreshCcw } from "lucide-react"

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

export default function AddProductPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [name, setName] = React.useState("")
    const [category, setCategory] = React.useState("")
    const [subcategory, setSubcategory] = React.useState("")
    const [taggingNo, setTaggingNo] = React.useState("")
    const [barcode, setBarcode] = React.useState("")

    // Dynamic state for variants
    const [variants, setVariants] = React.useState([
        { id: Date.now(), name: "Default", sku_suffix: "-DEF", price: "", stock: "" }
    ])

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
        setIsLoading(true)

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false)
            toast.success("Product created successfully with " + variants.length + " variants")
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
                                        <Input id="sku" placeholder="e.g., SB-010" required />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" placeholder="Technical specifications and usage details..." rows={3} />
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
                                Categorize the product for easier searching and reporting.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select required value={category} onValueChange={(val) => setCategory(val || "")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="surgical-instruments">Surgical Instruments</SelectItem>
                                        <SelectItem value="consumables">Consumables</SelectItem>
                                        <SelectItem value="diagnostic">Diagnostic Equipment</SelectItem>
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
                                        <SelectItem value="blades">Blades</SelectItem>
                                        <SelectItem value="forceps">Forceps</SelectItem>
                                        <SelectItem value="gauze">Gauze</SelectItem>
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
                                    Manage different sizes, colors, or materials.
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
                                                placeholder="e.g., Large / Stainless"
                                                value={v.name}
                                                onChange={(e) => handleVariantChange(v.id, "name", e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>SKU Suffix</Label>
                                            <Input
                                                placeholder="-LG"
                                                value={v.sku_suffix}
                                                onChange={(e) => handleVariantChange(v.id, "sku_suffix", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Price (₹)</Label>
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
                                        <div className="grid gap-2">
                                            <Label>Initial Stock</Label>
                                            <Input
                                                type="number"
                                                placeholder="0"
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
