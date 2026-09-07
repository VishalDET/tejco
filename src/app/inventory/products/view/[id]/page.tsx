import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Edit, Trash2, Package, Tag, Layers, AlertCircle, RefreshCcw, Loader2, ShoppingCart } from "lucide-react"

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

export default function ViewProductPage() {
    const navigate = useNavigate()
    const params = useParams()
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [product, setProduct] = React.useState<any>(null)
    const [salesDetails, setSalesDetails] = React.useState<any[] | null>(null)
    const [isSalesLoading, setIsSalesLoading] = React.useState(false)
    const [categories, setCategories] = React.useState<any[]>([])
    const [warehousesMap, setWarehousesMap] = React.useState<Record<number, string>>({})

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
                console.log("[ViewProduct] Fetched categories list raw:", catRes)
                console.log("[ViewProduct] Extracted categories list:", cats)
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

                console.log("[ViewProduct] Fetched product response:", response)
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
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num)
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">View Product</h1>
                        <p className="text-muted-foreground">Product details and variant information.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate(`/inventory/products/${params.id}`)}>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pt-4">
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Product Information
                                </CardTitle>
                                <CardDescription>
                                    Product ID: {product.productId}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 pb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product Name</p>
                                        <p className="text-base font-medium mt-1">{product.productName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">HSN Code</p>
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
                            <CardHeader className="pt-4">
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5 text-blue-600" />
                                    Classification
                                </CardTitle>
                                <CardDescription>
                                    How this product is grouped.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6 pb-4">
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Category Path</p>
                                    <p className="text-base mt-1">{buildCategoryPath(product, categories)}</p>
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
                        <CardHeader className="pt-4">
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5 text-violet-600" />
                                Variants & Pricing
                            </CardTitle>
                            <CardDescription>
                                Available sizes, price points, and locations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 pb-4">
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

                        <Card>
                            <CardHeader className="pt-4">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-emerald-600" />
                                Sales Records
                            </CardTitle>
                            <CardDescription>
                                Recent sales and invoice history for this product.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                            {!salesDetails || salesDetails.length === 0 ? (
                                <p className="text-muted-foreground py-4 text-center">No sales records found for this product.</p>
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
                                                <TableCell className="font-mono font-medium">
                                                    {item.invoiceNumber || item.orderNumber || item.reference || `#${item.id || idx + 1}`}
                                                </TableCell>
                                                <TableCell>{item.clientName || item.customerName || "-"}</TableCell>
                                                <TableCell>{item.variantName || "-"}</TableCell>
                                                <TableCell className="text-right font-mono">{item.quantity || item.qty || 0}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(item.unitPrice || item.price || 0)}</TableCell>
                                                <TableCell className="text-right font-mono font-semibold text-emerald-600">
                                                    {formatCurrency(item.totalAmount || item.amount || (item.quantity * item.unitPrice) || 0)}
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
        </div>
    )
}
