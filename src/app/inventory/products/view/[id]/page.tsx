import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    ArrowLeft,
    Edit,
    Trash2,
    Package,
    Tag,
    AlertCircle,
    RefreshCcw,
    Loader2,
    ShoppingCart,
    Copy,
    Check,
    Search,
    LayoutGrid,
    List,
    Barcode,
    MapPin,
    Warehouse,
    TrendingUp,
    Maximize2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Boxes,
    Layers,
    DollarSign,
    Sparkles,
    Eye
} from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import { categoriesApi, warehousesApi, productsApi } from "@/lib/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { BarcodeDisplay } from "@/components/ui/barcode-display"

export default function ViewProductPage() {
    const navigate = useNavigate()
    const params = useParams()
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [product, setProduct] = React.useState<any>(null)
    const [salesDetails, setSalesDetails] = React.useState<any[] | null>(null)
    const [categories, setCategories] = React.useState<any[]>([])
    const [warehousesMap, setWarehousesMap] = React.useState<Record<number, string>>({})

    // Linked Variations Showcase State
    const [viewMode, setViewMode] = React.useState<"cards" | "table">("cards")
    const [searchQuery, setSearchQuery] = React.useState("")
    const [stockFilter, setStockFilter] = React.useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all")
    const [activeVariantTab, setActiveVariantTab] = React.useState<number | "all">("all")
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
    const [previewImage, setPreviewImage] = React.useState<{ url: string; title: string } | null>(null)
    const [barcodeModal, setBarcodeModal] = React.useState<{ code: string; name: string; sku: string } | null>(null)

    const buildCategoryPath = (p: any, categoriesList: any[]) => {
        if (!categoriesList || categoriesList.length === 0) return "Uncategorized"

        const path: string[] = []
        let currentOptions = categoriesList

        const ids = [
            p.categoryId,
            p.subcategoryId,
            p.subcategoryL2Id,
            p.subcategoryL3Id,
            p.subcategoryL4Id
        ].filter(id => id && id !== 0)

        for (const selectedId of ids) {
            const found = currentOptions.find(o =>
                ((o as any).subcategoryId || (o as any).categoryId) === selectedId
            )
            if (found) {
                path.push((found as any).subcategoryName || (found as any).categoryName)
                currentOptions = found.subcategories || []
            } else {
                break
            }
        }

        return path.join(" > ") || "Uncategorized"
    }

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const [catRes, wRes] = await Promise.all([
                    categoriesApi.getAll().catch(() => []),
                    warehousesApi.getAll().catch(() => [])
                ])

                const cats = Array.isArray(catRes) ? catRes : (catRes as any).data || []
                setCategories(cats)

                const wMap: Record<number, string> = {}
                wRes.forEach((w: any) => {
                    if (w.id && w.name) wMap[w.id] = w.name
                })
                setWarehousesMap(wMap)

                if (!params.id) return

                const [response, salesRes] = await Promise.all([
                    apiClient.get<any>(`/api/Product/GetById/${params.id}`),
                    productsApi.getSalesDetails(params.id).catch(() => null)
                ])

                if (response.success && response.data) {
                    setProduct(response.data)
                } else {
                    setError(response.message || "Product not found")
                }

                if (salesRes) {
                    const sData = Array.isArray(salesRes) ? salesRes : salesRes.data || []
                    setSalesDetails(sData)
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

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            const response = await apiClient.delete<any>(`/api/Product/Delete/${params.id}`)
            if (response.success) {
                toast.success("Product deleted successfully")
                navigate("/inventory/products")
            } else {
                toast.error(response.message || "Failed to delete product")
                setIsDeleting(false)
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred during deletion")
            setIsDeleting(false)
        }
    }

    const formatCurrency = (val: any) => {
        const num = parseFloat(val)
        if (isNaN(num)) return "₹0.00"
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
    }

    const handleCopy = (text: string, key: string, label: string) => {
        if (!text) return
        navigator.clipboard.writeText(text)
        setCopiedKey(key)
        toast.success(`${label} copied`)
        setTimeout(() => setCopiedKey(null), 1800)
    }

    // --- Variation Calculations & Statistics ---
    const variants: any[] = product?.variants || []
    const totalVariants = variants.length
    const activeVariants = variants.filter(v => v.status).length
    const totalStock = variants.reduce((sum, v) => sum + (Number(v.currentQuantity) || 0), 0)

    const lowStockCount = variants.filter(v => {
        const qty = Number(v.currentQuantity) || 0
        const reorder = Number(v.reorderLevel) || 0
        return qty > 0 && qty <= reorder
    }).length

    const outOfStockCount = variants.filter(v => (Number(v.currentQuantity) || 0) === 0).length

    // Price spectrums
    const inrPrices = variants.map(v => Number(v.sellingPrice) || 0).filter(p => p > 0)
    const minInr = inrPrices.length > 0 ? Math.min(...inrPrices) : 0
    const maxInr = inrPrices.length > 0 ? Math.max(...inrPrices) : 0

    const usdPrices = variants.map(v => Number(v.usdAmount || v.exportSellingPrice) || 0).filter(p => p > 0)
    const minUsd = usdPrices.length > 0 ? Math.min(...usdPrices) : 0
    const maxUsd = usdPrices.length > 0 ? Math.max(...usdPrices) : 0

    // Average Margin %
    const margins = variants.map(v => {
        const sell = Number(v.sellingPrice) || 0
        const cost = Number(v.purchasePrice) || 0
        return sell > 0 && cost > 0 ? ((sell - cost) / sell) * 100 : null
    }).filter(m => m !== null) as number[]

    const avgMargin = margins.length > 0
        ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length)
        : null

    // Stock Status Helper
    const getStockHealth = (qty: number, reorder: number) => {
        if (qty <= 0) {
            return {
                label: "Out of Stock",
                dotColor: "bg-rose-500",
                color: "text-rose-600 dark:text-rose-400",
                badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
                barColor: "bg-rose-500",
                icon: XCircle,
            }
        }
        if (qty <= reorder) {
            return {
                label: `Low Stock (${qty}/${reorder})`,
                dotColor: "bg-amber-500",
                color: "text-amber-600 dark:text-amber-400",
                badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
                barColor: "bg-amber-500",
                icon: AlertTriangle,
            }
        }
        return {
            label: "In Stock",
            dotColor: "bg-emerald-500",
            color: "text-emerald-600 dark:text-emerald-400",
            badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
            barColor: "bg-emerald-500",
            icon: CheckCircle2,
        }
    }

    const calculateMargin = (sellPrice: number, costPrice: number) => {
        if (!sellPrice || sellPrice <= 0 || !costPrice || costPrice <= 0) return null
        return Math.round(((sellPrice - costPrice) / sellPrice) * 100)
    }

    // Filtered variations
    const filteredVariants = variants.filter(v => {
        if (activeVariantTab !== "all" && v.variantId !== activeVariantTab) {
            return false
        }

        const fullSku = `${product?.baseSKU || ""}${v.skuSuffix || ""}`
        const matchesSearch = !searchQuery ||
            (v.variantName && v.variantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.skuSuffix && v.skuSuffix.toLowerCase().includes(searchQuery.toLowerCase())) ||
            fullSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.barcodeNumber && v.barcodeNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.rackLocation && v.rackLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (warehousesMap[v.warehouseId] && warehousesMap[v.warehouseId].toLowerCase().includes(searchQuery.toLowerCase()))

        if (!matchesSearch) return false

        const qty = Number(v.currentQuantity) || 0
        const reorder = Number(v.reorderLevel) || 0

        if (stockFilter === "in_stock") return qty > reorder
        if (stockFilter === "low_stock") return qty > 0 && qty <= reorder
        if (stockFilter === "out_of_stock") return qty === 0

        return true
    })

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            {/* Top Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">View Product</h1>
                            {product?.status ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                                    Active
                                </Badge>
                            ) : (
                                <Badge variant="secondary">Inactive</Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-0.5">Product specifications, inventory levels, and linked variations.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate(`/inventory/products/${params.id}`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Product
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-9 px-4 py-2"
                            disabled={isDeleting || isLoading}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the product
                                    and all its variations.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={isDeleting}
                                    onClick={(e) => { e.preventDefault(); handleDelete(); }}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {isLoading ? (
                <Loader layout="container" size="lg" text="Loading product details..." />
            ) : error || !product ? (
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
                    {/* General Product & Category Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pt-4 pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Package className="h-4 w-4 text-primary" />
                                    Product Information
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Internal ID: #{product.productId}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Name</p>
                                        <p className="text-base font-medium mt-1">{product.productName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base SKU / HSN</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-sm font-semibold">{product.baseSKU || "-"}</span>
                                            {product.baseSKU && (
                                                <button
                                                    onClick={() => handleCopy(product.baseSKU, "base-sku", "Base SKU")}
                                                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                                    title="Copy Base SKU"
                                                >
                                                    {copiedKey === "base-sku" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                                    <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">{product.description || "No description provided."}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pt-4 pb-3">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Tag className="h-4 w-4 text-blue-600" />
                                    Classification & Hierarchy
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Organizational taxonomy and identifiers.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 pb-4">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category Path</p>
                                    <p className="text-sm font-medium mt-1 text-slate-800 dark:text-slate-200">{buildCategoryPath(product, categories)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand</p>
                                        <p className="text-sm font-medium mt-1">{product.brand || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Default Unit</p>
                                        <p className="text-sm font-medium mt-1">{product.unit || "PCS"}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tagging Number</p>
                                        <p className="text-sm font-medium mt-0.5">{product.productTaggingNo || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Barcode</p>
                                        <p className="text-sm font-medium mt-0.5">{product.barcodeNumber || "—"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ======================================================== */}
                    {/* ELEVATED LINKED VARIATIONS SHOWCASE                      */}
                    {/* ======================================================== */}
                    <Card className="border-indigo-100 dark:border-indigo-950/60 shadow-xs overflow-hidden">
                        {/* Section Header with KPI Highlights */}
                        <div className="bg-gradient-to-r from-indigo-50/80 via-slate-50/50 to-background dark:from-indigo-950/30 dark:via-slate-900/40 dark:to-background border-b px-6 py-5">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <Boxes className="h-4 w-4" />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight text-foreground">Linked Variations</h2>
                                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 font-semibold px-2.5 py-0.5 text-xs">
                                            {totalVariants} {totalVariants === 1 ? "Variant" : "Variants"}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        All active options, pricing tiers, stock levels, and warehouse racks for this product.
                                    </p>
                                </div>

                                {/* View Switcher & Search */}
                                <div className="flex items-center gap-2">
                                    <div className="relative w-48 sm:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search variations..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-8.5 pl-8 text-xs bg-background/90"
                                        />
                                    </div>
                                    <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={viewMode === "cards" ? "default" : "ghost"}
                                            className="h-7.5 px-2.5 text-xs gap-1.5"
                                            onClick={() => setViewMode("cards")}
                                        >
                                            <LayoutGrid className="h-3.5 w-3.5" />
                                            Cards
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={viewMode === "table" ? "default" : "ghost"}
                                            className="h-7.5 px-2.5 text-xs gap-1.5"
                                            onClick={() => setViewMode("table")}
                                        >
                                            <List className="h-3.5 w-3.5" />
                                            Table
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Mini KPI Highlights Bar */}
                            {totalVariants > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-indigo-100/60 dark:border-indigo-900/40">
                                    <div className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl p-3 border shadow-2xs">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Total Available Stock</span>
                                        <div className="flex items-baseline gap-2 mt-0.5">
                                            <span className="text-xl font-bold text-foreground">{totalStock}</span>
                                            <span className="text-xs text-muted-foreground">units</span>
                                        </div>
                                    </div>

                                    <div className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl p-3 border shadow-2xs">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Price Range (IND)</span>
                                        <div className="text-base font-bold text-foreground truncate mt-0.5">
                                            {minInr > 0 ? (
                                                minInr === maxInr ? formatCurrency(minInr) : `${formatCurrency(minInr)} - ${formatCurrency(maxInr)}`
                                            ) : "₹0"}
                                        </div>
                                    </div>

                                    <div className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl p-3 border shadow-2xs">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Export Price (USD)</span>
                                        <div className="text-base font-bold text-foreground truncate mt-0.5">
                                            {minUsd > 0 ? (
                                                minUsd === maxUsd ? `$${minUsd}` : `$${minUsd} - $${maxUsd}`
                                            ) : "—"}
                                        </div>
                                    </div>

                                    <div className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-xl p-3 border shadow-2xs">
                                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Average Margin</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                                {avgMargin !== null ? `+${avgMargin}%` : "—"}
                                            </span>
                                            {avgMargin !== null && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick Filter Pill Chips */}
                            {totalVariants > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <span className="text-xs font-semibold text-muted-foreground mr-1">Filter Stock:</span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={stockFilter === "all" ? "default" : "outline"}
                                        className="h-7 rounded-full text-xs px-3"
                                        onClick={() => setStockFilter("all")}
                                    >
                                        All ({variants.length})
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={stockFilter === "in_stock" ? "default" : "outline"}
                                        className={`h-7 rounded-full text-xs px-3 ${stockFilter === "in_stock" ? "bg-emerald-600 hover:bg-emerald-700" : "text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"}`}
                                        onClick={() => setStockFilter("in_stock")}
                                    >
                                        In Stock ({variants.filter(v => (v.currentQuantity || 0) > (v.reorderLevel || 0)).length})
                                    </Button>
                                    {lowStockCount > 0 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={stockFilter === "low_stock" ? "default" : "outline"}
                                            className={`h-7 rounded-full text-xs px-3 ${stockFilter === "low_stock" ? "bg-amber-600 hover:bg-amber-700" : "text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"}`}
                                            onClick={() => setStockFilter("low_stock")}
                                        >
                                            Low Stock ({lowStockCount})
                                        </Button>
                                    )}
                                    {outOfStockCount > 0 && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={stockFilter === "out_of_stock" ? "default" : "outline"}
                                            className={`h-7 rounded-full text-xs px-3 ${stockFilter === "out_of_stock" ? "bg-rose-600 hover:bg-rose-700" : "text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"}`}
                                            onClick={() => setStockFilter("out_of_stock")}
                                        >
                                            Out of Stock ({outOfStockCount})
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Quick Variant Switcher Bar (if more than 1 variant) */}
                            {totalVariants > 1 && (
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-3 pt-3 border-t">
                                    <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">Direct Jump:</span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveVariantTab("all")}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${activeVariantTab === "all" ? "bg-foreground text-background font-semibold" : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"}`}
                                    >
                                        Show All
                                    </button>
                                    {variants.map((v, idx) => {
                                        const isSelected = activeVariantTab === v.variantId
                                        const qty = Number(v.currentQuantity) || 0
                                        const reorder = Number(v.reorderLevel) || 0
                                        const health = getStockHealth(qty, reorder)
                                        return (
                                            <button
                                                key={v.variantId || idx}
                                                type="button"
                                                onClick={() => setActiveVariantTab(v.variantId)}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 border ${isSelected ? "bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs" : "bg-card hover:bg-muted text-foreground border-border/80"}`}
                                            >
                                                <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-white" : health.dotColor}`} />
                                                <span className="truncate max-w-[130px]">{v.variantName || `Variant #${idx + 1}`}</span>
                                                <span className={`text-[10px] ${isSelected ? "text-indigo-200" : "text-muted-foreground"}`}>
                                                    ({formatCurrency(v.sellingPrice)})
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <CardContent className="p-6">
                            {totalVariants === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Boxes className="h-12 w-12 text-muted-foreground/40 mb-3" />
                                    <p className="text-base font-semibold">No Variations Linked</p>
                                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                        This product does not currently have any linked variations or sizes configured.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => navigate(`/inventory/products/${params.id}`)}
                                    >
                                        <Edit className="mr-1.5 h-3.5 w-3.5" /> Configure Variations
                                    </Button>
                                </div>
                            ) : filteredVariants.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                    <p className="text-base font-semibold">No Matching Variations</p>
                                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                        No variations match your current search or stock filter.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => { setSearchQuery(""); setStockFilter("all"); setActiveVariantTab("all"); }}
                                    >
                                        Reset Filters
                                    </Button>
                                </div>
                            ) : viewMode === "cards" ? (
                                /* ============================================ */
                                /* VIEW MODE: VISUAL CARDS GRID                 */
                                /* ============================================ */
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                    {filteredVariants.map((v: any, index: number) => {
                                        const fullSku = `${product.baseSKU || ""}${v.skuSuffix || ""}`
                                        const qty = Number(v.currentQuantity) || 0
                                        const reorder = Number(v.reorderLevel) || 0
                                        const health = getStockHealth(qty, reorder)
                                        const margin = calculateMargin(Number(v.sellingPrice), Number(v.purchasePrice))
                                        const HealthIcon = health.icon
                                        const imageUrl = getGoogleDrivePreviewUrl(v.variantImage)

                                        return (
                                            <div
                                                key={v.variantId || index}
                                                className="rounded-2xl border bg-card/60 hover:bg-card shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between border-border/80 hover:border-indigo-200 dark:hover:border-indigo-900"
                                            >
                                                {/* Card Header Bar */}
                                                <div className="p-4 border-b bg-muted/20 flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                Variation #{index + 1}
                                                            </span>
                                                            <Badge
                                                                variant={v.status ? "default" : "secondary"}
                                                                className={`text-[10px] h-5 px-2 font-semibold ${v.status ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}`}
                                                            >
                                                                {v.status ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </div>
                                                        <h3 className="text-base font-bold text-foreground tracking-tight mt-0.5 truncate">
                                                            {v.variantName}
                                                        </h3>
                                                    </div>

                                                    {/* Full SKU Badge with Copy */}
                                                    <div className="shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(fullSku, `sku-${v.variantId}`, "SKU")}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted/90 hover:bg-muted text-foreground border transition-colors cursor-pointer"
                                                            title="Click to copy SKU"
                                                        >
                                                            <span className="text-muted-foreground text-[11px]">SKU:</span>
                                                            <span className="font-bold">{fullSku}</span>
                                                            {copiedKey === `sku-${v.variantId}` ? (
                                                                <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                                                            ) : (
                                                                <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground shrink-0" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-4.5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                                                    {/* Left Media Thumbnail */}
                                                    <div className="sm:col-span-4 flex flex-col gap-2">
                                                        <div className="relative aspect-square w-full rounded-xl border bg-muted/30 overflow-hidden group/img">
                                                            {imageUrl ? (
                                                                <>
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={v.variantName}
                                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105 cursor-pointer"
                                                                        onClick={() => setPreviewImage({ url: imageUrl, title: v.variantName })}
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewImage({ url: imageUrl, title: v.variantName })}
                                                                        className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-medium cursor-pointer"
                                                                    >
                                                                        <Maximize2 className="h-4 w-4" />
                                                                        <span>Enlarge</span>
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60 gap-1">
                                                                    <Package className="h-6 w-6 stroke-[1.5]" />
                                                                    <span className="text-[11px]">No image</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Location Pill */}
                                                        <div className="flex flex-col gap-1 text-[11px] bg-muted/40 p-2 rounded-lg border">
                                                            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                                                <Warehouse className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                                                <span className="truncate">{warehousesMap[v.warehouseId] || "Main Store"}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
                                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                                                                <span className="truncate">Rack: {v.rackLocation || "Unassigned"}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Details (Stock & Financials) */}
                                                    <div className="sm:col-span-8 flex flex-col gap-3.5">
                                                        {/* Stock Health Strip */}
                                                        <div className="rounded-xl border p-3 bg-muted/20">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <HealthIcon className={`h-4 w-4 ${health.color}`} />
                                                                    <span className="text-xs font-semibold">{health.label}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-lg font-bold text-foreground">{qty}</span>
                                                                    <span className="text-xs text-muted-foreground ml-1">{product.unit || "PCS"}</span>
                                                                </div>
                                                            </div>

                                                            {/* Micro visual stock capacity bar */}
                                                            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                                                                <div
                                                                    className={`h-full ${health.barColor} transition-all duration-300`}
                                                                    style={{
                                                                        width: `${Math.min(100, Math.max(8, reorder > 0 ? (qty / (reorder * 2)) * 100 : (qty > 0 ? 100 : 0)))}%`
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                                                                <span>Reorder Threshold: {reorder}</span>
                                                                <span>Initial: {v.initialQuantity || 0}</span>
                                                            </div>
                                                        </div>

                                                        {/* Pricing Matrix */}
                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            {/* Domestic Sell Price */}
                                                            <div className="p-2.5 rounded-xl border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                                                        Sale Price (IND)
                                                                    </span>
                                                                    {margin !== null && (
                                                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded">
                                                                            +{margin}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                                                                    {formatCurrency(v.sellingPrice)}
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground block mt-0.5">
                                                                    GST: {v.gstPercentage || 0}%
                                                                </span>
                                                            </div>

                                                            {/* Cost & Export */}
                                                            <div className="p-2.5 rounded-xl border bg-muted/30 flex flex-col justify-between">
                                                                <div>
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                                        Cost Price
                                                                    </span>
                                                                    <div className="text-sm font-semibold text-foreground mt-0.5">
                                                                        {formatCurrency(v.purchasePrice)}
                                                                    </div>
                                                                </div>
                                                                <div className="pt-1.5 border-t mt-1.5 flex items-center justify-between text-[11px]">
                                                                    <span className="text-muted-foreground">Export:</span>
                                                                    <span className="font-bold text-foreground">
                                                                        ${v.usdAmount || v.exportSellingPrice || 0}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Footer with Barcode Strip */}
                                                {v.barcodeNumber && (
                                                    <div className="p-3 border-t bg-muted/15 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                                                            <Barcode className="h-3.5 w-3.5 text-slate-500" />
                                                            <span className="font-semibold text-foreground">{v.barcodeNumber}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopy(v.barcodeNumber, `bc-${v.variantId}`, "Barcode")}
                                                                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                                                title="Copy barcode"
                                                            >
                                                                {copiedKey === `bc-${v.variantId}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                                            </button>
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs px-2 gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                                            onClick={() => setBarcodeModal({ code: v.barcodeNumber, name: v.variantName, sku: fullSku })}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                            View Barcode
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                /* ============================================ */
                                /* VIEW MODE: MATRIX COMPARISON TABLE           */
                                /* ============================================ */
                                <div className="rounded-xl border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/40">
                                            <TableRow>
                                                <TableHead className="w-[60px]">Image</TableHead>
                                                <TableHead>Variation & SKU</TableHead>
                                                <TableHead>Stock Level</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                                <TableHead className="text-right">Sale (IND)</TableHead>
                                                <TableHead className="text-right">Export (USD)</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Barcode</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredVariants.map((v: any, index: number) => {
                                                const fullSku = `${product.baseSKU || ""}${v.skuSuffix || ""}`
                                                const qty = Number(v.currentQuantity) || 0
                                                const reorder = Number(v.reorderLevel) || 0
                                                const health = getStockHealth(qty, reorder)
                                                const margin = calculateMargin(Number(v.sellingPrice), Number(v.purchasePrice))
                                                const imageUrl = getGoogleDrivePreviewUrl(v.variantImage)

                                                return (
                                                    <TableRow key={v.variantId || index} className="hover:bg-muted/30">
                                                        {/* Thumbnail */}
                                                        <TableCell>
                                                            <div className="h-10 w-10 rounded-lg border bg-muted/20 overflow-hidden flex items-center justify-center shrink-0">
                                                                {imageUrl ? (
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt={v.variantName}
                                                                        className="h-full w-full object-cover cursor-pointer"
                                                                        onClick={() => setPreviewImage({ url: imageUrl, title: v.variantName })}
                                                                        referrerPolicy="no-referrer"
                                                                    />
                                                                ) : (
                                                                    <Package className="h-4 w-4 text-muted-foreground/60" />
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Variation Name & SKU */}
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-foreground text-sm">{v.variantName}</span>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    <span className="text-xs font-mono text-muted-foreground">{fullSku}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopy(fullSku, `tbl-sku-${v.variantId}`, "SKU")}
                                                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                                                        title="Copy SKU"
                                                                    >
                                                                        {copiedKey === `tbl-sku-${v.variantId}` ? (
                                                                            <Check className="h-3 w-3 text-emerald-600" />
                                                                        ) : (
                                                                            <Copy className="h-3 w-3" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        {/* Stock Level */}
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold text-sm text-foreground">{qty}</span>
                                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4.5 ${health.badgeClass}`}>
                                                                        {health.label}
                                                                    </Badge>
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground">Reorder at: {reorder}</span>
                                                            </div>
                                                        </TableCell>

                                                        {/* Cost Price */}
                                                        <TableCell className="text-right text-xs">
                                                            {formatCurrency(v.purchasePrice)}
                                                        </TableCell>

                                                        {/* Sale Price IND */}
                                                        <TableCell className="text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                                                    {formatCurrency(v.sellingPrice)}
                                                                </span>
                                                                {margin !== null && (
                                                                    <span className="text-[10px] font-semibold text-emerald-600">
                                                                        +{margin}% margin
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        {/* Export Price USD */}
                                                        <TableCell className="text-right text-xs font-semibold">
                                                            ${v.usdAmount || v.exportSellingPrice || 0}
                                                        </TableCell>

                                                        {/* Warehouse & Rack */}
                                                        <TableCell className="text-xs">
                                                            <div className="flex flex-col text-slate-700 dark:text-slate-300">
                                                                <span className="font-medium truncate max-w-[120px]">{warehousesMap[v.warehouseId] || "Main"}</span>
                                                                <span className="text-[10px] text-muted-foreground">Rack: {v.rackLocation || "—"}</span>
                                                            </div>
                                                        </TableCell>

                                                        {/* Barcode */}
                                                        <TableCell className="text-xs">
                                                            {v.barcodeNumber ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBarcodeModal({ code: v.barcodeNumber, name: v.variantName, sku: fullSku })}
                                                                    className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 hover:text-indigo-700 hover:underline"
                                                                >
                                                                    <Barcode className="h-3 w-3" />
                                                                    <span>{v.barcodeNumber}</span>
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>

                                                        {/* Status */}
                                                        <TableCell className="text-center">
                                                            <Badge
                                                                variant={v.status ? "default" : "secondary"}
                                                                className={`text-[10px] h-5 ${v.status ? "bg-emerald-600" : ""}`}
                                                            >
                                                                {v.status ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sales Records Section */}
                    <Card>
                        <CardHeader className="pt-4 pb-3">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                                Recent Sales & Invoice History
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Order fulfillment and invoice records matching this product.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                            {!salesDetails || salesDetails.length === 0 ? (
                                <p className="text-muted-foreground py-8 text-center text-sm">No sales records found for this product.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice # / Ref</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Variant</TableHead>
                                            <TableHead className="text-right">Quantity</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {salesDetails.map((item: any, idx: number) => (
                                            <TableRow key={item.id || item.invoiceId || idx}>
                                                <TableCell className="font-semibold text-xs">
                                                    {item.invoiceNumber || item.orderNumber || item.reference || `#${item.id || idx + 1}`}
                                                </TableCell>
                                                <TableCell className="text-sm">{item.clientName || item.customerName || "-"}</TableCell>
                                                <TableCell className="text-sm font-medium">{item.variantName || "-"}</TableCell>
                                                <TableCell className="text-right text-sm">{item.quantity || item.qty || 0}</TableCell>
                                                <TableCell className="text-right text-sm">{formatCurrency(item.unitPrice || item.price || 0)}</TableCell>
                                                <TableCell className="text-right text-sm font-bold text-emerald-600">
                                                    {formatCurrency(item.totalAmount || item.amount || ((item.quantity || 0) * (item.unitPrice || 0)) || 0)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {item.date || item.createdAt ? new Date(item.date || item.createdAt).toLocaleDateString("en-GB") : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Lightbox Image Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="sm:max-w-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">{previewImage?.title || "Variant Image"}</DialogTitle>
                        <DialogDescription className="text-xs">Full size image preview</DialogDescription>
                    </DialogHeader>
                    {previewImage?.url && (
                        <div className="aspect-square w-full rounded-xl overflow-hidden border bg-muted/20 flex items-center justify-center mt-2">
                            <img
                                src={previewImage.url}
                                alt={previewImage.title}
                                className="max-h-full max-w-full object-contain"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Barcode Print / View Dialog */}
            <Dialog open={!!barcodeModal} onOpenChange={(open) => !open && setBarcodeModal(null)}>
                <DialogContent className="sm:max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Barcode Display</DialogTitle>
                        <DialogDescription className="text-xs">
                            {barcodeModal?.name} ({barcodeModal?.sku})
                        </DialogDescription>
                    </DialogHeader>
                    {barcodeModal?.code && (
                        <div className="mt-4 flex flex-col items-center justify-center">
                            <BarcodeDisplay value={barcodeModal.code} label={`${barcodeModal.sku} - ${barcodeModal.name}`} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
