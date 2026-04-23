"use client"

import * as React from "react"
import { StockTransfer, TransferItem, TransferStatus, Warehouse, StorageLocation } from "./types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Trash2, ArrowRight, Boxes, Warehouse as WarehouseIcon, MapPin, Calculator, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StockTransferDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transfer: StockTransfer | null
    onSave: (data: Partial<StockTransfer>) => void
}

// Mock data for warehouses and storage locations
const warehouses: Warehouse[] = [
    {
        id: "w1",
        name: "Main Warehouse (Mumbai)",
        locations: [
            { id: "s1", name: "Shelf A-101", warehouseId: "w1" },
            { id: "s2", name: "Cold Storage 1", warehouseId: "w1" }
        ]
    },
    {
        id: "w2",
        name: "Regional Hub (Pune)",
        locations: [
            { id: "s3", name: "Storage Bin B-4", warehouseId: "w2" },
            { id: "s4", name: "Receiving Area", warehouseId: "w2" }
        ]
    }
]

export function StockTransferDialog({ open, onOpenChange, transfer, onSave }: StockTransferDialogProps) {
    const [form, setForm] = React.useState<Partial<StockTransfer>>({})
    const [isSaving, setIsSaving] = React.useState(false)

    React.useEffect(() => {
        if (transfer) {
            setForm(transfer)
        } else {
            setForm({
                transferId: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
                date: new Date().toISOString().split('T')[0],
                status: "Draft",
                reason: "",
                items: [],
                sourceWarehouseId: "",
                sourceStorageId: "",
                destinationWarehouseId: "",
                destinationStorageId: ""
            })
        }
    }, [transfer, open])

    const set = (field: keyof StockTransfer, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const addItem = () => {
        const newItem: TransferItem = {
            id: Math.random().toString(36).substring(2, 9).slice(0, 8),
            productId: "",
            productName: "",
            sku: "",
            quantity: 1,
            unit: "Unit"
        }
        setForm(prev => ({ ...prev, items: [...(prev.items || []), newItem] }))
    }

    const updateItem = (id: string, field: keyof TransferItem, value: any) => {
        setForm(prev => ({
            ...prev,
            items: (prev.items || []).map(item => item.id === id ? { ...item, [field]: value } : item)
        }))
    }

    const removeItem = (id: string) => {
        setForm(prev => ({ ...prev, items: (prev.items || []).filter(item => item.id !== id) }))
    }

    const handleSave = async () => {
        if (!form.reason || (form.items || []).length === 0 || !form.sourceWarehouseId || !form.destinationWarehouseId) return
        setIsSaving(true)
        await new Promise(resolve => setTimeout(resolve, 800))
        onSave(form)
        setIsSaving(false)
        onOpenChange(false)
    }

    const sourceWarehouse = warehouses.find(h => h.id === form.sourceWarehouseId)
    const destWarehouse = warehouses.find(h => h.id === form.destinationWarehouseId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-50/50 outline-none border-none shadow-2xl">
                <DialogHeader className="p-6 pb-4 bg-white border-b sticky top-0 z-20 shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-normal flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Boxes className="h-6 w-6 text-primary" />
                            </div>
                            {transfer ? "Edit Stock Transfer" : "New Stock Transfer"}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="px-3 py-1 bg-white">{form.transferId}</Badge>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 w-full overflow-y-auto">
                    <div className="p-6 space-y-8 pb-10">
                        {/* Window 1: General Info & Product Selection */}
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 lg:col-span-8 space-y-6">
                                <Card className="border-none shadow-sm overflow-hidden">
                                    <div className="bg-white px-6 space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info className="h-4 w-4 text-primary" />
                                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">General Information</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="date">Transfer Date</Label>
                                                <Input id="date" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="status">Status</Label>
                                                <Select value={form.status} onValueChange={(v) => set("status", v as TransferStatus)}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Draft">Draft</SelectItem>
                                                        <SelectItem value="Pending">Pending</SelectItem>
                                                        <SelectItem value="In Transit">In Transit</SelectItem>
                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label htmlFor="reason">Reason for Transfer *</Label>
                                                <Input id="reason" placeholder="e.g., Stock Redistribution, Defective Return..." value={form.reason} onChange={(e) => set("reason", e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-sm overflow-hidden">
                                    <div className="bg-white px-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Boxes className="h-4 w-4 text-primary" />
                                                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Product Selection</h3>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 text-xs font-bold">
                                                <Plus className="h-3 w-3" /> Add Product
                                            </Button>
                                        </div>

                                        <div className="border rounded-xl overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-slate-50">
                                                    <TableRow>
                                                        <TableHead className="text-[11px] font-bold">Product / SKU</TableHead>
                                                        <TableHead className="w-[100px] text-[11px] font-bold text-center">Qty</TableHead>
                                                        <TableHead className="w-[100px] text-[11px] font-bold">Unit</TableHead>
                                                        <TableHead className="w-[40px]"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(form.items || []).length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic text-sm">
                                                                No products selected yet.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        (form.items || []).map((item) => (
                                                            <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                                                <TableCell className="align-top py-3">
                                                                    <div className="flex flex-col gap-2">
                                                                        <Input
                                                                            placeholder="Product name"
                                                                            className="h-9 text-sm font-medium border-slate-200 focus:bg-white transition-all shadow-none"
                                                                            value={item.productName}
                                                                            onChange={(e) => updateItem(item.id, "productName", e.target.value)}
                                                                        />
                                                                        <div className="relative">
                                                                            <Input
                                                                                placeholder="SKU Code"
                                                                                className="h-7 text-[10px] border-none bg-slate-100/80 font-mono pl-7 focus:bg-slate-200/50 transition-all rounded-md"
                                                                                value={item.sku}
                                                                                onChange={(e) => updateItem(item.id, "sku", e.target.value)}
                                                                            />
                                                                            <div className="absolute left-2 top-1.5 text-[9px] font-bold text-slate-400 uppercase">SKU</div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="align-top py-3">
                                                                    <div className="pt-0.5">
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            className="h-9 text-center font-bold border-slate-200 shadow-none"
                                                                            value={item.quantity}
                                                                            onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                                                        />
                                                                        <div className="mt-1 text-center text-[9px] text-slate-400 font-bold uppercase">Quantity</div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="align-top py-3">
                                                                    <div className="pt-0.5">
                                                                        <Input
                                                                            className="h-9 text-xs border-slate-200 shadow-none"
                                                                            value={item.unit}
                                                                            placeholder="Unit"
                                                                            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                                                                        />
                                                                        <div className="mt-1 text-center text-[9px] text-slate-400 font-bold uppercase">Unit</div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="align-top py-3">
                                                                    <div className="pt-1 text-right">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => removeItem(item.id)}
                                                                            className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-full"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Window 2: Source & Destination */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                <Card className="border-none shadow-sm overflow-hidden h-full">
                                    <div className="bg-white px-6 h-full flex flex-col">
                                        <div className="flex items-center gap-2 mb-6">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Warehouse Routing</h3>
                                        </div>

                                        <div className="relative space-y-12">
                                            {/* Connector Line */}
                                            <div className="absolute left-[19px] top-8 bottom-8 w-[2px] bg-dashed border-l-2 border-slate-200 border-dashed z-0" />

                                            {/* Source */}
                                            <div className="relative z-10 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-amber-100 p-2 rounded-full border-2 border-white shadow-sm font-bold text-xs text-amber-700">FROM</div>
                                                    <h4 className="text-sm font-bold">Source Warehouse</h4>
                                                </div>
                                                <div className="ml-10 space-y-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Warehouse</Label>
                                                        <Select value={form.sourceWarehouseId} onValueChange={(v) => {
                                                            set("sourceWarehouseId", v)
                                                            set("sourceStorageId", "")
                                                        }}>
                                                            <SelectTrigger className="h-9 border-slate-200"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                                                            <SelectContent>
                                                                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Storage Location</Label>
                                                        <Select value={form.sourceStorageId} disabled={!form.sourceWarehouseId} onValueChange={(v) => set("sourceStorageId", v)}>
                                                            <SelectTrigger className="h-9 border-slate-200"><SelectValue placeholder="Select storage" /></SelectTrigger>
                                                            <SelectContent>
                                                                {sourceWarehouse?.locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Destination */}
                                            <div className="relative z-10 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-100 p-2 rounded-full border-2 border-white shadow-sm font-bold text-xs text-blue-700">TO</div>
                                                    <h4 className="text-sm font-bold">Destination Warehouse</h4>
                                                </div>
                                                <div className="ml-10 space-y-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Warehouse</Label>
                                                        <Select value={form.destinationWarehouseId} onValueChange={(v) => {
                                                            set("destinationWarehouseId", v)
                                                            set("destinationStorageId", "")
                                                        }}>
                                                            <SelectTrigger className="h-9 border-slate-200"><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                                                            <SelectContent>
                                                                {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Storage Location</Label>
                                                        <Select value={form.destinationStorageId} disabled={!form.destinationWarehouseId} onValueChange={(v) => set("destinationStorageId", v)}>
                                                            <SelectTrigger className="h-9 border-slate-200"><SelectValue placeholder="Select storage" /></SelectTrigger>
                                                            <SelectContent>
                                                                {destWarehouse?.locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-8">
                                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calculator className="h-4 w-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Summary</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm">Total items selected:</span>
                                                    <span className="text-lg font-bold text-primary">{form.items?.reduce((a, b) => a + (b.quantity || 0), 0) || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <Card className="border-none shadow-sm overflow-hidden">
                            <div className="bg-white px-6">
                                <Label htmlFor="notes">Additional Performance Notes / Remarks</Label>
                                <Textarea id="notes" placeholder="Add any special instructions for the movers..." className="mt-2 min-h-[80px] bg-slate-50/50 border-none" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                            </div>
                        </Card>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 space-y-4 border-t bg-white shrink-0 z-20">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving} className="font-bold">Cancel</Button>
                    <Button onClick={handleSave} disabled={!form.reason || (form.items || []).length === 0 || !form.sourceWarehouseId || !form.destinationWarehouseId || isSaving} className="px-8 font-bold gap-2">
                        {isSaving ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                        ) : (
                            <>{transfer ? "Update Stock" : "Execute Transfer"} <ArrowRight className="h-4 w-4" /></>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
