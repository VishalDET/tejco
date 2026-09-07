
import * as React from "react"
import { Link } from "react-router-dom"
import {
    ColumnDef,
    ColumnFiltersState,
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
import { ArrowUpDown, ChevronDown, ChevronRight, MoreHorizontal, Plus, Search, Filter, Download, Loader2, AlertCircle } from "lucide-react"

import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
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
    variants: number
    price: number
    stock: number
    status: "Active" | "Inactive" | "Low Stock"
    rawVariants: ApiVariant[]
}

const ActionsCell = ({ row }: { row: any }) => {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const res = await apiClient.delete<any>(`/api/Product/Delete/${row.original.id}`);
            if (res.success) {
                window.location.reload();
            } else {
                alert(res.message || "Failed to delete");
                setIsDeleting(false);
            }
        } catch (e: any) {
            alert(e.message || "Error deleting product");
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
                        Copy product ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = `/inventory/products/view/${row.original.id}`}>View details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = `/inventory/products/${row.original.id}`}>Edit product</DropdownMenuItem>
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
                        "{row.original.name}" and remove its data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export const columns: ColumnDef<Product>[] = [
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
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "sku",
        header: "HSN Code",
        cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("sku")}</div>,
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "variants",
        header: "Variants",
        cell: ({ row }) => <div className="text-center">{row.getValue("variants")}</div>,
    },
    {
        accessorKey: "price",
        header: () => <div className="text-right">Price</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("price"))
            const formatted = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
            }).format(amount)
            return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "stock",
        header: () => <div className="text-right">Stock</div>,
        cell: ({ row }) => <div className="text-right">{row.getValue("stock")}</div>,
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
                    className={status === "Active" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                    {status}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => <ActionsCell row={row} />,
    },
]

export default function ProductListPage() {
    const [products, setProducts] = React.useState<Product[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    React.useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true)
                const response = await apiClient.get<ApiResponse>("/api/Product/GetAll")

                if (response.success && response.data) {
                    const mappedProducts: Product[] = response.data.map(p => {
                        const totalStock = p.variants.reduce((sum, v) => sum + v.currentQuantity, 0)
                        const minReorderLevel = p.variants.length > 0 ? Math.min(...p.variants.map(v => v.reorderLevel)) : 0

                        // Determine status
                        let status: Product["status"] = p.status ? "Active" : "Inactive"
                        if (p.status && totalStock <= minReorderLevel && totalStock > 0) {
                            status = "Low Stock"
                        } else if (p.status && totalStock === 0) {
                            status = "Inactive"
                        }

                        return {
                            id: p.productId.toString(),
                            name: p.productName,
                            sku: p.baseSKU,
                            category: p.brand || "General", // Using brand as category fallback since name isn't in API
                            variants: p.variants.length,
                            price: p.variants.length > 0 ? p.variants[0].sellingPrice : 0,
                            stock: totalStock,
                            status: status,
                            rawVariants: p.variants
                        }
                    })
                    setProducts(mappedProducts)
                } else {
                    setError(response.message || "Failed to fetch products")
                }
            } catch (err: any) {
                console.error("Error fetching products:", err)
                setError(err.message || "An unexpected error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        fetchProducts()
    }, [])

    const table = useReactTable({
        data: products,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        initialState: {
            expanded: true,
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">Manage your product catalog and inventory levels.</p>
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

            <Card className="shadow-sm">
                <CardHeader className="pt-4">
                    <CardTitle className="text-lg">Product Catalog</CardTitle>
                    <CardDescription>View and manage all your products across all warehouses.</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                    <div className="flex items-center justify-between py-4 gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter products..."
                                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                                onChange={(event) =>
                                    table.getColumn("name")?.setFilterValue(event.target.value)
                                }
                                className="pl-8"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {isLoading && (
                                <div className="flex items-center text-sm text-muted-foreground mr-4">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </div>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    render={
                                        <Button variant="outline" size="sm" className="hidden lg:flex">
                                            <Filter className="mr-2 h-4 w-4" />
                                            View
                                        </Button>
                                    }
                                />
                                <DropdownMenuContent align="end" className="w-[150px]">
                                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => {
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    className="capitalize"
                                                    checked={column.getIsVisible()}
                                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                                >
                                                    {column.id}
                                                </DropdownMenuCheckboxItem>
                                            )
                                        })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="rounded-md border">
                        {error ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center bg-destructive/5 rounded-md border border-destructive/20 border-dashed">
                                <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                                <h3 className="font-semibold text-destructive">Failed to load products</h3>
                                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                                    Try Again
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/50">
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
                                        table.getRowModel().rows.map((row) => (
                                            <React.Fragment key={row.id}>
                                                <TableRow
                                                    data-state={row.getIsSelected() && "selected"}
                                                    className={row.getIsExpanded() ? "border-b-0 bg-muted/20" : ""}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                                {row.getIsExpanded() && (
                                                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                                                        <TableCell colSpan={columns.length} className="p-0 border-t-0">
                                                            <div className="p-5 bg-muted/30 border-t border-b space-y-4">
                                                                <div className="flex items-center justify-between px-1">
                                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Variants ({row.original.rawVariants.length})</h4>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        HSN: <span className="font-mono bg-background px-1.5 py-0.5 rounded border text-[11px]">{row.original.sku}</span>
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    {row.original.rawVariants.map((v) => {
                                                                        const isLowStock = v.currentQuantity <= v.reorderLevel;
                                                                        const maxRatio = v.reorderLevel > 0 ? (v.currentQuantity / (v.reorderLevel * 2)) * 100 : 100;
                                                                        const stockPercent = Math.min(100, Math.max(5, maxRatio));

                                                                        return (
                                                                            <div
                                                                                key={v.variantId}
                                                                                className="relative flex flex-col justify-between overflow-hidden rounded-xl border bg-background p-4 shadow-sm transition-all hover:shadow-md hover:border-muted-foreground/30"
                                                                            >
                                                                                <div>
                                                                                    <div className="flex items-start justify-between gap-2">
                                                                                        <div>
                                                                                            <h5 className="font-semibold text-sm leading-tight text-foreground">{v.variantName}</h5>
                                                                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                                                                Suffix: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">{v.skuSuffix || "-"}</span>
                                                                                            </p>
                                                                                        </div>
                                                                                        <Badge
                                                                                            variant={v.status ? "default" : "secondary"}
                                                                                            className={v.status ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-emerald-500/20" : "bg-muted text-muted-foreground"}
                                                                                        >
                                                                                            {v.status ? "Active" : "Inactive"}
                                                                                        </Badge>
                                                                                    </div>

                                                                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-dashed">
                                                                                        <div>
                                                                                            <span className="text-[10px] text-muted-foreground block uppercase font-medium tracking-wider">Purchase Price</span>
                                                                                            <span className="text-xs font-semibold font-mono text-foreground">
                                                                                                {new Intl.NumberFormat("en-IN", {
                                                                                                    style: "currency",
                                                                                                    currency: "INR",
                                                                                                    maximumFractionDigits: 0
                                                                                                }).format(v.purchasePrice)}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <span className="text-[10px] text-muted-foreground block uppercase font-medium tracking-wider">Selling Price</span>
                                                                                            <span className="text-sm font-bold font-mono text-primary">
                                                                                                {new Intl.NumberFormat("en-IN", {
                                                                                                    style: "currency",
                                                                                                    currency: "INR",
                                                                                                    maximumFractionDigits: 0
                                                                                                }).format(v.sellingPrice)}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="mt-4 pt-3 border-t">
                                                                                    <div className="flex items-center justify-between text-xs mb-1.5">
                                                                                        <span className="text-muted-foreground font-medium">Stock Status</span>
                                                                                        <span className={`font-mono font-semibold ${isLowStock ? "text-destructive" : "text-emerald-600"}`}>
                                                                                            {v.currentQuantity} / {v.reorderLevel} <span className="text-[10px] text-muted-foreground font-normal">(Min)</span>
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className={`h-full rounded-full transition-all ${isLowStock ? "bg-destructive animate-pulse" : "bg-emerald-500"
                                                                                                }`}
                                                                                            style={{ width: `${stockPercent}%` }}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {table.getFilteredSelectedRowModel().rows.length} of{" "}
                            {table.getFilteredRowModel().rows.length} row(s) selected.
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
