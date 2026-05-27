"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Filter, MoreVertical, Eye, FileDown, Printer, Edit, RefreshCw, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { quotationsApi } from "@/lib/api"
import { SalesDocument, SalesDocumentStatus } from "../types"
import { Quotation } from "./types"
import { QuotationFormDialog } from "./quotation-form-dialog"
import { toast } from "sonner"

const getStatusBadge = (status: SalesDocumentStatus) => {
  switch (status) {
    case "Draft": return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-none">Draft</Badge>
    case "Issued": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none">Issued</Badge>
    case "Converted to Proforma": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none">Converted to Proforma</Badge>
    case "Cancelled": return <Badge variant="destructive">Cancelled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export default function QuotationsPage() {
  const router = useRouter()
  const [quotations, setQuotations] = React.useState<Quotation[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedQuotation, setSelectedQuotation] = React.useState<Quotation | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  const fetchQuotations = async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)
    
    try {
      const data = await quotationsApi.getAll()
      setQuotations(data)
    } catch (error) {
      console.error("Failed to fetch quotations:", error)
      toast.error("Failed to load quotations. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  React.useEffect(() => {
    fetchQuotations()
  }, [])

  const handleCreate = () => {
    setSelectedQuotation(null)
    setIsDialogOpen(true)
  }

  const handleConvertToProforma = async (q: Quotation) => {
    try {
      // Update quotation status in backend
      const payload = {
        quotationId: q.quotationId,
        quotationNumber: q.quotationNumber || q.number,
        quotationDate: new Date(q.date).toISOString(),
        clientName: q.clientName || "",
        clientAddress: q.billingAddress || "",
        clientMobileNo: q.clientMobileNo || "",
        subject: q.subject || "",
        gstinNo: q.gstinNo || "",
        validityDays: q.validityDays || 7,
        deliveryTime: q.deliveryTime || "",
        salesPersonName: q.salesPersonName || "",
        salesPersonCell: q.salesPersonCell || "",
        salesPersonId: q.salesPersonId ? String(q.salesPersonId) : "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "Converted to Proforma",
        items: q.items.map(item => ({
          quotationItemId: isNaN(parseInt(item.id)) ? 0 : parseInt(item.id),
          quotationId: q.quotationId,
          productId: isNaN(parseInt(item.productId)) ? 0 : parseInt(item.productId),
          productName: item.productName || "",
          itemName: item.name || "",
          imageUrl: (item as any).imageUrl || "",
          price: item.unitPrice || 0,
          gstPercentage: item.gstRate || 0,
          quantity: item.quantity || 0,
          discountPercentage: (item as any).discountPercentage || 0,
          discountAmount: (item as any).discountAmount || 0,
        }))
      }
      await quotationsApi.update(String(q.quotationId), payload)
      // Optimistically update local list badge
      setQuotations(prev => prev.map(o => o.id === q.id ? { ...o, status: "Converted to Proforma" } as Quotation : o))
    } catch (err) {
      console.error("Failed to update quotation status on convert:", err)
    }

    localStorage.setItem("convert_source_data", JSON.stringify({
      ...q,
      sourceId: q.id,
      number: "",
      status: "Draft",
      date: new Date().toISOString().split('T')[0]
    }))
    router.push("/sales/proforma-invoices?convert=true")
  }

  const handleEdit = (q: Quotation) => {
    setSelectedQuotation(q)
    setIsDialogOpen(true)
  }

  const handleSave = (data: Partial<Quotation>) => {
    if (selectedQuotation) {
      setQuotations(prev => prev.map(o => o.id === selectedQuotation.id ? { ...o, ...data } as Quotation : o))
    } else {
      const newQuo: Quotation = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      } as Quotation
      setQuotations(prev => [newQuo, ...prev])
    }
    // After saving, we should ideally re-fetch or the dialog should handle the API call
    fetchQuotations(true)
  }

  const filtered = quotations.filter(o => 
    o.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.notes && o.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Quotations</h1>
          <p className="text-muted-foreground">Manage and track product quotations sent to clients.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => fetchQuotations(true)} 
            disabled={isLoading || isRefreshing}
            className="hover:rotate-180 transition-transform duration-500"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button onClick={handleCreate} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
            <Plus className="h-4 w-4" /> Create Quotation
          </Button>
        </div>
      </div>

      <Card className="shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between space-y-0 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">Quotation History</CardTitle>
            <CardDescription>A list of all quotes generated for doctors and hospitals.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search quotations..." 
                className="pl-9 w-[200px] md:w-[300px] bg-white/50 backdrop-blur-sm border-slate-200 focus:bg-white transition-all duration-200" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="md:flex hidden">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[180px] py-4 px-6 font-semibold">Quotation Number</TableHead>
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
                        <Search className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="text-lg font-medium">No quotations found</p>
                      <p className="text-sm">Try adjusting your search or create a new quotation.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((q) => (
                  <TableRow key={q.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                    <TableCell className="font-bold text-primary py-4 px-6">
                      {q.number}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{q.clientName}</span>
                        {q.notes && <span className="text-xs text-muted-foreground line-clamp-1">{q.notes}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">{new Date(q.date).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell className="text-slate-600 font-medium">{q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-GB") : "-"}</TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-slate-900">₹{q.totalAmount.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Incl. GST</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(q.status)}</TableCell>
                    <TableCell className="text-right py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger 
                          render={
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white hover:shadow-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48 shadow-xl border-slate-200">
                          <DropdownMenuLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Management</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(q)} className="gap-2 cursor-pointer">
                            <Edit className="h-4 w-4 text-slate-500" /> Edit Quotation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/sales/quotations/${q.id}`)} className="gap-2 cursor-pointer">
                            <Eye className="h-4 w-4 text-slate-500" /> View Detailed View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs font-bold uppercase text-slate-500 tracking-wider">Operations</DropdownMenuLabel>
                          {q.status !== "Converted to Proforma" && (
                            <DropdownMenuItem 
                              className="gap-2 text-primary font-semibold cursor-pointer focus:text-primary focus:bg-primary/5" 
                              onClick={() => handleConvertToProforma(q)}
                            >
                              <RefreshCw className="h-4 w-4" /> Convert to Proforma
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2 cursor-pointer"><FileDown className="h-4 w-4 text-slate-500" /> Export as PDF</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer"><Printer className="h-4 w-4 text-slate-500" /> Print Document</DropdownMenuItem>
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

      <QuotationFormDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        quotation={selectedQuotation}
        onSave={handleSave}
      />
    </div>
  )
}
