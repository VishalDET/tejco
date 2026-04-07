"use client"

import * as React from "react"
import Link from "next/link"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    MoreHorizontal,
    Plus,
    Building2,
    Download,
    AlertCircle,
    ExternalLink,
} from "lucide-react"

import { apiClient } from "@/lib/api-client"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Types ────────────────────────────────────────────────────────────────────

// The listing response has different keys than the detail/post schema.
type ApiCompanySummary = {
    id: number
    name: string
    regNo: string
    panNumber: string
    corporateWebsite: string
    contactPerson: string
    status: string
}

// Our internal UI model (consistent with detail/post)
export type Company = {
    companyId: number
    registeredName: string
    registrationNumber: string
    panNumber: string
    corporateWebsite: string
    mainContactNumber: string
    status: string
}

function mapApiToInternal(api: ApiCompanySummary): Company {
    return {
        companyId: api.id,
        registeredName: api.name,
        registrationNumber: api.regNo,
        panNumber: api.panNumber,
        corporateWebsite: api.corporateWebsite,
        mainContactNumber: api.contactPerson,
        status: api.status,
    }
}

// ─── Columns ──────────────────────────────────────────────────────────────────

export const columns: ColumnDef<Company>[] = [
    {
        accessorKey: "registeredName",
        header: "Company Name",
        cell: ({ row }) => (
            <span className="font-medium text-primary">{row.getValue("registeredName")}</span>
        ),
    },
    {
        accessorKey: "registrationNumber",
        header: "Reg. No",
    },
    {
        accessorKey: "panNumber",
        header: "PAN",
    },
    {
        accessorKey: "corporateWebsite",
        header: "Website",
        cell: ({ row }) => {
            const url = row.getValue("corporateWebsite") as string
            return url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline text-sm"
                >
                    {url.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" />
                </a>
            ) : (
                <span className="text-muted-foreground">—</span>
            )
        },
    },
    {
        accessorKey: "mainContactNumber",
        header: "Contact",
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
        cell: ({ row }) => (
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
                    <DropdownMenuItem
                        onClick={() =>
                            (window.location.href = `/system/masters/companies/${row.original.companyId}`)
                        }
                    >
                        View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() =>
                            navigator.clipboard.writeText(String(row.original.companyId))
                        }
                    >
                        Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = `/system/masters/companies/edit/${row.original.companyId}`}>Edit details</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                        Deactivate
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
    const [data, setData] = React.useState<Company[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        async function fetchCompanies() {
            try {
                const res = await apiClient.get<ApiCompanySummary[]>("/api/SystemMasters/companies")
                setData(res.map(mapApiToInternal))
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : "Failed to load companies"
                setError(message)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCompanies()
    }, [])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
                    <p className="text-muted-foreground">
                        Manage your legal entities and corporate structure.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button
                        render={<Link href="/system/masters/companies/add" />}
                        nativeButton={false}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Company
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Registered Companies
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
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
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
                                                    <Skeleton className="h-4 w-full" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            No companies found.
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
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
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
