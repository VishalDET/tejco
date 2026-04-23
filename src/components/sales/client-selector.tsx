"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { clientsApi } from "@/lib/api"
import { Client } from "@/app/stakeholders/clients/types"
import { cn } from "@/lib/utils"

interface ClientSelectorProps {
  selectedClientId?: string
  onSelect: (client: Client) => void
}

export function ClientSelector({ selectedClientId, onSelect }: ClientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  useEffect(() => {
    if (open && clients.length === 0) {
      setIsLoading(true)
      clientsApi.getAll()
        .then(setClients)
        .finally(() => setIsLoading(false))
    }
  }, [open, clients.length])

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (client: Client) => {
    onSelect(client)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedClient ? selectedClient.name : "Select Client / Doctor..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      } />
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Find Client
          </DialogTitle>
        </DialogHeader>
        <div className="p-2">
          <Input
            placeholder="Search by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-72">
          <div className="p-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading clients...</div>
            ) : filteredClients.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No clients found.</div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className={cn(
                    "flex flex-col items-start w-full px-3 py-2 text-sm rounded-md transition-colors",
                    selectedClientId === client.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <div className="font-medium">{client.name}</div>
                  <div className={cn(
                    "text-xs",
                    selectedClientId === client.id ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {client.company}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
