"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Filter, MoreVertical, Eye, FileDown, Printer, Edit, ArrowRightLeft, Boxes, Warehouse, Clock, CheckCircle2, Truck, AlertCircle } from "lucide-react"
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
import { StockTransfer, TransferStatus } from "./types"
import { StockTransferDialog } from "./stock-transfer-dialog"

const mockTransfers: StockTransfer[] = [
    {
        id: "1",
        transferId: "TRX-1001",
        date: "2026-03-20",
        reason: "Stock Redistribution",
        status: "Completed",
        sourceWarehouseId: "w1",
        sourceStorageId: "s1",
        destinationWarehouseId: "w2",
        destinationStorageId: "s3",
        items: [
            { id: "i1", productId: "p1", productName: "Surgical Blade #10", sku: "SB-010-G", quantity: 50, unit: "Box" },
            { id: "i2", productId: "p2", productName: "Medical Gauze (Sterile)", sku: "MG-ST-100", quantity: 20, unit: "Pack" }
        ],
        createdAt: "2026-03-20T10:00:00Z",
        updatedAt: "2026-03-21T14:30:00Z"
    },
    {
        id: "2",
        transferId: "TRX-1002",
        date: "2026-03-24",
        reason: "Damaged Stock - Return to HQ",
        status: "In Transit",
        sourceWarehouseId: "w2",
        sourceStorageId: "s4",
        destinationWarehouseId: "w1",
        destinationStorageId: "s2",
        items: [
            { id: "i3", productId: "p3", productName: "Antiseptic Solution 500ml", sku: "AS-500", quantity: 5, unit: "Bottle" }
        ],
        createdAt: "2026-03-24T09:15:00Z",
        updatedAt: "2026-03-24T09:15:00Z"
    }
]

const getStatusBadge = (status: TransferStatus) => {
    switch (status) {
        case "Draft": return <Badge variant="secondary" className="bg-slate-100 text-slate-800">Draft</Badge>
        case "Pending": return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>
        case "In Transit": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 animate-pulse">In Transit</Badge>
        case "Completed": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Completed</Badge>
        case "Cancelled": return <Badge variant="destructive">Cancelled</Badge>
        default: return <Badge variant="outline">{status}</Badge>
    }
}

export default function StockTransferPage() {
    const router = useRouter()
    const [transfers, setTransfers] = React.useState<StockTransfer[]>(mockTransfers)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [selectedTransfer, setSelectedTransfer] = React.useState<StockTransfer | null>(null)
    const [isMounted, setIsMounted] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleCreateTransfer = () => {
        setSelectedTransfer(null)
        setIsDialogOpen(true)
    }

    const handleEditTransfer = (transfer: StockTransfer) => {
        setSelectedTransfer(transfer)
        setIsDialogOpen(true)
    }

    const handleSaveTransfer = (data: Partial<StockTransfer>) => {
        if (selectedTransfer) {
            setTransfers(prev => prev.map(t => t.id === selectedTransfer.id ? { ...t, ...data } as StockTransfer : t))
        } else {
            const newTransfer: StockTransfer = {
                ...data,
                id: Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as StockTransfer
            setTransfers(prev => [newTransfer, ...prev])
        }
    }

    const filteredTransfers = transfers.filter(t => 
        t.transferId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.reason.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Transfer</h1>
                    <p className="text-muted-foreground">Move inventory between warehouses and storage locations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleCreateTransfer} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Transfer
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between space-y-2 pb-4 border-b">
                    <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">All Transfers</TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">Pending</TabsTrigger>
                        <TabsTrigger value="in-transit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">In Transit</TabsTrigger>
                        <TabsTrigger value="completed" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">Completed</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="mt-6">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                            <div>
                                <CardTitle className="text-lg">Transfer History</CardTitle>
                                <CardDescription>Monitor and track internal stock movements.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search transfers..." 
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
                                        <TableHead className="w-[120px]">Transfer ID</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead>Movement</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransfers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                                                No transfers found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTransfers.map((transfer) => (
                                            <TableRow key={transfer.id}>
                                                <TableCell className="font-bold text-primary">{transfer.transferId}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">{transfer.reason}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Badge variant="outline" className="font-normal">{transfer.sourceWarehouseId}</Badge>
                                                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                                        <Badge variant="outline" className="font-normal">{transfer.destinationWarehouseId}</Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{isMounted ? new Date(transfer.date).toLocaleDateString("en-GB") : transfer.date}</TableCell>
                                                <TableCell>{transfer.items.length} products</TableCell>
                                                <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            render={
                                                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                            }
                                                        />
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem className="gap-2" onClick={() => handleEditTransfer(transfer)}>
                                                                <Edit className="h-4 w-4" /> Edit Transfer
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="gap-2" 
                                                                onClick={() => router.push(`/inventory/stock-transfer/${transfer.id}`)}
                                                            >
                                                                <Eye className="h-4 w-4" /> View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2"><Printer className="h-4 w-4" /> Print Gate Pass</DropdownMenuItem>
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

            <StockTransferDialog 
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                transfer={selectedTransfer}
                onSave={handleSaveTransfer}
            />
        </div>
    )
}
