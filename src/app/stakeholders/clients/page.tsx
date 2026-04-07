"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, MoreHorizontal, UserRound, Pencil, Trash2, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setFetchError(null)
    clientsApi.getAll()
      .then((data) => { if (!cancelled) setClients(data) })
      .catch((err) => { if (!cancelled) setFetchError(err instanceof Error ? err.message : "Failed to load clients.") })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = clients.filter((c) => {
    const q = searchQuery.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    )
  })

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
  }

  const handleSave = (data: Partial<Client>) => {
    setClients((prev) => {
      if (selectedClient) {
        return prev.map((c) => c.id === selectedClient.id ? { ...c, ...data } as Client : c)
      }
      const newClient: Client = {
        id: `cli-${crypto.randomUUID().slice(0, 6)}`,
        joinedDate: new Date().toISOString(),
        name: data.name ?? "",
        contactPerson: data.name ?? "",
        company: data.company ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        status: data.status ?? "Lead",
        address: data.address ?? "",
        billingAddress: data.address ?? "",
        shippingAddress: data.address ?? "",
        gstin: data.gstin,
        contacts: [],
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
    }
  }

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

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company or email…"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Client</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-5 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {searchQuery ? "No clients match your search." : "No clients found. Add one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="pl-6 font-medium">
                      <button
                        className="hover:underline hover:text-primary text-left transition-colors"
                        onClick={() => router.push(`/stakeholders/clients/${client.id}`)}
                      >
                        {client.name}
                      </button>
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.company}</TableCell>
                    <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(client.joinedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(client.status)}>{client.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/stakeholders/clients/${client.id}`)}>
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
