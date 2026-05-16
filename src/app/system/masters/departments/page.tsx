"use client"

import * as React from "react"
import Link from "next/link"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    MoreHorizontal,
    Plus,
    LayoutGrid,
    Loader2,
    AlertCircle,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type Department = {
    id: number
    companyId: number
    branchId: number
    name: string
    code: string
    hod: string
    branch: string
    status: string
}

export const columns: ColumnDef<Department>[] = [
    {
        accessorKey: "name",
        header: "Dept Name",
        cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
        accessorKey: "code",
        header: "Code",
    },
    {
        accessorKey: "hod",
        header: "Head of Dept",
    },
    {
        accessorKey: "branch",
        header: "Branch",
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
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => window.location.href = `/system/masters/departments/${row.original.id}`}>
                            View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/system/masters/departments/edit/${row.original.id}`}>
                            Edit department
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

export default function DepartmentsPage() {
    const [data, setData] = React.useState<Department[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        async function fetchDepartments() {
            try {
                const res = await apiClient.get<Department[]>("/api/SystemMasters/departments")
                setData(res || [])
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load departments"
                setError(message)
            } finally {
                setIsLoading(false)
            }
        }
        fetchDepartments()
    }, [])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
                    <p className="text-muted-foreground">Define and organize departmental structure for each branch.</p>
                </div>
                <Button render={<Link href="/system/masters/departments/add" />} nativeButton={false}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5 text-amber-600" />
                        Organizational Units
                    </CardTitle>
                </CardHeader>
                <CardContent>
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
                                            No departments found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
