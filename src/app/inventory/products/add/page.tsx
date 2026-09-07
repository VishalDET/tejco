
import * as React from "react"
import { useNavigate } from "react-router-dom"
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
import * as XLSX from "xlsx"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
  const navigate = useNavigate()
    const router = useNavigate()
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

    // Excel Import States
    const [isImportOpen, setIsImportOpen] = React.useState(false)
    const [previewData, setPreviewData] = React.useState<any>(null)

    const downloadTemplate = () => {
        const headers = [
            "Product Name",
            "HSN Code",
            "Brand",
            "Unit",
            "Description",
            "Tagging No",
            "Category Path",
            "Variant Name",
            "SKU Suffix",
            "Cost Price (INR)",
            "Sale Price IND (INR)",
            "Sale Price INTL (USD)",
            "GST %",
            "Initial Stock",
            "Warehouse Name/ID",
            "Rack Location",
            "Image URL"
        ]

        const sampleRow = [
            "Analyser-ASL (3 Lense)",
            "ASL-3",
            "Aram Huvis",
            "PCS",
            "Premium skin and hair analyser system",
            "TAG-8080",
            "Hair & Skin > Consultation Tools",
            "Default",
            "-DEF",
            "59289",
            "147500",
            "0",
            "18",
            "Main Hub Mumbai",
            "Aisle 1, Rack B",
            "https://example.com/image.jpg"
        ]

        const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Product & Variants")
        XLSX.writeFile(wb, "Tejco_Product_Import_Template.xlsx")
    }

    const getWarehouseId = (inputVal: string) => {
        if (!inputVal) return ""
        const numericId = parseInt(inputVal)
        if (!isNaN(numericId)) {
            const found = warehouses.find(w => w.id === String(numericId))
            if (found) return String(found.id)
        }
        const foundByName = warehouses.find(w => w.name.toLowerCase().trim() === inputVal.toLowerCase().trim())
        if (foundByName) return String(foundByName.id)
        return ""
    }

    const getWarehouseName = (idOrName: string) => {
        if (!idOrName) return "-"
        const found = warehouses.find(w => String(w.id) === idOrName || w.name.toLowerCase().trim() === idOrName.toLowerCase().trim())
        return found ? found.name : idOrName
    }

    const resolveCategoryPath = (pathStr: string) => {
        if (!pathStr) return []
        const parts = pathStr.split(">").map(p => p.trim())
        const resolvedIds: number[] = []
        let currentOptions: (Category | Subcategory)[] = categories

        for (const part of parts) {
            const found = currentOptions.find(o => 
                ((o as any).subcategoryName || (o as any).categoryName).toLowerCase() === part.toLowerCase()
            )
            if (found) {
                resolvedIds.push((found as any).subcategoryId || (found as any).categoryId)
                currentOptions = found.subcategories || []
            } else {
                break
            }
        }
        return resolvedIds
    }

    const parseExcel = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = e.target?.result
                if (!data) return
                const workbook = XLSX.read(data, { type: "binary" })
                const sheetName = workbook.SheetNames[0]
                const sheet = workbook.Sheets[sheetName]
                const rows = XLSX.utils.sheet_to_json<any>(sheet)
                if (rows.length === 0) {
                    toast.error("The Excel sheet has no data.")
                    return
                }

                // Extract product info from the first row
                const firstRow = rows[0]
                const productName = firstRow["Product Name"] || firstRow["Name"] || ""
                const baseSKU = firstRow["HSN Code"] || firstRow["Base SKU"] || firstRow["SKU"] || ""
                const brand = firstRow["Brand"] || ""
                const unit = firstRow["Unit"] || "PCS"
                const description = firstRow["Description"] || ""
                const taggingNo = firstRow["Tagging No"] || firstRow["Product Tagging No"] || ""
                const categoryPath = firstRow["Category Path"] || firstRow["Category"] || ""

                // Extract variants from all rows
                const parsedVariants = rows.map((row: any, index: number) => {
                    return {
                        id: index + 1,
                        name: row["Variant Name"] || row["Variant"] || `Variant ${index + 1}`,
                        sku_suffix: row["SKU Suffix"] || row["Suffix"] || "",
                        salesPrice: String(row["Sale Price IND (INR)"] || row["Sale Price IND"] || row["Sale Price"] || row["Selling Price"] || ""),
                        exportSalesPrice: String(row["Sale Price INTL (USD)"] || row["Sale Price INTL"] || row["Export Price"] || row["USD Amount"] || ""),
                        gstPercentage: String(row["GST %"] || row["GST Percentage"] || row["GST"] || "18"),
                        costPrice: String(row["Cost Price (INR)"] || row["Cost Price"] || ""),
                        stock: String(row["Initial Stock"] || row["Stock Quantity"] || row["Stock"] || row["Quantity"] || row["Qty"] || ""),
                        warehouseId: String(row["Warehouse Name/ID"] || row["Warehouse"] || row["Warehouse ID"] || ""),
                        rackLocation: row["Rack Location"] || row["Rack"] || row["Location"] || "",
                        image: row["Image URL"] || row["Image"] || null
                    }
                })

                setPreviewData({
                    product: { productName, baseSKU, brand, unit, description, taggingNo, categoryPath },
                    variants: parsedVariants
                })
                toast.success("Excel file parsed successfully. Preview loaded.")
            } catch (err) {
                console.error("Error parsing Excel:", err)
                toast.error("Failed to parse Excel file. Please verify sheet formatting.")
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleImportApply = () => {
        if (!previewData) return
        setName(previewData.product.productName)
        setBaseSKU(previewData.product.baseSKU)
        setBrand(previewData.product.brand)
        setUnit(previewData.product.unit)
        setDescription(previewData.product.description)
        setTaggingNo(previewData.product.taggingNo)

        let activePath = selectedCategoryIds
        if (previewData.product.categoryPath) {
            const resolvedPath = resolveCategoryPath(previewData.product.categoryPath)
            if (resolvedPath.length > 0) {
                activePath = resolvedPath
                setSelectedCategoryIds(resolvedPath)
            }
        }

        const mappedVariants = previewData.variants.map((v: any, index: number) => {
            const wId = getWarehouseId(v.warehouseId)
            return {
                id: v.id,
                name: v.name,
                sku_suffix: v.sku_suffix,
                salesPrice: v.salesPrice,
                exportSalesPrice: v.exportSalesPrice,
                gstPercentage: v.gstPercentage,
                costPrice: v.costPrice,
                stock: v.stock,
                barcode: generateVariantBarcode(index, activePath),
                warehouseId: wId,
                rackLocation: v.rackLocation,
                image: v.image
            }
        })

        setVariants(mappedVariants)
        setIsImportOpen(false)
        setPreviewData(null)
        toast.success("Imported details successfully loaded into the form.")
    }

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
            navigate("/inventory/products")
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
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add Product</h1>
                        <p className="text-muted-foreground">Create a new item in your catalog with variants and stock levels.</p>
                    </div>
                </div>
                <Button type="button" variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
                    <UploadCloud className="h-4 w-4" /> Import from Excel
                </Button>
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
                                        <Label htmlFor="sku">HSN Code</Label>
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
                        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
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

            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <UploadCloud className="h-5 w-5 text-primary" />
                            Import Product & Variants via Excel
                        </DialogTitle>
                        <DialogDescription>
                            Upload an Excel sheet to populate the form fields and variants. You can download the template below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 overflow-y-auto pr-1 py-2 flex-1">
                        <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-xl">
                            <div className="grid gap-1">
                                <p className="text-sm font-semibold">Step 1: Download Template</p>
                                <p className="text-xs text-muted-foreground">Use our standardized template to format your product data correctly.</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                                Download Excel Template
                            </Button>
                        </div>

                        <div className="grid gap-2">
                            <p className="text-sm font-semibold">Step 2: Upload Excel File</p>
                            <label className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-muted/10 transition-colors cursor-pointer border-muted-foreground/20">
                                <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
                                <span className="text-sm font-medium">Click to upload or drag & drop</span>
                                <span className="text-xs text-muted-foreground">Supports .xlsx and .xls formats</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) parseExcel(file)
                                    }}
                                />
                            </label>
                        </div>

                        {previewData && (
                            <div className="border rounded-xl p-4 bg-slate-50/50 space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="font-bold text-sm text-slate-800">Preview Data</h3>
                                    <span className="text-xs font-semibold text-primary">{previewData.variants.length} Variants Found</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                    <div>
                                        <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Product Name</p>
                                        <p className="font-medium text-slate-700 mt-0.5">{previewData.product.productName || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">HSN Code</p>
                                        <p className="font-medium text-slate-700 mt-0.5">{previewData.product.baseSKU || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Brand / Unit</p>
                                        <p className="font-medium text-slate-700 mt-0.5">{previewData.product.brand || "-"} / {previewData.product.unit || "PCS"}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Category Path</p>
                                        <p className="font-medium text-slate-700 mt-0.5">{previewData.product.categoryPath || "-"}</p>
                                    </div>
                                </div>

                                <div className="max-h-[220px] overflow-y-auto border rounded-lg bg-white">
                                    <table className="w-full text-xs text-left border-collapse">
                                        <thead className="bg-slate-50 sticky top-0 border-b">
                                            <tr>
                                                <th className="p-2 font-semibold text-slate-600">Variant Name</th>
                                                <th className="p-2 font-semibold text-slate-600">SKU Suffix</th>
                                                <th className="p-2 font-semibold text-slate-600 text-right">Cost Price</th>
                                                <th className="p-2 font-semibold text-slate-600 text-right">Sale Price IND</th>
                                                <th className="p-2 font-semibold text-slate-600 text-right">Sale Price INTL</th>
                                                <th className="p-2 font-semibold text-slate-600 text-center">GST %</th>
                                                <th className="p-2 font-semibold text-slate-600 text-right">Stock</th>
                                                <th className="p-2 font-semibold text-slate-600">Warehouse</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.variants.map((v: any) => (
                                                <tr key={v.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                                    <td className="p-2 text-slate-700 font-medium">{v.name}</td>
                                                    <td className="p-2 text-slate-500 font-mono">{v.sku_suffix || "-"}</td>
                                                    <td className="p-2 text-slate-700 text-right font-mono">₹{v.costPrice || "0"}</td>
                                                    <td className="p-2 text-slate-700 text-right font-mono">₹{v.salesPrice || "0"}</td>
                                                    <td className="p-2 text-slate-700 text-right font-mono">${v.exportSalesPrice || "0"}</td>
                                                    <td className="p-2 text-slate-500 text-center font-mono">{v.gstPercentage}%</td>
                                                    <td className="p-2 text-slate-700 text-right font-mono">{v.stock || "0"}</td>
                                                    <td className="p-2 text-slate-500 truncate max-w-[120px]">{getWarehouseName(v.warehouseId)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => { setIsImportOpen(false); setPreviewData(null); }}>
                            Close
                        </Button>
                        <Button type="button" disabled={!previewData} onClick={handleImportApply} className="px-6 font-semibold">
                            Apply to Form
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
