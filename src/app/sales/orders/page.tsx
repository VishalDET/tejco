"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Filter, MoreVertical, Eye, FileDown, Printer, Edit } from "lucide-react"
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
import { Order, OrderStatus } from "./types"
import { OrderFormDialog } from "./order-form-dialog"

const initialOrders: Order[] = [
    {
        id: "1",
        orderNumber: "ORD-9281",
        clientId: "c1",
        clientName: "Dr. Aris Varma",
        salesPersonId: "SP-001",
        date: "2026-03-08",
        status: "Approved",
        paymentStatus: "Paid",
        items: [{ id: "i1", productId: "p1", productName: "Surgical Blade #10", sku: "SB-010-G", quantity: 100, unitPrice: 12.50, total: 1250, gstRate: 18 }],
        subtotal: 1250,
        taxAmount: 225,
        totalAmount: 1475,
        billingAddress: "Mumbai, Maharashtra",
        shippingAddress: "Mumbai, Maharashtra",
    },
    {
        id: "2",
        orderNumber: "ORD-9282",
        clientId: "c2",
        clientName: "City Dental Clinic",
        date: "2026-03-09",
        status: "Pending",
        paymentStatus: "Unpaid",
        items: [{ id: "i2", productId: "p2", productName: "Medical Gauze", sku: "MG-ST-100", quantity: 50, unitPrice: 68.41, total: 3420.5, gstRate: 12 }],
        subtotal: 3420.5,
        taxAmount: 410.46,
        totalAmount: 3830.96,
        billingAddress: "Pune, Maharashtra",
        shippingAddress: "Pune, Maharashtra",
    },
]

const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
        case "Pending": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none">Pending Approval</Badge>
        case "Approved": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Approved</Badge>
        case "Packed": return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-none">Packed</Badge>
        case "Dispatched": return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none">Dispatched</Badge>
        case "Delivered": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Delivered</Badge>
        case "Cancelled": return <Badge variant="destructive">Cancelled</Badge>
        default: return <Badge variant="outline">{status}</Badge>
    }
}

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = React.useState<Order[]>(initialOrders)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
    const [isMounted, setIsMounted] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    React.useEffect(() => {
        setIsMounted(true)
        
        // Handle conversion from Proforma
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get("convert") === "true") {
            const sourceData = localStorage.getItem("convert_source_data")
            if (sourceData) {
                const parsed = JSON.parse(sourceData)
                setSelectedOrder(parsed)
                setIsDialogOpen(true)
                // Clean up URL and storage
                window.history.replaceState({}, "", window.location.pathname)
                localStorage.removeItem("convert_source_data")
            }
        }
    }, [])

    const handleCreateOrder = () => {
        setSelectedOrder(null)
        setIsDialogOpen(true)
    }

    const handleEditOrder = (order: Order) => {
        setSelectedOrder(order)
        setIsDialogOpen(true)
    }

    const handleSaveOrder = (data: Partial<Order>) => {
        if (selectedOrder) {
            setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...data } as Order : o))
        } else {
            const newOrder: Order = {
                ...data,
                id: Math.random().toString(36).substr(2, 9),
            } as Order
            setOrders(prev => [newOrder, ...prev])
        }
    }

    const filteredOrders = orders.filter(o => 
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">Processing and managing sales orders from clients.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleCreateOrder}>
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
                                    <Input 
                                        placeholder="Search orders..." 
                                        className="pl-8 w-[250px]" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[120px]">Order Number</TableHead>
                                        <TableHead>Client / Doctor</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Total Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground italic">
                                                No orders found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium text-primary">{order.orderNumber}</TableCell>
                                                <TableCell>{order.clientName}</TableCell>
                                                <TableCell>{new Date(order.date).toLocaleDateString("en-GB")}</TableCell>
                                                <TableCell>{order.items.length} items</TableCell>
                                                <TableCell className="text-right font-semibold">₹{order.totalAmount.toLocaleString()}</TableCell>
                                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={order.paymentStatus === "Paid" ? "text-emerald-500 border-emerald-200" : "text-amber-500 border-amber-200"}>
                                                        {order.paymentStatus}
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
                                                            <DropdownMenuItem className="gap-2" onClick={() => handleEditOrder(order)}>
                                                                <Edit className="h-4 w-4" /> Edit Order
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2" onClick={() => router.push(`/sales/orders/${order.id}`)}>
                                                                <Eye className="h-4 w-4" /> View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2"><FileDown className="h-4 w-4" /> Download PDF</DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2"><Printer className="h-4 w-4" /> Print Challan</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive uppercase text-[10px] font-bold">Cancel Order</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <OrderFormDialog 
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                order={selectedOrder}
                onSave={handleSaveOrder}
            />
        </div>
    )
}
