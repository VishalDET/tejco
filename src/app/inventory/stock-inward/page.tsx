import * as React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { stockInwardApi } from "@/lib/api"
import type { InwardOrder } from "./types"
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  QrCode,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  MoreVertical
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function StockInwardPage() {
  const navigate = useNavigate()
  const [inwardOrders, setInwardOrders] = useState<InwardOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchInwardOrders = async () => {
    setLoading(true)
    try {
      const res = await stockInwardApi.getAll()
      const data = Array.isArray(res) ? res : (res as any)?.data || []
      setInwardOrders(data)
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch stock inward records")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInwardOrders()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await stockInwardApi.remove(id)
      toast.success("Stock Inward record deleted successfully")
      setInwardOrders(prev => prev.filter(item => item.id !== id))
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete record")
    } finally {
      setDeletingId(null)
    }
  }

  const filteredOrders = inwardOrders.filter(order => {
    const num = order.orderNumber || order.inwardNumber || ""
    const matchesSearch =
      num.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status?.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "received":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20 font-mono">Received</Badge>
      case "verified":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20 font-mono">Verified</Badge>
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20 font-mono">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20 font-mono">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="font-mono">{status || "Draft"}</Badge>
    }
  }

  const pendingCount = inwardOrders.filter(o => o.status === "Pending" || o.status === "Draft").length
  const receivedCount = inwardOrders.filter(o => o.status === "Received").length
  const totalValuation = inwardOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
            <ArrowDownLeft className="h-6 w-6 text-primary" />
            Stock Inward Receipts
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Manage inbound inventory receipts, vendor deliveries, and barcode verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchInwardOrders} className="font-mono text-xs cursor-pointer">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate("/inventory/stock-inward/add")} className="font-mono text-xs cursor-pointer bg-primary text-primary-foreground">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Inward Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1.5 pt-4 px-4 flex flex-row items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Total Receipts</span>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold font-mono">{inwardOrders.length}</div>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">₹{totalValuation.toLocaleString()} total gross valuation</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1.5 pt-4 px-4 flex flex-row items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 font-mono">Pending Verification</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold font-mono text-amber-600">{pendingCount}</div>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">Awaiting barcode/serial scan verification</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border border-border">
          <CardHeader className="pb-1.5 pt-4 px-4 flex flex-row items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 font-mono">Stocked & Received</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold font-mono text-emerald-600">{receivedCount}</div>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">Inventory added to warehouse racks</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Table Section */}
      <Card className="shadow-xs border border-border">
        <CardHeader className="pb-3 pt-4 px-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inward #, vendor, warehouse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs font-mono bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-mono shadow-2xs focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader layout="container" size="md" text="Loading stock inward records..." />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground font-mono text-xs">
              No stock inward records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Inward #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => {
                    const recId = order.inwardOrderId || order.id || 0
                    const orderNum = order.orderNumber || order.inwardNumber || `INW-${recId}`
                    const oDate = order.orderDate || order.inwardDate
                    return (
                      <tr key={recId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-primary">{orderNum}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {oDate ? new Date(oDate).toLocaleDateString("en-IN") : "-"}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">{order.vendorName || `Vendor #${order.vendorId}`}</td>
                        <td className="py-3 px-4 text-muted-foreground">{order.warehouseName || `Warehouse #${order.warehouseId}`}</td>
                        <td className="py-3 px-4">{order.items?.length || 0} SKUs</td>
                        <td className="py-3 px-4">{getStatusBadge(order.status || "Draft")}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-primary hover:bg-primary/10 cursor-pointer"
                              onClick={() => navigate(`/inventory/stock-inward/${recId}`)}
                              title="View & Scan"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:bg-muted cursor-pointer"
                              onClick={() => navigate(`/inventory/stock-inward/${recId}/edit`)}
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Stock Inward Record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete Inward Order <strong>{order.inwardNumber}</strong>? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                                  onClick={() => handleDelete(recId)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
