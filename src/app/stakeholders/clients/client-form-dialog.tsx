"use client"

import { useState, useEffect } from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { clientsApi } from "@/lib/api"
import { Loader2, Plus, Trash2, UserPlus, Users, Mail, Phone, Building2, Hospital, Stethoscope, Building, MapPin, Globe, Map } from "lucide-react"
import { Client, ClientContact, ClientBranch, ClientType, Address } from "./types"

const emptyAddress: Address = {
  street1: "",
  street2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India"
}

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
    setForm(client ?? { 
      contacts: [], 
      branches: [], 
      clientType: "Clinic",
      hasBranches: false,
      status: "Lead",
      billingAddress: { ...emptyAddress },
      shippingAddress: { ...emptyAddress }
    })
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

  const addBranch = () => {
    const newBranch: ClientBranch = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      address: { ...emptyAddress },
      contacts: []
    }
    setForm(prev => ({ ...prev, branches: [...(prev.branches || []), newBranch] }))
  }

  const removeBranch = (id: string) => {
    setForm(prev => ({ ...prev, branches: (prev.branches || []).filter(b => b.id !== id) }))
  }

  const updateBranch = (id: string, field: keyof ClientBranch, value: any) => {
    setForm(prev => ({
      ...prev,
      branches: (prev.branches || []).map(b => b.id === id ? { ...b, [field]: value } : b)
    }))
  }

  const addBranchContact = (branchId: string) => {
    const newContact: ClientContact = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      designation: "",
      email: "",
      phone: ""
    }
    setForm(prev => ({
      ...prev,
      branches: (prev.branches || []).map(b => 
        b.id === branchId ? { ...b, contacts: [...(b.contacts || []), newContact] } : b
      )
    }))
  }

  const removeBranchContact = (branchId: string, contactId: string) => {
    setForm(prev => ({
      ...prev,
      branches: (prev.branches || []).map(b => 
        b.id === branchId ? { ...b, contacts: (b.contacts || []).filter(c => c.id !== contactId) } : b
      )
    }))
  }

  const updateBranchContact = (branchId: string, contactId: string, field: keyof ClientContact, value: string) => {
    setForm(prev => ({
      ...prev,
      branches: (prev.branches || []).map(b => 
        b.id === branchId ? { 
          ...b, 
          contacts: (b.contacts || []).map(c => c.id === contactId ? { ...c, [field]: value } : c) 
        } : b
      )
    }))
  }

  const setAddress = (type: "billing" | "shipping", field: keyof Address, value: string) => {
    const addrField = type === "billing" ? "billingAddress" : "shippingAddress"
    setForm(prev => ({
      ...prev,
      [addrField]: { ...(prev[addrField] || emptyAddress), [field]: value }
    }))
  }

  const setBranchAddress = (branchId: string, field: keyof Address, value: string) => {
    setForm(prev => ({
      ...prev,
      branches: (prev.branches || []).map(b => 
        b.id === branchId ? { ...b, address: { ...(b.address || emptyAddress), [field]: value } } : b
      )
    }))
  }

  const handleSave = async () => {
    if (!form.name) return

    setIsSaving(true)
    setError(null)

    try {
      if (!client) {
        // ── CREATE ──
        await clientsApi.create(form)
      } else {
        // ── UPDATE ──
        await clientsApi.update(client.id, form)
      }

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientType">Client Type</Label>
                  <Select value={form.clientType ?? "Clinic"} onValueChange={(v) => set("clientType", v as ClientType)}>
                    <SelectTrigger id="clientType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clinic">Clinic</SelectItem>
                      <SelectItem value="Doctor">Doctor</SelectItem>
                      <SelectItem value="Hospital">Hospital</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Primary Contact Person</Label>
                  <Input id="contactPerson" placeholder="Dr. John Doe" value={form.contactPerson ?? ""} onChange={(e) => set("contactPerson", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="email" className="pl-9" type="email" placeholder="john@example.com" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" className="pl-9" placeholder="+91 99999 99999" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
                  </div>
                </div>
              </div>

              {(form.clientType === "Hospital" || form.clientType === "Clinic") && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex-1">
                    <Label className="text-sm font-bold">Does this {form.clientType.toLowerCase()} have multiple branches?</Label>
                    <p className="text-xs text-muted-foreground">Toggle to add and manage different branch locations.</p>
                  </div>
                  <Button 
                    variant={form.hasBranches ? "default" : "outline"}
                    size="sm"
                    onClick={() => set("hasBranches", !form.hasBranches)}
                  >
                    {form.hasBranches ? "Yes, Manage Branches" : "No Branches"}
                  </Button>
                </div>
              )}
            </div>

            {form.hasBranches && (form.clientType === "Hospital" || form.clientType === "Clinic") && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Branch Locations</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addBranch} className="gap-2">
                      <Plus className="h-4 w-4" /> Add Branch
                    </Button>
                  </div>

                  {(form.branches || []).length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/30">
                      <p className="text-sm">No branches added yet.</p>
                      <Button type="button" variant="link" size="sm" onClick={addBranch}>Click here to add branches</Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(form.branches || []).map((branch) => (
                        <div key={branch.id} className="relative p-5 border rounded-xl bg-slate-50/50 space-y-4 group">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeBranch(branch.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-700">Branch Name</Label>
                            <Input className="h-9" placeholder="e.g. South Mumbai Hub" value={branch.name} onChange={(e) => updateBranch(branch.id, "name", e.target.value)} />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                              <MapPin className="h-3 w-3" /> Branch Address
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                              <Input className="h-8 text-xs col-span-2" placeholder="Street Address 1" value={branch.address?.street1 || ""} onChange={(e) => setBranchAddress(branch.id, "street1", e.target.value)} />
                              <Input className="h-8 text-xs col-span-2" placeholder="Street Address 2 (Optional)" value={branch.address?.street2 || ""} onChange={(e) => setBranchAddress(branch.id, "street2", e.target.value)} />
                              <Input className="h-8 text-xs" placeholder="City" value={branch.address?.city || ""} onChange={(e) => setBranchAddress(branch.id, "city", e.target.value)} />
                              <Input className="h-8 text-xs" placeholder="State" value={branch.address?.state || ""} onChange={(e) => setBranchAddress(branch.id, "state", e.target.value)} />
                              <Input className="h-8 text-xs" placeholder="Pincode" value={branch.address?.pincode || ""} onChange={(e) => setBranchAddress(branch.id, "pincode", e.target.value)} />
                              <Input className="h-8 text-xs" placeholder="Country" value={branch.address?.country || "India"} onChange={(e) => setBranchAddress(branch.id, "country", e.target.value)} />
                            </div>
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-bold text-slate-700">Branch Contacts</Label>
                              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-primary" onClick={() => addBranchContact(branch.id)}>
                                + Add Contact
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {(branch.contacts || []).map(contact => (
                                <div key={contact.id} className="grid grid-cols-2 gap-2 p-3 bg-white border rounded-lg relative group/contact">
                                   <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white border shadow-sm opacity-0 group-contact-hover:opacity-100"
                                    onClick={() => removeBranchContact(branch.id, contact.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                  <Input className="h-7 text-[10px]" placeholder="Name" value={contact.name} onChange={(e) => updateBranchContact(branch.id, contact.id, "name", e.target.value)} />
                                  <Input className="h-7 text-[10px]" placeholder="Title" value={contact.designation} onChange={(e) => updateBranchContact(branch.id, contact.id, "designation", e.target.value)} />
                                  <Input className="h-7 text-[10px]" placeholder="Email" value={contact.email} onChange={(e) => updateBranchContact(branch.id, contact.id, "email", e.target.value)} />
                                  <Input className="h-7 text-[10px]" placeholder="Phone" value={contact.phone} onChange={(e) => updateBranchContact(branch.id, contact.id, "phone", e.target.value)} />
                                </div>
                              ))}
                              {branch.contacts?.length === 0 && (
                                <p className="text-[10px] text-center text-slate-400 italic py-2">No branch specific contacts.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Addresses */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Address Management</h3>
              
              {/* Billing Address */}
              <div className="p-4 border rounded-xl bg-slate-50/30 space-y-4">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Building2 className="h-3 w-3" /> Billing Address
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input className="h-9 col-span-2" placeholder="Street Address 1" value={form.billingAddress?.street1 || ""} onChange={(e) => setAddress("billing", "street1", e.target.value)} />
                  <Input className="h-9 col-span-2" placeholder="Street Address 2 (Optional)" value={form.billingAddress?.street2 || ""} onChange={(e) => setAddress("billing", "street2", e.target.value)} />
                  <Input className="h-9" placeholder="City" value={form.billingAddress?.city || ""} onChange={(e) => setAddress("billing", "city", e.target.value)} />
                  <Input className="h-9" placeholder="State" value={form.billingAddress?.state || ""} onChange={(e) => setAddress("billing", "state", e.target.value)} />
                  <Input className="h-9" placeholder="Pincode" value={form.billingAddress?.pincode || ""} onChange={(e) => setAddress("billing", "pincode", e.target.value)} />
                  <Input className="h-9" placeholder="Country" value={form.billingAddress?.country || "India"} onChange={(e) => setAddress("billing", "country", e.target.value)} />
                </div>
                <Button variant="link" size="sm" className="h-auto p-0 text-[10px] h-6" onClick={() => set("shippingAddress", { ...(form.billingAddress || emptyAddress) })}>
                  Copy to Shipping Address
                </Button>
              </div>

              {/* Shipping Address */}
              <div className="p-4 border rounded-xl bg-slate-50/30 space-y-4">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Shipping Address
                </Label>
                <div className="grid grid-cols-2 gap-3">
                   <Input className="h-9 col-span-2" placeholder="Street Address 1" value={form.shippingAddress?.street1 || ""} onChange={(e) => setAddress("shipping", "street1", e.target.value)} />
                  <Input className="h-9 col-span-2" placeholder="Street Address 2 (Optional)" value={form.shippingAddress?.street2 || ""} onChange={(e) => setAddress("shipping", "street2", e.target.value)} />
                  <Input className="h-9" placeholder="City" value={form.shippingAddress?.city || ""} onChange={(e) => setAddress("shipping", "city", e.target.value)} />
                  <Input className="h-9" placeholder="State" value={form.shippingAddress?.state || ""} onChange={(e) => setAddress("shipping", "state", e.target.value)} />
                  <Input className="h-9" placeholder="Pincode" value={form.shippingAddress?.pincode || ""} onChange={(e) => setAddress("shipping", "pincode", e.target.value)} />
                  <Input className="h-9" placeholder="Country" value={form.shippingAddress?.country || "India"} onChange={(e) => setAddress("shipping", "country", e.target.value)} />
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
