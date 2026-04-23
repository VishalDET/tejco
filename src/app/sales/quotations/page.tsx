"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Filter, MoreVertical, Eye, FileDown, Printer, Edit, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SalesDocument, SalesDocumentStatus } from "../types"
import { QuotationFormDialog } from "./quotation-form-dialog"

const initialQuotations: SalesDocument[] = [
  {
    id: "q1",
    number: "QUO-2024-1021",
    clientId: "c1",
    clientName: "Dr. Aris Varma",
    date: "2024-03-01",
    validUntil: "2024-03-15",
    status: "Issued",
    items: [],
    subtotal: 5000,
    taxAmount: 900,
    totalAmount: 5900,
    billingAddress: "Mumbai",
    shippingAddress: "Mumbai",
  }
]

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
  const [quotations, setQuotations] = React.useState<SalesDocument[]>(initialQuotations)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [selectedQuotation, setSelectedQuotation] = React.useState<SalesDocument | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  const handleCreate = () => {
    setSelectedQuotation(null)
    setIsDialogOpen(true)
  }

  const handleConvertToProforma = (q: SalesDocument) => {
    // 1. Mark quotation as converted
    setQuotations(prev => prev.map(item => 
      item.id === q.id ? { ...item, status: "Converted to Proforma" } as SalesDocument : item
    ))

    // 2. Store data for proforma pre-fill
    localStorage.setItem("convert_source_data", JSON.stringify({
      ...q,
      sourceId: q.id,
      number: "", // New number will be generated
      status: "Draft",
      date: new Date().toISOString().split('T')[0]
    }))

    // 3. Redirect to proforma invoices page
    router.push("/sales/proforma-invoices?convert=true")
  }

  const handleEdit = (q: SalesDocument) => {
    setSelectedQuotation(q)
    setIsDialogOpen(true)
  }

  const handleSave = (data: Partial<SalesDocument>) => {
    if (selectedQuotation) {
      setQuotations(prev => prev.map(o => o.id === selectedQuotation.id ? { ...o, ...data } as SalesDocument : o))
    } else {
      const newQuo: SalesDocument = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      } as SalesDocument
      setQuotations(prev => [newQuo, ...prev])
    }
  }

  const filtered = quotations.filter(o => 
    o.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations</h1>
          <p className="text-muted-foreground">Manage and track product quotations sent to clients.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Quotation
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div>
            <CardTitle className="text-lg">Quotation History</CardTitle>
            <CardDescription>A list of all quotes generated for doctors and hospitals.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search quotations..." 
                className="pl-8 w-[250px]" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[150px]">Quo Number</TableHead>
                <TableHead>Client / Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground italic">
                    No quotations found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium text-primary">{q.number}</TableCell>
                    <TableCell>{q.clientName}</TableCell>
                    <TableCell>{new Date(q.date).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell>{q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-GB") : "-"}</TableCell>
                    <TableCell className="text-right font-semibold">₹{q.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(q.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>} />
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Quotation Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(q)} className="gap-2">
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/sales/quotations/${q.id}`)} className="gap-2">
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {q.status !== "Converted to Proforma" && (
                            <DropdownMenuItem 
                              className="gap-2 text-primary font-medium" 
                              onClick={() => handleConvertToProforma(q)}
                            >
                              <RefreshCw className="h-4 w-4" /> Convert to Proforma
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2"><FileDown className="h-4 w-4" /> Export PDF</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2"><Printer className="h-4 w-4" /> Print</DropdownMenuItem>
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
