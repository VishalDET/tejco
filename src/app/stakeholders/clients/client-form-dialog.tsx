"use client"

import { useState, useEffect } from "react"
import { Client, ClientContact } from "./types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { clientsApi } from "@/lib/api"
import { Loader2, Plus, Trash2, UserPlus, Users } from "lucide-react"

interface ClientFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onSave: (data: Partial<Client>) => void
}

export function ClientFormDialog({ open, onOpenChange, client, onSave }: ClientFormDialogProps) {
  const [form, setForm] = useState<Partial<Client>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(client ?? { contacts: [] })
    setError(null)
  }, [client, open])

  const set = (field: keyof Client, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const addContact = () => {
    const newContact: ClientContact = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      designation: "",
      email: "",
      phone: ""
    }
    setForm(prev => ({ ...prev, contacts: [...(prev.contacts || []), newContact] }))
  }

  const removeContact = (id: string) => {
    setForm(prev => ({ ...prev, contacts: (prev.contacts || []).filter(c => c.id !== id) }))
  }

  const updateContact = (id: string, field: keyof ClientContact, value: string) => {
    setForm(prev => ({
      ...prev,
      contacts: (prev.contacts || []).map(c => c.id === id ? { ...c, [field]: value } : c)
    }))
  }

  const handleSave = async () => {
    if (!form.name) return

    setIsSaving(true)
    setError(null)

    try {
      if (!client) {
        // ── CREATE: call POST /api/Clients with the required payload ──
        await clientsApi.create({
          clientId: 0,                         // 0 = new record
          clientName: form.name ?? "",
          billingAddress: form.billingAddress || form.address || "",
          shippingAddress: form.shippingAddress || form.address || "",
          gstin: form.gstin ?? "",
          contactPerson: form.contactPerson || form.name || "",
          contactNumber: form.phone ?? "",
        })
      }
      // TODO: wire PUT /api/Clients/{id} for edit once backend is ready

      onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {client ? "Edit Client Profile" : "Create New Client"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <div className="space-y-6 pb-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Entity Name *</Label>
                  <Input id="name" placeholder="Tejco Healthcare" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Short Name / Alias</Label>
                  <Input id="company" placeholder="Tejco" value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input id="gstin" placeholder="22AAAAA0000A1Z5" value={form.gstin ?? ""} onChange={(e) => set("gstin", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Client Status</Label>
                  <Select value={form.status ?? "Lead"} onValueChange={(v) => v && set("status", v)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Addresses */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Addresses</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Textarea id="billingAddress" placeholder="Full billing address..." rows={2} value={form.billingAddress ?? form.address ?? ""} onChange={(e) => set("billingAddress", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Textarea id="shippingAddress" placeholder="Full shipping address..." rows={2} value={form.shippingAddress ?? form.address ?? ""} onChange={(e) => set("shippingAddress", e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Persons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Persons</h3>
                <Button type="button" variant="outline" size="sm" onClick={addContact} className="gap-2">
                  <UserPlus className="h-4 w-4" /> Add Person
                </Button>
              </div>

              {(form.contacts || []).length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/30">
                  <p className="text-sm">No contact persons added yet.</p>
                  <Button type="button" variant="link" size="sm" onClick={addContact} className="mt-1">Add your first contact</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(form.contacts || []).map((contact, index) => (
                    <div key={contact.id} className="relative p-4 border rounded-lg bg-muted/20 space-y-3 group">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Name</Label>
                          <Input className="h-8 text-xs" placeholder="Contact Name" value={contact.name} onChange={(e) => updateContact(contact.id, "name", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Designation</Label>
                          <Input className="h-8 text-xs" placeholder="e.g. Purchase Manager" value={contact.designation} onChange={(e) => updateContact(contact.id, "designation", e.target.value)} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Email</Label>
                          <Input className="h-8 text-xs" type="email" placeholder="email@example.com" value={contact.email} onChange={(e) => updateContact(contact.id, "email", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Phone</Label>
                          <Input className="h-8 text-xs" placeholder="Phone Number" value={contact.phone} onChange={(e) => updateContact(contact.id, "phone", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* API error message */}
            {error && (
              <p className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name || isSaving} className="min-w-[100px]">
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              client ? "Update Profile" : "Create Client"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
