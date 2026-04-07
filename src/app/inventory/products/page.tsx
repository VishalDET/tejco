"use client"

import * as React from "react"
import Link from "next/link"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Search, Filter, Download, Loader2, AlertCircle } from "lucide-react"

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
}

export const columns: ColumnDef<Product>[] = [
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
        header: "SKU",
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
            const formatted = new Intl.NumberFormat("en-US", {
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
        cell: ({ row }) => {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
                            Copy product ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.location.href = `/inventory/products/${row.original.id}`}>View details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/inventory/products/${row.original.id}`}>Edit product</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
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
                            status: status
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
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
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
                    <Button render={<Link href="/inventory/products/add" />} nativeButton={false}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Product Catalog</CardTitle>
                    <CardDescription>View and manage all your products across all warehouses.</CardDescription>
                </CardHeader>
                <CardContent>
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
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
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
