"use client"

import React, { useState, useEffect } from "react"
import { Warehouse, WarehouseAddress, Rack, Shelf } from "./types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Loader2,
  MapPin,
  Boxes,
  LayoutGrid,
  Info,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  Settings2,
  ChevronRight,
  MoreVertical,
  Type
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"

interface WarehouseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouse?: Warehouse | null
  onSave: (warehouse: Partial<Warehouse>) => Promise<void>
}

const DEFAULT_ADDRESS: WarehouseAddress = {
  street: "",
  city: "",
  state: "",
  pincode: "",
  country: "India"
}

export function WarehouseFormDialog({ open, onOpenChange, warehouse, onSave }: WarehouseFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Warehouse>>({
    name: "",
    address: DEFAULT_ADDRESS,
    contactPerson: "",
    contactNumber: "",
    status: "Active",
    racks: []
  })

  const [bulkConfig, setBulkConfig] = useState({ racks: 0, shelves: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    if (warehouse) {
      setFormData({
        ...warehouse,
        address: warehouse.address || DEFAULT_ADDRESS,
        racks: warehouse.racks || []
      })
    } else {
      setFormData({
        name: "",
        address: DEFAULT_ADDRESS,
        contactPerson: "",
        contactNumber: "",
        status: "Active",
        racks: []
      })
    }
  }, [warehouse, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      address: {
        ...(prev.address as WarehouseAddress),
        [name]: value
      }
    }))
  }

  const handleStatusChange = (value: Warehouse["status"] | null) => {
    if (value) {
      setFormData((prev) => ({ ...prev, status: value }))
    }
  }

  // Infrastructure Management
  const addRack = () => {
    const newRack: Rack = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Rack ${formData.racks!.length + 1}`,
      location: "",
      shelves: []
    }
    setFormData(prev => ({ ...prev, racks: [...(prev.racks || []), newRack] }))
  }

  const updateRack = (rackId: string, updates: Partial<Rack>) => {
    setFormData(prev => ({
      ...prev,
      racks: prev.racks?.map(r => r.id === rackId ? { ...r, ...updates } : r)
    }))
  }

  const removeRack = (rackId: string) => {
    setFormData(prev => ({
      ...prev,
      racks: prev.racks?.filter(r => r.id !== rackId)
    }))
  }

  const addShelf = (rackId: string) => {
    setFormData(prev => ({
      ...prev,
      racks: prev.racks?.map(r => {
        if (r.id === rackId) {
          const newShelf: Shelf = {
            id: Math.random().toString(36).substring(2, 9),
            name: `Shelf ${r.shelves.length + 1}`,
            code: `${r.name.split(' ')[1] || r.name[0]}-S${r.shelves.length + 1}`
          }
          return { ...r, shelves: [...r.shelves, newShelf] }
        }
        return r
      })
    }))
  }

  const updateShelf = (rackId: string, shelfId: string, updates: Partial<Shelf>) => {
    setFormData(prev => ({
      ...prev,
      racks: prev.racks?.map(r => {
        if (r.id === rackId) {
          return {
            ...r,
            shelves: r.shelves.map(s => s.id === shelfId ? { ...s, ...updates } : s)
          }
        }
        return r
      })
    }))
  }

  const removeShelf = (rackId: string, shelfId: string) => {
    setFormData(prev => ({
      ...prev,
      racks: prev.racks?.map(r => {
        if (r.id === rackId) {
          return {
            ...r,
            shelves: r.shelves.filter(s => s.id !== shelfId)
          }
        }
        return r
      })
    }))
  }

  const bulkGenerate = () => {
    const newRacks: Rack[] = Array.from({ length: bulkConfig.racks }).map((_, rIdx) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: `Rack ${rIdx + 1}`,
      location: `Aisle ${Math.ceil((rIdx + 1) / 2)}`,
      shelves: Array.from({ length: bulkConfig.shelves }).map((_, sIdx) => ({
        id: Math.random().toString(36).substring(2, 9),
        name: `Shelf ${sIdx + 1}`,
        code: `R${rIdx + 1}-S${sIdx + 1}`
      }))
    }))
    setFormData(prev => ({ ...prev, racks: newRacks }))
  }

  const handleSave = async () => {
    if (!formData.name) return
    setIsSaving(true)
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving warehouse:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const totalCapacity = formData.racks?.reduce((sum, rack) => sum + rack.shelves.length, 0) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {warehouse ? <Settings2 className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
            {warehouse ? "Edit Warehouse Master" : "Initialize New Warehouse"}
          </DialogTitle>
          <DialogDescription>
            Configure granular infrastructure, naming conventions, and location mapping.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start h-12 bg-transparent gap-6 rounded-none p-0">
              <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full bg-transparent shadow-none font-bold">
                General
              </TabsTrigger>
              <TabsTrigger value="address" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full bg-transparent shadow-none font-bold">
                Location
              </TabsTrigger>
              <TabsTrigger value="infrastructure" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full bg-transparent shadow-none font-bold">
                Infrastructure
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[60vh]">
            <div className="p-6">
              <TabsContent value="general" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Warehouse Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Main Hub Mumbai" className="font-bold" />
                  </div>
                  <div className="space-y-2 text-sm font-medium">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hub Manager</Label>
                    <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency Phone</Label>
                    <Input id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="+91..." />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Status</Label>
                    <Select value={formData.status} onValueChange={handleStatusChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active (Full Access)</SelectItem>
                        <SelectItem value="Inactive">Inactive (Locked)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="address" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Street / Industrial Estate</Label>
                    <Input name="street" value={formData.address?.street} onChange={handleAddressChange} placeholder="e.g. Unit 402, Building 7" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">City</Label>
                    <Input name="city" value={formData.address?.city} onChange={handleAddressChange} placeholder="e.g. Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">State</Label>
                    <Input name="state" value={formData.address?.state} onChange={handleAddressChange} placeholder="e.g. Maharashtra" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pincode</Label>
                    <Input name="pincode" value={formData.address?.pincode} onChange={handleAddressChange} placeholder="e.g. 400001" />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 border rounded-xl flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-slate-700 font-mono text-[10px] uppercase tracking-widest opacity-60">Location Preview</p>
                    <p className="text-slate-500 italic text-[11px] font-medium leading-relaxed">
                      {formData.address?.street}, {formData.address?.city}, {formData.address?.state} - {formData.address?.pincode}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="infrastructure" className="mt-0 space-y-8">
                {/* Bulk Generator Section */}
                <Card className="p-4 bg-slate-50/50 border-dashed border-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Bulk Infrastructure Generator</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-bold">Fast Setup</Badge>
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase">Racks</Label>
                        <Input type="number" value={bulkConfig.racks} onChange={e => setBulkConfig(prev => ({ ...prev, racks: parseInt(e.target.value) || 0 }))} className="h-8" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-bold text-slate-400 uppercase">Shelves/Rack</Label>
                        <Input type="number" value={bulkConfig.shelves} onChange={e => setBulkConfig(prev => ({ ...prev, shelves: parseInt(e.target.value) || 0 }))} className="h-8" />
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={bulkGenerate} className="h-8 gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                      Initialize Template
                    </Button>
                  </div>
                </Card>

                {/* Granular Rack Management */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      Active Layout <Badge className="bg-primary/10 text-primary border-none">{formData.racks?.length} Racks</Badge>
                    </h3>
                    <Button size="sm" onClick={addRack} className="h-8 px-3 gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Add Individual Rack
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.racks?.map((rack, rIdx) => (
                      <Card key={rack.id} className="overflow-hidden border-slate-200 shadow-sm transition-all hover:border-primary/30 py-0">
                        <div className="p-4 bg-slate-50/80 border-b flex items-center justify-between gap-4">
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="relative group">
                              <Input
                                value={rack.name}
                                onChange={e => updateRack(rack.id, { name: e.target.value })}
                                className="h-8 pl-8 font-bold text-slate-800 bg-transparent border-transparent hover:border-slate-200 focus:bg-white transition-all underline decoration-dotted decoration-slate-300 underline-offset-4"
                                placeholder="Rack Name"
                              />
                              <Type className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            </div>
                            <div className="relative group">
                              <Input
                                value={rack.location}
                                onChange={e => updateRack(rack.id, { location: e.target.value })}
                                className="h-8 pl-8 text-xs text-slate-500 bg-transparent border-transparent hover:border-slate-200 focus:bg-white transition-all italic"
                                placeholder="Location Description (e.g. Aisle 1)"
                              />
                              <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeRack(rack.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="p-4 bg-white space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {rack.shelves.map((shelf, sIdx) => (
                              <div key={shelf.id} className="group relative bg-slate-50 rounded-lg p-2 border border-slate-100 transition-all hover:bg-white hover:border-primary/20 hover:shadow-sm">
                                <div className="flex flex-col gap-1.5">
                                  <Input
                                    value={shelf.name}
                                    onChange={e => updateShelf(rack.id, shelf.id, { name: e.target.value })}
                                    className="h-6 text-[10px] font-bold p-1 bg-transparent border-none focus:ring-0 text-slate-600"
                                  />
                                  <div className="flex items-center justify-between gap-1 mt-1">
                                    <Badge variant="outline" className="text-[9px] font-bold h-4 px-1 bg-white border-slate-200 uppercase tracking-tighter text-slate-400">
                                      {shelf.code}
                                    </Badge>
                                    <button onClick={() => removeShelf(rack.id, shelf.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => addShelf(rack.id)}
                              className="border border-dashed rounded-lg p-2 flex flex-col items-center justify-center gap-1 hover:bg-primary/5 hover:border-primary/30 transition-all group min-h-[50px]"
                            >
                              <Plus className="h-4 w-4 text-slate-300 group-hover:text-primary" />
                              <span className="text-[9px] font-bold text-slate-400 group-hover:text-primary uppercase tracking-widest">Add Shelf</span>
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {formData.racks?.length === 0 && (
                    <div className="py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center px-6">
                      <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                        <LayoutGrid className="h-8 w-8 text-slate-200" />
                      </div>
                      <h4 className="font-bold text-slate-800">Empty Grid Structure</h4>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">Start by initializing a bulk template or manually adding unique racks below.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <Separator />

        <DialogFooter className="p-6 bg-slate-50/50 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Hub Capacity</span>
              <span className="text-lg font-black text-slate-900 leading-tight">{totalCapacity} <span className="text-[10px] text-primary/60">BINS</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="border-slate-200 px-6">
              Discard Changes
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || isSaving} className="gap-2 shadow-lg shadow-primary/20 px-6">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {warehouse ? "Synchronize Updates" : "Commit New Hub"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
