import * as React from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useCallback, useRef } from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    ExpandedState,
    PaginationState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal,
    Plus,
    Search,
    Filter,
    Download,
    Loader2,
    AlertCircle,
    Boxes,
    Copy,
    Check,
    ExternalLink,
    MapPin,
    Barcode,
    Package,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    TrendingUp,
    PackageCheck,
    Eye,
    X,
    RefreshCw,
    ShoppingCart,
    LayoutGrid,
    List,
    Warehouse,
    Maximize2,
    Tag,
} from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { toast } from "sonner"
import { getGoogleDrivePreviewUrl } from "@/lib/utils"
import { warehousesApi, categoriesApi } from "@/lib/api"
import { StatCard, StatGrid } from "@/components/common/cards"

// --- API Types ---
interface ApiVariant {
    variantId: number
    productId: number
    variantName: string
    skuSuffix: string
    purchasePrice: number
    sellingPrice: number
    initialQuantity: number
    currentQuantity: number
    reorderLevel: number
    status: boolean
    exportSellingPrice?: number
    usdAmount?: number
    gstPercentage?: number
    warehouseId?: number
    rackLocation?: string
    variantImage?: string
    barcodeNumber?: string
}

interface ApiProduct {
    productId: number
    productName: string
    baseSKU: string
    productTaggingNo: string
    barcodeNumber: string
    categoryId: number
    subcategoryId: number
    subcategoryL2Id: number
    subcategoryL3Id: number
    subcategoryL4Id: number
    brand: string
    unit: string
    description: string
    hasVariants: boolean
    status: boolean
    variants: ApiVariant[]
}

interface ApiResponse {
    statusCode: number
    success: boolean
    message: string
    data: ApiProduct[]
    totalCount: number
    error: any
}

export type Product = {
    id: string
    name: string
    sku: string
    category: string
    categoryId?: number
    variants: number
    costPrice: number
    costPriceMax: number
    sellingPrice: number
    sellingPriceMax: number
    price: number
    stock: number
    status: "Active" | "Inactive" | "Low Stock"
    rawVariants: ApiVariant[]
}

const ActionsCell = ({ row, onNavigate }: { row: any; onNavigate: (path: string) => void }) => {
    const [isDeleting, setIsDeleting] = React.useState(false)

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            const res = await apiClient.delete<any>(`/api/Product/Delete/${row.original.id}`)
            if (res.success) {
                toast.success("Product deleted successfully")
                window.location.reload()
            } else {
                toast.error(res.message || "Failed to delete")
                setIsDeleting(false)
            }
        } catch (e: any) {
            toast.error(e.message || "Error deleting product")
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(row.original.id)
                        toast.success("Product ID copied")
                    }}>
                        Copy product ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onNavigate(`/inventory/products/view/${row.original.id}`)}>
                        <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNavigate(`/inventory/products/${row.original.id}`)}>
                        Edit product
                    </DropdownMenuItem>
                    {/* Restock PO — only for low / out-of-stock products */}
                    {(row.original.status === "Low Stock" || row.original.stock === 0) && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onNavigate(`/purchase/create?restock=${row.original.id}`)}
                                className="text-amber-700 dark:text-amber-400 focus:bg-amber-50 dark:focus:bg-amber-950/40 focus:text-amber-800"
                            >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Create Restock PO
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger
                        // @ts-ignore
                        nativeButton={false}
                        render={
                            <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                                Delete product
                            </DropdownMenuItem>
                        }
                    />
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product
                        "{row.original.name}" and all its linked variations.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

const formatCurrency = (val: any) => {
    const num = parseFloat(val)
    if (isNaN(num)) return "₹0"
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
}

/**
 * Modern Linked Variations Showcase component rendered when expanding a table row
 */
function ProductVariantsExpandedRow({
    row,
    warehousesMap,
    onNavigate,
    viewMode = "cards",
    onViewModeChange,
}: {
    row: any
    warehousesMap: Record<number, string>
    onNavigate: (path: string) => void
    viewMode?: "cards" | "table"
    onViewModeChange?: (mode: "cards" | "table") => void
}) {
    const product = row.original
    const variants: any[] = product.rawVariants || []
    const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
    const [localViewMode, setLocalViewMode] = React.useState<"cards" | "table">("cards")
    const [previewImage, setPreviewImage] = React.useState<{ url: string; title: string } | null>(null)
    const [barcodeModal, setBarcodeModal] = React.useState<{ code: string; name: string; sku: string } | null>(null)

    const currentViewMode = viewMode || localViewMode

    const handleSetMode = (mode: "cards" | "table") => {
        setLocalViewMode(mode)
        onViewModeChange?.(mode)
    }

    const handleCopy = (text: string, key: string, label: string) => {
        if (!text) return
        navigator.clipboard.writeText(text)
        setCopiedKey(key)
        toast.success(`${label} copied`)
        setTimeout(() => setCopiedKey(null), 1800)
    }

    const totalStock = variants.reduce((sum, v) => sum + (Number(v.currentQuantity) || 0), 0)
    const inrPrices = variants.map(v => Number(v.sellingPrice) || 0).filter(p => p > 0)
    const minInr = inrPrices.length > 0 ? Math.min(...inrPrices) : 0
    const maxInr = inrPrices.length > 0 ? Math.max(...inrPrices) : 0

    const getStockHealth = (qty: number, reorder: number) => {
        if (qty <= 0) {
            return {
                label: "Out of Stock",
                badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
                barColor: "bg-rose-500",
                icon: XCircle,
            }
        }
        if (qty <= reorder) {
            return {
                label: `Low Stock (${qty}/${reorder})`,
                badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
                barColor: "bg-amber-500",
                icon: AlertTriangle,
            }
        }
        return {
            label: "In Stock",
            badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
            barColor: "bg-emerald-500",
            icon: CheckCircle2,
        }
    }

    const calculateMargin = (sellPrice: number, costPrice: number) => {
        if (!sellPrice || sellPrice <= 0 || !costPrice || costPrice <= 0) return null
        return Math.round(((sellPrice - costPrice) / sellPrice) * 100)
    }

    return (
        <div className="p-5 bg-gradient-to-r from-indigo-50/40 via-muted/20 to-background dark:from-indigo-950/20 dark:via-muted/10 border-t border-b border-l-4 border-l-indigo-500 space-y-4">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background/90 dark:bg-slate-900/80 p-3.5 rounded-xl border shadow-2xs">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Boxes className="h-4.5 w-4.5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">Variations</h4>
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 text-[11px] px-2 py-0 font-semibold">
                                {variants.length} {variants.length === 1 ? "Option" : "Options"}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Base HSN: <span className="font-semibold text-foreground">{product.sku}</span> • Total Stock: <span className="font-semibold text-foreground">{totalStock} units</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs flex-wrap">
                    {minInr > 0 && (
                        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 rounded-lg border">
                            <span className="text-muted-foreground">Price Spectrum:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {minInr === maxInr ? formatCurrency(minInr) : `${formatCurrency(minInr)} - ${formatCurrency(maxInr)}`}
                            </span>
                        </div>
                    )}

                    {/* View Mode Toggle: Cards vs Tabular */}
                    <div className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5 shadow-2xs">
                        <Button
                            type="button"
                            size="sm"
                            variant={currentViewMode === "cards" ? "default" : "ghost"}
                            className={`h-7 px-2.5 text-xs gap-1.5 font-medium transition-all ${currentViewMode === "cards"
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                            onClick={() => handleSetMode("cards")}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" />
                            Cards
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={currentViewMode === "table" ? "default" : "ghost"}
                            className={`h-7 px-2.5 text-xs gap-1.5 font-medium transition-all ${currentViewMode === "table"
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                            onClick={() => handleSetMode("table")}
                        >
                            <List className="h-3.5 w-3.5" />
                            Table
                        </Button>
                    </div>

                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 font-medium"
                        onClick={() => onNavigate(`/inventory/products/view/${product.id}`)}
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Detailed Showcase
                    </Button>
                </div>
            </div>

            {/* Variations Display: Cards Grid or Tabular Matrix */}
            {currentViewMode === "cards" ? (
                /* Variations Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {variants.map((v, index) => {
                        const fullSku = `${product.sku || ""}${v.skuSuffix || ""}`
                        const qty = Number(v.currentQuantity) || 0
                        const reorder = Number(v.reorderLevel) || 0
                        const health = getStockHealth(qty, reorder)
                        const margin = calculateMargin(Number(v.sellingPrice), Number(v.purchasePrice))
                        const HealthIcon = health.icon
                        const imageUrl = getGoogleDrivePreviewUrl(v.variantImage)

                        return (
                            <div
                                key={v.variantId || index}
                                className="rounded-xl border bg-card/90 hover:bg-card shadow-2xs hover:shadow-sm transition-all p-4 flex flex-col justify-between border-border/80 hover:border-indigo-200 dark:hover:border-indigo-900"
                            >
                                {/* Card Top */}
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div
                                                className="h-10 w-10 rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center shrink-0 group/img relative cursor-pointer"
                                                onClick={() => imageUrl && setPreviewImage({ url: imageUrl, title: v.variantName })}
                                                title={imageUrl ? "Click to enlarge" : undefined}
                                            >
                                                {imageUrl ? (
                                                    <>
                                                        <img
                                                            src={imageUrl}
                                                            alt={v.variantName}
                                                            className="h-full w-full object-cover transition-transform duration-200 group-hover/img:scale-105"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                            <Maximize2 className="h-3.5 w-3.5" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <Package className="h-4.5 w-4.5 text-muted-foreground/60" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="font-bold text-sm text-foreground truncate">{v.variantName}</h5>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-xs text-muted-foreground font-semibold truncate">{fullSku}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopy(fullSku, `exp-sku-${v.variantId}`, "SKU")}
                                                        className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                                        title="Copy SKU"
                                                    >
                                                        {copiedKey === `exp-sku-${v.variantId}` ? (
                                                            <Check className="h-3 w-3 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={v.status ? "default" : "secondary"}
                                            className={`text-[10px] px-2 py-0.5 h-5 shrink-0 font-semibold ${v.status ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}`}
                                        >
                                            {v.status ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>

                                    {/* Stock & Gauge */}
                                    <div className="mt-3 p-2.5 rounded-lg bg-muted/30 border">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <HealthIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-xs font-semibold">{health.label}</span>
                                            </div>
                                            <span className="font-bold text-sm text-foreground">
                                                {qty} <span className="text-xs text-muted-foreground font-normal">units</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                                            <div
                                                className={`h-full ${health.barColor}`}
                                                style={{
                                                    width: `${Math.min(100, Math.max(8, reorder > 0 ? (qty / (reorder * 2)) * 100 : (qty > 0 ? 100 : 0)))}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Pricing Grid */}
                                    <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t text-xs">
                                        <div>
                                            <span className="text-[10px] text-muted-foreground block uppercase font-semibold tracking-wider">Cost Price</span>
                                            <span className="font-semibold text-foreground text-xs mt-0.5 block">{formatCurrency(v.purchasePrice)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-muted-foreground block uppercase font-semibold tracking-wider">Sale Price (IND)</span>
                                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(v.sellingPrice)}</span>
                                                {margin !== null && (
                                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1 py-0.2 rounded">
                                                        +{margin}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Barcode footer if present */}
                                {(v.rackLocation || v.warehouseId || v.barcodeNumber) && (
                                    <div className="mt-3 pt-2.5 border-t flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5 truncate">
                                            <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                            <span className="truncate text-[11px]">
                                                {warehousesMap[v.warehouseId] ? `${warehousesMap[v.warehouseId]} • ` : ""}
                                                {v.rackLocation || "Rack unassigned"}
                                            </span>
                                        </div>
                                        {v.barcodeNumber && (
                                            <div className="flex items-center gap-1 shrink-0 font-semibold text-[11px]">
                                                <Barcode className="h-3.5 w-3.5 text-muted-foreground" />
                                                <button
                                                    type="button"
                                                    onClick={() => setBarcodeModal({ code: v.barcodeNumber, name: v.variantName, sku: fullSku })}
                                                    className="font-mono hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
                                                    title="View barcode modal"
                                                >
                                                    {v.barcodeNumber}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(v.barcodeNumber, `exp-bc-${v.variantId}`, "Barcode")}
                                                    className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer ml-0.5"
                                                    title="Copy barcode"
                                                >
                                                    {copiedKey === `exp-bc-${v.variantId}` ? (
                                                        <Check className="h-3 w-3 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                /* Variations Tabular View */
                <div className="rounded-xl border bg-card/95 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[60px] text-center text-xs font-semibold">Image</TableHead>
                                    <TableHead className="min-w-[220px] text-xs font-semibold">Variation</TableHead>
                                    <TableHead className="min-w-[160px] text-xs font-semibold">Stock</TableHead>
                                    <TableHead className="min-w-[150px] text-xs font-semibold">Threshold</TableHead>
                                    <TableHead className="min-w-[180px] text-xs font-semibold">Racks</TableHead>
                                    <TableHead className="text-right w-[100px] text-xs font-semibold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.map((v, index) => {
                                    const fullSku = `${product.sku || ""}${v.skuSuffix || ""}`
                                    const qty = Number(v.currentQuantity) || 0
                                    const reorder = Number(v.reorderLevel) || 0
                                    const health = getStockHealth(qty, reorder)
                                    const HealthIcon = health.icon
                                    const imageUrl = getGoogleDrivePreviewUrl(v.variantImage)

                                    return (
                                        <TableRow key={v.variantId || index} className="hover:bg-muted/30 transition-colors">
                                            {/* Image */}
                                            <TableCell className="text-center py-3">
                                                <div
                                                    className="h-10 w-10 mx-auto rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center shrink-0 relative group/img cursor-pointer"
                                                    onClick={() => imageUrl && setPreviewImage({ url: imageUrl, title: v.variantName })}
                                                    title={imageUrl ? "Click to enlarge" : undefined}
                                                >
                                                    {imageUrl ? (
                                                        <>
                                                            <img
                                                                src={imageUrl}
                                                                alt={v.variantName}
                                                                className="h-full w-full object-cover transition-transform duration-200 group-hover/img:scale-105"
                                                                referrerPolicy="no-referrer"
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                <Maximize2 className="h-3 w-3" />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <Package className="h-4 w-4 text-muted-foreground/60" />
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Variation */}
                                            <TableCell className="py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-foreground">{v.variantName}</span>
                                                        <Badge
                                                            variant={v.status ? "default" : "secondary"}
                                                            className={`text-[10px] px-1.5 py-0 h-4.5 font-semibold ${v.status ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}`}
                                                        >
                                                            {v.status ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-mono text-muted-foreground">{fullSku}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(fullSku, `tbl-sku-${v.variantId}`, "SKU")}
                                                            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
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

                                            {/* Stock */}
                                            <TableCell className="py-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-foreground">
                                                            {qty} <span className="text-xs font-normal text-muted-foreground">units</span>
                                                        </span>
                                                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-5 font-semibold ${health.badgeClass}`}>
                                                            <HealthIcon className="h-3 w-3 mr-1 inline" />
                                                            {health.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="w-28 bg-muted rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full ${health.barColor} transition-all duration-300`}
                                                            style={{
                                                                width: `${Math.min(100, Math.max(8, reorder > 0 ? (qty / (reorder * 2)) * 100 : (qty > 0 ? 100 : 0)))}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Threshold */}
                                            <TableCell className="py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-foreground">
                                                            {reorder} <span className="text-xs font-normal text-muted-foreground">units</span>
                                                        </span>
                                                        {qty <= reorder && (
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] px-1.5 py-0 h-4.5 font-semibold ${qty <= 0
                                                                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300"
                                                                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
                                                                    }`}
                                                            >
                                                                {qty <= 0 ? "Depleted" : "Low Stock Alert"}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-muted-foreground">Reorder threshold</span>
                                                </div>
                                            </TableCell>

                                            {/* Racks */}
                                            <TableCell className="py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 font-medium text-foreground text-sm">
                                                        <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                        <span>{v.rackLocation ? `Rack: ${v.rackLocation}` : "Rack unassigned"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                        <Warehouse className="h-3 w-3 shrink-0" />
                                                        <span className="truncate max-w-[150px]">{warehousesMap[v.warehouseId] || "Main Store"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Quick Action */}
                                            <TableCell className="text-right py-3">
                                                {(qty <= reorder || qty === 0) ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7.5 text-xs px-2.5 gap-1.5 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-medium"
                                                        onClick={() => onNavigate(`/purchase/create?restock=${product.id}`)}
                                                        title="Create Purchase Order for this item"
                                                    >
                                                        <ShoppingCart className="h-3.5 w-3.5" />
                                                        Restock
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7.5 text-xs px-2.5 gap-1 text-muted-foreground hover:text-foreground"
                                                        onClick={() => onNavigate(`/inventory/products/view/${product.id}`)}
                                                        title="View product details"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        Details
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-md p-4">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">{previewImage?.title || "Variant Image"}</DialogTitle>
                    </DialogHeader>
                    {previewImage?.url && (
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden border mt-2">
                            <img
                                src={previewImage.url}
                                alt={previewImage.title}
                                className="w-full h-full object-contain bg-black/5"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Barcode Display Modal */}
            <Dialog open={!!barcodeModal} onOpenChange={(open) => !open && setBarcodeModal(null)}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Product Barcode</DialogTitle>
                        <DialogDescription className="text-xs">
                            {barcodeModal?.name} ({barcodeModal?.sku})
                        </DialogDescription>
                    </DialogHeader>
                    {barcodeModal?.code && (
                        <div className="mt-4 flex flex-col items-center">
                            <BarcodeDisplay value={barcodeModal.code} label={barcodeModal.sku} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 3) {
        return [1, 2, 3, 4, "...", totalPages]
    }
    if (currentPage >= totalPages - 2) {
        return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages]
}

export default function ProductListPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // ── Server-side filter state ─────────────────────────────────────────────
    const initialSearch = searchParams.get("SearchTerm") || searchParams.get("searchTerm") || ""
    const initialCategory = searchParams.get("CategoryId") || searchParams.get("categoryId") || ""
    const initialStatus = (searchParams.get("Status") || searchParams.get("status") || "") as "" | "true" | "false"
    const initialStock = (searchParams.get("StockStatus") || searchParams.get("stockStatus") || "") as "" | "Low" | "High" | "OutOfStock"
    const initialVariants = (searchParams.get("HasVariants") || searchParams.get("hasVariants") || "") as "" | "true" | "false"

    const [searchInput, setSearchInput] = React.useState(initialSearch)          // controlled input
    const [searchTerm, setSearchTerm] = React.useState(initialSearch)            // debounced — sent to API
    const [categoryFilter, setCategoryFilter] = React.useState<string>(initialCategory)
    const [statusFilter, setStatusFilter] = React.useState<"" | "true" | "false">(initialStatus)
    const [stockStatus, setStockStatus] = React.useState<"" | "Low" | "High" | "OutOfStock">(initialStock)
    const [hasVariantsFilter, setHasVariantsFilter] = React.useState<"" | "true" | "false">(initialVariants)
    const [pageIndex, setPageIndex] = React.useState(0)               // 0-based internally
    const [pageSize, setPageSize] = React.useState(10)
    const [totalCount, setTotalCount] = React.useState(0)

    // ── Data state ───────────────────────────────────────────────────────────
    const [products, setProducts] = React.useState<Product[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [warehousesMap, setWarehousesMap] = React.useState<Record<number, string>>({})
    const [categories, setCategories] = React.useState<any[]>([])
    const [categoriesMap, setCategoriesMap] = React.useState<Record<number, string>>({})

    // ── Table display state ──────────────────────────────────────────────────
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [expanded, setExpanded] = React.useState<ExpandedState>(true)
    const [variantViewMode, setVariantViewMode] = React.useState<"cards" | "table">(() => {
        try {
            return (localStorage.getItem("products_variant_view_mode") as "cards" | "table") || "cards"
        } catch {
            return "cards"
        }
    })

    const handleVariantViewModeChange = (mode: "cards" | "table") => {
        setVariantViewMode(mode)
        try {
            localStorage.setItem("products_variant_view_mode", mode)
        } catch { }
    }

    // Debounce search input → only update searchTerm after 400ms idle
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value)
        if (debounceTimer.current) clearTimeout(debounceTimer.current)
        debounceTimer.current = setTimeout(() => {
            setSearchTerm(value)
            setPageIndex(0)   // reset to first page on new search
        }, 400)
    }, [])

    // Fetch warehouses and categories once on mount
    React.useEffect(() => {
        warehousesApi.getAll().catch(() => []).then((res: any) => {
            const wList = Array.isArray(res) ? res : res?.data || []
            const wMap: Record<number, string> = {}
            wList.forEach((w: any) => { if (w.id && w.name) wMap[w.id] = w.name })
            setWarehousesMap(wMap)
        })

        categoriesApi.getAll().catch(() => []).then((res: any) => {
            const cList = Array.isArray(res) ? res : res?.data || []
            setCategories(cList)
            const cMap: Record<number, string> = {}
            cList.forEach((c: any) => {
                const id = c.categoryId ?? c.id
                const name = c.categoryName ?? c.name
                if (id && name) cMap[id] = name
            })
            setCategoriesMap(cMap)
        })
    }, [])

    // Fetch products whenever filters/pagination change
    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Build query string with only defined params
                const params = new URLSearchParams()
                params.set("PageNumber", String(pageIndex + 1))
                params.set("PageSize", String(pageSize))
                if (searchTerm.trim()) params.set("SearchTerm", searchTerm.trim())
                if (categoryFilter !== "") params.set("CategoryId", categoryFilter)
                if (statusFilter !== "") params.set("Status", statusFilter)
                if (hasVariantsFilter !== "") params.set("HasVariants", hasVariantsFilter)
                if (stockStatus !== "") params.set("StockStatus", stockStatus)

                const productRes = await apiClient.get<ApiResponse>(`/api/Product/GetAll?${params.toString()}`)

                if (productRes.success && productRes.data) {
                    setTotalCount(productRes.totalCount ?? productRes.data.length)
                    const mappedProducts: Product[] = productRes.data.map(p => {
                        const totalStock = p.variants.reduce((sum, v) => sum + (Number(v.currentQuantity) || 0), 0)
                        const minReorderLevel = p.variants.length > 0
                            ? Math.min(...p.variants.map(v => Number(v.reorderLevel) || 0))
                            : 0

                        let status: Product["status"] = p.status ? "Active" : "Inactive"
                        if (p.status && totalStock > 0 && totalStock <= minReorderLevel) {
                            status = "Low Stock"
                        } else if (p.status && totalStock === 0) {
                            status = "Inactive"
                        }

                        const costPrices = p.variants.map(v => Number(v.purchasePrice) || 0).filter(cp => cp > 0)
                        const minCost = costPrices.length > 0 ? Math.min(...costPrices) : (p.variants.length > 0 ? Number(p.variants[0].purchasePrice) || 0 : 0)
                        const maxCost = costPrices.length > 0 ? Math.max(...costPrices) : minCost

                        const sellPrices = p.variants.map(v => Number(v.sellingPrice) || 0).filter(sp => sp > 0)
                        const minSell = sellPrices.length > 0 ? Math.min(...sellPrices) : (p.variants.length > 0 ? Number(p.variants[0].sellingPrice) || 0 : 0)
                        const maxSell = sellPrices.length > 0 ? Math.max(...sellPrices) : minSell

                        return {
                            id: p.productId.toString(),
                            name: p.productName,
                            sku: p.baseSKU,
                            category: categoriesMap[p.categoryId] || p.brand || "General",
                            categoryId: p.categoryId,
                            variants: p.variants.length,
                            costPrice: minCost,
                            costPriceMax: maxCost,
                            sellingPrice: minSell,
                            sellingPriceMax: maxSell,
                            price: minSell,
                            stock: totalStock,
                            status,
                            rawVariants: p.variants,
                        }
                    })
                    setProducts(mappedProducts)
                    setExpanded(true)
                } else {
                    setError(productRes.message || "Failed to fetch products")
                    setProducts([])
                    setTotalCount(0)
                }
            } catch (err: any) {
                console.error("Error fetching products:", err)
                setError(err.message || "An unexpected error occurred")
                setProducts([])
                setTotalCount(0)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProducts()
    }, [pageIndex, pageSize, searchTerm, categoryFilter, statusFilter, hasVariantsFilter, stockStatus, categoriesMap])

    // KPI computations — from current page data
    const totalProductsCount = totalCount
    const totalVariationsCount = products.reduce((sum, p) => sum + p.variants, 0)
    const totalInventoryUnits = products.reduce((sum, p) => sum + p.stock, 0)
    const lowStockAlertsCount = products.filter(p => p.status === "Low Stock" || (p.status === "Active" && p.stock === 0)).length

    const serverPageCount = Math.ceil(totalCount / pageSize) || 1
    const hasActiveFilters = Boolean(searchTerm || categoryFilter || statusFilter || stockStatus || hasVariantsFilter)

    const selectedCategoryName = React.useMemo(() => {
        if (!categoryFilter) return ""
        const match = categories.find((c: any) => String(c.categoryId ?? c.id) === String(categoryFilter))
        if (match) return match.categoryName ?? match.name ?? `Category #${categoryFilter}`
        return categoriesMap[Number(categoryFilter)] || `Category #${categoryFilter}`
    }, [categoryFilter, categories, categoriesMap])

    const activeFilterCount = React.useMemo(() => {
        let count = 0
        if (searchTerm.trim()) count++
        if (categoryFilter) count++
        if (statusFilter) count++
        if (stockStatus) count++
        if (hasVariantsFilter) count++
        return count
    }, [searchTerm, categoryFilter, statusFilter, stockStatus, hasVariantsFilter])

    // Ensure pageIndex does not exceed serverPageCount when totalCount shrinks
    React.useEffect(() => {
        if (serverPageCount > 0 && pageIndex >= serverPageCount) {
            setPageIndex(Math.max(0, serverPageCount - 1))
        }
    }, [serverPageCount, pageIndex])

    const columns = React.useMemo<ColumnDef<Product>[]>(() => [
        {
            id: "expander",
            header: () => null,
            cell: ({ row }) => {
                return row.original.variants > 0 ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => row.toggleExpanded()}
                        title={row.getIsExpanded() ? "Collapse variations" : "Expand variations"}
                    >
                        {row.getIsExpanded() ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                ) : null
            },
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Product Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const catName = (row.original.categoryId ? categoriesMap[row.original.categoryId] : null) || (row.original.category && row.original.category !== "General" ? row.original.category : null)
                return (
                    <div className="flex flex-col gap-0.5 py-0.5">
                        <div
                            className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                            onClick={() => navigate(`/inventory/products/view/${row.original.id}`)}
                        >
                            {row.getValue("name")}
                        </div>
                        {catName && (
                            <span className="text-[11px] text-muted-foreground font-normal">
                                {catName}
                            </span>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "sku",
            header: "HSN Code",
            cell: ({ row }) => <div className="text-xs font-semibold">{row.getValue("sku")}</div>,
        },
        {
            accessorKey: "variants",
            header: () => <div className="text-center">Variations</div>,
            cell: ({ row }) => {
                const count = row.original.variants
                if (count === 0) {
                    return <div className="text-center text-muted-foreground text-xs">—</div>
                }
                return (
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2.5 gap-1.5 rounded-full text-xs font-semibold transition-all ${row.getIsExpanded()
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white shadow-2xs"
                                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                                }`}
                            onClick={() => row.toggleExpanded()}
                        >
                            <Boxes className="h-3.5 w-3.5" />
                            <span>{count} {count === 1 ? "variant" : "variants"}</span>
                            {row.getIsExpanded() ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                )
            },
        },
        {
            accessorKey: "costPrice",
            header: () => <div className="text-right">Cost Price</div>,
            cell: ({ row }) => {
                const min = row.original.costPrice
                const max = row.original.costPriceMax
                const formatted = min && max && min !== max
                    ? `${formatCurrency(min)} - ${formatCurrency(max)}`
                    : formatCurrency(min || 0)
                return <div className="text-right font-medium text-sm text-foreground">{formatted}</div>
            },
        },
        {
            accessorKey: "sellingPrice",
            header: () => <div className="text-right">Selling Price</div>,
            cell: ({ row }) => {
                const min = row.original.sellingPrice
                const max = row.original.sellingPriceMax
                const formatted = min && max && min !== max
                    ? `${formatCurrency(min)} - ${formatCurrency(max)}`
                    : formatCurrency(min || 0)
                return <div className="text-right font-bold text-sm text-emerald-600 dark:text-emerald-400">{formatted}</div>
            },
        },
        {
            accessorKey: "stock",
            header: () => <div className="text-right">Total Stock</div>,
            cell: ({ row }) => {
                const stock = Number(row.getValue("stock")) || 0
                return (
                    <div className="text-right font-bold text-sm text-foreground">
                        {stock}
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge
                        variant={
                            status === "Active"
                                ? "default"
                                : status === "Low Stock"
                                    ? "destructive"
                                    : "secondary"
                        }
                        className={`text-xs ${status === "Active" ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}`}
                    >
                        {status}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => <ActionsCell row={row} onNavigate={navigate} />,
        },
    ], [navigate, categoriesMap])

    // Table — pagination is handled server-side; we pass manualPagination
    const tablePagination: PaginationState = { pageIndex, pageSize }
    const table = useReactTable({
        data: products,
        columns,
        manualPagination: true,
        pageCount: serverPageCount,
        onSortingChange: setSorting,
        onPaginationChange: (updater) => {
            const next = typeof updater === "function" ? updater(tablePagination) : updater
            setPageIndex(next.pageIndex)
            setPageSize(next.pageSize)
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onExpandedChange: setExpanded,
        getRowCanExpand: (row) => row.original.variants > 0,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            expanded,
            pagination: tablePagination,
        },
    })

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Manage your product catalog, warehouses, and linked variations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button render={<Link to="/inventory/products/add" />} nativeButton={false}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* KPI Summary Banner */}
            {!error && (
                <StatGrid columns={4}>
                    <StatCard
                        title="Total Products"
                        value={totalProductsCount.toLocaleString()}
                        suffix="SKUs"
                        icon={Package}
                        color="blue"
                        variant="bordered"
                        badge="Catalog"
                        description="Active catalog items"
                        isLoading={isLoading}
                    />

                    <StatCard
                        title="Linked Variations"
                        value={totalVariationsCount.toLocaleString()}
                        suffix="options"
                        icon={Boxes}
                        color="indigo"
                        variant="bordered"
                        badge="Configured"
                        description={
                            totalProductsCount > 0
                                ? `${(totalVariationsCount / totalProductsCount).toFixed(1)} avg per SKU`
                                : "Configured options"
                        }
                        isLoading={isLoading}
                    />

                    <StatCard
                        title="Available Stock"
                        value={totalInventoryUnits.toLocaleString()}
                        suffix="units"
                        icon={PackageCheck}
                        color="emerald"
                        variant="bordered"
                        badge="Warehouses"
                        description="Live physical quantity"
                        isLoading={isLoading}
                    />

                    <StatCard
                        title="Stock Alerts"
                        value={lowStockAlertsCount}
                        suffix="attention"
                        icon={AlertTriangle}
                        color={lowStockAlertsCount > 0 ? "amber" : "emerald"}
                        variant="bordered"
                        badge={
                            lowStockAlertsCount > 0
                                ? { text: "Action Needed", variant: "warning" }
                                : { text: "Optimal", variant: "success" }
                        }
                        description={lowStockAlertsCount > 0 ? "Low stock or depleted" : "All items healthy"}
                        isLoading={isLoading}
                    />
                </StatGrid>
            )}

            {/* Low Stock Alert Banner */}
            {!isLoading && !error && lowStockAlertsCount > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                {lowStockAlertsCount} product{lowStockAlertsCount !== 1 ? "s" : ""} need restocking
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                Some items are running low or are completely out of stock. Create a Purchase Order to restock inventory.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-0"
                            onClick={() => navigate("/purchase/create?restock=all")}
                        >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Create Restock PO
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Products Table Card */}
            <Card className="shadow-xs border">
                <CardHeader className="pt-4 pb-3">
                    <CardTitle className="text-base font-semibold">Product Catalog & Variations</CardTitle>
                    <CardDescription className="text-xs">Click on any product or variation chip to expand and view its full stock breakdown.</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                    {/* Filter Bar */}
                    <div className="flex flex-col gap-3 py-3">
                        {/* Row 1: Search, View Controls & Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            {/* Left: Search Input */}
                            <div className="relative flex-1 max-w-md group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
                                <Input
                                    placeholder="Search by name, SKU, brand..."
                                    value={searchInput}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-9 pr-9 text-xs h-9.5 rounded-lg border-muted-foreground/20 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20 bg-background/80 transition-all duration-200"
                                />
                                {searchInput && (
                                    <button
                                        onClick={() => { setSearchInput(""); setSearchTerm(""); setPageIndex(0) }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
                                        title="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Right Toolbar Actions */}
                            <div className="flex items-center gap-2 justify-between sm:justify-end flex-wrap">
                                {isLoading && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/40 animate-pulse">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                                        <span>Loading...</span>
                                    </div>
                                )}

                                {/* Global Variations View Mode Toggle */}
                                <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted/40 p-0.5 h-9.5 shadow-2xs">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={variantViewMode === "cards" ? "default" : "ghost"}
                                        className={`h-8 px-2.5 text-xs gap-1.5 rounded-md transition-all duration-200 ${
                                            variantViewMode === "cards"
                                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs font-semibold"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                        onClick={() => handleVariantViewModeChange("cards")}
                                        title="View variations as card grid"
                                    >
                                        <LayoutGrid className="h-3.5 w-3.5" />
                                        Cards
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={variantViewMode === "table" ? "default" : "ghost"}
                                        className={`h-8 px-2.5 text-xs gap-1.5 rounded-md transition-all duration-200 ${
                                            variantViewMode === "table"
                                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs font-semibold"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                        onClick={() => handleVariantViewModeChange("table")}
                                        title="View variations as tabular matrix"
                                    >
                                        <List className="h-3.5 w-3.5" />
                                        Table
                                    </Button>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9.5 text-xs gap-1.5 rounded-lg border-border/60 hover:bg-muted/50 transition-all duration-200"
                                    onClick={() => table.toggleAllRowsExpanded()}
                                    title={table.getIsAllRowsExpanded() ? "Collapse all variation accordions" : "Expand all variation accordions"}
                                >
                                    {table.getIsAllRowsExpanded() ? (
                                        <>
                                            <ChevronDown className="h-3.5 w-3.5" />
                                            <span>Collapse All</span>
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                            <span>Expand All</span>
                                        </>
                                    )}
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <Button variant="outline" size="sm" className="hidden lg:flex h-9.5 text-xs rounded-lg border-border/60 hover:bg-muted/50 transition-all duration-200">
                                                <Filter className="mr-1.5 h-3.5 w-3.5" />
                                                Columns
                                            </Button>
                                        }
                                    />
                                    <DropdownMenuContent align="end" className="w-[170px] shadow-lg rounded-xl">
                                        <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {table
                                            .getAllColumns()
                                            .filter((column) => column.getCanHide())
                                            .map((column) => (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    className="capitalize text-xs cursor-pointer"
                                                    checked={column.getIsVisible()}
                                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                                >
                                                    {column.id}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9.5 text-xs gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all duration-200 font-medium"
                                        onClick={() => {
                                            setSearchInput("")
                                            setSearchTerm("")
                                            setCategoryFilter("")
                                            setStatusFilter("")
                                            setStockStatus("")
                                            setHasVariantsFilter("")
                                            setPageIndex(0)
                                        }}
                                        title="Reset all filters"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Reset
                                        <Badge variant="secondary" className="ml-0.5 h-4 px-1.5 text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200">
                                            {activeFilterCount}
                                        </Badge>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Dropdown Filters Strip */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl bg-muted/30 dark:bg-slate-900/40 border border-border/60 backdrop-blur-xs">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                                {/* 1. Category Dropdown */}
                                <div className="flex items-center gap-1">
                                    <Select
                                        value={categoryFilter || "all"}
                                        onValueChange={(val) => {
                                            setCategoryFilter(!val || val === "all" ? "" : val)
                                            setPageIndex(0)
                                        }}
                                    >
                                        <SelectTrigger className={`h-9 text-xs rounded-lg transition-all duration-200 cursor-pointer min-w-[150px] sm:min-w-[175px] ${
                                            categoryFilter
                                                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-2 ring-indigo-500/20 shadow-xs"
                                                : "border-border/60 hover:border-border bg-background/90"
                                        }`}>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Tag className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400 opacity-80" />
                                                <SelectValue placeholder="All Categories">
                                                    {selectedCategoryName || "All Categories"}
                                                </SelectValue>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-72 shadow-lg border rounded-xl">
                                            <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                                                All Categories
                                            </SelectItem>
                                            {categories.map((cat: any) => {
                                                const id = String(cat.categoryId ?? cat.id)
                                                const name = cat.categoryName ?? cat.name ?? `Category #${id}`
                                                return (
                                                    <SelectItem key={id} value={id} className="text-xs cursor-pointer">
                                                        {name}
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                    {categoryFilter && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all shrink-0 cursor-pointer"
                                            onClick={() => {
                                                setCategoryFilter("")
                                                setPageIndex(0)
                                            }}
                                            title="Clear category filter"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>

                                {/* 2. Status Dropdown */}
                                <div className="flex items-center gap-1">
                                    <Select
                                        value={statusFilter || "all"}
                                        onValueChange={(val) => {
                                            setStatusFilter(!val || val === "all" ? "" : (val as "" | "true" | "false"))
                                            setPageIndex(0)
                                        }}
                                    >
                                        <SelectTrigger className={`h-9 text-xs rounded-lg transition-all duration-200 cursor-pointer min-w-[130px] sm:min-w-[145px] ${
                                            statusFilter
                                                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-2 ring-indigo-500/20 shadow-xs"
                                                : "border-border/60 hover:border-border bg-background/90"
                                        }`}>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400 opacity-80" />
                                                <SelectValue placeholder="All Statuses">
                                                    {statusFilter === "true" ? "Active" : statusFilter === "false" ? "Inactive" : "All Statuses"}
                                                </SelectValue>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="shadow-lg border rounded-xl">
                                            <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                                                All Statuses
                                            </SelectItem>
                                            <SelectItem value="true" className="text-xs cursor-pointer">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Active
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="false" className="text-xs cursor-pointer">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                    Inactive
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {statusFilter && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all shrink-0 cursor-pointer"
                                            onClick={() => {
                                                setStatusFilter("")
                                                setPageIndex(0)
                                            }}
                                            title="Clear status filter"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>

                                {/* 3. Stock Dropdown */}
                                <div className="flex items-center gap-1">
                                    <Select
                                        value={stockStatus || "all"}
                                        onValueChange={(val) => {
                                            setStockStatus(!val || val === "all" ? "" : (val as "" | "Low" | "High" | "OutOfStock"))
                                            setPageIndex(0)
                                        }}
                                    >
                                        <SelectTrigger className={`h-9 text-xs rounded-lg transition-all duration-200 cursor-pointer min-w-[135px] sm:min-w-[155px] ${
                                            stockStatus
                                                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-2 ring-indigo-500/20 shadow-xs"
                                                : "border-border/60 hover:border-border bg-background/90"
                                        }`}>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Package className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 opacity-80" />
                                                <SelectValue placeholder="All Stock">
                                                    {stockStatus === "High"
                                                        ? "High Stock"
                                                        : stockStatus === "Low"
                                                        ? "Low Stock"
                                                        : stockStatus === "OutOfStock"
                                                        ? "Out of Stock"
                                                        : "All Stock"}
                                                </SelectValue>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="shadow-lg border rounded-xl">
                                            <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                                                All Stock
                                            </SelectItem>
                                            <SelectItem value="High" className="text-xs cursor-pointer">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    High Stock
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Low" className="text-xs cursor-pointer">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    Low Stock
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="OutOfStock" className="text-xs cursor-pointer">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                    Out of Stock
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {stockStatus && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all shrink-0 cursor-pointer"
                                            onClick={() => {
                                                setStockStatus("")
                                                setPageIndex(0)
                                            }}
                                            title="Clear stock filter"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>

                                {/* 4. Variant Dropdown */}
                                <div className="flex items-center gap-1">
                                    <Select
                                        value={hasVariantsFilter || "all"}
                                        onValueChange={(val) => {
                                            setHasVariantsFilter(!val || val === "all" ? "" : (val as "" | "true" | "false"))
                                            setPageIndex(0)
                                        }}
                                    >
                                        <SelectTrigger className={`h-9 text-xs rounded-lg transition-all duration-200 cursor-pointer min-w-[135px] sm:min-w-[155px] ${
                                            hasVariantsFilter
                                                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold ring-2 ring-indigo-500/20 shadow-xs"
                                                : "border-border/60 hover:border-border bg-background/90"
                                        }`}>
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Boxes className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400 opacity-80" />
                                                <SelectValue placeholder="All Variations">
                                                    {hasVariantsFilter === "true"
                                                        ? "With Variants"
                                                        : hasVariantsFilter === "false"
                                                        ? "No Variants"
                                                        : "All Variations"}
                                                </SelectValue>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="shadow-lg border rounded-xl">
                                            <SelectItem value="all" className="text-xs font-medium cursor-pointer">
                                                All Variations
                                            </SelectItem>
                                            <SelectItem value="true" className="text-xs cursor-pointer">
                                                With Variants
                                            </SelectItem>
                                            <SelectItem value="false" className="text-xs cursor-pointer">
                                                No Variants
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {hasVariantsFilter && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all shrink-0 cursor-pointer"
                                            onClick={() => {
                                                setHasVariantsFilter("")
                                                setPageIndex(0)
                                            }}
                                            title="Clear variations filter"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Total Count Badge */}
                            <div className="flex items-center gap-2 ml-auto">
                                <Badge variant="outline" className="h-7 px-2.5 text-xs font-medium bg-background/80 border-border/60 gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-semibold text-foreground">{totalCount}</span>
                                    <span className="text-muted-foreground">products</span>
                                </Badge>
                            </div>
                        </div>

                        {/* Row 3: Active Filter Tags (Animated chips for active filters) */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                                <span className="text-[11px] text-muted-foreground font-medium mr-1">Active filters:</span>
                                {searchTerm && (
                                    <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                                        Search: "{searchTerm}"
                                        <button
                                            onClick={() => { setSearchInput(""); setSearchTerm(""); setPageIndex(0) }}
                                            className="hover:text-indigo-900 dark:hover:text-white ml-0.5 cursor-pointer"
                                            title="Remove search filter"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {categoryFilter && (
                                    <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 font-semibold shadow-2xs">
                                        <Tag className="h-3 w-3" />
                                        Category: {selectedCategoryName}
                                        <button
                                            onClick={() => { setCategoryFilter(""); setPageIndex(0) }}
                                            className="hover:text-indigo-900 dark:hover:text-white ml-0.5 cursor-pointer"
                                            title="Remove category filter"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {statusFilter && (
                                    <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                                        Status: {statusFilter === "true" ? "Active" : "Inactive"}
                                        <button
                                            onClick={() => { setStatusFilter(""); setPageIndex(0) }}
                                            className="hover:text-indigo-900 dark:hover:text-white ml-0.5 cursor-pointer"
                                            title="Remove status filter"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {stockStatus && (
                                    <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                                        Stock: {stockStatus === "OutOfStock" ? "Out of Stock" : stockStatus === "Low" ? "Low Stock" : "High Stock"}
                                        <button
                                            onClick={() => { setStockStatus(""); setPageIndex(0) }}
                                            className="hover:text-indigo-900 dark:hover:text-white ml-0.5 cursor-pointer"
                                            title="Remove stock filter"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {hasVariantsFilter && (
                                    <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                                        Type: {hasVariantsFilter === "true" ? "With Variants" : "No Variants"}
                                        <button
                                            onClick={() => { setHasVariantsFilter(""); setPageIndex(0) }}
                                            className="hover:text-indigo-900 dark:hover:text-white ml-0.5 cursor-pointer"
                                            title="Remove variant filter"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="rounded-xl border overflow-hidden">
                        {error ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-destructive/5 border border-destructive/20 border-dashed">
                                <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                                <h3 className="font-semibold text-destructive">Failed to load products</h3>
                                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                                    Try Again
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row, index) => {
                                            const isExpanded = row.getIsExpanded() && row.original.variants > 0
                                            const isNotFirst = index > 0

                                            return (
                                                <React.Fragment key={row.id}>
                                                    {/* Separator Divider between distinct products */}
                                                    {isNotFirst && (
                                                        <tr className="border-0 pointer-events-none" aria-hidden="true">
                                                            <td
                                                                colSpan={columns.length}
                                                                className="p-0 border-0 h-2.5 bg-muted/40 dark:bg-slate-900/60 border-y border-border/40"
                                                            />
                                                        </tr>
                                                    )}

                                                    <TableRow
                                                        data-state={row.getIsSelected() && "selected"}
                                                        className={`transition-colors ${isExpanded
                                                            ? "bg-indigo-50/30 dark:bg-indigo-950/25 border-b-0"
                                                            : "hover:bg-muted/30"
                                                            }`}
                                                    >
                                                        {row.getVisibleCells().map((cell) => (
                                                            <TableCell key={cell.id} className="py-3.5">
                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                    {isExpanded && (
                                                        <TableRow className="bg-transparent hover:bg-transparent p-0 border-b-2 border-b-indigo-300/80 dark:border-b-indigo-800">
                                                            <TableCell colSpan={columns.length} className="p-0 border-t-0">
                                                                <ProductVariantsExpandedRow
                                                                    row={row}
                                                                    warehousesMap={warehousesMap}
                                                                    onNavigate={navigate}
                                                                    viewMode={variantViewMode}
                                                                    onViewModeChange={handleVariantViewModeChange}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                                                {isLoading
                                                    ? "Loading product catalog..."
                                                    : hasActiveFilters
                                                        ? "No products found matching the selected filters."
                                                        : "No products found matching your search."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    {/* Pagination Footer */}
                    {(() => {
                        const currentPage = pageIndex + 1
                        const startRow = totalCount === 0 ? 0 : pageIndex * pageSize + 1
                        const endRow = Math.min((pageIndex + 1) * pageSize, totalCount)
                        const pageNumbers = getPageNumbers(currentPage, serverPageCount)

                        return (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t text-xs">
                                {/* Left side: Item Count & Rows Per Page */}
                                <div className="flex flex-wrap items-center gap-4 text-muted-foreground w-full md:w-auto justify-between md:justify-start">
                                    <div>
                                        Showing <span className="font-semibold text-foreground">{startRow}</span> to{" "}
                                        <span className="font-semibold text-foreground">{endRow}</span> of{" "}
                                        <span className="font-semibold text-foreground">{totalCount}</span> products
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="whitespace-nowrap">Rows per page</span>
                                        <Select
                                            value={String(pageSize)}
                                            onValueChange={(val) => {
                                                if (val) {
                                                    setPageSize(Number(val))
                                                    setPageIndex(0)
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-8 w-[72px] text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[10, 20, 30, 50, 100].map((size) => (
                                                    <SelectItem key={size} value={String(size)} className="text-xs">
                                                        {size}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Right side: Page Navigation */}
                                <div className="flex items-center gap-1 sm:gap-1.5 w-full md:w-auto justify-center md:justify-end">
                                    {/* Number of Pages Display */}
                                    <div className="text-xs text-muted-foreground font-medium mr-2 whitespace-nowrap bg-muted/40 px-2.5 py-1 rounded-md border">
                                        Page <span className="font-bold text-foreground">{totalCount === 0 ? 0 : currentPage}</span> of{" "}
                                        <span className="font-bold text-foreground">{totalCount === 0 ? 0 : serverPageCount}</span>
                                    </div>

                                    {/* First Page */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setPageIndex(0)}
                                        disabled={pageIndex === 0 || isLoading || totalCount === 0}
                                        title="First page"
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                        <span className="sr-only">First page</span>
                                    </Button>

                                    {/* Previous Page */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setPageIndex(i => Math.max(0, i - 1))}
                                        disabled={pageIndex === 0 || isLoading || totalCount === 0}
                                        title="Previous page"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="sr-only">Previous page</span>
                                    </Button>

                                    {/* Direct Page Numbers */}
                                    {totalCount > 0 && (
                                        <div className="hidden sm:flex items-center gap-1">
                                            {pageNumbers.map((p, idx) => {
                                                if (p === "...") {
                                                    return (
                                                        <span
                                                            key={`ellipsis-${idx}`}
                                                            className="px-1 text-xs text-muted-foreground select-none"
                                                        >
                                                            ...
                                                        </span>
                                                    )
                                                }
                                                const pageNum = p as number
                                                const isSelected = pageNum === currentPage
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={isSelected ? "default" : "outline"}
                                                        size="sm"
                                                        disabled={isLoading}
                                                        className={`h-8 min-w-[32px] px-2 text-xs font-medium transition-all ${isSelected
                                                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs font-semibold"
                                                                : "hover:bg-muted"
                                                            }`}
                                                        onClick={() => setPageIndex(pageNum - 1)}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Next Page */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setPageIndex(i => Math.min(serverPageCount - 1, i + 1))}
                                        disabled={pageIndex >= serverPageCount - 1 || isLoading || totalCount === 0}
                                        title="Next page"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                        <span className="sr-only">Next page</span>
                                    </Button>

                                    {/* Last Page */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setPageIndex(serverPageCount - 1)}
                                        disabled={pageIndex >= serverPageCount - 1 || isLoading || totalCount === 0}
                                        title="Last page"
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                        <span className="sr-only">Last page</span>
                                    </Button>
                                </div>
                            </div>
                        )
                    })()}
                </CardContent>
            </Card>
        </div>
    )
}
