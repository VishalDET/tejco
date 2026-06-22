"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit, Trash2, Package, Tag, Layers, AlertCircle, RefreshCcw, Loader2 } from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { categoriesApi, warehousesApi } from "@/lib/api"
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

export default function ViewProductPage() {
    const router = useRouter()
    const params = useParams()
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [product, setProduct] = React.useState<any>(null)
    const [categoriesMap, setCategoriesMap] = React.useState<Record<number, string>>({})
    const [warehousesMap, setWarehousesMap] = React.useState<Record<number, string>>({})

    const buildCategoryPath = (p: any, map: Record<number, string>) => {
        const path = []
        if (p.categoryId && map[p.categoryId]) path.push(map[p.categoryId])
        if (p.subcategoryId && map[p.subcategoryId]) path.push(map[p.subcategoryId])
        if (p.subcategoryL2Id && map[p.subcategoryL2Id]) path.push(map[p.subcategoryL2Id])
        if (p.subcategoryL3Id && map[p.subcategoryL3Id]) path.push(map[p.subcategoryL3Id])
        if (p.subcategoryL4Id && map[p.subcategoryL4Id]) path.push(map[p.subcategoryL4Id])
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
                const catMap: Record<number, string> = {}
                
                const extractCats = (list: any[]) => {
                    list.forEach(c => {
                        const id = c.categoryId || c.subcategoryId
                        const name = c.categoryName || c.subcategoryName
                        if (id && name) catMap[id] = name
                        if (c.subcategories && c.subcategories.length > 0) {
                            extractCats(c.subcategories)
                        }
                    })
                }
                extractCats(cats)
                setCategoriesMap(catMap)

                const wMap: Record<number, string> = {}
                wRes.forEach((w: any) => {
                    if (w.id && w.name) wMap[w.id] = w.name
                })
                setWarehousesMap(wMap)

                if (!params.id) return

                const response = await apiClient.get<any>(`/api/Product/GetById/${params.id}`)
                if (response.success && response.data) {
                    setProduct(response.data)
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

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            const response = await apiClient.delete<any>(`/api/Product/Delete/${params.id}`)
            if (response.success) {
                toast.success("Product deleted successfully")
                router.push("/inventory/products")
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
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num)
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">View Product</h1>
                        <p className="text-muted-foreground">Product details and variant information.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push(`/inventory/products/${params.id}`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
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
                                    and all its variants.
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
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading product details...</p>
                </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Product Information
                                </CardTitle>
                                <CardDescription>
                                    Product ID: {product.productId}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product Name</p>
                                        <p className="text-base font-medium mt-1">{product.productName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Base SKU</p>
                                        <p className="text-base font-mono mt-1">{product.baseSKU}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                                    <p className="text-sm mt-1 whitespace-pre-wrap">{product.description || "No description provided."}</p>
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
                                    How this product is grouped.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Path</p>
                                    <p className="text-base mt-1">{buildCategoryPath(product, categoriesMap)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Brand</p>
                                        <p className="text-base mt-1">{product.brand || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Unit</p>
                                        <p className="text-base mt-1">{product.unit || "PCS"}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tagging No.</p>
                                    <p className="text-base mt-1">{product.productTaggingNo || "-"}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-violet-600" />
                                Variants & Pricing
                            </CardTitle>
                            <CardDescription>
                                Available sizes, price points, and locations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            {!product.variants || product.variants.length === 0 ? (
                                <p className="text-muted-foreground py-4 text-center">No variants found.</p>
                            ) : (
                                product.variants.map((v: any) => (
                                    <div key={v.variantId} className="grid gap-4 pt-4 p-5 border rounded-xl bg-muted/10">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                            {/* Column 1: Variant Info */}
                                            <div className="md:col-span-3 grid gap-4">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Variant Name</p>
                                                    <p className="text-base font-medium mt-1">{v.variantName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SKU Suffix</p>
                                                    <p className="text-sm font-mono mt-1">{v.skuSuffix || "-"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                                                    <Badge variant={v.status ? "default" : "secondary"} className="mt-1">
                                                        {v.status ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Column 2: Pricing */}
                                            <div className="md:col-span-4 grid gap-4 md:border-l md:pl-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cost Price</p>
                                                        <p className="text-sm mt-1">{formatCurrency(v.purchasePrice)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sale Price (IND)</p>
                                                        <p className="text-sm mt-1 font-semibold">{formatCurrency(v.sellingPrice)}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GST %</p>
                                                        <p className="text-sm mt-1">{v.gstPercentage}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sale Price (INTL)</p>
                                                        <p className="text-sm mt-1">${v.usdAmount || v.exportSellingPrice || 0}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 3: Inventory */}
                                            <div className="md:col-span-3 grid gap-4 md:border-l md:pl-6">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Stock</p>
                                                    <p className="text-lg font-bold mt-1 text-primary">{v.currentQuantity || 0}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Warehouse</p>
                                                        <p className="text-sm mt-1">{warehousesMap[v.warehouseId] || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rack/Place</p>
                                                        <p className="text-sm mt-1">{v.rackLocation || "-"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 4: Media/Barcode */}
                                            <div className="md:col-span-2 flex flex-col gap-3">
                                                {v.variantImage ? (
                                                    <div className="aspect-square w-full rounded-lg border overflow-hidden">
                                                        <img src={getGoogleDrivePreviewUrl(v.variantImage) || ""} alt={v.variantName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    </div>
                                                ) : (
                                                    <div className="aspect-square w-full rounded-lg border border-dashed bg-muted flex items-center justify-center">
                                                        <span className="text-xs text-muted-foreground">No Image</span>
                                                    </div>
                                                )}
                                                {v.barcodeNumber && (
                                                    <div className="p-2 border rounded-lg bg-white text-center">
                                                        <p className="text-[10px] font-mono font-bold tracking-tighter truncate w-full">
                                                            {v.barcodeNumber}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
