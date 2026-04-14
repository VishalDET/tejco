import React, { useState, useEffect } from "react"
import { Warehouse } from "./types"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface WarehouseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warehouse?: Warehouse | null
  onSave: (warehouse: Partial<Warehouse>) => Promise<void>
}

export function WarehouseFormDialog({ open, onOpenChange, warehouse, onSave }: WarehouseFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Warehouse>>({
    name: "",
    address: "",
    contactPerson: "",
    contactNumber: "",
    status: "Active",
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (warehouse) {
      setFormData(warehouse)
    } else {
      setFormData({
        name: "",
        address: "",
        contactPerson: "",
        contactNumber: "",
        status: "Active",
      })
    }
  }, [warehouse, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: Warehouse["status"] | null) => {
    if (value) {
      setFormData((prev) => ({ ...prev, status: value }))
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{warehouse ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
          <DialogDescription>
            {warehouse
              ? "Update the warehouse details and status here."
              : "Enter the details of the new warehouse location."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Warehouse Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Central Warehouse"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="Warehouse Manager"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Full address of the warehouse..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {warehouse ? "Update Warehouse" : "Add Warehouse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
