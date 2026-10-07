import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
    Search,
    Plus,
    Filter,
    MoreVertical,
    Eye,
    Printer,
    Edit,
    ArrowRightLeft,
    Boxes,
    Warehouse,
    Clock,
    CheckCircle2,
    Truck,
    AlertCircle,
    RefreshCw,
    Loader2
} from "lucide-react"
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StockTransfer, TransferStatus, mapApiStockTransfer } from "./types"
import { StockTransferDialog } from "./stock-transfer-dialog"
import { stockTransfersApi } from "@/lib/api"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

const mockTransfers: StockTransfer[] = [
    {
        id: "1",
        transferId: "TRX-1001",
        date: "2026-03-20",
        reason: "Stock Redistribution",
        status: "Completed",
        sourceWarehouseId: "3",
        sourceWarehouseName: "AMORE COMMERCIAL",
        sourceStorageId: "0",
        destinationWarehouseId: "4",
        destinationWarehouseName: "Shree Industrial  Centre",
        destinationStorageId: "0",
        items: [
            { id: "i1", productId: "127", productName: "Slitting Devices-Cut To Side Blade(per pcs)", sku: "CUT-SIDE-01", quantity: 50, unit: "pcs" },
            { id: "i2", productId: "128", productName: "Slitting Devices-Disposable Slitter", sku: "SLIT-DISP-01", quantity: 20, unit: "pcs" }
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
        sourceWarehouseId: "4",
        sourceWarehouseName: "Shree Industrial  Centre",
        sourceStorageId: "0",
        destinationWarehouseId: "3",
        destinationWarehouseName: "AMORE COMMERCIAL",
        destinationStorageId: "0",
        items: [
            { id: "i3", productId: "129", productName: "Disposable Slitter 0.9mm", sku: "SLIT-0.9", quantity: 5, unit: "pcs" }
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
    const navigate = useNavigate()
    const [transfers, setTransfers] = React.useState<StockTransfer[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isRefreshing, setIsRefreshing] = React.useState(false)
    const [warehouses, setWarehouses] = React.useState<any[]>([])
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [selectedTransfer, setSelectedTransfer] = React.useState<StockTransfer | null>(null)
    const [isMounted, setIsMounted] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [activeTab, setActiveTab] = React.useState("all")

    const fetchTransfers = React.useCallback(async (cachedWh?: any[], silent = false) => {
        if (!silent) setIsLoading(true)
        else setIsRefreshing(true)

        try {
            const [transfersRes, whRes, prodRes] = await Promise.all([
                stockTransfersApi.getAll(),
                cachedWh && cachedWh.length > 0
                    ? Promise.resolve({ data: cachedWh })
                    : apiClient.get<any>("/api/Warehouse").catch(() => ({ data: [] })),
                apiClient.get<any>("/api/Product/GetAll").catch(() => ({ data: [] })),
            ])

            const activeWarehouses =
                cachedWh && cachedWh.length > 0
                    ? cachedWh
                    : Array.isArray(whRes?.data)
                    ? whRes.data
                    : []
            setWarehouses(activeWarehouses)
            const activeProducts = Array.isArray(prodRes?.data) ? prodRes.data : []

            if (transfersRes && transfersRes.success && Array.isArray(transfersRes.data)) {
                if (transfersRes.data.length > 0) {
                    const mapped = transfersRes.data.map((item: any) =>
                        mapApiStockTransfer(item, activeWarehouses, activeProducts)
                    )
                    setTransfers(mapped)
                } else {
                    // No transfers exist in backend yet; fallback to sample demo records
                    setTransfers(mockTransfers)
                }
            } else if (Array.isArray(transfersRes)) {
                if (transfersRes.length > 0) {
                    const mapped = transfersRes.map((item: any) =>
                        mapApiStockTransfer(item, activeWarehouses, activeProducts)
                    )
                    setTransfers(mapped)
                } else {
                    setTransfers(mockTransfers)
                }
            } else {
                setTransfers(mockTransfers)
            }
        } catch (err: any) {
            console.error("Failed to load stock transfers from GET /api/Inventory/StockTransfers:", err)
            // Graceful fallback to mock data
            setTransfers(mockTransfers)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    React.useEffect(() => {
        setIsMounted(true)
        fetchTransfers()
    }, [fetchTransfers])

    const handleCreateTransfer = () => {
        setSelectedTransfer(null)
        setIsDialogOpen(true)
    }

    const handleEditTransfer = (transfer: StockTransfer) => {
        setSelectedTransfer(transfer)
        setIsDialogOpen(true)
    }

    const handleSaveTransfer = async (data: Partial<StockTransfer>) => {
        if (selectedTransfer) {
            setTransfers((prev) =>
                prev.map((t) => (t.id === selectedTransfer.id ? ({ ...t, ...data } as StockTransfer) : t))
            )
        } else {
            const newTransfer: StockTransfer = {
                ...data,
                id: data.id || Math.random().toString(36).substr(2, 9),
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
            } as StockTransfer
            setTransfers((prev) => [newTransfer, ...prev])
        }

        // Silent re-fetch from API to synchronize
        await fetchTransfers(warehouses, true)
    }

    const handleUpdateStatus = async (id: string, newStatus: TransferStatus) => {
        try {
            await stockTransfersApi.updateStatus(id, newStatus)
            setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)))
            toast.success(`Transfer status updated to ${newStatus}`)
            fetchTransfers(warehouses, true)
        } catch (err: any) {
            console.error("Failed to update status:", err)
            toast.error(err?.message || "Failed to update transfer status")
        }
    }

    const filteredTransfers = transfers.filter((t) => {
        const query = searchQuery.toLowerCase().trim()
        const matchesSearch =
            !query ||
            t.transferId.toLowerCase().includes(query) ||
            t.reason.toLowerCase().includes(query) ||
            (t.sourceWarehouseName || "").toLowerCase().includes(query) ||
            (t.destinationWarehouseName || "").toLowerCase().includes(query)

        if (!matchesSearch) return false

        if (activeTab === "pending") return t.status === "Pending" || t.status === "Draft"
        if (activeTab === "in-transit") return t.status === "In Transit"
        if (activeTab === "completed") return t.status === "Completed"
        return true
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Transfer</h1>
                    <p className="text-muted-foreground">Move inventory between warehouses and storage locations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTransfers(warehouses, true)}
                        disabled={isLoading || isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleCreateTransfer} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Transfer
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between space-y-2 pb-4 border-b">
                    <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">
                            All Transfers ({transfers.length})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">
                            Pending ({transfers.filter(t => t.status === "Pending" || t.status === "Draft").length})
                        </TabsTrigger>
                        <TabsTrigger value="in-transit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">
                            In Transit ({transfers.filter(t => t.status === "In Transit").length})
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2">
                            Completed ({transfers.filter(t => t.status === "Completed").length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-6">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-4 pb-7">
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
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4">
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
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                    <span>Loading stock transfers...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredTransfers.length === 0 ? (
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
                                                        <Badge variant="outline" className="font-normal">{transfer.sourceWarehouseName || transfer.sourceWarehouseId}</Badge>
                                                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                                        <Badge variant="outline" className="font-normal">{transfer.destinationWarehouseName || transfer.destinationWarehouseId}</Badge>
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
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem className="gap-2" onClick={() => handleEditTransfer(transfer)}>
                                                                <Edit className="h-4 w-4" /> Edit Transfer
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className="gap-2" 
                                                                onClick={() => navigate(`/inventory/stock-transfer/${transfer.id}`)}
                                                            >
                                                                <Eye className="h-4 w-4" /> View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2"><Printer className="h-4 w-4" /> Print Gate Pass</DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {transfer.status !== "In Transit" && transfer.status !== "Completed" && (
                                                                <DropdownMenuItem className="gap-2" onClick={() => handleUpdateStatus(transfer.id, "In Transit")}>
                                                                    <Truck className="h-4 w-4 text-blue-500" /> Start Transit
                                                                </DropdownMenuItem>
                                                            )}
                                                            {transfer.status === "In Transit" && (
                                                                <DropdownMenuItem className="gap-2" onClick={() => handleUpdateStatus(transfer.id, "Completed")}>
                                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Mark Completed
                                                                </DropdownMenuItem>
                                                            )}
                                                            {transfer.status !== "Cancelled" && (
                                                                <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleUpdateStatus(transfer.id, "Cancelled")}>
                                                                    <AlertCircle className="h-4 w-4 text-destructive" /> Cancel Transfer
                                                                </DropdownMenuItem>
                                                            )}
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
