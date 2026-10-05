import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  FileDown,
  Printer,
  Loader2,
  RefreshCw,
  Calendar,
  X,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  FileText,
  DollarSign,
  AlertCircle,
  Building,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { creditNoteApi } from "@/lib/api"
import type { CreditNote } from "./types"
import { CreditNoteDialog } from "./credit-note-dialog"
import { CreditNoteDetailsDialog } from "./credit-note-details-dialog"

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages]
  }
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages]
}

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedForEdit, setSelectedForEdit] = useState<CreditNote | null>(null)

  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedForView, setSelectedForView] = useState<CreditNote | null>(null)

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCreditNotes = async (page = currentPage, size = pageSize) => {
    try {
      setIsLoading(true)
      const res = await creditNoteApi.getAll({
        PageNumber: page,
        PageSize: size,
        SearchTerm: searchQuery || undefined,
      })

      if (res && res.data && Array.isArray(res.data)) {
        setCreditNotes(res.data)
        setTotalCount(res.totalCount ?? res.data.length)
      } else if (Array.isArray(res)) {
        setCreditNotes(res)
        setTotalCount(res.length)
      } else {
        setCreditNotes([])
        setTotalCount(0)
      }
    } catch (err: any) {
      console.error("Failed to fetch credit notes:", err)
      toast.error(err?.message || "Failed to load credit notes")
      setCreditNotes([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchCreditNotes(currentPage, pageSize)
  }, [currentPage, pageSize])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchCreditNotes(currentPage, pageSize)
  }

  // Filtered by status and search (client-side fallback/refinement)
  const filteredNotes = useMemo(() => {
    return creditNotes.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        (item.creditNoteNumber &&
          item.creditNoteNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.clientName &&
          item.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.orderNumber &&
          item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus =
        statusFilter === "all" ||
        item.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [creditNotes, searchQuery, statusFilter])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Metrics
  const metrics = useMemo(() => {
    const totalAmount = creditNotes.reduce(
      (sum, item) => sum + (Number(item.totalCreditAmount) || 0),
      0
    )
    const pendingCount = creditNotes.filter(
      (c) => c.status?.toLowerCase() === "pending"
    ).length
    const approvedCount = creditNotes.filter(
      (c) => c.status?.toLowerCase() === "approved" || c.status?.toLowerCase() === "processed"
    ).length

    return {
      totalAmount,
      totalNotes: totalCount,
      pendingCount,
      approvedCount,
    }
  }, [creditNotes, totalCount])

  // Open details with fetch fallback
  const handleView = async (note: CreditNote) => {
    try {
      const res = await creditNoteApi.getById(note.creditNoteId)
      const data = res?.data || res
      if (data && typeof data === "object" && !data.error) {
        setSelectedForView({ ...note, ...data })
      } else {
        setSelectedForView(note)
      }
    } catch {
      // If GetById backend bug triggers, fallback to list item
      setSelectedForView(note)
    }
    setIsDetailsOpen(true)
  }

  const handleEdit = async (note: CreditNote) => {
    try {
      const res = await creditNoteApi.getById(note.creditNoteId)
      const data = res?.data || res
      if (data && typeof data === "object" && !data.error) {
        setSelectedForEdit({ ...note, ...data })
      } else {
        setSelectedForEdit(note)
      }
    } catch (err) {
      console.warn("Could not fetch full credit note details for edit:", err)
      setSelectedForEdit(note)
    }
    setIsFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    setIsDeleting(true)
    try {
      await creditNoteApi.delete(deleteConfirmId)
      toast.success("Credit note deleted successfully")
      setDeleteConfirmId(null)
      fetchCreditNotes(currentPage, pageSize)
    } catch (err: any) {
      console.error("Failed to delete credit note:", err)
      toast.error(err?.message || "Failed to delete credit note")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Approved</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">Pending</Badge>
      case "processed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Processed</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Rejected</Badge>
      default:
        return <Badge variant="outline">{status || "Pending"}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Credit Notes</h1>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Goods Return
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage goods return vouchers, return reasons, and issued client credit notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setSelectedForEdit(null)
              setIsFormOpen(true)
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Credit Note
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Credit Notes
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalNotes}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Recorded return vouchers</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Credit Value
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                ₹{metrics.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Value of returned goods</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending Approval
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.pendingCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Awaiting credit note review</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <RotateCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Approved / Processed
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{metrics.approvedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Settled credit notes</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Building className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200/80 shadow-sm">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Note #, Client, Order..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  if (val) setStatusFilter(val)
                }}
              >
                <SelectTrigger className="w-[160px] bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Processed">Processed</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              <p className="text-sm">Loading credit notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-700">No Credit Notes Found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {searchQuery || statusFilter !== "all"
                  ? "No credit notes match the current filter criteria."
                  : "There are currently no goods return credit notes. Click 'New Credit Note' to create one."}
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[160px]">Credit Note #</TableHead>
                    <TableHead className="min-w-[200px]">Client / Clinic</TableHead>
                    <TableHead className="w-[140px]">Sales Order</TableHead>
                    <TableHead className="w-[140px] text-right">Credit Amount</TableHead>
                    <TableHead className="w-[120px] text-center">Status</TableHead>
                    <TableHead className="w-[140px]">Created Date</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.map((note) => (
                    <TableRow key={note.creditNoteId} className="hover:bg-slate-50/70">
                      <TableCell className="font-semibold text-slate-900">
                        <button
                          onClick={() => handleView(note)}
                          className="hover:underline text-amber-700 font-mono text-xs flex items-center gap-1.5"
                        >
                          <FileText className="h-3.5 w-3.5 text-amber-600" />
                          {note.creditNoteNumber}
                        </button>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-slate-800 text-sm">
                          {note.clientName || `Client #${note.clientId}`}
                        </div>
                        <div className="text-[11px] text-slate-400">ID: {note.clientId}</div>
                      </TableCell>

                      <TableCell>
                        {note.orderNumber ? (
                          <Badge variant="outline" className="font-mono text-xs bg-slate-50">
                            {note.orderNumber}
                          </Badge>
                        ) : note.orderId ? (
                          <span className="font-mono text-xs text-slate-600">
                            SO-{note.orderId}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Direct</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-bold text-slate-900">
                        ₹{Number(note.totalCreditAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="text-center">
                        {getStatusBadge(note.status)}
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {note.createdAt
                          ? new Date(note.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleView(note)} className="gap-2 cursor-pointer">
                              <Eye className="h-4 w-4 text-slate-500" />
                              View Voucher
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(note)} className="gap-2 cursor-pointer">
                              <Edit className="h-4 w-4 text-slate-500" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmId(note.creditNoteId)}
                              className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Footer */}
          {!isLoading && totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-slate-50/50">
              <div className="text-xs text-muted-foreground">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{" "}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} credit notes
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                  typeof p === "number" ? (
                    <Button
                      key={idx}
                      variant={currentPage === p ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 text-xs ${
                        currentPage === p ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                      }`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  ) : (
                    <span key={idx} className="px-1 text-slate-400 text-xs">
                      ...
                    </span>
                  )
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <CreditNoteDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        creditNote={selectedForEdit}
        onSuccess={() => fetchCreditNotes(currentPage, pageSize)}
      />

      {/* Details View Dialog */}
      <CreditNoteDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        creditNote={selectedForView}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(deleteConfirmId)}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Credit Note
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this credit note? This action cannot be undone
              and will remove the return record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
