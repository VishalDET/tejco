
import { useState, useEffect } from "react"
import { Client } from "../types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Phone, MapPin, ReceiptText, Hash, Building, ExternalLink, Users as UsersIcon, Pencil, Globe, Trash2, Loader2, ShoppingBag, Eye, Calendar, FileText, Stethoscope } from "lucide-react"
import type { Address } from "../types"
import { ClientFormDialog } from "../client-form-dialog"
import { clientsApi, salesOrderApi, creditNoteApi, productsApi } from "@/lib/api"
import { mapApiSalesOrder, Order, OrderStatus } from "@/app/sales/orders/types"

const productDetailsCache = new Map<string, any>()
import type { CreditNote } from "@/app/goods-return/credit-notes/types"
import { CreditNoteDetailsDialog } from "@/app/goods-return/credit-notes/credit-note-details-dialog"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { toast } from "sonner"
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

const MONTHS = [
  { value: "all", label: "All Months" },
  { value: "1", label: "January" }, { value: "2", label: "February" },
  { value: "3", label: "March" }, { value: "4", label: "April" },
  { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" },
  { value: "9", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
]

const currentYear = new Date().getFullYear()
const YEARS = [
  { value: "all", label: "All Years" },
  ...Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - i
    return { value: String(y), label: String(y) }
  }),
]

interface Props {
  client: Client
  allDeliveries?: any[]
}

export function ClientDetailsView({ client }: Props) {
  const navigate = useNavigate()
  const [localClient, setLocalClient] = useState<Client>(client)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Orders State
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [orderMonth, setOrderMonth] = useState("all")
  const [orderYear, setOrderYear] = useState("all")

  // Credit Notes State
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [isLoadingCreditNotes, setIsLoadingCreditNotes] = useState(false)
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNote | null>(null)
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false)

  useEffect(() => {
    if (!localClient?.id) return
    let active = true
    setIsLoadingOrders(true)

    salesOrderApi
      .getAll({ ClientId: localClient.id, PageSize: 100 })
      .then((res: any) => {
        if (!active) return
        let list: any[] = []
        if (Array.isArray(res)) {
          list = res
        } else if (res?.data && Array.isArray(res.data)) {
          list = res.data
        } else if (res?.items && Array.isArray(res.items)) {
          list = res.items
        }

        const mapped = list.map((item) => mapApiSalesOrder(item))
        setOrders(mapped)

        // Find all unique productIds from order items that need product details
        const productIdsToFetch = Array.from(
          new Set(
            mapped
              .flatMap((o) => o.items || [])
              .map((it) => String(it.productId))
              .filter((pId) => pId && pId !== "0" && pId !== "undefined" && pId !== "null")
          )
        )

        if (productIdsToFetch.length > 0) {
          Promise.allSettled(
            productIdsToFetch.map(async (pId) => {
              if (productDetailsCache.has(pId)) return productDetailsCache.get(pId)
              try {
                const res = await productsApi.getById(pId)
                const prod = res?.data || res
                if (prod && (prod.productName || prod.name || prod.productId)) {
                  productDetailsCache.set(pId, prod)
                  return prod
                }
              } catch (e) {
                // Ignore failure for individual products
              }
              return null
            })
          ).then(() => {
            if (!active) return
            setOrders((prevOrders) =>
              prevOrders.map((ord) => ({
                ...ord,
                items: (ord.items || []).map((it) => {
                  const pId = String(it.productId)
                  const prod = productDetailsCache.get(pId)
                  if (prod) {
                    const resolvedName = prod.productName || prod.name || it.productName
                    const defaultVariant = Array.isArray(prod.variants) && prod.variants.length > 0
                      ? (it.variantId ? prod.variants.find((v: any) => String(v.variantId) === String(it.variantId)) || prod.variants[0] : prod.variants[0])
                      : null
                    const variantName = defaultVariant?.variantName || prod.variantName || ""
                    const resolvedSku = it.sku || (defaultVariant ? `${prod.baseSKU || ""}${defaultVariant.skuSuffix || ""}` : prod.baseSKU) || ""

                    return {
                      ...it,
                      productName: resolvedName || it.productName,
                      name: it.name || variantName || resolvedName,
                      sku: resolvedSku || it.sku,
                      imageUrl: it.imageUrl || defaultVariant?.variantImage || prod.imageUrl || prod.image || "",
                    }
                  }
                  return it
                }),
              }))
            )
          })
        }
      })
      .catch((err) => {
        console.error("Failed to load client sales orders:", err)
      })
      .finally(() => {
        if (active) setIsLoadingOrders(false)
      })

    return () => {
      active = false
    }
  }, [localClient?.id])

  useEffect(() => {
    if (!localClient?.id) return
    let active = true
    setIsLoadingCreditNotes(true)

    creditNoteApi
      .getByClient(localClient.id)
      .then((res: any) => {
        if (!active) return
        const list = Array.isArray(res)
          ? res
          : (res?.data && Array.isArray(res.data) ? res.data : [])
        setCreditNotes(list)
      })
      .catch((err) => {
        console.error("Failed to load client credit notes:", err)
      })
      .finally(() => {
        if (active) setIsLoadingCreditNotes(false)
      })

    return () => {
      active = false
    }
  }, [localClient?.id])

  const handleViewCreditNote = async (cn: CreditNote) => {
    try {
      const res = await creditNoteApi.getById(cn.creditNoteId)
      const data = res?.data || res
      if (data && typeof data === "object" && !data.error) {
        setSelectedCreditNote({ ...cn, ...data })
      } else {
        setSelectedCreditNote(cn)
      }
    } catch {
      setSelectedCreditNote(cn)
    }
    setIsCreditNoteModalOpen(true)
  }

  const handleDeleteClient = async () => {
    try {
      setIsDeleting(true)
      await clientsApi.remove(localClient.id)
      toast.success(`Client "${localClient.name}" deleted successfully`)
      navigate("/stakeholders/clients")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete client")
      setIsDeleting(false)
    }
  }

  // Filter Orders by month/year
  const filteredOrders = orders.filter((o) => {
    if (!o || !o.date) return false
    const date = new Date(o.date)
    if (isNaN(date.getTime())) return true
    const matchMonth = orderMonth === "all" || date.getMonth() + 1 === parseInt(orderMonth)
    const matchYear = orderYear === "all" || date.getFullYear() === parseInt(orderYear)
    return matchMonth && matchYear
  })

  const totalOrderRevenue = filteredOrders.reduce((sum, o) => sum + (o?.totalAmount || 0), 0)

  const handleSave = async (updatedData: Partial<Client>) => {
    try {
      const refreshed = await clientsApi.getById(localClient.id)
      setLocalClient(refreshed)
      setIsEditDialogOpen(false)
      navigate(0)
    } catch (e) {
      console.error("Refetch failed:", e)
      setLocalClient(prev => ({ ...prev, ...updatedData } as Client))
      setIsEditDialogOpen(false)
    }
  }

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-none font-semibold text-[10px]">Pending</Badge>
      case "Approved":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-semibold text-[10px]">Approved</Badge>
      case "Packed":
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-none font-semibold text-[10px]">Packed</Badge>
      case "Dispatched":
        return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none font-semibold text-[10px]">Dispatched</Badge>
      case "Delivered":
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold text-[10px]">Delivered</Badge>
      case "Cancelled":
        return <Badge variant="destructive" className="font-semibold text-[10px]">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">Paid</Badge>
      case "Partial":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">Partial</Badge>
      case "Unpaid":
      default:
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">Unpaid</Badge>
    }
  }

  const getCreditNoteStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold text-[10px]">Approved</Badge>
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-semibold text-[10px]">Pending</Badge>
      case "processed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-semibold text-[10px]">Processed</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none font-semibold text-[10px]">Rejected</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">{status || "Pending"}</Badge>
    }
  }

  const formatAddress = (addr: Address | string | undefined): string => {
    if (!addr) return "Not provided"
    if (typeof addr === "string") return addr
    const parts = [
      addr.street1,
      addr.street2,
      addr.city,
      addr.state,
      addr.pincode,
      addr.country
    ].filter(p => !!p && p.trim() !== "")
    return parts.length > 0 ? parts.join(", ") : "Empty address"
  }

  const safeContacts = Array.isArray(localClient?.contacts) ? localClient.contacts : []
  const safeBranches = Array.isArray(localClient?.branches) ? localClient.branches : []

  const formatDateSafely = (dateStr: any) => {
    if (!dateStr) return "N/A"
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB")
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/stakeholders/clients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{localClient?.name || "Client Details"}</h1>
              <Badge variant={localClient?.status === "Active" ? "default" : localClient?.status === "Lead" ? "secondary" : "outline"} className="rounded-full">
                {localClient?.status || "N/A"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5 px-2 bg-primary/5 border-primary/20">
                {localClient?.clientType ? localClient.clientType : "N/A"}
              </Badge>
              {localClient?.doctorSpeciality && (
                <Badge variant="secondary" className="text-[10px] font-semibold h-5 px-2 bg-emerald-50 text-emerald-700 border-emerald-200 border flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" />
                  {localClient.doctorSpeciality}
                </Badge>
              )}
              {localClient?.company && localClient.company !== localClient.name && (
                <span className="text-sm text-muted-foreground font-medium">({localClient.company})</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGuard permission="Clients.Delete">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
            >
              <Trash2 className="h-4 w-4" /> Delete Client
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="Clients.Edit">
            <Button onClick={() => setIsEditDialogOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
              <Pencil className="h-4 w-4" /> Edit Profile
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          {/* Profile Info */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
              <CardDescription>Primary contact: {localClient?.contactPerson || localClient?.name || "N/A"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {localClient?.doctorSpeciality && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 shrink-0 text-emerald-600">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Doctor Speciality</p>
                    <p className="text-sm font-semibold text-foreground">{localClient.doctorSpeciality}</p>
                  </div>
                </div>
              )}
              {localClient?.email && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${localClient.email}`} className="text-sm text-blue-600 hover:underline break-all">{localClient.email}</a>
                  </div>
                </div>
              )}
              {localClient?.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <a href={`tel:${localClient.phone}`} className="text-sm text-blue-600 hover:underline">{localClient.phone}</a>
                  </div>
                </div>
              )}
              
              <Separator />
              
                <div className="space-y-6 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                      <ReceiptText className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Billing Address</p>
                      <p className="text-sm leading-relaxed text-slate-700">{formatAddress(localClient?.billingAddress)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                      <MapPin className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Shipping Address</p>
                      <p className="text-sm leading-relaxed text-slate-700">{formatAddress(localClient?.shippingAddress)}</p>
                    </div>
                  </div>
                </div>

                {localClient?.gstin && (
                  <>
                    <Separator className="bg-slate-100" />
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                        <Hash className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">GSTIN Number</p>
                        <p className="text-sm font-mono font-black text-slate-700 uppercase tracking-tighter">{localClient.gstin}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Profile Meta */}
            <Card>
              <CardContent className="p-4 flex items-center justify-between bg-slate-50/50 rounded-xl">
                 <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-full bg-white border shadow-sm flex items-center justify-center">
                     <Building className="h-3.5 w-3.5 text-slate-400" />
                   </div>
                   <div>
                     <p className="text-[9px] uppercase font-black text-slate-400">System UID</p>
                     <p className="text-[11px] font-mono text-slate-600 tracking-tight">{localClient?.id || "N/A"}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-[9px] uppercase font-black text-slate-400">Status Since</p>
                   <p className="text-[11px] font-medium text-slate-600">{formatDateSafely(localClient?.joinedDate)}</p>
                 </div>
              </CardContent>
            </Card>


          {/* Additional Contact Persons */}
          {safeContacts.length > 0 && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Associated Contact Persons
                </CardTitle>
                <CardDescription>{safeContacts.length} people linked to this account</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {safeContacts.map((c, index) => (
                    <div key={c?.id || index} className="p-4 space-y-2 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{c?.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{c?.designation || ""}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-1">
                        {c?.email && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${c.email}`}>{c.email}</a>
                          </div>
                        )}
                        {c?.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${c.phone}`} className="hover:text-blue-600 hover:underline">{c.phone}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Delivery History AND Branches */}
        <div className="md:col-span-2 space-y-6">
          {/* Branch Information */}
          {localClient?.hasBranches && safeBranches.length > 0 && (
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                       <Building className="h-5 w-5 text-primary" /> Branch Network
                    </CardTitle>
                    <CardDescription>Registered branches for this healthcare provider.</CardDescription>
                  </div>
                  <Badge variant="default" className="rounded-full px-4 h-6 text-[10px] font-bold">
                    {safeBranches.length} Locations
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y border-t bg-white">
                  {safeBranches.map((branch, bIdx) => {
                    const branchContacts = Array.isArray(branch?.contacts) ? branch.contacts : []
                    return (
                      <div key={branch?.id || bIdx} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded-md">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <h4 className="font-bold text-sm text-slate-800">{branch?.name || "Branch"}</h4>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 leading-relaxed px-1">
                            {formatAddress(branch?.address)}
                          </p>
                          
                          {branchContacts.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {branchContacts.map((bc, cIdx) => (
                                <Badge key={bc?.id || cIdx} variant="outline" className="text-[9px] py-0 px-2 h-5 bg-white font-medium border-slate-200">
                                  {bc?.name || "Contact"} ({bc?.phone || bc?.email || "N/A"})
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs for Order History & Credit Note History */}
          <Tabs defaultValue="orders" className="w-full space-y-4">
            <TabsList className="bg-slate-100 p-1 border border-slate-200/80 rounded-lg h-auto gap-1">
              <TabsTrigger
                value="orders"
                className="gap-2 px-4 py-2 text-xs font-semibold data-active:bg-white data-active:text-primary data-active:shadow-sm"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Order History</span>
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 font-bold bg-slate-200/70 text-slate-700">
                  {orders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="credit-notes"
                className="gap-2 px-4 py-2 text-xs font-semibold data-active:bg-white data-active:text-amber-700 data-active:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                <span>Credit Note History</span>
                {creditNotes.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 font-bold bg-amber-100 text-amber-800">
                    {creditNotes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-0">
              <Card className="flex flex-col">
                <CardHeader className="pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-primary" /> Order History
                      </CardTitle>
                      <CardDescription>Sales orders and transaction records for {localClient.name}.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={orderMonth} onValueChange={(val) => setOrderMonth(val || "all")}>
                        <SelectTrigger className="w-[130px] h-9 text-xs">
                          <SelectValue placeholder="Month">
                            {MONTHS.find((m) => m.value === orderMonth)?.label || "Month"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={orderYear} onValueChange={(val) => setOrderYear(val || "all")}>
                        <SelectTrigger className="w-[110px] h-9 text-xs">
                          <SelectValue placeholder="Year">
                            {YEARS.find((y) => y.value === orderYear)?.label || "Year"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {filteredOrders.length > 0 && (
                    <div className="flex gap-10 py-5 mt-4 border-t border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Orders</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{filteredOrders.length}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Value</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-emerald-600">₹</span>
                          <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                            {totalOrderRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0 border-t flex-1">
                  {isLoadingOrders ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">Fetching sales orders...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="pl-6 h-10 text-[10px] font-black uppercase text-slate-400">Order #</TableHead>
                          <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400">Date</TableHead>
                          <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400">Items / Products</TableHead>
                          <TableHead className="text-right h-10 text-[10px] font-black uppercase text-slate-400">Total Amount</TableHead>
                          <TableHead className="text-center h-10 text-[10px] font-black uppercase text-slate-400">Payment</TableHead>
                          <TableHead className="text-center h-10 text-[10px] font-black uppercase text-slate-400">Status</TableHead>
                          <TableHead className="text-right pr-6 h-10 text-[10px] font-black uppercase text-slate-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-44 text-center">
                              <div className="flex flex-col items-center gap-2 opacity-50">
                                <ShoppingBag className="h-10 w-10 text-slate-300" />
                                <p className="text-sm font-medium text-slate-600">No sales orders found for this client.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredOrders.map((order) => {
                            const itemCount = order.items?.length || 0
                            const firstItem = order.items?.[0]
                            const otherItemsCount = itemCount > 1 ? itemCount - 1 : 0

                            return (
                              <TableRow key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                <TableCell className="pl-6 py-4">
                                  <Link
                                    to={`/sales/orders/${order.id}`}
                                    className="font-bold text-sm text-primary hover:underline flex items-center gap-1.5"
                                  >
                                    {order.orderNumber}
                                  </Link>
                                  {order.paymentType && (
                                    <span className="text-[10px] text-muted-foreground">{order.paymentType}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <p className="text-[12px] font-medium text-slate-700">
                                    {formatDateSafely(order.date)}
                                  </p>
                                  {order.deliveryDate && (
                                    <p className="text-[10px] text-muted-foreground">
                                      Est: {formatDateSafely(order.deliveryDate)}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[200px]">
                                  {firstItem ? (
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-semibold text-slate-800 truncate" title={firstItem.productName || firstItem.name || firstItem.sku || "Product"}>
                                        {firstItem.productName || firstItem.name || firstItem.sku || "Product"}
                                        <span className="text-muted-foreground font-normal ml-1">× {firstItem.quantity}</span>
                                      </p>
                                      {otherItemsCount > 0 && (
                                        <p className="text-[10px] text-muted-foreground">
                                          +{otherItemsCount} more item{otherItemsCount > 1 ? "s" : ""}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-black text-sm text-slate-800">
                                  ₹{(order.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getPaymentBadge(order.paymentStatus)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {getOrderStatusBadge(order.status)}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <Link to={`/sales/orders/${order.id}`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credit-notes" className="mt-0">
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-amber-600" /> Credit Note History
                      </CardTitle>
                      <CardDescription>
                        Goods return and credit adjustment vouchers issued for {localClient.name}.
                      </CardDescription>
                    </div>
                    {creditNotes.length > 0 && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-none font-semibold text-xs">
                        {creditNotes.length} Voucher{creditNotes.length === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingCreditNotes ? (
                    <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                      <span>Loading credit notes...</span>
                    </div>
                  ) : creditNotes.length === 0 ? (
                    <div className="text-center py-10 px-4 text-muted-foreground text-sm border-t">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-medium text-slate-700">No credit notes found</p>
                      <p className="text-xs text-slate-500 mt-0.5">No goods returns or credit adjustments on record for this client.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                          <TableHead className="w-[160px] pl-6 font-bold text-xs">Credit Note #</TableHead>
                          <TableHead className="font-bold text-xs">Date Issued</TableHead>
                          <TableHead className="font-bold text-xs">Linked Order</TableHead>
                          <TableHead className="text-right font-bold text-xs">Credit Amount</TableHead>
                          <TableHead className="text-center font-bold text-xs">Status</TableHead>
                          <TableHead className="w-[70px] text-right pr-6 font-bold text-xs">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditNotes.map((cn) => {
                          const dateStr = cn.createdAt
                            ? new Date(cn.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"

                          return (
                            <TableRow key={cn.creditNoteId} className="hover:bg-slate-50/80 transition-colors">
                              <TableCell className="font-bold font-mono text-xs pl-6 text-amber-700">
                                {cn.creditNoteNumber}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600">
                                {dateStr}
                              </TableCell>
                              <TableCell className="text-xs font-mono">
                                {cn.orderNumber ? (
                                  <span className="font-semibold text-slate-800">{cn.orderNumber}</span>
                                ) : cn.orderId ? (
                                  <span className="text-slate-600">SO-{cn.orderId}</span>
                                ) : (
                                  <span className="text-slate-400">Direct Return</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-black text-sm text-slate-800">
                                ₹{(Number(cn.totalCreditAmount) || 0).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-center">
                                {getCreditNoteStatusBadge(cn.status)}
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                  title="View & Print Credit Note"
                                  onClick={() => handleViewCreditNote(cn)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ClientFormDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        client={localClient} 
        onSave={handleSave} 
      />

      <CreditNoteDetailsDialog
        open={isCreditNoteModalOpen}
        onOpenChange={setIsCreditNoteModalOpen}
        creditNote={selectedCreditNote}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open && !isDeleting) setIsDeleteDialogOpen(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{localClient?.name}</strong>? This action cannot be undone and will permanently remove this client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteClient()
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
