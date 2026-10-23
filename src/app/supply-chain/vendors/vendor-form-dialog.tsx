import React, { useState, useEffect } from "react"
import { Vendor } from "./types"
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

interface VendorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor | null
  onSave: (vendor: Vendor) => void
}

export function VendorFormDialog({ open, onOpenChange, vendor, onSave }: VendorFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: "",
    vendorName: "",
    contactPerson: "",
    contactPersonName: "",
    email: "",
    phone: "",
    mobileNumber: "",
    address: "",
    gstin: "",
    vendorPrefix: "",
    status: "Active",
  })

  useEffect(() => {
    if (vendor) {
      setFormData({
        ...vendor,
        name: vendor.vendorName || vendor.name || "",
        vendorName: vendor.vendorName || vendor.name || "",
        contactPerson: vendor.contactPersonName || vendor.contactPerson || "",
        contactPersonName: vendor.contactPersonName || vendor.contactPerson || "",
        phone: vendor.mobileNumber || vendor.phone || "",
        mobileNumber: vendor.mobileNumber || vendor.phone || "",
        vendorPrefix: vendor.vendorPrefix || "",
        address: vendor.address || "",
        gstin: vendor.gstin || "",
        email: vendor.email || "",
        status: vendor.status || "Active",
      })
    } else {
      setFormData({
        name: "",
        vendorName: "",
        contactPerson: "",
        contactPersonName: "",
        email: "",
        phone: "",
        mobileNumber: "",
        address: "",
        gstin: "",
        vendorPrefix: "",
        status: "Active",
      })
    }
  }, [vendor, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" ? { vendorName: value } : {}),
      ...(name === "contactPerson" ? { contactPersonName: value } : {}),
      ...(name === "phone" ? { mobileNumber: value } : {}),
      ...(name === "vendorPrefix" ? { vendorPrefix: value.toUpperCase() } : {}),
    }))
  }

  const handleStatusChange = (value: string | null) => {
    if (value) {
      setFormData((prev) => ({ ...prev, status: value as "Active" | "Inactive" }))
    }
  }

  const handleSave = () => {
    const vName = (formData.vendorName || formData.name || "").trim()
    const cPerson = (formData.contactPersonName || formData.contactPerson || "").trim()
    const phone = (formData.mobileNumber || formData.phone || "").trim()
    const prefix = (formData.vendorPrefix || "").trim()

    const savedVendor: Vendor = {
      id: vendor?.id || "0",
      vendorId: Number(vendor?.vendorId || vendor?.id || 0),
      name: vName,
      vendorName: vName,
      contactPerson: cPerson,
      contactPersonName: cPerson,
      email: (formData.email || "").trim(),
      phone: phone,
      mobileNumber: phone,
      address: (formData.address || "").trim(),
      gstin: (formData.gstin || "").trim().toUpperCase(),
      vendorPrefix: prefix || null,
      status: (formData.status as "Active" | "Inactive") || "Active",
      products: vendor?.products || [],
      purchaseHistory: vendor?.purchaseHistory || [],
      payments: vendor?.payments || [],
    }
    onSave(savedVendor)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
          <DialogDescription>
            {vendor
              ? "Update the vendor's basic, contact, and business details."
              : "Enter the details of the new vendor to add them to the system."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || formData.vendorName || ""}
                onChange={handleChange}
                placeholder="Adequate Electro Mechanical..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendorPrefix">Vendor Prefix (e.g. TEJ, AEM)</Label>
              <Input
                id="vendorPrefix"
                name="vendorPrefix"
                value={formData.vendorPrefix || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, vendorPrefix: e.target.value.toUpperCase() }))}
                placeholder="e.g. AEM"
                maxLength={8}
                className="font-mono uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Contact Person Name</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson || formData.contactPersonName || ""}
                onChange={handleChange}
                placeholder="Mr Imran"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                name="gstin"
                value={formData.gstin || ""}
                onChange={handleChange}
                placeholder="08AATCA5431B1ZS"
                className="font-mono uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || formData.mobileNumber || ""}
                onChange={handleChange}
                placeholder="87699 99994"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="imran@adequate.com"
              />
            </div>
            <div className="grid gap-2 col-span-2">
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
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              placeholder="G-184, Akeda Dungar, Road no. 18, Vishwakarma industrial area, Jaipur"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!(formData.name || formData.vendorName)}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
