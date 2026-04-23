"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Filter, MoreVertical, Eye, FileDown, Printer, Edit, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SalesDocument, SalesDocumentStatus } from "../types"
import { ProformaFormDialog } from "./proforma-form-dialog"

const initialProformas: SalesDocument[] = [
  {
    id: "p1",
    number: "PI-2024-5501",
    clientId: "c2",
    clientName: "City Dental Clinic",
    date: "2024-03-05",
    status: "Issued",
    items: [],
    subtotal: 12000,
    taxAmount: 2160,
    totalAmount: 14160,
    billingAddress: "Pune",
    shippingAddress: "Pune",
  }
]

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
  const [proformas, setProformas] = React.useState<SalesDocument[]>(initialProformas)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedProforma, setSelectedProforma] = React.useState<SalesDocument | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("convert") === "true") {
      const sourceData = localStorage.getItem("convert_source_data")
      if (sourceData) {
        const parsed = JSON.parse(sourceData)
        setSelectedProforma(parsed)
        setIsDialogOpen(true)
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname)
        localStorage.removeItem("convert_source_data")
      }
    }
  }, [])

  const handleCreate = () => {
    setSelectedProforma(null)
    setIsDialogOpen(true)
  }

  const handleConvertToOrder = (p: SalesDocument) => {
    // 1. Mark proforma as converted
    setProformas(prev => prev.map(item => 
      item.id === p.id ? { ...item, status: "Converted to Sales Order" } as SalesDocument : item
    ))

    // 2. Store data for sales order pre-fill
    localStorage.setItem("convert_source_data", JSON.stringify({
      ...p,
      sourceId: p.id,
      orderNumber: "", // New number for Sales Order
      status: "Pending",
      paymentStatus: "Unpaid",
      date: new Date().toISOString().split('T')[0]
    }))

    // 3. Redirect to sales orders page
    router.push("/sales/orders?convert=true")
  }

  const handleEdit = (p: SalesDocument) => {
    setSelectedProforma(p)
    setIsDialogOpen(true)
  }

  const handleSave = (data: Partial<SalesDocument>) => {
    if (selectedProforma) {
      setProformas(prev => prev.map(o => o.id === selectedProforma.id ? { ...o, ...data } as SalesDocument : o))
    } else {
      const newPI: SalesDocument = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      } as SalesDocument
      setProformas(prev => [newPI, ...prev])
    }
  }

  const filtered = proformas.filter(o => 
    o.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proforma Invoices</h1>
          <p className="text-muted-foreground">Draft invoices for client approval and advance payment.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 bg-primary">
          <Plus className="h-4 w-4" /> New Proforma
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div>
            <CardTitle className="text-lg">Proforma Records</CardTitle>
            <CardDescription>Track pending approvals and conversions to sales orders.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search proformas..." 
                className="pl-8 w-[250px] border-slate-200" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[150px] font-bold">PI Number</TableHead>
                <TableHead className="font-bold">Client / Doctor</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="text-right font-bold">Total Amount</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                    No proforma invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-primary">{p.number}</TableCell>
                    <TableCell className="font-medium">{p.clientName}</TableCell>
                    <TableCell>{new Date(p.date).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell className="text-right font-bold">₹{p.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4 text-slate-400" /></Button>} />
                        <DropdownMenuContent align="end" className="w-[200px]">
                          <DropdownMenuLabel>Proforma Menu</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(p)} className="gap-2 focus:bg-primary/5">
                            <Edit className="h-4 w-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {p.status !== "Converted to Sales Order" && (
                            <DropdownMenuItem 
                              className="gap-2 text-emerald-600 font-bold focus:bg-emerald-50"
                              onClick={() => handleConvertToOrder(p)}
                            >
                              <ShoppingCart className="h-4 w-4" /> Convert to Order
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => router.push(`/sales/proforma-invoices/${p.id}`)} className="gap-2 focus:bg-primary/5">
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2"><FileDown className="h-4 w-4" /> Download PDF</DropdownMenuItem>
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
