"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Plus, Search, Filter, AlertCircle, TrendingDown } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Progress } from "@/components/ui/progress"

const data: RawMaterial[] = [
    {
        id: "1",
        name: "Surgical Grade Titanium",
        unit: "kg",
        stock: 45,
        minStock: 10,
        vendor: "Titanium Corp",
    },
    {
        id: "2",
        name: "Sterile Packaging Material",
        unit: "Rolls",
        stock: 12,
        minStock: 25,
        vendor: "PackRight Solutions",
    },
    {
        id: "3",
        name: "Medical Grade Silicone",
        unit: "Liters",
        stock: 80,
        minStock: 50,
        vendor: "BioSil Chemicals",
    },
]

export type RawMaterial = {
    id: string
    name: string
    unit: string
    stock: number
    minStock: number
    vendor: string
}

export const columns: ColumnDef<RawMaterial>[] = [
    {
        accessorKey: "name",
        header: "Material Name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "unit",
        header: "Unit",
    },
    {
        accessorKey: "stock",
        header: "Stock Level",
        cell: ({ row }) => {
            const stock = row.original.stock
            const min = row.original.minStock
            const percentage = Math.min((stock / (min * 2)) * 100, 100)
            const isLow = stock <= min

            return (
                <div className="w-[150px] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span>{stock} {row.original.unit}</span>
                        <span className={isLow ? "text-destructive font-bold" : "text-muted-foreground"}>
                            Min: {min}
                        </span>
                    </div>
                    <Progress value={percentage} className={`h-1.5 ${isLow ? "bg-destructive/20" : ""}`} />
                </div>
            )
        },
    },
    {
        accessorKey: "vendor",
        header: "Primary Vendor",
    },
    {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
            const isLow = row.original.stock <= row.original.minStock
            return isLow ? (
                <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Low Stock
                </Badge>
            ) : (
                <Badge variant="outline" className="text-emerald-500 border-emerald-200 bg-emerald-50">
                    Healthy
                </Badge>
            )
        },
    },
]

export default function RawMaterialsPage() {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Raw Materials</h1>
                    <p className="text-muted-foreground">Monitor and restock materials for manufacturing.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Material
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">1</div>
                        <p className="text-xs text-muted-foreground">Items below minimum stock</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12,450</div>
                        <p className="text-xs text-muted-foreground">Material cost this month</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">18</div>
                        <p className="text-xs text-muted-foreground">Supplying raw materials</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Material Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between py-4 gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search materials..." className="pl-8" />
                        </div>
                        <Button variant="outline" size="sm">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                    </div>
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
                                {table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
