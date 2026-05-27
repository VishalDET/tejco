"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, MoreVertical, Eye, FileDown, Printer, Edit, ShoppingCart, RefreshCw, Loader2, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { SalesDocumentStatus } from "../types"
import { ProformaInvoice } from "./types"
import { ProformaFormDialog } from "./proforma-form-dialog"
import { proformaApi } from "@/lib/api"
import { toast } from "sonner"

const getStatusBadge = (status: SalesDocumentStatus) => {
  switch (status) {
    case "Draft": return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-none">Draft</Badge>
    case "Issued": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">Issued</Badge>
    case "Converted to Sales Order": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Converted to Order</Badge>
    case "Cancelled": return <Badge variant="destructive">Cancelled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export default function ProformaInvoicesPage() {
  const router = useRouter()
  const [proformas, setProformas] = React.useState<ProformaInvoice[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedProforma, setSelectedProforma] = React.useState<ProformaInvoice | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  const fetchProformas = async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      const data = await proformaApi.getAll()
      setProformas(data)
    } catch (error) {
      console.error("Failed to fetch proforma invoices:", error)
      toast.error("Failed to load proforma invoices.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  React.useEffect(() => {
    fetchProformas()
  }, [])

  // Handle incoming conversion from a quotation
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("convert") === "true") {
      const sourceData = localStorage.getItem("convert_source_data")
      if (sourceData) {
        try {
          const parsed = JSON.parse(sourceData)
          // Map quotation fields to proforma fields
          const prefilled: Partial<ProformaInvoice> = {
            ...parsed,
            proformaId: 0,
            number: `PI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split("T")[0],
            status: "Draft",
            sourceQuotationId: parsed.id || parsed.sourceId,
          }
          setSelectedProforma(prefilled as ProformaInvoice)
          setIsDialogOpen(true)
        } catch (e) {
          console.error("Failed to parse convert source data:", e)
        }
        window.history.replaceState({}, "", window.location.pathname)
        localStorage.removeItem("convert_source_data")
      }
    }
  }, [])

  const handleCreate = () => {
    setSelectedProforma(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (p: ProformaInvoice) => {
    setSelectedProforma(p)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    fetchProformas(true)
  }

  const handleConvertToOrder = async (p: ProformaInvoice) => {
    try {
      const payload = {
        proformaInvoiceId: p.proformaId,
        piNo: p.proformaNumber || "",
        piDate: new Date(p.date || new Date()).toISOString(),
        billingName: p.clientName || "",
        billingAddress: p.billingAddress || "",
        freight: p.freight || 0,
        totalAmount: p.totalAmount || 0,
        deliveryTerms: p.deliveryTerms || p.deliveryTime || "10-15 Working Days",
        paymentTerms: p.paymentTerms || p.notes || "",
        salesPersonName: p.salesPersonName || "",
        salesPersonCell: p.salesPersonCell || "",
        salesPersonId: p.salesPersonId ? String(p.salesPersonId) : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "Converted to Sales Order",
        items: (p.items || []).map(item => ({
          proformaInvoiceItemId: isNaN(parseInt(item.id)) ? 0 : parseInt(item.id),
          proformaInvoiceId: p.proformaId,
          productId: isNaN(parseInt(item.productId)) ? 0 : parseInt(item.productId),
          productName: item.productName || "",
          imageUrl: (item as any).imageUrl || "",
          quantity: item.quantity || 0,
          rate: item.unitPrice || 0,
          discountPercentage: (item as any).discountPercentage || 0,
          discountAmount: (item as any).discountAmount || 0,
          total: item.total || 0,
        })),
      }
      await proformaApi.update(String(p.proformaId), payload)
      setProformas(prev => prev.map(o => o.id === p.id ? { ...o, status: "Converted to Sales Order" } as ProformaInvoice : o))
      toast.success("Proforma invoice converted successfully.")
    } catch (err) {
      console.error("Failed to update proforma status:", err)
    }

    localStorage.setItem("convert_source_data", JSON.stringify({
      ...p,
      sourceId: p.id,
      number: "",
      status: "Pending",
      paymentStatus: "Unpaid",
      date: new Date().toISOString().split("T")[0],
    }))
    router.push("/sales/orders?convert=true")
  }

  const handleDelete = async (p: ProformaInvoice) => {
    if (!confirm(`Delete proforma ${p.number}?`)) return
    try {
      await proformaApi.remove(String(p.proformaId))
      toast.success("Proforma invoice deleted.")
      fetchProformas(true)
    } catch {
      toast.error("Failed to delete proforma invoice.")
    }
  }

  const filtered = proformas.filter(p => {
    const num = (p.number ?? "").toLowerCase()
    const name = (p.clientName ?? "").toLowerCase()
    const q = searchQuery.toLowerCase()
    return num.includes(q) || name.includes(q)
  })

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Proforma Invoices
          </h1>
          <p className="text-muted-foreground">Draft invoices for client approval and advance payment.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchProformas(true)}
            disabled={isLoading || isRefreshing}
            className="hover:rotate-180 transition-transform duration-500"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button onClick={handleCreate} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
            <Plus className="h-4 w-4" /> New Proforma
          </Button>
        </div>
      </div>

      <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between space-y-0 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">Proforma Records</CardTitle>
            <CardDescription>Track pending approvals and conversions to sales orders.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search proformas..."
                className="pl-9 w-[200px] md:w-[300px] bg-white/50 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] py-4 px-6 font-semibold">PI Number</TableHead>
                <TableHead className="py-4 font-semibold">Client / Doctor</TableHead>
                <TableHead className="py-4 font-semibold">Date</TableHead>
                <TableHead className="py-4 font-semibold">Validity</TableHead>
                <TableHead className="text-right py-4 font-semibold">Total Amount</TableHead>
                <TableHead className="py-4 font-semibold">Status</TableHead>
                <TableHead className="text-right py-4 px-6 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell className="px-6"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="p-4 bg-slate-50 rounded-full mb-2">
                        <Receipt className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="text-lg font-medium">No proforma invoices found</p>
                      <p className="text-sm">Create a new proforma or convert from a quotation.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, idx) => (
                  <TableRow key={p.id || `proforma-${idx}`} className="group hover:bg-slate-50/50 transition-colors duration-200">
                    <TableCell className="font-bold text-primary py-4 px-6">{p.number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{p.clientName}</span>
                        {p.subject && <span className="text-xs text-muted-foreground line-clamp-1">{p.subject}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">{new Date(p.date).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{p.validUntil ? new Date(p.validUntil).toLocaleDateString("en-GB") : "-"}</TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-slate-900">₹{p.totalAmount.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Incl. GST</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white hover:shadow-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-48 shadow-xl border-slate-200">
                          <DropdownMenuLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Management</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(p)} className="gap-2 cursor-pointer">
                            <Edit className="h-4 w-4 text-slate-500" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/sales/proforma-invoices/${p.id}`)} className="gap-2 cursor-pointer">
                            <Eye className="h-4 w-4 text-slate-500" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Operations</DropdownMenuLabel>
                          {p.status !== "Converted to Sales Order" && (
                            <DropdownMenuItem
                              className="gap-2 text-emerald-600 font-semibold cursor-pointer focus:bg-emerald-50"
                              onClick={() => handleConvertToOrder(p)}
                            >
                              <ShoppingCart className="h-4 w-4" /> Convert to Order
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2 cursor-pointer"><FileDown className="h-4 w-4 text-slate-500" /> Export as PDF</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer"><Printer className="h-4 w-4 text-slate-500" /> Print Document</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-destructive cursor-pointer focus:bg-destructive/5"
                            onClick={() => handleDelete(p)}
                          >
                            Delete
                          </DropdownMenuItem>
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

      <ProformaFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        proforma={selectedProforma}
        onSave={handleSave}
      />
    </div>
  )
}
