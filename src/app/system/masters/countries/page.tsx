"use client"

import * as React from "react"
import Link from "next/link"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    MoreHorizontal,
    Plus,
    Globe,
    Loader2,
    AlertCircle,
    Trash2,
} from "lucide-react"

import { countryMasterApi, CountryMaster } from "@/lib/api"
import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function CountriesPage() {
    const [data, setData] = React.useState<CountryMaster[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const fetchCountries = React.useCallback(async () => {
        try {
            setIsLoading(true)
            const res = await countryMasterApi.getAll()
            setData(res || [])
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load countries"
            setError(message)
        } finally {
            setIsLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchCountries()
    }, [fetchCountries])

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this country?")) return
        try {
            await countryMasterApi.remove(id)
            toast.success("Country deleted successfully")
            setData((prev) => prev.filter((item) => item.countryId !== id))
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to delete country"
            toast.error(message)
        }
    }

    const columns = React.useMemo<ColumnDef<CountryMaster>[]>(() => [
        {
            accessorKey: "countryName",
            header: "Country Name",
            cell: ({ row }) => <span className="font-semibold text-primary">{row.getValue("countryName")}</span>,
        },
        {
            accessorKey: "currencyType",
            header: "Currency",
        },
        {
            accessorKey: "paymentType",
            header: "Preferred Payment Mode",
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const item = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            }
                        />
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => window.location.href = `/system/masters/countries/${item.countryId}`}>
                                View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = `/system/masters/countries/edit/${item.countryId}`}>
                                Edit country
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive flex items-center gap-2"
                                onClick={() => handleDelete(item.countryId)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ], [])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Countries</h1>
                    <p className="text-muted-foreground">Manage country-specific currency, payment configurations, and profiles.</p>
                </div>
                <Button render={<Link href="/system/masters/countries/add" />} nativeButton={false}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Country
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5 text-sky-600" />
                        Supported Countries
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive mb-4">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

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
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {columns.map((_, j) => (
                                                <TableCell key={j}>
                                                    <div className="h-4 w-full animate-pulse bg-muted rounded" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : table.getRowModel().rows.length > 0 ? (
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
                                        <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                            No countries configured. Click "Add Country" to begin.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {!isLoading && table.getPageCount() > 1 && (
                        <div className="flex items-center justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
