"use client"

import * as React from "react"
import Link from "next/link"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    MoreHorizontal,
    Plus,
    Layers,
    Download,
    Loader2,
    AlertCircle,
} from "lucide-react"

import { apiClient, categoriesApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// ─── API response types ───────────────────────────────────────────────────────

type ApiSubcategory = {
    subcategoryId: number
    categoryId: number
    subcategoryName: string
    description: string
}

type ApiCategory = {
    categoryId: number
    categoryName: string
    description: string
    status: boolean
    subcategories: ApiSubcategory[]
}

// ─── UI model ─────────────────────────────────────────────────────────────────

export type Category = {
    id: string
    name: string
    description: string
    subcategoriesCount: number
    status: "Active" | "Inactive"
}

function countSubcategories(subs: any[]): number {
    if (!subs) return 0
    let count = subs.length
    subs.forEach(s => {
        if (s.subcategories) {
            count += countSubcategories(s.subcategories)
        }
    })
    return count
}

function mapApiCategory(c: ApiCategory): Category {
    return {
        id: String(c.categoryId),
        name: c.categoryName,
        description: c.description,
        subcategoriesCount: countSubcategories(c.subcategories),
        status: c.status ? "Active" : "Inactive",
    }
}

// ─── Table columns ────────────────────────────────────────────────────────────

export const columns: ColumnDef<Category>[] = [
    {
        accessorKey: "name",
        header: "Category Name",
        cell: ({ row }) => <span className="font-medium text-primary">{row.getValue("name")}</span>,
    },
    {
        accessorKey: "description",
        header: "Description",
    },
    {
        accessorKey: "subcategoriesCount",
        header: "Subcategories",
        cell: ({ row }) => <Badge variant="outline">{row.getValue("subcategoriesCount")}</Badge>,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === "Active" ? "default" : "secondary"}>
                    {status}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row, table }) => {
            const category = row.original
            const meta = table.options.meta as { onDelete: (id: string) => void }
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
                        <DropdownMenuItem 
                            onClick={() => window.location.href = `/system/masters/categories/${category.id}/edit`}
                        >
                            Edit category
                        </DropdownMenuItem>
                        <DropdownMenuItem>View products</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => meta.onDelete(category.id)}
                        >
                            Delete category
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

// ─── Page component ───────────────────────────────────────────────────────────

export default function CategoriesPage() {
    const [data, setData] = React.useState<Category[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [categoryToDelete, setCategoryToDelete] = React.useState<string | null>(null)

    React.useEffect(() => {
        categoriesApi
            .getAll()
            .then(res => {
                const data = Array.isArray(res) ? res : (res as any).data || []
                setData(data.map(mapApiCategory))
            })
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const handleDelete = async () => {
        if (!categoryToDelete) return
        setIsDeleting(true)
        try {
            await categoriesApi.remove(categoryToDelete)
            setData(prev => prev.filter(c => c.id !== categoryToDelete))
            toast.success("Category deleted successfully")
            setCategoryToDelete(null)
        } catch (err: any) {
            toast.error(`Failed to delete category: ${err.message}`)
        } finally {
            setIsDeleting(false)
        }
    }

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        meta: {
            onDelete: (id: string) => setCategoryToDelete(id),
        }
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">Manage product hierarchies and classifications.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button render={<Link href="/system/masters/categories/add" />} nativeButton={false}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load categories</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        Product Categories
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Loading categories…</span>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id}>
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow key={row.id}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground">
                                                No categories found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!categoryToDelete} onOpenChange={() => !isDeleting && setCategoryToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the category
                            and all its nested subcategories.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCategoryToDelete(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
