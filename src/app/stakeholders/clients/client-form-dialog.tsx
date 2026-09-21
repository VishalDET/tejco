
import { useState, useEffect } from "react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { clientsApi } from "@/lib/api"
import { apiClient } from "@/lib/api-client"
import { Loader2, Plus, Trash2, UserPlus, Users, Mail, Phone, Building2, Hospital, Stethoscope, Building, MapPin, Globe, Map, UploadCloud } from "lucide-react"
import { Client, ClientContact, ClientBranch, ClientType, Address, CreateClientPayload } from "./types"
import * as XLSX from "xlsx"
import { toast } from "sonner"

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
  const [countries, setCountries] = useState<any[]>([])

  // Client Excel Import State
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  const downloadTemplate = () => {
    const headers = [
      "Client Name",
      "Short Name / Alias",
      "GSTIN",
      "Client Status",
      "Client Type",
      "Primary Email",
      "Primary Phone",
      "Website",
      "Billing Street 1",
      "Billing Street 2",
      "Billing City",
      "Billing State",
      "Billing Pincode",
      "Billing Country",
      "Shipping Street 1",
      "Shipping Street 2",
      "Shipping City",
      "Shipping State",
      "Shipping Pincode",
      "Shipping Country",
      "Contact Name",
      "Contact Designation",
      "Contact Email",
      "Contact Phone",
      "Branch Name",
      "Branch Street 1",
      "Branch Street 2",
      "Branch City",
      "Branch State",
      "Branch Pincode",
      "Branch Country",
      "Branch Contact Name",
      "Branch Contact Designation",
      "Branch Contact Email",
      "Branch Contact Phone"
    ]

    const sampleRow = [
      "Tejco Healthcare",
      "Tejco",
      "22AAAAA0000A1Z5",
      "Lead",
      "Clinic",
      "info@tejco.com",
      "+91 9876543210",
      "https://tejco.com",
      "123 Main Street",
      "Apt 4B",
      "Mumbai",
      "Maharashtra",
      "400001",
      "India",
      "123 Main Street",
      "Apt 4B",
      "Mumbai",
      "Maharashtra",
      "400001",
      "India",
      "Dr. Ramesh Mehta",
      "Chief Dermatologist",
      "ramesh@tejco.com",
      "+91 9876543211",
      "South Mumbai Branch",
      "456 Link Road",
      "",
      "Mumbai",
      "Maharashtra",
      "400002",
      "India",
      "Amit Shah",
      "Branch Manager",
      "amit@tejco.com",
      "+91 9876543212"
    ]

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Client Template")
    XLSX.writeFile(wb, "Tejco_Client_Import_Template.xlsx")
  }

  const parseExcel = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) return
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<any>(sheet)
        if (rows.length === 0) {
          toast.error("The Excel sheet has no data.")
          return
        }

        const firstRow = rows[0]
        const clientName = firstRow["Client Name"] || firstRow["Entity Name"] || ""
        const shortName = firstRow["Short Name / Alias"] || firstRow["Short Name"] || ""
        const gstin = firstRow["GSTIN"] || ""
        const clientStatus = firstRow["Client Status"] || "Lead"
        const clientType = firstRow["Client Type"] || "Clinic"
        const email = firstRow["Primary Email"] || firstRow["Email"] || ""
        const phone = firstRow["Primary Phone"] || firstRow["Phone"] || ""
        const website = firstRow["Website"] || ""

        const billingAddress = {
          street1: firstRow["Billing Street 1"] || "",
          street2: firstRow["Billing Street 2"] || "",
          city: firstRow["Billing City"] || "",
          state: firstRow["Billing State"] || "",
          pincode: String(firstRow["Billing Pincode"] || ""),
          country: firstRow["Billing Country"] || "India"
        }

        const shippingAddress = {
          street1: firstRow["Shipping Street 1"] || "",
          street2: firstRow["Shipping Street 2"] || "",
          city: firstRow["Shipping City"] || "",
          state: firstRow["Shipping State"] || "",
          pincode: String(firstRow["Shipping Pincode"] || ""),
          country: firstRow["Shipping Country"] || "India"
        }

        const contacts: ClientContact[] = []
        const branches: ClientBranch[] = []

        rows.forEach((row: any) => {
          const cName = row["Contact Name"]
          if (cName) {
            contacts.push({
              id: Math.random().toString(36).substr(2, 9),
              name: cName,
              designation: row["Contact Designation"] || "",
              email: row["Contact Email"] || "",
              phone: String(row["Contact Phone"] || "")
            })
          }

          const bName = row["Branch Name"]
          if (bName) {
            const branchContacts: ClientContact[] = []
            const bcName = row["Branch Contact Name"]
            if (bcName) {
              branchContacts.push({
                id: Math.random().toString(36).substr(2, 9),
                name: bcName,
                designation: row["Branch Contact Designation"] || "",
                email: row["Branch Contact Email"] || "",
                phone: String(row["Branch Contact Phone"] || "")
              })
            }

            branches.push({
              id: Math.random().toString(36).substr(2, 9),
              name: bName,
              address: {
                street1: row["Branch Street 1"] || "",
                street2: row["Branch Street 2"] || "",
                city: row["Branch City"] || "",
                state: row["Branch State"] || "",
                pincode: String(row["Branch Pincode"] || ""),
                country: row["Branch Country"] || "India"
              },
              contacts: branchContacts
            })
          }
        })

        setPreviewData({
          client: { name: clientName, company: shortName, gstin, status: clientStatus, clientType, email, phone, website, billingAddress, shippingAddress },
          contacts,
          branches
        })
        toast.success("Client data parsed. Preview loaded successfully.")
      } catch (err) {
        console.error("Error parsing Excel:", err)
        toast.error("Failed to parse Excel file.")
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleImportApply = () => {
    if (!previewData) return
    setForm({
      ...previewData.client,
      contacts: previewData.contacts,
      branches: previewData.branches,
      hasBranches: previewData.branches.length > 0
    })
    setIsImportOpen(false)
    setPreviewData(null)
    toast.success("Excel details loaded into the client form.")
  }

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await apiClient.get<any>("/api/CountryMaster/GetAll")
        if (res.success && res.data) {
          setCountries(res.data)
        }
      } catch (e) {
        console.error("Failed to fetch countries", e)
      }
    }
    fetchCountries()
  }, [])

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

    const payload: CreateClientPayload = {
      clientId: client?.id ? (Number(client.id) || 0) : 0,
      name: (form.name || "").trim(),
      company: (form.company || form.name || "").trim(),
      contactPerson: (form.contactPerson || form.name || "").trim(),
      email: (form.email || "").trim(),
      phone: (form.phone || "").trim(),
      status: form.status || "Active",
      clientType: form.clientType || "Clinic",
      hasBranches: Boolean(form.hasBranches),
      gstin: (form.gstin || "").trim(),
      joinedDate: form.joinedDate
        ? (form.joinedDate.includes("T") ? form.joinedDate : new Date(form.joinedDate).toISOString())
        : new Date().toISOString(),
      instagramUrl: (form.instagramUrl || "").trim(),
      dateOfBirth: form.dateOfBirth
        ? (form.dateOfBirth.includes("T") ? form.dateOfBirth : new Date(form.dateOfBirth).toISOString())
        : null,
      billingAddress: {
        street1: (form.billingAddress?.street1 || "").trim(),
        street2: (form.billingAddress?.street2 || "").trim(),
        city: (form.billingAddress?.city || "").trim(),
        state: (form.billingAddress?.state || "").trim(),
        pincode: String(form.billingAddress?.pincode || "").trim(),
        country: (form.billingAddress?.country || "India").trim(),
      },
      shippingAddress: {
        street1: (form.shippingAddress?.street1 || "").trim(),
        street2: (form.shippingAddress?.street2 || "").trim(),
        city: (form.shippingAddress?.city || "").trim(),
        state: (form.shippingAddress?.state || "").trim(),
        pincode: String(form.shippingAddress?.pincode || "").trim(),
        country: (form.shippingAddress?.country || "India").trim(),
      },
      contacts: (form.contacts || []).map((c) => ({
        id: String(c.id || ""),
        name: (c.name || "").trim(),
        designation: (c.designation || "").trim(),
        email: (c.email || "").trim(),
        phone: String(c.phone || "").trim(),
      })),
      branches: (form.branches || []).map((b) => ({
        id: String(b.id || ""),
        name: (b.name || "").trim(),
        address: {
          street1: (b.address?.street1 || "").trim(),
          street2: (b.address?.street2 || "").trim(),
          city: (b.address?.city || "").trim(),
          state: (b.address?.state || "").trim(),
          pincode: String(b.address?.pincode || "").trim(),
          country: (b.address?.country || "India").trim(),
        },
        contacts: (b.contacts || []).map((bc) => ({
          id: String(bc.id || ""),
          name: (bc.name || "").trim(),
          designation: (bc.designation || "").trim(),
          email: (bc.email || "").trim(),
          phone: String(bc.phone || "").trim(),
        })),
      })),
    }

    try {
      if (!client) {
        // ── CREATE ──
        await clientsApi.create(payload)
        toast.success("Client created successfully")
      } else {
        // ── UPDATE ──
        await clientsApi.update(client.id, payload)
        toast.success("Client profile updated successfully")
      }

      onSave({ ...form, ...payload } as Partial<Client>)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 flex flex-row items-center justify-between pr-10">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {client ? "Edit Client Profile" : "Create New Client"}
          </DialogTitle>
          {!client && (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="gap-2">
              <UploadCloud className="h-4 w-4" /> Import Excel
            </Button>
          )}
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

              {form.clientType === "Doctor" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date" 
                      value={form.dateOfBirth ? form.dateOfBirth.split("T")[0] : ""} 
                      onChange={(e) => set("dateOfBirth", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram ID / URL</Label>
                    <Input 
                      id="instagramUrl" 
                      placeholder="e.g. dr.johndoe" 
                      value={form.instagramUrl ?? ""} 
                      onChange={(e) => set("instagramUrl", e.target.value)} 
                    />
                  </div>
                </div>
              )}

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
                              <Select value={branch.address?.country || "India"} onValueChange={(val) => setBranchAddress(branch.id, "country", val || "")}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Country" />
                                </SelectTrigger>
                                <SelectContent>
                                  {countries.length > 0 ? countries.map(c => (
                                    <SelectItem key={c.countryId} value={c.countryName}>{c.countryName}</SelectItem>
                                  )) : <SelectItem value="India">India</SelectItem>}
                                </SelectContent>
                              </Select>
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
                  <Select value={form.billingAddress?.country || "India"} onValueChange={(val) => setAddress("billing", "country", val || "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.length > 0 ? countries.map(c => (
                        <SelectItem key={c.countryId} value={c.countryName}>{c.countryName}</SelectItem>
                      )) : <SelectItem value="India">India</SelectItem>}
                    </SelectContent>
                  </Select>
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
                  <Select value={form.shippingAddress?.country || "India"} onValueChange={(val) => setAddress("shipping", "country", val || "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.length > 0 ? countries.map(c => (
                        <SelectItem key={c.countryId} value={c.countryName}>{c.countryName}</SelectItem>
                      )) : <SelectItem value="India">India</SelectItem>}
                    </SelectContent>
                  </Select>
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

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              Import Client & Profile Details via Excel
            </DialogTitle>
            <DialogDescription>
              Upload an Excel sheet to populate the client's information, contacts list, and branches list.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-y-auto pr-1 py-2 flex-1">
            <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-xl">
              <div className="grid gap-1">
                <p className="text-sm font-semibold">Step 1: Download Template</p>
                <p className="text-xs text-muted-foreground">Use our standardized template to format your client data correctly.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                Download Excel Template
              </Button>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-semibold">Step 2: Upload Excel File</p>
              <label className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 hover:bg-muted/10 transition-colors cursor-pointer border-muted-foreground/20">
                <UploadCloud className="h-8 w-8 text-muted-foreground/60" />
                <span className="text-sm font-medium">Click to upload or drag & drop</span>
                <span className="text-xs text-muted-foreground">Supports .xlsx and .xls formats</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) parseExcel(file)
                  }}
                />
              </label>
            </div>

            {previewData && (
              <div className="border rounded-xl p-4 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-sm text-slate-800">Preview Data</h3>
                  <div className="flex gap-2">
                    <span className="text-xs font-semibold text-primary">{previewData.contacts.length} Contacts</span>
                    <span className="text-xs font-semibold text-blue-600">{previewData.branches.length} Branches</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Client Name</p>
                    <p className="font-medium text-slate-700 mt-0.5">{previewData.client.name || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Short Name / Type</p>
                    <p className="font-medium text-slate-700 mt-0.5">{previewData.client.company || "-"} ({previewData.client.clientType})</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Email & Phone</p>
                    <p className="font-medium text-slate-700 mt-0.5 truncate">{previewData.client.email || "-"} / {previewData.client.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Website</p>
                    <p className="font-medium text-slate-700 mt-0.5 truncate">{previewData.client.website || "-"}</p>
                  </div>
                </div>

                {previewData.contacts.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contacts Preview</h4>
                    <div className="max-h-[140px] overflow-y-auto border rounded-lg bg-white">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 border-b">
                          <tr>
                            <th className="p-2 font-semibold text-slate-600">Contact Name</th>
                            <th className="p-2 font-semibold text-slate-600">Designation</th>
                            <th className="p-2 font-semibold text-slate-600">Email</th>
                            <th className="p-2 font-semibold text-slate-600">Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.contacts.map((c: any) => (
                            <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50">
                              <td className="p-2 text-slate-700 font-medium">{c.name}</td>
                              <td className="p-2 text-slate-500">{c.designation || "-"}</td>
                              <td className="p-2 text-slate-500">{c.email || "-"}</td>
                              <td className="p-2 text-slate-500 font-mono">{c.phone || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {previewData.branches.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Branches Preview</h4>
                    <div className="max-h-[140px] overflow-y-auto border rounded-lg bg-white">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 border-b">
                          <tr>
                            <th className="p-2 font-semibold text-slate-600">Branch Name</th>
                            <th className="p-2 font-semibold text-slate-600">City & State</th>
                            <th className="p-2 font-semibold text-slate-600">Branch Contact</th>
                            <th className="p-2 font-semibold text-slate-600">Email & Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.branches.map((b: any) => (
                            <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50/50">
                              <td className="p-2 text-slate-700 font-medium">{b.name}</td>
                              <td className="p-2 text-slate-500">{b.address.city || "-"}, {b.address.state || "-"}</td>
                              <td className="p-2 text-slate-500">{b.contacts[0]?.name || "-"} ({b.contacts[0]?.designation || "-"})</td>
                              <td className="p-2 text-slate-500 truncate">{b.contacts[0]?.email || "-"} / {b.contacts[0]?.phone || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsImportOpen(false); setPreviewData(null); }}>
              Close
            </Button>
            <Button type="button" disabled={!previewData} onClick={handleImportApply} className="px-6 font-semibold">
              Apply to Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
