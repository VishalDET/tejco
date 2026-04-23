"use client"

import { useState } from "react"
import { Client, ClientDelivery } from "../types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Phone, MapPin, ReceiptText, Hash, Building, ExternalLink, Users as UsersIcon, Pencil, Map, Globe } from "lucide-react"
import type { Address } from "../types"
import { ClientFormDialog } from "../client-form-dialog"
import { clientsApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  allDeliveries: ClientDelivery[]
}

export function ClientDetailsView({ client, allDeliveries }: Props) {
  const router = useRouter()
  const [localClient, setLocalClient] = useState<Client>(client)
  const [month, setMonth] = useState("all")
  const [year, setYear] = useState("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const filteredDeliveries = allDeliveries.filter((d) => {
    const date = new Date(d.date)
    const matchMonth = month === "all" || date.getMonth() + 1 === parseInt(month)
    const matchYear = year === "all" || date.getFullYear() === parseInt(year)
    return matchMonth && matchYear
  })

  const totalSpend = filteredDeliveries.reduce((sum, d) => sum + d.amount, 0)

  const handleSave = async (updatedData: Partial<Client>) => {
    // The dialog handles the actual API call, but we should refresh the local state
    try {
      const refreshed = await clientsApi.getById(localClient.id)
      setLocalClient(refreshed)
      setIsEditDialogOpen(false)
      router.refresh()
    } catch (e) {
      console.error("Refetch failed:", e)
      // Fallback
      setLocalClient(prev => ({ ...prev, ...updatedData } as Client))
      setIsEditDialogOpen(false)
    }
  }

  const deliveryStatusVariant = (status: ClientDelivery["status"]) => {
    switch (status) {
      case "Delivered": return "default"
      case "In Transit": return "secondary"
      case "Processing": return "outline"
      case "Returned": return "destructive"
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

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/stakeholders/clients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{localClient.name}</h1>
              <Badge variant={localClient.status === "Active" ? "default" : localClient.status === "Lead" ? "secondary" : "outline"} className="rounded-full">
                {localClient.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5 px-2 bg-primary/5 border-primary/20">
                {localClient.clientType || "Retail"}
              </Badge>
              {localClient.company && localClient.company !== localClient.name && (
                <span className="text-sm text-muted-foreground font-medium">({localClient.company})</span>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setIsEditDialogOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Pencil className="h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          {/* Profile Info */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
              <CardDescription>Primary contact: {localClient.contactPerson || localClient.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {localClient.email && (
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
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a href={`tel:${localClient.phone}`} className="text-sm text-blue-600 hover:underline">{localClient.phone}</a>
                </div>
              </div>
              
              <Separator />
              
                <div className="space-y-6 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                      <ReceiptText className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Billing Address</p>
                      <p className="text-sm leading-relaxed text-slate-700">{formatAddress(localClient.billingAddress)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                      <MapPin className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Shipping Address</p>
                      <p className="text-sm leading-relaxed text-slate-700">{formatAddress(localClient.shippingAddress)}</p>
                    </div>
                  </div>
                </div>

                {localClient.gstin && (
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
                     <p className="text-[11px] font-mono text-slate-600 tracking-tight">{localClient.id}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-[9px] uppercase font-black text-slate-400">Status Since</p>
                   <p className="text-[11px] font-medium text-slate-600">{new Date(localClient.joinedDate).toLocaleDateString("en-GB")}</p>
                 </div>
              </CardContent>
            </Card>


          {/* Additional Contact Persons */}
          {localClient.contacts && localClient.contacts.length > 0 && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Associated Contact Persons
                </CardTitle>
                <CardDescription>{localClient.contacts.length} people linked to this account</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {localClient.contacts.map((c) => (
                    <div key={c.id} className="p-4 space-y-2 hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.designation}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-1">
                        {c.email && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${c.email}`}>{c.email}</a>
                          </div>
                        )}
                        {c.phone && (
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
          {localClient.hasBranches && localClient.branches && localClient.branches.length > 0 && (
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
                    {localClient.branches.length} Locations
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y border-t bg-white">
                  {localClient.branches.map((branch) => (
                    <div key={branch.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800">{branch.name}</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 leading-relaxed px-1">
                          {formatAddress(branch.address)}
                        </p>
                        
                        {branch.contacts && branch.contacts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {branch.contacts.map(bc => (
                              <Badge key={bc.id} variant="outline" className="text-[9px] py-0 px-2 h-5 bg-white font-medium border-slate-200">
                                {bc.name} ({bc.phone || bc.email || "N/A"})
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery History */}
          <Card className="flex flex-col">
            <CardHeader className="pb-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Delivery History</CardTitle>
                  <CardDescription>Transactional history for {localClient.name}.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={month} onValueChange={(val) => setMonth(val || "all")}>
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={year} onValueChange={(val) => setYear(val || "all")}>
                    <SelectTrigger className="w-[110px] h-9 text-xs">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredDeliveries.length > 0 && (
                <div className="flex gap-10 py-5 mt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Completed Deliveries</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tighter">{filteredDeliveries.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Revenue Contribution</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-emerald-600">₹</span>
                      <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                        {totalSpend.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 border-t flex-1">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="pl-6 h-10 text-[10px] font-black uppercase text-slate-400">Product name</TableHead>
                    <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400">ID / Date</TableHead>
                    <TableHead className="text-right h-10 text-[10px] font-black uppercase text-slate-400">Quantity</TableHead>
                    <TableHead className="text-right h-10 text-[10px] font-black uppercase text-slate-400">Net Amount</TableHead>
                    <TableHead className="text-right pr-6 h-10 text-[10px] font-black uppercase text-slate-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-40">
                           <Map className="h-10 w-10 text-slate-300" />
                           <p className="text-sm font-medium text-slate-600">No matching delivery logs found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDeliveries.map((delivery) => (
                      <TableRow key={delivery.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <p className="font-bold text-sm text-slate-800">{delivery.productName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Batch ID: {delivery.dispatchId}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-[11px] font-bold text-slate-600 uppercase">
                            {new Date(delivery.date).toLocaleDateString("en-GB")}
                          </p>
                          <p className="text-[10px] text-slate-400">Recorded Entry</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-black text-sm">{delivery.quantity}</span>
                          <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{delivery.unit}</span>
                        </TableCell>
                        <TableCell className="text-right font-black text-sm text-slate-700">₹{delivery.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-6">
                           <Badge 
                            variant={deliveryStatusVariant(delivery.status)}
                            className="text-[9px] font-black uppercase rounded-full h-5 px-3"
                           >
                             {delivery.status}
                           </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <ClientFormDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        client={localClient} 
        onSave={handleSave} 
      />
    </div>
  )
}
