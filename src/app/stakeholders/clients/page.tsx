
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Client } from "./types"
import { ClientFormDialog } from "./client-form-dialog"
import { clientsApi } from "@/lib/api"
import { PermissionGuard } from "@/components/auth/permission-guard"

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages]
  }
  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages]
}

export default function ClientsPage() {
  const navigate = useNavigate()
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
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return
    try {
      setIsDeleting(true)
      await clientsApi.remove(clientToDelete.id)
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id))
      setTotalCount((prev) => Math.max(0, prev - 1))
      toast.success(`Client "${clientToDelete.name}" deleted successfully`)
      setClientToDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete client. Please try again.")
    } finally {
      setIsDeleting(false)
    }
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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "ASC" ? "DESC" : "ASC"))
    } else {
      setSortBy(column)
      setSortDir(column === "ClientId" ? "DESC" : "ASC")
    }
    setPageNumber(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors / Clients</h1>
          <p className="text-muted-foreground">Manage client relationships and delivery history.</p>
        </div>
        <PermissionGuard permission="Clients.Create">
          <Button onClick={handleAdd} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </PermissionGuard>
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
          <Select value={sortBy} onValueChange={(val) => { if (val) { setSortBy(val); setPageNumber(1); } }}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ClientId">Client ID</SelectItem>
              <SelectItem value="ClientName">Name</SelectItem>
              <SelectItem value="Company">Company</SelectItem>
              <SelectItem value="Status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortDir} onValueChange={(val) => { if (val) { setSortDir(val); setPageNumber(1); } }}>
            <SelectTrigger className="w-[100px] h-9 text-xs">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">DESC</SelectItem>
              <SelectItem value="ASC">ASC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="pl-6 cursor-pointer select-none hover:text-foreground group"
                  onClick={() => handleSort("ClientId")}
                  title="Click to sort by Client ID"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Client Info</span>
                    {sortBy === "ClientId" || sortBy === "ClientName" ? (
                      sortDir === "ASC" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Detail</TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-foreground group"
                  onClick={() => handleSort("Status")}
                  title="Click to sort by Status"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {sortBy === "Status" ? (
                      sortDir === "ASC" ? (
                        <ArrowUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </TableHead>
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
                        <div className="flex items-center gap-2">
                          <button
                            className="font-bold text-slate-900 hover:text-primary text-left transition-colors text-sm"
                            onClick={() => navigate(`/stakeholders/clients/${client.id}`)}
                          >
                            {client.name}
                          </button>
                          <Badge variant="outline" className="text-[10px] font-mono font-medium text-muted-foreground px-1.5 py-0 h-4 border-slate-200">
                            #{client.id}
                          </Badge>
                        </div>
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
                          <PermissionGuard permission="Clients.Edit">
                            <DropdownMenuItem onClick={() => handleEdit(client)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          </PermissionGuard>
                          <PermissionGuard permission="Clients.Delete">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setClientToDelete(client)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </PermissionGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          {(() => {
            const currentPage = pageNumber
            const startRow = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1
            const endRow = Math.min(pageNumber * pageSize, totalCount)
            const pageNumbers = getPageNumbers(currentPage, totalPages)

            return (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4 border-t text-xs">
                {/* Left side: Item Count & Rows Per Page */}
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground w-full md:w-auto justify-between md:justify-start">
                  <div>
                    Showing <span className="font-semibold text-foreground">{startRow}</span> to{" "}
                    <span className="font-semibold text-foreground">{endRow}</span> of{" "}
                    <span className="font-semibold text-foreground">{totalCount}</span> clients
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">Rows per page</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        if (val) {
                          setPageSize(Number(val))
                          setPageNumber(1)
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[72px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 30, 50, 100].map((size) => (
                          <SelectItem key={size} value={String(size)} className="text-xs">
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right side: Page Navigation */}
                <div className="flex items-center gap-1 sm:gap-1.5 w-full md:w-auto justify-center md:justify-end">
                  {/* Number of Pages Display */}
                  <div className="text-xs text-muted-foreground font-medium mr-2 whitespace-nowrap bg-muted/40 px-2.5 py-1 rounded-md border">
                    Page <span className="font-bold text-foreground">{totalCount === 0 ? 0 : currentPage}</span> of{" "}
                    <span className="font-bold text-foreground">{totalCount === 0 ? 0 : totalPages}</span>
                  </div>

                  {/* First Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPageNumber(1)}
                    disabled={pageNumber <= 1 || isLoading || totalCount === 0}
                    title="First page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                    <span className="sr-only">First page</span>
                  </Button>

                  {/* Previous Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1 || isLoading || totalCount === 0}
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>

                  {/* Direct Page Numbers */}
                  {totalCount > 0 && (
                    <div className="hidden sm:flex items-center gap-1">
                      {pageNumbers.map((p, idx) => {
                        if (p === "...") {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1 text-xs text-muted-foreground select-none"
                            >
                              ...
                            </span>
                          )
                        }
                        const pageNum = p as number
                        const isSelected = pageNum === currentPage
                        return (
                          <Button
                            key={pageNum}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            disabled={isLoading}
                            className={`h-8 min-w-[32px] px-2 text-xs font-medium transition-all ${
                              isSelected
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs font-semibold"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => setPageNumber(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  {/* Next Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                    disabled={pageNumber >= totalPages || isLoading || totalCount === 0}
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>

                  {/* Last Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPageNumber(totalPages)}
                    disabled={pageNumber >= totalPages || isLoading || totalCount === 0}
                    title="Last page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Last page</span>
                  </Button>
                </div>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={selectedClient}
        onSave={handleSave}
      />

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => { if (!open && !isDeleting) setClientToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{clientToDelete?.name}</strong>? This action cannot be undone and will permanently remove this client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setClientToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
