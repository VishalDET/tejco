import { useState, useEffect, useRef } from "react"
import { Check, ChevronsUpDown, Search, User, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { clientsApi } from "@/lib/api"
import { Client } from "@/app/stakeholders/clients/types"
import { ClientFormDialog } from "@/app/stakeholders/clients/client-form-dialog"
import { cn } from "@/lib/utils"

interface ClientSelectorProps {
  selectedClientId?: string
  selectedClientName?: string
  onSelect: (client: Client) => void
}

export function ClientSelector({ selectedClientId, selectedClientName, onSelect }: ClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [fetchedSelectedClient, setFetchedSelectedClient] = useState<Client | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const selectedClient = 
    clients.find((c) => 
      String(c.id) === String(selectedClientId) || 
      (selectedClientName && c.name?.toLowerCase().trim() === selectedClientName.toLowerCase().trim())
    ) || fetchedSelectedClient

  // Fetch client if selectedClientId is provided but not in state
  useEffect(() => {
    if (selectedClientId && !selectedClient && selectedClientId !== "0") {
      clientsApi.getById(selectedClientId)
        .then((c) => {
          if (c && c.name) setFetchedSelectedClient(c)
        })
        .catch(() => {})
    }
  }, [selectedClientId, selectedClient])

  const fetchClients = async (query: string) => {
    setIsLoading(true)
    try {
      const res = await clientsApi.getAll({
        pageNumber: 1,
        pageSize: 10,
        sortBy: "ClientId",
        sortDir: "ASC",
        search: query ? query.trim() : undefined,
        searchBy: "ClientName",
      })
      setClients(res.clients || [])
    } catch (err) {
      console.error("Failed to fetch clients in ClientSelector:", err)
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch initial batch when dialog opens or when search query changes
  useEffect(() => {
    if (!open) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchClients(searchQuery)
    }, 250)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [open, searchQuery])

  const handleSelect = (client: Client) => {
    onSelect(client)
    setFetchedSelectedClient(client)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full flex items-center justify-between font-normal text-left min-w-0 max-w-full overflow-hidden"
        >
          <span className="truncate flex-1 min-w-0 pr-2">
            {selectedClient ? selectedClient.name : (selectedClientName || "Select Client / Doctor...")}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
        </Button>
      } />
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Find Client / Doctor
          </DialogTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 mr-6"
            onClick={(e) => {
              e.stopPropagation()
              setIsCreateOpen(true)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Client
          </Button>
        </DialogHeader>
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-slate-200"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-72">
          <div className="p-1 space-y-1">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Searching clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <span>No clients found for "{searchQuery}".</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-1 text-primary"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create "{searchQuery || "New Client"}"
                </Button>
              </div>
            ) : (
              clients.map((client) => {
                const isSelected = String(selectedClientId) === String(client.id)
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelect(client)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-md transition-colors text-left",
                      isSelected
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-slate-100 text-slate-900"
                    )}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-semibold truncate">{client.name}</div>
                      <div className={cn(
                        "text-xs truncate flex items-center gap-2 mt-0.5",
                        isSelected ? "text-primary-foreground/80" : "text-slate-500"
                      )}>
                        {client.company && client.company !== client.name && (
                          <span>{client.company}</span>
                        )}
                        {client.phone && <span>• {client.phone}</span>}
                        {client.gstin && <span>• GST: {client.gstin}</span>}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
      {isCreateOpen && (
        <ClientFormDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          client={searchQuery ? { name: searchQuery } as any : null}
          onSave={(newClient) => {
            handleSelect(newClient as Client)
            fetchClients(newClient.name || "")
          }}
        />
      )}
    </Dialog>
  )
}
