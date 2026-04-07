"use client"

import { useState } from "react"
import { Client, ClientDelivery } from "../types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, Phone, MapPin, ReceiptText, Hash } from "lucide-react"
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
  const [month, setMonth] = useState("all")
  const [year, setYear] = useState("all")

  const filteredDeliveries = allDeliveries.filter((d) => {
    const date = new Date(d.date)
    const matchMonth = month === "all" || date.getMonth() + 1 === parseInt(month)
    const matchYear = year === "all" || date.getFullYear() === parseInt(year)
    return matchMonth && matchYear
  })

  const totalSpend = filteredDeliveries.reduce((sum, d) => sum + d.amount, 0)

  const deliveryStatusVariant = (status: ClientDelivery["status"]) => {
    switch (status) {
      case "Delivered": return "default"
      case "In Transit": return "secondary"
      case "Processing": return "outline"
      case "Returned": return "destructive"
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/stakeholders/clients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <Badge variant={client.status === "Active" ? "default" : client.status === "Lead" ? "secondary" : "outline"}>
            {client.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          {/* Profile Info */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
              <CardDescription>Primary contact: {client.contactPerson || client.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${client.email}`} className="text-sm text-blue-600 hover:underline break-all">{client.email}</a>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <a href={`tel:${client.phone}`} className="text-sm text-blue-600 hover:underline">{client.phone}</a>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Billing Address</p>
                    <p className="text-sm leading-relaxed">{client.billingAddress || client.address || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Shipping Address</p>
                    <p className="text-sm leading-relaxed">{client.shippingAddress || client.address || "N/A"}</p>
                  </div>
                </div>
              </div>
              {client.gstin && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                    <ReceiptText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">GSTIN</p>
                    <p className="text-sm font-mono">{client.gstin}</p>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted/50 shrink-0">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Client ID</p>
                  <p className="text-sm font-medium font-mono">{client.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Contact Persons */}
          {client.contacts && client.contacts.length > 0 && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Associated Contact Persons
                </CardTitle>
                <CardDescription>{client.contacts.length} people linked to this account</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {client.contacts.map((c) => (
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

        {/* Delivery History with Filters */}
        <Card className="md:col-span-2 flex flex-col">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>Delivery History</CardTitle>
                <CardDescription>Products delivered to {client.company}.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={month} onValueChange={(val) => setMonth(val || "all")}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={year} onValueChange={(val) => setYear(val || "all")}>
                  <SelectTrigger className="w-[110px]">
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
              <div className="flex gap-6 pt-3 border-t mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Deliveries Found</p>
                  <p className="text-2xl font-bold">{filteredDeliveries.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{totalSpend.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Product</TableHead>
                  <TableHead>Dispatch ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No deliveries match the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="pl-6 font-medium">{delivery.productName}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{delivery.dispatchId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(delivery.date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                      </TableCell>
                      <TableCell className="text-right">
                        {delivery.quantity} <span className="text-xs text-muted-foreground">{delivery.unit}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">₹{delivery.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge variant={deliveryStatusVariant(delivery.status)}>{delivery.status}</Badge>
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
  )
}
