"use client"

import * as React from "react"
import { Search, Plus, Filter, MoreVertical, Eye, FileDown, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const orders = [
    {
        id: "ORD-9281",
        doctor: "Dr. Aris Varma",
        date: "2026-03-08",
        items: 4,
        total: 1250.00,
        status: "Approved",
        payment: "Paid",
    },
    {
        id: "ORD-9282",
        doctor: "City Dental Clinic",
        date: "2026-03-09",
        items: 12,
        total: 3420.50,
        status: "Pending",
        payment: "Unpaid",
    },
    {
        id: "ORD-9283",
        doctor: "Dr. Vishal Kumar",
        date: "2026-03-09",
        items: 2,
        total: 450.00,
        status: "Packed",
        payment: "Paid",
    },
    {
        id: "ORD-9284",
        doctor: "Metro Hospital",
        date: "2026-03-10",
        items: 45,
        total: 12800.00,
        status: "Dispatched",
        payment: "Partial",
    },
]

const getStatusBadge = (status: string) => {
    switch (status) {
        case "Pending": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">Pending Approval</Badge>
        case "Approved": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Approved</Badge>
        case "Packed": return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-none">Packed</Badge>
        case "Dispatched": return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none">Dispatched</Badge>
        case "Delivered": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Delivered</Badge>
        default: return <Badge variant="outline">{status}</Badge>
    }
}

export default function OrdersPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">Processing and managing sales orders from clients.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Order
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between space-y-2 pb-4 border-b">
                    <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">All Orders</TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">Pending</TabsTrigger>
                        <TabsTrigger value="approved" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">Approved</TabsTrigger>
                        <TabsTrigger value="dispatched" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">Dispatched</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="mt-6 border-none p-0">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                            <div>
                                <CardTitle className="text-lg">Order List</CardTitle>
                                <CardDescription>Review and manage all incoming sales orders.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search orders..." className="pl-8 w-[250px]" />
                                </div>
                                <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[100px]">Order ID</TableHead>
                                        <TableHead>Doctor / Client</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium text-primary">{order.id}</TableCell>
                                            <TableCell>{order.doctor}</TableCell>
                                            <TableCell>{order.date}</TableCell>
                                            <TableCell>{order.items}</TableCell>
                                            <TableCell className="text-right font-semibold">${order.total.toFixed(2)}</TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={order.payment === "Paid" ? "text-emerald-500 border-emerald-200" : "text-amber-500 border-amber-200"}>
                                                    {order.payment}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        render={
                                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                        }
                                                    />
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2"><FileDown className="h-4 w-4" /> Download PDF</DropdownMenuItem>
                                                        <DropdownMenuItem className="gap-2"><Printer className="h-4 w-4" /> Print Challan</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive uppercase text-[10px] font-bold">Cancel Order</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
