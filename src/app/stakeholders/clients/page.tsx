
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, ExternalLink, Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Client } from "./types"
import { ClientFormDialog } from "./client-form-dialog"
import { clientsApi } from "@/lib/api"

export default function ClientsPage() {
  const navigate = useNavigate()
  const router = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Filter & Pagination state matching API params
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchBy, setSearchBy] = useState("ClientName")
  const [sortBy, setSortBy] = useState("ClientId")
  const [sortDir, setSortDir] = useState("DESC")
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPageNumber(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setFetchError(null)

    clientsApi.getAll({
      pageNumber,
      pageSize,
      sortBy,
      sortDir,
      search: debouncedSearch,
      searchBy,
    })
      .then((res) => {
        if (!cancelled) {
          setClients(res.clients)
          setTotalCount(res.totalCount)
        }
      })
      .catch((err) => {
        if (!cancelled) setFetchError(err instanceof Error ? err.message : "Failed to load clients.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [pageNumber, pageSize, sortBy, sortDir, debouncedSearch, searchBy])

  const handleAdd = () => {
    setSelectedClient(null)
    setIsFormOpen(true)
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
    setTotalCount((prev) => Math.max(0, prev - 1))
  }

  const handleSave = (data: Partial<Client>) => {
    setClients((prev) => {
      if (selectedClient) {
        return prev.map((c) => c.id === selectedClient.id ? { ...c, ...data } as Client : c)
      }
      const newClient: Client = {
        id: `cli-${Math.random().toString(36).substring(2, 9).slice(0, 6)}`,
        joinedDate: new Date().toISOString(),
        name: data.name ?? "",
        contactPerson: data.contactPerson ?? data.name ?? "",
        company: data.company ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        status: data.status ?? "Lead",
        clientType: data.clientType ?? "Clinic",
        hasBranches: data.hasBranches ?? false,
        branches: data.branches ?? [],
        address: data.address ?? "",
        billingAddress: data.billingAddress ?? { street1: data.address ?? "", city: "", state: "", pincode: "", country: "India" },
        shippingAddress: data.shippingAddress ?? { street1: data.address ?? "", city: "", state: "", pincode: "", country: "India" },
        gstin: data.gstin,
        contacts: data.contacts ?? [],
      }
      return [newClient, ...prev]
    })
    setIsFormOpen(false)
  }

  const statusVariant = (status: Client["status"]) => {
    switch (status) {
      case "Active": return "default"
      case "Lead": return "secondary"
      case "Inactive": return "outline"
      default: return "default"
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors / Clients</h1>
          <p className="text-muted-foreground">Manage client relationships and delivery history.</p>
        </div>
        <Button onClick={handleAdd} disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>

      {fetchError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-4 py-2">{fetchError}</p>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search by ${searchBy === "ClientName" ? "Client Name" : searchBy}...`}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Search By:</span>
          <Select value={searchBy} onValueChange={(val) => { if (val) { setSearchBy(val); setPageNumber(1); } }}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Search By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ClientId">Client ID</SelectItem>
              {/* <SelectItem value="ClientName">Client Name</SelectItem> */}
              <SelectItem value="ClinicName">Clinic Name</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="GSTIN">GSTIN</SelectItem>
              <SelectItem value="ContactPerson">Contact Person</SelectItem>
              <SelectItem value="ContactNumber">Contact Number</SelectItem>
              {/* <SelectItem value="InstagramUrl">Instagram URL</SelectItem> */}
              {/* <SelectItem value="DateOfBirth">Date of Birth</SelectItem> */}
              <SelectItem value="Status">Status</SelectItem>
              {/* <SelectItem value="BillingAddress">Billing Address</SelectItem> */}
              {/* <SelectItem value="ShippingAddress">Shipping Address</SelectItem> */}
              {/* <SelectItem value="Contacts">Contacts</SelectItem> */}
              <SelectItem value="Branches">Branches</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Sort By:</span>
          <Select value={sortBy} onValueChange={(val) => { if (val) setSortBy(val); }}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ClientId">Client ID</SelectItem>
              <SelectItem value="ClientName">Name</SelectItem>
              <SelectItem value="Company">Company</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortDir} onValueChange={(val) => { if (val) setSortDir(val); }}>
            <SelectTrigger className="w-[100px] h-9 text-xs">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">DESC</SelectItem>
              <SelectItem value="ASC">ASC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-medium text-muted-foreground">Page Size:</span>
          <Select value={String(pageSize)} onValueChange={(val) => { if (val) { setPageSize(Number(val)); setPageNumber(1); } }}>
            <SelectTrigger className="w-[80px] h-9 text-xs">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Client Info</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Detail</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {searchQuery ? "No clients match your search filter." : "No clients found."}
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <button
                          className="font-bold text-slate-900 hover:text-primary text-left transition-colors text-sm"
                          onClick={() => navigate(`/stakeholders/clients/${client.id}`)}
                        >
                          {client.name}
                        </button>
                        <span className="text-[11px] text-slate-500 font-medium">{client.company}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[10px] font-bold py-0 h-5 border-slate-200">
                          {client.clientType ? client.clientType : "N/A"}
                        </Badge>
                        {client.hasBranches && (
                          <span className="text-[9px] font-black text-primary/70 uppercase">
                            {client.branches?.length || 0} Branches Found
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs gap-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="h-3 w-3" /> {client.phone || "N/A"}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Mail className="h-3 w-3" /> {client.email || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(client.status)}
                        className="rounded-full px-3 text-[10px] font-bold uppercase tracking-wider"
                      >
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/stakeholders/clients/${client.id}`)}>
                            <ExternalLink className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          {!isLoading && totalCount > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <span className="text-xs text-muted-foreground">
                Showing {((pageNumber - 1) * pageSize) + 1} to {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} clients
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                </Button>
                <span className="text-xs font-medium px-2">
                  Page {pageNumber} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                  className="h-8 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={selectedClient}
        onSave={handleSave}
      />
    </div>
  )
}
